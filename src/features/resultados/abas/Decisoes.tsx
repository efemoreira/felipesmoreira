"use client";
import React, { useMemo, useState } from "react";
import { C } from "@/lib/theme";
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
 * Decisões: onde nutrir, crescer, atacar ou esperar — e qual nome do Missão é
 * melhor DE FATO em cada lugar. Nada aqui recomenda: é a classificação pela
 * regra numérica (src/forca.py no projeto de análise) e os números que a
 * explicam, cruzados com o adversário que caiu ali e com a gente que já temos.
 */

const QS = ["Crescer", "Nutrir", "Atacar", "Esperar"] as const;
type Modo = "cidades" | "bairros";

const carregarGenteUma = () => carregarGente();

export default function Decisoes({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const opcoesUf = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz");
  const [modo, setModo] = useState<Modo>("cidades");
  const [codigo, setCodigo] = useState("");
  const [filtro, setFiltro] = useState<"todos" | (typeof QS)[number]>("todos");
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
    if (modo === "cidades") {
      const tempo = new Map((adv.dado?.cidades ?? []).map((c) => [String(c.municipio_codigo), c]));
      return cidades.map((c) => {
        const tp = tempo.get(String(c.municipio_codigo));
        const g = genteCidade.get(normalizar(t(c, "municipio_nome")));
        return {
          id: String(c.municipio_codigo),
          lugar: titulo(t(c, "municipio_nome")),
          eleitorado: n(c, "eleitorado"),
          quadrante: t(c, "quadrante"),
          forca_partido: n(c, "forca_partido"),
          espaco: n(c, "espaco"),
          oportunidade: (n(c, "direita_de") || 0) + (n(c, "renan_nao_convertido_de") || 0),
          melhor: nomeCand.get(t(c, "melhor_nome")) ?? "",
          melhor_a_mais: n(c, "melhor_a_mais"),
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
        eleitorado: n(b, "eleitorado"),
        quadrante: t(b, "quadrante"),
        forca_partido: n(b, "forca_partido"),
        espaco: n(b, "espaco"),
        oportunidade: n(b, "oportunidade"),
        melhor: Number.isFinite(n(b, "melhor_p")) ? t(d.pessoas[n(b, "melhor_p")], "nome") : "",
        melhor_a_mais: n(b, "melhor_a_mais"),
        solto: n(b, "solto"),
        andou: n(b, "var_lado_pres"),
        gente: g?.total ?? 0,
        gente_militantes: (g?.porTipo.militante ?? 0) + (g?.porTipo.coordenador ?? 0),
      } as Linha;
    });
  }, [modo, cidades, adv.dado, bairros.dado, genteCidade, nomeCand, cidadeEscolhida]);

  const visiveis = filtro === "todos" ? linhas : linhas.filter((l) => l.quadrante === filtro);
  const corteY = mediana(linhas.filter((l) => l.quadrante).map((l) => n(l, "espaco")));
  const temGente = gente.dado?.permitido === true;
  const lugar = linhas.find((l) => l.id === ativo);

  /* candidatos do Missão no lugar escolhido: votos × o que o partido explicaria ali */
  const nomes = useMemo(() => {
    if (!lugar) return [];
    if (modo === "cidades") {
      return (dadosUf.dado?.proprio ?? [])
        .filter((p) => String(p.municipio_codigo) === lugar.id)
        .map((p) => ({ nome: nomeCand.get(String(p.cand)) ?? String(p.cand), votos: p.votos, esperado: p.esperado, a_mais: p.votos - p.esperado, forca: p.votos / p.esperado }) as Linha);
    }
    const d = bairros.dado;
    return (d?.proprio ?? [])
      .filter((p) => String(p.b) === lugar.id)
      .map((p) => ({ nome: t(d?.pessoas[p.p], "nome"), votos: p.votos, esperado: p.esperado, a_mais: p.votos - p.esperado, forca: p.votos / p.esperado }) as Linha);
  }, [lugar, modo, dadosUf.dado, bairros.dado, nomeCand]);

  const contagem = (q: string) => linhas.filter((l) => l.quadrante === q);
  const recorte = modo === "cidades" ? "cidades do estado" : `bairros de ${titulo(t(cidadeEscolhida, "municipio_nome"))}`;

  return (
    <>
      <Nota>
        Cada lugar cai num quadrante pela força do partido ali (eixo de baixo; 1,00 = a média {modo === "cidades" ? "do estado" : "da cidade"}) e pelo espaço que
        sobra (eixo do lado: voto de direita fora do Missão + voto do Renan que não veio). A classificação é regra, não conselho — a decisão é sua. Para cada
        lugar, o melhor nome do Missão é o que teve mais votos <b>acima do que o partido explica ali</b>, e não o mais votado.
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
          <Secao titulo={`Mapa de decisão — ${recorte}`} explica="decisao">
            <Kpis
              itens={QS.map((q) => {
                const ls = contagem(q);
                const semGente = ls.filter((l) => !n(l, "gente")).length;
                return {
                  rotulo: q,
                  valor: num(ls.length),
                  sub: `${num(ls.reduce((s, l) => s + (n(l, "eleitorado") || 0), 0))} eleitores${temGente && (q === "Crescer" || q === "Atacar") ? ` · ${num(semGente)} sem ninguém da base` : ""}`,
                  missao: q === "Crescer",
                };
              })}
            />
            <Legenda itens={QS.map((q) => [QUADRANTES[q].cor, QUADRANTES[q].texto])} />
            <Quadrantes
              pontos={linhas
                .filter((l) => l.quadrante)
                .map((l) => ({
                  id: String(l.id),
                  x: n(l, "forca_partido"),
                  y: n(l, "espaco"),
                  tamanho: n(l, "eleitorado"),
                  quadrante: t(l, "quadrante"),
                  texto: `${t(l, "lugar")}: ${t(l, "quadrante")} · força do partido ${num(n(l, "forca_partido"), 2)} · espaço ${pct(n(l, "espaco"))}${l.melhor ? ` · melhor nome de fato: ${t(l, "melhor")}` : ""}`,
                }))}
              corteX={1.15}
              corteY={corteY}
              ativo={ativo}
              aoEscolher={setAtivo}
              rotuloX="Força do partido (1,00 = média)"
              rotuloY="Espaço (% do eleitorado)"
            />
          </Secao>

          <Gente estado={gente.dado} erro={gente.erro} />

          <Secao titulo="Lugares" sub="Toque no título da coluna para ordenar; escolha um lugar abaixo para ver os nomes do Missão ali." explica="decisao">
            <Chips valor={filtro} opcoes={["todos", ...QS]} aoMudar={setFiltro} nome={(q) => (q === "todos" ? "Todos" : q)} />
            <Tabela
              linhas={visiveis}
              ordem="oportunidade"
              arquivo={`decisoes-${modo}-${uf}${modo === "bairros" ? `-${cod}` : ""}`}
              colunas={[
                { chave: "lugar", rotulo: modo === "cidades" ? "Cidade" : "Bairro", tipo: "txt" },
                { chave: "quadrante", rotulo: "Quadrante", tipo: "txt" },
                { chave: "eleitorado", rotulo: "Eleitores" },
                { chave: "forca_partido", rotulo: "Força do partido", tipo: "dec", ajuda: "1,00 = a média do recorte de cima" },
                { chave: "espaco", rotulo: "Espaço", tipo: "pct" },
                { chave: "oportunidade", rotulo: "Votos em disputa" },
                { chave: "melhor", rotulo: "Melhor nome de fato", tipo: "txt" },
                { chave: "melhor_a_mais", rotulo: "Votos acima do partido" },
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
            <Secao titulo={`${t(lugar, "lugar")}: os nomes do Missão`} sub="Votos de cada um contra o que a força do partido ali explicaria para ele. Acima de zero = o lugar é dele, não só do partido." explica="melhor-de-fato">
              <Kpis
                itens={[
                  { rotulo: "Quadrante", valor: t(lugar, "quadrante") || "—", missao: true },
                  { rotulo: "Força do partido", valor: num(n(lugar, "forca_partido"), 2) },
                  { rotulo: "Votos em disputa", valor: num(n(lugar, "oportunidade")), sub: pct(n(lugar, "espaco")) + " do eleitorado" },
                  { rotulo: "Voto solto de adversário", valor: num(n(lugar, "solto") || 0) },
                  ...(temGente ? [{ rotulo: "Gente na base", valor: num(n(lugar, "gente")), sub: `${num(n(lugar, "gente_militantes"))} militantes e coordenadores` }] : []),
                ]}
              />
              <Tabela
                linhas={nomes}
                ordem="a_mais"
                colunas={[
                  { chave: "nome", rotulo: "Candidato", tipo: "txt" },
                  { chave: "votos", rotulo: "Votos" },
                  { chave: "esperado", rotulo: "Esperado pelo partido" },
                  { chave: "a_mais", rotulo: "A mais (ou a menos)" },
                  { chave: "forca", rotulo: "Força própria", tipo: "dec", ajuda: "votos ÷ esperado: 2,00 = o dobro do que o partido explica" },
                ]}
              />
            </Secao>
          )}
        </>
      )}
    </>
  );
}

function mediana(v: number[]): number {
  const s = v.filter(Number.isFinite).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
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
    <p style={{ fontSize: 14, margin: "14px 0 0", color: C.ink, opacity: 0.85 }}>
      {texto}{" "}
      {estado && !estado.autenticado && (
        <a href="/painel/" style={{ color: C.ink, display: "inline-block", padding: "10px 0", minHeight: 44 }}>
          Abrir o painel
        </a>
      )}
    </p>
  );
}
