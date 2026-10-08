"use client";
import React from "react";
import { C, FONT_ALFA, FONT_BITTER, FONT_DADOS, FONT_ELITE, PAINEL_DADOS as P, bordaFina } from "@/lib/theme";
import { n, t, type Linha } from "./dados";
import { num, pct } from "./formato";
import { ladoTexto, linkMapa } from "./apoio";

/**
 * O roteiro de rua: os locais de votação da cidade (ou do bairro) em ordem de
 * oportunidade, com endereço — para imprimir e levar na panfletagem, na visita
 * ou para marcar ponto de encontro.
 *
 * Na tela aparece só a prévia e o botão. No papel, o `@media print` esconde a
 * página inteira e mostra só `.rs-roteiro`, em A4, papel branco e tinta preta.
 */

export function Roteiro({ locais, nomeBairro, titulo }: { locais: Linha[]; nomeBairro: (l: Linha) => string; titulo: string }) {
  const ordem = [...locais].sort((a, b) => (n(b, "oportunidade") || 0) - (n(a, "oportunidade") || 0)).slice(0, 60);
  if (!ordem.length) return null;
  return (
    <div>
      <ol style={{ margin: "0 0 12px", paddingLeft: 22, fontSize: 14.5, lineHeight: 1.45, display: "grid", gap: 6 }}>
        {ordem.slice(0, 5).map((l) => (
          <li key={`${t(l, "zona")}-${t(l, "local")}`}>
            <b>{t(l, "nome")}</b> — {nomeBairro(l)} · {num(n(l, "oportunidade"))} votos de oportunidade
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => window.print()}
        style={{ fontFamily: FONT_DADOS, fontWeight: 700, fontSize: 15, minHeight: 44, padding: "8px 18px", cursor: "pointer", color: P.superficie, background: P.tinta, border: 0, borderRadius: 999 }}
      >
        Imprimir roteiro ({num(ordem.length)} locais)
      </button>

      <section className="rs-roteiro" aria-hidden="true">
        <h1>{titulo}</h1>
        <p className="rs-sub">
          Locais de votação em ordem de oportunidade (votos de direita sem o Missão para Dep. Estadual + votos do Renan não convertidos). Eleições 2026,
          1º turno. Fonte: TSE.
        </p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Local e endereço</th>
              <th>Bairro</th>
              <th>Eleitores</th>
              <th>Renan</th>
              <th>Pende</th>
              <th>Oport.</th>
              <th>Feito</th>
            </tr>
          </thead>
          <tbody>
            {ordem.map((l, i) => (
              <tr key={`${t(l, "zona")}-${t(l, "local")}`}>
                <td>{i + 1}</td>
                <td>
                  <b>{t(l, "nome")}</b>
                  <br />
                  {t(l, "endereco")}
                  {linkMapa(l) && <span className="rs-geo"> · {(n(l, "lat5") / 1e5).toFixed(5)}, {(n(l, "lon5") / 1e5).toFixed(5)}</span>}
                </td>
                <td>{nomeBairro(l)}</td>
                <td>{num(n(l, "eleitorado"))}</td>
                <td>{pct(n(l, "missao_pres") / n(l, "validos_pres"))}</td>
                <td>{ladoTexto(n(l, "lado_pres"))}</td>
                <td>{num(n(l, "oportunidade"))}</td>
                <td className="rs-caixa" />
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <style>{css}</style>
    </div>
  );
}

const css = `
  .rs-roteiro { display: none; }
  @media print {
    @page { size: A4; margin: 10mm; }
    html, body { background: #fff !important; }
    body * { visibility: hidden; }
    .rs-roteiro, .rs-roteiro * { visibility: visible; }
    .rs-roteiro {
      display: block; position: absolute; left: 0; top: 0; width: 100%;
      font-family: ${FONT_BITTER}; color: ${C.ink}; background: #fff;
    }
    .rs-roteiro h1 { font-family: ${FONT_ALFA}; font-size: 20px; margin: 0 0 4px; }
    .rs-sub { font-size: 10.5px; margin: 0 0 8px; }
    .rs-roteiro table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    .rs-roteiro th { font-family: ${FONT_ELITE}; font-weight: 400; text-align: left; border-bottom: ${bordaFina(C.ink)}; padding: 4px; }
    .rs-roteiro td { border-bottom: 1px solid #bbb; padding: 4px; vertical-align: top; }
    .rs-roteiro tr { break-inside: avoid; }
    .rs-geo { color: #555; }
    .rs-caixa { width: 14mm; border-left: 1px solid #bbb; }
  }
`;
