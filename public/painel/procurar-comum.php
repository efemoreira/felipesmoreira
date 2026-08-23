<?php
declare(strict_types=1);

/**
 * A BUSCA GLOBAL do painel — procurar sem saber em que tela procurar.
 *
 * Cada tela do painel já tem a sua caixa de procurar, e ela continua sendo a
 * certa quando se sabe onde a coisa está. Esta responde a outra pergunta, que é
 * a mais comum de todas no grupo da coordenação: **"cadê o Fulano?"** — sem
 * saber se Fulano é uma pessoa do cadastro, um candidato, o dono de um card ou
 * o nome de um encontro.
 *
 * A PERMISSÃO É A MESMA DE SEMPRE, e é ela que define o que a busca alcança:
 * cada bloco roda dentro de um `pode()`, e o `require_once` do `*-comum.php`
 * acontece DENTRO do `if`. Quem não abre a tela não acha por aqui — buscar não
 * é uma porta lateral para dado que a pessoa não podia ver.
 *
 * O CASAMENTO É `combina_com()`, o mesmo de todas as telas: sem acento e sem
 * caixa dos dois lados. Uma segunda régua de comparação faria "jose" achar
 * "José" numa tela e não na outra.
 */

require_once __DIR__ . '/sessao.php';

/** Quantos resultados por área antes de virar "e mais N". */
const TETO_POR_AREA = 6;

/**
 * Procura em tudo que esta pessoa pode abrir.
 *
 * Devolve `[area => ['rotulo' =>, 'icone' =>, 'itens' => [...], 'total' => n]]`,
 * na ordem em que as áreas aparecem no menu. Área sem nenhum resultado não
 * entra — lista com sete títulos e um item embaixo de um deles é pior que a
 * lista curta.
 *
 * Cada item é `['titulo' =>, 'sub' =>, 'url' =>]`. Nada de telefone nem de
 * e-mail no `sub`: a lista de resultados é lida por cima, muitas vezes com
 * alguém olhando junto, e o que ela precisa dizer é *qual* é o Fulano — não o
 * cadastro dele.
 */
