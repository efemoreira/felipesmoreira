<?php
declare(strict_types=1);

/**
 * A ABA FOLLOW-UP de um encontro: o que se deve a quem apareceu.
 *
 * É DA COORDENAÇÃO, e quem confere isso é o chamador: quem só executa não vê
 * telefone nem responde por lead, e a aba nem existe no array de abas para ele.
 *
 * Aba própria, e não o rodapé da aba Pessoas. O funil é sobre quem veio, mas
 * não é o mesmo momento: a lista de presença se usa na porta, com o encontro
 * acontecendo, e o funil se usa na segunda-feira. Empilhados, o trabalho dos
 * dias seguintes ficava embaixo de cem linhas de presença — no celular, longe
 * demais para ser aberto.
 *
 * A ordem de dentro é a do prazo, e não a do nome: D+0 primeiro, porque o
 * agradecimento que atrasa é o que mais custa.
 */

require_once __DIR__ . '/eventos-comum.php';  // o modelo do encontro e da presença
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_abas(), abrir_modal() — a moldura
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo

/**
 * O follow-up vencido — D+0 agradecer · D+3 conteúdo · D+7 convidar.
 *
 * Quem chama é que confere `pode('agenda')`: o funil é da coordenação, e quem
 * só executa não vê telefone nem responde por lead. A trava mora no chamador
 * porque é ele que já decidiu quais abas desenhar.
 *
 * AGRUPADO POR DEGRAU, e não uma lista corrida de nomes. Cada degrau é uma
 * mensagem diferente: "obrigado por ter vindo" não se escreve junto com "olha
 * esse conteúdo" nem com "vem no próximo sábado". Numa lista corrida, quem
 * fazia o follow-up trocava de assunto a cada linha; agrupado, escreve-se uma
 * mensagem e ela serve para o grupo inteiro daquele degrau.
 *
 * O selo do degrau saiu de dentro de cada cartão e virou o título do grupo —
 * repetido em vinte cartões ele era ruído, e no título é a única coisa que
 * precisa ser lida antes de começar.
 */
function desenhar_funil(array $aberto, array $eu, array $vencidos): void
{
    /* A ordem dos degraus é a do prazo, e não a que veio na lista: o D+0
       atrasado é o que mais custa — agradecimento que chega tarde já não é
       agradecimento. */
    $porEtapa = ['d0' => [], 'd3' => [], 'd7' => []];
    foreach ($vencidos as [$l, $etapa]) {
        $porEtapa[$etapa][] = $l;
    }
    ?>
    <fieldset id="funil">
      <legend>Follow-up vencido (<?= count($vencidos) ?>)</legend>
      <p class="dica">
        Lead sem segunda mensagem é lead perdido. D+0 agradecer · D+3 conteúdo · D+7 convite.
      </p>
      <?php /* Dito na tela porque a ausência de um nome conhecido aqui parece
               falha do painel, e não regra: quem organiza vai procurar o
               militante que esteve no encontro e não vai encontrar. */ ?>
      <p class="dica" style="margin:0 0 18px">
        <strong>Só aparece quem ainda não está na estrutura.</strong> Assim que alguém vira
        Militante em <a href="?e=<?= h(rawurlencode($aberto['id'])) ?>&amp;aba=pessoas#pessoas">Pessoas</a>,
        sai daqui — o funil acabou de fazer o que existia para fazer.
      </p>
      <?php if ($vencidos === []): ?>
        <p class="dica" style="margin:0">
          Nada vencido. Ou ninguém fez check-in ainda, ou quem fez já é da militância.
        </p>
      <?php else: ?>
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
                    <?= h(TIPOS_PESSOA[$l['pessoa']['tipo']]) ?>
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
                  <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                  <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
                  <input type="hidden" name="acao" value="funil">
                  <input type="hidden" name="etapa" value="<?= h($etapa) ?>">
                  <button type="submit" class="btn btn-ouro">Marcar como feito</button>
                </form>
              </div>
            </article>
          <?php endforeach; ?>
        <?php endforeach; ?>
      <?php endif; ?>
    </fieldset>
    <?php
}
