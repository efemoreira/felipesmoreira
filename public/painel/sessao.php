<?php
declare(strict_types=1);

/**
 * Núcleo do painel — felipesmoreira.com/painel
 *
 * Sessão, usuários e permissões. Todo arquivo do painel começa por aqui, então
 * é aqui que mora a única resposta para "quem é você" e "o que você pode abrir".
 *
 * Os usuários ficam em public_html/dados/usuarios.php, fora do repositório: um
 * deploy novo nunca apaga quem tem acesso e nenhuma senha entra no Git. Só o
 * hash é guardado — senha não se recupera, só se troca.
 *
 * Cada usuário tem um papel (admin ou editor) e as áreas que pode abrir.
 * Admin enxerga todas as áreas e é o único que mexe na lista de usuários.
 */

const SESSAO_SEG = 7200;  // 2 h de inatividade

const PASTA_DADOS    = __DIR__ . '/../dados';
const ARQ_USUARIOS   = PASTA_DADOS . '/usuarios.php';
// .php, e não .json: o arquivo tem os logins de quem errou senha, e em /dados
// só arquivo .php fica fora do alcance da web.
const ARQ_TENTATIVAS = PASTA_DADOS . '/tentativas.php';
const ARQ_SEGREDO    = PASTA_DADOS . '/segredo.php';
/** Versão antiga do arquivo acima, legível pela web — apagada ao passar por aqui. */
const ARQ_TENTATIVAS_ANTIGO = PASTA_DADOS . '/tentativas.json';
const PASTA_BACKUP   = PASTA_DADOS . '/backups';
const PASTA_IMAGENS  = PASTA_DADOS . '/imagens';
const URL_IMAGENS    = '/dados/imagens';  // como a página enxerga a pasta

/** Nome do cookie do tema. Não é segredo: só diz se a pessoa quer claro ou escuro. */
const COOKIE_TEMA    = 'painel_tema';

const MAX_TENTATIVAS = 5;
const BLOQUEIO_SEG   = 900;  // 15 min
const SENHA_MIN      = 8;   // com o bloqueio por login, 8 já segura tentativa às cegas

/** As funcionalidades do painel. A chave entra no usuarios.php. */
const AREAS = [
    'agenda'     => 'Agenda e eventos',
    'estudio'    => 'Estúdio de artes',
    'aulas'      => 'Formação da militância',
    'fatos'      => 'Fatos do dia',
    'producao'   => 'Produção',
    'municao'    => 'Munição',
    'eventos'    => 'Encontros',
    'inscricoes' => 'Inscrições da militância',
    'candidatos' => 'Candidatos',
];

/**
 * As ferramentas do trabalho de todo dia, por oposição às áreas de decisão
 * (agenda, estudio, inscricoes) e à de administração (usuários).
 *
 * A diferença não é técnica — a permissão continua sendo a mesma caixa marcada
 * no usuário. É só a sugestão do que vem marcado ao criar alguém: ferramenta
 * não pertence a uma função, e o Olheiro que quiser entender o quadro de
 * Produção deve conseguir abrir. Quem cria o usuário desmarca o que não quiser.
 */
const AREAS_FERRAMENTA = ['aulas', 'fatos', 'producao', 'municao', 'eventos'];

const PAPEIS = [
    'admin'  => 'Administrador',
    'editor' => 'Editor',
];

/** Para onde cada área leva, e uma linha do que ela faz. */
const DESTINO_AREA = [
    'agenda'     => ['url' => '/painel/agenda.php', 'resumo' => 'Editar a programação que aparece em /programacao'],
    'estudio'    => ['url' => '/painel/estudio.php', 'resumo' => 'Montar as artes dos posts a partir de um modelo'],
    'aulas'      => ['url' => '/painel/aulas.php', 'resumo' => 'Pendurar o vídeo de cada aula e ver quem já estudou'],
    'fatos'      => ['url' => '/painel/fatos.php', 'resumo' => 'Trazer o fato do dia com fonte e conferir o que chegou'],
    'producao'   => ['url' => '/painel/producao.php', 'resumo' => 'O quadro do roteiro à publicação: quem faz o quê, e onde travou'],
    'municao'    => ['url' => '/painel/municao.php', 'resumo' => 'As peças do mutirão: o número do plano com a fonte, pronto pra mandar no grupo'],
    'eventos'    => ['url' => '/painel/eventos.php', 'resumo' => 'Preparar o encontro, confirmar presença e receber quem chega'],
    'inscricoes' => ['url' => '/painel/inscricoes.php', 'resumo' => 'Aprovar quem se inscreveu em /queroajudar e mandar o acesso'],
    'candidatos' => ['url' => '/painel/candidatos.php', 'resumo' => 'Nome de urna, número e @ de cada candidato — a colinha que o eleitor leva'],
];

