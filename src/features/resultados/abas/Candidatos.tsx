"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DADO } from "@/lib/theme";
import { carregarBairros, carregarMapa, carregarUf, n, t, temBairros, useRecurso, type Linha, type ProprioNaCidade, type Resumo } from "../dados";
import { num, pct, titulo, UF_NOMES } from "../formato";
import { BarrasQuociente, MapaCoropletico, Ranking } from "../graficos";
import { Busca, Carregando, Chips, Escolha, Filtros, Kpis, Nota, Secao, Tabela, type Coluna } from "../pecas";

export const COLUNAS_CANDIDATO: Coluna[] = [
  { chave: "candidato_urna", rotulo: "Candidato", tipo: "txt" },
  { chave: "candidato_numero", rotulo: "Número", tipo: "txt" },
  { chave: "uf", rotulo: "UF", tipo: "txt", valor: (l) => t(l, "uf").toUpperCase() },
  { chave: "cargo_nome", rotulo: "Cargo", tipo: "txt" },
  { chave: "votos", rotulo: "Votos" },
  { chave: "pct_do_partido", rotulo: "% do partido", tipo: "pct" },
  { chave: "pct_do_qe", rotulo: "% do QE", tipo: "barra", max: 1, ajuda: "Votos nominais ÷ quociente. Mínimo para ser eleito: 10%" },
  { chave: "situacao", rotulo: "Situação", tipo: "txt" },
  { chave: "tipo_numero", rotulo: "Tipo de número", tipo: "txt" },
  { chave: "pct_voto_difuso", rotulo: "Voto difuso", tipo: "pct", ajuda: "Parte dos votos que acompanha o Renan no estado inteiro (voto pelo número ou fama estadual)" },
  { chave: "numero_parecido", rotulo: "Nº parecido", tipo: "txt" },
  { chave: "corr_numero_parecido", rotulo: "Correlação", tipo: "dec", ajuda: "1 = os dois votaram igual cidade a cidade (dobrada)" },
  { chave: "cidades_faz_vereador", rotulo: "Faria vereador em", ajuda: "Cidades onde os votos dele sozinho ≥ QE de vereador 2028" },
  { chave: "melhor_cidade_vereador", rotulo: "Melhor cidade p/ vereador", tipo: "txt" },
  { chave: "cidades_com_voto", rotulo: "Cidades com voto" },
  { chave: "melhor_cidade", rotulo: "Mais votos em", tipo: "txt" },
];

const CARGOS = ["Deputado Federal", "Deputado Estadual", "Deputado Distrital", "Senador", "Governador", "Presidente"];

export default function Candidatos({ resumo }: { resumo: Resumo }) {
  const [vista, setVista] = useState<"lista" | "numeros" | "movimento">("lista");
  const [cargo, setCargo] = useState("Deputado Federal");
  const [uf, setUf] = useState("todos");
  const [busca, setBusca] = useState("");
  const [chave, setChave] = useState("");

  const lista = useMemo(() => {
    const b = busca.trim().toUpperCase();
    return resumo.candidatos
      .filter((c) => c.cargo_nome === cargo && (uf === "todos" || c.uf === uf))
      .filter((c) => !b || t(c, "candidato_urna").toUpperCase().includes(b) || t(c, "candidato_numero").startsWith(b))
      .sort((a, b2) => n(b2, "votos") - n(a, "votos"));
  }, [resumo.candidatos, cargo, uf, busca]);

  const chaveDe = (c: Linha) => `${t(c, "candidato_sq")}|${t(c, "uf")}`;
  useEffect(() => {
    if (lista.length && !lista.some((c) => chaveDe(c) === chave)) setChave(chaveDe(lista[0]));
  }, [lista, chave]);
  const escolhido = lista.find((c) => chaveDe(c) === chave);
  const ufsDoCargo = ["todos", ...Array.from(new Set(resumo.candidatos.filter((c) => c.cargo_nome === cargo).map((c) => t(c, "uf")))).sort()];

  return (
    <>
      <Chips
        valor={vista}
        opcoes={["lista", "movimento", "numeros"] as ("lista" | "numeros" | "movimento")[]}
        aoMudar={setVista}
        nome={(v) => (v === "lista" ? "Candidatos" : v === "movimento" ? "Movimento (antes do partido)" : "O número faz diferença?")}
      />
      {vista === "numeros" ? (
        <Numeros resumo={resumo} />
      ) : vista === "movimento" ? (
        <MovimentoVista resumo={resumo} />
      ) : (
        <>
          <Filtros>
            <Escolha rotulo="Cargo" valor={cargo} opcoes={CARGOS} aoMudar={setCargo} />
            <Escolha rotulo="Estado" valor={ufsDoCargo.includes(uf) ? uf : "todos"} opcoes={ufsDoCargo} aoMudar={setUf} nome={(u) => (u === "todos" ? "Todos os estados" : UF_NOMES[u])} />
            <Busca rotulo="Nome ou número" valor={busca} aoMudar={setBusca} dica="ex.: 1414 ou Kim" />
          </Filtros>
          <Tabela linhas={lista} colunas={[...COLUNAS_CANDIDATO.slice(0, 5), colunaAntes(resumo), ...COLUNAS_CANDIDATO.slice(5)]} ordem="votos" />
          {escolhido && (
            <>
              <Filtros>
                <Escolha
                  rotulo="Detalhar candidato"
                  valor={chave}
                  opcoes={lista.map(chaveDe)}
                  aoMudar={setChave}
                  nome={(k) => {
                    const c = lista.find((x) => chaveDe(x) === k);
                    return `${t(c, "candidato_numero")} · ${t(c, "candidato_urna")} (${t(c, "uf").toUpperCase()}) — ${num(n(c, "votos"))} votos`;
                  }}
                />
              </Filtros>
              <Detalhe candidato={escolhido} resumo={resumo} />
            </>
          )}
        </>
      )}
    </>
  );
}

