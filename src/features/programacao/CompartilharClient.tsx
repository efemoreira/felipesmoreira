"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { entregarArte } from "@/lib/compartilhar";
import { C, FOCO, FONT_ALFA, PONTOS, RAIO, borda, sombra } from "@/lib/theme";
import { sinal } from "@/lib/api/sinal";
import { Icon } from "@/components/icons";
import type { Agenda } from "./tipos";
import { periodoDoRecorte, type Recorte } from "./tempo";
import { FORMATOS, canvasParaBlob, gerarPoster, nomeArquivo, type Formato } from "./poster";

type Estado = "parado" | "gerando" | "pronto" | "erro";

/**
 * `recorte` é o botão que está apertado na página (hoje, esta semana, próxima
 * semana, tudo): a imagem sai com os mesmos itens e a mesma data que a pessoa
 * está vendo, e não com a agenda inteira.
 */
const CompartilharClient: React.FC<{ agenda: Agenda; recorte?: Recorte }> = ({ agenda, recorte = "semana" }) => {
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
      const canvas = await gerarPoster(agenda, fmt, recorte);
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
  }, [agenda, recorte]);

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
    sinal("compartilhou");
  };

  const compartilhar = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    /* O mesmo período do cartaz e da página, no mesmo recorte — a legenda
       viaja junto com a imagem, e uma data errada escrita ali não tem mais
       conserto. */
    const feito = await entregarArte(
      blob,
      nomeArquivo(formato),
      `${agenda.titulo} — ${periodoDoRecorte(agenda, recorte)} · @moreiramissao`,
      agenda.titulo,
    );
    if (feito === "baixou") setAviso("Imagem baixada.");
    if (feito !== "cancelou") sinal("compartilhou");
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
    display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 9px 16px; cursor: pointer;
    font-size: 15.5px; font-weight: 700; line-height: 1.2; color: ${C.ink}; background: ${C.paper};
    border: ${borda(C.linhaForte)}; border-radius: ${RAIO.p + 2}px; transition: border-color .15s ease;
  }
  .cp-abrir:hover { border-color: ${C.ink}; }
  .cp-abrir:focus-visible { outline: ${FOCO}; outline-offset: 2px; }

  .cp-overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 20px; background: rgba(24,18,3,.3); animation: cpFade .18s ease-out; }
  .cp-modal {
    width: min(480px, 100%); max-width: 100%; box-sizing: border-box; max-height: 92dvh; overflow: auto;
    background: ${C.paper}; color: ${C.ink}; border-radius: ${RAIO.xg}px; box-shadow: ${sombra("alto")};
    padding: 18px 20px 20px; animation: cpUp .22s ease-out;
  }
  .cp-modal-topo { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  .cp-modal-titulo { margin: 0; font-family: ${FONT_ALFA}; font-weight: 400; font-size: 28px; line-height: 1.15; color: ${C.ink}; }
  .cp-fechar { flex: 0 0 auto; width: 44px; height: 44px; margin-right: -8px; display: grid; place-items: center; cursor: pointer; background: transparent; color: ${C.ink}; border: 0; border-radius: ${RAIO.p + 2}px; }
  .cp-fechar:hover { background: ${C.fundo}; }

  .cp-formatos { display: flex; gap: 6px; margin-bottom: 12px; }
  .cp-formato {
    flex: 1 1 0; min-width: 0; cursor: pointer; min-height: 44px; padding: 8px; font-size: 15px; font-weight: 600; line-height: 1.2;
    color: ${C.ink}; background: ${C.paper}; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.p + 2}px; transition: background-color .15s ease, border-color .15s ease;
  }
  .cp-formato:hover { border-color: ${C.ink}; }
  .cp-formato-ativo, .cp-formato-ativo:hover { background: ${C.gold}; border-color: ${C.gold}; font-weight: 700; }
  .cp-formato:focus-visible { outline: ${FOCO}; outline-offset: 2px; }

  .cp-palco { min-height: 220px; display: grid; place-items: center; background: ${C.fundo}; border-radius: ${RAIO.m}px; padding: 12px; }
  .cp-preview { display: block; max-width: 100%; max-height: 58dvh; width: auto; height: auto; border-radius: ${RAIO.p}px; box-shadow: ${sombra("cartao")}; }
  .cp-status { margin: 0; font-size: 16px; text-align: center; color: ${C.suave}; }

  .cp-acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  /* Sem \`nowrap\` e sem \`min-width: 0\`: num celular de 360px os rótulos
     estouravam a própria borda e criavam rolagem horizontal dentro do modal. */
  .cp-btn {
    flex: 1 1 140px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 16px; font-weight: 700; line-height: 1.2; color: ${C.ink}; background: ${C.paper}; text-align: center;
    min-height: 50px; padding: 12px 14px; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.m}px; transition: background-color .15s ease, border-color .15s ease;
  }
  .cp-btn svg, .cp-abrir svg { flex: 0 0 auto; }
  .cp-btn:hover { border-color: ${C.ink}; }
  .cp-btn-principal { background: ${C.gold}; border-color: ${C.gold}; }
  .cp-btn-principal:hover { background: ${C.gold2}; border-color: ${C.gold2}; }
  .cp-btn:focus-visible, .cp-fechar:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
  .cp-dica { margin: 12px 0 2px; text-align: center; font-size: 15px; line-height: 1.5; color: ${C.suave}; }

  @keyframes cpFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cpUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @media (max-width: ${PONTOS.tablet - 1}px) {
    .cp-overlay { place-items: end center; padding: 0; }
    .cp-modal { width: 100%; border-radius: ${RAIO.xg}px ${RAIO.xg}px 0 0; padding-bottom: max(20px, env(safe-area-inset-bottom)); }
  }
  @media (prefers-reduced-motion: reduce) {
    .cp-overlay, .cp-modal { animation: none; }
    .cp-abrir, .cp-btn, .cp-formato { transition: none !important; }
  }
`;

export default CompartilharClient;
