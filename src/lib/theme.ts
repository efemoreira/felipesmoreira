/**
 * Design tokens do site — a fonte única de cor, fonte, medida e sombra.
 * Qualquer cor, fonte ou medida nova entra aqui, e não na página.
 *
 * A IDENTIDADE É CLARA (11/2026). O site saiu da noite do cordel: fundo preto,
 * papel bege com hachura, moldura de 3 px e sombra dura juntos faziam tudo
 * parecer escuro e sujo, e como tudo gritava, nada se destacava. O que fica da
 * marca é o que ela tem de mais forte, em dose certa:
 *
 *  - **branco e tinta** carregam a leitura;
 *  - **o ouro é cor de sol**: um destaque por vista, nunca texto sobre branco
 *    (dá 1,5:1) e nunca sujo por transparência;
 *  - **as onças e a Alfa Slab** ficam para o que é grande;
 *  - **quem separa os blocos é o espaço**, e a linha fina só ajuda.
 *
 * Os tons de linha e de texto secundário são os da superfície de dados
 * (`PAINEL_DADOS`, /resultados), de propósito: o site e o estudo agora são o
 * mesmo produto.
 */

export const C = {
  /* a tinta: todo texto principal */
  ink: "#181203",
  /* a tinta acesa pelo ponteiro, no botão escuro */
  tintaAcesa: "#3A3226",
  /* texto secundário. Substitui `opacity` em texto: tinta transparente é o que
     deixa a página com cara de suja; cinza de verdade continua nítido. 6,5:1
     sobre o branco, medido em `contraste.test.ts`. */
  suave: "#5F5E59",

  /* as superfícies: a página é branca, e `fundo` é o único segundo tom */
  paper: "#FFFFFF",
  cream: "#FFFFFF",
  fundo: "#F6F6F3",

  /* as linhas: `linha` separa, `linhaForte` contorna controle (≥ 3:1) */
  linha: "#E2E1DC",
  linhaForte: "#8E8C85",

  /* o ouro da marca e seus dois apoios */
  gold: "#FFCB05",
  gold2: "#FFDE5A",
  /* fundo de etiqueta e de realce: o ouro bem diluído em branco */
  ouroClaro: "#FFF6D1",
  /* o único ouro que vira TEXTO sobre fundo claro: 5,7:1 no branco */
  goldDim: "#856006",

  /* a sombra é luz macia, não decalque — ver SOMBRA */
  sombra: "rgba(24,18,3,.1)",

  /* o vermelho do "ao vivo", e só dele */
  aoVivo: "#B3261E",

  /* estados */
  erro: "#8C2F22",
  erroBorda: "#C2543F",
  erroFundo: "#FBE3E0",
  erroTinta: "#8C2F22",
  sombraErro: "rgba(140,47,34,.16)",
  ok: "#1F6B2B",
  okBorda: "#4E9B45",
  okFundo: "#E4F4E1",
};

/**
 * A LINHA. Um pixel, na cor `linha`: o que separa sem pesar. Antes a moldura
 * era de 3 px, em 90 lugares, ao redor de tudo; e quando tudo tem moldura,
 * nada se destaca. A cor continua sendo decisão da peça.
 */
export const BORDA = 1;

/** A linha do site na cor pedida. `borda()` sozinho dá a linha clara. */
export const borda = (cor: string = C.linha) => `${BORDA}px solid ${cor}`;

/** Dois pixels: só para o que precisa marcar, como o contorno de um campo em foco. */
export const BORDA_FINA = 2;
export function bordaFina(cor: string = C.linha): string {
  return `${BORDA_FINA}px solid ${cor}`;
}

/**
 * OS CANTOS. Um degrau por tamanho de peça, para o cartão e o botão de dentro
 * dele conversarem. `RAIO_DADOS` (/resultados) é o `p`.
 */
