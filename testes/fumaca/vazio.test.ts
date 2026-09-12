import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * FUMAÇA: vazio com ação tem a ação.
 *
 * `vazio()` em componentes.php é o padrão: o texto diz o que fazer e o botão
 * faz. `data-acao` marca os que prometem ação — e um `.vazio[data-acao]` sem
 * link dentro é uma promessa quebrada. As telas são abertas sem semente para
 * os vazios aparecerem de verdade.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
  /* A semente traz um encontro, um fato, um card: esvazia o que as telas
     listam para os vazios aparecerem de verdade (a conta de teste fica). */
  for (const nome of ["eventos", "presencas", "fatos", "producao", "listas", "caixa"]) {
    painel.gravar(nome, []);
  }
});
after(() => painel.fechar());

const TELAS: [string, string][] = [
  ["municao", "aba=mutirao"],
  ["municao", "aba=pecas"],
  ["candidatos", "aba=candidatos"],
  ["candidatos", "aba=listas"],
  ["eventos", ""],
  ["eventos", "aba=passados"],
  ["fatos", "aba=decididos"],
  ["caixa", ""],
];

describe("fumaça: todo vazio que promete ação tem um botão", () => {
  for (const [tela, qs] of TELAS) {
    test(`${tela}${qs ? "?" + qs : ""}`, () => {
      const { html } = painel.abrir(tela, qs);
      const vazios = [...html.matchAll(/<p class="vazio" data-acao>([\s\S]*?)<\/p>/g)];
      assert.ok(vazios.length >= 1, `${tela} sem semente devia mostrar um vazio com ação`);
      for (const [, corpo] of vazios) {
        assert.match(corpo, /<a class="btn/, `vazio sem botão em ${tela}: ${corpo.trim().slice(0, 60)}`);
      }
    });
  }
});
