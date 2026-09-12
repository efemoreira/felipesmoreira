<?php
declare(strict_types=1);

/**
 * O CAIXA — todo real que entra e sai, com origem.
 *
 * Existe porque `orcamento` no encontro é um `limpar_texto(…, 60)`: texto
 * livre, que não soma, não confere e não vira prestação de contas. Um encontro
 * de rua tem material, som, água e transporte; uma venda de camiseta tem
 * entrada e custo. Nada disso cabia em sessenta caracteres.
 *
 * **A FRONTEIRA JURÍDICA NÃO MORA AQUI, e é de propósito.** Com candidatura
 * registrada, dinheiro que custeia atividade de campanha é recurso de campanha
 * — conta própria, recibo eleitoral e prestação de contas —, qualquer que seja
 * o nome que se dê ao caixa. Esta tela não decide de que lado da linha um
 * lançamento cai: ela registra, com origem e data, que é o que qualquer um dos
 * dois lados exige. Quem traça a linha é o advogado da campanha, e a resposta
 * dele vira documento em `update/`.
 *
 * Por isso o campo `conta`: cada lançamento diz a qual caixa pertence, e a
 * soma nunca mistura os dois. Misturar é o erro que não se desfaz depois.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_CAIXA = PASTA_DADOS . '/caixa.php';

/** De que caixa é o lançamento. A separação é a regra mais importante daqui. */
const CONTAS_CAIXA = [
    'movimento' => 'Caixa do movimento',
    'campanha'  => 'Recurso de campanha',
];

/**
 * De onde vem, ou para onde vai.
 *
 * Lista fechada pelo mesmo motivo que `CARGOS` é lista: "camiseta", "Camisetas"
 * e "venda de camiseta" digitados por três pessoas viram três origens no
 * relatório, e um caixa que não soma por origem não responde "o que deu certo".
 */
const ORIGENS_CAIXA = [
    'venda'      => 'Venda',
    'doacao'     => 'Doação',
    'rifa'       => 'Rifa ou sorteio',
    'material'   => 'Material',
    'estrutura'  => 'Local, som e estrutura',
    'transporte' => 'Transporte',
    'alimentos'  => 'Comida e bebida',
    'outro'      => 'Outro',
];

function normalizar_lancamento($l): ?array
{
    if (!is_array($l) || empty($l['id'])) {
        return null;
    }
    /* EM CENTAVOS, e não em float: 0.1 + 0.2 não é 0.3 em ponto flutuante, e um
       caixa que erra centavo na terceira soma é um caixa em que ninguém confia.
       A tela recebe "12,50" e converte na entrada; daqui para dentro é inteiro. */
    $centavos = (int) ($l['centavos'] ?? 0);
    if ($centavos === 0) {
        return null;
    }

    $conta = (string) ($l['conta'] ?? 'movimento');
    if (!isset(CONTAS_CAIXA[$conta])) {
        $conta = 'movimento';
    }
    $origem = (string) ($l['origem'] ?? 'outro');
    if (!isset(ORIGENS_CAIXA[$origem])) {
        $origem = 'outro';
    }

    return [
        'id'       => limpar_texto($l['id'], 40),
        /* O sinal DIZ o tipo: positivo entra, negativo sai. Um campo `tipo` ao
           lado do valor seria uma segunda verdade sobre a mesma coisa, e as
           duas divergiriam no primeiro lançamento corrigido. */
        'centavos' => $centavos,
        'conta'    => $conta,
        'origem'   => $origem,
        'descricao' => limpar_texto($l['descricao'] ?? '', 120),
        'data'     => limpar_texto($l['data'] ?? '', 10),
        'eventoId' => limpar_texto($l['eventoId'] ?? '', 40),
        'criadoEm'  => limpar_texto($l['criadoEm'] ?? '', 40),
        'criadoPor' => limpar_texto($l['criadoPor'] ?? '', 60),
        'alteradoEm'  => limpar_texto($l['alteradoEm'] ?? '', 40),
        'alteradoPor' => limpar_texto($l['alteradoPor'] ?? '', 60),
        'apagadoEm'   => limpar_texto($l['apagadoEm'] ?? '', 40),
        'apagadoPor'  => limpar_texto($l['apagadoPor'] ?? '', 60),
    ];
}

/**
 * Os lançamentos VIVOS. O apagado fica no arquivo como lápide (`apagar_lancamento()`)
 * — valor, origem, quem apagou, quando — e não sai daqui: nenhuma soma o vê.
 * "Um caixa que guarda o errado ao lado do certo soma duas vezes" continua
 * verdade; a lápide não está ao lado, está fora de toda conta.
 */
function ler_caixa(): array
{
    return array_values(array_filter(ler_caixa_tudo(), fn ($l) => $l['apagadoEm'] === ''));
}

