<?php
declare(strict_types=1);

/**
 * Usuários do painel — felipesmoreira.com/painel/usuarios.php
 *
 * Só administrador entra. Aqui se cria quem acessa, se diz quais áreas cada um
 * abre e se reseta senha esquecida — que é o único caminho, porque só o hash
 * fica guardado e hash não volta a ser senha.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET) para o F5 não
 * repetir o que já foi feito.
 */

require_once __DIR__ . '/layout.php';
exigir_admin();

$eu = usuario_atual();

/** Guarda o recado para depois do redirecionamento. */
function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(): void
{
    header('Location: /painel/usuarios.php', true, 302);
    exit;
}

/** As áreas marcadas no formulário, filtradas contra as que existem. */
function areas_do_post(): array
{
    $pedidas = is_array($_POST['areas'] ?? null) ? $_POST['areas'] : [];
    return array_values(array_intersect(array_keys(AREAS), $pedidas));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!token_valido()) {
        avisar('erro', 'Sessão expirada. Entre de novo.');
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    $acao = (string) ($_POST['acao'] ?? '');
    $alvoId = (string) ($_POST['id'] ?? '');
    $usuarios = ler_usuarios();
    $alvo = $alvoId !== '' ? achar_usuario_por_id($alvoId) : null;

    if ($acao === 'criar') {
        $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
        $nome  = trim((string) ($_POST['nome'] ?? ''));
        $papel = ((string) ($_POST['papel'] ?? 'editor')) === 'admin' ? 'admin' : 'editor';

        if ($erro = validar_nome_usuario($login)) {
            avisar('erro', $erro);
        } elseif ($nome === '') {
            avisar('erro', 'Diga o nome da pessoa.');
        } elseif (achar_usuario($login) !== null) {
            avisar('erro', 'Já existe alguém com o login “' . $login . '”.');
        } else {
            $provisoria = senha_provisoria();
            $usuarios[] = [
                'id'          => novo_id_usuario(),
                'usuario'     => $login,
                'nome'        => mb_substr($nome, 0, 60),
                'hash'        => password_hash($provisoria, PASSWORD_DEFAULT),
                'papel'       => $papel,
                'areas'       => areas_do_post(),
                'ativo'       => true,
                'trocarSenha' => true,   // troca obrigatória no primeiro login
                'criadoEm'    => date('c'),
            ];
            if (gravar_usuarios($usuarios)) {
                $_SESSION['provisoria'] = ['usuario' => $login, 'senha' => $provisoria];
                avisar('ok', 'Usuário “' . $login . '” criado.');
            } else {
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões no hPanel.');
            }
        }
        voltar();
    }

    if ($alvo === null) {
        avisar('erro', 'Usuário não encontrado.');
        voltar();
    }

    if ($acao === 'salvar') {
        $nome  = trim((string) ($_POST['nome'] ?? ''));
        $papel = ((string) ($_POST['papel'] ?? 'editor')) === 'admin' ? 'admin' : 'editor';
        $ativo = !empty($_POST['ativo']);

        // ninguém tira o próprio acesso de administrador sem querer
        if ($alvo['id'] === $eu['id'] && ($papel !== 'admin' || !$ativo)) {
            avisar('erro', 'Você não pode rebaixar nem desativar a si mesmo. Peça a outro administrador.');
            voltar();
        }
        // e o painel nunca pode ficar sem nenhum administrador ativo
        if ($alvo['papel'] === 'admin' && ($papel !== 'admin' || !$ativo) && !tem_admin_ativo($alvo['id'])) {
            avisar('erro', 'Esse é o último administrador ativo. Promova outra pessoa antes.');
            voltar();
        }

        foreach ($usuarios as &$u) {
            if ($u['id'] === $alvo['id']) {
                $u['nome']  = mb_substr($nome !== '' ? $nome : $u['nome'], 0, 60);
                $u['papel'] = $papel;
                $u['areas'] = areas_do_post();
                $u['ativo'] = $ativo;
            }
        }
        unset($u);

        if (gravar_usuarios($usuarios)) {
            avisar('ok', 'Acesso de “' . $alvo['usuario'] . '” atualizado.');
        } else {
            avisar('erro', 'Não consegui gravar as mudanças.');
        }
        voltar();
    }

    if ($acao === 'resetar') {
        $provisoria = senha_provisoria();
        foreach ($usuarios as &$u) {
            if ($u['id'] === $alvo['id']) {
                $u['hash'] = password_hash($provisoria, PASSWORD_DEFAULT);
                $u['trocarSenha'] = true;
            }
        }
        unset($u);

        if (gravar_usuarios($usuarios)) {
            limpar_falhas($alvo['usuario']);
            $_SESSION['provisoria'] = ['usuario' => $alvo['usuario'], 'senha' => $provisoria];
            avisar('ok', 'Senha de “' . $alvo['usuario'] . '” resetada.');
        } else {
            avisar('erro', 'Não consegui gravar a senha nova.');
        }
        voltar();
    }

    if ($acao === 'remover') {
        if ($alvo['id'] === $eu['id']) {
            avisar('erro', 'Você não pode remover a si mesmo.');
            voltar();
        }
        if ($alvo['papel'] === 'admin' && !tem_admin_ativo($alvo['id'])) {
            avisar('erro', 'Esse é o último administrador. Promova outra pessoa antes de remover.');
            voltar();
        }
        $restantes = array_values(array_filter($usuarios, fn($u) => $u['id'] !== $alvo['id']));
        if (gravar_usuarios($restantes)) {
            limpar_falhas($alvo['usuario']);
            avisar('ok', 'Usuário “' . $alvo['usuario'] . '” removido.');
        } else {
            avisar('erro', 'Não consegui gravar a remoção.');
        }
        voltar();
    }

    voltar();
}

