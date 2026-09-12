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
    require_once __DIR__ . '/aulas-texto.php';
    $patches = ler_patches_de_aula();
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

          <?php /* O TEXTO DA AULA, editável — a camada de patch de
                   `aulas-texto.php`. Fechado num <details>: o vídeo é a rotina;
                   corrigir uma frase é a exceção, e o formulário é longo. */ ?>
          <?php $patch = $patches[$aula['id']] ?? null; $comPatch = aula_com_patch($aula, $patch); ?>
          <details class="decidir" id="texto-<?= h($aula['id']) ?>"<?= (($_GET['texto'] ?? '') === $aula['id']) ? ' open' : '' ?>>
            <summary class="btn">
              Corrigir o texto da aula
              <?php if ($patch !== null): ?>
                <span class="selo selo-atencao">editada por <?= h($patch['alteradoPor'] ?: 'alguém') ?></span>
              <?php endif; ?>
            </summary>
            <div class="decidir-corpo">
              <p class="dica" style="margin:0 0 12px">
                O que você mudar aqui vale na hora em /aulas, por cima do texto do código.
                “Voltar ao original” desfaz. Título, minutos, tabelas e checklists
                mudam só no código — são estrutura, não frase.
              </p>
              <form method="post" data-rascunho="aula-texto-<?= h($aula['id']) ?>">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="aula" value="<?= h($aula['id']) ?>">
                <input type="hidden" name="acao" value="texto">

                <div class="campo">
                  <label for="resumo-<?= h($aula['id']) ?>">Resumo
                    <?php if (isset($patch['resumo'])): ?>
                      <label class="check" style="display:inline-flex;margin-left:10px"><input type="checkbox" name="original[]" value="resumo"> voltar ao original</label>
                    <?php endif; ?>
                  </label>
                  <textarea id="resumo-<?= h($aula['id']) ?>" name="resumo" rows="2" maxlength="400"><?= h($comPatch['resumo']) ?></textarea>
                </div>

                <?php foreach ($comPatch['blocos'] as $i => $bloco): ?>
                  <?php $campo = BLOCOS_EDITAVEIS[$bloco['tipo']] ?? null; if ($campo === null) continue; ?>
                  <div class="campo">
                    <label for="bloco-<?= h($aula['id']) ?>-<?= $i ?>">
                      <?= h(ucfirst($bloco['tipo'])) ?> <?= $i + 1 ?>
                      <?php if ($campo === 'itens'): ?><span class="dica">— um item por linha</span><?php endif; ?>
                      <?php if (isset($patch['blocos'][$i])): ?>
                        <label class="check" style="display:inline-flex;margin-left:10px"><input type="checkbox" name="original[]" value="<?= $i ?>"> voltar ao original</label>
                      <?php endif; ?>
                    </label>
                    <textarea id="bloco-<?= h($aula['id']) ?>-<?= $i ?>" name="blocos[<?= $i ?>]" rows="<?= $campo === 'itens' ? max(3, count($bloco['itens'])) : 3 ?>"><?= h($campo === 'itens' ? implode("\n", $bloco['itens']) : $bloco['texto']) ?></textarea>
                  </div>
                <?php endforeach; ?>

                <div class="acoes">
                  <button type="submit" class="btn btn-ouro">Salvar o texto</button>
                </div>
              </form>
            </div>
          </details>
        </div>
      </details>
    <?php endforeach; ?>
  </fieldset>
<?php endforeach; ?>
    <?php
}
