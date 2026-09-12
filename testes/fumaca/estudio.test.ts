import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * FUMAÇA: a porta do Estúdio.
 *
 * O Estúdio é o maior módulo do repositório (11 mil linhas de TS) e não
 * tinha teste nenhum. O que dá para prender sem navegador é a porta:
 * `estudio.php` só abre para quem tem a área, carimba o tema e o `__PAINEL__`
 * no HTML do build, e o `.html` cru nunca é servido direto.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
  /* O estudio.html é produto do build do Next e não está no sandbox; um
     mínimo com a forma que estudio.php espera basta para a porta. */
  writeFileSync(
    path.join(painel.dir, "painel", "estudio.html"),
    '<!DOCTYPE html><html lang="pt-BR"><head><title>Estúdio</title></head><body><div id="estudio"></div></body></html>',
  );
});
after(() => painel.fechar());

describe("estúdio: a porta", () => {
  test("quem tem a área recebe o HTML carimbado", async () => {
    const r = await painel.buscar("estudio");
    assert.equal(r.status, 200);
    assert.match(r.html, /window\.__PAINEL__=/, "sem o carimbo __PAINEL__");
    assert.match(r.html, /"csrf"/, "o __PAINEL__ não leva o csrf");
    assert.match(r.cabecalhos?.["cache-control"] ?? "", /no-store/);
  });

  test("quem não tem a área é mandado embora", async () => {
    painel.trocarCapacidades("eventos");
    try {
      const r = await painel.buscar("estudio");
      assert.equal(r.status, 302);
      assert.match(r.location, /negado=estudio/);
    } finally {
      painel.trocarCapacidades("adm");
    }
  });

  test("o .htaccess do build nega o estudio.html cru", () => {
    /* O publish.yml escreve um .htaccess em out/painel/ só para isso. Sem
       ele, o HTML com o payload sairia sem passar pela porta. */
    const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
    const fluxo = readFileSync(path.join(RAIZ, ".github/workflows/publish.yml"), "utf8");
    assert.match(fluxo, /<FilesMatch "\^estudio\\\.\(html\|txt\)\$">/, "publish.yml perdeu a tranca do estudio.html");
    assert.ok(existsSync(path.join(RAIZ, "public/painel/estudio.php")));
  });
});
