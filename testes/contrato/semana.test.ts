import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  semanaDe,
  diaDe,
  periodoDaSemana,
  periodoVigente,
  dentroDoPeriodo,
  soFuturos,
} from "../../src/features/programacao/tempo.ts";
import type { ItemAgenda } from "../../src/features/programacao/tipos.ts";
import { chamarPhp } from "./ponte.ts";

/**
 * `semanaDe()` / `diaDe()` / `periodoDaSemana()` (TS)
 *   ↔ `semana_de()` / `dia_de()` / `periodo_da_semana()` (PHP)
 *
 * A agenda passou a seguir o relógio em vez de um período digitado à mão, e o
 * relógio é lido nos dois lados: no navegador de quem visita `/programacao` e
 * no PHP que monta `/painel/eventos` e a capa da programação.
 *
 * **Se as duas discordarem, o encontro de sábado é "desta semana" num lado e
 * "da semana que vem" no outro** — e como o site é export estático, quem lê a
 * divergência é o eleitor, não a coordenação. As bordas são onde isso acontece:
 * a virada de sábado para domingo, a virada do mês e o fuso do Ceará contra o
 * UTC da Hostinger.
 */

/* Instantes escolhidos nas bordas, todos com o fuso do Ceará explícito. */
const MOMENTOS: [nome: string, iso: string][] = [
  ["terça no meio da semana", "2026-08-25T15:00:00-03:00"],
  ["sábado às 23:59", "2026-08-29T23:59:59-03:00"],
  ["domingo à meia-noite em ponto", "2026-08-30T00:00:00-03:00"],
  ["domingo um segundo depois", "2026-08-30T00:00:01-03:00"],
  ["semana que atravessa o mês", "2026-09-02T10:00:00-03:00"],
  ["semana que atravessa o ano", "2026-12-30T10:00:00-03:00"],
  /* 22h no Ceará é 1h do dia seguinte em UTC: é aqui que um servidor que não
     converte o fuso vira a semana e o dia seis horas cedo demais. */
  ["sábado às 22h, quando em UTC já é domingo", "2026-08-29T22:00:00-03:00"],
];

describe("semana e dia: o PHP e o TypeScript leem o mesmo relógio", () => {
  test("a semana começa no mesmo domingo e acaba no mesmo sábado", () => {
    const doPhp = chamarPhp(
      MOMENTOS.map(([, iso]) => ({ fn: "semana_de", args: [Math.floor(Date.parse(iso) / 1000)] })),
    ) as { inicio: string; fim: string }[];

    MOMENTOS.forEach(([nome, iso], i) => {
      const daTs = semanaDe(new Date(iso));
      assert.equal(
        daTs.inicio.getTime(),
        Date.parse(doPhp[i].inicio),
        `${nome}: a semana começa em dias diferentes nos dois lados`,
      );
      assert.equal(
        daTs.fim.getTime(),
        Date.parse(doPhp[i].fim),
        `${nome}: a semana acaba em dias diferentes nos dois lados`,
      );
    });
  });

  test("o dia de hoje é o mesmo dia nos dois lados", () => {
    const doPhp = chamarPhp(
      MOMENTOS.map(([, iso]) => ({ fn: "dia_de", args: [Math.floor(Date.parse(iso) / 1000)] })),
    ) as { inicio: string; fim: string }[];

    MOMENTOS.forEach(([nome, iso], i) => {
      const daTs = diaDe(new Date(iso));
      assert.equal(daTs.inicio.getTime(), Date.parse(doPhp[i].inicio), `${nome}: o dia começa diferente`);
      assert.equal(daTs.fim.getTime(), Date.parse(doPhp[i].fim), `${nome}: o dia acaba diferente`);
    });
  });

  test("o período por extenso sai escrito igual dos dois lados", () => {
    const doPhp = chamarPhp(
      MOMENTOS.map(([, iso]) => ({
        fn: "periodo_da_semana",
        args: [Math.floor(Date.parse(iso) / 1000)],
      })),
    ) as string[];

    MOMENTOS.forEach(([nome, iso], i) => {
      assert.equal(periodoDaSemana(new Date(iso)), doPhp[i], `${nome}: o período divergiu`);
    });
  });

  /**
   * O período escrito à mão no painel só vale para a semana em que foi escrito.
   * Sem isto ele nunca parava: "24/08 a 30/08" ficou no ar semanas depois, e a
   * página desenhava normalmente — é o defeito mais visível que a agenda teve,
   * porque é a primeira linha embaixo do título.
   */
  test("o período escrito à mão vence na virada da semana, dos dois lados", () => {
    const naSemana = "2026-08-26T12:00:00-03:00";  // quarta
    const naOutra = "2026-09-02T12:00:00-03:00";  // quarta seguinte
    const carimbo = semanaDe(new Date(naSemana)).inicio.toISOString();
    const capa = { periodo: "feirão de 24 a 30", periodoSemana: carimbo };

    const doPhp = chamarPhp([
      { fn: "periodo_em_cartaz", args: [capa, Math.floor(Date.parse(naSemana) / 1000)] },
      { fn: "periodo_em_cartaz", args: [capa, Math.floor(Date.parse(naOutra) / 1000)] },
      /* Sem carimbo — o que já estava gravado antes da regra existir. */
      { fn: "periodo_em_cartaz", args: [{ periodo: "24/08 a 30/08" }, Math.floor(Date.parse(naSemana) / 1000)] },
    ]) as string[];

    assert.equal(periodoVigente(capa, new Date(naSemana)), "feirão de 24 a 30");
    assert.equal(periodoVigente(capa, new Date(naOutra)), "30 de agosto a 5 de setembro");
    assert.equal(
      periodoVigente({ periodo: "24/08 a 30/08" }, new Date(naSemana)),
      "23 a 29 de agosto",
      "texto sem carimbo tem de contar como vencido: ninguém sabe de que semana ele falava",
    );

    assert.deepEqual(
      doPhp,
      ["feirão de 24 a 30", "30 de agosto a 5 de setembro", "23 a 29 de agosto"],
      "o PHP e o TypeScript discordaram sobre o período em cartaz",
    );
  });

  test("a semana é de domingo a sábado, e o domingo abre a que está começando", () => {
    /* A regra em si, e não só o par: se alguém trocar as duas cópias juntas
       de volta para segunda-a-domingo, os testes acima continuariam verdes. */
    const sabado = new Date("2026-08-29T23:00:00-03:00");
    const domingo = new Date("2026-08-30T01:00:00-03:00");

    assert.equal(periodoDaSemana(sabado), "23 a 29 de agosto");
    assert.equal(periodoDaSemana(domingo), "30 de agosto a 5 de setembro");
  });
});

