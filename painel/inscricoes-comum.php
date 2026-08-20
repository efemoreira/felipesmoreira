<?php
declare(strict_types=1);

/**
 * Dados das inscrições da militância — compartilhado entre o formulário público
 * (api/inscricao.php) e a tela de aprovação (inscricoes.php).
 *
 * Só define funções, não faz nada sozinho: quem inclui é que decide se exige
 * login. O endpoint público inclui sem exigir; a tela de aprovação exige a área.
 *
 * As inscrições ficam em dados/inscricoes.php — arquivo PHP, e não JSON, porque
 * o .htaccess de /dados só bloqueia .php. Um .json ali é baixável pela web, e
 * aqui tem telefone e e-mail de gente de verdade.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_INSCRICOES = PASTA_DADOS . '/inscricoes.php';
const ARQ_LIMITE     = PASTA_DADOS . '/inscricoes-limite.php';
const ARQ_SEGREDO    = PASTA_DADOS . '/segredo.php';
const ARQ_FUNCOES    = __DIR__ . '/../funcoes.json';

/** Versão do texto de consentimento aceito no formulário. */
const VERSAO_CONSENTIMENTO = '1';

/** Teto por IP: segura enxurrada sem atrapalhar a família que se inscreve junta. */
const LIMITE_POR_HORA = 5;
const LIMITE_POR_DIA  = 20;

/* ===================== catálogo de funções ===================== */

/**
 * Lê o funcoes.json que o build copia para a raiz (ver publish.yml).
 * É a mesma fonte que o formulário usa — sem lista repetida em duas linguagens.
 */
function catalogo_funcoes(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    $memo = ['funcoes' => [], 'porId' => []];
    if (is_file(ARQ_FUNCOES)) {
        $bruto = json_decode((string) @file_get_contents(ARQ_FUNCOES), true);
        if (is_array($bruto) && is_array($bruto['funcoes'] ?? null)) {
            $memo['funcoes'] = $bruto['funcoes'];
            foreach ($bruto['funcoes'] as $f) {
                if (!empty($f['id'])) {
                    $memo['porId'][(string) $f['id']] = $f;
                }
            }
        }
    }
    return $memo;
}

/** Nome de exibição da função; devolve o próprio id se o catálogo não tiver. */
function nome_funcao(string $id): string
{
    return (string) (catalogo_funcoes()['porId'][$id]['nome'] ?? $id);
}

/** Descarta id que não existe no catálogo — nada de função inventada no POST. */
function funcoes_validas(array $pedidas): array
{
    $porId = catalogo_funcoes()['porId'];
    $limpo = [];
    foreach ($pedidas as $id) {
        $id = limpar_texto($id, 40);
        if ($id !== '' && isset($porId[$id]) && !in_array($id, $limpo, true)) {
            $limpo[] = $id;
        }
    }
    return $limpo;
}

/** Áreas do painel sugeridas para quem escolheu estas funções. */
function areas_sugeridas(array $funcoes): array
{
    $porId = catalogo_funcoes()['porId'];
    $areas = [];
    foreach ($funcoes as $id) {
        foreach ((array) ($porId[$id]['areas'] ?? []) as $a) {
            if (isset(AREAS[$a]) && !in_array($a, $areas, true)) {
                $areas[] = $a;
            }
        }
    }
    return array_values(array_intersect(array_keys(AREAS), $areas));
}

/* ===================== inscrições ===================== */

function normalizar_inscricao($i): ?array
{
    if (!is_array($i) || empty($i['id']) || empty($i['nome'])) {
        return null;
    }
    $status = (string) ($i['status'] ?? 'nova');
    if (!in_array($status, ['nova', 'aprovada', 'recusada'], true)) {
        $status = 'nova';
    }

    return [
        'id'        => limpar_texto($i['id'], 40),
        'nome'      => limpar_texto($i['nome'], 80),
        'telefone'  => so_digitos($i['telefone'] ?? ''),
        'email'     => limpar_texto($i['email'] ?? '', 120),
        'cidade'    => limpar_texto($i['cidade'] ?? '', 60),
        'bairro'    => limpar_texto($i['bairro'] ?? '', 60),
        'funcoes'   => funcoes_validas(is_array($i['funcoes'] ?? null) ? $i['funcoes'] : []),
        'status'    => $status,
        'criadoEm'  => limpar_texto($i['criadoEm'] ?? '', 40),
        'consentimentoEm'     => limpar_texto($i['consentimentoEm'] ?? '', 40),
        'consentimentoVersao' => limpar_texto($i['consentimentoVersao'] ?? '', 20),
        'decididoEm'  => limpar_texto($i['decididoEm'] ?? '', 40),
        'decididoPor' => limpar_texto($i['decididoPor'] ?? '', 60),
        'usuarioId'   => limpar_texto($i['usuarioId'] ?? '', 40),
    ];
}

