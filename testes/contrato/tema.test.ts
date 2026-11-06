import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { C } from "../../src/lib/theme.ts";

/**
 * O TEMA É UM SÓ — e isto barra a volta do que saiu.
 *
 * Em 12/09 o site tinha `2px solid` escrito à mão em 52 lugares e três paletas
 * de erro; em 11/2026 ele deixou de ser escuro: saíram a noite, o papel bege
 * hachurado, a máquina de escrever e a sombra no texto. Cada decisão virou token
 * em `src/lib/theme.ts`, e este teste é o que impede a volta delas uma de cada
 * vez, sem nenhuma tela quebrar.
 *
 * Fora da regra, e por quê: o Estúdio (produto à parte, com paleta própria),
 * `ogCard.tsx` (runtime de imagem, cores escritas à mão de propósito),
 * `layout.tsx`/`manifest.ts` (fora do runtime React).
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function arquivos(dir: string): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = path.join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (nome === "estudio") continue;
      saida.push(...arquivos(p));
    } else if (/\.tsx?$/.test(nome) && !/ogCard|layout\.tsx|manifest\.ts|theme\.ts/.test(nome)) {
      saida.push(p);
    }
  }
  return saida;
}

const fontes = [...arquivos(path.join(RAIZ, "src/app")), ...arquivos(path.join(RAIZ, "src/features")), ...arquivos(path.join(RAIZ, "src/components"))];
const rel = (p: string) => path.relative(RAIZ, p);
const culpadosDe = (padrao: RegExp) => fontes.filter((f) => padrao.test(readFileSync(f, "utf8"))).map(rel);

describe("tema: nada de borda fina, hachura ou erro escritos à mão", () => {
  test("nenhum '2px solid' fora de bordaFina()", () => {
    const culpados = fontes.filter((f) => /2px solid/.test(readFileSync(f, "utf8"))).map(rel);
    assert.deepEqual(culpados, [], "borda fina à mão — use bordaFina(cor) de @/lib/theme");
  });

  test("a hachura do papel não voltou", () => {
    assert.deepEqual(culpadosDe(/\bHATCH\b/), [], "a textura atrás do texto era metade da cara de suja da página");
  });

  test("nenhuma das cores de erro antigas", () => {
    const culpados = fontes.filter((f) => /#FBE3E0|#8C2F22|#6B1F15|#E4572E|#F09A7E/i.test(readFileSync(f, "utf8"))).map(rel);
    assert.deepEqual(culpados, [], "paleta de erro à mão — use C.erro/C.erroBorda (sobre noite) ou C.erroFundo/C.erroTinta (sobre papel)");
  });

  test("as fontes vêm do tema, não redefinidas", () => {
    assert.deepEqual(culpadosDe(/const FONT_(ALFA|TEXTO)\s*=/), [], "importe de @/lib/theme");
  });
});

describe("tema: o painel é claro e fala a língua do site", () => {
  const PAINEL = path.join(RAIZ, "public/painel");
  const bruto = readFileSync(path.join(PAINEL, "painel.css"), "utf8");
  const css = bruto.replace(/\/\*[\s\S]*?\*\//g, "");
  const token = (nome: string) => css.match(new RegExp(`--${nome}:\\s*(#[0-9A-Fa-f]{3,8})`))?.[1]?.toUpperCase();

  test("os tokens de cor têm os valores de theme.ts", () => {
    const pares: [string, string][] = [
      ["ouro", C.gold], ["ouro2", C.gold2], ["ouro-claro", C.ouroClaro], ["ink", C.ink],
      ["fundo-2", C.fundo], ["acento", C.goldDim], ["texto-fraco", C.suave], ["rotulo", C.tintaAcesa],
      ["linha", C.linha], ["linha-3", C.linhaForte], ["aviso-fundo", C.aoVivo],
      ["erro", C.erroTinta], ["erro-borda", C.erroBorda], ["erro-fundo", C.erroFundo],
      ["ok", C.ok], ["ok-borda", C.okBorda], ["ok-fundo", C.okFundo],
    ];
    for (const [nome, valor] of pares) assert.equal(token(nome), valor.toUpperCase(), `--${nome} saiu do par com theme.ts`);
  });

  test("não há tema escuro nem seletor de tema nas telas", () => {
    assert.doesNotMatch(css, /prefers-color-scheme|data-tema|#14110C|#F3ECDA/i, "o painel é claro para todo mundo");
    const layout = readFileSync(path.join(PAINEL, "layout.php"), "utf8");
    assert.doesNotMatch(layout, /data-tema|tema_atual|class="tema"/, "só o Estúdio tem tema");
    assert.match(layout, /<meta name="color-scheme" content="light">/);
  });

  test("sem moldura grossa, sombra dura, hachura ou sombra em texto", () => {
    assert.doesNotMatch(css, /border(-(top|right|bottom|left))?:\s*[2-9]px (solid|dashed)/, "linha é de 1 px");
    assert.doesNotMatch(css, /box-shadow:\s*\d+px \d+px 0/, "sombra dura: cartão em repouso não tem sombra");
    assert.doesNotMatch(css, /repeating-linear-gradient/, "a hachura do papel não volta");
    assert.doesNotMatch(css, /text-shadow/, "sombra em texto suja a letra");
  });

  test("rótulo é frase: a única caixa-alta é a chamada do cartaz", () => {
    const regras = [...css.matchAll(/([^{}]+)\{[^{}]*text-transform:\s*uppercase[^{}]*\}/g)].map((m) => m[1].trim());
    assert.deepEqual(regras, [".cartaz-cheguei"]);
    const espacadas = [...css.matchAll(/([^{}]+)\{[^{}]*letter-spacing:\s*[1-9][^{}]*\}/g)].map((m) => m[1].trim());
    assert.deepEqual(espacadas, [".provisoria"], "letra espaçada só na senha provisória, que é lida em voz alta");
  });

  test("a Alfa Slab só em título grande, e o resto é Figtree", () => {
    const pequenos = [...css.matchAll(/([^{}]+)\{[^{}]*font:\s*400\s+(\d+)px\/[\d.]+\s+var\(--display\)/g)]
      .filter((m) => Number(m[2]) < 24)
      .map((m) => m[1].trim());
    assert.deepEqual(pequenos, [".marca"], "abaixo de 24 px a Alfa só na marca escrita");
    assert.doesNotMatch(css, /--etiqueta|Special Elite|Bitter/, "as fontes antigas saíram do painel");
  });

  test("o que vem depois da legend não sobe ao lado dela", () => {
    /* A legend é float. Com `legend + *`, o campo oculto que às vezes vem logo depois
       ficava com o `clear`, e a primeira caixa do grupo ia parar à direita da página. */
    assert.match(css, /legend ~ \* \{ clear:both; \}/);
  });

  test("toda fonte declarada existe, e só as duas", () => {
    const fontes = [...css.matchAll(/url\('\/painel\/fontes\/([^']+)'\)/g)].map((m) => m[1]).sort();
    assert.deepEqual(fontes, ["alfa-slab-one.woff2", "figtree.woff2"]);
    const noDisco = readdirSync(path.join(PAINEL, "fontes")).filter((f) => f.endsWith(".woff2")).sort();
    assert.deepEqual(noDisco, fontes, "fonte em disco que o CSS não usa pesa à toa");
  });
});

