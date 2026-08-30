import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * A RÉGUA DE QUEM CHAMAR DE VOLTA.
 *
 * A lista de reativação é derivada: não há campo "reativar" em lugar nenhum, e
 * ninguém marca ninguém. Isso é a força dela — nunca fica velha — e é também o
 * risco: uma régua errada não quebra nada, só produz uma lista silenciosamente
 * inútil. Ou ela enche de gente que está ativa, e a coordenação para de abrir;
 * ou ela esquece quem esfriou, e a lista fica vazia parecendo boa notícia.
 *
 * Os quatro casos abaixo são os quatro motivos, e cada um tem um vizinho que
 * NÃO pode entrar — é a borda que importa.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const FUSO = "-03:00";
const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/** Um encontro que já aconteceu há `n` dias. */
function encontroHa(n: number, id: string, titulo: string) {
  return {
    id,
    titulo,
    familia: "militancia",
    inicio: new Date(Date.now() - n * 86_400_000).toISOString(),
    local: "Benfica",
    status: "confirmado",
    criadoEm: "2026-01-01T10:00:00-03:00",
  };
}

function pessoa(extra: Record<string, unknown>) {
  return {
    id: "pes-alvo",
    nome: "Joana Alves",
    telefone: "85988887777",
    cidade: "Fortaleza",
    tipo: "apoiador",
    status: "aprovada",
    ativo: true,
    criadoEm: diasAtras(90),
    ...extra,
  };
}

/**
 * Acrescenta alguém à base, sem apagar quem já está lá.
 *
 * `gravar()` substitui o arquivo inteiro, e a conta da coordenação mora nele:
 * gravar só a pessoa do teste derruba a sessão, e a tela seguinte é a de login.
 */
function acrescentar(p: Record<string, unknown>): void {
  painel.gravar("pessoas", [...painel.ler("pessoas"), p]);
}

/**
 * Só o bloco da reativação.
 *
 * A moldura do painel escreve o nome de quem está logado na lateral, em toda
 * tela: procurar um nome no HTML inteiro acharia a barra lateral e daria o
 * teste por passado (ou por falhado) pelo motivo errado.
 */
function lista(): string {
  const html = painel.abrir("pessoas", "tipo=reativar").html;
  const de = html.indexOf('id="reativar"');
  const ate = html.indexOf("</fieldset>", de);
  assert.ok(de > 0, "a lista de reativação não foi desenhada");
  return html.slice(de, ate);
}

describe("reativação: confirmou e faltou", () => {
  test("quem disse que vinha e não veio entra na lista, com o nome do encontro", () => {
    painel.gravar("eventos", [encontroHa(7, "ev-passou", "Roda de conversa no Pirambu")]);
    acrescentar(pessoa({}));
    painel.gravar("presencas", [
      { id: "pr-1", eventoId: "ev-passou", pessoaId: "pes-alvo", confirmou: true, compareceu: false },
    ]);

    const html = lista();
    assert.match(html, /Confirmou e faltou/);
    assert.match(html, /Joana Alves/);
    assert.match(
      html,
      /Roda de conversa no Pirambu/,
      "sem o nome do encontro a mensagem vira “você faltou a um encontro”, que fecha conversa",
    );
  });

  test("confirmar para um encontro que ainda vem NÃO é falta", () => {
    /* A borda. Quem confirmou para sábado que vem não faltou — e mandar “o que
       houve?” para essa pessoa é o jeito mais rápido de perder a confiança na
       lista. */
    painel.gravar("eventos", [encontroHa(-7, "ev-vem", "Encontro que ainda vem")]);
    acrescentar(pessoa({}));
    painel.gravar("presencas", [
      { id: "pr-2", eventoId: "ev-vem", pessoaId: "pes-alvo", confirmou: true, compareceu: false },
    ]);

    assert.doesNotMatch(lista(), /Joana Alves/);
  });
});

describe("reativação: aprovada e nunca entrou", () => {
  test("conta criada há duas semanas e nunca usada entra", () => {
    acrescentar(pessoa({ usuario: "joana.alves", ultimoAcesso: "", criadoEm: diasAtras(30) }));

    assert.match(lista(), /Aprovada e nunca entrou/);
    assert.match(lista(), /Joana Alves/);
  });

  test("aprovada anteontem ainda não é caso — pode só não ter visto o WhatsApp", () => {
    acrescentar(pessoa({ usuario: "joana.alves", ultimoAcesso: "", criadoEm: diasAtras(2) }));

    assert.doesNotMatch(lista(), /Joana Alves/);
  });

  test("quem já entrou uma vez não aparece, mesmo sem voltar depois", () => {
    acrescentar(pessoa({ usuario: "joana.alves", ultimoAcesso: diasAtras(40), criadoEm: diasAtras(90) }));

    assert.doesNotMatch(lista(), /Aprovada e nunca entrou/);
  });
});