/**
 * O grupo de trabalho — o par PHP de `GRUPO_TRABALHO` em `src/lib/contato.ts`.
 *
 * Só aqui dentro. O site público divulga o grupo GERAL; este é de quem já tem
 * conta, e entrar nele é a primeira obrigação de quem chega (ver index.php e
 * agora.php). Mexeu num arquivo, mexa no outro.
 */
const GRUPO_TRABALHO = 'https://chat.whatsapp.com/C8rQeoCzJpz6vObwyRFAbt';

/** O contato oficial. Não existe e-mail: este é o único canal. */
const WHATSAPP_COORDENACAO = 'https://wa.me/5585981872972';

header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');
header('X-Content-Type-Options: nosniff');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/painel',
    'httponly' => true,
    'secure'   => $https,
    'samesite' => 'Strict',
]);
session_name('painel_agenda');
session_start();

/* ===================== infraestrutura ===================== */

/** Aceita qualquer coisa vinda do JSON (inclusive null/número) e devolve HTML seguro. */
function h($s): string
{
    return htmlspecialchars(is_scalar($s) ? (string) $s : '', ENT_QUOTES, 'UTF-8');
}

function gravar_atomico(string $destino, string $conteudo): bool
{
    $tmp = $destino . '.tmp';
    if (@file_put_contents($tmp, $conteudo, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0644);
    if (!@rename($tmp, $destino)) {
        return false;
    }

    /* Todo /dados é .php lido com include, e o OPcache guarda a versão
       compilada. Como ele só reconfere o disco de tempos em tempos
       (opcache.revalidate_freq, 2s por padrão), duas gravações dentro da mesma
       janela podem fazer a leitura seguinte devolver o conteúdo ANTIGO — e a
       alteração some sem erro nenhum.

       Isto é precaução, não conserto de bug observado: no servidor embutido do
       PHP (php -S) o OPcache nem executa, então o teste local não alcança o
       caso. Na Hostinger, que roda Apache com OPcache ligado, ele é real — e as
       aulas trouxeram o primeiro arquivo do painel que grava várias vezes por
       minuto (o progresso de cada pessoa), bem dentro dessa janela.

       Fica aqui, e não no aulas-comum.php, porque toda gravação do painel passa
       por esta função. */
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate($destino, true);
    }

    // o stat cache do PHP também precisa esquecer o inode que acabou de trocar
    clearstatcache(true, $destino);

    return true;
}

/**
 * Corta, apara e tira caracteres de controle. Vale para todo texto que chega
 * de fora — mora aqui, e não no agenda.php, porque o formulário público e a
 * tela de inscrições também precisam e não podem incluir aquele arquivo.
 */
