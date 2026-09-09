import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { chamarPhp } from "./ponte.ts";

/**
 * O TOKEN DO CONVITE DE ESCALA.
 *
 * Ele é a única autorização de `api/escala.php`, que é aberto sem login — e é
 * aberto de propósito: das 72 pessoas na fila, 58 escolheram função antes de
 * qualquer aprovação, e exigir conta para dizer "topo" seria pedir que a pessoa
 * entre no sistema para poder ajudar.
 *
 * **O que se perde sem este teste** é o token virando palpite. Ele é derivado,
 * não guardado: se a fórmula mudar de forma, todos os links já mandados por
 * WhatsApp param de abrir de uma vez — e ninguém descobre, porque a tela diz
 * "convite não encontrado", que é a mesma resposta de um link legitimamente
 * velho.
 */

/** Três convites que só diferem num dos campos. */
const A = ["pes-1", "ev-1", "recepcao"];
const OUTRA_PESSOA = ["pes-2", "ev-1", "recepcao"];
const OUTRO_EVENTO = ["pes-1", "ev-2", "recepcao"];
const OUTRA_PECA = ["pes-1", "ev-1", "captacao"];

describe("escala: o token do convite", () => {
  test("é estável entre chamadas — o link mandado ontem abre hoje", () => {
    const [a, b] = chamarPhp([
      { fn: "token_de_escala", args: A },
      { fn: "token_de_escala", args: A },
    ]) as string[];

    assert.equal(a, b);
    /* 24 caracteres de hex: o mesmo tamanho do QR de presença e do convite do
       Dia 0. Curto o bastante para caber numa mensagem, longo o bastante para
       não se adivinhar. */
    assert.match(a, /^[0-9a-f]{24}$/);
  });

  test("muda com a pessoa, com o encontro e com a peça", () => {
    const [base, pessoa, evento, peca] = chamarPhp([
      { fn: "token_de_escala", args: A },
      { fn: "token_de_escala", args: OUTRA_PESSOA },
      { fn: "token_de_escala", args: OUTRO_EVENTO },
      { fn: "token_de_escala", args: OUTRA_PECA },
    ]) as string[];

    /* Se o token não amarrasse os três, o link de uma pessoa responderia pela
       outra — e a escala inteira viraria palpite de quem clicou primeiro. */
    assert.notEqual(base, pessoa, "o token não distingue quem foi convidado");
    assert.notEqual(base, evento, "o token não distingue o encontro");
    assert.notEqual(base, peca, "o token não distingue a peça");
  });

  test("o link carrega os três campos junto do token", () => {
    /* O token é assinatura, não chave: não é reversível. Sem os ids na URL o
       servidor não teria o que conferir. */
    const [url] = chamarPhp([
      {
        fn: "url_do_convite",
        args: [
          { id: "pes-1", nome: "Fulana" },
          { id: "ev-1", titulo: "Encontro" },
          "recepcao",
        ],
      },
    ]) as string[];

    assert.match(url, /\/convite\?/);
    for (const parte of ["p=pes-1", "e=ev-1", "f=recepcao", "t="]) {
      assert.ok(url.includes(parte), `faltou ${parte} em ${url}`);
    }
  });

  test("peça que não existe não vira link", () => {
    const [url] = chamarPhp([
      {
        fn: "url_do_convite",
        args: [{ id: "pes-1", nome: "Fulana" }, { id: "ev-1", titulo: "Encontro" }, "inventada"],
      },
    ]) as string[];

    assert.equal(url, "", "montou convite para uma peça que não existe");
  });
});
