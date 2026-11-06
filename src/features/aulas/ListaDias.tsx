"use client";
import React from "react";
import { C, FONT_ALFA, RAIO } from "@/lib/theme";
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
  /** convidado sem conta: mostra o conteúdo, esconde o que marca progresso */
  semProgresso?: boolean;
}

export const ListaDias: React.FC<Props> = ({
  dias,
  concluidas,
  minhasFuncoes,
  abertaId,
  gravando,
  aoAbrir,
  aoAlternar,
  semProgresso = false,
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
                fontWeight: 600,
                fontSize: 14.5,
                color: C.ink,
                background: completo ? C.gold : C.fundo,
                borderRadius: RAIO.pilula,
                padding: "3px 12px",
                margin: "0 0 10px",
              }}
            >
              Dia {dia.numero}{semProgresso ? "" : ` · ${feitas} de ${dia.aulas.length}`}
            </p>
            <h2
              style={{
                fontFamily: FONT_ALFA,
                fontWeight: 400,
                fontSize: "clamp(26px, 4.5vw, 32px)",
                lineHeight: 1.14,
                margin: "0 0 8px",
                color: C.ink,
              }}
            >
              {dia.titulo}
            </h2>
            <p style={{ margin: 0, color: C.suave, lineHeight: 1.7, maxWidth: "60ch" }}>
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
              semProgresso={semProgresso}
            />
          ))}
        </section>
      );
    })}
  </>
);
