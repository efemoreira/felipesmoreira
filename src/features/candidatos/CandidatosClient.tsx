"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { canvasParaBlob } from "@/lib/cordelCanvas";
import { faseEm, type Fase } from "@/lib/eleicao";
import { GRUPOS, obterCandidatos, type Candidato } from "@/lib/api/candidatos";
import {
  CABEM_POR_ARTE,
  gerarColinha,
  gerarFicha,
  nomeArquivoColinha,
  nomeArquivoFicha,
} from "./colinha";

/**
 * Em que número votar — a colinha.
 *
 * A lista vem do painel pela rede, e não do build: nome de urna e número saem
 * do registro no TSE e mudam até a véspera. Lista no código é lista que exige um
 * deploy para corrigir um dígito.
 *
 * **A trava do calendário eleitoral mora aqui, no botão.** Compartilhar arte com
 * número é propaganda; no dia da votação publicar propaganda nova na internet é
 * proibido, e depois dela não quer dizer mais nada. A LISTA continua visível
 * nos dois casos — consultar não é publicar, e o eleitor que abrir a página no
 * domingo precisa achar o número.
 *
 * É a mesma trava que a Munição aplica às peças, pelo mesmo motivo e no mesmo
 * lugar: onde a ação acontece, e não num documento que ninguém relê.
 */