function Detalhe({ candidato: c, resumo }: { candidato: Linha; resumo: Resumo }) {
  const uf = t(c, "uf");
  const dados = useRecurso(uf, carregarUf);
  const mapa = useRecurso(uf, carregarMapa);
  const cargo = t(c, "cargo_key");

  const porCidade = useMemo(() => {
    if (!dados.dado) return [];
    const cidades = new Map(dados.dado.cidades.map((x) => [String(x.municipio_codigo), x]));
    return dados.dado.votos
      .filter((v) => v.candidato_sq === t(c, "candidato_sq"))
      .map((v) => {
        const cid = cidades.get(v.municipio_codigo);
        return {
          municipio_nome: titulo(t(cid, "municipio_nome")),
          municipio_codigo: v.municipio_codigo,
          codigo_ibge: t(cid, "codigo_ibge"),
          porte: t(cid, "porte"),
          eleitorado: n(cid, "eleitorado"),
          votos: v.votos,
          pct: v.votos / n(cid, `validos_${cargo}`),
          por_mil: (v.votos * 1000) / n(cid, "eleitorado"),
          renan: n(cid, "missao_pres"),
          aproveitamento: v.votos / n(cid, "missao_pres"),
          vagas_ver: n(cid, "vagas_ver"),
          qe_ver: n(cid, "qe_ver_2028_est"),
          qe_vereador: v.votos / n(cid, "qe_ver_2028_est"),
        } as Linha;
      });
  }, [dados.dado, c, cargo]);

  const valores = Object.fromEntries(porCidade.map((x) => [t(x, "codigo_ibge"), n(x, "pct")]));
  const rotulos = Object.fromEntries(porCidade.map((x) => [t(x, "codigo_ibge"), `${t(x, "municipio_nome")}: ${num(n(x, "votos"))} votos (${pct(n(x, "pct"), 2)})`]));
  const prop = cargo === "df" || cargo === "de";

  return (
    <>
      <Secao titulo={`${t(c, "candidato_numero")} · ${t(c, "candidato_urna")} — ${t(c, "cargo_nome")} / ${uf.toUpperCase()}`} sub={t(c, "candidato_nome")}>
        <Kpis
          itens={[
            { rotulo: "Votos", valor: num(n(c, "votos")), sub: `${pct(n(c, "pct_do_partido"))} dos votos nominais do partido`, missao: true },
            { rotulo: "% do quociente", valor: pct(n(c, "pct_do_qe")), sub: "mínimo para ser eleito: 10%", missao: true },
            { rotulo: "Cidades com voto", valor: num(n(c, "cidades_com_voto")), sub: `${t(c, "melhor_cidade")} concentra ${pct(n(c, "concentracao_melhor_cidade"))}` },
            { rotulo: "Situação", valor: t(c, "situacao") || "—" },
          ]}
        />
      </Secao>

      {prop && (
        <Secao explica="numero-candidato" titulo="O número do candidato" sub="Voto difuso = votos que aparecem no estado inteiro na mesma proporção dos votos do Renan: sinal de voto pelo número (ou de candidato conhecido no estado todo). O resto é base local.">
          <Kpis
            itens={[
              { rotulo: "Número", valor: t(c, "candidato_numero"), sub: t(c, "tipo_numero"), missao: true },
              { rotulo: "Voto difuso", valor: pct(n(c, "pct_voto_difuso")), sub: `≈ ${num(n(c, "voto_difuso"))} votos · ${num(n(c, "votos_por_100_renan"), 1)} para cada 100 do Renan`, missao: true },
              { rotulo: "Base local", valor: pct(1 - n(c, "pct_voto_difuso")), sub: `≈ ${num(n(c, "votos") - n(c, "voto_difuso"))} votos`, missao: true },
              {
                rotulo: "Número parecido no outro cargo",
                valor: t(c, "numero_parecido") ? `${t(c, "numero_parecido")} · ${t(c, "candidato_numero_parecido")}` : "—",
                sub: t(c, "numero_parecido") ? `correlação ${num(n(c, "corr_numero_parecido"), 2)} entre as cidades` : "nenhum",
                missao: true,
              },
            ]}
          />
        </Secao>
      )}

      <Secao explica="vereador-2028" titulo="Vereador em 2028 com estes votos" sub="Votos do candidato em cada cidade ÷ QE de vereador estimado. Acima de 1,00, os votos dele sozinho já fariam uma cadeira.">
        <Kpis
          itens={[
            { rotulo: "Cidades onde faria vereador", valor: num(n(c, "cidades_faz_vereador") || 0), missao: true },
            { rotulo: "Cidades perto (80% a 99%)", valor: num(n(c, "cidades_80pct_vereador") || 0), missao: true },
            { rotulo: "Melhor cidade", valor: t(c, "melhor_cidade_vereador") ? titulo(t(c, "melhor_cidade_vereador")) : "—", sub: `${num(n(c, "melhor_qe_vereador"), 2)} quociente`, missao: true },
          ]}
        />
        {dados.dado && (
          <BarrasQuociente
            textoNominal="votos do candidato na cidade"
            textoRenan="votos do Renan na cidade, como se fossem para vereador"
            linhas={[...porCidade]
              .filter((x) => n(x, "qe_ver") > 0)
              .sort((a, b) => n(b, "qe_vereador") - n(a, "qe_vereador"))
              .slice(0, 12)
              .map((x) => ({ nome: t(x, "municipio_nome"), qe: n(x, "qe_ver"), nominal: n(x, "votos"), legenda: 0, renan: n(x, "renan") }))}
          />
        )}
      </Secao>

      <Secao explica="onde-melhor" titulo="Onde foi melhor">
        {!dados.dado ? (
          <Carregando erro={dados.erro} />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
              <div>
                <p style={{ fontWeight: 700, margin: "0 0 8px" }}>Mais votos (total · %)</p>
                <Ranking
                  itens={[...porCidade]
                    .sort((a, b) => n(b, "votos") - n(a, "votos"))
                    .slice(0, 15)
                    .map((x) => ({ nome: t(x, "municipio_nome"), valor: n(x, "votos"), texto: `${num(n(x, "votos"))} · ${pct(n(x, "pct"), 2)}` }))}
                />
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: "0 0 8px" }}>Maior % dos válidos (cidades com 5 mil+ eleitores)</p>
                <Ranking
                  itens={porCidade
                    .filter((x) => n(x, "eleitorado") >= 5000)
                    .sort((a, b) => n(b, "pct") - n(a, "pct"))
                    .slice(0, 15)
                    .map((x) => ({ nome: t(x, "municipio_nome"), valor: n(x, "pct"), texto: `${pct(n(x, "pct"), 2)} · ${num(n(x, "votos"))}` }))}
                />
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <MapaCoropletico mapa={mapa.dado} valores={valores} rotulos={rotulos} />
            </div>
            <Tabela
              linhas={porCidade}
              ordem="votos"
              colunas={[
                { chave: "municipio_nome", rotulo: "Município", tipo: "txt" },
                { chave: "porte", rotulo: "Porte", tipo: "txt" },
                { chave: "eleitorado", rotulo: "Eleitorado" },
                { chave: "votos", rotulo: "Votos" },
                { chave: "pct", rotulo: "% dos válidos", tipo: "pct" },
                { chave: "por_mil", rotulo: "Votos / mil eleitores", tipo: "dec" },
                { chave: "renan", rotulo: "Renan na cidade" },
                { chave: "aproveitamento", rotulo: "Votos ÷ Renan", tipo: "barra", max: 1 },
                { chave: "vagas_ver", rotulo: "Vagas vereador" },
                { chave: "qe_ver", rotulo: "QE vereador 2028" },
                { chave: "qe_vereador", rotulo: "QE de vereador", tipo: "barra", max: 2 },
              ]}
            />
          </>
        )}
      </Secao>

      {dados.dado && <MelhorDeFato candidato={c} proprio={dados.dado.proprio} cidades={dados.dado.cidades} />}
      {dados.dado && (
        <PorBairro
          candidato={c}
          cidades={porCidade.filter((x) => temBairros(resumo, uf, x))}
          inicial={melhorCidadeComBairro(dados.dado.proprio, t(c, "candidato_sq"))}
        />
      )}
    </>
  );
}

