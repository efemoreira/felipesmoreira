<?php
declare(strict_types=1);

/**
 * Núcleo do painel — felipesmoreira.com/painel
 *
 * Sessão, login e permissão. Todo arquivo do painel começa por aqui, então é
 * aqui que mora a única resposta para "quem é você" e "o que você pode abrir".
 *
 * O que NÃO mora mais aqui, e por quê:
 *   dominio.php         AREAS, CAPACIDADES, TIPOS_PESSOA, REDES, CARGOS,
 *                       DESTINO_AREA — o vocabulário; quem edita um cargo não
 *                       precisa abrir a sessão, e os testes de contrato leem
 *                       este arquivo por texto;
 *   util.php            h(), limpar_texto(), sem_acento(), telefone, municípios
 *                       — nada com efeito colateral;
 *   pessoas-modelo.php  normalizar_pessoa(), ler/gravar_pessoas(), achar_* — a
 *                       única porta para dados/pessoas.php.
 * Os três entram por `require_once` logo abaixo: incluir `sessao.php` continua
 * trazendo tudo.
 *
 * As pessoas ficam em public_html/dados/pessoas.php, fora do repositório: um
 * deploy novo nunca apaga quem tem acesso e nenhuma senha entra no Git. Só o
 * hash é guardado — senha não se recupera, só se troca.
 */

require_once __DIR__ . '/util.php';            // h(), limpar_texto(), sem_acento(), telefone, municípios — sem efeito colateral
require_once __DIR__ . '/dominio.php';         // AREAS, CAPACIDADES, TIPOS_PESSOA, REDES, CARGOS, DESTINO_AREA — o vocabulário do movimento
require_once __DIR__ . '/pessoas-modelo.php';  // normalizar_pessoa(), ler/gravar_pessoas(), achar_*

const SESSAO_SEG = 7200;  // 2 h de inatividade

const PASTA_DADOS    = __DIR__ . '/../dados';
const ARQ_PESSOAS    = PASTA_DADOS . '/pessoas.php';
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
/* DEPOIS do session_start(), de propósito: ele manda o seu Cache-Control
   (`session.cache_limiter`), e o dele depende do php.ini da hospedagem. Este
   não depende. Nenhuma tela do painel fica no cache do navegador — é a lista
   de pessoas com telefone, num celular que às vezes é emprestado. Os endpoints
   públicos que PODEM ser guardados (candidatos, kit, a prévia) mandam o deles
   por cima. `testes/acoes/cabecalhos.test.ts` confere os dois lados. */
header('Cache-Control: no-store, private');

/* ===================== infraestrutura ===================== */

/**
 * Roda `$fn` com a tranca de `$arquivo` na mão — e é dentro dela que se lê.
 *
 * `gravar_atomico()` garante que o arquivo nunca fica pela metade; NÃO garante
 * que duas requisições não leiam a mesma versão, mudem cada uma a sua e a
 * segunda apague o que a primeira gravou. Todo caminho do painel é
 * `ler_X()` → altera → `gravar_X()`, e onde trinta celulares leem o mesmo QR
 * na porta (`api/presenca.php`) isso é uma presença que some sem erro nenhum.
 *
 * A tranca é `flock()` num `<arquivo>.lock` ao lado do dado — dentro de
 * `/dados`, que o `.htaccess` fecha. Quem chama tem de LER DE NOVO dentro do
 * `$fn` (`ler_pessoas(true)`): a cópia que a requisição já tinha na memória é
 * de antes da fila, e é exatamente ela que não vale mais.
 *
 * Sem conseguir abrir o `.lock` (pasta ausente, disco só-leitura) roda sem
 * tranca: melhor gravar como antes do que negar a presença de alguém.
 */
function com_trava(string $arquivo, callable $fn): mixed
{
    preparar_pastas();
    $h = @fopen($arquivo . '.lock', 'c');
    if ($h === false || !@flock($h, LOCK_EX)) {
        if ($h !== false) {
            fclose($h);
        }
        return $fn();
    }
    try {
        return $fn();
    } finally {
        flock($h, LOCK_UN);
        fclose($h);
    }
}

/* ===================== o rastro ===================== */

/** Quem está gravando, pelo nome — como `decididoPor`. Vazio fora de sessão (site, cron). */
function quem_grava(): string
{
    $u = function_exists('usuario_atual') ? usuario_atual() : null;
    return $u === null ? '' : (string) $u['nome'];
}

/**
 * Carimba `alteradoEm`/`alteradoPor` no que mudou entre a lista lida e a que
 * vai ser gravada.
 *
 * É o rastro como CAMPO NA PEÇA, e não como arquivo de log: a linha do tempo
 * continua derivada do que está gravado, só que agora "quem mexeu na ficha" e
 * "quando" estão gravados. Compara por id, ignorando os próprios carimbos e o
 * que `$ignorar` mandar (`ultimoAcesso`, senão todo login vira alteração).
 * Registro novo não ganha carimbo: `criadoEm` já diz.
 */
