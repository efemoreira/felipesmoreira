import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * SMOKE TEST DO PAINEL: toda tela abre, e abre sem aviso do PHP.
 *
 * É o teste mais barato que existe e o que mais pega. Erro de PHP não aparece
 * na tela — um índice que não existe vira aviso no stderr e a página sai com
 * cara de página; um `require` que faltou derruba a resposta no meio e o
 * navegador mostra metade do HTML sem dizer nada. Foi este teste, rodado antes
 * e depois, que provou a divisão de `eventos.php` em cinco arquivos.
 *
 * Cobre a MOLDURA e o CAMINHO, não a regra: a regra está nos testes de
 * contrato. Aqui a pergunta é só "abriu inteiro e em silêncio?".
 */

const TELAS: [tela: string, querystring: string, apelido: string][] = [
  ["index", "", "hub"],
  ["eventos", "", "lista de encontros"],
  ["eventos", "aba=passados", "encontros já passados"],
  ["eventos", "q=benfica", "busca de encontro"],
  ["eventos", "novo=1", "modal de novo encontro"],
  ["eventos", "e=ev-teste", "encontro aberto — Preparo"],
  ["eventos", "e=ev-teste&aba=pessoas", "encontro aberto — Pessoas"],
  ["eventos", "e=ev-teste&aba=pessoas&q=maria", "busca dentro do encontro"],
  ["eventos", "e=ev-teste&aba=dados", "encontro aberto — Dados"],
  ["eventos", "e=nao-existe", "encontro que não existe"],
  ["pessoas", "", "lista de pessoas"],
  ["pessoas", "q=maria", "busca de pessoa"],
  ["pessoas", "tipo=militante", "recorte por tipo"],
  ["pessoas", "p=pes00000000teste", "ficha aberta"],
  ["pessoas", "editar=pes00000000teste", "modal de edição"],
  ["pessoas", "novo=1", "modal de cadastro"],
  ["candidatos", "", "candidatos"],
  ["candidatos", "aba=listas", "listas de candidatos"],
  ["candidatos", "novo=1", "modal de candidato"],
  ["fatos", "", "fatos do dia"],
  ["fatos", "q=obra", "busca de fato"],
  ["producao", "", "quadro de produção"],
  ["producao", "dono=atrasados", "recorte de atrasados"],
  ["municao", "", "munição"],
  ["aulas", "", "formação"],
  ["inscricoes", "", "fila de entrada"],
  ["inscricoes", "aba=decididas", "inscrições já decididas"],
  ["inscricoes", "aba=origens", "de onde vem a militância"],
  ["inscricoes", "q=maria", "busca na fila de entrada"],
  ["agenda", "", "capa da programação"],
  ["procurar", "", "busca global vazia"],
  ["procurar", "q=benfica", "busca global com resultado"],
  ["conta", "", "minha conta"],
  ["manutencao", "", "manutenção"],
];

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

describe("fumaça: toda tela do painel abre inteira e em silêncio", () => {
  for (const [tela, qs, apelido] of TELAS) {
    test(apelido, () => {
      const { html, erros, status } = painel.abrir(tela, qs);

      assert.equal(status, 0, `o PHP saiu com ${status}:\n${erros}`);

      /* Aviso do PHP é a coisa mais barata de deixar passar e a mais cara de
         descobrir depois: ele não aparece na tela, e em produção `display_errors`
         está desligado. */
      const ruido = erros
        .split("\n")
        .filter((l) => /Warning|Notice|Deprecated|Fatal|Uncaught|Undefined/i.test(l))
        .filter((l) => !/session_|headers already sent|Cannot modify header/i.test(l));
      assert.deepEqual(ruido, [], `o PHP reclamou ao desenhar ${tela}?${qs}`);

      /* Resposta cortada no meio sai com cara de página: o `<html>` está lá, o
         `</html>` não. É o sintoma de erro fatal com display_errors desligado. */
      assert.match(html, /<!doctype html>/i, `${tela}?${qs} não devolveu um documento`);
      assert.match(html, /<\/html>\s*$/, `${tela}?${qs} terminou no meio — resposta cortada`);
      assert.ok(html.length > 2000, `${tela}?${qs} devolveu só ${html.length} bytes`);
    });
  }

  test("nenhuma tela vaza o convite do grupo de trabalho", () => {
    /* O painel PODE mostrar o grupo de trabalho — é dele. O que este teste
       garante é que ele aparece onde deve: no hub, e não espalhado por telas
       que qualquer pessoa com uma área qualquer abre. */
    const ondeAparece = TELAS.filter(([tela, qs]) =>
      painel.abrir(tela, qs).html.includes("chat.whatsapp.com/C8rQ"),
    ).map(([tela, qs]) => (qs ? `${tela}?${qs}` : tela));

    assert.deepEqual(ondeAparece, ["index"], "o grupo de trabalho saiu do hub");
  });
});
