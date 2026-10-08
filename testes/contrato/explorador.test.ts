import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  caixaDosPaths,
  centroDoPath,
  escreverEndereco,
  faixaDe,
  faixasQuantil,
  lerEndereco,
  nivelDe,
  trilha,
} from "../../src/features/resultados/explorador/niveis.ts";
import { REGIOES } from "../../src/features/resultados/regioes.ts";
import { UF_IBGE } from "../../src/features/resultados/formato.ts";

/**
 * O Explorador juntou cinco abas (Brasil, Região, Estado, Município, Bairros)
 * numa tela. Este teste prende o que não podia se perder na mudança:
 *   1. todo link antigo abre o mesmo lugar, e o endereço novo vai e volta;
 *   2. as faixas da legenda cobrem todos os valores;
 *   3. toda área que o Explorador pinta existe no mapa do nível (estado no
 *      Brasil, cidade no estado, bairro na cidade);
 *   4. todo "Sobre este dado" e toda coluna de tabela das abas antigas
 *      continua em algum lugar do Explorador.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DADOS = path.join(RAIZ, "public/resultados-2026");
const EXP = path.join(RAIZ, "src/features/resultados/explorador");
const ler = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const temDados = existsSync(path.join(DADOS, "resumo.json"));

describe("explorador: endereço", () => {
  test("links das abas antigas abrem o mesmo lugar", () => {
    assert.deepEqual(lerEndereco("#brasil").caminho, {});
    assert.deepEqual(lerEndereco("#estado/sp").caminho, { regiao: "sudeste", uf: "sp" });
    assert.deepEqual(lerEndereco("#estado/se").caminho, { regiao: "nordeste", uf: "se" }, "Sergipe não é o Sudeste");
    assert.deepEqual(lerEndereco("#regiao/ce").caminho, { regiao: "nordeste" });
    assert.deepEqual(lerEndereco("#municipio/rs").caminho, { regiao: "sul", uf: "rs" });
    assert.deepEqual(lerEndereco("#bairros/ce/13897/ALDEOTA").caminho, { regiao: "nordeste", uf: "ce", cidade: "13897", bairro: "ALDEOTA" });
    for (const h of ["#brasil", "#estado/sp", "#bairros/ce/13897"]) assert.equal(lerEndereco(h).aba, "explorar", h);
  });

  test("as abas de análise continuam com o estado no endereço", () => {
    const e = lerEndereco("#adversarios/sp");
    assert.equal(e.aba, "adversarios");
    assert.equal(e.uf, "sp");
  });

  test("o endereço novo vai e volta, com as opções", () => {
    const casos = [
      {},
      { regiao: "centro-oeste" as const },
      { regiao: "nordeste" as const, uf: "ce" },
      { regiao: "nordeste" as const, uf: "ce", cidade: "13897" },
      { regiao: "nordeste" as const, uf: "ce", cidade: "13897", bairro: "JOSÉ DE ALENCAR" },
    ];
    for (const c of casos) {
      const h = escreverEndereco(c, { pintar: "df", como: "votos" });
      const e = lerEndereco(h);
      assert.deepEqual(e.caminho, c, h);
      assert.deepEqual(e.opcoes, { pintar: "df", como: "votos" }, h);
    }
  });

  test("a trilha tem um degrau por nível", () => {
    const c = { regiao: "nordeste" as const, uf: "ce", cidade: "13897", bairro: "ALDEOTA" };
    assert.deepEqual(trilha(c).map(nivelDe), ["brasil", "regiao", "estado", "cidade", "bairro"]);
  });

  test("o exterior é região sem estado por dentro", () => {
    assert.deepEqual(lerEndereco("#estado/zz").caminho, { regiao: "exterior" });
  });
});

describe("explorador: faixas e geometria", () => {
  test("toda faixa existe e os cortes sobem", () => {
    const valores = [0, 0, 0, 0.01, 0.012, 0.02, 0.03, 0.05, 0.08, 0.2, NaN];
    const f = faixasQuantil(valores, 5);
    assert.ok(f.cortes.every((c, i) => i === 0 || c > f.cortes[i - 1]));
    for (const v of valores.filter(Number.isFinite)) {
      const i = faixaDe(v, f);
      assert.ok(i >= 0 && i <= f.cortes.length, `${v} → ${i}`);
    }
    assert.equal(faixaDe(NaN, f), -1);
  });

  test("divergente é simétrica em volta do zero", () => {
    const f = faixasQuantil([-0.3, -0.1, 0, 0.1, 0.2], 7, true);
    assert.equal(f.cortes.length, 6);
    assert.ok(Math.abs(f.cortes[0] + f.cortes[5]) < 1e-9);
  });

  test("centro de um quadrado é o meio dele", () => {
    assert.deepEqual(centroDoPath("M0,0L10,0L10,10L0,10Z"), [5, 5]);
  });
});

describe("explorador: toda área pintada existe no mapa", { skip: !temDados }, () => {
  const resumo = temDados ? ler(path.join(DADOS, "resumo.json")) : null;
  const br = temDados ? ler(path.join(DADOS, "mapa/br.json")) : null;

  test("cada estado tem contorno no mapa do Brasil, e cada região cabe nele", () => {
    for (const u of resumo.ufs.map((x: { uf: string }) => x.uf).filter((u: string) => u !== "zz")) assert.ok(br.paths[UF_IBGE[u]], `sem contorno: ${u}`);
    for (const [k, , ufs] of REGIOES) {
      if (k === "exterior") continue;
      const c = caixaDosPaths(ufs.map((u) => br.paths[UF_IBGE[u]]));
      assert.ok(c && c.x >= 0 && c.y >= 0 && c.x + c.largura <= br.largura + 1 && c.y + c.altura <= br.altura + 1, k);
    }
  });

  test("cada cidade tem contorno no mapa do estado", () => {
    const faltam: string[] = [];
    for (const arq of readdirSync(path.join(DADOS, "uf"))) {
      const uf = arq.replace(".json", "");
      if (uf === "zz" || !existsSync(path.join(DADOS, "mapa", arq))) continue;
      const d = ler(path.join(DADOS, "uf", arq));
      const paths = ler(path.join(DADOS, "mapa", arq)).paths;
      const i = d.cidades.colunas.indexOf("codigo_ibge");
      for (const l of d.cidades.linhas) if (!paths[String(l[i])]) faltam.push(`${uf}/${l[i]}`);
    }
    /* Boa Esperança do Norte (MT) nasceu em 2023 e não está na malha do IBGE de 2022:
       aparece na lista e na tabela, não no mapa (o Explorador avisa embaixo do mapa) */
    assert.deepEqual(faltam.filter((f) => f !== "mt/5300109"), []);
  });

  test("cada bairro oficial (IBGE ou distrito) de uma amostra de cidades tem área no mapa", () => {
    const faltam: string[] = [];
    const dir = path.join(DADOS, "bairros");
    if (!existsSync(dir)) return;
    for (const uf of readdirSync(dir).slice(0, 6))
      for (const arq of readdirSync(path.join(dir, uf)).slice(0, 8)) {
        const m = path.join(DADOS, "mapa-bairros", uf, arq);
        if (!existsSync(m)) continue;
        const areas = ler(m).areas;
        if (!Object.keys(areas).length) continue;
        const b = ler(path.join(dir, uf, arq)).bairros;
        const i = b.colunas.indexOf("bairro_chave");
        const o = b.colunas.indexOf("bairro_origem");
        /* só bairro oficial (IBGE) e distrito têm polígono; o nome de cartório fica na lista e na tabela */
        for (const l of b.linhas) if (["ibge", "ibge-nome", "distrito"].includes(String(l[o])) && !areas[String(l[i])]) faltam.push(`${uf}/${arq}: ${l[i]}`);
      }
    assert.deepEqual(faltam, []);
  });
});

