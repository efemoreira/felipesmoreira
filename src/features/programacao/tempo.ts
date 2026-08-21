import type { ItemAgenda } from "./tipos";

/**
 * O que a agenda sabe sobre o relógio.
 *
 * Antes ela não sabia nada: `data` era o texto "29/07" (sem ano) e `hora` era
 * "19H". O resultado é que evento que passou continuava na lista com a mesma
 * cara do que ia acontecer — e um "AO VIVO" marcado à mão ficava aceso para
 * sempre. Havia um no ar treze dias depois do evento.
 *
 * Com `inicio` guardando o instante, três perguntas passam a ter resposta:
 * o que vem primeiro, o que já foi, e o que está acontecendo agora.
 */

/** Quanto tempo um evento continua "acontecendo" depois da hora de começar. */
const DURACAO_PADRAO_MIN = 120;

export type Estado = "passado" | "agora" | "futuro" | "sem-horario";

export function estadoDe(item: ItemAgenda, agora: Date = new Date()): Estado {
  if (!item.inicio) return "sem-horario";

  const inicio = new Date(item.inicio).getTime();
  if (Number.isNaN(inicio)) return "sem-horario";

  const fim = inicio + DURACAO_PADRAO_MIN * 60_000;
  const t = agora.getTime();

  if (t < inicio) return "futuro";
  if (t < fim) return "agora";
  return "passado";
}

/**
 * O selo "ao vivo" só acende quando as duas coisas valem: a coordenação marcou
 * que aquele evento é transmitido **e** estamos dentro da janela dele.
 *
 * Deixar só a marca manual foi o que produziu o selo fantasma; derivar só do
 * relógio marcaria como "ao vivo" um jantar fechado. Precisa das duas.
 */
export function estaAoVivo(item: ItemAgenda, agora: Date = new Date()): boolean {
  return item.aoVivo === true && estadoDe(item, agora) === "agora";
}

/**
 * Ordena por horário, mantendo quem não tem horário no fim e na ordem em que a
 * coordenação deixou — mexer nessa ordem seria inventar informação.
 */
export function emOrdem(itens: ItemAgenda[], agora: Date = new Date()): ItemAgenda[] {
  const comHora = itens.filter((i) => estadoDe(i, agora) !== "sem-horario");
  const semHora = itens.filter((i) => estadoDe(i, agora) === "sem-horario");

  comHora.sort((a, b) => Date.parse(a.inicio!) - Date.parse(b.inicio!));
  return [...comHora, ...semHora];
}

/**
 * Qual item merece o destaque de "próximo".
 *
 * O que está acontecendo agora ganha de tudo. Sem nada acontecendo, é o
 * primeiro que ainda vai acontecer. Se a semana toda já passou, ninguém —
 * apontar um "próximo" que já foi seria pior que não apontar nada.
 */
export function idEmDestaque(itens: ItemAgenda[], agora: Date = new Date()): string | null {
  const ordenados = emOrdem(itens, agora);
  const acontecendo = ordenados.find((i) => estadoDe(i, agora) === "agora");
  if (acontecendo) return acontecendo.id;

  return ordenados.find((i) => estadoDe(i, agora) === "futuro")?.id ?? null;
}

/** Quantos já passaram — para a página poder dizer isso em vez de só apagar. */
export function quantosPassaram(itens: ItemAgenda[], agora: Date = new Date()): number {
  return itens.filter((i) => estadoDe(i, agora) === "passado").length;
}
