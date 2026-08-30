<?php
declare(strict_types=1);

/**
 * QUEM CHAMAR DE VOLTA — a régua da reativação.
 *
 * O sistema já conhecia quatro tipos de gente que esfria, cada um num canto
 * diferente do painel: quem foi aprovado e nunca entrou, quem confirmou e não
 * apareceu, quem apareceu uma vez e sumiu, quem começou a estudar e parou.
 * Nenhum dos quatro era uma pergunta que alguém conseguia fazer — para achá-los
 * era preciso cruzar três telas de cabeça, e ninguém cruza três telas de cabeça
 * toda semana.
 *
 * **CRESCER NÃO É SÓ ENTRAR GENTE NOVA.** Parte da base já veio, já disse sim
 * uma vez, e só precisa de alguém que lembre dela. Custa uma mensagem; um
 * inscrito novo custa um encontro inteiro.
 *
 * NENHUM CARIMBO NOVO. Os quatro motivos saem do que o painel já grava —
 * `ultimoAcesso`, a lista de presença, o instante do encontro e o progresso da
 * formação. Não há campo "reativar", não há status novo na pessoa, e não há
 * arquivo em `/dados`: a lista é derivada, e por isso nunca fica velha nem
 * precisa ser mantida à mão.
 *
 * A ORDEM DOS MOTIVOS É A DA CHANCE DE VOLTAR, e não a do tempo parado. Quem
 * confirmou e faltou no encontro da semana passada disse sim há sete dias;
 * quem sumiu há três meses disse sim uma vez, faz tempo. A mensagem que
 * funciona é a primeira.
 */

require_once __DIR__ . '/aulas-comum.php';      // retrato_de_estudo()
require_once __DIR__ . '/eventos-comum.php';    // encontros_da_pessoa(), dias_desde()
require_once __DIR__ . '/sessao.php';

/**
 * As réguas de tempo, em dias.
 *
 * Não são arbitrárias: cada uma é o ponto em que o silêncio deixa de ser normal
 * e passa a ser sinal. Aprovado que não entrou em duas semanas não está
 * ocupado — perdeu o link ou desistiu. Quem veio a um encontro e não voltou em
 * dois meses já perdeu o ciclo inteiro de encontros do período.
 */
const DIAS_SEM_ENTRAR = 14;
const DIAS_SEM_VOLTAR = 60;

/** O que cada motivo diz na tela, e o que fazer com ele. */
const MOTIVOS_REATIVACAO = [
    'faltou' => [
        'nome'   => 'Confirmou e faltou',
        'oQue'   => 'Disse que vinha e não apareceu. Pergunte o que houve antes de convidar de novo.',
    ],
    'nao-entrou' => [
        'nome'   => 'Aprovada e nunca entrou',
        'oQue'   => 'A conta existe e nunca foi usada. Mande o login e a senha provisória de novo.',
    ],
    'parou' => [
        'nome'   => 'Começou a estudar e parou',
        'oQue'   => 'Travou no meio da formação. Diga qual é a próxima aula, não “continue estudando”.',
    ],
    'sumiu' => [
        'nome'   => 'Veio uma vez e sumiu',
        'oQue'   => 'Esteve num encontro e não voltou. Chame para o próximo, pelo nome do encontro.',
    ],
];

/**
 * Por que esta pessoa deveria ser chamada de volta — ou `null`.
 *
 * Devolve UM motivo, o mais forte, e não todos: uma lista em que a mesma pessoa
 * aparece quatro vezes com quatro rótulos não é uma lista de trabalho, é um
 * relatório. Quem for chamar precisa saber o que dizer, e a resposta é uma só.
 *
 * QUEM NÃO ENTRA AQUI, e é a metade que importa: quem está ativo. Coordenação e
 * candidato ficam de fora — eles não se "reativam", e vê-los numa lista de
 * esfriados faz a lista perder a credibilidade na primeira olhada.
 */
