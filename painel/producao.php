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
require_once __DIR__ . '/kit-comum.php';
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

    /* ---- peças do kit ----
       Ficam antes da busca do card: elas não têm card, e a checagem abaixo
       derrubaria toda ação do kit com "Card não encontrado". */
    if ($acao === 'kit-nova' || $acao === 'kit-publicar' || $acao === 'kit-apagar') {
        $pecas = ler_pecas();

        if ($acao === 'kit-nova') {
            $u = usuario_atual();
            $nova = [
                'id'        => normalizar_id_peca($_POST['numero'] ?? '') . '-' . substr(bin2hex(random_bytes(2)), 0, 4),
                'tema'      => $_POST['tema'] ?? '',
                'numero'    => $_POST['numero'] ?? '',
                'frase'     => $_POST['frase'] ?? '',
                'fonte'     => $_POST['fonte'] ?? '',
                'legenda'   => $_POST['legenda'] ?? '',
                'destino'   => $_POST['destino'] ?? '',
                'publicada' => false,
                'criadaEm'  => date('c'),
                'criadaPor' => (string) ($u['nome'] ?? ''),
            ];
            if (normalizar_peca($nova) === null) {
                avisar('erro', 'A peça precisa de número, frase e fonte — sem fonte ela não entra.');
                voltar();
            }
            $pecas[] = $nova;
            avisar('ok', 'Peça criada. Publique quando quiser que ela apareça no kit.');
        } else {
            $id = normalizar_id_peca($_POST['id'] ?? '');
            $achou = false;
            foreach ($pecas as $i => $pc) {
                if ($pc['id'] !== $id) {
                    continue;
                }
                $achou = true;
                if ($acao === 'kit-apagar') {
                    unset($pecas[$i]);
                    avisar('ok', 'Peça apagada.');
                } else {
                    $pecas[$i]['publicada'] = !$pc['publicada'];
                    avisar('ok', $pecas[$i]['publicada'] ? 'Peça no ar.' : 'Peça recolhida.');
                }
                break;
            }
            if (!$achou) {
                avisar('erro', 'Peça não encontrada.');
                voltar();
            }
        }

        if (!gravar_pecas(array_values($pecas))) {
            avisar('erro', 'Não consegui gravar as peças do kit.');
        }
        voltar();
    }

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
      '/painel/producao'
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php $pecasKit = ler_pecas(); $noAr = count(array_filter($pecasKit, fn ($p) => $p['publicada'])); ?>
  <details class="decidir" style="margin-bottom:22px">
    <summary class="btn">Peças do kit do mutirão (<?= $noAr ?> no ar)</summary>
    <div class="decidir-corpo">
      <p class="dica" style="margin:0 0 14px">
        O <a href="/kit" target="_blank">kit</a> já vem com as peças fixas do plano de governo.
        Aqui entra o que é da semana — o fato que acabou de sair, o número novo. Só aparece no
        site depois de publicada, e <strong>peça sem fonte não é aceita</strong>: ela circula muito
        mais longe que um post.
      </p>

      <?php if ($pecasKit !== []): ?>
        <div class="rolagem">
          <table class="tabela">
            <thead><tr><th>Peça</th><th>Fonte</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              <?php foreach ($pecasKit as $pc): ?>
                <tr>
                  <td>
                    <strong><?= h($pc['numero']) ?></strong><br>
                    <span class="dica"><?= h($pc['frase']) ?></span>
                  </td>
                  <td><span class="selo"><?= h($pc['fonte']) ?></span></td>
                  <td>
                    <span class="selo <?= $pc['publicada'] ? 'selo-ok' : 'selo-cinza' ?>">
                      <?= $pc['publicada'] ? 'no ar' : 'rascunho' ?>
                    </span>
                  </td>
                  <td>
                    <form method="post" style="display:inline">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="id" value="<?= h($pc['id']) ?>">
                      <button class="btn" name="acao" value="kit-publicar" type="submit">
                        <?= $pc['publicada'] ? 'Recolher' : 'Publicar' ?>
                      </button>
                    </form>
                    <form method="post" style="display:inline"
                          onsubmit="return confirm('Apagar esta peça do kit?')">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="id" value="<?= h($pc['id']) ?>">
                      <button class="btn" name="acao" value="kit-apagar" type="submit">Apagar</button>
                    </form>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

      <form method="post" style="margin-top:18px">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <label for="kit-numero">O número, curto (é o que fica grande no cartão)</label>
        <input id="kit-numero" name="numero" type="text" maxlength="20" required placeholder="64 mil">

        <label for="kit-frase">A frase que explica o número</label>
        <input id="kit-frase" name="frase" type="text" maxlength="160" required
               placeholder="pessoas esperando na fila da regulação.">

        <label for="kit-fonte">A fonte, com página ou data</label>
        <input id="kit-fonte" name="fonte" type="text" maxlength="80" required
               placeholder="Plano de Governo, p. 31">

        <label for="kit-tema">Tema</label>
        <select id="kit-tema" name="tema">
          <?php foreach (TEMAS_KIT as $t): ?>
            <option value="<?= h($t) ?>"><?= h($t) ?></option>
          <?php endforeach; ?>
        </select>

        <label for="kit-destino">Para onde o link leva</label>
        <input id="kit-destino" name="destino" type="text" maxlength="120" value="/propostas"
               placeholder="/propostas#saude-que-chega">

        <label for="kit-legenda">O texto pronto pra colar</label>
        <textarea id="kit-legenda" name="legenda" rows="5" maxlength="900"
                  placeholder="64 mil cearenses esperando na fila da regulação..."></textarea>

        <div class="acoes" style="margin-top:12px">
          <button class="btn btn-ouro" name="acao" value="kit-nova" type="submit">Criar peça</button>
        </div>
      </form>
    </div>
  </details>

  <?php /* No celular o quadro vira uma pilha de quatro colunas: sem esta faixa,
           chegar em "Revisão" é rolar às cegas. */ ?>
  <nav class="atalho-colunas" aria-label="Colunas do quadro">
    <?php foreach (COLUNAS as $chave => $nome): ?>
      <a href="#coluna-<?= h($chave) ?>"><?= h($nome) ?> <span><?= count(cards_da_coluna($chave)) ?></span></a>
    <?php endforeach; ?>
  </nav>

  <div class="quadro">
    <?php foreach (COLUNAS as $chave => $nome): ?>
      <?php $daColuna = cards_da_coluna($chave); ?>
      <section class="coluna" id="coluna-<?= h($chave) ?>">
        <h2 class="coluna-topo">
          <?= h($nome) ?>
          <span class="coluna-conta"><?= count($daColuna) ?></span>
        </h2>

        <?php if ($daColuna === []): ?>
          <?php /* Tela vazia é onboarding: dizer o que vai cair aqui e quem põe
                   ensina o fluxo do manual sem obrigar ninguém a decorá-lo. */ ?>
          <p class="dica coluna-vazia"><?= h(COLUNA_VAZIA[$chave] ?? 'Vazio.') ?></p>
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
</div>
<?php
fechar_pagina();
