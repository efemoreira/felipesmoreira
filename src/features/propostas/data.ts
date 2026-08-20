import type { Compromisso } from "./tipos";

/**
 * Conteúdo de "Retomar para Reconstruir" — plano de governo da chapa
 * Delegado Huggo Leonardo (governador) · Felipe Moreira (vice), Partido Missão.
 *
 * Fonte única: o documento de 50 páginas. Cada número aqui tem página, e nenhum
 * foi arredondado nem "melhorado" — se o plano diz R$ 12,3 a 20,3 milhões, é
 * isso que entra. Ao atualizar o plano, atualize aqui **e confira a página**:
 * número sem página é exatamente o que a Parte 0 do manual proíbe.
 */

export const CHAPA = {
  governador: "Delegado Huggo Leonardo",
  vice: "Felipe Moreira",
  partido: "Missão",
  documento: "Retomar para Reconstruir",
  paginas: 50,
  lema: "Retomar para Reconstruir",
};

/** A tese, em uma frase — abre a página e fecha o argumento. */
export const TESE =
  "O Estado perdeu território: para as facções nas periferias, para o atraso no interior, " +
  "para a dependência que aprisiona famílias. A recuperação tem uma ordem obrigatória, e ela " +
  "está no nome. Primeiro retomar, depois reconstruir.";

export const METODO_FRASE =
  "Liberal no método, social no resultado: eficiência, avaliação por indicador e captação " +
  "privada como meios; renda, segurança e emancipação como fins.";

/** Os cinco princípios herdados do plano nacional do partido (p. 4). */
export const PRINCIPIOS: string[] = [
  "Ciclo completo de polícia",
  "Industrialização do agro",
  "Desfavelização com lei e ordem",
  "Fim do assistencialismo por meio da tecnologia",
  "Força para proteger o que é nosso",
];

/**
 * As seis perguntas que todo compromisso responde (p. 5). É a estrutura do
 * documento, e por isso é a estrutura desta página.
 */
export const SEIS_PERGUNTAS: string[] = [
  "O que está em jogo",
  "Onde queremos chegar",
  "O que vamos fazer",
  "De onde vem o recurso",
  "Quando entrega",
  "Como você cobra",
];

