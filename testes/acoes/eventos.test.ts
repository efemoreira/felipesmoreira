import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

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

  test("o grupo de WhatsApp do encontro grava, passa por limpar_link() e some quando apagado", async () => {
    const e = painel.ler("eventos")[0];

    await painel.postar("eventos", dadosDoEncontro(e, { grupo: "chat.whatsapp.com/abc123" }));
    assert.equal(
      painel.ler("eventos").find((x) => x.id === e.id).grupo,
      "https://chat.whatsapp.com/abc123",
      "sem esquema, limpar_link() tinha de completar o https",
    );

    /* javascript: é o esquema que limpar_link() existe para barrar. */
    await painel.postar("eventos", dadosDoEncontro(e, { grupo: "javascript:alert(1)" }));
    assert.equal(painel.ler("eventos").find((x) => x.id === e.id).grupo, "");

    await painel.postar("eventos", dadosDoEncontro(e, { grupo: "https://chat.whatsapp.com/abc123" }));
    await painel.postar("eventos", dadosDoEncontro(e, { grupo: "" }));
    assert.equal(
      painel.ler("eventos").find((x) => x.id === e.id).grupo,
      "",
      "apagar o campo tem de tirar o grupo do encontro",
    );
  });

  test("a família pode ser trocada ao salvar, sem apagar o que já foi feito na anterior", async () => {
    const e = painel.ler("eventos")[0];
    assert.equal(e.familia, "publico");
    assert.deepEqual(e.feitos["local-hora"], [0]);

    await painel.postar("eventos", dadosDoEncontro(e, { familia: "militancia" }));
    const depois = painel.ler("eventos").find((x) => x.id === e.id);
    assert.equal(depois.familia, "militancia", "a família não mudou ao salvar");
    /* Local & Hora existe nas duas famílias — o que já foi marcado nela não
       some só porque a família mudou. `normalizar_evento()` guarda `feitos`
       de TODAS as peças, não só das da família atual, de propósito. */
    assert.deepEqual(depois.feitos["local-hora"], [0], "marcação de peça comum às duas famílias sumiu");

    /* Chave inventada não é família nenhuma: a régua é a mesma do `criar`. */
    await painel.postar("eventos", dadosDoEncontro(depois, { familia: "inventada" }));
    assert.equal(
      painel.ler("eventos").find((x) => x.id === e.id).familia,
      "militancia",
      "chave de família inventada não pode substituir a família válida",
    );
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

/**
 * A ESCALA — quem responde por cada peça, e o que essa pessoa respondeu.
 *
 * `responsaveis[peça]` já existia e sozinho não era escala: era um rótulo cinza
 * ao lado da peça, que a pessoa escalada nunca via. O que faltava era o outro
 * lado, `aceites[peça]` — e com ele uma regra que não se vê lendo a tela:
 *
 * **Trocar de pessoa na peça zera a resposta da anterior.** O aceite é de quem
 * foi convidado, não da peça. Sem isto, o "topou" de quem saiu ficava colado em
 * quem entrou, e a coordenação via a peça resolvida sem que ninguém tivesse
 * sido avisado — o defeito exato que a escala existe para acabar, de volta e
 * em silêncio.
 */
/**
 * A FICHA PÚBLICA DO ENCONTRO — o que o modal da /programacao mostra.
 *
 * `item_publico()` é lista de permissão: só sai o que está enumerado. Este
 * teste prende os dois lados dela — o que TEM de sair (local, endereço, quem
 * responde por cada peça, com o nome encoberto) e o que NUNCA pode sair
 * (orçamento, observações, público esperado, id de pessoa).
 */
describe("ação: gravar o encontro publica a ficha na agenda", () => {
  const lerAgenda = () =>
    JSON.parse(readFileSync(path.join(painel.dir, "dados/agenda.json"), "utf8"));

  test("local, endereço e responsáveis saem; orçamento e observações não", async () => {
    const e = painel.ler("eventos")[0];
    await painel.postar(
      "eventos",
      dadosDoEncontro(e, {
        local: "Praça do Ferreira",
        endereco: "Rua Floriano Peixoto, s/n — Centro",
        orcamento: "R$ 300",
        observacoes: "levar o dinheiro do som",
        publicoEsperado: "80",
        naAgenda: "1",
        "resp[divulgacao][]": ADMIN,
      }),
    );

    const item = lerAgenda().programacao.find((i: { id: string }) => i.id === e.id);
    assert.ok(item, "o encontro não foi publicado");
    assert.equal(item.local, "Praça do Ferreira");
    assert.equal(item.endereco, "Rua Floriano Peixoto, s/n — Centro");
    /* Só as peças com alguém, já com o nome da peça e o nome encoberto: o
       site não recebe id de pessoa nem nome inteiro de voluntário. */
    assert.deepEqual(item.responsaveis, [{ peca: "Divulgação", nomes: ["Coordenação T."] }]);

    const bruto = JSON.stringify(item);
    for (const proibido of ["R$ 300", "levar o dinheiro", "publicoEsperado", "orcamento", "observacoes", ADMIN]) {
      assert.ok(!bruto.includes(proibido), `"${proibido}" vazou para o agenda.json`);
    }
  });

  test("peça sem ninguém não deixa linha, e responsável que sumiu da base também não", async () => {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{
      ...e,
      naAgenda: true,
      responsaveis: { ...e.responsaveis, divulgacao: ["pes-que-nao-existe"], logistica: [] },
    }]);
    await painel.postar("eventos", dadosDoEncontro(e, { naAgenda: "1" }));

    const item = lerAgenda().programacao.find((i: { id: string }) => i.id === e.id);
    assert.ok(item);
    assert.deepEqual(item.responsaveis, []);
  });
});

