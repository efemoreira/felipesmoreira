import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * O TEMA É UM SÓ — e isto barra a volta do que saiu.
 *
 * Em 12/09 o site tinha `2px solid` escrito à mão em 52 lugares, a hachura
 * do cordel copiada em sete arquivos e três paletas de erro. Cada um virou
 * token em `src/lib/theme.ts` (`bordaFina()`, `HATCH`, `erroFundo`/`erroTinta`).
 * Este teste é o que impede a 53ª borda à mão.
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

describe("tema: nada de borda fina, hachura ou erro escritos à mão", () => {
  test("nenhum '2px solid' fora de bordaFina()", () => {
    const culpados = fontes.filter((f) => /2px solid/.test(readFileSync(f, "utf8"))).map(rel);
    assert.deepEqual(culpados, [], "borda fina à mão — use bordaFina(cor) de @/lib/theme");
  });

  test("nenhum 'const HATCH' fora do tema", () => {
    const culpados = fontes.filter((f) => /const HATCH\b/.test(readFileSync(f, "utf8"))).map(rel);
    assert.deepEqual(culpados, [], "hachura copiada — importe HATCH de @/lib/theme");
  });

  test("nenhuma das cores de erro antigas", () => {
    const culpados = fontes.filter((f) => /#FBE3E0|#8C2F22|#6B1F15|#E4572E|#F09A7E/i.test(readFileSync(f, "utf8"))).map(rel);
    assert.deepEqual(culpados, [], "paleta de erro à mão — use C.erro/C.erroBorda (sobre noite) ou C.erroFundo/C.erroTinta (sobre papel)");
  });

  test("as fontes vêm do tema, não redefinidas", () => {
    const culpados = fontes
      .filter((f) => /const FONT_(ALFA|ELITE|BITTER)\s*=/.test(readFileSync(f, "utf8")))
      .map(rel);
    /* Duas exceções conhecidas e antigas em programacao/; não deixe crescer. */
    assert.ok(culpados.length <= 2, `fontes redefinidas em ${culpados.join(", ")} — importe de @/lib/theme`);
  });
});
