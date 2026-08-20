import type { IconName } from "@/components/icons";

/* ===== Conteúdo (destilado do documento de ação — sem datas não confirmadas) ===== */

export const escada: { icon: IconName; passo: string; titulo: string; detalhe: string }[] = [
  { icon: "flag",           passo: "Passo 1", titulo: "Reagir com 🚩",              detalhe: "Um clique na mensagem do grupo. É o primeiro sinal de vida." },
  { icon: "bolt",           passo: "Passo 2", titulo: "Mandar a palavra EQUIPE",     detalhe: "Uma palavra no privado do Levi. Sem link, sem formulário, sem burocracia." },
  { icon: "whatsapp",       passo: "Passo 3", titulo: "Conversar 3 minutos",         detalhe: "O Levi conversa com você: cidade, tempo disponível, o que você sabe fazer. Quem anota é ele." },
  { icon: "users",          passo: "Passo 4", titulo: "Aparecer numa atividade",     detalhe: "Live conta. Presencial vale o dobro. É onde você conhece o seu time." },
  { icon: "star",           passo: "Passo 5", titulo: "Receber a primeira tarefa",   detalhe: "Pequena e específica, com prazo. A partir daqui você não é seguidor — é militante com função." },
];

export const times: { icon: IconName; nome: string; desc: string }[] = [
  { icon: "flag",       nome: "Rua",         desc: "Cara a cara, bairro a bairro. Adesivo, conversa e presença — sempre em dupla, nunca sozinho." },
  { icon: "video",      nome: "Comunicação", desc: "Edits, cards, vídeo e o kit da semana. A linha de maior alcance do movimento." },
  { icon: "ticket",     nome: "Eventos",     desc: "Encontros que enchem e acolhem. Presença física retém; tela não." },
  { icon: "microscope", nome: "Bastidor",    desc: "Dados, checagem, organização. Quem faz acontecer sem precisar aparecer." },
];

export const semana: { dia: string; oq: string }[] = [
  { dia: "SEG", oq: "Balanço da semana no grupo · live" },
  { dia: "TER", oq: "Reunião de coordenação (30 min, online)" },
  { dia: "QUA", oq: "Reunião do seu time · 20 min de formação antes · live" },
  { dia: "QUI", oq: "Dia de produção de conteúdo" },
  { dia: "SEX", oq: "Ação de rua leve · live" },
  { dia: "SÁB", oq: "Evento da semana (cada sábado, um time organiza)" },
  { dia: "DOM", oq: "A live principal: balanço e convocação" },
];

/**
 * O caminho até a votação.
 *
 * `estado` existe porque uma linha do tempo sem ele mente: quem abre a página
 * hoje precisa ver onde o movimento **está**, não uma lista de etapas todas
 * com a mesma cara. Ao virar de fase, mova o `agora` para a linha seguinte —
 * é a única manutenção que este array pede.
 *
 * A fase da campanha se escreve pelo nome ("campanha aberta"), nunca pela data
 * da virada: ela muda a cada eleição e o texto datado envelhece sozinho dentro
 * de uma página que ninguém relê. Mesma regra do currículo da formação.
 */
export const fases: { estado: "feito" | "agora" | "vem"; quando: string; titulo: string; itens: string[] }[] = [
  {
    estado: "feito",
    quando: "Concluído",
    titulo: "Reativação",
    itens: [
      "Live de abertura — o plano inteiro, ao vivo",
      "Reunião da estrutura: quem apareceu, saiu com função",
      "Times criados e coordenadores definidos",
    ],
  },
  {
    estado: "feito",
    quando: "Concluído",
    titulo: "Consolidação",
    itens: [
      "Convenção estadual — a maior mobilização do período",
      "Formação de 20 minutos rodando em toda reunião",
      "Kit de argumentos novo toda semana",
    ],
  },
  {
    estado: "agora",
    quando: "Agora · campanha aberta",
    titulo: "A rua, com material oficial",
    itens: [
      "Campanha de rua liberada — material oficial, nome e número",
      "Kit diário de conteúdo no grupo até as 10h",
      "Lives sobem de frequência — por escada, com rodízio",
      "Todo encontro capta contato: sem lista, o evento rende metade",
    ],
  },
  {
    estado: "vem",
    quando: "Próximas semanas",
    titulo: "O grande encontro",
    itens: [
      "Congresso estadual com as principais lideranças do movimento no palco",
      "A estrutura anunciada diante de todos — quem constrói, é chamado pelo nome",
      "Cada militante leva duas pessoas",
      "Data anunciada no grupo assim que estiver confirmada",
    ],
  },
  {
    estado: "vem",
    quando: "Reta final · até 4 de outubro",
    titulo: "Ritmo máximo",
    itens: [
      "Live diária e rua todo dia",
      "Todo mundo com escala, ninguém sem saber o que fazer",
    ],
  },
  {
    estado: "vem",
    quando: "Depois da urna",
    titulo: "Não acaba na eleição",
    itens: [
      "Confraternização ganhe-ou-perca — quem construiu, celebra junto",
      "Times viram estrutura permanente",
      "Abre o ciclo seguinte — e ele começa aqui",
    ],
  },
];

export const regras: string[] = [
  "Conversa, não formulário",
  "Todo mundo num time de 8 a 14",
  "Formação de 20 minutos, sempre",
  "Nada sai sem checagem",
  "Todo evento captura contato",
  "Cadência sobe por escada",
  "Data só se anuncia confirmada",
];
