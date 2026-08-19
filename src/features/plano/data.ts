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

export const fases: { quando: string; titulo: string; itens: string[] }[] = [
  {
    quando: "Agora",
    titulo: "Reativação",
    itens: [
      "Live de abertura no domingo — o plano inteiro, ao vivo",
      "Reunião da estrutura na quarta, 19h30 — quem aparece, sai com função",
      "Times criados e coordenadores definidos",
    ],
  },
  {
    quando: "Julho → Agosto",
    titulo: "Consolidação",
    itens: [
      "Convenção estadual — a maior mobilização do período",
      "Formação de 20 minutos rodando em toda reunião",
      "Kit de argumentos novo toda semana",
    ],
  },
  {
    quando: "16 de agosto",
    titulo: "Vira a chave",
    itens: [
      "Começa a campanha de rua com material oficial",
      "Kit diário de conteúdo até as 10h",
      "Lives sobem de frequência — por escada, com rodízio",
    ],
  },
  {
    quando: "Setembro",
    titulo: "O grande encontro",
    itens: [
      "Congresso estadual com as principais lideranças do movimento no palco",
      "A estrutura anunciada diante de todos — quem constrói, é chamado pelo nome",
      "Cada militante leva duas pessoas",
      "Data anunciada no grupo assim que estiver confirmada",
    ],
  },
  {
    quando: "Reta final",
    titulo: "Até 4 de outubro",
    itens: [
      "Ritmo máximo: live diária e rua todo dia",
      "Todo mundo com escala, ninguém sem saber o que fazer",
    ],
  },
  {
    quando: "Novembro",
    titulo: "Não acaba na eleição",
    itens: [
      "Confraternização ganhe-ou-perca — quem construiu, celebra junto",
      "Times viram estrutura permanente",
      "Abre o ciclo de 2028 — e ele começa aqui",
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
