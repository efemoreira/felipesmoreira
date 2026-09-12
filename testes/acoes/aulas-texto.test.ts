import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a coordenação corrige o texto de uma aula, e vale na hora — sem
 * deploy, sem tocar o código.
 *
 * O patch em `dados/aulas-texto.php` fica por cima de `aulas-conteudo.php`:
 * `api/aulas.php` serve o texto corrigido; o arquivo do código não muda;
 * "voltar ao original" tira o patch; texto igual ao código não vira patch;
 * a Manutenção mostra o consolidado e zera.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const AULA = "regras-de-todos";

async function curriculo() {
  const r = await painel.buscar("api/aulas");
  return JSON.parse(r.html);
}
function aulaServida(c: { dias: { aulas: { id: string }[] }[] } | { curriculo: { aulas: { id: string }[] }[] }, id: string) {
  const dias = (c as { dias?: unknown[] }).dias ?? (c as { curriculo?: unknown[] }).curriculo ?? [];
  for (const d of dias as { aulas: { id: string }[] }[]) {
    const a = d.aulas.find((x) => x.id === id);
    if (a) return a as { id: string; resumo: string; blocos: { tipo: string; texto?: string; itens?: string[] }[] };
  }
  throw new Error(`aula ${id} não servida`);
}

describe("aulas: o texto por patch", () => {
  test("salvar um bloco muda o que /aulas recebe e não muda o código", async () => {
    const antes = aulaServida(await curriculo(), AULA);
    const original = antes.blocos[0].texto!;
    const r = await painel.postar("aulas", { acao: "texto", aula: AULA, resumo: antes.resumo, "blocos[0]": "Frase corrigida pela coordenação." });
    assert.match(r.html, /Texto salvo: 1 trecho/);

    const depois = aulaServida(await curriculo(), AULA);
    assert.equal(depois.blocos[0].texto, "Frase corrigida pela coordenação.");
    assert.equal(depois.blocos[1].tipo, antes.blocos[1].tipo, "o resto da aula mudou");

    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const codigo = readFileSync(path.join(painel.dir, "painel", "aulas-conteudo.php"), "utf8");
    assert.ok(codigo.includes(original), "o código foi alterado — o patch devia ficar em /dados");
    assert.ok(!codigo.includes("Frase corrigida pela coordenação"));
  });

  test("texto igual ao do código não vira patch", async () => {
    const a = aulaServida(await curriculo(), AULA);
    const r = await painel.postar("aulas", { acao: "texto", aula: AULA, resumo: a.resumo, "blocos[0]": a.blocos[0].texto! });
    assert.match(r.html, /nada a sobrescrever/);
  });

  test("lista: um item por linha, e 'voltar ao original' desfaz", async () => {
    const a = aulaServida(await curriculo(), AULA);
    const i = a.blocos.findIndex((b) => b.tipo === "passos");
    assert.ok(i >= 0);
    await painel.postar("aulas", { acao: "texto", aula: AULA, resumo: a.resumo, [`blocos[${i}]`]: "Um\nDois\n\nTrês" });
    let servida = aulaServida(await curriculo(), AULA);
    assert.deepEqual(servida.blocos[i].itens, ["Um", "Dois", "Três"]);

    await painel.postar("aulas", { acao: "texto", aula: AULA, resumo: a.resumo, [`blocos[${i}]`]: "Um", "original[]": [String(i)] });
    servida = aulaServida(await curriculo(), AULA);
    assert.deepEqual(servida.blocos[i].itens, a.blocos[i].itens, "voltar ao original não voltou");
  });

  test("a Manutenção mostra o consolidado e zera", async () => {
    const a = aulaServida(await curriculo(), AULA);
    await painel.postar("aulas", { acao: "texto", aula: AULA, resumo: "Resumo novo.", "blocos[0]": a.blocos[0].texto! });
    const { html } = painel.abrir("manutencao", "");
    assert.match(html, /Texto das aulas sobrescrito \(1 aula\)/);
    assert.match(html, /const CURRICULO = /);
    assert.match(html, /Resumo novo\./);

    await painel.postar("manutencao", { acao: "zerar-aulas-texto" });
    assert.equal(aulaServida(await curriculo(), AULA).resumo, a.resumo);
  });

  test("a tela marca a aula editada e quem editou", async () => {
    const a = aulaServida(await curriculo(), AULA);
    await painel.postar("aulas", { acao: "texto", aula: AULA, resumo: a.resumo, "blocos[0]": "Outra frase." });
    const { html } = painel.abrir("aulas", `aba=conteudo&texto=${AULA}`);
    assert.match(html, /editada por Coordenação de Teste/);
    assert.match(html, /Outra frase\./);
  });
});
