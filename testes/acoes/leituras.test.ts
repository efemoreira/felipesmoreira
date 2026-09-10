import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * LEITURAS NÃO GRAVA NADA. É a régua que separa mesa de leitura: quem veio
 * olhar não muda o que olha. O teste tira a foto de /dados antes, abre as
 * quatro abas (e um POST perdido), e compara.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const foto = () => {
  const dados = path.join(painel.dir, "dados");
  return readdirSync(dados)
    .filter((f) => f.endsWith(".php") || f.endsWith(".json"))
    .map((f) => `${f}:${statSync(path.join(dados, f)).mtimeMs}:${statSync(path.join(dados, f)).size}`)
    .sort()
    .join("\n");
};

describe("leituras: só olha", () => {
  test("abrir as quatro abas não toca em /dados", async () => {
    const antes = foto();
    for (const aba of ["origem", "territorio", "semana", "atividade"]) {
      const r = await painel.buscar("leituras", `aba=${aba}`);
      assert.equal(r.status, 200, `aba ${aba} não abriu`);
    }
    assert.equal(foto(), antes, "uma leitura gravou alguma coisa");
  });

  test("um POST em Leituras não faz nada", async () => {
    const antes = foto();
    const r = await painel.postar("leituras", { acao: "qualquer" });
    assert.equal(r.status, 200, "Leituras respondeu a um POST como se fosse ação");
    assert.equal(foto(), antes);
  });

  test("quem não coordena não abre", async () => {
    painel.trocarCapacidades("comunicacao");
    const r = await painel.buscar("leituras", "");
    assert.equal(r.status, 302);
    assert.match(r.location, /negado=leituras/);
  });

  test("a semana mostra os medidores, e o caixa só para quem administra", async () => {
    const adm = await painel.buscar("leituras", "aba=semana");
    assert.match(adm.html, /class="medidor/);
    assert.match(adm.html, /Os caixas/);

    painel.trocarCapacidades("coordenacao");
    const coord = await painel.buscar("leituras", "aba=semana");
    assert.doesNotMatch(coord.html, /Os caixas/, "a coordenação viu o dinheiro");
  });
});
