import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: gravações ao mesmo tempo não se apagam.
 *
 * `gravar_atomico()` garante que o arquivo nunca fica pela metade. Não garante
 * que dois pedidos no mesmo instante não leiam a mesma versão, mudem cada um a
 * sua e o segundo grave por cima do primeiro. Era o que acontecia no QR da
 * porta: trinta celulares, e presenças sumindo sem erro nenhum.
 *
 * A tranca é `com_trava()` em `sessao.php`; quem a usa lê de novo lá dentro.
 * Este teste é a prova: N pedidos em paralelo, N linhas gravadas.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const API = "api/presenca.php";
const QR = { evento: "a".repeat(16) };   // o token da chegada, semeado pelo sandbox
/* Oito, e não trinta: o sandbox sobe o `php -S` com oito processos
   (PHP_CLI_SERVER_WORKERS), e é esse o paralelismo de verdade — oito processos
   lendo e gravando o mesmo arquivo no mesmo instante. Acima disso o servidor
   embutido recusa conexão pelo tamanho da fila, e o teste passaria a medir o
   servidor de teste, não a tranca. */
const N = 8;

/* Cada visitante tem o seu "IP" — senão o teto por visitante (60/h) barra os
   últimos, e o que se mede vira o limite, não a tranca. O teto continua
   valendo: é por isso que existe a variação. Vinte números distintos, DDD
   válido, do jeito que `recusa_de_inscricao()` aceita. */
const telefone = (i: number) => `85 9${String(8100 + i).padStart(4, "0")}-${String(1000 + i * 7).padStart(4, "0")}`;

describe("concorrência: o QR da porta", () => {
  test(`${N} pessoas novas no mesmo instante viram ${N} fichas e ${N} presenças`, async () => {
    const antesPessoas = painel.ler("pessoas").length;
    const antesPresencas = painel.ler("presencas").length;

    const respostas = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        painel.postarJson(API, {
          ...QR,
          telefone: telefone(i),
          nome: `Visitante ${i} da Silva`,
          bairro: "Montese",
          cidade: "Fortaleza",
          consentimento: true,
        }),
      ),
    );

    for (const r of respostas) {
      assert.equal(r.status, 200, JSON.stringify(r.json));
      assert.equal(r.json.ok, true, JSON.stringify(r.json));
    }
    assert.equal(painel.ler("pessoas").length - antesPessoas, N, "ficha sumiu na gravação simultânea");
    assert.equal(painel.ler("presencas").length - antesPresencas, N, "presença sumiu na gravação simultânea");
  });

  test("o mesmo celular reenviando o cadastro não vira duas fichas", async () => {
    const antes = painel.ler("pessoas").length;
    const corpo = {
      ...QR,
      telefone: telefone(3),
      nome: "Ana Reenvio",
      bairro: "Montese",
      cidade: "Fortaleza",
      consentimento: true,
    };
    const respostas = await Promise.all(Array.from({ length: 5 }, () => painel.postarJson(API, corpo)));

    for (const r of respostas) {
      assert.equal(r.json.ok, true, JSON.stringify(r.json));
    }
    assert.equal(painel.ler("pessoas").length - antes, 1, "o clique duplo criou fichas repetidas");
    const dela = painel.ler("presencas").filter((l) => l.eventoId === "ev-teste" && painel.ler("pessoas").some((p) => p.id === l.pessoaId && p.nome === "Ana Reenvio"));
    assert.equal(dela.length, 1, "o clique duplo criou presenças repetidas");
  });

  test("quem já é da lista, confirmando em paralelo, continua uma linha só", async () => {
    /* A pessoa semeada já tem presença no encontro. Oito leituras do QR ao mesmo
       tempo: nenhuma cria linha, todas marcam compareceu. */
    const ela = painel.ler("pessoas").find((p) => p.id === "pes00000000teste");
    const antes = painel.ler("presencas").length;
    const respostas = await Promise.all(
      Array.from({ length: 8 }, () => painel.postarJson(API, { ...QR, acao: "procurar", telefone: ela.telefone })),
    );
    for (const r of respostas) {
      assert.equal(r.json.ok, true, JSON.stringify(r.json));
    }
    assert.equal(painel.ler("presencas").length, antes, "a confirmação em paralelo duplicou a linha");
    const linha = painel.ler("presencas").find((l) => l.pessoaId === ela.id && l.eventoId === "ev-teste");
    assert.equal(linha.compareceu, true);
  });
});
