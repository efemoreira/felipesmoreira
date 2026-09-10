import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a fila de entrada — aprovar e recusar quem se inscreveu.
 *
 * A regra que este arquivo existe para prender é a do CLAUDE.md: **aprovar dá
 * conta à ficha que já está lá, e não cria uma segunda**. Antes a inscrição
 * virava um usuário novo e a inscrição ficava para trás, então a mesma pessoa
 * passava a existir duas vezes e o histórico de encontros dela ficava preso na
 * ficha antiga. É o tipo de regressão que nenhuma tela denuncia: as duas fichas
 * existem, e as duas parecem certas.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/** A pessoa semeada, que entra na fila com `status = 'pendente'`. */
const NA_FILA = "pes00000000teste";

describe("ação: aprovar inscrição", () => {
  test("dá conta à ficha que já existe — não cria uma segunda pessoa", async () => {
    const antes = painel.ler("pessoas").length;

    const r = await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "maria",
      capacidades: ["comunicacao"],
    });

    assert.equal(r.status, 302);
    const pessoas = painel.ler("pessoas");
    assert.equal(pessoas.length, antes, "a aprovação criou uma segunda ficha");

    const maria = pessoas.find((p) => p.id === NA_FILA);
    assert.equal(maria.usuario, "maria");
    assert.equal(maria.status, "aprovada");
    assert.equal(maria.ativo, true);
    assert.equal(maria.trocarSenha, true, "a senha provisória tem de ser provisória");
    assert.ok(maria.hash, "aprovar sem hash é conta que não abre");
  });

  test("a senha provisória aparece UMA vez, na tela seguinte", async () => {
    const r = await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "maria",
    });

    assert.match(r.html, /Acesso criado para Maria da Silva Sauro/);

    /* Uma vez, e só uma: `$_SESSION['acesso_novo']` some assim que é desenhado.
       Senha provisória que fica na tela é senha que alguém lê por cima do ombro
       na segunda vez que a página é aberta. */
    const denovo = await painel.buscar("inscricoes");
    assert.doesNotMatch(denovo.html, /Acesso criado para/);
  });

  test("sem função marcada, a aprovação assume “onde-precisar”", async () => {
    /* O servidor aceita inscrição sem função de propósito — quem exige é a
       tela. Deixar o array vazio faria o hub não ter atalho nenhum. */
    await painel.postar("inscricoes", { acao: "aprovar", id: NA_FILA, usuario: "maria" });

    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.deepEqual(maria.funcoes, ["onde-precisar"]);
  });

  test("a capacidade de coordenação muda o tipo da pessoa", async () => {
    await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "maria",
      capacidades: ["coordenacao"],
    });

    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.tipo, "coordenador");
  });

  test("login repetido é recusado, e a pessoa continua na fila", async () => {
    const r = await painel.postar("inscricoes", {
      acao: "aprovar",
      id: NA_FILA,
      usuario: "teste", // já é o login da coordenação semeada
    });

    assert.match(r.html, /Já existe alguém com o login/);
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.status, "pendente", "recusada a aprovação, a ficha não pode ter mudado");
    assert.equal(maria.usuario ?? "", "");
  });

  test("decidir duas vezes não decide duas vezes", async () => {
    await painel.postar("inscricoes", { acao: "aprovar", id: NA_FILA, usuario: "maria" });
    const r = await painel.postar("inscricoes", { acao: "aprovar", id: NA_FILA, usuario: "maria2" });

    assert.match(r.html, /já foi decidida/);
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.usuario, "maria", "o segundo POST reescreveu o login");
  });
});

