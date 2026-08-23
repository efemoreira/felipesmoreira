import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a ficha de pessoa — cadastrar, dar conta, juntar duplicata, apagar.
 *
 * Nada aqui é reversível de graça, e as travas são todas do mesmo tipo: elas
 * impedem um clique de destruir o que ninguém consegue reconstruir depois.
 *
 * - **Juntar não sobrescreve o que já está preenchido**: quem escolheu manter
 *   aquela ficha decidiu que ela é a boa.
 * - **Duas contas de painel nunca se fundem**: qual login sobrevive não é
 *   decisão que se toma por inferência.
 * - **O último administrador não se apaga nem se rebaixa**: fazer isso tranca
 *   todo mundo para fora de criar conta e mexer em permissão.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const MARIA = "pes00000000teste";

describe("ação: cadastrar e corrigir pessoa", () => {
  test("cadastra, e a cidade sai do catálogo e não do que foi digitado", async () => {
    const r = await painel.postar("pessoas", {
      acao: "salvar",
      nome: "João Pedro de Sousa",
      tipo: "militante",
      telefone: "(85) 98888-7777",
      cidade: "Juazeiro do Norte",
      bairro: "Centro",
    });

    assert.equal(r.status, 302);
    const joao = painel.ler("pessoas").find((p) => p.nome === "João Pedro de Sousa");
    assert.ok(joao, "não gravou");
    assert.equal(joao.cidade, "Juazeiro do Norte");
    assert.match(r.location, new RegExp(`\\?p=${joao.id}$`), "a ficha nova tem de abrir depois");
  });

  test("cidade inventada não entra na ficha", async () => {
    await painel.postar("pessoas", {
      acao: "salvar",
      nome: "Alguém de Marte",
      tipo: "eleitor",
      cidade: "Cidade Que Não Existe",
    });

    const p = painel.ler("pessoas").find((x) => x.nome === "Alguém de Marte");
    assert.notEqual(p.cidade, "Cidade Que Não Existe");
  });

  test("sem nome não cadastra — é o mínimo para chamar alguém de alguma coisa", async () => {
    const antes = painel.ler("pessoas").length;
    const r = await painel.postar("pessoas", { acao: "salvar", nome: "   ", tipo: "eleitor" });

    assert.match(r.html, /nome é o mínimo/i);
    assert.equal(painel.ler("pessoas").length, antes);
  });

  test("corrigir a ficha não cria uma segunda", async () => {
    const antes = painel.ler("pessoas").length;
    await painel.postar("pessoas", {
      acao: "salvar",
      id: MARIA,
      nome: "Maria da Silva Sauro",
      tipo: "militante",
      telefone: "85999990000",
      cidade: "Fortaleza",
      bairro: "Parangaba",
    });

    assert.equal(painel.ler("pessoas").length, antes);
    assert.equal(painel.ler("pessoas").find((p) => p.id === MARIA).bairro, "Parangaba");
  });
});

describe("ação: dar conta do painel", () => {
  test("cria o login com senha provisória de verdade", async () => {
    const r = await painel.postar("pessoas", { acao: "dar-conta", id: MARIA, usuario: "maria" });

    const maria = painel.ler("pessoas").find((p) => p.id === MARIA);
    assert.equal(maria.usuario, "maria");
    assert.equal(maria.trocarSenha, true, "sem isso a provisória vira definitiva");
    assert.equal(maria.status, "aprovada", "dar conta a quem estava pendente aprova junto");
    assert.match(r.html, /Conta criada/);
  });

  test("login com arroba é recusado — texto com arroba nunca é login", async () => {
    const r = await painel.postar("pessoas", {
      acao: "dar-conta",
      id: MARIA,
      usuario: "maria@exemplo.com",
    });

    assert.equal(painel.ler("pessoas").find((p) => p.id === MARIA).usuario ?? "", "");
    assert.doesNotMatch(r.html, /Conta criada/);
  });

  test("login já em uso não abre uma segunda porta para a mesma chave", async () => {
    const r = await painel.postar("pessoas", { acao: "dar-conta", id: MARIA, usuario: "teste" });

    assert.match(r.html, /já está em uso/);
    assert.equal(painel.ler("pessoas").find((p) => p.id === MARIA).usuario ?? "", "");
  });
});

