<?php
declare(strict_types=1);

/**
 * A CAPA DE CADA FORMATO — o desenho da estrutura do plano.
 *
 * NASCEU DE UM LIMITE, e o limite vale escrito: dos 37 formatos, só 16 têm
 * imagem de vídeo possível. A aula da Hotmart não devolve `og:image` (a parede
 * de login não deixa passar nem a capa), o card do Trello também não (o quadro
 * é privado), e os 13 formatos de pesquisa externa não saíram de um post — não
 * existe vídeo deles para ilustrar. Uma lista com 16 cartões cheios e 21
 * vazios é pior do que uma lista sem imagem nenhuma: a falta parece defeito.
 *
 * Então a capa base é DESENHADA, e mostra o que a foto não mostraria de todo
 * jeito: o esquema do plano. Tela Dividida é uma moldura partida ao meio com um
 * sujeito em cada metade; Faceless é texto e mãos; POV é a tarja em cima. É a
 * informação de que se precisa no minuto de gravar — a miniatura do reel mostra
 * o rosto de quem gravou, o desenho mostra como se grava.
 *
 * Por cima dele entra a capa real, quando ela existe (`capa_guardada()`).
 *
 * O TRAÇO É O MESMO DE `icones.php`: stroke 2, ponta e junta arredondadas, sem
 * preenchimento. Muda só a moldura — 40x56, a proporção de um vídeo em pé, e
 * não os 24x24 quadrados de um ícone de menu.
 */

require_once __DIR__ . '/sessao.php';

/** A moldura, desenhada uma vez para todas as capas. */
const CAPA_MOLDURA = 'M6 3h28a3 3 0 0 1 3 3v44a3 3 0 0 1 -3 3h-28a3 3 0 0 1 -3 -3v-44a3 3 0 0 1 3 -3';

/**
 * As vinte estruturas de plano. Formato que grava igual compartilha o desenho —
 * Diálogo, Conversa de Bar, Esquete e The Office são a mesma coisa para a
 * câmera (duas pessoas em cena), e fingir que são quatro desenhos diferentes
 * seria inventar diferença onde a gravação não tem.
 */
