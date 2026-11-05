<?php
declare(strict_types=1);

/** Ponte de login: o cookie existente vale em /painel; a leitura usa a API. */
require_once __DIR__ . '/acao-comum.php';

exigir_login();
if (!acao_pode_acessar(usuario_atual())) {
    http_response_code(403);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Acesso restrito</title><h1>Acesso restrito ao dono</h1><p>Esta conta não pode abrir a central de ação.</p></html>';
    exit;
}
header('Location: /acao', true, 302);
exit;
