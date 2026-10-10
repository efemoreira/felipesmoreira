import type { Pitch } from "../tipos";

const T = "/pitch/coopcrm";

/** Roteiro de `coopcrm/docs/pitch/README.md`; capturas do cenário Coop Cuidar Saúde (Fortaleza). */
export const COOPCRM: Pitch = {
  slug: "coopcrm",
  nome: "CoopCRM Saúde",
  descricao: "CoopCRM Saúde: a escala da cooperativa de enfermagem e cuidadores, justa, rastreável e no bolso de quem cuida.",
  marca: { primaria: "#1F5F8B", escuro: "#102A43", acento: "#F28B70", tintaAcento: "#1B1B19" },
  slides: [
    {
      tipo: "capa",
      selo: "Cooperativas de saúde",
      titulo: "A escala da cooperativa de saúde, sem grupo de WhatsApp.",
      subtitulo:
        "Do pedido da família ou do hospital ao plantão coberto: o sistema distribui com critério claro, confere COREN e descanso, e registra cada plantão para a AGO.",
    },
    {
      tipo: "cartoes",
      dor: true,
      selo: "O problema",
      titulo: "Hoje a escala de uma cooperativa de enfermagem vive num grupo de WhatsApp.",
      itens: [
        { titulo: "Quem responde primeiro leva", texto: "A coordenação escolhe sem critério declarado e responde mensagem às 22h." },
        { titulo: "Ninguém sabe do COREN", texto: "Credencial vencida e descanso entre plantões só aparecem quando dá problema." },
        { titulo: "Cliente cobra por planilha", texto: "Hospital e operadora conferem horas e valores à mão, mês a mês." },
        { titulo: "Plantão feito não vira prova", texto: "Na AGO, a distribuição justa é a palavra da coordenação contra a do cooperado." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "A solução",
      titulo: "O sistema é o árbitro, não o gestor.",
      subtitulo: "Um produto para a cooperativa e um portal para cada cliente dela. Os papéis são acumuláveis.",
      itens: [
        { titulo: "Coordenação de escala", texto: "Cobertura da semana, descobertos nas próximas 48 horas e cobertura urgente em um toque." },
        { titulo: "Profissional", texto: "Plantões disponíveis no celular, candidatura em dois toques e a produção do mês à vista." },
        { titulo: "Enfermeiro(a) RT", texto: "Avaliação do paciente, plano de cuidados e relatório estruturado de cada plantão." },
        { titulo: "Conselho fiscal", texto: "Vê tudo, sem botões: cada decisão com o ranking do momento." },
        { titulo: "Família", texto: "Quem vem, quando, com COREN verificado, e o relatório do plantão." },
        { titulo: "Hospital, operadora e prefeitura", texto: "Cobertura de hoje, os pacientes que pagam e as faturas, num portal próprio." },
      ],
    },
    {
      tipo: "painel",
      selo: "O produto · painel web",
      titulo: "A coordenação abre o dia e vê o que precisa de alguém.",
      principal: { src: `${T}/painel-coordenacao.webp`, legenda: "Painel da coordenação: cobertura, ofertas, credenciais e os descobertos nas próximas 48 horas" },
      lado: [
        { src: `${T}/mapa-de-cobertura.webp`, legenda: "Mapa de cobertura: cada paciente e posto, dia a dia" },
        { src: `${T}/plantao-ranking.webp`, legenda: "Ranking ao vivo, com o motivo de quem não pode pegar" },
      ],
    },
    {
      tipo: "celulares",
      selo: "O produto · app",
      titulo: "O plantão no bolso, e transparência sem exposição.",
      telas: [
        { src: `${T}/app-tecnico-inicio.webp`, legenda: "Início do profissional" },
        { src: `${T}/app-tecnico-disponiveis.webp`, legenda: "Plantões disponíveis" },
        { src: `${T}/app-tecnico5-plantao.webp`, legenda: "“Por que não posso?”" },
        { src: `${T}/app-tecnico-meu-plantao.webp`, legenda: "No dia: check-in e passagem" },
        { src: `${T}/app-familia-hoje.webp`, legenda: "A família acompanha" },
      ],
    },
    {
      tipo: "painel",
      selo: "Da escala à AGO",
      titulo: "Cada escolha fica registrada, e a AGO recebe a prova.",
      principal: { src: `${T}/relatorio-da-ago.webp`, legenda: "Relatório da AGO: horas e renda por cooperado, índice de equilíbrio e cada escolha fora do ranking" },
      lado: [
        { src: `${T}/plantao-trilha-de-decisoes.webp`, legenda: "Trilha de decisões imutável" },
        { src: `${T}/portal-da-familia.webp`, legenda: "Portal da família, com COREN verificado" },
      ],
    },
    {
      tipo: "cartoes",
      selo: "Diferenciais",
      titulo: "O que é difícil de copiar.",
      itens: [
        { titulo: "Distribuição justa e auditável", texto: "Rodízio por horas no mês, equipe de referência do paciente e justificativa quando alguém foge do critério." },
        { titulo: "Regras de saúde de verdade", texto: "Cuidador não cobre paciente que exige técnico, COREN vencido não entra, descanso de 11 horas é respeitado." },
        { titulo: "Livro de produção imutável", texto: "Espelho por profissional e cliente, faturamento a partir do espelho e estorno em vez de edição." },
        { titulo: "Do cuidado ao repasse", texto: "Fechamento do mês, lote para o banco, reserva legal e FATES, informe de rendimentos." },
        { titulo: "Cobrança e WhatsApp prontos", texto: "Fatura com Pix, boleto ou cartão na conta da cooperativa; oferta de plantão com “1 confirma, 2 recusa”." },
        { titulo: "Funciona sem internet", texto: "No app, o plantão segue offline e é enviado quando o sinal volta." },
      ],
    },
    {
      tipo: "planos",
      selo: "Modelo de negócio",
      titulo: "Implantação e mensalidade, por tamanho da cooperativa.",
      subtitulo: "Multi-tenant de custo fixo: a cooperativa paga a implantação uma vez e uma mensalidade com profissionais incluídos.",
      planos: [
        {
          nome: "Essencial",
          preco: "R$ 490",
          unidade: "por mês · implantação R$ 990",
          resumo: "Para cooperativas que estão saindo do WhatsApp.",
          itens: ["30 profissionais incluídos (R$ 12 o adicional)", "Distribuição justa com trilha", "App do profissional e portal da família"],
        },
        {
          nome: "Cooperativa",
          preco: "R$ 1.290",
          unidade: "por mês · implantação R$ 2.490",
          resumo: "Domiciliar e institucional, com produção e espelhos.",
          itens: ["100 profissionais incluídos (R$ 9 o adicional)", "Hospitais, clínicas e ILPIs", "Conselho fiscal e AGO"],
          recomendado: true,
        },
        {
          nome: "Rede",
          preco: "R$ 3.490",
          unidade: "por mês · implantação R$ 4.990",
          resumo: "Várias cidades, operadoras e órgãos públicos.",
          itens: ["400 profissionais incluídos (R$ 6 o adicional)", "Faturamento por contratante", "Suporte prioritário"],
        },
      ],
      nota: "Valores de partida, editáveis no painel do dono — os mesmos que a landing mostra.",
    },
    {
      tipo: "comparacao",
      selo: "Antes e depois",
      titulo: "O grupo de WhatsApp contra o CoopCRM.",
      colunas: ["No WhatsApp", "No CoopCRM"],
      linhas: [
        ["Quem responde primeiro leva", "Ranking pelo critério declarado, com o motivo de cada exclusão"],
        ["A coordenação escolhe sem deixar rastro", "Trilha de decisões imutável, com justificativa"],
        ["COREN e descanso conferidos de cabeça", "Elegibilidade automática: competência, credencial, 11 horas, folga"],
        ["Horas somadas em planilha", "Livro de produção, espelhos e faturamento por cliente"],
        ["Família liga para saber quem vem", "Portal e app com quem vem, quando e o relatório"],
      ],
      posicao: "Não é marketplace aberto nem prontuário: só entra quem a cooperativa convida, e o relatório registra o cuidado no plantão.",
    },
    {
      tipo: "numeros",
      selo: "Onde estamos",
      titulo: "Produto pronto nas três frentes, testado num cenário real.",
      subtitulo: "Falta só o que depende de fora: nota fiscal de serviço (por município), regras de glosa das operadoras e conectar as contas Asaas e WhatsApp Business.",
      itens: [
        { valor: "3", rotulo: "frentes prontas: API, painel web e app" },
        { valor: "7", rotulo: "tipos de pessoa com tela própria, da diretoria à prefeitura" },
        { valor: "15", rotulo: "profissionais e 6 clientes no cenário de demonstração" },
        { valor: "3", rotulo: "meses de histórico no livro de produção do cenário" },
      ],
    },
    {
      tipo: "pedido",
      selo: "O que buscamos",
      titulo: "Vamos tirar a primeira cooperativa do grupo de WhatsApp.",
      itens: [
        { titulo: "Cooperativas piloto", texto: "Enfermagem ou cuidadores, para rodar uma escala real e dizer o que falta." },
        { titulo: "Hospitais e operadoras", texto: "Clientes de cooperativa que queiram cobertura e faturamento sem planilha." },
        { titulo: "Próxima edição", texto: "Cooperativas de obras e de outros serviços: o núcleo já separa o que é comum do que é da saúde." },
      ],
    },
  ],
};
