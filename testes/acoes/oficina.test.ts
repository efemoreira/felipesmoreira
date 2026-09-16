import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * A Oficina em uso: andar com o formato da vez, adiar sem travar, anotar
 * número — e, o mais importante, a linha de cada um ser só dela.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => {
  painel.ressemear();
  painel.gravar("oficina", []);
});
after(() => painel.fechar());

/** O primeiro formato da fila num catálogo zerado é a Tela Dividida. */
const PRIMEIRO = "tela-dividida";
const SEGUNDO = "tela-verde";

describe("oficina: o formato da vez anda em três passos", () => {
  test("gravei cria a tentativa; publiquei fecha e traz o próximo", async () => {
    await painel.postar("oficina", { acao: "passo", formato: PRIMEIRO, para: "gravado" });
    const depoisDeGravar = painel.ler("oficina");
    assert.equal(depoisDeGravar.length, 1);
    assert.equal(depoisDeGravar[0].estado, "gravado");
    assert.equal(depoisDeGravar[0].pessoa, ADMIN);

    const r = await painel.postar("oficina", {
      acao: "passo", formato: PRIMEIRO, para: "publicado",
      tema: "por que o transporte não melhora", gancho: "diagnostico",
      link: "https://instagram.com/reel/abc",
    });
    const publicada = painel.ler("oficina");
    assert.equal(publicada.length, 1, "publicar não pode abrir uma segunda tentativa");
    assert.equal(publicada[0].estado, "publicado");
    assert.equal(publicada[0].tema, "por que o transporte não melhora");
    assert.match(publicada[0].publicadoEm, /^\d{4}-\d{2}-\d{2}$/);
    /* A tela seguinte já oferece o próximo da fila — é o que sustenta o ritmo. */
    assert.match(r.html, /Tela Verde/);
  });

  test("publicar sem dizer do que era o vídeo não grava", async () => {
    const r = await painel.postar("oficina", { acao: "passo", formato: PRIMEIRO, para: "publicado", tema: "" });
    assert.match(r.html, /Diga do que era o vídeo/);
    assert.equal(painel.ler("oficina").length, 0);
  });

  test("formato fora do catálogo não entra", async () => {
    const r = await painel.postar("oficina", { acao: "passo", formato: "formato-inventado", para: "gravado" });
    assert.match(r.html, /não está no catálogo/);
    assert.equal(painel.ler("oficina").length, 0);
  });
});

describe("oficina: fica pra depois manda pro fim, e não tranca", () => {
  test("adiar tira o formato da vez e traz o seguinte", async () => {
    const r = await painel.postar("oficina", { acao: "adiar", formato: PRIMEIRO });
    const guardado = painel.ler("oficina");
    assert.equal(guardado.length, 1);
    assert.notEqual(guardado[0].adiadoEm, "", "adiar sem carimbo não empurra nada");
    assert.equal(guardado[0].estado, "aberto");
    assert.match(r.html, /Tela Verde/, "o próximo da fila tem de assumir na hora");
  });

  test("o adiado volta para a fila, e não desaparece do catálogo", async () => {
    await painel.postar("oficina", { acao: "adiar", formato: PRIMEIRO });
    await painel.postar("oficina", { acao: "retomar", formato: PRIMEIRO });
    assert.equal(painel.ler("oficina")[0].adiadoEm, "");
    const { html } = painel.abrir("oficina", "");
    assert.match(html, /Tela Dividida/, "retomado, ele volta a ser o da vez");
  });

  test("gravar desfaz o adiamento — quem gravou não está deixando para depois", async () => {
    await painel.postar("oficina", { acao: "adiar", formato: PRIMEIRO });
    await painel.postar("oficina", { acao: "passo", formato: PRIMEIRO, para: "gravado" });
    const guardado = painel.ler("oficina");
    assert.equal(guardado.length, 1, "não pode nascer uma segunda tentativa do mesmo formato");
    assert.equal(guardado[0].adiadoEm, "");
  });
});

