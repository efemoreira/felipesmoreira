"use client";
import React, { useMemo, useState } from "react";
import { PAINEL_DADOS as P } from "@/lib/theme";
import {
  carregarAdversarios,
  carregarBairros,
  carregarGente,
  carregarUf,
  n,
  normalizar,
  t,
  temBairros,
  useRecurso,
  type Gente,
  type Linha,
  type Resumo,
} from "../dados";
import { num, pct, titulo } from "../formato";
import { QUADRANTES, Quadrantes } from "../graficos";
import { Carregando, Chips, Escolha, Filtros, Kpis, Legenda, Nota, Secao, SeletorUf, Tabela } from "../pecas";
import { pontos } from "../apoio";

/**
 * Decisões: em que situação o Missão está em cada lugar e de quem é o voto ali.
 *
 * Situação do 14 (só o Missão): quem já digita 14 para Presidente (propensão) e
 * quanto disso já vira voto no deputado do Missão (conversão). Separa o lugar
 * JÁ CONVERTIDO do lugar com POTENCIAL — o eleitor do 14 que ainda não votou
 * no deputado. Por candidato: o voto que o 14 do lugar explica (puxado) e o
 * que é dele (próprio). Nada aqui recomenda: é regra numérica, à vista
 * (forca.py no projeto de análise), cruzada com o adversário que caiu ali e
 * com a gente que já temos.
 */

const SITUACOES = ["Potencial", "Convertido", "Base de candidato", "Fora da base"] as const;
type Modo = "cidades" | "bairros";

const carregarGenteUma = () => carregarGente();