function motivo_de_reativacao(array $p, ?array $porPessoa = null): ?array
{
    if (!$p['ativo'] || in_array('adm', $p['capacidades'] ?? [], true)) {
        return null;
    }

    /* O índice vem de fora quando quem chama vai perguntar por muita gente.
       `encontros_da_pessoa()` varre a lista inteira de presenças a cada
       chamada: numa base de quinhentas pessoas isso é meio milhão de voltas
       para desenhar uma tela. Sozinha, a função continua respondendo — só
       monta o índice para si. */
    $encontros = $porPessoa !== null
        ? ($porPessoa[$p['id']] ?? [])
        : encontros_da_pessoa($p['id']);

    /* 1. Confirmou e faltou — o sim mais recente que existe. Só conta encontro
          que JÁ ACONTECEU: quem confirmou para sábado que vem não faltou. */
    foreach ($encontros as $l) {
        if ($l['confirmou'] && !$l['compareceu'] && evento_ja_aconteceu($l['evento'])) {
            return [
                'chave'   => 'faltou',
                'detalhe' => $l['evento']['titulo'],
                'dias'    => dias_desde($l['evento']['inicio'] !== '' ? $l['evento']['inicio'] : $l['criadoEm']),
            ];
        }
    }

    /* 2. Aprovada e nunca entrou. `ultimoAcesso` vazio com conta criada é a
          conta que nunca foi usada — quase sempre a senha provisória que se
          perdeu no meio do WhatsApp. */
    if ($p['status'] === 'aprovada' && $p['usuario'] !== '' && ($p['ultimoAcesso'] ?? '') === '') {
        $dias = dias_desde($p['criadoEm']);
        if ($dias >= DIAS_SEM_ENTRAR) {
            return ['chave' => 'nao-entrou', 'detalhe' => '', 'dias' => $dias];
        }
    }

    /* 3. Começou a estudar e parou. A régua é a mesma da tela de formação —
          `retrato_de_estudo()` —, para as duas telas nunca discordarem sobre
          quem travou. */
    if ($p['usuario'] !== '') {
        $r = retrato_de_estudo($p['id']);
        if ($r['estado'] === 'travada') {
            return ['chave' => 'parou', 'detalhe' => '', 'dias' => $r['dias'] ?? 0];
        }
    }

    /* 4. Veio e sumiu. O último encontro em que ESTEVE, e não o último em que
          se inscreveu: quem confirmou três vezes e nunca veio é o caso 1. */
    foreach ($encontros as $l) {
        if (!$l['compareceu']) {
            continue;
        }
        $quando = $l['evento']['inicio'] !== '' ? $l['evento']['inicio'] : $l['criadoEm'];
        $dias = dias_desde($quando);
        return $dias >= DIAS_SEM_VOLTAR
            ? ['chave' => 'sumiu', 'detalhe' => $l['evento']['titulo'], 'dias' => $dias]
            : null;   // veio faz pouco: está no ciclo, não é reativação
    }

    return null;
}

/**
 * A lista de quem chamar de volta, na ordem de quem trabalha com ela.
 *
 * Agrupada por motivo porque a mensagem é por motivo: quem senta para chamar
 * gente manda cinco vezes o mesmo texto com o nome trocado, e não cinco textos
 * diferentes em ordem alfabética.
 */
function pessoas_para_reativar(): array
{
    $grupos = [];
    foreach (MOTIVOS_REATIVACAO as $chave => $_) {
        $grupos[$chave] = [];
    }

    /* As presenças indexadas por pessoa, UMA vez, e já na ordem que a régua
       espera: do encontro mais recente para o mais antigo. */
    $eventos = [];
    foreach (ler_eventos() as $e) {
        $eventos[$e['id']] = $e;
    }
    $porPessoa = [];
    foreach (ler_presencas() as $l) {
        if (!isset($eventos[$l['eventoId']])) {
            continue;
        }
        $l['evento'] = $eventos[$l['eventoId']];
        $porPessoa[$l['pessoaId']][] = $l;
    }
    foreach ($porPessoa as &$lista) {
        usort($lista, fn ($a, $b) => quando_do_evento($b['evento']) <=> quando_do_evento($a['evento']));
    }
    unset($lista);

    foreach (ler_pessoas() as $p) {
        $motivo = motivo_de_reativacao($p, $porPessoa);
        if ($motivo === null) {
            continue;
        }
        $p['motivo'] = $motivo;
        $grupos[$motivo['chave']][] = $p;
    }

    /* Dentro do grupo, o mais recente primeiro: a lembrança de quem faltou
       semana passada ainda está fresca dos dois lados. */
    foreach ($grupos as &$lista) {
        usort($lista, fn ($a, $b) => $a['motivo']['dias'] <=> $b['motivo']['dias']);
    }
    unset($lista);

    return $grupos;
}

/**
 * Quantas pessoas há para chamar de volta, ao todo.
 *
 * Memorizado: o contador da aba e a lista da tela fazem a mesma varredura, e
 * ela não é barata — sem isto, abrir /painel/pessoas custaria duas.
 */
function quantas_para_reativar(): int
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    $memo = 0;
    foreach (pessoas_para_reativar() as $lista) {
        $memo += count($lista);
    }
    return $memo;
}
