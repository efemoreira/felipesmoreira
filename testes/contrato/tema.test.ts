import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
