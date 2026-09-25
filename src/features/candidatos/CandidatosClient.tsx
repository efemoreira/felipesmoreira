"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, FONT_BITTER, sombra } from "@/lib/theme";
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
    <div className="cd-fundo">
      <main className="cd-main">
        <Link href="/" className="cd-voltar">
          <Icon name="arrowLeft" size={16} />
          Voltar
        </Link>

        <header style={{ margin: "16px 0 30px" }}>
          <p className="cd-kicker">Em que número votar</p>
          <h1 className="cd-titulo">Nossos candidatos</h1>
          <p className="cd-chamada">
            O número é o que você digita na urna. Presidente e governador já estão na sua
            colinha; nos outros cargos, <strong>escolha quem você leva</strong> — e imprima
            ou salve no celular.
          </p>
        </header>

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
            <button type="button" className="cd-btn" onClick={carregar}>
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
              <Link href="/queroajudar" className="cd-btn">
                Quero ajudar
              </Link>
              <Link href="/propostas" className="cd-elo">
                Ler o plano de governo
              </Link>
            </div>
          </>
        )}

        {secoes.map((s) => (
          <SecaoCargo
            key={s.chave}
            s={s}
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

        {linhas.length > 0 && (
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
              <button type="button" className="cd-btn" onClick={() => window.print()}>
                Imprimir
              </button>
              {podeCompartilhar && (
                <button
                  type="button"
                  className="cd-btn"
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
        {fase === "depois" && temAlguem && (
          <p className="cd-trava">
            A eleição passou. A lista fica no ar como registro de quem disputou.
          </p>
        )}
      </main>
      <style>{css}</style>
    </div>
  );
}

/* ===================== peças ===================== */

/** Uma seção de cargo: os titulares, cada um com os vices embaixo. */
const SecaoCargo: React.FC<{
  s: Secao;
  naColinha: Set<string>;
  aoAlternar: (chave: CargoColinha, id: string) => void;
  podeCompartilhar: boolean;
  gerando: string | null;
  aoCompartilhar: (c: Candidato) => void;
}> = ({ s, naColinha, aoAlternar, podeCompartilhar, gerando, aoCompartilhar }) => {
  const vagas = VAGAS[s.chave];
  const direto = entraDireto(s);
  const temTitular = titularesDe(s).length > 0;
  const nota = !temTitular
    ? null
    : direto
      ? "Já na sua colinha."
      : vagas > 1
        ? `Escolha até ${vagas} para a sua colinha — a urna pede ${vagas} votos para o Senado.`
        : "Escolha 1 para a sua colinha.";

  return (
    <section className="cd-secao">
      <h2 className="cd-secao-titulo">
        {TITULO_SECAO[s.chave]}
        {vagas > 1 && <span className="cd-vagas"> · {vagas} vagas</span>}
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
                  direto
                    ? undefined
                    : {
                        marcado: naColinha.has(e.titular.id),
                        aoMarcar: () => aoAlternar(s.chave, e.titular!.id),
                      }
                }
                naColinha={direto && naColinha.has(e.titular.id)}
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
    <a className="cd-btn cd-btn-redes" href={href} target="_blank" rel="noopener noreferrer">
      <Icon name={c.linkRedes ? "world" : "instagram"} size={16} />
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
    <Foto c={c} tamanho={56} />
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
          className={`cd-btn cd-btn-escolha${escolha.marcado ? " cd-marcado" : ""}`}
          aria-pressed={escolha.marcado}
          onClick={escolha.aoMarcar}
        >
          {escolha.marcado ? "Na colinha ✓" : "Pôr na colinha"}
        </button>
      )}
      <VerRedes c={c} />
      {podeCompartilhar && (
        <button type="button" className="cd-btn cd-btn-leve" onClick={aoCompartilhar} disabled={gerando}>
          <Icon name="whatsapp" size={16} />
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
  .cd-fundo { min-height: 100dvh; background: ${C.night}; color: ${C.cream}; font-family: ${FONT_BITTER}; }
  .cd-main { max-width: 780px; margin: 0 auto; padding: 30px 20px 80px; }
  .cd-voltar {
    display: inline-flex; align-items: center; gap: 7px; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.gold}; text-decoration: none;
  }
  .cd-kicker {
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
    color: ${C.gold2}; margin: 0 0 10px;
  }
  .cd-titulo {
    font-family: ${FONT_ALFA}; font-size: clamp(30px, 8vw, 46px); line-height: 1.04;
    margin: 0 0 14px; text-shadow: 3px 3px 0 ${C.ink}; text-wrap: balance;
  }
  .cd-chamada { font-size: 16.5px; line-height: 1.6; margin: 0; max-width: 58ch; opacity: .92; }

  .cd-chapa {
    display: flex; align-items: center; gap: 18px; margin: 0 0 30px; padding: 16px 18px;
    background: ${C.gold}; color: ${C.ink};
    border: ${BORDA}px solid ${C.ink}; box-shadow: ${sombra("cartao", C.sombraNoite)};
  }
  .cd-chapa-numero {
    font-family: ${FONT_ALFA}; font-size: clamp(56px, 16vw, 84px); line-height: 1; margin: 0;
    text-shadow: 3px 3px 0 rgba(24,18,3,.25);
  }
  .cd-chapa-cargo {
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 2.4px; text-transform: uppercase;
    margin: 0; opacity: .8;
  }
  .cd-chapa-nome { font-family: ${FONT_ALFA}; font-size: 17px; line-height: 1.2; margin: 0 0 8px; }
  .cd-chapa-nome:last-child { margin-bottom: 0; }

  .cd-secao { margin: 0 0 34px; }
  .cd-secao-topo { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .cd-secao-titulo {
    font-family: ${FONT_ELITE}; font-size: 13px; letter-spacing: 2.4px; text-transform: uppercase;
    color: ${C.gold2}; margin: 0 0 14px;
  }
  .cd-nota { font-size: 13.5px; opacity: .7; margin: -6px 0 12px; }

  .cd-grade { display: grid; gap: 12px; }

  .cd-foto {
    width: 56px; height: 56px; object-fit: cover; flex: 0 0 auto;
    border: ${BORDA}px solid ${C.ink}; background: rgba(246,245,239,.08);
  }
  .cd-foto-vazia {
    display: inline-flex; align-items: center; justify-content: center;
    font-family: ${FONT_ALFA}; font-size: 22px; color: ${C.gold2};
  }
  .cd-ficha {
    display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 14px;
    padding: 16px 18px; background: rgba(246,245,239,.05);
    border: ${BORDA}px solid rgba(255,203,5,.28);
  }
  .cd-ficha-ouro { border-color: ${C.gold}; background: rgba(255,203,5,.08); }
  .cd-numero {
    font-family: ${FONT_ALFA}; font-size: clamp(30px, 8vw, 40px); line-height: 1;
    color: ${C.gold}; min-width: 2ch;
  }
  .cd-quem { min-width: 0; }
  .cd-nome { font-family: ${FONT_ALFA}; font-size: 19px; line-height: 1.2; margin: 0 0 4px; }
  .cd-cargo { font-size: 13.5px; margin: 0; opacity: .75; }
  .cd-selo {
    display: inline-block; margin: 6px 0 0; font-family: ${FONT_ELITE}; font-size: 11px;
    letter-spacing: 1.6px; text-transform: uppercase; color: ${C.gold};
  }
  .cd-vagas { opacity: .75; }

  .cd-entrada { display: grid; gap: 6px; }
  .cd-acoes { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }

  /* Vice e suplente: menor, embaixo do titular, o cartão inteiro é o link. */
  .cd-vice {
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px;
    margin-left: 26px; padding: 10px 14px; min-height: 44px;
    background: rgba(246,245,239,.03); border: ${BORDA}px solid rgba(255,203,5,.16);
    color: ${C.cream}; text-decoration: none;
  }
  a.cd-vice:hover { border-color: ${C.gold2}; }
  a.cd-vice:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 2px; }
  .cd-vice .cd-foto { width: 40px; height: 40px; }
  .cd-vice-cargo {
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase;
    margin: 0; opacity: .7;
  }
  .cd-vice-nome { font-family: ${FONT_ALFA}; font-size: 16px; line-height: 1.2; margin: 2px 0 0; }
  .cd-vice-redes {
    display: inline-flex; align-items: center; gap: 4px; font-size: 13.5px; color: ${C.gold2};
    white-space: nowrap;
  }

  .cd-btn, .cd-btn-grupo {
    display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 14px;
    cursor: pointer; font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 1.4px;
    text-transform: uppercase; color: ${C.ink}; background: ${C.gold};
    border: ${BORDA}px solid ${C.ink}; box-shadow: ${sombra("rente", C.ink)};
  }
  .cd-btn:disabled, .cd-btn-grupo:disabled { opacity: .6; cursor: wait; }
  .cd-btn-grupo { margin-bottom: 14px; }
  .cd-acoes .cd-btn { justify-content: center; text-decoration: none; }
  .cd-btn-redes, .cd-btn-leve { background: transparent; color: ${C.gold2}; border-color: ${C.gold2}; box-shadow: none; }
  .cd-btn-escolha { background: transparent; color: ${C.cream}; border-color: ${C.cream}; box-shadow: none; }
  .cd-btn-escolha.cd-marcado { background: ${C.gold}; color: ${C.ink}; border-color: ${C.ink}; box-shadow: ${sombra("rente", C.ink)}; }

  .cd-colinha-acoes { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 16px; }
  .cd-copias {
    display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; padding: 0; border: 0; min-width: 0;
  }
  .cd-copias legend {
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase;
    opacity: .75; padding: 0; margin-bottom: 4px;
  }
  .cd-copias label { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 16px; cursor: pointer; }
  .cd-copias input { width: 20px; height: 20px; accent-color: ${C.gold}; }

  .cd-vazio, .cd-aviso, .cd-trava {
    font-size: 15.5px; line-height: 1.7; margin: 0 0 22px;
  }
  .cd-aviso, .cd-trava {
    border: ${BORDA}px solid ${C.gold}; background: rgba(255,203,5,.08); padding: 14px 16px;
  }
  .cd-elo { color: ${C.gold2}; }
  .cd-convite { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin: 0 0 30px; }
  .cd-convite .cd-btn { text-decoration: none; }

  @media (max-width: 560px) {
    .cd-ficha { grid-template-columns: auto auto 1fr; }
    .cd-acoes { grid-column: 1 / -1; }
    .cd-vice { margin-left: 14px; }
  }

  /* No papel sai só a colinha: o resto da página é tela. */
  @media print {
    html, body { background: #fff !important; }
    .cd-fundo { background: #fff; color: ${C.ink}; min-height: 0; }
    .cd-main { max-width: none; padding: 0; }
    .cd-main > :not(.cd-colinha) { display: none !important; }
    .cd-colinha > :not(.cd-impressao) { display: none !important; }
  }
`;
