<?php
declare(strict_types=1);

/**
 * O encontro como degrau — a aba Encontros de `/painel/leituras`.
 *
 * Por encontro que já aconteceu: confirmaram → vieram → se inscreveram →
 * aprovadas → voltaram. "Voltaram" é quem apareceu num encontro posterior, e
 * é o degrau que decide: encontro que enche e ninguém volta gerou volume, não
 * base. A conta é `funil_de_encontros()`, em leituras-comum.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/leituras-comum.php';

function aba_de_encontros(array $linhas): void
{
    $soma = ['confirmaram' => 0, 'vieram' => 0, 'inscreveram' => 0, 'aprovadas' => 0, 'voltaram' => 0];
    foreach ($linhas as $l) {
        foreach ($soma as $k => $_) {
            $soma[$k] += $l[$k];
        }
    }
    ?>
    <fieldset>
      <legend>Conversão por encontro (<?= count($linhas) ?>)</legend>

      <?php if ($linhas === []): ?>
        <p class="dica" style="margin:0">
          Nenhum encontro realizado com presença registrada ainda. Quando a Recepção
          marcar quem veio, esta aba mostra o que cada encontro gerou.
        </p>
      <?php else: ?>
        <dl class="resumo-numeros">
          <div><dt>Vieram</dt><dd><?= $soma['vieram'] ?></dd></div>
          <div><dt>Se inscreveram</dt><dd><?= $soma['inscreveram'] ?></dd></div>
          <div><dt>Aprovadas</dt><dd><?= $soma['aprovadas'] ?></dd></div>
          <div><dt>Voltaram</dt><dd><?= $soma['voltaram'] ?></dd></div>
        </dl>
        <p class="dica" style="margin:0 0 14px">
          <strong>Voltaram</strong> é quem apareceu num encontro depois deste — o único
          degrau que não depende de a pessoa dizer nada. Encontro que enche e ninguém
          volta gerou volume, não base.
        </p>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead>
              <tr><th>Encontro</th><th>Confirmaram</th><th>Vieram</th><th>Inscreveram</th><th>Aprovadas</th><th>Voltaram</th></tr>
            </thead>
            <tbody>
              <?php foreach ($linhas as $l): ?>
                <?php $e = $l['evento']; ?>
                <tr>
                  <td>
                    <a href="/painel/eventos.php?e=<?= h(rawurlencode($e['id'])) ?>"><?= h($e['titulo']) ?></a>
                    <br><span class="dica"><?= h(trim($e['data'] . ' ' . $e['hora'])) ?><?= $e['local'] !== '' ? ' · ' . h($e['local']) : '' ?></span>
                  </td>
                  <td class="terco" data-rotulo="Confirmaram"><?= $l['confirmaram'] ?></td>
                  <td class="terco" data-rotulo="Vieram"><?= $l['vieram'] ?></td>
                  <td class="terco" data-rotulo="Inscreveram"><?= $l['inscreveram'] ?></td>
                  <td class="meia" data-rotulo="Aprovadas"><?= $l['aprovadas'] ?></td>
                  <td class="meia" data-rotulo="Voltaram">
                    <strong><?= $l['voltaram'] ?></strong>
                    <?php if ($l['vieram'] > 0): ?>
                      <span class="dica">· <?= (int) round($l['voltaram'] * 100 / $l['vieram']) ?>%</span>
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
