import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: o encontro — criar, marcar o checklist, tirar alguém da lista, apagar.
 *
 * Duas regras deste arquivo não se veem lendo a tela, e são as que doem:
 *
 * 1. **`voltar()` leva a ABA junto da âncora.** A âncora sozinha deixou de
 *    bastar quando a tela virou abas: `#funil` não existe no HTML enquanto a
 *    aba Pessoas estiver fechada, e quem marcasse uma presença cairia no
 *    Preparo sem entender o que aconteceu com a lista.
 * 2. **Encontro com gente na lista não se apaga.** Apagá-lo tiraria o encontro
 *    do histórico de cada uma dessas pessoas, de uma vez e sem desfazer.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const EVENTO = "ev-teste";

/** O dia de um encontro que ainda vem, no formato do `<input type="date">`. */
function daquiADias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

describe("ação: criar encontro", () => {
  test("cria com dia e hora, e publica a agenda na mesma gravação", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "Roda de conversa no Pirambu",
      familia: "publico",
      dia: daquiADias(10),
      hora: "19:00",
      local: "Praça do Pirambu",
      naAgenda: "1",
    });

    assert.equal(r.status, 302);
    const eventos = painel.ler("eventos");
    assert.equal(eventos.length, 2);

    const novo = eventos.find((e) => e.titulo === "Roda de conversa no Pirambu");
    assert.ok(novo, "o encontro não foi gravado");
    /* Dois campos na tela, UM instante no arquivo — com o fuso do Ceará junto,
       que é o que faz ordenar e acender o "ao vivo" na hora certa. */
    assert.match(novo.inicio, /T19:00:00-03:00$/);
    assert.match(r.location, new RegExp(`^/painel/eventos\\.php\\?e=${novo.id}$`));

    /* Publica ao gravar, e não por botão: editar o encontro já exige
       coordenação, e "esqueci de publicar" deixa de existir. */
    assert.match(r.html, /Encontro criado/);
  });

  test("sem título não cria, e diz por quê", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "  ",
      familia: "publico",
      dia: daquiADias(5),
    });

    assert.match(r.html, /Dê um nome ao encontro/);
    assert.equal(painel.ler("eventos").length, 1);
  });

  test("família inválida não cria — é ela que traz o playbook e as travas", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro sem família",
      familia: "inventada",
      dia: daquiADias(5),
    });

    assert.match(r.html, /Escolha a família/);
    assert.equal(painel.ler("eventos").length, 1);
  });

  test("sem dia não cria — é o dia que ordena a agenda", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro sem data",
      familia: "publico",
      dia: "",
    });

    assert.match(r.html, /pelo menos o dia/);
    assert.equal(painel.ler("eventos").length, 1);
  });

  test("a hora em branco é hora não definida, e não meia-noite anunciada", async () => {
    await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro sem hora",
      familia: "militancia",
      dia: daquiADias(8),
      hora: "",
    });

    const novo = painel.ler("eventos").find((e) => e.titulo === "Encontro sem hora");
    /* Meia-noite em ponto é como isso fica no instante, e `normalizar_evento()`
       traduz o `0H` de volta para vazio: anunciar um encontro à meia-noite
       seria pior do que não anunciar hora nenhuma. */
    assert.match(novo.inicio, /T00:00:00-03:00$/);
    assert.equal(novo.hora, "", "0H tinha de virar 'hora ainda não definida'");
    assert.ok(novo.dia !== "" && novo.data !== "", "o dia continua, que é o que ordena");
  });
});

describe("ação: marcar o checklist", () => {
  test("marca, desmarca, e volta para a aba Preparo", async () => {
    const r = await painel.postar("eventos", {
      acao: "marcar",
      id: EVENTO,
      peca: "divulgacao",
      item: "0",
    });

    /* A âncora leva ao ponto certo; a aba é o que faz o ponto existir. */
    assert.equal(r.location, `/painel/eventos.php?e=${EVENTO}&aba=preparo#peca-divulgacao`);

    const marcado = painel.ler("eventos").find((e) => e.id === EVENTO);
    assert.deepEqual(marcado.feitos.divulgacao, [0]);

    await painel.postar("eventos", { acao: "marcar", id: EVENTO, peca: "divulgacao", item: "0" });
    const desmarcado = painel.ler("eventos").find((e) => e.id === EVENTO);
    assert.deepEqual(desmarcado.feitos.divulgacao, [], "o segundo clique tem de desmarcar");
  });

  test("item fora do checklist não entra no arquivo", async () => {
    const r = await painel.postar("eventos", {
      acao: "marcar",
      id: EVENTO,
      peca: "divulgacao",
      item: "999",
    });

    assert.match(r.html, /Item de checklist desconhecido/);
    const e = painel.ler("eventos").find((x) => x.id === EVENTO);
    assert.deepEqual(e.feitos.divulgacao, [], "um índice inventado entrou no arquivo");
  });

  test("peça inventada não entra no arquivo", async () => {
    const r = await painel.postar("eventos", {
      acao: "marcar",
      id: EVENTO,
      peca: "inventada",
      item: "0",
    });

    assert.match(r.html, /Item de checklist desconhecido/);
    assert.equal(painel.ler("eventos").find((x) => x.id === EVENTO).feitos.inventada, undefined);
  });
});

describe("ação: tirar alguém do encontro", () => {
  test("tira a LINHA, e não a pessoa", async () => {
    const r = await painel.postar("eventos", {
      acao: "tirar-pessoa",
      id: EVENTO,
      lead: "pr-teste",
    });

    assert.equal(painel.ler("presencas").length, 0, "a presença tinha de sair");
    assert.ok(
      painel.ler("pessoas").some((p) => p.id === "pes00000000teste"),
      "tirar do encontro apagou a pessoa do cadastro",
    );
    assert.match(r.html, /saiu da lista deste encontro/);
  });

  test("volta para a aba Pessoas, que é onde a lista está", async () => {
    const r = await painel.postar("eventos", { acao: "tirar-pessoa", id: EVENTO, lead: "pr-teste" });
    assert.equal(r.location, `/painel/eventos.php?e=${EVENTO}&aba=pessoas#pessoas`);
  });

  test("linha de outro encontro não é tirada por engano", async () => {
    const r = await painel.postar("eventos", {
      acao: "tirar-pessoa",
      id: EVENTO,
      lead: "nao-existe",
    });

    assert.match(r.html, /não está na lista deste encontro/);
    assert.equal(painel.ler("presencas").length, 1);
  });
});

describe("ação: apagar encontro", () => {
  test("encontro com gente na lista não se apaga", async () => {
    const r = await painel.postar("eventos", { acao: "apagar", id: EVENTO });

    assert.equal(painel.ler("eventos").length, 1, "apagou um encontro que tinha lista");
    assert.equal(painel.ler("presencas").length, 1);
    assert.match(r.html, /Cancelado|cancel/i);
  });

  test("encontro sem ninguém na lista se apaga", async () => {
    await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro que não vai acontecer",
      familia: "publico",
      dia: daquiADias(20),
    });
    const vazio = painel.ler("eventos").find((e) => e.titulo === "Encontro que não vai acontecer");

    await painel.postar("eventos", { acao: "apagar", id: vazio.id });

    assert.equal(
      painel.ler("eventos").some((e) => e.id === vazio.id),
      false,
      "encontro sem lista tem de poder ser apagado",
    );
  });
});
