<?php
declare(strict_types=1);

/**
 * Os fatos do dia — a Ficha de Fato do Olheiro e a fila da Checagem.
 *
 * Substitui o canal #fatos do WhatsApp e o pendentes.md do manual. A diferença
 * que justifica a ferramenta: no grupo de mensagens não dá para saber o que
 * ainda não foi checado, e fato sem resposta afunda na conversa. Aqui a fila é
 * a verdade, e nada sai dela sem status.
 *
 * Fica em dados/fatos.php (e não .json) pela regra de sempre: o .htaccess de
 * /dados só bloqueia .php, e aqui há nome de gestor e link de apuração.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_FATOS = PASTA_DADOS . '/fatos.php';

/** A trava de data do manual: só entra fato recente. */
const JANELA_HORAS = 48;

const CATEGORIAS = [
    'seguranca' => 'Segurança',
    'saude'     => 'Saúde',
    'educacao'  => 'Educação',
    'obras'     => 'Obras',
    'gasto'     => 'Gasto público',
    'outro'     => 'Outro',
];

const STATUS_FATO = [
    'a-checar'   => 'A checar',
    'ok-checado' => 'Checado',
    'pendente'   => 'Pendente',
    /* Checado e encerrado sem virar peça nenhuma. Sem este estado, um fato
       aprovado que ninguém aproveitou fica idêntico a um fato esquecido — e a
       pergunta "o que foi feito com o fato" não tem resposta. */
    'arquivado'  => 'Arquivado',
];


/* ===================== leitura e gravação ===================== */

function normalizar_fato($f): ?array
{
    if (!is_array($f) || empty($f['id']) || empty($f['oQue'])) {
        return null;
    }
    $status = (string) ($f['status'] ?? 'a-checar');
    if (!isset(STATUS_FATO[$status])) {
        $status = 'a-checar';
    }
    $categoria = (string) ($f['categoria'] ?? 'outro');
    if (!isset(CATEGORIAS[$categoria])) {
        $categoria = 'outro';
    }

    return [
        'id'        => limpar_texto($f['id'], 40),
        'oQue'      => limpar_texto($f['oQue'], 300),
        'quem'      => limpar_texto($f['quem'] ?? '', 160),
        'quando'    => limpar_texto($f['quando'] ?? '', 20),
        'quanto'    => limpar_texto($f['quanto'] ?? '', 120),
        'afetados'  => limpar_texto($f['afetados'] ?? '', 200),
        'fonteUrl'  => limpar_texto($f['fonteUrl'] ?? '', 500),
        'fonteData' => limpar_texto($f['fonteData'] ?? '', 20),
        'segundaFonte' => limpar_texto($f['segundaFonte'] ?? '', 500),
        'categoria' => $categoria,
        // marcado quando o fato é antigo mas é desdobramento novo (o manual abre
        // essa exceção à janela de 48h, e ela precisa ser explícita, não tácita)
        'desdobramento' => !empty($f['desdobramento']),
        'status'    => $status,
        'motivo'    => limpar_texto($f['motivo'] ?? '', 300),
        'autorId'   => limpar_texto($f['autorId'] ?? '', 40),
        'autorNome' => limpar_texto($f['autorNome'] ?? '', 60),
        'checadoPor' => limpar_texto($f['checadoPor'] ?? '', 60),
        'checadoEm'  => limpar_texto($f['checadoEm'] ?? '', 40),
        'criadoEm'   => limpar_texto($f['criadoEm'] ?? '', 40),
        // preenchido quando a aprovação abre o card no quadro de Produção
        'cardId'     => limpar_texto($f['cardId'] ?? '', 40),
        /* Quem traz o fato não checa o fato. Quando um admin destrava assim
           mesmo, o porquê fica escrito e aparece na ficha: decisão destravada
           que ninguém lê é decisão sem revisão. */
        'destravaMotivo' => limpar_texto($f['destravaMotivo'] ?? '', 300),
    ];
}

function ler_fatos(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_FATOS)) {
        $bruto = @include ARQ_FATOS;
        if (is_array($bruto)) {
            foreach ($bruto as $f) {
                if ($limpo = normalizar_fato($f)) {
                    $cache[] = $limpo;
                }
            }
        }
    }
    return $cache;
}