describe("explorador: nada das abas antigas se perdeu", () => {
  const fonte = readdirSync(EXP)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map((f) => readFileSync(path.join(EXP, f), "utf8"))
    .join("\n");

  test("todo 'Sobre este dado' das cinco abas está no Explorador", () => {
    /* o que Brasil, Região, Estado, Município e Bairros tinham, antes de virarem o Explorador */
    const antigos = [
      "participacao", "missao-total", "divisao-validos", "mapa-estados", "regioes", "cadeiras-qe", "candidatos-missao", "cidades",
      "chapa-vereador", "vereador-2028", "bairro-origem", "bairros-mapa", "bairros-tabela", "bairro-tempo", "bairro-candidatos", "em-queda", "locais", "roteiro",
    ];
    const faltam = antigos.filter((id) => !fonte.includes(`"${id}"`));
    assert.deepEqual(faltam, []);
  });

  test("toda coluna das tabelas antigas está na tabela completa", () => {
    const colunas = readFileSync(path.join(EXP, "colunas.ts"), "utf8");
    /* a primeira coluna (estado, município_nome, bairro) virou `nome` */
    const antigas = [
      "eleitorado", "pct_comparecimento", "missao_pres", "pct_missao_pres", "missao_df", "pct_missao_df", "missao_de", "pct_missao_de", "aproveitamento_df",
      "vagas_df", "qe_df", "qe_atingidos_df", "eleitos_df", "porte", "missao_leg_df", "indice_forca_df", "pct_direita_df", "pct_esquerda_df", "vagas_ver",
      "qe_ver_2028_est", "situacao_vereador", "pct_comp", "lado_txt", "lado_rel_pres", "var_lado_pres", "pct_renan", "pct_mdf", "pct_dir_de", "oportunidade",
      "missao_em_qe_ver", "origem",
    ];
    const faltam = antigas.filter((c) => !colunas.includes(`chave: "${c}"`));
    assert.deepEqual(faltam, []);
  });
});
