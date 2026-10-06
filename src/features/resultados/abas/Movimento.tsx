"use client";
import React, { useMemo, useState } from "react";
import { carregarAdversarios, carregarBairros, carregarUf, carregarVotosPorBairro, n, t, useRecurso, type DadosAdversarios, type DadosUf, type Linha, type Resumo } from "../dados";
import { num, pct, titulo } from "../formato";
import { NOME_CARGO } from "../apoio";
import { Dispersao } from "../graficos";
import { Carregando, Chips, Kpis, Nota, Secao, Tabela, type Kpi } from "../pecas";
import { BARREIRA_SOBRAS, MINIMO_INDIVIDUAL, NOMES_DO_MOVIMENTO, correlacao, type Ano, type NomeDoMovimento } from "../movimento";

/**
 * O movimento antes do partido: Kim, Guto e Pedro Arthur já disputavam voto
 * pelo MBL em 2022/2024, por outras legendas. Aqui fica o que cada um trouxe
 * (ou tirou) do Missão em 2026 e o que leva para a próxima disputa.
 *
 * 2022/2024 de quem concorreu em 2026 vem do arquivo de adversários (a mesma
 * pessoa pelo título); o 2024 de quem só concorreu em 2024 vem de movimento.ts.
 */

/** Tudo o que a vista precisa de um nome, já cruzado. */
type Ficha = {
  nome: NomeDoMovimento;
  c26?: Linha;
  adv?: Linha;
  anos: Ano[];
  cidade?: Linha;
  /** votos dele na cidade-base em 2026 */
  naCidade26?: number;
};

const UFS = Array.from(new Set(NOMES_DO_MOVIMENTO.map((x) => x.uf)));

/** Os anos de uma pessoa: o que o export tem (2022, 2024, 2026) e o que movimento.ts guarda. */
function anosDe(nome: NomeDoMovimento, adv: Linha | undefined, c26: Linha | undefined): Ano[] {
  const anos: Ano[] = [];
  if (adv && n(adv, "votos_22") > 0) {
    anos.push({ ano: 2022, cargo: NOME_CARGO[t(adv, "cargo_key_22")] ?? "", numero: "", partido: t(adv, "partido_sigla_22"), votos: n(adv, "votos_22"), situacao: t(adv, "situacao_22"), onde: nome.uf.toUpperCase() });
  }
  if (adv && n(adv, "votos_24") > 0) {
    anos.push({ ano: 2024, cargo: NOME_CARGO[t(adv, "cargo_key_24")] ?? "", numero: "", partido: t(adv, "partido_sigla_24"), votos: n(adv, "votos_24"), situacao: t(adv, "situacao_24"), onde: "" });
  }
  for (const h of nome.historico) if (!anos.some((a) => a.ano === h.ano)) anos.push(h);
  if (c26) {
    anos.push({ ano: 2026, cargo: t(c26, "cargo_nome"), numero: t(c26, "candidato_numero"), partido: "MISSÃO", votos: n(c26, "votos"), situacao: t(c26, "situacao"), onde: nome.uf.toUpperCase() });
  }
  return anos.sort((a, b) => a.ano - b.ano);
}

const textoAno = (a: Ano | undefined) => (a ? `${a.cargo}${a.numero ? ` ${a.numero}` : ""} · ${a.partido} · ${num(a.votos)} votos` : "—");

