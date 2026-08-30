<?php
declare(strict_types=1);

/**
 * A FILA DE FOLLOW-UP DO MOVIMENTO INTEIRO — a mesa da função Follow-up.
 *
 * O funil já existia dentro de cada encontro. Enquanto era só isso, quem ia
 * mandar as mensagens do dia tinha de adivinhar em qual encontro estava o
 * trabalho: abrir um, ver se havia vencido, voltar, abrir o outro. Com dez
 * encontros no histórico isso é dez telas para descobrir se há três mensagens
 * a mandar.
 *
 * **A PERGUNTA DE QUEM FAZ FOLLOW-UP NÃO É "QUE ENCONTRO?", É "QUEM HOJE?"** O
 * prazo corre por pessoa — D+0, D+3, D+7 a partir do dia em que ELA veio —, e
 * duas pessoas do mesmo encontro podem estar em degraus diferentes. Escolher o
 * encontro antes de começar é ordenar o trabalho pelo eixo errado.
 *
 * O plano previu este momento: enquanto o follow-up fosse navegação dentro de
 * um encontro, ele era aba do encontro; ao virar fila transversal, ganha lugar
 * próprio. Este é o lugar.
 *
 * A REGRA NÃO MORA AQUI. Quem vence e em que degrau é `follow_ups_vencidos()`,
 * em `eventos-comum.php`, a mesma função que o hub e a aba do encontro usam —
 * sem argumento ela já responde pelo movimento inteiro, numa passada só.
 */

require_once __DIR__ . '/eventos-comum.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sessao.php';

/**
 * A fila, agrupada por degrau.
 *
 * Por degrau, e não por encontro: cada degrau é uma mensagem diferente, e quem
 * senta para escrever manda a mesma vinte vezes com o nome trocado. O encontro
 * vira uma linha dentro do cartão — ele importa para o texto ("obrigado por ter
 * vindo ao Benfica"), não para a ordem do trabalho.
 */
function bloco_follow_up(array $eu, array $vencidos, string $busca): void
{
    if ($busca !== '') {
        $vencidos = array_values(array_filter(
            $vencidos,
            fn ($v) => combina_com(
                [$v[0]['pessoa']['nome'], $v[0]['pessoa']['cidade'], $v[0]['pessoa']['bairro'],
                 $v[0]['evento']['titulo'] ?? ''],
                $busca
            )
        ));
    }

    $porEtapa = ['d0' => [], 'd3' => [], 'd7' => []];
    foreach ($vencidos as [$l, $etapa]) {
        $porEtapa[$etapa][] = $l;
    }
    ?>
  <fieldset id="funil">
    <legend>Follow-up vencido (<?= count($vencidos) ?>)</legend>
    <p class="dica">
      Todos os encontros juntos. Lead sem segunda mensagem é lead perdido —
      D+0 agradecer · D+3 conteúdo · D+7 convite.
    </p>
    <p class="dica" style="margin:0 0 18px">
      <strong>Só aparece quem ainda não está na estrutura.</strong> Assim que alguém
      vira Militante na ficha, sai daqui: o funil acabou de fazer o que existia
      para fazer. Quem não responde às três mensagens não se perde — segue para a
      <a href="/painel/pessoas.php?tipo=reativar#reativar">lista de reativação</a>,
      onde a conversa recomeça pelo motivo certo.
    </p>

    <?php if ($vencidos === []): ?>
      <?php nada_encontrado(
          $busca,
          '/painel/eventos.php?aba=follow-up',
          'Nada vencido em encontro nenhum. É esse o objetivo: ninguém aparece e some.'
      ); ?>
    <?php endif; ?>

    <?php foreach ($porEtapa as $etapa => $lista): ?>
      <?php if ($lista === []) { continue; } ?>
      <h3 class="funil-degrau">
        <span class="selo selo-off"><?= h(strtoupper($etapa)) ?></span>
        <span><?= h(ROTULO_FUNIL[$etapa]) ?> (<?= count($lista) ?>)</span>
      </h3>
      <?php foreach ($lista as $l): ?>
        <article class="ficha">
          <header class="ficha-topo">
            <span class="ficha-quem">
              <strong><?= h($l['pessoa']['nome']) ?></strong>
              <span>
                <?php /* O ENCONTRO APARECE AQUI, e é a diferença desta tela para
                         a do encontro: lá ele é o contexto inteiro, aqui é o que
                         a mensagem precisa citar pelo nome. "Obrigado por ter
                         vindo" é genérico; "obrigado por ter vindo ao Benfica"
                         é conversa. */ ?>
                <?= h($l['evento']['titulo']) ?>
                <?php $onde = trim($l['pessoa']['bairro'] . ($l['pessoa']['cidade'] !== '' ? ', ' . $l['pessoa']['cidade'] : ''), ', '); ?>
                <?= $onde !== '' ? ' · ' . h($onde) : '' ?>
              </span>
            </span>
          </header>
          <div class="acoes">
            <?php if ($l['pessoa']['telefone'] !== '' && pode_ver_telefone($l, $eu)): ?>
              <?php links_whatsapp($l['pessoa']['telefone'], 'Abrir WhatsApp', '', 'btn btn-mini'); ?>
            <?php endif; ?>
            <form method="post" style="display:inline">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($l['eventoId']) ?>">
              <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
              <input type="hidden" name="acao" value="funil">
              <input type="hidden" name="etapa" value="<?= h($etapa) ?>">
              <?php /* A volta é para a FILA, e não para o encontro de onde a
                       linha saiu: quem está marcando a décima mensagem do dia
                       quer a décima primeira, e não a tela de um encontro que
                       ele nem escolheu abrir. */ ?>
              <input type="hidden" name="volta" value="fila">
              <button type="submit" class="btn btn-ouro">Marcar como feito</button>
            </form>
          </div>
        </article>
      <?php endforeach; ?>
    <?php endforeach; ?>
  </fieldset>
    <?php
}
