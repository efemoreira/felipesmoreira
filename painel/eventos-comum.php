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

const ARQ_EVENTOS = PASTA_DADOS . '/eventos.php';
const ARQ_LEADS   = PASTA_DADOS . '/leads.php';

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

/** As classes de lead do funil (Parte 6). */
const CLASSES_LEAD = [
    'curioso'      => 'Curioso',
    'simpatizante' => 'Simpatizante',
    'militante'    => 'Militante',
    'apoiador'     => 'Apoiador ou liderança',
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

/** Eventos que ainda vão acontecer, do mais próximo para o mais distante. */
function eventos_proximos(): array
{
    $lista = array_values(array_filter(
        ler_eventos(),
        fn ($e) => $e['status'] !== 'cancelado'
            && estado_do_evento($e['inicio']) !== 'passado'
            && ($e['inicio'] !== '' || $e['data'] === '' || $e['data'] >= date('Y-m-d'))
    ));
    usort($lista, fn ($a, $b) => quando_do_evento($a) <=> quando_do_evento($b));
    return $lista;
}

function eventos_passados(): array
{
    $lista = array_values(array_filter(
        ler_eventos(),
        fn ($e) => $e['status'] === 'cancelado'
            || estado_do_evento($e['inicio']) === 'passado'
            || ($e['inicio'] === '' && $e['data'] !== '' && $e['data'] < date('Y-m-d'))
    ));
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

/* ===================== pessoas do evento ===================== */

/**
 * Uma lista só por evento, e não duas.
 *
 * O manual tem duas planilhas — RSVP (da Divulgação) e leads (da Recepção) —
 * mas elas descrevem a mesma pessoa em dois momentos: convidada e depois
 * presente. Duas listas viram trabalho dobrado e nome repetido; aqui a mesma
 * ficha ganha "confirmou" e "compareceu".
 */
function normalizar_lead($l): ?array
{
    if (!is_array($l) || empty($l['id']) || empty($l['nome'])) {
        return null;
    }
    $classe = (string) ($l['classe'] ?? 'curioso');
    if (!isset(CLASSES_LEAD[$classe])) {
        $classe = 'curioso';
    }

    $funil = [];
    foreach (['d0', 'd3', 'd7'] as $etapa) {
        $funil[$etapa] = limpar_texto($l['funil'][$etapa] ?? '', 40);
    }

    return [
        'id'       => limpar_texto($l['id'], 40),
        'eventoId' => limpar_texto($l['eventoId'] ?? '', 40),
        'nome'     => limpar_texto($l['nome'], 80),
        'telefone' => so_digitos($l['telefone'] ?? ''),
        'bairro'   => limpar_texto($l['bairro'] ?? '', 60),
        'cidade'   => limpar_texto($l['cidade'] ?? '', 60),
        'convidadoPor' => limpar_texto($l['convidadoPor'] ?? '', 60),
        'classe'   => $classe,
        'observacao' => limpar_texto($l['observacao'] ?? '', 300),
        'confirmou'  => !empty($l['confirmou']),
        'compareceu' => !empty($l['compareceu']),
        // 'qr' quando a pessoa se cadastrou sozinha na porta; 'painel' quando alguém digitou
        'origem'   => in_array($l['origem'] ?? 'painel', ['qr', 'painel'], true) ? $l['origem'] : 'painel',
        /* Quando a ficha é de alguém que TEM conta no painel.
           Sem isto, o militante escalado para trabalhar no encontro não
           aparecia na lista de quem foi — ele não lê o QR da mesa, ele está
           atrás dela. E aí o relatório dizia que o encontro teve menos gente do
           que teve, justamente esquecendo quem fez o encontro acontecer. */
        'usuarioId'   => limpar_texto($l['usuarioId'] ?? '', 40),
        'criadoPorId' => limpar_texto($l['criadoPorId'] ?? '', 40),
        'criadoEm'    => limpar_texto($l['criadoEm'] ?? '', 40),
        'consentimentoEm'     => limpar_texto($l['consentimentoEm'] ?? '', 40),
        'consentimentoVersao' => limpar_texto($l['consentimentoVersao'] ?? '', 20),
        'funil'    => $funil,
    ];
}

function ler_leads(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_LEADS)) {
        $bruto = @include ARQ_LEADS;
        if (is_array($bruto)) {
            foreach ($bruto as $l) {
                if ($limpo = normalizar_lead($l)) {
                    $cache[] = $limpo;
                }
            }
        }
    }
    return $cache;
}

