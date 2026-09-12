<?php
declare(strict_types=1);

/**
 * Leituras — felipesmoreira.com/painel/leituras
 *
 * A mesa de olhar. Só GET: não há `-acoes.php` porque não há ação — leitura
 * que grava é mesa disfarçada. O que aparece aqui saiu de onde estava
 * pendurado (a aba "De onde vêm" em Inscrições, o `<details>` de região, a
 * grade de medidores do Início, a linha do tempo inteira) e ganhou endereço.
 *
 *   leituras-comum.php       o placar, o funil e a região (derivados)
 *   leituras-tela.php        a moldura e as abas
 *   leituras-origem.php      de onde vem a militância
 *   leituras-territorio.php  onde ela mora
 *   leituras-semana.php      a operação hoje, o mutirão, os caixas
 *   leituras-atividade.php   o que andou acontecendo
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/leituras-acoes.php';
require_once __DIR__ . '/leituras-tela.php';
exigir_area('leituras');

tratar_acoes_de_leituras();

tela_de_leituras(usuario_atual() ?? []);
