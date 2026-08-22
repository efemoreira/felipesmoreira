<?php
declare(strict_types=1);

/**
 * Pessoas — felipesmoreira.com/painel/pessoas
 *
 * Todo mundo do movimento numa lista só: quem tem conta, quem se inscreveu, quem
 * apareceu num encontro e quem é candidato. Antes eram quatro cadastros que não
 * se conheciam, e não dava para responder as perguntas óbvias — "em que
 * encontros o Fulano esteve?", "esse número já é do time?", "quem está
 * duplicado?".
 *
 * **Só a capacidade de administração entra.** É a tela com telefone, e-mail e
 * endereço de todo mundo: acesso a dado pessoal não acompanha o trabalho do dia,
 * acompanha a responsabilidade sobre ele.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/pessoas-comum.php';
require_once __DIR__ . '/eventos-comum.php';   // em que encontros ela esteve
require_once __DIR__ . '/inscricoes-comum.php'; // nome_funcao()
exigir_area('pessoas');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $qs = ''): void
{
    header('Location: /painel/pessoas.php' . $qs, true, 302);
    exit;
}

/** As áreas marcadas à mão — o ajuste fino por cima das capacidades. */
function areas_do_post(): array
{
    $pedidas = is_array($_POST['areas'] ?? null) ? $_POST['areas'] : [];
    return array_values(array_intersect(array_keys(AREAS), $pedidas));
}

