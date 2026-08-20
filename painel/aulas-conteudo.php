<?php
declare(strict_types=1);

/**
 * O currículo da formação — felipesmoreira.com/aulas
 *
 * Traduzido do update/Manual-da-Militancia.md para linguagem de quem está
 * chegando, do mesmo jeito que o funcoes.json traduz o jargão interno para o
 * formulário de /quero-ajudar.
 *
 * ORGANIZAÇÃO — Pista Rápida e Pista Lenta:
 *   Cada Dia abre com UMA aula de Pista Rápida (pista => 'rapida'), que é o
 *   caminho macro: quem só fizer as rápidas atravessa a formação inteira e
 *   consegue trabalhar. Depois vêm as Pistas Lentas, que aprofundam ou
 *   reforçam um ponto para quem precisa — sem segurar quem já entendeu.
 *   Aula nova de aprofundamento entra como 'lenta' no Dia certo e pronto: o
 *   caminho principal não muda.
 *
 * POR QUE ISTO É PHP, E NÃO JSON EM src/data:
 *   O site é export estático — tudo que entra no bundle do Next é público.
 *   O manual é documento interno, então o conteúdo sai daqui pelo
 *   api/aulas.php só para quem tem a área 'aulas'. Um .php nunca é servido
 *   como texto: acessar este arquivo pela web devolve página em branco.
 *
 * FASE ELEITORAL:
 *   O manual v1 foi escrito em pré-campanha e só descreve aquele período. O
 *   currículo cobre os dois: a aula 'fases-da-campanha' (Dia 0) tem a tabela do
 *   que muda, e as aulas de Público, Relacional, Divulgação e Roteirista dizem
 *   o que vale em cada fase.
 *
 *   Escreva sempre "antes da campanha" e "durante a campanha", nunca a data de
 *   virada: a data muda a cada eleição, e texto datado envelhece sozinho dentro
 *   de uma aula que ninguém vai reler.
 *
 *   O que não depende de fase — fonte, vivência, crítica sem ofensa, facção
 *   nunca pelo nome, teste do espelho, caixa separado por candidatura — está no
 *   Dia 0 como regra de todos, e não se repete nas aulas de fase.
 *
 * BLOCOS DISPONÍVEIS (o renderizador do site conhece exatamente estes):
 *   texto     — um parágrafo.
 *   passos    — lista numerada.
 *   lista     — lista com marcador, com título opcional.
 *   checklist — referencia um id de checklists.php (não repete o texto).
 *   nunca     — a lista do "Nunca:" do manual, destacada em vermelho.
 *   modelo    — as caixas "Modelo:" / "Forma —", em fonte de máquina.
 *   aviso     — trava que não se negocia.
 *   tabela    — colunas + linhas.
 */

require_once __DIR__ . '/checklists.php';

