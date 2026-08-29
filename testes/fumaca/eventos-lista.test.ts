import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";
import { diaDe } from "../../src/features/programacao/tempo.ts";

/**
 * FUMAÇA: as duas listas de encontros na mesma tela, e o teto que permite isso.
 *
 * Próximos e "já aconteceram" ficam uma em cima da outra — quem abre a tela lê
 * as duas de cima para baixo, sem trocar de aba para descobrir de que lado está
 * o encontro que procura.
 *
 * O QUE ESTE TESTE PRENDE É O PREÇO DISSO. A lista de baixo cresce a cada
 * encontro realizado e nunca encolhe; desenhada inteira, ela empurra os
 * próximos — que são o trabalho — para fora da tela dentro de uma campanha. O
 * teto de quinze é o que segura a de cima no lugar, e a busca é o caminho para
 * o que ficou de fora. Sem teste, o teto é a primeira coisa que some numa
 * refatoração, e o defeito aparece meses depois como "a tela ficou lenta".
 */

const FUSO = "-03:00";
const dia = (n: number) => `2026-${String(n).padStart(2, "0")}-10T19:00:00${FUSO}`;

let painel: Sandbox;
before(() => {
  painel = montarSandbox();

  const encontros = [];
  /* Três que ainda vão acontecer, num ano que o relógio do teste não alcança. */
  for (let i = 1; i <= 3; i++) {
    encontros.push({
      id: `ev-futuro-${i}`,
      titulo: `Encontro futuro ${i}`,
      familia: "militancia",
      inicio: `2099-0${i}-10T19:00:00${FUSO}`,
      local: "Praça do Benfica",
      status: "confirmado",
      criadoEm: "2026-01-01T10:00:00-03:00",
    });
  }
  /* Dezoito já realizados — três a mais que o teto, para o corte aparecer. */
  for (let i = 1; i <= 18; i++) {
    encontros.push({
      id: `ev-passado-${i}`,
      titulo: `Encontro antigo ${String(i).padStart(2, "0")}`,
      familia: "militancia",
      /* 2020: passado para qualquer relógio, e o índice ordena dentro dele. */
      inicio: dia(1).replace("2026", "2020").replace("-01-10", `-01-${String(i).padStart(2, "0")}`),
      local: "Sobral",
      status: "confirmado",
      criadoEm: "2020-01-01T10:00:00-03:00",
    });
  }
  /* Um encontro HOJE, no fuso do Ceará. A hora sai de `diaDe()` — a mesma
     função que o painel usa para recortar — e não de `new Date()` cru: quem
     roda o teste às 23h de outro fuso já está no dia seguinte, e o encontro
     "de hoje" nasceria fora de hoje. */
  encontros.push({
    id: "ev-hoje",
    titulo: "Mutirão de hoje no Montese",
    familia: "militancia",
    inicio: new Date(diaDe(new Date()).inicio.getTime() + 10 * 3_600_000).toISOString(),
    local: "Montese",
    status: "confirmado",
    criadoEm: "2026-01-01T10:00:00-03:00",
  });

  /* Um cancelado que ainda NÃO aconteceu — o caso que confundia as duas listas. */
  encontros.push({
    id: "ev-cancelado",
    titulo: "Encontro cancelado do Pirambu",
    familia: "militancia",
    inicio: `2099-06-10T19:00:00${FUSO}`,
    local: "Pirambu",
    status: "cancelado",
    criadoEm: "2026-01-01T10:00:00-03:00",
  });

  painel.gravar("eventos", encontros);
});
after(() => painel.fechar());

