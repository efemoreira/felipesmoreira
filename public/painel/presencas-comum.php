<?php
declare(strict_types=1);

/**
 * As presenças — quem confirmou, quem veio, e o funil de depois (D+0 · D+3 · D+7).
 *
 * A presença é RELAÇÃO entre pessoa e encontro, não cópia do cadastro: aponta
 * para `dados/pessoas.php` pelo id. `normalizar_presenca()` é a única resposta
 * para "o que é uma presença válida", e `ler/gravar_presencas()` a única porta
 * para `dados/presencas.php`.
 *
 * Saiu de `eventos-comum.php` pelo mesmo motivo de `escala-comum.php`: o
 * encontro é uma coisa, quem esteve nele é outra, e o follow-up é uma
 * terceira. Não inclua este arquivo direto: `eventos-comum.php` inclui.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/pessoas-comum.php';  // a presença aponta para uma pessoa

const ARQ_PRESENCAS = PASTA_DADOS . '/presencas.php';

/** Versão do texto de consentimento da página pública de presença. */
const VERSAO_CONSENTIMENTO_PRESENCA = '1';

/**
 * Quem esteve — ou disse que vem — em cada encontro.
 *
 * É uma RELAÇÃO entre pessoa e evento, e não uma cópia da pessoa. Antes cada
 * ficha repetia nome, telefone, bairro e cidade: quem foi a cinco encontros
 * tinha cinco cópias de si, e corrigir um telefone errado exigia achar as cinco.
 * Agora aponta para `pessoaId` e o resto vem de lá.
 *
 * Uma lista só por evento, e não duas. O manual tem duas planilhas — RSVP (da
 * Divulgação) e leads (da Recepção) —, mas elas descrevem a mesma pessoa em dois
 * momentos: convidada e depois presente. Duas listas viram trabalho dobrado e
 * nome repetido; aqui a mesma linha ganha "confirmou" e "compareceu".
 */
function normalizar_presenca($l): ?array
{
    if (!is_array($l) || empty($l['id']) || empty($l['pessoaId']) || empty($l['eventoId'])) {
        return null;
    }

    $funil = [];
    foreach (['d0', 'd3', 'd7'] as $etapa) {
        $funil[$etapa] = limpar_texto($l['funil'][$etapa] ?? '', 40);
    }

    return [
        'id'       => limpar_texto($l['id'], 40),
        'eventoId' => limpar_texto($l['eventoId'], 40),
        'pessoaId' => limpar_texto($l['pessoaId'], 40),
        'convidadoPor' => limpar_texto($l['convidadoPor'] ?? '', 60),
        /* A anotação é DESTE encontro ("chegou atrasado", "quer ajudar na
           próxima"), não da pessoa — por isso mora aqui e não na ficha dela. */
        'observacao' => limpar_texto($l['observacao'] ?? '', 300),
        'confirmou'  => !empty($l['confirmou']),
        'compareceu' => !empty($l['compareceu']),
        /* 'qr' quando a pessoa se cadastrou sozinha; 'painel' quando alguém
           digitou. O `??` tem de estar nos DOIS lados: sem ele, uma ficha sem
           `origem` passava no in_array (pelo padrão) e depois lia a chave que
           não existe. */
        'origem'   => in_array($l['origem'] ?? 'painel', ['qr', 'painel'], true)
            ? ($l['origem'] ?? 'painel')
            : 'painel',
        'criadoPorId' => limpar_texto($l['criadoPorId'] ?? '', 40),
        'criadoEm'    => limpar_texto($l['criadoEm'] ?? '', 40),
        'funil'    => $funil,
    ];
}

function ler_presencas(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_PRESENCAS)) {
        $bruto = @include ARQ_PRESENCAS;
        if (is_array($bruto)) {
            foreach ($bruto as $l) {
                if ($limpo = normalizar_presenca($l)) {
                    $cache[] = $limpo;
                }
            }
        }
    }
    return $cache;
}

function gravar_presencas(array $presencas): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($presencas as $l) {
        if ($limpo = normalizar_presenca($l)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo site. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_PRESENCAS, $conteudo)) {
        return false;
    }
    ler_presencas(true);
    return true;
}

/**
 * As presenças de um encontro, já com a ficha da pessoa junto.
 *
 * Cada linha traz `pessoa` resolvida — quem desenha a tela não deveria ter que
 * cruzar dois arrays para escrever um nome. Presença cuja pessoa sumiu é
 * descartada em silêncio: é resto de fusão de duplicata, não informação.
 */
function presencas_do_evento(string $eventoId): array
{
    $porId = [];
    foreach (ler_pessoas() as $p) {
        $porId[$p['id']] = $p;
    }

    $lista = [];
    foreach (ler_presencas() as $l) {
        if ($l['eventoId'] !== $eventoId || !isset($porId[$l['pessoaId']])) {
            continue;
        }
        $l['pessoa'] = $porId[$l['pessoaId']];
        $lista[] = $l;
    }
    usort($lista, fn ($a, $b) => strcmp($a['pessoa']['nome'], $b['pessoa']['nome']));
    return $lista;
}

