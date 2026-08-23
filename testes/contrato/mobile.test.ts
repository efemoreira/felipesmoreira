import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * TABELA DO PAINEL ↔ CARTÃO NO CELULAR.
 *
 * O painel é usado na porta do encontro, em pé, com o celular numa mão. Uma
 * tabela de seis colunas ali não é uma tabela apertada: é um botão que ninguém
 * encontra, porque ele está a um arrastão de distância à direita e nada na
 * tela diz que ele existe.
 *
 * A regra é uma só e vale para toda tabela do painel: ela mora dentro de
 * `<div class="rolagem cartoes">`. `.rolagem` segura o desktop; `.cartoes`
 * desmonta a tabela em cartões abaixo de 700px, com o `data-rotulo` de cada
 * `<td>` no lugar do cabeçalho que sumiu.
 *
 * **Este teste existe para a PRÓXIMA tabela.** As treze de hoje já estão
 * convertidas; o que se perde sem um teste é a tabela número catorze, escrita
 * daqui a três meses copiando a linha errada de uma tela antiga — e que só vai
 * ser descoberta por alguém xingando o telefone numa noite de encontro.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PAINEL = path.join(RAIZ, "public/painel");
const ler = (p: string) => readFileSync(path.join(PAINEL, p), "utf8");

const TELAS = readdirSync(PAINEL).filter((f) => f.endsWith(".php"));

describe("celular: a tabela do painel vira cartão", () => {
  test("toda <table class=\"tabela\"> está dentro de um .rolagem.cartoes", () => {
    const soltas: string[] = [];

    for (const arquivo of TELAS) {
      const html = ler(arquivo);
      const pedacos = html.split('<table class="tabela">');
      /* O primeiro pedaço é o que vem antes da primeira tabela; a partir do
         segundo, cada um foi precedido por uma abertura de tabela. */
      pedacos.slice(0, -1).forEach((antes, i) => {
        if (!/class="rolagem cartoes"/.test(antes.slice(-400))) {
          soltas.push(`${arquivo} (tabela ${i + 1})`);
        }
      });
    }

    assert.deepEqual(
      soltas,
      [],
      "estas tabelas não viram cartão no celular — no telefone elas só ganham uma " +
        "barra para arrastar, e a coluna de ações fica fora da tela:\n  " +
        soltas.join("\n  "),
    );
  });

  test("nenhuma tabela do painel ficou só com a barra de arrastar", () => {
    const soh = TELAS.filter((f) => /class="rolagem"/.test(ler(f)));

    assert.deepEqual(
      soh,
      [],
      '`class="rolagem"` sozinha é a rolagem de sobrevivência que a auditoria ' +
        "mobile veio desfazer — falta o `cartoes` ao lado",
    );
  });

  test("o CSS que desmonta a tabela continua no lugar", () => {
    const css = readFileSync(path.join(PAINEL, "painel.css"), "utf8");

    /* Sem estas três, a classe `.cartoes` espalhada por onze telas não faz
       nada — e não fazer nada é exatamente o que ninguém percebe no desktop. */
    for (const regra of [
      /@media \(max-width:700px\)/,
      /\.cartoes thead \{ display:none; \}/,
      /\.cartoes td\[data-rotulo\]::before/,
    ]) {
      assert.match(css, regra, `a regra ${regra} sumiu do painel.css`);
    }
  });

  test("a célula que vira meio cartão sabe o rótulo dela", () => {
    /* `.meia` e `.terco` põem dois ou três blocos lado a lado. Sem o
       `data-rotulo` eles viram números soltos: no cartão não sobrou cabeçalho
       de coluna para dizer se aquele 12 é "chegaram" ou "militaram". */
    const semRotulo: string[] = [];

    for (const arquivo of TELAS) {
      for (const m of ler(arquivo).matchAll(/<td class="[^"]*\b(?:meia|terco)\b[^"]*"[^>]*>/g)) {
        if (!m[0].includes("data-rotulo=")) semRotulo.push(`${arquivo}: ${m[0]}`);
      }
    }

    assert.deepEqual(semRotulo, [], `célula pela metade sem rótulo:\n  ${semRotulo.join("\n  ")}`);
  });
});

/**
 * A COLUNA DE AÇÕES DA LINHA.
 *
 * Três botões lado a lado numa linha de lista são três decisões pedidas ao
 * mesmo tempo: no desktop a linha passa a ser lida pela coluna da direita, e no
 * cartão do celular o `.rodape` vira uma pilha maior que o dado que ela
 * acompanha. O padrão comum resolve com um alvo só — `menu_acoes()`, os três
 * pontinhos —, e este teste é para a lista que alguém escrever daqui a três
 * meses copiando a linha errada de uma tela antiga.
 */
describe("lista: as ações da linha moram atrás dos três pontinhos", () => {
  test("nenhuma célula de ações voltou a ter uma fileira de botões", () => {
    const cheias: string[] = [];

    for (const arquivo of TELAS) {
      const html = ler(arquivo);
      for (const pedaco of html.split('<div class="acoes-celula">').slice(1)) {
        const celula = pedaco.split("</div>")[0];
        /* Um botão visível é o teto: ele é a ação principal da linha ("Abrir"),
           e sozinho não compete com nada. Do segundo em diante é menu. */
        const botoes = celula.match(/class="btn btn-mini/g) ?? [];
        if (botoes.length > 1) cheias.push(`${arquivo} (${botoes.length} botões numa célula)`);
      }
    }

    assert.deepEqual(
      cheias,
      [],
      "estas células enfileiram botões em vez de usar `menu_acoes()`:\n  " + cheias.join("\n  "),
    );
  });

  test("o menu continua tendo CSS e script", () => {
    const css = readFileSync(path.join(PAINEL, "painel.css"), "utf8");
    const layout = ler("layout.php");

    /* Sem a caixa, o <details> abre um bloco solto no meio da célula; sem o
       script, ela sai recortada pela `.rolagem` da tabela — que é
       `overflow-x:auto`, e overflow num eixo recorta os dois. */
    assert.match(css, /\.menu-caixa \{/, "o desenho da caixa do menu sumiu do painel.css");
    assert.match(css, /\.menu-rotulo \{ position:static/, "no celular o menu voltou a ser três pontinhos sem nome");
    assert.match(layout, /details\.menu-acoes/, "o script que tira a caixa do recorte da .rolagem sumiu");
  });
});
