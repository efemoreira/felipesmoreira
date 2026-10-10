import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MENU, PARTICIPAR, RODAPE } from "@/components/site/navegacao";

/**
 * A NAVEGAÇÃO DO SITE — barra do topo, abertura e rodapé comuns.
 *
 * Antes cada página pública tinha só um "Voltar"; quem chegava por um link do
 * WhatsApp numa página interna não tinha como ir ao resto do site. Agora toda
 * página pública se embrulha em `PaginaDoSite`. Este teste prende três coisas:
 * que todo item do menu e do rodapé leva a uma página que existe; que toda
 * página pública da lista usa a moldura; e que as que ficam fora de propósito
 * (dados, porta, ferramentas internas) continuam fora.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (rel: string) => readFileSync(path.join(RAIZ, rel), "utf8");

/** A rota existe como página do Next ou como HTML em public/? */
function existe(href: string): boolean {
  const rota = href.replace(/^\//, "").replace(/[?#].*$/, "");
  if (rota === "") return true;
  return existsSync(path.join(RAIZ, "src/app", rota, "page.tsx")) || existsSync(path.join(RAIZ, "public", `${rota}.html`));
}

/** Os arquivos de feature que a rota importa — e, por eles, o que importam do lado. */
function arquivosDaRota(rota: string): string[] {
  const page = ler(path.join("src/app", rota, "page.tsx"));
  const arquivos = [...page.matchAll(/from "@\/features\/([^"]+)"/g)].map((m) => `src/features/${m[1]}.tsx`).filter((f) => existsSync(path.join(RAIZ, f)));
  /* As três da organização usam a `Moldura`, que é quem usa a moldura do site. */
  const vizinhos = arquivos.flatMap((f) =>
    [...ler(f).matchAll(/from "\.\/([A-Za-z]+)"/g)].map((m) => path.join(path.dirname(f), `${m[1]}.tsx`)).filter((v) => existsSync(path.join(RAIZ, v))),
  );
  return [...arquivos, ...vizinhos];
}

const usaMoldura = (rota: string) => arquivosDaRota(rota).some((f) => ler(f).includes("<PaginaDoSite"));

const PUBLICAS = ["", "nucleos", "temas", "portavozes", "programacao", "funcoes", "propostas", "amissao", "heroisdoceara", "queroajudar", "candidatos", "privacy", "terms"];
const FORA = ["resultados", "presenca", "municao", "aulas", "convite"];

describe("navegação: todo destino existe", () => {
  for (const item of [...MENU, PARTICIPAR, ...RODAPE.flatMap((c) => c.itens)]) {
    test(`${item.rotulo} → ${item.href}`, () => {
      assert.ok(existe(item.href), `${item.href} está no menu ou no rodapé e não existe — link quebrado em todas as páginas`);
    });
  }

  test("o menu do topo é curto", () => {
    /* Menu de dez itens no topo é rodapé no lugar errado. */
    assert.ok(MENU.length <= 6, `o menu tem ${MENU.length} itens`);
  });
});

describe("navegação: as páginas públicas usam a moldura, e só elas", () => {
  test("a raiz usa a moldura", () => {
    assert.match(ler("src/features/home/Home.tsx"), /<PaginaDoSite fundo="cena"/);
  });

  for (const rota of PUBLICAS.filter((r) => r !== "")) {
    test(`/${rota} tem barra do topo e rodapé`, () => {
      assert.ok(usaMoldura(rota), `/${rota} não usa PaginaDoSite — quem chega ali não acha o resto do site`);
    });
  }

  for (const rota of FORA) {
    test(`/${rota} fica fora, de propósito`, () => {
      assert.ok(!usaMoldura(rota), `/${rota} passou a usar PaginaDoSite — ela tem moldura própria por um motivo (ver PaginaDoSite.tsx)`);
    });
  }

  test("nenhuma página pública voltou a desenhar o próprio 'Voltar'", () => {
    const comVoltar = PUBLICAS.filter((r) => r !== "").filter((r) => arquivosDaRota(r).some((f) => /arrowLeft[^]*?Voltar/.test(ler(f)) && /href="\/"/.test(ler(f))));
    assert.deepEqual(comVoltar, [], "a trilha da abertura e a marca na barra já levam ao Início");
  });
});
