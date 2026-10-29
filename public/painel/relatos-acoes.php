<?php
declare(strict_types=1);

/**
 * O POST de /painel/relatos. Uma ação só: decidir — o andamento, a resposta
 * para quem relatou e a nota interna. Relato não se apaga nem se edita: o que
 * a pessoa disse fica como ela disse, e é a isso que o protocolo dela responde.
 */

require_once __DIR__ . '/relatos-comum.php';
require_once __DIR__ . '/acoes-comum.php';

function voltar_relatos(string $aba, string $id = ''): never
{
    ir_para('/painel/relatos.php' . ($aba === 'ideias' ? '?aba=ideias' : '') . ($id !== '' ? '#r-' . $id : ''));
}

function tratar_acoes_de_relato(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    exigir_token_de_acao();
    $acao = (string) ($_POST['acao'] ?? '');
    $id = limpar_texto($_POST['id'] ?? '', 40);
    $relato = achar_relato($id);
    $aba = ($relato['tipo'] ?? '') === 'ideia' ? 'ideias' : 'relatos';

    if ($acao === 'decidir' && $relato !== null) {
        $andamento = (string) ($_POST['andamento'] ?? '');
        if (!isset(ANDAMENTO[$relato['tipo']][$andamento])) {
            avisar('erro', 'Escolha o andamento.');
            voltar_relatos($aba, $id);
        }
        $ok = decidir_relato($id, $andamento, limpar_texto($_POST['resposta'] ?? '', 2000),
            limpar_texto($_POST['nota'] ?? '', 1000), (string) ($eu['nome'] ?? ''));
        avisar($ok ? 'ok' : 'erro', $ok ? 'Guardado. O Paulo já responde com este andamento.' : 'Não consegui gravar.');
        voltar_relatos($aba, $id);
    }

    avisar('erro', 'Ação desconhecida.');
    voltar_relatos($aba);
}
