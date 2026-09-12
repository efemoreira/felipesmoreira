<?php
declare(strict_types=1);

/**
 * Os sinais do site — a medição mínima, sem terceiro.
 *
 * O site não tinha número nenhum: a única leitura de conversão era a que o
 * painel derivava de `?de=`. Não dava para saber quantos abriram `/candidatos`,
 * quantos clicaram em compartilhar, quantos pararam no passo 2 do formulário.
 * E a resposta de mercado — um script de terceiro — leva o visitante junto:
 * cookie, identificador, endereço, tudo para fora.
 *
 * Aqui se guarda SÓ A CONTAGEM: `[dia][rota][evento] => n`. Nenhum IP, nenhum
 * cookie, nenhum id, nenhuma sequência de páginas. É o bastante para a
 * pergunta que importa ("quantos abriram e quantos compartilharam esta
 * semana?") e é o máximo que se guarda de quem não pediu para ser guardado.
 *
 * Rota e evento vêm de listas fechadas: o endpoint é público, e o que não
 * está na lista é descartado calado — contar o inválido ensinaria a inventar.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_SINAIS = PASTA_DADOS . '/sinais.php';

/** Quantos dias ficam. O resto sai na próxima gravação. */
const DIAS_DE_SINAL = 60;

/** As rotas que contam — as do sitemap mais as internas que interessam. */
const ROTAS_SINAL = [
    '' => 'Início',
    'amissao' => 'A Missão',
    'propostas' => 'Propostas',
    'candidatos' => 'Candidatos',
    'funcoes' => 'Funções',
    'queroajudar' => 'Quero ajudar',
    'programacao' => 'Programação',
    'heroisdoceara' => 'Heróis',
    'municao' => 'Munição',
    'presenca' => 'Presença',
    'aulas' => 'Aulas',
    'convite' => 'Convite',
    'plano' => 'Plano',
];

const EVENTOS_SINAL = [
    'abriu' => 'Abriram',
    'compartilhou' => 'Compartilharam',
    'passo-2' => 'Passo 2',
    'passo-3' => 'Passo 3',
    'enviou-inscricao' => 'Inscreveram-se',
];

function ler_sinais(): array
{
    $bruto = is_file(ARQ_SINAIS) ? @include ARQ_SINAIS : null;
    return is_array($bruto) ? $bruto : [];
}

/** Soma um. Rota ou evento fora da lista: não grava, e não reclama. */
function registrar_sinal(string $rota, string $evento): void
{
    if (!isset(ROTAS_SINAL[$rota]) || !isset(EVENTOS_SINAL[$evento])) {
        return;
    }
    com_trava(ARQ_SINAIS, function () use ($rota, $evento): void {
        preparar_pastas();
        $tudo = ler_sinais();
        $dia = dia_no_ceara();
        $tudo[$dia][$rota][$evento] = ((int) ($tudo[$dia][$rota][$evento] ?? 0)) + 1;

        $corte = dia_no_ceara(time() - DIAS_DE_SINAL * 86400);
        foreach (array_keys($tudo) as $d) {
            if ($d < $corte) {
                unset($tudo[$d]);
            }
        }
        ksort($tudo);
        gravar_atomico(ARQ_SINAIS, "<?php\n// Gerado pelo painel. Só contagem — nada de quem.\nreturn " . var_export($tudo, true) . ";\n");
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate(ARQ_SINAIS, true);
        }
    });
}

/** AAAA-MM-DD no fuso do Ceará — o mesmo dia que a semana da programação usa. */
function dia_no_ceara(?int $agora = null): string
{
    return (new DateTimeImmutable('@' . ($agora ?? time())))
        ->setTimezone(new DateTimeZone('America/Fortaleza'))
        ->format('Y-m-d');
}

/**
 * A soma por rota × evento entre dois dias (inclusive), na ordem de
 * ROTAS_SINAL. Rota sem sinal no período fica de fora.
 */
function sinais_entre(string $de, string $ate): array
{
    $soma = [];
    foreach (ler_sinais() as $dia => $rotas) {
        if ($dia < $de || $dia > $ate) {
            continue;
        }
        foreach ($rotas as $rota => $eventos) {
            foreach ($eventos as $evento => $n) {
                $soma[$rota][$evento] = ((int) ($soma[$rota][$evento] ?? 0)) + (int) $n;
            }
        }
    }
    $ordenado = [];
    foreach (array_keys(ROTAS_SINAL) as $rota) {
        if (isset($soma[$rota])) {
            $ordenado[$rota] = $soma[$rota];
        }
    }
    return $ordenado;
}
