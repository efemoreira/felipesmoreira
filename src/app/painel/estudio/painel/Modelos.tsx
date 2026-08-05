"use client";

/** Escolha do modelo — troca a pilha de camadas inteira. */
import { MODELOS, type Modelo } from "../modelos";
import { FORMATOS, type Formato } from "../tipos";

interface Props {
  formato: Formato;
  onEscolher: (modelo: Modelo, formato: Formato) => void;
  onFechar: () => void;
}

export default function Modelos({ formato, onEscolher, onFechar }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/12 bg-[#14110C] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Começar de um modelo</h2>
            <p className="mt-0.5 text-xs text-white/40">
              Substitui as camadas atuais — dá para desfazer com ⌘Z.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </header>

        <ul className="grid flex-1 gap-2 overflow-y-auto p-5 sm:grid-cols-2">
          {MODELOS.map((m) => (
            <li key={m.chave}>
              <button
                type="button"
                onClick={() => onEscolher(m, formato)}
                className="h-full w-full rounded-lg border border-white/12 p-4 text-left transition hover:border-[#FFCB05] hover:bg-[#FFCB05]/10"
              >
                <span className="block text-sm font-semibold text-white">{m.nome}</span>
                <span className="mt-1 block text-xs leading-relaxed text-white/45">
                  {m.resumo}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <footer className="border-t border-white/10 px-5 py-3 text-xs text-white/35">
          Formato atual: {FORMATOS[formato].rotulo}
        </footer>
      </div>
    </div>
  );
}