describe("ação: recusar inscrição", () => {
  test("a pessoa NÃO é apagada — sai da fila e fica na lista", async () => {
    const r = await painel.postar("inscricoes", { acao: "recusar", id: NA_FILA });

    assert.match(r.html, /recusada/i);
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.ok(maria, "recusar apagou a pessoa — e a presença dela em encontro iria junto");
    assert.equal(maria.status, "recusada");
    assert.ok(maria.decididoPor, "quem decidiu tem de ficar registrado");
  });

  test("recusar não tira a presença dela no encontro", async () => {
    await painel.postar("inscricoes", { acao: "recusar", id: NA_FILA });
    assert.equal(painel.ler("presencas").length, 1);
  });
});

describe("ação: a sessão expirada", () => {
  test("POST sem CSRF não grava nada e derruba a sessão", async () => {
    const r = await painel.postar("inscricoes", { acao: "recusar", id: NA_FILA, csrf: "" });

    assert.equal(r.location, "/painel/", "sem CSRF a ação tem de cair na porta");
    const maria = painel.ler("pessoas").find((p) => p.id === NA_FILA);
    assert.equal(maria.status, "pendente", "a ação rodou apesar do CSRF inválido");
  });
});

/**
 * CONVIDAR A FILA PARA UM ENCONTRO.
 *
 * A fila já tinha o telefone e já desenhava o botão do WhatsApp — **sem texto
 * nenhum**, abrindo conversa vazia. Com setenta e duas pessoas esperando,
 * "escrever a mensagem" era o trabalho que não acontecia, e a fila envelhecia.
 *
 * Duas regras deste bloco não se veem lendo a tela:
 *
 * 1. **O link é o do ENCONTRO, não o do /queroajudar.** Quem abre `/presenca?c=…`
 *    confirma presença naquele encontro, e a tela oferece a inscrição depois, já
 *    com a origem preenchida. Foi essa diferença que custou o vínculo de 59
 *    pessoas que vieram de um evento por um QR apontando para o formulário puro.
 * 2. **A marca é separada do envio.** Redirecionar para o WhatsApp exigiria um
 *    `wa.me` montado na ação — um link só, e o link só não abre para quem tem a
 *    conta na outra grafia do nono dígito. Quem desenha o par é
 *    `links_whatsapp()`; esta ação só guarda quem já foi chamado.
 */