const CURRICULO = [

/* ============================ DIA 0 ============================ */
[
    'id'     => 'dia-0',
    'numero' => 0,
    'titulo' => 'Comece por aqui',
    'resumo' => 'As regras que valem para todo mundo, de todas as funções. Nenhuma tarefa vence uma regra daqui.',
    'aulas'  => [

    [
        'id'      => 'regras-de-todos',
        'pista'   => 'rapida',
        'titulo'  => 'As regras que valem para todos',
        'resumo'  => 'Seis regras inegociáveis. Se uma tarefa pedir algo que fere uma delas, avise e faça a versão que respeita a regra.',
        'minutos' => 8,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Estas regras vencem qualquer pedido pontual — inclusive um pedido da coordenação. Elas existem porque cada uma delas já derrubou campanha alheia, e não é para derrubar a nossa.'],
            ['tipo' => 'passos', 'itens' => [
                'Fato sem fonte não entra. Toda afirmação factual precisa de fonte primária (ou duas fontes independentes), com link e data. Sem isso, o fato vai para a fila de pendentes, nunca para um roteiro ou uma arte. Nunca invente número, data, nome ou citação.',
                'A vivência é de quem viveu. Ninguém inventa casos, cenas ou episódios da vida de um candidato. Quando o roteiro precisar de vivência, escreva uma ponte genérica marcada com [VIVÊNCIA] e deixe o candidato preencher o caso real.',
                'Crítica à gestão, nunca ofensa pessoal. A crítica é ao modelo e à gestão: o que mudou, onde está o dinheiro, o que poderia ter sido feito. Ataque à vida pessoal gera direito de resposta e queima a campanha.',
                'Nunca pelo ódio. Comunicamos por indignação, contraste, responsabilização, pertencimento e esperança. O objetivo nunca é provar que a cidade fracassou, e sim mostrar que poderia ser diferente.',
                'Segurança: o número caiu, o medo permanece. Ao falar de segurança, contextualize o dado de 2026 com fonte. Nunca cite nome ou apelido de chefe de facção.',
                'Teste do espelho. Antes de publicar, pergunte: este conteúdo sobrevive à resposta do adversário? Se a crítica que fazemos também cabe em nós, reformule ou descarte.',
            ]],
            ['tipo' => 'aviso', 'texto' => 'Na dúvida sobre um fato, um convite ou uma arte, pergunte à coordenação ANTES de publicar. Corrigir depois custa muito mais caro do que esperar meia hora.'],
            ['tipo' => 'texto', 'texto' => 'Estas seis valem em qualquer período. Existe um segundo conjunto de regras que muda conforme a campanha já tenha começado ou não — pedir voto, número de urna, carreata, captação de recurso. Isso está na primeira Pista Lenta abaixo, e vale a leitura mesmo de quem tem pressa.'],
            ['tipo' => 'texto', 'texto' => 'Cada regra acima também tem sua Pista Lenta, com o detalhe de como aplicar. Se você já entendeu, pode seguir direto para o Dia 1 — as lentas ficam aqui para quando precisar.'],
        ],
    ],

    [
        'id'      => 'fases-da-campanha',
        'pista'   => 'lenta',
        'titulo'  => 'Antes da campanha e durante a campanha',
        'resumo'  => 'A lei trata os dois períodos de formas diferentes. O que muda de um para o outro — e o que não muda nunca.',
        'minutos' => 6,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'A legislação eleitoral separa dois períodos. Antes do início oficial da campanha existe a pré-campanha: dá para se apresentar, mostrar trabalho e reunir gente, mas não se pede voto. Depois que a campanha começa, pedir voto é exatamente o que se espera de quem é candidato.'],
            ['tipo' => 'texto', 'texto' => 'Nós estamos no período de campanha. A coluna da pré-campanha fica registrada aqui por dois motivos: material antigo continua circulando e precisa ser lido no contexto em que foi feito, e o movimento volta a viver uma pré-campanha na eleição seguinte.'],
            ['tipo' => 'tabela', 'colunas' => ['O quê', 'Antes da campanha', 'Durante a campanha'], 'linhas' => [
                ['Pedir voto', 'Não. O convite é para acompanhar e participar.', 'Sim — é o que se espera de quem é candidato.'],
                ['Nome e número de urna', 'Fora de arte, faixa e adesivo.', 'Liberados no material.'],
                ['Carreata, adesivaço, bandeiraço', 'Não. Só a versão encontro ou caminhada-conversa.', 'Liberados, respeitando horário e local da legislação eleitoral.'],
                ['Material impresso', 'Institucional, sem número de urna.', 'Material de campanha, dentro do que a lei permite.'],
                ['Captação de recurso', 'Não, em hipótese nenhuma.', 'Só na janela e na forma legal, com prestação de contas.'],
            ]],
            ['tipo' => 'aviso', 'texto' => 'O que NÃO muda de uma fase para a outra: fato sem fonte não entra, a vivência é de quem viveu, a crítica é à gestão e nunca à pessoa, chefe de facção nunca é citado pelo nome, e o caixa de cada candidatura é separado. Campanha começada não afrouxa nenhuma dessas.'],
            ['tipo' => 'texto', 'texto' => 'A regra grossa é a da tabela acima e você já pode trabalhar com ela. A regra fina — o horário exato permitido para um ato, o que cabe num impresso, como uma doação é feita e declarada — muda com o calendário eleitoral e com decisão do juízo eleitoral. Nessas, pergunte à coordenação antes de produzir: refazer sai mais caro que perguntar.'],
        ],
    ],

    [
        'id'      => 'fluxo-da-fonte',
        'pista'   => 'lenta',
        'titulo'  => 'O fluxo da fonte, passo a passo',
        'resumo'  => 'Como um fato sai da internet e chega até um vídeo publicado sem virar boato no caminho.',
        'minutos' => 5,
        'funcoes' => ['olheiro', 'checagem'],
        'ferramenta' => '/painel/fatos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Decore este fluxo. Ele é curto de propósito: são três perguntas, e cada uma tem uma saída clara.'],
            ['tipo' => 'passos', 'itens' => [
                'Achei um fato. Tem link e data das últimas 48h? SIM, segue para checagem. NÃO, vai para pendentes.',
                'A checagem confirmou (abriu o link, conferiu número e data)? SIM, vira [OK CHECADO] e pode virar roteiro ou arte. NÃO, vai para pendentes.',
                'Vai publicar? Cita chefe de facção pelo nome? Corta. Ofende pessoa? Corta. Passa no teste do espelho?',
            ]],
            ['tipo' => 'texto', 'texto' => 'Pendente não é lixo. O fato que não confirmou hoje pode confirmar amanhã, quando sair o documento. Por isso nada é apagado — fica com o motivo anotado.'],
            ['tipo' => 'checklist', 'id' => 'checagem'],
        ],
    ],

    [
        'id'      => 'vivencia',
        'pista'   => 'lenta',
        'titulo'  => 'A vivência é de quem viveu',
        'resumo'  => 'Por que ninguém escreve a história de vida do candidato — e o que escrever no lugar.',
        'minutos' => 4,
        'funcoes' => ['roteirista'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Um roteiro fica muito mais forte quando traz uma cena real: o candidato conta o que viu, onde estava, o que sentiu. A tentação é escrever essa cena por ele, para o texto ficar redondo. Não faça.'],
            ['tipo' => 'texto', 'texto' => 'Vivência inventada é a mentira mais fácil de desmontar que existe: basta uma pessoa que estava lá. E ela desmonta junto tudo que era verdade no mesmo vídeo.'],
            ['tipo' => 'texto', 'texto' => 'O que fazer: escreva a ponte genérica e marque o lugar. O candidato preenche na hora de gravar.'],
            ['tipo' => 'modelo', 'titulo' => 'Como marcar no roteiro', 'linhas' => [
                '[VIVÊNCIA] — aqui o Felipe conta uma vez em que ele viu essa fila de perto.',
                '[VIVÊNCIA] — aqui entra a história do bairro onde ele cresceu, se couber.',
            ]],
            ['tipo' => 'texto', 'texto' => 'Marcar assim tem um segundo ganho: na hora da gravação todo mundo enxerga onde falta a parte que só o candidato pode dar, e ninguém grava pela metade sem perceber.'],
        ],
    ],

    [
        'id'      => 'seguranca-contexto',
        'pista'   => 'lenta',
        'titulo'  => 'Segurança: o número caiu, o medo permanece',
        'resumo'  => 'O tema mais perigoso de errar. Os dois extremos proibidos e como falar do dado sem cair em nenhum.',
        'minutos' => 6,
        'funcoes' => ['olheiro', 'roteirista'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Os indicadores de violência no Ceará caíram em 2026. Esse dado é público e o adversário vai usá-lo. Existem duas maneiras erradas de reagir, e as duas custam caro.'],
            ['tipo' => 'lista', 'titulo' => 'Os dois extremos proibidos', 'itens' => [
                'Dizer que há explosão da violência. Ignora o dado, e qualquer jornalista derruba em dez segundos.',
                'Dizer que melhorou graças à gestão. Credita o governo pelo que ele não fez.',
            ]],
            ['tipo' => 'texto', 'texto' => 'A leitura oficial é uma terceira: a queda deve ser lida como possível efeito de hegemonia de facção, a chamada paz armada — e isso sempre com fonte. O número caiu porque um lado ganhou o território, não porque o Estado chegou. Quem mora lá sabe: o medo continua igual.'],
            ['tipo' => 'aviso', 'texto' => 'Nunca cite nome ou apelido de chefe de facção, em nenhuma peça, nem como exemplo. Isso vale para roteiro, arte, legenda e comentário respondido nas redes.'],
            ['tipo' => 'texto', 'texto' => 'Na prática: sempre que a peça tocar em segurança, ela precisa carregar a fonte do dado na tela, e a frase precisa separar o indicador do sentimento de quem vive ali.'],
        ],
    ],

    [
        'id'      => 'teste-do-espelho',
        'pista'   => 'lenta',
        'titulo'  => 'O teste do espelho',
        'resumo'  => 'Uma pergunta de cinco segundos que evita a maior parte dos estragos.',
        'minutos' => 3,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Antes de publicar qualquer coisa, pergunte: este conteúdo sobrevive à resposta do adversário?'],
            ['tipo' => 'texto', 'texto' => 'É um teste de simetria. Se a crítica que estamos fazendo também cabe em nós — no nosso partido, na nossa coligação, em alguém do nosso lado — a peça não é uma denúncia, é uma armadilha que preparamos para nós mesmos.'],
            ['tipo' => 'lista', 'titulo' => 'Como aplicar em trinta segundos', 'itens' => [
                'Troque o nome do responsável pelo nosso e releia a frase em voz alta.',
                'Se ainda faz sentido acusar, a peça está de pé.',
                'Se ficou constrangedor, reformule mirando o que é específico daquele caso — ou descarte.',
            ]],
            ['tipo' => 'texto', 'texto' => 'Descartar não é desperdício. O fato continua na fila e pode voltar com outro enquadramento, quando tivermos o dado que sustenta a diferença.'],
        ],
    ],

    [
        'id'      => 'nunca-pelo-odio',
        'pista'   => 'lenta',
        'titulo'  => 'Nunca pelo ódio: os motores da comunicação',
        'resumo'  => 'Os cinco motores que usamos no lugar da raiva — e por que a raiva rende menos do que parece.',
        'minutos' => 5,
        'funcoes' => ['roteirista', 'design'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Conteúdo de ódio engaja rápido e cansa mais rápido ainda. Ele junta quem já concordava e afasta exatamente quem a gente precisa convencer. Nós usamos cinco motores.'],
            ['tipo' => 'lista', 'titulo' => 'Os cinco motores', 'itens' => [
                'Indignação: isto não deveria estar acontecendo.',
                'Contraste: o que existe hoje contra o que poderia existir.',
                'Responsabilização: quem decidiu? quem assinou? onde foi o dinheiro?',
                'Pertencimento: isto é sobre o seu bairro, a sua fila, a sua escola.',
                'Esperança: existe caminho, e ele cabe no orçamento que já existe.',
            ]],
            ['tipo' => 'texto', 'texto' => 'A diferença aparece no fechamento. Peça movida a ódio termina na denúncia. A nossa termina apontando o caminho — é por isso que toda denúncia precisa trazer uma alternativa possível.'],
            ['tipo' => 'nunca', 'itens' => [
                'Provar que a cidade fracassou. O objetivo é mostrar que ela poderia ser diferente.',
                'Responder crítica com ofensa pessoal, inclusive nos comentários.',
                'Usar a tragédia de alguém sem que essa pessoa tenha autorizado.',
            ]],
        ],
    ],

    ],
],