function ler_inscricoes(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_INSCRICOES)) {
        $bruto = @include ARQ_INSCRICOES;
        foreach (is_array($bruto) ? $bruto : [] as $i) {
            if ($limpo = normalizar_inscricao($i)) {
                $cache[] = $limpo;
            }
        }
    }
    return $cache;
}

function gravar_inscricoes(array $inscricoes): bool
{
    preparar_pastas();
    $limpas = [];
    foreach ($inscricoes as $i) {
        if ($limpo = normalizar_inscricao($i)) {
            $limpas[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo site. Não versionar, não editar à mão.\nreturn "
        . var_export($limpas, true) . ";\n";

    if (!gravar_atomico(ARQ_INSCRICOES, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_INSCRICOES, true);
    }
    ler_inscricoes(true);
    return true;
}

function achar_inscricao(string $id): ?array
{
    foreach (ler_inscricoes() as $i) {
        if ($id !== '' && $i['id'] === $id) {
            return $i;
        }
    }
    return null;
}

/** Mesmo telefone não entra duas vezes enquanto a primeira não for decidida. */
function inscricao_por_telefone(string $telefone): ?array
{
    $t = so_digitos($telefone);
    if ($t === '') {
        return null;
    }
    foreach (ler_inscricoes() as $i) {
        if ($i['telefone'] === $t) {
            return $i;
        }
    }
    return null;
}

function novo_id_inscricao(): string
{
    return bin2hex(random_bytes(8));
}

/** As iniciais do nome, para o cartão ter um rosto. */
function iniciais(string $nome): string
{
    $partes = array_values(array_filter(explode(' ', trim($nome))));
    if ($partes === []) {
        return '?';
    }
    $primeira = mb_strtoupper(mb_substr($partes[0], 0, 1));
    $ultima = count($partes) > 1 ? mb_strtoupper(mb_substr((string) end($partes), 0, 1)) : '';
    return $primeira . $ultima;
}

/* ===================== limite por IP ===================== */

/**
 * Segredo do site, criado sozinho na primeira vez. Serve para embaralhar o IP
 * antes de guardar: dá para contar quantas vezes alguém tentou sem manter
 * endereço de IP salvo, que é dado pessoal.
 */
function segredo(): string
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    if (is_file(ARQ_SEGREDO)) {
        $v = @include ARQ_SEGREDO;
        if (is_string($v) && $v !== '') {
            return $memo = $v;
        }
    }
    preparar_pastas();
    $memo = bin2hex(random_bytes(16));
    gravar_atomico(ARQ_SEGREDO, "<?php\nreturn " . var_export($memo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_SEGREDO, true);
    }
    return $memo;
}

function chave_visitante(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    // A Hostinger fica atrás de proxy; o primeiro da lista é o cliente.
    $enc = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($enc !== '') {
        $partes = explode(',', $enc);
        $primeiro = trim($partes[0]);
        if (filter_var($primeiro, FILTER_VALIDATE_IP)) {
            $ip = $primeiro;
        }
    }
    return substr(hash_hmac('sha256', $ip, segredo()), 0, 24);
}

function estado_limite(): array
{
    if (!is_file(ARQ_LIMITE)) {
        return [];
    }
    $v = @include ARQ_LIMITE;
    return is_array($v) ? $v : [];
}

/** true quando o visitante já passou do teto e deve ser barrado. */
function passou_do_limite(): bool
{
    $agora = time();
    $reg = estado_limite()[chave_visitante()] ?? null;
    if (!is_array($reg)) {
        return false;
    }
    $hora = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 3600);
    $dia  = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 86400);
    return count($hora) >= LIMITE_POR_HORA || count($dia) >= LIMITE_POR_DIA;
}

function registrar_envio(): void
{
    preparar_pastas();
    $agora = time();
    $chave = chave_visitante();
    $tudo = estado_limite();

    $envios = (array) ($tudo[$chave]['envios'] ?? []);
    $envios[] = $agora;
    // guarda só a janela de 24h, senão o arquivo cresce sem fim
    $tudo[$chave] = ['envios' => array_values(array_filter($envios, fn ($t) => $t > $agora - 86400))];

    foreach ($tudo as $k => $v) {
        $restantes = array_filter((array) ($v['envios'] ?? []), fn ($t) => $t > $agora - 86400);
        if ($restantes === []) {
            unset($tudo[$k]);
        }
    }

    gravar_atomico(ARQ_LIMITE, "<?php\nreturn " . var_export($tudo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_LIMITE, true);
    }
}