function limpar_texto($v, int $max): string
{
    $s = is_scalar($v) ? trim((string) $v) : '';
    $s = preg_replace('/[\x00-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}

/** Só os dígitos — é assim que telefone entra no arquivo e no link do WhatsApp. */
function so_digitos($v): string
{
    return preg_replace('/\D/', '', is_scalar($v) ? (string) $v : '') ?? '';
}

/**
 * O envio veio mesmo do nosso site?
 *
 * `Origin` ausente não reprova: navegador antigo e algumas requisições de mesma
 * origem não mandam o cabeçalho, e recusar por ausência derrubaria gente de
 * verdade. Quando ele vem, tem que bater com o nosso host.
 *
 * **A porta sai dos dois lados antes de comparar.** `parse_url` devolve o host
 * sem porta, enquanto `HTTP_HOST` a traz quando não é a padrão — comparar os
 * dois crus reprova todo envio em qualquer porta que não seja 80/443. Em
 * produção isso nunca aparece (443 é implícita), e é justamente por isso que
 * seria descoberto tarde: o formulário público pararia em silêncio no dia em
 * que o site subisse atrás de outra porta.
 *
 * Mora aqui porque a inscrição, a presença e as aulas faziam a mesma
 * conferência, cada uma com a sua cópia.
 */
function origem_confere(): bool
{
    $origem = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origem === '') {
        return true;
    }
    $dele = parse_url($origem, PHP_URL_HOST);
    if (!is_string($dele) || $dele === '') {
        return false;
    }
    // tira a porta do nosso host; o IPv6 literal vem entre colchetes
    $meu = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $meu = preg_replace('/:\d+$/', '', $meu) ?? $meu;
    $meu = trim($meu, '[]');

    return strcasecmp($dele, trim($meu, '[]')) === 0;
}

/**
 * Segredo do site, criado sozinho na primeira vez.
 *
 * Serve para embaralhar o IP antes de guardar — dá para contar quantas vezes
 * alguém tentou sem manter endereço salvo, que é dado pessoal — e para derivar
 * o token de convite das aulas.
 *
 * Mora aqui, e não no inscricoes-comum.php onde nasceu, porque é segredo do
 * site inteiro: as aulas precisam dele e não têm por que arrastar junto a
 * maquinaria das inscrições.
 */
function segredo(): string
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    if (is_file(ARQ_SEGREDO)) {
        $v = @include ARQ_SEGREDO;
        if (is_string($v) && $v !== '') {
            return $memo = $v;
        }
    }
    preparar_pastas();
    $memo = bin2hex(random_bytes(16));
    gravar_atomico(ARQ_SEGREDO, "<?php\nreturn " . var_export($memo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_SEGREDO, true);
    }
    return $memo;
}

/**
 * "Fila do Hospital Geral" -> "Fila do Hospital Geral" sem acento nenhum.
 *
 * Mapa escrito à mão em vez de iconv('ASCII//TRANSLIT'): o resultado do
 * TRANSLIT depende da libc, e o mesmo texto vira "ha" no Linux da Hostinger e
 * "h" no macOS de quem desenvolve. Nome de arquivo é contrato com o Acervo, e
 * slug de origem é contrato com o relatório — nenhum dos dois pode mudar
 * conforme a máquina que gerou.
 *
 * Mora aqui, e não no producao-comum.php onde nasceu, porque as inscrições
 * também precisam e não têm por que arrastar junto o quadro de produção
 * inteiro. O equivalente no JavaScript é `normalize("NFD")`, que o Unicode
 * define e que dá o mesmo resultado em qualquer máquina.
 */
function sem_acento(string $texto): string
{
    return strtr($texto, [
        'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a', 'ä' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'õ' => 'o', 'ô' => 'o', 'ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'ç' => 'c', 'ñ' => 'n',
        'Á' => 'A', 'À' => 'A', 'Ã' => 'A', 'Â' => 'A', 'Ä' => 'A',
        'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E',
        'Í' => 'I', 'Ì' => 'I', 'Î' => 'I', 'Ï' => 'I',
        'Ó' => 'O', 'Ò' => 'O', 'Õ' => 'O', 'Ô' => 'O', 'Ö' => 'O',
        'Ú' => 'U', 'Ù' => 'U', 'Û' => 'U', 'Ü' => 'U',
        'Ç' => 'C', 'Ñ' => 'N',
    ]);
}

/**
 * 85912345678 -> (85) 91234-5678. Guardamos só dígitos; ler assim é humano.
 *
 * Mora aqui, e não no inscricoes-comum.php onde nasceu, porque a lista de
 * presença dos encontros também precisa e não tem por que arrastar junto toda
 * a maquinaria das inscrições.
 */
