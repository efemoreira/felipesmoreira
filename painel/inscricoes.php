<?php
declare(strict_types=1);

/**
 * Inscrições da militância — felipesmoreira.com/painel/inscricoes.php
 *
 * A fila de quem se inscreveu em /queroajudar. Aqui a coordenação lê a
 * inscrição, confere e decide: aprovar (vira acesso) ou recusar.
 *
 * Aprovar dá conta à ficha que já existe, com senha provisória e trocarSenha
 * ligado — quem entra é obrigado a definir a própria senha antes de abrir
 * qualquer área. A senha aparece uma vez só, junto de um botão que abre o
 * WhatsApp da pessoa com a mensagem pronta.
 *
 * ESTE ARQUIVO É SÓ A ROTA. O trabalho mora ao lado, na mesma divisão das
 * outras seis telas grandes:
 *
 *   inscricoes-acoes.php      o POST — aprovar e recusar
 *   inscricoes-tela.php       a tela: cabeçalho, panorama, abas e busca
 *   inscricoes-fila.php       a aba de trabalho: quem está esperando decisão
 *   inscricoes-decididas.php  a aba de arquivo: quem já foi decidida
 *   inscricoes-comum.php      o modelo — a fila, o placar, as áreas sugeridas
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/inscricoes-comum.php';
require_once __DIR__ . '/pessoas-comum.php';  // a fila é gente com status pendente
require_once __DIR__ . '/inscricoes-acoes.php';
require_once __DIR__ . '/inscricoes-tela.php';
exigir_area('inscricoes');

$eu = usuario_atual();

/* As ações vêm antes de qualquer leitura de tela: quando há uma, ela termina em
   `voltar()`, que manda o header e sai. */
tratar_acoes_de_inscricao($eu);

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

/* Some da sessão assim que for mostrado uma vez: senha provisória que fica na
   tela é senha que alguém lê por cima do ombro na segunda vez que ela abre. */
$acesso = $_SESSION['acesso_novo'] ?? null;
unset($_SESSION['acesso_novo']);

tela_de_inscricoes($erro, $ok, $acesso);
