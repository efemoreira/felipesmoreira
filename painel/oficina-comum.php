<?php
declare(strict_types=1);

/**
 * A OFICINA — testar formato de vídeo até achar o seu, com número na mão.
 *
 * O desafio de formatos não é uma lista de 37 coisas para riscar: é um
 * experimento. O material de origem diz isso com todas as letras — "o objetivo
 * real não é postar 32 vezes, é descobrir quais 2 ou 3 formatos funcionam no
 * SEU nicho para você repetir depois". Uma lista que só marca feito responde
 * "quantos?"; a pergunta é "quais?", e ela só se responde com views, retenção,
 * salvamento e seguidor ganho ao lado de cada vídeo.
 *
 * DUAS DECISÕES DE MODELO EXPLICAM O RESTO DO ARQUIVO:
 *
 * 1. **O registro é a TENTATIVA, não o formato.** O desafio termina em "repita
 *    os 3 que funcionaram", então o mesmo formato vai ser gravado de novo. Um
 *    registro por formato obrigaria a escolher entre apagar o número antigo ou
 *    inventar um segundo campo — e as médias da aba Números precisam dos dois.
 *    Um formato conta como FEITO quando tem ao menos uma tentativa publicada.
 *
 * 2. **A FILA É DERIVADA, e não guardada.** Ordem do catálogo, menos o que já
 *    foi publicado, com o adiado empurrado para o fim pelo carimbo `adiadoEm`.
 *    Um campo `posicao` gravado dessincroniza do catálogo no dia em que um
 *    formato novo entrar no meio; um cálculo não tem como dessincronizar.
 *
 * CADA PESSOA TEM A SUA LINHA, e ninguém vê a de ninguém — nem a administração.
 * Por isso `minha_oficina()` e `gravar_minha_oficina()` recebem `$eu` e não têm
 * parâmetro que amplie o recorte: uma assinatura com `$de` acabaria, na
 * terceira tela, recebendo `$_GET['de']`. É a mesma regra de `minha_gente()`.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/oficina-catalogo.php';
require_once __DIR__ . '/agenda-comum.php';  // semana_de() — domingo a sábado, no fuso do Ceará

const ARQ_OFICINA = PASTA_DADOS . '/oficina.php';

/**
 * Onde a tentativa está. São as três etapas do material de origem (gravar,
 * editar, publicar) mais o `aberto` de quem só adiou o formato sem gravar nada.
 */
const ESTADOS_OFICINA = [
    'aberto'    => 'Começado',
    'gravado'   => 'Gravado',
    'editado'   => 'Editado',
    'publicado' => 'Publicado',
];

/**
 * O que se anota de cada vídeo publicado.
 *
 * Os quatro primeiros são os que o material manda anotar. `comentarios` entrou
 * porque metade dos formatos da lista (Tier List, Mito x Verdade, Lista) existe
 * justamente para gerar discordância no comentário — medir esses por views
 * seria medir pelo eixo errado.
 */
const NUMEROS_OFICINA = [
    'views'       => 'Views',
    'retencao'    => 'Retenção %',
    'salvamentos' => 'Salvamentos',
    'comentarios' => 'Comentários',
    'seguidores'  => 'Seguidores',
];

/** Hoje no fuso do Ceará, e não no do servidor — a Hostinger roda em UTC. */
function hoje_na_oficina(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('America/Fortaleza')))->format('Y-m-d');
}

