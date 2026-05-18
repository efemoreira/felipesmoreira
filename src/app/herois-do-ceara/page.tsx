import { useState, useMemo } from "react";

interface HeroFamily {
  parents: string;
  spouse: string;
  children: string;
}

interface Hero {
  id: number;
  name: string;
  nickname: string;
  birth: string;
  death: string;
  birthPlace: string;
  deathPlace: string;
  period: string;
  category: string;
  family: HeroFamily;
  contemporaries: string;
  historicalContext: string;
  actions: string;
  helpers: string;
  consequences: string;
  legacy: string;
}

const heroes: Hero[] = [
  {
    id:1, name:"Martim Soares Moreno", nickname:"O Fundador do Ceará",
    birth:"c. 1586", death:"após 1648", birthPlace:"Santiago do Cacém, Portugal", deathPlace:"Portugal",
    period:"Colonial", category:"Militar",
    family:{ parents:"Martim de Loures e Paula Ferreira", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Felipe II/III de Portugal/Espanha, Diogo Botelho (governador do Brasil), Jerônimo de Albuquerque, Pero Coelho de Souza, Jacaúna (cacique potiguara)",
    historicalContext:"O Brasil vivia a União Ibérica (1580-1640). Franceses tentavam criar a França Equinocial no Maranhão; holandeses ameaçavam o litoral nordestino. Os sertões do Siará Grande eram terra dos potiguaras, que guerreavam com os tupinambás aliados dos franceses.",
    actions:"Chegou ao Brasil em 1602/3 como soldado de Diogo Botelho. Aprendeu o tupi e os costumes indígenas, tornando-se filho adotivo do cacique Jacaúna. Nomeado capitão do Ceará em 1611. Em 20/01/1612 fundou o Forte de São Sebastião às margens do Rio Ceará — origem de Fortaleza. Combateu corsários franceses e holandeses por 30+ anos, pintando-se de urucu e jenipapo para lutar ao lado dos potiguaras.",
    helpers:"Jacaúna (pai adotivo); Poti (irmão de Jacaúna, futuro D. Antônio Felipe Camarão); Diogo de Campos Moreno (tio); Jesuítas Francisco Pinto e Luís Figueira.",
    consequences:"Fundação efetiva do Ceará (Forte de São Sebastião = origem de Fortaleza). Criação da Capitania do Ceará (1621). Impediu colônias permanentes francesa e holandesa no litoral norte.",
    legacy:"Inscrito no Livro dos Heróis da Pátria em 2015. Modelou a estratégia indigenista de integração cultural como forma de conquista. Personagem inspirador de Iracema (José de Alencar, 1865).",
  },
  {
    id:2, name:"Jacaúna", nickname:"O Grande Cacique Potiguara",
    birth:"séc. XVI", death:"início séc. XVII", birthPlace:"Siará Grande (litoral cearense)", deathPlace:"Siará Grande",
    period:"Colonial", category:"Indígena",
    family:{ parents:"Não documentados", spouse:"Não documentada", children:"Irmão: Poti (futuro D. Antônio Felipe Camarão)" },
    contemporaries:"Martim Soares Moreno, Pero Coelho de Souza, Jesuítas Francisco Pinto e Luís Figueira",
    historicalContext:"Os potiguaras habitavam o litoral nordestino, aliados históricos dos franceses contra os portugueses. A chegada portuguesa ao Siará Grande representava pressão sobre territórios ancestrais de séculos.",
    actions:"Cacique-mor ('principal') dos potiguaras do Siará Grande. Acolheu Martim Soares Moreno como filho adotivo, ensinando-lhe o tupi e os costumes do povo. Forneceu guerreiros para combater os franceses ao lado dos portugueses. Apoiou a construção do Forte de São Sebastião (1612).",
    helpers:"Guerreiros e aldeias potiguaras; jesuítas que mediaram contatos",
    consequences:"A aliança Jacaúna-Moreno tornou possível a fundação do Ceará. Seu irmão Poti/Camarão tornou-se o símbolo máximo da resistência luso-indígena contra os holandeses.",
    legacy:"Representa os povos que moldaram o território cearense antes da colonização europeia. Sua aliança não foi rendição, mas diplomacia de sobrevivência. A perspectiva indígena da fundação do Ceará.",
  },
  {
    id:3, name:"Bárbara Pereira de Alencar", nickname:"Dona Bárbara do Crato / A Primeira Presa Política do Brasil",
    birth:"11/02/1760", death:"18/08/1832", birthPlace:"Fazenda Caiçara, Exu (PE)", deathPlace:"Fronteiras (PI)",
    period:"Imperial", category:"Político/Revolucionário",
    family:{ parents:"Joaquim Pereira de Alencar e Teodora", spouse:"José Gonçalves dos Santos (comerciante português)", children:"José Martiniano (pai do escritor), Tristão Gonçalves, Carlos José, Leonel e Ana" },
    contemporaries:"Napoleão Bonaparte, D. João VI, Frei Caneca, Domingos José Martins, Manoel Arruda de Câmara",
    historicalContext:"Viveu a transferência da Corte para o Brasil (1808), a Revolução Pernambucana de 1817, a Independência (1822) e a Confederação do Equador (1824) — maior movimento republicano do Império. O Nordeste vivia tensão entre elites agrárias liberais e a Coroa absolutista.",
    actions:"Participou da Revolução de 1817: filho José Martiniano proclamou a República do Crato. Foi presa com correntes, levada a pé ao Forte de Assunção (Fortaleza), depois a Recife e Salvador — 3 anos de prisão. Em 1824 apoiou a Confederação do Equador e voltou a ser presa.",
    helpers:"Frei Caneca, Domingos José Martins, Manoel Arruda de Câmara",
    consequences:"Sua resistência inspirou gerações da família Alencar. Seus descendentes incluem José de Alencar, Rachel de Queiroz e Frei Tito. Tornou-se símbolo do republicanismo cearense e da resistência feminina.",
    legacy:"Inscrita no Livro dos Heróis e Heroínas da Pátria (Lei 13.056/2014). Considerada a primeira presa política do Brasil. Avó do maior romancista do Romantismo brasileiro.",
  },
  {
    id:4, name:"Tristão Gonçalves de Alencar Araripe", nickname:"Tristão Gonçalves / Mártir da República",
    birth:"17/09/1789", death:"30/10/1825", birthPlace:"Crato (CE)", deathPlace:"Santa Rosa do Jaguaribe (CE)",
    period:"Imperial", category:"Político/Revolucionário",
    family:{ parents:"Bárbara de Alencar e José Gonçalves dos Santos", spouse:"Ana Porcina Ferreira de Lima ('Ana Triste')", children:"9 filhos" },
    contemporaries:"Frei Caneca, D. Pedro I, Brigadeiro Lima e Silva, Bárbara de Alencar",
    historicalContext:"Período de ebulição republicana: Revolução de 1817, Independência (1822), Confederação do Equador (1824). O Ceará vivia tensão entre elites liberais e autoridade imperial centralizada.",
    actions:"Liderou o Ceará na Revolução de 1817 (preso na Bahia). Combateu na guerra de Independência no Piauí/Maranhão. Em 26/08/1824 foi proclamado presidente da Província do Ceará pela Confederação do Equador. Resistiu às tropas imperiais com guerrilha pelo sertão até ser assassinado em emboscada.",
    helpers:"Frei Caneca, Bárbara de Alencar (mãe), João Pessoa de Oliveira",
    consequences:"Sua derrota consolidou o Império centralizado, mas a memória dos mártires alimentou o republicanismo que triunfou em 1889. A viúva 'Ana Triste' recebeu pensão imperial em 1833.",
    legacy:"Filho da primeira presa política do Brasil, ele próprio morreu pela República. Mártir fundador do republicanismo cearense.",
  },
  {
    id:5, name:"Tristão de Alencar Araripe", nickname:"Conselheiro Araripe / O Juiz-Historiador",
    birth:"07/10/1821", death:"03/06/1908", birthPlace:"Icó (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"Imperial", category:"Científico/Histórico",
    family:{ parents:"Tristão Gonçalves (pai mártir) e Ana Porcina Ferreira de Lima ('Ana Triste')", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"José de Alencar (primo), D. Pedro II, Deodoro da Fonseca",
    historicalContext:"O Brasil imperial estruturava seu sistema judiciário e historiográfico. O Poder Judiciário se consolidava como poder independente. A Proclamação da República (1889) exigiu nova arquitetura institucional.",
    actions:"Bacharel pela Faculdade de Direito do Largo de São Francisco (1845). Juiz municipal de Fortaleza (1847). Presidente das Províncias do Rio Grande do Sul e do Pará (1885-86). Ministro da Justiça e da Fazenda no governo Deodoro. Ministro do STF até 1892. Autor da História da Província do Ceará (1867), obra fundadora da historiografia cearense.",
    helpers:"D. Pedro II; a tradição jurídica e intelectual da família Alencar",
    consequences:"A História da Província do Ceará é a fonte primária fundamental da historiografia cearense. Sua carreira no STF consolidou o Judiciário na transição imperial-republicana.",
    legacy:"Filho do mártir republicano que se tornou pilar do Estado de Direito — ironia da história cearense. A obra historiográfica foi fundacional para todos os estudos posteriores.",
  },
  {
    id:6, name:"Tomás Pompeu de Sousa Brasil", nickname:"Senador Pompeu / O Sábio do Ceará",
    birth:"06/06/1818", death:"02/09/1877", birthPlace:"Santa Quitéria (CE)", deathPlace:"Fortaleza (CE)",
    period:"Imperial", category:"Científico/Histórico",
    family:{ parents:"Capitão Tomás d'Aquino de Sousa e Jeracina Isabel de Sousa", spouse:"Não documentada", children:"Tomás Pompeu Sobrinho (filho, também cientista)" },
    contemporaries:"José de Alencar, D. Pedro II, Liberato Barroso, Juvenal Galeno",
    historicalContext:"Brasil imperial em plena consolidação científica. O Ceará sofria com secas periódicas devastadoras. O IHGB avançava na sistematização do conhecimento nacional.",
    actions:"Primeiro diretor do Liceu do Ceará (1845-49). Criou o jornal O Cearense (1846), voz do Partido Liberal. Deputado geral e Senador do Império (1864-77). Autor do Compêndio Elementar de Geografia Geral e Especial do Brasil, adotado no Colégio Pedro II. Pioneiro nos estudos das secas: Memória sobre o Clima e Secas do Ceará (1877).",
    helpers:"D. Pedro II (apoio imperial à ciência); Francisco de Paula Pessoa ('Senador dos Bois')",
    consequences:"O Liceu do Ceará tornou-se a principal instituição de ensino do estado por décadas. Seus estudos sobre secas anteciparam Euclides da Cunha e João Capistrano de Abreu.",
    legacy:"A Avenida Senador Pompeu em Fortaleza. Pioneiro absoluto na ciência climática do Nordeste. Seu Compêndio foi adotado em escolas de todo o Brasil.",
  },
  {
    id:7, name:"José de Alencar", nickname:"Cazuza / Pai da Literatura Brasileira",
    birth:"01/05/1829", death:"12/12/1877", birthPlace:"Sítio Alagadiço Novo, Mecejana/Fortaleza (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"Imperial", category:"Literário",
    family:{ parents:"Padre José Martiniano de Alencar e Ana Josefina de Alencar (prima)", spouse:"Georgina Augusta Cochrane (1864)", children:"6 filhos: Augusto (embaixador), Clarisse, Ceci, Elisa, Mário (escritor), Adélia" },
    contemporaries:"Machado de Assis, D. Pedro II, Joaquim Nabuco, Visconde do Rio Branco, Álvares de Azevedo",
    historicalContext:"Brasil imperial buscava identidade nacional. Romantismo procurava heróis locais. Guerra do Paraguai (1864-70) agitava cenário político. D. Pedro II vetou seu nome para Senador em 1869, desgostando-o profundamente.",
    actions:"Criou o romance nacional brasileiro: trilogia indianista (O Guarani 1857; Iracema 1865; Ubirajara 1874), romances urbanos (Lucíola, Senhora), regionalistas (O Sertanejo), históricos (As Minas de Prata). Ministro da Justiça (1868-70). Deputado pelo Partido Conservador. Defendeu o 'brasileiro' como idioma próprio contra Rui Barbosa.",
    helpers:"Machado de Assis (crítico e amigo), Editora Garnier, Padre José Martiniano (pai politicamente influente)",
    consequences:"Iracema fundou a identidade cearense na literatura brasileira. A ABL o tornou patrono da Cadeira 23. Seu modelo do herói indígena-nacional foi referência por um século.",
    legacy:"Patrono da Cadeira 23 da ABL por escolha de Machado de Assis. O Theatro José de Alencar (Fortaleza) e a Praça José de Alencar (RJ) o homenageiam. Maior romancista do Romantismo brasileiro.",
  },
  {
    id:8, name:"Jovita Alves Feitosa", nickname:"Joana D'Arc Brasileira",
    birth:"08/03/1848", death:"09/10/1867", birthPlace:"Tauá (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"Imperial", category:"Militar",
    family:{ parents:"Maximiano Bispo de Oliveira e Maria Alves Feitosa", spouse:"Guilherme Noot (engenheiro inglês, que a abandonou)", children:"Nenhum" },
    contemporaries:"D. Pedro II, General Tibúrcio, Franklin Dória (presidente do Piauí), Visconde de Cairú (ministro da Guerra)",
    historicalContext:"A Guerra do Paraguai (1864-70) mobilizava voluntários no Brasil. No Ceará, surto de cólera (1862-64) matou milhares, incluindo a mãe de Jovita. O papel da mulher era estritamente doméstico; alistar-se era impensável.",
    actions:"Aos 17 anos, cortou o cabelo, disfarçou os seios com bandagens e alistou-se no 2º Corpo de Voluntários em Teresina (20/06/1865), vestida de homem. Descoberta, foi aceita como 2º sargento pelo presidente Franklin Dória. Percurso triunfal de Teresina ao Rio, recebida como heroína por onde passou. O Ministro da Guerra negou-lhe o campo de batalha. Recusou ser enfermeira. Morreu suicidada com punhalada no coração em 09/10/1867.",
    helpers:"Franklin Dória (presidente do Piauí, que a aceitou); jornais que a tornaram celebridade nacional",
    consequences:"Seu caso dividiu a opinião pública sobre o papel da mulher. Usada como propaganda de recrutamento, subverteu involuntariamente as expectativas ao desafiar o gênero. Inscrita no Livro dos Heróis da Pátria (Lei 13.423/2017).",
    legacy:"Símbolo da luta feminista avant la lettre no Brasil. Inscrita no Panteão da Pátria. A Praça Jovita Feitosa fica em Fortaleza.",
  },
  {
    id:9, name:"General Tibúrcio", nickname:"Antônio Tibúrcio Ferreira de Sousa",
    birth:"11/08/1837", death:"28/03/1885", birthPlace:"Viçosa do Ceará (CE)", deathPlace:"Fortaleza (CE)",
    period:"Imperial", category:"Militar",
    family:{ parents:"Francisco Ferreira de Sousa e Margarida Ferreira de Sousa", spouse:"Maria Augusta Ferreira de Sousa (cofundadora da Sociedade das Cearenses Libertadoras)", children:"Documentados, não identificados" },
    contemporaries:"D. Pedro II, Duque de Caxias, Liberato Barroso, Jovita Feitosa",
    historicalContext:"A Guerra do Paraguai (1864-70) foi o maior conflito armado da América do Sul. O Ceará enviou o Batalhão de Voluntários da Pátria Cearense. O abolicionismo crescia nos anos 1880.",
    actions:"Alistou-se como praça aos 14 anos. Combateu com distinção na Guerra do Paraguai: Riachuelo, Tuiuti, Estero Bellaco, Campo Grande, Peribebuí. Professor de Física e Química na Escola Militar. Abolicionista intransigente. Promovido a brigadeiro-general.",
    helpers:"Duque de Caxias (comando no Paraguai); Liberato Barroso (colega abolicionista)",
    consequences:"Formou geração de militares cearenses. Patrono do 38º Batalhão de Infantaria. Sua esposa foi cofundadora da Sociedade das Cearenses Libertadoras com Maria Tomásia.",
    legacy:"Inscrito no Livro dos Heróis da Pátria (Lei 14.610/2023). Símbolo do militar-cidadão cearense: guerreiro no Paraguai, abolicionista no sertão.",
  },
  {
    id:10, name:"Liberato Barroso", nickname:"José Liberato Barroso",
    birth:"21/09/1830", death:"02/10/1885", birthPlace:"Aracati (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"Imperial", category:"Político/Revolucionário",
    family:{ parents:"Coronel Joaquim Liberato Barroso", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"José de Alencar, Dragão do Mar, Senador Pompeu, D. Pedro II",
    historicalContext:"O Brasil debatia a abolição. O Ceará, economicamente menos dependente de mão de obra escrava que o sul, foi pioneiro no caminho da emancipação.",
    actions:"Advogado e político. Deputado provincial (1858-61) e geral. Presidente das Províncias do Ceará e de Pernambuco. Ministro interino da Agricultura (1864). Discursou na sessão solene de 25/03/1884 pela emancipação dos escravos cearenses.",
    helpers:"João Cordeiro, Antônio Bezerra, Dragão do Mar",
    consequences:"A abolição cearense de 1884 criou precedente que acelerou a Lei Áurea de 1888 em nível nacional.",
    legacy:"Patrono da Cadeira 20 da Academia Cearense de Letras. Uma das vozes políticas mais ativas na abolição cearense.",
  },
  {
    id:11, name:"Maria Tomásia Figueira Lima", nickname:"A Libertadora / A Matriarca Abolicionista",
    birth:"06/12/1826", death:"1902", birthPlace:"Sobral (CE)", deathPlace:"Fortaleza (CE)",
    period:"Imperial", category:"Abolicionista",
    family:{ parents:"Ana Francisca Figueira de Melo e José Xerez Furna", spouse:"Francisco de Paula de Oliveira Lima (abolicionista, 2ª núpcias)", children:"Não documentados" },
    contemporaries:"Dragão do Mar, João Cordeiro, Antônio Bezerra, Emília Freitas, D. Pedro II, José do Patrocínio",
    historicalContext:"O Ceará era o segundo maior exportador interprovincial de escravos depois do fim do tráfico atlântico (1850). Navios saíam do porto de Fortaleza levando cativos para o sudeste.",
    actions:"Cofundou e presidiu a Sociedade das Senhoras Libertadoras (Cearenses Libertadoras) em 1882 — a primeira organização feminina abolicionista do Brasil. Na posse (06/01/1883), entregou pessoalmente 83 cartas de alforria. Organizou eventos, arrecadou fundos, negociou alforrias com fazendeiros. Obteve apoio financeiro de D. Pedro II. Esteve presente na Assembleia em 25/03/1884 quando a escravidão foi abolida no Ceará.",
    helpers:"Elvira Pinho, Carolina Cordeiro, Emília Freitas, Jacinta Souto — 22 cofundadoras; D. Pedro II; José do Patrocínio (elogiou publicamente o trabalho das cearenses)",
    consequences:"O Ceará tornou-se o primeiro estado a abolir a escravidão (25/03/1884), 4 anos antes da Lei Áurea. A Sociedade das Senhoras Libertadoras foi modelo para organizações femininas abolicionistas em todo o Brasil.",
    legacy:"Pioneira do feminismo abolicionista no Brasil. Rua Maria Tomásia em Fortaleza (bairro Aldeota). Símbolo de que a luta das mulheres foi central — não periférica — na abolição cearense.",
  },
  {
    id:12, name:"Dragão do Mar", nickname:"Francisco José do Nascimento / Chico da Matilde",
    birth:"15/04/1839", death:"05/03/1914", birthPlace:"Canoa Quebrada, Aracati (CE)", deathPlace:"Fortaleza (CE)",
    period:"Imperial", category:"Abolicionista",
    family:{ parents:"Manoel do Nascimento (pescador) e Matilde Maria da Conceição", spouse:"Não documentada com certeza", children:"Não documentados" },
    contemporaries:"João Cordeiro, Antônio Bezerra, Maria Tomásia, Liberato Barroso, Princesa Isabel",
    historicalContext:"O tráfico interprovincial de escravos era lucrativo no Ceará dos anos 1880. Navios saíam mensalmente do porto de Fortaleza. João Cordeiro liderava a Sociedade Cearense Libertadora desde 1880.",
    actions:"Jangadeiro mestiço, neto de escravizados. Nos dias 27, 30 e 31 de janeiro de 1881 liderou a greve que paralisou o porto: nenhum jangadeiro embarcaria mais escravos. A frase histórica: 'No porto do Ceará não se embarcam mais escravos.' Tornou-se prático-mor da Capitania dos Portos. Recebido como herói no Rio em 1884, doou sua jangada Liberdade a D. Pedro II e ao Museu Nacional.",
    helpers:"José Luís Napoleão (negro liberto, amigo e organizador central); João Cordeiro; Antônio Bezerra; Rodolfo Teófilo; Maria Tomásia",
    consequences:"A greve de 1881 desencadeou o processo que levou à abolição cearense em 25/03/1884 — quatro anos antes da Lei Áurea. O Ceará tornou-se o primeiro estado abolicionista do Brasil.",
    legacy:"Inscrito no Livro dos Heróis da Pátria (Lei 13.601/2017). O Centro Dragão do Mar de Arte e Cultura (Fortaleza, 1999) leva seu nome. Símbolo máximo do abolicionismo cearense e da resistência popular.",
  },
  {
    id:13, name:"João Cordeiro", nickname:"O Presidente da Libertação",
    birth:"c. 1845", death:"c. 1920", birthPlace:"Ceará", deathPlace:"Fortaleza (CE)",
    period:"Imperial", category:"Abolicionista",
    family:{ parents:"Não documentados", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Dragão do Mar, Antônio Bezerra, Maria Tomásia, Liberato Barroso",
    historicalContext:"O Ceará dos anos 1880 era o epicentro do abolicionismo mais avançado do Brasil imperial. A Sociedade Cearense Libertadora articulava fazendeiros, jangadeiros e intelectuais.",
    actions:"Comissário-geral dos Socorros Públicos durante a Grande Seca de 1877-79, quando conheceu o Dragão do Mar. Presidiu a Sociedade Cearense Libertadora (1880). Articulou a greve dos jangadeiros de janeiro de 1881. Vice-presidente do estado no início da República (1889-91).",
    helpers:"Dragão do Mar, Antônio Bezerra, José Marrocos, Rodolfo Teófilo",
    consequences:"A Sociedade Cearense Libertadora foi o motor organizacional da abolição de 1884. Sua rede articulou toda a corrente abolicionista cearense.",
    legacy:"Organizador-chefe da estrutura que tornou o Ceará o primeiro estado abolicionista. A Avenida João Cordeiro, na Praia de Iracema, homenageia sua memória.",
  },
  {
    id:14, name:"Antônio Bezerra de Menezes", nickname:"André Carnaúba (Padaria Espiritual)",
    birth:"21/02/1841", death:"28/08/1921", birthPlace:"Quixeramobim (CE)", deathPlace:"Fortaleza (CE)",
    period:"Imperial", category:"Literário",
    family:{ parents:"Dr. Manuel Soares da Silva Bezerra", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Dragão do Mar, João Cordeiro, José Marrocos, Antônio Sales, Juvenal Galeno",
    historicalContext:"Fortaleza dos anos 1880-90: epicentro do abolicionismo e do movimento literário da Padaria Espiritual. A Grande Seca de 1877 havia deslocado populações inteiras.",
    actions:"Poeta, cronista, historiador e geógrafo. Co-fundador do jornal abolicionista O Libertador (1881). Um dos 'Três Poetas da Abolição'. Co-fundador do Instituto do Ceará (04/03/1887). Membro fundador da Padaria Espiritual como 'André Carnaúba'. Obras históricas: Descrição da Cidade de Fortaleza (1895), O Ceará e os Cearenses (1906), Algumas Origens do Ceará (1918).",
    helpers:"José Marrocos, João Cordeiro, Antônio Sales, Juvenal Galeno",
    consequences:"O Instituto do Ceará, que co-fundou, é ainda hoje a mais importante instituição histórica do estado. O jornal O Libertador foi arma decisiva na campanha abolicionista.",
    legacy:"Patrono da Cadeira 4 da Academia Cearense de Letras. Sua Descrição da Cidade de Fortaleza é fonte histórica primária insubstituível para pesquisadores.",
  },
  {
    id:15, name:"Juvenal Galeno", nickname:"O Cantor do Povo Cearense",
    birth:"27/09/1836", death:"07/03/1931", birthPlace:"Fortaleza (CE)", deathPlace:"Fortaleza (CE)",
    period:"Imperial", category:"Literário",
    family:{ parents:"José Antônio da Costa e Silva e Maria do Carmo Teófilo e Silva", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"José de Alencar, Antônio Sales, Antônio Bezerra, Patativa do Assaré (a quem abençoou em 1928)",
    historicalContext:"Viveu todo o Romantismo, o Naturalismo, a República e o início do Modernismo. Com 95 anos, foi o elo vivo entre o séc. XIX e o séc. XX cultural cearense.",
    actions:"Publicou o primeiro livro de contos do Ceará: Cenas Populares (1871). Obras: Prelúdios Poéticos (1856), Lendas e Canções Populares (1865). Diretor da Biblioteca Pública Estadual (1889-1908). Padeiro-Mór honorário da Padaria Espiritual. Co-fundador do Instituto do Ceará. Em 1928 conheceu e abençoou o jovem Patativa do Assaré.",
    helpers:"José de Alencar (influência literária); Antônio Sales (Padaria Espiritual)",
    consequences:"Abriu o caminho para a poesia de temática popular no Ceará, ligando o Romantismo à tradição oral sertaneja que Patativa do Assaré desenvolveria plenamente.",
    legacy:"Patrono da Cadeira 23 da Academia Cearense de Letras. Considerado por Antônio Sales 'o primeiro poeta abolicionista do Brasil'. A Casa de Juvenal Galeno, em Fortaleza, é tombada.",
  },
  {
    id:16, name:"José Marrocos", nickname:"O Intelectual de Juazeiro",
    birth:"26/11/1842", death:"14/08/1910", birthPlace:"Crato (CE)", deathPlace:"Juazeiro do Norte (CE)",
    period:"Imperial", category:"Literário",
    family:{ parents:"Padre (não nomeado) e mulher liberta", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Padre Cícero, Antônio Bezerra, João Cordeiro",
    historicalContext:"Juazeiro no início do séc. XX era o maior centro de romaria do Nordeste, gerando disputas entre poder eclesiástico e poder civil. O 'Milagre da Hóstia' (1889) havia catalisado a fama de Padre Cícero.",
    actions:"Expulso do Seminário da Prainha (1868) por sua origem humilde. Dirigiu o Colégio Padre Ibiapina (Crato), onde Padre Cícero lecionou latim em 1871. Co-fundou O Libertador (1881). Em 1908 mudou-se para Juazeiro, fundou o jornal O Rebate e defendeu a emancipação municipal.",
    helpers:"Padre Cícero, Antônio Bezerra, João Cordeiro",
    consequences:"Sua defesa da emancipação contribuiu para a criação do município de Juazeiro (1911). Sua divulgação do milagre da hóstia catalisou o crescimento de Juazeiro como centro de romaria.",
    legacy:"Elo entre o abolicionismo do litoral e o messianismo do interior cearense. Primo e aliado intelectual fundamental de Padre Cícero.",
  },
  {
    id:17, name:"Antônio Conselheiro", nickname:"Antônio Vicente Mendes Maciel",
    birth:"13/03/1830", death:"22/09/1897", birthPlace:"Quixeramobim (CE)", deathPlace:"Canudos (BA)",
    period:"República Velha", category:"Religioso/Social",
    family:{ parents:"Vicente Mendes Maciel (comerciante) e Maria Joaquina de Jesus", spouse:"Brasilina Laurentina de Lima (1857, ela o abandonou)", children:"Nenhum documentado" },
    contemporaries:"Marechal Deodoro, Floriano Peixoto, Presidente Prudente de Morais, Euclides da Cunha",
    historicalContext:"A Proclamação da República (1889) trouxe separação Estado-Igreja, novo registro civil e taxação, vistos por sertanejos como ataques à fé. A Grande Seca de 1877-79 havia deslocado centenas de milhares. A questão fundiária e a miséria crônica do Nordeste eram explosivas.",
    actions:"Peregrino que percorreu o Nordeste por décadas, erguendo 21 igrejas e cemitérios. Em 1893 fundou o Arraial de Belo Monte (Canudos) no sertão baiano — comunidade igualitária com ~25.000 habitantes, o maior aglomerado humano do interior da Bahia. Resistiu a 4 expedições militares (1896-97). Morreu de disenteria durante o cerco final.",
    helpers:"Seguidores conselheiristas: ex-escravizados, retirantes da seca, camponeses sem terra",
    consequences:"A Guerra de Canudos expôs as contradições da jovem República: militarismo, exclusão social, intolerância religiosa. Euclides da Cunha publicou Os Sertões (1902), obra fundadora do pensamento social brasileiro, a partir de Canudos.",
    legacy:"Mártir da resistência sertaneja. Imortalizou-se em Os Sertões. Referência central em messianismo, movimentos sociais e identidade nordestina. Sua cabeça foi decapitada e enviada à Faculdade de Medicina da Bahia — exemplo do racismo científico do séc. XIX.",
  },
  {
    id:18, name:"Padre Cícero Romão Batista", nickname:"Padim Ciço",
    birth:"24/03/1844", death:"20/07/1934", birthPlace:"Crato (CE)", deathPlace:"Juazeiro do Norte (CE)",
    period:"República Velha", category:"Religioso/Social",
    family:{ parents:"Joaquim Romão Batista (comerciante) e Joaquina Vicência Romana ('Dona Quinô')", spouse:"Nunca casou (sacerdote)", children:"Nenhum" },
    contemporaries:"José Marrocos, Floro Bartolomeu, Lampião (encontro em 1926), Dom Joaquim José Vieira, Rodolfo Teófilo",
    historicalContext:"O Nordeste vivia a transição Império-República, secas catastróficas e fenômeno messiânico generalizado. A Igreja buscava reafirmar autoridade após separação Estado-Igreja (1889). O cangaço era força política real no sertão.",
    actions:"Ordenado padre (1870), fixou-se em Juazeiro em 1872. O 'Milagre da Hóstia' (1889) transformou Juazeiro em centro de romaria. Suspenso pela Igreja (1894), foi a Roma (1898). Primeiro prefeito de Juazeiro (1911). Liderou a Sedição de Juazeiro (1913-14). Articulou o Pacto dos Coronéis. Encontrou-se com Lampião em março de 1926.",
    helpers:"José Marrocos (aliado intelectual), Floro Bartolomeu (aliado político), beata Maria de Araújo (central no milagre), romeiros e beatos que construíram Juazeiro",
    consequences:"Juazeiro do Norte tornou-se a maior cidade do interior do Ceará e um dos maiores centros de peregrinação do Brasil (2 milhões de romeiros/ano). Reabilitado pela Igreja em 2015; processo de beatificação aberto pelo Vaticano em 2022.",
    legacy:"O mais venerado personagem do imaginário nordestino. Seu legado é ambivalente: deu dignidade ao sertanejo e ao mesmo tempo articulou o coronelismo conservador do sertão.",
  },
  {
    id:19, name:"Capistrano de Abreu", nickname:"Príncipe dos Historiadores Brasileiros",
    birth:"23/10/1853", death:"13/08/1927", birthPlace:"Sítio Columinjuba, Maranguape (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"República Velha", category:"Científico/Histórico",
    family:{ parents:"Agricultores de Maranguape", spouse:"Ana Alexandrina de Abreu", children:"Não documentados" },
    contemporaries:"Euclides da Cunha, Rui Barbosa, Joaquim Nabuco, José de Alencar (que conheceu em 1874, em Maranguape)",
    historicalContext:"O Brasil da virada do século revisava criticamente sua história colonial. Abolição (1888) e República (1889) exigiam novas narrativas nacionais. As instituições científicas se consolidavam no Rio de Janeiro.",
    actions:"Fundador da Academia Francesa de Fortaleza (1872). Bibliotecário da Biblioteca Nacional (1879). Professor catedrático de Corografia e História do Brasil no Colégio Pedro II. Membro do IHGB. Recusou vaga na ABL. Obras: Capítulos de História Colonial (1934 póstumo), Caminhos Antigos e Povoamento do Brasil (1930), O Descobrimento do Brasil (1929). Pesquisou línguas indígenas, deixando gramática da língua caxinauá.",
    helpers:"Ramiz Galvão (diretor da BN que o contratou); Editora Garnier; José de Alencar (que encontrou em 1874)",
    consequences:"Sua metodologia crítica — rigor documental, comparação de fontes — fundou a historiografia científica moderna no Brasil. Capítulos de História Colonial é referência obrigatória até hoje.",
    legacy:"A Biblioteca Pública Municipal de Maranguape leva seu nome. Seu método historiográfico é o paradigma da ciência histórica no Brasil. O apodo 'Príncipe dos Historiadores' é o mais justo da cultura cearense.",
  },
  {
    id:20, name:"Rodolfo Teófilo", nickname:"O Farmacêutico do Povo",
    birth:"08/02/1853", death:"30/08/1932", birthPlace:"Salvador (BA) — radicado no Ceará desde jovem", deathPlace:"Fortaleza (CE)",
    period:"República Velha", category:"Científico/Histórico",
    family:{ parents:"Não documentados", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Antônio Bezerra, João Cordeiro, Antônio Sales, Capistrano de Abreu",
    historicalContext:"O Ceará foi devastado pela Grande Seca de 1877-79 (~400 mil mortos) e pela epidemia de varíola de 1900-04. O Estado era incapaz de responder. O movimento abolicionista articulava a resistência popular.",
    actions:"Farmacêutico e escritor. Abolicionista ativo, membro da Sociedade Cearense Libertadora. Vacinou pessoalmente mais de 2.000 pessoas contra a varíola durante a epidemia de 1900-04, enquanto o governo recusava a vacina obrigatória. Obras: A Fome (1890, sobre a seca de 1877), O Paroara (1899).",
    helpers:"João Cordeiro, Antônio Bezerra; as populações vulneráveis que aceitaram a vacinação",
    consequences:"Sua vacinação massiva foi decisiva no controle da epidemia de varíola no Ceará. A Fome (1890) é o primeiro grande romance naturalista nordestino, precursor direto de Rachel de Queiroz.",
    legacy:"Herói da saúde pública e pioneiro do romance nordestino. A Rua Rodolfo Teófilo, em Fortaleza, homenageia sua memória.",
  },
  {
    id:21, name:"Antônio Sales", nickname:"Moacir Jurema (Padaria Espiritual)",
    birth:"13/12/1868", death:"05/02/1940", birthPlace:"Icó (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"República Velha", category:"Literário",
    family:{ parents:"Não documentados", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Antônio Bezerra, Rodolfo Teófilo, Adolfo Caminha, Capistrano de Abreu",
    historicalContext:"Fortaleza de 1892 era pequena capital em ebulição: jovens intelectuais queriam romper com o Romantismo e o clericalismo, inspirados pelo Positivismo e pela recém-proclamada República.",
    actions:"Fundou a Padaria Espiritual (30/05/1892) com Lopes Filho no Café Java, Fortaleza — primeiro movimento modernista do Nordeste. O grupo reunia Adolfo Caminha (Bom-Crioulo), Rodolfo Teófilo, Lívio Barreto. Publicaram o periódico O Pão. Considerou Juvenal Galeno 'o primeiro poeta abolicionista do Brasil'. Obras: Trovas e Fantasia (1889), Aves de Arribação (1910).",
    helpers:"Rodolfo Teófilo, Adolfo Caminha, Lopes Filho; Juvenal Galeno (patrono honorário)",
    consequences:"A Padaria Espiritual antecipou em 30 anos o espírito da Semana de Arte Moderna de 1922. No seu contexto, Adolfo Caminha publicou Bom-Crioulo (1895) — primeiro romance com personagem homossexual protagonista do Brasil.",
    legacy:"Fundador do primeiro movimento literário modernista do Nordeste. A Padaria Espiritual é referência fundacional da literatura cearense moderna.",
  },
  {
    id:22, name:"Gustavo Barroso", nickname:"João do Norte",
    birth:"29/12/1888", death:"03/12/1959", birthPlace:"Fortaleza (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"República Velha", category:"Literário",
    family:{ parents:"Antônio Filinto Barroso e Ana Dodt Barroso (alemã de Württemberg)", spouse:"Não documentada com certeza", children:"Não documentados" },
    contemporaries:"Euclides da Cunha, Plínio Salgado, Getúlio Vargas, Rachel de Queiroz",
    historicalContext:"A República Velha e a Era Vargas foram palco do movimento integralista e da afirmação do folclore como identidade nacional. O Brasil debatia modernismo, fascismo e identidade. O antissemitismo europeu chegava ao Brasil via integralismo.",
    actions:"Primeiro diretor do Museu Histórico Nacional. Presidente da ABL (1932-33, 1949-50). Autor de 128 livros: folclore, história, ficção. Obras positivas: Terra de Sol (1912), Brasil Místico (1923). Lado sombrio: traduziu Os Protocolos dos Sábios de Sião, escreveu obras antissemitas, foi ideólogo da Ação Integralista Brasileira (1933). Preso após o levante integralista de 1938.",
    helpers:"Plínio Salgado (integralismo); Editora Garnier; mecenas do Estado",
    consequences:"O Museu Histórico Nacional, que fundou, é ainda a principal coleção de história material do Brasil. Seu integralismo e antissemitismo mancharam permanentemente sua herança intelectual.",
    legacy:"Figura contraditória: genial folclorista e museólogo que construiu a memória nacional, e ao mesmo tempo propagandista fascista e antissemita. Exige contextualização crítica obrigatória.",
  },
  {
    id:23, name:"Rachel de Queiroz", nickname:"A Dama da Literatura Brasileira",
    birth:"17/11/1910", death:"04/11/2003", birthPlace:"Fortaleza (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"Século XX", category:"Literário",
    family:{ parents:"Daniel de Queiroz Lima (advogado) e Clotilde Franklin de Queiroz", spouse:"José Auto da Cruz Oliveira (1932-39); Oyama de Macedo (1940-1982)", children:"Nenhum biológico" },
    contemporaries:"Graciliano Ramos, Jorge Amado, José Lins do Rego, Drummond, Caio Prado Jr.",
    historicalContext:"A Geração de 30 reagia à Semana de Arte Moderna. O Estado Novo (1937-45) censurou obras. A ABL era clube exclusivamente masculino. O PCB atraía jovens intelectuais. As secas nordestinas expulsavam populações.",
    actions:"Estreou com O Quinze (1930, aos 20 anos) sobre a seca de 1915. Militou no PCB e rompeu. Presa 3 meses no Estado Novo; livros queimados na Bahia. Obras: João Miguel (1932), As Três Marias (1939), Dôra Doralina (1975), Memorial de Maria Moura (1992). Primeira mulher eleita para a ABL (04/08/1977, Cadeira 5). Primeira mulher a receber o Prêmio Camões (1993).",
    helpers:"Graciliano Ramos (reconhecimento literário mútuo); editoras e críticos que venceram o preconceito de gênero; Oyama de Macedo",
    consequences:"Abriu as portas da ABL para mulheres. Fundou o romance regionalista feminino. Memorial de Maria Moura adaptado para TV Globo (1994). Centro Cultural Rachel de Queiroz em Quixadá.",
    legacy:"Símbolo da resistência feminina e literária. A primeira a quebrar a barreira de gênero nas mais altas instituições literárias do país.",
  },
  {
    id:24, name:"Patativa do Assaré", nickname:"Antônio Gonçalves da Silva / O Rouxinol dos Sertões",
    birth:"05/03/1909", death:"08/07/2002", birthPlace:"Serra de Santana, Assaré (CE)", deathPlace:"Assaré (CE)",
    period:"Século XX", category:"Literário",
    family:{ parents:"Pedro Gonçalves da Silva e Maria Pereira da Silva (agricultores)", spouse:"Isabel Rodrigues da Silva ('Dona Belinha')", children:"9 filhos" },
    contemporaries:"Juvenal Galeno (que o abençoou em 1928), Luiz Gonzaga, Rachel de Queiroz, Fagner, Raymond Cantel (pesquisador da Sorbonne)",
    historicalContext:"O Nordeste do séc. XX vivia êxodo rural, secas devastadoras, desigualdade fundiária e ditadura militar (1964-85). As Ligas Camponesas agitavam o campo. A MPB levava a cultura nordestina às grandes cidades.",
    actions:"Apenas 4 meses de escola formal. Cego de um olho desde criança. Apelido dado pelo jornalista José Carvalho (1928). Obras: Inspiração Nordestina (1956), Cante Lá que Eu Canto Cá (1978), Ispinho e Fulô (1988). 'Triste Partida' imortalizada por Luiz Gonzaga. Apoiou as Ligas Camponesas e resistiu à ditadura. Fagner produziu seu LP em 1979. Doutor Honoris Causa pela URCA, UECE e UFC.",
    helpers:"Juvenal Galeno (bênção literária em 1928); Fagner (produtor, 1979); Raymond Cantel (pesquisador da Sorbonne que o estudou e difundiu na Europa)",
    consequences:"Tornou a literatura de cordel e a poesia popular nordestina reconhecidas internacionalmente. Seus versos são referência nos estudos de cultura popular brasileira e são estudados em universidades europeias.",
    legacy:"O maior poeta popular do Brasil. Símbolo absoluto da sabedoria sertaneja que prescinde de diploma para alcançar a grandeza.",
  },
  {
    id:25, name:"Dom Hélder Câmara", nickname:"Bispo das Favelas / Arcebispo Vermelho",
    birth:"07/02/1909", death:"27/08/1999", birthPlace:"Fortaleza (CE)", deathPlace:"Recife (PE)",
    period:"Século XX", category:"Religioso/Social",
    family:{ parents:"João Eduardo Torres Câmara Filho (jornalista, maçom) e Adelaide Pessoa Câmara (professora)", spouse:"Nunca casou (sacerdote)", children:"Nenhum biológico — discípulo espiritual: Frei Tito" },
    contemporaries:"Papa João XXIII, Papa Paulo VI, Frei Tito, João Goulart, General Médici, Che Guevara, Martin Luther King",
    historicalContext:"A ditadura militar (1964-85) torturava e assassinava opositores. O Concílio Vaticano II (1962-65) abria a Igreja ao diálogo social. A Teologia da Libertação nascia na América Latina.",
    actions:"Ordenado padre aos 22. Entrou na Ação Integralista e rompeu em 1937. Co-fundou a CNBB (1952) e o CELAM (1955). Arcebispo de Olinda e Recife (1964-1985), durante toda a ditadura. Articulou o Pacto das Catacumbas (1965) no Vaticano II. Em 1969 seu assistente Padre Antônio Henrique foi assassinado; sua casa foi metralhada. Indicado ao Nobel da Paz 4 vezes — o regime bloqueou todas.",
    helpers:"Papa João XXIII, Papa Paulo VI; bispos latinoamericanos; Jean-Paul Sartre (que o defendeu publicamente); intelectuais europeus",
    consequences:"A Teologia da Libertação, que ajudou a formular, inspirou movimentos sociais em toda a América Latina. Processo de beatificação aberto em 2015 (Servo de Deus).",
    legacy:"Sua frase sobre pobres e comunistas resume a contradição do poder. Símbolo mundial dos direitos humanos e da Igreja dos Pobres. Um dos maiores cearenses de todos os tempos.",
  },
  {
    id:26, name:"Frei Tito de Alencar Lima", nickname:"Mártir da Ditadura",
    birth:"14/09/1945", death:"10/08/1974", birthPlace:"Fortaleza (CE)", deathPlace:"Éveux, Lyon (França)",
    period:"Século XX", category:"Religioso/Social",
    family:{ parents:"Ildefonso Rodrigues de Lima e Laura de Alencar Lima (descendente da família Alencar)", spouse:"Nunca casou (frade dominicano)", children:"Nenhum" },
    contemporaries:"Dom Hélder Câmara, Frei Betto, Carlos Marighella, General Emílio Médici, delegado Sérgio Paranhos Fleury",
    historicalContext:"O AI-5 (1968) inaugurou o período mais brutal da ditadura militar. A OBAN e o DOPS torturavam sistematicamente. O movimento estudantil resistia. As ordens religiosas abrigavam militantes.",
    actions:"Preso no 30º Congresso da UNE em Ibiúna (12/10/1968). Preso pela 2ª vez (04/11/1969) pelo delegado Fleury com Frei Betto. Torturado no DOPS e OBAN: pau de arara, choques elétricos, queimaduras, palmatória. Sua carta-denúncia do Presídio Tiradentes foi um dos primeiros registros públicos da tortura no Brasil. Banido para o Chile em 1971 (trocado pelo embaixador suíço). Exilado na Itália e França. Suicidou-se em 10/08/1974, aos 28 anos, consequência das sequelas da tortura.",
    helpers:"Frei Betto (companheiro de prisão), Dom Hélder Câmara (defensor público), solidariedade de religiosos europeus, movimento pelos presos políticos brasileiros",
    consequences:"Sua carta-denúncia internacionalizou a informação sobre a tortura no Brasil. Em 2021, rua paulistana que homenageava Fleury foi rebatizada com seu nome. Lei 13.148/2015 concedeu pensão a herdeiros.",
    legacy:"Mártir oficial da Ditadura Militar. Descendente da família Alencar — o ciclo histórico se fecha: da Bárbara de Alencar (1760) ao Frei Tito (1945), a mesma família lutou pela liberdade por dois séculos.",
  },
  {
    id:27, name:"Belchior", nickname:"Antônio Carlos Gomes Belchior",
    birth:"26/10/1946", death:"30/04/2017", birthPlace:"Sobral (CE)", deathPlace:"Santa Cruz do Sul (RS)",
    period:"Século XX", category:"Musical",
    family:{ parents:"Otávio Belchior Fernandes e Dolores Gomes Fontenele Fernandes", spouse:"Não documentada publicamente", children:"Um dos 22 irmãos; filhos não documentados" },
    contemporaries:"Fagner, Ednardo, Elis Regina, Caetano Veloso, Chico Buarque",
    historicalContext:"O Brasil dos anos 70 vivia a ditadura e a censura. O 'Pessoal do Ceará' levava a identidade nordestina ao circuito nacional. A MPB era espaço de resistência cultural.",
    actions:"Abandonou Medicina (UFC) pela música. Venceu o IV Festival Universitário da MPB (1971). Compôs com Fagner 'Mucuripe' (Elis Regina e Roberto Carlos). Álbum Alucinação (1976): 'Apenas um Rapaz Latino-Americano', 'Como Nossos Pais', 'A Palo Seco'. Viveu recluso de 2007 até a morte em 2017.",
    helpers:"Fagner (parceiro musical desde os anos 70); Elis Regina (que gravou e imortalizou 'Como Nossos Pais' em Falso Brilhante, 1975); Bar do Anísio (espaço de encontro)",
    consequences:"Alucinação é considerado um dos 10 maiores álbuns da MPB. 'Como Nossos Pais' tornou-se hino geracional da juventude brasileira dos anos 70-80.",
    legacy:"O poeta da juventude desiludida. Sua obra é referência sobre identidade, rebeldia e nordestinidade na MPB.",
  },
  {
    id:28, name:"Fagner", nickname:"Raimundo Fagner Cândido Lopes",
    birth:"13/10/1949", death:"—", birthPlace:"Orós (CE)", deathPlace:"—",
    period:"Século XX", category:"Musical",
    family:{ parents:"José Fares (imigrante libanês) e Francisca Cândido Lopes", spouse:"Várias relações", children:"Documentados, não identificados" },
    contemporaries:"Belchior, Ednardo, Elis Regina, Zé Ramalho, Elba Ramalho",
    historicalContext:"Ditadura militar e contracultura brasileira dos anos 70. A CBS foi palco de uma revolução musical nordestina. O Nordeste descobria sua voz no mainstream.",
    actions:"Venceu o IV Festival de Música Popular do Ceará (1968). Com Belchior ganhou o Festival Universitário do CEUB em Brasília (1971) com 'Mucuripe'. Produtor na CBS nos anos 70: abriu espaço para Zé Ramalho, Elba Ramalho, Amelinha. Discografia: Manera Fru-Fru Manera (1973), Orós (1977, dir. musical de Hermeto Pascoal). Mais de 50 anos de carreira ativa.",
    helpers:"Belchior (parceiro), Hermeto Pascoal (colaborador musical), CBS Records",
    consequences:"A produção de Fagner na CBS nos anos 70 é a base do que se chamou 'geração de ouro' do Nordeste na MPB. Abriu as portas para múltiplos artistas nordestinos.",
    legacy:"Um dos maiores intérpretes da MPB. Guardião da identidade musical cearense no cenário nacional por mais de cinco décadas.",
  },
  {
    id:29, name:"Ednardo", nickname:"José Ednardo Soares Costa Sousa",
    birth:"17/04/1945", death:"—", birthPlace:"Fortaleza (CE)", deathPlace:"—",
    period:"Século XX", category:"Musical",
    family:{ parents:"Não documentados", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Belchior, Fagner, Rodger Rogério, Téti, Fausto Nilo",
    historicalContext:"Fortaleza dos anos 70 resistia culturalmente à ditadura. O Bar do Anísio, na Praia do Mucuripe, era o ponto de encontro do Pessoal do Ceará.",
    actions:"Engenheiro Químico pela UFC. Com Rodger Rogério e Téti lançou o LP fundador Meu Corpo Minha Embalagem Todo Gasto na Viagem — Pessoal do Ceará (Continental, 1973). Autor de 'Pavão Mysteriozo', 'Terral', 'Beira-Mar'. Organizou o Massafeira Livre (1979) no Theatro José de Alencar, reunindo 400 artistas.",
    helpers:"Rodger Rogério, Téti, Fausto Nilo (co-integrantes); Bar do Anísio (espaço cultural)",
    consequences:"O LP de 1973 fundou o 'Pessoal do Ceará' como movimento coletivo, abrindo espaço para toda a geração de músicos nordestinos na MPB.",
    legacy:"Fundador do movimento musical que levou a identidade cearense ao centro da MPB nacional.",
  },
  {
    id:30, name:"Chico Anysio", nickname:"Francisco Anysio de Oliveira Paula Filho",
    birth:"12/04/1931", death:"23/03/2012", birthPlace:"Maranguape (CE)", deathPlace:"Rio de Janeiro (RJ)",
    period:"Século XX", category:"Teatro/Cultural",
    family:{ parents:"Francisco Anysio (empresário de ônibus) e Haydée Viana de Oliveira Paula", spouse:"6 casamentos (incluindo a ex-ministra Zélia Cardoso de Mello, 1992-98)", children:"8 filhos: Bruno Mazzeo, Lug de Paula, Nizo Neto, entre outros" },
    contemporaries:"Dercy Gonçalves, Carlos Lyra, Tom Jobim, Paulo Gracindo, Mussum",
    historicalContext:"A TV brasileira nasceu nos anos 50 e tornou-se o principal veículo cultural do país. O humor era forma de resistência sutil e de coesão popular na ditadura.",
    actions:"Criou 209 personagens ao longo da carreira (conforme declarou em entrevista ao Fantástico, 2011). Principais: Professor Raimundo, Justo Veríssimo, Painho, Pantaleão, Salomé, Alberto Roberto, Bento Carneiro. Marcou gerações com o Show do Anysio (TV Globo) e o Chico Anysio Show.",
    helpers:"Rede Globo (principal palco); Paulo Gracindo (mentor)",
    consequences:"Formou uma escola de humor nacional. Seus filhos Bruno Mazzeo, Nizo Neto e Lug de Paula deram continuidade à tradição cômica familiar.",
    legacy:"O maior comediante da história da TV brasileira. A criação de 209 personagens é recorde nacional documentado pelo RankBrasil.",
  },
  {
    id:31, name:"Oswald Barroso", nickname:"O Mestre do Teatro Popular Cearense",
    birth:"23/12/1947", death:"22/03/2024", birthPlace:"Fortaleza (CE)", deathPlace:"Fortaleza (CE)",
    period:"Século XX", category:"Teatro/Cultural",
    family:{ parents:"Antônio Girão Barroso (poeta e jornalista) e Alba Cavalcante Barroso", spouse:"Não documentada", children:"Não documentados" },
    contemporaries:"Belchior, Fagner, Ednardo, Rachel de Queiroz, Patativa do Assaré",
    historicalContext:"O teatro popular como resistência cultural na ditadura militar. A cultura popular cearense — congos, reisados, maracatus — estava ameaçada pelo processo de urbanização e homogeneização cultural.",
    actions:"Preso e censurado durante a ditadura. Diretor do Theatro José de Alencar (1989-91) e do MIS-CE (1998-2002). Professor da UECE por 31 anos. Doutor em Sociologia (UFC), pós-doutor em Teatro (UniRio). Obras: Reis de Congo — Teatro Popular Tradicional (1997), Ceará Mestiço (2019). Folclorista Emérito (2008).",
    helpers:"Artistas do Massafeira Livre (1979); UECE e UFC (base acadêmica e pesquisa)",
    consequences:"Preservou e sistematizou as tradições teatrais populares cearenses — congos, reisados, maracatus. Suas pesquisas sobre cultura afro-brasileira no Ceará são fontes primárias insubstituíveis.",
    legacy:"Referência do teatro popular nordestino. Suas obras são base obrigatória dos estudos de cultura popular e afro-brasileira no Ceará.",
  },
];

const PERIOD_META: Record<string, { accent: string; tagBg: string; tagText: string }> = {
  "Colonial":        { accent:"#EF9F27", tagBg:"#FAC775", tagText:"#633806" },
  "Imperial":        { accent:"#7F77DD", tagBg:"#CECBF6", tagText:"#3C3489" },
  "República Velha": { accent:"#1D9E75", tagBg:"#9FE1CB", tagText:"#085041" },
  "Século XX":       { accent:"#378ADD", tagBg:"#B5D4F4", tagText:"#0C447C" },
};

const CAT_ICON: Record<string, string> = {
  "Militar":                "ti-sword",
  "Literário":              "ti-book-2",
  "Político/Revolucionário":"ti-flag-2",
  "Religioso/Social":       "ti-church",
  "Abolicionista":          "ti-heart-handshake",
  "Musical":                "ti-music",
  "Teatro/Cultural":        "ti-masks-theater",
  "Científico/Histórico":   "ti-microscope",
  "Indígena":               "ti-tree",
};

const SECTIONS = [
  { icon:"ti-users",           label:"Contemporâneos",                        key:"contemporaries"   as const },
  { icon:"ti-world",           label:"Contexto histórico — o que acontecia",  key:"historicalContext" as const },
  { icon:"ti-bolt",            label:"Ações e contribuições",                 key:"actions"           as const },
  { icon:"ti-heart-handshake", label:"Pessoas que os ajudaram",               key:"helpers"           as const },
  { icon:"ti-leaf",            label:"Consequências e frutos",                key:"consequences"      as const },
  { icon:"ti-star",            label:"Por que ficou marcado",                 key:"legacy"            as const },
];

export default function HeroisDoCeara() {
  const [selected, setSelected] = useState<Hero | null>(null);
  const [search,   setSearch]   = useState("");
  const [period,   setPeriod]   = useState("todos");
  const [category, setCategory] = useState("todas");

  const periods    = ["todos","Colonial","Imperial","República Velha","Século XX"];
  const categories = ["todas","Militar","Literário","Político/Revolucionário","Religioso/Social","Abolicionista","Musical","Teatro/Cultural","Científico/Histórico","Indígena"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return heroes.filter(h => {
      const ms = q === "" || h.name.toLowerCase().includes(q) || h.nickname.toLowerCase().includes(q);
      const mp = period === "todos" || h.period === period;
      const mc = category === "todas" || h.category === category;
      return ms && mp && mc;
    });
  }, [search, period, category]);

  const pm = (h: Hero) => PERIOD_META[h.period] || PERIOD_META["Colonial"];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <header className="mb-8">
          <a href="/" className="text-sm text-gray-400 hover:text-white mb-4 inline-flex items-center gap-1">
            <i className="ti ti-arrow-left" style={{fontSize:14}} />
            Voltar
          </a>
          <h1 style={{fontSize:26,fontWeight:600,margin:"0 0 4px",color:"var(--color-text-primary)"}}>
            Heróis Cearenses
          </h1>
          <p style={{fontSize:14,color:"var(--color-text-secondary)",margin:0}}>
            {filtered.length} de {heroes.length} fichas · clique em qualquer card para abrir a ficha completa
          </p>
        </header>

        {/* Filtros */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:"1.5rem"}}>
          <input
            type="text"
            placeholder="Buscar herói ou apelido…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex:"2 1 200px", minWidth:160,
              background:"var(--color-background-secondary)",
              border:"0.5px solid var(--color-border-tertiary)",
              borderRadius:"var(--border-radius-md)",
              padding:"8px 12px", fontSize:13,
              color:"var(--color-text-primary)",
              outline:"none",
            }}
          />
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{
              flex:"1 1 160px",
              background:"var(--color-background-secondary)",
              border:"0.5px solid var(--color-border-tertiary)",
              borderRadius:"var(--border-radius-md)",
              padding:"8px 12px", fontSize:13,
              color:"var(--color-text-primary)",
            }}
          >
            {periods.map(p => (
              <option key={p} value={p}>{p === "todos" ? "Todos os períodos" : p}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              flex:"1 1 200px",
              background:"var(--color-background-secondary)",
              border:"0.5px solid var(--color-border-tertiary)",
              borderRadius:"var(--border-radius-md)",
              padding:"8px 12px", fontSize:13,
              color:"var(--color-text-primary)",
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === "todas" ? "Todas as categorias" : c}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 && (
          <p style={{color:"var(--color-text-secondary)",fontSize:14,padding:"3rem 0",textAlign:"center"}}>
            Nenhum herói encontrado com esses filtros.
          </p>
        )}

        {/* Grid de cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:selected ? 16 : 0}}>
          {filtered.map(h => {
            const m = pm(h);
            const active = selected?.id === h.id;
            return (
              <div
                key={h.id}
                onClick={() => setSelected(active ? null : h)}
                style={{
                  background:"var(--color-background-primary)",
                  border: active ? `2px solid ${m.accent}` : "0.5px solid var(--color-border-tertiary)",
                  borderLeft:`4px solid ${m.accent}`,
                  borderRadius:"var(--border-radius-lg)",
                  padding:"12px 14px",
                  cursor:"pointer",
                  transition:"border-color 0.15s",
                }}
              >
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <i className={`ti ${CAT_ICON[h.category] || "ti-star"}`}
                    style={{fontSize:16,color:m.accent}} aria-hidden="true" />
                  <span style={{
                    fontSize:10,fontWeight:500,
                    background:m.tagBg, color:m.tagText,
                    padding:"2px 7px",borderRadius:"var(--border-radius-md)",
                  }}>
                    {h.period}
                  </span>
                </div>
                <p style={{fontSize:13,fontWeight:500,margin:"0 0 2px",color:"var(--color-text-primary)",lineHeight:1.35}}>
                  {h.name}
                </p>
                <p style={{fontSize:11,color:"var(--color-text-secondary)",margin:"0 0 3px"}}>
                  {h.birth} — {h.death}
                </p>
                <p style={{fontSize:11,color:"var(--color-text-tertiary)",margin:0}}>{h.category}</p>
              </div>
            );
          })}
        </div>

        {/* Ficha detalhada */}
        {selected && (
          <div style={{
            background:"rgba(0,0,0,0.6)",
            borderRadius:"var(--border-radius-lg)",
            padding:"20px 0 28px",
            marginTop:8,
          }}>
            <div style={{
              background:"var(--color-background-primary)",
              borderRadius:"var(--border-radius-lg)",
              width:"100%", maxWidth:680,
              margin:"0 auto",
              padding:"22px 26px",
              border:`1px solid ${pm(selected).accent}33`,
            }}>

              {/* Cabeçalho da ficha */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{
                      fontSize:10,fontWeight:500,
                      background:pm(selected).tagBg, color:pm(selected).tagText,
                      padding:"2px 8px",borderRadius:"var(--border-radius-md)",
                    }}>
                      {selected.period}
                    </span>
                    <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{selected.category}</span>
                  </div>
                  <h2 style={{fontSize:20,fontWeight:600,margin:"0 0 3px",color:"var(--color-text-primary)"}}>
                    {selected.name}
                  </h2>
                  <p style={{fontSize:13,color:"var(--color-text-secondary)",margin:0,fontStyle:"italic"}}>
                    {selected.nickname}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Fechar ficha"
                  style={{
                    flexShrink:0, marginLeft:12,
                    background:"transparent",
                    border:"0.5px solid var(--color-border-tertiary)",
                    borderRadius:"var(--border-radius-md)",
                    padding:"4px 8px",
                    cursor:"pointer",
                    color:"var(--color-text-secondary)",
                  }}
                >
                  <i className="ti ti-x" style={{fontSize:18}} />
                </button>
              </div>

              {/* Nascimento / Falecimento */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[
                  {label:"Nascimento", value:`${selected.birth} · ${selected.birthPlace}`},
                  {label:"Falecimento", value:`${selected.death} · ${selected.deathPlace}`},
                ].map(item => (
                  <div key={item.label} style={{
                    background:"var(--color-background-secondary)",
                    borderRadius:"var(--border-radius-md)",
                    padding:"8px 12px",
                  }}>
                    <p style={{fontSize:10,color:"var(--color-text-tertiary)",margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"0.04em"}}>
                      {item.label}
                    </p>
                    <p style={{fontSize:12,color:"var(--color-text-primary)",margin:0,fontWeight:500}}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Família */}
              <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:12,marginBottom:14}}>
                <p style={{fontSize:10,fontWeight:500,color:"var(--color-text-tertiary)",
                  margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Família</p>
                {[
                  {k:"Pais",    v:selected.family.parents},
                  {k:"Cônjuge", v:selected.family.spouse},
                  {k:"Filhos",  v:selected.family.children},
                ].map(row => (
                  <div key={row.k} style={{display:"flex",gap:8,fontSize:12,marginBottom:4}}>
                    <span style={{color:"var(--color-text-tertiary)",minWidth:90,flexShrink:0}}>{row.k}:</span>
                    <span style={{color:"var(--color-text-primary)"}}>{row.v}</span>
                  </div>
                ))}
              </div>

              {/* Seções */}
              {SECTIONS.map(sec => (
                <div key={sec.key} style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:12,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <i className={`ti ${sec.icon}`} style={{fontSize:15,color:pm(selected).accent}} aria-hidden="true" />
                    <p style={{fontSize:10,fontWeight:500,color:"var(--color-text-secondary)",
                      margin:0,textTransform:"uppercase",letterSpacing:"0.05em"}}>{sec.label}</p>
                  </div>
                  <p style={{fontSize:13,color:"var(--color-text-primary)",margin:0,lineHeight:1.7}}>
                    {selected[sec.key]}
                  </p>
                </div>
              ))}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