describe("reativação: veio uma vez e sumiu", () => {
  test("compareceu há mais de dois meses e não voltou", () => {
    painel.gravar("eventos", [encontroHa(80, "ev-velho", "Mutirão de agosto")]);
    acrescentar(pessoa({}));
    painel.gravar("presencas", [
      { id: "pr-3", eventoId: "ev-velho", pessoaId: "pes-alvo", confirmou: true, compareceu: true },
    ]);

    const html = lista();
    assert.match(html, /Veio uma vez e sumiu/);
    assert.match(html, /Mutirão de agosto/);
  });

  test("quem veio no mês passado está no ciclo, e não em reativação", () => {
    painel.gravar("eventos", [encontroHa(20, "ev-recente", "Mutirão recente")]);
    acrescentar(pessoa({}));
    painel.gravar("presencas", [
      { id: "pr-4", eventoId: "ev-recente", pessoaId: "pes-alvo", confirmou: true, compareceu: true },
    ]);

    assert.doesNotMatch(lista(), /Joana Alves/);
  });
});

describe("reativação: quem NUNCA entra", () => {
  test("a administração fica de fora, por mais parada que esteja", () => {
    /* A conta de coordenação do teste não tem progresso nenhum e nunca foi a
       encontro. Se a régua não excluísse quem administra, a lista abriria
       acusando a própria pessoa que a abriu. */
    painel.gravar("aulas-progresso", { [ADMIN]: {} });

    assert.doesNotMatch(lista(), /Coordenação de Teste/);
  });

  test("pessoa desativada não é chamada de volta", () => {
    painel.gravar("eventos", [encontroHa(80, "ev-velho", "Mutirão de agosto")]);
    acrescentar(pessoa({ ativo: false }));
    painel.gravar("presencas", [
      { id: "pr-5", eventoId: "ev-velho", pessoaId: "pes-alvo", confirmou: true, compareceu: true },
    ]);

    assert.doesNotMatch(lista(), /Joana Alves/);
  });

  test("um motivo por pessoa, e o mais forte — não quatro linhas da mesma gente", () => {
    /* Joana faltou a um encontro E sumiu depois de outro. Aparece uma vez, no
       grupo de “faltou”: quem for chamar precisa saber o que dizer, e a
       resposta é uma só. */
    painel.gravar("eventos", [
      encontroHa(90, "ev-veio", "Mutirão antigo"),
      encontroHa(7, "ev-faltou", "Encontro da semana passada"),
    ]);
    acrescentar(pessoa({}));
    painel.gravar("presencas", [
      { id: "pr-6", eventoId: "ev-veio", pessoaId: "pes-alvo", confirmou: true, compareceu: true },
      { id: "pr-7", eventoId: "ev-faltou", pessoaId: "pes-alvo", confirmou: true, compareceu: false },
    ]);

    const html = lista();
    const vezes = (html.match(/Joana Alves/g) ?? []).length;
    assert.equal(vezes, 1, "a mesma pessoa apareceu em mais de um grupo");
    assert.match(html, /Encontro da semana passada/);
  });
});

describe("reativação: o hub chama para a lista", () => {
  /**
   * Uma lista que só existe para quem lembra dela não é rotina — é um lugar
   * bonito que ninguém abre. O hub é onde a coordenação olha todo dia, e é lá
   * que a reativação precisa aparecer para virar trabalho de semana.
   */
  test("com gente esfriando, a tarefa aparece no hub apontando para a lista", () => {
    painel.gravar("eventos", [encontroHa(80, "ev-velho", "Mutirão de agosto")]);
    acrescentar(pessoa({}));
    painel.gravar("presencas", [
      { id: "pr-8", eventoId: "ev-velho", pessoaId: "pes-alvo", confirmou: true, compareceu: true },
    ]);

    const { html } = painel.abrir("index", "");
    assert.match(html, /Chamar de volta 1 pessoa que esfriou/);
    assert.match(html, /pessoas\.php\?tipo=reativar#reativar/);
  });

  test("sem ninguém esfriando, o hub não inventa tarefa", () => {
    /* Fila vazia é o objetivo, e não erro: uma linha permanente dizendo
       "chamar de volta 0 pessoas" é ruído que ensina a ignorar a lista. */
    const { html } = painel.abrir("index", "");
    assert.doesNotMatch(html, /Chamar de volta/);
  });
});