function gravar_leads(array $leads): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($leads as $l) {
        if ($limpo = normalizar_lead($l)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo site. Dado pessoal — não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_LEADS, $conteudo)) {
        return false;
    }
    ler_leads(true);
    return true;
}

function leads_do_evento(string $eventoId): array
{
    $lista = array_values(array_filter(ler_leads(), fn ($l) => $l['eventoId'] === $eventoId));
    usort($lista, fn ($a, $b) => strcmp($a['nome'], $b['nome']));
    return $lista;
}

function novo_id_lead(): string
{
    return bin2hex(random_bytes(8));
}

/**
 * Todas as fichas daquele telefone, de QUALQUER encontro.
 *
 * `lead_por_telefone()` só olha dentro de um evento, que é o certo para o
 * dedupe. Esta olha o histórico inteiro — é o que permite a pessoa que já veio
 * a cinco encontros digitar só o WhatsApp e não redigitar nome, bairro e cidade
 * pela sexta vez.
 */
function presencas_por_telefone(string $telefone): array
{
    $telefone = so_digitos($telefone);
    if ($telefone === '') {
        return [];
    }
    return array_values(array_filter(ler_leads(), fn ($l) => $l['telefone'] === $telefone));
}

/** Mesmo telefone não entra duas vezes no mesmo evento. */
function lead_por_telefone(string $eventoId, string $telefone): ?array
{
    $telefone = so_digitos($telefone);
    if ($telefone === '') {
        return null;
    }
    foreach (ler_leads() as $l) {
        if ($l['eventoId'] === $eventoId && $l['telefone'] === $telefone) {
            return $l;
        }
    }
    return null;
}

/**
 * A ficha DAQUELA PESSOA neste encontro — telefone e nome juntos.
 *
 * `lead_por_telefone()` responde "este número já está aqui?", que é a pergunta
 * certa para não duplicar. Mas quando duas pessoas dividem o celular (casa,
 * casal), ela devolve a primeira das duas — e marcar presença pela escolha da
 * tela acabava marcando a pessoa errada. Aqui o nome entra na chave.
 */
function lead_da_pessoa(string $eventoId, string $telefone, string $nome): ?array
{
    $telefone = so_digitos($telefone);
    $alvo = mb_strtolower(sem_acento($nome));
    if ($telefone === '' || $alvo === '') {
        return null;
    }
    foreach (ler_leads() as $l) {
        if ($l['eventoId'] === $eventoId
            && $l['telefone'] === $telefone
            && mb_strtolower(sem_acento($l['nome'])) === $alvo) {
            return $l;
        }
    }
    return null;
}

/**
 * As pessoas do movimento vistas de cima, agrupadas por telefone.
 *
 * A lista por encontro responde "quem veio nesse". Esta responde as perguntas
 * que só existem no conjunto: quem nunca falta, quem confirma e não aparece,
 * quem veio uma vez e sumiu. São elas que dizem em quem investir o convite.
 *
 * O agrupamento é por telefone + nome, e não só por telefone: casa que divide
 * celular tem duas pessoas no mesmo número, e somá-las inventaria um militante
 * que vai a tudo.
 */
