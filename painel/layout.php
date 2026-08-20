<?php
declare(strict_types=1);

/**
 * Moldura das páginas do painel — lateral, barra do celular e rodapé.
 *
 * A NAVEGAÇÃO MORA AQUI, E SÓ AQUI. Antes ela aparecia duas vezes: uma fileira
 * de áreas no topo e a mesma lista repetida como grade no corpo do hub. Quem
 * entrava lia o menu duas vezes sem saber qual dos dois era o menu. Agora o
 * corpo de cada tela só tem trabalho; para onde ir é sempre a lateral.
 *
 * No computador é uma barra lateral fixa, agrupada pelo organograma do manual.
 * No celular vira uma barra fixa embaixo, no alcance do polegar, com os quatro
 * destinos que aquela pessoa mais usa e um "Mais" que abre a lista inteira —
 * navegação principal não se esconde em gaveta, só o secundário é que vai para
 * lá.
 *
 * O contador ao lado de cada área vem do agora.php. Fila que só se vê voltando
 * para a home é fila que dorme.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/icones.php';
require_once __DIR__ . '/agora.php';

/** Versão do CSS — muda junto com o painel.css para furar o cache do navegador. */
const VERSAO_ESTILO = '9';

/**
 * Os grupos da navegação, na ordem em que aparecem.
 *
 * Saem do organograma do manual (Comunicação e Eventos sob a coordenação), e
 * não do modelo de permissão — é assim que o time já fala de si mesmo.
 *
 * Início e Formação ficam fora de grupo, soltos no topo: são de todo mundo e
 * não pertencem a uma frente. Usuários entra em Coordenação, só para admin.
 *
 * ÁREA NOVA precisa entrar em um destes grupos, senão não aparece no menu.
 */
const GRUPOS_NAV = [
    'Comunicação' => ['fatos', 'producao', 'estudio'],
    'Encontros'   => ['eventos', 'agenda'],
    'Coordenação' => ['inscricoes'],
];

/** Rótulos curtos, para caber na barra do celular. */
const ROTULO_CURTO = [
    'fatos'      => 'Fatos',
    'producao'   => 'Produção',
    'estudio'    => 'Estúdio',
    'eventos'    => 'Encontros',
    'agenda'     => 'Agenda',
    'aulas'      => 'Aulas',
    'inscricoes' => 'Inscrições',
];

/** fechar_pagina() precisa saber se abriu a moldura, para não fechar div à toa. */
$GLOBALS['painel_com_moldura'] = false;

function abrir_pagina(string $titulo, bool $comNav = true): void
{
    $u = usuario_atual();
    $comMoldura = $comNav && $u !== null;
    $GLOBALS['painel_com_moldura'] = $comMoldura;

    /* O tema sai do cookie e é estampado no <html> antes de o navegador
       desenhar qualquer coisa — é isso, e não o JavaScript, que impede a
       piscada de tema errado. Em "sistema" não estampa nada: quem decide é o
       @media (prefers-color-scheme) do painel.css. */
    $tema = tema_atual();
    ?>
<!doctype html>
<html lang="pt-BR"<?= $tema !== 'sistema' ? ' data-tema="' . h($tema) . '"' : '' ?>>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title><?= h($titulo) ?> — Painel Missão Ceará</title>
<link rel="stylesheet" href="/painel/painel.css?v=<?= VERSAO_ESTILO ?>">
</head>
<body>
<?php if (!$comMoldura) { return; }

    $aqui       = basename((string) ($_SERVER['SCRIPT_NAME'] ?? ''));
    $pendencias = contagens_por_area($u);
    $menu       = menu_do_painel($u, $pendencias);
    ?>
<div class="painel-layout">

  <aside class="lateral">
    <a class="marca" href="/painel/">Missão Ceará</a>
    <?php desenhar_menu($menu, $aqui, 'lateral'); ?>
    <?php desenhar_utilidades($u, $aqui, 'lateral'); ?>
  </aside>

  <main class="conteudo">
<?php
}

/**
 * O menu desta pessoa: os itens soltos do topo e os grupos, já filtrados pela
 * permissão. Grupo sem nenhuma área liberada não entra — quem só tem 'fatos'
 * vê "COMUNICAÇÃO · Fatos do dia" e nada mais, não três títulos vazios.
 *
 * Montado uma vez e desenhado duas (lateral e gaveta do celular), para as duas
 * nunca discordarem.
 */
