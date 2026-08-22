<?php
declare(strict_types=1);

/**
 * Encontros — felipesmoreira.com/painel/eventos
 *
 * Duas telas: a lista dos encontros e, com ?e=<id>, o encontro aberto — as
 * cinco peças com seus checklists, a lista de presença e o funil.
 *
 * A permissão é dividida por natureza da ação, não por cargo:
 *   quem tem 'eventos' executa (marca checklist, confirma presença, cadastra
 *   quem chegou);
 *   quem tem 'agenda' decide (cria, cancela) e vê a lista inteira com telefone.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/eventos-comum.php';
require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao(), para rotular quem é do time
exigir_area('eventos');

$eu = usuario_atual();
$coordena = pode('agenda');

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $eventoId = '', string $ancora = ''): void
{
    $url = '/painel/eventos.php' . ($eventoId !== '' ? '?e=' . urlencode($eventoId) : '');
    header('Location: ' . $url . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
}

/** Barra quem não coordena antes de qualquer ação de decisão. */
function exigir_coordenacao(bool $coordena, string $eventoId = ''): void
{
    if (!$coordena) {
        avisar('erro', 'Só a coordenação decide sobre encontro. Você pode executar e cadastrar presença.');
        voltar($eventoId);
    }
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

    /* ---------- criar o encontro (coordenação) ---------- */
    if ($acao === 'criar') {
        exigir_coordenacao($coordena);

        $titulo  = limpar_texto($_POST['titulo'] ?? '', 120);
        $familia = limpar_texto($_POST['familia'] ?? '', 20);
        $inicio  = inicio_de_dia_e_hora($_POST['dia'] ?? '', $_POST['hora'] ?? '');

        if ($titulo === '') {
            avisar('erro', 'Dê um nome ao encontro.');
            voltar();
        }
        if (!isset(FAMILIAS[$familia])) {
            avisar('erro', 'Escolha a família do evento — é ela que traz o playbook e as travas.');
            voltar();
        }
        /* Dois campos na tela, UM instante no arquivo. A pessoa pensa "sábado,
           9 da manhã"; o arquivo guarda o momento com o fuso do Ceará junto, que
           é o que faz ordenar, saber o que já passou e acender o "ao vivo" na
           hora certa. Antes eram dois textos livres — "29/07" sem ano e "19H" —
           e nada disso era possível. A hora pode ficar em branco: o dia já
           ordena, e o cartão simplesmente não mostra horário. */
        if ($inicio === '') {
            avisar('erro', 'Informe pelo menos o dia do encontro.');
            voltar();
        }

        /* A imagem é opcional. Falha de upload não derruba a criação do
           encontro: avisa e segue sem imagem — perder o encontro inteiro porque
           a foto era pesada demais seria trocar o essencial pelo enfeite. */
        $imagemNova = '';
        if (($env = arquivo_simples('imagem')) !== null) {
            $r = guardar_upload($env);
            if ($r['ok']) {
                $imagemNova = $r['caminho'];
            } elseif ($r['erro'] !== '') {
                avisar('erro', $r['erro'] . ' O encontro foi criado sem imagem.');
            }
        }

        $eventos = ler_eventos();
        $novo = [
            'id'      => novo_id_evento(),
            'titulo'  => $titulo,
            'familia' => $familia,
            'inicio'  => $inicio,
            'local'   => limpar_texto($_POST['local'] ?? '', 120),
            'endereco' => limpar_texto($_POST['endereco'] ?? '', 200),
            'publicoEsperado' => (int) ($_POST['publicoEsperado'] ?? 0),
            'naAgenda' => !empty($_POST['naAgenda']),
            'imagem'   => $imagemNova,
            'token'   => bin2hex(random_bytes(10)),
            'tokenConfirmacao' => bin2hex(random_bytes(10)),
            'status'  => 'planejado',
            'criadoEm'  => date('c'),
            'criadoPor' => $eu['nome'],
        ];
        $eventos[] = $novo;

        if (!gravar_eventos($eventos)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar();
        }
        republicar_agenda();
        avisar('ok', 'Encontro criado. Agora escale as cinco peças.');
        voltar($novo['id']);
    }

    /* ---------- daqui para baixo tudo é sobre um encontro ---------- */
    $alvo = achar_evento(limpar_texto($_POST['id'] ?? '', 40));
    if ($alvo === null) {
        avisar('erro', 'Encontro não encontrado.');
        voltar();
    }

    /* ---------- editar e mudar status (coordenação) ---------- */
    if ($acao === 'salvar' || $acao === 'status') {
        exigir_coordenacao($coordena, $alvo['id']);

        $eventos = ler_eventos();
        foreach ($eventos as &$e) {
            if ($e['id'] !== $alvo['id']) {
                continue;
            }
            if ($acao === 'status') {
                $novoStatus = limpar_texto($_POST['status'] ?? '', 20);
                if (isset(STATUS_EVENTO[$novoStatus])) {
                    $e['status'] = $novoStatus;
                }
            } else {
                $e['titulo']   = limpar_texto($_POST['titulo'] ?? $e['titulo'], 120);
                $e['inicio']   = inicio_de_dia_e_hora($_POST['dia'] ?? '', $_POST['hora'] ?? '');
                $e['local']    = limpar_texto($_POST['local'] ?? '', 120);
                $e['endereco'] = limpar_texto($_POST['endereco'] ?? '', 200);
                $e['publicoEsperado'] = (int) ($_POST['publicoEsperado'] ?? 0);
                $e['orcamento']   = limpar_texto($_POST['orcamento'] ?? '', 60);
                $e['observacoes'] = limpar_texto($_POST['observacoes'] ?? '', 600);
                /* o que o site mostra */
                $e['naAgenda']   = !empty($_POST['naAgenda']);
                $e['subtitulo']  = limpar_texto($_POST['subtitulo'] ?? '', 120);
                $e['cor']        = (string) ($_POST['cor'] ?? 'ouro');
                $e['plataforma'] = (string) ($_POST['plataforma'] ?? '');
                $e['aoVivo']     = !empty($_POST['aoVivo']);
                $e['link']       = limpar_link($_POST['link'] ?? '');

                /* imagem: upload novo > pedido de remoção > o que já estava lá */
                if (($env = arquivo_simples('imagem')) !== null) {
                    $r = guardar_upload($env);
                    if ($r['ok']) {
                        apagar_imagem($e['imagem']);  // a que estava no lugar não serve mais
                        $e['imagem'] = $r['caminho'];
                    } elseif ($r['erro'] !== '') {
                        avisar('erro', $r['erro'] . ' O resto foi salvo.');
                    }
                } elseif (!empty($_POST['tirarImagem'])) {
                    apagar_imagem($e['imagem']);
                    $e['imagem'] = '';
                }
                foreach (array_keys(PECAS) as $peca) {
                    $e['responsaveis'][$peca] = limpar_texto($_POST['resp'][$peca] ?? '', 40);
                }
            }
        }
        unset($e);

        if (!gravar_eventos($eventos)) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        /* Regrava o agenda.json na hora, e não por um botão "publicar": editar o
           encontro já exige coordenação, então não há revisão a mais para fazer
           — e "esqueci de publicar" deixa de ser um jeito de o site ficar
           desatualizado sem ninguém perceber. */
        republicar_agenda();
        voltar($alvo['id']);
    }

    /* ---------- marcar item do checklist (qualquer um da área) ---------- */
    if ($acao === 'marcar') {
        $peca  = limpar_texto($_POST['peca'] ?? '', 20);
        $item  = (int) ($_POST['item'] ?? -1);
        $lista = checklist(PECAS[$peca]['checklist'] ?? '');

        if (!isset(PECAS[$peca]) || $lista === null || $item < 0 || $item >= count($lista['itens'])) {
            avisar('erro', 'Item de checklist desconhecido.');
            voltar($alvo['id']);
        }

        $eventos = ler_eventos();
        foreach ($eventos as &$e) {
            if ($e['id'] === $alvo['id']) {
                $marcados = $e['feitos'][$peca] ?? [];
                $e['feitos'][$peca] = in_array($item, $marcados, true)
                    ? array_values(array_diff($marcados, [$item]))
                    : array_merge($marcados, [$item]);
            }
        }
        unset($e);

        if (!gravar_eventos($eventos)) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar($alvo['id'], 'peca-' . $peca);
    }

    /* ---------- cadastrar quem vem ou quem chegou ---------- */
    /* ---------- escalar o time (quem já tem conta) ---------- */
    if ($acao === 'add-time') {
        $ids = array_map('strval', (array) ($_POST['usuario'] ?? []));
        if ($ids === []) {
            avisar('erro', 'Marque quem do time vai estar nesse encontro.');
            voltar($alvo['id'], 'pessoas');
        }

        $presencas = ler_presencas();
        $quantos = 0;
        foreach (pessoas_fora_do_evento($alvo['id']) as $u) {
            if (!in_array($u['id'], $ids, true)) {
                continue;
            }
            $presencas[] = [
                'id'       => novo_id_presenca(),
                'eventoId' => $alvo['id'],
                'pessoaId' => $u['id'],
                'confirmou'  => true,
                'compareceu' => false,   // marca-se quando o encontro acontece
                'origem'     => 'painel',
                'criadoPorId' => $eu['id'],
                'criadoEm'    => date('c'),
            ];
            $quantos++;
        }

        if ($quantos === 0) {
            avisar('erro', 'Ninguém novo para escalar.');
            voltar($alvo['id'], 'pessoas');
        }
        if (!gravar_presencas($presencas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar($alvo['id'], 'pessoas');
        }
        avisar('ok', $quantos . ($quantos === 1 ? ' pessoa escalada.' : ' pessoas escaladas.')
            . ' Marque “compareceu” no dia — é isso que faz a conta do encontro fechar.');
        voltar($alvo['id'], 'pessoas');
    }

    if ($acao === 'add-pessoa') {
        $nome     = limpar_texto($_POST['nome'] ?? '', 80);
        $telefone = so_digitos($_POST['telefone'] ?? '');

        if ($nome === '') {
            avisar('erro', 'Diga o nome da pessoa.');
            voltar($alvo['id'], 'pessoas');
        }
        if ($telefone !== '' && (strlen($telefone) < 10 || strlen($telefone) > 11)) {
            avisar('erro', 'Confira o WhatsApp: use DDD + número.');
            voltar($alvo['id'], 'pessoas');
        }
        /* Já conhecemos este número? Então NÃO se cria outra pessoa — entra
           uma presença apontando para quem já existe. Antes cada encontro
           guardava uma cópia da pessoa, e quem veio a cinco tinha cinco fichas
           com o nome escrito de jeitos diferentes. */
        $jaExiste = $telefone !== '' ? (pessoas_por_telefone($telefone)[0] ?? null) : null;

        if ($jaExiste !== null && presenca_de($alvo['id'], $jaExiste['id']) !== null) {
            avisar('erro', 'Essa pessoa já está na lista deste encontro.');
            voltar($alvo['id'], 'pessoas');
        }

        $pessoaId = $jaExiste['id'] ?? '';
        if ($jaExiste === null) {
            $pessoas = ler_pessoas();
            $nova = [
                'id'       => novo_id_pessoa(),
                'nome'     => $nome,
                'tipo'     => limpar_texto($_POST['tipo'] ?? 'eleitor', 20),
                'telefone' => $telefone,
                'bairro'   => limpar_texto($_POST['bairro'] ?? '', 60),
                'cidade'   => limpar_texto($_POST['cidade'] ?? '', 60),
                'criadoEm' => date('c'),
                /* Quem digita aqui é da Recepção, com a pessoa na frente: o
                   consentimento é verbal, mas fica registrado com versão e data
                   como o do QR. Sem isto a lista mistura ficha com e sem base
                   legal anotada, e não há como saber qual é qual depois. */
                'consentimentoEm'     => date('c'),
                'consentimentoVersao' => VERSAO_CONSENTIMENTO_PRESENCA,
            ];
            $pessoas[] = $nova;
            if (!gravar_pessoas($pessoas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id'], 'pessoas');
            }
            $pessoaId = $nova['id'];
        }

        $presencas = ler_presencas();
        $presencas[] = [
            'id'       => novo_id_presenca(),
            'eventoId' => $alvo['id'],
            'pessoaId' => $pessoaId,
            'convidadoPor' => limpar_texto($_POST['convidadoPor'] ?? '', 60),
            'confirmou'  => !empty($_POST['confirmou']),
            'compareceu' => !empty($_POST['compareceu']),
            'origem'     => 'painel',
            'criadoPorId' => $eu['id'],
            'criadoEm'    => date('c'),
        ];

        if (!gravar_presencas($presencas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar($alvo['id'], 'pessoas');
        }
        avisar('ok', $nome . ($jaExiste !== null ? ' (já cadastrada) entrou na lista.' : ' entrou na lista.'));
        voltar($alvo['id'], 'pessoas');
    }

    /* ---------- confirmar presença, classificar, andar no funil ---------- */
    if (in_array($acao, ['confirmou', 'compareceu', 'classificar', 'funil'], true)) {
        $presencaId = limpar_texto($_POST['lead'] ?? '', 40);
        $presencas  = ler_presencas();
        $achou  = false;
        /* O TIPO mudou de lugar: era `classe` na ficha do encontro, agora é da
           pessoa — ela é militante em todo lugar, não só naquele sábado. Por
           isso "classificar" grava em dois arquivos. */
        $tipoNovo = limpar_texto($_POST['tipo'] ?? '', 20);
        $pessoaDoTipo = '';

        foreach ($presencas as &$l) {
            if ($l['id'] !== $presencaId || $l['eventoId'] !== $alvo['id']) {
                continue;
            }
            $achou = true;

            if ($acao === 'confirmou') {
                $l['confirmou'] = !$l['confirmou'];
            } elseif ($acao === 'compareceu') {
                $l['compareceu'] = !$l['compareceu'];
            } elseif ($acao === 'classificar') {
                $pessoaDoTipo = $l['pessoaId'];
                $l['observacao'] = limpar_texto($_POST['observacao'] ?? '', 300);
            } else {
                // o funil é cobrança da coordenação
                if (!$coordena) {
                    avisar('erro', 'O follow-up é da coordenação.');
                    voltar($alvo['id'], 'funil');
                }
                $etapa = limpar_texto($_POST['etapa'] ?? '', 5);
                if (isset(ROTULO_FUNIL[$etapa])) {
                    $l['funil'][$etapa] = $l['funil'][$etapa] === '' ? date('c') : '';
                }
            }
        }
        unset($l);

        if (!$achou) {
            avisar('erro', 'Pessoa não encontrada neste encontro.');
            voltar($alvo['id'], 'pessoas');
        }
        if ($pessoaDoTipo !== '' && isset(TIPOS_PESSOA[$tipoNovo])) {
            $pessoas = ler_pessoas();
            foreach ($pessoas as &$p) {
                if ($p['id'] === $pessoaDoTipo) {
                    $p['tipo'] = $tipoNovo;
                }
            }
            unset($p);
            gravar_pessoas($pessoas);
        }

        if (!gravar_presencas($presencas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar($alvo['id'], $acao === 'funil' ? 'funil' : 'pessoas');
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$aberto = achar_evento(limpar_texto($_GET['e'] ?? '', 40));

$dataBonita = function (array $e): string {
    if ($e['data'] === '') {
        return 'sem data';
    }
    $t = strtotime($e['data']);
    return ($t ? date('d/m/Y', $t) : $e['data']) . ($e['hora'] !== '' ? ' às ' . $e['hora'] : '');
};

/* ---------------- lista ---------------- */
if ($aberto === null) {
    abrir_pagina('Encontros');
    ?>
    <div class="capa">
      <?php cabecalho_pagina(
          'Encontros',
          'As cinco peças de cada encontro, a lista de presença e o follow-up de quem veio.',
          null,
          '/painel/eventos',
          [
              'Cada encontro tem cinco peças com checklist — Local & Hora, Logística, Divulgação, Gravação, Recepção.',
              'O QR da mesa deixa quem chega se cadastrar sozinho, em vez de fazer fila.',
              'Quem compareceu entra no funil D+0 · D+3 · D+7: agradecer, mandar conteúdo, chamar para o próximo.',
              'Criar, cancelar e ver telefone é da coordenação; executar e receber é de quem está escalado.',
          ]
      ); ?>

      <?php recado($erro, $ok); ?>

      <?php if ($coordena): ?>
        <div class="acoes" style="margin:0 0 22px">
          <a class="btn btn-ouro" id="abrir-novo" href="?novo=1">Novo encontro</a>
        </div>
      <?php endif; ?>
      <?php /* A lista de todo mundo do movimento mudou de casa: mora em
               /painel/pessoas, que é a tela com a ficha completa — em que
               encontros cada um esteve, o que faz, o que abre no painel. Aqui
               ficaria uma segunda lista de pessoas, sempre um passo atrás da
               verdadeira. */ ?>
      <?php if (pode('pessoas')): ?>
        <p class="dica" style="margin:0 0 22px">
          Procurando alguém específico, ou querendo saber quem nunca falta?
          <a href="/painel/pessoas.php">Abra a lista de pessoas</a> — ela mostra a
          ficha completa e todos os encontros de cada um.
        </p>
      <?php endif; ?>

      <?php foreach ([['Próximos', eventos_proximos()], ['Já aconteceram', eventos_passados()]] as [$titulo, $lista]): ?>
        <fieldset>
          <legend><?= h($titulo) ?> (<?= count($lista) ?>)</legend>
          <?php if ($lista === [] && $titulo === 'Próximos'): ?>
            <p class="dica" style="margin:0 0 8px">
              Nenhum encontro marcado. O primeiro passo é <strong>Local &amp; Hora</strong>: três
              opções avaliadas (capacidade, custo, acesso, energia, som) antes de fechar qualquer
              coisa — e a reserva confirmada por escrito. Toque em <strong>Novo encontro</strong>
              lá em cima e as cinco peças aparecem prontas para dividir.
            </p>
          <?php endif; ?>
          <?php if ($lista === []): ?>
            <p class="dica" style="margin:0">Nada por aqui.</p>
          <?php endif; ?>
          <?php foreach ($lista as $e): ?>
            <?php $p = preparo_do_evento($e); $presentes = count(array_filter(presencas_do_evento($e['id']), fn ($l) => $l['compareceu'])); ?>
            <a class="area-cartao" href="?e=<?= h($e['id']) ?>">
              <span class="area-icone"><?= icone('ticket') ?></span>
              <span class="area-texto">
                <strong><?= h($e['titulo']) ?></strong>
                <span>
                  <?= h(FAMILIAS[$e['familia']]['nome']) ?> ·
                  <?= h($dataBonita($e)) ?>
                  <?= $e['local'] !== '' ? ' · ' . h($e['local']) : '' ?><br>
                  Preparo <?= $p['feito'] ?>/<?= $p['total'] ?>
                  <?= $presentes > 0 ? ' · ' . $presentes . ' presentes' : '' ?>
                  <?= $e['status'] === 'cancelado' ? ' · CANCELADO' : '' ?>
                </span>
              </span>
            </a>
          <?php endforeach; ?>
        </fieldset>
      <?php endforeach; ?>

      <?php if ($coordena): ?>
        <?php /* O formulário vivia solto no fim da página, embaixo de duas listas
                 que podem ter dezenas de encontros — criar um exigia rolar até o
                 fim, toda vez. Agora é um <dialog>.

                 O botão é um LINK de verdade para `?novo=1`, e não um botão que
                 só existe com JavaScript: sem JS a página recarrega com o modal
                 já aberto (atributo `open`) e o formulário continua ali. */ ?>
        <dialog id="novo-encontro" class="modal"<?= isset($_GET['novo']) ? ' open' : '' ?>>
          <form method="dialog" class="modal-fechar">
            <button type="submit" aria-label="Fechar">&times;</button>
          </form>
          <h2>Novo encontro</h2>
          <form method="post" enctype="multipart/form-data">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="criar">
            <div class="campo">
              <label for="titulo">Nome do encontro</label>
              <input id="titulo" type="text" name="titulo" maxlength="120" required>
            </div>
            <div class="campo">
              <label for="familia">Família</label>
              <select id="familia" name="familia" required>
                <?php foreach (FAMILIAS as $chave => $f): ?>
                  <option value="<?= h($chave) ?>"><?= h($f['nome']) ?> — <?= h($f['serve']) ?></option>
                <?php endforeach; ?>
              </select>
              <p class="dica">A família traz o playbook, as travas e o material específico.</p>
            </div>
            <div class="linha g2">
              <div class="campo">
                <label for="dia">Dia</label>
                <input id="dia" type="date" name="dia" required>
              </div>
              <div class="campo">
                <label for="hora">Hora <span class="dica">— dá para deixar em branco</span></label>
                <input id="hora" type="time" name="hora">
              </div>
            </div>
            <p class="dica">
              Horário do Ceará. É daqui que saem o dia da semana, a data e a hora que o
              site mostra — nenhum dos três se digita à parte. Sem hora, o encontro
              continua na lista pelo dia, só sem horário no cartão.
            </p>
            <div class="campo">
              <label for="img-novo">Imagem <span class="dica">— opcional</span></label>
              <input id="img-novo" type="file" name="imagem" accept="image/*">
              <p class="dica">
                JPG, PNG ou WEBP até 8 MB. Ela é reduzida e cortada no cartão; sem
                imagem, entra o fundo hachurado com a sigla do dia.
              </p>
            </div>
            <label class="check">
              <input type="checkbox" name="naAgenda" value="1" checked>
              Aparecer na programação pública
            </label>
            <p class="dica">
              Marcado, o encontro entra em <a href="/programacao" target="_blank">/programacao</a>
              assim que você salvar. Desmarque para reunião fechada, jantar com liderança
              e o que mais não deva ser divulgado.
            </p>
            <div class="acoes">
              <button type="submit" class="btn btn-ouro">Criar encontro</button>
            </div>
          </form>
        </dialog>
      <?php else: ?>
        <p class="dica">Só a coordenação cria encontro. Você executa e cadastra presença.</p>
      <?php endif; ?>
    </div>
    <?php if ($coordena): ?>
    <script>
      (function () {
        var caixa = document.getElementById('novo-encontro');
        var abrir = document.getElementById('abrir-novo');
        if (!caixa || !abrir || typeof caixa.showModal !== 'function') return;
        /* Com JS o link vira modal de verdade: foco preso, Esc fecha, véu por
           cima. Sem JS ou sem <dialog>, o href continua levando a ?novo=1. */
        var jaAberto = caixa.hasAttribute('open');
        caixa.removeAttribute('open');
        abrir.addEventListener('click', function (e) {
          e.preventDefault();
          caixa.showModal();
        });
        if (jaAberto) caixa.showModal();
      })();
    </script>
    <?php endif; ?>
    <?php
    fechar_pagina();
    exit;
}

/* ---------------- um encontro ---------------- */

$familia   = FAMILIAS[$aberto['familia']];
$pessoas   = presencas_do_evento($aberto['id']);
$preparo   = preparo_do_evento($aberto);
$time      = array_values(array_filter(ler_pessoas(), fn ($u) => $u['ativo']));

/* Calculado aqui em cima porque a barra de seções, lá no topo, precisa do
   número — e o bloco do funil só aparece bem mais abaixo. */
$vencidos = [];
if ($coordena) {
    foreach ($pessoas as $l) {
        if (($etapa = etapa_vencida($l, $aberto)) !== null) {
            $vencidos[] = [$l, $etapa];
        }
    }
}

abrir_pagina($aberto['titulo']);
?>
<div class="capa">
  <?php cabecalho_pagina(
      $aberto['titulo'],
      $familia['nome'] . ' · ' . $dataBonita($aberto)
      . ($aberto['local'] !== '' ? ' · ' . $aberto['local'] : '')
      . ' · ' . STATUS_EVENTO[$aberto['status']],
      ['url' => '/painel/eventos.php', 'texto' => 'Todos os encontros'],
      '/painel/eventos'
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php /* A tela do encontro é longa por natureza — playbook, cinco peças,
           lista de gente, follow-up, dados. Sem um índice, chegar em "Pessoas"
           no celular é rolar às cegas. Âncoras e não abas: funcionam sem
           JavaScript, o navegador guarda a posição, e dá para mandar o link de
           uma seção no grupo. Mesmo desenho do `.atalho-colunas` da Produção. */ ?>
  <nav class="secoes" aria-label="Seções do encontro">
    <a href="#preparo">Preparo <span><?= $preparo['feito'] ?>/<?= $preparo['total'] ?></span></a>
    <a href="#pessoas">Pessoas <span><?= count($pessoas) ?></span></a>
    <?php if ($vencidos !== []): ?>
      <a href="#funil">Follow-up <span><?= count($vencidos) ?></span></a>
    <?php endif; ?>
    <a href="#dados">Dados</a>
  </nav>

  <!-- playbook da família -->
  <fieldset>
    <legend>Playbook — <?= h($familia['nome']) ?></legend>
    <p class="dica" style="margin:0 0 12px"><strong>Serve para:</strong> <?= h($familia['serve']) ?></p>
    <p class="dica" style="margin:0 0 12px"><strong>Métrica de sucesso:</strong> <?= h($familia['metrica']) ?></p>

    <div class="msg msg-erro">
      <strong>Travas desta família</strong>
      <ul class="lista-travas">
        <?php foreach ($familia['travas'] as $t): ?>
          <li><?= h($t) ?></li>
        <?php endforeach; ?>
      </ul>
    </div>

    <p class="dica"><strong>Material específico:</strong> <?= h(implode(' · ', $familia['material'])) ?></p>
  </fieldset>

  <!-- as cinco peças -->
  <fieldset id="preparo">
    <legend>As cinco peças — preparo <?= $preparo['feito'] ?>/<?= $preparo['total'] ?></legend>

    <?php foreach (PECAS as $chave => $peca): ?>
      <?php
        $lista = checklist($peca['checklist']);
        $marcados = $aberto['feitos'][$chave] ?? [];
        $responsavel = achar_pessoa($aberto['responsaveis'][$chave]);
      ?>
      <details class="item" id="peca-<?= h($chave) ?>" <?= count($marcados) < count($lista['itens']) ? 'open' : '' ?>>
        <summary class="item-topo">
          <span class="item-num" aria-hidden="true"><?= count($marcados) === count($lista['itens']) ? '✓' : '·' ?></span>
          <span class="item-resumo">
            <strong><?= h($peca['nome']) ?></strong>
            <span><?= count($marcados) ?>/<?= count($lista['itens']) ?><?= $responsavel ? ' · ' . h($responsavel['nome']) : ' · sem dono' ?></span>
          </span>
        </summary>
        <div class="item-corpo">
          <?php foreach ($lista['itens'] as $i => $texto): ?>
            <form method="post" class="risco-linha">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
              <input type="hidden" name="acao" value="marcar">
              <input type="hidden" name="peca" value="<?= h($chave) ?>">
              <input type="hidden" name="item" value="<?= $i ?>">
              <button type="submit" class="risco<?= in_array($i, $marcados, true) ? ' risco-feito' : '' ?>">
                <span class="risco-caixa" aria-hidden="true"><?= in_array($i, $marcados, true) ? '✓' : '' ?></span>
                <span><?= h($texto) ?></span>
              </button>
            </form>
          <?php endforeach; ?>
        </div>
      </details>
    <?php endforeach; ?>
  </fieldset>

  <!-- lista de presença -->
  <fieldset id="pessoas">
    <legend>Quem vem e quem veio (<?= count($pessoas) ?>)</legend>

    <?php if ($aberto['token'] !== ''): ?>
      <?php $urlPresenca = url_presenca($aberto); ?>
      <div class="qr-bloco">
        <div class="qr-papel">
          <!-- o desenho entra aqui pelo /painel/vendor/qrcode.js -->
          <div class="qr-arte" data-qr="<?= h($urlPresenca) ?>"></div>
          <p class="qr-chamada">Aponte a câmera</p>
        </div>
        <div class="qr-texto">
          <p class="dica" style="margin:0 0 10px">
            <strong>QR da mesa da Recepção.</strong> Imprima e cole na entrada: quem
            chega se cadastra no próprio celular, e a lista já sai organizada — sem
            fila para alguém digitar depois.
          </p>
          <p class="provisoria card-arquivo"><?= h($urlPresenca) ?></p>
          <p class="dica">
            Quem não tiver celular à mão, a Recepção cadastra aqui embaixo. Ninguém
            entra sem passar pelo cadastro — quem entra sem se cadastrar é contato
            perdido.
          </p>
        </div>
      </div>
    <?php endif; ?>

    <?php /* ===== o link de "vou", que circula ANTES do encontro ===== */ ?>
    <?php if ($aberto['tokenConfirmacao'] !== ''): ?>
      <?php $urlConfirma = url_confirmacao($aberto); ?>
      <details class="decidir" style="margin:0 0 22px">
        <summary class="btn">Link de confirmação, para mandar no grupo</summary>
        <div class="decidir-corpo">
          <p class="dica" style="margin:0 0 12px">
            <strong>É um link diferente do QR da mesa</strong>, de propósito. Este só
            marca “vou”; o do QR marca “cheguei”. Com um link só, quem recebesse a
            mensagem no grupo se marcaria como presente sem sair de casa — e é a lista
            de presença que alimenta o follow-up.
          </p>
          <p class="dica" style="margin:0 0 12px">
            Quem já veio a algum encontro, já se inscreveu ou já tem conta digita
            <strong>só o WhatsApp</strong> e pronto — nome, bairro e cidade a gente já tem.
            Quem é novo preenche quatro campos.
          </p>
          <p class="provisoria card-arquivo"><?= h($urlConfirma) ?></p>

          <p class="dica" style="margin:14px 0 6px"><strong>Mensagem pronta para colar:</strong></p>
          <p class="provisoria" style="white-space:pre-wrap"><?php
            $quando = trim($aberto['data'] . ($aberto['hora'] !== '' ? ' às ' . $aberto['hora'] : ''));
            echo h(
                $aberto['titulo']
                . ($quando !== '' ? "\n" . $quando : '')
                . ($aberto['local'] !== '' ? "\n" . $aberto['local'] : '')
                . "\n\nConfirma sua presença aqui: " . $urlConfirma
            );
          ?></p>

          <?php if (!$aberto['naAgenda']): ?>
            <p class="dica">
              Este encontro <strong>não está na programação pública</strong>, então o link
              só chega a quem você mandar.
            </p>
          <?php else: ?>
            <p class="dica">
              O botão “Vou nesse” também aparece sozinho no cartão deste encontro em
              <a href="/programacao" target="_blank">/programacao</a>.
            </p>
          <?php endif; ?>
        </div>
      </details>
    <?php endif; ?>

    <?php /* ===== escalar o time ===== */ ?>
    <?php $doTime = pessoas_fora_do_evento($aberto['id']); ?>
    <?php if ($doTime !== []): ?>
      <details class="decidir" style="margin:0 0 22px">
        <summary class="btn">Escalar o time (<?= count($doTime) ?> ainda fora da lista)</summary>
        <div class="decidir-corpo">
          <p class="dica" style="margin:0 0 12px">
            Quem tem conta no painel <strong>não lê o QR da mesa</strong> — está atrás
            dela, recebendo os outros. Sem escalar, a lista do encontro conta só quem
            entrou pela porta, e o relatório esquece justamente quem fez o encontro
            acontecer.
          </p>
          <form method="post">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
            <input type="hidden" name="acao" value="add-time">
            <?php foreach ($doTime as $u): ?>
              <label class="check">
                <input type="checkbox" name="usuario[]" value="<?= h($u['id']) ?>">
                <?= h($u['nome']) ?>
                <?php if (!empty($u['funcoes'])): ?>
                  <span class="dica"><?= h(nome_funcao($u['funcoes'][0])) ?></span>
                <?php endif; ?>
              </label>
            <?php endforeach; ?>
            <div class="acoes" style="margin-top:12px">
              <button type="submit" class="btn btn-ouro">Escalar quem marquei</button>
            </div>
          </form>
        </div>
      </details>
    <?php endif; ?>

    <?php if ($pessoas !== []): ?>
      <?php
        /* Os quatro estados saem de `confirmou` × `compareceu`, sem campo novo.
           O que mais interessa é o terceiro: confirmou e faltou é a diferença
           entre o que a Divulgação prometeu e o que apareceu na porta, e é o
           número que diz se o convite está funcionando. */
        $contas = ['convidado' => 0, 'confirmou' => 0, 'veio' => 0, 'faltou' => 0];
        foreach ($pessoas as $l) {
            if ($l['compareceu']) {
                $contas['veio']++;
            } elseif ($l['confirmou']) {
                $contas['faltou']++;
            } else {
                $contas['convidado']++;
            }
            if ($l['confirmou']) {
                $contas['confirmou']++;
            }
        }
      ?>
      <p style="margin:0 0 14px">
        <span class="selo selo-ok"><?= $contas['veio'] ?> vieram</span>
        <span class="selo"><?= $contas['confirmou'] ?> confirmaram</span>
        <?php if ($contas['faltou'] > 0): ?>
          <span class="selo selo-off"><?= $contas['faltou'] ?> confirmaram e faltaram</span>
        <?php endif; ?>
        <?php if ($contas['convidado'] > 0): ?>
          <span class="selo selo-cinza"><?= $contas['convidado'] ?> só convidados</span>
        <?php endif; ?>
      </p>

      <div class="rolagem">
        <table class="tabela">
          <thead>
            <tr><th>Quem</th><th>Confirmou</th><th>Compareceu</th><th>O que é</th></tr>
          </thead>
          <tbody>
            <?php foreach ($pessoas as $l): ?>
              <?php $q = $l['pessoa']; ?>
              <tr>
                <td>
                  <?php if (pode('pessoas')): ?>
                    <a href="/painel/pessoas.php?p=<?= h($q['id']) ?>"><strong><?= h($q['nome']) ?></strong></a>
                  <?php else: ?>
                    <strong><?= h($q['nome']) ?></strong>
                  <?php endif; ?>
                  <br>
                  <span class="dica">
                    <?php $onde = trim($q['bairro'] . ($q['cidade'] !== '' ? ', ' . $q['cidade'] : ''), ', '); ?>
                    <?= $onde !== '' ? h($onde) . ' · ' : '' ?>
                    <?php if ($q['telefone'] === ''): ?>
                      sem telefone
                    <?php elseif (pode_ver_telefone($l, $eu)): ?>
                      <a href="https://wa.me/55<?= h($q['telefone']) ?>" target="_blank" rel="noopener">
                        <?= h(telefone_bonito($q['telefone'])) ?>
                      </a>
                    <?php else: ?>
                      <?= h(telefone_encoberto($q['telefone'])) ?>
                    <?php endif; ?>
                    <?= $l['origem'] === 'qr' ? ' · cadastro no celular' : '' ?>
                    <?= tem_conta($q) ? ' · <span class="selo selo-cinza">do time</span>' : '' ?>
                  </span>
                </td>
                <?php foreach (['confirmou', 'compareceu'] as $campo): ?>
                  <td>
                    <form method="post">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                      <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
                      <button type="submit" class="btn btn-mini" name="acao" value="<?= h($campo) ?>">
                        <?= $l[$campo] ? 'sim' : '—' ?>
                      </button>
                    </form>
                  </td>
                <?php endforeach; ?>
                <td>
                  <form method="post">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                    <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
                    <input type="hidden" name="acao" value="classificar">
                    <?php /* Grava no cadastro DA PESSOA, e não nesta linha: ela é
                             militante em todo lugar, não só neste sábado. */ ?>
                    <select name="tipo" onchange="this.form.submit()">
                      <?php foreach (TIPOS_PESSOA as $chave => $nome): ?>
                        <option value="<?= h($chave) ?>" <?= $q['tipo'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
                      <?php endforeach; ?>
                    </select>
                    <noscript><button type="submit" class="btn btn-mini">ok</button></noscript>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>

    <details class="decidir">
      <summary class="btn btn-ouro">Cadastrar alguém</summary>
      <div class="decidir-corpo">
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
          <input type="hidden" name="acao" value="add-pessoa">
          <div class="campo">
            <label for="p-nome">Nome</label>
            <input id="p-nome" type="text" name="nome" maxlength="80" required>
          </div>
          <div class="linha g2">
            <div class="campo">
              <label for="p-tel">WhatsApp</label>
              <input id="p-tel" type="tel" name="telefone" maxlength="20" inputmode="numeric" placeholder="85 99999-9999">
            </div>
            <div class="campo">
              <label for="p-cidade">Cidade</label>
              <input id="p-cidade" type="text" name="cidade" maxlength="60">
            </div>
          </div>
          <div class="campo">
            <label for="p-bairro">Bairro</label>
            <input id="p-bairro" type="text" name="bairro" maxlength="60">
          </div>
          <div class="campo">
            <label for="p-conv">Convidado por</label>
            <input id="p-conv" type="text" name="convidadoPor" maxlength="60">
          </div>
          <label class="check"><input type="checkbox" name="confirmou" value="1"> Já confirmou presença</label>
          <label class="check"><input type="checkbox" name="compareceu" value="1"> Já está aqui</label>
          <div class="acoes">
            <button type="submit" class="btn btn-ouro">Cadastrar</button>
          </div>
        </form>
      </div>
    </details>
  </fieldset>

  <!-- funil -->
  <?php if ($coordena): ?>
    <fieldset id="funil">
      <legend>Follow-up vencido (<?= count($vencidos) ?>)</legend>
      <p class="dica">
        Lead sem segunda mensagem é lead perdido. D+0 agradecer · D+3 conteúdo · D+7 convite.
      </p>
      <?php if ($vencidos === []): ?>
        <p class="dica" style="margin:0">Nada vencido. Ou ninguém compareceu ainda.</p>
      <?php else: ?>
        <?php foreach ($vencidos as [$l, $etapa]): ?>
          <article class="ficha">
            <header class="ficha-topo">
              <span class="ficha-quem">
                <strong><?= h($l['pessoa']['nome']) ?></strong>
                <span><?= h(TIPOS_PESSOA[$l['pessoa']['tipo']]) ?> · <?= h(ROTULO_FUNIL[$etapa]) ?></span>
              </span>
              <span class="selo selo-off"><?= h(strtoupper($etapa)) ?></span>
            </header>
            <div class="acoes">
              <?php if ($l['pessoa']['telefone'] !== '' && pode_ver_telefone($l, $eu)): ?>
                <a class="btn btn-mini" target="_blank" rel="noopener"
                   href="https://wa.me/55<?= h($l['pessoa']['telefone']) ?>">Abrir WhatsApp</a>
              <?php endif; ?>
              <form method="post" style="display:inline">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
                <input type="hidden" name="acao" value="funil">
                <input type="hidden" name="etapa" value="<?= h($etapa) ?>">
                <button type="submit" class="btn btn-ouro">Marcar como feito</button>
              </form>
            </div>
          </article>
        <?php endforeach; ?>
      <?php endif; ?>
    </fieldset>
  <?php endif; ?>

  <!-- dados do encontro -->
  <?php if ($coordena): ?>
    <fieldset id="dados">
      <legend>Dados do encontro</legend>
      <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
        <input type="hidden" name="acao" value="salvar">

        <div class="campo">
          <label for="e-titulo">Nome</label>
          <input id="e-titulo" type="text" name="titulo" maxlength="120" value="<?= h($aberto['titulo']) ?>">
        </div>
        <div class="linha g2">
          <div class="campo">
            <label for="e-dia">Dia</label>
            <input id="e-dia" type="date" name="dia" value="<?= h(dia_do_inicio($aberto['inicio'])) ?>">
          </div>
          <div class="campo">
            <label for="e-hora">Hora <span class="dica">— dá para deixar em branco</span></label>
            <input id="e-hora" type="time" name="hora" value="<?= h(hora_do_inicio($aberto['inicio'])) ?>">
          </div>
        </div>
        <?php if ($aberto['inicio'] === '' && $aberto['data'] !== ''): ?>
          <p class="dica">
            Este encontro é anterior ao campo de horário e guardava
            “<?= h(trim($aberto['data'] . ' ' . $aberto['hora'])) ?>” como texto.
            Preencha acima para ele voltar a ordenar e a saber quando acabou.
          </p>
        <?php else: ?>
          <p class="dica">Horário do Ceará. Sem hora, o cartão mostra só o dia.</p>
        <?php endif; ?>
        <?php $ehDigital = $aberto['familia'] === 'digital'; ?>
        <?php if (!$ehDigital): ?>
          <div class="campo">
            <label for="e-local">Local</label>
            <input id="e-local" type="text" name="local" maxlength="120" value="<?= h($aberto['local']) ?>">
            <p class="dica">O nome público do lugar. É o que vai para o site.</p>
          </div>
          <div class="campo">
            <label for="e-end">Endereço</label>
            <input id="e-end" type="text" name="endereco" maxlength="200" value="<?= h($aberto['endereco']) ?>">
            <p class="dica">
              Este <strong>não</strong> vai para o site — pode ser a casa de alguém.
              Serve para quem está escalado achar o lugar.
            </p>
          </div>
        <?php else: ?>
          <input type="hidden" name="local" value="<?= h($aberto['local']) ?>">
          <input type="hidden" name="endereco" value="<?= h($aberto['endereco']) ?>">
        <?php endif; ?>

        <?php /* ===== o que o site mostra ===== */ ?>
        <label class="check">
          <input type="checkbox" name="naAgenda" value="1" <?= $aberto['naAgenda'] ? 'checked' : '' ?>>
          Aparecer na programação pública
        </label>
        <p class="dica">
          Marcado, ele está em <a href="/programacao" target="_blank">/programacao</a>.
          O que sai daqui é o nome, o subtítulo, o horário, o local e a imagem — nunca o
          endereço, o orçamento nem as observações.
        </p>

        <div class="campo">
          <label for="e-sub">Subtítulo no cartão</label>
          <input id="e-sub" type="text" name="subtitulo" maxlength="120" value="<?= h($aberto['subtitulo']) ?>">
          <p class="dica">Vazio, o cartão usa o local.</p>
        </div>
        <div class="linha g2">
          <div class="campo">
            <label for="e-cor">Cor do cartão</label>
            <select id="e-cor" name="cor">
              <?php foreach (CORES as $chave => $nome): ?>
                <option value="<?= h($chave) ?>" <?= $aberto['cor'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="campo">
            <label for="e-plat">Plataforma</label>
            <select id="e-plat" name="plataforma">
              <?php foreach (PLATAFORMAS as $chave => $nome): ?>
                <option value="<?= h($chave) ?>" <?= $aberto['plataforma'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
              <?php endforeach; ?>
            </select>
            <p class="dica"><?= $ehDigital ? 'Onde a transmissão acontece.' : 'Só para encontro digital.' ?></p>
          </div>
        </div>
        <div class="campo">
          <label for="e-img">Imagem <span class="dica">— opcional</span></label>
          <?php if ($aberto['imagem'] !== ''): ?>
            <p><img src="<?= h($aberto['imagem']) ?>" alt="" style="max-width:240px;border:3px solid var(--linha-2)"></p>
            <label class="check">
              <input type="checkbox" name="tirarImagem" value="1"> Remover esta imagem
            </label>
          <?php endif; ?>
          <input id="e-img" type="file" name="imagem" accept="image/*">
          <p class="dica">
            JPG, PNG ou WEBP até 8 MB. Enviar uma nova substitui a atual.
            Sem imagem, o cartão desenha a hachura do cordel com a sigla do dia.
          </p>
        </div>
        <div class="campo">
          <label for="e-link">Link</label>
          <input id="e-link" type="text" name="link" maxlength="300" value="<?= h($aberto['link']) ?>"
                 placeholder="<?= $ehDigital ? 'https://youtube.com/...' : '/propostas' ?>">
        </div>
        <label class="check">
          <input type="checkbox" name="aoVivo" value="1" <?= $aberto['aoVivo'] ? 'checked' : '' ?>>
          É transmissão ao vivo
        </label>
        <p class="dica">
          O selo “AO VIVO” só acende com esta marca <strong>e</strong> dentro da janela de
          <?= DURACAO_PADRAO_MIN ?> minutos do início. Só a marca é o que fazia o selo ficar
          aceso por treze dias.
        </p>
        <div class="linha g2">
          <div class="campo">
            <label for="e-pub">Público esperado</label>
            <input id="e-pub" type="number" name="publicoEsperado" min="0" max="100000" value="<?= (int) $aberto['publicoEsperado'] ?>">
            <p class="dica">A Divulgação convida cerca de 3x isso e confirma um terço.</p>
          </div>
          <div class="campo">
            <label for="e-orc">Orçamento aprovado</label>
            <input id="e-orc" type="text" name="orcamento" maxlength="60" value="<?= h($aberto['orcamento']) ?>">
          </div>
        </div>

        <p class="dica">Quem responde por cada peça:</p>
        <div class="linha g2">
          <?php foreach (PECAS as $chave => $peca): ?>
            <div class="campo">
              <label for="resp-<?= h($chave) ?>"><?= h($peca['nome']) ?></label>
              <select id="resp-<?= h($chave) ?>" name="resp[<?= h($chave) ?>]">
                <option value="">— ninguém ainda —</option>
                <?php foreach ($time as $p): ?>
                  <option value="<?= h($p['id']) ?>" <?= $aberto['responsaveis'][$chave] === $p['id'] ? 'selected' : '' ?>>
                    <?= h($p['nome']) ?>
                  </option>
                <?php endforeach; ?>
              </select>
            </div>
          <?php endforeach; ?>
        </div>

        <div class="campo">
          <label for="e-obs">Observações</label>
          <textarea id="e-obs" name="observacoes" rows="3" maxlength="600"><?= h($aberto['observacoes']) ?></textarea>
        </div>

        <div class="acoes">
          <button type="submit" class="btn btn-ouro">Salvar</button>
        </div>
      </form>

      <form method="post" class="decidir-recusa">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
        <input type="hidden" name="acao" value="status">
        <div class="campo">
          <label for="e-status">Situação</label>
          <select id="e-status" name="status">
            <?php foreach (STATUS_EVENTO as $chave => $nome): ?>
              <option value="<?= h($chave) ?>" <?= $aberto['status'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="acoes">
          <button type="submit" class="btn btn-mini">Mudar situação</button>
        </div>
      </form>
    </fieldset>
  <?php endif; ?>
</div>

<?php if ($aberto['token'] !== ''): ?>
  <script src="/painel/vendor/qrcode.js?v=<?= VERSAO_ESTILO ?>"></script>
  <script>
    /* Desenha o QR em SVG. Servido do próprio domínio (ver vendor/LEIA-ME.md):
       nada do visitante vai para CDN de terceiro.

       Correção de erro nível M: aguenta o papel sujo ou amassado da mesa de
       recepção sem parar de ler, e ainda cabe numa folha pequena. */
    document.querySelectorAll('.qr-arte').forEach(function (alvo) {
      var qr = qrcode(0, 'M');
      qr.addData(alvo.dataset.qr);
      qr.make();
      alvo.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    });
  </script>
<?php endif; ?>
<?php
fechar_pagina();
