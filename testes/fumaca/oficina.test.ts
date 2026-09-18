import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * A Oficina inteira, em silêncio — as três abas, vazias e com dado.
 *
 * Vazia é o estado em que ela nasce e o estado em que quem recebe a capacidade
 * Criação a vê pela primeira vez: se a tela quebrar aí, quebra justamente para
 * quem ainda não tem nada investido nela.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

const ABAS = ["", "aba=formatos", "aba=numeros"];

describe("fumaça: a Oficina vazia", () => {
  before(() => painel.gravar("oficina", []));

  for (const qs of ABAS) {
    test(`oficina${qs ? "?" + qs : ""} desenha inteira e calada`, () => {
      const { html, erros } = painel.abrir("oficina", qs);
      assert.doesNotMatch(erros, /Warning|Undefined|Deprecated/, erros);
      assert.match(html, /<\/html>\s*$/, "a tela terminou no meio");
    });
  }

  test("a aba Hoje abre com UM formato, e é o primeiro do catálogo", () => {
    const { html } = painel.abrir("oficina", "");
    assert.match(html, /O formato da vez/);
    assert.match(html, /Tela Dividida/);
    /* Um de cada vez: o segundo da fila só aparece na linha do "depois dele",
       e o catálogo inteiro mora na aba do lado. */
    assert.match(html, /Depois dele:/);
  });

  test("o formato da vez traz os links da aula — é o que o curso adiciona", () => {
    const { html } = painel.abrir("oficina", "");
    assert.match(html, /hotmart\.com/);
    assert.match(html, /trello\.com/);
  });

  test("todo vazio que promete ação tem um botão", () => {
    const { html } = painel.abrir("oficina", "aba=numeros");
    const vazios = [...html.matchAll(/<p class="vazio" data-acao>([\s\S]*?)<\/p>/g)];
    assert.ok(vazios.length >= 1, "a aba Números vazia não oferece saída nenhuma");
    for (const [, corpo] of vazios) assert.match(corpo, /<a class="btn/);
  });
});

describe("fumaça: a Oficina em uso", () => {
  before(() => {
    painel.gravar("oficina", [
      {
        id: "t1", pessoa: ADMIN, formato: "tela-dividida", estado: "publicado",
        tema: "fila do SUS no Conjunto Ceará", gancho: "diagnostico",
        link: "https://instagram.com/reel/um", publicadoEm: "2026-09-10",
        views: 8200, retencao: 41, salvamentos: 210, comentarios: 44, seguidores: 31,
      },
      {
        id: "t2", pessoa: ADMIN, formato: "narrado", estado: "publicado",
        tema: "o que mudou no transporte", gancho: "curiosidade",
        publicadoEm: "2026-09-12",
        views: 3100, retencao: 22, salvamentos: 40, comentarios: 9, seguidores: 4,
      },
      {
        id: "t3", pessoa: ADMIN, formato: "trivial", estado: "publicado",
        tema: "sem medida ainda", publicadoEm: "2026-09-14",
      },
      {
        id: "t4", pessoa: ADMIN, formato: "tela-verde", estado: "gravado",
        tema: "pauta do dia", adiadoEm: "2026-09-13T10:00:00-03:00",
      },
    ]);
  });

  for (const qs of ABAS) {
    test(`oficina${qs ? "?" + qs : ""} desenha inteira e calada`, () => {
      const { html, erros } = painel.abrir("oficina", qs);
      assert.doesNotMatch(erros, /Warning|Undefined|Deprecated/, erros);
      assert.match(html, /<\/html>\s*$/, "a tela terminou no meio");
    });
  }

  test("o publicado sai da fila, e o adiado não tranca o próximo", () => {
    const { html } = painel.abrir("oficina", "");
    assert.doesNotMatch(html, /O formato da vez[\s\S]{0,400}Tela Dividida/, "o publicado continua sendo oferecido");
    /* Tela Verde está adiada e Narrado publicado: quem assume é Palestrinha. */
    assert.match(html, /Palestrinha/);
  });

  test("a aba Números ordena por retenção, e o melhor aparece no topo", () => {
    const { html } = painel.abrir("oficina", "aba=numeros");
    assert.match(html, /Os que mais seguraram quem chegou/);
    const topo = html.indexOf("Tela Dividida");
    const abaixo = html.indexOf("Narrado");
    assert.ok(topo > 0 && topo < abaixo, "41% deveria vir antes de 22%");
  });

  test("o publicado sem medida aparece como falta medir, e não como zero", () => {
    const { html } = painel.abrir("oficina", "aba=numeros");
    assert.match(html, /falta medir/);
    assert.doesNotMatch(html, /sem medida ainda[\s\S]{0,200}0% · 0 views/);
  });

  test("a aba Formatos mostra os 37 com a situação de cada um", () => {
    const { html } = painel.abrir("oficina", "aba=formatos");
    assert.match(html, /Publicado/);
    assert.match(html, /Adiado/);
    assert.match(html, /É o da vez/);
    /* Os 37, e não "os que couberam": o catálogo é fixo e cabe inteiro numa
       tela só — se um sumir, sumiu por defeito, não por recorte. */
    const linhas = [...html.matchAll(/data-rotulo="Formato"/g)];
    assert.equal(linhas.length, 37);
  });

  test("a busca do catálogo acha pelo nome", () => {
    const { html, erros } = painel.abrir("oficina", "aba=formatos&q=faceless");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /Faceless/);
    assert.doesNotMatch(html, /Palestrinha/);
  });

  test("o formulário de números abre pelo registro, e traz o que já foi medido", () => {
    const { html, erros } = painel.abrir("oficina", "aba=numeros&editar=t1");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /fila do SUS/);
    assert.match(html, /value="8200"/);
  });

  test("o Início cobra o formato da vez e os números que faltam", () => {
    const { html, erros } = painel.abrir("index", "");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /Gravar o formato da vez/);
    assert.match(html, /Anotar os números de 1 vídeo/);
  });
});

