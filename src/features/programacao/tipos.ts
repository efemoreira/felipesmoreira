/* Tipos e temas compartilhados entre a página e o gerador de PNG */
import { C, BORDA, sombra, sombraErguida, sombraAfundada } from "@/lib/theme";

export { C, BORDA, sombra, sombraErguida, sombraAfundada };

export type CorCartao = "ouro" | "milho" | "azul" | "escuro" | "papel";

export interface ItemAgenda {
  id: string;
  titulo: string;
  subtitulo?: string;
  /**
   * Quando começa, com o fuso junto: "2026-10-04T19:00:00-03:00".
   *
   * É o que permite ordenar, saber o que já passou e mostrar "ao vivo" só na
   * hora certa. Vazio em item gravado antes deste campo existir — esse continua
   * aparecendo, só fica fora da ordem e nunca é marcado ao vivo.
   *
   * `dia`, `data` e `hora` são **derivados** dele no painel; estão no arquivo
   * porque o cartão e o pôster leem, mas não são digitados separadamente.
   */
  inicio?: string;
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
  /**
   * O token de "vou" do encontro, quando ele aceita confirmação de presença.
   *
   * Só vem em encontro presencial que ainda vai acontecer — numa live o botão
   * útil é o link da transmissão, que já está no cartão, e num encontro que
   * passou confirmar presença não quer dizer nada. O painel decide isso ao
   * gerar o `agenda.json` (`item_publico()` em eventos-comum.php); aqui só se
   * desenha o botão quando o campo veio.
   *
   * É um token diferente do que está no QR da mesa: este circula em grupo de
   * WhatsApp, e com um token só qualquer pessoa se marcaria como presente sem
   * sair de casa.
   */
  confirmar?: string;
}

export interface Canal {
  nome: string;
  icone: string;
  url: string;
}

export interface Agenda {
  titulo: string;
  periodo?: string;
  /**
   * O domingo da semana em que o `periodo` foi escrito à mão, em ISO.
   *
   * É o prazo de validade do texto: sem ele — ou com ele apontando para uma
   * semana que já virou — quem responde é o relógio. Ver `periodoVigente()`.
   */
  periodoSemana?: string;
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