function Numeros({ resumo }: { resumo: Resumo }) {
  const duplas = resumo.candidatos.filter((c) => c.cargo_key === "de" && t(c, "numero_parecido")).sort((a, b) => n(b, "votos") - n(a, "votos"));
  return (
    <>
      <EfeitoNumero linhas={resumo.efeitoNumero ?? []} />
      <Nota>
        Votos por tipo de número, em todos os candidatos do Missão. A comparação usa a <b>mediana</b> (o candidato do meio), para um puxador muito votado não
        distorcer a média. Atenção: “repete o 14” junta o 1414 com 14014, 14141…, e a evidência acima mostra que eles não se comportam igual.
      </Nota>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
        {Array.from(new Set(resumo.numeros.map((x) => t(x, "cargo"))))
          .sort()
          .reverse()
          .map((cargo) => (
            <Secao key={cargo} titulo={cargo} sub="Mediana de votos por tipo de número.">
              <Ranking
                cor={DADO.missao}
                itens={resumo.numeros
                  .filter((x) => x.cargo === cargo)
                  .sort((a, b) => n(b, "votos_mediana") - n(a, "votos_mediana"))
                  .map((x) => ({
                    nome: t(x, "tipo_numero"),
                    valor: n(x, "votos_mediana"),
                    texto: `${num(n(x, "votos_mediana"))} · ${num(n(x, "candidatos"))} candidatos · ${pct(n(x, "participacao_nos_votos"))} dos votos`,
                  }))}
              />
            </Secao>
          ))}
      </div>
      <Secao explica="duplas" titulo="Duplas de números parecidos" sub="Federal e estadual da mesma UF com números que conversam (1414 ↔ 14014, 1400 ↔ 14000). Correlação perto de 1 = votaram nas mesmas cidades, na mesma proporção.">
        <Tabela
          linhas={duplas}
          ordem="votos"
          colunas={[
            { chave: "uf", rotulo: "UF", tipo: "txt", valor: (l) => t(l, "uf").toUpperCase() },
            { chave: "candidato_numero", rotulo: "Nº estadual", tipo: "txt" },
            { chave: "candidato_urna", rotulo: "Candidato estadual", tipo: "txt" },
            { chave: "votos", rotulo: "Votos" },
            { chave: "numero_parecido", rotulo: "Nº federal", tipo: "txt" },
            { chave: "candidato_numero_parecido", rotulo: "Candidato federal", tipo: "txt" },
            { chave: "corr_numero_parecido", rotulo: "Correlação", tipo: "dec" },
            { chave: "pct_voto_difuso", rotulo: "Voto difuso (estadual)", tipo: "pct" },
          ]}
        />
      </Secao>
    </>
  );
}

