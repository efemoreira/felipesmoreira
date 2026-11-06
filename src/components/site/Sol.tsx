import React from "react";
import { C } from "@/lib/theme";

/**
 * O SOL DO SERTÃO — doze raios pontudos, a marca desenhada da página.
 *
 * Na home o disco é o emblema das onças; nas páginas internas, o ícone da
 * seção. Os raios giram devagar, e só para quem não pediu menos movimento.
 * O miolo vem por `children`, centrado.
 */
const RAIOS = Array.from({ length: 24 }, (_, i) => i);

export function Sol({ tamanho, miolo = 0.56, gira = false, children }: { tamanho: string | number; miolo?: number; gira?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: tamanho, aspectRatio: "1", flex: "0 0 auto" }}>
      <svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false" className={gira ? "s-sol-gira" : undefined} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {RAIOS.map((i) => (
          <polygon key={i} points={i % 2 === 0 ? "-5.6,-60 5.6,-60 0,-98" : "-4.4,-60 4.4,-60 0,-84"} transform={`rotate(${i * 15})`} fill={C.gold} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ width: `${miolo * 100}%`, aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center", overflow: "hidden", background: C.gold }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes sSolGira { to { transform: rotate(360deg); } }
        .s-sol-gira { animation: sSolGira 120s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .s-sol-gira { animation: none; } }
      `}</style>
    </div>
  );
}
