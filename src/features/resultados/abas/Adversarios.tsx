"use client";
import React, { useMemo, useState } from "react";
import { carregarAdversarios, carregarBairros, carregarMapa, carregarUf, n, t, temBairros, useRecurso, type Linha, type Resumo } from "../dados";
import { num, pct, titulo, UF_IBGE } from "../formato";
import { MapaCoropletico } from "../graficos";
import { Carregando, Chips, Escolha, Filtros, Kpis, Nota, Secao, SeletorUf, Tabela } from "../pecas";
import { NOME_CARGO, ladoTexto, pontos } from "../apoio";
import type { DadosAdversarios } from "../dados";

/**
 * Adversários: de quem o Missão pode herdar voto. A mesma pessoa em 2022, 2024
 * e 2026 (casada pelo título de eleitor no projeto de análise), quem caiu e
 * onde, quem saiu, quem ficou sem mandato, e para onde cada cidade andou.
 */

const GRUPOS_FILTRO = ["todos", "Direita", "Centro/Centro-Direita", "Esquerda", "Missão"] as const;
const CARGOS_FILTRO = ["todos", "df", "de", "gov", "sen"] as const;

export default function Adversarios({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const disponiveis = resumo.bairrosUfs ?? [];
  const ufOk = disponiveis.includes(uf) ? uf : disponiveis[0] ?? uf;
  const adv = useRecurso(disponiveis.length ? ufOk : null, carregarAdversarios);
  const dadosUf = useRecurso(ufOk, carregarUf);
  const mapa = useRecurso(ufOk, carregarMapa);
  const [grupo, setGrupo] = useState<(typeof GRUPOS_FILTRO)[number]>("Direita");
  const [cargo, setCargo] = useState<(typeof CARGOS_FILTRO)[number]>("todos");

  const cidades = useMemo(() => dadosUf.dado?.cidades ?? [], [dadosUf.dado]);
  const nomeCidade = useMemo(() => {
    const m = new Map(cidades.map((c) => [String(c.municipio_codigo), titulo(t(c, "municipio_nome"))]));
    return (cod: unknown) => m.get(String(cod)) ?? String(cod ?? "");
  }, [cidades]);

  const pessoas = useMemo(() => {
    const todas = adv.dado?.pessoas ?? [];
    return todas.filter((p) => {
      const g = t(p, "grupo_atual");
      const c = t(p, "cargo_key") || t(p, "cargo_key_22");
      return (grupo === "todos" || g === grupo) && (cargo === "todos" || c === cargo);
    });
  }, [adv.dado, grupo, cargo]);

  if (!disponiveis.length) return <Nota>A leitura dos adversários sai junto com o recorte por bairro, que ainda não foi gerado.</Nota>;
  if (!adv.dado) return <Carregando erro={adv.erro} />;

  const emQueda = pessoas.filter((p) => p.status === "Em queda");
  const sairam = pessoas.filter((p) => p.status === "Saiu" || p.status === "Foi para 2024");
  const orfaos = pessoas.filter((p) => p.orfao === true);
  const soma = (ls: Linha[], c: string) => ls.reduce((s, l) => s + Math.abs(n(l, c) || 0), 0);
  const cidadesTempo = adv.dado.cidades.map((c) => ({ ...c, nome: nomeCidade(c.municipio_codigo), lado_txt: ladoTexto(n(c, "lado_pres")) })) as Linha[];
  const andaram = cidadesTempo.filter((c) => n(c, "var_lado_pres") > 0).length;

  const fragilidade = pessoas.filter((p) => n(p, "votos") > 0 && n(p, "sinais") >= 1);

  /* mapa: andou para a direita (pontos), pelo código IBGE da cidade */
  const ibge = new Map(cidades.map((c) => [String(c.municipio_codigo), String(c.codigo_ibge)]));
  const valoresMapa: Record<string, number> = {};
  const rotulosMapa: Record<string, string> = {};
  for (const c of cidadesTempo) {
    const cod = ibge.get(String(c.municipio_codigo));
    if (!cod) continue;
    valoresMapa[cod] = n(c, "var_lado_pres") * 100;
    rotulosMapa[cod] = `${t(c, "nome")}: andou ${pontos(n(c, "var_lado_pres"))} para a direita · 2022 ${pontos(n(c, "lado_pres_22"))} → 2026 ${pontos(n(c, "lado_pres"))}`;
  }

  return (
    <>
      <Nota>
        Quem está perdendo voto, quem saiu e quem ficou sem mandato — e onde. É daqui que vem o eleitor mais fácil de trazer: ele já votou na direita, só perdeu
        o nome. A pessoa é a mesma nos três anos (reconhecida pelo título de eleitor, não pelo nome).
      </Nota>
      <Filtros>
        <SeletorUf uf={ufOk} opcoes={disponiveis} aoMudar={setUf} />
      </Filtros>
      <Chips valor={grupo} opcoes={[...GRUPOS_FILTRO]} aoMudar={setGrupo} nome={(g) => (g === "todos" ? "Todos os grupos" : g)} />
      <Chips valor={cargo} opcoes={[...CARGOS_FILTRO]} aoMudar={setCargo} nome={(c) => (c === "todos" ? "Todos os cargos" : NOME_CARGO[c])} />

      <Kpis
        itens={[
          { rotulo: "Em queda", valor: num(emQueda.length), sub: `${num(soma(emQueda, "var_votos"))} votos perdidos desde 2022` },
          { rotulo: "Saíram", valor: num(sairam.length), sub: `${num(soma(sairam, "votos_22"))} votos em 2022 sem nome agora` },
          { rotulo: "Votos órfãos", valor: num(soma(orfaos, "votos")), sub: `${num(orfaos.length)} candidatos a deputado não eleitos`, missao: true },
          { rotulo: "Cidades que andaram à direita", valor: `${num(andaram)} de ${num(cidadesTempo.length)}`, sub: "Presidente, 2022 → 2026" },
        ]}
      />

      <Ficha dados={adv.dado} pessoas={pessoas} nomeCidade={nomeCidade} />

      <Secao titulo="Quem pode desidratar mais" sub="Candidatos de 2026 com pelo menos um sinal, do mais frágil para o menos. Abra a ficha acima para ver quais sinais e onde." explica="desidratar">
        <Tabela
          linhas={fragilidade}
          ordem="sinais"
          arquivo={`desidratar-${ufOk}`}
          colunas={[
            { chave: "nome", rotulo: "Candidato", tipo: "txt" },
            { chave: "partido", rotulo: "Partido 22 → 26", tipo: "txt", valor: (l) => partidos(l) },
            { chave: "cargo_key", rotulo: "Cargo", tipo: "txt", valor: (l) => NOME_CARGO[t(l, "cargo_key")] ?? "" },
            { chave: "votos", rotulo: "Votos 2026" },
            { chave: "sinais", rotulo: "Sinais" },
            { chave: "quais", rotulo: "Quais", tipo: "txt", valor: (l) => sinaisDe(l).map(([, curto]) => curto).join(" · ") },
            { chave: "situacao", rotulo: "Situação", tipo: "txt" },
          ]}
        />
      </Secao>

      <Secao titulo="Em queda" sub="Mesmo cargo em 2022 e 2026, com menos voto agora. Escolha um nome para ver em que cidades ele perdeu." explica="em-queda">
        <Tabela
          linhas={emQueda}
          ordem="perdeu"
          arquivo={`em-queda-${ufOk}`}
          colunas={[
            { chave: "nome", rotulo: "Candidato", tipo: "txt" },
            { chave: "partido", rotulo: "Partido 22 → 26", tipo: "txt", valor: (l) => partidos(l) },
            { chave: "cargo_key", rotulo: "Cargo", tipo: "txt", valor: (l) => NOME_CARGO[t(l, "cargo_key")] ?? "" },
            { chave: "votos_22", rotulo: "Votos 2022" },
            { chave: "votos", rotulo: "Votos 2026" },
            { chave: "perdeu", rotulo: "Perdeu", valor: (l) => -n(l, "var_votos") },
            { chave: "var_pct", rotulo: "Variação", tipo: "pct" },
            { chave: "situacao", rotulo: "Situação 2026", tipo: "txt" },
            { chave: "sinais", rotulo: "Sinais", ajuda: "sinais de desidratação (0 a 6) — ver a ficha" },
          ]}
        />
      </Secao>

      <Secao titulo="Saíram" sub="Tiveram voto em 2022 e não concorreram em 2026. Quem foi para a prefeitura em 2024 aparece com o voto de lá." explica="saiu">
        <Tabela
          linhas={sairam}
          ordem="votos_22"
          arquivo={`sairam-${ufOk}`}
          colunas={[
            { chave: "nome", rotulo: "Nome", tipo: "txt" },
            { chave: "partido_sigla_22", rotulo: "Partido 2022", tipo: "txt" },
            { chave: "cargo_key_22", rotulo: "Cargo 2022", tipo: "txt", valor: (l) => NOME_CARGO[t(l, "cargo_key_22")] ?? "" },
            { chave: "votos_22", rotulo: "Votos 2022" },
            { chave: "situacao_22", rotulo: "Situação 2022", tipo: "txt" },
            { chave: "em2024", rotulo: "Em 2024", tipo: "txt", valor: (l) => (t(l, "cargo_key_24") ? `${NOME_CARGO[t(l, "cargo_key_24")]} em ${nomeCidade(l.municipio_codigo_24)}: ${num(n(l, "votos_24"))} votos (${t(l, "situacao_24").toLowerCase()})` : "") },
          ]}
        />
      </Secao>

      <Secao titulo="Votos órfãos" sub="Candidatos a deputado de Direita e Centro que não se elegeram em 2026: voto de direita sem representante, e gente com voto para 2028." explica="orfaos">
        <Tabela
          linhas={orfaos}
          ordem="votos"
          arquivo={`orfaos-${ufOk}`}
          colunas={[
            { chave: "nome", rotulo: "Candidato", tipo: "txt" },
            { chave: "numero", rotulo: "Nº", tipo: "txt" },
            { chave: "partido_sigla", rotulo: "Partido", tipo: "txt" },
            { chave: "cargo_key", rotulo: "Cargo", tipo: "txt", valor: (l) => NOME_CARGO[t(l, "cargo_key")] ?? "" },
            { chave: "votos", rotulo: "Votos 2026" },
            { chave: "pct_uf", rotulo: "% no estado", tipo: "pct" },
            { chave: "situacao", rotulo: "Situação", tipo: "txt" },
            { chave: "votos_22", rotulo: "Votos 2022" },
            { chave: "sinais", rotulo: "Sinais" },
            { chave: "vereador", rotulo: "2024", tipo: "txt", valor: (l) => (t(l, "cargo_key_24") ? `${NOME_CARGO[t(l, "cargo_key_24")]} em ${nomeCidade(l.municipio_codigo_24)} (${t(l, "situacao_24").toLowerCase()})` : "") },
          ]}
        />
      </Secao>

      <Fracos uf={ufOk} cidades={cidades.filter((c) => temBairros(resumo, ufOk, c))} />

      <Secao titulo="Partidos: 2022 → 2026" sub="Votos nominais no estado. Vereador 2024 = soma das cidades." explica="partidos-tempo">
        <Tabela
          linhas={adv.dado.partidos}
          ordem="de"
          arquivo={`partidos-${ufOk}`}
          colunas={[
            { chave: "partido_sigla", rotulo: "Partido", tipo: "txt" },
            { chave: "grupo", rotulo: "Grupo", tipo: "txt" },
            { chave: "df_22", rotulo: "Fed. 2022" },
            { chave: "df", rotulo: "Fed. 2026" },
            { chave: "var_df", rotulo: "Fed. Δ" },
            { chave: "de_22", rotulo: "Est. 2022" },
            { chave: "de", rotulo: "Est. 2026" },
            { chave: "var_de", rotulo: "Est. Δ" },
            { chave: "ver_24", rotulo: "Vereador 2024" },
          ]}
        />
      </Secao>

      <Secao titulo="Para onde cada cidade andou" sub="Pende para (Presidente) em 2022 e em 2026. Mais escuro = andou mais para a direita." explica="cidades-tempo">
        <MapaCoropletico mapa={mapa.dado} valores={valoresMapa} rotulos={rotulosMapa} formato={(x) => `${num(x, 0)} pts`} />
        <Tabela
          linhas={cidadesTempo}
          ordem="eleitorado"
          arquivo={`cidades-tempo-${ufOk}`}
          colunas={[
            { chave: "nome", rotulo: "Cidade", tipo: "txt" },
            { chave: "eleitorado", rotulo: "Eleitores" },
            { chave: "lado_txt", rotulo: "Pende para", tipo: "txt" },
            { chave: "lado_pres_22", rotulo: "2022", tipo: "dec", valor: (l) => n(l, "lado_pres_22") * 100 },
            { chave: "lado_pres", rotulo: "2026", tipo: "dec", valor: (l) => n(l, "lado_pres") * 100 },
            { chave: "var_lado_pres", rotulo: "Andou", tipo: "dec", valor: (l) => n(l, "var_lado_pres") * 100 },
            { chave: "lado_rel_pres", rotulo: "vs. estado", tipo: "dec", valor: (l) => n(l, "lado_rel_pres") * 100 },
            { chave: "lado_ver_24", rotulo: "Vereador 2024", tipo: "dec", valor: (l) => n(l, "lado_ver_24") * 100 },
          ]}
        />
        <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0" }}>
          Valores em pontos, de −100 (todo mundo na esquerda) a +100 (todo mundo na direita). Mapa do estado: {UF_IBGE[ufOk] ? "malha do IBGE" : "—"}.
        </p>
      </Secao>
    </>
  );
}

const partidos = (l: Linha) => {
  const a = t(l, "partido_sigla_22");
  const b = t(l, "partido_sigla");
  return a && b && a !== b ? `${a} → ${b}` : b || a;
};

/**
 * Fracos onde a direita é forte: na cidade escolhida, bairros mais à direita que
 * o estado onde um candidato de Direita/Centro forte no estado vai mal (força < 0,5).
 */
function Fracos({ uf, cidades }: { uf: string; cidades: Linha[] }) {
  const maiores = useMemo(() => [...cidades].sort((a, b) => n(b, "eleitorado") - n(a, "eleitorado")).slice(0, 60), [cidades]);
  const [codigo, setCodigo] = useState("");
  const cod = codigo || String(maiores[0]?.municipio_codigo ?? "");
  const dados = useRecurso(cod ? `${uf}/${cod}` : null, carregarBairros);

  const linhas = useMemo(() => {
    const d = dados.dado;
    if (!d) return [];
    return d.fracos.map((f) => {
      const b = d.bairros[f.b];
      const p = d.pessoas[f.p];
      return { bairro: t(b, "bairro"), lado: n(b, "lado_rel_pres"), nome: t(p, "nome"), partido: t(p, "partido_sigla"), cargo: NOME_CARGO[t(p, "cargo_key")], votos: f.votos, forca: f.forca, pct_uf: n(p, "pct_uf") } as Linha;
    });
  }, [dados.dado]);

  return (
    <Secao titulo="Fracos onde a direita é forte" sub="Bairros mais à direita que o estado, onde um nome forte da direita no estado vai mal. É terreno que aceita a direita e que o nome dominante não alcançou." explica="fracos">
      <Escolha
        rotulo="Cidade"
        valor={cod}
        opcoes={maiores.map((c) => String(c.municipio_codigo))}
        aoMudar={setCodigo}
        nome={(c) => titulo(t(maiores.find((x) => String(x.municipio_codigo) === c), "municipio_nome"))}
      />
      {!dados.dado ? (
        <Carregando erro={dados.erro} />
      ) : (
        <Tabela
          linhas={linhas}
          ordem="pct_uf"
          colunas={[
            { chave: "bairro", rotulo: "Bairro", tipo: "txt" },
            { chave: "lado", rotulo: "vs. estado", tipo: "dec", valor: (l) => n(l, "lado") * 100 },
            { chave: "nome", rotulo: "Candidato", tipo: "txt" },
            { chave: "partido", rotulo: "Partido", tipo: "txt" },
            { chave: "cargo", rotulo: "Cargo", tipo: "txt" },
            { chave: "votos", rotulo: "Votos no bairro" },
            { chave: "forca", rotulo: "Força", tipo: "dec" },
            { chave: "pct_uf", rotulo: "% no estado", tipo: "pct" },
          ]}
        />
      )}
      <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0" }}>
        Testados os 10 nomes de Direita e Centro mais votados no estado para cada cargo de deputado, em todo bairro com 2 mil eleitores ou mais. Força = % no
        bairro ÷ % no estado.
      </p>
    </Secao>
  );
}

/* ===== Ficha do adversário ===== */

const SINAIS: [string, string, string][] = [
  ["s_queda", "caiu desde 2022", "Perdeu voto desde 2022 no mesmo cargo"],
  ["s_base", "caiu na base", "Perdeu mais de 20% na cidade onde era mais forte em 2022"],
  ["s_sem_mandato", "sem mandato", "Não se elegeu em 2026"],
  ["s_partido", "trocou de partido", "Trocou de partido desde 2022"],
  ["s_concentrado", "voto concentrado", "Metade ou mais dos votos numa cidade só"],
  ["s_base_virou", "base virou", "A cidade-base andou para o lado oposto ao dele desde 2022"],
];

/** [chave, curto, longo] dos sinais acesos da pessoa. */
const sinaisDe = (p: Linha) => SINAIS.filter(([k]) => p[k] === true).map(([k, curto, longo]) => [k, curto, longo] as const);

function Ficha({ dados, pessoas, nomeCidade }: { dados: DadosAdversarios; pessoas: Linha[]; nomeCidade: (c: unknown) => string }) {
  const [quem, setQuem] = useState("");
  const opcoes = useMemo(
    () => [...pessoas].sort((a, b) => Math.max(n(b, "votos") || 0, n(b, "votos_22") || 0) - Math.max(n(a, "votos") || 0, n(a, "votos_22") || 0)).slice(0, 300),
    [pessoas],
  );
  const id = quem || String(opcoes[0]?.id ?? "");
  const p = dados.pessoas.find((x) => String(x.id) === id);
  if (!p) return null;

  const cidadesDele = dados.cidadesPessoa.filter((c) => String(c.id) === id).map((c) => ({ ...c, cidade: nomeCidade(c.municipio_codigo), var: n(c, "votos") - n(c, "votos_22") }) as Linha);
  const perdas = dados.quedasCidade.filter((q) => String(q.id) === id).map((q) => ({ ...q, cidade: nomeCidade(q.municipio_codigo) }) as Linha);
  const temas = dados.temas.filter((x) => String(x.id) === id);
  const projetos = dados.projetos.filter((x) => String(x.id) === id);
  const acesos = sinaisDe(p);
  const ano = (suf: string, rotulo: string) => {
    const v = n(p, `votos${suf}`);
    if (!Number.isFinite(v)) return null;
    const cargoAno = NOME_CARGO[t(p, `cargo_key${suf}`)] ?? "";
    const onde = suf === "_24" ? ` em ${nomeCidade(p.municipio_codigo_24)}` : "";
    return { rotulo, valor: num(v), sub: `${cargoAno}${onde} · ${t(p, `partido_sigla${suf}`) || ""} · ${t(p, `situacao${suf}`).toLowerCase()}` };
  };

  return (
    <Secao titulo="Ficha do adversário" sub="Escolha qualquer nome com voto no estado (os de mais voto primeiro; os filtros de grupo e cargo acima valem aqui)." explica="desidratar">
      <Escolha
        rotulo="Adversário"
        valor={id}
        opcoes={opcoes.map((x) => String(x.id))}
        aoMudar={setQuem}
        nome={(k) => {
          const x = opcoes.find((o) => String(o.id) === k);
          return `${t(x, "nome")} (${t(x, "partido_sigla") || t(x, "partido_sigla_22")}) — ${t(x, "status")}`;
        }}
      />
      <Kpis
        itens={[
          ano("_22", "2022"),
          ano("_24", "2024"),
          ano("", "2026"),
          { rotulo: "Variação no mesmo cargo", valor: Number.isFinite(n(p, "var_votos")) ? num(n(p, "var_votos")) : "—", sub: Number.isFinite(n(p, "var_pct")) ? pct(n(p, "var_pct")) : t(p, "status") },
          { rotulo: "Sinais de desidratação", valor: `${num(n(p, "sinais") || 0)} de 6`, missao: n(p, "sinais") >= 3 },
        ].filter(Boolean) as { rotulo: string; valor: string; sub?: string; missao?: boolean }[]}
      />
      <ul style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 15, lineHeight: 1.5 }}>
        {SINAIS.map(([k, , longo]) => {
          const aceso = p[k] === true;
          return (
            <li key={k} style={{ opacity: aceso ? 1 : 0.55, fontWeight: aceso ? 700 : 400 }}>
              {aceso ? "Sim" : "Não"} — {longo}
              {k === "s_base" && t(p, "base_22") && ` (${nomeCidade(p.base_22)}: ${num(n(p, "votos_base_22"))} → ${num(n(p, "votos_base_26"))})`}
              {k === "s_concentrado" && Number.isFinite(n(p, "concentracao")) && ` (${pct(n(p, "concentracao"))} em ${nomeCidade(p.melhor_cidade)})`}
            </li>
          );
        })}
      </ul>
      {acesos.length === 0 && <p style={{ fontSize: 14, opacity: 0.8 }}>Nenhum sinal aceso: base estável.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginTop: 14 }}>
        <div>
          <p style={{ fontWeight: 700, margin: "0 0 6px" }}>Onde ele tem voto</p>
          <Tabela
            linhas={cidadesDele}
            ordem="votos"
            colunas={[
              { chave: "cidade", rotulo: "Cidade", tipo: "txt" },
              { chave: "votos_22", rotulo: "2022" },
              { chave: "votos", rotulo: "2026" },
              { chave: "var", rotulo: "Variação" },
            ]}
          />
        </div>
        {perdas.length > 0 && (
          <div>
            <p style={{ fontWeight: 700, margin: "0 0 6px" }}>Onde mais perdeu (mesmo cargo)</p>
            <Tabela
              linhas={perdas}
              ordem="perda"
              colunas={[
                { chave: "cidade", rotulo: "Cidade", tipo: "txt" },
                { chave: "votos_22", rotulo: "2022" },
                { chave: "votos", rotulo: "2026" },
                { chave: "perda", rotulo: "Perdeu" },
              ]}
            />
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0" }}>Bairro a bairro: aba Bairros → detalhe do bairro → “Quem perdeu voto aqui”.</p>

      <Secao titulo="Pautas" sub="Os projetos que ele apresentou na Câmara como primeiro autor (2023–2026), por tema." explica="pautas">
        {temas.length === 0 ? (
          <p style={{ fontSize: 14.5, opacity: 0.8 }}>
            Sem pauta na base da Câmara: só existe para quem foi deputado federal de 2023 a 2026 e apresentou projeto como primeiro autor.
          </p>
        ) : (
          <>
            <Kpis itens={temas.map((x) => ({ rotulo: t(x, "tema"), valor: `${num(n(x, "projetos"))} projetos` }))} />
            <ul style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 14.5, lineHeight: 1.5, display: "grid", gap: 6 }}>
              {projetos.map((x) => (
                <li key={`${t(x, "tipo")}${t(x, "numero")}${t(x, "ano")}`}>
                  <b>
                    {t(x, "tipo")} {t(x, "numero")}/{t(x, "ano")}
                  </b>{" "}
                  — {t(x, "ementa")}
                </li>
              ))}
            </ul>
          </>
        )}
      </Secao>
    </Secao>
  );
}
