import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, LARGURA, PONTOS, TITULO, borda } from "@/lib/theme";
import { DEGRAUS } from "@/features/organizacao/catalogo";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { Convite } from "@/components/site/Convite";
import { Escada } from "@/components/site/Escada";
import { Sertao } from "@/components/site/Sertao";
import { Sol } from "@/components/site/Sol";
import { NaVozDaLiga } from "./NaVozDaLiga";
import { ProximosEncontros } from "./ProximosEncontros";
import { marca, coordenacao, numeros, portas, mais, type Porta } from "./data";

/**
 * A HOME — a porta de entrada da militância.
 *
 * Uma página com seções, na ordem da escada do plano:
 *
 *   abertura   quem somos, e as duas ações (participar · ver a agenda)
 *   encontros  o que vem por aí, da agenda de verdade
 *   números    o diagnóstico de 2026 em três carimbos — o porquê
 *   portas     núcleo, grupo, Liga — onde eu entro
 *   escada     de Interessado a Multiplicador — como se sobe
 *   mais       o resto do site, em blocos menores
 *   coordena   quem mantém isto
 *
 * Barra do topo e rodapé (com as redes) são os globais de `PaginaDoSite`.
 *
 * A abertura é branca, com o sol das onças à direita e o sertão de dia no pé
 * (`Sertao`), no lugar da cena animada que ficava atrás do texto. Cada seção
 * tem a sua vez de fundo, e o ouro aparece no sol, nos números e no convite
 * final, e só neles.
 */
