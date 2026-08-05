<?php
declare(strict_types=1);

/**
 * Núcleo do painel — felipesmoreira.com/painel
 *
 * Sessão, usuários e permissões. Todo arquivo do painel começa por aqui, então
 * é aqui que mora a única resposta para "quem é você" e "o que você pode abrir".
 *
 * Os usuários ficam em public_html/dados/usuarios.php, fora do repositório: um
 * deploy novo nunca apaga quem tem acesso e nenhuma senha entra no Git. Só o
 * hash é guardado — senha não se recupera, só se troca.
 *
 * Cada usuário tem um papel (admin ou editor) e as áreas que pode abrir.
 * Admin enxerga todas as áreas e é o único que mexe na lista de usuários.
 */

const SESSAO_SEG = 7200;  // 2 h de inatividade

const PASTA_DADOS    = __DIR__ . '/../dados';
const ARQ_USUARIOS   = PASTA_DADOS . '/usuarios.php';
const ARQ_TENTATIVAS = PASTA_DADOS . '/tentativas.json';
const PASTA_BACKUP   = PASTA_DADOS . '/backups';
const PASTA_IMAGENS  = PASTA_DADOS . '/imagens';
const URL_IMAGENS    = '/dados/imagens';  // como a página enxerga a pasta

const MAX_TENTATIVAS = 5;
const BLOQUEIO_SEG   = 900;  // 15 min
const SENHA_MIN      = 8;   // com o bloqueio por login, 8 já segura tentativa às cegas

/** As funcionalidades do painel. A chave entra no usuarios.php. */
const AREAS = [
    'agenda'  => 'Agenda da semana',
    'estudio' => 'Estúdio de artes',
];

const PAPEIS = [
    'admin'  => 'Administrador',
    'editor' => 'Editor',
];

/** Para onde cada área leva, e uma linha do que ela faz. */
const DESTINO_AREA = [
    'agenda'  => ['url' => '/painel/agenda.php', 'resumo' => 'Editar a programação que aparece em /programacao'],
    'estudio' => ['url' => '/painel/estudio.php', 'resumo' => 'Montar as artes dos posts a partir de um modelo'],
];

header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');
header('X-Content-Type-Options: nosniff');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/painel',
    'httponly' => true,
    'secure'   => $https,
    'samesite' => 'Strict',
]);
session_name('painel_agenda');
session_start();

/* ===================== infraestrutura ===================== */

/** Aceita qualquer coisa vinda do JSON (inclusive null/número) e devolve HTML seguro. */
function h($s): string
{
    return htmlspecialchars(is_scalar($s) ? (string) $s : '', ENT_QUOTES, 'UTF-8');
}

function gravar_atomico(string $destino, string $conteudo): bool
{
    $tmp = $destino . '.tmp';
    if (@file_put_contents($tmp, $conteudo, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0644);
    return @rename($tmp, $destino);
}

/** Escreve a regra só quando ela mudou — assim uma versão nova se conserta sozinha. */
function fixar_regra(string $arquivo, string $conteudo): void
{
    if (!is_file($arquivo) || @file_get_contents($arquivo) !== $conteudo) {
        @file_put_contents($arquivo, $conteudo);
    }
}

function preparar_pastas(): void
{
    foreach ([PASTA_DADOS, PASTA_BACKUP, PASTA_IMAGENS] as $pasta) {
        if (!is_dir($pasta)) {
            @mkdir($pasta, 0755, true);
        }
    }

    $negar = "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n"
           . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n";

    // Nada de PHP rodando dentro da pasta de imagens, mesmo se algo escapar da validação.
    fixar_regra(
        PASTA_IMAGENS . '/.htaccess',
        "Options -Indexes\nAddType text/plain .php .php5 .phtml .phar .cgi .pl\n<IfModule mod_php.c>\n  php_flag engine off\n</IfModule>\n"
    );

    // Backups não saem pela web.
    fixar_regra(PASTA_BACKUP . '/.htaccess', "Options -Indexes\n" . $negar);

    // Em /dados o agenda.json precisa ser legível (a página lê), mas nenhum .php
    // pode ser baixado: é lá que ficam os hashes das senhas.
    fixar_regra(
        PASTA_DADOS . '/.htaccess',
        "Options -Indexes\n<FilesMatch \"\\.(php|php5|phtml|phar|inc)$\">\n" . $negar . "</FilesMatch>\n"
    );
}

/* ===================== usuários ===================== */

/** Preenche os campos que faltam e descarta registro sem o mínimo. */
function normalizar_usuario($u): ?array
{
    if (!is_array($u) || empty($u['usuario']) || empty($u['hash'])) {
        return null;
    }
    $papel = (($u['papel'] ?? 'editor') === 'admin') ? 'admin' : 'editor';
    $pedidas = is_array($u['areas'] ?? null) ? $u['areas'] : [];

    return [
        'id'           => (string) ($u['id'] ?? ''),
        'usuario'      => (string) $u['usuario'],
        'nome'         => (string) ($u['nome'] ?? $u['usuario']),
        'hash'         => (string) $u['hash'],
        'papel'        => $papel,
        // admin não depende de marcação: enxerga tudo por definição
        'areas'        => $papel === 'admin'
            ? array_keys(AREAS)
            : array_values(array_intersect(array_keys(AREAS), $pedidas)),
        'ativo'        => !empty($u['ativo']),
        'trocarSenha'  => !empty($u['trocarSenha']),
        'criadoEm'     => (string) ($u['criadoEm'] ?? ''),
        'ultimoAcesso' => (string) ($u['ultimoAcesso'] ?? ''),
    ];
}

/** Lido uma vez por requisição; gravar_usuarios() manda reler. */
function ler_usuarios(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_USUARIOS)) {
        $bruto = @include ARQ_USUARIOS;
        foreach (is_array($bruto) ? $bruto : [] as $u) {
            if ($limpo = normalizar_usuario($u)) {
                $cache[] = $limpo;
            }
        }
    }
    return $cache;
}

