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
 */

require_once __DIR__ . '/sessao.php';

const ARQ_CANDIDATOS = PASTA_DADOS . '/candidatos.php';

/**
 * Os grupos de compartilhamento.
 *
 * MÚLTIPLO de propósito: uma candidata a federal entra em `federais`, em
 * `mulheres` e, se a coordenação quiser, em `escolhidos`. Um grupo só por
 * pessoa obrigaria a escolher entre "é federal" e "é mulher", que não é uma
 * escolha que exista.
 *
 * `escolhidos` é a curadoria — quem aparece na home e quem sai na colinha
 * curta. Sem ele, a home mostraria a chapa inteira e ninguém decoraria nada.
 */
const GRUPOS_CANDIDATO = [
    'presidente' => 'Presidente',
    'governador' => 'Governo do Ceará',
    'federais'   => 'Deputado Federal',
    'estaduais'  => 'Deputado Estadual',
    'mulheres'   => 'Mulheres',
    'escolhidos' => 'Os escolhidos',
];

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

    $grupos = [];
    foreach ((array) ($c['grupos'] ?? []) as $g) {
        if (isset(GRUPOS_CANDIDATO[$g]) && !in_array($g, $grupos, true)) {
            $grupos[] = (string) $g;
        }
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
        'grupos' => $grupos,
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
