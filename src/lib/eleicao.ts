/**
 * O calendário da eleição — fonte única das datas.
 *
 * Duas telas dependem disto e não podem discordar: a contagem regressiva do
 * site público e as travas do `/kit`, que é onde o militante clica para
 * publicar. Data repetida em dois arquivos é data que diverge na terceira
 * alteração.
 *
 * **Tudo é calculado no navegador, não no build.** O site é export estático:
 * se a fase fosse decidida na hora de compilar, o dia 4 de outubro chegaria e a
 * página continuaria dizendo o que dizia em agosto, até alguém publicar de novo.
 */

/** Primeiro turno. Muda a cada eleição — é o único lugar onde se acerta. */
export const DIA_DA_VOTACAO = "2026-10-04";

/**
 * Fim da circulação paga ou impulsionada: 48h antes do pleito.
 * Compartilhar de graça no próprio perfil continua valendo.
 */
export const FIM_DO_IMPULSIONAMENTO = "2026-10-01";

export type Fase =
  /** campanha aberta: pode tudo, inclusive impulsionar pagando */
  | "campanha"
  /** últimas 48h: acabou o pago, o orgânico segue */
  | "reta-final"
  /** dia da votação: nada de conteúdo novo de propaganda na internet */
  | "votacao"
  /** acabou */
  | "depois";

/** Meia-noite local da data ISO — `new Date("2026-10-04")` seria UTC. */
function meiaNoite(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function faseEm(agora: Date = new Date()): Fase {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const votacao = meiaNoite(DIA_DA_VOTACAO);
  const fimPago = meiaNoite(FIM_DO_IMPULSIONAMENTO);

  if (hoje > votacao) return "depois";
  if (hoje.getTime() === votacao.getTime()) return "votacao";
  if (hoje >= fimPago) return "reta-final";
  return "campanha";
}

/** Dias inteiros até a votação. Zero no próprio dia, negativo depois. */
export function diasAteVotacao(agora: Date = new Date()): number {
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const votacao = meiaNoite(DIA_DA_VOTACAO);
  return Math.round((votacao.getTime() - hoje.getTime()) / 86_400_000);
}

/** "4 de outubro" — para escrever no meio de uma frase. */
export function dataPorExtenso(iso: string = DIA_DA_VOTACAO): string {
  const d = meiaNoite(iso);
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${d.getDate()} de ${meses[d.getMonth()]}`;
}