/** A votação do candidato bairro a bairro: o que o 14 de cada bairro explica (puxado) e o que é dele (próprio). */
function PorBairro({ candidato: c, cidades, inicial }: { candidato: Linha; cidades: Linha[]; inicial?: string }) {
  const uf = t(c, "uf");
  const cargo = t(c, "cargo_key");
  const opcoes = useMemo(() => [...cidades].sort((a, b) => n(b, "votos") - n(a, "votos")).slice(0, 80), [cidades]);
  const [codigo, setCodigo] = useState("");
  // abre na cidade onde ele tem mais voto próprio (e que tem bairro); sem ela, na de mais votos
  const cod = codigo || (inicial && opcoes.some((o) => t(o, "municipio_codigo") === inicial) ? inicial : t(opcoes[0], "municipio_codigo"));
  const dados = useRecurso(cod ? `${uf}/${cod}` : null, carregarBairros);

  const linhas = useMemo(() => {
    const d = dados.dado;
    if (!d) return [];
    const ip = d.pessoas.findIndex((p) => String(p.id) === t(c, "candidato_sq"));
    const decomp = new Map(d.proprio.filter((x) => x.p === ip).map((x) => [x.b, x]));
    const votos = new Map(d.candidatos.filter((x) => x.p === ip && x.cargo_key === cargo).map((x) => [x.b, x.votos]));
    return d.bairros.map((b, i) => {
      const v = decomp.get(i)?.votos ?? votos.get(i) ?? 0;
      const pux = decomp.get(i)?.puxado ?? 0;
      return {
        bairro: t(b, "bairro"),
        situacao: t(b, "situacao"),
        eleitorado: n(b, "eleitorado"),
        renan: n(b, "missao_pres"),
        votos: v,
        puxado: pux,
        proprio: v - pux,
        pct_proprio: Math.max(0, v - pux) / v,
      } as Linha;
    });
  }, [dados.dado, c, cargo]);

  if (!opcoes.length) return null;
  return (
    <Secao titulo="Por bairro" sub="Em cada bairro da cidade: os votos dele, o que o 14 do bairro explica (puxado) e o que é dele (próprio). A régua é a própria cidade." explica="voto-puxado">
      <Escolha rotulo="Cidade" valor={cod} opcoes={opcoes.map((x) => t(x, "municipio_codigo"))} aoMudar={setCodigo} nome={(k) => {
        const x = opcoes.find((o) => t(o, "municipio_codigo") === k);
        return `${t(x, "municipio_nome")} — ${num(n(x, "votos"))} votos`;
      }} />
      {!dados.dado ? (
        <Carregando erro={dados.erro} />
      ) : (
        <Tabela
          linhas={linhas}
          ordem="proprio"
          arquivo={`${t(c, "candidato_numero")}-bairros-${cod}`}
          colunas={[
            { chave: "bairro", rotulo: "Bairro", tipo: "txt" },
            { chave: "situacao", rotulo: "Situação do 14", tipo: "txt" },
            { chave: "renan", rotulo: "Renan" },
            { chave: "votos", rotulo: "Votos dele" },
            { chave: "puxado", rotulo: "Puxado pelo 14" },
            { chave: "proprio", rotulo: "Próprio (ou a menos)" },
            { chave: "pct_proprio", rotulo: "% próprio", tipo: "pct" },
          ]}
        />
      )}
    </Secao>
  );
}

/**
 * Onde o candidato é melhor DE FATO: as cidades onde ele teve mais voto PRÓPRIO —
 * o que sobra depois de tirar o que o 14 daquela cidade daria a ele pela taxa
 * típica dele. Lugar que já vota 14 dá voto ao número de qualquer candidato do
 * Missão; contar isso como base dele confundiria o lugar convertido com o dele.
 */