export default function CandidatosClient() {
  const [lista, setLista] = useState<Candidato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  /* Começa null e só é preenchida no efeito: num export estático a fase
     decidida no build congelaria na data em que o site foi publicado. */
  const [fase, setFase] = useState<Fase | null>(null);

  useEffect(() => {
    setFase(faseEm());
    obterCandidatos()
      .then(setLista)
      .catch(() => {
        /* A rede falhou. A página fica vazia, e é melhor assim do que mostrar
           número velho guardado — número errado na urna não tem conserto. */
      })
      .finally(() => setCarregando(false));
  }, []);

  const podeCompartilhar = fase === "campanha" || fase === "reta-final";

  const porGrupo = useMemo(
    () =>
      GRUPOS.map((g) => ({
        ...g,
        pessoas: lista.filter((c) => c.grupos.includes(g.id)),
      })).filter((g) => g.pessoas.length > 0),
    [lista],
  );

  const escolhidos = useMemo(() => lista.filter((c) => c.grupos.includes("escolhidos")), [lista]);

  /** Compartilha a arte pronta, ou baixa quando o aparelho não tem o menu. */
  const entregar = useCallback(async (canvas: HTMLCanvasElement, nome: string, texto: string) => {
    const blob = await canvasParaBlob(canvas);
    if (!blob) throw new Error("sem blob");
    const arquivo = new File([blob], nome, { type: "image/png" });

    /* `canShare` dizer que sim não garante que o `share` vai — sem gesto do
       usuário, ou em navegador que anuncia a API e não a entrega, ele rejeita.
       Aí a arte tem que baixar assim mesmo. Só o cancelamento encerra calado. */
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], text: texto });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
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

  const compartilharGrupo = useCallback(
    async (id: string, nome: string, pessoas: Candidato[]) => {
      setGerando(id);
      setAviso(null);
      try {
        await entregar(
          await gerarColinha(nome, pessoas),
          nomeArquivoColinha(id),
          `A colinha de ${nome} da Missão no Ceará.\nfelipesmoreira.com/candidatos`,
        );
      } catch {
        setAviso("Não consegui montar a colinha agora. Tente de novo.");
      } finally {
        setGerando(null);
      }
    },
    [entregar],
  );

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
            O número é o que você digita na urna. Toque em <strong>compartilhar</strong> para
            mandar a colinha no grupo da família — ou salve o print e leve na galeria.
          </p>
        </header>

        {carregando && <p className="cd-vazio">Carregando…</p>}

        {!carregando && lista.length === 0 && (
          <p className="cd-vazio">
            A lista ainda está sendo fechada. Volte já já — ou{" "}
            <Link href="/propostas" className="cd-elo">
              leia o plano de governo
            </Link>{" "}
            enquanto isso.
          </p>
        )}

        {escolhidos.length > 0 && (
          <section className="cd-secao">
            <h2 className="cd-secao-titulo">Comece por estes</h2>
            <div className="cd-grade">
              {escolhidos.map((c) => (
                <Ficha
                  key={c.id}
                  c={c}
                  destaque
                  podeCompartilhar={podeCompartilhar}
                  gerando={gerando === c.id}
                  aoCompartilhar={() => compartilharUm(c)}
                />
              ))}
            </div>
          </section>
        )}

        {porGrupo.map((g) => (
          <section key={g.id} className="cd-secao">
            <div className="cd-secao-topo">
              <h2 className="cd-secao-titulo">{g.nome}</h2>
              {podeCompartilhar && (
                <button
                  type="button"
                  className="cd-btn-grupo"
                  onClick={() => compartilharGrupo(g.id, g.nome, g.pessoas)}
                  disabled={gerando === g.id}
                >
                  <Icon name="whatsapp" size={15} />
                  {gerando === g.id ? "Montando…" : "Colinha do grupo"}
                </button>
              )}
            </div>
            {g.pessoas.length > CABEM_POR_ARTE && (
              <p className="cd-nota">
                A colinha leva os {CABEM_POR_ARTE} primeiros — mais que isso e o número
                deixa de ser lido de relance.
              </p>
            )}
            <div className="cd-grade">
              {g.pessoas.map((c) => (
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
        ))}

        {aviso && <p className="cd-aviso">{aviso}</p>}

        {fase === "votacao" && lista.length > 0 && (
          <p className="cd-trava">
            <strong>Hoje é dia de votar.</strong> Os números continuam aqui para você
            conferir, mas a arte de compartilhar está fechada: publicar propaganda nova
            na internet no dia da eleição é proibido.
          </p>
        )}
        {fase === "depois" && lista.length > 0 && (
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

const Ficha: React.FC<{
  c: Candidato;
  destaque?: boolean;
  podeCompartilhar: boolean;
  gerando: boolean;
  aoCompartilhar: () => void;
}> = ({ c, destaque, podeCompartilhar, gerando, aoCompartilhar }) => (
  <article className={`cd-ficha${destaque ? " cd-ficha-ouro" : ""}`}>
    <span className="cd-numero">{c.numero}</span>
    <div className="cd-quem">
      <h3 className="cd-nome">{c.nome}</h3>
      <p className="cd-cargo">
        {[c.cargo, c.partido].filter(Boolean).join(" · ")}
      </p>
      {c.instagram && (
        <a
          className="cd-arroba"
          href={`https://instagram.com/${c.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="instagram" size={15} />@{c.instagram}
        </a>
      )}
    </div>
    {podeCompartilhar && (
      <button type="button" className="cd-btn" onClick={aoCompartilhar} disabled={gerando}>
        <Icon name="whatsapp" size={16} />
        <span>{gerando ? "…" : "Compartilhar"}</span>
      </button>
    )}
  </article>
);

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

  .cd-secao { margin: 0 0 34px; }
  .cd-secao-topo { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .cd-secao-titulo {
    font-family: ${FONT_ELITE}; font-size: 13px; letter-spacing: 2.4px; text-transform: uppercase;
    color: ${C.gold2}; margin: 0 0 14px;
  }
  .cd-nota { font-size: 13.5px; opacity: .7; margin: -6px 0 12px; }

  .cd-grade { display: grid; gap: 12px; }

  .cd-ficha {
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px;
    padding: 16px 18px; background: rgba(246,245,239,.05);
    border: 3px solid rgba(255,203,5,.28);
  }
  .cd-ficha-ouro { border-color: ${C.gold}; background: rgba(255,203,5,.08); }
  .cd-numero {
    font-family: ${FONT_ALFA}; font-size: clamp(30px, 8vw, 40px); line-height: 1;
    color: ${C.gold}; min-width: 2ch;
  }
  .cd-quem { min-width: 0; }
  .cd-nome { font-family: ${FONT_ALFA}; font-size: 19px; line-height: 1.2; margin: 0 0 4px; }
  .cd-cargo { font-size: 13.5px; margin: 0; opacity: .75; }
  .cd-arroba {
    display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; min-height: 32px;
    font-size: 13.5px; color: ${C.gold2}; text-decoration: none;
  }
  .cd-arroba:hover { text-decoration: underline; }

  .cd-btn, .cd-btn-grupo {
    display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 14px;
    cursor: pointer; font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 1.4px;
    text-transform: uppercase; color: ${C.ink}; background: ${C.gold};
    border: 3px solid ${C.ink}; box-shadow: 3px 3px 0 ${C.ink};
  }
  .cd-btn:disabled, .cd-btn-grupo:disabled { opacity: .6; cursor: wait; }
  .cd-btn-grupo { margin-bottom: 14px; }

  .cd-vazio, .cd-aviso, .cd-trava {
    font-size: 15.5px; line-height: 1.7; margin: 0 0 22px;
  }
  .cd-aviso, .cd-trava {
    border: 3px solid ${C.gold}; background: rgba(255,203,5,.08); padding: 14px 16px;
  }
  .cd-elo { color: ${C.gold2}; }

  @media (max-width: 560px) {
    .cd-ficha { grid-template-columns: auto 1fr; }
    .cd-btn { grid-column: 1 / -1; justify-content: center; }
  }
`;
