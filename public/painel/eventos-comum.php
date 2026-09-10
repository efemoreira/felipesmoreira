<?php
declare(strict_types=1);

/**
 * Os encontros — a data, o lugar, a família, o que vai para o site.
 *
 * Este arquivo inclui os três que saíram dele, então quem já o incluía não
 * mudou nada:
 *   escala-comum.php     as peças, o preparo, os convites (quem faz o encontro)
 *   presencas-comum.php  quem confirmou, quem veio, o funil de depois
 *   privacidade.php      quem vê nome e telefone — regra do movimento
 *
 * `normalizar_evento()` é a única resposta para "o que é um encontro válido",
 * e `ler/gravar_eventos()` a única porta para `dados/eventos.php`.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/privacidade.php';  // pode_ver_telefone(), nome_encoberto(), telefone_encoberto()
require_once __DIR__ . '/checklists.php';
require_once __DIR__ . '/agenda-comum.php';  // o relógio, as cores e a publicação
require_once __DIR__ . '/pessoas-comum.php';  // a presença aponta para uma pessoa
require_once __DIR__ . '/escala-comum.php';    // as peças, o preparo, os convites — quem faz o encontro acontecer
require_once __DIR__ . '/presencas-comum.php'; // quem esteve, e o funil de depois

const ARQ_EVENTOS = PASTA_DADOS . '/eventos.php';
/**
 * As cinco famílias da Parte 5 do manual. O que muda entre elas é o objetivo, a
 * trava e o material — a execução (som, convite, gravação, recepção) é sempre a
 * mesma das cinco peças.
 */
