'use client';
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, FONT_BITTER, borda, sombra, sombraErguida, sombraAfundada, bordaFina } from "@/lib/theme";
import { DEGRAUS } from "@/features/organizacao/catalogo";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { marca, coordenacao, numeros, portas, mais, type Porta } from "./data";

/**
 * A HOME — a porta de entrada da militância.
 *
 * Era um link-in-bio: uma coluna de 560 px com oito cartões iguais, o mesmo
 * peso para "quero participar" e para "Heróis do Ceará". Funcionava para quem
 * chegava de um perfil e clicava num link; não explicava nada para quem
 * chegava querendo entender onde entrar.
 *
 * Agora é uma página com seções, na ordem da escada do plano:
 *
 *   abertura   quem somos, e as duas ações (participar · ver a agenda)
 *   números    o diagnóstico de 2026 em três carimbos — o porquê
 *   portas     núcleo, grupo, Liga — onde eu entro
 *   escada     de Interessado a Multiplicador — como se sobe
 *   mais       o resto do site, em blocos menores
 *   coordena   quem mantém isto
 *
 * Barra do topo e rodapé (com as redes) são os globais de `PaginaDoSite`.
 *
 * O FUNDO CONTINUA SENDO O CORDEL ANIMADO (`/cordel-bg.html#bg`), fixo atrás
 * de tudo. A abertura fica sobre ele, transparente; da segunda seção em
 * diante o conteúdo vem em papel e tinta — cartões com a moldura grossa e a
 * sombra dura — para ser lido sem brigar com a cena.
 *
 * O layout responsivo mora no <style> do fim, porque estilo inline não tem
 * media query. Cores, borda e sombra saem do tema, como no resto do site.
 */
