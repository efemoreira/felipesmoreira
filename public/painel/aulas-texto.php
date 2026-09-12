<?php
declare(strict_types=1);

/**
 * O texto das aulas, editável pela coordenação — sem abrir mão de versionar.
 *
 * O currículo é código (`aulas-conteudo.php`), de propósito: muda por decisão,
 * não numa terça-feira. Mas "por decisão" virou "por desenvolvedor": corrigir
 * uma frase da aula de Recepção na quinta, para o encontro de sábado, era
 * commit e deploy — e por isso ninguém corrigia.
 *
 * Isto é a camada de PATCH: `dados/aulas-texto.php` guarda, por aula, o
 * resumo e os blocos de texto que a coordenação sobrescreveu. O que se serve
 * (`curriculo_publico()`) é o currículo com o patch por cima. O arquivo no
 * repositório continua sendo a fonte versionada; quando os patches
 * acumularem, a Manutenção gera o PHP já consolidado para o desenvolvedor
 * colar em `aulas-conteudo.php` e zerar o patch. A regra "muda por decisão"
 * fica — muda quem aperta.
 *
 * SÓ TEXTO. O que se edita é `resumo` e os blocos `texto`, `aviso`, `passos`,
 * `lista` e `nunca` (os de frase e os de itens). Título, pista, minutos,
 * funções, checklist, tabela e modelo continuam só no código: são estrutura,
 * e estrutura é decisão de currículo, não correção de frase.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_AULAS_TEXTO = PASTA_DADOS . '/aulas-texto.php';

/** Os tipos de bloco que a coordenação edita, e o campo que cada um tem. */
const BLOCOS_EDITAVEIS = [
    'texto'  => 'texto',
    'aviso'  => 'texto',
    'passos' => 'itens',
    'lista'  => 'itens',
    'nunca'  => 'itens',
];

function ler_patches_de_aula(): array
{
    $bruto = is_file(ARQ_AULAS_TEXTO) ? @include ARQ_AULAS_TEXTO : null;
    return is_array($bruto) ? $bruto : [];
}

function gravar_patches_de_aula(array $patches): bool
{
    preparar_pastas();
    ksort($patches);
    $conteudo = "<?php\n// Gerado pelo painel. O texto das aulas sobrescrito pela coordenação — consolidar em aulas-conteudo.php de tempos em tempos.\nreturn "
        . var_export($patches, true) . ";\n";
    if (!gravar_atomico(ARQ_AULAS_TEXTO, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_AULAS_TEXTO, true);
    }
    return true;
}

/** A aula com o patch por cima — ou como está no código, se não há patch. */
function aula_com_patch(array $aula, ?array $patch): array
{
    if ($patch === null) {
        return $aula;
    }
    if (isset($patch['resumo'])) {
        $aula['resumo'] = $patch['resumo'];
    }
    foreach ($patch['blocos'] ?? [] as $i => $b) {
        if (!isset($aula['blocos'][$i])) {
            continue;   // o código mudou de forma; o patch daquele bloco não vale mais
        }
        $campo = BLOCOS_EDITAVEIS[$aula['blocos'][$i]['tipo'] ?? ''] ?? null;
        if ($campo !== null && isset($b[$campo])) {
            $aula['blocos'][$i][$campo] = $b[$campo];
        }
    }
    return $aula;
}

/** O currículo inteiro com os patches aplicados — é o que se serve. */
function curriculo_vigente(): array
{
    require_once __DIR__ . '/aulas-conteudo.php';
    $patches = ler_patches_de_aula();
    $dias = [];
    foreach (CURRICULO as $dia) {
        $dia['aulas'] = array_map(fn ($a) => aula_com_patch($a, $patches[$a['id']] ?? null), $dia['aulas']);
        $dias[] = $dia;
    }
    return $dias;
}

/**
 * Grava o que veio do formulário de uma aula. Bloco igual ao original não vira
 * patch; bloco com "voltar ao original" some do patch. Devolve quantos
 * blocos ficaram sobrescritos.
 */
function salvar_texto_de_aula(string $aulaId, string $resumo, array $blocosPost, array $originais, array $aulaOriginal): int
{
    $patches = ler_patches_de_aula();
    $patch = ['blocos' => []];

    $resumo = trim($resumo);
    if ($resumo !== '' && $resumo !== $aulaOriginal['resumo'] && !in_array('resumo', $originais, true)) {
        $patch['resumo'] = mb_substr($resumo, 0, 400);
    }

    foreach ($aulaOriginal['blocos'] as $i => $bloco) {
        $campo = BLOCOS_EDITAVEIS[$bloco['tipo'] ?? ''] ?? null;
        if ($campo === null || !isset($blocosPost[$i]) || in_array((string) $i, $originais, true)) {
            continue;
        }
        $valor = (string) $blocosPost[$i];
        if ($campo === 'texto') {
            $novo = trim($valor);
            if ($novo === '' || $novo === $bloco['texto']) {
                continue;
            }
            $patch['blocos'][$i] = ['texto' => mb_substr($novo, 0, 2000)];
        } else {
            $itens = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $valor) ?: []), fn ($l) => $l !== ''));
            if ($itens === [] || $itens === $bloco['itens']) {
                continue;
            }
            $patch['blocos'][$i] = ['itens' => array_map(fn ($l) => mb_substr($l, 0, 1000), $itens)];
        }
    }

    if ($patch['blocos'] === [] && !isset($patch['resumo'])) {
        unset($patches[$aulaId]);
    } else {
        $patch['alteradoEm']  = date('c');
        $patch['alteradoPor'] = quem_grava();
        $patches[$aulaId] = $patch;
    }
    gravar_patches_de_aula($patches);
    return count($patch['blocos']) + (isset($patch['resumo']) ? 1 : 0);
}

/**
 * O PHP de `aulas-conteudo.php` já com os patches — para a Manutenção mostrar
 * e o desenvolvedor colar. Só a constante; o cabeçalho do arquivo é dele.
 */
function curriculo_consolidado_php(): string
{
    return "const CURRICULO = " . var_export(curriculo_vigente(), true) . ";\n";
}
