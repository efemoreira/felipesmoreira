import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * A porta do Paulo (`api/paulo.php`): o CRM do WhatsApp falando com o painel.
 *
 * O que estes testes prendem é o que dói se escapar: um pedido sem a assinatura
 * certa gravando no cadastro; o mesmo celular virando duas pessoas porque o
 * WhatsApp manda `55` e às vezes não manda o 9; o relato sem identificação
 * guardando quem relatou; e a nota interna da coordenação saindo do painel.
 */

let painel: Sandbox;
const SEGREDO = "f".repeat(64);
before(() => { painel = montarSandbox(); });
beforeEach(() => {
  painel.ressemear();
  writeFileSync(path.join(painel.dir, "dados", "segredo-paulo.php"), `<?php\nreturn '${SEGREDO}';\n`);
});
after(() => painel.fechar());

function assinado(corpo: unknown, opcoes: { segredo?: string; hora?: number } = {}) {
  const texto = JSON.stringify(corpo);
  const hora = String(opcoes.hora ?? Math.floor(Date.now() / 1000));
  const assinatura = createHmac("sha256", opcoes.segredo ?? SEGREDO).update(`${hora}.${texto}`).digest("hex");
  return painel.postarApi("api/paulo.php", texto, { "x-paulo-hora": hora, "x-paulo-assinatura": assinatura });
}

/** O WhatsApp entrega 55 + DDD + número, aqui sem o nono dígito. */
const WHATSAPP = "558591234567";
const NA_FICHA = "85991234567";
const inscricao = { acao: "inscricao", telefone: WHATSAPP, nome: "Maria do Paulo Teste", cidade: "Fortaleza", bairro: "Benfica" };

test("pedido sem a assinatura certa recebe 404 e não grava nada", async () => {
  const errado = await assinado(inscricao, { segredo: "0".repeat(64) });
  assert.equal(errado.status, 404);
  const vencido = await assinado(inscricao, { hora: Math.floor(Date.now() / 1000) - 600 });
  assert.equal(vencido.status, 404);
  const semNada = await painel.postarApi("api/paulo.php", JSON.stringify(inscricao), {});
  assert.equal(semNada.status, 404);
  assert.equal(painel.ler("pessoas").filter((p: { telefone: string }) => p.telefone === NA_FICHA).length, 0);
});

test("a inscrição pelo Paulo e pelo /queroajudar é a mesma ficha, com o celular na grafia da ficha", async () => {
  const r = await assinado(inscricao);
  assert.equal(r.status, 200);
  assert.equal(r.json.estado, "nova");
  const fichas = painel.ler("pessoas").filter((p: { telefone: string }) => p.telefone === NA_FICHA);
  assert.equal(fichas.length, 1);
  assert.equal(fichas[0].status, "pendente");
  assert.equal(fichas[0].origem, "paulo");
  assert.equal(fichas[0].consentimentoVersao, "whatsapp-paulo");

  // O site, depois, reconhece o número — e o Paulo de novo também.
  const site = await painel.postarJson("api/inscricao.php", {
    nome: "Maria do Paulo Teste", telefone: NA_FICHA, email: "", cidade: "Fortaleza", bairro: "Benfica", consentimento: true, site: "",
  });
  assert.equal(site.status, 409);
  assert.equal((await assinado(inscricao)).json.estado, "pendente");
  assert.equal(painel.ler("pessoas").filter((p: { telefone: string }) => p.telefone === NA_FICHA).length, 1);
});

test("a inscrição pelo Paulo segue a mesma régua do site", async () => {
  const r = await assinado({ ...inscricao, nome: "Maria" });
  assert.equal(r.json.ok, false);
  assert.equal(r.json.estado, "invalida");
  assert.match(r.json.recusa, /nome completo/);
});

test("a situação diz o status, o degrau e onde a pessoa atua — sem telefone nem nome de ninguém", async () => {
  assert.equal((await assinado({ acao: "situacao", telefone: WHATSAPP })).json.conhecida, false);
  await assinado(inscricao);
  const r = await assinado({ acao: "situacao", telefone: `+55 85 9${NA_FICHA.slice(3)}` });
  assert.equal(r.json.conhecida, true);
  assert.equal(r.json.status, "pendente");
  assert.equal(typeof r.json.degrau, "number");
  assert.deepEqual(r.json.unidades, []);
  assert.doesNotMatch(JSON.stringify(r.json), /9123|Maria/);
});

