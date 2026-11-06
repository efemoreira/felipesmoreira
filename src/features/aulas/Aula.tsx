"use client";
import React from "react";
import { Icon } from "@/components/icons";
import { C, RAIO, borda } from "@/lib/theme";
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
        border: borda(rapida ? C.goldDim : C.linha),
        borderRadius: RAIO.m,
        background: rapida ? C.ouroClaro : C.paper,
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
        <span style={{ flex: "0 0 auto", width: 24, textAlign: "center", fontSize: 18, lineHeight: 1 }} aria-hidden="true">
          {rapida ? "🚗" : concluida ? "✓" : ""}
        </span>

        <span style={{ flex: "1 1 auto", minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              fontWeight: 800,
              fontSize: 18,
              lineHeight: 1.3,
              color: C.ink,
            }}
          >
            {aula.titulo}
          </strong>
          <span
            style={{
              display: "block",
              marginTop: 3,
              fontWeight: 600,
              fontSize: 14.5,
              color: C.suave,
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
              fontWeight: 600,
              fontSize: 14.5,
              color: C.ok,
              background: C.okFundo,
              borderRadius: RAIO.pilula,
              padding: "3px 10px",
            }}
          >
            Feita
          </span>
        )}
      </summary>

      <div style={{ padding: "4px 16px 20px" }}>
        <p style={{ margin: "0 0 20px", color: C.suave, lineHeight: 1.55 }}>{aula.resumo}</p>

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
              fontWeight: 800,
              fontSize: 14.5,
              border: borda(),
              borderRadius: RAIO.m,
              background: concluida ? "transparent" : C.gold,
              color: C.ink,
              borderColor: concluida ? C.linhaForte : C.gold,
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
                fontWeight: 800,
                fontSize: 14.5,
                color: C.ink,
                border: borda(C.linhaForte),
                borderRadius: RAIO.m,
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
