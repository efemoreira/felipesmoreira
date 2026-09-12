<?php
declare(strict_types=1);

/**
 * O que o painel FAZ na Munição — o lado POST de `/painel/municao`.
 *
 * Duas famílias de ação, duas abas:
 *
 *   kit-nova · kit-salvar · kit-publicar · kit-apagar   → a aba Peças
 *   mutirao-peca · mutirao-postou                        → a aba Mutirão
 *
 * REGRA QUE NÃO SE NEGOCIA: peça sem fonte não é aceita. É a Parte 0 do manual
 * aplicada à ferramenta — a peça circula muito mais longe que um post, e sem a
 * página do plano ninguém consegue conferir o número que está espalhando.
 *
 * O `id` da peça NÃO é regerado quando o número muda: ele vira o nome do PNG
 * que o militante já baixou e o `?peca=` do link que já circula no grupo.
 * Corrigir um dígito da frase não pode transformar a peça numa peça diferente.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/acoes-comum.php';  // avisar(), ir_para(), exigir_token_de_acao()
require_once __DIR__ . '/kit-comum.php';

/** Volta para a aba de onde a ação saiu. A âncora é o `<fieldset>` daquela aba. */
function voltar(string $aba = 'pecas', string $ancora = ''): void
{
    ir_para('/painel/municao.php?aba=' . $aba . ($ancora !== '' ? '#' . $ancora : ''));
}

/** Os campos que a tela pergunta, já limpos. Um lugar só para criar e editar. */
function campos_da_peca(): array
{
    return [
        'tema'    => $_POST['tema'] ?? '',
        'numero'  => $_POST['numero'] ?? '',
        'frase'   => $_POST['frase'] ?? '',
        'fonte'   => $_POST['fonte'] ?? '',
        'legenda' => $_POST['legenda'] ?? '',
        'destino' => $_POST['destino'] ?? '',
    ];
}

/** Trata o POST desta tela, se houver um. Não volta quando de fato agiu. */
function tratar_acoes_de_municao(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    exigir_token_de_acao();

    $acao = (string) ($_POST['acao'] ?? '');

    if (in_array($acao, ['kit-nova', 'kit-salvar', 'kit-publicar', 'kit-apagar'], true)) {
        acao_de_peca($acao, $eu);
    }
    if (in_array($acao, ['mutirao-peca', 'mutirao-postou'], true)) {
        acao_de_mutirao($acao);
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ---- as peças ---- */
function acao_de_peca(string $acao, array $eu): void
{
    $pecas = ler_pecas();

    if ($acao === 'kit-nova') {
        $nova = campos_da_peca() + [
            'id'        => normalizar_id_peca($_POST['numero'] ?? '') . '-' . substr(bin2hex(random_bytes(2)), 0, 4),
            'publicada' => false,
            'criadaEm'  => date('c'),
            'criadaPor' => (string) ($eu['nome'] ?? ''),
        ];
        if (normalizar_peca($nova) === null) {
            avisar('erro', 'A peça precisa de número, frase e fonte — sem fonte ela não entra.');
            voltar('pecas');
        }
        $pecas[] = $nova;
        avisar('ok', 'Peça criada. Publique quando quiser que ela apareça na Munição.');
    } else {
        $id = normalizar_id_peca($_POST['id'] ?? '');
        $achou = false;
        foreach ($pecas as $i => $pc) {
            if ($pc['id'] !== $id) {
                continue;
            }
            $achou = true;
            if ($acao === 'kit-apagar') {
                unset($pecas[$i]);
                avisar('ok', 'Peça apagada.');
            } elseif ($acao === 'kit-salvar') {
                $editada = campos_da_peca() + [
                    'id'        => $pc['id'],
                    'publicada' => $pc['publicada'],
                    'criadaEm'  => $pc['criadaEm'],
                    'criadaPor' => $pc['criadaPor'],
                ];
                if (normalizar_peca($editada) === null) {
                    avisar('erro', 'A peça precisa de número, frase e fonte — sem fonte ela não entra.');
                    voltar('pecas');
                }
                $pecas[$i] = $editada;
                /* Peça no ar que muda de texto muda no site na mesma hora: o
                   `api/kit.php` lê o arquivo a cada chamada. É por isso que o
                   aviso lembra disso — corrigir errado é publicar errado. */
                avisar('ok', $pc['publicada']
                    ? 'Peça corrigida. Ela está no ar, então a correção já vale na Munição.'
                    : 'Peça corrigida.');
            } else {
                $pecas[$i]['publicada'] = !$pc['publicada'];
                avisar('ok', $pecas[$i]['publicada'] ? 'Peça no ar.' : 'Peça recolhida.');
            }
            break;
        }
        if (!$achou) {
            avisar('erro', 'Peça não encontrada.');
            voltar('pecas');
        }
    }

    if (!gravar_pecas(array_values($pecas))) {
        avisar('erro', 'Não consegui gravar as peças.');
    }
    voltar('pecas');
}

/* ---- o mutirão da semana ---- */
function acao_de_mutirao(string $acao): void
{
    if ($acao === 'mutirao-postou') {
        /* Alterna: a coordenação corrige nos dois sentidos. O botão do Início
           chama a mesma função, só que fixando "postou" — ver index.php. */
        $erro = registrar_postagem(limpar_texto($_POST['quem'] ?? '', 40));
        avisar($erro === null ? 'ok' : 'erro', $erro ?? 'Anotado.');
        voltar('mutirao', 'mutirao');
    }

    $mutirao = ler_mutirao();
    $semana  = chave_da_semana();
    $linha   = $mutirao[$semana] ?? ['peca' => '', 'escalados' => []];

    $pedida = limpar_texto($_POST['peca'] ?? '', 40);
    $existe = false;
    foreach (ler_pecas() as $pc) {
        $existe = $existe || ($pc['id'] === $pedida && $pc['publicada']);
    }
    if ($pedida !== '' && !$existe) {
        avisar('erro', 'Essa peça não está no ar. Publique antes de escalar o mutirão.');
        voltar('mutirao', 'mutirao');
    }
    $linha['peca'] = $pedida;

    /* ESCALA TODO MUNDO QUE TEM CONTA ATIVA, e não uma lista escolhida a dedo.
       A peça já vem pronta e não depende de ninguém a montante: não há por que
       peneirar quem pode postar. Quem não quiser, não posta — e isso aparece,
       que é o ponto. */
    $escalados = [];
    foreach (ler_pessoas() as $pessoa) {
        if ($pessoa['ativo'] && tem_conta($pessoa)) {
            /* Quem já postou nesta semana continua postado: trocar a peça no
               meio da semana não pode apagar trabalho feito. */
            $escalados[$pessoa['id']] = $linha['escalados'][$pessoa['id']] ?? 'escalado';
        }
    }
    $linha['escalados'] = $escalados;
    $mutirao[$semana] = $linha;

    if (!gravar_mutirao($mutirao)) {
        avisar('erro', 'Não consegui gravar o mutirão.');
    } else {
        avisar('ok', $pedida === ''
            ? 'Semana sem peça. Ninguém vai ser cobrado.'
            : 'Peça da semana definida para ' . count($escalados) . ' pessoas.');
    }
    voltar('mutirao', 'mutirao');
}
