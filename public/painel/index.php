<?php
declare(strict_types=1);

/**
 * Porta de entrada do painel — felipesmoreira.com/painel
 *
 * Três telas em um arquivo, na ordem em que a vida acontece:
 *   1. não existe nenhum usuário  → criar o primeiro administrador;
 *   2. existe usuário, ninguém logado → login;
 *   3. logado → hub com o trabalho desta pessoa.
 *
 * O hub NÃO lista as áreas: para onde ir é a lateral do layout.php, e repetir
 * a lista aqui embaixo era ler o mesmo menu duas vezes. Aqui só entra o que é
 * trabalho — a mesa da função, a fila, os encontros e a formação.
 */

require_once __DIR__ . '/layout.php';  // puxa o sessao.php junto

$aviso = null;
$sucesso = null;
$acao = (string) ($_POST['acao'] ?? '');
/* Primeiro acesso é NINGUÉM TER CONTA, e não a lista de pessoas estar vazia:
   depois da unificação a lista tem quem confirmou presença num encontro, e
   essa gente não abre o painel. */
$primeiroAcesso = contas() === [];

/* A pessoa diz que já entrou no grupo de trabalho. Não dá para conferir do
   nosso lado — o WhatsApp não conta isso —, e não é para conferir: a marca
   serve para o painel parar de cobrar, e quem mentir só engana a si mesmo. */
if ($acao === 'entrei-no-grupo' && token_valido()) {
    $eu = usuario_atual();
    if ($eu !== null) {
        $usuarios = ler_pessoas();
        foreach ($usuarios as &$linha) {
            if ($linha['id'] === $eu['id']) {
                $linha['entrouNoGrupo'] = true;
            }
        }
        unset($linha);
        gravar_pessoas($usuarios);
    }
    header('Location: /painel/', true, 302);
    exit;
}

