import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

/**
 * AS TRAVAS QUE ERAM CHECKLIST MANUAL.
 *
 * O CLAUDE.md descreve, em texto, sete passos para acrescentar uma área ao
 * painel — chave em `AREAS`, entrada em `DESTINO_AREA`, `RewriteRule` no
 * `publish.yml`, ícone, grupo em `GRUPOS_NAV`, rótulo curto. **Esquecer um
 * passo não quebra nada visivelmente**: a permissão existe, a tela abre pelo
 * endereço direto, e a área simplesmente não aparece no menu de ninguém.
 *
 * Este arquivo transforma esse checklist em falha de teste.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (p: string) => readFileSync(path.join(RAIZ, p), "utf8");

/** As chaves de um `const NOME = [ 'chave' => …, ]` do PHP. */
function chavesDe(fonte: string, constante: string): string[] {
  const i = fonte.indexOf(`const ${constante} = [`);
  assert.notEqual(i, -1, `não achei a constante ${constante}`);
  const corpo = fonte.slice(i, fonte.indexOf("\n];", i));
  return [...corpo.matchAll(/^\s{4}'([a-z-]+)'\s*=>/gm)].map((m) => m[1]);
}

const sessao = ler("public/painel/sessao.php");
const icones = ler("public/painel/icones.php");
const layout = ler("public/painel/layout.php");
const fluxo = ler(".github/workflows/publish.yml");
const AREAS = chavesDe(sessao, "AREAS");

describe("painel: o checklist de área nova, virado teste", () => {
  test("achei as áreas para conferir", () => {
    assert.ok(AREAS.length >= 8, `só achei ${AREAS.length} áreas — o formato de AREAS mudou?`);
  });

  test("toda área tem destino em DESTINO_AREA", () => {
    const destinos = chavesDe(sessao, "DESTINO_AREA");
    assert.deepEqual(
      AREAS.filter((a) => !destinos.includes(a)),
      [],
      "área sem destino: o menu não sabe para onde mandar",
    );
  });

  test("toda área aparece em algum grupo de GRUPOS_NAV", () => {
    const i = layout.indexOf("const GRUPOS_NAV = [");
    const bloco = layout.slice(i, layout.indexOf("\n];", i));
    const noMenu = new Set([...bloco.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));
    assert.deepEqual(
      AREAS.filter((a) => !noMenu.has(a)),
      [],
      "área fora de GRUPOS_NAV: a permissão existe e a área não aparece no menu de ninguém",
    );
  });

  test("toda área tem rótulo curto para a barra do celular", () => {
    const rotulos = chavesDe(layout, "ROTULO_CURTO");
    assert.deepEqual(
      AREAS.filter((a) => !rotulos.includes(a)),
      [],
      "área sem ROTULO_CURTO: na barra do celular ela sai com o nome comprido e estoura",
    );
  });

  test("toda área tem ícone declarado em ICONE_AREA", () => {
    const declarados = chavesDe(icones, "ICONE_AREA");
    assert.deepEqual(
      AREAS.filter((a) => !declarados.includes(a)),
      [],
      "área sem ícone: o menu desenha a estrela genérica no lugar",
    );
  });

  test("toda área tem RewriteRule de URL limpa no publish.yml", () => {
    const semRegra = AREAS.filter(
      (a) => !new RegExp(`RewriteRule \\^painel/${a}/\\?\\$`).test(fluxo),
    );
    assert.deepEqual(
      semRegra,
      [],
      "área sem RewriteRule: /painel/<area> cai no fallback e serve a home",
    );
  });
});

describe("painel: as rotas renomeadas continuam respondendo", () => {
  /* Link de campanha se dita em voz alta, e hífen não. As quatro rotas antigas
     circulam em grupo de WhatsApp desde antes da renomeação. */
  const RENOMEADAS = [
    ["quero-ajudar", "queroajudar"],
    ["a-missao", "amissao"],
    ["herois-do-ceara", "heroisdoceara"],
    ["kit", "municao"],
  ] as const;

  for (const [antiga, nova] of RENOMEADAS) {
    test(`/${antiga} → /${nova}, com 301 e QSA`, () => {
      const linha = fluxo
        .split("\n")
        .find((l) => l.includes("RewriteRule") && new RegExp(`\\^${antiga}/?\\\\?\\$|\\^${antiga}`).test(l));

      assert.ok(linha, `sumiu a regra de /${antiga}: a URL antiga cai no fallback e devolve a HOME com status 200 — um soft 404, pior que o 404 honesto`);
      assert.match(linha!, new RegExp(`/${nova}`), `a regra de /${antiga} não aponta para /${nova}`);
      assert.match(linha!, /R=301/, `/${antiga} precisa de 301, não de reescrita silenciosa`);
      assert.match(
        linha!,
        /QSA/,
        `/${antiga} sem QSA: /${antiga}?funcao=olheiro&de=joao-silva chega do outro lado SEM os parâmetros — ` +
          `o formulário abre em branco e o crédito de quem trouxe a pessoa se perde`,
      );
    });
  }
});

describe("painel: o que não pode vazar para o site público", () => {
  test("o grupo de trabalho não existe no bundle público", () => {
    /* Dois grupos, e a linha divisória é a CONTA, não a intenção. O GERAL é o
       único que o site público divulga; o de TRABALHO é de quem já tem conta.
       Se ele circulasse no site, encheria de gente que a coordenação ainda não
       conferiu e viraria grupo de recados.

       Por isso ele existe SÓ no `sessao.php` — não há par em TypeScript, e não
       pode haver: num export estático, tudo que entra em `src/` é público. O
       CLAUDE.md registra este grep como obrigação de quem mexe; aqui ele roda
       sozinho, e sobre o convite de verdade em vez de sobre um prefixo
       decorado. */
    const linha = sessao.split("\n").find((l) => l.startsWith("const GRUPO_TRABALHO"));
    assert.ok(linha, "não achei GRUPO_TRABALHO em public/painel/sessao.php");

    const convite = linha!.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)?.[1];
    assert.ok(convite, "o GRUPO_TRABALHO deixou de ser um link do WhatsApp");

    let achados = "";
    try {
      achados = execFileSync("grep", ["-rl", convite!, "src", "public"], {
        cwd: RAIZ,
        encoding: "utf8",
      });
    } catch {
      achados = ""; // grep sem resultado sai com status 1
    }
    const vazando = achados
      .split("\n")
      .filter((f) => f && !f.startsWith("public/painel/"));

    assert.deepEqual(
      vazando,
      [],
      "o convite do grupo de TRABALHO apareceu fora de public/painel/ — num export " +
        "estático isso é o bundle público, e o grupo vira grupo de recados",
    );
  });

  test("nenhuma aula do manual entra no bundle do site", () => {
    /* O conteúdo da formação é documento interno e sai só pelo api/aulas.php.
       Num export estático, tudo que entra no bundle é público. */
    let achados = "";
    try {
      achados = execFileSync("grep", ["-rl", "aulas-conteudo", "src"], { cwd: RAIZ, encoding: "utf8" });
    } catch {
      achados = "";
    }
    assert.equal(achados.trim(), "", "algum arquivo de src/ referencia o conteúdo das aulas");
  });
});
