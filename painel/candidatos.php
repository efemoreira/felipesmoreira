<?php
declare(strict_types=1);

/**
 * Candidatos — felipesmoreira.com/painel/candidatos
 *
 * Quem a coordenação cadastra aqui aparece em /candidatos, e é dali que sai a
 * colinha que o militante manda no grupo e o eleitor leva para a urna.
 *
 * Uma tela de cadastro, e não uma lista no código: nome de urna e número saem
 * do registro no TSE e mudam até a véspera. Lista no repositório é lista que
 * exige um deploy para corrigir um dígito errado.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/candidatos-comum.php';
exigir_area('candidatos');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(): void
{
    header('Location: /painel/candidatos.php', true, 302);
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
    $lista = ler_candidatos();

    if ($acao === 'criar') {
        $novo = [
            'id'     => novo_id_candidato(),
            'nome'   => $_POST['nome'] ?? '',
            'urna'   => $_POST['urna'] ?? '',
            'cargo'  => $_POST['cargo'] ?? '',
            'numero' => $_POST['numero'] ?? '',
            'partido' => $_POST['partido'] ?? '',
            'instagram' => $_POST['instagram'] ?? '',
            'grupos' => (array) ($_POST['grupos'] ?? []),
            'ordem'  => $_POST['ordem'] ?? 0,
            'publicado' => false,
            'criadoEm'  => date('c'),
        ];
        if (normalizar_candidato($novo) === null) {
            avisar('erro', 'Precisa de nome e número — sem o número não dá para votar, e a colinha existe para isso.');
            voltar();
        }
        $lista[] = $novo;
        avisar('ok', 'Candidato cadastrado. Confira e publique quando estiver certo.');
    } elseif ($acao === 'publicar' || $acao === 'apagar' || $acao === 'salvar') {
        $id = limpar_texto($_POST['id'] ?? '', 40);
        $achou = false;
        foreach ($lista as $i => $c) {
            if ($c['id'] !== $id) {
                continue;
            }
            $achou = true;
            if ($acao === 'apagar') {
                unset($lista[$i]);
                avisar('ok', 'Candidato apagado.');
            } elseif ($acao === 'publicar') {
                $lista[$i]['publicado'] = !$c['publicado'];
                avisar('ok', $lista[$i]['publicado'] ? 'No ar em /candidatos.' : 'Recolhido do site.');
            } else {
                $lista[$i] = array_merge($c, [
                    'nome'   => $_POST['nome'] ?? $c['nome'],
                    'urna'   => $_POST['urna'] ?? '',
                    'cargo'  => $_POST['cargo'] ?? '',
                    'numero' => $_POST['numero'] ?? $c['numero'],
                    'partido' => $_POST['partido'] ?? '',
                    'instagram' => $_POST['instagram'] ?? '',
                    'grupos' => (array) ($_POST['grupos'] ?? []),
                    'ordem'  => $_POST['ordem'] ?? 0,
                ]);
                if (normalizar_candidato($lista[$i]) === null) {
                    avisar('erro', 'Nome e número são obrigatórios.');
                    voltar();
                }
                avisar('ok', 'Alterado.');
            }
            break;
        }
        if (!$achou) {
            avisar('erro', 'Candidato não encontrado.');
            voltar();
        }
    } else {
        avisar('erro', 'Ação desconhecida.');
        voltar();
    }

    if (!gravar_candidatos(array_values($lista))) {
        avisar('erro', 'Não consegui gravar em /dados.');
    }
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$todos = ler_candidatos();
$noAr = count(array_filter($todos, fn ($c) => $c['publicado']));

abrir_pagina('Candidatos');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Candidatos',
      'Nome de urna, número e @ de cada um. É desta lista que sai a colinha em '
      . '<a href="/candidatos" target="_blank">/candidatos</a>, que o militante manda no grupo.',
      null,
      null,
      [
          'Cadastrar candidato: sem número ele não entra — colinha com número errado é pior que colinha nenhuma.',
          'Publicar e recolher: só o que está no ar aparece no site.',
          'Os grupos são múltiplos — a mesma pessoa pode ser federal, mulher e escolhida.',
          '“Os escolhidos” é a curadoria: são eles que aparecem na página inicial.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <fieldset>
    <legend>No ar (<?= $noAr ?> de <?= count($todos) ?>)</legend>

    <?php if ($todos === []): ?>
      <p class="dica" style="margin:0">
        Ninguém cadastrado ainda. Enquanto a lista estiver vazia, o bloco “Siga nossos
        candidatos” não aparece no site — é melhor não dizer nada do que deixar um
        buraco onde o eleitor espera o número.
      </p>
    <?php else: ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th>Quem</th><th>Número</th><th>Grupos</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($todos as $c): ?>
              <tr>
                <td>
                  <strong><?= h($c['urna'] !== '' ? $c['urna'] : $c['nome']) ?></strong><br>
                  <span class="dica">
                    <?= h($c['cargo']) ?><?= $c['partido'] !== '' ? ' · ' . h($c['partido']) : '' ?>
                    <?= $c['instagram'] !== '' ? ' · @' . h($c['instagram']) : '' ?>
                  </span>
                </td>
                <td><strong style="font-size:19px"><?= h($c['numero']) ?></strong></td>
                <td>
                  <?php foreach ($c['grupos'] as $g): ?>
                    <span class="selo"><?= h(GRUPOS_CANDIDATO[$g]) ?></span>
                  <?php endforeach; ?>
                </td>
                <td>
                  <span class="selo <?= $c['publicado'] ? 'selo-ok' : 'selo-cinza' ?>">
                    <?= $c['publicado'] ? 'no ar' : 'rascunho' ?>
                  </span>
                </td>
                <td>
                  <form method="post" style="display:inline">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <button class="btn btn-mini" name="acao" value="publicar" type="submit">
                      <?= $c['publicado'] ? 'Recolher' : 'Publicar' ?>
                    </button>
                  </form>
                  <form method="post" style="display:inline"
                        onsubmit="return confirm('Apagar este candidato?')">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                    <button class="btn btn-mini btn-risco" name="acao" value="apagar" type="submit">Apagar</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset>
    <legend>Cadastrar candidato</legend>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <div class="linha g2">
        <div class="campo">
          <label for="c-nome">Nome</label>
          <input id="c-nome" name="nome" type="text" maxlength="80" required>
        </div>
        <div class="campo">
          <label for="c-urna">Nome de urna</label>
          <input id="c-urna" name="urna" type="text" maxlength="60" placeholder="como aparece na urna">
        </div>
      </div>
      <div class="linha g3">
        <div class="campo">
          <label for="c-numero">Número</label>
          <input id="c-numero" name="numero" type="text" inputmode="numeric" maxlength="6" required>
        </div>
        <div class="campo">
          <label for="c-cargo">Cargo</label>
          <input id="c-cargo" name="cargo" type="text" maxlength="60" placeholder="Deputado Federal">
        </div>
        <div class="campo">
          <label for="c-partido">Partido</label>
          <input id="c-partido" name="partido" type="text" maxlength="40" value="Missão">
        </div>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="c-insta">Instagram</label>
          <input id="c-insta" name="instagram" type="text" maxlength="60" placeholder="@perfil">
          <p class="dica">Só o @, ou cole o link — dá na mesma.</p>
        </div>
        <div class="campo">
          <label for="c-ordem">Ordem na lista</label>
          <input id="c-ordem" name="ordem" type="number" min="0" max="999" value="0">
          <p class="dica">Menor primeiro. Empate desempata pelo nome.</p>
        </div>
      </div>

      <p class="dica" style="margin:14px 0 6px">Em que grupos ele entra (pode marcar vários):</p>
      <?php foreach (GRUPOS_CANDIDATO as $chave => $nome): ?>
        <label class="check">
          <input type="checkbox" name="grupos[]" value="<?= h($chave) ?>">
          <?= h($nome) ?>
        </label>
      <?php endforeach; ?>

      <div class="acoes" style="margin-top:14px">
        <button class="btn btn-ouro" name="acao" value="criar" type="submit">Cadastrar</button>
      </div>
    </form>
  </fieldset>
</div>
<?php
fechar_pagina();
