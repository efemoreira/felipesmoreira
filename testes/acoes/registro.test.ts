import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * O REGISTRO DAS PESSOAS NA ESTRUTURA — a pergunta "onde esta pessoa atua?"
 * tem uma resposta só, e todo caminho de registro chega nela.
 *
 * Caminhos de entrada: a inscrição com interesse (aprovada), ser responsável
 * ou substituto, ser posta pela unidade (minha-unidade), ser posta pela ficha
 * (pessoas), ser porta-voz da Liga. Lugares que leem: a ficha (aba Onde atua),
 * a lista de quem faz parte da unidade, o Meu lugar do Início. Os três tipos de
 * unidade — núcleo, grupo temático, grupo cultural — seguem a mesma regra.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const MARIA = "pes00000000teste";
const NUC = "nuc-a1b2c3";
const GRP = "grp-b2c3d4";
const CUL = "cul-c3d4e5";

function estrutura() {
  painel.gravar("nucleos", [{ id: NUC, nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN, publicado: true }]);
  painel.gravar("temas", [{ id: GRP, tema: "saude", finalidade: "UPAs", responsavelId: ADMIN, substitutoId: MARIA,
    primeiraEntrega: "Diagnóstico", primeiraEntregaAte: "2027-01-01", publicado: true }]);
}

/** Só a tabela de vínculos da aba "Onde atua" — sem o seletor de "Pôr num…", que lista as outras. */
function ondeAtua(pessoa: string): string {
  const html = painel.abrir("pessoas", `p=${pessoa}&aba=atua`).html;
  const tabela = html.match(/<fieldset id="atua">[^]*?(<tbody>[^]*?<\/tbody>|<p class="vazio[^]*?<\/p>)/);
  return tabela?.[1] ?? "";
}

describe("registro: os três tipos de unidade, o mesmo molde", () => {
  test("grupo cultural nasce com nome, eixo e quem responde — e já conta quem responde como parte", async () => {
    await painel.postar("organizacao", { acao: "cultura-salvar", nome: "Cineclube do Benfica", eixo: "cinema", responsavelId: MARIA });
    const [c] = painel.ler("cultura");
    assert.match(c.id, /^cul-/);
    assert.equal(c.eixo, "cinema");
    assert.equal(c.nivel, 1);
    assert.match(ondeAtua(MARIA), /Cultura: Cineclube do Benfica[^]*?responsável/);
  });

  test("grupo cultural sem eixo válido não nasce", async () => {
    const r = await painel.postar("organizacao", { acao: "cultura-salvar", nome: "X", eixo: "inventado" });
    assert.match(r.html, /Escolha o eixo cultural/);
  });

  test("a próxima atividade do grupo cultural também é encontro, e ele fica ativo", async () => {
    painel.gravar("cultura", [{ id: CUL, nome: "Sarau", eixo: "literatura", responsavelId: ADMIN,
      entregas: [{ id: "e1", data: "2026-10-01", texto: "Primeiro sarau" }] }]);
    const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date(Date.now() + 5 * 86_400_000));
    await painel.postar("organizacao", { acao: "proxima", tipo: "cultura", id: CUL, dia, titulo: "Sarau de outubro" });
    const ev = painel.ler("eventos").find((e: { unidadeId: string }) => e.unidadeId === CUL);
    assert.equal(ev.titulo, "Sarau de outubro");
  });
});

describe("registro: todo caminho chega na mesma resposta", () => {
  test("responsável e substituto fazem parte sem ninguém pôr à mão", () => {
    estrutura();
    const html = ondeAtua(MARIA);
    assert.match(html, /Grupo Saúde e esporte[^]*?substituto/);
    assert.doesNotMatch(html, /Núcleo Benfica/);
  });

  test("pela ficha: pôr no núcleo aparece na ficha, na unidade e no Meu lugar", async () => {
    estrutura();
    await painel.postar("pessoas", { acao: "unidade-entrar", id: MARIA, unidade: NUC });
    assert.match(ondeAtua(MARIA), /Núcleo Benfica[^]*?faz parte/);
    assert.match(painel.abrir("minha-unidade", `u=${NUC}`).html, /Maria S\./);

    await painel.postar("pessoas", { acao: "unidade-sair", id: MARIA, unidade: NUC });
    assert.doesNotMatch(ondeAtua(MARIA), /Núcleo Benfica/);
  });

  test("pela unidade: quem a responsável põe aparece na ficha", async () => {
    estrutura();
    await painel.postar("minha-unidade", { acao: "membro", pessoaId: MARIA }, `u=${NUC}`);
    assert.match(ondeAtua(MARIA), /Núcleo Benfica[^]*?faz parte/);
  });

  test("pela Liga: ser porta-voz aparece na ficha, com o nível", async () => {
    estrutura();
    await painel.postar("organizacao", { acao: "pv-salvar", pessoaId: MARIA, tema: "saude" });
    assert.match(ondeAtua(MARIA), /Liga dos Porta-vozes[^]*?porta-voz nível E/);
  });

  test("pela inscrição: o interesse num grupo cultural vira lugar ao aprovar", async () => {
    painel.gravar("cultura", [{ id: CUL, nome: "Sarau", eixo: "literatura", publicado: true }]);
    const r = await painel.postarJson("api/inscricao.php", {
      nome: "Joana Teste da Silva", telefone: "85988887777", email: "", cidade: "Fortaleza", bairro: "Benfica",
      funcoes: [], de: "", interesse: CUL, consentimento: true, site: "",
    });
    assert.equal(r.json.ok, true, JSON.stringify(r.json));
    const joana = painel.ler("pessoas").find((p: { telefone: string }) => p.telefone === "85988887777");
    await painel.postar("inscricoes", { acao: "aprovar", id: joana.id, usuario: "joana" });
    assert.match(ondeAtua(joana.id), /Cultura: Sarau[^]*?faz parte/);
  });

  test("encerrar a unidade tira dela de toda resposta, sem apagar a ficha de ninguém", async () => {
    estrutura();
    await painel.postar("pessoas", { acao: "unidade-entrar", id: MARIA, unidade: NUC });
    await painel.postar("organizacao", { acao: "encerrar", tipo: "nucleo", id: NUC });
    assert.doesNotMatch(ondeAtua(MARIA), /Núcleo Benfica/);
    /* A ficha guarda o id — reabrir o núcleo devolve a pessoa a ele. */
    assert.deepEqual(painel.ler("pessoas").find((p: { id: string }) => p.id === MARIA).unidades, [NUC]);
  });
});