describe("tema: o site é claro", () => {
  test("nenhuma tela chama a noite, o fundo preto voltou", () => {
    assert.deepEqual(culpadosDe(/C\.night|C\.sombraNoite|#14110C|#0C0C0E/i), [], "fundo escuro — a página é C.paper, e o segundo tom é C.fundo");
  });

  test("a central de Ação segue o site: sem topo preto, sem texto apagado por transparência", () => {
    const css = readFileSync(path.join(RAIZ, "src/features/acao/acao.module.css"), "utf8");
    assert.doesNotMatch(css, /background:\s*var\(--acao-ink\)/, "fundo em tinta é o preto de volta; o selecionado é --acao-ouro-claro");
    const comOpacidade = css.split("\n").filter((l) => /opacity:/.test(l) && !/:disabled/.test(l));
    assert.deepEqual(comOpacidade, [], "texto secundário é --acao-suave, nunca opacity");
  });

  test("a cena animada não volta para trás do texto", () => {
    assert.deepEqual(culpadosDe(/cordel-bg/), [], "use <Sertao /> no pé da abertura, nunca atrás do que se lê");
  });

  test("nenhum título com sombra", () => {
    assert.deepEqual(culpadosDe(/text-shadow|textShadow/), [], "sombra em texto suja a letra; quem destaca é o tamanho e o peso");
  });

  test("a máquina de escrever e a Bitter só no Estúdio", () => {
    const culpados = fontes
      .filter((f) => !/app\/layout\.tsx|lib\/fontes\.ts/.test(f))
      .filter((f) => /--font-(elite|bitter)|FONT_(ELITE|BITTER)/.test(readFileSync(f, "utf8")))
      .map(rel);
    assert.deepEqual(culpados, [], "o site tem duas vozes: FONT_ALFA em título grande e FONT_TEXTO no resto");
  });

  test("a Alfa Slab só em título grande", () => {
    /* Abaixo de 24 px ela vira um borrão: era o que deixava os cartões pesados.
       A exceção é a marca escrita, que é logotipo e não texto. */
    const pequena = /font(?:-family|Family):\s*\$?\{?FONT_ALFA\}?[;,]?\s*font(?:-|S)(?:s|)ize:\s*(1\d|2[0-3])(?:\.\d+)?(?:px)?\b/;
    const culpados = fontes
      .filter((f) => !/site\/(Cabecalho|Rodape)\.tsx|presenca\/Pecas\.tsx/.test(f))
      .filter((f) => pequena.test(readFileSync(f, "utf8")))
      .map(rel);
    assert.deepEqual(culpados, [], "título pequeno é FONT_TEXTO em peso 800");
  });
});
