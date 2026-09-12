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
 * REGISTRO, E NÃO CADEIA DE IF. Cada área declara em seu `-comum.php` o que
 * diz ao Início — `pendencias_<area>()`, `medidores_<area>()` e
 * `estado_<area>()` — e este arquivo só percorre ORDEM_AGORA chamando o que
 * existir. Uma área nova entra na fila, no menu e no panorama sem tocar aqui;
 * esquecer uma das três não é silencioso: `testes/contrato/painel.test.ts`
 * cobra `pendencias_*` de toda área.
 *
 * PERMISSÃO: cada área roda dentro de `abre_no_agora()`, e o require_once do
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
 *   quantos  — quantos itens a linha junta ("Checar 5 fatos" → 5); sem o campo
 *              vale 1. É o que o selo do menu soma — ver contagens_por_area()
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

    $tarefas = pendencias_index($u);

    /* CADA ÁREA DECLARA AS SUAS. `pendencias_<area>()` mora no `-comum.php`
       da área, e é chamada para quem a abre; a ordem é a de ORDEM_AGORA, que
       é a ordem em que a fila do dia faz sentido ser lida. Área sem a função
       simplesmente não põe nada na fila — e o teste de contrato cobra que
       toda área a tenha. */
    foreach (ORDEM_AGORA as $area) {
        if (!abre_no_agora($area, $u)) {
            continue;
        }
        $fn = 'pendencias_' . $area;
        if (function_exists($fn)) {
            $tarefas = array_merge($tarefas, $fn($u));
        }
    }

    /* Urgente primeiro, mantendo a ordem de origem dentro de cada grupo. */
    $urgentes = array_values(array_filter($tarefas, fn ($t) => $t['urgente']));
    $calmas   = array_values(array_filter($tarefas, fn ($t) => !$t['urgente']));

    return $memo[$u['id']] = array_merge($urgentes, $calmas);
}

/**
 * O que não é de área nenhuma: as duas obrigações de quem tem conta.
 * `area` é 'index' — é o selo do Início.
 */
function pendencias_index(array $u): array
{
    $tarefas = [];

    /* ---------- O backup parou ----------
       Só quem administra vê, e só quando há backup e ele envelheceu: sem
       nenhum, a Manutenção já explica o cron; com um de ontem, nada a dizer. */
    if (in_array('adm', $u['capacidades'], true)) {
        require_once __DIR__ . '/backup-comum.php';
        $backups = backups_existentes();
        if ($backups !== [] && time() - $backups[0]['quando'] > HORAS_SEM_BACKUP * 3600) {
            $tarefas[] = [
                'area'    => 'index',
                'icone'   => 'bolt',
                'urgente' => true,
                'texto'   => 'O backup não rodou esta noite',
                'porque'  => 'o último zip tem mais de ' . HORAS_SEM_BACKUP . ' h — confira o cron ou faça um agora',
                'url'     => '/painel/manutencao.php',
            ];
        }
    }

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

    /* ---------- A peça da semana ----------
       FORA DE QUALQUER `pode()`, e este é o ponto: o mutirão existe justamente
       para quem não tem área nenhuma. A peça já vem pronta, não depende de
       ninguém a montante, e é o que gente aprovada esta semana consegue fazer
       hoje — sem esperar formação, sem esperar a corrente da comunicação se
       montar.

       O link leva o `?de=` da pessoa: é o que separa "compartilhe" de trabalho
       que se mede. */
    require_once __DIR__ . '/kit-comum.php';
    $mutirao = mutirao_da_semana();
    if ($mutirao['peca'] !== null
        && ($mutirao['escalados'][$u['id']] ?? '') === 'escalado') {
        $tarefas[] = [
            'area'    => 'index',
            'icone'   => 'broadcast',
            'urgente' => false,
            'texto'   => 'Postar a peça da semana',
            'porque'  => $mutirao['peca']['numero'] . ' — ' . apelido_curto($mutirao['peca']['frase'], 60),
            'url'     => '/painel/#mutirao',
        ];
    }

    return $tarefas;
}

/**
 * A ordem em que as áreas entram na fila e no panorama. É a ordem de leitura
 * da fila do dia — decisão de coordenação, não alfabética.
 */
const ORDEM_AGORA = ['tarefas', 'fatos', 'pessoas', 'gente', 'producao', 'eventos', 'agenda', 'inscricoes'];

/**
 * Se esta pessoa abre a área para o efeito do Início. `gente` não é área de
 * AREAS — é o item solto de quem lidera — e por isso tem regra própria; o
 * resto é `pode()`.
 */
function abre_no_agora(string $area, array $u): bool
{
    if ($area === 'gente') {
        require_once __DIR__ . '/pessoas-comum.php';
        return pode_liderar($u);
    }
    /* Tarefa é item solto também: qualquer conta pode ser dona de uma,
       tenha a área que tiver. */
    if ($area === 'tarefas') {
        require_once __DIR__ . '/tarefas-comum.php';
        return true;
    }
    if (!pode($area)) {
        return false;
    }
    /* O `-comum.php` da área entra aqui, uma vez, para quem a abre: é o que
       define `pendencias_*`, `medidores_*` e `estado_*`. */
    $arquivo = __DIR__ . '/' . ARQUIVO_DO_AGORA[$area] . '-comum.php';
    if (is_file($arquivo)) {
        require_once $arquivo;
    }
    return true;
}

/** Onde cada área declara o que diz ao Início. `agenda` fala pelo encontro. */
const ARQUIVO_DO_AGORA = [
    'fatos' => 'fatos', 'pessoas' => 'pessoas', 'producao' => 'producao',
    'eventos' => 'eventos', 'agenda' => 'eventos', 'inscricoes' => 'inscricoes',
];

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
    foreach (ORDEM_AGORA as $area) {
        if (!abre_no_agora($area, $u)) {
            continue;
        }
        $fn = 'medidores_' . $area;
        if (function_exists($fn)) {
            $medidores = array_merge($medidores, $fn($u));
        }
    }

    return $memo[$u['id']] = $medidores;
}

/** O degrau do meio é sempre metade do prazo que torna a coisa urgente. */
function degrau_de_prazo(int $valor, int $urgente): string
{
    if ($valor >= $urgente) {
        return 'urgente';
    }
    return $valor >= (int) ceil($urgente / 2) ? 'atencao' : 'ok';
}

/**
 * Quantos ITENS cada área tem esperando — o número ao lado do nome no menu.
 *
 * Itens, e não tarefas: a fila junta cinco fatos numa linha só ("Checar 5
 * fatos"), e contar linhas fazia o selo dizer "1" com cinco coisas paradas — um
 * número real respondendo à pergunta errada. Cada tarefa diz quantos itens
 * carrega em `quantos`, e a que não diz vale um.
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
        /* A tarefa combinada mora na aba Tarefas de Encontros: é lá que o selo
           do menu a soma. */
        $area = $t['area'] === 'tarefas' ? 'eventos' : $t['area'];
        $conta[$area] = ($conta[$area] ?? 0) + ($t['quantos'] ?? 1);
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
    if (!abre_no_agora($area, $u)) {
        return '';
    }
    $fn = 'estado_' . $area;
    return function_exists($fn) ? $fn($u) : '';
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
