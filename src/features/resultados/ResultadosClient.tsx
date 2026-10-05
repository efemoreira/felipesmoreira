"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_BITTER, FONT_ELITE, HATCH, borda, sombra } from "@/lib/theme";
import { carregarResumo, useRecurso } from "./dados";
import { Carregando, kicker } from "./pecas";
import Brasil from "./abas/Brasil";
import Estado from "./abas/Estado";
import Municipio from "./abas/Municipio";
import Conversao from "./abas/Conversao";
import Legenda from "./abas/Legenda";
import Cadeiras from "./abas/Cadeiras";
import Candidatos from "./abas/Candidatos";
import Ideias from "./abas/Ideias";

/**
 * /resultados — o estudo do resultado de 2026 para o Missão.
 *
 * Ferramenta interna (sem indexação, como a Munição): os números vêm do TSE e
 * estão processados em `public/resultados-2026/`, gerados pelo projeto de
 * análise. As abas ficam no `#` da URL para o link de uma aba poder circular.
 */

const ABAS = [
  ["brasil", "Brasil"],
  ["estado", "Estado"],
  ["municipio", "Município"],
  ["conversao", "Renan → Missão"],
  ["legenda", "Legenda"],
  ["cadeiras", "Cadeiras"],
  ["candidatos", "Candidatos"],
  ["ideias", "Ideias"],
] as const;
type Aba = (typeof ABAS)[number][0];

const carregar = () => carregarResumo();

export default function ResultadosClient() {
  const resumo = useRecurso("resumo", carregar);
  const [aba, setAba] = useState<Aba>("brasil");
  const [uf, setUfEstado] = useState("ce");

  /* aba e estado no endereço: #estado/sp */
  useEffect(() => {
    const ler = () => {
      const [a, u] = location.hash.replace("#", "").split("/");
      if (ABAS.some(([k]) => k === a)) setAba(a as Aba);
      if (u && /^[a-z]{2}$/.test(u)) setUfEstado(u);
    };
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, []);

  const ir = useCallback(
    (a: Aba, u: string = uf) => {
      setAba(a);
      history.replaceState(null, "", `#${a}/${u}`);
    },
    [uf],
  );
  const setUf = useCallback(
    (u: string) => {
      setUfEstado(u);
      history.replaceState(null, "", `#${aba}/${u}`);
    },
    [aba],
  );

  const r = resumo.dado;
  return (
    <div style={{ background: C.paper, backgroundImage: HATCH, color: C.ink, fontFamily: FONT_BITTER, minHeight: "100dvh", overflowX: "clip" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 16px 90px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.ink, fontWeight: 600, minHeight: 44 }}>
          <Icon name="arrowLeft" size={17} />
          Voltar
        </Link>

        <header style={{ margin: "10px 0 18px" }}>
          <p style={kicker}>Eleições 2026 · 1º turno · uso interno</p>
          <h1 style={{ fontFamily: FONT_ALFA, fontSize: "clamp(30px, 7vw, 46px)", lineHeight: 1.05, margin: "0 0 10px", textShadow: `3px 3px 0 ${C.gold}` }}>
            Resultados do Missão
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, maxWidth: "70ch" }}>
            Votos, cadeiras, quociente, legenda e conversão do Renan — por estado e por cidade. O Missão aparece sempre separado da direita, para mostrar os votos que
            ainda podem ser disputados.
          </p>
          {r && <p style={{ fontSize: 13, margin: "8px 0 0", opacity: 0.75 }}>Fonte: {r.fonte}. Processado em {r.geradoEm}.</p>}
        </header>

        <nav
          aria-label="Seções"
          style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", gap: 8, overflowX: "auto", padding: "10px 2px 12px", margin: "0 -2px", background: C.paper }}
        >
          {ABAS.map(([k, nome]) => {
            const ativa = k === aba;
            return (
              <button
                key={k}
                type="button"
                aria-current={ativa ? "page" : undefined}
                onClick={() => ir(k)}
                style={{
                  flex: "0 0 auto",
                  fontFamily: FONT_ELITE,
                  fontSize: 14,
                  letterSpacing: 0.8,
                  minHeight: 44,
                  padding: "8px 14px",
                  cursor: "pointer",
                  color: ativa ? C.cream : C.ink,
                  background: ativa ? C.ink : C.cream,
                  border: borda(C.ink),
                  boxShadow: ativa ? "none" : sombra("rente"),
                }}
              >
                {nome}
              </button>
            );
          })}
        </nav>

        {!r ? (
          <Carregando erro={resumo.erro} />
        ) : (
          <main>
            {aba === "brasil" && <Brasil resumo={r} />}
            {aba === "estado" && <Estado resumo={r} uf={uf === "zz" ? "ce" : uf} setUf={setUf} />}
            {aba === "municipio" && <Municipio resumo={r} uf={uf} setUf={setUf} />}
            {aba === "conversao" && <Conversao resumo={r} uf={uf} setUf={setUf} />}
            {aba === "legenda" && <Legenda resumo={r} uf={uf} setUf={setUf} />}
            {aba === "cadeiras" && <Cadeiras resumo={r} uf={uf} setUf={setUf} />}
            {aba === "candidatos" && <Candidatos resumo={r} />}
            {aba === "ideias" && <Ideias resumo={r} />}
          </main>
        )}
      </div>
    </div>
  );
}
