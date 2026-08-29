<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com um fato — o lado POST de `/painel/fatos`.
 *
 * As duas travas do manual moram aqui, e nenhuma delas é conveniência:
 *
 * 1. **Fato sem link de fonte primária não entra.** Print não é fonte, e sem
 *    link a Checagem não tem o que abrir.
 * 2. **Quem traz o fato não checa o fato.** Checagem que o próprio autor faz
 *    não é checagem — é a mesma pessoa conferindo a si mesma, e o passo inteiro
 *    vira carimbo. Admin destrava, mas escreve o porquê, e o porquê fica na
 *    ficha ao lado de quem checou.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/fatos-comum.php';
require_once __DIR__ . '/producao-comum.php';  // a aprovação abre card por saída
require_once __DIR__ . '/sessao.php';

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

/**
 * Para onde a ação volta — a ABA junto da âncora.
 *
 * A âncora sozinha parou de bastar quando a tela virou três abas: `#trazer`
 * aponta para um `<fieldset>` que só existe na aba de trazer, e sem a aba na
 * URL o navegador pousava no topo de uma fila que não tem esse id. Cada âncora
 * desta tela pertence a uma aba só, então a aba se deduz dela.
 *
 * O erro do formulário é o caso que isso conserta de verdade: ele volta para
 * `trazer` com o rascunho na sessão, e voltar para a fila jogaria fora o que a
 * pessoa acabou de digitar diante dos olhos dela.
 */
function voltar(string $ancora = ''): void
{
    $url = '/painel/fatos.php';
    if ($ancora !== '') {
        $url .= '?aba=' . ($ancora === 'trazer' ? 'trazer' : 'fila') . '#' . $ancora;
    }
    header('Location: ' . $url, true, 302);
    exit;
}

/** Guarda o que foi digitado para o formulário voltar preenchido depois do erro. */
function guardar_rascunho(array $campos): void
{
    $_SESSION['rascunho_fato'] = $campos;
}

/**
 * Os campos que a Ficha de Fato pergunta, já limpos.
 *
 * Um lugar só para trazer e para corrigir: duas cópias divergiriam no dia em
 * que um campo novo entrasse só numa delas, e o defeito apareceria como "some
 * quando eu corrijo".
 */
function campos_do_fato(): array
{
    return [
        'oQue'      => limpar_texto($_POST['oQue'] ?? '', 300),
        'quem'      => limpar_texto($_POST['quem'] ?? '', 160),
        'quando'    => limpar_texto($_POST['quando'] ?? '', 20),
        'quanto'    => limpar_texto($_POST['quanto'] ?? '', 120),
        'afetados'  => limpar_texto($_POST['afetados'] ?? '', 200),
        'fonteUrl'  => limpar_texto($_POST['fonteUrl'] ?? '', 500),
        'fonteData' => limpar_texto($_POST['fonteData'] ?? '', 20),
        'segundaFonte'  => limpar_texto($_POST['segundaFonte'] ?? '', 500),
        'categoria'     => limpar_texto($_POST['categoria'] ?? 'outro', 20),
        'desdobramento' => !empty($_POST['desdobramento']),
    ];
}

/**
 * Quem pode mexer numa ficha: o autor, ou um admin.
 *
 * Não é a Checagem: corrigir o texto de um fato é acertar o que foi trazido, e
 * quem trouxe é quem sabe o que quis dizer. Admin entra porque fato sem autor
 * (importado, ou de conta apagada) precisaria ficar errado para sempre.
 */
function posso_mexer(array $fato, array $eu): bool
{
    return e_admin() || ($fato['autorId'] !== '' && $fato['autorId'] === $eu['id']);
}

