<?php
declare(strict_types=1);

/**
 * Procurar em tudo — felipesmoreira.com/painel/procurar
 *
 * A pergunta mais comum do grupo da coordenação é "cadê o Fulano?", e quem a
 * faz raramente sabe em que tela Fulano está: pode ser uma pessoa do cadastro,
 * um candidato, o dono de um card ou o nome de um encontro. Ir tela por tela
 * procurando é o que esta existe para acabar.
 *
 * NÃO É UMA ÁREA. Não entra em `AREAS`, não aparece no menu e não pede
 * permissão própria — ela alcança exatamente o que a pessoa já podia abrir, e
 * nada além. Quem tem uma área só recebe uma seção de resultados; quem não tem
 * nenhuma recebe a mesma tela vazia que já vê no hub.
 *
 * A caixa mora na moldura (`layout.php`), como a navegação: busca que só se
 * acha voltando para uma tela específica é busca que não se usa.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/procurar-comum.php';
exigir_login();

$u = usuario_atual();
$busca = limpar_texto($_GET['q'] ?? '', 60);
$achados = procurar_em_tudo($busca);
$quantos = array_sum(array_map(fn ($g) => $g['total'], $achados));

abrir_pagina($busca !== '' ? 'Procurar: ' . $busca : 'Procurar');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Procurar',
      'Pessoas, encontros, fatos, cards, candidatos e peças — tudo que você abre, numa busca só.',
      null,
      null,
      [
          'Digite um pedaço do nome, do número de urna ou do WhatsApp: dígito casa com dígito.',
          'A busca ignora acento e maiúscula, mas não adivinha grafia.',
          'Ela só alcança as áreas que você já abre — procurar não é uma porta lateral.',
          'Cada tela continua com a busca dela, que é a certa quando você já sabe onde procurar.',
      ]
  ); ?>

  <?php barra_busca($busca, 'nome, número, telefone, título…'); ?>

  <?php if ($busca === ''): ?>
    <p class="dica" style="margin:0">
      Digite o que você está procurando. Vale nome de gente, nome de encontro,
      número de urna, telefone, título de card ou trecho de um fato.
    </p>

  <?php elseif (mb_strlen($busca) < 2): ?>
    <?php /* Uma letra casa com metade do cadastro: devolver tudo é pior que
             devolver nada, e não dizer por quê é pior ainda. */ ?>
    <p class="dica" style="margin:0">Escreva pelo menos duas letras.</p>

  <?php elseif ($achados === []): ?>
    <?php nada_encontrado($busca, '/painel/procurar.php', ''); ?>
    <p class="dica">
      Procurei em: <?= h(implode(' · ', array_map(fn ($a) => AREAS[$a], areas_do_usuario()))) ?: 'nenhuma área' ?>.
    </p>

  <?php else: ?>
    <p class="dica" style="margin:-6px 0 18px">
      <?= $quantos ?> <?= $quantos === 1 ? 'resultado' : 'resultados' ?>
      em <?= count($achados) ?> <?= count($achados) === 1 ? 'área' : 'áreas' ?>.
    </p>

    <?php foreach ($achados as $area => $grupo): ?>
      <fieldset>
        <legend>
          <?= h($grupo['rotulo']) ?> (<?= $grupo['total'] ?>)
        </legend>
        <?php foreach ($grupo['itens'] as $item): ?>
          <a class="area-cartao" href="<?= h($item['url']) ?>">
            <span class="area-icone"><?= icone($grupo['icone']) ?></span>
            <span class="area-texto">
              <strong><?= h($item['titulo']) ?></strong>
              <?php if ($item['sub'] !== ''): ?>
                <span><?= h($item['sub']) ?></span>
              <?php endif; ?>
            </span>
          </a>
        <?php endforeach; ?>

        <?php if ($grupo['total'] > count($grupo['itens'])): ?>
          <?php /* O resto mora na tela da área, com os filtros dela — repetir
                   aqui a lista inteira seria construir uma segunda tela de
                   pessoas, sempre um passo atrás da verdadeira. */ ?>
          <p class="dica" style="margin:10px 0 0">
            E mais <?= $grupo['total'] - count($grupo['itens']) ?> em
            <a href="<?= h(DESTINO_AREA[$area]['url']) ?>?q=<?= h(rawurlencode($busca)) ?>">
              <?= h($grupo['rotulo']) ?>
            </a>.
          </p>
        <?php endif; ?>
      </fieldset>
    <?php endforeach; ?>
  <?php endif; ?>
</div>
<?php
fechar_pagina();
