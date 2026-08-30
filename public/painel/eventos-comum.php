<?php
declare(strict_types=1);

/**
 * Os encontros — as cinco peças do manual, a lista de presença e o funil.
 *
 * Compartilhado entre a tela do painel (eventos.php), a página pública de
 * presença (api/presenca.php) e o hub. Só define coisas: quem inclui é que
 * decide se exige login — o endpoint público inclui sem exigir.
 *
 * DUAS PERMISSÕES, DE PROPÓSITO:
 *   'eventos' é a ferramenta do dia: marcar checklist, confirmar presença,
 *   cadastrar quem chegou na porta. Qualquer militante escalado precisa disso.
 *   'agenda' é a decisão: criar o encontro, cancelar, e ver a lista inteira com
 *   telefone. Quem cadastrou uma pessoa continua enxergando o telefone dela —
 *   foi essa pessoa que digitou o número, esconder dela não protege ninguém.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/checklists.php';
require_once __DIR__ . '/agenda-comum.php';  // o relógio, as cores e a publicação
require_once __DIR__ . '/pessoas-comum.php';  // a presença aponta para uma pessoa

const ARQ_EVENTOS = PASTA_DADOS . '/eventos.php';
const ARQ_PRESENCAS = PASTA_DADOS . '/presencas.php';

/** Versão do texto de consentimento da página pública de presença. */
const VERSAO_CONSENTIMENTO_PRESENCA = '1';

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
    ],
];

/** As cinco peças, e o checklist de cada uma (ids de checklists.php). */
const PECAS = [
    'local-hora' => ['nome' => 'Local & Hora', 'checklist' => 'local-hora'],
    'logistica'  => ['nome' => 'Logística',    'checklist' => 'logistica'],
    'divulgacao' => ['nome' => 'Divulgação',   'checklist' => 'divulgacao'],
    'gravacao'   => ['nome' => 'Gravação',     'checklist' => 'gravacao'],
    'recepcao'   => ['nome' => 'Recepção',     'checklist' => 'recepcao'],
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

    $responsaveis = [];
    $feitos = [];
    foreach (array_keys(PECAS) as $peca) {
        $responsaveis[$peca] = limpar_texto(($e['responsaveis'][$peca] ?? ''), 40);
        // índices marcados no checklist daquela peça
        $marcados = (array) ($e['feitos'][$peca] ?? []);
        $feitos[$peca] = array_values(array_unique(array_map('intval', array_filter($marcados, 'is_numeric'))));
        sort($feitos[$peca]);
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

/** Quanto do checklist de todas as peças já foi marcado. */
function preparo_do_evento(array $evento): array
{
    $total = 0;
    $feito = 0;
    foreach (PECAS as $chave => $peca) {
        $c = checklist($peca['checklist']);
        if ($c === null) {
            continue;
        }
        $total += count($c['itens']);
        $feito += count(array_filter(
            $evento['feitos'][$chave] ?? [],
            fn ($i) => $i >= 0 && $i < count($c['itens'])
        ));
    }
    return ['feito' => $feito, 'total' => $total];
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

/* ===================== presenças ===================== */

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

/* ===================== funil de follow-up ===================== */

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
    'd0' => 'Agradecer e chamar para o canal',
    'd3' => 'Mandar um conteúdo do interesse dela',
    'd7' => 'Convidar para o próximo encontro',
];

/* ===================== privacidade ===================== */

/**
 * Quem enxerga o telefone: a coordenação, e quem cadastrou aquela pessoa.
 *
 * Esconder de quem digitou o número não protegeria ninguém — a pessoa acabou de
 * ver o telefone para escrevê-lo. O que a regra evita é a lista inteira de
 * contatos ficar aberta para todo mundo que tem conta, e crescer junto com o
 * time. A lista COMPLETA, de todo mundo, é outra coisa: mora em /painel/pessoas
 * e pede a capacidade de administração.
 *
 * **A trava era `pode('agenda')`, e não travava nada.** A capacidade Eventos
 * concede `eventos` E `agenda` juntas, então todo mundo que a recebia pelo
 * caminho normal caía do lado de dentro — o número saía em link de WhatsApp
 * para quem só organiza encontro. O único jeito de cair do lado protegido era
 * ter `eventos` sem `agenda`, uma combinação que só sai do ajuste fino à mão.
 * Uma trava que só pega quem foi montado a dedo não é trava.
 *
 * Agora ela pergunta a capacidade, que é onde a decisão de fato mora:
 * **organizar um encontro não dá a agenda de telefones do movimento.** Quem
 * coordena o encontro continua vendo a lista inteira, com nome, bairro e
 * presença — o número é que fica encoberto, e o follow-up por WhatsApp é da
 * coordenação. `tem_capacidade()` já responde sim para `adm`.
 */
function pode_ver_telefone(array $presenca, ?array $eu): bool
{
    if ($eu === null) {
        return false;
    }
    return tem_capacidade('coordenacao')
        || ($presenca['criadoPorId'] !== '' && $presenca['criadoPorId'] === $eu['id']);
}

/**
 * "Maria da Silva Sauro" -> "Maria S." — o nome quando ele não é o assunto.
 *
 * A linha do tempo do hub contava "Fulana entrou na lista de tal encontro", com
 * o nome inteiro, para qualquer conta que abrisse `eventos`. Uma linha por
 * presença, todos os encontros juntos: rolando a página até o fim saía o
 * cadastro de quem já apareceu em algum encontro, sem passar por /painel/pessoas.
 *
 * O recado é sobre a Recepção estar funcionando, e para isso o primeiro nome
 * basta — quem precisa saber exatamente quem é abre o encontro. As partículas
 * do meio saem pelo mesmo motivo que saem do `login_sugerido()`: "de" não é
 * sobrenome de ninguém.
 */
function nome_encoberto(string $nome): string
{
    $partes = array_values(array_filter(explode(' ', trim($nome))));
    if ($partes === []) {
        return 'Alguém';
    }
    $sobrenomes = array_values(array_filter(
        array_slice($partes, 1),
        fn ($p) => !in_array(mb_strtolower($p), ['de', 'da', 'do', 'das', 'dos', 'e'], true),
    ));
    $ultimo = end($sobrenomes);
    return $partes[0] . ($ultimo === false ? '' : ' ' . mb_strtoupper(mb_substr($ultimo, 0, 1)) . '.');
}

/** 85912345678 -> (85) 9••••-••78 */
function telefone_encoberto(string $telefone): string
{
    $d = so_digitos($telefone);
    if (strlen($d) < 4) {
        return '•••';
    }
    return '(' . substr($d, 0, 2) . ') ' . substr($d, 2, 1) . '••••-••' . substr($d, -2);
}
