<?php
declare(strict_types=1);

/** O lado POST do caixa: lançar e apagar. Nenhuma linha de HTML aqui. */

require_once __DIR__ . '/caixa-comum.php';
require_once __DIR__ . '/sessao.php';

function avisar_caixa(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar_caixa(): void
{
    header('Location: /painel/caixa.php', true, 302);
    exit;
}

function tratar_acoes_de_caixa(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    if (!token_valido()) {
        avisar_caixa('erro', 'Sessão expirada. Entre de novo.');
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    $acao = (string) ($_POST['acao'] ?? '');
    $lancamentos = ler_caixa();

    if ($acao === 'lancar') {
        $centavos = centavos_de((string) ($_POST['valor'] ?? ''));
        if ($centavos <= 0) {
            avisar_caixa('erro', 'Diga o valor — "12,50" ou "1.234,56", como for mais fácil.');
            voltar_caixa();
        }
        $descricao = limpar_texto($_POST['descricao'] ?? '', 120);
        if ($descricao === '') {
            avisar_caixa('erro', 'Escreva do que se trata. Lançamento sem descrição não se confere depois.');
            voltar_caixa();
        }

        /* O SINAL VEM DO BOTÃO, e o valor é sempre digitado positivo: pedir que
           alguém digite "-40" é pedir um erro. Saída vira negativo aqui. */
        $saiu = ($_POST['sentido'] ?? 'entrou') === 'saiu';

        $lancamentos[] = [
            'id'        => bin2hex(random_bytes(8)),
            'centavos'  => $saiu ? -$centavos : $centavos,
            'conta'     => (string) ($_POST['conta'] ?? 'movimento'),
            'origem'    => (string) ($_POST['origem'] ?? 'outro'),
            'descricao' => $descricao,
            /* A data do FATO, e não a do registro: quem lança na segunda o que
               gastou no sábado precisa que a conta do encontro feche. */
            'data'      => limpar_texto($_POST['data'] ?? date('Y-m-d'), 10),
            'eventoId'  => limpar_texto($_POST['eventoId'] ?? '', 40),
            'criadoEm'  => date('c'),
            'criadoPor' => (string) ($eu['nome'] ?? ''),
        ];

        if (!gravar_caixa($lancamentos)) {
            avisar_caixa('erro', 'Não consegui gravar em /dados.');
            voltar_caixa();
        }
        avisar_caixa('ok', 'Lançado: ' . reais($saiu ? -$centavos : $centavos) . '.');
        voltar_caixa();
    }

    if ($acao === 'apagar') {
        $id = limpar_texto($_POST['id'] ?? '', 40);
        $restantes = array_values(array_filter($lancamentos, fn ($l) => $l['id'] !== $id));
        if (count($restantes) === count($lancamentos)) {
            avisar_caixa('erro', 'Lançamento não encontrado.');
            voltar_caixa();
        }
        if (!gravar_caixa($restantes)) {
            avisar_caixa('erro', 'Não consegui gravar em /dados.');
            voltar_caixa();
        }
        /* Apaga de verdade, e não marca como cancelado: um caixa que guarda o
           errado ao lado do certo é um caixa que soma duas vezes na primeira
           distração. Corrigir é apagar e lançar de novo. */
        avisar_caixa('ok', 'Lançamento apagado.');
        voltar_caixa();
    }

    avisar_caixa('erro', 'Ação desconhecida.');
    voltar_caixa();
}
