<?php
declare(strict_types=1);

/**
 * UM ENCONTRO ABERTO — a moldura da tela `/painel/eventos?e=<id>` e a aba
 * Preparo.
 *
 * Este arquivo é o maestro: calcula o estado que a tela inteira usa, desenha o
 * cabeçalho, o resumo e as abas, e chama o bloco de cada aba. As outras duas
 * abas moram em arquivos próprios (`eventos-presenca.php`, `eventos-dados.php`)
 * porque são longas e independentes; o Preparo fica aqui porque é curto e é a
 * aba padrão — quem abre o arquivo do encontro quer ver primeiro o que a tela
 * mostra por primeiro.
 *
 * A tela é longa por natureza — playbook, cinco peças, lista de gente,
 * follow-up, dados — e empilhada obrigava a rolar às cegas para chegar em
 * "Pessoas" no celular. Foi um índice de âncoras antes de virar três abas.
 */

require_once __DIR__ . '/eventos-presenca.php';
require_once __DIR__ . '/eventos-dados.php';

/**
 * Desenha a tela de um encontro, da moldura à aba escolhida.
 *
 * O ESTADO É CALCULADO UMA VEZ, AQUI. `$preparo`, `$naLista` e `$vencidos`
 * aparecem no resumo, na contagem das abas e dentro dos blocos — recalculá-los
 * em cada lugar é como duas telas passam a discordar sobre o mesmo encontro.
 */
function tela_do_encontro(array $aberto, array $eu, bool $coordena, ?string $erro, ?string $ok): void
{
    $familia = FAMILIAS[$aberto['familia']];
    $preparo = preparo_do_evento($aberto);
    $naLista = count(presencas_do_evento($aberto['id']));
    /* Sobre a lista INTEIRA, e nunca sobre o recorte da busca: o follow-up
       vencido é o que está devendo, e escondê-lo porque alguém digitou um nome
       na caixa seria esconder trabalho. */
    $vencidos = $coordena ? follow_ups_vencidos($aberto) : [];

    /* Três abas, na ordem do encontro: PREPARO antes, PESSOAS durante e depois,
       DADOS é o ajuste que se faz uma vez.

       São links (`?aba=…`), como em toda aba do painel: cada uma tem URL
       própria, o Voltar do navegador funciona e dá para mandar no grupo o link
       já na aba certa. */
    $abasDoEncontro = [
        'preparo' => ['nome' => 'Preparo', 'conta' => $preparo['feito'] . '/' . $preparo['total']],
        /* O número da aba é o da lista inteira, e não o do recorte: a aba diz
           quantos estão no encontro, e não quantos casam com o que foi
           digitado. */
        'pessoas' => ['nome' => 'Pessoas', 'conta' => $naLista],
    ];
    /* Dados é da coordenação: quem executa marca checklist e recebe gente, não
       muda data, local nem o que vai para a programação pública. Forçar
       `?aba=dados` na URL cai no Preparo, porque a aba nem existe no array. */
    if ($coordena) {
        $abasDoEncontro['dados'] = ['nome' => 'Dados'];
    }
    $aba = (string) ($_GET['aba'] ?? '');
    if (!isset($abasDoEncontro[$aba])) {
        $aba = 'preparo';
    }

    abrir_pagina($aberto['titulo']);
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      $aberto['titulo'],
      $familia['nome'] . ' · ' . data_cheia($aberto)
      . ($aberto['local'] !== '' ? ' · ' . $aberto['local'] : '')
      . ' · ' . STATUS_EVENTO[$aberto['status']],
      ['url' => '/painel/eventos.php', 'texto' => 'Todos os encontros'],
      '/painel/eventos'
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php desenhar_resumo_do_encontro($aberto, $vencidos, $coordena); ?>

  <?php barra_abas($abasDoEncontro, $aba, 'aba', 'Seções do encontro'); ?>

  <?php if ($aba === 'preparo') { desenhar_preparo($aberto, $familia, $preparo); } ?>

  <?php if ($aba === 'pessoas'): ?>
    <?php desenhar_presenca($aberto, $eu); ?>
    <?php if ($coordena) { desenhar_funil($aberto, $eu, $vencidos); } ?>
  <?php endif; ?>

  <?php if ($aba === 'dados' && $coordena) { desenhar_dados($aberto, pessoas_ativas(), $naLista); } ?>
</div>

<?php /* O `.qr-arte` só existe na aba Pessoas: baixar o desenhador nas outras
         seria pagar um arquivo para não desenhar nada. */ ?>
<?php if ($aberto['token'] !== '' && $aba === 'pessoas'): ?>
  <script src="/painel/vendor/qrcode.js?v=<?= VERSAO_ESTILO ?>"></script>
  <script>
    /* Desenha o QR em SVG. Servido do próprio domínio (ver vendor/LEIA-ME.md):
       nada do visitante vai para CDN de terceiro.

       Correção de erro nível M: aguenta o papel sujo ou amassado da mesa de
       recepção sem parar de ler, e ainda cabe numa folha pequena. */
    document.querySelectorAll('.qr-arte').forEach(function (alvo) {
      var qr = qrcode(0, 'M');
      qr.addData(alvo.dataset.qr);
      qr.make();
      alvo.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    });
  </script>
<?php endif; ?>
<?php
    fechar_pagina();
}

