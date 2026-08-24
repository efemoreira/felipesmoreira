<?php
declare(strict_types=1);

/**
 * Presença nos encontros — felipesmoreira.com/painel/api/presenca.php
 *
 * Segundo (e último) ponto do sistema aberto sem login. Serve duas coisas:
 *
 *   - o QR da mesa da Recepção (`?e=<token>`), que grava COMPARECEU;
 *   - o link de "vou" que circula no grupo (`?c=<token>`), que grava CONFIRMOU.
 *
 * São dois tokens de propósito. Com um só, qualquer pessoa que recebesse o link
 * no grupo poderia se marcar como presente sem sair de casa — e é a lista de
 * presença que alimenta o funil D+0/D+3/D+7.
 *
 * Vale aqui a mesma regra do api/inscricao.php, e pela mesma razão: CSRF não
 * protege visitante anônimo, que não tem sessão. O que protege é armadilha de
 * robô, teto de envios por visitante e conferência de origem.
 *
 * GET  ?e= | ?c=  → diz se o encontro existe e o que mostrar na tela.
 * POST acao=procurar → acha a pessoa pelo telefone (ver o comentário lá embaixo).
 * POST acao=confirmar → marca a presença de uma ficha já existente.
 * POST (sem ação)     → cadastra alguém novo.
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

/**
 * O encontro pedido, e em que modo.
 *
 * 'chegada' vem do QR impresso e grava compareceu; 'confirmacao' vem do link
 * divulgado e grava só confirmou.
 */
function evento_pedido($e, $c): array
{
    $token = limpar_texto($e ?? '', 40);
    if ($token !== '') {
        return ['evento' => evento_por_token($token), 'modo' => 'chegada'];
    }
    return ['evento' => evento_por_confirmacao(limpar_texto($c ?? '', 40)), 'modo' => 'confirmacao'];
}

/**
 * A referência opaca de uma ficha, para a tela devolver "sou eu".
 *
 * NUNCA o id cru: id que sai daqui é identificador estável, e identificador
 * estável vazado de endpoint público é coisa que se coleciona. Isto é derivado
 * do segredo do site e do próprio telefone, então o servidor recalcula em vez
 * de guardar — e uma ref só serve para o telefone que a gerou.
 */
function ref_de(string $telefone, string $id): string
{
    return substr(hash_hmac('sha256', $telefone . '|' . $id, segredo()), 0, 24);
}

$metodo = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

/* ---------------- o encontro existe? ---------------- */

if ($metodo === 'GET') {
    ['evento' => $evento, 'modo' => $modo] = evento_pedido($_GET['e'] ?? '', $_GET['c'] ?? '');

    /* Encontro cancelado responde como inexistente de propósito: ninguém deve
       se cadastrar para algo que não vai acontecer, e explicar o motivo só
       geraria pergunta que a mesa da Recepção não tem como responder. */
    if ($evento === null || $evento['status'] === 'cancelado') {
        responder(200, ['existe' => false]);
    }

    responder(200, [
        'existe' => true,
        'modo'   => $modo,
        'titulo' => $evento['titulo'],
        'subtitulo' => $evento['subtitulo'],
        'data'   => $evento['data'],
        'hora'   => $evento['hora'],
        'local'  => $evento['local'],
        'imagem' => $evento['imagem'],
        /* O véu entre a imagem e o texto que a tela escreve por cima. Vai a
           chave, e não o CSS: quem desenha é o site, e o catálogo dos dois lados
           é o mesmo (FILTROS / src/features/presenca/filtro.ts). */
        'filtro' => $evento['filtro'],
    ]);
}

if ($metodo !== 'POST') {
    responder(405, ['ok' => false, 'erro' => 'Método não aceito.']);
}

/* ---------------- só do nosso site ---------------- */

