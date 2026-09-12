import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * FUMAÇA: a lista de pessoas é só lista; a ficha é só ficha.
 *
 * A ficha abria NO MEIO da lista (`bloco_ficha`), com as duplicatas em cima —
 * bloco de conteúdo empurrando a lista para baixo, no celular. Desde 10/09
 * `pessoas?p=` desenha a ficha sozinha, com abas, e a lista não vem junto.
 * Este teste foi prometido naquele plano e não escrito; é a trava contra a
 * ficha voltar a morar dentro da lista.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

const MARIA = "pes00000000teste";

describe("pessoas: lista e ficha são telas diferentes", () => {
  test("a lista não traz a ficha de ninguém", () => {
    const { html } = painel.abrir("pessoas", "");
    assert.doesNotMatch(html, /<fieldset id="ficha">/, "a ficha está desenhada dentro da lista");
    assert.doesNotMatch(html, /Seções da ficha/);
  });

  test("a ficha aberta não traz a lista", () => {
    const { html } = painel.abrir("pessoas", `p=${MARIA}`);
    assert.match(html, /<fieldset id="ficha">/, "a ficha não abriu");
    /* A lista tem a tabela de pessoas em cartões; a ficha, não. */
    assert.doesNotMatch(html, /class="rolagem cartoes"[\s\S]*data-rotulo="Telefone"/, "a lista veio junto com a ficha");
    assert.match(html, /Todas as pessoas/, "a ficha perdeu o caminho de volta para a lista");
  });

  test("as abas da ficha levam o p= — trocar de aba não volta para a lista", () => {
    const { html } = painel.abrir("pessoas", `p=${MARIA}`);
    for (const aba of ["encontros", "acesso", "historico"]) {
      assert.match(
        html,
        new RegExp(`href="[^"]*p=${MARIA}[^"]*aba=${aba}|href="[^"]*aba=${aba}[^"]*p=${MARIA}`),
        `a aba ${aba} perdeu o p= e leva para a lista`,
      );
    }
    const encontros = painel.abrir("pessoas", `p=${MARIA}&aba=encontros`).html;
    assert.match(encontros, /Seções da ficha/, "pessoas?p=&aba=encontros abriu a lista, não a ficha");
  });

  test("duplicatas só existem como aba, e só quando há par", () => {
    const { html } = painel.abrir("pessoas", "");
    /* A semente não tem duplicata: a aba não deve aparecer. */
    assert.doesNotMatch(html, /tipo=duplicatas/, "aba de duplicatas sem nenhuma duplicata");
  });
});
