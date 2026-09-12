<?php
declare(strict_types=1);

/**
 * O lado POST de `/painel/` — entrar, sair, criar o primeiro administrador,
 * e as duas marcas de quem já está dentro ("já entrei no grupo", "já postei").
 *
 * Diferente das outras telas grandes, o login NÃO é POST-redirect-GET: o
 * erro de senha volta na mesma resposta, com o campo preenchido, porque
 * mandar a pessoa para outra página para dizer "senha errada" é o que faz
 * ela digitar tudo de novo. As duas marcas, sim, redirecionam.
 */

require_once __DIR__ . '/sessao.php';

/** Só aceita voltar para dentro do painel — nada de redirecionar para fora. */
function destino_pos_login(): string
{
    return caminho_interno_seguro($_GET['volta'] ?? '');
}

/**
 * Trata o POST, se houver. Devolve o aviso e o sucesso para a tela de login
 * desenhar; muda `$primeiroAcesso` quando o administrador acaba de ser criado.
 */
function tratar_acoes_do_inicio(bool &$primeiroAcesso): array
{
    $aviso = null;
    $sucesso = null;
    $acao = (string) ($_POST['acao'] ?? '');

    /* A pessoa diz que já entrou no grupo de trabalho. Não dá para conferir do
       nosso lado — o WhatsApp não conta isso —, e não é para conferir: a marca
       serve para o painel parar de cobrar, e quem mentir só engana a si mesmo. */
    /* A pessoa diz que postou a peça da semana. Também não dá para conferir — o
       Instagram não conta isso para a gente —, e vale a mesma razão do grupo: a
       marca serve para o painel parar de cobrar, e o número que sobra ("14 de 30
       postaram") é o retrato mais honesto que existe de quem está ativo. */
    if ($acao === 'postei-a-peca' && token_valido()) {
        require_once __DIR__ . '/kit-comum.php';
        $eu = usuario_atual();
        if ($eu !== null) {
            /* Só afirma — desmarcar é da coordenação, na Munição. A gravação é a
               mesma dos três pontinhos de lá: `registrar_postagem()`. */
            registrar_postagem($eu['id'], true);
        }
        header('Location: /painel/', true, 302);
        exit;
    }

    if ($acao === 'entrei-no-grupo' && token_valido()) {
        $eu = usuario_atual();
        if ($eu !== null) {
            $usuarios = ler_pessoas();
            foreach ($usuarios as &$linha) {
                if ($linha['id'] === $eu['id']) {
                    $linha['entrouNoGrupo'] = true;
                }
            }
            unset($linha);
            gravar_pessoas($usuarios);
        }
        header('Location: /painel/', true, 302);
        exit;
    }

    /** Só aceita voltar para dentro do painel — nada de redirecionar para fora. */
    if ($acao === 'criar_admin' && $primeiroAcesso) {
        $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
        $nome  = trim((string) ($_POST['nome'] ?? ''));
        $s1    = (string) ($_POST['senha'] ?? '');
        $s2    = (string) ($_POST['senha2'] ?? '');

        /* CSRF não cabe aqui — quem abre esta tela não tem sessão para proteger —,
           mas a origem cabe, e é a mesma conferência do formulário público: um POST
           montado em outro site não vira administrador do nosso. */
        if (!origem_confere()) {
            $aviso = 'Envio bloqueado.';
        } elseif ($erro = validar_nome_usuario($login)) {
            $aviso = $erro;
        } elseif ($nome === '') {
            $aviso = 'Diga o nome de quem vai usar esse login.';
        } elseif ($erro = validar_senha($s1)) {
            $aviso = $erro;
        } elseif ($s1 !== $s2) {
            $aviso = 'As duas senhas não são iguais.';
        } else {
            /* ACRESCENTA, e nunca substitui. Escrito como `gravar_pessoas([[…]])`,
               isto trocava o arquivo inteiro pelo administrador recém-criado — e o
               dia em que `ler_pessoas()` devolvesse vazio por falha de leitura, com
               o cadastro inteiro são no disco, criar o administrador apagaria todo
               mundo. O `is_file()` lá em cima já não deixa chegar aqui nesse caso;
               isto é a segunda tranca, para o custo de errar deixar de ser a base. */
            $ok = gravar_pessoas(array_merge(ler_pessoas(), [[
                'id'          => novo_id_pessoa(),
                'usuario'     => $login,
                'nome'        => mb_substr($nome, 0, 60),
                'hash'        => password_hash($s1, PASSWORD_DEFAULT),
                'capacidades' => ['adm'],
                'tipo'        => 'coordenador',
                'status'      => 'aprovada',
                'ativo'       => true,
                'trocarSenha' => false,
                'criadoEm'    => date('c'),
            ]]));
            if ($ok) {
                $primeiroAcesso = false;
                $sucesso = 'Administrador criado. Entre com o login “' . $login . '”.';
            } else {
                $aviso = 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.';
            }
        }
    } elseif ($acao === 'entrar' && !$primeiroAcesso) {
        $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
        $senha = (string) ($_POST['senha'] ?? '');

        /* Login OU e-mail, na mesma caixa: ninguém decora o usuário que a
           coordenação escolheu por ele, e todo mundo sabe o próprio e-mail. */
        $u = $login !== '' ? pessoa_por_login($login) : null;

        /* O teto de tentativas conta por CONTA, e não pelo texto digitado. Com duas
           grafias que abrem a mesma porta — o login e o e-mail —, contar por texto
           daria o dobro de tentativas para quem quisesse forçá-la. Quando não há
           conta a que chegar, o próprio texto é a chave: é tudo que existe. */
        $chaveTeto = $u !== null ? $u['usuario'] : $login;

        if ($login === '') {
            $aviso = 'Informe seu usuário ou e-mail.';
        } elseif ($ate = bloqueado_ate($chaveTeto)) {
            $aviso = 'Muitas tentativas nesse acesso. Tente de novo às ' . date('H:i', $ate) . '.';
        } else {
            // password_verify sempre roda, mesmo sem usuário: o tempo de resposta não
            // pode denunciar quais logins existem
            $hash = $u['hash'] ?? '$2y$10$invalidoinvalidoinvalidoinvalidoinvalidoinvalidoinvalidoinva';
            if (password_verify($senha, $hash) && $u !== null && $u['ativo']) {
                entrar_como($u);
                limpar_falhas($chaveTeto);
                header('Location: ' . destino_pos_login(), true, 302);
                exit;
            }
            registrar_falha($chaveTeto);
            /* "Desativado" só para quem PROVOU ser o dono da conta.
               Sem o `password_verify` nesta linha, a mensagem respondia a qualquer
               senha — e virava um jeito de perguntar ao painel quais logins e quais
               e-mails existem: o genérico diz "não existe ou errei a senha", este
               diz "existe". Quem sabe a senha já sabe que a conta existe, e para
               essa pessoa o recado específico é o que evita uma ligação. */
            $aviso = ($u !== null && !$u['ativo'] && password_verify($senha, $u['hash']))
                ? 'Esse acesso está desativado. Fale com o administrador.'
                : 'Usuário, e-mail ou senha incorretos.';
        }
    } elseif ($acao === 'sair') {
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    return ['aviso' => $aviso, 'sucesso' => $sucesso];
}
