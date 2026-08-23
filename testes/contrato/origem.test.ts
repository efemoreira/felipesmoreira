import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { slugDe } from "../../src/lib/atribuicao.ts";
import { mapearPhp } from "./ponte.ts";

/**
 * `slugDe()` (TS) ↔ `normalizar_origem()` (PHP)
 *
 * O militante digita o nome uma vez na Munição, e todo link que ele compartilha
 * sai com `?de=<slug>`. Do outro lado, `api/inscricao.php` normaliza o que
 * chegou antes de gravar. **Se as duas normalizações discordarem, o mesmo
 * militante vira duas origens no relatório** — e ninguém descobre, porque as
 * duas linhas existem e as duas parecem certas.
 *
 * É o pacto que o CLAUDE.md registra. Aqui ele deixa de ser conhecimento oral.
 */

const NOMES = [
  "João Silva",
  "JOÃO SILVA",
  "joão silva",
  "  João   da   Silva  ",
  "Maria José da Conceição",
  "Antônio Gonçalves",
  "Ana-Paula",
  "Zé",
  "Sant'Ana",
  "D'Ávila",
  "José Ângelo Küng",
  "encontro-benfica",
  "live domingo",
  "Live do Domingo!!!",
  "Fulano (o barbudo)",
  "#hashtag",
  "café com pão",
  "AÇÃO 2026",
  "duas    barras // aqui",
  "acentos: áàãâä éèêë íìîï óòõôö úùûü ç ñ",
  "trema: Müller",
  "ordinal: 1º de maio",
  "traço—longo",
  "emoji 🇧🇷 no meio",
  "",
  "   ",
  "---",
  "-começa-e-termina-",
  "a",
  "9",
];

describe("origem: slugDe (TS) e normalizar_origem (PHP)", () => {
  test("escrevem o mesmo slug para o que a militância digita", () => {
    const doPhp = mapearPhp("normalizar_origem", NOMES) as string[];
    const divergentes: string[] = [];

    NOMES.forEach((nome, i) => {
      const ts = slugDe(nome);
      if (ts !== doPhp[i]) {
        divergentes.push(`  ${JSON.stringify(nome)}\n    TS  → ${JSON.stringify(ts)}\n    PHP → ${JSON.stringify(doPhp[i])}`);
      }
    });

    assert.equal(
      divergentes.length,
      0,
      `os dois lados discordam em ${divergentes.length} de ${NOMES.length} entradas.\n` +
        `O mesmo militante viraria duas origens no relatório:\n${divergentes.join("\n")}`,
    );
  });

  test("o corte em 60 acontece do mesmo lado dos dois", () => {
    /* Aqui mora uma diferença de ORDEM: o PHP corta o texto CRU em 60
       (`limpar_texto`) e depois transforma em slug; o TS transforma primeiro e
       corta o slug em 60. Com espaços em excesso — que colapsam em um hífen só —
       as duas contas param em lugares diferentes. */
    const compridos = [
      "a" + " ".repeat(10) + "b".repeat(60),
      "Maria ".repeat(15),
      "x".repeat(59) + " " + "y".repeat(10),
      "João ".repeat(20),
      "—".repeat(30) + "fim",
    ];
    const doPhp = mapearPhp("normalizar_origem", compridos) as string[];
    const divergentes = compridos
      .map((t, i) => [t, slugDe(t), doPhp[i]] as const)
      .filter(([, ts, php]) => ts !== php);

    assert.equal(
      divergentes.length,
      0,
      `nomes longos saem diferentes dos dois lados:\n` +
        divergentes
          .map(([t, ts, php]) => `  ${JSON.stringify(t.slice(0, 40))}…\n    TS  (${ts.length}) → ${ts}\n    PHP (${php.length}) → ${php}`)
          .join("\n"),
    );
  });
});
