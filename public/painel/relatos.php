<?php
declare(strict_types=1);

/**
 * Relatos e ideias do Paulo — felipesmoreira.com/painel/relatos
 *
 * O que chega pelo WhatsApp e não é inscrição: o relato (compra de voto,
 * segurança, problema do bairro, reclamação sobre a equipe) e a ideia. O
 * protocolo nasce no Paulo; o andamento e a resposta se decidem aqui, e o
 * Paulo os relê para responder a quem perguntar. Área da Coordenação.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/relatos-comum.php';
require_once __DIR__ . '/relatos-acoes.php';
require_once __DIR__ . '/relatos-tela.php';
exigir_area('relatos');

$eu = usuario_atual() ?? [];

tratar_acoes_de_relato($eu);

['erro' => $erro, 'ok' => $ok] = recado_pendente();

tela_de_relatos($eu, $erro, $ok);