function menu_do_painel(array $u, array $pendencias): array
{
    $areas = areas_do_usuario();

    $item = function (string $area) use ($pendencias): array {
        return [
            'url'     => DESTINO_AREA[$area]['url'],
            'arquivo' => basename(DESTINO_AREA[$area]['url']),
            'rotulo'  => AREAS[$area],
            'curto'   => ROTULO_CURTO[$area] ?? AREAS[$area],
            'icone'   => ICONE_AREA[$area] ?? 'star',
            'conta'   => $pendencias[$area] ?? 0,
            'marca'   => '',
        ];
    };

    /* Início e Formação, fora de grupo */
    $soltos = [[
        'url' => '/painel/', 'arquivo' => 'index.php', 'rotulo' => 'Início',
        'curto' => 'Início', 'icone' => 'home', 'conta' => 0, 'marca' => '',
    ]];
    if (in_array('aulas', $areas, true)) {
        $aulas = $item('aulas');
        /* A formação não tem fila, tem caminho: o número dela é o progresso nas
           Pistas Rápidas, não uma pendência vermelha. */
        $f = formacao_de($u);
        if ($f !== null) {
            $aulas['marca'] = $f['rapidasFeitas'] . '/' . $f['rapidas'];
        }
        $soltos[] = $aulas;
    }

    $grupos = [];
    foreach (GRUPOS_NAV as $rotulo => $doGrupo) {
        $itens = [];
        foreach ($doGrupo as $area) {
            if (in_array($area, $areas, true)) {
                $itens[] = $item($area);
            }
        }
        if ($rotulo === 'Coordenação' && e_admin()) {
            $itens[] = [
                'url' => '/painel/usuarios.php', 'arquivo' => 'usuarios.php',
                'rotulo' => 'Usuários', 'curto' => 'Usuários', 'icone' => 'users',
                'conta' => 0, 'marca' => '',
            ];
        }
        if ($itens !== []) {
            $grupos[$rotulo] = $itens;
        }
    }

    return ['soltos' => $soltos, 'grupos' => $grupos];
}

/** A lista agrupada. Desenhada na lateral e, igualzinha, dentro do "Mais". */
function desenhar_menu(array $menu, string $aqui, string $onde): void
{
    $link = function (array $i) use ($aqui): void {
        $atual = $aqui === $i['arquivo'];
        echo '<a href="' . h($i['url']) . '"' . ($atual ? ' aria-current="page"' : '') . '>'
            . '<span class="nav-icone">' . icone($i['icone'], 19) . '</span>'
            . '<span class="nav-rotulo">' . h($i['rotulo']) . '</span>';
        if ($i['conta'] > 0) {
            echo '<span class="nav-selo" aria-label="' . $i['conta'] . ' esperando">' . $i['conta'] . '</span>';
        } elseif ($i['marca'] !== '') {
            echo '<span class="nav-marca">' . h($i['marca']) . '</span>';
        }
        echo '</a>';
    };

    echo '<nav class="nav-areas" aria-label="Áreas do painel">';
    foreach ($menu['soltos'] as $i) {
        $link($i);
    }
    foreach ($menu['grupos'] as $rotulo => $itens) {
        // rótulo de grupo é rótulo, não botão: ninguém clica em "Comunicação"
        echo '<p class="nav-grupo">' . h($rotulo) . '</p>';
        foreach ($itens as $i) {
            $link($i);
        }
    }
    echo '</nav>';
}

/** Quem sou eu, senha, tema, site e saída. No pé, longe da navegação. */
function desenhar_utilidades(array $u, string $aqui, string $onde): void
{
    $tema = tema_atual();
    $volta = caminho_interno_seguro($_SERVER['REQUEST_URI'] ?? '/painel/');
    $temas = ['claro' => ['sol', 'Claro'], 'escuro' => ['lua', 'Escuro'], 'sistema' => ['dispositivo', 'Sistema']];
    ?>
    <div class="lateral-pe">
      <p class="quem"><strong><?= h($u['nome']) ?></strong><span><?= h(PAPEIS[$u['papel']]) ?></span></p>

      <form class="tema" method="post" action="/painel/tema.php">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="volta" value="<?= h($volta) ?>">
        <?php foreach ($temas as $chave => [$icone, $rotulo]): ?>
          <button type="submit" name="tema" value="<?= h($chave) ?>"
                  aria-pressed="<?= $tema === $chave ? 'true' : 'false' ?>"
                  title="Tema <?= h(mb_strtolower($rotulo)) ?>">
            <?= icone($icone, 17) ?><span><?= h($rotulo) ?></span>
          </button>
        <?php endforeach; ?>
      </form>

      <a class="pe-link<?= $aqui === 'conta.php' ? ' atual' : '' ?>" href="/painel/conta.php">Minha senha</a>
      <a class="pe-link" href="/" target="_blank" rel="noopener">Ver o site público</a>
      <form method="post" action="/painel/">
        <input type="hidden" name="acao" value="sair">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <button class="pe-link pe-sair" type="submit">Sair</button>
      </form>
    </div>
    <?php
}

