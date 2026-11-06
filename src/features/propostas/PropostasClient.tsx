"use client";
import React, { useEffect, useState } from "react";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { Convite } from "@/components/site/Convite";
import { Icon } from "@/components/icons";
import { C, FOCO, FONT_ALFA, PONTOS, RAIO, TITULO, borda } from "@/lib/theme";
import {
  CHAPA,
  CITACOES,
  METODO_FRASE,
  PRINCIPIOS,
  SEIS_PERGUNTAS,
  TESE,
  compromissos,
} from "./data";
import { FaixaEleicao } from "@/components/FaixaEleicao";
import type { Compromisso } from "./tipos";

/**
 * /propostas — o plano de governo, por compromisso.
 *
 * Eram 20 mil pixels de rolagem no celular: oito caixas abertas, uma atrás da
 * outra. Agora cada compromisso mostra o que está em jogo e os números que se
 * cobram, e as propostas, o recurso e o prazo ficam na gaveta. No computador o
 * índice acompanha a leitura ao lado. Quem chega por `/propostas#<id>` encontra
 * o compromisso já aberto.
 */

/* Curto de propósito: com o intervalo de páginas ao lado, um rótulo mais longo
   quebra em duas linhas a 390px e desalinha o número do título. */
const MOVIMENTO_ROTULO: Record<Compromisso["movimento"], string> = {
  retomar: "Retomar",
  reconstruir: "Reconstruir",
  metodo: "Método",
};

/* ===================== peças ===================== */

/** O número que se cobra. Tabular para as colunas não dançarem. */
const CartaoMeta: React.FC<{ numero: string; oQue: string; pagina: string }> = ({ numero, oQue, pagina }) => (
  <div className="pr-meta">
    <b>{numero}</b>
    <span>{oQue}</span>
    <small>{pagina}</small>
  </div>
);

