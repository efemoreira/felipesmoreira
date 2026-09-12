import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: o convite da escala grava a resposta — e tem teto.
 *
 * `api/escala.php` é aberto sem login; o token HMAC já impede responder por
 * outra pessoa. O que faltava era o teto dos outros endpoints públicos: cada
 * resposta regrava `eventos.php` inteiro, e um endereço martelando o endpoint
 * é uma gravação por pedido.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => {
  painel.ressemear();
  /* Só quem está escalado na peça pode responder: a conta de teste entra
     como responsável pela Recepção do encontro semeado. */
  painel.gravar(
    "eventos",
    painel.ler("eventos").map((e) => (e.id === "ev-teste" ? { ...e, responsaveis: { ...(e.responsaveis ?? {}), recepcao: [ADMIN] } } : e)),
  );
});
after(() => painel.fechar());

/* O token pelo PHP do próprio sandbox — a única fonte dele. */
function token(pessoa: string, evento: string, peca: string): string {
  return execFileSync(
    "php",
    ["-r", 'require $argv[1] . "/painel/escala-comum.php"; echo token_de_escala($argv[2], $argv[3], $argv[4]);', painel.dir, pessoa, evento, peca],
    { encoding: "utf8" },
  ).trim();
}

describe("escala: responder ao convite", () => {
  test("'topou' fica gravado no encontro", async () => {
    const r = await painel.postarJson("api/escala.php", { p: ADMIN, e: "ev-teste", f: "recepcao", t: token(ADMIN, "ev-teste", "recepcao"), resposta: "topou" });
    assert.equal(r.json.ok, true, JSON.stringify(r.json));
    const ev = painel.ler("eventos").find((e) => e.id === "ev-teste");
    assert.equal(ev.aceites?.recepcao?.[ADMIN], "topou");
  });

  test("token errado não grava", async () => {
    const r = await painel.postarJson("api/escala.php", { p: ADMIN, e: "ev-teste", f: "recepcao", t: "a".repeat(32), resposta: "topou" });
    assert.equal(r.json.ok, false);
    const ev = painel.ler("eventos").find((e) => e.id === "ev-teste");
    assert.equal(ev.aceites?.recepcao?.[ADMIN], undefined);
  });

  test("o mesmo endereço tem teto: a 31ª resposta na hora é recusada", async () => {
    const corpo = { p: ADMIN, e: "ev-teste", f: "recepcao", t: token(ADMIN, "ev-teste", "recepcao"), resposta: "topou" };
    for (let i = 0; i < 30; i++) {
      const r = await painel.postarJson("api/escala.php", corpo);
      assert.equal(r.json.ok, true, `pedido ${i + 1} recusado antes do teto`);
    }
    const r = await painel.postarJson("api/escala.php", corpo);
    assert.equal(r.json.ok, false);
    assert.match(r.json.erro ?? "", /Muitas tentativas/);
  });
});
