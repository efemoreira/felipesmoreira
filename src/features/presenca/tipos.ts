/** O que a mesa da Recepção manda para /painel/api/presenca.php */

export type Encontro =
  | { existe: false }
  | { existe: true; titulo: string; data: string; hora: string; local: string };

export interface DadosPresenca {
  /** o token que vem na URL (/presenca?e=…), não o id do evento */
  evento: string;
  nome: string;
  telefone: string;
  bairro: string;
  convidadoPor: string;
  consentimento: boolean;
  /** honeypot: precisa chegar vazio */
  site: string;
}

export type RespostaPresenca =
  | { ok: true; jaEstava?: boolean }
  | { ok: false; erro: string };