function gravar_fatos(array $fatos): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($fatos as $f) {
        if ($limpo = normalizar_fato($f)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_FATOS, $conteudo)) {
        return false;
    }
    ler_fatos(true);
    return true;
}

function achar_fato(string $id): ?array
{
    foreach (ler_fatos() as $f) {
        if ($f['id'] === $id) {
            return $f;
        }
    }
    return null;
}

function novo_id_fato(): string
{
    return bin2hex(random_bytes(8));
}

/* ===================== as travas do manual ===================== */

/**
 * A fonte precisa ser um endereço de verdade. Print não é fonte, e um texto
 * qualquer no campo também não — sem link a Checagem não tem o que abrir.
 */
function fonte_valida(string $url): bool
{
    if (filter_var($url, FILTER_VALIDATE_URL) === false) {
        return false;
    }
    $esquema = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    return in_array($esquema, ['http', 'https'], true);
}

/** O fato está dentro da janela de 48h? Data vazia conta como fora. */
function dentro_da_janela(string $fonteData): bool
{
    if ($fonteData === '') {
        return false;
    }
    $t = strtotime($fonteData);
    if ($t === false) {
        return false;
    }
    // data no futuro também é problema: quase sempre é erro de digitação
    return $t <= time() + 86400 && (time() - $t) <= JANELA_HORAS * 3600;
}

/** Há quantas horas o fato está esperando decisão. */
function horas_esperando(array $fato): int
{
    $t = strtotime($fato['criadoEm']);
    return $t === false ? 0 : (int) floor((time() - $t) / 3600);
}

/* ===================== consultas ===================== */

/** Os fatos de um status, do mais antigo para o mais novo. */
function fatos_com_status(string $status): array
{
    $lista = array_values(array_filter(ler_fatos(), fn ($f) => $f['status'] === $status));

    /* Mais antigo primeiro, de propósito: a meta do manual é "nada dorme sem
       status". Ordenar pelo mais novo esconderia justamente o que está atrasado. */
    usort($lista, fn ($a, $b) => strcmp($a['criadoEm'], $b['criadoEm']));
    return $lista;
}

/** Quantos fatos esperam a Checagem — vira o contador no hub. */
function fatos_esperando(): int
{
    return count(fatos_com_status('a-checar'));
}

/* ===================== o que esta área diz ao Início ===================== */

/**
 * O que está esperando por esta pessoa em `fatos` — a fila do Início e o selo do menu.
 *
 * Chamada por `tarefas_de()` (agora.php) para quem abre a área; o formato de
 * cada item está documentado lá. Registrar aqui, e não numa cadeia de `if` no
 * agora.php, é o que faz uma área nova entrar na fila sem tocar o hub.
 */
function pendencias_fatos(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $tarefas = [];

        /* ---------- Fatos: a fila da Checagem ---------- */
        require_once __DIR__ . '/fatos-comum.php';
        require_once __DIR__ . '/producao-comum.php';

        /* O fato que a própria pessoa trouxe não é pendência dela: ela não pode
           checá-lo. Contá-lo aqui mandaria alguém para uma tela onde a única
           coisa a fazer é esperar — e o selo no menu ficaria aceso para sempre
           quando a fila fosse só de fato próprio. Para o resto do time ele
           continua contando normalmente. */
        $fila = array_values(array_filter(
            fatos_com_status('a-checar'),
            fn ($f) => $f['autorId'] !== $u['id']
        ));
        if ($fila !== []) {
            // o mais antigo manda no recado: é ele que estoura o prazo
            $horas = 0;
            foreach ($fila as $f) {
                $horas = max($horas, horas_esperando($f));
            }
            $quantos = count($fila);
            $tarefas[] = [
                'area'    => 'fatos',
                'icone'   => 'search',
                'urgente' => $horas >= 2,
                'quantos' => $quantos,
                'texto'   => $quantos === 1 ? 'Checar 1 fato' : "Checar {$quantos} fatos",
                'porque'  => $horas >= 2
                    ? "o mais antigo está parado há {$horas}h — o prazo da checagem é 2h"
                    : 'nada dorme sem status: a meta é zerar a fila do dia',
                'url'     => '/painel/fatos.php#fila',
            ];
        }

        /* ---------- Fatos: aprovado e parado, sem virar peça nenhuma ----------
           A pergunta "o que foi feito com o fato" só tem resposta se ficar sem
           resposta doer. Aprovar sem marcar saída é legítimo — decidir depois é
           normal —, mas passar de 48h assim é o fato morrendo em silêncio, que é
           exatamente o que o status 'arquivado' existe para evitar. */
        $parados = array_values(array_filter(
            fatos_com_status('ok-checado'),
            fn ($f) => saidas_do_fato($f['id']) === [] && horas_esperando($f) >= HORAS_SEM_SAIDA
        ));
        if ($parados !== []) {
            $quantos = count($parados);
            $tarefas[] = [
                'area'    => 'fatos',
                'icone'   => 'search',
                'urgente' => false,
                'quantos' => $quantos,
                'texto'   => $quantos === 1
                    ? 'Decidir o que fazer com 1 fato aprovado'
                    : "Decidir o que fazer com {$quantos} fatos aprovados",
                'porque'  => 'passaram da checagem e não viraram peça nenhuma — abra uma saída ou arquive com o motivo',
                'url'     => '/painel/fatos.php?aba=decididos#checados',
            ];
        }

    return $tarefas;
}

