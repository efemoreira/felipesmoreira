<?php
declare(strict_types=1);

/**
 * A escala — as cinco peças de um encontro, quem cuida de cada uma, o preparo
 * e os convites.
 *
 * Saiu de `eventos-comum.php` porque é outro assunto: o encontro é a data, o
 * lugar e o que vai para o site; a escala é gente e trabalho em volta dele.
 * Eram 1500 linhas de quatro assuntos, e a regra de segurança que morava no
 * meio (`pode_ver_telefone()`) passou meses sem ninguém reler. Cada coisa no
 * seu arquivo é o que faz a próxima releitura acontecer.
 *
 * Não inclua este arquivo direto: `eventos-comum.php` inclui, e é ele que
 * todo mundo já inclui.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/checklists.php';  // checklist() — cada peça tem o seu "Pronto quando"

/**
 * O CATÁLOGO DE TODAS AS PEÇAS. Qual delas um encontro tem sai da FAMÍLIA, e não
 * daqui — ver `pecas_do_evento()`.
 *
 * Eram cinco, iguais para todo mundo: um jantar com empresários e um adesivaço
 * de setecentas pessoas recebiam Local & Hora, Logística, Divulgação, Gravação e
 * Recepção. Num adesivaço o trabalho real é distribuir bandeira e panfleto,
 * aplicar adesivo com balde de água e detergente, e organizar carro e fila —
 * nada disso existia aqui. **É a melhor explicação para nenhuma escala ter sido
 * preenchida em seis encontros:** ninguém escala uma lista de papéis que não
 * descreve o que está fazendo.
 *
 * As quatro novas saíram de um evento real, e não de dedução.
 */
const PECAS = [
    'local-hora'    => ['nome' => 'Local & Hora',    'checklist' => 'local-hora'],
    'logistica'     => ['nome' => 'Logística',       'checklist' => 'logistica'],
    'divulgacao'    => ['nome' => 'Divulgação',      'checklist' => 'divulgacao'],
    'material-rua'  => ['nome' => 'Material de rua', 'checklist' => 'material-rua'],
    'adesivagem'    => ['nome' => 'Adesivagem',      'checklist' => 'adesivagem'],
    'fila-transito' => ['nome' => 'Fila e trânsito', 'checklist' => 'fila-transito'],
    'gravacao'      => ['nome' => 'Gravação',        'checklist' => 'gravacao'],
    'recepcao'      => ['nome' => 'Recepção',        'checklist' => 'recepcao'],
    'captacao'      => ['nome' => 'Captação',        'checklist' => 'captacao'],
];

/**
 * A RESPOSTA DE QUEM FOI ESCALADO — o que faltava para a escala existir.
 *
 * `responsaveis[peça]` diz quem a coordenação escolheu; isto diz o que essa
 * pessoa respondeu. São coisas diferentes, e enquanto só a primeira existia a
 * escala era um bilhete que ninguém lia: o nome aparecia cinza ao lado da peça,
 * a pessoa nunca era avisada, e no sábado todo mundo fazia tudo com o que tinha.
 *
 * `''` é "escolhida e ainda não convidada" — o estado de quem a coordenação
 * marcou no `<select>` sem ter mandado nada. Não é a mesma coisa que
 * 'convidado', e a diferença é o que separa "esqueci de avisar" de "avisei e
 * ela não respondeu".
 */
const ESTADOS_ESCALA = ['convidado', 'topou', 'nao-posso'];

/** O que cada estado diz na tela, e o que ele cobra de quem coordena. */
const ROTULO_ESCALA = [
    ''           => 'sem convite',
    'convidado'  => 'convidada, sem resposta',
    'topou'      => 'topou',
    'nao-posso'  => 'não pode dessa vez',
];

/**
 * A partir de quando o silêncio conta como recusa.
 *
 * Convite sem resposta na véspera não é convite pendente: é peça sem dono que
 * ainda não se sabe. Escala que dá falsa segurança quebra pior que improviso —
 * quem coordena precisa recolocar a peça enquanto ainda dá tempo.
 */
