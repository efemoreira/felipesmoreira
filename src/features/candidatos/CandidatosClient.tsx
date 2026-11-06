"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { Icon } from "@/components/icons";
import { C, FOCO, FONT_ALFA, LARGURA, PONTOS, RAIO, TITULO, borda } from "@/lib/theme";
import { canvasParaBlob } from "@/lib/cordelCanvas";
import { entregarArte } from "@/lib/compartilhar";
import { faseEm, type Fase } from "@/lib/eleicao";
import { linkDasRedes, obterChapa, type Candidato } from "@/lib/api/candidatos";
import {
  ORDEM_COLINHA,
  TITULO_SECAO,
  VAGAS,
  entraDireto,
  montarColinha,
  porCargo,
  titularesDe,
  type CargoColinha,
  type Secao,
} from "./cargos";
import { CHAPA } from "@/features/missao/data";
import { sinal } from "@/lib/api/sinal";
import { ColinhaImpressa } from "./ColinhaImpressa";
import { gerarColinha, gerarFicha, nomeArquivoColinha, nomeArquivoFicha } from "./colinha";

/**
 * Em que número votar — a colinha.
 *
 * A lista vem do painel pela rede, e não do build: nome de urna e número saem
 * do registro no TSE e mudam até a véspera. Lista no código é lista que exige um
 * deploy para corrigir um dígito.
 *
 * **A página é por cargo, na ordem da colinha** — presidente, governador,
 * senado (duas vagas), deputado federal, deputado estadual —, e cargo sem
 * ninguém no ar não aparece. Presidente e governador entram na colinha sem
 * escolha; nos outros, quando há mais candidatos que vagas, o eleitor escolhe
 * quem leva. Vice e suplente aparecem embaixo de quem acompanham, clicáveis,
 * e nunca na colinha: o voto vai no número do titular.
 *
 * As LISTAS do painel não são desenhadas aqui: elas continuam alimentando o
 * bloco da home (`SigaCandidatos`). A colinha desta página é do eleitor.
 *
 * **O número da chapa vem do build** (`CHAPA`) e só aparece quando a rede
 * falha: é a única coisa que a página do número não pode deixar de dizer.
 *
 * **A trava do calendário eleitoral mora aqui, no botão.** Compartilhar arte com
 * número é propaganda; no dia da votação publicar propaganda nova na internet é
 * proibido. Imprimir e consultar continuam abertos — não é publicar.
 *
 * **Depois da eleição a página vira registro**: quem disputou, com número e
 * redes, sem colinha nem "pôr na colinha" — pedir que alguém monte a cola de uma
 * votação que já passou só confunde.
 */

/** Onde a escolha do eleitor fica guardada entre uma visita e outra. Só conveniência. */
const CHAVE_ESCOLHAS = "colinha-escolhas";

type Escolhas = Partial<Record<CargoColinha, string[]>>;

function lerEscolhas(): Escolhas {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_ESCOLHAS) ?? "{}");
    if (!bruto || typeof bruto !== "object") return {};
    const limpo: Escolhas = {};
    for (const k of ORDEM_COLINHA) {
      const v = (bruto as Record<string, unknown>)[k];
      if (Array.isArray(v)) limpo[k] = v.filter((x): x is string => typeof x === "string");
    }
    return limpo;
  } catch {
    return {};
  }
}

function guardarEscolhas(e: Escolhas) {
  try {
    localStorage.setItem(CHAVE_ESCOLHAS, JSON.stringify(e));
  } catch {
    /* aba anônima ou armazenamento bloqueado: a escolha vale só nesta visita */
  }
}

