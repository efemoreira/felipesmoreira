<?php
declare(strict_types=1);

/**
 * OS INDICADORES DO SITE — a aba Site de `/painel/leituras` (plano 2026–2027,
 * "Indicadores do site", os oito, na ordem do plano).
 *
 * Nada aqui é rastreamento: o site conta por dia, rota e evento, sem quem
 * (`sinal()` → `sinais-comum.php`), e o resto sai do que o painel já grava
 * (presença, entrega, tarefa). Por isso "pessoas que voltam" é medido pela
 * PRESENÇA — quem foi a duas atividades ou mais —, e não por visita repetida:
 * saber que o mesmo navegador voltou exigiria cookie, e o site não usa.
 *
 * "Visualização não é o resultado principal. O que importa é quantas pessoas
 * passam de um degrau ao outro" — esse número está na aba Comando.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sinais-comum.php';
require_once __DIR__ . '/escada-comum.php';  // eventos, presenças, tarefas, organização

/** As oito linhas: [indicador, número, o que quer dizer]. Janela: últimos 30 dias. */
function indicadores_do_site(?int $agora = null): array
{
    $agora ??= time();
    $hoje = hoje_ce($agora);
    $desde = (new DateTimeImmutable($hoje))->modify('-29 days')->format('Y-m-d');
    $inicioMes = substr($hoje, 0, 7) . '-01';
    $s = sinais_entre($desde, $hoje);
    $n = fn (string $rota, string $evento) => (int) ($s[$rota][$evento] ?? 0);

    /* 2 — confirmados e presentes nas atividades dos últimos 30 dias. */
    $inicio = [];
    foreach (ler_eventos() as $e) {
        $inicio[$e['id']] = dia_do_inicio($e['inicio']);
    }
    $confirmaram = $vieram = 0;
    $porPessoa = [];
    foreach (ler_presencas() as $pr) {
        $dia = $inicio[$pr['eventoId']] ?? '';
        if ($pr['compareceu']) {
            $porPessoa[$pr['pessoaId']] = ($porPessoa[$pr['pessoaId']] ?? 0) + 1;
        }
        if ($dia < $desde || $dia > $hoje) {
            continue;
        }
        if ($pr['confirmou']) {
            $confirmaram++;
            if ($pr['compareceu']) {
                $vieram++;
            }
        }
    }
    $voltaram = count(array_filter($porPessoa, fn ($q) => $q >= 2));

    /* 3 — visita ao formulário → inscrição enviada. */
    $abriuForm = $n('queroajudar', 'abriu');
    $inscreveu = $n('queroajudar', 'enviou-inscricao');

    /* 6 e 7 — unidades atualizadas no mês, e o tempo até o registro. */
    $unidades = so_abertas(todas_as_unidades());
    $atualizadas = count(array_filter($unidades, fn ($u) =>
        array_filter($u['entregas'], fn ($e) => $e['data'] >= $inicioMes) !== []
    ));
    $atrasos = [];
    foreach ($unidades as $u) {
        foreach ($u['entregas'] as $e) {
            if ($e['data'] >= $desde && $e['em'] !== '') {
                $atrasos[] = max(0, (int) (new DateTimeImmutable($e['data']))->diff(new DateTimeImmutable(dia_do_carimbo($e['em'])))->days);
            }
        }
    }
    sort($atrasos);
    $mediana = $atrasos === [] ? null : $atrasos[intdiv(count($atrasos), 2)];

    /* 8 — tarefas combinadas e concluídas no mês. */
    $tarefas = ler_tarefas();
    $combinadas = count(array_filter($tarefas, fn ($t) => dia_do_carimbo($t['criadoEm']) >= $inicioMes));
    $feitas = count(array_filter($tarefas, fn ($t) => $t['feitaEm'] !== '' && dia_do_carimbo($t['feitaEm']) >= $inicioMes));

    $pct = fn (int $a, int $b) => $b > 0 ? round($a / $b * 100) . '%' : '—';

    return [
        ['Visitas às atividades', (string) ($n('programacao', 'abriu') + $n('programacao', 'abriu-atividade')),
            'aberturas da agenda e das fichas de atividade (' . $n('programacao', 'abriu-atividade') . ' fichas) — 30 dias'],
        ['Confirmaram → vieram', $confirmaram . ' → ' . $vieram . ' (' . $pct($vieram, $confirmaram) . ')',
            'das atividades dos últimos 30 dias, quem disse "vou" e quem chegou'],
        ['Visita → inscrição', $inscreveu . ' de ' . $abriuForm . ' (' . $pct($inscreveu, $abriuForm) . ')',
            'quem abriu /queroajudar e quem enviou — 30 dias'],
        ['Pessoas que voltam', (string) $voltaram,
            'estiveram em duas atividades ou mais (medido pela presença, sem cookie)'],
        ['Materiais abertos', (string) $n('biblioteca', 'abriu-material'),
            'cliques em material da /biblioteca — 30 dias'],
        ['Unidades atualizadas no mês', $atualizadas . ' de ' . count($unidades),
            'núcleos e grupos com algo registrado desde o dia 1º'],
        ['Da atividade ao registro', $mediana === null ? '—' : $mediana . ($mediana === 1 ? ' dia' : ' dias'),
            'mediana entre a data da atividade e o registro dela (o plano pede até 7)'],
        ['Tarefas no mês', $feitas . ' feitas de ' . $combinadas . ' combinadas',
            'tarefas combinadas desde o dia 1º, e quantas já foram feitas'],
    ];
}

function aba_do_site(): void
{
    ?>
    <fieldset>
      <legend>O site</legend>
      <p class="dica folga">
        Os oito indicadores do plano. Contagem sem quem: o site não usa cookie nem analytics de terceiro.
        Visualização não é o resultado — o que importa é quem sobe de degrau, e isso está na aba Comando.
      </p>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Indicador</th><th>Número</th><th>O que quer dizer</th></tr></thead>
          <tbody>
            <?php foreach (indicadores_do_site() as [$nome, $numero, $explica]): ?>
              <tr>
                <td data-rotulo="Indicador"><strong><?= h($nome) ?></strong></td>
                <td class="meia" data-rotulo="Número"><?= h($numero) ?></td>
                <td class="tarde" data-rotulo="O que quer dizer"><?= h($explica) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </fieldset>
    <?php
}