const HORAS_SILENCIO_ESCALA = 48;

/**
 * O TOKEN DO CONVITE DE ESCALA — derivado, e não guardado.
 *
 * Mesmo padrão do QR de presença e do convite do Dia 0: sai do segredo do site
 * e dos três dados que identificam o convite, então o servidor recalcula em vez
 * de armazenar. Não há tabela de convites para envelhecer, e trocar a pessoa de
 * peça invalida o link antigo sozinho.
 *
 * O id da pessoa vai na URL junto do token porque o token não é reversível —
 * ele é assinatura, não chave. Id de pessoa não é segredo; o que o token
 * impede é alguém responder no lugar de outra.
 */
function token_de_escala(string $pessoaId, string $eventoId, string $peca): string
{
    return substr(hash_hmac('sha256', "escala:{$pessoaId}|{$eventoId}|{$peca}", segredo()), 0, 24);
}

/** O link que a pessoa abre para dizer se topa. Vazio quando falta dado. */
function url_do_convite(array $pessoa, array $evento, string $peca): string
{
    if ($pessoa['id'] === '' || $evento['id'] === '' || !isset(PECAS[$peca])) {
        return '';
    }
    return raiz_do_site() . '/convite?p=' . rawurlencode($pessoa['id'])
        . '&e=' . rawurlencode($evento['id'])
        . '&f=' . rawurlencode($peca)
        . '&t=' . token_de_escala($pessoa['id'], $evento['id'], $peca);
}

/**
 * O CONVITE DE UMA PEÇA, pronto para o WhatsApp.
 *
 * **Os itens do checklist vão NO CORPO da mensagem**, e não atrás de um link.
 * Quem recebe precisa saber o tamanho do que está aceitando antes de responder,
 * e "abra o painel para ver o que é" é exatamente o pedido que ninguém atende.
 * São quatro ou cinco linhas — cabe.
 *
 * A escala existia no banco e nunca chegava em ninguém: o nome aparecia cinza
 * ao lado da peça, na tela do encontro, e a pessoa não era avisada. No sábado,
 * todo mundo fazia tudo com o que tinha.
 */
function mensagem_de_escala(array $pessoa, array $evento, string $peca): string
{
    $lista = checklist(PECAS[$peca]['checklist'] ?? '');
    $quando = data_cheia($evento);
    $onde = $evento['local'] !== '' ? ' · ' . $evento['local'] : '';

    $texto = primeiro_nome($pessoa['nome']) . ', posso te escalar como *'
           . PECAS[$peca]['nome'] . "*?\n\n"
           . '*' . $evento['titulo'] . "*\n"
           . $quando . $onde . "\n\n";

    if ($lista !== null) {
        $texto .= 'É isto, ' . count($lista['itens']) . " coisas:\n";
        foreach ($lista['itens'] as $item) {
            $texto .= '· ' . $item . "\n";
        }
        $texto .= "\n";
    }

    $link = url_do_convite($pessoa, $evento, $peca);
    if ($link === '') {
        return $texto . 'Topa? Me responde aqui — se não puder dessa vez, tudo bem, só me avisa para eu chamar outra pessoa.';
    }
    /* O LINK EVITA A COBRANÇA DE VOLTA. Sem ele, quem coordena manda o convite,
       espera a resposta no WhatsApp e ainda tem de vir marcar no painel — três
       passos para uma pessoa, vezes nove peças. Com ele a resposta chega
       sozinha, e quem coordena só olha o que ficou sem. */
    return $texto . "Topa? Responde aqui em um toque:\n" . $link
        . "\n\nSe não puder dessa vez, tudo bem — é só dizer que não, ali mesmo.";
}

