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

  /* JSON PRECISA DIZER QUE É JSON. O bundler aceita `import dados from
     "@/data/municipios-ce.json"` sem mais nada; o Node exige o
     `with { type: "json" }` e, sem ele, recusa o módulo inteiro. Como o
     `funcoes.json` e o `municipios-ce.json` são justamente as fontes únicas que
     os dois lados dividem, qualquer teste que toque em validação de cidade ou
     de função esbarra nisso — e o erro não fala de JSON, fala de "import
     attribute", que não é onde se procura. Pôr o atributo no código do site
     resolveria aqui e quebraria lá: quem manda no `src/` é o bundler. */
  const resolvido = seguinte(pathToFileURL(achado).href, contexto);
  if (!achado.endsWith(".json")) {
    return resolvido;
  }
  /* O atributo tem de sair NO RESULTADO do hook: mandá-lo adiante no contexto
     não basta, porque quem confere é o carregador, depois, contra o que o hook
     devolveu. */
  return { ...resolvido, format: "json", importAttributes: { type: "json" } };
};

registerHooks({ resolve: resolver });
