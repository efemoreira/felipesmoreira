import { registerHooks } from "node:module";
import type { ResolveHookSync } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";

/**
 * Ensina o Node a resolver `@/…` como `src/…`.
 *
 * O `paths` do tsconfig é coisa do compilador; quem executa o arquivo é o Node,
 * e ele não lê tsconfig. Sem isto, qualquer módulo do site que importe um irmão
 * por `@/` não abre no teste — e os módulos que valem a pena testar são
 * justamente os que o site inteiro usa.
 *
 * Carregado por `node --import ./testes/alias.ts`. Vinte linhas em vez de uma
 * dependência: é a mesma conta do resto do projeto.
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

/* O bundler completa a extensão sozinho e o Node não: `@/lib/fontes` precisa
   virar `src/lib/fontes.ts`. A ordem é a mesma que o TypeScript usa. */
const EXTENSOES = [".ts", ".tsx", "/index.ts", "/index.tsx", ".js", ""];

const resolver: ResolveHookSync = (especificador, contexto, seguinte) => {
  if (!especificador.startsWith("@/")) {
    return seguinte(especificador, contexto);
  }
  const base = path.join(SRC, especificador.slice(2));
  const achado = EXTENSOES.map((e) => base + e).find((c) => existsSync(c)) ?? base;
  return seguinte(pathToFileURL(achado).href, contexto);
};

registerHooks({ resolve: resolver });
