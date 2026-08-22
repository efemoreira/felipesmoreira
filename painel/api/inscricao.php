<?php
declare(strict_types=1);

/**
 * Recebe o formulário de /queroajudar — felipesmoreira.com/painel/api/inscricao.php
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
if (!origem_confere()) {
    recusar('Envio bloqueado.', 403);
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
/* Conferida contra o catálogo, e devolvida na grafia dele: o formulário manda
   uma opção da lista, mas o endpoint é público e recebe o que mandarem. */
$cidade   = cidade_valida($bruto['cidade'] ?? '');
$bairro   = limpar_texto($bruto['bairro'] ?? '', 60);
$funcoes  = funcoes_validas(is_array($bruto['funcoes'] ?? null) ? $bruto['funcoes'] : []);

/* De onde veio: o `?de=` da URL. Opcional de propósito — inscrição sem origem
   é inscrição válida, e recusar por causa disso trocaria um militante novo por
   uma linha de relatório. */
$origem   = normalizar_origem($bruto['de'] ?? '');

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
    recusar('Escolha sua cidade na lista e diga seu bairro.');
}
/* Função é OPCIONAL. Quem chegou disposto e ainda não sabe onde encaixa é
   militante do mesmo jeito — recusar aqui trocaria um militante novo por uma
   linha de relatório, o mesmo erro que a `origem` evita logo acima. Sem
   escolha, a aprovação assume "onde-precisar" (ver inscricoes.php). */

/* ---- mesmo telefone não entra duas vezes ---- */
$ja = inscricao_por_telefone($telefone);
if ($ja !== null) {
    if ($ja['status'] === 'pendente') {
        recusar('Sua inscrição já está com a gente — a coordenação vai te chamar no WhatsApp.', 409);
    }
    if (tem_conta($ja)) {
        recusar('Esse número já tem acesso. Se você perdeu a senha, chame a coordenação no WhatsApp.', 409);
    }
    if ($ja['status'] === 'recusada') {
        recusar('Não foi possível registrar essa inscrição. Fale com a coordenação no WhatsApp.', 409);
    }
    /* Já conhecida sem estar na fila: apareceu num encontro, foi cadastrada pela
       coordenação. Ela não vira uma segunda ficha — entra na fila a ficha que já
       existe, com o que ela acabou de dizer por cima. Antes isso criava uma
       inscrição paralela, e a mesma pessoa passava a existir duas vezes. */
    $pessoas = ler_pessoas();
    foreach ($pessoas as &$p) {
        if ($p['id'] !== $ja['id']) {
            continue;
        }
        $p['nome']   = $nome;
        $p['status'] = 'pendente';
        $p['criadoEm'] = date('c');   // o relógio da fila começa agora
        foreach (['email' => $email, 'cidade' => $cidade, 'bairro' => $bairro] as $campo => $valor) {
            if ($valor !== '') {
                $p[$campo] = $valor;
            }
        }
        if ($funcoes !== []) {
            $p['funcoes'] = $funcoes;
        }
        if ($origem !== '' && $p['origem'] === '') {
            $p['origem'] = $origem;
        }
        $p['consentimentoEm'] = date('c');
        $p['consentimentoVersao'] = VERSAO_CONSENTIMENTO;
    }
    unset($p);

    if (!gravar_pessoas($pessoas)) {
        recusar('Não consegui guardar sua inscrição agora. Tente de novo em alguns minutos.', 500);
    }
    registrar_envio();
    responder(200, ['ok' => true]);
}

/* ---- grava ---- */
$pessoas = ler_pessoas();
$pessoas[] = [
    'id'       => novo_id_pessoa(),
    'nome'     => $nome,
    /* Entra como eleitor: militante é o que ela vira quando a coordenação
       aprova. Chamar de militante quem ainda não foi conferido inflaria a
       contagem do movimento com quem só preencheu um formulário. */
    'tipo'     => 'eleitor',
    'telefone' => $telefone,
    'email'    => $email,
    'cidade'   => $cidade,
    'bairro'   => $bairro,
    'funcoes'  => $funcoes,
    'origem'   => $origem,
    'status'   => 'pendente',
    'criadoEm' => date('c'),
    'consentimentoEm'     => date('c'),
    'consentimentoVersao' => VERSAO_CONSENTIMENTO,
];

if (!gravar_pessoas($pessoas)) {
    recusar('Não consegui guardar sua inscrição agora. Tente de novo em alguns minutos.', 500);
}

registrar_envio();
responder(200, ['ok' => true]);
