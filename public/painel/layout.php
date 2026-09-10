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
require_once __DIR__ . '/componentes.php';  // barra_abas(), barra_busca(), modal, menu_acoes(), links_whatsapp(), recado()…

/** Versão do CSS — muda junto com o painel.css para furar o cache do navegador. */
const VERSAO_ESTILO = '31';

/**
 * Os grupos da navegação, na ordem em que aparecem.
 *
 * Saem do organograma do manual (Comunicação e Eventos sob a coordenação), e
 * não do modelo de permissão — é assim que o time já fala de si mesmo.
 *
 * Início e Formação ficam fora de grupo, soltos no topo: são de todo mundo e
 * não pertencem a uma frente. Pessoas é área como as outras, e só a
 * capacidade de administração a libera — é a tela com dado pessoal.
 *
 * ÁREA NOVA precisa entrar em um destes grupos, senão não aparece no menu.
 */
/* O QUARTO GRUPO É A PERMISSÃO LEGÍVEL. Pessoas e Caixa são as duas áreas que
   nenhuma capacidade concede — só `adm` as abre, e pela mesma razão: dado
   pessoal e dinheiro seguem a responsabilidade, não o trabalho do dia. Juntas
   sob "Administração", o menu diz isso sem ninguém ler o sessao.php. Grupo
   vazio não desenha, então para quem não é adm nada muda.
   `testes/contrato/painel.test.ts` prende: área sem capacidade mora aqui, e
   só ela. */
const GRUPOS_NAV = [
    'Comunicação'   => ['fatos', 'producao', 'municao', 'estudio'],
    'Encontros'     => ['eventos', 'agenda'],
    'Coordenação'   => ['inscricoes', 'candidatos', 'aulas', 'leituras'],
    'Administração' => ['pessoas', 'caixa'],
];

/** Rótulos curtos, para caber na barra do celular. */
const ROTULO_CURTO = [
    'fatos'      => 'Fatos',
    'producao'   => 'Produção',
    'municao'    => 'Munição',
    'estudio'    => 'Estúdio',
    'eventos'    => 'Encontros',
    'agenda'     => 'Agenda',
    'aulas'      => 'Aulas',
    'pessoas'    => 'Pessoas',
    'inscricoes' => 'Inscrições',
    'candidatos' => 'Candidatos',
    'caixa'      => 'Caixa',
    'leituras'   => 'Leituras',
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
    <?php desenhar_procurar($aqui); ?>
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

    /* Início e Formação, fora de grupo.
       Início ganha selo pelo que não pertence a área nenhuma — hoje, só a
       obrigação de entrar no grupo de trabalho. Sem isto a tarefa apareceria na
       fila do hub e o menu ficaria mudo sobre ela. */
    $soltos = [[
        'url' => '/painel/', 'arquivo' => 'index.php', 'rotulo' => 'Início',
        'curto' => 'Início', 'icone' => 'home', 'conta' => $pendencias['index'] ?? 0, 'marca' => '',
    ]];
    /* Formação para TODO MUNDO que tem conta: estudar não pede permissão, é a
       obrigação de quem chega. Vai para /aulas (a página que o militante lê),
       e não para /painel/aulas, que é onde se pendura o vídeo — essa sim pede a
       área e aparece no grupo Coordenação. */
    $formacao = [
        'url' => '/aulas', 'arquivo' => '', 'rotulo' => 'Formação',
        'curto' => 'Formação', 'icone' => 'play', 'conta' => 0, 'marca' => '',
    ];
    $f = formacao_de($u);
    if ($f !== null) {
        /* A formação não tem fila, tem caminho: o número dela é o progresso nas
           Pistas Rápidas, não uma pendência vermelha. */
        $formacao['marca'] = $f['rapidasFeitas'] . '/' . $f['rapidas'];
    }
    $soltos[] = $formacao;

    /* Sua gente, para quem acompanha alguém. Item solto, e não área: a porta é
       `pode_liderar()`, o recorte é sempre o de quem está logado, e a
       capacidade `lideranca` continua não abrindo tela de área nenhuma. O
       número é quantos esfriaram — é o trabalho, não o tamanho da lista. */
    require_once __DIR__ . '/pessoas-comum.php';
    if (pode_liderar($u)) {
        $soltos[] = [
            'url' => '/painel/gente.php', 'arquivo' => 'gente.php', 'rotulo' => 'Sua gente',
            'curto' => 'Gente', 'icone' => 'users', 'conta' => $pendencias['gente'] ?? 0, 'marca' => '',
        ];
    }

    $grupos = [];
    foreach (GRUPOS_NAV as $rotulo => $doGrupo) {
        $itens = [];
        foreach ($doGrupo as $area) {
            if (in_array($area, $areas, true)) {
                $itens[] = $item($area);
            }
        }
        if ($itens !== []) {
            $grupos[$rotulo] = $itens;
        }
    }

    return ['soltos' => $soltos, 'grupos' => $grupos];
}

