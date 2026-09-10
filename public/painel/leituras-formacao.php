<?php
declare(strict_types=1);

/**
 * A formação por função — a aba Formação de `/painel/leituras`.
 *
 * Por função: quantas pessoas a têm, quantas cumpriram a trilha mínima (a aula
 * da função), quantas travaram no estudo há mais de sete dias e quantas nem
 * começaram. Responde "que função mais perde gente entre aprender e fazer" —
 * e a conta é a mesma de `/painel/aulas?aba=prontidao`, que lista os nomes.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/leituras-comum.php';
require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao()

function aba_de_formacao(array $prontidao): void
{
    ['porFuncao' => $porFuncao, 'semFuncao' => $semFuncao] = $prontidao;
    $comFuncao = 0;
    $prontas = 0;
    foreach ($porFuncao as $g) {
        $comFuncao += count($g['pessoas']);
        $prontas += count($g['prontas']);
    }
    ?>
    <fieldset>
      <legend>Prontidão por função (<?= count($porFuncao) ?>)</legend>

      <?php if ($porFuncao === []): ?>
        <p class="dica" style="margin:0">
          Ninguém com função registrada ainda. A função se escolhe em /queroajudar e se
          ajusta na ficha da pessoa.
        </p>
      <?php else: ?>
        <dl class="resumo-numeros">
          <div><dt>Com função</dt><dd><?= $comFuncao ?></dd></div>
          <div><dt>Cumpriram a trilha</dt><dd><?= $prontas ?></dd></div>
          <div><dt>Sem função</dt><dd><?= count($semFuncao) ?></dd></div>
        </dl>
        <p class="dica" style="margin:0 0 14px">
          Cumprir a trilha é ter feito a aula da função — o que dá para conferir. Pronta
          para tocar sozinha é julgamento de quem acompanhou, e o painel não tem esse
          carimbo. Os nomes estão em <a href="/painel/aulas.php?aba=prontidao">Formação › Trilhas e prontidão</a>.
        </p>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead><tr><th>Função</th><th>Pessoas</th><th>Trilha cumprida</th><th>Travadas</th><th>Sem começar</th></tr></thead>
            <tbody>
              <?php foreach ($porFuncao as $f => $g): ?>
                <?php $n = count($g['pessoas']); $ok = count($g['prontas']); ?>
                <tr>
                  <td><strong><?= h(nome_funcao((string) $f)) ?></strong></td>
                  <td class="terco" data-rotulo="Pessoas"><?= $n ?></td>
                  <td class="terco" data-rotulo="Trilha cumprida">
                    <?php if ($g['aulaId'] === ''): ?>
                      <span class="selo selo-cinza">sem aula própria</span>
                    <?php else: ?>
                      <span class="selo <?= $ok === $n ? 'selo-ok' : ($ok === 0 ? 'selo-off' : 'selo-atencao') ?>"><?= $ok ?> de <?= $n ?></span>
                    <?php endif; ?>
                  </td>
                  <td class="terco" data-rotulo="Travadas"><?= $g['travadas'] ?: '—' ?></td>
                  <td class="meia" data-rotulo="Sem começar"><?= $g['semComecar'] ?: '—' ?></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </fieldset>
    <?php
}
