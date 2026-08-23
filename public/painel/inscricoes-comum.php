<?php
declare(strict_types=1);

/**
 * Dados das inscrições da militância — compartilhado entre o formulário público
 * (api/inscricao.php) e a tela de aprovação (inscricoes.php).
 *
 * Só define funções, não faz nada sozinho: quem inclui é que decide se exige
 * login. O endpoint público inclui sem exigir; a tela de aprovação exige a área.
 *
 * As inscrições ficam em dados/inscricoes.php — arquivo PHP, e não JSON, porque
 * o .htaccess de /dados só bloqueia .php. Um .json ali é baixável pela web, e
 * aqui tem telefone e e-mail de gente de verdade.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_LIMITE     = PASTA_DADOS . '/inscricoes-limite.php';
const ARQ_FUNCOES    = __DIR__ . '/../funcoes.json';

/** Versão do texto de consentimento aceito no formulário. */
const VERSAO_CONSENTIMENTO = '1';

/** Teto por IP: segura enxurrada sem atrapalhar a família que se inscreve junta. */
/* A mesa da recepção: uma fila inteira sai do mesmo Wi‑Fi do local, em minutos.
   Alto o bastante para um encontro de verdade caber, baixo o bastante para
   quem quisesse varrer faixas de telefone não ter tentativa infinita. */
const LIMITE_PRESENCA_HORA = 60;
const LIMITE_PRESENCA_DIA  = 400;

const LIMITE_POR_HORA = 5;
const LIMITE_POR_DIA  = 20;

/* ===================== catálogo de funções ===================== */

/**
 * Lê o funcoes.json que o build copia para a raiz (ver publish.yml).
 * É a mesma fonte que o formulário usa — sem lista repetida em duas linguagens.
 */
/**
 * Login a partir do nome: "Maria de Sousa Lima" -> "maria.lima".
 * Acrescenta número se já existir, e completa se ficar curto demais para a
 * regra de validar_nome_usuario() (mínimo 3 caracteres).
 */
function login_sugerido(string $nome): string
{
    /* `sem_acento()` e não `iconv('ASCII//TRANSLIT')`: o TRANSLIT depende da
       libc, e "Antônio" vira "antonio" no Linux da Hostinger e "antnio" no
       macOS. Login é identificador permanente de uma pessoa — não pode depender
       da máquina em que a inscrição foi aprovada. */
    $ascii = strtolower(preg_replace('/[^a-zA-Z ]/', '', sem_acento($nome)) ?? '');

    $partes = array_values(array_filter(explode(' ', $ascii)));
    // ignora as partículas do meio (de, da, dos…) na hora de montar o login
    $uteis = array_values(array_filter($partes, fn ($p) => !in_array($p, ['de', 'da', 'do', 'das', 'dos', 'e'], true)));
    if ($uteis === []) {
        $uteis = $partes;
    }

    $base = $uteis[0] ?? 'militante';
    if (count($uteis) > 1) {
        $base .= '.' . end($uteis);
    }
    $base = substr($base, 0, 20);
    while (strlen($base) < 3) {
        $base .= 'x';
    }

    $tentativa = $base;
    $n = 2;
    while (pessoa_por_usuario($tentativa) !== null) {
        $tentativa = substr($base, 0, 20) . $n;
        $n++;
    }
    return $tentativa;
}

function catalogo_funcoes(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    $memo = ['funcoes' => [], 'porId' => []];
    if (is_file(ARQ_FUNCOES)) {
        $bruto = json_decode((string) @file_get_contents(ARQ_FUNCOES), true);
        if (is_array($bruto) && is_array($bruto['funcoes'] ?? null)) {
            $memo['funcoes'] = $bruto['funcoes'];
            foreach ($bruto['funcoes'] as $f) {
                if (!empty($f['id'])) {
                    $memo['porId'][(string) $f['id']] = $f;
                }
            }
        }
    }
    return $memo;
}