export default function Movimento({ resumo }: { resumo: Resumo }) {
  /* os arquivos das UFs dos nomes: hoje são duas (SP e CE); um nome de outra UF pede um terceiro par aqui */
  const advSp = useRecurso(UFS[0] ?? null, carregarAdversarios);
  const advCe = useRecurso(UFS[1] ?? null, carregarAdversarios);
  const ufSp = useRecurso(UFS[0] ?? null, carregarUf);
  const ufCe = useRecurso(UFS[1] ?? null, carregarUf);
  const [quem, setQuem] = useState(NOMES_DO_MOVIMENTO[NOMES_DO_MOVIMENTO.length - 1].id);

  const prontos = [advSp, advCe, ufSp, ufCe];
  const erro = prontos.find((r) => r.erro)?.erro;
  const tudo = prontos.every((r) => r.dado);

  const fichas = useMemo<Ficha[]>(() => {
    if (!tudo) return [];
    const adv: Record<string, DadosAdversarios> = { [UFS[0]]: advSp.dado!, [UFS[1]]: advCe.dado! };
    const ufs: Record<string, DadosUf> = { [UFS[0]]: ufSp.dado!, [UFS[1]]: ufCe.dado! };
    return NOMES_DO_MOVIMENTO.map((nome) => {
      const c26 = nome.sq2026 ? resumo.candidatos.find((c) => t(c, "candidato_sq") === nome.sq2026 && t(c, "uf") === nome.uf) : undefined;
      const a = nome.sq2026 ? adv[nome.uf]?.pessoas.find((p) => String(p.id) === nome.sq2026) : undefined;
      const cidade = ufs[nome.uf]?.cidades.find((c) => String(c.municipio_codigo) === nome.cidade);
      const naCidade26 = nome.sq2026 ? ufs[nome.uf]?.votos.find((v) => v.candidato_sq === nome.sq2026 && v.municipio_codigo === nome.cidade)?.votos : undefined;
      return { nome, c26, adv: a, anos: anosDe(nome, a, c26), cidade, naCidade26 };
    });
  }, [tudo, advSp.dado, advCe.dado, ufSp.dado, ufCe.dado, resumo.candidatos]);

  if (!tudo) return <Carregando erro={erro} />;

  const linhas = fichas.map((f) => {
    const a22 = f.anos.find((a) => a.ano === 2022);
    const a24 = f.anos.find((a) => a.ano === 2024);
    const ultimoNaCidade = f.naCidade26 ?? a24?.votos ?? NaN;
    const qe28 = n(f.cidade, "qe_ver_2028_est");
    return {
      nome: f.nome.nome,
      uf: f.nome.uf.toUpperCase(),
      a22: textoAno(a22),
      a24: textoAno(a24),
      a26: f.c26 ? textoAno(f.anos.find((a) => a.ano === 2026)) : f.nome.fora2026 ? "Não concorreu (idade)" : "Não concorreu",
      votos26: f.c26 ? n(f.c26, "votos") : NaN,
      situacao26: f.c26 ? t(f.c26, "situacao") : "",
      pct_partido: f.c26 ? n(f.c26, "pct_do_partido") : NaN,
      proprio: f.c26 ? n(f.c26, "voto_proprio") : NaN,
      pct_puxado: f.c26 ? n(f.c26, "voto_puxado") / n(f.c26, "votos") : NaN,
      cidade: titulo(t(f.cidade, "municipio_nome")),
      na_cidade: ultimoNaCidade,
      qe28,
      em_qe28: ultimoNaCidade / qe28,
      em_minimo: ultimoNaCidade / (qe28 * MINIMO_INDIVIDUAL),
      proxima: `${f.nome.proxima.ano}: ${f.nome.proxima.cargo} (${f.nome.proxima.onde})`,
    } as Linha;
  });

  const ficha = fichas.find((f) => f.nome.id === quem) ?? fichas[0];

  return (
    <>
      <Nota>
        O Missão não existia em 2022 nem em 2024, mas o movimento já tinha candidato: Kim Kataguiri e Guto Zacarias em São Paulo (pelo União) e Pedro Arthur,
        44999, vereador em Fortaleza em 2024 (pelo União). Esta vista junta o presente (2026) e o futuro (2028/2030) de cada um, e testa se eles ajudaram ou
        atrapalharam o 14.
      </Nota>
      <Secao titulo="O movimento: presente e futuro" sub="Cada nome nos três anos e a régua da próxima disputa na cidade-base. “Último voto na cidade” é o de 2026 (ou o de 2024, para quem não concorreu agora)." explica="movimento">
        <Tabela
          linhas={linhas}
          ordem="votos26"
          arquivo="movimento-presente-futuro"
          colunas={[
            { chave: "nome", rotulo: "Nome", tipo: "txt" },
            { chave: "uf", rotulo: "UF", tipo: "txt" },
            { chave: "a22", rotulo: "2022", tipo: "txt" },
            { chave: "a24", rotulo: "2024", tipo: "txt" },
            { chave: "a26", rotulo: "2026", tipo: "txt" },
            { chave: "situacao26", rotulo: "Situação 2026", tipo: "txt" },
            { chave: "pct_partido", rotulo: "% do Missão", tipo: "pct", ajuda: "Fatia dele nos votos nominais do Missão no cargo e no estado, em 2026" },
            { chave: "pct_puxado", rotulo: "Acompanha o 14", tipo: "pct", ajuda: "Parte do voto dele que segue o Renan cidade a cidade (puxado pelo número)" },
            { chave: "proprio", rotulo: "Voto próprio" },
            { chave: "cidade", rotulo: "Cidade-base", tipo: "txt" },
            { chave: "na_cidade", rotulo: "Último voto na cidade" },
            { chave: "qe28", rotulo: "QE vereador 2028" },
            { chave: "em_qe28", rotulo: "Em QE 2028", tipo: "barra", max: 2 },
            { chave: "em_minimo", rotulo: "Do mínimo individual", tipo: "barra", max: 2, ajuda: "Último voto na cidade ÷ 10% do QE de vereador de 2028. Acima de 1,00 ele já assumiria se a chapa fizer o quociente" },
            { chave: "proxima", rotulo: "Próxima disputa", tipo: "txt" },
          ]}
        />
      </Secao>

      <Chips valor={quem} opcoes={fichas.map((f) => f.nome.id)} aoMudar={setQuem} nome={(id) => fichas.find((f) => f.nome.id === id)?.nome.nome ?? id} />
      {ficha.c26 ? <Deputado ficha={ficha} fichas={fichas} resumo={resumo} /> : <SoMunicipal ficha={ficha} resumo={resumo} />}
      <PorBairro ficha={ficha} />
    </>
  );
}

