<?php
declare(strict_types=1);

/**
 * O que andou acontecendo — a aba Atividade de `/painel/leituras`.
 *
 * A linha do tempo inteira, com recorte por área e busca. O Início mostra as
 * três últimas e "ver tudo" para cá: lá é contexto de quem vai trabalhar,
 * aqui é leitura de quem quer saber o que o time fez na semana.
 *
 * Continua derivada dos carimbos que já existem — `linha_do_tempo()` em
 * `atividade-comum.php`. Não há arquivo de log, e não vai haver: a regra de
 * 29/08 permanece. A permissão recorta do mesmo jeito que no Início: quem não
 * abre Pessoas não vê quem entrou no cadastro.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/atividade-comum.php';

/** Teto da lista. A busca alcança o resto; a legenda conta o total. */
const TETO_ATIVIDADE_LEITURA = 50;

function aba_de_atividade(): void
{
    $busca = limpar_texto($_GET['q'] ?? '', 60);
    $areaF = (string) ($_GET['area'] ?? '');
    if (!isset(AREAS[$areaF])) {
        $areaF = '';
    }

    /* Tudo, e o recorte depois: o teto é da tela, não da derivação. */
    $todas = linha_do_tempo(null, PHP_INT_MAX);
    $porArea = [];
    foreach ($todas as $l) {
        $porArea[$l['area']] = ($porArea[$l['area']] ?? 0) + 1;
    }

    $visiveis = $todas;
    if ($areaF !== '') {
        $visiveis = array_values(array_filter($visiveis, fn ($l) => $l['area'] === $areaF));
    }
    if ($busca !== '') {
        $visiveis = array_values(array_filter($visiveis, fn ($l) => combina_com([$l['texto'], $l['quem']], $busca)));
    }
    $mostradas = array_slice($visiveis, 0, TETO_ATIVIDADE_LEITURA);

    $opcoesArea = [];
    foreach ($porArea as $a => $n) {
        $opcoesArea[$a] = (AREAS[$a] ?? $a) . ' (' . $n . ')';
    }
    ?>
    <fieldset>
      <legend>O que andou acontecendo (<?= count($visiveis) ?><?= count($visiveis) !== count($todas) ? ' de ' . count($todas) : '' ?>)</legend>

      <?php if ($todas === []): ?>
        <p class="dica colado">Nada gravado ainda nas áreas que você abre.</p>
      <?php else: ?>
        <?php barra_filtros(
            [
                ['tipo' => 'busca', 'valor' => $busca, 'dica' => 'o que aconteceu, ou quem fez'],
                ['tipo' => 'escolha', 'nome' => 'area', 'rotulo' => 'Área',
                 'valor' => $areaF, 'vazio' => 'todas', 'opcoes' => $opcoesArea],
            ],
            $busca !== '' || $areaF !== '',
            '/painel/leituras.php?aba=atividade',
            ['aba' => 'atividade']
        ); ?>

        <?php if ($mostradas === []): ?>
          <?php nada_encontrado($busca, '/painel/leituras.php?aba=atividade', 'Nada com esse recorte.'); ?>
        <?php else: ?>
          <ul class="tempo">
            <?php foreach ($mostradas as $l): ?>
              <li>
                <a href="<?= h($l['url']) ?>">
                  <span class="tempo-quando"><?= h(ha_quanto_tempo($l['quando'])) ?></span>
                  <span class="tempo-icone"><?= icone(ICONE_AREA[$l['area']] ?? 'star', 16) ?></span>
                  <span class="tempo-texto">
                    <?= h($l['texto']) ?><?php if ($l['quem'] !== ''): ?><span class="tempo-quem"> · <?= h($l['quem']) ?></span><?php endif; ?>
                  </span>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
          <?php if (count($visiveis) > count($mostradas)): ?>
            <p class="dica" style="margin:12px 0 0">
              As <?= count($mostradas) ?> mais recentes. Para chegar ao resto, procure por
              nome ou recorte por área.
            </p>
          <?php endif; ?>
        <?php endif; ?>
      <?php endif; ?>
    </fieldset>
    <?php
}
