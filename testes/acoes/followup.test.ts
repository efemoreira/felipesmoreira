import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * A FILA DE FOLLOW-UP DO MOVIMENTO INTEIRO — a mesa da função Follow-up.
 *
 * O funil já existia dentro de cada encontro. O que este arquivo prende é o que
 * mudou quando ele ganhou dono: a fila atravessa encontros, e quem trabalha
 * nela nunca escolheu um encontro para abrir.
 *
 * **A volta é metade da regra.** Marcar uma mensagem como feita e cair na tela
 * de um encontro que a pessoa não pediu para abrir transforma uma sessão de
 * vinte mensagens em vinte voltas ao menu. Sem teste, é o tipo de detalhe que
 * volta ao normal na primeira refatoração do `voltar()`.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function encontroHa(n: number, id: string, titulo: string) {
  return {
    id,
    titulo,
    familia: "militancia",
    inicio: diasAtras(n),
    local: "Benfica",
    status: "confirmado",
    criadoEm: "2026-01-01T10:00:00-03:00",
  };
}

/** Duas pessoas que compareceram a DOIS encontros diferentes, em degraus diferentes. */
function semearDoisEncontros(): void {
  painel.gravar("eventos", [
    encontroHa(1, "ev-ontem", "Roda de conversa no Pirambu"),
    encontroHa(9, "ev-semana", "Mutirão do Montese"),
  ]);
  painel.gravar("pessoas", [
    ...painel.ler("pessoas"),
    { id: "pes-a", nome: "Antônia Rocha", telefone: "85988880001", cidade: "Fortaleza",
      tipo: "eleitor", status: "", ativo: true, criadoEm: diasAtras(30) },
    { id: "pes-b", nome: "Benedito Lima", telefone: "85988880002", cidade: "Sobral",
      tipo: "eleitor", status: "", ativo: true, criadoEm: diasAtras(30) },
  ]);
  painel.gravar("presencas", [
    { id: "pr-a", eventoId: "ev-ontem", pessoaId: "pes-a", confirmou: true, compareceu: true },
    { id: "pr-b", eventoId: "ev-semana", pessoaId: "pes-b", confirmou: true, compareceu: true },
  ]);
}

/** Só o bloco da fila: a moldura do painel escreve nomes na lateral. */
function fila(): string {
  const html = painel.abrir("eventos", "aba=follow-up").html;
  const de = html.indexOf('id="funil"');
  assert.ok(de > 0, "a fila de follow-up não foi desenhada");
  return html.slice(de, html.indexOf("</fieldset>", de));
}

describe("follow-up: a fila atravessa os encontros", () => {
  test("gente de encontros diferentes aparece na mesma tela", () => {
    /* É a razão de a aba existir. Antes, responder “quem hoje?” custava abrir
       encontro por encontro até achar o que tinha vencido. */
    semearDoisEncontros();
    const html = fila();

    assert.match(html, /Antônia Rocha/);
    assert.match(html, /Benedito Lima/);
  });

  test("cada linha diz de que encontro a pessoa veio", () => {
    /* “Obrigado por ter vindo” é genérico; “obrigado por ter vindo ao Pirambu”
       é conversa. Sem o nome do encontro na linha, a mensagem não tem como
       citar o que a pessoa foi ver. */
    semearDoisEncontros();
    const html = fila();

    assert.match(html, /Roda de conversa no Pirambu/);
    assert.match(html, /Mutirão do Montese/);
  });

  test("agrupa por degrau, e não por encontro", () => {
    /* Antônia veio ontem (D+0 vencido); Benedito veio há nove dias (D+0 também,
       porque é o primeiro degrau em aberto). O agrupamento é o do texto da
       mensagem — quem escreve manda a mesma vinte vezes com o nome trocado. */
    semearDoisEncontros();
    const html = fila();

    assert.match(html, /Agradecer pelo nome e puxar conversa/);
  });

  test("quem já é da estrutura não entra na fila", () => {
    /* O funil existe para transformar visita em militante. Quem já virou
       militante saiu dele por ter chegado ao fim — vê-lo ali faria a lista
       cobrar um trabalho que já foi feito. */
    semearDoisEncontros();
    const pessoas = painel.ler("pessoas").map((p) =>
      p.id === "pes-a" ? { ...p, tipo: "militante" } : p,
    );
    painel.gravar("pessoas", pessoas);

    const html = fila();
    assert.doesNotMatch(html, /Antônia Rocha/);
    assert.match(html, /Benedito Lima/, "a fila esvaziou junto");
  });
});

describe("follow-up: marcar uma mensagem devolve para a fila", () => {
  test("marcar D+0 pela fila volta para a fila, e não para o encontro", async () => {
    semearDoisEncontros();

    const r = await painel.postar("eventos", {
      acao: "funil",
      id: "ev-ontem",
      lead: "pr-a",
      etapa: "d0",
      volta: "fila",
    });

    assert.equal(r.location, "/painel/eventos.php?aba=follow-up#funil");
    const marcada = painel.ler("presencas").find((l) => l.id === "pr-a");
    assert.notEqual(marcada.funil.d0, "", "a mensagem não ficou marcada como feita");
  });

  test("a mesma ação, vinda da tela do encontro, continua voltando para ela", () => {
    /* A fila não pode sequestrar a volta de quem estava trabalhando dentro de
       um encontro: `volta=fila` só existe no formulário da fila. */
    semearDoisEncontros();

    return painel
      .postar("eventos", { acao: "funil", id: "ev-ontem", lead: "pr-a", etapa: "d0" })
      .then((r) => {
        assert.equal(r.location, "/painel/eventos.php?e=ev-ontem&aba=funil#funil");
      });
  });
});

