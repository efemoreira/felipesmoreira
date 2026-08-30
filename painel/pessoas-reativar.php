<?php
declare(strict_types=1);

/**
 * A LISTA DE QUEM CHAMAR DE VOLTA — o recorte "A reativar" de `/painel/pessoas`.
 *
 * Não é a tabela de pessoas com um filtro: é outra lista, com outra ordem e
 * outro texto. A tabela responde "quem é o Fulano"; esta responde "para quem eu
 * mando mensagem hoje, e o que eu digo".
 *
 * POR ISSO É AGRUPADA POR MOTIVO. Quem senta para chamar gente de volta manda
 * cinco vezes o mesmo texto com o nome trocado — não cinco textos diferentes em
 * ordem alfabética. Cada grupo abre com a frase do que dizer, e a lista embaixo
 * é só nome, telefone e o detalhe que a mensagem precisa citar.
 *
 * Mora em `/painel/pessoas` porque é ali que o telefone pode ser visto: chamar
 * alguém de volta é falar com a pessoa, e o acesso a dado pessoal acompanha a
 * responsabilidade sobre ele. A régua de QUEM entra na lista é `reativacao.php`.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/reativacao.php';
require_once __DIR__ . '/sessao.php';

function bloco_reativacao(array $grupos, string $busca): void
{
    if ($busca !== '') {
        foreach ($grupos as $chave => $lista) {
            $grupos[$chave] = array_values(array_filter(
                $lista,
                fn ($p) => combina_com([$p['nome'], $p['telefone'], $p['cidade'], $p['bairro']], $busca)
            ));
        }
    }
    $quantos = array_sum(array_map('count', $grupos));
    ?>
  <fieldset id="reativar">
    <legend>A reativar (<?= $quantos ?>)</legend>
    <p class="dica" style="margin:0 0 18px">
      Gente que já disse sim uma vez e esfriou. <strong>Crescer não é só entrar
      gente nova</strong> — quem já veio custa uma mensagem, e um inscrito novo
      custa um encontro inteiro. A lista é derivada do que o painel já grava:
      não há botão de “marcar como reativado”, e ninguém sai daqui por ser
      chamado, só por voltar.
    </p>

    <?php if ($quantos === 0): ?>
      <?php nada_encontrado(
          $busca,
          '/painel/pessoas.php?tipo=reativar',
          'Ninguém esfriando agora. É esse o objetivo.'
      ); ?>
    <?php endif; ?>

    <?php foreach ($grupos as $chave => $lista): ?>
      <?php if ($lista === []) { continue; } ?>
      <?php $m = MOTIVOS_REATIVACAO[$chave]; ?>

      <p class="funil-degrau">
        <?= h($m['nome']) ?>
        <span class="selo"><?= count($lista) ?></span>
      </p>
      <p class="dica" style="margin:0 0 12px"><?= h($m['oQue']) ?></p>

      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Quem</th><th>Há quanto tempo</th><th>O quê</th></tr></thead>
          <tbody>
            <?php foreach ($lista as $p): ?>
              <tr>
                <td>
                  <strong><?= h($p['nome']) ?></strong><br>
                  <span class="dica">
                    <?php if ($p['telefone'] !== ''): ?>
                      <?php links_whatsapp($p['telefone'], telefone_bonito($p['telefone'])); ?>
                    <?php endif; ?>
                    <?php $onde = trim($p['bairro'] . ($p['cidade'] !== '' ? ', ' . $p['cidade'] : ''), ', '); ?>
                    <?= $onde !== '' ? ' · ' . h($onde) : '' ?>
                  </span>
                </td>
                <td class="meia" data-rotulo="Há quanto tempo">
                  <?php $d = (int) $p['motivo']['dias']; ?>
                  <?= $d <= 0 ? 'hoje' : $d . ' ' . ($d === 1 ? 'dia' : 'dias') ?>
                </td>
                <td data-rotulo="O quê">
                  <?php /* O detalhe é o que a mensagem cita pelo nome: "você
                           confirmou o encontro do Benfica" abre conversa, "você
                           faltou a um encontro" fecha. */ ?>
                  <?= $p['motivo']['detalhe'] !== ''
                      ? h($p['motivo']['detalhe'])
                      : '<span class="dica">—</span>' ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endforeach; ?>
  </fieldset>
    <?php
}
