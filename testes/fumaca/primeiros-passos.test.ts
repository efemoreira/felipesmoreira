import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * FUMAÇA: quem acabou de chegar vê três passos, não dez blocos.
 *
 * O hub inteiro é a tela de quem já trabalha aqui. Para a pessoa aprovada
 * ontem, com uma função e sem ter feito nada, ele abre com os primeiros
 * passos (grupo → aula da função → primeira coisa na mesa) e só. Feitos os
 * três, o hub inteiro volta. Coordenação e administração nunca entram no
 * modo — têm o painel para tocar.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/* A conta de teste vira militante de comunicação com a função Olheiro, sem
   ter entrado no grupo nem estudado. */
function virarMilitanteNova() {
  painel.trocarCapacidades("comunicacao");
  painel.gravar(
    "pessoas",
    painel.ler("pessoas").map((p) => (p.id === ADMIN ? { ...p, funcoes: ["olheiro"], entrouNoGrupo: false } : p)),
  );
}

describe("hub: os primeiros passos", () => {
  test("militante nova vê os três passos e nenhuma seção do hub", () => {
    virarMilitanteNova();
    const { html } = painel.abrir("index", "");
    assert.match(html, /Seus primeiros passos · 0 de 3/);
    assert.match(html, /Entrar no grupo de trabalho/);
    assert.match(html, /Fazer a aula:/);
    assert.match(html, /em Fatos do dia/, "o terceiro passo não é a mesa do Olheiro");
    assert.doesNotMatch(html, /<h2 class="secao">Esperando você/, "a fila apareceu junto com os passos");
    assert.doesNotMatch(html, /Próximos encontros/, "os encontros apareceram junto com os passos");
  });

  test("?tudo=1 abre o hub inteiro mesmo assim", () => {
    virarMilitanteNova();
    const { html } = painel.abrir("index", "tudo=1");
    assert.match(html, /<h2 class="secao">Esperando você/);
    assert.doesNotMatch(html, /Seus primeiros passos/);
  });

  test("o passo dado aparece marcado, e conta", () => {
    virarMilitanteNova();
    painel.gravar(
      "pessoas",
      painel.ler("pessoas").map((p) => (p.id === ADMIN ? { ...p, entrouNoGrupo: true } : p)),
    );
    const { html } = painel.abrir("index", "");
    assert.match(html, /Seus primeiros passos · 1 de 3/);
    assert.match(html, /passo passo-feito/);
  });

  test("a coordenação nunca vê o modo", () => {
    painel.trocarCapacidades("coordenacao");
    painel.gravar(
      "pessoas",
      painel.ler("pessoas").map((p) => (p.id === ADMIN ? { ...p, funcoes: ["olheiro"], entrouNoGrupo: false } : p)),
    );
    const { html } = painel.abrir("index", "");
    assert.doesNotMatch(html, /Seus primeiros passos/);
    assert.match(html, /<h2 class="secao">Esperando você/);
  });
});

describe("hub: conta sem função não entra no modo", () => {
  test("quem tem só a capacidade Eventos, sem função, vê o hub inteiro", () => {
    painel.trocarCapacidades("eventos");
    const { html } = painel.abrir("index", "");
    assert.doesNotMatch(html, /Seus primeiros passos/);
    assert.match(html, /<h2 class="secao">Esperando você/);
  });
});