/* ============================ DIA 1 ============================ */
[
    'id'     => 'dia-1',
    'numero' => 1,
    'titulo' => 'Como o time se organiza',
    'resumo' => 'Quem faz o quê, em que ritmo e com quais ferramentas. Depois deste dia você sabe a quem entregar o seu trabalho.',
    'aulas'  => [

    [
        'id'      => 'organograma',
        'pista'   => 'rapida',
        'titulo'  => 'Organograma e as duas frentes',
        'resumo'  => 'Somos cerca de 20 pessoas em dois grupos, Comunicação e Eventos. Cada função tem um dono claro, mesmo quando alguém acumula duas.',
        'minutos' => 6,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'A militância começa pequena e cresce. Hoje o time se divide em dois grupos sob a coordenação-geral, e cada grupo tem um responsável que responde à coordenação.'],
            ['tipo' => 'modelo', 'titulo' => 'Organograma', 'linhas' => [
                'COORDENAÇÃO-GERAL (Felipe + 1 vice-coordenador)',
                '│',
                '├── COMUNICAÇÃO (responsável do grupo)',
                '│     Olheiro · Checagem · Roteirista · Design · Editor · Acervo',
                '│',
                '└── EVENTOS (responsável do grupo)',
                '      Local & Hora · Logística · Divulgação · Gravação · Recepção',
            ]],
            ['tipo' => 'tabela', 'colunas' => ['Frente', 'Quantas pessoas'], 'linhas' => [
                ['Coordenação', 'Felipe (coordenador-geral) + 1 vice que cobre os dois grupos'],
                ['Comunicação (~10)', '2 Olheiros · 1 Checagem · 2 Roteiristas · 2 Design · 2 Editores · 1 Acervo'],
                ['Eventos (~8)', '2 Local & Hora · 1 Logística · 2 Divulgação · 1 Gravação · 2 Recepção'],
            ]],
            ['tipo' => 'texto', 'texto' => 'Com o time pequeno, uma pessoa acumula funções sem problema: a Checagem pode ficar com o responsável de Comunicação, o Acervo pode ser do Editor e um Olheiro pode virar Roteirista no mesmo dia. O que não pode é função sem dono — aí ninguém faz e todo mundo acha que alguém fez.'],
            ['tipo' => 'texto', 'texto' => 'Quando o time crescer, separa. A regra é simples: se duas funções acumuladas começam a atrasar uma à outra, chegou a hora de dividir.'],
        ],
    ],

    [
        'id'      => 'cadencia-semanal',
        'pista'   => 'lenta',
        'titulo'  => 'A cadência semanal',
        'resumo'  => 'O ritmo fixo da semana: o que acontece todo dia, na segunda, na quarta e na sexta.',
        'minutos' => 4,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Time pequeno não sobrevive à improvisação. O ritmo abaixo é o mínimo que mantém a produção andando sem ninguém se esgotar.'],
            ['tipo' => 'tabela', 'colunas' => ['Quando', 'O quê'], 'linhas' => [
                ['Todo dia', 'Comunicação: 2 varreduras (manhã e fim de tarde), fatos checados, 1 a 2 roteiros ou artes por dia.'],
                ['Segunda', 'Reunião curta de 20 minutos: pauta da semana, evento do mês, quem faz o quê.'],
                ['Quarta', 'Ponto de evento: confirmar local, material e lista de convidados do próximo encontro.'],
                ['Sexta', 'Balanço: o que saiu, o que engajou, o que ficou pendente. Ajustar.'],
            ]],
            ['tipo' => 'texto', 'texto' => 'A reunião de segunda é curta porque a pauta já chegou pronta: os fatos da semana anterior estão na ferramenta e o quadro de produção mostra o que travou. Reunião longa quase sempre é sintoma de ferramenta vazia.'],
        ],
    ],

    [
        'id'      => 'ferramentas-do-time',
        'pista'   => 'lenta',
        'titulo'  => 'As ferramentas do time e o padrão de nome',
        'resumo'  => 'Onde cada coisa mora: o painel, as pastas na nuvem e o nome de arquivo que faz tudo ser achável.',
        'minutos' => 5,
        'funcoes' => ['acervo'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'O trabalho do dia acontece dentro deste painel: os fatos entram na ferramenta de Fatos, andam no quadro de Produção e os encontros ficam em Eventos. O que sobra para a nuvem são os arquivos pesados.'],
            ['tipo' => 'lista', 'titulo' => 'Pastas na nuvem', 'itens' => [
                '/Fatos — anexos e documentos que sustentam um fato.',
                '/Roteiros — os roteiros fechados.',
                '/Artes — os cards exportados, feed e stories.',
                '/Videos-brutos — o material como saiu da câmera.',
                '/Videos-finais — o que foi publicado.',
                '/Eventos — fotos e listas de cada encontro.',
            ]],
            ['tipo' => 'texto', 'texto' => 'O padrão de nome é o que faz qualquer peça ser achada em um minuto, meses depois, por alguém que não estava lá quando ela foi feita.'],
            ['tipo' => 'modelo', 'titulo' => 'Padrão de nome de arquivo', 'linhas' => [
                'AAAA-MM-DD_tipo_assunto',
                '',
                '2026-08-08_card_saude-fila',
                '2026-08-08_video_saude-fila',
                '2026-08-19_foto_encontro-messejana',
            ]],
            ['tipo' => 'texto', 'texto' => 'A data primeiro faz a pasta se ordenar sozinha. O tipo no meio deixa filtrar tudo que é card. O assunto no fim, sem acento e sem espaço, sobrevive a qualquer sistema.'],
            ['tipo' => 'checklist', 'id' => 'acervo'],
        ],
    ],

    ],
],