function carimbar_alteracoes(array $antes, array $depois, array $ignorar = []): array
{
    $porId = [];
    foreach ($antes as $a) {
        if (isset($a['id'])) {
            $porId[$a['id']] = $a;
        }
    }
    $tirar = array_merge(['alteradoEm', 'alteradoPor'], $ignorar);
    $miolo = function (array $r) use ($tirar): string {
        foreach ($tirar as $k) {
            unset($r[$k]);
        }
        return serialize($r);
    };
    foreach ($depois as &$d) {
        if (!isset($d['id']) || !isset($porId[$d['id']])) {
            continue;
        }
        if ($miolo($porId[$d['id']]) !== $miolo($d)) {
            $d['alteradoEm']  = date('c');
            $d['alteradoPor'] = quem_grava();
        }
    }
    unset($d);
    return $depois;
}

function gravar_atomico(string $destino, string $conteudo): bool
{
    /* O SUFIXO É SORTEADO de propósito. Com o `.tmp` fixo, o nome do arquivo do
       meio do caminho era `pessoas.php.tmp` — adivinhável por qualquer um, e
       fora da regra do .htaccess até a linha acima ser corrigida. Sorteado, ele
       deixa de ser um endereço que se digita, e duas gravações simultâneas
       param de disputar o mesmo arquivo temporário. A regra do .htaccess
       continua sendo a tranca; isto é a segunda. */
    $tmp = $destino . '.' . bin2hex(random_bytes(8)) . '.tmp';
    if (@file_put_contents($tmp, $conteudo, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0644);
    if (!@rename($tmp, $destino)) {
        @unlink($tmp);   // rename falhou: não deixar o meio do caminho no disco
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
    /* A ÂNCORA É `(\.|$)`, E NÃO `$` — a diferença é o cadastro inteiro.
       `gravar_atomico()` escreve `pessoas.php.tmp` antes do rename, e
       `\.php$` não casa com um nome que termina em `.tmp`: o arquivo ficava de
       fora da regra, com nome adivinhável, e bastava o rename falhar (disco
       cheio, permissão trocada) para ele ficar lá para sempre — com telefone,
       e-mail e os hashes de senha. Agora a extensão vale em qualquer posição, e
       `.tmp`/`.bak` entram na lista por conta própria. */
    fixar_regra(
        PASTA_DADOS . '/.htaccess',
        "Options -Indexes\n"
        . "<FilesMatch \"\\.(php|php5|phtml|phar|inc|tmp|bak)(\\.|$)\">\n" . $negar . "</FilesMatch>\n"
        . "<FilesMatch \"\\.json(\\.|$)\">\n" . $negar . "</FilesMatch>\n"
        . "<Files \"agenda.json\">\n" . $permitir . "</Files>\n"
    );

    // Versão antiga do contador de tentativas, que ficava legível pela web.
    if (is_file(ARQ_TENTATIVAS_ANTIGO)) {
        @unlink(ARQ_TENTATIVAS_ANTIGO);
    }
}

/* ===================== usuários ===================== */

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

/* ===================== força bruta ===================== */

/**
 * Quem é o visitante, sem guardar o IP: um HMAC dele com o segredo do site.
 *
 * O `X-Forwarded-For` SÓ VALE ATRÁS DE PROXY. Antes, o primeiro endereço da
 * lista era aceito sempre — e o header é escrito por quem manda a requisição:
 * bastava trocá-lo a cada pedido para o teto de envios nunca fechar. Agora ele
 * só é lido quando quem conectou (`REMOTE_ADDR`) é um endereço privado ou de
 * loopback, que é o que um proxy da própria hospedagem tem. Com `REMOTE_ADDR`
 * público, é ele o cliente, e o header é ignorado — ninguém forja o endereço
 * de onde a conexão veio.
 */
function chave_visitante(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $ehProxy = $ip !== '' && filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
    ) === false;
    $enc = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($ehProxy && $enc !== '') {
        $primeiro = trim(explode(',', $enc)[0]);
        if (filter_var($primeiro, FILTER_VALIDATE_IP)) {
            $ip = $primeiro;
        }
    }
    return substr(hash_hmac('sha256', $ip, segredo()), 0, 24);
}

/** Quantos erros, vindos de endereços diferentes ou não, trancam um ENDEREÇO. */
const MAX_TENTATIVAS_IP = 15;

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

/**
 * As duas chaves de um erro de senha: a CONTA vista deste endereço, e o
 * ENDEREÇO sozinho.
 *
 * Só por conta, cinco senhas erradas em qualquer login conhecido trancavam a
 * conta por quinze minutos — para o dono dela também. Era um jeito de deixar
 * a coordenação fora do painel na noite da apuração sabendo só o login. Agora
 * a conta tranca para o endereço que errou, e não para os outros; e o
 * endereço que erra demais, em contas diferentes ou não, tranca por inteiro.
 */
function chaves_de_falha(string $usuario): array
{
    $visitante = chave_visitante();
    return [
        'conta' => mb_strtolower($usuario) . '@' . $visitante,
        'ip'    => 'ip:' . $visitante,
    ];
}

/** Até quando este visitante está barrado nesta conta — 0 quando não está. */
function bloqueado_ate(string $usuario): int
{
    $tudo = estado_tentativas();
    $agora = time();
    $maior = 0;
    foreach (chaves_de_falha($usuario) as $chave) {
        $ate = (int) ($tudo[$chave]['ate'] ?? 0);
        if ($ate > $agora) {
            $maior = max($maior, $ate);
        }
    }
    return $maior;
}

function registrar_falha(string $usuario): void
{
    com_trava(ARQ_TENTATIVAS, function () use ($usuario): void {
        $tudo = estado_tentativas();
        $agora = time();
        $tetos = ['conta' => MAX_TENTATIVAS, 'ip' => MAX_TENTATIVAS_IP];

        foreach (chaves_de_falha($usuario) as $tipo => $chave) {
            $atual = is_array($tudo[$chave] ?? null) ? $tudo[$chave] : ['contagem' => 0, 'ate' => 0];
            $atual['contagem'] = ((int) ($atual['contagem'] ?? 0)) + 1;
            if ($atual['contagem'] >= $tetos[$tipo]) {
                $atual['ate'] = $agora + BLOQUEIO_SEG;
                $atual['contagem'] = 0;
            }
            $tudo[$chave] = $atual;
        }

        // some com o que já expirou, para o arquivo não crescer sem fim
        foreach ($tudo as $k => $v) {
            if (((int) ($v['ate'] ?? 0)) < $agora && ((int) ($v['contagem'] ?? 0)) === 0) {
                unset($tudo[$k]);
            }
        }
        gravar_tentativas($tudo);
    });
}

/** Entrou: a conta deste endereço zera. O contador do endereço fica — acertar
    uma conta não prova nada sobre as outras que ele tentou. */
function limpar_falhas(string $usuario): void
{
    com_trava(ARQ_TENTATIVAS, function () use ($usuario): void {
        $tudo = estado_tentativas();
        $chave = chaves_de_falha($usuario)['conta'];
        if (isset($tudo[$chave])) {
            unset($tudo[$chave]);
            gravar_tentativas($tudo);
        }
    });
}

/* ===================== sessão ===================== */

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
 * A CONTA de um telefone, ou null.
 *
 * Diferente de `pessoas_por_telefone()`, que devolve qualquer pessoa: esta só
 * olha quem tem login. Existe para a página pública de presença reconhecer quem
 * já é do time sem perguntar de novo nome, bairro e cidade.
 */
function usuario_por_telefone(string $telefone): ?array
{
    foreach (pessoas_por_telefone($telefone) as $p) {
        if (tem_conta($p)) {
            return $p;
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
    $u = achar_pessoa($id);
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

function rotulo_do_acesso(array $p): string
{
    if (in_array('adm', $p['capacidades'], true)) {
        return 'Administração';
    }
    $nomes = [];
    foreach ($p['capacidades'] as $c) {
        $nomes[] = CAPACIDADES[$c]['nome'] ?? $c;
    }
    if ($nomes !== []) {
        return implode(' · ', $nomes);
    }
    return TIPOS_PESSOA[$p['tipo']] ?? 'Militante';
}

/** Administra? É uma capacidade, e não mais um "papel" à parte. */
function e_admin(): bool
{
    $u = usuario_atual();
    return $u !== null && in_array('adm', $u['capacidades'], true);
}

/** Tem a capacidade? `adm` responde sim para todas. */
function tem_capacidade(string $chave): bool
{
    $u = usuario_atual();
    if ($u === null) {
        return false;
    }
    return in_array('adm', $u['capacidades'], true) || in_array($chave, $u['capacidades'], true);
}

function pode(string $area): bool
{
    $u = usuario_atual();
    return $u !== null && in_array($area, $u['areas'], true);
}

/** As áreas que a pessoa logada realmente abre, na ordem da constante. */
function areas_do_usuario(): array
{
    return array_values(array_filter(array_keys(AREAS), 'pode'));
}

function marcar_acesso(string $id): void
{
    com_trava(ARQ_PESSOAS, function () use ($id): void {
        $pessoas = ler_pessoas(true);
        foreach ($pessoas as &$p) {
            if ($p['id'] === $id) {
                $p['ultimoAcesso'] = date('c');
                gravar_pessoas($pessoas);
                return;
            }
        }
    });
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

/**
 * Só `adm` passa. `$negado` é o que o Início vai explicar: uma área de AREAS
 * ("você não tem acesso a Pessoas") ou o genérico `usuarios`.
 *
 * É a trava de verdade das áreas só-adm (`areas_so_adm()`): `exigir_area()`
 * confia em `areas`, e `areas` é o que alguém marcou numa ficha. Aqui a
 * pergunta é à capacidade, que só outro administrador dá.
 */
function exigir_admin(string $negado = 'usuarios'): void
{
    exigir_login();
    if (!e_admin()) {
        header('Location: /painel/?negado=' . rawurlencode($negado), true, 302);
        exit;
    }
}