/* ===== Kim e Guto: concorreram em 2026 ===== */

function Deputado({ ficha: f, fichas, resumo }: { ficha: Ficha; fichas: Ficha[]; resumo: Resumo }) {
  const c = f.c26!;
  const adv = f.adv;
  const cargo = t(c, "cargo_key");
  const uf = resumo.ufs.find((u) => t(u, "uf") === f.nome.uf);
  const qe = n(uf, `qe_${cargo}`);
  const partido = n(uf, `missao_${cargo}`);
  const dele = n(c, "votos");
  const cadeiras = Math.floor(partido / qe);
  const semEle = Math.floor((partido - dele) / qe);
  const faltaProxima = (cadeiras + 1) * qe - partido;

  /* mudou de cargo: o cenário de ter ficado no cargo de 2022 com o voto de 2022 */
  const cargo22 = t(adv, "cargo_key_22");
  const votos22 = n(adv, "votos_22");
  const mudou = cargo22 && cargo22 !== cargo && votos22 > 0;
  const qe22 = n(uf, `qe_${cargo22}`);
  const partido22 = n(uf, `missao_${cargo22}`);
  const cad22 = Math.floor(partido22 / qe22);
  const comEle22 = Math.floor((partido22 + votos22) / qe22);
  const falta22 = (cad22 + 1) * qe22 - partido22;

  const base22 = n(adv, "votos_base_22");
  const base26 = n(adv, "votos_base_26");

  /* os outros nomes do movimento no mesmo estado: o voto de um foi para o outro? */
  const vizinhos = fichas.filter((x) => x !== f && x.c26 && x.nome.uf === f.nome.uf);
  const cidadesJuntas = useCidadesJuntas(f, vizinhos);

  const kpis: Kpi[] = [
    ...f.anos.map((a) => ({ rotulo: String(a.ano), valor: num(a.votos), sub: `${a.cargo}${a.numero ? ` ${a.numero}` : ""} · ${a.partido} · ${a.situacao.toLowerCase()}`, missao: a.ano === 2026 })),
    {
      rotulo: `Base: ${titulo(t(f.cidade, "municipio_nome"))}`,
      valor: Number.isFinite(base26) ? `${num(base22)} → ${num(base26)}` : "—",
      sub: Number.isFinite(base26) && base22 ? `${base26 >= base22 ? "+" : ""}${pct(base26 / base22 - 1)} na cidade onde ele era mais forte` : undefined,
    },
  ];

  return (
    <>
      <Secao titulo={`${f.nome.nome}: de onde veio e para onde foi o voto`} sub={t(c, "candidato_nome")} explica="movimento">
        <Kpis itens={kpis} />
      </Secao>

      <Secao titulo="Ajudou ou atrapalhou o Missão?" sub={`${NOME_CARGO[cargo]} em ${f.nome.uf.toUpperCase()}: o partido fez ${num(partido)} votos, ${num(partido / qe, 2)} quocientes de ${num(qe)}.`} explica="movimento">
        <Kpis
          itens={[
            { rotulo: "Peso no partido", valor: pct(n(c, "pct_do_partido")), sub: "dos votos nominais do Missão no cargo", missao: true },
            { rotulo: "Cadeiras pelo QE", valor: num(cadeiras), sub: `sem os votos dele: ${num(semEle)}`, missao: true },
            { rotulo: "Faltou para a próxima", valor: num(faltaProxima), sub: `votos para a cadeira nº ${num(cadeiras + 1)}` },
            {
              rotulo: "Puxado × próprio",
              valor: pct(n(c, "voto_puxado") / dele),
              sub: `acompanha o 14 · ${num(n(c, "voto_proprio"))} votos são dele (${num(n(c, "k_renan"), 1)} para cada 100 do Renan no lugar típico)`,
            },
          ]}
        />
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 15, lineHeight: 1.55, display: "grid", gap: 6 }}>
          {cadeiras > semEle ? (
            <li>
              <b>Ajudou de forma decisiva:</b> sem os {num(dele)} votos dele, o Missão teria {num((partido - dele) / qe, 2)} quociente(s) e {num(semEle)} cadeira(s) em vez de {num(cadeiras)}.
            </li>
          ) : (
            <li>
              <b>Não mudou o número de cadeiras:</b> com ou sem os {num(dele)} votos dele o Missão fica com {num(cadeiras)}. Faltaram {num(faltaProxima)} votos para a cadeira seguinte
              {faltaProxima < dele ? ` — menos do que ele teve: com os votos dele e um pouco mais de qualquer um, ela vinha.` : "."}
            </li>
          )}
          {n(c, "voto_puxado") / dele > 0.8 && (
            <li>
              {pct(n(c, "voto_puxado") / dele)} do voto dele acompanha o 14 cidade a cidade: a maior parte é o eleitor do Renan que digitou o número. O voto que é dele —
              que iria com ele para outro partido ou outro cargo — fica perto de {num(n(c, "voto_proprio"))}.
            </li>
          )}
          {mudou && (
            <li>
              <b>Mudou de cargo:</b> em 2022 ele fez {num(votos22)} votos para {NOME_CARGO[cargo22]}; em 2026 fez {num(dele)} para {NOME_CARGO[cargo]} (
              {pct(dele / votos22 - 1)}). Se tivesse ficado em {NOME_CARGO[cargo22]} e mantido o voto de 2022, o Missão iria de {num(cad22)} para {num(comEle22)}{" "}
              cadeira(s) lá ({num((partido22 + votos22) / qe22, 2)} quocientes). Para a cadeira seguinte em {NOME_CARGO[cargo22]} faltaram {num(falta22)} votos:{" "}
              {pct(falta22 / votos22)} do que ele teve em 2022.
            </li>
          )}
          {vizinhos.map((v) => (
            <li key={v.nome.id}>
              <b>{v.nome.nome} no mesmo cargo e no mesmo estado:</b> {t(v.c26, "cargo_key") === cargo ? "os dois disputaram o mesmo eleitor do movimento no mesmo número de partido." : "cargos diferentes, sem disputa direta."}{" "}
              {cidadesJuntas.resumo}
            </li>
          ))}
        </ul>
        {cidadesJuntas.linhas.length > 0 && (
          <Tabela
            linhas={cidadesJuntas.linhas}
            ordem="soma_22"
            arquivo={`movimento-${f.nome.uf}-cidades`}
            colunas={[
              { chave: "cidade", rotulo: "Cidade", tipo: "txt" },
              ...cidadesJuntas.nomes.flatMap((nm, i) => [
                { chave: `v22_${i}`, rotulo: `${nm} 2022` },
                { chave: `v26_${i}`, rotulo: `${nm} 2026` },
              ]),
              { chave: "soma_22", rotulo: "Juntos 2022" },
              { chave: "soma_26", rotulo: "Juntos 2026" },
            ]}
          />
        )}
        {cidadesJuntas.linhas.length > 0 && (
          <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0" }}>Só as 6 cidades de mais voto de cada um (2022 e 2026); travessão = fora das 6 dele.</p>
        )}
      </Secao>

      <Futuro ficha={f} ultimo={f.naCidade26 ?? NaN} rotuloUltimo="voto dele na cidade em 2026" />
    </>
  );
}