const FAMILIAS = [
    'publico' => [
        'nome'    => 'Público',
        'serve'   => 'Aparecer, dar volume, ocupar a rua',
        'exemplos' => 'Carreata, adesivaço, bandeiraço, caminhada, ato em praça',
        'travas'  => [
            'Segurança de trânsito, principalmente em carreata.',
            'Autorização ou aviso às autoridades quando exigido.',
            'Nada de bloqueio agressivo de via.',
            'Crítica à gestão em faixa e cartaz — nunca ofensa pessoal.',
            'Durante a campanha, nome e número estão liberados no material — respeitando horário, local e o que a lei permite distribuir.',
            'Antes da campanha, este formato só existe na versão encontro: sem pedir voto, sem número de urna, sem adesivo ou bandeira com número.',
        ],
        'material' => ['Som móvel ou carro de som', 'Coletes de identificação', 'Bandeiras', 'Água e kit de primeiros socorros', 'Ponto de apoio'],
        'metrica'  => 'Pessoas na rua · alcance do vídeo-resumo · contatos novos',
        /* A rua é a família com mais peças porque é onde mais gente trabalha ao
           mesmo tempo. Adesivagem e Fila & trânsito ficam FORA das essenciais:
           um bandeiraço não adesiva carro, e cobrar as duas em toda caminhada
           faria a lista de pendências apitar à toa — e lista que apita à toa é
           lista que se ignora. Elas continuam oferecidas, para o adesivaço. */
        'pecas'      => ['local-hora', 'logistica', 'divulgacao', 'material-rua', 'adesivagem', 'fila-transito', 'gravacao', 'captacao'],
        'essenciais' => ['local-hora', 'logistica', 'divulgacao', 'gravacao', 'captacao'],
    ],
    'militancia' => [
        'nome'    => 'Militância',
        'serve'   => 'Fortalecer e crescer a base por dentro',
        'exemplos' => 'Treinamento, formação, roda de conversa, confraternização',
        'travas'  => [
            'Ambiente acolhedor, sem panelinha.',
            'Todo novato sai com uma tarefa clara.',
            'Social não vira palanque.',
        ],
        'material' => ['Projetor ou TV para a formação', 'Lista de presença', 'Comida e bebida, no social'],
        'metrica'  => 'Militantes ativos · novos que assumiram função · presença recorrente',
        /* As cinco de sempre: aqui há porta, mesa e lista — é o formato para o
           qual as peças originais foram escritas. */
        'pecas'      => ['local-hora', 'logistica', 'divulgacao', 'gravacao', 'recepcao'],
        'essenciais' => ['local-hora', 'logistica', 'divulgacao', 'gravacao', 'recepcao'],
    ],
    'relacional' => [
        'nome'    => 'Relacional',
        'serve'   => 'Construir apoio com quem decide',
        'exemplos' => 'Café com lideranças, jantar com empresários, reunião com categoria',
        'travas'  => [
            'O caixa nunca se mistura: cada candidatura tem CNPJ, conta e prestação de contas próprios.',
            'Durante a campanha a captação é possível, só na janela e na forma legal, com prestação de contas. Antes da campanha não existe captação nenhuma.',
            'Zero promessa de cargo ou vantagem.',
            'Sem câmera aberta gravando conversa privada — registre só o autorizado.',
            'Interesse em apoiar com dinheiro não se combina na hora: anote e passe ao Financeiro.',
            'Porta-voz preparado: não improvisar número sem fonte.',
        ],
        'material' => ['Local reservado e discreto', 'Café ou coffee break', 'Material institucional de apresentação', 'Lista curada e curta'],
        'metrica'  => 'Lideranças engajadas · apoios concretos · agendas geradas',
        /* SEM GRAVAÇÃO, e não por esquecimento: a trava desta família diz "sem
           câmera aberta gravando conversa privada". Oferecer a peça seria a tela
           convidando para o que o playbook proíbe duas linhas acima. */
        'pecas'      => ['local-hora', 'logistica', 'divulgacao', 'recepcao'],
        'essenciais' => ['local-hora', 'divulgacao', 'recepcao'],
    ],
    'digital' => [
        'nome'    => 'Digital',
        'serve'   => 'Escalar barato, todo dia, com pouca gente',
        'exemplos' => 'Live, mutirão digital, card coordenado',
        'travas'  => [
            'Não espalhar fato que não passou pela Checagem.',
            'Nada de spam ou comportamento que derrube perfis do time.',
            'Responder crítica sem ofensa pessoal.',
        ],
        'material' => ['Roteiro da live', 'A peça do Design', 'Horário combinado do mutirão'],
        'metrica'  => 'Alcance · compartilhamentos · seguidores novos · comentários engajados',
        /* Não há lugar, não há material e não há porta: uma live tem hora,
           divulgação e registro. Recepção aqui era o exemplo mais visível da
           peça que existia sem trabalho por trás. */
        'pecas'      => ['divulgacao', 'gravacao'],
        'essenciais' => ['divulgacao', 'gravacao'],
    ],
    'pautado' => [
        'nome'    => 'Pautado',
        'serve'   => 'Gerar conteúdo forte indo ao local do problema',
        'exemplos' => 'Fila de hospital, obra parada, escola sem reforma',
        'travas'  => [
            'Fonte sempre: link e data do fato-âncora.',
            'Crítica institucional ao órgão — nunca ofensa pessoal.',
            'Não invadir, não constranger quem está no local.',
            'Não gravar criança sem autorização de quem é responsável.',
            'Regra do ledger: o mesmo responsável não é alvo principal dois dias seguidos.',
        ],
        'material' => ['Celular ou câmera com boa captação de áudio', 'O print do dado-âncora', 'Roteiro impresso'],
        'metrica'  => 'Vídeos gerados · alcance · resposta do órgão cobrado',
        /* Ir ao local e gravar. Não se convida ninguém para uma pauta, e por
           isso não há Divulgação: o que sai depois é peça de Produção. */
        'pecas'      => ['local-hora', 'logistica', 'gravacao'],
        'essenciais' => ['local-hora', 'gravacao'],
    ],
];

const STATUS_EVENTO = [
    'planejado'  => 'Planejado',
    'confirmado' => 'Confirmado',
    'realizado'  => 'Realizado',
    'cancelado'  => 'Cancelado',
];

/* ===================== eventos ===================== */

