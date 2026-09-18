<?php
declare(strict_types=1);

/**
 * O CATÁLOGO DE FORMATOS — o conteúdo da Oficina.
 *
 * Fica em PHP, e não em `src/`, pela mesma razão que `aulas-conteudo.php`: é
 * material de curso pago e anotação de trabalho, e não tem por que viajar no
 * bundle de quem abre o site para ler as propostas.
 *
 * NASCEU DE DOIS MATERIAIS QUE DIZIAM A MESMA COISA EM DOIS LUGARES:
 *
 * - `update/Desafio_Formato_Criativo_32_dias.md` — os 16 formatos que a Hanah
 *   Franklin publicou aberto no Instagram, mais 16 de pesquisa externa.
 * - O curso Formato Criativo (Academia Criadores do Futuro) — 19 formatos com
 *   aula em vídeo na Hotmart e card de roteiro no Trello.
 *
 * Sete formatos apareciam nos dois. Manter as duas listas era garantir que
 * Dinamismo fosse gravado duas vezes e medido como se fossem dois formatos
 * diferentes — o que destrói exatamente a pergunta que o desafio existe para
 * responder ("quais 2 ou 3 funcionam no meu nicho"). Aqui cada formato aparece
 * UMA vez, com `fonte` dizendo de onde veio e somando a dica de um ao link do
 * outro.
 *
 * A ORDEM É A FILA. Os do curso primeiro, porque já vêm com aula e roteiro
 * pronto — começar pelo que tem instrução é o que reduz a chance de travar no
 * dia 2. O Formato Combinado é sempre o último: ele só faz sentido com número
 * na mão.
 */

/** De onde o formato veio. É etiqueta de leitura, não permissão. */
const FONTES_OFICINA = [
    'curso'   => 'curso',
    'desafio' => 'desafio',
    'ambos'   => 'curso + desafio',
];

/**
 * Quantos vídeos por semana a Oficina cobra.
 *
 * Três, e não sete. "1 por dia" é a regra do desafio original e é a regra que
 * faz alguém parar no dia 4 e não voltar; três por semana sustenta 37 formatos
 * em três meses, que é o prazo em que dá para comparar número.
 */
const META_SEMANAL_OFICINA = 3;

/** Dias sem publicar a partir dos quais o Início cobra em vermelho. */
const DIAS_SEM_PUBLICAR_URGENTE = 3;

/** Dias depois de publicar a partir dos quais faltar número vira pendência. */
const DIAS_SEM_NUMERO_URGENTE = 3;

/**
 * AS ESTRUTURAS DE GANCHO — os 3 primeiros segundos, que valem para qualquer
 * formato da lista.
 *
 * Entram como campo do registro, e não como texto de apoio, porque gancho é o
 * segundo eixo da medição: o mesmo formato com gancho de Curiosidade e com
 * gancho de Utilidade são dois vídeos diferentes, e sem registrar qual foi não
 * há como saber qual dos dois puxou a retenção.
 */
const GANCHOS_OFICINA = [
    'transformacao'   => ['nome' => 'Transformação',   'estrutura' => 'Eu saí de [antes] para [depois]'],
    'identidade'      => ['nome' => 'Identidade',      'estrutura' => 'Se você é [pessoa específica], pare de fazer isso'],
    'curiosidade'     => ['nome' => 'Curiosidade',     'estrutura' => 'Ninguém te conta isso sobre [tema]'],
    'diagnostico'     => ['nome' => 'Diagnóstico',     'estrutura' => 'É por isso que seu [resultado] não acontece'],
    'contraintuicao'  => ['nome' => 'Contra-intuição', 'estrutura' => 'O jeito mais rápido de [X] não é [o óbvio]'],
    'utilidade'       => ['nome' => 'Utilidade',       'estrutura' => 'Salva isso antes de [tarefa]'],
    'teste'           => ['nome' => 'Teste',           'estrutura' => 'Testei [X] por [tempo]'],
    'ranking'         => ['nome' => 'Ranking',         'estrutura' => 'Dando nota para [coisas do nicho]'],
];

