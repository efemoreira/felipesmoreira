<?php
declare(strict_types=1);

/**
 * O que está esperando esta pessoa — felipesmoreira.com/painel
 *
 * O painel sabia dizer para onde a pessoa podia ir, e não o que estava parado
 * esperando por ela. Este arquivo é a fonte única dessa resposta: o hub monta a
 * fila com ela, e a navegação tira dela o número que aparece ao lado da área.
 *
 * NÃO existe regra de negócio nova aqui. Cada linha da fila sai de um helper
 * que a ferramenta correspondente já usa (fatos_com_status, cards_de,
 * etapa_vencida, preparo_do_evento…), e o prazo citado no "porque" é o prazo
 * que o Manual da Militância já cobra. Se o manual mudar, muda aqui e na aula —
 * não em cinco telas.
 *
 * PERMISSÃO: cada bloco roda dentro de um pode('<area>'), e o require_once do
 * *-comum.php acontece DENTRO do if. Quem não tem a área não paga a leitura do
 * arquivo de dados dela, e principalmente não vê o que não é da sua conta.
 *
 * ÁREA NOVA: para a pendência dela entrar no hub e no menu, acrescente um bloco
 * em tarefas_de() — e só. Não espalhe contador pelo index.php.
 */

require_once __DIR__ . '/sessao.php';

/** Quantas linhas a fila mostra antes de virar "e mais N". */
/* Quanto tempo um fato aprovado pode ficar sem virar peça antes de virar
   pendência. Mesma lógica de HORAS_LIMITE_INSCRICAO: o vão entre "decidido" e
   "feito" é onde o trabalho some. */
const HORAS_SEM_SAIDA = 48;

const TETO_FILA = 6;

/**
 * As tarefas abertas desta pessoa, urgente primeiro.
 *
 * Cada tarefa é:
 *   area     — a chave em AREAS, usada para agrupar e para o contador do menu
 *   icone    — nome em ICONE_TRACOS
 *   urgente  — true quando um prazo do manual já venceu (pinta de vermelho)
 *   texto    — a ação, em uma frase e começando por verbo
 *   porque   — a regra do manual que a torna urgente; some quando não há uma
 *   url      — link direto, já com a âncora do item
 */
