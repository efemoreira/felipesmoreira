import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: o encontro — criar, marcar o checklist, tirar alguém da lista, apagar.
 *
 * Duas regras deste arquivo não se veem lendo a tela, e são as que doem:
 *
 * 1. **`voltar()` leva a ABA junto da âncora.** A âncora sozinha deixou de
 *    bastar quando a tela virou abas: `#funil` não existe no HTML enquanto a
 *    aba Pessoas estiver fechada, e quem marcasse uma presença cairia no
 *    Preparo sem entender o que aconteceu com a lista.
 * 2. **Encontro com gente na lista não se apaga.** Apagá-lo tiraria o encontro
 *    do histórico de cada uma dessas pessoas, de uma vez e sem desfazer.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const EVENTO = "ev-teste";

/** O dia de um encontro que ainda vem, no formato do `<input type="date">`. */
function daquiADias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

describe("ação: criar encontro", () => {
  test("cria com dia e hora, e publica a agenda na mesma gravação", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "Roda de conversa no Pirambu",
      familia: "publico",
      dia: daquiADias(10),
      hora: "19:00",
      local: "Praça do Pirambu",
      naAgenda: "1",
    });

    assert.equal(r.status, 302);
    const eventos = painel.ler("eventos");
    assert.equal(eventos.length, 2);

    const novo = eventos.find((e) => e.titulo === "Roda de conversa no Pirambu");
    assert.ok(novo, "o encontro não foi gravado");
    /* Dois campos na tela, UM instante no arquivo — com o fuso do Ceará junto,
       que é o que faz ordenar e acender o "ao vivo" na hora certa. */
    assert.match(novo.inicio, /T19:00:00-03:00$/);
    assert.match(r.location, new RegExp(`^/painel/eventos\\.php\\?e=${novo.id}$`));

    /* Publica ao gravar, e não por botão: editar o encontro já exige
       coordenação, e "esqueci de publicar" deixa de existir. */
    assert.match(r.html, /Encontro criado/);
  });

  test("sem título não cria, e diz por quê", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "  ",
      familia: "publico",
      dia: daquiADias(5),
    });

    assert.match(r.html, /Dê um nome ao encontro/);
    assert.equal(painel.ler("eventos").length, 1);
  });

  test("família inválida não cria — é ela que traz o playbook e as travas", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro sem família",
      familia: "inventada",
      dia: daquiADias(5),
    });

    assert.match(r.html, /Escolha a família/);
    assert.equal(painel.ler("eventos").length, 1);
  });

  test("sem dia não cria — é o dia que ordena a agenda", async () => {
    const r = await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro sem data",
      familia: "publico",
      dia: "",
    });

    assert.match(r.html, /pelo menos o dia/);
    assert.equal(painel.ler("eventos").length, 1);
  });

  test("a hora em branco é hora não definida, e não meia-noite anunciada", async () => {
    await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro sem hora",
      familia: "militancia",
      dia: daquiADias(8),
      hora: "",
    });

    const novo = painel.ler("eventos").find((e) => e.titulo === "Encontro sem hora");
    /* Meia-noite em ponto é como isso fica no instante, e `normalizar_evento()`
       traduz o `0H` de volta para vazio: anunciar um encontro à meia-noite
       seria pior do que não anunciar hora nenhuma. */
    assert.match(novo.inicio, /T00:00:00-03:00$/);
    assert.equal(novo.hora, "", "0H tinha de virar 'hora ainda não definida'");
    assert.ok(novo.dia !== "" && novo.data !== "", "o dia continua, que é o que ordena");
  });
});

describe("ação: marcar o checklist", () => {
  test("marca, desmarca, e volta para a aba Preparo", async () => {
    const r = await painel.postar("eventos", {
      acao: "marcar",
      id: EVENTO,
      peca: "divulgacao",
      item: "0",
    });

    /* A âncora leva ao ponto certo; a aba é o que faz o ponto existir. */
    assert.equal(r.location, `/painel/eventos.php?e=${EVENTO}&aba=preparo#peca-divulgacao`);

    const marcado = painel.ler("eventos").find((e) => e.id === EVENTO);
    assert.deepEqual(marcado.feitos.divulgacao, [0]);

    await painel.postar("eventos", { acao: "marcar", id: EVENTO, peca: "divulgacao", item: "0" });
    const desmarcado = painel.ler("eventos").find((e) => e.id === EVENTO);
    assert.deepEqual(desmarcado.feitos.divulgacao, [], "o segundo clique tem de desmarcar");
  });

  test("item fora do checklist não entra no arquivo", async () => {
    const r = await painel.postar("eventos", {
      acao: "marcar",
      id: EVENTO,
      peca: "divulgacao",
      item: "999",
    });

    assert.match(r.html, /Item de checklist desconhecido/);
    const e = painel.ler("eventos").find((x) => x.id === EVENTO);
    assert.deepEqual(e.feitos.divulgacao, [], "um índice inventado entrou no arquivo");
  });

  test("peça inventada não entra no arquivo", async () => {
    const r = await painel.postar("eventos", {
      acao: "marcar",
      id: EVENTO,
      peca: "inventada",
      item: "0",
    });

    assert.match(r.html, /Item de checklist desconhecido/);
    assert.equal(painel.ler("eventos").find((x) => x.id === EVENTO).feitos.inventada, undefined);
  });
});

