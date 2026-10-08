/**
 * O que cada número de /resultados quer dizer — uma fonte só.
 *
 * Cada seção aponta para um id daqui (`<Secao explica="…">`), e a caixa
 * "Sobre este dado" abre com quatro linhas: de onde vem, o que mede, por que
 * importa e o cuidado ao ler. O texto é para a coordenação, não para quem fez
 * a conta: frase curta, palavra do dia a dia, o número que decide algo.
 * `testes/contrato/resultados.test.ts` confere que todo id usado existe aqui.
 */

export type Explicacao = {
  deOnde: string;
  mede: string;
  importa: string;
  cuidado?: string;
};

const DIVULGACAO = "Divulgação de Resultados do TSE (resultados.tse.jus.br), o mesmo arquivo que alimenta o app Resultados, por município.";
const SECAO =
  "Dados Abertos do TSE: votação por seção (cada urna) somada por local de votação, e o cadastro dos locais com endereço, bairro e GPS. O bairro vem da malha oficial do IBGE (Censo 2022) quando o ponto cai dentro dela.";
const MORA = "O eleitor vota onde está inscrito, que nem sempre é onde mora hoje. O bairro do local de votação é uma boa aproximação, não um endereço.";

export const EXPLICACOES = {
  /* ===== abas que já existiam ===== */
  participacao: {
    deOnde: DIVULGACAO,
    mede: "Quantos eleitores podiam votar, quantos foram, quantos faltaram e quantos anularam ou votaram em branco.",
    importa: "Quem não foi votar também é eleitor a conquistar. Abstenção alta num lugar é voto parado esperando motivo.",
    cuidado: "Brancos e nulos variam por cargo; aqui vale o do cargo indicado no subtítulo.",
  },
  "missao-total": {
    deOnde: DIVULGACAO,
    mede: "Os votos do Missão em cada cargo: o Renan para Presidente e os candidatos (nominal + legenda) para deputado.",
    importa: "É a régua do tamanho do partido hoje e a base para calcular cadeira e quociente.",
  },
  "divisao-validos": {
    deOnde: `${DIVULGACAO} Cada partido entra num grupo: Missão, Direita (sem o Missão), Centro/Centro-Direita e Esquerda.`,
    mede: "Como os votos válidos (sem brancos e nulos) se repartiram entre os grupos, cargo a cargo.",
    importa: "Mostra o tamanho do voto de direita que ainda não é do Missão — o voto mais fácil de disputar.",
    cuidado: "A classificação é por partido, e partido não é eleitor: no Ceará, por exemplo, PSD e MDB estão na base do PT, por isso o Centro não é somado à direita.",
  },
  "mapa-estados": {
    deOnde: DIVULGACAO,
    mede: "O indicador escolhido, pintado em cada área do mapa: quanto mais escuro, maior.",
    importa: "Mostra de relance onde o Missão já é forte e onde está ausente.",
    cuidado: "Área grande no mapa não é muito eleitor. Confira sempre o total na tabela.",
  },
  regioes: {
    deOnde: `${DIVULGACAO} A região não vem pronta: é a soma dos estados dela (regiões do IBGE; o Distrito Federal fica no Centro-Oeste e o voto do exterior aparece à parte).`,
    mede: "Os mesmos números do Brasil e do estado, somados por região, com os percentuais refeitos sobre a soma.",
    importa: "Mostra em que parte do país o Missão já pegou e onde ainda falta, antes de descer para cada estado.",
    cuidado: "Quociente e cadeira são por estado: na região, as cadeiras são a soma das de cada estado, e não existe um QE da região.",
  },
  "cadeiras-qe": {
    deOnde: `${DIVULGACAO} Vagas e quociente vêm do próprio TSE.`,
    mede: "Quociente eleitoral (QE) = votos válidos ÷ vagas. É quanto custa uma cadeira. O partido precisa de 80% do QE para disputar as sobras; o candidato, de 10% do QE em voto nominal.",
    importa: "Diz quantos votos faltam para a próxima cadeira — a meta concreta da próxima eleição.",
    cuidado: "A conta da próxima cadeira é aproximada: não simula a distribuição das sobras.",
  },
  conversao: {
    deOnde: DIVULGACAO,
    mede: "Aproveitamento = votos do Missão para deputado ÷ votos do Renan para Presidente, no mesmo lugar.",
    importa: "Quem votou no Renan já disse sim ao Missão uma vez. Onde o aproveitamento é baixo, existe eleitor nosso que não achou um candidato nosso.",
    cuidado: "Acima de 100% quer dizer que o candidato a deputado puxou mais que o Renan ali — sinal de base local forte.",
  },
  cidades: {
    deOnde: DIVULGACAO,
    mede: "Os números de cada cidade do estado, lado a lado.",
    importa: "É onde se escolhe a próxima cidade para trabalhar: ordene pela coluna que interessa.",
  },
  "candidatos-missao": {
    deOnde: DIVULGACAO,
    mede: "Os votos de cada candidato do Missão, total e por cidade.",
    importa: "Mostra quem tem base própria e onde ela está.",
  },
  "vereador-2028": {
    deOnde: `${DIVULGACAO} O quociente de vereador vem da eleição de 2024.`,
    mede: "QE de vereador estimado para 2028 = QE de 2024 × (comparecimento de 2026 ÷ comparecimento de 2024). Acima de 1,00, os votos já fariam uma cadeira.",
    importa: "2028 é eleição de vereador. Cidade onde o Missão já passa do quociente é cidade para montar chapa.",
    cuidado: "É estimativa: o QE real depende de quantos votarem em 2028 e do número de vagas, que pode mudar.",
  },
  "chapa-vereador": {
    deOnde: "Número de vagas da Câmara Municipal na eleição de 2024 (TSE). As regras são da Lei 9.504/97, art. 10, com a redação da Lei 14.211/2021.",
    mede: "Candidaturas = quantos nomes cada partido pode registrar para vereador: vagas + 1. Mínimo de mulheres = 30% dessas candidaturas, com a fração arredondada para cima.",
    importa: "É o tamanho da chapa a montar em 2028 em cada cidade, e quantas mulheres ela precisa ter. Sem os 30% de cada sexo, a chapa inteira pode ser indeferida.",
    cuidado: "Os 30% valem para cada sexo e são contados sobre as candidaturas de fato registradas: chapa menor pede menos mulheres, mas nunca menos de 30%. As vagas são as de 2024 — a Câmara pode mudar o número até a eleição.",
  },
  "cadeiras-tres": {
    deOnde: `${DIVULGACAO} Eleitos pela lista oficial do TSE; quociente de vereador pela eleição de 2024.`,
    mede: "Fez = eleitos. Pelo quociente = votos do Missão ÷ QE, contando só cadeiras inteiras (sem a distribuição das sobras). Com o Renan = a mesma conta se todos os votos dele tivessem ido para o 14. Vereador 2028 = quantas cadeiras os votos de 2026 fariam em cada cidade, somadas.",
    importa: "Separa o que o partido conquistou, o que deixou na mesa (o voto do Renan que não veio) e o que já está ao alcance em 2028.",
    cuidado: "Pelas sobras, um partido com 80% do QE ainda pode levar cadeira — por isso 'pelo quociente' é o piso. O QE de 2028 é estimativa.",
  },


  "por-dentro": {
    deOnde: "Votos de cada candidato no recorte: Divulgação do TSE (estado e cidade) e votação por seção (bairro).",
    mede: "% do Missão aqui = votos do candidato ÷ voto total do Missão no cargo (nominal + legenda) no recorte. % dos válidos = votos do candidato ÷ válidos do cargo. Lugar entre todos = a posição dele entre todos os candidatos do cargo que tiveram voto ali (1º = o mais votado).",
    importa: "Longe do quociente, a cadeira não diz nada; a posição diz. Ficar em 15º entre 300 num bairro é base real; ficar em 200º é ausência. E o peso de cada nome no voto do partido mostra se o Missão depende de um só.",
  },
  perfil: {
    deOnde: "Divulgação do TSE (estado e cidade) e votação por seção (bairro), por partido e por candidato.",
    mede: "% legenda = votos só no número ÷ voto do partido. % puxador = votos do mais votado ÷ voto nominal do partido. Nomes p/ 80% = quantos candidatos, do mais votado para baixo, fazem 80% do nominal. Perfil: Marca (legenda a partir de 15%), Puxador (um nome com metade ou mais), Marca e puxador (os dois), Chapa (5 nomes ou mais para fazer 80%), Poucos nomes (o resto).",
    importa: "Mostra de que é feito o voto de cada adversário — e do Missão. Se quem elege tem chapa distribuída e o Missão depende de marca e de um nome, a ação certa é formar nomes com voto próprio, não só divulgar o 14.",
    cuidado: "Partido em federação disputa a vaga junto com os outros da federação (a coluna Federação diz qual). No bairro só vêm os 8 partidos mais votados de cada cargo, e o Missão.",
  },
  decisao: {
    deOnde: "Votos do Renan (Presidente) e da chapa do Missão para deputado em cada cidade (Divulgação do TSE) e em cada bairro (votação por seção). A régua é o estado para as cidades e a própria cidade para os bairros.",
    mede: "Propensão ao 14 = fatia do Renan nos válidos do lugar ÷ fatia do Renan na régua. Conversão = melhor chapa do Missão no lugar (Dep. Federal ou Estadual, nominal + legenda) ÷ votos do Renan ali, comparada com a da régua (1,00 = igual). Convertido: propensão a partir de 1,15 e conversão a partir de 1,00. Potencial: propensão a partir de 1,15 e conversão abaixo de 1,00. Base de candidato: propensão abaixo de 1,15 e conversão a partir de 1,15. Fora da base: o resto.",
    importa: "Um lugar que já vota 14 para Presidente puxa voto para o número de qualquer candidato do Missão. Separar quem já converteu (o deputado já recebe esse voto) de quem tem potencial (o eleitor do 14 está lá e o deputado não) mostra onde o trabalho rende mais: no Potencial, o eleitor já disse sim ao partido uma vez.",
    cuidado: "Lugar com menos de 300 votos válidos ou menos de 10 votos do Renan fica sem situação. 'Renan sem voto na chapa' é o eleitor do Renan que não votou no Missão para deputado — ele pode ter votado em outro partido ou em branco.",
  },
  "voto-puxado": {
    deOnde: "Votos de cada candidato do Missão e do Renan por cidade (Divulgação do TSE) e por bairro (votação por seção).",
    mede: "Taxa típica = a mediana, entre os lugares da régua com voto suficiente do Renan, de (votos do candidato ÷ votos do Renan) — quantos votos ele recebe para cada 100 do Renan num lugar onde não tem base própria. Puxado pelo 14 = taxa típica × votos do Renan no lugar. Próprio = votos − puxado. Negativo = ele rendeu ali menos do que o 14 daquele lugar daria.",
    importa: "É o que separa o voto que veio do partido (de quem já vota 14) do voto que veio do nome. O melhor lugar de um candidato é onde o voto próprio é maior — não onde ele teve mais votos, que costuma ser só onde há mais eleitor do 14.",
    cuidado: "Mediana e não média: um lugar onde ele tem base forte não infla a taxa dos outros. Para o 1414, o 'puxado' mistura o eleitor do Renan e o efeito do próprio número (ver 'O número faz diferença?'). Na régua da cidade (bairros), a taxa é a dele dentro daquela cidade.",
  },
  "efeito-numero": {
    deOnde: "Votos de todos os candidatos do Missão para Dep. Federal e Estadual nos 27 estados (Divulgação do TSE) e o histórico de candidaturas de 2022 e 2024 (Dados Abertos do TSE, pela mesma pessoa).",
    mede: "Em cada estado, o candidato com o número que repete o 14 (1414 para federal; 14014, 14141… para estadual) contra o melhor dos outros candidatos do Missão no mesmo cargo: fatia do voto do partido, lugar entre os do Missão, votos para cada 100 do Renan no lugar típico e quanto do voto dele acompanha o 14. Estreante = nunca tinha concorrido (2022 nem 2024).",
    importa: "Se o mesmo número rende o mesmo resultado com nomes diferentes em estados diferentes — inclusive com estreantes, que não têm fama própria —, o voto é do número e do partido, não da pessoa. Isso muda como se escolhe quem fica com o 1414 e como se mede o desempenho de quem não fica.",
    cuidado: "É evidência, não prova. O partido pode ter dado o 1414 ao nome em que mais apostava, e o candidato do 1414 pode ter feito campanha do tipo 'é só repetir o 14'. A comparação com o Dep. Estadual (mesmo partido, mesmo Renan, números com 14) é o controle: lá o efeito não aparece.",
  },
  movimento: {
    deOnde: "Dados Abertos do TSE: as candidaturas de 2022 e 2024 (por outra legenda, antes de o Missão existir) e as de 2026, pela mesma pessoa; votos por seção somados por bairro e por cidade.",
    mede: "Herança = correlação (de postos, entre os lugares) entre a fatia dele antes e a fatia da chapa do Missão em 2026 SEM os votos dele. Percentil = em quantos dos outros candidatos de Direita e Centro do mesmo cargo e ano a correlação foi menor (100% = nenhum teve a base tão alinhada ao Missão). Lift = fatia da chapa nos 10 lugares mais fortes dele ÷ no resto. Retenção = votos 2026 ÷ votos de antes. Canibalização = correlação, entre as cidades, da fatia dele com a dos outros candidatos do Missão no mesmo cargo.",
    importa: "Mostra se a base que o movimento construiu antes do partido virou voto do Missão — e quem é peça para 2028. O controle com os outros candidatos da direita separa 'o bairro é de direita' de 'o bairro é dele'.",
    cuidado: "Correlação não é causa: a base dele e o voto no Missão podem ter a mesma origem (o mesmo perfil de eleitor). Voto anulado sub judice conta aqui (é eleitor real que digitou o número), embora não tenha contado para o partido. Canibalização positiva quer dizer que ele e os outros do Missão sobem juntos nos mesmos lugares — não que disputaram o eleitor.",
  },
  captura: {
    deOnde: "Votos dele na eleição de antes e votos de cada candidato do Missão em 2026, local de votação por local de votação na cidade-base (Dados Abertos do TSE). O local casa entre os anos pelo número, dentro da zona.",
    mede: "Teto = soma, em todos os locais, do menor entre os votos dele antes e os do candidato em 2026: o máximo que o candidato pode ter herdado. Estimativa = regressão, entre os locais, dos votos do candidato em 2026 contra os votos dele antes, controlando pelos votos do Renan: o coeficiente é quantos votos do candidato acompanham cada voto dele, e a estimativa é esse coeficiente × os votos dele. A faixa é a margem de 95%.",
    importa: "Mostra para quem foi, provavelmente, o eleitor que ele trouxe antes do partido existir — e quanto ficou sem dono.",
    cuidado: "O voto é secreto: é uma estimativa ecológica, não um rastreio de eleitor. Ela mede o quanto o voto do candidato sobe onde ele tinha voto, além do que o 14 (Renan) já explica; parte disso pode ser o mesmo perfil de eleitor, e não o mesmo eleitor. As estimativas de candidatos diferentes não precisam somar o total.",
  },
  "candidato-bairros": {
    deOnde: "Dados Abertos do TSE: votação por seção somada por bairro.",
    mede: "Os votos do candidato em cada bairro da cidade escolhida, a fatia dele no bairro e a força (fatia no bairro ÷ fatia no estado).",
    importa: "Mostra a base do candidato dentro da cidade — onde ele já é conhecido e onde ainda não chegou.",
  },
  desidratar: {
    deOnde: "Dados Abertos do TSE (2022, 2024 e 2026), pela mesma pessoa (título de eleitor).",
    mede: "Seis sinais, cada um sim ou não: perdeu voto desde 2022; perdeu mais de 20% na cidade onde era mais forte; não se elegeu; trocou de partido; metade ou mais dos votos numa cidade só; a cidade-base andou para o lado oposto ao dele.",
    importa: "Quanto mais sinais, mais frágil é a base. É de quem tem mais chance de perder eleitor de novo — e é onde vale chegar antes dos outros.",
    cuidado: "São sinais, não previsão. Um nome com mandato e estrutura pode se recuperar mesmo com vários sinais.",
  },
  pautas: {
    deOnde: "Dados Abertos da Câmara dos Deputados: projetos (PL, PEC, PLP, PDL) apresentados de 2023 a 2026 em que a pessoa é a primeira autora, com o tema que a própria Câmara atribui. A pessoa é casada pelo nome civil e pela data de nascimento.",
    mede: "Os temas em que o deputado mais apresenta projeto e os projetos mais recentes dele.",
    importa: "É a pauta que ele assumiu em público. Pauta de quem está perdendo voto é pauta que o eleitor dele já reconhece — e que o Missão pode disputar.",
    cuidado: "Só existe para quem foi deputado federal de 2023 a 2026. Deputado estadual, senador e quem nunca teve mandato federal não têm essa base pronta. Projeto apresentado não é projeto aprovado.",
  },
  legenda: {
    deOnde: DIVULGACAO,
    mede: "Voto de legenda é quem digitou só o número do partido (14), sem escolher candidato.",
    importa: "Legenda alta = o eleitor procura a marca. Falta transformar isso em nome, porque cadeira é de quem tem voto nominal.",
  },
  "legenda-partidos": {
    deOnde: DIVULGACAO,
    mede: "Quanto do voto de cada partido foi só no número do partido.",
    importa: "Serve de régua: mostra se a legenda do Missão está acima ou abaixo do normal.",
  },
  "numero-candidato": {
    deOnde: DIVULGACAO,
    mede: "Voto difuso = votos que aparecem no estado inteiro na mesma proporção dos votos do Renan. É sinal de voto pelo número (ou de fama no estado), não de base local.",
    importa: "Número fácil (que repete o 14) atrai voto que não conhece o candidato. Ajuda a escolher os números da próxima chapa.",
    cuidado: "É um indício estatístico, não prova.",
  },
  duplas: {
    deOnde: DIVULGACAO,
    mede: "Candidatos a federal e estadual com números parecidos (1414 ↔ 14014). Correlação perto de 1 = votaram nas mesmas cidades, na mesma proporção.",
    importa: "Dobrada que funciona soma voto; vale repetir o desenho dos números.",
  },
  "onde-melhor": {
    deOnde: DIVULGACAO,
    mede: "As cidades onde o candidato teve a maior fatia dos votos.",
    importa: "É a base dele — e o primeiro lugar para ele puxar chapa de vereador.",
  },

  /* ===== bairros ===== */
  "bairros-mapa": {
    deOnde: SECAO,
    mede: "Cada área é um bairro oficial do IBGE (ou um distrito, na zona rural), pintada pelo indicador escolhido. Os pontos são os locais de votação, do tamanho do eleitorado.",
    importa: "Mostra onde o Missão já tem voto e onde a direita é forte sem ele, dentro da cidade.",
    cuidado: `${MORA} Cidade sem bairro oficial no IBGE aparece só com os distritos e os pontos.`,
  },
  "bairros-tabela": {
    deOnde: SECAO,
    mede: "Os números de cada bairro: eleitores, comparecimento, para que lado pende, o Missão e a oportunidade.",
    importa: "É a lista para decidir onde fazer reunião, panfletagem e onde procurar candidato a vereador.",
    cuidado: "A soma dos bairros bate com o total da cidade. Bairro com poucos locais de votação oscila mais.",
  },
  "bairro-origem": {
    deOnde: SECAO,
    mede: "De onde saiu o nome do bairro: IBGE (o GPS do local caiu no polígono oficial), distrito (zona rural) ou cartório (o nome que o cartório eleitoral digitou).",
    importa: "Nome do IBGE é o mais confiável e é o mesmo em 2022, 2024 e 2026 — é isso que permite comparar no tempo.",
    cuidado: "O nome do cartório pode vir escrito de jeitos diferentes; juntamos as grafias, mas pode sobrar repetição.",
  },
  "pende-para": {
    deOnde: SECAO,
    mede: "Pende para = (Missão + Direita − Esquerda) ÷ votos válidos para Presidente. Vai de −1 (todo mundo votou na esquerda) a +1 (todo mundo na direita). O Centro fica neutro.",
    importa: "Diz se o bairro é terreno favorável. Comparado com a média do estado, separa os bairros mais à direita dos mais à esquerda — no Ceará quase tudo é esquerda em número absoluto, então o relativo é o que decide.",
    cuidado: "Presidente puxa o voto nacional; para o voto local, veja também o de Governador e o de vereador em 2024.",
  },
  "bairro-tempo": {
    deOnde: `${SECAO} 2022 e 2024 saem dos mesmos arquivos do TSE daqueles anos, somados pelo mesmo bairro.`,
    mede: "Como o bairro votou em 2022 (Presidente, Governador, deputados), 2024 (prefeito e vereador) e 2026.",
    importa: "Mostra para que lado o bairro está andando. Bairro que andou para a direita é bairro em disputa.",
    cuidado: "Os locais de votação mudam entre eleições; o bairro não. Bairro que ganhou ou perdeu local de votação pode mudar de tamanho de um ano para o outro.",
  },
  "bairro-candidatos": {
    deOnde: SECAO,
    mede: "Os mais votados do bairro em cada cargo. Força = fatia do candidato no bairro ÷ fatia dele no estado: acima de 1, ele é mais forte ali do que no resto do estado.",
    importa: "Mostra quem manda no bairro e quem é fraco ali — de quem dá para tirar voto.",
  },
  locais: {
    deOnde: SECAO,
    mede: "Cada escola ou prédio onde se vota: endereço, eleitores e como votou.",
    importa: "Local de votação é ponto de encontro natural do bairro: é onde estão as pessoas, e é onde se faz boca de urna e reunião.",
    cuidado: "O endereço é o do cadastro do TSE. Quando o nome do bairro do cartório difere do IBGE, os dois aparecem.",
  },
  roteiro: {
    deOnde: SECAO,
    mede: "Os locais de votação ordenados pela oportunidade, com endereço e link do mapa.",
    importa: "É a lista de rua: imprima e leve.",
  },
  oportunidade: {
    deOnde: SECAO,
    mede: "Oportunidade = votos de direita (sem o Missão) para Deputado Estadual + votos do Renan que não foram para o Missão em estadual. Em votos, para dar para comparar.",
    importa: "É o voto mais perto de virar Missão: gente que já votou na direita ou no Renan. Deputado Estadual é o cargo mais parecido com vereador.",
    cuidado: "Onde o Missão não teve candidato a estadual, todo voto do Renan conta como não convertido.",
  },

  /* ===== adversários ===== */
  "em-queda": {
    deOnde: "Dados Abertos do TSE: a mesma pessoa em 2022 e 2026, reconhecida pelo título de eleitor (não pelo nome), com os votos somados por cidade e bairro.",
    mede: "Quem concorreu ao mesmo cargo nos dois anos e teve menos voto agora, quanto perdeu e onde perdeu.",
    importa: "O voto que ele perdeu está solto. Nos bairros onde ele mais caiu, o eleitor está procurando outra opção.",
    cuidado: "Quem mudou de cargo (de estadual para federal, por exemplo) aparece à parte: comparar cargos diferentes não diz nada.",
  },
  saiu: {
    deOnde: "Dados Abertos do TSE, pelo título de eleitor.",
    mede: "Quem teve voto em 2022 e não concorreu em 2026 (em nenhum estado). Quem foi para a prefeitura em 2024 e os senadores eleitos em 2022 (mandato até 2031) aparecem separados.",
    importa: "O eleitor dele ficou sem nome. E o próprio político pode virar apoio.",
  },
  orfaos: {
    deOnde: "Dados Abertos do TSE: candidatos a Deputado Federal e Estadual de 2026 e a situação de cada um na totalização.",
    mede: "Votos de candidatos de Direita e Centro que não se elegeram: voto de direita que ficou sem representante.",
    importa: "É o recrutamento para 2028: quem teve muito voto e não se elegeu pode ser candidato a vereador, ou aliado.",
  },
  fracos: {
    deOnde: SECAO,
    mede: "Bairros que pendem para a direita mais do que a média do estado e onde um candidato forte no estado vai mal (força abaixo de 0,5).",
    importa: "É espaço aberto: o bairro aceita a direita, mas o nome dominante não chegou lá.",
  },
  "partidos-tempo": {
    deOnde: "Dados Abertos do TSE, votos nominais por partido, somados no estado.",
    mede: "Os votos de cada partido para Deputado Federal e Estadual em 2022 e 2026, e para vereador em 2024.",
    importa: "Mostra quem está crescendo e quem está encolhendo — e de quem o eleitor está saindo.",
    cuidado: "Em 2022 vários partidos tinham outro nome ou se fundiram depois (PTB e Patriota viraram PRD, por exemplo). E o número 14 era do PTB em 2022.",
  },
  "cidades-tempo": {
    deOnde: "Dados Abertos do TSE, somados por cidade nos três anos.",
    mede: "Para que lado cada cidade pendia em 2022 e em 2026 (Presidente), e quanto andou.",
    importa: "Cidade que andou para a direita é cidade em disputa: é onde a mensagem do Missão encontra mais gente disposta a ouvir.",
  },
} satisfies Record<string, Explicacao>;

