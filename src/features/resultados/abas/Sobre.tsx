"use client";
import React from "react";
import { FONT_DADOS, PAINEL_DADOS as P, fileteDados } from "@/lib/theme";
import type { Resumo } from "../dados";
import { GLOSSARIO, LIMITES } from "../explicacoes";
import { Secao, cartao } from "../pecas";

/**
 * De onde vem cada número, como ele foi tratado e o que ele não diz. As bases
 * (com a data em que o TSE publicou o arquivo usado) vêm de `resumo.fontes`,
 * que o export grava a partir do que de fato foi baixado.
 */

const CAMINHO: [string, string][] = [
  ["Urna", "Cada seção eleitoral (urna) tem o seu boletim. O TSE publica os votos de cada seção nos Dados Abertos."],
  ["Local de votação", "As seções de uma mesma escola são somadas. O cadastro do TSE dá o endereço, o bairro digitado pelo cartório e o GPS do local."],
  ["Bairro", "O GPS do local é cruzado com a malha oficial de bairros do IBGE (Censo 2022). Fora dela, vale o distrito do IBGE (zona rural) ou o nome do cartório."],
  ["Três anos", "2022, 2024 e 2026 passam pelo mesmo caminho e são somados pelo mesmo bairro — o local de votação muda de um ano para o outro, o bairro não."],
  ["Conferência", "A soma das seções é comparada, cidade por cidade e cargo por cargo, com o total oficial do TSE antes de ir para o site."],
  ["Site", "Só os totais por bairro e por local saem do projeto de análise. Nada aqui identifica eleitor: o menor recorte é a escola, com centenas de pessoas."],
];

const POR_QUE: string[] = [
  "Cidade é grande demais para decidir onde fazer reunião. Bairro é o tamanho de uma ação de rua.",
  "2028 é eleição de vereador, e vereador se elege com o voto de alguns bairros. Saber onde o Missão já tem voto — e onde a direita tem voto que ainda não é do Missão — é o mapa da chapa.",
  "Comparar 2022 com 2026 mostra quem está perdendo eleitor. Eleitor que deixou um candidato de direita já disse sim à direita uma vez: é o mais fácil de trazer.",
  "Local de votação é ponto de encontro natural: é onde as pessoas do bairro vão, e é onde se faz panfletagem e boca de urna.",
];

const caixa: React.CSSProperties = { ...cartao, padding: "12px 14px" };

export default function Sobre({ resumo }: { resumo: Resumo }) {
  const fontes = resumo.fontes ?? [];
  return (
    <>
      <Secao titulo="Por que olhar até o bairro">
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.55, display: "grid", gap: 6, maxWidth: "72ch" }}>
          {POR_QUE.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="O caminho do dado" sub="Da urna até esta página.">
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, maxWidth: "72ch" }}>
          {CAMINHO.map(([etapa, texto], i) => (
            <li key={etapa} style={{ ...caixa, display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, alignItems: "start" }}>
              <span style={{ fontFamily: FONT_DADOS, fontSize: 18, lineHeight: "30px", textAlign: "center", border: fileteDados(P.linhaForte), borderRadius: "50%", width: 30, height: 30 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.5 }}>
                <b>{etapa}.</b> {texto}
              </span>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao titulo="As bases" sub={`Resultado por município: ${resumo.fonte}. Processado em ${resumo.geradoEm}.`}>
        {fontes.length === 0 ? (
          <p style={{ opacity: 0.75 }}>A lista das bases sai junto com o recorte por bairro.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {fontes.map((f) => (
              <div key={f.nome} style={{ ...caixa, border: fileteDados(), fontSize: 14.5, lineHeight: 1.45 }}>
                <b>{f.nome}</b>
                <br />
                Publicado em {dataBr(f.publicado)}
                {f.baixado && <> · baixado em {dataBr(f.baixado)}</>}
                <br />
                <span style={{ overflowWrap: "anywhere", opacity: 0.8 }}>{f.url}</span>
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao titulo="Glossário">
        <dl style={{ margin: 0, display: "grid", gap: 10, maxWidth: "75ch" }}>
          {GLOSSARIO.map(([termo, def]) => (
            <div key={termo}>
              <dt style={{ fontWeight: 700, fontSize: 15.5 }}>{termo}</dt>
              <dd style={{ margin: "2px 0 0", fontSize: 15, lineHeight: 1.5 }}>{def}</dd>
            </div>
          ))}
        </dl>
      </Secao>

      <Secao titulo="O que estes números não dizem">
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.55, display: "grid", gap: 6, maxWidth: "75ch" }}>
          {LIMITES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Secao>
    </>
  );
}

/** "2026-10-05 16:58" → "05/10/2026 16:58" */
const dataBr = (s: string) => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}${m[4]}` : s;
};
