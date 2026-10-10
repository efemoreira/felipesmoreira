/**
 * Design tokens do site — paleta do cordel e fontes auto-hospedadas.
 * Única fonte da verdade: antes desta consolidação, cada página redefinia
 * `C` e as variáveis de fonte à mão. Qualquer cor/fonte nova entra aqui.
 */

export const C = {
  ink: "#181203",
  cream: "#F6F5EF",
  paper: "#F3ECDA",
  gold: "#FFCB05",
  gold2: "#FFDE5A",
  /* Ouro queimado — o único ouro que vira TEXTO sobre papel ou creme (título
     das seções legais, o "pessoas" do plano). #B8860B dava 2,76:1 sobre o
     papel; este dá 4,85:1 no papel e 5,23:1 no creme — AA em qualquer
     tamanho, e continua sendo ouro. `testes/contrato/contraste.test.ts`
     mede. */
  goldDim: "#856006",
  night: "#14110C",

  /* a tinta da sombra dura — ver SOMBRA, abaixo */
  sombra: "rgba(24,18,3,.3)",
  /* a mesma sombra quando a peça está sobre fundo escuro (mesmo tom do
     `--sombra` do tema escuro do painel) */
  sombraNoite: "rgba(0,0,0,.45)",

  /* estados — mesmos tons do painel.css, para os dois lados combinarem
     (blocos de "Nunca" e de checklist na formação) */
  erro: "#F4A79D",
  erroBorda: "#C2543F",
  sombraErro: "rgba(140,47,34,.3)",
  /* erro SOBRE FUNDO CLARO (o formulário de inscrição, sobre papel): o par de
     cima é para texto sobre a noite — salmão claro em tinta escura. Sobre
     papel, salmão claro não se lê; aqui é fundo pálido e tinta vermelha,
     6,75:1. Eram três paletas de erro no site; são estas duas, por contexto. */
  erroFundo: "#FBE3E0",
  erroTinta: "#8C2F22",
  ok: "#A7DBA0",
  okBorda: "#4E9B45",
};

/**
 * A ESPESSURA DA MOLDURA DO CORDEL.
 *
 * O `3` é identidade, não estilo: canto reto, borda grossa e sombra dura são o
 * que faz o site e o painel parecerem o mesmo produto — e é por isso que o
 * painel guarda o dele num token do `:root` do `painel.css`. Aqui ele estava
 * escrito à mão em 58 lugares, em 17 arquivos, com nove cores diferentes ao
 * lado: engrossar a moldura era uma tarde de procurar e substituir, e bastava
 * escapar um para o cartão ficar mais fino que os vizinhos.
 *
 * O que varia é a COR, e é por isso que o token é uma função — a cor é decisão
 * de cada peça (tinta no normal, ouro no que está aceso, vermelho no erro), a
 * espessura não é decisão de ninguém.
 */
export const BORDA = 3;

/** A moldura do cordel na cor pedida. `borda()` sozinho dá a de tinta. */
export const borda = (cor: string = C.ink) => `${BORDA}px solid ${cor}`;

/**
 * A ESCALA DA SOMBRA DURA.
 *
 * A sombra sem borrão é o segundo traço da identidade, depois da moldura: é ela
 * que faz a peça parecer papel levantado do papel. Ela estava escrita à mão em
 * 17 combinações de deslocamento e opacidade (`3px/.22`, `3px/.28`, `3px/.3`,
 * `3px/.35`, `3px/.5`, `4px/.28`, `5px/.4`, `9px/.55`…) espalhadas por 30
 * arquivos, e isso não era repetição: era deriva. Um cartão com `3px/.35` ao
 * lado de um com `4px/.28` não conta ao olho dois níveis de altura — conta que
 * duas pessoas escreveram o mesmo cartão em dias diferentes.
 *
 * **A opacidade é uma só, e quem carrega a altura é o deslocamento.** Sombra
 * dura não tem borrão: ela é um decalque da peça, deslocado. Tinta é uma só —
 * na impressão de verdade um registro fora do lugar não fica mais claro porque
 * saiu mais longe, fica mais visível porque mostra mais tinta. Fazer a opacidade
 * variar junto brigava com isso: as peças pequenas estavam mais escuras (`.35`)
 * que as grandes (`.3`), então o que era para estar rente à página pesava mais
 * que o que era para estar levantado dela. É também o que o painel já faz —
 * `--sombra` é fixo lá, e só o deslocamento muda.
 *
 * **São três degraus, e não oito.** `3 · 5 · 8` — cada um vale ~1,6 do
 * anterior, que é o mínimo para o olho ler "outro nível" sem medir. Havia oito
 * deslocamentos em uso (3,4,5,6,7,8,9,10) e nenhum se distinguia do vizinho.
 * O primeiro degrau é 3 de propósito: é a espessura da moldura (`BORDA`), então
 * a peça rente à página lê como se a borda tivesse engrossado de um lado.
 *
 * O que varia é a COR, como em `borda()` — tinta no papel, preto no escuro,
 * ouro no campo aceso, vermelho no erro. A altura não é decisão de cor.
 */