export const RAIO = {
  /** campo, botão pequeno, etiqueta quadrada */
  p: 8,
  /** botão, selo de ícone */
  m: 12,
  /** cartão */
  g: 16,
  /** bloco de destaque */
  xg: 24,
  /** etiqueta redonda */
  pilula: 999,
} as const;

/**
 * A ESCALA DA SOMBRA — luz, e não decalque.
 *
 * Em repouso o cartão não tem sombra: quem o desenha é a linha. A sombra é o
 * que responde ao ponteiro e o que levanta o que flutua de verdade (gaveta,
 * modal). Três degraus, uma tinta só (`C.sombra`), e quem carrega a altura é o
 * deslocamento com o desfoque.
 */
export const SOMBRA = {
  /** Rente à página: campo, chip, botão em repouso. */
  rente: { y: 1, desfoque: 3 },
  /** O cartão erguido pelo ponteiro. */
  cartao: { y: 8, desfoque: 24 },
  /** O que flutua: modal, gaveta, menu aberto. */
  alto: { y: 20, desfoque: 48 },
} as const;

export type Degrau = keyof typeof SOMBRA;

/** A sombra no degrau pedido. `sombra()` sozinho dá a do cartão. */
export const sombra = (degrau: Degrau = "cartao", cor: string = C.sombra) =>
  `0 ${SOMBRA[degrau].y}px ${SOMBRA[degrau].desfoque}px ${cor}`;

/** O degrau com a peça erguida: anda com `transform: translateY(-2px)`. */
export const sombraErguida = (degrau: Degrau = "cartao", cor: string = C.sombra) =>
  `0 ${SOMBRA[degrau].y + 4}px ${SOMBRA[degrau].desfoque + 8}px ${cor}`;

/** O degrau com a peça apertada: anda com `transform: translateY(0)`. */
export const sombraAfundada = (degrau: Degrau = "cartao", cor: string = C.sombra) =>
  `0 ${Math.max(SOMBRA[degrau].y - 2, 0)}px ${Math.max(SOMBRA[degrau].desfoque - 8, 2)}px ${cor}`;

/** O anel de foco do teclado. Em tinta: o ouro some sobre o branco. */
export const FOCO = `3px solid ${C.ink}`;

/**
 * AS DUAS VOZES. Eram três famílias competindo em toda linha: a Alfa Slab
 * ultrapesada até em título de 15 px, a máquina de escrever em rótulo de 11 px
 * e a Bitter no corpo. Agora a Alfa Slab fala em título grande (28 px ou mais,
 * nunca menos: abaixo disso ela vira um borrão) e a Figtree fala todo o resto.
 *
 * Special Elite e Bitter continuam carregadas só para o Estúdio, que as oferece
 * como opção de texto e não lê estes tokens.
 */
export const FONT_ALFA = "var(--font-alfa), Georgia, serif";
export const FONT_TEXTO = "var(--font-texto), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

/** A escala dos títulos. Só a Alfa Slab usa `exibicao`, `pagina` e `secao`. */
export const TITULO = {
  /** O título da home. */
  exibicao: "clamp(44px, 7.6vw, 84px)",
  /** O título de toda página interna. */
  pagina: "clamp(36px, 5.6vw, 58px)",
  /** O título de seção. */
  secao: "clamp(28px, 3.8vw, 38px)",
  /** Título de cartão grande, ainda na Alfa Slab. */
  bloco: "clamp(24px, 2.8vw, 28px)",
} as const;

/**
 * A escala de texto corrido. Espalhe com `...TEXTO.corpo`, e acrescente margem
 * por cima quando a peça pedir.
 */
export const TEXTO = {
  /** Texto de leitura: parágrafo, item de lista, descrição de ficha. */
  corpo: { fontSize: 17, lineHeight: 1.6 },
  /** O mesmo corpo com respiro maior, para bloco longo de leitura. */
  corpoSolto: { fontSize: 17, lineHeight: 1.7 },
  /** Nota de rodapé, legenda, dica ao lado de um campo. */
  nota: { fontSize: 15, lineHeight: 1.5 },
} as const;

