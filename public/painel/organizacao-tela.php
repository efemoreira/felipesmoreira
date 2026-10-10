<?php
declare(strict_types=1);

/**
 * A tela da Organização — três abas, três frentes do plano.
 *
 *   nucleos  onde a militância atua: bairro, cidade, universidade
 *   temas    sobre o quê ela atua: um tema, um grupo, três portas
 *   liga     quem fala por ela: a Liga dos Porta-vozes, níveis e placar
 *
 * Duas listas continuam em abas; o que se empilha são os itens. Editar, abrir
 * e registrar entrega são modais — a lista é a mesa, a ficha vem por cima.
 */

require_once __DIR__ . '/organizacao-comum.php';
require_once __DIR__ . '/layout.php';

/** Quem pode ser responsável, substituto ou porta-voz: gente que já entrou. */
function pessoas_para_organizacao(): array
{
    $gente = array_values(array_filter(ler_pessoas(), fn ($p) =>
        $p['status'] !== 'recusada'
        && (tem_conta($p) || in_array($p['tipo'], ['militante', 'coordenador', 'candidato'], true))
    ));
    usort($gente, fn ($a, $b) => sem_acento($a['nome']) <=> sem_acento($b['nome']));
    return $gente;
}

/** Um <select> de pessoa, com "ninguém" no topo. */
function select_pessoa(string $id, string $nome, string $valor, array $gente, string $vazio = '— ninguém ainda —'): void
{
    ?>
    <select id="<?= h($id) ?>" name="<?= h($nome) ?>">
      <option value=""><?= h($vazio) ?></option>
      <?php foreach ($gente as $p): ?>
        <option value="<?= h($p['id']) ?>"<?= $p['id'] === $valor ? ' selected' : '' ?>><?= h($p['nome']) ?></option>
      <?php endforeach; ?>
    </select>
    <?php
}

/** Os campos que núcleo e grupo dividem: dono, ritmo, próxima, contato. */
function campos_da_unidade(string $prefixo, array $u, array $gente): void
{
    ?>
    <div class="linha g2">
      <div class="campo">
        <label for="<?= $prefixo ?>-resp">Responsável</label>
        <?php select_pessoa($prefixo . '-resp', 'responsavelId', $u['responsavelId'] ?? '', $gente); ?>
      </div>
      <div class="campo">
        <label for="<?= $prefixo ?>-subst">Substituto <span class="dica">— assim que possível</span></label>
        <?php select_pessoa($prefixo . '-subst', 'substitutoId', $u['substitutoId'] ?? '', $gente); ?>
      </div>
    </div>
    <div class="linha g3">
      <div class="campo">
        <label for="<?= $prefixo ?>-ritmo">Ritmo</label>
        <select id="<?= $prefixo ?>-ritmo" name="ritmo">
          <?php foreach (RITMOS as $k => $rotulo): ?>
            <option value="<?= h($k) ?>"<?= ($u['ritmo'] ?? 'mensal') === $k ? ' selected' : '' ?>><?= h($rotulo) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="campo">
        <label for="<?= $prefixo ?>-prox">Próxima atividade</label>
        <input id="<?= $prefixo ?>-prox" type="date" name="proximaData" value="<?= h($u['proximaData'] ?? '') ?>">
      </div>
      <div class="campo">
        <label for="<?= $prefixo ?>-proxt">O quê</label>
        <input id="<?= $prefixo ?>-proxt" type="text" name="proximaTexto" maxlength="140"
               value="<?= h($u['proximaTexto'] ?? '') ?>" placeholder="Encontro aberto de apresentação">
      </div>
    </div>
    <div class="campo">
      <label for="<?= $prefixo ?>-contato">Contato público <span class="dica">— link https (grupo de WhatsApp, canal)</span></label>
      <input id="<?= $prefixo ?>-contato" type="url" name="contato" maxlength="200"
             value="<?= h($u['contato'] ?? '') ?>" placeholder="https://chat.whatsapp.com/…">
      <p class="dica">Nunca o telefone de uma pessoa: o site não mostra contato pessoal.</p>
    </div>
    <div class="campo">
      <label for="<?= $prefixo ?>-evid">Evidência do nível <span class="dica">— o que mostra que ele está onde está</span></label>
      <input id="<?= $prefixo ?>-evid" type="text" name="evidencia" maxlength="200" value="<?= h($u['evidencia'] ?? '') ?>">
    </div>
    <label class="check">
      <input type="checkbox" name="publicado" value="1"<?= !empty($u['publicado']) ? ' checked' : '' ?>>
      Aparece no site (sem nome de ninguém — só o lugar, o ritmo e o contato)
    </label>
    <?php
}

/** O selo de estado de uma unidade: ativa, parada (com o que falta) ou encerrada. */
function selo_da_unidade(array $u): void
{
    if ($u['encerradoEm'] !== '') {
        echo '<span class="selo selo-cinza">Encerrado</span>';
    } elseif (unidade_ativa($u)) {
        echo '<span class="selo selo-ok">Ativo</span>';
    } else {
        echo '<span class="selo selo-atencao">Parado</span> <span class="dica">falta '
            . h(implode(', ', o_que_falta($u))) . '</span>';
    }
}

