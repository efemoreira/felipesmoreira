"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { C, BORDA, type Agenda, sombra, sombraErguida, sombraAfundada } from "./tipos";
import { FORMATOS, canvasParaBlob, gerarPoster, nomeArquivo, type Formato } from "./poster";

const FONT_ALFA = "var(--font-alfa), serif";
const FONT_ELITE = "var(--font-elite), monospace";

type Estado = "parado" | "gerando" | "pronto" | "erro";

const CompartilharClient: React.FC<{ agenda: Agenda }> = ({ agenda }) => {
  const [estado, setEstado] = useState<Estado>("parado");
  const [formato, setFormato] = useState<Formato>("9:16");
  const [preview, setPreview] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const abrirRef = useRef<HTMLButtonElement | null>(null);
  const fecharRef = useRef<HTMLButtonElement | null>(null);

  const aberto = estado === "gerando" || estado === "pronto" || estado === "erro";

  const gerar = useCallback(async (fmt: Formato) => {
    setEstado("gerando");
    setAviso(null);
    try {
      const canvas = await gerarPoster(agenda, fmt);
      const blob = await canvasParaBlob(canvas);
      if (!blob) throw new Error("sem blob");
      blobRef.current = blob;
      setPreview((antigo) => {
        if (antigo) URL.revokeObjectURL(antigo);
        return URL.createObjectURL(blob);
      });
      setEstado("pronto");
    } catch {
      setEstado("erro");
    }
  }, [agenda]);

  const fechar = useCallback(() => {
    setEstado("parado");
    setAviso(null);
    abrirRef.current?.focus();
  }, []);

  // limpa a URL do preview ao desmontar
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  // Esc fecha e o foco vai para o botão de fechar quando abre
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => fecharRef.current?.focus(), 40);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      document.body.style.overflow = overflow;
    };
  }, [aberto, fechar]);

  const trocarFormato = (fmt: Formato) => {
    if (fmt === formato && estado === "pronto") return;
    setFormato(fmt);
    gerar(fmt);
  };

  const baixar = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = nomeArquivo(formato);
    a.click();
    setAviso("Imagem baixada.");
  };

  const compartilhar = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    const arquivo = new File([blob], nomeArquivo(formato), { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
    if (nav.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({
          files: [arquivo],
          title: agenda.titulo,
          text: `${agenda.titulo}${agenda.periodo ? ` — ${agenda.periodo}` : ""} · @moreiramissao`,
        });
        return;
      } catch {
        return; // usuário cancelou o menu de compartilhamento
      }
    }
    baixar();
  };

  const copiar = async () => {
    const blob = blobRef.current;
    if (!blob || typeof ClipboardItem === "undefined") return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setAviso("Imagem copiada — é só colar.");
    } catch {
      setAviso("Não deu para copiar. Use o botão Baixar.");
    }
  };

  const podeCopiar = typeof window !== "undefined" && typeof ClipboardItem !== "undefined";

  return (
    <>
      <button ref={abrirRef} type="button" className="cp-abrir" onClick={() => gerar(formato)}>
        <Icon name="instagram" size={18} />
        <span>Compartilhar imagem</span>
      </button>

      {aberto && (
        <div className="cp-overlay" role="presentation" onClick={fechar}>
          <div
            className="cp-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Imagem da programação para compartilhar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cp-modal-topo">
              <h2 className="cp-modal-titulo">Imagem para postar</h2>
              <button ref={fecharRef} type="button" className="cp-fechar" onClick={fechar} aria-label="Fechar">
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* formato: os dois são verticais */}
            <div className="cp-formatos" role="group" aria-label="Formato da imagem">
              {(Object.keys(FORMATOS) as Formato[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`cp-formato${f === formato ? " cp-formato-ativo" : ""}`}
                  aria-pressed={f === formato}
                  onClick={() => trocarFormato(f)}
                >
                  {FORMATOS[f].rotulo}
                </button>
              ))}
            </div>

            <div className="cp-palco">
              {estado === "gerando" && <p className="cp-status">Montando a arte…</p>}
              {estado === "erro" && (
                <p className="cp-status">Não deu para gerar a imagem. Tente de novo.</p>
              )}
              {estado === "pronto" && preview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview} alt="Prévia da imagem da programação da semana" className="cp-preview" />
              )}
            </div>

            {estado === "pronto" && (
              <>
                <div className="cp-acoes">
                  <button type="button" className="cp-btn cp-btn-principal" onClick={compartilhar}>
                    <Icon name="whatsapp" size={18} />
                    <span>Compartilhar</span>
                  </button>
                  <button type="button" className="cp-btn" onClick={baixar}>
                    <Icon name="play" size={18} />
                    <span>Baixar PNG</span>
                  </button>
                  {podeCopiar && (
                    <button type="button" className="cp-btn" onClick={copiar}>
                      <Icon name="book" size={18} />
                      <span>Copiar</span>
                    </button>
                  )}
                </div>
                <p className="cp-dica" role="status">
                  {aviso ??
                    `1080 × ${FORMATOS[formato].altura}px — pronto para stories, feed e WhatsApp.`}
                </p>
              </>
            )}

            {estado === "erro" && (
              <div className="cp-acoes">
                <button
                  type="button"
                  className="cp-btn cp-btn-principal"
                  onClick={() => gerar(formato)}
                >
                  <span>Tentar de novo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{css}</style>
    </>
  );
};

