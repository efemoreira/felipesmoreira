<?php
declare(strict_types=1);

/**
 * FERIADOS E CHOQUE DE AGENDA — "Limite de choque" do calendário do plano
 * 2026–2027.
 *
 * O plano não tem semana fixa para agir: cada núcleo e grupo marca o próprio
 * ritmo. O preço disso é duas atividades abertas na mesma cidade no mesmo dia
 * disputando a mesma gente, e um ato marcado num feriado em que metade do
 * bairro viajou. A regra do plano: no máximo uma atividade aberta por cidade
 * no mesmo dia, e dois atos públicos estaduais por semana; feriado entra como
 * aviso.
 *
 * AVISA, NÃO TRAVA — como o "mesmo alvo em 48h" da Produção. A coordenação
 * pode ter motivo para marcar no feriado (o São João é feito de feriado).
 *
 * Os feriados saem do calendário do plano (/plano). O par do site é
 * `src/lib/feriados.ts`; `testes/contrato/feriados.test.ts` prende os dois.
 * Pontos facultativos dependem de decreto: a lista os marca como tal.
 */

require_once __DIR__ . '/sessao.php';

const FERIADOS = [
    '2026-10-12' => ['nome' => 'Nossa Senhora Aparecida', 'onde' => 'nacional'],
    '2026-11-02' => ['nome' => 'Finados (Romaria em Juazeiro do Norte)', 'onde' => 'nacional'],
    '2026-11-15' => ['nome' => 'Proclamação da República', 'onde' => 'nacional'],
    '2026-11-20' => ['nome' => 'Dia de Zumbi e da Consciência Negra', 'onde' => 'nacional'],
    '2026-12-25' => ['nome' => 'Natal', 'onde' => 'nacional'],
    '2027-01-01' => ['nome' => 'Confraternização Universal', 'onde' => 'nacional'],
    '2027-02-08' => ['nome' => 'Carnaval', 'onde' => 'facultativo'],
    '2027-02-09' => ['nome' => 'Carnaval', 'onde' => 'facultativo'],
    '2027-02-10' => ['nome' => 'Quarta-feira de Cinzas (meio expediente)', 'onde' => 'facultativo'],
    '2027-03-19' => ['nome' => 'São José, padroeiro do Ceará', 'onde' => 'fortaleza'],
    '2027-03-25' => ['nome' => 'Data Magna do Ceará', 'onde' => 'ceara'],
    '2027-03-26' => ['nome' => 'Sexta-feira da Paixão', 'onde' => 'nacional'],
    '2027-04-21' => ['nome' => 'Tiradentes', 'onde' => 'nacional'],
    '2027-05-01' => ['nome' => 'Dia do Trabalho', 'onde' => 'nacional'],
    '2027-05-27' => ['nome' => 'Corpus Christi', 'onde' => 'fortaleza'],
    '2027-08-15' => ['nome' => 'Nossa Senhora da Assunção, padroeira de Fortaleza', 'onde' => 'fortaleza'],
    '2027-09-07' => ['nome' => 'Independência do Brasil', 'onde' => 'nacional'],
    '2027-10-12' => ['nome' => 'Nossa Senhora Aparecida', 'onde' => 'nacional'],
    '2027-11-02' => ['nome' => 'Finados', 'onde' => 'nacional'],
    '2027-11-15' => ['nome' => 'Proclamação da República', 'onde' => 'nacional'],
    '2027-11-20' => ['nome' => 'Dia de Zumbi e da Consciência Negra', 'onde' => 'nacional'],
    '2027-12-25' => ['nome' => 'Natal', 'onde' => 'nacional'],
];

/** As famílias que contam como "ato público estadual" no limite da semana. */
const FAMILIAS_DE_ATO = ['publico', 'campanha'];

/** No máximo isto de atos públicos por semana, no estado inteiro. */
const ATOS_POR_SEMANA = 2;

/**
 * O feriado de um dia, para uma cidade — ou null. Municipal de Fortaleza só
 * vale para Fortaleza (e para encontro sem cidade, que pode ser lá).
 */
function feriado_em(string $dia, string $cidade = ''): ?array
{
    $f = FERIADOS[$dia] ?? null;
    if ($f === null) {
        return null;
    }
    if ($f['onde'] === 'fortaleza' && $cidade !== '' && $cidade !== 'Fortaleza') {
        return null;
    }
    return $f;
}

/**
 * Os avisos de agenda de um encontro contra os outros — frases prontas.
 * Só conta encontro que não foi cancelado; encontro sem dia não tem choque.
 */
function avisos_de_agenda(array $e, array $todos): array
{
    require_once __DIR__ . '/eventos-comum.php';
    $dia = dia_do_inicio($e['inicio']);
    if ($dia === '' || $e['status'] === 'cancelado') {
        return [];
    }
    $avisos = [];

    if ($f = feriado_em($dia, $e['cidade'])) {
        $avisos[] = 'é feriado (' . $f['nome'] . ($f['onde'] === 'facultativo' ? ', ponto facultativo' : '') . ')';
    }

    $outros = array_values(array_filter($todos, fn ($o) =>
        $o['id'] !== $e['id'] && $o['status'] !== 'cancelado' && dia_do_inicio($o['inicio']) !== ''
    ));

    /* Uma atividade aberta por cidade no mesmo dia. On-line não disputa praça. */
    if ($e['cidade'] !== '' && $e['naAgenda'] && formato_do_evento($e) === 'presencial') {
        foreach ($outros as $o) {
            if ($o['cidade'] === $e['cidade'] && $o['naAgenda'] && formato_do_evento($o) === 'presencial'
                && dia_do_inicio($o['inicio']) === $dia) {
                $avisos[] = 'já tem “' . $o['titulo'] . '” em ' . $e['cidade'] . ' no mesmo dia';
                break;
            }
        }
    }

    /* Dois atos públicos estaduais por semana (domingo a sábado, como a agenda). */
    if (in_array($e['familia'], FAMILIAS_DE_ATO, true)) {
        $semana = domingo_de($dia);
        $atos = 1 + count(array_filter($outros, fn ($o) =>
            in_array($o['familia'], FAMILIAS_DE_ATO, true) && domingo_de(dia_do_inicio($o['inicio'])) === $semana
        ));
        if ($atos > ATOS_POR_SEMANA) {
            $avisos[] = 'é o ' . $atos . 'º ato público da semana (o plano pede no máximo ' . ATOS_POR_SEMANA . ')';
        }
    }
    return $avisos;
}

/** A lista, para o teste de contrato comparar com `src/lib/feriados.ts`. */
function feriados_do_painel(): array
{
    return FERIADOS;
}

/** O domingo da semana de um dia AAAA-MM-DD — a chave da semana da agenda. */
function domingo_de(string $dia): string
{
    $d = new DateTimeImmutable($dia);
    return $d->modify('-' . (int) $d->format('w') . ' days')->format('Y-m-d');
}

/** Os avisos numa frase só, para o recado depois de salvar. '' quando não há. */
function frase_de_avisos(array $avisos): string
{
    return $avisos === [] ? '' : ' Atenção: ' . implode('; ', $avisos) . '.';
}
