<?php
declare(strict_types=1);

/**
 * Porteiro do Estúdio de Artes — felipesmoreira.com/painel/estudio
 *
 * O editor em si é uma página estática gerada pelo Next (estudio.html), que o
 * .htaccess da pasta impede de ser baixada direto. Quem serve o arquivo é este
 * script, e só depois de conferir a sessão.
 */

require_once __DIR__ . '/sessao.php';
exigir_login();

$pagina = __DIR__ . '/estudio.html';
if (!is_file($pagina)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Estúdio ainda não publicado: falta o estudio.html do build.\n");
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
readfile($pagina);