function normalizar_evento($e): ?array
{
    if (!is_array($e) || empty($e['id']) || empty($e['titulo'])) {
        return null;
    }
    $familia = (string) ($e['familia'] ?? 'militancia');
    if (!isset(FAMILIAS[$familia])) {
        $familia = 'militancia';
    }
    $status = (string) ($e['status'] ?? 'planejado');
    if (!isset(STATUS_EVENTO[$status])) {
        $status = 'planejado';
    }

    /* QUEM JÁ FOI CHAMADO PARA ESTE ENCONTRO — ids de pessoa, lista chapada.
       Não é por peça como os três abaixo: convidar para o encontro e escalar
       para uma peça são coisas diferentes. A fila de inscrições convida gente
       que ainda não tem conta e não tem peça nenhuma; a escala chama quem já
       está dentro para um trabalho.

       Existe para a segunda rodada não repetir gente e não pular gente — com
       setenta e dois na fila, "quem eu já chamei?" não se responde de memória. */
    $convidados = [];
    foreach ((array) ($e['convidados'] ?? []) as $id) {
        $id = limpar_texto($id, 40);
        if ($id !== '' && !in_array($id, $convidados, true)) {
            $convidados[] = $id;
        }
    }

    /* CADA PEÇA TEM UMA LISTA DE GENTE, e não uma pessoa.
       Num ato de rua a Captação e o Material não são um nome: são três, quatro,
       nas pontas do movimento de gente. Enquanto a peça guardava um id só, a
       escala de um evento grande era impossível de escrever — e o que não cabe
       na ferramenta acontece fora dela, no grito.

       O ACEITE É POR PESSOA, pelo mesmo motivo: com quatro escalados na mesma
       peça, "convidado" não diz quem respondeu. `aceites[peça][id]` e
       `convidadoEm[peça][id]`.

       FORMATO ANTIGO ENTRA SOZINHO. `responsaveis[peça] = 'id'` vira `['id']`, e
       o aceite solto que existia ao lado dele pertence a esse mesmo id — não há
       ambiguidade, porque antes só cabia uma pessoa. */
    $responsaveis = [];
    $feitos = [];
    $aceites = [];
    $convidadoEm = [];
    foreach (array_keys(PECAS) as $peca) {
        $crus = $e['responsaveis'][$peca] ?? [];
        $crus = is_array($crus) ? $crus : [$crus];
        $gente = [];
        foreach ($crus as $id) {
            $id = limpar_texto($id, 40);
            if ($id !== '' && !in_array($id, $gente, true)) {
                $gente[] = $id;
            }
        }
        $responsaveis[$peca] = $gente;

        // índices marcados no checklist daquela peça
        $marcados = (array) ($e['feitos'][$peca] ?? []);
        $feitos[$peca] = array_values(array_unique(array_map('intval', array_filter($marcados, 'is_numeric'))));
        sort($feitos[$peca]);

        /* A resposta de quem foi escalado. Fora da lista conhecida some — mesma
           régua de `status` e `familia` logo acima, e pelo mesmo motivo: o
           arquivo é gravado por várias telas e um valor estranho não pode virar
           um estado novo que nenhuma delas sabe desenhar.

           Resposta de quem não está mais na peça também some: o aceite é da
           dupla pessoa-peça, e quem saiu da escala não tem o que responder. */
        $aceiteCru = $e['aceites'][$peca] ?? [];
        if (!is_array($aceiteCru)) {
            $aceiteCru = $gente === [] ? [] : [$gente[0] => $aceiteCru];
        }
        $emCru = $e['convidadoEm'][$peca] ?? [];
        if (!is_array($emCru)) {
            $emCru = $gente === [] ? [] : [$gente[0] => $emCru];
        }

        $aceites[$peca] = [];
        $convidadoEm[$peca] = [];
        foreach ($gente as $id) {
            $estado = (string) ($aceiteCru[$id] ?? '');
            if (!in_array($estado, ESTADOS_ESCALA, true)) {
                continue;
            }
            $aceites[$peca][$id] = $estado;
            /* Quando o convite saiu — é daqui que sai a conta do silêncio. Sem o
               carimbo, "convidada e não respondeu" não teria idade, e a régua
               das 48h não teria de onde contar. */
            $convidadoEm[$peca][$id] = limpar_texto($emCru[$id] ?? '', 40);
        }
    }

    /* O INSTANTE MORA EM `inicio`, E O RESTO É DERIVADO DELE.
       `data` e `hora` continuam gravados porque o cartão da /programacao e o
       pôster os desenham — mas ninguém os digita: saem daqui, da mesma fonte,
       e por isso não há como divergirem. Encontro antigo, gravado antes de
       `inicio` existir, mantém o que tinha e cai no fim da lista. */
    $inicio = inicio_iso($e['inicio'] ?? '');
    if ($inicio !== '') {
        $partes = partes_de_exibicao($inicio);
        $data = $partes['data'];
        /* Meia-noite em ponto significa "o dia está marcado, a hora ainda não".
           É o que `inicio_de_dia_e_hora()` grava quando o campo de hora fica em
           branco, e mostrar "0H" no cartão seria anunciar um encontro à
           meia-noite — que não existe em campanha. O dia continua ordenando. */
        $hora = $partes['hora'] === '0H' ? '' : $partes['hora'];
    } else {
        $data = limpar_texto($e['data'] ?? '', 20);
        $hora = limpar_texto($e['hora'] ?? '', 10);
    }

    $cor = (string) ($e['cor'] ?? 'ouro');
    if (!isset(CORES[$cor])) {
        $cor = 'ouro';
    }
    $plataforma = (string) ($e['plataforma'] ?? '');
    if (!isset(PLATAFORMAS[$plataforma])) {
        $plataforma = '';
    }
    /* Encontro cadastrado antes de o filtro existir cai no padrão, que é o
       mesmo véu que a /presenca já desenhava: nada muda de aparência sozinho. */
    $filtro = (string) ($e['filtro'] ?? '');
    if (!isset(FILTROS[$filtro])) {
        $filtro = FILTRO_PADRAO;
    }

    return [
        'id'      => limpar_texto($e['id'], 40),
        'titulo'  => limpar_texto($e['titulo'], 120),
        'familia' => $familia,
        'inicio'  => $inicio,
        'data'    => $data,
        'hora'    => $hora,
        /* Vai para a /programacao? O padrão é SIM: o normal é o encontro ser
           público, e a exceção — a reunião fechada, o jantar com liderança — é
           quem desmarca. Padrão invertido faria a coordenação cadastrar o
           encontro e ele não aparecer, sem ninguém entender por quê. */
        'naAgenda'   => !isset($e['naAgenda']) || !empty($e['naAgenda']),
        'subtitulo'  => limpar_texto($e['subtitulo'] ?? '', 120),
        'cor'        => $cor,
        'plataforma' => $plataforma,
        'aoVivo'     => !empty($e['aoVivo']),
        'link'       => limpar_link($e['link'] ?? ''),
        'imagem'     => limpar_texto($e['imagem'] ?? '', 300),
        'filtro'     => $filtro,
        'local'   => limpar_texto($e['local'] ?? '', 120),
        'endereco' => limpar_texto($e['endereco'] ?? '', 200),
        'publicoEsperado' => max(0, (int) ($e['publicoEsperado'] ?? 0)),
        'orcamento'   => limpar_texto($e['orcamento'] ?? '', 60),
        'observacoes' => limpar_texto($e['observacoes'] ?? '', 600),
        'responsaveis' => $responsaveis,
        'feitos'       => $feitos,
        'aceites'      => $aceites,
        'convidadoEm'  => $convidadoEm,
        'convidados'   => $convidados,
        /* DOIS TOKENS, E NÃO UM.
           `token` é o da CHEGADA: vive só no QR impresso na mesa da recepção e
           grava "compareceu". `tokenConfirmacao` é o do "vou": circula no grupo
           e na /programacao, e grava só "confirmou".

           Um token para os dois faria qualquer pessoa com o link do grupo se
           marcar presente sem sair de casa — e é a lista de presença que
           alimenta o funil D+0/D+3/D+7. Nenhum dos dois é segredo; os dois são
           inadivinháveis. */
        'token'    => preg_replace('/[^a-f0-9]/', '', (string) ($e['token'] ?? '')) ?: '',
        'tokenConfirmacao' => preg_replace('/[^a-f0-9]/', '', (string) ($e['tokenConfirmacao'] ?? '')) ?: '',
        'status'   => $status,
        'criadoEm'  => limpar_texto($e['criadoEm'] ?? '', 40),
        'criadoPor' => limpar_texto($e['criadoPor'] ?? '', 60),
        /* O id do item de agenda que virou este encontro, na importação única.
           Serve só para a importação não rodar duas vezes — o array é literal,
           e campo fora dele some na próxima gravação. */
        'importadoDe' => limpar_texto($e['importadoDe'] ?? '', 60),
    ];
}