const BlocoCompromisso: React.FC<{ c: Compromisso }> = ({ c }) => {
  const [aberto, setAberto] = useState(false);

  /* Quem chega por um link para este compromisso quer ler as propostas dele. */
  useEffect(() => {
    const ver = () => {
      if (window.location.hash === `#${c.id}`) setAberto(true);
    };
    ver();
    window.addEventListener("hashchange", ver);
    return () => window.removeEventListener("hashchange", ver);
  }, [c.id]);

  return (
    <article id={c.id} className="pr-bloco">
      <header className="pr-cabeca">
        <span aria-hidden="true" className="s-selo pr-num">{c.numero}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="s-rotulo">
            {MOVIMENTO_ROTULO[c.movimento]} · {c.paginas}
          </p>
          <h2 className="pr-titulo">{c.titulo}</h2>
        </div>
      </header>

      <p className="pr-jogo">{c.emJogo}</p>

      {/* Onde queremos chegar: os números ficam sempre à vista */}
      <div className="pr-metas">
        {c.metas.map((m) => (
          <CartaoMeta key={m.oQue} {...m} />
        ))}
      </div>

      {/* Com oito compromissos abertos de uma vez a página vira um paredão. */}
      <details className="pr-mais" open={aberto} onToggle={(e) => setAberto((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>
          {aberto ? "Fechar" : "As propostas, o recurso e o prazo"}
          <span className="pr-seta" aria-hidden="true"><Icon name="chevronRight" size={20} /></span>
        </summary>

        <h3>O que vamos fazer</h3>
        <ul className="pr-propostas">
          {c.propostas.map((p) => (
            <li key={p.titulo}>
              <b>
                {p.titulo} <small>{p.pagina}</small>
              </b>
              <span>{p.texto}</span>
            </li>
          ))}
        </ul>

        <h3>De onde vem o recurso</h3>
        <ul className="pr-recurso">
          {c.recurso.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <h3>Quando entrega</h3>
        <ul className="pr-prazos">
          {c.prazos.map((p) => (
            <li key={p.quando}>
              <span className="s-etiqueta s-etiqueta-ouro">{p.quando}</span>
              <span>{p.entrega}</span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
};

/* ===================== página ===================== */

export default function PropostasClient() {
  return (
    <PaginaDoSite
      abertura={
        <AberturaPagina
          trilha="Propostas"
          kicker={`Plano de governo · ${CHAPA.paginas} páginas`}
          titulo={CHAPA.documento}
          icone="star"
          intro={
            <>
              <p>{TESE}</p>
              <p style={{ marginTop: 10, fontSize: 16 }}>
                {CHAPA.governador}, governador · {CHAPA.vice}, vice · Partido {CHAPA.partido}, eleição de 2026
              </p>
            </>
          }
          acoes={[{ texto: "Quero participar", href: "/queroajudar" }]}
        />
      }
    >
      <div className="pr-grade">
        {/* ===== o índice ===== */}
        <nav aria-label="Os compromissos" className="pr-indice">
          <p className="pr-indice-titulo">Os compromissos</p>
          <ol>
            {compromissos.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>
                  <b>{c.numero}</b>
                  <span>{c.titulo}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="pr-miolo">
          {/* ===== como ler ===== */}
          <section className="pr-como" aria-labelledby="pr-como">
            <h2 id="pr-como">Como ler este plano</h2>
            <p>
              Ele não é organizado por secretaria, e sim por compromissos, porque os problemas do
              cearense não respeitam a divisão de pastas do governo. Cada um responde sempre às
              mesmas seis perguntas:
            </p>
            <ol>
              {SEIS_PERGUNTAS.map((p, i) => (
                <li key={p}>
                  <b>{i + 1}</b>
                  {p}
                </li>
              ))}
            </ol>
            <p className="pr-frase">{METODO_FRASE}</p>
          </section>

          {/* ===== princípios ===== */}
          <section className="pr-principios" aria-labelledby="pr-principios">
            <h2 id="pr-principios">Os cinco princípios</h2>
            <ul>
              {PRINCIPIOS.map((p) => (
                <li key={p} className="s-etiqueta">{p}</li>
              ))}
            </ul>
          </section>

          {/* ===== os compromissos ===== */}
          {compromissos.map((c) => (
            <BlocoCompromisso key={c.id} c={c} />
          ))}

          {/* ===== a carta ===== */}
          <section className="pr-carta" aria-labelledby="pr-carta">
            <h2 id="pr-carta" className="s-titulo">Da carta ao povo cearense</h2>
            {CITACOES.map((q) => (
              <blockquote key={q.pagina + q.texto.slice(0, 20)}>
                <p>“{q.texto}”</p>
                <cite>{CHAPA.documento}, {q.pagina}</cite>
              </blockquote>
            ))}
          </section>

          <FaixaEleicao />
        </div>
      </div>

      <Convite
        titulo="Cobrar é bom. Construir é melhor."
        texto="Este plano só sai do papel se tiver gente. Entre na militância da Missão Ceará e escolha por onde começar."
        acao="Quero ajudar"
        agenda={false}
      />

      <style>{`
        .pr-grade { display: grid; gap: 32px; margin-bottom: clamp(32px, 5vw, 56px); }
        .pr-miolo { min-width: 0; }

        .pr-indice-titulo { margin: 0 0 8px; font-size: 16px; font-weight: 800; }
        .pr-indice ol { list-style: none; margin: 0; padding: 0; border-top: ${borda()}; }
        .pr-indice a { display: flex; align-items: flex-start; gap: 10px; min-height: 44px; padding: 10px 0; border-bottom: ${borda()}; color: ${C.ink}; text-decoration: none; font-size: 15.5px; line-height: 1.35; }
        .pr-indice a:hover { color: ${C.goldDim}; }
        .pr-indice b { flex: 0 0 18px; font-weight: 800; color: ${C.goldDim}; }

        .pr-como { padding: clamp(20px, 3.4vw, 28px); margin-bottom: 28px; background: ${C.fundo}; border-radius: ${RAIO.g}px; }
        .pr-como h2, .pr-principios h2 { margin: 0 0 8px; font-size: 21px; line-height: 1.3; font-weight: 800; letter-spacing: -.01em; }
        .pr-como p { margin: 0 0 14px; font-size: 17px; line-height: 1.6; color: ${C.suave}; }
        .pr-como ol { list-style: none; margin: 0 0 14px; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px 16px; }
        .pr-como li { display: flex; gap: 8px; align-items: baseline; font-size: 16px; line-height: 1.4; }
        .pr-como li b { color: ${C.goldDim}; font-weight: 800; }
        .pr-como .pr-frase { margin: 0; font-size: 16px; font-style: italic; }
        .pr-principios { margin-bottom: 32px; }
        .pr-principios ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .pr-principios .s-etiqueta { white-space: normal; font-size: 15px; min-height: 34px; padding: 4px 14px; }

        .pr-bloco { padding-block: clamp(24px, 4vw, 36px); border-top: ${borda()}; scroll-margin-top: 80px; }
        .pr-cabeca { display: flex; align-items: flex-start; gap: 14px; }
        .pr-num { border-radius: 50%; font-size: 18px; font-weight: 800; }
        .pr-cabeca .s-rotulo { margin: 0 0 2px; }
        .pr-titulo { margin: 0; font-family: ${FONT_ALFA}; font-weight: 400; font-size: ${TITULO.bloco}; line-height: 1.14; text-wrap: balance; }
        .pr-jogo { margin: 14px 0 18px; font-size: 17.5px; line-height: 1.6; color: ${C.suave}; text-wrap: pretty; }
        .pr-metas { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 12px; }
        .pr-meta { display: flex; flex-direction: column; gap: 3px; padding: 14px 16px; background: ${C.fundo}; border-radius: ${RAIO.m}px; }
        .pr-meta b { font-size: 24px; line-height: 1.15; font-weight: 800; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
        .pr-meta span { font-size: 15.5px; line-height: 1.4; color: ${C.ink}; }
        .pr-meta small { font-size: 14px; color: ${C.suave}; }

        .pr-mais { margin-top: 14px; border: ${borda()}; border-radius: ${RAIO.m}px; padding-inline: 16px; }
        .pr-mais summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 52px; font-size: 16.5px; font-weight: 700; cursor: pointer; list-style: none; }
        .pr-mais summary::-webkit-details-marker { display: none; }
        .pr-seta { display: grid; transition: transform .15s ease; }
        .pr-mais[open] .pr-seta { transform: rotate(90deg); }
        .pr-mais h3 { margin: 8px 0 8px; font-size: 16px; font-weight: 800; }
        .pr-propostas, .pr-prazos { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .pr-propostas b { display: block; margin-bottom: 2px; font-size: 16.5px; line-height: 1.35; font-weight: 700; }
        .pr-propostas small { font-size: 14px; font-weight: 400; color: ${C.suave}; }
        .pr-propostas span { display: block; font-size: 16px; line-height: 1.55; color: ${C.suave}; }
        .pr-recurso { margin: 0 0 16px; padding-left: 20px; list-style: disc; display: flex; flex-direction: column; gap: 6px; font-size: 16px; line-height: 1.5; color: ${C.suave}; }
        .pr-prazos { gap: 10px; margin-bottom: 18px; }
        .pr-prazos li { display: flex; align-items: flex-start; gap: 10px; font-size: 16px; line-height: 1.5; color: ${C.suave}; }
        .pr-prazos .s-etiqueta { flex: 0 0 auto; color: ${C.ink}; }

        .pr-carta { padding-block: clamp(28px, 4vw, 40px); border-top: ${borda()}; }
        .pr-carta blockquote { margin: 18px 0 0; padding-left: 16px; border-left: 4px solid ${C.gold}; }
        .pr-carta p { margin: 0; font-size: 18px; line-height: 1.55; }
        .pr-carta cite { display: block; margin-top: 6px; font-size: 15px; font-style: normal; color: ${C.suave}; }

        .pr-indice a:focus-visible, .pr-mais summary:focus-visible { outline: ${FOCO}; outline-offset: 2px; }

        @media (min-width: ${PONTOS.computador}px) {
          .pr-grade { grid-template-columns: 280px minmax(0, 1fr); gap: 56px; align-items: start; }
          .pr-indice { position: sticky; top: 88px; max-height: calc(100dvh - 104px); overflow-y: auto; }
          .pr-bloco:first-of-type { border-top: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .pr-seta { transition: none; } }
      `}</style>
    </PaginaDoSite>
  );
}
