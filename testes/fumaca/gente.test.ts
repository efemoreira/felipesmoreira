import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox, ADMIN } from "../sandbox.ts";

/**
 * SUA GENTE — a tela de quem acompanha alguém, e a regra que ela não pode furar.
 *
 * `pessoas` é `adm` porque tem o telefone de todo mundo. Quem lidera vê nome e
 * WhatsApp da PRÓPRIA gente, e de mais ninguém — e a única forma honesta de
 * conferir isso é semear duas líderes, abrir a tela como uma delas e procurar
 * no HTML o nome de quem é da outra.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => {
  painel.ressemear();
  painel.trocarCapacidades("adm");
  painel.gravar("pessoas", [
    ...painel.ler("pessoas"),
    {
      id: "lid00000000outra", usuario: "outra", nome: "Outra Líder",
      hash: "x", capacidades: ["lideranca"], tipo: "militante", status: "aprovada",
      ativo: true, criadoEm: "2026-01-01T10:00:00-03:00",
    },
    {
      id: "pes00000000ana", nome: "Ana Acompanhada", telefone: "85988880000",
      lider: ADMIN, tipo: "militante", status: "aprovada", ativo: true,
      criadoEm: "2026-02-01T10:00:00-03:00",
    },
    {
      id: "pes00000000bia", nome: "Bia Da Outra", telefone: "85977770000",
      lider: "lid00000000outra", tipo: "militante", status: "aprovada", ativo: true,
      criadoEm: "2026-02-01T10:00:00-03:00",
    },
  ]);
});
after(() => painel.fechar());

describe("sua gente: só a própria", () => {
  test("a líder vê quem está sob ela, com o WhatsApp — e não vê a gente da outra", () => {
    const { html, erros } = painel.abrir("gente", "");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /Ana Acompanhada/, "a própria gente não apareceu");
    assert.match(html, /wa\.me\/5585988880000/, "o WhatsApp da própria gente não apareceu");
    assert.doesNotMatch(html, /Bia Da Outra/, "a gente da OUTRA líder vazou");
    assert.doesNotMatch(html, /85977770000|5585977770000/, "o telefone da gente da outra líder vazou");
  });

  test("a capacidade Liderança abre a tela — é para ela que a tela existe", () => {
    painel.trocarCapacidades("lideranca");
    const { html } = painel.abrir("gente", "");
    assert.match(html, /Ana Acompanhada/);
    assert.doesNotMatch(html, /Bia Da Outra/);
  });

  test("quem não acompanha ninguém não abre a tela", () => {
    painel.trocarCapacidades("comunicacao");
    const { html } = painel.abrir("gente", "");
    assert.doesNotMatch(html, /Ana Acompanhada|Bia Da Outra/, "a tela abriu para quem não lidera");
    assert.doesNotMatch(html, /<!doctype html>/i, "a tela desenhou em vez de redirecionar");
  });

  test("os recortes têm URL própria e não inventam gente", () => {
    for (const tipo of ["esfriando", "sem-estudar", "inexistente"]) {
      const { html, erros } = painel.abrir("gente", `tipo=${tipo}`);
      assert.doesNotMatch(erros, /Warning|Undefined/, `tipo=${tipo}: ${erros}`);
      assert.match(html, /<\/html>\s*$/, `tipo=${tipo} terminou no meio`);
      assert.doesNotMatch(html, /Bia Da Outra/, `tipo=${tipo} vazou a gente da outra líder`);
    }
  });
});

describe("sua gente: a porta", () => {
  test("o menu tem o item para quem lidera, e não para quem não lidera", () => {
    assert.match(painel.abrir("conta", "").html, /href="\/painel\/gente\.php"/, "o item sumiu do menu da líder");

    painel.trocarCapacidades("comunicacao");
    assert.doesNotMatch(painel.abrir("conta", "").html, /gente\.php/, "o menu ofereceu Sua gente a quem não lidera");
  });

  test("o hub mostra o contador e a porta, não a lista", () => {
    const { html } = painel.abrir("index", "");
    assert.match(html, /Sua gente \(1\)/, "o cartão-contador sumiu do hub");
    assert.match(html, /href="\/painel\/gente\.php/, "o cartão do hub não leva à tela");
    /* O nome e o WhatsApp de cada pessoa são da tela, não do hub: o hub
       responde "quantos", e a rolagem que ele economiza é a razão da tela. */
    assert.doesNotMatch(html, /wa\.me\/5585988880000/, "a lista inteira continua no hub");
  });
});

describe("pessoas: a ficha é uma tela, não um bloco em cima da lista", () => {
  test("abrir a ficha não desenha a lista, e a lista não desenha ficha nenhuma", () => {
    painel.trocarCapacidades("adm");
    const ficha = painel.abrir("pessoas", "p=pes00000000ana").html;
    assert.match(ficha, /Ana Acompanhada/);
    assert.match(ficha, /Seções da ficha/, "a ficha não tem abas");
    assert.doesNotMatch(ficha, /id="lista"/, "a lista veio junto com a ficha");
    assert.doesNotMatch(ficha, /Bia Da Outra/, "outra pessoa apareceu na ficha de Ana");

    const lista = painel.abrir("pessoas", "").html;
    assert.match(lista, /id="lista"/);
    assert.doesNotMatch(lista, /id="ficha"|Seções da ficha/, "a lista desenhou uma ficha");
  });

  test("as ações de acesso voltam para a aba Acesso, e a senha provisória aparece lá", async () => {
    painel.trocarCapacidades("adm");
    const r = await painel.postar("pessoas", { acao: "dar-conta", id: "pes00000000ana", usuario: "ana.acompanhada" });
    assert.match(r.location, /p=pes00000000ana&aba=acesso/);
    assert.match(r.html, /Senha provisória/);
  });
});
