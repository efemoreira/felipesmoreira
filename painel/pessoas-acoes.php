<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com uma pessoa — o lado POST de `/painel/pessoas`.
 *
 * Saiu do `pessoas.php` pelo mesmo motivo do `eventos-acoes.php`: é a tela com
 * telefone, e-mail e endereço de todo mundo, e nela a gravação não pode dividir
 * arquivo com o desenho. Aqui não há uma linha de HTML.
 *
 * Nada aqui é reversível de graça: juntar duas fichas apaga o histórico de uma
 * delas, e dar conta cria um login que a pessoa vai decorar. É por isso que a
 * fusão só acontece com dois ids escolhidos a dedo por um humano, e nunca por
 * inferência.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/pessoas-comum.php';

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $qs = ''): void
{
    header('Location: /painel/pessoas.php' . $qs, true, 302);
    exit;
}

/** As áreas marcadas à mão — o ajuste fino por cima das capacidades. */
function areas_do_post(): array
{
    $pedidas = is_array($_POST['areas'] ?? null) ? $_POST['areas'] : [];
    return array_values(array_intersect(array_keys(AREAS), $pedidas));
}

function capacidades_do_post(): array
{
    $pedidas = is_array($_POST['capacidades'] ?? null) ? $_POST['capacidades'] : [];
    return array_values(array_intersect(array_keys(CAPACIDADES), $pedidas));
}

