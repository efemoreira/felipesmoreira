<?php
declare(strict_types=1);

/**
 * O QUADRO: o recorte, os atalhos de coluna e as quatro colunas.
 *
 * O QUADRO INTEIRO É PENEIRADO DE UMA VEZ, e não coluna por coluna: procurar um
 * card é procurar em que coluna ele está — se a busca recortasse só a coluna
 * aberta, a resposta seria "não achei" justamente quando ele existe. As colunas
 * vazias continuam desenhadas, com o número em zero: é a moldura do quadro que
 * diz onde o card **não** está.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/producao-card.php';
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/sessao.php';

/**
 * Recorta o quadro pelo que veio na URL.
 *
 * Devolve tudo que a tela precisa saber sobre o recorte, de uma vez: quem sabe
 * quantos casam é quem os separou por coluna, e calcular o contador longe da
 * lista é como os dois passam a discordar.
 */
function recorte_do_quadro(array $eu, string $hoje): array
{
      $buscaPr = limpar_texto($_GET['q'] ?? '', 60);
      $etapaF  = (string) ($_GET['etapa'] ?? '');
      if (!isset(ETAPAS[$etapaF])) {
          $etapaF = '';
      }
      /* "Meus" e "Sem dono" são as duas perguntas que se fazem num quadro cheio —
         o que eu estou devendo, e o que está largado esperando alguém. */
      $donoF = in_array($_GET['dono'] ?? '', ['meus', 'sem-dono', 'atrasados'], true) ? (string) $_GET['dono'] : '';

      $recortePr = function (array $c) use ($buscaPr, $etapaF, $donoF, $eu, $hoje) {
          if ($buscaPr !== '' && !combina_com([$c['titulo'], $c['donoNome'], $c['responsavel'], $c['fonteUrl'], nome_de_arquivo($c)], $buscaPr)) {
              return false;
          }
          if ($etapaF !== '' && $c['etapa'] !== $etapaF) {
              return false;
          }
          return match ($donoF) {
              'meus'      => $c['donoId'] === $eu['id'],
              'sem-dono'  => $c['donoId'] === '',
              'atrasados' => $c['coluna'] !== 'publicado' && $c['prazo'] !== '' && $c['prazo'] < $hoje,
              default     => true,
          };
      };

      $porColuna = [];
      $quantosCards = 0;
      $porEtapa = [];
      foreach (COLUNAS as $chave => $nome) {
          $daColuna = cards_da_coluna($chave);
          $quantosCards += count($daColuna);
          foreach ($daColuna as $c) {
              $porEtapa[$c['etapa']] = ($porEtapa[$c['etapa']] ?? 0) + 1;
          }
          $porColuna[$chave] = array_values(array_filter($daColuna, $recortePr));
      }
      $achados = array_sum(array_map('count', $porColuna));
      $recortado = $buscaPr !== '' || $etapaF !== '' || $donoF !== '';

      /* Qual card está aberto para correção. É um GET (`?editar=<id>`) e não estado
         de JavaScript: sem JS a página recarrega com o `<dialog open>` e o
         formulário continua ali. */
      $corrigindo = achar_card(limpar_texto($_GET['editar'] ?? '', 40));

    return [
        'busca' => $buscaPr, 'etapa' => $etapaF, 'dono' => $donoF,
        'porColuna' => $porColuna, 'porEtapa' => $porEtapa,
        'achados' => $achados, 'quantos' => $quantosCards,
        'recortado' => $recortado, 'corrigindo' => $corrigindo,
    ];
}

/**
 * As quatro colunas, com os atalhos que as alcançam no celular.
 *
 * No celular o quadro vira uma pilha de quatro colunas: sem a faixa de atalhos,
 * chegar em "Revisão" é rolar às cegas.
 */
function bloco_quadro(array $recorte, array $eu, string $hoje): void
{
    $porColuna = $recorte['porColuna'];
    $recortado = $recorte['recortado'];
    ?>
  <?php /* No celular o quadro vira uma pilha de quatro colunas: sem esta faixa,
           chegar em "Revisão" é rolar às cegas. */ ?>
  <nav class="atalho-colunas" aria-label="Colunas do quadro">
    <?php foreach (COLUNAS as $chave => $nome): ?>
      <a href="#coluna-<?= h($chave) ?>"><?= h($nome) ?> <span><?= count($porColuna[$chave]) ?></span></a>
    <?php endforeach; ?>
  </nav>

  <div class="quadro">
    <?php foreach (COLUNAS as $chave => $nome): ?>
      <?php $daColuna = $porColuna[$chave]; ?>
      <section class="coluna" id="coluna-<?= h($chave) ?>">
        <h2 class="coluna-topo">
          <?= h($nome) ?>
          <span class="coluna-conta"><?= count($daColuna) ?></span>
        </h2>

        <?php if ($daColuna === []): ?>
          <?php /* Tela vazia é onboarding: dizer o que vai cair aqui e quem põe
                   ensina o fluxo do manual sem obrigar ninguém a decorá-lo. Com
                   recorte ligado a coluna não está vazia, está recortada — e dizer
                   ali o texto de onboarding seria mentir sobre o quadro. */ ?>
          <p class="dica coluna-vazia">
            <?= $recortado ? 'Nada com esse recorte.' : h(COLUNA_VAZIA[$chave] ?? 'Vazio.') ?>
          </p>
        <?php endif; ?>

        <?php foreach ($daColuna as $c): ?>
          <?php desenhar_card($c, $chave, $eu, $hoje); ?>
        <?php endforeach; ?>
      </section>
    <?php endforeach; ?>
  </div>
  <?php
}
