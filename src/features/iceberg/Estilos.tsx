import { C, FOCO, FONT_ALFA, FONT_TEXTO, LARGURA, PONTOS, RAIO, borda, sombra } from "@/lib/theme";

export default function Estilos() {
  return <style>{`
    .ig, .ig-janela { --ig-tinta: ${C.ink}; --ig-papel: ${C.paper}; --ig-creme: ${C.cream}; --ig-ouro: ${C.gold}; color: ${C.ink}; font-family: ${FONT_TEXTO}; color-scheme: light; }
    .ig { background: ${C.paper}; overflow: clip; }
    .ig *, .ig-janela * { box-sizing: border-box; }
    .ig button, .ig select, .ig input, .ig-janela button { font: inherit; }
    .ig button, .ig-janela button { cursor: pointer; }
    .ig button:disabled, .ig-janela button:disabled { cursor: default; }
    .ig a, .ig-janela a { text-underline-offset: 4px; }
    .ig button:focus-visible, .ig a:focus-visible, .ig input:focus-visible, .ig select:focus-visible, .ig summary:focus-visible, .ig-janela button:focus-visible, .ig-janela a:focus-visible, .ig-janela summary:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
    .ig-abertura, .ig-estatisticas, .ig-acervo, .ig-fecho { max-width: ${LARGURA.conteudo + 40}px; margin: 0 auto; padding-left: 20px; padding-right: 20px; }
    .ig-abertura { display: grid; gap: 32px; padding-top: 48px; padding-bottom: 36px; align-items: center; }
    .ig-kicker { font: 700 15px/1.4 ${FONT_TEXTO}; color: ${C.goldDim}; margin: 0 0 8px; }
    .ig-abertura h2 { font: 400 32px/1.14 ${FONT_ALFA}; color: ${C.ink}; margin: 0 0 22px; }
    .ig-abertura-texto > p:not(.ig-kicker):not(.ig-nota) { font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .ig-abertura .ig-nota { margin-top: 22px; }
    .ig-botao { min-height: 48px; display: inline-flex; justify-content: center; align-items: center; gap: 20px; text-align: center; background: ${C.gold}; border: 0; border-radius: ${RAIO.m}px; color: ${C.ink}; font-weight: 700; padding: 12px 20px; font: 700 16.5px/1.25 ${FONT_TEXTO}; text-decoration: none; }
    .ig-botao:hover { background: ${C.gold2}; }
    .ig-link { background: none; border: 0; color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; text-underline-offset: 4px; min-height: 44px; text-align: left; padding: 8px 0; font-size: 14.5px; }
    .ig-nota { font: 400 15px/1.65 ${FONT_TEXTO}; color: ${C.suave}; margin: 12px 0 20px; }
    .ig-foto { overflow: hidden; border-radius: ${RAIO.m}px; margin: 0; background: ${C.cream}; border: ${borda()}; min-width: 0; }
    .ig-foto > a { display: block; overflow: hidden; }
    .ig-foto img { width: 100%; height: auto; aspect-ratio: 3/2; object-fit: cover; display: block; }
    .ig-foto figcaption { padding: 13px 15px 15px; }
    .ig-foto figcaption p { font-size: 14.5px; line-height: 1.65; margin: 0 0 7px; }
    .ig-foto figcaption > span { font-size: 14.5px; line-height: 1.6; display: block; }
    .ig-foto figcaption a { color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; }
    .ig-estatisticas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; border-top: ${borda()}; border-bottom: ${borda()}; padding-top: 25px; padding-bottom: 25px; }
    .ig-estatisticas > div { display: flex; align-items: center; gap: 14px; }
    .ig-estatisticas strong { font: 400 34px/1 ${FONT_ALFA}; color: ${C.ink}; }
    .ig-estatisticas span { font: 600 14px/1.5 ${FONT_TEXTO}; max-width: 110px; }
    .ig-acervo { padding-top: 52px; padding-bottom: 50px; scroll-margin-top: 90px; }
    .ig-titulo-secao { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 26px; flex-wrap: wrap; }
    .ig-titulo-secao h2 { font: 400 clamp(28px, 3.8vw, 38px)/1.14 ${FONT_ALFA}; color: ${C.ink}; margin: 0; }
        .ig-abas { display: flex; gap: 4px; flex-wrap: wrap; border-bottom: ${borda()}; padding-bottom: 12px; margin-bottom: 24px; }
    .ig-abas button { min-height: 44px; padding: 8px 16px; border: 0; border-radius: 999px; background: transparent; color: ${C.ink}; font: 600 16px/1.3 ${FONT_TEXTO}; }
    .ig-abas button[aria-current=page] { background: ${C.gold}; color: ${C.ink}; font-weight: 700; }
    .ig-abas button:hover:not([aria-current]) { background: ${C.fundo}; }
    .ig-busca { margin-bottom: 30px; }
    .ig-busca > label { display: block; font: 600 14px/1.4 ${FONT_TEXTO}; margin-bottom: 10px; }
    .ig-busca > div { border-radius: ${RAIO.m}px; display: flex; align-items: center; border: ${borda()}; background: ${C.cream}; gap: 8px; padding: 0 10px; min-height: 56px; }
    .ig-busca > div > span { font-size: 29px; line-height: 1; }
    .ig-busca input { width: 100%; min-width: 0; min-height: 52px; font-size: 16px; background: transparent; color: ${C.ink}; border: 0; padding: 8px; }
    .ig-busca button { min-height: 44px; font-size: 14.5px; text-decoration: underline; padding: 8px; }
    .ig-filtros { border-radius: ${RAIO.g}px; align-self: start; margin-bottom: 25px; padding: 20px; border: ${borda()}; background: ${C.cream}; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 14px; }
    .ig-filtro-titulo { display: flex; align-items: center; justify-content: space-between; gap: 12px; font: 600 14px/1.4 ${FONT_TEXTO}; grid-column: 1/-1; margin-bottom: 5px; }
    .ig-filtro-titulo button { text-decoration: underline; min-height: 44px; padding: 8px 0; font-size: 14.5px; }
    .ig-filtros > label { font: 600 14px/1.5 ${FONT_TEXTO}; grid-column: 1/-1; }
    .ig-filtros select { grid-column: 1/-1; width: 100%; min-width: 0; min-height: 46px; padding: 8px; font-size: 16px; background: ${C.paper}; border: ${borda()}; border-radius: 0; color: ${C.ink}; margin-bottom: 10px; }
    .ig-filtros fieldset { grid-column: 1/-1; border: 0; padding: 0; margin: 8px 0 0; min-width: 0; }
    .ig-filtros legend { font: 600 14px/1.4 ${FONT_TEXTO}; margin-bottom: 10px; }
    .ig-camadas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
    .ig-camadas button { border-radius: ${RAIO.p}px; display: flex; align-items: center; gap: 7px; text-align: left; border: ${borda()}; min-height: 44px; padding: 7px; font-size: 14.5px; }
    .ig-camadas b { font: 600 14px/1.4 ${FONT_TEXTO}; }
    .ig-camadas button[aria-pressed=true] { background: ${C.gold}; }
    .ig-filtros .ig-nota { grid-column: 1/-1; font-size: 14.5px; margin: 5px 0 0; }
    .ig-resultados { min-width: 0; }
    .ig-barra-resultados { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .ig-barra-resultados > p, .ig-barra-resultados > label { font-size: 14.5px; margin: 0; }
    .ig-barra-resultados select { font-size: 16px; min-height: 44px; border: 0; background: ${C.paper}; color: ${C.ink}; max-width: 210px; }
    .ig-ano { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 12px; margin: 28px 0; }
    .ig-ano > h3 { font: 800 17px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 16px 0 0; }
    .ig-ano > div { display: grid; gap: 16px; padding-left: 15px; border-left: ${borda()}; }
    .ig-verbete { border-radius: ${RAIO.g}px; background: ${C.cream}; border: ${borda()}; padding: 18px; position: relative; min-width: 0; }
    .ig-ano .ig-verbete::before { content: ''; position: absolute; top: 20px; left: -22px; height: 10px; width: 10px; border-radius: 50%; background: ${C.gold}; }
    .ig-ano .ig-serie-mbl::before { background: ${C.ink}; }
    .ig-linha-topo { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; }
    .ig-serie { font: 600 14px/1.4 ${FONT_TEXTO}; }
    .ig-selo { border-radius: 999px; font: 600 14px/1.4 ${FONT_TEXTO}; border: ${borda()}; padding: 4px 7px; background: ${C.paper}; }
    .ig-selo.ig-teoria, .ig-selo.ig-alegacao { border-style: dashed; }
    .ig-abrir-verbete { display: flex; justify-content: space-between; align-items: start; text-align: left; width: 100%; gap: 18px; min-height: 44px; border: 0; background: none; padding: 0; color: ${C.ink}; }
    .ig-abrir-verbete h3 { font: 800 20px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 0 0 12px; overflow-wrap: anywhere; }
    .ig-abrir-verbete > span { font-size: 22px; }
    .ig-abrir-verbete:hover h3 { text-decoration: underline; text-underline-offset: 4px; }
    .ig-verbete > p { font-size: 14.5px; line-height: 1.6; margin: 0; }
    .ig-verbete-rodape { display: flex; flex-wrap: wrap; gap: 9px 16px; border-top: ${borda()}; margin-top: 17px; padding-top: 12px; font: 600 14px/1.5 ${FONT_TEXTO}; }
    .ig-foto-pequena { margin-top: 18px; }
    .ig-foto-pequena img { aspect-ratio: 16/7; }
    .ig-foto-pequena figcaption { padding: 10px 12px; }
    .ig-foto-pequena figcaption p { font-size: 14.5px; }
    .ig-grade-pessoas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
    .ig-pessoa { overflow: hidden; border-radius: ${RAIO.g}px; border: ${borda()}; background: ${C.cream}; min-width: 0; }
    .ig-pessoa-abrir { display: flex; width: 100%; flex-direction: column; align-items: start; text-align: left; background: transparent; border: 0; padding: 0; color: ${C.ink}; }
    .ig-pessoa-abrir > img { display: block; width: 100%; aspect-ratio: 1/1; height: auto; object-fit: cover; object-position: center 28%; }
        .ig-pessoa-texto { display: block; padding: 17px 13px; width: 100%; }
    .ig-pessoa-texto > strong { display: block; font: 800 17px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin-bottom: 10px; overflow-wrap: anywhere; }
    .ig-pessoa-texto > small { font-size: 14.5px; line-height: 1.6; display: block; }
    .ig-pessoa-series { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 13px; }
    .ig-pessoa-series > span { border-radius: 999px; background: ${C.fundo} !important; border: 0 !important; font: 600 14px/1.4 ${FONT_TEXTO}; padding: 4px; background: ${C.paper}; }
    .ig-mini-credito { font-size: 14.5px; line-height: 1.6; padding: 0 13px 15px; margin: 0; }
    .ig-mini-credito a { color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; }
    .ig-pessoa-extrato { display: block; font: 400 15px/1.65 ${FONT_TEXTO}; margin-top: 12px; }
    .ig-iniciais { display: grid; place-items: center; font: 400 38px/1.14 ${FONT_ALFA}; color: ${C.ink}; aspect-ratio: 1/1; width: 100%; background: ${C.fundo}; }
    .ig-grade-verbetes { display: grid; gap: 16px; }
    .ig-alternar { display: flex; gap: 5px; }
    .ig-alternar button { border-radius: ${RAIO.p}px; min-height: 44px; padding: 8px 12px; border: ${borda()}; font-size: 14.5px; }
    .ig-alternar button[aria-pressed=true] { background: ${C.gold}; }
    .ig-mais { border-radius: ${RAIO.m}px; width: 100%; padding: 12px 16px; min-height: 48px; border: ${borda()}; background: ${C.paper}; margin-top: 26px; font-size: 14.5px; }
    .ig-mais:hover { background: ${C.gold}; }
    .ig-mais small { display: inline-block; margin-left: 12px; font-size: 14.5px; }
    .ig-vazio { border-radius: ${RAIO.g}px; border: ${borda()}; border-style: dashed; padding: 35px 20px; text-align: center; }
    .ig-vazio h3 { font: 800 23px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; }
    .ig-vazio p { font-size: 14.5px; margin-top: 15px; }
    .ig-vazio button { text-decoration: underline; min-height: 44px; font-size: 14.5px; }
    .ig-dossie-intro { max-width: 760px; margin-bottom: 35px; }
    .ig-dossie-intro h2 { font: 400 30px/1.14 ${FONT_ALFA}; color: ${C.ink}; margin: 0 0 24px; }
    .ig-dossie-intro > p:last-child { font-size: 16px; line-height: 1.6; }
    .ig-subtitulo { font: 800 26px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 38px 0 18px; }
    .ig-aviso { border-radius: ${RAIO.m}px; border-left: 3px solid ${C.gold}; padding: 16px 20px; background: ${C.cream}; font-size: 14.5px; line-height: 1.6; margin: 20px 0 28px; }
    .ig-aviso p { margin: 10px 0 0; }
    .ig-conexao { border-radius: ${RAIO.g}px; border: ${borda()}; background: ${C.cream}; padding: 22px; margin-bottom: 18px; }
    .ig-conexao > div:first-child { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
    .ig-conexao h3 { font: 800 24px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 0; }
    .ig-ligacoes { display: flex; flex-wrap: wrap; gap: 7px; margin: 18px 0; }
    .ig-ligacoes span { border-radius: 999px; background: ${C.fundo} !important; border: 0 !important; background: ${C.paper}; border: ${borda()}; padding: 7px 10px; font: 600 14px/1.4 ${FONT_TEXTO}; }
    .ig-relacionados > button { display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%; background: transparent; text-align: left; min-height: 56px; border: 0; border-bottom: ${borda()}; padding: 14px 0; color: ${C.ink}; }
    .ig-relacionados small { display: block; font: 600 14px/1.5 ${FONT_TEXTO}; color: ${C.suave}; margin-bottom: 6px; }
    .ig-relacionados strong { font: 400 15px/1.6 ${FONT_TEXTO}; }
    .ig-relacionados button:hover strong { text-decoration: underline; }
    .ig-grade-videos { display: grid; gap: 22px; }
    .ig-video { border-radius: ${RAIO.g}px; min-width: 0; background: ${C.cream}; border: ${borda()}; padding: 22px; }
    .ig-video h3 { font: 800 25px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 0 0 15px; }
    .ig-video > p { font-size: 14.5px; line-height: 1.6; }
        .ig-player { aspect-ratio: 16/9; background: ${C.fundo}; border-radius: ${RAIO.m}px; position: relative; overflow: hidden; border: ${borda()}; }
    .ig-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    .ig-play { width: 100%; height: 100%; display: block; position: absolute; inset: 0; padding: 0; border: 0; background: ${C.fundo}; overflow: hidden; }
    .ig-play img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ig-play:hover .ig-play-simbolo { background: ${C.gold2}; }
    .ig-play-simbolo { display: grid; place-items: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${C.gold}; color: ${C.ink}; width: 64px; height: 64px; border-radius: 50%; box-shadow: ${sombra("cartao")}; }
    .ig-play-rotulo { position: absolute; bottom: 12px; left: 12px; background: ${C.paper}; color: ${C.ink}; border-radius: 999px; font: 600 14px/1.4 ${FONT_TEXTO}; padding: 6px 10px; }
    .ig-player-credito { font-size: 14.5px; line-height: 1.6; margin: 11px 0; }
    .ig-player-credito a { color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; }
    .ig-capitulos { border-top: ${borda()}; border-bottom: ${borda()}; margin: 15px 0; }
    .ig-capitulos summary { display: flex; justify-content: space-between; align-items: center; min-height: 48px; font-size: 14.5px; cursor: pointer; list-style: none; }
    .ig-capitulos > div { display: grid; padding-bottom: 15px; }
    .ig-capitulos button { min-height: 44px; border: 0; text-align: left; font-size: 14.5px; line-height: 1.6; background: transparent; padding: 8px 4px; }
    .ig-capitulos button:hover { background: ${C.paper}; }
    .ig-capitulos button span { font: 600 14px/1.4 ${FONT_TEXTO}; margin-right: 10px; }
    .ig-fonte { display: block; padding: 15px 0; border-bottom: ${borda()}; overflow-wrap: anywhere; text-decoration: none; }
    .ig-fonte strong { display: block; font: 400 15px/1.65 ${FONT_TEXTO}; }
    .ig-fonte:hover strong { text-decoration: underline; }
    .ig-fonte small { display: block; font: 600 14px/1.5 ${FONT_TEXTO}; margin-top: 6px; color: ${C.suave}; }
    .ig-lista-fontes > div { display: grid; grid-template-columns: 35px minmax(0, 1fr); gap: 12px; }
    .ig-lista-fontes > div > span { padding-top: 18px; font: 600 14px/1.4 ${FONT_TEXTO}; }
    .ig-galeria { display: grid; gap: 24px; align-items: start; }
    .ig-galeria .ig-retrato img { aspect-ratio: 4/3; object-position: center 25%; }
    .ig-fecho { border-top: ${borda()}; padding-top: 40px; padding-bottom: 48px; display: grid; gap: 20px; }
    .ig-fecho h2 { font: 400 32px/1.14 ${FONT_ALFA}; color: ${C.ink}; margin: 0; }
    .ig-fecho p:not(.ig-kicker) { font-size: 15px; line-height: 1.6; }
    .ig-janela { margin: auto; width: min(850px, calc(100vw - 28px)); max-height: 90vh; max-height: 90dvh; padding: 0; background: ${C.paper}; border: 0; box-shadow: ${sombra("alto")}; border-radius: ${RAIO.g}px; }
    .ig-janela::backdrop { background: rgba(24,18,3,.3); }
    .ig-janela-barra { display: flex; align-items: center; justify-content: space-between; position: sticky; z-index: 2; top: 0; background: ${C.paper}; color: ${C.suave}; border-bottom: ${borda()}; padding: 7px 18px; gap: 15px; }
    .ig-janela-barra > span { font: 600 14px/1.5 ${FONT_TEXTO}; }
    .ig-janela-barra button { border: 0; background: transparent; color: ${C.ink}; min-width: 44px; min-height: 44px; font-size: 22px; }
    .ig-janela-miolo { padding: 28px 22px 36px; }
    .ig-janela h2 { font: 400 29px/1.14 ${FONT_ALFA}; color: ${C.ink}; margin: 0 0 22px; overflow-wrap: anywhere; }
    .ig-janela p { font-size: 15px; line-height: 1.6; }
        .ig-etiquetas { display: flex; gap: 8px 13px; flex-wrap: wrap; font: 600 14px/1.5 ${FONT_TEXTO}; margin-bottom: 22px; }
    .ig-etiquetas > span { border-radius: 999px; background: ${C.fundo} !important; border: 0 !important; padding: 5px 8px; background: ${C.paper}; }
    .ig-janela .ig-resumo { font-size: 17px; line-height: 1.6; }
    .ig-desfecho { border-radius: ${RAIO.m}px; border: ${borda()}; border-left: 3px solid ${C.gold}; background: ${C.paper}; padding: 18px; margin: 24px 0; }
    .ig-desfecho h3 { font: 600 14px/1.4 ${FONT_TEXTO}; margin: 0 0 10px; }
    .ig-desfecho p { margin: 0; }
    .ig-detalhe-secao { margin: 30px 0; }
    .ig-detalhe-secao > h3 { font: 800 20px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 0 0 18px; }
    .ig-pessoas-links { display: flex; flex-wrap: wrap; gap: 8px; }
    .ig-pessoas-links button { border-radius: ${RAIO.p}px; border: ${borda()}; background: ${C.paper}; min-height: 44px; text-align: left; padding: 8px 12px; font-size: 14.5px; color: ${C.ink}; }
    .ig-janela .ig-retrato { max-width: 370px; margin: 20px 0 26px; }
    .ig-janela .ig-retrato img { aspect-ratio: 1/1; object-position: center 25%; }
    .ig-janela .ig-foto:not(.ig-retrato) { margin: 22px 0; }
    .ig-janela .ig-nota { font-size: 14.5px; }
    .ig-relacao { border-radius: ${RAIO.m}px; background: ${C.paper}; border: ${borda()}; padding: 18px; margin-bottom: 15px; }
    .ig-relacao > button { min-height: 44px; padding: 0; border: 0; text-align: left; color: ${C.ink}; font: 800 18px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; }
    .ig-relacao > p { margin: 8px 0; }
    .ig-complemento { border-bottom: ${borda()}; padding: 16px 0 22px; }
    .ig-complemento h4 { font: 800 20px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 10px 0; }
    .ig-metodo h3 { font: 800 21px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 28px 0 15px; }
    .ig-metodo ul { padding-left: 23px; list-style: disc; }
    .ig-metodo li { font-size: 15px; line-height: 1.6; margin: 10px 0; }
    .ig-recado { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); background: ${C.gold}; color: ${C.ink}; padding: 14px 20px; border: 0; border-radius: ${RAIO.m}px; box-shadow: ${sombra("cartao")}; font: 400 15px/1.55 ${FONT_TEXTO}; max-width: calc(100vw - 32px); z-index: 200; }
    .ig-pagina-pessoa { padding-bottom: 64px; }
    .ig-pessoa-trilha { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; max-width: ${LARGURA.conteudo + 40}px; margin: 0 auto; padding: 25px 20px; font: 600 14px/1.5 ${FONT_TEXTO}; }
    .ig-pessoa-trilha a { display: inline-flex; align-items: center; min-height: 44px; text-decoration: underline; }
    .ig-artigo { max-width: ${LARGURA.conteudo + 40}px; margin: 0 auto; padding: 12px 20px 40px; }
    .ig-artigo-apresentacao { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font: 600 14px/1.5 ${FONT_TEXTO}; border-bottom: ${borda()}; padding: 10px 0 18px; margin-bottom: 27px; }
    .ig-artigo-layout { display: flex; flex-direction: column; gap: 30px; align-items: stretch; }
    .ig-artigo-texto { display: contents; min-width: 0; }
    .ig-artigo-lead { order: 0; }
    .ig-artigo-lead p, .ig-janela .ig-artigo-lead p { font: 400 18px/1.65 ${FONT_TEXTO}; margin: 0; }
    .ig-artigo p { text-wrap: pretty; }
    .ig-artigo p a, .ig-artigo dd a { color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; }
    .ig-citacoes { white-space: normal; font: 400 15px/1 ${FONT_TEXTO}; padding-left: 4px; }
    .ig-citacoes sup { margin-right: 3px; }
    .ig-citacoes a { display: inline; color: ${C.goldDim}; text-decoration: none !important; padding: 3px 1px; }
    .ig-citacoes a:hover { text-decoration: underline !important; }
    .ig-artigo-indice { border-radius: ${RAIO.m}px; order: 2; background: ${C.cream}; border: ${borda()}; padding: 20px 24px; }
    .ig-artigo-indice > strong { font: 600 14px/1.4 ${FONT_TEXTO}; }
    .ig-artigo-indice ol { list-style: decimal; padding-left: 20px; margin: 13px 0 0; }
    .ig-artigo-indice a { display: inline-block; font: 400 15px/1.65 ${FONT_TEXTO}; padding: 8px 0; text-decoration: underline; }
    .ig-artigo-secao { order: 3; min-width: 0; padding-top: 8px; scroll-margin-top: 90px; }
    .ig-artigo-secao > h2, .ig-janela .ig-artigo-secao > h2 { font: 800 26px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 0 0 22px; border-bottom: ${borda()}; padding-bottom: 14px; }
    .ig-artigo-secao h3 { font: 800 18px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin: 25px 0 13px; }
    .ig-artigo-secao p { font: 400 16px/1.65 ${FONT_TEXTO}; margin: 13px 0 22px; }
    .ig-artigo-secao > div + div { margin-top: 28px; }
    .ig-artigo-ficha { order: 1; min-width: 0; }
    .ig-artigo-ficha-miolo { overflow: hidden; border-radius: ${RAIO.g}px; border: ${borda()}; background: ${C.cream}; }
    .ig-artigo-ficha h2, .ig-janela .ig-artigo-ficha h2 { border-radius: ${RAIO.g}px ${RAIO.g}px 0 0; font: 800 19px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; background: ${C.gold}; color: ${C.ink}; margin: 0; padding: 15px 18px; border-bottom: ${borda()}; }
    .ig-artigo-ficha .ig-foto, .ig-janela .ig-artigo-ficha .ig-retrato { border: 0; margin: 0; max-width: none; }
    .ig-artigo-ficha .ig-foto img { aspect-ratio: 1/1; object-position: center 25%; }
    .ig-artigo-ficha dl { padding: 8px 18px 18px; margin: 0; }
    .ig-artigo-ficha dl > div { padding: 14px 0; border-bottom: ${borda()}; }
    .ig-artigo-ficha dt { font: 600 14px/1.5 ${FONT_TEXTO}; margin-bottom: 7px; }
    .ig-artigo-ficha dd { font: 400 15px/1.65 ${FONT_TEXTO}; margin: 0; }
    .ig-artigo .ig-artigo-contexto { font: 400 15px/1.65 ${FONT_TEXTO}; color: ${C.suave}; }
    .ig-artigo-ficha .ig-artigo-contexto { padding: 0 18px 18px; margin: 0; }
    .ig-artigo-relato + .ig-artigo-relato { margin-top: 32px; }
    .ig-artigo-evidencias { border-radius: ${RAIO.m}px; background: ${C.cream}; border-left: 3px solid ${C.gold}; padding: 9px 15px; margin: 18px 0 24px; }
    .ig-artigo-evidencias > div { display: flex; flex-wrap: wrap; align-items: center; gap: 5px 16px; padding: 4px 0; }
    .ig-artigo-evidencias a { display: inline-flex; align-items: center; min-height: 44px; font: 400 15px/1.65 ${FONT_TEXTO}; text-decoration: underline; }
    .ig-artigo-evidencias a:first-child { font-weight: 600; flex-basis: 100%; font-size: 14.5px; }
    .ig-artigo-registro { border-radius: ${RAIO.m}px; background: ${C.cream}; border: ${borda()}; padding: 20px; margin: 20px 0; }
    .ig-artigo-registro .ig-kicker { margin: 0; }
    .ig-artigo-registro h3 { margin-top: 12px; }
    .ig-artigo-registro p:last-child { margin-bottom: 0; }
    .ig-artigo-relacoes { margin: 0; }
    .ig-artigo-relacoes > div { padding: 20px 0; border-bottom: ${borda()}; }
    .ig-artigo-relacoes dt { font: 800 17px/1.3 ${FONT_TEXTO}; letter-spacing: -.01em; margin-bottom: 10px; }
    .ig-artigo-relacoes dt a { text-decoration: underline; }
    .ig-artigo-relacoes dd { font: 400 15px/1.65 ${FONT_TEXTO}; margin: 0; }
    .ig-artigo-origem { display: inline-flex; align-items: center; min-height: 44px; font-size: 14.5px; padding-top: 10px; }
    .ig-artigo-trecho { margin-bottom: 28px; }
    .ig-artigo-trecho .ig-kicker { font: 600 14px/1.5 ${FONT_TEXTO}; }
    .ig-artigo-cronologia { border-radius: ${RAIO.m}px; border: ${borda()}; background: ${C.cream}; }
    .ig-artigo-cronologia > summary { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 56px; padding: 16px 20px; cursor: pointer; list-style: none; font-size: 14.5px; }
    .ig-artigo-cronologia > ol { list-style: none; margin: 0; padding: 0 20px; }
    .ig-artigo-cronologia > ol > li { padding: 20px 0 28px; border-top: ${borda()}; }
    .ig-artigo-cronologia h3 { margin-top: 8px; }
    .ig-artigo-cronologia p { font-size: 14.5px; }
    .ig-artigo-cronologia .ig-kicker { font: 600 14px/1.5 ${FONT_TEXTO}; }
    .ig-artigo-cronologia a { display: inline-flex; align-items: center; min-height: 44px; font-size: 14.5px; color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; }
    .ig-artigo-fontes { list-style: decimal; padding-left: 23px; margin: 0; }
    .ig-artigo-fontes > li { padding-left: 8px; scroll-margin-top: 95px; }
    .ig-artigo-fontes .ig-fonte { padding: 11px 0; }
    .ig-artigo-fontes .ig-fonte strong { font-size: 14.5px; }
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
      .ig-filtros select { font-size: 14.5px; }
      .ig-camadas { grid-template-columns: 1fr; }
      .ig-camadas button { font-size: 14.5px; gap: 15px; }
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
      .ig-estatisticas span { font-size: 14.5px; }
      .ig-abas button { font-size: 14.5px; padding: 10px 9px; }
      .ig-ano { grid-template-columns: 36px minmax(0, 1fr); gap: 8px; }
      .ig-ano > h3 { font-size: 15px; }
      .ig-verbete { padding: 15px; }
      .ig-abrir-verbete h3 { font-size: 18px; }
      .ig-verbete > p { font-size: 14.5px; }
      .ig-linha-topo { align-items: start; }
      .ig-serie, .ig-selo { border-radius: 999px; font-size: 14.5px; }
      .ig-grade-pessoas { gap: 10px; }
      .ig-pessoa-texto > strong { font-size: 16px; }
      .ig-pessoa-texto > small { font-size: 14.5px; }
      .ig-pessoa-texto { padding: 14px 10px; }
    }
    @media (prefers-reduced-motion: reduce) { .ig *, .ig-janela * { scroll-behavior: auto !important; transition: none !important; } }
  `}</style>;
}