function tarefas_de(array $u): array
{
    static $memo = [];
    if (isset($memo[$u['id']])) {
        return $memo[$u['id']];
    }

    $tarefas = [];

    /* ---------- A primeira obrigação: estar no grupo de trabalho ----------
       Vem antes de tudo e é urgente porque é onde a convocação sai: quem não
       está no grupo não fica sabendo do encontro, e todo o resto do painel
       perde o sentido. Some assim que a pessoa marca "já entrei" no hub.

       Não dá para conferir de fora se ela entrou mesmo — o WhatsApp não conta
       isso —, e tudo bem: a marca serve para o painel parar de cobrar. */
    if (empty($u['entrouNoGrupo'])) {
        $tarefas[] = [
            'area'    => 'index',
            'icone'   => 'whatsapp',
            'urgente' => true,
            'texto'   => 'Entrar no grupo de trabalho',
            'porque'  => 'é por ali que sai a convocação da semana — a primeira coisa que todo mundo faz ao chegar',
            'url'     => '/painel/#grupo',
        ];
    }

    /* ---------- Fatos: a fila da Checagem ---------- */
    if (pode('fatos')) {
        require_once __DIR__ . '/fatos-comum.php';
        require_once __DIR__ . '/producao-comum.php';

        /* O fato que a própria pessoa trouxe não é pendência dela: ela não pode
           checá-lo. Contá-lo aqui mandaria alguém para uma tela onde a única
           coisa a fazer é esperar — e o selo no menu ficaria aceso para sempre
           quando a fila fosse só de fato próprio. Para o resto do time ele
           continua contando normalmente. */
        $fila = array_values(array_filter(
            fatos_com_status('a-checar'),
            fn ($f) => $f['autorId'] !== $u['id']
        ));
        if ($fila !== []) {
            // o mais antigo manda no recado: é ele que estoura o prazo
            $horas = 0;
            foreach ($fila as $f) {
                $horas = max($horas, horas_esperando($f));
            }
            $quantos = count($fila);
            $tarefas[] = [
                'area'    => 'fatos',
                'icone'   => 'search',
                'urgente' => $horas >= 2,
                'texto'   => $quantos === 1 ? 'Checar 1 fato' : "Checar {$quantos} fatos",
                'porque'  => $horas >= 2
                    ? "o mais antigo está parado há {$horas}h — o prazo da checagem é 2h"
                    : 'nada dorme sem status: a meta é zerar a fila do dia',
                'url'     => '/painel/fatos.php#fila',
            ];
        }
    }

    /* ---------- Fatos: aprovado e parado, sem virar peça nenhuma ----------
       A pergunta "o que foi feito com o fato" só tem resposta se ficar sem
       resposta doer. Aprovar sem marcar saída é legítimo — decidir depois é
       normal —, mas passar de 48h assim é o fato morrendo em silêncio, que é
       exatamente o que o status 'arquivado' existe para evitar. */
    if (pode('fatos')) {
        $parados = array_values(array_filter(
            fatos_com_status('ok-checado'),
            fn ($f) => saidas_do_fato($f['id']) === [] && horas_esperando($f) >= HORAS_SEM_SAIDA
        ));
        if ($parados !== []) {
            $quantos = count($parados);
            $tarefas[] = [
                'area'    => 'fatos',
                'icone'   => 'search',
                'urgente' => false,
                'texto'   => $quantos === 1
                    ? 'Decidir o que fazer com 1 fato aprovado'
                    : "Decidir o que fazer com {$quantos} fatos aprovados",
                'porque'  => 'passaram da checagem e não viraram peça nenhuma — abra uma saída ou arquive com o motivo',
                'url'     => '/painel/fatos.php#checados',
            ];
        }
    }

    /* ---------- Produção: o que está com esta pessoa ---------- */
    if (pode('producao')) {
        require_once __DIR__ . '/producao-comum.php';

        $meus = cards_de($u['id']);
        if ($meus !== []) {
            $hoje = date('Y-m-d');
            $atrasados = array_values(array_filter(
                $meus,
                fn ($c) => $c['prazo'] !== '' && $c['prazo'] < $hoje
            ));

            if ($atrasados !== []) {
                $c = $atrasados[0];
                $quantos = count($atrasados);
                $tarefas[] = [
                    'area'    => 'producao',
                    'icone'   => 'bolt',
                    'urgente' => true,
                    'texto'   => $quantos === 1
                        ? 'Terminar “' . apelido_curto($c['titulo']) . '”'
                        : "Destravar {$quantos} cards seus com prazo vencido",
                    'porque'  => 'o prazo passou — roteiro sai no mesmo dia, vídeo em até 24h',
                    'url'     => '/painel/producao.php#' . $c['id'],
                ];
            }

            $emDia = count($meus) - count($atrasados);
            if ($emDia > 0) {
                $tarefas[] = [
                    'area'    => 'producao',
                    'icone'   => 'bolt',
                    'urgente' => false,
                    'texto'   => $emDia === 1
                        ? '1 card está com você no quadro'
                        : "{$emDia} cards estão com você no quadro",
                    'porque'  => '',
                    'url'     => '/painel/producao.php',
                ];
            }
        }
    }

    /* ---------- Encontros: o funil e o preparo ---------- */
    if (pode('eventos')) {
        require_once __DIR__ . '/eventos-comum.php';

        $eventos = [];
        foreach (ler_eventos() as $e) {
            $eventos[$e['id']] = $e;
        }

        /* O funil D+0 / D+3 / D+7. Lead sem segunda mensagem é lead perdido, e
           é a única parte do manual que vence sozinha com o relógio. */
        $vencidos = [];
        foreach (ler_leads() as $lead) {
            $evento = $eventos[$lead['eventoId']] ?? null;
            if ($evento === null) {
                continue;
            }
            $etapa = etapa_vencida($lead, $evento);
            if ($etapa !== null) {
                $vencidos[] = ['lead' => $lead, 'etapa' => $etapa];
            }
        }
        if ($vencidos !== []) {
            $primeiro = $vencidos[0];
            $quantos = count($vencidos);
            $tarefas[] = [
                'area'    => 'eventos',
                'icone'   => 'whatsapp',
                'urgente' => true,
                'texto'   => $quantos === 1
                    ? 'Falar com ' . explode(' ', $primeiro['lead']['nome'])[0]
                    : "Fazer o follow-up de {$quantos} pessoas",
                'porque'  => mb_strtolower(ROTULO_FUNIL[$primeiro['etapa']])
                    . ' — o passo venceu e lead sem segunda mensagem é lead perdido',
                'url'     => '/painel/eventos.php?e=' . rawurlencode($primeiro['lead']['eventoId']) . '#funil',
            ];
        }

        /* Encontro chegando com checklist pela metade. */
        foreach (eventos_proximos() as $e) {
            $preparo = preparo_do_evento($e);
            if ($preparo['total'] === 0 || $preparo['feito'] >= $preparo['total']) {
                continue;
            }
            $faltam = $e['data'] !== ''
                ? (int) floor((strtotime($e['data']) - strtotime(date('Y-m-d'))) / 86400)
                : null;
            if ($faltam !== null && $faltam > 7) {
                continue;  // ainda não é hora de cobrar
            }
            $tarefas[] = [
                'area'    => 'eventos',
                'icone'   => 'ticket',
                'urgente' => $faltam !== null && $faltam <= 2,
                'texto'   => 'Preparar “' . apelido_curto($e['titulo']) . '”',
                'porque'  => $preparo['feito'] . ' de ' . $preparo['total'] . ' conferidos'
                    . ($faltam === null ? '' : ($faltam <= 0 ? ' — é hoje' : ($faltam === 1 ? ' — é amanhã' : " — faltam {$faltam} dias"))),
                'url'     => '/painel/eventos.php?e=' . rawurlencode($e['id']),
            ];
            break;  // um encontro por vez: a fila não é a agenda
        }
    }

    /* ---------- Inscrições: quem está na porta ---------- */
    if (pode('inscricoes')) {
        require_once __DIR__ . '/inscricoes-comum.php';

        $novas = 0;
        $horas = 0;
        foreach (ler_inscricoes() as $i) {
            if ($i['status'] === 'nova') {
                $novas++;
                // a mais antiga manda no recado: é ela que está perdendo a pessoa
                $horas = max($horas, horas_na_fila($i));
            }
        }
        if ($novas > 0) {
            /* Passou de 48h, o recado sobe para urgente. Não é burocracia de
               prazo: quem se inscreveu está no pico de entusiasmo no dia em que
               se inscreveu, e uma fila parada três dias devolve gente fria. */
            $parada = $horas >= HORAS_LIMITE_INSCRICAO;
            $dias = (int) floor($horas / 24);

            $tarefas[] = [
                'area'    => 'inscricoes',
                'icone'   => 'flag',
                'urgente' => $parada,
                'texto'   => $novas === 1
                    ? '1 pessoa esperando decisão'
                    : "{$novas} pessoas esperando decisão",
                'porque'  => $parada
                    ? "a mais antiga está parada há {$dias} " . ($dias === 1 ? 'dia' : 'dias')
                        . ' — quem espera demais não volta'
                    : 'quem se inscreveu ainda não tem acesso nem resposta',
                'url'     => '/painel/inscricoes.php',
            ];
        }
    }

    /* Urgente primeiro, mantendo a ordem de origem dentro de cada grupo. */
    $urgentes = array_values(array_filter($tarefas, fn ($t) => $t['urgente']));
    $calmas   = array_values(array_filter($tarefas, fn ($t) => !$t['urgente']));

    return $memo[$u['id']] = array_merge($urgentes, $calmas);
}