function ler_eventos(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_EVENTOS)) {
        $bruto = @include ARQ_EVENTOS;
        if (is_array($bruto)) {
            foreach ($bruto as $e) {
                if ($limpo = normalizar_evento($e)) {
                    $cache[] = $limpo;
                }
            }
        }
    }
    return $cache;
}

function gravar_eventos(array $eventos): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($eventos as $e) {
        if ($limpo = normalizar_evento($e)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_EVENTOS, $conteudo)) {
        return false;
    }
    ler_eventos(true);
    return true;
}

function achar_evento(string $id): ?array
{
    foreach (ler_eventos() as $e) {
        if ($e['id'] === $id) {
            return $e;
        }
    }
    return null;
}

/** O evento de um token da URL pública. Token vazio nunca casa. */
function evento_por_token(string $token): ?array
{
    $token = preg_replace('/[^a-f0-9]/', '', $token) ?? '';
    if ($token === '') {
        return null;
    }
    foreach (ler_eventos() as $e) {
        if ($e['token'] === $token) {
            return $e;
        }
    }
    return null;
}

/** O evento de um token de CONFIRMAÇÃO. Token vazio nunca casa. */
function evento_por_confirmacao(string $token): ?array
{
    $token = preg_replace('/[^a-f0-9]/', '', $token) ?? '';
    if ($token === '') {
        return null;
    }
    foreach (ler_eventos() as $e) {
        if ($e['tokenConfirmacao'] === $token) {
            return $e;
        }
    }
    return null;
}

