<?php
declare(strict_types=1);

/**
 * Inscrições da militância — felipesmoreira.com/painel/inscricoes.php
 *
 * A fila de quem se inscreveu em /quero-ajudar. Aqui a coordenação lê a
 * inscrição, confere e decide: aprovar (vira acesso) ou recusar.
 *
 * Aprovar cria o usuário com senha provisória e trocarSenha ligado — quem
 * entra é obrigado a definir a própria senha antes de abrir qualquer área.
 * A senha aparece uma vez só, junto de um botão que abre o WhatsApp da pessoa
 * com a mensagem pronta.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/inscricoes-comum.php';
exigir_area('inscricoes');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(): void
{
    header('Location: /painel/inscricoes.php', true, 302);
    exit;
}

/**
 * Login a partir do nome: "Maria de Sousa Lima" -> "maria.lima".
 * Acrescenta número se já existir, e completa se ficar curto demais para a
 * regra de validar_nome_usuario() (mínimo 3 caracteres).
 */
function login_sugerido(string $nome): string
{
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT', $nome);
    $ascii = is_string($ascii) ? $ascii : $nome;
    $ascii = strtolower(preg_replace('/[^a-zA-Z ]/', '', $ascii) ?? '');

    $partes = array_values(array_filter(explode(' ', $ascii)));
    // ignora as partículas do meio (de, da, dos…) na hora de montar o login
    $uteis = array_values(array_filter($partes, fn ($p) => !in_array($p, ['de', 'da', 'do', 'das', 'dos', 'e'], true)));
    if ($uteis === []) {
        $uteis = $partes;
    }

    $base = $uteis[0] ?? 'militante';
    if (count($uteis) > 1) {
        $base .= '.' . end($uteis);
    }
    $base = substr($base, 0, 20);
    while (strlen($base) < 3) {
        $base .= 'x';
    }

    $tentativa = $base;
    $n = 2;
    while (achar_usuario($tentativa) !== null) {
        $tentativa = substr($base, 0, 20) . $n;
        $n++;
    }
    return $tentativa;
}

/** Número no formato que o wa.me espera: 55 + DDD + número. */
function numero_whatsapp(string $telefone): string
{
    $d = so_digitos($telefone);
    return str_starts_with($d, '55') ? $d : '55' . $d;
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
    $alvo = achar_inscricao((string) ($_POST['id'] ?? ''));

    if ($alvo === null) {
        avisar('erro', 'Inscrição não encontrada — talvez alguém já tenha decidido.');
        voltar();
    }
    if ($alvo['status'] !== 'nova') {
        avisar('erro', 'Essa inscrição já foi decidida.');
        voltar();
    }

    $inscricoes = ler_inscricoes();

    if ($acao === 'aprovar') {
        $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
        $papel = (($_POST['papel'] ?? 'editor') === 'admin') ? 'admin' : 'editor';
        $areas = array_values(array_intersect(
            array_keys(AREAS),
            is_array($_POST['areas'] ?? null) ? $_POST['areas'] : []
        ));

        if ($erro = validar_nome_usuario($login)) {
            avisar('erro', $erro);
            voltar();
        }
        if (achar_usuario($login) !== null) {
            avisar('erro', 'Já existe alguém com o login “' . $login . '”. Escolha outro.');
            voltar();
        }

        $provisoria = senha_provisoria();
        $usuarios = ler_usuarios();
        $novoId = novo_id_usuario();
        $usuarios[] = [
            'id'          => $novoId,
            'usuario'     => $login,
            'nome'        => $alvo['nome'],
            'hash'        => password_hash($provisoria, PASSWORD_DEFAULT),
            'papel'       => $papel,
            'areas'       => $areas,
            'ativo'       => true,
            'trocarSenha' => true,
            'criadoEm'    => date('c'),
            // o que veio da inscrição segue junto do acesso
            'telefone'    => $alvo['telefone'],
            'email'       => $alvo['email'],
            'cidade'      => $alvo['cidade'],
            'bairro'      => $alvo['bairro'],
            'funcoes'     => $alvo['funcoes'],
            'origem'      => 'inscricao',
            'consentimentoEm'     => $alvo['consentimentoEm'],
            'consentimentoVersao' => $alvo['consentimentoVersao'],
        ];

        if (!gravar_usuarios($usuarios)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões no hPanel.');
            voltar();
        }

        foreach ($inscricoes as &$i) {
            if ($i['id'] === $alvo['id']) {
                $i['status'] = 'aprovada';
                $i['decididoEm'] = date('c');
                $i['decididoPor'] = $eu['nome'];
                $i['usuarioId'] = $novoId;
            }
        }
        unset($i);
        gravar_inscricoes($inscricoes);

        // some da sessão assim que for mostrada uma vez
        $_SESSION['acesso_novo'] = [
            'nome'     => $alvo['nome'],
            'usuario'  => $login,
            'senha'    => $provisoria,
            'telefone' => $alvo['telefone'],
        ];
        avisar('ok', 'Acesso criado para ' . $alvo['nome'] . '.');
        voltar();
    }

    if ($acao === 'recusar') {
        foreach ($inscricoes as &$i) {
            if ($i['id'] === $alvo['id']) {
                $i['status'] = 'recusada';
                $i['decididoEm'] = date('c');
                $i['decididoPor'] = $eu['nome'];
            }
        }
        unset($i);
        if (gravar_inscricoes($inscricoes)) {
            avisar('ok', 'Inscrição de ' . $alvo['nome'] . ' recusada.');
        } else {
            avisar('erro', 'Não consegui gravar a decisão.');
        }
        voltar();
    }

    voltar();
}

