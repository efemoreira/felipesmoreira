<?php
declare(strict_types=1);

require_once __DIR__ . '/liga-importacao.php';

function tela_de_importacao_da_liga(array $liga): void
{
    $previa = $_SESSION['previaLiga'] ?? null;
    if ($previa !== null && time() - $previa['em'] > 1800) {
        unset($_SESSION['previaLiga']);
        $previa = null;
    }
    ?>
    <fieldset id="importar-liga">
      <legend>Importar fechamentos da equipe</legend>
      <details<?= $previa !== null ? ' open' : '' ?>>
        <summary>Planilha de seguidores, engajamento e ações</summary>
        <p class="dica">Exporte como CSV do Excel ou Google Planilhas. Use ponto e vírgula ou vírgula como separador; números sem separador de milhar. Até 500 linhas e 1 MB. Um id e um mês por linha. O mesmo id e mês corrige o fechamento existente.</p>
        <p class="dica">Cabeçalho: <code><?= h(implode(';', COLUNAS_CSV_LIGA)) ?></code></p>
        <p><a href="?modelo-liga=1">Baixar modelo CSV com os ids da equipe</a></p>
        <p class="dica">Exemplo: <code>pv-exemplo;2026-10;1000;200;50;10;3,5;8;1;1;0;1</code></p>
        <details><summary>Consultar os ids dos porta-vozes</summary><ul>
          <?php foreach ($liga as $pv): if ($pv['encerradoEm'] !== '') { continue; } ?>
            <li><?= h($pv['nome']) ?>: <code><?= h($pv['id']) ?></code></li>
          <?php endforeach; ?>
        </ul></details>
        <form method="post" enctype="multipart/form-data">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="pv-importar-previa">
          <div class="campo"><label for="liga-arquivo">Arquivo CSV</label><input id="liga-arquivo" name="csvLigaArquivo" type="file" accept=".csv,text/csv,text/plain"></div>
          <div class="campo"><label for="liga-csv">Ou cole o CSV com cabeçalho</label><textarea id="liga-csv" name="csvLiga" rows="5"></textarea></div>
          <div class="acoes"><button class="btn" type="submit">Ver prévia da planilha</button></div>
        </form>
        <?php if ($previa !== null): $invalidas = array_filter($previa['linhas'], fn ($l) => $l['motivos'] !== []); ?>
          <h3>Prévia — nada foi gravado</h3>
          <ul>
          <?php foreach ($previa['linhas'] as $l): $m = $l['registro']; ?>
            <li><strong><?= h('Linha ' . $l['n'] . ' · ' . $l['nome'] . ' · ' . $m['mes']) ?></strong>
              <?php if ($l['motivos'] !== []): ?>
                <span class="dica"><?= h(implode('; ', $l['motivos'])) ?></span>
              <?php else: ?>
                <span class="dica"><?= $l['corrige'] ? 'Corrigir fechamento existente' : 'Novo fechamento' ?>.
                  <?= h(implode(' · ', array_map(fn ($r) => REDES_LIGA[$r] . ': ' . $m['redes'][$r], array_keys(REDES_LIGA)))) ?>.
                  <?= h('Engajamento: ' . $m['engajamento'] . '% · semanas seguidas: ' . $m['semanasSeguidas'] . ' · todas as semanas: ' . ($m['todasSemanas'] ? 'sim' : 'não')
                    . ' · ações: ' . $m['acoes'] . ' · módulos: ' . $m['modulos'] . ' · lives: ' . $m['lives']) ?>
                </span>
              <?php endif; ?>
            </li>
          <?php endforeach; ?>
          </ul>
          <?php if ($invalidas === []): ?>
            <?php form_abre('pv-importar-gravar', '', ['previaToken' => $previa['token']]); ?>
              <p class="dica">Confirmar grava todas as linhas acima, incluindo as correções indicadas. A prévia vale por 30 minutos.</p>
            <?php form_fecha('Confirmar importação'); ?>
          <?php else: ?>
            <p class="dica">Corrija as linhas inválidas e gere outra prévia. Nenhuma linha será importada enquanto houver erros.</p>
          <?php endif; ?>
        <?php endif; ?>
      </details>
    </fieldset>
    <?php
}
