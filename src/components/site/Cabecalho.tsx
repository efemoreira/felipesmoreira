"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, LARGURA, PONTOS, borda, bordaFina, sombra, sombraErguida, sombraAfundada } from "@/lib/theme";
import { MENU, PARTICIPAR, estaEm } from "./navegacao";

/**
 * A BARRA DO TOPO — a mesma em toda página pública.
 *
 * O padrão que todo mundo reconhece: a marca à esquerda (leva ao Início), o
 * menu no meio, a ação à direita. A ação é UMA, "Participar", em ouro, e não
 * some no celular: é o degrau de entrada, e ele precisa estar a um toque de
 * qualquer página que alguém abriu por um link do WhatsApp.
 *
 * No celular o menu vira um botão "Menu" que abre uma gaveta. A gaveta é um
 * `<details>`: abre sem JavaScript; o script só fecha ao navegar, no Esc e no
 * toque fora.
 *
 * `sobreCena`: na home a barra começa transparente sobre a animação do sertão
 * e ganha fundo de tinta quando a abertura (`#abertura`) sai da tela. Quem diz
 * isso é um IntersectionObserver, e não um evento de rolagem a cada pixel.
 */
export function Cabecalho({ sobreCena = false }: { sobreCena?: boolean }) {
  const pathname = usePathname() ?? "/";
  const [rolou, setRolou] = useState(!sobreCena);
  const gaveta = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!sobreCena) return;
    const alvo = document.getElementById("abertura");
    if (!alvo || typeof IntersectionObserver === "undefined") {
      setRolou(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setRolou(!e.isIntersecting), { rootMargin: "-72px 0px 0px 0px", threshold: 0.15 });
    io.observe(alvo);
    return () => io.disconnect();
  }, [sobreCena]);

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
    <header className={`cb ${rolou ? "cb-solida" : "cb-transparente"}`}>
      <a href="#conteudo" className="cb-pular">Pular para o conteúdo</a>
      <div className="cb-faixa">
        <Link href="/" prefetch={false} className="cb-marca" aria-label="Missão Ceará — Início">
          <picture>
            <img src="/image/icone-192.png" alt="" width={36} height={36} />
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
            <Link href={PARTICIPAR.href} prefetch={false} className="cb-participar">
              <Icon name="flag" size={17} />
              {PARTICIPAR.rotulo}
            </Link>
          )}
          <details ref={gaveta} className="cb-gaveta">
            <summary className="cb-menu" aria-label="Abrir o menu">
              <Icon name="menu" size={20} />
              <span>Menu</span>
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
              <Link href={PARTICIPAR.href} prefetch={false} className="cb-gaveta-participar">
                <Icon name="flag" size={18} />
                Quero participar
              </Link>
              <a href="/painel/" className="cb-gaveta-militante">
                <Icon name="users" size={16} />
                Área do militante
              </a>
            </nav>
          </details>
        </div>
      </div>

      <style>{`
        .cb { position: sticky; top: 0; z-index: 40; transition: background-color .2s ease, border-color .2s ease; }
        .cb-solida { background: ${C.night}; border-bottom: ${bordaFina(C.gold)}; }
        .cb-transparente { background: linear-gradient(180deg, rgba(12,12,14,.7), rgba(12,12,14,0)); border-bottom: ${bordaFina("transparent")}; }
        .cb-faixa { max-width: ${LARGURA.conteudo}px; margin: 0 auto; height: 64px; padding: 0 16px; display: flex; align-items: center; gap: 16px; }
        .cb-pular {
          position: absolute; left: 12px; top: -60px; z-index: 50; padding: 10px 14px;
          background: ${C.gold}; color: ${C.ink}; border: ${borda()}; font-family: ${FONT_ELITE}; font-size: 13px; text-decoration: none;
        }
        .cb-pular:focus { top: 10px; }
        .cb-marca { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; text-decoration: none; color: ${C.cream}; flex: 0 0 auto; }
        .cb-marca img { width: 36px; height: 36px; border-radius: 50%; box-shadow: 0 0 0 2px ${C.gold}; display: block; }
        .cb-marca span { font-family: ${FONT_ALFA}; font-size: 18px; letter-spacing: .4px; }
        .cb-nav { display: none; flex: 1; justify-content: center; gap: 4px; }
        .cb-item {
          display: inline-flex; align-items: center; min-height: 44px; padding: 0 12px; text-decoration: none;
          font-family: ${FONT_ELITE}; font-size: 13px; letter-spacing: 1.4px; text-transform: uppercase; color: ${C.cream};
          border-bottom: 3px solid transparent;
        }
        .cb-item:hover { color: ${C.gold}; }
        .cb-item[aria-current="page"] { color: ${C.gold}; border-bottom-color: ${C.gold}; }
        .cb-direita { margin-left: auto; display: flex; align-items: center; gap: 10px; }
        .cb-participar {
          display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 14px; text-decoration: none;
          font-family: ${FONT_ALFA}; font-size: 15px; color: ${C.ink}; background: ${C.gold};
          border: ${borda()}; box-shadow: ${sombra("rente", C.sombraNoite)}; transition: transform .12s ease, box-shadow .12s ease;
        }
        .cb-participar:hover { transform: translate(-1px,-1px); box-shadow: ${sombraErguida("rente", C.sombraNoite)}; }
        .cb-participar:active { transform: translate(1px,1px); box-shadow: ${sombraAfundada("rente", C.sombraNoite)}; }

        .cb-gaveta { position: relative; }
        .cb-menu {
          list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; min-width: 44px; padding: 0 10px;
          color: ${C.cream}; border: ${bordaFina(C.cream)}; font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;
        }
        .cb-menu::-webkit-details-marker { display: none; }
        .cb-gaveta[open] .cb-menu { background: ${C.gold}; color: ${C.ink}; border-color: ${C.gold}; }
        .cb-gaveta-corpo {
          position: fixed; left: 0; right: 0; top: 64px; bottom: 0; overflow-y: auto;
          display: flex; flex-direction: column; gap: 4px; padding: 18px 16px 32px;
          background: ${C.night}; border-top: ${bordaFina(C.gold)};
        }
        .cb-gaveta-item {
          display: flex; align-items: center; min-height: 52px; padding: 0 6px; text-decoration: none;
          font-family: ${FONT_ALFA}; font-size: 22px; color: ${C.cream}; border-bottom: 1px solid rgba(246,245,239,.12);
        }
        .cb-gaveta-item[aria-current="page"] { color: ${C.gold}; }
        .cb-gaveta-participar {
          margin-top: 18px; display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 54px; text-decoration: none;
          font-family: ${FONT_ALFA}; font-size: 18px; color: ${C.ink}; background: ${C.gold}; border: ${borda()}; box-shadow: ${sombra("cartao", C.sombraNoite)};
        }
        .cb-gaveta-militante {
          margin-top: 14px; align-self: center; display: inline-flex; align-items: center; gap: 6px; min-height: 44px;
          font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: ${C.gold2}; text-decoration: none;
        }
        .cb a:focus-visible, .cb summary:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 2px; }

        /* No celular o nome cede lugar para o Participar e o Menu caberem. */
        @media (max-width: 380px) { .cb-marca span { display: none; } }
        @media (min-width: ${PONTOS.computador}px) {
          .cb-nav { display: flex; }
          .cb-gaveta { display: none; }
          .cb-faixa { padding: 0 24px; }
        }
        @media (prefers-reduced-motion: reduce) { .cb, .cb-participar { transition: none; } }
        @media print { .cb { display: none !important; } }
      `}</style>
    </header>
  );
}
