<?php
declare(strict_types=1);

/**
 * Tarefas — "Fulano, resolve o som até quinta".
 *
 * Tudo no painel era pendência DERIVADA: o fato sem checagem, a inscrição
 * parada, o follow-up vencido. O que não existia era a pendência COMBINADA —
 * alguém pediu algo a alguém, com prazo — e por isso ela vivia no WhatsApp,
 * onde some. Uma tarefa é: o quê, quem, até quando, e (se for de um encontro)
 * qual. Feita, ganha `feitaEm`/`feitaPor`; apagada, a lápide.
 *
 * Nasce como aba de Encontros (é onde a maioria das tarefas nasce) e como
 * pendência no Início de quem é o dono — pelo mesmo registro
 * (`pendencias_tarefas()`) das outras áreas. Não é área: é item solto, como
 * "Sua gente" — todo mundo com conta pode ter uma tarefa, tenha a área que
 * tiver. Sobe para o menu se o uso pedir.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_TAREFAS = PASTA_DADOS . '/tarefas.php';

function normalizar_tarefa($t): ?array
{
    if (!is_array($t) || empty($t['id'])) {
        return null;
    }
    $titulo = limpar_texto($t['titulo'] ?? '', 140);
    if ($titulo === '') {
        return null;
    }
    $ate = limpar_texto($t['ate'] ?? '', 10);
    return [
        'id'        => limpar_texto($t['id'], 40),
        'titulo'    => $titulo,
        'donoId'    => limpar_texto($t['donoId'] ?? '', 40),
        'ate'       => preg_match('/^\d{4}-\d{2}-\d{2}$/', $ate) === 1 ? $ate : '',
        'eventoId'  => limpar_texto($t['eventoId'] ?? '', 40),
        'criadoEm'  => limpar_texto($t['criadoEm'] ?? '', 40),
        'criadoPor' => limpar_texto($t['criadoPor'] ?? '', 60),
        'feitaEm'   => limpar_texto($t['feitaEm'] ?? '', 40),
        'feitaPor'  => limpar_texto($t['feitaPor'] ?? '', 60),
        'alteradoEm'  => limpar_texto($t['alteradoEm'] ?? '', 40),
        'alteradoPor' => limpar_texto($t['alteradoPor'] ?? '', 60),
        'apagadoEm'   => limpar_texto($t['apagadoEm'] ?? '', 40),
        'apagadoPor'  => limpar_texto($t['apagadoPor'] ?? '', 60),
    ];
}

function ler_tarefas_tudo(): array
{
    $bruto = is_file(ARQ_TAREFAS) ? @include ARQ_TAREFAS : null;
    $limpas = [];
    foreach (is_array($bruto) ? $bruto : [] as $t) {
        if ($ok = normalizar_tarefa($t)) {
            $limpas[] = $ok;
        }
    }
    return $limpas;
}

/** As vivas — feitas ou não. Lápide fica fora, como em pessoas e caixa. */
function ler_tarefas(): array
{
    $vivas = array_values(array_filter(ler_tarefas_tudo(), fn ($t) => $t['apagadoEm'] === ''));
    /* Abertas primeiro, e dentro delas a que vence antes; sem prazo vai para o
       fim — sem data não há urgência a ler. Feitas depois, a mais recente no topo. */
    usort($vivas, fn ($a, $b) => [
        $a['feitaEm'] !== '', $a['ate'] === '', $a['ate'], $a['feitaEm'] !== '' ? -strtotime($a['feitaEm']) : 0,
    ] <=> [
        $b['feitaEm'] !== '', $b['ate'] === '', $b['ate'], $b['feitaEm'] !== '' ? -strtotime($b['feitaEm']) : 0,
    ]);
    return $vivas;
}

function gravar_tarefas(array $tarefas): bool
{
    preparar_pastas();
    $limpas = [];
    foreach ($tarefas as $t) {
        if ($ok = normalizar_tarefa($t)) {
            $limpas[] = $ok;
        }
    }
    $limpas = carimbar_alteracoes(ler_tarefas_tudo(), $limpas);
    $conteudo = "<?php\n// Gerado pelo painel. As tarefas combinadas — quem, o quê, até quando.\nreturn " . var_export($limpas, true) . ";\n";
    if (!gravar_atomico(ARQ_TAREFAS, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_TAREFAS, true);
    }
    return true;
}

function tarefas_abertas(): array
{
    return array_values(array_filter(ler_tarefas(), fn ($t) => $t['feitaEm'] === ''));
}

function tarefas_do_evento(string $eventoId): array
{
    return array_values(array_filter(ler_tarefas(), fn ($t) => $t['eventoId'] === $eventoId));
}

/** Vencida: tem prazo, ele passou (no Ceará), e não está feita. */
function tarefa_vencida(array $t, ?int $agora = null): bool
{
    if ($t['feitaEm'] !== '' || $t['ate'] === '') {
        return false;
    }
    $fim = (new DateTimeImmutable($t['ate'] . ' 23:59:59', new DateTimeZone('America/Fortaleza')))->getTimestamp();
    return ($agora ?? time()) > $fim;
}

/**
 * O que está esperando por esta pessoa: as tarefas dela, abertas. Vencida é
 * urgente. Entra no Início pelo mesmo registro das áreas (`ORDEM_AGORA`),
 * como item solto — todo mundo com conta pode ser dono de uma tarefa.
 */
function pendencias_tarefas(array $u): array
{
    $itens = [];
    foreach (tarefas_abertas() as $t) {
        if ($t['donoId'] !== $u['id']) {
            continue;
        }
        $vencida = tarefa_vencida($t);
        $itens[] = [
            'area'    => 'tarefas',
            'icone'   => 'flag',
            'urgente' => $vencida,
            'texto'   => $t['titulo'],
            'porque'  => $t['ate'] === ''
                ? 'combinada com você, sem prazo'
                : ($vencida ? 'venceu em ' . data_humana($t['ate']) : 'até ' . data_humana($t['ate'])),
            'url'     => '/painel/eventos.php?aba=tarefas#t-' . $t['id'],
        ];
    }
    return $itens;
}
