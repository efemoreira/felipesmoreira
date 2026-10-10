<?php
declare(strict_types=1);

/**
 * A ESCADA DE ENGAJAMENTO — de Interessado a Multiplicador.
 *
 * O plano de 2026–2027 diz: "o principal indicador não é quantas pessoas
 * entram na lista, e sim quantas sobem um degrau por mês". Este arquivo é essa
 * conta.
 *
 * DERIVADA, COMO A REATIVAÇÃO. Não existe campo "degrau" na ficha, e não pode
 * existir: degrau escrito à mão é degrau que ninguém atualiza, e a contagem do
 * mês viraria a contagem de quem lembrou de mexer na ficha. Cada degrau sai de
 * algo que o painel JÁ grava, e com data — é a data que permite dizer em que
 * mês a pessoa subiu:
 *
 *   1 Interessado    deixou contato                → criadoEm da ficha
 *   2 Participante   foi a uma atividade           → presença com "compareceu"
 *   3 Colaborador    concluiu uma tarefa           → tarefa feita, entrega
 *                                                    registrada, entrada na Liga
 *   4 Responsável    cuida de algo recorrente      → responsável ou substituto
 *                                                    de núcleo ou grupo aberto
 *   5 Multiplicador  formou outra pessoa ou ajudou → lidera alguém que já é
 *                    a abrir um núcleo                Colaborador, ou responde
 *                                                    por um polo multiplicador
 *                                                    (T4 / maturidade 4)
 *
 * O degrau é o MAIS ALTO alcançado — quem virou responsável sem ter ido a um
 * encontro é responsável. A escada mede onde a pessoa chegou, não se ela
 * cumpriu a ordem.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/presencas-comum.php';
require_once __DIR__ . '/eventos-comum.php';
require_once __DIR__ . '/tarefas-comum.php';
require_once __DIR__ . '/organizacao-comum.php';

const DEGRAUS = [
    1 => ['nome' => 'Interessado',   'resumo' => 'Deixou contato ou entrou num grupo.',                'proximo' => 'Conversa em até 72h e convite para uma atividade'],
    2 => ['nome' => 'Participante',  'resumo' => 'Foi a uma atividade.',                               'proximo' => 'Convite para a próxima e uma tarefa pequena'],
    3 => ['nome' => 'Colaborador',   'resumo' => 'Concluiu uma tarefa.',                               'proximo' => 'Entrar num núcleo, grupo temático ou trilha'],
    4 => ['nome' => 'Responsável',   'resumo' => 'Cuida de algo recorrente, com substituto e registro.', 'proximo' => 'Formar um substituto'],
    5 => ['nome' => 'Multiplicador', 'resumo' => 'Formou outra pessoa ou ajudou a abrir um núcleo.',   'proximo' => 'Abrir o próximo núcleo'],
];

/** AAAA-MM-DD de um carimbo ISO, ou '' quando não dá para ler. */
function dia_do_carimbo(string $iso): string
{
    if ($iso === '') {
        return '';
    }
    $t = strtotime($iso);
    if ($t === false) {
        return '';
    }
    return (new DateTimeImmutable('@' . $t))->setTimezone(new DateTimeZone('America/Fortaleza'))->format('Y-m-d');
}

/** Guarda a data mais cedo de um degrau para uma pessoa. */
function marcar_degrau(array &$datas, string $pessoaId, int $degrau, string $dia): void
{
    if ($pessoaId === '' || $dia === '' || !isset($datas[$pessoaId])) {
        return;
    }
    $atual = $datas[$pessoaId][$degrau] ?? '';
    if ($atual === '' || $dia < $atual) {
        $datas[$pessoaId][$degrau] = $dia;
    }
}

/**
 * Para cada pessoa, a data em que ela alcançou cada degrau (o mais cedo).
 * `[pessoaId => [1 => '2026-09-01', 2 => '2026-09-20', 3 => '', …]]`.
 *
 * Memoizada: o painel de comando a lê para a distribuição, para os meses e
 * para a lista de decisões, e cada leitura atravessa cinco arquivos.
 */
