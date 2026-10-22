<?php
declare(strict_types=1);

/** Interesses de construção, não pertencimento a unidades nem concessão de acesso. */
function catalogo_de_participacao(): array
{
    static $catalogo = null;
    return $catalogo ??= json_decode((string) file_get_contents(__DIR__ . '/participacao-catalogo.json'), true, 512, JSON_THROW_ON_ERROR);
}

function normalizar_participacao($bruto): array
{
    $p = is_array($bruto) ? $bruto : [];
    $catalogo = catalogo_de_participacao();
    $saida = [];
    foreach (['frentes', 'temas', 'cultura', 'contribuicoes', 'periodos'] as $campo) {
        $saida[$campo] = array_values(array_unique(array_filter(
            is_array($p[$campo] ?? null) ? $p[$campo] : [],
            fn ($v) => is_string($v) && isset($catalogo[$campo][$v])
        )));
    }
    foreach (['situacao' => 'situacoes', 'disponibilidade' => 'disponibilidades', 'modalidade' => 'modalidades'] as $campo => $lista) {
        $v = is_string($p[$campo] ?? null) ? $p[$campo] : '';
        $saida[$campo] = isset($catalogo[$lista][$v]) ? $v : '';
    }
    foreach (['profissao' => 120, 'instituicao' => 120, 'campus' => 100, 'curso' => 120, 'habilidades' => 400, 'ideia' => 400, 'perfilPublico' => 200] as $campo => $max) {
        $saida[$campo] = is_string($p[$campo] ?? null) ? limpar_texto($p[$campo], $max) : '';
    }
    $saida['cidadeInstituicao'] = is_string($p['cidadeInstituicao'] ?? null) ? cidade_valida($p['cidadeInstituicao']) : '';
    $busca = sem_acento(mb_strtolower(trim($saida['instituicao'])));
    foreach ($catalogo['instituicoes'] as $nome => $aliases) {
        if (in_array($busca, array_map(fn ($v) => sem_acento(mb_strtolower($v)), $aliases), true)) {
            $saida['instituicao'] = $nome;
            break;
        }
    }
    $saida['registradoEm'] = is_string($p['registradoEm'] ?? null) ? limpar_texto($p['registradoEm'], 40) : '';
    return $saida;
}

/** Linhas para a ficha, fila e exportação, usando os mesmos rótulos. */
function resumo_de_participacao(array $perfil): array
{
    $p = normalizar_participacao($perfil);
    $c = catalogo_de_participacao();
    $linhas = [];
    foreach (['frentes' => 'Interesses de participação', 'temas' => 'Temas', 'cultura' => 'Interesses culturais', 'contribuicoes' => 'Como pode contribuir', 'periodos' => 'Melhores períodos'] as $campo => $nome) {
        if ($p[$campo] !== []) {
            $linhas[$nome] = implode(', ', array_map(fn ($v) => $c[$campo][$v], $p[$campo]));
        }
    }
    foreach (['situacao' => ['Situação de trabalho e estudo', 'situacoes'], 'disponibilidade' => ['Disponibilidade', 'disponibilidades'], 'modalidade' => ['Participação preferida', 'modalidades']] as $campo => [$nome, $lista]) {
        if ($p[$campo] !== '') {
            $linhas[$nome] = $c[$lista][$p[$campo]];
        }
    }
    foreach (['profissao' => 'Trabalho / área de atuação', 'instituicao' => 'Instituição de ensino', 'campus' => 'Campus / unidade', 'cidadeInstituicao' => 'Cidade da instituição', 'curso' => 'Curso / vínculo com a instituição', 'habilidades' => 'Habilidades e experiências', 'ideia' => 'Ideia ou contribuição', 'perfilPublico' => 'Perfil ou canal informado'] as $campo => $nome) {
        if ($p[$campo] !== '') {
            $linhas[$nome] = $p[$campo];
        }
    }
    return $linhas;
}