/** Nome de exibição da função; devolve o próprio id se o catálogo não tiver. */
/**
 * A régua de campo da inscrição — a mesma que `api/inscricao.php` aplica.
 *
 * Devolve `''` quando passa, ou a frase da recusa. Ela existe como FUNÇÃO, e
 * não como um bloco de `if` dentro do endpoint, por um motivo só: há uma
 * segunda cópia dela em `src/features/inscricao/validacao.ts`, e as duas têm
 * de concordar. Enquanto a régua estava solta no meio do endpoint não havia
 * como chamá-la de fora, e o par ficava sem quem conferisse.
 *
 * **A divergência que dói tem direção.** Se o servidor recusar algo que a tela
 * aceitou, a pessoa preenche tudo, passa por todas as marcas verdes e leva um
 * "não deu" genérico no fim — e vai embora. O contrário (o servidor aceitar
 * mais do que a tela pede) é de propósito: aqui é endpoint público, e a régua
 * de lá é mais dura para ajudar quem digita, não para barrar.
 *
 * @param array $campos nome, telefone, email, cidade e bairro, já limpos
 */
function recusa_de_inscricao(array $campos): string
{
    $nome = preg_replace('/\s+/u', ' ', (string) ($campos['nome'] ?? '')) ?? '';

    if (mb_strlen($nome) < 5 || mb_strpos($nome, ' ') === false) {
        return 'Escreva seu nome completo.';
    }
    $telefone = (string) ($campos['telefone'] ?? '');
    if (strlen($telefone) < 10 || strlen($telefone) > 11) {
        return 'Confira o WhatsApp: use DDD + número.';
    }
    $email = (string) ($campos['email'] ?? '');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'Esse e-mail parece incompleto.';
    }
    if ((string) ($campos['cidade'] ?? '') === '' || (string) ($campos['bairro'] ?? '') === '') {
        return 'Escolha sua cidade na lista e diga seu bairro.';
    }
    /* Função é OPCIONAL. Quem chegou disposto e ainda não sabe onde encaixa é
       militante do mesmo jeito — recusar aqui trocaria um militante novo por
       uma linha de relatório, o mesmo erro que a `origem` evita. Sem escolha,
       a aprovação assume "onde-precisar" (ver inscricoes.php). */
    return '';
}

/**
 * Número no formato que o wa.me espera: 55 + DDD + número.
 *
 * Mudou de casa junto com a divisão da tela: a senha provisória (que fica na
 * capa) e a ficha da fila precisam dela, e as duas passaram a viver em arquivos
 * diferentes.
 */
function numero_whatsapp(string $telefone): string
{
    $d = so_digitos($telefone);
    return str_starts_with($d, '55') ? $d : '55' . $d;
}

function nome_funcao(string $id): string
{
    return (string) (catalogo_funcoes()['porId'][$id]['nome'] ?? $id);
}

/** Descarta id que não existe no catálogo — nada de função inventada no POST. */
function funcoes_validas(array $pedidas): array
{
    $porId = catalogo_funcoes()['porId'];
    $limpo = [];
    foreach ($pedidas as $id) {
        $id = limpar_texto($id, 40);
        if ($id !== '' && isset($porId[$id]) && !in_array($id, $limpo, true)) {
            $limpo[] = $id;
        }
    }
    return $limpo;
}

/** Áreas do painel sugeridas para quem escolheu estas funções. */
function areas_sugeridas(array $funcoes): array
{
    $porId = catalogo_funcoes()['porId'];
    $areas = [];
    foreach ($funcoes as $id) {
        foreach ((array) ($porId[$id]['areas'] ?? []) as $a) {
            if (isset(AREAS[$a]) && !in_array($a, $areas, true)) {
                $areas[] = $a;
            }
        }
    }
    return array_values(array_intersect(array_keys(AREAS), $areas));
}

/* ===================== inscrições ===================== */

/**
 * De onde veio a inscrição — o `?de=` da URL de /queroajudar.
 *
 * Carrega duas perguntas no mesmo campo, porque na prática são a mesma:
 * `?de=joao-silva` diz **quem trouxe**, `?de=live-domingo` diz **de onde veio**.
 * Sem isso não há como saber qual militante recruta e qual canal converte, que
 * são as duas contas que governam o crescimento.
 *
 * Vira slug na entrada de propósito: o valor chega de link colado por qualquer
 * pessoa, e um rótulo livre viraria "João Silva", "joao silva" e "JOÃO" como
 * três origens diferentes no relatório. Nunca use `iconv('ASCII//TRANSLIT')`
 * aqui — o resultado muda entre o Linux da Hostinger e o macOS.
 */
function normalizar_origem($bruto): string
{
    $texto = limpar_texto($bruto ?? '', 60);
    if ($texto === '') {
        return '';
    }
    $slug = strtolower(sem_acento($texto));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    return trim($slug, '-');
}

/**
 * Quanto tempo uma inscrição pode dormir antes de virar urgência no hub.
 *
 * O vão entre se inscrever e ser aprovado é onde mais se perde gente: ela está
 * no pico de entusiasmo que vai ter, e depende de um humano decidir.
 */