export default function Decisoes({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const opcoesUf = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz");
  const [modo, setModo] = useState<Modo>("cidades");
  const [codigo, setCodigo] = useState("");
  const [filtro, setFiltro] = useState<"todos" | (typeof SITUACOES)[number]>("todos");
  const [ativo, setAtivo] = useState<string | null>(null);

  const dadosUf = useRecurso(uf, carregarUf);
  const adv = useRecurso(resumo.bairrosUfs?.includes(uf) ? uf : null, carregarAdversarios);
  const gente = useRecurso("gente", carregarGenteUma);
  const cidades = useMemo(() => dadosUf.dado?.cidades ?? [], [dadosUf.dado]);
  const comBairro = useMemo(() => [...cidades].filter((c) => temBairros(resumo, uf, c)).sort((a, b) => n(b, "eleitorado") - n(a, "eleitorado")), [cidades, resumo, uf]);
  const cod = codigo && comBairro.some((c) => String(c.municipio_codigo) === codigo) ? codigo : String(comBairro[0]?.municipio_codigo ?? "");
  const bairros = useRecurso(modo === "bairros" && cod ? `${uf}/${cod}` : null, carregarBairros);
  const cidadeEscolhida = cidades.find((c) => String(c.municipio_codigo) === cod);

  const nomeCand = useMemo(() => new Map(resumo.candidatos.map((c) => [String(c.candidato_sq), t(c, "candidato_urna")])), [resumo.candidatos]);
  const genteCidade = useMemo(() => indiceGente(gente.dado), [gente.dado]);

  /* uma linha por lugar, com o mesmo formato nos dois recortes */
  const linhas: Linha[] = useMemo(() => {
    const comum = (l: Linha) => ({
      eleitorado: n(l, "eleitorado"),
      situacao: t(l, "situacao"),
      i14: n(l, "i14"),
      conversao: n(l, "conversao"),
      conv_rel: n(l, "conv_rel"),
      a_converter: n(l, "a_converter"),
      espaco: n(l, "espaco"),
      renan: n(l, "missao_pres"),
      melhor_proprio: n(l, "melhor_proprio"),
    });
    if (modo === "cidades") {
      const tempo = new Map((adv.dado?.cidades ?? []).map((c) => [String(c.municipio_codigo), c]));
      return cidades.map((c) => {
        const tp = tempo.get(String(c.municipio_codigo));
        const g = genteCidade.get(normalizar(t(c, "municipio_nome")));
        return {
          id: String(c.municipio_codigo),
          lugar: titulo(t(c, "municipio_nome")),
          ...comum(c),
          oportunidade: (n(c, "direita_de") || 0) + (n(c, "renan_nao_convertido_de") || 0),
          melhor: nomeCand.get(t(c, "melhor_nome")) ?? "",
          solto: n(tp, "solto"),
          andou: n(tp, "var_lado_pres"),
          gente: g?.total ?? 0,
          gente_militantes: (g?.porTipo.militante ?? 0) + (g?.porTipo.coordenador ?? 0),
        } as Linha;
      });
    }
    const d = bairros.dado;
    if (!d) return [];
    const gb = genteCidade.get(normalizar(t(cidadeEscolhida, "municipio_nome")))?.bairros ?? new Map();
    return d.bairros.map((b, i) => {
      const g = gb.get(normalizar(t(b, "bairro"))) ?? gb.get(normalizar(t(b, "bairro_chave")));
      return {
        id: String(i),
        lugar: t(b, "bairro"),
        ...comum(b),
        oportunidade: n(b, "oportunidade"),
        melhor: Number.isFinite(n(b, "melhor_p")) ? t(d.pessoas[n(b, "melhor_p")], "nome") : "",
        solto: n(b, "solto"),
        andou: n(b, "var_lado_pres"),
        gente: g?.total ?? 0,
        gente_militantes: (g?.porTipo.militante ?? 0) + (g?.porTipo.coordenador ?? 0),
      } as Linha;
    });
  }, [modo, cidades, adv.dado, bairros.dado, genteCidade, nomeCand, cidadeEscolhida]);

  const visiveis = filtro === "todos" ? linhas : linhas.filter((l) => l.situacao === filtro);
  const temGente = gente.dado?.permitido === true;
  const lugar = linhas.find((l) => l.id === ativo);
  const regua = modo === "cidades" ? "do estado" : "da cidade";

  /* candidatos do Missão no lugar escolhido: votos, o que o 14 dali explica e o que é dele */
  const nomes = useMemo(() => {
    if (!lugar) return [];
    const linha = (nome: string, votos: number, puxado: number, extra: Record<string, unknown> = {}) =>
      ({ nome, votos, puxado, proprio: votos - puxado, pct_proprio: Math.max(0, votos - puxado) / votos, ...extra }) as Linha;
    if (modo === "cidades") {
      return (dadosUf.dado?.proprio ?? [])
        .filter((p) => String(p.municipio_codigo) === lugar.id)
        .map((p) =>
          linha(nomeCand.get(String(p.cand)) ?? String(p.cand), p.votos, p.puxado, {
            melhor_bairro: p.melhor_bairro ? `${p.melhor_bairro} (+${num((p.mb_votos ?? 0) - (p.mb_puxado ?? 0))} próprios)` : "",
          }),
        );
    }
    const d = bairros.dado;
    return (d?.proprio ?? []).filter((p) => String(p.b) === lugar.id).map((p) => linha(t(d?.pessoas[p.p], "nome"), p.votos, p.puxado));
  }, [lugar, modo, dadosUf.dado, bairros.dado, nomeCand]);

  const contagem = (q: string) => linhas.filter((l) => l.situacao === q);
  const recorte = modo === "cidades" ? "cidades do estado" : `bairros de ${titulo(t(cidadeEscolhida, "municipio_nome"))}`;

  return (
    <>
      <Nota>
        Um lugar que já vota 14 para Presidente tende a votar no número de um candidato do Missão também. Por isso cada lugar é lido em dois eixos: a{" "}
        <b>propensão ao 14</b> (a fatia do Renan ali, 1,00 = a média {regua}) e a <b>conversão</b> (quanto do voto do Renan virou voto na chapa de deputado,
        1,00 = a média {regua}). Assim um lugar <b>já convertido</b> não se confunde com um lugar de <b>potencial</b> — onde o eleitor do 14 existe e o
        deputado ainda não chegou. É regra numérica, não conselho: a decisão é sua.
      </Nota>
      <Filtros>
        <SeletorUf uf={uf} opcoes={opcoesUf} aoMudar={(u) => { setUf(u); setCodigo(""); setAtivo(null); }} />
        {modo === "bairros" && comBairro.length > 0 && (
          <Escolha
            rotulo="Cidade"
            valor={cod}
            opcoes={comBairro.map((c) => String(c.municipio_codigo))}
            aoMudar={(c) => { setCodigo(c); setAtivo(null); }}
            nome={(c) => titulo(t(comBairro.find((x) => String(x.municipio_codigo) === c), "municipio_nome"))}
          />
        )}
      </Filtros>
      <Chips valor={modo} opcoes={["cidades", "bairros"] as Modo[]} aoMudar={(m) => { setModo(m); setAtivo(null); }} nome={(m) => (m === "cidades" ? "Cidades do estado" : "Bairros de uma cidade")} />

      {!dadosUf.dado || (modo === "bairros" && !bairros.dado) ? (
        <Carregando erro={dadosUf.erro ?? bairros.erro} />
      ) : (
        <>
          <Secao titulo={`Situação do 14 — ${recorte}`} explica="decisao">
            <Kpis
              itens={SITUACOES.map((q) => {
                const ls = contagem(q);
                const semGente = ls.filter((l) => !n(l, "gente")).length;
                return {
                  rotulo: q,
                  valor: num(ls.length),
                  sub:
                    q === "Potencial"
                      ? `${num(ls.reduce((s, l) => s + (n(l, "a_converter") || 0), 0))} eleitores do Renan sem voto na chapa${temGente ? ` · ${num(semGente)} sem ninguém da base` : ""}`
                      : `${num(ls.reduce((s, l) => s + (n(l, "eleitorado") || 0), 0))} eleitores`,
                  missao: q === "Potencial",
                };
              })}
            />
            <Legenda itens={SITUACOES.map((q) => [QUADRANTES[q].cor, QUADRANTES[q].texto])} />
            <Quadrantes
              pontos={linhas
                .filter((l) => l.situacao)
                .map((l) => ({
                  id: String(l.id),
                  x: n(l, "i14"),
                  y: n(l, "conv_rel"),
                  tamanho: n(l, "eleitorado"),
                  quadrante: t(l, "situacao"),
                  texto: `${t(l, "lugar")}: ${t(l, "situacao")} · propensão ao 14 ${num(n(l, "i14"), 2)} · conversão ${num(n(l, "conv_rel"), 2)} · ${num(n(l, "a_converter"))} do Renan sem voto na chapa`,
                }))}
              corteX={1.15}
              corteY={1}
              ativo={ativo}
              aoEscolher={setAtivo}
              rotuloX={`Propensão ao 14 (Renan; 1,00 = média ${regua})`}
              rotuloY={`Conversão na chapa (1,00 = média ${regua})`}
              cantos={["Base de candidato", "Convertido", "Fora da base", "Potencial"]}
            />
          </Secao>

          <Gente estado={gente.dado} erro={gente.erro} />

          <Secao titulo="Lugares" sub="Toque no título da coluna para ordenar; escolha um lugar abaixo para ver o voto de cada nome do Missão ali." explica="decisao">
            <Chips valor={filtro} opcoes={["todos", ...SITUACOES]} aoMudar={setFiltro} nome={(q) => (q === "todos" ? "Todos" : q)} />
            <Tabela
              linhas={visiveis}
              ordem="a_converter"
              arquivo={`decisoes-${modo}-${uf}${modo === "bairros" ? `-${cod}` : ""}`}
              colunas={[
                { chave: "lugar", rotulo: modo === "cidades" ? "Cidade" : "Bairro", tipo: "txt" },
                { chave: "situacao", rotulo: "Situação", tipo: "txt" },
                { chave: "eleitorado", rotulo: "Eleitores" },
                { chave: "i14", rotulo: "Propensão ao 14", tipo: "dec", ajuda: `fatia do Renan ali ÷ a ${regua}` },
                { chave: "conversao", rotulo: "Chapa ÷ Renan", tipo: "pct", ajuda: "melhor chapa do Missão (DF ou DE) ÷ votos do Renan ali" },
                { chave: "a_converter", rotulo: "Renan sem voto na chapa" },
                { chave: "melhor", rotulo: "Mais voto próprio", tipo: "txt" },
                { chave: "melhor_proprio", rotulo: "Votos próprios dele" },
                { chave: "oportunidade", rotulo: "Votos em disputa", ajuda: "direita fora do Missão (Dep. Estadual) + Renan não convertido" },
                { chave: "solto", rotulo: "Voto solto de adversário", ajuda: "o que Direita/Centro em queda perderam aqui desde 2022" },
                { chave: "andou", rotulo: "Andou à direita 22→26", tipo: "txt", valor: (l) => pontos(n(l, "andou")) },
                ...(temGente
                  ? [
                      { chave: "gente", rotulo: "Gente na base" },
                      { chave: "gente_militantes", rotulo: "Militantes e coord." },
                    ]
                  : []),
              ]}
            />
            <Escolha
              rotulo="Abrir lugar"
              valor={ativo ?? ""}
              opcoes={["", ...[...linhas].sort((a, b) => t(a, "lugar").localeCompare(t(b, "lugar"), "pt-BR")).map((l) => String(l.id))]}
              aoMudar={(v) => setAtivo(v || null)}
              nome={(v) => (v ? t(linhas.find((l) => l.id === v), "lugar") : "Escolha um lugar…")}
            />
          </Secao>

          {lugar && (
            <Secao titulo={`${t(lugar, "lugar")}: de quem é o voto`} sub="Puxado = o que o 14 deste lugar daria a cada nome pela taxa típica dele. Próprio = o que ele fez além disso." explica="voto-puxado">
              <Kpis
                itens={[
                  { rotulo: "Situação", valor: t(lugar, "situacao") || "—", missao: true },
                  { rotulo: "Renan aqui", valor: num(n(lugar, "renan")), sub: `propensão ${num(n(lugar, "i14"), 2)}` },
                  { rotulo: "Renan sem voto na chapa", valor: num(n(lugar, "a_converter")), sub: `chapa = ${pct(n(lugar, "conversao"))} do Renan` },
                  { rotulo: "Voto solto de adversário", valor: num(n(lugar, "solto") || 0) },
                  ...(temGente ? [{ rotulo: "Gente na base", valor: num(n(lugar, "gente")), sub: `${num(n(lugar, "gente_militantes"))} militantes e coordenadores` }] : []),
                ]}
              />
              <Tabela
                linhas={nomes}
                ordem="proprio"
                colunas={[
                  { chave: "nome", rotulo: "Candidato", tipo: "txt" },
                  { chave: "votos", rotulo: "Votos" },
                  { chave: "puxado", rotulo: "Puxado pelo 14" },
                  { chave: "proprio", rotulo: "Próprio (ou a menos)" },
                  { chave: "pct_proprio", rotulo: "% próprio", tipo: "pct" },
                  ...(modo === "cidades" ? [{ chave: "melhor_bairro", rotulo: "Melhor bairro dele aqui", tipo: "txt" as const }] : []),
                ]}
              />
            </Secao>
          )}
        </>
      )}
    </>
  );
}

type IndiceGente = Map<string, { total: number; porTipo: Record<string, number>; bairros: Map<string, { total: number; porTipo: Record<string, number> }> }>;

function indiceGente(g: Gente | null): IndiceGente {
  const m: IndiceGente = new Map();
  for (const c of g?.cidades ?? []) {
    m.set(normalizar(c.cidade), { total: c.total, porTipo: c.porTipo, bairros: new Map(c.bairros.map((b) => [normalizar(b.bairro), b])) });
  }
  return m;
}

/** O estado do cruzamento com a base de pessoas do painel. */
function Gente({ estado, erro }: { estado: Gente | null; erro: string | null }) {
  if (estado?.permitido) return null;
  const texto = erro
    ? "Não consegui consultar o painel agora; a coluna de gente fica de fora."
    : !estado
      ? "Consultando o painel…"
      : !estado.autenticado
        ? "Para cruzar com onde temos gente, entre no painel (com acesso a Pessoas) neste mesmo navegador e recarregue a página."
        : "Sua conta do painel não tem a área Pessoas: a coluna de gente fica de fora.";
  return (
    <p style={{ fontSize: 14, margin: "14px 0 0", color: P.tinta, opacity: 0.85 }}>
      {texto}{" "}
      {estado && !estado.autenticado && (
        <a href="/painel/" style={{ color: P.tinta, display: "inline-block", padding: "10px 0", minHeight: 44 }}>
          Abrir o painel
        </a>
      )}
    </p>
  );
}