/* ===================== tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$acesso = $_SESSION['acesso_novo'] ?? null;
unset($_SESSION['acesso_novo']);

$todas = ler_inscricoes();
$novas = array_values(array_filter($todas, fn ($i) => $i['status'] === 'nova'));
$decididas = array_values(array_filter($todas, fn ($i) => $i['status'] !== 'nova'));

// mais recentes primeiro
usort($novas, fn ($a, $b) => strcmp($b['criadoEm'], $a['criadoEm']));
usort($decididas, fn ($a, $b) => strcmp($b['decididoEm'], $a['decididoEm']));

$formatar = function (string $iso): string {
    if ($iso === '') {
        return '';
    }
    $t = strtotime($iso);
    return $t ? date('d/m/Y \à\s H:i', $t) : '';
};

abrir_pagina('Inscrições');
?>
<div class="capa">
  <h1>Inscrições da militância</h1>
  <p class="sub">
    Quem preencheu o formulário em <a href="/quero-ajudar" target="_blank">/quero-ajudar</a>.
    Aprovar cria o acesso e mostra a senha para você mandar no WhatsApp.
  </p>

  <?php recado($erro, $ok); ?>

  <?php if ($acesso !== null): ?>
    <?php
      $msg = "Olá, {$acesso['nome']}! Aqui é da Missão Ceará.\n\n"
           . "Sua inscrição foi aprovada! Seu acesso:\n\n"
           . "Site: https://felipesmoreira.com/painel/\n"
           . "Usuário: {$acesso['usuario']}\n"
           . "Senha provisória: {$acesso['senha']}\n\n"
           . "No primeiro acesso o site vai pedir para você criar sua própria senha.\n\n"
           . "Qualquer dúvida, é só chamar aqui. Bem-vindo(a)!";
    ?>
    <div class="msg msg-ok">
      <p style="margin:0 0 10px"><strong>Acesso criado.</strong> Mande agora — a senha não aparece de novo.</p>
      <div class="provisoria">
        usuário: <?= h($acesso['usuario']) ?><br>
        senha: <?= h($acesso['senha']) ?>
      </div>
      <div class="acoes" style="margin-top:14px">
        <a class="btn btn-ouro"
           href="https://wa.me/<?= h(numero_whatsapp($acesso['telefone'])) ?>?text=<?= h(rawurlencode($msg)) ?>"
           target="_blank" rel="noopener">
          Abrir WhatsApp com a mensagem pronta
        </a>
      </div>
    </div>
  <?php endif; ?>

  <fieldset>
    <legend>Esperando decisão (<?= count($novas) ?>)</legend>

    <?php if ($novas === []): ?>
      <p class="dica" style="margin:0">Nenhuma inscrição nova por enquanto.</p>
    <?php endif; ?>

    <?php foreach ($novas as $i): ?>
      <?php $sugeridas = areas_sugeridas($i['funcoes']); ?>
      <article class="ficha">
        <header class="ficha-topo">
          <span class="ficha-inicial" aria-hidden="true"><?= h(iniciais($i['nome'])) ?></span>
          <span class="ficha-quem">
            <strong><?= h($i['nome']) ?></strong>
            <span><?= h($i['bairro']) ?>, <?= h($i['cidade']) ?> · chegou <?= h($formatar($i['criadoEm'])) ?></span>
          </span>
        </header>

        <dl class="ficha-dados">
          <div>
            <dt>WhatsApp</dt>
            <dd>
              <a href="https://wa.me/<?= h(numero_whatsapp($i['telefone'])) ?>" target="_blank" rel="noopener">
                <?= h(telefone_bonito($i['telefone'])) ?>
              </a>
            </dd>
          </div>
          <?php if ($i['email'] !== ''): ?>
            <div>
              <dt>E-mail</dt>
              <dd><?= h($i['email']) ?></dd>
            </div>
          <?php endif; ?>
          <div class="ficha-funcoes">
            <dt>Quer ajudar em</dt>
            <dd>
              <?php foreach ($i['funcoes'] as $f): ?>
                <span class="selo"><?= h(nome_funcao($f)) ?></span>
              <?php endforeach; ?>
            </dd>
          </div>
        </dl>

        <!-- a decisão fica recolhida: com fila grande, a lista continua legível -->
        <details class="decidir">
          <summary class="btn btn-ouro">Decidir sobre esta inscrição</summary>
          <div class="decidir-corpo">
            <form method="post">
              <input type="hidden" name="acao" value="aprovar">
              <input type="hidden" name="id" value="<?= h($i['id']) ?>">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">

              <div class="linha g2">
                <div class="campo">
                  <label for="u-<?= h($i['id']) ?>">Login de acesso</label>
                  <input id="u-<?= h($i['id']) ?>" type="text" name="usuario"
                         value="<?= h(login_sugerido($i['nome'])) ?>" maxlength="24" required>
                  <p class="dica">Sugerido a partir do nome. Pode trocar.</p>
                </div>
                <div class="campo">
                  <label for="p-<?= h($i['id']) ?>">Papel</label>
                  <select id="p-<?= h($i['id']) ?>" name="papel">
                    <?php foreach (PAPEIS as $chave => $rotulo): ?>
                      <option value="<?= h($chave) ?>"<?= $chave === 'editor' ? ' selected' : '' ?>><?= h($rotulo) ?></option>
                    <?php endforeach; ?>
                  </select>
                  <p class="dica">Administrador mexe em usuários. Na dúvida, deixe Editor.</p>
                </div>
              </div>

              <div class="campo">
                <label>Áreas liberadas</label>
                <div class="canais">
                  <?php foreach (AREAS as $chave => $rotulo): ?>
                    <label class="check">
                      <input type="checkbox" name="areas[]" value="<?= h($chave) ?>"
                        <?= in_array($chave, $sugeridas, true) ? ' checked' : '' ?>>
                      <?= h($rotulo) ?>
                    </label>
                  <?php endforeach; ?>
                </div>
                <p class="dica">Já vem marcado conforme as funções que a pessoa escolheu. Dá para mudar depois em Usuários.</p>
              </div>

              <div class="acoes">
                <button class="btn btn-ouro" type="submit">Aprovar e criar acesso</button>
              </div>
            </form>

            <form method="post" class="decidir-recusa"
                  onsubmit="return confirm('Recusar a inscrição de <?= h($i['nome']) ?>? Ela fica registrada, mas não vira acesso.')">
              <input type="hidden" name="acao" value="recusar">
              <input type="hidden" name="id" value="<?= h($i['id']) ?>">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <button class="btn btn-mini btn-risco" type="submit">Recusar inscrição</button>
            </form>
          </div>
        </details>
      </article>
    <?php endforeach; ?>
  </fieldset>

  <?php if ($decididas !== []): ?>
    <fieldset>
      <legend>Já decididas (<?= count($decididas) ?>)</legend>
      <div class="rolagem">
        <table class="tabela">
          <thead>
            <tr><th>Nome</th><th>Cidade</th><th>Situação</th><th>Quem decidiu</th><th>Quando</th></tr>
          </thead>
          <tbody>
            <?php foreach ($decididas as $i): ?>
              <tr>
                <td><?= h($i['nome']) ?></td>
                <td><?= h($i['cidade']) ?></td>
                <td>
                  <?php if ($i['status'] === 'aprovada'): ?>
                    <span class="selo">aprovada</span>
                  <?php else: ?>
                    <span class="selo selo-off">recusada</span>
                  <?php endif; ?>
                </td>
                <td><?= h($i['decididoPor']) ?></td>
                <td><?= h($formatar($i['decididoEm'])) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </fieldset>
  <?php endif; ?>

  <div class="acoes">
    <a class="btn btn-mini" href="/painel/">Voltar ao início</a>
  </div>
</div>
<?php
fechar_pagina();
