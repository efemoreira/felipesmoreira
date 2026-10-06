<?php
declare(strict_types=1);

/**
 * API JSON "onde temos gente" — felipesmoreira.com/painel/api/gente.php
 *
 * GET → quantas pessoas da base unificada estão em cada cidade e bairro, por
 *       tipo (militante, apoiador…). Só TOTAIS: nenhum nome, telefone ou id sai
 *       daqui. É o que /resultados cruza com a força do partido e a
 *       oportunidade de voto ("onde há voto a conquistar × onde temos gente").
 *
 * `pessoas` é área com dado pessoal: só abre para quem tem a área Pessoas ou é
 * administrador, como a tela. Contrato do painel: 200 com o estado no corpo —
 * /resultados é página estática e pergunta antes de saber se há sessão.
 */

require_once __DIR__ . '/../sessao.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function responder_gente(array $corpo): void
{
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
    exit;
}

$u = usuario_atual();
if ($u === null) {
    responder_gente(['autenticado' => false, 'permitido' => false]);
}
if (!pode('pessoas') && !e_admin()) {
    responder_gente(['autenticado' => true, 'permitido' => false]);
}

$cidades = [];
foreach (ler_pessoas() as $p) {
    // recusada na fila de entrada não é gente nossa
    if (($p['status'] ?? '') === 'recusada') {
        continue;
    }
    $cidade = trim((string) ($p['cidade'] ?? ''));
    if ($cidade === '') {
        $cidade = '(sem cidade)';
    }
    $bairro = trim((string) ($p['bairro'] ?? ''));
    $tipo = isset(TIPOS_PESSOA[$p['tipo'] ?? '']) ? (string) $p['tipo'] : 'militante';

    $cidades[$cidade] ??= ['cidade' => $cidade, 'total' => 0, 'porTipo' => [], 'bairros' => []];
    $c = &$cidades[$cidade];
    $c['total']++;
    $c['porTipo'][$tipo] = ($c['porTipo'][$tipo] ?? 0) + 1;
    if ($bairro !== '') {
        // o bairro é texto livre na ficha: agrupa pela forma sem acento e em maiúsculas
        $chave = mb_strtoupper(sem_acento($bairro));
        $c['bairros'][$chave] ??= ['bairro' => $bairro, 'total' => 0, 'porTipo' => []];
        $c['bairros'][$chave]['total']++;
        $c['bairros'][$chave]['porTipo'][$tipo] = ($c['bairros'][$chave]['porTipo'][$tipo] ?? 0) + 1;
    }
    unset($c);
}

$saida = [];
foreach ($cidades as $c) {
    $c['bairros'] = array_values($c['bairros']);
    $saida[] = $c;
}
usort($saida, fn ($a, $b) => $b['total'] <=> $a['total']);

responder_gente([
    'autenticado' => true,
    'permitido'   => true,
    'tipos'       => TIPOS_PESSOA,
    'cidades'     => $saida,
]);