describe("fumaça: as duas listas de encontros, empilhadas", () => {
  test("as duas aparecem na mesma tela, com o contador inteiro de cada uma", () => {
    const { html, erros, status } = painel.abrir("eventos", "");

    assert.equal(status, 0, `o PHP saiu com ${status}:\n${erros}`);
    /* Quatro: os três confirmados mais o cancelado, que ainda não aconteceu. */
    assert.match(html, /Próximos \([45]\)/, "a lista dos próximos não foi desenhada");
    /* 18 ou 19: o encontro semeado para hoje às 10h já passou se o teste rodar
       à tarde, e então ele conta aqui em vez de nos próximos. */
    assert.match(html, /Já aconteceram \(1[89]\)/, "a lista dos realizados não foi desenhada");

    /* A ordem importa: o trabalho vem antes do arquivo. */
    assert.ok(
      html.indexOf("Próximos (") < html.indexOf("Já aconteceram ("),
      "o que já aconteceu ficou por cima do que ainda vai acontecer",
    );
  });

  test("o teto corta a lista de baixo, e diz que cortou", () => {
    const { html } = painel.abrir("eventos", "");

    /* O mais recente entra; o mais antigo fica de fora — e a linha do corte
       conta a verdade inteira, que é o que faz alguém procurar em vez de rolar. */
    assert.match(html, /Encontro antigo 18/, "o realizado mais recente ficou de fora");
    assert.doesNotMatch(html, /Encontro antigo 01/, "o teto não cortou nada");
    /* "de 18" ou "de 19": o encontro de hoje às 10h já passou se o teste rodar
       à tarde, e aí ele entra nesta lista. O que importa é o corte em 15 e o
       total dito por inteiro. */
    assert.match(html, /Mostrando os 15 mais recentes de 1[89]/);
  });

  test("a busca alcança o que o teto cortou, e recorta as duas listas", () => {
    const { html } = painel.abrir("eventos", "q=Encontro+antigo+01");

    assert.match(html, /Encontro antigo 01/, "a busca não alcança o que ficou fora do teto");
    assert.match(html, /Próximos \(0\)/, "a busca não recortou a lista de cima");
    assert.match(html, /Já aconteceram \(1 de 23\)/, "o contador da busca não diz de quantos");
  });
});

describe("o recorte de período segue o relógio", () => {
  /**
   * "Hoje" e "esta semana" saem de `dia_de()` e `semana_de()`, que têm par em
   * TypeScript e são as mesmas janelas que o site usa em /programacao. O que
   * este teste prende é que o recorte REALMENTE recorta: um filtro que não
   * filtra nada continua desenhando a tela inteira e passa despercebido.
   */
  test("“hoje” deixa só o encontro de hoje, e o de 2099 fica de fora", () => {
    const { html, erros } = painel.abrir("eventos", "quando=hoje");

    assert.equal(erros.trim(), "", erros);
    assert.match(html, /Mutirão de hoje no Montese/, "o encontro de hoje sumiu do recorte de hoje");
    assert.doesNotMatch(html, /Encontro futuro 1/, "o recorte de hoje deixou passar 2099");
    assert.doesNotMatch(html, /Encontro antigo 18/, "o recorte de hoje deixou passar 2020");
  });

  test("“esta semana” também alcança o de hoje, e continua sem os outros", () => {
    const { html } = painel.abrir("eventos", "quando=semana");

    assert.match(html, /Mutirão de hoje no Montese/, "hoje não está nesta semana");
    assert.doesNotMatch(html, /Encontro futuro 1/);
  });

  test("sem recorte, a tela abre com tudo — é a mesa de trabalho", () => {
    /* O padrão importa: abrir escondendo o encontro do mês que vem esconderia
       trabalho de quem veio justamente preparar. */
    const { html } = painel.abrir("eventos", "");

    assert.match(html, /Mutirão de hoje no Montese/);
    assert.match(html, /Encontro futuro 1/);
    assert.match(html, /Encontro antigo 18/);
  });
});

describe("cancelado não é sinônimo de já aconteceu", () => {
  /**
   * Um encontro cancelado para daqui a dois meses NÃO aconteceu — ele não vai
   * acontecer, que é diferente. Enquanto "cancelado" contava como "passado",
   * ele ia parar embaixo de "Já aconteceram", que é uma afirmação falsa sobre
   * uma data que nem chegou, e sumia de onde a coordenação iria procurá-lo para
   * remarcar.
   */
  test("o cancelado que ainda não aconteceu fica na lista de cima, marcado", () => {
    const { html } = painel.abrir("eventos", "");

    const cima = html.slice(html.indexOf("Próximos ("), html.indexOf("Já aconteceram ("));
    assert.match(cima, /Encontro cancelado do Pirambu/, "o cancelado futuro caiu na lista errada");
    assert.match(cima, /CANCELADO/, "o cartão não diz que o encontro está cancelado");
  });

  test("mas o hub não o anuncia como o próximo encontro do movimento", () => {
    /* A outra metade da regra: a tela pergunta "o que existe", o hub pergunta
       "para onde eu vou". Anunciar um encontro cancelado como o próximo é
       mandar gente para uma praça vazia. */
    const { html } = painel.abrir("index", "");

    /* Só o bloco "Próximos encontros": mais abaixo, a linha do tempo do hub
       cita o encontro cancelado como o que andou acontecendo — e ali ele deve
       aparecer mesmo. O que não pode é ser anunciado como para onde ir. */
    const bloco = html.slice(
      html.indexOf("Próximos encontros"),
      html.indexOf("Sua formação"),
    );
    assert.doesNotMatch(bloco, /Encontro cancelado do Pirambu/);
    assert.match(bloco, /Encontro futuro 1/, "o hub perdeu o próximo encontro de verdade");
  });
});