/**
 * A ESCALA INTEIRA EM TEXTO, para colar no grupo.
 *
 * É a saída que mais importa, porque a organização acontece no WhatsApp e vai
 * continuar acontecendo: o painel não é onde o trabalho é feito, é de onde sai a
 * mensagem. Uma tela que exige entrar nela para saber quem faz o quê no sábado
 * perde para uma mensagem no grupo, sempre.
 *
 * PEÇA SEM NINGUÉM SAI COMO "falta alguém", e isso é metade do valor: é o pedido
 * de voluntário se escrevendo sozinho, no lugar em que as pessoas já estão.
 */
function escala_em_texto(array $evento): string
{
    $linhas = ['*' . $evento['titulo'] . '*', data_cheia($evento)
        . ($evento['local'] !== '' ? ' · ' . $evento['local'] : ''), ''];

    foreach (pecas_do_evento($evento) as $chave) {
        $nomes = [];
        foreach ($evento['responsaveis'][$chave] as $id) {
            $p = achar_pessoa($id);
            if ($p === null) {
                continue;
            }
            $estado = $evento['aceites'][$chave][$id] ?? '';
            /* Quem recusou sai da linha: o grupo precisa ler quem VAI estar lá.
               Manter o nome riscado transformaria o recado numa ata. */
            if ($estado !== 'nao-posso') {
                $nomes[] = primeiro_nome($p['nome']);
            }
        }
        $linhas[] = PECAS[$chave]['nome'] . ' — '
            . ($nomes === [] ? '_falta alguém_' : implode(', ', $nomes));
    }

    return implode("\n", $linhas);
}

/**
 * AS PEÇAS DESTE ENCONTRO — as da família, mais o que já tem gente ou marca.
 *
 * A família decide, e não o catálogo: uma live não tem porta e um jantar com
 * empresários não tem câmera. Enquanto as cinco valiam para todos, metade das
 * peças de qualquer encontro era trabalho que ninguém ia fazer — e uma lista em
 * que metade não se aplica não se lê, se ignora.
 *
 * **O QUE JÁ TEM DONO OU MARCA NUNCA SOME**, mesmo fora da família. Encontro
 * antigo foi criado quando as cinco valiam para todos; fazer o nome de quem foi
 * escalado desaparecer da tela porque a régua mudou seria apagar trabalho de
 * alguém sem avisar. A ordem é a de `PECAS`, sempre.
 */
function pecas_do_evento(array $evento): array
{
    $daFamilia = FAMILIAS[$evento['familia']]['pecas'] ?? array_keys(PECAS);
    return array_values(array_filter(
        array_keys(PECAS),
        fn ($c) => in_array($c, $daFamilia, true)
            || ($evento['responsaveis'][$c] ?? []) !== []
            || ($evento['feitos'][$c] ?? []) !== []
    ));
}

/**
 * As peças que a família COBRA — as que, sem dono, são pendência de verdade.
 *
 * Sai da regra de ouro do manual: todo evento precisa gerar conteúdo e captar
 * contato. O resto varia. Adesivagem num bandeiraço é peça oferecida e não
 * cobrada — quem faz adesivaço escala, quem faz caminhada ignora, e nenhum dos
 * dois recebe um alarme falso toda semana.
 */
function pecas_essenciais_do_evento(array $evento): array
{
    $familia = FAMILIAS[$evento['familia']] ?? [];
    $cobradas = $familia['essenciais'] ?? $familia['pecas'] ?? array_keys(PECAS);
    return array_values(array_intersect(pecas_do_evento($evento), $cobradas));
}

/**
 * Quanto do checklist de UMA peça já foi marcado.
 *
 * É esta a conta que interessa a quem executa: quem é a Recepção não tem o que
 * fazer com "3 de 15", que soma o trabalho de outras quatro pessoas. O agregado
 * continua existindo logo abaixo, para quem coordena — mas ele passou a ser a
 * soma desta, e não uma segunda régua escrita à parte.
 */
