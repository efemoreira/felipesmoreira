import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";
import { chamarPhp } from "../contrato/ponte.ts";
import { PARTICIPACAO, perfilVazio, restaurarPerfil, normalizarInstituicao } from "@/features/inscricao/perfil";

let painel: Sandbox;
before(() => { painel = montarSandbox(); });
beforeEach(() => painel.ressemear());
after(() => painel.fechar());
const corpo = (extra: object = {}) => ({ nome: "Ana Maria Teste", telefone: "85981112222", cidade: "Fortaleza", bairro: "Benfica", email: "", funcoes: [], de: "", interesse: "", consentimento: true, site: "", participacao: perfilVazio(), ...extra });
const perfil = { ...perfilVazio(), frentes: ["territorio", "temas", "liga"], temas: ["saude", "educacao"], cultura: ["musica"], contribuicoes: ["acolhimento", "pesquisa"], profissao: "Enfermeira", instituicao: "Universidade de Fortaleza", campus: "Edson Queiroz", cidadeInstituicao: "Fortaleza", curso: "Enfermagem", disponibilidade: "2-3h", periodos: ["semana-noite"], modalidade: "ambas", habilidades: "Facilitar oficinas", ideia: "Roda de conversa sobre saúde", perfilPublico: "@ana" };
const ana = () => painel.ler("pessoas").find(p => p.telefone === "85981112222");

describe("participação: formulário e dados de construção", () => {
  test("só contato e localização bastam; função e perfil são opcionais", async () => {
    const r = await painel.postarJson("api/inscricao.php", corpo());
    assert.equal(r.json.ok, true);
    assert.deepEqual(ana().funcoes, []);
    assert.deepEqual(ana().participacao.frentes, []);
    assert.ok(ana().participacao.registradoEm);
    assert.equal(ana().consentimentoVersao, "2");
    assert.equal(ana().usuario, "");
    assert.deepEqual(ana().unidades, []);
  });
  test("trabalho, instituição, temas, cultura e disponibilidade chegam à mesma ficha e à fila", async () => {
    const r = await painel.postarJson("api/inscricao.php", corpo({ participacao: perfil }));
    assert.equal(r.json.ok, true);
    const p = ana();
    assert.equal(p.participacao.instituicao, "UNIFOR");
    assert.equal(p.participacao.profissao, "Enfermeira");
    assert.deepEqual(p.participacao.temas, ["saude", "educacao"]);
    const fila = painel.abrir("inscricoes").html;
    for (const texto of ["UNIFOR", "Enfermagem", "Enfermeira", "De 2 a 3 horas", "Roda de conversa sobre saúde"]) assert.ok(fila.includes(texto), texto);
    const ficha = painel.abrir("pessoas", `p=${p.id}`).html;
    assert.match(ficha, /Interesses para construir o movimento/);
    assert.match(ficha, /UNIFOR/);
  });
  test("perfil não concede acesso, não cria unidades e aprovar não inclui automaticamente na articulação", async () => {
    painel.gravar("nucleos", [{ id: "nuc-a1b2c3", nome: "UNIFOR", cidade: "Fortaleza", publicado: true }]);
    await painel.postarJson("api/inscricao.php", corpo({ interesse: "nuc-a1b2c3", participacao: { ...perfil, capacidades: ["adm"], unidades: ["nuc-a1b2c3"], registradoEm: "2000-01-01" } }));
    const p = ana();
    assert.deepEqual(p.capacidades, []);
    assert.notEqual(p.participacao.registradoEm, "2000-01-01");
    assert.deepEqual(p.unidades, []);
    await painel.postar("inscricoes", { acao: "aprovar", id: p.id, usuario: "ana" });
    assert.deepEqual(ana().unidades, []);
    assert.deepEqual(ana().participacao.temas, ["saude", "educacao"]);
    assert.equal(painel.ler("temas").length, 0);
    assert.equal(painel.ler("liga").length, 0);
  });
  test("listas inválidas, duplicadas e tipos inesperados são normalizados sem erro", async () => {
    const r = await painel.postarJson("api/inscricao.php", corpo({ participacao: { frentes: ["liga", "liga", "inexistente", {}], temas: "saude", cultura: ["musica", "nada"], profissao: {}, instituicao: 22, disponibilidade: "invalida", habilidades: "x".repeat(900) } }));
    assert.equal(r.json.ok, true);
    assert.deepEqual(ana().participacao.frentes, ["liga"]);
    assert.deepEqual(ana().participacao.temas, []);
    assert.equal(ana().participacao.profissao, "");
    assert.equal(ana().participacao.habilidades.length, 400);
  });
  test("telefone repetido não cria outra ficha nem apaga os interesses existentes", async () => {
    await painel.postarJson("api/inscricao.php", corpo({ participacao: perfil }));
    const antes = painel.ler("pessoas").length;
    const r = await painel.postarJson("api/inscricao.php", corpo());
    assert.equal(r.status, 409);
    assert.equal(painel.ler("pessoas").length, antes);
    assert.equal(ana().participacao.instituicao, "UNIFOR");
  });
  test("perfil pode ser atualizado na ficha sem alterar contato, conta ou funções", async () => {
    await painel.postarJson("api/inscricao.php", corpo({ participacao: perfil }));
    const p = ana();
    await painel.postar("pessoas", { acao: "participacao-salvar", id: p.id, "participacao[frentes][]": ["cultura", "formacao"], "participacao[profissao]": "Técnica de enfermagem", "participacao[instituicao]": "UNIFOR" });
    const depois = ana();
    assert.deepEqual(depois.participacao.frentes, ["cultura", "formacao"]);
    assert.equal(depois.participacao.profissao, "Técnica de enfermagem");
    assert.equal(depois.telefone, p.telefone);
    assert.equal(depois.usuario, p.usuario);
    assert.deepEqual(depois.funcoes, []);
  });
});

