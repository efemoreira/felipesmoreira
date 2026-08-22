<?php
declare(strict_types=1);

/**
 * Os candidatos da chapa — felipesmoreira.com/painel/api/candidatos.php
 *
 * GET, sem login, pelas mesmas razões do api/kit.php: aqui **não há nada a
 * proteger**. Nome de urna, cargo, número e perfil público de candidato
 * registrado são informação pública por definição legal — trancar isso atrás de
 * sessão só impediria o eleitor de conferir o número antes de votar.
 *
 * O que ainda vale: só sai quem está com `publicado` marcado. `ordem` e
 * `criadoEm` são do painel e não descem — o site desenha, não administra.
 */

require_once __DIR__ . '/../candidatos-comum.php';

header('Content-Type: application/json; charset=utf-8');
/* Curto, e não `no-store`: a lista muda pouco e é pedida por muita gente ao
   mesmo tempo quando a colinha circula. */
header('Cache-Control: public, max-age=300');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'Método não aceito.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$candidatos = [];
foreach (candidatos_publicados() as $c) {
    $candidatos[] = [
        'id'     => $c['id'],
        'nome'   => $c['urna'] !== '' ? $c['urna'] : $c['nome'],
        /* O RÓTULO, e não a chave: o site desenha o que recebe, e uma tabela
           de cargos repetida em TypeScript divergiria na primeira eleição. */
        'cargo'  => rotulo_cargo($c['cargo']),
        'numero' => $c['numero'],
        'partido' => $c['partido'],
        'instagram' => $c['instagram'],
        'imagem' => $c['imagem'],
    ];
}

/* As listas descem junto: são elas que o site desenha, e pedi-las num segundo
   endpoint faria a página piscar duas vezes no 4G de quem abriu na fila. */
$listas = [];
foreach (listas_publicadas() as $l) {
    $listas[] = [
        'id'   => $l['id'],
        'nome' => $l['nome'],
        'descricao' => $l['descricao'],
        'candidatos' => $l['candidatos'],
        'naHome' => $l['naHome'],
    ];
}

echo json_encode(['candidatos' => $candidatos, 'listas' => $listas], JSON_UNESCAPED_UNICODE);