const HORAS_LIMITE_INSCRICAO = 48;

/**
 * A inscrição deixou de ser um cadastro à parte.
 *
 * Era `dados/inscricoes.php`, com nome, telefone, cidade e bairro repetidos — os
 * mesmos campos que a conta do painel e a ficha de presença guardavam, da mesma
 * pessoa. Quem se inscrevia e depois aparecia num encontro virava duas linhas
 * que ninguém cruzava.
 *
 * Agora a inscrição é um ESTADO da pessoa (`status = 'pendente'`) e as funções
 * que ela pediu ficam no `funcoes` dela. A fila é `fila_de_entrada()`, em
 * `pessoas-comum.php`.
 */

/** As iniciais do nome, para o cartão ter um rosto. */
function iniciais(string $nome): string
{
    $partes = array_values(array_filter(explode(' ', trim($nome))));
    if ($partes === []) {
        return '?';
    }
    $primeira = mb_strtoupper(mb_substr($partes[0], 0, 1));
    $ultima = count($partes) > 1 ? mb_strtoupper(mb_substr((string) end($partes), 0, 1)) : '';
    return $primeira . $ultima;
}

/** Há quanto tempo esta pessoa espera a coordenação decidir. */
function horas_na_fila(array $pessoa): int
{
    $t = strtotime($pessoa['criadoEm'] ?? '');
    return $t === false ? 0 : (int) floor((time() - $t) / 3600);
}

/**
 * De onde veio cada pessoa — o `?de=` do link que ela abriu.
 *
 * Devolve da maior para a menor, e **não inclui quem chegou sem origem**: essa
 * conta vai separada, porque "veio sozinho" não é um recrutador.
 *
 * Conta o TOTAL e as APROVADAS lado a lado de propósito: origem que traz muita
 * gente e nenhuma aprovada não é origem que funciona, e o número cru esconderia
 * isso.
 *
 * @return array{placar: list<array{origem: string, total: int, aprovadas: int}>, semOrigem: int}
 */
function placar_de_origens(?array $pessoas = null): array
{
    $pessoas ??= ler_pessoas();

    $soma = [];
    $semOrigem = 0;
    foreach ($pessoas as $p) {
        /* Só quem passou pelo formulário conta: quem a coordenação cadastrou na
           mão, ou quem apareceu num encontro, não veio de link nenhum. */
        if ($p['status'] === '') {
            continue;
        }
        if ($p['origem'] === '') {
            $semOrigem++;
            continue;
        }
        if (!isset($soma[$p['origem']])) {
            $soma[$p['origem']] = ['origem' => $p['origem'], 'total' => 0, 'aprovadas' => 0];
        }
        $soma[$p['origem']]['total']++;
        if ($p['status'] === 'aprovada') {
            $soma[$p['origem']]['aprovadas']++;
        }
    }

    usort($soma, fn ($a, $b) => [$b['total'], $b['aprovadas']] <=> [$a['total'], $a['aprovadas']]);
    return ['placar' => array_values($soma), 'semOrigem' => $semOrigem];
}

/**
 * O FUNIL DE CADA ORIGEM — quem recruta, e o que converte.
 *
 * `placar_de_origens()` responde "quantas chegaram por aqui". Esta responde a
 * pergunta seguinte, que é a que decide onde a campanha põe esforço: **das que
 * chegaram, quantas viraram militante de verdade?**
 *
 * A diferença não é detalhe. Uma live que traz cinquenta inscrições e nenhuma
 * aprovada parece a melhor origem do movimento no número cru, e é a pior; um
 * militante que traz seis e vê as seis comparecendo é o que precisa ser copiado.
 * Contar só o topo do funil premia quem faz barulho, não quem traz gente.
 *
 * **Três degraus, e não dois:**
 *
 * 1. `chegaram` — preencheu o formulário. É o que o link fez.
 * 2. `aprovadas` — a coordenação conferiu e deu acesso.
 * 3. `militaram` — apareceu em pelo menos um encontro. Este é o único que não
 *    depende de a pessoa dizer que vai: é presença marcada na porta.
 *
 * **Quem recruta é separado de por onde veio, e a separação é lida do
 * cadastro**, não de uma segunda lista: se a origem é o slug do nome de alguém
 * que existe, a linha ganha o nome dessa pessoa. `?de=joao-silva` é gente,
 * `?de=live-domingo` é canal — o campo é um só porque na prática a pergunta é a
 * mesma, mas quem lê o relatório precisa distinguir os dois para saber se
 * agradece ou se repete.
 *
 * Não inclui quem chegou sem origem: essa conta vai separada, porque "veio
 * sozinho" não é um recrutador. E só conta quem passou pelo formulário — quem a
 * coordenação cadastrou na mão não veio de link nenhum.
 *
 * @return array{
 *   linhas: list<array{origem:string, quem:string, chegaram:int, aprovadas:int,
 *                      militaram:int, ultima:string}>,
 *   semOrigem: int, semOrigemMilitaram: int
 * }
 */
