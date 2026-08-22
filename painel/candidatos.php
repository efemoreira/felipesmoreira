<?php
declare(strict_types=1);

/**
 * Candidatos — felipesmoreira.com/painel/candidatos
 *
 * DUAS COISAS SEPARADAS, e é a separação que faz a tela funcionar:
 *
 *   1. **Cadastrar** quem é candidato — nome, número, @, foto. Rápido, sem
 *      decisão nenhuma junto: registrar o número é urgente, classificar não.
 *   2. **Montar listas** — "Deputados federais", "As mulheres da chapa", "Os
 *      que eu apoio". É a lista que vira colinha no site.
 *
 * A primeira versão obrigava a marcar grupos fixos na hora do cadastro. Estava
 * errada nos dois lados: atrapalhava o cadastro (que só quer o número certo) e
 * engessava as listas em categorias decididas no código, quando lista é
 * conteúdo de campanha e muda toda semana.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/candidatos-comum.php';
require_once __DIR__ . '/agenda-comum.php';  // o pipeline de imagem (upload, corte, apagar)
exigir_area('candidatos');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $ancora = ''): void
{
    header('Location: /painel/candidatos.php' . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
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

    /* ---------- candidatos ---------- */
    if (str_starts_with($acao, 'cand-')) {
        $lista = ler_candidatos();

        if ($acao === 'cand-novo' || $acao === 'cand-salvar') {
            $id = $acao === 'cand-novo' ? novo_id_candidato() : limpar_texto($_POST['id'] ?? '', 40);
            $atual = achar_candidato($id);

            /* A foto é opcional e não pode derrubar o cadastro: número certo no
               ar vale mais que rosto. Falha de upload avisa e segue. */
            $imagem = (string) ($atual['imagem'] ?? '');
            if (($env = arquivo_simples('imagem')) !== null) {
                $r = guardar_upload($env);
                if ($r['ok']) {
                    apagar_imagem($imagem);
                    $imagem = $r['caminho'];
                } elseif ($r['erro'] !== '') {
                    avisar('erro', $r['erro'] . ' O resto foi salvo.');
                }
            } elseif (!empty($_POST['tirarImagem'])) {
                apagar_imagem($imagem);
                $imagem = '';
            }

            $ficha = [
                'id'     => $id,
                'nome'   => $_POST['nome'] ?? '',
                'urna'   => $_POST['urna'] ?? '',
                'cargo'  => $_POST['cargo'] ?? '',
                'numero' => $_POST['numero'] ?? '',
                'partido' => $_POST['partido'] ?? '',
                'instagram' => $_POST['instagram'] ?? '',
                'imagem' => $imagem,
                'ordem'  => $_POST['ordem'] ?? 0,
                'publicado' => $atual['publicado'] ?? false,
                'criadoEm'  => $atual['criadoEm'] ?? date('c'),
            ];
            if (normalizar_candidato($ficha) === null) {
                avisar('erro', 'Precisa de nome e número — sem o número não dá para votar, e a colinha existe para isso.');
                voltar('cadastro');
            }

            if ($atual === null) {
                $lista[] = $ficha;
                avisar('ok', 'Cadastrado. Publique quando o número estiver conferido.');
            } else {
                foreach ($lista as $i => $c) {
                    if ($c['id'] === $id) {
                        $lista[$i] = $ficha;
                    }
                }
                avisar('ok', 'Alterado.');
            }
        } else {
            $id = limpar_texto($_POST['id'] ?? '', 40);
            $achou = false;
            foreach ($lista as $i => $c) {
                if ($c['id'] !== $id) {
                    continue;
                }
                $achou = true;
                if ($acao === 'cand-apagar') {
                    apagar_imagem($c['imagem']);
                    unset($lista[$i]);
                    avisar('ok', 'Candidato apagado. Ele sai das listas junto.');
                } elseif ($acao === 'cand-publicar') {
                    $lista[$i]['publicado'] = !$c['publicado'];
                    avisar('ok', $lista[$i]['publicado'] ? 'No ar em /candidatos.' : 'Recolhido do site.');
                }
                break;
            }
            if (!$achou) {
                avisar('erro', 'Candidato não encontrado.');
                voltar();
            }
        }

        if (!gravar_candidatos(array_values($lista))) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar('cadastro');
    }

    /* ---------- listas ---------- */
    if (str_starts_with($acao, 'lista-')) {
        $listas = ler_listas();

        if ($acao === 'lista-nova') {
            $nova = [
                'id'    => novo_id_lista(),
                'nome'  => $_POST['nome'] ?? '',
                'descricao' => $_POST['descricao'] ?? '',
                'candidatos' => [],
                'publicada' => false,
                'naHome' => false,
                'ordem' => $_POST['ordem'] ?? 0,
                'criadoEm' => date('c'),
            ];
            if (normalizar_lista($nova) === null) {
                avisar('erro', 'Dê um nome à lista — é ele que aparece como título da colinha.');
                voltar('listas');
            }
            $listas[] = $nova;
            avisar('ok', 'Lista criada. Agora escolha quem entra nela.');
        } else {
            $id = limpar_texto($_POST['id'] ?? '', 40);
            $achou = false;
            foreach ($listas as $i => $l) {
                if ($l['id'] !== $id) {
                    continue;
                }
                $achou = true;
                if ($acao === 'lista-apagar') {
                    unset($listas[$i]);
                    avisar('ok', 'Lista apagada. Os candidatos continuam cadastrados.');
                } elseif ($acao === 'lista-publicar') {
                    $listas[$i]['publicada'] = !$l['publicada'];
                    avisar('ok', $listas[$i]['publicada'] ? 'Lista no ar.' : 'Lista recolhida.');
                } elseif ($acao === 'lista-home') {
                    /* Uma só na home. Marcar a segunda desmarca a primeira em
                       vez de recusar: quem clicou já decidiu qual quer. */
                    foreach ($listas as $j => $outra) {
                        $listas[$j]['naHome'] = false;
                    }
                    $listas[$i]['naHome'] = !$l['naHome'];
                    avisar('ok', $listas[$i]['naHome'] ? 'É esta que aparece na página inicial.' : 'A home volta a não mostrar lista nenhuma.');
                } elseif ($acao === 'lista-quem') {
                    $marcados = array_map('strval', (array) ($_POST['candidato'] ?? []));
                    /* Preserva a ORDEM que a coordenação arrastou, e não a ordem
                       dos checkboxes: numa colinha quem vem primeiro é decisão. */
                    $ordenados = [];
                    foreach (explode(',', (string) ($_POST['ordem_ids'] ?? '')) as $cid) {
                        $cid = trim($cid);
                        if ($cid !== '' && in_array($cid, $marcados, true) && !in_array($cid, $ordenados, true)) {
                            $ordenados[] = $cid;
                        }
                    }
                    foreach ($marcados as $cid) {
                        if (!in_array($cid, $ordenados, true)) {
                            $ordenados[] = $cid;
                        }
                    }
                    $listas[$i]['candidatos'] = $ordenados;
                    avisar('ok', count($ordenados) . ' na lista “' . $l['nome'] . '”.');
                }
                break;
            }
            if (!$achou) {
                avisar('erro', 'Lista não encontrada.');
                voltar('listas');
            }
        }

        if (!gravar_listas(array_values($listas))) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar('listas');
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$todos  = ler_candidatos();
$listas = ler_listas();
$noAr   = count(array_filter($todos, fn ($c) => $c['publicado']));
$porId  = [];
foreach ($todos as $c) {
    $porId[$c['id']] = $c;
}
$editando = achar_candidato(limpar_texto($_GET['c'] ?? '', 40));

abrir_pagina('Candidatos');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Candidatos',
      'Cadastre quem é candidato; depois monte as listas que viram colinha em '
      . '<a href="/candidatos" target="_blank">/candidatos</a>.',
      null,
      null,
      [
          'Cadastrar é rápido: nome e número bastam. Foto, cargo e @ são opcionais.',
          'Publicar põe o candidato no ar; recolher tira dele todas as listas de uma vez.',
          'Lista é curadoria — o nome dela vira o título da colinha que circula no grupo.',
          'Uma lista pode ir para a página inicial. Só uma, porque a home tem pouca paciência.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <nav class="secoes" aria-label="Seções">
    <a href="#cadastro">Candidatos <span><?= count($todos) ?></span></a>
    <a href="#listas">Listas <span><?= count($listas) ?></span></a>
  </nav>

  <!-- ============ as listas ============ -->
  <fieldset id="listas">
    <legend>Listas (<?= count($listas) ?>)</legend>
    <p class="dica" style="margin:0 0 14px">
      Cada lista vira uma colinha no site, com o nome dela por título. A ordem em
      que os candidatos aparecem é a ordem da colinha — quem vem primeiro é quem
      você quer que seja lembrado primeiro.
    </p>

    <?php if ($todos === []): ?>
      <p class="dica" style="margin:0">
        Cadastre alguém primeiro, ali embaixo. Lista vazia não aparece no site.
      </p>
    <?php else: ?>
      <?php foreach ($listas as $l): ?>
        <?php $dentro = array_values(array_filter($l['candidatos'], fn ($id) => isset($porId[$id]))); ?>
        <article class="ficha">
          <header class="ficha-topo">
            <span class="ficha-quem">
              <strong><?= h($l['nome']) ?></strong>
              <span>
                <?= count($dentro) ?> <?= count($dentro) === 1 ? 'candidato' : 'candidatos' ?>
                <?= $l['descricao'] !== '' ? ' · ' . h($l['descricao']) : '' ?>
              </span>
            </span>
            <span>
              <span class="selo <?= $l['publicada'] ? 'selo-ok' : 'selo-cinza' ?>">
                <?= $l['publicada'] ? 'no ar' : 'rascunho' ?>
              </span>
              <?php if ($l['naHome']): ?>
                <span class="selo">na home</span>
              <?php endif; ?>
            </span>
          </header>

          <?php if ($dentro !== []): ?>
            <p style="margin:0 0 10px">
              <?php foreach ($dentro as $cid): ?>
                <span class="selo"><?= h($porId[$cid]['numero']) ?> <?= h($porId[$cid]['urna'] !== '' ? $porId[$cid]['urna'] : $porId[$cid]['nome']) ?></span>
              <?php endforeach; ?>
            </p>
          <?php endif; ?>

          <details class="decidir">
            <summary class="btn">Quem entra nesta lista</summary>
            <div class="decidir-corpo">
              <form method="post">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                <input type="hidden" name="acao" value="lista-quem">
                <input type="hidden" name="ordem_ids" value="<?= h(implode(',', $l['candidatos'])) ?>">
                <?php foreach ($todos as $c): ?>
                  <label class="check">
                    <input type="checkbox" name="candidato[]" value="<?= h($c['id']) ?>"
                           <?= in_array($c['id'], $l['candidatos'], true) ? 'checked' : '' ?>>
                    <strong><?= h($c['numero']) ?></strong>
                    <?= h($c['urna'] !== '' ? $c['urna'] : $c['nome']) ?>
                    <?php if (!$c['publicado']): ?>
                      <span class="selo selo-cinza">rascunho</span>
                    <?php endif; ?>
                  </label>
                <?php endforeach; ?>
                <p class="dica">
                  Quem está como rascunho pode entrar na lista, mas não aparece no site
                  enquanto não for publicado.
                </p>
                <div class="acoes" style="margin-top:12px">
                  <button type="submit" class="btn btn-ouro">Salvar quem está na lista</button>
                </div>
              </form>

              <div class="decidir-recusa">
                <div class="acoes">
                  <form method="post" style="display:inline">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                    <button class="btn" name="acao" value="lista-publicar" type="submit">
                      <?= $l['publicada'] ? 'Recolher do site' : 'Publicar no site' ?>
                    </button>
                  </form>
                  <form method="post" style="display:inline">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                    <button class="btn" name="acao" value="lista-home" type="submit">
                      <?= $l['naHome'] ? 'Tirar da página inicial' : 'Mostrar na página inicial' ?>
                    </button>
                  </form>
                  <form method="post" style="display:inline"
                        onsubmit="return confirm('Apagar a lista “<?= h($l['nome']) ?>”? Os candidatos continuam cadastrados.')">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                    <button class="btn btn-risco" name="acao" value="lista-apagar" type="submit">Apagar a lista</button>
                  </form>
                </div>
              </div>
            </div>
          </details>
        </article>
      <?php endforeach; ?>

      <details class="decidir" style="margin-top:16px">
        <summary class="btn btn-ouro">Nova lista</summary>
        <div class="decidir-corpo">
          <form method="post">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <div class="campo">
              <label for="l-nome">Nome da lista</label>
              <input id="l-nome" name="nome" type="text" maxlength="60" required
                     placeholder="Deputados federais">
              <p class="dica">Vira o título da colinha. Escreva como você diria no grupo.</p>
            </div>
            <div class="linha g2">
              <div class="campo">
                <label for="l-desc">Descrição <span class="dica">— opcional</span></label>
                <input id="l-desc" name="descricao" type="text" maxlength="160">
              </div>
              <div class="campo">
                <label for="l-ordem">Ordem</label>
                <input id="l-ordem" name="ordem" type="number" min="0" max="999" value="0">
              </div>
            </div>
            <div class="acoes">
              <button class="btn btn-ouro" name="acao" value="lista-nova" type="submit">Criar lista</button>
            </div>
          </form>
        </div>
      </details>
    <?php endif; ?>
  </fieldset>

  <!-- ============ o cadastro ============ -->
  <fieldset id="cadastro">
    <legend>Candidatos (<?= $noAr ?> no ar de <?= count($todos) ?>)</legend>

    <?php if ($todos === []): ?>
      <p class="dica" style="margin:0 0 14px">
        Ninguém cadastrado ainda. Enquanto não houver lista publicada, o bloco da
        página inicial não aparece — é melhor não dizer nada do que deixar um buraco
        onde o eleitor espera um número.
      </p>
    <?php else: ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th></th><th>Quem</th><th>Número</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($todos as $c): ?>
              <tr>
                <td>
                  <?php if ($c['imagem'] !== ''): ?>
                    <img src="<?= h($c['imagem']) ?>" alt="" width="52" height="52"
                         style="width:52px;height:52px;object-fit:cover;border:2px solid var(--linha-2)">
                  <?php endif; ?>
                </td>
                <td>
                  <strong><?= h($c['urna'] !== '' ? $c['urna'] : $c['nome']) ?></strong><br>
                  <span class="dica">
                    <?= h($c['cargo']) ?><?= $c['partido'] !== '' ? ' · ' . h($c['partido']) : '' ?>
                    <?= $c['instagram'] !== '' ? ' · @' . h($c['instagram']) : '' ?>
                  </span>
                </td>
                <td><strong style="font-size:19px"><?= h($c['numero']) ?></strong></td>
                <td>
                  <span class="selo <?= $c['publicado'] ? 'selo-ok' : 'selo-cinza' ?>">
                    <?= $c['publicado'] ? 'no ar' : 'rascunho' ?>
                  </span>
                </td>
                <td>
                  <a class="btn btn-mini" href="?c=<?= h($c['id']) ?>#cadastro">Editar</a>
                  <form method="post" style="display:inline">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <button class="btn btn-mini" name="acao" value="cand-publicar" type="submit">
                      <?= $c['publicado'] ? 'Recolher' : 'Publicar' ?>
                    </button>
                  </form>
                  <form method="post" style="display:inline"
                        onsubmit="return confirm('Apagar <?= h($c['nome']) ?>?')">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <button class="btn btn-mini btn-risco" name="acao" value="cand-apagar" type="submit">Apagar</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>

    <h3 style="margin:22px 0 12px"><?= $editando ? 'Editar ' . h($editando['nome']) : 'Cadastrar candidato' ?></h3>
    <form method="post" enctype="multipart/form-data">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <?php if ($editando): ?>
        <input type="hidden" name="id" value="<?= h($editando['id']) ?>">
      <?php endif; ?>
      <div class="linha g2">
        <div class="campo">
          <label for="c-nome">Nome</label>
          <input id="c-nome" name="nome" type="text" maxlength="80" required
                 value="<?= h($editando['nome'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="c-numero">Número</label>
          <input id="c-numero" name="numero" type="text" inputmode="numeric" maxlength="6" required
                 value="<?= h($editando['numero'] ?? '') ?>">
          <p class="dica">O que se digita na urna. É a única coisa, além do nome, que não pode faltar.</p>
        </div>
      </div>
      <div class="linha g3">
        <div class="campo">
          <label for="c-urna">Nome de urna <span class="dica">— opcional</span></label>
          <input id="c-urna" name="urna" type="text" maxlength="60"
                 value="<?= h($editando['urna'] ?? '') ?>" placeholder="como aparece na urna">
        </div>
        <div class="campo">
          <label for="c-cargo">Cargo <span class="dica">— opcional</span></label>
          <input id="c-cargo" name="cargo" type="text" maxlength="60"
                 value="<?= h($editando['cargo'] ?? '') ?>" placeholder="Deputado Federal">
        </div>
        <div class="campo">
          <label for="c-partido">Partido <span class="dica">— opcional</span></label>
          <input id="c-partido" name="partido" type="text" maxlength="40"
                 value="<?= h($editando['partido'] ?? 'Missão') ?>">
        </div>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="c-insta">Instagram <span class="dica">— opcional</span></label>
          <input id="c-insta" name="instagram" type="text" maxlength="60"
                 value="<?= $editando && $editando['instagram'] !== '' ? '@' . h($editando['instagram']) : '' ?>"
                 placeholder="@perfil">
          <p class="dica">Só o @, ou cole o link — dá na mesma.</p>
        </div>
        <div class="campo">
          <label for="c-ordem">Ordem na lista</label>
          <input id="c-ordem" name="ordem" type="number" min="0" max="999"
                 value="<?= (int) ($editando['ordem'] ?? 0) ?>">
          <p class="dica">Menor primeiro. Empate desempata pelo nome.</p>
        </div>
      </div>
      <div class="campo">
        <label for="c-img">Foto <span class="dica">— opcional</span></label>
        <?php if ($editando && $editando['imagem'] !== ''): ?>
          <p><img src="<?= h($editando['imagem']) ?>" alt="" style="max-width:180px;border:3px solid var(--linha-2)"></p>
          <label class="check">
            <input type="checkbox" name="tirarImagem" value="1"> Remover esta foto
          </label>
        <?php endif; ?>
        <input id="c-img" name="imagem" type="file" accept="image/*">
        <p class="dica">
          JPG, PNG ou WEBP até 8 MB. Sem foto o cartão mostra o número grande, que é o
          que o eleitor precisa mesmo levar.
        </p>
      </div>

      <div class="acoes">
        <button class="btn btn-ouro" name="acao" value="<?= $editando ? 'cand-salvar' : 'cand-novo' ?>" type="submit">
          <?= $editando ? 'Salvar' : 'Cadastrar' ?>
        </button>
        <?php if ($editando): ?>
          <a class="btn" href="/painel/candidatos.php#cadastro">Cancelar</a>
        <?php endif; ?>
      </div>
    </form>
  </fieldset>
</div>
<?php
fechar_pagina();
