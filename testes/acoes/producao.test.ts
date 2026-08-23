import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: o quadro de Produção — mover, publicar, apagar.
 *
 * A regra do ledger do manual mora aqui, e ela **avisa sem bloquear**: às vezes
 * o desdobramento do mesmo caso é a pauta certa, e quem decide isso é a
 * coordenação. Mas ninguém publica sem ver o aviso — e é essa metade que um
 * refactor apaga sem que nada quebre visivelmente.
 *
 * A outra é a do rastro: **card publicado não se apaga**, porque o Acervo
 * aponta para o link que está dentro dele.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const CARD = "cd-teste";
const LINK = "https://instagram.com/p/abc123";

describe("ação: publicar card", () => {
  test("exige o link do post — é ele que o Acervo indexa", async () => {
    const r = await painel.postar("producao", { acao: "publicar", id: CARD, linkPost: "" });

    assert.match(r.html, /Cole o link do post/);
    assert.equal(painel.ler("producao").find((c) => c.id === CARD).coluna, "fazendo");
  });

  test("link que não é URL não publica", async () => {
    const r = await painel.postar("producao", {
      acao: "publicar",
      id: CARD,
      linkPost: "instagram, aquele post de ontem",
    });

    assert.match(r.html, /Cole o link do post/);
    assert.equal(painel.ler("producao").find((c) => c.id === CARD).coluna, "fazendo");
  });

  test("publica, carimba a hora e anota no histórico", async () => {
    const r = await painel.postar("producao", { acao: "publicar", id: CARD, linkPost: LINK });

    const c = painel.ler("producao").find((x) => x.id === CARD);
    assert.equal(c.coluna, "publicado");
    assert.equal(c.linkPost, LINK);
    assert.ok(c.publicadoEm, "sem carimbo de publicação o Acervo não sabe quando foi");
    assert.ok(c.historico.length > 0, "publicar tem de deixar linha no histórico");
    assert.match(r.html, /Publicado/);
  });
});

describe("ação: a regra do ledger", () => {
  /** Um segundo card sobre o MESMO alvo — que é o que o ledger vigia. */
  async function segundoCardDoMesmoAlvo(): Promise<string> {
    await painel.postar("fatos", { acao: "aprovar", id: "ft-teste", saida: ["arte"] });
    const novo = painel.ler("producao").find((c) => c.id !== CARD);
    assert.ok(novo, "o card de apoio não foi aberto");
    assert.equal(novo.responsavel, "Secretaria de Infraestrutura");
    return novo.id;
  }

  test("o segundo post sobre o mesmo alvo em 48h é barrado até haver ciência", async () => {
    await painel.postar("producao", { acao: "publicar", id: CARD, linkPost: LINK });
    const segundo = await segundoCardDoMesmoAlvo();

    const r = await painel.postar("producao", {
      acao: "publicar",
      id: segundo,
      linkPost: "https://instagram.com/p/def456",
    });

    assert.match(r.html, /Regra do ledger/);
    assert.notEqual(
      painel.ler("producao").find((c) => c.id === segundo).coluna,
      "publicado",
      "publicou sem mostrar o aviso do ledger",
    );
  });

  test("marcada a ciência, publica — o ledger avisa, não bloqueia", async () => {
    await painel.postar("producao", { acao: "publicar", id: CARD, linkPost: LINK });
    const segundo = await segundoCardDoMesmoAlvo();

    await painel.postar("producao", {
      acao: "publicar",
      id: segundo,
      linkPost: "https://instagram.com/p/def456",
      ciente: "1",
    });

    assert.equal(
      painel.ler("producao").find((c) => c.id === segundo).coluna,
      "publicado",
      "o ledger virou bloqueio — ele é aviso, e quem decide é a coordenação",
    );
  });

  test("alvo diferente não dispara o ledger", async () => {
    await painel.postar("producao", { acao: "publicar", id: CARD, linkPost: LINK });

    const hoje = new Date().toISOString().slice(0, 10);
    await painel.postar("fatos", {
      acao: "enviar",
      oQue: "Creche sem professora em Maracanaú",
      quem: "Prefeitura de Maracanaú",
      quando: hoje,
      fonteUrl: "https://diariooficial.ce.gov.br/creche",
      fonteData: hoje,
      categoria: "gestao",
    });
    const outro = painel.ler("fatos").find((f) => f.oQue.startsWith("Creche sem professora"));
    /* O fato acabou de ser mandado por quem está logado, então a checagem dele
       passa pela regra de "quem traz não checa" — daí o destrava. */
    await painel.postar("fatos", {
      acao: "aprovar",
      id: outro.id,
      saida: ["roteiro"],
      destrava: "Fato de apoio do teste.",
    });
    const card = painel.ler("producao").find((c) => c.fatoId === outro.id);
    assert.ok(card, "o card do outro alvo não foi aberto");

    await painel.postar("producao", {
      acao: "publicar",
      id: card.id,
      linkPost: "https://instagram.com/p/ghi789",
    });

    assert.equal(painel.ler("producao").find((c) => c.id === card.id).coluna, "publicado");
  });
});

describe("ação: apagar card", () => {
  test("card publicado é rastro, e quem não é admin não apaga rastro", async () => {
    await painel.postar("producao", { acao: "publicar", id: CARD, linkPost: LINK });
    /* Só o admin destrava — card publicado por engano também existe. A trava
       vale para todo o resto do time, que é quem trabalha no quadro. */
    painel.trocarCapacidades("comunicacao");

    const r = await painel.postar("producao", { acao: "apagar", id: CARD });

    assert.match(r.html, /Card publicado não se apaga/);
    assert.ok(
      painel.ler("producao").some((c) => c.id === CARD),
      "apagar deixaria peça publicada sem ficha que a justifique",
    );
  });

  test("o admin destrava, porque publicado por engano também existe", async () => {
    await painel.postar("producao", { acao: "publicar", id: CARD, linkPost: LINK });

    await painel.postar("producao", { acao: "apagar", id: CARD });

    assert.equal(painel.ler("producao").some((c) => c.id === CARD), false);
  });

  test("card que nunca foi ao ar se apaga", async () => {
    await painel.postar("producao", { acao: "apagar", id: CARD });
    assert.equal(painel.ler("producao").some((c) => c.id === CARD), false);
  });
});

describe("ação: mover card no quadro", () => {
  test("move para uma coluna que existe", async () => {
    await painel.postar("producao", { acao: "mover", id: CARD, coluna: "revisao" });
    assert.equal(painel.ler("producao").find((c) => c.id === CARD).coluna, "revisao");
  });

  test("coluna inventada não move nada", async () => {
    await painel.postar("producao", { acao: "mover", id: CARD, coluna: "inventada" });
    assert.equal(painel.ler("producao").find((c) => c.id === CARD).coluna, "fazendo");
  });

  test("mover para publicado pela coluna não pula o link do post", async () => {
    await painel.postar("producao", { acao: "mover", id: CARD, coluna: "publicado" });

    const c = painel.ler("producao").find((x) => x.id === CARD);
    if (c.coluna === "publicado") {
      assert.ok(c.linkPost, "entrou em publicado sem o link que o Acervo indexa");
    }
  });
});
