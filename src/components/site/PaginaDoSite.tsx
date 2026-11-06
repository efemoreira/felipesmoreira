import React from "react";
import { C, FONT_TEXTO } from "@/lib/theme";
import { Cabecalho } from "./Cabecalho";
import { EstilosDoSite } from "./estilos";
import { Rodape } from "./Rodape";

/**
 * A MOLDURA DE TODA PÁGINA PÚBLICA: barra do topo, conteúdo, rodapé.
 *
 * `fundo`:
 *   - "papel" (padrão): a página branca, com o conteúdo na largura do site.
 *     Quem passa `abertura` ganha a abertura em cima, antes do conteúdo.
 *   - "livre": a página cuida das próprias seções de ponta a ponta (a home, a
 *     programação), e a moldura só põe barra e rodapé em volta.
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
  fundo?: "papel" | "livre";
  abertura?: React.ReactNode;
}) {
  return (
    <>
      <EstilosDoSite />
      <Cabecalho />
      <main id="conteudo" tabIndex={-1} style={{ outline: "none", display: "block", background: C.paper, color: C.ink, fontFamily: FONT_TEXTO }}>
        {abertura}
        {fundo === "papel" ? (
          <div className="s-largura" style={{ paddingBlock: "32px clamp(48px, 7vw, 80px)" }}>
            {children}
          </div>
        ) : (
          children
        )}
      </main>
      <Rodape />
    </>
  );
}
