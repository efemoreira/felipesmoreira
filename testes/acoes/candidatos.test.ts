import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: candidatos e listas — a colinha que o eleitor leva para a urna.
 *
 * Aqui o erro não é um defeito de tela: é um voto que não vai para ninguém.
 * Três travas respondem por isso, e nenhuma delas se vê lendo o formulário:
 *
 * - **o cargo confere o número** — vereador com quatro dígitos não é um número
 *   quase certo;
 * - **sem número não vai ao ar** — o painel dizia "no ar" para uma ficha que o
 *   site nunca mostrou, e painel que mente é pior que painel que recusa;
 * - **recolher tira de todas as listas de uma vez**, na saída e não na
 *   gravação: quem recolhe não deveria ter de lembrar de editar cinco listas.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

/** Cadastra um candidato e devolve a ficha dele. */
async function cadastrar(campos: Record<string, string> = {}) {
  await painel.postar("candidatos", {
    acao: "cand-novo",
    nome: "Ana Ribeiro",
    urna: "Ana Ribeiro",
    cargo: "deputado-federal",
    numero: "1414",
    partido: "MISSÃO",
    ...campos,
  });
  return painel.ler("pessoas").find((p) => p.nome === (campos.nome ?? "Ana Ribeiro"));
}

describe("ação: cadastrar candidato", () => {
  test("cadastra, e a pessoa passa a ser do tipo candidato", async () => {
    const ana = await cadastrar();

    assert.ok(ana, "não cadastrou");
    assert.equal(ana.tipo, "candidato");
    assert.equal(ana.numero, "1414");
    assert.equal(ana.publicado, false, "candidato nasce fora do ar, e se publica depois");
  });

  test("sem número não cadastra — a colinha existe para o número", async () => {
    const antes = painel.ler("pessoas").length;
    const r = await painel.postar("candidatos", {
      acao: "cand-novo",
      nome: "Sem Número",
      cargo: "deputado-federal",
      numero: "",
    });

    assert.match(r.html, /sem o número não dá para votar/i);
    assert.equal(painel.ler("pessoas").length, antes);
  });

  test("o cargo confere os dígitos, e recusa o que não bate", async () => {
    const antes = painel.ler("pessoas").length;
    const r = await painel.postar("candidatos", {
      acao: "cand-novo",
      nome: "Vereador Errado",
      cargo: "vereador",
      numero: "1414", // vereador tem 5 dígitos
    });

    assert.match(r.html, /dígitos/);
    assert.equal(painel.ler("pessoas").length, antes, "número com dígito a menos entrou");
  });

  test("cargo inventado no POST não cai dentro de CARGOS", async () => {
    await painel.postar("candidatos", {
      acao: "cand-novo",
      nome: "Cargo Inventado",
      cargo: "imperador",
      numero: "77",
    });

    /* O aviso do PHP já derrubaria o `postar()` — `CARGOS[$cargo]` de um cargo
       que não existe é exatamente o índice indefinido que isto pega. */
    const p = painel.ler("pessoas").find((x) => x.nome === "Cargo Inventado");
    if (p) {
      assert.equal(p.cargo, "", "cargo inventado ficou gravado na ficha");
    }
  });

  test("corrigir o candidato não apaga o resto da ficha da pessoa", async () => {
    /* Um candidato pode ser alguém que já estava na lista — com telefone e um
       histórico de encontros. Sobrescrever a ficha inteira apagaria isso. */
    await painel.postar("candidatos", {
      acao: "cand-salvar",
      id: "pes00000000teste",
      nome: "Maria da Silva Sauro",
      cargo: "deputado-estadual",
      numero: "14140",
    });

    const maria = painel.ler("pessoas").find((p) => p.id === "pes00000000teste");
    assert.equal(maria.tipo, "candidato");
    assert.equal(maria.numero, "14140");
    assert.equal(maria.telefone, "85999990000", "o telefone da ficha sumiu");
    assert.equal(maria.bairro, "Benfica", "o endereço da ficha sumiu");
  });
});