function funil_de_origens(?array $pessoas = null): array
{
    require_once __DIR__ . '/eventos-comum.php';   // as presenças, para o 3º degrau

    $pessoas ??= ler_pessoas();

    /* Quem compareceu a pelo menos um encontro. Um `array` de ids em vez de uma
       consulta por pessoa: são duas listas inteiras, e cruzá-las uma vez custa
       menos que uma varredura por linha do relatório. */
    $compareceu = [];
    foreach (ler_presencas() as $l) {
        if (!empty($l['compareceu'])) {
            $compareceu[$l['pessoaId']] = true;
        }
    }

    /* O slug do nome de cada pessoa → o nome dela. É assim que a origem
       `joao-silva` vira "João Silva" na tela: o mesmo `normalizar_origem()` que
       grava a origem, aplicado ao nome de quem já está no cadastro. Sem isso o
       relatório mostra slug, e slug ninguém reconhece no grupo. */
    $porSlug = [];
    foreach ($pessoas as $p) {
        $slug = normalizar_origem($p['nome']);
        if ($slug !== '' && !isset($porSlug[$slug])) {
            $porSlug[$slug] = $p['nome'];
        }
    }

    $soma = [];
    $semOrigem = 0;
    $semOrigemMilitaram = 0;

    foreach ($pessoas as $p) {
        if ($p['status'] === '') {
            continue;
        }
        $militou = isset($compareceu[$p['id']]);

        if ($p['origem'] === '') {
            $semOrigem++;
            $semOrigemMilitaram += $militou ? 1 : 0;
            continue;
        }
        $o = $p['origem'];
        $soma[$o] ??= [
            'origem'    => $o,
            'quem'      => $porSlug[$o] ?? '',
            'chegaram'  => 0,
            'aprovadas' => 0,
            'militaram' => 0,
            'ultima'    => '',
        ];
        $soma[$o]['chegaram']++;
        $soma[$o]['aprovadas'] += $p['status'] === 'aprovada' ? 1 : 0;
        $soma[$o]['militaram'] += $militou ? 1 : 0;
        if (($p['criadoEm'] ?? '') > $soma[$o]['ultima']) {
            $soma[$o]['ultima'] = (string) $p['criadoEm'];
        }
    }

    /* A ordem é por QUEM MILITOU, e o total só desempata. Ordenar pelo total
       poria no topo justamente a origem que enche a fila e não entrega — que é
       o erro de leitura que este relatório existe para desfazer. */
    usort($soma, fn ($a, $b) => [$b['militaram'], $b['aprovadas'], $b['chegaram']]
                           <=> [$a['militaram'], $a['aprovadas'], $a['chegaram']]);

    return [
        'linhas' => array_values($soma),
        'semOrigem' => $semOrigem,
        'semOrigemMilitaram' => $semOrigemMilitaram,
    ];
}

/**
 * Quantos militantes por cidade/bairro — só aprovados, pelo mesmo motivo.
 *
 * Devolve LINHAS DE TABELA, e não o mapa cru `cidade => bairro => n`: a tela
 * desenha `cidade`, `total` e a lista de `bairros`, e era o mapa cru que ela
 * recebia — três chaves indefinidas por linha e a tabela saindo vazia.
 *
 * Cidade com mais gente primeiro, porque a pergunta é "onde já dá para montar
 * um time"; empate desempata pelo nome, sem acento.
 */
