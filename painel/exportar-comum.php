<?php
declare(strict_types=1);

/**
 * Exportar — as linhas do CSV, e o CSV.
 *
 * O painel não tinha exportação nenhuma: o único "export" era o zip do backup,
 * em `var_export` de PHP. A coordenação ia pedir a lista para a gráfica, para o
 * contador, para o WhatsApp — e ia fazer print. Aqui saem três coisas, e só
 * três: pessoas (com o MESMO recorte da lista), presenças de um encontro e os
 * lançamentos de um caixa.
 *
 * O CSV sai em UTF-8 com BOM, separado por ponto e vírgula: é o que o Excel em
 * português abre certo com dois cliques. Telefone e número vão como texto —
 * sem o BOM e sem as aspas, o Excel come o zero à esquerda e vira 8599… em
 * notação científica.
 *
 * É DADO PESSOAL SAINDO DO SISTEMA. Por isso a rota exige `coordenacao` ou
 * `adm`, e o que está fora da capacidade de quem pede não sai: presenças só
 * para quem abre encontros, caixa só para `adm`.
 */

require_once __DIR__ . '/sessao.php';

/** Uma linha de CSV: campos entre aspas, aspas dobradas, `;` entre eles. */
function linha_csv(array $campos): string
{
    return implode(';', array_map(
        fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"',
        $campos,
    )) . "\r\n";
}

/** O arquivo inteiro: BOM + cabeçalho + linhas. */
function csv(array $cabecalho, array $linhas): string
{
    $saida = "\xEF\xBB\xBF" . linha_csv($cabecalho);
    foreach ($linhas as $l) {
        $saida .= linha_csv($l);
    }
    return $saida;
}

/** As pessoas, no recorte da lista (`recorte_de_pessoas()`). */
function csv_de_pessoas(array $get): string
{
    require_once __DIR__ . '/pessoas-comum.php';
    require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao()

    $porId = [];
    foreach (ler_pessoas() as $p) {
        $porId[$p['id']] = $p['nome'];
    }
    $linhas = [];
    foreach (recorte_de_pessoas($get)['pessoas'] as $p) {
        $linhas[] = [
            $p['nome'],
            TIPOS_PESSOA[$p['tipo']] ?? $p['tipo'],
            STATUS_PESSOA[$p['status']] ?? $p['status'],
            telefone_bonito($p['telefone']),
            $p['email'],
            $p['cidade'],
            $p['bairro'],
            implode(', ', array_map('nome_funcao', $p['funcoes'])),
            implode(', ', array_map(fn ($r) => REDES[$r] ?? $r, $p['redes'])),
            $porId[$p['lider']] ?? '',
            $p['origem'],
            substr((string) $p['criadoEm'], 0, 10),
            tem_conta($p) ? 'sim' : 'não',
        ];
    }
    return csv(
        ['Nome', 'Tipo', 'Situação', 'WhatsApp', 'E-mail', 'Cidade', 'Bairro', 'Funções', 'Redes', 'Quem acompanha', 'Origem', 'Chegou em', 'Tem conta'],
        $linhas,
    );
}

/**
 * Tudo o que o sistema tem sobre UMA pessoa — o direito de acesso da LGPD.
 * A ficha, as presenças, o progresso nas aulas, os lançamentos que a citam,
 * e a linha do tempo dela. JSON, e não CSV: é um dossiê, não uma tabela.
 * Sem hash de senha — ele é dela, mas não é dado que se entrega.
 */
function dossie_de_pessoa(string $id): ?array
{
    require_once __DIR__ . '/eventos-comum.php';
    require_once __DIR__ . '/aulas-comum.php';
    require_once __DIR__ . '/atividade-comum.php';
    $p = achar_pessoa($id);
    if ($p === null) {
        return null;
    }
    unset($p['hash']);
    $presencas = [];
    foreach (ler_presencas() as $l) {
        if ($l['pessoaId'] === $id) {
            $e = achar_evento($l['eventoId']);
            $presencas[] = ['encontro' => $e['titulo'] ?? $l['eventoId'], 'quando' => $e['inicio'] ?? '',
                'confirmou' => $l['confirmou'], 'compareceu' => $l['compareceu'], 'registradoEm' => $l['criadoEm']];
        }
    }
    $lancamentos = [];
    if (function_exists('ler_caixa')) {
        foreach (ler_caixa() as $l) {
            if ($l['criadoPor'] === $p['nome']) {
                $lancamentos[] = $l;
            }
        }
    }
    return [
        'geradoEm'   => date('c'),
        'ficha'      => $p,
        'presencas'  => $presencas,
        'aulasConcluidas' => aulas_concluidas($id),
        'lancamentosQueLancou' => $lancamentos,
        'linhaDoTempo' => array_map(fn ($l) => ['quando' => $l['quando'], 'texto' => $l['texto'], 'quem' => $l['quem']], linha_do_tempo($id, 500)),
    ];
}

/** As presenças de um encontro. */
function csv_de_presencas(string $eventoId): string
{
    require_once __DIR__ . '/eventos-comum.php';
    $linhas = [];
    foreach (presencas_do_evento($eventoId) as $l) {
        $p = $l['pessoa'];
        $linhas[] = [
            $p['nome'],
            telefone_bonito($p['telefone']),
            $p['cidade'],
            $p['bairro'],
            $l['confirmou'] ? 'sim' : 'não',
            $l['compareceu'] ? 'sim' : 'não',
            $l['convidadoPor'] ?? '',
            $l['origem'] ?? '',
            substr((string) $l['criadoEm'], 0, 16),
        ];
    }
    return csv(
        ['Nome', 'WhatsApp', 'Cidade', 'Bairro', 'Confirmou', 'Compareceu', 'Quem convidou', 'Como entrou', 'Registrado em'],
        $linhas,
    );
}

/** Os lançamentos de uma conta do caixa, do mais recente ao mais antigo. */
function csv_de_caixa(string $conta): string
{
    require_once __DIR__ . '/caixa-comum.php';
    $lancamentos = array_values(array_filter(ler_caixa(), fn ($l) => $l['conta'] === $conta));
    usort($lancamentos, fn ($a, $b) => strcmp((string) $b['data'], (string) $a['data']));
    $linhas = [];
    foreach ($lancamentos as $l) {
        $linhas[] = [
            $l['data'],
            $l['centavos'] > 0 ? 'entrada' : 'saída',
            number_format(abs($l['centavos']) / 100, 2, ',', '.'),
            ORIGENS_CAIXA[$l['origem']] ?? $l['origem'],
            $l['descricao'],
            $l['eventoId'],
            $l['criadoPor'],
        ];
    }
    return csv(['Data', 'Tipo', 'Valor', 'Origem', 'Descrição', 'Encontro', 'Lançado por'], $linhas);
}
