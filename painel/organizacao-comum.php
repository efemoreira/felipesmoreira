<?php
declare(strict_types=1);

/**
 * A ORGANIZAÇÃO PERMANENTE — núcleos, grupos temáticos e a Liga dos Porta-vozes.
 *
 * Nasce do "Plano Missão Ceará 2026–2027" (felipesmoreira.com/plano),
 * escrito depois do 1º turno: o eleitor do 14 existe no Ceará, o que faltou foi
 * gente organizada para levá-lo até os nossos nomes. O plano pede três coisas
 * que o painel não tinha:
 *
 *   - NÚCLEO TERRITORIAL — onde a pessoa atua (bairro, cidade, universidade);
 *   - GRUPO TEMÁTICO — sobre o quê ela atua, com a regra "um tema, um grupo":
 *     categoria profissional e movimento não são grupos à parte, são PORTAS do
 *     mesmo grupo (estudo · profissionais · movimento);
 *   - LIGA DOS PORTA-VOZES — quem representa o partido nas redes e na rua, em
 *     cinco níveis (E→A). Sobe quem cresce nas redes E faz ação real.
 *
 * Núcleo e grupo são a mesma forma — a UNIDADE: um responsável, um substituto,
 * entregas registradas e a próxima atividade marcada. É essa forma que define
 * "ativo" (`unidade_ativa()`), e não a existência da ficha: um núcleo sem
 * entrega no ciclo é um nome numa lista, e o plano mede continuidade, não
 * cadastro.
 *
 * Os catálogos (temas, níveis, escalas) moram aqui e têm par em
 * `src/features/organizacao/catalogo.ts` — o site desenha as portas e a Liga
 * sem esperar a API. `testes/contrato/organizacao.test.ts` prende os dois.
 *
 * O QUE DESCE PARA O SITE (`api/organizacao.php`): só unidade publicada e não
 * encerrada, e nunca o nome de responsável, substituto ou quem registrou — o
 * plano é explícito: "nenhuma lista de participantes ou contato pessoal em
 * página pública". O porta-voz é a exceção que confirma a regra: ele é público
 * por função, e `publicado` é a autorização dele.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_NUCLEOS = PASTA_DADOS . '/nucleos.php';
const ARQ_TEMAS   = PASTA_DADOS . '/temas.php';
const ARQ_LIGA    = PASTA_DADOS . '/liga.php';
const ARQ_BIBLIOTECA = PASTA_DADOS . '/biblioteca.php';
const ARQ_CULTURA = PASTA_DADOS . '/cultura.php';

/**
 * OS EIXOS CULTURAIS — a frente de Cultura do plano ("cultura não é só livro,
 * palestra e debate"). Os 14 eixos não viram 14 grupos: cada grupo cultural
 * escolhe o seu, e o eixo é o que permite ver que linguagens já têm gente.
 * Lista fechada, como TEMAS_GRUPO.
 */
const EIXOS_CULTURAIS = [
    'musica'      => 'Música e expressão sonora',
    'moda'        => 'Moda, vestuário e design',
    'danca'       => 'Dança e movimento',
    'jogos'       => 'Jogos e cultura lúdica',
    'esportes'    => 'Esportes e lazer',
    'artes'       => 'Artes visuais e fotografia',
    'teatro'      => 'Teatro, performance e humor',
    'cinema'      => 'Cinema, audiovisual e animação',
    'literatura'  => 'Literatura, escrita e edição',
    'digital'     => 'Cultura digital',
    'artesanato'  => 'Artesanato e saberes tradicionais',
    'popular'     => 'Cultura popular e patrimônio vivo',
    'gastronomia' => 'Gastronomia e cultura alimentar',
    'arquitetura' => 'Arquitetura, urbanismo e paisagem',
];

/** "Da ideia ao grupo permanente" — os quatro níveis de uma iniciativa cultural. */
const NIVEIS_CULTURA = [
    1 => ['nome' => 'Ideia cultural',     'resumo' => 'Registrada, sem compromisso.'],
    2 => ['nome' => 'Atividade pontual',  'resumo' => 'Data, responsável, orçamento e resultado.'],
    3 => ['nome' => 'Projeto recorrente', 'resumo' => 'Repete com método.'],
    4 => ['nome' => 'Grupo permanente',   'resumo' => 'Equipe, programação e continuidade.'],
];

/**
 * A BIBLIOTECA — "Livro Amarelo, cadernos, diagnósticos e gravações" (o mapa
 * do site no plano). É a fonte do Círculo do Livro Amarelo e o que os grupos
 * temáticos produzem na porta Estudo. Um material é um título, um tipo, um
 * tema opcional e um link https — o arquivo mora onde já está (Drive,
 * YouTube, o PDF do partido); o site não hospeda.
 */
const TIPOS_MATERIAL = [
    'livro-amarelo' => 'Livro Amarelo',
    'caderno'       => 'Caderno',
    'diagnostico'   => 'Diagnóstico',
    'gravacao'      => 'Gravação',
    'guia'          => 'Guia',
];

/**
 * O CATÁLOGO DE TEMAS_GRUPO — um tema, um grupo.
 *
 * Lista fechada pelo mesmo motivo que `CARGOS` e `REDES` são listas: "Segurança",
 * "segurança pública" e "Seg. Pública" digitados por três pessoas viram três
 * grupos, e "um tema, um grupo" deixa de ser regra. `redes` liga a porta
 * Profissionais às redes da ficha (`REDES` em dominio.php) — é dali que sai a
 * lista curta de quem convidar.
 *
 * Cultura NÃO entra: tem frente própria no plano.
 */
const TEMAS_GRUPO = [
    'seguranca' => [
        'nome' => 'Segurança pública',
        'estudo' => 'Violência, crime organizado, juventude e território',
        'profissionais' => 'Policiais, guardas municipais, advogados, agentes comunitários',
        'movimento' => 'Escutas "bairro seguro", audiências públicas',
        'redes' => ['seguranca', 'advogados'],
    ],
    'educacao' => [
        'nome' => 'Educação e juventude',
        'estudo' => 'Escola, universidade, primeiro emprego, formação profissional',
        'profissionais' => 'Professores, estudantes, gestores escolares',
        'movimento' => 'Debates em universidades, reforço comunitário',
        'redes' => ['educacao'],
    ],
    'saude' => [
        'nome' => 'Saúde e esporte',
        'estudo' => 'Acesso a serviços, prevenção, esporte e lazer',
        'profissionais' => 'Médicos, enfermeiros, educadores físicos, atletas',
        'movimento' => 'Corridas comunitárias, ações de orientação',
        'redes' => ['medicos'],
    ],
    'economia' => [
        'nome' => 'Economia e empreendedorismo',
        'estudo' => 'Emprego, pequenos negócios, comércio, agro',
        'profissionais' => 'Empresários, comerciantes, autônomos, produtores',
        'movimento' => 'Feiras, encontros com empreendedores',
        'redes' => ['empresarios', 'campo'],
    ],
    'cidades' => [
        'nome' => 'Cidades e infraestrutura',
        'estudo' => 'Mobilidade, habitação, saneamento, espaços públicos',
        'profissionais' => 'Arquitetos, engenheiros, urbanistas',
        'movimento' => 'Caminhadas urbanas, mapa de problemas',
        'redes' => [],
    ],
    'instituicoes' => [
        'nome' => 'Instituições e direito',
        'estudo' => 'Transparência, orçamento público, serviços, leis',
        'profissionais' => 'Advogados, servidores, contadores',
        'movimento' => 'Fiscalização cidadã, guia de direitos',
        'redes' => ['advogados'],
    ],
    'mulheres' => [
        'nome' => 'Mulheres e família',
        'estudo' => 'Participação, segurança, autonomia, conciliação de rotinas',
        'profissionais' => 'Profissionais de todas as áreas',
        'movimento' => 'Rodas de conversa, redes de apoio',
        'redes' => ['igrejas'],
    ],
    'tecnologia' => [
        'nome' => 'Tecnologia e inovação',
        'estudo' => 'Governo digital, dados, IA, startups',
        'profissionais' => 'Desenvolvedores, pesquisadores, empreendedores de tecnologia',
        'movimento' => 'Oficinas, protótipos, hackathons',
        'redes' => [],
    ],
    'sertao' => [
        'nome' => 'Água, sertão e meio ambiente',
        'estudo' => 'Convivência com o semiárido, recursos hídricos, clima',
        'profissionais' => 'Agrônomos, produtores rurais, técnicos ambientais',
        'movimento' => 'Diagnósticos no interior, campanhas educativas',
        'redes' => ['campo'],
    ],
];

