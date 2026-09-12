<?php
declare(strict_types=1);

/**
 * A TRILHA MÍNIMA DE CADA FUNÇÃO — a aula, o "Pronto quando" e a primeira
 * ferramenta.
 *
 * A formação já sabia dizer qual é a PRÓXIMA aula do currículo. Não sabia dizer
 * o que falta para ESTA pessoa operar a função que ela escolheu, e são duas
 * perguntas diferentes: quem foi aprovado como Olheiro não precisa do currículo
 * inteiro para começar — precisa da aula do Olheiro, do "Pronto quando" do
 * Olheiro e da tela em que o fato é trazido. Formar em geral e formar para
 * entrar em ação não são a mesma coisa.
 *
 * NÃO HÁ TABELA NOVA AQUI, e é de propósito. As três respostas já existiam,
 * cada uma numa fonte que a coordenação mantém por outro motivo:
 *
 *   a aula        → a primeira do currículo que cita a função em `funcoes`
 *   o checklist   → `checklists.php`, cujos ids SÃO os ids das funções
 *   a ferramenta  → `MESA_DA_FUNCAO`, que o hub já usava no botão da mesa
 *
 * Uma quarta lista, escrita à mão, divergiria na primeira aula nova — e o
 * defeito apareceria como "a trilha manda para uma aula que não existe mais".
 * `testes/contrato/trilhas.test.ts` confere as três contra o `funcoes.json`.
 *
 * `MESA_DA_FUNCAO` mudou de casa (vinha de `agora.php`) porque é a terceira
 * perna da mesma resposta. Enquanto ela morava no arquivo do hub, "qual é a
 * primeira ferramenta desta função" era uma pergunta que só o hub sabia
 * responder.
 *
 * Só define constante e função pura: incluir este arquivo não exige login nem
 * imprime nada. O currículo entra por `require` DENTRO da função, e não no
 * topo, pelo motivo de sempre no painel — quem não vai ler o manual não paga
 * a leitura dele.
 */

require_once __DIR__ . '/checklists.php';
require_once __DIR__ . '/sessao.php';

/**
 * A ferramenta e a ação principal de cada função do movimento.
 *
 * A função NÃO limita acesso — quem abre a área abre a ferramenta inteira.
 * Isto aqui existe para o Olheiro não precisar procurar todo dia onde fica a
 * tela dele, e para o botão do hub dizer o verbo daquela função em vez de um
 * genérico "abrir".
 *
 * 'onde-precisar' fica de fora de propósito: quem escolheu essa função não tem
 * uma mesa fixa, e inventar uma seria mentir para ela.
 *
 * O `destino` é colado no fim da URL da área, e por isso leva a ABA junto da
 * âncora quando a tela tem abas: `#trazer` sozinho aponta para um `<fieldset>`
 * que a aba padrão de `/painel/fatos` não desenha, e o botão da mesa pousaria
 * no topo da fila em vez da ficha em branco.
 */
const MESA_DA_FUNCAO = [
    'olheiro'    => ['area' => 'fatos',    'acao' => 'Trazer um fato',        'destino' => '?aba=trazer#trazer'],
    'checagem'   => ['area' => 'fatos',    'acao' => 'Checar a fila',         'destino' => '?aba=fila#fila'],
    'roteirista' => ['area' => 'producao', 'acao' => 'Abrir o quadro',        'destino' => ''],
    'design'     => ['area' => 'producao', 'acao' => 'Abrir o quadro',        'destino' => ''],
    'editor'     => ['area' => 'producao', 'acao' => 'Abrir o quadro',        'destino' => ''],
    'acervo'     => ['area' => 'producao', 'acao' => 'Conferir o publicado',  'destino' => ''],
    'local-hora' => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'destino' => ''],
    'logistica'  => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'destino' => ''],
    'divulgacao' => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'destino' => ''],
    'gravacao'   => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'destino' => ''],
    'recepcao'   => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'destino' => ''],
    /* As quatro da rua têm a mesma mesa das outras de Eventos: o encontro é
       onde a escala aparece e onde o checklist se marca. O que muda entre elas
       é o trabalho, não a ferramenta. */
    'material-rua'  => ['area' => 'eventos', 'acao' => 'Ver os encontros', 'destino' => ''],
    'adesivagem'    => ['area' => 'eventos', 'acao' => 'Ver os encontros', 'destino' => ''],
    'fila-transito' => ['area' => 'eventos', 'acao' => 'Ver os encontros', 'destino' => ''],
    'captacao'      => ['area' => 'eventos', 'acao' => 'Ver os encontros', 'destino' => ''],
    /* O Follow-up é o único dos Encontros cuja mesa NÃO é um encontro: a fila
       dele atravessa todos, e escolher um encontro antes de começar é a
       pergunta errada — a mensagem de hoje é para quem venceu hoje, e não para
       quem veio ao encontro tal. */
    'follow-up'  => ['area' => 'eventos',  'acao' => 'Abrir o follow-up',     'destino' => '?aba=follow-up#funil'],
];

