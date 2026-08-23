<?php
declare(strict_types=1);

/**
 * Fatos do dia — felipesmoreira.com/painel/fatos
 *
 * Duas telas num arquivo, porque são os dois lados da mesma mesa:
 *   1. o Olheiro preenche a Ficha de Fato;
 *   2. a Checagem abre o link e decide.
 *
 * Quem enxerga o quê é a permissão de sempre (a caixa marcada no usuário).
 * A separação aqui é de tarefa, não de sigilo: qualquer um que abre a área vê a
 * fila, porque entender o que está travando é metade do trabalho.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/fatos-comum.php';
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/fatos-acoes.php';
require_once __DIR__ . '/fatos-tela.php';
exigir_area('fatos');

$eu = usuario_atual();

/* As ações vêm antes de qualquer leitura de tela: quando há uma, ela termina em
   `voltar()`, que manda o header e sai. */
tratar_acoes_de_fato($eu);

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

/* O que foi digitado antes do erro: `formulario_fato()` o recebe e devolve o
   formulário preenchido, em vez de mandar a pessoa redigitar tudo. */
$rascunho = $_SESSION['rascunho_fato'] ?? [];
unset($_SESSION['rascunho_fato']);

tela_de_fatos($eu, $erro, $ok, $rascunho);