/** Os encontros em que uma pessoa esteve — a pergunta da ficha dela. */
function encontros_da_pessoa(string $pessoaId): array
{
    $eventos = [];
    foreach (ler_eventos() as $e) {
        $eventos[$e['id']] = $e;
    }

    $lista = [];
    foreach (ler_presencas() as $l) {
        if ($l['pessoaId'] !== $pessoaId || !isset($eventos[$l['eventoId']])) {
            continue;
        }
        $l['evento'] = $eventos[$l['eventoId']];
        $lista[] = $l;
    }
    usort($lista, fn ($a, $b) => quando_do_evento($b['evento']) <=> quando_do_evento($a['evento']));
    return $lista;
}

function novo_id_presenca(): string
{
    return bin2hex(random_bytes(8));
}

/**
 * Quem ainda não está na lista deste encontro.
 *
 * Serve para escalar em bloco: militante com conta **não lê o QR da mesa** —
 * está atrás dela, recebendo os outros. Sem escalar, a lista contaria só quem
 * entrou pela porta, e o relatório esqueceria quem fez o encontro acontecer.
 *
 * `$soContas` separa as duas perguntas: "quem do TIME falta?" (a escalação) e
 * "quem do movimento falta?" (convidar alguém que já está cadastrado).
 */
function pessoas_fora_do_evento(string $eventoId, bool $soContas = true): array
{
    $dentro = [];
    foreach (ler_presencas() as $l) {
        if ($l['eventoId'] === $eventoId) {
            $dentro[$l['pessoaId']] = true;
        }
    }

    $fora = [];
    foreach (ler_pessoas() as $p) {
        if (isset($dentro[$p['id']])) {
            continue;
        }
        if ($soContas && (!tem_conta($p) || !$p['ativo'])) {
            continue;
        }
        $fora[] = $p;
    }
    usort($fora, fn ($a, $b) => strcmp(sem_acento($a['nome']), sem_acento($b['nome'])));
    return $fora;
}

/** A linha desta pessoa neste encontro, ou null. */
function presenca_de(string $eventoId, string $pessoaId): ?array
{
    foreach (ler_presencas() as $l) {
        if ($l['eventoId'] === $eventoId && $l['pessoaId'] === $pessoaId) {
            return $l;
        }
    }
    return null;
}

/**
 * Quantos dias desde o evento (ou desde o cadastro, se não houver instante).
 *
 * DIAS DE CALENDÁRIO, e não blocos de 24 horas — é o outro lado de
 * `dias_ate_o_dia()`, e sai da mesma conta pelo mesmo motivo. O manual cobra
 * "D+3", e quem lê isso conta no calendário: um encontro de sábado à noite
 * vence o D+3 na terça, não na terça à noite. Com a divisão por 86400 o degrau
 * virava sempre algumas horas depois do que o time esperava, e a diferença
 * mudava conforme a hora em que o encontro tinha começado.
 *
 * `null` (sem instante legível) vira 0, que é o mesmo que "hoje": é o valor que
 * não faz nada vencer sozinho.
 */
function dias_desde(string $referencia): int
{
    $dias = dias_ate_o_dia($referencia);
    return $dias === null ? 0 : -$dias;
}

/**
 * Quem JÁ ESTÁ na estrutura, e por isso não é lead de follow-up.
 *
 * O funil existe para transformar quem apareceu num encontro em militância —
 * agradecer, mandar conteúdo, convidar de novo. Quem já é militante, quem
 * coordena, quem é candidato e quem tem conta no painel já fez esse caminho: a
 * "cobrança" de convidar para o próximo encontro é dirigida a quem organiza o
 * próximo encontro.
 *
 * O efeito prático de não ter essa regra era o funil crescer com o time: cada
 * encontro devolvia a mesma dezena de nomes da coordenação para a fila de
 * pendências, e a lista que deveria mostrar contato novo mostrava gente do
 * grupo. Fila que enche de trabalho que ninguém vai fazer é fila que se para de
 * abrir — e aí o lead de verdade se perde junto.
 *
 * `tem_conta()` entra junto com o tipo porque quem foi ESCALADO no encontro
 * (`add-time`) está na lista de presença como qualquer um, e ninguém vai mandar
 * mensagem de "obrigado por ter vindo" para quem estava atrás da mesa.
 *
 * A saída do funil é o próprio trabalho do funil: o seletor "O que é" da aba
 * Pessoas muda o tipo, e a pessoa deixa a fila no mesmo instante.
 */
const TIPOS_NA_ESTRUTURA = ['militante', 'coordenador', 'candidato'];

