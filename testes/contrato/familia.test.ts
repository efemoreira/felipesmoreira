import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NOMES_FAMILIA } from "../../src/features/programacao/tipos.ts";
import { chamarPhp } from "./ponte.ts";

/**
 * `NOMES_FAMILIA` (TS) ↔ `FAMILIAS` (PHP, `eventos-comum.php`)
 *
 * O `agenda.json` manda a CHAVE da família (`item_publico()`); quem traduz em
 * rótulo do filtro é o `NOMES_FAMILIA` da `/programacao`. Se as duas listas
 * divergirem — uma chave nova no painel sem par aqui, ou um nome que muda de
 * um lado e não do outro — o filtro da agenda mostra uma categoria com nome
 * errado, ou pior, silenciosamente não mostra a categoria nova nenhuma.
 */
describe("família do encontro: mesma chave, mesmo nome dos dois lados", () => {
  test("as chaves batem", async () => {
    const [nomesPhp] = chamarPhp([{ fn: "nomes_das_familias", args: [] }]) as [Record<string, string>];

    assert.deepEqual(
      Object.keys(nomesPhp).sort(),
      Object.keys(NOMES_FAMILIA).sort(),
      "FAMILIAS (PHP) e NOMES_FAMILIA (TS) têm de ter exatamente as mesmas chaves",
    );
  });

  test("os nomes batem", async () => {
    const [nomesPhp] = chamarPhp([{ fn: "nomes_das_familias", args: [] }]) as [Record<string, string>];

    for (const chave of Object.keys(NOMES_FAMILIA)) {
      assert.equal(
        NOMES_FAMILIA[chave as keyof typeof NOMES_FAMILIA],
        nomesPhp[chave],
        `o nome de "${chave}" diverge entre o painel e a /programacao`,
      );
    }
  });
});
