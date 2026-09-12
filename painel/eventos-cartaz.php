<?php
declare(strict_types=1);

/**
 * O CARTAZ DA RECEPÇÃO — a folha que vai na mesa e no colete.
 *
 * Até hoje "imprimir o cartaz" era imprimir a aba Pessoas: saía o QR, e saía
 * junto o texto para a coordenação, a lista de gente e o link de RSVP dobrado
 * num <details>. Na porta, ninguém sabia qual QR era qual — e são dois
 * links DE PROPÓSITO: o da porta marca presença; o do grupo confirma que vem.
 * Trocar um pelo outro é gente "presente" sem sair de casa.
 *
 * Esta é uma página só: sem moldura, sem menu, sem lista. O QR grande, a
 * palavra CHEGUEI, o encontro, e uma linha dizendo o que este QR é e o que
 * ele não é. `window.print()` abre sozinho.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/eventos-comum.php';

function tela_do_cartaz(array $aberto): void
{
    $url = url_presenca($aberto);
    $quando = trim(data_curta($aberto['inicio']) . ' · ' . hora_do_inicio($aberto['inicio']), ' ·');
    abrir_pagina('Cartaz — ' . $aberto['titulo'], false);
    ?>
<div class="cartaz-qr">
  <p class="cartaz-kicker">Missão Ceará · Recepção</p>
  <h1 class="cartaz-titulo"><?= h($aberto['titulo']) ?></h1>
  <p class="cartaz-quando"><?= h($quando) ?><?= $aberto['local'] !== '' ? ' · ' . h($aberto['local']) : '' ?></p>

  <div class="cartaz-papel">
    <div class="qr-arte cartaz-arte" data-qr="<?= h($url) ?>"></div>
    <p class="cartaz-cheguei">Cheguei</p>
    <p class="cartaz-como">Aponte a câmera do celular e marque a sua presença</p>
  </div>

  <p class="cartaz-nota">
    <strong>Este QR é o da porta:</strong> marca quem chegou. Confirmar que vem é
    outro link, que vai no grupo — não é este.
  </p>
  <p class="cartaz-url"><?= h($url) ?></p>

  <p class="cartaz-acoes">
    <button class="btn btn-ouro" type="button" data-imprimir>Imprimir</button>
    <a class="btn" href="/painel/eventos.php?e=<?= h(rawurlencode($aberto['id'])) ?>&aba=pessoas">Voltar ao encontro</a>
  </p>
</div>
<script src="/painel/vendor/qrcode.js?v=<?= VERSAO_ESTILO ?>"></script>
<script nonce="<?= h(nonce_csp()) ?>">
  /* O mesmo desenho da aba Pessoas, em SVG, servido do próprio domínio. */
  document.querySelectorAll('.qr-arte[data-qr]').forEach(function (el) {
    var qr = qrcode(0, 'M');
    qr.addData(el.dataset.qr);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  });
  document.querySelector('[data-imprimir]').addEventListener('click', function () { window.print(); });
</script>
    <?php
    fechar_pagina();
}
