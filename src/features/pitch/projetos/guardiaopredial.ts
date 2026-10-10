import type { Pitch } from "../tipos";

const T = "/pitch/guardiaopredial";

/** O mesmo roteiro de `guardiaopredial/web/src/app/(pitch)/apresentacao`, com as capturas de `public/screens` de lá. */
export const GUARDIAO_PREDIAL: Pitch = {
  slug: "guardiaopredial",
  nome: "Guardião Predial",
  descricao: "Guardião Predial em onze telas: o problema, o produto, os diferenciais e o modelo de negócio.",
  marca: { primaria: "#0F4C5C", escuro: "#12303A", acento: "#F2A93B", tintaAcento: "#1B1B19" },
  slides: [
    {
      tipo: "capa",
      selo: "Gestão de condomínios",
      titulo: "O prédio inteiro num app, do síndico à portaria.",
      subtitulo: "Um painel para cada pessoa do condomínio, com transparência para quem paga a taxa.",
    },
    {
      tipo: "cartoes",
      dor: true,
      selo: "O problema",
      titulo: "Condomínio ainda roda em planilha, grupo de WhatsApp e caderno de portaria.",
      itens: [
        { titulo: "Síndico", texto: "Cobra, presta contas, agenda reservas e responde moradores em cinco lugares diferentes." },
        { titulo: "Morador", texto: "Paga a taxa sem ver para onde o dinheiro vai e descobre a assembleia pelo elevador." },
        { titulo: "Portaria", texto: "Anota visitante e encomenda no papel; ninguém acha o registro depois." },
        { titulo: "Administradora", texto: "Cuida de dezenas de prédios sem uma visão única do que está atrasado." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "A solução",
      titulo: "Um produto, um início para cada papel.",
      subtitulo: "A mesma base de dados; cada pessoa vê o que precisa fazer hoje. Quem acumula papéis vê um bloco para cada um.",
      itens: [
        { titulo: "Síndico e subsíndico", texto: "Pendências do dia, financeiro, chamados, reservas e assembleias." },
        { titulo: "Morador", texto: "Proprietário, inquilino ou dependente: cobranças, reservas, visitantes e avisos no celular." },
        { titulo: "Conselho", texto: "Acompanha as contas e os comprovantes que a gestão libera." },
        { titulo: "Portaria", texto: "Visitantes por QR, encomendas com foto e livro de ocorrências." },
        { titulo: "Equipe", texto: "Zelador, limpeza e manutenção com escala, chamados e almoxarifado." },
        { titulo: "Administradora", texto: "Carteira de prédios, equipe com papéis e ações em lote." },
      ],
    },
    {
      tipo: "painel",
      selo: "O produto · painel web",
      titulo: "O síndico abre o painel e vê o que resolver agora.",
      principal: { src: `${T}/painel-inicio-sindico.webp`, legenda: "Início do síndico: as três urgências do dia, com o botão que resolve" },
      lado: [
        { src: `${T}/painel-portaria.webp`, legenda: "Portaria: visitantes e encomendas" },
        { src: `${T}/painel-administradora.webp`, legenda: "Administradora: a carteira inteira num lugar" },
      ],
    },
    {
      tipo: "celulares",
      selo: "O produto · app",
      titulo: "O morador e a portaria resolvem pelo celular.",
      telas: [
        { src: `${T}/app-morador-inicio.webp`, legenda: "Início do morador" },
        { src: `${T}/app-morador-financeiro.webp`, legenda: "Cobranças e transparência" },
        { src: `${T}/app-morador-chamados.webp`, legenda: "Chamados com fotos" },
        { src: `${T}/app-morador-reservas.webp`, legenda: "Reservas de espaços" },
        { src: `${T}/app-portaria.webp`, legenda: "Console da portaria" },
      ],
    },
    {
      tipo: "cartoes",
      selo: "Diferenciais",
      titulo: "O que é difícil de copiar.",
      itens: [
        { titulo: "Transparência configurável", texto: "Saldo do mês, fundo de reserva e despesas com comprovante; o síndico escolhe quem vê o quê." },
        { titulo: "Modular de verdade", texto: "Cada módulo pode ser oculto, só leitura ou liberado, por prédio e por morador. Toda tela funciona com qualquer combinação." },
        { titulo: "Vínculo decide o direito", texto: "Proprietário, inquilino e dependente são separados: quem vota, quem assina e quem só acompanha." },
        { titulo: "Assembleia completa", texto: "Edital, procurações, presença com fração ideal, voto ponderado e ata publicada." },
        { titulo: "Portaria sem papel", texto: "Passe do visitante com código e QR, busca por placa, encomenda com foto." },
        { titulo: "LGPD desde o início", texto: "Fotos por link temporário, exportação e exclusão de dados, auditoria." },
      ],
    },
    {
      tipo: "cartoes",
      selo: "Modelo de negócio",
      titulo: "Assinatura recorrente e um marketplace para quem cuida do prédio.",
      itens: [
        {
          titulo: "Assinaturas",
          texto: "Preço por unidade, como o mercado cobra: Gratuito até 20 unidades, Essencial a R$ 2,90 e Completo a R$ 4,90 por unidade, e desconto por volume para administradoras. 30 dias de teste.",
        },
        {
          titulo: "Compras e serviços",
          texto: "Fornecedores de insumos e manutenção (extintores, elevadores, limpeza) aparecem quando o prédio precisa: o vencimento do extintor ou o estoque baixo vira pedido de orçamento. Listado, destaque, exclusivo na região ou lead por orçamento.",
        },
      ],
    },
    {
      tipo: "planos",
      selo: "Modelo de negócio",
      titulo: "Planos hoje.",
      planos: [
        {
          nome: "Gratuito",
          preco: "R$ 0",
          unidade: "até 20 unidades",
          resumo: "Para organizar o prédio pequeno, sem custo.",
          itens: ["Cobranças com 2ª via e Pix no app", "Encomendas e visitantes na portaria", "Avisos, documentos, chamados e votações"],
        },
        {
          nome: "Essencial",
          preco: "R$ 2,90",
          unidade: "por unidade/mês · mínimo R$ 89",
          resumo: "Para o prédio que quer o dia a dia no app.",
          itens: ["Reservas com taxa, termo e lista de espera", "Receitas, despesas e saldo do mês", "Conciliação bancária por OFX"],
        },
        {
          nome: "Completo",
          preco: "R$ 4,90",
          unidade: "por unidade/mês · mínimo R$ 149",
          resumo: "Para o síndico que quer o prédio inteiro no app.",
          itens: ["Prestação de contas do mês em PDF", "Almoxarifado com QR, validades e inspeções", "Equipe e escalas: 12x36, folgas e coberturas"],
          recomendado: true,
        },
        {
          nome: "Administradora",
          preco: "R$ 4,90",
          unidade: "por unidade/mês · mínimo R$ 499",
          resumo: "Para administradoras com carteira de prédios.",
          itens: ["Visão da carteira num lugar", "Equipe com papéis", "Cobranças e avisos em lote"],
        },
      ],
      nota: "Administradora: R$ 3,90 a partir de 1.000 unidades e R$ 2,90 a partir de 5.000. 30 dias de teste nos planos pagos.",
    },
    {
      tipo: "comparacao",
      selo: "Mercado",
      titulo: "Os concorrentes cobram por unidade ou por prédio, e não publicam tabela.",
      colunas: ["Concorrente", "Faixa estimada"],
      linhas: [
        ["Superlógica", "R$ 5–12 por unidade/mês"],
        ["Townsq", "R$ 3–8 por unidade/mês"],
        ["Group Software", "R$ 4–10 por unidade/mês"],
        ["uCondo", "R$ 99–299 por condomínio"],
        ["Condomob", "R$ 149–399 por condomínio"],
      ],
      nota: "Estimativas de blogs e comparadores, consultadas em outubro de 2026. Nenhum fornecedor publica preço.",
      posicao: "Nosso preço: de R$ 2,90 a R$ 4,90 por unidade, abaixo das faixas do mercado, com um plano gratuito em que o morador já paga a taxa e retira encomendas pelo app.",
    },
    {
      tipo: "numeros",
      selo: "Onde estamos",
      titulo: "Produto pronto nas três frentes.",
      subtitulo: "Primeiros parceiros do marketplace: manutenção de extintores e de elevadores.",
      itens: [
        { valor: "3", rotulo: "frentes prontas: API, painel web e app iOS/Android" },
        { valor: "19", rotulo: "módulos, do financeiro à portaria" },
        { valor: "8+", rotulo: "papéis com início próprio, acumuláveis" },
        { valor: "56", rotulo: "logins de cenário testados automaticamente toda noite" },
      ],
    },
    {
      tipo: "pedido",
      selo: "O que buscamos",
      titulo: "Vamos colocar o Guardião Predial nos primeiros prédios.",
      itens: [
        { titulo: "Prédios piloto", texto: "Síndicos que queiram usar sem custo e dizer o que falta." },
        { titulo: "Administradoras parceiras", texto: "Para levar a carteira e moldar a visão de portfólio." },
        { titulo: "Fornecedores", texto: "Insumos e manutenção para o marketplace de Compras e serviços." },
      ],
    },
  ],
};
