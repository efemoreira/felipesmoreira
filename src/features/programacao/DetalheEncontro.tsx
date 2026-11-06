"use client";
/* eslint-disable @next/next/no-img-element */
import { feriadoEm } from "@/lib/feriados";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { C, FOCO, FONT_ALFA, PONTOS, RAIO, borda, sombra } from "@/lib/theme";
import { Icon, type IconName } from "@/components/icons";
import { NOMES_FAMILIA, vouDoItem, type ItemAgenda } from "./tipos";
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
  /* O dia é feriado? A ficha avisa — quem vai planeja diferente. */
  const feriado = item.inicio ? feriadoEm(item.inicio.slice(0, 10), item.cidade ?? "") : null;
  const temQuem = !!item.responsaveis?.length;
  /* O mesmo destino do botão do cartão, do mesmo lugar: a ficha não pode levar
     a um lugar diferente do cartão que a abriu. */
  const vou = vouDoItem(item);
  const temAcao = item.link || vou;

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

        {feriado && (
          <p className="dt-sub">
            <strong>Feriado:</strong> {feriado.nome}
            {feriado.onde === "facultativo" ? " (ponto facultativo)" : ""}
          </p>
        )}

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
                  {item.cidade && (item.local || item.endereco) && <br />}
                  {item.cidade && [item.bairro, item.cidade].filter(Boolean).join(", ")}
                </dd>
              </div>
            )}
            {!item.local && !item.endereco && nomePlataforma && (
              <div className="dt-linha">
                <dt><Icon name="broadcast" size={16} /><span>Onde</span></dt>
                <dd>{nomePlataforma}</dd>
              </div>
            )}
            {item.unidade && (
              <div className="dt-linha">
                <dt><Icon name="flag" size={16} /><span>De quem</span></dt>
                <dd>
                  <a href={item.unidade.tipo === "nucleo" ? "/nucleos" : `/temas#${item.unidade.tema}`}>
                    {item.unidade.tipo === "nucleo" ? "Núcleo " : "Grupo "}
                    {item.unidade.nome}
                  </a>
                </dd>
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
            {/* O mesmo botão único do cartão — ato de campanha entra direto no
                grupo, o resto passa pelo formulário de confirmação, que oferece
                o grupo no fim. Ver `vouDoItem()`. */}
            {vou && (
              <a
                className="dt-btn dt-btn-principal"
                href={vou.href}
                {...(vou.grupo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <Icon name={vou.grupo ? "whatsapp" : "flag"} size={15} />
                <span>{vou.rotulo}</span>
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
    position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 16px;
    background: rgba(24,18,3,.3); animation: dtFade .18s ease-out;
  }
  .dt-modal {
    width: min(540px, 100%); max-width: 100%; box-sizing: border-box; max-height: 92dvh; overflow: auto;
    background: ${C.paper}; color: ${C.ink}; border-radius: ${RAIO.xg}px; box-shadow: ${sombra("alto")};
    padding: 20px 22px 22px; animation: dtUp .22s ease-out;
  }
  .dt-topo { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
  .dt-selos { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 8px; }
  .dt-selo { display: inline-flex; align-items: center; gap: 6px; min-height: 26px; padding: 2px 10px; font-size: 14px; font-weight: 600; color: ${C.ink}; background: ${C.fundo}; border-radius: ${RAIO.pilula}px; }
  .dt-selo-vivo { background: ${C.gold}; font-weight: 700; }
  .dt-ponto { width: 8px; height: 8px; border-radius: 50%; background: ${C.aoVivo}; animation: dtPulse 1.6s ease-in-out infinite; }
  .dt-fechar { flex: 0 0 auto; width: 44px; height: 44px; margin: -2px -8px 0 0; display: grid; place-items: center; cursor: pointer; background: transparent; color: ${C.ink}; border: 0; border-radius: ${RAIO.p + 2}px; }
  .dt-fechar:hover { background: ${C.fundo}; }

  .dt-imagem { aspect-ratio: 16 / 9; overflow: hidden; margin-bottom: 14px; background: ${C.fundo}; border-radius: ${RAIO.m}px; }
  .dt-imagem img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .dt-titulo { margin: 0 0 6px; font-family: ${FONT_ALFA}; font-weight: 400; font-size: clamp(26px, 5vw, 30px); line-height: 1.12; color: ${C.ink}; text-wrap: balance; }
  .dt-sub { margin: 0 0 8px; font-size: 16.5px; line-height: 1.5; color: ${C.suave}; }

  .dt-lista { margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; }
  .dt-linha { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 10px; align-items: baseline; padding-block: 11px; border-top: ${borda()}; }
  .dt-linha dt { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: ${C.suave}; }
  .dt-linha dt svg { flex: 0 0 auto; }
  .dt-linha dd { margin: 0; font-size: 16.5px; line-height: 1.5; overflow-wrap: anywhere; }
  .dt-linha dd strong { font-weight: 700; }
  .dt-linha dd a { color: ${C.ink}; font-weight: 600; }
  .dt-quem { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .dt-peca { font-weight: 600; color: ${C.suave}; margin-right: 4px; }

  .dt-acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .dt-btn {
    flex: 1 1 160px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 16.5px; font-weight: 700; line-height: 1.2; color: ${C.ink}; background: ${C.paper}; text-decoration: none; text-align: center;
    min-height: 50px; padding: 12px 16px; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.m}px; transition: background-color .15s ease, border-color .15s ease;
  }
  .dt-btn svg { flex: 0 0 auto; }
  .dt-btn:hover { border-color: ${C.ink}; }
  .dt-btn-principal { background: ${C.gold}; border-color: ${C.gold}; }
  .dt-btn-principal:hover { background: ${C.gold2}; border-color: ${C.gold2}; }
  .dt-btn:focus-visible, .dt-fechar:focus-visible { outline: ${FOCO}; outline-offset: 2px; }

  @keyframes dtFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes dtUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes dtPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
  /* No celular a ficha sobe de baixo, como toda folha de aplicativo. */
  @media (max-width: ${PONTOS.tablet - 1}px) {
    .dt-overlay { place-items: end center; padding: 0; }
    .dt-modal { width: 100%; border-radius: ${RAIO.xg}px ${RAIO.xg}px 0 0; padding-bottom: max(22px, env(safe-area-inset-bottom)); }
  }
  @media (prefers-reduced-motion: reduce) {
    .dt-overlay, .dt-modal { animation: none; }
    .dt-ponto { animation: none; }
    .dt-btn { transition: none !important; }
  }
`;

export default DetalheEncontro;