function na_estrutura(array $pessoa): bool
{
    return in_array($pessoa['tipo'], TIPOS_NA_ESTRUTURA, true) || tem_conta($pessoa);
}

/**
 * A etapa do funil que está vencida para esta pessoa, ou null.
 *
 * D+0 agradecer · D+3 mandar conteúdo · D+7 convidar para o próximo.
 * Só conta quem compareceu: quem foi convidado e não veio não entra no funil.
 * Quem `na_estrutura()` já responde sim também fica fora — ver lá o porquê.
 *
 * O RELÓGIO SAI DE `inicio`, E NÃO DE `data`. `data` é o texto de exibição
 * ("24/08"): `strtotime()` devolve `false` nele e `dias_desde()`, por segurança,
 * responde 0. O efeito era o funil inteiro travado no primeiro degrau — com
 * `$dias` sempre zero, `d3` e `d7` nunca venciam, e o painel só sabia cobrar a
 * mensagem de agradecimento. Sem erro nenhum na tela: a única pista era o
 * follow-up que nunca passava de D+0.
 *
 * O `criadoEm` da presença continua sendo o plano B, para o encontro antigo que
 * nunca teve instante — ali a data em que a pessoa entrou na lista é a melhor
 * aproximação que existe do dia do encontro.
 */
function etapa_vencida(array $presenca, array $evento, ?array $pessoa = null): ?string
{
    if (!$presenca['compareceu']) {
        return null;
    }
    if ($pessoa !== null && na_estrutura($pessoa)) {
        return null;
    }
    $dias = dias_desde($evento['inicio'] !== '' ? $evento['inicio'] : $presenca['criadoEm']);

    foreach (['d0' => 0, 'd3' => 3, 'd7' => 7] as $etapa => $quando) {
        if ($dias >= $quando && $presenca['funil'][$etapa] === '') {
            return $etapa;
        }
    }
    return null;
}

/**
 * Quem está devendo um passo do funil: `[[presenca, etapa], …]`.
 *
 * Sem argumento, responde pelo MOVIMENTO INTEIRO — é a pergunta do hub e do
 * cockpit. Com um encontro, responde só por ele — é a pergunta da aba Pessoas.
 * Uma função só para as duas porque é a mesma regra: eram três cópias do mesmo
 * `foreach` (a tela do encontro, a fila do `agora.php` e o medidor do
 * panorama), e três cópias de uma regra de prazo é uma regra que diverge no dia
 * em que alguém mexer numa delas.
 *
 * UMA PASSADA SÓ, mesmo no caso global. Chamar a versão por encontro dentro de
 * um laço de encontros custaria uma varredura da lista de gente por encontro —
 * numa campanha com cinquenta encontros e dois mil cadastros isso é o hub
 * ficando lento sem ninguém saber por quê.
 *
 * Sempre sobre a lista INTEIRA: o follow-up vencido é o que está devendo, e
 * filtrá-lo pela busca da tela seria esconder trabalho.
 *
 * Quem já está na estrutura não entra — a pessoa é lida aqui e passa para
 * `etapa_vencida()`, que é onde a regra mora. Ver `na_estrutura()`.
 *
 * A ordem é a dos encontros e, dentro de cada um, a do nome — determinística,
 * e não "a ordem em que o arquivo foi gravado". É ela que decide de quem é o
 * nome que aparece no recado do hub.
 */
function follow_ups_vencidos(?array $evento = null): array
{
    $quem = [];
    foreach (ler_pessoas() as $p) {
        $quem[$p['id']] = $p;
    }
    $eventos = [];
    foreach ($evento !== null ? [$evento] : ler_eventos() as $e) {
        $eventos[$e['id']] = $e;
    }

    $vencidos = [];
    foreach (ler_presencas() as $l) {
        $e = $eventos[$l['eventoId']] ?? null;
        /* Presença de pessoa apagada não vira pendência: não há a quem mandar
           a mensagem, e o recado do hub ficaria aceso para sempre. */
        if ($e === null || !isset($quem[$l['pessoaId']])) {
            continue;
        }
        $etapa = etapa_vencida($l, $e, $quem[$l['pessoaId']]);
        if ($etapa === null) {
            continue;
        }
        $l['pessoa'] = $quem[$l['pessoaId']];
        /* O ENCONTRO VAI JUNTO. A aba de dentro de um encontro já sabe de qual
           encontro se trata; a fila transversal não — e é o nome dele que a
           mensagem cita ("obrigado por ter vindo ao Benfica"). Resolver isso na
           tela custaria uma busca por linha, com a lista de encontros já
           indexada aqui do lado. */
        $l['evento'] = $e;
        $vencidos[] = [$l, $etapa];
    }

    usort($vencidos, function (array $a, array $b) use ($eventos) {
        $ordem = array_keys($eventos);
        $pa = array_search($a[0]['eventoId'], $ordem, true);
        $pb = array_search($b[0]['eventoId'], $ordem, true);
        return $pa === $pb
            ? strcmp($a[0]['pessoa']['nome'], $b[0]['pessoa']['nome'])
            : $pa <=> $pb;
    });

    return $vencidos;
}

