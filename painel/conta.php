<?php
declare(strict_types=1);

/**
 * Minha senha — felipesmoreira.com/painel/conta.php
 *
 * Cada um troca a própria senha aqui. Quem entrou com senha provisória cai
 * nesta página e não sai dela até trocar: é o exigir_login() que desvia.
 *
 * Esquecer a senha não tem conserto por aqui — só um administrador reseta,
 * em usuarios.php, porque o que fica guardado é o hash e hash não volta atrás.
 */

require_once __DIR__ . '/layout.php';
exigir_login();

$eu = usuario_atual();
$obrigatoria = $eu['trocarSenha'];
$aviso = null;
$sucesso = null;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && (string) ($_POST['acao'] ?? '') === 'trocar') {
    if (!token_valido()) {
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }
    $atual = (string) ($_POST['atual'] ?? '');
    $nova  = (string) ($_POST['nova'] ?? '');
    $nova2 = (string) ($_POST['nova2'] ?? '');

    if (!password_verify($atual, $eu['hash'])) {
        $aviso = 'A senha atual não confere.';
    } elseif ($erro = validar_senha($nova)) {
        $aviso = $erro;
    } elseif ($nova !== $nova2) {
        $aviso = 'As duas senhas novas não são iguais.';
    } elseif ($nova === $atual) {
        $aviso = 'A senha nova precisa ser diferente da atual.';
    } else {
        $usuarios = ler_usuarios();
        foreach ($usuarios as &$u) {
            if ($u['id'] === $eu['id']) {
                $u['hash'] = password_hash($nova, PASSWORD_DEFAULT);
                $u['trocarSenha'] = false;
            }
        }
        unset($u);

        if (gravar_usuarios($usuarios)) {
            // sessão nova depois de trocar a senha: o cookie antigo não serve mais
            session_regenerate_id(true);
            $eu = achar_usuario_por_id($eu['id']) ?? $eu;
            $obrigatoria = false;
            $sucesso = 'Senha trocada. É essa que vale a partir de agora.';
        } else {
            $aviso = 'Não consegui gravar a senha nova. Tente de novo.';
        }
    }
}

abrir_pagina('Minha senha', !$obrigatoria);
?>
<div class="<?= $obrigatoria ? 'caixa' : 'capa' ?>">
  <h1><?= $obrigatoria ? 'Troque sua senha' : 'Minha senha' ?></h1>
  <p class="sub">
    <?php if ($obrigatoria): ?>
      Você entrou com uma senha provisória. Escolha uma sua para continuar.
    <?php else: ?>
      <?= h($eu['nome']) ?> · login <strong><?= h($eu['usuario']) ?></strong>
    <?php endif; ?>
  </p>

  <?php recado($aviso, $sucesso); ?>

  <form method="post" style="max-width:420px">
    <input type="hidden" name="acao" value="trocar">
    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
    <input type="hidden" name="username" value="<?= h($eu['usuario']) ?>" autocomplete="username">

    <div class="campo">
      <label for="atual"><?= $obrigatoria ? 'Senha provisória' : 'Senha atual' ?></label>
      <input id="atual" type="password" name="atual" autocomplete="current-password" required autofocus>
    </div>
    <div class="campo">
      <label for="nova">Senha nova (mínimo <?= SENHA_MIN ?> caracteres)</label>
      <input id="nova" type="password" name="nova" autocomplete="new-password" required>
    </div>
    <div class="campo">
      <label for="nova2">Repita a senha nova</label>
      <input id="nova2" type="password" name="nova2" autocomplete="new-password" required>
    </div>

    <div class="acoes">
      <button class="btn btn-ouro" type="submit">Trocar senha</button>
      <?php if (!$obrigatoria): ?>
        <a class="btn btn-mini" href="/painel/">Voltar ao início</a>
      <?php endif; ?>
    </div>
  </form>

  <?php if ($sucesso && !$obrigatoria): ?>
    <p style="margin-top:20px"><a class="btn" href="/painel/">Ir para o painel</a></p>
  <?php endif; ?>
</div>
<?php
fechar_pagina();