function gravar_usuarios(array $usuarios): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($usuarios as $u) {
        if ($limpo = normalizar_usuario($u)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_USUARIOS, $conteudo)) {
        return false;
    }
    // o opcache pode continuar servindo a versão antiga do arquivo incluído
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_USUARIOS, true);
    }
    ler_usuarios(true);  // o resto da requisição já enxerga a lista nova
    return true;
}

function achar_usuario(string $usuario): ?array
{
    foreach (ler_usuarios() as $u) {
        if (strcasecmp($u['usuario'], $usuario) === 0) {
            return $u;
        }
    }
    return null;
}

function achar_usuario_por_id(string $id): ?array
{
    foreach (ler_usuarios() as $u) {
        if ($id !== '' && $u['id'] === $id) {
            return $u;
        }
    }
    return null;
}

function tem_admin_ativo(?string $ignorarId = null): bool
{
    foreach (ler_usuarios() as $u) {
        if ($u['papel'] === 'admin' && $u['ativo'] && $u['id'] !== $ignorarId) {
            return true;
        }
    }
    return false;
}

/** '' quando serve; senão o motivo para mostrar na tela. */
function validar_senha(string $senha): string
{
    if (mb_strlen($senha) < SENHA_MIN) {
        return 'A senha precisa de pelo menos ' . SENHA_MIN . ' caracteres.';
    }
    if (preg_match('/^\s|\s$/u', $senha)) {
        return 'A senha não pode começar nem terminar com espaço.';
    }
    return '';
}

function validar_nome_usuario(string $usuario): string
{
    if (!preg_match('/^[a-z0-9][a-z0-9._-]{2,23}$/', $usuario)) {
        return 'O login usa de 3 a 24 caracteres: letras minúsculas, números, ponto, hífen ou _.';
    }
    return '';
}

/** Senha provisória legível: o admin lê em voz alta sem errar. */
function senha_provisoria(): string
{
    $alfabeto = 'abcdefghijkmnpqrstuvwxyz23456789';  // sem l/o/0/1, que se confundem
    $partes = [];
    for ($p = 0; $p < 3; $p++) {
        $bloco = '';
        for ($i = 0; $i < 4; $i++) {
            $bloco .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
        }
        $partes[] = $bloco;
    }
    return implode('-', $partes);
}

function novo_id_usuario(): string
{
    return bin2hex(random_bytes(8));
}

/* ===================== força bruta ===================== */

function estado_tentativas(): array
{
    $bruto = is_file(ARQ_TENTATIVAS) ? json_decode((string) @file_get_contents(ARQ_TENTATIVAS), true) : null;
    return is_array($bruto) ? $bruto : [];
}

/** O bloqueio é por login: errar o meu não tranca o dos outros. */
function bloqueado_ate(string $usuario): int
{
    $chave = mb_strtolower($usuario);
    $ate = (int) (estado_tentativas()[$chave]['ate'] ?? 0);
    return $ate > time() ? $ate : 0;
}

