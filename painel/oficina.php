<?php
declare(strict_types=1);

/**
 * A Oficina — felipesmoreira.com/painel/oficina
 *
 * Rota fina: exige a área, trata o POST e desenha. A regra e o modelo moram em
 * `oficina-comum.php`; o catálogo de formatos, em `oficina-catalogo.php`.
 *
 * `exigir_area()`, e não `exigir_admin()`, de propósito: a Oficina é pessoal,
 * mas não é do administrador — cada um que a recebe tem a sua, e quem a
 * concede é a administração, pela capacidade Criação. As duas coisas são
 * diferentes, e confundi-las faria a segunda pessoa a entrar no desafio ver a
 * oficina do primeiro.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/oficina-comum.php';
require_once __DIR__ . '/oficina-acoes.php';
require_once __DIR__ . '/oficina-tela.php';

exigir_area('oficina');

$eu = usuario_atual() ?? [];

tratar_acoes_de_oficina($eu);

['erro' => $erro, 'ok' => $ok] = recado_pendente();

tela_de_oficina($erro, $ok, $eu);