/* ============================ DIA 2 ============================ */
[
    'id'     => 'dia-2',
    'numero' => 2,
    'titulo' => 'Comunicação: do fato ao vídeo',
    'resumo' => 'A linha de produção inteira, do fato que aparece de manhã ao vídeo publicado. Uma Pista Lenta para cada função.',
    'aulas'  => [

    [
        'id'      => 'linha-de-producao',
        'pista'   => 'rapida',
        'titulo'  => 'A linha de produção',
        'resumo'  => 'Olheiro acha, Checagem aprova, Roteirista escreve, Design cria, Editor monta, Acervo organiza. Cada etapa só recebe o que a anterior aprovou.',
        'minutos' => 7,
        'funcoes' => [],
        'ferramenta' => '/painel/producao',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'A Comunicação funciona como uma linha de montagem. O ganho não é velocidade, é garantia: quando cada etapa só aceita o que a anterior aprovou, um boato não consegue chegar ao vídeo.'],
            ['tipo' => 'modelo', 'titulo' => 'A linha', 'linhas' => [
                'Olheiro → Checagem → Roteirista → Design → Editor → Acervo',
                '  acha      aprova     escreve     cria     monta    organiza',
            ]],
            ['tipo' => 'passos', 'itens' => [
                'O Olheiro faz duas varreduras por dia e transforma cada acontecimento numa Ficha de Fato, com link e data. Ele não opina.',
                'A Checagem abre o link, confere com os próprios olhos e marca [OK CHECADO] ou manda para pendentes. É a trava que impede boato de virar vídeo.',
                'O Roteirista pega só fato aprovado e escreve o roteiro de 60 a 90 segundos, na estrutura Gancho, Fato, Contraste, Responsabilização, Fechamento.',
                'O Design cria a arte do fato ou do roteiro aprovado, sempre com a fonte do número visível na peça.',
                'O Editor monta o vídeo final, legendado — a maioria assiste sem som.',
                'O Acervo garante que nada se perca: arquivo com nome padrão, na pasta certa, com índice do que foi publicado.',
            ]],
            ['tipo' => 'aviso', 'texto' => 'Nenhuma etapa começa em cima de fato não aprovado. Se o Design recebe um brief sem fonte, ele devolve — não faz a arte e cobra depois.'],
            ['tipo' => 'texto', 'texto' => 'A meta do dia é modesta de propósito: de 6 a 10 fatos candidatos, 2 roteiros completos e 1 a 2 peças. Um time de vinte pessoas mantém isso indefinidamente; o dobro disso dura duas semanas.'],
            ['tipo' => 'texto', 'texto' => 'As seis Pistas Lentas abaixo destrincham cada função. Leia a sua com calma e dê uma passada nas vizinhas — entender o que a etapa seguinte precisa é o que faz a linha andar sem retrabalho.'],
        ],
    ],

    [
        'id'      => 'olheiro',
        'pista'   => 'lenta',
        'titulo'  => 'Olheiro: achar o fato e provar',
        'resumo'  => 'Duas varreduras por dia, trava de 48h e uma Ficha de Fato por acontecimento. Sem opinião, sempre com link.',
        'minutos' => 7,
        'funcoes' => ['olheiro'],
        'ferramenta' => '/painel/fatos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é ficar de olho nos fatos do dia e transformar cada um num resumo rápido e checável. O Olheiro não dá opinião — isso é do Roteirista. Você traz o fato com a prova.'],
            ['tipo' => 'texto', 'texto' => 'Você entrega uma Ficha de Fato por acontecimento, com quem, quando, quanto, afetados, link e data.'],
            ['tipo' => 'passos', 'itens' => [
                'Faça duas varreduras por dia: de manhã, por volta das 8h, e no fim da tarde, por volta das 17h.',
                'Passe pelas fontes fixas (a lista está logo abaixo).',
                'Aplique a trava de data: só entra fato das últimas 48h, ou desdobramento novo de algo mais antigo.',
                'Para cada fato, preencha a Ficha: O QUÊ, QUEM (responsável nomeável), QUANDO, QUANTO, AFETADOS.',
                'Cole o link da fonte primária e a data. Sem link, não envia — print não é fonte.',
                'Marque a categoria (segurança, saúde, educação, obras, gasto público) e envie para a Checagem.',
            ]],
            ['tipo' => 'checklist', 'id' => 'fontes-fixas'],
            ['tipo' => 'modelo', 'titulo' => 'Ficha de Fato', 'linhas' => [
                'O QUÊ: uma frase objetiva do que aconteceu',
                'QUEM: órgão ou gestor responsável, nomeável e institucional',
                'QUANDO: data do fato',
                'QUANTO: número, valor, quantidade',
                'AFETADOS: quem sente na pele — bairro, categoria, cidade',
                'FONTE: link · DATA da publicação:',
                'CATEGORIA: ___ ETIQUETA: [A CHECAR]',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Mandar boato ou print sem link.',
                'Escrever opinião — isso é trabalho do Roteirista.',
                'Trazer dado sigiloso de investigação ou nome de investigado não condenado.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Primeira leva de fatos até 9h; segunda leva até 18h.',
                'De 6 a 10 fatos candidatos por dia. Os melhores viram pauta.',
            ]],
            ['tipo' => 'checklist', 'id' => 'olheiro'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: fato sem fonte ou sem data confirmada não vai para a fila da Checagem, vai para pendentes. Na dúvida se é relevante, pergunte à Checagem antes.'],
        ],
    ],

    [
        'id'      => 'checagem',
        'pista'   => 'lenta',
        'titulo'  => 'Checagem: a trava contra o boato',
        'resumo'  => 'Abrir o link, conferir com os próprios olhos e decidir. Nada dorme sem status.',
        'minutos' => 5,
        'funcoes' => ['checagem'],
        'ferramenta' => '/painel/fatos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'A Checagem é a trava que impede um boato de virar vídeo. Enquanto o time é pequeno, o responsável de Comunicação pode assumir essa função — mas ela nunca pode ficar vaga.'],
            ['tipo' => 'passos', 'itens' => [
                'Pegue cada fato marcado [A CHECAR] na fila.',
                'Abra o link. Confirme com os próprios olhos: a data bate? o número bate? a fonte é confiável?',
                'Se for uma afirmação forte, procure uma segunda fonte independente.',
                'Aprovado: marque [OK CHECADO]. O fato vira card na fila dos roteiristas automaticamente.',
                'Reprovado ou duvidoso: mande para pendentes com o motivo anotado. Não apague — pode virar pauta depois.',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Aprovar no olho, sem abrir o link.',
                'Deixar passar número sem fonte, confiando na memória.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Checar cada [A CHECAR] em até 2 horas. Fato quente, na hora.',
                'Zerar a fila do dia: nada dorme sem status.',
            ]],
            ['tipo' => 'checklist', 'id' => 'checagem'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: não conseguiu confirmar, vai para pendentes com o motivo. Fonte suspeita não aprova, mesmo que o fato pareça bom demais para perder — principalmente quando parece bom demais.'],
        ],
    ],

    [
        'id'      => 'roteirista',
        'pista'   => 'lenta',
        'titulo'  => 'Roteirista: do fato ao roteiro',
        'resumo'  => 'Gancho, Fato, Contraste, Responsabilização e um fechamento em três movimentos. De 60 a 90 segundos.',
        'minutos' => 9,
        'funcoes' => ['roteirista'],
        'ferramenta' => '/painel/producao',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é transformar um fato já checado num roteiro de vídeo curto que informa, contrasta e aponta um caminho. Você entrega o roteiro pronto para gravar, com marcação de cena.'],
            ['tipo' => 'passos', 'itens' => [
                'Pegue apenas fatos [OK CHECADO]. Nunca escreva em cima de fato não aprovado.',
                'Monte na estrutura: Gancho (a primeira frase que prende), Fato (o que aconteceu, com o dado), Contraste (o que existe contra o que poderia existir), Responsabilização (quem decidiu? quem assinou? onde foi o dinheiro?), Fechamento.',
                'Toda denúncia responde: como este lugar poderia ser? Traga uma alternativa específica, possível com os recursos que já existem.',
                'Feche sempre em três movimentos: posicionamento (Não sou contra X, sou a favor de Y), frase de identidade (uma visão de futuro curta) e frase final (callback + chamada + identificação). A chamada acompanha a fase: antes da campanha é o convite para acompanhar a jornada; durante a campanha pode ser o pedido de voto.',
                'A última linha é sempre igual: Meu nome é Felipe Moreira, do Partido MISSÃO.',
                'Onde o roteiro pedir história de vida, escreva a ponte genérica marcada [VIVÊNCIA]. Não invente caso.',
                'Revise pelas travas: cita facção pelo nome? corta. ofende pessoa? corta. passa no teste do espelho?',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Ganchos que funcionam', 'itens' => [
                'Número: R$ X. Y anos. E ainda não…',
                'Contraste: Isto existe aqui; ali, a mesma verba virou…',
                'Pergunta: Quem decidiu que…?',
                'Cena: Olha o que eu encontrei em…',
            ]],
            ['tipo' => 'modelo', 'titulo' => 'Roteiro de vídeo', 'linhas' => [
                'TÍTULO / TEMA: ___   DURAÇÃO ALVO: 60–90s',
                'FATO-ÂNCORA + LINK + DATA:',
                '[GANCHO] (0–5s):',
                '[FATO] (5–20s):',
                '[CONTRASTE] o que existe × o que poderia existir:',
                '[RESPONSABILIZAÇÃO] quem decidiu / assinou / onde foi o dinheiro:',
                '[VIVÊNCIA] ponte genérica para o candidato preencher:',
                '[FECHAMENTO] (a) Não sou contra ___, sou a favor de ___',
                '              (b) frase de futuro',
                '              (c) callback + identificação',
                'ÚLTIMA LINHA: Meu nome é Felipe Moreira, do Partido MISSÃO.',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Terminar na denúncia, sem apontar caminho.',
                'Citar facção pelo nome ou ofender pessoa.',
                'Usar o mesmo responsável como alvo principal dois dias seguidos.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Roteiro no mesmo dia do fato checado.',
                '2 roteiros completos por dia.',
            ]],
            ['tipo' => 'checklist', 'id' => 'roteirista'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: fato reprovado na checagem, não escreve. Sem alternativa possível, virou só denúncia — reformula.'],
        ],
    ],

    [
        'id'      => 'design',
        'pista'   => 'lenta',
        'titulo'  => 'Design: a arte que cita a fonte',
        'resumo'  => 'Cards de notícia e de evento, nos dois formatos, com a identidade da campanha e a fonte do dado visível.',
        'minutos' => 6,
        'funcoes' => ['design'],
        'ferramenta' => '/painel/estudio',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é criar as artes de notícia e de evento a partir do fato ou do roteiro aprovado, sempre com a identidade visual da campanha. Você entrega cards nos formatos certos, exportados e salvos com nome padrão.'],
            ['tipo' => 'passos', 'itens' => [
                'Receba o fato [OK CHECADO] ou o roteiro aprovado. Nunca crie arte de fato não checado.',
                'Aplique o template visual: cores da campanha, logo, fonte padrão. Consistência entre as peças é o que constrói reconhecimento.',
                'Monte a peça. Se a arte traz um número, a fonte do número aparece na própria arte, em rodapé pequeno.',
                'Exporte nos formatos feed 1080×1350 e stories 1080×1920. Se for para vídeo, exporte também os elementos soltos em PNG com fundo transparente para o Editor.',
                'Nomeie no padrão AAAA-MM-DD_card_assunto e salve em /Artes.',
            ]],
            ['tipo' => 'texto', 'texto' => 'O Estúdio do painel já sai com a paleta, as fontes e os formatos prontos — é o caminho mais curto para manter a identidade sem depender de quem está montando a peça.'],
            ['tipo' => 'nunca', 'itens' => [
                'Colocar número ou citação sem a fonte visível.',
                'Usar foto sem procedência, ou que engana o contexto.',
                'Inventar identidade visual nova a cada post.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Card de notícia em até 2 horas após o fato ou roteiro aprovado.',
                'Acompanhar o ritmo do dia (1 a 2 peças) mais as peças de evento.',
            ]],
            ['tipo' => 'modelo', 'titulo' => 'Brief de arte (o que o Design recebe)', 'linhas' => [
                'Fato/tema + link:',
                'Tipo de peça: card de notícia / citação / evento / dado',
                'Texto principal (headline):',
                'Dado + fonte:',
                'Formatos: feed / stories',
                'Prazo:',
            ]],
            ['tipo' => 'checklist', 'id' => 'design'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: dado sem fonte, não faz a arte — devolve ao Olheiro. Foto sem procedência, não usa.'],
        ],
    ],

    [
        'id'      => 'editor',
        'pista'   => 'lenta',
        'titulo'  => 'Editor: legenda é obrigatória',
        'resumo'  => 'Montar o vídeo final a partir do roteiro e do bruto. Vertical, legendado, com o dado e a fonte na tela.',
        'minutos' => 6,
        'funcoes' => ['editor'],
        'ferramenta' => '/painel/producao',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é montar o vídeo final a partir do roteiro e do material gravado, pronto para publicar. Você entrega o vídeo legendado, vertical, salvo em /Videos-finais com nome padrão.'],
            ['tipo' => 'passos', 'itens' => [
                'Receba o roteiro aprovado mais a gravação bruta.',
                'Corte seguindo o roteiro: gancho no começo, ritmo rápido, sem gordura.',
                'Legende. A legenda é obrigatória porque a maioria assiste sem som — e confira nomes e números nela.',
                'Insira as artes do Design e, quando houver, o dado com a fonte na tela.',
                'Revise o áudio (volume parelho, sem estouro) e confira se o fechamento está nos três movimentos.',
                'Exporte 1080×1920, nomeie AAAA-MM-DD_video_assunto e salve em /Videos-finais. Guarde o projeto para ajustes.',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Publicar sem legenda, ou com número ou nome errado na tela.',
                'Apagar o material bruto — ele vai para o Acervo.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Vídeo em até 24 horas da gravação. Fato quente, no mesmo dia.',
                'Todo roteiro gravado vira vídeo publicável.',
            ]],
            ['tipo' => 'checklist', 'id' => 'editor'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: áudio ruim pede legenda forte e, se der, regravar a narração. Número errado se corrige antes de publicar, nunca depois.'],
        ],
    ],

    [
        'id'      => 'acervo',
        'pista'   => 'lenta',
        'titulo'  => 'Acervo: nada se perde',
        'resumo'  => 'A função que evita o caos. Pasta certa, nome padrão e um índice do que já foi publicado.',
        'minutos' => 4,
        'funcoes' => ['acervo'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'O Acervo garante que ninguém perca material. Pode ser acumulado pelo Editor no começo, mas alguém precisa ser o dono — pasta sem dono vira pasta sem ordem em duas semanas.'],
            ['tipo' => 'passos', 'itens' => [
                'Confirme que todo arquivo entrou na pasta certa, com o nome padrão AAAA-MM-DD_tipo_assunto.',
                'Guarde os brutos de vídeo e as fotos dos eventos em /Videos-brutos e /Eventos.',
                'Mantenha um índice simples do que já foi publicado, com data e link do post.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Organizar no fim de cada dia; índice atualizado toda semana.',
                'Nada perdido: qualquer peça achável em 1 minuto.',
            ]],
            ['tipo' => 'checklist', 'id' => 'acervo'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: arquivo sem nome ou sem dono, renomeia no padrão e cobra quem subiu. A cobrança é parte do trabalho — sem ela o padrão se perde.'],
        ],
    ],

    ],
],