function datas_da_escada(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }

    $datas = [];
    foreach (ler_pessoas() as $p) {
        if ($p['status'] === 'recusada') {
            continue;
        }
        $datas[$p['id']] = [1 => dia_do_carimbo($p['criadoEm']) ?: '2000-01-01', 2 => '', 3 => '', 4 => '', 5 => ''];
    }

    /* 2 — foi a uma atividade. A data é a do ENCONTRO, e não a do registro: a
       recepção que digita na segunda o que aconteceu no sábado não muda o mês
       em que a pessoa chegou. */
    $inicio = [];
    foreach (ler_eventos() as $e) {
        $inicio[$e['id']] = dia_do_carimbo((string) ($e['inicio'] ?? ''));
    }
    foreach (ler_presencas() as $pr) {
        if ($pr['compareceu']) {
            marcar_degrau($datas, $pr['pessoaId'], 2, ($inicio[$pr['eventoId']] ?? '') ?: dia_do_carimbo($pr['criadoEm']));
        }
    }

    /* 3 — concluiu uma tarefa. Três jeitos de o painel saber disso. */
    foreach (ler_tarefas() as $t) {
        if ($t['feitaEm'] !== '') {
            marcar_degrau($datas, $t['donoId'], 3, dia_do_carimbo($t['feitaEm']));
        }
    }
    $nucleos = ler_nucleos();
    $grupos = ler_grupos();
    foreach (array_merge($nucleos, $grupos) as $u) {
        foreach ($u['entregas'] as $e) {
            marcar_degrau($datas, $e['porId'], 3, $e['data']);
        }
    }
    foreach (ler_liga() as $pv) {
        marcar_degrau($datas, $pv['pessoaId'], 3, dia_do_carimbo($pv['criadoEm']));
    }

    /* 4 — cuida de algo recorrente: responsável ou substituto de núcleo ou
       grupo. Unidade encerrada continua contando: a escada guarda o degrau
       ALCANÇADO, e encerrar não é fracasso — quem respondeu por um núcleo
       que cumpriu o ciclo dele não volta a ser Interessado. */
    $polo = fn ($u) => (isset($u['nivel']) && $u['nivel'] === 'T4') || (($u['maturidade'] ?? 0) === 4);
    foreach (array_merge($nucleos, $grupos) as $u) {
        foreach (['responsavel', 'substituto'] as $papel) {
            $id = $u[$papel . 'Id'];
            $desde = dia_do_carimbo($u[$papel . 'Desde']) ?: dia_do_carimbo($u['criadoEm']);
            marcar_degrau($datas, $id, 4, $desde);
            /* 5 — responde por um polo multiplicador. */
            if ($papel === 'responsavel' && $polo($u)) {
                marcar_degrau($datas, $id, 5, dia_do_carimbo($u['alteradoEm']) ?: $desde);
            }
        }
    }

    /* 5 — formou outra pessoa: lidera alguém que já chegou a Colaborador. A
       data é o dia em que o primeiro liderado chegou lá. */
    foreach (ler_pessoas() as $p) {
        if ($p['lider'] === '' || !isset($datas[$p['id']])) {
            continue;
        }
        $colaborou = degrau_em_dia($datas[$p['id']], '9999-12-31') >= 3
            ? min(array_filter([$datas[$p['id']][3], $datas[$p['id']][4], $datas[$p['id']][5]]))
            : '';
        marcar_degrau($datas, $p['lider'], 5, $colaborou);
    }

    return $memo = $datas;
}

/** O degrau de alguém num dia: o mais alto cuja data já chegou. 0 = ainda não existia. */
function degrau_em_dia(array $datas, string $dia): int
{
    for ($k = 5; $k >= 1; $k--) {
        if ($datas[$k] !== '' && $datas[$k] <= $dia) {
            return $k;
        }
    }
    return 0;
}

/** O degrau de hoje, de todo mundo. */
function degraus_de_hoje(?int $agora = null): array
{
    $hoje = hoje_ce($agora);
    $degraus = [];
    foreach (datas_da_escada() as $id => $datas) {
        $degraus[$id] = degrau_em_dia($datas, $hoje);
    }
    return $degraus;
}

