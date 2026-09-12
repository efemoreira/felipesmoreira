import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a meta é o alvo dos números — e o único POST de Leituras.
 *
 * A medida é derivada (militantes, inscrições, presenças, encontros); o que
 * se grava é só o alvo e a data. A leitura diz "x de y", quanto falta, e se
 * o ritmo cabe nos dias que faltam.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const daquiA = (dias: number) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);

describe("metas: combinar e ler", () => {
  test("combinar grava e a Semana mostra x de y com o que falta", async () => {
    const r = await painel.postar("leituras", { acao: "meta-salvar", medida: "inscricoes", alvo: "10", ate: daquiA(20) });
    assert.match(r.html, /Meta combinada: Inscrições recebidas — 10/);
    /* A semente tem duas fichas com status (a admin aprovada e a Maria pendente). */
    assert.match(r.html, /<strong>2<\/strong> de 10/, "a meta devia ler 2 de 10");
    assert.match(r.html, /Faltam 8 em (19|20|21) dias/);   // a data vem em UTC; o dia conta no Ceará
  });

  test("meta batida diz 'Batida'", async () => {
    const r = await painel.postar("leituras", { acao: "meta-salvar", medida: "inscricoes", alvo: "2", ate: daquiA(5) });
    assert.match(r.html, /Batida\./);
  });

  test("sem número ou sem data não grava", async () => {
    const r = await painel.postar("leituras", { acao: "meta-salvar", medida: "militantes", alvo: "0", ate: "" });
    assert.match(r.html, /precisa de medida, número maior que zero e data/);
    assert.deepEqual(painel.ler("metas"), []);
  });

  test("apagar tira a meta", async () => {
    await painel.postar("leituras", { acao: "meta-salvar", medida: "encontros", alvo: "3", ate: daquiA(10) });
    const id = painel.ler("metas")[0].id;
    await painel.postar("leituras", { acao: "meta-apagar", id });
    assert.deepEqual(painel.ler("metas"), []);
  });

  test("o GET de Leituras continua sem gravar nada", () => {
    for (const aba of ["origem", "semana", "atividade"]) painel.abrir("leituras", `aba=${aba}`);
    assert.deepEqual(painel.ler("metas"), []);
  });
});