function novo_id_evento(): string
{
    return bin2hex(random_bytes(8));
}

/**
 * O endereço que o QR da mesa da Recepção carrega.
 *
 * Absoluto de propósito: o QR sai do painel mas é lido por um celular que não
 * tem contexto nenhum — caminho relativo dentro de um QR não leva a lugar
 * nenhum. O host vem da requisição para o link funcionar igual no domínio de
 * verdade e no servidor de teste.
 */
function raiz_do_site(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'felipesmoreira.com');

    return ($https ? 'https' : 'http') . '://' . $host;
}

function url_presenca(array $evento): string
{
    if ($evento['token'] === '') {
        return '';
    }
    return raiz_do_site() . '/presenca?e=' . $evento['token'];
}

/**
 * A chave de ordenação de um encontro.
 *
 * Comparar `data` como texto ("29/07") era o defeito antigo da agenda: sem ano,
 * sem hora, e dois encontros no mesmo dia saíam em ordem aleatória. Agora sai do
 * instante. Encontro velho sem `inicio` cai no fim (a data mais alta possível),
 * que é onde ele já ficava.
 */
function quando_do_evento(array $e): int
{
    if ($e['inicio'] !== '' && ($t = strtotime($e['inicio'])) !== false) {
        return $t;
    }
    if ($e['data'] !== '' && ($t = strtotime($e['data'])) !== false) {
        return $t;
    }
    return PHP_INT_MAX;
}

/**
 * O link de "vou" — o que circula no grupo e sai na /programacao.
 *
 * Absoluto pela mesma razão do QR: ele vai colado numa mensagem de WhatsApp,
 * fora de qualquer página nossa, e caminho relativo ali não leva a lugar nenhum.
 */
function url_confirmacao(array $evento): string
{
    if ($evento['tokenConfirmacao'] === '') {
        return '';
    }
    return raiz_do_site() . '/presenca?c=' . $evento['tokenConfirmacao'];
}