function procurar_em_tudo(string $busca): array
{
    $busca = trim($busca);
    if (mb_strlen($busca) < 2) {
        /* Uma letra casa com metade do cadastro e não ajuda ninguém; devolver
           tudo seria pior que devolver nada. */
        return [];
    }
    $digitos = so_digitos($busca);
    $achados = [];

    $juntar = function (string $area, array $itens, int $total) use (&$achados): void {
        if ($itens === []) {
            return;
        }
        $achados[$area] = [
            'rotulo' => AREAS[$area] ?? $area,
            'icone'  => ICONE_AREA[$area] ?? 'star',
            'itens'  => $itens,
            'total'  => $total,
        ];
    };

    /* ---------- pessoas ---------- */
    if (pode('pessoas')) {
        require_once __DIR__ . '/pessoas-comum.php';
        $casam = array_values(array_filter(ler_pessoas(), function ($p) use ($busca, $digitos) {
            if (combina_com([$p['nome'], $p['usuario'], $p['email'], $p['cidade'], $p['bairro']], $busca)) {
                return true;
            }
            /* Dígito casa com dígito: quem procura tem o número na tela do
               próprio WhatsApp, e "(85) 9" não acharia "85 9" como texto. */
            return $digitos !== '' && $p['telefone'] !== '' && str_contains($p['telefone'], $digitos);
        }));
        usort($casam, fn ($a, $b) => strcmp(sem_acento($a['nome']), sem_acento($b['nome'])));
        $juntar('pessoas', array_map(fn ($p) => [
            'titulo' => $p['nome'],
            'sub'    => trim(
                (TIPOS_PESSOA[$p['tipo']] ?? '')
                . ($p['cidade'] !== '' ? ' · ' . $p['bairro'] . ($p['bairro'] !== '' ? ', ' : '') . $p['cidade'] : '')
                . (tem_conta($p) ? ' · tem conta' : ''),
                ' ·',
            ),
            'url'    => '/painel/pessoas.php?p=' . rawurlencode($p['id']),
        ], array_slice($casam, 0, TETO_POR_AREA)), count($casam));
    }

    /* ---------- encontros ---------- */
    if (pode('eventos')) {
        require_once __DIR__ . '/eventos-comum.php';
        $casam = array_values(array_filter(
            ler_eventos(),
            fn ($e) => combina_com(
                [$e['titulo'], $e['local'], $e['subtitulo'], $e['data'], FAMILIAS[$e['familia']]['nome']],
                $busca,
            ),
        ));
        // o mais próximo de acontecer primeiro, como na lista de encontros
        usort($casam, fn ($a, $b) => quando_do_evento($a) <=> quando_do_evento($b));
        $juntar('eventos', array_map(fn ($e) => [
            'titulo' => $e['titulo'],
            'sub'    => FAMILIAS[$e['familia']]['nome'] . ' · ' . data_cheia($e)
                . ($e['local'] !== '' ? ' · ' . $e['local'] : '')
                . ($e['status'] === 'cancelado' ? ' · CANCELADO' : ''),
            'url'    => '/painel/eventos.php?e=' . rawurlencode($e['id']),
        ], array_slice($casam, 0, TETO_POR_AREA)), count($casam));
    }

    /* ---------- fatos ---------- */
    if (pode('fatos')) {
        require_once __DIR__ . '/fatos-comum.php';
        $casam = array_values(array_filter(
            ler_fatos(),
            fn ($f) => combina_com([$f['oQue'], $f['quem'], $f['autorNome'], $f['fonteUrl']], $busca),
        ));
        $juntar('fatos', array_map(fn ($f) => [
            'titulo' => $f['oQue'],
            'sub'    => (CATEGORIAS[$f['categoria']] ?? '') . ' · ' . (STATUS_FATO[$f['status']] ?? $f['status'])
                . ' · por ' . $f['autorNome'],
            /* O fato mora numa das duas listas da tela; a âncora leva ao id, que
               existe nas duas. */
            'url'    => '/painel/fatos.php#' . rawurlencode($f['id']),
        ], array_slice($casam, 0, TETO_POR_AREA)), count($casam));
    }

    /* ---------- cards do quadro ---------- */
    if (pode('producao')) {
        require_once __DIR__ . '/producao-comum.php';
        $casam = array_values(array_filter(
            ler_cards(),
            fn ($c) => combina_com([$c['titulo'], $c['donoNome'], $c['responsavel'], $c['fonteUrl'], nome_de_arquivo($c)], $busca),
        ));
        $juntar('producao', array_map(fn ($c) => [
            'titulo' => $c['titulo'],
            'sub'    => (ETAPAS[$c['etapa']] ?? '') . ' · ' . (COLUNAS[$c['coluna']] ?? '')
                . ($c['donoNome'] !== '' ? ' · ' . $c['donoNome'] : ' · sem dono'),
            'url'    => '/painel/producao.php#' . rawurlencode($c['id']),
        ], array_slice($casam, 0, TETO_POR_AREA)), count($casam));
    }

    /* ---------- candidatos ---------- */
    if (pode('candidatos')) {
        require_once __DIR__ . '/candidatos-comum.php';
        $casam = array_values(array_filter(ler_candidatos(), function ($c) use ($busca, $digitos) {
            if (combina_com([$c['nome'], $c['urna'], $c['partido'], $c['instagram']], $busca)) {
                return true;
            }
            // o número de urna é dígito, e é por ele que se procura na véspera
            return $digitos !== '' && $c['numero'] !== '' && str_contains($c['numero'], $digitos);
        }));
        $juntar('candidatos', array_map(fn ($c) => [
            'titulo' => ($c['urna'] !== '' ? $c['urna'] : $c['nome']) . ' — ' . $c['numero'],
            'sub'    => rotulo_cargo($c['cargo'])
                . ($c['partido'] !== '' ? ' · ' . $c['partido'] : '')
                . ($c['publicado'] ? ' · no ar' : ' · rascunho'),
            'url'    => '/painel/candidatos.php?c=' . rawurlencode($c['id']),
        ], array_slice($casam, 0, TETO_POR_AREA)), count($casam));
    }

    /* ---------- peças da Munição ---------- */
    if (pode('municao')) {
        require_once __DIR__ . '/kit-comum.php';
        $casam = array_values(array_filter(
            ler_pecas(),
            fn ($p) => combina_com([$p['numero'], $p['frase'], $p['fonte'], $p['legenda']], $busca),
        ));
        $juntar('municao', array_map(fn ($p) => [
            'titulo' => $p['numero'],
            'sub'    => $p['frase'] . ' · ' . $p['fonte'] . ($p['publicada'] ? ' · no ar' : ' · rascunho'),
            'url'    => '/painel/municao.php',
        ], array_slice($casam, 0, TETO_POR_AREA)), count($casam));
    }

    return $achados;
}
