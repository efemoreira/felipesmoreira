import type { Secao } from "./PaginaLegal";

/** O texto de /privacy. Saiu da page em 12/09: conteúdo mora em features/. */
export const titulo = "Política de Privacidade";
export const resumo = "Em resumo: a gente só coleta o que você mesmo digita — no formulário “Quero ajudar” ou na lista de presença de um encontro —, usa isso só para organizar a militância, não compartilha com ninguém de fora, e apaga quando você pedir.";
export const atualizadoEm = "21 de outubro de 2026";

export const secoes: Secao[] = [
  {
    titulo: "Quem é o responsável pelos seus dados",
    blocos: [
      "Este site é de Felipe Moreira, e os dados coletados aqui são tratados pela coordenação da Missão Ceará. Somos nós que decidimos o que é guardado e para quê — em linguagem de lei, somos o controlador dos dados.",
      "Para falar sobre seus dados, chame no WhatsApp (85) 98187-2972 — é o nosso canal de contato. A mesma pessoa que cuida da coordenação responde por isso.",
    ],
  },
  {
    titulo: "O que a gente coleta",
    blocos: [
      "Navegar pelo site não exige cadastro nenhum. Existem dois momentos em que a gente pede dado seu, e nos dois é você quem preenche.",
      "No formulário da página “Quero ajudar”, para entrar na militância:",
      [
        "Nome completo — para saber com quem estamos falando.",
        "WhatsApp — é por onde a coordenação entra em contato e envia seu acesso.",
        "Cidade e bairro — para montar os times por região.",
        "E-mail — opcional, só como segunda forma de contato.",
        "Interesses de participação, temas, atividades culturais e contribuições desejadas — opcionais, para planejar as frentes do movimento.",
        "Trabalho ou área de atuação, situação de trabalho e estudo, instituição de ensino, campus, cidade da instituição e curso ou vínculo — opcionais, para identificar pessoas próximas e planejar articulações profissionais e universitárias. Não pedimos o nome do empregador.",
        "Habilidades, experiências, ideias, disponibilidade, períodos e preferência por participação presencial ou on-line — opcionais, para combinar uma contribuição que caiba na sua rotina.",
        "Perfil ou canal que você queira informar e funções desejadas — opcionais. Esse cadastro não publica seu perfil nem te inclui automaticamente na Liga, num núcleo ou grupo.",
      ],
      "Na lista de presença dos encontros, quando você lê o QR da mesa de recepção ou passa seus dados para quem está recebendo:",
      [
        "Nome — para te receber pelo nome.",
        "WhatsApp — para a gente te dar notícia dos próximos encontros.",
        "Bairro — opcional, para saber de onde vem quem participa.",
        "Quem te convidou — opcional, para a gente agradecer a quem trouxe você.",
      ],
      "Não pedimos CPF, RG, data de nascimento, título de eleitor, dados bancários nem qualquer outro documento. Se algum dia isso mudar, este texto muda junto e você é avisado antes.",
    ],
  },
  {
    titulo: "Por que a gente pode guardar isso",
    blocos: [
      "A base legal é o seu consentimento (art. 7º, I da LGPD — Lei 13.709/2018). Ele é dado quando você marca a caixinha no fim do formulário — tanto no “Quero ajudar” quanto na lista de presença dos encontros — e o site registra a data e a versão do texto que você aceitou.",
      "Consentimento é livre: você pode voltar atrás quando quiser, e isso não tem consequência nenhuma além de a gente parar de te chamar.",
    ],
  },
  {
    titulo: "Para que a gente usa",
    blocos: [
      "Seus dados servem só para organizar a militância:",
      [
        "Entrar em contato sobre a sua participação.",
        "Enviar seu usuário e senha de acesso à área da militância.",
        "Mapear interessados por cidade, bairro, instituição, temas e disponibilidade, para construir núcleos, grupos, atividades e equipes. Os agrupamentos são privados e não significam estruturas já funcionando.",
        "Avisar sobre encontros, formações e atividades do movimento.",
        "Depois de um encontro, agradecer sua presença e te chamar para o próximo.",
      ],
      "Nada de propaganda de terceiros, nada de assunto fora do movimento.",
    ],
  },
  {
    titulo: "Com quem a gente compartilha",
    blocos: [
      "Com ninguém de fora. Seus dados não são vendidos, alugados, trocados nem cedidos a outras campanhas, partidos, empresas ou serviços de marketing.",
      "Dentro do movimento, só a coordenação e quem tem acesso liberado no painel administrativo enxerga essas informações. A lista de contatos de um encontro é mais fechada ainda: quem está trabalhando no evento vê os nomes e a presença, mas o telefone completo só aparece para a coordenação e para quem cadastrou aquela pessoa.",
      "A única exceção é uma ordem judicial ou obrigação legal — se isso acontecer, a gente cumpre a lei.",
    ],
  },
  {
    titulo: "Onde os dados ficam",
    blocos: [
      "As informações ficam guardadas no servidor do próprio site, em área protegida por senha e fora do alcance de buscadores. As senhas de acesso são guardadas embaralhadas (hash), então nem a coordenação consegue ler a sua senha — se você esquecer, o caminho é criar uma nova.",
      "O site é servido por HTTPS, ou seja, o que você digita no formulário trafega criptografado até o servidor.",
    ],
  },
  {
    titulo: "Por quanto tempo a gente guarda",
    blocos: [
      "Enquanto você fizer parte da militância, ou até você pedir a exclusão. Inscrições que não viram acesso são apagadas quando deixam de ser úteis para a organização do movimento, e o mesmo vale para a lista de presença de um encontro já realizado.",
      "Pedindo exclusão, a gente apaga — e só guarda o mínimo que a lei exigir, se exigir.",
    ],
  },
  {
    titulo: "Seus direitos",
    blocos: [
      "A LGPD te dá, e a gente respeita, o direito de:",
      [
        "Saber se temos dados seus e quais são.",
        "Pedir cópia deles.",
        "Corrigir o que estiver errado ou desatualizado.",
        "Pedir a exclusão dos seus dados.",
        "Retirar o consentimento a qualquer momento.",
        "Saber com quem compartilhamos (a resposta é: ninguém de fora).",
      ],
      "É só pedir pelo WhatsApp. A gente responde em até 15 dias e não cobra nada por isso. Para confirmar que é você mesmo, podemos fazer uma pergunta simples de conferência.",
    ],
  },
  {
    titulo: "Cookies",
    blocos: [
      "O site público não usa cookie de rastreamento, nem publicidade, nem ferramenta de análise que siga você por outros sites.",
      "O painel administrativo usa um único cookie de sessão, necessário para manter você logado enquanto usa o painel. Ele expira sozinho e não serve para rastrear nada.",
    ],
  },
  {
    titulo: "Menores de idade",
    blocos: [
      "A inscrição na militância é pensada para maiores de 16 anos. Quem tiver entre 16 e 18 deve conversar com os pais ou responsáveis antes de se inscrever. Se descobrirmos cadastro de menor de 16 sem autorização, apagamos.",
    ],
  },
  {
    titulo: "Mudanças nesta política",
    blocos: [
      "Se algo mudar de forma relevante — dado novo coletado, finalidade nova — a gente atualiza esta página e avisa quem já está cadastrado antes de a mudança valer.",
    ],
  },
];
