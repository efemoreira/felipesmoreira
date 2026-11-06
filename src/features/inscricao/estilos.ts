import { C, FOCO, FONT_ALFA, FONT_TEXTO, RAIO, TITULO, borda, bordaFina, sombra } from "@/lib/theme";

/**
 * A folha de estilo do formulário de `/queroajudar`, num arquivo só.
 *
 * Continua sendo uma string injetada num `<style>`, e não Tailwind nem CSS
 * Module: a identidade do site sai dos tokens de `@/lib/theme` (ver o CLAUDE.md),
 * e é justamente essa interpolação que uma folha estática não faria.
 *
 * É a tela mais importante do site, e tudo aqui serve a uma coisa: quem chegou
 * até o formulário não pode ter dúvida de onde escrever nem do que vem depois.
 * Uma coluna estreita, rótulo legível, campo grande e um botão de ouro por tela.
 */

export const css = `
  .in-fundo { min-height: 70dvh; background: ${C.paper}; color: ${C.ink}; font-family: ${FONT_TEXTO}; }
  .in-main { max-width: 640px; margin: 0 auto; padding: clamp(24px, 5vw, 48px) 20px clamp(48px, 7vw, 80px); }

  .in-sr {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
  }
  .in-armadilha { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
  .in-cabecalho { margin-bottom: 28px; }
  .in-titulo { font-family: ${FONT_ALFA}; font-weight: 400; font-size: ${TITULO.pagina}; line-height: 1.06; margin: 0 0 12px; outline: none; text-wrap: balance; }
  .in-linha { font-size: 18px; line-height: 1.55; margin: 0; color: ${C.suave}; text-wrap: pretty; }

  /* ---- progresso ---- */
  .in-progresso { display: flex; gap: 6px; margin: 0 0 6px; }
  .in-passo-marca { flex: 1 1 0; display: flex; align-items: center; gap: 8px; padding-top: 10px; border-top: 4px solid ${C.linha}; color: ${C.suave}; }
  .in-passo-marca.ativo { border-top-color: ${C.gold}; color: ${C.ink}; }
  .in-passo-marca b { width: 24px; height: 24px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 50%; font-size: 13.5px; font-weight: 800; background: ${C.fundo}; }
  .in-passo-marca.ativo b { background: ${C.gold}; }
  .in-passo-marca i { font-style: normal; font-size: 14.5px; line-height: 1.25; font-weight: 600; }

  .in-passo-titulo { font-family: ${FONT_TEXTO}; font-size: 24px; line-height: 1.25; font-weight: 800; letter-spacing: -.01em; margin: 24px 0 14px; outline: none; }
  .in-passo-titulo:focus-visible { outline: ${FOCO}; outline-offset: 4px; }

  .in-ajuda { font-size: 16px; line-height: 1.55; margin: 0 0 20px; color: ${C.suave}; }

  .in-erro-geral { display: flex; align-items: flex-start; gap: 9px; font-size: 16px; line-height: 1.5; font-weight: 600; margin: 0 0 16px; background: ${C.erroFundo}; color: ${C.erroTinta}; padding: 12px 14px; border-radius: ${RAIO.p + 2}px; }
  .in-erro-geral svg { flex: 0 0 auto; margin-top: 2px; }

  /* ---- funções ---- */
  .in-grupos { outline: none; }
  .in-grupo { border: 0; padding: 0; margin: 0 0 24px; }
  .in-grupo-nome { font-size: 18px; font-weight: 800; padding: 0; margin-bottom: 4px; }
  .in-grupo-resumo { font-size: 15.5px; line-height: 1.5; color: ${C.suave}; margin: 0 0 12px; }
  .in-cartoes { display: grid; gap: 10px; }

  .in-cartao { background: ${C.paper}; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.m}px; padding: 12px 14px; transition: border-color .15s ease, background-color .15s ease; }
  .in-cartao.marcado { background: ${C.ouroClaro}; border-color: ${C.goldDim}; }
  .in-cartao-topo { display: flex; align-items: flex-start; gap: 11px; cursor: pointer; min-height: 44px; }
  .in-cartao-topo input { width: 24px; height: 24px; flex: 0 0 auto; margin: 2px 0 0; accent-color: ${C.ink}; cursor: pointer; }
  .in-cartao-icone { width: 40px; height: 40px; flex: 0 0 auto; display: grid; place-items: center; background: ${C.gold}; border-radius: ${RAIO.p + 2}px; color: ${C.ink}; }
  .in-cartao-texto { flex: 1; min-width: 0; }
  .in-cartao-nome { display: block; font-size: 17.5px; font-weight: 800; line-height: 1.25; margin-bottom: 2px; }
  .in-cartao-resumo { display: block; font-size: 15.5px; line-height: 1.45; color: ${C.suave}; }
  .in-cartao-ritmo { display: flex; align-items: flex-start; gap: 7px; font-size: 15px; line-height: 1.4; color: ${C.suave}; margin: 8px 0 0; padding-left: 35px; }
  .in-cartao-ritmo svg { flex: 0 0 auto; margin-top: 2px; }
  .in-cartao-mais { display: inline-flex; align-items: center; min-height: 44px; font-family: ${FONT_TEXTO}; font-size: 15.5px; font-weight: 700; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; text-underline-offset: 3px; background: none; border: 0; color: ${C.ink}; cursor: pointer; padding: 4px 0 0; margin-left: 35px; }
  .in-cartao-detalhe { border-top: ${borda()}; margin-top: 6px; padding-top: 11px; font-size: 15.5px; line-height: 1.55; }
  .in-detalhe-entrega { margin: 0 0 10px; }
  .in-detalhe-rotulo { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
  .in-cartao-detalhe ul { margin: 0; padding-left: 19px; list-style: disc; display: flex; flex-direction: column; gap: 5px; }
  .in-contagem { text-align: center; font-size: 15.5px; font-weight: 600; margin: 14px 0 0; color: ${C.suave}; }

  /* ---- campos ---- */
  .in-campos { display: flex; flex-direction: column; gap: 2px; }
  .in-linha-dupla { display: grid; gap: 2px 14px; grid-template-columns: 1fr 1fr; }
  .in-campo { margin-bottom: 16px; min-width: 0; }
  .in-campo label { display: block; font-size: 16px; line-height: 1.3; font-weight: 700; margin-bottom: 6px; }
  .in-opcional { font-size: 15px; font-weight: 400; color: ${C.suave}; margin-left: 6px; }
  .in-campo input, .in-campo select, .in-campo textarea {
    box-sizing: border-box; width: 100%; font-family: ${FONT_TEXTO}; font-size: 17px;
    min-height: 52px; padding: 12px 14px; background: ${C.paper}; color: ${C.ink};
    border: ${borda(C.linhaForte)}; border-radius: ${RAIO.p + 2}px; transition: border-color .15s ease, box-shadow .15s ease;
  }
  .in-campo input:hover, .in-campo select:hover, .in-campo textarea:hover { border-color: ${C.ink}; }
  .in-campo input:focus, .in-campo select:focus, .in-campo textarea:focus { outline: none; border-color: ${C.ink}; box-shadow: 0 0 0 3px ${C.gold}; }
  .in-campo input.com-erro, .in-campo select.com-erro { border-color: ${C.erroTinta}; box-shadow: 0 0 0 3px ${C.erroFundo}; }
  .in-campo textarea { resize: vertical; }
  .in-dica { font-size: 15px; line-height: 1.45; color: ${C.suave}; margin: 6px 0 0; }
  .in-erro { font-size: 15px; line-height: 1.45; margin: 6px 0 0; color: ${C.erroTinta}; font-weight: 600; }

  /* ---- confirmação ---- */
  .in-confirma { display: flex; flex-direction: column; gap: 16px; }
  .in-resumo { background: ${C.paper}; border: ${borda()}; border-radius: ${RAIO.g}px; padding: 18px; }
  .in-resumo-titulo { display: flex; align-items: center; gap: 8px; font-size: 18px; line-height: 1.3; font-weight: 800; margin: 0 0 11px; }
  .in-resumo-funcoes { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .in-resumo-funcoes li { display: inline-flex; align-items: center; gap: 7px; font-size: 15px; font-weight: 600; background: ${C.ouroClaro}; color: ${C.ink}; padding: 5px 12px; border-radius: ${RAIO.pilula}px; }
  .in-resumo-dados { margin: 0; display: flex; flex-direction: column; gap: 9px; }
  .in-resumo-dados div { display: flex; gap: 10px; flex-wrap: wrap; font-size: 16px; }
  .in-resumo-dados dt { color: ${C.suave}; min-width: 120px; }
  .in-resumo-dados dd { margin: 0; font-weight: 600; }
  /* A faixa "Você quer entrar em…": o núcleo ou tema escolhido antes. */
  .in-interesse { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin: 0 0 22px; padding: 12px 16px; font-size: 16px; line-height: 1.5; background: ${C.ouroClaro}; color: ${C.ink}; border-radius: ${RAIO.m}px; }
  .in-editar { display: inline-flex; align-items: center; min-height: 44px; font-family: ${FONT_TEXTO}; font-size: 15.5px; font-weight: 700; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; text-underline-offset: 3px; background: none; border: 0; color: ${C.ink}; cursor: pointer; padding: 6px 0 0; }

  .in-lgpd { background: ${C.fundo}; color: ${C.ink}; border-radius: ${RAIO.g}px; padding: 18px; }
  .in-lgpd-lista { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 15.5px; line-height: 1.55; color: ${C.suave}; }
  .in-lgpd-lista strong { color: ${C.ink}; }
  .in-lgpd a { color: ${C.ink}; font-weight: 700; }
  .in-lgpd-link { font-size: 15.5px; margin: 0 0 15px; color: ${C.suave}; }
  .in-consentimento { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; background: ${C.paper}; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.m}px; padding: 14px; font-size: 16px; line-height: 1.5; }
  .in-consentimento input { width: 26px; height: 26px; flex: 0 0 auto; margin: 0; accent-color: ${C.ink}; cursor: pointer; }

  /* ---- navegação ---- */
  .in-acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
  .in-btn {
    flex: 1 1 190px; min-height: 56px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: ${FONT_TEXTO}; font-size: 18px; font-weight: 700; line-height: 1.2; text-decoration: none; text-align: center;
    border: 1px solid transparent; border-radius: ${RAIO.m}px; padding: 13px 20px; transition: background-color .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease;
  }
  .in-btn svg { flex: 0 0 auto; }
  .in-btn-principal svg { order: 1; }
  .in-btn-principal { background: ${C.gold}; color: ${C.ink}; }
  .in-btn-principal:hover { background: ${C.gold2}; box-shadow: ${sombra("cartao", "rgba(133,96,6,.22)")}; transform: translateY(-1px); }
  .in-btn-fantasma { background: ${C.paper}; color: ${C.ink}; border-color: ${C.linhaForte}; flex: 0 1 150px; }
  .in-btn-fantasma:hover { border-color: ${C.ink}; }
  .in-btn:active { transform: translateY(0); }
  .in-btn:disabled { opacity: .6; cursor: progress; transform: none; }
  .in-btn:focus-visible { outline: ${FOCO}; outline-offset: 3px; }

  /* ---- sucesso ---- */
  .in-sucesso { text-align: center; padding-top: 48px; }
  .in-sucesso-selo { width: 84px; height: 84px; margin: 0 auto 20px; display: grid; place-items: center; background: ${C.gold}; color: ${C.ink}; border-radius: 50%; }
  .in-sucesso .in-linha { margin: 0 auto; }
  .in-proximos { list-style: none; margin: 28px 0 0; padding: 0; display: flex; flex-direction: column; gap: 11px; text-align: left; }
  .in-proximos li { display: flex; align-items: flex-start; gap: 13px; background: ${C.paper}; border: ${borda()}; border-radius: ${RAIO.m}px; padding: 13px 15px; font-size: 16px; line-height: 1.5; }
  .in-proximos b { width: 32px; height: 32px; flex: 0 0 auto; display: grid; place-items: center; font-size: 15px; font-weight: 800; background: ${C.gold}; color: ${C.ink}; border-radius: 50%; }
  .in-agora-titulo { font-size: 16px; font-weight: 700; color: ${C.ink}; text-align: left; margin: 30px 0 0; }
  /* display:flex, e não inline-flex: o link tem que cair na própria linha,
     depois do texto. Com inline-flex ele emendaria no fim do parágrafo.
     (Nada de crase neste bloco: ele mora dentro de um template literal.) */
  .in-passo-link { display: flex; width: fit-content; align-items: center; gap: 7px; min-height: 44px; margin-top: 6px; font-size: 15.5px; font-weight: 700; color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; text-underline-offset: 3px; }
  /* O passo 4 é <button> (chama a Web Share API), os outros são <a>. */
  button.in-passo-link { background: none; border: 0; padding: 0; cursor: pointer; text-align: left; font-family: ${FONT_TEXTO}; }
  .in-aviso { font-size: 15.5px; line-height: 1.55; color: ${C.suave}; margin: 20px 0 0; }
  .in-sucesso .in-acoes { justify-content: center; }

  .in-sem-borda { border: 0; margin: 0; padding: 0; min-width: 0; }
  .in-detalhes { margin: 0 0 18px; padding: 4px 16px; border: ${borda()}; border-radius: ${RAIO.m}px; background: ${C.paper}; }
  .in-detalhes summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; font-size: 16.5px; font-weight: 700; cursor: pointer; line-height: 1.3; list-style: none; }
  /* A setinha: sem ela a linha não parece que abre. */
  .in-detalhes summary::after { content: ""; flex: 0 0 auto; width: 9px; height: 9px; margin-right: 4px; border-right: ${bordaFina(C.ink)}; border-bottom: ${bordaFina(C.ink)}; transform: rotate(-45deg); transition: transform .15s ease; }
  .in-detalhes[open] summary::after { transform: rotate(45deg); }
  .in-detalhes[open] summary { margin-bottom: 8px; }
  .in-escolhas { border: 0; margin: 0 0 20px; padding: 0; min-width: 0; }
  .in-escolhas legend { font-size: 18px; font-weight: 800; margin-bottom: 10px; }
  .in-opcoes { display: grid; gap: 8px; }
  .in-opcao { display: flex; align-items: center; gap: 12px; min-height: 50px; padding: 10px 14px; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.p + 2}px; background: ${C.paper}; cursor: pointer; font-size: 16.5px; line-height: 1.4; transition: border-color .15s ease, background-color .15s ease; }
  .in-opcao:hover { border-color: ${C.ink}; }
  .in-opcao.selecionada { background: ${C.ouroClaro}; border-color: ${C.goldDim}; font-weight: 600; }
  .in-opcao input { width: 22px; height: 22px; flex-shrink: 0; accent-color: ${C.ink}; }
  .in-proximo-passo { margin-top: 26px; text-align: left; line-height: 1.6; }
  .in-proximo-passo .in-btn { box-sizing: border-box; width: 100%; }
  .in-sucesso .in-btn-fantasma { flex: 1 1 230px; }

  /* ---- telas pequenas ---- */
  @media (max-width: 620px) {
    .in-linha-dupla { grid-template-columns: 1fr; }
    .in-resumo-dados div { flex-direction: column; gap: 2px; }
    .in-btn { flex: 1 1 100%; }
    .in-btn-fantasma { flex: 1 1 100%; order: 2; }
  }
  @media (max-width: 460px) {
    .in-passo-marca i { font-size: 13.5px; }
    .in-passo-marca b { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .in-btn, .in-cartao, .in-opcao, .in-campo input, .in-campo select, .in-campo textarea { transition: none !important; }
  }
`;
