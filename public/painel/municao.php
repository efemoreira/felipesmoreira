<?php
declare(strict_types=1);

/**
 * Munição — felipesmoreira.com/painel/municao
 *
 * As peças que o militante compartilha: um número do plano com a página, o
 * texto pronto pra colar e a arte gerada no canvas do site. E o mutirão que as
 * espalha, semana a semana.
 *
 * Isto morava dentro do quadro de Produção, num <details> no meio das quatro
 * colunas — a ferramenta mais usada do movimento escondida atrás de um
 * triângulo, numa tela que fala de outra coisa. Virou área própria, com nome
 * próprio, no menu. Depois cresceu o mutirão em cima, e virou duas abas.
 *
 *   municao-acoes.php     o POST — peças e mutirão
 *   municao-tela.php      a moldura e as abas
 *   municao-mutirao.php   a aba Mutirão da semana
 *   municao-pecas.php     a aba Peças
 *   kit-comum.php         o modelo (o nome "kit" é contrato com api/kit.php)
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/kit-comum.php';
require_once __DIR__ . '/municao-acoes.php';
require_once __DIR__ . '/municao-tela.php';
exigir_area('municao');

$eu = usuario_atual();

/* As ações vêm antes de qualquer leitura de tela: quando há uma, ela termina em
   `voltar()`, que manda o header e sai. */
tratar_acoes_de_municao($eu ?? []);

['erro' => $erro, 'ok' => $ok] = recado_pendente();

tela_de_municao($erro, $ok);
