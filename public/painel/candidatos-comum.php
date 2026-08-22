<?php
declare(strict_types=1);

/**
 * Os candidatos da chapa — felipesmoreira.com/candidatos
 *
 * A colinha: nome de urna, cargo, número e o @ de cada um, para o eleitor levar
 * na cabeça e o militante mandar no grupo.
 *
 * Fica em dados/candidatos.php, e não .json, pela mesma razão de sempre: o
 * .htaccess de /dados só bloqueia .php, e o que está aqui é material de campanha
 * — nome de urna errado circulando é pior que não circular nada. Sai pela rede
 * só o que estiver `publicado`, pelo api/candidatos.php.
 *
 * NÃO É DADO PESSOAL de terceiro: nome de urna, número e perfil público de
 * candidato registrado são informação pública por definição legal. Não entram
 * aqui telefone, endereço nem nada que a pessoa não tenha publicado.
 *
 * DUAS COISAS SEPARADAS, e é a separação que importa:
 *
 *   - o **candidato** é um cadastro simples: quem é, que número tem, qual o @;
 *   - a **lista** é curadoria: um nome ("Deputados federais", "As mulheres da
 *     chapa", "Os que eu apoio") e quem entra nela.
 *
 * A primeira versão tinha grupos fixos marcados no próprio candidato —
 * `federais`, `mulheres`, `escolhidos` — e estava errada em dois sentidos:
 * obrigava a classificar na hora de cadastrar (quando o que se quer é só
 * registrar o número), e engessava as listas em categorias que alguém decidiu
 * no código. Lista é conteúdo de campanha; ela muda toda semana.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_CANDIDATOS = PASTA_DADOS . '/candidatos.php';
const ARQ_LISTAS = PASTA_DADOS . '/listas.php';

/**
 * Um candidato só entra com NOME e NÚMERO.
 *
 * Número é o que a pessoa digita na urna: publicar ficha sem ele seria pedir
 * para o eleitor procurar sozinho, e colinha com número errado é pior que
 * colinha nenhuma. O @ é opcional — nem todo candidato tem perfil.
 */
function normalizar_candidato($c): ?array
{
    if (!is_array($c) || empty($c['id'])) {
        return null;
    }
    $nome = limpar_texto($c['nome'] ?? '', 80);
    $numero = preg_replace('/\D/', '', (string) ($c['numero'] ?? '')) ?? '';
    if ($nome === '' || $numero === '') {
        return null;
    }

    return [
        'id'     => limpar_texto($c['id'], 40),
        'nome'   => $nome,
        /* O nome que está na urna, quando é diferente do nome de registro. É o
           que o eleitor procura, então é ele que aparece grande no cartão. */
        'urna'   => limpar_texto($c['urna'] ?? '', 60),
        'cargo'  => limpar_texto($c['cargo'] ?? '', 60),
        'numero' => mb_substr($numero, 0, 6),
        'partido' => limpar_texto($c['partido'] ?? '', 40),
        'instagram' => normalizar_arroba($c['instagram'] ?? ''),
        /* O rosto, opcional. Candidato sem foto é candidato válido — muita gente
           entra na chapa antes de ter material pronto, e travar o cadastro nisso
           seria deixar o número fora do ar esperando um JPG. */
        'imagem' => limpar_texto($c['imagem'] ?? '', 300),
        'ordem'  => (int) ($c['ordem'] ?? 0),
        'publicado' => !empty($c['publicado']),
        'criadoEm'  => limpar_texto($c['criadoEm'] ?? '', 40),
    ];
}

/** "@moreiramissao", "instagram.com/x/" e "X" viram todos "x". */
function normalizar_arroba($bruto): string
{
    $v = strtolower(trim((string) $bruto));
    $v = preg_replace('#^https?://(www\.)?instagram\.com/#', '', $v) ?? $v;
    $v = ltrim($v, '@/');
    $v = rtrim($v, '/');
    $v = preg_replace('/[^a-z0-9._]/', '', $v) ?? '';
    return mb_substr($v, 0, 40);
}

function ler_candidatos(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_CANDIDATOS)) {
        $bruto = @include ARQ_CANDIDATOS;
        if (is_array($bruto)) {
            foreach ($bruto as $c) {
                if ($limpo = normalizar_candidato($c)) {
                    $cache[] = $limpo;
                }
            }
        }
    }
    /* Ordem manual primeiro, nome depois: a coordenação decide quem abre a
       lista, e o resto sai em ordem previsível em vez de ordem de cadastro. */
    usort($cache, fn ($a, $b) => [$a['ordem'], $a['nome']] <=> [$b['ordem'], $b['nome']]);
    return $cache;
}

