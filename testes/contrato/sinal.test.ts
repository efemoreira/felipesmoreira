import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * O PAR DO SINAL: os eventos que o site manda (`src/lib/api/sinal.ts`) são os
 * que o painel aceita (`sinais-comum.php`). Evento novo de um lado só é sinal
 * descartado calado do outro — o endpoint não reclama de propósito.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (p: string) => readFileSync(path.join(RAIZ, p), "utf8");

describe("sinal: TS e PHP aceitam os mesmos eventos e rotas", () => {
  const ts = ler("src/lib/api/sinal.ts");
  const php = ler("public/painel/sinais-comum.php");

  const tipo = ts.match(/export type EventoDeSinal =([^;]*);/)?.[1] ?? "";
  const eventosTs = [...tipo.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]).sort();
  const blocoEv = php.slice(php.indexOf("const EVENTOS_SINAL = ["), php.indexOf("\n];", php.indexOf("const EVENTOS_SINAL = [")));
  const eventosPhp = [...blocoEv.matchAll(/^\s+'([a-z-]+)' =>/gm)].map((m) => m[1]).sort();

  test("os eventos são os mesmos", () => {
    assert.ok(eventosTs.length >= 3, "não li o tipo EventoDeSinal");
    assert.deepEqual(eventosTs, eventosPhp);
  });

  test("toda rota do sitemap (fora as legais) está em ROTAS_SINAL", () => {
    const sitemap = ler("src/app/sitemap.ts");
    const rotas = [...sitemap.matchAll(/url: `\$\{BASE\}\/?([a-z-]*)`/g)].map((m) => m[1]).filter((r) => !["privacy", "terms"].includes(r));
    const blocoRotas = php.slice(php.indexOf("const ROTAS_SINAL = ["), php.indexOf("\n];", php.indexOf("const ROTAS_SINAL = [")));
    const aceitas = [...blocoRotas.matchAll(/^\s+'([a-z-]*)' =>/gm)].map((m) => m[1]);
    for (const r of rotas) {
      assert.ok(aceitas.includes(r), `/${r} está no sitemap e não em ROTAS_SINAL — abriu lá e ninguém conta`);
    }
  });
});
