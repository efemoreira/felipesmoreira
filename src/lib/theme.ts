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

/* Variáveis definidas em src/app/layout.tsx via next/font */
export const FONT_ALFA = "var(--font-alfa), serif";
export const FONT_ELITE = "var(--font-elite), monospace";
export const FONT_BITTER = "var(--font-bitter), serif";
