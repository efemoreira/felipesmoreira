<?php
declare(strict_types=1);

/**
 * Inscrições da militância — felipesmoreira.com/painel/inscricoes.php
 *
 * A fila de quem se inscreveu em /queroajudar. Aqui a coordenação lê a
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
require_once __DIR__ . '/pessoas-comum.php';  // a fila é gente com status pendente
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
    $alvo = achar_pessoa(limpar_texto($_POST['id'] ?? '', 40));

    if ($alvo === null) {
        avisar('erro', 'Pessoa não encontrada — talvez alguém já tenha decidido.');
        voltar();
    }
    if ($alvo['status'] !== 'pendente') {
        avisar('erro', 'Essa inscrição já foi decidida.');
        voltar();
    }

    $pessoas = ler_pessoas();

    if ($acao === 'aprovar') {
        $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
        $capacidades = array_values(array_intersect(
            array_keys(CAPACIDADES),
            is_array($_POST['capacidades'] ?? null) ? $_POST['capacidades'] : []
        ));
        $areas = array_values(array_intersect(
            array_keys(AREAS),
            is_array($_POST['areas'] ?? null) ? $_POST['areas'] : []
        ));

        if ($erro = validar_nome_usuario($login)) {
            avisar('erro', $erro);
            voltar();
        }
        if (pessoa_por_usuario($login) !== null) {
            avisar('erro', 'Já existe alguém com o login “' . $login . '”. Escolha outro.');
            voltar();
        }

        /* Aprovar NÃO cria uma segunda ficha: dá conta à que já existe. Antes a
           inscrição virava um usuário novo e a inscrição ficava para trás, então
           a mesma pessoa passava a existir duas vezes — e o histórico de
           encontros dela ficava preso na ficha antiga. */
        $provisoria = senha_provisoria();
        foreach ($pessoas as &$p) {
            if ($p['id'] !== $alvo['id']) {
                continue;
            }
            $p['usuario'] = $login;
            $p['hash']    = password_hash($provisoria, PASSWORD_DEFAULT);
            $p['ativo']   = true;
            $p['trocarSenha'] = true;
            $p['capacidades'] = $capacidades;
            $p['areas']   = $areas;
            $p['status']  = 'aprovada';
            $p['tipo']    = (in_array('coordenacao', $capacidades, true)
                || in_array('adm', $capacidades, true)) ? 'coordenador' : 'militante';
            $p['decididoEm']  = date('c');
            $p['decididoPor'] = $eu['nome'];
            /* Inscrição sem função é válida (o formulário deixou de exigir).
               "onde-precisar" existe no catálogo exatamente para isso — deixar
               o array vazio faria o hub não ter atalho nenhum para a pessoa. */
            if ($p['funcoes'] === []) {
                $p['funcoes'] = ['onde-precisar'];
            }
        }
        unset($p);

        if (!gravar_pessoas($pessoas)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões no hPanel.');
            voltar();
        }

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
        foreach ($pessoas as &$p) {
            if ($p['id'] === $alvo['id']) {
                $p['status'] = 'recusada';
                $p['decididoEm'] = date('c');
                $p['decididoPor'] = $eu['nome'];
            }
        }
        unset($p);
        /* A pessoa NÃO é apagada: ela pode ter aparecido num encontro, e apagar
           levaria a presença junto. Fica com status "recusada", fora da fila. */
        if (gravar_pessoas($pessoas)) {
            avisar('ok', 'Inscrição de ' . $alvo['nome'] . ' recusada. Ela continua na lista de pessoas.');
        } else {
            avisar('erro', 'Não consegui gravar a decisão.');
        }
        voltar();
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$acesso = $_SESSION['acesso_novo'] ?? null;
unset($_SESSION['acesso_novo']);

$todas = ler_pessoas();
$novas = fila_de_entrada();
$decididas = array_values(array_filter($todas, fn ($i) => in_array($i['status'], ['aprovada', 'recusada'], true)));

