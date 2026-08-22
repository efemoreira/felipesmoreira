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
        $inicio  = inicio_iso($_POST['inicio'] ?? '');

        if ($titulo === '') {
            avisar('erro', 'Dê um nome ao encontro.');
            voltar();
        }
        if (!isset(FAMILIAS[$familia])) {
            avisar('erro', 'Escolha a família do evento — é ela que traz o playbook e as travas.');
            voltar();
        }
        /* Um campo só, com data E hora, gravado com o fuso do Ceará junto. Eram
           dois campos de texto — "29/07" sem ano e "19H" — e por isso a página
           não conseguia ordenar nem saber o que já tinha passado. */
        if ($inicio === '') {
            avisar('erro', 'Informe o dia e a hora do encontro.');
            voltar();
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
                $e['inicio']   = inicio_iso($_POST['inicio'] ?? '');
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
        if ($telefone !== '' && lead_por_telefone($alvo['id'], $telefone) !== null) {
            avisar('erro', 'Esse número já está na lista deste encontro.');
            voltar($alvo['id'], 'pessoas');
        }

        $leads = ler_leads();
        $leads[] = [
            'id'       => novo_id_lead(),
            'eventoId' => $alvo['id'],
            'nome'     => $nome,
            'telefone' => $telefone,
            'bairro'   => limpar_texto($_POST['bairro'] ?? '', 60),
            'cidade'   => limpar_texto($_POST['cidade'] ?? '', 60),
            'convidadoPor' => limpar_texto($_POST['convidadoPor'] ?? '', 60),
            'classe'     => limpar_texto($_POST['classe'] ?? 'curioso', 20),
            'confirmou'  => !empty($_POST['confirmou']),
            'compareceu' => !empty($_POST['compareceu']),
            'origem'     => 'painel',
            'criadoPorId' => $eu['id'],
            'criadoEm'    => date('c'),
            /* Quem digita aqui é da Recepção, com a pessoa na frente: o
               consentimento é verbal, mas fica registrado com versão e data
               como o do QR. Sem isto a lista mistura ficha com e sem base legal
               anotada, e não há como saber qual é qual depois. */
            'consentimentoEm'     => date('c'),
            'consentimentoVersao' => VERSAO_CONSENTIMENTO_PRESENCA,
        ];

        if (!gravar_leads($leads)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar($alvo['id'], 'pessoas');
        }
        avisar('ok', $nome . ' entrou na lista.');
        voltar($alvo['id'], 'pessoas');
    }

    /* ---------- confirmar presença, classificar, andar no funil ---------- */
    if (in_array($acao, ['confirmou', 'compareceu', 'classificar', 'funil'], true)) {
        $leadId = limpar_texto($_POST['lead'] ?? '', 40);
        $leads  = ler_leads();
        $achou  = false;

        foreach ($leads as &$l) {
            if ($l['id'] !== $leadId || $l['eventoId'] !== $alvo['id']) {
                continue;
            }
            $achou = true;

            if ($acao === 'confirmou') {
                $l['confirmou'] = !$l['confirmou'];
            } elseif ($acao === 'compareceu') {
                $l['compareceu'] = !$l['compareceu'];
            } elseif ($acao === 'classificar') {
                $classe = limpar_texto($_POST['classe'] ?? '', 20);
                if (isset(CLASSES_LEAD[$classe])) {
                    $l['classe'] = $classe;
                }
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
        if (!gravar_leads($leads)) {
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

      <?php /* ===== quem é do movimento, olhando todos os encontros juntos =====
               Exige 'agenda' porque é a lista de contatos inteira, com telefone.
               Fica recolhida: a pauta desta tela é o encontro que vem, não o
               histórico — mas a pergunta "quem nunca falta" só tem resposta
               aqui. */ ?>
      <?php if ($coordena): ?>
        <?php $todas = pessoas_agrupadas(); ?>
        <?php if ($todas !== []): ?>
          <details class="decidir" style="margin-bottom:22px">
            <summary class="btn">As pessoas, somando todos os encontros (<?= count($todas) ?>)</summary>
            <div class="decidir-corpo">
              <p class="dica" style="margin:0 0 12px">
                Quem mais aparece vem primeiro. <strong>Confirmou e faltou</strong> é o
                número que mais importa aqui: é a diferença entre o que a Divulgação
                prometeu e quem chegou na porta.
              </p>
              <div class="rolagem">
                <table class="tabela">
                  <thead><tr><th>Quem</th><th>Veio</th><th>Faltou</th><th>Convites</th></tr></thead>
                  <tbody>
                    <?php foreach ($todas as $pes): ?>
                      <tr>
                        <td>
                          <strong><?= h($pes['nome']) ?></strong><br>
                          <span class="dica">
                            <?php $onde = trim($pes['bairro'] . ($pes['cidade'] !== '' ? ', ' . $pes['cidade'] : ''), ', '); ?>
                            <?= $onde !== '' ? h($onde) . ' · ' : '' ?>
                            <?php if ($pes['telefone'] !== ''): ?>
                              <a href="https://wa.me/55<?= h($pes['telefone']) ?>" target="_blank" rel="noopener">
                                <?= h(telefone_bonito($pes['telefone'])) ?>
                              </a>
                            <?php endif; ?>
                          </span>
                        </td>
                        <td>
                          <?php if ($pes['veio'] === 0): ?>
                            <span class="selo selo-off">nunca veio</span>
                          <?php elseif ($pes['veio'] === $pes['convites']): ?>
                            <span class="selo selo-ok">foi a todos (<?= $pes['veio'] ?>)</span>
                          <?php else: ?>
                            <span class="selo"><?= $pes['veio'] ?></span>
                          <?php endif; ?>
                        </td>
                        <td><?= $pes['faltou'] > 0 ? '<span class="selo selo-off">' . $pes['faltou'] . '</span>' : '—' ?></td>
                        <td><?= $pes['convites'] ?></td>
                      </tr>
                    <?php endforeach; ?>
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        <?php endif; ?>
      <?php endif; ?>

      <?php foreach ([['Próximos', eventos_proximos()], ['Já aconteceram', eventos_passados()]] as [$titulo, $lista]): ?>
        <fieldset>
          <legend><?= h($titulo) ?> (<?= count($lista) ?>)</legend>
          <?php if ($lista === [] && $titulo === 'Próximos'): ?>
            <p class="dica" style="margin:0 0 8px">
              Nenhum encontro marcado. O primeiro passo é <strong>Local &amp; Hora</strong>: três
              opções avaliadas (capacidade, custo, acesso, energia, som) antes de fechar qualquer
              coisa — e a reserva confirmada por escrito. Use o formulário abaixo para abrir o
              encontro e as cinco peças aparecem prontas para dividir.
            </p>
          <?php endif; ?>
          <?php if ($lista === []): ?>
            <p class="dica" style="margin:0">Nada por aqui.</p>
          <?php endif; ?>
          <?php foreach ($lista as $e): ?>
            <?php $p = preparo_do_evento($e); $presentes = count(array_filter(leads_do_evento($e['id']), fn ($l) => $l['compareceu'])); ?>
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
        <fieldset>
          <legend>Novo encontro</legend>
          <form method="post">
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
            <div class="campo">
              <label for="inicio">Quando começa</label>
              <input id="inicio" type="datetime-local" name="inicio" required>
              <p class="dica">
                Dia e hora juntos, no horário do Ceará. É deste campo que saem o dia,
                a data e a hora que o site mostra — nenhum dos três se digita.
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
        </fieldset>
      <?php else: ?>
        <p class="dica">Só a coordenação cria encontro. Você executa e cadastra presença.</p>
      <?php endif; ?>
    </div>
    <?php
    fechar_pagina();
    exit;
}

/* ---------------- um encontro ---------------- */

$familia   = FAMILIAS[$aberto['familia']];
$pessoas   = leads_do_evento($aberto['id']);
$preparo   = preparo_do_evento($aberto);
$time      = array_values(array_filter(ler_usuarios(), fn ($u) => $u['ativo']));

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
  <fieldset>
    <legend>As cinco peças — preparo <?= $preparo['feito'] ?>/<?= $preparo['total'] ?></legend>

    <?php foreach (PECAS as $chave => $peca): ?>
      <?php
        $lista = checklist($peca['checklist']);
        $marcados = $aberto['feitos'][$chave] ?? [];
        $responsavel = achar_usuario_por_id($aberto['responsaveis'][$chave]);
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
            <tr><th>Quem</th><th>Confirmou</th><th>Compareceu</th><th>Classe</th></tr>
          </thead>
          <tbody>
            <?php foreach ($pessoas as $l): ?>
              <tr>
                <td>
                  <strong><?= h($l['nome']) ?></strong><br>
                  <span class="dica">
                    <?php $onde = trim($l['bairro'] . ($l['cidade'] !== '' ? ', ' . $l['cidade'] : ''), ', '); ?>
                    <?= $onde !== '' ? h($onde) . ' · ' : '' ?>
                    <?php if ($l['telefone'] === ''): ?>
                      sem telefone
                    <?php elseif (pode_ver_telefone($l, $eu)): ?>
                      <a href="https://wa.me/55<?= h($l['telefone']) ?>" target="_blank" rel="noopener">
                        <?= h(telefone_bonito($l['telefone'])) ?>
                      </a>
                    <?php else: ?>
                      <?= h(telefone_encoberto($l['telefone'])) ?>
                    <?php endif; ?>
                    <?= $l['origem'] === 'qr' ? ' · cadastro no celular' : '' ?>
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
                    <select name="classe" onchange="this.form.submit()">
                      <?php foreach (CLASSES_LEAD as $chave => $nome): ?>
                        <option value="<?= h($chave) ?>" <?= $l['classe'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
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
    <?php
      $vencidos = [];
      foreach ($pessoas as $l) {
          if (($etapa = etapa_vencida($l, $aberto)) !== null) {
              $vencidos[] = [$l, $etapa];
          }
      }
    ?>
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
                <strong><?= h($l['nome']) ?></strong>
                <span><?= h(CLASSES_LEAD[$l['classe']]) ?> · <?= h(ROTULO_FUNIL[$etapa]) ?></span>
              </span>
              <span class="selo selo-off"><?= h(strtoupper($etapa)) ?></span>
            </header>
            <div class="acoes">
              <?php if ($l['telefone'] !== '' && pode_ver_telefone($l, $eu)): ?>
                <a class="btn btn-mini" target="_blank" rel="noopener"
                   href="https://wa.me/55<?= h($l['telefone']) ?>">Abrir WhatsApp</a>
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
    <fieldset>
      <legend>Dados do encontro</legend>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
        <input type="hidden" name="acao" value="salvar">

        <div class="campo">
          <label for="e-titulo">Nome</label>
          <input id="e-titulo" type="text" name="titulo" maxlength="120" value="<?= h($aberto['titulo']) ?>">
        </div>
        <div class="campo">
          <label for="e-inicio">Quando começa</label>
          <input id="e-inicio" type="datetime-local" name="inicio"
                 value="<?= h(inicio_para_campo($aberto['inicio'])) ?>">
          <?php if ($aberto['inicio'] === '' && $aberto['data'] !== ''): ?>
            <p class="dica">
              Este encontro é anterior ao campo de horário e guardava
              “<?= h(trim($aberto['data'] . ' ' . $aberto['hora'])) ?>” como texto.
              Preencha acima para ele voltar a ordenar e a saber quando acabou.
            </p>
          <?php else: ?>
            <p class="dica">Dia e hora juntos, no horário do Ceará.</p>
          <?php endif; ?>
        </div>
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
