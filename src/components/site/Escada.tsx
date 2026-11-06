import React from "react";
import { C, PONTOS, borda } from "@/lib/theme";

/**
 * A ESCADA — passos em sequência, deitados no computador e em pé no celular.
 *
 * Serve para o que tem ordem: de Interessado a Multiplicador, da ideia ao grupo
 * permanente. O último passo leva o ouro: é para onde a escada aponta.
 */
export function Escada({ passos }: { passos: { nome: string; resumo?: string }[] }) {
  return (
    <ol className="ec" style={{ ["--n" as string]: passos.length } as React.CSSProperties}>
      {passos.map((p, i) => (
        <li key={p.nome} className="ec-passo">
          <span className="ec-num" aria-hidden="true">{i + 1}</span>
          <div>
            <strong>{p.nome}</strong>
            {p.resumo && <span>{p.resumo}</span>}
          </div>
        </li>
      ))}
      <style>{`
        .ec { list-style: none; margin: 0; padding: 0; display: grid; }
        .ec-passo { position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px; padding-bottom: 22px; }
        .ec-passo:last-of-type { padding-bottom: 0; }
        .ec-passo:not(:last-of-type)::before { content: ""; position: absolute; left: 21px; top: 44px; bottom: 0; width: 2px; background: ${C.linha}; }
        .ec-num { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: ${C.paper}; border: ${borda(C.linhaForte)}; font-size: 17px; font-weight: 800; }
        .ec-passo:last-of-type .ec-num { background: ${C.gold}; border-color: ${C.gold}; }
        .ec-passo div { display: flex; flex-direction: column; gap: 3px; min-height: 44px; justify-content: center; }
        .ec-passo strong { font-size: 19px; line-height: 1.3; font-weight: 800; }
        .ec-passo span:not(.ec-num) { font-size: 16px; line-height: 1.45; color: ${C.suave}; }
        @media (min-width: ${PONTOS.computador}px) {
          .ec { grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 20px; }
          .ec-passo { grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 0; }
          .ec-passo:not(:last-of-type)::before { left: 44px; right: -20px; top: 21px; bottom: auto; width: auto; height: 2px; }
          .ec-passo div { min-height: 0; justify-content: flex-start; }
        }
      `}</style>
    </ol>
  );
}
