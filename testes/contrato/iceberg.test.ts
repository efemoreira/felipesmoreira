import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { filtrar, nomeCanonico, ordenar, relacionados } from "@/features/iceberg/dominio";
import type { Filtros, Imagem, Verbete } from "@/features/iceberg/tipos";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (nome: string) => JSON.parse(readFileSync(path.join(raiz, "src/features/iceberg", nome), "utf8"));
const base = ler("acervo.json");
const documentarios = ler("documentarios.json");
const contexto = ler("contexto.json");
const imagens: Imagem[] = ler("imagens.json");
const verbetes: Verbete[] = [...base.items, ...documentarios.items, ...contexto.events];
const iniciais: Filtros = { busca: "", serie: "todas", natureza: "todas", periodo: "todos", camada: null };

test("iceberg: os dois documentários e os catálogos anteriores mantêm referências navegáveis", () => {
  assert.equal(base.items.length, 115);
  assert.equal(new Set(verbetes.map(v => v.id)).size, verbetes.length);
  const ids = new Set(verbetes.map(v => v.id));
  assert.deepEqual(documentarios.videos.map((v: { id: string }) => v.id).sort(), ["njBYes3uRjU", "vlejVaeZYUQ"].sort());
  for (const v of verbetes) {
    assert.ok(v.sources.length, `${v.id}: sem fonte`);
    for (const fonte of v.sources) assert.ok(["http:", "https:"].includes(new URL(fonte.url).protocol), `${v.id}: endereço inválido`);
    for (const id of v.relatedIds ?? []) assert.ok(ids.has(id), `${v.id} aponta para ${id}, que não existe`);
    if (v.videoId) {
      const video = documentarios.videos.find((f: { id: string }) => f.id === v.videoId);
      assert.ok(video && v.videoSeconds != null && v.videoSeconds >= 0 && v.videoSeconds < video.seconds, `${v.id}: tempo fora do vídeo`);
    }
  }
  assert.ok(documentarios.items.some((v: Verbete) => v.videoId === "vlejVaeZYUQ" && v.videoSeconds === 2010), "o trecho enviado pelo usuário precisa continuar acessível");
});

test("iceberg: filtros combinados respeitam série, período, ausência de data e busca sem acento", () => {
  const resultado = filtrar(verbetes, { ...iniciais, busca: "impeachment", serie: "mbl", periodo: "2010" });
  assert.ok(resultado.length > 0);
  assert.ok(resultado.every(v => v.series === "mbl" && v.year !== null && v.year >= 2010 && v.year < 2020));
  assert.ok(filtrar(verbetes, { ...iniciais, busca: "Flavio" }).length > 0);
  assert.ok(filtrar(verbetes, { ...iniciais, camada: 6 }).every(v => v.layer === 6));
  assert.ok(filtrar(verbetes, { ...iniciais, periodo: "sem-data" }).every(v => v.year === null));
  assert.equal(nomeCanonico("Lula"), "Luiz Inácio Lula da Silva");
  assert.deepEqual(filtrar(verbetes, { ...iniciais, busca: "texto que não existe 971823" }), []);
});

test("iceberg: conexões editoriais e cronologia não perdem o caso de origem", () => {
  const origem = verbetes.find(v => v.id === "mbl-marcha-2015")!;
  assert.ok(relacionados(origem, verbetes).some(v => v.id === "pt-1-9"));
  assert.ok(!relacionados(origem, verbetes).some(v => v.id === origem.id));
  const ordenados = ordenar(verbetes, "antigos").filter(v => v.year !== null);
  assert.ok(ordenados.every((v, i) => i === 0 || v.year! >= ordenados[i - 1].year!));
});

test("iceberg: toda fotografia publicada tem autoria, licença e página de origem", () => {
  assert.ok(imagens.filter(i => i.kind === "portrait").length >= 8);
  assert.ok(imagens.filter(i => i.kind === "event").length >= 3);
  const ids = new Set(verbetes.map(v => v.id));
  for (const i of imagens) {
    assert.ok(i.credit && i.license && i.caption && i.alt, `${i.id}: metadados incompletos`);
    assert.ok(i.src.startsWith("/iceberg/imagens/") && !i.src.includes(".."));
    assert.ok(new URL(i.sourceUrl).pathname.length > 1, `${i.id}: origem precisa apontar para o arquivo`);
    assert.ok(["http:", "https:"].includes(new URL(i.licenseUrl).protocol));
    assert.ok(statSync(path.join(raiz, "public", i.src)).size <= 250_000, `${i.id}: arquivo pesado`);
    for (const id of i.eventIds) assert.ok(ids.has(id), `${i.id}: fotografia aponta para um verbete inexistente`);
  }
});
