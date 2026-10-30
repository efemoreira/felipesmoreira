import { test } from "node:test";
import assert from "node:assert/strict";
import { compararValores, enxugarColunas, gerarCsv } from "../../src/features/resultados/tabelaDados.ts";

test("ordenação mantém ausentes no fim nas duas direções e compara números como números", () => {
  for (const desc of [true, false]) {
    const values = [undefined, 12, NaN, 2, Infinity, "", null];
    const sorted = values.sort((a,b) => compararValores(a,b,desc));
    assert.deepEqual(sorted.slice(0,2), desc ? [12,2] : [2,12]);
    assert.equal(compararValores(NaN,undefined,desc),0);
    assert.equal(compararValores(null,"",desc),0);
  }
  assert.ok(compararValores("Local 2","Local 10",false) < 0);
});

test("CSV preserva porcentagem no Excel, escape e ausência, e bloqueia fórmulas em texto", () => {
  const csv = gerarCsv([{ nome: 'Escola; "A"\rB', pct: 0.125, falta: NaN }, { nome: '=1+1', pct: 0 }], [
    { chave: "nome", rotulo: "Nome" }, { chave: "pct", rotulo: "%", tipo: "pct" }, { chave: "falta", rotulo: "Ausente" },
  ]);
  assert.equal(csv, '\uFEFFNome;%;Ausente\r\n"Escola; ""A""\rB";12,5%;\r\n\'=1+1;0%;');
});

test("coluna sem dado some e coluna fixável de valor único vira frase", () => {
  const linhas = [{ nome: "A", gov: undefined, situacao: "Conferido", falta: 0, n: 1 }, { nome: "B", situacao: "Conferido", falta: 0, n: 1 }];
  const { colunas, fixas } = enxugarColunas(linhas, [
    { chave: "nome", rotulo: "Nome" }, { chave: "gov", rotulo: "Governador" },
    { chave: "situacao", rotulo: "Conferência", fixavel: true }, { chave: "falta", rotulo: "Faltando", fixavel: true },
    { chave: "n", rotulo: "Contagem" },
  ]);
  assert.deepEqual(colunas.map((c) => c.chave), ["nome", "n"], "contagem igual nas linhas não é metadado: fica");
  assert.deepEqual(fixas, [{ rotulo: "Conferência", valor: "Conferido" }, { rotulo: "Faltando", valor: "0" }]);
  assert.equal(enxugarColunas([linhas[0]], [{ chave: "nome", rotulo: "Nome" }, { chave: "situacao", rotulo: "Conferência", fixavel: true }]).colunas.length, 2);
});