describe("o recorte de período: quem entra e quem fica de fora", () => {
  const item = (inicio?: string): ItemAgenda =>
    ({ id: "x", titulo: "Encontro", dia: "", data: "", hora: "", inicio }) as ItemAgenda;

  const naSemanaDe = semanaDe(new Date("2026-08-26T12:00:00-03:00"));

  test("o sábado às 23h ainda é desta semana; o domingo seguinte já não é", () => {
    /* A borda que a régua "domingo a sábado" existe para decidir. Errada por um
       segundo, o encontro de sábado à noite some da página no sábado à noite —
       que é exatamente quando alguém a abre para saber se ainda dá tempo. */
    assert.equal(dentroDoPeriodo(item("2026-08-29T23:00:00-03:00"), naSemanaDe), true);
    assert.equal(dentroDoPeriodo(item("2026-08-30T00:00:00-03:00"), naSemanaDe), false);
  });

  test("o domingo de madrugada é o primeiro instante da semana", () => {
    assert.equal(dentroDoPeriodo(item("2026-08-23T00:00:00-03:00"), naSemanaDe), true);
    assert.equal(dentroDoPeriodo(item("2026-08-22T23:59:59-03:00"), naSemanaDe), false);
  });

  test("item sem horário nunca é “desta semana”", () => {
    /* Dizer que ele é de hoje seria inventar uma data que ninguém digitou. Ele
       fica fora dos recortes e continua aparecendo em "tudo". */
    assert.equal(dentroDoPeriodo(item(), naSemanaDe), false);
    assert.equal(dentroDoPeriodo(item("não é data"), naSemanaDe), false);
  });

  test("“hoje” é um dia, e não as 24h a partir de agora", () => {
    /* Às 22h, "hoje" acaba em duas horas — não amanhã às 22h. */
    const hoje = diaDe(new Date("2026-08-26T22:00:00-03:00"));
    assert.equal(dentroDoPeriodo(item("2026-08-26T08:00:00-03:00"), hoje), true);
    assert.equal(dentroDoPeriodo(item("2026-08-27T08:00:00-03:00"), hoje), false);
  });

  /**
   * O QUE JÁ ACONTECEU NÃO É AGENDA. O corte vale antes de qualquer recorte, e
   * é ele que separa a /programacao (o que vem) do painel (o que houve).
   */
  test("o que já passou sai da lista; o que está acontecendo fica", () => {
    const agora = new Date("2026-08-26T20:00:00-03:00");
    const lista = [
      item("2026-08-25T19:00:00-03:00"),  // ontem
      item("2026-08-26T19:30:00-03:00"),  // começou às 19:30, ainda rolando
      item("2026-08-29T09:00:00-03:00"),  // sábado
      item(),                              // sem horário
    ];

    const ficaram = soFuturos(lista, agora).map((i) => i.inicio ?? "sem horário");
    assert.deepEqual(ficaram, [
      "2026-08-26T19:30:00-03:00",
      "2026-08-29T09:00:00-03:00",
      "sem horário",
    ]);
  });
});