export const SOMBRA = {
  /** Rente à página: etiqueta, pílula, campo, chip, cartãozinho de dentro. */
  rente: 3,
  /** O cartão de conteúdo, o botão, a peça que se lê como um objeto. */
  cartao: 5,
  /** O que chama: chamada principal, cartão clicável em destaque, modal. */
  alto: 8,
} as const;

export type Degrau = keyof typeof SOMBRA;

/** A sombra dura no degrau pedido. `sombra()` sozinho dá o cartão em tinta. */
export const sombra = (degrau: Degrau = "cartao", cor: string = C.sombra) =>
  `${SOMBRA[degrau]}px ${SOMBRA[degrau]}px 0 ${cor}`;

/**
 * O mesmo degrau com a peça erguida pelo ponteiro.
 * Anda junto com `transform: translate(-2px,-2px)`: a peça sobe 2 e a sombra
 * cresce 2, então a quina de baixo da sombra fica parada e o que se vê é a peça
 * descolando do papel — e não o par inteiro escorregando.
 */
export const sombraErguida = (degrau: Degrau = "cartao", cor: string = C.sombra) =>
  `${SOMBRA[degrau] + 2}px ${SOMBRA[degrau] + 2}px 0 ${cor}`;

/**
 * O mesmo degrau com a peça afundada pelo clique.
 * Anda junto com `transform: translate(2px,2px)` — o inverso exato do de cima.
 */
export const sombraAfundada = (degrau: Degrau = "cartao", cor: string = C.sombra) =>
  `${SOMBRA[degrau] - 2}px ${SOMBRA[degrau] - 2}px 0 ${cor}`;

/**
 * A escala de texto corrido.
 *
 * `fontSize: 15.5` com `lineHeight: 1.55` aparecia em oito arquivos, e o 1.6 em
 * onze — os dois querendo dizer "texto de leitura", com dois valores. Espalhe
 * com `...TEXTO.corpo`, e acrescente margem por cima quando a peça pedir.
 */
export const TEXTO = {
  /** Texto de leitura: parágrafo, item de lista, descrição de ficha. */
  corpo: { fontSize: 15.5, lineHeight: 1.55 },
  /** O mesmo corpo com respiro maior, para bloco longo de leitura. */
  corpoSolto: { fontSize: 15.5, lineHeight: 1.6 },
  /** Nota de rodapé, legenda, dica ao lado de um campo. */
  nota: { fontSize: 14.5, lineHeight: 1.55 },
} as const;

/* Variáveis definidas em src/app/layout.tsx via next/font */
export const FONT_ALFA = "var(--font-alfa), serif";
export const FONT_ELITE = "var(--font-elite), monospace";
export const FONT_BITTER = "var(--font-bitter), serif";

/**
 * A BORDA FINA — 2 px, a linha de dentro, de divisão, de campo. `BORDA` (3 px)
 * é a moldura da peça; esta é o traço. Escrita à mão em 52 lugares até
 * 12/09; agora é token, e `testes/contrato/tema.test.ts` barra o retorno.
 */
export const BORDA_FINA = 2;
export function bordaFina(cor: string = C.ink): string {
  return `${BORDA_FINA}px solid ${cor}`;
}

/**
 * A HACHURA DO CORDEL — a textura de xilogravura por trás do papel. Era
 * copiada, idêntica, em sete features; é a peça mais identitária do site e
 * mora aqui.
 */
export const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

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
 * O cordel (papel, Alfa Slab, moldura de 3 px, sombra dura) é a voz do site;
 * numa tela de mapa, tabela e percentual ele briga com o dado. Aqui a moldura
 * vira filete de 1 px, a sombra some, o número sai numa fonte sem serifa com
 * algarismos alinhados e quem separa os blocos é o espaço. O ouro do Missão
 * (`DADO.missao`) continua sendo o único destaque. `contraste.test.ts` mede os
 * pares de texto.
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
export const RAIO_DADOS = 8;
/** O filete da superfície de dados. */
export const fileteDados = (cor: string = PAINEL_DADOS.linha) => `1px solid ${cor}`;

/**
 * A RÉGUA DE ESPAÇO E DE LARGURA do site público — a Fase 0 do plano de
 * 2026–2027 (navegação, abertura e rodapé comuns). Seção, cartão e grade usam
 * estes degraus em vez de número solto, para as páginas respirarem igual.
 */
export const ESPACO = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, sec: 48, gde: 64 } as const;

/** Largura do conteúdo e da coluna de leitura. */
export const LARGURA = { conteudo: 1080, texto: "68ch" } as const;

/** Os dois pontos de quebra: tablet e computador. Usados nos <style> das peças. */
export const PONTOS = { tablet: 640, computador: 900 } as const;
