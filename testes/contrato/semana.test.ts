import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  semanaDe,
  diaDe,
  periodoDaSemana,
  dentroDoPeriodo,
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
 * **Se as duas discordarem, o encontro de domingo é "desta semana" num lado e
 * "da semana que vem" no outro** — e como o site é export estático, quem lê a
 * divergência é o eleitor, não a coordenação. As bordas são onde isso acontece:
 * a virada de domingo para segunda, a virada do mês e o fuso do Ceará contra o
 * UTC da Hostinger.
 */

/* Instantes escolhidos nas bordas, todos com o fuso do Ceará explícito. */
const MOMENTOS: [nome: string, iso: string][] = [
  ["terça no meio da semana", "2026-08-25T15:00:00-03:00"],
  ["domingo às 23:59", "2026-08-30T23:59:59-03:00"],
  ["segunda à meia-noite em ponto", "2026-08-31T00:00:00-03:00"],
  ["segunda um segundo depois", "2026-08-31T00:00:01-03:00"],
  ["semana que atravessa o mês", "2026-09-02T10:00:00-03:00"],
  ["semana que atravessa o ano", "2026-12-30T10:00:00-03:00"],
  /* 22h no Ceará é 1h do dia seguinte em UTC: é aqui que um servidor que não
     converte o fuso vira a semana e o dia seis horas cedo demais. */
  ["domingo às 22h, quando em UTC já é segunda", "2026-08-30T22:00:00-03:00"],
];

describe("semana e dia: o PHP e o TypeScript leem o mesmo relógio", () => {
  test("a semana começa na mesma segunda e acaba no mesmo domingo", () => {
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

  test("a semana é de segunda a domingo, e o domingo pertence à que está acabando", () => {
    /* A regra em si, e não só o par: se alguém trocar as duas cópias juntas
       para domingo-a-sábado, os testes acima continuariam verdes. */
    const domingo = new Date("2026-08-30T23:00:00-03:00");
    const segunda = new Date("2026-08-31T01:00:00-03:00");

    assert.equal(periodoDaSemana(domingo), "24 a 30 de agosto");
    assert.equal(periodoDaSemana(segunda), "31 de agosto a 6 de setembro");
  });
});

describe("o recorte de período: quem entra e quem fica de fora", () => {
  const item = (inicio?: string): ItemAgenda =>
    ({ id: "x", titulo: "Encontro", dia: "", data: "", hora: "", inicio }) as ItemAgenda;

  const naSemanaDe = semanaDe(new Date("2026-08-26T12:00:00-03:00"));

  test("o domingo às 23h ainda é desta semana; a segunda seguinte já não é", () => {
    /* A borda que a régua "segunda a domingo" existe para decidir. Errada por um
       segundo, o encontro de domingo à noite some da página no domingo à noite —
       que é exatamente quando alguém a abre para saber se ainda dá tempo. */
    assert.equal(dentroDoPeriodo(item("2026-08-30T23:00:00-03:00"), naSemanaDe), true);
    assert.equal(dentroDoPeriodo(item("2026-08-31T00:00:00-03:00"), naSemanaDe), false);
  });

  test("a segunda de madrugada é o primeiro instante da semana", () => {
    assert.equal(dentroDoPeriodo(item("2026-08-24T00:00:00-03:00"), naSemanaDe), true);
    assert.equal(dentroDoPeriodo(item("2026-08-23T23:59:59-03:00"), naSemanaDe), false);
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
});
