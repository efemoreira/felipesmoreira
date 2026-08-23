<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com a capa da programação — o lado POST de
 * `/painel/agenda`.
 *
 * ESTA É A ÚNICA AÇÃO DO PAINEL QUE NÃO REDIRECIONA, e é de propósito. Todas as
 * outras terminam em POST-redirect-GET; aqui, quando a gravação falha, a tela
 * precisa devolver **o que a pessoa digitou** — a capa é texto corrido escrito à
 * mão, e mandar redigitar depois de um erro de permissão de pasta seria perder o
 * trabalho justamente no momento em que ele já estava pronto. Por isso
 * `tratar_acoes_de_agenda()` DEVOLVE estado em vez de sair.
 *
 * A importação do legado é a exceção dentro da exceção: ela redireciona, porque
 * roda uma vez na vida e não tem nada a devolver.
 */

require_once __DIR__ . '/agenda-comum.php';
require_once __DIR__ . '/eventos-comum.php';  // a importação cria encontros
require_once __DIR__ . '/sessao.php';


/**
 * A capa da programação, a partir do formulário.
 *
 * Só a capa: título, período, chamada e os canais. A LISTA vem dos encontros
 * (`itens_publicos()`), e não daqui — antes cada item era digitado nesta tela,
 * com data própria, enquanto o mesmo encontro era cadastrado de novo em
 * Encontros. Duas fichas para a mesma coisa é duas datas que divergem.
 */
function montar_agenda_do_post(array $post, array &$recados): array
{
    $canais = [];
    $marcados = is_array($post['canal'] ?? null) ? $post['canal'] : [];
    foreach (CANAIS_PADRAO as $canal) {
        if (in_array($canal['icone'], $marcados, true)) {
            $canais[] = $canal;
        }
    }

    return [
        'titulo'       => limpar_texto($post['titulo'] ?? '', 80) ?: 'Agenda da Semana',
        'periodo'      => limpar_texto($post['periodo'] ?? '', 80),
        'chamada'      => limpar_texto($post['chamada'] ?? '', 200),
        'disponivelEm' => $canais,
        'programacao'  => [],  // preenchida por quem chama, com itens_publicos()
        'atualizadoEm' => date('c'),
        'atualizadoPor' => (usuario_atual()['nome'] ?? ''),
    ];
}

/**
 * Trata o POST, se houver um.
 *
 * Devolve `['aviso' =>, 'sucesso' =>, 'rascunho' =>]`. O rascunho é o que foi
 * digitado e não conseguiu ser gravado: a tela o usa no lugar do arquivo, para
 * o trabalho não sumir junto com o erro.
 */