if (!origem_confere()) {
    recusar('Envio bloqueado.', 403);
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

/* ---------------- teto de envios por visitante ----------------
   Conta a BUSCA também, e não só o cadastro. Sem isso o endpoint viraria um
   oráculo: digita número, recebe nome — e quem quisesse varrer uma faixa de
   telefones teria tentativas infinitas de graça. */

if (passou_do_limite('presenca', LIMITE_PRESENCA_HORA, LIMITE_PRESENCA_DIA)) {
    recusar('Você já tentou várias vezes agora há pouco. Procure alguém da recepção.', 429);
}

/* ---------------- o encontro ---------------- */

['evento' => $evento, 'modo' => $modo] = evento_pedido($bruto['evento'] ?? '', $bruto['confirmacao'] ?? '');
if ($evento === null || $evento['status'] === 'cancelado') {
    recusar('Esse link não vale mais. Procure alguém da recepção.', 404);
}

$acao = limpar_texto($bruto['acao'] ?? '', 20);
$telefone = so_digitos($bruto['telefone'] ?? '');

if (strlen($telefone) < 10 || strlen($telefone) > 11) {
    recusar('Confira o WhatsApp: use DDD + número.');
}

/**
 * Marca a presença desta pessoa neste encontro, e devolve a resposta pronta.
 *
 * A presença é uma RELAÇÃO: a pessoa existe uma vez só, e cada encontro em que
 * ela aparece é uma linha apontando para ela. Antes cada ficha repetia nome,
 * telefone e bairro — quem foi a cinco encontros tinha cinco cópias de si.
 */
function marcar(array $evento, array $pessoa, string $modo): void
{
    $presencas = ler_presencas();
    $achou = false;
    foreach ($presencas as &$l) {
        if ($l['eventoId'] === $evento['id'] && $l['pessoaId'] === $pessoa['id']) {
            $l['confirmou'] = true;
            if ($modo === 'chegada') {
                $l['compareceu'] = true;
            }
            $achou = true;
        }
    }
    unset($l);

    if (!$achou) {
        $presencas[] = [
            'id'       => novo_id_presenca(),
            'eventoId' => $evento['id'],
            'pessoaId' => $pessoa['id'],
            'confirmou'  => true,
            'compareceu' => $modo === 'chegada',  // quem lê o QR na porta está na porta
            'origem'     => 'qr',
            'criadoPorId' => '',
            'criadoEm'    => date('c'),
        ];
    }
    if (!gravar_presencas($presencas)) {
        recusar('Não consegui guardar agora. Procure alguém da recepção.', 500);
    }
    registrar_envio('presenca');

    responder(200, [
        'ok'       => true,
        'jaEstava' => $achou,
        /* Só o primeiro nome. Devolver a ficha inteira faria de um número
           alheio digitado por engano um jeito de ler o cadastro de outra
           pessoa; devolver NADA faria quem errou um dígito confirmar a pessoa
           errada em silêncio, sem nunca descobrir. O primeiro nome é o
           suficiente para a pessoa se reconhecer — ou perceber que não é ela. */
        'nome'     => explode(' ', $pessoa['nome'])[0],
        /* Já é do movimento? Quem não é recebe o convite de /queroajudar. */
        'inscrito' => $pessoa['status'] !== '' || tem_conta($pessoa),
    ]);
}

/* ================= procurar quem é ================= */

if ($acao === 'procurar') {
    registrar_envio('presenca');  // a tentativa conta, ache ou não ache

    /* UMA fonte agora, e não três. Antes era preciso varrer presenças, inscrições
       e contas separadamente, porque a mesma pessoa vivia em três arquivos. */
    $candidatos = pessoas_por_telefone($telefone);

    if ($candidatos === []) {
        responder(200, ['ok' => true, 'achou' => 0]);
    }

    /* UM candidato: confirma na hora, sem mais uma tela. É o caso normal, e a
       pessoa está em pé na porta. */
    if (count($candidatos) === 1) {
        marcar($evento, $candidatos[0], $modo);
    }

    /* DOIS OU MAIS: um número de casa, um casal que divide o celular. Aí o nome
       completo aparece para a pessoa dizer qual é ela — sem isso não há como
       desempatar. É a troca aceita conscientemente: quem digitar um número
       alheio lê aqueles nomes, limitado pelo token do encontro e pelo teto. */
    responder(200, [
        'ok'    => true,
        'achou' => count($candidatos),
        'pessoas' => array_map(fn ($c) => [
            'ref'  => ref_de($telefone, $c['id']),
            'nome' => $c['nome'],
        ], $candidatos),
    ]);
}

/* ================= "sou este aqui" ================= */

if ($acao === 'confirmar') {
    $ref = limpar_texto($bruto['ref'] ?? '', 40);
    foreach (pessoas_por_telefone($telefone) as $p) {
        if (ref_de($telefone, $p['id']) === $ref) {
            marcar($evento, $p, $modo);
        }
    }
    recusar('Não achei esse cadastro. Preencha os dados abaixo.', 404);
}

/* ================= cadastro novo ================= */

/* ---------------- consentimento é obrigatório (LGPD) ---------------- */

if (($bruto['consentimento'] ?? false) !== true) {
    recusar('Falta concordar com o uso dos seus dados.');
}

$nome   = limpar_texto($bruto['nome'] ?? '', 80);
$bairro = limpar_texto($bruto['bairro'] ?? '', 60);
$cidade = cidade_valida($bruto['cidade'] ?? '');   // do catálogo, ou nada
$convidadoPor = limpar_texto($bruto['convidadoPor'] ?? '', 60);

$nome = preg_replace('/\s+/u', ' ', $nome) ?? $nome;

if (mb_strlen($nome) < 3) {
    recusar('Escreva seu nome.');
}
/* Os mesmos quatro obrigatórios do /queroajudar. Sem cidade não dá para separar
   quem veio de outro município, que é metade do valor da lista de um encontro
   no interior. */
if ($bairro === '' || $cidade === '') {
    recusar('Diga seu bairro e escolha sua cidade na lista.');
}

$pessoas = ler_pessoas();
$nova = [
    'id'       => novo_id_pessoa(),
    'nome'     => $nome,
    /* Eleitor: quem apareceu num encontro ainda não é militante. Vira quando
       assumir função — e a ponte para /queroajudar, no fim desta tela, é
       exatamente o convite para isso. */
    'tipo'     => 'eleitor',
    'telefone' => $telefone,
    'bairro'   => $bairro,
    'cidade'   => $cidade,
    'criadoEm' => date('c'),
    'consentimentoEm'     => date('c'),
    'consentimentoVersao' => VERSAO_CONSENTIMENTO_PRESENCA,
];
$pessoas[] = $nova;
if (!gravar_pessoas($pessoas)) {
    recusar('Não consegui guardar agora. Procure alguém da recepção.', 500);
}

/* Quem convidou fica na PRESENÇA, e não na pessoa: é informação daquele
   encontro. A mesma pessoa pode ter sido trazida por gente diferente. */
if ($convidadoPor !== '') {
    $presencas = ler_presencas();
    $presencas[] = [
        'id'       => novo_id_presenca(),
        'eventoId' => $evento['id'],
        'pessoaId' => $nova['id'],
        'convidadoPor' => $convidadoPor,
        'confirmou'  => true,
        'compareceu' => $modo === 'chegada',
        'origem'     => 'qr',
        'criadoEm'   => date('c'),
    ];
    if (!gravar_presencas($presencas)) {
        recusar('Não consegui guardar agora. Procure alguém da recepção.', 500);
    }
    registrar_envio('presenca');
    responder(200, ['ok' => true, 'jaEstava' => false, 'nome' => explode(' ', $nome)[0], 'inscrito' => false]);
}

marcar($evento, normalizar_pessoa($nova), $modo);
