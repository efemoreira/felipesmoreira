<?php
declare(strict_types=1);

/**
 * Exportar — felipesmoreira.com/painel/exportar.php?o=…
 *
 * Só GET, só CSV, e só três coisas (`exportar-comum.php`). A rota não tem
 * tela: é o destino dos botões "Baixar CSV" das telas de Pessoas, do encontro
 * aberto e do Caixa. É dado pessoal saindo do sistema, e por isso a porta é
 * a capacidade, não a área.
 */

require_once __DIR__ . '/exportar-comum.php';

exigir_login();
if (!tem_capacidade('coordenacao')) {
    header('Location: /painel/?negado=exportar', true, 302);
    exit;
}

$o = (string) ($_GET['o'] ?? '');
$hoje = date('Y-m-d');

switch ($o) {
    case 'pessoas':
        $nome = "pessoas-$hoje.csv";
        $corpo = csv_de_pessoas($_GET);
        break;

    case 'pessoa':
        /* O dossiê de uma pessoa — só administração, como a ficha inteira. */
        if (!e_admin()) {
            header('Location: /painel/?negado=pessoas', true, 302);
            exit;
        }
        $id = limpar_texto($_GET['id'] ?? '', 40);
        $dossie = dossie_de_pessoa($id);
        if ($dossie === null) {
            http_response_code(404);
            header('Content-Type: text/plain; charset=utf-8');
            exit("Pessoa não encontrada.\n");
        }
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="dados-' . sem_acento(explode(' ', $dossie['ficha']['nome'])[0]) . "-$hoje.json\"");
        header('Cache-Control: no-store, private');
        echo json_encode($dossie, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;

    case 'presencas':
        if (!pode('eventos')) {
            header('Location: /painel/?negado=eventos', true, 302);
            exit;
        }
        $eventoId = limpar_texto($_GET['evento'] ?? '', 40);
        $nome = "presencas-$eventoId-$hoje.csv";
        $corpo = csv_de_presencas($eventoId);
        break;

    case 'caixa':
        if (!e_admin()) {
            header('Location: /painel/?negado=caixa', true, 302);
            exit;
        }
        require_once __DIR__ . '/caixa-comum.php';
        $conta = (string) ($_GET['conta'] ?? '');
        if (!isset(CONTAS_CAIXA[$conta])) {
            $conta = array_key_first(CONTAS_CAIXA);
        }
        $nome = "caixa-$conta-$hoje.csv";
        $corpo = csv_de_caixa($conta);
        break;

    default:
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        exit("Nada para exportar aqui. Use ?o=pessoas, ?o=presencas&evento=… ou ?o=caixa&conta=….\n");
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $nome . '"');
header('Cache-Control: no-store, private');
echo $corpo;
