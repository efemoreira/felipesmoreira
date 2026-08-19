<?php
declare(strict_types=1);

/**
 * Moldura das páginas do painel — cabeçalho, navegação e rodapé.
 *
 * Todas as telas (agenda, usuários, conta e o próprio hub) passam por aqui, para
 * a barra de cima mostrar sempre as mesmas áreas: exatamente as que a pessoa
 * logada pode abrir, nem uma a mais.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/icones.php';

/** Versão do CSS — muda junto com o painel.css para furar o cache do navegador. */
const VERSAO_ESTILO = '4';

function abrir_pagina(string $titulo, bool $comNav = true): void
{
    $u = usuario_atual();
    ?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= h($titulo) ?> — Painel Missão Ceará</title>
<link rel="stylesheet" href="/painel/painel.css?v=<?= VERSAO_ESTILO ?>">
</head>
<body>
<?php if ($comNav && $u !== null): ?>
  <div class="topo-painel">
    <span class="marca">Missão Ceará</span>
    <?php
    $aqui = basename((string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    // as áreas de trabalho ficam à esquerda; conta e saída, separadas à direita
    $links = [['index.php', '/painel/', 'Início']];
    foreach (areas_do_usuario() as $area) {
        $links[] = [basename(DESTINO_AREA[$area]['url']), DESTINO_AREA[$area]['url'], AREAS[$area]];
    }
    if (e_admin()) {
        $links[] = ['usuarios.php', '/painel/usuarios.php', 'Usuários'];
    }
    ?>
    <nav class="nav" aria-label="Áreas do painel">
      <?php foreach ($links as [$arquivo, $url, $rotulo]): ?>
        <a href="<?= h($url) ?>"<?= $aqui === $arquivo ? ' aria-current="page"' : '' ?>><?= h($rotulo) ?></a>
      <?php endforeach; ?>
    </nav>
    <span class="quem"><strong><?= h($u['nome']) ?></strong> · <?= h(PAPEIS[$u['papel']]) ?></span>
    <div class="nav nav-conta">
      <a href="/painel/conta.php"<?= $aqui === 'conta.php' ? ' aria-current="page"' : '' ?>>Minha senha</a>
      <form method="post" action="/painel/" style="display:inline">
        <input type="hidden" name="acao" value="sair">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <button type="submit">Sair</button>
      </form>
    </div>
  </div>
<?php endif;
}

function fechar_pagina(): void
{
    ?>
</body>
</html>
<?php
}

/** Caixinha de recado no topo do conteúdo. */
function recado(?string $erro, ?string $ok): void
{
    if ($erro) {
        echo '<p class="msg msg-erro">' . h($erro) . '</p>';
    }
    if ($ok) {
        echo '<p class="msg msg-ok">' . h($ok) . '</p>';
    }
}