function pessoas_agrupadas(): array
{
    $eventos = [];
    foreach (ler_eventos() as $e) {
        $eventos[$e['id']] = $e;
    }

    $por = [];
    foreach (ler_leads() as $l) {
        $evento = $eventos[$l['eventoId']] ?? null;
        if ($evento === null || $evento['status'] === 'cancelado') {
            continue;
        }
        $chave = $l['telefone'] . '|' . mb_strtolower(sem_acento($l['nome']));
        if (!isset($por[$chave])) {
            $por[$chave] = [
                'nome' => $l['nome'], 'telefone' => $l['telefone'],
                'bairro' => $l['bairro'], 'cidade' => $l['cidade'],
                'classe' => $l['classe'], 'criadoPorId' => $l['criadoPorId'],
                'usuarioId' => $l['usuarioId'],
                'veio' => 0, 'confirmou' => 0, 'faltou' => 0, 'convites' => 0,
                'ultimo' => '',
            ];
        }
        $r = &$por[$chave];
        $r['convites']++;
        if ($l['compareceu']) {
            $r['veio']++;
            /* O último em que ela apareceu, para saber há quanto tempo sumiu. */
            $quando = $evento['inicio'] !== '' ? $evento['inicio'] : $evento['data'];
            if ($quando > $r['ultimo']) {
                $r['ultimo'] = $quando;
            }
        } elseif ($l['confirmou']) {
            $r['faltou']++;
        }
        if ($l['confirmou']) {
            $r['confirmou']++;
        }
        /* A ficha mais recente manda no bairro/cidade: se a pessoa se mudou, foi
           na última vez que ela disse onde mora. */
        if ($l['bairro'] !== '') {
            $r['bairro'] = $l['bairro'];
        }
        if ($l['cidade'] !== '') {
            $r['cidade'] = $l['cidade'];
        }
        if ($l['usuarioId'] !== '') {
            $r['usuarioId'] = $l['usuarioId'];
        }
        unset($r);
    }

    /* Quem mais vem primeiro; empate desempata por quem mais faltou, que é
       quem a coordenação precisa ligar. */
    uasort($por, fn ($a, $b) => [$b['veio'], $b['faltou']] <=> [$a['veio'], $a['faltou']]);
    return array_values($por);
}

/**
 * O time que ainda não está na lista deste encontro.
 *
 * Militante com conta não lê o QR da mesa — ele está atrás dela, recebendo os
 * outros. Escalar em bloco é o que faz a lista do encontro contar as pessoas
 * que efetivamente estiveram lá, e não só as que chegaram pela porta.
 */
function time_fora_do_evento(string $eventoId): array
{
    $dentro = [];
    foreach (leads_do_evento($eventoId) as $l) {
        if ($l['usuarioId'] !== '') {
            $dentro[$l['usuarioId']] = true;
        }
        if ($l['telefone'] !== '') {
            $dentro['tel:' . $l['telefone']] = true;
        }
    }

    $fora = [];
    foreach (ler_usuarios() as $u) {
        if (empty($u['ativo'])) {
            continue;
        }
        $tel = so_digitos($u['telefone'] ?? '');
        if (isset($dentro[$u['id']]) || ($tel !== '' && isset($dentro['tel:' . $tel]))) {
            continue;
        }
        $fora[] = $u;
    }
    usort($fora, fn ($a, $b) => strcmp($a['nome'], $b['nome']));
    return $fora;
}

/* ===================== funil de follow-up ===================== */

/** Quantos dias desde o evento (ou desde o cadastro, se não houver data). */
function dias_desde(string $referencia): int
{
    $t = strtotime($referencia);
    return $t === false ? 0 : (int) floor((time() - $t) / 86400);
}

/**
 * A etapa do funil que está vencida para esta pessoa, ou null.
 *
 * D+0 agradecer · D+3 mandar conteúdo · D+7 convidar para o próximo.
 * Só conta quem compareceu: quem foi convidado e não veio não entra no funil.
 */
function etapa_vencida(array $lead, array $evento): ?string
{
    if (!$lead['compareceu']) {
        return null;
    }
    $dias = dias_desde($evento['data'] !== '' ? $evento['data'] : $lead['criadoEm']);

    foreach (['d0' => 0, 'd3' => 3, 'd7' => 7] as $etapa => $quando) {
        if ($dias >= $quando && $lead['funil'][$etapa] === '') {
            return $etapa;
        }
    }
    return null;
}

const ROTULO_FUNIL = [
    'd0' => 'Agradecer e chamar para o canal',
    'd3' => 'Mandar um conteúdo do interesse dela',
    'd7' => 'Convidar para o próximo encontro',
];

/* ===================== privacidade ===================== */

/**
 * Quem enxerga o telefone: a coordenação (área 'agenda') e quem cadastrou.
 *
 * Esconder de quem digitou o número não protegeria ninguém — a pessoa acabou de
 * ver o telefone para escrevê-lo. O que a regra evita é a lista inteira de
 * contatos ficar aberta para todo mundo que tem conta, e crescer junto com o
 * time.
 */
function pode_ver_telefone(array $lead, ?array $eu): bool
{
    if ($eu === null) {
        return false;
    }
    return pode('agenda') || ($lead['criadoPorId'] !== '' && $lead['criadoPorId'] === $eu['id']);
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
