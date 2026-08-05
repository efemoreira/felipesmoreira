<?php
declare(strict_types=1);

/**
 * Sessão compartilhada do painel — felipesmoreira.com/painel
 *
 * Todo arquivo do painel começa por aqui: mesma sessão, mesmo cookie, mesma
 * senha. Assim o estúdio de artes não precisa repetir (nem divergir de) a
 * autenticação que o editor da agenda já usa.
 */

const SESSAO_SEG = 7200;  // 2 h de inatividade

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

function autenticado(): bool
{
    if (empty($_SESSION['ok'])) {
        return false;
    }
    if ((time() - (int) ($_SESSION['visto'] ?? 0)) > SESSAO_SEG) {
        session_destroy();
        return false;
    }
    $_SESSION['visto'] = time();
    return true;
}

/** Porteiro das páginas que não têm tela de login própria. */
function exigir_login(): void
{
    if (autenticado()) {
        return;
    }
    header('Location: /painel/', true, 302);
    exit;
}
