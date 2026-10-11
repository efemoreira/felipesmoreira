import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * MEU LUGAR e a unidade de quem responde por ela (plano 2026–2027: "cada
 * pessoa vê seus grupos, documentos e tarefas; coordenadores com ferramentas
 * extras para suas unidades").
 *
 * A conta de teste perde as capacidades (`trocarCapacidades("")`): é uma
 * militante comum que responde por um núcleo. Ela cuida do dela — registra,
 * marca a próxima, põe gente, combina tarefa — e é barrada no dos outros.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const MARIA = "pes00000000teste";
const dia = (n: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date(Date.now() + n * 86_400_000));

function semear() {
  painel.gravar("nucleos", [
    { id: "nuc-a1b2c3", nome: "Benfica", cidade: "Fortaleza", bairro: "Benfica", responsavelId: ADMIN, publicado: true },
    { id: "nuc-d4e5f6", nome: "Messejana", cidade: "Fortaleza", responsavelId: MARIA },
  ]);
  painel.trocarCapacidades("");
}

describe("minha unidade: quem responde cuida da sua, e só da sua", () => {
  test("a tela abre para o responsável sem Coordenação", () => {
    semear();
    const { html, erros } = painel.abrir("minha-unidade", "u=nuc-a1b2c3");
    assert.deepEqual(erros.split("\n").filter((l) => /Warning|Notice|Fatal|Uncaught/.test(l)), []);
    assert.match(html, /Núcleo Benfica/);
    assert.match(html, /Registrar o que fizemos/);
  });

  test("a unidade de outra pessoa não abre: cai na que é dela", () => {
    semear();
    const { html } = painel.abrir("minha-unidade", "u=nuc-d4e5f6");
    assert.doesNotMatch(html, /Núcleo Messejana/);
  });

  test("registrar e marcar a próxima — e o núcleo fica ativo", async () => {
    semear();
    await painel.postar("minha-unidade", { acao: "entrega", texto: "Escuta, 12 pessoas", data: dia(-1) }, "u=nuc-a1b2c3");
    await painel.postar("minha-unidade", { acao: "proxima", dia: dia(6), titulo: "Roda de conversa" }, "u=nuc-a1b2c3");
    const [n] = painel.ler("nucleos");
    assert.equal(n.entregas.length, 1);
    assert.equal(n.entregas[0].porId, ADMIN);
    const ev = painel.ler("eventos").find((e: { unidadeId: string }) => e.unidadeId === "nuc-a1b2c3");
    assert.equal(ev.titulo, "Roda de conversa");
  });

  test("POST na unidade dos outros não grava", async () => {
    semear();
    await painel.postar("minha-unidade", { acao: "entrega", texto: "Intrusa", data: dia(-1) }, "u=nuc-d4e5f6");
    const messejana = painel.ler("nucleos").find((n: { id: string }) => n.id === "nuc-d4e5f6");
    assert.equal(messejana.entregas.length, 0);
  });

  test("pôr alguém na unidade e combinar uma tarefa com ela", async () => {
    semear();
    await painel.postar("minha-unidade", { acao: "membro", pessoaId: MARIA }, "u=nuc-a1b2c3");
    assert.deepEqual(painel.ler("pessoas").find((p: { id: string }) => p.id === MARIA).unidades, ["nuc-a1b2c3"]);

    await painel.postar("minha-unidade", { acao: "tarefa-nova", titulo: "Levar o som", donoId: MARIA }, "u=nuc-a1b2c3");
    const [t] = painel.ler("tarefas");
    assert.equal(t.unidadeId, "nuc-a1b2c3");
    assert.equal(t.donoId, MARIA);
  });

  test("tarefa com quem não faz parte é recusada", async () => {
    semear();
    const r = await painel.postar("minha-unidade", { acao: "tarefa-nova", titulo: "X", donoId: MARIA }, "u=nuc-a1b2c3");
    assert.match(r.html, /alguém que faz parte da unidade/);
    assert.equal(painel.ler("tarefas").length, 0);
  });
});

describe("Meu lugar no Início", () => {
  test("mostra o degrau, a unidade e a porta para cuidar dela", () => {
    semear();
    const html = painel.abrir("index").html;
    assert.match(html, /Degrau \d de 5/);
    assert.match(html, /Núcleo Benfica/);
    assert.match(html, /minha-unidade\.php\?u=nuc-a1b2c3/);
  });

  test("o responsável recebe a pendência de marcar a próxima", () => {
    semear();
    assert.match(painel.abrir("index").html, /Marcar a próxima atividade do núcleo Benfica/);
  });

  test("quem quer entrar aparece para o responsável, com o nome encoberto", () => {
    semear();
    const pessoas = painel.ler("pessoas").map((p: { id: string }) => (p.id === MARIA ? { ...p, interesse: "nuc-a1b2c3" } : p));
    painel.gravar("pessoas", pessoas);
    const html = painel.abrir("index").html;
    assert.match(html, /Maria S\. quer entrar no núcleo/);
    assert.doesNotMatch(html, /Maria da Silva Sauro quer entrar/);
  });
});
