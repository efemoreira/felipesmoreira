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

/* ===================== o mutirão da semana ===================== */

const ARQ_MUTIRAO = PASTA_DADOS . '/mutirao.php';

/**
 * O MUTIRÃO — quem posta qual peça, nesta semana.
 *
 * Existe porque a comunicação não falha por falta de gente: falha por
 * TOPOLOGIA. As seis funções do grupo (Olheiro → Checagem → Roteirista →
 * Design → Editor → Acervo) são uma corrente, e uma corrente só produz com os
 * seis elos vivos no mesmo dia. Falta um elo e tudo para — e quem está a
 * montante vê o próprio trabalho morrer e sai. Pior: a corrente só se monta se
 * seis pessoas escolherem seis funções.
 *
 * O mutirão é o contrário disso: cada um age sozinho, sem depender de ninguém a
 * montante, e a peça já existe pronta. É o que setenta e duas pessoas novas
 * conseguem fazer na semana em que entram.
 *
 * **A CHAVE É A SEMANA, e sai de `semana_de()`** — o mesmo par PHP/TS que a
 * /programacao usa, preso por `testes/contrato/semana.test.ts`. Uma data solta
 * aqui faria o mutirão virar a semana num dia diferente do resto do site.
 *
 * Guarda o histórico: a semana passada não se apaga quando a nova começa. É por
 * ele que se sabe quem anda postando e quem sumiu.
 */
function chave_da_semana(?int $agora = null): string
{
    /* Por dentro, e não no topo do arquivo: quem inclui `kit-comum.php` para
       listar peças não paga a leitura do relógio da agenda. É o padrão do
       painel — ver o comentário de `trilhas.php`. */
    require_once __DIR__ . '/agenda-comum.php';  // semana_de()
    return substr(semana_de($agora)['inicio'], 0, 10);
}

function ler_mutirao(): array
{
    if (!is_file(ARQ_MUTIRAO)) {
        return [];
    }
    $bruto = @include ARQ_MUTIRAO;
    if (!is_array($bruto)) {
        return [];
    }

    $limpo = [];
    foreach ($bruto as $semana => $linha) {
        $semana = limpar_texto((string) $semana, 10);
        if ($semana === '' || !is_array($linha)) {
            continue;
        }
        $escalados = [];
        foreach ((array) ($linha['escalados'] ?? []) as $id => $estado) {
            $id = limpar_texto((string) $id, 40);
            /* Fora da lista conhecida some — mesma régua do aceite da escala: o
               arquivo é gravado por mais de uma tela, e um valor estranho não
               pode virar estado que nenhuma delas sabe desenhar. */
            if ($id !== '' && in_array($estado, ['escalado', 'postou'], true)) {
                $escalados[$id] = (string) $estado;
            }
        }
        $limpo[$semana] = [
            'peca'      => limpar_texto($linha['peca'] ?? '', 40),
            'escalados' => $escalados,
        ];
    }
    krsort($limpo);  // a semana mais recente primeiro
    return $limpo;
}

function gravar_mutirao(array $mutirao): bool
{
    preparar_pastas();
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($mutirao, true) . ";\n";
    if (!gravar_atomico(ARQ_MUTIRAO, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_MUTIRAO, true);
    }
    return true;
}

/**
 * Marca — ou desmarca — que alguém postou a peça desta semana.
 *
 * UMA GRAVAÇÃO PARA AS DUAS PORTAS. A coordenação marca pelos três pontinhos
 * da Munição; a própria pessoa marca pelo botão "Já postei" do Início. Eram
 * dois leitura-altera-grava iguais em dois arquivos, com dois nomes de ação
 * (`postei-a-peca` e `mutirao-postou`) para a mesma coisa. Quem decide o que
 * cada porta pode fazer é quem chama; o que se grava é isto.
 *
 * `$postou` null alterna (a coordenação corrige nos dois sentidos); true fixa
 * (a pessoa só afirma que postou — desmarcar é da coordenação).
 *
 * Devolve o erro legível, ou null quando gravou.
 */
function registrar_postagem(string $quem, ?bool $postou = null): ?string
{
    $mutirao = ler_mutirao();
    $semana  = chave_da_semana();
    $linha   = $mutirao[$semana] ?? ['peca' => '', 'escalados' => []];
    if (!isset($linha['escalados'][$quem])) {
        return 'Essa pessoa não está no mutirão desta semana.';
    }
    $estava = $linha['escalados'][$quem] === 'postou';
    $linha['escalados'][$quem] = ($postou ?? !$estava) ? 'postou' : 'escalado';
    $mutirao[$semana] = $linha;
    return gravar_mutirao($mutirao) ? null : 'Não consegui gravar o mutirão.';
}

/** O que está combinado para esta semana — peça, escalados, e a ficha da peça. */
function mutirao_da_semana(?int $agora = null): array
{
    $semana = chave_da_semana($agora);
    $linha = ler_mutirao()[$semana] ?? ['peca' => '', 'escalados' => []];
    $peca = null;
    foreach (ler_pecas() as $p) {
        if ($p['id'] === $linha['peca']) {
            $peca = $p;
        }
    }
    return ['semana' => $semana, 'peca' => $peca, 'escalados' => $linha['escalados']];
}

/**
 * A MENSAGEM DO MUTIRÃO, com a atribuição de quem vai postar.
 *
 * O `?de=` é o que transforma "compartilhe" em trabalho medível: sem ele não há
 * como saber qual militante traz gente e qual canal converte, que são as duas
 * contas que governam o crescimento.
 *
 * O slug sai de `normalizar_origem()`, que é o par PHP de `slugDe()` — o mesmo
 * que o militante geraria digitando o próprio nome em /municao.
 * `testes/contrato/origem.test.ts` prende os dois lados.
 *
 * Sem pessoa, devolve a versão do grupo: mesma peça, sem atribuição.
 */
function mensagem_do_mutirao(array $peca, ?array $pessoa = null): string
{
    require_once __DIR__ . '/eventos-comum.php';     // raiz_do_site()
    require_once __DIR__ . '/inscricoes-comum.php';  // normalizar_origem()

    $link = raiz_do_site() . '/municao';
    if ($pessoa !== null) {
        $slug = normalizar_origem($pessoa['nome']);
        if ($slug !== '') {
            $link .= '?de=' . rawurlencode($slug);
        }
    }

    $abre = $pessoa === null
        ? "*A peça desta semana* — quem puder, posta hoje.\n\n"
        : primeiro_nome($pessoa['nome']) . ", esta é a sua peça desta semana:\n\n";

    return $abre
        . '*' . $peca['numero'] . "* — {$peca['frase']}\n"
        . "_{$peca['fonte']}_\n\n"
        . ($peca['legenda'] !== '' ? $peca['legenda'] . "\n\n" : '')
        . "A arte e o texto prontos estão aqui:\n" . $link;
}
