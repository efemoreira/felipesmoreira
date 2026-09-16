import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { montarSandbox } from "../sandbox.ts";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * O CATÁLOGO DA OFICINA É FONTE ÚNICA, e este teste é o que a segura.
 *
 * Os 37 formatos nasceram da fusão de dois materiais que diziam a mesma coisa
 * em dois lugares — os 32 dias do `update/Desafio_Formato_Criativo_32_dias.md`
 * e os 19 do curso Formato Criativo. Sete apareciam nos dois. A fusão só vale
 * enquanto ninguém acrescenta o formato repetido de volta: dois "Dinamismo" no
 * catálogo dariam duas médias na aba Números para o mesmo formato, e a pergunta
 * do desafio inteiro ("quais 2 ou 3 funcionam no meu nicho") perderia a
 * resposta.
 *
 * O catálogo é lido pelo PHP de verdade, e não por regex: ele é só constante —
 * não abre disco, não lê sessão —, então um `php -r` que o inclui e devolve
 * JSON diz exatamente o que o painel vai ler. A `ponte.php` não serve aqui de
 * propósito: a lista dela é de funções puras com espelho do outro lado, e
 * abri-la para `constant()` seria abrir a porta que o comentário dela fecha.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CATALOGO = path.join(RAIZ, "public/painel/oficina-catalogo.php");

interface Formato {
  nome: string;
  fonte: string;
  resumo: string;
  dica: string;
  links: { rotulo: string; url: string }[];
}

