#!/usr/bin/env node
/**
 * Votos de UM candidato de 2022 ou 2024 somados por bairro, para a vista
 * "Movimento" de /resultados (aba Candidatos). O export do projeto de análise
 * só traz candidato de 2026; quem disputou antes pelo movimento (o Pedro Arthur
 * em 2024, o Guto como estadual em 2022) sai daqui.
 *
 * Entrada: a votação por seção do TSE, descompactada (Dados Abertos →
 * Resultados → "Votação por seção eleitoral" do ano, arquivo da UF):
 *   https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2024_CE.zip
 *
 * Uso:
 *   node scripts/votos-por-bairro.mjs --csv votacao_secao_2024_CE.csv --uf ce --municipio 13897 --ano 2024 --cargo ver --numero 44999
 *   node scripts/votos-por-bairro.mjs --csv votacao_secao_2022_SP.csv --uf sp --municipio 71072 --ano 2022 --cargo de --numero 44777
 *
 * Saída: public/resultados-2026/movimento/<uf>-<municipio>-<ano>-<numero>.json
 *
 * O bairro de cada seção vem do local de votação (zona + número do local) no
 * cadastro de 2026 (`bairros/<uf>/<municipio>.json`). Local que mudou de número
 * desde aquele ano fica em `semBairro` — o total confere com o oficial do TSE.
 */
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const CODIGO_CARGO = { pres: "1", gov: "3", sen: "5", df: "6", de: "7", pref: "11", ver: "13" };

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .join(" ")
    .split("--")
    .filter(Boolean)
    .map((p) => p.trim().split(/\s+/))
    .map(([k, ...v]) => [k, v.join(" ")]),
);
for (const k of ["csv", "uf", "municipio", "ano", "cargo", "numero"]) {
  if (!args[k]) {
    console.error(`falta --${k} (veja o uso no topo do script)`);
    process.exit(1);
  }
}
if (!CODIGO_CARGO[args.cargo]) {
  console.error(`--cargo deve ser um de: ${Object.keys(CODIGO_CARGO).join(", ")}`);
  process.exit(1);
}

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DADOS = path.join(RAIZ, "public/resultados-2026");
const cidade = JSON.parse(readFileSync(path.join(DADOS, "bairros", args.uf, `${args.municipio}.json`), "utf8"));

/* (zona, local) → bairro_chave, pelo cadastro de 2026 */
const col = (t, nome) => t.colunas.indexOf(nome);
const chaves = cidade.bairros.linhas.map((l) => l[col(cidade.bairros, "bairro_chave")]);
const bairroDoLocal = new Map(
  cidade.locais.linhas.map((l) => [`${Number(l[col(cidade.locais, "zona")])}|${Number(l[col(cidade.locais, "local")])}`, chaves[l[col(cidade.locais, "b")]]]),
);

const porBairro = new Map();
let total = 0;
let semBairro = 0;
let cab = null;

const linhas = readline.createInterface({ input: createReadStream(args.csv, { encoding: "latin1" }), crlfDelay: Infinity });
for await (const linha of linhas) {
  const campos = linha.split(";").map((c) => c.replace(/^"|"$/g, ""));
  if (!cab) {
    cab = Object.fromEntries(campos.map((c, i) => [c, i]));
    for (const c of ["CD_MUNICIPIO", "NR_ZONA", "CD_CARGO", "NR_VOTAVEL", "QT_VOTOS", "NR_LOCAL_VOTACAO"]) {
      if (!(c in cab)) throw new Error(`coluna ${c} não está no CSV: é mesmo a votação por seção?`);
    }
    continue;
  }
  if (campos[cab.CD_MUNICIPIO] !== args.municipio || campos[cab.CD_CARGO] !== CODIGO_CARGO[args.cargo] || campos[cab.NR_VOTAVEL] !== args.numero) continue;
  const votos = Number(campos[cab.QT_VOTOS]);
  total += votos;
  const chave = bairroDoLocal.get(`${Number(campos[cab.NR_ZONA])}|${Number(campos[cab.NR_LOCAL_VOTACAO])}`);
  if (!chave) semBairro += votos;
  else porBairro.set(chave, (porBairro.get(chave) ?? 0) + votos);
}

const saida = {
  ano: Number(args.ano),
  uf: args.uf,
  municipio: args.municipio,
  cargo: args.cargo,
  numero: args.numero,
  fonte: `Dados Abertos do TSE, votação por seção ${args.ano} (${path.basename(args.csv)}), somada pelo local de votação do cadastro de 2026`,
  total,
  semBairro,
  bairros: Array.from(porBairro, ([bairro_chave, votos]) => ({ bairro_chave, votos })).sort((a, b) => b.votos - a.votos),
};
const destino = path.join(DADOS, "movimento", `${args.uf}-${args.municipio}-${args.ano}-${args.numero}.json`);
mkdirSync(path.dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(saida));
console.log(`${total} votos (${semBairro} sem bairro casado) em ${porBairro.size} bairros → ${path.relative(RAIZ, destino)}`);
if (!total) console.warn("nenhum voto: confira o código do município (TSE, não IBGE), o cargo e o número");