const ROTULO_FUNIL = [
    /* "Puxar conversa", e não "chamar para o canal", que era o que o manual
       prescrevia. A mudança é de propósito e a mensagem pronta a segue: quem
       apareceu uma vez e recebe, de cara, o convite de um grupo com oitenta
       pessoas entra num lugar onde ninguém a chama pelo nome — que é exatamente
       o que faz alguém não se sentir parte. O grupo continua existindo; ele
       deixa de ser a PRIMEIRA coisa. */
    'd0' => 'Agradecer pelo nome e puxar conversa',
    'd3' => 'Mandar um conteúdo do interesse dela',
    'd7' => 'Convidar para o próximo encontro',
];

/**
 * AS TRÊS MENSAGENS DO FUNIL, prontas para o WhatsApp.
 *
 * O funil existe desde o começo e morre no primeiro degrau: de vinte e cinco
 * pessoas que compareceram, dez receberam o agradecimento, uma recebeu conteúdo
 * e nenhuma foi convidada de volta. Não é falta de disciplina — o botão abria
 * **conversa vazia**, e escrever a mensagem do zero, uma por uma, vinte e cinco
 * vezes, é o trabalho que não acontece.
 *
 * **O D+0 NÃO MANDA NINGUÉM PARA O GRUPO.** O manual diz "chamar para o canal", e
 * a leitura fácil disso é colar o convite do grupo — mas jogar quem acabou de
 * aparecer num grupo de oitenta pessoas é a receita do "entrei e não me senti
 * parte". A primeira mensagem é de gente para gente, e o que ela pede é
 * resposta: quem responde vira conversa, e conversa vira militante.
 *
 * O D+3 leva uma peça publicada da Munição, com a fonte junto — a mesma regra do
 * mutirão: número sem página de origem é boato. O D+7 leva o próximo encontro
 * com nome, data e o link de confirmar, porque convite sem data não é convite.
 */
function mensagem_de_funil(array $pessoa, array $evento, string $etapa): string
{
    $primeiro = primeiro_nome($pessoa['nome']);

    if ($etapa === 'd0') {
        return "Oi, {$primeiro}! Aqui é da Missão Ceará.\n\n"
            . "Passei para agradecer por você ter aparecido no *{$evento['titulo']}*. "
            . "Fez diferença ter mais gente lá.\n\n"
            . 'O que você achou? Quero saber de verdade — e se tiver alguma coisa '
            . 'no seu bairro que a gente devia estar olhando, me conta.';
    }

    if ($etapa === 'd3') {
        require_once __DIR__ . '/kit-comum.php';
        $pecas = pecas_publicadas();
        $texto = "Oi, {$primeiro}! Separei uma coisa que tem a ver com o que a gente conversou:\n\n";

        if ($pecas === []) {
            /* Sem peça publicada, o plano inteiro é o conteúdo. Melhor mandar o
               documento do que mandar uma mensagem sem nada dentro. */
            return $texto . 'O plano de governo, com meta, prazo e de onde vem o dinheiro de cada proposta:'
                . "\n" . raiz_do_site() . '/propostas';
        }

        $p = $pecas[0];
        return $texto . '*' . $p['numero'] . "* — {$p['frase']}\n"
            . "_{$p['fonte']}_\n\n"
            . 'Está tudo escrito aqui: ' . raiz_do_site() . $p['destino'];
    }

    /* d7 — convidar para o próximo, dizendo QUAL e QUANDO. */
    $proximo = null;
    foreach (eventos_a_vir() as $e) {
        if ($e['status'] !== 'cancelado') {
            $proximo = $e;
            break;
        }
    }
    if ($proximo === null) {
        /* Sem próximo encontro marcado não há convite honesto a fazer. Dizer
           "aparece no próximo" sem data é o convite que ninguém atende — e é
           melhor a coordenação ver isto e ir marcar um encontro. */
        return "Oi, {$primeiro}! Ainda não tenho a data do próximo encontro. "
            . 'Assim que fechar eu te aviso — e se quiser ajudar a organizar, me fala.';
    }

    $onde = $proximo['local'] !== '' ? ' · ' . $proximo['local'] : '';
    $link = url_confirmacao($proximo);
    return "Oi, {$primeiro}! O próximo é este:\n\n"
        . '*' . $proximo['titulo'] . "*\n"
        . data_cheia($proximo) . $onde . "\n\n"
        . ($link !== '' ? "Confirma aqui que você vem:\n" . $link : 'Você vem?');
}
