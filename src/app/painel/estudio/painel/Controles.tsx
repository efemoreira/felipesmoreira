"use client";

/**
 * Peças de formulário do inspetor — mesma cara em todas as camadas.
 *
 * Todas aceitam `dica`: parar três segundos em cima abre uma explicação. Quando
 * a `dica` não é passada, o próprio rótulo é procurado no dicionário de
 * painel/dicas.ts — é assim que o inspetor inteiro fica explicado sem ter de
 * escrever `dica=` em cada um dos cem campos.
 */
import { useId, type ReactNode } from "react";
import { ATALHOS_COR } from "../paleta";
import { useDica } from "./Dica";

export function Secao({
  titulo,
  children,
  aberta = true,
  dica,
}: {
  titulo: string;
  children: ReactNode;
  aberta?: boolean;
  dica?: string;
}) {
  const { props, balao } = useDica(dica, titulo);
  return (
    <details open={aberta} className="border-b border-[color:var(--e-b1)] last:border-0">
      <summary
        {...props}
        className="cursor-pointer list-none px-4 py-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[color:var(--e-acento)] hover:text-[color:var(--e-t1)] [&::-webkit-details-marker]:hidden"
      >
        {titulo}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
      {balao}
    </details>
  );
}

export function Campo({
  rotulo,
  children,
  dica,
}: {
  rotulo: string;
  children: ReactNode;
  dica?: string;
}) {
  const { props, balao } = useDica(dica, rotulo);
  return (
    <label {...props} className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-[color:var(--e-t3)]">{rotulo}</span>
      {children}
      {balao}
    </label>
  );
}

const entradaCss =
  "w-full rounded-md border border-[color:var(--e-b1)] bg-[color:var(--e-campo)] px-2.5 py-1.5 text-sm text-[color:var(--e-t1)] outline-none transition focus:border-[#FFCB05]/70 focus:ring-1 focus:ring-[#FFCB05]/30";

export function Deslizante({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  sufixo,
  dica,
  onMudar,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  sufixo?: string;
  dica?: string;
  onMudar: (v: number) => void;
}) {
  const { props, balao } = useDica(dica, rotulo);
  return (
    <div {...props} className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--e-t3)]">{rotulo}</span>
        <span className="font-mono text-[11px] text-[color:var(--e-t2)]">
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
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--e-fill)] accent-[#FFCB05]"
      />
      {balao}
    </div>
  );
}

export function Numero({
  rotulo,
  valor,
  passo = 1,
  dica,
  onMudar,
}: {
  rotulo: string;
  valor: number;
  passo?: number;
  dica?: string;
  onMudar: (v: number) => void;
}) {
  return (
    <Campo rotulo={rotulo} dica={dica}>
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
  dica,
  onMudar,
}: {
  rotulo: string;
  valor: string;
  dica?: string;
  onMudar: (v: string) => void;
}) {
  return (
    <Campo rotulo={rotulo} dica={dica}>
      <input type="text" value={valor} onChange={(e) => onMudar(e.target.value)} className={entradaCss} />
    </Campo>
  );
}

export function AreaTexto({
  rotulo,
  valor,
  dica,
  legenda,
  onMudar,
}: {
  rotulo: string;
  valor: string;
  /** a explicação de 3 s */
  dica?: string;
  /** o texto miúdo fixo embaixo do campo — o resumo da marcação, por exemplo */
  legenda?: string;
  onMudar: (v: string) => void;
}) {
  return (
    <Campo rotulo={rotulo} dica={dica}>
      <textarea
        rows={4}
        value={valor}
        onChange={(e) => onMudar(e.target.value)}
        className={`${entradaCss} resize-y font-mono text-[13px] leading-relaxed`}
      />
      {legenda && <span className="text-[11px] leading-snug text-[color:var(--e-t4)]">{legenda}</span>}
    </Campo>
  );
}

export function Escolha<T extends string>({
  rotulo,
  valor,
  opcoes,
  dica,
  onMudar,
}: {
  rotulo: string;
  valor: T;
  opcoes: { valor: T; rotulo: string }[];
  dica?: string;
  onMudar: (v: T) => void;
}) {
  return (
    <Campo rotulo={rotulo} dica={dica}>
      <select
        value={valor}
        onChange={(e) => onMudar(e.target.value as T)}
        className={entradaCss}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor} className="bg-[color:var(--e-superficie)]">
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
  dica,
  onMudar,
}: {
  rotulo: string;
  valor: T;
  opcoes: { valor: T; rotulo: string }[];
  dica?: string;
  onMudar: (v: T) => void;
}) {
  return (
    <Campo rotulo={rotulo} dica={dica}>
      <div className="flex gap-1 rounded-md bg-[color:var(--e-campo)] p-1">
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => onMudar(o.valor)}
            className={`flex-1 rounded px-2 py-1 text-xs transition ${
              valor === o.valor
                ? "bg-[#FFCB05] font-semibold text-[color:var(--e-tinta)]"
                : "text-[color:var(--e-t2)] hover:bg-[color:var(--e-fill)] hover:text-[color:var(--e-t1)]"
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
  dica,
  onMudar,
}: {
  rotulo: string;
  ligada: boolean;
  dica?: string;
  onMudar: (v: boolean) => void;
}) {
  const { props, balao } = useDica(dica, rotulo);
  return (
    <label
      {...props}
      className="flex cursor-pointer items-center justify-between gap-3 py-0.5"
    >
      <span className="text-[11px] uppercase tracking-wider text-[color:var(--e-t3)]">{rotulo}</span>
      <button
        type="button"
        role="switch"
        aria-checked={ligada}
        aria-label={rotulo}
        onClick={() => onMudar(!ligada)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          ligada ? "bg-[#FFCB05]" : "bg-[color:var(--e-b2)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[color:var(--e-superficie)] transition-all ${
            ligada ? "left-4.5" : "left-0.5"
          }`}
        />
      </button>
      {balao}
    </label>
  );
}

