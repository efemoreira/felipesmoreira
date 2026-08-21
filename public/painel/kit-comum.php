<?php
declare(strict_types=1);

/**
 * As peças extras do kit do mutirão — felipesmoreira.com/kit
 *
 * O kit nasceu com oito peças fixas no código, tiradas do plano de governo.
 * Elas não envelhecem (são números com página), mas **o fato da semana não vira
 * peça sem um deploy** — e campanha não espera build. Este arquivo é o que
 * permite a coordenação acrescentar peça pela tela de Produção.
 *
 * Fica em dados/kit.php, e não .json, pela mesma razão de sempre: o .htaccess
 * de /dados só bloqueia .php. Aqui não há dado pessoal, mas peça não publicada
 * é material de campanha antes da hora — e o padrão vale para tudo.
 *
 * Quem publica não é este arquivo: a peça só sai no site com `publicada`
 * marcada, igual ao vídeo das aulas.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_KIT = PASTA_DADOS . '/kit.php';

/** Os mesmos temas do kit fixo, para a pílula do cartão não virar bagunça. */
const TEMAS_KIT = ['Segurança', 'Periferia', 'Saúde', 'Interior', 'Água', 'Educação', 'O método'];

/**
 * Uma peça só entra se tiver **fonte**. É a Parte 0 do manual aplicada à
 * ferramenta: número sem página é exatamente o boato que a Checagem existe
 * para barrar, e uma peça circula muito mais longe que um post.
 */
function normalizar_peca($p): ?array
{
    if (!is_array($p)) {
        return null;
    }

    $id     = normalizar_id_peca((string) ($p['id'] ?? ''));
    $numero = limpar_texto($p['numero'] ?? '', 20);
    $frase  = limpar_texto($p['frase'] ?? '', 160);
    $fonte  = limpar_texto($p['fonte'] ?? '', 80);

    if ($id === '' || $numero === '' || $frase === '' || $fonte === '') {
        return null;
    }

    $tema = limpar_texto($p['tema'] ?? '', 20);
    if (!in_array($tema, TEMAS_KIT, true)) {
        $tema = TEMAS_KIT[0];
    }

    return [
        'id'        => $id,
        'tema'      => $tema,
        'numero'    => $numero,
        'frase'     => $frase,
        'fonte'     => $fonte,
        'legenda'   => limpar_texto($p['legenda'] ?? '', 900),
        'destino'   => normalizar_destino($p['destino'] ?? ''),
        'publicada' => !empty($p['publicada']),
        'criadaEm'  => limpar_texto($p['criadaEm'] ?? '', 40),
        'criadaPor' => limpar_texto($p['criadaPor'] ?? '', 60),
    ];
}

/** Slug curto e estável: vira o nome do arquivo PNG que o militante baixa. */
function normalizar_id_peca(string $bruto): string
{
    $slug = strtolower(sem_acento(limpar_texto($bruto, 40)));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    return trim($slug, '-');
}

/**
 * Para onde o cartão manda quem viu. Só caminho interno: uma peça do movimento
 * que joga o leitor para fora do site desperdiça a única visita que ela gera —
 * e um campo de URL livre é convite a link colado errado.
 */
function normalizar_destino($bruto): string
{
    $d = limpar_texto($bruto, 120);
    if ($d === '' || $d[0] !== '/') {
        return '/propostas';
    }
    // nada de "//host" nem de volta pra cima
    if (str_starts_with($d, '//') || str_contains($d, '..')) {
        return '/propostas';
    }
    return $d;
}

function ler_pecas(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_KIT)) {
        $bruto = @include ARQ_KIT;
        foreach (is_array($bruto) ? $bruto : [] as $p) {
            if ($limpa = normalizar_peca($p)) {
                $cache[] = $limpa;
            }
        }
    }
    return $cache;
}

function gravar_pecas(array $pecas): bool
{
    preparar_pastas();

    $limpas = [];
    $vistos = [];
    foreach ($pecas as $p) {
        $limpa = normalizar_peca($p);
        // id repetido sobrescreveria o PNG da outra peça no celular de quem baixou
        if ($limpa === null || isset($vistos[$limpa['id']])) {
            continue;
        }
        $vistos[$limpa['id']] = true;
        $limpas[] = $limpa;
    }

    $ok = gravar_atomico(ARQ_KIT, "<?php\nreturn " . var_export($limpas, true) . ";\n");
    if ($ok) {
        ler_pecas(true);
    }
    return $ok;
}

/** Só o que está publicado — é isto que o site recebe. */
function pecas_publicadas(): array
{
    return array_values(array_filter(ler_pecas(), fn ($p) => $p['publicada']));
}
