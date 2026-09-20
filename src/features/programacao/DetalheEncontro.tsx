"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { bordaFina, FONT_ALFA, FONT_ELITE } from "@/lib/theme";
import { Icon, type IconName } from "@/components/icons";
import { C, BORDA, NOMES_FAMILIA, sombra, type ItemAgenda } from "./tipos";
import type { Estado } from "./tempo";

/**
 * O nome por extenso de cada plataforma que o painel sabe marcar. A chave é a
 * mesma do ícone (`ICONES_VALIDOS` na página); o que não estiver aqui vira só
 * "Abrir link", sem inventar nome.
 */
const NOME_PLATAFORMA: Partial<Record<IconName, string>> = {
  youtube: "YouTube",
  instagram: "Instagram",
  twitch: "Twitch",
  kick: "Kick",
  tiktok: "TikTok",
  x: "X",
  whatsapp: "WhatsApp",
};

/**
 * A FICHA DO ENCONTRO — o que abre quando se toca no cartão da /programacao.
 *
 * O cartão só cabe título, subtítulo e a data; o resto do que a coordenação
 * preencheu (o lugar, a categoria, a imagem inteira, o link, o grupo) ficava
 * sem onde aparecer. Aqui entra TUDO o que veio no `agenda.json` — e só isso:
 * campo vazio não desenha linha nenhuma, nem "a definir". O que não sai no
 * arquivo (orçamento, observações, público esperado) é assunto do painel, e
 * `item_publico()` (eventos-comum.php) é quem decide o que sai.
 */