/**
 * A trilha mínima de uma função: o que estudar, o que conferir e o que abrir.
 *
 * Devolve sempre as três chaves, e cada uma pode ser null. `onde-precisar` volta
 * com as três vazias — isso é resposta, e não falha: quem escolheu "onde
 * precisar" ainda não tem mesa, e a coordenação é que conversa com ela.
 *
 * A AULA É A QUE LEVA O ID DA FUNÇÃO, pela mesma convenção do checklist: a
 * aula `olheiro` é a que ensina o Olheiro, e é dentro dela que o "Pronto quando"
 * do Olheiro é desenhado. Só quando não existe uma com esse id é que vale a
 * primeira do currículo que cita a função.
 *
 * A ordem importa, e o Olheiro é a prova: `fluxo-da-fonte`, no Dia 0, também
 * cita a função e vem ANTES no currículo — pegar a primeira que cita mandava
 * quem quer começar a trazer fato estudar o caminho geral da informação, e não
 * a Ficha de Fato. Preparar não é a mesma coisa que habilitar.
 *
 * E não é a primeira Pista Rápida: as rápidas são o caminho de todo mundo, e a
 * aula da função é uma Pista Lenta de propósito, porque é o aprofundamento de
 * UM papel.
 */
function trilha_da_funcao(string $funcaoId): array
{
    static $memo = [];
    if (isset($memo[$funcaoId])) {
        return $memo[$funcaoId];
    }

    require_once __DIR__ . '/aulas-conteudo.php';

    $achar = function (callable $serve): ?array {
        foreach (CURRICULO as $dia) {
            foreach ($dia['aulas'] as $a) {
                if ($serve($a)) {
                    return [
                        'id'      => (string) $a['id'],
                        'titulo'  => (string) $a['titulo'],
                        'pista'   => (string) $a['pista'],
                        'minutos' => (int) ($a['minutos'] ?? 0),
                        'dia'     => (int) $dia['numero'],
                    ];
                }
            }
        }
        return null;
    };

    $aula = $achar(fn (array $a) => $a['id'] === $funcaoId)
        ?? $achar(fn (array $a) => in_array($funcaoId, $a['funcoes'] ?? [], true));

    /* O checklist não vira link próprio porque não tem tela própria: ele é
       desenhado DENTRO da aula que o referencia. O que a trilha mostra é o
       título e o tamanho — "Pronto quando, 4 itens" —, e quem abre a aula
       encontra os itens no lugar em que eles são explicados. */
    $lista = checklist($funcaoId);
    $checklist = $lista === null ? null : [
        'id'     => $funcaoId,
        'titulo' => (string) $lista['titulo'],
        'itens'  => count($lista['itens']),
    ];

    $mesa = MESA_DA_FUNCAO[$funcaoId] ?? null;
    $ferramenta = $mesa === null ? null : [
        'area' => $mesa['area'],
        'nome' => AREAS[$mesa['area']] ?? $mesa['area'],
        'acao' => $mesa['acao'],
        'url'  => DESTINO_AREA[$mesa['area']]['url'] . $mesa['destino'],
    ];

    $memo[$funcaoId] = [
        'funcao'     => $funcaoId,
        'aula'       => $aula,
        'checklist'  => $checklist,
        'ferramenta' => $ferramenta,
    ];
    return $memo[$funcaoId];
}

/* ===================== os primeiros passos ===================== */

/**
 * Os três primeiros passos de quem acabou de chegar — e se cada um já foi dado.
 *
 * O hub inteiro (mesas, fila, encontros, formação, atividade) é a tela certa
 * para quem já trabalha aqui. Para quem foi aprovada ontem, é ruído: dez
 * blocos e nenhuma resposta para "o que eu faço primeiro?". A trilha mínima
 * já dizia (grupo → aula → ferramenta); o que faltava era o hub abrir com ELA
 * enquanto não estiver completa, e só com ela.
 *
 * O terceiro passo é derivado do que a pessoa já gravou — um fato trazido,
 * um card assumido, uma presença marcada, uma peça postada. Sem função com
 * ferramenta, o terceiro passo é o mutirão: é o que gente aprovada esta
 * semana consegue fazer sem depender de ninguém.
 */