function registrar_falha(string $usuario): void
{
    preparar_pastas();
    $chave = mb_strtolower($usuario);
    $tudo = estado_tentativas();
    $atual = is_array($tudo[$chave] ?? null) ? $tudo[$chave] : ['contagem' => 0, 'ate' => 0];

    $atual['contagem'] = ((int) ($atual['contagem'] ?? 0)) + 1;
    if ($atual['contagem'] >= MAX_TENTATIVAS) {
        $atual['ate'] = time() + BLOQUEIO_SEG;
        $atual['contagem'] = 0;
    }
    $tudo[$chave] = $atual;

    // some com o que já expirou, para o arquivo não crescer sem fim
    $agora = time();
    foreach ($tudo as $k => $v) {
        if ($k !== $chave && ((int) ($v['ate'] ?? 0)) < $agora && ((int) ($v['contagem'] ?? 0)) === 0) {
            unset($tudo[$k]);
        }
    }
    gravar_atomico(ARQ_TENTATIVAS, (string) json_encode($tudo));
}

function limpar_falhas(string $usuario): void
{
    $chave = mb_strtolower($usuario);
    $tudo = estado_tentativas();
    if (isset($tudo[$chave])) {
        unset($tudo[$chave]);
        gravar_atomico(ARQ_TENTATIVAS, (string) json_encode($tudo));
    }
}

/* ===================== sessão ===================== */

function token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function token_valido(): bool
{
    return !empty($_SESSION['csrf'])
        && is_string($_POST['csrf'] ?? null)
        && hash_equals($_SESSION['csrf'], $_POST['csrf']);
}

function derrubar_sessao(): void
{
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function entrar_como(array $u): void
{
    session_regenerate_id(true);
    $_SESSION['uid'] = $u['id'];
    $_SESSION['visto'] = time();
    marcar_acesso($u['id']);
}

/**
 * Quem está logado agora — relido do disco a cada requisição, de propósito:
 * tirar a permissão de alguém tem efeito na hora, sem esperar a sessão vencer.
 */
function usuario_atual(): ?array
{
    static $memo = false;
    if ($memo !== false) {
        return $memo;
    }
    $memo = null;

    $id = (string) ($_SESSION['uid'] ?? '');
    if ($id === '') {
        return null;
    }
    if ((time() - (int) ($_SESSION['visto'] ?? 0)) > SESSAO_SEG) {
        derrubar_sessao();
        return null;
    }
    $u = achar_usuario_por_id($id);
    if ($u === null || !$u['ativo']) {
        derrubar_sessao();
        return null;
    }
    $_SESSION['visto'] = time();
    $memo = $u;
    return $memo;
}

function autenticado(): bool
{
    return usuario_atual() !== null;
}

function e_admin(): bool
{
    $u = usuario_atual();
    return $u !== null && $u['papel'] === 'admin';
}

function pode(string $area): bool
{
    $u = usuario_atual();
    return $u !== null && ($u['papel'] === 'admin' || in_array($area, $u['areas'], true));
}

/** As áreas que a pessoa logada realmente abre, na ordem da constante. */
function areas_do_usuario(): array
{
    return array_values(array_filter(array_keys(AREAS), 'pode'));
}

function marcar_acesso(string $id): void
{
    $usuarios = ler_usuarios();
    foreach ($usuarios as &$u) {
        if ($u['id'] === $id) {
            $u['ultimoAcesso'] = date('c');
            gravar_usuarios($usuarios);
            return;
        }
    }
}

/** Porteiro das páginas que não têm tela de login própria. */
function exigir_login(): void
{
    $u = usuario_atual();
    if ($u === null) {
        header('Location: /painel/?volta=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/painel/'), true, 302);
        exit;
    }
    // senha provisória: não passa daqui sem trocar
    if ($u['trocarSenha'] && basename((string) ($_SERVER['SCRIPT_NAME'] ?? '')) !== 'conta.php') {
        header('Location: /painel/conta.php', true, 302);
        exit;
    }
}

function exigir_area(string $area): void
{
    exigir_login();
    if (!pode($area)) {
        header('Location: /painel/?negado=' . rawurlencode($area), true, 302);
        exit;
    }
}

function exigir_admin(): void
{
    exigir_login();
    if (!e_admin()) {
        header('Location: /painel/?negado=usuarios', true, 302);
        exit;
    }
}