/**
 * "Começar com no máximo três." Não trava — avisa. Quem decide abrir o quarto é
 * a coordenação, mas decide sabendo que o plano pediu três e por quê: grupo
 * aberto sem gente é o organograma vazio que o primeiro princípio proíbe.
 */
const TETO_TEMAS_ABERTOS = 3;

/** Classificação territorial — ferramenta de gestão, não órgão partidário. */
const NIVEIS_TERRITORIO = [
    'T0' => ['nome' => 'Localidade mapeada',       'resumo' => 'Há contatos ou informações, sem grupo organizado.',        'proximo' => 'Conhecer demandas e fazer uma atividade aberta'],
    'T1' => ['nome' => 'Articulação em formação',  'resumo' => 'Interessados se conhecem, rotina ainda não existe.',        'proximo' => 'Marcar rotina e dividir tarefas'],
    'T2' => ['nome' => 'Núcleo ativo',             'resumo' => 'Responsável, participantes recorrentes e atividades registradas.', 'proximo' => 'Formar substituto e agenda local'],
    'T3' => ['nome' => 'Organização consolidada',  'resumo' => 'Planeja, executa e avalia com continuidade.',               'proximo' => 'Receber grupos temáticos e ter porta-voz local'],
    'T4' => ['nome' => 'Polo multiplicador',       'resumo' => 'Apoia cidades vizinhas e forma responsáveis.',             'proximo' => 'Documentar o método e apoiar novos núcleos'],
];

/** Maturidade dos grupos temáticos — 0 a 4. */
const MATURIDADE = [
    0 => ['nome' => 'Não estruturado', 'resumo' => 'Sem responsável, plano ou rotina.',                              'proximo' => 'Designar responsável e primeira entrega'],
    1 => ['nome' => 'Em implantação',  'resumo' => 'Responsável e plano; primeiro ciclo não concluído.',             'proximo' => 'Concluir o ciclo e testar a rotina'],
    2 => ['nome' => 'Ativo',           'resumo' => 'Atividades recorrentes e entregas verificáveis.',                'proximo' => 'Padronizar tarefas e distribuir responsabilidades'],
    3 => ['nome' => 'Consolidado',     'resumo' => 'Autonomia e continuidade sem depender de uma pessoa.',           'proximo' => 'Preparar substitutos e documentar'],
    4 => ['nome' => 'Multiplicador',   'resumo' => 'Forma responsáveis e ajuda outras unidades.',                    'proximo' => 'Compartilhar métodos'],
];

/** As ondas do território, pelo painel de resultados (aba Decisões). */
const ONDAS = [
    1 => 'Onda 1 · âncoras convertidas',
    2 => 'Onda 2 · cidades potencial',
    3 => 'Onda 3 · bases de candidato',
    0 => 'Mapear (T0)',
];

const TIPOS_NUCLEO = [
    'bairro'       => 'Bairro',
    'cidade'       => 'Cidade',
    'universidade' => 'Universidade',
];

/** "Cada unidade declara se age toda semana, a cada quinze dias ou uma vez por mês." */
const RITMOS = [
    'semanal'   => 'Toda semana',
    'quinzenal' => 'A cada quinze dias',
    'mensal'    => 'Uma vez por mês',
];

/**
 * O ciclo é mensal: "ativo" é ter registrado entrega nos últimos 31 dias. Um
 * dia a mais que o mês mais longo, para a reunião do dia 1º não declarar parado
 * quem registrou no dia 1º do mês anterior.
 */
const DIAS_DO_CICLO = 31;

/**
 * A LIGA — cinco níveis, e o que se exige para chegar a cada um.
 *
 * `seguidores` e `engajamento` são os pisos PARA ESTAR no nível; `exige` é a
 * ação. Os números saem do estudo do plano: 1.000 é a entrada da faixa "nano",
 * 10.000 a da "micro"; os pisos de engajamento ficam abaixo da média de cada
 * faixa (~4,7% nano, ~2,5% micro) — filtram seguidor comprado sem punir quem
 * começa.
 */
const NIVEIS_LIGA = [
    'E' => ['nome' => 'Base',              'seguidores' => 0,     'engajamento' => 0.0, 'exige' => 'Estar na Liga'],
    'D' => ['nome' => 'Constância',        'seguidores' => 0,     'engajamento' => 0.0, 'exige' => 'Estruturar Instagram, TikTok, YouTube e X'],
    'C' => ['nome' => 'Formação',          'seguidores' => 1000,  'engajamento' => 3.0, 'exige' => '8 semanas seguidas com 3 vídeos e 2 meses seguidos crescendo'],
    'B' => ['nome' => 'Território',        'seguidores' => 3000,  'engajamento' => 2.5, 'exige' => 'Concluir a formação de militância'],
    'A' => ['nome' => 'Porta-voz de peso', 'seguidores' => 10000, 'engajamento' => 2.0, 'exige' => 'Liderar uma ação local (20+ pessoas, registrada)'],
];

/** As quatro redes que contam — seguidores somados é a soma destas. */
const REDES_LIGA = [
    'instagram' => 'Instagram',
    'tiktok'    => 'TikTok',
    'youtube'   => 'YouTube',
    'x'         => 'X',
];

/* =====================================================================
   A UNIDADE — o que núcleo e grupo têm em comum
   ===================================================================== */

/** Uma data ISO (AAAA-MM-DD) ou vazio. */
function data_iso_ou_vazio($v): string
{
    $v = limpar_texto($v ?? '', 10);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) === 1 ? $v : '';
}

/** Link público de contato: só https, pela régua do `grupo` da ficha. */
function contato_publico($v): string
{
    $v = trim((string) ($v ?? ''));
    return str_starts_with(mb_strtolower($v), 'https://') ? limpar_texto($v, 200) : '';
}

/** O registro do que foi feito. "Cada unidade registra a entrega até 7 dias depois." */
function normalizar_entrega($e): ?array
{
    if (!is_array($e) || empty($e['id'])) {
        return null;
    }
    $texto = limpar_texto($e['texto'] ?? '', 200);
    $data = data_iso_ou_vazio($e['data'] ?? '');
    if ($texto === '' || $data === '') {
        return null;
    }
    return [
        'id'    => limpar_texto($e['id'], 40),
        'data'  => $data,
        'texto' => $texto,
        /* Quantas pessoas estiveram — é o "20+ pessoas" da Liga e o "participantes
           que voltam" do núcleo. Zero é "não contado", não "ninguém". */
        'pessoas' => max(0, min(100000, (int) ($e['pessoas'] ?? 0))),
        'porId'   => limpar_texto($e['porId'] ?? '', 40),
        'em'      => limpar_texto($e['em'] ?? '', 40),
    ];
}

/** Os campos que núcleo e grupo dividem. */
function normalizar_unidade_base(array $u): array
{
    $entregas = [];
    foreach ((array) ($u['entregas'] ?? []) as $e) {
        if ($ok = normalizar_entrega($e)) {
            $entregas[] = $ok;
        }
    }
    /* Mais recente primeiro: a pergunta é "o que fizeram por último". */
    usort($entregas, fn ($a, $b) => [$b['data'], $b['em']] <=> [$a['data'], $a['em']]);

    $ritmo = (string) ($u['ritmo'] ?? 'mensal');
    return [
        'id'             => limpar_texto($u['id'], 40),
        'responsavelId'  => limpar_texto($u['responsavelId'] ?? '', 40),
        /* Desde quando — é a data em que a pessoa sobe para o degrau
           "Responsável" na escada (`escada-comum.php`). */
        'responsavelDesde' => limpar_texto($u['responsavelDesde'] ?? '', 40),
        'substitutoId'   => limpar_texto($u['substitutoId'] ?? '', 40),
        'substitutoDesde' => limpar_texto($u['substitutoDesde'] ?? '', 40),
        'ritmo'          => isset(RITMOS[$ritmo]) ? $ritmo : 'mensal',
        'proximaData'    => data_iso_ou_vazio($u['proximaData'] ?? ''),
        'proximaTexto'   => limpar_texto($u['proximaTexto'] ?? '', 140),
        'contato'        => contato_publico($u['contato'] ?? ''),
        'publicado'      => !empty($u['publicado']),
        'evidencia'      => limpar_texto($u['evidencia'] ?? '', 200),
        'entregas'       => $entregas,
        'encerradoEm'    => limpar_texto($u['encerradoEm'] ?? '', 40),
        'criadoEm'       => limpar_texto($u['criadoEm'] ?? '', 40),
        'criadoPor'      => limpar_texto($u['criadoPor'] ?? '', 60),
        'alteradoEm'     => limpar_texto($u['alteradoEm'] ?? '', 40),
        'alteradoPor'    => limpar_texto($u['alteradoPor'] ?? '', 60),
    ];
}

