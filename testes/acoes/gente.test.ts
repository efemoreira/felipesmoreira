import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: "onde temos gente" (api/gente.php) — o que /resultados cruza com a
 * força do partido. A trava é de privacidade: a resposta é só de TOTAIS por
 * cidade e bairro. Nome, telefone ou id de pessoa saindo daqui seria a lista
 * de pessoas aberta para uma página estática.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const json = async () => {
  const r = await painel.buscar("api/gente");
  return { r, corpo: JSON.parse(r.html) };
};

describe("api/gente: totais por cidade e bairro", () => {
  test("quem tem a área Pessoas recebe os totais, e eles somam a base", async () => {
    painel.gravar("pessoas", [
      ...painel.ler("pessoas"),
      { id: "pesgente00000001", nome: "Ana Teste", tipo: "militante", telefone: "(85) 97777-1111", cidade: "Fortaleza", bairro: "Aldeota" },
      { id: "pesgente00000002", nome: "Bia Teste", tipo: "apoiador", telefone: "(85) 97777-2222", cidade: "Fortaleza", bairro: "ALDEOTA" },
    ]);
    const { r, corpo } = await json();
    assert.match(r.cabecalhos?.["cache-control"] ?? "", /no-store/);
    assert.equal(corpo.permitido, true);
    const base = painel.ler("pessoas").filter((p: { status?: string; apagadoEm?: string }) => p.status !== "recusada" && !p.apagadoEm);
    const soma = corpo.cidades.reduce((s: number, c: { total: number }) => s + c.total, 0);
    assert.equal(soma, base.length);
    const fortaleza = corpo.cidades.find((c: { cidade: string }) => c.cidade === "Fortaleza");
    const aldeota = fortaleza.bairros.find((b: { bairro: string }) => b.bairro.toUpperCase() === "ALDEOTA");
    assert.equal(aldeota.total, 2, "Aldeota e ALDEOTA são o mesmo bairro");
    assert.equal(aldeota.porTipo.militante, 1);
  });

  test("nenhum dado pessoal sai na resposta", async () => {
    const { r } = await json();
    for (const p of painel.ler("pessoas")) {
      if (p.telefone) assert.ok(!r.html.includes(p.telefone), "telefone vazou");
      if (p.nome) assert.ok(!r.html.includes(p.nome), `nome vazou: ${p.nome}`);
      assert.ok(!r.html.includes(p.id), "id de pessoa vazou");
    }
  });

  test("sem a área Pessoas, não abre", async () => {
    painel.trocarCapacidades("");
    const { corpo } = await json();
    assert.equal(corpo.permitido, false);
    assert.equal(corpo.cidades, undefined);
  });
});
