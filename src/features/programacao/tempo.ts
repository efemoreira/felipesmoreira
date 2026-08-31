import type { Agenda, ItemAgenda } from "./tipos";

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

/**
 * O QUE JÁ ACONTECEU SAI DA LISTA.
 *
 * A página se chama Programação e é lida por quem quer saber o que vem. Manter
 * o encontro de terça passada, mesmo apagado, gastava a tela com o que já não
 * dá para fazer e fazia a agenda inteira parecer velha — no celular era um
 * evento e meio por tela de rolagem até chegar no que ainda vale.
 *
 * Vale em QUALQUER recorte, inclusive "tudo": ali "tudo" quer dizer tudo o que
 * ainda vai acontecer, e não o arquivo histórico. O histórico é do painel, em
 * `/painel/eventos`, onde a coordenação precisa dele.
 *
 * Item sem horário fica: ninguém pode afirmar que ele passou.
 */
export function soFuturos(itens: ItemAgenda[], agora: Date = new Date()): ItemAgenda[] {
  return itens.filter((i) => estadoDe(i, agora) !== "passado");
}

/* ===================== a semana corrente ===================== */

/** O fuso do Ceará, escrito uma vez: o resto do arquivo pergunta a ele. */
const FUSO = "America/Fortaleza";

/**
 * Os meses por extenso — é assim que eles entram no período ("29 de agosto a
 * 4 de setembro"). Escritos à mão, e não por `toLocaleDateString`, porque o
 * espelho em PHP também os escreve à mão: o `strftime()` de lá depende do
 * locale instalado no servidor, e na Hostinger sai em inglês.
 */
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export interface Janela {
  /** O primeiro instante que entra. */
  inicio: Date;
  /** O primeiro instante que já NÃO entra — o intervalo é `inicio <= t < fim`. */
  fim: Date;
}

/**
 * Que dia e que hora são no Ceará, independentemente de onde o navegador está.
 *
 * Quem abre a página em Lisboa às 2h da manhã ainda está lendo a agenda de
 * Fortaleza, onde é o dia anterior. Sem isto, "hoje" seria o hoje de quem olha,
 * e não o hoje do encontro.
 */
function partesNoCeara(agora: Date): { ano: number; mes: number; dia: number; semana: number } {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const p = Object.fromEntries(f.formatToParts(agora).map((x) => [x.type, x.value]));
  const ordem = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    ano: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    /* 0 = domingo, 6 = sábado — a mesma origem que o PHP usa. */
    semana: ordem.indexOf(p.weekday as string),
  };
}

/**
 * O deslocamento do Ceará em relação ao UTC, em minutos, naquele instante.
 *
 * Fortaleza não tem horário de verão desde 2019, mas ler o deslocamento em vez
 * de escrever `-03:00` é o que impede este arquivo de mentir se isso mudar.
 */
function minutosDoCeara(quando: Date): number {
  const comoUtc = new Date(quando.toLocaleString("en-US", { timeZone: "UTC" }));
  const comoCeara = new Date(quando.toLocaleString("en-US", { timeZone: FUSO }));
  return Math.round((comoCeara.getTime() - comoUtc.getTime()) / 60_000);
}

/** Meia-noite no Ceará do dia informado, como instante absoluto. */
function meiaNoiteNoCeara(ano: number, mes: number, dia: number, referencia: Date): Date {
  const palpite = Date.UTC(ano, mes - 1, dia, 0, 0, 0);
  return new Date(palpite - minutosDoCeara(referencia) * 60_000);
}

/**
 * A SEMANA VAI DE DOMINGO A SÁBADO, no fuso do Ceará.
 *
 * Espelha `semana_de()` em `public/painel/agenda-comum.php`. As duas existem
 * porque uma roda no navegador de quem visita e a outra no PHP que monta o
 * painel — e se discordarem, o encontro de domingo aparece "nesta semana" num
 * lado e "na semana que vem" no outro.
 *
 * DOMINGO, e não segunda: quem abre `/programacao` lê a semana como lê um
 * calendário de parede, onde o domingo abre a linha — e a maior parte dos
 * encontros de rua é justamente de fim de semana. Com a semana começando na
 * segunda, o domingo caía no fim da lista, colado no sábado da semana anterior.
 */
