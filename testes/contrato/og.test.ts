import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * CADA ROTA INDEXÁVEL TEM O SEU CARTÃO.
 *
 * O canal que mais importa é o link colado no WhatsApp, e o cartão genérico
 * ("Candidato a Vice-Governador") na página do número era a única linha que o
 * WhatsApp mostra sendo desperdiçada na reta final. E o X não herda do
 * openGraph: sem `twitter` na rota, o cartão dele mostra o título da raiz.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const APP = path.join(RAIZ, "src/app");
const sitemap = readFileSync(path.join(APP, "sitemap.ts"), "utf8");

/* As rotas do sitemap, menos as legais — ninguém compartilha a política de
   privacidade, e um cartão dela seria ruído. */
const rotas = [...sitemap.matchAll(/url: `\$\{BASE\}\/?([a-z-]*)`/g)]
  .map((m) => m[1])
  .filter((r) => !["privacy", "terms"].includes(r));

describe("og: toda rota indexável tem cartão e twitter", () => {
  test("o sitemap foi lido", () => {
    assert.ok(rotas.length >= 7, `só achei ${rotas.length} rotas no sitemap — o formato mudou?`);
  });

  for (const rota of rotas) {
    const pasta = rota === "" ? APP : path.join(APP, rota);
    test(`/${rota} tem opengraph-image.tsx`, () => {
      assert.ok(existsSync(path.join(pasta, "opengraph-image.tsx")), `/${rota} sem cartão próprio`);
    });
    if (rota === "") continue; // a raiz define os dois no layout
    test(`/${rota} tem twitter espelhando o openGraph`, () => {
      const page = readFileSync(path.join(pasta, "page.tsx"), "utf8");
      assert.match(page, /openGraph: \{/, `/${rota} sem openGraph`);
      assert.match(page, /twitter: \{/, `/${rota} sem twitter — o X vai mostrar o título da raiz`);
    });
  }
});

describe("a porta do painel está no site", () => {
  /* Quem tinha conta só achava /painel/ digitando a URL — foi a reclamação.
     A home e a Munição levam lá, embaixo, para quem já é do movimento. */
  for (const f of ["src/features/home/Home.tsx", "src/features/kit/KitClient.tsx"]) {
    test(`${f} liga para /painel/`, () => {
      const src = readFileSync(path.join(RAIZ, f), "utf8");
      assert.match(src, /href="\/painel\/"/, `${f} sem o link 'Área do militante'`);
      assert.match(src, /Área do militante/);
    });
  }
});
