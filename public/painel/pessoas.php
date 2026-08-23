<?php
declare(strict_types=1);

/**
 * Pessoas — felipesmoreira.com/painel/pessoas
 *
 * Todo mundo do movimento numa lista só: quem tem conta, quem se inscreveu, quem
 * apareceu num encontro e quem é candidato. Antes eram quatro cadastros que não
 * se conheciam, e não dava para responder as perguntas óbvias — "em que
 * encontros o Fulano esteve?", "esse número já é do time?", "quem está
 * duplicado?".
 *
 * **Só a capacidade de administração entra.** É a tela com telefone, e-mail e
 * endereço de todo mundo: acesso a dado pessoal não acompanha o trabalho do dia,
 * acompanha a responsabilidade sobre ele.
 *
 * ESTE ARQUIVO É SÓ A ROTA: ele monta o recorte da lista e entrega para quem
 * desenha. O trabalho mora ao lado:
 *
 *   pessoas-acoes.php   o POST — cadastrar, editar, dar conta, juntar, apagar
 *   pessoas-lista.php   a tela: cabeçalho, abas por tipo, a lista e os modais
 *   pessoas-ficha.php   uma pessoa: o formulário, a ficha aberta, as duplicatas
 *   pessoas-comum.php   o que se pergunta depois: duplicatas, fusão, a fila
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/pessoas-comum.php';
require_once __DIR__ . '/eventos-comum.php';   // em que encontros ela esteve
require_once __DIR__ . '/inscricoes-comum.php'; // nome_funcao()
require_once __DIR__ . '/pessoas-acoes.php';
require_once __DIR__ . '/pessoas-lista.php';   // puxa o pessoas-ficha.php junto
exigir_area('pessoas');

/* As ações vêm antes de qualquer leitura de tela: quando há uma, ela termina em
   `voltar()`, que manda o header e sai. */
tratar_acoes_de_pessoa();

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$senhaNova = $_SESSION['senha_nova'] ?? null;
unset($_SESSION['senha_nova']);

tela_de_pessoas($erro, $ok, $senhaNova);
