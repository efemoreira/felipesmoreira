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

  /* estados — mesmos tons do painel.css, para os dois lados combinarem
     (blocos de "Nunca" e de checklist na formação) */
  erro: "#F4A79D",
  erroBorda: "#C2543F",
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