function gravar_candidatos(array $candidatos): bool
{
    preparar_pastas();
    $limpos = [];
    $vistos = [];
    foreach ($candidatos as $c) {
        $limpo = normalizar_candidato($c);
        if ($limpo === null || isset($vistos[$limpo['id']])) {
            continue;
        }
        $vistos[$limpo['id']] = true;
        $limpos[] = $limpo;
    }
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_CANDIDATOS, $conteudo)) {
        return false;
    }
    ler_candidatos(true);
    return true;
}

function achar_candidato(string $id): ?array
{
    foreach (ler_candidatos() as $c) {
        if ($c['id'] === $id) {
            return $c;
        }
    }
    return null;
}

function novo_id_candidato(): string
{
    return bin2hex(random_bytes(6));
}

/** Só o que está no ar — é isto que o site recebe. */
function candidatos_publicados(): array
{
    return array_values(array_filter(ler_candidatos(), fn ($c) => $c['publicado']));
}

/* ===================== as listas ===================== */

/**
 * Uma lista é um nome e quem está nela. Só isso.
 *
 * O `naHome` marca a única que aparece na página inicial — a home tem menos
 * paciência que qualquer outra tela, e mostrar a chapa toda ali é mostrar uma
 * lista que ninguém decora. Duas marcadas: vale a primeira, por ordem.
 */
function normalizar_lista($l): ?array
{
    if (!is_array($l) || empty($l['id'])) {
        return null;
    }
    $nome = limpar_texto($l['nome'] ?? '', 60);
    if ($nome === '') {
        return null;
    }

    $ids = [];
    foreach ((array) ($l['candidatos'] ?? []) as $id) {
        $id = limpar_texto((string) $id, 40);
        if ($id !== '' && !in_array($id, $ids, true)) {
            $ids[] = $id;
        }
    }

    return [
        'id'    => limpar_texto($l['id'], 40),
        'nome'  => $nome,
        'descricao' => limpar_texto($l['descricao'] ?? '', 160),
        /* A ORDEM É A DO ARRAY, e não alfabética: numa colinha a ordem é
           decisão de campanha — quem vem primeiro é quem se quer que seja
           lembrado primeiro. Reordenar por nome jogaria isso fora. */
        'candidatos' => $ids,
        'publicada' => !empty($l['publicada']),
        'naHome'    => !empty($l['naHome']),
        'ordem'  => (int) ($l['ordem'] ?? 0),
        'criadoEm' => limpar_texto($l['criadoEm'] ?? '', 40),
    ];
}

function ler_listas(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_LISTAS)) {
        $bruto = @include ARQ_LISTAS;
        if (is_array($bruto)) {
            foreach ($bruto as $l) {
                if ($limpo = normalizar_lista($l)) {
                    $cache[] = $limpo;
                }
            }
        }
    }
    usort($cache, fn ($a, $b) => [$a['ordem'], $a['nome']] <=> [$b['ordem'], $b['nome']]);
    return $cache;
}

function gravar_listas(array $listas): bool
{
    preparar_pastas();
    $limpos = [];
    $vistos = [];
    foreach ($listas as $l) {
        $limpo = normalizar_lista($l);
        if ($limpo === null || isset($vistos[$limpo['id']])) {
            continue;
        }
        $vistos[$limpo['id']] = true;
        $limpos[] = $limpo;
    }
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_LISTAS, $conteudo)) {
        return false;
    }
    ler_listas(true);
    return true;
}

function achar_lista(string $id): ?array
{
    foreach (ler_listas() as $l) {
        if ($l['id'] === $id) {
            return $l;
        }
    }
    return null;
}

function novo_id_lista(): string
{
    return bin2hex(random_bytes(6));
}

/**
 * As listas que vão para o site, já sem candidato apagado ou recolhido.
 *
 * A limpeza é na saída, e não na gravação: quem recolhe um candidato do ar não
 * deveria ter que lembrar de tirá-lo de cinco listas, e republicá-lo deve
 * devolvê-lo a todas de uma vez.
 */
function listas_publicadas(): array
{
    $noAr = [];
    foreach (candidatos_publicados() as $c) {
        $noAr[$c['id']] = true;
    }

    $saida = [];
    foreach (ler_listas() as $l) {
        if (!$l['publicada']) {
            continue;
        }
        $l['candidatos'] = array_values(array_filter($l['candidatos'], fn ($id) => isset($noAr[$id])));
        if ($l['candidatos'] === []) {
            continue;  // lista vazia no site é um título sem nada embaixo
        }
        $saida[] = $l;
    }
    return $saida;
}
