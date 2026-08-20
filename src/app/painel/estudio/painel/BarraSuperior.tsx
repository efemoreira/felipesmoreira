"use client";

import { useEffect, useRef, useState } from "react";
import { FORMATOS, GRUPOS_FORMATO, LIVRE_MAX, LIVRE_MIN, type Formato } from "../tipos";
import { useDica } from "./Dica";

/**
 * O que o public/painel/estudio.php carimba no HTML antes de servi-lo.
 *
 * Vem por aqui, e não por uma chamada à API, porque o PHP já tem a sessão
 * aberta no momento em que entrega a página: uma ida ao servidor a mais só
 * adiaria o nome aparecer na barra.
 */
declare global {
  interface Window {
    __PAINEL__?: { nome: string; papel: string; tema: Tema; csrf: string };
  }
}

type Tema = "claro" | "escuro" | "sistema";

/* A mesma linguagem do painel: etiqueta em Special Elite, caixa alta, canto
   reto e borda grossa. É o que faz o Estúdio não parecer outro produto. */
const ETIQUETA =
  "font-[family-name:var(--font-elite)] uppercase tracking-[.12em]";

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
    <header className="relative flex h-[var(--barra)] shrink-0 items-center gap-2 border-b border-[color:var(--e-b1)] bg-[color:var(--e-superficie)] px-2 sm:gap-3 sm:px-4">
      {/* É a única saída da tela — não pode ser a coisa mais apagada dela. */}
      <a
        href="/painel/"
        title="Voltar ao painel"
        className={`flex min-h-[38px] shrink-0 items-center gap-1.5 border-2 border-[color:var(--e-b2)] px-2.5 text-[11px] text-[color:var(--e-t1)] shadow-[3px_3px_0_var(--e-sombra)] transition hover:bg-[color:var(--e-fill)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-3 ${ETIQUETA}`}
      >
        <span aria-hidden="true">←</span>
        <span className="hidden sm:inline">Painel</span>
      </a>

      <Nomeador nome={nome} onNome={onNome} />

      <span className="hidden shrink-0 text-[11px] text-[color:var(--e-t4)] xl:inline">
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

      <div className="hidden items-center gap-1 border-2 border-[color:var(--e-b1)] px-1 py-0.5 lg:flex">
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

      <Conta />

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
            <div className="border-t border-[color:var(--e-b1)] px-3 py-2">
              <SeletorFormato
                formato={formato}
                tamanho={tamanho}
                onFormato={onFormato}
                onTamanhoLivre={onTamanhoLivre}
              />
            </div>
            <div className="flex border-t border-[color:var(--e-b1)]">
              <button type="button" onClick={onDesfazer} disabled={!podeDesfazer} className={`${itemMenu} disabled:opacity-30`}>
                ↶ Desfazer
              </button>
              <button type="button" onClick={onRefazer} disabled={!podeRefazer} className={`${itemMenu} disabled:opacity-30`}>
                ↷ Refazer
              </button>
            </div>
            <button type="button" onClick={onPrevia} className={`${itemMenu} border-t border-[color:var(--e-b1)]`}>
              {previa ? "Mostrar guias" : "Ver sem guias"}
            </button>
            <button type="button" onClick={onAjustarZoom} className={itemMenu}>
              Ajustar à janela ({Math.round(zoom * 100)}%)
            </button>
            <button type="button" onClick={() => onExportar(2)} className={`${itemMenu} border-t border-[color:var(--e-b1)]`}>
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
  "block w-full flex-1 px-3 py-2.5 text-left text-sm text-[color:var(--e-t2)] no-underline transition hover:bg-[#FFCB05]/15 hover:text-[color:var(--e-t1)]";

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
        className="min-w-0 flex-1 border-2 border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-[color:var(--e-t1)] outline-none transition hover:border-[color:var(--e-b1)] focus:border-[#FFCB05]"
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
        className="min-w-[3.2rem] px-1 font-mono text-xs text-[color:var(--e-t2)] transition hover:text-[color:var(--e-t1)]"
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
        className={`hidden min-h-[38px] shrink-0 border-2 border-[color:var(--e-b1)] px-3 text-[11px] text-[color:var(--e-t2)] transition hover:border-[color:var(--e-b2)] hover:text-[color:var(--e-t1)] lg:block ${ETIQUETA}`}
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
            ? `flex min-h-[38px] items-center border-2 border-[color:var(--e-tinta)] bg-[#FFCB05] px-3 text-[11px] text-[color:var(--e-tinta)] shadow-[3px_3px_0_var(--e-sombra)] transition hover:bg-[#ffd63a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 sm:px-4 ${ETIQUETA}`
            : `hidden min-h-[38px] items-center border-2 border-[color:var(--e-b1)] px-2.5 text-[11px] text-[color:var(--e-t2)] transition hover:border-[color:var(--e-b2)] hover:text-[color:var(--e-t1)] disabled:opacity-50 sm:flex ${ETIQUETA}`
        }
      >
        {rotulo}
      </button>
      {balao}
    </>
  );
}