describe("follow-up: quem não coordena não vê", () => {
  test("sem a área de agenda, a aba não existe e o endereço cai nos próximos", () => {
    /* O follow-up é conversa com gente, e telefone é da coordenação. A aba
       some da barra; forçar o endereço na mão devolve a lista de encontros, e
       não uma tela vazia que pareça defeito. */
    semearDoisEncontros();
    painel.trocarCapacidades("comunicacao");

    const { html } = painel.abrir("eventos", "aba=follow-up");
    assert.doesNotMatch(html, /Antônia Rocha/);
    assert.doesNotMatch(html, /Follow-up<span>/, "a aba apareceu para quem não coordena");

    painel.trocarCapacidades("adm");
  });
});

describe("follow-up: o hub manda para a fila, e não para um encontro", () => {
  test("a tarefa do hub aponta para a fila inteira", () => {
    /* Mandar para o encontro do primeiro da fila era o melhor possível quando o
       follow-up só existia dentro de um encontro — e escondia as outras
       dezenove pessoas, que estavam em outros encontros. */
    semearDoisEncontros();

    const { html } = painel.abrir("index", "");
    assert.match(html, /Fazer o follow-up de 2 pessoas/);
    assert.match(html, /eventos\.php\?aba=follow-up#funil/);
    assert.doesNotMatch(html, /eventos\.php\?e=ev-ontem&amp;aba=funil/);
  });
});

/**
 * AS TRÊS MENSAGENS SAEM PRONTAS.
 *
 * O funil existe desde o começo e morria no primeiro degrau: de 25 pessoas que
 * compareceram, 10 receberam o agradecimento, 1 recebeu conteúdo e nenhuma foi
 * convidada de volta. O botão abria **conversa vazia** — e escrever a mensagem
 * do zero, uma por uma, vinte e cinco vezes, é o trabalho que não acontece.
 */
describe("follow-up: a mensagem vai pronta", () => {
  test("o D+0 cita o encontro pelo nome e não empurra ninguém para o grupo", () => {
    semearDoisEncontros();
    const html = fila();

    /* "Obrigado por ter vindo" é genérico; citar o encontro é conversa. */
    assert.match(html, /Roda%20de%20conversa%20no%20Pirambu/);
    /* E NÃO manda para o grupo: jogar quem acabou de aparecer num grupo de
       oitenta pessoas é a receita do "entrei e não me senti parte". A primeira
       mensagem é de gente para gente, e o que ela pede é resposta. */
    assert.doesNotMatch(html, /chat\.whatsapp\.com/);
    assert.match(html, /O%20que%20voc%C3%AA%20achou/);
  });

  /** Alguém que já recebeu D+0 e D+3: a fila só mostra o degrau vencido mais
      antigo de cada pessoa, então sem isto nunca se chega ao convite. */
  function jaNoD7() {
    painel.gravar("presencas", painel.ler("presencas").map((pr) =>
      pr.id === "pr-b" ? { ...pr, funil: { d0: diasAtras(8), d3: diasAtras(5), d7: "" } } : pr));
  }

  test("o D+7 leva o próximo encontro com data e link de confirmar", () => {
    semearDoisEncontros();
    /* Um encontro futuro, para o convite ter o que citar. */
    painel.gravar("eventos", [
      ...painel.ler("eventos"),
      {
        ...encontroHa(-14, "ev-vem", "Bandeiraço na Raquel de Queiroz"),
        tokenConfirmacao: "c".repeat(16),
      },
    ]);
    jaNoD7();
    const html = fila();

    assert.match(html, /Bandeira%C3%A7o%20na%20Raquel/, "o convite não citou o próximo encontro");
    /* Convite sem data e sem porta de entrada não é convite. */
    assert.match(html, /presenca%3Fc%3Dcccc/);
  });

  test("sem próximo encontro marcado, o D+7 não promete o que não existe", () => {
    semearDoisEncontros();
    jaNoD7();
    const html = fila();

    /* Dizer "aparece no próximo" sem data é o convite que ninguém atende — e é
       melhor a coordenação ler isto e ir marcar um encontro. */
    assert.match(html, /Ainda%20n%C3%A3o%20tenho%20a%20data/);
  });

  test("o botão de mandar é o dourado; marcar como feito vem depois", () => {
    semearDoisEncontros();
    const html = fila();

    /* Dois botões dourados na mesma linha não destacam nada, e o primeiro
       movimento é MANDAR. */
    assert.match(html, /class="btn btn-ouro"[^>]*href="https:\/\/wa\.me/);
    assert.match(html, /<button type="submit" class="btn">Marcar como feito/);
  });
});
