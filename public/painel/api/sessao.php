<?php
declare(strict_types=1);

/**
 * API JSON do painel — felipesmoreira.com/painel/api/sessao.php
 *
 * Primeiro endpoint JSON do painel: modelo para os próximos (ex: aulas.php).
 * Reaproveita sessao.php inteiro (mesmo cookie, mesma sessão do painel) — não
 * existe um segundo sistema de login para o site estático consumir isto.
 *
 * Sempre responde 200: o "não autenticado" é dado no corpo (autenticado:false),
 * não em status HTTP, porque este endpoint é consultado o tempo todo por
 * visitantes anônimos só para saber se devem ver a área de aulas.
 */

require_once __DIR__ . '/../sessao.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

$u = usuario_atual();

if ($u === null) {
    echo json_encode(['autenticado' => false]);
    exit;
}

echo json_encode([
    'autenticado' => true,
    'login'       => $u['usuario'],
    'papel'       => rotulo_do_acesso($u),
    'areas'       => areas_do_usuario(),
]);
