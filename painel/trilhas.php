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
