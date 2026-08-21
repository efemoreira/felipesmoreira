/**
 * A formação da militância — Pista Rápida e Pista Lenta.
 *
 * O conteúdo NÃO mora aqui: ele vem do painel PHP (public/painel/api/aulas.php)
 * porque o site é export estático e tudo que entra no bundle é público. Estes
 * tipos descrevem só o formato do que chega.
 */

export type Pista = "rapida" | "lenta";

/** O provedor fica abstraído: trocar de serviço mexe aqui e no player, só. */
export type FonteVideo = {
  provedor: "youtube";
  id: string;
};

/* ---- blocos de conteúdo ---- */

export type Bloco =
  | { tipo: "texto"; texto: string }
  | { tipo: "passos"; itens: string[] }
  | { tipo: "lista"; titulo?: string; itens: string[] }
  | { tipo: "checklist"; titulo: string; itens: string[] }
  | { tipo: "nunca"; itens: string[] }
  | { tipo: "modelo"; titulo: string; linhas: string[] }
  | { tipo: "aviso"; texto: string }
  | { tipo: "tabela"; colunas: string[]; linhas: string[][] };

export interface Aula {
  id: string;
  pista: Pista;
  titulo: string;
  resumo: string;
  minutos: number;
  /** ids de src/data/funcoes.json — marca "esta é a sua função". */
  funcoes: string[];
  /** onde se faz na prática o que a aula ensina, ex: /painel/fatos */
  ferramenta: string | null;
  blocos: Bloco[];
  /** null enquanto a coordenação não publicou o vídeo — a aula vale pelo texto */
  video: FonteVideo | null;
}

export interface Dia {
  id: string;
  numero: number;
  titulo: string;
  resumo: string;
  aulas: Aula[];
}

/** A resposta do painel, nos quatro estados possíveis. */
export type RespostaAulas =
  | { autenticado: false; convidado?: false }
  /**
   * Convidado: chegou por link com token e enxerga só o Dia 0. Não tem conta,
   * então não há progresso para gravar — a tela some com as marcas de concluído.
   */
  | {
      autenticado: false;
      convidado: true;
      pode: true;
      nome: string;
      funcoes: string[];
      dias: Dia[];
      concluidas: string[];
    }
  | { autenticado: true; pode: false }
  | {
      autenticado: true;
      pode: true;
      nome: string;
      funcoes: string[];
      dias: Dia[];
      concluidas: string[];
    };