/* ============================ DIA 3 ============================ */
[
    'id'     => 'dia-3',
    'numero' => 3,
    'titulo' => 'Eventos: as cinco peças',
    'resumo' => 'Como um encontro sai do papel. Reserva, material, convite, registro e recepção — e o que cada peça entrega para a seguinte.',
    'aulas'  => [

    [
        'id'      => 'cinco-pecas',
        'pista'   => 'rapida',
        'titulo'  => 'Como um encontro acontece',
        'resumo'  => 'Local & Hora reserva, Logística prepara, Divulgação convida, Gravação registra, Recepção recebe e capta os contatos.',
        'minutos' => 7,
        'funcoes' => [],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Todo evento tem cinco peças e um responsável geral que garante que elas se encaixem. A ordem importa: cada peça depende do que a anterior fechou.'],
            ['tipo' => 'modelo', 'titulo' => 'A sequência', 'linhas' => [
                'Local & Hora → Logística → Divulgação → Gravação → Recepção',
                '   reserva      prepara      convida     registra    recebe',
            ]],
            ['tipo' => 'passos', 'itens' => [
                'Local & Hora levanta 3 opções, fecha a reserva e pede confirmação por escrito. Só depois disso alguém convida alguém.',
                'Logística monta a lista de material a partir do tipo de evento e garante que tudo chegue e funcione antes da primeira pessoa.',
                'Divulgação convida, registra os envios, pede confirmação de presença e manda lembrete na véspera e no dia.',
                'Gravação chega antes, testa tudo e registra em horizontal e vertical, priorizando o áudio das falas.',
                'Recepção recebe pelo nome, cadastra quem chegou e entrega os contatos organizados à coordenação.',
            ]],
            ['tipo' => 'aviso', 'texto' => 'Regra de ouro: todo evento, de qualquer tipo, precisa gerar conteúdo (a Gravação e o Design entram) e captar contatos (a Recepção entra). Evento que não vira post e não gera contato novo rende metade do que poderia.'],
            ['tipo' => 'texto', 'texto' => 'A ferramenta de Eventos do painel carrega o checklist de cada peça e a lista de presença. Quem está na porta cadastra direto pelo celular — no fim da noite a lista já está pronta, sem ninguém digitar papel depois.'],
        ],
    ],

    [
        'id'      => 'local-hora',
        'pista'   => 'lenta',
        'titulo'  => 'Local & Hora',
        'resumo'  => 'Três opções avaliadas, reserva confirmada por escrito e o time avisado. Ninguém convida antes disso.',
        'minutos' => 5,
        'funcoes' => ['local-hora'],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é encontrar e reservar o local certo, no melhor horário, e deixar a reserva confirmada por escrito.'],
            ['tipo' => 'passos', 'itens' => [
                'Confirme com a coordenação o tipo de evento e o público esperado.',
                'Levante 3 opções de local. Para cada uma, cheque capacidade, custo, acesso e transporte, estacionamento, banheiro, tomada e energia, e som.',
                'Se for quadra ou society, confirme disponibilidade, horário, valor e se pode levar som e banner.',
                'Escolha com a coordenação e feche a reserva. Peça confirmação por escrito, com data, horário e valor.',
                'Registre no calendário do time e avise Logística, Divulgação, Gravação e Recepção.',
            ]],
            ['tipo' => 'modelo', 'titulo' => 'Ficha de vistoria de local', 'linhas' => [
                'Local / endereço:',
                'Capacidade: ___   Custo: ___',
                'Acesso (transporte público / estacionamento):',
                'Energia e tomadas: ___   Som permitido: ___',
                'Banheiro: ___   Cobertura / sombra: ___',
                'Plano B de chuva:',
                'Contato do responsável:',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Confirmar convite antes de ter o local fechado por escrito.',
                'Escolher local sem acesso fácil para quem depende de transporte público.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Local fechado e confirmado por escrito até 1 semana antes.',
                '3 opções avaliadas por evento.',
            ]],
            ['tipo' => 'checklist', 'id' => 'local-hora'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: local caiu, aciona a segunda opção da lista e avisa todo mundo na hora. É por isso que são três opções, e não uma.'],
        ],
    ],

    [
        'id'      => 'logistica',
        'pista'   => 'lenta',
        'titulo'  => 'Logística',
        'resumo'  => 'Todo o material no local, funcionando, antes da primeira pessoa chegar — e recolhido no fim.',
        'minutos' => 5,
        'funcoes' => ['logistica'],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é garantir que todo o material esteja no local, funcionando, antes de a primeira pessoa chegar, e recolhido no fim.'],
            ['tipo' => 'passos', 'itens' => [
                'Monte a lista de material a partir do tipo de evento.',
                'Confirme quem traz cada item e como ele chega ao local.',
                'Chegue antes para montar: som, cadeiras, banner, mesa de recepção, energia.',
                'Teste tudo antes do horário de início — som e microfone principalmente.',
                'No fim, desmonte, confira a lista de volta e devolva o que foi emprestado.',
            ]],
            ['tipo' => 'checklist', 'id' => 'material-evento'],
            ['tipo' => 'nunca', 'itens' => [
                'Deixar para testar o som na hora.',
                'Perder item emprestado — a conta volta para o movimento.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Material confirmado 2 dias antes; tudo montado antes do horário.',
                'Zero item faltando; som testado antes de começar.',
            ]],
            ['tipo' => 'checklist', 'id' => 'logistica'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: faltou som, aciona a reserva ou um empréstimo. Sem energia, gerador ou local alternativo.'],
        ],
    ],

    [
        'id'      => 'divulgacao',
        'pista'   => 'lenta',
        'titulo'  => 'Divulgação',
        'resumo'  => 'Convidar, registrar quem foi convidado, confirmar presença e lembrar na véspera e no dia.',
        'minutos' => 6,
        'funcoes' => ['divulgacao'],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é convidar as pessoas para o encontro e confirmar quem vai. Você entrega para a Recepção a lista de confirmados.'],
            ['tipo' => 'passos', 'itens' => [
                'Monte a lista de convidados: contatos, grupos, lideranças de bairro.',
                'Use o template de convite aprovado. Personalize o nome, nunca o teor.',
                'Dispare pelos canais — WhatsApp, redes, boca a boca das lideranças — e registre para quem já mandou.',
                'Peça confirmação de presença e anote quem confirmou.',
                'Mande um lembrete na véspera e no dia, com local, horário e como chegar.',
                'Passe a lista de confirmados para a Recepção.',
            ]],
            ['tipo' => 'modelo', 'titulo' => 'Mensagem de convite', 'linhas' => [
                'Olá, [nome]! Tudo bem?',
                'Vai ter um encontro da nossa militância no dia [data], às [hora], em [local].',
                'É um espaço aberto para conversar sobre [tema] e acompanhar de perto esse movimento pelo Ceará.',
                'Sua presença faz diferença. Posso contar com você? Me confirma aqui.',
            ]],
            ['tipo' => 'modelo', 'titulo' => 'Lembretes e agradecimento', 'linhas' => [
                'Véspera: Oi, [nome]! É amanhã, [hora], em [local]. Vou te esperar! Como você chega?',
                'No dia: Hoje é o dia! [hora], em [local] ([ponto de referência]). Te vejo lá.',
                'D+1: [nome], obrigado por estar com a gente ontem! Foi muito bom te ver — vou te manter por dentro dos próximos passos.',
            ]],
            ['tipo' => 'texto', 'texto' => 'O teor do convite acompanha a fase. Antes da campanha ele chama a pessoa para acompanhar a jornada e participar do encontro, sem pedir voto e sem número de urna. Durante a campanha o pedido de voto é permitido — mas continua sendo escolha da coordenação onde ele entra, porque convite que só pede voto converte menos que convite que chama para uma conversa.'],
            ['tipo' => 'aviso', 'texto' => 'Texto de convite é material de campanha. Qualquer mudança no teor da mensagem passa pela coordenação antes de disparar — o template existe justamente para ninguém precisar improvisar redação sozinho.'],
            ['tipo' => 'nunca', 'itens' => [
                'Disparar em massa para quem não tem relação nenhuma com o movimento. Spam queima a imagem e derruba o número.',
                'Mudar o teor do convite por conta própria.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Convite abre 1 semana antes; lembrete na véspera e no dia.',
                'Convidar cerca de 3 vezes a presença desejada: quer 30, convida 90; confirma um terço.',
            ]],
            ['tipo' => 'modelo', 'titulo' => 'Planilha de RSVP', 'linhas' => [
                'Nome · WhatsApp · Bairro · Convidado por · Confirmou? (S/N) · Compareceu? (S/N)',
            ]],
            ['tipo' => 'checklist', 'id' => 'divulgacao'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: poucas confirmações pedem uma segunda onda de convites e as lideranças mobilizando os seus.'],
        ],
    ],

    [
        'id'      => 'gravacao',
        'pista'   => 'lenta',
        'titulo'  => 'Gravação',
        'resumo'  => 'Registrar o evento com imagem e som que aguentem virar conteúdo depois. Horizontal e vertical, sempre.',
        'minutos' => 5,
        'funcoes' => ['gravacao'],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é registrar o evento com imagem e som de qualidade para virar conteúdo depois. Você entrega o material bruto ao Editor.'],
            ['tipo' => 'passos', 'itens' => [
                'Chegue antes. Teste câmera, bateria, cartão de memória e áudio.',
                'Tenha um plano de captação: abertura com o local cheio, falas principais, reação do público, detalhes e cortes.',
                'Grave em horizontal E vertical — um para o YouTube, outro para stories e Reels.',
                'Priorize o áudio das falas: aproxime o microfone ou o celular de quem fala.',
                'No fim, salve tudo, faça backup e entregue o bruto ao Editor em /Videos-brutos.',
            ]],
            ['tipo' => 'checklist', 'id' => 'shot-list'],
            ['tipo' => 'modelo', 'titulo' => 'Autorização de imagem', 'linhas' => [
                'Eu, [nome], autorizo o uso da minha imagem e voz gravadas neste evento nos canais do movimento.',
                'Nome · Assinatura · Data',
                '',
                'Menor de idade só com autorização de quem é responsável.',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Confiar numa única câmera, sem backup de bateria e memória.',
                'Gravar pessoas em situação constrangedora.',
                'Gravar criança sem autorização de quem é responsável.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Chega 1 hora antes; entrega o bruto no mesmo dia.',
                'Cobrir a shot list inteira, com áudio limpo das falas.',
            ]],
            ['tipo' => 'checklist', 'id' => 'gravacao'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: bateria ou memória acabando, prioriza as falas principais. Sem segunda câmera, celular de reserva.'],
        ],
    ],

    [
        'id'      => 'recepcao',
        'pista'   => 'lenta',
        'titulo'  => 'Recepção',
        'resumo'  => 'Receber bem cada pessoa e captar o contato de quem chega. Quem entra sem cadastro é um contato perdido.',
        'minutos' => 5,
        'funcoes' => ['recepcao'],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Seu objetivo é receber bem cada pessoa que chega e captar o contato de quem veio. Você entrega a lista de presença preenchida e os contatos organizados à coordenação no fim do evento.'],
            ['tipo' => 'passos', 'itens' => [
                'Monte a mesa na entrada com a lista de presença e o QR de cadastro (nome, WhatsApp, bairro).',
                'Receba cada pessoa pelo nome, oriente onde sentar e onde ficam água e banheiro.',
                'Registre quem chegou. Se houver crachá, entregue.',
                'Fique de olho em lideranças e novos rostos, e anote quem merece um contato depois.',
                'No fim, organize os contatos e entregue à coordenação para o follow-up.',
            ]],
            ['tipo' => 'texto', 'texto' => 'O QR do painel abre a página de presença no celular da própria pessoa, com o aviso de privacidade que a lei exige. Ela se cadastra em vinte segundos e a lista já cai organizada — a mesa não vira fila.'],
            ['tipo' => 'aviso', 'texto' => 'Contato de terceiro é dado pessoal. Ele serve ao movimento e nada mais: nunca use a lista para assunto fora do contexto, nunca repasse para fora e nunca cadastre alguém sem a pessoa saber.'],
            ['tipo' => 'nunca', 'itens' => [
                'Deixar alguém entrar sem passar pelo cadastro — perde-se o contato.',
                'Usar os contatos coletados para spam ou fora do contexto do movimento.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Prazo e meta', 'itens' => [
                'Mesa pronta 30 minutos antes; contatos entregues no fim do evento.',
                '100% de quem entra cadastrado.',
            ]],
            ['tipo' => 'modelo', 'titulo' => 'Planilha de contatos', 'linhas' => [
                'Nome · WhatsApp · Bairro · Como chegou (convite de quem)',
                'Classe: Curioso / Simpatizante / Militante / Apoiador',
                'Observação para follow-up:',
            ]],
            ['tipo' => 'checklist', 'id' => 'recepcao'],
            ['tipo' => 'texto', 'texto' => 'Quando der errado: fila na entrada pede uma segunda pessoa ajudando no cadastro. QR fora do ar, cadastro no papel e digitação depois.'],
        ],
    ],

    ],
],

