import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DISPUTA,
  acaoDe,
  cenarios2028,
  conversaoReferencia,
  derivar,
  fidelidade,
  fidelidadeBruta,
  passou,
  prioridadesDoEstado,
  quantil,
} from "../../src/features/resultados/leitura.ts";
import { do2t, type Linha } from "../../src/features/resultados/dados.ts";

/**
 * A Leitura do lugar (o que passou, o que fazer, 2028) é regra com número à
 * vista. Este teste prende as regras, os cenários e a junção do 2º turno nas
 * linhas do 1º com os dados publicados do Ceará.
 */

type L = Linha;
const cidade = (x: L): L => ({ qe_ver_2028_est: 10000, missao_pres: 1000, missao_melhor_prop: 100, t2_nulos14: 5, t2_base14: 1000, ...x });

describe("leitura: regras", () => {
  test("fidelidade usa a ajustada quando existe e a bruta no resto", () => {
    assert.equal(fidelidade({ t2_nulos14: 10, t2_base14: 100, t2_fiel_aj: 0.06 }), 0.06);
    assert.equal(fidelidade({ t2_nulos14: 10, t2_base14: 100 }), 0.1);
    assert.ok(Number.isNaN(fidelidadeBruta({ t2_nulos14: 10, t2_base14: 0 })));
  });

  test("cenários 2028 da cidade em QE, com o central entre o piso e o teto", () => {
    const c = cenarios2028(cidade({ missao_pres: 9000, missao_melhor_prop: 2000 }), "cidade", 0.5)!;
    assert.deepEqual(c, { repetir: 0.2, central: 0.45, teto: 0.9 });
    assert.equal(cenarios2028(cidade({ missao_melhor_prop: 900, missao_pres: 1000 }), "cidade", 0.1)!.central, 0.09, "o central nunca fica abaixo do que já aconteceu");
    assert.equal(cenarios2028({ missao_pres: 10 }, "cidade", 0.5), null, "sem QE (Distrito Federal) não há cenário");
    assert.equal(cenarios2028({}, "estado", 0.5), null);
  });

  test("cidade: a ação sobe com o alcance de 2028 e a base fiel", () => {
    const irmaos = [cidade({ t2_nulos14: 1 }), cidade({ t2_nulos14: 2 }), cidade({ t2_nulos14: 3 }), cidade({ t2_nulos14: 40 })];
    const ctx = { convRef: 0.5, irmaos };
    assert.equal(acaoDe(cidade({ missao_melhor_prop: 8000, missao_pres: 9000 }), "cidade", ctx)!.acao, "Montar a chapa de vereador");
    assert.equal(acaoDe(cidade({ missao_pres: 18000 }), "cidade", ctx)!.acao, "Converter o voto do Renan");
    const conversao = acaoDe(cidade({ missao_pres: 9000 }), "cidade", ctx)!;
    assert.deepEqual([conversao.acao, conversao.prioridade], ["Trabalhar a conversão", 2]);
    assert.equal(acaoDe(cidade({ missao_pres: 9000, t2_nulos14: 40 }), "cidade", ctx)!.prioridade, 1, "teto + base fiel forte = alta");
    assert.equal(acaoDe(cidade({ t2_nulos14: 40 }), "cidade", ctx)!.acao, "Organizar a base fiel");
    assert.equal(acaoDe(cidade({ t2_nulos14: 14 }), "cidade", { convRef: 0.5, irmaos: [cidade({ t2_nulos14: 1 })] })!.acao, "Acompanhar", "abaixo do piso de 15 pessoas não é base");
    assert.equal(acaoDe(cidade({}), "estado", ctx), null);
  });

  test("bairro: converter onde mais sobra, núcleo onde há base fiel", () => {
    const irmaos = [{ a_converter: 10, t2_nulos14: 1 }, { a_converter: 20, t2_nulos14: 2 }, { a_converter: 30, t2_nulos14: 3 }, { a_converter: 500, t2_nulos14: 30 }];
    const ctx = { convRef: 0.5, irmaos };
    assert.equal(acaoDe({ situacao: "Potencial", a_converter: 500, t2_nulos14: 1 }, "bairro", ctx)!.acao, "Converter aqui");
    const nucleo = acaoDe({ situacao: "Convertido", a_converter: 1, t2_nulos14: 30 }, "bairro", ctx)!;
    assert.deepEqual([nucleo.acao, nucleo.prioridade], ["Abrir ou fortalecer núcleo", 1]);
    assert.equal(acaoDe({ situacao: "Convertido", conversao: 0.4, t2_nulos14: 1 }, "bairro", ctx)!.acao, "Manter e formar");
    assert.equal(acaoDe({ situacao: "Fora da base", t2_nulos14: 1 }, "bairro", ctx)!.acao, "Acompanhar");
  });

  test("a gente do painel entra no porquê só quando há acesso", () => {
    const ctx = { convRef: 0.5, irmaos: [] };
    const l = cidade({ missao_pres: 18000 });
    assert.ok(!acaoDe(l, "cidade", ctx)!.porque.includes("painel"));
    assert.ok(acaoDe(l, "cidade", { ...ctx, gente: 0 })!.porque.endsWith("Ninguém cadastrado aqui no painel ainda."));
    assert.ok(acaoDe(l, "cidade", { ...ctx, gente: 3 })!.porque.endsWith("3 pessoas cadastradas aqui no painel."));
  });

  test("régua de conversão: quartil de cima, só cidades com voto bastante", () => {
    const cs = [10, 20, 30, 40].map((p) => ({ missao_pres: 1000, missao_melhor_prop: p * 10 })).concat([{ missao_pres: 50, missao_melhor_prop: 50 }]);
    assert.equal(conversaoReferencia(cs), 0.3);
    assert.ok(Number.isNaN(quantil([], 0.5)));
  });

  test("Brasil: a régua dos eliminados entra no que passou, sem os números pequenos", () => {
    const ref = [
      { numero: "14", nome: "RENAN SANTOS", votos_1t: 2675887, nulos_2t: 143372, por100: 5.36 },
      { numero: "80", nome: "SAMARA", votos_1t: 122911, nulos_2t: 3948, por100: 3.21 },
      { numero: "55", nome: "RONALDO CAIADO", votos_1t: 2605148, nulos_2t: 61750, por100: 2.37 },
      { numero: "70", nome: "ESCRITOR AUGUSTO CURY", votos_1t: 3448569, nulos_2t: 21649, por100: 0.63 },
    ];
    const fatos = passou({ missao_pres: 100, validos_pres: 1000, missao_df: 20, t2_nulos14: 5, t2_base14: 100 }, "brasil", undefined, ref);
    const regua = fatos.find((f) => f.startsWith("É a maior volta"))!;
    assert.ok(regua.includes("Caiado 2,37") && regua.includes("Cury 0,63"), regua);
    assert.ok(!regua.includes("Samara"));
  });
});

