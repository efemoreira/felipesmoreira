import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * OS DOCS NÃO CITAM O QUE NÃO EXISTE.
 *
 * A avaliação de 11/09 achou dez lugares em que doc e código divergiam —
 * `usuarios.php` que não existe mais, "só a área aulas" que não é mais assim.
 * Nenhum quebrava nada, e por isso ninguém via. Este teste pega a metade que
 * dá para pegar por máquina: caminho de arquivo em crase que sumiu, e URL do
 * painel sem regra de URL limpa. O resto é leitura.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (p: string) => readFileSync(path.join(RAIZ, p), "utf8");

const docs = ["CLAUDE.md", ...readdirSync(path.join(RAIZ, "docs")).map((f) => `docs/${f}`)].filter((f) =>
  f.endsWith(".md"),
);

/* Só o que parece caminho de arquivo do repositório: começa por uma das pastas
   de primeiro nível e termina em extensão. `pessoas?p=` e `api/x.php` sem
   pasta ficam de fora — são URL, não arquivo. */
const CAMINHO = /`((?:src|public|testes|docs|update|\.github)\/[\w./-]+\.\w+)`/g;

describe("docs: todo arquivo citado existe", () => {
  for (const doc of docs) {
    test(doc, () => {
      const citados = [...ler(doc).matchAll(CAMINHO)].map((m) => m[1]);
      const sumidos = [...new Set(citados)].filter((c) => !existsSync(path.join(RAIZ, c)));
      assert.deepEqual(sumidos, [], `${doc} cita arquivo que não existe`);
    });
  }
});

describe("docs: toda URL do painel citada tem URL limpa", () => {
  /* `docs/painel.md` lista as URLs; `publish.yml` gera as RewriteRule. Uma URL
     no doc sem regra é uma tela que abre só por `.php`. */
  const fluxo = ler(".github/workflows/publish.yml");
  const urls = [...ler("docs/painel.md").matchAll(/^- `\/painel\/([a-z-]+)`/gm)].map((m) => m[1]);

  test("o doc lista URLs", () => {
    assert.ok(urls.length >= 10, `só achei ${urls.length} URLs em docs/painel.md`);
  });

  for (const u of urls) {
    test(`/painel/${u}`, () => {
      assert.ok(existsSync(path.join(RAIZ, "public/painel", `${u}.php`)), `não existe public/painel/${u}.php`);
      assert.match(fluxo, new RegExp(`\\^painel/${u}/\\?\\$`), `/painel/${u} sem RewriteRule em publish.yml`);
    });
  }
});
