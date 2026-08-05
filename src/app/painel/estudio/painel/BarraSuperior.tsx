"use client";

import { useEffect, useRef, useState } from "react";
import { FORMATOS, GRUPOS_FORMATO, LIVRE_MAX, LIVRE_MIN, type Formato } from "../tipos";

interface Props {
  nome: string;
  formato: Formato;
  tamanho: { largura: number; altura: number };
  zoom: number;
  podeDesfazer: boolean;
  podeRefazer: boolean;
  salvando: boolean;
  exportando: boolean;
  previa: boolean;
  guiasVisiveis: boolean;
  onNome: (v: string) => void;
  onFormato: (f: Formato) => void;
  onTamanhoLivre: (largura: number, altura: number) => void;
  onZoom: (z: number) => void;
  onAjustarZoom: () => void;
  onDesfazer: () => void;
  onRefazer: () => void;
  onPrevia: () => void;
  onGuias: () => void;
  onExportar: (escala: number) => void;
  onCopiar: () => void;
  onAbrirModelos: () => void;
}

/**
 * Barra de altura fixa — a `--barra` declarada na raiz do estúdio.
 *
 * Fixa de propósito: as gavetas do celular se posicionam a partir dela, e
 * enquanto ela quebrava em duas ou três linhas o topo delas ficava coberto.
 * Em tela estreita, o que não é essencial se recolhe no menu "⋯".
 */
export default function BarraSuperior({
  nome,
  formato,
  tamanho,
  zoom,
  podeDesfazer,
  podeRefazer,
  salvando,
  exportando,
  previa,
  guiasVisiveis,
  onNome,
  onFormato,
  onTamanhoLivre,
  onZoom,
  onAjustarZoom,
  onDesfazer,
  onRefazer,
  onPrevia,
  onGuias,
  onExportar,
  onCopiar,
  onAbrirModelos,
}: Props) {
  const [maisAberto, setMaisAberto] = useState(false);

  return (
    <header className="relative flex h-[var(--barra)] shrink-0 items-center gap-2 border-b border-white/10 bg-[#14110C] px-2 sm:gap-3 sm:px-4">
      <a
        href="/painel/"
        title="Voltar ao painel"
        className="shrink-0 rounded-md px-2 py-1.5 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        ←<span className="ml-1 hidden sm:inline">Painel</span>
      </a>

      <input
        value={nome}
        onChange={(e) => onNome(e.target.value)}
        aria-label="Nome da arte"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-white outline-none transition hover:border-white/12 focus:border-[#FFCB05]/60"
      />

      <span className="hidden shrink-0 text-[11px] text-white/25 xl:inline">
        {salvando ? "salvando…" : "salvo no navegador"}
      </span>

      <button
        type="button"
        onClick={onAbrirModelos}
        className="hidden shrink-0 rounded-md border border-white/12 px-3 py-1.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white lg:block"
      >
        Modelos
      </button>

      <div className="hidden lg:block">
        <SeletorFormato
          formato={formato}
          tamanho={tamanho}
          onFormato={onFormato}
          onTamanhoLivre={onTamanhoLivre}
        />
      </div>

      <div className="hidden items-center gap-1 rounded-md border border-white/12 px-1 py-0.5 lg:flex">
        <Botao titulo="Diminuir" onClick={() => onZoom(Math.max(0.08, zoom * 0.9))}>
          −
        </Botao>
        <button
          type="button"
          onClick={onAjustarZoom}
          title="Ajustar à janela (⌘0)"
          className="min-w-[3.2rem] px-1 font-mono text-xs text-white/60 transition hover:text-white"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Botao titulo="Aumentar" onClick={() => onZoom(Math.min(1.5, zoom * 1.1))}>
          +
        </Botao>
      </div>

      <div className="hidden items-center gap-1 lg:flex">
        <Botao titulo="Desfazer (⌘Z)" onClick={onDesfazer} desabilitado={!podeDesfazer}>
          ↶
        </Botao>
        <Botao titulo="Refazer (⌘⇧Z)" onClick={onRefazer} desabilitado={!podeRefazer}>
          ↷
        </Botao>
        <Botao titulo="Ver sem guias (P)" onClick={onPrevia} ativo={previa}>
          ◉
        </Botao>
        <Botao titulo="Linhas de segurança" onClick={onGuias} ativo={guiasVisiveis}>
          ⊞
        </Botao>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onExportar(1)}
          disabled={exportando}
          className="rounded-md bg-[#FFCB05] px-3 py-1.5 text-sm font-semibold text-[#14110C] transition hover:bg-[#ffd63a] disabled:opacity-50 sm:px-4"
        >
          {exportando ? "Gerando…" : "PNG"}
        </button>
        <button
          type="button"
          onClick={() => onExportar(2)}
          disabled={exportando}
          title="Baixar no dobro do tamanho"
          className="hidden rounded-md border border-white/12 px-2 py-1.5 text-xs text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-50 sm:block"
        >
          2×
        </button>
        <button
          type="button"
          onClick={onCopiar}
          disabled={exportando}
          title="Copiar a imagem para colar no WhatsApp"
          className="hidden rounded-md border border-white/12 px-2 py-1.5 text-xs text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-50 sm:block"
        >
          ⧉
        </button>
      </div>

      {/* o que não coube: menu só em tela estreita */}
      <div className="relative shrink-0 lg:hidden">
        <Botao titulo="Mais opções" onClick={() => setMaisAberto((v) => !v)}>
          ⋯
        </Botao>
        {maisAberto && (
          <Mais aoFechar={() => setMaisAberto(false)}>
            <button type="button" onClick={onAbrirModelos} className={itemMenu}>
              Modelos
            </button>
            <div className="border-t border-white/10 px-3 py-2">
              <SeletorFormato
                formato={formato}
                tamanho={tamanho}
                onFormato={onFormato}
                onTamanhoLivre={onTamanhoLivre}
              />
            </div>
            <div className="flex border-t border-white/10">
              <button type="button" onClick={onDesfazer} disabled={!podeDesfazer} className={`${itemMenu} disabled:opacity-30`}>
                ↶ Desfazer
              </button>
              <button type="button" onClick={onRefazer} disabled={!podeRefazer} className={`${itemMenu} disabled:opacity-30`}>
                ↷ Refazer
              </button>
            </div>
            <button type="button" onClick={onPrevia} className={`${itemMenu} border-t border-white/10`}>
              {previa ? "Mostrar guias" : "Ver sem guias"}
            </button>
            <button type="button" onClick={onAjustarZoom} className={itemMenu}>
              Ajustar à janela ({Math.round(zoom * 100)}%)
            </button>
            <button type="button" onClick={() => onExportar(2)} className={`${itemMenu} border-t border-white/10`}>
              Baixar PNG 2×
            </button>
            <button type="button" onClick={onCopiar} className={itemMenu}>
              Copiar imagem
            </button>
          </Mais>
        )}
      </div>
    </header>
  );
}

