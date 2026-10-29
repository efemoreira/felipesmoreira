<?php
declare(strict_types=1);

/**
 * A porta do Paulo — felipesmoreira.com/painel/api/paulo.php
 *
 * SERVIDOR A SERVIDOR. Quem chama é o CRM onde o Paulo (o assistente do
 * WhatsApp) mora, nunca um navegador: por isso não há sessão, CSRF nem
 * `origem_confere()`. A autorização é a assinatura de `pedido_do_paulo()`
 * (paulo-comum.php). Assinatura que não confere recebe o mesmo 404 de um
 * endereço que não existe — como `escala.php`, dizer "assinatura errada" só
 * ensinaria quem está tentando.
 *
 * Tudo é POST de JSON com `acao`, e a assinatura cobre o corpo inteiro — um GET
 * com telefone na querystring deixaria o número no log de acesso do Apache.
 *
 *   situacao   {telefone}                         o que o Paulo pode saber da pessoa
 *   inscricao  {telefone, nome, cidade, bairro, …} a mesma inscrição do /queroajudar
 *   interesse  {telefone, unidade}                 o núcleo ou grupo que a pessoa quer (ela entra depois de ir a um encontro)
 *   relato     {protocolo, tipo, texto, …}         relato ou ideia, decidido em /painel/relatos
 *   andamento  {protocolos: [...]}                 o que a coordenação já decidiu de cada protocolo
 *
 * Erro esperado vem no corpo (`ok` + `estado`), com 200: é o contrato do painel
 * para o lado de lá decidir o que dizer, sem confundir "pessoa já inscrita" com
 * "servidor caiu".
 */

require_once __DIR__ . '/../paulo-comum.php';
require_once __DIR__ . '/../inscricoes-comum.php';
require_once __DIR__ . '/../organizacao-comum.php';
require_once __DIR__ . '/../relatos-comum.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function responder_paulo(int $status, array $corpo): never
{
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
    exit;
}

$corpo = (string) file_get_contents('php://input');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST'
    || strlen($corpo) > 20000
    || !pedido_do_paulo((string) ($_SERVER['HTTP_X_PAULO_HORA'] ?? ''), (string) ($_SERVER['HTTP_X_PAULO_ASSINATURA'] ?? ''), $corpo)) {
    responder_paulo(404, ['ok' => false]);
}

$dados = json_decode($corpo, true);
if (!is_array($dados)) {
    responder_paulo(400, ['ok' => false, 'estado' => 'corpo-invalido']);
}
$acao = (string) ($dados['acao'] ?? '');
$telefone = telefone_canonico((string) ($dados['telefone'] ?? ''));

if ($acao === 'situacao') {
    responder_paulo(200, ['ok' => true] + situacao_para_o_paulo(pessoa_do_whatsapp($telefone)));
}

if ($acao === 'inscricao') {
    /* A ficha que já existe com o mesmo celular em outra grafia (sem o 9, com
       55) é a mesma pessoa: a inscrição vai com o telefone DELA, para a régua
       de "mesmo telefone não entra duas vezes" reconhecer. */
    $ja = pessoa_do_whatsapp($telefone);
    $p = is_array($dados['participacao'] ?? null) ? $dados['participacao'] : [];
    /* O Paulo pergunta em texto livre; o que tem campo de texto na ficha vai
       para ele, e o resto vira uma linha legível em `habilidades`. */
    $extras = array_filter([
        limpar_texto($p['habilidades'] ?? '', 200),
        ($i = limpar_texto($p['interesses'] ?? '', 150)) !== '' ? 'Interesses: ' . $i : '',
        ($d = limpar_texto($p['disponibilidade'] ?? '', 100)) !== '' ? 'Disponibilidade: ' . $d : '',
    ]);
    $participacao = $p === [] ? null : [
        'profissao'   => $p['trabalho'] ?? '',
        'instituicao' => $p['instituicao'] ?? '',
        'habilidades' => implode(' · ', $extras),
    ];
    $feito = registrar_inscricao([
        'nome'      => limpar_texto($dados['nome'] ?? '', 80),
        'telefone'  => $ja['telefone'] ?? $telefone,
        'cidade'    => cidade_valida($dados['cidade'] ?? ''),
        'bairro'    => limpar_texto($dados['bairro'] ?? '', 60),
        'origem'    => normalizar_origem('paulo'),
        'interesse' => interesse_valido($dados['interesse'] ?? ''),
        'participacao' => $participacao,
        /* O consentimento foi dado na conversa, com a frase da pessoa guardada
           no CRM; aqui fica de onde ele veio. */
        'consentimentoVersao' => 'whatsapp-paulo',
    ]);
    responder_paulo(200, ['ok' => in_array($feito['estado'], ['nova', 'atualizada'], true)] + $feito);
}

