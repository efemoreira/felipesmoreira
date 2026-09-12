import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: nenhuma tela do painel fica no cache do navegador.
 *
 * É a lista de pessoas com telefone, aberta num celular que às vezes é
 * emprestado. `sessao.php` manda `Cache-Control: no-store, private` para tudo
 * que o inclui; os endpoints públicos que PODEM ser guardados (candidatos,
 * kit) mandam o deles por cima — e o teste confere os dois lados.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

describe("cabeçalhos: o painel não fica no cache", () => {
  for (const tela of ["index", "pessoas", "eventos", "leituras", "conta"]) {
    test(`${tela}.php responde no-store`, async () => {
      const r = await painel.buscar(tela);
      assert.match(r.cabecalhos?.["cache-control"] ?? "", /no-store/, `${tela} sem no-store`);
      assert.match(r.cabecalhos?.["cache-control"] ?? "", /private/);
    });
  }

  test("o que é público de verdade continua com cache curto", async () => {
    const r = await painel.buscar("api/candidatos");
    assert.match(r.cabecalhos?.["cache-control"] ?? "", /max-age=300/, "candidatos.php perdeu o cache público");
    assert.doesNotMatch(r.cabecalhos?.["cache-control"] ?? "", /no-store/);
  });
});

describe("cabeçalhos: a Content-Security-Policy", () => {
  test("toda tela manda a CSP com o nonce da requisição", async () => {
    const r = await painel.buscar("index");
    const csp = r.cabecalhos?.["content-security-policy"] ?? "";
    assert.match(csp, /script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/, "sem nonce na CSP");
    assert.match(csp, /frame-ancestors 'none'/);
    assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/, "script inline liberado — a CSP não protege de nada");
  });

  test("todo <script> inline leva o nonce que a CSP anuncia", async () => {
    for (const [tela, qs] of [["agenda", ""], ["eventos", "e=ev-teste&aba=dados"], ["eventos", "e=ev-teste&aba=pessoas"]] as const) {
      const r = await painel.buscar(tela, qs);
      const nonce = r.cabecalhos?.["content-security-policy"]?.match(/'nonce-([^']+)'/)?.[1] ?? "";
      assert.ok(nonce, `${tela} sem nonce`);
      const inline = [...r.html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)].map((m) => m[0]);
      assert.ok(inline.length >= 1, `${tela}?${qs} devia ter script inline para o teste valer`);
      for (const tag of inline) {
        assert.ok(tag.includes(`nonce="${nonce}"`), `script inline sem o nonce em ${tela}: ${tag}`);
      }
    }
  });

  test("o Estúdio, que serve o HTML do Next, sai sem a CSP", async () => {
    const { writeFileSync } = await import("node:fs");
    const path = await import("node:path");
    writeFileSync(path.join(painel.dir, "painel", "estudio.html"), "<!DOCTYPE html><html><head></head><body></body></html>");
    const r = await painel.buscar("estudio");
    assert.equal(r.cabecalhos?.["content-security-policy"], undefined);
  });
});

describe("cabeçalhos: nenhum handler inline sobrou no painel", () => {
  test("nenhum on*= nos PHP", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(painel.dir, "painel");
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".php"))) {
      const php = readFileSync(path.join(dir, f), "utf8");
      assert.doesNotMatch(php, /\son(submit|click|change|input|load)=/, `${f} tem handler inline — a CSP o bloqueia; use data-confirmar / data-envia-ao-mudar`);
    }
  });
});