export default function CandidatosClient() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  /* Começa null e só é preenchida no efeito: num export estático a fase
     decidida no build congelaria na data em que o site foi publicado. */
  const [fase, setFase] = useState<Fase | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [escolhas, setEscolhas] = useState<Escolhas>({});
  const [copias, setCopias] = useState<1 | 4>(4);

  const carregar = useCallback(() => {
    setCarregando(true);
    setFalhou(false);
    obterChapa()
      .then((chapa) => setCandidatos(chapa.candidatos))
      .catch(() => {
        /* A rede falhou. A lista fica de fora, e é melhor assim do que mostrar
           número velho guardado — número errado na urna não tem conserto. O
           que fica é a chapa, que é do build, e o botão de tentar de novo. */
        setFalhou(true);
      })
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    setFase(faseEm());
    setEscolhas(lerEscolhas());
    carregar();
  }, [carregar]);

  const podeCompartilhar = fase === "campanha" || fase === "reta-final";
  const acabou = fase === "depois";

  const { secoes, outros } = useMemo(() => porCargo(candidatos), [candidatos]);
  const linhas = useMemo(() => montarColinha(secoes, escolhas), [secoes, escolhas]);
  const naColinha = useMemo(
    () => new Set(linhas.flatMap((l) => (l.candidato ? [l.candidato.id] : []))),
    [linhas],
  );

  /** Marca ou desmarca alguém numa seção de escolha. Vaga cheia empurra o mais antigo. */
  const alternar = useCallback((chave: CargoColinha, id: string) => {
    setEscolhas((atual) => {
      const agora = atual[chave] ?? [];
      const vagas = VAGAS[chave];
      const proxima = agora.includes(id)
        ? agora.filter((x) => x !== id)
        : [...agora, id].slice(-vagas);
      const nova = { ...atual, [chave]: proxima };
      guardarEscolhas(nova);
      return nova;
    });
  }, []);

  /** Compartilha a arte pronta, ou baixa quando o aparelho não tem o menu. */
  const entregar = useCallback(async (canvas: HTMLCanvasElement, nome: string, texto: string) => {
    const blob = await canvasParaBlob(canvas);
    if (!blob) throw new Error("sem blob");
    if ((await entregarArte(blob, nome, texto)) !== "cancelou") {
      sinal("compartilhou");
    }
  }, []);

  const compartilharUm = useCallback(
    async (c: Candidato) => {
      setGerando(c.id);
      setAviso(null);
      try {
        await entregar(
          await gerarFicha(c),
          nomeArquivoFicha(c),
          `${c.nome} — ${c.numero}${c.cargo ? ` · ${c.cargo}` : ""}\nfelipesmoreira.com/candidatos`,
        );
      } catch {
        setAviso("Não consegui montar a arte agora. Tente de novo.");
      } finally {
        setGerando(null);
      }
    },
    [entregar],
  );

  const compartilharColinha = useCallback(async () => {
    const pessoas = linhas.flatMap((l) => (l.candidato ? [l.candidato] : []));
    if (pessoas.length === 0) return;
    setGerando("colinha");
    setAviso(null);
    try {
      await entregar(
        await gerarColinha("Minha colinha", pessoas),
        nomeArquivoColinha("minha"),
        "A minha colinha para a urna — monte a sua.\nfelipesmoreira.com/candidatos",
      );
    } catch {
      setAviso("Não consegui montar a colinha agora. Tente de novo.");
    } finally {
      setGerando(null);
    }
  }, [entregar, linhas]);

  const temAlguem = candidatos.length > 0;
  const semNinguem = !carregando && !falhou && !temAlguem;

  return (
    <PaginaDoSite
      fundo="livre"
      abertura={
        <AberturaPagina
          trilha="Candidatos de 2026"
          kicker={acabou ? "Eleição 2026" : "Em que número votar"}
          titulo={acabou ? "Quem disputou pela Missão" : "Nossos candidatos"}
          intro={
            acabou ? (
              <p>A eleição passou. A lista fica no ar como registro de quem disputou no Ceará.</p>
            ) : (
              <p>
                O número é o que você digita na urna. Presidente e governador já estão na sua
                colinha; nos outros cargos, <strong>escolha quem você leva</strong>, e imprima
                ou salve no celular.
              </p>
            )
          }
        />
      }
    >
    <div className="cd-fundo">
      <div className="s-largura cd-main">

        {/* A chapa do build só aparece quando a lista não veio: é o que a página
            não pode deixar de dizer, com ou sem rede. */}
        {(falhou || semNinguem) && (
          <section className="cd-chapa" aria-label="A chapa">
            <p className="cd-chapa-numero">{CHAPA.numero}</p>
            <div>
              <p className="cd-chapa-cargo">Governador</p>
              <p className="cd-chapa-nome">{CHAPA.governador}</p>
              <p className="cd-chapa-cargo">Vice</p>
              <p className="cd-chapa-nome">{CHAPA.vice}</p>
            </div>
          </section>
        )}

        {carregando && <p className="cd-vazio">Carregando a lista…</p>}

        {!carregando && falhou && (
          <p className="cd-aviso" role="alert">
            Não consegui carregar a lista dos candidatos agora.{" "}
            <button type="button" className="s-btn s-btn-linha s-btn-peq" onClick={carregar}>
              Tentar de novo
            </button>
          </p>
        )}

        {semNinguem && (
          <>
            <p className="cd-vazio">
              A lista dos candidatos ainda está sendo fechada. O número da chapa é o de
              cima — leve esse.
            </p>
            {/* Quem abriu a página do número está a um toque de virar militante:
                o convite é o mesmo que fecha todas as outras rotas. */}
            <div className="cd-convite">
              <Link href="/queroajudar" prefetch={false} className="s-btn s-btn-ouro s-btn-peq">
                Quero ajudar
              </Link>
              <Link href="/propostas" prefetch={false} className="s-link">
                Ler o plano de governo
              </Link>
            </div>
          </>
        )}

        {secoes.map((s) => (
          <SecaoCargo
            key={s.chave}
            s={s}
            registro={acabou}
            naColinha={naColinha}
            aoAlternar={alternar}
            podeCompartilhar={podeCompartilhar}
            gerando={gerando}
            aoCompartilhar={compartilharUm}
          />
        ))}

        {/* Cargo fora da colinha (sem cargo, municipal): continua tendo número,
            e alguém pode estar procurando justamente por ele. */}
        {outros.length > 0 && (
          <section className="cd-secao">
            <h2 className="cd-secao-titulo">Também na chapa</h2>
            <div className="cd-grade">
              {outros.map((c) => (
                <Ficha
                  key={c.id}
                  c={c}
                  podeCompartilhar={podeCompartilhar}
                  gerando={gerando === c.id}
                  aoCompartilhar={() => compartilharUm(c)}
                />
              ))}
            </div>
          </section>
        )}

        {linhas.length > 0 && !acabou && (
          <section className="cd-secao cd-colinha" aria-labelledby="cd-colinha-titulo">
            <div className="cd-secao-topo">
              <h2 id="cd-colinha-titulo" className="cd-secao-titulo">Sua colinha</h2>
            </div>
            <p className="cd-nota">
              Só quem recebe o voto entra aqui — vice e suplente vão junto com o titular.
              Cargo sem escolha sai em branco, para você preencher à caneta.
            </p>
            <ColinhaImpressa linhas={linhas} copias={copias} />
            <div className="cd-colinha-acoes">
              <fieldset className="cd-copias">
                <legend>Na folha A4</legend>
                <label>
                  <input type="radio" name="copias" checked={copias === 4} onChange={() => setCopias(4)} />
                  4 para recortar
                </label>
                <label>
                  <input type="radio" name="copias" checked={copias === 1} onChange={() => setCopias(1)} />
                  1 só
                </label>
              </fieldset>
              <button type="button" className="s-btn s-btn-ouro s-btn-peq" onClick={() => window.print()}>
                Imprimir
              </button>
              {podeCompartilhar && (
                <button
                  type="button"
                  className="s-btn s-btn-linha s-btn-peq"
                  onClick={compartilharColinha}
                  disabled={gerando === "colinha" || naColinha.size === 0}
                >
                  <Icon name="whatsapp" size={16} />
                  {gerando === "colinha" ? "Montando…" : "Compartilhar imagem"}
                </button>
              )}
            </div>
          </section>
        )}

        {aviso && <p className="cd-aviso">{aviso}</p>}

        {fase === "votacao" && temAlguem && (
          <p className="cd-trava">
            <strong>Hoje é dia de votar.</strong> Os números continuam aqui para você
            conferir e imprimir, mas a arte de compartilhar está fechada: publicar
            propaganda nova na internet no dia da eleição é proibido.
          </p>
        )}
      </div>
      <style>{css}</style>
    </div>
    </PaginaDoSite>
  );
}

