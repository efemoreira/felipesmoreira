<?php
declare(strict_types=1);

/**
 * A TRILHA EM QUATRO NÍVEIS — o plano de 2026–2027 sobre a formação:
 *
 *   Básica          princípios, regras, ética, comunicação, como o time se organiza
 *   Prática         organizar, planejar atividade, registrar, o depois do evento
 *   Especialização  o ofício de cada função (Olheiro, Checagem, Logística…)
 *   Formadores      "quem domina um método ensina outros"
 *
 * O NÍVEL SAI DA ESTRUTURA DO CURRÍCULO, e não de um campo novo em cada aula:
 * os Dias 0 e 1 são a Básica; as aulas rápidas (🚗) dos Dias 2 a 5 e o Dia 5
 * inteiro são a Prática; as aulas por função são a Especialização. Aula nova
 * entra no nível certo sozinha. Formadores não têm aula — é reconhecimento, e
 * por isso não aparece como progresso.
 *
 * O CERTIFICADO é da Básica: a data em que a última aula dela foi concluída.
 * É ele que a Liga dos Porta-vozes pede para o nível B ("concluir a formação
 * de militância") — e a Liga passa a ler daqui, com a validação à mão
 * mantida como exceção.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/aulas-comum.php';

const NIVEIS_FORMACAO = [
    'basica'         => ['nome' => 'Básica',         'resumo' => 'Princípios, regras, ética, comunicação e como o time se organiza.'],
    'pratica'        => ['nome' => 'Prática',        'resumo' => 'Organizar um encontro, planejar, registrar e o depois do evento.'],
    'especializacao' => ['nome' => 'Especialização', 'resumo' => 'O ofício de cada função, do fato ao vídeo e da rua à recepção.'],
    'formadores'     => ['nome' => 'Formadores',     'resumo' => 'Quem domina um método ensina outros — reconhecido pela coordenação.'],
];

/** O nível de uma aula, pela posição dela no currículo. */
function nivel_da_aula(string $diaId, array $aula): string
{
    if (in_array($diaId, ['dia-0', 'dia-1'], true)) {
        return 'basica';
    }
    if ($diaId === 'dia-5' || ($aula['pista'] ?? '') === 'rapida') {
        return 'pratica';
    }
    return 'especializacao';
}

/** `nivel => [ids das aulas]`, na ordem do currículo. Formadores fica vazio. */
function aulas_por_nivel(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    $memo = array_fill_keys(array_keys(NIVEIS_FORMACAO), []);
    foreach (CURRICULO as $dia) {
        foreach ($dia['aulas'] as $aula) {
            $memo[nivel_da_aula($dia['id'], $aula)][] = $aula['id'];
        }
    }
    return $memo;
}

/**
 * A formação de uma pessoa, por nível: quantas feitas, de quantas, e quando o
 * nível fechou (a data da última aula dele). Formadores fica de fora.
 */
function formacao_da_pessoa(string $pessoaId): array
{
    $feitas = ler_progresso()[$pessoaId] ?? [];
    $niveis = [];
    foreach (aulas_por_nivel() as $nivel => $ids) {
        if ($ids === []) {
            continue;
        }
        $datas = array_values(array_filter(array_map(fn ($id) => $feitas[$id] ?? '', $ids)));
        $completo = count($datas) === count($ids);
        $niveis[$nivel] = [
            'feitas' => count($datas),
            'total'  => count($ids),
            'concluidoEm' => $completo ? substr(max($datas), 0, 10) : '',
        ];
    }
    return $niveis;
}

/** A data do certificado da Básica, ou ''. */
function certificado_basica_em(string $pessoaId): string
{
    if ($pessoaId === '') {
        return '';
    }
    return formacao_da_pessoa($pessoaId)['basica']['concluidoEm'] ?? '';
}
