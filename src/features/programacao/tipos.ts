/* Tipos e temas compartilhados entre a página e o gerador de PNG */
import { C } from "@/lib/theme";

export { C };

export type CorCartao = "ouro" | "milho" | "azul" | "escuro" | "papel";

export interface ItemAgenda {
  id: string;
  titulo: string;
  subtitulo?: string;
  dia: string;
  data: string;
  hora: string;
  aoVivo?: boolean;
  etiqueta?: string;
  cor?: CorCartao;
  plataforma?: string;
  imagem?: string;
  link?: string;
  interno?: boolean;
}

export interface Canal {
  nome: string;
  icone: string;
  url: string;
}

export interface Agenda {
  titulo: string;
  periodo?: string;
  chamada?: string;
  disponivelEm?: Canal[];
  programacao: ItemAgenda[];
}

export interface Tema {
  /** fundo no HTML (aceita gradiente CSS) */
  bg: string;
  /** paradas de cor do mesmo fundo no canvas (1 = sólido, 2 = gradiente) */
  canvas: string[];
  fg: string;
  sub: string;
  badge: string;
  badgeFg: string;
  /** texto claro sobre fundo escuro — ajusta divisórias */
  claro?: boolean;
}

export const TEMAS: Record<CorCartao, Tema> = {
  ouro: {
    bg: C.gold,
    canvas: [C.gold],
    fg: C.ink,
    sub: "rgba(24,18,3,.72)",
    badge: C.ink,
    badgeFg: C.gold,
  },
  milho: {
    bg: "#F7E463",
    canvas: ["#F7E463"],
    fg: C.ink,
    sub: "rgba(24,18,3,.72)",
    badge: C.ink,
    badgeFg: "#F7E463",
  },
  papel: {
    bg: C.paper,
    canvas: [C.paper],
    fg: C.ink,
    sub: "rgba(24,18,3,.7)",
    badge: C.ink,
    badgeFg: C.gold,
  },
  azul: {
    bg: "linear-gradient(105deg, #1B4FD8 0%, #2E7BE8 100%)",
    canvas: ["#1B4FD8", "#2E7BE8"],
    fg: C.cream,
    sub: "rgba(246,245,239,.82)",
    badge: C.ink,
    badgeFg: C.cream,
    claro: true,
  },
  escuro: {
    bg: "#1C1710",
    canvas: ["#1C1710"],
    fg: C.cream,
    sub: "rgba(246,245,239,.72)",
    badge: C.gold,
    badgeFg: C.ink,
    claro: true,
  },
};

export const temaDe = (cor?: CorCartao): Tema => TEMAS[cor ?? "ouro"] ?? TEMAS.ouro;

export const sigla = (dia: string) => dia.trim().slice(0, 3).toUpperCase();
