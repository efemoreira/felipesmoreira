import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { normalizarBusca, secoesDoDocumento, tarefaConcluida } from "../../src/features/acao/documentos.ts";
import { MENU, RODAPE } from "@/components/site/navegacao";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (arquivo: string) => readFileSync(path.join(raiz, arquivo), "utf8");

describe("ação: página oculta e conteúdo fora do export", () => {
  test("fica fora do menu, rodapé e sitemap, com noindex", () => {
    const destinos = [...MENU, ...RODAPE.flatMap((r) => r.itens)].map((item) => item.href);
    assert.ok(!destinos.some((href) => href === "/acao"));
    assert.doesNotMatch(ler("src/app/sitemap.ts"), /url:\s*[^\n]*\/acao/);
    assert.match(ler("src/app/acao/page.tsx"), /index: false/);
    assert.doesNotMatch(ler("src/app/acao/page.tsx"), /readFileSync|Downloads|\.md["']/);
    assert.ok(!existsSync(path.join(raiz, "public/acao.json")));
    assert.ok(!existsSync(path.join(raiz, "public/acao.md")));
  });

  test("a ponte de login e o alias do plano têm regra na publicação", () => {
    const workflow = ler(".github/workflows/publish.yml");
    assert.match(workflow, /RewriteRule \^painel\/acao\/\?\$ \/painel\/acao\.php/);
    assert.match(workflow, /RewriteRule \^planos\/\?\$ \/plano \[R=302,L,QSA\]/);
  });

  test("sumário ignora exemplos em cercas e distingue títulos repetidos por linha", () => {
    assert.deepEqual(secoesDoDocumento("# Início\n```md\n## Exemplo\n```\n## Etapa\n## Etapa"), [
      { titulo: "Início", linha: 1, nivel: 1 },
      { titulo: "Etapa", linha: 5, nivel: 2 },
      { titulo: "Etapa", linha: 6, nivel: 2 },
    ]);
  });

  test("busca ignora acentos e marcação explícita pode desfazer um item da fonte", () => {
    assert.equal(normalizarBusca("Ação em Icapuí"), "acao em icapui");
    const tarefa = { id: "t", linha: 1, texto: "Conferir", concluida: true };
    assert.equal(tarefaConcluida(tarefa, {}), true);
    assert.equal(tarefaConcluida(tarefa, { t: false }), false);
  });
});
