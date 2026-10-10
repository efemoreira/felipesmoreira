<?php
declare(strict_types=1);

/**
 * A organização pública — felipesmoreira.com/painel/api/organizacao.php
 *
 * GET, sem login: alimenta /nucleos, /temas e /portavozes. Só leitura, cache
 * curto, como `api/candidatos.php` e `api/kit.php`.
 *
 * O QUE NÃO DESCE, e é o motivo de este arquivo escolher campo a campo em vez
 * de devolver a ficha: nome de responsável, de substituto ou de quem registrou
 * entrega; texto das entregas; evidência de nível; quem criou e quando. O
 * plano é explícito — "nenhuma lista de participantes ou contato pessoal em
 * página pública". O contato que desce é o link que a coordenação marcou como
 * público (grupo, canal), nunca um telefone.
 *
 * O porta-voz é a exceção que confirma a regra: ele é público por função, e o
 * `publicado` da ficha é a autorização dele. Mesmo assim descem só nome
 * público, tema, lugar, nível e os @ — seguidores e placar ficam no painel.
 */

require_once __DIR__ . '/../organizacao-comum.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'Método não aceito.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$hoje = hoje_ce();
/* A próxima atividade só desce se ainda vai acontecer: a página pública
   mostra o que vem, como a /programacao. */
$proxima = fn (array $u) => $u['proximaData'] !== '' && $u['proximaData'] >= $hoje
    ? ['data' => $u['proximaData'], 'texto' => $u['proximaTexto']]
    : null;

$nucleos = [];
$nomeNucleo = [];
foreach (ler_nucleos() as $n) {
    if (!$n['publicado'] || $n['encerradoEm'] !== '') {
        continue;
    }
    $nomeNucleo[$n['id']] = $n['nome'];
    $nucleos[] = [
        'id'      => $n['id'],
        'nome'    => $n['nome'],
        'tipo'    => $n['tipo'],
        'cidade'  => $n['cidade'],
        'bairro'  => $n['bairro'],
        'onda'    => $n['onda'],
        'nivel'   => $n['nivel'],
        'ritmo'   => RITMOS[$n['ritmo']],
        'ativo'   => unidade_ativa($n),
        'contato' => $n['contato'],
        'proxima' => $proxima($n),
    ];
}

$liga = [];
$nomePv = [];
foreach (ler_liga() as $pv) {
    if (!$pv['publicado'] || $pv['encerradoEm'] !== '') {
        continue;
    }
    $nomePv[$pv['id']] = $pv['nome'];
    $liga[] = [
        'id'     => $pv['id'],
        'nome'   => $pv['nome'],
        'tema'   => $pv['tema'],
        'cidade' => $pv['cidade'],
        'bairro' => $pv['bairro'],
        'nivel'  => nivel_liga($pv)['nivel'],
        'perfis' => array_filter($pv['perfis']),
    ];
}

$temas = [];
foreach (ler_grupos() as $g) {
    if (!$g['publicado'] || $g['encerradoEm'] !== '') {
        continue;
    }
    $temas[] = [
        'id'         => $g['id'],
        'tema'       => $g['tema'],
        'finalidade' => $g['finalidade'],
        'maturidade' => $g['maturidade'],
        'ritmo'      => RITMOS[$g['ritmo']],
        'ativo'      => unidade_ativa($g),
        'portas'     => [
            'estudo'        => $g['portaEstudo'] ?: TEMAS_GRUPO[$g['tema']]['estudo'],
            'profissionais' => $g['portaProfissionais'] ?: TEMAS_GRUPO[$g['tema']]['profissionais'],
            'movimento'     => $g['portaMovimento'] ?: TEMAS_GRUPO[$g['tema']]['movimento'],
        ],
        /* Só os núcleos e o porta-voz que TAMBÉM estão publicados: um núcleo
           escondido não aparece pelo grupo. */
        'nucleos'  => array_values(array_filter(array_map(fn ($id) => $nomeNucleo[$id] ?? null, $g['nucleos']))),
        'portaVoz' => $nomePv[$g['portaVozId']] ?? '',
        'contato'  => $g['contato'],
        'proxima'  => $proxima($g),
    ];
}

echo json_encode(['nucleos' => $nucleos, 'temas' => $temas, 'portavozes' => $liga], JSON_UNESCAPED_UNICODE);
