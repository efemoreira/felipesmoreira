<?php
declare(strict_types=1);

/**
 * A ponte entre o teste (Node) e as funções do painel (PHP).
 *
 * Lê do stdin um JSON `[{"fn": "...", "args": [...]}, …]` e escreve no stdout
 * um JSON com o resultado de cada chamada, na mesma ordem. Uma chamada de
 * processo por LOTE, e não por caso: o custo de subir o PHP é o que domina, e
 * um teste que demora vira um teste que ninguém roda.
 *
 * A LISTA DE FUNÇÕES É EXPLÍCITA. Isto aqui roda `call_user_func` com nome
 * vindo de um arquivo: aceitar qualquer nome transformaria o teste numa porta
 * para executar o que estiver carregado. Só entram funções PURAS — as que têm
 * um espelho do outro lado e que é justamente o que se quer comparar.
 *
 * Roda em CLI e nunca em produção: fica em `testes/`, fora de `public/`, e
 * recebe por argumento o painel de mentira que o `sandbox.ts` montou.
 */

/* A raiz do painel vem de fora: o teste monta uma cópia num diretório
   temporário, com os catálogos ao lado como o `publish.yml` faz em produção.
   Apontar para `public/painel` da árvore de trabalho faria o painel gravar
   dentro do repositório — e leria um catálogo que num checkout limpo não
   existe, que é como `cidade_valida()` passa a aceitar qualquer grafia. */
$raiz = $argv[1] ?? '';
if ($raiz === '' || !is_dir($raiz)) {
    fwrite(STDERR, "ponte.php: passe a raiz do painel como primeiro argumento\n");
    exit(1);
}
require_once $raiz . '/sessao.php';
require_once $raiz . '/agenda-comum.php';
require_once $raiz . '/inscricoes-comum.php';
require_once $raiz . '/producao-comum.php';
require_once $raiz . '/trilhas.php';

/** As funções que o teste pode chamar, e só elas. */
const PONTES = [
    'sem_acento',
    'so_digitos',
    'limpar_texto',
    'combina_com',
    'normalizar_origem',
    'estado_do_evento',
    'dias_ate_o_dia',
    'apelido',
    'nome_de_arquivo',
    'cidade_valida',
    'telefone_bonito',
    'numero_whatsapp',
    'numero_whatsapp_outro',
    'recusa_de_inscricao',
    'trilha_da_funcao',
    'semana_de',
    'dia_de',
    'periodo_da_semana',
];

$entrada = json_decode((string) file_get_contents('php://stdin'), true);
if (!is_array($entrada)) {
    fwrite(STDERR, "ponte.php: esperava um JSON de chamadas no stdin\n");
    exit(1);
}

$saida = [];
foreach ($entrada as $chamada) {
    $fn = (string) ($chamada['fn'] ?? '');
    if (!in_array($fn, PONTES, true)) {
        fwrite(STDERR, "ponte.php: função fora da lista: {$fn}\n");
        exit(1);
    }
    try {
        $saida[] = ['ok' => true, 'valor' => call_user_func_array($fn, (array) ($chamada['args'] ?? []))];
    } catch (Throwable $e) {
        $saida[] = ['ok' => false, 'erro' => $e->getMessage()];
    }
}

echo json_encode($saida, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