if ($acao === 'interesse') {
    $unidade = interesse_valido($dados['unidade'] ?? '');
    if ($unidade === '') {
        responder_paulo(200, ['ok' => false, 'estado' => 'unidade-desconhecida']);
    }
    $ja = pessoa_do_whatsapp($telefone);
    if ($ja === null) {
        responder_paulo(200, ['ok' => false, 'estado' => 'sem-ficha']);
    }
    if (in_array($unidade, $ja['unidades'], true)) {
        responder_paulo(200, ['ok' => true, 'estado' => 'ja-faz-parte']);
    }
    /* Só o interesse. Pôr na unidade (`pertencer()`) é da coordenação ou de
       quem responde por ela, depois de a pessoa ir a um encontro. */
    $gravou = com_trava(ARQ_PESSOAS, function () use ($ja, $unidade): bool {
        $pessoas = ler_pessoas(true);
        foreach ($pessoas as &$p) {
            if ($p['id'] === $ja['id']) {
                $p['interesse'] = $unidade;
            }
        }
        unset($p);
        return gravar_pessoas($pessoas);
    });
    responder_paulo(200, ['ok' => $gravou, 'estado' => $gravou ? 'registrado' : 'erro']);
}

if ($acao === 'relato') {
    $anonimo = !empty($dados['anonimo']);
    $pessoa = $anonimo ? null : pessoa_do_whatsapp($telefone);
    $ok = receber_relato([
        'protocolo' => strtoupper((string) ($dados['protocolo'] ?? '')),
        'tipo'      => $dados['tipo'] ?? '',
        'categoria' => $dados['categoria'] ?? '',
        'tema'      => $dados['tema'] ?? '',
        'texto'     => $dados['texto'] ?? '',
        'local'     => $dados['local'] ?? '',
        'anonimo'   => $anonimo,
        'nome'      => $anonimo ? '' : ($pessoa['nome'] ?? limpar_texto($dados['nome'] ?? '', 80)),
        'telefone'  => $anonimo ? '' : $telefone,
        'pessoaId'  => $pessoa['id'] ?? '',
        'anexos'    => $dados['anexos'] ?? 0,
        'link'      => $dados['link'] ?? '',
    ]);
    responder_paulo(200, ['ok' => $ok, 'estado' => $ok ? 'registrado' : 'invalido']);
}

if ($acao === 'andamento') {
    $pedidos = array_slice(array_filter(is_array($dados['protocolos'] ?? null) ? $dados['protocolos'] : [], 'is_string'), 0, 200);
    $saida = [];
    foreach (ler_relatos() as $r) {
        if (in_array($r['protocolo'], $pedidos, true)) {
            /* A `nota` é interna e não sai. A `resposta` é para quem relatou. */
            $saida[] = ['protocolo' => $r['protocolo'], 'andamento' => $r['andamento'], 'resposta' => $r['resposta']];
        }
    }
    responder_paulo(200, ['ok' => true, 'protocolos' => $saida]);
}

responder_paulo(400, ['ok' => false, 'estado' => 'acao-desconhecida']);
