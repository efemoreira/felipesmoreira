<?php
declare(strict_types=1);

/**
 * O quadro de Produção — do fato checado ao post publicado.
 *
 * Substitui o Trello do manual. O ganho de trazer para cá não é ter mais um
 * quadro: é que o card nasce do fato aprovado, já com a fonte e o responsável
 * grudados nele. No Trello isso vira um link colado à mão que ninguém confere,
 * e é assim que número sem fonte chega ao vídeo.
 *
 * Guardado em dados/producao.php pela regra de sempre (nome de gestor, link de
 * apuração e quem fez o quê não saem pela web).
 */

require_once __DIR__ . '/sessao.php';

const ARQ_PRODUCAO = PASTA_DADOS . '/producao.php';

/** As etapas do manual: cada fato pode virar roteiro, arte e vídeo. */
const ETAPAS = [
    'roteiro' => 'Roteiro',
    'arte'    => 'Arte',
    'video'   => 'Vídeo',
];

/** As colunas do quadro, na ordem em que o trabalho anda. */
const COLUNAS = [
    'a-fazer'   => 'A fazer',
    'fazendo'   => 'Fazendo',
    'revisao'   => 'Revisão',
    'publicado' => 'Publicado',
];

/**
 * O que cai em cada coluna vazia, e quem põe.
 *
 * Coluna vazia dizendo só "Vazio." desperdiça o melhor momento de ensinar o
 * fluxo: quem chega no quadro pela primeira vez aprende a linha de produção
 * lendo as quatro colunas, sem abrir o manual.
 */
const COLUNA_VAZIA = [
    'a-fazer'   => 'Nada aqui. O card nasce sozinho quando a Checagem aprova um fato — ninguém cria à mão.',
    'fazendo'   => 'Nada em andamento. Puxe um card de "A fazer" e assuma: card sem dono é card que dorme.',
    'revisao'   => 'Nada esperando revisão. Aqui chega o que o Roteirista, o Design ou o Editor terminou.',
    'publicado' => 'Nada publicado ainda. Publicar exige o link do post — é ele que o Acervo indexa depois.',
];

/** A trava do manual: o mesmo responsável não é alvo principal 2 dias seguidos. */
const LEDGER_HORAS = 48;

/* ===================== leitura e gravação ===================== */

function normalizar_card($c): ?array
{
    if (!is_array($c) || empty($c['id']) || empty($c['titulo'])) {
        return null;
    }
    $etapa = (string) ($c['etapa'] ?? 'roteiro');
    if (!isset(ETAPAS[$etapa])) {
        $etapa = 'roteiro';
    }
    $coluna = (string) ($c['coluna'] ?? 'a-fazer');
    if (!isset(COLUNAS[$coluna])) {
        $coluna = 'a-fazer';
    }

    $historico = [];
    foreach ((array) ($c['historico'] ?? []) as $h) {
        if (is_array($h) && !empty($h['texto'])) {
            $historico[] = [
                'quando' => limpar_texto($h['quando'] ?? '', 40),
                'quem'   => limpar_texto($h['quem'] ?? '', 60),
                'texto'  => limpar_texto($h['texto'], 160),
            ];
        }
    }

    return [
        'id'      => limpar_texto($c['id'], 40),
        'fatoId'  => limpar_texto($c['fatoId'] ?? '', 40),
        'titulo'  => limpar_texto($c['titulo'], 200),
        'etapa'   => $etapa,
        'coluna'  => $coluna,
        'donoId'   => limpar_texto($c['donoId'] ?? '', 40),
        'donoNome' => limpar_texto($c['donoNome'] ?? '', 60),
        'prazo'    => limpar_texto($c['prazo'] ?? '', 20),
        'linkPost' => limpar_texto($c['linkPost'] ?? '', 500),
        // o "quem" do fato: é sobre ele que a regra do ledger conta os dias
        'responsavel' => limpar_texto($c['responsavel'] ?? '', 160),
        'fonteUrl'    => limpar_texto($c['fonteUrl'] ?? '', 500),
        'criadoEm'    => limpar_texto($c['criadoEm'] ?? '', 40),
        'publicadoEm' => limpar_texto($c['publicadoEm'] ?? '', 40),
        'historico'   => $historico,
    ];
}

function ler_cards(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_PRODUCAO)) {
        $bruto = @include ARQ_PRODUCAO;
        if (is_array($bruto)) {
            foreach ($bruto as $c) {
                if ($limpo = normalizar_card($c)) {
                    $cache[] = $limpo;
                }
            }
        }
    }
    return $cache;
}

function gravar_cards(array $cards): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($cards as $c) {
        if ($limpo = normalizar_card($c)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_PRODUCAO, $conteudo)) {
        return false;
    }
    ler_cards(true);
    return true;
}

function achar_card(string $id): ?array
{
    foreach (ler_cards() as $c) {
        if ($c['id'] === $id) {
            return $c;
        }
    }
    return null;
}

