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

    assert.match(html, /Agradecer e chamar para o canal/);
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
