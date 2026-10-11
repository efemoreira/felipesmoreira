<?php
declare(strict_types=1);

/**
 * O CERTIFICADO DA FORMAÇÃO BÁSICA — felipesmoreira.com/painel/certificado.php
 *
 * Folha A4 para imprimir ou salvar em PDF, sem a moldura do painel (como o
 * cartaz da recepção). Cada um vê o próprio; quem abre a Formação (área
 * `aulas`) pode pedir o de outra pessoa com `?p=<id>`. Sem a Básica
 * concluída, não há certificado — a tela diz quanto falta.
 *
 * É a "comprovação" que a Liga dos Porta-vozes pede para o nível B.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/formacao-comum.php';
require_once __DIR__ . '/escada-comum.php';  // hoje_ce()

exigir_login();
$eu = usuario_atual() ?? [];
$id = (string) ($_GET['p'] ?? $eu['id']);
if ($id !== $eu['id'] && !pode('aulas')) {
    $id = $eu['id'];
}
$pessoa = achar_pessoa($id);
$formacao = formacao_da_pessoa($id);
$basica = $formacao['basica'] ?? ['feitas' => 0, 'total' => 0, 'concluidoEm' => ''];
$meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
$porExtenso = function (string $iso) use ($meses): string {
    [$a, $m, $d] = array_map('intval', explode('-', $iso));
    return $d . ' de ' . $meses[$m - 1] . ' de ' . $a;
};

abrir_pagina('Certificado', false);
?>
<main class="cartaz-papel">
  <?php if ($pessoa === null || $basica['concluidoEm'] === ''): ?>
    <p class="cartaz-kicker">Formação de militância</p>
    <h1 class="cartaz-titulo">Ainda não</h1>
    <p class="cartaz-como">
      A trilha Básica tem <?= (int) $basica['total'] ?> aulas<?= $pessoa ? ' e ' . (int) $basica['feitas'] . ' estão concluídas' : '' ?>.
      O certificado sai quando a última for marcada em <a href="/aulas">/aulas</a>.
    </p>
  <?php else: ?>
    <p class="cartaz-kicker">Missão Ceará · formação de militância</p>
    <h1 class="cartaz-titulo">Certificado</h1>
    <p class="cartaz-como">
      Certificamos que <strong><?= h($pessoa['nome']) ?></strong> concluiu a trilha
      <strong>Básica</strong> da formação de militância da Missão Ceará —
      <?= (int) $basica['total'] ?> aulas sobre as regras que valem para todos, ética,
      comunicação e como o time se organiza — em <?= h($porExtenso($basica['concluidoEm'])) ?>.
    </p>
    <p class="cartaz-nota">Coordenação de militância · felipesmoreira.com</p>
    <div class="cartaz-acoes"><button class="btn btn-ouro" type="button" data-imprimir>Imprimir ou salvar em PDF</button></div>
  <?php endif; ?>
  <p class="cartaz-nota"><a href="/painel/">Voltar ao painel</a></p>
</main>
<script nonce="<?= h(nonce_csp()) ?>">
  document.querySelector('[data-imprimir]')?.addEventListener('click', () => window.print());
</script>
<?php
fechar_pagina();