export type IdExplicacao = keyof typeof EXPLICACOES;

/** Glossário da aba "Sobre os dados": termo → definição curta. */
export const GLOSSARIO: [string, string][] = [
  ["Votos válidos", "Os votos dados a candidato ou partido. Brancos e nulos ficam de fora — e é sobre os válidos que se calcula quociente e porcentagem."],
  ["Nominal e legenda", "Nominal é o voto no número do candidato; legenda é o voto só no número do partido. Os dois contam para o partido; só o nominal ordena quem assume."],
  ["Quociente eleitoral (QE)", "Válidos ÷ vagas: quantos votos custa uma cadeira. O partido precisa de 80% do QE para disputar as sobras; o candidato, de 10% do QE em voto nominal."],
  ["Aproveitamento", "Votos do Missão para deputado ÷ votos do Renan, no mesmo lugar. Diz quanto do eleitor do Renan também votou no 14 para deputado."],
  ["Índice de força", "Fatia do Missão no lugar ÷ fatia do Missão no estado. 1,00 é a média; 2,00 é o dobro."],
  ["Voto difuso", "Votos que aparecem em todo o estado na mesma proporção do Renan: sinal de voto pelo número, não de base local."],
  ["Pende para", "(Missão + Direita − Esquerda) ÷ válidos para Presidente, de −1 (esquerda) a +1 (direita). O relativo compara com a média do estado."],
  ["Oportunidade", "Votos de direita (sem o Missão) para Deputado Estadual + votos do Renan não convertidos em estadual. O voto mais perto de virar Missão."],
  ["Em queda", "Concorreu ao mesmo cargo em 2022 e 2026 e perdeu voto. A pessoa é reconhecida pelo título de eleitor."],
  ["Votos órfãos", "Votos de candidatos de Direita e Centro a deputado que não se elegeram em 2026."],
  ["Local de votação", "A escola ou o prédio onde ficam as urnas. Cada local tem várias seções (urnas)."],
  ["Seção agregada", "Seção pequena que vota na urna de outra. Os eleitores dela contam no local da seção principal."],
];

/** Limites que valem para a página toda. */
export const LIMITES: string[] = [
  MORA,
  "O bairro do IBGE (o GPS caiu no polígono oficial) é o mais confiável. Onde o IBGE não tem bairro oficial, vale o distrito (zona rural) ou o nome que o cartório digitou.",
  "Os números de partido mudam entre eleições: o 14 é o Missão em 2026 e era o PTB em 2022. A sigla de cada voto sai da lista de candidatos daquele ano.",
  "A soma das seções bate com o total oficial do TSE no Brasil inteiro: Governador e Senado exatos em 2022 e 2026; Presidente e deputados com diferença de até 0,05%; no pior estado, 0,3% (vereador 2024 no Paraná). A diferença vem de votos que a Justiça Eleitoral anulou ou validou depois da eleição.",
  "Partido não é eleitor. A divisão em Missão, Direita, Centro e Esquerda é por partido e serve para comparar lugares, não para rotular pessoas.",
];
