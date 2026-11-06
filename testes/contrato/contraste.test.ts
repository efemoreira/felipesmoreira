import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { C, PAINEL_DADOS as P } from "../../src/lib/theme.ts";

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
    ["tinta sobre o branco da página", C.ink, C.paper],
    ["tinta sobre o segundo tom (seções e rodapé)", C.ink, C.fundo],
    ["tinta sobre ouro (botões e o convite final)", C.ink, C.gold],
    ["tinta sobre ouro claro (etiquetas, cartão marcado)", C.ink, C.ouroClaro],
    ["branco sobre tinta (botão do convite)", C.paper, C.ink],
    ["texto suave sobre o branco", C.suave, C.paper],
    ["texto suave sobre o segundo tom (rodapé)", C.suave, C.fundo],
    ["texto suave sobre ouro claro (avisos)", C.suave, C.ouroClaro],
    ["ouro queimado sobre o branco (rótulos)", C.goldDim, C.paper],
    ["ouro queimado sobre o segundo tom", C.goldDim, C.fundo],
    ["ouro queimado sobre ouro claro", C.goldDim, C.ouroClaro],
    ["tinta de erro sobre fundo de erro", C.erroTinta, C.erroFundo],
    ["tinta de erro sobre o branco", C.erroTinta, C.paper],
    ["ok sobre fundo de ok", C.ok, C.okFundo],
    ["dados: tinta sobre o fundo", P.tinta, P.fundo],
    ["dados: tinta suave sobre o fundo", P.tintaSuave, P.fundo],
    ["dados: tinta suave sobre o realce do Missão", P.tintaSuave, P.realce],
    ["dados: ouro do Missão sobre a superfície", P.missao, P.superficie],
    ["dados: ouro do Missão sobre o fundo", P.missao, P.fundo],
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
    ["borda de erro sobre o branco (formulários)", C.erroBorda, C.paper],
    ["borda de ok sobre o branco (checklist das aulas)", C.okBorda, C.paper],
    ["contorno de campo sobre o branco", C.linhaForte, C.paper],
    ["contorno de campo sobre o segundo tom", C.linhaForte, C.fundo],
    ["dados: contorno de controle sobre a superfície", P.linhaForte, P.superficie],
  ];
  for (const [nome, a, b] of pares) {
    test(nome, () => {
      const r = razao(a, b);
      assert.ok(r >= TEXTO_GRANDE, `${nome}: ${r.toFixed(2)}:1, abaixo de ${TEXTO_GRANDE}:1`);
    });
  }
});

describe("contraste: o ouro é fundo, nunca texto sobre o branco", () => {
  test("ouro sobre branco não dá nem texto grande", () => {
    /* É por isso que `goldDim` existe, e por isso o foco é em tinta: o ouro puro
       some sobre a página. Se um dia a marca mudar de cor, este teste avisa que
       a regra pode ser revista. */
    assert.ok(razao(C.gold, C.paper) < TEXTO_GRANDE);
  });
});
