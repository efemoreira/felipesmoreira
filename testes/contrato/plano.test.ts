import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../../public/plano.html", import.meta.url), "utf8");
const desafio = html.slice(html.indexOf("const weeks="), html.indexOf("/* pauta */"));
type Semana = [string, string, string, string, string, string[], string, number];
const weeks = runInNewContext(`${desafio.split("const MIS=")[0]}; weeks`) as Semana[];

test("o desafio cobre 90 dias contínuos de novembro a janeiro, com duas pausas", () => {
  const meses: Record<string, number> = { nov: 10, dez: 11, jan: 0 };
  let proximo = Date.UTC(2026, 10, 3);
  const inicio = proximo;
  for (const w of weeks) {
    const partes = w[1].match(/^(\d+)(?: (nov|dez|jan))?–(\d+) (nov|dez|jan)$/);
    assert.ok(partes, w[1]);
    const [, d1, m1, d2, m2] = partes;
    const primeiroMes = m1 || m2;
    const de = Date.UTC(primeiroMes === "jan" ? 2027 : 2026, meses[primeiroMes], +d1);
    const ate = Date.UTC(m2 === "jan" ? 2027 : 2026, meses[m2], +d2);
    assert.equal(de, proximo, `lacuna ou sobreposição em ${w[0]}`);
    proximo = ate + 86400000;
  }
  assert.equal((proximo - inicio) / 86400000, 90);
  assert.equal(proximo, Date.UTC(2027, 1, 1));
  assert.equal(weeks.length, 13);
  assert.equal(new Set(weeks.map(w => w[7])).size, 13);
  assert.equal(weeks.filter(w => w[4]).length, 11);
  assert.deepEqual(Array.from(weeks.filter(w => !w[4]), w => w[1]), ["21–27 dez", "28 dez–3 jan"]);
  assert.match(html, /3 de novembro de 2026 a 31 de janeiro de 2027/);
  assert.match(html, /03\/11\/2026 a 31\/01\/2027/);
  assert.doesNotMatch(html, /13–18 out|12\/10 a 10\/01|13 de outubro de 2026 a 9 de janeiro/);
  const calendario = html.slice(html.indexOf("const CAL="), html.indexOf("const CF="));
  const mesesDoPlano = runInNewContext(`${calendario}; CAL`) as { m: number; y: number; ev: [number | string, string, string][] }[];
  const inicioNoCalendario = mesesDoPlano.flatMap(m => m.ev.filter(e => e[2].includes("Início do desafio")).map(e => [m.y, m.m, e[0]]));
  const fimNoCalendario = mesesDoPlano.flatMap(m => m.ev.filter(e => e[2].includes("Revisão dos 90 dias")).map(e => [m.y, m.m, e[0]]));
  assert.equal(JSON.stringify(inicioNoCalendario), JSON.stringify([[2026, 10, 3]]));
  assert.equal(JSON.stringify(fimNoCalendario), JSON.stringify([[2027, 0, 31]]));
});

test("reordenar as semanas preserva as marcações salvas e não transforma missão em pausa", () => {
  const elementos = new Map<string, { innerHTML: string; textContent: string; style: { width: string }; addEventListener: () => void }>();
  const $ = (id: string) => {
    if (!elementos.has(id)) elementos.set(id, { innerHTML: "", textContent: "", style: { width: "" }, addEventListener() {} });
    return elementos.get(id)!;
  };
  runInNewContext(`${desafio}\ndone={m8:true,b12_1:true}; renderWeeks();`, { $, I: () => "", esc: (s: string) => s });
  const cards = $("#weeks").innerHTML.split('<div class="wk ');
  assert.match(cards[10], /Semana 10[\s\S]*id="m8" checked/);
  assert.doesNotMatch(cards[8], /type="checkbox"/);
  assert.match(cards[9], /id="b12_1" checked/);
  assert.match($("#progTxt").textContent, /^1 de 11 missões/);
  assert.match($("#starTxt").textContent, /★ 1 de/);
});
