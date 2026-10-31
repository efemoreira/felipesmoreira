import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirVereadores } from "../../src/features/resultados/vereadores.ts";

test("Renan: conta cidades e cadeiras separadamente, com limite de 80% inclusivo e 100% exclusivo para perto", () => {
  const cidade = (votos: number, qe = 100) => ({ missao_pres: votos, qe_ver_2028_est: qe });
  assert.deepEqual(resumirVereadores([
    cidade(79), cidade(80), cidade(99), cidade(100), cidade(250),
    cidade(200, 0), cidade(200, NaN), cidade(NaN), {},
  ]), { cidades: 5, faria: 2, perto: 2, cadeiras: 3 });
});

test("Renan: compara o voto de cada cidade com o próprio quociente", () => {
  assert.deepEqual(resumirVereadores([
    { missao_pres: 1000, qe_ver_2028_est: 2000 },
    { missao_pres: 100, qe_ver_2028_est: 100 },
  ]), { cidades: 2, faria: 1, perto: 0, cadeiras: 1 });
});