// mais recentes primeiro
/* `fila_de_entrada()` já ordena do mais antigo para o mais novo, que é o
   certo: quem esperou mais é quem está mais perto de desistir. */
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
  <?php cabecalho_pagina(
      'Inscrições da militância',
      'Quem preencheu o formulário em <a href="/queroajudar" target="_blank">/queroajudar</a>. '
      . 'Aprovar cria o acesso e mostra a senha para você mandar no WhatsApp.',
      null,
      null,
      [
          'Aprovar: cria a conta, marca as áreas sugeridas e mostra a senha provisória UMA vez.',
          'O botão do WhatsApp já abre a conversa da pessoa com a mensagem pronta.',
          'Ela foi orientada a mandar um oi antes: procure a conversa que já existe e RESPONDA nela — iniciar dezenas de conversas novas é o que derruba o número da coordenação.',
          'Quem não escolheu função entra como “Onde precisar” — combine na conversa.',
          'Fila parada há mais de 48h aparece como urgente no Início: é onde mais se perde gente.',
      ]
  ); ?>

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
      <p class="dica" style="margin:0 0 10px">
        Se ela já mandou o oi, o botão abre a conversa que existe e a mensagem entra como
        <strong>resposta</strong>. É essa diferença que mantém o número da coordenação de pé:
        o WhatsApp bloqueia quem inicia muitas conversas com quem nunca falou com ele.
      </p>
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

  <?php
    /* O placar da multiplicação. Fica recolhido porque não é trabalho a fazer:
       a fila de decisão é que tem que estar aberta ao abrir a tela. */
    ['placar' => $placar, 'semOrigem' => $semOrigem] = placar_de_origens($todas);
  ?>
  <?php if ($placar !== []): ?>
    <details class="decidir" style="margin-bottom:22px">
      <summary class="btn">Quem está trazendo gente (<?= count($placar) ?>)</summary>
      <div class="decidir-corpo">
        <p class="dica" style="margin:0 0 12px">
          De onde vieram as inscrições, pelo <code>?de=</code> do link que a pessoa abriu.
          Quem compartilha pela <a href="/municao" target="_blank">Munição</a> aparece aqui pelo nome.
        </p>
        <table class="tabela">
          <thead>
            <tr><th>Veio por</th><th>Inscrições</th><th>Já aprovadas</th></tr>
          </thead>
          <tbody>
            <?php foreach ($placar as $linha): ?>
              <tr>
                <td><span class="selo"><?= h($linha['origem']) ?></span></td>
                <td><?= (int) $linha['total'] ?></td>
                <td><?= (int) $linha['aprovadas'] ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        <?php if ($semOrigem > 0): ?>
          <p class="dica" style="margin:12px 0 0">
            Outras <strong><?= (int) $semOrigem ?></strong> chegaram pela URL limpa, sem link de
            ninguém.
          </p>
        <?php endif; ?>
      </div>
    </details>
  <?php endif; ?>

  <?php $regioes = militancia_por_regiao($todas); ?>
  <?php if ($regioes !== []): ?>
    <details class="decidir" style="margin-bottom:22px">
      <summary class="btn">Onde a militância mora (<?= count($regioes) ?>)</summary>
      <div class="decidir-corpo">
        <p class="dica" style="margin:0 0 12px">
          Só quem já foi aprovado. É por aqui que dá pra ver onde já tem gente para um time
          próprio — e quem está sozinho na cidade dele.
        </p>
        <table class="tabela">
          <thead>
            <tr><th>Cidade</th><th>Gente</th><th>Bairros</th></tr>
          </thead>
          <tbody>
            <?php foreach ($regioes as $r): ?>
              <tr>
                <td><strong><?= h($r['cidade']) ?></strong></td>
                <td><?= (int) $r['total'] ?></td>
                <td>
                  <?php if ($r['bairros'] === []): ?>
                    <span class="selo selo-cinza">sem bairro informado</span>
                  <?php else: ?>
                    <?php foreach ($r['bairros'] as $b): ?>
                      <span class="selo"><?= h($b['nome']) ?> · <?= (int) $b['total'] ?></span>
                    <?php endforeach; ?>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </details>
  <?php endif; ?>

  <?php
  /* A fila é o trabalho; as decididas são o arquivo. Empilhadas, o arquivo
     cresce para sempre e a fila — que é o que alguém veio fazer aqui — some
     para baixo. A aba abre na fila, sempre. */
  $abaIn = ($_GET['aba'] ?? '') === 'decididas' && $decididas !== [] ? 'decididas' : 'fila';
  barra_abas([
      'fila'      => ['nome' => 'Esperando decisão', 'conta' => count($novas)],
      'decididas' => ['nome' => 'Já decididas',      'conta' => count($decididas)],
  ], $abaIn, 'aba', 'Inscrições');
  ?>

  <?php if ($abaIn === 'fila'): ?>
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
          <?php if ($i['origem'] !== ''): ?>
            <?php /* Quem trouxe, ou por qual canal. Fica junto do contato, e não
                      no fim da ficha, porque muda a conversa: quem chega indicado
                      por alguém do time se recebe pelo nome de quem indicou. */ ?>
            <div>
              <dt>Veio por</dt>
              <dd><span class="selo"><?= h($i['origem']) ?></span></dd>
            </div>
          <?php endif; ?>
          <div class="ficha-funcoes">
            <dt>Quer ajudar em</dt>
            <dd>
              <?php if ($i['funcoes'] === []): ?>
                <span class="selo selo-cinza">não escolheu</span>
                <span class="dica" style="display:inline">
                  Entra como “Onde precisar” — combine na conversa.
                </span>
              <?php else: ?>
                <?php foreach ($i['funcoes'] as $f): ?>
                  <span class="selo"><?= h(nome_funcao($f)) ?></span>
                <?php endforeach; ?>
              <?php endif; ?>
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
              </div>

              <div class="campo">
                <label>O que ela vai abrir no painel</label>
                <?php foreach (CAPACIDADES as $chave => $cap): ?>
                  <label class="check">
                    <input type="checkbox" name="capacidades[]" value="<?= h($chave) ?>">
                    <strong><?= h($cap['nome']) ?></strong>
                    <span class="dica"><?= h($cap['resumo']) ?></span>
                  </label>
                <?php endforeach; ?>
                <p class="dica">
                  Na dúvida, não marque nenhuma: a pessoa entra, faz a formação e recebe
                  a ferramenta quando assumir a função. <strong>Estudar não pede
                  permissão</strong> — a formação já é de todo mundo que tem conta.
                </p>
              </div>

              <details class="decidir">
                <summary class="btn">Ajuste fino por ferramenta</summary>
                <div class="decidir-corpo">
                  <p class="dica" style="margin:0 0 10px">
                    Já vem marcado conforme as funções que a pessoa escolheu. É para a
                    exceção — dar uma ferramenta solta sem a capacidade inteira.
                  </p>
                  <?php foreach (AREAS as $chave => $rotulo): ?>
                    <label class="check">
                      <input type="checkbox" name="areas[]" value="<?= h($chave) ?>"
                        <?= in_array($chave, $sugeridas, true) ? ' checked' : '' ?>>
                      <?= h($rotulo) ?>
                    </label>
                  <?php endforeach; ?>
                </div>
              </details>

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
  <?php endif; ?>

  <?php if ($abaIn === 'decididas'): ?>
    <fieldset>
      <legend>Já decididas (<?= count($decididas) ?>)</legend>
      <div class="rolagem">
        <table class="tabela">
          <thead>
            <tr><th>Nome</th><th>Cidade</th><th>Situação</th><th>Quem decidiu</th><th>Quando</th></tr>
          </thead>
          <tbody>
            <?php
            /* A-Z: o arquivo se consulta procurando um nome ("o Fulano chegou a
               ser aprovado?"), e não relendo do começo. A ordem de chegada, que
               era a de antes, só serve para a fila — e a fila é a outra aba. */
            $emOrdem = $decididas;
            usort($emOrdem, fn ($a, $b) => strcmp(sem_acento($a['nome']), sem_acento($b['nome'])));
            ?>
            <?php foreach ($emOrdem as $i): ?>
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