/**
 * "24/08/2026 às 19H" — a data cheia, com o ANO, que só o instante tem.
 *
 * `data` é "24/08" e não diz o ano; `strtotime()` não o lê, então a versão
 * antiga caía sempre no plano B e a tela mostrava a data curta como se fosse a
 * cheia. O ano importa nas telas em que se confere se o encontro é o certo
 * antes de mexer nele.
 *
 * Fuso do Ceará, como manda `partes_de_exibicao()`: a Hostinger roda em UTC.
 */
function data_cheia(array $e): string
{
    $hora = $e['hora'] !== '' ? ' às ' . $e['hora'] : '';
    if ($e['inicio'] !== '') {
        try {
            $d = (new DateTimeImmutable($e['inicio']))->setTimezone(new DateTimeZone('America/Fortaleza'));
            return $d->format('d/m/Y') . $hora;
        } catch (Exception $erro) {
            // cai no texto legado abaixo
        }
    }
    // encontro antigo, sem instante: o que existe é o texto que digitaram
    return $e['data'] !== '' ? $e['data'] . $hora : 'sem data';
}

/**
 * Quem pode ser escalado numa peça do encontro.
 *
 * TODA pessoa ativa, e não só quem tem conta no painel: a Logística de um
 * encontro é muitas vezes de quem mora na rua do local e nunca abriu o painel.
 */
/**
 * As CONTAS ativas — quem trabalha no painel, e não o cadastro inteiro.
 *
 * O `tem_conta()` não estava aqui, e a diferença é a base toda: `ativo` é `true`
 * em ficha de gente que nunca teve login (é o padrão de quem foi cadastrada na
 * porta de um encontro), então o seletor de "quem responde por esta peça"
 * listava, num `<select>`, o nome de cada pessoa que já passou por um encontro
 * — para qualquer um que abrisse a aba Dados.
 *
 * Responsável por peça é sempre alguém que abre o painel: quem não tem conta
 * não tem como receber a tarefa, e o nome dela ali só servia para vazar o
 * cadastro numa tela que nem é sobre pessoas.
 */
function pessoas_ativas(): array
{
    return array_values(array_filter(ler_pessoas(), fn ($u) => $u['ativo'] && tem_conta($u)));
}

/** Eventos que ainda vão acontecer, do mais próximo para o mais distante. */
/**
 * Este encontro já aconteceu?
 *
 * A pergunta é DO RELÓGIO, e só dele. Cancelar é outra coisa: um encontro
 * cancelado para daqui a duas semanas não aconteceu — ele não vai acontecer, o
 * que é diferente, e a coordenação ainda precisa vê-lo para remarcar ou apagar.
 * Enquanto "cancelado" contava como "passado", ele sumia da lista de cima e ia
 * parar embaixo de "Já aconteceram", que é uma afirmação falsa sobre uma data
 * que nem chegou.
 *
 * SEM `inicio`, quem responde é `quando_do_evento()`. Ele lê o `data` quando
 * aquilo é uma data de verdade (encontro legado, gravado antes de `inicio`
 * existir) e devolve `PHP_INT_MAX` quando é o texto de exibição — "24/08", sem
 * ano e sem fuso, sobre o qual não dá para afirmar nada. Na dúvida o encontro
 * fica entre os que ainda vão acontecer: dizer que já aconteceu seria inventar
 * um passado. A comparação anterior confrontava esse texto com `date('Y-m-d')`
 * — "24/08" contra "2026-08-29" —, e o resultado não dependia da data nenhuma
 * vez: era sempre "futuro" numa lista e nunca "passado" na outra.
 */
function evento_ja_aconteceu(array $e): bool
{
    if ($e['inicio'] !== '') {
        return estado_do_evento($e['inicio']) === 'passado';
    }
    return quando_do_evento($e) < time();
}

/**
 * O que ainda vai acontecer DE VERDADE — sem os cancelados.
 *
 * É a resposta para "qual é o próximo encontro do movimento", e por isso o hub
 * e a mesa de Encontros bebem daqui: anunciar um encontro cancelado como o
 * próximo seria mandar gente para uma praça vazia.
 */
function eventos_proximos(): array
{
    return array_values(array_filter(eventos_a_vir(), fn ($e) => $e['status'] !== 'cancelado'));
}

