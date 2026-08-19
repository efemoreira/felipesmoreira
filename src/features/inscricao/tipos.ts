/** Espelha a forma de src/data/funcoes.json — a lista canônica das funções. */

export type GrupoFuncao = "comunicacao" | "eventos" | "outro";

export interface Funcao {
  id: string;
  nome: string;
  grupo: GrupoFuncao;
  icone: string;
  /** o que é, em uma frase, para quem está de fora */
  resumo: string;
  /** o que a pessoa produz na prática */
  entrega: string;
  /** quanto tempo a função pede */
  ritmo: string;
  /** passo a passo, mostrado no "ver detalhes" */
  detalhe: string[];
  /** áreas do painel sugeridas na aprovação */
  areas: string[];
}

export interface GrupoInfo {
  nome: string;
  resumo: string;
}

export interface CatalogoFuncoes {
  versao: string;
  grupos: Record<GrupoFuncao, GrupoInfo>;
  funcoes: Funcao[];
}

/** O que o formulário manda para /painel/api/inscricao.php */
export interface DadosInscricao {
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  bairro: string;
  funcoes: string[];
  consentimento: boolean;
  /** honeypot: precisa chegar vazio */
  site: string;
}

export type RespostaInscricao =
  | { ok: true }
  | { ok: false; erro: string; campo?: keyof DadosInscricao };
