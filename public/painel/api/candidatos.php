<?php
declare(strict_types=1);

/**
 * Os candidatos da chapa — felipesmoreira.com/painel/api/candidatos.php
 *
 * GET, sem login, pelas mesmas razões do api/kit.php: aqui **não há nada a
 * proteger**. Nome de urna, cargo, número e perfil público de candidato
 * registrado são informação pública por definição legal — trancar isso atrás de
 * sessão só impediria o eleitor de conferir o número antes de votar.
 *
 * O que ainda vale: só sai quem está com `publicado` marcado. `ordem` e
 * `criadoEm` são do painel e não descem — o site desenha, não administra.
 */

require_once __DIR__ . '/../candidatos-comum.php';

header('Content-Type: application/json; charset=utf-8');
/* Curto, e não `no-store`: a lista muda pouco e é pedida por muita gente ao
   mesmo tempo quando a colinha circula. */
header('Cache-Control: public, max-age=300');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'Método não aceito.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$publicados = candidatos_publicados();

/* Quem encabeça cada chapa, por cargo e número — é assim que o vice acha o
   titular: os dois dividem o número, e o cargo de um sai do cargo do outro. */
$titulares = [];
foreach ($publicados as $c) {
    if ($c['cargo'] !== '' && !cargo_de_vice($c['cargo'])) {
        $titulares[$c['cargo'] . '|' . $c['numero']] ??= $c['id'];
    }
}

$candidatos = [];
foreach ($publicados as $c) {
    $vice = $c['cargo'] !== '' && cargo_de_vice($c['cargo']);
    $candidatos[] = [
        'id'     => $c['id'],
        'nome'   => $c['urna'] !== '' ? $c['urna'] : $c['nome'],
        /* O RÓTULO para desenhar, e a CHAVE para agrupar: o site põe cada um na
           seção do cargo, mas o nome do cargo continua escrito só aqui. */
        'cargo'  => rotulo_cargo($c['cargo']),
        'chave'  => $c['cargo'],
        /* A seção onde ele aparece no site: a do cargo que encabeça. O vice
           de governador mora em "Governador", mesmo antes de o titular estar
           no ar — e a regra fica aqui, sem cópia em TypeScript. */
        'secao'  => cargo_titular($c['cargo']),
        /* Vice e suplente aparecem no site, embaixo de quem acompanham, mas
           nunca na colinha: o voto vai no número do titular. `titular` fica
           vazio quando quem encabeça ainda não está no ar. */
        'vice'    => $vice,
        'titular' => $vice ? ($titulares[cargo_titular($c['cargo']) . '|' . $c['numero']] ?? '') : '',
        'numero' => $c['numero'],
        'partido' => $c['partido'],
        'instagram' => $c['instagram'],
        'linkRedes' => $c['linkRedes'],
        'imagem' => $c['imagem'],
    ];
}

/* As listas descem junto: são elas que o site desenha, e pedi-las num segundo
   endpoint faria a página piscar duas vezes no 4G de quem abriu na fila. */
$listas = [];
foreach (listas_publicadas() as $l) {
    $listas[] = [
        'id'   => $l['id'],
        'nome' => $l['nome'],
        'descricao' => $l['descricao'],
        'candidatos' => $l['candidatos'],
        'naHome' => $l['naHome'],
    ];
}

echo json_encode(['candidatos' => $candidatos, 'listas' => $listas], JSON_UNESCAPED_UNICODE);
