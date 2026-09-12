import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a tarefa combinada — quem, o quê, até quando — e onde ela aparece.
 *
 * Nasce na aba Tarefas de Encontros; vence no Início de quem é o dono (e não
 * no de outra pessoa); só o dono ou a coordenação marca feita; apagar deixa
 * a lápide; a tarefa de um encontro aparece na tela dele.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const MARIA = "pes00000000teste";
const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

describe("tarefas: combinar, cobrar, fazer", () => {
  test("combinar grava e aparece na aba, com dono e prazo", async () => {
    const r = await painel.postar("eventos", { acao: "tarefa-nova", titulo: "Confirmar o som", donoId: ADMIN, ate: amanha, eventoId: "ev-teste" });
    assert.match(r.html, /Combinado: Confirmar o som/);
    assert.match(r.html, /Combinadas \(1\)/);
    assert.match(r.html, /Coordenação de Teste/);
    const t = painel.ler("tarefas")[0];
    assert.equal(t.criadoPor, "Coordenação de Teste");
    assert.equal(t.eventoId, "ev-teste");
  });

  test("a tarefa vencida cobra no Início do dono — e não no de outra pessoa", async () => {
    await painel.postar("eventos", { acao: "tarefa-nova", titulo: "Levar as bandeiras", donoId: ADMIN, ate: ontem });
    const hub = painel.abrir("index", "").html;
    assert.match(hub, /Levar as bandeiras/);
    assert.match(hub, /venceu em/);
    assert.match(hub, /fila-urgente/);

    /* A Maria não tem conta; dá conta e troca para ela é caro — basta provar
       que a tarefa da admin não aparece para quem não é dona: reatribui. */
    painel.gravar("tarefas", painel.ler("tarefas").map((t) => ({ ...t, donoId: MARIA })));
    assert.doesNotMatch(painel.abrir("index", "").html, /Levar as bandeiras/, "tarefa alheia na fila");
  });

  test("a tarefa do encontro aparece na tela dele", async () => {
    await painel.postar("eventos", { acao: "tarefa-nova", titulo: "Reservar a praça", donoId: ADMIN, eventoId: "ev-teste" });
    const { html } = painel.abrir("eventos", "e=ev-teste");
    assert.match(html, /Combinado para este encontro \(1\)/);
    assert.match(html, /Reservar a praça/);
  });

  test("feita sai das abertas, com quem fez; apagar deixa a lápide", async () => {
    await painel.postar("eventos", { acao: "tarefa-nova", titulo: "Comprar água", donoId: ADMIN });
    const id = painel.ler("tarefas")[0].id;
    const r = await painel.postar("eventos", { acao: "tarefa-feita", id });
    assert.match(r.html, /Feitas \(1\)/);
    assert.equal(painel.ler("tarefas")[0].feitaPor, "Coordenação de Teste");
    assert.doesNotMatch(painel.abrir("index", "").html, /Comprar água/);

    await painel.postar("eventos", { acao: "tarefa-apagar", id });
    const cru = painel.ler("tarefas")[0];
    assert.notEqual(cru.apagadoEm, "");
    assert.doesNotMatch(painel.abrir("eventos", "aba=tarefas").html, /Comprar água/);
  });

  test("quem não abre Encontros não combina", async () => {
    /* A capacidade Eventos concede `agenda`, que é o que `$coordena` lê — então
       quem tem Encontros combina. Quem não tem a área é barrado na porta. */
    painel.trocarCapacidades("comunicacao");
    const r = await painel.postar("eventos", { acao: "tarefa-nova", titulo: "Tentativa", donoId: ADMIN });
    assert.equal(r.status, 302);
    assert.match(r.location, /negado=eventos/);
    assert.deepEqual(painel.ler("tarefas"), []);
  });
});