/* ============================ DIA 4 ============================ */
[
    'id'     => 'dia-4',
    'numero' => 4,
    'titulo' => 'Que evento fazer, e quando',
    'resumo' => 'Cinco famílias de evento, cada uma com objetivo e trava própria. Não se monta um ato de rua como se monta um jantar com empresário.',
    'aulas'  => [

    [
        'id'      => 'cinco-familias',
        'pista'   => 'rapida',
        'titulo'  => 'As 5 famílias e a grade do mês',
        'resumo'  => 'Público, Militância, Relacional, Digital e Pautado — para que serve cada uma e quanto disso um time de 20 pessoas aguenta.',
        'minutos' => 8,
        'funcoes' => [],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Cada tipo de evento tem objetivo, ritmo e trava diferentes. A execução — som, convite, gravação, recepção — é sempre a do Dia 3; o que muda é para que o evento serve.'],
            ['tipo' => 'tabela', 'colunas' => ['Família', 'Serve para', 'Exemplos'], 'linhas' => [
                ['Público', 'Aparecer, dar volume, ocupar a rua', 'Carreata, adesivaço, bandeiraço, caminhada, ato em praça'],
                ['Militância', 'Fortalecer e crescer a base por dentro', 'Treinamento, formação, roda de conversa, confraternização'],
                ['Relacional', 'Construir apoio com quem decide', 'Café com lideranças, jantar com empresários, reunião com categoria'],
                ['Digital', 'Escalar barato, todo dia, com pouca gente', 'Live, mutirão digital, card coordenado'],
                ['Pautado', 'Gerar conteúdo forte indo ao local do problema', 'Fila de hospital, obra parada, escola sem reforma'],
            ]],
            ['tipo' => 'texto', 'texto' => 'Com vinte pessoas, o sustentável é um evento presencial grande a cada duas semanas. O resto do ritmo é digital e interno — assim as mesmas vinte pessoas não se esgotam em um mês.'],
            ['tipo' => 'tabela', 'colunas' => ['Frequência', 'O quê', 'Peso'], 'linhas' => [
                ['Toda semana', 'Reunião ou formação da militância', 'Leve'],
                ['Toda semana', 'Ação digital coordenada (1 a 2x)', 'Leve'],
                ['Quinzenal', '1 ação pautada OU 1 ato público', 'Médio a pesado'],
                ['Mensal', '1 evento relacional', 'Médio'],
                ['Mensal', '1 social da militância', 'Leve'],
            ]],
            ['tipo' => 'texto', 'texto' => 'Quando o time passar de umas 40 pessoas ativas, dá para subir o evento público para semanal. Antes disso, não adianta querer — o que trava não é vontade, é quem monta o som.'],
        ],
    ],

    [
        'id'      => 'evento-publico',
        'pista'   => 'lenta',
        'titulo'  => 'Público: ocupar a rua',
        'resumo'  => 'Carreata, adesivaço, bandeiraço, caminhada, ato. Volume e imagem de movimento.',
        'minutos' => 5,
        'funcoes' => ['local-hora', 'logistica', 'divulgacao'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Objetivo: volume e visibilidade. Ocupar a rua, mostrar força, gerar imagem de movimento.'],
            ['tipo' => 'passos', 'itens' => [
                'Semana anterior: Local & Hora define trajeto ou ponto; Logística lista o material; Divulgação convida e confirma quórum; o Financeiro aprova o custo.',
                'Véspera: confirmar o quórum real (quem vem de verdade), o ponto de encontro e o horário; testar som; escalar quem grava e quem recebe.',
                'Dia: concentração, foto de abertura com o grupo, percurso ou ato, falas curtas, registro constante em horizontal e vertical, e a Recepção captando contato de quem se aproxima.',
                'Depois: editar um vídeo-resumo e os cards no mesmo dia; follow-up dos contatos novos em 24 a 48 horas.',
            ]],
            ['tipo' => 'texto', 'texto' => 'O que este formato pode fazer depende da fase. Antes da campanha, o ato existe na versão encontro: caminhada-conversa, panfleto institucional sem número de urna, camiseta do movimento — e nada de pedir voto. Durante a campanha, carreata, adesivaço, bandeiraço e caminhada com nome e número estão liberados, respeitando as regras de horário e local da legislação eleitoral. Nós estamos em campanha, então vale a segunda coluna.'],
            ['tipo' => 'aviso', 'texto' => 'Liberado não quer dizer sem regra. Horário permitido, uso de som, trajeto e o que pode ser distribuído continuam definidos em lei e mudam com o calendário eleitoral. Feche o trajeto e o material com a coordenação antes de convocar gente.'],
            ['tipo' => 'lista', 'titulo' => 'Travas específicas', 'itens' => [
                'Segurança de trânsito, principalmente em carreata.',
                'Autorização ou aviso às autoridades quando exigido.',
                'Nada de bloqueio agressivo de via.',
                'Crítica à gestão em faixa e cartaz — nunca ofensa pessoal.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Material específico', 'itens' => [
                'Som móvel ou carro de som, coletes de identificação, bandeiras.',
                'Água, kit de primeiros socorros e um ponto de apoio.',
            ]],
            ['tipo' => 'texto', 'texto' => 'Métrica de sucesso: número de pessoas na rua, alcance do vídeo-resumo e número de contatos novos captados.'],
        ],
    ],

    [
        'id'      => 'evento-militancia',
        'pista'   => 'lenta',
        'titulo'  => 'Militância: formação e social',
        'resumo'  => 'O evento que faz o time crescer por dentro. Sem restrição, e o que mais retém gente.',
        'minutos' => 5,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Objetivo: fortalecer e crescer a base por dentro. Formar gente, dar sentido de pertencimento e não deixar ninguém ocioso — militante sem tarefa some em três semanas.'],
            ['tipo' => 'lista', 'titulo' => 'Dois formatos', 'itens' => [
                'Formação ou treinamento: ensinar o time a fazer. Estas aulas servem de roteiro. Roda semanal, de 1 a 2 horas.',
                'Social ou confraternização: churrasco, roda, aniversário do grupo. Roda mensal. Serve para reter e para trazer gente nova pelo boca a boca.',
            ]],
            ['tipo' => 'passos', 'itens' => [
                'Antes: definir o tema do encontro, quem conduz e o local — pode ser a sede ou a casa de alguém. Avisar a base.',
                'Dia: abertura curta dizendo para onde vamos, depois o conteúdo ou o convívio; captar quem trouxe amigo novo; registrar só o que a pessoa autorizou.',
                'Depois: integrar os novos aos canais e às funções; anotar quem se destacou para assumir papel.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Travas específicas', 'itens' => [
                'Ambiente acolhedor, sem panelinha.',
                'Todo novato sai com uma tarefa clara.',
                'Social não vira palanque.',
            ]],
            ['tipo' => 'texto', 'texto' => 'Métrica de sucesso: número de militantes ativos crescendo, quantos novos assumiram função e presença recorrente.'],
        ],
    ],

    [
        'id'      => 'evento-relacional',
        'pista'   => 'lenta',
        'titulo'  => 'Relacional: o de maior risco',
        'resumo'  => 'Café com lideranças, encontro com empresários. Evento de visão e confiança — e o que exige mais cuidado jurídico.',
        'minutos' => 6,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Objetivo: construir apoio e relacionamento com quem tem influência ou base própria. É evento de visão e confiança, não de plateia — dez pessoas certas valem mais que cem.'],
            ['tipo' => 'aviso', 'texto' => 'Este é o formato de maior risco jurídico do movimento. O caixa nunca se mistura: cada candidatura da coligação tem CNPJ, conta e prestação de contas próprios. Deixe claro a qual candidatura o apoio se destina e nunca trate candidaturas diferentes como uma só para fins financeiros. Cruzar caixa pode cassar todas as envolvidas.'],
            ['tipo' => 'texto', 'texto' => 'Sobre dinheiro, a fase muda tudo. Antes da campanha não existe captação: nenhum pedido de doação, nenhuma promessa em troca de apoio — o encontro serve para apresentar visão e ouvir. Durante a campanha a captação é possível, mas só na janela e na forma que a lei define, com registro e prestação de contas.'],
            ['tipo' => 'aviso', 'texto' => 'Em qualquer fase, quem está na mesa não combina dinheiro na hora. Se alguém demonstrar interesse em apoiar, anote o interesse e passe para o Financeiro e a coordenação conduzirem. Doação fora da forma legal contamina a prestação de contas inteira.'],
            ['tipo' => 'passos', 'itens' => [
                'Antes: lista curada e curta — qualidade, não volume. Convite pessoal, nunca grupo de WhatsApp. Local reservado e discreto. Roteiro de fala do porta-voz. O Financeiro valida a pauta.',
                'Dia: recepção próxima e nominal; fala curta de visão, de 10 a 15 minutos; conversa aberta e escuta; registro só do que foi autorizado; captar contato e interesse de cada um.',
                'Depois: follow-up individual e personalizado em 48 horas — não é mensagem de massa. Anote quem pode virar apoiador, quem pode abrir portas e quem só quis conhecer.',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Prometer cargo ou vantagem, em qualquer hipótese.',
                'Câmera aberta gravando conversa privada.',
                'Improvisar número sem fonte na frente de quem entende do assunto.',
                'Misturar o caixa de candidaturas diferentes.',
            ]],
            ['tipo' => 'texto', 'texto' => 'Métrica de sucesso: lideranças e empresários engajados, apoios concretos e portas abertas — ou seja, agendas geradas a partir do encontro.'],
        ],
    ],

    [
        'id'      => 'evento-digital',
        'pista'   => 'lenta',
        'titulo'  => 'Digital: onde time pequeno mais rende',
        'resumo'  => 'Live, mutirão digital e card coordenado. Escala barato, todo dia, com pouca gente.',
        'minutos' => 5,
        'funcoes' => ['design', 'editor'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Objetivo: escalar barato e todo dia, com pouca gente. É onde vinte pessoas rendem como duzentas — desde que ajam na mesma hora.'],
            ['tipo' => 'lista', 'titulo' => 'Formatos', 'itens' => [
                'Live ou transmissão: conversa ao vivo sobre uma pauta já checada.',
                'Mutirão digital: o time posta, comenta e compartilha o mesmo conteúdo em horário combinado, para dar tração.',
                'Card ou corrente coordenada: a peça do Design distribuída pela base ao mesmo tempo.',
            ]],
            ['tipo' => 'passos', 'itens' => [
                'Antes: escolher a pauta (fato [OK CHECADO]); o Design faz a peça; combinar o horário do mutirão; briefing curto do que postar e comentar.',
                'Na hora marcada: todo mundo posta e engaja junto; alguém monitora e responde comentários no tom certo, nunca pelo ódio.',
                'Depois: medir alcance, salvar o que rendeu e repetir o formato que funcionou.',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Espalhar fato não checado — na velocidade do digital, não dá para recolher.',
                'Fazer spam ou comportamento que derrube perfis do time.',
                'Responder crítica com ofensa pessoal.',
            ]],
            ['tipo' => 'texto', 'texto' => 'Métrica de sucesso: alcance e visualizações, compartilhamentos, seguidores novos e comentários engajados.'],
        ],
    ],

    [
        'id'      => 'evento-pautado',
        'pista'   => 'lenta',
        'titulo'  => 'Pautado: ir ao local do problema',
        'resumo'  => 'Ir até lá, mostrar a situação, nomear o responsável institucional e perguntar onde foi o dinheiro. Um evento desses vira vários vídeos.',
        'minutos' => 6,
        'funcoes' => ['olheiro', 'roteirista', 'gravacao'],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Objetivo: gerar conteúdo forte indo ao local do problema. Mostrar a situação, nomear o responsável institucional, perguntar onde foi o dinheiro e apontar o que poderia ser diferente. É o formato que mais rende por hora investida.'],
            ['tipo' => 'passos', 'itens' => [
                'Antes: o Olheiro traz o fato-âncora [OK CHECADO] com link e data — a obra parada, a fila, o dado de transparência. O Roteirista monta o roteiro na estrutura Gancho, Fato, Contraste, Responsabilização, Fechamento. Combinar horário e transporte.',
                'Dia: ir ao local e gravar a realidade — a fila, a obra, a placa. Registrar o contraste entre o que existe e o que o orçamento prometia. A [VIVÊNCIA] fica para o candidato preencher no local.',
                'Depois: o Editor tira um vídeo principal e os cortes; o Design faz o card com o dado e a fonte; o fechamento sempre nos três movimentos.',
            ]],
            ['tipo' => 'nunca', 'itens' => [
                'Invadir propriedade ou constranger cidadão que está ali.',
                'Gravar criança sem autorização de quem é responsável.',
                'Usar dado sigiloso de investigação.',
                'Usar o mesmo responsável como alvo principal dois dias seguidos.',
            ]],
            ['tipo' => 'lista', 'titulo' => 'Material específico', 'itens' => [
                'Celular ou câmera com boa captação de áudio.',
                'O print do dado-âncora e o roteiro impresso.',
            ]],
            ['tipo' => 'texto', 'texto' => 'Métrica de sucesso: número de vídeos gerados, alcance e repercussão — a cobrança que provoca resposta do órgão vale mais que qualquer número de visualização.'],
        ],
    ],

    ],
],

