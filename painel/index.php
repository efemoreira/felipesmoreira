<?php
declare(strict_types=1);

/**
 * Porta de entrada do painel — felipesmoreira.com/painel
 *
 * Três telas em um arquivo, na ordem em que a vida acontece:
 *   1. não existe nenhum usuário  → criar o primeiro administrador;
 *   2. existe usuário, ninguém logado → login;
 *   3. logado → hub com as áreas que essa pessoa pode abrir.
 *
 * As áreas em si moram em agenda.php e estudio.php. Aqui só se decide quem entra.
 */

require_once __DIR__ . '/layout.php';  // puxa o sessao.php junto

$aviso = null;
$sucesso = null;
$acao = (string) ($_POST['acao'] ?? '');
$primeiroAcesso = ler_usuarios() === [];

/** Só aceita voltar para dentro do painel — nada de redirecionar para fora. */
function destino_pos_login(): string
{
    $volta = (string) ($_GET['volta'] ?? '');
    return preg_match('#^/painel/[a-z0-9._/-]*$#i', $volta) ? $volta : '/painel/';
}

if ($acao === 'criar_admin' && $primeiroAcesso) {
    $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
    $nome  = trim((string) ($_POST['nome'] ?? ''));
    $s1    = (string) ($_POST['senha'] ?? '');
    $s2    = (string) ($_POST['senha2'] ?? '');

    if ($erro = validar_nome_usuario($login)) {
        $aviso = $erro;
    } elseif ($nome === '') {
        $aviso = 'Diga o nome de quem vai usar esse login.';
    } elseif ($erro = validar_senha($s1)) {
        $aviso = $erro;
    } elseif ($s1 !== $s2) {
        $aviso = 'As duas senhas não são iguais.';
    } else {
        $ok = gravar_usuarios([[
            'id'          => novo_id_usuario(),
            'usuario'     => $login,
            'nome'        => mb_substr($nome, 0, 60),
            'hash'        => password_hash($s1, PASSWORD_DEFAULT),
            'papel'       => 'admin',
            'areas'       => array_keys(AREAS),
            'ativo'       => true,
            'trocarSenha' => false,
            'criadoEm'    => date('c'),
        ]]);
        if ($ok) {
            $primeiroAcesso = false;
            $sucesso = 'Administrador criado. Entre com o login “' . $login . '”.';
        } else {
            $aviso = 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.';
        }
    }
} elseif ($acao === 'entrar' && !$primeiroAcesso) {
    $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
    $senha = (string) ($_POST['senha'] ?? '');

    if ($login === '') {
        $aviso = 'Informe o login.';
    } elseif ($ate = bloqueado_ate($login)) {
        $aviso = 'Muitas tentativas com esse login. Tente de novo às ' . date('H:i', $ate) . '.';
    } else {
        $u = achar_usuario($login);
        // password_verify sempre roda, mesmo sem usuário: o tempo de resposta não
        // pode denunciar quais logins existem
        $hash = $u['hash'] ?? '$2y$10$invalidoinvalidoinvalidoinvalidoinvalidoinvalidoinvalidoinva';
        if (password_verify($senha, $hash) && $u !== null && $u['ativo']) {
            entrar_como($u);
            limpar_falhas($login);
            header('Location: ' . destino_pos_login(), true, 302);
            exit;
        }
        registrar_falha($login);
        $aviso = ($u !== null && !$u['ativo'])
            ? 'Esse acesso está desativado. Fale com o administrador.'
            : 'Login ou senha incorretos.';
    }
} elseif ($acao === 'sair') {
    derrubar_sessao();
    header('Location: /painel/', true, 302);
    exit;
}

$u = usuario_atual();

if ($u !== null && $u['trocarSenha']) {
    header('Location: /painel/conta.php', true, 302);
    exit;
}

