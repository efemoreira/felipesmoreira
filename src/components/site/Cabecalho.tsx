"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { C, FOCO, FONT_ALFA, LARGURA, PONTOS, RAIO, borda, sombra } from "@/lib/theme";
import { MENU, PARTICIPAR, estaEm } from "./navegacao";

/**
 * A BARRA DO TOPO — a mesma em toda página pública.
 *
 * O padrão que todo mundo reconhece: a marca à esquerda (leva ao Início), o
 * menu no meio, a ação à direita. A ação é UMA, "Participar", em ouro, e não
 * some no celular: é o degrau de entrada, e ele precisa estar a um toque de
 * qualquer página que alguém abriu por um link do WhatsApp.
 *
 * No celular o menu vira um botão que abre uma gaveta. A gaveta é um
 * `<details>`: abre sem JavaScript; o script só fecha ao navegar, no Esc e no
 * toque fora.
 */
export function Cabecalho() {
  const pathname = usePathname() ?? "/";
  const gaveta = useRef<HTMLDetailsElement>(null);

  /* Navegou (o Next troca a página sem recarregar): a gaveta fecha. */
  useEffect(() => {
    gaveta.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const fechar = (e: KeyboardEvent | MouseEvent) => {
      const g = gaveta.current;
      if (!g?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !g.contains(e.target as Node)) g.removeAttribute("open");
    };
    document.addEventListener("keydown", fechar);
    document.addEventListener("click", fechar);
    return () => {
      document.removeEventListener("keydown", fechar);
      document.removeEventListener("click", fechar);
    };
  }, []);

  const naParticipar = estaEm(pathname, PARTICIPAR.href);

  return (
    <header className="cb">
      <a href="#conteudo" className="cb-pular">Pular para o conteúdo</a>
      <div className="cb-faixa">
        <Link href="/" prefetch={false} className="cb-marca" aria-label="Missão Ceará — Início">
          <picture>
            <img src="/image/icone-192.png" alt="" width={38} height={38} />
          </picture>
          <span>Missão Ceará</span>
        </Link>

        <nav aria-label="Principal" className="cb-nav">
          {MENU.map((i) => (
            <Link key={i.href} href={i.href} prefetch={false} className="cb-item" aria-current={estaEm(pathname, i.href) ? "page" : undefined}>
              {i.rotulo}
            </Link>
          ))}
        </nav>

        <div className="cb-direita">
          {!naParticipar && (
            <Link href={PARTICIPAR.href} prefetch={false} className="s-btn s-btn-ouro s-btn-peq">
              {PARTICIPAR.rotulo}
            </Link>
          )}
          <details ref={gaveta} className="cb-gaveta">
            <summary className="cb-menu" aria-label="Abrir o menu">
              <Icon name="menu" size={22} />
            </summary>
            <nav aria-label="Menu" className="cb-gaveta-corpo">
              <Link href="/" prefetch={false} className="cb-gaveta-item" aria-current={pathname === "/" ? "page" : undefined}>
                Início
              </Link>
              {MENU.map((i) => (
                <Link key={i.href} href={i.href} prefetch={false} className="cb-gaveta-item" aria-current={estaEm(pathname, i.href) ? "page" : undefined}>
                  {i.rotulo}
                </Link>
              ))}
              <Link href="/funcoes" prefetch={false} className="cb-gaveta-item">O que dá pra fazer</Link>
              <Link href={PARTICIPAR.href} prefetch={false} className="s-btn s-btn-ouro s-btn-bloco cb-gaveta-participar">
                Quero participar
              </Link>
              <a href="/painel/" className="cb-gaveta-militante">
                <Icon name="users" size={18} />
                Área do militante
              </a>
            </nav>
          </details>
        </div>
      </div>

      <style>{`
        /* Fundo chapado, e nada de backdrop-filter: ele vira o contêiner dos filhos
           fixed, e a gaveta do celular ficaria presa na altura da barra. */
        .cb { position: sticky; top: 0; z-index: 40; background: ${C.paper}; border-bottom: ${borda()}; }
        .cb-faixa { max-width: ${LARGURA.conteudo + 40}px; margin: 0 auto; height: 68px; padding: 0 20px; display: flex; align-items: center; gap: 16px; }
        .cb-pular {
          position: absolute; left: 12px; top: -60px; z-index: 50; padding: 10px 14px; border-radius: ${RAIO.p}px;
          background: ${C.gold}; color: ${C.ink}; font-size: 15px; font-weight: 700; text-decoration: none;
        }
        .cb-pular:focus { top: 12px; }
        .cb-marca { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; text-decoration: none; color: ${C.ink}; flex: 0 0 auto; }
        .cb-marca img { width: 38px; height: 38px; border-radius: 50%; display: block; }
        .cb-marca span { font-family: ${FONT_ALFA}; font-size: 19px; line-height: 1; }
        .cb-nav { display: none; flex: 1; justify-content: center; gap: 2px; }
        .cb-item {
          position: relative; display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px; border-radius: ${RAIO.p}px;
          color: ${C.suave}; font-size: 16px; font-weight: 600; text-decoration: none; transition: color .15s ease, background-color .15s ease;
        }
        .cb-item:hover { color: ${C.ink}; background: ${C.fundo}; }
        .cb-item[aria-current="page"] { color: ${C.ink}; font-weight: 700; }
        .cb-item[aria-current="page"]::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 4px; height: 3px; border-radius: 2px; background: ${C.gold}; }
        .cb-direita { margin-left: auto; display: flex; align-items: center; gap: 8px; }

        .cb-gaveta { position: relative; }
        .cb-menu {
          list-style: none; cursor: pointer; display: grid; place-items: center; width: 44px; height: 44px;
          color: ${C.ink}; border: ${borda()}; border-radius: ${RAIO.p + 2}px;
        }
        .cb-menu::-webkit-details-marker { display: none; }
        .cb-gaveta[open] .cb-menu { background: ${C.fundo}; border-color: ${C.linhaForte}; }
        .cb-gaveta-corpo {
          position: fixed; left: 0; right: 0; top: 69px; bottom: 0; overflow-y: auto;
          display: flex; flex-direction: column; padding: 8px 20px 32px;
          background: ${C.paper}; box-shadow: ${sombra("alto")};
        }
        .cb-gaveta-item {
          display: flex; align-items: center; min-height: 56px; text-decoration: none;
          color: ${C.ink}; font-size: 20px; font-weight: 600; border-bottom: ${borda()};
        }
        .cb-gaveta-item[aria-current="page"] { font-weight: 800; box-shadow: inset 4px 0 0 ${C.gold}; padding-left: 14px; }
        .cb-gaveta-participar { margin-top: 20px; }
        .cb-gaveta-militante {
          margin-top: 8px; align-self: center; display: inline-flex; align-items: center; gap: 8px; min-height: 48px;
          color: ${C.suave}; font-size: 16px; font-weight: 600; text-decoration: none;
        }
        .cb a:focus-visible, .cb summary:focus-visible { outline: ${FOCO}; outline-offset: 2px; }

        /* No celular o nome cede lugar para o Participar e o Menu caberem. */
        @media (max-width: 380px) { .cb-marca span { display: none; } }
        @media (min-width: ${PONTOS.computador}px) {
          .cb-nav { display: flex; }
          .cb-gaveta { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .cb-item { transition: none; } }
        @media print { .cb { display: none !important; } }
      `}</style>
    </header>
  );
}
