<?php
declare(strict_types=1);

/**
 * A ABA DE CONTEÚDO — o vídeo pendurado em cada aula, Dia por Dia.
 *
 * É o que a tela inteira era antes de a frente de estudo virar três abas. O
 * texto da aula não se edita aqui e nunca se editou: ele vem de
 * `aulas-conteudo.php`, versionado, porque é a tradução do manual.
 *
 * Cada aula é um `<details>` fechado. Trinta e duas fichas abertas seriam
 * trinta e dois formulários na mesma tela, e quem vem pendurar UM vídeo
 * atravessaria os outros trinta e um.
 */

require_once __DIR__ . '/aulas-comum.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sessao.php';

/**
 * Desenha os seis Dias do currículo, já recortados.
 *
 * `$recorteAu` vem de fora porque é a mesma peneira que alimenta o contador do
 * topo: se a tela filtrasse por uma régua e contasse por outra, o "3 de 32"
 * mentiria sobre a própria lista que está embaixo dele.
 */
function bloco_videos(array $videos, callable $recorteAu): void
{
    ?>
<?php foreach (CURRICULO as $dia): ?>
  <?php
    /* Quanto deste Dia já tem vídeo — sem isso, achar o Dia incompleto exige
       abrir os seis <details> um por um. */
    $comVideoNoDia = count(array_filter(
        $dia['aulas'],
        fn ($a) => isset($videos[$a['id']])
    ));
    /* O Dia inteiro sai da tela quando nenhuma aula dele casa: um bloco vazio
       com o título do Dia faria procurar dentro dele. O contador do topo continua
       dizendo o total, para ninguém achar que as outras sumiram. */
    $aulasDoDia = array_values(array_filter($dia['aulas'], $recorteAu));
  ?>
  <?php if ($aulasDoDia === []) { continue; } ?>
  <fieldset>
    <legend>
      Dia <?= (int) $dia['numero'] ?> — <?= h($dia['titulo']) ?>
      · <?= $comVideoNoDia ?>/<?= count($dia['aulas']) ?> com vídeo
    </legend>
    <p class="dica" style="margin:0 0 14px"><?= h($dia['resumo']) ?></p>

    <?php foreach ($aulasDoDia as $aula): ?>
      <?php
        $v = $videos[$aula['id']] ?? null;
        $rapida = $aula['pista'] === 'rapida';
      ?>
      <details class="item" id="<?= h($aula['id']) ?>">
        <summary class="item-topo">
          <span class="item-num" aria-hidden="true"><?= $rapida ? '🚗' : '·' ?></span>
          <span class="item-resumo">
            <strong><?= h($aula['titulo']) ?></strong>
            <span><?= (int) $aula['minutos'] ?> min<?= $rapida ? ' · Pista Rápida' : '' ?></span>
          </span>
          <?php if ($v === null): ?>
            <span class="selo selo-cinza">Sem vídeo</span>
          <?php elseif ($v['publicada']): ?>
            <span class="selo selo-ok">Publicada</span>
          <?php else: ?>
            <span class="selo selo-off">Rascunho</span>
          <?php endif; ?>
        </summary>

        <div class="item-corpo">
          <p class="dica" style="margin:0 0 14px"><?= h($aula['resumo']) ?></p>

          <form method="post">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="aula" value="<?= h($aula['id']) ?>">

            <div class="campo">
              <label for="link-<?= h($aula['id']) ?>">Link do vídeo no YouTube</label>
              <input id="link-<?= h($aula['id']) ?>" type="url" name="link" maxlength="200"
                     inputmode="url" placeholder="https://youtu.be/…"
                     value="<?= $v !== null ? 'https://youtu.be/' . h($v['id']) : '' ?>">
            </div>

            <label class="check">
              <input type="checkbox" name="publicada" value="1" <?= ($v !== null && $v['publicada']) ? 'checked' : '' ?>>
              Mostrar o player em /aulas
            </label>
            <p class="dica">
              Deixe desmarcado para deixar o link guardado sem ninguém ver ainda. Use vídeo
              <strong>não listado</strong>: ele não aparece em busca, mas abre para quem tem o link.
            </p>

            <div class="acoes">
              <button type="submit" class="btn btn-ouro" name="acao" value="video">Salvar vídeo</button>
              <?php if ($v !== null): ?>
                <button type="submit" class="btn btn-risco" name="acao" value="remover"
                        formnovalidate>Remover vídeo</button>
              <?php endif; ?>
            </div>
          </form>
        </div>
      </details>
    <?php endforeach; ?>
  </fieldset>
<?php endforeach; ?>
    <?php
}
