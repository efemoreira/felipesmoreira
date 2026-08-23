<?php
declare(strict_types=1);

/**
 * O arquivo das decisões — a aba "Já decididas" de `/painel/inscricoes`.
 *
 * A fila é o trabalho; isto aqui é a consulta. Empilhadas numa tela só, o
 * arquivo — que cresce para sempre — empurrava a fila para fora da tela, que é
 * justamente o que alguém veio fazer aqui.
 *
 * **A ordem é A-Z, e não a de chegada.** O arquivo se consulta procurando um
 * nome ("o Fulano chegou a ser aprovado?"), e não relendo do começo; a ordem de
 * chegada só serve para a fila, e a fila é a outra aba.
 *
 * A inscrição não tem formulário de edição próprio: ela não é um registro à
 * parte, é a MESMA pessoa com o bloco de entrada preenchido. Corrigir é em
 * `/painel/pessoas`, e só para quem tem a área — a lista de pessoas tem
 * telefone e endereço de todo mundo.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/inscricoes-comum.php';

/**
 * Desenha a aba do arquivo.
 *
 * @param array  $decididas as aprovadas e recusadas, já recortadas pela busca
 * @param string $buscaIn   o que foi procurado, para o vazio saber explicar
 * @param callable $formatar como esta tela escreve uma data
 */
function aba_das_decididas(array $decididas, string $buscaIn, callable $formatar): void
{
    ?>
    <fieldset>
      <legend>Já decididas (<?= count($decididas) ?>)</legend>
      <?php if ($decididas === []): ?>
        <?php nada_encontrado($buscaIn, '/painel/inscricoes.php?aba=decididas', 'Nada decidido ainda.'); ?>
      <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Nome</th><th>Cidade</th><th>Situação</th><th>Quem decidiu</th><th>Quando</th></tr>
          </thead>
          <tbody>
            <?php
            /* A-Z: o arquivo se consulta procurando um nome ("o Fulano chegou a
               ser aprovado?"), e não relendo do começo. A ordem de chegada, que
               era a de antes, só serve para a fila — e a fila é a outra aba. */
            $emOrdem = $decididas;
            usort($emOrdem, fn ($a, $b) => strcmp(sem_acento($a['nome']), sem_acento($b['nome'])));
            ?>
            <?php foreach ($emOrdem as $i): ?>
              <tr>
                <td>
                  <?php if (pode('pessoas')): ?>
                    <a href="/painel/pessoas.php?p=<?= h($i['id']) ?>"><?= h($i['nome']) ?></a>
                  <?php else: ?>
                    <?= h($i['nome']) ?>
                  <?php endif; ?>
                </td>
                <td class="meia" data-rotulo="Cidade"><?= h($i['cidade']) ?></td>
                <td class="meia" data-rotulo="Situação">
                  <?php if ($i['status'] === 'aprovada'): ?>
                    <span class="selo">aprovada</span>
                  <?php else: ?>
                    <span class="selo selo-off">recusada</span>
                  <?php endif; ?>
                </td>
                <td class="meia" data-rotulo="Quem decidiu"><?= h($i['decididoPor']) ?></td>
                <td class="meia" data-rotulo="Quando"><?= h($formatar($i['decididoEm'])) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php endif; ?>
    </fieldset>
<?php
}
