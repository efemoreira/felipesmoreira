import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chamarPhp } from "./ponte.ts";

/**
 * OS ARQUIVOS QUE OS DOIS LADOS LEEM.
 *
 * `funcoes.json` e `municipios-ce.json` são fonte única de verdade: o Next
 * importa no build e o PHP lê o mesmo arquivo, copiado para `out/` pelo
 * `publish.yml`. A mecânica só funciona enquanto a cópia existir — e é uma
 * linha de YAML que ninguém olha depois de escrever.
 *
 * **Se a cópia sumir, nada quebra visivelmente**: `cidade_valida()` cai no
 * caminho de "catálogo ausente não apaga cidade" e passa a aceitar qualquer
 * grafia, e o agrupamento por região volta a contar a mesma cidade três vezes.
 * É o tipo de defeito que só aparece no relatório, semanas depois.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (p: string) => readFileSync(path.join(RAIZ, p), "utf8");

describe("fontes únicas: os arquivos que o Next e o PHP dividem", () => {
  test("o publish.yml copia funcoes.json e municipios-ce.json para out/", () => {
    const fluxo = ler(".github/workflows/publish.yml");
    for (const arquivo of ["funcoes.json", "municipios-ce.json"]) {
      assert.match(
        fluxo,
        new RegExp(`cp\\s+src/data/${arquivo.replace(".", "\\.")}\\s+out/${arquivo.replace(".", "\\.")}`),
        `o publish.yml deixou de copiar ${arquivo} — o painel passa a ler um arquivo que não existe, ` +
          `e o defeito só aparece no relatório, semanas depois`,
      );
    }
  });

  test("o painel enxerga os 184 municípios do Ceará, e o rótulo de fora bate", () => {
    const catalogo = JSON.parse(ler("src/data/municipios-ce.json"));
    /* `cidade_valida()` devolve a grafia DO CATÁLOGO, e não a que chegou: é ela
       que `normalizar_pessoa()` chama, então nenhuma ficha entra com cidade
       inventada. Se o PHP não estiver lendo o mesmo arquivo, isto para de valer. */
    const amostra = ["Fortaleza", "Juazeiro do Norte", "Sobral", "Crato", "Maracanaú"];
    const doPhp = chamarPhp(amostra.map((c) => ({ fn: "cidade_valida", args: [c] }))) as string[];

    amostra.forEach((c, i) => {
      assert.ok(catalogo.municipios.includes(c), `${c} não está no JSON`);
      assert.equal(doPhp[i], c, `o PHP não reconheceu ${c} — está lendo outro arquivo?`);
    });

    assert.equal(catalogo.municipios.length, 184, "o Ceará tem 184 municípios");

    /* "Fora do Ceará" é a primeira opção e o rótulo mora no JSON, para os dois
       lados compararem a mesma string. Sem ela a pessoa escolhe a cidade mais
       parecida, que é pior do que "de fora". */
    const [fora] = chamarPhp([{ fn: "cidade_valida", args: [catalogo.fora] }]) as string[];
    assert.equal(fora, catalogo.fora, "o rótulo de fora do Ceará divergiu entre o JSON e o PHP");
  });

  test("cidade inventada não entra por nenhum dos dois lados", () => {
    const inventadas = ["Fortalezza", "São Paulo", "  ", "<script>"];
    const doPhp = chamarPhp(inventadas.map((c) => ({ fn: "cidade_valida", args: [c] }))) as string[];
    doPhp.forEach((v, i) => {
      assert.equal(v, "", `o PHP aceitou ${JSON.stringify(inventadas[i])} como cidade`);
    });
  });

  test("toda função do catálogo tem ícone que existe em icons.tsx", () => {
    /* O CLAUDE.md diz: "ao acrescentar função nova, o ícone precisa existir em
       src/components/icons.tsx". Ícone que falta não quebra o build — o
       componente devolve nada, e o cartão da função sai sem desenho. */
    const catalogo = JSON.parse(ler("src/data/funcoes.json"));
    const icones = ler("src/components/icons.tsx");
    const faltando = catalogo.funcoes
      .map((f: { id: string; icone: string }) => f)
      .filter((f: { icone: string }) => !new RegExp(`\\b${f.icone}\\s*:`).test(icones));

    assert.deepEqual(
      faltando.map((f: { id: string; icone: string }) => `${f.id} → ${f.icone}`),
      [],
      "função com ícone que não existe: o cartão dela sai sem desenho, sem erro nenhum",
    );
  });

  test("as áreas sugeridas por cada função existem no painel", () => {
    /* O `areas` de cada função vira sugestão de marcação na hora de aprovar a
       inscrição. Área que não existe em AREAS é uma caixa que nunca libera nada. */
    const catalogo = JSON.parse(ler("src/data/funcoes.json"));
    const sessao = ler("public/painel/sessao.php");
    const bloco = sessao.slice(sessao.indexOf("const AREAS = ["));
    const declaradas = new Set(
      [...bloco.slice(0, bloco.indexOf("];")).matchAll(/'([a-z-]+)'\s*=>/g)].map((m) => m[1]),
    );

    const invalidas: string[] = [];
    for (const f of catalogo.funcoes as { id: string; areas: string[] }[]) {
      for (const a of f.areas ?? []) {
        if (!declaradas.has(a)) invalidas.push(`${f.id} → ${a}`);
      }
    }
    assert.deepEqual(invalidas, [], "função sugerindo área que não existe em AREAS");
  });
});
