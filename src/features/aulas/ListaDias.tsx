"use client";
import React from "react";
import { C, FONT_ALFA, FONT_ELITE } from "@/lib/theme";
import { Aula } from "./Aula";
import type { Dia } from "./tipos";

/**
 * Os Dias da formação, um embaixo do outro. Cada Dia abre com a 🚗 Pista
 * Rápida e traz as Pistas Lentas em seguida — quem só faz as rápidas atravessa
 * a formação inteira sem esperar quem quer se aprofundar.
 */

interface Props {
  dias: Dia[];
  concluidas: Set<string>;
  minhasFuncoes: Set<string>;
  abertaId: string | null;
  gravando: string | null;
  aoAbrir: (id: string, aberta: boolean) => void;
  aoAlternar: (id: string, concluida: boolean) => void;
}

export const ListaDias: React.FC<Props> = ({
  dias,
  concluidas,
  minhasFuncoes,
  abertaId,
  gravando,
  aoAbrir,
  aoAlternar,
}) => (
  <>
    {dias.map((dia) => {
      const feitas = dia.aulas.filter((a) => concluidas.has(a.id)).length;
      const completo = feitas === dia.aulas.length;

      return (
        <section key={dia.id} style={{ margin: "0 0 44px" }}>
          <header style={{ margin: "0 0 18px" }}>
            <p
              style={{
                display: "inline-block",
                fontFamily: FONT_ELITE,
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: completo ? C.ink : C.gold,
                background: completo ? C.gold : "transparent",
                border: `2px solid ${C.gold}`,
                padding: "3px 10px",
                margin: "0 0 10px",
              }}
            >
              Dia {dia.numero} · {feitas} de {dia.aulas.length}
            </p>
            <h2
              style={{
                fontFamily: FONT_ALFA,
                fontSize: "clamp(20px, 4.5vw, 27px)",
                lineHeight: 1.25,
                margin: "0 0 8px",
                color: C.cream,
              }}
            >
              {dia.titulo}
            </h2>
            <p style={{ margin: 0, color: "#b9b3a5", lineHeight: 1.7, maxWidth: "60ch" }}>
              {dia.resumo}
            </p>
          </header>

          {dia.aulas.map((aula) => (
            <Aula
              key={aula.id}
              aula={aula}
              aberta={abertaId === aula.id}
              concluida={concluidas.has(aula.id)}
              minhaFuncao={aula.funcoes.some((f) => minhasFuncoes.has(f))}
              gravando={gravando === aula.id}
              aoAbrir={aoAbrir}
              aoAlternar={aoAlternar}
            />
          ))}
        </section>
      );
    })}
  </>
);