function telefone_bonito(string $telefone): string
{
    $d = so_digitos($telefone);
    if (strlen($d) === 11) {
        return sprintf('(%s) %s-%s', substr($d, 0, 2), substr($d, 2, 5), substr($d, 7));
    }
    if (strlen($d) === 10) {
        return sprintf('(%s) %s-%s', substr($d, 0, 2), substr($d, 2, 4), substr($d, 6));
    }
    return $d;
}

/** Escreve a regra só quando ela mudou — assim uma versão nova se conserta sozinha. */
function fixar_regra(string $arquivo, string $conteudo): void
{
    if (!is_file($arquivo) || @file_get_contents($arquivo) !== $conteudo) {
        @file_put_contents($arquivo, $conteudo);
    }
}

function preparar_pastas(): void
{
    foreach ([PASTA_DADOS, PASTA_BACKUP, PASTA_IMAGENS] as $pasta) {
        if (!is_dir($pasta)) {
            @mkdir($pasta, 0755, true);
        }
    }

    $negar = "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n"
           . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n";

    $permitir = "<IfModule mod_authz_core.c>\n  Require all granted\n</IfModule>\n"
              . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Allow from all\n</IfModule>\n";

    // Nada de PHP rodando dentro da pasta de imagens, mesmo se algo escapar da validação.
    fixar_regra(
        PASTA_IMAGENS . '/.htaccess',
        "Options -Indexes\nAddType text/plain .php .php5 .phtml .phar .cgi .pl\n<IfModule mod_php.c>\n  php_flag engine off\n</IfModule>\n"
    );

    // Backups não saem pela web.
    fixar_regra(PASTA_BACKUP . '/.htaccess', "Options -Indexes\n" . $negar);

    /* Em /dados nada sai pela web, com UMA exceção: o agenda.json, que a página
       /programacao busca no navegador.

       O .php já era bloqueado (é onde ficam os hashes de senha e os dados
       pessoais das inscrições). O .json passou a ser bloqueado também: o
       tentativas.json antigo entregava a lista de logins que erraram senha para
       qualquer um com o link. A liberação do agenda.json vem depois na ordem,
       porque a última regra que casa é a que vale.

       As imagens da agenda (/dados/imagens/*.jpg) não entram aqui: a regra é
       por extensão, e elas não são .php nem .json. */
    fixar_regra(
        PASTA_DADOS . '/.htaccess',
        "Options -Indexes\n"
        . "<FilesMatch \"\\.(php|php5|phtml|phar|inc)$\">\n" . $negar . "</FilesMatch>\n"
        . "<FilesMatch \"\\.json$\">\n" . $negar . "</FilesMatch>\n"
        . "<Files \"agenda.json\">\n" . $permitir . "</Files>\n"
    );

    // Versão antiga do contador de tentativas, que ficava legível pela web.
    if (is_file(ARQ_TENTATIVAS_ANTIGO)) {
        @unlink(ARQ_TENTATIVAS_ANTIGO);
    }
}

/* ===================== usuários ===================== */