const CAPA_TRACOS = [
    /* moldura partida ao meio, um sujeito em cada metade */
    'dividida' => [
        'M3 28h34',
        'M20 16m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
        'M20 40m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    ],
    /* partida em pé: o lado a lado da comparação */
    'ladoalado' => [
        'M20 3v50',
        'M11 26m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
        'M29 26m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
        'M6 42a5 5 0 0 1 10 0',
        'M24 42a5 5 0 0 1 10 0',
    ],
    /* a imagem atrás e você na frente */
    'fundo' => [
        'M9 11h22v19h-22z',
        'M20 35m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
        'M12 49a8 8 0 0 1 16 0',
    ],
    /* o slide atrás, você apresentando */
    'slide' => [
        'M8 11h24v16h-24z',
        'M12 17h16',
        'M12 22h10',
        'M20 34m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
        'M12 49a8 8 0 0 1 16 0',
    ],
    /* a voz por cima da cena */
    'voz' => [
        'M9 23v10',
        'M15 16v24',
        'M20 20v16',
        'M25 13v30',
        'M31 25v6',
    ],
    /* cenas curtas emendadas: o corte seco */
    'cortes' => [
        'M7 9h18v12h-18z',
        'M15 23h18v12h-18z',
        'M7 37h18v12h-18z',
    ],
    /* uma pessoa, um plano */
    'cena' => [
        'M20 22m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0',
        'M10 43a10 10 0 0 1 20 0',
    ],
    /* duas pessoas em cena */
    'duas-pessoas' => [
        'M13 21m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
        'M27 21m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
        'M6 39a7 7 0 0 1 14 0',
        'M20 39a7 7 0 0 1 14 0',
    ],
    /* mais gente do que cabe no enquadramento */
    'grupo' => [
        'M12 23m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
        'M20 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
        'M28 23m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
        'M7 39a5 5 0 0 1 10 0',
        'M15 34a5 5 0 0 1 10 0',
        'M23 39a5 5 0 0 1 10 0',
    ],
    /* o print da pergunta na tela */
    'balao' => [
        'M9 14h22a3 3 0 0 1 3 3v13a3 3 0 0 1 -3 3h-12l-7 6v-6h-3a3 3 0 0 1 -3 -3v-13a3 3 0 0 1 3 -3',
        'M13 21h14',
        'M13 27h9',
    ],
    /* olhar de perto o que já existe */
    'lupa' => [
        'M9 13h22',
        'M9 19h15',
        'M19 34m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0',
        'M30 45l-5 -5',
    ],
    /* duas coisas diferentes que são a mesma coisa */
    'igual' => [
        'M8 13h11v11h-11z',
        'M27 19m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0',
        'M13 34h14',
        'M13 40h14',
    ],
    /* a tarja que dá o contexto em 1 segundo */
    'tarja' => [
        'M3 12h34v11h-34z',
        'M10 17h20',
        'M20 35m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0',
        'M11 50a9 9 0 0 1 18 0',
    ],
    /* de um estado para o outro */
    'seta' => [
        'M9 10h22v12h-22z',
        'M20 25v6',
        'M17 28l3 3l3 -3',
        'M9 37h22v12h-22z',
    ],
    /* a estrutura numerada que segura até o fim */
    'numerada' => [
        'M9 15h22',
        'M9 25h18',
        'M9 35h13',
        'M9 45h8',
    ],
    /* uma dica só, aplicável na hora */
    'raio' => [
        'M23 11l-10 17h7l-2 17l10 -17h-7z',
    ],
    /* sem aparecer: a tela e o cursor.
       O md descreve Faceless como "só as mãos executando algo, OU gravação de
       tela". A mão desenhada não se lê a 40 px — vira uma coroa —, e a tela com
       o cursor lê. Entre as duas leituras honestas do formato, ficou a que o
       olho reconhece no tamanho em que a capa realmente aparece. */
    'sem-rosto' => [
        'M9 14h22',
        'M9 21h22',
        'M9 28h13',
        'M18 34l12 5l-5 2l3 5l-3 2l-3 -5l-4 3z',
    ],
    /* o que você grava por trás do que sai */
    'camera' => [
        'M8 25h17v15h-17z',
        'M25 30l7 -4v15l-7 -4z',
        'M14 32m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    ],
    /* a resposta ao que a pessoa está pensando */
    'telepatia' => [
        'M20 21m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
        'M15 36m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
        'M11 45m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    ],
    /* dois formatos que viram um */
    'mistura' => [
        'M8 13h16v16h-16z',
        'M16 25h16v16h-16z',
    ],
];

/**
 * Qual estrutura cada formato usa.
 *
 * Fica separado do catálogo de propósito: `oficina-catalogo.php` é o conteúdo
 * (o que o formato é, como gravar, onde está a aula) e este arquivo é o
 * desenho. Mexer no traço de uma capa não devia obrigar a abrir o arquivo onde
 * moram os links das aulas.
 */
const CAPA_DE_FORMATO = [
    'tela-dividida'           => 'dividida',
    'tela-verde'              => 'fundo',
    'palestrinha'             => 'slide',
    'narrado'                 => 'voz',
    'cine'                    => 'cena',
    'storytelling-visual'     => 'cortes',
    'experimento-social'      => 'grupo',
    'conflito-situacional'    => 'duas-pessoas',
    'dinamismo'               => 'cortes',
    'trivial'                 => 'cena',
    'dialogo'                 => 'duas-pessoas',
    'caixinha-polemica'       => 'balao',
    'comparacao'              => 'ladoalado',
    'the-office'              => 'duas-pessoas',
    'lo-fi'                   => 'cena',
    'bastidores'              => 'camera',
    'telepatia'               => 'telepatia',
    'analise'                 => 'lupa',
    'analogia'                => 'igual',
    'vlog'                    => 'cortes',
    'conversa-de-bar'         => 'duas-pessoas',
    'criativo-preguicoso'     => 'cena',
    'o-narrador'              => 'voz',
    'pov'                     => 'tarja',
    'antes-e-depois'          => 'seta',
    'lista'                   => 'numerada',
    'tutorial-relampago'      => 'raio',
    'mito-x-verdade'          => 'lupa',
    'reacao'                  => 'balao',
    'erro-comum'              => 'lupa',
    'experimento'             => 'seta',
    'expectativa-x-realidade' => 'ladoalado',
    'qa'                      => 'balao',
    'tier-list'               => 'numerada',
    'esquete'                 => 'duas-pessoas',
    'faceless'                => 'sem-rosto',
    'combinado'               => 'mistura',
];

/**
 * O SVG da capa desenhada. `$titulo` vira o rótulo acessível — sem ele, um
 * leitor de tela anuncia uma imagem sem nome no meio da lista.
 */
function capa_svg(string $chave, int $altura = 56, string $titulo = ''): string
{
    $forma = CAPA_DE_FORMATO[$chave] ?? null;
    if ($forma === null || !isset(CAPA_TRACOS[$forma])) {
        return '';
    }
    $largura = (int) round($altura * 40 / 56);
    $d = '<path d="' . CAPA_MOLDURA . '"/>';
    foreach (CAPA_TRACOS[$forma] as $traco) {
        $d .= '<path d="' . $traco . '"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' . $largura . '" height="' . $altura . '"'
        . ' viewBox="0 0 40 56" fill="none" stroke="currentColor" stroke-width="2"'
        . ' stroke-linecap="round" stroke-linejoin="round"'
        . ($titulo !== ''
            ? ' role="img" aria-label="' . h('Estrutura do plano: ' . $titulo) . '">'
            : ' aria-hidden="true" focusable="false">')
        . $d . '</svg>';
}

/* ------------------------------------------------------------------ */
/* A capa REAL — baixada uma vez, guardada aqui                         */
/* ------------------------------------------------------------------ */

/**
 * O arquivo da capa baixada, ou `null`.
 *
 * Fica em `dados/imagens`, que é a pasta que o painel já usa para imagem: ela
 * está fora do Git, fora do build e tem `.htaccess` desligando o PHP dentro
 * dela. Um deploy não apaga o que foi baixado, e o repositório não carrega
 * frame de vídeo de terceiro.
 */
function capa_guardada(string $chave): ?string
{
    $arquivo = PASTA_IMAGENS . '/oficina-' . $chave . '.jpg';
    return is_file($arquivo) ? URL_IMAGENS . '/oficina-' . $chave . '.jpg' : null;
}

/** O link do reel de um formato, quando ele tem. É de lá que sai a capa. */
function reel_do_formato(string $chave): ?string
{
    require_once __DIR__ . '/oficina-catalogo.php';
    foreach (FORMATOS_OFICINA[$chave]['links'] ?? [] as $link) {
        if (str_contains($link['url'], 'instagram.com')) {
            return $link['url'];
        }
    }
    return null;
}

/** Os formatos que TÊM reel e ainda NÃO têm capa baixada. */
function capas_faltando(): array
{
    require_once __DIR__ . '/oficina-catalogo.php';
    $faltam = [];
    foreach (array_keys(FORMATOS_OFICINA) as $chave) {
        if (reel_do_formato($chave) !== null && capa_guardada($chave) === null) {
            $faltam[] = $chave;
        }
    }
    return $faltam;
}

/** Quantos formatos podem ter capa real, no total. */
function capas_possiveis(): int
{
    require_once __DIR__ . '/oficina-catalogo.php';
    $quantos = 0;
    foreach (array_keys(FORMATOS_OFICINA) as $chave) {
        if (reel_do_formato($chave) !== null) {
            $quantos++;
        }
    }
    return $quantos;
}

/** Um GET simples, com prazo curto. Devolve o corpo ou `null`. */
function buscar_url(string $url, int $segundos = 8): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 4,
            CURLOPT_TIMEOUT        => $segundos,
            CURLOPT_CONNECTTIMEOUT => 5,
            /* O agente de robô social é o que faz o Instagram devolver a
               página com `og:image` em vez do aplicativo inteiro. É o mesmo
               caminho que o WhatsApp percorre para montar a prévia de um link
               — nada de login, nada de API. */
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; PainelMissaoCeara/1.0; +https://felipesmoreira.com)',
        ]);
        $corpo = curl_exec($ch);
        $codigo = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        /* Sem `curl_close()`: desde o PHP 8.0 a conexão é objeto e o coletor de
           lixo a fecha sozinho; desde o 8.5 a chamada é depreciada e escreve
           aviso no log a cada capa baixada — o mesmo motivo que tirou o
           `imagedestroy()` de `agenda-comum.php`. */
        return ($corpo !== false && $codigo === 200) ? (string) $corpo : null;
    }
    if (!ini_get('allow_url_fopen')) {
        return null;
    }
    $contexto = stream_context_create(['http' => [
        'timeout' => $segundos,
        'header'  => "User-Agent: Mozilla/5.0 (compatible; PainelMissaoCeara/1.0)\r\n",
    ]]);
    $corpo = @file_get_contents($url, false, $contexto);
    return $corpo === false ? null : $corpo;
}