const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public");
const temDados = existsSync(path.join(BASE, "contagem-2026-2t/explorar/ce/13897.json")) && existsSync(path.join(BASE, "resultados-2026/uf/ce.json"));
type Tabela = { colunas: string[]; linhas: unknown[][] };
const expandir = (t: Tabela): L[] => t.linhas.map((r) => Object.fromEntries(t.colunas.flatMap((c, i) => (r[i] === null ? [] : [[c, r[i]]]))) as L);
const ler = (p: string) => JSON.parse(readFileSync(path.join(BASE, p), "utf8"));

describe("leitura: Ceará com os dados publicados", { skip: !temDados }, () => {
  const t2 = new Map(expandir(ler("contagem-2026-2t/uf/ce.json")).map((c) => [String(c.municipio), c]));
  const cidades = expandir(ler("resultados-2026/uf/ce.json").cidades).map((c) => ({ ...c, ...do2t(t2.get(String(c.municipio_codigo))) }));

  test("toda cidade do Ceará recebe o 2º turno e uma ação", () => {
    assert.ok(cidades.every((c) => typeof c.t2_nulos14 === "number"));
    const p = prioridadesDoEstado(cidades, conversaoReferencia(cidades));
    assert.equal(p.porAcao.reduce((s, [, q]) => s + q, 0), cidades.length);
    assert.ok(p.alcance.repetir <= p.alcance.central && p.alcance.central <= p.alcance.teto);
  });

  test("Fortaleza: teto passa de 80% do QE, a base fiel é a maior do estado e a ação é alta", () => {
    const fortaleza = cidades.find((c) => c.municipio_codigo === "13897")!;
    const cen = cenarios2028(fortaleza, "cidade", conversaoReferencia(cidades))!;
    assert.ok(cen.teto >= DISPUTA);
    const a = acaoDe(fortaleza, "cidade", { convRef: conversaoReferencia(cidades), irmaos: cidades })!;
    assert.equal(a.prioridade, 1, a.porque);
  });

  test("bairros de Fortaleza: o 2º turno cai nas chaves do 1º e soma o da cidade menos o que ficou fora", () => {
    const explorar = ler("contagem-2026-2t/explorar/ce/13897.json");
    const primeiro = new Set(expandir(ler("resultados-2026/bairros/ce/13897.json").bairros).map((b) => b.bairro_chave));
    const alinhados = expandir(explorar.bairros);
    assert.ok(alinhados.every((b) => primeiro.has(b.bairro_chave)));
    const cidade2t = ler("contagem-2026-2t/cidades/ce/13897.json").cidade;
    assert.equal(alinhados.reduce((s, b) => s + Number(b.t2_votos), 0) + (explorar.t2_votos_fora ?? 0), cidade2t.votos_1);
    const lidos = alinhados.map((b) => derivar(b, "bairro", { convRef: 0.18, irmaos: alinhados }));
    assert.ok(lidos.every((b) => Number.isFinite(b._fiel as number)));
  });
});