/**
 * Tudo que ainda não aconteceu, cancelado inclusive — a lista da tela.
 *
 * A tela de Encontros pergunta outra coisa: "quais encontros existem daqui para
 * frente". O cancelado existe, aparece marcado como CANCELADO no cartão, e é
 * ali que alguém vai procurá-lo.
 */
function eventos_a_vir(): array
{
    $lista = array_values(array_filter(ler_eventos(), fn ($e) => !evento_ja_aconteceu($e)));
    usort($lista, fn ($a, $b) => quando_do_evento($a) <=> quando_do_evento($b));
    return $lista;
}

function eventos_passados(): array
{
    $lista = array_values(array_filter(ler_eventos(), 'evento_ja_aconteceu'));
    usort($lista, fn ($a, $b) => quando_do_evento($b) <=> quando_do_evento($a));
    return $lista;
}

/* ===================== o que vai para o site ===================== */

/**
 * O encontro visto de fora — o item que entra no `dados/agenda.json`.
 *
 * **Lista de permissão, e não de bloqueio.** O `agenda.json` é o ÚNICO arquivo
 * de /dados liberado pelo .htaccess: qualquer campo que caia aqui fica aberto
 * na internet. Enumerar o que sai (e não o que fica) é o que garante que um
 * campo novo no encontro nunca vaze por esquecimento — ele simplesmente não
 * aparece até alguém escrevê-lo nesta lista, de propósito.
 *
 * Por isso `endereco`, `orcamento`, `observacoes`, `responsaveis` e
 * `publicoEsperado` não estão aqui, e `local` está: o local é o nome público do
 * lugar ("Praça do Ferreira"), que é a informação de que o eleitor precisa; o
 * endereço completo pode ser a casa de alguém.
 */
function item_publico(array $e): array
{
    $item = [
        'id'         => $e['id'],
        'titulo'     => $e['titulo'],
        'subtitulo'  => $e['subtitulo'] !== '' ? $e['subtitulo'] : $e['local'],
        'inicio'     => $e['inicio'],
        'dia'        => '',
        'data'       => $e['data'],
        'hora'       => $e['hora'],
        'aoVivo'     => $e['aoVivo'],
        'cor'        => $e['cor'],
        'plataforma' => $e['plataforma'],
        'imagem'     => $e['imagem'],
        'link'       => $e['link'],
        'interno'    => $e['link'] !== '' && $e['link'][0] === '/',
    ];
    if ($e['inicio'] !== '') {
        $item['dia'] = partes_de_exibicao($e['inicio'])['dia'];
    }

    /* O "Vou" do cartão público. Só em encontro presencial que ainda vai
       acontecer: numa live o botão útil é o link da transmissão, que já está
       ali, e num encontro que passou confirmar presença não quer dizer nada. */
    if ($e['familia'] !== 'digital'
        && $e['tokenConfirmacao'] !== ''
        && estado_do_evento($e['inicio']) === 'futuro') {
        $item['confirmar'] = $e['tokenConfirmacao'];
    }
    return $item;
}

/** Os encontros que a /programacao mostra, na ordem. */
function itens_publicos(): array
{
    $lista = array_values(array_filter(
        ler_eventos(),
        fn ($e) => $e['naAgenda'] && $e['status'] !== 'cancelado'
    ));
    usort($lista, fn ($a, $b) => quando_do_evento($a) <=> quando_do_evento($b));
    return array_map('item_publico', $lista);
}

/**
 * Regrava o `dados/agenda.json` a partir dos encontros.
 *
 * Chamado a cada gravação de encontro, e não por um botão "publicar": editar o
 * encontro já exige coordenação, então não há revisão a mais para fazer — e
 * "esqueci de publicar" deixa de ser um jeito de o site ficar desatualizado.
 * A capa (título, período, chamada, canais) continua vindo do agenda.php.
 */
