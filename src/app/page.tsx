'use client';
import React from "react";
import Link from "next/link";
import { Icon, IconName } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { FaixaEleicao } from "@/components/FaixaEleicao";
import { SigaCandidatos } from "@/features/candidatos/SigaCandidatos";
import { GRUPO_GERAL } from "@/lib/contato";

const profile = {
  name: "Felipe Moreira",
  kicker: "Candidato a Vice-Governador do Ceará",
  bio: "De militante de internet no MBL Ceará a militante de rua. Larguei o conforto de só reclamar pela tela pra abraçar a Missão Ceará de devolver aos nossos jovens a liberdade que o crime organizado roubou.",
  /* 320 px cobre a tela 2x do círculo de 152. Ver originais/LEIA-ME.md. */
  photo: "/image/me-320.webp",
  photoReserva: "/image/me-320.jpg",
};

type LinkCard = {
  icon: IconName;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  internal?: boolean;
  accent?: boolean;
};

/**
 * O primeiro degrau da escada: entrar no grupo, sem formulário nenhum.
 *
 * Era "manda a palavra EQUIPE" para o WhatsApp da coordenação — o degrau
 * dependia de uma pessoa estar disponível pra responder, e quem chegava de
 * madrugada esperava até o dia seguinte. Agora é o link do grupo, que resolve
 * na hora.
 *
 * É o **geral**, e não o de trabalho: quem clica aqui ainda não decidiu nada, e
 * o grupo de trabalho é de quem já tem conta no painel. Ver `@/lib/contato`.
 */
const PRIMEIRO_DEGRAU = GRUPO_GERAL;

/**
 * Um cartão em destaque, não três.
 *
 * Antes, "Quero ajudar", "Programação" e "Heróis" eram todos `accent` e
 * disputavam o mesmo clique — o efeito de destacar tudo é não destacar nada.
 * Agora o ouro é só do degrau de entrada, e a ordem desce por compromisso:
 * entrar no grupo (10 segundos) → saber quem sou → ler o plano → assumir
 * função → o resto.
 */
const links: LinkCard[] = [
  {
    icon: "bolt",
    title: "Entrar pro grupo",
    subtitle: "O grupo de quem acompanha a Missão no Ceará",
    description:
      "O primeiro passo é entrar no grupo do WhatsApp. Sem formulário, sem cadastro, sem esperar ninguém responder",
    href: PRIMEIRO_DEGRAU,
    accent: true,
  },
  {
    icon: "star",
    title: "A Missão",
    subtitle: "Quem eu sou e por que me candidatei",
    description:
      "De militante de internet no MBL a candidato a Vice-Governador do Ceará: a trajetória e o motivo",
    href: "/amissao",
    internal: true,
  },
  {
    icon: "book",
    title: "Propostas",
    subtitle: "O plano de governo, com meta e prazo",
    description:
      "Retomar para Reconstruir: sete compromissos com meta, prazo, de onde vem o recurso e como você cobra",
    href: "/propostas",
    internal: true,
  },
  {
    icon: "users",
    title: "O que dá pra fazer",
    subtitle: "As 12 funções da militância",
    description:
      "O que cada função entrega e quanto tempo pede — de Olheiro a Recepção — antes de você decidir",
    href: "/funcoes",
    internal: true,
  },
  {
    icon: "flag",
    title: "Quero ajudar",
    subtitle: "Escolha sua função na militância",
    description:
      "Escolha como quer ajudar o movimento no Ceará — comunicação, eventos ou onde precisar — e a coordenação entra em contato",
    href: "/queroajudar",
    internal: true,
  },
  {
    icon: "calendar",
    title: "Programação da Semana",
    subtitle: "Onde e quando me assistir",
    description:
      "Agenda da semana: lives, conversas e conteúdos com dia, horário e plataforma",
    href: "/programacao",
    internal: true,
  },
  {
    icon: "mountain",
    title: "Heróis do Ceará",
    subtitle: "Cordel dos que fizeram nossa história",
    description:
      "Conheça os heróis históricos do Ceará, suas histórias, legados e impactos na formação cultural do estado",
    href: "/heroisdoceara",
    internal: true,
  },
];

