"use client";
import React from "react";
import { C, FONT_ALFA, FONT_BITTER, FONT_ELITE, borda, bordaFina } from "@/lib/theme";
import type { LinhaColinha } from "./cargos";

/**
 * A colinha de papel — a que se imprime, recorta e leva na carteira.
 *
 * Segue o desenho que já circula (a "cola eleitoral" do TSE e os modelos de
 * gráfica): papel branco, tinta preta, uma linha por cargo, **um quadrado por
 * dígito** e o nome ao lado. O quadrado é o que faz a colinha funcionar na
 * cabine: o eleitor confere dígito por dígito com o teclado da urna.
 *
 * HTML e não canvas, ao contrário da arte de compartilhar: impressão pede
 * vetor (texto nítido em qualquer impressora) e o `@media print` do navegador
 * cuida do resto. Vice e suplente nunca chegam aqui — quem monta as linhas é
 * `montarColinha()`, que só lê titulares.
 *
 * Cargo que ficou sem escolha sai com os quadrados vazios, e não some: o papel
 * impresso ainda pode ser preenchido à caneta.
 */

/** Quantos quadrados desenhar quando a linha está em branco. */
const DIGITOS_EM_BRANCO: Record<LinhaColinha["chave"], number> = {
  presidente: 2,
  governador: 2,
  senador: 3,
  "deputado-federal": 4,
  "deputado-estadual": 5,
};

/** A ordem em que a URNA pede os votos — diferente da ordem da colinha. */
const ORDEM_DA_URNA = "Deputado federal, deputado estadual, senador (2 votos), governador e presidente";

export const ColinhaImpressa: React.FC<{ linhas: LinhaColinha[]; copias: 1 | 4 }> = ({ linhas, copias }) => (
  <div className={`cd-impressao cd-impressao-${copias}`}>
    {Array.from({ length: copias }, (_, i) => (
      <Papel key={i} linhas={linhas} copia={i} />
    ))}
    <style>{css}</style>
  </div>
);

const Papel: React.FC<{ linhas: LinhaColinha[]; copia: number }> = ({ linhas, copia }) => (
  /* Só a primeira cópia é lida em voz alta; as outras são o mesmo papel. */
  <article className="ci-papel" aria-hidden={copia > 0 ? true : undefined}>
    <header className="ci-topo">
      <p className="ci-kicker">Eleições 2026 · Ceará</p>
      <p className="ci-titulo">Minha colinha</p>
    </header>
    <ol className="ci-linhas">
      {linhas.map((l, j) => {
        const numero = l.candidato?.numero ?? "";
        const casas = numero ? numero.length : DIGITOS_EM_BRANCO[l.chave];
        return (
          <li key={`${l.chave}-${j}`} className="ci-linha">
            <span className="ci-cargo">{l.rotulo}</span>
            <span className="ci-digitos" aria-label={numero ? `número ${numero.split("").join(" ")}` : "em branco"}>
              {Array.from({ length: casas }, (_, k) => (
                <span key={k} className="ci-casa">
                  {numero.charAt(k)}
                </span>
              ))}
            </span>
            <span className={`ci-nome${l.candidato ? "" : " ci-branco"}`}>
              {l.candidato ? l.candidato.nome : "escreva aqui"}
            </span>
          </li>
        );
      })}
    </ol>
    <footer className="ci-rodape">
      <p>Na urna, a ordem é: {ORDEM_DA_URNA}.</p>
      <p className="ci-site">felipesmoreira.com/candidatos</p>
    </footer>
  </article>
);

const css = `
  .cd-impressao { display: grid; gap: 14px; }
  /* Na tela mostra uma cópia só; as outras existem para o papel. */
  .cd-impressao .ci-papel + .ci-papel { display: none; }

  .ci-papel {
    background: #fff; color: ${C.ink}; font-family: ${FONT_BITTER};
    border: ${borda(C.ink)}; padding: 16px 16px 12px; max-width: 520px;
    break-inside: avoid;
  }
  .ci-topo { text-align: center; border-bottom: ${bordaFina(C.ink)}; padding-bottom: 8px; margin-bottom: 6px; }
  .ci-kicker {
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 2.4px; text-transform: uppercase; margin: 0;
  }
  .ci-titulo { font-family: ${FONT_ALFA}; font-size: 24px; line-height: 1.1; margin: 2px 0 0; }

  .ci-linhas { list-style: none; margin: 0; padding: 0; }
  .ci-linha {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "cargo digitos" "nome digitos";
    align-items: center; gap: 2px 12px; padding: 9px 0; border-bottom: 1px dashed ${C.ink};
  }
  .ci-linha:last-child { border-bottom: 0; }
  .ci-cargo {
    grid-area: cargo; font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase;
  }
  .ci-nome { grid-area: nome; font-family: ${FONT_ALFA}; font-size: 16px; line-height: 1.2; overflow-wrap: anywhere; }
  .ci-branco { font-family: ${FONT_BITTER}; font-style: italic; font-size: 13px; opacity: .6; }
  .ci-digitos { grid-area: digitos; display: flex; gap: 4px; }
  .ci-casa {
    width: 30px; height: 38px; display: inline-flex; align-items: center; justify-content: center;
    border: ${bordaFina(C.ink)}; font-family: ${FONT_ALFA}; font-size: 22px; line-height: 1;
  }
  .ci-rodape { margin-top: 8px; font-size: 10.5px; line-height: 1.4; text-align: center; }
  .ci-rodape p { margin: 0; }
  .ci-site { font-family: ${FONT_ELITE}; letter-spacing: 1.4px; margin-top: 4px !important; }

  @media print {
    @page { size: A4; margin: 10mm; }
    .cd-impressao .ci-papel + .ci-papel { display: block; }
    .ci-papel { max-width: none; border-width: 2px; }
    .ci-papel, .ci-casa { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    /* Quatro por folha, o formato de gráfica: recorta nas linhas tracejadas
       e distribui. Uma por folha para quem vai levar só a sua. */
    .cd-impressao-4 { grid-template-columns: 1fr 1fr; gap: 0; }
    .cd-impressao-4 .ci-papel { border: 1px dashed ${C.ink}; padding: 8mm 7mm 6mm; min-height: 132mm; }
    .cd-impressao-4 .ci-casa { width: 24px; height: 30px; font-size: 18px; }
    .cd-impressao-4 .ci-nome { font-size: 13px; }
    .cd-impressao-1 .ci-papel { max-width: 120mm; margin: 0 auto; }
  }
`;
