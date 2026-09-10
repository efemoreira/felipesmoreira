import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * O MUTIRÃO DA SEMANA — a porta de entrada da comunicação.
 *
 * A comunicação não falha por falta de gente: falha por TOPOLOGIA. As seis
 * funções do grupo (Olheiro → Checagem → Roteirista → Design → Editor →
 * Acervo) formam uma corrente, e uma corrente só produz com os seis elos vivos
 * no mesmo dia. Falta um elo e tudo para — e quem está a montante vê o próprio
 * trabalho morrer e sai. Pior: a corrente só se monta se seis pessoas
 * escolherem seis funções.
 *
 * O mutirão é o contrário: a peça já vem pronta, cada um age sozinho, e o
 * `?de=` transforma "compartilhe" em trabalho que se mede.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/** Uma peça no ar, que é o que o mutirão escala. */
function comPeca(publicada = true) {
  painel.gravar("kit", [{
    id: "esgoto-a1b2",
    tema: "Periferia",
    numero: "1 pra 4",
    frase: "Cada real investido em esgoto economiza quatro em hospital.",
    fonte: "Plano de Governo, p. 18",
    legenda: "Está tudo escrito, com meta e de onde vem o dinheiro:",
    destino: "/propostas#periferia-com-estado",
    publicada,
    criadaEm: "2026-09-01T10:00:00-03:00",
    criadaPor: "Teste",
  }]);
}

describe("mutirão: escalar a semana", () => {
  test("escalar põe a peça para todo mundo que tem conta ativa", async () => {
    comPeca();
    const r = await painel.postar("municao", { acao: "mutirao-peca", peca: "esgoto-a1b2" });

    assert.equal(r.status, 302);
    const semanas = painel.ler("mutirao") as unknown as Record<string, Record<string, unknown>>;
    const semana = Object.values(semanas)[0];
    assert.equal(semana.peca, "esgoto-a1b2");
    /* Quem se cadastrou na porta de um encontro não tem conta e não é cobrada;
       quem tem conta é, sem peneira: a peça não depende de função nenhuma. */
    assert.deepEqual(Object.keys(semana.escalados as object), [ADMIN]);
  });

  test("peça fora do ar não vira mutirão", async () => {
    comPeca(false);
    const r = await painel.postar("municao", { acao: "mutirao-peca", peca: "esgoto-a1b2" });
    assert.match(r.html, /Publique antes de escalar/);
  });

  test("trocar a peça no meio da semana não apaga quem já postou", async () => {
    comPeca();
    await painel.postar("municao", { acao: "mutirao-peca", peca: "esgoto-a1b2" });
    await painel.postar("municao", { acao: "mutirao-postou", quem: ADMIN });
    await painel.postar("municao", { acao: "mutirao-peca", peca: "esgoto-a1b2" });

    const semana = Object.values(painel.ler("mutirao") as unknown as Record<string, { escalados: Record<string, string> }>)[0];
    assert.equal(semana.escalados[ADMIN], "postou", "o trabalho feito foi apagado");
  });
});

describe("mutirão: a peça chega em quem posta", () => {
  test("o Início mostra a peça com o link atribuído", async () => {
    comPeca();
    await painel.postar("municao", { acao: "mutirao-peca", peca: "esgoto-a1b2" });
    const { html } = await painel.buscar("index");

    assert.match(html, /A peça desta semana/);
    /* O `?de=` é o par PHP de `slugDe()`, e sem ele "compartilhe" não vira
       conta nenhuma — não há como saber qual militante traz gente.

       Sem percent-encoding: o cartão do Início COPIA o texto (`data-copiar`), e
       não abre o WhatsApp. Quem copia cola onde quiser. */
    assert.match(html, /municao\?de=coordenacao-de-teste/);
  });

  test("“Já postei” some da cobrança e entra na conta da semana", async () => {
    comPeca();
    await painel.postar("municao", { acao: "mutirao-peca", peca: "esgoto-a1b2" });

    const antes = await painel.buscar("index");
    assert.match(antes.html, /Postar a peça da semana/);

    await painel.postar("index", { acao: "postei-a-peca" });

    const depois = await painel.buscar("index");
    assert.doesNotMatch(depois.html, /Postar a peça da semana/);
    assert.match(depois.html, /Você já postou esta semana/);
  });

  test("sem peça escalada, ninguém é cobrado", async () => {
    comPeca();
    const { html } = await painel.buscar("index");
    /* A ÂNCORA POSITIVA PRIMEIRO. "Não contém X" é verdade em qualquer página —
       inclusive numa de erro —, e foi assim que estes testes passaram verdes
       apontando para `/painel/.php`. Provar que estamos no Início é o que dá
       sentido à ausência. */
    assert.match(html, /class="hub-lado"/, "não é o Início");
    assert.doesNotMatch(html, /A peça desta semana/);
  });
});