export const compromissos: Compromisso[] = [
  {
    numero: 1,
    id: "ceara-seguro",
    icone: "sword",
    movimento: "retomar",
    titulo: "Ceará Seguro",
    emJogo:
      "O comando do crime é emanado de dentro do sistema prisional. Enquanto quem prende e " +
      "quem administra a prisão respondem a chefes diferentes, a facção conversa entre os dois " +
      "lados da grade. E facção não respeita fronteira de estado — a polícia respeita.",
    propostas: [
      {
        titulo: "Secretaria única de segurança e sistema prisional",
        texto:
          "Fundir a SSPDS com a administração penitenciária numa secretaria só, com inteligência " +
          "policial e prisional sob o mesmo comando. Hoje há de 80 a 120 cargos comissionados " +
          "duplicados entre as duas, sustentando burocracia e não atividade-fim.",
        pagina: "p. 13–14",
      },
      {
        titulo: "Polícia Penal com lei orgânica e autonomia",
        texto:
          "Elevar a Polícia Penal a órgão autônomo, com comando e orçamento próprios, equiparada " +
          "à Polícia Militar e à Civil. São cerca de 3.700 agentes — a única força estadual que " +
          "ainda não tem lei orgânica.",
        pagina: "p. 14",
      },
      {
        titulo: "Corregedorias próprias e Ouvidoria Geral",
        texto:
          "Substituir o controle disciplinar centralizado por corregedorias autônomas em cada " +
          "corporação, que entendem a especificidade técnica de cada função — criando junto uma " +
          "Ouvidoria Geral de Segurança ligada ao gabinete do Governador, para preservar o " +
          "controle social.",
        pagina: "p. 14",
      },
      {
        titulo: "Equipamento, tecnologia e inteligência para as forças",
        texto:
          "Equipar, treinar e prover tecnologia de monitoramento e integração de dados, custeado " +
          "pela economia da própria reorganização e reinvestido integralmente. Vale também para " +
          "a Polícia Civil e a Militar no interior.",
        pagina: "p. 14",
      },
      {
        titulo: "ARCO CE-RJ-ES: inteligência entre três estados",
        texto:
          "Uma agência de inteligência e repressão ao crime organizado em parceria com Rio de " +
          "Janeiro e Espírito Santo, para enfrentar as franquias criminosas que operam através " +
          "das fronteiras. Gabinetes de crise 24 horas em Fortaleza, Rio e Vitória, com " +
          "espelhamento de dados e foco em neutralizar ordens emitidas de dentro do presídio.",
        pagina: "p. 14–15",
      },
      {
        titulo: "Presídio de segurança máxima para lideranças",
        texto:
          "Unidade voltada à segregação de lideranças e integrantes de organizações criminosas, " +
          "em concreto pré-moldado, com obra em três frentes simultâneas e ocupação escalonada. " +
          "Acompanha o retrofit da triagem de Itaitinga e o treinamento de 6 mil policiais penais.",
        pagina: "p. 15",
      },
    ],
    metas: [
      { numero: "R$ 12,3 a 20,3 mi", oQue: "economia anual da reorganização, reinvestida na ponta", pagina: "p. 15" },
      { numero: "365 dias", oQue: "prazo de entrega do presídio de segurança máxima", pagina: "p. 15" },
      { numero: "3.700", oQue: "agentes da Polícia Penal que ganham lei orgânica", pagina: "p. 13" },
      { numero: "6 mil", oQue: "policiais penais treinados", pagina: "p. 15" },
    ],
    recurso: [
      "Economia da fusão e da reorganização: R$ 12,3 a 20,3 milhões/ano, reinvestidos integralmente (p. 15)",
      "FUNPEN — saldo estimado de R$ 668,67 milhões para novas contratações em 2026 (p. 15)",
      "Contrapartida estadual de 5% e emendas de bancada (p. 15)",
      "Função Segurança na LOA 2026: R$ 5,822 bilhões, a 3ª maior do orçamento (p. 13)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "Projeto de lei da reorganização enviado à Assembleia" },
      { quando: "1º ano", entrega: "Equipamento e tecnologia na ponta; presídio entregue" },
      { quando: "Mandato", entrega: "ARCO em operação nos três estados" },
    ],
    paginas: "p. 13–16",
  },

  {
    numero: 2,
    id: "periferia-com-estado",
    icone: "home",
    movimento: "retomar",
    titulo: "Periferia com Estado",
    emJogo:
      "Onde falta esgoto, moradia digna e serviço público, a facção ocupa o vazio. Entre janeiro " +
      "de 2024 e setembro de 2025, 219 famílias foram expulsas de casa por facção no Ceará — o " +
      "passivo acumulado passa de 400. Uma política de periferia feita por secretarias isoladas " +
      "não funciona.",
    propostas: [
      {
        titulo: "GIRT — um comando só para a retomada",
        texto:
          "Gabinete Integrado de Reconstrução Territorial, ligado direto à Casa Civil, comandando " +
          "ao mesmo tempo repressão, jurídico-fundiário, habitação, saneamento, saúde e " +
          "assistência. Sala de situação georreferenciando cada imóvel e cada família sob " +
          "intervenção, em quatro fases: retomada → regularização → reconstrução → reintegração.",
        pagina: "p. 18",
      },
      {
        titulo: "Retomada com garantias constitucionais preservadas",
        texto:
          "O plano rejeita expressamente a suspensão de garantias, a prisão sem mandado e o " +
          "encarceramento em massa. Toda incursão é precedida de mandado judicial específico, o " +
          "que preserva a validade das provas e a individualização das condutas. Presença " +
          "ostensiva permanente, não pontual.",
        pagina: "p. 18",
      },
      {
        titulo: "Resposta em 48 horas para família expulsa",
        texto:
          "Detectado um novo caso de expulsão, o Estado reage imediatamente com assistência " +
          "jurídica, assistência social e investigação policial — impedindo que o domínio " +
          "criminoso sobre o imóvel se consolide.",
        pagina: "p. 18",
      },
      {
        titulo: "Minha Casa de Volta",
        texto:
          "Reforma emergencial dos imóveis depredados, devolvendo a casa em condição de uso, com " +
          "urbanismo tático — iluminação, praça, câmera — para dificultar a reocupação pelo " +
          "próprio desenho do espaço.",
        pagina: "p. 18",
      },
      {
        titulo: "Esgoto para 745 mil famílias do CadÚnico",
        texto:
          "A rede passa na rua e a família não tem como pagar a ligação de dentro de casa. O " +
          "Estado financia essa ligação com orçamento de saúde preventiva, porque cada real " +
          "investido em esgoto economiza quatro em hospital.",
        pagina: "p. 18",
      },
      {
        titulo: "Título de propriedade e moradia definitiva",
        texto:
          "Regularização fundiária com entrega de título — o passo que converte posse precária em " +
          "patrimônio — e prioridade nas listas dos próximos conjuntos habitacionais para as " +
          "famílias em déficit habitacional real.",
        pagina: "p. 19",
      },
    ],
    metas: [
      { numero: "−90%", oQue: "em novos casos de deslocamento forçado, em 24 meses", pagina: "p. 21" },
      { numero: "745 mil", oQue: "famílias com ligação de esgoto financiada em 7 anos", pagina: "p. 20" },
      { numero: "400 mil", oQue: "residências ligadas já no primeiro mandato", pagina: "p. 20" },
      { numero: "100%", oQue: "dos imóveis retomados pelo GIRT, reformados", pagina: "p. 20" },
      { numero: "234 mil", oQue: "unidades de déficit habitacional a enfrentar", pagina: "p. 17" },
    ],
    recurso: [
      "GIRT: R$ 225 milhões em 4 anos — R$ 25 mi de choque, R$ 40 mi de consolidação, R$ 100 mi de reconstrução, R$ 60 mi de sustentabilidade (p. 20)",
      "Esgoto: R$ 1,49 bilhão em 7 anos, por redimensionamento de R$ 213 milhões/ano do orçamento de saúde preventiva (p. 18)",
      "Retorno projetado de R$ 5,96 bilhões em gastos hospitalares evitados, pela relação 1:4 do Trata Brasil (p. 18)",
      "Habitação: convênio federal, PAC e Minha Casa Minha Vida (p. 18–19)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "GIRT criado por decreto e em operação" },
      { quando: "1º ano", entrega: "Protocolo de 48h rodando; primeiras comunidades retomadas" },
      { quando: "Mandato", entrega: "400 mil residências com esgoto ligado" },
    ],
    paginas: "p. 17–21",
  },

  {
    numero: 3,
    id: "interior-que-produz",
    icone: "tree",
    movimento: "reconstruir",
    titulo: "Interior que Produz",
    emJogo:
      "75,5% dos estabelecimentos agrícolas do Ceará são familiares, e eles respondem por apenas " +
      "39,6% do valor da produção. O que a nossa terra produz sai do estado sem ser transformado. " +
      "E o carro-pipa mantém famílias reféns de gestor local, virando moeda política em ano de " +
      "eleição.",
    propostas: [
      {
        titulo: "Merenda escolar como política de renda",
        texto:
          "Elevar e desburocratizar a compra pública da agricultura familiar acima do piso de 45% " +
          "previsto em lei, com chamada pública simplificada. A merenda escolar não é só despesa: " +
          "é a maior política de renda e de circulação de dinheiro dentro do próprio município, e " +
          "dá ao agricultor um calendário de safra previsível.",
        pagina: "p. 23",
      },
      {
        titulo: "Leve Poços — autonomia hídrica do semiárido",
        texto:
          "O Estado financia integralmente a perfuração e a instalação de poços autossustentáveis " +
          "nas zonas rurais mais vulneráveis, e a gestão fica com a própria comunidade. Acompanha " +
          "a Escola do Campo, que ensina a transformar água em irrigação e renda, e monitoramento " +
          "para reduzir o carro-pipa a emergência extrema.",
        pagina: "p. 23",
      },
      {
        titulo: "Agro Indústria Ceará",
        texto:
          "Linha de crédito e incentivo exclusivos para quem processa e industrializa a produção " +
          "agrícola no próprio município que produziu. O que a nossa terra produz, a nossa " +
          "indústria transforma.",
        pagina: "p. 23",
      },
      {
        titulo: "Rede de agroindústrias familiares e selo próprio",
        texto:
          "Unidades de beneficiamento compartilhadas, Selo Ceará da Agricultura Familiar " +
          "Sustentável e simplificação sanitária proporcional ao risco — o caminho da " +
          "informalidade para o mercado formal.",
        pagina: "p. 23",
      },
      {
        titulo: "Logística que escoa",
        texto:
          "Centros regionais de distribuição com armazém e câmara fria, plataforma digital de " +
          "comercialização e plano de estradas vicinais.",
        pagina: "p. 24",
      },
      {
        titulo: "Juventude e mulher rural",
        texto:
          "Fundo Estadual de Microcrédito Rural Orientado, Programa Mulheres Rurais do Ceará e " +
          "Jovem do Campo Empreendedor, com plano de negócio real, conectividade e mecanização " +
          "acessível — para fixar quem hoje sai.",
        pagina: "p. 24",
      },
    ],
    metas: [
      { numero: "+20%", oQue: "de instalação de indústrias no interior", pagina: "p. 23" },
      { numero: "acima de 45%", oQue: "da merenda comprada da agricultura familiar", pagina: "p. 22–23" },
      { numero: "R$ 590 mi", oQue: "já captados via Projeto Paulo Freire II (€ 92 milhões)", pagina: "p. 25" },
    ],
    recurso: [
      "Fundo de Desenvolvimento Industrial e incentivo fiscal estadual (p. 23)",
      "Pronaf Agroindústria — crédito orientado para a transição ao mercado formal (p. 23)",
      "Captação internacional já realizada: Projeto Paulo Freire II, € 92 milhões / R$ 590 milhões (p. 25)",
      "Orçamento da Secretaria de Recursos Hídricos e da SDA, com convênios federais (p. 23)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "Chamada pública simplificada da merenda publicada" },
      { quando: "1º ano", entrega: "Primeiros poços do Leve Poços entregues às comunidades" },
      { quando: "Mandato", entrega: "Rede de agroindústrias e centros de distribuição em operação" },
    ],
    paginas: "p. 22–26",
  },

  {
    numero: 4,
    id: "escola-que-forma",
    icone: "book",
    movimento: "reconstruir",
    titulo: "Escola que Forma para a Vida",
    emJogo:
      "O Ceará tem a 3ª melhor média de Ensino Médio do Brasil e mesmo assim ficou abaixo da meta " +
      "do IDEB. Passar de ano não basta: tem que aprender. E sem perspectiva no próprio " +
      "território, a escola vira rota de fuga do interior.",
    propostas: [
      {
        titulo: "Recomposição de aprendizagens",
        texto:
          "Ciclos bimestrais de intervenção nas lacunas críticas, com professor mentor e avaliação " +
          "formativa contínua — atacando a distância entre a aprovação e a aprendizagem de fato.",
        pagina: "p. 27",
      },
      {
        titulo: "Ceará Cívico",
        texto:
          "Componente na parte diversificada do currículo: ética e cidadania, liderança e projeto " +
          "de vida, primeiros socorros e educação para o trânsito, organização e disciplina " +
          "consciente. O plano diz expressamente o que isso não é: não é militarização da gestão " +
          "escolar, não substitui normas por regulamento militar, não é disciplina como punição e " +
          "não é doutrinação. Autonomia pedagógica 100% preservada, sob comando da SEDUC, e " +
          "expansão só com aprovação do Conselho Escolar.",
        pagina: "p. 27–28",
      },
      {
        titulo: "Saúde mental nas escolas",
        texto:
          "Psicólogos regionais acompanhando polos de escolas — tirando o diagnóstico clínico das " +
          "costas do professor — com fluxo direto entre escola, saúde e assistência social.",
        pagina: "p. 28",
      },
      {
        titulo: "Ensino técnico com a cara de cada região",
        texto:
          "Revisar o portfólio das 133 escolas profissionais para alinhá-lo à vocação econômica de " +
          "cada município, com trilhas territoriais: escola técnica rural, energias renováveis, " +
          "logística, turismo.",
        pagina: "p. 28",
      },
      {
        titulo: "Pré-vestibular estadual e ponte de permanência",
        texto:
          "Aulões regionais, plataforma e simulados, mais mentoria no primeiro ano do ensino " +
          "superior ou técnico — porque a evasão acontece na travessia.",
        pagina: "p. 28",
      },
      {
        titulo: "Escola Conectada e valorização do professor",
        texto:
          "Internet de alta velocidade e laboratório nas escolas mais remotas, bolsa de alto " +
          "desempenho para o aluno e gratificação por desempenho com bolsa-formação para o " +
          "docente, incluindo pós-graduação.",
        pagina: "p. 28",
      },
    ],
    metas: [
      { numero: "5,2", oQue: "meta do IDEB no Ensino Médio", pagina: "p. 29" },
      { numero: "133", oQue: "escolas profissionais com portfólio revisto por vocação regional", pagina: "p. 27" },
      { numero: "zerar", oQue: "o gap de infraestrutura das escolas do interior frente à capital", pagina: "p. 29" },
      { numero: "8,9 → 6,5", oQue: "mortalidade por suicídio por 100 mil, até 2030", pagina: "p. 32" },
    ],
    recurso: [
      "Orçamento da SEDUC e Fundeb (p. 29)",
      "Parcerias com Adece, Sistema S e cooperativas para as trilhas técnicas (p. 28)",
      "Gratificação docente desenhada como bônus por indicador, sem habitualidade — não incorpora à remuneração (p. 29)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "Edital do pré-vestibular estadual publicado" },
      { quando: "1º ano", entrega: "Ceará Cívico em piloto, com avaliação de clima escolar" },
      { quando: "Mandato", entrega: "Escola Conectada em todas as escolas remotas" },
    ],
    paginas: "p. 27–30",
  },

  {
    numero: 5,
    id: "saude-que-chega",
    icone: "heartHandshake",
    movimento: "reconstruir",
    titulo: "Saúde que Chega na Hora",
    emJogo:
      "Em fevereiro de 2026 havia 64 mil pessoas esperando regulação no Ceará, e o Instituto José " +
      "Frota operava sistematicamente acima de 100% da capacidade. A alta complexidade está " +
      "concentrada na capital, e quem mora longe espera mais.",
    propostas: [
      {
        titulo: "Central de Regulação Única com painel público",
        texto:
          "Uma fila só, estadual e municipal unificadas, com painel público em tempo real e tempo " +
          "máximo de espera definido por procedimento — 90 dias para catarata, por exemplo. Fila " +
          "com número público é a promessa mais difícil de descumprir em silêncio.",
        pagina: "p. 33",
      },
      {
        titulo: "Meta Zero Macas em corredor",
        texto:
          "Central de leitos em tempo real, unificação do SAMU estadual com o de Fortaleza, " +
          "telemedicina em 100% das ambulâncias e ampliação da Casa de Cuidados para 300 leitos de " +
          "transição. Nenhuma maca em corredor por mais de 24 horas.",
        pagina: "p. 33",
      },
      {
        titulo: "Hospital Infantil Albert Sabin 2, em Iguatu",
        texto:
          "Unidade de alta complexidade pediátrica com 150 leitos, no mesmo padrão do HIAS de " +
          "Fortaleza, atendendo o Centro-Sul e o Cariri.",
        pagina: "p. 33",
      },
      {
        titulo: "Rede materno-infantil",
        texto:
          "Gestante vinculada à maternidade de referência já na primeira consulta, teste rápido de " +
          "sífilis e HIV em 100% das unidades básicas e Método Canguru nos hospitais regionais.",
        pagina: "p. 32",
      },
      {
        titulo: "Interiorização da alta complexidade",
        texto:
          "Concluir os hospitais do Maciço de Baturité e do Centro-Sul e o Hospital Universitário " +
          "da UECE; ampliar UTI nos cinco hospitais regionais; oncologia e neurocirurgia em todas " +
          "as regiões.",
        pagina: "p. 33",
      },
      {
        titulo: "Fixar especialista no interior",
        texto:
          "Bolsa de fixação para especialistas e ampliação das residências para 2.000 vagas — " +
          "quem forma no interior tende a ficar.",
        pagina: "p. 33",
      },
    ],
    metas: [
      { numero: "−70%", oQue: "na fila histórica de regulação", pagina: "p. 35" },
      { numero: "10,1 → 8,5", oQue: "mortalidade infantil por mil nascidos vivos, até 2030", pagina: "p. 32" },
      { numero: "62% → 85%", oQue: "cobertura de agente comunitário de saúde, até 2030", pagina: "p. 32" },
      { numero: "17,5% → 13%", oQue: "internações que a atenção primária deveria ter evitado", pagina: "p. 32" },
      { numero: "2.000", oQue: "vagas de residência médica", pagina: "p. 33" },
      { numero: "150 leitos", oQue: "no HIAS 2 de Iguatu, R$ 260 milhões", pagina: "p. 33" },
    ],
    recurso: [
      "Complementação estadual do teto federal de Média e Alta Complexidade, indexada ao IPCA-Saúde — indexar é a diferença entre repor e apenas anunciar (p. 32)",
      "HIAS 2: emendas de bancada R$ 100 mi, emendas individuais R$ 60 mi, Ministério da Saúde/Novo PAC R$ 50 mi, Tesouro estadual R$ 50 mi (p. 33)",
      "Custeio anual do HIAS 2: tabela SUS R$ 60 mi, Fundo Estadual de Saúde R$ 50 mi, emendas impositivas R$ 30 mi, economia da reforma administrativa R$ 18 mi (p. 33)",
      "Linha de crédito do BNDES para infraestrutura hospitalar e captação do PAC Saúde (p. 32)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "Leitos de retaguarda em UPAs e filantrópicos; lei de complementação enviada" },
      { quando: "1º ano", entrega: "Central de Regulação Única com painel público no ar" },
      { quando: "Mandato", entrega: "HIAS 2 e hospitais regionais concluídos" },
    ],
    paginas: "p. 31–35",
  },

  {
    numero: 6,
    id: "familias-livres",
    icone: "users",
    movimento: "reconstruir",
    titulo: "Famílias Livres",
    emJogo:
      "Programa social sem porta de saída é curral eleitoral. O êxito de um programa social se " +
      "mede pelo número de famílias que deixam de precisar dele — e ninguém mede isso hoje.",
    propostas: [
      {
        titulo: "Porta de Saída",
        texto:
          "Um sistema que cruza a base social com as capacidades da pessoa e as vagas realmente " +
          "abertas, para desenhar uma saída para cada família: curso técnico, letramento digital e " +
          "emprego mapeado. O benefício deixa de ser destino e passa a ser etapa. Acompanha cada " +
          "entrega habitacional da retomada das periferias.",
        pagina: "p. 36",
      },
      {
        titulo: "Taxa de Emancipação Social",
        texto:
          "O indicador central do compromisso: quantas famílias deixaram de depender de programa " +
          "por passarem a ter renda própria. É por esse número que o governo pede para ser " +
          "julgado nesta área.",
        pagina: "p. 36",
      },
      {
        titulo: "Casas da Mulher Cearense: de 7 para 14",
        texto:
          "Dobrar a rede de atendimento especializado à mulher vítima de violência no interior, " +
          "com unidades novas em Iguatu, Crateús, Tauá, Camocim, Icó, Brejo Santo e Baturité — e " +
          "com o objetivo declarado de inserir a mulher no mercado de trabalho, porque autonomia " +
          "financeira é saída da violência.",
        pagina: "p. 36",
      },
    ],
    metas: [
      { numero: "7 → 14", oQue: "Casas da Mulher Cearense, sete cidades nomeadas", pagina: "p. 36" },
      { numero: "R$ 42 mi", oQue: "investimento na construção das 7 novas unidades", pagina: "p. 36" },
      { numero: "R$ 8,2 mi/ano", oQue: "manutenção das 14 unidades, já custeada", pagina: "p. 36" },
    ],
    recurso: [
      "Casas da Mulher financiadas pela economia da reforma administrativa: R$ 32,8 milhões/ano recorrentes (p. 45)",
      "Porta de Saída: integração das bases estaduais já existentes e convênios com empresas, de custo marginal baixo (p. 37)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "Integração das bases e primeiro cruzamento de dados" },
      { quando: "1º ano", entrega: "Porta de Saída rodando nas comunidades retomadas" },
      { quando: "Mandato", entrega: "14 Casas da Mulher em funcionamento" },
    ],
    paginas: "p. 36–38",
  },

  {
    numero: 7,
    id: "base-do-desenvolvimento",
    icone: "bolt",
    movimento: "reconstruir",
    titulo: "Base do Desenvolvimento",
    emJogo:
      "Metade da água tratada se perde antes de chegar na torneira. Um terço das estradas " +
      "estaduais não é pavimentado. Há cerca de R$ 900 milhões de investimento parados numa fila " +
      "de licenciamento no Pecém, e parques eólicos prontos sem linha para escoar energia.",
    propostas: [
      {
        titulo: "Cortar as perdas de água de 45% para 25%",
        texto:
          "Setorização intensiva e telemetria, reduzindo 5% ao ano. Dos 248 milhões de metros " +
          "cúbicos perdidos por ano, a meta recupera 110 milhões.",
        pagina: "p. 39",
      },
      {
        titulo: "Voucher Água, pago pela água recuperada",
        texto:
          "Subsídio de 10 m³ por mês para as famílias do CadÚnico, autofinanciado pela redução das " +
          "perdas — o benefício sai da perda recuperada, não de despesa nova. É o liberal no " +
          "método e social no resultado, com número.",
        pagina: "p. 39",
      },
      {
        titulo: "Abertura de capital da Cagece com Golden Share",
        texto:
          "Captar recursos para universalizar o saneamento sem endividar o Estado, mantendo o " +
          "controle acionário e uma Golden Share com poder de veto sobre mudança de objeto social, " +
          "fusão, cisão e — principalmente — sobre qualquer redução das metas de universalização. " +
          "O desenho protege a universalização contra o próprio acionista privado.",
        pagina: "p. 40–41",
      },
      {
        titulo: "Auditoria das PPPs de esgoto",
        texto:
          "Reanálise e fiscalização dos contratos já assinados e dos que estão em estruturação, " +
          "priorizando as comunidades retomadas. É fiscalização de execução, não ruptura de " +
          "contrato.",
        pagina: "p. 40",
      },
      {
        titulo: "Destravar o Pecém e a cadeia de energia",
        texto:
          "Força-tarefa sobre as licenças ambientais e as obras do Berço 11, restauração da " +
          "CE-085, interlocução com Brasília pela Transnordestina e pelos 1.400 km de linhas de " +
          "transmissão pendentes, e programa de retomada da cadeia eólica.",
        pagina: "p. 40",
      },
      {
        titulo: "Metrô, mobilidade e estradas",
        texto:
          "Concluir a Linha Leste do Metrô, ampliar a integração tarifária na Região " +
          "Metropolitana e manter o FORtaleCE para requalificação asfáltica e drenagem urbana.",
        pagina: "p. 40",
      },
    ],
    metas: [
      { numero: "45% → 25%", oQue: "perdas de água na rede, caindo 5% ao ano", pagina: "p. 39" },
      { numero: "916.667", oQue: "famílias atendidas pelo Voucher Água", pagina: "p. 39" },
      { numero: "R$ 550 mi/ano", oQue: "receita recuperada que paga o Voucher", pagina: "p. 39" },
      { numero: "R$ 13,2 bi", oQue: "em contratos de PPP de esgoto sob auditoria", pagina: "p. 40" },
      { numero: "3.640 km", oQue: "de déficit de pavimentação, em malha de 11.669 km", pagina: "p. 39" },
    ],
    recurso: [
      "Voucher Água autofinanciado pela redução de perdas: R$ 550 milhões/ano de receita recuperada (p. 39)",
      "Abertura de capital da Cagece: captação estimada de R$ 1,89 bilhão, sem endividar o Estado (p. 41)",
      "FORtaleCE: R$ 170 milhões para requalificação asfáltica e drenagem (p. 40)",
      "Carteira de hidrogênio verde de R$ 74,4 bilhões a destravar (p. 39)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "Auditoria das PPPs iniciada; força-tarefa do Pecém instalada" },
      { quando: "1º ano", entrega: "Telemetria instalada; primeira queda de 5% nas perdas" },
      { quando: "Mandato", entrega: "Perdas em 25%, Voucher Água universalizado no CadÚnico" },
    ],
    paginas: "p. 39–42",
  },

  {
    numero: 8,
    id: "o-metodo",
    icone: "microscope",
    movimento: "metodo",
    titulo: "O Método: como você cobra",
    emJogo:
      "Palavra de político, sozinha, não vale nada — e quem diz o contrário está mentindo. Um " +
      "plano só é promessa se não puder ser conferido. Este compromisso é a estrutura que " +
      "transforma os outros sete em algo cobrável.",
    propostas: [
      {
        titulo: "Painel público com todas as metas deste plano",
        texto:
          "Um painel aberto ao cidadão, atualizado, com cada meta registrada aqui — e prestação de " +
          "contas periódica sobre o cumprimento dos compromissos. Sem o painel, 'me cobre este " +
          "plano' é retórica; com ele, é método.",
        pagina: "p. 48",
      },
      {
        titulo: "Raio-X do Dinheiro Público Cearense",
        texto:
          "Plataforma de transparência em tempo real rastreando despesa com fornecedor e repasse, " +
          "cruzando o orçamento estadual e o municipal com as ações legislativas — para que dê " +
          "para ver a relação entre emenda, fornecedor e voto.",
        pagina: "p. 43",
      },
      {
        titulo: "Reforma administrativa com economia carimbada",
        texto:
          "Reduzir a administração direta de 35 para 28 órgãos, cortando sobreposição e cargo " +
          "comissionado de cúpula duplicado. A economia não some no caixa: vai carimbada para a " +
          "manutenção das 14 Casas da Mulher e parte do custeio do HIAS 2.",
        pagina: "p. 43–45",
      },
      {
        titulo: "Gestão por resultados",
        texto:
          "Avaliação permanente de política pública por indicador, com apoio do IPECE e da SEPLAG, " +
          "integração das bases estaduais e vinculação expressa à Lei de Responsabilidade Fiscal, " +
          "com as propostas conectadas ao PPA, à LDO e à LOA do governo.",
        pagina: "p. 43–44",
      },
    ],
    metas: [
      { numero: "35 → 28", oQue: "órgãos da administração direta, cerca de 20% da cúpula", pagina: "p. 43" },
      { numero: "R$ 32,8 mi/ano", oQue: "economia recorrente, carimbada para saúde e Casas da Mulher", pagina: "p. 45" },
      { numero: "R$ 6,57 mi/ano", oQue: "superávit da reforma depois de pagas as destinações", pagina: "p. 45" },
    ],
    recurso: [
      "A reforma administrativa se paga e ainda financia: R$ 32,8 milhões/ano recorrentes, com destino nomeado (p. 45)",
      "Painel público e Raio-X são decreto e sistema — custo baixo, sem depender da Assembleia (p. 43, 48)",
    ],
    prazos: [
      { quando: "100 dias", entrega: "Painel público de indicadores no ar" },
      { quando: "1º ano", entrega: "Raio-X do Dinheiro Público em operação" },
      { quando: "Mandato", entrega: "Prestação de contas periódica de todos os compromissos" },
    ],
    paginas: "p. 43–48",
  },
];

/**
 * Frases da carta de abertura. Ficam no fim da página porque é ali que a pessoa
 * decide se confia — e a carta é o único trecho em que o candidato fala em
 * primeira pessoa.
 */
export const CITACOES: { texto: string; pagina: string }[] = [
  {
    texto:
      "Este documento foi escrito para ser cobrado. Cada compromisso registrado aqui diz o que " +
      "será feito, como será medido e quando será entregue.",
    pagina: "p. 2",
  },
  {
    texto:
      "Meu pedido é outro: leiam este plano, guardem este plano e me cobrem este plano. Se eu " +
      "cumprir, renove sua confiança. Se eu não cumprir, coloque o dedo na minha cara e use este " +
      "mesmo documento contra mim.",
    pagina: "p. 2",
  },
  {
    texto:
      "Favela não se resolve com muro nem com discurso: resolve-se retomando o território das " +
      "facções e entrando logo atrás com saneamento, saúde, habitação e infraestrutura. Primeiro " +
      "o Estado expulsa o crime. Depois o Estado fica.",
    pagina: "p. 4",
  },
  {
    texto: "Missão é o que se aceita quando o trabalho é maior que o cargo.",
    pagina: "p. 4",
  },
];