/**
 * Quem está usando o Estúdio, e como sair dele.
 *
 * Era a única tela do painel que não dizia nem uma coisa nem outra — e ela roda
 * no computador compartilhado da coordenação. O seletor de tema vem junto
 * porque é aqui que a pessoa está quando percebe que quer trocar.
 */
function Conta() {
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState<Tema>("sistema");
  const [eu, setEu] = useState<{ nome: string; papel: string; csrf: string } | null>(null);

  useEffect(() => {
    const d = window.__PAINEL__;
    if (!d) return;
    setEu({ nome: d.nome, papel: d.papel, csrf: d.csrf });
    setTema(d.tema);
  }, []);

  if (!eu) return null;

  /* O mesmo cookie que o layout.php lê: trocar aqui vale para o painel inteiro,
     e o data-tema muda na hora, sem recarregar o editor e perder o que está
     na tela. */
  const trocarTema = (novo: Tema) => {
    const seguro = location.protocol === "https:" ? ";secure" : "";
    document.cookie = `painel_tema=${novo};path=/painel;max-age=31536000;samesite=lax${seguro}`;
    if (novo === "sistema") delete document.documentElement.dataset.tema;
    else document.documentElement.dataset.tema = novo;
    setTema(novo);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        title={`${eu.nome} · ${eu.papel}`}
        className={`flex min-h-[38px] items-center gap-2 border-2 border-[color:var(--e-b1)] px-2.5 text-[11px] text-[color:var(--e-t2)] transition hover:border-[color:var(--e-b2)] hover:text-[color:var(--e-t1)] ${ETIQUETA}`}
      >
        <span
          aria-hidden="true"
          className="grid h-5 w-5 place-items-center bg-[#FFCB05] text-[10px] text-[color:var(--e-tinta)]"
        >
          {eu.nome.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden md:inline">{eu.nome.split(" ")[0]}</span>
      </button>

      {aberto && (
        <Mais aoFechar={() => setAberto(false)}>
          <p className="border-b border-[color:var(--e-b1)] px-3 py-2.5 text-[13px] text-[color:var(--e-t1)]">
            {eu.nome}
            <span className={`mt-0.5 block text-[10px] text-[color:var(--e-t3)] ${ETIQUETA}`}>
              {eu.papel}
            </span>
          </p>

          <div className="flex border-b border-[color:var(--e-b1)]">
            {(
              [
                ["claro", "Claro"],
                ["escuro", "Escuro"],
                ["sistema", "Sistema"],
              ] as const
            ).map(([chave, rotulo]) => (
              <button
                key={chave}
                type="button"
                onClick={() => trocarTema(chave)}
                aria-pressed={tema === chave}
                className={`flex-1 py-2.5 text-[10px] transition ${ETIQUETA} ${
                  tema === chave
                    ? "bg-[#FFCB05] text-[color:var(--e-tinta)]"
                    : "text-[color:var(--e-t3)] hover:bg-[color:var(--e-fill)]"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <a href="/painel/conta.php" className={itemMenu}>
            Minha senha
          </a>
          <a href="/painel/" className={itemMenu}>
            Voltar ao painel
          </a>
          {/* logout é POST em toda tela do painel; aqui não vira link GET */}
          <form method="post" action="/painel/" className="border-t border-[color:var(--e-b1)]">
            <input type="hidden" name="acao" value="sair" />
            <input type="hidden" name="csrf" value={eu.csrf} />
            <button type="submit" className={itemMenu}>
              Sair
            </button>
          </form>
        </Mais>
      )}
    </div>
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
      className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden border-2 border-[color:var(--e-b2)] bg-[color:var(--e-superficie)] shadow-[5px_5px_0_var(--e-sombra)]"
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
        className="min-w-0 rounded-md border border-[color:var(--e-b1)] bg-[color:var(--e-campo)] px-2 py-1.5 text-sm text-[color:var(--e-t1)] outline-none focus:border-[#FFCB05]/60"
      >
        {GRUPOS_FORMATO.map((g) => (
          <optgroup key={g.rotulo} label={g.rotulo}>
            {g.formatos.map((f) => (
              <option key={f} value={f} className="bg-[color:var(--e-superficie)]">
                {FORMATOS[f].rotulo} · {FORMATOS[f].largura}×{FORMATOS[f].altura}
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Livre">
          <option value="livre" className="bg-[color:var(--e-superficie)]">
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
          <span className="text-xs text-[color:var(--e-t4)]">×</span>
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
      className="w-16 rounded-md border border-[color:var(--e-b1)] bg-[color:var(--e-campo)] px-1.5 py-1.5 text-center font-mono text-xs text-[color:var(--e-t1)] outline-none focus:border-[#FFCB05]/60"
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
        className={`grid h-7 w-7 shrink-0 place-items-center rounded text-sm transition hover:bg-[color:var(--e-fill)] hover:text-[color:var(--e-t1)] disabled:opacity-25 disabled:hover:bg-transparent ${
          ativo ? "bg-[#FFCB05]/20 text-[color:var(--e-acento)]" : "text-[color:var(--e-t2)]"
        }`}
      >
        {children}
      </button>
      {balao}
    </>
  );
}
