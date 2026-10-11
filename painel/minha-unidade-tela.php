<?php
declare(strict_types=1);

/**
 * A tela de quem responde por um núcleo ou grupo — uma decisão por vez.
 *
 * Em cima, a situação e as duas ações da semana (registrar, marcar a
 * próxima). Embaixo, a gente: quem quer entrar, quem faz parte, e as tarefas
 * combinadas. Nomes encobertos ("Ana S."): o telefone continua sendo da
 * coordenação, como em todo o painel.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/minha-unidade-comum.php';
require_once __DIR__ . '/organizacao-tela.php';  // form_abre(), campo(), selo_da_unidade(), proxima_da_unidade()
require_once __DIR__ . '/tarefas-comum.php';

function tela_da_unidade(array $eu, array $unidade, array $cuidadas, ?string $erro, ?string $ok): void
{
    $nome = rotulo_da_unidade($unidade);
    /* Núcleo é de um lugar: quem dá para chamar é da mesma cidade. Grupo
       temático e grupo cultural sem cidade chamam de qualquer lugar. */
    $local = tipo_da_unidade($unidade) === 'nucleo' || ($unidade['cidade'] ?? '') !== '';
    $membros = membros_da_unidade($unidade['id']);
    $interessados = interessados_em($unidade);
    $idsMembros = array_column($membros, 'id');
    /* Quem dá para chamar: aprovado, ainda fora — da mesma cidade, se é núcleo. */
    $chamaveis = array_values(array_filter(ler_pessoas(), fn ($p) =>
        $p['status'] === 'aprovada' && !in_array($p['id'], $idsMembros, true)
        && (!$local || $p['cidade'] === $unidade['cidade'])
    ));
    $tarefas = tarefas_da_unidade($unidade['id']);
    $abertas = array_values(array_filter($tarefas, fn ($t) => $t['feitaEm'] === ''));
    $nomes = array_column(ler_pessoas(), 'nome', 'id');
    $qs = 'u=' . rawurlencode($unidade['id']) . '&';

    abrir_pagina($nome);
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      $nome,
      'Você responde por esta unidade. <strong>Depois de cada atividade, registre</strong>; sempre com a próxima marcada.',
      ['url' => '/painel/', 'texto' => 'Início'],
      null,
      [
          'Ativo = algo registrado nos últimos 31 dias + próxima atividade marcada.',
          'A próxima atividade vira um encontro: entra na agenda com o QR da porta e a confirmação de presença.',
          'Quem quer entrar chegou por /nucleos ou /temas. O contato vem pela coordenação.',
          'Ficha, nível e o que aparece no site continuam com a coordenação.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php if (count($cuidadas) > 1): ?>
    <p class="dica">
      Você responde por mais de uma:
      <?php foreach ($cuidadas as $x): ?>
        <a class="selo<?= $x['id'] === $unidade['id'] ? ' selo-ok' : '' ?>" href="?u=<?= h(rawurlencode($x['id'])) ?>">
          <?= h(rotulo_da_unidade($x)) ?>
        </a>
      <?php endforeach; ?>
    </p>
  <?php endif; ?>

  <fieldset>
    <legend>Agora</legend>
    <dl class="resumo-numeros">
      <div><dt>Situação</dt><dd><?php selo_da_unidade($unidade); ?></dd></div>
      <div><dt>Próxima</dt><dd><?= proxima_da_unidade($unidade) ?></dd></div>
      <div><dt>Fazem parte</dt><dd><?= count($membros) ?></dd></div>
    </dl>
    <div class="acoes">
      <?php botao_modal('registrar', 'Registrar o que fizemos', $qs . 'registrar=1'); ?>
      <?php botao_modal('proxima', 'Marcar a próxima', $qs . 'proxima=1', 'btn'); ?>
    </div>
  </fieldset>

  <?php if ($interessados !== []): ?>
    <fieldset>
      <legend>Quer entrar (<?= count($interessados) ?>)</legend>
      <p class="dica colado">Acolher em até 72 horas. O contato vem pela coordenação; aqui você já põe a pessoa na unidade.</p>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Quem</th><th>Onde</th><th>Inscrição</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($interessados as $p): ?>
              <tr>
                <td data-rotulo="Quem"><strong><?= h(nome_encoberto($p['nome'])) ?></strong></td>
                <td class="meia" data-rotulo="Onde"><?= h(trim($p['bairro'] . ' · ' . $p['cidade'], ' ·')) ?></td>
                <td class="meia" data-rotulo="Inscrição"><?= $p['status'] === 'pendente' ? 'esperando aprovação' : 'aprovada' ?></td>
                <td class="rodape" data-rotulo="">
                  <form method="post">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="acao" value="membro">
                    <input type="hidden" name="pessoaId" value="<?= h($p['id']) ?>">
                    <button class="btn btn-mini btn-ouro" type="submit">Pôr na unidade</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </fieldset>
  <?php endif; ?>

  <fieldset>
    <legend>Quem faz parte (<?= count($membros) ?>)</legend>
    <?php if ($membros === []): ?>
      <?php vazio('Ninguém ainda. Chame quem já esteve nas atividades — é assim que o núcleo deixa de depender de você.'); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Quem</th><th>Degrau</th><th></th></tr></thead>
          <tbody>
            <?php $degraus = degraus_de_hoje(); ?>
            <?php foreach ($membros as $p): $d = max(1, $degraus[$p['id']] ?? 1); ?>
              <tr>
                <td data-rotulo="Quem"><strong><?= h(nome_encoberto($p['nome'])) ?></strong></td>
                <td class="meia" data-rotulo="Degrau"><?= $d ?> · <?= h(DEGRAUS[$d]['nome']) ?></td>
                <td class="rodape" data-rotulo="">
                  <?php menu_acoes([
                      ['texto' => 'Tirar da unidade', 'acao' => 'membro', 'campos' => ['pessoaId' => $p['id'], 'dentro' => '0'],
                       'confirmar' => 'Tirar ' . nome_encoberto($p['nome']) . ' da unidade?', 'risco' => true],
                  ]); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
    <?php if ($chamaveis !== []): ?>
      <form method="post" class="folga">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="acao" value="membro">
        <div class="campo">
          <label for="mu-chamar">Pôr alguém <?= $local ? 'de ' . h($unidade['cidade']) : '' ?></label>
          <select id="mu-chamar" name="pessoaId" required>
            <option value="">— escolha —</option>
            <?php foreach ($chamaveis as $p): ?>
              <option value="<?= h($p['id']) ?>"><?= h(nome_encoberto($p['nome']) . ($p['bairro'] !== '' ? ' · ' . $p['bairro'] : '')) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="acoes"><button class="btn" type="submit">Pôr na unidade</button></div>
      </form>
    <?php endif; ?>
  </fieldset>

  <fieldset>
    <legend>Tarefas combinadas (<?= count($abertas) ?>)</legend>
    <?php if ($abertas === []): ?>
      <p class="dica colado">Nada em aberto. Tarefa pequena, com dono e prazo, é o que faz alguém subir de Participante para Colaborador.</p>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>O quê</th><th>Quem</th><th>Até</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($abertas as $t): ?>
              <tr>
                <td data-rotulo="O quê"><strong><?= h($t['titulo']) ?></strong></td>
                <td class="meia" data-rotulo="Quem"><?= h(nome_encoberto($nomes[$t['donoId']] ?? '—')) ?></td>
                <td class="meia" data-rotulo="Até"><?= $t['ate'] !== '' ? h(data_humana($t['ate'])) : '—' ?></td>
                <td class="rodape" data-rotulo="">
                  <form method="post">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="acao" value="tarefa-feita">
                    <input type="hidden" name="id" value="<?= h($t['id']) ?>">
                    <button class="btn btn-mini" type="submit">Feita</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
    <?php $donos = array_merge($membros, array_values(array_filter(ler_pessoas(), fn ($p) => in_array($p['id'], [$unidade['responsavelId'], $unidade['substitutoId']], true)))); ?>
    <?php if ($donos !== []): ?>
      <details class="folga">
        <summary class="btn btn-mini">Combinar uma tarefa</summary>
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="tarefa-nova">
          <?php campo('mu-t', 'titulo', 'O quê', '', ['max' => 140, 'obrigatorio' => true, 'marcador' => 'Levar a caixa de som no sábado']); ?>
          <div class="linha g2">
            <div class="campo">
              <label for="mu-dono">Quem</label>
              <select id="mu-dono" name="donoId" required>
                <option value="">— escolha —</option>
                <?php foreach ($donos as $p): ?>
                  <option value="<?= h($p['id']) ?>"<?= $p['id'] === $eu['id'] ? ' selected' : '' ?>><?= h(nome_encoberto($p['nome'])) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <?php campo('mu-ate', 'ate', 'Até', '', ['tipo' => 'date', 'dica' => 'opcional']); ?>
          </div>
          <div class="acoes"><button class="btn btn-ouro" type="submit">Combinar</button></div>
        </form>
      </details>
    <?php endif; ?>
  </fieldset>

  <?php
  abrir_modal('registrar', 'O que fizemos', !empty($_GET['registrar']));
  form_abre('entrega', $unidade['id']);
  campo('mr-t', 'texto', 'O que foi feito', '', ['max' => 200, 'obrigatorio' => true, 'marcador' => 'Escuta na praça, 14 pessoas, 3 demandas anotadas']);
  echo '<div class="linha g2">';
  campo('mr-d', 'data', 'Quando', hoje_ce(), ['tipo' => 'date', 'limite' => hoje_ce(), 'obrigatorio' => true]);
  campo('mr-n', 'pessoas', 'Quantas pessoas', '', ['tipo' => 'number', 'dica' => 'opcional']);
  echo '</div>';
  form_fecha('Registrar');
  fechar_modal();

  abrir_modal('proxima', 'Próxima atividade', !empty($_GET['proxima']));
  echo '<p class="dica">Vira um encontro: entra na agenda, com o QR da porta e a confirmação de presença.</p>';
  form_abre('proxima', $unidade['id']);
  campo('mp-t', 'titulo', 'O quê', '', ['max' => 120, 'marcador' => 'Encontro aberto de apresentação']);
  echo '<div class="linha g2">';
  campo('mp-d', 'dia', 'Dia', '', ['tipo' => 'date', 'obrigatorio' => true]);
  campo('mp-h', 'hora', 'Hora', '', ['tipo' => 'time', 'dica' => 'opcional']);
  echo '</div>';
  campo('mp-l', 'local', 'Onde', '', ['max' => 120, 'dica' => 'opcional']);
  form_fecha('Marcar');
  fechar_modal();
  ?>
</div>
    <?php
    fechar_pagina();
}