describe("construção: agrupamentos e recortes para a coordenação", () => {
  async function semear() {
    await painel.postarJson("api/inscricao.php", corpo({ participacao: perfil }));
    await painel.postarJson("api/inscricao.php", corpo({ nome: "Beatriz Souza", telefone: "85981112223", bairro: "benfica", participacao: { ...perfil, instituicao: "unifor", profissao: "enfermeira" } }));
  }
  test("inclui pendentes, reúne grafias e distingue interesses de unidades funcionando", async () => {
    await semear();
    const r = painel.abrir("leituras", "aba=construcao&instituicao=UNIFOR&bairro=BENFICA&tema=saude");
    assert.equal(r.erros, "");
    assert.match(r.html, /Cadastros neste recorte<\/dt><dd>2<\/dd>/);
    assert.match(r.html, /UNIFOR · Edson Queiroz · Fortaleza/);
    assert.match(r.html, /Não são núcleos criados/);
    assert.match(r.html, /Ana Maria Teste/);
    assert.match(r.html, /Beatriz Souza/);
  });
  test("cruza tema, disponibilidade e busca por habilidades; exporta só o recorte", async () => {
    await semear();
    const tela = painel.abrir("leituras", "aba=construcao&tema=saude&disponibilidade=2-3h&q=oficinas");
    assert.equal(tela.erros, "");
    assert.match(tela.html, /Cadastros neste recorte<\/dt><dd>2<\/dd>/);
    const csv = await painel.buscar("exportar", "o=construcao&instituicao=UNIFOR&tema=saude");
    assert.match(csv.html, /Ana Maria Teste/);
    assert.match(csv.html, /Beatriz Souza/);
    assert.match(csv.html, /Edson Queiroz/);
    assert.doesNotMatch(csv.html, /Coordenação de Teste/);
    const vazio = await painel.buscar("exportar", "o=construcao&tema=seguranca");
    assert.doesNotMatch(vazio.html, /Ana Maria Teste/);
  });
  test("recusados e apagados não entram; a exclusão elimina os dados novos", async () => {
    await semear();
    const pessoas = painel.ler("pessoas");
    painel.gravar("pessoas", pessoas.map(p => p.telefone === "85981112223" ? { ...p, status: "recusada" } : p));
    const tela = painel.abrir("leituras", "aba=construcao&instituicao=UNIFOR");
    assert.match(tela.html, /Cadastros neste recorte<\/dt><dd>1<\/dd>/);
    assert.doesNotMatch(tela.html, /Beatriz Souza/);
    await painel.postar("pessoas", { acao: "apagar", id: ana().id });
    assert.doesNotMatch(painel.abrir("leituras", "aba=construcao&instituicao=UNIFOR").html, /Ana Maria Teste/);
  });
  test("informações privadas não aparecem para quem só tem comunicação, nem na API pública", async () => {
    await semear();
    const api = await painel.buscar("api/organizacao");
    assert.doesNotMatch(api.html, /Enfermeira|Enfermagem|ana|Facilitar oficinas/);
    painel.trocarCapacidades("comunicacao");
    try {
      const tela = painel.abrir("leituras", "aba=construcao");
      assert.doesNotMatch(tela.html, /Ana Maria Teste|Enfermeira|85981112222/);
      const csv = await painel.buscar("exportar", "o=construcao");
      assert.equal(csv.status, 302);
    } finally { painel.trocarCapacidades("adm"); }
  });
  test("conteúdo enviado por visitante não executa HTML nem fórmulas no CSV", async () => {
    await painel.postarJson("api/inscricao.php", corpo({ participacao: { ...perfil, ideia: '=HYPERLINK("https://example.com")', habilidades: '<script>alert(1)</script>' } }));
    const tela = painel.abrir("leituras", "aba=construcao").html;
    assert.doesNotMatch(tela, /<script>alert\(1\)<\/script>/);
    assert.match(tela, /&lt;script&gt;/);
    const csv = await painel.buscar("exportar", "o=construcao&instituicao=UNIFOR");
    assert.match(csv.html, /'=HYPERLINK/);
  });
});

describe("participação: catálogos e rascunho", () => {
  test("site e painel usam as mesmas opções e elas concordam com o plano da organização", () => {
    const [php, org] = chamarPhp([{ fn: "catalogo_de_participacao", args: [] }, { fn: "catalogo_da_organizacao", args: [] }]) as [typeof PARTICIPACAO, { temas: Record<string, { nome: string }>; eixos: Record<string, string> }];
    assert.deepEqual(php, PARTICIPACAO);
    assert.deepEqual(php.temas, Object.fromEntries(Object.entries(org.temas).map(([k, v]) => [k, v.nome])));
    assert.deepEqual(php.cultura, org.eixos);
    assert.equal(normalizarInstituicao("universidade de fortaleza"), "UNIFOR");
    assert.equal(normalizarInstituicao("Outra faculdade"), "Outra faculdade");
  });
  test("rascunho mantém seleções e aceita a ponte antiga da presença, sem exigir função", () => {
    assert.deepEqual(restaurarPerfil(undefined), perfilVazio());
    assert.deepEqual(restaurarPerfil({ ...perfil, temas: ["saude", "saude", "nada"], modalidade: "invalida" }).temas, ["saude"]);
    assert.equal(restaurarPerfil({ modalidade: "invalida" }).modalidade, "");
    assert.deepEqual(restaurarPerfil(perfil).frentes, perfil.frentes);
  });
});
