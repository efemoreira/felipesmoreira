import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { estadoDe } from "../../src/features/programacao/tempo.ts";
import { chamarPhp } from "./ponte.ts";

/**
 * `estadoDe()` (TS) ↔ `estado_do_evento()` (PHP)
 *
 * As duas cópias existem porque uma roda no navegador de quem visita
 * `/programacao` e a outra no PHP que monta o painel — e o painel não pode
 * esperar o JavaScript para saber o que já passou.
 *
 * **Se divergirem, o painel diz que o encontro acabou enquanto o site ainda
 * mostra "AO VIVO"** — ou o contrário, que é pior: o site anuncia como futuro
 * um encontro que já foi. `DURACAO_PADRAO_MIN = 120` faz parte do pacto: é ele
 * que decide por quanto tempo um encontro "está acontecendo", já que a
 * coordenação marca quando começa e ninguém volta ao painel para dizer que
 * acabou.
 */

const INICIO = "2026-10-04T19:00:00-03:00";
const t = (iso: string) => new Date(iso);

/** Instantes escolhidos em volta das duas bordas: o começo e o começo + 120min. */
const MOMENTOS = [
  ["muito antes", "2026-10-01T10:00:00-03:00"],
  ["um minuto antes", "2026-10-04T18:59:00-03:00"],
  ["um segundo antes", "2026-10-04T18:59:59-03:00"],
  ["no instante exato", "2026-10-04T19:00:00-03:00"],
  ["um segundo depois", "2026-10-04T19:00:01-03:00"],
  ["no meio", "2026-10-04T20:00:00-03:00"],
  ["um segundo antes do fim", "2026-10-04T20:59:59-03:00"],
  ["no fim exato (120min)", "2026-10-04T21:00:00-03:00"],
  ["um segundo depois do fim", "2026-10-04T21:00:01-03:00"],
  ["no dia seguinte", "2026-10-05T19:00:00-03:00"],
  /* O mesmo instante escrito noutro fuso: o painel roda em UTC na Hostinger e
     o navegador do visitante roda no fuso dele. Se o pacto dependesse do fuso
     de quem pergunta, o "AO VIVO" acenderia em horas diferentes para cada um. */
  ["o mesmo instante, em UTC", "2026-10-04T23:00:00Z"],
] as const;

describe("tempo: estadoDe (TS) e estado_do_evento (PHP)", () => {
  test("concordam em cada borda da janela de 120 minutos", () => {
    const doPhp = chamarPhp(
      MOMENTOS.map(([, iso]) => ({
        fn: "estado_do_evento",
        args: [INICIO, Math.floor(t(iso).getTime() / 1000)],
      })),
    ) as string[];

    const divergentes = MOMENTOS.map(([rotulo, iso], i) => {
      const ts = estadoDe({ inicio: INICIO } as never, t(iso));
      return [rotulo, ts, doPhp[i]] as const;
    }).filter(([, ts, php]) => ts !== php);

    assert.equal(
      divergentes.length,
      0,
      "o site e o painel discordam sobre o que já passou:\n" +
        divergentes.map(([r, ts, php]) => `  ${r}: TS=${ts} · PHP=${php}`).join("\n"),
    );
  });

  test("encontro sem instante é 'sem-horario' nos dois", () => {
    const [php] = chamarPhp([{ fn: "estado_do_evento", args: ["", null] }]) as string[];
    assert.equal(estadoDe({ inicio: "" } as never), "sem-horario");
    assert.equal(php, "sem-horario");
  });

  test("instante ilegível não vira 'futuro' em nenhum dos dois", () => {
    /* Data quebrada que caísse em "futuro" reviveria um encontro antigo no topo
       da programação — o defeito é silencioso e o cartão fica lá. */
    const lixo = ["não é data", "29/07", "0000-00-00"];
    const doPhp = chamarPhp(lixo.map((x) => ({ fn: "estado_do_evento", args: [x, null] }))) as string[];
    lixo.forEach((x, i) => {
      assert.notEqual(estadoDe({ inicio: x } as never), "futuro", `TS deu futuro para ${JSON.stringify(x)}`);
      assert.notEqual(doPhp[i], "futuro", `PHP deu futuro para ${JSON.stringify(x)}`);
    });
  });
});