describe("fumaça: o fecho mostra a métrica, e não a dica", () => {
  /* 36 formatos publicados: só o Formato Combinado sobra na fila. Ele é o
     único do catálogo com tela própria, porque "olhe suas métricas, não seu
     gosto" precisa da métrica na mesma tela. */
  function tudoPublicadoMenosOFecho(comNumero: boolean) {
    const nomes = [
      "tela-dividida", "tela-verde", "palestrinha", "narrado", "cine", "storytelling-visual",
      "experimento-social", "conflito-situacional", "dinamismo", "trivial", "dialogo",
      "caixinha-polemica", "comparacao", "the-office", "lo-fi", "bastidores", "telepatia",
      "analise", "analogia", "vlog", "conversa-de-bar", "criativo-preguicoso", "o-narrador",
      "pov", "antes-e-depois", "lista", "tutorial-relampago", "mito-x-verdade", "reacao",
      "erro-comum", "experimento", "expectativa-x-realidade", "qa", "tier-list", "esquete",
      "faceless",
    ];
    painel.gravar(
      "oficina",
      nomes.map((formato, i) => ({
        id: `f${i}`, pessoa: ADMIN, formato, estado: "publicado",
        tema: `video ${i}`, publicadoEm: "2026-09-01",
        ...(comNumero ? { views: 1000 + i, retencao: i } : {}),
      })),
    );
  }

  test("com número, ele mostra os três de maior retenção", () => {
    tudoPublicadoMenosOFecho(true);
    const { html, erros } = painel.abrir("oficina", "");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /Formato Combinado/);
    assert.match(html, /Os seus três de maior retenção/);
    /* retencao = i, então o último da lista (Faceless, i=35) é o campeão. */
    assert.match(html, /Faceless/);
  });

  test("sem número nenhum, ele manda medir antes de combinar", () => {
    tudoPublicadoMenosOFecho(false);
    const { html, erros } = painel.abrir("oficina", "");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /sem número nenhum anotado/);
  });
});

describe("fumaça: quem já fez", () => {
  before(() => painel.gravar("oficina", []));

  test("o formato da vez mostra exemplos de quem já aplicou", () => {
    const { html, erros } = painel.abrir("oficina", "");
    assert.doesNotMatch(erros, /Warning|Undefined|Deprecated/, erros);
    assert.match(html, /Quem já fez/);
    assert.match(html, /instagram\.com|short\.gy/);
    assert.match(html, /Mais \d+ exemplos/);
  });

  test("os elementos viciantes entram no apoio", () => {
    const { html } = painel.abrir("oficina", "aba=formatos");
    assert.match(html, /Elemento: relevância emocional/);
    assert.match(html, /Elemento: contraste/);
    assert.match(html, /Músicas emocionalmente relevantes/);
  });
});

describe("fumaça: a capa de cada formato", () => {
  before(() => painel.gravar("oficina", []));

  test("sem foto baixada, todo formato mostra o desenho da estrutura", () => {
    const { html, erros } = painel.abrir("oficina", "aba=formatos");
    assert.doesNotMatch(erros, /Warning|Undefined|Deprecated/, erros);
    const desenhos = [...html.matchAll(/class="capa-formato"><svg/g)];
    assert.equal(desenhos.length, 37, "formato sem capa vira cartão vazio na lista");
    assert.match(html, /aria-label="Estrutura do plano: Tela Dividida"/);
  });

  test("o botão de baixar diz quantas faltam e quantas nunca vão existir", () => {
    const { html } = painel.abrir("oficina", "aba=formatos");
    assert.match(html, /Baixar as capas dos reels/);
    assert.match(html, /16 de 16 ainda sem a imagem do vídeo/);
    assert.match(html, /outros 21 não têm reel público/);
  });

  test("com a foto baixada, ela entra no lugar do desenho", () => {
    const imagens = path.join(painel.dir, "dados", "imagens");
    mkdirSync(imagens, { recursive: true });
    writeFileSync(path.join(imagens, "oficina-tela-dividida.jpg"), "capa de mentira");

    const { html, erros } = painel.abrir("oficina", "aba=formatos");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /src="\/dados\/imagens\/oficina-tela-dividida\.jpg"/);
    assert.match(html, /alt="Capa do reel de Tela Dividida"/);
    /* Um a menos no desenho, e um a menos na conta do botão — a foto SUBSTITUI
       o desenho, não se soma a ele. */
    assert.equal([...html.matchAll(/class="capa-formato"><svg/g)].length, 36);
    assert.match(html, /15 de 16 ainda sem a imagem do vídeo/);
  });

  test("o formato da vez mostra a capa grande", () => {
    const { html, erros } = painel.abrir("oficina", "");
    assert.doesNotMatch(erros, /Warning|Undefined/, erros);
    assert.match(html, /capa-formato capa-grande/);
  });
});

describe("fumaça: quem não tem a Oficina não a vê", () => {
  test("sem a capacidade Criação, a tela redireciona em vez de desenhar", () => {
    painel.trocarCapacidades("comunicacao");
    const { html } = painel.abrir("oficina", "");
    assert.doesNotMatch(html, /<!doctype html>/i, "a tela desenhou em vez de redirecionar");
    painel.trocarCapacidades("adm");
  });

  test("e a Oficina não aparece no menu de quem não a tem", () => {
    painel.trocarCapacidades("eventos");
    const { html } = painel.abrir("index", "");
    assert.doesNotMatch(html, /Oficina de formatos/);
    painel.trocarCapacidades("adm");
  });
});
