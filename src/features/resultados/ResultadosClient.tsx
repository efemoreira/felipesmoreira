"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { FONT_DADOS, PAINEL_DADOS as P, fileteDados } from "@/lib/theme";
import { carregarResumo, useRecurso } from "./dados";
import { Carregando, kicker } from "./pecas";
import Explorador from "./explorador/Explorador";
import { escreverEndereco, lerEndereco, normalizar, type Caminho, type Opcoes } from "./explorador/niveis";
import Conversao from "./abas/Conversao";
import Legenda from "./abas/Legenda";
import Cadeiras from "./abas/Cadeiras";
import Candidatos from "./abas/Candidatos";
import Adversarios from "./abas/Adversarios";
import Sobre from "./abas/Sobre";
import Decisoes from "./abas/Decisoes";
import Partidos from "./abas/Partidos";

/**
 * /resultados — o estudo do resultado de 2026 para o Missão.
 *
 * Ferramenta interna (sem indexação, como a Munição): os números vêm do TSE e
 * estão processados em `public/resultados-2026/`, gerados pelo projeto de
 * análise. A tela de entrada é o Explorador (o mapa, de Brasil a bairro); as
 * outras abas são análises. Tudo fica no `#` da URL para o link circular:
 * `#explorar/nordeste/ce/13897/ALDEOTA`, `#adversarios/sp`. Os links das abas
 * antigas (`#estado/sp`, `#bairros/ce/13897/ALDEOTA`) abrem o mesmo lugar no
 * Explorador.
 */

const ANALISES = [
  ["decisoes", "Decisões"],
  ["candidatos", "Candidatos"],
  ["adversarios", "Adversários"],
  ["partidos", "Partidos"],
  ["conversao", "Renan → Missão"],
  ["legenda", "Legenda"],
  ["cadeiras", "Cadeiras"],
  ["sobre", "Sobre os dados"],
] as const;
type Aba = "explorar" | (typeof ANALISES)[number][0];
const ehAba = (a: string): a is Aba => a === "explorar" || ANALISES.some(([k]) => k === a);

const carregar = () => carregarResumo();
const enderecoAba = (a: string, u: string, r: string[] = []) => `#${[a, u, ...r].map(encodeURIComponent).join("/")}`;