function normalizar_tentativa($t): ?array
{
    if (!is_array($t) || empty($t['id'])) {
        return null;
    }
    /* Tentativa sem dono não é de ninguém, e uma linha sem dono apareceria na
       oficina de todo mundo — que é exatamente o que este arquivo impede. */
    $pessoa = limpar_texto($t['pessoa'] ?? '', 40);
    if ($pessoa === '') {
        return null;
    }
    /* Formato fora do catálogo é lixo de versão antiga: some em silêncio, como
       o lançamento de valor zero do caixa. */
    $formato = limpar_texto($t['formato'] ?? '', 60);
    if (!isset(FORMATOS_OFICINA[$formato])) {
        return null;
    }
    $estado = (string) ($t['estado'] ?? 'aberto');
    if (!isset(ESTADOS_OFICINA[$estado])) {
        $estado = 'aberto';
    }
    $gancho = limpar_texto($t['gancho'] ?? '', 40);
    if ($gancho !== '' && !isset(GANCHOS_OFICINA[$gancho])) {
        $gancho = '';
    }

    $numeros = [];
    foreach (array_keys(NUMEROS_OFICINA) as $campo) {
        /* Nunca negativo: "-200 views" é erro de digitação, e uma média
           envenenada por ele manda o formato errado para o topo da aba. */
        $numeros[$campo] = max(0, (int) ($t[$campo] ?? 0));
    }
    $numeros['retencao'] = min(100, $numeros['retencao']);

    return [
        'id'      => limpar_texto($t['id'], 40),
        'pessoa'  => $pessoa,
        'formato' => $formato,
        'estado'  => $estado,
        'tema'    => limpar_texto($t['tema'] ?? '', 140),
        'gancho'  => $gancho,
        'link'    => limpar_texto($t['link'] ?? '', 300),
        'publicadoEm' => limpar_texto($t['publicadoEm'] ?? '', 10),
        'views'       => $numeros['views'],
        'retencao'    => $numeros['retencao'],
        'salvamentos' => $numeros['salvamentos'],
        'comentarios' => $numeros['comentarios'],
        'seguidores'  => $numeros['seguidores'],
        'nota'     => limpar_texto($t['nota'] ?? '', 500),
        'adiadoEm' => limpar_texto($t['adiadoEm'] ?? '', 40),
        'criadoEm'  => limpar_texto($t['criadoEm'] ?? '', 40),
        'criadoPor' => limpar_texto($t['criadoPor'] ?? '', 60),
        'alteradoEm'  => limpar_texto($t['alteradoEm'] ?? '', 40),
        'alteradoPor' => limpar_texto($t['alteradoPor'] ?? '', 60),
        'apagadoEm'     => limpar_texto($t['apagadoEm'] ?? '', 40),
        'apagadoPor'    => limpar_texto($t['apagadoPor'] ?? '', 60),
        'apagadoMotivo' => limpar_texto($t['apagadoMotivo'] ?? '', 120),
    ];
}

function ler_oficina_tudo(): array
{
    if (!is_file(ARQ_OFICINA)) {
        return [];
    }
    $bruto = @include ARQ_OFICINA;
    if (!is_array($bruto)) {
        return [];
    }
    $limpo = [];
    foreach ($bruto as $t) {
        if ($ok = normalizar_tentativa($t)) {
            $limpo[] = $ok;
        }
    }
    return $limpo;
}

/** As tentativas vivas, de todo mundo. Quem desenha tela usa `minha_oficina()`. */
function ler_oficina(): array
{
    return array_values(array_filter(ler_oficina_tudo(), fn ($t) => $t['apagadoEm'] === ''));
}

/** Só as lápides — para a linha do tempo. */
function ler_oficina_apagadas(): array
{
    return array_values(array_filter(ler_oficina_tudo(), fn ($t) => $t['apagadoEm'] !== ''));
}