describe("ação: tirar alguém do encontro", () => {
  test("tira a LINHA, e não a pessoa", async () => {
    const r = await painel.postar("eventos", {
      acao: "tirar-pessoa",
      id: EVENTO,
      lead: "pr-teste",
    });

    assert.equal(painel.ler("presencas").length, 0, "a presença tinha de sair");
    assert.ok(
      painel.ler("pessoas").some((p) => p.id === "pes00000000teste"),
      "tirar do encontro apagou a pessoa do cadastro",
    );
    assert.match(r.html, /saiu da lista deste encontro/);
  });

  test("volta para a aba Pessoas, que é onde a lista está", async () => {
    const r = await painel.postar("eventos", { acao: "tirar-pessoa", id: EVENTO, lead: "pr-teste" });
    assert.equal(r.location, `/painel/eventos.php?e=${EVENTO}&aba=pessoas#pessoas`);
  });

  test("linha de outro encontro não é tirada por engano", async () => {
    const r = await painel.postar("eventos", {
      acao: "tirar-pessoa",
      id: EVENTO,
      lead: "nao-existe",
    });

    assert.match(r.html, /não está na lista deste encontro/);
    assert.equal(painel.ler("presencas").length, 1);
  });
});

/** Um PNG de 1x1 — o menor arquivo que o `getimagesize()` aceita como imagem. */
const PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

/** Os campos que o formulário de Dados manda junto, e sem os quais salvar zera o encontro. */
function dadosDoEncontro(e: Record<string, string>, extra: Record<string, string> = {}) {
  return {
    acao: "salvar",
    id: e.id,
    titulo: e.titulo,
    dia: daquiADias(10),
    hora: "19:00",
    local: e.local ?? "",
    ...extra,
  };
}

describe("ação: a imagem do encontro", () => {
  /** Sobe o PNG e devolve o encontro já com imagem. */
  async function comImagem() {
    const e = painel.ler("eventos")[0];
    await painel.postarComArquivo(
      "eventos",
      dadosDoEncontro(e),
      { imagem: { nome: "cartaz.png", conteudo: PNG, tipo: "image/png" } },
    );
    const salvo = painel.ler("eventos").find((x) => x.id === e.id);
    assert.notEqual(salvo.imagem, "", "o upload não gravou imagem nenhuma");
    return salvo;
  }

  test("“Remover esta imagem” remove — e apaga o arquivo do disco", async () => {
    /* O formulário é multipart e o `<input type=file>` está sempre lá: mesmo sem
       ninguém escolher arquivo, o PHP monta `$_FILES['imagem']` com
       UPLOAD_ERR_NO_FILE. Enquanto `arquivo_simples()` devolvia essa ficha vazia
       como se fosse envio, o `elseif` do "tirar" nunca era alcançado — a caixa
       era marcada, a tela dizia que salvou, e a imagem continuava lá. */
    const com = await comImagem();
    const arquivo = path.join(painel.dir, "dados/imagens", path.basename(com.imagem));
    assert.ok(existsSync(arquivo), "o arquivo da imagem não foi para o disco");

    await painel.postarComArquivo(
      "eventos",
      dadosDoEncontro(com, { tirarImagem: "1" }),
      { imagem: null },  // o campo de arquivo em branco, como o navegador manda
    );

    const depois = painel.ler("eventos").find((e) => e.id === com.id);
    assert.equal(depois.imagem, "", "marcou remover e a imagem continuou no encontro");
    assert.equal(existsSync(arquivo), false, "tirou do encontro e deixou o arquivo no disco");
  });

  test("salvar sem mexer na imagem não apaga a que está lá", async () => {
    const com = await comImagem();

    await painel.postarComArquivo("eventos", dadosDoEncontro(com), { imagem: null });

    const depois = painel.ler("eventos").find((e) => e.id === com.id);
    assert.equal(depois.imagem, com.imagem, "salvar o resto do formulário apagou a imagem");
  });

  test("o filtro grava, e chave inventada cai no padrão", async () => {
    const e = painel.ler("eventos")[0];

    await painel.postar("eventos", dadosDoEncontro(e, { filtro: "desfoque" }));
    assert.equal(painel.ler("eventos").find((x) => x.id === e.id).filtro, "desfoque");

    /* O que chega no POST é texto: sem a conferência contra FILTROS, o site
       receberia uma chave que não existe e cairia no padrão só por sorte. */
    await painel.postar("eventos", dadosDoEncontro(e, { filtro: "escurecer-tudo" }));
    assert.equal(painel.ler("eventos").find((x) => x.id === e.id).filtro, "medio");
  });
});

