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

/* O candidato é uma PESSOA com `tipo = 'candidato'` — não há mais um cadastro
   à parte. Nome de urna, cargo, número, @ e foto são campos da ficha dela, e é
   por isso que dá para saber que o candidato também esteve num encontro.
   Aqui ficam só as LISTAS, que são curadoria e não identidade. */

const ARQ_LISTAS = PASTA_DADOS . '/listas.php';

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

/** Todo mundo com `tipo = candidato`, na ordem em que se quer ver. */
function ler_candidatos(): array
{
    $lista = array_values(array_filter(ler_pessoas(), fn ($p) => $p['tipo'] === 'candidato'));
    usort($lista, fn ($a, $b) => [$a['ordem'] ?? 0, sem_acento($a['nome'])] <=> [$b['ordem'] ?? 0, sem_acento($b['nome'])]);
    return $lista;
}

function achar_candidato(string $id): ?array
{
    $p = achar_pessoa($id);
    return $p !== null && $p['tipo'] === 'candidato' ? $p : null;
}

/** Só o que está no ar — é isto que o site recebe. */
function candidatos_publicados(): array
{
    return array_values(array_filter(ler_candidatos(), fn ($c) => $c['publicado'] && $c['numero'] !== ''));
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