/** Preenche os campos que faltam e descarta registro sem o mínimo. */
function normalizar_usuario($u): ?array
{
    if (!is_array($u) || empty($u['usuario']) || empty($u['hash'])) {
        return null;
    }
    $papel = (($u['papel'] ?? 'editor') === 'admin') ? 'admin' : 'editor';
    $pedidas = is_array($u['areas'] ?? null) ? $u['areas'] : [];

    $funcoes = is_array($u['funcoes'] ?? null) ? $u['funcoes'] : [];

    return [
        'id'           => (string) ($u['id'] ?? ''),
        'usuario'      => (string) $u['usuario'],
        'nome'         => (string) ($u['nome'] ?? $u['usuario']),
        'hash'         => (string) $u['hash'],
        'papel'        => $papel,
        // admin não depende de marcação: enxerga tudo por definição
        'areas'        => $papel === 'admin'
            ? array_keys(AREAS)
            : array_values(array_intersect(array_keys(AREAS), $pedidas)),
        'ativo'        => !empty($u['ativo']),
        'trocarSenha'  => !empty($u['trocarSenha']),
        'criadoEm'     => (string) ($u['criadoEm'] ?? ''),
        'ultimoAcesso' => (string) ($u['ultimoAcesso'] ?? ''),

        /* Vindos da inscrição em /queroajudar. Este array é literal de
           propósito: campo que não estiver aqui some na próxima gravação. */
        'telefone'     => so_digitos($u['telefone'] ?? ''),
        'email'        => limpar_texto($u['email'] ?? '', 120),
        'cidade'       => limpar_texto($u['cidade'] ?? '', 60),
        'bairro'       => limpar_texto($u['bairro'] ?? '', 60),
        // as funções no movimento (Olheiro, Design…), diferente de 'areas',
        // que é permissão de tela no painel
        'funcoes'      => array_values(array_filter(array_map(
            fn ($f) => limpar_texto($f, 40),
            $funcoes
        ))),
        'origem'       => ($u['origem'] ?? '') === 'inscricao' ? 'inscricao' : 'painel',
        /* Marcado quando a pessoa diz "já entrei" no grupo de trabalho. É a
           primeira obrigação de quem chega, e por isso ela vira TAREFA no hub
           (agora.php) até estar marcada — banner some da vista em três dias.
           Guardar a marca é o que a impede de cobrar para sempre. */
        'entrouNoGrupo'       => !empty($u['entrouNoGrupo']),
        'consentimentoEm'     => limpar_texto($u['consentimentoEm'] ?? '', 40),
        'consentimentoVersao' => limpar_texto($u['consentimentoVersao'] ?? '', 20),
    ];
}

/** Lido uma vez por requisição; gravar_usuarios() manda reler. */
function ler_usuarios(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_USUARIOS)) {
        $bruto = @include ARQ_USUARIOS;
        foreach (is_array($bruto) ? $bruto : [] as $u) {
            if ($limpo = normalizar_usuario($u)) {
                $cache[] = $limpo;
            }
        }
    }
    return $cache;
}

function gravar_usuarios(array $usuarios): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($usuarios as $u) {
        if ($limpo = normalizar_usuario($u)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_USUARIOS, $conteudo)) {
        return false;
    }
    // o opcache pode continuar servindo a versão antiga do arquivo incluído
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_USUARIOS, true);
    }
    ler_usuarios(true);  // o resto da requisição já enxerga a lista nova
    return true;
}

function achar_usuario(string $usuario): ?array
{
    foreach (ler_usuarios() as $u) {
        if (strcasecmp($u['usuario'], $usuario) === 0) {
            return $u;
        }
    }
    return null;
}

function achar_usuario_por_id(string $id): ?array
{
    foreach (ler_usuarios() as $u) {
        if ($id !== '' && $u['id'] === $id) {
            return $u;
        }
    }
    return null;
}

function tem_admin_ativo(?string $ignorarId = null): bool
{
    foreach (ler_usuarios() as $u) {
        if ($u['papel'] === 'admin' && $u['ativo'] && $u['id'] !== $ignorarId) {
            return true;
        }
    }
    return false;
}

/** '' quando serve; senão o motivo para mostrar na tela. */
function validar_senha(string $senha): string
{
    if (mb_strlen($senha) < SENHA_MIN) {
        return 'A senha precisa de pelo menos ' . SENHA_MIN . ' caracteres.';
    }
    if (preg_match('/^\s|\s$/u', $senha)) {
        return 'A senha não pode começar nem terminar com espaço.';
    }
    return '';
}

function validar_nome_usuario(string $usuario): string
{
    if (!preg_match('/^[a-z0-9][a-z0-9._-]{2,23}$/', $usuario)) {
        return 'O login usa de 3 a 24 caracteres: letras minúsculas, números, ponto, hífen ou _.';
    }
    return '';
}

/**
 * Senha provisória legível: o admin lê em voz alta sem errar e a pessoa digita
 * no celular sem trocar de teclado — só letra e número, sem hífen nem símbolo.
 * SENHA_MIN caracteres do alfabeto sem ambíguos já dão ~40 bits, e quem entra
 * com ela cai em conta.php obrigado a trocar.
 */
