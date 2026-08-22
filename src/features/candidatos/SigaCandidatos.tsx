"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE } from "@/lib/theme";
import { obterChapa, pessoasDa, type Candidato } from "@/lib/api/candidatos";

/**
 * "Siga nossos candidatos" — o bloco da home.
 *
 * Mostra **uma lista só**, a que a coordenação marcou como “na home”: a chapa
 * inteira aqui seria uma lista que ninguém decora, e a home é a página onde o
 * visitante tem menos paciência.
 *
 * **Sem candidato publicado, o bloco não existe.** É o mesmo padrão de
 * `CHAPA.numero` na faixa da eleição: melhor não dizer nada do que deixar um
 * buraco onde o eleitor espera um número.
 *
 * A lista vem pela rede e não do build — número e nome de urna mudam até a
 * véspera, e um export estático congelaria o que estava certo em agosto.
 */
export const SigaCandidatos: React.FC = () => {
  const [escolhidos, setEscolhidos] = useState<Candidato[]>([]);
  const [titulo, setTitulo] = useState("Siga nossos candidatos");

  useEffect(() => {
    obterChapa()
      .then(({ candidatos, listas }) => {
        const daHome = listas.find((l) => l.naHome);
        if (!daHome) return;  // nenhuma marcada: o bloco não aparece
        setEscolhidos(pessoasDa(daHome, candidatos));
        setTitulo(daHome.nome);
      })
      .catch(() => {
        /* Rede fora: o bloco simplesmente não aparece. Melhor do que mostrar
           número guardado de antes — número errado na urna não tem conserto. */
      });
  }, []);

  if (escolhidos.length === 0) return null;

  return (
    <section
      aria-labelledby="siga-titulo"
      style={{
        background: C.paper,
        border: `3px solid ${C.ink}`,
        boxShadow: "5px 5px 0 rgba(24,18,3,.35)",
        color: C.ink,
        padding: "18px 18px 16px",
      }}
    >
      <p
        id="siga-titulo"
        style={{
          fontFamily: FONT_ELITE,
          fontSize: 12,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          margin: "0 0 14px",
          opacity: 0.7,
        }}
      >
        {titulo}
      </p>

      <ul style={{ listStyle: "none", margin: "0 0 14px", padding: 0, display: "grid", gap: 10 }}>
        {escolhidos.map((c) => (
          <li
            key={c.id}
            style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44 }}
          >
            <span
              style={{
                fontFamily: FONT_ALFA,
                fontSize: 26,
                lineHeight: 1,
                color: C.ink,
                minWidth: "2ch",
              }}
            >
              {c.numero}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", fontFamily: FONT_ALFA, fontSize: 16 }}>
                {c.nome}
              </strong>
              {c.cargo && (
                <span style={{ fontSize: 13, opacity: 0.7 }}>{c.cargo}</span>
              )}
            </span>
            {c.instagram && (
              <a
                href={`https://instagram.com/${c.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram de ${c.nome}: @${c.instagram}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  minHeight: 44,
                  fontSize: 13.5,
                  color: C.ink,
                  textDecoration: "none",
                  opacity: 0.85,
                }}
              >
                <Icon name="instagram" size={16} />@{c.instagram}
              </a>
            )}
          </li>
        ))}
      </ul>

      <Link
        href="/candidatos"
        prefetch={false}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          minHeight: 44,
          fontFamily: FONT_ELITE,
          fontSize: 12,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: C.ink,
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Ver todos e montar a colinha
        <Icon name="chevronRight" size={15} />
      </Link>
    </section>
  );
};