function novo_id_card(): string
{
    return bin2hex(random_bytes(8));
}

/* ===================== o card nasce do fato ===================== */

/**
 * Fato aprovado vira card em "A fazer", na etapa que a Checagem escolheu.
 *
 * A etapa é parâmetro, e não mais fixa em roteiro: um fato pode render só uma
 * arte, ou só um vídeo, ou os três, ou nada. Antes toda aprovação abria um card
 * de roteiro, então o quadro enchia de card que ninguém tinha pedido — e não
 * havia como registrar "este aqui não vira peça".
 */
function card_do_fato(array $fato, array $quem, string $etapa = 'roteiro'): array
{
    if (!isset(ETAPAS[$etapa])) {
        $etapa = 'roteiro';
    }
    return [
        'id'          => novo_id_card(),
        'fatoId'      => $fato['id'],
        'titulo'      => $fato['oQue'],
        'etapa'       => $etapa,
        'coluna'      => 'a-fazer',
        'donoId'      => '',
        'donoNome'    => '',
        'prazo'       => date('Y-m-d'),  // o manual pede roteiro no mesmo dia
        'linkPost'    => '',
        'responsavel' => $fato['quem'],
        'fonteUrl'    => $fato['fonteUrl'],
        'criadoEm'    => date('c'),
        'publicadoEm' => '',
        'historico'   => [[
            'quando' => date('c'),
            'quem'   => $quem['nome'],
            'texto'  => 'Fato aprovado na Checagem — card de ' . ETAPAS[$etapa] . ' aberto.',
        ]],
    ];
}

/**
 * O que um fato virou — os cards nascidos dele, na ordem das etapas.
 *
 * Varre os cards em vez de guardar a lista no fato porque o elo já existe do
 * lado certo (`fatoId` no card) desde que a ligação foi criada. Guardar dos
 * dois lados seria a primeira coisa a divergir quando alguém apagasse um card.
 */
function saidas_do_fato(string $fatoId): array
{
    if ($fatoId === '') {
        return [];
    }
    $achados = array_values(array_filter(ler_cards(), fn ($c) => $c['fatoId'] === $fatoId));

    $ordem = array_flip(array_keys(ETAPAS));
    usort($achados, fn ($a, $b) => ($ordem[$a['etapa']] ?? 9) <=> ($ordem[$b['etapa']] ?? 9));
    return $achados;
}

/* ===================== consultas ===================== */

/** Os cards de uma coluna, mais antigo primeiro (o que espera há mais tempo). */
function cards_da_coluna(string $coluna): array
{
    $lista = array_values(array_filter(ler_cards(), fn ($c) => $c['coluna'] === $coluna));
    usort($lista, fn ($a, $b) => strcmp($a['criadoEm'], $b['criadoEm']));
    return $lista;
}

/** O que está com esta pessoa e ainda não saiu — vira o contador do hub. */
function cards_de(string $usuarioId): array
{
    return array_values(array_filter(
        ler_cards(),
        fn ($c) => $c['donoId'] === $usuarioId && $c['coluna'] !== 'publicado'
    ));
}

/**
 * A regra do ledger, do manual: não usar o mesmo responsável como alvo
 * principal dois dias seguidos.
 *
 * Devolve o card já publicado que dispara o alerta, ou null. É aviso, não
 * bloqueio: às vezes o desdobramento do mesmo caso é a pauta certa, e quem
 * decide isso é a coordenação, não o código.
 */
function alvo_repetido(string $responsavel, string $ignorarCardId = ''): ?array
{
    $responsavel = mb_strtolower(trim($responsavel));
    if ($responsavel === '') {
        return null;
    }
    $limite = time() - LEDGER_HORAS * 3600;

    foreach (ler_cards() as $c) {
        if ($c['id'] === $ignorarCardId || $c['coluna'] !== 'publicado') {
            continue;
        }
        if (mb_strtolower(trim($c['responsavel'])) !== $responsavel) {
            continue;
        }
        $t = strtotime($c['publicadoEm']);
        if ($t !== false && $t >= $limite) {
            return $c;
        }
    }
    return null;
}

/* ===================== nome de arquivo do Acervo ===================== */

/* sem_acento() mora no sessao.php: as inscrições também precisam dela para o
   slug de origem, e não têm por que incluir este arquivo inteiro. */

function apelido(string $texto, int $palavras = 4): string
{
    $ascii = strtolower(preg_replace('/[^a-zA-Z0-9 ]/', ' ', sem_acento($texto)) ?? '');

    $partes = array_values(array_filter(
        explode(' ', $ascii),
        // fora as palavras que não ajudam a achar o arquivo depois
        fn ($p) => $p !== '' && !in_array($p, ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'no', 'na', 'para'], true)
    ));

    return implode('-', array_slice($partes, 0, $palavras)) ?: 'sem-assunto';
}

/**
 * O nome padrão do manual: AAAA-MM-DD_tipo_assunto.
 *
 * Gerado pelo card em vez de digitado à mão — o padrão só sobrevive quando
 * ninguém precisa lembrar dele.
 */