/** Quantas pessoas em cada degrau, hoje. `[1 => n, …, 5 => n]`. */
function distribuicao_da_escada(?int $agora = null): array
{
    $contagem = array_fill_keys(array_keys(DEGRAUS), 0);
    foreach (degraus_de_hoje($agora) as $d) {
        if ($d > 0) {
            $contagem[$d]++;
        }
    }
    return $contagem;
}

/**
 * O INDICADOR-NORTE: quantas pessoas subiram de degrau em cada mês.
 *
 * Subir é terminar o mês num degrau mais alto do que começou — quem ainda não
 * existia no começo do mês ENTROU, e entrada é contada à parte. Misturar as
 * duas faria uma campanha de cadastro parecer crescimento de base, que é
 * exatamente o número enganoso que o plano manda evitar.
 *
 * Os `$meses` mais recentes, do mais antigo para o atual (o atual vai até hoje).
 */
function subidas_por_mes(int $meses = 6, ?int $agora = null): array
{
    $hoje = new DateTimeImmutable(hoje_ce($agora));
    $datas = datas_da_escada();
    $linhas = [];
    for ($i = $meses - 1; $i >= 0; $i--) {
        $primeiro = $hoje->modify('first day of this month')->modify("-{$i} months");
        $vespera = $primeiro->modify('-1 day')->format('Y-m-d');
        $fim = min($primeiro->modify('last day of this month')->format('Y-m-d'), $hoje->format('Y-m-d'));
        $subiram = $entraram = 0;
        foreach ($datas as $d) {
            $antes = degrau_em_dia($d, $vespera);
            $depois = degrau_em_dia($d, $fim);
            if ($antes === 0 && $depois > 0) {
                $entraram++;
            } elseif ($depois > $antes) {
                $subiram++;
            }
        }
        $linhas[] = ['mes' => $primeiro->format('Y-m'), 'subiram' => $subiram, 'entraram' => $entraram];
    }
    return $linhas;
}

/** "out/26" — o mês curto para o rótulo. */
function mes_curto(string $mes): string
{
    $nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    [$a, $m] = array_map('intval', explode('-', $mes));
    return $nomes[$m - 1] . '/' . substr((string) $a, 2);
}

/**
 * Ativos no mês: quem fez uma contribuição concreta — esteve num encontro,
 * concluiu tarefa, registrou entrega. "Estar cadastrado ou num grupo de
 * mensagens não conta." É a definição do plano, e é por ela que o número
 * deste cartão é sempre menor do que o de cadastros.
 */
function ativos_no_mes(?int $agora = null): int
{
    $hoje = hoje_ce($agora);
    $desde = substr($hoje, 0, 7) . '-01';
    $ativos = [];

    $inicio = [];
    foreach (ler_eventos() as $e) {
        $inicio[$e['id']] = dia_do_carimbo((string) ($e['inicio'] ?? ''));
    }
    foreach (ler_presencas() as $pr) {
        $dia = $inicio[$pr['eventoId']] ?? '';
        if ($pr['compareceu'] && $dia >= $desde && $dia <= $hoje) {
            $ativos[$pr['pessoaId']] = true;
        }
    }
    foreach (ler_tarefas() as $t) {
        $dia = dia_do_carimbo($t['feitaEm']);
        if ($dia >= $desde && $dia <= $hoje) {
            $ativos[$t['donoId']] = true;
        }
    }
    foreach (array_merge(ler_nucleos(), ler_grupos()) as $u) {
        foreach ($u['entregas'] as $e) {
            if ($e['data'] >= $desde && $e['porId'] !== '') {
                $ativos[$e['porId']] = true;
            }
        }
    }
    unset($ativos['']);
    return count($ativos);
}

/** Os degraus, para o teste de contrato comparar com o `DEGRAUS` do site. */
function catalogo_da_escada(): array
{
    return array_values(array_map(fn ($d) => ['nome' => $d['nome'], 'resumo' => $d['resumo']], DEGRAUS));
}
