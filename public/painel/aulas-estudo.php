<?php
declare(strict_types=1);

/**
 * ACOMPANHAMENTO DE ESTUDO — quem começou, quem travou, quem já fechou.
 *
 * Esta era a tabelinha no fim de `/painel/aulas`, embaixo de trinta e duas
 * fichas de vídeo: para chegar nela alguém rolava a tela inteira, e ela dizia
 * só "12 de 32 · 37%". Percentual de currículo não é resposta operacional — não
 * separa quem está andando devagar de quem parou em maio.
 *
 * A pergunta desta aba é **quem precisa de um empurrão hoje**, e a resposta vem
 * em duas listas: a fila de quem travou (o trabalho) e a base inteira (o
 * contexto). Nenhuma delas inventa carimbo: os estados saem de
 * `retrato_de_estudo()`, que só lê o que o progresso já grava.
 */

require_once __DIR__ . '/aulas-comum.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sessao.php';

function bloco_acompanhamento(string $buscaAu): void
{
    $gente = quem_estuda();
    if ($buscaAu !== '') {
        $gente = array_values(array_filter(
            $gente,
            fn ($p) => combina_com([$p['nome'], $p['usuario'], $p['cidade'] ?? ''], $buscaAu)
        ));
    }

    $retratos = [];
    $placar = ['travada' => 0, 'sem-comecar' => 0, 'andando' => 0, 'rapidas-ok' => 0];
    foreach ($gente as $p) {
        $r = retrato_de_estudo($p['id']);
        $retratos[$p['id']] = $r;
        $placar[$r['estado']]++;
    }

    /* A ordem é a da urgência, e não a alfabética: quem travou primeiro, quem
       nunca começou depois, e quem está andando por último. Ordenar por nome
       faria a fila de trabalho depender da inicial de quem precisa de ajuda. */
    $peso = ['travada' => 0, 'sem-comecar' => 1, 'andando' => 2, 'rapidas-ok' => 3];
    usort($gente, function ($a, $b) use ($retratos, $peso) {
        $pa = $peso[$retratos[$a['id']]['estado']];
        $pb = $peso[$retratos[$b['id']]['estado']];
        if ($pa !== $pb) {
            return $pa <=> $pb;
        }
        /* Dentro de "travada", a mais parada primeiro. */
        return ($retratos[$b['id']]['dias'] ?? -1) <=> ($retratos[$a['id']]['dias'] ?? -1);
    });
    ?>
  <fieldset id="placar">
    <legend>Como está a formação do time</legend>
    <p class="dica" style="margin:0 0 14px">
      Conta quem tem conta ativa e aprovada — estudar não pede permissão de área.
      <strong>Travou</strong> é quem começou, ainda não fechou as Pistas Rápidas e
      não conclui nada há mais de <?= DIAS_PARA_TRAVAR ?> dias.
    </p>
    <div class="rolagem cartoes">
      <table class="tabela">
        <thead><tr><th>Travaram</th><th>Não começaram</th><th>Andando</th><th>Rápidas completas</th></tr></thead>
        <tbody>
          <tr>
            <td class="terco" data-rotulo="Travaram"><strong><?= $placar['travada'] ?></strong></td>
            <td class="terco" data-rotulo="Não começaram"><strong><?= $placar['sem-comecar'] ?></strong></td>
            <td class="terco" data-rotulo="Andando"><strong><?= $placar['andando'] ?></strong></td>
            <td class="terco" data-rotulo="Rápidas completas"><strong><?= $placar['rapidas-ok'] ?></strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </fieldset>

  <fieldset id="quem">
    <legend>Quem estudou (<?= count($gente) ?>)</legend>

    <?php if ($gente === []): ?>
      <?php nada_encontrado(
          $buscaAu,
          '/painel/aulas.php?aba=estudo',
          'Ninguém com conta aprovada ainda. Quem aparece aqui entra por /painel/inscricoes.'
      ); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Quem</th><th>Como está</th><th>Pistas Rápidas</th><th>Última aula</th></tr>
          </thead>
          <tbody>
          <?php foreach ($gente as $p): ?>
            <?php
              $r = $retratos[$p['id']];
              $selo = match ($r['estado']) {
                  'travada'     => 'selo-off',
                  'sem-comecar' => 'selo-cinza',
                  'rapidas-ok'  => 'selo-ok',
                  default       => 'selo-atencao',
              };
            ?>
            <tr>
              <td>
                <strong><?= h($p['nome']) ?></strong><br>
                <span class="dica"><?= h($p['usuario']) ?></span>
              </td>
              <td class="meia" data-rotulo="Como está">
                <span class="selo <?= $selo ?>"><?= h(ESTADOS_DE_ESTUDO[$r['estado']]) ?></span>
              </td>
              <td class="meia" data-rotulo="Pistas Rápidas">
                <?= $r['rapidasFeitas'] ?> de <?= $r['rapidas'] ?>
              </td>
              <td data-rotulo="Última aula">
                <?php if ($r['dias'] === null): ?>
                  <span class="dica">nunca abriu uma</span>
                <?php elseif ($r['dias'] === 0): ?>
                  hoje
                <?php else: ?>
                  há <?= $r['dias'] ?> <?= $r['dias'] === 1 ? 'dia' : 'dias' ?>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>
    <?php
}