export default function Home() {
  return (
    <PaginaDoSite fundo="livre">
      <div id="abertura" className="h-abertura">
        <div className="s-largura h-abertura-miolo">
          <div className="h-abertura-texto">
            <h1 className="h-titulo">
              <span className="h-marca">{marca.nome}</span>
              {marca.chamada.replace(/\s+\S+$/, " ")}
              <mark>{marca.chamada.split(" ").pop()}</mark>
            </h1>
            <p className="h-bio">{marca.bio}</p>
            <div className="s-acoes">
              {/* `prefetch={false}`: rota estática carrega rápido no clique, e
                  baixar o chunk de toda rota visível custa dado de quem está
                  no pré-pago. */}
              <Link href="/queroajudar" prefetch={false} className="s-btn s-btn-ouro h-botao">
                Quero participar
                <Icon name="chevronRight" size={20} />
              </Link>
              <Link href="/programacao" prefetch={false} className="s-btn s-btn-linha h-botao">
                Ver a agenda
              </Link>
            </div>
            <p className="h-promessa">A coordenação conversa com você em até 3 dias.</p>
          </div>

          <div className="h-sol">
            <Sol tamanho="100%" miolo={0.62} gira>
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
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </picture>
            </Sol>
          </div>
        </div>
        <Sertao />
      </div>

      <ProximosEncontros />

      {/* ===================== NÚMEROS ===================== */}
      <section aria-labelledby="h-numeros" className="s-secao s-secao-suave">
        <div className="s-largura">
          <div className="s-cabeca">
            <p className="s-rotulo">Por que agora</p>
            <h2 id="h-numeros" className="s-titulo">O que 2026 ensinou</h2>
          </div>
          <div className="h-numeros">
            {numeros.map((n) => (
              <div key={n.valor} className="h-numero">
                <strong>{n.valor}</strong>
                <span>{n.rotulo}</span>
              </div>
            ))}
          </div>
          <p className="h-nota">
            O eleitor existe. Faltou gente organizada para levar esse voto até os nossos nomes. É isso
            que a gente constrói agora.
          </p>
        </div>
      </section>

      {/* ===================== PORTAS ===================== */}
      <section aria-labelledby="h-portas" className="s-secao">
        <div className="s-largura">
          <div className="s-cabeca">
            <p className="s-rotulo">Onde entrar</p>
            <h2 id="h-portas" className="s-titulo">Encontre o seu lugar</h2>
            <p className="s-sub">Três jeitos de entrar. Dá para estar em mais de um.</p>
          </div>
          <nav aria-label="Onde entrar" className="s-grade s-grade-3">
            {portas.map((p) => (
              <CartaoPorta key={p.href} p={p} />
            ))}
          </nav>
        </div>
      </section>

      <NaVozDaLiga />

      {/* ===================== ESCADA ===================== */}
      <section aria-labelledby="h-escada" className="s-secao s-secao-suave">
        <div className="s-largura">
          <div className="s-cabeca">
            <p className="s-rotulo">Como funciona</p>
            <h2 id="h-escada" className="s-titulo">Como se sobe</h2>
            <p className="s-sub">
              O que mede o trabalho não é quantos entram na lista. É quantos sobem um degrau por mês.
            </p>
          </div>
          <Escada passos={[...DEGRAUS]} />
        </div>
      </section>

      {/* ===================== MAIS ===================== */}
      <section aria-labelledby="h-mais" className="s-secao h-mais">
        <div className="s-largura">
          <div className="s-cabeca">
            <h2 id="h-mais" className="s-titulo">E também</h2>
          </div>
          <nav aria-label="Mais do site" className="s-grade s-grade-4">
            {mais.map((p) => (
              <Link key={p.href} href={p.href} prefetch={false} className="s-cartao h-tile" title={p.description}>
                <span className="s-selo" aria-hidden="true">
                  <Icon name={p.icon} size={22} />
                </span>
                <span className="h-tile-texto">
                  <strong>{p.title}</strong>
                  <span>{p.subtitle}</span>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* ===================== QUEM COORDENA + CONVITE ===================== */}
      <section aria-label="Quem coordena e como participar" className="h-fim">
        <div className="s-largura">
          <div className="h-coordena">
            <picture>
              <source srcSet={coordenacao.photo} type="image/webp" />
              <img
                src={coordenacao.photoReserva}
                alt={`${coordenacao.nome}, coordenador de militância da Missão Ceará`}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="h-retrato"
              />
            </picture>
            <div className="h-coordena-texto">
              <p className="h-coordena-nome">{coordenacao.nome}</p>
              <p className="h-coordena-papel">{coordenacao.papel}</p>
            </div>
            <Link href="/amissao" prefetch={false} className="s-link">
              A história
              <Icon name="chevronRight" size={18} />
            </Link>
          </div>
          <Convite titulo="Tem lugar para você" texto="Dá para ajudar com dez horas por semana ou com trinta minutos. Conte onde você está e o que te interessa: a coordenação encaixa." agenda={false} />
        </div>
      </section>

      <style>{`
        /* ---------- abertura ---------- */
        .h-abertura { overflow: hidden; background: ${C.paper}; }
        .h-abertura-miolo { position: relative; display: grid; gap: 24px; padding-top: clamp(24px, 6vw, 72px); align-items: center; }
        .h-abertura-texto { min-width: 0; }
        .h-titulo { margin: 0; font-family: ${FONT_ALFA}; font-weight: 400; font-size: ${TITULO.exibicao}; line-height: 1.04; color: ${C.ink}; text-wrap: balance; }
        .h-marca { display: block; margin-bottom: 12px; font-size: clamp(19px, 2.2vw, 24px); line-height: 1.2; color: ${C.goldDim}; }
        .h-titulo mark { background: linear-gradient(transparent 58%, ${C.gold} 58%, ${C.gold} 92%, transparent 92%); color: inherit; padding: 0 .06em; margin: 0 -.06em; }
        .h-bio { margin: 22px 0 28px; max-width: 34em; font-size: clamp(18px, 2vw, 20px); line-height: 1.55; color: ${C.suave}; text-wrap: pretty; }
        .h-botao { flex: 1 1 auto; min-height: 56px; padding: 14px 26px; font-size: 18px; }
        .h-promessa { margin: 14px 0 0; font-size: 15.5px; color: ${C.suave}; }
        /* No celular o sol vira um selo no canto: o título e o botão têm de caber na primeira tela. */
        .h-sol { position: absolute; top: 12px; right: 12px; width: 104px; }

        /* ---------- números ---------- */
        .h-numeros { display: grid; grid-template-columns: minmax(0, 1fr); }
        .h-numero { display: flex; flex-direction: column; gap: 4px; padding-block: 16px; border-top: ${borda()}; }
        .h-numero strong { font-family: ${FONT_ALFA}; font-weight: 400; font-size: clamp(38px, 5vw, 56px); line-height: 1.05; color: ${C.ink}; }
        .h-numero span { font-size: 17px; line-height: 1.45; color: ${C.suave}; max-width: 26ch; }
        .h-nota { margin: 24px 0 0; max-width: 40em; font-size: 20px; line-height: 1.5; font-weight: 600; color: ${C.ink}; text-wrap: pretty; }

        /* ---------- portas ---------- */
        .h-porta-titulo { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        /* No celular o selo vai ao lado do nome: são três portas, e as três têm de caber quase numa tela. */
        @media (max-width: ${PONTOS.tablet - 1}px) {
          .h-porta { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 8px 12px; align-items: center; padding: 18px; }
          .h-porta-desc, .h-porta-ir { grid-column: 1 / -1; }
        }
        .h-porta-sub { font-size: 15px; line-height: 1.3; font-weight: 700; color: ${C.goldDim}; }
        .h-porta-nome { font-family: ${FONT_ALFA}; font-size: ${TITULO.bloco}; line-height: 1.12; color: ${C.ink}; }
        .h-porta-desc { font-size: 17px; line-height: 1.55; color: ${C.suave}; }
        .h-porta-ir { margin-top: auto; padding-top: 4px; display: inline-flex; align-items: center; gap: 4px; font-size: 16.5px; font-weight: 700; }

        /* ---------- mais ---------- */
        .h-tile { gap: 14px; }
        /* No celular o bloco vira linha: ícone, texto, e quatro cabem numa tela. */
        @media (max-width: ${PONTOS.tablet - 1}px) { .h-tile { flex-direction: row; align-items: center; padding: 14px 16px; } }
        .h-tile-texto { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .h-tile-texto strong { font-size: 18px; line-height: 1.3; font-weight: 800; }
        .h-tile-texto span { font-size: 15.5px; line-height: 1.4; color: ${C.suave}; }

        /* ---------- fim ---------- */
        .h-fim { padding-bottom: clamp(48px, 7vw, 80px); }
        .h-coordena { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; margin-bottom: 32px; padding-block: 16px; border-block: ${borda()}; }
        .h-coordena-texto { flex: 1 1 200px; min-width: 0; }
        .h-retrato { display: block; width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
        .h-coordena-nome { margin: 0; font-size: 18px; line-height: 1.3; font-weight: 800; }
        .h-coordena-papel { margin: 2px 0 0; font-size: 15.5px; line-height: 1.4; color: ${C.suave}; }

        /* ---------- tablet ---------- */
        @media (min-width: ${PONTOS.tablet}px) {
          .h-numeros { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
          .h-sol { width: 168px; right: 20px; }
          .h-botao { flex: 0 0 auto; }
        }
        /* ---------- computador ---------- */
        @media (min-width: ${PONTOS.computador}px) {
          .h-abertura-miolo { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 40px; max-width: ${LARGURA.conteudo + 40}px; }
          .h-sol { position: static; width: 100%; max-width: 420px; justify-self: end; }
        }
      `}</style>
    </PaginaDoSite>
  );
}

function CartaoPorta({ p }: { p: Porta }) {
  return (
    <Link href={p.href} prefetch={false} className="s-cartao h-porta">
      <span className="s-selo" aria-hidden="true">
        <Icon name={p.icon} size={22} />
      </span>
      <span className="h-porta-titulo">
        <span className="h-porta-sub">{p.subtitle}</span>
        <span className="h-porta-nome">{p.title}</span>
      </span>
      <span className="h-porta-desc">{p.description}</span>
      <span className="h-porta-ir">
        Conhecer
        <Icon name="chevronRight" size={18} />
      </span>
    </Link>
  );
}
