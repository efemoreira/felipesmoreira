import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: o sinal do site conta — e só conta.
 *
 * `api/sinal.php` é a medição mínima e sem terceiro. O que este teste
 * prende é o "só": nada além de dia × rota × evento vai para o arquivo —
 * nenhum endereço, nenhum telefone, nenhum id — e o que está fora das listas
 * fechadas não entra.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const API = "api/sinal.php";
const arquivo = () => path.join(painel.dir, "dados", "sinais.php");
const sinais = (): Record<string, Record<string, Record<string, number>>> => {
  if (!existsSync(arquivo())) return {};
  const php = readFileSync(arquivo(), "utf8");
  /* var_export → objeto: o arquivo é pequeno e regular. */
  const dias: Record<string, Record<string, Record<string, number>>> = {};
  let dia = "", rota = "";
  for (const linha of php.split("\n")) {
    const d = linha.match(/^  '(\d{4}-\d{2}-\d{2})' =>/);
    const r = linha.match(/^    '([a-z-]*)' =>/);
    const e = linha.match(/^      '([a-z-]+)' => (\d+),/);
    if (d) { dia = d[1]; dias[dia] = {}; continue; }
    if (r) { rota = r[1]; dias[dia][rota] = {}; continue; }
    if (e) dias[dia][rota][e[1]] = Number(e[2]);
  }
  return dias;
};
const hoje = () => Object.keys(sinais()).sort().at(-1) ?? "";

describe("sinal: conta por dia, rota e evento", () => {
  test("três aberturas e um compartilhamento viram 3 e 1", async () => {
    for (let i = 0; i < 3; i++) await painel.postarJson(API, { rota: "candidatos", evento: "abriu", site: "" });
    await painel.postarJson(API, { rota: "candidatos", evento: "compartilhou", site: "" });
    const s = sinais();
    assert.equal(s[hoje()].candidatos.abriu, 3);
    assert.equal(s[hoje()].candidatos.compartilhou, 1);
  });

  test("a raiz conta como rota vazia", async () => {
    await painel.postarJson(API, { rota: "", evento: "abriu", site: "" });
    assert.equal(sinais()[hoje()][""].abriu, 1);
  });

  test("rota ou evento fora da lista não grava, e responde ok mesmo assim", async () => {
    const a = await painel.postarJson(API, { rota: "admin", evento: "abriu", site: "" });
    const b = await painel.postarJson(API, { rota: "candidatos", evento: "clicou-no-botao", site: "" });
    assert.equal(a.json.ok, true);
    assert.equal(b.json.ok, true);
    assert.equal(existsSync(arquivo()), false, "gravou o que está fora da lista");
  });

  test("robô cai fora calado", async () => {
    const r = await painel.postarJson(API, { rota: "candidatos", evento: "abriu", site: "http://spam" });
    assert.equal(r.json.ok, true);
    assert.equal(existsSync(arquivo()), false);
  });

  test("o arquivo não tem nada além de dia, rota, evento e número", async () => {
    await painel.postarJson(API, { rota: "queroajudar", evento: "enviou-inscricao", site: "", telefone: "85999990000", ip: "1.2.3.4" });
    const php = readFileSync(arquivo(), "utf8");
    assert.doesNotMatch(php, /85999990000|1\.2\.3\.4|telefone|ip/, "algo além da contagem foi para o arquivo");
    const linhas = php.split("\n").filter((l) => /^\s+'/.test(l));
    for (const l of linhas) {
      assert.match(l, /^\s+'(\d{4}-\d{2}-\d{2}|[a-z-]*)' =>( \d+,|\s*$)/, `linha estranha no arquivo: ${l}`);
    }
  });

  test("Leituras › Semana desenha o bloco do site", async () => {
    await painel.postarJson(API, { rota: "candidatos", evento: "abriu", site: "" });
    const { html } = painel.abrir("leituras", "aba=semana");
    assert.match(html, /O site/);
    assert.match(html, /\/candidatos/);
  });
});
