<?php
declare(strict_types=1);

/**
 * O PAINEL DE COMANDO — a aba Comando de `/painel/leituras`.
 *
 * "A tela que a coordenação abre na reunião semanal": seis blocos (participação,
 * organização, territórios, produção, porta-vozes, sustentabilidade), a escada
 * de engajamento e as decisões do mês. É leitura — nada aqui grava —, e cada
 * número sai de uma função que já existe em outro lugar: a escada de
 * `escada-comum.php`, o "ativo" de `organizacao-comum.php`, a tarefa de
 * `tarefas-comum.php`. Nenhuma régua nasce aqui.
 *
 * Os números "servem para descobrir gargalos, nunca para punir voluntários".
 * Por isso nenhum nome de pessoa aparece nesta aba: os blocos contam, e quem
 * quer saber quem abre a mesa correspondente.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/escada-comum.php';

/** Os seis blocos, no formato dos medidores do Início (`.medidor`). */
function blocos_de_comando(?int $agora = null): array
{
    $hoje = hoje_ce($agora);
    $inicioMes = substr($hoje, 0, 7) . '-01';

    $subidas = subidas_por_mes(1, $agora)[0];
    $ativos = ativos_no_mes($agora);

    $grupos = so_abertas(ler_grupos());
    $gruposAtivos = array_values(array_filter($grupos, fn ($g) => unidade_ativa($g, $agora)));
    $nucleos = so_abertas(ler_nucleos());
    $nucleosAtivos = array_values(array_filter($nucleos, fn ($n) => unidade_ativa($n, $agora)));

    $tarefas = ler_tarefas();
    $feitasNoMes = count(array_filter($tarefas, fn ($t) => dia_do_carimbo($t['feitaEm']) >= $inicioMes));
    $vencidas = count(array_filter($tarefas, fn ($t) => tarefa_vencida($t, $agora)));

    $liga = array_values(array_filter(ler_liga(), fn ($pv) => $pv['encerradoEm'] === ''));
    $deCParaCima = count(array_filter($liga, fn ($pv) => in_array(nivel_liga($pv)['nivel'], ['C', 'B', 'A'], true)));

    $unidades = array_merge($nucleos, $grupos);
    $comSubstituto = count(array_filter($unidades, fn ($u) => $u['substitutoId'] !== ''));

    $nomesAtivos = array_map(fn ($n) => $n['nome'], array_slice($nucleosAtivos, 0, 3));

    return [
        [
            'rotulo' => 'Participação',
            'num'    => (string) $ativos,
            'nota'   => 'ativos no mês · ' . $subidas['subiram'] . ' subiram de degrau, ' . $subidas['entraram'] . ' entraram',
            'estado' => $subidas['subiram'] > 0 ? 'ok' : 'atencao',
            'url'    => '#escada',
        ],
        [
            'rotulo' => 'Organização',
            'num'    => count($gruposAtivos) . '/' . count($grupos),
            'nota'   => 'grupos temáticos ativos · '
                . count(array_filter($grupos, fn ($g) => $g['maturidade'] >= 2)) . ' com maturidade 2 ou mais',
            'estado' => $grupos === [] ? 'atencao' : (count($gruposAtivos) === count($grupos) ? 'ok' : 'atencao'),
            'url'    => '/painel/organizacao.php?aba=temas',
        ],
        [
            'rotulo' => 'Territórios',
            'num'    => count($nucleosAtivos) . '/' . count($nucleos),
            'nota'   => 'núcleos ativos' . ($nomesAtivos !== [] ? ' · ' . implode(', ', $nomesAtivos) : ''),
            'estado' => $nucleos === [] ? 'atencao' : (count($nucleosAtivos) === count($nucleos) ? 'ok' : 'atencao'),
            'url'    => '/painel/organizacao.php',
        ],
        [
            'rotulo' => 'Produção',
            'num'    => (string) $feitasNoMes,
            'nota'   => 'tarefas concluídas no mês' . ($vencidas > 0 ? " · {$vencidas} vencidas" : ''),
            'estado' => $vencidas > 0 ? 'urgente' : 'ok',
            'url'    => '/painel/eventos.php?aba=tarefas',
        ],
        [
            'rotulo' => 'Porta-vozes',
            'num'    => (string) count($liga),
            'nota'   => 'na Liga · ' . $deCParaCima . ' no nível C ou acima',
            'estado' => $liga === [] ? 'atencao' : 'ok',
            'url'    => '/painel/organizacao.php?aba=liga',
        ],
        [
            'rotulo' => 'Sustentabilidade',
            'num'    => $comSubstituto . '/' . count($unidades),
            'nota'   => 'núcleos e grupos com substituto — sem ele, a unidade depende de uma pessoa',
            'estado' => $unidades === [] || $comSubstituto === count($unidades) ? 'ok'
                : ($comSubstituto === 0 ? 'urgente' : 'atencao'),
            'url'    => '/painel/organizacao.php',
        ],
    ];
}

/**
 * As decisões do mês, com o que o painel já sabe sobre cada uma. As perguntas
 * são do plano; as respostas aqui são só os candidatos — quem decide é a
 * reunião.
 */
