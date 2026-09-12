import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * O CAIXA — e a regra que ele existe para não deixar quebrar.
 *
 * Com candidatura registrada, dinheiro que custeia atividade de campanha é
 * recurso de campanha — conta própria, recibo eleitoral e prestação de contas —,
 * qualquer que seja o nome que se dê ao caixa. Esta tela não decide de que lado
 * da linha um lançamento cai; quem traça a linha é o advogado. O que ela
 * garante é que **os dois nunca somam juntos**, porque misturar é o erro que
 * não se desfaz depois.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

describe("caixa: lançar", () => {
  test("o botão diz o sentido, e o valor é sempre digitado positivo", async () => {
    await painel.postar("caixa", {
      acao: "lancar", valor: "40", descricao: "Água do bandeiraço",
      origem: "alimentos", conta: "movimento", sentido: "saiu",
    });

    /* Pedir que alguém digite "-40" é pedir um erro que só aparece na soma do
       mês. O sinal vem do botão. */
    assert.equal(painel.ler("caixa")[0].centavos, -4000);
  });

  test("guarda em centavos, e lê as duas convenções de decimal", async () => {
    for (const [escrito, esperado] of [["12,50", 1250], ["1.234,56", 123456]] as const) {
      painel.ressemear();
      await painel.postar("caixa", {
        acao: "lancar", valor: escrito, descricao: "Venda", sentido: "entrou",
      });
      /* 0.1 + 0.2 não é 0.3 em ponto flutuante, e caixa que erra centavo na
         terceira soma é caixa em que ninguém confia. */
      assert.equal(painel.ler("caixa")[0].centavos, esperado, `"${escrito}"`);
    }
  });

  test("sem valor ou sem descrição não lança", async () => {
    const semValor = await painel.postar("caixa", { acao: "lancar", valor: "abc", descricao: "X", sentido: "entrou" });
    assert.match(semValor.html, /Diga o valor/);

    const semTexto = await painel.postar("caixa", { acao: "lancar", valor: "10", descricao: " ", sentido: "entrou" });
    /* Lançamento sem descrição não se confere depois — e caixa que não se
       confere não é caixa. */
    assert.match(semTexto.html, /não se confere depois/);
    assert.equal(painel.ler("caixa").length, 0);
  });

  test("conta que não existe cai no caixa do movimento, e nunca em campanha", async () => {
    await painel.postar("caixa", {
      acao: "lancar", valor: "10", descricao: "X", sentido: "entrou", conta: "inventada",
    });
    assert.equal(painel.ler("caixa")[0].conta, "movimento");
  });
});

describe("caixa: os dois nunca somam juntos", () => {
  function comOsDois() {
    painel.gravar("caixa", [
      { id: "a", centavos: 10000, conta: "movimento", origem: "venda",
        descricao: "Camisetas", data: "2026-09-01", criadoEm: "2026-09-01T10:00:00-03:00" },
      { id: "b", centavos: -3000, conta: "movimento", origem: "material",
        descricao: "Tecido", data: "2026-09-02", criadoEm: "2026-09-02T10:00:00-03:00" },
      { id: "c", centavos: 50000, conta: "campanha", origem: "doacao",
        descricao: "Doação registrada", data: "2026-09-03", criadoEm: "2026-09-03T10:00:00-03:00" },
    ]);
  }

  test("a tela abre no caixa do movimento e não mostra o da campanha", async () => {
    comOsDois();
    const { html } = await painel.buscar("caixa");

    /* Abrir somando os dois convida exatamente o erro que este módulo existe
       para impedir — e o número somado não significa nada, porque as duas
       contas respondem a réguas diferentes. */
    assert.match(html, /Camisetas/);
    assert.doesNotMatch(html, /Doação registrada/);
    assert.match(html, /R\$ 70,00/, "o saldo do movimento não bateu (100 − 30)");
  });

  test("a aba de campanha mostra só a campanha", async () => {
    comOsDois();
    const { html } = await painel.buscar("caixa", "conta=campanha");

    assert.match(html, /Doação registrada/);
    assert.doesNotMatch(html, /Camisetas/);
  });

  test("a trava jurídica está escrita na tela, e não só no código", async () => {
    /* Quem lança é quem precisa ler: é ela que decide o que marcar em `conta`. */
    const { html } = await painel.buscar("caixa");
    assert.match(html, /recurso de campanha/i);
    assert.match(html, /recibo eleitoral/);
  });
});

describe("caixa: apagar", () => {
  test("apagar tira de toda soma e lista — e deixa a lápide com quem apagou", async () => {
    painel.gravar("caixa", [{
      id: "x1", centavos: 5000, conta: "movimento", origem: "venda",
      descricao: "Errado", data: "2026-09-01", criadoEm: "2026-09-01T10:00:00-03:00",
    }]);

    const r = await painel.postar("caixa", { acao: "apagar", id: "x1" });
    /* Um caixa que guarda o errado ao lado do certo soma duas vezes na primeira
       distração — a lápide não está ao lado, está fora de toda conta. */
    assert.doesNotMatch(r.html, /Errado/, "o lançamento apagado continua no extrato");
    assert.match(r.html, /<dt>Saldo<\/dt><dd>R\$ 0,00/, "a lápide entrou na soma");
    const cru = painel.ler("caixa");
    assert.equal(cru.length, 1, "a lápide sumiu — apagar deixou de ter rastro");
    assert.notEqual(cru[0].apagadoEm, "");
    assert.equal(cru[0].apagadoPor, "Coordenação de Teste");
    /* E a linha do tempo diz. */
    assert.match(painel.abrir("leituras", "aba=atividade").html, /Apagou do caixa: R\$ 50,00/);
  });
});
