<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com uma inscrição — o lado POST de `/painel/inscricoes`.
 *
 * Saiu do `inscricoes.php` pelo mesmo motivo das outras seis telas: aqui a
 * decisão não pode dividir arquivo com o desenho. Neste arquivo não há uma
 * linha de HTML.
 *
 * As duas ações são de mão única. **Aprovar dá conta à ficha que já existe** —
 * não cria uma segunda: antes a inscrição virava um usuário novo e a inscrição
 * ficava para trás, então a mesma pessoa passava a existir duas vezes e o
 * histórico de encontros dela ficava preso na ficha antiga. **Recusar não
 * apaga ninguém**, porque a pessoa pode ter aparecido num encontro e apagar
 * levaria a presença junto.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/inscricoes-comum.php';
require_once __DIR__ . '/pessoas-comum.php';  // a fila é gente com status pendente

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(): void
{
    header('Location: /painel/inscricoes.php', true, 302);
    exit;
}

/**
 * Trata o POST desta tela, se houver um.
 *
 * Volta em silêncio quando o método é GET — é o caso da imensa maioria das
 * visitas, e sair por cima evita o `if` gigante no arquivo de rota.
 */
function tratar_acoes_de_inscricao(array $eu): void
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

        if ($alvo === null) {
            avisar('erro', 'Pessoa não encontrada — talvez alguém já tenha decidido.');
            voltar();
        }
        if ($alvo['status'] !== 'pendente') {
            avisar('erro', 'Essa inscrição já foi decidida.');
            voltar();
        }

        $pessoas = ler_pessoas();

        if ($acao === 'aprovar') {
            $login = mb_strtolower(trim((string) ($_POST['usuario'] ?? '')));
            $capacidades = array_values(array_intersect(
                array_keys(CAPACIDADES),
                is_array($_POST['capacidades'] ?? null) ? $_POST['capacidades'] : []
            ));
            $areas = array_values(array_intersect(
                array_keys(AREAS),
                is_array($_POST['areas'] ?? null) ? $_POST['areas'] : []
            ));

            if ($erro = validar_nome_usuario($login)) {
                avisar('erro', $erro);
                voltar();
            }
            if (pessoa_por_usuario($login) !== null) {
                avisar('erro', 'Já existe alguém com o login “' . $login . '”. Escolha outro.');
                voltar();
            }

            /* Aprovar NÃO cria uma segunda ficha: dá conta à que já existe. Antes a
               inscrição virava um usuário novo e a inscrição ficava para trás, então
               a mesma pessoa passava a existir duas vezes — e o histórico de
               encontros dela ficava preso na ficha antiga. */
            $provisoria = senha_provisoria();
            foreach ($pessoas as &$p) {
                if ($p['id'] !== $alvo['id']) {
                    continue;
                }
                $p['usuario'] = $login;
                $p['hash']    = password_hash($provisoria, PASSWORD_DEFAULT);
                $p['ativo']   = true;
                $p['trocarSenha'] = true;
                $p['capacidades'] = $capacidades;
                $p['areas']   = $areas;
                $p['status']  = 'aprovada';
                $p['tipo']    = (in_array('coordenacao', $capacidades, true)
                    || in_array('adm', $capacidades, true)) ? 'coordenador' : 'militante';
                $p['decididoEm']  = date('c');
                $p['decididoPor'] = $eu['nome'];
                /* Inscrição sem função é válida (o formulário deixou de exigir).
                   "onde-precisar" existe no catálogo exatamente para isso — deixar
                   o array vazio faria o hub não ter atalho nenhum para a pessoa. */
                if ($p['funcoes'] === []) {
                    $p['funcoes'] = ['onde-precisar'];
                }
            }
            unset($p);

            if (!gravar_pessoas($pessoas)) {
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões no hPanel.');
                voltar();
            }

            // some da sessão assim que for mostrada uma vez
            $_SESSION['acesso_novo'] = [
                'nome'     => $alvo['nome'],
                'usuario'  => $login,
                'senha'    => $provisoria,
                'telefone' => $alvo['telefone'],
            ];
            avisar('ok', 'Acesso criado para ' . $alvo['nome'] . '.');
            voltar();
        }

        if ($acao === 'recusar') {
            foreach ($pessoas as &$p) {
                if ($p['id'] === $alvo['id']) {
                    $p['status'] = 'recusada';
                    $p['decididoEm'] = date('c');
                    $p['decididoPor'] = $eu['nome'];
                }
            }
            unset($p);
            /* A pessoa NÃO é apagada: ela pode ter aparecido num encontro, e apagar
               levaria a presença junto. Fica com status "recusada", fora da fila. */
            if (gravar_pessoas($pessoas)) {
                avisar('ok', 'Inscrição de ' . $alvo['nome'] . ' recusada. Ela continua na lista de pessoas.');
            } else {
                avisar('erro', 'Não consegui gravar a decisão.');
            }
            voltar();
        }

        avisar('erro', 'Ação desconhecida.');
        voltar();
    }
}
