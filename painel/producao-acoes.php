<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com um card — o lado POST de `/painel/producao`.
 *
 * O card NÃO nasce aqui: ele nasce da aprovação de um fato, já com fonte e
 * responsável colados. É essa ligação que justifica o quadro não ser um Trello,
 * e é por isso que não existe ação de "criar card".
 *
 * DUAS REGRAS DO MANUAL moram neste arquivo:
 *
 * 1. **Publicar exige o link do post.** É ele que o Acervo indexa depois; sem
 *    ele o card publicado é uma peça que ninguém acha.
 * 2. **A regra do ledger**: o mesmo responsável como alvo principal duas vezes
 *    em 48h avisa e pede ciência. **Avisa, não bloqueia** — a coordenação pode
 *    ter um motivo, e o que não pode é ela não saber.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/sessao.php';

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $ancora = ''): void
{
    header('Location: /painel/producao.php' . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
}

/** Anota no histórico do card — é o que conta a história depois. */
function anotar(array &$card, string $quem, string $texto): void
{
    $card['historico'][] = ['quando' => date('c'), 'quem' => $quem, 'texto' => $texto];
    $card['historico'] = array_slice($card['historico'], -12);
}

/** Trata o POST desta tela, se houver um. Não volta quando de fato agiu. */
function tratar_acoes_de_card(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if (!token_valido()) {
            avisar('erro', 'Sessão expirada. Entre de novo.');
            derrubar_sessao();
            header('Location: /painel/', true, 302);
            exit;
        }

        $acao = (string) ($_POST['acao'] ?? '');

        $alvo = achar_card(limpar_texto($_POST['id'] ?? '', 40));

        if ($alvo === null) {
            avisar('erro', 'Card não encontrado.');
            voltar();
        }

        $cards = ler_cards();

        /* ---------- pegar ou soltar o card ---------- */
        if ($acao === 'assumir' || $acao === 'soltar') {
            foreach ($cards as &$c) {
                if ($c['id'] === $alvo['id']) {
                    if ($acao === 'assumir') {
                        $c['donoId']   = $eu['id'];
                        $c['donoNome'] = $eu['nome'];
                        anotar($c, $eu['nome'], 'Assumiu o card.');
                    } else {
                        $c['donoId']   = '';
                        $c['donoNome'] = '';
                        anotar($c, $eu['nome'], 'Soltou o card.');
                    }
                }
            }
            unset($c);

            if (!gravar_cards($cards)) {
                avisar('erro', 'Não consegui gravar em /dados.');
            }
            voltar($alvo['id']);
        }

        /* ---------- andar no quadro ---------- */
        if ($acao === 'mover') {
            $destino = limpar_texto($_POST['coluna'] ?? '', 20);
            if (!isset(COLUNAS[$destino])) {
                avisar('erro', 'Coluna desconhecida.');
                voltar();
            }

            /* Publicar é diferente de mover: pede o link do post e passa pela regra
               do ledger. Por isso vem de outro botão, não deste. */
            if ($destino === 'publicado') {
                avisar('erro', 'Para publicar, use o botão “Publicar” do card — ele pede o link do post.');
                voltar($alvo['id']);
            }

            foreach ($cards as &$c) {
                if ($c['id'] === $alvo['id']) {
                    $c['coluna'] = $destino;
                    anotar($c, $eu['nome'], 'Moveu para ' . COLUNAS[$destino] . '.');
                }
            }
            unset($c);

            if (!gravar_cards($cards)) {
                avisar('erro', 'Não consegui gravar em /dados.');
            }
            voltar($alvo['id']);
        }

        /* ---------- publicar ---------- */
        if ($acao === 'publicar') {
            $link = limpar_texto($_POST['linkPost'] ?? '', 500);
            if ($link === '' || filter_var($link, FILTER_VALIDATE_URL) === false) {
                avisar('erro', 'Cole o link do post publicado — é ele que o Acervo indexa depois.');
                voltar($alvo['id']);
            }

            /* A regra do ledger do manual. Avisa, não bloqueia: às vezes o
               desdobramento do mesmo caso é a pauta certa, e quem decide isso é a
               coordenação. Mas ninguém publica sem ver o aviso. */
            $repetido = alvo_repetido($alvo['responsavel'], $alvo['id']);
            if ($repetido !== null && empty($_POST['ciente'])) {
                avisar('erro', 'Regra do ledger: “' . $alvo['responsavel'] . '” já foi alvo principal de “'
                    . $repetido['titulo'] . '”, publicado há menos de ' . LEDGER_HORAS . 'h. '
                    . 'Se ainda assim for a pauta certa, marque a caixa de ciência e publique.');
                voltar($alvo['id']);
            }

            foreach ($cards as &$c) {
                if ($c['id'] === $alvo['id']) {
                    $c['coluna']      = 'publicado';
                    $c['linkPost']    = $link;
                    $c['publicadoEm'] = date('c');
                    anotar($c, $eu['nome'], 'Publicado.');
                }
            }
            unset($c);

            if (!gravar_cards($cards)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id']);
            }
            avisar('ok', 'Publicado. Guarde o arquivo com o nome padrão e anote o link no índice do Acervo.');
            voltar($alvo['id']);
        }

        /* ---------- corrigir o card ---------- */
        if ($acao === 'editar') {
            $titulo = limpar_texto($_POST['titulo'] ?? '', 200);
            $etapa  = limpar_texto($_POST['etapa'] ?? '', 20);
            $fonte  = limpar_texto($_POST['fonteUrl'] ?? '', 500);

            if ($titulo === '') {
                avisar('erro', 'O card precisa de um título — é ele que vira o nome do arquivo no Acervo.');
                voltar($alvo['id']);
            }
            if (!isset(ETAPAS[$etapa])) {
                avisar('erro', 'Etapa desconhecida.');
                voltar($alvo['id']);
            }
            /* A fonte pode ficar vazia (card aberto à mão), mas se vier tem de ser
               link de verdade: é ela que o Acervo guarda como prova da peça. */
            if ($fonte !== '' && filter_var($fonte, FILTER_VALIDATE_URL) === false) {
                avisar('erro', 'A fonte precisa ser um endereço de verdade, ou ficar em branco.');
                voltar($alvo['id']);
            }

            foreach ($cards as &$c) {
                if ($c['id'] !== $alvo['id']) {
                    continue;
                }
                /* O nome do arquivo é GERADO do título e da etapa — mudar qualquer um
                   dos dois muda o nome que o Estúdio vai exportar. Por isso a
                   mudança fica anotada: quem já baixou o PNG com o nome antigo
                   precisa saber que ele mudou. */
                if ($c['titulo'] !== $titulo || $c['etapa'] !== $etapa) {
                    anotar($c, $eu['nome'], 'Corrigiu o card — o nome do arquivo mudou.');
                } else {
                    anotar($c, $eu['nome'], 'Corrigiu o card.');
                }
                $c['titulo']      = $titulo;
                $c['etapa']       = $etapa;
                $c['prazo']       = limpar_texto($_POST['prazo'] ?? '', 20);
                $c['responsavel'] = limpar_texto($_POST['responsavel'] ?? '', 160);
                $c['fonteUrl']    = $fonte;
            }
            unset($c);

            if (!gravar_cards($cards)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id']);
            }
            avisar('ok', 'Card corrigido.');
            voltar($alvo['id']);
        }

        /* ---------- apagar o card ---------- */
        if ($acao === 'apagar') {
            /* Card publicado é o rastro de uma peça que foi ao ar: é ele que
               responde, na tela de Fatos, "o que foi feito com aquele fato", e o
               Acervo aponta para o link que está aqui dentro. Apagá-lo deixa peça
               publicada sem ficha que a justifique — e é isso que a Checagem existe
               para não permitir. Admin destrava, porque card publicado por engano
               também existe; qualquer outro apaga só o que ainda não foi ao ar. */
            if ($alvo['coluna'] === 'publicado' && !e_admin()) {
                avisar('erro', 'Card publicado não se apaga: é ele que responde “o que foi feito com aquele fato”, e o Acervo aponta para o link que está nele.');
                voltar($alvo['id']);
            }

            $cards = array_values(array_filter($cards, fn ($c) => $c['id'] !== $alvo['id']));
            if (!gravar_cards($cards)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id']);
            }
            /* O fato NÃO volta para a fila: ele foi checado, e a decisão continua
               tomada. O que some é a peça que ninguém vai fazer — e a tela de Fatos
               volta a mostrá-lo como "sem peça", que é a verdade. */
            avisar('ok', 'Card apagado. O fato continua checado, e volta a aparecer como “sem peça”.');
            voltar();
        }

        /* ---------- abrir a etapa seguinte do mesmo fato ---------- */
        if ($acao === 'nova-etapa') {
            $etapa = limpar_texto($_POST['etapa'] ?? '', 20);
            if (!isset(ETAPAS[$etapa])) {
                avisar('erro', 'Etapa desconhecida.');
                voltar($alvo['id']);
            }

            $novo = $alvo;
            $novo['id']          = novo_id_card();
            $novo['etapa']       = $etapa;
            $novo['coluna']      = 'a-fazer';
            $novo['donoId']      = '';
            $novo['donoNome']    = '';
            $novo['linkPost']    = '';
            $novo['publicadoEm'] = '';
            $novo['criadoEm']    = date('c');
            $novo['historico']   = [[
                'quando' => date('c'),
                'quem'   => $eu['nome'],
                'texto'  => 'Aberto a partir do card de ' . ETAPAS[$alvo['etapa']] . '.',
            ]];

            $cards[] = $novo;
            if (!gravar_cards($cards)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id']);
            }
            avisar('ok', 'Card de ' . ETAPAS[$etapa] . ' aberto em “A fazer”.');
            voltar($novo['id']);
        }

        avisar('erro', 'Ação desconhecida.');
        voltar();
    }
}
