<?php
declare(strict_types=1);

/**
 * O QUE JÁ FOI DECIDIDO: checados, pendentes e arquivados.
 *
 * Separado da fila porque responde outra pergunta. A fila pergunta *o que falta
 * decidir*; este bloco é o REGISTRO do que a Checagem viu — é dele que sai a
 * resposta para "o que foi feito com aquele fato", e é por isso que ficha
 * decidida não se corrige por baixo nem se apaga.
 *
 * As listas são fatiadas em 15, e o recorte da busca acontece ANTES do corte:
 * filtrar depois procuraria só dentro do que coube na tela, que é justamente
 * onde o fato procurado não está.
 */

require_once __DIR__ . '/fatos-comum.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/sessao.php';

/**
 * Os três blocos do registro.
 *
 * `saidas_do_fato()` é o que transforma "aprovado" em rastro: mostra em que
 * peças o fato virou, e é a razão de o quadro de Produção não ser um Trello.
 */
function bloco_decididos(array $checados, array $pendentes, array $arquivados, string $buscaFa, callable $quando): void
{
    ?>
  <fieldset id="checados">
    <legend>Checados (<?= count($checados) ?>)</legend>
    <p class="dica">
      O que cada fato virou. <strong>Sem peça</strong> não é erro — é decisão que
      ainda não foi tomada, e depois de 48h ela aparece no hub como pendência.
    </p>
    <?php if ($checados === []): ?>
      <p class="dica" style="margin:0">Nenhum fato aprovado ainda.</p>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Virou</th><th>Checado por</th></tr></thead>
          <tbody>
            <?php foreach ($checados as $f): ?>
              <?php $saidas = saidas_do_fato($f['id']); ?>
              <tr>
                <td>
                  <strong><?= h($f['oQue']) ?></strong><br>
                  <span class="dica"><?= h($f['quem']) ?></span> ·
                  <a href="<?= h($f['fonteUrl']) ?>" target="_blank" rel="noopener noreferrer">fonte</a>
                </td>
                <td data-rotulo="Virou">
                  <?php if ($saidas === []): ?>
                    <span class="selo selo-off">sem peça</span>
                  <?php else: ?>
                    <?php foreach ($saidas as $c): ?>
                      <?php /* Publicado é ouro CHEIO: é o único estado que não
                               se desfaz, e a peça no ar é a resposta final da
                               pergunta "o que foi feito com aquele fato". */ ?>
                      <span class="selo <?= $c['coluna'] === 'publicado' ? 'selo-publicado' : 'selo-cinza' ?>">
                        <?= h(ETAPAS[$c['etapa']] ?? $c['etapa']) ?>
                        · <?= h(COLUNAS[$c['coluna']] ?? $c['coluna']) ?>
                      </span>
                      <?php if ($c['linkPost'] !== ''): ?>
                        <a href="<?= h($c['linkPost']) ?>" target="_blank" rel="noopener noreferrer">post</a>
                      <?php endif; ?>
                      <br>
                    <?php endforeach; ?>
                  <?php endif; ?>
                </td>
                <td data-rotulo="Checado por">
                  <?= h($f['checadoPor']) ?><br>
                  <span class="dica"><?= h($quando($f['checadoEm'])) ?></span>
                  <?php if ($f['destravaMotivo'] !== ''): ?>
                    <br><span class="selo selo-off">checou o próprio fato</span>
                    <br><span class="dica"><?= h($f['destravaMotivo']) ?></span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset>
    <legend>Arquivados (<?= count($arquivados) ?>)</legend>
    <p class="dica">
      Conferem, mas não renderam peça. Ficam aqui para a pergunta “o que foi feito
      com aquele fato” ter resposta — decidido, não esquecido.
    </p>
    <?php if ($arquivados !== []): ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Por que não virou peça</th></tr></thead>
          <tbody>
            <?php foreach ($arquivados as $f): ?>
              <tr>
                <td><strong><?= h($f['oQue']) ?></strong></td>
                <td data-rotulo="Por quê"><?= h($f['motivo']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset>
    <legend>Pendentes (<?= count($pendentes) ?>)</legend>
    <p class="dica">Não confirmaram hoje. Ficam guardados — pode virar pauta quando sair o documento.</p>
    <?php if ($pendentes !== []): ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Por que ficou pendente</th></tr></thead>
          <tbody>
            <?php foreach ($pendentes as $f): ?>
              <tr>
                <td><strong><?= h($f['oQue']) ?></strong></td>
                <td data-rotulo="Por quê"><?= h($f['motivo']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>
  <?php
}
