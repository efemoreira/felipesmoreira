"use client";

import { useEffect, useState } from "react";
import estilos from "./Apresentacao.module.css";

/**
 * O controle de quem apresenta: setas, espaço e PageUp/PageDown andam um slide
 * (cada slide é uma seção encaixada), F liga a tela cheia e o contador diz onde
 * a fala está. Porte do `PitchNav` do Guardião Predial.
 */
export function NavegacaoPitch() {
  const [atual, setAtual] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    setTotal(slides.length);
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtual(slides.indexOf(e.target as HTMLElement));
      },
      { threshold: 0.6 },
    );
    slides.forEach((s) => observador.observe(s));

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "f" || e.key === "F") alternarTelaCheia();
      const frente = ["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key);
      const tras = ["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key);
      if (!frente && !tras) return;
      e.preventDefault();
      ir(e.shiftKey && e.key === " " ? -1 : frente ? 1 : -1);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      observador.disconnect();
      window.removeEventListener("keydown", aoTeclar);
    };
  }, []);

  return (
    <nav aria-label="Navegação da apresentação" className={estilos.navegacao}>
      <button type="button" aria-label="Slide anterior" onClick={() => ir(-1)}>
        <Seta para="cima" />
      </button>
      <span title="Use as setas ou a barra de espaço">{total ? `${atual + 1} de ${total}` : ""}</span>
      <button type="button" aria-label="Próximo slide" onClick={() => ir(1)}>
        <Seta para="baixo" />
      </button>
      <button type="button" aria-label="Tela cheia" onClick={alternarTelaCheia}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </button>
    </nav>
  );
}

function Seta({ para }: { para: "cima" | "baixo" }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={para === "cima" ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

function ir(passo: number) {
  const slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
  const meio = window.innerHeight / 2;
  const indice = slides.findIndex((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= meio && r.bottom > meio;
  });
  slides[Math.min(slides.length - 1, Math.max(0, indice + passo))]?.scrollIntoView({ behavior: "smooth" });
}

function alternarTelaCheia() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
}
