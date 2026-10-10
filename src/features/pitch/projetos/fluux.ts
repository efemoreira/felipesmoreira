import type { Pitch } from "../tipos";

/** De `fluux/docs/produto.md`, `roadmap.md`, `historico.md` e ADR 010. Sem capturas ainda: a grade é desenhada. */
export const FLUUX: Pitch = {
  slug: "fluux",
  nome: "Fluux",
  descricao: "Fluux: o planejador do dia com o Pomodoro dentro do evento, metas que avançam sozinhas e gráficos de crescimento.",
  marca: { primaria: "#2C5F8C", escuro: "#0B1220", acento: "#27AE60", tintaAcento: "#050810" },
  slides: [
    {
      tipo: "capa",
      selo: "Planejador do dia",
      titulo: "Arrume o dia com o dedo, foque no que importa e saiba, à noite, o que realizou.",
      subtitulo: "Grade de horários, Pomodoro dentro do evento, metas que avançam sozinhas e gráficos de crescimento.",
    },
    {
      tipo: "cartoes",
      dor: true,
      selo: "O problema",
      titulo: "A semana acaba com a sensação de que corri e não saí do lugar.",
      itens: [
        { titulo: "O dia está em cinco apps", texto: "Agenda num lugar, lista de tarefas noutro, timer de foco num terceiro. Nada conversa." },
        { titulo: "Lista não é tempo", texto: "Vinte tarefas sem hora cabem na lista e não cabem no dia. Ninguém avisa." },
        { titulo: "Meta solta do dia", texto: "A meta do ano mora numa planilha que não sabe o que foi feito hoje." },
        { titulo: "Sem fechamento", texto: "Ninguém marca o que realizou; o que ficou para trás some em vez de ir para amanhã." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "A solução",
      titulo: "Quatro rituais curtos, num lugar só.",
      subtitulo: "Para quem vive de agenda própria: autônomos, CLT com muitas demandas, empreendedores solo, estudantes e concurseiros.",
      itens: [
        { titulo: "Planejar o dia · até 3 min", texto: "Ver os fixos, arrastar a bandeja para a grade, marcar o 🐸 sapo do dia, olhar o aviso de capacidade." },
        { titulo: "Executar", texto: "Tocar no evento → Focar (🍅) → ✓. O Pomodoro mora dentro do evento." },
        { titulo: "Fechar o dia · até 2 min", texto: "? → ✓ ou ✗. O ✗ vai para amanhã ou para a bandeja; humor, energia e um aprendizado." },
        { titulo: "Planejar a semana · até 15 min", texto: "Realização, horas de foco, tempo por área da vida, metas e Roda da Vida." },
      ],
    },
    {
      tipo: "ilustracao",
      desenho: "grade-do-dia",
      selo: "O produto · o coração",
      titulo: "O dia é uma grade de horários, nunca uma lista.",
      itens: [
        { titulo: "Segurar e arrastar", texto: "300 ms e o evento anda, com encaixe de 5 min. Na borda, troca de dia. Desfaz por 5 s." },
        { titulo: "Lado a lado", texto: "Eventos sobrepostos dividem a coluna; a linha do agora corta o dia." },
        { titulo: "Encaixar", texto: "O que está sem horário vai para o próximo espaço livre do expediente." },
        { titulo: "Offline", texto: "A grade abre em menos de 1 s, com ou sem rede; o Pomodoro nunca perde tempo." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "Diferenciais",
      titulo: "O que é difícil de copiar.",
      itens: [
        { titulo: "Pomodoro dentro do evento", texto: "Ciclo de 4, pausas, modelos 25/5 · 50/10 · 15/3, chip global e aviso no fim." },
        { titulo: "Planejado × realizado", texto: "Cada evento é ?, ✓ ou ✗ — a taxa de realização sai do que aconteceu, não do que se planejou." },
        { titulo: "Metas que andam sozinhas", texto: "Horas, frequência com sequência, quantidade ou marcos, ligadas aos eventos: o ✓ e o 🍅 avançam a meta." },
        { titulo: "Roda da Vida e Equilíbrio", texto: "Tempo por área (carreira, saúde, finanças…) contra as prioridades que a pessoa escolheu." },
        { titulo: "LifeGraph", texto: "132 habilidades, livro de prática imutável e maestria de 1 a 10 pelas horas acumuladas." },
        { titulo: "Métricas sem rastreador", texto: "Dias planejados, dias fechados, foco e retenção medidos por eventos do próprio produto." },
      ],
    },
    {
      tipo: "planos",
      selo: "Modelo de negócio",
      titulo: "Freemium com 14 dias de Premium para todo mundo.",
      subtitulo: "Quando o teste acaba, a conta cai para o Gratuito. O planejador e o foco nunca param.",
      planos: [
        {
          nome: "Gratuito",
          preco: "R$ 0",
          unidade: "para sempre",
          resumo: "O dia inteiro, sem limite de tempo.",
          itens: ["Planejador, Pomodoro e fechar o dia", "Até 3 metas abertas", "Gráficos dos últimos 30 dias e LifeGraph"],
        },
        {
          nome: "Premium",
          preco: "Assinatura",
          unidade: "preço no lançamento",
          resumo: "Tudo, com o histórico inteiro.",
          itens: ["Metas sem limite e histórico completo", "Equilíbrio e mapa de calor", "Modelos de dia, calendário externo e exportação"],
          recomendado: true,
        },
      ],
      nota: "A cobrança (Asaas) entra na Onda 2; até lá a ativação do Premium é manual.",
    },
    {
      tipo: "comparacao",
      selo: "Posicionamento",
      titulo: "Não é mais uma agenda nem mais uma lista de tarefas.",
      colunas: ["O que o Fluux não é", "Por quê"],
      linhas: [
        ["Agenda de equipe", "O dia é de uma pessoa; ninguém marca reunião no Fluux de outro"],
        ["Gerenciador de projetos", "Não há quadro, sprint nem responsável: há o dia e as metas"],
        ["Lista de tarefas pura", "Tarefa sem hora fica na bandeja até ganhar lugar na grade"],
        ["Acompanhamento clínico", "Humor e energia são reflexão pessoal, não diagnóstico"],
      ],
      posicao: "Um planejador do dia: arrumar o tempo, focar e fechar. O resto (metas, crescimento, LifeGraph) existe para alimentar esse ciclo.",
    },
    {
      tipo: "etapas",
      selo: "Onde estamos",
      titulo: "A quinta tentativa, e a primeira com o ciclo inteiro ligado.",
      subtitulo: "As quatro anteriores deixaram a visão, a grade certa e o LifeGraph; esta juntou tudo com API, conta, offline e testes.",
      itens: [
        { etapa: "M1", titulo: "Meu dia", texto: "Grade com arraste, bandeja, repetição, fechar o dia, Pomodoro e offline.", pronto: true },
        { etapa: "M2", titulo: "Minhas metas", texto: "Metas de 4 tipos, Roda da Vida e boas-vindas. Falta o push dos rituais.", pronto: true },
        { etapa: "M3", titulo: "Meu crescimento", texto: "Realização, foco, Equilíbrio e LifeGraph. Falta a revisão semanal guiada.", pronto: true },
        { etapa: "M4", titulo: "Fluux na web", texto: "Planejador no navegador, site com preços, painel e calendário externo.", pronto: false },
        { etapa: "Onda 2", titulo: "Lançamento", texto: "Cobrança, widget na tela inicial, visão do mês e tablet.", pronto: false },
        { etapa: "Onda 3", titulo: "IA", texto: "“Monte meu dia”, captura em linguagem natural e resumo da semana.", pronto: false },
      ],
    },
    {
      tipo: "pedido",
      selo: "O que buscamos",
      titulo: "Gente disposta a planejar o dia no Fluux por uma semana.",
      itens: [
        { titulo: "Testadores", texto: "Autônomos, estudantes e concurseiros para uma semana de uso real, com conversa no fim." },
        { titulo: "Metodologias", texto: "Quem ensina produtividade e quer seus rituais (Ikigai, 3 Horizontes, Mind Sweep) dentro do app." },
        { titulo: "Parceiros de lançamento", texto: "Escolas, cursinhos e comunidades que queiram oferecer o Premium aos alunos." },
      ],
    },
  ],
};