/** Só aceita voltar para dentro do painel — nada de redirecionar para fora. */
function destino_pos_login(): string
{
    return caminho_interno_seguro($_GET['volta'] ?? '');
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
        $ok = gravar_pessoas([[
            'id'          => novo_id_pessoa(),
            'usuario'     => $login,
            'nome'        => mb_substr($nome, 0, 60),
            'hash'        => password_hash($s1, PASSWORD_DEFAULT),
            'capacidades' => ['adm'],
            'tipo'        => 'coordenador',
            'status'      => 'aprovada',
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
        $u = pessoa_por_usuario($login);
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
        <a href="<?= h(WHATSAPP_COORDENACAO) ?>" target="_blank" rel="noopener">WhatsApp</a>.
      </p>
    <?php endif; ?>
    </div>
    <?php
    fechar_pagina();
    exit;
}

/* ---------- hub ---------- */

/**
 * O hub responde, de cima para baixo, as quatro perguntas de quem abre o
 * painel: onde eu trabalho, o que está esperando por mim, o que vem aí e
 * quanto eu já aprendi. A grade de áreas fica por último de propósito — ela é
 * o índice do painel, não a pauta do dia.
 *
 * Nenhum número aqui é calculado neste arquivo: tudo vem do agora.php, que é a
 * fonte única do que está pendente. Área nova declara a fila lá, não aqui.
 */

$areas = areas_do_usuario();
$mesas = mesas_de($u);
$tarefas = tarefas_de($u);
$formacao = formacao_de($u);

$negado = (string) ($_GET['negado'] ?? '');
if ($negado !== '') {
    $aviso = $negado === 'usuarios'
        ? 'Só um administrador abre a lista de usuários.'
        : 'Você não tem acesso a “' . (AREAS[$negado] ?? $negado) . '”. Peça a um administrador.';
}

/* Os encontros que vêm aí, e a peça das cinco que cabe a esta pessoa. */
$proximos = [];
$minhaPeca = null;
if (in_array('eventos', $areas, true)) {
    require_once __DIR__ . '/eventos-comum.php';
    $proximos = array_slice(eventos_proximos(), 0, 2);
    $minhaPeca = peca_da_pessoa($u);
}

$naFila = count($tarefas);
$mostradas = array_slice($tarefas, 0, TETO_FILA);
$sobrando = $naFila - count($mostradas);

abrir_pagina('Início');
?>
<div class="capa">
  <?php
    if ($areas === []) {
        $resumo = 'Seu acesso está ativo, mas nenhuma área foi liberada ainda.';
    } elseif ($naFila === 0) {
        $resumo = 'Nada esperando por você agora.';
    } elseif ($naFila === 1) {
        $resumo = 'Uma coisa está esperando por você.';
    } else {
        $resumo = $naFila . ' coisas estão esperando por você.';
    }
    cabecalho_pagina(
        'Olá, ' . h(explode(' ', $u['nome'])[0]),
        $resumo,
        null,
        null,
        [
            'Esta tela é só o que está esperando por você hoje — para onde ir fica no menu, ao lado.',
            'A mesa do topo é a da sua função no movimento; “Ver tudo” abre a ferramenta inteira.',
            'Área é permissão de tela; função é o seu papel na militância. Uma não limita a outra.',
            'Fila vazia é o objetivo, não erro: a meta é que nada durma sem status.',
        ]
    );
  ?>

  <?php recado($aviso, $sucesso); ?>

  <div class="hub">
  <div class="hub-principal">

  <?php if ($areas === []): ?>
    <p class="msg msg-erro">
      Nenhuma área foi liberada para a sua conta ainda. Fale com a coordenação no
      <a href="<?= h(WHATSAPP_COORDENACAO) ?>" target="_blank" rel="noopener">WhatsApp</a>
      para liberarem o seu acesso.
    </p>
  <?php else: ?>

    <?php /* ============ 1. a mesa de trabalho da função ============ */ ?>
    <?php if ($mesas !== []): ?>
      <?php require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao() ?>
      <div class="mesas">
        <?php foreach ($mesas as $mesa): ?>
          <section class="mesa">
            <span class="mesa-icone"><?= icone(ICONE_AREA[$mesa['area']] ?? 'star') ?></span>
            <p class="mesa-funcao"><?= h(nome_funcao($mesa['funcao'])) ?></p>
            <h2 class="mesa-area"><?= h(AREAS[$mesa['area']]) ?></h2>
            <?php if ($mesa['estado'] !== ''): ?>
              <p class="mesa-estado"><?= h($mesa['estado']) ?></p>
            <?php endif; ?>
            <div class="acoes">
              <a class="btn btn-ouro" href="<?= h($mesa['url']) ?>"><?= h($mesa['acao']) ?></a>
              <?php if ($mesa['url'] !== DESTINO_AREA[$mesa['area']]['url']): ?>
                <?php /* a ação primária cai numa âncora; este abre a tela inteira */ ?>
                <a class="btn btn-mini" href="<?= h(DESTINO_AREA[$mesa['area']]['url']) ?>">Ver tudo</a>
              <?php endif; ?>
            </div>
          </section>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php /* ============ 2. a fila do dia ============ */ ?>
    <h2 class="secao">Esperando você</h2>
    <?php if ($mostradas === []): ?>
      <p class="vazio-bom">
        Tudo em dia. É esse o objetivo: nada dorme sem status.
        <?php if ($formacao !== null && $formacao['proxima'] !== null): ?>
          Sobrou tempo? A próxima aula é
          <a href="/aulas#<?= h($formacao['proxima']['aula']['id']) ?>">🚗 <?= h($formacao['proxima']['aula']['titulo']) ?></a>.
        <?php endif; ?>
      </p>
    <?php else: ?>
      <ul class="fila">
        <?php foreach ($mostradas as $t): ?>
          <li>
            <a class="fila-item<?= $t['urgente'] ? ' fila-urgente' : '' ?>" href="<?= h($t['url']) ?>">
              <span class="fila-icone"><?= icone($t['icone'], 20) ?></span>
              <span class="fila-texto">
                <strong><?= h($t['texto']) ?></strong>
                <?php if ($t['porque'] !== ''): ?>
                  <span><?= h($t['porque']) ?></span>
                <?php endif; ?>
              </span>
              <span class="fila-seta" aria-hidden="true"><?= icone('chevronRight', 20) ?></span>
            </a>
          </li>
        <?php endforeach; ?>
      </ul>
      <?php if ($sobrando > 0): ?>
        <p class="dica">E mais <?= $sobrando ?> <?= $sobrando === 1 ? 'coisa' : 'coisas' ?> nas áreas abaixo.</p>
      <?php endif; ?>
    <?php endif; ?>

    <?php /* ============ 3. os encontros marcados ============ */ ?>
    <?php if (in_array('eventos', $areas, true)): ?>
      <h2 class="secao">Próximos encontros</h2>
      <?php if ($proximos === []): ?>
        <p class="dica">
          Nenhum encontro marcado. O primeiro passo é Local &amp; Hora: três opções avaliadas
          antes de fechar qualquer coisa. <a href="/painel/eventos.php">Marcar um encontro</a>.
        </p>
      <?php else: ?>
        <div class="encontros">
          <?php foreach ($proximos as $e): ?>
            <?php
              $preparo = preparo_do_evento($e);
              $feitosMinha = $minhaPeca !== null ? count($e['feitos'][$minhaPeca] ?? []) : 0;
              $totalMinha = 0;
              if ($minhaPeca !== null) {
                  $c = checklist(PECAS[$minhaPeca]['checklist']);
                  $totalMinha = $c !== null ? count($c['itens']) : 0;
              }
            ?>
            <a class="encontro" href="/painel/eventos.php?e=<?= h(rawurlencode($e['id'])) ?>">
              <span class="encontro-data">
                <?php if ($e['data'] !== ''): ?>
                  <strong><?= h(data_curta($e['data'])) ?></strong>
                  <span><?= $e['hora'] !== '' ? h($e['hora']) : 'sem hora' ?></span>
                <?php else: ?>
                  <strong>SEM DATA</strong>
                <?php endif; ?>
              </span>
              <span class="encontro-texto">
                <strong><?= h($e['titulo']) ?></strong>
                <span>
                  <?= h(FAMILIAS[$e['familia']]['nome']) ?>
                  <?= $e['local'] !== '' ? ' · ' . h($e['local']) : '' ?>
                  · preparo <?= $preparo['feito'] ?>/<?= $preparo['total'] ?>
                </span>
                <?php if ($minhaPeca !== null && $totalMinha > 0): ?>
                  <span class="encontro-peca">
                    Sua peça: <?= h(PECAS[$minhaPeca]['nome']) ?> · <?= $feitosMinha ?> de <?= $totalMinha ?> conferidos
                  </span>
                <?php endif; ?>
              </span>
            </a>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    <?php endif; ?>

    <?php /* ============ 4. a formação ============ */ ?>
    <?php if ($formacao !== null): ?>
      <h2 class="secao">Sua formação</h2>
      <section class="formacao">
        <div class="barra-progresso"
             role="progressbar"
             aria-valuenow="<?= $formacao['feitas'] ?>"
             aria-valuemin="0"
             aria-valuemax="<?= $formacao['total'] ?>"
             aria-label="Aulas concluídas">
          <span style="width:<?= $formacao['total'] > 0 ? (int) round($formacao['feitas'] / $formacao['total'] * 100) : 0 ?>%"></span>
        </div>
        <p class="formacao-conta">
          <?= $formacao['feitas'] ?> de <?= $formacao['total'] ?> aulas ·
          Pistas Rápidas <?= $formacao['rapidasFeitas'] ?> de <?= $formacao['rapidas'] ?>
        </p>

        <?php if ($formacao['aprendidas'] !== []): ?>
          <?php /* Os títulos, e não só o percentual: "26%" não diz nada, "você
                   já sabe fazer a Ficha de Fato" diz. */ ?>
          <p class="formacao-feitas">
            Você já aprendeu: <strong><?= h(implode(' · ', $formacao['aprendidas'])) ?></strong>
          </p>
        <?php endif; ?>

        <?php if ($formacao['proxima'] !== null): ?>
          <a class="btn btn-mini" href="/aulas#<?= h($formacao['proxima']['aula']['id']) ?>">
            Próxima 🚗 Dia <?= (int) $formacao['proxima']['dia']['numero'] ?> — <?= h($formacao['proxima']['aula']['titulo']) ?>
          </a>
        <?php else: ?>
          <p class="dica" style="margin:0">
            Você fez todas as Pistas Rápidas. As Pistas Lentas continuam em
            <a href="/aulas">/aulas</a> para quando precisar de um ponto específico.
          </p>
        <?php endif; ?>
      </section>
    <?php endif; ?>

  <?php endif; ?>

  </div><?php /* fim de .hub-principal */ ?>

  <?php /* ============ a coluna da direita ============
           No computador ela fica ao lado; no celular a grade vira uma coluna só
           e ESTE bloco sobe para o topo (ver painel.css). "Com prioridade" que
           vira o último bloco de uma página rolada no celular não é prioridade
           nenhuma — e o celular é de onde vem a maioria. */ ?>
  <aside class="hub-lado">
    <section class="cartao-grupo" id="grupo">
      <span class="cartao-grupo-icone"><?= icone('whatsapp', 28) ?></span>
      <h2>Grupo de trabalho</h2>
      <p>
        Entre no grupo para acompanhar avisos e novidade dos trabalhos da
        militância da Missão no Ceará.
      </p>
      <div class="acoes">
        <a class="btn btn-ouro" href="<?= h(GRUPO_TRABALHO) ?>" target="_blank" rel="noopener">
          Entrar no grupo
        </a>
      </div>
      <?php if (empty($u['entrouNoGrupo'])): ?>
        <form method="post" class="cartao-grupo-feito">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="entrei-no-grupo">
          <button class="btn btn-mini" type="submit">Já entrei</button>
        </form>
        <p class="dica">
          É a primeira coisa que se faz aqui. Enquanto não marcar, ela continua
          no topo da sua fila.
        </p>
      <?php endif; ?>
    </section>
  </aside>

  </div><?php /* fim de .hub */ ?>

</div>
<?php
fechar_pagina();
