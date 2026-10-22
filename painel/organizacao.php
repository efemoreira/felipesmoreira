<?php
declare(strict_types=1);

/**
 * A organização permanente — felipesmoreira.com/painel/organizacao
 *
 * Rota fina: exige a área, trata o POST e desenha. O modelo e as regras do
 * plano (um tema, um grupo; ativo é quem entrega; a escada da Liga) moram em
 * `organizacao-comum.php`.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/organizacao-comum.php';
require_once __DIR__ . '/organizacao-acoes.php';
require_once __DIR__ . '/organizacao-tela.php';

exigir_area('organizacao');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && ($_GET['modelo-liga'] ?? '') === '1') {
    baixar_modelo_csv_da_liga();
}

tratar_acoes_de_organizacao(usuario_atual() ?? []);

['erro' => $erro, 'ok' => $ok] = recado_pendente();

tela_de_organizacao($erro, $ok);
