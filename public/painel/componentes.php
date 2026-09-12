<?php
declare(strict_types=1);

/**
 * Os componentes do painel — abas, busca, filtros, modal, os três pontinhos,
 * o par de links do WhatsApp, o campo de cidade, o recado.
 *
 * Saíram de `layout.php` porque não são navegação: a navegação mora lá, e só
 * lá; isto aqui é a biblioteca que toda tela usa para desenhar uma lista, um
 * formulário ou uma decisão. `layout.php` inclui este arquivo, então quem já
 * incluía a moldura continua com tudo.
 *
 * Cada peça é a ÚNICA do seu tipo no painel: não há segundo modal, segunda
 * barra de abas, segundo jeito de pôr três ações numa linha. Duas aparências
 * para a mesma coisa ensinam duas.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/icones.php';

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
function barra_abas(array $abas, string $atual, string $param = 'aba', string $rotulo = 'Abas', array $manter = []): void
{
    $base = strtok((string) ($_SERVER['REQUEST_URI'] ?? ''), '?');
    ?>
    <nav class="abas" aria-label="<?= h($rotulo) ?>">
      <?php foreach ($abas as $chave => $aba): ?>
        <?php
        $qs = $_GET;
        /* Trocar de aba fecha o que estava aberto por cima dela: modal e ficha
           são estado de uma aba só, e carregá-los para a outra abre um
           formulário no meio de uma tela que fala de outra coisa.

           `$manter` é a exceção de quem É a coisa aberta: na ficha de pessoa
           (`pessoas?p=`) as abas são da ficha, e tirar o `p` mandava cada
           clique de volta para a lista — desde que a ficha virou tela
           própria, em 10/09, até a fumaça pegar. */
        foreach (['p', 'c', 'novo', 'nova', 'editar', 'pessoa', 'puxar'] as $solto) {
            if (!in_array($solto, $manter, true)) {
                unset($qs[$solto]);
            }
        }
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
/**
 * O ESTADO VAZIO COM AÇÃO — o padrão do painel para "não há nada aqui".
 *
 * Tela vazia que só diz "nenhuma peça ainda, crie na aba Peças" é tela que
 * manda a pessoa procurar. O vazio diz o que fazer E dá o botão: a próxima
 * ação está a um toque, no lugar em que a falta apareceu. Sem ação (uma
 * leitura que ainda não tem dado) é só o texto, e tudo bem.
 *
 * `$acao` é `['url' => …, 'texto' => …]`; a fumaça confere que todo
 * `.vazio` com `data-acao` tem um link dentro.
 */
function vazio(string $texto, ?array $acao = null): void
{
    ?>
    <p class="vazio"<?= $acao !== null ? ' data-acao' : '' ?>>
      <?= h($texto) ?>
      <?php if ($acao !== null): ?>
        <a class="btn btn-mini" href="<?= h($acao['url']) ?>"><?= h($acao['texto']) ?></a>
      <?php endif; ?>
    </p>
    <?php
}

function nada_encontrado(string $busca, string $volta, string $vazio = 'Nada por aqui ainda.', ?array $acao = null): void
{
    if ($busca === '') {
        vazio($vazio, $acao);
        return;
    }
    ?>
    <p class="dica folga">
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
            <form method="post" class="<?= !empty($item['risco']) ? 'menu-fim' : '' ?>"<?= isset($item['confirmar']) ? ' data-confirmar="' . h($item['confirmar']) . '"' : '' ?>>
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
