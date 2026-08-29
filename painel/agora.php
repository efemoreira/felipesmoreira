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
require_once __DIR__ . '/trilhas.php';   // MESA_DA_FUNCAO e a trilha mínima de cada função

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
                'url'     => '/painel/fatos.php?aba=decididos#checados',
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

        /* O funil D+0 / D+3 / D+7. Lead sem segunda mensagem é lead perdido, e
           é a única parte do manual que vence sozinha com o relógio.

           A regra mora em `follow_ups_vencidos()`, no eventos-comum.php, e não
           aqui: este `foreach` já existia igualzinho na tela do encontro e no
           medidor do panorama, e prazo escrito em três lugares é prazo que
           diverge na terceira alteração.

           O nome vem da PESSOA, não da presença: a presença é só a relação entre
           as duas pontas, e quem tem nome é gente — a função já devolve a ficha
           resolvida em `['pessoa']`. */
        $vencidos = follow_ups_vencidos();
        if ($vencidos !== []) {
            [$primeiroLead, $primeiraEtapa] = $vencidos[0];
            $quantos = count($vencidos);
            $tarefas[] = [
                'area'    => 'eventos',
                'icone'   => 'whatsapp',
                'urgente' => true,
                'texto'   => $quantos === 1
                    ? 'Falar com ' . explode(' ', $primeiroLead['pessoa']['nome'])[0]
                    : "Fazer o follow-up de {$quantos} pessoas",
                'porque'  => mb_strtolower(ROTULO_FUNIL[$primeiraEtapa])
                    . ' — o passo venceu e lead sem segunda mensagem é lead perdido',
                'url'     => '/painel/eventos.php?e=' . rawurlencode($primeiroLead['eventoId']) . '&aba=funil#funil',
            ];
        }

        /* Encontro chegando com checklist pela metade. */
        foreach (eventos_proximos() as $e) {
            $preparo = preparo_do_evento($e);
            if ($preparo['total'] === 0 || $preparo['feito'] >= $preparo['total']) {
                continue;
            }
            /* `dias_ate_o_dia()` e não `strtotime($e['data'])`: `data` é
               texto de exibição ("24/08"), e a conta em cima dele era feita a
               partir de 1970 — todo encontro futuro caía aqui como "é hoje" e
               urgente. Ver o comentário da função, em agenda-comum.php. */
            $faltam = dias_ate_o_dia($e['inicio']);
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
        require_once __DIR__ . '/pessoas-comum.php';

        $fila = fila_de_entrada();
        $novas = count($fila);
        $horas = 0;
        foreach ($fila as $i) {
            // a mais antiga manda no recado: é ela que está perdendo a pessoa
            $horas = max($horas, horas_na_fila($i));
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
 * Os medidores da operação — o cockpit do Início.
 *
 * `tarefas_de()` responde "o que está esperando POR MIM". Esta responde a outra
 * pergunta, que é da coordenação: "como está a operação hoje". São os mesmos
 * helpers lidos por outro ângulo — nenhum número novo nasce aqui, e nenhuma
 * regra de prazo é inventada: os limites são os mesmos que a fila já cobra
 * (2h da checagem, HORAS_SEM_SAIDA, HORAS_LIMITE_INSCRICAO, D+0/D+3/D+7).
 *
 * TRÊS DEGRAUS, e não dois. `ok` · `atencao` · `urgente`. Só verde e vermelho
 * fazia tudo que estava a uma hora de estourar aparecer como se estivesse bem —
 * e o ponto de um painel de operação é justamente ver o problema antes de ele
 * virar problema. `atencao` é sempre a METADE do prazo que torna aquilo
 * urgente, para o degrau não virar número escolhido a dedo por medidor.
 *
 * PERMISSÃO: mesma regra de `tarefas_de()` — cada bloco dentro de um `pode()`,
 * com o require_once do *-comum.php DENTRO do if.
 *
 * Cada medidor é:
 *   num     — o número grande, já como texto ("3", "2/5", "—")
 *   rotulo  — o que ele conta, em duas ou três palavras
 *   nota    — a frase que explica o estado, ou ''
 *   estado  — ok | atencao | urgente
 *   url     — para onde o cartão leva
 */
function panorama_de(array $u): array
{
    static $memo = [];
    if (isset($memo[$u['id']])) {
        return $memo[$u['id']];
    }

    $medidores = [];

    /* O degrau do meio é sempre metade do prazo que torna a coisa urgente. */
    $degrau = function (int $valor, int $urgente): string {
        if ($valor >= $urgente) {
            return 'urgente';
        }
        return $valor >= (int) ceil($urgente / 2) ? 'atencao' : 'ok';
    };

    /* ---------- Checagem: a fila e a idade dela ---------- */
    if (pode('fatos')) {
        require_once __DIR__ . '/fatos-comum.php';
        require_once __DIR__ . '/producao-comum.php';

        $fila = fatos_com_status('a-checar');
        $horas = 0;
        foreach ($fila as $f) {
            $horas = max($horas, horas_esperando($f));
        }
        $medidores[] = [
            'num'    => (string) count($fila),
            'rotulo' => 'Na checagem',
            'nota'   => $fila === []
                ? 'Fila zerada — nada dorme sem status.'
                : ($horas >= 2
                    ? "O mais antigo está parado há {$horas}h; o prazo é 2h."
                    : 'Dentro do prazo de 2h.'),
            /* Fila vazia é ok mesmo quando o relógio não correu ainda: o que
               pinta o medidor é a idade do mais antigo, e sem fila não há
               idade nenhuma. */
            'estado' => $fila === [] ? 'ok' : $degrau($horas, 2),
            'url'    => '/painel/fatos.php#fila',
        ];

        /* Aprovado e sem virar peça: o vão entre "decidido" e "feito". */
        $parados = array_filter(
            fatos_com_status('ok-checado'),
            fn ($f) => saidas_do_fato($f['id']) === []
        );
        $velho = 0;
        foreach ($parados as $f) {
            $velho = max($velho, horas_esperando($f));
        }
        $medidores[] = [
            'num'    => (string) count($parados),
            'rotulo' => 'Sem saída',
            'nota'   => $parados === []
                ? 'Todo fato aprovado virou peça ou foi arquivado.'
                : 'Passaram da checagem e não viraram peça — abra uma saída ou arquive.',
            'estado' => $parados === [] ? 'ok' : $degrau($velho, HORAS_SEM_SAIDA),
            'url'    => '/painel/fatos.php?aba=decididos#checados',
        ];
    }

    /* ---------- Produção: o que está atrasado no quadro ---------- */
    if (pode('producao')) {
        require_once __DIR__ . '/producao-comum.php';

        $hoje = date('Y-m-d');
        $abertos = 0;
        $atrasados = 0;
        $semDono = count(cards_da_coluna('a-fazer'));
        foreach (ler_cards() as $c) {
            if ($c['coluna'] === 'publicado') {
                continue;
            }
            $abertos++;
            if ($c['prazo'] !== '' && $c['prazo'] < $hoje) {
                $atrasados++;
            }
        }
        $medidores[] = [
            'num'    => $atrasados . '/' . $abertos,
            'rotulo' => 'Quadro atrasado',
            'nota'   => $abertos === 0
                ? 'Quadro vazio. O card nasce quando a Checagem aprova um fato.'
                : ($atrasados > 0
                    ? 'Cards com prazo vencido, do total em andamento.'
                    : ($semDono > 0
                        ? "Nenhum atraso. {$semDono} ainda sem dono."
                        : 'Nenhum atraso e nenhum card sem dono.')),
            /* Um card atrasado já é urgente: o prazo do manual é o mesmo dia
               para roteiro e 24h para vídeo — não há degrau a percorrer. */
            'estado' => $atrasados > 0 ? 'urgente' : ($semDono > 0 ? 'atencao' : 'ok'),
            'url'    => '/painel/producao.php?dono=atrasados',
        ];
    }

    /* ---------- Encontros: o preparo do próximo e o funil ---------- */
    if (pode('eventos')) {
        require_once __DIR__ . '/eventos-comum.php';

        $proximos = eventos_proximos();
        if ($proximos === []) {
            $medidores[] = [
                'num'    => '—',
                'rotulo' => 'Próximo encontro',
                'nota'   => 'Nenhum encontro marcado. O primeiro passo é Local & Hora.',
                'estado' => 'atencao',
                'url'    => '/painel/eventos.php',
            ];
        } else {
            $e = $proximos[0];
            $preparo = preparo_do_evento($e);
            $faltam = dias_ate_o_dia($e['inicio']);
            $completo = $preparo['total'] > 0 && $preparo['feito'] >= $preparo['total'];

            /* Aqui o relógio corre para trás: quanto MENOS dias faltam, pior é
               estar com o preparo pela metade. Por isso o degrau é escrito à
               mão em vez de sair do $degrau(). */
            if ($completo) {
                $estado = 'ok';
            } elseif ($faltam !== null && $faltam <= 2) {
                $estado = 'urgente';
            } elseif ($faltam !== null && $faltam <= 7) {
                $estado = 'atencao';
            } else {
                $estado = 'ok';
            }

            $medidores[] = [
                'num'    => $preparo['feito'] . '/' . $preparo['total'],
                'rotulo' => 'Preparo do próximo',
                'nota'   => apelido_curto($e['titulo'], 26)
                    . ($faltam === null
                        ? ' · sem data'
                        : ($faltam <= 0 ? ' · é hoje' : ($faltam === 1 ? ' · é amanhã' : " · faltam {$faltam} dias"))),
                'estado' => $estado,
                'url'    => '/painel/eventos.php?e=' . rawurlencode($e['id']),
            ];
        }

        /* O funil, somado em todos os encontros: lead sem segunda mensagem é
           lead perdido, e é a única parte do manual que vence com o relógio.
           Mesma fonte da fila e da tela do encontro. */
        $vencidos = count(follow_ups_vencidos());
        $noFunil = count(array_filter(ler_presencas(), fn ($l) => $l['compareceu']));
        $medidores[] = [
            'num'    => (string) $vencidos,
            'rotulo' => 'Follow-up vencido',
            'nota'   => $noFunil === 0
                ? 'Ninguém marcado como presente ainda.'
                : ($vencidos === 0
                    ? ($noFunil === 1
                        ? 'A única pessoa do funil está em dia.'
                        : "Todas as {$noFunil} pessoas do funil estão em dia.")
                    : 'Pessoas que compareceram e estão sem a próxima mensagem.'),
            'estado' => $vencidos === 0 ? 'ok' : ($vencidos >= 5 ? 'urgente' : 'atencao'),
            'url'    => '/painel/eventos.php',
        ];
    }

    /* ---------- Inscrições: o vão entre se inscrever e ser aprovado ---------- */
    if (pode('inscricoes')) {
        require_once __DIR__ . '/inscricoes-comum.php';
        require_once __DIR__ . '/pessoas-comum.php';

        $fila = fila_de_entrada();
        $horas = 0;
        foreach ($fila as $i) {
            $horas = max($horas, horas_na_fila($i));
        }
        $dias = (int) floor($horas / 24);
        $medidores[] = [
            'num'    => (string) count($fila),
            'rotulo' => 'Esperando entrar',
            'nota'   => $fila === []
                ? 'Ninguém parado na porta.'
                : ($horas >= HORAS_LIMITE_INSCRICAO
                    ? 'A mais antiga está parada há ' . $dias . ' ' . ($dias === 1 ? 'dia' : 'dias')
                        . ' — quem espera demais não volta.'
                    : 'Quem se inscreveu ainda não tem acesso nem resposta.'),
            'estado' => $fila === [] ? 'ok' : $degrau($horas, HORAS_LIMITE_INSCRICAO),
            'url'    => '/painel/inscricoes.php',
        ];
    }

    return $memo[$u['id']] = $medidores;
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
 * As mesas desta pessoa: uma por função registrada, sem repetir a ferramenta.
 *
 * Cada mesa traz a linha de estado da própria ferramenta, para o cartão dizer
 * como está o trabalho e não só para onde ele leva.
 */
function mesas_de(array $u): array
{
    $mesas = [];

    foreach ($u['funcoes'] as $funcao) {
        $mesa = trilha_da_funcao($funcao)['ferramenta'];
        if ($mesa === null || !pode($mesa['area']) || isset($mesas[$mesa['area']])) {
            continue;
        }

        $mesas[$mesa['area']] = [
            'funcao' => $funcao,
            'area'   => $mesa['area'],
            'acao'   => $mesa['acao'],
            'url'    => $mesa['url'],
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
        /* `data` JÁ É o "24/08" pronto para ler — reformatá-lo com date() era
           formatar o número 0, e a mesa dizia "01/01" para todo encontro. */
        return 'Próximo: ' . apelido_curto($e['titulo'])
            . ($e['data'] !== '' ? ' · ' . $e['data'] : '')
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
 * A TRILHA DE CADA FUNÇÃO DESTA PESSOA, com o que já foi feito marcado.
 *
 * `formacao_de()` responde "quanto do currículo você andou"; esta responde
 * "o que falta para você operar a sua função". A segunda é a que tira alguém
 * do lugar: percentual de currículo não diz a ninguém o que fazer amanhã, e
 * "falta a aula da Recepção" diz.
 *
 * A regra de quem é a trilha mora em `trilhas.php` — aqui só se cruza com o
 * progresso, que é o que a torna de UMA pessoa.
 */
function trilhas_de(array $u): array
{
    if (!pode('aulas')) {
        return [];
    }
    require_once __DIR__ . '/aulas-comum.php';
    require_once __DIR__ . '/inscricoes-comum.php';   // nome_funcao()

    $feitas = aulas_concluidas($u['id']);
    $trilhas = [];

    foreach ($u['funcoes'] as $funcao) {
        $t = trilha_da_funcao($funcao);
        /* Função sem aula E sem ferramenta é 'onde-precisar': não há trilha
           para mostrar, e uma linha vazia com o nome dela seria pior que
           nenhuma. */
        if ($t['aula'] === null && $t['ferramenta'] === null) {
            continue;
        }
        $t['nome']  = nome_funcao($funcao);
        $t['feita'] = $t['aula'] !== null && in_array($t['aula']['id'], $feitas, true);
        $trilhas[] = $t;
    }

    return $trilhas;
}

/**
 * "SÁB 23/08" — a data do jeito que se lê num cartaz.
 *
 * RECEBE O `inicio`, e não o `data`: aquele é o instante ISO, este é o "24/08"
 * de exibição, que `strtotime()` não sabe ler — passar o segundo devolvia
 * string vazia, e o cartão do hub saía sem data nenhuma.
 *
 * O fuso é o do Ceará, e não o do servidor, pela mesma razão de
 * `partes_de_exibicao()`: a Hostinger roda em UTC, e um encontro às 22h
 * apareceria com o dia seguinte no selo.
 */
function data_curta(string $inicio): string
{
    if ($inicio === '') {
        return '';
    }
    try {
        $d = (new DateTimeImmutable($inicio))->setTimezone(new DateTimeZone('America/Fortaleza'));
    } catch (Exception $e) {
        return '';
    }
    // format('w') devolve 0 para domingo; a lista segue essa ordem de propósito
    $dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return $dias[(int) $d->format('w')] . ' ' . $d->format('d/m');
}

/** Título curto para caber num cartão sem estourar a linha. */
function apelido_curto(string $texto, int $limite = 34): string
{
    $texto = trim($texto);
    return mb_strlen($texto) > $limite ? mb_substr($texto, 0, $limite - 1) . '…' : $texto;
}