/**
 * AS CORES DE DADO — os gráficos de /resultados.
 *
 * Gráfico pede cor por *papel* (quem é quem), e a paleta do cordel não tem
 * quatro tons distinguíveis entre si. Estas foram validadas sobre o papel
 * (`C.paper`): faixa de luminosidade, separação para daltonismo e distância
 * para visão normal. O Missão é o ouro queimado (`goldDim`) e não o ouro: o
 * ouro puro dá 1,29:1 sobre o papel e some no gráfico.
 *
 * Duas famílias, que não se misturam no mesmo gráfico:
 *  - grupos políticos: missao · direita · centro · esquerda (· outros);
 *  - composição do voto do Missão: nominal · legenda · renan.
 * O amarelo do centro tem pouco contraste com o papel: todo gráfico que o usa
 * leva rótulo escrito ou tabela ao lado.
 */
export const DADO = {
  missao: C.goldDim,
  direita: "#2A78D6",
  centro: "#EDA100",
  esquerda: "#E34948",
  outros: "#9A9893",
  nominal: C.goldDim,
  legenda: "#EB6834",
  renan: "#4A3AA7",
  /* sequencial (mapas): um tom só, do claro ao escuro */
  rampa: ["#CDE2FB", "#9EC5F4", "#6DA7EC", "#3987E5", "#256ABF", "#184F95", "#0D366B"],
  /* divergente (pende para): esquerda (vermelho) ← neutro → direita (azul), os mesmos
     tons dos grupos nas pontas; o meio é cinza quente, que se separa do papel pela borda */
  lado: ["#A8322F", "#E34948", "#F3A8A4", "#DDD6C6", "#9EC5F4", "#2A78D6", "#184F95"],
} as const;

/**
 * A SUPERFÍCIE DE DADOS — /resultados.
 *
 * O filete de 1 px, sem sombra, com número em fonte sem serifa e algarismos
 * alinhados, e o espaço separando os blocos. Foi a tela que deu certo primeiro:
 * o resto do site adotou estes mesmos tons de linha e de texto. O ouro do
 * Missão (`DADO.missao`) continua sendo o único destaque. `contraste.test.ts`
 * mede os pares de texto.
 */
export const PAINEL_DADOS = {
  fundo: "#F6F6F3",
  superficie: "#FFFFFF",
  /* filete entre blocos e linhas de tabela */
  linha: "#E2E1DC",
  /* contorno de controle (campo, chip): ≥ 3:1 sobre a superfície */
  linhaForte: "#8E8C85",
  tinta: "#1B1B19",
  tintaSuave: "#5F5E59",
  /* fundo do que é do Missão (cartão, linha da tabela) */
  realce: "#FBF3DC",
  missao: DADO.missao,
} as const;

/** Fonte do sistema — nada a baixar — com algarismos tabulares no CSS de quem usa. */
export const FONT_DADOS = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const RAIO_DADOS = RAIO.p;
/** O filete da superfície de dados. */
export const fileteDados = (cor: string = PAINEL_DADOS.linha) => `1px solid ${cor}`;

/**
 * A RÉGUA DE ESPAÇO E DE LARGURA do site público — a Fase 0 do plano de
 * 2026–2027 (navegação, abertura e rodapé comuns). Seção, cartão e grade usam
 * estes degraus em vez de número solto, para as páginas respirarem igual.
 */
export const ESPACO = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, sec: 48, gde: 64 } as const;

/** Largura do conteúdo e da coluna de leitura. */
export const LARGURA = { conteudo: 1120, texto: "66ch" } as const;

/** Os dois pontos de quebra: tablet e computador. Usados nos <style> das peças. */
export const PONTOS = { tablet: 640, computador: 900 } as const;