function senha_provisoria(): string
{
    $alfabeto = 'abcdefghijkmnpqrstuvwxyz23456789';  // sem l/o/0/1, que se confundem
    $senha = '';
    for ($i = 0; $i < SENHA_MIN; $i++) {
        $senha .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
    }
    return $senha;
}

function novo_id_usuario(): string
{
    return bin2hex(random_bytes(8));
}

/* ===================== força bruta ===================== */

function estado_tentativas(): array
{
    $bruto = is_file(ARQ_TENTATIVAS) ? @include ARQ_TENTATIVAS : null;
    return is_array($bruto) ? $bruto : [];
}

function gravar_tentativas(array $tudo): void
{
    gravar_atomico(
        ARQ_TENTATIVAS,
        "<?php\n// Gerado pelo painel. Contagem de erro de senha.\nreturn " . var_export($tudo, true) . ";\n"
    );
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_TENTATIVAS, true);
    }
}

/** O bloqueio é por login: errar o meu não tranca o dos outros. */
function bloqueado_ate(string $usuario): int
{
    $chave = mb_strtolower($usuario);
    $ate = (int) (estado_tentativas()[$chave]['ate'] ?? 0);
    return $ate > time() ? $ate : 0;
}

function registrar_falha(string $usuario): void
{
    preparar_pastas();
    $chave = mb_strtolower($usuario);
    $tudo = estado_tentativas();
    $atual = is_array($tudo[$chave] ?? null) ? $tudo[$chave] : ['contagem' => 0, 'ate' => 0];

    $atual['contagem'] = ((int) ($atual['contagem'] ?? 0)) + 1;
    if ($atual['contagem'] >= MAX_TENTATIVAS) {
        $atual['ate'] = time() + BLOQUEIO_SEG;
        $atual['contagem'] = 0;
    }
    $tudo[$chave] = $atual;

    // some com o que já expirou, para o arquivo não crescer sem fim
    $agora = time();
    foreach ($tudo as $k => $v) {
        if ($k !== $chave && ((int) ($v['ate'] ?? 0)) < $agora && ((int) ($v['contagem'] ?? 0)) === 0) {
            unset($tudo[$k]);
        }
    }
    gravar_tentativas($tudo);
}

function limpar_falhas(string $usuario): void
{
    $chave = mb_strtolower($usuario);
    $tudo = estado_tentativas();
    if (isset($tudo[$chave])) {
        unset($tudo[$chave]);
        gravar_tentativas($tudo);
    }
}

/* ===================== sessão ===================== */

/**
 * Um caminho de volta que o navegador mandou, se for mesmo de dentro do painel.
 *
 * Vale para o `volta` do login e para o do seletor de tema. Sem esta trava, um
 * link cuidadosamente montado leva a pessoa a um domínio de fora depois de uma
 * ação que ela confiou — que é exatamente o que redirecionamento aberto é.
 */
function caminho_interno_seguro($bruto, string $padrao = '/painel/'): string
{
    $c = is_string($bruto) ? $bruto : '';
    return preg_match('#^/painel/[a-z0-9._/?&=-]*$#i', $c) === 1 ? $c : $padrao;
}

/* ===================== tema (claro / escuro / sistema) ===================== */

/** Os três estados. 'sistema' não estampa nada e deixa o CSS decidir.
    TEMAS_PAINEL, e não TEMAS: o agenda.php já usa TEMAS para as cores do cartão. */
const TEMAS_PAINEL = ['claro', 'escuro', 'sistema'];

/**
 * O tema escolhido, vindo do cookie.
 *
 * Lido antes de a página ser desenhada, para o <html> já sair com data-tema — é
 * isso que impede a piscada de tema errado no carregamento. Cookie, e não
 * sessão, porque a escolha é do aparelho: a mesma pessoa pode querer claro no
 * computador do trabalho e escuro no celular.
 */
function tema_atual(): string
{
    $t = (string) ($_COOKIE[COOKIE_TEMA] ?? 'sistema');
    return in_array($t, TEMAS_PAINEL, true) ? $t : 'sistema';
}