function preparo_da_peca(array $evento, string $chave): array
{
    $c = checklist(PECAS[$chave]['checklist'] ?? '');
    if ($c === null) {
        return ['feito' => 0, 'total' => 0];
    }
    $feito = count(array_filter(
        $evento['feitos'][$chave] ?? [],
        fn ($i) => $i >= 0 && $i < count($c['itens'])
    ));
    return ['feito' => $feito, 'total' => count($c['itens'])];
}

/** Quanto do checklist de todas as peças já foi marcado. */
function preparo_do_evento(array $evento): array
{
    $total = 0;
    $feito = 0;
    foreach (pecas_do_evento($evento) as $chave) {
        $p = preparo_da_peca($evento, $chave);
        $total += $p['total'];
        $feito += $p['feito'];
    }
    return ['feito' => $feito, 'total' => $total];
}

/**
 * As peças que não têm ninguém — as chaves, na ordem de PECAS.
 *
 * Até aqui "sem dono" era um texto cinza ao lado da peça, que não cobrava nada
 * de ninguém: dava para chegar no sábado com cinco peças vazias sem que uma só
 * tela tivesse reclamado.
 */
function pecas_sem_dono(array $evento): array
{
    return array_values(array_filter(
        pecas_do_evento($evento),
        fn ($chave) => ($evento['responsaveis'][$chave] ?? []) === []
    ));
}

/**
 * As peças cujo convite foi mandado e ainda não voltou.
 *
 * Devolve `[chave, horasEsperando]` por peça, das mais antigas para as mais
 * novas — a ordem de quem precisa ser recolocado primeiro.
 *
 * SÓ CONTA QUEM FOI CONVIDADO DE VERDADE. Peça com nome escolhido no `<select>`
 * e convite nunca mandado não é silêncio da pessoa, é esquecimento de quem
 * coordena — e as duas coisas pedem ações diferentes: uma manda o convite, a
 * outra procura substituto. Misturá-las devolveria uma lista em que a coluna
 * "esperando há 6 dias" às vezes quer dizer "ninguém falou com ela".
 */
function convites_sem_resposta(array $evento): array
{
    $fila = [];
    foreach (pecas_do_evento($evento) as $chave) {
        foreach (($evento['aceites'][$chave] ?? []) as $id => $estado) {
            if ($estado !== 'convidado') {
                continue;
            }
            $quando = strtotime((string) ($evento['convidadoEm'][$chave][$id] ?? ''));
            $fila[] = [$chave, (string) $id, $quando ? (int) floor((time() - $quando) / 3600) : 0];
        }
    }
    usort($fila, fn ($a, $b) => $b[2] <=> $a[2]);
    return $fila;
}

/**
 * As peças que a coordenação ainda precisa resolver: sem dono, sem resposta há
 * tempo demais, ou recusadas.
 *
 * As três viram a MESMA pendência de propósito — em todas elas a peça está sem
 * ninguém garantido, e o trabalho é o mesmo: achar alguém. Separá-las em três
 * listas faria quem coordena ler três telas para responder uma pergunta só.
 */
function pecas_a_resolver(array $evento): array
{
    /* SEM NINGUÉM só conta pelas essenciais: Adesivagem vazia num bandeiraço
       não é pendência, é peça que aquele formato não usa. */
    $abertas = array_values(array_intersect(pecas_sem_dono($evento), pecas_essenciais_do_evento($evento)));

    foreach (pecas_do_evento($evento) as $chave) {
        $gente = $evento['responsaveis'][$chave] ?? [];
        if ($gente === []) {
            continue;
        }
        /* TODO MUNDO RECUSOU: a peça tem nomes e não tem ninguém. É diferente
           de uma recusa entre quatro escalados, que não deixa a peça órfã — e
           tratar as duas igual encheria a lista de pendência que já se resolveu
           sozinha. */
        $recusas = 0;
        foreach ($gente as $id) {
            $recusas += ($evento['aceites'][$chave][$id] ?? '') === 'nao-posso' ? 1 : 0;
        }
        if ($recusas === count($gente)) {
            $abertas[] = $chave;
        }
    }

    /* SILÊNCIO LONGO DEMAIS. Convite sem resposta na véspera não é convite
       pendente: é peça sem dono que ainda não se sabe, e quem coordena precisa
       recolocar enquanto dá tempo. */
    foreach (convites_sem_resposta($evento) as [$chave, , $horas]) {
        if ($horas >= HORAS_SILENCIO_ESCALA) {
            $abertas[] = $chave;
        }
    }

    /* Na ordem de PECAS, e sem repetir: a lista é para ler, não para contar. */
    return array_values(array_filter(pecas_do_evento($evento), fn ($c) => in_array($c, $abertas, true)));
}