function nome_de_arquivo(array $card): string
{
    $data = substr($card['criadoEm'], 0, 10);
    if ($data === '' || strtotime($data) === false) {
        $data = date('Y-m-d');
    }
    $tipo = ['roteiro' => 'roteiro', 'arte' => 'card', 'video' => 'video'][$card['etapa']] ?? 'arquivo';

    return $data . '_' . $tipo . '_' . apelido($card['titulo']);
}

/* ===================== o que esta área diz ao Início ===================== */

/**
 * O que está esperando por esta pessoa em `producao` — a fila do Início e o selo do menu.
 *
 * Chamada por `tarefas_de()` (agora.php) para quem abre a área; o formato de
 * cada item está documentado lá. Registrar aqui, e não numa cadeia de `if` no
 * agora.php, é o que faz uma área nova entrar na fila sem tocar o hub.
 */
function pendencias_producao(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $tarefas = [];

        /* ---------- Produção: o que está com esta pessoa ---------- */
        require_once __DIR__ . '/producao-comum.php';

        $meus = cards_de($u['id']);
        if ($meus !== []) {
            $hoje = date('Y-m-d');
            $atrasados = array_values(array_filter(
                $meus,
                fn ($c) => $c['prazo'] !== '' && $c['prazo'] < $hoje
            ));

            if ($atrasados !== []) {
                $c = $atrasados[0];
                $quantos = count($atrasados);
                $tarefas[] = [
                    'area'    => 'producao',
                    'icone'   => 'bolt',
                    'urgente' => true,
                    'quantos' => $quantos,
                    'texto'   => $quantos === 1
                        ? 'Terminar “' . apelido_curto($c['titulo']) . '”'
                        : "Destravar {$quantos} cards seus com prazo vencido",
                    'porque'  => 'o prazo passou — roteiro sai no mesmo dia, vídeo em até 24h',
                    'url'     => '/painel/producao.php#' . $c['id'],
                ];
            }

            $emDia = count($meus) - count($atrasados);
            if ($emDia > 0) {
                $tarefas[] = [
                    'area'    => 'producao',
                    'icone'   => 'bolt',
                    'urgente' => false,
                    'quantos' => $emDia,
                    'texto'   => $emDia === 1
                        ? '1 card está com você no quadro'
                        : "{$emDia} cards estão com você no quadro",
                    'porque'  => '',
                    'url'     => '/painel/producao.php',
                ];
            }
        }

    return $tarefas;
}

/**
 * Os medidores de `producao` — o retrato do time inteiro, para Leituras › Semana
 * e para a linha "A operação hoje" do Início. Formato em `panorama_de()`.
 */
function medidores_producao(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $medidores = [];

        /* ---------- Produção: o que está atrasado no quadro ---------- */
        require_once __DIR__ . '/producao-comum.php';

        $hoje = date('Y-m-d');
        $abertos = 0;
        $atrasados = 0;
        $semDono = count(cards_da_coluna('a-fazer'));
        foreach (ler_cards() as $c) {
            if ($c['coluna'] === 'publicado') {
                continue;
            }
            $abertos++;
            if ($c['prazo'] !== '' && $c['prazo'] < $hoje) {
                $atrasados++;
            }
        }
        $medidores[] = [
            'num'    => $atrasados . '/' . $abertos,
            'rotulo' => 'Quadro atrasado',
            'nota'   => $abertos === 0
                ? 'Quadro vazio. O card nasce quando a Checagem aprova um fato.'
                : ($atrasados > 0
                    ? 'Cards com prazo vencido, do total em andamento.'
                    : ($semDono > 0
                        ? "Nenhum atraso. {$semDono} ainda sem dono."
                        : 'Nenhum atraso e nenhum card sem dono.')),
            /* Um card atrasado já é urgente: o prazo do manual é o mesmo dia
               para roteiro e 24h para vídeo — não há degrau a percorrer. */
            'estado' => $atrasados > 0 ? 'urgente' : ($semDono > 0 ? 'atencao' : 'ok'),
            'url'    => '/painel/producao.php?dono=atrasados',
        ];

    return $medidores;
}

/** Uma linha sobre como está o trabalho em `producao`, para a mesa do Início. */
function estado_producao(array $u): string
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
        require_once __DIR__ . '/producao-comum.php';
        $meus = count(cards_de($u['id']));
        $fila = count(cards_da_coluna('a-fazer'));
        if ($meus === 0 && $fila === 0) {
            return 'Quadro vazio. O card nasce sozinho quando a Checagem aprova um fato.';
        }
        $partes = [];
        if ($meus > 0) {
            $partes[] = $meus === 1 ? '1 card com você' : "{$meus} cards com você";
        }
        if ($fila > 0) {
            $partes[] = $fila === 1 ? '1 card sem dono' : "{$fila} cards sem dono";
        }
        return implode(' · ', $partes);
}
