<?php
declare(strict_types=1);

/**
 * API JSON das aulas — felipesmoreira.com/painel/api/aulas.php
 *
 * GET  → o currículo inteiro, o vídeo publicado de cada aula e o que esta
 *        pessoa já concluiu.
 * POST → marca ou desmarca uma aula como concluída.
 *
 * Este endpoint é a ÚNICA porta do conteúdo das aulas. O texto não vai no
 * bundle do Next de propósito: o site é export estático e tudo que entra lá é
 * público, enquanto o manual é documento interno. Quem não tem a área 'aulas'
 * recebe `pode: false` e nenhuma linha do conteúdo.
 *
 * Segue o contrato do painel: responde 200 com o estado no corpo em vez de
 * usar status HTTP para caso esperado — a página consulta isto antes de saber
 * se o visitante está logado.
 */

require_once __DIR__ . '/../aulas-comum.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function responder(array $corpo, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
    exit;
}

$u = usuario_atual();

if ($u === null) {
    responder(['autenticado' => false]);
}
if (!pode('aulas')) {
    responder(['autenticado' => true, 'pode' => false]);
}

$metodo = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

/* ---------------- marcar aula ---------------- */

if ($metodo === 'POST') {
    /* O cookie do painel é SameSite=Strict, então um site de fora não consegue
       mandar este POST autenticado. A conferência de Origin fecha o resto,
       igual ao api/inscricao.php. */
    $origem = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origem !== '') {
        $anfitriao = parse_url($origem, PHP_URL_HOST);
        $meu = (string) ($_SERVER['HTTP_HOST'] ?? '');
        if (!is_string($anfitriao) || strcasecmp($anfitriao, $meu) !== 0) {
            responder(['ok' => false, 'erro' => 'Envio bloqueado.'], 403);
        }
    }

    $bruto = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($bruto)) {
        responder(['ok' => false, 'erro' => 'Não entendi os dados enviados.'], 400);
    }

    $acao  = limpar_texto($bruto['acao'] ?? '', 20);
    $aula  = limpar_texto($bruto['aula'] ?? '', 60);

    if (!in_array($acao, ['concluir', 'desfazer'], true)) {
        responder(['ok' => false, 'erro' => 'Ação desconhecida.'], 400);
    }
    if (aula_por_id($aula) === null) {
        responder(['ok' => false, 'erro' => 'Essa aula não existe.'], 404);
    }
    if (!marcar_aula($u['id'], $aula, $acao === 'concluir')) {
        responder(['ok' => false, 'erro' => 'Não consegui guardar seu progresso agora.'], 500);
    }

    responder(['ok' => true, 'concluidas' => aulas_concluidas($u['id'])]);
}

if ($metodo !== 'GET') {
    responder(['ok' => false, 'erro' => 'Método não aceito.'], 405);
}

/* ---------------- o curso ---------------- */

responder([
    'autenticado' => true,
    'pode'        => true,
    'nome'        => $u['nome'],
    'funcoes'     => $u['funcoes'],
    'dias'        => curriculo_publico(),
    'concluidas'  => aulas_concluidas($u['id']),
]);
