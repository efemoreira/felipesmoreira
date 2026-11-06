import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOMBRA, sombra, sombraErguida, sombraAfundada, C } from "@/lib/theme";

/**
 * A ESCALA DA SOMBRA — e a volta proibida da sombra dura.
 *
 * Até 11/2026 a sombra era um decalque sem borrão, em toda peça do site. Somada
 * à moldura de 3 px, era metade do que deixava tudo com cara de sujo. Agora a
 * sombra é luz macia: **uma tinta só, três degraus**, e a peça em repouso nem tem
 * sombra. Este teste guarda as duas metades, e a segunda é a que importa: a
 * deriva volta do mesmo jeito que veio, um `4px 4px 0 rgba(...)` de cada vez, e
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

describe("a escala da sombra", () => {
  test("são três degraus, e cada um se distingue do vizinho", () => {
    const degraus = Object.values(SOMBRA);
    assert.equal(degraus.length, 3, "a escala mudou — atualize também os docs que a explicam");

    for (let i = 1; i < degraus.length; i++) {
      assert.ok(degraus[i].y / degraus[i - 1].y >= 2, "dois degraus perto demais: o olho não separa os dois");
      assert.ok(degraus[i].desfoque > degraus[i - 1].desfoque, "o degrau de cima tem de espalhar mais");
    }
  });

  test("a tinta é uma só — quem carrega a altura é o deslocamento", () => {
    const tintas = [sombra("rente"), sombra("cartao"), sombra("alto")].map((s) => s.replace(/^0 \d+px \d+px /, ""));
    assert.deepEqual(new Set(tintas), new Set([C.sombra]), "algum degrau ganhou tinta própria — é assim que a deriva volta");

    assert.equal(sombra(), sombra("cartao"), "sombra() sozinho é o cartão");
    assert.equal(sombra("alto", C.ink), `0 ${SOMBRA.alto.y}px ${SOMBRA.alto.desfoque}px ${C.ink}`, "a cor é decisão da peça, como em borda()");
  });

  test("erguer e afundar ficam em volta do degrau", () => {
    for (const degrau of Object.keys(SOMBRA) as (keyof typeof SOMBRA)[]) {
      const y = (s: string) => Number(s.match(/^0 (\d+)px/)?.[1]);
      assert.ok(y(sombraErguida(degrau)) > y(sombra(degrau)), `${degrau}: erguida tem de subir`);
      assert.ok(y(sombraAfundada(degrau)) <= y(sombra(degrau)), `${degrau}: afundada não pode subir`);
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
