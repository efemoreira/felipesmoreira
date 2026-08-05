"use client";

/** Peças de formulário do inspetor — mesma cara em todas as camadas. */
import { useId, type ReactNode } from "react";
import { ATALHOS_COR } from "../paleta";

export function Secao({
  titulo,
  children,
  aberta = true,
}: {
  titulo: string;
  children: ReactNode;
  aberta?: boolean;
}) {
  return (
    <details open={aberta} className="border-b border-white/10 last:border-0">
      <summary className="cursor-pointer list-none px-4 py-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[#FFCB05]/80 hover:text-[#FFCB05] [&::-webkit-details-marker]:hidden">
        {titulo}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
    </details>
  );
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-white/45">{rotulo}</span>
      {children}
    </label>
  );
}

const entradaCss =
  "w-full rounded-md border border-white/12 bg-black/40 px-2.5 py-1.5 text-sm text-white outline-none transition focus:border-[#FFCB05]/70 focus:ring-1 focus:ring-[#FFCB05]/30";

export function Deslizante({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  sufixo,
  onMudar,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  sufixo?: string;
  onMudar: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-white/45">{rotulo}</span>
        <span className="font-mono text-[11px] text-white/70">
          {Number.isInteger(passo) ? Math.round(valor) : valor.toFixed(2)}
          {sufixo}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => onMudar(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#FFCB05]"
      />
    </div>
  );
}

export function Numero({
  rotulo,
  valor,
  passo = 1,
  onMudar,
}: {
  rotulo: string;
  valor: number;
  passo?: number;
  onMudar: (v: number) => void;
}) {
  return (
    <Campo rotulo={rotulo}>
      <input
        type="number"
        step={passo}
        value={Math.round(valor)}
        onChange={(e) => onMudar(Number(e.target.value))}
        className={entradaCss}
      />
    </Campo>
  );
}

export function Texto({
  rotulo,
  valor,
  onMudar,
}: {
  rotulo: string;
  valor: string;
  onMudar: (v: string) => void;
}) {
  return (
    <Campo rotulo={rotulo}>
      <input type="text" value={valor} onChange={(e) => onMudar(e.target.value)} className={entradaCss} />
    </Campo>
  );
}

export function AreaTexto({
  rotulo,
  valor,
  dica,
  onMudar,
}: {
  rotulo: string;
  valor: string;
  dica?: string;
  onMudar: (v: string) => void;
}) {
  return (
    <Campo rotulo={rotulo}>
      <textarea
        rows={4}
        value={valor}
        onChange={(e) => onMudar(e.target.value)}
        className={`${entradaCss} resize-y font-mono text-[13px] leading-relaxed`}
      />
      {dica && <span className="text-[11px] leading-snug text-white/35">{dica}</span>}
    </Campo>
  );
}

export function Escolha<T extends string>({
  rotulo,
  valor,
  opcoes,
  onMudar,
}: {
  rotulo: string;
  valor: T;
  opcoes: { valor: T; rotulo: string }[];
  onMudar: (v: T) => void;
}) {
  return (
    <Campo rotulo={rotulo}>
      <select
        value={valor}
        onChange={(e) => onMudar(e.target.value as T)}
        className={entradaCss}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor} className="bg-[#14110C]">
            {o.rotulo}
          </option>
        ))}
      </select>
    </Campo>
  );
}

export function Botoes<T extends string>({
  rotulo,
  valor,
  opcoes,
  onMudar,
}: {
  rotulo: string;
  valor: T;
  opcoes: { valor: T; rotulo: string }[];
  onMudar: (v: T) => void;
}) {
  return (
    <Campo rotulo={rotulo}>
      <div className="flex gap-1 rounded-md bg-black/40 p-1">
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => onMudar(o.valor)}
            className={`flex-1 rounded px-2 py-1 text-xs transition ${
              valor === o.valor
                ? "bg-[#FFCB05] font-semibold text-[#14110C]"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
    </Campo>
  );
}

export function Chave({
  rotulo,
  ligada,
  onMudar,
}: {
  rotulo: string;
  ligada: boolean;
  onMudar: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-0.5">
      <span className="text-[11px] uppercase tracking-wider text-white/45">{rotulo}</span>
      <button
        type="button"
        role="switch"
        aria-checked={ligada}
        aria-label={rotulo}
        onClick={() => onMudar(!ligada)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          ligada ? "bg-[#FFCB05]" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#14110C] transition-all ${
            ligada ? "left-4.5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function Cor({
  rotulo,
  valor,
  onMudar,
}: {
  rotulo: string;
  valor: string;
  onMudar: (v: string) => void;
}) {
  const id = useId();
  // o input nativo só entende #rrggbb; rgba() cai no preto do seletor mas
  // continua valendo no desenho até alguém escolher outra cor
  const hex = /^#[0-9a-f]{6}$/i.test(valor) ? valor : "#000000";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-white/45">{rotulo}</span>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={hex}
          onChange={(e) => onMudar(e.target.value)}
          className="h-8 w-9 shrink-0 cursor-pointer rounded border border-white/15 bg-transparent"
        />
        <div className="flex flex-wrap gap-1">
          {ATALHOS_COR.map((a) => (
            <button
              key={a.cor}
              type="button"
              title={a.nome}
              aria-label={a.nome}
              onClick={() => onMudar(a.cor)}
              style={{ background: a.cor }}
              className={`h-6 w-6 rounded border transition hover:scale-110 ${
                valor.toLowerCase() === a.cor.toLowerCase()
                  ? "border-[#FFCB05] ring-1 ring-[#FFCB05]"
                  : "border-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
