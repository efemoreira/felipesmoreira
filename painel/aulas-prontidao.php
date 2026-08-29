<?php
declare(strict_types=1);

/**
 * TRILHAS E PRONTIDÃO — o que cada função exige, e quem já cumpriu.
 *
 * É a terceira pergunta da frente de estudo, e a que não existia em lugar
 * nenhum: "quem já pode assumir uma função". A aba de conteúdo responde o que
 * está no ar; a de acompanhamento responde quem anda e quem parou; esta liga as
 * duas ao trabalho — função, aula, "Pronto quando" e a primeira ferramenta.
 *
 * A REGRA DA TRILHA NÃO MORA AQUI. Ela é `trilhas.php`, que a deriva do
 * currículo, dos checklists e da mesa de cada função. Aqui só se cruza com o
 * progresso, que é o que a torna de UMA pessoa.
 *
 * O QUE ESTA TELA NÃO DIZ, e não vai dizer sem carimbo novo: os degraus de
 * supervisão. "Pronto para acompanhar", "pronto para executar com supervisão" e
 * "pronto para tocar sozinho" são julgamentos de quem supervisionou, e nada no
 * painel registra isso hoje. Inventar os degraus a partir de aula concluída
 * seria dar por pronta gente que só assistiu a um vídeo — que é exatamente o
 * erro que a coordenação comete de memória e que esta tela existe para evitar.
 * O que ela afirma é o verificável: a trilha mínima está cumprida ou não.
 */

require_once __DIR__ . '/aulas-comum.php';
require_once __DIR__ . '/inscricoes-comum.php';   // nome_funcao()
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/trilhas.php';

function bloco_prontidao(): void
{
    $gente = quem_estuda();
    $progresso = ler_progresso();

    /* Agrupa por função: a pergunta da coordenação é "quem já pode assumir a
       Recepção", e não "o que a Maria sabe". */
    $porFuncao = [];
    $semFuncao = [];
    foreach ($gente as $p) {
        if (($p['funcoes'] ?? []) === []) {
            $semFuncao[] = $p;
            continue;
        }
        foreach ($p['funcoes'] as $f) {
            $porFuncao[$f][] = $p;
        }
    }
    ksort($porFuncao);
    ?>
  <fieldset id="trilhas">
    <legend>A trilha mínima de cada função</legend>
    <p class="dica" style="margin:0 0 14px">
      Três respostas por função: a aula que ensina, o “Pronto quando” que confere
      e a primeira ferramenta que a pessoa vai abrir. Nenhuma delas é escrita à
      mão — saem do currículo, dos checklists e da mesa da função.
    </p>

    <div class="rolagem cartoes">
      <table class="tabela">
        <thead><tr><th>Função</th><th>Aula</th><th>Pronto quando</th><th>Primeira ferramenta</th></tr></thead>
        <tbody>
        <?php foreach (array_keys(MESA_DA_FUNCAO) as $f): ?>
          <?php $t = trilha_da_funcao($f); ?>
          <tr>
            <td><strong><?= h(nome_funcao($f)) ?></strong></td>
            <td data-rotulo="Aula">
              <?php if ($t['aula'] !== null): ?>
                <a href="/aulas#<?= h($t['aula']['id']) ?>" target="_blank" rel="noopener">
                  <?= h($t['aula']['titulo']) ?></a>
                <span class="dica">· <?= (int) $t['aula']['minutos'] ?> min</span>
              <?php else: ?>
                <span class="selo selo-off">sem aula</span>
              <?php endif; ?>
            </td>
            <td class="meia" data-rotulo="Pronto quando">
              <?= $t['checklist'] !== null
                  ? h($t['checklist']['titulo']) . ', ' . (int) $t['checklist']['itens'] . ' itens'
                  : '<span class="selo selo-off">sem checklist</span>' ?>
            </td>
            <td class="meia" data-rotulo="Primeira ferramenta">
              <?php if ($t['ferramenta'] !== null): ?>
                <a href="<?= h($t['ferramenta']['url']) ?>"><?= h($t['ferramenta']['acao']) ?></a>
              <?php else: ?>
                <span class="dica">—</span>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </fieldset>

  <fieldset id="quem-pode">
    <legend>Quem já cumpriu a trilha da função</legend>
    <p class="dica" style="margin:0 0 14px">
      Cumprir a trilha é ter feito a aula da função. Não é o mesmo que estar
      pronta para tocar sozinha — isso quem diz é quem acompanhou o trabalho, e
      o painel não tem esse carimbo. O que ele responde é o que dá para conferir.
    </p>

    <?php if ($porFuncao === []): ?>
      <p class="dica" style="margin:0">
        Ninguém com função registrada ainda. A função se escolhe em
        <a href="/queroajudar" target="_blank">/queroajudar</a> e se ajusta na ficha da
        pessoa, em <a href="/painel/pessoas.php">Pessoas</a>.
      </p>
    <?php else: ?>
      <?php foreach ($porFuncao as $f => $pessoas): ?>
        <?php
          $t = trilha_da_funcao($f);
          $aulaId = $t['aula']['id'] ?? '';
          $prontas = array_values(array_filter(
              $pessoas,
              fn ($p) => $aulaId !== '' && isset($progresso[$p['id']][$aulaId])
          ));
        ?>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead>
              <tr>
                <th><?= h(nome_funcao((string) $f)) ?> — <?= count($prontas) ?> de <?= count($pessoas) ?></th>
                <th>Fez a aula da função?</th>
              </tr>
            </thead>
            <tbody>
            <?php foreach ($pessoas as $p): ?>
              <?php $fez = $aulaId !== '' && isset($progresso[$p['id']][$aulaId]); ?>
              <tr>
                <td><strong><?= h($p['nome']) ?></strong></td>
                <td data-rotulo="Fez a aula da função?">
                  <?php if ($fez): ?>
                    <span class="selo selo-ok">cumpriu a trilha</span>
                  <?php elseif ($aulaId === ''): ?>
                    <span class="dica">esta função não tem aula própria</span>
                  <?php else: ?>
                    <span class="selo selo-atencao">falta a aula</span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>

    <?php if ($semFuncao !== []): ?>
      <p class="dica" style="margin:14px 0 0">
        <strong><?= count($semFuncao) ?></strong>
        <?= count($semFuncao) === 1 ? 'pessoa ativa está' : 'pessoas ativas estão' ?>
        sem função registrada — sem função não há trilha, e o hub delas não tem
        o que apontar como próximo passo.
      </p>
    <?php endif; ?>
  </fieldset>
    <?php
}
