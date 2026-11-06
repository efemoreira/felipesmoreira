import React from "react";
import { C, FOCO, FONT_ALFA, FONT_TEXTO, LARGURA, PONTOS, RAIO, TITULO, borda, sombra } from "@/lib/theme";

/**
 * AS PEÇAS COMUNS DO SITE, EM CSS.
 *
 * Botão, cartão, seção e etiqueta eram redesenhados em cada feature, cada um
 * com a sua altura e o seu espaço — e é isso que faz um site parecer feito por
 * dez pessoas. Agora há uma peça de cada, com classe `s-`, e a página só
 * escolhe qual usar. Os valores continuam saindo de `@/lib/theme`.
 *
 * Entra uma vez por página, e quem põe é `PaginaDoSite`. As telas fora da moldura
 * (presença, aulas, munição, convite) têm estilo próprio com os mesmos tokens.
 */
const CSS = `
  .s-largura { width: 100%; max-width: ${LARGURA.conteudo + 40}px; margin-inline: auto; padding-inline: 20px; }
  .s-leitura { max-width: ${LARGURA.texto}; }

  /* ---------- título e seção ---------- */
  .s-secao { padding-block: clamp(40px, 6.4vw, 72px); }
  .s-secao-suave { background: ${C.fundo}; }
  .s-cabeca { max-width: 44rem; margin-bottom: clamp(24px, 3.4vw, 36px); }
  .s-cabeca-meio { margin-inline: auto; text-align: center; }
  .s-rotulo { margin: 0 0 8px; font-size: 15px; line-height: 1.4; font-weight: 700; color: ${C.goldDim}; }
  .s-titulo { margin: 0; font-family: ${FONT_ALFA}; font-weight: 400; font-size: ${TITULO.secao}; line-height: 1.12; color: ${C.ink}; text-wrap: balance; }
  .s-sub { margin: 10px 0 0; font-size: 18px; line-height: 1.55; color: ${C.suave}; text-wrap: pretty; }
  .s-corpo { margin: 0; font-size: 17px; line-height: 1.6; color: ${C.suave}; }

  /* ---------- botão ---------- */
  .s-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 50px; padding: 12px 22px; border: 1px solid transparent; border-radius: ${RAIO.m}px;
    font-family: ${FONT_TEXTO}; font-size: 16.5px; font-weight: 700; line-height: 1.2; text-decoration: none; text-align: center;
    cursor: pointer; transition: background-color .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease;
  }
  .s-btn:hover { transform: translateY(-1px); }
  .s-btn:active { transform: translateY(0); }
  .s-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
  .s-btn-ouro { background: ${C.gold}; color: ${C.ink}; }
  .s-btn-ouro:hover { background: ${C.gold2}; box-shadow: ${sombra("cartao", "rgba(133,96,6,.22)")}; }
  .s-btn-linha { background: ${C.paper}; color: ${C.ink}; border-color: ${C.linhaForte}; }
  .s-btn-linha:hover { border-color: ${C.ink}; }
  .s-btn-tinta { background: ${C.ink}; color: ${C.paper}; }
  .s-btn-tinta:hover { background: ${C.tintaAcesa}; }
  .s-btn-peq { min-height: 44px; padding: 9px 16px; font-size: 15.5px; border-radius: ${RAIO.p + 2}px; }
  .s-btn-bloco { display: flex; width: 100%; }
  .s-acoes { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .s-link { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; color: ${C.ink}; font-weight: 700; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 3px; text-underline-offset: 5px; }
  .s-link:hover { text-decoration-color: ${C.ink}; }

  /* ---------- cartão ---------- */
  .s-cartao { display: flex; flex-direction: column; gap: 12px; min-width: 0; padding: 22px; background: ${C.paper}; border: ${borda()}; border-radius: ${RAIO.g}px; color: ${C.ink}; }
  a.s-cartao { text-decoration: none; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
  a.s-cartao:hover { transform: translateY(-2px); box-shadow: ${sombra("cartao")}; border-color: ${C.linhaForte}; }
  .s-cartao h3, .s-cartao-titulo { margin: 0; font-family: ${FONT_TEXTO}; font-size: 20px; line-height: 1.25; font-weight: 800; letter-spacing: -.01em; color: ${C.ink}; }
  .s-cartao p { margin: 0; }

  /* ---------- grade: sem coluna sobrando, em qualquer quantidade de itens ---------- */
  .s-grade { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
  @media (min-width: ${PONTOS.tablet}px) {
    .s-grade-2, .s-grade-3, .s-grade-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (min-width: ${PONTOS.computador}px) {
    .s-grade { gap: 20px; }
    .s-grade-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .s-grade-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  /* ---------- selo de ícone e etiqueta ---------- */
  .s-selo { flex: 0 0 auto; width: 44px; height: 44px; display: grid; place-items: center; border-radius: ${RAIO.m}px; background: ${C.gold}; color: ${C.ink}; }
  .s-etiqueta { display: inline-flex; align-items: center; gap: 6px; min-height: 26px; padding: 2px 10px; border-radius: ${RAIO.pilula}px; background: ${C.fundo}; color: ${C.ink}; font-size: 13.5px; line-height: 1.3; font-weight: 600; white-space: nowrap; }
  .s-etiqueta-ouro { background: ${C.ouroClaro}; color: ${C.ink}; }
  .s-etiqueta-ok { background: ${C.okFundo}; color: ${C.ok}; }

  /* ---------- lista em linhas: para o que é lista e não pede caixa ---------- */
  .s-linhas { list-style: none; margin: 0; padding: 0; border-top: ${borda()}; }
  .s-linhas > li { padding-block: 16px; border-bottom: ${borda()}; }

  /* ---------- formulário ---------- */
  .s-campo { width: 100%; min-height: 50px; padding: 12px 14px; font-family: ${FONT_TEXTO}; font-size: 17px; color: ${C.ink}; background: ${C.paper}; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.p + 2}px; }
  .s-campo:focus { outline: none; border-color: ${C.ink}; box-shadow: 0 0 0 3px ${C.gold}; }

  /* ---------- teclado ---------- */
  .s-btn:focus-visible, .s-cartao:focus-visible, .s-link:focus-visible { outline: ${FOCO}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .s-btn, a.s-cartao { transition: none; }
    .s-btn:hover, a.s-cartao:hover { transform: none; }
  }
`;

export function EstilosDoSite() {
  return <style>{CSS}</style>;
}