function MelhorDeFato({ candidato: c, proprio, cidades }: { candidato: Linha; proprio: ProprioNaCidade[]; cidades: Linha[] }) {
  const nomes = useMemo(() => new Map(cidades.map((x) => [String(x.municipio_codigo), x])), [cidades]);
  const linhas = useMemo(
    () =>
      proprio
        .filter((p) => String(p.cand) === t(c, "candidato_sq"))
        .map((p) => {
          const cid = nomes.get(String(p.municipio_codigo));
          return {
            cidade: titulo(t(cid, "municipio_nome")),
            situacao: t(cid, "situacao"),
            eleitorado: n(cid, "eleitorado"),
            renan: n(cid, "missao_pres"),
            votos: p.votos,
            puxado: p.puxado,
            proprio: p.votos - p.puxado,
            pct_proprio: Math.max(0, p.votos - p.puxado) / p.votos,
            melhor_bairro: p.melhor_bairro ?? "",
            mb_votos: p.mb_votos,
            mb_puxado: p.mb_puxado,
            mb_proprio: (p.mb_votos ?? NaN) - (p.mb_puxado ?? NaN),
          } as Linha;
        }),
    [proprio, c, nomes],
  );
  if (!linhas.length) return null;
  const topo = [...linhas].sort((a, b) => n(b, "proprio") - n(a, "proprio"))[0];
  const maisVotos = [...linhas].sort((a, b) => n(b, "votos") - n(a, "votos"))[0];
  const k = n(c, "k_renan");
  return (
    <Secao titulo="Onde ele é melhor de fato" sub="Em cada cidade: os votos dele, o que o 14 da cidade explica (puxado) e o que é dele (próprio). Ordenado pelo voto próprio." explica="voto-puxado">
      <Kpis
        itens={[
          {
            rotulo: "Voto próprio no estado",
            valor: num(n(c, "voto_proprio")),
            sub: `${pct(n(c, "voto_proprio") / n(c, "votos"))} dos votos dele · o resto (${num(n(c, "voto_puxado"))}) acompanha o 14: ${num(k, 1)} votos para cada 100 do Renan no lugar típico`,
            missao: true,
          },
          { rotulo: "Melhor cidade de fato", valor: t(topo, "cidade"), sub: `${num(n(topo, "proprio"))} votos próprios (${num(n(topo, "votos"))} votos, ${num(n(topo, "puxado"))} puxados pelo 14)`, missao: true },
          bairroDe(topo),
          {
            rotulo: "Onde teve mais votos",
            valor: t(maisVotos, "cidade"),
            sub: `${num(n(maisVotos, "votos"))} votos, dos quais ${num(Math.max(0, n(maisVotos, "proprio")))} próprios`,
          },
        ]}
      />
      <Tabela
        linhas={linhas}
        ordem="proprio"
        arquivo={`${t(c, "candidato_numero")}-voto-proprio`}
        colunas={[
          { chave: "cidade", rotulo: "Cidade", tipo: "txt" },
          { chave: "situacao", rotulo: "Situação do 14", tipo: "txt" },
          { chave: "renan", rotulo: "Renan" },
          { chave: "votos", rotulo: "Votos dele" },
          { chave: "puxado", rotulo: "Puxado pelo 14" },
          { chave: "proprio", rotulo: "Próprio (ou a menos)" },
          { chave: "pct_proprio", rotulo: "% próprio", tipo: "pct" },
          { chave: "melhor_bairro", rotulo: "Melhor bairro de fato", tipo: "txt", valor: (l) => (t(l, "melhor_bairro") ? `${t(l, "melhor_bairro")} (+${num(n(l, "mb_proprio"))})` : "") },
        ]}
      />
      <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0" }}>
        Melhor bairro de fato: dentro da cidade, o bairro onde ele teve mais voto próprio (a régua é a própria cidade). Só existe nas cidades com recorte por
        bairro; o bairro a bairro completo está logo abaixo, em “Por bairro”.
      </p>
    </Secao>
  );
}

/** O destaque do melhor bairro na melhor cidade (ou por que não há). */
function bairroDe(l: Linha) {
  const cidade = t(l, "cidade");
  if (!t(l, "melhor_bairro")) {
    return { rotulo: `Melhor bairro em ${cidade}`, valor: "—", sub: "a cidade não tem recorte por bairro, ou ele não teve voto próprio em nenhum" };
  }
  return {
    rotulo: `Melhor bairro em ${cidade}`,
    valor: t(l, "melhor_bairro"),
    sub: `${num(n(l, "mb_proprio"))} votos próprios (${num(n(l, "mb_votos"))} votos, ${num(n(l, "mb_puxado"))} puxados pelo 14)`,
    missao: true,
  };
}

/** A cidade (com recorte por bairro) onde o candidato tem mais voto próprio. */
function melhorCidadeComBairro(proprio: ProprioNaCidade[], sq: string): string | undefined {
  return proprio
    .filter((p) => String(p.cand) === sq && p.melhor_bairro)
    .sort((a, b) => b.votos - b.puxado - (a.votos - a.puxado))[0]?.municipio_codigo;
}

const mediana = (v: number[]) => {
  const x = v.filter(Number.isFinite).sort((a, b) => a - b);
  return x.length ? (x.length % 2 ? x[(x.length - 1) / 2] : (x[x.length / 2 - 1] + x[x.length / 2]) / 2) : NaN;
};

/**
 * O número fácil puxa voto? Estado a estado, o candidato de número que repete o
 * 14 contra o melhor dos outros do Missão no mesmo cargo. O teste contra "o
 * partido deu o número ao mais forte" são os estreantes; o controle é o outro cargo.
 */
