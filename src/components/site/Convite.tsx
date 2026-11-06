import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, PONTOS, RAIO, TITULO } from "@/lib/theme";

/**
 * O FIM DE TODA PÁGINA: A PORTA DE ENTRADA.
 *
 * É o único bloco de ouro da página, e por isso chama. A pergunta de quem leu
 * até aqui é sempre a mesma: "e agora, o que eu faço?".
 */
export function Convite({
  titulo = "Quer ajudar a construir?",
  texto = "Conte sua cidade e seus interesses. Estamos reunindo pessoas para planejar os primeiros núcleos, grupos e atividades, e a coordenação fala com você em até 72 horas.",
  acao = "Quero participar",
  href = "/queroajudar",
  agenda = true,
}: {
  titulo?: string;
  texto?: string;
  acao?: string;
  href?: string;
  agenda?: boolean;
}) {
  return (
    <section className="cv" aria-labelledby="cv-titulo">
      <div className="cv-texto">
        <h2 id="cv-titulo">{titulo}</h2>
        <p>{texto}</p>
      </div>
      <div className="cv-acoes">
        <Link href={href} prefetch={false} className="s-btn s-btn-tinta">
          {acao}
          <Icon name="chevronRight" size={18} />
        </Link>
        {agenda && (
          <Link href="/programacao" prefetch={false} className="s-btn cv-agenda">
            Ver a agenda
          </Link>
        )}
      </div>
      <style>{`
        .cv { display: grid; gap: 22px; padding: clamp(28px, 5vw, 48px); background: ${C.gold}; border-radius: ${RAIO.xg}px; color: ${C.ink}; }
        .cv h2 { margin: 0; font-family: ${FONT_ALFA}; font-weight: 400; font-size: ${TITULO.secao}; line-height: 1.12; text-wrap: balance; }
        .cv p { margin: 12px 0 0; max-width: 56ch; font-size: 18px; line-height: 1.55; text-wrap: pretty; }
        .cv-acoes { display: flex; flex-wrap: wrap; gap: 12px; }
        .cv-agenda { background: transparent; color: ${C.ink}; border-color: ${C.ink}; }
        .cv-agenda:hover { background: rgba(255,255,255,.4); }
        @media (min-width: ${PONTOS.computador}px) {
          .cv { grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 48px; }
          .cv-acoes { justify-content: flex-end; }
        }
      `}</style>
    </section>
  );
}