/**
 * A faixa de números acima das abas.
 *
 * A tela tem três abas, e o número que importa mora sempre na aba em que a
 * pessoa NÃO está: quem marca checklist no Preparo quer saber quantos
 * confirmaram, quem recebe na porta quer saber quanto do preparo ficou de pé.
 * Antes era preciso trocar de aba para consultar e voltar perdendo o lugar.
 *
 * Ela fica ACIMA das abas de propósito: é o que vale para o encontro inteiro, e
 * não o conteúdo de uma seção. Os números saem da lista inteira, nunca do
 * recorte da busca.
 */
function desenhar_resumo_do_encontro(array $aberto, array $vencidos, bool $coordena): void
{
    $preparo = preparo_do_evento($aberto);
    $confirmaram  = 0;
    $compareceram = 0;
    foreach (presencas_do_evento($aberto['id']) as $l) {
        $confirmaram  += $l['confirmou'] ? 1 : 0;
        $compareceram += $l['compareceu'] ? 1 : 0;
    }
    $naLista = count(presencas_do_evento($aberto['id']));
    /* Quantos dias faltam. null quando o encontro não tem instante — e aí não
       há contagem nenhuma a fazer, o que é diferente de faltarem zero dias.

       Sai de `inicio`, nunca de `data`: aquele é o instante, este é o "24/08"
       de exibição, que strtotime() não lê. Ver `dias_ate_o_dia()`. */
    $faltamDias = dias_ate_o_dia($aberto['inicio']);
    ?>
  <section class="resumo-encontro">
    <dl class="resumo-numeros">
      <div<?= $faltamDias !== null && $faltamDias >= 0 && $faltamDias <= 2 ? ' class="resumo-perto"' : '' ?>>
        <dt>Quando</dt>
        <dd>
          <?php if ($faltamDias === null): ?>
            <small>sem data</small>
          <?php elseif ($faltamDias < 0): ?>
            <small>já aconteceu</small>
          <?php elseif ($faltamDias === 0): ?>
            hoje
          <?php elseif ($faltamDias === 1): ?>
            amanhã
          <?php else: ?>
            <?= $faltamDias ?><small> dias</small>
          <?php endif; ?>
        </dd>
      </div>
      <div<?= $preparo['total'] > 0 && $preparo['feito'] < $preparo['total']
             && $faltamDias !== null && $faltamDias >= 0 && $faltamDias <= 2 ? ' class="resumo-alerta"' : '' ?>>
        <dt>Preparo</dt>
        <dd><?= $preparo['feito'] ?><small>/<?= $preparo['total'] ?></small></dd>
      </div>
      <div>
        <dt>Confirmaram</dt>
        <dd><?= $confirmaram ?><?php if ($aberto['publicoEsperado'] > 0): ?><small>/<?= (int) $aberto['publicoEsperado'] ?> esperados</small><?php endif; ?></dd>
      </div>
      <div>
        <dt>Compareceram</dt>
        <dd><?= $compareceram ?></dd>
      </div>
      <?php /* O follow-up é da coordenação: quem só executa não vê telefone nem
               responde por lead, e um número que ele não pode zerar é cobrança
               sem porta. */ ?>
      <?php if ($coordena): ?>
        <div<?= $vencidos !== [] ? ' class="resumo-alerta"' : '' ?>>
          <dt>Follow-up vencido</dt>
          <dd><?= count($vencidos) ?></dd>
        </div>
      <?php endif; ?>
    </dl>

    <?php /* ---------- as próximas ações ----------
             O que fazer AGORA neste encontro, e não a lista do que existe: a
             ordem é a do relógio, e a barra some inteira quando não sobrou
             nada. Barra de ação vazia é ruído com moldura. */ ?>
    <?php
    $proximas = [];
    if ($coordena && $vencidos !== []) {
        $proximas[] = [
            'texto' => count($vencidos) === 1
                ? 'Fazer 1 follow-up vencido'
                : 'Fazer ' . count($vencidos) . ' follow-ups vencidos',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=pessoas#funil',
            'ouro'  => true,
        ];
    }
    if ($preparo['total'] > 0 && $preparo['feito'] < $preparo['total']
        && ($faltamDias === null || $faltamDias >= 0)) {
        $proximas[] = [
            'texto' => 'Terminar o preparo (' . ($preparo['total'] - $preparo['feito']) . ' a conferir)',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=preparo#preparo',
            /* Ouro só quando o encontro está em cima: durante a semana o preparo
               incompleto é normal, e ouro é o botão de apertar agora. */
            'ouro'  => $faltamDias !== null && $faltamDias <= 2,
        ];
    }
    if ($faltamDias !== null && $faltamDias <= 0 && $compareceram === 0 && $naLista > 0) {
        $proximas[] = [
            'texto' => 'Marcar quem chegou',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=pessoas#pessoas',
            'ouro'  => true,
        ];
    }
    ?>
    <?php if ($proximas !== []): ?>
      <div class="resumo-acoes">
        <div class="acoes">
          <?php foreach (array_slice($proximas, 0, 3) as $acao): ?>
            <a class="btn btn-mini<?= $acao['ouro'] ? ' btn-ouro' : '' ?>" href="<?= h($acao['url']) ?>">
              <?= h($acao['texto']) ?>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    <?php endif; ?>
  </section>
  <?php
}

