import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";
import { chamarPhp } from "../contrato/ponte.ts";

let painel: Sandbox;
before(() => { painel = montarSandbox(); });
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

function mesAtras(n: number): string {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date());
  const data = new Date(hoje.slice(0, 7) + "-01T12:00:00Z");
  data.setUTCMonth(data.getUTCMonth() - n);
  return data.toISOString().slice(0, 7);
}

function unidade(tipo = "nucleo") {
  const base = {
    id: tipo === "grupo" ? "grp-a" : "nuc-a", nome: "Benfica", cidade: "Fortaleza",
    responsavelId: ADMIN, substitutoId: "pes00000000teste", criadoEm: "2020-01-01T12:00:00-03:00",
    proximaData: "2099-01-01", nivel: "T1", maturidade: 1,
    tema: "saude", finalidade: "Saúde local", primeiraEntrega: "Diagnóstico", primeiraEntregaAte: "2099-01-01",
    entregas: [0, 1, 2].map(n => ({ id: `e${n}`, data: mesAtras(n) + "-01", texto: "Entrega do mês" })),
  };
  painel.gravar(tipo === "grupo" ? "temas" : "nucleos", [base]);
  return base;
}

describe("crescimento: ciclos e promoção", () => {
  test("cadastro novo não pula para T4 nem maturidade 4", async () => {
    for (const [acao, campos] of [
      ["nucleo-salvar", { nome: "Benfica", cidade: "Fortaleza", nivel: "T4" }],
      ["grupo-salvar", { tema: "saude", finalidade: "UPAs", responsavelId: ADMIN, primeiraEntrega: "Diagnóstico", primeiraEntregaAte: "2099-01-01", maturidade: "4" }],
    ] as const) {
      const r = await painel.postar("organizacao", { acao, ...campos, evidencia: "Atuação local" });
      assert.match(r.html, /cadastrar no nível inicial/);
    }
    assert.equal(painel.ler("nucleos").length, 0);
    assert.equal(painel.ler("temas").length, 0);
  });

  test("entregas sozinhas não promovem; os dois meses encerrados com avaliações promovem e guardam rastro", async () => {
    unidade();
    const campos = { acao: "nucleo-salvar", id: "nuc-a", nivel: "T2", evidencia: "Rotina e participação comprovadas" };
    const negada = await painel.postar("organizacao", campos);
    assert.match(negada.html, /avaliação com evidência/);
    assert.equal(painel.ler("nucleos")[0].nivel, "T1");
    for (const n of [2, 1]) {
      await painel.postar("organizacao", { acao: "avaliar-ciclo", tipo: "nucleo", id: "nuc-a", mes: mesAtras(n), nivelAvaliado: "2", evidenciaCiclo: "Responsável e encontros recorrentes com registro" });
    }
    const comando = painel.abrir("leituras").html;
    assert.match(comando, /Quais unidades estão prontas para subir de nível\?<\/strong>\s*<span class="dica">Núcleo Benfica/);
    await painel.postar("organizacao", campos);
    const [n] = painel.ler("nucleos");
    assert.equal(n.nivel, "T2");
    assert.equal(n.historicoNiveis.length, 1);
    assert.equal(n.historicoNiveis[0].de, "T1");
    assert.equal(n.historicoNiveis[0].para, "T2");
    assert.ok(n.historicoNiveis[0].por);
    assert.equal(n.historicoNiveis[0].ciclos.length, 2);
    await painel.postar("organizacao", { acao: "avaliar-ciclo", tipo: "nucleo", id: "nuc-a", mes: mesAtras(1), nivelAvaliado: "2", evidenciaCiclo: "Correção posterior" });
    assert.equal(painel.ler("nucleos")[0].historicoNiveis[0].ciclos[1].evidencia, "Responsável e encontros recorrentes com registro");
    await painel.postar("organizacao", { acao: "nucleo-salvar", id: "nuc-a", nome: "Benfica atualizado" });
    assert.equal(painel.ler("nucleos")[0].historicoNiveis.length, 1);
  });

  test("ciclo em andamento, sem entrega, ou sem evidência é recusado", async () => {
    unidade();
    for (const campos of [
      { mes: mesAtras(0), evidenciaCiclo: "Registro" },
      { mes: mesAtras(3), evidenciaCiclo: "Registro" },
      { mes: mesAtras(1), evidenciaCiclo: "" },
    ]) {
      await painel.postar("organizacao", { acao: "avaliar-ciclo", tipo: "nucleo", id: "nuc-a", nivelAvaliado: "2", ...campos });
      assert.equal(painel.ler("nucleos")[0].avaliacoes.length, 0);
    }
  });

  test("meses separados não bastam; corrigir avaliação substitui só aquele mês", async () => {
    const u = unidade("grupo");
    u.entregas.push({ id: "e3", data: mesAtras(3) + "-01", texto: "Outro ciclo" });
    painel.gravar("temas", [u]);
    for (const n of [3, 1]) {
      await painel.postar("organizacao", { acao: "avaliar-ciclo", tipo: "grupo", id: "grp-a", mes: mesAtras(n), nivelAvaliado: "2", evidenciaCiclo: "Critério cumprido" });
    }
    const negada = await painel.postar("organizacao", { acao: "grupo-salvar", id: "grp-a", maturidade: "2", evidencia: "Rotina documentada" });
    assert.match(negada.html, new RegExp(mesAtras(2)));
    assert.equal(painel.ler("temas")[0].maturidade, 1);
    for (const n of [2, 1]) {
      await painel.postar("organizacao", { acao: "avaliar-ciclo", tipo: "grupo", id: "grp-a", mes: mesAtras(n), nivelAvaliado: "2", evidenciaCiclo: "Evidência corrigida" });
    }
    await painel.postar("organizacao", { acao: "grupo-salvar", id: "grp-a", maturidade: "2", evidencia: "Rotina documentada" });
    assert.equal(painel.ler("temas")[0].maturidade, 2);
    assert.equal(painel.ler("temas")[0].avaliacoes.length, 3);
  });
  test("consolidação exige substituto e reclassificação exige justificativa", async () => {
    const u = unidade();
    painel.gravar("nucleos", [{ ...u, nivel: "T2", substitutoId: "", avaliacoes: [1, 2].map(n => ({ mes: mesAtras(n), nivel: 3, evidencia: "Autonomia documentada" })) }]);
    const r = await painel.postar("organizacao", { acao: "nucleo-salvar", id: "nuc-a", nivel: "T3", evidencia: "Planejamento e continuidade" });
    assert.match(r.html, /substituto para garantir continuidade/);
    const sem = await painel.postar("organizacao", { acao: "nucleo-salvar", id: "nuc-a", nivel: "T1" });
    assert.match(sem.html, /justificativa com evidência/);
    assert.equal(painel.ler("nucleos")[0].nivel, "T2");
  });
});