describe("ação: a escala das cinco peças", () => {
  /* O seed é de família `publico`, e ali a peça da porta é a CAPTAÇÃO: na rua
     não há mesa de recepção, há gente com celular nas pontas. */
  const PECA = "captacao";

  /** O encontro do seed, com a peça já escalada e com a resposta dada. */
  function comPecaDe(chave: string, quem: string, aceite: string) {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{
      ...e,
      responsaveis: { ...e.responsaveis, [chave]: [quem] },
      aceites: { ...e.aceites, [chave]: { [quem]: aceite } },
      convidadoEm: { ...e.convidadoEm, [chave]: { [quem]: "2026-02-01T10:00:00-03:00" } },
    }]);
    return e;
  }

  test("escalar alguém grava o nome e deixa a resposta em branco", async () => {
    const e = painel.ler("eventos")[0];
    await painel.postar(
      "eventos",
      dadosDoEncontro(e, { [`resp[${PECA}][]`]: ADMIN }),
    );

    const salvo = painel.ler("eventos")[0];
    assert.deepEqual(salvo.responsaveis[PECA], [ADMIN]);
    /* Escolhida no `<select>` não é o mesmo que convidada: enquanto ninguém
       mandou o convite, o silêncio é de quem coordena, não da pessoa. */
    /* `[]`, e não `{}`: array vazio do PHP não tem como dizer se é lista ou
       mapa, e o `var_export` grava `array()` — que chega aqui como lista. */
    assert.deepEqual(
      salvo.aceites[PECA],
      [],
      "escolher no select não pode nascer como convite já mandado",
    );
  });

  test("trocar de pessoa na peça zera a resposta da anterior", async () => {
    const e = comPecaDe(PECA, ADMIN, "topou");
    await painel.postar(
      "eventos",
      dadosDoEncontro(e, { [`resp[${PECA}][]`]: "pes00000000teste" }),
    );

    const salvo = painel.ler("eventos")[0];
    assert.deepEqual(salvo.responsaveis[PECA], ["pes00000000teste"]);
    /* `[]`, e não `{}`: array vazio do PHP não tem como dizer se é lista ou
       mapa, e o `var_export` grava `array()` — que chega aqui como lista. */
    assert.deepEqual(
      salvo.aceites[PECA],
      [],
      "o “topou” de quem saiu ficou colado em quem entrou — a peça parece resolvida e ninguém foi avisado",
    );
    assert.deepEqual(salvo.convidadoEm[PECA], [], "o relógio do convite é do convite, não da peça");
  });

  test("salvar o encontro sem mexer na peça preserva a resposta", async () => {
    const e = comPecaDe(PECA, ADMIN, "topou");
    await painel.postar(
      "eventos",
      dadosDoEncontro(e, { [`resp[${PECA}][]`]: ADMIN }),
    );

    /* Trocar o horário do encontro não desconvida ninguém: quem topou continua
       tendo topado, e a coordenação não precisa refazer a escala a cada
       correção de local. */
    assert.equal(painel.ler("eventos")[0].aceites[PECA][ADMIN], "topou");
  });

  test("resposta que não existe no catálogo não vira estado novo", () => {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{
      ...e,
      responsaveis: { ...e.responsaveis, [PECA]: [ADMIN] },
      aceites: { ...e.aceites, [PECA]: { [ADMIN]: "talvez" } },
    }]);

    /* O arquivo é gravado por várias telas; um valor estranho não pode virar um
       estado que nenhuma delas sabe desenhar. Mesma régua de `status`. */
    assert.deepEqual(painel.ler("eventos")[0].aceites[PECA], []);
  });
});