function gravar_oficina(array $tentativas): bool
{
    preparar_pastas();
    $limpas = [];
    foreach ($tentativas as $t) {
        if ($ok = normalizar_tentativa($t)) {
            $limpas[] = $ok;
        }
    }
    $limpas = carimbar_alteracoes(ler_oficina(), $limpas);
    $ids = array_column($limpas, 'id');
    foreach (ler_oficina_apagadas() as $lapide) {
        if (!in_array($lapide['id'], $ids, true)) {
            $limpas[] = $lapide;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Oficina de formatos — não versionar.\nreturn "
        . var_export($limpas, true) . ";\n";
    if (!gravar_atomico(ARQ_OFICINA, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_OFICINA, true);
    }
    return true;
}

/**
 * As tentativas DESTA pessoa, da mais recente para a mais antiga.
 *
 * Não existe `oficina_de($id)`: o recorte é sempre de quem está chamando, e
 * abrir a assinatura para um id qualquer é o primeiro passo para ela receber
 * `$_GET['de']` numa tela futura.
 */
function minha_oficina(array $eu): array
{
    $id = (string) ($eu['id'] ?? '');
    if ($id === '') {
        return [];
    }
    $minhas = array_values(array_filter(ler_oficina(), fn ($t) => $t['pessoa'] === $id));
    usort($minhas, fn ($a, $b) => [$b['publicadoEm'], $b['criadoEm']] <=> [$a['publicadoEm'], $a['criadoEm']]);
    return $minhas;
}

/**
 * Grava a oficina DESTA pessoa sem tocar na de ninguém.
 *
 * Relê o disco dentro da trava, troca só as linhas desta pessoa e devolve o
 * resto intacto. O `pessoa` é carimbado aqui, e não confiado ao formulário:
 * é o que torna impossível uma ação escrever na linha de outro.
 */
function gravar_minha_oficina(array $eu, array $minhas): bool
{
    $id = (string) ($eu['id'] ?? '');
    if ($id === '') {
        return false;
    }
    $ok = false;
    com_trava(ARQ_OFICINA, function () use ($id, $minhas, &$ok): void {
        $dos_outros = array_values(array_filter(ler_oficina(), fn ($t) => $t['pessoa'] !== $id));
        $carimbadas = [];
        foreach ($minhas as $t) {
            $t['pessoa'] = $id;
            $carimbadas[] = $t;
        }
        $ok = gravar_oficina(array_merge($dos_outros, $carimbadas));
    });
    return $ok;
}

/** Apaga uma tentativa desta pessoa deixando a lápide. */
function apagar_tentativa(array $eu, string $id, string $motivo = ''): bool
{
    $meuId = (string) ($eu['id'] ?? '');
    $achou = false;
    $tudo = ler_oficina_tudo();
    foreach ($tudo as &$t) {
        if ($t['id'] === $id && $t['pessoa'] === $meuId && $t['apagadoEm'] === '') {
            $t['apagadoEm']     = date('c');
            $t['apagadoPor']    = quem_grava();
            $t['apagadoMotivo'] = limpar_texto($motivo, 120);
            $achou = true;
        }
    }
    unset($t);
    if (!$achou) {
        return false;
    }
    $limpas = [];
    foreach ($tudo as $t) {
        if ($ok = normalizar_tentativa($t)) {
            $limpas[] = $ok;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Oficina de formatos — não versionar.\nreturn "
        . var_export($limpas, true) . ";\n";
    if (!gravar_atomico(ARQ_OFICINA, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_OFICINA, true);
    }
    return true;
}

/* ------------------------------------------------------------------ */
/* A leitura: o que está feito, o que vem agora, o que funcionou        */
/* ------------------------------------------------------------------ */

/** Quantas vezes cada formato já foi publicado por esta pessoa. */
function formatos_feitos(array $eu): array
{
    $feitos = [];
    foreach (minha_oficina($eu) as $t) {
        if ($t['estado'] === 'publicado') {
            $feitos[$t['formato']] = ($feitos[$t['formato']] ?? 0) + 1;
        }
    }
    return $feitos;
}

/** A tentativa em andamento de um formato — a não publicada mais recente. */
function tentativa_aberta(array $eu, string $formato): ?array
{
    foreach (minha_oficina($eu) as $t) {
        if ($t['formato'] === $formato && $t['estado'] !== 'publicado') {
            return $t;
        }
    }
    return null;
}

/** O vídeo já tem algum número anotado? Zero em tudo é "ainda não medi". */
function tem_numero(array $t): bool
{
    foreach (array_keys(NUMEROS_OFICINA) as $campo) {
        if ($t[$campo] > 0) {
            return true;
        }
    }
    return false;
}

/**
 * A FILA: o que ainda falta, na ordem em que vai ser oferecido.
 *
 * Ordem do catálogo; quem foi adiado vai para o fim, e entre os adiados volta
 * primeiro quem está adiado há mais tempo — senão "fica pra depois" vira um
 * jeito de nunca mais ver o formato difícil. O Formato Combinado é sempre o
 * último da fila, aconteça o que acontecer: ele é o fecho que se faz com
 * número na mão, e não um item que a ordem do catálogo pode antecipar.
 */
function fila_de(array $eu): array
{
    $feitos = formatos_feitos($eu);
    $agora = $adiados = [];

    foreach (FORMATOS_OFICINA as $chave => $formato) {
        if (isset($feitos[$chave]) || $chave === 'combinado') {
            continue;
        }
        $aberta = tentativa_aberta($eu, $chave);
        $item = [
            'chave'     => $chave,
            'formato'   => $formato,
            'tentativa' => $aberta,
            'adiadoEm'  => $aberta['adiadoEm'] ?? '',
        ];
        if ($item['adiadoEm'] !== '') {
            $adiados[] = $item;
        } else {
            $agora[] = $item;
        }
    }
    usort($adiados, fn ($a, $b) => $a['adiadoEm'] <=> $b['adiadoEm']);

    $fila = array_merge($agora, $adiados);
    if (!isset($feitos['combinado'])) {
        $aberta = tentativa_aberta($eu, 'combinado');
        $fila[] = [
            'chave'     => 'combinado',
            'formato'   => FORMATOS_OFICINA['combinado'],
            'tentativa' => $aberta,
            'adiadoEm'  => $aberta['adiadoEm'] ?? '',
        ];
    }
    return $fila;
}

/** O formato da vez — o primeiro da fila, ou null quando os 37 foram feitos. */
function formato_da_vez(array $eu): ?array
{
    return fila_de($eu)[0] ?? null;
}

/**
 * O DESEMPENHO POR FORMATO — a resposta a "o que funciona no meu nicho".
 *
 * Média por formato, só do que foi publicado E medido: vídeo sem número entra
 * na média como zero e afunda um formato que talvez tenha ido bem. Ordenado
 * por retenção, que é o único dos cinco números comparável entre vídeos de
 * alcance diferente — views premiam o vídeo que o algoritmo escolheu empurrar,
 * retenção premia o vídeo que segurou quem chegou.
 */
function desempenho_de(array $eu): array
{
    $por_formato = [];
    foreach (minha_oficina($eu) as $t) {
        if ($t['estado'] !== 'publicado' || !tem_numero($t)) {
            continue;
        }
        $por_formato[$t['formato']][] = $t;
    }

    $linhas = [];
    foreach ($por_formato as $chave => $tentativas) {
        $linha = [
            'chave'    => $chave,
            'formato'  => FORMATOS_OFICINA[$chave],
            'videos'   => count($tentativas),
        ];
        foreach (array_keys(NUMEROS_OFICINA) as $campo) {
            $linha[$campo] = (int) round(array_sum(array_column($tentativas, $campo)) / count($tentativas));
        }
        $linhas[] = $linha;
    }
    usort($linhas, fn ($a, $b) => [$b['retencao'], $b['salvamentos']] <=> [$a['retencao'], $a['salvamentos']]);
    return $linhas;
}

/** Os publicados que ainda não têm número — medir é a outra metade do desafio. */
function sem_numero(array $eu): array
{
    return array_values(array_filter(
        minha_oficina($eu),
        fn ($t) => $t['estado'] === 'publicado' && !tem_numero($t)
    ));
}

/** Dias desde a última publicação. `null` quando ainda não publicou nenhum. */
function dias_sem_publicar(array $eu): ?int
{
    $ultima = '';
    foreach (minha_oficina($eu) as $t) {
        if ($t['estado'] === 'publicado' && $t['publicadoEm'] > $ultima) {
            $ultima = $t['publicadoEm'];
        }
    }
    if ($ultima === '') {
        return null;
    }
    $fuso = new DateTimeZone('America/Fortaleza');
    $de = DateTimeImmutable::createFromFormat('Y-m-d|', $ultima, $fuso);
    if ($de === false) {
        return null;
    }
    $hoje = new DateTimeImmutable(hoje_na_oficina(), $fuso);
    return max(0, (int) $de->diff($hoje)->days);
}

/** Quantos vídeos publicados nesta semana — domingo a sábado, fuso do Ceará. */
function publicados_na_semana(array $eu): int
{
    $domingo = substr(semana_de()['inicio'], 0, 10);
    $quantos = 0;
    foreach (minha_oficina($eu) as $t) {
        if ($t['estado'] === 'publicado' && $t['publicadoEm'] >= $domingo) {
            $quantos++;
        }
    }
    return $quantos;
}

/* ------------------------------------------------------------------ */
/* O que a Oficina diz ao Início — formato em `agora.php`               */
/* ------------------------------------------------------------------ */

/**
 * A fila do dia. É o ponto inteiro da Oficina ser área do painel e não uma
 * página à parte: ritmo não se sustenta numa tela que você precisa lembrar de
 * abrir — se sustenta aparecendo no lugar por onde você já passa.
 */
function pendencias_oficina(array $u): array
{
    require_once __DIR__ . '/agora.php';  // apelido_curto()
    $tarefas = [];

    $vez = formato_da_vez($u);
    if ($vez !== null) {
        $dias = dias_sem_publicar($u);
        /* Quem nunca publicou não leva vermelho no primeiro dia: a cobrança é
           para quem tinha ritmo e parou, não para quem está começando. */
        $parado = $dias !== null && $dias >= DIAS_SEM_PUBLICAR_URGENTE;
        $tarefas[] = [
            'area'    => 'oficina',
            'icone'   => 'play',
            'urgente' => $parado,
            'texto'   => 'Gravar o formato da vez — ' . apelido_curto($vez['formato']['nome']),
            'porque'  => $parado
                ? 'você está há ' . $dias . ' ' . ($dias === 1 ? 'dia' : 'dias') . ' sem publicar'
                : ($dias === null
                    ? 'o desafio começa no primeiro vídeo'
                    : $vez['formato']['resumo']),
            'url'     => '/painel/oficina.php',
        ];
    }

    $faltando = sem_numero($u);
    if ($faltando !== []) {
        $quantos = count($faltando);
        $tarefas[] = [
            'area'    => 'oficina',
            'icone'   => 'search',
            /* Sem número, o desafio vira só uma lista riscada: a pergunta
               "quais 2 ou 3 funcionam" não tem como ser respondida depois. */
            'urgente' => false,
            'quantos' => $quantos,
            'texto'   => $quantos === 1
                ? 'Anotar os números de 1 vídeo'
                : "Anotar os números de {$quantos} vídeos",
            'porque'  => 'publicado sem medida não responde o que funciona',
            'url'     => '/painel/oficina.php?aba=numeros',
        ];
    }

    return $tarefas;
}

/** Os medidores da Oficina no cockpit do Início. */
function medidores_oficina(array $u): array
{
    require_once __DIR__ . '/agora.php';  // degrau_de_prazo()

    $feitos = count(formatos_feitos($u));
    $total = count(FORMATOS_OFICINA);
    $semana = publicados_na_semana($u);
    $melhor = desempenho_de($u)[0] ?? null;

    $medidores = [
        [
            'num'    => $feitos . '/' . $total,
            'rotulo' => 'Formatos testados',
            'nota'   => $feitos === 0
                ? 'Nenhum formato publicado ainda.'
                : 'Cada um publicado ao menos uma vez.',
            'estado' => 'ok',
            'url'    => '/painel/oficina.php?aba=formatos',
        ],
        [
            'num'    => (string) $semana,
            'rotulo' => 'Publicados na semana',
            'nota'   => $semana >= META_SEMANAL_OFICINA
                ? 'A meta da semana está feita.'
                : 'A meta é ' . META_SEMANAL_OFICINA . ' por semana, de domingo a sábado.',
            /* O degrau conta o que FALTA, e não o que foi feito: o helper
               responde "quão perto do limite", e o limite aqui é a meta inteira
               por fazer. */
            'estado' => degrau_de_prazo(META_SEMANAL_OFICINA - $semana, META_SEMANAL_OFICINA),
            'url'    => '/painel/oficina.php',
        ],
    ];

    if ($melhor !== null) {
        $medidores[] = [
            'num'    => $melhor['retencao'] . '%',
            'rotulo' => 'Melhor retenção',
            'nota'   => $melhor['formato']['nome'] . ' — é o formato a repetir.',
            'estado' => 'ok',
            'url'    => '/painel/oficina.php?aba=numeros',
        ];
    }

    return $medidores;
}

/** A linha do cartão de mesa do Início. */
function estado_oficina(array $u): string
{
    $vez = formato_da_vez($u);
    if ($vez === null) {
        return 'Os ' . count(FORMATOS_OFICINA) . ' formatos foram testados.';
    }
    $semana = publicados_na_semana($u);
    return $semana . ' de ' . META_SEMANAL_OFICINA . ' esta semana · o da vez é ' . $vez['formato']['nome'] . '.';
}