/**
 * Quantas tarefas cada área tem — o número ao lado do nome no menu.
 *
 * Devolve só as áreas com alguma coisa: quem não aparece aqui não ganha selo.
 */
function contagens_por_area(?array $u = null): array
{
    $u ??= usuario_atual();
    if ($u === null) {
        return [];
    }

    $conta = [];
    foreach (tarefas_de($u) as $t) {
        $conta[$t['area']] = ($conta[$t['area']] ?? 0) + 1;
    }
    return $conta;
}

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
 */
const MESA_DA_FUNCAO = [
    'olheiro'    => ['area' => 'fatos',    'acao' => 'Trazer um fato',        'ancora' => '#trazer'],
    'checagem'   => ['area' => 'fatos',    'acao' => 'Checar a fila',         'ancora' => '#fila'],
    'roteirista' => ['area' => 'producao', 'acao' => 'Abrir o quadro',        'ancora' => ''],
    'design'     => ['area' => 'producao', 'acao' => 'Abrir o quadro',        'ancora' => ''],
    'editor'     => ['area' => 'producao', 'acao' => 'Abrir o quadro',        'ancora' => ''],
    'acervo'     => ['area' => 'producao', 'acao' => 'Conferir o publicado',  'ancora' => ''],
    'local-hora' => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'ancora' => ''],
    'logistica'  => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'ancora' => ''],
    'divulgacao' => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'ancora' => ''],
    'gravacao'   => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'ancora' => ''],
    'recepcao'   => ['area' => 'eventos',  'acao' => 'Ver os encontros',      'ancora' => ''],
];

