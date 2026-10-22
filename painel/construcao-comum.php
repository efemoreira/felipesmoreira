<?php
declare(strict_types=1);
require_once __DIR__ . '/sessao.php';

function chave_de_mapeamento(string $texto): string
{
    return sem_acento(mb_strtolower(preg_replace('/\s+/u', ' ', trim($texto)) ?? $texto));
}

/** Pessoas interessadas, não unidades criadas nem contagem de militantes ativos. */
function pessoas_para_construcao(array $pessoas, array $filtros = []): array
{
    return array_values(array_filter($pessoas, function ($p) use ($filtros) {
        if ($p['status'] === 'recusada') {
            return false;
        }
        $perfil = $p['participacao'];
        foreach (['frente' => 'frentes', 'tema' => 'temas', 'eixo' => 'cultura', 'contribuicao' => 'contribuicoes', 'periodo' => 'periodos'] as $filtro => $campo) {
            $v = is_string($filtros[$filtro] ?? null) ? $filtros[$filtro] : '';
            if ($v !== '' && !in_array($v, $perfil[$campo], true)) {
                return false;
            }
        }
        foreach (['cidade', 'bairro', 'profissao', 'instituicao', 'campus', 'disponibilidade', 'modalidade'] as $campo) {
            $v = is_string($filtros[$campo] ?? null) ? trim($filtros[$campo]) : '';
            $valor = in_array($campo, ['cidade', 'bairro'], true) ? $p[$campo] : $perfil[$campo];
            if ($v !== '' && chave_de_mapeamento($valor) !== chave_de_mapeamento($v)) {
                return false;
            }
        }
        $q = is_string($filtros['q'] ?? null) ? limpar_texto($filtros['q'], 120) : '';
        return $q === '' || combina_com([$p['nome'], $p['cidade'], $p['bairro'], ...array_values(resumo_de_participacao($perfil))], $q);
    }));
}

/** Agrupa grafias equivalentes, conta cada pessoa uma vez por item. */
function agrupamentos_de_construcao(array $pessoas): array
{
    $c = catalogo_de_participacao();
    $mapas = array_fill_keys(['territorios', 'instituicoes', 'profissoes', 'frentes', 'temas', 'cultura', 'contribuicoes', 'disponibilidades'], []);
    $somar = function (string $tipo, string $nome, array $p) use (&$mapas): void {
        if (trim($nome) === '') {
            return;
        }
        $chave = chave_de_mapeamento($nome);
        $mapas[$tipo][$chave] ??= ['nome' => $nome, 'total' => 0, 'pendentes' => 0, 'aprovados' => 0];
        $mapas[$tipo][$chave]['total']++;
        $mapas[$tipo][$chave]['pendentes'] += $p['status'] === 'pendente' ? 1 : 0;
        $mapas[$tipo][$chave]['aprovados'] += $p['status'] === 'aprovada' ? 1 : 0;
    };
    foreach ($pessoas as $p) {
        $perfil = $p['participacao'];
        if ($p['cidade'] !== '') {
            $somar('territorios', $p['cidade'] . ' · ' . ($p['bairro'] ?: 'bairro não informado'), $p);
        }
        if ($perfil['instituicao'] !== '') {
            $somar('instituicoes', $perfil['instituicao'] . ' · ' . ($perfil['campus'] ?: 'campus não informado') . ' · ' . ($perfil['cidadeInstituicao'] ?: 'cidade da instituição não informada'), $p);
        }
        $somar('profissoes', $perfil['profissao'], $p);
        foreach (['frentes', 'temas', 'cultura', 'contribuicoes'] as $tipo) {
            foreach ($perfil[$tipo] as $chave) {
                $somar($tipo, $c[$tipo][$chave], $p);
            }
        }
        if ($perfil['disponibilidade'] !== '') {
            $somar('disponibilidades', $c['disponibilidades'][$perfil['disponibilidade']], $p);
        }
    }
    foreach ($mapas as &$linhas) {
        $linhas = array_values($linhas);
        usort($linhas, fn ($a, $b) => [-$a['total'], sem_acento($a['nome'])] <=> [-$b['total'], sem_acento($b['nome'])]);
    }
    unset($linhas);
    return $mapas;
}

function csv_de_construcao(array $filtros): string
{
    require_once __DIR__ . '/exportar-comum.php';
    $campos = ['profissao', 'instituicao', 'campus', 'cidadeInstituicao', 'curso', 'habilidades', 'ideia', 'perfilPublico'];
    $c = catalogo_de_participacao();
    $linhas = [];
    foreach (pessoas_para_construcao(ler_pessoas(), $filtros) as $p) {
        $perfil = $p['participacao'];
        $linha = [$p['nome'], $p['telefone'], $p['email'], $p['cidade'], $p['bairro'], $p['status']];
        foreach (['frentes', 'temas', 'cultura', 'contribuicoes', 'periodos'] as $campo) {
            $linha[] = implode(', ', array_map(fn ($v) => $c[$campo][$v], $perfil[$campo]));
        }
        foreach (['situacao' => 'situacoes', 'disponibilidade' => 'disponibilidades', 'modalidade' => 'modalidades'] as $campo => $catalogo) {
            $linha[] = $c[$catalogo][$perfil[$campo]] ?? '';
        }
        foreach ($campos as $campo) {
            $linha[] = $perfil[$campo];
        }
        // Texto de formulário não pode virar fórmula ao abrir numa planilha.
        $linhas[] = array_map(fn ($v) => preg_match('/^[=+@\-\t\r]/', ltrim((string) $v)) ? "'" . $v : $v, $linha);
    }
    return csv(['Nome', 'WhatsApp', 'E-mail', 'Cidade', 'Bairro', 'Situação da inscrição', 'Frentes', 'Temas', 'Cultura', 'Contribuições', 'Períodos', 'Trabalho e estudo', 'Disponibilidade', 'Modalidade', 'Trabalho / área', 'Instituição', 'Campus', 'Cidade da instituição', 'Curso / vínculo', 'Habilidades', 'Ideia', 'Perfil / canal'], $linhas);
}
