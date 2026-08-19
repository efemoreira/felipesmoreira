<?php
declare(strict_types=1);

/**
 * Recebe o formulário de /quero-ajudar — felipesmoreira.com/painel/api/inscricao.php
 *
 * É o ÚNICO ponto do sistema aberto sem login, então a proteção aqui não é
 * CSRF (visitante anônimo não tem sessão para proteger) e sim: armadilha de
 * robô, teto de envios por visitante, conferência de origem e telefone repetido.
 *
 * A inscrição não cria conta. Ela entra na fila de /painel/inscricoes, e quem
 * decide é uma pessoa da coordenação.
 */

require_once __DIR__ . '/../inscricoes-comum.php';

// sessao.php marca noindex para o painel inteiro; num endpoint JSON é inofensivo.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

/* Sem tipo de retorno `never`: ele exige PHP 8.1, e o painel só depende de 8.0
   até aqui. Ambas encerram a requisição. */

/** Encerra com uma resposta JSON — sempre no mesmo formato que o front espera. */
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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'erro' => 'Método não aceito.']);
}

/* ---- só do nosso site ---- */
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

/* ---- armadilha de robô: campo escondido tem que chegar vazio ---- */
if (limpar_texto($bruto['site'] ?? '', 200) !== '') {
    // Some em silêncio: contar a verdade ensina o robô a contornar.
    responder(200, ['ok' => true]);
}

/* ---- teto de envios ---- */
if (passou_do_limite()) {
    recusar('Você já enviou uma inscrição há pouco. Se precisar falar com a gente, chame no WhatsApp.', 429);
}

/* ---- consentimento é obrigatório (LGPD) ---- */
if (($bruto['consentimento'] ?? false) !== true) {
    recusar('Falta concordar com o uso dos seus dados.');
}

/* ---- campos ---- */
$nome     = limpar_texto($bruto['nome'] ?? '', 80);
$telefone = so_digitos($bruto['telefone'] ?? '');
$email    = limpar_texto($bruto['email'] ?? '', 120);
$cidade   = limpar_texto($bruto['cidade'] ?? '', 60);
$bairro   = limpar_texto($bruto['bairro'] ?? '', 60);
$funcoes  = funcoes_validas(is_array($bruto['funcoes'] ?? null) ? $bruto['funcoes'] : []);

$nome = preg_replace('/\s+/u', ' ', $nome) ?? $nome;

if (mb_strlen($nome) < 5 || mb_strpos($nome, ' ') === false) {
    recusar('Escreva seu nome completo.');
}
if (strlen($telefone) < 10 || strlen($telefone) > 11) {
    recusar('Confira o WhatsApp: use DDD + número.');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    recusar('Esse e-mail parece incompleto.');
}
if ($cidade === '' || $bairro === '') {
    recusar('Diga sua cidade e seu bairro.');
}
if ($funcoes === []) {
    recusar('Escolha pelo menos uma forma de ajudar.');
}

/* ---- mesmo telefone não entra duas vezes ---- */
if (($ja = inscricao_por_telefone($telefone)) !== null) {
    if ($ja['status'] === 'nova') {
        recusar('Sua inscrição já está com a gente — a coordenação vai te chamar no WhatsApp.', 409);
    }
    if ($ja['status'] === 'aprovada') {
        recusar('Esse número já tem acesso. Se você perdeu a senha, chame a coordenação no WhatsApp.', 409);
    }
    recusar('Não foi possível registrar essa inscrição. Fale com a coordenação no WhatsApp.', 409);
}

/* ---- grava ---- */
$inscricoes = ler_inscricoes();
$inscricoes[] = [
    'id'       => novo_id_inscricao(),
    'nome'     => $nome,
    'telefone' => $telefone,
    'email'    => $email,
    'cidade'   => $cidade,
    'bairro'   => $bairro,
    'funcoes'  => $funcoes,
    'status'   => 'nova',
    'criadoEm' => date('c'),
    'consentimentoEm'     => date('c'),
    'consentimentoVersao' => VERSAO_CONSENTIMENTO,
];

if (!gravar_inscricoes($inscricoes)) {
    recusar('Não consegui guardar sua inscrição agora. Tente de novo em alguns minutos.', 500);
}

registrar_envio();
responder(200, ['ok' => true]);
