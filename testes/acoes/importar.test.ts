import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: importar uma planilha — prévia primeiro, gravação só do marcado.
 *
 * Três linhas: uma nova, uma que já existe (o telefone da Maria semeada),
 * uma sem telefone. A prévia diz o que vai acontecer com cada uma e não
 * grava; confirmar grava só a nova; a que existe não vira segunda ficha.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const CSV = [
  "nome;whatsapp;cidade;bairro",
  "João Pedro Novo;(85) 98888-1111;Fortaleza;Montese",
  "Maria Repetida;85 99999-0000;Fortaleza;Benfica",
  "Sem Telefone;;Fortaleza;Centro",
].join("\r\n");

describe("importar: prévia e confirmação", () => {
  test("a prévia lê o CSV do Excel, classifica cada linha e não grava", async () => {
    const antes = painel.ler("pessoas").length;
    const r = await painel.postarComArquivo("importar", { acao: "previa" }, { arquivo: { nome: "gente.csv", conteudo: new TextEncoder().encode("﻿" + CSV), tipo: "text/csv" } });
    assert.match(r.location, /previa=1/);
    assert.match(r.html, /1 nova\(s\) · 1 já existe\(m\) · 1 inválida\(s\)/);
    assert.match(r.html, /João Pedro Novo/);
    assert.match(r.html, /já é Maria da Silva Sauro/);
    assert.match(r.html, /sem nome|telefone incompleto/);
    assert.equal(painel.ler("pessoas").length, antes, "a prévia gravou");
  });

  test("confirmar grava só a nova, com a origem, e não duplica a Maria", async () => {
    await painel.postar("importar", { acao: "previa", texto: CSV });
    const r = await painel.postar("importar", { acao: "confirmar", "linhas[]": ["2"], status: "", origem: "planilha-teste" });
    assert.match(r.html, /1 pessoa\(s\) importada\(s\)/);
    const pessoas = painel.ler("pessoas");
    const joao = pessoas.find((p) => p.nome === "João Pedro Novo");
    assert.ok(joao, "não gravou a nova");
    assert.equal(joao.telefone, "85988881111");
    assert.equal(joao.origem, "planilha-teste");
    assert.equal(joao.status, "");
    assert.equal(pessoas.filter((p) => p.telefone === "85999990000").length, 1, "a Maria virou duas");
  });

  test("como pendentes, vão para a fila de Inscrições", async () => {
    await painel.postar("importar", { acao: "previa", texto: CSV });
    await painel.postar("importar", { acao: "confirmar", "linhas[]": ["2"], status: "pendente" });
    assert.equal(painel.ler("pessoas").find((p) => p.nome === "João Pedro Novo").status, "pendente");
    assert.match(painel.abrir("inscricoes", "").html, /João Pedro Novo/);
  });

  test("cabeçalho sem telefone é recusado antes da prévia", async () => {
    const r = await painel.postar("importar", { acao: "previa", texto: "nome;cidade\nAlguém;Fortaleza" });
    assert.match(r.html, /precisa ter, no mínimo/);
  });

  test("só a administração", async () => {
    painel.trocarCapacidades("coordenacao");
    const r = await painel.buscar("importar");
    assert.equal(r.status, 302);
  });
});
