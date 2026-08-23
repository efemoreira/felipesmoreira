<?php
declare(strict_types=1);

/**
 * Candidatos — felipesmoreira.com/painel/candidatos
 *
 * DUAS COISAS SEPARADAS, e é a separação que faz a tela funcionar:
 *
 *   1. **Cadastrar** quem é candidato — nome, número, @, foto. Rápido, sem
 *      decisão nenhuma junto: registrar o número é urgente, classificar não.
 *   2. **Montar listas** — "Deputados federais", "As mulheres da chapa", "Os
 *      que eu apoio". É a lista que vira colinha no site.
 *
 * A primeira versão obrigava a marcar grupos fixos na hora do cadastro. Estava
 * errada nos dois lados: atrapalhava o cadastro (que só quer o número certo) e
 * engessava as listas em categorias decididas no código, quando lista é
 * conteúdo de campanha e muda toda semana.
 *
 * ESTE ARQUIVO É SÓ A ROTA. O trabalho mora ao lado:
 *
 *   candidatos-acoes.php   o POST — cadastrar, publicar, recolher, montar lista
 *   candidatos-tela.php    a tela: as duas abas, o recorte e os seis modais
 *   candidatos-form.php    os dois formulários: o do candidato e o da lista
 *   candidatos-comum.php   o modelo: ler, gravar, as listas publicadas
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/candidatos-comum.php';
require_once __DIR__ . '/pessoas-comum.php';
require_once __DIR__ . '/agenda-comum.php';  // o pipeline de imagem (upload, corte, apagar)
require_once __DIR__ . '/candidatos-acoes.php';
require_once __DIR__ . '/candidatos-tela.php';   // puxa o candidatos-form.php junto
exigir_area('candidatos');

/* As ações vêm antes de qualquer leitura de tela: quando há uma, ela termina em
   `voltar()`, que manda o header e sai. */
tratar_acoes_de_candidato();

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

tela_de_candidatos($erro, $ok);
