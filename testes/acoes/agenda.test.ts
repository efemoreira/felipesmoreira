import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a capa da programação — o que `/painel/agenda` grava no `agenda.json`.
 *
 * O arquivo é o único de /dados aberto à web, e é ele que `/programacao` lê.
 * Duas escolhas da capa mudam o que a página FAZ, e não só o que ela diz:
 *
 * 1. **`inicioSemana`** decide o que "esta semana" e "próxima semana" recortam,
 *    nos dois lados. Gravado errado, o painel e o site discordam sobre a
 *    semana — e quem lê a divergência é o eleitor.
 * 2. **`grupo`** é um link que vira `href` na página pública: passa por
 *    `limpar_link()`, que barra `javascript:` e completa o https.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const lerAgenda = () =>
  JSON.parse(readFileSync(path.join(painel.dir, "dados/agenda.json"), "utf8"));

describe("ação: publicar a capa da programação", () => {
  test("grava o começo da semana e o link do grupo", async () => {
    const r = await painel.postar("agenda", {
      acao: "salvar",
      titulo: "Agenda da Semana",
      periodo: "",
      chamada: "A semana inteira",
      inicioSemana: "segunda",
      grupo: "chat.whatsapp.com/abc123",
      canal: ["youtube"],
    });

    assert.match(r.html, /Capa publicada/);
    const agenda = lerAgenda();
    assert.equal(agenda.inicioSemana, "segunda");
    /* Colou sem o https: `limpar_link()` completa, como faz com o link do encontro. */
    assert.equal(agenda.grupo, "https://chat.whatsapp.com/abc123");
    assert.equal(agenda.periodoSemana, "", "sem período escrito não há carimbo");
  });

  test("começo de semana fora da lista cai no domingo; link perigoso não entra", async () => {
    await painel.postar("agenda", {
      acao: "salvar",
      titulo: "Agenda",
      inicioSemana: "quarta",
      grupo: "javascript:alert(1)",
    });

    const agenda = lerAgenda();
    assert.equal(agenda.inicioSemana, "domingo");
    assert.equal(agenda.grupo, "", "o href da página pública não pode carregar javascript:");
  });

  test("o período escrito à mão é carimbado com a semana da régua gravada junto", async () => {
    await painel.postar("agenda", {
      acao: "salvar",
      titulo: "Agenda",
      periodo: "semana de lives",
      inicioSemana: "segunda",
    });

    const agenda = lerAgenda();
    assert.equal(agenda.periodo, "semana de lives");
    /* O carimbo é uma SEGUNDA — a régua nova, e não o domingo da régua antiga. */
    const carimbo = new Date(agenda.periodoSemana);
    const diaNoCeara = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Fortaleza",
      weekday: "short",
    }).format(carimbo);
    assert.equal(diaNoCeara, "Mon");
  });

  test("apagar o grupo tira o link do arquivo", async () => {
    await painel.postar("agenda", { acao: "salvar", titulo: "Agenda", grupo: "https://chat.whatsapp.com/x" });
    assert.equal(lerAgenda().grupo, "https://chat.whatsapp.com/x");

    await painel.postar("agenda", { acao: "salvar", titulo: "Agenda", grupo: "" });
    assert.equal(lerAgenda().grupo, "");
  });
});
