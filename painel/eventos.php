<?php
declare(strict_types=1);

/**
 * Encontros — felipesmoreira.com/painel/eventos
 *
 * ESTE ARQUIVO É SÓ A ROTA. Ele decide qual das duas telas desenhar e sai do
 * caminho; quem faz o trabalho mora ao lado:
 *
 *   eventos-acoes.php     o POST — criar, marcar, confirmar, escalar, apagar
 *   eventos-lista.php     a lista de encontros (próximos · já aconteceram)
 *   eventos-encontro.php  um encontro aberto: moldura, resumo, abas, Preparo
 *   eventos-presenca.php  a aba Pessoas — a lista de presença e o funil
 *   eventos-dados.php     a aba Dados — o formulário do encontro
 *   eventos-comum.php     o modelo: ler, gravar, publicar, o funil, os prazos
 *
 * Eram 1.400 linhas num arquivo só — quatrocentas de decisão coladas em
 * setecentas de desenho, na tela mais usada do movimento. Mexer no formulário
 * de dados obrigava a rolar por toda a lista de presença, e qualquer conserto
 * na gravação passava a milímetros do HTML. A divisão é por RESPONSABILIDADE,
 * não por tamanho: cada arquivo responde uma pergunta inteira.
 *
 * A permissão continua dividida por natureza da ação, não por cargo:
 *   quem tem 'eventos' executa (marca checklist, confirma presença, cadastra
 *   quem chegou);
 *   quem tem 'agenda' decide (cria, cancela) e vê a lista inteira com telefone.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/eventos-comum.php';
require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao(), para rotular quem é do time
require_once __DIR__ . '/eventos-acoes.php';
require_once __DIR__ . '/eventos-lista.php';
require_once __DIR__ . '/eventos-encontro.php';
exigir_area('eventos');

$eu = usuario_atual();
$coordena = pode('agenda');

/* As ações vêm ANTES de qualquer leitura de estado de tela: quando há uma, ela
   termina em `voltar()`, que manda o header e sai — calcular a tela primeiro
   seria trabalho jogado fora em toda gravação. */
tratar_acoes_de_evento($eu, $coordena);

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$aberto = achar_evento(limpar_texto($_GET['e'] ?? '', 40));

if ($aberto === null) {
    tela_lista_de_encontros($coordena, $eu, $erro, $ok);
} else {
    tela_do_encontro($aberto, $eu, $coordena, $erro, $ok);
}