function tela_de_organizacao(?string $erro, ?string $ok): void
{
    $nucleos = ler_nucleos();
    $grupos  = ler_grupos();
    $liga    = ler_liga();
    $gente   = pessoas_para_organizacao();
    $nomes   = array_column(ler_pessoas(), 'nome', 'id');

    $abas = [
        'nucleos' => ['nome' => 'Núcleos',          'conta' => count(so_abertas($nucleos))],
        'temas'   => ['nome' => 'Grupos temáticos', 'conta' => count(so_abertas($grupos))],
        'liga'    => ['nome' => 'Liga',             'conta' => count(array_filter($liga, fn ($p) => $p['encerradoEm'] === ''))],
    ];
    $aba = (string) ($_GET['aba'] ?? '');
    if (!isset($abas[$aba])) {
        $aba = 'nucleos';
    }

    abrir_pagina('Organização');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Organização',
      'Onde a militância atua, sobre o quê e quem fala por ela. <strong>Ativo é quem entrega</strong>, não quem existe na lista.',
      null,
      '/painel/organizacao',
      [
          'Núcleo é lugar (bairro, cidade, universidade); grupo temático é assunto. Uma pessoa pode estar nos dois.',
          'Ativo = responsável + entrega registrada nos últimos 31 dias + próxima atividade marcada. Faltou uma, está parado.',
          'Um tema, um grupo: categoria profissional e movimento são portas do grupo, não grupos à parte.',
          'Liga: o nível é calculado pelo fechamento do mês e pelas três comprovações (redes, formação, ação local). Sobe-se em ordem.',
          'Encerrar não é fracasso. Encerrado sai das contas e do site; o que entregou continua contado.',
          'O plano inteiro está em felipesmoreira.com/planomissaoce.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php barra_abas($abas, $aba, 'aba', 'Organização'); ?>

  <?php
  if ($aba === 'temas') {
      aba_de_grupos($grupos, $nucleos, $liga, $gente, $nomes);
  } elseif ($aba === 'liga') {
      aba_da_liga($liga, $gente);
  } else {
      aba_de_nucleos($nucleos, $gente, $nomes);
  }
  ?>
</div>
    <?php
    fechar_pagina();
}

/* =================================================================== núcleos */

function aba_de_nucleos(array $nucleos, array $gente, array $nomes): void
{
    $abertos = so_abertas($nucleos);
    $ativos = count(array_filter($abertos, fn ($n) => unidade_ativa($n)));
    $editar = (string) ($_GET['editar'] ?? '');
    $entrega = (string) ($_GET['entrega'] ?? '');
    ?>
  <fieldset id="nucleos">
    <legend>Núcleos territoriais</legend>
    <dl class="resumo-numeros">
      <div><dt>Abertos</dt><dd><?= count($abertos) ?></dd></div>
      <div><dt>Ativos</dt><dd><?= $ativos ?></dd></div>
      <div<?= count($abertos) - $ativos > 0 ? ' class="resumo-alerta"' : '' ?>><dt>Parados</dt><dd><?= count($abertos) - $ativos ?></dd></div>
    </dl>
    <p class="dica folga">
      Crescer por onde o eleitor do 14 já está: onda 1 (Fortaleza e RMF convertidas), onda 2 (Caucaia, Cariri,
      Sobral, Iguatu), onda 3 (bases de candidato). A classificação de cada cidade e bairro está em
      <a href="/resultados#explorar">/resultados</a>, aba Decisões.
    </p>
    <div class="acoes">
      <?php botao_modal('nucleo-novo', 'Novo núcleo', 'novo=nucleo'); ?>
    </div>

    <?php if ($nucleos === []): ?>
      <?php vazio('Nenhum núcleo ainda. Comece pelo que já tem gente: um bairro de Fortaleza na onda 1.',
          ['url' => '?novo=nucleo', 'texto' => 'Criar o primeiro']); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Núcleo</th><th>Onda</th><th>Nível</th><th>Responsável</th><th>Situação</th><th>Última entrega</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($nucleos as $n): $ultima = ultima_entrega($n); ?>
              <tr id="n-<?= h($n['id']) ?>">
                <td data-rotulo="Núcleo">
                  <strong><?= h($n['nome']) ?></strong>
                  <span class="dica"><?= h(TIPOS_NUCLEO[$n['tipo']]) ?> · <?= h($n['cidade']) ?><?= $n['bairro'] !== '' ? ' · ' . h($n['bairro']) : '' ?></span>
                </td>
                <td class="terco" data-rotulo="Onda"><?= $n['onda'] === 0 ? 'Mapear' : 'Onda ' . $n['onda'] ?></td>
                <td class="terco" data-rotulo="Nível" title="<?= h(NIVEIS_TERRITORIO[$n['nivel']]['resumo']) ?>">
                  <?= h($n['nivel']) ?> · <?= h(NIVEIS_TERRITORIO[$n['nivel']]['nome']) ?>
                </td>
                <td class="terco" data-rotulo="Responsável">
                  <?= h($nomes[$n['responsavelId']] ?? '—') ?>
                  <?php if ($n['substitutoId'] === '' && $n['encerradoEm'] === ''): ?>
                    <span class="dica">sem substituto</span>
                  <?php endif; ?>
                </td>
                <td class="meia" data-rotulo="Situação"><?php selo_da_unidade($n); ?></td>
                <td class="tarde" data-rotulo="Última entrega">
                  <?= $ultima === null ? '—' : h(data_humana($ultima['data']) . ' · ' . $ultima['texto']) ?>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php menu_acoes(array_values(array_filter([
                      ['texto' => 'Registrar entrega', 'url' => '?entrega=' . $n['id'], 'modal' => 'entrega-' . $n['id']],
                      ['texto' => 'Editar', 'url' => '?editar=' . $n['id'], 'modal' => 'nucleo-' . $n['id']],
                      $n['encerradoEm'] === ''
                          ? ['texto' => 'Encerrar', 'acao' => 'encerrar', 'campos' => ['tipo' => 'nucleo', 'id' => $n['id']],
                             'confirmar' => 'Encerrar o núcleo ' . $n['nome'] . '? Ele sai das contas e do site.', 'risco' => true]
                          : ['texto' => 'Reabrir', 'acao' => 'reabrir', 'campos' => ['tipo' => 'nucleo', 'id' => $n['id']]],
                  ]))); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset>
    <legend>Classificação territorial</legend>
    <p class="dica colado">Ferramenta interna de gestão, não classificação jurídica. Contatos e seguidores não contam como presença organizada.</p>
    <dl class="resumo-numeros">
      <?php foreach (NIVEIS_TERRITORIO as $k => $nv): ?>
        <div title="Próximo passo: <?= h($nv['proximo']) ?>">
          <dt><?= h($k . ' · ' . $nv['nome']) ?></dt>
          <dd><?= count(array_filter($nucleos, fn ($n) => $n['encerradoEm'] === '' && $n['nivel'] === $k)) ?></dd>
        </div>
      <?php endforeach; ?>
    </dl>
  </fieldset>

  <?php
  modal_de_nucleo(null, $gente, ($_GET['novo'] ?? '') === 'nucleo');
  foreach ($nucleos as $n) {
      modal_de_nucleo($n, $gente, $editar === $n['id']);
      modal_de_entrega('nucleo', $n, $entrega === $n['id']);
  }
}

function modal_de_nucleo(?array $n, array $gente, bool $aberto): void
{
    $id = $n === null ? 'nucleo-novo' : 'nucleo-' . $n['id'];
    $p = $n === null ? 'nn' : 'n' . substr(md5($n['id']), 0, 6);
    abrir_modal($id, $n === null ? 'Novo núcleo' : 'Núcleo ' . $n['nome'], $aberto);
    ?>
    <form method="post"<?= $n === null ? ' data-rascunho="nucleo-novo"' : '' ?>>
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="nucleo-salvar">
      <input type="hidden" name="id" value="<?= h($n['id'] ?? '') ?>">
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-nome">Nome</label>
          <input id="<?= $p ?>-nome" type="text" name="nome" maxlength="80" required
                 value="<?= h($n['nome'] ?? '') ?>" placeholder="Benfica">
        </div>
        <div class="campo">
          <label for="<?= $p ?>-tipo">Tipo</label>
          <select id="<?= $p ?>-tipo" name="tipo">
            <?php foreach (TIPOS_NUCLEO as $k => $rotulo): ?>
              <option value="<?= h($k) ?>"<?= ($n['tipo'] ?? 'bairro') === $k ? ' selected' : '' ?>><?= h($rotulo) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-cidade">Cidade</label>
          <?php campo_cidade($p . '-cidade', 'cidade', $n['cidade'] ?? '', 'Escolha a cidade', true); ?>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-bairro">Bairro <span class="dica">— opcional</span></label>
          <input id="<?= $p ?>-bairro" type="text" name="bairro" maxlength="60" value="<?= h($n['bairro'] ?? '') ?>">
        </div>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-onda">Onda</label>
          <select id="<?= $p ?>-onda" name="onda">
            <?php foreach (ONDAS as $k => $rotulo): ?>
              <option value="<?= $k ?>"<?= (int) ($n['onda'] ?? 0) === $k ? ' selected' : '' ?>><?= h($rotulo) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-nivel">Nível</label>
          <select id="<?= $p ?>-nivel" name="nivel">
            <?php foreach (NIVEIS_TERRITORIO as $k => $nv): ?>
              <option value="<?= h($k) ?>"<?= ($n['nivel'] ?? 'T0') === $k ? ' selected' : '' ?>><?= h($k . ' · ' . $nv['nome']) ?></option>
            <?php endforeach; ?>
          </select>
          <p class="dica">Subir exige dois ciclos mensais seguidos cumprindo o critério.</p>
        </div>
      </div>
      <?php campos_da_unidade($p, $n ?? [], $gente); ?>
      <div class="acoes"><button class="btn btn-ouro" type="submit">Salvar</button></div>
    </form>
    <?php
    fechar_modal();
}

/** Registrar o que foi feito — e, no mesmo gesto, marcar a próxima. */
function modal_de_entrega(string $tipo, array $u, bool $aberto): void
{
    $nome = $tipo === 'grupo' ? TEMAS_GRUPO[$u['tema']]['nome'] : $u['nome'];
    $p = 'e' . substr(md5($u['id']), 0, 6);
    abrir_modal('entrega-' . $u['id'], 'Entrega · ' . $nome, $aberto);
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="entrega">
      <input type="hidden" name="tipo" value="<?= h($tipo) ?>">
      <input type="hidden" name="id" value="<?= h($u['id']) ?>">
      <div class="campo">
        <label for="<?= $p ?>-texto">O que foi entregue</label>
        <input id="<?= $p ?>-texto" type="text" name="texto" maxlength="200" required
               placeholder="Escuta de problemas na praça, 14 pessoas, 3 demandas anotadas">
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-data">Quando</label>
          <input id="<?= $p ?>-data" type="date" name="data" value="<?= h(hoje_ce()) ?>" max="<?= h(hoje_ce()) ?>" required>
          <p class="dica">Até 7 dias depois da atividade.</p>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-pessoas">Quantas pessoas <span class="dica">— opcional</span></label>
          <input id="<?= $p ?>-pessoas" type="number" name="pessoas" min="0" inputmode="numeric">
        </div>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-prox">Próxima atividade</label>
          <input id="<?= $p ?>-prox" type="date" name="proximaData" value="<?= h($u['proximaData']) ?>">
        </div>
        <div class="campo">
          <label for="<?= $p ?>-proxt">O quê</label>
          <input id="<?= $p ?>-proxt" type="text" name="proximaTexto" maxlength="140" value="<?= h($u['proximaTexto']) ?>">
        </div>
      </div>
      <div class="acoes"><button class="btn btn-ouro" type="submit">Registrar</button></div>
    </form>
    <?php
    fechar_modal();
}

/* =================================================================== grupos */

function aba_de_grupos(array $grupos, array $nucleos, array $liga, array $gente, array $nomes): void
{
    $abertos = so_abertas($grupos);
    $editar = (string) ($_GET['editar'] ?? '');
    $entrega = (string) ($_GET['entrega'] ?? '');
    $novoTema = (string) ($_GET['novo'] ?? '');
    ?>
  <fieldset id="temas">
    <legend>Grupos temáticos</legend>
    <p class="dica folga">
      <strong>Um tema, um grupo.</strong> Cada grupo tem três portas: <em>estudo</em> (entende o problema e produz
      conteúdo), <em>profissionais</em> (quem trabalha na área) e <em>movimento</em> (a ação pública, junto com os
      núcleos). Comece com no máximo <?= TETO_TEMAS_ABERTOS ?>.
    </p>
    <?php if (count($abertos) > TETO_TEMAS_ABERTOS): ?>
      <div class="msg msg-erro">
        <?= count($abertos) ?> grupos abertos. O plano pediu no máximo <?= TETO_TEMAS_ABERTOS ?> no começo —
        grupo aberto sem gente é organograma vazio.
      </div>
    <?php endif; ?>

    <?php if ($grupos !== []): ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Tema</th><th>Maturidade</th><th>Responsável</th><th>Situação</th><th>Primeira entrega</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($grupos as $g): ?>
              <tr id="g-<?= h($g['id']) ?>">
                <td data-rotulo="Tema">
                  <strong><?= h(TEMAS_GRUPO[$g['tema']]['nome']) ?></strong>
                  <span class="dica"><?= h($g['finalidade']) ?></span>
                </td>
                <td class="terco" data-rotulo="Maturidade" title="<?= h(MATURIDADE[$g['maturidade']]['resumo']) ?>">
                  <?= $g['maturidade'] ?> · <?= h(MATURIDADE[$g['maturidade']]['nome']) ?>
                </td>
                <td class="terco" data-rotulo="Responsável">
                  <?= h($nomes[$g['responsavelId']] ?? '—') ?>
                  <?php if ($g['substitutoId'] === '' && $g['encerradoEm'] === ''): ?>
                    <span class="dica">sem substituto</span>
                  <?php endif; ?>
                </td>
                <td class="meia" data-rotulo="Situação"><?php selo_da_unidade($g); ?></td>
                <td class="tarde" data-rotulo="Primeira entrega">
                  <?= h($g['primeiraEntrega']) ?>
                  <span class="dica">até <?= h(data_humana($g['primeiraEntregaAte'])) ?></span>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php menu_acoes(array_values(array_filter([
                      ['texto' => 'Registrar entrega', 'url' => '?aba=temas&entrega=' . $g['id'], 'modal' => 'entrega-' . $g['id']],
                      ['texto' => 'Editar', 'url' => '?aba=temas&editar=' . $g['id'], 'modal' => 'grupo-' . $g['id']],
                      $g['encerradoEm'] === ''
                          ? ['texto' => 'Encerrar', 'acao' => 'encerrar', 'campos' => ['tipo' => 'grupo', 'id' => $g['id']],
                             'confirmar' => 'Encerrar o grupo ' . TEMAS_GRUPO[$g['tema']]['nome'] . '?', 'risco' => true]
                          : ['texto' => 'Reabrir', 'acao' => 'reabrir', 'campos' => ['tipo' => 'grupo', 'id' => $g['id']]],
                  ]))); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset id="catalogo">
    <legend>Catálogo de temas</legend>
    <p class="dica colado">
      Antes de abrir: finalidade, responsável e primeira entrega em 30 a 60 dias. Sem isso o tema fica aqui como prioridade futura.
    </p>
    <div class="rolagem cartoes">
      <table class="tabela">
        <thead><tr><th>Tema</th><th>Estudo</th><th>Profissionais</th><th>Movimento</th><th></th></tr></thead>
        <tbody>
          <?php foreach (TEMAS_GRUPO as $chave => $t): $aberto = grupo_aberto_do_tema($chave, $grupos); ?>
            <tr>
              <td data-rotulo="Tema"><strong><?= h($t['nome']) ?></strong></td>
              <td class="tarde" data-rotulo="Estudo"><?= h($t['estudo']) ?></td>
              <td class="tarde" data-rotulo="Profissionais"><?= h($t['profissionais']) ?></td>
              <td class="tarde" data-rotulo="Movimento"><?= h($t['movimento']) ?></td>
              <td class="rodape" data-rotulo="">
                <?php if ($aberto === null): ?>
                  <?php botao_modal('grupo-novo-' . $chave, 'Abrir grupo', 'aba=temas&novo=' . $chave, 'btn btn-mini'); ?>
                <?php else: ?>
                  <span class="selo selo-ok">Aberto</span>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </fieldset>

  <fieldset>
    <legend>Maturidade · 0 a 4</legend>
    <dl class="resumo-numeros">
      <?php foreach (MATURIDADE as $k => $m): ?>
        <div title="Próximo passo: <?= h($m['proximo']) ?>">
          <dt><?= h($k . ' · ' . $m['nome']) ?></dt>
          <dd><?= count(array_filter($abertos, fn ($g) => $g['maturidade'] === $k)) ?></dd>
        </div>
      <?php endforeach; ?>
    </dl>
  </fieldset>

  <?php
  foreach (TEMAS_GRUPO as $chave => $t) {
      if (grupo_aberto_do_tema($chave, $grupos) === null) {
          modal_de_grupo(null, $chave, $nucleos, $liga, $gente, $novoTema === $chave);
      }
  }
  foreach ($grupos as $g) {
      modal_de_grupo($g, $g['tema'], $nucleos, $liga, $gente, $editar === $g['id']);
      modal_de_entrega('grupo', $g, $entrega === $g['id']);
  }
}

function modal_de_grupo(?array $g, string $tema, array $nucleos, array $liga, array $gente, bool $aberto): void
{
    $t = TEMAS_GRUPO[$tema];
    $id = $g === null ? 'grupo-novo-' . $tema : 'grupo-' . $g['id'];
    $p = 'g' . substr(md5($id), 0, 6);
    abrir_modal($id, ($g === null ? 'Abrir grupo · ' : 'Grupo · ') . $t['nome'], $aberto);
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="grupo-salvar">
      <input type="hidden" name="id" value="<?= h($g['id'] ?? '') ?>">
      <input type="hidden" name="tema" value="<?= h($tema) ?>">
      <div class="campo">
        <label for="<?= $p ?>-fin">Finalidade</label>
        <input id="<?= $p ?>-fin" type="text" name="finalidade" maxlength="200" required
               value="<?= h($g['finalidade'] ?? '') ?>" placeholder="Para que este grupo existe neste ano">
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-pri">Primeira entrega</label>
          <input id="<?= $p ?>-pri" type="text" name="primeiraEntrega" maxlength="140" required
                 value="<?= h($g['primeiraEntrega'] ?? '') ?>" placeholder="Diagnóstico das UPAs de um bairro">
        </div>
        <div class="campo">
          <label for="<?= $p ?>-ate">Até <span class="dica">— 30 a 60 dias</span></label>
          <input id="<?= $p ?>-ate" type="date" name="primeiraEntregaAte" required
                 value="<?= h($g['primeiraEntregaAte'] ?? (new DateTimeImmutable(hoje_ce()))->modify('+45 days')->format('Y-m-d')) ?>">
        </div>
      </div>
      <div class="campo">
        <label for="<?= $p ?>-est">Porta estudo</label>
        <input id="<?= $p ?>-est" type="text" name="portaEstudo" maxlength="200"
               value="<?= h($g['portaEstudo'] ?? $t['estudo']) ?>">
      </div>
      <div class="campo">
        <label for="<?= $p ?>-prof">Porta profissionais</label>
        <input id="<?= $p ?>-prof" type="text" name="portaProfissionais" maxlength="200"
               value="<?= h($g['portaProfissionais'] ?? $t['profissionais']) ?>">
        <?php if ($t['redes'] !== []): ?>
          <p class="dica">Quem convidar: as redes <?= h(implode(', ', array_map(fn ($r) => REDES[$r]['nome'], $t['redes']))) ?> da ficha de pessoas.</p>
        <?php endif; ?>
      </div>
      <div class="campo">
        <label for="<?= $p ?>-mov">Porta movimento</label>
        <input id="<?= $p ?>-mov" type="text" name="portaMovimento" maxlength="200"
               value="<?= h($g['portaMovimento'] ?? $t['movimento']) ?>">
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-mat">Maturidade</label>
          <select id="<?= $p ?>-mat" name="maturidade">
            <?php foreach (MATURIDADE as $k => $m): ?>
              <option value="<?= $k ?>"<?= (int) ($g['maturidade'] ?? 1) === $k ? ' selected' : '' ?>><?= h($k . ' · ' . $m['nome']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-pv">Porta-voz do tema <span class="dica">— opcional</span></label>
          <select id="<?= $p ?>-pv" name="portaVozId">
            <option value="">— nenhum —</option>
            <?php foreach ($liga as $pv): if ($pv['encerradoEm'] !== '') { continue; } ?>
              <option value="<?= h($pv['id']) ?>"<?= ($g['portaVozId'] ?? '') === $pv['id'] ? ' selected' : '' ?>><?= h($pv['nome']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
      <?php $comNucleo = array_values(array_filter($nucleos, fn ($n) => $n['encerradoEm'] === '')); ?>
      <?php if ($comNucleo !== []): ?>
        <fieldset>
          <legend>Núcleos parceiros</legend>
          <?php foreach ($comNucleo as $n): ?>
            <label class="check">
              <input type="checkbox" name="nucleos[]" value="<?= h($n['id']) ?>"<?= in_array($n['id'], $g['nucleos'] ?? [], true) ? ' checked' : '' ?>>
              <?= h($n['nome']) ?> <span class="dica"><?= h($n['cidade']) ?></span>
            </label>
          <?php endforeach; ?>
        </fieldset>
      <?php endif; ?>
      <?php campos_da_unidade($p, $g ?? [], $gente); ?>
      <div class="acoes"><button class="btn btn-ouro" type="submit"><?= $g === null ? 'Abrir o grupo' : 'Salvar' ?></button></div>
    </form>
    <?php
    fechar_modal();
}

/* =================================================================== Liga */

function aba_da_liga(array $liga, array $gente): void
{
    $ativos = array_values(array_filter($liga, fn ($p) => $p['encerradoEm'] === ''));
    $mesPassado = (new DateTimeImmutable(hoje_ce()))->modify('first day of last month')->format('Y-m');
    $mes = mes_valido($_GET['mes-placar'] ?? '') ?: $mesPassado;
    $placar = placar_da_liga($liga, $mes);
    $abrirPv = (string) ($_GET['pv'] ?? '');
    $abrirMes = (string) ($_GET['fechar'] ?? '');
    ?>
  <fieldset id="liga">
    <legend>Liga dos Porta-vozes</legend>
    <p class="dica folga">
      Porta-voz atua nas redes e na rua. Sobe quem cresce nas redes <strong>e</strong> faz ação real — seguidor
      sem ação não basta, e ação sem alcance também não. Seguidor ou engajamento comprado elimina da Liga.
    </p>
    <dl class="resumo-numeros">
      <?php foreach (array_reverse(NIVEIS_LIGA, true) as $k => $nv): ?>
        <div title="<?= h($nv['exige']) ?>">
          <dt><?= h($k . ' · ' . $nv['nome']) ?></dt>
          <dd><?= count(array_filter($ativos, fn ($pv) => nivel_liga($pv)['nivel'] === $k)) ?></dd>
        </div>
      <?php endforeach; ?>
    </dl>
    <div class="acoes">
      <?php botao_modal('pv-novo', 'Pôr na Liga', 'aba=liga&pv=novo'); ?>
    </div>

    <?php if ($liga === []): ?>
      <?php vazio('Ninguém na Liga ainda. Comece pelos candidatos de 2026: já têm voto e reconhecimento onde fizeram campanha.',
          ['url' => '?aba=liga&pv=novo', 'texto' => 'Pôr o primeiro']); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Porta-voz</th><th>Nível</th><th>Seguidores</th><th>Engajamento</th><th>Para subir</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($liga as $pv): $nv = nivel_liga($pv); $m = ultimo_mes($pv); ?>
              <tr id="pv-<?= h($pv['id']) ?>">
                <td data-rotulo="Porta-voz">
                  <strong><?= h($pv['nome']) ?></strong>
                  <span class="dica">
                    <?= $pv['tema'] !== '' ? h(TEMAS_GRUPO[$pv['tema']]['nome']) : 'sem tema' ?>
                    <?= $pv['cidade'] !== '' ? ' · ' . h($pv['cidade']) : '' ?>
                  </span>
                  <?php if ($pv['encerradoEm'] !== ''): ?>
                    <span class="selo selo-cinza">Fora da Liga</span>
                    <?php if ($pv['encerradoMotivo'] !== ''): ?><span class="dica"><?= h($pv['encerradoMotivo']) ?></span><?php endif; ?>
                  <?php elseif (suspeita_de_compra($pv)): ?>
                    <span class="selo selo-off">Conferir: salto com engajamento baixo</span>
                  <?php elseif (liga_parada($pv)): ?>
                    <span class="selo selo-atencao">Dois trimestres sem crescer</span>
                  <?php endif; ?>
                  <?php if ($pv['publicado'] && $pv['encerradoEm'] === ''): ?>
                    <span class="selo selo-publicado">No site</span>
                  <?php endif; ?>
                </td>
                <td class="terco" data-rotulo="Nível"><strong><?= h($nv['nivel']) ?></strong> · <?= h(NIVEIS_LIGA[$nv['nivel']]['nome']) ?></td>
                <td class="terco" data-rotulo="Seguidores">
                  <?= number_format(seguidores_de($pv), 0, ',', '.') ?>
                  <span class="dica"><?= $m === null ? 'sem fechamento' : h($m['mes']) ?></span>
                </td>
                <td class="terco" data-rotulo="Engajamento"><?= $m === null ? '—' : h(number_format($m['engajamento'], 1, ',', '.')) . '%' ?></td>
                <td class="tarde" data-rotulo="Para subir">
                  <?php if ($nv['proximo'] === ''): ?>
                    Topo da Liga. Manter, e mentorar alguém de E ou D.
                  <?php else: ?>
                    <strong><?= h($nv['proximo']) ?>:</strong> <?= h(implode(' · ', $nv['falta'])) ?>
                  <?php endif; ?>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php menu_acoes(array_values(array_filter([
                      $pv['encerradoEm'] === '' ? ['texto' => 'Fechar o mês', 'url' => '?aba=liga&fechar=' . $pv['id'], 'modal' => 'mes-' . $pv['id']] : null,
                      ['texto' => 'Ficha', 'url' => '?aba=liga&pv=' . $pv['id'], 'modal' => 'pv-' . $pv['id']],
                      $pv['encerradoEm'] === ''
                          ? ['texto' => 'Tirar da Liga', 'acao' => 'pv-encerrar', 'campos' => ['id' => $pv['id'], 'motivo' => 'Saiu pela coordenação'],
                             'confirmar' => 'Tirar ' . $pv['nome'] . ' da Liga? Sai também do site.', 'risco' => true]
                          : null,
                  ]))); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <fieldset id="placar">
    <legend>Placar de <?= h($mes) ?></legend>
    <p class="dica colado">
      Crescimento até 40 · engajamento até 20 · ações reais até 30 (ação local 20, módulo 10, live 5) · constância 10.
      Os três primeiros de cada nível ganham collab com o perfil oficial e convite para a live estadual.
    </p>
    <?php $algum = array_filter($placar); ?>
    <?php if ($algum === []): ?>
      <?php vazio('Ninguém fechou ' . $mes . ' ainda. O placar sai do fechamento do mês.'); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Nível</th><th>Porta-voz</th><th>Total</th><th>Crescimento</th><th>Engajamento</th><th>Ações</th><th>Constância</th></tr></thead>
          <tbody>
            <?php foreach ($placar as $nivel => $linhas): foreach ($linhas as $i => $l): ?>
              <tr>
                <td class="terco" data-rotulo="Nível"><?= h($nivel) ?> · <?= $i + 1 ?>º<?= $i < 3 ? ' ★' : '' ?></td>
                <td data-rotulo="Porta-voz"><strong><?= h($l['pv']['nome']) ?></strong></td>
                <td class="terco" data-rotulo="Total"><strong><?= $l['placar']['total'] ?></strong></td>
                <td class="terco" data-rotulo="Crescimento"><?= $l['placar']['crescimento'] ?> <span class="dica"><?= h(number_format($l['placar']['crescimentoPct'], 1, ',', '.')) ?>%</span></td>
                <td class="terco" data-rotulo="Engajamento"><?= $l['placar']['engajamento'] ?></td>
                <td class="terco" data-rotulo="Ações"><?= $l['placar']['acoes'] ?></td>
                <td class="terco" data-rotulo="Constância"><?= $l['placar']['constancia'] ?></td>
              </tr>
            <?php endforeach; endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <?php
  modal_de_porta_voz(null, $gente, $abrirPv === 'novo');
  foreach ($liga as $pv) {
      modal_de_porta_voz($pv, $gente, $abrirPv === $pv['id']);
      if ($pv['encerradoEm'] === '') {
          modal_de_mes($pv, $mesPassado, $abrirMes === $pv['id']);
      }
  }
}

function modal_de_porta_voz(?array $pv, array $gente, bool $aberto): void
{
    $id = $pv === null ? 'pv-novo' : 'pv-' . $pv['id'];
    $p = 'p' . substr(md5($id), 0, 6);
    abrir_modal($id, $pv === null ? 'Pôr na Liga' : 'Ficha · ' . $pv['nome'], $aberto);
    ?>
    <form method="post"<?= $pv === null ? ' data-rascunho="pv-novo"' : '' ?>>
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="pv-salvar">
      <input type="hidden" name="id" value="<?= h($pv['id'] ?? '') ?>">
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-pessoa">Quem é <span class="dica">— a ficha da pessoa</span></label>
          <?php select_pessoa($p . '-pessoa', 'pessoaId', $pv['pessoaId'] ?? '', $gente, '— escolha —'); ?>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-nome">Nome público</label>
          <input id="<?= $p ?>-nome" type="text" name="nome" maxlength="80"
                 value="<?= h($pv['nome'] ?? '') ?>" placeholder="Em branco, usa o da ficha">
        </div>
      </div>
      <div class="linha g3">
        <div class="campo">
          <label for="<?= $p ?>-tema">A voz de que tema</label>
          <select id="<?= $p ?>-tema" name="tema">
            <option value="">— escolha —</option>
            <?php foreach (TEMAS_GRUPO as $k => $t): ?>
              <option value="<?= h($k) ?>"<?= ($pv['tema'] ?? '') === $k ? ' selected' : '' ?>><?= h($t['nome']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-cidade">E de que lugar</label>
          <?php campo_cidade($p . '-cidade', 'cidade', $pv['cidade'] ?? ''); ?>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-bairro">Bairro <span class="dica">— opcional</span></label>
          <input id="<?= $p ?>-bairro" type="text" name="bairro" maxlength="60" value="<?= h($pv['bairro'] ?? '') ?>">
        </div>
      </div>
      <div class="linha g2">
        <?php foreach (REDES_LIGA as $r => $rotulo): ?>
          <div class="campo">
            <label for="<?= $p ?>-<?= $r ?>"><?= h($rotulo) ?> <span class="dica">— o @</span></label>
            <input id="<?= $p ?>-<?= $r ?>" type="text" name="perfis[<?= $r ?>]" maxlength="60"
                   value="<?= h($pv['perfis'][$r] ?? '') ?>" autocapitalize="off" spellcheck="false">
          </div>
        <?php endforeach; ?>
      </div>
      <fieldset>
        <legend>Comprovações — a coordenação marca</legend>
        <label class="check">
          <input type="checkbox" name="redesEm" value="1"<?= ($pv['redesEm'] ?? '') !== '' ? ' checked' : '' ?>>
          Redes estruturadas: foto, nome padronizado, bio com tema e cidade, link e 3 posts fixados
        </label>
        <label class="check">
          <input type="checkbox" name="formacaoEm" value="1"<?= ($pv['formacaoEm'] ?? '') !== '' ? ' checked' : '' ?>>
          Concluiu a formação de militância (certificado da frente de formação)
        </label>
        <label class="check">
          <input type="checkbox" name="acaoEm" value="1"<?= ($pv['acaoEm'] ?? '') !== '' ? ' checked' : '' ?>>
          Liderou uma ação local registrada, com 20 pessoas ou mais
        </label>
        <div class="campo">
          <label for="<?= $p ?>-acao">Qual ação <span class="dica">— o que, onde, quantas pessoas</span></label>
          <input id="<?= $p ?>-acao" type="text" name="acaoTexto" maxlength="160" value="<?= h($pv['acaoTexto'] ?? '') ?>">
        </div>
      </fieldset>
      <label class="check">
        <input type="checkbox" name="publicado" value="1"<?= !empty($pv['publicado']) ? ' checked' : '' ?>>
        Aparece em /portavozes (com autorização dele: nome público, tema, cidade, nível e perfis)
      </label>
      <div class="acoes"><button class="btn btn-ouro" type="submit">Salvar</button></div>
    </form>
    <?php
    fechar_modal();
}

/** O fechamento do mês — o que o placar e o nível leem. */
function modal_de_mes(array $pv, string $mesPadrao, bool $aberto): void
{
    $p = 'm' . substr(md5($pv['id']), 0, 6);
    $ultimo = ultimo_mes($pv);
    abrir_modal('mes-' . $pv['id'], 'Fechar o mês · ' . $pv['nome'], $aberto);
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="pv-mes">
      <input type="hidden" name="id" value="<?= h($pv['id']) ?>">
      <div class="campo">
        <label for="<?= $p ?>-mes">Mês</label>
        <input id="<?= $p ?>-mes" type="month" name="mes" value="<?= h($mesPadrao) ?>" max="<?= h(substr(hoje_ce(), 0, 7)) ?>" required>
        <p class="dica">Fechar de novo o mesmo mês corrige o que estava lá.</p>
      </div>
      <div class="linha g2">
        <?php foreach (REDES_LIGA as $r => $rotulo): ?>
          <div class="campo">
            <label for="<?= $p ?>-<?= $r ?>">Seguidores no <?= h($rotulo) ?></label>
            <input id="<?= $p ?>-<?= $r ?>" type="number" name="redes[<?= $r ?>]" min="0" inputmode="numeric"
                   value="<?= (int) ($ultimo['redes'][$r] ?? 0) ?>">
          </div>
        <?php endforeach; ?>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="<?= $p ?>-eng">Engajamento médio (%)</label>
          <input id="<?= $p ?>-eng" type="text" inputmode="decimal" name="engajamento" maxlength="6" placeholder="3,4">
          <p class="dica">Interações ÷ seguidores, média dos últimos 30 dias.</p>
        </div>
        <div class="campo">
          <label for="<?= $p ?>-sem">Semanas seguidas com 3 vídeos</label>
          <input id="<?= $p ?>-sem" type="number" name="semanasSeguidas" min="0" inputmode="numeric"
                 value="<?= (int) ($ultimo['semanasSeguidas'] ?? 0) ?>">
        </div>
      </div>
      <label class="check">
        <input type="checkbox" name="todasSemanas" value="1">
        Todas as semanas deste mês com 3 vídeos publicados
      </label>
      <div class="linha g3">
        <div class="campo">
          <label for="<?= $p ?>-acoes">Ações locais</label>
          <input id="<?= $p ?>-acoes" type="number" name="acoes" min="0" value="0" inputmode="numeric">
        </div>
        <div class="campo">
          <label for="<?= $p ?>-mod">Módulos de formação</label>
          <input id="<?= $p ?>-mod" type="number" name="modulos" min="0" value="0" inputmode="numeric">
        </div>
        <div class="campo">
          <label for="<?= $p ?>-lives">Lives</label>
          <input id="<?= $p ?>-lives" type="number" name="lives" min="0" value="0" inputmode="numeric">
        </div>
      </div>
      <div class="acoes"><button class="btn btn-ouro" type="submit">Fechar o mês</button></div>
    </form>
    <?php
    fechar_modal();
}