describe("ação: convidar a fila para um encontro", () => {
  const EVENTO = "ev-teste";

  /** Põe funções na pessoa da fila, que o seed cria sem nenhuma. */
  function comFuncoes(funcoes: string[]) {
    const p = painel.ler("pessoas").find((x) => x.id === NA_FILA)!;
    const outras = painel.ler("pessoas").filter((x) => x.id !== NA_FILA);
    painel.gravar("pessoas", [...outras, { ...p, funcoes }]);
  }

  test("sem encontro escolhido, o cartão não oferece convite", async () => {
    const { html } = await painel.buscar("inscricoes", "aba=fila");
    assert.doesNotMatch(html, /Abrir o convite no WhatsApp/);
  });

  test("escolhido o encontro, o convite vem com o link daquele encontro", async () => {
    const { html } = await painel.buscar("inscricoes", `aba=fila&e=${EVENTO}`);

    assert.match(html, /Abrir o convite no WhatsApp/);
    /* O `?c=` é o token de CONFIRMAÇÃO do encontro semeado. Se um dia isto
       virar o link de /queroajudar, as pessoas voltam a chegar soltas: sem
       presença, sem funil e sem origem. */
    assert.match(html, /\/presenca\?c=bbbbbbbb/);
  });

  test("a mensagem diz a função que a pessoa pediu", async () => {
    comFuncoes(["recepcao"]);
    const { html } = await painel.buscar("inscricoes", `aba=fila&e=${EVENTO}`);
    assert.match(html, /Você pediu para ajudar em Recep/);
  });

  test("“onde-precisar” não vira função na mensagem", async () => {
    /* Ele aparece em quase metade das inscrições, quase sempre junto de outra
       escolha — é "e também onde precisar", não uma função. Escrever "você
       pediu para ajudar em Onde precisar" devolveria à pessoa a própria
       indecisão como se fosse convite. */
    comFuncoes(["onde-precisar"]);
    const { html } = await painel.buscar("inscricoes", `aba=fila&e=${EVENTO}`);
    assert.doesNotMatch(html, /Você pediu para ajudar em/);
  });

  test("marcar grava em convidados, e a volta preserva o encontro escolhido", async () => {
    const r = await painel.postar("inscricoes", {
      acao: "convidar",
      id: NA_FILA,
      evento: EVENTO,
    });

    assert.equal(r.status, 302);
    assert.deepEqual(painel.ler("eventos")[0].convidados, [NA_FILA]);
    /* Sem o `?e=` na volta, convidar a segunda pessoa custaria reescolher o
       encontro — setenta e duas vezes. */
    assert.match(r.location, new RegExp(`aba=fila&e=${EVENTO}#p-${NA_FILA}`));
  });

  test("marcar de novo desmarca", async () => {
    await painel.postar("inscricoes", { acao: "convidar", id: NA_FILA, evento: EVENTO });
    await painel.postar("inscricoes", { acao: "convidar", id: NA_FILA, evento: EVENTO });

    /* Sem o caminho de volta, o número da legenda vira mentira na primeira vez
       que alguém convida por engano — e ninguém confia nele de novo. */
    assert.deepEqual(painel.ler("eventos")[0].convidados, []);
  });

  test("a mesma pessoa não entra duas vezes na lista", async () => {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{ ...e, convidados: [NA_FILA, NA_FILA] }]);
    assert.deepEqual(painel.ler("eventos")[0].convidados, [NA_FILA]);
  });

  test("encontro que não existe não grava nada", async () => {
    const r = await painel.postar("inscricoes", {
      acao: "convidar",
      id: NA_FILA,
      evento: "nao-existe",
    });

    assert.equal(r.status, 302);
    assert.deepEqual(painel.ler("eventos")[0].convidados, []);
  });
});

/**
 * APROVAR EM LOTE.
 *
 * Setenta e duas pessoas esperando, a mais antiga há dezesseis dias, e cada
 * aprovação custava abrir um `<details>`, conferir login, submeter e recarregar
 * a página. Setenta e duas recargas é o trabalho que não acontece — e quem
 * espera demais não volta.
 */