export function semanaDe(agora: Date = new Date()): Janela {
  const { ano, mes, dia, semana } = partesNoCeara(agora);
  const inicio = meiaNoiteNoCeara(ano, mes, dia - semana, agora);
  return { inicio, fim: new Date(inicio.getTime() + 7 * 86_400_000) };
}

/** O dia de hoje no Ceará, do primeiro instante ao primeiro instante de amanhã. */
export function diaDe(agora: Date = new Date()): Janela {
  const { ano, mes, dia } = partesNoCeara(agora);
  const inicio = meiaNoiteNoCeara(ano, mes, dia, agora);
  return { inicio, fim: new Date(inicio.getTime() + 86_400_000) };
}

/**
 * O item cai dentro da janela?
 *
 * Item sem horário nunca "é desta semana": afirmar isso seria inventar uma data
 * que ninguém digitou. Ele fica fora dos recortes e só aparece em "tudo".
 */
export function dentroDoPeriodo(item: ItemAgenda, janela: Janela): boolean {
  if (!item.inicio) return false;
  const t = Date.parse(item.inicio);
  if (Number.isNaN(t)) return false;
  return t >= janela.inicio.getTime() && t < janela.fim.getTime();
}

/**
 * "29 de agosto a 4 de setembro" — o período escrito por extenso.
 *
 * É o que substitui o campo digitado à mão na capa da programação, que
 * envelhecia sozinho: quem esquecia de trocar deixava o site anunciando a
 * semana passada.
 */
/**
 * O PERÍODO QUE VAI PARA A TELA — o escrito à mão, enquanto ele valer.
 *
 * O campo do painel existe para a semana atípica ("2 a 15 de outubro", o
 * feriadão, o mutirão de dois dias). O problema é que ele nunca sabia parar:
 * quem escrevia "24/08 a 30/08" e não voltava na semana seguinte deixava o site
 * anunciando uma semana que já tinha acabado, e a página continuava desenhando
 * sem sinal nenhum de que estava mentindo. Era o defeito mais visível da
 * agenda, porque é a primeira linha que se lê embaixo do título.
 *
 * Agora o texto vem carimbado com a semana em que foi escrito. Escrever ali é
 * dizer "ESTA semana não é uma semana" — uma frase sobre a semana corrente, que
 * naturalmente expira quando ela vira. Passada a virada, o relógio volta a
 * responder, e o pior caso deixa de ser uma data errada para ser a data certa.
 *
 * Texto sem carimbo (o que já estava gravado antes disto) conta como vencido:
 * ninguém sabe de que semana ele falava.
 */
export function periodoVigente(
  agenda: Pick<Agenda, "periodo" | "periodoSemana">,
  agora: Date = new Date(),
): string {
  const escrito = agenda.periodo?.trim();
  if (escrito && agenda.periodoSemana) {
    const carimbo = Date.parse(agenda.periodoSemana);
    if (!Number.isNaN(carimbo) && carimbo === semanaDe(agora).inicio.getTime()) {
      return escrito;
    }
  }
  return periodoDaSemana(agora);
}

export function periodoDaSemana(agora: Date = new Date()): string {
  const { inicio, fim } = semanaDe(agora);
  /* O fim da janela é o domingo seguinte; o sábado é o dia anterior a ela. */
  const sabado = new Date(fim.getTime() - 86_400_000);

  const de = partesNoCeara(inicio);
  const ate = partesNoCeara(sabado);

  if (de.mes === ate.mes) {
    return `${de.dia} a ${ate.dia} de ${MESES[ate.mes - 1]}`;
  }
  return `${de.dia} de ${MESES[de.mes - 1]} a ${ate.dia} de ${MESES[ate.mes - 1]}`;
}
