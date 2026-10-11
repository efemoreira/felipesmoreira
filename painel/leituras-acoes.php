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

    if ($acao === 'decisoes-salvar') {
        require_once __DIR__ . '/decisoes-comum.php';
        $mes = limpar_texto($_POST['mes'] ?? '', 7);
        $prioridades = array_map(fn ($p) => (string) $p, (array) ($_POST['prioridades'] ?? []));
        $texto = limpar_texto($_POST['decisoes'] ?? '', 1200);
        if (preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $mes) !== 1 || (array_filter($prioridades, fn ($p) => trim($p) !== '') === [] && $texto === '')) {
            avisar('erro', 'Diga o mês e pelo menos uma prioridade ou decisão.');
            ir_para('/painel/leituras.php#decisoes');
        }
        $todas = array_values(array_filter(ler_decisoes(), fn ($d) => $d['mes'] !== $mes));
        $antes = decisao_do_mes($mes);
        $todas[] = ['mes' => $mes, 'prioridades' => $prioridades, 'decisoes' => $texto,
                    'em' => $antes['em'] ?? date('c'), 'por' => $antes['por'] ?? quem_grava()];
        avisar(gravar_decisoes($todas) ? 'ok' : 'erro', 'Decisões de ' . $mes . ' registradas.');
        ir_para('/painel/leituras.php#decisoes');
    }

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
