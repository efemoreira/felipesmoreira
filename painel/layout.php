<?php
declare(strict_types=1);

/**
 * Moldura das páginas do painel — cabeçalho, navegação e rodapé.
 *
 * Todas as telas (agenda, usuários, conta e o próprio hub) passam por aqui, para
 * a barra de cima mostrar sempre as mesmas áreas: exatamente as que a pessoa
 * logada pode abrir, nem uma a mais.
 *
 * A barra também mostra QUANTAS coisas esperam em cada área, com o número vindo
 * do agora.php. Sem isso, descobrir que a fila da Checagem estourou exigia
 * voltar ao hub — e fila que não se vê é fila que dorme.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/icones.php';
require_once __DIR__ . '/agora.php';

/** Versão do CSS — muda junto com o painel.css para furar o cache do navegador. */
const VERSAO_ESTILO = '8';

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
    $pendencias = contagens_por_area($u);
    // as áreas de trabalho ficam à esquerda; conta e saída, separadas à direita
    $links = [['index.php', '/painel/', 'Início', 'home', 0]];
    foreach (areas_do_usuario() as $area) {
        $links[] = [
            basename(DESTINO_AREA[$area]['url']),
            DESTINO_AREA[$area]['url'],
            AREAS[$area],
            ICONE_AREA[$area] ?? 'star',
            $pendencias[$area] ?? 0,
        ];
    }
    if (e_admin()) {
        $links[] = ['usuarios.php', '/painel/usuarios.php', 'Usuários', 'users', 0];
    }
    ?>
    <nav class="nav" aria-label="Áreas do painel">
      <?php foreach ($links as [$arquivo, $url, $rotulo, $icone, $quantas]): ?>
        <a href="<?= h($url) ?>"<?= $aqui === $arquivo ? ' aria-current="page"' : '' ?>>
          <span class="nav-icone"><?= icone($icone, 18) ?></span>
          <?= h($rotulo) ?>
          <?php if ($quantas > 0): ?>
            <span class="nav-conta-pend" aria-label="<?= $quantas ?> esperando"><?= $quantas ?></span>
          <?php endif; ?>
        </a>
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
  <?php /* A faixa rola de lado no celular: sem isto, quem abre a Produção não vê
           que está na Produção, porque a aba atual pode ficar fora da tela. */ ?>
  <script>
  (function () {
    var atual = document.querySelector('.nav a[aria-current="page"]');
    if (atual && atual.scrollIntoView) {
      atual.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  })();
  </script>
<?php endif;
}

/**
 * O cabeçalho de uma tela: título, uma linha do que ela faz e, quando existe, o
 * caminho de volta e a aula que ensina a usar aquilo.
 *
 * Existe para as telas não divergirem: antes cada uma escrevia o próprio h1 e o
 * próprio jeito de voltar, e o detalhe do encontro voltava por um link solto
 * dentro de um parágrafo de subtítulo.
 *
 * @param array|null  $voltar     ['url' => ..., 'texto' => ...]
 * @param string|null $ferramenta caminho da ferramenta no currículo, ex: /painel/fatos
 */
function cabecalho_pagina(string $titulo, string $sub = '', ?array $voltar = null, ?string $ferramenta = null): void
{
    if ($voltar !== null) {
        echo '<p class="voltar"><a href="' . h($voltar['url']) . '">'
            . icone('arrowLeft', 16) . ' ' . h($voltar['texto']) . '</a></p>';
    }

    echo '<h1>' . h($titulo) . '</h1>';

    /* A aula só aparece para quem tem a formação liberada — para o resto seria
       um link que abre uma porta fechada. */
    $aulas = [];
    if ($ferramenta !== null && pode('aulas')) {
        require_once __DIR__ . '/aulas-comum.php';
        $aulas = aulas_da_ferramenta($ferramenta);
    }

    if ($sub !== '' || $aulas !== []) {
        echo '<p class="sub">' . $sub;
        if ($aulas !== []) {
            $a = $aulas[0];
            echo ' <a class="sub-aula" href="/aulas#' . h($a['id']) . '">Como se faz '
                . icone('chevronRight', 14) . '</a>';
        }
        echo '</p>';
    }
}

function fechar_pagina(): void
{
    ?>
</body>
</html>
<?php
}

/**
 * Caixinha de recado no topo do conteúdo.
 *
 * Fica grudada no topo (`position:sticky`) porque toda ação do painel termina
 * em POST-redirect-GET com âncora: o navegador salta para o item mexido e a
 * confirmação, se fosse estática, ficaria acima da dobra sem ninguém ver.
 */
function recado(?string $erro, ?string $ok): void
{
    if (!$erro && !$ok) {
        return;
    }
    echo '<div class="recado-zona" role="status" aria-live="polite">';
    if ($erro) {
        echo '<p class="msg msg-erro">' . h($erro) . '</p>';
    }
    if ($ok) {
        echo '<p class="msg msg-ok">' . h($ok) . '</p>';
    }
    echo '</div>';
}
