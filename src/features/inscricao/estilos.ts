import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";

/**
 * A folha de estilo do formulário de `/queroajudar`, num arquivo só.
 *
 * Eram trezentas e trinta linhas de CSS penduradas no fim do componente que
 * cuida do fluxo de três passos — e quem ia mexer numa regra de cor rolava por
 * todo o fluxo para chegar nela, ou pior, achava que tinha chegado ao fim do
 * arquivo. Aqui não há React nenhum.
 *
 * Continua sendo uma string injetada num `<style>`, e não Tailwind nem CSS
 * Module: a identidade do site sai dos tokens de `@/lib/theme` (ver o CLAUDE.md),
 * e é justamente essa interpolação que uma folha estática não faria.
 */

const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

export const css = `
  .in-fundo {
    min-height: 100dvh;
    background: ${HATCH}, ${C.paper};
    color: ${C.ink};
    font-family: ${FONT_BITTER};
    /* o layout declara color-scheme: dark; aqui o fundo é papel claro, e sem
       isto o navegador desenha caixa e seta dos controles em tema escuro */
    color-scheme: light;
  }
  /* ...menos no bloco de LGPD, que é o único em fundo noite */
  .in-lgpd { color-scheme: dark; }
  .in-main { max-width: 760px; margin: 0 auto; padding: 22px 18px 64px; }

  .in-sr {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
  }
  .in-armadilha {
    position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;
  }

  .in-voltar-site {
    display: inline-flex; align-items: center; gap: 8px; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.cream}; text-decoration: none;
    padding: 10px 15px; border: 3px solid ${C.ink};
    box-shadow: 3px 3px 0 rgba(24,18,3,.28);
    margin-bottom: 22px;
  }

  .in-cabecalho { margin-bottom: 26px; }
  .in-chip {
    display: inline-block; font-family: ${FONT_ELITE};
    letter-spacing: 4px; font-size: 12px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold};
    padding: 4px 14px; box-shadow: 3px 3px 0 rgba(24,18,3,.3);
    margin: 0 0 12px;
  }
  .in-titulo {
    font-family: ${FONT_ALFA}; font-size: clamp(30px, 8vw, 46px);
    letter-spacing: 1; line-height: 1.06; margin: 0 0 10px;
    text-shadow: 3px 3px 0 ${C.gold};
  }
  .in-linha { font-size: 15.5px; line-height: 1.55; max-width: 560px; margin: 0; }

  /* ---- progresso ---- */
  .in-progresso { display: flex; gap: 8px; margin: 26px 0 6px; }
  .in-passo-marca {
    flex: 1 1 0; display: flex; align-items: center; gap: 8px;
    border-top: 5px solid rgba(24,18,3,.2); padding-top: 8px;
  }
  .in-passo-marca.ativo { border-top-color: ${C.ink}; }
  .in-passo-marca b {
    width: 26px; height: 26px; flex: 0 0 auto; display: grid; place-items: center;
    font-family: ${FONT_ALFA}; font-size: 13px;
    background: rgba(24,18,3,.14); color: rgba(24,18,3,.55); border: 2px solid transparent;
  }
  .in-passo-marca.ativo b { background: ${C.gold}; color: ${C.ink}; border-color: ${C.ink}; }
  .in-passo-marca i {
    font-family: ${FONT_ELITE}; font-style: normal; font-size: 11px;
    letter-spacing: 1.2px; text-transform: uppercase; opacity: .75;
  }

  .in-passo-titulo {
    font-family: ${FONT_ALFA}; font-size: clamp(21px, 5vw, 27px);
    margin: 22px 0 14px; outline: none;
  }
  .in-passo-titulo:focus-visible { outline: 3px solid ${C.goldDim}; outline-offset: 4px; }

  .in-ajuda {
    font-size: 14.5px; line-height: 1.6; margin: 0 0 18px;
    background: ${C.cream}; border-left: 5px solid ${C.gold};
    padding: 12px 14px;
  }

  .in-erro-geral {
    display: flex; align-items: flex-start; gap: 9px;
    font-size: 14.5px; line-height: 1.5; margin: 0 0 16px;
    background: #FBE3E0; border: 2px solid #8C2F22; color: #6B1F15;
    padding: 12px 14px;
  }
  .in-erro-geral svg { flex: 0 0 auto; margin-top: 2px; }

  /* ---- passo 1: funções ---- */
  .in-grupos { outline: none; }
  .in-grupo { border: 0; padding: 0; margin: 0 0 28px; }
  .in-grupo-nome {
    font-family: ${FONT_ALFA}; font-size: 19px; padding: 0;
    background: ${C.gold}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.3);
    padding: 5px 13px; margin-bottom: 10px;
  }
  .in-grupo-resumo { font-size: 14px; line-height: 1.55; opacity: .8; margin: 0 0 14px; }
  .in-cartoes { display: grid; gap: 12px; }

  .in-cartao {
    background: ${C.cream}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.24);
    padding: 12px 14px 10px;
    transition: box-shadow .12s ease, transform .12s ease;
  }
  .in-cartao.marcado {
    background: #FFF6D4;
    box-shadow: 5px 5px 0 ${C.goldDim};
  }
  .in-cartao-topo {
    display: flex; align-items: flex-start; gap: 11px; cursor: pointer;
    min-height: 44px;
  }
  .in-cartao-topo input {
    width: 24px; height: 24px; flex: 0 0 auto; margin: 2px 0 0;
    accent-color: ${C.goldDim}; cursor: pointer;
  }
  .in-cartao-icone {
    width: 40px; height: 40px; flex: 0 0 auto; display: grid; place-items: center;
    background: ${C.gold}; border: 2px solid ${C.ink}; color: ${C.ink};
  }
  .in-cartao-texto { flex: 1; min-width: 0; }
  .in-cartao-nome {
    display: block; font-family: ${FONT_ALFA}; font-size: 17px;
    letter-spacing: .3px; line-height: 1.2; margin-bottom: 3px;
  }
  .in-cartao-resumo { display: block; font-size: 14px; line-height: 1.5; opacity: .85; }

  .in-cartao-ritmo {
    display: flex; align-items: center; gap: 7px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: .6px;
    opacity: .75; margin: 10px 0 0; padding-left: 35px;
  }
  .in-cartao-ritmo svg { flex: 0 0 auto; }

  .in-cartao-mais {
    display: inline-flex; align-items: center; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.4px;
    text-transform: uppercase; text-decoration: underline;
    background: none; border: 0; color: ${C.ink}; cursor: pointer;
    padding: 6px 0 2px; margin-left: 35px;
  }
  .in-cartao-detalhe {
    border-top: 2px dashed rgba(24,18,3,.3); margin-top: 6px; padding-top: 11px;
    font-size: 14px; line-height: 1.6;
  }
  .in-detalhe-entrega { margin: 0 0 10px; }
  .in-detalhe-rotulo {
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.5px;
    text-transform: uppercase; opacity: .7; margin: 0 0 5px;
  }
  .in-cartao-detalhe ul { margin: 0; padding-left: 19px; display: flex; flex-direction: column; gap: 5px; }

  .in-contagem {
    text-align: center; font-family: ${FONT_ELITE}; font-size: 12.5px;
    letter-spacing: 1.5px; margin: 14px 0 0; opacity: .8;
  }

  /* ---- passo 2: campos ---- */
  .in-campos { display: flex; flex-direction: column; gap: 4px; }
  .in-linha-dupla { display: grid; gap: 4px; grid-template-columns: 1fr 1fr; }
  .in-campo { margin-bottom: 16px; }
  .in-campo label {
    display: block; font-family: ${FONT_ELITE}; font-size: 12px;
    letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 5px;
  }
  .in-opcional {
    font-size: 10.5px; letter-spacing: 1px; opacity: .6;
    margin-left: 7px; text-transform: none;
  }
  .in-campo input, .in-campo select {
    width: 100%; font-family: ${FONT_BITTER}; font-size: 16px;
    min-height: 48px; padding: 11px 13px;
    background: ${C.cream}; color: ${C.ink};
    border: 3px solid ${C.ink}; border-radius: 0;
    box-shadow: 3px 3px 0 rgba(24,18,3,.24);
  }
  .in-campo input:focus-visible, .in-campo select:focus-visible { outline: 3px solid ${C.goldDim}; outline-offset: 2px; }
  .in-campo input.com-erro, .in-campo select.com-erro { border-color: #8C2F22; box-shadow: 3px 3px 0 rgba(140,47,34,.3); }
  .in-dica { font-size: 13px; line-height: 1.45; opacity: .7; margin: 6px 0 0; }
  .in-erro {
    font-size: 13.5px; line-height: 1.45; margin: 6px 0 0;
    color: #8C2F22; font-weight: 600;
  }

  /* ---- passo 3: confirmação ---- */
  .in-confirma { display: flex; flex-direction: column; gap: 16px; }
  .in-resumo {
    background: ${C.cream}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.24); padding: 15px 16px;
  }
  .in-resumo-titulo {
    display: flex; align-items: center; gap: 8px;
    font-family: ${FONT_ALFA}; font-size: 17px; margin: 0 0 11px;
  }
  .in-resumo-funcoes { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .in-resumo-funcoes li {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 14px; background: ${C.gold}; color: ${C.ink};
    border: 2px solid ${C.ink}; padding: 6px 11px;
  }
  .in-resumo-dados { margin: 0; display: flex; flex-direction: column; gap: 9px; }
  .in-resumo-dados div { display: flex; gap: 10px; flex-wrap: wrap; font-size: 14.5px; }
  .in-resumo-dados dt {
    font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 1.3px;
    text-transform: uppercase; opacity: .7; min-width: 108px;
  }
  .in-resumo-dados dd { margin: 0; font-weight: 600; }
  .in-editar {
    display: inline-flex; align-items: center; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.4px;
    text-transform: uppercase; text-decoration: underline;
    background: none; border: 0; color: ${C.ink}; cursor: pointer;
    padding: 8px 0 0;
  }

  .in-lgpd {
    background: ${C.night}; color: ${C.cream};
    border: 3px solid ${C.ink}; box-shadow: 4px 4px 0 rgba(24,18,3,.4);
    padding: 16px;
  }
  .in-lgpd .in-resumo-titulo { color: ${C.gold}; }
  .in-lgpd-lista {
    list-style: none; margin: 0 0 12px; padding: 0;
    display: flex; flex-direction: column; gap: 10px;
    font-size: 14px; line-height: 1.6;
  }
  .in-lgpd-lista strong { color: ${C.gold2}; }
  .in-lgpd a { color: ${C.gold}; }
  .in-lgpd-link { font-size: 13.5px; margin: 0 0 15px; opacity: .9; }

  .in-consentimento {
    display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
    background: rgba(255,203,5,.1); border: 2px solid ${C.gold};
    padding: 13px; font-size: 14.5px; line-height: 1.55;
  }
  .in-consentimento input {
    width: 26px; height: 26px; flex: 0 0 auto; margin: 0;
    accent-color: ${C.gold}; cursor: pointer;
  }

  /* ---- navegação ---- */
  .in-acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
  .in-btn {
    flex: 1 1 190px; min-height: 52px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    font-family: ${FONT_ALFA}; font-size: 16px; letter-spacing: .4px;
    text-decoration: none; text-align: center;
    border: 3px solid ${C.ink}; padding: 13px 20px;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .in-btn svg { flex: 0 0 auto; }
  .in-btn-principal { background: ${C.gold}; color: ${C.ink}; box-shadow: 5px 5px 0 rgba(24,18,3,.35); }
  .in-btn-fantasma { background: ${C.cream}; color: ${C.ink}; box-shadow: 5px 5px 0 rgba(24,18,3,.2); flex: 0 1 150px; }
  .in-btn:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 rgba(24,18,3,.38); }
  .in-btn:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 rgba(24,18,3,.3); }
  .in-btn:disabled { opacity: .6; cursor: progress; transform: none; }
  .in-btn:focus-visible { outline: 3px solid ${C.goldDim}; outline-offset: 4px; }

  /* ---- sucesso ---- */
  .in-sucesso { text-align: center; padding-top: 48px; }
  .in-sucesso-selo {
    width: 84px; height: 84px; margin: 0 auto 20px;
    display: grid; place-items: center;
    background: ${C.gold}; color: ${C.ink};
    border: 4px solid ${C.ink}; border-radius: 50%;
    box-shadow: 6px 6px 0 rgba(24,18,3,.3);
  }
  .in-sucesso .in-linha { margin: 0 auto; }
  .in-proximos {
    list-style: none; margin: 28px 0 0; padding: 0;
    display: flex; flex-direction: column; gap: 11px; text-align: left;
  }
  .in-proximos li {
    display: flex; align-items: flex-start; gap: 13px;
    background: ${C.cream}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.22);
    padding: 13px 15px; font-size: 14.5px; line-height: 1.55;
  }
  .in-proximos b {
    width: 32px; height: 32px; flex: 0 0 auto; display: grid; place-items: center;
    font-family: ${FONT_ALFA}; font-size: 15px;
    background: ${C.gold}; color: ${C.ink}; border: 2px solid ${C.ink};
  }
  .in-agora-titulo {
    font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 2.2px;
    text-transform: uppercase; opacity: .7; text-align: left;
    margin: 30px 0 0;
  }
  /* display:flex, e não inline-flex: o link tem que cair na própria linha,
     depois do texto. Com inline-flex ele emendaria no fim do parágrafo — e
     transformar o span em coluna de flex, que foi a primeira tentativa, jogava
     cada palavra em negrito para uma linha só dela.
     (Nada de crase neste bloco: ele mora dentro de um template literal.) */
  .in-passo-link {
    display: flex; width: fit-content; align-items: center; gap: 7px;
    min-height: 44px; margin-top: 6px; font-family: ${FONT_ELITE}; font-size: 12px;
    letter-spacing: 1.2px; text-transform: uppercase;
    color: ${C.ink}; text-decoration: underline; text-underline-offset: 3px;
  }
  /* O passo 4 é <button> (chama a Web Share API), os outros são <a>. Sem este
     reset o navegador desenha caixa cinza de botão no meio de três links. */
  button.in-passo-link {
    background: none; border: 0; padding: 0; cursor: pointer; text-align: left;
  }
  .in-aviso { font-size: 14px; line-height: 1.6; opacity: .8; margin: 20px 0 0; }
  .in-sucesso .in-acoes { justify-content: center; }

  /* ---- telas pequenas ---- */
  @media (max-width: 620px) {
    .in-main { padding: 16px 14px 56px; }
    .in-linha-dupla { grid-template-columns: 1fr; }
    .in-passo-marca i { display: none; }
    .in-passo-marca { gap: 0; justify-content: center; }
    .in-resumo-dados div { flex-direction: column; gap: 2px; }
    .in-btn { flex: 1 1 100%; }
    .in-btn-fantasma { flex: 1 1 100%; order: 2; }
  }

  @media (hover: none) {
    .in-btn:hover { transform: none; box-shadow: 5px 5px 0 rgba(24,18,3,.35); }
  }
  @media (prefers-reduced-motion: reduce) {
    .in-btn, .in-cartao { transition: none !important; }
  }
`;
