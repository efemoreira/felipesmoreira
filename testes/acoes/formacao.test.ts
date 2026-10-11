import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * A TRILHA EM QUATRO NÍVEIS e o certificado da Básica (plano 2026–2027). O
 * nível sai da posição da aula no currículo: Dias 0 e 1 são a Básica. O
 * certificado é a data da última aula da Básica, e é o que a Liga lê para o
 * nível B.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const BASICA = [
  "como-funciona-a-formacao", "regras-de-todos", "fases-da-campanha", "fluxo-da-fonte", "vivencia",
  "seguranca-contexto", "teste-do-espelho", "nunca-pelo-odio", "organograma", "cadencia-semanal", "ferramentas-do-time",
];

function concluir(ids: string[]) {
  painel.gravar("aulas-progresso", { [ADMIN]: Object.fromEntries(ids.map((id, i) => [id, `2026-10-0${1 + (i % 9)}T10:00:00-03:00`])) });
}

describe("formação: níveis e certificado", () => {
  test("sem a Básica inteira não há certificado", () => {
    concluir(BASICA.slice(0, 5));
    const { html } = painel.abrir("certificado");
    assert.match(html, /Ainda não/);
    assert.match(html, /5 estão concluídas/);
  });

  test("com a Básica inteira, o certificado sai com o nome e a data da última aula", () => {
    concluir(BASICA);
    const { html, erros } = painel.abrir("certificado");
    assert.deepEqual(erros.split("\n").filter((l) => /Warning|Notice|Fatal|Uncaught/.test(l)), []);
    assert.match(html, /Certificamos que <strong>Coordenação de Teste<\/strong>/);
    assert.match(html, /9 de outubro de 2026/);
  });

  test("o Início mostra o progresso por nível e o link do certificado", () => {
    concluir(BASICA);
    const html = painel.abrir("index").html;
    assert.match(html, /selo selo-ok">Básica 11\/11/);
    assert.match(html, /\/painel\/certificado\.php/);
  });

  test("a Liga lê o certificado: o nível B deixa de pedir a formação", () => {
    concluir(BASICA);
    const mes = (n: number) => {
      const d = new Date();
      const x = new Date(d.getFullYear(), d.getMonth() - n, 1);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
    };
    painel.gravar("liga", [{
      id: "pv-a", nome: "Coord", pessoaId: ADMIN, redesEm: "2026-09-01",
      meses: [
        { mes: mes(3), redes: { instagram: 2800 }, engajamento: 4 },
        { mes: mes(2), redes: { instagram: 3100 }, engajamento: 4 },
        { mes: mes(1), redes: { instagram: 3400 }, engajamento: 3.5, semanasSeguidas: 9 },
      ],
    }]);
    assert.match(painel.abrir("organizacao", "aba=liga").html, /<strong>B<\/strong> · Território/);
  });
});
