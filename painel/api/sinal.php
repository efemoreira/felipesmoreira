<?php
declare(strict_types=1);

/**
 * api/sinal.php — o site conta que alguém abriu, compartilhou, se inscreveu.
 *
 * POST JSON `{rota, evento, site}`; responde `{ok:true}` sempre que o pedido
 * é legível — inclusive quando descarta. Quem manda é `src/lib/api/sinal.ts`,
 * por `sendBeacon`, e não espera resposta: a única coisa que este endpoint
 * não pode fazer é atrapalhar a página.
 *
 * Público, sem sessão, com o guarda dos outros endpoints públicos: origem,
 * armadilha de robô e teto por visitante (alto — é um sinal por página, e a
 * pessoa navega). O que fica gravado é só a contagem (`sinais-comum.php`).
 */

require_once __DIR__ . '/../sinais-comum.php';
require_once __DIR__ . '/../limite-comum.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false], JSON_UNESCAPED_UNICODE);
    exit;
}
if (!origem_confere()) {
    http_response_code(403);
    echo json_encode(['ok' => false], JSON_UNESCAPED_UNICODE);
    exit;
}

$bruto = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($bruto)) {
    http_response_code(400);
    echo json_encode(['ok' => false], JSON_UNESCAPED_UNICODE);
    exit;
}

/* Robô cai fora calado; teto estourado também — sinal perdido não é erro. */
$rota   = limpar_texto($bruto['rota'] ?? '', 40);
$evento = limpar_texto($bruto['evento'] ?? '', 40);
if (limpar_texto($bruto['site'] ?? '', 200) === '' && !passou_do_limite('sinal', 600, 3000)) {
    registrar_sinal($rota, $evento);
    registrar_envio('sinal');
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