export default function Home() {
  return (
    <PaginaDoSite fundo="cena">
    <div style={{ position: "relative", minHeight: "100dvh", background: C.night, fontFamily: FONT_BITTER, color: C.cream }}>
      {/* ===== Fundo animado: cena do cordel (montanhas e barcos fixos, chão parado) ===== */}
      <iframe
        src="/cordel-bg.html#bg"
        title="Cena animada de cordel — sertão do Ceará com montanhas, mar e vida da caatinga"
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0, pointerEvents: "none", zIndex: 0 }}
      />
      {/* véu: leve em cima (a cena aparece), mais escuro embaixo (o texto lê) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(12,12,14,.62) 0%, rgba(12,12,14,.22) 34%, rgba(12,12,14,.35) 70%, rgba(12,12,14,.72) 100%)",
        }}
      />

      <div className="h-main">
        {/* ===================== ABERTURA ===================== */}
        <header id="abertura" className="h-abertura">
          <div className="h-abertura-texto">
            <p className="h-selo">{marca.kicker}</p>
            <h1 className="h-titulo">{marca.nome}</h1>
            <p className="h-chamada">{marca.chamada}</p>
            <p className="h-bio">{marca.bio}</p>
            <div className="h-acoes">
              {/* `prefetch={false}`: rota estática carrega rápido no clique, e
                  baixar o chunk de toda rota visível custa dado de quem está
                  no pré-pago. */}
              <Link href="/queroajudar" prefetch={false} className="h-botao h-botao-ouro">
                <Icon name="flag" size={20} />
                Quero participar
              </Link>
              <Link href="/programacao" prefetch={false} className="h-botao h-botao-papel">
                <Icon name="calendar" size={20} />
                Ver a agenda
              </Link>
            </div>
            <p className="h-promessa">A coordenação conversa com você em até 3 dias.</p>
          </div>

          <div className="h-emblema" aria-hidden="false">
            {/* <picture> pelo mesmo motivo do retrato: export estático, sem
                next/image — e é ele que diz ao lint que a escolha é nossa. */}
            <picture>
              <img
                src={marca.emblema}
                alt="Marca da Missão: duas onças, uma branca e uma dourada, frente a frente"
                width={512}
                height={512}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>
        </header>

        {/* ===================== NÚMEROS ===================== */}
        <section aria-labelledby="h-numeros" className="h-secao">
          <h2 id="h-numeros" className="h-secao-titulo">O que 2026 ensinou</h2>
          <div className="h-numeros">
            {numeros.map((n) => (
              <div key={n.valor} className="h-carimbo">
                <strong>{n.valor}</strong>
                <span>{n.rotulo}</span>
              </div>
            ))}
          </div>
          <p className="h-nota">
            O eleitor existe. Faltou gente organizada para levar esse voto até os nossos nomes — é isso
            que a gente constrói agora.
          </p>
        </section>

        {/* ===================== PORTAS ===================== */}
        <section aria-labelledby="h-portas" className="h-secao">
          <h2 id="h-portas" className="h-secao-titulo">Encontre o seu lugar</h2>
          <p className="h-secao-sub">Três jeitos de entrar. Dá para estar em mais de um.</p>
          <nav aria-label="Onde entrar" className="h-portas">
            {portas.map((p) => (
              <CartaoPorta key={p.href} p={p} />
            ))}
          </nav>
        </section>

        {/* ===================== ESCADA ===================== */}
        <section aria-labelledby="h-escada" className="h-secao">
          <h2 id="h-escada" className="h-secao-titulo">Como se sobe</h2>
          <p className="h-secao-sub">
            O que mede o trabalho não é quantos entram na lista. É quantos sobem um degrau por mês.
          </p>
          <ol className="h-escada">
            {DEGRAUS.map((d, i) => (
              <li key={d.nome} className="h-degrau" style={{ ["--i" as string]: i } as React.CSSProperties}>
                <span className="h-degrau-num" aria-hidden="true">{i + 1}</span>
                <strong>{d.nome}</strong>
                <span>{d.resumo}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ===================== MAIS ===================== */}
        <section aria-labelledby="h-mais" className="h-secao">
          <h2 id="h-mais" className="h-secao-titulo">E também</h2>
          <nav aria-label="Mais do site" className="h-mais">
            {mais.map((p) => (
              <Link key={p.href} href={p.href} prefetch={false} className="h-tile" title={p.description}>
                <span className="h-tile-icone" aria-hidden="true">
                  <Icon name={p.icon} size={20} />
                </span>
                <span className="h-tile-texto">
                  <strong>{p.title}</strong>
                  <span>{p.subtitle}</span>
                </span>
              </Link>
            ))}
          </nav>
        </section>

        {/* ===================== QUEM COORDENA ===================== */}
        <section aria-label="Quem coordena" className="h-secao">
          <div className="h-coordena">
            <picture>
              <source srcSet={coordenacao.photo} type="image/webp" />
              <img
                src={coordenacao.photoReserva}
                alt={`${coordenacao.nome}, coordenador de militância da Missão Ceará`}
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                className="h-retrato"
              />
            </picture>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="h-coordena-rotulo">Quem coordena</p>
              <p className="h-coordena-nome">{coordenacao.nome}</p>
              <p className="h-coordena-papel">{coordenacao.papel}</p>
            </div>
            <Link href="/amissao" prefetch={false} className="h-link-ouro">
              A história
              <Icon name="chevronRight" size={16} />
            </Link>
          </div>
        </section>

      </div>

      <style>{`
        .h-main { position: relative; z-index: 2; max-width: 1080px; margin: 0 auto; padding: 0 16px 48px; }

        /* ---------- abertura ---------- */
        .h-abertura {
          min-height: min(92dvh, 760px);
          display: grid; grid-template-columns: 1fr; align-items: center; gap: 28px;
          padding: 24px 0 40px; text-align: center;
        }
        .h-abertura-texto { display: flex; flex-direction: column; align-items: center; }
        .h-selo {
          display: inline-block; margin: 0 0 16px; padding: 5px 14px;
          font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 3.5px; text-transform: uppercase;
          color: ${C.ink}; background: ${C.gold}; box-shadow: ${sombra("rente")};
        }
        .h-titulo {
          font-family: ${FONT_ALFA}; font-size: clamp(44px, 11vw, 92px); line-height: .95; letter-spacing: 1px;
          margin: 0 0 10px; text-shadow: 3px 3px 0 ${C.ink}, 6px 6px 0 rgba(0,0,0,.35);
        }
        .h-chamada {
          font-family: ${FONT_ALFA}; font-size: clamp(19px, 4.6vw, 28px); line-height: 1.15;
          color: ${C.gold}; margin: 0 0 16px; text-shadow: 2px 2px 0 ${C.ink};
        }
        .h-bio {
          max-width: 540px; margin: 0 0 26px; padding: 14px 16px; font-size: 16.5px; line-height: 1.6;
          /* Uma fita de tinta por trás: a abertura fica sobre a cena animada, e
             montanha clara atrás de texto claro não se lê no celular. */
          background: rgba(20,17,12,.72); border-left: ${BORDA}px solid ${C.gold}; text-align: left;
        }
        .h-acoes { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }
        .h-botao {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          min-height: 54px; padding: 12px 22px; text-decoration: none;
          font-family: ${FONT_ALFA}; font-size: 18px; letter-spacing: .4px;
          border: ${borda()}; box-shadow: ${sombra("alto", C.sombraNoite)};
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .h-botao-ouro { background: ${C.gold}; color: ${C.ink}; }
        .h-botao-papel { background: ${C.cream}; color: ${C.ink}; }
        .h-botao:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("alto", C.sombraNoite)}; }
        .h-botao:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("alto", C.sombraNoite)}; }
        .h-promessa { margin: 14px 0 0; font-family: ${FONT_ELITE}; font-size: 12.5px; letter-spacing: 1.2px; opacity: .9; text-shadow: 0 1px 6px rgba(0,0,0,.8); }
        .h-emblema { justify-self: center; order: -1; }
        .h-emblema img {
          display: block; width: clamp(132px, 34vw, 340px); height: auto; aspect-ratio: 1; border-radius: 50%;
          background: ${C.night}; object-fit: cover;
          box-shadow: 0 0 0 5px ${C.ink}, 0 0 0 11px ${C.gold}, 0 0 0 16px ${C.ink}, ${sombra("alto", C.sombraNoite)};
        }

        /* ---------- seções sobre papel ---------- */
        .h-secao { margin: 0 0 22px; padding: 26px 18px; background: rgba(20,17,12,.82); border: ${bordaFina(C.ink)}; backdrop-filter: blur(3px); }
        .h-secao-titulo { font-family: ${FONT_ALFA}; font-size: clamp(24px, 5.5vw, 34px); line-height: 1.1; color: ${C.gold}; margin: 0 0 6px; }
        .h-secao-sub { margin: 0 0 20px; font-size: 15.5px; line-height: 1.55; opacity: .9; }
        .h-nota { margin: 16px 0 0; font-size: 15.5px; line-height: 1.55; opacity: .92; max-width: 62ch; }

        .h-numeros { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 16px; }
        .h-carimbo {
          display: flex; flex-direction: column; gap: 6px; padding: 18px 18px 16px;
          background: ${C.paper}; color: ${C.ink}; border: ${borda()}; box-shadow: ${sombra("cartao", C.sombraNoite)};
        }
        .h-carimbo strong { font-family: ${FONT_ALFA}; font-size: clamp(32px, 7vw, 44px); line-height: 1; color: ${C.ink}; text-shadow: 3px 3px 0 ${C.gold}; }
        .h-carimbo span { font-size: 15px; line-height: 1.45; }

        .h-portas { display: grid; grid-template-columns: 1fr; gap: 18px; }
        .h-porta {
          display: flex; flex-direction: column; text-decoration: none; color: ${C.ink};
          background: ${C.cream}; border: ${borda()}; box-shadow: ${sombra("alto", C.sombraNoite)};
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .h-porta:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("alto", C.sombraNoite)}; }
        .h-porta:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("alto", C.sombraNoite)}; }
        .h-porta-topo { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: ${C.gold}; border-bottom: ${borda()}; }
        .h-porta-icone { width: 44px; height: 44px; display: grid; place-items: center; background: ${C.ink}; color: ${C.gold}; flex: 0 0 auto; }
        .h-porta-topo strong { font-family: ${FONT_ALFA}; font-size: 21px; line-height: 1.1; }
        .h-porta-corpo { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .h-porta-sub { font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.8px; text-transform: uppercase; opacity: .75; }
        .h-porta-desc { font-size: 15.5px; line-height: 1.55; }
        .h-porta-ir { margin-top: auto; padding-top: 6px; display: inline-flex; align-items: center; gap: 6px; font-family: ${FONT_ALFA}; font-size: 15px; }

        .h-escada { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 10px; counter-reset: none; }
        .h-degrau {
          position: relative; display: grid; grid-template-columns: 44px 1fr; column-gap: 12px; row-gap: 2px; align-items: start;
          padding: 12px 14px; background: ${C.cream}; color: ${C.ink}; border: ${bordaFina(C.ink)};
          margin-left: calc(var(--i) * 10px);
        }
        .h-degrau-num {
          grid-row: span 2; width: 44px; height: 44px; display: grid; place-items: center;
          font-family: ${FONT_ALFA}; font-size: 22px; background: ${C.gold}; border: ${borda()};
        }
        .h-degrau strong { font-family: ${FONT_ALFA}; font-size: 17px; line-height: 1.2; }
        .h-degrau span:last-child { font-size: 14.5px; line-height: 1.45; }

        .h-mais { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .h-tile {
          display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 12px 14px; text-decoration: none;
          background: ${C.paper}; color: ${C.ink}; border: ${borda()}; box-shadow: ${sombra("rente", C.sombraNoite)};
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .h-tile:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("rente", C.sombraNoite)}; }
        .h-tile-icone { width: 40px; height: 40px; display: grid; place-items: center; background: ${C.gold}; border: ${bordaFina(C.ink)}; flex: 0 0 auto; }
        .h-tile-texto { display: flex; flex-direction: column; min-width: 0; }
        .h-tile-texto strong { font-family: ${FONT_ALFA}; font-size: 16px; line-height: 1.2; }
        .h-tile-texto span { font-size: 13.5px; opacity: .8; }

        .h-coordena { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .h-retrato { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 3px ${C.gold}; display: block; }
        .h-coordena-rotulo { margin: 0; font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 2.4px; text-transform: uppercase; color: ${C.gold}; }
        .h-coordena-nome { margin: 2px 0 0; font-family: ${FONT_ALFA}; font-size: 19px; }
        .h-coordena-papel { margin: 2px 0 0; font-size: 14px; opacity: .85; }
        .h-link-ouro {
          display: inline-flex; align-items: center; gap: 7px; min-height: 44px;
          font-family: ${FONT_ELITE}; font-size: 12.5px; letter-spacing: 1.4px; text-transform: uppercase;
          color: ${C.gold}; text-decoration: none;
        }

        .h-botao:focus-visible, .h-porta:focus-visible, .h-tile:focus-visible, .h-link-ouro:focus-visible {
          outline: ${BORDA}px solid ${C.gold}; outline-offset: 3px;
        }

        /* ---------- tablet ---------- */
        @media (min-width: 640px) {
          .h-numeros { grid-template-columns: repeat(3, 1fr); }
          .h-mais { grid-template-columns: repeat(2, 1fr); }
          .h-secao { padding: 30px 26px; }
        }
        /* ---------- computador ---------- */
        @media (min-width: 900px) {
          .h-main { padding: 0 24px 64px; }
          .h-abertura { grid-template-columns: 1.25fr 1fr; text-align: left; gap: 48px; padding: 64px 0 56px; }
          .h-abertura-texto { align-items: flex-start; }
          .h-acoes { justify-content: flex-start; }
          .h-emblema { order: 0; }
          .h-portas { grid-template-columns: repeat(3, 1fr); }
          .h-mais { grid-template-columns: repeat(4, 1fr); }
          /* A escada vira escada: cinco degraus lado a lado, cada um mais alto. */
          .h-escada { grid-template-columns: repeat(5, 1fr); align-items: end; gap: 12px; }
          .h-degrau {
            margin-left: 0; grid-template-columns: 1fr; row-gap: 8px;
            min-height: calc(150px + var(--i) * 34px); align-content: start;
          }
          .h-degrau-num { grid-row: auto; }
          .h-secao { padding: 34px 32px; }
        }

        /* ---------- entrada suave, e respeito a quem pediu menos movimento ---------- */
        @keyframes hEntra { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .h-abertura-texto > *, .h-emblema { animation: hEntra .55s ease-out backwards; }
        .h-abertura-texto > *:nth-child(2) { animation-delay: .06s; }
        .h-abertura-texto > *:nth-child(3) { animation-delay: .12s; }
        .h-abertura-texto > *:nth-child(4) { animation-delay: .18s; }
        .h-abertura-texto > *:nth-child(5) { animation-delay: .24s; }
        @media (prefers-reduced-motion: reduce) {
          .h-abertura-texto > *, .h-emblema { animation: none; }
          .h-botao, .h-porta, .h-tile { transition: none; }
        }
      `}</style>
    </div>
    </PaginaDoSite>
  );
}

function CartaoPorta({ p }: { p: Porta }) {
  return (
    <Link href={p.href} prefetch={false} className="h-porta">
      <span className="h-porta-topo">
        <span className="h-porta-icone" aria-hidden="true">
          <Icon name={p.icon} size={22} />
        </span>
        <strong>{p.title}</strong>
      </span>
      <span className="h-porta-corpo">
        <span className="h-porta-sub">{p.subtitle}</span>
        <span className="h-porta-desc">{p.description}</span>
        <span className="h-porta-ir">
          Conhecer
          <Icon name="chevronRight" size={16} />
        </span>
      </span>
    </Link>
  );
}