function EfeitoNumero({ linhas }: { linhas: Linha[] }) {
  const [cargo, setCargo] = useState<"df" | "de">("df");
  if (!linhas.length) return null;
  const resumoDe = (c: string) => {
    const ls = linhas.filter((l) => l.cargo_key === c);
    const est = ls.filter((l) => l.estreante === true);
    return {
      n: ls.length,
      primeiro: ls.filter((l) => n(l, "lugar_missao") === 1).length,
      fatia: mediana(ls.map((l) => n(l, "fatia_missao"))),
      k: mediana(ls.map((l) => n(l, "k_renan"))),
      kOutro: mediana(ls.map((l) => n(l, "outro_k_renan"))),
      puxado: mediana(ls.map((l) => n(l, "pct_puxado"))),
      estreantes: est.length,
      fatiaEst: mediana(est.map((l) => n(l, "fatia_missao"))),
    };
  };
  const df = resumoDe("df");
  const de = resumoDe("de");
  const r = cargo === "df" ? df : de;
  const frase = (x: ReturnType<typeof resumoDe>, nome: string) =>
    `${nome}: em ${num(x.primeiro)} de ${num(x.n)} estados o número fácil foi o mais votado do Missão; ficou com ${pct(x.fatia)} do voto do partido (mediana) e teve ${num(x.k, 1)} votos para cada 100 do Renan no lugar típico, contra ${num(x.kOutro, 1)} do melhor dos outros. ${num(x.estreantes)} eram estreantes, com ${pct(x.fatiaEst)} do voto do partido.`;
  return (
    <Secao titulo="O 1414 puxa voto? A evidência" sub="Estado a estado, o candidato de número fácil contra o melhor dos outros do Missão no mesmo cargo." explica="efeito-numero">
      <Nota>
        <p style={{ margin: "0 0 6px" }}>{frase(df, "Dep. Federal (1414)")}</p>
        <p style={{ margin: "0 0 6px" }}>{frase(de, "Dep. Estadual (14014, 14141…)")}</p>
        <p style={{ margin: 0 }}>
          Como ler: se o número fácil rende muito mais que os outros do partido — e rende assim também com estreantes, sem fama própria —, o voto é do número.
          O Dep. Estadual é a comparação: mesmo partido, mesmo Renan, números com 14. Onde ele não repete o resultado, o efeito não é de “ter 14 no número”,
          é do número específico.
        </p>
      </Nota>
      <Chips valor={cargo} opcoes={["df", "de"] as ("df" | "de")[]} aoMudar={setCargo} nome={(c) => (c === "df" ? "Dep. Federal" : "Dep. Estadual")} />
      <Kpis
        itens={[
          { rotulo: "Foi o 1º do Missão", valor: `${num(r.primeiro)} de ${num(r.n)}`, sub: "estados", missao: true },
          { rotulo: "Fatia do voto do partido", valor: pct(r.fatia), sub: "mediana dos estados", missao: true },
          { rotulo: "Votos p/ 100 do Renan", valor: num(r.k, 1), sub: `o melhor dos outros: ${num(r.kOutro, 1)}`, missao: true },
          { rotulo: "Quanto acompanha o 14", valor: pct(r.puxado), sub: "do voto dele (mediana)" },
          { rotulo: "Estreantes", valor: num(r.estreantes), sub: `fatia do partido: ${pct(r.fatiaEst)}` },
        ]}
      />
      <Tabela
        linhas={linhas.filter((l) => l.cargo_key === cargo)}
        ordem="votos"
        arquivo={`efeito-numero-${cargo}`}
        colunas={[
          { chave: "uf", rotulo: "UF", tipo: "txt", valor: (l) => t(l, "uf").toUpperCase() },
          { chave: "numero", rotulo: "Número", tipo: "txt" },
          { chave: "nome", rotulo: "Candidato", tipo: "txt" },
          { chave: "estreante", rotulo: "Estreante", tipo: "txt", valor: (l) => (l.estreante === true ? "Sim" : l.estreante === false ? "Não" : "—") },
          { chave: "votos", rotulo: "Votos" },
          { chave: "fatia_missao", rotulo: "% do Missão", tipo: "pct" },
          { chave: "lugar_missao", rotulo: "Lugar no Missão" },
          { chave: "k_renan", rotulo: "Por 100 do Renan", tipo: "dec" },
          { chave: "pct_puxado", rotulo: "% que acompanha o 14", tipo: "pct" },
          { chave: "outro_nome", rotulo: "Melhor dos outros", tipo: "txt" },
          { chave: "outro_votos", rotulo: "Votos dele" },
          { chave: "outro_k_renan", rotulo: "Por 100 do Renan (ele)", tipo: "dec" },
        ]}
      />
    </Secao>
  );
}

/* ===== O movimento antes do partido ===== */

const CARGO_TXT: Record<string, string> = { df: "Dep. Federal", de: "Dep. Estadual", ver: "Vereador", pref: "Prefeito", gov: "Governador", sen: "Senador" };

/** Coluna da tabela principal: a candidatura de antes do Missão, para quem é do movimento. */
function colunaAntes(resumo: Resumo): Coluna {
  const porSq = new Map((resumo.movimento ?? []).filter((m) => m.sq_2026).map((m) => [String(m.sq_2026), m]));
  return {
    chave: "antes",
    rotulo: "Antes do Missão",
    tipo: "txt",
    valor: (l) => {
      const m = porSq.get(t(l, "candidato_sq"));
      const a = m?.trajetoria.find((x) => n(x, "ano") === m.ano_antes);
      return a ? `${CARGO_TXT[t(a, "cargo")] ?? t(a, "cargo")} ${t(a, "ano")} (${t(a, "partido")}): ${num(n(a, "votos"))}` : "";
    },
  };
}

const leCorr = (r: number) =>
  !Number.isFinite(r) ? "—" : r >= 0.6 ? "forte" : r >= 0.3 ? "moderada" : r > -0.3 ? "fraca" : "inversa";