export default function ResultadosClient() {
  const resumo = useRecurso("resumo", carregar);
  const [aba, setAba] = useState<Aba>("explorar");
  const [uf, setUfEstado] = useState("ce");
  const [caminho, setCaminho] = useState<Caminho>({});
  const [opcoes, setOpcoes] = useState<Opcoes>({});

  /* aba, lugar e opções no endereço */
  useEffect(() => {
    const ler = () => {
      const e = lerEndereco(location.hash);
      if (!ehAba(e.aba)) return;
      setAba(e.aba);
      if (e.uf && e.uf !== "zz") setUfEstado(e.uf);
      if (e.aba === "explorar") {
        setCaminho(e.caminho);
        setOpcoes(e.opcoes);
        /* link antigo: reescreve no formato novo, sem criar entrada no histórico */
        const novo = escreverEndereco(e.caminho, e.opcoes);
        if (location.hash && location.hash !== novo) history.replaceState(null, "", novo);
      }
    };
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, []);

  /* descer no mapa cria entrada no histórico: o "voltar" do celular sobe um nível */
  const irPara = useCallback(
    (c: Caminho) => {
      const norm = normalizar(c);
      setCaminho(norm);
      if (norm.uf) setUfEstado(norm.uf);
      history.pushState(null, "", escreverEndereco(norm, opcoes));
      window.scrollTo({ top: Math.min(window.scrollY, 160), behavior: "smooth" });
    },
    [opcoes],
  );
  const mudarOpcoes = useCallback(
    (o: Opcoes) => {
      setOpcoes(o);
      history.replaceState(null, "", escreverEndereco(caminho, o));
    },
    [caminho],
  );

  /* o voltar do navegador (pushState não dispara hashchange) */
  useEffect(() => {
    const voltar = () => {
      const e = lerEndereco(location.hash);
      if (e.aba === "explorar") {
        setAba("explorar");
        setCaminho(e.caminho);
        setOpcoes(e.opcoes);
      }
    };
    window.addEventListener("popstate", voltar);
    return () => window.removeEventListener("popstate", voltar);
  }, []);

  const ir = useCallback(
    (a: Aba) => {
      setAba(a);
      history.replaceState(null, "", a === "explorar" ? escreverEndereco(caminho, opcoes) : enderecoAba(a, uf));
    },
    [uf, caminho, opcoes],
  );
  const setUf = useCallback(
    (u: string) => {
      setUfEstado(u);
      history.replaceState(null, "", enderecoAba(aba, u));
    },
    [aba],
  );

  const r = resumo.dado;
  const ufAnalise = uf === "zz" ? "ce" : uf;
  return (
    <div style={{ background: P.fundo, color: P.tinta, fontFamily: FONT_DADOS, minHeight: "100dvh", overflowX: "clip" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 16px 90px" }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "4px 16px", margin: "0 0 6px" }}>
          <div style={{ minWidth: 0 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: P.tintaSuave, fontSize: 14, fontWeight: 600, minHeight: 44 }}>
              <Icon name="arrowLeft" size={15} />
              Voltar ao site
            </Link>
            <p style={{ ...kicker, margin: 0 }}>Eleições 2026 · 1º turno · uso interno</p>
            <h1 style={{ fontFamily: FONT_DADOS, fontWeight: 800, fontSize: "clamp(24px, 5.5vw, 32px)", lineHeight: 1.1, margin: "2px 0 0" }}>Resultados do Missão</h1>
          </div>
          {r && (
            <p style={{ fontSize: 13, color: P.tintaSuave, margin: 0, maxWidth: "min(52ch, 100%)" }}>
              TSE, processado em {r.geradoEm}. O Missão aparece sempre separado da direita.{" "}
              <button type="button" onClick={() => ir("sobre")} style={{ font: "inherit", color: P.tinta, textDecoration: "underline", textUnderlineOffset: 3, background: "none", border: 0, padding: "10px 0", minHeight: 44, cursor: "pointer" }}>
                De onde vêm os dados
              </button>
            </p>
          )}
        </header>

        <nav
          aria-label="Seções"
          style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 6, overflowX: "auto", padding: "10px 0", background: P.fundo, borderBottom: fileteDados() }}
        >
          <Botao ativo={aba === "explorar"} onClick={() => ir("explorar")} forte>
            Explorar o mapa
          </Botao>
          <span aria-hidden="true" style={{ flex: "0 0 auto", width: 1, height: 26, background: P.linha, margin: "0 6px" }} />
          <span style={{ ...kicker, flex: "0 0 auto", margin: "0 4px 0 0" }}>Análises</span>
          {ANALISES.map(([k, nome]) => (
            <Botao key={k} ativo={k === aba} onClick={() => ir(k)}>
              {nome}
            </Botao>
          ))}
        </nav>

        {!r ? (
          <Carregando erro={resumo.erro} />
        ) : (
          <main style={{ marginTop: 10 }}>
            {aba === "explorar" && <Explorador resumo={r} caminho={caminho} opcoes={opcoes} ir={irPara} mudarOpcoes={mudarOpcoes} />}
            {aba === "conversao" && <Conversao resumo={r} uf={uf} setUf={setUf} />}
            {aba === "legenda" && <Legenda resumo={r} uf={uf} setUf={setUf} />}
            {aba === "cadeiras" && <Cadeiras resumo={r} uf={uf} setUf={setUf} />}
            {aba === "decisoes" && <Decisoes resumo={r} uf={ufAnalise} setUf={setUf} />}
            {aba === "candidatos" && <Candidatos resumo={r} />}
            {aba === "partidos" && <Partidos resumo={r} uf={ufAnalise} setUf={setUf} />}
            {aba === "adversarios" && <Adversarios resumo={r} uf={uf} setUf={setUf} />}
            {aba === "sobre" && <Sobre resumo={r} />}
          </main>
        )}
      </div>
    </div>
  );
}

function Botao({ ativo, onClick, forte = false, children }: { ativo: boolean; onClick: () => void; forte?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-current={ativo ? "page" : undefined}
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        fontFamily: FONT_DADOS,
        fontSize: 14.5,
        fontWeight: forte ? 800 : 600,
        minHeight: 44,
        padding: "8px 14px",
        cursor: "pointer",
        color: ativo ? P.superficie : P.tinta,
        background: ativo ? P.tinta : forte ? P.realce : "transparent",
        border: fileteDados(ativo ? P.tinta : forte ? P.missao : "transparent"),
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
