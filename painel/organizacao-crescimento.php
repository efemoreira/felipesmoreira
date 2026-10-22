<?php
declare(strict_types=1);

/** Regras de crescimento do plano. Os registros ficam na própria unidade. */
function normalizar_avaliacoes_de_ciclo($bruto): array
{
    $limpas = [];
    foreach (is_array($bruto) ? $bruto : [] as $a) {
        if (!is_array($a) || mes_valido($a['mes'] ?? '') === '' || trim((string) ($a['evidencia'] ?? '')) === '') {
            continue;
        }
        $mes = mes_valido($a['mes']);
        $limpas[$mes] = [
            'mes' => $mes, 'nivel' => max(0, min(4, (int) ($a['nivel'] ?? 0))),
            'evidencia' => limpar_texto($a['evidencia'], 500),
            'em' => limpar_texto($a['em'] ?? '', 40), 'por' => limpar_texto($a['por'] ?? '', 60),
        ];
    }
    ksort($limpas);
    return array_values($limpas);
}

function normalizar_historico_de_niveis($bruto): array
{
    $limpas = [];
    foreach (is_array($bruto) ? $bruto : [] as $h) {
        if (!is_array($h) || empty($h['em'])) {
            continue;
        }
        $limpas[] = [
            'de' => limpar_texto($h['de'] ?? '', 2), 'para' => limpar_texto($h['para'] ?? '', 2),
            'evidencia' => limpar_texto($h['evidencia'] ?? '', 500),
            'em' => limpar_texto($h['em'], 40), 'por' => limpar_texto($h['por'] ?? '', 60),
            'ciclos' => normalizar_avaliacoes_de_ciclo($h['ciclos'] ?? []),
            'responsavelId' => limpar_texto($h['responsavelId'] ?? '', 40),
        ];
    }
    return $limpas;
}

function grau_da_unidade(array $u): int
{
    return isset($u['maturidade']) ? (int) $u['maturidade'] : (int) substr((string) ($u['nivel'] ?? 'T0'), 1);
}

/** Os dois últimos meses ENCERRADOS; mês em andamento não é ciclo cumprido. */
function meses_de_promocao(?int $agora = null): array
{
    $inicio = new DateTimeImmutable(substr(hoje_ce($agora), 0, 7) . '-01');
    return [$inicio->modify('-2 months')->format('Y-m'), $inicio->modify('-1 month')->format('Y-m')];
}

/** Critérios qualitativos são atestados pela coordenação, por mês e com evidência. */
function faltas_para_promocao(array $u, int $alvo, ?int $agora = null): array
{
    $faltas = [];
    if ($u['encerradoEm'] !== '') {
        $faltas[] = 'reabrir a unidade';
    }
    if (!unidade_ativa($u, $agora)) {
        $faltas[] = 'responsável, entrega recente e próxima atividade';
    }
    if ($alvo >= 3 && $u['substitutoId'] === '') {
        $faltas[] = 'substituto para garantir continuidade';
    }
    $avaliacoes = array_column($u['avaliacoes'] ?? [], null, 'mes');
    foreach (meses_de_promocao($agora) as $mes) {
        $a = $avaliacoes[$mes] ?? null;
        if ($a === null || $a['nivel'] < $alvo || $a['evidencia'] === '') {
            $faltas[] = 'avaliação com evidência do nível pretendido em ' . $mes;
        }
        if (!array_filter($u['entregas'], fn ($e) => substr($e['data'], 0, 7) === $mes)) {
            $faltas[] = 'entrega registrada em ' . $mes;
        }
    }
    return $faltas;
}

/** Criação começa em T0 / maturidade 1; níveis anteriores existentes são preservados. */
function conferir_mudanca_de_nivel(array $novo, ?array $antigo, string $tipo, string $aba): array
{
    $campo = $tipo === 'grupo' ? 'maturidade' : 'nivel';
    $valores = $tipo === 'grupo' ? array_keys(MATURIDADE) : array_keys(NIVEIS_TERRITORIO);
    if (!in_array($novo[$campo], $valores, true)) {
        avisar('erro', 'Nível inválido.');
        voltar_organizacao($aba);
    }
    $antes = $antigo === null ? ($tipo === 'grupo' ? 1 : 0) : grau_da_unidade($antigo);
    $depois = grau_da_unidade($novo);
    if ($depois === $antes) {
        return $novo;
    }
    if ($novo['evidencia'] === '') {
        avisar('erro', 'Mudar de nível exige uma justificativa com evidência.');
        voltar_organizacao($aba);
    }
    if ($depois > $antes) {
        $faltas = $antigo === null ? ['cadastrar no nível inicial e cumprir dois ciclos mensais consecutivos']
            : faltas_para_promocao($novo, $depois);
        if ($faltas !== []) {
            avisar('erro', 'Para subir de nível falta: ' . implode('; ', $faltas) . '.');
            voltar_organizacao($aba);
        }
    }
    $novo['historicoNiveis'][] = [
        'de' => $tipo === 'grupo' ? (string) $antes : 'T' . $antes,
        'para' => (string) $novo[$campo], 'evidencia' => $novo['evidencia'],
        'em' => date('c'), 'por' => quem_grava(),
        'ciclos' => $depois > $antes ? array_values(array_filter($novo['avaliacoes'], fn ($a) => in_array($a['mes'], meses_de_promocao(), true))) : [],
        'responsavelId' => $novo['responsavelId'],
    ];
    return $novo;
}