/* ============================ DIA 5 ============================ */
[
    'id'     => 'dia-5',
    'numero' => 5,
    'titulo' => 'Depois do evento',
    'resumo' => 'Captar contato é metade do trabalho. O valor está no que vem depois — e em quem cuida do custo e da conformidade.',
    'aulas'  => [

    [
        'id'      => 'funil-follow-up',
        'pista'   => 'rapida',
        'titulo'  => 'Lead sem segunda mensagem é lead perdido',
        'resumo'  => 'O funil de follow-up: D+0, D+3, D+7 e as quatro classes de contato. Cada uma recebe um tratamento diferente.',
        'minutos' => 6,
        'funcoes' => ['recepcao'],
        'ferramenta' => '/painel/eventos',
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Captar contato é só metade do trabalho. Uma pessoa que veio ao encontro, deu o WhatsApp e nunca mais ouviu falar da gente custou o mesmo que uma que virou militante — e não rendeu nada.'],
            ['tipo' => 'passos', 'itens' => [
                'D+0, no mesmo dia ou no dia seguinte: mensagem de agradecimento personalizada e o convite para entrar no canal do movimento.',
                'D+3: mandar um conteúdo — vídeo ou card — relacionado ao que a pessoa demonstrou interesse.',
                'D+7: convite para o próximo evento adequado ao perfil. Militante vai para formação; liderança ou empresário vai para o relacional.',
            ]],
            ['tipo' => 'tabela', 'colunas' => ['Classe', 'Quem é', 'O que mandar'], 'linhas' => [
                ['Curioso', 'Só conheceu, veio junto com alguém', 'Conteúdo leve, sem cobrança'],
                ['Simpatizante', 'Acompanha e concorda', 'Conteúdo e convite para o próximo evento aberto'],
                ['Militante', 'Quer ajudar', 'Convite para a formação e uma função com dono'],
                ['Apoiador ou liderança', 'Abre portas, tem base própria', 'Contato pessoal da coordenação, nunca mensagem de massa'],
            ]],
            ['tipo' => 'aviso', 'texto' => 'A Recepção capta, mas o funil precisa de um dono na coordenação. Lista de contato sem dono é lista que ninguém cobra — e lead sem segunda mensagem é lead perdido.'],
            ['tipo' => 'texto', 'texto' => 'A ferramenta de Eventos mostra quem está vencido em cada etapa do funil, para a coordenação cobrar sem precisar abrir planilha nenhuma.'],
        ],
    ],

    [
        'id'      => 'financeiro-conformidade',
        'pista'   => 'lenta',
        'titulo'  => 'Financeiro e conformidade por evento',
        'resumo'  => 'Nenhum evento deveria acontecer sem alguém responsável por custo e por conformidade. Como isso funciona enquanto o time é pequeno.',
        'minutos' => 5,
        'funcoes' => [],
        'blocos'  => [
            ['tipo' => 'texto', 'texto' => 'Nenhum evento deveria acontecer sem alguém responsável por custo e por conformidade. No começo essa função fica com a coordenação; quando o time crescer, vira um papel próprio.'],
            ['tipo' => 'texto', 'texto' => 'Você entrega o orçamento aprovado antes do evento, a checagem de conformidade e o registro dos gastos.'],
            ['tipo' => 'passos', 'itens' => [
                'Receba a proposta de evento.',
                'Estime o custo e aprove ou ajuste.',
                'Cheque a conformidade: o material está dentro do que a lei permite hoje? o caixa da coligação está separado?',
                'Registre cada gasto com comprovante.',
                'Mantenha separados os registros de cada candidatura.',
            ]],
            ['tipo' => 'aviso', 'texto' => 'A coordenação é única, o caixa não. Cada candidatura da coligação tem CNPJ, conta e prestação de contas próprios no TSE. Cruzar caixa entre candidaturas pode cassar todas as envolvidas.'],
            ['tipo' => 'nunca', 'itens' => [
                'Misturar o caixa de duas candidaturas.',
                'Autorizar captação de recurso fora da janela e da forma legal.',
                'Deixar gasto sem comprovante.',
            ]],
        ],
    ],

    ],
],

];

/* ===================== consultas ao currículo ===================== */

/** Todas as aulas, em ordem, com o dia a que pertencem. */
function todas_as_aulas(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    $memo = [];
    foreach (CURRICULO as $dia) {
        foreach ($dia['aulas'] as $aula) {
            $aula['dia'] = $dia['id'];
            $memo[$aula['id']] = $aula;
        }
    }
    return $memo;
}

/** Uma aula pelo id, ou null. */
function aula_por_id(string $id): ?array
{
    return todas_as_aulas()[$id] ?? null;
}

/** Quantas aulas o currículo tem no total — base do cálculo de progresso. */
function total_de_aulas(): int
{
    return count(todas_as_aulas());
}
