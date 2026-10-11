<?php
declare(strict_types=1);

/**
 * DECISÕES DO MÊS — a ata da revisão mensal (plano 2026–2027: "Decisões e
 * atas", e as cinco perguntas do painel de comando).
 *
 * Um registro por mês: as três prioridades do mês seguinte e o que foi
 * decidido (o que subir, o que apoiar, o que simplificar, adiar ou encerrar).
 * Gravar de novo o mesmo mês corrige, não duplica. Mora em Leituras › Comando,
 * ao lado dos números que a reunião leu — como as metas, é a única escrita da
 * mesa de olhar, e pelo mesmo motivo: é a régua do resto.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_DECISOES = PASTA_DADOS . '/decisoes.php';

function normalizar_decisao($d): ?array
{
    if (!is_array($d)) {
        return null;
    }
    $mes = limpar_texto($d['mes'] ?? '', 7);
    if (preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $mes) !== 1) {
        return null;
    }
    $prioridades = array_values(array_filter(array_map(
        fn ($p) => limpar_texto($p, 140),
        array_slice(is_array($d['prioridades'] ?? null) ? $d['prioridades'] : [], 0, 3)
    )));
    return [
        'id'          => $mes,
        'mes'         => $mes,
        'prioridades' => $prioridades,
        'decisoes'    => limpar_texto($d['decisoes'] ?? '', 1200),
        'em'          => limpar_texto($d['em'] ?? '', 40),
        'por'         => limpar_texto($d['por'] ?? '', 60),
        'alteradoEm'  => limpar_texto($d['alteradoEm'] ?? '', 40),
        'alteradoPor' => limpar_texto($d['alteradoPor'] ?? '', 60),
    ];
}

/** Por mês, o mais recente primeiro. */
function ler_decisoes(): array
{
    $bruto = is_file(ARQ_DECISOES) ? @include ARQ_DECISOES : null;
    $limpas = [];
    foreach (is_array($bruto) ? $bruto : [] as $d) {
        if ($ok = normalizar_decisao($d)) {
            $limpas[$ok['mes']] = $ok;
        }
    }
    krsort($limpas);
    return array_values($limpas);
}

function gravar_decisoes(array $decisoes): bool
{
    preparar_pastas();
    $limpas = [];
    foreach ($decisoes as $d) {
        if ($ok = normalizar_decisao($d)) {
            $limpas[$ok['mes']] = $ok;
        }
    }
    $limpas = carimbar_alteracoes(ler_decisoes(), array_values($limpas));
    $conteudo = "<?php\n// Gerado pelo painel. As decisões da revisão mensal.\nreturn " . var_export($limpas, true) . ";\n";
    if (!gravar_atomico(ARQ_DECISOES, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_DECISOES, true);
    }
    return true;
}

function decisao_do_mes(string $mes): ?array
{
    foreach (ler_decisoes() as $d) {
        if ($d['mes'] === $mes) {
            return $d;
        }
    }
    return null;
}
