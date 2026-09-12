import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: exportar é o recorte da tela, em CSV — e só para quem pode.
 *
 * Três coisas prendem: as linhas são as do recorte (a mesma
 * `recorte_de_pessoas()` da lista); o arquivo abre no Excel (BOM, `;`,
 * telefone como texto); e dado pessoal só sai para coordenação/adm, caixa só
 * para adm. Nada é gravado.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const linhas = (csv: string) => csv.replace(/^﻿/, "").split("\r\n").filter((l) => l !== "");

describe("exportar: pessoas", () => {
  test("sai com BOM, cabeçalho e uma linha por pessoa", async () => {
    const r = await painel.buscar("exportar", "o=pessoas");
    assert.equal(r.status, 200);
    assert.match(r.cabecalhos?.["content-type"] ?? "", /text\/csv/);
    assert.match(r.cabecalhos?.["content-disposition"] ?? "", /pessoas-\d{4}-\d{2}-\d{2}\.csv/);
    /* `fetch().text()` tira o BOM ao decodificar, e o php -S manda em
       chunks, sem content-length: a prova do BOM fica no PHP, que é quem o
       escreve — `csv()` em exportar-comum.php começa por "\xEF\xBB\xBF". */
    const fonte = readFileSync(path.join(painel.dir, "painel", "exportar-comum.php"), "utf8");
    assert.match(fonte, /\\xEF\\xBB\\xBF/, "csv() perdeu o BOM — sem ele o Excel abre em ISO-8859 e come o acento");
    const ls = linhas(r.html);
    assert.equal(ls[0], '"Nome";"Tipo";"Situação";"WhatsApp";"E-mail";"Cidade";"Bairro";"Funções";"Redes";"Quem acompanha";"Origem";"Chegou em";"Tem conta"');
    assert.equal(ls.length - 1, painel.ler("pessoas").length, "linhas ≠ pessoas");
  });

  test("o recorte da querystring é o recorte do CSV", async () => {
    const todas = linhas((await painel.buscar("exportar", "o=pessoas")).html).length - 1;
    const so = linhas((await painel.buscar("exportar", "o=pessoas&q=maria")).html).length - 1;
    assert.ok(so < todas, "a busca não recortou o CSV");
    assert.equal(so, 1);
  });

  test("telefone vai entre aspas, formatado — o Excel não o transforma em número", async () => {
    const r = await painel.buscar("exportar", "o=pessoas&q=maria");
    assert.match(r.html, /"\(85\) 99999-0000"/);
  });

  test("não grava nada", async () => {
    const antes = JSON.stringify(painel.ler("pessoas"));
    await painel.buscar("exportar", "o=pessoas");
    assert.equal(JSON.stringify(painel.ler("pessoas")), antes);
  });
});

describe("exportar: presenças e caixa", () => {
  test("as presenças de um encontro, com confirmou e compareceu", async () => {
    const r = await painel.buscar("exportar", "o=presencas&evento=ev-teste");
    const ls = linhas(r.html);
    assert.match(ls[0], /^"Nome";"WhatsApp";"Cidade";"Bairro";"Confirmou";"Compareceu"/);
    assert.equal(ls.length - 1, painel.ler("presencas").filter((l) => l.eventoId === "ev-teste").length);
  });

  test("o caixa, para o contador", async () => {
    await painel.postar("caixa", { acao: "lancar", conta: "movimento", valor: "12,50", origem: "alimentos", descricao: "Teste", sentido: "entrou" });
    const r = await painel.buscar("exportar", "o=caixa&conta=movimento");
    const ls = linhas(r.html);
    assert.match(ls[0], /^"Data";"Tipo";"Valor"/);
    assert.match(r.html, /"12,50"/);
  });

  test("o que não existe é 404, não CSV vazio", async () => {
    const r = await painel.buscar("exportar", "o=segredos");
    assert.equal(r.status, 404);
  });
});

describe("exportar: a porta", () => {
  test("quem tem só Eventos não exporta pessoas", async () => {
    painel.trocarCapacidades("eventos");
    const r = await painel.buscar("exportar", "o=pessoas");
    assert.equal(r.status, 302);
    assert.match(r.location, /negado=exportar/);
  });

  test("coordenação exporta pessoas e presenças, mas não o caixa", async () => {
    painel.trocarCapacidades("coordenacao");
    assert.equal((await painel.buscar("exportar", "o=pessoas")).status, 200);
    assert.equal((await painel.buscar("exportar", "o=presencas&evento=ev-teste")).status, 200);
    const caixa = await painel.buscar("exportar", "o=caixa&conta=movimento");
    assert.equal(caixa.status, 302);
    assert.match(caixa.location, /negado=caixa/);
  });
});
