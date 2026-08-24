import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * O CARTÃO DO LINK DE PRESENÇA — três peças que têm de concordar.
 *
 * O site é exportado estático: existe um `presenca.html` só, e qual encontro é
 * sai do `?e=`/`?c=`, que só o JavaScript lê. O robô que monta a prévia no
 * WhatsApp não roda JavaScript — sem desvio ele lê as meta tags do layout raiz
 * e a mensagem sai anunciando a candidatura no lugar do encontro. Foi o defeito
 * que este arquivo prende.
 *
 * As três peças:
 *
 *   1. `url_confirmacao()`/`url_presenca()` (PHP) geram o link que circula;
 *   2. a RewriteRule do `publish.yml` reconhece ESSE link e desvia o robô;
 *   3. `api/presenca-previa.php` responde com o dia e o nome do encontro.
 *
 * Basta um dos três mudar de forma para a prévia voltar a ser genérica — e a
 * falha é invisível de dentro do site: só aparece quando alguém cola o link no
 * grupo. Por isso ela é conferida aqui, e não a olho.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");
const fluxo = readFileSync(path.join(RAIZ, ".github/workflows/publish.yml"), "utf8");

/** Os tokens da semente do sandbox — 16 caracteres, como os de verdade. */
const CHEGADA = "a".repeat(16);
const CONFIRMACAO = "b".repeat(16);

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
after(() => painel.fechar());

const meta = (html: string, chave: string): string => {
  const m = html.match(
    new RegExp(`<meta (?:property|name)="${chave}" content="([^"]*)"`),
  );
  return m ? m[1] : "";
};

describe("prévia do link: o desvio do robô no .htaccess", () => {
  /* A regra é lida do publish.yml e reexecutada aqui em JS. Não é o Apache,
     mas pega o que quebra de verdade: mudar o formato do link de um lado e
     esquecer o padrão do outro. */
  const regra = fluxo.match(
    /RewriteCond %\{QUERY_STRING\} (\S+)\n\s*RewriteCond %\{HTTP_USER_AGENT\} (\(\S+\)) \[NC\]\n\s*RewriteRule (\S+) (\S+) \[L,QSA\]/,
  );

  test("a regra continua no publish.yml", () => {
    assert.ok(regra, "não achei a RewriteRule da prévia — o robô voltou a ler o título da raiz");
  });

  test("ela desvia para o arquivo que existe", () => {
    assert.equal(regra![4], "/painel/api/presenca-previa.php");
    readFileSync(path.join(RAIZ, "public/painel/api/presenca-previa.php"), "utf8");
  });

  test("ela reconhece o link que o painel gera", () => {
    /* `url_presenca()` e `url_confirmacao()` montam `/presenca?e=` e
       `/presenca?c=`. O caminho e a querystring são conferidos separados
       porque o Apache também os testa separados. */
    const caminho = new RegExp(regra![3]);
    const query = new RegExp(regra![1]);
    for (const qs of [`e=${CHEGADA}`, `c=${CONFIRMACAO}`]) {
      assert.ok(caminho.test("presenca"), "a regra não pega /presenca");
      assert.ok(query.test(qs), `a regra não pega ?${qs}`);
    }
  });

  test("ela NÃO desvia o navegador de quem está na porta", () => {
    /* A pessoa recebe o arquivo estático, como sempre: a fila da entrada não
       pode passar a depender do PHP estar de pé. */
    const ua = new RegExp(regra![2], "i");
    const celular =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    assert.equal(ua.test(celular), false, "navegador de celular caindo no PHP");
    assert.ok(ua.test("WhatsApp/2.23.20.0 A"), "o robô do WhatsApp não é reconhecido");
    assert.ok(ua.test("facebookexternalhit/1.1"), "o robô do Facebook não é reconhecido");
    assert.ok(ua.test("TelegramBot (like TwitterBot)"), "o robô do Telegram não é reconhecido");
  });

  test("a querystring sem token não desvia nada", () => {
    const query = new RegExp(regra![1]);
    assert.equal(query.test("de=joao-silva"), false, "?de= caindo na prévia");
    assert.equal(query.test(""), false, "/presenca sem token caindo na prévia");
  });
});

describe("prévia do link: o que o robô lê", () => {
  test("o link do grupo anuncia o dia e o nome do encontro", () => {
    const { html, erros } = painel.abrir("api/presenca-previa", `c=${CONFIRMACAO}`);
    assert.equal(erros.trim(), "", erros);

    const titulo = meta(html, "og:title");
    assert.match(titulo, /^Confirme sua presença — dia \d\d\/\d\d \| Encontro de fumaça no Benfica$/, titulo);
    assert.equal(meta(html, "twitter:title"), titulo, "o cartão do X caiu no do layout raiz");
    assert.match(html, new RegExp(`<title>${titulo.replace(/[|]/g, "\\|")}</title>`));

    /* O que decide se a pessoa vai: quando e onde. */
    const desc = meta(html, "og:description");
    assert.match(desc, /às 19H/, desc);
    assert.match(desc, /Praça do Benfica/, desc);
  });

  test("o QR da entrada anuncia check-in, e não confirmação", () => {
    const { html, erros } = painel.abrir("api/presenca-previa", `e=${CHEGADA}`);
    assert.equal(erros.trim(), "", erros);
    assert.match(meta(html, "og:title"), /^Check-in do encontro — dia \d\d\/\d\d \| Encontro de fumaça no Benfica$/);
  });

  test("o nome do candidato não entra no título", () => {
    /* O defeito original, escrito como teste: o cartão herdava o og:title do
       layout raiz e a mensagem no grupo dizia "Candidato a Vice-Governador". */
    const { html } = painel.abrir("api/presenca-previa", `c=${CONFIRMACAO}`);
    assert.doesNotMatch(meta(html, "og:title"), /Vice-Governador/i);
  });

  test("token que não existe não inventa encontro", () => {
    const { html, erros } = painel.abrir("api/presenca-previa", "c=" + "f".repeat(16));
    assert.equal(erros.trim(), "", erros);
    assert.match(meta(html, "og:title"), /Confirme sua presença/);
    assert.match(meta(html, "og:description"), /não vale mais/);
  });

  test("encontro cancelado responde como inexistente", () => {
    const eventos = painel.ler("eventos");
    painel.gravar("eventos", eventos.map((e) => ({ ...e, status: "cancelado" })));
    try {
      const { html } = painel.abrir("api/presenca-previa", `c=${CONFIRMACAO}`);
      assert.match(meta(html, "og:description"), /não vale mais/);
      assert.doesNotMatch(meta(html, "og:title"), /Benfica/);
    } finally {
      painel.ressemear();
    }
  });

  test("o navegador que escapar para cá volta para a página, sem laço", () => {
    /* `/presenca?c=…` bateria na mesma RewriteRule e devolveria este arquivo de
       novo. O destino tem de ser o caminho com extensão, servido direto. */
    const { html } = painel.abrir("api/presenca-previa", `c=${CONFIRMACAO}`);
    assert.match(html, new RegExp(`location\\.replace\\("/presenca\\.html\\?c=${CONFIRMACAO}"\\)`));
  });
});
