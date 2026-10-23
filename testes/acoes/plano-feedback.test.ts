import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

let painel: Sandbox;
before(() => { painel = montarSandbox(); });
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const corpo = { nota: "4", parte: "territorio", opiniao: "A proposta ajuda a organizar os bairros.", melhoria: "Incluir mais encontros locais.", nome: "Ana", site: "" };

test("a avaliação pública fica salva e a coordenação consegue lê-la", async () => {
  const r = await painel.postarJson("api/plano-feedback.php", corpo);
  assert.equal(r.status, 201);
  assert.equal(r.json.ok, true);
  const salvos = painel.ler("plano-feedback");
  assert.equal(salvos.length, 1);
  assert.equal(salvos[0].nota, 4);
  assert.equal(salvos[0].melhoria, corpo.melhoria);
  const lista = await painel.postarJson("api/plano-feedback.php", { acao: "listar" });
  assert.equal(lista.status, 200);
  assert.equal(lista.json.feedbacks.length, 1);
  assert.equal(lista.json.feedbacks[0].opiniao, corpo.opiniao);
  const tela = painel.abrir("leituras", "aba=plano");
  assert.equal(tela.erros, "");
  assert.match(tela.html, /Incluir mais encontros locais/);
  assert.match(tela.html, /Território/);
});

test("qualquer visitante com o link pode apagar uma avaliação exibida", async () => {
  const envio = await painel.postarJson("api/plano-feedback.php", corpo);
  const id = envio.json.feedback.id;
  const exclusao = await painel.postarJson("api/plano-feedback.php", { acao: "apagar", id });
  assert.equal(exclusao.status, 200);
  assert.deepEqual(painel.ler("plano-feedback"), []);
  const lista = await painel.postarJson("api/plano-feedback.php", { acao: "listar" });
  assert.deepEqual(lista.json.feedbacks, []);
  const outra = await painel.postarJson("api/plano-feedback.php", { acao: "apagar", id });
  assert.equal(outra.status, 404);
});

test("avaliação inválida e armadilha de robô não são salvas", async () => {
  const invalida = await painel.postarJson("api/plano-feedback.php", { ...corpo, nota: "6" });
  assert.equal(invalida.status, 422);
  const robo = await painel.postarJson("api/plano-feedback.php", { ...corpo, site: "preenchido" });
  assert.equal(robo.status, 400);
  assert.deepEqual(painel.ler("plano-feedback"), []);
});
