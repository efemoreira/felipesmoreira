"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { obterSessao, podeAbrir, type Sessao } from "@/lib/api/sessao";

type Estado = "carregando" | "sem-acesso" | "liberado";

/**
 * Scaffold: só verifica acesso à área "aulas" (mesmo login do painel) e mostra
 * um placeholder. A listagem de aulas em si é a próxima atualização.
 */
export default function AulasClient() {
  const [estado, setEstado] = useState<Estado>("carregando");

  useEffect(() => {
    let ativo = true;
    obterSessao()
      .then((sessao: Sessao) => {
        if (!ativo) return;
        setEstado(podeAbrir(sessao, "aulas") ? "liberado" : "sem-acesso");
      })
      .catch(() => {
        if (ativo) setEstado("sem-acesso");
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: C.night,
        color: C.cream,
        fontFamily: FONT_BITTER,
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div>
        <p
          style={{
            display: "inline-block",
            fontFamily: FONT_ELITE,
            letterSpacing: 4,
            fontSize: 12,
            textTransform: "uppercase",
            color: C.ink,
            background: C.gold,
            padding: "4px 14px",
            boxShadow: "3px 3px 0 rgba(24,18,3,.5)",
            marginBottom: 18,
          }}
        >
          Aulas
        </p>
        <h1
          style={{
            fontFamily: FONT_ALFA,
            fontSize: "clamp(28px, 6vw, 42px)",
            margin: "0 0 14px",
            color: C.gold,
          }}
        >
          {estado === "carregando" && "Verificando acesso…"}
          {estado === "sem-acesso" && "Acesso restrito"}
          {estado === "liberado" && "Em construção"}
        </h1>
        <p style={{ maxWidth: 420, margin: "0 auto 24px", fontSize: 15, lineHeight: 1.6 }}>
          {estado === "carregando" && "Verificando seu acesso…"}
          {estado === "sem-acesso" &&
            "Esta área é só para quem já tem conta no painel. Fale com a coordenação se você deveria ter acesso."}
          {estado === "liberado" &&
            "As aulas em vídeo ainda estão sendo organizadas. Volte em breve."}
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            background: C.gold,
            border: `3px solid ${C.ink}`,
            boxShadow: "5px 5px 0 rgba(24,18,3,.35)",
            color: C.ink,
            padding: "12px 20px",
            fontFamily: FONT_ALFA,
            fontSize: 15,
          }}
        >
          <Icon name="arrowLeft" size={18} />
          Voltar
        </Link>
      </div>
    </div>
  );
}
