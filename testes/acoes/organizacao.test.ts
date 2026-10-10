import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * A ORGANIZAÇÃO — núcleos, grupos temáticos e a Liga dos Porta-vozes.
 *
 * As regras que o plano de 2026–2027 escreveu e que o painel cobra:
 *   - ativo é quem entrega: responsável + entrega no ciclo + próxima marcada;
 *   - um tema, um grupo — e grupo só abre com finalidade, responsável e
 *     primeira entrega;
 *   - a Liga sobe em ordem: não chega ao B quem não passou pelo C;
 *   - o placar soma 100: crescimento 40, engajamento 20, ações 30, constância 10.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/** Hoje e datas relativas no fuso do Ceará, como o painel conta. */
function dia(deslocamento: number): string {
  const d = new Date(Date.now() + deslocamento * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(d);
}

function mesAtras(n: number): string {
  const hoje = new Date(dia(0) + "T12:00:00");
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

describe("organização: núcleos", () => {
  test("cria o núcleo com cidade, e recusa sem ela", async () => {
    const sem = await painel.postar("organizacao", { acao: "nucleo-salvar", nome: "Benfica", cidade: "" });
    assert.match(sem.html, /Escolha a cidade do núcleo/);
    assert.equal(painel.ler("nucleos").length, 0);

    await painel.postar("organizacao", {
      acao: "nucleo-salvar", nome: "Benfica", cidade: "Fortaleza", bairro: "Benfica",
      onda: "1", nivel: "T1", responsavelId: ADMIN, ritmo: "quinzenal",
    });
    const [n] = painel.ler("nucleos");
    assert.equal(n.nome, "Benfica");
    assert.equal(n.onda, 1);
    assert.equal(n.responsavelId, ADMIN);
    /* "Desde quando" nasce junto: é a data do degrau Responsável na escada. */
    assert.notEqual(n.responsavelDesde, "");
  });

  test("formulário curto mexe só no que mandou: marcar a próxima não apaga nome nem responsável", async () => {
    painel.gravar("nucleos", [{
      id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", onda: 1, responsavelId: ADMIN, publicado: true,
      entregas: [{ id: "e1", data: dia(-2), texto: "Escuta" }],
    }]);
    await painel.postar("organizacao", { acao: "nucleo-salvar", id: "nuc-a", proximaData: dia(6), proximaTexto: "Roda" });
    const [n] = painel.ler("nucleos");
    assert.equal(n.nome, "Benfica");
    assert.equal(n.onda, 1);
    assert.equal(n.responsavelId, ADMIN);
    assert.equal(n.publicado, true);
    assert.equal(n.entregas.length, 1);
    assert.equal(n.proximaData, dia(6));
  });

  test("desmarcar 'aparece no site' chega como resposta", async () => {
    painel.gravar("nucleos", [{ id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", publicado: true }]);
    await painel.postar("organizacao", { acao: "nucleo-salvar", id: "nuc-a", publicado: "0" });
    assert.equal(painel.ler("nucleos")[0].publicado, false);
  });

  test("substituto não pode ser o próprio responsável", async () => {
    const r = await painel.postar("organizacao", {
      acao: "nucleo-salvar", nome: "Benfica", cidade: "Fortaleza",
      responsavelId: ADMIN, substitutoId: ADMIN,
    });
    assert.match(r.html, /substituto de si mesmo não substitui ninguém/);
  });

  test("contato que não é https não vai para o site", async () => {
    await painel.postar("organizacao", {
      acao: "nucleo-salvar", nome: "Benfica", cidade: "Fortaleza", contato: "javascript:alert(1)",
    });
    assert.equal(painel.ler("nucleos")[0].contato, "");
  });

  test("ativo é responsável + entrega no ciclo + próxima marcada — as três", async () => {
    painel.gravar("nucleos", [{
      id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN,
      proximaData: dia(7), entregas: [], criadoEm: "2026-10-01T10:00:00-03:00",
    }]);
    let tela = painel.abrir("organizacao").html;
    assert.match(tela, /Parado/);
    assert.match(tela, /falta entrega no ciclo/);

    await painel.postar("organizacao", {
      acao: "entrega", tipo: "nucleo", id: "nuc-a",
      texto: "Escuta na praça, 14 pessoas", data: dia(-2), pessoas: "14",
    });
    const n = painel.ler("nucleos")[0];
    assert.equal(n.entregas.length, 1);
    assert.equal(n.entregas[0].pessoas, 14);
    tela = painel.abrir("organizacao").html;
    assert.match(tela, /selo-ok">Ativo/);
  });

  test("entrega no futuro é recusada — o que vem é a próxima atividade", async () => {
    painel.gravar("nucleos", [{ id: "nuc-a", nome: "Benfica", cidade: "Fortaleza" }]);
    const r = await painel.postar("organizacao", {
      acao: "entrega", tipo: "nucleo", id: "nuc-a", texto: "Encontro", data: dia(3),
    });
    assert.match(r.html, /Entrega é o que já aconteceu/);
    assert.equal(painel.ler("nucleos")[0].entregas.length, 0);
  });

  test("encerrar tira das contas sem apagar o que foi entregue", async () => {
    painel.gravar("nucleos", [{
      id: "nuc-a", nome: "Benfica", cidade: "Fortaleza",
      entregas: [{ id: "e1", data: dia(-3), texto: "Escuta" }],
    }]);
    await painel.postar("organizacao", { acao: "encerrar", tipo: "nucleo", id: "nuc-a" });
    const n = painel.ler("nucleos")[0];
    assert.notEqual(n.encerradoEm, "");
    assert.equal(n.entregas.length, 1);
  });

  test("núcleo sem responsável vira pendência urgente no Início", () => {
    painel.gravar("nucleos", [{ id: "nuc-a", nome: "Benfica", cidade: "Fortaleza" }]);
    const hub = painel.abrir("index").html;
    assert.match(hub, /O núcleo Benfica está sem responsável/);
  });
});

describe("organização: grupos temáticos", () => {
  const grupo = {
    acao: "grupo-salvar", tema: "seguranca",
    finalidade: "Entender a violência nos bairros da onda 1",
    primeiraEntrega: "Diagnóstico de um bairro", primeiraEntregaAte: dia(45),
    responsavelId: ADMIN,
  };

  test("só abre com finalidade, responsável e primeira entrega", async () => {
    const r = await painel.postar("organizacao", { acao: "grupo-salvar", tema: "seguranca" });
    assert.match(r.html, /Antes de abrir um grupo, responda: a finalidade, o responsável, a primeira entrega/);
    assert.equal(painel.ler("temas").length, 0);

    await painel.postar("organizacao", grupo);
    const [g] = painel.ler("temas");
    assert.equal(g.tema, "seguranca");
    /* Abrir pede quatro respostas; as portas nascem do catálogo. */
    assert.equal(g.maturidade, 1);
    assert.equal(g.portaEstudo, "Violência, crime organizado, juventude e território");
  });

  test("um tema, um grupo: o segundo grupo aberto do mesmo tema é recusado", async () => {
    await painel.postar("organizacao", grupo);
    const r = await painel.postar("organizacao", grupo);
    assert.match(r.html, /Já existe um grupo aberto de Segurança pública/);
    assert.equal(painel.ler("temas").length, 1);
  });

  test("tema fora do catálogo não abre", async () => {
    const r = await painel.postar("organizacao", { ...grupo, tema: "seguranca-publica" });
    assert.match(r.html, /Escolha o tema no catálogo/);
  });

  test("encerrado o primeiro, o tema pode abrir de novo — e reabrir o velho é recusado", async () => {
    await painel.postar("organizacao", grupo);
    const velho = painel.ler("temas")[0].id;
    await painel.postar("organizacao", { acao: "encerrar", tipo: "grupo", id: velho });
    await painel.postar("organizacao", grupo);
    assert.equal(painel.ler("temas").length, 2);

    const r = await painel.postar("organizacao", { acao: "reabrir", tipo: "grupo", id: velho });
    assert.match(r.html, /Já existe outro grupo aberto deste tema/);
  });

  test("o quarto grupo abre, mas avisa que o plano pediu três", async () => {
    for (const tema of ["seguranca", "educacao", "saude"]) {
      await painel.postar("organizacao", { ...grupo, tema });
    }
    const r = await painel.postar("organizacao", { ...grupo, tema: "economia" });
    assert.match(r.html, /o plano pediu começar com no máximo 3/);
    assert.equal(painel.ler("temas").length, 4);
  });
});

describe("organização: Liga dos Porta-vozes", () => {
  function comMeses(meses: { mes: string; total: number; eng: number; sem?: number }[], extra: object = {}) {
    painel.gravar("liga", [{
      id: "pv-a", nome: "Ana do Benfica", tema: "seguranca", cidade: "Fortaleza",
      meses: meses.map((m) => ({
        mes: m.mes, redes: { instagram: m.total, tiktok: 0, youtube: 0, x: 0 },
        engajamento: m.eng, semanasSeguidas: m.sem ?? 0,
      })),
      ...extra,
    }]);
  }

  test("põe na Liga e não aceita a mesma pessoa duas vezes", async () => {
    await painel.postar("organizacao", { acao: "pv-salvar", pessoaId: ADMIN, nome: "", tema: "seguranca" });
    const [pv] = painel.ler("liga");
    /* Nome em branco usa o da ficha. */
    assert.equal(pv.nome, "Coordenação de Teste");

    const r = await painel.postar("organizacao", { acao: "pv-salvar", pessoaId: ADMIN, nome: "Outro nome" });
    assert.match(r.html, /já está na Liga/);
    assert.equal(painel.ler("liga").length, 1);
  });

  test("ação local precisa de registro escrito", async () => {
    comMeses([]);
    const r = await painel.postar("organizacao", { acao: "pv-comprovar", id: "pv-a", campo: "acaoEm", acaoTexto: "" });
    assert.match(r.html, /Ação local precisa de registro/);
    assert.equal(painel.ler("liga")[0].acaoEm, "");
  });

  test("comprovação é um clique, guarda a data e se desfaz", async () => {
    comMeses([]);
    await painel.postar("organizacao", { acao: "pv-comprovar", id: "pv-a", campo: "redesEm" });
    assert.equal(painel.ler("liga")[0].redesEm, dia(0));
    await painel.postar("organizacao", { acao: "pv-comprovar", id: "pv-a", campo: "redesEm", valor: "0" });
    assert.equal(painel.ler("liga")[0].redesEm, "");
  });

  test("a ficha não apaga meses nem comprovações que ela não mostra", async () => {
    comMeses([{ mes: mesAtras(1), total: 500, eng: 4 }], { redesEm: "2026-09-01" });
    await painel.postar("organizacao", { acao: "pv-salvar", id: "pv-a", nome: "Ana B.", publicado: "1" });
    const [pv] = painel.ler("liga");
    assert.equal(pv.nome, "Ana B.");
    assert.equal(pv.meses.length, 1);
    assert.equal(pv.redesEm, "2026-09-01");
    assert.equal(pv.tema, "seguranca");
  });

  test("fechar o mesmo mês duas vezes corrige, não duplica", async () => {
    comMeses([]);
    const mes = mesAtras(1);
    await painel.postar("organizacao", { acao: "pv-mes", id: "pv-a", mes, "redes[instagram]": "800", engajamento: "4,2" });
    await painel.postar("organizacao", { acao: "pv-mes", id: "pv-a", mes, "redes[instagram]": "900", engajamento: "4,5" });
    const [pv] = painel.ler("liga");
    assert.equal(pv.meses.length, 1);
    assert.equal(pv.meses[0].redes.instagram, 900);
    assert.equal(pv.meses[0].engajamento, 4.5);
  });

  test("mês que ainda não chegou não fecha", async () => {
    comMeses([]);
    const r = await painel.postar("organizacao", { acao: "pv-mes", id: "pv-a", mes: "2099-01" });
    assert.match(r.html, /Mês que ainda não chegou não fecha/);
  });

  test("sobe em ordem: 50 mil seguidores sem redes estruturadas é nível E", () => {
    comMeses([
      { mes: mesAtras(3), total: 30000, eng: 5, sem: 10 },
      { mes: mesAtras(2), total: 40000, eng: 5, sem: 12 },
      { mes: mesAtras(1), total: 50000, eng: 5, sem: 14 },
    ]);
    const tela = painel.abrir("organizacao", "aba=liga").html;
    assert.match(tela, /<strong>E<\/strong> · Base/);
    assert.match(tela, /Estruturar Instagram, TikTok, YouTube e X/);
  });

  test("com redes, 1.000+, 2 meses crescendo, 8 semanas e 3%: nível C, e o B pede a formação", () => {
    comMeses([
      { mes: mesAtras(3), total: 900, eng: 4 },
      { mes: mesAtras(2), total: 1100, eng: 4 },
      { mes: mesAtras(1), total: 1300, eng: 3.5, sem: 9 },
    ], { redesEm: "2026-09-01" });
    const tela = painel.abrir("organizacao", "aba=liga").html;
    assert.match(tela, /<strong>C<\/strong> · Formação/);
    assert.match(tela, /<strong>B:<\/strong> Concluir a formação de militância/);
  });

  test("o placar do mês soma crescimento, engajamento, ações e constância", () => {
    painel.gravar("liga", [{
      id: "pv-a", nome: "Ana", meses: [
        { mes: mesAtras(2), redes: { instagram: 1000 }, engajamento: 3 },
        /* +5% no mês (20 pts), 4% de engajamento (16), uma ação local e uma
           live (25), todas as semanas (10) = 71. */
        { mes: mesAtras(1), redes: { instagram: 1050 }, engajamento: 4, acoes: 1, lives: 1, todasSemanas: true },
      ],
    }]);
    const tela = painel.abrir("organizacao", "aba=liga").html;
    assert.match(tela, /data-rotulo="Total"><strong>71<\/strong>/);
  });

  test("tirar da Liga guarda o motivo e tira do site", async () => {
    comMeses([], { publicado: true });
    await painel.postar("organizacao", { acao: "pv-encerrar", id: "pv-a", motivo: "Seguidores comprados" });
    const [pv] = painel.ler("liga");
    assert.notEqual(pv.encerradoEm, "");
    assert.equal(pv.encerradoMotivo, "Seguidores comprados");
    assert.equal(pv.publicado, false);
  });
});

describe("organização: a tela com dado abre em silêncio", () => {
  test("as três abas com núcleo, grupo e porta-voz", () => {
    painel.gravar("nucleos", [{
      id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN, publicado: true,
      entregas: [{ id: "e1", data: dia(-3), texto: "Escuta" }], proximaData: dia(5),
    }]);
    painel.gravar("temas", [{
      id: "grp-a", tema: "saude", finalidade: "UPAs", responsavelId: ADMIN, nucleos: ["nuc-a"],
      primeiraEntrega: "Diagnóstico", primeiraEntregaAte: dia(40),
    }]);
    painel.gravar("liga", [{
      id: "pv-a", nome: "Ana", tema: "saude", meses: [{ mes: mesAtras(1), redes: { instagram: 500 }, engajamento: 4 }],
    }]);
    for (const qs of ["", "aba=temas", "aba=liga", "editar=nuc-a", "entrega=nuc-a", "proxima=nuc-a", "resp=nuc-a",
      "aba=temas&editar=grp-a", "aba=temas&novo=seguranca", "aba=liga&fechar=pv-a", "aba=liga&pv=pv-a", "aba=liga&acao-local=pv-a"]) {
      const { html, erros } = painel.abrir("organizacao", qs);
      const ruido = erros.split("\n").filter((l) => /Warning|Notice|Deprecated|Fatal|Uncaught/i.test(l));
      assert.deepEqual(ruido, [], `organizacao?${qs}`);
      assert.match(html, /<\/html>\s*$/, `organizacao?${qs} cortou`);
    }
  });
});

describe("api/organizacao: o que o site público recebe", () => {
  async function api() {
    const r = await painel.buscar("api/organizacao");
    return { json: JSON.parse(r.html), cabecalhos: r.cabecalhos ?? {}, bruto: r.html };
  }

  test("só o publicado e aberto, e nenhum nome de responsável", async () => {
    painel.gravar("nucleos", [
      { id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN, publicado: true,
        contato: "https://chat.whatsapp.com/abc", proximaData: dia(5), proximaTexto: "Escuta aberta",
        entregas: [{ id: "e1", data: dia(-2), texto: "Texto interno da entrega" }] },
      { id: "nuc-b", nome: "Escondido", cidade: "Fortaleza", publicado: false },
      { id: "nuc-c", nome: "Encerrado", cidade: "Fortaleza", publicado: true, encerradoEm: "2026-10-01T10:00:00-03:00" },
    ]);
    painel.gravar("temas", [{
      id: "grp-a", tema: "saude", finalidade: "UPAs", responsavelId: ADMIN, publicado: true,
      nucleos: ["nuc-a", "nuc-b"], primeiraEntrega: "X", primeiraEntregaAte: dia(30),
    }]);
    painel.gravar("liga", [
      { id: "pv-a", nome: "Ana do Benfica", tema: "saude", publicado: true, perfis: { instagram: "ana", tiktok: "" } },
      { id: "pv-b", nome: "Sem autorização", publicado: false },
    ]);

    const { json, bruto, cabecalhos } = await api();
    assert.deepEqual(json.nucleos.map((n: { nome: string }) => n.nome), ["Benfica"]);
    assert.equal(json.nucleos[0].ativo, true);
    assert.deepEqual(json.nucleos[0].proxima, { data: dia(5), texto: "Escuta aberta" });
    /* O núcleo escondido não vaza pelo grupo. */
    assert.deepEqual(json.temas[0].nucleos, ["Benfica"]);
    assert.deepEqual(json.portavozes.map((p: { nome: string }) => p.nome), ["Ana do Benfica"]);
    assert.deepEqual(json.portavozes[0].perfis, { instagram: "ana" });

    assert.doesNotMatch(bruto, /Coordenação de Teste/, "nome de responsável no JSON público");
    assert.doesNotMatch(bruto, /Texto interno da entrega/, "texto de entrega no JSON público");
    assert.match(cabecalhos["content-type"] ?? "", /application\/json/);
  });
});
