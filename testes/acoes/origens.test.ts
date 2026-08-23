import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * O RELATÓRIO DE CONVERSÃO POR ORIGEM — "De onde vêm", em `/painel/inscricoes`.
 *
 * O `?de=` gravava a origem desde sempre e ninguém conseguia responder a
 * pergunta que ele existe para responder: **das pessoas que este link trouxe,
 * quantas viraram militante?**
 *
 * A tabela tem três degraus, e a ordem entre eles é o ponto do teste. Uma live
 * que traz cinquenta inscrições e nenhuma presença fica no TOPO se a ordem for
 * por total, e é a pior origem do movimento; um militante que traz seis e vê as
 * seis comparecendo é o que precisa ser copiado. Ordenar pelo total premia quem
 * faz barulho, não quem traz gente.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/** Lê a tabela da aba, linha a linha, do HTML renderizado. */
function tabelaDeOrigens(html: string) {
  const corpo = /De onde vem a militância[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/.exec(html);
  if (corpo === null) return [];
  return [...corpo[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((tr) => {
    /* `<td[^>]*>` e não `<td>`: no celular a tabela vira cartão, e cada célula
       carrega a classe da largura e o `data-rotulo` que substitui o cabeçalho.
       O que este teste lê é o NÚMERO da coluna — não o atributo que a coluna
       usa para se desenhar. */
    const celulas = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      c[1].replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(),
    );
    return {
      origem: celulas[0] ?? "",
      chegaram: Number(celulas[1]),
      aprovadas: Number(celulas[2]),
      militaram: Number(celulas[3]),
      conversao: celulas[4] ?? "",
    };
  });
}

/** Põe alguém na base com uma origem, opcionalmente já no encontro semeado. */
function semear(pessoas: { nome: string; origem: string; status?: string; veio?: boolean }[]) {
  const base = painel.ler("pessoas");
  const presencas = painel.ler("presencas");
  pessoas.forEach((p, i) => {
    const id = `org${String(i).padStart(13, "0")}`;
    base.push({
      id,
      nome: p.nome,
      telefone: `8599900${String(1000 + i)}`,
      cidade: "Fortaleza",
      bairro: "Centro",
      tipo: "militante",
      status: p.status ?? "aprovada",
      origem: p.origem,
      ativo: true,
      criadoEm: `2026-0${(i % 8) + 1}-01T10:00:00-03:00`,
    });
    if (p.veio) {
      presencas.push({
        id: `pro${i}`,
        eventoId: "ev-teste",
        pessoaId: id,
        confirmou: true,
        compareceu: true,
        funil: { d0: "", d3: "", d7: "" },
        origem: "qr",
        criadoEm: "2026-02-01T10:00:00-03:00",
      });
    }
  });
  painel.gravar("pessoas", base);
  painel.gravar("presencas", presencas);
}

describe("origens: o funil de conversão", () => {
  test("conta os três degraus por origem", async () => {
    semear([
      { nome: "Um da Live", origem: "live-domingo", status: "pendente" },
      { nome: "Dois da Live", origem: "live-domingo" },
      { nome: "Três da Live", origem: "live-domingo", veio: true },
    ]);

    const linhas = tabelaDeOrigens((await painel.buscar("inscricoes", "aba=origens")).html);
    const live = linhas.find((l) => l.origem.startsWith("live-domingo"));

    assert.ok(live, "a origem não apareceu no relatório");
    assert.equal(live.chegaram, 3);
    assert.equal(live.aprovadas, 2, "a pendente não pode contar como aprovada");
    assert.equal(live.militaram, 1, "só quem compareceu conta como militante");
    assert.equal(live.conversao, "33%");
  });

  test("a ordem é por quem MILITOU, e não pelo total", async () => {
    semear([
      /* O canal barulhento: muita gente, ninguém apareceu. */
      ...Array.from({ length: 5 }, (_, i) => ({ nome: `Curioso ${i}`, origem: "live-domingo" })),
      /* O militante que traz pouco e entrega: dois, os dois compareceram. */
      { nome: "Trazido A", origem: "joao-silva", veio: true },
      { nome: "Trazido B", origem: "joao-silva", veio: true },
    ]);

    const linhas = tabelaDeOrigens((await painel.buscar("inscricoes", "aba=origens")).html);

    assert.equal(
      linhas[0].origem.startsWith("joao-silva"),
      true,
      "a origem que enche a fila e não entrega ficou no topo — é justamente a leitura " +
        "errada que este relatório existe para desfazer",
    );
    assert.equal(linhas[0].militaram, 2);
    assert.equal(linhas[1].chegaram, 5, "o canal barulhento continua na tabela, só que abaixo");
    assert.equal(linhas[1].militaram, 0);
  });

  test("a origem que é o slug de alguém do cadastro mostra o nome dessa pessoa", async () => {
    /* `?de=joao-silva` é gente e `?de=live-domingo` é canal. O campo é um só
       porque na prática a pergunta é a mesma, mas quem lê precisa distinguir
       para saber se agradece ou se repete. E slug ninguém reconhece no grupo. */
    semear([
      { nome: "João Silva", origem: "" },
      { nome: "Trazido por ele", origem: "joao-silva", veio: true },
    ]);

    const linhas = tabelaDeOrigens((await painel.buscar("inscricoes", "aba=origens")).html);
    const dele = linhas.find((l) => l.origem.startsWith("joao-silva"));

    assert.ok(dele, "a origem não apareceu");
    assert.match(dele.origem, /João Silva/, "o slug não foi traduzido para o nome de quem trouxe");
  });

  test("quem veio pela URL limpa fica FORA da tabela", async () => {
    /* Somá-lo às origens faria "veio sozinho" parecer o melhor canal da
       campanha — e não há ninguém a quem agradecer nem nada a repetir. */
    semear([
      { nome: "Sozinho Um", origem: "" },
      { nome: "Sozinho Dois", origem: "", veio: true },
      { nome: "Da Live", origem: "live-domingo" },
    ]);

    const r = await painel.buscar("inscricoes", "aba=origens");
    const linhas = tabelaDeOrigens(r.html);

    assert.equal(linhas.length, 1, "quem chegou sem origem virou linha de origem");

    /* O número sai da base, e não cravado no teste: a semente já traz gente sem
       origem (a coordenação e a pessoa da fila), e um número fixo aqui quebraria
       na primeira vez que alguém acrescentasse uma linha à semente. */
    const semOrigem = painel
      .ler("pessoas")
      .filter((p) => (p.status ?? "") !== "" && (p.origem ?? "") === "").length;
    assert.match(r.html, new RegExp(`${semOrigem}</strong> chegaram pela URL limpa`));

    /* Maria, da semente, compareceu ao encontro e não tem origem — com a que
       este teste acrescentou, são duas. O plural tem de acompanhar. */
    assert.match(r.html, /2 dessas já apareceram num encontro/);
  });

  test("quem a coordenação cadastrou à mão não entra no funil", async () => {
    /* Só quem passou pelo formulário: quem foi cadastrado na mão, ou quem
       apareceu num encontro, não veio de link nenhum. É o `status` vazio. */
    semear([{ nome: "Cadastrado à Mão", origem: "live-domingo", status: "" }]);

    const linhas = tabelaDeOrigens((await painel.buscar("inscricoes", "aba=origens")).html);
    assert.equal(linhas.length, 0, "ficha sem status entrou na conta de conversão");
  });

  test("a aba existe, conta as origens e não some com as outras duas", async () => {
    semear([{ nome: "Da Live", origem: "live-domingo" }]);
    const { html } = await painel.buscar("inscricoes", "aba=origens");

    assert.match(html, /De onde vêm/);
    assert.match(html, /Esperando decisão/);
    assert.match(html, /Já decididas/);
    /* O contador da aba é o número de ORIGENS, e não de pessoas. */
    assert.match(html, /De onde vêm<\/span>\s*<span[^>]*>1<\/span>|De onde vêm[\s\S]{0,80}>1</);
  });

  test("base vazia não quebra a tela nem divide por zero", async () => {
    painel.gravar("pessoas", painel.ler("pessoas").filter((p) => p.status !== "pendente"));
    const r = await painel.buscar("inscricoes", "aba=origens");

    assert.equal(r.status, 200);
    assert.match(r.html, /Ninguém se inscreveu ainda|De onde vem a militância/);
  });
});