const itemMenu =
  "w-full flex-1 px-3 py-2 text-left text-sm text-white/70 transition hover:bg-[#FFCB05]/15 hover:text-white";

function Mais({ children, aoFechar }: { children: React.ReactNode; aoFechar: () => void }) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) aoFechar();
    };
    // no próximo tique: o clique que abriu não pode fechar na mesma hora
    const id = window.setTimeout(() => document.addEventListener("mousedown", fora), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", fora);
    };
  }, [aoFechar]);

  return (
    <div
      ref={caixa}
      className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-md border border-white/12 bg-[#14110C] shadow-xl"
    >
      {children}
    </div>
  );
}

/** Formato agrupado por orientação, com o tamanho livre no fim. */
function SeletorFormato({
  formato,
  tamanho,
  onFormato,
  onTamanhoLivre,
}: {
  formato: Formato;
  tamanho: { largura: number; altura: number };
  onFormato: (f: Formato) => void;
  onTamanhoLivre: (l: number, a: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={formato}
        onChange={(e) => onFormato(e.target.value as Formato)}
        aria-label="Formato da arte"
        className="min-w-0 rounded-md border border-white/12 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-[#FFCB05]/60"
      >
        {GRUPOS_FORMATO.map((g) => (
          <optgroup key={g.rotulo} label={g.rotulo}>
            {g.formatos.map((f) => (
              <option key={f} value={f} className="bg-[#14110C]">
                {FORMATOS[f].rotulo} · {FORMATOS[f].largura}×{FORMATOS[f].altura}
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Livre">
          <option value="livre" className="bg-[#14110C]">
            Personalizado…
          </option>
        </optgroup>
      </select>

      {formato === "livre" && (
        <div className="flex items-center gap-1">
          <Medida
            rotulo="Largura"
            valor={tamanho.largura}
            onMudar={(v) => onTamanhoLivre(v, tamanho.altura)}
          />
          <span className="text-xs text-white/30">×</span>
          <Medida
            rotulo="Altura"
            valor={tamanho.altura}
            onMudar={(v) => onTamanhoLivre(tamanho.largura, v)}
          />
        </div>
      )}
    </div>
  );
}

/** Campo de medida que só aplica ao sair — digitar "1" não pode virar 320 na hora. */
function Medida({
  rotulo,
  valor,
  onMudar,
}: {
  rotulo: string;
  valor: number;
  onMudar: (v: number) => void;
}) {
  const [rascunho, setRascunho] = useState(String(valor));
  useEffect(() => setRascunho(String(valor)), [valor]);

  const aplicar = () => {
    const n = Number(rascunho);
    if (Number.isFinite(n) && n > 0) onMudar(n);
    else setRascunho(String(valor));
  };

  return (
    <input
      type="number"
      min={LIVRE_MIN}
      max={LIVRE_MAX}
      value={rascunho}
      aria-label={rotulo}
      onChange={(e) => setRascunho(e.target.value)}
      onBlur={aplicar}
      onKeyDown={(e) => e.key === "Enter" && aplicar()}
      className="w-16 rounded-md border border-white/12 bg-black/40 px-1.5 py-1.5 text-center font-mono text-xs text-white outline-none focus:border-[#FFCB05]/60"
    />
  );
}

function Botao({
  children,
  titulo,
  onClick,
  desabilitado,
  ativo,
}: {
  children: React.ReactNode;
  titulo: string;
  onClick: () => void;
  desabilitado?: boolean;
  ativo?: boolean;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      onClick={onClick}
      disabled={desabilitado}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded text-sm transition hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent ${
        ativo ? "bg-[#FFCB05]/20 text-[#FFCB05]" : "text-white/60"
      }`}
    >
      {children}
    </button>
  );
}