function militancia_por_regiao(?array $pessoas = null): array
{
    $pessoas ??= ler_pessoas();
    $mapa = [];
    foreach ($pessoas as $p) {
        if ($p['status'] !== 'aprovada' || $p['cidade'] === '') {
            continue;
        }
        $bairro = $p['bairro'] !== '' ? $p['bairro'] : '';
        $mapa[$p['cidade']][$bairro] = ($mapa[$p['cidade']][$bairro] ?? 0) + 1;
    }

    $linhas = [];
    foreach ($mapa as $cidade => $bairros) {
        $total = array_sum($bairros);
        /* Bairro em branco não vira "—" numa etiqueta: a tela já diz "sem
           bairro informado" quando não sobra nenhum, e uma etiqueta com travessão
           no meio dos bairros de verdade só ocupa espaço. */
        unset($bairros['']);
        arsort($bairros);
        $linhas[] = [
            'cidade'  => (string) $cidade,
            'total'   => $total,
            'bairros' => array_map(
                fn ($nome, $n) => ['nome' => (string) $nome, 'total' => $n],
                array_keys($bairros),
                array_values($bairros)
            ),
        ];
    }

    usort($linhas, fn ($a, $b) => [$b['total'], sem_acento($a['cidade'])]
        <=> [$a['total'], sem_acento($b['cidade'])]);
    return $linhas;
}

/**
 * Uma pessoa já cadastrada com este telefone, ou null.
 *
 * Continua existindo porque o endpoint público precisa saber se o número já é
 * conhecido antes de criar mais uma ficha. Devolve a primeira: aqui a pergunta
 * é "esse número já entrou?", e não "qual das duas pessoas do número é você" —
 * essa é da tela de presença, que usa `pessoas_por_telefone()`.
 */
function inscricao_por_telefone(string $telefone): ?array
{
    $achadas = pessoas_por_telefone($telefone);
    return $achadas[0] ?? null;
}

/* ===================== limite por IP ===================== */

/* segredo() mora no sessao.php: é segredo do site inteiro, não das
   inscrições — as aulas também derivam o token de convite dele. */

function chave_visitante(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    // A Hostinger fica atrás de proxy; o primeiro da lista é o cliente.
    $enc = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($enc !== '') {
        $partes = explode(',', $enc);
        $primeiro = trim($partes[0]);
        if (filter_var($primeiro, FILTER_VALIDATE_IP)) {
            $ip = $primeiro;
        }
    }
    return substr(hash_hmac('sha256', $ip, segredo()), 0, 24);
}

function estado_limite(): array
{
    if (!is_file(ARQ_LIMITE)) {
        return [];
    }
    $v = @include ARQ_LIMITE;
    return is_array($v) ? $v : [];
}

/**
 * true quando o visitante já passou do teto e deve ser barrado.
 *
 * O ESCOPO existe porque os dois usos não se parecem em nada.
 *
 * A inscrição é uma vez na vida por pessoa: cinco por hora do mesmo endereço já
 * é comportamento estranho. A presença é uma fila numa porta — trinta pessoas
 * lendo o mesmo QR, quase todas no mesmo Wi‑Fi do local, no mesmo quarto de
 * hora. Com o teto da inscrição, a sexta pessoa da fila levaria "você já se
 * cadastrou há pouco" e iria embora sem entrar na lista.
 *
 * O teto da presença continua existindo (a busca por telefone devolve nome, e
 * sem teto isso seria um oráculo para varrer faixas de número), só é alto o
 * bastante para caber um evento de verdade.
 */
function passou_do_limite(string $escopo = 'inscricao', int $porHora = LIMITE_POR_HORA, int $porDia = LIMITE_POR_DIA): bool
{
    $agora = time();
    $reg = estado_limite()[chave_visitante() . ':' . $escopo] ?? null;
    if (!is_array($reg)) {
        return false;
    }
    $hora = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 3600);
    $dia  = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 86400);
    return count($hora) >= $porHora || count($dia) >= $porDia;
}

function registrar_envio(string $escopo = 'inscricao'): void
{
    preparar_pastas();
    $agora = time();
    $chave = chave_visitante() . ':' . $escopo;
    $tudo = estado_limite();

    $envios = (array) ($tudo[$chave]['envios'] ?? []);
    $envios[] = $agora;
    // guarda só a janela de 24h, senão o arquivo cresce sem fim
    $tudo[$chave] = ['envios' => array_values(array_filter($envios, fn ($t) => $t > $agora - 86400))];

    foreach ($tudo as $k => $v) {
        $restantes = array_filter((array) ($v['envios'] ?? []), fn ($t) => $t > $agora - 86400);
        if ($restantes === []) {
            unset($tudo[$k]);
        }
    }

    gravar_atomico(ARQ_LIMITE, "<?php\nreturn " . var_export($tudo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_LIMITE, true);
    }
}
