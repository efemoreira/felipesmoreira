import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  ORDEM_COLINHA,
  VAGAS,
  porCargo,
  montarColinha,
} from "../../src/features/candidatos/cargos.ts";
import type { Candidato } from "../../src/lib/api/candidatos.ts";
import { chamarPhp } from "./ponte.ts";

/**
 * A colinha por cargo: `ORDEM_COLINHA` (TS) ↔ `CARGOS` / `cargo_titular()` (PHP).
 *
 * O site agrupa pela chave que o PHP manda. Se uma chave da ordem da colinha
 * deixar de existir em `CARGOS`, a seção some do site sem erro nenhum — e o
 * eleitor não acha o número do senador.
 */

describe("colinha: as chaves do TypeScript existem no PHP", () => {
  test("todo cargo da colinha é um cargo de CARGOS", () => {
    const rotulos = chamarPhp(ORDEM_COLINHA.map((k) => ({ fn: "rotulo_cargo", args: [k] }))) as string[];
    ORDEM_COLINHA.forEach((k, i) => assert.notEqual(rotulos[i], "", `"${k}" não existe em CARGOS`));
  });

  test("vice e suplente caem na seção de um cargo da colinha", () => {
    const vices = ["vice-presidente", "vice-governador", "suplente-1", "suplente-2"];
    const secoes = chamarPhp(vices.map((k) => ({ fn: "cargo_titular", args: [k] }))) as string[];
    const eVice = chamarPhp(vices.map((k) => ({ fn: "cargo_de_vice", args: [k] }))) as boolean[];
    vices.forEach((k, i) => {
      assert.ok((ORDEM_COLINHA as readonly string[]).includes(secoes[i]), `${k} caiu em "${secoes[i]}"`);
      assert.equal(eVice[i], true, `${k} deixou de ser vice no PHP`);
    });
  });
});

function c(id: string, secao: string, extra: Partial<Candidato> = {}): Candidato {
  return {
    id, nome: id, cargo: secao, numero: "14", partido: "", instagram: "", imagem: "",
    chave: secao, secao, vice: false, titular: "", linkRedes: "", ...extra,
  };
}

describe("colinha: montagem", () => {
  const chapa = [
    c("fed1", "deputado-federal", { numero: "1401" }),
    c("gov", "governador"),
    c("vice", "vice-governador", { secao: "governador", vice: true, titular: "gov" }),
    c("fed2", "deputado-federal", { numero: "1402" }),
    c("pres", "presidente"),
    c("sen", "senador", { numero: "141" }),
    c("ver", "vereador", { numero: "14123" }),
  ];

  test("seções na ordem da colinha, e só as que existem", () => {
    const { secoes, outros } = porCargo(chapa);
    assert.deepEqual(secoes.map((s) => s.chave), ["presidente", "governador", "senador", "deputado-federal"]);
    assert.deepEqual(outros.map((x) => x.id), ["ver"]);
  });

  test("vice nunca entra na colinha; fixos e cargo de um só entram sem escolha", () => {
    const linhas = montarColinha(porCargo(chapa).secoes, {});
    const ids = linhas.map((l) => l.candidato?.id ?? null);
    assert.ok(!ids.includes("vice"));
    assert.deepEqual(ids, ["pres", "gov", "sen", null, null], "senado tem 2 votos; federal sem escolha fica em branco");
    assert.equal(linhas.length, 1 + 1 + VAGAS.senador + 1);
  });

  test("a escolha do eleitor preenche o federal", () => {
    const linhas = montarColinha(porCargo(chapa).secoes, { "deputado-federal": ["fed2"] });
    assert.equal(linhas.find((l) => l.chave === "deputado-federal")!.candidato!.id, "fed2");
  });

  test("vice sem titular no ar aparece na seção, mas a colinha fica em branco", () => {
    const soVice = chapa.filter((x) => x.id !== "gov");
    const { secoes } = porCargo(soVice);
    const gov = secoes.find((s) => s.chave === "governador")!;
    assert.equal(gov.entradas[0].titular, null);
    assert.equal(montarColinha(secoes, {}).find((l) => l.chave === "governador")!.candidato, null);
  });
});