function decisoes_do_mes(?int $agora = null): array
{
    $unidades = array_merge(
        array_map(fn ($n) => $n + ['_nome' => 'Núcleo ' . $n['nome']], so_abertas(ler_nucleos())),
        array_map(fn ($g) => $g + ['_nome' => 'Grupo ' . TEMAS_GRUPO[$g['tema']]['nome']], so_abertas(ler_grupos())),
    );

    /* Pronta para subir: ativa, com substituto, e duas entregas em meses
       diferentes — os "dois ciclos mensais seguidos" do critério de nível. */
    $prontas = array_filter($unidades, function ($u) use ($agora) {
        if (!unidade_ativa($u, $agora) || $u['substitutoId'] === '') {
            return false;
        }
        $meses = array_unique(array_map(fn ($e) => substr($e['data'], 0, 7), $u['entregas']));
        $teto = isset($u['nivel']) ? $u['nivel'] !== 'T4' : $u['maturidade'] < 4;
        return count($meses) >= 2 && $teto;
    });
    $paradas = array_filter($unidades, fn ($u) => !unidade_ativa($u, $agora));
    $semSubstituto = array_filter($unidades, fn ($u) => $u['substitutoId'] === '');

    $nomes = fn (array $lista) => array_values(array_map(fn ($u) => $u['_nome'], $lista));

    return [
        ['pergunta' => 'Quais unidades estão prontas para subir de nível?', 'candidatos' => $nomes($prontas)],
        ['pergunta' => 'Quais precisam de apoio ou estão paradas?', 'candidatos' => $nomes($paradas)],
        ['pergunta' => 'Onde falta substituto?', 'candidatos' => $nomes($semSubstituto)],
        ['pergunta' => 'O que simplificar, adiar ou encerrar?', 'candidatos' => []],
        ['pergunta' => 'Quais são as três prioridades do próximo mês?', 'candidatos' => []],
    ];
}

function aba_de_comando(): void
{
    $blocos = blocos_de_comando();
    $escada = distribuicao_da_escada();
    $meses = subidas_por_mes(6);
    $total = array_sum($escada);
    ?>
    <fieldset>
      <legend>Painel de comando</legend>
      <p class="dica folga">
        A tela da reunião semanal. Poucos números, bem definidos: ativo é quem fez uma contribuição concreta,
        não quem está cadastrado. Servem para achar gargalo, nunca para punir voluntário.
      </p>
      <div class="painel-op">
        <?php foreach ($blocos as $b): ?>
          <a class="medidor medidor-<?= h($b['estado']) ?>" href="<?= h($b['url']) ?>">
            <strong class="medidor-num"><?= h($b['num']) ?></strong>
            <span class="medidor-rotulo"><?= h($b['rotulo']) ?></span>
            <span class="medidor-nota"><?= h($b['nota']) ?></span>
          </a>
        <?php endforeach; ?>
      </div>
    </fieldset>

    <fieldset id="escada">
      <legend>A escada de engajamento</legend>
      <p class="dica folga">
        <strong>O indicador-norte é quantas pessoas sobem de degrau por mês</strong>, e não quantas entram na lista.
        O degrau é derivado do que o painel já registra — presença, tarefa feita, entrega, Liga, responsável por núcleo
        ou grupo, liderança —, então ninguém precisa marcar nada à mão.
      </p>
      <dl class="resumo-numeros">
        <?php foreach (DEGRAUS as $k => $d): ?>
          <div title="<?= h($d['resumo'] . ' Próximo passo: ' . $d['proximo']) ?>">
            <dt><?= $k ?> · <?= h($d['nome']) ?></dt>
            <dd><?= $escada[$k] ?></dd>
          </div>
        <?php endforeach; ?>
      </dl>
      <p class="dica colado"><?= $total ?> pessoas na escada. Passe o dedo ou o mouse num degrau para ver o próximo passo dele.</p>

      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Mês</th><th>Subiram de degrau</th><th>Entraram</th></tr></thead>
          <tbody>
            <?php foreach ($meses as $m): ?>
              <tr>
                <td class="terco" data-rotulo="Mês"><strong><?= h(mes_curto($m['mes'])) ?></strong></td>
                <td class="terco" data-rotulo="Subiram de degrau"><?= $m['subiram'] ?></td>
                <td class="terco" data-rotulo="Entraram"><?= $m['entraram'] ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <p class="dica">
        No longo prazo, o indicador é a conversão do eleitor do 14: em 2026, 18 em cada 100 eleitores do Renan
        votaram no 14 para deputado no Ceará (no Brasil, 46). Está em <a href="/resultados">/resultados</a>.
      </p>
    </fieldset>

    <fieldset>
      <legend>Decisões do mês</legend>
      <ol class="lista-travas">
        <?php foreach (decisoes_do_mes() as $d): ?>
          <li>
            <strong><?= h($d['pergunta']) ?></strong>
            <?php if ($d['candidatos'] !== []): ?>
              <span class="dica"><?= h(implode(' · ', $d['candidatos'])) ?></span>
            <?php endif; ?>
          </li>
        <?php endforeach; ?>
      </ol>
    </fieldset>
    <?php
}
