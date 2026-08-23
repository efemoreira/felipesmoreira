<?php
declare(strict_types=1);

/**
 * OS DOIS FORMULÁRIOS de `/painel/candidatos`: o do candidato e o da lista.
 *
 * Cada um é uma função só, desenhada em dois modais (criar e editar), pela
 * mesma razão do `formulario_pessoa()`: duas cópias divergiriam na primeira vez
 * que um campo entrasse só numa delas, e o defeito apareceria como "some quando
 * eu edito".
 *
 * Moram longe da lista porque respondem outra pergunta. A lista responde "quem
 * está no ar?"; estes respondem "quem é este, e qual é o número dele?" — e é
 * esse número que o eleitor vai digitar na urna.
 */

require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo


/**
 * O formulário do candidato — um só, desenhado em dois modais.
 *
 * Cadastrar e editar perguntam exatamente a mesma coisa; duas cópias do
 * formulário divergiriam no dia em que um campo novo entrasse só numa delas.
 */
function formulario_candidato(?array $editando, string $rotulo = ''): void
{
    /* O rótulo do botão é o único parâmetro a mais porque é a única coisa que
       muda entre os três usos: cadastrar do zero, editar quem já é candidato e
       acrescentar a candidatura a quem já está na lista de pessoas. */
    if ($rotulo === '') {
        $rotulo = $editando ? 'Salvar' : 'Cadastrar';
    }
    ?>
    <?php /* Rascunho: o número de urna se confere no registro do TSE, e a
             conferência acontece com o formulário aberto numa aba e o site do
             tribunal na outra. */ ?>
    <form method="post" enctype="multipart/form-data"
          data-rascunho="candidato-<?= $editando ? h($editando['id']) : 'novo' ?>">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <?php if ($editando): ?>
        <input type="hidden" name="id" value="<?= h($editando['id']) ?>">
      <?php endif; ?>
      <div class="linha g2">
        <div class="campo">
          <label for="c-nome<?= $editando ? '-e' : '' ?>">Nome</label>
          <input id="c-nome<?= $editando ? '-e' : '' ?>" name="nome" type="text" maxlength="80" required
                 value="<?= h($editando['nome'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="c-numero<?= $editando ? '-e' : '' ?>">Número</label>
          <input id="c-numero<?= $editando ? '-e' : '' ?>" name="numero" type="text" inputmode="numeric" maxlength="6" required
                 value="<?= h($editando['numero'] ?? '') ?>">
          <p class="dica">O que se digita na urna. É a única coisa, além do nome, que não pode faltar.</p>
        </div>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="c-urna<?= $editando ? '-e' : '' ?>">Nome de urna <span class="dica">— opcional</span></label>
          <input id="c-urna<?= $editando ? '-e' : '' ?>" name="urna" type="text" maxlength="60"
                 value="<?= h($editando['urna'] ?? '') ?>" placeholder="como aparece na urna">
        </div>
        <div class="campo">
          <label for="c-cargo<?= $editando ? '-e' : '' ?>">Cargo <span class="dica">— opcional</span></label>
          <select id="c-cargo<?= $editando ? '-e' : '' ?>" name="cargo">
            <option value="">Sem cargo definido</option>
            <?php foreach (CARGOS as $chave => $cargo): ?>
              <option value="<?= h($chave) ?>" <?= ($editando['cargo'] ?? '') === $chave ? 'selected' : '' ?>>
                <?= h($cargo['nome']) ?> — <?= (int) $cargo['digitos'] ?> dígitos
              </option>
            <?php endforeach; ?>
          </select>
          <p class="dica">
            Escolhido o cargo, o número é conferido pelo tamanho ao salvar.
            <strong>Vice e suplente levam o número do titular</strong> — é nele
            que se vota, e é ele que o eleitor digita.
          </p>
        </div>
      </div>
      <div class="linha g3">
        <div class="campo">
          <label for="c-partido<?= $editando ? '-e' : '' ?>">Partido <span class="dica">— opcional</span></label>
          <?php /* "Missão" é sugestão para ficha NOVA — inclusive a de quem foi
                   puxado da lista de pessoas. Numa candidatura que já existe o
                   campo mostra o que está gravado, mesmo vazio: quem apagou o
                   partido apagou de propósito. */ ?>
          <?php $partidoPadrao = ($editando['tipo'] ?? '') === 'candidato' ? '' : 'Missão'; ?>
          <input id="c-partido<?= $editando ? '-e' : '' ?>" name="partido" type="text" maxlength="40"
                 value="<?= h(($editando['partido'] ?? '') !== '' ? $editando['partido'] : $partidoPadrao) ?>">
        </div>
        <div class="campo">
          <label for="c-insta<?= $editando ? '-e' : '' ?>">Instagram <span class="dica">— opcional</span></label>
          <input id="c-insta<?= $editando ? '-e' : '' ?>" name="instagram" type="text" maxlength="60"
                 value="<?= $editando && $editando['instagram'] !== '' ? '@' . h($editando['instagram']) : '' ?>"
                 placeholder="@perfil">
          <p class="dica">Só o @, ou cole o link — dá na mesma.</p>
        </div>
        <div class="campo">
          <label for="c-ordem<?= $editando ? '-e' : '' ?>">Ordem na colinha</label>
          <input id="c-ordem<?= $editando ? '-e' : '' ?>" name="ordem" type="number" min="0" max="999"
                 value="<?= (int) ($editando['ordem'] ?? 0) ?>">
          <p class="dica">Menor primeiro. Empate desempata pelo nome.</p>
        </div>
      </div>
      <div class="campo">
        <label for="c-img<?= $editando ? '-e' : '' ?>">Foto <span class="dica">— opcional</span></label>
        <?php if ($editando && $editando['imagem'] !== ''): ?>
          <p><img src="<?= h($editando['imagem']) ?>" alt="" style="max-width:180px;border:3px solid var(--linha-2)"></p>
          <label class="check">
            <input type="checkbox" name="tirarImagem" value="1"> Remover esta foto
          </label>
        <?php endif; ?>
        <input id="c-img<?= $editando ? '-e' : '' ?>" name="imagem" type="file" accept="image/*">
        <p class="dica">
          JPG, PNG ou WEBP até 8 MB. Sem foto o cartão mostra o número grande, que é o
          que o eleitor precisa mesmo levar.
        </p>
      </div>

      <div class="acoes">
        <button class="btn btn-ouro" name="acao" value="<?= $editando ? 'cand-salvar' : 'cand-novo' ?>" type="submit">
          <?= h($rotulo) ?>
        </button>
        <?php if ($editando): ?>
          <a class="btn" href="/painel/candidatos.php">Cancelar</a>
        <?php endif; ?>
      </div>
    </form>
    <?php
}