/** As cidades onde algum dos nomes teve voto: os dois anos de cada um, lado a lado. */
function useCidadesJuntas(f: Ficha, vizinhos: Ficha[]) {
  const adv = useRecurso(vizinhos.length ? f.nome.uf : null, carregarAdversarios);
  const ufd = useRecurso(vizinhos.length ? f.nome.uf : null, carregarUf);
  return useMemo(() => {
    const vazio = { linhas: [] as Linha[], nomes: [] as string[], resumo: "" };
    if (!adv.dado || !ufd.dado || !vizinhos.length) return vazio;
    const todos = [f, ...vizinhos];
    const nomes = todos.map((x) => x.nome.nome.split(" ")[0]);
    const nomeCidade = new Map(ufd.dado.cidades.map((c) => [String(c.municipio_codigo), titulo(t(c, "municipio_nome"))]));
    const porCidade = new Map<string, Linha>();
    todos.forEach((x, i) => {
      for (const c of adv.dado!.cidadesPessoa.filter((cp) => String(cp.id) === x.nome.sq2026)) {
        const cod = String(c.municipio_codigo);
        const l = porCidade.get(cod) ?? ({ cod, cidade: nomeCidade.get(cod) ?? cod } as Linha);
        l[`v22_${i}`] = n(c, "votos_22") || 0;
        l[`v26_${i}`] = n(c, "votos") || 0;
        porCidade.set(cod, l);
      }
    });
    const linhas = Array.from(porCidade.values()).map((l) => ({
      ...l,
      soma_22: todos.reduce((s, _, i) => s + (n(l, `v22_${i}`) || 0), 0),
      soma_26: todos.reduce((s, _, i) => s + (n(l, `v26_${i}`) || 0), 0),
    })) as Linha[];
    const base = linhas.find((l) => t(l, "cod") === f.nome.cidade);
    let resumo = "";
    if (base) {
      const partes = todos.map((x, i) => `${nomes[i]} ${num(n(base, `v22_${i}`))} → ${num(n(base, `v26_${i}`))}`).join("; ");
      resumo = `Em ${t(base, "cidade")}: ${partes}. Juntos: ${num(n(base, "soma_22"))} → ${num(n(base, "soma_26"))}. Quando um cai o que o outro sobe, o eleitor do movimento só trocou de nome dentro do 14.`;
    }
    return { linhas, nomes, resumo };
  }, [adv.dado, ufd.dado, f, vizinhos]);
}

