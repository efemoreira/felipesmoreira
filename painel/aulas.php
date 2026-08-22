<?php
declare(strict_types=1);

/**
 * Aulas em vídeo — felipesmoreira.com/painel/aulas
 *
 * O texto das aulas NÃO se edita aqui: ele é versionado no repositório
 * (aulas-conteudo.php), porque é a tradução do manual e muda por decisão da
 * coordenação, não no meio de uma terça-feira. O que esta tela faz é pendurar
 * o vídeo de cada aula e mostrar quem já estudou.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/aulas-comum.php';
exigir_area('aulas');

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $ancora = ''): void
{
    header('Location: /painel/aulas.php' . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
}

/* ===================== ações ===================== */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!token_valido()) {
        avisar('erro', 'Sessão expirada. Entre de novo.');
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    $acao   = (string) ($_POST['acao'] ?? '');
    $aulaId = limpar_texto($_POST['aula'] ?? '', 60);
    $aula   = aula_por_id($aulaId);

    if ($aula === null) {
        avisar('erro', 'Essa aula não existe.');
        voltar();
    }

    $videos = ler_videos();

    if ($acao === 'remover') {
        unset($videos[$aulaId]);
        if (!gravar_videos($videos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar($aulaId);
        }
        avisar('ok', 'Vídeo removido de “' . $aula['titulo'] . '”.');
        voltar($aulaId);
    }

    if ($acao === 'video') {
        $bruto = limpar_texto($_POST['link'] ?? '', 200);
        $id    = id_de_video($bruto);

        if ($id === '') {
            avisar('erro', 'Não reconheci esse link do YouTube. Cole o endereço da barra do navegador ou o link do botão Compartilhar.');
            voltar($aulaId);
        }

        $videos[$aulaId] = [
            'provedor'     => 'youtube',
            'id'           => $id,
            'publicada'    => !empty($_POST['publicada']),
            'atualizadoEm' => date('c'),
        ];

        if (!gravar_videos($videos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar($aulaId);
        }
        avisar('ok', 'Vídeo salvo em “' . $aula['titulo'] . '”.');
        voltar($aulaId);
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$videos     = ler_videos();
$total      = total_de_aulas();
$comVideo   = count($videos);
$publicadas = count(array_filter($videos, fn ($v) => $v['publicada']));
$totalRapidas = count(array_filter(todas_as_aulas(), fn ($a) => $a['pista'] === 'rapida'));

abrir_pagina('Aulas em vídeo');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Aulas em vídeo',
      'A formação que o time vê em <a href="/aulas" target="_blank">/aulas</a>. A divisão em '
      . '<strong>🚗 Pista Rápida</strong> e <strong>Pista Lenta</strong> é explicada na primeira aula, '
      . '<a href="/aulas#como-funciona-a-formacao" target="_blank">Como esta formação funciona</a> — '
      . 'aqui não se repete, para os dois textos não divergirem.',
      null,
      null,
      [
          'Pendurar o vídeo de uma aula: o texto dela já está escrito e vem do manual.',
          'Ver quem já estudou o quê, e quem parou no meio.',
          'Aula sem vídeo continua funcionando — o texto é o que ensina; o vídeo ajuda.',
      ]
  ); ?>
  <p class="dica">
    O texto de cada aula já está escrito e vem do manual da militância. Aqui você só pendura o vídeo:
    enquanto ele não existir, a aula funciona pelo texto. Aula nova de reforço entra como Pista
    Lenta no Dia certo, sem mexer no caminho de quem já está andando.
  </p>

  <?php recado($erro, $ok); ?>

  <details class="decidir" style="margin-bottom:20px">
    <summary class="btn">Link do Dia 0 para quem ainda não tem acesso</summary>
    <div class="decidir-corpo">
      <p class="dica" style="margin:0 0 10px">
        Mande para quem acabou de se inscrever. Abre <strong>só o Dia 0</strong> — as regras que
        valem para todo mundo — sem conta e sem gravar progresso. O resto da formação continua
        exigindo login, e o texto nunca sai do painel.
      </p>
      <p class="provisoria" style="word-break:break-all"><?= h(link_convite()) ?></p>
      <p class="dica" style="margin:10px 0 0">
        O link é o mesmo sempre e não vence. Se algum dia ele circular longe demais, apague
        <code>dados/segredo.php</code> no hPanel: o painel gera outro sozinho e todos os convites
        antigos param de valer de uma vez. Isso também zera a contagem do teto de envios do
        formulário público — não quebra nada, só recomeça do zero.
      </p>
    </div>
  </details>

  <p class="dica">
    <?= $total ?> aulas · <?= $comVideo ?> com vídeo · <?= $publicadas ?> publicadas.
  </p>

<?php foreach (CURRICULO as $dia): ?>
  <?php
    /* Quanto deste Dia já tem vídeo — sem isso, achar o Dia incompleto exige
       abrir os seis <details> um por um. */
    $comVideoNoDia = count(array_filter(
        $dia['aulas'],
        fn ($a) => isset($videos[$a['id']])
    ));
  ?>
  <fieldset>
    <legend>
      Dia <?= (int) $dia['numero'] ?> — <?= h($dia['titulo']) ?>
      · <?= $comVideoNoDia ?>/<?= count($dia['aulas']) ?> com vídeo
    </legend>
    <p class="dica" style="margin:0 0 14px"><?= h($dia['resumo']) ?></p>

    <?php foreach ($dia['aulas'] as $aula): ?>
      <?php
        $v = $videos[$aula['id']] ?? null;
        $rapida = $aula['pista'] === 'rapida';
      ?>
      <details class="item" id="<?= h($aula['id']) ?>">
        <summary class="item-topo">
          <span class="item-num" aria-hidden="true"><?= $rapida ? '🚗' : '·' ?></span>
          <span class="item-resumo">
            <strong><?= h($aula['titulo']) ?></strong>
            <span><?= (int) $aula['minutos'] ?> min<?= $rapida ? ' · Pista Rápida' : '' ?></span>
          </span>
          <?php if ($v === null): ?>
            <span class="selo selo-cinza">Sem vídeo</span>
          <?php elseif ($v['publicada']): ?>
            <span class="selo selo-ok">Publicada</span>
          <?php else: ?>
            <span class="selo selo-off">Rascunho</span>
          <?php endif; ?>
        </summary>

        <div class="item-corpo">
          <p class="dica" style="margin:0 0 14px"><?= h($aula['resumo']) ?></p>

          <form method="post">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="aula" value="<?= h($aula['id']) ?>">

            <div class="campo">
              <label for="link-<?= h($aula['id']) ?>">Link do vídeo no YouTube</label>
              <input id="link-<?= h($aula['id']) ?>" type="url" name="link" maxlength="200"
                     inputmode="url" placeholder="https://youtu.be/…"
                     value="<?= $v !== null ? 'https://youtu.be/' . h($v['id']) : '' ?>">
            </div>

            <label class="check">
              <input type="checkbox" name="publicada" value="1" <?= ($v !== null && $v['publicada']) ? 'checked' : '' ?>>
              Mostrar o player em /aulas
            </label>
            <p class="dica">
              Deixe desmarcado para deixar o link guardado sem ninguém ver ainda. Use vídeo
              <strong>não listado</strong>: ele não aparece em busca, mas abre para quem tem o link.
            </p>

            <div class="acoes">
              <button type="submit" class="btn btn-ouro" name="acao" value="video">Salvar vídeo</button>
              <?php if ($v !== null): ?>
                <button type="submit" class="btn btn-risco" name="acao" value="remover"
                        formnovalidate>Remover vídeo</button>
              <?php endif; ?>
            </div>
          </form>
        </div>
      </details>
    <?php endforeach; ?>
  </fieldset>
<?php endforeach; ?>

  <fieldset>
    <legend>Quem estudou</legend>
    <?php
      $progresso = ler_progresso();
      $pessoas = array_values(array_filter(ler_pessoas(), fn ($u) => $u['ativo'] && in_array('aulas', $u['areas'], true)));
      usort($pessoas, function ($a, $b) use ($progresso) {
          $qa = count($progresso[$a['id']] ?? []);
          $qb = count($progresso[$b['id']] ?? []);
          return $qb <=> $qa ?: strcmp($a['nome'], $b['nome']);
      });
    ?>
    <?php if ($pessoas === []): ?>
      <p class="dica" style="margin:0">Ninguém com acesso às aulas ainda. Libere a área em <a href="/painel/usuarios.php">Usuários</a>.</p>
    <?php else: ?>
      <div class="rolagem">
        <table class="tabela">
          <thead>
            <tr><th>Quem</th><th>Pistas Rápidas</th><th>Total</th></tr>
          </thead>
          <tbody>
          <?php foreach ($pessoas as $p): ?>
            <?php
              $feitas  = array_keys($progresso[$p['id']] ?? []);
              $rapidas = count(array_filter($feitas, fn ($id) => (aula_por_id($id)['pista'] ?? '') === 'rapida'));
              $pct = $total > 0 ? (int) round(count($feitas) / $total * 100) : 0;
            ?>
            <tr>
              <td><strong><?= h($p['nome']) ?></strong></td>
              <td><?= $rapidas ?> de <?= $totalRapidas ?></td>
              <td><?= count($feitas) ?> de <?= $total ?> · <?= $pct ?>%</td>
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