const css = `
  .cp-abrir {
    display: inline-flex; align-items: center; gap: 9px; cursor: pointer;
    font-family: ${FONT_ELITE}; font-size: 13px; letter-spacing: 2.5px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold};
    padding: 11px 22px; border: ${BORDA}px solid ${C.ink};
    box-shadow: ${sombra()};
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .cp-abrir:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("cartao")}; }
  .cp-abrir:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("cartao")}; }
  .cp-abrir:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 4px; }

  .cp-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: grid; place-items: center; padding: 20px;
    background: rgba(8,7,5,.82); backdrop-filter: blur(3px);
    animation: cpFade .18s ease-out;
  }
  .cp-modal {
    width: min(460px, 100%); max-width: 100%; box-sizing: border-box;
    max-height: 92dvh; overflow: auto;
    background: ${C.night}; color: ${C.cream};
    border: ${BORDA}px solid ${C.gold}; box-shadow: ${sombra("alto", C.sombraNoite)};
    padding: 16px;
    animation: cpUp .22s ease-out;
  }
  .cp-modal-topo { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .cp-fechar { flex: 0 0 auto; }
  .cp-modal-titulo {
    font-family: ${FONT_ALFA}; font-size: 17px; letter-spacing: .5px;
    text-transform: uppercase; color: ${C.gold}; margin: 0;
  }
  .cp-fechar {
    width: 44px; height: 44px; display: grid; place-items: center; cursor: pointer;
    background: transparent; color: ${C.cream}; border: 2px solid rgba(246,245,239,.35);
  }
  .cp-fechar:hover { background: ${C.gold}; color: ${C.ink}; border-color: ${C.gold}; }

  .cp-formatos { display: flex; gap: 8px; margin-bottom: 12px; }
  .cp-formato {
    flex: 1 1 0; min-width: 0; cursor: pointer;
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase;
    color: ${C.cream}; background: transparent;
    min-height: 44px;
    padding: 9px 8px; border: 2px solid rgba(255,203,5,.4);
    transition: background .12s ease, color .12s ease, border-color .12s ease;
  }
  .cp-formato:hover { border-color: ${C.gold}; background: rgba(255,203,5,.12); }
  .cp-formato-ativo { background: ${C.gold}; color: ${C.ink}; border-color: ${C.gold}; }
  .cp-formato:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 3px; }

  .cp-palco {
    min-height: 220px; display: grid; place-items: center;
    background: rgba(0,0,0,.35); border: 2px solid rgba(255,203,5,.25); padding: 10px;
  }
  .cp-preview { display: block; max-width: 100%; max-height: 58dvh; width: auto; height: auto; border: 2px solid ${C.ink}; }
  .cp-status { font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-align: center; opacity: .85; }

  .cp-acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  /* Sem \`nowrap\` e sem \`min-width: 0\`: num celular de 360px os rótulos
     estouravam a própria borda e criavam rolagem horizontal dentro do modal. */
  .cp-btn {
    flex: 1 1 140px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.cream}; background: transparent; text-align: center;
    min-height: 44px;
    padding: 12px 14px; border: 2px solid ${C.gold};
    transition: background .12s ease, color .12s ease;
  }
  .cp-btn svg, .cp-abrir svg { flex: 0 0 auto; }
  .cp-btn:hover { background: rgba(255,203,5,.16); }
  .cp-btn-principal { background: ${C.gold}; color: ${C.ink}; border-color: ${C.ink}; }
  .cp-btn-principal:hover { background: #ffd93d; }
  .cp-btn:focus-visible, .cp-fechar:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 3px; }

  .cp-dica {
    margin: 12px 0 2px; text-align: center;
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.2px; line-height: 1.6; opacity: .8;
  }

  @keyframes cpFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cpUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    .cp-overlay, .cp-modal { animation: none; }
    .cp-abrir, .cp-btn { transition: none !important; }
  }
`;

export default CompartilharClient;
