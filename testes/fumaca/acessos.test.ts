import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * QUEM ENXERGA NOME E TELEFONE — a regra de acesso a dado pessoal.
 *
 * A regra do movimento é curta: **só a administração e a coordenação leem nome
 * e telefone de gente**. O resto do painel trabalha sem isso.
 *
 * Ela não se prende sozinha, porque o vazamento aqui nunca tem cara de erro:
 * ninguém vê exceção, ninguém vê tela quebrada, e o teste de fumaça continua
 * verde — o que muda é que uma pessoa a mais passa a ler a agenda de telefones
 * do movimento. Foi assim que `pode_ver_telefone()` ficou meses sem travar
 * nada: ela perguntava `pode('agenda')`, e a capacidade Eventos concede
 * `agenda` junto com `eventos`, então todo mundo que a recebia caía do lado de
 * dentro. A trava existia, tinha comentário explicando, e não pegava ninguém.
 *
 * Por isso o teste é escrito do lado de fora: ele TROCA a capacidade da conta,
 * abre a tela e procura o telefone no HTML — do mesmo jeito que quem estivesse
 * logado o leria. Regra de permissão conferida lendo a função é regra
 * conferida no lugar errado.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => {
  painel.ressemear();
  painel.trocarCapacidades("adm");
});
after(() => painel.fechar());

const NOME = "Maria da Silva Sauro";
/** O número da semente, nas três grafias em que ele pode aparecer na tela. */
const TELEFONE = ["85999990000", "(85) 99999-0000", "wa.me/5585999990000"];

const mostraTelefone = (html: string) => TELEFONE.some((t) => html.includes(t));

describe("acesso: o telefone é da coordenação", () => {
  test("quem organiza encontro vê a lista, e o número sai encoberto", () => {
    painel.trocarCapacidades("eventos");
    const { html } = painel.abrir("eventos", "e=ev-teste&aba=pessoas");

    /* A lista continua servindo para o que ela existe: receber gente na porta.
       Tirar o nome daqui não protegeria ninguém e quebraria a Recepção. */
    assert.match(html, new RegExp(NOME), "quem coordena o encontro perdeu a lista de presença");

    assert.ok(
      !mostraTelefone(html),
      "a capacidade Eventos leu o telefone da lista de presença.\n" +
        "Organizar um encontro não dá a agenda de telefones do movimento.",
    );
    /* E o encoberto aparece no lugar, para a tela dizer que existe número —
       sem ele a coluna fica vazia e parece cadastro incompleto. */
    assert.match(html, /9••••-••00/, "o telefone sumiu em vez de aparecer encoberto");
  });

  test("a coordenação vê o número inteiro, com o link do WhatsApp", () => {
    painel.trocarCapacidades("coordenacao");
    const { html } = painel.abrir("eventos", "e=ev-teste&aba=pessoas");

    assert.ok(
      mostraTelefone(html),
      "a coordenação deixou de ver o telefone — o follow-up depois do encontro é dela",
    );
  });

  test("a administração vê o número inteiro", () => {
    const { html } = painel.abrir("eventos", "e=ev-teste&aba=pessoas");
    assert.ok(mostraTelefone(html), "a administração deixou de ver o telefone");
  });
});

describe("acesso: o nome inteiro não escorre pela linha do tempo", () => {
  test("quem tem só encontros lê o primeiro nome e a inicial", () => {
    painel.trocarCapacidades("eventos");
    const { html } = painel.abrir("index", "");

    /* Uma linha por presença, todos os encontros juntos: com o nome inteiro,
       rolar a página até o fim era ler o cadastro sem passar por Pessoas. */
    assert.doesNotMatch(
      html,
      new RegExp(NOME),
      "a linha do tempo entregou o nome inteiro para quem não abre Pessoas",
    );
    assert.match(html, /Maria S\./, "o recado perdeu o nome e deixou de dizer quem apareceu");
  });

  test("quem abre Pessoas continua lendo o nome inteiro", () => {
    const { html } = painel.abrir("index", "");
    assert.match(html, new RegExp(NOME), "a administração perdeu o nome na linha do tempo");
  });
});