function avaliar_ciclo_da_unidade(): void
{
    $tipo = (string) ($_POST['tipo'] ?? '');
    if (!in_array($tipo, ['nucleo', 'grupo'], true)) {
        avisar('erro', 'Avaliação disponível para núcleos e grupos temáticos.');
        voltar_organizacao();
    }
    [$lista, $gravar, $aba] = unidades_do_tipo($tipo);
    $u = achar_para_editar($lista, $aba, 'Unidade');
    $mes = mes_valido($_POST['mes'] ?? '');
    $nivel = (string) ($_POST['nivelAvaliado'] ?? '');
    $evidencia = limpar_texto($_POST['evidenciaCiclo'] ?? '', 500);
    if ($u === null || $u['encerradoEm'] !== '' || $mes === '' || $mes >= substr(hoje_ce(), 0, 7)
        || !preg_match('/^[0-4]$/', $nivel) || $evidencia === '') {
        avisar('erro', 'Avalie um mês encerrado, com nível e evidência, de uma unidade aberta.');
        voltar_organizacao($aba);
    }
    if (substr($u['criadoEm'], 0, 7) > $mes) {
        avisar('erro', 'O ciclo é anterior à criação da unidade.');
        voltar_organizacao($aba);
    }
    if (!array_filter($u['entregas'], fn ($e) => substr($e['data'], 0, 7) === $mes)) {
        avisar('erro', 'Registre a entrega desse mês antes de avaliar o ciclo.');
        voltar_organizacao($aba);
    }
    $u['avaliacoes'][] = ['mes' => $mes, 'nivel' => (int) $nivel, 'evidencia' => $evidencia, 'em' => date('c'), 'por' => quem_grava()];
    if (!$gravar(array_map(fn ($item) => $item['id'] === $u['id'] ? $u : $item, $lista))) {
        avisar('erro', 'Não consegui gravar a avaliação.');
    } else {
        avisar('ok', 'Ciclo avaliado. A promoção exige os dois últimos meses encerrados com evidência.');
    }
    voltar_organizacao($aba);
}

/**
 * Revisão em jan/abr/jul/out. Falta de fechamento é pendência, nunca reprovação.
 * O saldo compara fim do trimestre com fim do anterior (7 fechamentos para 2 trimestres).
 * Cada par de trimestres reprovados retira um nível. Um trimestre saudável
 * permite recuperar um nível se os critérios de subida voltarem a ser cumpridos.
 */
