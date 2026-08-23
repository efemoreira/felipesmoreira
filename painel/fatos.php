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

/**
 * Os campos que a Ficha de Fato pergunta, já limpos.
 *
 * Um lugar só para trazer e para corrigir: duas cópias divergiriam no dia em
 * que um campo novo entrasse só numa delas, e o defeito apareceria como "some
 * quando eu corrijo".
 */
function campos_do_fato(): array
{
    return [
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
}

/**
 * Quem pode mexer numa ficha: o autor, ou um admin.
 *
 * Não é a Checagem: corrigir o texto de um fato é acertar o que foi trazido, e
 * quem trouxe é quem sabe o que quis dizer. Admin entra porque fato sem autor
 * (importado, ou de conta apagada) precisaria ficar errado para sempre.
 */
function posso_mexer(array $fato, array $eu): bool
{
    return e_admin() || ($fato['autorId'] !== '' && $fato['autorId'] === $eu['id']);
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
        $campos = campos_do_fato();

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

    /* ---------- corrigir a ficha (autor ou admin) ---------- */
    if ($acao === 'editar') {
        $alvo = achar_fato(limpar_texto($_POST['id'] ?? '', 40));

        if ($alvo === null) {
            avisar('erro', 'Fato não encontrado.');
            voltar('fila');
        }
        /* Só se corrige o que ainda não foi decidido. Depois da Checagem a ficha
           é o registro do que ela viu: mudar o texto por baixo transformaria uma
           decisão tomada em carimbo sobre outra coisa — e é dessa ficha que o
           card do quadro carrega fonte e responsável. */
        if ($alvo['status'] !== 'a-checar') {
            avisar('erro', 'Esse fato já foi decidido. A ficha decidida é o registro do que a Checagem viu — corrigi-la por baixo mudaria a decisão sem que ninguém soubesse.');
            voltar('fila');
        }
        if (!posso_mexer($alvo, $eu)) {
            avisar('erro', 'Quem corrige a ficha é quem trouxe o fato. Se estiver errada, avise quem enviou.');
            voltar('fila');
        }

        $campos = campos_do_fato();

        if ($campos['oQue'] === '') {
            avisar('erro', 'Escreva em uma frase o que aconteceu.');
            voltar('fila');
        }
        if ($campos['quem'] === '') {
            avisar('erro', 'Diga quem é o responsável — o órgão ou o gestor, de forma institucional.');
            voltar('fila');
        }
        if (!fonte_valida($campos['fonteUrl'])) {
            avisar('erro', 'Cole o link da fonte primária. Print não é fonte, e sem link a Checagem não tem o que abrir.');
            voltar('fila');
        }
        /* A janela de 48h é pergunta de ENTRADA, e só se refaz quando a resposta
           muda: corrigir a frase de um fato que chegou ontem não pode ser
           recusado porque ontem já passou de 48h da publicação. Trocar a data,
           sim — aí a pergunta é outra e vale a pena refazê-la. */
        if ($campos['fonteData'] !== $alvo['fonteData']
            && !dentro_da_janela($campos['fonteData']) && !$campos['desdobramento']) {
            avisar('erro', 'Essa data está fora da janela de 48h. Se for um desdobramento novo de algo mais antigo, marque a caixa que diz isso.');
            voltar('fila');
        }

        $fatos = ler_fatos();
        foreach ($fatos as &$f) {
            if ($f['id'] === $alvo['id']) {
                $f = $campos + $f;   // o que a tela pergunta ganha; id, autor e datas ficam
            }
        }
        unset($f);

        if (!gravar_fatos($fatos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar('fila');
        }
        avisar('ok', 'Ficha corrigida. Ela continua na fila da Checagem.');
        voltar('fila');
    }

    /* ---------- apagar a ficha (autor ou admin) ---------- */
    if ($acao === 'apagar') {
        $alvo = achar_fato(limpar_texto($_POST['id'] ?? '', 40));

        if ($alvo === null) {
            avisar('erro', 'Fato não encontrado.');
            voltar('fila');
        }
        /* Fato decidido NÃO se apaga, nem por admin. É ele que responde "o que
           foi feito com aquele fato" — e o card do quadro aponta para este id.
           Apagá-lo deixaria peça publicada sem a ficha que a justifica, que é
           exatamente a situação que a Checagem existe para não permitir.
           O que se apaga é o engano da fila: o duplicado, o link colado errado. */
        if ($alvo['status'] !== 'a-checar') {
            avisar('erro', 'Fato já decidido não se apaga: é ele que responde “o que foi feito com aquele fato”, e as peças do quadro apontam para ele. Para encerrar sem virar peça, arquive com o motivo.');
            voltar('fila');
        }
        if (!posso_mexer($alvo, $eu)) {
            avisar('erro', 'Quem apaga a ficha é quem trouxe o fato. Se ela não deveria estar aí, avise quem enviou.');
            voltar('fila');
        }

        $fatos = array_values(array_filter(ler_fatos(), fn ($f) => $f['id'] !== $alvo['id']));
        if (!gravar_fatos($fatos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar('fila');
        }
        avisar('ok', 'Ficha apagada da fila.');
        voltar('fila');
    }

    /* ---------- a Checagem decide ---------- */
    if ($acao === 'aprovar' || $acao === 'pendente' || $acao === 'arquivar') {
        $alvo = achar_fato(limpar_texto($_POST['id'] ?? '', 40));

        if ($alvo === null) {
            avisar('erro', 'Fato não encontrado.');
            voltar('fila');
        }
        if ($alvo['status'] !== 'a-checar') {
            avisar('erro', 'Esse fato já foi decidido.');
            voltar('fila');
        }

        /* QUEM TRAZ O FATO NÃO CHECA O FATO.
           Checagem que o próprio autor faz não é checagem — é a mesma pessoa
           conferindo a si mesma, e o passo inteiro vira carimbo. O dado para
           aplicar isto já estava gravado (`autorId`) desde sempre.
           O admin destrava, mas caro: precisa escrever o porquê, e o porquê
           fica na ficha. É o mesmo desenho da regra do ledger na Produção. */
        $destrava = limpar_texto($_POST['destrava'] ?? '', 300);
        if ($alvo['autorId'] !== '' && $alvo['autorId'] === $eu['id']) {
            if (!e_admin()) {
                avisar('erro', 'Você trouxe este fato — quem checa é outra pessoa. Ele fica na fila até alguém do time abrir.');
                voltar('fila');
            }
            if ($destrava === '') {
                avisar('erro', 'Para checar o próprio fato, escreva por que não deu para outra pessoa checar. Fica anotado na ficha.');
                voltar('fila');
            }
        } else {
            $destrava = '';  // só vale quando a regra foi de fato contornada
        }

        $motivo = limpar_texto($_POST['motivo'] ?? '', 300);
        if ($acao === 'pendente' && $motivo === '') {
            avisar('erro', 'Diga por que ficou pendente — sem o motivo anotado ninguém sabe o que faltou para destravar depois.');
            voltar('fila');
        }
        if ($acao === 'arquivar' && $motivo === '') {
            avisar('erro', 'Diga por que o fato não vira peça — é isso que responde “o que foi feito com ele” daqui a um mês.');
            voltar('fila');
        }

        /* Aprovar abre no quadro as saídas que a Checagem marcou. É esta ligação
           que faz a ferramenta valer a pena: quem produz recebe o fato com
           fonte e responsável colados, em vez de um link copiado à mão para o
           Trello.

           NENHUMA saída é obrigatória e nenhuma é exclusiva: o mesmo fato pode
           virar roteiro e arte, só um vídeo, ou nada — e "nada" é uma resposta
           legítima, que fica registrada. Antes, aprovar criava sempre um card
           de roteiro, então o quadro enchia de card que ninguém ia escrever.

           Os cards entram primeiro: se falharem, o fato continua na fila e a
           Checagem tenta de novo. O contrário deixaria fato aprovado sem
           ninguém para escrever, que é pior de perceber. */
        $cardId = '';
        if ($acao === 'aprovar') {
            $saidas = array_values(array_intersect(
                array_keys(ETAPAS),
                array_map('strval', (array) ($_POST['saida'] ?? []))
            ));

            if ($saidas !== []) {
                $cards = ler_cards();
                foreach ($saidas as $etapa) {
                    $card = card_do_fato($alvo, $eu, $etapa);
                    $cards[] = $card;
                    if ($cardId === '') {
                        $cardId = $card['id'];  // o primeiro, só para o atalho da ficha
                    }
                }
                if (!gravar_cards($cards)) {
                    avisar('erro', 'Não consegui abrir os cards no quadro de Produção. O fato segue na fila — tente de novo.');
                    voltar('fila');
                }
            }
        }

        $fatos = ler_fatos();
        foreach ($fatos as &$f) {
            if ($f['id'] === $alvo['id']) {
                $f['status']     = $acao === 'aprovar' ? 'ok-checado' : ($acao === 'arquivar' ? 'arquivado' : 'pendente');
                $f['motivo']     = $acao === 'aprovar' ? '' : $motivo;
                $f['checadoPor'] = $eu['nome'];
                $f['checadoEm']  = date('c');
                $f['cardId']     = $cardId;
                $f['destravaMotivo'] = $destrava;
            }
        }
        unset($f);

        if (!gravar_fatos($fatos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar('fila');
        }

        if ($acao === 'aprovar') {
            avisar('ok', $cardId === ''
                ? 'Fato aprovado, sem abrir peça. Ele fica na lista dos checados esperando alguém decidir o que fazer com ele.'
                : 'Fato aprovado — as peças já estão em “A fazer” na Produção.');
        } elseif ($acao === 'arquivar') {
            avisar('ok', 'Fato arquivado com o motivo. Ele sai da fila e o rastro fica.');
        } else {
            avisar('ok', 'Fato marcado como pendente. Ele fica guardado com o motivo.');
        }
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

/* O que foi digitado antes do erro: `formulario_fato()` o recebe e devolve o
   formulário preenchido, em vez de mandar a pessoa redigitar tudo. */
$rascunho = $_SESSION['rascunho_fato'] ?? [];
unset($_SESSION['rascunho_fato']);

/* A busca recorta ANTES do corte de 15: filtrar depois procuraria só dentro do
   que coube na tela, e o fato que se está procurando é justamente o que ficou
   de fora. */
$buscaFa = limpar_texto($_GET['q'] ?? '', 60);
$catF = (string) ($_GET['cat'] ?? '');
if (!isset(CATEGORIAS[$catF])) {
    $catF = '';
}
$recorteFa = fn (array $f) => combina_com(
    [$f['oQue'], $f['quem'], $f['quanto'], $f['afetados'], $f['fonteUrl'],
     $f['autorNome'], $f['checadoPor'], $f['motivo']],
    $buscaFa
) && ($catF === '' || $f['categoria'] === $catF);
$peneirar = fn (array $lista) => array_values(array_filter($lista, $recorteFa));

$porCategoria = [];
foreach (ler_fatos() as $f) {
    $porCategoria[$f['categoria']] = ($porCategoria[$f['categoria']] ?? 0) + 1;
}

/* Qual ficha está aberta para correção. É um GET (`?editar=<id>`), e não estado
   de JavaScript: sem JS a página recarrega com o `<dialog open>` e o formulário
   continua ali — o mesmo desenho dos outros modais do painel. */
$corrigindo = achar_fato(limpar_texto($_GET['editar'] ?? '', 40));
if ($corrigindo !== null && ($corrigindo['status'] !== 'a-checar' || !posso_mexer($corrigindo, $eu))) {
    $corrigindo = null;   // a trava do POST desenhada na tela: formulário que vai ser recusado não se mostra
}

$fila      = $peneirar(fatos_com_status('a-checar'));
$checados  = array_slice($peneirar(array_reverse(fatos_com_status('ok-checado'))), 0, 15);
$pendentes = array_slice($peneirar(array_reverse(fatos_com_status('pendente'))), 0, 15);
$arquivados = array_slice($peneirar(array_reverse(fatos_com_status('arquivado'))), 0, 15);
$quantosFatos = count(ler_fatos());

$quando = function (string $iso): string {
    $t = strtotime($iso);
    return $t ? date('d/m \à\s H:i', $t) : '';
};


/**
 * A Ficha de Fato — um formulário só, desenhado em dois lugares.
 *
 * Trazer e corrigir perguntam exatamente a mesma coisa. Duas cópias
 * divergiriam no dia em que um campo novo entrasse só numa delas, e o defeito
 * apareceria como "some quando eu corrijo".
 *
 * Os ids levam sufixo na correção porque os dois formulários coexistem no
 * documento: id repetido faz o `<label for>` apontar para o campo errado, e no
 * celular o toque no rótulo foca o outro formulário.
 */
function formulario_fato(?array $f, array $rascunho = []): void
{
    $e = $f !== null ? '-e' : '';
    /* Corrigindo, o valor vem da ficha; trazendo, do rascunho que sobrou do
       erro anterior — é o que faz o formulário voltar preenchido. */
    $v = fn (string $campo) => h((string) ($f[$campo] ?? $rascunho[$campo] ?? ''));
    $cat = (string) ($f['categoria'] ?? $rascunho['categoria'] ?? 'outro');
    $desd = !empty($f['desdobramento']) || !empty($rascunho['desdobramento']);
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="<?= $f !== null ? 'editar' : 'enviar' ?>">
      <?php if ($f !== null): ?>
        <input type="hidden" name="id" value="<?= h($f['id']) ?>">
      <?php endif; ?>

      <div class="campo">
        <label for="oQue<?= $e ?>">O quê <span class="dica">— uma frase objetiva do que aconteceu</span></label>
        <input id="oQue<?= $e ?>" type="text" name="oQue" maxlength="300" required value="<?= $v('oQue') ?>">
      </div>

      <div class="campo">
        <label for="quem<?= $e ?>">Quem <span class="dica">— o órgão ou gestor responsável, de forma institucional</span></label>
        <input id="quem<?= $e ?>" type="text" name="quem" maxlength="160" required value="<?= $v('quem') ?>">
      </div>

      <div class="linha g2">
        <div class="campo">
          <label for="quando<?= $e ?>">Quando aconteceu</label>
          <input id="quando<?= $e ?>" type="date" name="quando" value="<?= $v('quando') ?>">
        </div>
        <div class="campo">
          <label for="quanto<?= $e ?>">Quanto <span class="dica">— número, valor, quantidade</span></label>
          <input id="quanto<?= $e ?>" type="text" name="quanto" maxlength="120" value="<?= $v('quanto') ?>">
        </div>
      </div>

      <div class="campo">
        <label for="afetados<?= $e ?>">Afetados <span class="dica">— quem sente na pele: bairro, categoria, cidade</span></label>
        <input id="afetados<?= $e ?>" type="text" name="afetados" maxlength="200" value="<?= $v('afetados') ?>">
      </div>

      <div class="campo">
        <label for="fonteUrl<?= $e ?>">Link da fonte primária</label>
        <input id="fonteUrl<?= $e ?>" type="url" name="fonteUrl" maxlength="500" inputmode="url" required
               placeholder="https://…" value="<?= $v('fonteUrl') ?>">
      </div>

      <div class="linha g2">
        <div class="campo">
          <label for="fonteData<?= $e ?>">Data da publicação</label>
          <input id="fonteData<?= $e ?>" type="date" name="fonteData" required value="<?= $v('fonteData') ?>">
        </div>
        <div class="campo">
          <label for="categoria<?= $e ?>">Categoria</label>
          <select id="categoria<?= $e ?>" name="categoria">
            <?php foreach (CATEGORIAS as $chave => $nome): ?>
              <option value="<?= h($chave) ?>" <?= $cat === $chave ? 'selected' : '' ?>>
                <?= h($nome) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="campo">
        <label for="segundaFonte<?= $e ?>">Segunda fonte <span class="dica">— opcional, mas obrigatória se a afirmação for forte</span></label>
        <input id="segundaFonte<?= $e ?>" type="url" name="segundaFonte" maxlength="500" inputmode="url"
               placeholder="https://…" value="<?= $v('segundaFonte') ?>">
      </div>

      <label class="check">
        <input type="checkbox" name="desdobramento" value="1" <?= $desd ? 'checked' : '' ?>>
        É desdobramento novo de algo mais antigo
      </label>
      <p class="dica">
        Só entra fato das últimas <?= JANELA_HORAS ?>h. Marque acima se a publicação
        for mais antiga por ser um desdobramento — é a única exceção à janela.
      </p>

      <div class="acoes">
        <button type="submit" class="btn btn-ouro">
          <?= $f !== null ? 'Salvar a correção' : 'Enviar para a Checagem' ?>
        </button>
      </div>
    </form>
    <?php
}

abrir_pagina('Fatos do dia');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Fatos do dia',
      'O Olheiro traz o fato com a prova; a Checagem abre o link e decide. '
      . 'Nada segue para roteiro ou arte sem passar por aqui.',
      null,
      '/painel/fatos',
      [
          'Trazer um fato: só o que aconteceu, quem é o responsável e o link que prova.',
          'Checar o que chegou — mas nunca o seu próprio fato: isso é carimbo, não checagem.',
          'Ao aprovar, marque o que ele vira: roteiro, arte, vídeo, mais de um, ou nenhum.',
          'Fato que confere mas não rende peça se arquiva com o motivo, para não morrer em silêncio.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php /* O filtro só aparece quando há o que filtrar: com quatro fatos ele é
           dois controles em cima de uma lista que já cabe na tela. */ ?>
  <?php if ($quantosFatos > 6 || $buscaFa !== '' || $catF !== ''): ?>
    <?php
      $opcoesCat = [];
      foreach (CATEGORIAS as $chave => $nome) {
          if (($porCategoria[$chave] ?? 0) === 0 && $catF !== $chave) {
              continue;
          }
          $opcoesCat[$chave] = $nome . ' (' . (int) ($porCategoria[$chave] ?? 0) . ')';
      }
      barra_filtros(
          [
              ['tipo' => 'busca', 'valor' => $buscaFa, 'dica' => 'o que aconteceu, quem, fonte ou autor'],
              ['tipo' => 'escolha', 'nome' => 'cat', 'rotulo' => 'Categoria',
               'valor' => $catF, 'vazio' => 'todas', 'opcoes' => $opcoesCat],
          ],
          $buscaFa !== '' || $catF !== '',
          '/painel/fatos.php'
      );
    ?>
  <?php endif; ?>

  <!-- ============ a fila ============ -->
  <fieldset id="fila">
    <legend>Esperando checagem (<?= count($fila) ?>)</legend>

    <?php if ($fila === []): ?>
      <?php nada_encontrado($buscaFa, '/painel/fatos.php', 'Fila zerada. É esse o objetivo: nada dorme sem status.'); ?>
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
          <?php /* Três degraus, e não dois. O prazo da checagem é 2h; com só
                   "vermelho depois de 2h" o fato de 1h50 aparecia igualzinho ao
                   que acabou de chegar, e quem varre a fila não tinha como
                   saber qual pegar primeiro. */ ?>
          <?php if ($horas >= 2): ?>
            <span class="selo selo-off"><?= $horas ?>h esperando</span>
          <?php elseif ($horas >= 1): ?>
            <span class="selo selo-atencao"><?= $horas ?>h esperando</span>
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

        <?php
          /* Quem trouxe o fato não checa o fato. Para o autor comum a decisão
             nem aparece — mostrar um formulário que vai ser recusado no POST é
             pedir para a pessoa digitar à toa. Admin vê, com a justificativa
             obrigatória junto. */
          $meu = $f['autorId'] !== '' && $f['autorId'] === $eu['id'];
        ?>

        <?php /* Corrigir e apagar são de quem trouxe o fato, e só enquanto ele
                 espera decisão: quem escreveu é quem sabe o que quis dizer, e
                 depois da Checagem a ficha vira registro do que ela viu. Pelo
                 mesmo motivo do bloco acima, quem não pode nem vê os botões. */ ?>
        <?php if (posso_mexer($f, $eu)): ?>
          <div class="acoes" style="margin:0 0 12px">
            <?php botao_modal('corrigir-fato', 'Corrigir a ficha', 'editar=' . urlencode($f['id']) . '#fila', 'btn btn-mini'); ?>
            <form method="post" style="display:inline"
                  onsubmit="return confirm('Apagar esta ficha da fila? Ela não foi decidida, então nada aponta para ela — mas não tem desfazer.')">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">
              <button type="submit" class="btn btn-mini btn-risco" name="acao" value="apagar">Apagar</button>
            </form>
          </div>
        <?php endif; ?>
        <?php if ($meu && !e_admin()): ?>
          <p class="dica">
            <strong>Você trouxe este fato.</strong> Quem checa é outra pessoa — ele fica
            na fila até alguém do time abrir. Checagem que o autor faz é carimbo,
            não checagem.
          </p>
        <?php else: ?>
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

            <?php if ($meu): ?>
              <p class="msg msg-erro" style="margin:0 0 14px">
                Este fato é seu. Como administrador você consegue checar assim mesmo, mas
                escreva por que não deu para outra pessoa — fica anotado na ficha.
              </p>
            <?php endif; ?>

            <form method="post">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">

              <fieldset class="saidas">
                <legend>O que este fato vira?</legend>
                <p class="dica" style="margin:0 0 10px">
                  Marque o que faz sentido — pode ser mais de um, e pode ser nenhum.
                  Fato aprovado sem peça fica esperando decisão, e aparece no hub
                  depois de 48h.
                </p>
                <?php foreach (ETAPAS as $chave => $nome): ?>
                  <label class="check">
                    <input type="checkbox" name="saida[]" value="<?= h($chave) ?>"
                           <?= $chave === 'roteiro' ? 'checked' : '' ?>>
                    <?= h($nome) ?>
                  </label>
                <?php endforeach; ?>
              </fieldset>

              <?php if ($meu): ?>
                <div class="campo">
                  <label for="destrava-<?= h($f['id']) ?>">Por que você mesmo está checando?</label>
                  <input id="destrava-<?= h($f['id']) ?>" type="text" name="destrava" maxlength="300" required
                         placeholder="Ex: fato urgente, ninguém da Checagem disponível hoje">
                </div>
              <?php endif; ?>

              <div class="acoes">
                <button type="submit" class="btn btn-ouro" name="acao" value="aprovar">
                  Confere — aprovar
                </button>
              </div>
            </form>

            <form method="post" class="decidir-recusa">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">
              <?php if ($meu): ?>
                <input type="hidden" name="destrava" value="Arquivado/recusado pelo próprio autor.">
              <?php endif; ?>
              <div class="campo">
                <label for="motivo-<?= h($f['id']) ?>">Não deu para confirmar, ou não vira peça. Por quê?</label>
                <input id="motivo-<?= h($f['id']) ?>" type="text" name="motivo" maxlength="300"
                       placeholder="Ex: o link não abre / o número não bate com a fonte">
              </div>
              <div class="acoes">
                <button type="submit" class="btn btn-risco" name="acao" value="pendente">
                  Deixar pendente
                </button>
                <button type="submit" class="btn" name="acao" value="arquivar">
                  Arquivar sem virar peça
                </button>
              </div>
              <p class="dica">
                <strong>Pendente</strong> é o que falta prova: fica guardado com o motivo e
                pode voltar quando sair o documento.
                <strong>Arquivar</strong> é o fato que confere mas não rende peça — encerra
                o assunto e deixa o rastro de que foi decidido, não esquecido.
              </p>
            </form>
          </div>
        </details>
        <?php endif; ?>
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

    <?php formulario_fato(null, $rascunho); ?>
  </fieldset>

  <!-- ============ o que já foi decidido ============ -->
  <fieldset id="checados">
    <legend>Checados (<?= count($checados) ?>)</legend>
    <p class="dica">
      O que cada fato virou. <strong>Sem peça</strong> não é erro — é decisão que
      ainda não foi tomada, e depois de 48h ela aparece no hub como pendência.
    </p>
    <?php if ($checados === []): ?>
      <p class="dica" style="margin:0">Nenhum fato aprovado ainda.</p>
    <?php else: ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Virou</th><th>Checado por</th></tr></thead>
          <tbody>
            <?php foreach ($checados as $f): ?>
              <?php $saidas = saidas_do_fato($f['id']); ?>
              <tr>
                <td>
                  <strong><?= h($f['oQue']) ?></strong><br>
                  <span class="dica"><?= h($f['quem']) ?></span> ·
                  <a href="<?= h($f['fonteUrl']) ?>" target="_blank" rel="noopener noreferrer">fonte</a>
                </td>
                <td>
                  <?php if ($saidas === []): ?>
                    <span class="selo selo-off">sem peça</span>
                  <?php else: ?>
                    <?php foreach ($saidas as $c): ?>
                      <?php /* Publicado é ouro CHEIO: é o único estado que não
                               se desfaz, e a peça no ar é a resposta final da
                               pergunta "o que foi feito com aquele fato". */ ?>
                      <span class="selo <?= $c['coluna'] === 'publicado' ? 'selo-publicado' : 'selo-cinza' ?>">
                        <?= h(ETAPAS[$c['etapa']] ?? $c['etapa']) ?>
                        · <?= h(COLUNAS[$c['coluna']] ?? $c['coluna']) ?>
                      </span>
                      <?php if ($c['linkPost'] !== ''): ?>
                        <a href="<?= h($c['linkPost']) ?>" target="_blank" rel="noopener noreferrer">post</a>
                      <?php endif; ?>
                      <br>
                    <?php endforeach; ?>
                  <?php endif; ?>
                </td>
                <td>
                  <?= h($f['checadoPor']) ?><br>
                  <span class="dica"><?= h($quando($f['checadoEm'])) ?></span>
                  <?php if ($f['destravaMotivo'] !== ''): ?>
                    <br><span class="selo selo-off">checou o próprio fato</span>
                    <br><span class="dica"><?= h($f['destravaMotivo']) ?></span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset>
    <legend>Arquivados (<?= count($arquivados) ?>)</legend>
    <p class="dica">
      Conferem, mas não renderam peça. Ficam aqui para a pergunta “o que foi feito
      com aquele fato” ter resposta — decidido, não esquecido.
    </p>
    <?php if ($arquivados !== []): ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Por que não virou peça</th></tr></thead>
          <tbody>
            <?php foreach ($arquivados as $f): ?>
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

  <?php /* O modal fica no fim do documento, e não dentro do <fieldset> nem da
           tabela: <dialog> aninhado ali é HTML inválido, e o navegador
           reorganiza a árvore sozinho — o formulário some sem erro no console. */ ?>
  <?php if ($corrigindo !== null): ?>
    <?php abrir_modal('corrigir-fato', 'Corrigir a ficha', true); ?>
      <p class="dica" style="margin:0 0 14px">
        Ela continua na fila depois de salvar — corrigir não é decidir.
      </p>
      <?php formulario_fato($corrigindo); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
fechar_pagina();
