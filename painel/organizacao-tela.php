<?php
declare(strict_types=1);

/**
 * A tela da Organização — três abas, três frentes do plano.
 *
 *   nucleos  onde a militância atua: bairro, cidade, universidade
 *   temas    sobre o quê ela atua: um tema, um grupo, três portas
 *   liga     quem fala por ela: a Liga dos Porta-vozes, níveis e placar
 *
 * UMA DECISÃO POR VEZ. A tela de Encontros chegou a ser um formulário de
 * vinte caixas por encontro, e ninguém sabia o que era obrigatório nem o que
 * era para hoje. Aqui cada linha tem UM botão — a ação do dia a dia
 * ("Registrar", "Fechar o mês") — e os três pontinhos guardam o resto, cada
 * item abrindo um formulário curto de uma pergunta só: marcar a próxima,
 * trocar quem responde, validar uma comprovação. A ficha inteira existe, mas é
 * a edição rara, e vem agrupada.
 *
 * Criar também pede só o mínimo: núcleo nasce com nome, cidade e responsável;
 * grupo, com as quatro perguntas do plano; porta-voz, com a pessoa, o tema e o
 * lugar. O resto se preenche quando fizer falta.
 */

require_once __DIR__ . '/organizacao-comum.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/liga-importacao-tela.php';

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
function select_pessoa(string $id, string $nome, string $valor, array $gente, string $vazio = '— ninguém ainda —', bool $obrigatorio = false): void
{
    ?>
    <select id="<?= h($id) ?>" name="<?= h($nome) ?>"<?= $obrigatorio ? ' required' : '' ?>>
      <option value=""><?= h($vazio) ?></option>
      <?php foreach ($gente as $p): ?>
        <option value="<?= h($p['id']) ?>"<?= $p['id'] === $valor ? ' selected' : '' ?>><?= h($p['nome']) ?></option>
      <?php endforeach; ?>
    </select>
    <?php
}

/** O começo de todo formulário daqui: csrf, ação e id. */
function form_abre(string $acao, string $id = '', array $extra = []): void
{
    echo '<form method="post">';
    echo '<input type="hidden" name="csrf" value="' . h(token()) . '">';
    echo '<input type="hidden" name="acao" value="' . h($acao) . '">';
    echo '<input type="hidden" name="id" value="' . h($id) . '">';
    foreach ($extra as $k => $v) {
        echo '<input type="hidden" name="' . h($k) . '" value="' . h((string) $v) . '">';
    }
}

function form_fecha(string $botao): void
{
    echo '<div class="acoes"><button class="btn btn-ouro" type="submit">' . h($botao) . '</button></div></form>';
}

/** Caixa de marcar que diz "não" também — ver `mesclar_post()`. */
function caixa(string $nome, bool $marcada, string $rotulo): void
{
    echo '<input type="hidden" name="' . h($nome) . '" value="0">';
    echo '<label class="check"><input type="checkbox" name="' . h($nome) . '" value="1"'
        . ($marcada ? ' checked' : '') . '> ' . h($rotulo) . '</label>';
}

/** Um campo de texto com rótulo. */
function campo(string $id, string $nome, string $rotulo, string $valor = '', array $o = []): void
{
    $tipo = $o['tipo'] ?? 'text';
    $dica = $o['dica'] ?? '';
    echo '<div class="campo"><label for="' . h($id) . '">' . h($rotulo)
        . ($dica !== '' ? ' <span class="dica">— ' . h($dica) . '</span>' : '') . '</label>'
        . '<input id="' . h($id) . '" type="' . h($tipo) . '" name="' . h($nome) . '" value="' . h($valor) . '"'
        . (isset($o['max']) ? ' maxlength="' . (int) $o['max'] . '"' : '')
        . (isset($o['limite']) ? ' max="' . h($o['limite']) . '"' : '')
        . (isset($o['marcador']) ? ' placeholder="' . h($o['marcador']) . '"' : '')
        . (!empty($o['obrigatorio']) ? ' required' : '')
        . ($tipo === 'number' ? ' min="0" inputmode="numeric"' : '')
        . '></div>';
}

