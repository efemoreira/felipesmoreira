import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a fila da Checagem — aprovar, adiar, arquivar.
 *
 * Duas regras do manual viraram código aqui, e são as duas que este arquivo
 * existe para prender:
 *
 * 1. **Quem traz o fato não checa o fato.** Checagem que o próprio autor faz é
 *    a mesma pessoa conferindo a si mesma, e o passo inteiro vira carimbo. O
 *    admin destrava, mas caro: escreve o porquê, e o porquê fica na ficha.
 * 2. **"Nada" é uma resposta legítima, e fica registrada.** Sem o motivo do
 *    arquivamento, fato aprovado que ninguém aproveitou fica idêntico a fato
 *    esquecido, e a pergunta "o que foi feito com aquele fato" não tem resposta.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const FATO = "ft-teste";

describe("ação: quem traz o fato não checa o fato", () => {
  /** Manda um fato NOVO pela tela — ele nasce com o autor sendo quem está logado. */
  async function meuFato(): Promise<string> {
    const hoje = new Date().toISOString().slice(0, 10);
    await painel.postar("fatos", {
      acao: "enviar",
      oQue: "Licitação de merenda sem concorrente em Sobral",
      quem: "Prefeitura de Sobral",
      quando: hoje,
      fonteUrl: "https://diariooficial.ce.gov.br/licitacao",
      fonteData: hoje,
      categoria: "gestao",
    });
    const meu = painel.ler("fatos").find((f) => f.oQue.startsWith("Licitação de merenda"));
    assert.ok(meu, "o fato de apoio não foi criado");
    assert.equal(meu.autorId, ADMIN, "sem autor a regra não teria como ser aplicada");
    return meu.id;
  }

  test("o autor não aprova o próprio fato, nem sendo admin, sem dizer por quê", async () => {
    const id = await meuFato();

    const r = await painel.postar("fatos", { acao: "aprovar", id });

    assert.match(r.html, /escreva por que não deu para outra pessoa checar/i);
    assert.equal(
      painel.ler("fatos").find((f) => f.id === id).status,
      "a-checar",
      "o autor carimbou o próprio fato",
    );
  });

  test("o admin destrava escrevendo o porquê, e o porquê fica na ficha", async () => {
    const id = await meuFato();

    await painel.postar("fatos", {
      acao: "aprovar",
      id,
      destrava: "Fim de semana, e o fato vence hoje. Confirmei no Diário com a coordenação.",
    });

    const f = painel.ler("fatos").find((x) => x.id === id);
    assert.equal(f.status, "ok-checado");
    assert.match(
      f.destravaMotivo,
      /Confirmei no Diário/,
      "destravar sem deixar rastro é o mesmo que não ter a regra",
    );
  });

  test("fato de OUTRA pessoa se checa sem destrava, e sem guardar destrava à toa", async () => {
    /* O fato semeado é da Maria, e quem está logado é a coordenação. */
    await painel.postar("fatos", { acao: "aprovar", id: FATO, destrava: "não precisava" });

    const f = painel.ler("fatos").find((x) => x.id === FATO);
    assert.equal(f.status, "ok-checado");
    assert.equal(f.destravaMotivo ?? "", "", "guardou destrava numa checagem que não contornou nada");
  });
});

