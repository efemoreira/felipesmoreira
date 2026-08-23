<?php
declare(strict_types=1);

/**
 * A FICHA DE FATO — um formulário só, desenhado em dois lugares.
 *
 * Trazer e corrigir perguntam exatamente a mesma coisa. Duas cópias divergiriam
 * no dia em que um campo novo entrasse só numa delas, e o defeito apareceria
 * como "some quando eu corrijo".
 *
 * Os ids levam sufixo na correção porque os dois formulários coexistem no
 * documento: id repetido faz o `<label for>` apontar para o campo errado, e no
 * celular o toque no rótulo foca o outro formulário.
 */

require_once __DIR__ . '/fatos-comum.php';
require_once __DIR__ . '/sessao.php';

function formulario_fato(?array $f, array $rascunho = []): void
{
    $e = $f !== null ? '-e' : '';
    /* Corrigindo, o valor vem da ficha; trazendo, do rascunho que sobrou do
       erro anterior — é o que faz o formulário voltar preenchido. */
    $v = fn (string $campo) => h((string) ($f[$campo] ?? $rascunho[$campo] ?? ''));
    $cat = (string) ($f['categoria'] ?? $rascunho['categoria'] ?? 'outro');
    $desd = !empty($f['desdobramento']) || !empty($rascunho['desdobramento']);
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="<?= $f !== null ? 'editar' : 'enviar' ?>">
      <?php if ($f !== null): ?>
        <input type="hidden" name="id" value="<?= h($f['id']) ?>">
      <?php endif; ?>

      <div class="campo">
        <label for="oQue<?= $e ?>">O quê <span class="dica">— uma frase objetiva do que aconteceu</span></label>
        <input id="oQue<?= $e ?>" type="text" name="oQue" maxlength="300" required value="<?= $v('oQue') ?>">
      </div>

      <div class="campo">
        <label for="quem<?= $e ?>">Quem <span class="dica">— o órgão ou gestor responsável, de forma institucional</span></label>
        <input id="quem<?= $e ?>" type="text" name="quem" maxlength="160" required value="<?= $v('quem') ?>">
      </div>

      <div class="linha g2">
        <div class="campo">
          <label for="quando<?= $e ?>">Quando aconteceu</label>
          <input id="quando<?= $e ?>" type="date" name="quando" value="<?= $v('quando') ?>">
        </div>
        <div class="campo">
          <label for="quanto<?= $e ?>">Quanto <span class="dica">— número, valor, quantidade</span></label>
          <input id="quanto<?= $e ?>" type="text" name="quanto" maxlength="120" value="<?= $v('quanto') ?>">
        </div>
      </div>

      <div class="campo">
        <label for="afetados<?= $e ?>">Afetados <span class="dica">— quem sente na pele: bairro, categoria, cidade</span></label>
        <input id="afetados<?= $e ?>" type="text" name="afetados" maxlength="200" value="<?= $v('afetados') ?>">
      </div>

      <div class="campo">
        <label for="fonteUrl<?= $e ?>">Link da fonte primária</label>
        <input id="fonteUrl<?= $e ?>" type="url" name="fonteUrl" maxlength="500" inputmode="url" required
               placeholder="https://…" value="<?= $v('fonteUrl') ?>">
      </div>

      <div class="linha g2">
        <div class="campo">
          <label for="fonteData<?= $e ?>">Data da publicação</label>
          <input id="fonteData<?= $e ?>" type="date" name="fonteData" required value="<?= $v('fonteData') ?>">
        </div>
        <div class="campo">
          <label for="categoria<?= $e ?>">Categoria</label>
          <select id="categoria<?= $e ?>" name="categoria">
            <?php foreach (CATEGORIAS as $chave => $nome): ?>
              <option value="<?= h($chave) ?>" <?= $cat === $chave ? 'selected' : '' ?>>
                <?= h($nome) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="campo">
        <label for="segundaFonte<?= $e ?>">Segunda fonte <span class="dica">— opcional, mas obrigatória se a afirmação for forte</span></label>
        <input id="segundaFonte<?= $e ?>" type="url" name="segundaFonte" maxlength="500" inputmode="url"
               placeholder="https://…" value="<?= $v('segundaFonte') ?>">
      </div>

      <label class="check">
        <input type="checkbox" name="desdobramento" value="1" <?= $desd ? 'checked' : '' ?>>
        É desdobramento novo de algo mais antigo
      </label>
      <p class="dica">
        Só entra fato das últimas <?= JANELA_HORAS ?>h. Marque acima se a publicação
        for mais antiga por ser um desdobramento — é a única exceção à janela.
      </p>

      <div class="acoes">
        <button type="submit" class="btn btn-ouro">
          <?= $f !== null ? 'Salvar a correção' : 'Enviar para a Checagem' ?>
        </button>
      </div>
    </form>
    <?php
}
