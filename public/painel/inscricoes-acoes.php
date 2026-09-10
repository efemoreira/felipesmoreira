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

require_once __DIR__ . '/acoes-comum.php';  // avisar(), ir_para(), exigir_token_de_acao() — e o sessao.php junto
require_once __DIR__ . '/inscricoes-comum.php';
require_once __DIR__ . '/pessoas-comum.php';  // a fila é gente com status pendente

function voltar(string $sufixo = ''): void
{
    /* O SUFIXO EXISTE PARA A ESCOLHA DO ENCONTRO SOBREVIVER AO POST. Convidar é
       trabalho de lote: marcar uma pessoa e voltar para a fila sem o `?e=`
       obrigaria a reescolher o encontro a cada nome, setenta e duas vezes. A
       âncora leva de volta ao cartão em que se estava. */
    ir_para('/painel/inscricoes.php' . $sufixo);
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
        exigir_token_de_acao();

        $acao = (string) ($_POST['acao'] ?? '');

        /* ---------- aprovar em lote ----------
           VEM ANTES DA BUSCA DO ALVO porque não tem alvo: são muitos. Setenta e
           duas pessoas esperando, a mais antiga há dezesseis dias, e cada
           aprovação custava abrir um `<details>`, conferir login, submeter e
           recarregar a página. Setenta e duas recargas é o trabalho que não
           acontece — e quem espera demais não volta.

           SEM CAPACIDADE NENHUMA, de propósito: é o que a própria tela já
           recomenda para o caso comum. Quem precisa de permissão continua sendo
           decidido um a um, no formulário que já existe. */
        if ($acao === 'aprovar-lote') {
            $ids = is_array($_POST['ids'] ?? null) ? $_POST['ids'] : [];
            /* Só quem de fato pode liderar: um id colado à mão apontaria a
               ficha para alguém que nunca vai vê-la, e o campo pareceria
               resolvido sem ninguém do outro lado. */
            $lider = limpar_texto($_POST['lider'] ?? '', 40);
            if ($lider !== '' && !in_array($lider, array_column(possiveis_lideres(), 'id'), true)) {
                $lider = '';
            }
            $pessoas = ler_pessoas();
            $acessos = [];
            $logins = [];
            $pulados = 0;

            foreach ($ids as $bruto) {
                $id = limpar_texto($bruto, 40);
                $p = achar_pessoa($id);
                /* Uma ficha já decidida no meio do lote não derruba as outras:
                   duas pessoas mexendo na fila ao mesmo tempo é o normal, e
                   abortar tudo faria a segunda perder o trabalho da primeira. */
                if ($p === null || $p['status'] !== 'pendente') {
                    $pulados++;
                    continue;
                }
                $login = login_livre($p['nome'], $logins);
                $logins[] = $login;
                if ($acesso = aprovar_pessoa($pessoas, $id, $login, [], areas_sugeridas($p['funcoes']), $eu, $lider)) {
                    $acessos[] = $acesso;
                }
            }

            if ($acessos === []) {
                avisar('erro', 'Não marquei ninguém para aprovar.');
                voltar('?aba=fila');
            }
            /* UMA GRAVAÇÃO SÓ no fim: escrever o arquivo é o custo, e trinta
               escritas seriam trinta chances de duas ficarem pela metade. */
            if (!gravar_pessoas($pessoas)) {
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões no hPanel.');
                voltar('?aba=fila');
            }

            $_SESSION['acessos_novos'] = $acessos;
            avisar('ok', count($acessos) . (count($acessos) === 1 ? ' acesso criado.' : ' acessos criados.')
                . ($pulados > 0 ? ' ' . $pulados . ' já tinham sido decididas.' : '')
                . ' Mande agora — as senhas não aparecem de novo.');
            voltar('?aba=fila');
        }

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

            $acesso = aprovar_pessoa($pessoas, $alvo['id'], $login, $capacidades, $areas, $eu);

            if (!gravar_pessoas($pessoas)) {
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões no hPanel.');
                voltar();
            }

            // some da sessão assim que for mostrada uma vez
            $_SESSION['acessos_novos'] = [$acesso];
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

        /* ---------- marcar que já convidei para um encontro ---------- */
        if ($acao === 'convidar') {
            require_once __DIR__ . '/eventos-comum.php';

            $evento = achar_evento(limpar_texto($_POST['evento'] ?? '', 40));
            if ($evento === null) {
                avisar('erro', 'Encontro não encontrado — talvez alguém o tenha apagado.');
                voltar();
            }

            /* ESTA AÇÃO NÃO ABRE O WHATSAPP, e isso é de propósito.
               Abrir exigiria redirecionar para um `wa.me` montado aqui — um
               link só —, e o link só é justamente o que não abre para quem tem
               a conta na outra grafia do nono dígito. Quem desenha o par é
               `links_whatsapp()`, na tela, e `testes/contrato/whatsapp.test.ts`
               prende essa regra.

               Então a divisão é: a tela manda a mensagem (em aba nova, com as
               duas grafias) e esta ação guarda que a pessoa já foi chamada. São
               dois cliques na mesma página, e o segundo é o que faz a segunda
               rodada de convites não repetir nem pular ninguém. */
            $eventos = ler_eventos();
            $ja = false;
            foreach ($eventos as &$e) {
                if ($e['id'] !== $evento['id']) {
                    continue;
                }
                $ja = in_array($alvo['id'], $e['convidados'], true);
                if ($ja) {
                    /* Clicar de novo desmarca: convidei por engano, ou a pessoa
                       pediu para não ser chamada. Sem o caminho de volta, o
                       número da legenda vira mentira e ninguém confia nele. */
                    $e['convidados'] = array_values(array_diff($e['convidados'], [$alvo['id']]));
                } else {
                    $e['convidados'][] = $alvo['id'];
                }
            }
            unset($e);

            if (!gravar_eventos($eventos)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar();
            }
            avisar('ok', $ja
                ? $alvo['nome'] . ' saiu da lista de convidadas.'
                : $alvo['nome'] . ' marcada como convidada.');
            voltar('?aba=fila&e=' . rawurlencode($evento['id']) . '#p-' . $alvo['id']);
        }

        avisar('erro', 'Ação desconhecida.');
        voltar();
    }
}
