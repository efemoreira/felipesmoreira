import type { IconName } from "@/components/icons";

/**
 * O plano de governo da chapa, tipado.
 *
 * A forma segue o próprio documento: ele **não é organizado por secretaria, e
 * sim por compromissos** — "porque os problemas do cearense não respeitam a
 * divisão de pastas do governo" (p. 5). Cada compromisso responde sempre às
 * mesmas seis perguntas, e é por isso que `Compromisso` tem os campos que tem.
 *
 * Toda entrada carrega a `pagina` de onde saiu. Isso não é capricho de nota de
 * rodapé: a carta de abertura pede "leiam este plano, guardem este plano e me
 * cobre este plano" (p. 2). Sem a página, a página do site vira propaganda;
 * com ela, vira documento conferível.
 */

/** Os dois movimentos do plano — a ordem está no nome: primeiro retomar. */
export type Movimento = "retomar" | "reconstruir" | "metodo";

export interface Proposta {
  titulo: string;
  /** O que é, em linguagem de quem lê de fora — não o jargão do documento. */
  texto: string;
  pagina: string;
}

export interface Meta {
  /** O número que se cobra. Curto: cabe no cartão e na memória. */
  numero: string;
  /** O que esse número mede. */
  oQue: string;
  pagina: string;
}

export interface Compromisso {
  numero: number;
  /** slug da âncora — /propostas#ceara-seguro */
  id: string;
  icone: IconName;
  movimento: Movimento;
  titulo: string;
  /** O que está em jogo: o diagnóstico que justifica o compromisso. */
  emJogo: string;
  propostas: Proposta[];
  metas: Meta[];
  /** De onde vem o recurso — o plano nomeia fundo e valor, não diz "buscaremos". */
  recurso: string[];
  /** Quando entrega: 100 dias · 1º ano · mandato. */
  prazos: { quando: string; entrega: string }[];
  paginas: string;
}
