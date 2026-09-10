<?php
declare(strict_types=1);

/**
 * A tela das Leituras — quatro abas, uma pergunta cada.
 *
 *   origem      de onde vem a militância, e o que converte
 *   territorio  onde ela mora, e onde já dá para montar um time
 *   semana      a operação hoje, o mutirão, os caixas
 *   atividade   o que andou acontecendo, inteiro e com busca
 *
 * Nenhuma delas grava nada. É a mesa de olhar, por oposição às mesas de fazer —
 * e é semanal: quem abre aqui na segunda decide onde pôr esforço na semana.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/leituras-comum.php';
require_once __DIR__ . '/leituras-origem.php';
require_once __DIR__ . '/leituras-territorio.php';
require_once __DIR__ . '/leituras-semana.php';
require_once __DIR__ . '/leituras-atividade.php';

function tela_de_leituras(array $eu): void
{
    $pessoas = ler_pessoas();
    $origens = funil_de_origens($pessoas);
    $regioes = militancia_por_regiao($pessoas);

    $abas = [
        /* O contador é o número de ORIGENS, e não de pessoas: a pergunta da
           aba é "por quantos caminhos a militância está chegando". */
        'origem'     => ['nome' => 'Origem',     'conta' => count($origens['linhas'])],
        'territorio' => ['nome' => 'Território', 'conta' => count($regioes)],
        'semana'     => ['nome' => 'Semana'],
        'atividade'  => ['nome' => 'Atividade'],
    ];
    $aba = (string) ($_GET['aba'] ?? '');
    if (!isset($abas[$aba])) {
        $aba = 'origem';
    }

    /* Como esta tela escreve uma data — a mesma forma da tela de inscrições,
       de onde a aba de origem veio. */
    $formatar = function (string $iso): string {
        if ($iso === '') {
            return '';
        }
        $t = strtotime($iso);
        return $t ? date('d/m/Y \à\s H:i', $t) : '';
    };

    abrir_pagina('Leituras');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Leituras',
      'O que a coordenação olha na semana: de onde vem a militância, onde ela mora, o que venceu e o que andou acontecendo.',
      null,
      null,
      [
          'Origem: das pessoas que cada link trouxe, quantas viraram militante. A ordem é por quem militou, não por volume.',
          'Território: só quem já foi aprovado, por cidade e bairro — onde já dá para montar time, e quem está sozinha.',
          'Semana: os medidores do time inteiro, o mutirão e, para quem administra, os caixas.',
          'Atividade: a linha do tempo inteira, com busca e recorte por área. É derivada do que já está gravado — não há registro de auditoria por trás.',
          'Aqui não se grava nada. Cada linha leva à mesa onde se faz.',
      ]
  ); ?>

  <?php barra_abas($abas, $aba, 'aba', 'Leituras'); ?>

  <?php
  if ($aba === 'origem') {
      aba_de_origem($origens, $formatar);
  } elseif ($aba === 'territorio') {
      aba_de_territorio($regioes);
  } elseif ($aba === 'semana') {
      aba_da_semana($eu);
  } else {
      aba_de_atividade();
  }
  ?>
</div>
<?php
    fechar_pagina();
}