/**
 * As mesas desta pessoa: uma por função registrada, sem repetir a ferramenta.
 *
 * Cada mesa traz a linha de estado da própria ferramenta, para o cartão dizer
 * como está o trabalho e não só para onde ele leva.
 */
function mesas_de(array $u): array
{
    $mesas = [];

    foreach ($u['funcoes'] as $funcao) {
        $mesa = MESA_DA_FUNCAO[$funcao] ?? null;
        if ($mesa === null || !pode($mesa['area']) || isset($mesas[$mesa['area']])) {
            continue;
        }

        $mesas[$mesa['area']] = [
            'funcao' => $funcao,
            'area'   => $mesa['area'],
            'acao'   => $mesa['acao'],
            'url'    => DESTINO_AREA[$mesa['area']]['url'] . $mesa['ancora'],
            'estado' => estado_da_area($mesa['area'], $u),
        ];
    }

    return array_values($mesas);
}

/** Uma linha sobre como está o trabalho naquela ferramenta, ou ''. */
function estado_da_area(string $area, array $u): string
{
    if ($area === 'fatos') {
        require_once __DIR__ . '/fatos-comum.php';
        $fila = fatos_esperando();
        $meus = count(array_filter(
            fatos_com_status('ok-checado'),
            fn ($f) => $f['autorId'] === $u['id']
        ));
        if ($fila === 0 && $meus === 0) {
            return 'Nenhum fato na fila. Duas varreduras por dia: de manhã e no fim da tarde.';
        }
        $partes = [];
        if ($fila > 0) {
            $partes[] = $fila === 1 ? '1 fato esperando checagem' : "{$fila} fatos esperando checagem";
        }
        if ($meus > 0) {
            $partes[] = $meus === 1 ? '1 fato seu já aprovado' : "{$meus} fatos seus já aprovados";
        }
        return implode(' · ', $partes);
    }

    if ($area === 'producao') {
        require_once __DIR__ . '/producao-comum.php';
        $meus = count(cards_de($u['id']));
        $fila = count(cards_da_coluna('a-fazer'));
        if ($meus === 0 && $fila === 0) {
            return 'Quadro vazio. O card nasce sozinho quando a Checagem aprova um fato.';
        }
        $partes = [];
        if ($meus > 0) {
            $partes[] = $meus === 1 ? '1 card com você' : "{$meus} cards com você";
        }
        if ($fila > 0) {
            $partes[] = $fila === 1 ? '1 card sem dono' : "{$fila} cards sem dono";
        }
        return implode(' · ', $partes);
    }

    if ($area === 'eventos') {
        require_once __DIR__ . '/eventos-comum.php';
        $proximos = eventos_proximos();
        if ($proximos === []) {
            return 'Nenhum encontro marcado ainda.';
        }
        $e = $proximos[0];
        $preparo = preparo_do_evento($e);
        return 'Próximo: ' . apelido_curto($e['titulo'])
            . ($e['data'] !== '' ? ' · ' . date('d/m', (int) strtotime($e['data'])) : '')
            . ' · preparo ' . $preparo['feito'] . '/' . $preparo['total'];
    }

    return '';
}

