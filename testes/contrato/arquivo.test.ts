import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { apelido } from "../../src/app/painel/estudio/exportar.ts";
import { chamarPhp, mapearPhp } from "./ponte.ts";

/**
 * `apelido()` do Estúdio (TS) ↔ `apelido()` da Produção (PHP)
 *
 * O nome `AAAA-MM-DD_tipo_assunto` é gerado nos dois lados: o card do quadro o
 * escreve em `nome_de_arquivo()`, e o PNG que sai do Estúdio o escreve em
 * `nomeArquivo()`. **Se discordarem, o Acervo recebe dois nomes diferentes para
 * a mesma peça** — e o Acervo é justamente quem vai procurar por nome depois.
 *
 * O CLAUDE.md diz "mexeu num, mexa no outro". Este teste é o que descobre
 * quando alguém mexeu em um só.
 */

const TITULOS = [
  "Obra parada há dois anos no Bom Jardim",
  "Prefeitura de Fortaleza e a fila do SUS",
  "AÇÃO na Praça do Ferreira",
  "Segurança: facção domina o bairro",
  "R$ 4,2 milhões sumiram",
  "Vídeo — a resposta do secretário",
  "  espaços    demais  ",
  "de da do das dos e a o em no na para",
  "só-palavras-de-ligação",
  "UMA PALAVRA",
  "1234",
  "Zé",
  "coração partido no Cariri",
  "Juazeiro do Norte: o que mudou",
  "acentos áàãâä éèêë íìîï óòõôö úùûü ç ñ",
  "pontuação!!! ??? ... ---",
];

describe("nome de arquivo: apelido do Estúdio e apelido da Produção", () => {
  test("dão o mesmo assunto para o que a campanha escreve", () => {
    const doPhp = mapearPhp("apelido", TITULOS) as string[];
    const divergentes = TITULOS.map((t, i) => [t, apelido(t), doPhp[i]] as const).filter(
      ([, ts, php]) => ts !== php,
    );

    assert.equal(
      divergentes.length,
      0,
      "o Acervo receberia dois nomes para a mesma peça:\n" +
        divergentes
          .map(([t, ts, php]) => `  ${JSON.stringify(t)}\n    Estúdio  → ${ts}\n    Produção → ${php}`)
          .join("\n"),
    );
  });

  test("cortam no mesmo número de palavras", () => {
    const longo = "primeira segunda terceira quarta quinta sexta setima";
    const cortes = [1, 2, 3, 4, 8];
    const doPhp = chamarPhp(cortes.map((n) => ({ fn: "apelido", args: [longo, n] }))) as string[];

    cortes.forEach((n, i) => {
      assert.equal(
        apelido(longo, n),
        doPhp[i],
        `cortando em ${n} palavra(s) os dois lados param em lugares diferentes`,
      );
    });
  });

  test("título sem nenhuma palavra útil vira 'sem-assunto' nos dois", () => {
    /* Card cujo título é só preposição existe: "de o a". Sem esta saída o nome
       do arquivo terminaria em "_" e o Acervo teria uma linha sem assunto. */
    const vazios = ["", "   ", "!!!", "de da do", "- - -"];
    const doPhp = mapearPhp("apelido", vazios) as string[];
    vazios.forEach((t, i) => {
      assert.equal(apelido(t), "sem-assunto", `TS não caiu em sem-assunto para ${JSON.stringify(t)}`);
      assert.equal(doPhp[i], "sem-assunto", `PHP não caiu em sem-assunto para ${JSON.stringify(t)}`);
    });
  });

  test("a fronteira do sem_acento é declarada, e não uma surpresa", () => {
    /* `sem_acento()` do PHP é uma TABELA — cobre o que o português usa. O
       `normalize("NFD")` do TS cobre o Unicode inteiro. Letra com diacrítico
       fora da tabela sai diferente dos dois lados, e este teste existe para
       que isso seja um limite DECLARADO e não uma descoberta em produção.

       Se um desses aparecer num título de verdade, o conserto é acrescentar a
       letra à tabela do `sem_acento()` — e não trocar o NFD, que é o lado
       definido pelo Unicode e igual em qualquer máquina.

       As letras aqui viram CONSOANTE de propósito: `Ā` e `Ő` não servem para
       medir a fronteira, porque viram "a" e "o", que o filtro de palavras de
       ligação descarta — os dois lados dariam "sem-assunto" por motivos
       diferentes e o teste passaria sem testar nada. */
    const foraDaTabela = ["Ş", "Ž", "Ğ", "Ć"];
    const doPhp = mapearPhp("apelido", foraDaTabela) as string[];

    assert.deepEqual(
      foraDaTabela.map((t, i) => [t, apelido(t), doPhp[i]]),
      [
        ["Ş", "s", "sem-assunto"],
        ["Ž", "z", "sem-assunto"],
        ["Ğ", "g", "sem-assunto"],
        ["Ć", "c", "sem-assunto"],
      ],
      "a fronteira mudou: ou a tabela do sem_acento cresceu (ótimo — atualize " +
        "este teste), ou o NFD deixou de normalizar (aí é regressão).",
    );
  });

  test("uma vogal acentuada sozinha é palavra de ligação, e some", () => {
    /* Descoberto escrevendo o teste acima, e vale registrar: "Ã" vira "a", que
       está na lista de palavras que não ajudam a achar o arquivo. Título de uma
       letra só não existe na prática — mas quem for mexer no filtro precisa
       saber que ele roda DEPOIS de tirar o acento, e não antes. */
    const vogais = ["Ã", "É", "Ó"];
    const doPhp = mapearPhp("apelido", vogais) as string[];
    vogais.forEach((v, i) => {
      assert.equal(apelido(v), "sem-assunto", `TS não descartou ${v}`);
      assert.equal(doPhp[i], "sem-assunto", `PHP não descartou ${v}`);
    });
  });
});
