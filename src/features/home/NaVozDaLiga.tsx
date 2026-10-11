"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { temaPorChave } from "@/features/organizacao/catalogo";
import { useOrganizacao } from "@/features/organizacao/useOrganizacao";

/**
 * "NA VOZ DA LIGA" — os conteúdos dos porta-vozes na home (plano 2026–2027,
 * degrau "Interesse": "página inicial, conteúdos dos porta-vozes").
 *
 * Até três porta-vozes publicados que têm vídeo em destaque, do nível mais
 * alto para baixo. Link, não embed: a home não carrega script de rede social.
 * Sem nenhum destaque publicado, a seção não aparece — seção vazia na home é
 * pior que seção nenhuma.
 */
const ORDEM = ["A", "B", "C", "D", "E"];

export function NaVozDaLiga() {
  const estado = useOrganizacao();
  if (estado.fase !== "pronto") return null;
  const com = estado.dados.portavozes
    .filter((p) => p.destaque)
    .sort((a, b) => ORDEM.indexOf(a.nivel) - ORDEM.indexOf(b.nivel))
    .slice(0, 3);
  if (com.length === 0) return null;

  return (
    <section aria-labelledby="h-voz" className="h-secao">
      <h2 id="h-voz" className="h-secao-titulo">Na voz da Liga</h2>
      <p className="h-secao-sub">O que os porta-vozes da Missão estão dizendo agora.</p>
      <div className="h-mais">
        {com.map((p) => (
          <a key={p.id} href={p.destaque} target="_blank" rel="noopener noreferrer" className="h-tile">
            <span className="h-tile-icone" aria-hidden="true">
              <Icon name="play" size={20} />
            </span>
            <span className="h-tile-texto">
              <strong>{p.nome}</strong>
              <span>{temaPorChave(p.tema)?.nome ?? "Porta-voz"}{p.cidade ? ` · ${p.cidade}` : ""}</span>
            </span>
          </a>
        ))}
      </div>
      <p className="h-nota">
        <Link href="/portavozes" prefetch={false} className="h-link-ouro">
          Conhecer a Liga
          <Icon name="chevronRight" size={16} />
        </Link>
      </p>
    </section>
  );
}