function lerCatalogo(): {
  formatos: Record<string, Formato>;
  ganchos: Record<string, { nome: string; estrutura: string }>;
  fontes: Record<string, string>;
  apoio: { rotulo: string; url: string }[];
} {
  const r = spawnSync(
    "php",
    [
      "-r",
      `require ${JSON.stringify(CATALOGO)};
       echo json_encode([
         'formatos' => FORMATOS_OFICINA,
         'ganchos'  => GANCHOS_OFICINA,
         'fontes'   => FONTES_OFICINA,
         'apoio'    => APOIO_OFICINA,
       ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);`,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`o catálogo não carregou: ${r.stderr.trim()}`);
  return JSON.parse(r.stdout);
}

const { formatos, ganchos, fontes, apoio } = lerCatalogo();
const chaves = Object.keys(formatos);

describe("oficina: o catálogo é fonte única dos formatos", () => {
  test("são 37 formatos — os 19 do curso mais os 18 que só o desafio traz", () => {
    assert.equal(chaves.length, 37);
  });

  test("nenhum formato aparece duas vezes, nem com outro nome", () => {
    const nomes = chaves.map((c) => formatos[c].nome.toLowerCase());
    assert.deepEqual(
      nomes.filter((n, i) => nomes.indexOf(n) !== i),
      [],
      "formato repetido no catálogo — a fusão dos dois materiais desfez",
    );
  });

  test("toda chave é slug: é ela que vai para o disco e para a URL", () => {
    for (const c of chaves) {
      assert.match(c, /^[a-z0-9]+(-[a-z0-9]+)*$/, `a chave ${c} não é um slug`);
    }
  });

  test("todo formato diz o que é e como gravar", () => {
    for (const c of chaves) {
      const f = formatos[c];
      assert.ok(f.nome.trim().length >= 3, `${c} sem nome`);
      assert.ok(f.resumo.trim().length >= 30, `${c} sem resumo que explique o formato`);
      assert.ok(f.dica.trim().length >= 30, `${c} sem dica de como gravar`);
    }
  });

  test("toda fonte declarada existe em FONTES_OFICINA", () => {
    for (const c of chaves) {
      assert.ok(fontes[formatos[c].fonte], `${c} tem fonte desconhecida: ${formatos[c].fonte}`);
    }
  });

  test("todo link tem rótulo e é URL de verdade", () => {
    for (const [c, f] of Object.entries(formatos)) {
      for (const l of f.links) {
        assert.ok(l.rotulo.trim() !== "", `link sem rótulo em ${c}`);
        assert.match(l.url, /^https:\/\/[^\s]+$/, `link torto em ${c}: ${l.url}`);
      }
    }
    for (const l of apoio) {
      assert.match(l.url, /^https:\/\/[^\s]+$/, `link de apoio torto: ${l.url}`);
    }
  });

  test("todo formato do curso carrega ao menos um link — é o que o curso adiciona", () => {
    for (const c of chaves) {
      if (formatos[c].fonte === "desafio") continue;
      if (c === "combinado") continue;  // o fecho não tem aula: ele sai das suas métricas
      assert.ok(formatos[c].links.length > 0, `${c} vem do curso e não tem link de aula nem de roteiro`);
    }
  });

  test("o Formato Combinado é o último do catálogo, porque é o fecho", () => {
    assert.equal(chaves[chaves.length - 1], "combinado");
  });
});

describe("oficina: o catálogo não perde nenhuma referência do md de origem", () => {
  /* O CATÁLOGO SUBSTITUIU O MD COMO FONTE DE USO, mas o md continua sendo a
     origem — e a fusão dos dois materiais só vale se nada se perdeu no caminho.
     Os 16 reels da Hanah são a única referência ABERTA da lista (as aulas do
     curso pedem login), e cinco formatos — Vlog, Conversa de Bar,
     Criativo-Preguiçoso, O Narrador e o Formato Combinado — não têm outra:
     perder um reel deixaria o formato sem nenhum lugar para olhar. */
  const md = readFileSync(path.join(RAIZ, "update/Desafio_Formato_Criativo_32_dias.md"), "utf8");
  const reelsDoMd = [...md.matchAll(/https:\/\/www\.instagram\.com\/reel\/[\w-]+\//g)].map((m) => m[0]);
  const urlsDoCatalogo = Object.values(formatos).flatMap((f) => f.links.map((l) => l.url));

  test("o md traz os 16 formatos que a Hanah publicou aberto", () => {
    assert.equal(new Set(reelsDoMd).size, 16);
  });

  test("todo reel do md está no catálogo", () => {
    const sumidos = [...new Set(reelsDoMd)].filter((u) => !urlsDoCatalogo.includes(u));
    assert.deepEqual(sumidos, [], "reel do md que o catálogo não cita mais");
  });

  test("nenhum reel foi pendurado em dois formatos", () => {
    const reels = urlsDoCatalogo.filter((u) => u.includes("instagram.com"));
    assert.equal(new Set(reels).size, reels.length, "o mesmo reel ilustra dois formatos diferentes");
  });

  test("as quatro fontes da pesquisa externa continuam citadas no apoio", () => {
    const fontes = [...md.matchAll(/\((https:\/\/(?:flowshorts|www\.creatorsjet|www\.socialync|miraflow)[^)]+)\)/g)].map((m) => m[1]);
    assert.equal(fontes.length, 4);
    const apoiadas = apoio.map((l) => l.url);
    for (const f of fontes) {
      assert.ok(apoiadas.includes(f), `a fonte ${f} saiu do apoio — os formatos 20 a 37 vieram dela`);
    }
  });

  test("os formatos que só o desafio traz têm reel ou vivem das fontes gerais", () => {
    /* Os 13 formatos de pesquisa externa não têm link próprio, e está certo:
       eles não saíram de um post, saíram das quatro fontes do apoio. O que não
       pode é um formato da Hanah ficar sem o reel dele. */
    const semLink = Object.entries(formatos).filter(([, f]) => f.links.length === 0);
    assert.equal(semLink.length, 13);
    for (const [c, f] of semLink) {
      assert.equal(f.fonte, "desafio", `${c} não é de pesquisa externa e ficou sem link`);
    }
  });
});

describe("oficina: os ganchos são o segundo eixo da medição", () => {
  test("são as oito estruturas do anexo do desafio", () => {
    assert.equal(Object.keys(ganchos).length, 8);
  });

  test("todo gancho tem nome e a estrutura pronta para adaptar", () => {
    for (const [c, g] of Object.entries(ganchos)) {
      assert.ok(g.nome.trim() !== "", `gancho ${c} sem nome`);
      assert.match(g.estrutura, /\[.+\]/, `o gancho ${c} não traz o campo a preencher entre colchetes`);
    }
  });
});

describe("oficina: toda capa desenhada existe e é usada", () => {
  /* A CAPA BASE É DESENHADA porque só 16 dos 37 formatos têm vídeo público
     para ilustrar: a Hotmart não devolve `og:image` (parede de login), o Trello
     é quadro privado, e os 13 formatos de pesquisa externa não saíram de post
     nenhum. Uma lista com 16 cartões cheios e 21 vazios faz a falta parecer
     defeito — então o desenho é o piso, e a foto do reel entra por cima onde
     existe. Formato sem desenho volta a ser um buraco na lista. */
  const painel = montarSandbox({ semear: false }).dir + "/painel";
  const r = spawnSync(
    "php",
    [
      "-r",
      `require ${JSON.stringify(painel + "/oficina-capas.php")};
       echo json_encode([
         'mapa'    => CAPA_DE_FORMATO,
         'tracos'  => CAPA_TRACOS,
         'moldura' => CAPA_MOLDURA,
       ], JSON_UNESCAPED_SLASHES);`,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`as capas não carregaram: ${r.stderr.trim()}`);
  const capas: {
    mapa: Record<string, string>;
    tracos: Record<string, string[]>;
    moldura: string;
  } = JSON.parse(r.stdout);

  test("todo formato do catálogo tem uma capa desenhada", () => {
    const sem = chaves.filter((c) => !capas.mapa[c]);
    assert.deepEqual(sem, [], "formato sem desenho fica como cartão vazio na lista");
  });

  test("toda capa apontada existe de verdade", () => {
    for (const [c, forma] of Object.entries(capas.mapa)) {
      assert.ok(capas.tracos[forma], `${c} aponta para a forma ${forma}, que não foi desenhada`);
    }
  });

  test("nenhum desenho ficou órfão", () => {
    const usadas = new Set(Object.values(capas.mapa));
    const orfas = Object.keys(capas.tracos).filter((f) => !usadas.has(f));
    assert.deepEqual(orfas, [], "desenho definido que nenhum formato usa");
  });

  test("todo traço é um caminho SVG válido, e cabe na moldura de 40x56", () => {
    for (const [forma, tracos] of Object.entries(capas.tracos)) {
      assert.ok(tracos.length > 0, `${forma} não tem traço nenhum`);
      for (const t of tracos) {
        assert.match(t, /^M[\d.]/, `traço de ${forma} não começa num M: ${t}`);
        assert.match(t, /^[MmLlHhVvAaCcSsQqTtZz0-9.\s-]+$/, `traço de ${forma} tem caractere estranho`);
        for (const n of t.match(/-?\d+(\.\d+)?/g) ?? []) {
          assert.ok(Math.abs(Number(n)) <= 64, `${forma} tem ${n}, fora da moldura de 40x56`);
        }
      }
    }
    assert.match(capas.moldura, /^M[\d.]/);
  });
});

describe("oficina: o catálogo não vaza para o bundle do site", () => {
  /* Mesma régua das aulas do manual: material de curso pago e anotação de
     trabalho não têm por que viajar no JavaScript de quem abre o site para ler
     as propostas. O catálogo é PHP, e `src/` não pode citá-lo. */
  test("nenhum formato do catálogo aparece em src/", () => {
    const r = spawnSync(
      "grep",
      ["-ril", "--include=*.ts", "--include=*.tsx", "edicaodofuturopelocapcut", path.join(RAIZ, "src")],
      { encoding: "utf8" },
    );
    assert.equal(r.stdout.trim(), "", "link do curso encontrado em src/ — isso vira bundle público");
  });

  test("o md de origem continua fora de src/ e de public/", () => {
    const md = readFileSync(path.join(RAIZ, "update/Desafio_Formato_Criativo_32_dias.md"), "utf8");
    assert.ok(md.length > 0, "o documento de origem sumiu");
  });
});
