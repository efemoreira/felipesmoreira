import type { Pitch } from "../tipos";

const T = "/pitch/guardiaopredial";

/** Pitch do Guardião 360 no formato do site felipesmoreira.com, com foco por público e imagens reais. */
export const GUARDIAO_PREDIAL: Pitch = {
  slug: "guardiaopredial",
  nome: "Guardião 360",
  descricao: "Guardião 360: gestão condominial, manutenção preventiva e execução comprovada em uma única plataforma.",
  marca: { primaria: "#0F4C5C", escuro: "#12303A", acento: "#F2A93B", tintaAcento: "#1B1B19" },
  slides: [
    {
      tipo: "capa",
      selo: "Guardião 360",
      titulo: "Gestão condominial + manutenção preventiva + execução garantida.",
      subtitulo: "A administradora e o síndico acompanham o prédio inteiro em um só lugar: do chamado à comprovação do serviço.",
    },
    {
      tipo: "cartoes",
      dor: true,
      selo: "O problema",
      titulo: "O condomínio até registra problemas, mas ainda falha em garantir a execução.",
      itens: [
        { titulo: "Síndico", texto: "Recebe alertas e reclamações, mas perde tempo para organizar orçamento, aprovação, execução e aceite." },
        { titulo: "Morador", texto: "Vê taxa, aviso e obra acontecendo, mas não enxerga claramente o que foi feito, quanto custou e qual garantia existe." },
        { titulo: "Portaria e equipe", texto: "Apontam ocorrências, mas o histórico técnico e os comprovantes se espalham em conversas e anexos soltos." },
        { titulo: "Administradora", texto: "Gerencia carteira grande sem trilha única de prazos, responsáveis, evidências e pendências operacionais." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "A solução",
      titulo: "Uma plataforma de operação predial, não só um app de comunicação.",
      subtitulo: "O Guardião 360 conecta gestão, manutenção preventiva e rede de prestadores com rastreabilidade de ponta a ponta.",
      itens: [
        { titulo: "Síndico e subsíndico", texto: "Priorizam pendências, aprovam cotações, acompanham execução e aceitam serviços com evidências." },
        { titulo: "Morador", texto: "Acompanha transparência das despesas, avisos, reservas e andamento de melhorias no prédio." },
        { titulo: "Conselho", texto: "Fiscaliza orçamento, justificativas de contratação e histórico de manutenção por equipamento." },
        { titulo: "Portaria", texto: "Mantém controle de acesso e ocorrências integrado ao contexto operacional do condomínio." },
        { titulo: "Equipe de campo", texto: "Zelador e manutenção registram execução, checklists, fotos e comprovantes direto no app." },
        { titulo: "Administradora", texto: "Opera vários condomínios com visão consolidada de materiais, ordens de serviço e compliance." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "Para cada público",
      titulo: "A mesma plataforma, com valor claro para perfis diferentes.",
      subtitulo: "Guardião 360 em linguagem de negócio para administradoras, síndicos, moradores e operação de campo.",
      itens: [
        { titulo: "Administradoras", texto: "Carteira inteira sob controle com visão unificada de pendências, execução e compliance." },
        { titulo: "Síndicos e subsíndicos", texto: "Do orçamento ao aceite, tudo com dono, prazo, evidência e justificativa de decisão." },
        { titulo: "Moradores", texto: "Mais transparência sobre custos, obras e andamento dos serviços que afetam o dia a dia." },
        { titulo: "Portaria e equipe", texto: "Registro da operação em tempo real: ocorrências, execução, fotos e histórico técnico do prédio." },
      ],
    },
    {
      tipo: "painel",
      selo: "O produto · painel web",
      titulo: "No painel, a gestão vê o que está pendente e o que já foi comprovado.",
      principal: { src: `${T}/painel-administradora.webp`, legenda: "Painel da administradora com visão consolidada por condomínio" },
      lado: [
        { src: `${T}/painel-inicio-sindico.webp`, legenda: "Início operacional do síndico com prioridades e ações rápidas" },
        { src: `${T}/painel-portaria.webp`, legenda: "Portaria e operação conectadas ao histórico do prédio" },
      ],
    },
    {
      tipo: "celulares",
      selo: "O produto · app",
      titulo: "No celular, equipe, síndico e moradores resolvem o dia a dia com contexto.",
      telas: [
        { src: `${T}/app-morador-inicio.webp`, legenda: "App do morador com visão do dia" },
        { src: `${T}/app-morador-financeiro.webp`, legenda: "Transparência de cobranças e despesas" },
        { src: `${T}/app-morador-chamados.webp`, legenda: "Chamados e ordens com fotos e atualização de status" },
        { src: `${T}/app-morador-reservas.webp`, legenda: "Reservas de espaços" },
        { src: `${T}/app-portaria.webp`, legenda: "Operação de portaria e equipe em campo" },
      ],
    },
    {
      tipo: "cartoes",
      selo: "Diferenciais",
      titulo: "Nosso diferencial é garantir execução com rastreabilidade.",
      itens: [
        { titulo: "Manutenção com dono, prazo e status", texto: "Cada ordem nasce com responsável, SLA, etapa e histórico de transição." },
        { titulo: "Cotação com decisão auditável", texto: "Escolha com motivo obrigatório, comparação entre propostas e trilha do valor selecionado." },
        { titulo: "Evidência operacional padronizada", texto: "Fotos, checklist, comprovante e observações ficam vinculados ao serviço executado." },
        { titulo: "Gestão de materiais integrada", texto: "Almoxarifado, reposição e consumo conectados à operação e às obrigações do prédio." },
        { titulo: "Histórico técnico do ativo", texto: "Equipamentos acumulam falhas, custos, garantias e próximas preventivas em uma linha do tempo." },
        { titulo: "Distribuição por administradoras", texto: "Padronização de processo, implantação em carteira e ganho de escala comercial." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "Modelo de negócio",
      titulo: "Mensalidade recorrente + receita operacional por serviço contratado.",
      itens: [
        {
          titulo: "Planos da plataforma",
          texto: "Plano Gestão (R$ 249–399/mês) e Gestão + Manutenção (R$ 499–999/mês), variando por porte e nível de serviço. A mensalidade sustenta o negócio.",
        },
        {
          titulo: "Rede de prestadores",
          texto: "Comissão transparente ou taxa fixa por coordenação de serviço concluído: a receita adicional vem quando há execução real.",
        },
      ],
    },
    {
      tipo: "planos",
      selo: "Modelo de negócio",
      titulo: "Posicionamento comercial por valor entregue.",
      planos: [
        {
          nome: "Plano Gestão",
          preco: "R$ 249–399",
          unidade: "por condomínio/mês",
          resumo: "Base administrativa para organizar rotina e comunicação.",
          itens: ["Ocorrências, comunicados e documentos", "Acompanhamento de assembleias e pendências", "Fluxos básicos de gestão condominial"],
        },
        {
          nome: "Gestão + Manutenção",
          preco: "R$ 499–999",
          unidade: "por condomínio/mês",
          resumo: "Operação predial completa com rastreabilidade de execução.",
          itens: ["Ordens com fluxo de status e responsável", "Cotações com motivo e trilha de decisão", "Evidências, histórico e aceite de serviço"],
          recomendado: true,
        },
        {
          nome: "Receita por serviços",
          preco: "Comissão ou taxa",
          unidade: "por execução coordenada",
          resumo: "Upside operacional sem depender só da mensalidade.",
          itens: ["Prestadores verificados", "Execução acompanhada", "Garantia rastreada"],
        },
      ],
      nota: "A mensalidade é a base da sustentabilidade; a receita de serviços complementa quando há contratação real.",
    },
    {
      tipo: "comparacao",
      selo: "Viabilidade",
      titulo: "Com ticket médio de R$ 599, a escala muda o patamar do negócio.",
      colunas: ["Base ativa", "Receita bruta estimada"],
      linhas: [
        ["50 condomínios", "R$ 29.950/mês · R$ 359.400/ano"],
        ["100 condomínios", "R$ 59.900/mês · R$ 718.800/ano"],
        ["300 condomínios", "R$ 179.700/mês · R$ 2.156.400/ano"],
        ["500 condomínios", "R$ 299.500/mês · R$ 3.594.000/ano"],
        ["Receita por serviços", "Upside adicional por execução coordenada"],
      ],
      nota: "Cenário ilustrativo de receita bruta, sem incluir comissão de serviços e antes de impostos, CAC e estrutura operacional.",
      posicao: "A tese: não vender só comunicação condominial, e sim gestão + manutenção + execução comprovada, com ticket maior e retenção melhor.",
    },
    {
      tipo: "numeros",
      selo: "Onde estamos",
      titulo: "Base operacional já implantada no backend, painel e app.",
      subtitulo: "Próximo passo: ampliar rede de prestadores e distribuição por administradoras.",
      itens: [
        { valor: "3", rotulo: "frentes integradas: API, painel web e app iOS/Android" },
        { valor: "OS", rotulo: "fluxo completo com cotações, motivo de escolha e evidências" },
        { valor: "Hub", rotulo: "central de operação predial para materiais, contratos e manutenção" },
        { valor: "Mobile", rotulo: "operação em campo com status, cotação e comprovação" },
      ],
    },
    {
      tipo: "pedido",
      selo: "O que buscamos",
      titulo: "Acelerar os primeiros condomínios operando o Guardião 360 completo.",
      itens: [
        { titulo: "Condomínios piloto", texto: "Síndicos e conselhos para validar rotina de manutenção preventiva e aceite de serviço." },
        { titulo: "Administradoras parceiras", texto: "Para escalar implantação em carteira e padronizar operação entre prédios." },
        { titulo: "Prestadores homologados", texto: "Empresas de manutenção para entrar na rede com padrão de execução e garantia." },
      ],
    },
  ],
};