describe("ação: publicar e recolher candidato", () => {
  test("publica e recolhe, e é sempre a mesma pessoa", async () => {
    const ana = await cadastrar();

    await painel.postar("candidatos", { acao: "cand-publicar", id: ana.id });
    assert.equal(painel.ler("pessoas").find((p) => p.id === ana.id).publicado, true);

    await painel.postar("candidatos", { acao: "cand-publicar", id: ana.id });
    assert.equal(painel.ler("pessoas").find((p) => p.id === ana.id).publicado, false);
    assert.ok(painel.ler("pessoas").some((p) => p.id === ana.id), "recolher apagou a pessoa");
  });

  test("recolher da candidatura não apaga a pessoa nem o histórico dela", async () => {
    await painel.postar("candidatos", {
      acao: "cand-salvar",
      id: "pes00000000teste",
      nome: "Maria da Silva Sauro",
      cargo: "deputado-estadual",
      numero: "14140",
    });

    await painel.postar("candidatos", { acao: "cand-apagar", id: "pes00000000teste" });

    const maria = painel.ler("pessoas").find((p) => p.id === "pes00000000teste");
    assert.ok(maria, "deixar de ser candidato apagou a pessoa");
    assert.equal(maria.tipo, "apoiador");
    assert.equal(maria.numero, "");
    assert.equal(painel.ler("presencas").length, 1, "o histórico de encontro dela foi junto");
  });
});

describe("ação: as listas são a curadoria", () => {
  /** Cria uma lista e devolve o id dela. */
  async function criarLista(nome = "Deputados federais"): Promise<string> {
    await painel.postar("candidatos", { acao: "lista-nova", nome }, "aba=listas");
    const l = painel.ler("listas").find((x) => x.nome === nome);
    assert.ok(l, "a lista não foi criada");
    return l.id;
  }

  test("sem nome não cria — é o nome que vira título da colinha", async () => {
    const r = await painel.postar("candidatos", { acao: "lista-nova", nome: "  " }, "aba=listas");

    assert.match(r.html, /Dê um nome à lista/);
    assert.equal(painel.ler("listas").length, 0);
  });

  test("uma lista só vai para a home — marcar a segunda desmarca a primeira", async () => {
    const a = await criarLista("As mulheres da chapa");
    const b = await criarLista("Os que eu apoio");

    await painel.postar("candidatos", { acao: "lista-home", id: a }, "aba=listas");
    await painel.postar("candidatos", { acao: "lista-home", id: b }, "aba=listas");

    const listas = painel.ler("listas");
    assert.equal(listas.find((l) => l.id === a).naHome, false, "sobraram duas listas na home");
    assert.equal(listas.find((l) => l.id === b).naHome, true);
  });

  test("a ordem marcada é a ordem da colinha, e não a dos checkboxes", async () => {
    const primeira = await cadastrar({ nome: "Ana Ribeiro" });
    const segunda = await cadastrar({ nome: "Bruno Costa", numero: "1415" });
    const lista = await criarLista();

    await painel.postar(
      "candidatos",
      {
        acao: "lista-quem",
        id: lista,
        candidato: [primeira.id, segunda.id],
        ordem_ids: `${segunda.id},${primeira.id}`,
      },
      "aba=listas",
    );

    assert.deepEqual(
      painel.ler("listas").find((l) => l.id === lista).candidatos,
      [segunda.id, primeira.id],
      "a colinha saiu na ordem dos checkboxes, e não na que a coordenação arrastou",
    );
  });

  test("apagar a lista não apaga quem estava nela", async () => {
    const ana = await cadastrar();
    const lista = await criarLista();
    await painel.postar(
      "candidatos",
      { acao: "lista-quem", id: lista, candidato: [ana.id], ordem_ids: ana.id },
      "aba=listas",
    );

    await painel.postar("candidatos", { acao: "lista-apagar", id: lista }, "aba=listas");

    assert.equal(painel.ler("listas").length, 0);
    assert.ok(painel.ler("pessoas").some((p) => p.id === ana.id), "apagar a lista apagou o candidato");
  });
});