function revisao_trimestral_liga(array $pv, ?int $agora = null): array
{
    $meses = array_column($pv['meses'], null, 'mes');
    $resultado = ['rebaixamentos' => 0, 'trimestres' => [], 'pendentes' => []];
    if ($meses === []) {
        return $resultado;
    }
    $primeiro = min(array_keys($meses));
    $inicio = new DateTimeImmutable($primeiro . '-01');
    $inicio = $inicio->modify('-' . (((int) $inicio->format('n') - 1) % 3) . ' months');
    $hoje = hoje_ce($agora);
    $seguidos = 0;
    // Limite de segurança para registros antigos inválidos; cobre cem anos de operação.
    for ($i = 0; $i < 400; $i++, $inicio = $inicio->modify('+3 months')) {
        $fim = $inicio->modify('+3 months')->format('Y-m-d');
        if ($fim > $hoje) {
            break;
        }
        if (substr($pv['criadoEm'] ?? '', 0, 10) > $inicio->format('Y-m-d')) {
            continue;
        }
        $chave = $inicio->format('Y') . '-T' . (int) ceil((int) $inicio->format('n') / 3);
        $necessarios = [];
        for ($j = -1; $j < 3; $j++) {
            $necessarios[] = $inicio->modify(($j >= 0 ? '+' : '') . $j . ' months')->format('Y-m');
        }
        $faltam = array_values(array_diff($necessarios, array_keys($meses)));
        if ($faltam !== []) {
            $resultado['pendentes'][] = $chave . ': faltam ' . implode(', ', $faltam);
            $seguidos = 0;
            continue;
        }
        $cresceu = seguidores_de($pv, $meses[$necessarios[3]]) > seguidores_de($pv, $meses[$necessarios[0]]);
        $acoes = array_sum(array_map(fn ($m) => $meses[$m]['acoes'], array_slice($necessarios, 1)));
        $motivos = [];
        if (!$cresceu) {
            $motivos[] = 'sem crescimento líquido';
        }
        if ($acoes === 0) {
            $motivos[] = 'sem ação local';
        }
        if ($motivos === []) {
            $seguidos = 0;
            if ($resultado['rebaixamentos'] > 0) {
                $ate = $pv;
                $ate['meses'] = array_values(array_filter($pv['meses'], fn ($m) => $m['mes'] <= $necessarios[3]));
                $conquistado = conquista_da_liga($ate, $necessarios[3]);
                $ordem = array_keys(NIVEIS_LIGA);
                $atual = (int) array_search($conquistado['atual']['nivel'], $ordem, true);
                if ($atual > max(0, $conquistado['maior'] - $resultado['rebaixamentos'])) {
                    $resultado['rebaixamentos']--;
                }
            }
        } elseif (++$seguidos === 2) {
            $conquistado = conquista_da_liga($pv, $necessarios[3]);
            // Nível E é o piso: não acumula punições invisíveis para promoções futuras.
            if ($conquistado['maior'] > $resultado['rebaixamentos']) {
                $resultado['rebaixamentos']++;
            }
            $seguidos = 0;
        }
        $resultado['trimestres'][] = ['trimestre' => $chave, 'motivos' => $motivos, 'rebaixamentos' => $resultado['rebaixamentos']];
    }
    return $resultado;
}

/** O maior nível já comprovado, com os fechamentos disponíveis até esse mês. */
function conquista_da_liga(array $pv, string $ateMes): array
{
    $ordem = array_keys(NIVEIS_LIGA);
    $maior = 0;
    $prefixo = $pv;
    foreach (['redesEm', 'formacaoEm', 'acaoEm'] as $campo) {
        if (substr($prefixo[$campo], 0, 7) > $ateMes) {
            $prefixo[$campo] = '';
        }
    }
    $prefixo['meses'] = array_values(array_filter($pv['meses'], fn ($m) => $m['mes'] <= $ateMes));
    $atual = nivel_liga_por_criterios($prefixo);
    $maior = (int) array_search($atual['nivel'], $ordem, true);
    foreach ($prefixo['meses'] as $m) {
        $recorte = $prefixo;
        $recorte['meses'] = array_values(array_filter($prefixo['meses'], fn ($a) => $a['mes'] <= $m['mes']));
        foreach (['redesEm', 'formacaoEm', 'acaoEm'] as $campo) {
            if (substr($pv[$campo], 0, 7) > $m['mes']) {
                $recorte[$campo] = '';
            }
        }
        $maior = max($maior, (int) array_search(nivel_liga_por_criterios($recorte)['nivel'], $ordem, true));
    }
    return ['maior' => $maior, 'atual' => $atual];
}

/** Mantém o nível conquistado até a revisão trimestral; um mês parado não o apaga. */
function nivel_liga(array $pv, ?int $agora = null): array
{
    $ordem = array_keys(NIVEIS_LIGA);
    ['maior' => $maior, 'atual' => $atual] = conquista_da_liga($pv, substr(hoje_ce($agora), 0, 7));
    $revisao = revisao_trimestral_liga($pv, $agora);
    $indice = max(0, $maior - $revisao['rebaixamentos']);
    if ($revisao['rebaixamentos'] === 0 && $indice === array_search($atual['nivel'], $ordem, true)) {
        return $atual + ['revisao' => $revisao];
    }
    $faltas = [];
    $ate = $pv;
    $ate['meses'] = array_values(array_filter($pv['meses'], fn ($m) => $m['mes'] <= substr(hoje_ce($agora), 0, 7)));
    foreach (criterios_da_liga($ate) as $nivel => $itens) {
        foreach ($itens as [$cumpriu, $texto]) {
            if (!$cumpriu) {
                $faltas[] = $texto;
            }
        }
        if ($nivel === ($ordem[$indice + 1] ?? 'A')) {
            break;
        }
    }
    return [
        'nivel' => $ordem[$indice], 'proximo' => $ordem[$indice + 1] ?? '',
        'falta' => $revisao['rebaixamentos'] > 0
            ? ['Na próxima revisão, comprovar crescimento líquido, ação local e os critérios de subida para recuperar um nível']
            : $faltas,
        'revisao' => $revisao,
    ];
}
