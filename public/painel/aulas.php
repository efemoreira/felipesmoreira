<?php
declare(strict_types=1);

/**
 * Formação — felipesmoreira.com/painel/aulas
 *
 * O texto das aulas NÃO se edita aqui: ele é versionado no repositório
 * (aulas-conteudo.php), porque é a tradução do manual e muda por decisão da
 * coordenação, não no meio de uma terça-feira.
 *
 * A tela tem três abas — conteúdo, quem estudou e trilhas/prontidão. O porquê
 * da divisão está em `aulas-tela.php`.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/aulas-comum.php';
require_once __DIR__ . '/aulas-acoes.php';
require_once __DIR__ . '/aulas-tela.php';
exigir_area('aulas');

/* As ações vêm antes de qualquer leitura de tela: quando há uma, ela termina em
   `voltar()`, que manda o header e sai. */
tratar_acoes_de_aula();

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

tela_de_aulas($erro, $ok);
