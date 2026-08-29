import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * FUMAÇA: o hub mostra a trilha mínima de quem TEM função.
 *
 * A conta semeada do painel de teste não tem função nenhuma — é coordenação —,
 * e por isso nem a mesa de trabalho nem a trilha aparecem na fumaça geral. Este
 * arquivo existe para cobrir justamente esse caminho: sem ele, "Para operar
 * como Olheiro" podia sumir do hub e nenhum teste notaria.
 *
 * O que se confere aqui é o ENCADEAMENTO que o plano pede — função → aula →
 * "Pronto quando" → primeira ferramenta —, e não o texto da tela.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();

  const pessoas = painel.ler("pessoas").map((p) =>
    p.id === ADMIN ? { ...p, funcoes: ["olheiro"] } : p,
  );
  painel.gravar("pessoas", pessoas);
});
after(() => painel.fechar());

describe("fumaça: a trilha da função no hub", () => {
  test("quem é Olheiro vê a aula, o checklist e a ferramenta do Olheiro", () => {
    const { html, erros, status } = painel.abrir("index", "");

    assert.equal(status, 0, `o PHP saiu com ${status}:\n${erros}`);
    assert.match(html, /Para operar como Olheiro/, "a trilha não foi desenhada");

    /* A aula da função, e não a próxima do currículo: são perguntas
       diferentes, e o hub mostra as duas por isso. */
    assert.match(html, /\/aulas#olheiro/, "a trilha não linkou a aula do Olheiro");

    /* A mesa leva à ficha em branco de /painel/fatos, e não ao topo da fila:
       o verbo do Olheiro é trazer. */
    assert.match(
      html,
      /\/painel\/fatos\.php\?aba=trazer#trazer/,
      "a mesa do Olheiro deixou de apontar para a aba de trazer",
    );
  });

  test("a aula concluída aparece como feita, e não como minutos a estudar", () => {
    /* Antes de marcar, a trilha oferece o tamanho da aula; depois, o estado
       dela. É a diferença entre "o que falta" e "o que já foi". */
    assert.match(painel.abrir("index", "").html, /selo-atencao/);

    /* O progresso se semeia, e não se clica: quem marca aula é o
       `api/aulas.php`, que pede JSON e confere o Origin — coisa de navegador,
       e não o assunto deste teste. */
    painel.gravar("aulas-progresso", { [ADMIN]: { olheiro: "2026-08-29T10:00:00-03:00" } });

    const { html } = painel.abrir("index", "");
    assert.match(html, /aula feita/, "concluir a aula da função não mudou nada na trilha");
  });
});
