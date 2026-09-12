import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: nenhuma tela do painel fica no cache do navegador.
 *
 * É a lista de pessoas com telefone, aberta num celular que às vezes é
 * emprestado. `sessao.php` manda `Cache-Control: no-store, private` para tudo
 * que o inclui; os endpoints públicos que PODEM ser guardados (candidatos,
 * kit) mandam o deles por cima — e o teste confere os dois lados.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

describe("cabeçalhos: o painel não fica no cache", () => {
  for (const tela of ["index", "pessoas", "eventos", "leituras", "conta"]) {
    test(`${tela}.php responde no-store`, async () => {
      const r = await painel.buscar(tela);
      assert.match(r.cabecalhos?.["cache-control"] ?? "", /no-store/, `${tela} sem no-store`);
      assert.match(r.cabecalhos?.["cache-control"] ?? "", /private/);
    });
  }

  test("o que é público de verdade continua com cache curto", async () => {
    const r = await painel.buscar("api/candidatos");
    assert.match(r.cabecalhos?.["cache-control"] ?? "", /max-age=300/, "candidatos.php perdeu o cache público");
    assert.doesNotMatch(r.cabecalhos?.["cache-control"] ?? "", /no-store/);
  });
});
