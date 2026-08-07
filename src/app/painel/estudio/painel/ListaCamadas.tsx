"use client";

/** Pilha de camadas — a de cima na lista é a que fica na frente na arte. */
import { useEffect, useState } from "react";
import { urlDoAtivo } from "../armazenamento";
import { ROTULO_TIPO, temImagem, type Camada, type TipoCamada } from "../tipos";
import { useDica } from "./Dica";

interface Props {
  camadas: Camada[];
  selecionados: string[];
  /** medidas da arte, para avisar quem saiu do quadro */
  formato: { largura: number; altura: number };
  onSelecionar: (id: string, juntar?: boolean) => void;
  onAlterar: (id: string, m: Partial<Camada>) => void;
  onMover: (id: string, destino: number) => void;
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
  onAdicionar: (tipo: TipoCamada) => void;
}

const ICONE: Record<TipoCamada, string> = {
  fundo: "▦",
  padrao: "◤",
  foto: "▧",
  pessoa: "☻",
  sombreado: "◑",
  textura: "░",
  texto: "T",
  moldura: "◻",
  avatar: "◉",
};

const TIPOS_NOVOS: TipoCamada[] = [
  "texto",
  "pessoa",
  "foto",
  "sombreado",
  "padrao",
  "textura",
  "moldura",
  "avatar",
];

/** A camada está inteiramente fora da arte? */
function foraDoQuadro(c: Camada, f: { largura: number; altura: number }): boolean {
  if (!("largura" in c)) return false;
  const meiaL = c.largura / 2;
  const meiaA = "altura" in c ? (c as { altura: number }).altura / 2 : 0;
  return (
    c.x + meiaL < 0 || c.x - meiaL > f.largura || c.y + meiaA < 0 || c.y - meiaA > f.altura
  );
}