/**
 * A caixa de procurar em tudo, no alto da moldura.
 *
 * A pergunta mais comum da coordenação é "cadê o Fulano?", e quem a faz
 * raramente sabe em que tela Fulano está. Ela mora aqui, e não numa tela: busca
 * que só se acha voltando para um endereço específico é busca que não se usa.
 *
 * É um `<form method="get">` de verdade — funciona sem JavaScript, tem URL
 * própria e o Voltar do navegador desfaz. `procurar.php` alcança exatamente as
 * áreas que a pessoa já abre, nada além.
 */
function desenhar_procurar(string $aqui): void
{
    ?>
    <form class="procurar" method="get" action="/painel/procurar.php" role="search">
      <label class="nav-sr" for="procurar-tudo">Procurar em tudo</label>
      <?php /* `type="search"` para o navegador desenhar o × e o celular trocar
               a tecla de ação por "buscar". O id é diferente do `q` das telas de
               lista: os dois convivem na mesma página, e id repetido faz o
               `<label for>` apontar para o campo errado. */ ?>
      <input id="procurar-tudo" name="q" type="search" maxlength="60"
             value="<?= $aqui === 'procurar.php' ? h(limpar_texto($_GET['q'] ?? '', 60)) : '' ?>"
             placeholder="Procurar em tudo" autocapitalize="none" spellcheck="false"
             title="Atalho: tecle /">
      <button type="submit" aria-label="Procurar"><?= icone('search', 17) ?></button>
    </form>
    <?php
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
      <p class="quem"><strong><?= h($u['nome']) ?></strong><span><?= h(rotulo_do_acesso($u)) ?></span></p>

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
    foreach (['eventos', 'fatos', 'municao', 'producao', 'inscricoes', 'agenda', 'pessoas', 'candidatos', 'aulas', 'estudio'] as $a) {
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
          <?php /* A busca global também na gaveta: no celular a lateral não
                   existe, e sem isto ela só existiria no computador — que é
                   justamente onde ela faz menos falta. */ ?>
          <?php desenhar_procurar($aqui); ?>
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
 * @param array|null  $comoUsar   3 ou 4 frases do que dá para fazer nesta tela
 */
function cabecalho_pagina(
    string $titulo,
    string $sub = '',
    ?array $voltar = null,
    ?string $ferramenta = null,
    ?array $comoUsar = null
): void {
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

    /* "O que dá para fazer aqui" — fechado por padrão, <details> puro.
       Sem JavaScript e sem estado de "já vi" guardado em lugar nenhum: quem
       conhece a tela nunca abre, quem chegou hoje abre uma vez, e ninguém
       precisa de um banner para dispensar.

       Divisão de texto, para não duplicar: aqui é O QUE a tela faz; o "Como se
       faz" acima leva para a aula, que é o COMO. Texto repetido em dois lugares
       é texto que diverge na terceira alteração. */
    if ($comoUsar !== null && $comoUsar !== []) {
        echo '<details class="explicacao"><summary>O que dá para fazer aqui</summary><ul>';
        foreach ($comoUsar as $linha) {
            echo '<li>' . h((string) $linha) . '</li>';
        }
        echo '</ul></details>';
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
        /* COPIAR TEXTO — um ouvinte só, para o painel inteiro.
           `data-copiar` aparece na fila de inscrições e na escala do encontro, e
           vai aparecer em toda tela que passe a produzir mensagem pronta: o
           painel não é onde o trabalho acontece, é de onde sai o texto. Um
           bloco de script por tela seria a mesma função escrita cinco vezes.

           `navigator.clipboard` não existe fora de HTTPS nem em navegador
           antigo, e falhar em silêncio é o pior caso: a pessoa cola uma
           mensagem velha achando que copiou a nova. */
        document.addEventListener('click', function (ev) {
          var botao = ev.target.closest('[data-copiar]');
          if (!botao) { return; }
          var antes = botao.textContent;
          var avisar = function (recado) {
            botao.textContent = recado;
            setTimeout(function () { botao.textContent = antes; }, 1600);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(botao.dataset.copiar).then(
              function () { avisar('Copiado'); },
              function () { avisar('Não deu — copie à mão'); }
            );
          } else {
            avisar('Não deu — copie à mão');
          }
        });

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

          /* Modal: um link com data-modal="id" vira caixa de diálogo.
             O link continua sendo um LINK de verdade — sem JavaScript, ou em
             navegador sem <dialog>, o href leva a `?novo=1` e a página volta com
             o <dialog open> no corpo, que é um bloco comum. Com JS ele nunca
             navega: abre por cima, com foco preso e Esc fechando. */
          document.querySelectorAll('a[data-modal]').forEach(function (elo) {
            var caixa = document.getElementById(elo.dataset.modal);
            if (!caixa || typeof caixa.showModal !== 'function') return;
            elo.addEventListener('click', function (e) {
              e.preventDefault();
              caixa.showModal();
            });
          });
          /* Aberto pelo servidor (a pessoa chegou por `?novo=1`, ou o formulário
             voltou com erro): vira camada de verdade, em vez de bloco no meio da
             página. Removido antes para o showModal() não recusar. */
          document.querySelectorAll('dialog.modal[open]').forEach(function (caixa) {
            if (typeof caixa.showModal !== 'function') return;
            caixa.removeAttribute('open');
            caixa.showModal();
          });

          /* O MENU DE TRÊS PONTINHOS.

             O <details> já abre e fecha sozinho; este trecho conserta as três
             coisas que ele não faz. A primeira é fechar o vizinho — dois menus
             abertos ao mesmo tempo é a lista com duas colunas de ações de
             novo. A segunda é Esc e clique fora, que todo menu do mundo tem.

             A terceira é o recorte: `.rolagem` é `overflow-x:auto`, e overflow
             num eixo recorta os dois — a caixa da última linha sairia cortada
             pela borda da tabela. `position:fixed`, medido na hora da abertura,
             tira a caixa do recorte sem tirá-la de dentro do <details>, que é
             quem guarda o estado e a semântica. */
          var menus = document.querySelectorAll('details.menu-acoes');
          function fecharMenus(exceto) {
            menus.forEach(function (m) { if (m !== exceto) m.open = false; });
          }
          menus.forEach(function (menu) {
            var botao = menu.querySelector('summary');
            var caixa = menu.querySelector('.menu-caixa');
            if (!botao || !caixa) return;

            menu.addEventListener('toggle', function () {
              if (!menu.open) {
                caixa.removeAttribute('style');
                return;
              }
              fecharMenus(menu);

              var r = botao.getBoundingClientRect();
              /* Zerado antes de medir: a caixa precisa estar em `fixed` para
                 as medidas valerem, e sem left/top ela ficaria onde o
                 `absolute` do CSS a tinha deixado. */
              caixa.style.position = 'fixed';
              caixa.style.right = 'auto';
              caixa.style.left = '0px';
              caixa.style.top = '0px';
              var largura = caixa.offsetWidth;
              var altura = caixa.offsetHeight;
              /* Alinhada pela direita do botão, e trazida para dentro da tela
                 nas duas pontas: o menu da última coluna encosta na margem. */
              var x = Math.min(r.right - largura, window.innerWidth - largura - 8);
              var y = r.bottom + 6;
              /* Sem espaço embaixo (a última linha da lista), abre para cima. */
              if (y + altura > window.innerHeight - 8) y = Math.max(8, r.top - altura - 6);
              caixa.style.left = Math.max(8, x) + 'px';
              caixa.style.top = y + 'px';
            });
          });
          if (menus.length) {
            document.addEventListener('click', function (e) {
              menus.forEach(function (m) {
                if (m.open && !m.contains(e.target)) m.open = false;
              });
            });
            document.addEventListener('keydown', function (e) {
              if (e.key === 'Escape') fecharMenus(null);
            });
            /* Rolar com o menu aberto arrastaria a caixa fixa para longe do
               botão que a abriu. Fechar é mais honesto do que persegui-lo. */
            window.addEventListener('scroll', function () { fecharMenus(null); }, true);
            window.addEventListener('resize', function () { fecharMenus(null); });
          }

          /* A peneira dos paredões de checkbox. Esconde o que não casa, sem
             tocar no que está marcado e sem recarregar — recarregar no meio da
             marcação jogaria fora tudo que ainda não foi salvo.

             Ignora acento e caixa dos dois lados, como o `combina_com()` do
             PHP. O jeito certo de fazer isso em JavaScript é `normalize("NFD")`
             mais o corte dos diacríticos: o Unicode define o resultado, então
             ele é o mesmo em qualquer navegador. */
          function semAcento(texto) {
            return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          }
          document.querySelectorAll('input[data-peneira]').forEach(function (caixa) {
            var alvo = document.getElementById(caixa.dataset.peneira);
            if (!alvo) return;
            var itens = alvo.querySelectorAll('label.check');
            if (itens.length === 0) return;
            var campo = caixa.closest('.campo-peneira');
            if (campo) campo.hidden = false;   // só existe onde de fato peneira
            caixa.addEventListener('input', function () {
              var procurado = semAcento(caixa.value.trim());
              itens.forEach(function (item) {
                item.hidden = procurado !== '' &&
                  semAcento(item.textContent || '').indexOf(procurado) < 0;
              });
            });
          });

          /* ---------- rascunho de formulário longo ----------
             Formulário longo no celular perde para qualquer coisa: a sessão
             expira, o WhatsApp chama, o navegador descarta a aba. Quem entra
             aqui é `<form data-rascunho="<chave>">`, e só ele.

             NUNCA APLICA SOZINHO. Guarda a cada digitada e, na volta, OFERECE
             — num formulário de edição, aplicar por conta própria escreveria
             por cima do que o servidor diz, que é o defeito "ele desfez a minha
             correção" e não tem como ser investigado depois.

             O QUE NÃO É GUARDADO: campo escondido (o CSRF muda a cada sessão e
             restaurá-lo velho reprovaria o envio), senha e arquivo. Nem daria:
             `<input type=file>` não tem valor que se escreva de volta.

             Fica no aparelho de quem digitou, some ao enviar, e vence em 12h —
             ninguém volta a um rascunho de anteontem, e dado de gente não deve
             envelhecer no navegador de ninguém. Sair do painel apaga todos.

             Tudo dentro de try/catch: em aba anônima o localStorage existe e
             lança na hora de escrever, e um formulário que não abre por causa
             do rascunho é pior do que não ter rascunho. */
          var VALIDADE_RASCUNHO = 12 * 60 * 60 * 1000;

          function campoVale(c) {
            return c.name && !c.disabled &&
              ['hidden', 'password', 'file', 'submit', 'button', 'reset'].indexOf(c.type) < 0;
          }
          function lerFormulario(form) {
            var dados = {};
            form.querySelectorAll('input, textarea, select').forEach(function (c) {
              if (!campoVale(c)) return;
              if (c.type === 'checkbox' || c.type === 'radio') {
                if (c.checked) (dados[c.name] = dados[c.name] || []).push(c.value);
              } else if (c.value !== '') {
                dados[c.name] = c.value;
              }
            });
            return dados;
          }
          function aplicar(form, dados) {
            form.querySelectorAll('input, textarea, select').forEach(function (c) {
              if (!campoVale(c)) return;
              if (c.type === 'checkbox' || c.type === 'radio') {
                c.checked = (dados[c.name] || []).indexOf(c.value) >= 0;
              } else if (Object.prototype.hasOwnProperty.call(dados, c.name)) {
                c.value = dados[c.name];
              }
            });
          }

          document.querySelectorAll('form[data-rascunho]').forEach(function (form) {
            var chave = 'rascunho:' + form.dataset.rascunho;
            var apagar = function () { try { localStorage.removeItem(chave); } catch (e) {} };

            var guardado = null;
            try {
              var cru = localStorage.getItem(chave);
              if (cru) {
                var pacote = JSON.parse(cru);
                if (Date.now() - pacote.em < VALIDADE_RASCUNHO) {
                  guardado = pacote.dados;
                } else {
                  apagar();
                }
              }
            } catch (e) { guardado = null; }

            /* Só oferece o que de fato difere do que está na tela: um rascunho
               igual ao formulário é uma faixa que assusta sem ter novidade. E
               rascunho VAZIO não é rascunho — oferecer "recuperar" o que não
               tem conteúdo nenhum é oferecer apagar o formulário. */
            if (guardado && Object.keys(guardado).length > 0 &&
                JSON.stringify(guardado) !== JSON.stringify(lerFormulario(form))) {
              var faixa = document.createElement('div');
              faixa.className = 'rascunho-aviso';
              faixa.setAttribute('role', 'status');
              faixa.innerHTML =
                '<p>Você tinha coisa digitada aqui e não chegou a salvar.</p>' +
                '<div class="acoes">' +
                '<button type="button" class="btn btn-mini btn-ouro">Recuperar</button>' +
                '<button type="button" class="btn btn-mini">Descartar</button>' +
                '</div>';
              var botoes = faixa.querySelectorAll('button');
              botoes[0].addEventListener('click', function () {
                aplicar(form, guardado);
                /* Trocar valor por código não dispara evento nenhum, e quem
                   desenha prévia a partir do formulário ficaria mostrando o
                   estado anterior ao rascunho recuperado. */
                form.dispatchEvent(new Event('change', { bubbles: true }));
                faixa.remove();
              });
              botoes[1].addEventListener('click', function () {
                apagar();
                faixa.remove();
              });
              form.insertBefore(faixa, form.firstChild);
            }

            var pendente = null;
            form.addEventListener('input', function () {
              // uma gravação por pausa de digitação, e não uma por tecla
              clearTimeout(pendente);
              pendente = setTimeout(function () {
                try {
                  localStorage.setItem(chave, JSON.stringify({
                    em: Date.now(), dados: lerFormulario(form),
                  }));
                } catch (e) {}
              }, 400);
            });
            form.addEventListener('change', function () {
              try {
                localStorage.setItem(chave, JSON.stringify({
                  em: Date.now(), dados: lerFormulario(form),
                }));
              } catch (e) {}
            });
            /* Enviou, acabou. O servidor passa a ser a verdade, e um rascunho
               que sobrevive ao envio vira a faixa aparecendo na próxima visita
               oferecendo exatamente o que já está gravado. */
            form.addEventListener('submit', apagar);
          });

          /* Sair apaga todos os rascunhos: eles são dados de gente no aparelho
             de quem digitou, e sair é o gesto de quem está entregando o
             aparelho ou indo embora dele. */
          document.querySelectorAll('form .pe-sair').forEach(function (botao) {
            botao.addEventListener('click', function () {
              try {
                Object.keys(localStorage)
                  .filter(function (k) { return k.indexOf('rascunho:') === 0; })
                  .forEach(function (k) { localStorage.removeItem(k); });
              } catch (e) {}
            });
          });

          /* "/" põe o cursor na busca — quem usa o painel todo dia procura mais
             do que clica, e a caixa nem sempre está na altura da tela.

             DUAS CAIXAS, UMA REGRA: a da TELA ganha quando existe. Quem está
             numa lista e tecla "/" quer filtrar aquela lista, não sair dela;
             onde a tela não tem busca própria, a barra cai na busca global, que
             é a única ali. Mandar sempre para a global tiraria a pessoa da tela
             em que ela está trabalhando.

             Só quando NÃO se está digitando em outro lugar: dentro de um campo a
             barra é uma barra, e roubá-la impediria de escrever "e/ou". */
          var busca = document.querySelector('.filtros input[type=search]')
            || document.querySelector('.procurar input[type=search]');
          if (busca) {
            document.addEventListener('keydown', function (e) {
              if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
              var alvo = e.target;
              if (alvo && (alvo.matches('input, textarea, select') || alvo.isContentEditable)) return;
              e.preventDefault();
              busca.focus();
              busca.select();
            });
          }
        })();
        </script>
        <?php
    }
    ?>
</body>
</html>
<?php
}
