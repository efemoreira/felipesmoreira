import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOMBRA, sombra, sombraErguida, sombraAfundada, BORDA, C } from "@/lib/theme";

/**
 * A ESCALA DA SOMBRA DURA.
 *
 * A sombra sem borrão é o segundo traço da identidade, depois da moldura. Ela
 * esteve escrita à mão em 17 combinações de deslocamento e opacidade espalhadas
 * por 30 arquivos, e isso não era repetição: era deriva — ninguém escolheu que
 * o cartão pequeno pesasse mais que o grande, foi o que sobrou de escrever o
 * mesmo cartão em dias diferentes.
 *
 * A decisão: **uma opacidade só**, e a altura carregada pelo deslocamento, em
 * **três degraus**. Este teste guarda as duas metades — porque a deriva volta
 * exatamente do mesmo jeito que veio, um `4px 4px 0 rgba(...)` de cada vez, e
 * nenhuma tela quebra quando ela volta.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Tudo em `src/`, menos o Estúdio (produto à parte, com tokens próprios). */
function arquivosDoSite(dir = path.join(RAIZ, "src")): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const alvo = path.join(dir, nome);
    if (alvo.includes(path.join("app", "painel", "estudio"))) return [];
    if (statSync(alvo).isDirectory()) return arquivosDoSite(alvo);
    return /\.(ts|tsx|css)$/.test(nome) ? [alvo] : [];
  });
}

describe("a escala da sombra dura", () => {
  test("são três degraus, e cada um se distingue do vizinho", () => {
    const degraus = Object.values(SOMBRA);
    assert.deepEqual(degraus, [3, 5, 8], "a escala mudou — atualize também os docs que a explicam");

    /* ~1,6 entre degraus é o mínimo para o olho ler "outro nível" sem medir.
       Foi por não ter isso que oito deslocamentos (3,4,5,6,7,8,9,10) conviviam
       sem que nenhum se distinguisse do anterior. */
    for (let i = 1; i < degraus.length; i++) {
      assert.ok(
        degraus[i] / degraus[i - 1] >= 1.5,
        `o degrau ${degraus[i]} está perto demais do ${degraus[i - 1]} para o olho separar os dois`,
      );
    }

    /* O primeiro degrau é a espessura da moldura: a peça rente à página lê como
       se a borda tivesse engrossado de um lado. */
    assert.equal(SOMBRA.rente, BORDA, "o degrau de baixo deixou de acompanhar a BORDA");
  });

  test("a opacidade é uma só — quem carrega a altura é o deslocamento", () => {
    const tintas = [sombra("rente"), sombra("cartao"), sombra("alto")].map((s) => s.replace(/^[\d]+px [\d]+px 0 /, ""));
    assert.deepEqual(new Set(tintas), new Set([C.sombra]), "algum degrau ganhou opacidade própria — é assim que a deriva volta");

    assert.equal(sombra("rente"), `3px 3px 0 ${C.sombra}`);
    assert.equal(sombra(), `5px 5px 0 ${C.sombra}`, "sombra() sozinho é o cartão");
    assert.equal(sombra("alto", C.ink), `8px 8px 0 ${C.ink}`, "a cor é decisão da peça, como em borda()");
  });

  test("erguer e afundar conservam a quina da sombra", () => {
    /* Andam com translate(∓2px): a peça sobe 2 e a sombra cresce 2, então a
       quina de baixo fica parada e o que se vê é a peça descolando do papel — e
       não o par inteiro escorregando. */
    for (const degrau of Object.keys(SOMBRA) as (keyof typeof SOMBRA)[]) {
      const base = SOMBRA[degrau];
      assert.equal(sombraErguida(degrau), `${base + 2}px ${base + 2}px 0 ${C.sombra}`);
      assert.equal(sombraAfundada(degrau), `${base - 2}px ${base - 2}px 0 ${C.sombra}`);
    }
  });

  test("ninguém escreve sombra dura à mão fora do theme.ts", () => {
    const aMao = /(?:box-shadow|boxShadow)\s*:\s*[^;\n]*?(?<![\w-])(\d+)px \1px 0/g;
    const culpados: string[] = [];

    for (const arquivo of arquivosDoSite()) {
      if (arquivo.endsWith(path.join("lib", "theme.ts"))) continue;
      const texto = readFileSync(arquivo, "utf8");
      for (const achado of texto.matchAll(aMao)) {
        culpados.push(`${path.relative(RAIZ, arquivo)}: ${achado[0].trim()}`);
      }
    }

    assert.deepEqual(
      culpados,
      [],
      `sombra dura escrita à mão — use sombra() / sombraErguida() / sombraAfundada():\n  ${culpados.join("\n  ")}`,
    );
  });
});