/* ===== Pedro Arthur: só 2024 (sem idade para 2026) ===== */

function SoMunicipal({ ficha: f, resumo }: { ficha: Ficha; resumo: Resumo }) {
  const a24 = f.anos.find((a) => a.ano === 2024);
  const cid = f.cidade;
  const uf = resumo.ufs.find((u) => t(u, "uf") === f.nome.uf);
  const qe24 = n(cid, "qe_ver_2024");
  const nomeCid = titulo(t(cid, "municipio_nome"));

  /* a cidade dentro do estado: se ela rende mais que o resto, é coerente com o voto dele ter ido para o 14 */
  const fatiaEleitores = n(cid, "eleitorado") / n(uf, "eleitorado");
  const fatiaRenan = n(cid, "missao_pres") / n(uf, "missao_pres");
  const fatiaDf = n(cid, "missao_df") / n(uf, "missao_df");
  const convCidade = n(cid, "aproveitamento_df");
  const convUf = n(uf, "aproveitamento_df");
  const capitais = useComparaCapitais(resumo, f.nome.uf, f.nome.cidade);

  return (
    <>
      <Secao titulo={`${f.nome.nome}: o voto de 2024`} sub={f.nome.fora2026} explica="movimento">
        <Kpis
          itens={[
            { rotulo: `${a24?.cargo} ${a24?.ano}`, valor: num(a24?.votos ?? NaN), sub: `${a24?.numero} · ${a24?.partido} · ${a24?.situacao}`, missao: true },
            { rotulo: "Do QE de 2024", valor: pct((a24?.votos ?? NaN) / qe24), sub: `QE de ${num(qe24)} · o mínimo individual era 10% (${num(qe24 * MINIMO_INDIVIDUAL)})`, missao: true },
            { rotulo: "Do mínimo individual", valor: pct((a24?.votos ?? NaN) / (qe24 * MINIMO_INDIVIDUAL)), sub: "em 2024: ficou logo abaixo" },
            { rotulo: "Cadeiras na cidade", valor: num(n(cid, "vagas_ver")), sub: `${num(n(cid, "eleitores_por_vereador"))} eleitores por vereador` },
          ]}
        />
        {a24?.fonte && <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0" }}>Fonte: {a24.fonte}.</p>}
      </Secao>

      <Secao titulo={`Ele puxou voto para o Missão em ${nomeCid}?`} sub="Sem o voto dele por bairro, a cidade inteira é a única régua: ela rende mais para o 14 do que o resto do estado — e mais do que as outras capitais?" explica="movimento">
        <Kpis
          itens={[
            { rotulo: "Eleitores do estado", valor: pct(fatiaEleitores), sub: `${nomeCid} no ${f.nome.uf.toUpperCase()}` },
            { rotulo: "Votos do Renan", valor: pct(fatiaRenan), sub: `${num(n(cid, "missao_pres"))} votos aqui`, missao: true },
            { rotulo: "Missão Dep. Federal", valor: pct(fatiaDf), sub: `${num(n(cid, "missao_df"))} votos aqui`, missao: true },
            { rotulo: "Renan → deputado", valor: pct(convCidade), sub: `no estado: ${pct(convUf)} · ${num(convCidade / convUf, 2)}× o estado`, missao: true },
          ]}
        />
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 15, lineHeight: 1.55, display: "grid", gap: 6 }}>
          <li>
            {nomeCid} tem {pct(fatiaEleitores)} dos eleitores do estado e deu {pct(fatiaRenan)} dos votos do Renan e {pct(fatiaDf)} do Missão para Dep. Federal: o 14 rende mais
            aqui, e o eleitor do Renan virou voto de deputado {num(convCidade / convUf, 2)} vez(es) mais do que no estado.
          </li>
          <li>
            Capital costuma render mais para o Missão em todo o país, então a comparação justa é com as outras capitais.{" "}
            {capitais.dado ? (
              <>
                Na mediana das capitais, a capital converteu {num(capitais.dado.mediana, 2)}× o próprio estado; {nomeCid}, {num(capitais.dado.esta, 2)}× —{" "}
                {capitais.dado.posicao}º de {capitais.dado.total}.{" "}
                {capitais.dado.esta > capitais.dado.mediana
                  ? "Acima da mediana: há sobra compatível com um voto local do movimento, mas pequena demais para cravar que é dele."
                  : "Na mediana ou abaixo: a cidade não mostra efeito além do de ser capital."}
              </>
            ) : (
              <button type="button" onClick={capitais.carregar} style={{ font: "inherit", fontWeight: 600, textDecoration: "underline", background: "none", border: 0, padding: "10px 0", minHeight: 44, cursor: "pointer", color: "inherit" }}>
                {capitais.carregando ? "Carregando as 27 UFs…" : "Comparar com as outras capitais (baixa ~7 MB)"}
              </button>
            )}
          </li>
          <li>
            O teste que separa o voto dele do efeito capital é o bairro: o Missão de 2026 foi melhor justamente onde o {a24?.numero} teve voto em 2024? Veja “Por bairro” abaixo.
          </li>
        </ul>
      </Secao>

      <Futuro ficha={f} ultimo={a24?.votos ?? NaN} rotuloUltimo={`voto dele em ${a24?.ano}`} />
    </>
  );
}

