import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * A LINHA DO TEMPO, e o que ela promete não fazer.
 *
 * Ela é DERIVADA dos carimbos que já existem — não há arquivo de log. As duas
 * coisas que precisam continuar valendo: ela mostra o que aconteceu de verdade,
 * e ela **recorta pela mesma permissão do resto do painel**. Uma timeline que
 * ignorasse `pode()` mostraria, num parágrafo de texto corrido, o nome de todo
 * mundo que entrou no cadastro — para quem não pode abrir o cadastro.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

const linhas = (html: string): string[] =>
  [...html.matchAll(/<ul class="tempo">([\s\S]*?)<\/ul>/g)]
    .flatMap((m) => [...m[1].matchAll(/<span class="tempo-texto">([\s\S]*?)<\/span>/g)])
    .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());

describe("linha do tempo: o hub", () => {
  test("mostra o que aconteceu, sem log por trás", () => {
    const texto = linhas(painel.abrir("index").html).join("\n");
    assert.match(texto, /entrou no cadastro/, "não derivou o cadastro da pessoa");
    assert.match(texto, /Marcou o encontro/, "não derivou a criação do encontro");
    assert.match(texto, /entrou na lista de/, "não derivou a presença");
    assert.match(texto, /Trouxe o fato/, "não derivou o fato");
    assert.match(texto, /card/, "não derivou o card do quadro");
  });

  test("o mais recente vem primeiro", () => {
    /* A semente põe o fato uma hora atrás e o resto em fevereiro. Se a ordem
       invertesse, o hub abriria mostrando o que aconteceu há seis meses. */
    const [primeira] = linhas(painel.abrir("index").html);
    assert.match(primeira, /Trouxe o fato/, `a primeira linha foi "${primeira}"`);
  });

  test("quem leu o QR aparece diferente de quem foi digitado", () => {
    /* A diferença conta na hora de saber se a mesa da Recepção está
       funcionando ou se alguém está digitando tudo à mão depois. */
    const texto = linhas(painel.abrir("index").html).join("\n");
    assert.match(texto, /entrou na lista de .* pelo QR/);
  });
});

describe("linha do tempo: a permissão recorta", () => {
  test("quem não abre Pessoas não vê quem entrou no cadastro", () => {
    painel.trocarCapacidades("eventos");
    try {
      const texto = linhas(painel.abrir("index").html).join("\n");
      assert.doesNotMatch(texto, /entrou no cadastro/, "a timeline vazou o cadastro");
      /* E continua mostrando o que essa pessoa PODE ver: recorta, não desliga. */
      assert.match(texto, /Marcou o encontro/, "quem tem eventos deixou de ver encontro");
    } finally {
      painel.trocarCapacidades("adm");
    }
  });

  test("sem área nenhuma o bloco simplesmente não aparece", () => {
    painel.trocarCapacidades("");
    try {
      const { html, status } = painel.abrir("index");
      assert.equal(status, 0);
      assert.equal(linhas(html).length, 0, "apareceu linha do tempo para quem não abre nada");
      assert.match(html, /<\/html>\s*$/, "a tela terminou no meio");
    } finally {
      painel.trocarCapacidades("adm");
    }
  });
});

describe("linha do tempo: a visão 360 da ficha", () => {
  test("recorta para a pessoa da ficha, e só", () => {
    const texto = linhas(painel.abrir("pessoas", "p=pes00000000teste").html);
    assert.ok(texto.length > 0, "a ficha não mostrou histórico nenhum");
    assert.ok(
      texto.every((l) => !/Coordenação de Teste/.test(l)),
      `entrou linha de outra pessoa: ${JSON.stringify(texto)}`,
    );
    assert.ok(
      texto.some((l) => /entrou na lista de/.test(l)),
      "a ficha não respondeu em que encontros ela esteve",
    );
  });

  test("não inventa autoria a partir de nome escrito à mão", () => {
    /* `criadoPor` do encontro e `checadoPor` do fato guardam NOME, não id.
       Casar por nome poria a linha na ficha do homônimo — por isso essas duas
       ficam de fora do recorte por pessoa, de propósito. */
    const texto = linhas(painel.abrir("pessoas", "p=pes00000000teste").html).join("\n");
    assert.doesNotMatch(texto, /Marcou o encontro/, "atribuiu a criação do encontro por nome");
  });
});