function gravar_tema(string $tema): void
{
    if (!in_array($tema, TEMAS_PAINEL, true)) {
        return;
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    setcookie(COOKIE_TEMA, $tema, [
        'expires'  => time() + 31536000,   // um ano
        'path'     => '/painel',
        'httponly' => false,               // o botão troca na hora pelo JS também
        'secure'   => $https,
        'samesite' => 'Lax',
    ]);
    $_COOKIE[COOKIE_TEMA] = $tema;
}

function token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function token_valido(): bool
{
    return !empty($_SESSION['csrf'])
        && is_string($_POST['csrf'] ?? null)
        && hash_equals($_SESSION['csrf'], $_POST['csrf']);
}

function derrubar_sessao(): void
{
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function entrar_como(array $u): void
{
    session_regenerate_id(true);
    $_SESSION['uid'] = $u['id'];
    $_SESSION['visto'] = time();
    marcar_acesso($u['id']);
}

/**
 * Quem está logado agora — relido do disco a cada requisição, de propósito:
 * tirar a permissão de alguém tem efeito na hora, sem esperar a sessão vencer.
 */
/**
 * A conta de um telefone, ou null.
 *
 * Existe para a página pública de presença reconhecer quem já é do time sem ter
 * que perguntar de novo o nome, o bairro e a cidade. Só o telefone casa: é a
 * única chave que as três listas (usuários, inscrições e presenças) têm em
 * comum, e é a que a pessoa digita na porta do encontro.
 */
function usuario_por_telefone(string $telefone): ?array
{
    $telefone = so_digitos($telefone);
    if ($telefone === '') {
        return null;
    }
    foreach (ler_usuarios() as $u) {
        if (so_digitos($u['telefone'] ?? '') === $telefone) {
            return $u;
        }
    }
    return null;
}

function usuario_atual(): ?array
{
    static $memo = false;
    if ($memo !== false) {
        return $memo;
    }
    $memo = null;

    $id = (string) ($_SESSION['uid'] ?? '');
    if ($id === '') {
        return null;
    }
    if ((time() - (int) ($_SESSION['visto'] ?? 0)) > SESSAO_SEG) {
        derrubar_sessao();
        return null;
    }
    $u = achar_usuario_por_id($id);
    if ($u === null || !$u['ativo']) {
        derrubar_sessao();
        return null;
    }
    $_SESSION['visto'] = time();
    $memo = $u;
    return $memo;
}

function autenticado(): bool
{
    return usuario_atual() !== null;
}

function e_admin(): bool
{
    $u = usuario_atual();
    return $u !== null && $u['papel'] === 'admin';
}

function pode(string $area): bool
{
    $u = usuario_atual();
    return $u !== null && ($u['papel'] === 'admin' || in_array($area, $u['areas'], true));
}

/** As áreas que a pessoa logada realmente abre, na ordem da constante. */
function areas_do_usuario(): array
{
    return array_values(array_filter(array_keys(AREAS), 'pode'));
}

function marcar_acesso(string $id): void
{
    $usuarios = ler_usuarios();
    foreach ($usuarios as &$u) {
        if ($u['id'] === $id) {
            $u['ultimoAcesso'] = date('c');
            gravar_usuarios($usuarios);
            return;
        }
    }
}

/** Porteiro das páginas que não têm tela de login própria. */
function exigir_login(): void
{
    $u = usuario_atual();
    if ($u === null) {
        header('Location: /painel/?volta=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/painel/'), true, 302);
        exit;
    }
    // senha provisória: não passa daqui sem trocar
    if ($u['trocarSenha'] && basename((string) ($_SERVER['SCRIPT_NAME'] ?? '')) !== 'conta.php') {
        header('Location: /painel/conta.php', true, 302);
        exit;
    }
}

function exigir_area(string $area): void
{
    exigir_login();
    if (!pode($area)) {
        header('Location: /painel/?negado=' . rawurlencode($area), true, 302);
        exit;
    }
}

function exigir_admin(): void
{
    exigir_login();
    if (!e_admin()) {
        header('Location: /painel/?negado=usuarios', true, 302);
        exit;
    }
}
