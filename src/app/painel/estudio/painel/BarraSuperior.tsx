"use client";

import { useEffect, useRef, useState } from "react";
import { FORMATOS, GRUPOS_FORMATO, LIVRE_MAX, LIVRE_MIN, type Formato } from "../tipos";
import { useDica } from "./Dica";

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
  onAbrirArtes: () => void;
  onNovaArte: () => void;
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
  onAbrirArtes,
  onNovaArte,
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

      <Nomeador nome={nome} onNome={onNome} />

      <span className="hidden shrink-0 text-[11px] text-white/25 xl:inline">
        {salvando ? "salvando…" : "salvo no navegador"}
      </span>

      <BotaoTexto
        onClick={onNovaArte}
        dica="Abre uma arte em branco no formato de agora. A que está aberta continua guardada em “Artes”."
      >
        + Nova
      </BotaoTexto>

      <BotaoTexto
        onClick={onAbrirArtes}
        dica="Todas as artes salvas neste navegador: abrir, duplicar, renomear e apagar."
      >
        Artes
      </BotaoTexto>

      <BotaoTexto
        onClick={onAbrirModelos}
        dica="Monta a arte inteira a partir de um modelo pronto, já com as suas fotos e os seus textos."
      >
        Modelos
      </BotaoTexto>

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
        <Zoom valor={zoom} onAjustar={onAjustarZoom} />
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
        <Exportador
          rotulo={exportando ? "Gerando…" : "PNG"}
          dica="Baixa a arte em PNG, no tamanho real do formato escolhido."
          destaque
          desabilitado={exportando}
          onClick={() => onExportar(1)}
        />
        <Exportador
          rotulo="2×"
          dica="Baixa no dobro do tamanho. Vale quando a arte vai para impressão ou para uma tela grande."
          desabilitado={exportando}
          onClick={() => onExportar(2)}
        />
        <Exportador
          rotulo="⧉"
          dica="Copia a imagem para a área de transferência — é só colar no WhatsApp ou no Instagram."
          desabilitado={exportando}
          onClick={onCopiar}
        />
      </div>

      {/* o que não coube: menu só em tela estreita */}
      <div className="relative shrink-0 lg:hidden">
        <Botao titulo="Mais opções" onClick={() => setMaisAberto((v) => !v)}>
          ⋯
        </Botao>
        {maisAberto && (
          <Mais aoFechar={() => setMaisAberto(false)}>
            <button type="button" onClick={onNovaArte} className={itemMenu}>
              + Nova arte
            </button>
            <button type="button" onClick={onAbrirArtes} className={itemMenu}>
              Minhas artes
            </button>
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

/** O nome da arte — é ele que batiza o PNG na hora de baixar. */
function Nomeador({ nome, onNome }: { nome: string; onNome: (v: string) => void }) {
  const { props, balao } = useDica(
    "O nome da arte. É por ele que ela aparece em “Artes” e é com ele que o PNG é baixado.",
  );
  return (
    <>
      <input
        {...props}
        value={nome}
        onChange={(e) => onNome(e.target.value)}
        aria-label="Nome da arte"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-white outline-none transition hover:border-white/12 focus:border-[#FFCB05]/60"
      />
      {balao}
    </>
  );
}

function Zoom({ valor, onAjustar }: { valor: number; onAjustar: () => void }) {
  const { props, balao } = useDica("Clique para ajustar a arte à janela (⌘0). Ctrl + roda também dá zoom.");
  return (
    <>
      <button
        type="button"
        {...props}
        onClick={onAjustar}
        className="min-w-[3.2rem] px-1 font-mono text-xs text-white/60 transition hover:text-white"
      >
        {Math.round(valor * 100)}%
      </button>
      {balao}
    </>
  );
}

function BotaoTexto({
  children,
  dica,
  onClick,
}: {
  children: React.ReactNode;
  dica: string;
  onClick: () => void;
}) {
  const { props, balao } = useDica(dica);
  return (
    <>
      <button
        type="button"
        {...props}
        onClick={onClick}
        className="hidden shrink-0 rounded-md border border-white/12 px-3 py-1.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white lg:block"
      >
        {children}
      </button>
      {balao}
    </>
  );
}

function Exportador({
  rotulo,
  dica,
  destaque,
  desabilitado,
  onClick,
}: {
  rotulo: string;
  dica: string;
  destaque?: boolean;
  desabilitado?: boolean;
  onClick: () => void;
}) {
  const { props, balao } = useDica(dica);
  return (
    <>
      <button
        type="button"
        {...props}
        onClick={onClick}
        disabled={desabilitado}
        aria-label={dica}
        className={
          destaque
            ? "rounded-md bg-[#FFCB05] px-3 py-1.5 text-sm font-semibold text-[#14110C] transition hover:bg-[#ffd63a] disabled:opacity-50 sm:px-4"
            : "hidden rounded-md border border-white/12 px-2 py-1.5 text-xs text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-50 sm:block"
        }
      >
        {rotulo}
      </button>
      {balao}
    </>
  );
}

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

/**
 * Os botões de ícone da barra. Sem `title`: quem explica é a dica de 3 s, e ter
 * os dois faria aparecer dois balões um em cima do outro.
 */
function Botao({
  children,
  titulo,
  dica,
  onClick,
  desabilitado,
  ativo,
}: {
  children: React.ReactNode;
  titulo: string;
  dica?: string;
  onClick: () => void;
  desabilitado?: boolean;
  ativo?: boolean;
}) {
  const { props, balao } = useDica(dica ?? titulo);
  return (
    <>
      <button
        type="button"
        {...props}
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
      {balao}
    </>
  );
}
