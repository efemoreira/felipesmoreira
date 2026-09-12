<?php
declare(strict_types=1);

/**
 * Onde a militância mora — a aba Território de `/painel/leituras`.
 *
 * Era um `<details>` recolhido em `/painel/inscricoes`, chamado "Onde a
 * militância mora". A pergunta dele não é de quem aprova: é de quem decide
 * onde já dá para montar um time próprio, onde há gente isolada, e onde um
 * encontro deveria ser presencial em vez de mutirão digital. Leitura de
 * expansão, semanal — e por isso mora aqui.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/leituras-comum.php';

/** @param array $regioes o que `militancia_por_regiao()` devolveu */
function aba_de_territorio(array $regioes): void
{
    $gente = array_sum(array_column($regioes, 'total'));
    $sozinhas = count(array_filter($regioes, fn ($r) => $r['total'] === 1));
    ?>
    <fieldset>
      <legend>Onde a militância mora (<?= count($regioes) ?> <?= count($regioes) === 1 ? 'cidade' : 'cidades' ?>)</legend>

      <?php if ($regioes === []): ?>
        <p class="dica colado">
          Ninguém aprovado com cidade ainda. Quando a fila começar a ser decidida, esta aba
          mostra onde a militância está.
        </p>
      <?php else: ?>
        <dl class="resumo-numeros">
          <div><dt>Gente aprovada com cidade</dt><dd><?= $gente ?></dd></div>
          <div><dt>Cidades</dt><dd><?= count($regioes) ?></dd></div>
          <div><dt>Com uma pessoa só</dt><dd><?= $sozinhas ?></dd></div>
        </dl>
        <p class="dica folga">
          Só quem já foi aprovado. Cidade com mais gente primeiro: é por aqui que dá para
          ver onde já tem time para um núcleo próprio — e quem está sozinha na cidade dela,
          que é quem um encontro presencial mais ajuda.
        </p>
        <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Cidade</th><th>Gente</th><th>Bairros</th></tr>
          </thead>
          <tbody>
            <?php foreach ($regioes as $r): ?>
              <tr>
                <td class="meia" data-rotulo="Cidade"><strong><?= h($r['cidade']) ?></strong></td>
                <td class="meia" data-rotulo="Gente"><?= (int) $r['total'] ?></td>
                <td data-rotulo="Bairros">
                  <?php if ($r['bairros'] === []): ?>
                    <span class="selo selo-cinza">sem bairro informado</span>
                  <?php else: ?>
                    <?php foreach ($r['bairros'] as $b): ?>
                      <span class="selo"><?= h($b['nome']) ?> · <?= (int) $b['total'] ?></span>
                    <?php endforeach; ?>
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