describe("ação: aprovar o fato", () => {
  test("sem saída marcada, aprova e não abre card nenhum", async () => {
    const antes = painel.ler("producao").length;
    const r = await painel.postar("fatos", { acao: "aprovar", id: FATO });

    assert.equal(painel.ler("fatos").find((f) => f.id === FATO).status, "ok-checado");
    assert.equal(
      painel.ler("producao").length,
      antes,
      "aprovar abriu card que ninguém pediu — era o defeito de antes",
    );
    assert.equal(r.status, 302);
  });

  test("cada saída marcada abre um card, com fonte e responsável colados", async () => {
    const antes = painel.ler("producao").length;
    await painel.postar("fatos", { acao: "aprovar", id: FATO, saida: ["roteiro", "arte"] });

    const cards = painel.ler("producao");
    assert.equal(cards.length, antes + 2, "uma saída marcada, um card");

    const novos = cards.filter((c) => c.fatoId === FATO && c.id !== "cd-teste");
    assert.deepEqual(novos.map((c) => c.etapa).sort(), ["arte", "roteiro"]);
    for (const c of novos) {
      assert.equal(c.fonteUrl, "https://diariooficial.ce.gov.br/x", "o card nasceu sem fonte");
      assert.equal(c.responsavel, "Secretaria de Infraestrutura");
    }
  });

  test("saída inventada não vira card", async () => {
    const antes = painel.ler("producao").length;
    await painel.postar("fatos", { acao: "aprovar", id: FATO, saida: ["podcast"] });

    assert.equal(painel.ler("producao").length, antes);
    assert.equal(painel.ler("fatos").find((f) => f.id === FATO).status, "ok-checado");
  });

  test("fato já decidido não se decide de novo", async () => {
    await painel.postar("fatos", { acao: "aprovar", id: FATO });
    const r = await painel.postar("fatos", { acao: "arquivar", id: FATO, motivo: "mudei de ideia" });

    assert.match(r.html, /já foi decidido/);
    assert.equal(painel.ler("fatos").find((f) => f.id === FATO).status, "ok-checado");
  });
});

describe("ação: arquivar e adiar exigem o motivo", () => {
  test("arquivar sem motivo não arquiva", async () => {
    const r = await painel.postar("fatos", { acao: "arquivar", id: FATO, motivo: "" });

    assert.match(r.html, /por que o fato não vira peça/i);
    assert.equal(painel.ler("fatos").find((f) => f.id === FATO).status, "a-checar");
  });

  test("arquivar com motivo registra o motivo na ficha", async () => {
    await painel.postar("fatos", {
      acao: "arquivar",
      id: FATO,
      motivo: "A obra foi retomada na semana passada.",
    });

    const f = painel.ler("fatos").find((x) => x.id === FATO);
    assert.equal(f.status, "arquivado");
    assert.equal(f.motivo, "A obra foi retomada na semana passada.");
  });

  test("adiar sem motivo não adia — ninguém saberia o que faltou", async () => {
    const r = await painel.postar("fatos", { acao: "pendente", id: FATO, motivo: "" });

    assert.match(r.html, /por que ficou pendente/i);
    assert.equal(painel.ler("fatos").find((f) => f.id === FATO).status, "a-checar");
  });
});

describe("ação: enviar fato novo", () => {
  test("sem link de fonte primária não entra na fila", async () => {
    const antes = painel.ler("fatos").length;
    const r = await painel.postar("fatos", {
      acao: "enviar",
      oQue: "Ouvi dizer que a ponte caiu",
      quem: "Prefeitura",
      quando: "2026-08-20",
      fonteUrl: "",
      fonteData: new Date().toISOString().slice(0, 10),
    });

    assert.equal(painel.ler("fatos").length, antes, "fato sem fonte entrou na fila");
    assert.doesNotMatch(r.html, /Fato registrado/i);
  });

  test("com fonte primária entra, e o autor fica gravado", async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    await painel.postar("fatos", {
      acao: "enviar",
      oQue: "Escola sem merenda há duas semanas em Caucaia",
      quem: "Secretaria de Educação",
      quando: hoje,
      fonteUrl: "https://diariooficial.ce.gov.br/edicao-de-hoje",
      fonteData: hoje,
      categoria: "gestao",
    });

    const novo = painel.ler("fatos").find((f) => f.oQue.startsWith("Escola sem merenda"));
    assert.ok(novo, "o fato não entrou na fila");
    assert.equal(novo.status, "a-checar");
    assert.equal(novo.autorId, ADMIN, "sem autor não dá para aplicar 'quem traz não checa'");
  });
});