/** Aviso curto dentro de uma seção, com uma saída de um clique. */
export function Aviso({
  texto,
  acao,
  onAcao,
}: {
  texto: string;
  acao?: string;
  onAcao?: () => void;
}) {
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-2 text-[11px] leading-snug text-amber-200">
      <span className="flex-1">{texto}</span>
      {acao && onAcao && (
        <button
          type="button"
          onClick={onAcao}
          className="shrink-0 rounded border border-amber-300/50 px-2 py-0.5 font-medium text-amber-100 transition hover:bg-amber-300/20"
        >
          {acao}
        </button>
      )}
    </p>
  );
}

/** Atalhos que só preenchem os campos — depois é tudo manual. */
export function Presets<T>({
  rotulo,
  opcoes,
  dica = "Preenchem os campos abaixo de uma vez. Depois é tudo ajustável na mão.",
  onAplicar,
}: {
  rotulo: string;
  opcoes: { nome: string; valor: T }[];
  dica?: string;
  onAplicar: (v: T) => void;
}) {
  return (
    <Campo rotulo={rotulo} dica={dica}>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => (
          <button
            key={o.nome}
            type="button"
            onClick={() => onAplicar(o.valor)}
            className="rounded border border-[color:var(--e-b1)] px-2 py-1 text-[11px] text-[color:var(--e-t2)] transition hover:border-[#FFCB05] hover:text-[color:var(--e-t1)]"
          >
            {o.nome}
          </button>
        ))}
      </div>
    </Campo>
  );
}

/**
 * Os quatro lados de uma imagem, com cadeado.
 *
 * Fechado, um slider move os quatro juntos (o comportamento antigo do valor
 * único); aberto, cada borda tem o seu — é o que deixa esmaecer só a base, ou só
 * o lado que encosta no texto.
 */
export function Lados({
  valores,
  ligados,
  onLigados,
  onMudar,
  max = 1,
  passo = 0.02,
}: {
  valores: { topo: number; direita: number; base: number; esquerda: number };
  ligados: boolean;
  onLigados: (v: boolean) => void;
  onMudar: (m: Partial<typeof valores>) => void;
  max?: number;
  passo?: number;
}) {
  const todos = (v: number) => onMudar({ topo: v, direita: v, base: v, esquerda: v });
  const { props, balao } = useDica(undefined, "Lados");

  return (
    <div {...props} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--e-t3)]">Lados</span>
        <button
          type="button"
          onClick={() => onLigados(!ligados)}
          aria-pressed={ligados}
          title={ligados ? "Separar os lados" : "Mover os quatro juntos"}
          className={`rounded border px-2 py-0.5 text-[11px] transition ${
            ligados
              ? "border-[#FFCB05] text-[color:var(--e-acento)]"
              : "border-[color:var(--e-b1)] text-[color:var(--e-t3)] hover:text-[color:var(--e-t1)]"
          }`}
        >
          {ligados ? "🔗 juntos" : "⛓ separados"}
        </button>
      </div>

      {ligados ? (
        <Deslizante
          rotulo="Todos os lados"
          valor={valores.topo}
          min={0}
          max={max}
          passo={passo}
          onMudar={todos}
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <Deslizante rotulo="Topo" valor={valores.topo} min={0} max={max} passo={passo} onMudar={(topo) => onMudar({ topo })} />
          <Deslizante rotulo="Base" valor={valores.base} min={0} max={max} passo={passo} onMudar={(base) => onMudar({ base })} />
          <Deslizante rotulo="Esquerda" valor={valores.esquerda} min={0} max={max} passo={passo} onMudar={(esquerda) => onMudar({ esquerda })} />
          <Deslizante rotulo="Direita" valor={valores.direita} min={0} max={max} passo={passo} onMudar={(direita) => onMudar({ direita })} />
        </div>
      )}
      {balao}
    </div>
  );
}

export function Cor({
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
  const id = useId();
  const { props, balao } = useDica(dica, rotulo);
  // o input nativo só entende #rrggbb; rgba() cai no preto do seletor mas
  // continua valendo no desenho até alguém escolher outra cor
  const hex = /^#[0-9a-f]{6}$/i.test(valor) ? valor : "#000000";

  return (
    <div {...props} className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-[color:var(--e-t3)]">{rotulo}</span>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={hex}
          onChange={(e) => onMudar(e.target.value)}
          className="h-8 w-9 shrink-0 cursor-pointer rounded border border-[color:var(--e-b1)] bg-transparent"
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
                  : "border-[color:var(--e-b1)]"
              }`}
            />
          ))}
        </div>
      </div>
      {balao}
    </div>
  );
}
