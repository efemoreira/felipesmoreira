import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { C } from "../../src/lib/theme.ts";

/**
 * O CONTRASTE DO TEMA, MEDIDO — não olhado.
 *
 * WCAG AA: 4,5:1 para texto comum, 3:1 para texto grande (≥ 24 px, ou ≥ 19 px
 * em negrito) e para bordas de componente. A régua é a razão de luminância
 * da própria norma. `goldDim` sobre papel dava 2,76:1 e era o título das
 * seções legais — o único ouro que vira texto — e ninguém via, porque ouro
 * queimado "parece" escuro o bastante.
 *
 * Cada par abaixo é um uso real do site. Par novo de texto/fundo entra aqui.
 */

function luminancia(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function razao(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const TEXTO_COMUM = 4.5;
const TEXTO_GRANDE = 3;

describe("contraste: texto comum ≥ 4,5:1", () => {
  const pares: [string, string, string][] = [
    ["tinta sobre papel", C.ink, C.paper],
    ["tinta sobre creme", C.ink, C.cream],
    ["tinta sobre ouro (botões)", C.ink, C.gold],
    ["creme sobre noite (aulas, presença, candidatos)", C.cream, C.night],
    ["ouro sobre noite (títulos)", C.gold, C.night],
    ["ouro claro sobre noite (kickers)", C.gold2, C.night],
    ["ouro queimado sobre papel (títulos das legais)", C.goldDim, C.paper],
    ["ouro queimado sobre creme (o 'pessoas' do plano)", C.goldDim, C.cream],
    ["erro sobre noite", C.erro, C.night],
    ["tinta de erro sobre fundo de erro (inscrição)", C.erroTinta, C.erroFundo],
    ["tinta de erro sobre papel", C.erroTinta, C.paper],
    ["ok sobre noite", C.ok, C.night],
  ];
  for (const [nome, texto, fundo] of pares) {
    test(nome, () => {
      const r = razao(texto, fundo);
      assert.ok(r >= TEXTO_COMUM, `${nome}: ${r.toFixed(2)}:1, abaixo de ${TEXTO_COMUM}:1`);
    });
  }
});

describe("contraste: bordas e texto grande ≥ 3:1", () => {
  const pares: [string, string, string][] = [
    ["borda de erro sobre papel (inscrição)", C.erroBorda, C.paper],
    ["borda de ok sobre noite (checklist das aulas)", C.okBorda, C.night],
    ["borda de erro sobre noite (presença)", C.erroBorda, C.night],
    ["ouro queimado sobre ouro (sombra dos cartões)", C.goldDim, C.gold],
  ];
  for (const [nome, a, b] of pares) {
    test(nome, () => {
      const r = razao(a, b);
      assert.ok(r >= TEXTO_GRANDE, `${nome}: ${r.toFixed(2)}:1, abaixo de ${TEXTO_GRANDE}:1`);
    });
  }
});