/** Conversão Renan → deputado da capital ÷ a do estado, nas 27 capitais (só sob demanda: são todos os arquivos de UF). */
function useComparaCapitais(resumo: Resumo, uf: string, cidade: string) {
  const [estado, setEstado] = useState<{ carregando: boolean; dado: { mediana: number; esta: number; posicao: number; total: number } | null }>({ carregando: false, dado: null });
  const carregar = () => {
    if (estado.carregando) return;
    setEstado({ carregando: true, dado: null });
    const ufs = resumo.ufs.map((u) => t(u, "uf")).filter((u) => u && u !== "zz");
    Promise.all(ufs.map((u) => carregarUf(u).then((d) => ({ u, d }))))
      .then((todas) => {
        const rel: { u: string; cod: string; r: number }[] = [];
        for (const { u, d } of todas) {
          const cap = d.cidades.find((c) => c.capital === true);
          const linhaUf = resumo.ufs.find((x) => t(x, "uf") === u);
          const r = n(cap, "aproveitamento_df") / n(linhaUf, "aproveitamento_df");
          if (cap && Number.isFinite(r) && r > 0 && u !== "df") rel.push({ u, cod: String(cap.municipio_codigo), r });
        }
        rel.sort((a, b) => b.r - a.r);
        const meio = rel.map((x) => x.r).sort((a, b) => a - b);
        const mediana = meio.length % 2 ? meio[(meio.length - 1) / 2] : (meio[meio.length / 2 - 1] + meio[meio.length / 2]) / 2;
        const i = rel.findIndex((x) => x.u === uf && x.cod === cidade);
        setEstado({ carregando: false, dado: { mediana, esta: rel[i]?.r ?? NaN, posicao: i + 1, total: rel.length } });
      })
      .catch(() => setEstado({ carregando: false, dado: null }));
  };
  return { ...estado, carregar };
}

/* ===== A próxima disputa: vereador 2028 na cidade-base ===== */