/** Trata o POST desta tela, se houver um. Não volta quando de fato agiu. */
function tratar_acoes_de_fato(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if (!token_valido()) {
            avisar('erro', 'Sessão expirada. Entre de novo.');
            derrubar_sessao();
            header('Location: /painel/', true, 302);
            exit;
        }

        $acao = (string) ($_POST['acao'] ?? '');

        /* ---------- o Olheiro traz um fato ---------- */
        if ($acao === 'enviar') {
            $campos = campos_do_fato();

            // as travas do manual, na ordem em que o Olheiro erra
            if ($campos['oQue'] === '') {
                guardar_rascunho($campos);
                avisar('erro', 'Escreva em uma frase o que aconteceu.');
                voltar('trazer');
            }
            if ($campos['quem'] === '') {
                guardar_rascunho($campos);
                avisar('erro', 'Diga quem é o responsável — o órgão ou o gestor, de forma institucional.');
                voltar('trazer');
            }
            if (!fonte_valida($campos['fonteUrl'])) {
                guardar_rascunho($campos);
                avisar('erro', 'Cole o link da fonte primária. Print não é fonte, e sem link a Checagem não tem o que abrir.');
                voltar('trazer');
            }
            if (!dentro_da_janela($campos['fonteData']) && !$campos['desdobramento']) {
                guardar_rascunho($campos);
                avisar('erro', 'Esse fato está fora da janela de 48h. Se for um desdobramento novo de algo mais antigo, marque a caixa que diz isso — é a única exceção.');
                voltar('trazer');
            }

            $fatos = ler_fatos();
            $fatos[] = $campos + [
                'id'        => novo_id_fato(),
                'status'    => 'a-checar',
                'autorId'   => $eu['id'],
                'autorNome' => $eu['nome'],
                'criadoEm'  => date('c'),
            ];

            if (!gravar_fatos($fatos)) {
                guardar_rascunho($campos);
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
                voltar('trazer');
            }
            avisar('ok', 'Fato enviado para a Checagem.');
            voltar('fila');
        }

        /* ---------- corrigir a ficha (autor ou admin) ---------- */
        if ($acao === 'editar') {
            $alvo = achar_fato(limpar_texto($_POST['id'] ?? '', 40));

            if ($alvo === null) {
                avisar('erro', 'Fato não encontrado.');
                voltar('fila');
            }
            /* Só se corrige o que ainda não foi decidido. Depois da Checagem a ficha
               é o registro do que ela viu: mudar o texto por baixo transformaria uma
               decisão tomada em carimbo sobre outra coisa — e é dessa ficha que o
               card do quadro carrega fonte e responsável. */
            if ($alvo['status'] !== 'a-checar') {
                avisar('erro', 'Esse fato já foi decidido. A ficha decidida é o registro do que a Checagem viu — corrigi-la por baixo mudaria a decisão sem que ninguém soubesse.');
                voltar('fila');
            }
            if (!posso_mexer($alvo, $eu)) {
                avisar('erro', 'Quem corrige a ficha é quem trouxe o fato. Se estiver errada, avise quem enviou.');
                voltar('fila');
            }

            $campos = campos_do_fato();

            if ($campos['oQue'] === '') {
                avisar('erro', 'Escreva em uma frase o que aconteceu.');
                voltar('fila');
            }
            if ($campos['quem'] === '') {
                avisar('erro', 'Diga quem é o responsável — o órgão ou o gestor, de forma institucional.');
                voltar('fila');
            }
            if (!fonte_valida($campos['fonteUrl'])) {
                avisar('erro', 'Cole o link da fonte primária. Print não é fonte, e sem link a Checagem não tem o que abrir.');
                voltar('fila');
            }
            /* A janela de 48h é pergunta de ENTRADA, e só se refaz quando a resposta
               muda: corrigir a frase de um fato que chegou ontem não pode ser
               recusado porque ontem já passou de 48h da publicação. Trocar a data,
               sim — aí a pergunta é outra e vale a pena refazê-la. */
            if ($campos['fonteData'] !== $alvo['fonteData']
                && !dentro_da_janela($campos['fonteData']) && !$campos['desdobramento']) {
                avisar('erro', 'Essa data está fora da janela de 48h. Se for um desdobramento novo de algo mais antigo, marque a caixa que diz isso.');
                voltar('fila');
            }

            $fatos = ler_fatos();
            foreach ($fatos as &$f) {
                if ($f['id'] === $alvo['id']) {
                    $f = $campos + $f;   // o que a tela pergunta ganha; id, autor e datas ficam
                }
            }
            unset($f);

            if (!gravar_fatos($fatos)) {
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
                voltar('fila');
            }
            avisar('ok', 'Ficha corrigida. Ela continua na fila da Checagem.');
            voltar('fila');
        }

        /* ---------- apagar a ficha (autor ou admin) ---------- */
        if ($acao === 'apagar') {
            $alvo = achar_fato(limpar_texto($_POST['id'] ?? '', 40));

            if ($alvo === null) {
                avisar('erro', 'Fato não encontrado.');
                voltar('fila');
            }
            /* Fato decidido NÃO se apaga, nem por admin. É ele que responde "o que
               foi feito com aquele fato" — e o card do quadro aponta para este id.
               Apagá-lo deixaria peça publicada sem a ficha que a justifica, que é
               exatamente a situação que a Checagem existe para não permitir.
               O que se apaga é o engano da fila: o duplicado, o link colado errado. */
            if ($alvo['status'] !== 'a-checar') {
                avisar('erro', 'Fato já decidido não se apaga: é ele que responde “o que foi feito com aquele fato”, e as peças do quadro apontam para ele. Para encerrar sem virar peça, arquive com o motivo.');
                voltar('fila');
            }
            if (!posso_mexer($alvo, $eu)) {
                avisar('erro', 'Quem apaga a ficha é quem trouxe o fato. Se ela não deveria estar aí, avise quem enviou.');
                voltar('fila');
            }

            $fatos = array_values(array_filter(ler_fatos(), fn ($f) => $f['id'] !== $alvo['id']));
            if (!gravar_fatos($fatos)) {
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
                voltar('fila');
            }
            avisar('ok', 'Ficha apagada da fila.');
            voltar('fila');
        }

        /* ---------- a Checagem decide ---------- */
        if ($acao === 'aprovar' || $acao === 'pendente' || $acao === 'arquivar') {
            $alvo = achar_fato(limpar_texto($_POST['id'] ?? '', 40));

            if ($alvo === null) {
                avisar('erro', 'Fato não encontrado.');
                voltar('fila');
            }
            if ($alvo['status'] !== 'a-checar') {
                avisar('erro', 'Esse fato já foi decidido.');
                voltar('fila');
            }

            /* QUEM TRAZ O FATO NÃO CHECA O FATO.
               Checagem que o próprio autor faz não é checagem — é a mesma pessoa
               conferindo a si mesma, e o passo inteiro vira carimbo. O dado para
               aplicar isto já estava gravado (`autorId`) desde sempre.
               O admin destrava, mas caro: precisa escrever o porquê, e o porquê
               fica na ficha. É o mesmo desenho da regra do ledger na Produção. */
            $destrava = limpar_texto($_POST['destrava'] ?? '', 300);
            if ($alvo['autorId'] !== '' && $alvo['autorId'] === $eu['id']) {
                if (!e_admin()) {
                    avisar('erro', 'Você trouxe este fato — quem checa é outra pessoa. Ele fica na fila até alguém do time abrir.');
                    voltar('fila');
                }
                if ($destrava === '') {
                    avisar('erro', 'Para checar o próprio fato, escreva por que não deu para outra pessoa checar. Fica anotado na ficha.');
                    voltar('fila');
                }
            } else {
                $destrava = '';  // só vale quando a regra foi de fato contornada
            }

            $motivo = limpar_texto($_POST['motivo'] ?? '', 300);
            if ($acao === 'pendente' && $motivo === '') {
                avisar('erro', 'Diga por que ficou pendente — sem o motivo anotado ninguém sabe o que faltou para destravar depois.');
                voltar('fila');
            }
            if ($acao === 'arquivar' && $motivo === '') {
                avisar('erro', 'Diga por que o fato não vira peça — é isso que responde “o que foi feito com ele” daqui a um mês.');
                voltar('fila');
            }

            /* Aprovar abre no quadro as saídas que a Checagem marcou. É esta ligação
               que faz a ferramenta valer a pena: quem produz recebe o fato com
               fonte e responsável colados, em vez de um link copiado à mão para o
               Trello.

               NENHUMA saída é obrigatória e nenhuma é exclusiva: o mesmo fato pode
               virar roteiro e arte, só um vídeo, ou nada — e "nada" é uma resposta
               legítima, que fica registrada. Antes, aprovar criava sempre um card
               de roteiro, então o quadro enchia de card que ninguém ia escrever.

               Os cards entram primeiro: se falharem, o fato continua na fila e a
               Checagem tenta de novo. O contrário deixaria fato aprovado sem
               ninguém para escrever, que é pior de perceber. */
            $cardId = '';
            if ($acao === 'aprovar') {
                $saidas = array_values(array_intersect(
                    array_keys(ETAPAS),
                    array_map('strval', (array) ($_POST['saida'] ?? []))
                ));

                if ($saidas !== []) {
                    $cards = ler_cards();
                    foreach ($saidas as $etapa) {
                        $card = card_do_fato($alvo, $eu, $etapa);
                        $cards[] = $card;
                        if ($cardId === '') {
                            $cardId = $card['id'];  // o primeiro, só para o atalho da ficha
                        }
                    }
                    if (!gravar_cards($cards)) {
                        avisar('erro', 'Não consegui abrir os cards no quadro de Produção. O fato segue na fila — tente de novo.');
                        voltar('fila');
                    }
                }
            }

            $fatos = ler_fatos();
            foreach ($fatos as &$f) {
                if ($f['id'] === $alvo['id']) {
                    $f['status']     = $acao === 'aprovar' ? 'ok-checado' : ($acao === 'arquivar' ? 'arquivado' : 'pendente');
                    $f['motivo']     = $acao === 'aprovar' ? '' : $motivo;
                    $f['checadoPor'] = $eu['nome'];
                    $f['checadoEm']  = date('c');
                    $f['cardId']     = $cardId;
                    $f['destravaMotivo'] = $destrava;
                }
            }
            unset($f);

            if (!gravar_fatos($fatos)) {
                avisar('erro', 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.');
                voltar('fila');
            }

            if ($acao === 'aprovar') {
                avisar('ok', $cardId === ''
                    ? 'Fato aprovado, sem abrir peça. Ele fica na lista dos checados esperando alguém decidir o que fazer com ele.'
                    : 'Fato aprovado — as peças já estão em “A fazer” na Produção.');
            } elseif ($acao === 'arquivar') {
                avisar('ok', 'Fato arquivado com o motivo. Ele sai da fila e o rastro fica.');
            } else {
                avisar('ok', 'Fato marcado como pendente. Ele fica guardado com o motivo.');
            }
            voltar('fila');
        }

        avisar('erro', 'Ação desconhecida.');
        voltar();
    }
}
