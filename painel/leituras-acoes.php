<?php
declare(strict_types=1);

/**
 * O único POST de Leituras: as metas.
 *
 * Leituras não grava dado do movimento — `testes/acoes/leituras.test.ts`
 * prova que o GET não toca arquivo nenhum. A meta não é dado do movimento: é
 * a régua com que a coordenação lê o dado. Por isso mora aqui, e só ela.
 */

require_once __DIR__ . '/acoes-comum.php';
require_once __DIR__ . '/metas-comum.php';

function voltar(): void
{
    ir_para('/painel/leituras.php?aba=semana#metas');
}

function tratar_acoes_de_leituras(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    exigir_token_de_acao();
    $acao = (string) ($_POST['acao'] ?? '');
    $metas = ler_metas();

    if ($acao === 'meta-salvar') {
        $nova = normalizar_meta([
            'id'       => 'meta-' . bin2hex(random_bytes(4)),
            'medida'   => $_POST['medida'] ?? '',
            'alvo'     => $_POST['alvo'] ?? 0,
            'ate'      => $_POST['ate'] ?? '',
            'desde'    => date('Y-m-d'),
            'criadoEm' => date('c'),
            'criadoPor' => quem_grava(),
        ]);
        if ($nova === null) {
            avisar('erro', 'Meta precisa de medida, número maior que zero e data.');
            voltar();
        }
        $metas[] = $nova;
        avisar(gravar_metas($metas) ? 'ok' : 'erro', 'Meta combinada: ' . MEDIDAS_DE_META[$nova['medida']] . ' — ' . $nova['alvo'] . ' até ' . data_humana($nova['ate']) . '.');
        voltar();
    }

    if ($acao === 'meta-apagar') {
        $id = limpar_texto($_POST['id'] ?? '', 40);
        $restantes = array_values(array_filter($metas, fn ($m) => $m['id'] !== $id));
        avisar(gravar_metas($restantes) ? 'ok' : 'erro', 'Meta apagada.');
        voltar();
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}
