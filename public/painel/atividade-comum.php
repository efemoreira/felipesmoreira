<?php
declare(strict_types=1);

/**
 * A LINHA DO TEMPO do movimento — o que andou acontecendo, e quem fez.
 *
 * NÃO EXISTE ARQUIVO DE LOG, e é de propósito. A alternativa óbvia seria um
 * `dados/atividade.php` escrito a cada ação, e ela tem dois defeitos que este
 * projeto já pagou noutros lugares: vira uma SEGUNDA fonte de verdade sobre o
 * que aconteceu (que diverge no dia em que alguém acrescenta uma ação e esquece
 * de registrar), e faz toda gravação escrever em dois arquivos numa hospedagem
 * compartilhada.
 *
 * Aqui a linha do tempo é DERIVADA dos carimbos que já existem: `criadoEm` da
 * pessoa, do encontro, da presença, do fato e do card; `checadoEm` do fato;
 * `publicadoEm` e o `historico` do card. Ela não pode divergir da realidade
 * porque ela **é** a realidade, lida por outro ângulo — a mesma escolha de
 * "presença é relação, não cópia".
 *
 * O QUE ELA NÃO MOSTRA, e é honesto dizer: correção. Editar o telefone de
 * alguém não deixa carimbo, então não aparece. Um log mostraria — e mentiria
 * na primeira ação nova que ninguém lembrasse de registrar.
 *
 * PERMISSÃO: mesma regra de `agora.php`. Cada bloco dentro de um `pode()`, com
 * o `require_once` do `*-comum.php` DENTRO do `if`.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/agenda-comum.php';  // dias_ate_o_dia(), o relógio no fuso do Ceará

/** Quantas linhas a timeline do hub mostra. */
const TETO_ATIVIDADE = 12;

/**
 * O que aconteceu, do mais recente para o mais antigo.
 *
 * `$pessoaId` recorta para uma pessoa só — é a "visão 360" da ficha dela, e
 * responde de uma vez as perguntas que hoje exigem abrir quatro telas: em que
 * encontros esteve, que fatos trouxe, que cards são dela, quando entrou.
 *
 * Cada linha é:
 *   quando  — ISO, para ordenar e para mostrar
 *   area    — a chave em AREAS, para o ícone e para agrupar
 *   texto   — a frase, começando pelo que aconteceu
 *   quem    — o nome de quem fez, ou '' quando a própria linha já diz
 *   url     — para onde ir ver aquilo
 */
