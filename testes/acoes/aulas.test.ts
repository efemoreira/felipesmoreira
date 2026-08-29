import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: pendurar o vídeo de uma aula.
 *
 * É o único POST da frente de estudo, e o que ele grava não tem desfazer óbvio:
 * um link errado publica um player que manda o time para o vídeo de outra
 * pessoa. As duas regras que este arquivo prende são as que evitam isso — o
 * link tem de ser reconhecível como YouTube, e publicar é uma decisão à parte
 * de guardar o link.
 *
 * A volta também é regra: a tela virou três abas, e a âncora da aula só existe
 * na de conteúdo. Sem a aba na URL, salvar devolvia a pessoa para o topo de uma
 * tela que não tem aquele id.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const AULA = "regras-de-todos";

/**
 * Os vídeos gravados, por aula.
 *
 * `dados/aulas.php` guarda `['videos' => [aulaId => …]]`, e o `ler()` do
 * sandbox achata o topo do arquivo — então o mapa que interessa é o primeiro
 * (e único) valor. Sem este atalho, cada teste repetiria o mesmo destrinchar.
 */
const videos = (): Record<string, { id: string; publicada: boolean }> =>
  (painel.ler("aulas")[0] ?? {}) as Record<string, { id: string; publicada: boolean }>;

describe("ação: o vídeo de uma aula", () => {
  test("salva o link, guarda como rascunho e volta para a aba de conteúdo", async () => {
    const r = await painel.postar("aulas", {
      acao: "video",
      aula: AULA,
      link: "https://youtu.be/abcdefghijk",
    });

    assert.equal(r.location, `/painel/aulas.php?aba=conteudo#${AULA}`);

    assert.equal(videos()[AULA].id, "abcdefghijk");
    assert.equal(
      videos()[AULA].publicada,
      false,
      "sem marcar a caixa, o vídeo tem de ficar guardado sem ninguém ver",
    );
  });

  test("marcar a caixa é o que publica o player em /aulas", async () => {
    await painel.postar("aulas", {
      acao: "video",
      aula: AULA,
      link: "https://www.youtube.com/watch?v=abcdefghijk",
      publicada: "1",
    });

    assert.equal(videos()[AULA].publicada, true);
  });

  test("link que não é do YouTube não entra, e a tela diz por quê", async () => {
    const r = await painel.postar("aulas", {
      acao: "video",
      aula: AULA,
      link: "https://exemplo.com/um-video",
    });

    assert.deepEqual(Object.keys(videos()), [], "gravou um link que não é vídeo");
    assert.match(r.html, /Não reconheci esse link do YouTube/i);
  });

  test("aula que não existe não grava nada", async () => {
    await painel.postar("aulas", {
      acao: "video",
      aula: "aula-inventada",
      link: "https://youtu.be/abcdefghijk",
    });

    assert.deepEqual(Object.keys(videos()), []);
  });

  test("remover tira o vídeo e a aula continua existindo pelo texto", async () => {
    await painel.postar("aulas", { acao: "video", aula: AULA, link: "https://youtu.be/abcdefghijk" });
    await painel.postar("aulas", { acao: "remover", aula: AULA });

    assert.deepEqual(Object.keys(videos()), [], "o vídeo não saiu");
  });
});

describe("acompanhamento: os estados saem do que já está gravado", () => {
  /**
   * "Travou" é a única leitura desta tela que a coordenação não consegue fazer
   * de cabeça, e é a que o plano cobra: mais de sete dias sem concluir nada,
   * com as Pistas Rápidas ainda abertas. O carimbo já existia no progresso —
   * o que faltava era alguém perguntar por ele.
   */
  const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  test("sem nada concluído, a pessoa aparece como “Não começou”", () => {
    const { html } = painel.abrir("aulas", "aba=estudo");
    assert.match(html, /Não começou/);
    assert.match(html, /nunca abriu uma/);
  });

  test("parada há mais de sete dias, vira “Travou” com o tempo na tela", () => {
    painel.gravar("aulas-progresso", { [ADMIN]: { [AULA]: diasAtras(20) } });

    const { html } = painel.abrir("aulas", "aba=estudo");
    assert.match(html, /Travou/);
    assert.match(html, /há 20 dias/, "a tela não diz há quanto tempo — sem isso não dá para priorizar");
  });

  test("concluindo hoje, ela está apenas andando", () => {
    painel.gravar("aulas-progresso", { [ADMIN]: { [AULA]: diasAtras(0) } });

    const { html } = painel.abrir("aulas", "aba=estudo");
    assert.match(html, /Andando/);
    assert.doesNotMatch(html, /selo-off">Travou/);
  });
});
