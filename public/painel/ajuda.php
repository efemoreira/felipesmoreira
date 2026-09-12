<?php
declare(strict_types=1);

/**
 * Ajuda — felipesmoreira.com/painel/ajuda
 *
 * Uma página, gerada do que já existe: para cada área que a pessoa abre, as
 * três frases (`ajuda-comum.php`); e o glossário das distinções que
 * sustentam o painel. Existe porque a coordenação nova aprendia clicando —
 * "onde eu aprovo gente?" só se respondia abrindo tela por tela.
 *
 * Só desenha o que a pessoa pode abrir: ajuda sobre porta fechada é ruído.
 * Tela pessoal, não área: `exigir_login()` e pronto.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/ajuda-comum.php';
require_once __DIR__ . '/pessoas-comum.php';   // pode_liderar()
exigir_login();

$u = usuario_atual() ?? [];
$minhas = areas_do_usuario();

abrir_pagina('Ajuda');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Ajuda',
      'Cada tela em três frases — para que serve, quem abre, o que sai dela — e as palavras que o painel usa.'
  ); ?>

  <?php foreach (GRUPOS_NAV as $grupo => $areas): ?>
    <?php $areas = array_values(array_intersect($areas, $minhas)); ?>
    <?php if ($areas === []) continue; ?>
    <h2 class="secao"><?= h($grupo) ?></h2>
    <div class="ajuda-grade">
      <?php foreach ($areas as $area): $a = ajuda_da_area($area); ?>
        <article class="ajuda-cartao" id="<?= h($area) ?>">
          <h3><a href="<?= h(DESTINO_AREA[$area]['url']) ?>"><?= icone(ICONE_AREA[$area] ?? 'star', 18) ?> <?= h($a['nome']) ?></a></h3>
          <dl>
            <dt>Para que serve</dt><dd><?= h($a['serve']) ?></dd>
            <dt>Quem abre</dt><dd><?= h($a['abre']) ?></dd>
            <dt>O que sai daqui</dt><dd><?= h($a['sai']) ?></dd>
          </dl>
        </article>
      <?php endforeach; ?>
    </div>
  <?php endforeach; ?>

  <h2 class="secao">Suas telas</h2>
  <div class="ajuda-grade">
    <?php foreach (AJUDA_PESSOAL as $chave => $a): ?>
      <?php if ($chave === 'gente' && !pode_liderar($u)) continue; ?>
      <article class="ajuda-cartao" id="<?= h($chave) ?>">
        <h3><a href="/painel/<?= h($chave) ?>.php"><?= h($a['nome']) ?></a></h3>
        <dl>
          <dt>Para que serve</dt><dd><?= h($a['serve']) ?></dd>
          <dt>Quem abre</dt><dd><?= h($a['abre']) ?></dd>
          <dt>O que sai daqui</dt><dd><?= h($a['sai']) ?></dd>
        </dl>
      </article>
    <?php endforeach; ?>
  </div>

  <h2 class="secao" id="glossario">As palavras do painel</h2>
  <dl class="ajuda-glossario">
    <?php foreach (GLOSSARIO as [$termo, $texto]): ?>
      <dt><?= h($termo) ?></dt>
      <dd><?= h($texto) ?></dd>
    <?php endforeach; ?>
  </dl>
</div>
<?php
fechar_pagina();
