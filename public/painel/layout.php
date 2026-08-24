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
const VERSAO_ESTILO = '21';

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
const GRUPOS_NAV = [
    'Comunicação' => ['fatos', 'producao', 'municao', 'estudio'],
    'Encontros'   => ['eventos', 'agenda'],
    'Coordenação' => ['inscricoes', 'candidatos', 'aulas', 'pessoas'],
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

/**
 * Caixinha de recado no topo do conteúdo.
 *
 * Fica grudada no topo (`position:sticky`) porque toda ação do painel termina
 * em POST-redirect-GET com âncora: o navegador salta para o item mexido e a
 * confirmação, se fosse estática, ficaria acima da dobra sem ninguém ver.
 */
/**
 * A barra de abas de uma tela que mostra uma lista de cada vez.
 *
 * `$abas` é `chave => ['nome' => …, 'conta' => …]`, e a chave vai para o
 * parâmetro `$param` da URL. **Os outros parâmetros da URL são preservados**:
 * trocar de aba não pode apagar a busca que a pessoa acabou de digitar.
 *
 * A aba aberta é um `<span aria-current>`, e não um link — link que leva ao
 * lugar onde já se está é ruído para quem navega por teclado ou leitor de tela.
 */
function barra_abas(array $abas, string $atual, string $param = 'aba', string $rotulo = 'Abas'): void
{
    $base = strtok((string) ($_SERVER['REQUEST_URI'] ?? ''), '?');
    ?>
    <nav class="abas" aria-label="<?= h($rotulo) ?>">
      <?php foreach ($abas as $chave => $aba): ?>
        <?php
        $qs = $_GET;
        /* Trocar de aba fecha o que estava aberto por cima dela: modal e ficha
           são estado de uma aba só, e carregá-los para a outra abre um
           formulário no meio de uma tela que fala de outra coisa. */
        unset($qs['p'], $qs['c'], $qs['novo'], $qs['nova'], $qs['editar'],
              $qs['pessoa'], $qs['puxar']);
        $qs[$param] = $chave;
        $url = $base . '?' . http_build_query($qs);
        $conta = $aba['conta'] ?? null;
        ?>
        <?php /* O contador é texto, e não número: quase sempre é uma contagem
                 ("12"), mas o preparo do encontro conta duas coisas de uma vez
                 ("3/12"), e um (int) ali transformava isso em "3". */ ?>
        <?php if ((string) $chave === $atual): ?>
          <span aria-current="page">
            <?= h($aba['nome']) ?><?= $conta !== null ? '<span>' . h((string) $conta) . '</span>' : '' ?>
          </span>
        <?php else: ?>
          <a href="<?= h($url) ?>">
            <?= h($aba['nome']) ?><?= $conta !== null ? '<span>' . h((string) $conta) . '</span>' : '' ?>
          </a>
        <?php endif; ?>
      <?php endforeach; ?>
    </nav>
    <?php
}

/**
 * A caixa de procurar de uma tela de lista.
 *
 * Uma peça só para o painel inteiro: cinco cópias de um `<form method="get">`
 * com um `<input name="q">` dentro divergiriam na primeira vez que alguém
 * mexesse no rótulo, e a busca é justamente o controle que precisa estar no
 * mesmo lugar, com o mesmo nome, em toda tela.
 *
 * `$manter` são os parâmetros que a busca não pode apagar — a aba aberta, o
 * recorte já escolhido. Formulário GET manda só o que está dentro dele: sem os
 * campos escondidos, procurar na aba "Já aconteceram" devolveria o resultado na
 * aba "Próximos", que é o mesmo que perder o lugar onde a pessoa estava.
 *
 * Telas com mais de um controle (pessoas, candidatos) montam o `.filtros` por
 * conta própria — ali a busca é um campo entre outros.
 */
function barra_busca(string $valor, string $dica = '', array $manter = []): void
{
    $base = strtok((string) ($_SERVER['REQUEST_URI'] ?? ''), '?');
    $limpo = $manter !== [] ? $base . '?' . http_build_query($manter) : $base;
    ?>
    <form method="get" class="filtros filtros-busca">
      <?php foreach ($manter as $nome => $conteudo): ?>
        <input type="hidden" name="<?= h((string) $nome) ?>" value="<?= h((string) $conteudo) ?>">
      <?php endforeach; ?>
      <div class="campo">
        <label for="q">Procurar</label>
        <?php /* `type="search"` e não `text`: o navegador desenha o × que apaga
                 o que foi digitado, e no celular a tecla de ação vira "buscar". */ ?>
        <input id="q" name="q" type="search" maxlength="60" value="<?= h($valor) ?>"
               placeholder="<?= h($dica) ?>" autocapitalize="none" spellcheck="false"
               title="Atalho: tecle /">
      </div>
      <div class="acoes">
        <button class="btn" type="submit">Procurar</button>
        <?php if ($valor !== ''): ?>
          <a class="btn" href="<?= h($limpo) ?>">Limpar</a>
        <?php endif; ?>
      </div>
    </form>
    <?php
}

/**
 * A barra de filtro de uma tela de lista: procurar, recortar, ordenar.
 *
 * `barra_busca()` cobre a tela que SÓ procura. Esta cobre a que procura e
 * recorta — pessoas, candidatos, fatos, produção, munição e aulas. As seis
 * escreviam o mesmo `<form method="get" class="filtros">` à mão, com o mesmo
 * `<input name="q">`, o mesmo par de botões e a mesma regra de quando mostrar o
 * "Limpar": seis cópias que divergiriam na primeira vez que alguém mexesse no
 * rótulo — foi para não ter isso que `barra_busca()` existe, e a metade das
 * telas ficou de fora dela por precisar de um `<select>` a mais.
 *
 * `$campos` é a lista dos controles, na ordem em que aparecem:
 *
 *   ['tipo' => 'busca',   'valor' => $q, 'dica' => 'nome, telefone ou login']
 *   ['tipo' => 'escolha', 'nome' => 'cargo', 'rotulo' => 'Cargo',
 *    'valor' => $cargoF, 'vazio' => 'todos', 'opcoes' => [chave => rótulo]]
 *
 * QUEM MONTA `opcoes` É A TELA, e de propósito: é ela que sabe contar quantos
 * casam com cada valor e que decide esconder o recorte que devolveria lista
 * vazia. Oferecer 184 cidades num filtro é oferecer 180 becos.
 *
 * `$recortado` é o que faz o "Limpar" aparecer — cada tela sabe o que é o seu
 * estado neutro (a ordem padrão de gente é A-Z, a de candidato é a da colinha),
 * e essa é a única coisa que não dá para deduzir daqui.
 *
 * `$manter` são os parâmetros que o recorte não pode apagar — a aba aberta,
 * antes de tudo. Formulário GET manda só o que está dentro dele.
 */
function barra_filtros(array $campos, bool $recortado, string $limpar, array $manter = []): void
{
    ?>
    <form method="get" class="filtros">
      <?php foreach ($manter as $nome => $conteudo): ?>
        <input type="hidden" name="<?= h((string) $nome) ?>" value="<?= h((string) $conteudo) ?>">
      <?php endforeach; ?>

      <?php foreach ($campos as $campo): ?>
        <?php if (($campo['tipo'] ?? '') === 'busca'): ?>
          <div class="campo">
            <label for="q">Procurar</label>
            <?php /* `type="search"` e não `text`: o navegador desenha o × que
                     apaga o que foi digitado, e no celular a tecla de ação vira
                     "buscar". O id é sempre `q` — é ele que o atalho `/` de
                     `fechar_pagina()` procura. */ ?>
            <input id="q" name="q" type="search" maxlength="60"
                   value="<?= h((string) ($campo['valor'] ?? '')) ?>"
                   placeholder="<?= h((string) ($campo['dica'] ?? '')) ?>"
                   autocapitalize="none" spellcheck="false" title="Atalho: tecle /">
          </div>
        <?php else: ?>
          <?php $id = 'f-' . preg_replace('/[^a-z0-9]+/i', '-', (string) $campo['nome']); ?>
          <div class="campo">
            <label for="<?= h($id) ?>"><?= h((string) $campo['rotulo']) ?></label>
            <select id="<?= h($id) ?>" name="<?= h((string) $campo['nome']) ?>">
              <?php if (isset($campo['vazio'])): ?>
                <option value=""><?= h((string) $campo['vazio']) ?></option>
              <?php endif; ?>
              <?php foreach ((array) $campo['opcoes'] as $chave => $rotulo): ?>
                <option value="<?= h((string) $chave) ?>"
                        <?= (string) $chave === (string) ($campo['valor'] ?? '') ? 'selected' : '' ?>>
                  <?= h((string) $rotulo) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
        <?php endif; ?>
      <?php endforeach; ?>

      <div class="acoes">
        <button class="btn" type="submit">Filtrar</button>
        <?php if ($recortado): ?>
          <a class="btn" href="<?= h($limpar) ?>">Limpar</a>
        <?php endif; ?>
      </div>
    </form>
    <?php
}

/**
 * "3 de 12 aulas." — quanto do total sobrou depois do recorte.
 *
 * Some quando não há recorte: repetir o total de uma lista que está inteira na
 * tela é dizer o que já se vê. Só o número, sem a explicação de busca errada —
 * essa é de `nada_encontrado()`, que aparece quando sobra zero.
 */
function resumo_do_recorte(bool $recortado, int $achados, int $total, string $coisas): void
{
    if (!$recortado) {
        return;
    }
    echo '<p class="dica" style="margin:-6px 0 14px">'
        . $achados . ' de ' . $total . ' ' . h($coisas) . '.</p>';
}

/**
 * "Nada encontrado" com saída, e não um beco.
 *
 * Lista vazia por causa do recorte é diferente de lista vazia de verdade: a
 * primeira precisa dizer o que apagar para voltar a ver alguma coisa. Sem isso
 * quem procurou errado acha que a tela está quebrada.
 */
function nada_encontrado(string $busca, string $volta, string $vazio = 'Nada por aqui ainda.'): void
{
    if ($busca === '') {
        echo '<p class="dica" style="margin:0">' . h($vazio) . '</p>';
        return;
    }
    ?>
    <p class="dica" style="margin:0 0 12px">
      Nada com <strong>“<?= h($busca) ?>”</strong>. Confira a grafia — a busca ignora
      acento e maiúscula, mas não adivinha.
    </p>
    <div class="acoes"><a class="btn" href="<?= h($volta) ?>">Ver tudo de novo</a></div>
    <?php
}

/**
 * Um texto do cadastro dentro de um `confirm()`, sem quebrar no apóstrofo.
 *
 * `h()` escapa a aspa simples como `&#039;`, e o navegador a devolve como `'`
 * ao ler o atributo — então "Sant'Ana" fecha a string do JavaScript no meio e o
 * `onsubmit` inteiro para de existir: o formulário passa a apagar sem
 * perguntar nada. Nome de gente é dado que vem do cadastro, e apóstrofo em
 * sobrenome cearense não é caso raro.
 *
 * As flags `JSON_HEX_*` são o mesmo cuidado do `estudio.php`: sem elas um
 * `</script>` ou uma aspa dentro do nome escapa do contexto.
 */
function texto_js(string $texto): string
{
    return h((string) json_encode(
        $texto,
        JSON_UNESCAPED_UNICODE | JSON_HEX_QUOT | JSON_HEX_APOS | JSON_HEX_TAG | JSON_HEX_AMP
    ));
}

/**
 * O botão que abre um modal, e o modal.
 *
 * São duas funções porque o botão fica onde a pessoa olha (topo da lista) e a
 * caixa fica no fim do documento — mas os dois têm de concordar no id, e é o
 * que estas duas garantem.
 *
 * `$aberto` é o que faz a coisa funcionar sem JavaScript: a página recarrega
 * com `?novo=1`, o `<dialog>` sai com `open` e o formulário está ali, no corpo
 * da página. O script de `fechar_pagina()` promove isso a camada quando pode.
 */
function botao_modal(string $id, string $texto, string $qs, string $classe = 'btn btn-ouro'): void
{
    $base = strtok((string) ($_SERVER['REQUEST_URI'] ?? ''), '?');
    echo '<a class="' . h($classe) . '" data-modal="' . h($id) . '" href="'
        . h($base . '?' . $qs) . '">' . h($texto) . '</a>';
}

function abrir_modal(string $id, string $titulo, bool $aberto = false): void
{
    ?>
    <dialog id="<?= h($id) ?>" class="modal"<?= $aberto ? ' open' : '' ?>>
      <form method="dialog" class="modal-fechar">
        <button type="submit" aria-label="Fechar">&times;</button>
      </form>
      <h2><?= h($titulo) ?></h2>
    <?php
}

function fechar_modal(): void
{
    echo '</dialog>';
}

/**
 * O MENU DE TRÊS PONTINHOS de uma linha de lista.
 *
 * Três botões lado a lado numa linha de tabela são três decisões pedidas ao
 * mesmo tempo, e a linha inteira passa a ser lida pela coluna da direita. No
 * celular fica pior: o `.rodape` do cartão vira uma pilha de blocos maior que o
 * dado que ela acompanha. O padrão comum resolve com um alvo só — os pontinhos
 * abrem o resto, e a linha volta a ser o nome de quem está nela.
 *
 * `<details>` de propósito, e não `popover`: sem JavaScript ele continua
 * abrindo, a caixa cai embaixo do botão e os itens continuam sendo links e
 * formulários de verdade. O script de `fechar_pagina()` só melhora o que já
 * funciona — fecha o vizinho, fecha no Esc e no clique fora, e tira a caixa do
 * recorte da `.rolagem` com `position:fixed`.
 *
 * Cada item é uma destas três formas:
 *
 *   ['texto' => 'Abrir',  'url' => '?p=7']                          → link
 *   ['texto' => 'Editar', 'url' => '?editar=7', 'modal' => 'caixa'] → link que abre modal
 *   ['texto' => 'Apagar', 'acao' => 'apagar', 'campos' => ['id' => '7'],
 *    'confirmar' => 'Apagar mesmo?', 'risco' => true]               → POST com csrf
 *
 * `risco` pinta o item com a cor de erro e desce um traço antes dele: o que não
 * se desfaz não fica encostado no que se faz todo dia — e num menu, onde os
 * itens têm o mesmo tamanho, essa é a única diferença que sobra.
 */
function menu_acoes(array $itens, string $rotulo = 'Ações'): void
{
    if ($itens === []) {
        return;
    }
    ?>
    <details class="menu-acoes">
      <?php /* O rótulo existe para o leitor de tela e para o celular: no
               desktop ele é `.nav-sr` (lido, não visto) e os pontinhos bastam;
               no cartão, onde o botão ocupa a largura toda, três pontinhos
               sozinhos no meio de um bloco não dizem o que fazem. */ ?>
      <summary class="btn btn-mini menu-botao" title="<?= h($rotulo) ?>">
        <span class="menu-rotulo"><?= h($rotulo) ?></span>
        <span class="menu-pontos" aria-hidden="true">&#8942;</span>
      </summary>
      <?php /* Cada item é o MESMO botão do resto do painel — `.btn .btn-mini`,
               com borda, sombra dura e o hover de sempre —, só esticado na
               largura da gaveta e alinhado à esquerda. Item de menu desenhado
               como texto empilhado não parece tocável: a pessoa lê uma lista
               onde devia ver botões, e para para descobrir onde clicar. */ ?>
      <div class="menu-caixa">
        <?php foreach ($itens as $item): ?>
          <?php $classe = 'btn btn-mini menu-item' . (!empty($item['risco']) ? ' btn-risco' : ''); ?>
          <?php if (isset($item['url'])): ?>
            <a class="<?= $classe ?>" href="<?= h($item['url']) ?>"
               <?= isset($item['modal']) ? 'data-modal="' . h($item['modal']) . '"' : '' ?>
               <?= !empty($item['novaAba']) ? 'target="_blank" rel="noopener"' : '' ?>><?= h($item['texto']) ?></a>
          <?php else: ?>
            <?php /* `menu-fim` é o traço acima do que não se desfaz: ele mora no
                     <form>, e não no botão, porque o botão já tem borda
                     própria — duas bordas encostadas viram uma linha grossa. */ ?>
            <form method="post" class="<?= !empty($item['risco']) ? 'menu-fim' : '' ?>"<?= isset($item['confirmar']) ? ' onsubmit="return confirm(' . texto_js($item['confirmar']) . ')"' : '' ?>>
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <?php foreach (($item['campos'] ?? []) as $nome => $valor): ?>
                <input type="hidden" name="<?= h($nome) ?>" value="<?= h((string) $valor) ?>">
              <?php endforeach; ?>
              <button class="<?= $classe ?>" type="submit" name="acao" value="<?= h($item['acao']) ?>"><?= h($item['texto']) ?></button>
            </form>
          <?php endif; ?>
        <?php endforeach; ?>
      </div>
    </details>
    <?php
}

/**
 * O LINK DO WHATSAPP, e o segundo link que existe por causa do nono dígito.
 *
 * Metade das mensagens da coordenação sai daqui: o painel abre a conversa da
 * pessoa com o número que está na ficha. Só que o número guardado e o número
 * com que a pessoa registrou o WhatsApp nem sempre são o mesmo — quem nunca
 * reinstalou o aplicativo desde a mudança continua com oito dígitos lá dentro,
 * e o link de 13 dígitos abre "número inválido" para ela. Acontece o contrário
 * também, com quem foi cadastrado aqui sem o 9.
 *
 * Não há como descobrir isso de fora (ver `numero_whatsapp_outro()`), então a
 * tela mostra os dois e quem está mandando a mensagem tenta o outro quando o
 * primeiro não abre. É por isso que o segundo link é discreto e não some: ele
 * não é uma segunda ação, é a mesma ação na outra grafia do número.
 *
 * `$classe` vazia desenha os dois como texto — é o caso da linha de lista, onde
 * o link é o próprio telefone. Com classe de botão, os dois viram botão.
 */
function links_whatsapp(string $telefone, string $rotulo, string $texto = '', string $classe = ''): void
{
    if (so_digitos($telefone) === '') {
        return;
    }
    $consulta = $texto !== '' ? '?text=' . rawurlencode($texto) : '';
    $outro = numero_whatsapp_outro($telefone);
    /* 12 dígitos é o número sem o 9; 13 é o com. O rótulo diz o que a segunda
       tentativa TEM, e não o que ela é: "sem o 9" é o que a pessoa procura
       depois de levar um "número inválido" na cara. */
    $acao = strlen($outro) === 12 ? 'sem o 9' : 'com o 9';
    $aviso = 'Se o outro link disser que o número não existe, tente por aqui: '
           . 'essa conta pode ter sido registrada ' . $acao . '.';
    ?>
    <a<?= $classe !== '' ? ' class="' . h($classe) . '"' : '' ?>
       href="https://wa.me/<?= h(numero_whatsapp($telefone)) ?><?= $consulta ?>"
       target="_blank" rel="noopener"><?= h($rotulo) ?></a>
    <?php if ($outro !== ''): ?>
      <a class="<?= $classe !== '' ? h($classe) : 'wa-outro' ?>"
         href="https://wa.me/<?= h($outro) ?><?= $consulta ?>"
         target="_blank" rel="noopener" title="<?= h($aviso) ?>"><?= h($classe !== '' ? 'Tentar ' . $acao : $acao) ?></a>
    <?php endif; ?>
    <?php
}

/**
 * A caixa que peneira um paredão de checkboxes.
 *
 * As listas de marcação do painel — quem entra na colinha, quem do time é
 * escalado para o encontro — crescem com o movimento: aos quarenta nomes, achar
 * um é rolar a tela lendo. A busca das outras telas não serve aqui: ela é um
 * `<form method="get">`, e recarregar a página no meio da marcação jogaria fora
 * tudo que ainda não foi salvo.
 *
 * Por isso ela peneira NO NAVEGADOR, escondendo o que não casa e deixando
 * marcado o que já estava. E por isso nasce `hidden`: sem JavaScript ela não
 * peneiraria nada, e caixa de procurar que não procura é pior do que caixa
 * nenhuma. Quem a mostra é o script de `fechar_pagina()`.
 */
function filtro_de_marcacao(string $alvoId, string $dica = 'nome ou número'): void
{
    ?>
    <div class="campo campo-peneira" hidden>
      <label for="peneira-<?= h($alvoId) ?>">Procurar nesta lista</label>
      <input id="peneira-<?= h($alvoId) ?>" type="search" data-peneira="<?= h($alvoId) ?>"
             maxlength="60" placeholder="<?= h($dica) ?>" autocapitalize="none" spellcheck="false">
      <p class="dica">Só esconde quem não casa — o que você já marcou continua marcado.</p>
    </div>
    <?php
}

/**
 * O campo de cidade, que é lista e não caixa de texto.
 *
 * Uma cópia só, porque são três telas que perguntam a mesma coisa — a ficha da
 * pessoa, o cadastro de quem chegou no encontro e o filtro da lista. Três
 * `<select>` escritos à mão divergiriam no dia em que a primeira opção mudasse
 * de texto.
 *
 * `$vazio` é o rótulo da opção em branco: no cadastro ela diz "escolha", no
 * filtro ela diz "todas". Mesmo controle, perguntas diferentes.
 */
function campo_cidade(string $id, string $nome, string $valor, string $vazio = 'Escolha a cidade', bool $obrigatorio = false): void
{
    $lista = municipios_ce();
    ?>
    <select id="<?= h($id) ?>" name="<?= h($nome) ?>"<?= $obrigatorio ? ' required' : '' ?>>
      <option value=""><?= h($vazio) ?></option>
      <option value="<?= h($lista['fora']) ?>" <?= $valor === $lista['fora'] ? 'selected' : '' ?>>
        <?= h($lista['fora']) ?>
      </option>
      <optgroup label="Ceará">
        <?php foreach ($lista['municipios'] as $m): ?>
          <option value="<?= h($m) ?>" <?= $valor === $m ? 'selected' : '' ?>><?= h($m) ?></option>
        <?php endforeach; ?>
      </optgroup>
    </select>
    <?php
}

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