/* ===================== peças ===================== */

/** Uma seção de cargo: os titulares, cada um com os vices embaixo. */
const SecaoCargo: React.FC<{
  s: Secao;
  /** a eleição passou: sem colinha, só quem disputou */
  registro: boolean;
  naColinha: Set<string>;
  aoAlternar: (chave: CargoColinha, id: string) => void;
  podeCompartilhar: boolean;
  gerando: string | null;
  aoCompartilhar: (c: Candidato) => void;
}> = ({ s, registro, naColinha, aoAlternar, podeCompartilhar, gerando, aoCompartilhar }) => {
  const vagas = VAGAS[s.chave];
  const direto = entraDireto(s);
  const temTitular = titularesDe(s).length > 0;
  const nota = registro || !temTitular
    ? null
    : direto
      ? "Já na sua colinha."
      : vagas > 1
        ? `Escolha até ${vagas} para a sua colinha — a urna pede ${vagas} votos para o Senado.`
        : "Escolha 1 para a sua colinha.";

  return (
    <section className={`cd-secao${s.entradas.length === 1 ? " cd-secao-solo" : ""}`}>
      <h2 className="cd-secao-titulo">
        {TITULO_SECAO[s.chave]}
        {vagas > 1 && !registro && <span className="cd-vagas"> · {vagas} vagas</span>}
      </h2>
      {nota && <p className="cd-nota">{nota}</p>}
      <div className="cd-grade">
        {s.entradas.map((e) => (
          <div key={(e.titular ?? e.vices[0]).id} className="cd-entrada">
            {e.titular && (
              <Ficha
                c={e.titular}
                podeCompartilhar={podeCompartilhar}
                gerando={gerando === e.titular.id}
                aoCompartilhar={() => aoCompartilhar(e.titular!)}
                escolha={
                  direto || registro
                    ? undefined
                    : {
                        marcado: naColinha.has(e.titular.id),
                        aoMarcar: () => aoAlternar(s.chave, e.titular!.id),
                      }
                }
                naColinha={!registro && direto && naColinha.has(e.titular.id)}
              />
            )}
            {e.vices.map((v) => (
              <Vice key={v.id} c={v} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

/** Botão "Conheça mais" — o link da coordenação, ou o Instagram. */
const VerRedes: React.FC<{ c: Candidato }> = ({ c }) => {
  const href = linkDasRedes(c);
  if (!href) return null;
  return (
    <a className="s-btn s-btn-linha s-btn-peq" href={href} target="_blank" rel="noopener noreferrer">
      <Icon name={c.linkRedes ? "world" : "instagram"} size={18} />
      <span>Conheça mais</span>
    </a>
  );
};

const Foto: React.FC<{ c: Candidato; tamanho: number }> = ({ c, tamanho }) =>
  /* A coluna da foto é SEMPRE desenhada, mesmo sem foto: o cartão é um grid de
     colunas fixas, e filho condicional escorrega todo mundo uma casa. Sem foto
     entra a inicial. <img> e não <Image>: export estático, `unoptimized`. */
  c.imagem ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="cd-foto" src={c.imagem} alt="" width={tamanho} height={tamanho} />
  ) : (
    <span className="cd-foto cd-foto-vazia" aria-hidden="true">
      {c.nome.trim().charAt(0).toUpperCase()}
    </span>
  );

const Ficha: React.FC<{
  c: Candidato;
  podeCompartilhar: boolean;
  gerando: boolean;
  aoCompartilhar: () => void;
  /** presente quando o eleitor escolhe quem entra neste cargo */
  escolha?: { marcado: boolean; aoMarcar: () => void };
  /** entra na colinha sem escolha — presidente, governador, cargo de um só */
  naColinha?: boolean;
}> = ({ c, podeCompartilhar, gerando, aoCompartilhar, escolha, naColinha }) => (
  <article className={`cd-ficha${escolha?.marcado || naColinha ? " cd-ficha-ouro" : ""}`}>
    <Foto c={c} tamanho={60} />
    <span className="cd-numero">{c.numero}</span>
    <div className="cd-quem">
      <h3 className="cd-nome">{c.nome}</h3>
      <p className="cd-cargo">{[c.cargo, c.partido].filter(Boolean).join(" · ")}</p>
      {naColinha && <p className="cd-selo">Na sua colinha</p>}
    </div>
    <div className="cd-acoes">
      {escolha && (
        <button
          type="button"
          className={`s-btn s-btn-peq ${escolha.marcado ? "s-btn-ouro" : "s-btn-linha"}`}
          aria-pressed={escolha.marcado}
          onClick={escolha.aoMarcar}
        >
          {escolha.marcado && <Icon name="check" size={18} />}
          {escolha.marcado ? "Na colinha" : "Pôr na colinha"}
        </button>
      )}
      <VerRedes c={c} />
      {podeCompartilhar && (
        <button type="button" className="s-btn s-btn-linha s-btn-peq" onClick={aoCompartilhar} disabled={gerando}>
          <Icon name="whatsapp" size={18} />
          <span>{gerando ? "…" : "Compartilhar"}</span>
        </button>
      )}
    </div>
  </article>
);

/**
 * Vice ou suplente: embaixo do titular, menor, e o cartão inteiro é o link
 * para as redes. Não tem número grande nem botão de colinha — o voto dele é o
 * do titular.
 */
const Vice: React.FC<{ c: Candidato }> = ({ c }) => {
  const href = linkDasRedes(c);
  const miolo = (
    <>
      <Foto c={c} tamanho={40} />
      <div className="cd-quem">
        <p className="cd-vice-cargo">{c.cargo}</p>
        <p className="cd-vice-nome">{c.nome}</p>
      </div>
      {href && (
        <span className="cd-vice-redes">
          Conheça mais <Icon name="chevronRight" size={14} />
        </span>
      )}
    </>
  );
  return href ? (
    <a className="cd-vice" href={href} target="_blank" rel="noopener noreferrer">
      {miolo}
    </a>
  ) : (
    <div className="cd-vice">{miolo}</div>
  );
};

/* ===================== estilos ===================== */

const css = `
  .cd-fundo { background: ${C.paper}; color: ${C.ink}; }
  .cd-main { padding-block: 20px clamp(48px, 7vw, 80px); }

  .cd-chapa { display: flex; align-items: center; gap: 22px; margin: 0 0 28px; padding: 18px 22px; background: ${C.gold}; color: ${C.ink}; border-radius: ${RAIO.g}px; }
  .cd-chapa-numero { font-family: ${FONT_ALFA}; font-size: clamp(56px, 12vw, 80px); line-height: 1; margin: 0; }
  .cd-chapa-cargo { margin: 0; font-size: 15px; }
  .cd-chapa-nome { margin: 0 0 8px; font-size: 19px; line-height: 1.25; font-weight: 800; }
  .cd-chapa-nome:last-child { margin-bottom: 0; }

  .cd-secao { margin: 0 0 clamp(32px, 5vw, 48px); }
  .cd-secao-titulo { margin: 0 0 14px; font-family: ${FONT_ALFA}; font-weight: 400; font-size: ${TITULO.bloco}; line-height: 1.14; color: ${C.ink}; }
  .cd-vagas { font-family: inherit; color: ${C.suave}; }
  .cd-nota { max-width: ${LARGURA.texto}; margin: -6px 0 14px; font-size: 16px; line-height: 1.5; color: ${C.suave}; }
  .cd-grade { display: grid; gap: 14px; }
  .cd-entrada { display: grid; gap: 8px; align-content: start; min-width: 0; }

  .cd-foto { width: 60px; height: 60px; object-fit: cover; flex: 0 0 auto; border-radius: 50%; background: ${C.fundo}; }
  .cd-foto-vazia { display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: ${C.suave}; }
  .cd-ficha {
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "foto quem numero" "acoes acoes acoes";
    align-items: center; gap: 12px 14px; padding: 16px; background: ${C.paper}; border: ${borda()}; border-radius: ${RAIO.g}px;
  }
  .cd-ficha > .cd-foto { grid-area: foto; }
  .cd-ficha-ouro { background: ${C.ouroClaro}; border-color: ${C.goldDim}; }
  .cd-numero { grid-area: numero; min-width: 2ch; font-family: ${FONT_ALFA}; font-size: clamp(30px, 4vw, 38px); line-height: 1; text-align: right; color: ${C.ink}; }
  .cd-quem { grid-area: quem; min-width: 0; }
  .cd-nome { margin: 0 0 2px; font-size: 19px; line-height: 1.25; font-weight: 800; letter-spacing: -.01em; overflow-wrap: anywhere; }
  .cd-cargo { margin: 0; font-size: 15.5px; line-height: 1.35; color: ${C.suave}; }
  .cd-selo { margin: 4px 0 0; font-size: 15px; font-weight: 700; color: ${C.goldDim}; }
  .cd-acoes { grid-area: acoes; display: flex; flex-wrap: wrap; gap: 8px; }
  .cd-acoes:empty { display: none; }
  .cd-acoes .s-btn { flex: 1 1 140px; }

  /* Vice e suplente: menor, embaixo do titular, o cartão inteiro é o link. */
  .cd-vice { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; margin-left: 20px; padding: 8px 14px; min-height: 44px; background: ${C.fundo}; border-radius: ${RAIO.m}px; color: ${C.ink}; text-decoration: none; }
  a.cd-vice:hover { background: ${C.ouroClaro}; }
  a.cd-vice:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
  .cd-vice .cd-foto { width: 40px; height: 40px; }
  .cd-vice .cd-quem { grid-area: auto; }
  .cd-vice-cargo { margin: 0; font-size: 14.5px; line-height: 1.3; color: ${C.suave}; }
  .cd-vice-nome { margin: 1px 0 0; font-size: 16.5px; line-height: 1.25; font-weight: 700; }
  .cd-vice-redes { display: inline-flex; align-items: center; gap: 2px; font-size: 15px; font-weight: 600; white-space: nowrap; }

  .cd-colinha-acoes { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 16px; }
  .cd-copias { display: flex; flex-wrap: wrap; gap: 0 16px; margin: 0; padding: 0; border: 0; min-width: 0; }
  .cd-copias legend { padding: 0; margin-bottom: 2px; font-size: 15px; font-weight: 700; }
  .cd-copias label { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 16px; cursor: pointer; }
  .cd-copias input { width: 20px; height: 20px; accent-color: ${C.ink}; }

  .cd-vazio, .cd-aviso, .cd-trava { max-width: ${LARGURA.texto}; margin: 0 0 22px; font-size: 17px; line-height: 1.6; color: ${C.suave}; }
  .cd-aviso, .cd-trava { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; max-width: none; padding: 14px 18px; color: ${C.ink}; background: ${C.ouroClaro}; border-radius: ${RAIO.m}px; }
  .cd-convite { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin: 0 0 30px; }

  @media (min-width: ${PONTOS.computador}px) {
    /* Presidente e governador, um de cada, dividem a linha; quem tem mais gente ocupa a sua. */
    .cd-main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 16px; align-items: start; }
    .cd-main > * { grid-column: 1 / -1; min-width: 0; }
    .cd-main > .cd-secao-solo { grid-column: auto; }
    .cd-secao:not(.cd-secao-solo) .cd-grade { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  }

  /* No papel sai só a colinha: o resto da página é tela. */
  @media print {
    html, body { background: #fff !important; }
    .ab { display: none !important; }
    .cd-fundo { background: #fff; color: ${C.ink}; }
    .cd-main { display: block; max-width: none; padding: 0; }
    .cd-main > :not(.cd-colinha) { display: none !important; }
    .cd-colinha > :not(.cd-impressao) { display: none !important; }
  }
`;