/**
 * DE ONDE VEM GENTE PARA UMA PEÇA QUE NASCEU DEPOIS DAS INSCRIÇÕES.
 *
 * A Captação é a Recepção da rua — mesmo trabalho, cenário diferente. Ela não
 * existia no catálogo quando vinte e nove pessoas escolheram Recepção, e elas
 * escolheram a coisa mais próxima que havia. Sugerir escala olhando só para
 * quem pediu `captacao` devolveria lista vazia justamente na peça com mais
 * voluntários.
 *
 * Uma entrada só, e de propósito: viveiro é para função que MUDOU DE NOME ou
 * que se dividiu, não para parecença. "Quem faz Logística também carrega
 * bandeira" é palpite, e palpite aqui vira gente convidada para um trabalho que
 * ela não pediu.
 */
const VIVEIRO_DA_PECA = [
    'captacao' => ['recepcao'],
];

/**
 * QUEM PEDIU ESTA PEÇA — o inverso de `peca_da_pessoa()` (agora.php).
 *
 * Os ids das funções de Eventos no `funcoes.json` são exatamente as chaves de
 * `PECAS`, e é esse casamento que faz o sistema já saber quem quer receber gente
 * na porta sem perguntar nada a ninguém. Faltava a pergunta na direção contrária.
 *
 * Mora aqui, e não em `pessoas-comum.php`, porque a pergunta é sobre PEÇA: quem
 * conhece `PECAS` e o viveiro é este arquivo, e `pessoas-comum` é incluído por
 * ele — não o contrário.
 *
 * Só gente ativa: sugerir quem saiu do movimento devolve uma peça que parece
 * resolvida e não está.
 */
function quem_pediu_a_peca(string $chave): array
{
    $aceitas = array_merge([$chave], VIVEIRO_DA_PECA[$chave] ?? []);
    return array_values(array_filter(
        ler_pessoas(),
        fn ($p) => $p['ativo'] && array_intersect($aceitas, $p['funcoes']) !== []
    ));
}

/**
 * Quantas vezes cada pessoa já foi escalada, em todos os encontros.
 *
 * É o desempate da sugestão. Sem ele a lista sai sempre na mesma ordem e a
 * mesma pessoa leva todos os sábados enquanto vinte e oito esperam ser
 * chamadas — que é a forma mais rápida de queimar quem topou primeiro.
 */
function vezes_escaladas(): array
{
    $conta = [];
    foreach (ler_eventos() as $e) {
        foreach (($e['responsaveis'] ?? []) as $gente) {
            foreach ((array) $gente as $id) {
                $conta[$id] = ($conta[$id] ?? 0) + 1;
            }
        }
    }
    return $conta;
}

