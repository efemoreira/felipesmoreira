<?php
declare(strict_types=1);

/**
 * O MODAL de corrigir o card.
 *
 * Fica no fim do documento, e nunca dentro do `<article>` do card: `<dialog>`
 * aninhado em formulário é HTML inválido — o navegador reorganiza a árvore
 * sozinho e o formulário some sem um erro sequer no console.
 *
 * Abre por GET (`?editar=<id>`), e não por estado de JavaScript: sem JS a página
 * recarrega com o `<dialog open>` e o formulário continua ali.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/sessao.php';

function bloco_modal_do_card(?array $corrigindo): void
{
    if ($corrigindo === null) {
        return;
    }
    ?>
    <?php abrir_modal('editar-card', 'Corrigir o card', true); ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="id" value="<?= h($corrigindo['id']) ?>">
        <input type="hidden" name="acao" value="editar">

        <div class="campo">
          <label for="c-titulo">Título</label>
          <input id="c-titulo" type="text" name="titulo" maxlength="200" required
                 value="<?= h($corrigindo['titulo']) ?>">
        </div>

        <div class="linha g2">
          <div class="campo">
            <label for="c-etapa">Peça</label>
            <select id="c-etapa" name="etapa">
              <?php foreach (ETAPAS as $chaveE => $nomeE): ?>
                <option value="<?= h($chaveE) ?>" <?= $corrigindo['etapa'] === $chaveE ? 'selected' : '' ?>>
                  <?= h($nomeE) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="campo">
            <label for="c-prazo">Prazo <span class="dica">— opcional</span></label>
            <input id="c-prazo" type="date" name="prazo" value="<?= h($corrigindo['prazo']) ?>">
          </div>
        </div>

        <div class="campo">
          <label for="c-resp">Alvo principal <span class="dica">— é sobre ele que a regra do ledger conta as 48h</span></label>
          <input id="c-resp" type="text" name="responsavel" maxlength="160"
                 value="<?= h($corrigindo['responsavel']) ?>">
        </div>

        <div class="campo">
          <label for="c-fonte">Link da fonte</label>
          <input id="c-fonte" type="url" name="fonteUrl" maxlength="500" inputmode="url"
                 placeholder="https://…" value="<?= h($corrigindo['fonteUrl']) ?>">
        </div>

        <p class="dica">
          O nome do arquivo é gerado do título e da peça — mudar qualquer um dos dois
          muda o nome que o Estúdio vai exportar, e quem já baixou o PNG ficou com o
          antigo. Por isso a correção fica anotada no histórico do card.
        </p>

        <div class="acoes">
          <button type="submit" class="btn btn-ouro">Salvar o card</button>
        </div>
      </form>
    <?php fechar_modal(); ?>
  <?php
}