/**
 * A barra do celular: Início, três áreas e o "Mais".
 *
 * As três são escolhidas por uma ordem FIXA por pessoa — a mesa da função
 * primeiro, depois a lista de prioridade. Nunca por contador: barra que se
 * reordena sozinha faz a pessoa errar o alvo que já tinha decorado.
 */
function desenhar_barra_celular(array $u, array $menu, string $aqui): void
{
    $porArea = [];
    foreach ($menu['grupos'] as $itens) {
        foreach ($itens as $i) {
            $porArea[$i['arquivo']] = $i;
        }
    }
    foreach ($menu['soltos'] as $i) {
        $porArea[$i['arquivo']] = $i;
    }

    $slots = [$menu['soltos'][0]];  // Início, sempre
    $escolhidos = ['index.php' => true];

    $ordem = [];
    foreach (mesas_de($u) as $mesa) {
        $ordem[] = $mesa['area'];
    }
    foreach (['eventos', 'aulas', 'fatos', 'producao', 'inscricoes', 'agenda', 'estudio'] as $a) {
        $ordem[] = $a;
    }

    foreach ($ordem as $area) {
        if (count($slots) >= 4) {
            break;
        }
        $arquivo = basename(DESTINO_AREA[$area]['url'] ?? '');
        if ($arquivo !== '' && isset($porArea[$arquivo]) && !isset($escolhidos[$arquivo])) {
            $slots[] = $porArea[$arquivo];
            $escolhidos[$arquivo] = true;
        }
    }
    ?>
    <nav class="barra-baixo" aria-label="Navegação do painel">
      <?php foreach ($slots as $i): ?>
        <a href="<?= h($i['url']) ?>"<?= $aqui === $i['arquivo'] ? ' aria-current="page"' : '' ?>>
          <span class="baixo-icone">
            <?= icone($i['icone'], 22) ?>
            <?php if ($i['conta'] > 0): ?>
              <span class="nav-selo"><?= $i['conta'] ?></span>
            <?php endif; ?>
          </span>
          <span><?= h($i['curto']) ?></span>
        </a>
      <?php endforeach; ?>

      <?php /* A gaveta guarda só o secundário — e abre sem JavaScript nenhum. */ ?>
      <details class="mais">
        <summary>
          <span class="baixo-icone"><?= icone('menu', 22) ?></span>
          <span>Mais</span>
        </summary>
        <div class="mais-folha">
          <?php desenhar_menu($menu, $aqui, 'gaveta'); ?>
          <?php desenhar_utilidades(usuario_atual(), $aqui, 'gaveta'); ?>
        </div>
      </details>
    </nav>
    <?php
}

/**
 * O cabeçalho de uma tela: título, uma linha do que ela faz e, quando existe, o
 * caminho de volta e a aula que ensina a usar aquilo.
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
    if ($GLOBALS['painel_com_moldura']) {
        echo '</main></div>';
        $u = usuario_atual();
        if ($u !== null) {
            desenhar_barra_celular(
                $u,
                menu_do_painel($u, contagens_por_area($u)),
                basename((string) ($_SERVER['SCRIPT_NAME'] ?? ''))
            );
        }
        ?>
        <script>
        /* O tema já veio certo do servidor. Este script só existe para a troca
           ser instantânea em vez de recarregar a página — sem ele o formulário
           posta em tema.php e funciona igual, só que com um pisca de recarga. */
        (function () {
          var seguro = location.protocol === 'https:' ? ';secure' : '';
          document.querySelectorAll('form.tema button').forEach(function (botao) {
            botao.addEventListener('click', function (e) {
              e.preventDefault();
              var escolhido = botao.value;
              document.cookie = 'painel_tema=' + escolhido +
                ';path=/painel;max-age=31536000;samesite=lax' + seguro;
              if (escolhido === 'sistema') {
                delete document.documentElement.dataset.tema;
              } else {
                document.documentElement.dataset.tema = escolhido;
              }
              // as duas cópias do seletor (lateral e gaveta) acompanham
              document.querySelectorAll('form.tema button').forEach(function (outro) {
                outro.setAttribute('aria-pressed', outro.value === escolhido ? 'true' : 'false');
              });
            });
          });
        })();
        </script>
        <?php
    }
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
