<?php
declare(strict_types=1);

/**
 * O POST de quem responde pela unidade. Quatro ações, e só elas: registrar o
 * que foi feito, marcar a próxima (vira encontro), pôr ou tirar alguém, e
 * combinar uma tarefa. Ficha, nível e o site continuam com a coordenação.
 */

require_once __DIR__ . '/minha-unidade-comum.php';
require_once __DIR__ . '/tarefas-comum.php';
require_once __DIR__ . '/acoes-comum.php';

function voltar_unidade(array $unidade): never
{
    ir_para('/painel/minha-unidade.php?u=' . rawurlencode($unidade['id']));
}

function tratar_acoes_da_unidade(array $eu, array $unidade): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    exigir_token_de_acao();
    $tipo = tipo_da_unidade($unidade);
    $acao = (string) ($_POST['acao'] ?? '');

    if ($acao === 'entrega') {
        $texto = limpar_texto($_POST['texto'] ?? '', 200);
        $data = data_iso_ou_vazio($_POST['data'] ?? '');
        if ($texto === '' || $data === '' || $data > hoje_ce()) {
            avisar('erro', 'Diga o que foi feito e quando — de hoje para trás.');
            voltar_unidade($unidade);
        }
        $ok = adicionar_entrega($tipo, $unidade['id'], $data, $texto, (int) ($_POST['pessoas'] ?? 0), (string) $eu['id']);
        avisar($ok ? 'ok' : 'erro', $ok ? 'Registrado.' : 'Não consegui gravar.');
        voltar_unidade($unidade);
    }

    if ($acao === 'proxima') {
        $dia = data_iso_ou_vazio($_POST['dia'] ?? '');
        if ($dia === '' || $dia < hoje_ce()) {
            avisar('erro', 'Diga o dia da próxima atividade — de hoje em diante.');
            voltar_unidade($unidade);
        }
        $id = criar_encontro_da_unidade($unidade, $dia, (string) ($_POST['hora'] ?? ''),
            limpar_texto($_POST['titulo'] ?? '', 120), limpar_texto($_POST['local'] ?? '', 120));
        avisar($id !== '' ? 'ok' : 'erro', $id !== '' ? 'Marcado. Já está na agenda' . ($unidade['publicado'] ? ' do site.' : '.') : 'Não consegui gravar.');
        voltar_unidade($unidade);
    }

    if ($acao === 'membro') {
        $pessoa = achar_pessoa(limpar_texto($_POST['pessoaId'] ?? '', 40));
        if ($pessoa === null) {
            avisar('erro', 'Pessoa não encontrada.');
            voltar_unidade($unidade);
        }
        $dentro = ($_POST['dentro'] ?? '1') !== '0';
        $ok = pertencer($pessoa['id'], $unidade['id'], $dentro);
        avisar($ok ? 'ok' : 'erro', !$ok ? 'Não consegui gravar.'
            : nome_encoberto($pessoa['nome']) . ($dentro ? ' agora faz parte.' : ' saiu da unidade.'));
        voltar_unidade($unidade);
    }

    if ($acao === 'tarefa-nova') {
        $titulo = limpar_texto($_POST['titulo'] ?? '', 140);
        $dono = limpar_texto($_POST['donoId'] ?? '', 40);
        $podeSer = array_merge(array_column(membros_da_unidade($unidade['id']), 'id'), [$unidade['responsavelId'], $unidade['substitutoId']]);
        if ($titulo === '' || $dono === '' || !in_array($dono, $podeSer, true)) {
            avisar('erro', 'Diga o quê e com quem — alguém que faz parte da unidade.');
            voltar_unidade($unidade);
        }
        $tarefas = ler_tarefas();
        $tarefas[] = [
            'id' => bin2hex(random_bytes(8)), 'titulo' => $titulo, 'donoId' => $dono,
            'ate' => limpar_texto($_POST['ate'] ?? '', 10), 'unidadeId' => $unidade['id'],
            'criadoEm' => date('c'), 'criadoPor' => (string) ($eu['nome'] ?? ''),
        ];
        $ok = gravar_tarefas($tarefas);
        avisar($ok ? 'ok' : 'erro', $ok ? 'Combinado. Aparece no Início de quem vai fazer.' : 'Não consegui gravar.');
        voltar_unidade($unidade);
    }

    if ($acao === 'tarefa-feita') {
        $id = limpar_texto($_POST['id'] ?? '', 40);
        $tarefas = ler_tarefas();
        foreach ($tarefas as &$t) {
            if ($t['id'] === $id && $t['unidadeId'] === $unidade['id'] && $t['feitaEm'] === '') {
                $t['feitaEm'] = date('c');
                $t['feitaPor'] = (string) ($eu['nome'] ?? '');
            }
        }
        unset($t);
        gravar_tarefas($tarefas);
        avisar('ok', 'Feita.');
        voltar_unidade($unidade);
    }

    avisar('erro', 'Ação desconhecida.');
    voltar_unidade($unidade);
}
