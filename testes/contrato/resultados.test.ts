import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXPLICACOES } from "../../src/features/resultados/explicacoes.ts";

/**
 * /resultados lê JSON gerado FORA deste repositório (o projeto de análise do
 * TSE, `python -m src.cli export-site`). Nada avisa quando o export muda de
 * forma: a página só mostra travessão no lugar do número. Este teste prende
 *   1. as colunas que a aba Bairros e a Adversários leem;
 *   2. os índices de bairro/pessoa dentro de cada arquivo de cidade;
 *   3. o teto de tamanho da pasta (o deploy empurra tudo para a branch build);
 *   4. que toda caixa "Sobre este dado" aponta para um texto que existe.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DADOS = path.join(RAIZ, "public/resultados-2026");
const FEATURE = path.join(RAIZ, "src/features/resultados");
const TETO_MB = 80;

type Tabela = { colunas: string[]; linhas: unknown[][] } | null;
const ler = (p: string) => JSON.parse(readFileSync(p, "utf8"));

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

const COLUNAS = {
  bairros: ["bairro_chave", "bairro", "bairro_origem", "eleitorado", "comparecimento", "validos_pres", "missao_pres", "direita_pres", "esquerda_pres", "lado_pres", "lado_rel_pres", "oportunidade",
    "forca_partido", "espaco", "quadrante", "melhor_p", "melhor_a_mais", "solto"],
  locais: ["zona", "local", "nome", "endereco", "b", "eleitorado", "validos_pres", "missao_pres", "oportunidade"],
  pessoas: ["id", "nome", "partido_sigla", "grupo_atual", "cargo_key", "pct_uf"],
  candidatos: ["b", "cargo_key", "p", "votos"],
};

describe("resultados: o export que a página lê", () => {
  const temDados = existsSync(path.join(DADOS, "resumo.json"));
  const resumo = temDados ? ler(path.join(DADOS, "resumo.json")) : {};
  const ufs: string[] = resumo.bairrosUfs ?? [];

  test("a pasta cabe no teto de tamanho", { skip: !temDados }, () => {
    const total = arquivos(DADOS).reduce((s, p) => s + statSync(p).size, 0);
    assert.ok(total < TETO_MB * 1e6, `public/resultados-2026 tem ${(total / 1e6).toFixed(0)} MB (teto ${TETO_MB} MB): cada regeração entra de novo no histórico do git`);
  });

  test("toda UF com bairro tem o arquivo de adversários e as fontes estão no resumo", { skip: !ufs.length }, () => {
    for (const uf of ufs) assert.ok(existsSync(path.join(DADOS, "adversarios", `${uf}.json`)), `falta adversarios/${uf}.json`);
    assert.ok(Array.isArray(resumo.fontes) && resumo.fontes.length > 0, "resumo.fontes vazio: a aba Sobre os dados fica sem as bases");
  });

  test("o recorte por bairro segue a regra do resumo (o site lista as cidades por ela)", { skip: !ufs.length }, () => {
    const corte = resumo.bairrosCorte;
    assert.ok(corte && Array.isArray(corte.ufsCompletas) && corte.minEleitores > 0, "resumo.bairrosCorte ausente");
    for (const uf of ufs) {
      const uff = ler(path.join(DADOS, "uf", `${uf}.json`)).cidades as { colunas: string[]; linhas: unknown[][] };
      const ic = uff.colunas.indexOf("municipio_codigo");
      const ie = uff.colunas.indexOf("eleitorado");
      const pasta = path.join(DADOS, "bairros", uf);
      const tem = new Set(existsSync(pasta) ? readdirSync(pasta).map((n) => n.replace(".json", "")) : []);
      for (const l of uff.linhas) {
        const deve = corte.ufsCompletas.includes(uf) || Number(l[ie]) >= corte.minEleitores;
        const cod = String(l[ic]);
        // cidade sem local de votação no cadastro pode faltar; o contrário (arquivo fora da regra) nunca
        if (!deve) assert.ok(!tem.has(cod), `bairros/${uf}/${cod}.json existe fora da regra do corte`);
      }
      if (corte.ufsCompletas.includes(uf)) assert.ok(tem.size >= uff.linhas.length * 0.95, `${uf} deveria ter todas as cidades`);
    }
  });

  test("os arquivos de cidade têm as colunas lidas e índices válidos", { skip: !ufs.length }, () => {
    for (const uf of ufs) {
      const pasta = path.join(DADOS, "bairros", uf);
      const nomes = readdirSync(pasta);
      // o CE inteiro e as 3 primeiras cidades (pelo código) de cada outra UF
      const amostra = uf === "ce" ? nomes : nomes.slice(0, 3);
      for (const n of amostra) {
        const d: Record<string, Tabela> = ler(path.join(pasta, n));
        for (const [chave, cols] of Object.entries(COLUNAS)) {
          const t = d[chave];
          if (!t) continue; // cidade sem candidato/queda: a tabela vem nula
          for (const c of cols) assert.ok(t.colunas.includes(c), `bairros/${uf}/${n}: ${chave} sem a coluna ${c}`);
        }
        const nb = d.bairros?.linhas.length ?? 0;
        const np = d.pessoas?.linhas.length ?? 0;
        for (const tab of ["candidatos", "quedas", "fracos", "proprio"] as const) {
          const t = d[tab];
          if (!t) continue;
          const ib = t.colunas.indexOf("b");
          const ip = t.colunas.indexOf("p");
          for (const l of t.linhas) {
            assert.ok(typeof l[ib] === "number" && (l[ib] as number) < nb, `bairros/${uf}/${n}: ${tab} aponta para bairro inexistente`);
            assert.ok(typeof l[ip] === "number" && (l[ip] as number) < np, `bairros/${uf}/${n}: ${tab} aponta para pessoa inexistente`);
          }
        }
      }
    }
  });

  test("cidades: força do partido, quadrante e o esperado de cada candidato (aba Decisões)", { skip: !temDados }, () => {
    const d = ler(path.join(DADOS, "uf", "ce.json"));
    for (const c of ["forca_partido", "espaco", "quadrante", "melhor_nome", "melhor_a_mais"]) assert.ok(d.cidades.colunas.includes(c), `uf/ce.json: cidades sem ${c}`);
    assert.ok(d.proprio && ["cand", "municipio_codigo", "votos", "esperado"].every((c: string) => d.proprio.colunas.includes(c)), "uf/ce.json sem a tabela proprio");
    const iq = d.cidades.colunas.indexOf("quadrante");
    const quadrantes = new Set(d.cidades.linhas.map((l: unknown[]) => l[iq]).filter(Boolean));
    for (const q of quadrantes) assert.ok(["Nutrir", "Crescer", "Atacar", "Esperar"].includes(q as string), `quadrante desconhecido: ${q}`);
  });

  test("partidos: o perfil do voto por estado e cidade, e a posição dos candidatos do Missão", { skip: !temDados }, () => {
    const d = ler(path.join(DADOS, "partidos", "ce.json"));
    for (const c of ["cargo_key", "partido_sigla", "nominal", "legenda", "top_votos", "n_cand", "n_80", "perfil", "eleitos", "acima_10qe"]) {
      assert.ok(d.estado.colunas.includes(c), `partidos/ce.json: estado sem ${c}`);
    }
    for (const c of ["municipio_codigo", "nominal", "legenda", "top_votos", "n_cand", "perfil"]) assert.ok(d.cidades.colunas.includes(c), `partidos/ce.json: cidades sem ${c}`);
    const ip = d.estado.colunas.indexOf("perfil");
    for (const l of d.estado.linhas) assert.ok(["MP", "M", "P", "C", "N"].includes(l[ip]), `perfil desconhecido: ${l[ip]} (o site traduz pelo PERFIL de apoio.ts)`);
    assert.ok(Object.keys(d.grupos).length > 5, "partidos/ce.json sem o dicionário de grupos");
    const uf = ler(path.join(DADOS, "uf", "ce.json"));
    assert.ok(uf.votos.colunas.includes("posicao") && uf.votos.colunas.includes("total_cand"), "uf/ce.json: votos sem posição");
    assert.ok(resumo.candidatos.some((c: Record<string, unknown>) => typeof c.posicao_uf === "number"), "resumo.candidatos sem posicao_uf");
  });

  test("adversários: as colunas lidas", { skip: !ufs.length }, () => {
    const d: Record<string, Tabela> = ler(path.join(DADOS, "adversarios", `${ufs.includes("ce") ? "ce" : ufs[0]}.json`));
    const pessoas = ["id", "nome", "status", "orfao", "votos", "votos_22", "var_votos", "grupo_atual", "cargo_key", "cargo_key_22", "partido_sigla_22",
      "sinais", "s_queda", "s_base", "s_sem_mandato", "s_partido", "s_concentrado", "s_base_virou"];
    for (const c of pessoas) assert.ok(d.pessoas?.colunas.includes(c), `adversarios: pessoas sem ${c}`);
    // toda pauta e toda cidade apontam para uma pessoa da lista
    const ids = new Set(d.pessoas?.linhas.map((l) => String(l[d.pessoas!.colunas.indexOf("id")])));
    for (const tab of ["temas", "projetos", "cidadesPessoa"]) {
      const t = d[tab];
      if (!t) continue;
      const i = t.colunas.indexOf("id");
      for (const l of t.linhas) assert.ok(ids.has(String(l[i])), `adversarios: ${tab} aponta para pessoa fora da lista`);
    }
    for (const c of ["municipio_codigo", "lado_pres", "lado_pres_22", "var_lado_pres"]) assert.ok(d.cidades?.colunas.includes(c), `adversarios: cidades sem ${c}`);
  });
});

describe("resultados: explicações", () => {
  const fontes = arquivos(FEATURE).filter((p) => p.endsWith(".tsx"));
  const usados = new Set(fontes.flatMap((p) => [...readFileSync(p, "utf8").matchAll(/explica="([a-z0-9-]+)"/g)].map((m) => m[1])));

  test("todo explica= usado existe em explicacoes.ts", () => {
    assert.ok(usados.size >= 10, "não achei os explica= nas abas");
    for (const id of usados) assert.ok(id in EXPLICACOES, `explica="${id}" não existe em explicacoes.ts`);
  });

  test("toda explicação tem de onde vem, o que mede e por que importa", () => {
    for (const [id, e] of Object.entries(EXPLICACOES)) {
      for (const campo of ["deOnde", "mede", "importa"] as const) assert.ok(e[campo]?.length > 20, `${id}: ${campo} vazio ou curto demais`);
    }
  });
});