const socialLinks: { platform: string; icon: IconName; url: string; handle: string }[] = [
  { platform: "Instagram", icon: "instagram", url: "https://instagram.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitter / X", icon: "x", url: "https://x.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "YouTube", icon: "youtube", url: "https://youtube.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "TikTok", icon: "tiktok", url: "https://tiktok.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitch", icon: "twitch", url: "https://twitch.tv/moreiramissao", handle: "moreiramissao" },
  { platform: "Kick", icon: "kick", url: "https://kick.com/moreiramissao", handle: "moreiramissao" },
  { platform: "Kwai", icon: "video", url: "https://www.kwai.com/@moreiramissao", handle: "@moreiramissao" },
];

const Home: React.FC = () => {
  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: C.night }}>
      {/* ===== Fundo animado: cena do cordel (montanhas e barcos fixos, chão parado) ===== */}
      <iframe
        src="/cordel-bg.html#bg"
        title="Cena animada de cordel — sertão do Ceará com montanhas, mar e vida da caatinga"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "0",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* véu escuro pra dar contraste ao conteúdo */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(12,12,14,.55) 0%, rgba(12,12,14,.18) 26%, rgba(12,12,14,.20) 62%, rgba(12,12,14,.62) 100%)",
        }}
      />

      {/* ===== Conteúdo (estilo link-in-bio, rolando por cima do fundo fixo) ===== */}
      <main
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 560,
          margin: "0 auto",
          padding: "56px 20px 40px",
          fontFamily: FONT_BITTER,
          color: C.cream,
        }}
      >
        {/* Cabeçalho / perfil */}
        <header style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 152,
              height: 152,
              margin: "0 auto 18px",
              borderRadius: "50%",
              overflow: "hidden",
              background: C.cream,
              boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px ${C.gold}, 0 0 0 12px ${C.ink}, 8px 8px 0 rgba(24,18,3,.35)`,
            }}
          >
            {/* No export estático o Next não redimensiona nem negocia formato
                (`images.unoptimized`), então o <picture> faz o trabalho que o
                next/image faria: WebP para quem aceita, JPEG para o resto.
                `fetchPriority` repõe o que o `priority` do next/image dava. */}
            <picture>
              <source srcSet={profile.photo} type="image/webp" />
              <img
                src={profile.photoReserva}
                alt={`${profile.name} — ativista político e porta-voz da missão do sertão do Ceará`}
                width={152}
                height={152}
                fetchPriority="high"
                decoding="async"
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </picture>
          </div>

          <p
            style={{
              display: "inline-block",
              fontFamily: FONT_ELITE,
              letterSpacing: 4,
              fontSize: 12,
              textTransform: "uppercase",
              color: C.ink,
              background: C.gold,
              padding: "4px 14px",
              boxShadow: "3px 3px 0 rgba(24,18,3,.35)",
              marginBottom: 14,
            }}
          >
            {profile.kicker}
          </p>

          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(30px, 8vw, 46px)",
              letterSpacing: 1,
              lineHeight: 1.05,
              textShadow: `2px 2px 0 ${C.ink}`,
              margin: "6px 0 12px",
            }}
          >
            {profile.name}
          </h1>

          <p
            style={{
              maxWidth: 420,
              margin: "0 auto",
              fontSize: 15.5,
              lineHeight: 1.5,
              color: C.cream,
              textShadow: "0 1px 6px rgba(0,0,0,.65)",
            }}
          >
            {profile.bio}
          </p>
        </header>

        {/* A data da eleição vem antes dos cartões: é a informação mais
            perecível da página e a única com prazo. */}
        <div style={{ marginBottom: 20 }}>
          <FaixaEleicao />
        </div>

        {/* Quem são os candidatos e em que número votar. Vem logo depois da
            faixa e antes dos cartões porque responde a mesma pergunta que ela —
            e some sozinho enquanto não houver ninguém publicado no painel. */}
        <div style={{ marginBottom: 20 }}>
          <SigaCandidatos />
        </div>

        {/* Cartões de links */}
        <nav
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
          aria-label="Navegação principal"
        >
          {links.map((l) => {
            const content = <CardBody link={l} />;
            const cardStyle: React.CSSProperties = {
              display: "block",
              textDecoration: "none",
              background: l.accent ? C.gold : C.paper,
              border: `3px solid ${C.ink}`,
              boxShadow: `5px 5px 0 rgba(24,18,3,.35)`,
              color: C.ink,
              transition: "transform .12s ease, box-shadow .12s ease",
            };
            return l.internal ? (
              /* `prefetch={false}`: por padrão o Next baixa o chunk e o payload
                 de todo <Link> visível. Com sete cartões isso são ~239 KB de
                 rotas que o visitante ainda não pediu — medido no 4G lento, mais
                 de um segundo, e dado do bolso de quem está no pré-pago.
                 Num link-in-bio a maioria abre uma página e sai; as rotas são
                 HTML estático e carregam rápido quando alguém realmente clica. */
              <Link
                key={l.title}
                href={l.href}
                prefetch={false}
                className="cordel-card"
                style={cardStyle}
                title={l.description}
              >
                {content}
              </Link>
            ) : (
              <a
                key={l.title}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cordel-card"
                style={cardStyle}
                title={l.description}
              >
                {content}
              </a>
            );
          })}
        </nav>

        {/* Minha história — conteúdo indexável e com substância */}
        <section
          aria-label="Minha história e a missão"
          style={{
            marginTop: 26,
            padding: "20px 22px",
            background: "rgba(20,17,12,.6)",
            border: `2px solid ${C.ink}`,
            borderRadius: 4,
            backdropFilter: "blur(2px)",
          }}
        >
          <h2
            style={{
              fontFamily: FONT_ALFA,
              fontSize: 20,
              letterSpacing: 0.5,
              color: C.gold,
              margin: "0 0 12px",
            }}
          >
            Minha história
          </h2>
          <div
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              color: C.cream,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ margin: 0 }}>
              Sou <strong>Felipe Moreira</strong>, candidato a{" "}
              <strong>Vice-Governador do Ceará</strong> pelo Partido Missão, na chapa do{" "}
              <strong>Delegado Huggo Leonardo</strong>. Durante muito tempo fui militante de
              internet pelo <strong>MBL Ceará</strong>, ajudando no que acreditava que podia
              ajudar.
            </p>
            <p style={{ margin: 0 }}>
              Foi servindo como <strong>líder de jovens na igreja</strong> que enxerguei de perto
              um problema que nenhum post resolve: jovens que não conseguem ir de um lugar a outro
              por medo do <strong>crime organizado</strong> e das disputas entre facções. O medo
              decidindo por onde eles podem ou não andar. Ali entendi que não bastava reclamar
              pela tela.
            </p>
            {/* O resto da história mora em /amissao, e só lá. Texto repetido em
                dois lugares é texto que diverge na terceira alteração. */}
            <Link
              href="/amissao"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                minHeight: 44,
                fontFamily: FONT_ELITE,
                fontSize: 12.5,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: C.gold,
                textDecoration: "none",
                alignSelf: "flex-start",
              }}
            >
              Ler a história inteira
              <Icon name="chevronRight" size={16} />
            </Link>
          </div>
        </section>

        {/* Rodapé */}
        <footer style={{ textAlign: "center", marginTop: 34 }}>
          <nav
            style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}
            aria-label="Redes sociais"
          >
            {socialLinks.map((s) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`${s.platform} — ${s.handle}`}
                title={`Siga Felipe Moreira no ${s.platform} (${s.handle})`}
                className="cordel-social"
                style={socialIcon}
              >
                <Icon name={s.icon} size={22} />
              </a>
            ))}
          </nav>
          <p
            style={{
              fontFamily: FONT_ELITE,
              fontSize: 12,
              letterSpacing: 2,
              color: C.cream,
              opacity: 0.85,
              textShadow: "0 1px 6px rgba(0,0,0,.7)",
              margin: 0,
            }}
          >
            @moreiramissao · © {new Date().getFullYear()} Felipe Moreira
          </p>
        </footer>
      </main>

      {/* hover/press dos cartões, foco de teclado, entrada suave + respeito a reduced-motion */}
      <style>{`
        .cordel-card:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 rgba(24,18,3,.4) !important; }
        .cordel-card:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 rgba(24,18,3,.35) !important; }
        .cordel-social { transition: transform .12s ease, box-shadow .12s ease; }
        .cordel-social:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 rgba(24,18,3,.4); }
        .cordel-social:active { transform: translate(1px,1px); box-shadow: 2px 2px 0 rgba(24,18,3,.35); }
        .cordel-card:focus-visible, .cordel-social:focus-visible { outline: 3px solid #FFCB05; outline-offset: 3px; }
        @keyframes cordelIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        main > * { animation: cordelIn .5s ease-out backwards; }
        main > *:nth-child(1) { animation-delay: .05s; }
        main > *:nth-child(2) { animation-delay: .18s; }
        main > *:nth-child(3) { animation-delay: .3s; }
        main > *:nth-child(4) { animation-delay: .42s; }
        @media (prefers-reduced-motion: reduce) {
          .cordel-card, .cordel-social { transition: none !important; }
          main > * { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

const socialIcon: React.CSSProperties = {
  width: 44,
  height: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  background: C.gold,
  border: `3px solid ${C.ink}`,
  color: C.ink,
  boxShadow: "3px 3px 0 rgba(24,18,3,.35)",
  textDecoration: "none",
};

const CardBody: React.FC<{ link: LinkCard }> = ({ link }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
    <span
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        flex: "0 0 auto",
        display: "grid",
        placeItems: "center",
        borderRadius: 8,
        background: link.accent ? C.ink : C.gold,
        color: link.accent ? C.gold : C.ink,
        border: `2px solid ${C.ink}`,
      }}
    >
      <Icon name={link.icon} size={24} />
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span
        style={{
          display: "block",
          fontFamily: FONT_ALFA,
          fontSize: 16,
          letterSpacing: 0.4,
          lineHeight: 1.15,
        }}
      >
        {link.title}
      </span>
      <span style={{ display: "block", fontSize: 13, opacity: 0.8, marginTop: 2 }}>
        {link.subtitle}
      </span>
    </span>
    <Icon name="chevronRight" size={20} style={{ opacity: 0.6, flex: "0 0 auto" }} />
  </div>
);

export default Home;
