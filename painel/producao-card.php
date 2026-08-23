<?php
declare(strict_types=1);

/**
 * O CARD do quadro — um `<article>` e o `<details>` que ele esconde.
 *
 * O card é a peça mais densa do painel: título, etapa, dono, prazo, fonte, nome
 * de arquivo gerado, histórico, e os botões de mover, assumir, soltar, publicar,
 * corrigir e apagar. Empilhado no meio do laço das quatro colunas, ele fazia o
 * arquivo do quadro ter seiscentas linhas em que quase tudo era um card só.
 *
 * O QUE ESTÁ VISÍVEL É O QUE SE LÊ DE RELANCE — etapa, título, dono, prazo. O
 * resto mora no `<details>`, porque um quadro em que cada card mostra tudo é um
 * quadro que não cabe na tela do celular.
 */

require_once __DIR__ . '/layout.php';  // texto_js(), no confirm() de apagar
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/sessao.php';

/**
 * Desenha um card.
 *
 * `$coluna` decide o que o card pode fazer: na coluna publicada não há prazo a
 * vencer nem para onde mover, e apagar só existe fora dela — card publicado é o
 * rastro de uma peça que foi ao ar, e o Acervo aponta para o link dentro dele.
 */
function desenhar_card(array $c, string $coluna, array $eu, string $hoje): void
{
    $atrasado = $coluna !== 'publicado' && $c['prazo'] !== '' && $c['prazo'] < $hoje;
    /* O degrau do meio: vence HOJE ainda dá tempo, e é justamente o card que
       precisa ser visto de manhã. Sem ele o quadro só sabia dizer "no prazo" ou
       "já era". */
    $venceHoje = $coluna !== 'publicado' && $c['prazo'] === $hoje;
    $meu = $c['donoId'] === $eu['id'];
    $posicao = array_search($coluna, array_keys(COLUNAS), true);
    $colunas = array_keys(COLUNAS);
    $chave = $coluna;
    ?>
          <article class="card<?= $atrasado ? ' card-atrasado' : '' ?>" id="<?= h($c['id']) ?>">
            <header class="card-topo">
              <span class="selo"><?= h(ETAPAS[$c['etapa']]) ?></span>
              <?php if ($atrasado): ?>
                <span class="selo selo-off">atrasado</span>
              <?php elseif ($venceHoje): ?>
                <span class="selo selo-atencao">vence hoje</span>
              <?php endif; ?>
              <?php /* Ouro cheio, e só nesta coluna: publicar é o fim da linha e
                       não tem desfazer — é o mesmo peso que o Acervo dá ao card
                       quando vai atrás do link do post. */ ?>
              <?php if ($chave === 'publicado'): ?>
                <span class="selo selo-publicado">no ar</span>
              <?php endif; ?>
            </header>

            <p class="card-titulo"><?= h($c['titulo']) ?></p>

            <p class="card-meta">
              <?php if ($c['responsavel'] !== ''): ?>
                Responsável: <?= h($c['responsavel']) ?><br>
              <?php endif; ?>
              <?php if ($c['fonteUrl'] !== ''): ?>
                <a href="<?= h($c['fonteUrl']) ?>" target="_blank" rel="noopener noreferrer">fonte</a> ·
              <?php endif; ?>
              <?= $c['donoNome'] !== '' ? h($c['donoNome']) : 'sem dono' ?>
            </p>

            <details class="decidir card-mais">
              <summary class="btn btn-mini">Abrir</summary>
              <div class="decidir-corpo">

                <p class="dica">Nome do arquivo, para o Acervo:</p>
                <p class="provisoria card-arquivo"><?= h(nome_de_arquivo($c)) ?></p>

                <!-- dono -->
                <form method="post">
                  <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                  <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                  <div class="acoes">
                    <?php if ($meu): ?>
                      <button type="submit" class="btn btn-mini" name="acao" value="soltar">Soltar o card</button>
                    <?php else: ?>
                      <button type="submit" class="btn btn-ouro" name="acao" value="assumir">
                        <?= $c['donoNome'] === '' ? 'Assumir' : 'Assumir no lugar de ' . h(explode(' ', $c['donoNome'])[0]) ?>
                      </button>
                    <?php endif; ?>
                  </div>
                </form>

                <!-- andar no quadro -->
                <?php if ($chave !== 'publicado'): ?>
                  <form method="post" class="decidir-recusa">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <div class="acoes">
                      <?php if ($posicao > 0): ?>
                        <button type="submit" class="btn btn-mini" name="coluna" value="<?= h($colunas[$posicao - 1]) ?>">
                          ← <?= h(COLUNAS[$colunas[$posicao - 1]]) ?>
                        </button>
                      <?php endif; ?>
                      <?php if ($chave !== 'revisao'): ?>
                        <button type="submit" class="btn btn-mini" name="coluna" value="<?= h($colunas[$posicao + 1]) ?>">
                          <?= h(COLUNAS[$colunas[$posicao + 1]]) ?> →
                        </button>
                      <?php endif; ?>
                    </div>
                    <input type="hidden" name="acao" value="mover">
                  </form>
                <?php endif; ?>

                <!-- publicar -->
                <?php if ($chave === 'revisao'): ?>
                  <?php $repetido = alvo_repetido($c['responsavel'], $c['id']); ?>
                  <form method="post" class="decidir-recusa">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <input type="hidden" name="acao" value="publicar">
                    <?php if (pode('aulas')): ?>
                      <p class="dica" style="margin:0 0 10px">
                        Antes de publicar, passe o checklist de conformidade:
                        <a href="/aulas#roteirista" target="_blank">a aula do Roteirista</a>.
                      </p>
                    <?php endif; ?>
                    <div class="campo">
                      <label for="link-<?= h($c['id']) ?>">Link do post publicado</label>
                      <input id="link-<?= h($c['id']) ?>" type="url" name="linkPost" maxlength="500"
                             inputmode="url" placeholder="https://…" required>
                    </div>
                    <?php if ($repetido !== null): ?>
                      <p class="msg msg-erro">
                        <strong>Regra do ledger.</strong> “<?= h($c['responsavel']) ?>” já foi alvo principal de
                        “<?= h($repetido['titulo']) ?>”, publicado há menos de <?= LEDGER_HORAS ?>h.
                      </p>
                      <label class="check">
                        <input type="checkbox" name="ciente" value="1">
                        Estou ciente e ainda assim é a pauta certa
                      </label>
                    <?php endif; ?>
                    <div class="acoes">
                      <button type="submit" class="btn btn-ouro">Publicar</button>
                    </div>
                  </form>
                <?php endif; ?>

                <!-- abrir a etapa seguinte -->
                <form method="post" class="decidir-recusa">
                  <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                  <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                  <input type="hidden" name="acao" value="nova-etapa">
                  <p class="dica">Abrir outra peça a partir do mesmo fato:</p>
                  <div class="acoes">
                    <?php foreach (ETAPAS as $eChave => $eNome): ?>
                      <?php if ($eChave !== $c['etapa']): ?>
                        <button type="submit" class="btn btn-mini" name="etapa" value="<?= h($eChave) ?>">
                          + <?= h($eNome) ?>
                        </button>
                      <?php endif; ?>
                    <?php endforeach; ?>
                  </div>
                </form>

                <?php if ($c['linkPost'] !== ''): ?>
                  <p class="dica">
                    Publicado em
                    <a href="<?= h($c['linkPost']) ?>" target="_blank" rel="noopener noreferrer">ver o post</a>
                  </p>
                <?php endif; ?>

                <?php /* Corrigir e apagar ficam por último, depois do que se faz
                         todo dia: são as ações raras, e a rara em cima da comum
                         é a que se clica sem querer. */ ?>
                <div class="decidir-recusa">
                  <div class="acoes">
                    <?php botao_modal('editar-card', 'Corrigir o card', 'editar=' . urlencode($c['id']) . '#' . $c['id'], 'btn btn-mini'); ?>
                    <?php if ($chave !== 'publicado' || e_admin()): ?>
                      <form method="post" style="display:inline"
                            onsubmit="return confirm(<?= texto_js($chave === 'publicado'
                                ? 'Apagar um card JÁ PUBLICADO? Some o rastro que liga a peça ao fato — e o Acervo aponta para o link que está nele.'
                                : 'Apagar este card? O fato continua checado e volta a aparecer como “sem peça”.') ?>)">
                        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                        <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                        <button type="submit" class="btn btn-mini btn-risco" name="acao" value="apagar">Apagar</button>
                      </form>
                    <?php endif; ?>
                  </div>
                </div>

                <?php if ($c['historico'] !== []): ?>
                  <p class="dica" style="margin-top:14px">Histórico</p>
                  <ul class="historico">
                    <?php foreach (array_reverse($c['historico']) as $h): ?>
                      <li>
                        <?= h($h['texto']) ?>
                        <span><?= h($h['quem']) ?><?= $h['quando'] !== '' ? ' · ' . h(date('d/m H:i', (int) strtotime($h['quando']))) : '' ?></span>
                      </li>
                    <?php endforeach; ?>
                  </ul>
                <?php endif; ?>
              </div>
            </details>
          </article>
  <?php
}