interface Nivel { nivel: string; revisao: { rebaixamentos: number; pendentes: string[]; trimestres: unknown[] } }
function nivel(meses: object[], agora = "2026-10-01T12:00:00-03:00"): Nivel {
  const [pv] = chamarPhp([{ fn: "normalizar_porta_voz", args: [{ id: "pv-a", nome: "Ana", redesEm: "2025-01-01", criadoEm: "2025-01-01", meses }] }]);
  return chamarPhp([{ fn: "nivel_liga", args: [pv, Date.parse(agora) / 1000] }])[0] as Nivel;
}
const fechamento = (mes: string, total: number, acoes = 1) => ({ mes, redes: { instagram: total }, engajamento: 4, semanasSeguidas: 12, acoes });
const base = [fechamento("2025-10", 1000), fechamento("2025-11", 1100), fechamento("2025-12", 1200)];

describe("Liga: revisão em trimestres completos", () => {
  test("um mês parado conserva o C conquistado", () => {
    assert.equal(nivel([...base, fechamento("2026-01", 1200)], "2026-02-01T12:00:00-03:00").nivel, "C");
  });
  test("dois trimestres consecutivos sem crescimento retiram só um nível", () => {
    const meses = [...base, ...["01", "02", "03", "04", "05", "06"].map(m => fechamento(`2026-${m}`, 1200))];
    const n = nivel(meses, "2026-07-01T12:00:00-03:00");
    assert.equal(n.nivel, "D");
    assert.equal(n.revisao.rebaixamentos, 1);
    assert.equal(nivel(meses, "2026-06-30T12:00:00-03:00").nivel, "C", "trimestre em andamento não rebaixa");
  });
  test("crescer sem ação local também rebaixa", () => {
    const meses = [...base, ...["01", "02", "03", "04", "05", "06"].map((m, i) => fechamento(`2026-${m}`, 1300 + 100 * i, 0))];
    assert.equal(nivel(meses, "2026-07-01T12:00:00-03:00").nivel, "D");
  });
  test("fechamento ausente deixa pendência, não vira fracasso; meses esparsos não formam trimestre", () => {
    const meses = [...base, ...["01", "03", "04", "05", "06"].map(m => fechamento(`2026-${m}`, 1200))];
    const n = nivel(meses, "2026-07-01T12:00:00-03:00");
    assert.equal(n.nivel, "C");
    assert.ok(n.revisao.pendentes.some(p => p.includes("2026-02")));
  });
  test("dois trimestres com saldo total positivo ainda rebaixam se cada um falhar em um critério", () => {
    const meses = [...base, fechamento("2026-01", 1300, 0), fechamento("2026-02", 1400, 0), fechamento("2026-03", 1500, 0),
      fechamento("2026-04", 1500), fechamento("2026-05", 1500), fechamento("2026-06", 1500)];
    assert.equal(nivel(meses, "2026-07-01T12:00:00-03:00").nivel, "D");
  });
  test("a revisão atravessa o ano e recupera um nível com trimestre saudável e critérios cumpridos", () => {
    const inicio = [fechamento("2025-07", 1000), fechamento("2025-08", 1100), fechamento("2025-09", 1200)];
    const parados = [...["10", "11", "12"].map(m => fechamento(`2025-${m}`, 1200)), ...["01", "02", "03"].map(m => fechamento(`2026-${m}`, 1200))];
    assert.equal(nivel([...inicio, ...parados], "2026-04-01T12:00:00-03:00").nivel, "D");
    const recuperou = [...inicio, ...parados, fechamento("2026-04", 1300), fechamento("2026-05", 1400), fechamento("2026-06", 1500)];
    assert.equal(nivel(recuperou, "2026-07-01T12:00:00-03:00").nivel, "C");
  });
  test("não há punição abaixo do piso E nem desconto sobre níveis conquistados depois", () => {
    const meses = [fechamento("2025-12", 500), ...["01", "02", "03", "04", "05", "06"].map(m => fechamento(`2026-${m}`, 500))];
    const [pv] = chamarPhp([{ fn: "normalizar_porta_voz", args: [{ id: "pv-a", nome: "Ana", criadoEm: "2025-01-01", meses }] }]);
    const [r] = chamarPhp([{ fn: "nivel_liga", args: [pv, Date.parse("2026-07-01T12:00:00-03:00") / 1000] }]) as Nivel[];
    assert.equal(r.nivel, "E");
    assert.equal(r.revisao.rebaixamentos, 0);
  });
});