export default function ListaCamadas({
  camadas,
  selecionados,
  formato,
  onSelecionar,
  onAlterar,
  onMover,
  onDuplicar,
  onExcluir,
  onAdicionar,
}: Props) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  /** índice do array `camadas` onde a camada arrastada vai cair */
  const [destino, setDestino] = useState<number | null>(null);
  const [renomeando, setRenomeando] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  // a lista mostra de cima para baixo o que está da frente para trás
  const visiveis = [...camadas].reverse();

  const largar = () => {
    if (arrastando && destino !== null) onMover(arrastando, destino);
    setArrastando(null);
    setDestino(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/40">
          Camadas
        </h2>
        <span className="text-[11px] text-white/25">
          {selecionados.length > 1 ? `${selecionados.length} de ${camadas.length}` : camadas.length}
        </span>
      </div>

      <ul
        className="flex-1 overflow-y-auto px-2 pb-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={largar}
      >
        {visiveis.map((c, posicao) => {
          const indice = camadas.indexOf(c);
          const ativa = selecionados.includes(c.id);
          const fora = foraDoQuadro(c, formato);
          // a linha de destino aparece acima do item quando é ali que vai cair
          const marcaAcima = destino !== null && destino === indice + (arrastando === c.id ? 0 : 1);

          return (
            <li
              key={c.id}
              draggable={renomeando !== c.id}
              onDragStart={() => setArrastando(c.id)}
              onDragEnd={() => {
                setArrastando(null);
                setDestino(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!arrastando || arrastando === c.id) return;
                // metade de cima do item = cai na frente dele (índice maior)
                const caixa = e.currentTarget.getBoundingClientRect();
                const emCima = e.clientY < caixa.top + caixa.height / 2;
                setDestino(emCima ? indice + 1 : indice);
              }}
              className={`group relative mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                ativa
                  ? "bg-[#FFCB05]/15 text-white ring-1 ring-[#FFCB05]/50"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              } ${arrastando === c.id ? "opacity-40" : ""} ${c.visivel ? "" : "opacity-45"}`}
            >
              {marcaAcima && (
                <span className="pointer-events-none absolute inset-x-1 -top-0.5 h-0.5 rounded-full bg-[#FFCB05]" />
              )}
              {posicao === visiveis.length - 1 && destino === 0 && arrastando !== c.id && (
                <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-[#FFCB05]" />
              )}

              <span
                className="cursor-grab select-none text-white/25"
                title="Arraste para reordenar"
              >
                ⠿
              </span>

              <Miniatura camada={c} />

              {renomeando === c.id ? (
                <input
                  autoFocus
                  defaultValue={c.nome}
                  onBlur={(e) => {
                    onAlterar(c.id, { nome: e.target.value.trim() || c.nome });
                    setRenomeando(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setRenomeando(null);
                  }}
                  className="min-w-0 flex-1 rounded border border-[#FFCB05]/60 bg-black/50 px-1.5 py-0.5 text-sm text-white outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => onSelecionar(c.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => setRenomeando(c.id)}
                  title="Duplo clique renomeia"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{c.nome}</span>
                    <span className="block truncate text-[10px] uppercase tracking-wider text-white/25">
                      {ROTULO_TIPO[c.tipo]}
                      {fora && <span className="ml-1 text-amber-400">· fora do quadro</span>}
                    </span>
                  </span>
                </button>
              )}

              {/* escondida ou travada é estado, não hover: fica sempre à vista */}
              <div className="flex shrink-0 items-center gap-0.5">
                <Acao
                  titulo={c.visivel ? "Esconder" : "Mostrar"}
                  onClick={() => onAlterar(c.id, { visivel: !c.visivel })}
                  ativa={!c.visivel}
                  sempre={!c.visivel}
                >
                  {c.visivel ? "👁" : "⃠"}
                </Acao>
                <Acao
                  titulo={c.travada ? "Destravar" : "Travar"}
                  onClick={() => onAlterar(c.id, { travada: !c.travada })}
                  ativa={c.travada}
                  sempre={c.travada}
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

/**
 * O retrato da camada na lista.
 *
 * Sem isto, "Pessoa 1", "Pessoa 2" e "Fantasma esquerda" são três linhas de
 * texto idênticas — descobrir qual é qual custava clicar em cada uma.
 */
function Miniatura({ camada }: { camada: Camada }) {
  const [url, setUrl] = useState<string | null>(null);
  const ativoId = temImagem(camada) ? camada.ativoId : "";

  useEffect(() => {
    let vivo = true;
    if (!ativoId) {
      setUrl(null);
      return;
    }
    void urlDoAtivo(ativoId).then((u) => vivo && setUrl(u));
    return () => {
      vivo = false;
    };
  }, [ativoId]);

  const caixa =
    "grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded border border-white/12 bg-black/40 text-[13px] text-[#FFCB05]/70";

  if (url) {
    return (
      <span className={`${caixa} bg-[repeating-conic-gradient(#222_0_25%,#2c2c2c_0_50%)] bg-[length:8px_8px]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }

  if (camada.tipo === "fundo") {
    return (
      <span
        className={caixa}
        style={{
          background:
            camada.modo === "gradiente"
              ? `linear-gradient(${180 - camada.angulo}deg, ${camada.cor}, ${camada.cor2})`
              : camada.cor,
        }}
      />
    );
  }

  if (camada.tipo === "texto") {
    return (
      <span className={caixa} style={{ color: camada.cor }} title={camada.texto}>
        <span className="truncate px-0.5 text-[9px] font-bold uppercase leading-none">
          {camada.texto.replace(/[*=]/g, "").trim().slice(0, 3) || "T"}
        </span>
      </span>
    );
  }

  if (
    camada.tipo === "moldura" ||
    camada.tipo === "sombreado" ||
    camada.tipo === "padrao" ||
    camada.tipo === "textura"
  ) {
    return <span className={caixa} style={{ color: camada.cor }}>{ICONE[camada.tipo]}</span>;
  }

  return <span className={caixa}>{ICONE[camada.tipo]}</span>;
}

function Acao({
  children,
  titulo,
  onClick,
  ativa,
  sempre,
}: {
  children: React.ReactNode;
  titulo: string;
  onClick: () => void;
  ativa?: boolean;
  /** fica visível sem hover — para o dedo no celular e para ler o estado de relance */
  sempre?: boolean;
}) {
  const { props, balao } = useDica(titulo);
  return (
    <>
      <button
        type="button"
        {...props}
        aria-label={titulo}
        onClick={onClick}
        className={`grid h-6 w-6 place-items-center rounded text-[11px] transition hover:bg-white/15 ${
          ativa ? "text-[#FFCB05]" : "text-white/45"
        } ${sempre ? "" : "opacity-0 group-hover:opacity-100 focus:opacity-100 max-lg:opacity-100"}`}
      >
        {children}
      </button>
      {balao}
    </>
  );
}