/** Hoje no Ceará, AAAA-MM-DD. */
function hoje_ce(?int $agora = null): string
{
    return (new DateTimeImmutable('@' . ($agora ?? time())))
        ->setTimezone(new DateTimeZone('America/Fortaleza'))
        ->format('Y-m-d');
}

/**
 * O próximo encontro de cada unidade, `unidadeId => encontro`.
 *
 * A PRÓXIMA ATIVIDADE DE UM NÚCLEO É UM ENCONTRO — "um modelo para todos":
 * o mesmo cadastro, a mesma agenda pública, o mesmo QR na porta. Memoizada,
 * porque a tela da Organização pergunta por unidade, linha a linha.
 */
function proximos_encontros_das_unidades(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    require_once __DIR__ . '/eventos-comum.php';
    $memo = [];
    foreach (eventos_a_vir() as $e) {
        if ($e['unidadeId'] !== '' && $e['status'] !== 'cancelado' && !isset($memo[$e['unidadeId']])) {
            $memo[$e['unidadeId']] = $e;
        }
    }
    return $memo;
}

/**
 * A próxima atividade de verdade: o próximo encontro amarrado à unidade, ou —
 * para o que foi marcado antes de a próxima virar encontro — o par
 * `proximaData`/`proximaTexto` da ficha. `null` quando não há nada adiante.
 */
function proxima_efetiva(array $u, ?int $agora = null): ?array
{
    $e = proximos_encontros_das_unidades()[$u['id']] ?? null;
    if ($e !== null) {
        return ['data' => dia_do_inicio($e['inicio']), 'texto' => $e['titulo'], 'eventoId' => $e['id']];
    }
    if ($u['proximaData'] !== '' && $u['proximaData'] >= hoje_ce($agora)) {
        return ['data' => $u['proximaData'], 'texto' => $u['proximaTexto'], 'eventoId' => ''];
    }
    return null;
}

/** A entrega mais recente, ou null. */
function ultima_entrega(array $u): ?array
{
    return $u['entregas'][0] ?? null;
}

/**
 * ATIVA, pela definição do plano: "tem responsável, fez atividade no ciclo,
 * registrou ao menos uma entrega e tem plano para o próximo". As quatro, e não
 * três de quatro — é a definição que evita número enganoso.
 */
function unidade_ativa(array $u, ?int $agora = null): bool
{
    if ($u['encerradoEm'] !== '' || $u['responsavelId'] === '') {
        return false;
    }
    $ultima = ultima_entrega($u);
    if ($ultima === null) {
        return false;
    }
    $hoje = hoje_ce($agora);
    $corte = (new DateTimeImmutable($hoje))->modify('-' . DIAS_DO_CICLO . ' days')->format('Y-m-d');
    return $ultima['data'] >= $corte && proxima_efetiva($u, $agora) !== null;
}

/**
 * O que falta para ser ativa — a frase que a tela mostra ao lado de "parada".
 * Lista vazia quando está ativa (ou encerrada: encerrada não deve nada).
 */
function o_que_falta(array $u, ?int $agora = null): array
{
    if ($u['encerradoEm'] !== '' || unidade_ativa($u, $agora)) {
        return [];
    }
    $falta = [];
    if ($u['responsavelId'] === '') {
        $falta[] = 'responsável';
    }
    $ultima = ultima_entrega($u);
    $hoje = hoje_ce($agora);
    $corte = (new DateTimeImmutable($hoje))->modify('-' . DIAS_DO_CICLO . ' days')->format('Y-m-d');
    if ($ultima === null || $ultima['data'] < $corte) {
        $falta[] = 'entrega no ciclo';
    }
    if (proxima_efetiva($u, $agora) === null) {
        $falta[] = 'próxima atividade marcada';
    }
    return $falta;
}

/** Abertas = não encerradas. */
function so_abertas(array $unidades): array
{
    return array_values(array_filter($unidades, fn ($u) => $u['encerradoEm'] === ''));
}

/**
 * Carimba "desde quando" quando o responsável ou o substituto MUDA. Sem isto a
 * escada não teria data para o degrau Responsável, e a contagem "subiram de
 * degrau no mês" contaria todo mundo no mês em que a ficha nasceu.
 */
function carimbar_responsaveis(array $nova, ?array $antiga): array
{
    $agora = date('c');
    foreach (['responsavel', 'substituto'] as $papel) {
        $id = $nova[$papel . 'Id'] ?? '';
        $antes = $antiga[$papel . 'Id'] ?? '';
        $desdeAntes = $antiga[$papel . 'Desde'] ?? '';
        $nova[$papel . 'Desde'] = match (true) {
            $id === ''                           => '',
            $id === $antes && $desdeAntes !== '' => $desdeAntes,
            default                              => $agora,
        };
    }
    return $nova;
}

/* =====================================================================
   NÚCLEOS TERRITORIAIS
   ===================================================================== */

function normalizar_nucleo($n): ?array
{
    if (!is_array($n) || empty($n['id'])) {
        return null;
    }
    $nome = limpar_texto($n['nome'] ?? '', 80);
    if ($nome === '') {
        return null;
    }
    $tipo = (string) ($n['tipo'] ?? 'bairro');
    $nivel = (string) ($n['nivel'] ?? 'T0');
    $onda = (int) ($n['onda'] ?? 0);
    return normalizar_unidade_base($n) + [
        'nome'   => $nome,
        'tipo'   => isset(TIPOS_NUCLEO[$tipo]) ? $tipo : 'bairro',
        'cidade' => cidade_valida($n['cidade'] ?? ''),
        'bairro' => limpar_texto($n['bairro'] ?? '', 60),
        'onda'   => isset(ONDAS[$onda]) ? $onda : 0,
        'nivel'  => isset(NIVEIS_TERRITORIO[$nivel]) ? $nivel : 'T0',
    ];
}

function ler_nucleos(): array
{
    $bruto = is_file(ARQ_NUCLEOS) ? @include ARQ_NUCLEOS : null;
    $limpos = [];
    foreach (is_array($bruto) ? $bruto : [] as $n) {
        if ($ok = normalizar_nucleo($n)) {
            $limpos[] = $ok;
        }
    }
    /* Abertos primeiro; dentro deles, por onda (1 antes de 2; 0 = mapear, por
       último) e pelo nome. É a ordem em que o plano manda olhar. */
    usort($limpos, fn ($a, $b) => [
        $a['encerradoEm'] !== '', $a['onda'] === 0, $a['onda'], sem_acento($a['nome']),
    ] <=> [
        $b['encerradoEm'] !== '', $b['onda'] === 0, $b['onda'], sem_acento($b['nome']),
    ]);
    return $limpos;
}

function gravar_nucleos(array $nucleos): bool
{
    return gravar_lista_organizacao(ARQ_NUCLEOS, $nucleos, 'normalizar_nucleo', ler_nucleos(),
        'Os núcleos territoriais — onde a militância atua.');
}

/* =====================================================================
   GRUPOS TEMÁTICOS
   ===================================================================== */