function MovimentoVista({ resumo }: { resumo: Resumo }) {
  const pessoas = resumo.movimento ?? [];
  const [quem, setQuem] = useState(0);
  if (!pessoas.length) return <Nota>O estudo do movimento sai junto com o recorte por bairro, que ainda não foi gerado.</Nota>;
  const porSq = new Map(resumo.candidatos.map((c) => [String(c.candidato_sq), c]));
  const resumoLinhas: Linha[] = pessoas.map((m) => {
    const antes = m.trajetoria.find((x) => n(x, "ano") === m.ano_antes);
    const c26 = m.sq_2026 ? porSq.get(String(m.sq_2026)) : undefined;
    return {
      nome: m.nome,
      antes: antes ? `${CARGO_TXT[t(antes, "cargo")]} ${t(antes, "ano")} · ${t(antes, "partido")} · ${t(antes, "numero")}` : "",
      votos_antes: n(antes, "votos"),
      em2026: c26 ? `${t(c26, "cargo_nome")} · ${t(c26, "candidato_numero")} · ${t(c26, "situacao")}` : "Não concorreu",
      votos_26: n(c26, "votos"),
      proprio_26: n(c26, "voto_proprio"),
      heranca: n(m.herancaBairros, "corr_chapa"),
      percentil: n(m.herancaBairros, "percentil_chapa"),
      futuro: n(m.futuro, "votos_na_cidade_antes") / n(m.futuro, "qe_2028"),
    } as Linha;
  });
  const m = pessoas[quem] ?? pessoas[0];
  const h = m.herancaBairros;
  const hc = m.herancaCidades;
  const f = m.futuro;
  const x = m.extra;
  const c26 = m.sq_2026 ? porSq.get(String(m.sq_2026)) : undefined;
  const anulados = m.trajetoria.reduce((s2, l) => s2 + (n(l, "anulados") || 0), 0);
  return (
    <>
      <Nota>
        O Missão não existia em 2022 nem em 2024. Quem já era do movimento concorreu por outra legenda — e pode ter deixado base para o partido em 2026. Aqui
        está, para cada um, a trajetória, se os lugares onde ele era forte antes votaram mais no Missão em 2026 (comparado com <b>todos os outros candidatos
        de direita e centro</b> da mesma eleição, para separar “o bairro é de direita” de “o bairro é dele”) e o que os votos dele dizem para 2028.
      </Nota>
      <Secao titulo="O movimento: presente e futuro" sub="Antes do partido, em 2026 e para a próxima eleição na cidade-base." explica="movimento">
        <Tabela
          linhas={resumoLinhas}
          ordem="votos_antes"
          colunas={[
            { chave: "nome", rotulo: "Nome", tipo: "txt" },
            { chave: "antes", rotulo: "Antes do Missão", tipo: "txt" },
            { chave: "votos_antes", rotulo: "Votos antes" },
            { chave: "em2026", rotulo: "Em 2026", tipo: "txt" },
            { chave: "votos_26", rotulo: "Votos 2026" },
            { chave: "proprio_26", rotulo: "Próprios 2026", ajuda: "o que sobra depois de tirar o que o 14 explica" },
            { chave: "heranca", rotulo: "Herança (bairros)", tipo: "dec", ajuda: "correlação da base de antes com a chapa do Missão 2026 sem ele" },
            { chave: "percentil", rotulo: "Acima da direita", tipo: "pct", ajuda: "em quantos dos outros candidatos de direita e centro a herança foi menor" },
            { chave: "futuro", rotulo: "Votos ÷ QE vereador 2028", tipo: "pct", ajuda: "os votos dele na cidade-base contra o quociente estimado" },
          ]}
        />
      </Secao>

      <Filtros>
        <Escolha rotulo="Pessoa" valor={String(quem)} opcoes={pessoas.map((_, i) => String(i))} aoMudar={(v) => setQuem(Number(v))} nome={(i) => `${pessoas[Number(i)].nome} — ${pessoas[Number(i)].papel}`} />
      </Filtros>

      <Secao titulo={`${m.nome}: a trajetória`} sub={m.papel}>
        <Tabela
          linhas={m.trajetoria}
          ordem="ano"
          colunas={[
            { chave: "ano", rotulo: "Ano", tipo: "txt", valor: (l) => String(l.ano ?? "") },
            { chave: "cargo", rotulo: "Cargo", tipo: "txt", valor: (l) => CARGO_TXT[t(l, "cargo")] ?? t(l, "cargo") },
            { chave: "numero", rotulo: "Número", tipo: "txt" },
            { chave: "partido", rotulo: "Partido", tipo: "txt" },
            { chave: "votos", rotulo: "Votos" },
            { chave: "situacao", rotulo: "Situação", tipo: "txt" },
          ]}
        />
        {anulados > 0 && (
          <p style={{ fontSize: 14, margin: "8px 0 0" }}>
            Os {num(anulados)} votos de {t(m.trajetoria[0], "ano")} foram <b>anulados sub judice</b> — a candidatura estava em julgamento no dia da eleição.
            Não contaram para o partido, mas são eleitores reais que digitaram o número; para estudar a base, eles contam.
          </p>
        )}
      </Secao>

      <Secao titulo="Ajudou ou atrapalhou o Missão em 2026?" sub={`Nos bairros de ${t(f, "cidade")}${hc ? " e nas cidades do estado" : ""}: a base de antes contra a chapa do Missão em 2026 sem os votos dele.`} explica="movimento">
        <Kpis
          itens={[
            {
              rotulo: `Herança nos bairros de ${t(f, "cidade")}`,
              valor: num(n(h, "corr_chapa"), 2),
              sub: `${leCorr(n(h, "corr_chapa"))} · a direita em geral: ${num(n(h, "ctrl_chapa_mediana"), 2)} (${num(n(h, "ctrl_n"))} candidatos)`,
              missao: true,
            },
            { rotulo: "Mais alinhado que", valor: pct(n(h, "percentil_chapa")), sub: "dos outros candidatos de direita e centro", missao: true },
            { rotulo: "Chapa nos 10 bairros dele", valor: `${num(n(h, "lift_chapa"), 2)}×`, sub: "a fatia da chapa no resto da cidade" },
            { rotulo: "Herança com o Renan", valor: num(n(h, "corr_renan"), 2), sub: `mais alinhado que ${pct(n(h, "percentil_renan"))} da direita` },
            ...(hc
              ? [{ rotulo: "Herança nas cidades do estado", valor: num(n(hc, "corr_chapa"), 2), sub: `mais alinhado que ${pct(n(hc, "percentil_chapa"))} da direita (${num(n(hc, "ctrl_n"))})`, missao: true }]
              : []),
          ]}
        />
        {c26 && (
          <Kpis
            itens={[
              { rotulo: "Retenção", valor: pct(n(x, "retencao")), sub: `votos 2026 ÷ votos ${m.ano_antes} · base nos mesmos lugares: ${num(n(x, "corr_base"), 2)}` },
              { rotulo: "Fatia do Missão 2026", valor: pct(n(x, "fatia_missao_2026")), sub: "do voto do partido no cargo, no estado" },
              { rotulo: "Voto próprio 2026", valor: num(n(c26, "voto_proprio")), sub: `${pct(n(c26, "voto_proprio") / n(c26, "votos"))} dos votos dele; o resto acompanha o 14` },
              {
                rotulo: "Com os outros do Missão",
                valor: num(n(x, "canibalizacao"), 2),
                sub: n(x, "canibalizacao") >= 0.3 ? "sobem juntos nos mesmos lugares (não disputaram o eleitor)" : n(x, "canibalizacao") <= -0.3 ? "um sobe onde o outro cai: disputaram o eleitor" : "sem relação clara",
              },
            ]}
          />
        )}
      </Secao>

      <Secao titulo={`O futuro: vereador em ${t(f, "cidade")} em 2028`} sub="Os votos dele e os do Missão na cidade contra o quociente de vereador estimado para 2028." explica="vereador-2028">
        <Kpis
          itens={[
            { rotulo: "QE vereador 2028 (estimado)", valor: num(n(f, "qe_2028")), sub: `2024: ${num(n(f, "qe_2024"))} · mínimo individual (10%): ${num(n(f, "qe_2028") * 0.1)}` },
            {
              rotulo: `Votos dele em ${t(f, "cidade")}`,
              valor: num(n(f, "votos_na_cidade_antes")),
              sub: `${pct(n(f, "votos_na_cidade_antes") / n(f, "qe_2028"))} do QE · ${pct(n(f, "votos_na_cidade_antes") / (n(f, "qe_2028") * 0.1))} do mínimo individual (em ${m.ano_antes})`,
              missao: true,
            },
            { rotulo: "Renan na cidade em 2026", valor: num(n(f, "renan_cidade_2026")), sub: `${num(n(f, "renan_cidade_2026") / n(f, "qe_2028"), 2)} QE se fosse voto de chapa` },
            { rotulo: "Chapa DF do Missão na cidade", valor: num(n(f, "chapa_df_cidade_2026")), sub: `${num(n(f, "chapa_df_cidade_2026") / n(f, "qe_2028"), 2)} QE · legenda ${num(n(f, "legenda_df_cidade_2026"))}` },
            { rotulo: "Renan nos 10 bairros dele", valor: num(n(f, "renan_na_base")), sub: `${num(n(f, "a_converter_na_base"))} deles não votaram na chapa em 2026`, missao: true },
          ]}
        />
      </Secao>

      <Secao titulo={`A base dele em ${t(f, "cidade")}, bairro a bairro`} sub={`Votos de ${m.ano_antes} e o que o Missão fez em cada bairro em 2026 (situação do 14 com a régua da cidade).`} explica="decisao">
        <Tabela
          linhas={m.bairros}
          ordem="votos_antes"
          arquivo={`movimento-${m.nome.toLowerCase().replace(/\s+/g, "-")}`}
          colunas={[
            { chave: "bairro", rotulo: "Bairro", tipo: "txt" },
            { chave: "eleitorado", rotulo: "Eleitores" },
            { chave: "votos_antes", rotulo: `Votos dele ${m.ano_antes}` },
            { chave: "fatia_antes", rotulo: "Fatia dele", tipo: "pct" },
            { chave: "situacao", rotulo: "Situação do 14 (2026)", tipo: "txt" },
            { chave: "missao_pres", rotulo: "Renan 2026" },
            { chave: "a_converter", rotulo: "Renan sem voto na chapa" },
            ...(c26
              ? [
                  { chave: "votos_26", rotulo: "Votos dele 2026" },
                  { chave: "proprio", rotulo: "Próprios 2026", valor: (l: Linha) => n(l, "votos_26") - n(l, "puxado_26") },
                ]
              : []),
          ]}
        />
      </Secao>
    </>
  );
}