describe("ação: aprovar em lote", () => {
  /** Mais gente pendente na fila, para o lote ter o que aprovar. */
  function fila(nomes: string[]) {
    painel.gravar("pessoas", [
      ...painel.ler("pessoas"),
      ...nomes.map((nome, i) => ({
        id: `fila-${i}`,
        nome,
        telefone: `8598888000${i}`,
        tipo: "militante",
        status: "pendente",
        ativo: true,
        funcoes: ["recepcao"],
        criadoEm: "2026-03-01T10:00:00-03:00",
      })),
    ]);
  }

  test("o selo do menu conta as pessoas, não as linhas da fila", async () => {
    fila(["Ana Souza", "Bruno Lima"]);

    const { html } = await painel.buscar("index");
    /* Três esperando (a semeada e as duas de agora) viram UMA linha na fila do
       Início — "3 pessoas esperando decisão". O selo ao lado de "Inscrições"
       tem de dizer 3, e não 1: contar linhas fazia o menu mostrar "1" com a
       porta cheia, um número real respondendo à pergunta errada. O `</a>`
       proibido no meio prende o selo ao link certo. */
    assert.match(
      html,
      /inscricoes\.php"(?:(?!<\/a>)[\s\S])*?nav-selo" aria-label="3 esperando">3</,
      "o selo de Inscrições não mostra as 3 pessoas da fila",
    );
  });

  test("um POST cria as contas de todas as marcadas", async () => {
    fila(["Ana Souza", "Bruno Lima"]);

    const r = await painel.postar("inscricoes", {
      acao: "aprovar-lote",
      "ids[]": ["fila-0", "fila-1", NA_FILA],
    });

    assert.equal(r.status, 302);
    const aprovadas = painel.ler("pessoas").filter((p) => p.status === "aprovada");
    assert.equal(aprovadas.length, 4, "faltou gente aprovada (o seed já tem o admin)");
    for (const id of ["fila-0", "fila-1", NA_FILA]) {
      const p = painel.ler("pessoas").find((x) => x.id === id)!;
      assert.equal(p.status, "aprovada");
      assert.equal(p.tipo, "militante");
      assert.equal(p.trocarSenha, true, "a senha do lote nasceu definitiva");
      assert.deepEqual(p.capacidades, [], "o lote deu permissão de painel sem ninguém pedir");
    }
  });

  test("dois nomes iguais no mesmo lote recebem logins diferentes", async () => {
    /* `login_sugerido()` confere contra o arquivo GRAVADO: no mesmo lote, os
       dois recebiam `joao.silva` e o segundo sobrescrevia o login do primeiro —
       sem erro, sem aviso, e só se descobre quando alguém não entra. */
    fila(["João Silva", "João Silva"]);

    await painel.postar("inscricoes", { acao: "aprovar-lote", "ids[]": ["fila-0", "fila-1"] });

    const logins = painel.ler("pessoas")
      .filter((p) => p.id.startsWith("fila-"))
      .map((p) => p.usuario);
    assert.equal(new Set(logins).size, 2, `os dois ficaram com o mesmo login: ${logins}`);
  });

  test("ficha já decidida no meio do lote não derruba as outras", async () => {
    fila(["Ana Souza"]);
    const base = painel.ler("pessoas");
    painel.gravar("pessoas", base.map((p) =>
      p.id === NA_FILA ? { ...p, status: "recusada" } : p));

    const r = await painel.postar("inscricoes", {
      acao: "aprovar-lote",
      "ids[]": ["fila-0", NA_FILA],
    });

    /* Duas pessoas mexendo na fila ao mesmo tempo é o normal; abortar tudo
       faria a segunda perder o trabalho da primeira. */
    assert.equal(painel.ler("pessoas").find((p) => p.id === "fila-0")!.status, "aprovada");
    assert.equal(painel.ler("pessoas").find((p) => p.id === NA_FILA)!.status, "recusada");
    assert.match(r.html, /1 já tinham sido decididas|1 acesso criado/);
  });

  test("as senhas do lote aparecem juntas, uma vez, e somem", async () => {
    fila(["Ana Souza", "Bruno Lima"]);
    const r = await painel.postar("inscricoes", { acao: "aprovar-lote", "ids[]": ["fila-0", "fila-1"] });

    assert.match(r.html, /2 acessos criados/);
    assert.match(r.html, /Ana Souza/);
    assert.match(r.html, /Bruno Lima/);
    /* Senha que fica na tela é senha lida por cima do ombro na segunda vez. */
    const depois = await painel.buscar("inscricoes", "aba=fila");
    assert.doesNotMatch(depois.html, /senha:/);
  });

  test("a mensagem de acesso diz a função pedida e o próximo encontro", async () => {
    fila(["Ana Souza"]);
    const r = await painel.postar("inscricoes", { acao: "aprovar-lote", "ids[]": ["fila-0"] });

    /* Conta sem tarefa é conta que nunca é usada — o motivo `nao-entrou` do
       reativacao.php nascendo pronto, setenta e duas vezes. */
    assert.match(r.html, /Voc%C3%AA%20pediu%20para%20ajudar%20em%20%2ARecep/);
    assert.match(r.html, /pr%C3%B3ximo%20encontro/);
  });

  test("lote sem ninguém marcado não grava nada", async () => {
    const r = await painel.postar("inscricoes", { acao: "aprovar-lote" });
    assert.match(r.html, /Não marquei ninguém/);
    assert.equal(painel.ler("pessoas").find((p) => p.id === NA_FILA)!.status, "pendente");
  });
});