function linha_do_tempo(?string $pessoaId = null, int $teto = TETO_ATIVIDADE): array
{
    $linhas = [];
    $por = fn (?string $id) => $pessoaId === null || $id === $pessoaId;

    /* ---------- quem entrou no movimento ---------- */
    if (pode('pessoas')) {
        foreach (ler_pessoas() as $p) {
            if (!$por($p['id'])) {
                continue;
            }
            if ($p['criadoEm'] !== '') {
                $linhas[] = [
                    'quando' => $p['criadoEm'],
                    'area'   => 'pessoas',
                    'texto'  => $p['nome'] . ' entrou no cadastro'
                        . ($p['origem'] !== '' ? ' (por ' . $p['origem'] . ')' : ''),
                    'quem'   => '',
                    'url'    => '/painel/pessoas.php?p=' . rawurlencode($p['id']),
                ];
            }
            if ($p['decididoEm'] !== '' && $p['status'] !== 'pendente') {
                $linhas[] = [
                    'quando' => $p['decididoEm'],
                    'area'   => 'inscricoes',
                    'texto'  => $p['nome'] . ' foi ' . ($p['status'] === 'aprovada' ? 'aprovada' : 'recusada'),
                    'quem'   => $p['decididoPor'],
                    'url'    => '/painel/pessoas.php?p=' . rawurlencode($p['id']),
                ];
            }
        }
    }

    /* ---------- encontros e quem apareceu neles ---------- */
    if (pode('eventos')) {
        require_once __DIR__ . '/eventos-comum.php';

        $eventos = [];
        foreach (ler_eventos() as $e) {
            $eventos[$e['id']] = $e;
            /* Marcar um encontro é ação de coordenação e não tem id de autor —
               só o nome. Por isso ele nunca entra no recorte por pessoa: casar
               por nome escrito à mão poria a linha na ficha do homônimo. */
            if ($pessoaId === null && $e['criadoEm'] !== '') {
                $linhas[] = [
                    'quando' => $e['criadoEm'],
                    'area'   => 'eventos',
                    'texto'  => 'Marcou o encontro “' . $e['titulo'] . '”',
                    'quem'   => $e['criadoPor'],
                    'url'    => '/painel/eventos.php?e=' . rawurlencode($e['id']),
                ];
            }
        }

        /* O nome INTEIRO só para quem já podia ler o cadastro; para o resto, o
           primeiro nome e a inicial. Sem isto a linha do tempo era uma segunda
           porta para /painel/pessoas: uma linha por presença, e o nome completo
           de todo mundo que já leu um QR, para qualquer conta com `eventos`. */
        $inteiro = pode('pessoas') || tem_capacidade('coordenacao');
        $quem = [];
        foreach (ler_pessoas() as $p) {
            $quem[$p['id']] = $inteiro ? $p['nome'] : nome_encoberto($p['nome']);
        }
        foreach (ler_presencas() as $l) {
            $e = $eventos[$l['eventoId']] ?? null;
            if ($e === null || !$por($l['pessoaId']) || $l['criadoEm'] === '') {
                continue;
            }
            $linhas[] = [
                'quando' => $l['criadoEm'],
                'area'   => 'eventos',
                'texto'  => ($quem[$l['pessoaId']] ?? 'Alguém')
                    . ' entrou na lista de “' . $e['titulo'] . '”'
                    /* Quem leu o QR se cadastrou sozinho; quem foi digitado
                       passou pela mesa. A diferença conta na hora de saber se a
                       Recepção está funcionando. */
                    . ($l['origem'] === 'qr' ? ' pelo QR' : ''),
                'quem'   => '',
                'url'    => '/painel/eventos.php?e=' . rawurlencode($e['id']) . '&aba=pessoas',
            ];
        }
    }

    /* ---------- fatos: quem trouxe e quem checou ---------- */
    if (pode('fatos')) {
        require_once __DIR__ . '/fatos-comum.php';
        foreach (ler_fatos() as $f) {
            if ($por($f['autorId']) && $f['criadoEm'] !== '') {
                $linhas[] = [
                    'quando' => $f['criadoEm'],
                    'area'   => 'fatos',
                    'texto'  => 'Trouxe o fato “' . $f['oQue'] . '”',
                    'quem'   => $f['autorNome'],
                    'url'    => '/painel/fatos.php#' . rawurlencode($f['id']),
                ];
            }
            /* A checagem não guarda id, só o nome de quem checou — mesma
               limitação do `criadoPor` do encontro, e mesma consequência: fora
               do recorte por pessoa. */
            if ($pessoaId === null && $f['checadoEm'] !== '') {
                $linhas[] = [
                    'quando' => $f['checadoEm'],
                    'area'   => 'fatos',
                    'texto'  => (STATUS_FATO[$f['status']] ?? $f['status']) . ': “' . $f['oQue'] . '”',
                    'quem'   => $f['checadoPor'],
                    'url'    => '/painel/fatos.php#' . rawurlencode($f['id']),
                ];
            }
        }
    }

    /* ---------- o quadro: o card e o que andou com ele ---------- */
    if (pode('producao')) {
        require_once __DIR__ . '/producao-comum.php';
        foreach (ler_cards() as $c) {
            if ($por($c['donoId'])) {
                if ($c['publicadoEm'] !== '') {
                    $linhas[] = [
                        'quando' => $c['publicadoEm'],
                        'area'   => 'producao',
                        'texto'  => 'Publicou “' . $c['titulo'] . '”',
                        'quem'   => $c['donoNome'],
                        'url'    => '/painel/producao.php#' . rawurlencode($c['id']),
                    ];
                } elseif ($c['criadoEm'] !== '') {
                    $linhas[] = [
                        'quando' => $c['criadoEm'],
                        'area'   => 'producao',
                        'texto'  => 'Abriu o card “' . $c['titulo'] . '”',
                        'quem'   => $c['donoNome'],
                        'url'    => '/painel/producao.php#' . rawurlencode($c['id']),
                    ];
                }
            }
            /* O card já guarda o próprio histórico — é o único lugar do painel
               que registra o passo a passo, e seria desperdício não usá-lo. */
            if ($pessoaId === null) {
                foreach ($c['historico'] as $h) {
                    if ($h['quando'] === '') {
                        continue;
                    }
                    $linhas[] = [
                        'quando' => $h['quando'],
                        'area'   => 'producao',
                        'texto'  => $h['texto'] . ' — “' . $c['titulo'] . '”',
                        'quem'   => $h['quem'],
                        'url'    => '/painel/producao.php#' . rawurlencode($c['id']),
                    ];
                }
            }
        }
    }

    /* ---------- peças da Munição ---------- */
    if (pode('municao') && $pessoaId === null) {
        require_once __DIR__ . '/kit-comum.php';
        foreach (ler_pecas() as $p) {
            if ($p['criadaEm'] === '') {
                continue;
            }
            $linhas[] = [
                'quando' => $p['criadaEm'],
                'area'   => 'municao',
                'texto'  => 'Criou a peça ' . $p['numero'],
                'quem'   => '',
                'url'    => '/painel/municao.php',
            ];
        }
    }

    /* `criadoEm` é ISO, então comparar como texto já ordena por tempo — e o que
       não tem data legível cai para o fim, que é onde ele pertence. */
    usort($linhas, fn ($a, $b) => strcmp($b['quando'], $a['quando']));

    return array_slice($linhas, 0, $teto);
}

/**
 * "há 2 h" · "ontem" · "12/08" — quanto tempo faz, do jeito que se fala.
 *
 * Data cheia só depois de uma semana: dentro dela o que a pessoa quer saber é a
 * distância ("foi ontem"), e não o dia do calendário. Fuso do Ceará, como todo
 * o resto — a Hostinger roda em UTC.
 */
function ha_quanto_tempo(string $iso): string
{
    $t = strtotime($iso);
    if ($t === false) {
        return '';
    }
    $seg = time() - $t;

    if ($seg < 60) {
        return 'agora';
    }
    if ($seg < 3600) {
        $m = (int) floor($seg / 60);
        return "há {$m} min";
    }
    if ($seg < 86400) {
        $h = (int) floor($seg / 3600);
        return 'há ' . $h . ' h';
    }
    $dias = dias_ate_o_dia($iso);
    if ($dias !== null && $dias >= -1) {
        return 'ontem';
    }
    if ($dias !== null && $dias > -7) {
        return 'há ' . abs($dias) . ' dias';
    }
    try {
        return (new DateTimeImmutable($iso))
            ->setTimezone(new DateTimeZone('America/Fortaleza'))
            ->format('d/m');
    } catch (Exception $e) {
        return '';
    }
}
