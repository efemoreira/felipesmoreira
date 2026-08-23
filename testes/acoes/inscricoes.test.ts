import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a fila de entrada — aprovar e recusar quem se inscreveu.
 *
 * A regra que este arquivo existe para prender é a do CLAUDE.md: **aprovar dá
 * conta à ficha que já está lá, e não cria uma segunda**. Antes a inscrição
 * virava um usuário novo e a inscrição ficava para trás, então a mesma pessoa
 * passava a existir duas vezes e o histórico de encontros dela ficava preso na
 * ficha antiga. É o tipo de regressão que nenhuma tela denuncia: as duas fichas
 * existem, e as duas parecem certas.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/** A pessoa semeada, que entra na fila com `status = 'pendente'`. */
const NA_FILA = "pes00000000teste";

describe("ação: aprovar inscrição", () => {
  test("dá conta à ficha que já existe — não cria uma segunda pessoa", async () => {
    const antes = painel.ler("pessoas").length;

    const r = await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "maria",
      capacidades: ["comunicacao"],
    });

    assert.equal(r.status, 302);
    const pessoas = painel.ler("pessoas");
    assert.equal(pessoas.length, antes, "a aprovação criou uma segunda ficha");

    const maria = pessoas.find((p) => p.id === NA_FILA);
    assert.equal(maria.usuario, "maria");
    assert.equal(maria.status, "aprovada");
    assert.equal(maria.ativo, true);
    assert.equal(maria.trocarSenha, true, "a senha provisória tem de ser provisória");
    assert.ok(maria.hash, "aprovar sem hash é conta que não abre");
  });

  test("a senha provisória aparece UMA vez, na tela seguinte", async () => {
    const r = await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "maria",
    });

    assert.match(r.html, /Acesso criado para Maria da Silva Sauro/);

    /* Uma vez, e só uma: `$_SESSION['acesso_novo']` some assim que é desenhado.
       Senha provisória que fica na tela é senha que alguém lê por cima do ombro
       na segunda vez que a página é aberta. */
    const denovo = await painel.buscar("inscricoes");
    assert.doesNotMatch(denovo.html, /Acesso criado para/);
  });

  test("sem função marcada, a aprovação assume “onde-precisar”", async () => {
    /* O servidor aceita inscrição sem função de propósito — quem exige é a
       tela. Deixar o array vazio faria o hub não ter atalho nenhum. */
    await painel.postar("inscricoes", { acao: "aprovar", id: NA_FILA, usuario: "maria" });

    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.deepEqual(maria.funcoes, ["onde-precisar"]);
  });

  test("a capacidade de coordenação muda o tipo da pessoa", async () => {
    await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "maria",
      capacidades: ["coordenacao"],
    });

    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.tipo, "coordenador");
  });

  test("login repetido é recusado, e a pessoa continua na fila", async () => {
    const r = await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "teste", // já é o login da coordenação semeada
    });

    assert.match(r.html, /Já existe alguém com o login/);
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.status, "pendente", "recusada a aprovação, a ficha não pode ter mudado");
    assert.equal(maria.usuario ?? "", "");
  });

  test("decidir duas vezes não decide duas vezes", async () => {
    await painel.postar("inscricoes", { acao: "aprovar", id: NA_FILA, usuario: "maria" });
    const r = await painel.postar("inscricoes", { acao: "aprovar", id: NA_FILA, usuario: "maria2" });

    assert.match(r.html, /já foi decidida/);
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.usuario, "maria", "o segundo POST reescreveu o login");
  });
});

describe("ação: recusar inscrição", () => {
  test("a pessoa NÃO é apagada — sai da fila e fica na lista", async () => {
    const r = await painel.postar("inscricoes", { acao: "recusar", id: NA_FILA });

    assert.match(r.html, /recusada/i);
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.ok(maria, "recusar apagou a pessoa — e a presença dela em encontro iria junto");
    assert.equal(maria.status, "recusada");
    assert.ok(maria.decididoPor, "quem decidiu tem de ficar registrado");
  });

  test("recusar não tira a presença dela no encontro", async () => {
    await painel.postar("inscricoes", { acao: "recusar", id: NA_FILA });
    assert.equal(painel.ler("presencas").length, 1);
  });
});

describe("ação: a sessão expirada", () => {
  test("POST sem CSRF não grava nada e derruba a sessão", async () => {
    const r = await painel.postar("inscricoes", { acao: "recusar", id: NA_FILA, csrf: "" });

    assert.equal(r.location, "/painel/", "sem CSRF a ação tem de cair na porta");
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.status, "pendente", "a ação rodou apesar do CSRF inválido");
  });
});