function normalizar_grupo($g): ?array
{
    if (!is_array($g) || empty($g['id'])) {
        return null;
    }
    $tema = (string) ($g['tema'] ?? '');
    if (!isset(TEMAS_GRUPO[$tema])) {
        return null;
    }
    $maturidade = (int) ($g['maturidade'] ?? 0);
    $nucleos = array_values(array_unique(array_filter(array_map(
        fn ($id) => limpar_texto($id, 40),
        is_array($g['nucleos'] ?? null) ? $g['nucleos'] : []
    ))));
    return normalizar_unidade_base($g) + [
        'tema'       => $tema,
        /* As quatro perguntas de antes de abrir: finalidade, primeira entrega
           (em 30 a 60 dias) e o prazo dela. O responsável é a quarta, e mora
           na base. */
        'finalidade' => limpar_texto($g['finalidade'] ?? '', 200),
        'primeiraEntrega' => limpar_texto($g['primeiraEntrega'] ?? '', 140),
        'primeiraEntregaAte' => data_iso_ou_vazio($g['primeiraEntregaAte'] ?? ''),
        'maturidade' => isset(MATURIDADE[$maturidade]) ? $maturidade : 0,
        /* As três portas, no texto DESTE grupo — o catálogo dá o ponto de
           partida, o grupo diz o que está fazendo agora. */
        'portaEstudo'        => limpar_texto($g['portaEstudo'] ?? '', 200),
        'portaProfissionais' => limpar_texto($g['portaProfissionais'] ?? '', 200),
        'portaMovimento'     => limpar_texto($g['portaMovimento'] ?? '', 200),
        'nucleos'    => $nucleos,
        'portaVozId' => limpar_texto($g['portaVozId'] ?? '', 40),
    ];
}

function ler_grupos(): array
{
    $bruto = is_file(ARQ_TEMAS) ? @include ARQ_TEMAS : null;
    $limpos = [];
    foreach (is_array($bruto) ? $bruto : [] as $g) {
        if ($ok = normalizar_grupo($g)) {
            $limpos[] = $ok;
        }
    }
    $ordem = array_flip(array_keys(TEMAS_GRUPO));
    usort($limpos, fn ($a, $b) => [$a['encerradoEm'] !== '', $ordem[$a['tema']]] <=> [$b['encerradoEm'] !== '', $ordem[$b['tema']]]);
    return $limpos;
}

function gravar_grupos(array $grupos): bool
{
    return gravar_lista_organizacao(ARQ_TEMAS, $grupos, 'normalizar_grupo', ler_grupos(),
        'Os grupos temáticos — um tema, um grupo.');
}

/** O grupo aberto deste tema, se houver. "Um tema, um grupo" é isto. */
function grupo_aberto_do_tema(string $tema, array $grupos, string $ignorarId = ''): ?array
{
    foreach ($grupos as $g) {
        if ($g['tema'] === $tema && $g['encerradoEm'] === '' && $g['id'] !== $ignorarId) {
            return $g;
        }
    }
    return null;
}

/* =====================================================================
   GRUPOS CULTURAIS
   ===================================================================== */

function normalizar_cultural($c): ?array
{
    if (!is_array($c) || empty($c['id'])) {
        return null;
    }
    $nome = limpar_texto($c['nome'] ?? '', 80);
    if ($nome === '') {
        return null;
    }
    $eixo = (string) ($c['eixo'] ?? '');
    $nivel = (int) ($c['nivel'] ?? 1);
    return normalizar_unidade_base($c) + [
        'nome'   => $nome,
        'eixo'   => isset(EIXOS_CULTURAIS[$eixo]) ? $eixo : 'popular',
        'nivel'  => isset(NIVEIS_CULTURA[$nivel]) ? $nivel : 1,
        /* Cidade é opcional: um cineclube é de um lugar, um podcast não. */
        'cidade' => cidade_valida($c['cidade'] ?? ''),
        'bairro' => limpar_texto($c['bairro'] ?? '', 60),
    ];
}

function ler_culturais(): array
{
    $bruto = is_file(ARQ_CULTURA) ? @include ARQ_CULTURA : null;
    $limpos = [];
    foreach (is_array($bruto) ? $bruto : [] as $c) {
        if ($ok = normalizar_cultural($c)) {
            $limpos[] = $ok;
        }
    }
    usort($limpos, fn ($a, $b) => [$a['encerradoEm'] !== '', -$a['nivel'], sem_acento($a['nome'])] <=> [$b['encerradoEm'] !== '', -$b['nivel'], sem_acento($b['nome'])]);
    return $limpos;
}

function gravar_culturais(array $culturais): bool
{
    return gravar_lista_organizacao(ARQ_CULTURA, $culturais, 'normalizar_cultural', ler_culturais(),
        'Os grupos culturais — da ideia ao grupo permanente.');
}

/* =====================================================================
   A UNIDADE, DE QUALQUER TIPO — a mesma conversa para os três
   ===================================================================== */

/**
 * Prefixo do id → tipo, quem lê e quem grava. É aqui, e só aqui, que um tipo
 * novo de unidade se pluga (com o regex `PADRAO_UNIDADE` em dominio.php).
 */
const LEITORES_DE_UNIDADE = [
    'nuc' => ['tipo' => 'nucleo',  'ler' => 'ler_nucleos',   'gravar' => 'gravar_nucleos',   'aba' => ''],
    'grp' => ['tipo' => 'grupo',   'ler' => 'ler_grupos',    'gravar' => 'gravar_grupos',    'aba' => 'temas'],
    'cul' => ['tipo' => 'cultura', 'ler' => 'ler_culturais', 'gravar' => 'gravar_culturais', 'aba' => 'cultura'],
];

/** O registro de leitura/gravação de um tipo ('nucleo'|'grupo'|'cultura') ou de um id. */
function leitor_de_unidade(string $tipoOuId): array
{
    foreach (LEITORES_DE_UNIDADE as $prefixo => $l) {
        if ($tipoOuId === $l['tipo'] || str_starts_with($tipoOuId, $prefixo . '-')) {
            return $l;
        }
    }
    return LEITORES_DE_UNIDADE['nuc'];
}

/** O tipo de uma unidade: 'nucleo', 'grupo' ou 'cultura'. */
function tipo_da_unidade(array $u): string
{
    return leitor_de_unidade($u['id'])['tipo'];
}

/** Todas as unidades, dos três tipos, abertas e encerradas. */
function todas_as_unidades(): array
{
    $todas = [];
    foreach (LEITORES_DE_UNIDADE as $l) {
        $todas = array_merge($todas, $l['ler']());
    }
    return $todas;
}

/** Uma unidade por id, de qualquer tipo, aberta ou não. */
function unidade_por_id(string $id): ?array
{
    if (id_de_unidade($id) === '') {
        return null;
    }
    foreach (leitor_de_unidade($id)['ler']() as $u) {
        if ($u['id'] === $id) {
            return $u;
        }
    }
    return null;
}

/** "Núcleo Benfica" · "Grupo Saúde e esporte" · "Cultura: Cineclube do Benfica". */
function rotulo_da_unidade(array $u): string
{
    return match (tipo_da_unidade($u)) {
        'grupo'   => 'Grupo ' . TEMAS_GRUPO[$u['tema']]['nome'],
        'cultura' => 'Cultura: ' . $u['nome'],
        default   => 'Núcleo ' . $u['nome'],
    };
}

/* =====================================================================
   LIGA DOS PORTA-VOZES
   ===================================================================== */

/** "2026-10" — o mês de um registro. */
function mes_valido($v): string
{
    $v = limpar_texto($v ?? '', 7);
    return preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $v) === 1 ? $v : '';
}

/**
 * O fechamento do mês de um porta-voz — o que o placar lê.
 *
 * Um registro por mês, digitado na revisão mensal. Não é diário de propósito:
 * o plano mede tendência (crescer mês a mês), e número diário digitado à mão é
 * número que alguém vai deixar de digitar na segunda semana.
 */