/**
 * A ABA PREPARO: o playbook da família e as cinco peças com seus checklists.
 *
 * As peças não conferidas nascem abertas e as prontas nascem fechadas — quem
 * abre esta aba vem terminar o que falta, não revisar o que já está feito.
 */
function desenhar_preparo(array $aberto, array $familia, array $preparo): void
{
    ?>
  <fieldset>
    <legend>Playbook — <?= h($familia['nome']) ?></legend>
    <p class="dica" style="margin:0 0 12px"><strong>Serve para:</strong> <?= h($familia['serve']) ?></p>
    <p class="dica" style="margin:0 0 12px"><strong>Métrica de sucesso:</strong> <?= h($familia['metrica']) ?></p>

    <div class="msg msg-erro">
      <strong>Travas desta família</strong>
      <ul class="lista-travas">
        <?php foreach ($familia['travas'] as $t): ?>
          <li><?= h($t) ?></li>
        <?php endforeach; ?>
      </ul>
    </div>

    <p class="dica"><strong>Material específico:</strong> <?= h(implode(' · ', $familia['material'])) ?></p>
  </fieldset>

  <fieldset id="preparo">
    <legend>As cinco peças — preparo <?= $preparo['feito'] ?>/<?= $preparo['total'] ?></legend>

    <?php foreach (PECAS as $chave => $peca): ?>
      <?php
        $lista = checklist($peca['checklist']);
        $marcados = $aberto['feitos'][$chave] ?? [];
        $responsavel = achar_pessoa($aberto['responsaveis'][$chave]);
      ?>
      <details class="item" id="peca-<?= h($chave) ?>" <?= count($marcados) < count($lista['itens']) ? 'open' : '' ?>>
        <summary class="item-topo">
          <span class="item-num" aria-hidden="true"><?= count($marcados) === count($lista['itens']) ? '✓' : '·' ?></span>
          <span class="item-resumo">
            <strong><?= h($peca['nome']) ?></strong>
            <span><?= count($marcados) ?>/<?= count($lista['itens']) ?><?= $responsavel ? ' · ' . h($responsavel['nome']) : ' · sem dono' ?></span>
          </span>
        </summary>
        <div class="item-corpo">
          <?php foreach ($lista['itens'] as $i => $texto): ?>
            <form method="post" class="risco-linha">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
              <input type="hidden" name="acao" value="marcar">
              <input type="hidden" name="peca" value="<?= h($chave) ?>">
              <input type="hidden" name="item" value="<?= $i ?>">
              <button type="submit" class="risco<?= in_array($i, $marcados, true) ? ' risco-feito' : '' ?>">
                <span class="risco-caixa" aria-hidden="true"><?= in_array($i, $marcados, true) ? '✓' : '' ?></span>
                <span><?= h($texto) ?></span>
              </button>
            </form>
          <?php endforeach; ?>
        </div>
      </details>
    <?php endforeach; ?>
  </fieldset>
  <?php
}
