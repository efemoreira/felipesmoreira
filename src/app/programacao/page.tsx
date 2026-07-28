/* eslint-disable @next/next/no-img-element */
import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon, IconName } from "../icons";
import CompartilharClient from "./CompartilharClient";
import { C, temaDe, sigla, type Agenda, type ItemAgenda } from "./tipos";
import data from "@/data/programacao.json";

const FONT_ALFA = "var(--font-alfa), serif";
const FONT_ELITE = "var(--font-elite), monospace";
const FONT_BITTER = "var(--font-bitter), serif";

/* Conteúdo da página vem do JSON — ver src/data/programacao.json */
const agenda = data as Agenda;

/* Ícones aceitos no JSON — evita quebrar a página com um nome inválido */
const ICONES_VALIDOS: IconName[] = [
  "youtube",
  "instagram",
  "twitch",
  "kick",
  "tiktok",
  "x",
  "video",
  "whatsapp",
  "play",
  "broadcast",
  "star",
];

const iconeSeguro = (nome: string | undefined, padrao: IconName): IconName =>
  nome && (ICONES_VALIDOS as string[]).includes(nome) ? (nome as IconName) : padrao;

export const metadata: Metadata = {
  title: "Programação da Semana",
  description:
    "Agenda da semana da Missão Ceará: lives, conversas e conteúdo de Felipe Moreira, com dia, horário e onde assistir.",
  alternates: { canonical: "https://felipesmoreira.com/programacao" },
  openGraph: {
    title: "Programação da Semana — Missão Ceará",
    description:
      "Todas as lives e conteúdos da semana de Felipe Moreira: dia, horário e plataforma.",
  },
};