/**
 * A peça das cinco que cabe a esta pessoa num encontro, ou null.
 *
 * Os ids das funções do grupo Eventos no funcoes.json são exatamente as chaves
 * de PECAS (local-hora, logistica, divulgacao, gravacao, recepcao), então a
 * ligação sai da função e não do campo `responsaveis`, que é texto livre e não
 * dá para casar com uma conta.
 */
function peca_da_pessoa(array $u): ?string
{
    require_once __DIR__ . '/eventos-comum.php';

    foreach ($u['funcoes'] as $funcao) {
        if (isset(PECAS[$funcao])) {
            return $funcao;
        }
    }
    return null;
}

/**
 * A formação desta pessoa: quanto andou, o que já aprendeu e a próxima 🚗.
 *
 * Devolve null para quem não tem a área. Percentual sozinho não diz nada — os
 * títulos do que já foi concluído dizem "você já sabe fazer a Ficha de Fato",
 * que é o que segura quem ia desistir no meio.
 */
function formacao_de(array $u): ?array
{
    if (!pode('aulas')) {
        return null;
    }
    require_once __DIR__ . '/aulas-comum.php';

    $feitas = aulas_concluidas($u['id']);
    $todas  = todas_as_aulas();
    $rapidas = array_filter($todas, fn ($a) => $a['pista'] === 'rapida');

    /* A próxima 🚗 não concluída, na ordem do currículo — é ela que continua o
       caminho principal de quem parou no meio. */
    $proxima = null;
    foreach (CURRICULO as $dia) {
        foreach ($dia['aulas'] as $aula) {
            if ($aula['pista'] === 'rapida' && !in_array($aula['id'], $feitas, true)) {
                $proxima = ['aula' => $aula, 'dia' => $dia];
                break 2;
            }
        }
    }

    /* Os títulos do que já foi feito, na ordem do currículo, os últimos antes. */
    $aprendidas = [];
    foreach ($todas as $id => $aula) {
        if (in_array($id, $feitas, true)) {
            $aprendidas[] = $aula['titulo'];
        }
    }

    return [
        'feitas'        => count($feitas),
        'total'         => count($todas),
        'rapidasFeitas' => count(array_filter($rapidas, fn ($a) => in_array($a['id'], $feitas, true))),
        'rapidas'       => count($rapidas),
        'aprendidas'    => array_slice(array_reverse($aprendidas), 0, 3),
        'proxima'       => $proxima,
    ];
}

/**
 * "SÁB 23/08" — a data do jeito que se lê num cartaz.
 *
 * date('w') conta a semana a partir do domingo; a lista abaixo segue essa ordem
 * de propósito, para não precisar corrigir índice na hora de usar.
 */
function data_curta(string $iso): string
{
    $t = strtotime($iso);
    if ($t === false) {
        return '';
    }
    $dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return $dias[(int) date('w', $t)] . ' ' . date('d/m', $t);
}

/** Título curto para caber num cartão sem estourar a linha. */
function apelido_curto(string $texto, int $limite = 34): string
{
    $texto = trim($texto);
    return mb_strlen($texto) > $limite ? mb_substr($texto, 0, $limite - 1) . '…' : $texto;
}
