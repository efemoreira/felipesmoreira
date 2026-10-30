import { BORDA, C, FONT_ALFA, FONT_BITTER, FONT_ELITE, HATCH, LARGURA, PONTOS, borda, bordaFina, sombra } from "@/lib/theme";

export default function Estilos() {
  return <style>{`
    .ig, .ig-janela { --ig-tinta: ${C.ink}; --ig-papel: ${C.paper}; --ig-creme: ${C.cream}; --ig-ouro: ${C.gold}; color: ${C.ink}; font-family: ${FONT_BITTER}; color-scheme: light; }
    .ig { background: ${HATCH}, ${C.paper}; overflow: clip; }
    .ig *, .ig-janela * { box-sizing: border-box; }
    .ig button, .ig select, .ig input, .ig-janela button { font: inherit; }
    .ig button, .ig-janela button { cursor: pointer; }
    .ig button:disabled, .ig-janela button:disabled { cursor: default; }
    .ig a, .ig-janela a { text-underline-offset: 4px; }
    .ig button:focus-visible, .ig a:focus-visible, .ig input:focus-visible, .ig select:focus-visible, .ig summary:focus-visible, .ig-janela button:focus-visible, .ig-janela a:focus-visible, .ig-janela summary:focus-visible { outline: ${BORDA}px solid ${C.goldDim}; outline-offset: 4px; }
    .ig-abertura, .ig-estatisticas, .ig-acervo, .ig-fecho { max-width: ${LARGURA.conteudo}px; margin: 0 auto; padding-left: 20px; padding-right: 20px; }
    .ig-abertura { display: grid; gap: 32px; padding-top: 48px; padding-bottom: 36px; align-items: center; }
    .ig-kicker { font: 12px/1.6 ${FONT_ELITE}; letter-spacing: 1.6px; text-transform: uppercase; margin: 0 0 16px; }
    .ig-abertura h2 { font: 32px/1.16 ${FONT_ALFA}; letter-spacing: -.7px; margin: 0 0 22px; }
    .ig-abertura-texto > p:not(.ig-kicker):not(.ig-nota) { font-size: 16px; line-height: 1.85; margin: 0 0 24px; }
    .ig-abertura .ig-nota { margin-top: 22px; }
    .ig-botao { min-height: 48px; display: inline-flex; justify-content: center; align-items: center; gap: 20px; text-align: center; background: ${C.gold}; border: ${borda()}; color: ${C.ink}; box-shadow: ${sombra("rente")}; padding: 10px 16px; font: 14px/1.5 ${FONT_BITTER}; text-decoration: none; }
    .ig-botao:hover { background: ${C.gold2}; }
    .ig-link { background: none; border: 0; color: ${C.goldDim}; text-decoration: underline; text-underline-offset: 4px; min-height: 44px; text-align: left; padding: 8px 0; font-size: 14px; }
    .ig-nota { font: 13px/1.8 ${FONT_BITTER}; opacity: .8; margin: 12px 0 20px; }
    .ig-foto { margin: 0; background: ${C.cream}; border: ${bordaFina()}; min-width: 0; }
    .ig-foto > a { display: block; overflow: hidden; }
    .ig-foto img { width: 100%; height: auto; aspect-ratio: 3/2; object-fit: cover; display: block; }
    .ig-foto figcaption { padding: 13px 15px 15px; }
    .ig-foto figcaption p { font-size: 13px; line-height: 1.65; margin: 0 0 7px; }
    .ig-foto figcaption > span { font-size: 11px; line-height: 1.7; display: block; }
    .ig-foto figcaption a { color: ${C.goldDim}; text-decoration: underline; }
    .ig-estatisticas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; border-top: ${bordaFina()}; border-bottom: ${bordaFina()}; padding-top: 25px; padding-bottom: 25px; }
    .ig-estatisticas > div { display: flex; align-items: center; gap: 14px; }
    .ig-estatisticas strong { font: 34px/1 ${FONT_ALFA}; }
    .ig-estatisticas span { font: 11px/1.6 ${FONT_ELITE}; max-width: 110px; text-transform: uppercase; }
    .ig-acervo { padding-top: 52px; padding-bottom: 50px; scroll-margin-top: 90px; }
    .ig-titulo-secao { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 26px; flex-wrap: wrap; }
    .ig-titulo-secao h2 { font: 27px/1.25 ${FONT_ALFA}; margin: 0; }
    .ig-titulo-secao .ig-kicker { font-size: 10px; }
    .ig-abas { display: flex; gap: 4px; flex-wrap: wrap; border-bottom: ${borda()}; padding-bottom: 12px; margin-bottom: 28px; }
    .ig-abas button { min-height: 48px; padding: 10px 13px; border: 0; background: transparent; color: ${C.ink}; font: 13px ${FONT_BITTER}; }
    .ig-abas button[aria-current=page] { background: ${C.ink}; color: ${C.gold}; }
    .ig-abas button:hover:not([aria-current]) { background: ${C.cream}; }
    .ig-busca { margin-bottom: 30px; }
    .ig-busca > label { display: block; font: 11px ${FONT_ELITE}; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
    .ig-busca > div { display: flex; align-items: center; border: ${bordaFina()}; background: ${C.cream}; gap: 8px; padding: 0 10px; min-height: 56px; }
    .ig-busca > div > span { font-size: 29px; line-height: 1; }
    .ig-busca input { width: 100%; min-width: 0; min-height: 52px; font-size: 16px; background: transparent; color: ${C.ink}; border: 0; padding: 8px; }
    .ig-busca button { min-height: 44px; font-size: 12px; text-decoration: underline; padding: 8px; }
    .ig-filtros { align-self: start; margin-bottom: 25px; padding: 20px; border: ${bordaFina()}; background: ${C.cream}; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 14px; }
    .ig-filtro-titulo { display: flex; align-items: center; justify-content: space-between; gap: 12px; font: 10px ${FONT_ELITE}; letter-spacing: 1px; grid-column: 1/-1; margin-bottom: 5px; }
    .ig-filtro-titulo button { text-decoration: underline; min-height: 44px; padding: 8px 0; font-size: 12px; }
    .ig-filtros > label { font: 11px/1.6 ${FONT_ELITE}; letter-spacing: .4px; grid-column: 1/-1; }
    .ig-filtros select { grid-column: 1/-1; width: 100%; min-width: 0; min-height: 46px; padding: 8px; font-size: 16px; background: ${C.paper}; border: ${bordaFina()}; border-radius: 0; color: ${C.ink}; margin-bottom: 10px; }
    .ig-filtros fieldset { grid-column: 1/-1; border: 0; padding: 0; margin: 8px 0 0; min-width: 0; }
    .ig-filtros legend { font: 11px ${FONT_ELITE}; margin-bottom: 10px; }
    .ig-camadas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
    .ig-camadas button { display: flex; align-items: center; gap: 7px; text-align: left; border: ${bordaFina()}; min-height: 44px; padding: 7px; font-size: 11px; }
    .ig-camadas b { font: 10px ${FONT_ELITE}; }
    .ig-camadas button[aria-pressed=true] { background: ${C.gold}; }
    .ig-filtros .ig-nota { grid-column: 1/-1; font-size: 12px; margin: 5px 0 0; }
    .ig-resultados { min-width: 0; }
    .ig-barra-resultados { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .ig-barra-resultados > p, .ig-barra-resultados > label { font-size: 12px; margin: 0; }
    .ig-barra-resultados select { font-size: 16px; min-height: 44px; border: 0; background: ${C.paper}; color: ${C.ink}; max-width: 210px; }
    .ig-ano { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 12px; margin: 28px 0; }
    .ig-ano > h3 { font: 17px ${FONT_ALFA}; margin: 16px 0 0; }
    .ig-ano > div { display: grid; gap: 16px; padding-left: 15px; border-left: ${bordaFina()}; }
    .ig-verbete { background: ${C.cream}; border: ${bordaFina()}; padding: 18px; position: relative; min-width: 0; }
    .ig-ano .ig-verbete::before { content: ''; position: absolute; top: 20px; left: -22px; height: 10px; width: 10px; background: ${C.ink}; border: ${bordaFina(C.paper)}; }
    .ig-ano .ig-serie-mbl::before { background: ${C.goldDim}; }
    .ig-linha-topo { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; }
    .ig-serie { font: 10px ${FONT_ELITE}; text-transform: uppercase; letter-spacing: 1px; }
    .ig-selo { font: 10px/1.4 ${FONT_ELITE}; border: ${bordaFina()}; padding: 4px 7px; background: ${C.paper}; }
    .ig-selo.ig-teoria, .ig-selo.ig-alegacao { border-style: dashed; }
    .ig-abrir-verbete { display: flex; justify-content: space-between; align-items: start; text-align: left; width: 100%; gap: 18px; min-height: 44px; border: 0; background: none; padding: 0; color: ${C.ink}; }
    .ig-abrir-verbete h3 { font: 20px/1.32 ${FONT_ALFA}; margin: 0 0 12px; overflow-wrap: anywhere; }
    .ig-abrir-verbete > span { font-size: 22px; }
    .ig-abrir-verbete:hover h3 { text-decoration: underline; text-underline-offset: 4px; }
    .ig-verbete > p { font-size: 14px; line-height: 1.85; margin: 0; }
    .ig-verbete-rodape { display: flex; flex-wrap: wrap; gap: 9px 16px; border-top: ${bordaFina(C.paper)}; margin-top: 17px; padding-top: 12px; font: 10px/1.7 ${FONT_ELITE}; }
    .ig-foto-pequena { margin-top: 18px; }
    .ig-foto-pequena img { aspect-ratio: 16/7; }
    .ig-foto-pequena figcaption { padding: 10px 12px; }
    .ig-foto-pequena figcaption p { font-size: 12px; }
    .ig-grade-pessoas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
    .ig-pessoa { border: ${bordaFina()}; background: ${C.cream}; min-width: 0; }
    .ig-pessoa-abrir { display: flex; width: 100%; flex-direction: column; align-items: start; text-align: left; background: transparent; border: 0; padding: 0; color: ${C.ink}; }
    .ig-pessoa-abrir > img { display: block; width: 100%; aspect-ratio: 1/1; height: auto; object-fit: cover; object-position: center 28%; filter: saturate(.65); }
    .ig-pessoa-abrir:hover > img { filter: saturate(1); }
    .ig-pessoa-texto { display: block; padding: 17px 13px; width: 100%; }
    .ig-pessoa-texto > strong { display: block; font: 17px/1.3 ${FONT_ALFA}; margin-bottom: 10px; overflow-wrap: anywhere; }
    .ig-pessoa-texto > small { font-size: 12px; line-height: 1.6; display: block; }
    .ig-pessoa-series { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 13px; }
    .ig-pessoa-series > span { font: 9px/1.4 ${FONT_ELITE}; padding: 4px; background: ${C.paper}; }
    .ig-mini-credito { font-size: 10px; line-height: 1.7; padding: 0 13px 15px; margin: 0; }
    .ig-mini-credito a { color: ${C.goldDim}; text-decoration: underline; }
    .ig-pessoa-extrato { display: block; font: 12px/1.8 ${FONT_BITTER}; margin-top: 12px; }
    .ig-iniciais { display: grid; place-items: center; font: 38px ${FONT_ALFA}; aspect-ratio: 1/1; width: 100%; background: ${HATCH}, ${C.paper}; }
    .ig-grade-verbetes { display: grid; gap: 16px; }
    .ig-alternar { display: flex; gap: 5px; }
    .ig-alternar button { min-height: 44px; padding: 8px 12px; border: ${bordaFina()}; font-size: 12px; }
    .ig-alternar button[aria-pressed=true] { background: ${C.gold}; }
    .ig-mais { width: 100%; padding: 12px 16px; min-height: 48px; border: ${bordaFina()}; background: ${C.paper}; margin-top: 26px; font-size: 14px; }
    .ig-mais:hover { background: ${C.gold}; }
    .ig-mais small { display: inline-block; margin-left: 12px; font-size: 11px; }
    .ig-vazio { border: ${bordaFina()}; border-style: dashed; padding: 35px 20px; text-align: center; }
    .ig-vazio h3 { font: 23px/1.3 ${FONT_ALFA}; }
    .ig-vazio p { font-size: 14px; margin-top: 15px; }
    .ig-vazio button { text-decoration: underline; min-height: 44px; font-size: 14px; }
    .ig-dossie-intro { max-width: 760px; margin-bottom: 35px; }
    .ig-dossie-intro h2 { font: 30px/1.25 ${FONT_ALFA}; margin: 0 0 24px; }
    .ig-dossie-intro > p:last-child { font-size: 16px; line-height: 1.9; }
    .ig-subtitulo { font: 26px/1.3 ${FONT_ALFA}; margin: 38px 0 18px; }
    .ig-aviso { border-left: ${borda(C.goldDim)}; padding: 16px 20px; background: ${C.cream}; font-size: 14px; line-height: 1.9; margin: 20px 0 28px; }
    .ig-aviso p { margin: 10px 0 0; }
    .ig-conexao { border: ${bordaFina()}; background: ${C.cream}; padding: 22px; margin-bottom: 18px; }
    .ig-conexao > div:first-child { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
    .ig-conexao h3 { font: 24px/1.3 ${FONT_ALFA}; margin: 0; }
    .ig-ligacoes { display: flex; flex-wrap: wrap; gap: 7px; margin: 18px 0; }
    .ig-ligacoes span { background: ${C.paper}; border: ${bordaFina()}; padding: 7px 10px; font: 11px ${FONT_ELITE}; }
    .ig-relacionados > button { display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%; background: transparent; text-align: left; min-height: 56px; border: 0; border-bottom: ${bordaFina(C.paper)}; padding: 14px 0; color: ${C.ink}; }
    .ig-relacionados small { display: block; font: 10px/1.6 ${FONT_ELITE}; opacity: .8; margin-bottom: 6px; }
    .ig-relacionados strong { font: 14px/1.6 ${FONT_BITTER}; }
    .ig-relacionados button:hover strong { text-decoration: underline; }
    .ig-grade-videos { display: grid; gap: 22px; }
    .ig-video { min-width: 0; background: ${C.cream}; border: ${bordaFina()}; padding: 22px; }
    .ig-video h3 { font: 25px/1.3 ${FONT_ALFA}; margin: 0 0 15px; }
    .ig-video > p { font-size: 14px; line-height: 1.85; }
    .ig-video .ig-kicker { font-size: 10px; }
    .ig-player { aspect-ratio: 16/9; background: ${C.night}; position: relative; overflow: hidden; border: ${bordaFina()}; }
    .ig-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    .ig-play { width: 100%; height: 100%; display: block; position: absolute; inset: 0; padding: 0; border: 0; background: ${C.night}; overflow: hidden; }
    .ig-play img { width: 100%; height: 100%; object-fit: cover; opacity: .65; display: block; }
    .ig-play:hover img { opacity: .85; }
    .ig-play-simbolo { display: grid; place-items: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${C.gold}; color: ${C.ink}; width: 58px; height: 48px; border: ${borda()}; box-shadow: ${sombra("rente", C.sombraNoite)}; }
    .ig-play-rotulo { position: absolute; bottom: 12px; left: 12px; background: ${C.ink}; color: ${C.cream}; font: 10px ${FONT_ELITE}; padding: 6px 10px; }
    .ig-player-credito { font-size: 11px; line-height: 1.8; margin: 11px 0; }
    .ig-player-credito a { color: ${C.goldDim}; text-decoration: underline; }
    .ig-capitulos { border-top: ${bordaFina(C.paper)}; border-bottom: ${bordaFina(C.paper)}; margin: 15px 0; }
    .ig-capitulos summary { display: flex; justify-content: space-between; align-items: center; min-height: 48px; font-size: 13px; cursor: pointer; list-style: none; }
    .ig-capitulos > div { display: grid; padding-bottom: 15px; }
    .ig-capitulos button { min-height: 44px; border: 0; text-align: left; font-size: 12px; line-height: 1.7; background: transparent; padding: 8px 4px; }
    .ig-capitulos button:hover { background: ${C.paper}; }
    .ig-capitulos button span { font: 11px ${FONT_ELITE}; margin-right: 10px; }
    .ig-fonte { display: block; padding: 15px 0; border-bottom: ${bordaFina(C.paper)}; overflow-wrap: anywhere; text-decoration: none; }
    .ig-fonte strong { display: block; font: 14px/1.65 ${FONT_BITTER}; }
    .ig-fonte:hover strong { text-decoration: underline; }
    .ig-fonte small { display: block; font: 10px/1.7 ${FONT_ELITE}; margin-top: 6px; opacity: .75; }
    .ig-lista-fontes > div { display: grid; grid-template-columns: 35px minmax(0, 1fr); gap: 12px; }
    .ig-lista-fontes > div > span { padding-top: 18px; font: 10px ${FONT_ELITE}; }
    .ig-galeria { display: grid; gap: 24px; align-items: start; }
    .ig-galeria .ig-retrato img { aspect-ratio: 4/3; object-position: center 25%; }
    .ig-fecho { border-top: ${bordaFina()}; padding-top: 40px; padding-bottom: 48px; display: grid; gap: 20px; }
    .ig-fecho h2 { font: 32px/1.3 ${FONT_ALFA}; margin: 0; }
    .ig-fecho p:not(.ig-kicker) { font-size: 15px; line-height: 1.9; }
    .ig-janela { margin: auto; width: min(850px, calc(100vw - 28px)); max-height: 90vh; max-height: 90dvh; padding: 0; background: ${C.cream}; border: ${borda()}; box-shadow: ${sombra("alto", C.sombraNoite)}; border-radius: 0; }
    .ig-janela::backdrop { background: color-mix(in srgb, ${C.night} 85%, transparent); backdrop-filter: blur(4px); }
    .ig-janela-barra { display: flex; align-items: center; justify-content: space-between; position: sticky; z-index: 2; top: 0; background: ${C.ink}; color: ${C.cream}; padding: 7px 18px; gap: 15px; }
    .ig-janela-barra > span { font: 10px/1.6 ${FONT_ELITE}; letter-spacing: 1px; }
    .ig-janela-barra button { border: 0; background: transparent; color: ${C.gold}; min-width: 44px; min-height: 44px; font-size: 22px; }
    .ig-janela-miolo { padding: 28px 22px 36px; }
    .ig-janela h2 { font: 29px/1.25 ${FONT_ALFA}; margin: 0 0 22px; overflow-wrap: anywhere; }
    .ig-janela p { font-size: 15px; line-height: 1.85; }
    .ig-janela .ig-kicker { font-size: 11px; }
    .ig-etiquetas { display: flex; gap: 8px 13px; flex-wrap: wrap; font: 10px/1.7 ${FONT_ELITE}; margin-bottom: 22px; }
    .ig-etiquetas > span { padding: 5px 8px; background: ${C.paper}; }
    .ig-janela .ig-resumo { font-size: 17px; line-height: 1.9; }
    .ig-desfecho { border: ${bordaFina()}; border-left: 7px solid ${C.goldDim}; background: ${C.paper}; padding: 18px; margin: 24px 0; }
    .ig-desfecho h3 { font: 12px ${FONT_ELITE}; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; }
    .ig-desfecho p { margin: 0; }
    .ig-detalhe-secao { margin: 30px 0; }
    .ig-detalhe-secao > h3 { font: 20px/1.4 ${FONT_ALFA}; margin: 0 0 18px; }
    .ig-pessoas-links { display: flex; flex-wrap: wrap; gap: 8px; }
    .ig-pessoas-links button { border: ${bordaFina()}; background: ${C.paper}; min-height: 44px; text-align: left; padding: 8px 12px; font-size: 13px; color: ${C.ink}; }
    .ig-janela .ig-retrato { max-width: 370px; margin: 20px 0 26px; }
    .ig-janela .ig-retrato img { aspect-ratio: 1/1; object-position: center 25%; }
    .ig-janela .ig-foto:not(.ig-retrato) { margin: 22px 0; }
    .ig-janela .ig-nota { font-size: 12px; }
    .ig-relacao { background: ${C.paper}; border: ${bordaFina()}; padding: 18px; margin-bottom: 15px; }
    .ig-relacao > button { min-height: 44px; padding: 0; border: 0; text-align: left; color: ${C.ink}; font: 18px/1.4 ${FONT_ALFA}; }
    .ig-relacao > p { margin: 8px 0; }
    .ig-complemento { border-bottom: ${bordaFina(C.paper)}; padding: 16px 0 22px; }
    .ig-complemento h4 { font: 20px/1.4 ${FONT_ALFA}; margin: 10px 0; }
    .ig-metodo h3 { font: 21px/1.4 ${FONT_ALFA}; margin: 28px 0 15px; }
    .ig-metodo ul { padding-left: 23px; list-style: disc; }
    .ig-metodo li { font-size: 15px; line-height: 1.9; margin: 10px 0; }
    .ig-recado { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); background: ${C.gold}; color: ${C.ink}; padding: 14px 20px; border: ${borda()}; font: 14px ${FONT_BITTER}; max-width: calc(100vw - 32px); z-index: 200; }
    .ig-pagina-pessoa { padding-bottom: 64px; }
    .ig-pessoa-trilha { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; max-width: ${LARGURA.conteudo}px; margin: 0 auto; padding: 25px 20px; font: 11px/1.7 ${FONT_ELITE}; }
    .ig-pessoa-trilha a { text-decoration: underline; }
    .ig-artigo { max-width: ${LARGURA.conteudo}px; margin: 0 auto; padding: 12px 20px 40px; }
    .ig-artigo-apresentacao { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font: 10px/1.7 ${FONT_ELITE}; letter-spacing: 1px; border-bottom: ${bordaFina()}; padding: 10px 0 18px; margin-bottom: 27px; }
    .ig-artigo-layout { display: flex; flex-direction: column; gap: 30px; align-items: stretch; }
    .ig-artigo-texto { display: contents; min-width: 0; }
    .ig-artigo-lead { order: 0; }
    .ig-artigo-lead p, .ig-janela .ig-artigo-lead p { font: 18px/1.9 ${FONT_BITTER}; margin: 0; }
    .ig-artigo p { text-wrap: pretty; }
    .ig-artigo p a, .ig-artigo dd a { color: ${C.goldDim}; text-decoration: underline; }
    .ig-citacoes { white-space: normal; font: 11px/1 ${FONT_BITTER}; padding-left: 4px; }
    .ig-citacoes sup { margin-right: 3px; }
    .ig-citacoes a { display: inline; color: ${C.goldDim}; text-decoration: none !important; padding: 3px 1px; }
    .ig-citacoes a:hover { text-decoration: underline !important; }
    .ig-artigo-indice { order: 2; background: ${C.cream}; border: ${bordaFina()}; padding: 20px 24px; }
    .ig-artigo-indice > strong { font: 13px ${FONT_ELITE}; text-transform: uppercase; letter-spacing: 1px; }
    .ig-artigo-indice ol { list-style: decimal; padding-left: 20px; margin: 13px 0 0; }
    .ig-artigo-indice a { display: inline-block; font: 14px/1.7 ${FONT_BITTER}; padding: 8px 0; text-decoration: underline; }
    .ig-artigo-secao { order: 3; min-width: 0; padding-top: 8px; scroll-margin-top: 90px; }
    .ig-artigo-secao > h2, .ig-janela .ig-artigo-secao > h2 { font: 26px/1.4 ${FONT_ALFA}; margin: 0 0 22px; border-bottom: ${bordaFina()}; padding-bottom: 14px; }
    .ig-artigo-secao h3 { font: 18px/1.5 ${FONT_ALFA}; margin: 25px 0 13px; }
    .ig-artigo-secao p { font: 16px/1.95 ${FONT_BITTER}; margin: 13px 0 22px; }
    .ig-artigo-secao > div + div { margin-top: 28px; }
    .ig-artigo-ficha { order: 1; min-width: 0; }
    .ig-artigo-ficha-miolo { border: ${bordaFina()}; background: ${C.cream}; }
    .ig-artigo-ficha h2, .ig-janela .ig-artigo-ficha h2 { font: 19px/1.4 ${FONT_ALFA}; background: ${C.gold}; color: ${C.ink}; margin: 0; padding: 15px 18px; border-bottom: ${bordaFina()}; }
    .ig-artigo-ficha .ig-foto, .ig-janela .ig-artigo-ficha .ig-retrato { border: 0; margin: 0; max-width: none; }
    .ig-artigo-ficha .ig-foto img { aspect-ratio: 1/1; object-position: center 25%; }
    .ig-artigo-ficha dl { padding: 8px 18px 18px; margin: 0; }
    .ig-artigo-ficha dl > div { padding: 14px 0; border-bottom: ${bordaFina(C.paper)}; }
    .ig-artigo-ficha dt { font: 10px/1.7 ${FONT_ELITE}; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 7px; }
    .ig-artigo-ficha dd { font: 13px/1.8 ${FONT_BITTER}; margin: 0; }
    .ig-artigo .ig-artigo-contexto { font: 12px/1.85 ${FONT_BITTER}; opacity: .85; }
    .ig-artigo-ficha .ig-artigo-contexto { padding: 0 18px 18px; margin: 0; }
    .ig-artigo-relato + .ig-artigo-relato { margin-top: 32px; }
    .ig-artigo-evidencias { background: ${C.cream}; border-left: ${borda(C.goldDim)}; padding: 9px 15px; margin: 18px 0 24px; }
    .ig-artigo-evidencias > div { display: flex; flex-wrap: wrap; align-items: center; gap: 5px 16px; padding: 4px 0; }
    .ig-artigo-evidencias a { display: inline-flex; align-items: center; min-height: 44px; font: 11px/1.8 ${FONT_BITTER}; text-decoration: underline; }
    .ig-artigo-evidencias a:first-child { font-weight: 600; flex-basis: 100%; font-size: 12px; }
    .ig-artigo-registro { background: ${C.cream}; border: ${bordaFina()}; padding: 20px; margin: 20px 0; }
    .ig-artigo-registro .ig-kicker { font-size: 10px; margin: 0; }
    .ig-artigo-registro h3 { margin-top: 12px; }
    .ig-artigo-registro p:last-child { margin-bottom: 0; }
    .ig-artigo-relacoes { margin: 0; }
    .ig-artigo-relacoes > div { padding: 20px 0; border-bottom: ${bordaFina()}; }
    .ig-artigo-relacoes dt { font: 17px/1.5 ${FONT_ALFA}; margin-bottom: 10px; }
    .ig-artigo-relacoes dt a { text-decoration: underline; }
    .ig-artigo-relacoes dd { font: 15px/1.85 ${FONT_BITTER}; margin: 0; }
    .ig-artigo-origem { display: block; font-size: 12px; padding-top: 10px; }
    .ig-artigo-trecho { margin-bottom: 28px; }
    .ig-artigo-trecho .ig-kicker { font: 11px/1.8 ${FONT_ELITE}; }
    .ig-artigo-cronologia { border: ${bordaFina()}; background: ${C.cream}; }
    .ig-artigo-cronologia > summary { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 56px; padding: 16px 20px; cursor: pointer; list-style: none; font-size: 14px; }
    .ig-artigo-cronologia > ol { list-style: none; margin: 0; padding: 0 20px; }
    .ig-artigo-cronologia > ol > li { padding: 20px 0 28px; border-top: ${bordaFina(C.paper)}; }
    .ig-artigo-cronologia h3 { margin-top: 8px; }
    .ig-artigo-cronologia p { font-size: 14px; }
    .ig-artigo-cronologia .ig-kicker { font: 10px/1.8 ${FONT_ELITE}; }
    .ig-artigo-cronologia a { display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; color: ${C.goldDim}; text-decoration: underline; }
    .ig-artigo-fontes { list-style: decimal; padding-left: 23px; margin: 0; }
    .ig-artigo-fontes > li { padding-left: 8px; scroll-margin-top: 95px; }
    .ig-artigo-fontes .ig-fonte { padding: 11px 0; }
    .ig-artigo-fontes .ig-fonte strong { font-size: 13px; }
    .ig-artigo-resumido { padding: 0; }
    .ig-artigo-resumido .ig-artigo-ficha { max-width: 360px; }
    @media (min-width: ${PONTOS.computador}px) {
      .ig-artigo-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 42px; align-items: start; }
      .ig-artigo-texto { display: block; }
      .ig-artigo-ficha { position: sticky; top: 90px; }
      .ig-artigo-indice { margin: 30px 0 38px; }
      .ig-artigo-secao { margin-top: 44px; }
      .ig-artigo-resumido .ig-artigo-layout { display: flex; }
      .ig-artigo-resumido .ig-artigo-texto { display: contents; }
      .ig-artigo-resumido .ig-artigo-ficha { position: static; }
      .ig-artigo-lead p { font-size: 19px; }
    }
    @media (max-width: 420px) {
      .ig-artigo { padding-left: 15px; padding-right: 15px; }
      .ig-artigo-resumido { padding: 0; }
      .ig-artigo-secao > h2, .ig-janela .ig-artigo-secao > h2 { font-size: 22px; }
      .ig-artigo-lead p, .ig-janela .ig-artigo-lead p { font-size: 16px; }
      .ig-artigo-secao p { font-size: 15px; }
    }
    @media (min-width: ${PONTOS.tablet}px) {
      .ig-abertura { grid-template-columns: 1fr 1fr; gap: 35px; padding-top: 55px; padding-bottom: 50px; }
      .ig-abertura h2 { font-size: 36px; }
      .ig-estatisticas { grid-template-columns: repeat(4, 1fr); }
      .ig-grade-pessoas { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .ig-grade-videos, .ig-galeria { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ig-fecho { grid-template-columns: 1fr 1.2fr; gap: 55px; }
      .ig-janela-miolo { padding: 38px 42px 45px; }
      .ig-janela h2 { font-size: 37px; }
      .ig-filtros { display: grid; grid-template-columns: 1fr; }
      .ig-ano { grid-template-columns: 58px minmax(0, 1fr); gap: 20px; }
      .ig-ano > h3 { font-size: 23px; }
      .ig-ano > div { padding-left: 22px; }
      .ig-ano .ig-verbete::before { left: -29px; }
    }
    @media (min-width: ${PONTOS.computador}px) {
      .ig-layout { display: grid; grid-template-columns: 205px minmax(0, 1fr); gap: 32px; }
      .ig-filtros { position: sticky; top: 96px; padding: 15px; }
      .ig-filtros select { font-size: 13px; }
      .ig-camadas { grid-template-columns: 1fr; }
      .ig-camadas button { font-size: 12px; gap: 15px; }
      .ig-titulo-secao h2 { font-size: 34px; }
      .ig-acervo { padding-top: 65px; }
      .ig-verbete { padding: 22px; }
      .ig-abrir-verbete h3 { font-size: 23px; }
      .ig-grade-verbetes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ig-layout .ig-grade-verbetes { grid-template-columns: 1fr; }
      .ig-pessoa-texto { padding: 20px 17px; }
      .ig-pessoa-texto > strong { font-size: 19px; }
    }
    @media (max-width: 420px) {
      .ig-abertura, .ig-estatisticas, .ig-acervo, .ig-fecho { padding-left: 15px; padding-right: 15px; }
      .ig-abertura h2 { font-size: 28px; }
      .ig-estatisticas strong { font-size: 28px; }
      .ig-estatisticas span { font-size: 10px; }
      .ig-abas button { font-size: 11px; padding: 10px 9px; }
      .ig-ano { grid-template-columns: 36px minmax(0, 1fr); gap: 8px; }
      .ig-ano > h3 { font-size: 15px; }
      .ig-verbete { padding: 15px; }
      .ig-abrir-verbete h3 { font-size: 18px; }
      .ig-verbete > p { font-size: 13px; }
      .ig-linha-topo { align-items: start; }
      .ig-serie, .ig-selo { font-size: 9px; }
      .ig-grade-pessoas { gap: 10px; }
      .ig-pessoa-texto > strong { font-size: 16px; }
      .ig-pessoa-texto > small { font-size: 11px; }
      .ig-pessoa-texto { padding: 14px 10px; }
    }
    @media (prefers-reduced-motion: reduce) { .ig *, .ig-janela * { scroll-behavior: auto !important; transition: none !important; } }
  `}</style>;
}
