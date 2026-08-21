import type { IconName } from "@/components/icons";

/**
 * As peças do mutirão digital.
 *
 * Cada uma é um número do plano de governo — **com a página** — mais o texto
 * pronto pra colar. Não é slogan solto: a Parte 0 do manual diz que fato sem
 * fonte não entra, e uma peça que circula sem página é exatamente o boato que
 * a Checagem existe pra impedir.
 *
 * Os números saem de `src/features/propostas/data.ts`. Ao mudar lá, confira
 * aqui — são os dois lugares onde o mesmo dado aparece, e é por isso que a
 * página de origem viaja junto em todos.
 */

export interface Peca {
  id: string;
  icone: IconName;
  /** rótulo curto do tema, na pílula do cartão */
  tema: string;
  /** o número, grande. Curto: tem que caber e ser lembrado */
  numero: string;
  /** o que o número diz — a manchete do cartão */
  frase: string;
  /** de onde saiu */
  fonte: string;
  /** para onde o cartão manda quem viu */
  destino: string;
  /** o texto pronto pra colar junto com a imagem */
  legenda: string;
}

export const pecas: Peca[] = [
  {
    id: "esgoto",
    icone: "heartHandshake",
    tema: "Periferia",
    numero: "1 pra 4",
    frase: "Cada real investido em esgoto economiza quatro em hospital.",
    fonte: "Plano de Governo, p. 18",
    destino: "/propostas#periferia-com-estado",
    legenda:
      "Cada R$ 1 investido em esgoto economiza R$ 4 em hospital. Por isso o plano da Missão " +
      "financia a ligação de esgoto de 745 mil famílias do CadÚnico tratando saneamento como " +
      "saúde preventiva.\n\nTá tudo escrito, com meta e de onde vem o dinheiro:",
  },
  {
    id: "agua",
    icone: "world",
    tema: "Água",
    numero: "45%",
    frase: "Quase metade da água tratada se perde antes de chegar na torneira.",
    fonte: "Plano de Governo, p. 39",
    destino: "/propostas#base-do-desenvolvimento",
    legenda:
      "Quase metade da água tratada do Ceará se perde no caminho — 248 milhões de m³ por ano.\n\n" +
      "O plano da Missão corta essa perda pela metade e usa a água recuperada pra pagar o " +
      "Voucher Água de 916 mil famílias. Benefício social pago por eficiência, não por imposto " +
      "novo:",
  },
  {
    id: "expulsas",
    icone: "home",
    tema: "Segurança",
    numero: "400+",
    frase: "famílias expulsas de casa por facção no Ceará. E ninguém pra chamar.",
    fonte: "Plano de Governo, p. 17",
    destino: "/propostas#periferia-com-estado",
    legenda:
      "Mais de 400 famílias já foram expulsas de casa por facção no Ceará. Não é estatística: é " +
      "gente que perdeu a casa e não teve pra quem ligar.\n\nO plano da Missão cria resposta em " +
      "48 horas — jurídico, social e polícia — e devolve o imóvel reformado:",
  },
  {
    id: "presidio",
    icone: "sword",
    tema: "Segurança",
    numero: "1 comando",
    frase: "Quem prende e quem administra a prisão vão responder ao mesmo chefe.",
    fonte: "Plano de Governo, p. 13–14",
    destino: "/propostas#ceara-seguro",
    legenda:
      "Hoje quem prende e quem administra a prisão respondem a chefes diferentes. É nessa fresta " +
      "que a facção conversa entre os dois lados da grade.\n\nO plano da Missão junta inteligência " +
      "policial e prisional num comando só — e a economia da fusão volta como equipamento pra " +
      "ponta:",
  },
  {
    id: "fila",
    icone: "clock",
    tema: "Saúde",
    numero: "64 mil",
    frase: "pessoas esperando na fila da regulação. Fila com número público não some em silêncio.",
    fonte: "Plano de Governo, p. 31",
    destino: "/propostas#saude-que-chega",
    legenda:
      "64 mil cearenses esperando na fila da regulação, e ninguém consegue ver essa fila.\n\n" +
      "O plano da Missão põe a fila num painel público em tempo real, com prazo máximo por " +
      "procedimento. Promessa que dá pra conferir todo dia:",
  },
  {
    id: "estradas",
    icone: "pin",
    tema: "Interior",
    numero: "1 em 3",
    frase: "estradas estaduais do Ceará não é pavimentada.",
    fonte: "Plano de Governo, p. 39",
    destino: "/propostas#base-do-desenvolvimento",
    legenda:
      "Um terço das estradas estaduais do Ceará não é pavimentado — 3.640 km de 11.669.\n\n" +
      "É a melhor síntese do abandono do interior, e o plano da Missão tem o que fazer com isso:",
  },
  {
    id: "merenda",
    icone: "tree",
    tema: "Interior",
    numero: "45%",
    frase: "da merenda escolar vinda da agricultura familiar — e o plano quer passar disso.",
    fonte: "Plano de Governo, p. 22–23",
    destino: "/propostas#interior-que-produz",
    legenda:
      "A merenda escolar não é só despesa: é a maior política de renda dentro do próprio " +
      "município.\n\n75,5% dos estabelecimentos agrícolas do Ceará são familiares. O plano da " +
      "Missão compra deles acima do piso de 45% e dá ao agricultor um calendário de safra que " +
      "ele pode planejar:",
  },
  {
    id: "cobre",
    icone: "book",
    tema: "O método",
    numero: "50 páginas",
    frase: "escritas pra serem cobradas. Meta, prazo, custeio e indicador em cada compromisso.",
    fonte: "Plano de Governo, p. 2",
    destino: "/propostas",
    legenda:
      "“Leiam este plano, guardem este plano e me cobrem este plano. Se eu cumprir, renove sua " +
      "confiança. Se eu não cumprir, coloque o dedo na minha cara e use este mesmo documento " +
      "contra mim.”\n\nÉ assim que abre o plano de governo da Missão. 50 páginas, cada " +
      "compromisso com meta, prazo e de onde vem o recurso:",
  },
];

/**
 * "João da Silva" -> "joao-da-silva", igual ao `normalizar_origem()` do PHP.
 *
 * `normalize("NFD")` é o equivalente correto do `sem_acento()` do painel: o
 * Unicode define o resultado, então dá o mesmo em qualquer máquina. Os dois
 * lados **precisam** concordar, senão o mesmo militante vira duas origens no
 * relatório.
 */
export function slugDe(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira as marcas que o NFD separou
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
