<?php
declare(strict_types=1);

/**
 * Importar uma planilha de gente — a base que já existia fora do site.
 *
 * Toda lista que a campanha tinha antes do painel (o caderno da igreja, a
 * planilha do grupo, os contatos do bandeiraço) entrava à mão, uma a uma.
 * Aqui entra em dois passos: a PRÉVIA, que lê o CSV e diz linha a linha o que
 * vai acontecer (nova · já existe · inválida), e a CONFIRMAÇÃO, que grava só
 * o que a pessoa marcou. Nada é gravado na prévia.
 *
 * O CSV pode vir do Excel (`;`) ou do Google (`,`); o cabeçalho é reconhecido
 * por nome (nome, telefone/whatsapp/celular, email, cidade, bairro, tipo). O
 * que passa por `normalizar_pessoa()` é o que vale — a mesma régua do resto.
 * Telefone é a chave: quem já existe não vira segunda ficha.
 */

require_once __DIR__ . '/sessao.php';

const COLUNAS_IMPORTAVEIS = [
    'nome'     => ['nome', 'name', 'pessoa'],
    'telefone' => ['telefone', 'whatsapp', 'celular', 'fone', 'tel', 'phone'],
    'email'    => ['email', 'e-mail', 'mail'],
    'cidade'   => ['cidade', 'municipio', 'município', 'city'],
    'bairro'   => ['bairro', 'district'],
    'tipo'     => ['tipo', 'type'],
];

/** Lê o CSV inteiro: separador adivinhado pela primeira linha, cabeçalho por nome. */
function ler_csv_de_pessoas(string $texto): array
{
    $texto = preg_replace('/^\xEF\xBB\xBF/', '', $texto) ?? $texto;   // o BOM do Excel
    $linhas = preg_split('/\r\n|\r|\n/', trim($texto)) ?: [];
    if ($linhas === [] || trim($linhas[0]) === '') {
        return ['erro' => 'Arquivo vazio.', 'linhas' => []];
    }
    $sep = substr_count($linhas[0], ';') >= substr_count($linhas[0], ',') ? ';' : ',';
    $cabecalho = array_map(fn ($c) => mb_strtolower(trim(sem_acento((string) $c))), str_getcsv($linhas[0], $sep, '"', '\\'));

    $indice = [];
    foreach (COLUNAS_IMPORTAVEIS as $campo => $nomes) {
        foreach ($cabecalho as $i => $c) {
            if (in_array($c, $nomes, true)) {
                $indice[$campo] = $i;
                break;
            }
        }
    }
    if (!isset($indice['nome']) || !isset($indice['telefone'])) {
        return ['erro' => 'O cabeçalho precisa ter, no mínimo, "nome" e "telefone" (ou whatsapp/celular).', 'linhas' => []];
    }

    $saida = [];
    foreach (array_slice($linhas, 1) as $n => $l) {
        if (trim($l) === '') {
            continue;
        }
        $campos = str_getcsv($l, $sep, '"', '\\');
        $pega = fn (string $campo) => isset($indice[$campo]) ? trim((string) ($campos[$indice[$campo]] ?? '')) : '';
        $saida[] = [
            'n'        => $n + 2,   // a linha da planilha, como a pessoa vê
            'nome'     => limpar_texto($pega('nome'), 80),
            'telefone' => so_digitos($pega('telefone')),
            'email'    => limpar_texto($pega('email'), 120),
            'cidade'   => cidade_valida($pega('cidade')),
            'bairro'   => limpar_texto($pega('bairro'), 60),
            'tipo'     => isset(TIPOS_PESSOA[mb_strtolower($pega('tipo'))]) ? mb_strtolower($pega('tipo')) : 'eleitor',
        ];
    }
    return ['erro' => '', 'linhas' => $saida];
}

/**
 * A prévia: o que cada linha vai virar. `estado`: nova · existe · invalida.
 * Telefone repetido DENTRO do arquivo também é duplicata — a segunda pula.
 */
function previa_de_importacao(array $linhas): array
{
    $vistos = [];
    $previa = [];
    foreach ($linhas as $l) {
        if ($l['nome'] === '' || strlen($l['telefone']) < 10) {
            $l['estado'] = 'invalida';
            $l['motivo'] = $l['nome'] === '' ? 'sem nome' : 'telefone incompleto';
        } elseif (isset($vistos[$l['telefone']])) {
            $l['estado'] = 'existe';
            $l['motivo'] = 'repetida na planilha (linha ' . $vistos[$l['telefone']] . ')';
        } elseif (($ja = pessoas_por_telefone($l['telefone'])) !== []) {
            $l['estado'] = 'existe';
            $l['motivo'] = 'já é ' . $ja[0]['nome'];
            $l['existenteId'] = $ja[0]['id'];
        } else {
            $l['estado'] = 'nova';
            $l['motivo'] = '';
            $vistos[$l['telefone']] = $l['n'];
        }
        $previa[] = $l;
    }
    return $previa;
}

/** Grava as linhas marcadas. Devolve quantas entraram. */
function gravar_importacao(array $previa, array $marcadas, string $status, string $origem): int
{
    $novas = [];
    foreach ($previa as $l) {
        if ($l['estado'] !== 'nova' || !in_array((string) $l['n'], $marcadas, true)) {
            continue;
        }
        $novas[] = [
            'id'       => novo_id_pessoa(),
            'nome'     => $l['nome'],
            'tipo'     => $l['tipo'],
            'telefone' => $l['telefone'],
            'email'    => $l['email'],
            'cidade'   => $l['cidade'],
            'bairro'   => $l['bairro'],
            'status'   => $status === 'pendente' ? 'pendente' : '',
            'origem'   => $origem,
            'criadoEm' => date('c'),
        ];
    }
    if ($novas === []) {
        return 0;
    }
    $ok = com_trava(ARQ_PESSOAS, function () use ($novas): bool {
        $pessoas = ler_pessoas(true);
        $tem = array_column($pessoas, 'telefone');
        foreach ($novas as $n) {
            if (!in_array($n['telefone'], $tem, true)) {
                $pessoas[] = $n;
            }
        }
        return gravar_pessoas($pessoas);
    });
    return $ok ? count($novas) : 0;
}
