"use client";
import React from "react";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, borda } from "@/lib/theme";
import { Blocos } from "./Blocos";
import { Player } from "./Player";
import type { Aula as TipoAula } from "./tipos";

/**
 * Uma aula. Fechada, mostra só o cabeçalho — com 30 aulas, abrir todas de uma
 * vez viraria um paredão impossível de ler (mesma razão do <details> na fila
 * de inscrições do painel).
 *
 * A 🚗 marca a Pista Rápida: o caminho macro. O resto é Pista Lenta.
 */

interface Props {
  aula: TipoAula;
  aberta: boolean;
  concluida: boolean;
  minhaFuncao: boolean;
  gravando: boolean;
  aoAbrir: (id: string, aberta: boolean) => void;
  aoAlternar: (id: string, concluida: boolean) => void;
  /** convidado sem conta: não há onde gravar, então o botão não aparece */
  semProgresso?: boolean;
}

export const Aula: React.FC<Props> = ({
  aula,
  aberta,
  concluida,
  minhaFuncao,
  gravando,
  aoAbrir,
  aoAlternar,
  semProgresso = false,
}) => {
  const rapida = aula.pista === "rapida";

  return (
    <details
      id={aula.id}
      open={aberta}
      onToggle={(e) => aoAbrir(aula.id, (e.currentTarget as HTMLDetailsElement).open)}
      style={{
        border: borda(rapida ? C.gold : "rgba(255,203,5,.24)"),
        background: rapida ? "rgba(255,203,5,.07)" : "rgba(255,203,5,.03)",
        margin: "0 0 12px",
        scrollMarginTop: 20,
      }}
    >
      <summary
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          /* 44px de alvo de toque: a maioria entra por link de WhatsApp */
          padding: "14px 16px",
          minHeight: 44,
          cursor: "pointer",
          listStyle: "none",
        }}
      >
        <span style={{ flex: "0 0 auto", fontSize: 18, lineHeight: 1 }} aria-hidden="true">
          {rapida ? "🚗" : concluida ? "✓" : "·"}
        </span>

        <span style={{ flex: "1 1 auto", minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              fontFamily: FONT_ALFA,
              fontSize: rapida ? 17 : 15.5,
              lineHeight: 1.35,
              color: rapida ? C.gold : C.cream,
            }}
          >
            {aula.titulo}
          </strong>
          <span
            style={{
              display: "block",
              marginTop: 3,
              fontFamily: FONT_ELITE,
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "#8e877a",
            }}
          >
            {rapida ? "Pista Rápida" : "Pista Lenta"} · {aula.minutos} min
            {aula.video && " · vídeo"}
            {minhaFuncao && " · sua função"}
          </span>
        </span>

        {concluida && (
          <span
            style={{
              flex: "0 0 auto",
              fontFamily: FONT_ELITE,
              fontSize: 10,
              letterSpacing: 1.3,
              textTransform: "uppercase",
              color: C.ok,
              border: `2px solid ${C.okBorda}`,
              padding: "3px 7px",
            }}
          >
            Feita
          </span>
        )}
      </summary>

      <div style={{ padding: "4px 16px 20px" }}>
        <p style={{ margin: "0 0 20px", color: "#b9b3a5", lineHeight: 1.7 }}>{aula.resumo}</p>

        {aula.video && <Player video={aula.video} titulo={aula.titulo} />}

        <Blocos blocos={aula.blocos} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
          {!semProgresso && (
          <button
            type="button"
            onClick={() => aoAlternar(aula.id, !concluida)}
            disabled={gravando}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 44,
              padding: "10px 18px",
              cursor: gravando ? "wait" : "pointer",
              fontFamily: FONT_ALFA,
              fontSize: 14,
              border: borda(),
              boxShadow: "4px 4px 0 rgba(24,18,3,.35)",
              background: concluida ? "transparent" : C.gold,
              color: concluida ? C.cream : C.ink,
              borderColor: concluida ? "rgba(255,203,5,.4)" : C.ink,
              opacity: gravando ? 0.6 : 1,
            }}
          >
            {concluida ? "Desmarcar" : "Marcar como feita"}
          </button>
          )}

          {aula.ferramenta && (
            <a
              href={aula.ferramenta}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minHeight: 44,
                padding: "10px 18px",
                textDecoration: "none",
                fontFamily: FONT_ALFA,
                fontSize: 14,
                color: C.gold,
                border: borda("rgba(255,203,5,.4)"),
              }}
            >
              Fazer isto agora
              <Icon name="chevronRight" size={16} />
            </a>
          )}
        </div>
      </div>
    </details>
  );
};