function republicar_agenda(): bool
{
    $agenda = agenda_atual();
    $agenda['programacao'] = itens_publicos();
    if (!publicar($agenda)) {
        return false;
    }
    /* A varredura olha TODOS os encontros, não só os publicados: o encontro
       fechado não entra no agenda.json e tem imagem do mesmo jeito. */
    varrer_imagens_orfas(array_column(ler_eventos(), 'imagem'));
    return true;
}

/* ===================== o que esta área diz ao Início ===================== */

/**
 * O que está esperando por esta pessoa em `eventos` — a fila do Início e o selo do menu.
 *
 * Chamada por `tarefas_de()` (agora.php) para quem abre a área; o formato de
 * cada item está documentado lá. Registrar aqui, e não numa cadeia de `if` no
 * agora.php, é o que faz uma área nova entrar na fila sem tocar o hub.
 */
function pendencias_eventos(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $tarefas = [];

        /* ---------- Encontros: o funil e o preparo ---------- */
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
                'quantos' => $quantos,
                'texto'   => $quantos === 1
                    ? 'Falar com ' . explode(' ', $primeiroLead['pessoa']['nome'])[0]
                    : "Fazer o follow-up de {$quantos} pessoas",
                'porque'  => mb_strtolower(ROTULO_FUNIL[$primeiraEtapa])
                    . ' — o passo venceu e lead sem segunda mensagem é lead perdido',
                /* A FILA, e não o encontro do primeiro da fila. Enquanto o
                   follow-up só existia dentro de um encontro, mandar para lá
                   era o melhor possível — e escondia as outras dezenove
                   pessoas, que estavam em outros encontros. Agora há uma tela
                   com todas. */
                'url'     => '/painel/eventos.php?aba=follow-up#funil',
            ];
        }

        /* ---------- A SUA peça, e não o preparo do encontro inteiro ----------
           Aqui morava o defeito que fazia todo mundo fazer tudo: a tarefa
           "Preparar <encontro>" disparava para QUALQUER conta com `eventos`, com
           o agregado das marcações de todas as peças. Ninguém era avisado de que
           era a Recepção; todos eram avisados de que o encontro precisava ser
           preparado — e no sábado cada um fazia o que dava com o que tinha.

           Agora quem executa recebe a peça que é dela, com o número dela. */
        foreach (eventos_proximos() as $e) {
            $faltam = dias_ate_o_dia($e['inicio']);
            if ($faltam !== null && $faltam > 7) {
                continue;  // ainda não é hora de cobrar
            }
            foreach (pecas_do_evento($e) as $chave) {
                if (!in_array($u['id'], $e['responsaveis'][$chave], true)) {
                    continue;
                }
                if (($e['aceites'][$chave][$u['id']] ?? '') === 'nao-posso') {
                    continue;  // ela já disse que não pode; cobrar seria insistir
                }
                $p = preparo_da_peca($e, $chave);
                if ($p['total'] > 0 && $p['feito'] >= $p['total']) {
                    continue;
                }
                $tarefas[] = [
                    'area'    => 'eventos',
                    'icone'   => 'ticket',
                    'urgente' => $faltam !== null && $faltam <= 2,
                    'texto'   => 'Você é ' . PECAS[$chave]['nome'] . ' em “' . apelido_curto($e['titulo'], 24) . '”',
                    'porque'  => $p['feito'] . ' de ' . $p['total'] . ' conferidos'
                        . ($faltam === null ? '' : ($faltam <= 0 ? ' — é hoje' : ($faltam === 1 ? ' — é amanhã' : " — faltam {$faltam} dias"))),
                    'url'     => '/painel/eventos.php?e=' . rawurlencode($e['id']) . '&aba=preparo#peca-' . $chave,
                ];
            }
        }

    return $tarefas;
}

/**
 * Os medidores de `eventos` — o retrato do time inteiro, para Leituras › Semana
 * e para a linha "A operação hoje" do Início. Formato em `panorama_de()`.
 */
function medidores_eventos(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $medidores = [];

        /* ---------- Encontros: o preparo do próximo e o funil ---------- */
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
               mão em vez de sair do degrau_de_prazo(). */
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

    return $medidores;
}

/** Uma linha sobre como está o trabalho em `eventos`, para a mesa do Início. */
function estado_eventos(array $u): string
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
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
