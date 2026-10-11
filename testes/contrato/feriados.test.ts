import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { chamarPhp } from "./ponte.ts";
import { FERIADOS, feriadoEm } from "@/lib/feriados";

/**
 * OS FERIADOS NOS DOIS LADOS. O painel avisa quem marca encontro em feriado;
 * o site avisa na ficha da atividade. Se as listas divergirem, um diz "é
 * feriado" e o outro não — e quem marca e quem vai planejam dias diferentes.
 */
const [php, ...casos] = chamarPhp([
  { fn: "feriados_do_painel", args: [] },
  { fn: "feriado_em", args: ["2027-03-19", "Fortaleza"] },
  { fn: "feriado_em", args: ["2027-03-19", "Caucaia"] },
  { fn: "feriado_em", args: ["2027-03-19", ""] },
  { fn: "feriado_em", args: ["2027-03-25", "Caucaia"] },
  { fn: "feriado_em", args: ["2027-03-20", "Fortaleza"] },
]) as [Record<string, { nome: string; onde: string }>, ...unknown[]];

describe("feriados: TS e PHP", () => {
  test("a mesma lista", () => {
    assert.deepEqual(FERIADOS, php);
  });

  test("feriado de Fortaleza só vale em Fortaleza (ou sem cidade), nos dois", () => {
    const ts = [
      feriadoEm("2027-03-19", "Fortaleza"),
      feriadoEm("2027-03-19", "Caucaia"),
      feriadoEm("2027-03-19", ""),
      feriadoEm("2027-03-25", "Caucaia"),
      feriadoEm("2027-03-20", "Fortaleza"),
    ];
    assert.deepEqual(ts, casos);
    assert.equal(ts[1], null);
    assert.notEqual(ts[3], null, "Data Magna é do estado inteiro");
  });
});
