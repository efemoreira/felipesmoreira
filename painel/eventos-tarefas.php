<?php
declare(strict_types=1);

/**
 * A aba Tarefas de Encontros — o que foi combinado, com quem, até quando.
 *
 * Todo mundo com a área vê a lista inteira e marca a própria tarefa como
 * feita; criar, reatribuir e apagar é da coordenação. A tarefa de um encontro
 * aparece também na tela dele (Preparo), mas a lista que responde "o que
 * está combinado esta semana?" é esta.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/tarefas-comum.php';
require_once __DIR__ . '/eventos-comum.php';

function bloco_tarefas(array $eu, bool $coordena): void
{
    $todas = ler_tarefas();
    $abertas = array_values(array_filter($todas, fn ($t) => $t['feitaEm'] === ''));
    $feitas  = array_values(array_filter($todas, fn ($t) => $t['feitaEm'] !== ''));
    $nomes = [];
    foreach (ler_pessoas() as $p) {
        $nomes[$p['id']] = $p['nome'];
    }
    $encontros = [];
    foreach (eventos_proximos() as $e) {
        $encontros[$e['id']] = $e['titulo'];
    }
    ?>
    <?php if ($coordena): ?>
      <details class="decidir" style="margin:0 0 18px"<?= !empty($_GET['nova']) ? ' open' : '' ?>>
        <summary class="btn btn-ouro">Combinar uma tarefa</summary>
        <div class="decidir-corpo">
          <form method="post" data-rascunho="tarefa-nova">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="tarefa-nova">
            <div class="campo">
              <label for="t-titulo">O quê</label>
              <input id="t-titulo" type="text" name="titulo" maxlength="140" required placeholder="Confirmar o som com o seu Chico">
            </div>
            <div class="linha g3">
              <div class="campo">
                <label for="t-dono">Quem</label>
                <select id="t-dono" name="donoId" required>
                  <option value="">— escolha —</option>
                  <?php foreach (pessoas_ativas() as $p): ?>
                    <option value="<?= h($p['id']) ?>"<?= $p['id'] === $eu['id'] ? ' selected' : '' ?>><?= h($p['nome']) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="campo">
                <label for="t-ate">Até <span class="dica">— opcional</span></label>
                <input id="t-ate" type="date" name="ate">
              </div>
              <div class="campo">
                <label for="t-evento">Encontro <span class="dica">— opcional</span></label>
                <select id="t-evento" name="eventoId">
                  <option value="">— nenhum —</option>
                  <?php foreach ($encontros as $id => $titulo): ?>
                    <option value="<?= h($id) ?>"<?= ($_GET['evento'] ?? '') === $id ? ' selected' : '' ?>><?= h($titulo) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>
            <div class="acoes"><button class="btn btn-ouro" type="submit">Combinar</button></div>
          </form>
        </div>
      </details>
    <?php endif; ?>

    <fieldset id="tarefas">
      <legend>Combinadas (<?= count($abertas) ?>)</legend>
      <?php if ($abertas === []): ?>
        <?php vazio('Nada combinado. O que vive no WhatsApp some; o que vive aqui vence no Início de quem é o dono.',
            $coordena ? ['url' => '/painel/eventos.php?aba=tarefas&nova=1', 'texto' => 'Combinar a primeira'] : null); ?>
      <?php else: ?>
        <div class="tarefas">
          <?php foreach ($abertas as $t): $vencida = tarefa_vencida($t); $minha = $t['donoId'] === $eu['id']; ?>
            <div class="tarefa<?= $vencida ? ' tarefa-vencida' : '' ?>" id="t-<?= h($t['id']) ?>">
              <div class="tarefa-corpo">
                <strong><?= h($t['titulo']) ?></strong>
                <p class="dica" style="margin:4px 0 0">
                  <?= h($nomes[$t['donoId']] ?? 'sem dono') ?>
                  <?php if ($t['ate'] !== ''): ?> · <?= $vencida ? 'venceu em' : 'até' ?> <?= h(data_humana($t['ate'])) ?><?php endif; ?>
                  <?php if ($t['eventoId'] !== '' && ($e = achar_evento($t['eventoId'])) !== null): ?>
                    · <a href="/painel/eventos.php?e=<?= h(rawurlencode($e['id'])) ?>"><?= h($e['titulo']) ?></a>
                  <?php endif; ?>
                  <?php if ($t['criadoPor'] !== ''): ?> · combinada por <?= h($t['criadoPor']) ?><?php endif; ?>
                </p>
              </div>
              <div class="acoes-celula">
                <?php if ($minha || $coordena): ?>
                  <form method="post">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="acao" value="tarefa-feita">
                    <input type="hidden" name="id" value="<?= h($t['id']) ?>">
                    <button class="btn btn-mini btn-ouro" type="submit">Feita</button>
                  </form>
                <?php endif; ?>
                <?php if ($coordena): ?>
                  <?php menu_acoes([
                      ['texto' => 'Apagar', 'acao' => 'tarefa-apagar', 'campos' => ['id' => $t['id']], 'risco' => true, 'confirmar' => 'Apagar esta tarefa?'],
                  ]); ?>
                <?php endif; ?>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </fieldset>

    <?php if ($feitas !== []): ?>
      <fieldset>
        <legend>Feitas (<?= count($feitas) ?>)</legend>
        <ul class="dica colado">
          <?php foreach (array_slice($feitas, 0, 20) as $t): ?>
            <li><?= h($t['titulo']) ?> — <?= h($nomes[$t['donoId']] ?? '') ?> · feita <?= h(date('d/m', (int) strtotime($t['feitaEm']))) ?><?= $t['feitaPor'] !== '' ? ' por ' . h($t['feitaPor']) : '' ?></li>
          <?php endforeach; ?>
        </ul>
      </fieldset>
    <?php endif; ?>
    <?php
}