describe("acesso: o seletor de responsável lista contas, não o cadastro", () => {
  test("quem nunca teve login não vira opção de <select>", () => {
    /* `pessoas_ativas()` filtrava só por `ativo`, que é `true` na ficha de quem
       foi cadastrada na porta de um encontro. O seletor de "quem responde por
       esta peça" virava um despejo do cadastro inteiro numa tela que não é
       sobre pessoas. */
    const { html } = painel.abrir("eventos", "e=ev-teste&aba=dados");

    assert.match(html, /<select id="resp-/, "a aba Dados perdeu os seletores de responsável");
    assert.doesNotMatch(
      html,
      new RegExp(`<option value="pes00000000teste"[^>]*>\\s*${NOME}`),
      "o seletor de responsável listou alguém que não tem conta no painel",
    );
    /* E continua listando quem tem conta — a trava recorta, não desliga. */
    assert.match(html, /Coordenação de Teste/, "o seletor deixou de listar quem tem conta");
  });
});

describe("acesso: a porta de primeiro acesso", () => {
  /**
   * A tela de "criar o primeiro administrador" não pergunta quem é ninguém:
   * ela aparece para qualquer visitante enquanto não houver nenhuma conta. Isso
   * é certo numa instalação nova e é uma porta da rua em qualquer outro caso —
   * e `ler_pessoas()` devolve `[]` calado quando o arquivo está sem permissão,
   * num disco cheio ou com o OPcache servindo versão velha.
   */
  test("cadastro sem contas, mas com arquivo no disco, NÃO abre a porta", () => {
    /* O cenário da falha de leitura: o arquivo existe, e nenhuma das fichas
       tem login. Antes isto bastava para a tela aparecer. */
    painel.gravar(
      "pessoas",
      painel.ler("pessoas").map((p) => ({ ...p, usuario: "", hash: "" })),
    );

    const { html } = painel.abrir("index", "");
    assert.doesNotMatch(
      html,
      /criar_admin/,
      "o painel ofereceu 'criar administrador' com o cadastro inteiro no disco",
    );
  });

  test("zerar Pessoas na Manutenção não deixa o painel sem dono", async () => {
    const r = await painel.postar("manutencao", {
      confirmacao: "ZERAR TUDO",
      "grupos[]": "pessoas",
    });

    assert.equal(r.status, 302);

    /* O cadastro foi apagado de verdade — menos a ficha de quem apagou. */
    const restantes = painel.ler("pessoas");
    assert.equal(restantes.length, 1, "sobrou mais gente do que a conta de quem zerou");
    assert.equal(restantes[0].id, ADMIN, "sobrou a ficha errada");
    assert.notEqual(restantes[0].hash, "", "a conta sobreviveu sem senha — ninguém entra mais");

    /* E é isso que mantém a porta fechada. */
    const { html } = painel.abrir("index", "");
    assert.doesNotMatch(html, /criar_admin/, "zerar a base reabriu o 'criar administrador'");
  });
});

describe("acesso: o login não conta quem existe", () => {
  test("senha errada em conta desativada responde o mesmo que login inexistente", async () => {
    painel.gravar(
      "pessoas",
      painel.ler("pessoas").map((p) => (p.id === ADMIN ? { ...p, ativo: false } : p)),
    );

    const desativada = await painel.postar("index", {
      acao: "entrar",
      usuario: "teste",
      senha: "senha-que-nao-e-a-dela",
    });
    const inexistente = await painel.postar("index", {
      acao: "entrar",
      usuario: "ninguem-com-esse-login",
      senha: "senha-que-nao-e-a-dela",
    });

    const recado = (html: string) =>
      /Esse acesso está desativado/.test(html) ? "desativada" : "generico";

    assert.equal(
      recado(desativada.html),
      recado(inexistente.html),
      "o login disse qual conta existe: 'desativado' saiu para senha errada, e isso é " +
        "um jeito de perguntar ao painel quais logins e e-mails estão cadastrados",
    );
  });
});
