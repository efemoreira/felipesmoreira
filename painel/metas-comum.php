<?php
declare(strict_types=1);

/**
 * As metas — o alvo que os números do movimento não tinham.
 *
 * Leituras dizia "quantos" e nunca "quantos deveriam ser": 120 militantes é
 * bom ou ruim depende de a coordenação ter combinado 100 ou 500 até tal dia.
 * Aqui a coordenação escreve o alvo (`dados/metas.php`) e a leitura passa a
 * dizer "x de y · faltam z · ritmo bom/atrasado".
 *
 * A MEDIDA é derivada do que já está gravado — nenhuma meta cria contagem
 * nova. Quatro medidas, e só quatro, porque são as que uma campanha cobra:
 * militantes, inscrições, presenças e encontros realizados. O ritmo compara o
 * que falta com os dias que faltam contra o que se andou por dia até aqui.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_METAS = PASTA_DADOS . '/metas.php';

const MEDIDAS_DE_META = [
    'militantes' => 'Militantes ativos',
    'inscricoes' => 'Inscrições recebidas',
    'presencas'  => 'Presenças em encontros',
    'encontros'  => 'Encontros realizados',
];

function normalizar_meta($m): ?array
{
    if (!is_array($m) || empty($m['id']) || !isset(MEDIDAS_DE_META[$m['medida'] ?? ''])) {
        return null;
    }
    $alvo = (int) ($m['alvo'] ?? 0);
    $ate  = limpar_texto($m['ate'] ?? '', 10);
    if ($alvo <= 0 || preg_match('/^\d{4}-\d{2}-\d{2}$/', $ate) !== 1) {
        return null;
    }
    return [
        'id'       => limpar_texto($m['id'], 40),
        'medida'   => (string) $m['medida'],
        'alvo'     => $alvo,
        'ate'      => $ate,
        'desde'    => limpar_texto($m['desde'] ?? '', 10),
        'criadoEm' => limpar_texto($m['criadoEm'] ?? '', 40),
        'criadoPor' => limpar_texto($m['criadoPor'] ?? '', 60),
    ];
}

function ler_metas(): array
{
    $bruto = is_file(ARQ_METAS) ? @include ARQ_METAS : null;
    $limpas = [];
    foreach (is_array($bruto) ? $bruto : [] as $m) {
        if ($ok = normalizar_meta($m)) {
            $limpas[] = $ok;
        }
    }
    usort($limpas, fn ($a, $b) => strcmp($a['ate'], $b['ate']));
    return $limpas;
}

function gravar_metas(array $metas): bool
{
    preparar_pastas();
    $limpas = [];
    foreach ($metas as $m) {
        if ($ok = normalizar_meta($m)) {
            $limpas[] = $ok;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. As metas da coordenação.\nreturn " . var_export($limpas, true) . ";\n";
    if (!gravar_atomico(ARQ_METAS, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_METAS, true);
    }
    return true;
}

/** O valor atual de uma medida — derivado, nunca gravado. */
function valor_da_medida(string $medida): int
{
    switch ($medida) {
        case 'militantes':
            return count(array_filter(ler_pessoas(), fn ($p) => in_array($p['tipo'], ['militante', 'coordenador'], true) && $p['ativo']));
        case 'inscricoes':
            return count(array_filter(ler_pessoas(), fn ($p) => $p['status'] !== ''));
        case 'presencas':
            require_once __DIR__ . '/eventos-comum.php';
            return count(array_filter(ler_presencas(), fn ($l) => $l['compareceu']));
        case 'encontros':
            require_once __DIR__ . '/eventos-comum.php';
            return count(array_filter(eventos_passados(), fn ($e) => $e['status'] !== 'cancelado'));
        default:
            return 0;
    }
}

/**
 * A meta lida: atual, faltam, dias que faltam e o ritmo.
 *
 * `ritmo`: `feito` (bateu), `bom` (o que falta por dia cabe no que se andou
 * por dia desde o começo), `atrasado` (não cabe), `vencida` (passou a data
 * sem bater). "Desde" é a data em que a meta foi escrita, para o ritmo
 * medir o andado a partir do combinado, não desde o início do movimento.
 */
function leitura_da_meta(array $m, ?int $agora = null): array
{
    $agora ??= time();
    $atual = valor_da_medida($m['medida']);
    $faltam = max(0, $m['alvo'] - $atual);
    $dias = (int) ceil((strtotime($m['ate'] . ' 23:59:59') - $agora) / 86400);
    $diasAndados = max(1, (int) ceil(($agora - strtotime($m['desde'] ?: $m['ate'])) / 86400));

    if ($faltam === 0) {
        $ritmo = 'feito';
    } elseif ($dias <= 0) {
        $ritmo = 'vencida';
    } else {
        /* Sem histórico do valor inicial, o ritmo é o andado total por dia
           desde o combinado — conservador quando a meta é nova. */
        $porDia = $atual / $diasAndados;
        $ritmo = $porDia * $dias >= $faltam ? 'bom' : 'atrasado';
    }
    return ['atual' => $atual, 'faltam' => $faltam, 'dias' => $dias, 'ritmo' => $ritmo];
}
