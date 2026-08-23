<?php
declare(strict_types=1);

/**
 * De onde vem a militância — a aba de conversão de `/painel/inscricoes`.
 *
 * Responde a pergunta que o `?de=` sempre pôde responder e ninguém perguntava:
 * **das pessoas que este link trouxe, quantas viraram militante?**
 *
 * Ela era um `<details>` recolhido no meio da fila, chamado "Quem está trazendo
 * gente", e mostrava duas colunas — quantas chegaram e quantas foram aprovadas.
 * Faltava o degrau que decide: quem apareceu num encontro. Sem ele, a live que
 * traz cinquenta inscrições e nenhuma presença parece a melhor origem do
 * movimento, e é a pior.
 *
 * **A ordem é por quem militou**, e não pelo total: ordenar pelo total poria no
 * topo justamente a origem que enche a fila e não entrega.
 *
 * Cada linha leva para a busca daquela origem na fila — o relatório mostra o
 * número, e a lista mostra as pessoas. Repetir os nomes aqui seria construir uma
 * segunda tela de gente, sempre um passo atrás da verdadeira.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/inscricoes-comum.php';

/** Quantos por cento de `$parte` em `$todo`, sem dividir por zero. */
function percentual_de_conversao(int $parte, int $todo): string
{
    return $todo === 0 ? '—' : (string) (int) round($parte * 100 / $todo) . '%';
}

/**
 * Desenha a aba de conversão por origem.
 *
 * Recebe o funil PRONTO, e não a lista de pessoas: quem desenha a aba também
 * conta o número que vai no rótulo dela, e as duas contas têm de ser a mesma.
 * Calcular aqui de novo faria a tela ler as presenças duas vezes por visita.
 *
 * @param array    $origens  o que `funil_de_origens()` devolveu
 * @param callable $formatar como esta tela escreve uma data
 */
function aba_das_origens(array $origens, callable $formatar): void
{
    ['linhas' => $linhas, 'semOrigem' => $semOrigem, 'semOrigemMilitaram' => $sozinhosMilitaram]
        = $origens;
    ?>
    <fieldset>
      <legend>De onde vem a militância (<?= count($linhas) ?>)</legend>

      <?php if ($linhas === [] && $semOrigem === 0): ?>
        <p class="dica" style="margin:0">
          Ninguém se inscreveu ainda. Quando as inscrições começarem a chegar, esta aba
          mostra qual link trouxe cada pessoa.
        </p>
      <?php else: ?>

      <p class="dica" style="margin:0 0 14px">
        Pelo <code>?de=</code> do link que a pessoa abriu. Quem compartilha pela
        <a href="/painel/municao.php">Munição</a> aparece aqui pelo nome; um canal
        (uma live, um encontro) aparece pelo apelido do link.
        <strong>Militou</strong> é quem apareceu em pelo menos um encontro — é o
        único degrau que não depende de a pessoa dizer que vem.
      </p>

      <?php if ($linhas !== []): ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr>
              <th>Veio por</th>
              <th>Chegaram</th>
              <th>Aprovadas</th>
              <th>Militaram</th>
              <th>Conversão</th>
              <th>Última</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($linhas as $l): ?>
              <tr>
                <td>
                  <?php /* O link cai na fila já filtrada por esta origem: a busca
                           da tela casa por `origem` desde sempre. O relatório dá o
                           número, a lista dá os nomes. */ ?>
                  <a href="/painel/inscricoes.php?aba=fila&amp;q=<?= h(rawurlencode($l['origem'])) ?>">
                    <?= h($l['origem']) ?>
                  </a>
                  <?php if ($l['quem'] !== ''): ?>
                    <br><span class="dica"><?= h($l['quem']) ?></span>
                  <?php endif; ?>
                </td>
                <?php /* No celular os três degraus ficam em terços, na mesma faixa: a
                         leitura do relatório é a QUEDA de um para o outro, e em
                         blocos empilhados ela vira três números soltos. */ ?>
                <td class="terco" data-rotulo="Chegaram"><?= (int) $l['chegaram'] ?></td>
                <td class="terco" data-rotulo="Aprovadas"><?= (int) $l['aprovadas'] ?></td>
                <td class="terco" data-rotulo="Militaram"><strong><?= (int) $l['militaram'] ?></strong></td>
                <td class="meia" data-rotulo="Conversão"><?= h(percentual_de_conversao($l['militaram'], $l['chegaram'])) ?></td>
                <td class="meia" data-rotulo="Última"><?= h($formatar($l['ultima'])) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php endif; ?>

      <?php if ($semOrigem > 0): ?>
        <?php /* Separado da tabela de propósito: "veio sozinho" não é um
                 recrutador, e somá-lo às origens faria a URL limpa parecer o
                 melhor canal da campanha. */ ?>
        <p class="dica" style="margin:14px 0 0">
          Outras <strong><?= (int) $semOrigem ?></strong> chegaram pela URL limpa, sem link
          de ninguém<?= $sozinhosMilitaram > 0
              ? ' — e ' . (int) $sozinhosMilitaram . ($sozinhosMilitaram === 1
                  ? ' dessas já apareceu num encontro'
                  : ' dessas já apareceram num encontro')
              : '' ?>.
        </p>
      <?php endif; ?>

      <?php endif; ?>
    </fieldset>
<?php
}
