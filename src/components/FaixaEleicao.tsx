"use client";
import React, { useEffect, useState } from "react";
import { C, FONT_ALFA, FONT_ELITE, borda, sombra } from "@/lib/theme";
import { dataPorExtenso, diasAteVotacao, faseEm, type Fase } from "@/lib/eleicao";
import { CHAPA } from "@/features/missao/data";

/**
 * A faixa que diz quando é a eleição e em qual número votar.
 *
 * **A parte fixa é desenhada já no HTML; só a contagem espera o navegador.**
 * A distinção importa: o número da chapa é a conversão final da campanha, e se
 * ele só aparecesse depois do JavaScript rodar, o buscador nunca o leria. Já a
 * contagem de dias *precisa* ser do navegador — num export estático ela
 * congelaria na data em que o site foi publicado.
 *
 * Por isso o primeiro render (o que vira HTML) mostra a data e o número, e o
 * efeito só acrescenta a linha da contagem. Servidor e cliente desenham a mesma
 * coisa na primeira passada, que é o que evita erro de hidratação.
 *
 * **Sem número cadastrado, a faixa não fala de voto.** Ela ainda dá a data; o
 * que ela não faz é deixar um buraco onde o eleitor espera o número. Ver
 * `CHAPA.numero` em `features/missao/data.ts`.
 */
export const FaixaEleicao: React.FC<{ compacta?: boolean }> = ({ compacta = false }) => {
  const [estado, setEstado] = useState<{ fase: Fase; dias: number } | null>(null);

  useEffect(() => {
    setEstado({ fase: faseEm(), dias: diasAteVotacao() });
  }, []);

  const temNumero = CHAPA.numero.trim() !== "";
  const acabou = estado?.fase === "depois";

  const chamada =
    estado === null
      ? null
      : estado.fase === "votacao"
        ? "É hoje. As urnas abrem às 8h e fecham às 17h."
        : estado.fase === "depois"
          ? "A votação terminou. Obrigado a quem construiu isso com a gente."
          : estado.dias === 1
            ? "É amanhã."
            : `Faltam ${estado.dias} dias.`;

  return (
    <aside
      aria-label="Quando é a eleição"
      /* Tinta, e não ouro: no site inteiro o ouro cheio significa "aperte
         aqui", e a faixa fica logo acima do cartão de entrar no grupo, que é
         ouro. Dois blocos dourados empilhados disputam o mesmo clique — e esta
         faixa não é um botão, é um carimbo. O número continua em ouro, que é
         onde o destaque tem que estar. */
      style={{
        background: C.ink,
        color: C.cream,
        border: borda(C.gold),
        boxShadow: sombra(),
        padding: compacta ? "13px 15px" : "17px 19px",
        display: "flex",
        flexDirection: "column",
        gap: 7,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: FONT_ELITE,
          fontSize: 11,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          margin: 0,
          color: C.gold2,
        }}
      >
        {acabou ? "Eleição 2026" : `Eleição · ${dataPorExtenso()}`}
      </p>

      {/* O número entra no HTML: é o que o buscador precisa achar. */}
      {temNumero && !acabou && (
        <p
          style={{
            fontFamily: FONT_ALFA,
            fontSize: compacta ? 20 : "clamp(21px, 5.4vw, 28px)",
            lineHeight: 1.12,
            margin: 0,
            color: C.gold,
          }}
        >
          Vote <strong>{CHAPA.numero}</strong> presidente e governador
        </p>
      )}

      {/* A contagem chega depois — ela muda todo dia e não pode vir do build. */}
      {chamada && (
        <p
          style={{
            fontFamily: temNumero && !acabou ? undefined : FONT_ALFA,
            fontSize: temNumero && !acabou ? 15 : compacta ? 19 : "clamp(20px, 5vw, 26px)",
            lineHeight: temNumero && !acabou ? 1.5 : 1.12,
            margin: 0,
          }}
        >
          {chamada}
        </p>
      )}
    </aside>
  );
};
