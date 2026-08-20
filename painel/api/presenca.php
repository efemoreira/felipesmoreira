<?php
declare(strict_types=1);

/**
 * Lista de presença dos encontros — felipesmoreira.com/painel/api/presenca.php
 *
 * Segundo (e último) ponto do sistema aberto sem login. Serve a mesa da
 * Recepção: a pessoa aponta a câmera para o QR e se cadastra no próprio
 * celular, em vez de fazer fila para alguém digitar.
 *
 * Vale aqui a mesma regra do api/inscricao.php, e pela mesma razão: CSRF não
 * protege visitante anônimo, que não tem sessão. O que protege é armadilha de
 * robô, teto de envios por visitante, conferência de origem e telefone repetido.
 *
 * GET  ?e=<token> → diz se o encontro existe e devolve o título (para a página
 *                   mostrar em qual encontro a pessoa está entrando).
 * POST            → cadastra a pessoa.
 */

require_once __DIR__ . '/../eventos-comum.php';
require_once __DIR__ . '/../inscricoes-comum.php';  // chave_visitante() e o teto de envios

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function responder(int $status, array $corpo): void
{
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
    exit;
}

function recusar(string $erro, int $status = 422): void
{
    responder($status, ['ok' => false, 'erro' => $erro]);
}

$metodo = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

/* ---------------- o encontro existe? ---------------- */

if ($metodo === 'GET') {
    $evento = evento_por_token(limpar_texto($_GET['e'] ?? '', 40));

    /* Encontro cancelado responde como inexistente de propósito: ninguém deve
       se cadastrar para algo que não vai acontecer, e explicar o motivo só
       geraria pergunta que a mesa da Recepção não tem como responder. */
    if ($evento === null || $evento['status'] === 'cancelado') {
        responder(200, ['existe' => false]);
    }

    responder(200, [
        'existe' => true,
        'titulo' => $evento['titulo'],
        'data'   => $evento['data'],
        'hora'   => $evento['hora'],
        'local'  => $evento['local'],
    ]);
}

if ($metodo !== 'POST') {
    responder(405, ['ok' => false, 'erro' => 'Método não aceito.']);
}

/* ---------------- só do nosso site ---------------- */

$origem = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origem !== '') {
    $anfitriao = parse_url($origem, PHP_URL_HOST);
    $meu = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if (!is_string($anfitriao) || strcasecmp($anfitriao, $meu) !== 0) {
        recusar('Envio bloqueado.', 403);
    }
}

$bruto = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($bruto)) {
    recusar('Não entendi os dados enviados.', 400);
}

/* ---------------- armadilha de robô ---------------- */

if (limpar_texto($bruto['site'] ?? '', 200) !== '') {
    // Some em silêncio: contar a verdade ensina o robô a contornar.
    responder(200, ['ok' => true]);
}

/* ---------------- teto de envios por visitante ---------------- */

if (passou_do_limite()) {
    recusar('Você já se cadastrou há pouco. Procure alguém da recepção.', 429);
}

/* ---------------- o encontro ---------------- */

$evento = evento_por_token(limpar_texto($bruto['evento'] ?? '', 40));
if ($evento === null || $evento['status'] === 'cancelado') {
    recusar('Esse link de presença não vale mais. Procure alguém da recepção.', 404);
}

/* ---------------- consentimento é obrigatório (LGPD) ---------------- */

if (($bruto['consentimento'] ?? false) !== true) {
    recusar('Falta concordar com o uso dos seus dados.');
}

/* ---------------- campos ---------------- */

$nome     = limpar_texto($bruto['nome'] ?? '', 80);
$telefone = so_digitos($bruto['telefone'] ?? '');
$bairro   = limpar_texto($bruto['bairro'] ?? '', 60);
$convidadoPor = limpar_texto($bruto['convidadoPor'] ?? '', 60);

$nome = preg_replace('/\s+/u', ' ', $nome) ?? $nome;

if (mb_strlen($nome) < 3) {
    recusar('Escreva seu nome.');
}
if (strlen($telefone) < 10 || strlen($telefone) > 11) {
    recusar('Confira o WhatsApp: use DDD + número.');
}

/* Mesmo número não entra duas vezes — e responde ok, porque a pessoa que tocou
   duas vezes no botão já está na lista e não tem nada para corrigir. */
if (lead_por_telefone($evento['id'], $telefone) !== null) {
    responder(200, ['ok' => true, 'jaEstava' => true]);
}

/* ---------------- grava ---------------- */

$leads = ler_leads();
$leads[] = [
    'id'       => novo_id_lead(),
    'eventoId' => $evento['id'],
    'nome'     => $nome,
    'telefone' => $telefone,
    'bairro'   => $bairro,
    'convidadoPor' => $convidadoPor,
    'classe'     => 'curioso',
    'confirmou'  => true,
    'compareceu' => true,   // quem lê o QR na porta está na porta
    'origem'     => 'qr',
    'criadoPorId' => '',
    'criadoEm'    => date('c'),
    'consentimentoEm'     => date('c'),
    'consentimentoVersao' => VERSAO_CONSENTIMENTO_PRESENCA,
];

if (!gravar_leads($leads)) {
    recusar('Não consegui guardar seu cadastro agora. Procure alguém da recepção.', 500);
}

registrar_envio();
responder(200, ['ok' => true]);
