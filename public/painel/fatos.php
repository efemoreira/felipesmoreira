<?php
declare(strict_types=1);

/**
 * Fatos do dia — felipesmoreira.com/painel/fatos
 *
 * Duas telas num arquivo, porque são os dois lados da mesma mesa:
 *   1. o Olheiro preenche a Ficha de Fato;
 *   2. a Checagem abre o link e decide.
 *
 * Quem enxerga o quê é a permissão de sempre (a caixa marcada no usuário).
 * A separação aqui é de tarefa, não de sigilo: qualquer um que abre a área vê a
 * fila, porque entender o que está travando é metade do trabalho.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/fatos-comum.php';
require_once __DIR__ . '/producao-comum.php';
exigir_area('fatos');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $ancora = ''): void
{
    header('Location: /painel/fatos.php' . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
}

/** Guarda o que foi digitado para o formulário voltar preenchido depois do erro. */
function guardar_rascunho(array $campos): void
{
    $_SESSION['rascunho_fato'] = $campos;
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

    /* ---------- o Olheiro traz um fato ---------- */
    if ($acao === 'enviar') {
        $campos = [
            'oQue'      => limpar_texto($_POST['oQue'] ?? '', 300),
            'quem'      => limpar_texto($_POST['quem'] ?? '', 160),
            'quando'    => limpar_texto($_POST['quando'] ?? '', 20),
            'quanto'    => limpar_texto($_POST['quanto'] ?? '', 120),
            'afetados'  => limpar_texto($_POST['afetados'] ?? '', 200),
            'fonteUrl'  => limpar_texto($_POST['fonteUrl'] ?? '', 500),
            'fonteData' => limpar_texto($_POST['fonteData'] ?? '', 20),
            'segundaFonte'  => limpar_texto($_POST['segundaFonte'] ?? '', 500),
            'categoria'     => limpar_texto($_POST['categoria'] ?? 'outro', 20),
            'desdobramento' => !empty($_POST['desdobramento']),
        ];

        // as travas do manual, na ordem em que o Olheiro erra
        if ($campos['oQue'] === '') {
            guardar_rascunho($campos);
            avisar('erro', 'Escreva em uma frase o que aconteceu.');
            voltar('trazer');
        }
        if ($campos['quem'] === '') {
            guardar_rascunho($campos);
            avisar('erro', 'Diga quem é o responsável — o órgão ou o gestor, de forma institucional.');
            voltar('trazer');
        }
        if (!fonte_valida($campos['fonteUrl'])) {
            guardar_rascunho($campos);
            avisar('erro', 'Cole o link da fonte primária. Print não é fonte, e sem link a Checagem não tem o que abrir.');
            voltar('trazer');
        }
        if (!dentro_da_janela($campos['fonteData']) && !$campos['desdobramento']) {
            guardar_rascunho($campos);
            avisar('erro', 'Esse fato está fora da janela de 48h. Se for um desdobramento novo de algo mais antigo, marque a caixa que diz isso — é a única exceção.');
            voltar('trazer');
        }

        $fatos = ler_fatos();
        $fatos[] = $campos + [
            'id'        => novo_id_fato(),
            'status'    => 'a-checar',
            'autorId'   => $eu['id'],
            'autorNome' => $eu['nome'],
            'criadoEm'  => date('c'),
        ];

        if (!gravar_fatos($fatos)) {
            guardar_rascunho($campos);
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar('trazer');
        }
        avisar('ok', 'Fato enviado para a Checagem.');
        voltar('fila');
    }

    /* ---------- a Checagem decide ---------- */
    if ($acao === 'aprovar' || $acao === 'pendente') {
        $alvo = achar_fato(limpar_texto($_POST['id'] ?? '', 40));

        if ($alvo === null) {
            avisar('erro', 'Fato não encontrado.');
            voltar('fila');
        }
        if ($alvo['status'] !== 'a-checar') {
            avisar('erro', 'Esse fato já foi decidido.');
            voltar('fila');
        }

        $motivo = limpar_texto($_POST['motivo'] ?? '', 300);
        if ($acao === 'pendente' && $motivo === '') {
            avisar('erro', 'Diga por que ficou pendente — sem o motivo anotado ninguém sabe o que faltou para destravar depois.');
            voltar('fila');
        }

        /* Aprovar abre o card de roteiro no quadro. É esta ligação que faz a
           ferramenta valer a pena: o roteirista recebe o fato com fonte e
           responsável colados, em vez de um link copiado à mão para o Trello.

           O card entra primeiro: se ele falhar, o fato continua na fila e a
           Checagem tenta de novo. O contrário deixaria fato aprovado sem
           ninguém para escrever, que é pior de perceber. */
        $cardId = '';
        if ($acao === 'aprovar') {
            $card  = card_do_fato($alvo, $eu);
            $cards = ler_cards();
            $cards[] = $card;

            if (!gravar_cards($cards)) {
                avisar('erro', 'Não consegui abrir o card no quadro de Produção. O fato segue na fila — tente de novo.');
                voltar('fila');
            }
            $cardId = $card['id'];
        }

        $fatos = ler_fatos();
        foreach ($fatos as &$f) {
            if ($f['id'] === $alvo['id']) {
                $f['status']     = $acao === 'aprovar' ? 'ok-checado' : 'pendente';
                $f['motivo']     = $acao === 'aprovar' ? '' : $motivo;
                $f['checadoPor'] = $eu['nome'];
                $f['checadoEm']  = date('c');
                $f['cardId']     = $cardId;
            }
        }
        unset($f);

        if (!gravar_fatos($fatos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar('fila');
        }

        avisar('ok', $acao === 'aprovar'
            ? 'Fato aprovado — o card de roteiro já está em “A fazer” na Produção.'
            : 'Fato marcado como pendente. Ele fica guardado com o motivo.');
        voltar('fila');
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$rascunho = $_SESSION['rascunho_fato'] ?? [];
unset($_SESSION['rascunho_fato']);
$v = fn (string $campo, string $padrao = '') => h($rascunho[$campo] ?? $padrao);

$fila      = fatos_com_status('a-checar');
$checados  = array_slice(array_reverse(fatos_com_status('ok-checado')), 0, 15);
$pendentes = array_slice(array_reverse(fatos_com_status('pendente')), 0, 15);

$quando = function (string $iso): string {
    $t = strtotime($iso);
    return $t ? date('d/m \à\s H:i', $t) : '';
};

abrir_pagina('Fatos do dia');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Fatos do dia',
      'O Olheiro traz o fato com a prova; a Checagem abre o link e decide. '
      . 'Nada segue para roteiro ou arte sem passar por aqui.',
      null,
      '/painel/fatos'
  ); ?>

  <?php recado($erro, $ok); ?>

  <!-- ============ a fila ============ -->
  <fieldset id="fila">
    <legend>Esperando checagem (<?= count($fila) ?>)</legend>

    <?php if ($fila === []): ?>
      <p class="dica" style="margin:0">Fila zerada. É esse o objetivo: nada dorme sem status.</p>
    <?php endif; ?>

    <?php foreach ($fila as $f): ?>
      <?php $horas = horas_esperando($f); ?>
      <article class="ficha" id="<?= h($f['id']) ?>">
        <header class="ficha-topo">
          <span class="ficha-quem">
            <strong><?= h($f['oQue']) ?></strong>
            <span>
              <?= h(CATEGORIAS[$f['categoria']]) ?> ·
              por <?= h($f['autorNome']) ?> ·
              chegou <?= h($quando($f['criadoEm'])) ?>
            </span>
          </span>
          <?php if ($horas >= 2): ?>
            <span class="selo selo-off"><?= $horas ?>h esperando</span>
          <?php endif; ?>
        </header>

        <dl class="ficha-dados">
          <div><dt>Quem</dt><dd><?= h($f['quem']) ?></dd></div>
          <?php if ($f['quando'] !== ''): ?>
            <div><dt>Quando</dt><dd><?= h($f['quando']) ?></dd></div>
          <?php endif; ?>
          <?php if ($f['quanto'] !== ''): ?>
            <div><dt>Quanto</dt><dd><?= h($f['quanto']) ?></dd></div>
          <?php endif; ?>
          <?php if ($f['afetados'] !== ''): ?>
            <div><dt>Afetados</dt><dd><?= h($f['afetados']) ?></dd></div>
          <?php endif; ?>
          <div class="ficha-funcoes">
            <dt>Fonte<?= $f['fonteData'] !== '' ? ' · ' . h($f['fonteData']) : '' ?></dt>
            <dd><a href="<?= h($f['fonteUrl']) ?>" target="_blank" rel="noopener noreferrer"><?= h($f['fonteUrl']) ?></a></dd>
          </div>
          <?php if ($f['segundaFonte'] !== ''): ?>
            <div class="ficha-funcoes">
              <dt>Segunda fonte</dt>
              <dd><a href="<?= h($f['segundaFonte']) ?>" target="_blank" rel="noopener noreferrer"><?= h($f['segundaFonte']) ?></a></dd>
            </div>
          <?php endif; ?>
        </dl>

        <?php if ($f['desdobramento']): ?>
          <p class="dica">Fora da janela de 48h, marcado como desdobramento novo de algo mais antigo.</p>
        <?php endif; ?>

        <details class="decidir">
          <summary class="btn btn-ouro">Checar este fato</summary>
          <div class="decidir-corpo">
            <p class="dica">
              Abra o link acima. A página existe? A data confere? O número confere?
              Se a afirmação for forte, procure uma segunda fonte independente.
              <?php if (pode('aulas')): ?>
                <a href="/aulas#checagem" target="_blank">Rever a aula da Checagem</a>.
              <?php endif; ?>
            </p>

            <form method="post">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">
              <div class="acoes">
                <button type="submit" class="btn btn-ouro" name="acao" value="aprovar">
                  Confere — aprovar
                </button>
              </div>
            </form>

            <form method="post" class="decidir-recusa">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">
              <div class="campo">
                <label for="motivo-<?= h($f['id']) ?>">Não deu para confirmar. Por quê?</label>
                <input id="motivo-<?= h($f['id']) ?>" type="text" name="motivo" maxlength="300"
                       placeholder="Ex: o link não abre / o número não bate com a fonte">
              </div>
              <div class="acoes">
                <button type="submit" class="btn btn-risco" name="acao" value="pendente">
                  Deixar pendente
                </button>
              </div>
              <p class="dica">
                Pendente não é lixo: o fato fica guardado com o motivo e pode voltar
                quando sair o documento que faltava.
              </p>
            </form>
          </div>
        </details>
      </article>
    <?php endforeach; ?>
  </fieldset>

  <!-- ============ trazer um fato ============ -->
  <fieldset id="trazer">
    <legend>Trazer um fato</legend>
    <p class="dica">
      Sem opinião — só o fato, com quem é o responsável e o link que prova.
      Duas varreduras por dia: de manhã e no fim da tarde.
    </p>

    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="enviar">

      <div class="campo">
        <label for="oQue">O quê <span class="dica">— uma frase objetiva do que aconteceu</span></label>
        <input id="oQue" type="text" name="oQue" maxlength="300" required value="<?= $v('oQue') ?>">
      </div>

      <div class="campo">
        <label for="quem">Quem <span class="dica">— o órgão ou gestor responsável, de forma institucional</span></label>
        <input id="quem" type="text" name="quem" maxlength="160" required value="<?= $v('quem') ?>">
      </div>

      <div class="linha g2">
        <div class="campo">
          <label for="quando">Quando aconteceu</label>
          <input id="quando" type="date" name="quando" value="<?= $v('quando') ?>">
        </div>
        <div class="campo">
          <label for="quanto">Quanto <span class="dica">— número, valor, quantidade</span></label>
          <input id="quanto" type="text" name="quanto" maxlength="120" value="<?= $v('quanto') ?>">
        </div>
      </div>

      <div class="campo">
        <label for="afetados">Afetados <span class="dica">— quem sente na pele: bairro, categoria, cidade</span></label>
        <input id="afetados" type="text" name="afetados" maxlength="200" value="<?= $v('afetados') ?>">
      </div>

      <div class="campo">
        <label for="fonteUrl">Link da fonte primária</label>
        <input id="fonteUrl" type="url" name="fonteUrl" maxlength="500" inputmode="url" required
               placeholder="https://…" value="<?= $v('fonteUrl') ?>">
      </div>

      <div class="linha g2">
        <div class="campo">
          <label for="fonteData">Data da publicação</label>
          <input id="fonteData" type="date" name="fonteData" required value="<?= $v('fonteData') ?>">
        </div>
        <div class="campo">
          <label for="categoria">Categoria</label>
          <select id="categoria" name="categoria">
            <?php foreach (CATEGORIAS as $chave => $nome): ?>
              <option value="<?= h($chave) ?>" <?= ($rascunho['categoria'] ?? '') === $chave ? 'selected' : '' ?>>
                <?= h($nome) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="campo">
        <label for="segundaFonte">Segunda fonte <span class="dica">— opcional, mas obrigatória se a afirmação for forte</span></label>
        <input id="segundaFonte" type="url" name="segundaFonte" maxlength="500" inputmode="url"
               placeholder="https://…" value="<?= $v('segundaFonte') ?>">
      </div>

      <label class="check">
        <input type="checkbox" name="desdobramento" value="1" <?= !empty($rascunho['desdobramento']) ? 'checked' : '' ?>>
        É desdobramento novo de algo mais antigo
      </label>
      <p class="dica">
        Só entra fato das últimas <?= JANELA_HORAS ?>h. Marque acima se a publicação
        for mais antiga por ser um desdobramento — é a única exceção à janela.
      </p>

      <div class="acoes">
        <button type="submit" class="btn btn-ouro">Enviar para a Checagem</button>
      </div>
    </form>
  </fieldset>

  <!-- ============ o que já foi decidido ============ -->
  <fieldset>
    <legend>Checados, prontos para roteiro (<?= count($checados) ?>)</legend>
    <?php if ($checados === []): ?>
      <p class="dica" style="margin:0">Nenhum fato aprovado ainda.</p>
    <?php else: ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Responsável</th><th>Checado por</th></tr></thead>
          <tbody>
            <?php foreach ($checados as $f): ?>
              <tr>
                <td>
                  <strong><?= h($f['oQue']) ?></strong><br>
                  <a href="<?= h($f['fonteUrl']) ?>" target="_blank" rel="noopener noreferrer">fonte</a>
                </td>
                <td><?= h($f['quem']) ?></td>
                <td><?= h($f['checadoPor']) ?><br><span class="dica"><?= h($quando($f['checadoEm'])) ?></span></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset>
    <legend>Pendentes (<?= count($pendentes) ?>)</legend>
    <p class="dica">Não confirmaram hoje. Ficam guardados — pode virar pauta quando sair o documento.</p>
    <?php if ($pendentes !== []): ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Por que ficou pendente</th></tr></thead>
          <tbody>
            <?php foreach ($pendentes as $f): ?>
              <tr>
                <td><strong><?= h($f['oQue']) ?></strong></td>
                <td><?= h($f['motivo']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>
</div>
<?php
fechar_pagina();
