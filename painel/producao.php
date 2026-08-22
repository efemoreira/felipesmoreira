<?php
declare(strict_types=1);

/**
 * Produção — felipesmoreira.com/painel/producao
 *
 * O quadro que substitui o Trello: A fazer → Fazendo → Revisão → Publicado.
 * Card nasce do fato aprovado na Checagem, já com fonte e responsável colados.
 *
 * Sem arrastar e soltar de propósito: a maioria do time abre isto no celular,
 * onde arrastar entre quatro colunas é briga com a rolagem da página. Botão
 * funciona no dedo, no teclado e no leitor de tela.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/producao-comum.php';
exigir_area('producao');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $ancora = ''): void
{
    header('Location: /painel/producao.php' . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
}

/** Anota no histórico do card — é o que conta a história depois. */
function anotar(array &$card, string $quem, string $texto): void
{
    $card['historico'][] = ['quando' => date('c'), 'quem' => $quem, 'texto' => $texto];
    $card['historico'] = array_slice($card['historico'], -12);
}

/* ===================== ações ===================== */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!token_valido()) {
        avisar('erro', 'Sessão expirada. Entre de novo.');
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    $acao = (string) ($_POST['acao'] ?? '');

    $alvo = achar_card(limpar_texto($_POST['id'] ?? '', 40));

    if ($alvo === null) {
        avisar('erro', 'Card não encontrado.');
        voltar();
    }

    $cards = ler_cards();

    /* ---------- pegar ou soltar o card ---------- */
    if ($acao === 'assumir' || $acao === 'soltar') {
        foreach ($cards as &$c) {
            if ($c['id'] === $alvo['id']) {
                if ($acao === 'assumir') {
                    $c['donoId']   = $eu['id'];
                    $c['donoNome'] = $eu['nome'];
                    anotar($c, $eu['nome'], 'Assumiu o card.');
                } else {
                    $c['donoId']   = '';
                    $c['donoNome'] = '';
                    anotar($c, $eu['nome'], 'Soltou o card.');
                }
            }
        }
        unset($c);

        if (!gravar_cards($cards)) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar($alvo['id']);
    }

    /* ---------- andar no quadro ---------- */
    if ($acao === 'mover') {
        $destino = limpar_texto($_POST['coluna'] ?? '', 20);
        if (!isset(COLUNAS[$destino])) {
            avisar('erro', 'Coluna desconhecida.');
            voltar();
        }

        /* Publicar é diferente de mover: pede o link do post e passa pela regra
           do ledger. Por isso vem de outro botão, não deste. */
        if ($destino === 'publicado') {
            avisar('erro', 'Para publicar, use o botão “Publicar” do card — ele pede o link do post.');
            voltar($alvo['id']);
        }

        foreach ($cards as &$c) {
            if ($c['id'] === $alvo['id']) {
                $c['coluna'] = $destino;
                anotar($c, $eu['nome'], 'Moveu para ' . COLUNAS[$destino] . '.');
            }
        }
        unset($c);

        if (!gravar_cards($cards)) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar($alvo['id']);
    }

    /* ---------- publicar ---------- */
    if ($acao === 'publicar') {
        $link = limpar_texto($_POST['linkPost'] ?? '', 500);
        if ($link === '' || filter_var($link, FILTER_VALIDATE_URL) === false) {
            avisar('erro', 'Cole o link do post publicado — é ele que o Acervo indexa depois.');
            voltar($alvo['id']);
        }

        /* A regra do ledger do manual. Avisa, não bloqueia: às vezes o
           desdobramento do mesmo caso é a pauta certa, e quem decide isso é a
           coordenação. Mas ninguém publica sem ver o aviso. */
        $repetido = alvo_repetido($alvo['responsavel'], $alvo['id']);
        if ($repetido !== null && empty($_POST['ciente'])) {
            avisar('erro', 'Regra do ledger: “' . $alvo['responsavel'] . '” já foi alvo principal de “'
                . $repetido['titulo'] . '”, publicado há menos de ' . LEDGER_HORAS . 'h. '
                . 'Se ainda assim for a pauta certa, marque a caixa de ciência e publique.');
            voltar($alvo['id']);
        }

        foreach ($cards as &$c) {
            if ($c['id'] === $alvo['id']) {
                $c['coluna']      = 'publicado';
                $c['linkPost']    = $link;
                $c['publicadoEm'] = date('c');
                anotar($c, $eu['nome'], 'Publicado.');
            }
        }
        unset($c);

        if (!gravar_cards($cards)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar($alvo['id']);
        }
        avisar('ok', 'Publicado. Guarde o arquivo com o nome padrão e anote o link no índice do Acervo.');
        voltar($alvo['id']);
    }

    /* ---------- corrigir o card ---------- */
    if ($acao === 'editar') {
        $titulo = limpar_texto($_POST['titulo'] ?? '', 200);
        $etapa  = limpar_texto($_POST['etapa'] ?? '', 20);
        $fonte  = limpar_texto($_POST['fonteUrl'] ?? '', 500);

        if ($titulo === '') {
            avisar('erro', 'O card precisa de um título — é ele que vira o nome do arquivo no Acervo.');
            voltar($alvo['id']);
        }
        if (!isset(ETAPAS[$etapa])) {
            avisar('erro', 'Etapa desconhecida.');
            voltar($alvo['id']);
        }
        /* A fonte pode ficar vazia (card aberto à mão), mas se vier tem de ser
           link de verdade: é ela que o Acervo guarda como prova da peça. */
        if ($fonte !== '' && filter_var($fonte, FILTER_VALIDATE_URL) === false) {
            avisar('erro', 'A fonte precisa ser um endereço de verdade, ou ficar em branco.');
            voltar($alvo['id']);
        }

        foreach ($cards as &$c) {
            if ($c['id'] !== $alvo['id']) {
                continue;
            }
            /* O nome do arquivo é GERADO do título e da etapa — mudar qualquer um
               dos dois muda o nome que o Estúdio vai exportar. Por isso a
               mudança fica anotada: quem já baixou o PNG com o nome antigo
               precisa saber que ele mudou. */
            if ($c['titulo'] !== $titulo || $c['etapa'] !== $etapa) {
                anotar($c, $eu['nome'], 'Corrigiu o card — o nome do arquivo mudou.');
            } else {
                anotar($c, $eu['nome'], 'Corrigiu o card.');
            }
            $c['titulo']      = $titulo;
            $c['etapa']       = $etapa;
            $c['prazo']       = limpar_texto($_POST['prazo'] ?? '', 20);
            $c['responsavel'] = limpar_texto($_POST['responsavel'] ?? '', 160);
            $c['fonteUrl']    = $fonte;
        }
        unset($c);

        if (!gravar_cards($cards)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar($alvo['id']);
        }
        avisar('ok', 'Card corrigido.');
        voltar($alvo['id']);
    }

    /* ---------- apagar o card ---------- */
    if ($acao === 'apagar') {
        /* Card publicado é o rastro de uma peça que foi ao ar: é ele que
           responde, na tela de Fatos, "o que foi feito com aquele fato", e o
           Acervo aponta para o link que está aqui dentro. Apagá-lo deixa peça
           publicada sem ficha que a justifique — e é isso que a Checagem existe
           para não permitir. Admin destrava, porque card publicado por engano
           também existe; qualquer outro apaga só o que ainda não foi ao ar. */
        if ($alvo['coluna'] === 'publicado' && !e_admin()) {
            avisar('erro', 'Card publicado não se apaga: é ele que responde “o que foi feito com aquele fato”, e o Acervo aponta para o link que está nele.');
            voltar($alvo['id']);
        }

        $cards = array_values(array_filter($cards, fn ($c) => $c['id'] !== $alvo['id']));
        if (!gravar_cards($cards)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar($alvo['id']);
        }
        /* O fato NÃO volta para a fila: ele foi checado, e a decisão continua
           tomada. O que some é a peça que ninguém vai fazer — e a tela de Fatos
           volta a mostrá-lo como "sem peça", que é a verdade. */
        avisar('ok', 'Card apagado. O fato continua checado, e volta a aparecer como “sem peça”.');
        voltar();
    }

    /* ---------- abrir a etapa seguinte do mesmo fato ---------- */
    if ($acao === 'nova-etapa') {
        $etapa = limpar_texto($_POST['etapa'] ?? '', 20);
        if (!isset(ETAPAS[$etapa])) {
            avisar('erro', 'Etapa desconhecida.');
            voltar($alvo['id']);
        }

        $novo = $alvo;
        $novo['id']          = novo_id_card();
        $novo['etapa']       = $etapa;
        $novo['coluna']      = 'a-fazer';
        $novo['donoId']      = '';
        $novo['donoNome']    = '';
        $novo['linkPost']    = '';
        $novo['publicadoEm'] = '';
        $novo['criadoEm']    = date('c');
        $novo['historico']   = [[
            'quando' => date('c'),
            'quem'   => $eu['nome'],
            'texto'  => 'Aberto a partir do card de ' . ETAPAS[$alvo['etapa']] . '.',
        ]];

        $cards[] = $novo;
        if (!gravar_cards($cards)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar($alvo['id']);
        }
        avisar('ok', 'Card de ' . ETAPAS[$etapa] . ' aberto em “A fazer”.');
        voltar($novo['id']);
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$hoje = date('Y-m-d');

abrir_pagina('Produção');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Produção',
      'Do fato checado ao post publicado. O card nasce quando a Checagem aprova — '
      . 'com a fonte e o responsável já colados nele.',
      null,
      '/painel/producao',
      [
          'Assumir um card é dizer que ele é seu — sem dono, ninguém sabe quem está devendo.',
          'Publicar pede o link do post: é ele que fecha o ciclo e alimenta o Acervo.',
          'O nome do arquivo é gerado, não digitado — o Estúdio gera o mesmo.',
          'Mesmo alvo duas vezes em 48h avisa e pede ciência. Avisa, não bloqueia.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php
  /* O quadro inteiro é peneirado de uma vez, e não coluna por coluna: procurar
     um card é procurar em que coluna ele está — se a busca recortasse só a
     coluna aberta, a resposta seria "não achei" justamente quando ele existe.
     As colunas vazias continuam desenhadas, com o número em zero: é a moldura
     do quadro que diz onde o card não está. */
  $buscaPr = limpar_texto($_GET['q'] ?? '', 60);
  $etapaF  = (string) ($_GET['etapa'] ?? '');
  if (!isset(ETAPAS[$etapaF])) {
      $etapaF = '';
  }
  /* "Meus" e "Sem dono" são as duas perguntas que se fazem num quadro cheio —
     o que eu estou devendo, e o que está largado esperando alguém. */
  $donoF = in_array($_GET['dono'] ?? '', ['meus', 'sem-dono', 'atrasados'], true) ? (string) $_GET['dono'] : '';

  $recortePr = function (array $c) use ($buscaPr, $etapaF, $donoF, $eu, $hoje) {
      if ($buscaPr !== '' && !combina_com([$c['titulo'], $c['donoNome'], $c['responsavel'], $c['fonteUrl'], nome_de_arquivo($c)], $buscaPr)) {
          return false;
      }
      if ($etapaF !== '' && $c['etapa'] !== $etapaF) {
          return false;
      }
      return match ($donoF) {
          'meus'      => $c['donoId'] === $eu['id'],
          'sem-dono'  => $c['donoId'] === '',
          'atrasados' => $c['coluna'] !== 'publicado' && $c['prazo'] !== '' && $c['prazo'] < $hoje,
          default     => true,
      };
  };

  $porColuna = [];
  $quantosCards = 0;
  $porEtapa = [];
  foreach (COLUNAS as $chave => $nome) {
      $daColuna = cards_da_coluna($chave);
      $quantosCards += count($daColuna);
      foreach ($daColuna as $c) {
          $porEtapa[$c['etapa']] = ($porEtapa[$c['etapa']] ?? 0) + 1;
      }
      $porColuna[$chave] = array_values(array_filter($daColuna, $recortePr));
  }
  $achados = array_sum(array_map('count', $porColuna));
  $recortado = $buscaPr !== '' || $etapaF !== '' || $donoF !== '';

  /* Qual card está aberto para correção. É um GET (`?editar=<id>`) e não estado
     de JavaScript: sem JS a página recarrega com o `<dialog open>` e o
     formulário continua ali. */
  $corrigindo = achar_card(limpar_texto($_GET['editar'] ?? '', 40));
  ?>

  <?php /* O filtro só aparece quando há o que filtrar: com quatro cards ele é
           três controles em cima de um quadro que cabe inteiro na tela. */ ?>
  <?php if ($quantosCards > 6 || $recortado): ?>
    <form method="get" class="filtros">
      <div class="campo">
        <label for="q">Procurar</label>
        <input id="q" name="q" type="search" maxlength="60" value="<?= h($buscaPr) ?>"
               placeholder="título, dono, alvo, fonte ou nome do arquivo"
               autocapitalize="none" spellcheck="false" title="Atalho: tecle /">
      </div>
      <div class="campo">
        <label for="fe">Peça</label>
        <select id="fe" name="etapa">
          <option value="">todas</option>
          <?php foreach (ETAPAS as $chave => $nome): ?>
            <?php if (($porEtapa[$chave] ?? 0) === 0 && $etapaF !== $chave) { continue; } ?>
            <option value="<?= h($chave) ?>" <?= $etapaF === $chave ? 'selected' : '' ?>>
              <?= h($nome) ?> (<?= (int) ($porEtapa[$chave] ?? 0) ?>)
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="campo">
        <label for="fd">Mostrar</label>
        <select id="fd" name="dono">
          <option value="">o quadro inteiro</option>
          <option value="meus"      <?= $donoF === 'meus'      ? 'selected' : '' ?>>os meus</option>
          <option value="sem-dono"  <?= $donoF === 'sem-dono'  ? 'selected' : '' ?>>sem dono</option>
          <option value="atrasados" <?= $donoF === 'atrasados' ? 'selected' : '' ?>>atrasados</option>
        </select>
      </div>
      <div class="acoes">
        <button class="btn" type="submit">Filtrar</button>
        <?php if ($recortado): ?>
          <a class="btn" href="/painel/producao.php">Limpar</a>
        <?php endif; ?>
      </div>
    </form>
    <?php if ($recortado): ?>
      <p class="dica" style="margin:-6px 0 18px">
        <?= $achados ?> de <?= $quantosCards ?> no quadro.
        <?php if ($achados === 0 && $buscaPr !== ''): ?>
          Confira a grafia — a busca ignora acento e maiúscula, mas não adivinha.
        <?php endif; ?>
      </p>
    <?php endif; ?>
  <?php endif; ?>

  <?php /* No celular o quadro vira uma pilha de quatro colunas: sem esta faixa,
           chegar em "Revisão" é rolar às cegas. */ ?>
  <nav class="atalho-colunas" aria-label="Colunas do quadro">
    <?php foreach (COLUNAS as $chave => $nome): ?>
      <a href="#coluna-<?= h($chave) ?>"><?= h($nome) ?> <span><?= count($porColuna[$chave]) ?></span></a>
    <?php endforeach; ?>
  </nav>

  <div class="quadro">
    <?php foreach (COLUNAS as $chave => $nome): ?>
      <?php $daColuna = $porColuna[$chave]; ?>
      <section class="coluna" id="coluna-<?= h($chave) ?>">
        <h2 class="coluna-topo">
          <?= h($nome) ?>
          <span class="coluna-conta"><?= count($daColuna) ?></span>
        </h2>

        <?php if ($daColuna === []): ?>
          <?php /* Tela vazia é onboarding: dizer o que vai cair aqui e quem põe
                   ensina o fluxo do manual sem obrigar ninguém a decorá-lo. Com
                   recorte ligado a coluna não está vazia, está recortada — e dizer
                   ali o texto de onboarding seria mentir sobre o quadro. */ ?>
          <p class="dica coluna-vazia">
            <?= $recortado ? 'Nada com esse recorte.' : h(COLUNA_VAZIA[$chave] ?? 'Vazio.') ?>
          </p>
        <?php endif; ?>

        <?php foreach ($daColuna as $c): ?>
          <?php
            $atrasado = $chave !== 'publicado' && $c['prazo'] !== '' && $c['prazo'] < $hoje;
            $meu = $c['donoId'] === $eu['id'];
            $posicao = array_search($chave, array_keys(COLUNAS), true);
            $colunas = array_keys(COLUNAS);
          ?>
          <article class="card<?= $atrasado ? ' card-atrasado' : '' ?>" id="<?= h($c['id']) ?>">
            <header class="card-topo">
              <span class="selo"><?= h(ETAPAS[$c['etapa']]) ?></span>
              <?php if ($atrasado): ?>
                <span class="selo selo-off">atrasado</span>
              <?php endif; ?>
            </header>

            <p class="card-titulo"><?= h($c['titulo']) ?></p>

            <p class="card-meta">
              <?php if ($c['responsavel'] !== ''): ?>
                Responsável: <?= h($c['responsavel']) ?><br>
              <?php endif; ?>
              <?php if ($c['fonteUrl'] !== ''): ?>
                <a href="<?= h($c['fonteUrl']) ?>" target="_blank" rel="noopener noreferrer">fonte</a> ·
              <?php endif; ?>
              <?= $c['donoNome'] !== '' ? h($c['donoNome']) : 'sem dono' ?>
            </p>

            <details class="decidir card-mais">
              <summary class="btn btn-mini">Abrir</summary>
              <div class="decidir-corpo">

                <p class="dica">Nome do arquivo, para o Acervo:</p>
                <p class="provisoria card-arquivo"><?= h(nome_de_arquivo($c)) ?></p>

                <!-- dono -->
                <form method="post">
                  <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                  <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                  <div class="acoes">
                    <?php if ($meu): ?>
                      <button type="submit" class="btn btn-mini" name="acao" value="soltar">Soltar o card</button>
                    <?php else: ?>
                      <button type="submit" class="btn btn-ouro" name="acao" value="assumir">
                        <?= $c['donoNome'] === '' ? 'Assumir' : 'Assumir no lugar de ' . h(explode(' ', $c['donoNome'])[0]) ?>
                      </button>
                    <?php endif; ?>
                  </div>
                </form>

                <!-- andar no quadro -->
                <?php if ($chave !== 'publicado'): ?>
                  <form method="post" class="decidir-recusa">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <div class="acoes">
                      <?php if ($posicao > 0): ?>
                        <button type="submit" class="btn btn-mini" name="coluna" value="<?= h($colunas[$posicao - 1]) ?>">
                          ← <?= h(COLUNAS[$colunas[$posicao - 1]]) ?>
                        </button>
                      <?php endif; ?>
                      <?php if ($chave !== 'revisao'): ?>
                        <button type="submit" class="btn btn-mini" name="coluna" value="<?= h($colunas[$posicao + 1]) ?>">
                          <?= h(COLUNAS[$colunas[$posicao + 1]]) ?> →
                        </button>
                      <?php endif; ?>
                    </div>
                    <input type="hidden" name="acao" value="mover">
                  </form>
                <?php endif; ?>

                <!-- publicar -->
                <?php if ($chave === 'revisao'): ?>
                  <?php $repetido = alvo_repetido($c['responsavel'], $c['id']); ?>
                  <form method="post" class="decidir-recusa">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <input type="hidden" name="acao" value="publicar">
                    <?php if (pode('aulas')): ?>
                      <p class="dica" style="margin:0 0 10px">
                        Antes de publicar, passe o checklist de conformidade:
                        <a href="/aulas#roteirista" target="_blank">a aula do Roteirista</a>.
                      </p>
                    <?php endif; ?>
                    <div class="campo">
                      <label for="link-<?= h($c['id']) ?>">Link do post publicado</label>
                      <input id="link-<?= h($c['id']) ?>" type="url" name="linkPost" maxlength="500"
                             inputmode="url" placeholder="https://…" required>
                    </div>
                    <?php if ($repetido !== null): ?>
                      <p class="msg msg-erro">
                        <strong>Regra do ledger.</strong> “<?= h($c['responsavel']) ?>” já foi alvo principal de
                        “<?= h($repetido['titulo']) ?>”, publicado há menos de <?= LEDGER_HORAS ?>h.
                      </p>
                      <label class="check">
                        <input type="checkbox" name="ciente" value="1">
                        Estou ciente e ainda assim é a pauta certa
                      </label>
                    <?php endif; ?>
                    <div class="acoes">
                      <button type="submit" class="btn btn-ouro">Publicar</button>
                    </div>
                  </form>
                <?php endif; ?>

                <!-- abrir a etapa seguinte -->
                <form method="post" class="decidir-recusa">
                  <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                  <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                  <input type="hidden" name="acao" value="nova-etapa">
                  <p class="dica">Abrir outra peça a partir do mesmo fato:</p>
                  <div class="acoes">
                    <?php foreach (ETAPAS as $eChave => $eNome): ?>
                      <?php if ($eChave !== $c['etapa']): ?>
                        <button type="submit" class="btn btn-mini" name="etapa" value="<?= h($eChave) ?>">
                          + <?= h($eNome) ?>
                        </button>
                      <?php endif; ?>
                    <?php endforeach; ?>
                  </div>
                </form>

                <?php if ($c['linkPost'] !== ''): ?>
                  <p class="dica">
                    Publicado em
                    <a href="<?= h($c['linkPost']) ?>" target="_blank" rel="noopener noreferrer">ver o post</a>
                  </p>
                <?php endif; ?>

                <?php /* Corrigir e apagar ficam por último, depois do que se faz
                         todo dia: são as ações raras, e a rara em cima da comum
                         é a que se clica sem querer. */ ?>
                <div class="decidir-recusa">
                  <div class="acoes">
                    <?php botao_modal('editar-card', 'Corrigir o card', 'editar=' . urlencode($c['id']) . '#' . $c['id'], 'btn btn-mini'); ?>
                    <?php if ($chave !== 'publicado' || e_admin()): ?>
                      <form method="post" style="display:inline"
                            onsubmit="return confirm(<?= texto_js($chave === 'publicado'
                                ? 'Apagar um card JÁ PUBLICADO? Some o rastro que liga a peça ao fato — e o Acervo aponta para o link que está nele.'
                                : 'Apagar este card? O fato continua checado e volta a aparecer como “sem peça”.') ?>)">
                        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                        <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                        <button type="submit" class="btn btn-mini btn-risco" name="acao" value="apagar">Apagar</button>
                      </form>
                    <?php endif; ?>
                  </div>
                </div>

                <?php if ($c['historico'] !== []): ?>
                  <p class="dica" style="margin-top:14px">Histórico</p>
                  <ul class="historico">
                    <?php foreach (array_reverse($c['historico']) as $h): ?>
                      <li>
                        <?= h($h['texto']) ?>
                        <span><?= h($h['quem']) ?><?= $h['quando'] !== '' ? ' · ' . h(date('d/m H:i', (int) strtotime($h['quando']))) : '' ?></span>
                      </li>
                    <?php endforeach; ?>
                  </ul>
                <?php endif; ?>
              </div>
            </details>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endforeach; ?>
  </div>

  <?php /* O modal fica no fim do documento, e não dentro do <article> do card:
           <dialog> aninhado em formulário é HTML inválido — o navegador
           reorganiza a árvore sozinha e o formulário some sem erro no console. */ ?>
  <?php if ($corrigindo !== null): ?>
    <?php abrir_modal('editar-card', 'Corrigir o card', true); ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="id" value="<?= h($corrigindo['id']) ?>">
        <input type="hidden" name="acao" value="editar">

        <div class="campo">
          <label for="c-titulo">Título</label>
          <input id="c-titulo" type="text" name="titulo" maxlength="200" required
                 value="<?= h($corrigindo['titulo']) ?>">
        </div>

        <div class="linha g2">
          <div class="campo">
            <label for="c-etapa">Peça</label>
            <select id="c-etapa" name="etapa">
              <?php foreach (ETAPAS as $chaveE => $nomeE): ?>
                <option value="<?= h($chaveE) ?>" <?= $corrigindo['etapa'] === $chaveE ? 'selected' : '' ?>>
                  <?= h($nomeE) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="campo">
            <label for="c-prazo">Prazo <span class="dica">— opcional</span></label>
            <input id="c-prazo" type="date" name="prazo" value="<?= h($corrigindo['prazo']) ?>">
          </div>
        </div>

        <div class="campo">
          <label for="c-resp">Alvo principal <span class="dica">— é sobre ele que a regra do ledger conta as 48h</span></label>
          <input id="c-resp" type="text" name="responsavel" maxlength="160"
                 value="<?= h($corrigindo['responsavel']) ?>">
        </div>

        <div class="campo">
          <label for="c-fonte">Link da fonte</label>
          <input id="c-fonte" type="url" name="fonteUrl" maxlength="500" inputmode="url"
                 placeholder="https://…" value="<?= h($corrigindo['fonteUrl']) ?>">
        </div>

        <p class="dica">
          O nome do arquivo é gerado do título e da peça — mudar qualquer um dos dois
          muda o nome que o Estúdio vai exportar, e quem já baixou o PNG ficou com o
          antigo. Por isso a correção fica anotada no histórico do card.
        </p>

        <div class="acoes">
          <button type="submit" class="btn btn-ouro">Salvar o card</button>
        </div>
      </form>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
fechar_pagina();
