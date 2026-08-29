import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * TODA CLASSE ESCRITA NO PAINEL TEM DE EXISTIR NO `painel.css`.
 *
 * **Este teste nasceu de um defeito que ninguém viu por meses.** `.area-cartao`
 * era usada na lista de encontros e na busca global, e não tinha uma linha de
 * CSS. `<a>` e `<span>` são inline por natureza: sem regra, os cartões saíam
 * colados um no outro e a lista virava um parágrafo corrido — o título de um
 * encontro encostando no preparo do anterior.
 *
 * **É o tipo de erro que não quebra nada.** A página desenha, o PHP não
 * reclama, o teste de fumaça passa (a tela abriu inteira e em silêncio) e o
 * HTML está correto. Só quem abre a tela vê, e quem abre a tela é a coordenação
 * no meio de um encontro — não quem escreveu o código.
 *
 * A CHECAGEM É DE UM LADO SÓ, de propósito: classe usada e não definida é
 * defeito visível; classe definida e não usada é sobra de CSS, que não machuca
 * ninguém e some numa faxina. Falhar nos dois lados faria o teste apitar toda
 * vez que alguém tirasse um bloco da tela, e teste que apita à toa é teste que
 * se desliga.
 *
 * Só o painel. No front o CSS mora no mesmo arquivo do componente, embaixo do
 * JSX que o usa — lá a falta se vê ao escrever. No painel são 1300 linhas de
 * `painel.css` longe das cinquenta telas que o leem.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PAINEL = path.join(RAIZ, "public/painel");

const css = readFileSync(path.join(PAINEL, "painel.css"), "utf8");
const definidas = new Set([...css.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]));

/** Os .php do painel, sem descer em subpasta (api/ não desenha tela). */
const telas = readdirSync(PAINEL).filter((f) => f.endsWith(".php"));

/**
 * As classes escritas literalmente num `class="…"`.
 *
 * Os trechos PHP saem antes: `class="selo <?= $selo ?>"` contribui com `selo`, e
 * o pedaço interpolado é conferido pelo segundo teste, que olha o prefixo.
 */
function classesDe(php: string): string[] {
  const achadas: string[] = [];
  for (const m of php.matchAll(/class\s*=\s*(["'])([\s\S]*?)\1/g)) {
    const limpo = m[2].replace(/<\?[\s\S]*?\?>/g, " ");
    for (const c of limpo.split(/\s+/)) {
      /* Termina em "-" é o resto de uma interpolação (`medidor-<?= … ?>`), e não
         uma classe: quem confere esses é o teste do prefixo, logo abaixo. */
      if (/^[a-z][\w-]*$/.test(c) && !c.endsWith("-")) achadas.push(c);
    }
  }
  return achadas;
}

describe("estilo: nenhuma classe do painel fica sem CSS", () => {
  test("toda classe de um class= existe no painel.css", () => {
    const orfas = new Map<string, string[]>();

    for (const arq of telas) {
      for (const c of classesDe(readFileSync(path.join(PAINEL, arq), "utf8"))) {
        if (definidas.has(c)) continue;
        orfas.set(c, [...(orfas.get(c) ?? []), arq]);
      }
    }

    assert.deepEqual(
      [...orfas].map(([c, arqs]) => `.${c} (em ${[...new Set(arqs)].join(", ")})`),
      [],
      "classe usada no painel sem regra no painel.css — a tela desenha, mas sem o desenho",
    );
  });

  test("classe montada por interpolação tem ao menos uma variante no CSS", () => {
    /* `class="medidor medidor-<?= $estado ?>"` só funciona se `.medidor-alguma`
       existir. O teste não sabe quais valores a variável assume — o que ele
       pega é o prefixo que não tem variante nenhuma, que é o caso em que a
       interpolação inteira não pinta nada. */
    const semVariante: string[] = [];

    for (const arq of telas) {
      const php = readFileSync(path.join(PAINEL, arq), "utf8");
      for (const m of php.matchAll(/class\s*=\s*(["'])([\s\S]*?)\1/g)) {
        for (const pm of m[2].matchAll(/([a-z][\w-]*-)<\?/g)) {
          const prefixo = pm[1];
          const temVariante = [...definidas].some((c) => c.startsWith(prefixo) && c !== prefixo);
          if (!temVariante) semVariante.push(`${prefixo}… (em ${arq})`);
        }
      }
    }

    assert.deepEqual([...new Set(semVariante)], []);
  });
});