function normalizar_mes_liga($m): ?array
{
    if (!is_array($m)) {
        return null;
    }
    $mes = mes_valido($m['mes'] ?? '');
    if ($mes === '') {
        return null;
    }
    $redes = [];
    foreach (array_keys(REDES_LIGA) as $r) {
        $redes[$r] = max(0, min(100000000, (int) ($m['redes'][$r] ?? 0)));
    }
    return [
        'mes'         => $mes,
        /* Por rede, e a soma sai daqui — "seguidores somados" digitado à mão
           seria uma segunda verdade ao lado das quatro. */
        'redes'       => $redes,
        /* Interações ÷ seguidores, média dos últimos 30 dias, em %. Uma casa. */
        'engajamento' => round(max(0.0, min(100.0, (float) str_replace(',', '.', (string) ($m['engajamento'] ?? 0)))), 1),
        /* A sequência de semanas com 3 vídeos ao FECHAR o mês. É sequência, e
           não contagem, porque é o que o nível C pede ("8 semanas seguidas"). */
        'semanasSeguidas' => max(0, min(520, (int) ($m['semanasSeguidas'] ?? 0))),
        /* Todas as semanas DESTE mês com 3 vídeos — é a constância do placar. */
        'todasSemanas' => !empty($m['todasSemanas']),
        'acoes'   => max(0, min(50, (int) ($m['acoes'] ?? 0))),
        'modulos' => max(0, min(50, (int) ($m['modulos'] ?? 0))),
        'lives'   => max(0, min(50, (int) ($m['lives'] ?? 0))),
        'em'      => limpar_texto($m['em'] ?? '', 40),
        'por'     => limpar_texto($m['por'] ?? '', 60),
    ];
}

function normalizar_porta_voz($p): ?array
{
    if (!is_array($p) || empty($p['id'])) {
        return null;
    }
    $nome = limpar_texto($p['nome'] ?? '', 80);
    if ($nome === '') {
        return null;
    }
    $tema = (string) ($p['tema'] ?? '');
    $perfis = [];
    foreach (array_keys(REDES_LIGA) as $r) {
        /* O @ ou o link do perfil — o site monta o link pelo @. */
        $perfis[$r] = ltrim(limpar_texto($p['perfis'][$r] ?? '', 60), '@ ');
    }
    $meses = [];
    foreach ((array) ($p['meses'] ?? []) as $m) {
        if ($ok = normalizar_mes_liga($m)) {
            $meses[$ok['mes']] = $ok;  // um por mês: o último gravado vence
        }
    }
    ksort($meses);

    return [
        'id'       => limpar_texto($p['id'], 40),
        'pessoaId' => limpar_texto($p['pessoaId'] ?? '', 40),
        /* O nome que vai a público — o de urna, o artístico, o que ele usa
           nas redes. */
        'nome'     => $nome,
        /* "Cada porta-voz é 'a voz de' algo": um tema e um lugar. */
        'tema'     => isset(TEMAS_GRUPO[$tema]) ? $tema : '',
        'cidade'   => cidade_valida($p['cidade'] ?? ''),
        'bairro'   => limpar_texto($p['bairro'] ?? '', 60),
        'perfis'   => $perfis,
        /* As três comprovações que não são número — cada uma com a data em que
           a coordenação validou. Vazio é "ainda não". */
        'redesEm'    => data_iso_ou_vazio($p['redesEm'] ?? ''),
        'formacaoEm' => data_iso_ou_vazio($p['formacaoEm'] ?? ''),
        'acaoEm'     => data_iso_ou_vazio($p['acaoEm'] ?? ''),
        'acaoTexto'  => limpar_texto($p['acaoTexto'] ?? '', 160),
        'meses'      => array_values($meses),
        /* "Conteúdos dos porta-vozes" — o vídeo que ele quer mostrar no site.
           Um link, e não um embed: o site não carrega script de rede social. */
        'destaque'   => link_de_destaque($p['destaque'] ?? ''),
        'publicado'  => !empty($p['publicado']),
        'encerradoEm' => limpar_texto($p['encerradoEm'] ?? '', 40),
        'encerradoMotivo' => limpar_texto($p['encerradoMotivo'] ?? '', 120),
        'criadoEm'   => limpar_texto($p['criadoEm'] ?? '', 40),
        'criadoPor'  => limpar_texto($p['criadoPor'] ?? '', 60),
        'alteradoEm'  => limpar_texto($p['alteradoEm'] ?? '', 40),
        'alteradoPor' => limpar_texto($p['alteradoPor'] ?? '', 60),
    ];
}