function Futuro({ ficha: f, ultimo, rotuloUltimo }: { ficha: Ficha; ultimo: number; rotuloUltimo: string }) {
  const cid = f.cidade;
  if (!cid || !f.nome.proxima.vereador) return null;
  const nomeCid = titulo(t(cid, "municipio_nome"));
  const qe28 = n(cid, "qe_ver_2028_est");
  const minimo = qe28 * MINIMO_INDIVIDUAL;
  const missaoDf = n(cid, "missao_df");
  const renan = n(cid, "missao_pres");
  const cenarios = [
    { cenario: "Missão para Dep. Federal em 2026", votos: missaoDf },
    ...(f.c26 ? [] : [{ cenario: `Missão Dep. Federal 2026 + o ${rotuloUltimo}`, votos: missaoDf + ultimo }]),
    { cenario: "Melhor votação de deputado do Missão na cidade", votos: n(cid, "missao_melhor_prop") },
    { cenario: "Todos os votos do Renan na cidade", votos: renan },
  ].map((c) => ({ ...c, em_qe: c.votos / qe28, cadeiras: Math.floor(c.votos / qe28), sobras: c.votos >= qe28 * BARREIRA_SOBRAS ? "Sim" : "Não", falta: Math.max(0, qe28 * BARREIRA_SOBRAS - c.votos) }) as Linha);

  return (
    <Secao titulo={`${f.nome.proxima.ano}: ${f.nome.proxima.cargo}`} sub={`Vereador em ${nomeCid}: a chapa precisa do quociente (ou de 80% dele para as sobras) e ele precisa de 10% do quociente em voto próprio.`} explica="movimento-2028">
      <Kpis
        itens={[
          { rotulo: "QE estimado 2028", valor: num(qe28), sub: `2024: ${num(n(cid, "qe_ver_2024"))} · ${num(n(cid, "vagas_ver"))} cadeiras` },
          { rotulo: "Mínimo individual", valor: num(minimo), sub: "10% do QE, em voto nominal" },
          { rotulo: "Ele já tem", valor: pct(ultimo / minimo), sub: `${rotuloUltimo}: ${num(ultimo)}${ultimo < minimo ? ` · faltam ${num(minimo - ultimo)}` : ""}`, missao: true },
          { rotulo: "Ele sozinho em QE", valor: num(ultimo / qe28, 2), sub: ultimo >= qe28 ? "faria a cadeira sem ninguém" : "precisa da chapa", missao: true },
        ]}
      />
      <Tabela
        linhas={cenarios}
        ordem="votos"
        arquivo={`movimento-${f.nome.id}-2028`}
        colunas={[
          { chave: "cenario", rotulo: "Se a chapa tivesse…", tipo: "txt" },
          { chave: "votos", rotulo: "Votos" },
          { chave: "em_qe", rotulo: "Em QE 2028", tipo: "barra", max: 2 },
          { chave: "cadeiras", rotulo: "Cadeiras pelo QE" },
          { chave: "sobras", rotulo: "Disputa sobras (80%)", tipo: "txt" },
          { chave: "falta", rotulo: "Falta para 80%" },
        ]}
      />
      <p style={{ fontSize: 13, opacity: 0.75, margin: "6px 0 0" }}>
        Leitura: o voto de deputado mostra o piso de quem já digitou 14 na cidade; o do Renan, o teto do eleitor que já está com o partido. A chapa de vereador
        vive entre os dois — e o nome dele só assume se, além da chapa passar, ele estiver entre os mais votados dela e acima do mínimo individual.
      </p>
    </Secao>
  );
}

/* ===== Por bairro: o voto dele no ano anterior × o Missão de 2026 ===== */

/** Coluna de válidos do bairro no ano e cargo do arquivo do script. */
const VALIDOS: Record<string, string> = { "2024-ver": "validos_ver_24", "2022-de": "validos_de_22", "2022-df": "validos_df_22" };

