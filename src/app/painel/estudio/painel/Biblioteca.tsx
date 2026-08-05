"use client";

/**
 * Biblioteca local de imagens.
 *
 * O recorte de uma pessoa é trabalhoso de conseguir, então ele fica guardado
 * aqui (IndexedDB, no próprio navegador) e é reaproveitado em toda arte nova
 * sem precisar subir de novo.
 */
import { useEffect, useRef, useState } from "react";
import { apagarAtivo, esquecerAtivo, listarAtivos, prepararAtivo, salvarAtivo, urlDoAtivo } from "../armazenamento";
import { novoId, type Ativo } from "../tipos";
import Recorte from "./Recorte";

interface Props {
  /** quando aberta para escolher a imagem de uma camada */
  familia: Ativo["familia"];
  onEscolher: (ativoId: string) => void;
  onFechar: () => void;
}

export default function Biblioteca({ familia, onEscolher, onFechar }: Props) {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [recortando, setRecortando] = useState<Ativo | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const recarregar = async () => {
    const lista = await listarAtivos();
    setAtivos(lista);
    setCarregando(false);
    const mapa: Record<string, string> = {};
    await Promise.all(
      lista.map(async (a) => {
        const url = await urlDoAtivo(a.id);
        if (url) mapa[a.id] = url;
      }),
    );
    setUrls(mapa);
  };

  useEffect(() => {
    void recarregar();
  }, []);

  const subir = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setErro("");
    try {
      for (const arquivo of Array.from(arquivos)) {
        const ativo = await prepararAtivo(arquivo, familia, novoId());
        await salvarAtivo(ativo);
      }
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui subir a imagem.");
    }
  };

  const excluir = async (id: string) => {
    await apagarAtivo(id);
    esquecerAtivo(id);
    await recarregar();
  };

  const daFamilia = ativos.filter((a) => a.familia === familia);
  const resto = ativos.filter((a) => a.familia !== familia);

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
            <h2 className="text-sm font-semibold text-white">Biblioteca de imagens</h2>
            <p className="mt-0.5 text-xs text-white/40">
              {familia === "pessoa"
                ? "Suba o PNG já sem fundo — ele fica guardado para as próximas artes."
                : "Fotos de contexto e fundos."}
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
            onClick={() => entrada.current?.click()}
            className="rounded-md bg-[#FFCB05] px-4 py-2 text-sm font-semibold text-[#14110C] transition hover:bg-[#ffd63a]"
          >
            Subir imagem
          </button>
          <input
            ref={entrada}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(e) => {
              void subir(e.target.files);
              e.target.value = "";
            }}
          />
          {erro && <span className="text-xs text-red-400">{erro}</span>}
        </div>

        <div
          className="flex-1 overflow-y-auto p-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void subir(e.dataTransfer.files);
          }}
        >
          {carregando ? (
            <p className="py-10 text-center text-sm text-white/35">Abrindo a biblioteca…</p>
          ) : ativos.length === 0 ? (
            <p className="py-10 text-center text-sm leading-relaxed text-white/35">
              Nada guardado ainda.
              <br />
              Arraste imagens para cá ou use o botão acima.
            </p>
          ) : (
            <>
              <Grade
                ativos={daFamilia}
                urls={urls}
                onEscolher={onEscolher}
                onExcluir={excluir}
                onRecortar={setRecortando}
              />
              {resto.length > 0 && (
                <>
                  <h3 className="mb-2 mt-6 text-[11px] uppercase tracking-[.14em] text-white/30">
                    Outras imagens
                  </h3>
                  <Grade
                    ativos={resto}
                    urls={urls}
                    onEscolher={onEscolher}
                    onExcluir={excluir}
                    onRecortar={setRecortando}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {recortando && (
        <Recorte
          ativo={recortando}
          onFechar={() => setRecortando(null)}
          onPronto={(novo) => {
            setRecortando(null);
            onEscolher(novo);
          }}
        />
      )}
    </div>
  );
}

function Grade({
  ativos,
  urls,
  onEscolher,
  onExcluir,
  onRecortar,
}: {
  ativos: Ativo[];
  urls: Record<string, string>;
  onEscolher: (id: string) => void;
  onExcluir: (id: string) => void;
  onRecortar: (ativo: Ativo) => void;
}) {
  if (!ativos.length) return null;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
      {ativos.map((a) => (
        <li key={a.id} className="group relative">
          <button
            type="button"
            onClick={() => onEscolher(a.id)}
            className="block w-full overflow-hidden rounded-lg border border-white/12 bg-[repeating-conic-gradient(#222_0_25%,#2c2c2c_0_50%)] bg-[length:16px_16px] transition hover:border-[#FFCB05]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[a.id]}
              alt={a.nome}
              className="h-28 w-full object-contain"
              loading="lazy"
            />
            <span className="block truncate px-2 py-1.5 text-left text-[11px] text-white/55">
              {a.nome}
            </span>
          </button>
          <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              title="Remover o fundo desta imagem"
              aria-label={`Remover o fundo de ${a.nome}`}
              onClick={() => onRecortar(a)}
              className="grid h-6 w-6 place-items-center rounded bg-black/70 text-xs text-white/70 transition hover:bg-[#FFCB05] hover:text-[#14110C]"
            >
              ✂
            </button>
            <button
              type="button"
              title="Apagar da biblioteca"
              aria-label={`Apagar ${a.nome}`}
              onClick={() => onExcluir(a.id)}
              className="grid h-6 w-6 place-items-center rounded bg-black/70 text-xs text-white/70 transition hover:bg-red-600 hover:text-white"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