/** Só https de Instagram, TikTok, YouTube ou X — o resto vira ''. */
function link_de_destaque($v): string
{
    $v = trim((string) $v);
    $host = strtolower((string) parse_url($v, PHP_URL_HOST));
    $host = preg_replace('/^(www\.|m\.)/', '', $host) ?? '';
    $aceitos = ['instagram.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'x.com', 'twitter.com'];
    return str_starts_with(strtolower($v), 'https://') && in_array($host, $aceitos, true) ? limpar_texto($v, 300) : '';
}

function ler_liga(): array
{
    $bruto = is_file(ARQ_LIGA) ? @include ARQ_LIGA : null;
    $limpos = [];
    foreach (is_array($bruto) ? $bruto : [] as $p) {
        if ($ok = normalizar_porta_voz($p)) {
            $limpos[] = $ok;
        }
    }
    $ordem = array_flip(array_keys(NIVEIS_LIGA));
    /* Na ordem da Liga: A no topo. Encerrado por último. */
    usort($limpos, fn ($a, $b) => [
        $a['encerradoEm'] !== '', -$ordem[nivel_liga($a)['nivel']], -seguidores_de($a), sem_acento($a['nome']),
    ] <=> [
        $b['encerradoEm'] !== '', -$ordem[nivel_liga($b)['nivel']], -seguidores_de($b), sem_acento($b['nome']),
    ]);
    return $limpos;
}

function gravar_liga(array $liga): bool
{
    return gravar_lista_organizacao(ARQ_LIGA, $liga, 'normalizar_porta_voz', ler_liga(),
        'A Liga dos Porta-vozes — fichas e fechamentos do mês.');
}

/** O último fechamento, ou null. */
function ultimo_mes(array $pv): ?array
{
    return $pv['meses'] === [] ? null : $pv['meses'][count($pv['meses']) - 1];
}

/** Seguidores somados no último fechamento. */
function seguidores_de(array $pv, ?array $mes = null): int
{
    $m = $mes ?? ultimo_mes($pv);
    return $m === null ? 0 : array_sum($m['redes']);
}

/**
 * Meses seguidos crescendo, contados do último para trás. Crescer é ganho
 * líquido de seguidores sobre o mês anterior — e só conta mês colado no
 * anterior: um buraco de registro zera a sequência, porque não dá para dizer
 * que cresceu num mês que ninguém mediu.
 */
function meses_crescendo(array $pv): int
{
    $meses = $pv['meses'];
    $n = 0;
    for ($i = count($meses) - 1; $i > 0; $i--) {
        $atual = $meses[$i];
        $antes = $meses[$i - 1];
        $esperado = (new DateTimeImmutable($antes['mes'] . '-01'))->modify('+1 month')->format('Y-m');
        if ($atual['mes'] !== $esperado || seguidores_de($pv, $atual) <= seguidores_de($pv, $antes)) {
            break;
        }
        $n++;
    }
    return $n;
}

/**
 * A formação de militância do porta-voz: o certificado da Básica (lido do
 * progresso da formação), ou a validação à mão da coordenação — a exceção
 * para quem estudou antes de o painel registrar.
 */
function formacao_concluida(array $pv): bool
{
    if ($pv['formacaoEm'] !== '') {
        return true;
    }
    if ($pv['pessoaId'] === '') {
        return false;
    }
    require_once __DIR__ . '/formacao-comum.php';
    return certificado_basica_em($pv['pessoaId']) !== '';
}

/**
 * O NÍVEL — a mesma escada da calculadora do plano, degrau por degrau.
 *
 * Sobe-se em ordem: não chega ao B quem não passou pelo C, mesmo com 50 mil
 * seguidores. É a regra que impede o porta-voz "só de rede" (o risco do mapa de
 * riscos) de pular a formação e a rua.
 *
 * Devolve o nível e o que falta para o próximo, já em frases.
 */
function nivel_liga(array $pv): array
{
    $seg = seguidores_de($pv);
    $m = ultimo_mes($pv);
    $eng = $m['engajamento'] ?? 0.0;
    $sem = $m['semanasSeguidas'] ?? 0;
    $crescendo = meses_crescendo($pv);

    $degraus = [
        'D' => [
            [$pv['redesEm'] !== '', 'Estruturar Instagram, TikTok, YouTube e X (validado pela coordenação)'],
        ],
        'C' => [
            [$seg >= 1000, '1.000 seguidores somados' . ($seg < 1000 ? ' (faltam ' . number_format(1000 - $seg, 0, ',', '.') . ')' : '')],
            [$crescendo >= 2, 'Crescer 2 meses seguidos'],
            [$sem >= 8, '8 semanas seguidas com 3 vídeos'],
            [$eng >= 3.0, 'Engajamento de 3% ou mais'],
        ],
        'B' => [
            [formacao_concluida($pv), 'Concluir a formação de militância (a trilha Básica)'],
            [$seg >= 3000, '3.000 seguidores somados' . ($seg < 3000 ? ' (faltam ' . number_format(3000 - $seg, 0, ',', '.') . ')' : '')],
            [$eng >= 2.5, 'Engajamento de 2,5% ou mais'],
        ],
        'A' => [
            [$pv['acaoEm'] !== '', 'Liderar uma ação local registrada (20+ pessoas)'],
            [$seg >= 10000, '10.000 seguidores somados' . ($seg < 10000 ? ' (faltam ' . number_format(10000 - $seg, 0, ',', '.') . ')' : '')],
            [$eng >= 2.0, 'Engajamento de 2% ou mais'],
        ],
    ];

    $nivel = 'E';
    foreach ($degraus as $para => $itens) {
        if (array_product(array_map(fn ($i) => $i[0] ? 1 : 0, $itens)) === 1) {
            $nivel = $para;
            continue;
        }
        return [
            'nivel' => $nivel,
            'proximo' => $para,
            'falta' => array_values(array_map(fn ($i) => $i[1], array_filter($itens, fn ($i) => !$i[0]))),
        ];
    }
    return ['nivel' => 'A', 'proximo' => '', 'falta' => []];
}

/**
 * O PLACAR DO MÊS — 100 pontos, como o plano descreve.
 *
 *   crescimento  até 40 · 4 pontos por 1% de crescimento líquido no mês
 *   engajamento  até 20 · 4 pontos por 1% de taxa
 *   ações reais  até 30 · ação local 20 · módulo de formação 10 · live 5
 *   constância   até 10 · todas as semanas do mês com 3 vídeos
 *
 * Crescimento sem o mês anterior registrado vale zero: crescimento é relação
 * entre dois números, e com um só não há relação.
 */
function placar_do_mes(array $pv, string $mes): ?array
{
    $atual = null;
    $antes = null;
    foreach ($pv['meses'] as $i => $m) {
        if ($m['mes'] === $mes) {
            $atual = $m;
            $anterior = (new DateTimeImmutable($mes . '-01'))->modify('-1 month')->format('Y-m');
            $antes = ($i > 0 && $pv['meses'][$i - 1]['mes'] === $anterior) ? $pv['meses'][$i - 1] : null;
        }
    }
    if ($atual === null) {
        return null;
    }
    $segAntes = $antes === null ? 0 : seguidores_de($pv, $antes);
    $crescPct = $segAntes > 0 ? (seguidores_de($pv, $atual) - $segAntes) / $segAntes * 100 : 0.0;

    $pontos = [
        'crescimento' => (int) round(max(0.0, min(40.0, 4 * $crescPct))),
        'engajamento' => (int) round(min(20.0, 4 * $atual['engajamento'])),
        'acoes'       => min(30, 20 * $atual['acoes'] + 10 * $atual['modulos'] + 5 * $atual['lives']),
        'constancia'  => $atual['todasSemanas'] ? 10 : 0,
    ];
    return $pontos + [
        'total' => array_sum($pontos),
        'crescimentoPct' => round($crescPct, 1),
    ];
}

/**
 * O placar do mês por nível — "dentro de cada nível, quem está entre os
 * melhores". Os três primeiros de cada nível ganham collab com o perfil oficial
 * e convite para a live estadual.
 */
function placar_da_liga(array $liga, string $mes): array
{
    $porNivel = array_fill_keys(array_keys(NIVEIS_LIGA), []);
    foreach ($liga as $pv) {
        if ($pv['encerradoEm'] !== '') {
            continue;
        }
        $placar = placar_do_mes($pv, $mes);
        if ($placar === null) {
            continue;
        }
        $porNivel[nivel_liga($pv)['nivel']][] = ['pv' => $pv, 'placar' => $placar];
    }
    foreach ($porNivel as &$linhas) {
        usort($linhas, fn ($a, $b) => [$b['placar']['total'], seguidores_de($b['pv'])] <=> [$a['placar']['total'], seguidores_de($a['pv'])]);
    }
    unset($linhas);
    /* A ordem da Liga, de cima para baixo. */
    return array_reverse($porNivel, true);
}

/**
 * Seguidor comprado: o plano manda auditar pelo placar. O sinal é um salto de
 * seguidores com engajamento abaixo do piso do nível. Não elimina sozinho —
 * aponta, e a coordenação confere.
 */
function suspeita_de_compra(array $pv): bool
{
    $m = ultimo_mes($pv);
    if ($m === null || count($pv['meses']) < 2) {
        return false;
    }
    $antes = $pv['meses'][count($pv['meses']) - 2];
    $segAntes = seguidores_de($pv, $antes);
    if ($segAntes <= 0) {
        return false;
    }
    $salto = (seguidores_de($pv, $m) - $segAntes) / $segAntes;
    $piso = NIVEIS_LIGA[nivel_liga($pv)['nivel']]['engajamento'];
    return $salto >= 0.5 && $m['engajamento'] < max(1.0, $piso);
}

/** "Dois trimestres seguidos sem crescimento líquido" — o sinal de revisão. */
function liga_parada(array $pv): bool
{
    $meses = $pv['meses'];
    if (count($meses) < 6) {
        return false;
    }
    $seis = array_slice($meses, -6);
    return seguidores_de($pv, $seis[5]) <= seguidores_de($pv, $seis[0]);
}

/* =====================================================================
   BIBLIOTECA
   ===================================================================== */

function normalizar_material($m): ?array
{
    if (!is_array($m) || empty($m['id'])) {
        return null;
    }
    $titulo = limpar_texto($m['titulo'] ?? '', 120);
    $link = trim((string) ($m['link'] ?? ''));
    if ($titulo === '' || !str_starts_with(mb_strtolower($link), 'https://')) {
        return null;
    }
    $tipo = (string) ($m['tipo'] ?? 'caderno');
    $tema = (string) ($m['tema'] ?? '');
    return [
        'id'        => limpar_texto($m['id'], 40),
        'titulo'    => $titulo,
        'tipo'      => isset(TIPOS_MATERIAL[$tipo]) ? $tipo : 'caderno',
        'tema'      => isset(TEMAS_GRUPO[$tema]) ? $tema : '',
        'resumo'    => limpar_texto($m['resumo'] ?? '', 240),
        'link'      => limpar_texto($link, 300),
        'publicado' => !empty($m['publicado']),
        'arquivadoEm' => limpar_texto($m['arquivadoEm'] ?? '', 40),
        'criadoEm'  => limpar_texto($m['criadoEm'] ?? '', 40),
        'criadoPor' => limpar_texto($m['criadoPor'] ?? '', 60),
        'alteradoEm'  => limpar_texto($m['alteradoEm'] ?? '', 40),
        'alteradoPor' => limpar_texto($m['alteradoPor'] ?? '', 60),
    ];
}

/** Os materiais, o Livro Amarelo primeiro e o mais novo em cima. */
function ler_biblioteca(): array
{
    $bruto = is_file(ARQ_BIBLIOTECA) ? @include ARQ_BIBLIOTECA : null;
    $limpos = [];
    foreach (is_array($bruto) ? $bruto : [] as $m) {
        if ($ok = normalizar_material($m)) {
            $limpos[] = $ok;
        }
    }
    $ordem = array_flip(array_keys(TIPOS_MATERIAL));
    usort($limpos, fn ($a, $b) => [$a['arquivadoEm'] !== '', $ordem[$a['tipo']], $b['criadoEm']] <=> [$b['arquivadoEm'] !== '', $ordem[$b['tipo']], $a['criadoEm']]);
    return $limpos;
}

function gravar_biblioteca(array $materiais): bool
{
    return gravar_lista_organizacao(ARQ_BIBLIOTECA, $materiais, 'normalizar_material', ler_biblioteca(),
        'A Biblioteca — materiais com link.');
}

/* =====================================================================
   GRAVAÇÃO
   ===================================================================== */

/** As três listas gravam igual: normaliza, carimba o rastro, grava atômico. */
function gravar_lista_organizacao(string $arquivo, array $itens, callable $normalizar, array $antes, string $cabecalho): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($itens as $i) {
        if ($ok = $normalizar($i)) {
            $limpos[] = $ok;
        }
    }
    $limpos = carimbar_alteracoes($antes, $limpos);
    $conteudo = "<?php\n// Gerado pelo painel. {$cabecalho}\nreturn " . var_export($limpos, true) . ";\n";
    if (!gravar_atomico($arquivo, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate($arquivo, true);
    }
    return true;
}

function novo_id_organizacao(string $prefixo): string
{
    return $prefixo . '-' . bin2hex(random_bytes(6));
}

/* =====================================================================
   O QUE A ÁREA DIZ AO INÍCIO
   ===================================================================== */

/**
 * As pendências da organização: unidade aberta sem responsável, unidade parada
 * (sem entrega no ciclo) e porta-voz sem o fechamento do mês passado.
 *
 * Não é urgente: o plano diz que os números "servem para descobrir gargalos,
 * nunca para punir voluntários". Vira urgente só o que trava a definição de
 * ativo de uma vez — unidade sem dono.
 */
function pendencias_organizacao(array $u): array
{
    $tarefas = [];
    $unidades = array_map(fn ($x) => $x + ['_tipo' => tipo_da_unidade($x)], so_abertas(todas_as_unidades()));

    $semDono = array_values(array_filter($unidades, fn ($x) => $x['responsavelId'] === ''));
    if ($semDono !== []) {
        $tarefas[] = [
            'area'    => 'organizacao',
            'icone'   => 'users',
            'urgente' => true,
            'quantos' => count($semDono),
            'texto'   => count($semDono) === 1
                ? nome_da_unidade($semDono[0]) . ' está sem responsável'
                : count($semDono) . ' núcleos ou grupos sem responsável',
            'porque'  => 'o que não pode é haver função sem dono',
            'url'     => '/painel/organizacao.php',
        ];
    }

    $paradas = array_values(array_filter($unidades, fn ($x) => $x['responsavelId'] !== '' && !unidade_ativa($x)));
    if ($paradas !== []) {
        $tarefas[] = [
            'area'    => 'organizacao',
            'icone'   => 'calendar',
            'urgente' => false,
            'quantos' => count($paradas),
            'texto'   => count($paradas) === 1
                ? nome_da_unidade($paradas[0]) . ' está parado'
                : count($paradas) . ' núcleos ou grupos parados',
            'porque'  => 'falta ' . implode(', ', o_que_falta($paradas[0])),
            'url'     => '/painel/organizacao.php' . (($aba = leitor_de_unidade($paradas[0]['id'])['aba']) !== '' ? '?aba=' . $aba : ''),
        ];
    }

    $tarefas = array_merge($tarefas, pendencias_de_ritmo(
        $unidades, 'organizacao',
        fn ($x) => '/painel/organizacao.php' . (($aba = leitor_de_unidade($x['id'])['aba']) !== '' ? '?aba=' . $aba : '') . '#u-' . $x['id']
    ));

    $mesPassado = (new DateTimeImmutable(hoje_ce()))->modify('first day of last month')->format('Y-m');
    $semFechar = array_values(array_filter(
        array_filter(ler_liga(), fn ($pv) => $pv['encerradoEm'] === ''),
        fn ($pv) => placar_do_mes($pv, $mesPassado) === null
    ));
    if ($semFechar !== []) {
        $tarefas[] = [
            'area'    => 'organizacao',
            'icone'   => 'star',
            'urgente' => false,
            'quantos' => count($semFechar),
            'texto'   => count($semFechar) === 1
                ? 'Fechar o mês de ' . $semFechar[0]['nome'] . ' na Liga'
                : 'Fechar o mês de ' . count($semFechar) . ' porta-vozes na Liga',
            'porque'  => 'sem o fechamento, o placar e o nível não andam',
            'url'     => '/painel/organizacao.php?aba=liga',
        ];
    }

    return $tarefas;
}

/** Dia do mês a partir do qual a falta de atividade no mês seguinte vira pendência. */
const DIA_DA_RESERVA = 25;

/** Dias depois da atividade para registrar o que foi feito ("Registro contínuo"). */
const DIAS_PARA_REGISTRAR = 7;

/**
 * O RITMO DO CALENDÁRIO, por unidade — as duas regras do plano:
 *
 *   - "As datas do mês seguinte são reservadas até o dia 25": do dia 25 em
 *     diante, unidade aberta sem encontro marcado no mês que vem é pendência;
 *   - "Cada unidade registra a entrega até 7 dias depois da atividade":
 *     encontro da unidade que passou há mais de 7 dias sem nenhum registro
 *     daquela data em diante é pendência.
 *
 * Serve a dois públicos: a coordenação (todas as unidades, em
 * `pendencias_organizacao()`) e o responsável (só as dele, no Meu lugar).
 * `$area` e `$url` dizem para onde o item leva.
 */
function pendencias_de_ritmo(array $unidades, string $area, callable $url, ?int $agora = null): array
{
    require_once __DIR__ . '/eventos-comum.php';
    $hoje = hoje_ce($agora);
    $proximoMes = (new DateTimeImmutable($hoje))->modify('first day of next month')->format('Y-m');
    $porUnidade = [];
    foreach (ler_eventos() as $e) {
        if ($e['unidadeId'] !== '' && $e['status'] !== 'cancelado') {
            $porUnidade[$e['unidadeId']][] = $e;
        }
    }

    $itens = [];
    foreach (so_abertas($unidades) as $u) {
        $nome = nome_da_unidade($u);
        $encontros = $porUnidade[$u['id']] ?? [];

        if ((int) substr($hoje, 8, 2) >= DIA_DA_RESERVA) {
            $temNoMes = array_filter($encontros, fn ($e) => substr(dia_do_inicio($e['inicio']), 0, 7) === $proximoMes);
            if ($temNoMes === []) {
                $itens[] = [
                    'area' => $area, 'icone' => 'calendar', 'urgente' => false,
                    'texto' => $nome . ' não tem atividade marcada no mês que vem',
                    'porque' => 'as datas do mês seguinte se reservam até o dia ' . DIA_DA_RESERVA,
                    'url' => $url($u),
                ];
            }
        }

        $passados = array_filter($encontros, fn ($e) => ($d = dia_do_inicio($e['inicio'])) !== '' && $d < $hoje);
        usort($passados, fn ($a, $b) => $b['inicio'] <=> $a['inicio']);
        $ultimo = $passados[0] ?? null;
        if ($ultimo !== null) {
            $dia = dia_do_inicio($ultimo['inicio']);
            $dias = (int) (new DateTimeImmutable($dia))->diff(new DateTimeImmutable($hoje))->days;
            $registrou = array_filter($u['entregas'], fn ($en) => $en['data'] >= $dia);
            if ($dias > DIAS_PARA_REGISTRAR && $registrou === []) {
                $itens[] = [
                    'area' => $area, 'icone' => 'flag', 'urgente' => false,
                    'texto' => 'Registrar o que ' . mb_strtolower(mb_substr($nome, 0, 1)) . mb_substr($nome, 1) . ' fez em “' . $ultimo['titulo'] . '”',
                    'porque' => 'foi há ' . $dias . ' dias — o registro é até ' . DIAS_PARA_REGISTRAR . ' dias depois',
                    'url' => $url($u),
                ];
            }
        }
    }
    return $itens;
}

/**
 * O interesse que veio do formulário público, conferido: um núcleo ou grupo
 * que existe, está aberto e aparece no site (`nuc-…`/`grp-…`/`cul-…`), ou um tema do
 * catálogo (`tema:<chave>`). Qualquer outra coisa vira '' — é texto de fora.
 */
function interesse_valido($bruto): string
{
    $v = trim((string) $bruto);
    if (preg_match('/^tema:([a-z]{3,20})$/', $v, $m) === 1) {
        return isset(TEMAS_GRUPO[$m[1]]) ? $v : '';
    }
    $u = unidade_por_id($v);
    return $u !== null && $u['publicado'] && $u['encerradoEm'] === '' ? $v : '';
}

/**
 * A unidade que um interesse aponta, se houver: o próprio núcleo/grupo, ou o
 * grupo ABERTO do tema escolhido. Tema sem grupo aberto não aponta para nada —
 * a pessoa é o convite para abrir um.
 */
function unidade_do_interesse(string $interesse): ?array
{
    if (str_starts_with($interesse, 'tema:')) {
        return grupo_aberto_do_tema(substr($interesse, 5), ler_grupos());
    }
    $u = unidade_por_id($interesse);
    return $u !== null && $u['encerradoEm'] === '' ? $u : null;
}

/** "o núcleo Benfica", "o tema Saúde e esporte" — o interesse em frase. '' sem interesse. */
function frase_do_interesse(string $interesse): string
{
    if ($interesse === '') {
        return '';
    }
    if (str_starts_with($interesse, 'tema:')) {
        $t = TEMAS_GRUPO[substr($interesse, 5)] ?? null;
        return $t ? 'o tema ' . $t['nome'] : '';
    }
    $u = unidade_do_interesse($interesse);
    return $u === null ? '' : mb_strtolower(mb_substr(nome_da_unidade($u), 0, 1)) . mb_substr(nome_da_unidade($u), 1);
}

/**
 * Cria o encontro da unidade — a próxima atividade dela. Entra na agenda
 * pública se a unidade aparece no site, e herda dela a cidade e o bairro.
 * Devolve o id, ou '' se não conseguiu gravar.
 */
function criar_encontro_da_unidade(array $u, string $dia, string $hora, string $titulo, string $local): string
{
    require_once __DIR__ . '/eventos-comum.php';
    $nome = rotulo_da_unidade($u);
    $inicio = inicio_de_dia_e_hora($dia, $hora);
    if ($inicio === '') {
        return '';
    }
    $eventos = ler_eventos();
    $novo = [
        'id'       => novo_id_evento(),
        'titulo'   => $titulo !== '' ? $titulo : 'Encontro · ' . $nome,
        'familia'  => 'militancia',
        'inicio'   => $inicio,
        'local'    => $local,
        'cidade'   => $u['cidade'] ?? '',
        'bairro'   => $u['bairro'] ?? '',
        'unidadeId' => $u['id'],
        'naAgenda' => $u['publicado'],
        'filtro'   => FILTRO_PADRAO,
        'token'    => bin2hex(random_bytes(10)),
        'tokenConfirmacao' => bin2hex(random_bytes(10)),
        'status'   => 'planejado',
        'criadoEm' => date('c'),
        'criadoPor' => quem_grava(),
    ];
    $eventos[] = $novo;
    if (!gravar_eventos($eventos)) {
        return '';
    }
    republicar_agenda();
    return $novo['id'];
}

/**
 * Acrescenta uma entrega à unidade e grava. Devolve a unidade atualizada, ou
 * null se não achou ou não gravou. Usada pela Organização e pela tela do
 * responsável (`minha-unidade.php`).
 */
function adicionar_entrega(string $tipo, string $id, string $data, string $texto, int $pessoas, string $porId): ?array
{
    $l = leitor_de_unidade($tipo);
    $lista = $l['ler']();
    $alvo = null;
    foreach ($lista as &$u) {
        if ($u['id'] === $id) {
            $u['entregas'][] = [
                'id' => novo_id_organizacao('ent'), 'data' => $data, 'texto' => $texto,
                'pessoas' => $pessoas, 'porId' => $porId, 'em' => date('c'),
            ];
            $alvo = $u;
        }
    }
    unset($u);
    if ($alvo === null) {
        return null;
    }
    return $l['gravar']($lista) ? $alvo : null;
}

/**
 * Quem faz parte da unidade, por nome: quem tem a unidade na ficha
 * (`unidades`) E quem responde por ela. Responsável e substituto fazem parte
 * por definição — sem isto, a pessoa que mais trabalha no núcleo não
 * apareceria na lista dele.
 */
function membros_da_unidade(string $id): array
{
    $u = unidade_por_id($id);
    $responde = $u === null ? [] : array_filter([$u['responsavelId'], $u['substitutoId']]);
    $gente = array_values(array_filter(ler_pessoas(), fn ($p) =>
        $p['status'] !== 'recusada' && (in_array($id, $p['unidades'], true) || in_array($p['id'], $responde, true))
    ));
    usort($gente, fn ($a, $b) => sem_acento($a['nome']) <=> sem_acento($b['nome']));
    return $gente;
}

/** Põe ou tira alguém da unidade. Passa pela trava: a ficha é gravada por várias telas. */
function pertencer(string $pessoaId, string $unidadeId, bool $dentro): bool
{
    return com_trava(ARQ_PESSOAS, function () use ($pessoaId, $unidadeId, $dentro): bool {
        $pessoas = ler_pessoas(true);
        $achou = false;
        foreach ($pessoas as &$p) {
            if ($p['id'] !== $pessoaId) {
                continue;
            }
            $achou = true;
            $p['unidades'] = $dentro
                ? array_values(array_unique([...$p['unidades'], $unidadeId]))
                : array_values(array_filter($p['unidades'], fn ($x) => $x !== $unidadeId));
        }
        unset($p);
        return $achou && gravar_pessoas($pessoas);
    });
}

/** "O núcleo Benfica" / "O grupo Segurança pública" / "O grupo cultural Cineclube" — para frase. */
function nome_da_unidade(array $x): string
{
    return match (tipo_da_unidade($x)) {
        'grupo'   => 'O grupo ' . TEMAS_GRUPO[$x['tema']]['nome'],
        'cultura' => 'O grupo cultural ' . $x['nome'],
        default   => 'O núcleo ' . $x['nome'],
    };
}

/**
 * ONDE ESTA PESSOA ATUA — a resposta única, para a ficha, o Início e as listas.
 *
 * Junta as três origens do vínculo: fazer parte (`unidades` na ficha),
 * responder por (responsável ou substituto de unidade aberta) e falar por
 * (porta-voz na Liga). Cada vínculo:
 *   tipo   nucleo · grupo · cultura · liga
 *   id     da unidade, ou do porta-voz
 *   rotulo "Núcleo Benfica", "Liga dos Porta-vozes"
 *   papel  faz parte · responsável · substituto · porta-voz nível C
 */
function vinculos_da_pessoa(string $pessoaId): array
{
    $pessoa = achar_pessoa($pessoaId);
    if ($pessoa === null) {
        return [];
    }
    $vinculos = [];
    foreach (so_abertas(todas_as_unidades()) as $u) {
        $papel = match (true) {
            $u['responsavelId'] === $pessoaId => 'responsável',
            $u['substitutoId'] === $pessoaId  => 'substituto',
            in_array($u['id'], $pessoa['unidades'], true) => 'faz parte',
            default => '',
        };
        if ($papel !== '') {
            $vinculos[] = ['tipo' => tipo_da_unidade($u), 'id' => $u['id'], 'rotulo' => rotulo_da_unidade($u), 'papel' => $papel];
        }
    }
    foreach (ler_liga() as $pv) {
        if ($pv['pessoaId'] === $pessoaId && $pv['encerradoEm'] === '') {
            $vinculos[] = ['tipo' => 'liga', 'id' => $pv['id'], 'rotulo' => 'Liga dos Porta-vozes',
                           'papel' => 'porta-voz nível ' . nivel_liga($pv)['nivel']];
        }
    }
    return $vinculos;
}

/**
 * Os catálogos, de uma vez — para o teste de contrato comparar com
 * `src/features/organizacao/catalogo.ts`. Função pura: só constantes.
 */
function catalogo_da_organizacao(): array
{
    return [
        'temas' => TEMAS_GRUPO,
        'liga' => NIVEIS_LIGA,
        'eixos' => EIXOS_CULTURAIS,
        'niveisCultura' => array_map(fn ($n) => $n['nome'], NIVEIS_CULTURA),
        'territorio' => array_map(fn ($n) => $n['nome'], NIVEIS_TERRITORIO),
        'ondas' => ONDAS,
    ];
}
