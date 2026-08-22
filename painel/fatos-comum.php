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
