import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { montarSandbox, ADMIN, CSRF, type Sandbox } from "../sandbox.ts";

let painel: Sandbox;
before(() => { painel = montarSandbox(); });
beforeEach(() => painel.ressemear());
after(() => painel.fechar());
const COOKIE = "painel_agenda=teste0000000000000000000000000000";
const SENTINELA = "ACERVO-PRIVADO-CANARIO-279";
const pacote = () => ({ versao: 1, documentos: [{
  id: "roteiro-teste", titulo: "Planejamento de teste", categoria: "Organização", arquivo: "planejamento.md", resumo: "Material reservado",
  conteudo: `# Planejamento\n${SENTINELA}\n\n- [ ] Preparar a recepção\n- [x] Conferir a agenda\n\n\x60\x60\x60text\n- [ ] Exemplo no código\n\x60\x60\x60\n`,
}], diretorio: [{ codigo: "entrada", tipo: "funcao", recorte: "Estadual" }] });

function php(codigo: string, ...argumentos: string[]): string {
  return execFileSync("php", ["-r", codigo, path.join(painel.dir, "painel", "acao-comum.php"), ...argumentos], { encoding: "utf8" });
}

/** Semeia o dono pelo modelo; a identidade estável depois é o id da conta. */
function semearAcervo() {
  php('require $argv[1]; $dono = achar_pessoa($argv[2]); $dono["usuario"] = "efemoreira"; if (!acao_importar(json_decode($argv[3], true), $dono)) exit(1);', ADMIN, JSON.stringify(pacote()));
}

async function ler() { return JSON.parse((await painel.buscar("api/acao")).html); }
async function marcar(tarefa: string, concluida: boolean, extra: Record<string, unknown> = {}, cabecalhos = {}) {
  return painel.postarApi("api/acao.php", JSON.stringify({ acao: "marcar", csrf: CSRF, documento: "roteiro-teste", tarefa, concluida, ...extra }), { cookie: COOKIE, ...cabecalhos });
}

describe("ação: acesso exclusivo ao dono", () => {
  test("anônimo não lê acervo, originais ou cópia privada", async () => {
    semearAcervo();
    painel.gravar("pessoas", []);
    for (const query of ["", "baixar=roteiro-teste", "backup=1"]) {
      const r = await painel.buscar("api/acao", query);
      assert.deepEqual(JSON.parse(r.html), { autenticado: false, pode: false });
      assert.doesNotMatch(r.html, new RegExp(SENTINELA));
      assert.match(r.cabecalhos?.["cache-control"] ?? "", /no-store/);
      assert.match(r.cabecalhos?.["x-robots-tag"] ?? "", /noindex/);
    }
  });

  test("outro administrador não lê nem substitui o acervo", async () => {
    semearAcervo();
    php('require $argv[1]; $a = acao_ler_acervo(); $a["donoId"] = "outro-dono-teste"; gravar_atomico(ARQ_ACAO, "<?php return " . var_export($a, true) . ";");');
    const antes = readFileSync(path.join(painel.dir, "dados", "acao.php"), "utf8");
    assert.deepEqual(await ler(), { autenticado: true, pode: false });
    const r = await marcar("qualquer", true);
    assert.equal(r.status, 403);
    assert.equal(readFileSync(path.join(painel.dir, "dados", "acao.php"), "utf8"), antes);
    assert.equal((await painel.buscar("acao")).status, 403);
    assert.deepEqual(JSON.parse((await painel.buscar("api/acao", "backup=1")).html), { autenticado: true, pode: false });
  });

  test("capacidade de coordenação e senha provisória não liberam a central", async () => {
    semearAcervo();
    painel.trocarCapacidades("coordenacao");
    assert.equal((await ler()).pode, false);
    painel.trocarCapacidades("adm");
    painel.gravar("pessoas", painel.ler("pessoas").map((p) => p.id === ADMIN ? { ...p, trocarSenha: true } : p));
    assert.equal((await ler()).pode, false);
  });

  test("dono recebe o acervo e permanece identificado depois de mudar seu login", async () => {
    semearAcervo();
    painel.gravar("pessoas", painel.ler("pessoas").map((p) => p.id === ADMIN ? { ...p, usuario: "novo-login-teste" } : p));
    const r = await ler();
    assert.equal(r.pode, true);
    assert.match(r.documentos[0].conteudo, new RegExp(SENTINELA));
    assert.equal(r.documentos[0].tarefas.length, 2, "a tarefa de exemplo em código entrou no checklist");
    assert.deepEqual(JSON.parse((await painel.buscar("api/acao", "acesso=1")).html), { autenticado: true, pode: true });
    const original = await painel.buscar("api/acao", "baixar=roteiro-teste");
    assert.equal(original.html, pacote().documentos[0].conteudo);
    assert.match(original.cabecalhos?.["content-disposition"] ?? "", /attachment/);
  });

  test("a ponte preserva o retorno de login e só encaminha o dono", async () => {
    semearAcervo();
    assert.equal((await painel.buscar("acao")).location, "/acao");
    painel.gravar("pessoas", []);
    const r = await painel.buscar("acao");
    assert.match(r.location, /^\/painel\/\?volta=/);
    assert.equal(decodeURIComponent(r.location.split("volta=")[1]), "/painel/acao.php");
  });
});

