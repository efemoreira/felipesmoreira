"use client";

import { FORMATOS, type Formato } from "../tipos";

interface Props {
  nome: string;
  formato: Formato;
  zoom: number;
  podeDesfazer: boolean;
  podeRefazer: boolean;
  salvando: boolean;
  exportando: boolean;
  onNome: (v: string) => void;
  onFormato: (f: Formato) => void;
  onZoom: (z: number) => void;
  onAjustarZoom: () => void;
  onDesfazer: () => void;
  onRefazer: () => void;
  onExportar: (escala: number) => void;
  onAbrirModelos: () => void;
}

export default function BarraSuperior({
  nome,
  formato,
  zoom,
  podeDesfazer,
  podeRefazer,
  salvando,
  exportando,
  onNome,
  onFormato,
  onZoom,
  onAjustarZoom,
  onDesfazer,
  onRefazer,
  onExportar,
  onAbrirModelos,
}: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#14110C] px-4 py-2.5">
      <a
        href="/painel/"
        className="shrink-0 rounded-md px-2 py-1.5 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        ← Painel
      </a>

      <input
        value={nome}
        onChange={(e) => onNome(e.target.value)}
        aria-label="Nome da arte"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-white outline-none transition hover:border-white/12 focus:border-[#FFCB05]/60"
      />

      <span className="text-[11px] text-white/25">
        {salvando ? "salvando…" : "salvo no navegador"}
      </span>

      <button
        type="button"
        onClick={onAbrirModelos}
        className="rounded-md border border-white/12 px-3 py-1.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
      >
        Modelos
      </button>

      <select
        value={formato}
        onChange={(e) => onFormato(e.target.value as Formato)}
        aria-label="Formato da arte"
        className="rounded-md border border-white/12 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-[#FFCB05]/60"
      >
        {(Object.keys(FORMATOS) as Formato[]).map((f) => (
          <option key={f} value={f} className="bg-[#14110C]">
            {FORMATOS[f].rotulo}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1 rounded-md border border-white/12 px-1 py-0.5">
        <Botao titulo="Diminuir" onClick={() => onZoom(Math.max(0.08, zoom * 0.9))}>
          −
        </Botao>
        <button
          type="button"
          onClick={onAjustarZoom}
          title="Ajustar à janela"
          className="min-w-[3.2rem] px-1 font-mono text-xs text-white/60 transition hover:text-white"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Botao titulo="Aumentar" onClick={() => onZoom(Math.min(1.5, zoom * 1.1))}>
          +
        </Botao>
      </div>

      <div className="flex items-center gap-1">
        <Botao titulo="Desfazer (⌘Z)" onClick={onDesfazer} desabilitado={!podeDesfazer}>
          ↶
        </Botao>
        <Botao titulo="Refazer (⌘⇧Z)" onClick={onRefazer} desabilitado={!podeRefazer}>
          ↷
        </Botao>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onExportar(1)}
          disabled={exportando}
          className="rounded-md bg-[#FFCB05] px-4 py-1.5 text-sm font-semibold text-[#14110C] transition hover:bg-[#ffd63a] disabled:opacity-50"
        >
          {exportando ? "Gerando…" : "Baixar PNG"}
        </button>
        <button
          type="button"
          onClick={() => onExportar(2)}
          disabled={exportando}
          title="Baixar no dobro do tamanho"
          className="rounded-md border border-white/12 px-2 py-1.5 text-xs text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-50"
        >
          2×
        </button>
      </div>
    </header>
  );
}

function Botao({
  children,
  titulo,
  onClick,
  desabilitado,
}: {
  children: React.ReactNode;
  titulo: string;
  onClick: () => void;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={desabilitado}
      className="grid h-7 w-7 place-items-center rounded text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
