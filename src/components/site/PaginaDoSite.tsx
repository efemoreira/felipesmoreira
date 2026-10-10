import React from "react";
import { C, FONT_BITTER, HATCH, LARGURA } from "@/lib/theme";
import { Cabecalho } from "./Cabecalho";
import { Rodape } from "./Rodape";

/**
 * A MOLDURA DE TODA PÁGINA PÚBLICA: barra do topo, conteúdo, rodapé.
 *
 * `fundo`:
 *   - "papel" (padrão): o papel hachurado do cordel, conteúdo na largura do
 *     site. Quem passa `abertura` ganha a faixa de tinta em cima, de ponta a
 *     ponta, antes do papel.
 *   - "cena": a home — a animação do sertão fica atrás, e a página cuida do
 *     próprio fundo. A barra começa transparente.
 *   - "livre": a página desenha o próprio fundo (programação, heróis…), e a
 *     moldura só põe barra e rodapé em volta.
 *
 * Fica FORA, de propósito: /resultados (superfície de dados própria),
 * /presenca (tela de porta), /municao, /aulas, /convite, /plano e o Estúdio.
 * `testes/contrato/navegacao.test.ts` prende as duas listas.
 */
export function PaginaDoSite({
  children,
  fundo = "papel",
  abertura,
}: {
  children: React.ReactNode;
  fundo?: "papel" | "cena" | "livre";
  abertura?: React.ReactNode;
}) {
  return (
    <>
      <Cabecalho sobreCena={fundo === "cena"} />
      <main id="conteudo" tabIndex={-1} style={{ outline: "none", display: "block" }}>
        {abertura}
        {fundo === "papel" ? (
          <div style={{ colorScheme: "light", background: `${HATCH}, ${C.paper}`, color: C.ink, fontFamily: FONT_BITTER, overflowX: "clip" }}>
            <div style={{ maxWidth: LARGURA.conteudo, margin: "0 auto", padding: "32px 16px 56px" }}>{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
      <Rodape />
    </>
  );
}