/**
 * A ESCALA PROPOSTA — quem pediu cada peça, um nome por peça.
 *
 * A primeira versão disto copiava o time do encontro anterior, e não tinha de
 * onde copiar: em seis encontros, nenhuma peça foi escalada uma única vez.
 * Partida a frio. A semente certa estava do outro lado do sistema o tempo todo
 * — **oitenta e um por cento das pessoas escolheram função ao se inscrever**, e
 * ninguém nunca as chamou.
 *
 * UM NOME POR PEÇA, e não quantos couberem: o sistema não sabe quantas pessoas
 * um ato precisa em cada peça, e chutar encheria a escala de gente convidada por
 * engano. A peça aceita vários; a sugestão abre com um, e quem coordena
 * acrescenta olhando o tamanho do evento.
 *
 * NÃO PROPÕE QUEM JÁ ESTÁ NESTE ENCONTRO, nem em outra peça: uma pessoa não
 * cobre dois postos ao mesmo tempo, e ver o próprio nome em duas linhas da
 * escala é a leitura que faz alguém deixar de confiar nela.
 */
function escala_sugerida(array $evento): array
{
    $vezes = vezes_escaladas();
    $tomados = [];
    foreach (($evento['responsaveis'] ?? []) as $gente) {
        foreach ((array) $gente as $id) {
            $tomados[] = $id;
        }
    }

    $sugestao = [];
    foreach (pecas_do_evento($evento) as $chave) {
        if (($evento['responsaveis'][$chave] ?? []) !== []) {
            continue;  // já tem gente: a sugestão não mexe em escala feita
        }
        $candidatos = array_values(array_filter(
            quem_pediu_a_peca($chave),
            fn ($p) => !in_array($p['id'], $tomados, true)
        ));
        if ($candidatos === []) {
            continue;
        }
        /* Menos escalada primeiro; empate pelo nome, para a ordem ser estável
           entre duas aberturas da mesma tela. */
        usort($candidatos, fn ($a, $b) => [$vezes[$a['id']] ?? 0, $a['nome']] <=> [$vezes[$b['id']] ?? 0, $b['nome']]);
        $escolhida = $candidatos[0];
        $sugestao[$chave] = [$escolhida['id']];
        $tomados[] = $escolhida['id'];
    }
    return $sugestao;
}

/**
 * O que está esperando por esta pessoa em `agenda` — a fila do Início e o selo do menu.
 *
 * Chamada por `tarefas_de()` (agora.php) para quem abre a área; o formato de
 * cada item está documentado lá. Registrar aqui, e não numa cadeia de `if` no
 * agora.php, é o que faz uma área nova entrar na fila sem tocar o hub.
 */
function pendencias_agenda(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $tarefas = [];

        /* ---------- A escala furada — só de quem coordena ----------
           `pecas_a_resolver()` junta as três situações numa pendência só, porque em
           todas elas a peça está sem ninguém garantido e o trabalho é o mesmo: achar
           alguém. Sem isto a escala existia e ninguém era cobrado por ela — que foi
           exatamente como seis encontros seguidos aconteceram com zero peças
           escaladas, sem uma única tela reclamar. */
        require_once __DIR__ . '/eventos-comum.php';

        foreach (eventos_proximos() as $e) {
            $abertas = pecas_a_resolver($e);
            if ($abertas === []) {
                continue;
            }
            $faltam = dias_ate_o_dia($e['inicio']);
            if ($faltam !== null && $faltam > 14) {
                continue;
            }
            $quantas = count($abertas);
            $tarefas[] = [
                'area'    => 'eventos',
                'icone'   => 'users',
                'urgente' => $faltam !== null && $faltam <= 3,
                'quantos' => $quantas,
                'texto'   => $quantas === 1
                    ? PECAS[$abertas[0]]['nome'] . ' sem ninguém em “' . apelido_curto($e['titulo'], 22) . '”'
                    : $quantas . ' peças sem ninguém em “' . apelido_curto($e['titulo'], 22) . '”',
                'porque'  => 'sem dono, recusada ou convidada sem resposta'
                    . ($faltam === null ? '' : ($faltam <= 0 ? ' — é hoje' : " — faltam {$faltam} dias")),
                'url'     => '/painel/eventos.php?e=' . rawurlencode($e['id']) . '&aba=dados#dados',
            ];
            break;  // um encontro por vez: a fila não é a agenda
        }

    return $tarefas;
}