test("o interesse em núcleo fica na ficha, e entrar continua sendo da coordenação", async () => {
  painel.gravar("nucleos", [{ id: "nuc-abc123", nome: "Benfica", cidade: "Fortaleza", responsavelId: ADMIN, publicado: true }]);
  assert.equal((await assinado({ acao: "interesse", telefone: WHATSAPP, unidade: "nuc-abc123" })).json.estado, "sem-ficha");
  await assinado(inscricao);
  assert.equal((await assinado({ acao: "interesse", telefone: WHATSAPP, unidade: "nuc-000000" })).json.estado, "unidade-desconhecida");
  const r = await assinado({ acao: "interesse", telefone: WHATSAPP, unidade: "nuc-abc123" });
  assert.equal(r.json.estado, "registrado");
  const ficha = painel.ler("pessoas").find((p: { telefone: string }) => p.telefone === NA_FICHA);
  assert.equal(ficha.interesse, "nuc-abc123");
  assert.deepEqual(ficha.unidades, []);
});

test("relato sem identificação chega sem quem relatou, e o mesmo protocolo não duplica", async () => {
  const relato = { acao: "relato", protocolo: "PROTOCOLO-ABC123", tipo: "relato", categoria: "COMPRA_DE_VOTO", texto: "Oferta de dinheiro por voto perto da praça", local: "Centro", anonimo: true, telefone: WHATSAPP, nome: "Não Deve Ficar", anexos: 2, link: "https://crm.exemplo/protocolo" };
  assert.equal((await assinado(relato)).json.estado, "registrado");
  assert.equal((await assinado(relato)).json.estado, "registrado");
  const guardados = painel.ler("relatos");
  assert.equal(guardados.length, 1);
  assert.equal(guardados[0].anonimo, true);
  assert.equal(guardados[0].telefone, "");
  assert.equal(guardados[0].nome, "");
  assert.equal(guardados[0].pessoaId, "");
  assert.equal(guardados[0].anexos, 2);
  assert.equal(guardados[0].andamento, "recebida");
});

test("a coordenação decide no painel e o Paulo lê o andamento e a resposta — a nota não sai", async () => {
  await assinado(inscricao);
  await assinado({ acao: "relato", protocolo: "IDEIA-XYZ789", tipo: "ideia", tema: "Praça", texto: "Fazer um cineclube na praça do bairro", telefone: WHATSAPP });
  const ideia = painel.ler("relatos")[0];
  assert.equal(ideia.tipo, "ideia");
  assert.equal(ideia.andamento, "nova");
  assert.notEqual(ideia.pessoaId, "", "identificada, a ideia aponta para a ficha");

  const tela = painel.abrir("relatos", "aba=ideias");
  assert.equal(tela.erros, "");
  assert.match(tela.html, /cineclube/);

  const r = await painel.postar("relatos", { acao: "decidir", id: ideia.id, andamento: "aproveitada", resposta: "Vamos levar para o núcleo.", nota: "Conversar com a Ana" });
  assert.equal(r.erros, "");
  const lido = await assinado({ acao: "andamento", protocolos: ["IDEIA-XYZ789", "NAO-EXISTE"] });
  assert.deepEqual(lido.json.protocolos, [{ protocolo: "IDEIA-XYZ789", andamento: "aproveitada", resposta: "Vamos levar para o núcleo." }]);
  assert.doesNotMatch(JSON.stringify(lido.json), /Ana/);
});

test("relato esperando aparece no Início de quem coordena", async () => {
  await assinado({ acao: "relato", protocolo: "PROTOCOLO-DEF456", tipo: "relato", categoria: "BAIRRO", texto: "Buraco grande na rua da escola", anonimo: true });
  const inicio = painel.abrir("index");
  assert.equal(inicio.erros, "");
  assert.match(inicio.html, /1 relato esperando a coordenação/);
});
