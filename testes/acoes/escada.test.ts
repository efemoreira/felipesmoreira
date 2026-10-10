import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * A ESCADA DE ENGAJAMENTO e o PAINEL DE COMANDO (Leituras › Comando).
 *
 * O indicador-norte do plano é "pessoas que sobem de degrau por mês". A escada
 * é derivada — não há campo "degrau" na ficha —, então o que este teste prende
 * é que cada degrau sai do registro certo:
 *
 *   2 Participante   presença com "compareceu" num encontro que já aconteceu
 *   3 Colaborador    tarefa feita
 *   4 Responsável    responsável de núcleo ou grupo
 *   5 Multiplicador  lidera alguém que já é Colaborador
 *
 * E que subir é diferente de entrar: quem chegou no mês ENTROU.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const MARIA = "pes00000000teste";
const agoraIso = () => new Date().toISOString();

/** O número de um degrau no `<dl>` da escada. */
function noDegrau(html: string, nome: string): number {
  const m = html.match(new RegExp(`· ${nome}</dt>\\s*<dd>(\\d+)</dd>`));
  assert.ok(m, `não achei o degrau ${nome} na tela`);
  return Number(m[1]);
}

describe("escada: cada degrau sai do registro certo", () => {
  test("sem nada além da semente: todo mundo é Interessado", () => {
    /* A presença semeada é de um encontro que AINDA VEM — comparecer no
       futuro não sobe ninguém. */
    const html = painel.abrir("leituras").html;
    assert.equal(noDegrau(html, "Interessado"), 2);
    assert.equal(noDegrau(html, "Participante"), 0);
  });

  test("tarefa feita é Colaborador; responsável de núcleo é Responsável", () => {
    painel.gravar("tarefas", [{
      id: "t1", titulo: "Levar o som", donoId: MARIA, feitaEm: agoraIso(), criadoEm: agoraIso(),
    }]);
    painel.gravar("nucleos", [{
      id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN, responsavelDesde: agoraIso(),
    }]);
    const html = painel.abrir("leituras").html;
    assert.equal(noDegrau(html, "Colaborador"), 1);
    assert.equal(noDegrau(html, "Responsável"), 1);
    assert.equal(noDegrau(html, "Interessado"), 0);
  });

  test("liderar alguém que já é Colaborador faz Multiplicador", () => {
    const pessoas = painel.ler("pessoas").map((p: { id: string }) => (p.id === MARIA ? { ...p, lider: ADMIN } : p));
    painel.gravar("pessoas", pessoas);
    painel.gravar("tarefas", [{
      id: "t1", titulo: "Levar o som", donoId: MARIA, feitaEm: agoraIso(), criadoEm: agoraIso(),
    }]);
    const html = painel.abrir("leituras").html;
    assert.equal(noDegrau(html, "Multiplicador"), 1);
  });

  test("subir conta no mês; quem chegou já no degrau alto não 'subiu' — entrou", () => {
    /* As duas pessoas da semente existem desde o começo do ano: o que fizerem
       este mês é subida. */
    painel.gravar("tarefas", [{
      id: "t1", titulo: "Levar o som", donoId: MARIA, feitaEm: agoraIso(), criadoEm: agoraIso(),
    }]);
    const html = painel.abrir("leituras").html;
    assert.match(html, /1 subiram de degrau, 0 entraram/);
  });
});

describe("painel de comando", () => {
  test("os seis blocos estão lá, e ativo é quem contribuiu — não quem está cadastrado", () => {
    const vazio = painel.abrir("leituras").html;
    for (const bloco of ["Participação", "Organização", "Territórios", "Produção", "Porta-vozes", "Sustentabilidade"]) {
      assert.match(vazio, new RegExp(`medidor-rotulo">${bloco}<`), `falta o bloco ${bloco}`);
    }
    /* Duas pessoas cadastradas, nenhuma contribuição no mês. */
    assert.match(vazio, /medidor-num">0<\/strong>\s*<span class="medidor-rotulo">Participação/);

    painel.gravar("tarefas", [{
      id: "t1", titulo: "Levar o som", donoId: MARIA, feitaEm: agoraIso(), criadoEm: agoraIso(),
    }]);
    const com = painel.abrir("leituras").html;
    assert.match(com, /medidor-num">1<\/strong>\s*<span class="medidor-rotulo">Participação/);
  });

  test("decisões do mês apontam a unidade parada e a que está sem substituto", () => {
    painel.gravar("nucleos", [{ id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN }]);
    const html = painel.abrir("leituras").html;
    assert.match(html, /Quais precisam de apoio ou estão paradas\?<\/strong>\s*<span class="dica">Núcleo Benfica/);
    assert.match(html, /Onde falta substituto\?<\/strong>\s*<span class="dica">Núcleo Benfica/);
  });

  test("a meta de núcleos ativos lê a mesma régua da Organização", async () => {
    painel.gravar("nucleos", [{
      id: "nuc-a", nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN, proximaData: "2099-01-01",
      entregas: [{ id: "e1", data: new Date().toISOString().slice(0, 10), texto: "Escuta" }],
    }, { id: "nuc-b", nome: "Messejana", cidade: "Fortaleza" }]);
    await painel.postar("leituras", { acao: "meta-salvar", medida: "nucleos", alvo: "5", ate: "2027-03-31" });
    const [meta] = painel.ler("metas");
    assert.equal(meta?.medida, "nucleos");
    /* Dois núcleos, um ativo: a meta conta 1 de 5, e não 2. */
    const semana = painel.abrir("leituras", "aba=semana").html;
    assert.match(semana, /Núcleos ativos/);
    assert.match(semana, /meta-numero"><strong>1<\/strong> de 5</);
  });
});