if ($u === null) {
    /* ---------- primeiro acesso e login ---------- */
    abrir_pagina($primeiroAcesso ? 'Criar administrador' : 'Entrar', false);
    ?>
    <div class="caixa">
    <?php if ($primeiroAcesso): ?>
      <h1>Criar administrador</h1>
      <p class="sub">
        Primeiro acesso: ainda não existe nenhum usuário. Quem for criado aqui
        entra como administrador e pode cadastrar o resto da equipe depois.
        As senhas ficam só na hospedagem, nunca no GitHub.
      </p>
      <?php recado($aviso, $sucesso); ?>
      <form method="post">
        <input type="hidden" name="acao" value="criar_admin">
        <div class="campo">
          <label for="nome">Nome</label>
          <input id="nome" type="text" name="nome" maxlength="60" required autofocus
                 value="<?= h($_POST['nome'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="usuario">Login</label>
          <input id="usuario" type="text" name="usuario" maxlength="24" required
                 autocomplete="username" value="<?= h($_POST['usuario'] ?? '') ?>">
          <p class="dica">Letras minúsculas, números, ponto, hífen ou _.</p>
        </div>
        <div class="campo">
          <label for="s1">Senha (mínimo <?= SENHA_MIN ?> caracteres)</label>
          <input id="s1" type="password" name="senha" autocomplete="new-password" required>
        </div>
        <div class="campo">
          <label for="s2">Repita a senha</label>
          <input id="s2" type="password" name="senha2" autocomplete="new-password" required>
        </div>
        <button class="btn btn-ouro" type="submit">Criar administrador</button>
      </form>
    <?php else: ?>
      <div class="caixa-selo" aria-hidden="true">✦</div>
      <h1>Missão Ceará</h1>
      <p class="sub">
        A área de trabalho da militância. Entre com o usuário e a senha que a
        coordenação mandou no seu WhatsApp.
      </p>
      <?php recado($aviso, $sucesso); ?>
      <form method="post">
        <input type="hidden" name="acao" value="entrar">
        <div class="campo">
          <label for="usuario">Seu usuário</label>
          <input id="usuario" type="text" name="usuario" maxlength="24" required autofocus
                 autocomplete="username" value="<?= h($_POST['usuario'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="senha">Sua senha</label>
          <input id="senha" type="password" name="senha" autocomplete="current-password" required>
        </div>
        <button class="btn btn-ouro" type="submit">Entrar</button>
      </form>
      <p class="dica" style="margin-top:20px">
        Esqueceu a senha ou ainda não tem acesso? Fale com a coordenação no
        <a href="https://wa.me/5585981872972" target="_blank" rel="noopener">WhatsApp</a>.
      </p>
    <?php endif; ?>
    </div>
    <?php
    fechar_pagina();
    exit;
}

/* ---------- hub ---------- */
$areas = areas_do_usuario();

/* Quantas inscrições esperam decisão — vira o contador no cartão da área.
   Sem isso o Felipe só descobre que tem gente na fila entrando na tela. */
$inscricoes_esperando = 0;
if (in_array('inscricoes', $areas, true)) {
    require_once __DIR__ . '/inscricoes-comum.php';
    foreach (ler_inscricoes() as $i) {
        if ($i['status'] === 'nova') {
            $inscricoes_esperando++;
        }
    }
}

/* Mesma ideia para os fatos parados na Checagem: fila invisível é fila que dorme. */
$fatos_esperando = 0;
if (in_array('fatos', $areas, true)) {
    require_once __DIR__ . '/fatos-comum.php';
    $fatos_esperando = fatos_esperando();
}

/* Quantos cards estão com esta pessoa no quadro de Produção. */
$meus_cards = 0;
if (in_array('producao', $areas, true)) {
    require_once __DIR__ . '/producao-comum.php';
    $meus_cards = count(cards_de($u['id']));
}

/**
 * Acesso rápido: o atalho da função que a pessoa escolheu no /quero-ajudar.
 *
 * A função NÃO limita o acesso — quem abre a área abre a ferramenta inteira.
 * Isto aqui só evita que o Olheiro precise procurar onde fica a tela dele todo
 * dia, e some se a pessoa não tem função registrada ou não tem a permissão.
 */
const FERRAMENTA_DA_FUNCAO = [
    'olheiro'    => 'fatos',
    'checagem'   => 'fatos',
    'roteirista' => 'producao',
    'design'     => 'producao',
    'editor'     => 'producao',
    'acervo'     => 'producao',
    'local-hora' => 'eventos',
    'logistica'  => 'eventos',
    'divulgacao' => 'eventos',
    'gravacao'   => 'eventos',
    'recepcao'   => 'eventos',
];

