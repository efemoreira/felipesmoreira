<?php
declare(strict_types=1);

/**
 * As peças extras do kit — felipesmoreira.com/painel/api/kit.php
 *
 * GET, sem login. Diferente do api/aulas.php, aqui **não há nada a proteger**:
 * a peça é feita para circular no WhatsApp, e o que ela contém já vai estar em
 * print no grupo cinco minutos depois de publicada. Trancar isso atrás de
 * sessão só impediria o militante de abrir o kit no celular dele.
 *
 * Por isso também não entra na lista de endpoints com regra de origem: não há
 * escrita, não há sessão, não há dado pessoal. É leitura pública de material
 * de campanha — o mesmo estatuto do /propostas.
 *
 * O que ainda vale: só sai o que está com `publicada` marcada.
 */

require_once __DIR__ . '/../kit-comum.php';

header('Content-Type: application/json; charset=utf-8');
/* Curto, e não `no-store`: a peça do dia pode esperar cinco minutos, e num
   mutirão são centenas de aparelhos pedindo o mesmo arquivo ao mesmo tempo. */
header('Cache-Control: public, max-age=300');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'Método não aceito.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$saida = [];
foreach (pecas_publicadas() as $p) {
    // o painel não vai para o site: só o que o cartão desenha
    $saida[] = [
        'id'      => $p['id'],
        'tema'    => $p['tema'],
        'numero'  => $p['numero'],
        'frase'   => $p['frase'],
        'fonte'   => $p['fonte'],
        'legenda' => $p['legenda'],
        'destino' => $p['destino'],
    ];
}

echo json_encode(['pecas' => $saida], JSON_UNESCAPED_UNICODE);