function PorBairro({ ficha: f }: { ficha: Ficha }) {
  const antes = f.nome.bairros?.[0];
  const cidade = useRecurso(`${f.nome.uf}/${f.nome.cidade}`, carregarBairros);
  const anterior = useRecurso(antes?.arquivo ?? null, carregarVotosPorBairro);
  const cargo26 = t(f.c26, "cargo_key") || "df";

  const linhas = useMemo(() => {
    const d = cidade.dado;
    if (!d) return [];
    const ip = f.nome.sq2026 ? d.pessoas.findIndex((p) => String(p.id) === f.nome.sq2026) : -1;
    const dele26 = new Map(d.candidatos.filter((x) => x.p === ip && x.cargo_key === cargo26).map((x) => [x.b, x.votos]));
    const prop26 = new Map(d.proprio.filter((x) => x.p === ip).map((x) => [x.b, x]));
    const ant = anterior.dado ? new Map(anterior.dado.bairros.map((x) => [x.bairro_chave, x.votos])) : null;
    const colValidos = anterior.dado ? VALIDOS[`${anterior.dado.ano}-${anterior.dado.cargo}`] : "";
    return d.bairros.map((b, i) => {
      const renan = n(b, "missao_pres");
      const missao = n(b, `missao_${cargo26}`);
      const vAnt = ant ? ant.get(t(b, "bairro_chave")) ?? 0 : NaN;
      return {
        bairro: t(b, "bairro"),
        eleitorado: n(b, "eleitorado"),
        renan,
        pct_renan: renan / n(b, "validos_pres"),
        missao,
        pct_missao: missao / n(b, `validos_${cargo26}`),
        conversao: missao / renan,
        dele26: dele26.get(i) ?? (ip >= 0 ? 0 : NaN),
        proprio26: prop26.has(i) ? prop26.get(i)!.votos - prop26.get(i)!.puxado : NaN,
        antes: vAnt,
        pct_antes: colValidos ? vAnt / n(b, colValidos) : NaN,
      } as Linha;
    });
  }, [cidade.dado, anterior.dado, f.nome.sq2026, cargo26]);

  const comAntes = anterior.dado && linhas.length > 0;
  const grandes = linhas.filter((l) => n(l, "eleitorado") >= 2000);
  const rMissao = comAntes ? correlacao(grandes.map((l) => n(l, "pct_antes")), grandes.map((l) => n(l, "pct_missao"))) : NaN;
  const rConv = comAntes ? correlacao(grandes.map((l) => n(l, "pct_antes")), grandes.map((l) => n(l, "conversao"))) : NaN;
  const rRenan = comAntes ? correlacao(grandes.map((l) => n(l, "pct_antes")), grandes.map((l) => n(l, "pct_renan"))) : NaN;
  const nomeCid = titulo(t(f.cidade, "municipio_nome"));

  return (
    <Secao titulo={`Por bairro em ${nomeCid}`} sub={`O Missão de 2026 (${NOME_CARGO[cargo26]}) e o Renan em cada bairro${f.c26 ? ", com o voto dele em 2026" : ""}${antes ? `, e o voto dele em ${antes.rotulo}` : ""}.`} explica="movimento-bairro">
      {!cidade.dado ? (
        <Carregando erro={cidade.erro} />
      ) : (
        <>
          {antes && !anterior.dado && (
            <Nota>
              O voto de {antes.rotulo} por bairro ainda não foi gerado (falta <code>public/resultados-2026/movimento/{antes.arquivo}.json</code>). Ele sai da votação por
              seção do TSE com <code>node scripts/votos-por-bairro.mjs</code> — o comando está no topo do script. Sem ele, a tabela abaixo mostra o terreno do Missão em
              2026, que é onde a chapa de {f.nome.proxima.ano} já tem eleitor.
            </Nota>
          )}
          {comAntes && (
            <>
              <Kpis
                itens={[
                  { rotulo: `Voto em ${anterior.dado!.ano} somado`, valor: num(anterior.dado!.total), sub: `${num(anterior.dado!.semBairro)} em local sem bairro casado` },
                  { rotulo: "× Missão 2026", valor: num(rMissao, 2), sub: "correlação nos bairros de 2 mil+ eleitores", missao: true },
                  { rotulo: "× Renan 2026", valor: num(rRenan, 2), sub: "o mesmo eleitor do Renan?" },
                  { rotulo: "× conversão", valor: num(rConv, 2), sub: "Missão ÷ Renan: descontado o Renan", missao: true },
                ]}
              />
              <p style={{ fontSize: 14.5, margin: "6px 0 10px", lineHeight: 1.5 }}>
                {Number.isFinite(rConv) && rConv >= 0.3
                  ? "Onde ele tinha voto, o eleitor do Renan virou voto de deputado mais do que no resto da cidade: sinal de que o voto dele foi junto para o 14."
                  : Number.isFinite(rMissao) && rMissao >= 0.3
                    ? "O Missão foi melhor onde ele tinha voto, mas o Renan também: o mais provável é que os dois falem com o mesmo eleitor, não que ele tenha transferido voto."
                    : "O Missão de 2026 não seguiu o desenho do voto dele: o voto dele não aparece como transferido para o 14."}
              </p>
              <Dispersao
                rotuloX={`% dele em ${anterior.dado!.ano}`}
                rotuloY="% do Missão em 2026"
                pontos={grandes.map((l) => ({ id: t(l, "bairro"), x: n(l, "pct_antes"), y: n(l, "pct_missao"), tamanho: n(l, "eleitorado"), texto: `${t(l, "bairro")}: ${pct(n(l, "pct_antes"), 2)} dele em ${anterior.dado!.ano} · Missão ${pct(n(l, "pct_missao"), 2)} em 2026` }))}
              />
            </>
          )}
          <Tabela
            linhas={linhas}
            ordem={comAntes ? "antes" : f.c26 ? "dele26" : "missao"}
            arquivo={`movimento-${f.nome.id}-bairros`}
            colunas={[
              { chave: "bairro", rotulo: "Bairro", tipo: "txt" },
              { chave: "eleitorado", rotulo: "Eleitores" },
              ...(comAntes
                ? [
                    { chave: "antes", rotulo: `Dele em ${anterior.dado!.ano}` },
                    { chave: "pct_antes", rotulo: `% dele ${anterior.dado!.ano}`, tipo: "pct" as const },
                  ]
                : []),
              ...(f.c26
                ? [
                    { chave: "dele26", rotulo: "Dele em 2026" },
                    { chave: "proprio26", rotulo: "Próprio 2026", ajuda: "Votos dele menos o que o 14 do bairro explica" },
                  ]
                : []),
              { chave: "renan", rotulo: "Renan 2026" },
              { chave: "missao", rotulo: `Missão ${NOME_CARGO[cargo26]}` },
              { chave: "pct_missao", rotulo: "% Missão", tipo: "pct" },
              { chave: "conversao", rotulo: "Renan → deputado", tipo: "barra", max: 1 },
            ]}
          />
        </>
      )}
    </Secao>
  );
}