/** Um <select> a partir de `chave => rótulo`. */
function escolha(string $id, string $nome, string $rotulo, array $opcoes, string $valor): void
{
    echo '<div class="campo"><label for="' . h($id) . '">' . h($rotulo) . '</label><select id="' . h($id) . '" name="' . h($nome) . '">';
    foreach ($opcoes as $k => $r) {
        echo '<option value="' . h((string) $k) . '"' . ((string) $k === $valor ? ' selected' : '') . '>' . h($r) . '</option>';
    }
    echo '</select></div>';
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

/** "15/10 · Escuta aberta", com link para o encontro, ou "—". */
function proxima_da_unidade(array $u): string
{
    $p = proxima_efetiva($u);
    if ($p === null) {
        return '—';
    }
    $texto = h(data_humana($p['data']) . ($p['texto'] !== '' ? ' · ' . $p['texto'] : ''));
    return $p['eventoId'] !== '' ? '<a href="/painel/eventos.php?e=' . h($p['eventoId']) . '">' . $texto . '</a>' : $texto;
}

/** Os três pontinhos de núcleo e grupo — iguais nos dois. */
function menu_da_unidade(string $tipo, array $u, string $qsAba, string $nome): void
{
    $id = $u['id'];
    if ($u['encerradoEm'] !== '') {
        menu_acoes([['texto' => 'Reabrir', 'acao' => 'reabrir', 'campos' => ['tipo' => $tipo, 'id' => $id]]]);
        return;
    }
    $itens = [
        ['texto' => 'Marcar a próxima atividade', 'url' => '?' . $qsAba . 'proxima=' . $id, 'modal' => 'proxima-' . $id],
        ['texto' => 'Quem responde', 'url' => '?' . $qsAba . 'resp=' . $id, 'modal' => 'resp-' . $id],
        ['texto' => 'Quem participa e tarefas', 'url' => '/painel/minha-unidade.php?u=' . rawurlencode($id)],
        ['texto' => 'Ficha completa', 'url' => '?' . $qsAba . 'editar=' . $id, 'modal' => 'ficha-' . $id],
        ['texto' => 'Encerrar', 'acao' => 'encerrar', 'campos' => ['tipo' => $tipo, 'id' => $id],
         'confirmar' => 'Encerrar ' . $nome . '? Sai das contas e do site; o que entregou continua contado.', 'risco' => true],
    ];
    if (in_array($tipo, ['nucleo', 'grupo'], true)) {
        array_splice($itens, 3, 0, [['texto' => 'Avaliar ciclo e crescimento', 'url' => '?' . $qsAba . 'ciclo=' . $id, 'modal' => 'ciclo-' . $id]]);
    }
    menu_acoes($itens);
}

/** Os formulários curtos que núcleo e grupo dividem: registrar, próxima, quem responde. */
function modais_da_unidade(string $tipo, array $u, string $nome, array $gente): void
{
    if (in_array($tipo, ['nucleo', 'grupo'], true)) {
        modal_de_crescimento($tipo, $u, $nome);
    }
    $id = $u['id'];
    $p = substr(md5($id), 0, 6);
    $acaoSalvar = ['grupo' => 'grupo-salvar', 'cultura' => 'cultura-salvar', 'nucleo' => 'nucleo-salvar'][$tipo];

    abrir_modal('entrega-' . $id, 'O que fizemos · ' . $nome, ($_GET['entrega'] ?? '') === $id);
    form_abre('entrega', $id, ['tipo' => $tipo]);
    campo("e$p-t", 'texto', 'O que foi feito', '', ['max' => 200, 'obrigatorio' => true, 'marcador' => 'Escuta na praça, 14 pessoas, 3 demandas anotadas']);
    echo '<div class="linha g2">';
    campo("e$p-d", 'data', 'Quando', hoje_ce(), ['tipo' => 'date', 'limite' => hoje_ce(), 'obrigatorio' => true]);
    campo("e$p-n", 'pessoas', 'Quantas pessoas', '', ['tipo' => 'number', 'dica' => 'opcional']);
    echo '</div>';
    $proxima = proxima_efetiva($u);
    if ($proxima !== null) {
        echo '<p class="dica">Próxima já marcada: <strong>' . h(data_humana($proxima['data']) . ' · ' . $proxima['texto']) . '</strong>.</p>';
    } else {
        /* Sem próxima, ela se marca aqui mesmo — vira um encontro na agenda. */
        echo '<fieldset><legend>E a próxima?</legend><div class="linha g3">';
        campo("e$p-pd", 'proximaData', 'Dia', '', ['tipo' => 'date', 'dica' => 'vira encontro']);
        campo("e$p-ph", 'proximaHora', 'Hora', '', ['tipo' => 'time']);
        campo("e$p-pt", 'proximaTexto', 'O quê', '', ['max' => 120]);
        echo '</div></fieldset>';
    }
    form_fecha('Registrar');
    fechar_modal();

    abrir_modal('proxima-' . $id, 'Próxima atividade · ' . $nome, ($_GET['proxima'] ?? '') === $id);
    $proxima = proxima_efetiva($u);
    if ($proxima !== null && $proxima['eventoId'] !== '') {
        echo '<p class="dica">Já marcada: <a href="/painel/eventos.php?e=' . h($proxima['eventoId']) . '">'
            . h(data_humana($proxima['data']) . ' · ' . $proxima['texto']) . '</a>. Marcar outra cria mais um encontro.</p>';
    }
    echo '<p class="dica">Vira um encontro: entra na agenda' . ($u['publicado'] ? ' do site' : ' (a unidade não está no site, então fica só no painel)')
        . ', com o QR da porta e a confirmação de presença.</p>';
    form_abre('proxima', $id, ['tipo' => $tipo]);
    campo("x$p-t", 'titulo', 'O quê', '', ['max' => 120, 'marcador' => 'Encontro aberto de apresentação']);
    echo '<div class="linha g2">';
    campo("x$p-d", 'dia', 'Dia', '', ['tipo' => 'date', 'obrigatorio' => true]);
    campo("x$p-h", 'hora', 'Hora', '', ['tipo' => 'time', 'dica' => 'opcional']);
    echo '</div>';
    campo("x$p-l", 'local', 'Onde', '', ['max' => 120, 'marcador' => 'Praça do Benfica', 'dica' => 'opcional']);
    form_fecha('Marcar');
    fechar_modal();

    abrir_modal('resp-' . $id, 'Quem responde · ' . $nome, ($_GET['resp'] ?? '') === $id);
    form_abre($acaoSalvar, $id);
    echo '<div class="campo"><label for="r' . $p . '-r">Responsável</label>';
    select_pessoa("r$p-r", 'responsavelId', $u['responsavelId'], $gente, '— escolha —', $tipo === 'grupo');
    echo '</div><div class="campo"><label for="r' . $p . '-s">Substituto <span class="dica">— outra pessoa, que assume se faltar</span></label>';
    select_pessoa("r$p-s", 'substitutoId', $u['substitutoId'], $gente);
    echo '</div>';
    form_fecha('Salvar');
    fechar_modal();
}

function modal_de_crescimento(string $tipo, array $u, string $nome): void
{
    $p = 'c' . substr(md5($u['id']), 0, 6);
    abrir_modal('ciclo-' . $u['id'], 'Crescimento · ' . $nome, ($_GET['ciclo'] ?? '') === $u['id']);
    echo '<p class="dica">A promoção exige os dois últimos meses encerrados, com entrega e avaliação do critério pretendido em cada mês. A coordenação confirma a evidência; o painel confere os ciclos.</p>';
    form_abre('avaliar-ciclo', $u['id'], ['tipo' => $tipo]);
    $meses = meses_de_promocao();
    campo("$p-mes", 'mes', 'Mês encerrado', $meses[1], ['tipo' => 'month', 'limite' => $meses[1], 'obrigatorio' => true]);
    $catalogo = $tipo === 'grupo' ? MATURIDADE : NIVEIS_TERRITORIO;
    $opcoes = [];
    foreach ($catalogo as $nivel => $dados) {
        $grau = $tipo === 'grupo' ? (int) $nivel : (int) substr($nivel, 1);
        $opcoes[$grau] = $nivel . ' · ' . $dados['nome'] . ': ' . $dados['resumo'];
    }
    escolha("$p-nivel", 'nivelAvaliado', 'Critério cumprido neste mês', $opcoes, (string) min(4, grau_da_unidade($u) + 1));
    campo("$p-evid", 'evidenciaCiclo', 'Evidência do critério (resultado, registro ou link)', '', ['max' => 500, 'obrigatorio' => true]);
    form_fecha('Salvar avaliação do mês');
    if (grau_da_unidade($u) < 4) {
        $faltas = faltas_para_promocao($u, grau_da_unidade($u) + 1);
        echo '<p class="dica">' . h($faltas === [] ? 'Pronto para avaliação de promoção. Atualize o nível na ficha completa.' : 'Para subir falta: ' . implode('; ', $faltas)) . '</p>';
    }
    echo '<h3>Avaliações registradas</h3><ul>';
    foreach (array_reverse($u['avaliacoes']) as $a) {
        echo '<li>' . h($a['mes'] . ' · nível ' . $a['nivel'] . ' · ' . $a['evidencia'] . ' · ' . $a['por']) . '</li>';
    }
    echo '</ul><h3>Mudanças de nível</h3><ul>';
    foreach (array_reverse($u['historicoNiveis']) as $h) {
        echo '<li>' . h($h['de'] . ' → ' . $h['para'] . ' · ' . $h['evidencia'] . ' · ' . $h['em'] . ' · ' . $h['por']);
        if ($h['ciclos'] !== []) {
            echo '<details><summary>Evidências na data da promoção</summary><ul>';
            foreach ($h['ciclos'] as $a) {
                echo '<li>' . h($a['mes'] . ' · nível ' . $a['nivel'] . ' · ' . $a['evidencia'] . ' · ' . $a['por']) . '</li>';
            }
            echo '</ul></details>';
        }
        echo '</li>';
    }
    echo '</ul>';
    fechar_modal();
}

/** O bloco "ritmo e site" das fichas completas. */
function campos_ritmo_e_site(string $p, array $u): void
{
    echo '<fieldset><legend>Ritmo e site</legend>';
    escolha("$p-ritmo", 'ritmo', 'Ritmo', RITMOS, $u['ritmo']);
    campo("$p-contato", 'contato', 'Contato público', $u['contato'], ['tipo' => 'url', 'max' => 200, 'dica' => 'link https de grupo ou canal, nunca telefone']);
    caixa('publicado', $u['publicado'], 'Aparece no site — só o lugar, o ritmo e o contato, sem nome de ninguém');
    echo '</fieldset>';
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
        'cultura' => ['nome' => 'Cultura',          'conta' => count(so_abertas(ler_culturais()))],
        'biblioteca' => ['nome' => 'Biblioteca',    'conta' => count(array_filter(ler_biblioteca(), fn ($m) => $m['arquivadoEm'] === ''))],
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
          'Ativo = responsável + algo registrado nos últimos 31 dias + próxima atividade marcada. Faltou uma, está parado — e a linha diz qual.',
          'No dia a dia é um botão só: "Registrar" depois de cada atividade. Os três pontinhos guardam o resto.',
          'Um tema, um grupo: categoria profissional e movimento são portas do grupo, não grupos à parte.',
          'Liga: o nível é calculado pelo fechamento do mês e pelas três comprovações. Sobe-se em ordem.',
          'O plano inteiro está em felipesmoreira.com/plano.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php barra_abas($abas, $aba, 'aba', 'Organização'); ?>

  <?php
  if ($aba === 'temas') {
      aba_de_grupos($grupos, $nucleos, $liga, $gente, $nomes);
  } elseif ($aba === 'liga') {
      aba_da_liga($liga, $gente);
  } elseif ($aba === 'cultura') {
      aba_da_cultura(ler_culturais(), $gente, $nomes);
  } elseif ($aba === 'biblioteca') {
      aba_da_biblioteca(ler_biblioteca());
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
    ?>
  <fieldset id="nucleos">
    <legend>Núcleos territoriais</legend>
    <dl class="resumo-numeros">
      <div><dt>Abertos</dt><dd><?= count($abertos) ?></dd></div>
      <div><dt>Ativos</dt><dd><?= $ativos ?></dd></div>
      <div<?= count($abertos) - $ativos > 0 ? ' class="resumo-alerta"' : '' ?>><dt>Parados</dt><dd><?= count($abertos) - $ativos ?></dd></div>
    </dl>
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
            <tr><th>Núcleo</th><th>Situação</th><th>Próxima</th><th>Responde</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($nucleos as $n): ?>
              <tr id="u-<?= h($n['id']) ?>">
                <td data-rotulo="Núcleo">
                  <strong><?= h($n['nome']) ?></strong>
                  <span class="dica">
                    <?= h($n['cidade']) ?><?= $n['bairro'] !== '' ? ' · ' . h($n['bairro']) : '' ?>
                    · <?= $n['onda'] === 0 ? 'mapear' : 'onda ' . $n['onda'] ?>
                    · <span title="<?= h(NIVEIS_TERRITORIO[$n['nivel']]['resumo']) ?>"><?= h($n['nivel'] . ' ' . NIVEIS_TERRITORIO[$n['nivel']]['nome']) ?></span>
                    · <?= count(membros_da_unidade($n['id'])) ?> fazem parte
                  </span>
                </td>
                <td class="meia" data-rotulo="Situação"><?php selo_da_unidade($n); ?></td>
                <td class="meia" data-rotulo="Próxima"><?= proxima_da_unidade($n) ?></td>
                <td class="tarde" data-rotulo="Responde">
                  <?= h($nomes[$n['responsavelId']] ?? '—') ?>
                  <?php if ($n['substitutoId'] === '' && $n['encerradoEm'] === ''): ?>
                    <span class="dica">sem substituto</span>
                  <?php endif; ?>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php if ($n['encerradoEm'] === ''): ?>
                    <?php botao_modal('entrega-' . $n['id'], 'Registrar', 'entrega=' . $n['id'], 'btn btn-mini btn-ouro'); ?>
                  <?php endif; ?>
                  <?php menu_da_unidade('nucleo', $n, '', 'o núcleo ' . $n['nome']); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>

    <details class="folga">
      <summary class="dica">Como ler o nível (T0 a T4) e a onda</summary>
      <ul class="lista-travas">
        <?php foreach (NIVEIS_TERRITORIO as $k => $nv): ?>
          <li><strong><?= h($k . ' · ' . $nv['nome']) ?></strong> — <?= h($nv['resumo']) ?> Próximo passo: <?= h(mb_strtolower($nv['proximo'])) ?>.</li>
        <?php endforeach; ?>
        <li>As ondas saem de <a href="/resultados#explorar">/resultados</a>, aba Decisões: onda 1 é Fortaleza e RMF convertidas, onda 2 Caucaia, Cariri, Sobral e Iguatu, onda 3 as bases de candidato.</li>
      </ul>
    </details>
  </fieldset>

  <?php
  /* Criar: quatro perguntas. Onda, nível, ritmo e o site ficam para a ficha. */
  abrir_modal('nucleo-novo', 'Novo núcleo', ($_GET['novo'] ?? '') === 'nucleo');
  form_abre('nucleo-salvar');
  campo('nn-nome', 'nome', 'Nome', '', ['max' => 80, 'obrigatorio' => true, 'marcador' => 'Benfica']);
  echo '<div class="linha g2"><div class="campo"><label for="nn-cidade">Cidade</label>';
  campo_cidade('nn-cidade', 'cidade', '', 'Escolha a cidade', true);
  echo '</div>';
  campo('nn-bairro', 'bairro', 'Bairro', '', ['max' => 60, 'dica' => 'opcional']);
  echo '</div><div class="campo"><label for="nn-resp">Quem responde por ele</label>';
  select_pessoa('nn-resp', 'responsavelId', '', $gente);
  echo '<p class="dica">Pode ficar para depois — mas sem responsável ele aparece como pendência no Início.</p></div>';
  form_fecha('Criar o núcleo');
  fechar_modal();

  foreach ($nucleos as $n) {
      modais_da_unidade('nucleo', $n, $n['nome'], $gente);
      modal_ficha_nucleo($n);
  }
}

/** A ficha completa do núcleo — a edição rara, em três blocos. */
function modal_ficha_nucleo(array $n): void
{
    $p = 'f' . substr(md5($n['id']), 0, 6);
    abrir_modal('ficha-' . $n['id'], 'Núcleo ' . $n['nome'], ($_GET['editar'] ?? '') === $n['id']);
    form_abre('nucleo-salvar', $n['id']);
    echo '<fieldset><legend>Onde</legend><div class="linha g2">';
    campo("$p-nome", 'nome', 'Nome', $n['nome'], ['max' => 80, 'obrigatorio' => true]);
    escolha("$p-tipo", 'tipo', 'Tipo', TIPOS_NUCLEO, $n['tipo']);
    echo '</div><div class="linha g2"><div class="campo"><label for="' . $p . '-cidade">Cidade</label>';
    campo_cidade("$p-cidade", 'cidade', $n['cidade'], 'Escolha a cidade', true);
    echo '</div>';
    campo("$p-bairro", 'bairro', 'Bairro', $n['bairro'], ['max' => 60]);
    echo '</div></fieldset><fieldset><legend>Classificação</legend><div class="linha g2">';
    escolha("$p-onda", 'onda', 'Onda', ONDAS, (string) $n['onda']);
    $niveis = [];
    foreach (NIVEIS_TERRITORIO as $k => $nv) {
        $niveis[$k] = $k . ' · ' . $nv['nome'];
    }
    escolha("$p-nivel", 'nivel', 'Nível', $niveis, $n['nivel']);
    echo '</div>';
    campo("$p-evid", 'evidencia', 'O que mostra que ele está nesse nível', $n['evidencia'], ['max' => 200, 'dica' => 'subir pede dois ciclos mensais seguidos']);
    echo '</fieldset>';
    campos_ritmo_e_site($p, $n);
    form_fecha('Salvar');
    fechar_modal();
}

/* =================================================================== grupos */

function aba_de_grupos(array $grupos, array $nucleos, array $liga, array $gente, array $nomes): void
{
    $abertos = so_abertas($grupos);
    ?>
  <fieldset id="temas">
    <legend>Grupos temáticos</legend>
    <p class="dica folga">
      <strong>Um tema, um grupo</strong>, com três portas: estudo, profissionais e movimento. Comece com no máximo
      <?= TETO_TEMAS_ABERTOS ?> — grupo aberto sem gente é organograma vazio.
    </p>
    <?php if (count($abertos) > TETO_TEMAS_ABERTOS): ?>
      <div class="msg msg-erro"><?= count($abertos) ?> grupos abertos. O plano pediu no máximo <?= TETO_TEMAS_ABERTOS ?> no começo.</div>
    <?php endif; ?>

    <?php if ($grupos === []): ?>
      <?php vazio('Nenhum grupo aberto ainda. Escolha um tema no catálogo abaixo — e só abra com quem vá responder por ele.'); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Grupo</th><th>Situação</th><th>Próxima</th><th>Responde</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($grupos as $g): $nomeTema = TEMAS_GRUPO[$g['tema']]['nome']; ?>
              <tr id="u-<?= h($g['id']) ?>">
                <td data-rotulo="Grupo">
                  <strong><?= h($nomeTema) ?></strong>
                  <span class="dica" title="<?= h(MATURIDADE[$g['maturidade']]['resumo']) ?>">
                    Maturidade <?= $g['maturidade'] ?> · <?= h(MATURIDADE[$g['maturidade']]['nome']) ?>
                    · 1ª entrega: <?= h($g['primeiraEntrega']) ?> até <?= h(data_humana($g['primeiraEntregaAte'])) ?>
                    · <?= count(membros_da_unidade($g['id'])) ?> fazem parte
                  </span>
                </td>
                <td class="meia" data-rotulo="Situação"><?php selo_da_unidade($g); ?></td>
                <td class="meia" data-rotulo="Próxima"><?= proxima_da_unidade($g) ?></td>
                <td class="tarde" data-rotulo="Responde">
                  <?= h($nomes[$g['responsavelId']] ?? '—') ?>
                  <?php if ($g['substitutoId'] === '' && $g['encerradoEm'] === ''): ?>
                    <span class="dica">sem substituto</span>
                  <?php endif; ?>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php if ($g['encerradoEm'] === ''): ?>
                    <?php botao_modal('entrega-' . $g['id'], 'Registrar', 'aba=temas&entrega=' . $g['id'], 'btn btn-mini btn-ouro'); ?>
                  <?php endif; ?>
                  <?php menu_da_unidade('grupo', $g, 'aba=temas&', 'o grupo ' . $nomeTema); ?>
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
    <div class="rolagem cartoes">
      <table class="tabela">
        <thead><tr><th>Tema</th><th>O que estuda</th><th></th></tr></thead>
        <tbody>
          <?php foreach (TEMAS_GRUPO as $chave => $t): $aberto = grupo_aberto_do_tema($chave, $grupos); ?>
            <tr>
              <td class="meia" data-rotulo="Tema"><strong><?= h($t['nome']) ?></strong></td>
              <td class="tarde" data-rotulo="O que estuda"><?= h($t['estudo']) ?></td>
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

  <?php
  foreach (TEMAS_GRUPO as $chave => $t) {
      if (grupo_aberto_do_tema($chave, $grupos) !== null) {
          continue;
      }
      /* Abrir: as quatro perguntas do plano, e nada mais. As portas nascem do
         catálogo e se ajustam na ficha. */
      $p = 'a' . substr(md5($chave), 0, 6);
      abrir_modal('grupo-novo-' . $chave, 'Abrir grupo · ' . $t['nome'], ($_GET['novo'] ?? '') === $chave);
      echo '<p class="dica">Antes de abrir, quatro respostas. Sem elas o tema fica no catálogo como prioridade futura.</p>';
      form_abre('grupo-salvar', '', ['tema' => $chave]);
      campo("$p-fin", 'finalidade', 'Para que este grupo existe', '', ['max' => 200, 'obrigatorio' => true, 'marcador' => 'Entender a violência nos bairros da onda 1']);
      echo '<div class="campo"><label for="' . $p . '-resp">Quem responde por ele</label>';
      select_pessoa("$p-resp", 'responsavelId', '', $gente, '— escolha —', true);
      echo '</div><div class="linha g2">';
      campo("$p-pri", 'primeiraEntrega', 'Primeira entrega', '', ['max' => 140, 'obrigatorio' => true, 'marcador' => 'Diagnóstico de um bairro']);
      campo("$p-ate", 'primeiraEntregaAte', 'Até', (new DateTimeImmutable(hoje_ce()))->modify('+45 days')->format('Y-m-d'), ['tipo' => 'date', 'obrigatorio' => true, 'dica' => '30 a 60 dias']);
      echo '</div>';
      form_fecha('Abrir o grupo');
      fechar_modal();
  }
  foreach ($grupos as $g) {
      modais_da_unidade('grupo', $g, TEMAS_GRUPO[$g['tema']]['nome'], $gente);
      modal_ficha_grupo($g, $nucleos, $liga);
  }
}

/** A ficha completa do grupo — a edição rara, em blocos. */
function modal_ficha_grupo(array $g, array $nucleos, array $liga): void
{
    $p = 'f' . substr(md5($g['id']), 0, 6);
    abrir_modal('ficha-' . $g['id'], 'Grupo · ' . TEMAS_GRUPO[$g['tema']]['nome'], ($_GET['editar'] ?? '') === $g['id']);
    form_abre('grupo-salvar', $g['id']);
    echo '<fieldset><legend>O compromisso</legend>';
    campo("$p-fin", 'finalidade', 'Finalidade', $g['finalidade'], ['max' => 200, 'obrigatorio' => true]);
    echo '<div class="linha g2">';
    campo("$p-pri", 'primeiraEntrega', 'Primeira entrega', $g['primeiraEntrega'], ['max' => 140, 'obrigatorio' => true]);
    campo("$p-ate", 'primeiraEntregaAte', 'Até', $g['primeiraEntregaAte'], ['tipo' => 'date', 'obrigatorio' => true]);
    echo '</div></fieldset><fieldset><legend>Maturidade</legend>';
    escolha("$p-mat", 'maturidade', 'Nível', array_map(fn ($m) => $m['nome'], MATURIDADE), (string) $g['maturidade']);
    campo("$p-evid", 'evidencia', 'O que mostra que ele está nesse nível', $g['evidencia'], ['max' => 200]);
    echo '</fieldset><fieldset><legend>As três portas</legend>';
    campo("$p-est", 'portaEstudo', 'Estudo', $g['portaEstudo'], ['max' => 200]);
    campo("$p-prof", 'portaProfissionais', 'Profissionais', $g['portaProfissionais'], ['max' => 200]);
    $redes = TEMAS_GRUPO[$g['tema']]['redes'];
    if ($redes !== []) {
        echo '<p class="dica">Quem convidar: as redes ' . h(implode(', ', array_map(fn ($r) => REDES[$r]['nome'], $redes))) . ' da ficha de pessoas.</p>';
    }
    campo("$p-mov", 'portaMovimento', 'Movimento', $g['portaMovimento'], ['max' => 200]);
    echo '</fieldset>';

    $vozes = ['' => '— nenhum —'];
    foreach ($liga as $pv) {
        if ($pv['encerradoEm'] === '') {
            $vozes[$pv['id']] = $pv['nome'];
        }
    }
    $abertos = array_values(array_filter($nucleos, fn ($n) => $n['encerradoEm'] === ''));
    echo '<fieldset><legend>Junto com</legend>';
    escolha("$p-pv", 'portaVozId', 'Porta-voz do tema', $vozes, $g['portaVozId']);
    if ($abertos !== []) {
        /* `nucleos` vazio também precisa chegar — ver `mesclar_post()`. */
        echo '<input type="hidden" name="nucleos[]" value="">';
        foreach ($abertos as $n) {
            echo '<label class="check"><input type="checkbox" name="nucleos[]" value="' . h($n['id']) . '"'
                . (in_array($n['id'], $g['nucleos'], true) ? ' checked' : '') . '> Núcleo ' . h($n['nome']) . '</label>';
        }
    }
    echo '</fieldset>';
    campos_ritmo_e_site($p, $g);
    form_fecha('Salvar');
    fechar_modal();
}

/* =================================================================== Liga */

function aba_da_liga(array $liga, array $gente): void
{
    $ativos = array_values(array_filter($liga, fn ($p) => $p['encerradoEm'] === ''));
    $mesPassado = (new DateTimeImmutable(hoje_ce()))->modify('first day of last month')->format('Y-m');
    $mes = mes_valido($_GET['mes-placar'] ?? '') ?: $mesPassado;
    $placar = placar_da_liga($liga, $mes);
    ?>
  <fieldset id="liga">
    <legend>Liga dos Porta-vozes</legend>
    <dl class="resumo-numeros">
      <?php foreach (array_reverse(NIVEIS_LIGA, true) as $k => $nv): ?>
        <div title="<?= h($nv['exige']) ?>">
          <dt><?= h($k . ' · ' . $nv['nome']) ?></dt>
          <dd><?= count(array_filter($ativos, fn ($pv) => nivel_liga($pv)['nivel'] === $k)) ?></dd>
        </div>
      <?php endforeach; ?>
    </dl>
    <p class="dica folga">
      Uma vez por mês, na revisão mensal: <strong>Fechar o mês</strong> de cada um. O nível e o placar saem dali.
      Seguidor ou engajamento comprado elimina da Liga.
    </p>
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
            <tr><th>Porta-voz</th><th>Nível</th><th>Último mês</th><th>Para subir</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($liga as $pv): $nv = nivel_liga($pv); $m = ultimo_mes($pv); $fora = $pv['encerradoEm'] !== ''; ?>
              <tr id="pv-<?= h($pv['id']) ?>">
                <td data-rotulo="Porta-voz">
                  <strong><?= h($pv['nome']) ?></strong>
                  <span class="dica">
                    <?= $pv['tema'] !== '' ? h(TEMAS_GRUPO[$pv['tema']]['nome']) : 'sem tema' ?><?= $pv['cidade'] !== '' ? ' · ' . h($pv['cidade']) : '' ?>
                  </span>
                  <?php if ($fora): ?>
                    <span class="selo selo-cinza">Fora da Liga<?= $pv['encerradoMotivo'] !== '' ? ': ' . h($pv['encerradoMotivo']) : '' ?></span>
                  <?php elseif (suspeita_de_compra($pv)): ?>
                    <span class="selo selo-off">Conferir: salto com engajamento baixo</span>
                  <?php elseif ($nv['revisao']['rebaixamentos'] > 0): ?>
                    <span class="selo selo-atencao">Rebaixamento na revisão trimestral</span>
                  <?php elseif ($pv['publicado']): ?>
                    <span class="selo selo-publicado">No site</span>
                  <?php endif; ?>
                </td>
                <td class="terco" data-rotulo="Nível"><strong><?= h($nv['nivel']) ?></strong> · <?= h(NIVEIS_LIGA[$nv['nivel']]['nome']) ?>
                  <?php if ($nv['revisao']['pendentes'] !== []): ?>
                    <span class="dica">Revisão pendente: faltam fechamentos. Veja o histórico.</span>
                  <?php endif; ?>
                </td>
                <td class="terco" data-rotulo="Último mês">
                  <?php if ($m === null): ?>
                    <span class="dica">ainda não fechou</span>
                  <?php else: ?>
                    <?= number_format(seguidores_de($pv), 0, ',', '.') ?> seg. · <?= h(number_format($m['engajamento'], 1, ',', '.')) ?>%
                    <span class="dica"><?= h($m['mes']) ?></span>
                  <?php endif; ?>
                </td>
                <td class="tarde" data-rotulo="Para subir">
                  <?php if ($nv['proximo'] === ''): ?>
                    Topo da Liga. Manter, e mentorar alguém de E ou D.
                  <?php else: ?>
                    <strong><?= h($nv['proximo']) ?>:</strong> <?= h(implode(' · ', $nv['falta'])) ?>
                  <?php endif; ?>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php if (!$fora): ?>
                    <?php botao_modal('mes-' . $pv['id'], 'Fechar o mês', 'aba=liga&fechar=' . $pv['id'], 'btn btn-mini btn-ouro'); ?>
                  <?php endif; ?>
                  <?php menu_acoes($fora ? [] : menu_do_porta_voz($pv)); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <?php tela_de_importacao_da_liga($liga); ?>

  <fieldset id="placar">
    <legend>Placar de <?= h($mes) ?></legend>
    <p class="dica colado">
      Crescimento até 40 · engajamento até 20 · ações até 30 (ação local 20, módulo 10, live 5) · constância 10.
      ★ os três primeiros de cada nível: collab com o perfil oficial e convite para a live estadual.
    </p>
    <?php if (array_filter($placar) === []): ?>
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
  /* Pôr na Liga: quem, a voz de quê, de onde. Perfis e site ficam na ficha. */
  abrir_modal('pv-novo', 'Pôr na Liga', ($_GET['pv'] ?? '') === 'novo');
  form_abre('pv-salvar');
  echo '<div class="campo"><label for="pn-pessoa">Quem</label>';
  select_pessoa('pn-pessoa', 'pessoaId', '', $gente, '— escolha —', true);
  echo '</div>';
  escolha('pn-tema', 'tema', 'A voz de que tema', ['' => '— escolha —'] + array_map(fn ($t) => $t['nome'], TEMAS_GRUPO), '');
  echo '<div class="campo"><label for="pn-cidade">E de que lugar</label>';
  campo_cidade('pn-cidade', 'cidade', '');
  echo '</div>';
  form_fecha('Pôr na Liga');
  fechar_modal();

  foreach ($liga as $pv) {
      modal_ficha_porta_voz($pv, $gente);
      if ($pv['encerradoEm'] === '') {
          modal_de_mes($pv, $mesPassado);
          modal_de_acao_local($pv);
      }
  }
}

/** Os três pontinhos do porta-voz: as comprovações, uma por item, e a ficha. */
function menu_do_porta_voz(array $pv): array
{
    $id = $pv['id'];
    $itens = [];
    $itens[] = $pv['redesEm'] === ''
        ? ['texto' => 'Validar: redes estruturadas', 'acao' => 'pv-comprovar', 'campos' => ['id' => $id, 'campo' => 'redesEm'],
           'confirmar' => 'As quatro redes de ' . $pv['nome'] . ' têm foto, nome padronizado, bio com tema e cidade, link e 3 posts fixados?']
        : ['texto' => 'Desfazer: redes estruturadas', 'acao' => 'pv-comprovar', 'campos' => ['id' => $id, 'campo' => 'redesEm', 'valor' => '0']];
    $itens[] = $pv['formacaoEm'] === ''
        ? ['texto' => 'Validar: formação concluída', 'acao' => 'pv-comprovar', 'campos' => ['id' => $id, 'campo' => 'formacaoEm'],
           'confirmar' => $pv['nome'] . ' tem o certificado da trilha básica de formação?']
        : ['texto' => 'Desfazer: formação concluída', 'acao' => 'pv-comprovar', 'campos' => ['id' => $id, 'campo' => 'formacaoEm', 'valor' => '0']];
    $itens[] = $pv['acaoEm'] === ''
        ? ['texto' => 'Registrar ação local', 'url' => '?aba=liga&acao-local=' . $id, 'modal' => 'acao-' . $id]
        : ['texto' => 'Desfazer: ação local', 'acao' => 'pv-comprovar', 'campos' => ['id' => $id, 'campo' => 'acaoEm', 'valor' => '0']];
    $itens[] = ['texto' => 'Ficha e perfis', 'url' => '?aba=liga&pv=' . $id, 'modal' => 'pv-' . $id];
    $itens[] = ['texto' => 'Histórico e revisão trimestral', 'url' => '?aba=liga&fechar=' . $id, 'modal' => 'mes-' . $id];
    $itens[] = ['texto' => 'Tirar da Liga', 'acao' => 'pv-encerrar', 'campos' => ['id' => $id, 'motivo' => 'Saiu pela coordenação'],
                'confirmar' => 'Tirar ' . $pv['nome'] . ' da Liga? Sai também do site.', 'risco' => true];
    return $itens;
}

function modal_ficha_porta_voz(array $pv, array $gente): void
{
    $p = 'p' . substr(md5($pv['id']), 0, 6);
    abrir_modal('pv-' . $pv['id'], 'Ficha · ' . $pv['nome'], ($_GET['pv'] ?? '') === $pv['id']);
    form_abre('pv-salvar', $pv['id']);
    echo '<fieldset><legend>Quem</legend><div class="linha g2"><div class="campo"><label for="' . $p . '-pessoa">Ficha da pessoa</label>';
    select_pessoa("$p-pessoa", 'pessoaId', $pv['pessoaId'], $gente, '— sem ficha —');
    echo '</div>';
    campo("$p-nome", 'nome', 'Nome público', $pv['nome'], ['max' => 80, 'obrigatorio' => true]);
    echo '</div><div class="linha g3">';
    escolha("$p-tema", 'tema', 'Tema', ['' => '— sem tema —'] + array_map(fn ($t) => $t['nome'], TEMAS_GRUPO), $pv['tema']);
    echo '<div class="campo"><label for="' . $p . '-cidade">Cidade</label>';
    campo_cidade("$p-cidade", 'cidade', $pv['cidade']);
    echo '</div>';
    campo("$p-bairro", 'bairro', 'Bairro', $pv['bairro'], ['max' => 60]);
    echo '</div></fieldset><fieldset><legend>Perfis (o @)</legend><div class="linha g2">';
    foreach (REDES_LIGA as $r => $rotulo) {
        campo("$p-$r", "perfis[$r]", $rotulo, $pv['perfis'][$r] ?? '', ['max' => 60]);
    }
    echo '</div>';
    campo("$p-dest", 'destaque', 'Vídeo em destaque', $pv['destaque'], ['tipo' => 'url', 'max' => 300, 'dica' => 'link de Instagram, TikTok, YouTube ou X — aparece no site']);
    echo '</fieldset>';
    caixa('publicado', $pv['publicado'], 'Aparece em /portavozes — com autorização dele: nome público, tema, lugar, nível e perfis');
    form_fecha('Salvar');
    fechar_modal();
}

function modal_de_acao_local(array $pv): void
{
    abrir_modal('acao-' . $pv['id'], 'Ação local · ' . $pv['nome'], ($_GET['acao-local'] ?? '') === $pv['id']);
    echo '<p class="dica">A exigência do nível A: liderar uma ação no bairro, cidade ou tema, com 20 pessoas ou mais, registrada.</p>';
    form_abre('pv-comprovar', $pv['id'], ['campo' => 'acaoEm']);
    campo('a' . substr(md5($pv['id']), 0, 6), 'acaoTexto', 'O que foi, onde e quantas pessoas', $pv['acaoTexto'], ['max' => 160, 'obrigatorio' => true, 'marcador' => 'Mutirão na praça do Benfica, 32 pessoas']);
    form_fecha('Registrar');
    fechar_modal();
}

/** O fechamento do mês — o que o placar e o nível leem. */
function modal_de_mes(array $pv, string $mesPadrao): void
{
    $p = 'm' . substr(md5($pv['id']), 0, 6);
    $ultimo = ultimo_mes($pv);
    $editado = null;
    if (($_GET['fechar'] ?? '') === $pv['id']) {
        $mesEditar = mes_valido($_GET['mes-editar'] ?? '');
        foreach ($pv['meses'] as $m) {
            if ($m['mes'] === $mesEditar) {
                $editado = $m;
                $mesPadrao = $mesEditar;
            }
        }
    }
    abrir_modal('mes-' . $pv['id'], 'Fechar o mês · ' . $pv['nome'], ($_GET['fechar'] ?? '') === $pv['id']);
    echo '<p class="dica">Informe os números do painel de cada rede ou importe o CSV da equipe. Não há coleta automática das redes.</p>';
    form_abre('pv-mes', $pv['id']);
    campo("$p-mes", 'mes', 'Mês', $mesPadrao, ['tipo' => 'month', 'limite' => substr(hoje_ce(), 0, 7), 'obrigatorio' => true, 'dica' => 'fechar de novo corrige']);
    echo '<fieldset><legend>Seguidores no fim do mês</legend><div class="linha g2">';
    foreach (REDES_LIGA as $r => $rotulo) {
        campo("$p-$r", "redes[$r]", $rotulo, (string) (int) ($editado['redes'][$r] ?? $ultimo['redes'][$r] ?? 0), ['tipo' => 'number', 'obrigatorio' => true]);
    }
    echo '</div></fieldset><fieldset><legend>Ritmo</legend><div class="linha g2">';
    campo("$p-eng", 'engajamento', 'Engajamento médio (%)', (string) ($editado['engajamento'] ?? ''), ['max' => 6, 'marcador' => '3,4', 'dica' => 'interações ÷ seguidores, 30 dias', 'obrigatorio' => true]);
    campo("$p-sem", 'semanasSeguidas', 'Semanas seguidas com 3 vídeos', (string) (int) ($editado['semanasSeguidas'] ?? $ultimo['semanasSeguidas'] ?? 0), ['tipo' => 'number']);
    echo '</div>';
    caixa('todasSemanas', !empty($editado['todasSemanas']), 'Todas as semanas deste mês com 3 vídeos');
    echo '</fieldset><details><summary class="dica">Ações do mês (para o placar)</summary><div class="linha g3">';
    campo("$p-acoes", 'acoes', 'Ações locais', (string) ($editado['acoes'] ?? 0), ['tipo' => 'number']);
    campo("$p-mod", 'modulos', 'Módulos de formação', (string) ($editado['modulos'] ?? 0), ['tipo' => 'number']);
    campo("$p-lives", 'lives', 'Lives', (string) ($editado['lives'] ?? 0), ['tipo' => 'number']);
    echo '</div></details>';
    form_fecha('Fechar o mês');
    echo '<details><summary>Histórico mensal e revisão trimestral</summary><ul>';
    foreach (array_reverse($pv['meses']) as $m) {
        $redes = [];
        foreach (REDES_LIGA as $r => $nome) {
            $redes[] = $nome . ': ' . $m['redes'][$r];
        }
        echo '<li>' . h($m['mes'] . ' · ' . implode(', ', $redes) . ' · engajamento ' . $m['engajamento'] . '% · ações ' . $m['acoes']
            . ' · ' . $m['origem'] . ' · ' . $m['por']) . ' · <a href="?aba=liga&amp;fechar=' . h($pv['id']) . '&amp;mes-editar=' . h($m['mes']) . '">Corrigir este mês</a></li>';
    }
    echo '</ul><p class="dica">Dois trimestres completos seguidos sem crescimento líquido ou sem ação local retiram um nível. Dados ausentes deixam a revisão pendente.</p><ul>';
    $revisao = revisao_trimestral_liga($pv);
    foreach ($revisao['trimestres'] as $t) {
        echo '<li>' . h($t['trimestre'] . ': ' . ($t['motivos'] === [] ? 'crescimento e ação local comprovados' : implode(' e ', $t['motivos']))) . '</li>';
    }
    foreach ($revisao['pendentes'] as $pendente) {
        echo '<li>' . h($pendente) . '</li>';
    }
    echo '</ul></details>';
    fechar_modal();
}

/* =================================================================== Biblioteca */

function aba_da_biblioteca(array $materiais): void
{
    ?>
  <fieldset id="biblioteca">
    <legend>Biblioteca</legend>
    <p class="dica folga">
      Livro Amarelo, cadernos, diagnósticos, gravações. O arquivo mora onde já está — aqui vai o link.
      O que for marcado aparece em <a href="/biblioteca" target="_blank">/biblioteca</a>.
    </p>
    <div class="acoes">
      <?php botao_modal('material-novo', 'Pôr um material', 'aba=biblioteca&material=novo'); ?>
    </div>
    <?php if ($materiais === []): ?>
      <?php vazio('Nada ainda. Comece pelo Livro Amarelo: é o texto do Círculo de leitura.',
          ['url' => '?aba=biblioteca&material=novo', 'texto' => 'Pôr o primeiro']); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Material</th><th>Tipo</th><th>Tema</th><th>Site</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($materiais as $m): ?>
              <tr>
                <td data-rotulo="Material"><strong><?= h($m['titulo']) ?></strong> <span class="dica"><?= h($m['resumo']) ?></span></td>
                <td class="terco" data-rotulo="Tipo"><?= h(TIPOS_MATERIAL[$m['tipo']]) ?></td>
                <td class="terco" data-rotulo="Tema"><?= $m['tema'] !== '' ? h(TEMAS_GRUPO[$m['tema']]['nome']) : '—' ?></td>
                <td class="terco" data-rotulo="Site">
                  <?php if ($m['arquivadoEm'] !== ''): ?><span class="selo selo-cinza">Arquivado</span>
                  <?php elseif ($m['publicado']): ?><span class="selo selo-publicado">No site</span>
                  <?php else: ?><span class="dica">só no painel</span><?php endif; ?>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php menu_acoes([
                      ['texto' => 'Abrir o link', 'url' => $m['link'], 'novaAba' => true],
                      ['texto' => 'Editar', 'url' => '?aba=biblioteca&material=' . $m['id'], 'modal' => 'material-' . $m['id']],
                      ['texto' => $m['arquivadoEm'] === '' ? 'Arquivar' : 'Desarquivar', 'acao' => 'material-arquivar', 'campos' => ['id' => $m['id']]],
                  ]); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>
    <?php
    modal_de_material(null);
    foreach ($materiais as $m) {
        modal_de_material($m);
    }
}

function modal_de_material(?array $m): void
{
    $id = $m === null ? 'material-novo' : 'material-' . $m['id'];
    $p = 'b' . substr(md5($id), 0, 6);
    abrir_modal($id, $m === null ? 'Pôr um material' : 'Material', ($_GET['material'] ?? '') === ($m['id'] ?? 'novo'));
    form_abre('material-salvar', $m['id'] ?? '');
    campo("$p-t", 'titulo', 'Título', $m['titulo'] ?? '', ['max' => 120, 'obrigatorio' => true, 'marcador' => 'Livro Amarelo — capítulo 1']);
    campo("$p-l", 'link', 'Link', $m['link'] ?? '', ['tipo' => 'url', 'max' => 300, 'obrigatorio' => true, 'marcador' => 'https://…']);
    echo '<div class="linha g2">';
    escolha("$p-tipo", 'tipo', 'Tipo', TIPOS_MATERIAL, $m['tipo'] ?? 'caderno');
    escolha("$p-tema", 'tema', 'Tema', ['' => '— nenhum —'] + array_map(fn ($t) => $t['nome'], TEMAS_GRUPO), $m['tema'] ?? '');
    echo '</div>';
    campo("$p-r", 'resumo', 'Do que trata', $m['resumo'] ?? '', ['max' => 240, 'dica' => 'uma frase']);
    caixa('publicado', $m['publicado'] ?? false, 'Aparece em /biblioteca');
    form_fecha('Salvar');
    fechar_modal();
}

/* =================================================================== Cultura */

function aba_da_cultura(array $culturais, array $gente, array $nomes): void
{
    $abertos = so_abertas($culturais);
    ?>
  <fieldset id="cultura">
    <legend>Grupos culturais</legend>
    <p class="dica folga">
      A frente de Cultura: música, cinema, jogos, cordel, esporte… Da <strong>ideia</strong> à <strong>atividade pontual</strong>,
      ao <strong>projeto recorrente</strong> e ao <strong>grupo permanente</strong>. Cultura tem valor próprio — nem toda
      atividade precisa virar aula ou ação partidária.
    </p>
    <div class="acoes"><?php botao_modal('cultura-novo', 'Novo grupo cultural', 'aba=cultura&novo=cultura'); ?></div>
    <?php if ($culturais === []): ?>
      <?php vazio('Nenhum ainda. Comece pequeno: uma noite de jogos, uma sessão de cinema — e quem responde por ela.',
          ['url' => '?aba=cultura&novo=cultura', 'texto' => 'Criar o primeiro']); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Grupo</th><th>Situação</th><th>Próxima</th><th>Responde</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($culturais as $c): ?>
              <tr id="u-<?= h($c['id']) ?>">
                <td data-rotulo="Grupo">
                  <strong><?= h($c['nome']) ?></strong>
                  <span class="dica"><?= h(EIXOS_CULTURAIS[$c['eixo']]) ?> · <?= $c['nivel'] ?> <?= h(NIVEIS_CULTURA[$c['nivel']]['nome']) ?><?= $c['cidade'] !== '' ? ' · ' . h($c['cidade']) : '' ?>
                    · <?= count(membros_da_unidade($c['id'])) ?> fazem parte</span>
                </td>
                <td class="meia" data-rotulo="Situação"><?php selo_da_unidade($c); ?></td>
                <td class="meia" data-rotulo="Próxima"><?= proxima_da_unidade($c) ?></td>
                <td class="tarde" data-rotulo="Responde"><?= h($nomes[$c['responsavelId']] ?? '—') ?></td>
                <td class="rodape" data-rotulo="">
                  <?php if ($c['encerradoEm'] === ''): ?>
                    <?php botao_modal('entrega-' . $c['id'], 'Registrar', 'aba=cultura&entrega=' . $c['id'], 'btn btn-mini btn-ouro'); ?>
                  <?php endif; ?>
                  <?php menu_da_unidade('cultura', $c, 'aba=cultura&', 'o grupo cultural ' . $c['nome']); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>
    <?php
    /* Criar: nome, eixo e quem responde. Nível, cidade e o site ficam para a ficha. */
    abrir_modal('cultura-novo', 'Novo grupo cultural', ($_GET['novo'] ?? '') === 'cultura');
    form_abre('cultura-salvar');
    campo('cn-nome', 'nome', 'Nome', '', ['max' => 80, 'obrigatorio' => true, 'marcador' => 'Cineclube do Benfica']);
    escolha('cn-eixo', 'eixo', 'Eixo', EIXOS_CULTURAIS, 'cinema');
    echo '<div class="campo"><label for="cn-resp">Quem responde</label>';
    select_pessoa('cn-resp', 'responsavelId', '', $gente);
    echo '</div>';
    form_fecha('Criar');
    fechar_modal();

    foreach ($culturais as $c) {
        modais_da_unidade('cultura', $c, $c['nome'], $gente);
        $p = 'f' . substr(md5($c['id']), 0, 6);
        abrir_modal('ficha-' . $c['id'], 'Grupo cultural · ' . $c['nome'], ($_GET['editar'] ?? '') === $c['id']);
        form_abre('cultura-salvar', $c['id']);
        echo '<fieldset><legend>O grupo</legend>';
        campo("$p-nome", 'nome', 'Nome', $c['nome'], ['max' => 80, 'obrigatorio' => true]);
        echo '<div class="linha g2">';
        escolha("$p-eixo", 'eixo', 'Eixo', EIXOS_CULTURAIS, $c['eixo']);
        escolha("$p-nivel", 'nivel', 'Nível', array_map(fn ($n) => $n['nome'], NIVEIS_CULTURA), (string) $c['nivel']);
        echo '</div>';
        campo("$p-evid", 'evidencia', 'O que mostra que ele está nesse nível', $c['evidencia'], ['max' => 200]);
        echo '</fieldset><fieldset><legend>Onde <span class="dica">— opcional: um podcast não tem cidade</span></legend><div class="linha g2"><div class="campo"><label for="' . $p . '-cidade">Cidade</label>';
        campo_cidade("$p-cidade", 'cidade', $c['cidade'], 'Sem cidade');
        echo '</div>';
        campo("$p-bairro", 'bairro', 'Bairro', $c['bairro'], ['max' => 60]);
        echo '</div></fieldset>';
        campos_ritmo_e_site($p, $c);
        form_fecha('Salvar');
        fechar_modal();
    }
}
