<?php
declare(strict_types=1);

/**
 * Produção — felipesmoreira.com/painel/producao
 *
 * O quadro que substitui o Trello: A fazer → Fazendo → Revisão → Publicado.
 * Card nasce do fato aprovado na Checagem, já com fonte e responsável colados.
 *
 * Sem arrastar e soltar de propósito: a maioria do time abre isto no celular,
 * onde arrastar entre quatro colunas é briga com a rolagem da página. Botão
 * funciona no dedo, no teclado e no leitor de tela.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/producao-acoes.php';
require_once __DIR__ . '/producao-tela.php';
exigir_area('producao');

$eu = usuario_atual();

/* As ações vêm antes de qualquer leitura de tela: quando há uma, ela termina em
   `voltar()`, que manda o header e sai. */
tratar_acoes_de_card($eu);

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

tela_de_producao($eu, $erro, $ok);
