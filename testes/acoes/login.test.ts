import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: o teto de tentativas tranca quem erra, e não quem é alvo.
 *
 * Só por conta, cinco senhas erradas em qualquer login conhecido trancavam a
 * conta por quinze minutos — para o dono também. Agora a conta tranca para o
 * ENDEREÇO que errou; e o endereço que erra demais, em contas diferentes ou
 * não, tranca por inteiro.
 *
 * O sandbox conecta por loopback, que é o que um proxy da hospedagem tem: o
 * `X-Forwarded-For` é aceito, e cada teste finge um endereço por ele.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/* Sem o cookie da conta de teste: quem erra senha é quem ainda não entrou. */
const de = (ip: string) => ({ "x-forwarded-for": ip, cookie: "" });
const errar = (ip: string, usuario = "teste") =>
  painel.postar("index", { acao: "entrar", usuario, senha: "errada-de-proposito" }, "", de(ip));

const TRANCADA = /Muitas tentativas/;

describe("login: o bloqueio é por conta E endereço", () => {
  test("cinco erros de um endereço trancam a conta para ele", async () => {
    for (let i = 0; i < 5; i++) await errar("203.0.113.10");
    const r = await errar("203.0.113.10");
    assert.match(r.html, TRANCADA, "o sexto erro do mesmo endereço não trancou");
  });

  test("…e NÃO para outro endereço — o dono da conta continua entrando", async () => {
    for (let i = 0; i < 6; i++) await errar("203.0.113.10");
    const r = await errar("198.51.100.7");
    assert.doesNotMatch(r.html, TRANCADA, "um endereço trancou a conta para o mundo inteiro");
    assert.match(r.html, /incorretos/);
  });

  test("um endereço que erra em contas diferentes tranca por inteiro", async () => {
    /* Quinze erros espalhados por quinze logins: nenhum login chega a cinco,
       mas o endereço chega a quinze. */
    for (let i = 0; i < 15; i++) await errar("203.0.113.99", `conta${i}`);
    const r = await errar("203.0.113.99", "outra-conta");
    assert.match(r.html, TRANCADA, "o endereço espalhou os erros e não trancou");
  });
});

describe("login: o X-Forwarded-For só vale atrás de proxy", () => {
  test("a chave do visitante muda com o header quando a conexão é de loopback", async () => {
    /* Prova indireta, pela trava: seis erros de "um" endereço trancam; se o
       header fosse ignorado, os dois endereços seriam o mesmo (127.0.0.1) e o
       segundo já viria trancado. */
    for (let i = 0; i < 6; i++) await errar("203.0.113.10");
    const r = await errar("203.0.113.11");
    assert.doesNotMatch(r.html, TRANCADA);
  });
});

describe("login: com conexão de endereço público, o header é ignorado", () => {
  /* O `php -S` só conecta por loopback; este lado se prova pelo CLI, com o
     `$_SERVER` forjado nos dois cenários. */
  function chave(remoteAddr: string, xff: string): string {
    const script = path.join(painel.dir, "chave.php");
    writeFileSync(
      script,
      `<?php
$_SERVER['REMOTE_ADDR'] = ${JSON.stringify(remoteAddr)};
$_SERVER['HTTP_X_FORWARDED_FOR'] = ${JSON.stringify(xff)};
require __DIR__ . '/painel/sessao.php';
echo chave_visitante();
`,
    );
    return execFileSync("php", [script], { encoding: "utf8" }).trim();
  }

  test("atrás de proxy (loopback), o X-Forwarded-For é o visitante", () => {
    assert.notEqual(chave("127.0.0.1", "203.0.113.10"), chave("127.0.0.1", "203.0.113.11"));
  });

  test("com REMOTE_ADDR público, trocar o header não muda o visitante", () => {
    assert.equal(chave("198.51.100.7", "203.0.113.10"), chave("198.51.100.7", "203.0.113.11"));
    assert.equal(chave("198.51.100.7", "203.0.113.10"), chave("198.51.100.7", ""));
  });
});
