<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com uma aula — o lado POST de `/painel/aulas`.
 *
 * É pouco, e é de propósito: o TEXTO da aula não se edita aqui. Ele é
 * versionado em `aulas-conteudo.php`, porque é a tradução do manual e muda por
 * decisão da coordenação, não no meio de uma terça-feira. O que se grava por
 * aqui é o vídeo pendurado em cada aula.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/aulas-comum.php';
require_once __DIR__ . '/acoes-comum.php';  // avisar(), ir_para(), exigir_token_de_acao()

/**
 * Para onde a ação volta — a ABA junto da âncora.
 *
 * Pendurar vídeo é trabalho da aba de conteúdo, e a âncora é o id da aula, que
 * só existe lá: sem a aba na URL, salvar um vídeo devolvia a pessoa para a aba
 * padrão e o navegador pousava no topo de uma tela que não tem aquele id.
 */
function voltar(string $ancora = ''): void
{
    ir_para('/painel/aulas.php?aba=conteudo' . ($ancora !== '' ? '#' . $ancora : ''));
}

/** Trata o POST desta tela, se houver um. Não volta quando de fato agiu. */
function tratar_acoes_de_aula(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }

    exigir_token_de_acao();

    $acao   = (string) ($_POST['acao'] ?? '');
    $aulaId = limpar_texto($_POST['aula'] ?? '', 60);
    $aula   = aula_por_id($aulaId);

    if ($aula === null) {
        avisar('erro', 'Essa aula não existe.');
        voltar();
    }

    if ($acao === 'texto') {
        require_once __DIR__ . '/aulas-texto.php';
        $blocos = is_array($_POST['blocos'] ?? null) ? $_POST['blocos'] : [];
        $originais = is_array($_POST['original'] ?? null) ? array_map('strval', $_POST['original']) : [];
        $quantos = salvar_texto_de_aula($aulaId, (string) ($_POST['resumo'] ?? ''), $blocos, $originais, $aula);
        avisar('ok', $quantos === 0
            ? 'Texto igual ao do código — nada a sobrescrever.'
            : "Texto salvo: {$quantos} trecho(s) por cima do código. Já vale em /aulas.");
        voltar($aulaId);
    }

    $videos = ler_videos();

    if ($acao === 'remover') {
        unset($videos[$aulaId]);
        if (!gravar_videos($videos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar($aulaId);
        }
        avisar('ok', 'Vídeo removido de “' . $aula['titulo'] . '”.');
        voltar($aulaId);
    }

    if ($acao === 'video') {
        $bruto = limpar_texto($_POST['link'] ?? '', 200);
        $id    = id_de_video($bruto);

        if ($id === '') {
            avisar('erro', 'Não reconheci esse link do YouTube. Cole o endereço da barra do navegador ou o link do botão Compartilhar.');
            voltar($aulaId);
        }

        $videos[$aulaId] = [
            'provedor'     => 'youtube',
            'id'           => $id,
            'publicada'    => !empty($_POST['publicada']),
            'atualizadoEm' => date('c'),
        ];

        if (!gravar_videos($videos)) {
            avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
            voltar($aulaId);
        }
        avisar('ok', 'Vídeo salvo em “' . $aula['titulo'] . '”.');
        voltar($aulaId);
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}