/** O `og:image` de uma página, já com as entidades desfeitas. */
function og_image_de(string $html): ?string
{
    if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m) !== 1
        && preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/i', $html, $m) !== 1) {
        return null;
    }
    $url = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return str_starts_with($url, 'https://') ? $url : null;
}

/**
 * Baixa a capa de um formato e guarda como JPG.
 *
 * O QUE CHEGA É VALIDADO PELO CONTEÚDO, e não pela extensão ou pelo
 * `Content-Type` — mesma régua de `guardar_imagem()`: o que manda é o que
 * `getimagesize()` reconhece. E é sempre reescrito como JPG pelo GD quando ele
 * existe, o que descarta qualquer coisa pendurada dentro do arquivo.
 */
function baixar_capa(string $chave): bool
{
    $reel = reel_do_formato($chave);
    if ($reel === null) {
        return false;
    }
    $html = buscar_url($reel);
    if ($html === null) {
        return false;
    }
    $imagem = og_image_de($html);
    if ($imagem === null) {
        return false;
    }
    $bytes = buscar_url($imagem, 12);
    if ($bytes === null || strlen($bytes) < 1024) {
        return false;
    }

    preparar_pastas();
    $temp = PASTA_IMAGENS . '/.capa-' . bin2hex(random_bytes(6)) . '.tmp';
    if (@file_put_contents($temp, $bytes) === false) {
        return false;
    }
    $info = @getimagesize($temp);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
        @unlink($temp);
        return false;
    }

    $destino = PASTA_IMAGENS . '/oficina-' . $chave . '.jpg';
    if (function_exists('imagecreatetruecolor')) {
        require_once __DIR__ . '/agenda-comum.php';  // criar_imagem()
        $origem = criar_imagem($temp, $info[2]);
        if ($origem) {
            $gravou = @imagejpeg($origem, $destino, 80);
            @unlink($temp);
            if ($gravou) {
                @chmod($destino, 0644);
                return true;
            }
            return false;
        }
    }
    /* Sem GD: a imagem já passou pelo `getimagesize()` e a pasta não roda PHP. */
    $ok = @rename($temp, $destino);
    @unlink($temp);
    if ($ok) {
        @chmod($destino, 0644);
    }
    return $ok;
}

/**
 * Baixa até `$teto` capas que faltam, e devolve o que aconteceu.
 *
 * EM LOTE PEQUENO, e não as dezesseis de uma vez: cada capa são duas idas à
 * rede (a página e a imagem), e uma requisição que faz trinta e duas estoura o
 * tempo de execução de hospedagem compartilhada bem antes de terminar — e aí
 * não se baixa nenhuma. Seis por clique cabem folgado, e o recado diz quantas
 * faltam para quem quiser clicar de novo.
 */
function baixar_capas(int $teto = 6): array
{
    $faltavam = capas_faltando();
    $baixadas = $falharam = 0;
    foreach (array_slice($faltavam, 0, $teto) as $chave) {
        if (baixar_capa($chave)) {
            $baixadas++;
        } else {
            $falharam++;
        }
    }
    return [
        'baixadas' => $baixadas,
        'falharam' => $falharam,
        'faltam'   => count(capas_faltando()),
    ];
}
