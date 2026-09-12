import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: o erro de produção fica registrado, e a Manutenção o mostra.
 *
 * Com `display_errors` desligado, um aviso de PHP sumia. Agora vira uma linha
 * em `dados/erros.log` e uma linha na Manutenção. O sandbox roda com
 * `display_errors=stderr` (e derruba o teste no aviso), então a gravação se
 * prova chamando `registrar_erro()` direto — o gancho é o mesmo.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const log = () => path.join(painel.dir, "dados", "erros.log");

function registrar(tipo: string, msg: string) {
  const script = path.join(painel.dir, "erro.php");
  writeFileSync(script, `<?php
require __DIR__ . '/painel/sessao.php';
registrar_erro(${JSON.stringify(tipo)}, ${JSON.stringify(msg)}, '/x/pessoas.php', 42);
`);
  execFileSync("php", [script], { stdio: "pipe" });
}

describe("erros: o registro", () => {
  test("uma linha por erro, em JSON, com onde e quando", () => {
    registrar("aviso", "Undefined array key \"telefone\"");
    assert.ok(existsSync(log()));
    const l = JSON.parse(readFileSync(log(), "utf8").trim().split("\n").at(-1)!);
    assert.equal(l.tipo, "aviso");
    assert.match(l.msg, /telefone/);
    assert.equal(l.onde, "pessoas.php:42");
  });

  test("a Manutenção mostra os dos últimos 7 dias, e zera", async () => {
    registrar("fatal", "Call to undefined function x()");
    const { html } = painel.abrir("manutencao", "");
    assert.match(html, /Erros dos últimos 7 dias \(1\)/);
    assert.match(html, /undefined function x/);

    await painel.postar("manutencao", { acao: "limpar-erros" });
    assert.equal(existsSync(log()), false);
    assert.match(painel.abrir("manutencao", "").html, /Nenhum\./);
  });

  test("no sandbox o gancho fica desligado — o aviso continua derrubando o teste", () => {
    const script = path.join(painel.dir, "gancho.php");
    writeFileSync(script, `<?php
ini_set('display_errors', 'stderr');
require __DIR__ . '/painel/sessao.php';
echo set_error_handler(fn () => true) === null ? 'sem-gancho' : 'com-gancho';
`);
    const saida = execFileSync("php", [script], { encoding: "utf8" });
    assert.equal(saida.trim(), "sem-gancho");
  });
});