/**
 * O CARTAZ DO QR PRECISA SER ACHADO NA VÉSPERA.
 *
 * O bloco do QR mora na aba Pessoas — onde se trabalha DURANTE o evento. Quem
 * prepara cartaz procura antes, e não achava: a folha de impressão existia e
 * ficava ociosa. Num ato de rua com centenas de pessoas, o QR no banner é a
 * diferença entre levar os contatos para casa e só contar quem apareceu.
 */
describe("a caminho do cartaz do QR", () => {
  test("encontro que ainda vem oferece imprimir o cartaz", async () => {
    const { html } = await painel.buscar("eventos", `e=${EVENTO}`);
    assert.match(html, /Imprimir o cartaz do QR/);
    /* Desde 12/09 o botão leva à folha própria (?cartaz=1), não à aba Pessoas. */
    assert.match(html, /cartaz=1/);
  });

  test("o bloco do QR tem a âncora que esse caminho procura", async () => {
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=pessoas`);
    /* Sem o id, o link cai no topo da aba e a pessoa rola procurando — que é o
       mesmo trabalho que o botão existe para tirar. */
    assert.match(html, /class="qr-bloco" id="qr"/);
  });

  test("encontro sem token não oferece cartaz nenhum", async () => {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{ ...e, token: "" }]);
    const { html } = await painel.buscar("eventos", `e=${EVENTO}`);
    assert.doesNotMatch(html, /Imprimir o cartaz do QR/);
  });
});

/**
 * AS PEÇAS SÃO DA FAMÍLIA, E NÃO DO CATÁLOGO.
 *
 * As cinco valiam para todo mundo: um jantar com empresários e um adesivaço de
 * setecentas pessoas recebiam Local & Hora, Logística, Divulgação, Gravação e
 * Recepção. Metade das peças de qualquer encontro era trabalho que ninguém ia
 * fazer — e é a melhor explicação para nenhuma escala ter sido preenchida em
 * seis encontros: ninguém escala uma lista que não descreve o que está fazendo.
 */
describe("as peças de cada família", () => {
  /** Troca a família do encontro semeado, que nasce em `publico`. */
  function comFamilia(familia: string) {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{ ...e, familia, feitos: {}, responsaveis: {} }]);
  }

  test("a rua oferece material, adesivagem e fila — e não oferece mesa de recepção", async () => {
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    assert.match(html, /Material de rua/);
    assert.match(html, /Adesivagem/);
    assert.match(html, /Fila e trânsito/);
    assert.match(html, /Captação/);
    /* Na rua não há mesa na entrada: quem capta anda com o celular. */
    assert.doesNotMatch(html, /id="peca-recepcao"/);
  });

  test("a formação interna volta a ter Recepção, e não tem peça de rua", async () => {
    comFamilia("militancia");
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    assert.match(html, /id="peca-recepcao"/);
    assert.doesNotMatch(html, /id="peca-adesivagem"/);
  });

  test("o relacional não oferece Gravação — a trava da própria família proíbe", async () => {
    /* "Sem câmera aberta gravando conversa privada" está escrito no playbook
       desta família. Oferecer a peça seria a tela convidando para o que o
       playbook proíbe duas linhas acima. */
    comFamilia("relacional");
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    assert.match(html, /Travas desta família/);
    assert.doesNotMatch(html, /id="peca-gravacao"/);
  });

  test("uma live não tem porta nem logística", async () => {
    comFamilia("digital");
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    assert.doesNotMatch(html, /id="peca-recepcao"/);
    assert.doesNotMatch(html, /id="peca-logistica"/);
    assert.match(html, /id="peca-divulgacao"/);
  });

  test("peça fora da família NÃO some quando já tem dono", async () => {
    /* Encontro antigo foi criado quando as cinco valiam para todos. Fazer o
       nome de quem foi escalado desaparecer porque a régua mudou seria apagar
       trabalho de alguém sem avisar. */
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{
      ...e,
      responsaveis: { ...e.responsaveis, recepcao: [ADMIN] },
    }]);
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    assert.match(html, /id="peca-recepcao"/);
  });

  test("o formulário da escala oferece as mesmas peças que o Preparo cobra", async () => {
    /* O invariante que impede o apagão silencioso: as duas telas e a gravação
       passam pela MESMA `pecas_do_evento()`. Se um dia a aba Dados desenhar um
       conjunto e o `salvar` varrer outro, o que não foi desenhado volta a ser
       gravado como vazio — e ninguém vê acontecer. */
    const preparo = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    const dados = await painel.buscar("eventos", `e=${EVENTO}&aba=dados`);

    const noPreparo = [...preparo.html.matchAll(/id="peca-([a-z-]+)"/g)].map((m) => m[1]);
    const nosDados = [...new Set(
      [...dados.html.matchAll(/name="resp\[([a-z-]+)\]\[\]"/g)].map((m) => m[1]),
    )];

    assert.ok(noPreparo.length > 0, "o Preparo não desenhou peça nenhuma");
    assert.deepEqual(nosDados, noPreparo);
  });
});

/**
 * MONTAR A ESCALA A PARTIR DE QUEM PEDIU A FUNÇÃO.
 *
 * A primeira versão disto copiava o time do encontro anterior — e não tinha de
 * onde copiar: em seis encontros, nenhuma peça foi escalada uma única vez.
 * Partida a frio. A semente certa estava do outro lado do sistema o tempo todo:
 * **81% das pessoas escolheram função ao se inscrever, e ninguém as chamou.**
 */
describe("ação: montar a escala", () => {
  /** Gente com função pedida, com e sem conta no painel. */
  function comGente(fichas: Record<string, unknown>[]) {
    const base = painel.ler("pessoas");
    painel.gravar("pessoas", [...base, ...fichas.map((f, i) => ({
      id: `p-escala-${i}`,
      nome: `Pessoa ${i}`,
      telefone: "85988880000",
      tipo: "militante",
      ativo: true,
      criadoEm: "2026-03-01T10:00:00-03:00",
      ...f,
    }))]);
  }

  test("preenche a peça vazia com quem pediu aquela função", async () => {
    comGente([{ nome: "Ana Divulga", funcoes: ["divulgacao"] }]);

    const r = await painel.postar("eventos", { acao: "montar-escala", id: EVENTO });
    assert.equal(r.status, 302);
    assert.deepEqual(painel.ler("eventos")[0].responsaveis.divulgacao, ["p-escala-0"]);
  });

  test("quem pediu Recepção serve para a Captação da rua", async () => {
    /* A Captação não existia quando 29 pessoas escolheram Recepção — elas
       pegaram a coisa mais próxima que havia no catálogo. Sem o viveiro, a
       sugestão sai vazia justamente na peça com mais voluntários. */
    comGente([{ nome: "Rita Porta", funcoes: ["recepcao"] }]);

    await painel.postar("eventos", { acao: "montar-escala", id: EVENTO });
    assert.deepEqual(painel.ler("eventos")[0].responsaveis.captacao, ["p-escala-0"]);
  });

  test("não sobrescreve peça que já tem gente", async () => {
    comGente([{ nome: "Ana Divulga", funcoes: ["divulgacao"] }]);
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{ ...e, responsaveis: { ...e.responsaveis, divulgacao: [ADMIN] } }]);

    await painel.postar("eventos", { acao: "montar-escala", id: EVENTO });
    /* Sobrescrever escala feita perderia num clique o trabalho de quem escalou
       à mão — e ninguém aperta um botão de novo depois disso. */
    assert.deepEqual(painel.ler("eventos")[0].responsaveis.divulgacao, [ADMIN]);
  });

  test("a mesma pessoa não cobre duas peças no mesmo encontro", async () => {
    comGente([{ nome: "Zé Faz-Tudo", funcoes: ["divulgacao", "gravacao", "captacao"] }]);

    await painel.postar("eventos", { acao: "montar-escala", id: EVENTO });
    const resp = painel.ler("eventos")[0].responsaveis;
    const vezes = Object.values(resp).flat().filter((id) => id === "p-escala-0").length;
    assert.equal(vezes, 1, "o mesmo nome apareceu em duas linhas da escala");
  });

  test("prefere quem foi escalada menos vezes", async () => {
    comGente([
      { nome: "Ana Veterana", funcoes: ["divulgacao"] },
      { nome: "Bia Novata", funcoes: ["divulgacao"] },
    ]);
    /* A veterana já trabalhou noutro encontro. Sem o desempate, a lista sai
       sempre na mesma ordem e a mesma pessoa leva todos os sábados enquanto as
       outras esperam ser chamadas. */
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [e, {
      ...e, id: "ev-antigo", titulo: "Encontro antigo",
      inicio: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      responsaveis: { divulgacao: ["p-escala-0"] },
    }]);

    await painel.postar("eventos", { acao: "montar-escala", id: EVENTO });
    const alvo = painel.ler("eventos").find((x) => x.id === EVENTO)!;
    assert.deepEqual(alvo.responsaveis.divulgacao, ["p-escala-1"]);
  });

  test("não propõe quem saiu do movimento", async () => {
    comGente([{ nome: "Saiu Fora", funcoes: ["divulgacao"], ativo: false }]);

    await painel.postar("eventos", { acao: "montar-escala", id: EVENTO });
    /* Nome inativo na escala devolve uma peça que parece resolvida e não está. */
    assert.deepEqual(painel.ler("eventos")[0].responsaveis.divulgacao, []);
  });

  test("sem ninguém para sugerir, diz o que fazer em vez de gravar vazio", async () => {
    const r = await painel.postar("eventos", { acao: "montar-escala", id: EVENTO });
    assert.match(r.html, /ninguém pediu essas funções ainda/);
  });
});

/**
 * O CONVITE E A ESCALA EM TEXTO.
 *
 * A escala existia no banco e nunca chegava em ninguém: o nome aparecia cinza
 * ao lado da peça e a pessoa não era avisada. No sábado, todo mundo fazia tudo
 * com o que tinha. O painel não é onde o trabalho acontece — é de onde sai a
 * mensagem.
 */
describe("a escala vira mensagem", () => {
  const PECA = "captacao";

  function escalada(estado = "") {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{
      ...e,
      responsaveis: { ...e.responsaveis, [PECA]: [ADMIN] },
      ...(estado ? { aceites: { [PECA]: { [ADMIN]: estado } } } : {}),
    }]);
  }

  test("o convite leva os itens do checklist dentro da mensagem", async () => {
    /* Maria tem telefone e está `pendente`: escalar quem ainda não tem conta é
       o caso normal, não a exceção — das 72 na fila, 58 escolheram função. */
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{
      ...e,
      responsaveis: { ...e.responsaveis, [PECA]: ["pes00000000teste"] },
    }]);
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);

    assert.match(html, /wa\.me\/5585999990000\?text=/, "o convite não virou link de WhatsApp");
    /* Quem recebe precisa saber o tamanho do que está aceitando ANTES de
       responder — "abra o painel para ver o que é" é o pedido que ninguém
       atende. Os itens vão no corpo, percent-encoded no href. */
    assert.match(html, /QR%20do%20encontro%20impresso%20no%20cartaz/);
    assert.match(html, /Topa%3F/);
  });

  test("a escala em texto marca a peça vazia como falta alguém", async () => {
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    assert.match(html, /Copiar a escala para o grupo/);
    /* É o pedido de voluntário se escrevendo sozinho, no lugar em que as
       pessoas já estão. */
    assert.match(html, /falta alguém/);
  });

  test("quem recusou sai da escala que vai para o grupo", async () => {
    escalada("nao-posso");
    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    /* O grupo precisa ler quem VAI estar lá. Nome riscado transformaria o
       recado numa ata. */
    assert.doesNotMatch(html, /Capta&ccedil;&atilde;o — Coordena/);
  });

  test("marcar “Convidei” carimba a hora, e marcar de novo não zera a espera", async () => {
    escalada();
    await painel.postar("eventos", {
      acao: "aceite", id: EVENTO, peca: PECA, quem: ADMIN, estado: "convidado",
    });
    const primeiro = painel.ler("eventos")[0].convidadoEm[PECA][ADMIN];
    assert.ok(primeiro, "o convite não foi carimbado");

    await painel.postar("eventos", {
      acao: "aceite", id: EVENTO, peca: PECA, quem: ADMIN, estado: "convidado",
    });
    /* Quem já esperava três dias continua esperando três dias: reabrir a
       contagem esconderia justamente a peça que precisa ser recolocada. */
    assert.equal(painel.ler("eventos")[0].convidadoEm[PECA][ADMIN], primeiro);
  });

  test("não aceita resposta de quem não está na peça", async () => {
    escalada();
    await painel.postar("eventos", {
      acao: "aceite", id: EVENTO, peca: PECA, quem: "pes00000000teste", estado: "topou",
    });
    assert.deepEqual(
      Object.keys(painel.ler("eventos")[0].aceites[PECA] ?? {}),
      [],
      "gravou resposta de alguém que não foi escalado",
    );
  });
});

/**
 * A ESCALA FURADA PRECISA COBRAR ALGUÉM.
 *
 * "Sem dono" era texto cinza que não cobrava nada: dava para chegar no sábado
 * com cinco peças vazias sem uma só tela reclamar — e foi assim que seis
 * encontros seguidos aconteceram com zero peças escaladas.
 */
describe("as pendências da escala", () => {
  test("peça essencial sem ninguém vira ação no encontro e tarefa no Início", async () => {
    const encontro = await painel.buscar("eventos", `e=${EVENTO}`);
    assert.match(encontro.html, /Achar gente para \d+ peças|Achar quem faz/);

    const inicio = await painel.buscar("index");
    assert.match(inicio.html, /peças sem ninguém em|sem ninguém em “/);
  });

  test("escala completa não cobra nada", async () => {
    const e = painel.ler("eventos")[0];
    const cheia: Record<string, string[]> = {};
    /* Público cobra local-hora, logistica, divulgacao, gravacao e captacao. */
    for (const p of ["local-hora", "logistica", "divulgacao", "gravacao", "captacao"]) {
      cheia[p] = [ADMIN];
    }
    painel.gravar("eventos", [{ ...e, responsaveis: cheia }]);

    const { html } = await painel.buscar("eventos", `e=${EVENTO}`);
    /* Cobrança que não some quando o trabalho é feito vira ruído, e ruído
       ensina a ignorar a tela. */
    assert.doesNotMatch(html, /Achar gente para|Achar quem faz/);
  });

  test("peça opcional vazia não cobra — adesivagem não é de toda caminhada", async () => {
    const e = painel.ler("eventos")[0];
    const cheia: Record<string, string[]> = {};
    for (const p of ["local-hora", "logistica", "divulgacao", "gravacao", "captacao"]) {
      cheia[p] = [ADMIN];
    }
    painel.gravar("eventos", [{ ...e, responsaveis: cheia }]);

    const { html } = await painel.buscar("eventos", `e=${EVENTO}&aba=preparo`);
    /* Ela aparece na tela, oferecida, e sem selo de erro: quem faz adesivaço
       escala, quem faz bandeiraço ignora, e nenhum dos dois recebe alarme. */
    assert.match(html, /id="peca-adesivagem"/);
    assert.doesNotMatch(html, /Achar quem faz Adesivagem/);
  });

  test("quem é escalada vê a SUA peça no Início, e não o preparo do encontro", async () => {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{ ...e, responsaveis: { ...e.responsaveis, captacao: [ADMIN] } }]);

    const { html } = await painel.buscar("index");
    /* Aqui morava o "todos fazem tudo": a tarefa antiga disparava para qualquer
       conta com `eventos`, com o agregado das cinco peças. */
    assert.match(html, /Você é Captação em/);
    assert.doesNotMatch(html, /Preparar “/);
  });

  test("quem disse que não pode não é cobrada de novo", async () => {
    const e = painel.ler("eventos")[0];
    painel.gravar("eventos", [{
      ...e,
      responsaveis: { ...e.responsaveis, captacao: [ADMIN] },
      aceites: { captacao: { [ADMIN]: "nao-posso" } },
    }]);

    const { html } = await painel.buscar("index");
    assert.match(html, /class="hub-lado"/, "não é o Início");
    assert.doesNotMatch(html, /Você é Captação em/, "cobrou quem já avisou que não pode");
  });
});
