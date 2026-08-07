"use client";

/**
 * A explicação que aparece quando a mão para em cima de um controle.
 *
 * O estúdio tem muito botão de nome curto — "Dureza", "Semente", "Chanfro" — e
 * quem não montou a arte antes não tem como adivinhar. O `title` do navegador
 * não serve: ele é lento, some sozinho, não quebra linha e não dá para
 * estilizar. Aqui a espera é nossa (3 s, o bastante para não atrapalhar quem já
 * sabe onde está indo) e o balão sai num portal, para não ser cortado pela
 * coluna do inspetor, que rola.
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { DICAS } from "./dicas";

/** Quanto tempo a mão fica parada antes de o balão abrir. */
const ESPERA = 3000;
const MARGEM = 8;

interface Retorno {
  /** para espalhar no elemento que representa o controle */
  props: Record<string, unknown>;
  /** o balão, que quem chama renderiza junto */
  balao: ReactNode;
}

/**
 * `texto` explícito ganha de tudo. Sem ele, o `rotulo` é procurado no
 * dicionário — é o que dá cobertura ao inspetor inteiro sem ter de escrever
 * `dica=` em cada um dos cem campos.
 */
export function useDica(texto?: string, rotulo?: string): Retorno {
  const relogio = useRef<number | null>(null);
  const [caixa, setCaixa] = useState<DOMRect | null>(null);
  const id = useId();

  const parar = useCallback(() => {
    if (relogio.current !== null) window.clearTimeout(relogio.current);
    relogio.current = null;
  }, []);

  const fechar = useCallback(() => {
    parar();
    setCaixa(null);
  }, [parar]);

  useEffect(() => parar, [parar]);

  useEffect(() => {
    if (!caixa) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", aoTeclar);
    /* rolar a coluna leva o controle embora: em vez de perseguir a posição
       (que faria o balão dançar), ele simplesmente fecha */
    window.addEventListener("scroll", fechar, true);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("scroll", fechar, true);
    };
  }, [caixa, fechar]);

  const conteudo = texto ?? (rotulo ? DICAS[rotulo] : undefined);
  if (!conteudo) return { props: {}, balao: null };

  const comecar = (e: { currentTarget: EventTarget & Element }) => {
    const no = e.currentTarget;
    parar();
    relogio.current = window.setTimeout(() => setCaixa(no.getBoundingClientRect()), ESPERA);
  };

  return {
    props: {
      onMouseEnter: comecar,
      onMouseLeave: fechar,
      // quem já clicou não precisa mais da explicação
      onMouseDown: fechar,
      onTouchStart: comecar,
      onTouchEnd: fechar,
      "aria-describedby": caixa ? id : undefined,
    },
    balao: caixa ? <Balao id={id} texto={conteudo} caixa={caixa} /> : null,
  };
}

/**
 * Sai no `document.body` e se posiciona a partir da caixa do controle.
 *
 * Ele nasce escondido fora da tela e só aparece depois de medido: sem isso, o
 * primeiro quadro mostraria o balão no canto e ele pularia para o lugar certo.
 */
function Balao({ id, texto, caixa }: { id: string; texto: string; caixa: DOMRect }) {
  const [no, setNo] = useState<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!no) return;
    const r = no.getBoundingClientRect();

    // abre por baixo do controle; se não couber na janela, sobe para cima dele
    let top = caixa.bottom + MARGEM;
    if (top + r.height > window.innerHeight - MARGEM) {
      top = Math.max(MARGEM, caixa.top - r.height - MARGEM);
    }

    // alinhado pela esquerda do controle, sem passar da borda da janela
    const left = Math.max(
      MARGEM,
      Math.min(caixa.left, window.innerWidth - r.width - MARGEM),
    );

    setPos({ left, top });
  }, [no, caixa]);

  return createPortal(
    <div
      ref={setNo}
      id={id}
      role="tooltip"
      style={{
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? "visible" : "hidden",
      }}
      className="pointer-events-none fixed z-[60] max-w-[17rem] rounded-md border border-[#FFCB05]/35 bg-[#1B1710] px-3 py-2 text-[11px] leading-relaxed text-white/85 shadow-xl"
    >
      {texto}
    </div>,
    document.body,
  );
}