/**
 * O formulário da lista — um só, desenhado em dois modais.
 *
 * Criar e renomear perguntam exatamente a mesma coisa (nome, descrição e
 * ordem); QUEM entra continua sendo a outra pergunta, respondida no
 * `lista-quem` de dentro da ficha. Duas cópias deste formulário divergiriam no
 * dia em que um campo novo entrasse só numa delas.
 */
function formulario_lista(?array $l): void
{
    $e = $l !== null ? '-e' : '';
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <?php if ($l !== null): ?>
        <input type="hidden" name="id" value="<?= h($l['id']) ?>">
      <?php endif; ?>
      <div class="campo">
        <label for="l-nome<?= $e ?>">Nome da lista</label>
        <input id="l-nome<?= $e ?>" name="nome" type="text" maxlength="60" required
               placeholder="Deputados federais" value="<?= h($l['nome'] ?? '') ?>">
        <p class="dica">Vira o título da colinha. Escreva como você diria no grupo.</p>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="l-desc<?= $e ?>">Descrição <span class="dica">— opcional</span></label>
          <input id="l-desc<?= $e ?>" name="descricao" type="text" maxlength="160"
                 value="<?= h($l['descricao'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="l-ordem<?= $e ?>">Ordem</label>
          <input id="l-ordem<?= $e ?>" name="ordem" type="number" min="0" max="999"
                 value="<?= (int) ($l['ordem'] ?? 0) ?>">
        </div>
      </div>
      <?php if ($l !== null && $l['publicada']): ?>
        <p class="dica">
          Esta lista está no ar: o novo nome já vira o título da próxima colinha gerada.
          As que já foram baixadas continuam com o nome antigo — imagem no celular de
          alguém não se atualiza sozinha.
        </p>
      <?php endif; ?>
      <div class="acoes">
        <button class="btn btn-ouro" name="acao" value="<?= $l !== null ? 'lista-salvar' : 'lista-nova' ?>" type="submit">
          <?= $l !== null ? 'Salvar a lista' : 'Criar lista' ?>
        </button>
      </div>
    </form>
    <?php
}
