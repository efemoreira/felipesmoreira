<?php
declare(strict_types=1);

/**
 * O cartão do link de presença — felipesmoreira.com/painel/api/presenca-previa.php
 *
 * O PROBLEMA QUE ELE RESOLVE: o site é exportado estático. Existe um
 * `presenca.html` só, o mesmo para todos os encontros, e qual encontro é sai do
 * `?e=`/`?c=` — que só o JavaScript lê. O robô que monta o cartão do link no
 * WhatsApp não roda JavaScript: ele lia as meta tags do layout raiz e a
 * mensagem saía anunciando "Candidato a Vice-Governador do Ceará" no lugar do
 * encontro para o qual a pessoa estava sendo chamada.
 *
 * Aqui o token vira consulta de verdade, e o cartão sai com o dia e o nome do
 * encontro. Duas mensagens, porque são dois links diferentes:
 *
 *   ?c=<token>  o link do grupo    → "Confirme sua presença — dia 24/08 | …"
 *   ?e=<token>  o QR da entrada    → "Check-in do encontro — dia 24/08 | …"
 *
 * SÓ O ROBÔ CHEGA AQUI. O desvio no .htaccess exige User-Agent de robô de
 * prévia; quem abre o link no celular recebe o arquivo estático direto, como
 * antes. É de propósito: a fila da porta não pode depender do PHP estar de pé.
 * Se um navegador escapar para cá mesmo assim, o script no fim da página o
 * devolve para a página de verdade — nunca para `/presenca`, que voltaria a
 * cair neste arquivo.
 *
 * Não grava nada e não pede nada: é GET, e a única coisa que sai daqui é o que
 * já está no cartão público do encontro na /programacao.
 */

require_once __DIR__ . '/../eventos-comum.php';

header('Content-Type: text/html; charset=utf-8');
/* Cache curto e público: a prévia é a mesma para todo mundo que recebeu o
   link, e cinco minutos bastam para o cartão acompanhar uma correção de
   horário feita no painel. */
header('Cache-Control: public, max-age=300');
header('X-Robots-Tag: noindex, nofollow');

/** O token pedido, e em que modo — os mesmos dois do api/presenca.php. */
function previa_pedida(): array
{
    $chegada = preg_replace('/[^a-f0-9]/', '', (string) ($_GET['e'] ?? '')) ?? '';
    if ($chegada !== '') {
        return ['evento' => evento_por_token($chegada), 'modo' => 'chegada', 'qs' => 'e=' . $chegada];
    }
    $confirma = preg_replace('/[^a-f0-9]/', '', (string) ($_GET['c'] ?? '')) ?? '';
    return ['evento' => evento_por_confirmacao($confirma), 'modo' => 'confirmacao', 'qs' => 'c=' . $confirma];
}

['evento' => $evento, 'modo' => $modo, 'qs' => $qs] = previa_pedida();

$confirmando = $modo === 'confirmacao';

/* Encontro cancelado responde como inexistente, igual ao api/presenca.php:
   ninguém deve ser convidado para algo que não vai acontecer. O cartão genérico
   é o que sobra — e a página de verdade já diz que o link não vale mais. */
if ($evento !== null && $evento['status'] === 'cancelado') {
    $evento = null;
}

if ($evento === null) {
    $titulo = $confirmando ? 'Confirme sua presença' : 'Check-in do encontro';
    $descricao = 'Este link não vale mais. Procure a coordenação da Missão Ceará.';
    $imagem = raiz_do_site() . '/opengraph-image';
} else {
    /* "dia 24/08": a data curta é a que a pessoa procura no meio da conversa do
       grupo. O dia da semana e a hora vão na linha de baixo, com o local —
       quem lê a prévia está decidindo se vai, e isso é o que decide. */
    $quando = $evento['data'] !== '' ? 'dia ' . $evento['data'] : 'sem data';
    $titulo = ($confirmando ? 'Confirme sua presença' : 'Check-in do encontro')
        . ' — ' . $quando . ' | ' . $evento['titulo'];

    $partes = $evento['inicio'] !== '' ? partes_de_exibicao($evento['inicio']) : ['dia' => '', 'data' => '', 'hora' => ''];
    $quandoLinha = trim(
        ($partes['dia'] !== '' ? $partes['dia'] . ', ' : '')
        . $evento['data']
        . ($evento['hora'] !== '' ? ' às ' . $evento['hora'] : ''),
        ' ,'
    );
    $onde = $evento['local'] !== '' ? ' — ' . $evento['local'] : '';
    $descricao = trim($quandoLinha . $onde, ' —') . '. '
        . ($confirmando
            ? 'Diga que você vai: são vinte segundos e ajuda a coordenação a preparar o espaço.'
            : 'Faça seu check-in na entrada: WhatsApp, nome, bairro e cidade.');

    /* A imagem do encontro quando ela existe — é ela que está no cartão da
       /programacao, e o cartão do WhatsApp tem de ser o mesmo objeto. Sem
       imagem, o cartão do site: melhor que retângulo cinza. */
    $imagem = $evento['imagem'] !== ''
        ? raiz_do_site() . $evento['imagem']
        : raiz_do_site() . '/opengraph-image';
}

$destino = raiz_do_site() . '/presenca?' . $qs;
/* O `.html` é o que quebra o laço: `/presenca?c=…` voltaria a bater nesta
   regra do .htaccess e a devolver este mesmo arquivo. O caminho com extensão é
   servido direto pela primeira regra, que só olha se o arquivo existe. */
$estatico = '/presenca.html?' . $qs;
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= h($titulo) ?></title>
<meta name="description" content="<?= h($descricao) ?>">
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Felipe Moreira">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="<?= h($destino) ?>">
<meta property="og:title" content="<?= h($titulo) ?>">
<meta property="og:description" content="<?= h($descricao) ?>">
<meta property="og:image" content="<?= h($imagem) ?>">
<meta property="og:image:alt" content="<?= h($titulo) ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= h($titulo) ?>">
<meta name="twitter:description" content="<?= h($descricao) ?>">
<meta name="twitter:image" content="<?= h($imagem) ?>">
</head>
<body>
<p><a href="<?= h($estatico) ?>"><?= h($titulo) ?></a></p>
<script>location.replace(<?= json_encode($estatico, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>);</script>
</body>
</html>