function primeiros_passos(array $u): array
{
    require_once __DIR__ . '/aulas-comum.php';   // aulas_concluidas(), retrato_de_estudo()

    /* 1. o grupo */
    $passos = [[
        'chave' => 'grupo',
        'titulo' => 'Entrar no grupo de trabalho',
        'porque' => 'É por ali que sai a convocação da semana.',
        'url'    => '/painel/#grupo',
        'feito'  => !empty($u['entrouNoGrupo']),
    ]];

    /* 2. a aula da função — a primeira função que tem uma; senão, a primeira
          aula que ela concluir vale */
    $trilha = null;
    foreach ($u['funcoes'] as $f) {
        $t = trilha_da_funcao($f);
        if ($t['aula'] !== null) {
            $trilha = $t;
            break;
        }
    }
    $concluidas = aulas_concluidas($u['id']);
    $passos[] = $trilha !== null
        ? [
            'chave'  => 'aula',
            'titulo' => 'Fazer a aula: ' . $trilha['aula']['titulo'],
            'porque' => $trilha['aula']['minutos'] > 0
                ? $trilha['aula']['minutos'] . ' minutos — é o que a sua função precisa saber primeiro.'
                : 'É o que a sua função precisa saber primeiro.',
            'url'    => '/aulas#' . $trilha['aula']['id'],
            'feito'  => in_array($trilha['aula']['id'], $concluidas, true),
        ]
        : [
            'chave'  => 'aula',
            'titulo' => 'Fazer a primeira aula',
            'porque' => 'O Dia 0 explica como esta formação funciona.',
            'url'    => '/aulas',
            'feito'  => $concluidas !== [],
        ];

    /* 3. a primeira coisa na mesa */
    $ferramenta = $trilha['ferramenta'] ?? null;
    if ($ferramenta !== null && pode($ferramenta['area'])) {
        $passos[] = [
            'chave'  => 'mesa',
            'titulo' => $ferramenta['acao'] . ' em ' . $ferramenta['nome'],
            'porque' => 'A sua mesa. A primeira vez é a que conta.',
            'url'    => $ferramenta['url'],
            'feito'  => ja_fez_algo_em($ferramenta['area'], $u['id']),
        ];
    } else {
        require_once __DIR__ . '/kit-comum.php';
        $mutirao = mutirao_da_semana();
        $passos[] = [
            'chave'  => 'mesa',
            'titulo' => 'Postar a peça da semana',
            'porque' => 'O mutirão não depende de ninguém: a peça já vem pronta.',
            'url'    => '/painel/#peca',
            'feito'  => ($mutirao['escalados'][$u['id']] ?? '') === 'postou',
        ];
    }

    return $passos;
}

/** A pessoa já deixou rastro nesta ferramenta? Derivado do que está gravado. */
function ja_fez_algo_em(string $area, string $uid): bool
{
    switch ($area) {
        case 'fatos':
            require_once __DIR__ . '/fatos-comum.php';
            foreach (ler_fatos() as $f) {
                if ($f['autorId'] === $uid) {
                    return true;
                }
            }
            return false;
        case 'producao':
            require_once __DIR__ . '/producao-comum.php';
            foreach (ler_cards() as $c) {
                if ($c['donoId'] === $uid) {
                    return true;
                }
            }
            return false;
        case 'eventos':
            require_once __DIR__ . '/eventos-comum.php';
            foreach (ler_presencas() as $l) {
                if ($l['criadoPorId'] === $uid) {
                    return true;
                }
            }
            foreach (ler_eventos() as $e) {
                if (($e['criadoPor'] ?? '') === $uid) {
                    return true;
                }
            }
            return false;
        case 'municao':
            require_once __DIR__ . '/kit-comum.php';
            foreach (ler_mutirao() as $semana) {
                if (($semana['escalados'][$uid] ?? '') === 'postou') {
                    return true;
                }
            }
            return false;
        default:
            return false;
    }
}

/** Todos os três passos dados? Aí o hub inteiro é a tela certa. */
function trilha_completa(array $u): bool
{
    foreach (primeiros_passos($u) as $p) {
        if (!$p['feito']) {
            return false;
        }
    }
    return true;
}