/**
 * OS 37 FORMATOS, na ordem da fila.
 *
 * Cada um: `nome`, `fonte`, `resumo` (o que é, uma linha), `dica` (como gravar)
 * e `links` (aula e roteiro, quando existem).
 */
const FORMATOS_OFICINA = [

    /* ---------- Do curso: têm aula em vídeo e roteiro pronto ---------- */

    'tela-dividida' => [
        'nome'   => 'Tela Dividida',
        'fonte'  => 'ambos',
        'resumo' => 'Dois canais de atenção na tela ao mesmo tempo — reduz o esforço de entender e segura a retenção.',
        'dica'   => 'Grave dois vídeos separados (o gatilho e a sua reação) e junte em split screen.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/K4klaRkVeY'],
            ['rotulo' => 'aula de edição',   'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/o4E3xxwY7z'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/jksXSNem/40-sobre-tela-dividida'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/mBnTZksx/41-aplicação-tela-dividida'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DW6hQ2RjYfk/'],
        ],
    ],

    'tela-verde' => [
        'nome'   => 'Tela Verde',
        'fonte'  => 'ambos',
        'resumo' => 'Duplo estímulo, auditivo e visual, com tom de notícia: você fala na frente da imagem que está comentando.',
        'dica'   => 'No CapCut, recorte o fundo e ponha atrás o print do que está comentando.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/97BglPZJOp'],
            ['rotulo' => 'aula de edição',   'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/BOn52Jpq7R'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/Evxmmizu/44-sobre-tela-verde'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/jxzsouBE/45-aplicação-tela-verde'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DWyxF2ajSkw/'],
        ],
    ],

    'palestrinha' => [
        'nome'   => 'Palestrinha',
        'fonte'  => 'ambos',
        'resumo' => 'Um slide simples atrás e você apresentando na frente, como uma mini-aula sobre o que quer defender.',
        'dica'   => 'O slide pode ser só texto e imagem. O que carrega é a defesa, não o design.',
        'links'  => [
            ['rotulo' => 'aula (Formatos Validados)',  'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/K4klaoWkeY'],
            ['rotulo' => 'aula (Gravação na Prática)', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/kOXxqvVWOW'],
            ['rotulo' => 'sobre',                      'url' => 'https://trello.com/c/eqTRjvI2/39-sobre-palestrinha'],
            ['rotulo' => 'roteiro',                    'url' => 'https://trello.com/c/cWoMGpSa/38-aplicação-palestrinha'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DW9Dw5XDTJU/'],
        ],
    ],

    'narrado' => [
        'nome'   => 'Narrado',
        'fonte'  => 'ambos',
        'resumo' => 'A fala principal vai em voz off por cima das cenas, em vez de olhando para a câmera.',
        'dica'   => 'Grave as cenas primeiro e a narração depois, encaixando por cima na edição — soa mais espontâneo do que decorar texto.',
        'links'  => [
            ['rotulo' => 'aula de gravação',      'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/97BglKPqOp'],
            ['rotulo' => 'aula de gravação (alt)', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/Z72Qv5PJeN'],
            ['rotulo' => 'aula de edição',        'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/M7GEqXwr4w'],
            ['rotulo' => 'sobre',                 'url' => 'https://trello.com/c/EbYbLszk/43-sobre-narrado'],
            ['rotulo' => 'roteiro',               'url' => 'https://trello.com/c/Gpek03Ck/42-aplicação-narrado'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DWod40sjWdK/'],
        ],
    ],

    'cine' => [
        'nome'   => 'Cine',
        'fonte'  => 'curso',
        'resumo' => 'Tratamento cinematográfico: enquadramento, luz e ritmo contando a história antes da fala.',
        'dica'   => 'Sem edição dedicada no curso — use o kit geral de Edição na Prática.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/97BglKwLOp'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/upmnrRU5/8-sobre-cine'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/dJpPJchT/11-aplicação-cine'],
        ],
    ],

    'storytelling-visual' => [
        'nome'   => 'Storytelling Visual',
        'fonte'  => 'ambos',
        'resumo' => 'Uma história completa em 20 a 45 segundos, com problema, virada e resultado — narrativa, não dica.',
        'dica'   => 'Abra já no ponto de dor, não na contextualização. O desfecho é o que segura até o fim.',
        'links'  => [
            ['rotulo' => 'aula de gravação',       'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/3eaQmdj9eg'],
            ['rotulo' => 'aula de gravação (alt)', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/E4zzDLpD4l'],
            ['rotulo' => 'sobre',                  'url' => 'https://trello.com/c/SlfuYFrx/27-sobre-storytelling-visual'],
            ['rotulo' => 'roteiro',                'url' => 'https://trello.com/c/oULMIy6M/29-aplicação-storytelling-visual'],
        ],
    ],

    'experimento-social' => [
        'nome'   => 'Experimento Social',
        'fonte'  => 'curso',
        'resumo' => 'Você propõe uma situação a outras pessoas e filma a reação real delas.',
        'dica'   => 'A reação é o conteúdo. Prepare a pergunta e não prepare a resposta.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/gOpb3BVLeJ'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/rTAcAOF8/18-sobre-experimento-social'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/APUOJXVy/15-aplicação-experimento-social'],
        ],
    ],

    'conflito-situacional' => [
        'nome'   => 'Conflito Situacional',
        'fonte'  => 'curso',
        'resumo' => 'Uma tensão encenada do seu nicho, com o conflito aparecendo nos primeiros segundos.',
        'dica'   => 'O conflito precisa ser reconhecível por quem vive o seu nicho — genérico não gera identificação.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/Z72RJXAy7N'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/G7qFS4Ly/22-sobre-conflito-situacional'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/7zbCGgCa/21-aplicação-conflito-situacional'],
        ],
    ],

    'dinamismo' => [
        'nome'   => 'Dinamismo',
        'fonte'  => 'ambos',
        'resumo' => 'Movimento constante: cortes rápidos, troca de cenário e de ângulo, sem pausa do início ao fim.',
        'dica'   => 'Grave várias cenas curtas, de 2 a 4 segundos cada, e edite com cortes secos. É o formato com mais referência pronta para copiar.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/gOpDGmrdOJ'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/sWd2jvD4/1-sobre-dinamismo'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/nCZ7HQgL/14-aplicação-dinamismo'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DWl4jR7DfNQ/'],
        ],
    ],

    'trivial' => [
        'nome'   => 'Trivial',
        'fonte'  => 'ambos',
        'resumo' => 'Você grava enquanto faz algo comum da rotina e fala do assunto por cima dessa ação.',
        'dica'   => 'Escolha uma tarefa que você já ia fazer de qualquer jeito e ligue a câmera. É o formato dos dias corridos.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/m7Y8lRANe6'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/PVAlveqO/36-sobre-trivial'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/GFQt0Jwd/37-aplicação-trivial'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DWrDoQSDZqv/'],
        ],
    ],

    'dialogo' => [
        'nome'   => 'Diálogo',
        'fonte'  => 'ambos',
        'resumo' => 'Uma conversa entre duas pessoas — a fala sai natural porque ninguém encara a lente.',
        'dica'   => 'Sem roteiro rígido: discuta o tema como numa conversa normal. Precisa de outra pessoa, então marque antes.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/r48xMby34R'],
            ['rotulo' => 'aula de edição',   'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/a4R2P9or4n'],
            ['rotulo' => 'sobre',            'url' => 'https://trello.com/c/O3kBtVuW/16-sobre-diálogo'],
            ['rotulo' => 'roteiro',          'url' => 'https://trello.com/c/1Gzm5Jte/19-aplicação-diálogo'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DWwLtCUDaVi/'],
        ],
    ],

    'caixinha-polemica' => [
        'nome'   => 'Caixinha Polêmica',
        'fonte'  => 'ambos',
        'resumo' => 'Você parte de uma mensagem desagradável ou de uma pergunta polêmica e transforma a provocação em conteúdo.',
        'dica'   => 'Guarde print de comentário difícil. É a carta na manga do dia sem ideia — e o comentário negativo deixa de ser desânimo.',
        'links'  => [
            ['rotulo' => 'aula de edição', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/EOg5qJDPe6'],
            ['rotulo' => 'sobre',          'url' => 'https://trello.com/c/dhkr6JfP/23-sobre-caixinha-de-perguntas-polêmica'],
            ['rotulo' => 'roteiro',        'url' => 'https://trello.com/c/sVeAKADT/25-aplicação-caixinha-polêmica'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DWtmdFkDUtP/'],
        ],
    ],

    'comparacao' => [
        'nome'   => 'Comparação',
        'fonte'  => 'ambos',
        'resumo' => 'Duas situações, produtos ou opções lado a lado: caro x barato, certo x errado, pessoa 1 x pessoa 2.',
        'dica'   => 'Mantenha o mesmo enquadramento nos dois lados, trocando só o que está sendo mostrado.',
        'links'  => [
            ['rotulo' => 'aula de edição (Tela Dividida)', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/o4E3xxwY7z'],
            ['rotulo' => 'sobre',                          'url' => 'https://trello.com/c/wTUdPgQz/33-sobre-comparação'],
            ['rotulo' => 'roteiro',                        'url' => 'https://trello.com/c/PP8PX5qP/31-aplicação-comparação'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DW4FCm3DSNV/'],
        ],
    ],

    'the-office' => [
        'nome'   => 'The Office',
        'fonte'  => 'curso',
        'resumo' => 'Alterna cena encenada com confessionário olhando para a câmera, no estilo docurreality.',
        'dica'   => 'Sem aula em vídeo: abra o card. Corte cena e confessionário com JCut e inserts.',
        'links'  => [
            ['rotulo' => 'sobre',   'url' => 'https://trello.com/c/qckni4O1/34-sobre-the-office'],
            ['rotulo' => 'roteiro', 'url' => 'https://trello.com/c/Lwwe9LEl/35-aplicação-the-office'],
        ],
    ],

    'lo-fi' => [
        'nome'   => 'Lo-Fi',
        'fonte'  => 'curso',
        'resumo' => 'Cru e despretensioso, imperfeito de propósito — praticamente sem edição, que é a proposta.',
        'dica'   => 'Sem aula em vídeo: abra o card. É o formato para o dia em que produzir seria desculpa para não postar.',
        'links'  => [
            ['rotulo' => 'sobre',   'url' => 'https://trello.com/c/tlUxGM88/2-sobre-lo-fi'],
            ['rotulo' => 'roteiro', 'url' => 'https://trello.com/c/dkgv5SQc/3-aplicação-lo-fi'],
        ],
    ],

    'bastidores' => [
        'nome'   => 'Bastidores',
        'fonte'  => 'ambos',
        'resumo' => 'O processo por trás do resultado: como você grava, prepara, erra e refaz.',
        'dica'   => 'Inclua o que deu errado. Bastidor perfeito demais não gera identificação.',
        'links'  => [
            ['rotulo' => 'sobre',   'url' => 'https://trello.com/c/HVZqOiMF/4-sobre-bastidores'],
            ['rotulo' => 'roteiro', 'url' => 'https://trello.com/c/P4cLIl9C/5-aplicação-bastidores'],
        ],
    ],

    'telepatia' => [
        'nome'   => 'Telepatia',
        'fonte'  => 'curso',
        'resumo' => 'Você responde na tela o pensamento que o espectador está tendo naquele segundo.',
        'dica'   => 'Sem card no Trello — só a aula. Funciona quando você conhece bem a objeção do seu público.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/K4k3GkaE4Y'],
        ],
    ],

    'analise' => [
        'nome'   => 'Análise',
        'fonte'  => 'ambos',
        'resumo' => 'Você analisa um caso, produto, perfil ou situação do seu nicho — e isso mostra domínio sem se vender.',
        'dica'   => 'Escolha um exemplo concreto e vá comentando pontos fortes e fracos em tempo real.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/K4k23WK5OY'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DW-Ei6yDQ-3/'],
        ],
    ],

    'analogia' => [
        'nome'   => 'Analogia',
        'fonte'  => 'ambos',
        'resumo' => 'Uma comparação do dia a dia para explicar a mensagem — facilita o entendimento do que é abstrato.',
        'dica'   => 'Pergunte-se: isso é parecido com o quê no dia a dia? E construa o vídeo em cima disso.',
        'links'  => [
            ['rotulo' => 'aula de gravação', 'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/64l2NPjP7j'],
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DXHYCNIjYbP/'],
        ],
    ],

    /* ---------- Só do desafio: sem aula, com a dica do material ---------- */

    'vlog' => [
        'nome'   => 'Vlog',
        'fonte'  => 'desafio',
        'resumo' => 'Cenas soltas de um dia diferente, incluindo imprevisto e conflito, montadas em ordem cronológica.',
        'dica'   => 'Grave clipes curtos ao longo do dia sem se preocupar com perfeição. Dia de evento, viagem ou trabalho puxado é o material.',
        'links'  => [
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DW1a14LjR2V/'],
        ],
    ],

    'conversa-de-bar' => [
        'nome'   => 'Conversa de Bar',
        'fonte'  => 'desafio',
        'resumo' => 'A câmera é mais um amigo na roda — você nem precisa olhar para ela.',
        'dica'   => 'Posicione a câmera de lado, como se fosse mais alguém sentado à mesa. É o formato dos dias em que encarar a lente trava.',
        'links'  => [
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DXCRAh4jU9C/'],
        ],
    ],

    'criativo-preguicoso' => [
        'nome'   => 'Criativo-Preguiçoso',
        'fonte'  => 'desafio',
        'resumo' => 'Todo o esforço vai para um gancho criativo; o resto do vídeo é falado direto, sem corte.',
        'dica'   => 'Invista tudo nos 3 primeiros segundos. É o formato do dia sem energia em que você não quer deixar de postar.',
        'links'  => [
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DXFCXLADb-c/'],
        ],
    ],

    'o-narrador' => [
        'nome'   => 'O Narrador',
        'fonte'  => 'desafio',
        'resumo' => 'Voz sintética contando a história, com efeito de voz do além. Diferente do Narrado, que é a sua voz.',
        'dica'   => 'Escreva o texto, gere a voz na ferramenta (o recurso narrador do CapCut) e sincronize com as cenas.',
        'links'  => [
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DXJ9vPyDSSN/'],
        ],
    ],

    'pov' => [
        'nome'   => 'POV',
        'fonte'  => 'desafio',
        'resumo' => 'Você encena a situação em vez de explicá-la, e o texto na tela dá o contexto em 1 segundo.',
        'dica'   => 'Quanto mais específica a situação, melhor. POV: você é criador é fraco; POV: seu vídeo bombou mas ninguém te seguiu é forte.',
        'links'  => [],
    ],

    'antes-e-depois' => [
        'nome'   => 'Antes e Depois',
        'fonte'  => 'desafio',
        'resumo' => 'Uma transformação concreta: o estado inicial, o método que mudou, o resultado.',
        'dica'   => 'O depois precisa aparecer cedo, nos primeiros segundos, senão ninguém espera para ver. Exige prova real.',
        'links'  => [],
    ],

    'lista' => [
        'nome'   => 'Lista / Contagem Regressiva',
        'fonte'  => 'desafio',
        'resumo' => 'Três erros que, Top 5 — a estrutura numerada cria expectativa e segura até o número 1.',
        'dica'   => 'Antecipe o item mais forte no gancho e deixe ele por último. Ranking convida a discordância no comentário.',
        'links'  => [],
    ],

    'tutorial-relampago' => [
        'nome'   => 'Tutorial Relâmpago',
        'fonte'  => 'desafio',
        'resumo' => 'Uma única dica prática, aplicável na hora, em 15 a 30 segundos. Sem contexto.',
        'dica'   => 'Abra com o problema e mostre a solução em seguida. Utilidade imediata é o que gera salvamento.',
        'links'  => [],
    ],

    'mito-x-verdade' => [
        'nome'   => 'Mito x Verdade',
        'fonte'  => 'desafio',
        'resumo' => 'Você pega uma crença comum do nicho e desmonta com argumento ou evidência.',
        'dica'   => 'Enuncie o mito primeiro, com clareza, e só depois derrube. Sem o contraste não tem impacto.',
        'links'  => [],
    ],

    'reacao' => [
        'nome'   => 'Reação / Stitch',
        'fonte'  => 'desafio',
        'resumo' => 'Você reage a um conteúdo de outra pessoa e acrescenta o seu ponto de vista.',
        'dica'   => 'O conteúdo original ocupa poucos segundos; a maior parte do vídeo tem de ser a sua análise.',
        'links'  => [],
    ],

    'erro-comum' => [
        'nome'   => 'Erro Comum',
        'fonte'  => 'desafio',
        'resumo' => 'Você aponta um erro específico que o seu público comete e mostra o que fazer no lugar.',
        'dica'   => 'Um erro por vídeo, com uma correção clara. Lista de dez erros dilui o impacto.',
        'links'  => [],
    ],

    'experimento' => [
        'nome'   => 'Experimento',
        'fonte'  => 'desafio',
        'resumo' => 'Testei X por Y dias: você se submete a um teste com prazo e mostra o resultado. É consigo, não com terceiros.',
        'dica'   => 'Mostre o resultado numérico ou visual. Sem prova, o vídeo vira só relato.',
        'links'  => [],
    ],

    'expectativa-x-realidade' => [
        'nome'   => 'Expectativa vs Realidade',
        'fonte'  => 'desafio',
        'resumo' => 'Você constrói uma expectativa óbvia e desmonta no fim com uma reviravolta.',
        'dica'   => 'A reviravolta precisa ser inesperada E lógica. Se for aleatória, vira clickbait e o público se sente enganado.',
        'links'  => [],
    ],

    'qa' => [
        'nome'   => 'Q&A / Resposta a Comentário',
        'fonte'  => 'desafio',
        'resumo' => 'Você responde em vídeo a uma pergunta real que recebeu, com o print da pergunta na tela.',
        'dica'   => 'Uma pergunta por vídeo, respondida por inteiro. Cinco respondidas pela metade não servem a ninguém.',
        'links'  => [],
    ],

    'tier-list' => [
        'nome'   => 'Tier List / Dando Nota',
        'fonte'  => 'desafio',
        'resumo' => 'Você avalia e classifica coisas do seu nicho segundo critérios seus.',
        'dica'   => 'Deixe os critérios explícitos, senão vira gosto pessoal e perde valor. Classificação gera debate.',
        'links'  => [],
    ],

    'esquete' => [
        'nome'   => 'Esquete',
        'fonte'  => 'desafio',
        'resumo' => 'Uma pequena encenação com humor, geralmente com dois personagens ou uma situação exagerada.',
        'dica'   => 'Exagere. Esquete com humor tímido não funciona — comprometa-se com a interpretação.',
        'links'  => [],
    ],

    'faceless' => [
        'nome'   => 'Faceless',
        'fonte'  => 'desafio',
        'resumo' => 'Sem aparecer: só as mãos executando algo, ou gravação de tela, com texto e narração por cima.',
        'dica'   => 'O texto na tela precisa carregar a mensagem sozinho — muita gente assiste sem som.',
        'links'  => [],
    ],

    /* ---------- O fecho, e ele é o último por desenho ---------- */

    'combinado' => [
        'nome'   => 'Formato Combinado',
        'fonte'  => 'ambos',
        'resumo' => 'O seu formato: você une os que mais performaram e cria uma estrutura própria, repetível toda semana.',
        'dica'   => 'Olhe as suas métricas, não o seu gosto. O formato que deu mais retenção ganha, mesmo que tenha sido o mais chato de gravar.',
        'links'  => [
            ['rotulo' => 'exemplo da Hanah', 'url' => 'https://www.instagram.com/reel/DXMnTRgjf2C/'],
        ],
    ],
];