function capacidades_do_post(): array
{
    $pedidas = is_array($_POST['capacidades'] ?? null) ? $_POST['capacidades'] : [];
    return array_values(array_intersect(array_keys(CAPACIDADES), $pedidas));
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

    /* ---------- cadastrar ou alterar ---------- */
    if ($acao === 'salvar') {
        $novo = $alvo === null;
        $ficha = $alvo ?? [
            'id' => novo_id_pessoa(),
            'criadoEm' => date('c'),
        ];

        $ficha['nome']   = $_POST['nome'] ?? ($ficha['nome'] ?? '');
        $ficha['tipo']   = $_POST['tipo'] ?? 'eleitor';
        $ficha['telefone'] = $_POST['telefone'] ?? '';
        $ficha['email']  = $_POST['email'] ?? '';
        $ficha['cidade'] = $_POST['cidade'] ?? '';
        $ficha['bairro'] = $_POST['bairro'] ?? '';
        $ficha['observacao'] = $_POST['observacao'] ?? '';
        $ficha['funcoes'] = (array) ($_POST['funcoes'] ?? []);
        $ficha['capacidades'] = capacidades_do_post();
        /* As áreas do formulário são só o ajuste fino: normalizar_pessoa()
           acrescenta por cima o que as capacidades já liberam. */
        $ficha['areas'] = areas_do_post();

        if (normalizar_pessoa($ficha) === null) {
            avisar('erro', 'O nome é o mínimo — sem ele não dá para chamar ninguém de nada.');
            voltar();
        }

        /* Tirar a administração do último que administra tranca todo mundo para
           fora de criar contas e mexer em permissão. */
        if ($alvo !== null && in_array('adm', $alvo['capacidades'], true)
            && !in_array('adm', $ficha['capacidades'], true)
            && !tem_admin_ativo($alvo['id'])) {
            avisar('erro', 'Este é o único administrador ativo. Dê a administração a outra pessoa antes de tirar a dele.');
            voltar('?p=' . $alvo['id']);
        }

        $pessoas = [];
        $achou = false;
        foreach (ler_pessoas() as $p) {
            if ($p['id'] === $ficha['id']) {
                $achou = true;
                $pessoas[] = $ficha;
                continue;
            }
            $pessoas[] = $p;
        }
        if (!$achou) {
            $pessoas[] = $ficha;
        }

        if (!gravar_pessoas($pessoas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar();
        }
        avisar('ok', $novo ? 'Cadastrada.' : 'Alterada.');
        voltar('?p=' . $ficha['id']);
    }

    if ($alvo === null) {
        avisar('erro', 'Pessoa não encontrada.');
        voltar();
    }

    /* ---------- dar acesso ao painel ---------- */
    if ($acao === 'dar-conta') {
        if (tem_conta($alvo)) {
            avisar('erro', 'Essa pessoa já tem conta.');
            voltar('?p=' . $alvo['id']);
        }
        $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
        if ($erro = validar_nome_usuario($login)) {
            avisar('erro', $erro);
            voltar('?p=' . $alvo['id']);
        }
        if (pessoa_por_usuario($login) !== null) {
            avisar('erro', 'Esse login já está em uso.');
            voltar('?p=' . $alvo['id']);
        }

        $provisoria = senha_provisoria();
        $pessoas = ler_pessoas();
        foreach ($pessoas as &$p) {
            if ($p['id'] === $alvo['id']) {
                $p['usuario'] = $login;
                $p['hash'] = password_hash($provisoria, PASSWORD_DEFAULT);
                $p['ativo'] = true;
                /* Provisória de verdade: exigir_login() prende a pessoa em
                   conta.php até ela escolher a própria senha. */
                $p['trocarSenha'] = true;
                if ($p['status'] === 'pendente' || $p['status'] === '') {
                    $p['status'] = 'aprovada';
                }
            }
        }
        unset($p);

        if (!gravar_pessoas($pessoas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar('?p=' . $alvo['id']);
        }
        $_SESSION['senha_nova'] = ['id' => $alvo['id'], 'usuario' => $login, 'senha' => $provisoria];
        avisar('ok', 'Conta criada.');
        voltar('?p=' . $alvo['id']);
    }

    /* ---------- resetar senha ---------- */
    if ($acao === 'resetar') {
        $provisoria = senha_provisoria();
        $pessoas = ler_pessoas();
        foreach ($pessoas as &$p) {
            if ($p['id'] === $alvo['id'] && tem_conta($p)) {
                $p['hash'] = password_hash($provisoria, PASSWORD_DEFAULT);
                $p['trocarSenha'] = true;
            }
        }
        unset($p);
        if (!gravar_pessoas($pessoas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar('?p=' . $alvo['id']);
        }
        $_SESSION['senha_nova'] = ['id' => $alvo['id'], 'usuario' => $alvo['usuario'], 'senha' => $provisoria];
        avisar('ok', 'Senha trocada.');
        voltar('?p=' . $alvo['id']);
    }

    /* ---------- ativar / desativar a conta ---------- */
    if ($acao === 'ativar') {
        if ($alvo['ativo'] && !tem_admin_ativo($alvo['id']) && in_array('adm', $alvo['capacidades'], true)) {
            avisar('erro', 'Este é o único administrador ativo — desativá-lo tranca todo mundo para fora.');
            voltar('?p=' . $alvo['id']);
        }
        $pessoas = ler_pessoas();
        foreach ($pessoas as &$p) {
            if ($p['id'] === $alvo['id']) {
                $p['ativo'] = !$p['ativo'];
            }
        }
        unset($p);
        gravar_pessoas($pessoas);
        avisar('ok', $alvo['ativo'] ? 'Conta desativada. A pessoa continua na lista.' : 'Conta reativada.');
        voltar('?p=' . $alvo['id']);
    }

    /* ---------- juntar duplicata ---------- */
    if ($acao === 'juntar') {
        $sumir = limpar_texto($_POST['sumir'] ?? '', 40);
        if (juntar_pessoas($alvo['id'], $sumir)) {
            avisar('ok', 'Fichas juntadas. As presenças em encontro vieram junto.');
        } else {
            avisar('erro', 'Não deu para juntar. Duas contas de painel nunca se fundem — apague uma antes, na mão.');
        }
        voltar('?p=' . $alvo['id']);
    }

    /* ---------- apagar ---------- */
    if ($acao === 'apagar') {
        if (in_array('adm', $alvo['capacidades'], true) && !tem_admin_ativo($alvo['id'])) {
            avisar('erro', 'Não dá para apagar o único administrador ativo.');
            voltar('?p=' . $alvo['id']);
        }
        $restantes = array_values(array_filter(ler_pessoas(), fn ($p) => $p['id'] !== $alvo['id']));
        if (!gravar_pessoas($restantes)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar('?p=' . $alvo['id']);
        }
        /* As presenças dela vão junto: presença de quem não existe mais é linha
           que só atrapalha a contagem do encontro. */
        gravar_presencas(array_values(array_filter(ler_presencas(), fn ($l) => $l['pessoaId'] !== $alvo['id'])));
        avisar('ok', $alvo['nome'] . ' foi apagada, e as presenças dela junto.');
        voltar();
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$senhaNova = $_SESSION['senha_nova'] ?? null;
unset($_SESSION['senha_nova']);

/* A ficha aberta (`?p=`) e o formulário aberto (`?editar=`) são coisas
   diferentes: dá para ler a ficha de alguém sem estar editando, e é o normal.
   Um parâmetro só faria toda visita à ficha abrir o modal por cima dela. */
$aberta  = achar_pessoa(limpar_texto($_GET['p'] ?? '', 40));
$editando = achar_pessoa(limpar_texto($_GET['editar'] ?? '', 40));
$busca   = limpar_texto($_GET['q'] ?? '', 60);
$filtro  = limpar_texto($_GET['tipo'] ?? '', 20);
if (!isset(TIPOS_PESSOA[$filtro])) {
    $filtro = '';
}
$cidadeF = cidade_valida($_GET['cidade'] ?? '');
/* A-Z é o padrão: numa lista de gente a pergunta quase sempre é "cadê o
   Fulano", e para isso a ordem alfabética é a única que não obriga a ler tudo.
   "Mais recentes" existe para a outra pergunta — quem chegou esta semana. */
$ordem = in_array($_GET['ordem'] ?? '', ['recente', 'cidade'], true) ? (string) $_GET['ordem'] : 'nome';

$todas = ler_pessoas();
if ($busca !== '') {
    /* Casa por nome sem acento, por telefone e por login: quem procura tem na
       mão um desses três, e nunca sabe qual está gravado. */
    $alvoBusca = mb_strtolower(sem_acento($busca));
    $digitos = so_digitos($busca);
    $todas = array_values(array_filter($todas, function ($p) use ($alvoBusca, $digitos) {
        if (str_contains(mb_strtolower(sem_acento($p['nome'])), $alvoBusca)) {
            return true;
        }
        if ($digitos !== '' && str_contains($p['telefone'], $digitos)) {
            return true;
        }
        return $p['usuario'] !== '' && str_contains($p['usuario'], $alvoBusca);
    }));
}
if ($filtro !== '') {
    $todas = array_values(array_filter($todas, fn ($p) => $p['tipo'] === $filtro));
}
if ($cidadeF !== '') {
    $todas = array_values(array_filter($todas, fn ($p) => $p['cidade'] === $cidadeF));
}
usort($todas, fn ($a, $b) => match ($ordem) {
    /* `criadoEm` é ISO, então comparar como texto já ordena por tempo — e quem
       não tem data (ficha vinda de importação) cai para o fim, que é onde ela
       de fato pertence numa lista de "quem chegou agora". */
    'recente' => strcmp((string) $b['criadoEm'], (string) $a['criadoEm']),
    'cidade'  => [sem_acento($a['cidade']), sem_acento($a['bairro']), sem_acento($a['nome'])]
                 <=> [sem_acento($b['cidade']), sem_acento($b['bairro']), sem_acento($b['nome'])],
    default   => strcmp(sem_acento($a['nome']), sem_acento($b['nome'])),
});

$duplicatas = duplicatas_de_pessoas();
$porTipo = [];
$cidadesUsadas = [];
foreach (ler_pessoas() as $p) {
    $porTipo[$p['tipo']] = ($porTipo[$p['tipo']] ?? 0) + 1;
    if ($p['cidade'] !== '') {
        $cidadesUsadas[$p['cidade']] = ($cidadesUsadas[$p['cidade']] ?? 0) + 1;
    }
}
/* O filtro de cidade lista só as cidades que TÊM gente. Oferecer os 184
   municípios num filtro é oferecer 180 recortes que devolvem lista vazia. */
uksort($cidadesUsadas, fn ($a, $b) => strcmp(sem_acento($a), sem_acento($b)));

$catalogo = catalogo_funcoes()['funcoes'];   // 'lista' não existe: a chave é 'funcoes'

/**
 * A ficha de cadastro — uma só, desenhada em dois modais.
 *
 * Cadastrar e editar perguntam exatamente a mesma coisa. Duas cópias
 * divergiriam na primeira vez que um campo entrasse só numa delas — e o defeito
 * seria invisível até alguém reclamar que "some quando eu edito".
 *
 * O sufixo `-e` nos ids existe porque os dois formulários coexistem no mesmo
 * documento: id repetido faz o `<label for>` apontar para o campo errado, e no
 * celular o toque no rótulo passa a focar o outro modal.
 */
function formulario_pessoa(?array $aberta, array $catalogo): void
{
    $s = $aberta ? '-e' : '';
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="salvar">
      <?php if ($aberta): ?>
        <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
      <?php endif; ?>

      <div class="linha g2">
        <div class="campo">
          <label for="f-nome<?= $s ?>">Nome completo</label>
          <input id="f-nome<?= $s ?>" name="nome" type="text" maxlength="80" required value="<?= h($aberta['nome'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="f-tipo<?= $s ?>">O que ela é para o movimento</label>
          <select id="f-tipo<?= $s ?>" name="tipo">
            <?php foreach (TIPOS_PESSOA as $chave => $rotulo): ?>
              <option value="<?= h($chave) ?>" <?= ($aberta['tipo'] ?? 'eleitor') === $chave ? 'selected' : '' ?>><?= h($rotulo) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="linha g3">
        <div class="campo">
          <label for="f-tel<?= $s ?>">WhatsApp</label>
          <input id="f-tel<?= $s ?>" name="telefone" type="tel" inputmode="numeric" maxlength="20" value="<?= h($aberta['telefone'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="f-cidade<?= $s ?>">Cidade</label>
          <?php campo_cidade('f-cidade' . $s, 'cidade', $aberta['cidade'] ?? ''); ?>
        </div>
        <div class="campo">
          <label for="f-bairro<?= $s ?>">Bairro</label>
          <input id="f-bairro<?= $s ?>" name="bairro" type="text" maxlength="60" value="<?= h($aberta['bairro'] ?? '') ?>">
        </div>
      </div>

      <div class="campo">
        <label for="f-email<?= $s ?>">E-mail <span class="dica">— opcional</span></label>
        <input id="f-email<?= $s ?>" name="email" type="email" maxlength="120" value="<?= h($aberta['email'] ?? '') ?>">
      </div>

      <p class="dica" style="margin:16px 0 6px"><strong>O que ela faz</strong> — as funções na militância:</p>
      <div class="linha g2">
        <?php foreach ($catalogo as $f): ?>
          <label class="check">
            <input type="checkbox" name="funcoes[]" value="<?= h($f['id']) ?>"
                   <?= in_array($f['id'], $aberta['funcoes'] ?? [], true) ? 'checked' : '' ?>>
            <?= h($f['nome']) ?>
          </label>
        <?php endforeach; ?>
      </div>

      <p class="dica" style="margin:18px 0 6px">
        <strong>O que ela abre no painel</strong> — marque a capacidade; as áreas vêm junto:
      </p>
      <?php foreach (CAPACIDADES as $chave => $cap): ?>
        <label class="check">
          <input type="checkbox" name="capacidades[]" value="<?= h($chave) ?>"
                 <?= in_array($chave, $aberta['capacidades'] ?? [], true) ? 'checked' : '' ?>>
          <strong><?= h($cap['nome']) ?></strong>
          <span class="dica"><?= h($cap['resumo']) ?></span>
        </label>
      <?php endforeach; ?>

      <details class="decidir" style="margin-top:14px">
        <summary class="btn">Ajuste fino por ferramenta</summary>
        <div class="decidir-corpo">
          <p class="dica" style="margin:0 0 10px">
            Para a exceção: dar uma ferramenta solta a quem não tem a capacidade inteira.
            O que a capacidade já libera aparece marcado depois de salvar, e desmarcar
            aqui não tira o que ela concede.
          </p>
          <div class="linha g2">
            <?php foreach (AREAS as $chave => $rotulo): ?>
              <label class="check">
                <input type="checkbox" name="areas[]" value="<?= h($chave) ?>"
                       <?= in_array($chave, $aberta['areas'] ?? [], true) ? 'checked' : '' ?>>
                <?= h($rotulo) ?>
              </label>
            <?php endforeach; ?>
          </div>
        </div>
      </details>

      <div class="campo" style="margin-top:14px">
        <label for="f-obs<?= $s ?>">Anotação <span class="dica">— opcional</span></label>
        <textarea id="f-obs<?= $s ?>" name="observacao" rows="2" maxlength="400"><?= h($aberta['observacao'] ?? '') ?></textarea>
      </div>

      <div class="acoes">
        <button class="btn btn-ouro" type="submit"><?= $aberta ? 'Salvar' : 'Cadastrar' ?></button>
        <?php if ($aberta): ?>
          <a class="btn" href="/painel/pessoas.php">Cancelar</a>
        <?php endif; ?>
      </div>
    </form>

    <?php if ($aberta): ?>
      <?php /* Apagar fica FORA do formulário de cima, num <form> próprio: botão
               de risco dentro do formulário que se usa todo dia é o botão que se
               aperta por engano. */ ?>
      <form method="post" class="decidir-recusa"
            onsubmit="return confirm('Apagar <?= h($aberta['nome']) ?> e as presenças dela?')">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="acao" value="apagar">
        <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
        <div class="acoes">
          <button class="btn btn-risco" type="submit">Apagar esta pessoa</button>
        </div>
      </form>
    <?php endif; ?>
    <?php
}

abrir_pagina('Pessoas');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Pessoas',
      'Todo mundo do movimento numa lista só — quem tem conta, quem se inscreveu, '
      . 'quem apareceu num encontro e quem é candidato.',
      null,
      null,
      [
          'A ficha mostra o que a pessoa é, o que faz, o que abre no painel e em que encontros esteve.',
          'Capacidade é o jeito normal de dar acesso; as áreas embaixo são para a exceção.',
          'Dar conta cria o login e mostra a senha provisória uma vez.',
          'Duplicatas são sugestão, nunca fusão automática — juntar a ficha errada não tem desfazer.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php if ($senhaNova !== null): ?>
    <div class="msg msg-ok">
      <p style="margin:0 0 8px">
        <strong>Login:</strong> <span class="provisoria"><?= h($senhaNova['usuario']) ?></span>
        &nbsp; <strong>Senha provisória:</strong> <span class="provisoria"><?= h($senhaNova['senha']) ?></span>
      </p>
      <p class="dica" style="margin:0">
        Aparece <strong>uma vez só</strong> — só o hash fica guardado, e hash não volta
        a ser senha. Mande agora; no primeiro acesso a pessoa é obrigada a trocar.
      </p>
    </div>
  <?php endif; ?>

  <?php /* O recorte por tipo é ABA, e não um <select> no meio do filtro: é a
           pergunta que se faz toda vez ("cadê os militantes?"), e pergunta que se
           faz toda vez merece estar sempre visível, com o número do lado. */ ?>
  <?php
  $abasTipo = ['' => ['nome' => 'Todas', 'conta' => count(ler_pessoas())]];
  foreach (TIPOS_PESSOA as $chave => $rotulo) {
      $abasTipo[$chave] = ['nome' => $rotulo, 'conta' => $porTipo[$chave] ?? 0];
  }
  barra_abas($abasTipo, $filtro, 'tipo', 'Tipo de pessoa');
  ?>

  <?php /* ============ duplicatas ============ */ ?>
  <?php if ($duplicatas !== []): ?>
    <fieldset id="duplicatas">
      <legend>Possíveis duplicatas (<?= count($duplicatas) ?>)</legend>
      <p class="dica" style="margin:0 0 14px">
        Mesmo telefone ou mesmo nome. <strong>É sugestão, não certeza</strong> — casa que
        divide celular tem duas pessoas de verdade no mesmo número. Confira antes: juntar
        a ficha errada apaga o histórico de alguém, e isso não tem desfazer.
      </p>
      <?php foreach ($duplicatas as $d): ?>
        <article class="ficha">
          <header class="ficha-topo">
            <span class="ficha-quem">
              <strong><?= h($d['a']['nome']) ?></strong>
              <span>e <strong><?= h($d['b']['nome']) ?></strong> — <?= h($d['motivo']) ?></span>
            </span>
            <span class="selo selo-off"><?= h($d['motivo']) ?></span>
          </header>
          <dl class="ficha-dados">
            <?php foreach (['a', 'b'] as $lado): ?>
              <?php $x = $d[$lado]; ?>
              <div>
                <dt><?= h($x['nome']) ?></dt>
                <dd>
                  <?= h(TIPOS_PESSOA[$x['tipo']]) ?>
                  <?= $x['telefone'] !== '' ? ' · ' . h(telefone_bonito($x['telefone'])) : '' ?>
                  <?= tem_conta($x) ? ' · <span class="selo">tem conta</span>' : '' ?>
                  <br><span class="dica"><?= count(encontros_da_pessoa($x['id'])) ?> encontro(s)</span>
                </dd>
              </div>
            <?php endforeach; ?>
          </dl>
          <div class="acoes">
            <?php foreach ([['a', 'b'], ['b', 'a']] as [$fica, $vai]): ?>
              <form method="post" style="display:inline"
                    onsubmit="return confirm('Juntar tudo em “<?= h($d[$fica]['nome']) ?>” e apagar a outra ficha?')">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="acao" value="juntar">
                <input type="hidden" name="id" value="<?= h($d[$fica]['id']) ?>">
                <input type="hidden" name="sumir" value="<?= h($d[$vai]['id']) ?>">
                <button class="btn btn-mini" type="submit">Manter <?= h($d[$fica]['nome']) ?></button>
              </form>
            <?php endforeach; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </fieldset>
  <?php endif; ?>

  <?php /* ============ a ficha aberta ============ */ ?>
  <?php if ($aberta !== null): ?>
    <?php $encontros = encontros_da_pessoa($aberta['id']); ?>
    <fieldset id="ficha">
      <legend><?= h($aberta['nome']) ?></legend>

      <p style="margin:0 0 14px">
        <span class="selo"><?= h(TIPOS_PESSOA[$aberta['tipo']]) ?></span>
        <?php if (tem_conta($aberta)): ?>
          <span class="selo <?= $aberta['ativo'] ? 'selo-ok' : 'selo-off' ?>">
            <?= $aberta['ativo'] ? 'conta ativa' : 'conta desativada' ?> · <?= h($aberta['usuario']) ?>
          </span>
        <?php endif; ?>
        <?php if ($aberta['status'] !== ''): ?>
          <span class="selo selo-cinza"><?= h(STATUS_PESSOA[$aberta['status']]) ?></span>
        <?php endif; ?>
      </p>

      <?php /* ---- em que encontros esteve ---- */ ?>
      <h3 style="margin:18px 0 10px">Encontros (<?= count($encontros) ?>)</h3>
      <?php if ($encontros === []): ?>
        <p class="dica" style="margin:0">Nunca apareceu em encontro nenhum.</p>
      <?php else: ?>
        <div class="rolagem">
          <table class="tabela">
            <thead><tr><th>Encontro</th><th>Quando</th><th>O que aconteceu</th></tr></thead>
            <tbody>
              <?php foreach ($encontros as $en): ?>
                <tr>
                  <td>
                    <a href="/painel/eventos.php?e=<?= h($en['evento']['id']) ?>">
                      <?= h($en['evento']['titulo']) ?>
                    </a>
                  </td>
                  <td><?= h(trim($en['evento']['data'] . ' ' . $en['evento']['hora'])) ?: '—' ?></td>
                  <td>
                    <?php if ($en['compareceu']): ?>
                      <span class="selo selo-ok">veio</span>
                    <?php elseif ($en['confirmou']): ?>
                      <span class="selo selo-off">confirmou e faltou</span>
                    <?php else: ?>
                      <span class="selo selo-cinza">convidada</span>
                    <?php endif; ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

      <?php /* ---- acesso ao painel ---- */ ?>
      <h3 style="margin:22px 0 10px">Acesso ao painel</h3>
      <?php if (!tem_conta($aberta)): ?>
        <p class="dica">
          Sem conta. A maioria das pessoas não precisa de uma — quem confirmou presença
          num encontro está na lista do mesmo jeito.
        </p>
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="dar-conta">
          <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
          <div class="campo">
            <label for="novo-login">Login</label>
            <input id="novo-login" name="usuario" type="text" maxlength="24" required
                   value="<?= h(login_sugerido($aberta['nome'])) ?>">
          </div>
          <div class="acoes">
            <button class="btn btn-ouro" type="submit">Criar a conta e gerar senha</button>
          </div>
        </form>
      <?php else: ?>
        <?php /* O login escrito por extenso, e não só dentro do selo lá em cima:
                 é ele que a pessoa digita para entrar, e é ele que a coordenação
                 dita no WhatsApp quando alguém diz "não consigo entrar". Monoespaçado
                 porque num tipo proporcional o l e o 1 têm o mesmo desenho. */ ?>
        <p style="margin:0 0 12px">
          <strong>Login:</strong> <span class="login"><?= h($aberta['usuario']) ?></span>
        </p>
        <div class="acoes">
          <form method="post" style="display:inline">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="resetar">
            <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
            <button class="btn" type="submit">Resetar senha</button>
          </form>
          <form method="post" style="display:inline">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="ativar">
            <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
            <button class="btn" type="submit"><?= $aberta['ativo'] ? 'Desativar a conta' : 'Reativar' ?></button>
          </form>
        </div>
        <p class="dica">
          Último acesso: <?= $aberta['ultimoAcesso'] !== '' ? h(date('d/m/Y H:i', (int) strtotime($aberta['ultimoAcesso']))) : 'nunca entrou' ?>.
          Senha não se recupera — só o hash fica guardado.
        </p>
      <?php endif; ?>

      <?php /* ---- candidatura ----
               Candidato é uma PESSOA com `tipo = candidato`, e não um cadastro à
               parte — por isso a ponte é daqui, e não uma segunda ficha lá. O que
               não se faz aqui é virar o tipo no clique: candidato sem número é
               candidato que não pode ir ao ar, e o número (com o cargo que confere
               os dígitos) só é perguntado em um lugar, que é o formulário de
               /painel/candidatos. O link leva a ele já preenchido com esta ficha. */ ?>
      <?php if ($aberta['tipo'] === 'candidato' || pode('candidatos')): ?>
        <h3 style="margin:22px 0 10px">Candidatura</h3>
        <?php if ($aberta['tipo'] === 'candidato'): ?>
          <p style="margin:0 0 10px">
            <?php if ($aberta['numero'] !== ''): ?>
              <span class="selo"><?= h($aberta['numero']) ?></span>
            <?php else: ?>
              <span class="selo selo-off">sem número</span>
            <?php endif; ?>
            <span class="selo selo-cinza"><?= h(rotulo_cargo($aberta['cargo'])) ?></span>
            <span class="selo <?= $aberta['publicado'] ? 'selo-ok' : 'selo-cinza' ?>">
              <?= $aberta['publicado'] ? 'no ar' : 'rascunho' ?>
            </span>
          </p>
          <?php if (pode('candidatos')): ?>
            <div class="acoes">
              <a class="btn" href="/painel/candidatos.php?aba=candidatos&amp;c=<?= h($aberta['id']) ?>">Editar a candidatura</a>
            </div>
          <?php endif; ?>
        <?php else: ?>
          <p class="dica">
            Não é candidata. Tornar candidato é preencher o número de urna — sem ele a
            colinha não existe, e colinha com número errado é pior que colinha nenhuma.
          </p>
          <div class="acoes">
            <a class="btn" href="/painel/candidatos.php?aba=candidatos&amp;pessoa=<?= h($aberta['id']) ?>">
              Tornar candidato
            </a>
          </div>
        <?php endif; ?>
      <?php endif; ?>
    </fieldset>
  <?php endif; ?>
  <?php /* ============ a lista ============ */ ?>
  <fieldset id="lista">
    <legend>
      <?= $filtro === '' ? 'Todas' : h(TIPOS_PESSOA[$filtro]) ?>
      (<?= count($todas) ?><?= $busca !== '' || $filtro !== '' || $cidadeF !== '' ? ' de ' . count(ler_pessoas()) : '' ?>)
    </legend>

    <div class="acoes" style="margin:0 0 18px">
      <?php botao_modal('nova-pessoa', 'Cadastrar pessoa', 'novo=1' . ($filtro !== '' ? '&tipo=' . urlencode($filtro) : '')); ?>
    </div>

    <?php /* O recorte por TIPO é aba, lá em cima — é a pergunta que se faz toda
             vez. Aqui ficam as três que se fazem de vez em quando; e elas só
             aparecem quando a lista é grande o bastante para não caber na tela. */ ?>
    <?php if (count(ler_pessoas()) > 8 || $busca !== '' || $cidadeF !== ''): ?>
      <form method="get" class="filtros">
        <?php if ($filtro !== ''): ?>
          <input type="hidden" name="tipo" value="<?= h($filtro) ?>">
        <?php endif; ?>
        <div class="campo">
          <label for="q">Procurar</label>
          <input id="q" name="q" type="search" maxlength="60" value="<?= h($busca) ?>"
                 placeholder="nome, telefone ou login">
        </div>
        <div class="campo">
          <label for="fcid">Cidade</label>
          <select id="fcid" name="cidade">
            <option value="">todas</option>
            <?php foreach ($cidadesUsadas as $nome => $quantos): ?>
              <option value="<?= h($nome) ?>" <?= $cidadeF === $nome ? 'selected' : '' ?>>
                <?= h($nome) ?> (<?= (int) $quantos ?>)
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="campo">
          <label for="ford">Ordenar por</label>
          <select id="ford" name="ordem">
            <option value="nome"    <?= $ordem === 'nome'    ? 'selected' : '' ?>>nome (A–Z)</option>
            <option value="recente" <?= $ordem === 'recente' ? 'selected' : '' ?>>quem chegou por último</option>
            <option value="cidade"  <?= $ordem === 'cidade'  ? 'selected' : '' ?>>cidade e bairro</option>
          </select>
        </div>
        <div class="acoes">
          <button class="btn" type="submit">Filtrar</button>
          <?php if ($busca !== '' || $cidadeF !== '' || $ordem !== 'nome'): ?>
            <a class="btn" href="/painel/pessoas.php<?= $filtro !== '' ? '?tipo=' . urlencode($filtro) : '' ?>">Limpar</a>
          <?php endif; ?>
        </div>
      </form>
    <?php endif; ?>

    <?php if ($todas === []): ?>
      <p class="dica" style="margin:0">Ninguém encontrado.</p>
    <?php else: ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th>Quem</th><th>Tipo</th><th>Faz</th><th>Painel</th><th>Encontros</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($todas as $p): ?>
              <tr>
                <td>
                  <strong><?= h($p['nome']) ?></strong><br>
                  <span class="dica">
                    <?php if ($p['telefone'] !== ''): ?>
                      <a href="https://wa.me/55<?= h($p['telefone']) ?>" target="_blank" rel="noopener"><?= h(telefone_bonito($p['telefone'])) ?></a>
                    <?php endif; ?>
                    <?php $onde = trim($p['bairro'] . ($p['cidade'] !== '' ? ', ' . $p['cidade'] : ''), ', '); ?>
                    <?= $onde !== '' ? ' · ' . h($onde) : '' ?>
                  </span>
                </td>
                <td><span class="selo"><?= h(TIPOS_PESSOA[$p['tipo']]) ?></span></td>
                <td>
                  <?php foreach ($p['funcoes'] as $f): ?>
                    <span class="selo selo-cinza"><?= h(nome_funcao($f)) ?></span>
                  <?php endforeach; ?>
                </td>
                <td>
                  <?php if (tem_conta($p)): ?>
                    <?php /* O LOGIN vem primeiro, e o que a pessoa abre vem embaixo.
                             A pergunta que traz alguém a esta coluna é "qual é o login
                             do Fulano?" — quem esqueceu o dele pergunta no grupo, e
                             quem responde não deveria ter que abrir a ficha para ler
                             uma palavra. A busca já casava por login sem nunca
                             mostrá-lo: dava para achar, não dava para ditar. */ ?>
                    <strong class="login"><?= h($p['usuario']) ?></strong><br>
                    <span class="selo <?= $p['ativo'] ? 'selo-ok' : 'selo-off' ?>"><?= h(rotulo_do_acesso($p)) ?></span>
                  <?php else: ?>
                    <span class="dica">—</span>
                  <?php endif; ?>
                </td>
                <td><?= count(encontros_da_pessoa($p['id'])) ?: '—' ?></td>
                <td>
                  <a class="btn btn-mini" href="?p=<?= h($p['id']) ?>#ficha">Abrir</a>
                  <a class="btn btn-mini" data-modal="editar-pessoa" href="?editar=<?= h($p['id']) ?>">Editar</a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <?php /* ============ os modais ============
           No fim do documento, e não dentro do <fieldset>: <dialog> aninhado em
           formulário ou tabela é HTML inválido, e o navegador reorganiza a árvore
           sozinho — o formulário some sem um erro sequer no console. */ ?>
  <?php abrir_modal('nova-pessoa', 'Cadastrar pessoa', isset($_GET['novo'])); ?>
    <?php formulario_pessoa(null, $catalogo); ?>
  <?php fechar_modal(); ?>

  <?php if ($editando !== null): ?>
    <?php abrir_modal('editar-pessoa', 'Editar ' . $editando['nome'], true); ?>
      <?php formulario_pessoa($editando, $catalogo); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
fechar_pagina();
