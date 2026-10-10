import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chamarPhp } from "./ponte.ts";
import { TEMAS, NIVEIS_LIGA, NIVEIS_TERRITORIO, ONDAS, DEGRAUS } from "@/features/organizacao/catalogo";

/**
 * A ORGANIZAÇÃO NOS DOIS LADOS — o painel decide, o site explica.
 *
 * `organizacao-comum.php` grava e calcula (um tema, um grupo; o nível da Liga);
 * `catalogo.ts` desenha /temas e /portavozes sem esperar a API. Se os dois
 * discordarem, a página pública promete um piso de seguidores que o painel não
 * cobra, ou mostra um tema que o painel recusa abrir — e ninguém vê, porque as
 * duas metades continuam funcionando sozinhas.
 *
 * E a regra de dado pessoal do endpoint: nome de responsável não desce.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

interface CatalogoPhp {
  temas: Record<string, { nome: string; estudo: string; profissionais: string; movimento: string }>;
  liga: Record<string, { nome: string; seguidores: number; engajamento: number; exige: string }>;
  territorio: Record<string, string>;
  ondas: Record<string, string>;
}

const [php, degrausPhp] = chamarPhp([
  { fn: "catalogo_da_organizacao", args: [] },
  { fn: "catalogo_da_escada", args: [] },
]) as [CatalogoPhp, { nome: string; resumo: string }[]];

describe("organização: os catálogos concordam", () => {
  test("os mesmos temas, na mesma ordem, com as mesmas três portas", () => {
    assert.deepEqual(TEMAS.map((t) => t.chave), Object.keys(php.temas));
    for (const t of TEMAS) {
      const p = php.temas[t.chave];
      assert.equal(t.nome, p.nome, `nome de ${t.chave}`);
      assert.equal(t.estudo, p.estudo, `porta estudo de ${t.chave}`);
      assert.equal(t.profissionais, p.profissionais, `porta profissionais de ${t.chave}`);
      assert.equal(t.movimento, p.movimento, `porta movimento de ${t.chave}`);
    }
  });

  test("os níveis da Liga pedem o mesmo piso e a mesma ação", () => {
    assert.deepEqual(NIVEIS_LIGA.map((n) => n.nivel), Object.keys(php.liga));
    for (const n of NIVEIS_LIGA) {
      const p = php.liga[n.nivel];
      assert.equal(n.nome, p.nome, `nome do nível ${n.nivel}`);
      assert.equal(n.seguidores, p.seguidores, `seguidores do nível ${n.nivel}`);
      assert.equal(n.engajamento, p.engajamento, `engajamento do nível ${n.nivel}`);
      assert.equal(n.exige, p.exige, `exigência do nível ${n.nivel}`);
    }
  });

  test("a classificação territorial e as ondas", () => {
    assert.deepEqual(NIVEIS_TERRITORIO, php.territorio);
    assert.deepEqual(
      Object.fromEntries(Object.entries(ONDAS).map(([k, v]) => [String(k), v])),
      Object.fromEntries(Object.entries(php.ondas).map(([k, v]) => [String(k), v])),
    );
  });

  test("os degraus da escada", () => {
    assert.deepEqual(DEGRAUS.map((d) => ({ nome: d.nome, resumo: d.resumo })), degrausPhp);
  });
});

describe("organização: o que o endpoint público NÃO devolve", () => {
  const api = readFileSync(path.join(RAIZ, "public/painel/api/organizacao.php"), "utf8");
  /* Os campos que existem na ficha e não podem descer. O endpoint escolhe
     campo a campo; este teste prende que nenhum destes foi escolhido. */
  for (const campo of ["responsavelId", "substitutoId", "pessoaId", "evidencia", "entregas", "criadoPor", "meses"]) {
    test(`não devolve '${campo}'`, () => {
      assert.doesNotMatch(api, new RegExp(`'[a-zA-Z]+'\\s*=>\\s*\\$[a-z]+\\['${campo}'\\]`), `api/organizacao.php devolve ${campo}`);
    });
  }

  test("só desce o que está publicado e aberto", () => {
    assert.equal((api.match(/if \(!\$[a-z]+\['publicado'\] \|\| \$[a-z]+\['encerradoEm'\] !== ''\)/g) ?? []).length, 3);
  });
});
