<?php
declare(strict_types=1);

/**
 * A tela da Munição — duas abas, dois ritmos.
 *
 *   mutirao   a semana: escolher a peça, escalar, cobrar quem não postou
 *   pecas     o acervo: criar, corrigir, publicar, recolher
 *
 * Eram um bloco em cima do outro na mesma página. O mutirão é rotina de
 * segunda-feira e o catálogo se edita de vez em quando — e quem vinha escalar
 * a semana rolava o acervo inteiro para chegar ao botão. Abre no Mutirão
 * porque é o trabalho; as Peças são o que o trabalho usa.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/municao-mutirao.php';
require_once __DIR__ . '/municao-pecas.php';

function tela_de_municao(?string $erro, ?string $ok): void
{
    $abas = [
        'mutirao' => ['nome' => 'Mutirão da semana'],
        'pecas'   => ['nome' => 'Peças', 'conta' => count(ler_pecas())],
    ];
    /* O contador do mutirão é "postaram de escalados", que a aba fechada
       precisa dizer: é a pergunta da semana, e responde-la sem abrir a aba é o
       que o número está ali para fazer. */
    $m = mutirao_da_semana();
    if ($m['peca'] !== null) {
        $abas['mutirao']['conta'] = count(array_filter($m['escalados'], fn ($e) => $e === 'postou')) . '/' . count($m['escalados']);
    }
    $aba = (string) ($_GET['aba'] ?? '');
    /* `?editar=` e `?novo=` são da aba Peças: um link antigo sem `aba=` cai nela. */
    if (!isset($abas[$aba])) {
        $aba = isset($_GET['editar']) || isset($_GET['novo']) ? 'pecas' : 'mutirao';
    }

    abrir_pagina('Munição');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Munição',
      'As peças que o militante manda no grupo: um número do plano, com a página, '
      . 'mais o texto pronto e a arte. Peça sem fonte não entra.',
      null,
      '/painel/municao',
      [
          'Mutirão da semana: escolher a peça, escalar todo mundo que tem conta e cobrar quem não postou.',
          'Peças: criar a da semana — o número que saiu agora, sem esperar deploy — e corrigir as que já existem.',
          'Corrigir uma peça: o texto muda, o endereço dela não — o link já circula no grupo.',
          'Publicar e recolher: só o que está no ar aparece no site, em /municao.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php barra_abas($abas, $aba, 'aba', 'Munição'); ?>

  <?php if ($aba === 'mutirao'): ?>
    <?php aba_de_mutirao(); ?>
  <?php else: ?>
    <?php aba_de_pecas(); ?>
  <?php endif; ?>
</div>
<?php
    fechar_pagina();
}