/**
 * O apoio que serve a qualquer formato — não é item de fila, é caixa de
 * ferramenta. Fica no rodapé da aba Formatos.
 */
const APOIO_OFICINA = [
    ['rotulo' => 'Quadro completo no Trello',        'url' => 'https://trello.com/b/VOx6su53/formatos-criativos-de-conteudo-alunos'],
    ['rotulo' => 'Por que encontrar o seu formato',  'url' => 'https://trello.com/c/aGR8cWvA/6-porque-encontrar-o-seu-formato'],
    ['rotulo' => 'SOFIA, para adaptar roteiro',      'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/5942825/content/b4K9mRG57X'],
    ['rotulo' => 'Estrutura AIDA',                   'url' => 'https://trello.com/c/LlynMByS/7-universal-aida'],
    ['rotulo' => 'Estrutura I.H.C.',                 'url' => 'https://trello.com/c/IH0uRjIV/24-ihc'],
    ['rotulo' => 'Jeito errado x jeito certo',       'url' => 'https://trello.com/c/wzivLIxb/26-jeito-errado-x-jeito-certo'],
    ['rotulo' => 'Ele, eu, você e futuro',           'url' => 'https://trello.com/c/ZXOJk86T/28-ele-eu-você-e-futuro'],
    ['rotulo' => 'Análise estratégica',              'url' => 'https://trello.com/c/b0Gco8Uj/30-análise-estratégica'],
    ['rotulo' => 'Bônus: mentoria de iluminação',    'url' => 'https://hotmart.com/pt-BR/club/edicaodofuturopelocapcut/products/4921225/content/E4zNXJq64l'],
    /* OS SEIS ELEMENTOS VICIANTES, do mesmo quadro do Trello.
       São um terceiro eixo, ao lado do formato e do gancho: o formato diz como
       se grava, o gancho diz como se abre, e estes dizem por que a pessoa fica.
       Entram como leitura de apoio e não como campo do registro — medir três
       eixos com trinta e sete vídeos não dá amostra para nenhum dos três. */
    ['rotulo' => 'Elemento: relevância emocional',      'url' => 'https://trello.com/c/3cRu2MB4'],
    ['rotulo' => 'Elemento: linguagem familiar',        'url' => 'https://trello.com/c/hzejF59o'],
    ['rotulo' => 'Elemento: tema e moral da história',  'url' => 'https://trello.com/c/Dn78Bbh7'],
    ['rotulo' => 'Elemento: conflito e mudança',        'url' => 'https://trello.com/c/gh2UFJhI'],
    ['rotulo' => 'Elemento: curiosidade e efeito aháa', 'url' => 'https://trello.com/c/Do9DjpUb'],
    ['rotulo' => 'Elemento: contraste',                 'url' => 'https://trello.com/c/z7DR433U'],
    ['rotulo' => 'Músicas emocionalmente relevantes',   'url' => 'https://trello.com/c/1rPNKNdo'],
    /* As fontes da metade que não veio do curso — os formatos 20 a 37 e o anexo
       de ganchos saíram daqui, e ficam citadas para que a origem de cada dica
       continue conferível sem abrir o md. */
    ['rotulo' => 'Formatos faceless (FlowShorts)', 'url' => 'https://flowshorts.app/blog/best-video-ideas'],
    ['rotulo' => 'Modelos de gancho (CreatorsJet)', 'url' => 'https://www.creatorsjet.com/blog/15-tiktok-hook-templates'],
    ['rotulo' => 'Gancho, corpo e desfecho (Socialync)', 'url' => 'https://www.socialync.io/blog/short-form-video-structure-guide-2026'],
    ['rotulo' => 'O que funciona em 2026 (Miraflow)', 'url' => 'https://miraflow.ai/blog/how-to-go-viral-2026-what-actually-works-across-platforms'],
];