/** Trata o POST desta tela, se houver um. Não volta quando de fato agiu. */
function tratar_acoes_de_pessoa(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if (!token_valido()) {
            avisar('erro', 'Sessão expirada. Entre de novo.');
            derrubar_sessao();
            header('Location: /painel/', true, 302);
            exit;
        }

        $acao = (string) ($_POST['acao'] ?? '');
        $alvo = achar_pessoa(limpar_texto($_POST['id'] ?? '', 40));

        /* ---------- cadastrar ou alterar ---------- */
        if ($acao === 'salvar') {
            $novo = $alvo === null;
            $ficha = $alvo ?? [
                'id' => novo_id_pessoa(),
                'criadoEm' => date('c'),
            ];

            $ficha['nome']   = $_POST['nome'] ?? ($ficha['nome'] ?? '');
            $ficha['tipo']   = $_POST['tipo'] ?? 'eleitor';
            $ficha['telefone'] = $_POST['telefone'] ?? '';
            $ficha['email']  = $_POST['email'] ?? '';
            $ficha['cidade'] = $_POST['cidade'] ?? '';
            $ficha['bairro'] = $_POST['bairro'] ?? '';
            $ficha['observacao'] = $_POST['observacao'] ?? '';
            $ficha['funcoes'] = (array) ($_POST['funcoes'] ?? []);
            $ficha['capacidades'] = capacidades_do_post();
            /* As áreas do formulário são só o ajuste fino: normalizar_pessoa()
               acrescenta por cima o que as capacidades já liberam. */
            $ficha['areas'] = areas_do_post();

            if (normalizar_pessoa($ficha) === null) {
                avisar('erro', 'O nome é o mínimo — sem ele não dá para chamar ninguém de nada.');
                voltar();
            }

            /* Tirar a administração do último que administra tranca todo mundo para
               fora de criar contas e mexer em permissão. */
            if ($alvo !== null && in_array('adm', $alvo['capacidades'], true)
                && !in_array('adm', $ficha['capacidades'], true)
                && !tem_admin_ativo($alvo['id'])) {
                avisar('erro', 'Este é o único administrador ativo. Dê a administração a outra pessoa antes de tirar a dele.');
                voltar('?p=' . $alvo['id']);
            }

            $pessoas = [];
            $achou = false;
            foreach (ler_pessoas() as $p) {
                if ($p['id'] === $ficha['id']) {
                    $achou = true;
                    $pessoas[] = $ficha;
                    continue;
                }
                $pessoas[] = $p;
            }
            if (!$achou) {
                $pessoas[] = $ficha;
            }

            if (!gravar_pessoas($pessoas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar();
            }
            avisar('ok', $novo ? 'Cadastrada.' : 'Alterada.');
            voltar('?p=' . $ficha['id']);
        }

        if ($alvo === null) {
            avisar('erro', 'Pessoa não encontrada.');
            voltar();
        }

        /* ---------- dar acesso ao painel ---------- */
        if ($acao === 'dar-conta') {
            if (tem_conta($alvo)) {
                avisar('erro', 'Essa pessoa já tem conta.');
                voltar('?p=' . $alvo['id']);
            }
            $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
            if ($erro = validar_nome_usuario($login)) {
                avisar('erro', $erro);
                voltar('?p=' . $alvo['id']);
            }
            if (pessoa_por_usuario($login) !== null) {
                avisar('erro', 'Esse login já está em uso.');
                voltar('?p=' . $alvo['id']);
            }

            $provisoria = senha_provisoria();
            $pessoas = ler_pessoas();
            foreach ($pessoas as &$p) {
                if ($p['id'] === $alvo['id']) {
                    $p['usuario'] = $login;
                    $p['hash'] = password_hash($provisoria, PASSWORD_DEFAULT);
                    $p['ativo'] = true;
                    /* Provisória de verdade: exigir_login() prende a pessoa em
                       conta.php até ela escolher a própria senha. */
                    $p['trocarSenha'] = true;
                    if ($p['status'] === 'pendente' || $p['status'] === '') {
                        $p['status'] = 'aprovada';
                    }
                }
            }
            unset($p);

            if (!gravar_pessoas($pessoas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar('?p=' . $alvo['id']);
            }
            $_SESSION['senha_nova'] = ['id' => $alvo['id'], 'usuario' => $login, 'senha' => $provisoria];
            avisar('ok', 'Conta criada.');
            voltar('?p=' . $alvo['id']);
        }

        /* ---------- resetar senha ---------- */
        if ($acao === 'resetar') {
            $provisoria = senha_provisoria();
            $pessoas = ler_pessoas();
            foreach ($pessoas as &$p) {
                if ($p['id'] === $alvo['id'] && tem_conta($p)) {
                    $p['hash'] = password_hash($provisoria, PASSWORD_DEFAULT);
                    $p['trocarSenha'] = true;
                }
            }
            unset($p);
            if (!gravar_pessoas($pessoas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar('?p=' . $alvo['id']);
            }
            $_SESSION['senha_nova'] = ['id' => $alvo['id'], 'usuario' => $alvo['usuario'], 'senha' => $provisoria];
            avisar('ok', 'Senha trocada.');
            voltar('?p=' . $alvo['id']);
        }

        /* ---------- ativar / desativar a conta ---------- */
        if ($acao === 'ativar') {
            if ($alvo['ativo'] && !tem_admin_ativo($alvo['id']) && in_array('adm', $alvo['capacidades'], true)) {
                avisar('erro', 'Este é o único administrador ativo — desativá-lo tranca todo mundo para fora.');
                voltar('?p=' . $alvo['id']);
            }
            $pessoas = ler_pessoas();
            foreach ($pessoas as &$p) {
                if ($p['id'] === $alvo['id']) {
                    $p['ativo'] = !$p['ativo'];
                }
            }
            unset($p);
            gravar_pessoas($pessoas);
            avisar('ok', $alvo['ativo'] ? 'Conta desativada. A pessoa continua na lista.' : 'Conta reativada.');
            voltar('?p=' . $alvo['id']);
        }

        /* ---------- juntar duplicata ---------- */
        if ($acao === 'juntar') {
            $sumir = limpar_texto($_POST['sumir'] ?? '', 40);
            if (juntar_pessoas($alvo['id'], $sumir)) {
                avisar('ok', 'Fichas juntadas. As presenças em encontro vieram junto.');
            } else {
                avisar('erro', 'Não deu para juntar. Duas contas de painel nunca se fundem — apague uma antes, na mão.');
            }
            voltar('?p=' . $alvo['id']);
        }

        /* ---------- apagar ---------- */
        if ($acao === 'apagar') {
            if (in_array('adm', $alvo['capacidades'], true) && !tem_admin_ativo($alvo['id'])) {
                avisar('erro', 'Não dá para apagar o único administrador ativo.');
                voltar('?p=' . $alvo['id']);
            }
            $restantes = array_values(array_filter(ler_pessoas(), fn ($p) => $p['id'] !== $alvo['id']));
            if (!gravar_pessoas($restantes)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar('?p=' . $alvo['id']);
            }
            /* As presenças dela vão junto: presença de quem não existe mais é linha
               que só atrapalha a contagem do encontro. */
            gravar_presencas(array_values(array_filter(ler_presencas(), fn ($l) => $l['pessoaId'] !== $alvo['id'])));
            avisar('ok', $alvo['nome'] . ' foi apagada, e as presenças dela junto.');
            voltar();
        }

        avisar('erro', 'Ação desconhecida.');
        voltar();
    }
}
