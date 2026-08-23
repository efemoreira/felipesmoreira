<?php
declare(strict_types=1);

/**
 * Agenda da Semana — felipesmoreira.com/painel/agenda.php
 *
 * Roda na hospedagem (PHP da Hostinger) e grava a agenda em
 * public_html/dados/agenda.json. Essa pasta NÃO está no repositório, então um
 * novo deploy pelo hPanel não apaga o que foi editado aqui.
 *
 * Quem entra e quem pode abrir esta página é assunto do sessao.php — daqui para
 * baixo só se cuida da agenda em si.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/agenda-comum.php';
require_once __DIR__ . '/eventos-comum.php';  // a lista da programação vem dos encontros
require_once __DIR__ . '/agenda-acoes.php';
require_once __DIR__ . '/agenda-tela.php';
exigir_area('agenda');

/* Ao contrário das outras telas, esta ação DEVOLVE estado em vez de sair: a
   capa é texto escrito à mão, e quando a gravação falha a tela tem de mostrar
   de volta o que foi digitado. Ver o cabeçalho de agenda-acoes.php. */
$r = tratar_acoes_de_agenda();

tela_de_agenda($r['aviso'], $r['sucesso'], $r['rascunho']);
