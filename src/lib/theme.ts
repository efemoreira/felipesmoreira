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
  goldDim: "#B8860B",
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