describe("ação: marcações persistentes", () => {
  test("marca, recarrega e desfaz; duas tarefas simultâneas se preservam", async () => {
    semearAcervo();
    const [primeira, segunda] = (await ler()).documentos[0].tarefas;
    await Promise.all([marcar(primeira.id, true), marcar(segunda.id, false)]);
    const atual = await ler();
    assert.equal(atual.progresso[primeira.id], true);
    assert.equal(atual.progresso[segunda.id], false);
    await marcar(primeira.id, false);
    assert.equal((await ler()).progresso[primeira.id], false);
  });

  test("CSRF, origem falsa e tarefa inexistente não gravam", async () => {
    semearAcervo();
    const tarefa = (await ler()).documentos[0].tarefas[0];
    assert.equal((await marcar(tarefa.id, true, { csrf: "incorreto" })).status, 403);
    assert.equal((await marcar(tarefa.id, true, {}, { origin: "https://outro.test" })).status, 403);
    assert.equal((await marcar("inexistente", true)).status, 400);
    assert.deepEqual((await ler()).progresso, {});
  });

  test("mover uma tarefa e reimportar preserva sua marcação", async () => {
    semearAcervo();
    const tarefa = (await ler()).documentos[0].tarefas[0];
    await marcar(tarefa.id, true);
    const proximo = pacote();
    proximo.documentos[0].conteudo = "# Outra abertura\n\n" + proximo.documentos[0].conteudo;
    const r = await painel.postarComArquivo("api/acao", {}, { pacote: { nome: "acao.json", conteudo: new TextEncoder().encode(JSON.stringify(proximo)), tipo: "application/json" } });
    assert.equal(r.status, 200);
    const atual = await ler();
    assert.equal(atual.documentos[0].tarefas[0].id, tarefa.id);
    assert.equal(atual.progresso[tarefa.id], true);
  });
});

describe("ação: importação e cópias", () => {
  test("validação integral e CSRF impedem substituir parcialmente o acervo", async () => {
    semearAcervo();
    const anterior = readFileSync(path.join(painel.dir, "dados", "acao.php"), "utf8");
    const invalido = pacote();
    invalido.documentos.push(invalido.documentos[0]);
    const arquivo = { nome: "acao.json", conteudo: new TextEncoder().encode(JSON.stringify(invalido)) };
    assert.equal((await painel.postarComArquivo("api/acao", {}, { pacote: arquivo })).status, 400);
    assert.equal((await painel.postarComArquivo("api/acao", { csrf: "nao" }, { pacote: arquivo })).status, 403);
    assert.equal(readFileSync(path.join(painel.dir, "dados", "acao.php"), "utf8"), anterior);
  });

  test("o backup geral não contém planos ou progresso privados; o dono tem sua cópia", async () => {
    semearAcervo();
    const tarefa = (await ler()).documentos[0].tarefas[0];
    await marcar(tarefa.id, true);
    const lista = php('require $argv[1]; require dirname($argv[1]) . "/backup-comum.php"; echo json_encode(array_map("basename", arquivos_para_backup()));');
    assert.ok(JSON.parse(lista).includes("pessoas.php"));
    assert.ok(!JSON.parse(lista).includes("acao.php"));
    assert.ok(!JSON.parse(lista).includes("acao-progresso.php"));
    const copia = await painel.buscar("api/acao", "backup=1");
    assert.equal(copia.status, 200);
    assert.ok(copia.html.startsWith("PK"));
    assert.match(copia.cabecalhos?.["content-type"] ?? "", /application\/zip/);
    assert.ok(existsSync(path.join(painel.dir, "dados", "acao.php")));
  });

  test("administrador genérico não pode assumir a central vazia", async () => {
    assert.deepEqual(await ler(), { autenticado: true, pode: false });
    assert.equal((await marcar("tarefa", true)).status, 403);
    assert.ok(!existsSync(path.join(painel.dir, "dados", "acao.php")));
  });
});