describe("ação: o último administrador", () => {
  test("não se rebaixa sozinho", async () => {
    const r = await painel.postar("pessoas", {
      acao: "salvar",
      id: ADMIN,
      nome: "Coordenação de Teste",
      tipo: "coordenador",
      capacidades: ["comunicacao"], // tirou o `adm`
    });

    assert.match(r.html, /único administrador/i);
    const eu = painel.ler("pessoas").find((p) => p.id === ADMIN);
    assert.ok(eu.capacidades.includes("adm"), "o painel ficou sem administrador nenhum");
  });

  test("não se apaga", async () => {
    const r = await painel.postar("pessoas", { acao: "apagar", id: ADMIN });

    assert.match(r.html, /único administrador/i);
    assert.ok(painel.ler("pessoas").some((p) => p.id === ADMIN));
  });

  test("não se desativa", async () => {
    const r = await painel.postar("pessoas", { acao: "ativar", id: ADMIN });

    assert.match(r.html, /único administrador/i);
    assert.equal(painel.ler("pessoas").find((p) => p.id === ADMIN).ativo, true);
  });
});

describe("ação: apagar pessoa", () => {
  test("as presenças dela vão junto", async () => {
    const r = await painel.postar("pessoas", { acao: "apagar", id: MARIA });

    assert.equal(painel.ler("pessoas").some((p) => p.id === MARIA), false);
    assert.equal(
      painel.ler("presencas").length,
      0,
      "presença de quem não existe mais é linha que só atrapalha a contagem",
    );
    assert.match(r.html, /apagada/);
  });
});

describe("ação: juntar duplicata", () => {
  /** Cadastra uma segunda ficha do mesmo telefone e devolve o id dela. */
  async function duplicar(campos: Record<string, string> = {}): Promise<string> {
    await painel.postar("pessoas", {
      acao: "salvar",
      nome: "Maria da Silva Sauro",
      tipo: "eleitor",
      telefone: "85999990000",
      ...campos,
    });
    const nova = painel
      .ler("pessoas")
      .filter((p) => p.nome === "Maria da Silva Sauro" && p.id !== MARIA);
    assert.equal(nova.length, 1, "a duplicata de apoio não foi criada");
    return nova[0].id;
  }

  test("o vazio de quem fica é preenchido, e o preenchido não é sobrescrito", async () => {
    const sumir = await duplicar({ email: "maria@exemplo.com", bairro: "Messejana" });

    const r = await painel.postar("pessoas", { acao: "juntar", id: MARIA, sumir });

    assert.match(r.html, /juntadas/i);
    const maria = painel.ler("pessoas").find((p) => p.id === MARIA);
    assert.equal(maria.email, "maria@exemplo.com", "o campo vazio tinha de ser preenchido");
    assert.equal(maria.bairro, "Benfica", "o campo preenchido foi sobrescrito");
    assert.equal(painel.ler("pessoas").some((p) => p.id === sumir), false);
  });

  test("as presenças mudam de dono em vez de sumir", async () => {
    const sumir = await duplicar();
    await painel.postar("pessoas", { acao: "juntar", id: sumir, sumir: MARIA });

    const presencas = painel.ler("presencas");
    assert.equal(presencas.length, 1, "a presença sumiu na fusão");
    assert.equal(presencas[0].pessoaId, sumir, "a presença não mudou de dono");
  });

  test("duas contas de painel nunca se fundem", async () => {
    const sumir = await duplicar();
    await painel.postar("pessoas", { acao: "dar-conta", id: MARIA, usuario: "maria" });
    await painel.postar("pessoas", { acao: "dar-conta", id: sumir, usuario: "maria2" });

    const r = await painel.postar("pessoas", { acao: "juntar", id: MARIA, sumir });

    assert.match(r.html, /Duas contas de painel nunca se fundem/);
    assert.ok(painel.ler("pessoas").some((p) => p.id === sumir), "uma das contas foi apagada");
  });
});
