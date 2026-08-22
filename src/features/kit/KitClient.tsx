"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { canvasParaBlob } from "@/lib/cordelCanvas";
import { faseEm } from "@/lib/eleicao";
import { RECADOS } from "./calendario";
import { comoPeca, obterPecasDoPainel } from "@/lib/api/kit";
import { pecas as pecasFixas, type Peca } from "./data";
import { slugDe, SITE, CHAVE_NOME } from "@/lib/atribuicao";
import { FORMATOS, gerarCartao, nomeArquivo, type Formato } from "./cartao";


/**
 * A Munição do mutirão digital — o antigo “kit de compartilhamento”.
 *
 * O manual (§5.5) descreve o mutirão como coordenação manual no WhatsApp:
 * alguém posta a arte no grupo, todo mundo baixa e cola o texto na mão. Esta
 * página é essa coordenação virando ferramenta — e, principalmente, é onde o
 * **link de indicação** entra: cada peça compartilhada carrega o `?de=` de quem
 * compartilhou, que é o campo que o painel grava desde a inscrição.
 *
 * Sem isso, o alcance existe e ninguém sabe de quem foi.
 */
export default function KitClient() {
  const [nome, setNome] = useState("");
  const [formato, setFormato] = useState<Formato>("9:16");
  const [gerando, setGerando] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const urlPreview = useRef<Map<string, string>>(new Map());

  /* A fase da eleição é lida no navegador, nunca no build: num export estático
     a data de compilação ficaria congelada, e no dia 4 de outubro a página ainda
     estaria dizendo o que dizia em agosto. Começa em null para o HTML gerado e
     o primeiro render do cliente baterem. */
  const [recado, setRecado] = useState<(typeof RECADOS)[keyof typeof RECADOS]>(null);
  useEffect(() => {
    setRecado(RECADOS[faseEm()]);
  }, []);

  /* As peças da semana, criadas pela coordenação na tela de Produção. Vêm
     **antes** das fixas: o fato de hoje é o que rende agora, e as do plano
     seguem valendo embaixo. Se a rede falhar, a página continua com as fixas —
     o mutirão não pode parar por causa de um endpoint fora do ar. */
  const [pecasDoPainel, setPecasDoPainel] = useState<Peca[]>([]);
  useEffect(() => {
    obterPecasDoPainel()
      .then((lista) => setPecasDoPainel(lista.map(comoPeca)))
      .catch(() => { /* segue com as peças fixas */ });
  }, []);

  const pecas = useMemo(() => [...pecasDoPainel, ...pecasFixas], [pecasDoPainel]);

  /* O nome fica no aparelho, não no servidor: é o próprio militante dizendo
     quem é para receber o crédito. Nada disso sai do navegador até ele
     compartilhar. */
  useEffect(() => {
    try {
      setNome(localStorage.getItem(CHAVE_NOME) ?? "");
    } catch {
      /* aba anônima: segue sem lembrar */
    }
  }, []);

  const guardarNome = useCallback((v: string) => {
    setNome(v);
    try {
      localStorage.setItem(CHAVE_NOME, v);
    } catch {
      /* idem */
    }
  }, []);

  const slug = useMemo(() => slugDe(nome), [nome]);

  const linkDe = useCallback(
    (destino: string) => {
      const url = new URL(destino, SITE);
      if (slug) url.searchParams.set("de", slug);
      return url.toString();
    },
    [slug],
  );

  const textoDe = useCallback(
    (p: Peca) => `${p.legenda}\n${linkDe(p.destino)}`,
    [linkDe],
  );

  const copiar = useCallback(
    async (p: Peca) => {
      try {
        await navigator.clipboard.writeText(textoDe(p));
        setCopiado(p.id);
        window.setTimeout(() => setCopiado((c) => (c === p.id ? null : c)), 2200);
      } catch {
        setAviso("Não deu pra copiar sozinho. Selecione o texto e copie na mão.");
      }
    },
    [textoDe],
  );

  const baixar = useCallback(
    async (p: Peca) => {
      setGerando(p.id);
      setAviso(null);
      try {
        const canvas = await gerarCartao(p, formato);
        const blob = await canvasParaBlob(canvas);
        if (!blob) throw new Error("sem blob");

        const arquivo = new File([blob], nomeArquivo(p, formato), { type: "image/png" });

        /* No celular, compartilhar abre o WhatsApp direto com imagem e texto —
           que é o caminho real do mutirão. Mas `canShare` dizer que sim não
           garante que vai: sem gesto do usuário, em navegador que anuncia a API
           e não a entrega, ou com o recurso desligado, o `share` rejeita. Aí a
           peça tem que **baixar assim mesmo** — militante no meio do mutirão
           não pode ficar sem a arte por causa de detalhe de navegador.
           Só o cancelamento dele encerra em silêncio. */
        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
          try {
            await navigator.share({ files: [arquivo], text: textoDe(p) });
            return;
          } catch (e) {
            if ((e as Error)?.name === "AbortError") return; // ele fechou o menu
            /* qualquer outra falha: cai no download abaixo */
          }
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = arquivo.name;
        a.click();
        /* Soltar a URL no tique seguinte, não na mesma linha: alguns
           navegadores só começam a leitura depois do clique voltar, e revogar
           imediatamente aborta o download que acabou de começar. */
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch {
        setAviso("Não consegui montar a arte agora. Tente de novo.");
      } finally {
        setGerando(null);
      }
    },
    [formato, textoDe],
  );

  useEffect(() => {
    const mapa = urlPreview.current;
    return () => mapa.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  return (
    <div
      style={{
        colorScheme: "dark",
        background: C.night,
        color: C.cream,
        fontFamily: FONT_BITTER,
        minHeight: "100dvh",
        overflowX: "clip",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 20px 90px" }}>
        <Link href="/" style={voltar}>
          <Icon name="arrowLeft" size={17} />
          Voltar
        </Link>

        <header style={{ margin: "16px 0 30px" }}>
          <p style={kicker}>Mutirão digital</p>
          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(30px, 8vw, 46px)",
              lineHeight: 1.04,
              margin: "0 0 14px",
              color: C.cream,
              textShadow: `3px 3px 0 ${C.ink}`,
              textWrap: "balance",
            }}
          >
            Munição
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: 0, maxWidth: "58ch", opacity: 0.92 }}>
            {recado?.bloqueiaPecas ? (
              <>
                As peças continuam aqui para consulta — cada número com a página do plano. O que
                muda hoje está no aviso abaixo.
              </>
            ) : (
              <>
                Escolha a peça, pegue a arte e o texto pronto, e publique. Toda peça leva o número
                com a página do plano — a gente não espalha o que não dá pra conferir.
              </>
            )}
          </p>
        </header>

        {recado && (
          <section
            role={recado.trava ? "alert" : "status"}
            style={{
              border: `3px solid ${recado.trava ? C.erroBorda : C.gold}`,
              background: recado.trava ? "rgba(194,84,63,.14)" : "rgba(255,203,5,.08)",
              padding: "18px 18px",
              marginBottom: 28,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <p
              style={{
                ...kicker,
                margin: 0,
                color: recado.trava ? C.erro : C.gold2,
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: 1,
              }}
            >
              <Icon name={recado.icone} size={15} />
              {recado.fase}
            </p>
            <p style={{ margin: 0, fontFamily: FONT_ALFA, fontSize: 19, lineHeight: 1.2 }}>
              {recado.titulo}
            </p>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, opacity: 0.92 }}>
              {recado.texto}
            </p>
          </section>
        )}

        {/* ===== o link de indicação ===== */}
        <section
          style={{
            background: "rgba(246,245,239,.06)",
            border: `3px solid ${C.gold}`,
            padding: "18px 18px",
            marginBottom: 28,
          }}
        >
          <label htmlFor="kit-nome" style={{ ...kicker, display: "block", color: C.gold2 }}>
            Seu nome (pra você levar o crédito)
          </label>
          <input
            id="kit-nome"
            type="text"
            value={nome}
            onChange={(e) => guardarNome(e.target.value)}
            placeholder="Ex.: João Silva"
            autoComplete="name"
            style={{
              width: "100%",
              minHeight: 48,
              padding: "10px 12px",
              background: C.night,
              color: C.cream,
              border: `2px solid ${C.goldDim}`,
              fontFamily: FONT_BITTER,
              fontSize: 16,
              marginTop: 8,
            }}
          />
          <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, opacity: 0.85 }}>
            {slug ? (
              <>
                Quem se inscrever pelo seu link vai aparecer pra coordenação como{" "}
                <b style={{ color: C.gold2, fontFamily: FONT_ELITE }}>{slug}</b>. É assim que o
                movimento sabe quem trouxe quem.
              </>
            ) : (
              <>
                Sem o nome, as peças funcionam igual — só não dá pra saber que a pessoa veio por
                você. Fica guardado só neste aparelho.
              </>
            )}
          </p>
        </section>

        {/* ===== formato ===== */}
        <div
          style={{
            display: recado?.bloqueiaPecas ? "none" : "flex",
            alignItems: "center", gap: 10, marginBottom: 22, flexWrap: "wrap",
          }}
        >
          <span style={{ ...kicker, margin: 0 }}>Formato</span>
          {(Object.keys(FORMATOS) as Formato[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormato(f)}
              aria-pressed={formato === f}
              style={{
                minHeight: 44,
                padding: "8px 15px",
                cursor: "pointer",
                fontFamily: FONT_ELITE,
                fontSize: 13,
                letterSpacing: 1.2,
                background: formato === f ? C.gold : "transparent",
                color: formato === f ? C.ink : C.cream,
                border: `2px solid ${formato === f ? C.gold : C.goldDim}`,
              }}
            >
              {FORMATOS[f].rotulo}
            </button>
          ))}
        </div>

        {aviso && (
          <p
            role="status"
            style={{
              background: C.erro,
              color: C.ink,
              border: `3px solid ${C.erroBorda}`,
              padding: "11px 14px",
              margin: "0 0 20px",
              fontSize: 15,
            }}
          >
            {aviso}
          </p>
        )}

        {/* ===== as peças ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {pecas.map((p) => (
            <article
              key={p.id}
              style={{
                background: "rgba(246,245,239,.05)",
                border: `3px solid ${C.goldDim}`,
                padding: "18px 17px",
                display: "flex",
                flexDirection: "column",
                gap: 13,
              }}
            >
              <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto",
                    width: 42,
                    height: 42,
                    display: "grid",
                    placeItems: "center",
                    background: C.gold,
                    color: C.ink,
                    border: `3px solid ${C.ink}`,
                  }}
                >
                  <Icon name={p.icone} size={21} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ ...kicker, margin: "0 0 2px" }}>{p.tema}</p>
                  <p
                    style={{
                      fontFamily: FONT_ALFA,
                      fontSize: "clamp(22px, 5.5vw, 30px)",
                      lineHeight: 1,
                      color: C.gold,
                      margin: 0,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {p.numero}
                  </p>
                </div>
              </header>

              <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.5 }}>{p.frase}</p>

              <p
                style={{
                  margin: 0,
                  fontFamily: FONT_ELITE,
                  fontSize: 12,
                  letterSpacing: 1.2,
                  color: C.gold2,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Icon name="book" size={14} />
                {p.fonte}
              </p>

              <details style={{ borderTop: `1px solid rgba(246,245,239,.16)`, paddingTop: 12 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    listStyle: "none",
                    fontFamily: FONT_ELITE,
                    fontSize: 12.5,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: C.gold2,
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Icon name="search" size={15} />
                  Ver o texto que vai junto
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: FONT_BITTER,
                    fontSize: 15,
                    lineHeight: 1.55,
                    background: "rgba(20,17,12,.6)",
                    border: `1px solid rgba(246,245,239,.14)`,
                    padding: "12px 13px",
                    margin: "10px 0 0",
                  }}
                >
                  {textoDe(p)}
                </pre>
              </details>

              {/* Na fase que bloqueia, some a arte E o texto. Deixar "copiar"
                  ao lado de um aviso dizendo "hoje não se publica" é mensagem
                  contraditória — e a peça continua legível acima, para quem só
                  quer conferir o número. */}
              {recado?.bloqueiaPecas ? (
                <p style={{ margin: 0, fontFamily: FONT_ELITE, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold2, opacity: 0.8 }}>
                  Peça fechada hoje
                </p>
              ) : (
                <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => baixar(p)} disabled={gerando === p.id} style={botaoOuro}>
                    <Icon name={gerando === p.id ? "clock" : "broadcast"} size={17} />
                    {gerando === p.id ? "Montando…" : "Pegar a arte"}
                  </button>
                  <button type="button" onClick={() => copiar(p)} style={botaoVazado}>
                    <Icon name={copiado === p.id ? "star" : "book"} size={17} />
                    {copiado === p.id ? "Copiado!" : "Copiar o texto"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        <section
          style={{
            marginTop: 30,
            border: `3px solid ${C.goldDim}`,
            padding: "18px 17px",
          }}
        >
          <h2 style={{ fontFamily: FONT_ALFA, fontSize: 20, margin: "0 0 10px", color: C.gold }}>
            Como o mutirão funciona
          </h2>
          <ol style={{ margin: 0, paddingLeft: 20, listStyle: "decimal", display: "flex", flexDirection: "column", gap: 8 }}>
            <li style={{ fontSize: 15.5, lineHeight: 1.55 }}>
              Combine o horário no grupo. Todo mundo postando junto rende muito mais que espalhado
              no dia.
            </li>
            <li style={{ fontSize: 15.5, lineHeight: 1.55 }}>
              Poste a arte com o texto, e depois volte pra responder os comentários — nunca pelo
              ódio, sempre com a página do plano na mão.
            </li>
            <li style={{ fontSize: 15.5, lineHeight: 1.55 }}>
              Não invente número. Se perguntarem algo que não está na peça, mande a pessoa pro
              plano em vez de chutar.
            </li>
          </ol>
        </section>
      </div>

      <style>{`
        summary::-webkit-details-marker { display: none; }
        button:focus-visible, a:focus-visible, summary:focus-visible, input:focus-visible {
          outline: 3px solid ${C.gold}; outline-offset: 2px;
        }
        button[disabled] { opacity: .6; cursor: progress; }
      `}</style>
    </div>
  );
}

const kicker: React.CSSProperties = {
  fontFamily: FONT_ELITE,
  fontSize: 11.5,
  letterSpacing: 2.2,
  textTransform: "uppercase",
  opacity: 0.75,
  margin: "0 0 8px",
};

const voltar: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  minHeight: 44,
  fontFamily: FONT_ELITE,
  fontSize: 12.5,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: C.cream,
  textDecoration: "none",
};

const botaoBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  minHeight: 48,
  padding: "11px 17px",
  cursor: "pointer",
  fontFamily: FONT_ELITE,
  fontSize: 13,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  flex: "1 1 auto",
};

const botaoOuro: React.CSSProperties = {
  ...botaoBase,
  background: C.gold,
  color: C.ink,
  border: `3px solid ${C.gold}`,
};

const botaoVazado: React.CSSProperties = {
  ...botaoBase,
  background: "transparent",
  color: C.cream,
  border: `3px solid ${C.goldDim}`,
};