describe("ação: publicar ao salvar", () => {
  /* Publicar era um passo à parte, escondido no menu da linha — e o governador
     ficou em rascunho enquanto o site mostrava o vice. Agora o formulário traz
     "Publicar no site" marcado, e as travas do número continuam na frente. */
  test("salvo com a caixa marcada e número certo, vai direto ao ar", async () => {
    const ana = await cadastrar({ publicado: "1" });
    assert.equal(ana.publicado, true);
  });

  test("número errado para o cargo não grava — muito menos publica", async () => {
    const antes = painel.ler("pessoas").length;
    await painel.postar("candidatos", {
      acao: "cand-novo",
      nome: "Federal Errado",
      cargo: "deputado-federal",
      numero: "141", // federal tem 4 dígitos
      publicado: "1",
    });
    assert.equal(painel.ler("pessoas").length, antes);
  });

  test("editar sem a caixa marcada recolhe para rascunho", async () => {
    const ana = await cadastrar({ publicado: "1" });
    await painel.postar("candidatos", {
      acao: "cand-salvar",
      id: ana.id,
      nome: ana.nome,
      cargo: "deputado-federal",
      numero: "1414",
    });
    assert.equal(painel.ler("pessoas").find((p) => p.id === ana.id).publicado, false);
  });
});

describe("ação: o link das redes", () => {
  test("completa o https de quem digitou sem ele", async () => {
    const ana = await cadastrar({ linkRedes: "linktr.ee/ana" });
    assert.equal(ana.linkRedes, "https://linktr.ee/ana");
  });

  test("esquema que não é https não vira botão no site", async () => {
    const ana = await cadastrar({ linkRedes: "javascript:alert(1)" });
    assert.equal(ana.linkRedes, "");
  });
});

describe("api: o que o site recebe para montar a colinha por cargo", () => {
  test("o vice vai com o titular do mesmo número, e fica sem ele quando o titular não está no ar", async () => {
    const gov = await cadastrar({ nome: "Huggo", urna: "Huggo", cargo: "governador", numero: "14", publicado: "1" });
    await cadastrar({ nome: "Felipe", urna: "Felipe", cargo: "vice-governador", numero: "14", publicado: "1" });
    await cadastrar({ nome: "Renan", urna: "Renan", cargo: "presidente", numero: "14", publicado: "1" });
    await cadastrar({ nome: "Suplente Solto", urna: "Suplente Solto", cargo: "suplente-1", numero: "141", publicado: "1" });
    await cadastrar({ nome: "Rascunho", urna: "Rascunho", cargo: "senador", numero: "142" });

    /* `urna` junto: a API manda o nome de urna, e o `cadastrar()` põe o da Ana por padrão. */
    const r = await painel.buscar("api/candidatos");
    const { candidatos } = JSON.parse(r.html) as { candidatos: Record<string, unknown>[] };
    const por = (nome: string) => candidatos.find((c) => c.nome === nome)!;

    assert.equal(por("Felipe").vice, true);
    assert.equal(por("Felipe").titular, gov.id, "vice de governador não achou o governador de mesmo número");
    assert.equal(por("Felipe").secao, "governador");
    assert.equal(por("Renan").titular, "", "o presidente não é vice do governador só por dividir o 14");
    assert.equal(por("Renan").vice, false);
    assert.equal(por("Suplente Solto").titular, "", "suplente de senador que não está no ar");
    assert.equal(por("Suplente Solto").secao, "senador");
    assert.equal(candidatos.find((c) => c.nome === "Rascunho"), undefined, "rascunho desceu para o site");
  });
});