export default function ProgramacaoPage() {
  const itens = agenda.programacao ?? [];

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: C.night }}>
      {/* ===== Fundo animado: cena do cordel ===== */}
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
          border: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(12,12,14,.72) 0%, rgba(12,12,14,.5) 40%, rgba(12,12,14,.78) 100%)",
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 880,
          margin: "0 auto",
          padding: "28px 18px 56px",
          fontFamily: FONT_BITTER,
          color: C.cream,
        }}
      >
        {/* ===== Topo: voltar + onde assistir ===== */}
        <div className="ag-topo">
          <Link href="/" className="ag-voltar">
            <Icon name="arrowLeft" size={16} />
            <span>Voltar</span>
          </Link>

          {agenda.disponivelEm && agenda.disponivelEm.length > 0 && (
            <div className="ag-canais">
              <span className="ag-canais-label">Disponível em</span>
              <nav aria-label="Onde assistir" className="ag-canais-lista">
                {agenda.disponivelEm.map((c) => (
                  <a
                    key={c.nome}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Assistir no ${c.nome}`}
                    title={`Assistir no ${c.nome}`}
                    className="ag-canal"
                  >
                    <Icon name={iconeSeguro(c.icone, "play")} size={16} />
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* ===== Cabeçalho ===== */}
        <header className="ag-header">
          <h1 className="ag-titulo">
            <span className="ag-titulo-ouro">{primeiraPalavra(agenda.titulo)}</span>
            {restoDoTitulo(agenda.titulo) && (
              <span className="ag-titulo-claro"> {restoDoTitulo(agenda.titulo)}</span>
            )}
          </h1>

          {agenda.periodo && (
            <p className="ag-periodo">
              <Icon name="calendar" size={14} />
              <span>{agenda.periodo}</span>
            </p>
          )}

          {agenda.chamada && <p className="ag-chamada">{agenda.chamada}</p>}

          {/* Gera o PNG da agenda no próprio navegador */}
          <div className="ag-compartilhar">
            <CompartilharClient agenda={agenda} />
          </div>
        </header>

        {/* ===== Lista da programação ===== */}
        {itens.length === 0 ? (
          <p className="ag-vazio">
            A agenda desta semana ainda está sendo fechada. Volte já já.
          </p>
        ) : (
          <ol className="ag-lista">
            {itens.map((item, i) => (
              <li key={item.id ?? i} className="ag-item" style={{ "--i": i } as React.CSSProperties}>
                <Cartao item={item} />
              </li>
            ))}
          </ol>
        )}

        <footer className="ag-rodape">
          <p>
            Horários de Brasília · sujeito a mudança de última hora — confirme nos
            perfis <strong>@moreiramissao</strong>.
          </p>
        </footer>
      </main>

      <style>{css}</style>
    </div>
  );
}

/* ===== Cartão de um dia da programação ===== */
const Cartao: React.FC<{ item: ItemAgenda }> = ({ item }) => {
  const tema = temaDe(item.cor);
  const etiqueta = item.etiqueta ?? (item.aoVivo ? "Ao vivo" : null);

  const vars = {
    "--bg": tema.bg,
    "--fg": tema.fg,
    "--sub": tema.sub,
    "--badge": tema.badge,
    "--badge-fg": tema.badgeFg,
  } as React.CSSProperties;

  const classe = `ag-cartao${tema.claro ? " ag-cartao-claro" : ""}`;

  const conteudo = (
    <>
      {/* Miniatura */}
      <div className="ag-thumb">
        {item.imagem ? (
          <img src={item.imagem} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="ag-thumb-fallback" aria-hidden="true">
            <span>{sigla(item.dia)}</span>
          </div>
        )}
        {etiqueta && (
          <span className="ag-etiqueta">
            {item.aoVivo && <span className="ag-ponto" aria-hidden="true" />}
            {etiqueta}
          </span>
        )}
      </div>

      {/* Título + subtítulo */}
      <div className="ag-texto">
        <h2 className="ag-item-titulo">{item.titulo}</h2>
        {item.subtitulo && <p className="ag-item-sub">{item.subtitulo}</p>}
      </div>

      {/* Data / dia da semana */}
      <div className="ag-meta">
        <span className="ag-meta-data">
          {item.data}
          {item.hora && <span className="ag-meta-sep"> · </span>}
          {item.hora}
        </span>
        <span className="ag-meta-dia">{item.dia}</span>
      </div>

      {/* Selo da plataforma */}
      <span className="ag-selo" aria-hidden="true">
        <Icon name={iconeSeguro(item.plataforma, "play")} size={20} />
      </span>
    </>
  );

  const rotulo = `${item.dia}, ${item.data}${item.hora ? ` às ${item.hora}` : ""} — ${item.titulo}`;

  if (!item.link) {
    return (
      <article className={classe} style={vars} aria-label={rotulo}>
        {conteudo}
      </article>
    );
  }

  return item.interno ? (
    <Link href={item.link} className={`${classe} ag-clicavel`} style={vars} title={rotulo}>
      {conteudo}
    </Link>
  ) : (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${classe} ag-clicavel`}
      style={vars}
      title={rotulo}
    >
      {conteudo}
    </a>
  );
};

/* ===== utilidades de texto ===== */
const primeiraPalavra = (t: string) => t.split(" ")[0] ?? t;
const restoDoTitulo = (t: string) => t.split(" ").slice(1).join(" ");

/* ===== estilos ===== */
const css = `
  .ag-topo {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 26px;
  }
  .ag-voltar {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold}; text-decoration: none;
    padding: 6px 13px; border: 2px solid ${C.ink};
    box-shadow: 3px 3px 0 rgba(24,18,3,.45);
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .ag-voltar:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 rgba(24,18,3,.5); }
  .ag-voltar:active { transform: translate(1px,1px); box-shadow: 2px 2px 0 rgba(24,18,3,.4); }

  .ag-canais { display: flex; align-items: center; gap: 10px; }
  .ag-canais-label {
    font-family: ${FONT_ELITE}; font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
    color: ${C.cream}; opacity: .8; text-shadow: 0 1px 6px rgba(0,0,0,.7);
  }
  .ag-canais-lista { display: flex; gap: 7px; }
  .ag-canal {
    width: 30px; height: 30px; display: grid; place-items: center;
    color: ${C.gold}; background: rgba(24,18,3,.85);
    border: 2px solid ${C.gold}; border-radius: 50%; text-decoration: none;
    transition: transform .12s ease, background .12s ease, color .12s ease;
  }
  .ag-canal:hover { background: ${C.gold}; color: ${C.ink}; transform: translateY(-2px); }

  .ag-header { text-align: center; margin-bottom: 30px; }
  .ag-titulo {
    font-family: ${FONT_ALFA};
    font-size: clamp(26px, 6.4vw, 44px);
    line-height: 1.06;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin: 0 0 12px;
    text-shadow: 3px 3px 0 ${C.ink}, 0 2px 18px rgba(0,0,0,.6);
  }
  .ag-titulo-ouro { color: ${C.gold}; }
  .ag-titulo-claro { color: ${C.cream}; }

  .ag-periodo {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2.5px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold};
    padding: 4px 13px; margin: 0 0 12px;
    box-shadow: 3px 3px 0 rgba(24,18,3,.45);
  }
  .ag-chamada {
    max-width: 520px; margin: 0 auto;
    font-size: 15px; line-height: 1.5; color: ${C.cream};
    text-shadow: 0 1px 6px rgba(0,0,0,.7);
  }

  .ag-compartilhar { margin-top: 22px; }

  .ag-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
  .ag-item { animation: agIn .5s ease-out backwards; animation-delay: calc(.06s * var(--i, 0)); }

  .ag-cartao {
    display: grid;
    grid-template-columns: 176px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 18px;
    padding: 12px 14px 12px 12px;
    background: var(--bg);
    color: var(--fg);
    border: 3px solid ${C.ink};
    box-shadow: 6px 6px 0 rgba(24,18,3,.5);
    text-decoration: none;
    transition: transform .14s ease, box-shadow .14s ease;
  }
  .ag-clicavel:hover { transform: translate(-3px,-3px); box-shadow: 9px 9px 0 rgba(24,18,3,.55); }
  .ag-clicavel:active { transform: translate(2px,2px); box-shadow: 3px 3px 0 rgba(24,18,3,.45); }
  .ag-clicavel:focus-visible { outline: 3px solid ${C.gold}; outline-offset: 4px; }

  .ag-thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: ${C.night};
    border: 2px solid ${C.ink};
  }
  .ag-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ag-thumb-fallback {
    width: 100%; height: 100%;
    display: grid; place-items: center;
    background:
      repeating-linear-gradient(135deg, rgba(255,203,5,.16) 0 8px, transparent 8px 16px),
      ${C.night};
  }
  .ag-thumb-fallback span {
    font-family: ${FONT_ALFA}; font-size: 26px; letter-spacing: 2px;
    color: ${C.gold}; text-shadow: 2px 2px 0 rgba(0,0,0,.6);
  }
  .ag-etiqueta {
    position: absolute; top: 6px; left: 6px;
    display: inline-flex; align-items: center; gap: 5px;
    font-family: ${FONT_ELITE}; font-size: 9px; letter-spacing: 1.6px; text-transform: uppercase;
    color: ${C.gold}; background: ${C.ink};
    padding: 3px 8px; border: 1px solid ${C.gold};
  }
  .ag-ponto {
    width: 6px; height: 6px; border-radius: 50%; background: #FF3B30;
    box-shadow: 0 0 0 2px rgba(255,59,48,.3);
    animation: agPulse 1.6s ease-in-out infinite;
  }

  .ag-texto { min-width: 0; }
  .ag-item-titulo {
    font-family: ${FONT_ALFA};
    font-size: clamp(17px, 2.4vw, 23px);
    line-height: 1.12; letter-spacing: .4px; text-transform: uppercase;
    margin: 0 0 5px; color: var(--fg);
  }
  .ag-item-sub { margin: 0; font-size: 13.5px; line-height: 1.4; color: var(--sub); }

  .ag-meta {
    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
    padding-left: 18px; border-left: 2px solid rgba(24,18,3,.3);
    text-align: right; white-space: nowrap;
  }
  .ag-cartao-claro .ag-meta { border-left-color: rgba(246,245,239,.3); }
  .ag-meta-data {
    font-family: ${FONT_ELITE}; font-size: 12.5px; letter-spacing: 1.4px;
    color: var(--fg); opacity: .95;
  }
  .ag-meta-sep { opacity: .55; }
  .ag-meta-dia {
    font-family: ${FONT_ALFA}; font-size: clamp(15px, 2vw, 20px);
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--fg);
  }

  .ag-selo {
    width: 42px; height: 42px; flex: 0 0 auto;
    display: grid; place-items: center;
    background: var(--badge); color: var(--badge-fg);
    border: 2px solid ${C.ink}; border-radius: 10px;
    box-shadow: 3px 3px 0 rgba(24,18,3,.35);
  }

  .ag-vazio {
    text-align: center; font-family: ${FONT_ELITE}; letter-spacing: 1.5px;
    color: ${C.cream}; background: rgba(20,17,12,.6);
    border: 2px solid ${C.ink}; padding: 26px 18px;
  }

  .ag-rodape {
    margin-top: 30px; text-align: center;
    font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 1.2px; line-height: 1.7;
    color: ${C.cream}; opacity: .85; text-shadow: 0 1px 6px rgba(0,0,0,.7);
  }
  .ag-rodape p { margin: 0; }

  @keyframes agIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes agPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

  /* ===== Tablet ===== */
  @media (max-width: 860px) {
    .ag-cartao { grid-template-columns: 140px minmax(0, 1fr) auto; gap: 14px; }
    .ag-selo { display: none; }
  }

  /* ===== Celular ===== */
  @media (max-width: 620px) {
    .ag-cartao {
      grid-template-columns: 1fr;
      gap: 0;
      padding: 10px;
    }
    /* miniatura vira faixa: mantém o ritmo da lista sem esticar o cartão */
    .ag-thumb { width: 100%; margin-bottom: 12px; aspect-ratio: 5 / 2; max-height: 150px; }
    .ag-texto { padding: 0 2px; }
    .ag-meta {
      flex-direction: row; align-items: baseline; justify-content: space-between;
      gap: 10px; width: 100%; text-align: left;
      padding: 10px 2px 2px; margin-top: 10px;
      border-left: 0; border-top: 2px solid rgba(24,18,3,.3);
    }
    .ag-cartao-claro .ag-meta { border-top-color: rgba(246,245,239,.3); }
    .ag-titulo { letter-spacing: 1.5px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ag-item { animation: none; }
    .ag-cartao, .ag-voltar, .ag-canal { transition: none !important; }
    .ag-ponto { animation: none; }
  }
`;
