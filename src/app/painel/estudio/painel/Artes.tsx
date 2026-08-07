"use client";

/**
 * As artes salvas neste navegador.
 *
 * Antes disto o estúdio guardava tudo no IndexedDB mas só sabia reabrir a última
 * arte mexida: começar uma nova significava desmontar a anterior por cima, e a
 * antiga ficava presa no banco sem porta de entrada. Aqui elas voltam a existir —
 * abrir, duplicar, renomear e apagar.
 *
 * Sem miniatura de propósito: gerar um PNG a cada gravação automática custaria
 * mais que o tanto que uma imagenzinha ajuda a reconhecer a arte. Nome, formato
 * e data bastam.
 */
import { useEffect, useState } from "react";
import { apagarProjeto, listarProjetos, salvarProjeto } from "../armazenamento";
import { FORMATOS, dimensoes, novoId, type Formato, type Projeto } from "../tipos";

interface Props {
  /** a arte aberta agora — marcada na lista e nunca apagável sem aviso */
  atual: Projeto;
  onAbrir: (projeto: Projeto) => void;
  onNova: () => void;
  onFechar: () => void;
}

const quando = (ms: number) => {
  const d = new Date(ms);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? `hoje, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
};

const rotuloFormato = (p: Projeto) => {
  const { largura, altura } = dimensoes(p);
  const nome = FORMATOS[p.formato]?.rotulo ?? (p.formato as Formato);
  return `${nome} · ${largura}×${altura}`;
};

export default function Artes({ atual, onAbrir, onNova, onFechar }: Props) {
  const [artes, setArtes] = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const recarregar = async () => {
    setArtes(await listarProjetos());
    setCarregando(false);
  };

  useEffect(() => {
    void recarregar();
    // a lista se refaz sempre que a modal abre; enquanto ela está aberta, o
    // salvamento automático da arte atual não muda o que interessa aqui
  }, []);

  const duplicar = async (p: Projeto) => {
    await salvarProjeto({
      ...p,
      id: novoId(),
      nome: `${p.nome} (cópia)`,
      atualizadoEm: Date.now(),
    });
    await recarregar();
  };

  const renomear = async (p: Projeto, nome: string) => {
    const limpo = nome.trim().slice(0, 40);
    if (!limpo || limpo === p.nome) return;
    await salvarProjeto({ ...p, nome: limpo, atualizadoEm: Date.now() });
    await recarregar();
  };

  const apagar = async (id: string) => {
    await apagarProjeto(id);
    setConfirmando(null);
    await recarregar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/12 bg-[#14110C] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Minhas artes</h2>
            <p className="mt-0.5 text-xs text-white/40">
              Guardadas neste navegador. Nada sobe para o servidor.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="grid h-8 w-8 place-items-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onNova}
            className="rounded-md bg-[#FFCB05] px-4 py-2 text-sm font-semibold text-[#14110C] transition hover:bg-[#ffd63a]"
          >
            + Nova arte
          </button>
          <span className="text-xs text-white/35">
            Começa em branco, no formato de agora. A arte aberta continua salva.
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {carregando ? (
            <p className="py-10 text-center text-sm text-white/35">Abrindo as artes…</p>
          ) : artes.length === 0 ? (
            <p className="py-10 text-center text-sm leading-relaxed text-white/35">
              Nenhuma arte guardada ainda.
              <br />
              A que você está montando aparece aqui assim que for salva.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {artes.map((p) => {
                const aberta = p.id === atual.id;
                return (
                  <li
                    key={p.id}
                    className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                      aberta
                        ? "border-[#FFCB05]/60 bg-[#FFCB05]/5"
                        : "border-white/12 hover:border-white/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !aberta && onAbrir(p)}
                      disabled={aberta}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-white">{p.nome}</span>
                        {aberta && (
                          <span className="shrink-0 rounded bg-[#FFCB05] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#14110C]">
                            aberta
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-white/40">
                        {rotuloFormato(p)} · {p.camadas.length} camadas · {quando(p.atualizadoEm)}
                      </span>
                    </button>

                    {confirmando === p.id ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[11px] text-white/50">Apagar?</span>
                        <button
                          type="button"
                          onClick={() => void apagar(p.id)}
                          className="rounded border border-red-400/50 px-2 py-1 text-[11px] text-red-200 transition hover:bg-red-500/20"
                        >
                          Apagar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmando(null)}
                          className="rounded border border-white/15 px-2 py-1 text-[11px] text-white/60 transition hover:text-white"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-1 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                        <Acao
                          rotulo={`Renomear ${p.nome}`}
                          onClick={() => {
                            const novo = window.prompt("Novo nome da arte:", p.nome);
                            if (novo !== null) void renomear(p, novo);
                          }}
                        >
                          ✎
                        </Acao>
                        <Acao rotulo={`Duplicar ${p.nome}`} onClick={() => void duplicar(p)}>
                          ⧉
                        </Acao>
                        <Acao
                          rotulo={`Apagar ${p.nome}`}
                          risco
                          onClick={() => setConfirmando(p.id)}
                        >
                          ✕
                        </Acao>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Acao({
  children,
  rotulo,
  onClick,
  risco,
}: {
  children: React.ReactNode;
  rotulo: string;
  onClick: () => void;
  risco?: boolean;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded text-xs text-white/60 transition ${
        risco ? "hover:bg-red-600 hover:text-white" : "hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