$atalhos = [];
foreach ($u['funcoes'] as $funcao) {
    $area = FERRAMENTA_DA_FUNCAO[$funcao] ?? null;
    if ($area !== null && in_array($area, $areas, true) && !isset($atalhos[$area])) {
        $atalhos[$area] = $funcao;
    }
}
if ($atalhos !== []) {
    // nome_funcao() mora no inscricoes-comum.php, que é quem lê o funcoes.json
    require_once __DIR__ . '/inscricoes-comum.php';
}
$negado = (string) ($_GET['negado'] ?? '');
if ($negado !== '') {
    $aviso = $negado === 'usuarios'
        ? 'Só um administrador abre a lista de usuários.'
        : 'Você não tem acesso a “' . (AREAS[$negado] ?? $negado) . '”. Peça a um administrador.';
}

abrir_pagina('Início');
?>
<div class="capa">
  <h1>Olá, <?= h(explode(' ', $u['nome'])[0]) ?></h1>
  <p class="sub">O que você vai fazer agora?</p>

  <?php recado($aviso, $sucesso); ?>

  <?php if ($areas === []): ?>
    <p class="msg msg-erro">
      Seu acesso está ativo, mas nenhuma área foi liberada ainda. Peça a um administrador.
    </p>
  <?php else: ?>
    <?php if ($atalhos !== []): ?>
      <div class="atalhos">
        <p class="atalhos-rotulo">Seu lugar no time</p>
        <?php foreach ($atalhos as $area => $funcao): ?>
          <a class="atalho" href="<?= h(DESTINO_AREA[$area]['url']) ?>">
            <span class="atalho-icone"><?= icone(ICONE_AREA[$area] ?? 'star') ?></span>
            <span class="atalho-texto">
              <strong><?= h(nome_funcao($funcao)) ?></strong>
              <span><?= h(AREAS[$area]) ?></span>
            </span>
            <span class="atalho-seta" aria-hidden="true"><?= icone('chevronRight', 20) ?></span>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <div class="areas-hub">
      <?php foreach ($areas as $area): ?>
        <?php
        /* O contador só existe onde há fila de verdade. Área sem fila mostra o
           resumo do que ela faz, e não um zero que não quer dizer nada. */
        $pend = 0;
        $recado_fila = null;
        if ($area === 'inscricoes' && $inscricoes_esperando > 0) {
            $pend = $inscricoes_esperando;
            $recado_fila = $pend === 1 ? '1 pessoa esperando decisão' : $pend . ' pessoas esperando decisão';
        } elseif ($area === 'fatos' && $fatos_esperando > 0) {
            $pend = $fatos_esperando;
            $recado_fila = $pend === 1 ? '1 fato esperando checagem' : $pend . ' fatos esperando checagem';
        } elseif ($area === 'producao' && $meus_cards > 0) {
            $pend = $meus_cards;
            $recado_fila = $pend === 1 ? '1 card com você' : $pend . ' cards com você';
        }
        ?>
        <a class="area-cartao<?= $pend > 0 ? ' tem-aviso' : '' ?>" href="<?= h(DESTINO_AREA[$area]['url']) ?>">
          <?php if ($pend > 0): ?>
            <span class="area-aviso" aria-hidden="true"><?= $pend ?></span>
          <?php endif; ?>
          <span class="area-icone"><?= icone(ICONE_AREA[$area] ?? 'star') ?></span>
          <span class="area-texto">
            <strong><?= h(AREAS[$area]) ?></strong>
            <span><?= h($recado_fila ?? DESTINO_AREA[$area]['resumo']) ?></span>
          </span>
        </a>
      <?php endforeach; ?>

      <?php if (e_admin()): ?>
        <a class="area-cartao" href="/painel/usuarios.php">
          <span class="area-icone"><?= icone('users') ?></span>
          <span class="area-texto">
            <strong>Usuários</strong>
            <span>Quem entra no painel e o que cada um pode abrir</span>
          </span>
        </a>
      <?php endif; ?>
    </div>
  <?php endif; ?>

  <div class="acoes">
    <a class="btn btn-mini" href="/programacao" target="_blank" rel="noopener">Ver a página pública</a>
    <a class="btn btn-mini" href="/painel/conta.php">Trocar minha senha</a>
  </div>
</div>
<?php
fechar_pagina();
