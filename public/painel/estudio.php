<?php
declare(strict_types=1);

/**
 * Porteiro do Estúdio de Artes — felipesmoreira.com/painel/estudio
 *
 * O editor em si é uma página estática gerada pelo Next (estudio.html), que o
 * .htaccess da pasta impede de ser baixada direto. Quem serve o arquivo é este
 * script, e só depois de conferir a sessão e a permissão de área.
 *
 * Servir aqui, e não deixar o Apache entregar o arquivo, tem uma segunda
 * vantagem: a sessão já está aberta neste ponto, então dá para CARIMBAR duas
 * coisas no HTML antes de mandá-lo, sem uma ida à API e sem piscada:
 *
 *   1. o tema escolhido, como data-tema no <html> — igual ao que o layout.php
 *      faz nas outras telas;
 *   2. quem está logado, para a barra do Estúdio mostrar o nome e ter um botão
 *      de sair que funcione.
 */

require_once __DIR__ . '/sessao.php';
exigir_area('estudio');

$pagina = __DIR__ . '/estudio.html';
if (!is_file($pagina)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Estúdio ainda não publicado: falta o estudio.html do build.\n");
}

$html = (string) file_get_contents($pagina);
$eu   = usuario_atual();

/* O tema, antes de o navegador desenhar. O HTML do Next começa em
   <!DOCTYPE html><html lang="pt-BR">, e o limite 1 garante que o carimbo vai na
   tag de abertura e não em algum <html> que apareça dentro de um script. */
$tema = tema_atual();
if ($tema !== 'sistema') {
    $html = preg_replace('/<html\b/', '<html data-tema="' . h($tema) . '"', $html, 1) ?? $html;
}

/* Quem está logado. As flags HEX do json_encode são obrigatórias: o nome vem do
   cadastro, e um "</script>" dentro dele escaparia do bloco e viraria markup. */
$dados = json_encode(
    [
        'nome'  => $eu['nome'] ?? '',
        'papel' => rotulo_do_acesso($eu),
        'tema'  => $tema,
        // o Sair posta em /painel/ como qualquer outra tela: logout não é GET
        'csrf'  => token(),
    ],
    JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE
);
$html = str_replace(
    '</head>',
    '<script>window.__PAINEL__=' . $dados . ';</script></head>',
    $html
);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, private');
echo $html;
