<?php
declare(strict_types=1);

/**
 * A organização pública — felipesmoreira.com/painel/api/organizacao.php
 *
 * GET, sem login: alimenta /nucleos, /temas e /portavozes. Só leitura, cache
 * curto, como `api/candidatos.php` e `api/kit.php`.
 *
 * `temResponsavel` desce só como sim/não: o Paulo (WhatsApp) só convida para
 * unidade que tem quem receba, e para isso não precisa saber quem é.
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

/* A próxima atividade só desce se ainda vai acontecer: a página pública
   mostra o que vem, como a /programacao. */
$proxima = function (array $u): ?array {
    $p = proxima_efetiva($u);
    /* O id do encontro desce para o site virar link para a atividade
       (/programacao#a-<id>), e só quando o encontro está na agenda pública. */
    if ($p === null) {
        return null;
    }
    $publico = $p['eventoId'] !== '' && (proximos_encontros_das_unidades()[$u['id']]['naAgenda'] ?? false);
    return ['data' => $p['data'], 'texto' => $p['texto'], 'atividade' => $publico ? $p['eventoId'] : ''];
};

/* Sim ou não, nunca o id: quem responde não desce (ver o topo). */
$temResponsavel = fn (array $u): bool => $u['responsavelId'] !== '';

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
        'temResponsavel' => $temResponsavel($n),
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
        'destaque' => $pv['destaque'],
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
        'nome'       => TEMAS_GRUPO[$g['tema']]['nome'],
        'finalidade' => $g['finalidade'],
        'maturidade' => $g['maturidade'],
        'ritmo'      => RITMOS[$g['ritmo']],
        'ativo'      => unidade_ativa($g),
        'temResponsavel' => $temResponsavel($g),
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

/* RECONHECIMENTO MENSAL — o mês que passou: os três primeiros de cada nível
   do placar (só quem está publicado) e os núcleos publicados que registraram
   entrega. SÓ NOMES, nunca pontos: "avaliações individuais nunca públicas". */
$mesPassado = (new DateTimeImmutable(hoje_ce()))->modify('first day of last month')->format('Y-m');
$destaques = [];
foreach (placar_da_liga(ler_liga(), $mesPassado) as $linhas) {
    foreach (array_slice($linhas, 0, 3) as $l) {
        if ($l['pv']['publicado']) {
            $destaques[] = $l['pv']['nome'];
        }
    }
}
$entregaram = [];
foreach (ler_nucleos() as $n) {
    if ($n['publicado'] && $n['encerradoEm'] === ''
        && array_filter($n['entregas'], fn ($e) => substr($e['data'], 0, 7) === $mesPassado) !== []) {
        $entregaram[] = $n['nome'];
    }
}

echo json_encode([
    'nucleos' => $nucleos, 'temas' => $temas, 'portavozes' => $liga,
    'reconhecimento' => ['mes' => $mesPassado, 'portavozes' => $destaques, 'nucleos' => $entregaram],
    /* Os grupos culturais: só o publicado e aberto, sem nome de quem responde. */
    'cultura' => array_values(array_map(fn ($c) => [
        'id' => $c['id'], 'nome' => $c['nome'], 'eixo' => $c['eixo'], 'nivel' => $c['nivel'],
        'cidade' => $c['cidade'], 'bairro' => $c['bairro'], 'ritmo' => RITMOS[$c['ritmo']],
        'ativo' => unidade_ativa($c), 'temResponsavel' => $temResponsavel($c), 'contato' => $c['contato'], 'proxima' => $proxima($c),
    ], array_filter(ler_culturais(), fn ($c) => $c['publicado'] && $c['encerradoEm'] === ''))),
    /* A Biblioteca: só o publicado e não arquivado. */
    'biblioteca' => array_values(array_map(fn ($m) => [
        'id' => $m['id'], 'titulo' => $m['titulo'], 'tipo' => $m['tipo'], 'tipoNome' => TIPOS_MATERIAL[$m['tipo']],
        'tema' => $m['tema'], 'resumo' => $m['resumo'], 'link' => $m['link'],
    ], array_filter(ler_biblioteca(), fn ($m) => $m['publicado'] && $m['arquivadoEm'] === ''))),
], JSON_UNESCAPED_UNICODE);