describe("oficina: medir é a outra metade", () => {
  test("os números entram, e campo em branco não vira zero", async () => {
    await painel.postar("oficina", {
      acao: "passo", formato: PRIMEIRO, para: "publicado", tema: "sardinha frita no benfica",
    });
    const id = painel.ler("oficina")[0].id;

    await painel.postar("oficina", {
      acao: "numeros", id, views: "4200", retencao: "38", salvamentos: "90",
      comentarios: "", seguidores: "12", nota: "o gancho demorou",
    });
    const t = painel.ler("oficina")[0];
    assert.equal(t.views, 4200);
    assert.equal(t.retencao, 38);
    assert.equal(t.seguidores, 12);
    assert.equal(t.nota, "o gancho demorou");

    /* Voltar para corrigir só a retenção não pode zerar o resto. */
    await painel.postar("oficina", { acao: "numeros", id, retencao: "45" });
    const depois = painel.ler("oficina")[0];
    assert.equal(depois.retencao, 45);
    assert.equal(depois.views, 4200, "campo em branco apagou uma medida que já existia");
  });

  test("retenção acima de 100 é erro de digitação, e não passa", async () => {
    await painel.postar("oficina", { acao: "passo", formato: PRIMEIRO, para: "publicado", tema: "sardinha frita no benfica" });
    const id = painel.ler("oficina")[0].id;
    await painel.postar("oficina", { acao: "numeros", id, retencao: "980" });
    assert.equal(painel.ler("oficina")[0].retencao, 100);
  });

  test("apagar deixa a lápide, e o registro sai das médias", async () => {
    await painel.postar("oficina", { acao: "passo", formato: PRIMEIRO, para: "publicado", tema: "sardinha frita no benfica" });
    const id = painel.ler("oficina")[0].id;
    await painel.postar("oficina", { acao: "apagar", id, motivo: "era teste" });

    /* A LÁPIDE FICA NO ARQUIVO — `ler()` lê o disco cru, e é ali que ela mora.
       O que some é o registro de toda leitura do painel e de toda média. */
    const noDisco = painel.ler("oficina");
    assert.equal(noDisco.length, 1);
    assert.notEqual(noDisco[0].apagadoEm, "", "apagar sem lápide é apagar com array_filter");
    assert.equal(noDisco[0].apagadoMotivo, "era teste");

    const { html } = painel.abrir("oficina", "aba=numeros");
    assert.doesNotMatch(html, /sardinha frita/, "o apagado continua na tela");
  });
});

describe("oficina: cada um tem a sua, e ninguém vê a de ninguém", () => {
  const DE_OUTRO = "outra0000000teste";

  test("a tentativa de outra pessoa não aparece na minha oficina", async () => {
    painel.gravar("oficina", [
      {
        id: "aaaa0000", pessoa: ADMIN, formato: PRIMEIRO, estado: "publicado",
        tema: "o meu video", publicadoEm: "2026-09-10", views: 100, retencao: 30,
      },
      {
        id: "bbbb0000", pessoa: DE_OUTRO, formato: SEGUNDO, estado: "publicado",
        tema: "o video da outra pessoa", publicadoEm: "2026-09-11", views: 999, retencao: 90,
      },
    ]);

    const { html } = painel.abrir("oficina", "aba=numeros");
    assert.match(html, /o meu video/);
    assert.doesNotMatch(html, /o video da outra pessoa/, "a oficina de outra pessoa vazou para a minha");
    assert.doesNotMatch(html, /90%/, "a média de outra pessoa entrou no meu desempenho");
  });

  test("uma ação minha não pode tocar na linha de outro", async () => {
    painel.gravar("oficina", [
      { id: "bbbb0000", pessoa: DE_OUTRO, formato: SEGUNDO, estado: "publicado", tema: "o video da outra pessoa" },
    ]);
    const r = await painel.postar("oficina", { acao: "numeros", id: "bbbb0000", views: "5" });
    assert.match(r.html, /não encontrado na sua oficina/);
    assert.equal(painel.ler("oficina").find((t) => t.id === "bbbb0000").views, 0);
  });

  test("gravar a minha oficina devolve a dos outros intacta", async () => {
    painel.gravar("oficina", [
      { id: "bbbb0000", pessoa: DE_OUTRO, formato: SEGUNDO, estado: "gravado", tema: "da outra pessoa" },
    ]);
    await painel.postar("oficina", { acao: "passo", formato: PRIMEIRO, para: "gravado" });
    const tudo = painel.ler("oficina");
    assert.equal(tudo.length, 2);
    assert.ok(tudo.some((t) => t.pessoa === DE_OUTRO && t.estado === "gravado"));
  });
});

describe("oficina: quem concede é a administração", () => {
  test("a capacidade Criação abre a Oficina, e só ela", async () => {
    painel.trocarCapacidades("criacao");
    const r = await painel.buscar("oficina", "");
    assert.equal(r.status, 200);
    /* E não abre mais nada: a capacidade existe para conceder uma tela só. */
    const caixa = await painel.buscar("caixa", "");
    assert.equal(caixa.status, 302);
  });

  test("quem só cuida da comunicação não abre a Oficina", async () => {
    painel.trocarCapacidades("comunicacao");
    const r = await painel.buscar("oficina", "");
    assert.equal(r.status, 302);
    assert.match(r.location, /negado=oficina/);
  });

  test("sem token, a ação derruba a sessão e não grava", async () => {
    const r = await painel.postar("oficina", { acao: "passo", formato: PRIMEIRO, para: "gravado", csrf: "" });
    assert.equal(r.status, 302);
    assert.equal(painel.ler("oficina").length, 0);
  });

  test("ação desconhecida vira recado, e nada muda", async () => {
    const r = await painel.postar("oficina", { acao: "qualquer" });
    assert.match(r.html, /Ação desconhecida/);
    assert.equal(painel.ler("oficina").length, 0);
  });
});