/**
 * Os medidores de `fatos` — o retrato do time inteiro, para Leituras › Semana
 * e para a linha "A operação hoje" do Início. Formato em `panorama_de()`.
 */
function medidores_fatos(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $medidores = [];

        /* ---------- Checagem: a fila e a idade dela ---------- */
        require_once __DIR__ . '/fatos-comum.php';
        require_once __DIR__ . '/producao-comum.php';

        $fila = fatos_com_status('a-checar');
        $horas = 0;
        foreach ($fila as $f) {
            $horas = max($horas, horas_esperando($f));
        }
        $medidores[] = [
            'num'    => (string) count($fila),
            'rotulo' => 'Na checagem',
            'nota'   => $fila === []
                ? 'Fila zerada — nada dorme sem status.'
                : ($horas >= 2
                    ? "O mais antigo está parado há {$horas}h; o prazo é 2h."
                    : 'Dentro do prazo de 2h.'),
            /* Fila vazia é ok mesmo quando o relógio não correu ainda: o que
               pinta o medidor é a idade do mais antigo, e sem fila não há
               idade nenhuma. */
            'estado' => $fila === [] ? 'ok' : degrau_de_prazo($horas, 2),
            'url'    => '/painel/fatos.php#fila',
        ];

        /* Aprovado e sem virar peça: o vão entre "decidido" e "feito". */
        $parados = array_filter(
            fatos_com_status('ok-checado'),
            fn ($f) => saidas_do_fato($f['id']) === []
        );
        $velho = 0;
        foreach ($parados as $f) {
            $velho = max($velho, horas_esperando($f));
        }
        $medidores[] = [
            'num'    => (string) count($parados),
            'rotulo' => 'Sem saída',
            'nota'   => $parados === []
                ? 'Todo fato aprovado virou peça ou foi arquivado.'
                : 'Passaram da checagem e não viraram peça — abra uma saída ou arquive.',
            'estado' => $parados === [] ? 'ok' : degrau_de_prazo($velho, HORAS_SEM_SAIDA),
            'url'    => '/painel/fatos.php?aba=decididos#checados',
        ];

    return $medidores;
}

/** Uma linha sobre como está o trabalho em `fatos`, para a mesa do Início. */
function estado_fatos(array $u): string
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
        require_once __DIR__ . '/fatos-comum.php';
        $fila = fatos_esperando();
        $meus = count(array_filter(
            fatos_com_status('ok-checado'),
            fn ($f) => $f['autorId'] === $u['id']
        ));
        if ($fila === 0 && $meus === 0) {
            return 'Nenhum fato na fila. Duas varreduras por dia: de manhã e no fim da tarde.';
        }
        $partes = [];
        if ($fila > 0) {
            $partes[] = $fila === 1 ? '1 fato esperando checagem' : "{$fila} fatos esperando checagem";
        }
        if ($meus > 0) {
            $partes[] = $meus === 1 ? '1 fato seu já aprovado' : "{$meus} fatos seus já aprovados";
        }
        return implode(' · ', $partes);
}