const DetalheEncontro: React.FC<{
  item: ItemAgenda;
  estado: Estado;
  aoVivoAgora: boolean;
  onFechar: () => void;
}> = ({ item, estado, aoVivoAgora, onFechar }) => {
  const fecharRef = useRef<HTMLButtonElement | null>(null);

  /* Foco no Fechar ao abrir, Esc fecha, e a página atrás não rola — no celular
     o modal ocupa a tela e o dedo que arrastasse levaria a lista junto. */
  useEffect(() => {
    fecharRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = antes;
    };
  }, [onFechar]);

  const situacao =
    aoVivoAgora ? "Ao vivo"
      : estado === "agora" ? "Acontecendo agora"
      : estado === "passado" ? "Já passou"
      : null;

  /* O subtítulo do cartão é o local quando não há outro (`item_publico()`);
     aqui os dois têm linha própria, então o repetido sai. */
  const subtitulo = item.subtitulo && item.subtitulo !== item.local ? item.subtitulo : null;

  const nomePlataforma = item.plataforma ? NOME_PLATAFORMA[item.plataforma as IconName] : undefined;
  const rotuloLink =
    item.interno ? "Saiba mais"
      : nomePlataforma ? `Assistir no ${nomePlataforma}`
      : "Abrir link";

  const temQuando = item.dia || item.data || item.hora;
  const temOnde = item.local || item.endereco || nomePlataforma;
  const temQuem = !!item.responsaveis?.length;
  const temAcao = item.link || item.grupo || item.confirmar;

  return (
    <div className="dt-overlay" role="presentation" onClick={onFechar}>
      <div
        className="dt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dt-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dt-topo">
          <div className="dt-selos">
            {item.familia && <span className="dt-selo">{NOMES_FAMILIA[item.familia]}</span>}
            {situacao && (
              <span className="dt-selo dt-selo-vivo">
                {aoVivoAgora && <span className="dt-ponto" aria-hidden="true" />}
                {situacao}
              </span>
            )}
          </div>
          <button ref={fecharRef} type="button" className="dt-fechar" onClick={onFechar} aria-label="Fechar">
            <Icon name="close" size={18} />
          </button>
        </div>

        {item.imagem && (
          <div className="dt-imagem">
            <img src={item.imagem} alt="" decoding="async" />
          </div>
        )}

        <h2 id="dt-titulo" className="dt-titulo">{item.titulo}</h2>
        {subtitulo && <p className="dt-sub">{subtitulo}</p>}

        {(temQuando || temOnde || temQuem) && (
          <dl className="dt-lista">
            {temQuando && (
              <div className="dt-linha">
                <dt><Icon name="calendar" size={16} /><span>Quando</span></dt>
                <dd>
                  {item.dia && <strong>{item.dia}</strong>}
                  {item.dia && (item.data || item.hora) && ", "}
                  {item.data}
                  {item.data && item.hora && " às "}
                  {item.hora}
                </dd>
              </div>
            )}
            {(item.local || item.endereco) && (
              <div className="dt-linha">
                <dt><Icon name="pin" size={16} /><span>Onde</span></dt>
                <dd>
                  {item.local && <strong>{item.local}</strong>}
                  {item.local && item.endereco && <br />}
                  {item.endereco}
                </dd>
              </div>
            )}
            {!item.local && !item.endereco && nomePlataforma && (
              <div className="dt-linha">
                <dt><Icon name="broadcast" size={16} /><span>Onde</span></dt>
                <dd>{nomePlataforma}</dd>
              </div>
            )}
            {temQuem && (
              <div className="dt-linha">
                <dt><Icon name="users" size={16} /><span>Quem</span></dt>
                <dd>
                  <ul className="dt-quem">
                    {item.responsaveis!.map((r) => (
                      <li key={r.peca}>
                        <span className="dt-peca">{r.peca}</span> {r.nomes.join(", ")}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}

        {temAcao && (
          <div className="dt-acoes">
            {/* O mesmo botão único do cartão: com grupo, entra no grupo; sem, o
                formulário de sempre. Quem decide se ele existe é o painel. */}
            {(item.grupo || item.confirmar) && (
              <a
                className="dt-btn dt-btn-principal"
                href={item.grupo || `/presenca?c=${item.confirmar}`}
                {...(item.grupo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <Icon name={item.grupo ? "whatsapp" : "flag"} size={15} />
                <span>Confirmar presença</span>
              </a>
            )}
            {item.link && (item.interno ? (
              <Link className="dt-btn" href={item.link}>
                <Icon name="chevronRight" size={15} />
                <span>{rotuloLink}</span>
              </Link>
            ) : (
              <a className="dt-btn" href={item.link} target="_blank" rel="noopener noreferrer">
                <Icon name={nomePlataforma ? (item.plataforma as IconName) : "world"} size={15} />
                <span>{rotuloLink}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <style>{css}</style>
    </div>
  );
};

const css = `
  .dt-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: grid; place-items: center; padding: 16px;
    background: rgba(8,7,5,.82); backdrop-filter: blur(3px);
    animation: dtFade .18s ease-out;
  }
  .dt-modal {
    width: min(520px, 100%); max-width: 100%; box-sizing: border-box;
    max-height: 92dvh; overflow: auto;
    background: ${C.night}; color: ${C.cream};
    border: ${BORDA}px solid ${C.gold}; box-shadow: ${sombra("alto", C.sombraNoite)};
    padding: 16px;
    animation: dtUp .22s ease-out;
  }
  .dt-topo { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  .dt-selos { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 6px; }
  .dt-selo {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: ${FONT_ELITE}; font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase;
    color: ${C.gold}; background: rgba(255,203,5,.1);
    padding: 5px 9px; border: 1px solid ${C.gold};
  }
  .dt-selo-vivo { color: ${C.ink}; background: ${C.gold}; }
  .dt-ponto {
    width: 6px; height: 6px; border-radius: 50%; background: #FF3B30;
    box-shadow: 0 0 0 2px rgba(255,59,48,.3);
    animation: dtPulse 1.6s ease-in-out infinite;
  }
  .dt-fechar {
    flex: 0 0 auto; width: 44px; height: 44px; display: grid; place-items: center; cursor: pointer;
    background: transparent; color: ${C.cream}; border: ${bordaFina("rgba(246,245,239,.35)")};
  }
  .dt-fechar:hover { background: ${C.gold}; color: ${C.ink}; border-color: ${C.gold}; }

  .dt-imagem {
    aspect-ratio: 16 / 9; overflow: hidden; margin-bottom: 14px;
    background: ${C.ink}; border: ${bordaFina(C.ink)};
  }
  .dt-imagem img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .dt-titulo {
    font-family: ${FONT_ALFA}; font-size: clamp(20px, 4.6vw, 26px);
    line-height: 1.12; letter-spacing: .6px; text-transform: uppercase;
    color: ${C.gold}; margin: 0 0 6px;
  }
  .dt-sub { margin: 0 0 14px; font-size: 15px; line-height: 1.5; color: ${C.cream}; opacity: .9; }

  .dt-lista { margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .dt-linha {
    display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 10px; align-items: baseline;
    padding-top: 10px; border-top: ${bordaFina("rgba(246,245,239,.18)")};
  }
  .dt-linha dt {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: ${FONT_ELITE}; font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.gold};
  }
  .dt-linha dt svg { flex: 0 0 auto; }
  .dt-linha dd { margin: 0; font-size: 15px; line-height: 1.5; overflow-wrap: anywhere; }
  .dt-linha dd strong { font-family: ${FONT_ALFA}; font-weight: 400; letter-spacing: .8px; text-transform: uppercase; }
  .dt-quem { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .dt-peca {
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase;
    color: ${C.gold}; margin-right: 4px;
  }

  .dt-acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
  .dt-btn {
    flex: 1 1 160px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.cream}; background: transparent; text-decoration: none; text-align: center;
    min-height: 44px; padding: 12px 14px; border: ${bordaFina(C.gold)};
    transition: background .12s ease, color .12s ease;
  }
  .dt-btn svg { flex: 0 0 auto; }
  .dt-btn:hover { background: rgba(255,203,5,.16); }
  .dt-btn-principal { background: ${C.gold}; color: ${C.ink}; border-color: ${C.ink}; }
  .dt-btn-principal:hover { background: #ffd93d; }
  .dt-btn:focus-visible, .dt-fechar:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 3px; }

  @keyframes dtFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes dtUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes dtPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) {
    .dt-overlay, .dt-modal { animation: none; }
    .dt-ponto { animation: none; }
    .dt-btn { transition: none !important; }
  }
`;

export default DetalheEncontro;