function tratar_acoes_de_agenda(): array
{
    $aviso = null;
    $sucesso = null;
    $recadoSessao = $_SESSION['recado'] ?? null;
    unset($_SESSION['recado']);
    if (($recadoSessao['tipo'] ?? '') === 'erro') {
        $aviso = $recadoSessao['texto'];
    } elseif (($recadoSessao['tipo'] ?? '') === 'ok') {
        $sucesso = $recadoSessao['texto'];
    }
    $acao = (string) ($_POST['acao'] ?? '');
    /* o que foi digitado, para devolver ao formulário quando a gravação falha */
    $rascunho = null;

    if ($acao === 'importar') {
        if (!token_valido()) {
            derrubar_sessao();
            header('Location: /painel/', true, 302);
            exit;
        }
        /* Traz para Encontros o que já estava no agenda.json e nunca teve encontro.
           Roda uma vez: cada importado leva `importadoDe` com o id antigo, e o
           botão só aparece enquanto sobrar alguma linha sem par. Os backups
           rotativos do publicar() cobrem o desfazer. */
        $eventos = ler_eventos();
        /* Conhecido = o id É de um encontro (item que esta tela gerou a partir dele),
           ou já foi importado por um. Olhar só para `importadoDe` reimportaria tudo
           na segunda vez: depois da primeira importação o agenda.json é regerado com
           os ids dos ENCONTROS, e nenhum `importadoDe` aponta para eles. */
        $jaVeio = [];
        foreach ($eventos as $e) {
            $jaVeio[$e['id']] = true;
            if (($e['importadoDe'] ?? '') !== '') {
                $jaVeio[$e['importadoDe']] = true;
            }
        }

        $quantos = 0;
        foreach (agenda_atual()['programacao'] ?? [] as $it) {
            $id = (string) ($it['id'] ?? '');
            if ($id === '' || isset($jaVeio[$id])) {
                continue;
            }
            $inicio = inicio_iso(substr((string) ($it['inicio'] ?? ''), 0, 16));
            $eventos[] = [
                'id'      => novo_id_evento(),
                'titulo'  => (string) ($it['titulo'] ?? 'Sem nome'),
                /* Com plataforma é transmissão; sem, é ato de rua. É o palpite certo
                   na maioria dos casos, e a coordenação corrige em dois cliques —
                   melhor que deixar tudo em "militância" e esconder da agenda. */
                'familia' => ($it['plataforma'] ?? '') !== '' ? 'digital' : 'publico',
                'inicio'  => $inicio,
                'data'    => (string) ($it['data'] ?? ''),
                'hora'    => (string) ($it['hora'] ?? ''),
                'subtitulo'  => (string) ($it['subtitulo'] ?? ''),
                'cor'        => (string) ($it['cor'] ?? 'ouro'),
                'plataforma' => (string) ($it['plataforma'] ?? ''),
                'aoVivo'     => !empty($it['aoVivo']),
                'link'       => (string) ($it['link'] ?? ''),
                'imagem'     => (string) ($it['imagem'] ?? ''),
                'naAgenda'   => true,
                'status'  => estado_do_evento($inicio) === 'passado' ? 'realizado' : 'planejado',
                'token'   => bin2hex(random_bytes(10)),
                'tokenConfirmacao' => bin2hex(random_bytes(10)),
                'importadoDe' => $id,
                'criadoEm'  => date('c'),
                'criadoPor' => (usuario_atual()['nome'] ?? ''),
            ];
            $quantos++;
        }

        if ($quantos > 0 && gravar_eventos($eventos)) {
            republicar_agenda();
            $_SESSION['recado'] = ['tipo' => 'ok', 'texto' => $quantos . ' item(ns) viraram encontros. Confira a família de cada um.'];
        } elseif ($quantos === 0) {
            $_SESSION['recado'] = ['tipo' => 'ok', 'texto' => 'Nada a importar — tudo que estava na agenda já tem encontro.'];
        } else {
            $_SESSION['recado'] = ['tipo' => 'erro', 'texto' => 'Não consegui gravar em /dados.'];
        }
        header('Location: /painel/agenda.php', true, 302);
        exit;
    }

    if ($acao === 'salvar') {
        if (!token_valido()) {
            $aviso = 'Sessão expirada. Entre de novo — o que você digitou não foi salvo.';
            derrubar_sessao();
            header('Location: /painel/', true, 302);
            exit;
        }
        $recados = [];
        $nova = montar_agenda_do_post($_POST, $recados);
        /* A capa é o que se edita aqui; a lista sai sempre dos encontros. Deixar o
           formulário mandar a lista abriria caminho para uma tela desatualizada
           sobrescrever o que outra pessoa acabou de marcar em Encontros. */
        $nova['programacao'] = itens_publicos();
        if (publicar($nova)) {
            $sucesso = 'Capa publicada. A página já está mostrando o texto novo.';
            if ($recados) {
                $aviso = implode(' ', $recados) . ' O resto foi salvo normalmente.';
            }
        } else {
            $aviso = 'Não consegui gravar dados/agenda.json. Confira as permissões da pasta no hPanel. '
                   . 'O que você digitou continua aqui na tela — tente publicar de novo.';
            // sem isto a tela recarregava do disco e o trabalho todo sumia junto com o erro
            $rascunho = $nova;
        }
    } elseif ($acao === '' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && !$_POST) {
        // POST vazio com corpo grande = passou do post_max_size do PHP (upload pesado demais)
        $aviso = 'O envio passou do limite do servidor. Reduza a imagem (ou envie uma de cada vez) e tente de novo.';
    }

    return ['aviso' => $aviso, 'sucesso' => $sucesso, 'rascunho' => $rascunho];
}