const cabecalho = "id;mes;instagram;tiktok;youtube;x;engajamento;semanasSeguidas;todasSemanas;acoes;modulos;lives";
const csv = (seguidores = "1500", mes = mesAtras(1)) => `${cabecalho}\npv-a;${mes};${seguidores};100;20;10;3,5;8;1;1;0;1`;
function tokenDaPrevia(html: string): string {
  const m = html.match(/name="previaToken" value="([a-f0-9]+)"/);
  assert.ok(m, "a prévia precisa permitir confirmar");
  return m[1];
}

describe("Liga: CSV com prévia e confirmação", () => {
  beforeEach(() => painel.gravar("liga", [{ id: "pv-a", nome: "Ana", publicado: true }]));
  test("prévia não grava; confirmar importa e repetir o mês corrige sem duplicar", async () => {
    const p = await painel.postar("organizacao", { acao: "pv-importar-previa", csvLiga: csv() });
    assert.equal(painel.ler("liga")[0].meses.length, 0);
    const r = await painel.postar("organizacao", { acao: "pv-importar-gravar", previaToken: tokenDaPrevia(p.html) });
    assert.match(r.html, /Planilha importada/);
    let m = painel.ler("liga")[0].meses[0];
    assert.equal(m.redes.instagram, 1500);
    assert.equal(m.engajamento, 3.5);
    assert.equal(m.origem, "planilha");
    assert.ok(m.por);
    const p2 = await painel.postar("organizacao", { acao: "pv-importar-previa", csvLiga: csv("1800") });
    assert.match(p2.html, /Corrigir fechamento existente/);
    await painel.postar("organizacao", { acao: "pv-importar-gravar", previaToken: tokenDaPrevia(p2.html) });
    const pv = painel.ler("liga")[0];
    assert.equal(pv.meses.length, 1);
    m = pv.meses[0];
    assert.equal(m.redes.instagram, 1800);
    const repetida = await painel.postar("organizacao", { acao: "pv-importar-gravar", previaToken: tokenDaPrevia(p2.html) });
    assert.match(repetida.html, /prévia expirou/);
  });
  test("negativo, id desconhecido, mês futuro e duplicata impedem confirmação", async () => {
    for (const texto of [csv("-1"), csv().replace("pv-a;", "pv-desconhecido;"), csv("1500", "2099-01"), csv() + "\n" + csv().split("\n")[1]]) {
      const p = await painel.postar("organizacao", { acao: "pv-importar-previa", csvLiga: texto });
      assert.match(p.html, /Corrija as linhas inválidas/);
      assert.doesNotMatch(p.html, /name="previaToken"/);
      assert.equal(painel.ler("liga")[0].meses.length, 0);
    }
  });
  test("token errado e porta-voz encerrado depois da prévia não gravam", async () => {
    const p = await painel.postar("organizacao", { acao: "pv-importar-previa", csvLiga: csv() });
    await painel.postar("organizacao", { acao: "pv-importar-gravar", previaToken: "invalido" });
    assert.equal(painel.ler("liga")[0].meses.length, 0);
    await painel.postar("organizacao", { acao: "pv-encerrar", id: "pv-a" });
    const r = await painel.postar("organizacao", { acao: "pv-importar-gravar", previaToken: tokenDaPrevia(p.html) });
    assert.match(r.html, /Liga mudou/);
    assert.equal(painel.ler("liga")[0].meses.length, 0);
  });
  test("CSV com BOM, vírgula e upload passa pelo mesmo fluxo", async () => {
    const texto = "\uFEFF" + csv().replace("3,5", "3.5").replaceAll(";", ",");
    const p = await painel.postarComArquivo("organizacao", { acao: "pv-importar-previa" }, {
      csvLigaArquivo: { nome: "liga.csv", conteudo: new TextEncoder().encode(texto), tipo: "text/csv" },
    });
    await painel.postar("organizacao", { acao: "pv-importar-gravar", previaToken: tokenDaPrevia(p.html) });
    assert.equal(painel.ler("liga")[0].meses[0].redes.instagram, 1500);
  });
  test("modelo traz os ids da equipe; alteração após prévia impede sobrescrever o fechamento", async () => {
    const modelo = await painel.buscar("organizacao", "modelo-liga=1");
    assert.match(modelo.cabecalhos?.["content-type"] ?? "", /text\/csv/);
    assert.match(modelo.html, /pv-a;/);
    const p = await painel.postar("organizacao", { acao: "pv-importar-previa", csvLiga: csv() });
    await painel.postar("organizacao", { acao: "pv-mes", id: "pv-a", mes: mesAtras(1), "redes[instagram]": "2000" });
    const r = await painel.postar("organizacao", { acao: "pv-importar-gravar", previaToken: tokenDaPrevia(p.html) });
    assert.match(r.html, /Liga mudou/);
    assert.equal(painel.ler("liga")[0].meses[0].redes.instagram, 2000);
  });
  test("fechamento manual rejeita engajamento vazio e seguidores negativos", async () => {
    for (const campos of [{ engajamento: "" }, { "redes[instagram]": "-100" }]) {
      const r = await painel.postar("organizacao", { acao: "pv-mes", id: "pv-a", mes: mesAtras(1), ...campos });
      assert.match(r.html, /Confira/);
      assert.equal(painel.ler("liga")[0].meses.length, 0);
    }
  });
  test("importação e avaliações exigem a área Organização e token CSRF", async () => {
    painel.trocarCapacidades("comunicacao");
    try {
      const r = await painel.postar("organizacao", { acao: "pv-importar-previa", csvLiga: csv() });
      assert.equal(r.location, "/painel/?negado=organizacao");
      const download = await painel.buscar("organizacao", "modelo-liga=1");
      assert.equal(download.status, 302);
    } finally {
      painel.trocarCapacidades("adm");
    }
    const negado = await painel.postar("organizacao", { acao: "pv-importar-previa", csvLiga: csv(), csrf: "" });
    assert.equal(negado.location, "/painel/");
    assert.equal(painel.ler("liga")[0].meses.length, 0);
  });
});