/** Só as lápides — para a linha do tempo. */
function ler_caixa_apagados(): array
{
    return array_values(array_filter(ler_caixa_tudo(), fn ($l) => $l['apagadoEm'] !== ''));
}

function ler_caixa_tudo(): array
{
    if (!is_file(ARQ_CAIXA)) {
        return [];
    }
    $bruto = @include ARQ_CAIXA;
    if (!is_array($bruto)) {
        return [];
    }
    $limpo = [];
    foreach ($bruto as $l) {
        if ($ok = normalizar_lancamento($l)) {
            $limpo[] = $ok;
        }
    }
    /* Mais recente primeiro: a pergunta de quem abre é "o que entrou hoje". */
    usort($limpo, fn ($a, $b) => [$b['data'], $b['criadoEm']] <=> [$a['data'], $a['criadoEm']]);
    return $limpo;
}

function gravar_caixa(array $lancamentos): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($lancamentos as $l) {
        if ($ok = normalizar_lancamento($l)) {
            $limpos[] = $ok;
        }
    }
    $limpos = carimbar_alteracoes(ler_caixa(), $limpos);
    $ids = array_column($limpos, 'id');
    foreach (ler_caixa_apagados() as $lapide) {
        if (!in_array($lapide['id'], $ids, true)) {
            $limpos[] = $lapide;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Dado financeiro — não versionar.\nreturn "
        . var_export($limpos, true) . ";\n";
    if (!gravar_atomico(ARQ_CAIXA, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_CAIXA, true);
    }
    return true;
}

/**
 * "12,50" ou "R$ 1.234,56" -> 1250 / 123456. Devolve 0 quando não dá para ler.
 *
 * Aceita vírgula e ponto porque as duas chegam: quem digita no celular usa o
 * que o teclado oferece, e recusar "12.50" seria recusar metade dos lançamentos
 * por causa de uma tecla.
 */
function centavos_de(string $bruto): int
{
    $limpo = preg_replace('/[^0-9,.]/', '', trim($bruto)) ?? '';
    if ($limpo === '') {
        return 0;
    }
    /* O ÚLTIMO separador é o decimal, seja ele qual for: "1.234,56" e "1,234.56"
       são a mesma quantia escrita nas duas convenções, e o que distingue os
       milhares do centavo é a posição, não o caractere. */
    $ultima = max(strrpos($limpo, ',') ?: -1, strrpos($limpo, '.') ?: -1);
    if ($ultima < 0) {
        return (int) $limpo * 100;
    }
    $inteiros = preg_replace('/\D/', '', substr($limpo, 0, $ultima)) ?? '';
    $decimais = preg_replace('/\D/', '', substr($limpo, $ultima + 1)) ?? '';
    $decimais = substr(str_pad($decimais, 2, '0'), 0, 2);
    return (int) ($inteiros . $decimais);
}

/** 1250 -> "R$ 12,50". O sinal vem junto, porque ele é o que diz entra ou sai. */
function reais(int $centavos): string
{
    return ($centavos < 0 ? '- ' : '') . 'R$ ' . number_format(abs($centavos) / 100, 2, ',', '.');
}

/** Entradas, saídas e saldo de uma lista já recortada. */
function somar_caixa(array $lancamentos): array
{
    $entrou = $saiu = 0;
    foreach ($lancamentos as $l) {
        if ($l['centavos'] > 0) {
            $entrou += $l['centavos'];
        } else {
            $saiu += -$l['centavos'];
        }
    }
    return ['entrou' => $entrou, 'saiu' => $saiu, 'saldo' => $entrou - $saiu];
}

/** O que um encontro custou e rendeu — o que o campo `orcamento` nunca soube. */
function caixa_do_evento(string $eventoId): array
{
    return array_values(array_filter(ler_caixa(), fn ($l) => $l['eventoId'] === $eventoId));
}

/** Apaga um lançamento deixando a lápide: o que era, quem apagou, quando. */
function apagar_lancamento(string $id): bool
{
    $tudo = ler_caixa_tudo();
    $achou = false;
    foreach ($tudo as &$l) {
        if ($l['id'] === $id && $l['apagadoEm'] === '') {
            $l['apagadoEm']  = date('c');
            $l['apagadoPor'] = quem_grava();
            $achou = true;
        }
    }
    unset($l);
    if (!$achou) {
        return false;
    }
    $limpos = [];
    foreach ($tudo as $l) {
        if ($ok = normalizar_lancamento($l)) {
            $limpos[] = $ok;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Dado financeiro — não versionar.\nreturn "
        . var_export($limpos, true) . ";\n";
    if (!gravar_atomico(ARQ_CAIXA, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_CAIXA, true);
    }
    return true;
}
