<?php
declare(strict_types=1);

/**
 * O caixa — felipesmoreira.com/painel/caixa
 *
 * Rota fina: exige a área, trata o POST e desenha. A regra e o modelo moram em
 * `caixa-comum.php`, e é lá que está escrito por que a fronteira jurídica NÃO
 * é decidida aqui.
 *
 * `caixa` só existe dentro de `adm`, pela mesma razão de `pessoas`: acesso a
 * dinheiro não acompanha o trabalho do dia, acompanha a responsabilidade sobre
 * ele.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/caixa-comum.php';
require_once __DIR__ . '/eventos-comum.php';  // amarrar o lançamento a um encontro
require_once __DIR__ . '/caixa-acoes.php';
require_once __DIR__ . '/caixa-tela.php';

exigir_area('caixa');

tratar_acoes_de_caixa(usuario_atual() ?? []);

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);

tela_de_caixa(
    ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null,
    ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null
);