/* ---- recados guardados pelo POST anterior ---- */
$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$provisoria = $_SESSION['provisoria'] ?? null;
unset($_SESSION['provisoria']);

$usuarios = ler_usuarios();
usort($usuarios, fn($a, $b) => [$b['papel'] === 'admin', $a['usuario']] <=> [$a['papel'] === 'admin', $b['usuario']]);

abrir_pagina('Usuários');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Usuários do painel',
      'Quem entra, o que cada um abre. Senha não se recupera — se alguém esquecer, use “Resetar senha”.',
      null,
      null,
      [
          'Marcar as áreas de cada pessoa — área é permissão de tela, não a função dela no movimento.',
          'Resetar a senha de quem perdeu o acesso: a provisória aparece uma vez, na hora.',
          'Desativar quem saiu, em vez de apagar — o histórico do que a pessoa fez continua fazendo sentido.',
      ]
  ); ?>

  <?php
  recado(
      ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null,
      ($recado['tipo'] ?? '') === 'ok' ? $recado['texto'] : null
  );
  ?>

  <?php if ($provisoria): ?>
    <div class="msg msg-ok">
      <strong>Senha provisória de “<?= h($provisoria['usuario']) ?>”</strong> — anote agora, ela não aparece de novo.
      Quem entrar com ela é obrigado a trocar na hora.
      <div class="provisoria"><?= h($provisoria['senha']) ?></div>
    </div>
  <?php endif; ?>

  <fieldset>
    <legend>Novo usuário</legend>
    <form method="post">
      <input type="hidden" name="acao" value="criar">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <div class="linha g3">
        <div class="campo">
          <label for="n-nome">Nome</label>
          <input id="n-nome" type="text" name="nome" maxlength="60" required>
        </div>
        <div class="campo">
          <label for="n-login">Login</label>
          <input id="n-login" type="text" name="usuario" maxlength="24" required autocomplete="off">
        </div>
        <div class="campo">
          <label for="n-papel">Papel</label>
          <select id="n-papel" name="papel">
            <?php foreach (PAPEIS as $v => $rotulo): ?>
              <option value="<?= h($v) ?>" <?= $v === 'editor' ? 'selected' : '' ?>><?= h($rotulo) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
      <div class="campo">
        <label>Áreas liberadas</label>
        <div class="canais">
          <?php foreach (AREAS as $chave => $rotulo): ?>
            <label class="check">
              <input type="checkbox" name="areas[]" value="<?= h($chave) ?>">
              <?= h($rotulo) ?>
            </label>
          <?php endforeach; ?>
        </div>
        <p class="dica">Administrador abre tudo, marcado ou não. Para editor, vale só o que estiver marcado.</p>
      </div>
      <button class="btn btn-ouro" type="submit">Criar e gerar senha provisória</button>
    </form>
  </fieldset>

  <fieldset>
    <legend>Quem já tem acesso (<?= count($usuarios) ?>)</legend>

    <?php foreach ($usuarios as $lin): $souEu = $lin['id'] === $eu['id']; ?>
      <div class="item">
        <div class="item-topo">
          <span class="item-num">
            <?= h($lin['usuario']) ?><?= $souEu ? ' · você' : '' ?>
          </span>
          <span>
            <?php if (!$lin['ativo']): ?><span class="selo selo-off">desativado</span><?php endif; ?>
            <?php if ($lin['trocarSenha']): ?><span class="selo selo-cinza">senha provisória</span><?php endif; ?>
            <span class="selo selo-cinza">
              <?= $lin['ultimoAcesso'] !== ''
                  ? 'entrou ' . h(date('d/m/Y H:i', (int) strtotime($lin['ultimoAcesso'])))
                  : 'nunca entrou' ?>
            </span>
          </span>
        </div>

        <form method="post">
          <input type="hidden" name="acao" value="salvar">
          <input type="hidden" name="id" value="<?= h($lin['id']) ?>">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">

          <div class="linha g2">
            <div class="campo">
              <label for="nome-<?= h($lin['id']) ?>">Nome</label>
              <input id="nome-<?= h($lin['id']) ?>" type="text" name="nome"
                     value="<?= h($lin['nome']) ?>" maxlength="60">
            </div>
            <div class="campo">
              <label for="papel-<?= h($lin['id']) ?>">Papel</label>
              <select id="papel-<?= h($lin['id']) ?>" name="papel">
                <?php foreach (PAPEIS as $v => $rotulo): ?>
                  <option value="<?= h($v) ?>" <?= $lin['papel'] === $v ? 'selected' : '' ?>><?= h($rotulo) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
          </div>

          <div class="campo">
            <label>Áreas liberadas</label>
            <div class="canais">
              <?php foreach (AREAS as $chave => $rotulo): ?>
                <label class="check">
                  <input type="checkbox" name="areas[]" value="<?= h($chave) ?>"
                    <?= in_array($chave, $lin['areas'], true) ? 'checked' : '' ?>>
                  <?= h($rotulo) ?>
                </label>
              <?php endforeach; ?>
              <label class="check">
                <input type="checkbox" name="ativo" value="1" <?= $lin['ativo'] ? 'checked' : '' ?>>
                Acesso ativo
              </label>
            </div>
          </div>

          <button class="btn btn-mini btn-ouro" type="submit">Salvar alterações</button>
        </form>

        <div class="acoes" style="margin-top:12px">
          <form method="post" onsubmit="return confirm('Gerar uma senha provisória nova para <?= h($lin['usuario']) ?>? A senha atual para de funcionar na hora.')">
            <input type="hidden" name="acao" value="resetar">
            <input type="hidden" name="id" value="<?= h($lin['id']) ?>">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <button class="btn btn-mini" type="submit">Resetar senha</button>
          </form>
          <?php if (!$souEu): ?>
            <form method="post" onsubmit="return confirm('Remover <?= h($lin['usuario']) ?> de vez? Isso não tem volta.')">
              <input type="hidden" name="acao" value="remover">
              <input type="hidden" name="id" value="<?= h($lin['id']) ?>">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <button class="btn btn-mini btn-risco" type="submit">Remover</button>
            </form>
          <?php endif; ?>
          <span class="dica" style="margin:0">
            criado em <?= $lin['criadoEm'] !== '' ? h(date('d/m/Y', (int) strtotime($lin['criadoEm']))) : '—' ?>
          </span>
        </div>
      </div>
    <?php endforeach; ?>
  </fieldset>
</div>
<?php
fechar_pagina();
