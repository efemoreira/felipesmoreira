<?php
declare(strict_types=1);

/**
 * A resposta de quem foi escalado — felipesmoreira.com/painel/api/escala.php
 *
 * Terceiro ponto do sistema aberto sem login, e pelo mesmo motivo dos outros
 * dois: quem responde não tem conta no painel, e não é para ter. Das setenta e
 * duas pessoas que se inscreveram, cinquenta e oito escolheram função antes de
 * qualquer aprovação — exigir login para dizer "topo" seria pedir que a pessoa
 * entre no sistema para poder ajudar.
 *
 * O TOKEN É A AUTORIZAÇÃO. Ele sai de `token_de_escala()`, derivado do segredo
 * do site e dos três dados do convite, então não há nada armazenado e trocar a
 * pessoa de peça invalida o link antigo sozinho. Sem token válido, o endpoint
 * responde como se o convite não existisse — dizer "token errado" só ensinaria
 * a tentar de novo.
 *
 * CSRF não protege visitante anônimo, que não tem sessão. Aqui o que protege é
 * o token, que já é por-pessoa-por-peça: não há o que um robô ganhe respondendo
 * um convite que ele não recebeu.
 *
 * GET  → devolve o convite: encontro, peça, quando, onde e os itens.
 * POST → grava 'topou' ou 'nao-posso'.
 */

require_once __DIR__ . '/../eventos-comum.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function responder(int $status, array $corpo): void
{
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * O convite pedido, se existir e se o token conferir.
 *
 * Devolve `null` para tudo que não fecha: token errado, encontro apagado, peça
 * que a família não tem, ou pessoa que saiu da escala. **Estado no corpo, e não
 * status HTTP** — é o que o contrato do painel pede, e é o que deixa a tela
 * dizer "esse convite não vale mais" em vez de mostrar erro de rede.
 */
function convite_pedido(array $fonte): ?array
{
    $pessoaId = limpar_texto($fonte['p'] ?? '', 40);
    $eventoId = limpar_texto($fonte['e'] ?? '', 40);
    $peca     = limpar_texto($fonte['f'] ?? '', 40);
    $token    = limpar_texto($fonte['t'] ?? '', 40);

    if ($pessoaId === '' || $eventoId === '' || !isset(PECAS[$peca])) {
        return null;
    }
    /* `hash_equals()` e não `===`: comparação de assinatura em tempo constante é
       o padrão, e aqui não custa nada. */
    if (!hash_equals(token_de_escala($pessoaId, $eventoId, $peca), $token)) {
        return null;
    }

    $evento = achar_evento($eventoId);
    $pessoa = achar_pessoa($pessoaId);
    if ($evento === null || $pessoa === null) {
        return null;
    }
    /* Tirada da peça, não tem o que responder. E encontro cancelado responde
       como inexistente, pelo mesmo motivo da presença: ninguém deve se
       comprometer com o que não vai acontecer. */
    if ($evento['status'] === 'cancelado'
        || !in_array($pessoaId, $evento['responsaveis'][$peca] ?? [], true)) {
        return null;
    }

    return ['pessoa' => $pessoa, 'evento' => $evento, 'peca' => $peca];
}

$metodo = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($metodo === 'GET') {
    $c = convite_pedido($_GET);
    if ($c === null) {
        responder(200, ['existe' => false]);
    }

    $lista = checklist(PECAS[$c['peca']]['checklist'] ?? '');
    responder(200, [
        'existe'   => true,
        'nome'     => primeiro_nome($c['pessoa']['nome']),
        'peca'     => PECAS[$c['peca']]['nome'],
        'titulo'   => $c['evento']['titulo'],
        'quando'   => data_cheia($c['evento']),
        'local'    => $c['evento']['local'],
        'itens'    => $lista === null ? [] : $lista['itens'],
        /* Já respondeu antes? A tela mostra o que ela disse e deixa trocar —
           quem topou na terça e ficou doente na sexta precisa poder avisar. */
        'resposta' => $c['evento']['aceites'][$c['peca']][$c['pessoa']['id']] ?? '',
    ]);
}

if ($metodo !== 'POST') {
    responder(405, ['ok' => false, 'erro' => 'Método não suportado.']);
}

$corpo = json_decode((string) file_get_contents('php://input'), true);
$corpo = is_array($corpo) ? $corpo : $_POST;

/* O teto dos outros endpoints públicos. O token HMAC já impede responder por
   outra pessoa; o teto impede um mesmo endereço de martelar o arquivo de
   encontros — que é gravado inteiro a cada resposta. */
require_once __DIR__ . '/../limite-comum.php';
if (passou_do_limite('escala', 30, 200)) {
    responder(200, ['ok' => false, 'erro' => 'Muitas tentativas agora há pouco. Tente daqui a pouco.']);
}

$c = convite_pedido($corpo);
if ($c === null) {
    responder(200, ['ok' => false, 'existe' => false]);
}

$resposta = (string) ($corpo['resposta'] ?? '');
if (!in_array($resposta, ['topou', 'nao-posso'], true)) {
    responder(200, ['ok' => false, 'erro' => 'Resposta inválida.']);
}

/* Dentro da tranca: dois convidados respondendo no mesmo minuto liam o mesmo
   encontro, e o segundo `gravar_eventos()` apagava o aceite do primeiro. */
$gravou = com_trava(ARQ_EVENTOS, function () use ($c, $resposta): bool {
    $eventos = ler_eventos(true);
    foreach ($eventos as &$e) {
        if ($e['id'] !== $c['evento']['id']) {
            continue;
        }
        $e['aceites'][$c['peca']][$c['pessoa']['id']] = $resposta;
        /* O relógio do silêncio é do CONVITE: quem responde não reabre contagem
           nenhuma, e quem nunca foi carimbado ganha o carimbo agora para a régua
           das 48h ter de onde contar. */
        if (($e['convidadoEm'][$c['peca']][$c['pessoa']['id']] ?? '') === '') {
            $e['convidadoEm'][$c['peca']][$c['pessoa']['id']] = date('c');
        }
    }
    unset($e);
    return gravar_eventos($eventos);
});

registrar_envio('escala');
if (!$gravou) {
    responder(200, ['ok' => false, 'erro' => 'Não consegui gravar. Tente de novo.']);
}

responder(200, ['ok' => true, 'resposta' => $resposta]);
