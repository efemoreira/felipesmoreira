"use client";
import React from "react";
import { C } from "@/lib/theme";
import type { FonteVideo } from "./tipos";

/**
 * O player da aula. O tipo FonteVideo abstrai o provedor de propósito: se um
 * dia sairmos do YouTube, muda aqui e no tipo, e mais nada.
 *
 * youtube-nocookie porque a Política de Privacidade promete que nada do
 * visitante vai para fora sem necessidade.
 */
export const Player: React.FC<{ video: FonteVideo; titulo: string }> = ({ video, titulo }) => (
  <div
    style={{
      position: "relative",
      aspectRatio: "16 / 9",
      background: "#000",
      border: `3px solid ${C.ink}`,
      boxShadow: "5px 5px 0 rgba(24,18,3,.45)",
      margin: "0 0 22px",
    }}
  >
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
      title={titulo}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  </div>
);
