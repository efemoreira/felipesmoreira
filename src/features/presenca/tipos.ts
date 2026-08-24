/** O que a página de presença troca com /painel/api/presenca.php */

/**
 * Como a pessoa chegou aqui.
 *
 * `chegada` é o QR impresso na mesa da Recepção: quem lê está na porta, então
 * marca compareceu. `confirmacao` é o link que circula no grupo e sai na
 * /programacao: marca só que a pessoa pretende ir.
 *
 * São dois tokens diferentes no encontro, e não um. Com um só, qualquer pessoa
 * que recebesse o link no grupo poderia se marcar presente sem sair de casa.
 */
export type Modo = "chegada" | "confirmacao";

export type Encontro =
  | { existe: false }
  | {
      existe: true;
      modo: Modo;
      titulo: string;
      subtitulo: string;
      data: string;
      hora: string;
      local: string;
      imagem: string;
      /** A chave do véu sobre a imagem, escolhida no painel (ver `filtro.ts`). */
      filtro: string;
    };

/** O que identifica o encontro: um token OU o outro, nunca os dois. */
export interface Alvo {
  evento?: string;
  confirmacao?: string;
}

/** Passo 1: quem é o dono deste número? */
export type RespostaProcura =
  | { ok: true; achou: 0 }
  /** Achou um só e já marcou: `nome` é o primeiro nome, para a pessoa se reconhecer. */
  | { ok: true; jaEstava?: boolean; nome: string; inscrito: boolean }
  /** Dois ou mais no mesmo número (casa, casal): a pessoa escolhe. */
  | { ok: true; achou: number; pessoas: { ref: string; nome: string }[] }
  | { ok: false; erro: string };

export interface DadosPresenca {
  nome: string;
  telefone: string;
  bairro: string;
  cidade: string;
  convidadoPor: string;
  consentimento: boolean;
  /** honeypot: precisa chegar vazio */
  site: string;
}

export type RespostaPresenca =
  | { ok: true; jaEstava?: boolean; nome?: string; inscrito?: boolean }
  | { ok: false; erro: string };
