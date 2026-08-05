"use client";

/** Pilha de camadas — a de cima na lista é a que fica na frente na arte. */
import { useState } from "react";
import { ROTULO_TIPO, type Camada, type TipoCamada } from "../tipos";

interface Props {
  camadas: Camada[];
  selecionado: string | null;
  onSelecionar: (id: string) => void;
  onAlterar: (id: string, m: Partial<Camada>) => void;
  onMover: (id: string, destino: number) => void;
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
  onAdicionar: (tipo: TipoCamada) => void;
}

const ICONE: Record<TipoCamada, string> = {
  fundo: "▦",
  foto: "▧",
  pessoa: "☻",
  sombreado: "◑",
  texto: "T",
  moldura: "◻",
  avatar: "◉",
};

const TIPOS_NOVOS: TipoCamada[] = ["texto", "pessoa", "foto", "sombreado", "moldura", "avatar"];

export default function ListaCamadas({
  camadas,
  selecionado,
  onSelecionar,
  onAlterar,
  onMover,
  onDuplicar,
  onExcluir,
  onAdicionar,
}: Props) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  // a lista mostra de cima para baixo o que está da frente para trás
  const visiveis = [...camadas].reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/40">
          Camadas
        </h2>
        <span className="text-[11px] text-white/25">{camadas.length}</span>
      </div>

      <ul className="flex-1 overflow-y-auto px-2">
        {visiveis.map((c) => {
          const indice = camadas.indexOf(c);
          const ativa = c.id === selecionado;
          return (
            <li
              key={c.id}
              draggable
              onDragStart={() => setArrastando(c.id)}
              onDragEnd={() => setArrastando(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (arrastando && arrastando !== c.id) onMover(arrastando, indice);
                setArrastando(null);
              }}
              className={`group mb-1 flex items-center gap-2 rounded-md px-2 py-2 text-sm transition ${
                ativa
                  ? "bg-[#FFCB05]/15 text-white ring-1 ring-[#FFCB05]/50"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              } ${arrastando === c.id ? "opacity-40" : ""}`}
            >
              <span className="cursor-grab select-none text-white/25" title="Arraste para reordenar">
                ⠿
              </span>
              <button
                type="button"
                onClick={() => onSelecionar(c.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="w-4 shrink-0 text-center text-[13px] text-[#FFCB05]/70">
                  {ICONE[c.tipo]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{c.nome}</span>
                  <span className="block truncate text-[10px] uppercase tracking-wider text-white/25">
                    {ROTULO_TIPO[c.tipo]}
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <Acao
                  titulo={c.visivel ? "Esconder" : "Mostrar"}
                  onClick={() => onAlterar(c.id, { visivel: !c.visivel })}
                  ativa={!c.visivel}
                >
                  {c.visivel ? "👁" : "⃠"}
                </Acao>
                <Acao
                  titulo={c.travada ? "Destravar" : "Travar"}
                  onClick={() => onAlterar(c.id, { travada: !c.travada })}
                  ativa={c.travada}
                >
                  {c.travada ? "🔒" : "🔓"}
                </Acao>
                {c.tipo !== "fundo" && (
                  <>
                    <Acao titulo="Duplicar" onClick={() => onDuplicar(c.id)}>
                      ⧉
                    </Acao>
                    <Acao titulo="Excluir" onClick={() => onExcluir(c.id)}>
                      ✕
                    </Acao>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="relative border-t border-white/10 p-3">
        {menuAberto && (
          <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-md border border-white/12 bg-[#14110C] shadow-xl">
            {TIPOS_NOVOS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onAdicionar(t);
                  setMenuAberto(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/70 transition hover:bg-[#FFCB05]/15 hover:text-white"
              >
                <span className="w-4 text-center text-[#FFCB05]/70">{ICONE[t]}</span>
                {ROTULO_TIPO[t]}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          className="w-full rounded-md border border-dashed border-white/20 px-3 py-2 text-sm text-white/55 transition hover:border-[#FFCB05]/60 hover:text-[#FFCB05]"
        >
          + Adicionar camada
        </button>
      </div>
    </div>
  );
}

function Acao({
  children,
  titulo,
  onClick,
  ativa,
}: {
  children: React.ReactNode;
  titulo: string;
  onClick: () => void;
  ativa?: boolean;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className={`grid h-6 w-6 place-items-center rounded text-[11px] transition hover:bg-white/15 ${
        ativa ? "text-[#FFCB05]" : "text-white/45"
      }`}
    >
      {children}
    </button>
  );
}
