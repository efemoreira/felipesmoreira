"use client";

/**
 * Assistente da arte inicial.
 *
 * Em vez de escolher um modelo e depois preencher buraco por buraco, aqui se
 * entrega tudo de uma vez — as pessoas, os fundos, os textos e se tem moldura —
 * e sai uma arte montada para editar. Cada passo é opcional: dá para atravessar
 * o assistente só escolhendo o modelo, como era antes.
 */
import { useEffect, useRef, useState } from "react";
import { listarAtivos, prepararAtivo, salvarAtivo, urlDoAtivo } from "../armazenamento";
import { MODELOS, type Briefing, type ImagemBriefing, type Modelo } from "../modelos";
import { FORMATOS, GRUPOS_FORMATO, novoId, type Ativo, type Formato } from "../tipos";
import Recorte from "./Recorte";

interface Props {
  formato: Formato;
  onMontar: (modelo: Modelo, formato: Formato, briefing: Briefing) => void;
  onFechar: () => void;
}

type Passo = 0 | 1 | 2;

const PASSOS = ["Formato e modelo", "Imagens", "Textos e bordas"] as const;

export default function Assistente({ formato: formatoInicial, onMontar, onFechar }: Props) {
  const [passo, setPasso] = useState<Passo>(0);
  const [formato, setFormato] = useState<Formato>(formatoInicial);
  const [modelo, setModelo] = useState<Modelo>(MODELOS[0]);

  const [pessoas, setPessoas] = useState<Ativo[]>([]);
  const [fundos, setFundos] = useState<Ativo[]>([]);
  const [chapeu, setChapeu] = useState("");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [moldura, setMoldura] = useState(false);

  const montar = () => {
    const enxugar = (lista: Ativo[]): ImagemBriefing[] =>
      lista.map((a) => ({ ativoId: a.id, largura: a.largura, altura: a.altura }));

    onMontar(modelo, formato, {
      pessoas: enxugar(pessoas),
      fundos: enxugar(fundos),
      chapeu,
      titulo,
      subtitulo,
      moldura,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/12 bg-[#14110C] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Montar uma arte</h2>
            <p className="mt-0.5 text-xs text-white/40">
              Substitui as camadas atuais — dá para desfazer com ⌘Z.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </header>

        <ol className="flex shrink-0 gap-1 border-b border-white/10 px-5 py-3">
          {PASSOS.map((rotulo, i) => (
            <li key={rotulo} className="flex-1">
              <button
                type="button"
                onClick={() => setPasso(i as Passo)}
                aria-current={i === passo ? "step" : undefined}
                className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] uppercase tracking-[.12em] transition ${
                  i === passo
                    ? "bg-[#FFCB05]/15 text-[#FFCB05]"
                    : "text-white/35 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                {i + 1}. {rotulo}
              </button>
            </li>
          ))}
        </ol>

        <div className="flex-1 overflow-y-auto p-5">
          {passo === 0 && (
            <PassoModelo
              formato={formato}
              modelo={modelo}
              onFormato={setFormato}
              onModelo={setModelo}
            />
          )}
          {passo === 1 && (
            <PassoImagens
              pessoas={pessoas}
              fundos={fundos}
              onPessoas={setPessoas}
              onFundos={setFundos}
            />
          )}
          {passo === 2 && (
            <PassoTextos
              chapeu={chapeu}
              titulo={titulo}
              subtitulo={subtitulo}
              moldura={moldura}
              onChapeu={setChapeu}
              onTitulo={setTitulo}
              onSubtitulo={setSubtitulo}
              onMoldura={setMoldura}
            />
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <span className="truncate text-xs text-white/35">
            {modelo.nome} · {FORMATOS[formato].rotulo}
            {pessoas.length > 0 && ` · ${pessoas.length} pessoa${pessoas.length > 1 ? "s" : ""}`}
            {fundos.length > 0 && ` · ${fundos.length} fundo${fundos.length > 1 ? "s" : ""}`}
          </span>
          <div className="flex shrink-0 gap-2">
            {passo > 0 && (
              <button
                type="button"
                onClick={() => setPasso((p) => (p - 1) as Passo)}
                className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
              >
                Voltar
              </button>
            )}
            {passo < 2 ? (
              <button
                type="button"
                onClick={() => setPasso((p) => (p + 1) as Passo)}
                className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-[#FFCB05] hover:text-white"
              >
                Continuar
              </button>
            ) : null}
            <button
              type="button"
              onClick={montar}
              className="rounded-md bg-[#FFCB05] px-4 py-2 text-sm font-semibold text-[#14110C] transition hover:bg-[#ffd63a]"
            >
              Montar a arte
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ===== passo 1: formato e modelo ===== */

function PassoModelo({
  formato,
  modelo,
  onFormato,
  onModelo,
}: {
  formato: Formato;
  modelo: Modelo;
  onFormato: (f: Formato) => void;
  onModelo: (m: Modelo) => void;
}) {
  return (
    <>
      <h3 className="mb-2 text-[11px] uppercase tracking-[.14em] text-white/30">Formato</h3>
      <div className="mb-6 flex flex-col gap-3">
        {GRUPOS_FORMATO.map((grupo) => (
          <div key={grupo.rotulo} className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] uppercase tracking-[.14em] text-white/25">
              {grupo.rotulo}
            </span>
            {grupo.formatos.map((f) => {
              const { largura, altura, rotulo } = FORMATOS[f];
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFormato(f)}
                  aria-pressed={f === formato}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
                    f === formato
                      ? "border-[#FFCB05] bg-[#FFCB05]/10 text-white"
                      : "border-white/12 text-white/60 hover:border-white/30"
                  }`}
                >
                  {/* a proporção desenhada diz mais que o rótulo */}
                  <span
                    aria-hidden
                    style={{ aspectRatio: `${largura} / ${altura}` }}
                    className={`block w-6 shrink-0 rounded-[2px] border ${
                      f === formato ? "border-[#FFCB05] bg-[#FFCB05]/25" : "border-white/30"
                    }`}
                  />
                  <span className="text-left leading-tight">
                    {rotulo}
                    <span className="block text-[10px] text-white/30">
                      {largura}×{altura}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-[11px] uppercase tracking-[.14em] text-white/30">Modelo</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {MODELOS.map((m) => (
          <li key={m.chave}>
            <button
              type="button"
              onClick={() => onModelo(m)}
              aria-pressed={m.chave === modelo.chave}
              className={`h-full w-full rounded-lg border p-4 text-left transition ${
                m.chave === modelo.chave
                  ? "border-[#FFCB05] bg-[#FFCB05]/10"
                  : "border-white/12 hover:border-white/30"
              }`}
            >
              <span className="block text-sm font-semibold text-white">{m.nome}</span>
              <span className="mt-1 block text-xs leading-relaxed text-white/45">{m.resumo}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ===== passo 2: imagens ===== */

function PassoImagens({
  pessoas,
  fundos,
  onPessoas,
  onFundos,
}: {
  pessoas: Ativo[];
  fundos: Ativo[];
  onPessoas: (l: Ativo[]) => void;
  onFundos: (l: Ativo[]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Escolha
        familia="pessoa"
        titulo="Pessoas"
        ajuda="Quem aparece recortado na frente. Use ✂ para tirar o fundo de uma foto comum. A ordem é a ordem em que elas entram na arte, da esquerda para a direita."
        escolhidos={pessoas}
        onEscolhidos={onPessoas}
      />
      <Escolha
        familia="fundo"
        titulo="Fundos e fotos de contexto"
        ajuda="A primeira preenche o espaço de contexto do modelo; o que sobrar entra cobrindo a arte, atrás de tudo."
        escolhidos={fundos}
        onEscolhidos={onFundos}
      />
    </div>
  );
}

/**
 * Uma família da biblioteca com seleção múltipla e ordenada.
 *
 * O número no canto é a posição escolhida — é ele que diz quem fica onde na
 * arte, então clicar de novo tira da lista e renumera o resto.
 */
function Escolha({
  familia,
  titulo,
  ajuda,
  escolhidos,
  onEscolhidos,
}: {
  familia: Ativo["familia"];
  titulo: string;
  ajuda: string;
  escolhidos: Ativo[];
  onEscolhidos: (l: Ativo[]) => void;
}) {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [recortando, setRecortando] = useState<Ativo | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const recarregar = async (selecionarIds: string[] = []) => {
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

    // o que acabou de subir já entra escolhido: era esse o motivo de subir
    if (selecionarIds.length) {
      const novos = selecionarIds
        .map((id) => lista.find((a) => a.id === id))
        .filter((a): a is Ativo => Boolean(a));
      onEscolhidos([...escolhidos, ...novos]);
    }
  };

  useEffect(() => {
    void recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subir = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setErro("");
    const novos: string[] = [];
    try {
      for (const arquivo of Array.from(arquivos)) {
        const ativo = await prepararAtivo(arquivo, familia, novoId());
        await salvarAtivo(ativo);
        novos.push(ativo.id);
      }
      await recarregar(novos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui subir a imagem.");
    }
  };

  const alternar = (ativo: Ativo) => {
    const posicao = escolhidos.findIndex((a) => a.id === ativo.id);
    onEscolhidos(
      posicao === -1
        ? [...escolhidos, ativo]
        : escolhidos.filter((a) => a.id !== ativo.id),
    );
  };

  const daFamilia = ativos.filter((a) => a.familia === familia);

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-[.14em] text-white/30">
          {titulo}
          {escolhidos.length > 0 && (
            <span className="ml-2 text-[#FFCB05]">{escolhidos.length} escolhida(s)</span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {escolhidos.length > 0 && (
            <button
              type="button"
              onClick={() => onEscolhidos([])}
              className="rounded-md px-2 py-1 text-xs text-white/45 transition hover:text-white"
            >
              limpar
            </button>
          )}
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:border-[#FFCB05] hover:text-white"
          >
            Subir imagens
          </button>
        </div>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-white/35">{ajuda}</p>

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
      {erro && <p className="mb-2 text-xs text-red-400">{erro}</p>}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void subir(e.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed border-white/12 p-3"
      >
        {carregando ? (
          <p className="py-6 text-center text-sm text-white/35">Abrindo a biblioteca…</p>
        ) : daFamilia.length === 0 ? (
          <p className="py-6 text-center text-sm leading-relaxed text-white/35">
            Nada guardado ainda.
            <br />
            Arraste imagens para cá ou use “Subir imagens”.
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
            {daFamilia.map((a) => {
              const posicao = escolhidos.findIndex((e) => e.id === a.id);
              return (
                <li key={a.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => alternar(a)}
                    aria-pressed={posicao !== -1}
                    className={`block w-full overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#222_0_25%,#2c2c2c_0_50%)] bg-[length:16px_16px] transition ${
                      posicao !== -1 ? "border-[#FFCB05]" : "border-white/12 hover:border-white/35"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urls[a.id]} alt={a.nome} className="h-24 w-full object-contain" loading="lazy" />
                    <span className="block truncate px-2 py-1 text-left text-[11px] text-white/55">
                      {a.nome}
                    </span>
                  </button>

                  {posicao !== -1 && (
                    <span className="pointer-events-none absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#FFCB05] text-xs font-bold text-[#14110C]">
                      {posicao + 1}
                    </span>
                  )}

                  <button
                    type="button"
                    title="Remover o fundo desta imagem"
                    aria-label={`Remover o fundo de ${a.nome}`}
                    onClick={() => setRecortando(a)}
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded bg-black/70 text-xs text-white/70 opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:bg-[#FFCB05] hover:text-[#14110C]"
                  >
                    ✂
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {recortando && (
        <Recorte
          ativo={recortando}
          onFechar={() => setRecortando(null)}
          onPronto={(novoAtivoId) => {
            setRecortando(null);
            // o recorte vira um ativo novo, e é ele que interessa para a arte
            void recarregar([novoAtivoId]);
          }}
        />
      )}
    </section>
  );
}

/* ===== passo 3: textos e bordas ===== */

function PassoTextos({
  chapeu,
  titulo,
  subtitulo,
  moldura,
  onChapeu,
  onTitulo,
  onSubtitulo,
  onMoldura,
}: {
  chapeu: string;
  titulo: string;
  subtitulo: string;
  moldura: boolean;
  onChapeu: (v: string) => void;
  onTitulo: (v: string) => void;
  onSubtitulo: (v: string) => void;
  onMoldura: (v: boolean) => void;
}) {
  const campo =
    "w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#FFCB05] focus:outline-none";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-white/40">
        O que ficar em branco não entra na arte — o texto de exemplo do modelo some junto.
        Dentro do texto, <code className="text-[#FFCB05]">*palavra*</code> sai na cor de destaque e{" "}
        <code className="text-[#FFCB05]">==palavra==</code> sai em tarja.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[.14em] text-white/30">Chapéu (opcional)</span>
        <input
          type="text"
          value={chapeu}
          onChange={(e) => onChapeu(e.target.value)}
          placeholder="ERA TUDO UMA FARSA?"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[.14em] text-white/30">Título</span>
        <input
          type="text"
          value={titulo}
          onChange={(e) => onTitulo(e.target.value)}
          placeholder="URGENTE!"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[.14em] text-white/30">
          Subtítulo (Enter quebra a linha)
        </span>
        <textarea
          value={subtitulo}
          onChange={(e) => onSubtitulo(e.target.value)}
          rows={3}
          placeholder={"Resuma o fato em duas linhas\ne destaque ==o ponto principal=="}
          className={`${campo} resize-y leading-relaxed`}
        />
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/12 p-3">
        <input
          type="checkbox"
          checked={moldura}
          onChange={(e) => onMoldura(e.target.checked)}
          className="h-4 w-4 accent-[#FFCB05]"
        />
        <span className="text-sm text-white/80">
          Moldura dourada em volta da arte
          <span className="mt-0.5 block text-xs text-white/35">
            Desmarcado, tira a moldura mesmo dos modelos que já vêm com ela.
          </span>
        </span>
      </label>
    </div>
  );
}
