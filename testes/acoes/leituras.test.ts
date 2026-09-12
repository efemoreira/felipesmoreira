import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox, ADMIN } from "../sandbox.ts";

/**
 * LEITURAS NÃO GRAVA NADA. É a régua que separa mesa de leitura: quem veio
 * olhar não muda o que olha. O teste tira a foto de /dados antes, abre as
 * quatro abas (e um POST perdido), e compara.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const foto = () => {
  const dados = path.join(painel.dir, "dados");
  return readdirSync(dados)
    .filter((f) => f.endsWith(".php") || f.endsWith(".json"))
    .map((f) => `${f}:${statSync(path.join(dados, f)).mtimeMs}:${statSync(path.join(dados, f)).size}`)
    .sort()
    .join("\n");
};

describe("leituras: só olha", () => {
  test("abrir as seis abas não toca em /dados", async () => {
    const antes = foto();
    for (const aba of ["origem", "territorio", "encontros", "formacao", "semana", "atividade"]) {
      const r = await painel.buscar("leituras", `aba=${aba}`);
      assert.equal(r.status, 200, `aba ${aba} não abriu`);
    }
    assert.equal(foto(), antes, "uma leitura gravou alguma coisa");
  });

  test("um POST em Leituras só toca as metas — o dado do movimento fica como está", async () => {
    /* Desde 12/09 Leituras tem UM POST: as metas (leituras-acoes.php). Ação
       desconhecida vira recado e volta; nenhum ARQ_* do movimento muda. */
    const antes = foto();
    const r = await painel.postar("leituras", { acao: "qualquer" });
    assert.equal(r.status, 302);
    assert.equal(foto(), antes);
  });

  test("quem não coordena não abre", async () => {
    painel.trocarCapacidades("comunicacao");
    const r = await painel.buscar("leituras", "");
    assert.equal(r.status, 302);
    assert.match(r.location, /negado=leituras/);
  });

  test("a semana mostra os medidores, e o caixa só para quem administra", async () => {
    const adm = await painel.buscar("leituras", "aba=semana");
    assert.match(adm.html, /class="medidor/);
    assert.match(adm.html, /Os caixas/);

    painel.trocarCapacidades("coordenacao");
    const coord = await painel.buscar("leituras", "aba=semana");
    assert.doesNotMatch(coord.html, /Os caixas/, "a coordenação viu o dinheiro");
  });
});

describe("leituras: as duas derivações", () => {
  test("o funil do encontro conta quem veio e quem voltou", async () => {
    /* A semente tem um encontro daqui a três dias com Maria confirmada e
       presente. Um encontro passado com ela e um posterior com ela de novo
       fazem "voltou" existir. */
    painel.gravar("eventos", [
      ...painel.ler("eventos"),
      { id: "ev-antigo", titulo: "Encontro antigo no Benfica", familia: "publico", inicio: "2026-03-01T19:00:00-03:00",
        local: "Praça", status: "confirmado", token: "c".repeat(16), tokenConfirmacao: "d".repeat(16), criadoEm: "2026-02-01T10:00:00-03:00" },
      { id: "ev-depois", titulo: "Encontro seguinte no Benfica", familia: "publico", inicio: "2026-04-01T19:00:00-03:00",
        local: "Praça", status: "confirmado", token: "e".repeat(16), tokenConfirmacao: "f".repeat(16), criadoEm: "2026-02-01T10:00:00-03:00" },
    ]);
    painel.gravar("presencas", [
      ...painel.ler("presencas"),
      { id: "pr-1", eventoId: "ev-antigo", pessoaId: "pes00000000teste", confirmou: true, compareceu: true, criadoEm: "2026-03-01T10:00:00-03:00" },
      { id: "pr-2", eventoId: "ev-antigo", pessoaId: ADMIN, confirmou: true, compareceu: false, criadoEm: "2026-03-01T10:00:00-03:00" },
      { id: "pr-3", eventoId: "ev-depois", pessoaId: "pes00000000teste", confirmou: false, compareceu: true, criadoEm: "2026-04-01T10:00:00-03:00" },
    ]);
    const { html } = await painel.buscar("leituras", "aba=encontros");
    const linha = html.slice(html.indexOf("Encontro antigo no Benfica"), html.indexOf("</tr>", html.indexOf("Encontro antigo no Benfica")));
    const numeros = [...linha.matchAll(/data-rotulo="(\w+)">\s*(?:<strong>)?(\d+)/g)].map((m) => [m[1], Number(m[2])]);
    assert.deepEqual(Object.fromEntries(numeros), { Confirmaram: 2, Vieram: 1, Inscreveram: 1, Aprovadas: 0, Voltaram: 1 });
    /* O encontro que ainda vai acontecer não tem funil. */
    assert.doesNotMatch(html, /Encontro de fumaça no Benfica/);
  });

  test("a prontidão por função é a mesma conta da tela de aulas", async () => {
    painel.gravar("pessoas", painel.ler("pessoas").map((p) => (p.id === ADMIN ? { ...p, funcoes: ["recepcao"] } : p)));
    const leitura = (await painel.buscar("leituras", "aba=formacao")).html;
    const aulas = (await painel.buscar("aulas", "aba=prontidao")).html;
    assert.match(leitura, /Recepção/);
    /* Os dois lados dizem "0 de 1" ou "1 de 1" — o mesmo. */
    const de = (h: string) => h.match(/(\d) de (\d)/)?.[0];
    assert.ok(de(leitura), "Leituras não mostrou a conta");
    assert.equal(de(leitura), de(aulas), "Leituras e Aulas discordam sobre a trilha");
  });
});