describe("ação: apagar encontro", () => {
  test("encontro com gente na lista não se apaga", async () => {
    const r = await painel.postar("eventos", { acao: "apagar", id: EVENTO });

    assert.equal(painel.ler("eventos").length, 1, "apagou um encontro que tinha lista");
    assert.equal(painel.ler("presencas").length, 1);
    assert.match(r.html, /Cancelado|cancel/i);
  });

  test("encontro sem ninguém na lista se apaga", async () => {
    await painel.postar("eventos", {
      acao: "criar",
      titulo: "Encontro que não vai acontecer",
      familia: "publico",
      dia: daquiADias(20),
    });
    const vazio = painel.ler("eventos").find((e) => e.titulo === "Encontro que não vai acontecer");

    await painel.postar("eventos", { acao: "apagar", id: vazio.id });

    assert.equal(
      painel.ler("eventos").some((e) => e.id === vazio.id),
      false,
      "encontro sem lista tem de poder ser apagado",
    );
  });
});

/**
 * O FOLLOW-UP: aba própria, e só de quem ainda não é da estrutura.
 *
 * Duas regras que a tela não conta sozinha:
 *
 * 1. **Quem já é militância não é lead.** Sem isso, cada encontro devolvia o
 *    time inteiro para a fila de pendências, e a lista que existe para mostrar
 *    contato novo mostrava gente do grupo. Fila cheia de trabalho que ninguém
 *    vai fazer é fila que se para de abrir.
 * 2. **Marcar um degrau volta para `aba=funil`.** Enquanto o funil morava no
 *    rodapé de Pessoas, o redirecionamento mandava para lá; agora a âncora
 *    `#funil` só existe na aba dele.
 */
describe("ação: o follow-up depois do encontro", () => {
  /** Põe o encontro no passado e a pessoa com o tipo pedido, com check-in feito. */
  function encontroJaAconteceu(tipo: string) {
    const eventos = painel.ler("eventos");
    const quando = new Date();
    quando.setDate(quando.getDate() - 5);
    eventos[0].inicio = quando.toISOString().slice(0, 19) + "-03:00";
    painel.gravar("eventos", eventos);

    const pessoas = painel.ler("pessoas").map((p) =>
      p.id === "pes00000000teste" ? { ...p, tipo } : p,
    );
    painel.gravar("pessoas", pessoas);
  }

  test("quem ainda não é da estrutura entra na fila", async () => {
    encontroJaAconteceu("eleitor");
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=funil`);

    assert.match(html, /Maria da Silva Sauro/, "o lead sumiu do follow-up");
    /* O degrau vencido vira título de grupo: cada um é uma mensagem diferente,
       e escrever "obrigado por ter vindo" junto com "vem no próximo" é o que a
       lista corrida provocava. */
    assert.match(html, /funil-degrau/, "a fila deixou de ser agrupada por degrau");
  });

  test("quem já é militante NÃO entra na fila", async () => {
    encontroJaAconteceu("militante");
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=funil`);

    assert.doesNotMatch(
      html,
      /Maria da Silva Sauro/,
      "quem já está na estrutura virou pendência de follow-up — o funil existe para " +
        "trazer quem está fora, não para cobrar mensagem de quem já entrou",
    );
    assert.match(html, /Follow-up vencido \(0\)/, "a contagem não zerou junto");
  });

  test("o follow-up não aparece mais no rodapé da aba Pessoas", async () => {
    encontroJaAconteceu("eleitor");
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=pessoas`);

    assert.doesNotMatch(
      html,
      /id="funil"/,
      "o funil voltou para o fim da lista de presença, atrás da rolagem que ninguém faz",
    );
    /* E a aba existe, com o número: é ele que chama de volta na segunda-feira. */
    assert.match(html, /aba=funil/, "sumiu o caminho para o follow-up");
  });

  test("marcar um degrau como feito volta para a aba do funil", async () => {
    encontroJaAconteceu("eleitor");
    const r = await painel.postar("eventos", {
      acao: "funil",
      id: EVENTO,
      lead: "pr-teste",
      etapa: "d0",
    });

    assert.equal(r.location, `/painel/eventos.php?e=${EVENTO}&aba=funil#funil`);
    assert.notEqual(
      painel.ler("presencas")[0].funil.d0,
      "",
      "o degrau não foi carimbado",
    );
  });
});
