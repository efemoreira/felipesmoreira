<?php
declare(strict_types=1);

require_once __DIR__ . '/../plano-feedback-comum.php';
require_once __DIR__ . '/../limite-comum.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function responder_feedback(int $status, string $mensagem, array $extra = []): never
{
    http_response_code($status);
    echo json_encode(['ok' => $status >= 200 && $status < 300, 'mensagem' => $mensagem] + $extra, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder_feedback(405, 'Método não permitido.');
}
if (!origem_confere()) {
    responder_feedback(403, 'Origem não permitida.');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 16000) {
    responder_feedback(413, 'Mensagem muito longa.');
}
$dados = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($dados)) {
    responder_feedback(400, 'Dados inválidos.');
}
$acao = $dados['acao'] ?? 'enviar';
if ($acao === 'listar') {
    responder_feedback(200, 'Avaliações recebidas.', ['feedbacks' => feedbacks_plano_publicos()]);
}
if ($acao === 'apagar') {
    $id = $dados['id'] ?? '';
    if (!is_string($id) || preg_match('/^[a-f0-9]{16}$/D', $id) !== 1) {
        responder_feedback(400, 'Avaliação inválida.');
    }
    if (passou_do_limite('plano-feedback-apagar', 30, 100)) {
        responder_feedback(429, 'Muitas exclusões. Tente mais tarde.');
    }
    $apagou = apagar_feedback_plano($id);
    if ($apagou === null) responder_feedback(404, 'Avaliação não encontrada.');
    if (!$apagou) responder_feedback(500, 'Não foi possível apagar. Tente novamente.');
    registrar_envio('plano-feedback-apagar');
    responder_feedback(200, 'Avaliação apagada.');
}
if ($acao !== 'enviar') {
    responder_feedback(400, 'Ação inválida.');
}
if (limpar_texto($dados['site'] ?? '', 200) !== '') {
    responder_feedback(400, 'Envio inválido.');
}
if (passou_do_limite('plano-feedback', 4, 12)) {
    responder_feedback(429, 'Muitas avaliações enviadas. Tente mais tarde.');
}

$nota = filter_var($dados['nota'] ?? null, FILTER_VALIDATE_INT);
$opiniao = limpar_texto($dados['opiniao'] ?? '', 2000);
$melhoria = limpar_texto($dados['melhoria'] ?? '', 2000);
$parte = limpar_texto($dados['parte'] ?? '', 40);
$partes = ['geral', 'diagnostico', 'novidades', 'estrutura', 'militancia', 'portavozes', 'cultura', 'territorio', 'calendario', 'desafio', 'indicadores', 'site', 'governanca', 'modelos'];
if ($nota === false || $nota < 1 || $nota > 5 || mb_strlen($opiniao) < 10 || !in_array($parte, $partes, true)) {
    responder_feedback(422, 'Escolha uma nota e escreva uma opinião de pelo menos 10 caracteres.');
}

$feedback = [
    'id' => bin2hex(random_bytes(8)),
    'criadoEm' => date('c'),
    'nota' => $nota,
    'parte' => $parte,
    'opiniao' => $opiniao,
    'melhoria' => $melhoria,
];
if (!guardar_feedback_plano($feedback)) {
    responder_feedback(500, 'Não foi possível salvar. Tente novamente.');
}
registrar_envio('plano-feedback');
responder_feedback(201, 'Avaliação salva. Obrigado por contribuir!', ['feedback' => $feedback]);
