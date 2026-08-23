import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * A BUSCA GLOBAL, e principalmente o que ela NÃO alcança.
 *
 * `procurar.php` não é uma área: ela não pede permissão própria, alcança
 * exatamente o que a pessoa já podia abrir e nada além. É o tipo de tela em que
 * um esquecimento vira vazamento — quem tem `eventos` mas não tem `pessoas`
 * abriria, por uma caixa de busca, a lista com telefone e endereço de todo
 * mundo. Por isso a trava é testada aqui e não só lida no código.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

describe("busca global: acha o que existe", () => {
  test("acha a pessoa pelo nome", () => {
    const { html } = painel.abrir("procurar", "q=sauro");
    assert.match(html, /Maria da Silva Sauro/, "não achou a pessoa pelo sobrenome");
    assert.match(html, /pessoas\.php\?p=pes00000000teste/, "o resultado não leva à ficha dela");
  });

  test("acha a pessoa pelo telefone, com dígito casando dígito", () => {
    /* Quem procura tem o número na tela do próprio WhatsApp, e o cadastro
       guarda só dígitos: "(85) 9" não acharia "85 9" como texto. */
    const { html } = painel.abrir("procurar", "q=" + encodeURIComponent("(85) 99999"));
    assert.match(html, /Maria da Silva Sauro/, "não achou pelo telefone formatado");
  });

  test("acha o encontro pelo local", () => {
    const { html } = painel.abrir("procurar", "q=benfica");
    assert.match(html, /Encontro de fumaça no Benfica/);
    assert.match(html, /eventos\.php\?e=ev-teste/);
  });

  test("acha o fato e o card do quadro", () => {
    const { html } = painel.abrir("procurar", "q=obra");
    assert.match(html, /Obra parada há dois anos/, "não achou o fato");
    assert.match(html, /Roteiro sobre a obra parada/, "não achou o card");
  });

  test("uma letra só não devolve meia base", () => {
    const { html } = painel.abrir("procurar", "q=a");
    assert.match(html, /pelo menos duas letras/i);
    assert.doesNotMatch(html, /Maria da Silva Sauro/, "uma letra devolveu resultado");
  });

  test("busca sem resultado explica onde procurou", () => {
    const { html } = painel.abrir("procurar", "q=xyzabc123");
    assert.match(html, /Nada com/, "não ofereceu a saída de nada_encontrado()");
    assert.match(html, /Procurei em:/, "não disse em que áreas procurou");
  });
});

describe("busca global: a permissão é a mesma de sempre", () => {
  test("quem não abre Pessoas não acha pessoa por aqui", () => {
    /* A trava que importa. `pessoas` é a tela com telefone, e-mail e endereço de
       todo mundo, e só a capacidade de administração a libera. Uma busca que
       ignorasse isso seria uma porta lateral para o cadastro inteiro. */
    painel.trocarCapacidades("eventos");
    try {
      const { html } = painel.abrir("procurar", "q=sauro");
      assert.doesNotMatch(html, /pessoas\.php\?p=/, "a busca vazou a ficha de uma pessoa");
      assert.doesNotMatch(html, /Maria da Silva Sauro/, "a busca mostrou o nome de uma pessoa do cadastro");

      /* E continua achando o que essa pessoa PODE abrir: a trava recorta, não
         desliga. */
      const encontro = painel.abrir("procurar", "q=benfica");
      assert.match(encontro.html, /Encontro de fumaça no Benfica/, "quem tem eventos deixou de achar encontro");
    } finally {
      painel.trocarCapacidades("adm");
    }
  });

  test("quem não tem área nenhuma não acha nada, e a tela não quebra", () => {
    painel.trocarCapacidades("");
    try {
      const { html, erros, status } = painel.abrir("procurar", "q=benfica");
      assert.equal(status, 0, erros);
      assert.match(html, /<\/html>\s*$/, "a tela terminou no meio");
      assert.doesNotMatch(html, /Encontro de fumaça/);
      assert.match(html, /nenhuma área/, "não explicou que não há onde procurar");
    } finally {
      painel.trocarCapacidades("adm");
    }
  });
});
