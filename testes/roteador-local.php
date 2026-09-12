<?php
/**
 * O roteador do `php -S` para o painel local (`npm run painel:local`).
 *
 * Em produção é o Apache que dá as URLs limpas (`/painel/pessoas` →
 * `pessoas.php`), pelas RewriteRule que o `publish.yml` gera. O servidor
 * embutido do PHP não lê `.htaccess`, e sem isto todo link do menu daria 404
 * na máquina de quem está começando. A regra é a mesma de lá: `/painel/<x>`
 * vira `/painel/<x>.php` quando o arquivo existe; o resto é servido como está.
 *
 * Só para desenvolvimento. Não é usado por teste nenhum nem vai para o ar.
 */
declare(strict_types=1);

$caminho = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$raiz = __DIR__ . '/../public';

if ($caminho === '/painel' || $caminho === '/painel/') {
    require $raiz . '/painel/index.php';
    return true;
}
if (preg_match('#^/painel/([a-z-]+)/?$#', $caminho, $m) === 1 && is_file("$raiz/painel/{$m[1]}.php")) {
    $_SERVER['SCRIPT_NAME'] = "/painel/{$m[1]}.php";
    chdir("$raiz/painel");
    require "$raiz/painel/{$m[1]}.php";
    return true;
}
/* Arquivo que existe (php, css, js, imagem): o servidor embutido serve. */
return false;
