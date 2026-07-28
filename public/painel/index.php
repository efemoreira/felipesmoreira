<?php
declare(strict_types=1);

/**
 * Painel da Programação da Semana — felipesmoreira.com/painel
 *
 * Roda na hospedagem (PHP da Hostinger) e grava a agenda em
 * public_html/dados/agenda.json. Essa pasta NÃO está no repositório, então um
 * novo deploy pelo hPanel não apaga o que foi editado aqui.
 *
 * A senha é definida no primeiro acesso e guardada como hash em
 * dados/config.php — nada de senha dentro do repositório.
 */

const PASTA_DADOS   = __DIR__ . '/../dados';
const ARQ_AGENDA    = PASTA_DADOS . '/agenda.json';
const ARQ_CONFIG    = PASTA_DADOS . '/config.php';
const ARQ_TENTATIVAS = PASTA_DADOS . '/tentativas.json';
const PASTA_BACKUP  = PASTA_DADOS . '/backups';
const PASTA_IMAGENS = PASTA_DADOS . '/imagens';
const URL_IMAGENS   = '/dados/imagens';                   // como a página enxerga a pasta
const ARQ_SEMENTE   = __DIR__ . '/../dados-semente.json'; // cópia do build, só p/ preencher na 1ª vez

const MAX_TENTATIVAS = 5;
const BLOQUEIO_SEG   = 900;   // 15 min
const SESSAO_SEG     = 7200;  // 2 h
const MAX_BACKUPS    = 12;
const MAX_UPLOAD     = 8388608; // 8 MB — foto de celular passa folgado
const LARGURA_MAX    = 1000;    // a miniatura aparece com ~240px; 1000 cobre telas retina

const CORES = ['ouro' => 'Ouro', 'milho' => 'Milho', 'azul' => 'Azul', 'escuro' => 'Escuro', 'papel' => 'Papel'];
const PLATAFORMAS = [
    ''          => 'nenhuma',
    'youtube'   => 'YouTube',
    'instagram' => 'Instagram',
    'twitch'    => 'Twitch',
    'kick'      => 'Kick',
    'tiktok'    => 'TikTok',
    'x'         => 'X / Twitter',
    'whatsapp'  => 'WhatsApp',
    'video'     => 'Kwai / vídeo',
];
const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const CANAIS_PADRAO = [
    ['nome' => 'YouTube',   'icone' => 'youtube',   'url' => 'https://youtube.com/@moreiramissao'],
    ['nome' => 'Instagram', 'icone' => 'instagram', 'url' => 'https://instagram.com/moreiramissao'],
    ['nome' => 'Twitch',    'icone' => 'twitch',    'url' => 'https://twitch.tv/moreiramissao'],
    ['nome' => 'Kick',      'icone' => 'kick',      'url' => 'https://kick.com/moreiramissao'],
    ['nome' => 'TikTok',    'icone' => 'tiktok',    'url' => 'https://tiktok.com/@moreiramissao'],
];

/* ===================== infraestrutura ===================== */

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

/** Aceita qualquer coisa vinda do JSON (inclusive null/número) e devolve HTML seguro. */
function h($s): string
{
    return htmlspecialchars(is_scalar($s) ? (string) $s : '', ENT_QUOTES, 'UTF-8');
}

function preparar_pastas(): void
{
    if (!is_dir(PASTA_DADOS)) {
        @mkdir(PASTA_DADOS, 0755, true);
    }
    if (!is_dir(PASTA_BACKUP)) {
        @mkdir(PASTA_BACKUP, 0755, true);
    }
    if (!is_dir(PASTA_IMAGENS)) {
        @mkdir(PASTA_IMAGENS, 0755, true);
    }
    // nada de PHP rodando dentro da pasta de imagens, mesmo se algo escapar da validação
    $trava = PASTA_IMAGENS . '/.htaccess';
    if (!file_exists($trava)) {
        @file_put_contents($trava, "Options -Indexes\nAddType text/plain .php .php5 .phtml .phar .cgi .pl\n<IfModule mod_php.c>\n  php_flag engine off\n</IfModule>\n");
    }
    // backups e config não podem ser baixados pela web; agenda.json sim (a página lê)
    $regra = PASTA_BACKUP . '/.htaccess';
    if (!file_exists($regra)) {
        @file_put_contents($regra, "Options -Indexes\n<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
    }
    $indices = PASTA_DADOS . '/.htaccess';
    if (!file_exists($indices)) {
        @file_put_contents($indices, "Options -Indexes\n<Files \"config.php\">\n  <IfModule mod_authz_core.c>\n    Require all denied\n  </IfModule>\n  <IfModule !mod_authz_core.c>\n    Order allow,deny\n    Deny from all\n  </IfModule>\n</Files>\n");
    }
}

function ler_config(): ?array
{
    if (!is_file(ARQ_CONFIG)) {
        return null;
    }
    $cfg = @include ARQ_CONFIG;
    return is_array($cfg) && !empty($cfg['hash']) ? $cfg : null;
}

function gravar_config(string $senha): bool
{
    preparar_pastas();
    $conteudo = "<?php\n// Gerado pelo painel. Não versionar, não editar à mão.\nreturn " .
        var_export(['hash' => password_hash($senha, PASSWORD_DEFAULT), 'criado' => date('c')], true) . ";\n";
    return gravar_atomico(ARQ_CONFIG, $conteudo);
}

function gravar_atomico(string $destino, string $conteudo): bool
{
    $tmp = $destino . '.tmp';
    if (@file_put_contents($tmp, $conteudo, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0644);
    return @rename($tmp, $destino);
}

/* ---- proteção contra força bruta ---- */
function estado_tentativas(): array
{
    $bruto = is_file(ARQ_TENTATIVAS) ? json_decode((string) @file_get_contents(ARQ_TENTATIVAS), true) : null;
    return is_array($bruto) ? $bruto + ['contagem' => 0, 'ate' => 0] : ['contagem' => 0, 'ate' => 0];
}

function bloqueado_ate(): int
{
    $e = estado_tentativas();
    return ((int) $e['ate']) > time() ? (int) $e['ate'] : 0;
}

function registrar_falha(): void
{
    preparar_pastas();
    $e = estado_tentativas();
    $e['contagem'] = ((int) $e['contagem']) + 1;
    if ($e['contagem'] >= MAX_TENTATIVAS) {
        $e['ate'] = time() + BLOQUEIO_SEG;
        $e['contagem'] = 0;
    }
    gravar_atomico(ARQ_TENTATIVAS, (string) json_encode($e));
}

function limpar_falhas(): void
{
    if (is_file(ARQ_TENTATIVAS)) {
        @unlink(ARQ_TENTATIVAS);
    }
}

/* ---- sessão ---- */
function autenticado(): bool
{
    if (empty($_SESSION['ok'])) {
        return false;
    }
    if ((time() - (int) ($_SESSION['visto'] ?? 0)) > SESSAO_SEG) {
        session_destroy();
        return false;
    }
    $_SESSION['visto'] = time();
    return true;
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

/* ===================== dados da agenda ===================== */

function agenda_atual(): array
{
    foreach ([ARQ_AGENDA, ARQ_SEMENTE] as $arquivo) {
        if (is_file($arquivo)) {
            $dados = json_decode((string) @file_get_contents($arquivo), true);
            if (is_array($dados) && isset($dados['programacao'])) {
                return $dados;
            }
        }
    }
    return [
        'titulo'       => 'Agenda da Semana',
        'periodo'      => '',
        'chamada'      => '',
        'disponivelEm' => CANAIS_PADRAO,
        'programacao'  => [],
    ];
}

function limpar_texto($v, int $max): string
{
    $s = is_string($v) ? trim($v) : '';
    $s = preg_replace('/[\x00-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}

/** Só http(s), caminho interno ou mailto/tel — nada de javascript: no href. */
function limpar_link($v): string
{
    $s = limpar_texto($v, 300);
    if ($s === '') {
        return '';
    }
    if (preg_match('#^(https?://|/|mailto:|tel:)#i', $s)) {
        return $s;
    }
    // qualquer outro esquema (javascript:, data:, file:...) é descartado
    if (preg_match('#^[a-z][a-z0-9+.\-]*:#i', $s)) {
        return '';
    }
    return 'https://' . ltrim($s, '/'); // digitou "youtube.com/..." sem o https
}

/* ---- imagens enviadas pelo painel ---- */

/** Apaga um arquivo só se ele for mesmo da nossa pasta de imagens. */
function apagar_imagem(string $caminhoPublico): void
{
    if (strpos($caminhoPublico, URL_IMAGENS . '/') !== 0) {
        return; // link externo ou caminho do repositório: não é nosso para apagar
    }
    $arquivo = PASTA_IMAGENS . '/' . basename($caminhoPublico);
    if (is_file($arquivo)) {
        @unlink($arquivo);
    }
}

/** Com name="imagem[N]", o PHP entrega $_FILES['imagem']['name'][N]; aqui vira um array normal. */
function arquivo_enviado($indice): ?array
{
    $f = $_FILES['imagem'] ?? null;
    if (!is_array($f) || !isset($f['error'][$indice]) || is_array($f['error'][$indice])) {
        return null;
    }
    return [
        'tmp_name' => (string) ($f['tmp_name'][$indice] ?? ''),
        'error'    => (int) $f['error'][$indice],
        'size'     => (int) ($f['size'][$indice] ?? 0),
    ];
}

/**
 * Valida, corrige a rotação (foto de celular) e grava redimensionada.
 * Devolve ['ok' => bool, 'caminho' => string, 'erro' => string].
 */
function guardar_upload(array $arquivo): array
{
    $erro = (int) ($arquivo['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($erro === UPLOAD_ERR_NO_FILE) {
        return ['ok' => false, 'caminho' => '', 'erro' => ''];
    }
    if ($erro === UPLOAD_ERR_INI_SIZE || $erro === UPLOAD_ERR_FORM_SIZE) {
        return ['ok' => false, 'caminho' => '', 'erro' => 'imagem maior que o limite do servidor'];
    }
    if ($erro !== UPLOAD_ERR_OK || !is_uploaded_file($arquivo['tmp_name'] ?? '')) {
        return ['ok' => false, 'caminho' => '', 'erro' => 'falha no envio da imagem'];
    }
    if (((int) ($arquivo['size'] ?? 0)) > MAX_UPLOAD) {
        return ['ok' => false, 'caminho' => '', 'erro' => 'imagem acima de 8 MB'];
    }

    // o que manda é o conteúdo do arquivo, não a extensão nem o content-type do navegador
    $info = @getimagesize($arquivo['tmp_name']);
    $tipos = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF];
    if (!$info || !in_array($info[2], $tipos, true)) {
        return ['ok' => false, 'caminho' => '', 'erro' => 'formato não aceito (use JPG, PNG ou WEBP)'];
    }

    preparar_pastas();
    $nome = date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.jpg';
    $destino = PASTA_IMAGENS . '/' . $nome;

    if (!function_exists('imagecreatetruecolor')) {
        // sem GD: guarda como veio (já validada), mas com a extensão certa
        $ext = [IMAGETYPE_PNG => '.png', IMAGETYPE_WEBP => '.webp', IMAGETYPE_GIF => '.gif'][$info[2]] ?? '.jpg';
        $nome = substr($nome, 0, -4) . $ext;
        $destino = PASTA_IMAGENS . '/' . $nome;
        return @move_uploaded_file($arquivo['tmp_name'], $destino)
            ? ['ok' => true, 'caminho' => URL_IMAGENS . '/' . $nome, 'erro' => '']
            : ['ok' => false, 'caminho' => '', 'erro' => 'não consegui gravar a imagem'];
    }

    $origem = criar_imagem($arquivo['tmp_name'], $info[2]);
    if (!$origem) {
        return ['ok' => false, 'caminho' => '', 'erro' => 'não consegui ler a imagem'];
    }
    $origem = corrigir_rotacao($origem, $arquivo['tmp_name'], $info[2]);

    $lo = imagesx($origem);
    $al = imagesy($origem);
    $escala = $lo > LARGURA_MAX ? LARGURA_MAX / $lo : 1.0;
    $nl = max(1, (int) round($lo * $escala));
    $na = max(1, (int) round($al * $escala));

    $saida = imagecreatetruecolor($nl, $na);
    // fundo escuro no lugar da transparência (o cartão é escuro)
    imagefill($saida, 0, 0, imagecolorallocate($saida, 0x14, 0x11, 0x0C));
    imagecopyresampled($saida, $origem, 0, 0, 0, 0, $nl, $na, $lo, $al);

    $gravou = imagejpeg($saida, $destino, 82);
    imagedestroy($saida);
    imagedestroy($origem);

    if (!$gravou) {
        return ['ok' => false, 'caminho' => '', 'erro' => 'não consegui gravar a imagem'];
    }
    @chmod($destino, 0644);
    return ['ok' => true, 'caminho' => URL_IMAGENS . '/' . $nome, 'erro' => ''];
}

function criar_imagem(string $arquivo, int $tipo)
{
    switch ($tipo) {
        case IMAGETYPE_JPEG: return @imagecreatefromjpeg($arquivo);
        case IMAGETYPE_PNG:  return @imagecreatefrompng($arquivo);
        case IMAGETYPE_GIF:  return @imagecreatefromgif($arquivo);
        case IMAGETYPE_WEBP: return function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($arquivo) : false;
    }
    return false;
}

/** Foto tirada de lado no celular chega deitada; o EXIF diz como endireitar. */
function corrigir_rotacao($imagem, string $arquivo, int $tipo)
{
    if ($tipo !== IMAGETYPE_JPEG || !function_exists('exif_read_data')) {
        return $imagem;
    }
    $exif = @exif_read_data($arquivo);
    $orientacao = (int) ($exif['Orientation'] ?? 0);
    $graus = [3 => 180, 6 => -90, 8 => 90][$orientacao] ?? 0;
    if ($graus === 0) {
        return $imagem;
    }
    $girada = @imagerotate($imagem, $graus, 0);
    if ($girada) {
        imagedestroy($imagem);
        return $girada;
    }
    return $imagem;
}

function slug(string $s, int $i): string
{
    $t = iconv('UTF-8', 'ASCII//TRANSLIT', $s) ?: $s;
    $t = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $t) ?? '');
    $t = trim($t, '-');
    return $t !== '' ? $t : 'item-' . $i;
}

function montar_agenda_do_post(array $post, array &$recados): array
{
    $itens = [];
    $linhas = is_array($post['item'] ?? null) ? $post['item'] : [];
    $chaves = array_keys($linhas); // os índices do formulário, para casar com $_FILES

    foreach (array_values($linhas) as $i => $linha) {
        if (!is_array($linha)) {
            continue;
        }
        $titulo = limpar_texto($linha['titulo'] ?? '', 120);
        if ($titulo === '') {
            continue; // linha em branco: some
        }
        $cor = (string) ($linha['cor'] ?? 'ouro');
        $plataforma = (string) ($linha['plataforma'] ?? '');
        $link = limpar_link($linha['link'] ?? '');

        /* imagem: upload novo > pedido de remoção > o que já estava lá */
        $imagem = limpar_texto($linha['imagem'] ?? '', 300);
        $enviado = arquivo_enviado($chaves[$i]);

        if ($enviado !== null) {
            $r = guardar_upload($enviado);
            if ($r['ok']) {
                apagar_imagem($imagem); // a que estava no lugar não serve mais
                $imagem = $r['caminho'];
            } elseif ($r['erro'] !== '') {
                $recados[] = 'Item “' . $titulo . '”: ' . $r['erro'] . '.';
            }
        }
        if (!empty($linha['remover_imagem'])) {
            apagar_imagem($imagem);
            $imagem = '';
        }

        $itens[] = [
            'id'         => limpar_texto($linha['id'] ?? '', 60) ?: slug($titulo, $i),
            'titulo'     => $titulo,
            'subtitulo'  => limpar_texto($linha['subtitulo'] ?? '', 160),
            'dia'        => limpar_texto($linha['dia'] ?? '', 20),
            'data'       => limpar_texto($linha['data'] ?? '', 20),
            'hora'       => limpar_texto($linha['hora'] ?? '', 20),
            'aoVivo'     => !empty($linha['aoVivo']),
            // isset() não funciona sobre constante — array_key_exists resolve
            'cor'        => array_key_exists($cor, CORES) ? $cor : 'ouro',
            'plataforma' => array_key_exists($plataforma, PLATAFORMAS) ? $plataforma : '',
            'imagem'     => $imagem,
            'link'       => $link,
            'interno'    => $link !== '' && $link[0] === '/', // link do próprio site
        ];
    }

    $canaisMarcados = is_array($post['canal'] ?? null) ? $post['canal'] : [];
    $canais = [];
    foreach (CANAIS_PADRAO as $c) {
        if (in_array($c['icone'], $canaisMarcados, true)) {
            $canais[] = $c;
        }
    }

    return [
        'titulo'       => limpar_texto($post['titulo'] ?? '', 60) ?: 'Agenda da Semana',
        'periodo'      => limpar_texto($post['periodo'] ?? '', 60),
        'chamada'      => limpar_texto($post['chamada'] ?? '', 200),
        'disponivelEm' => $canais,
        'programacao'  => $itens,
        'atualizadoEm' => date('c'),
    ];
}

function publicar(array $agenda): bool
{
    preparar_pastas();
    if (is_file(ARQ_AGENDA)) {
        @copy(ARQ_AGENDA, PASTA_BACKUP . '/agenda-' . date('Ymd-His') . '.json');
        $antigos = glob(PASTA_BACKUP . '/agenda-*.json') ?: [];
        if (count($antigos) > MAX_BACKUPS) {
            sort($antigos);
            foreach (array_slice($antigos, 0, count($antigos) - MAX_BACKUPS) as $velho) {
                @unlink($velho);
            }
        }
    }
    $json = json_encode($agenda, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || !gravar_atomico(ARQ_AGENDA, $json)) {
        return false;
    }
    varrer_imagens_orfas($agenda);
    return true;
}

/**
 * Apaga imagens que nenhum item usa mais — sobra de item removido, por exemplo.
 * Só mexe em arquivo com mais de 7 dias, para não atropelar um upload recente
 * nem uma imagem que ainda apareça em algum backup próximo.
 */
function varrer_imagens_orfas(array $agenda): void
{
    if (!is_dir(PASTA_IMAGENS)) {
        return;
    }
    $usadas = [];
    foreach (($agenda['programacao'] ?? []) as $item) {
        if (!empty($item['imagem'])) {
            $usadas[basename((string) $item['imagem'])] = true;
        }
    }
    $limite = time() - 7 * 86400;
    foreach ((glob(PASTA_IMAGENS . '/*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: []) as $arquivo) {
        if (!isset($usadas[basename($arquivo)]) && @filemtime($arquivo) < $limite) {
            @unlink($arquivo);
        }
    }
}

/* ===================== fluxo ===================== */

$config = ler_config();
$aviso = null;
$sucesso = null;
$acao = (string) ($_POST['acao'] ?? '');

if ($acao === 'definir_senha' && $config === null) {
    $s1 = (string) ($_POST['senha'] ?? '');
    $s2 = (string) ($_POST['senha2'] ?? '');
    if (mb_strlen($s1) < 10) {
        $aviso = 'A senha precisa de pelo menos 10 caracteres.';
    } elseif ($s1 !== $s2) {
        $aviso = 'As duas senhas não são iguais.';
    } elseif (!gravar_config($s1)) {
        $aviso = 'Não consegui gravar em /dados. Confira as permissões da pasta no hPanel.';
    } else {
        $config = ler_config();
        $sucesso = 'Senha criada. Entre para editar a agenda.';
    }
} elseif ($acao === 'entrar' && $config !== null) {
    if ($ate = bloqueado_ate()) {
        $aviso = 'Muitas tentativas. Tente de novo às ' . date('H:i', $ate) . '.';
    } elseif (password_verify((string) ($_POST['senha'] ?? ''), $config['hash'])) {
        session_regenerate_id(true);
        $_SESSION['ok'] = true;
        $_SESSION['visto'] = time();
        limpar_falhas();
    } else {
        registrar_falha();
        $aviso = 'Senha incorreta.';
    }
} elseif ($acao === 'sair') {
    $_SESSION = [];
    session_destroy();
    header('Location: index.php');
    exit;
} elseif ($acao === 'salvar') {
    if (!autenticado() || !token_valido()) {
        $aviso = 'Sessão expirada. Entre de novo — o que você digitou não foi salvo.';
        $_SESSION = [];
        session_destroy();
    } else {
        $recados = [];
        $nova = montar_agenda_do_post($_POST, $recados);
        if (publicar($nova)) {
            $sucesso = count($nova['programacao']) . ' item(ns) publicado(s). A página já está mostrando a nova agenda.';
            if ($recados) {
                $aviso = implode(' ', $recados) . ' O resto foi salvo normalmente.';
            }
        } else {
            $aviso = 'Não consegui gravar dados/agenda.json. Confira as permissões da pasta no hPanel.';
        }
    }
} elseif ($acao === '' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && !$_POST) {
    // POST vazio com corpo grande = passou do post_max_size do PHP (upload pesado demais)
    $aviso = 'O envio passou do limite do servidor. Reduza a imagem (ou envie uma de cada vez) e tente de novo.';
}

$logado = autenticado();
$agenda = $logado ? agenda_atual() : [];
$canaisAtivos = array_column($agenda['disponivelEm'] ?? CANAIS_PADRAO, 'icone');
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Painel da Programação — Missão Ceará</title>
<style>
  :root { --ouro:#FFCB05; --ink:#181203; --creme:#F6F5EF; --noite:#14110C; --papel:#1C1710; }
  * { box-sizing: border-box; }
  body {
    margin:0; padding:24px 16px 64px; background:var(--noite); color:var(--creme);
    font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  }
  .capa { max-width:940px; margin:0 auto; }
  h1 { font-size:22px; letter-spacing:1px; text-transform:uppercase; color:var(--ouro); margin:0 0 4px; }
  .sub { color:#b9b3a5; font-size:13px; margin:0 0 24px; }
  fieldset { border:2px solid rgba(255,203,5,.35); margin:0 0 18px; padding:16px; background:rgba(0,0,0,.25); }
  legend { color:var(--ouro); font-size:12px; letter-spacing:2px; text-transform:uppercase; padding:0 8px; }
  label { display:block; font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#c9c2b2; margin:0 0 4px; }
  input[type=text], input[type=password], select, textarea {
    width:100%; padding:9px 10px; background:#0e0c08; color:var(--creme);
    border:2px solid rgba(255,203,5,.3); border-radius:0; font:inherit;
  }
  input:focus, select:focus, textarea:focus { outline:2px solid var(--ouro); outline-offset:1px; border-color:var(--ouro); }
  .linha { display:grid; gap:12px; }
  .g2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .g4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
  @media (max-width:700px){ .g2,.g4 { grid-template-columns:1fr; } }
  .campo { margin:0 0 12px; }
  .item { border:2px solid rgba(255,203,5,.25); background:rgba(255,203,5,.04); padding:14px; margin:0 0 14px; }
  .item-topo { display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0 0 12px; }
  .item-num { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:var(--ouro); }
  .btn {
    display:inline-flex; align-items:center; gap:7px; cursor:pointer; font:inherit; font-size:13px;
    letter-spacing:1.5px; text-transform:uppercase; padding:10px 16px;
    background:transparent; color:var(--creme); border:2px solid var(--ouro);
  }
  .btn:hover { background:rgba(255,203,5,.15); }
  .btn-ouro { background:var(--ouro); color:var(--ink); border-color:var(--ink); font-weight:600; }
  .btn-ouro:hover { background:#ffd93d; }
  .btn-mini { padding:6px 10px; font-size:11px; border-color:rgba(255,203,5,.45); }
  .acoes { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  .barra { position:sticky; bottom:0; background:linear-gradient(180deg,rgba(20,17,12,0),var(--noite) 40%); padding:18px 0 4px; }
  .msg { padding:12px 14px; border:2px solid; margin:0 0 18px; font-size:14px; }
  .msg-ok { border-color:#4ade80; color:#bbf7d0; background:rgba(74,222,128,.1); }
  .msg-erro { border-color:#f87171; color:#fecaca; background:rgba(248,113,113,.1); }
  .caixa { max-width:420px; margin:8vh auto; border:3px solid var(--ouro); padding:24px; background:var(--papel); }
  .check { display:flex; align-items:center; gap:8px; font-size:13px; text-transform:none; letter-spacing:0; color:var(--creme); }
  .check input { width:18px; height:18px; accent-color:var(--ouro); }
  .canais { display:flex; flex-wrap:wrap; gap:14px; }
  a { color:var(--ouro); }
  .dica { font-size:12px; color:#9d968a; margin:6px 0 0; }
  .imagem { display:flex; gap:12px; align-items:flex-start; }
  .imagem-acoes { flex:1; min-width:0; }
  .imagem-acoes input[type=file] { width:100%; font-size:13px; color:#c9c2b2; margin:0 0 8px; }
  .imagem-acoes input[type=file]::file-selector-button {
    font:inherit; font-size:12px; text-transform:uppercase; letter-spacing:1px; cursor:pointer;
    background:var(--ouro); color:var(--ink); border:0; padding:8px 12px; margin-right:10px;
  }
  .miniatura {
    flex:0 0 auto; width:132px; aspect-ratio:16/9; overflow:hidden;
    border:2px solid rgba(255,203,5,.35); background:#0e0c08;
  }
  .miniatura img { width:100%; height:100%; object-fit:cover; display:block; }
  .miniatura.vazia {
    display:grid; place-items:center; text-align:center; line-height:1.2;
    font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#6f695d;
    background:repeating-linear-gradient(135deg,rgba(255,203,5,.10) 0 6px,transparent 6px 12px),#0e0c08;
  }
</style>
</head>
<body>

<?php if ($config === null): /* ---------- primeiro acesso ---------- */ ?>
  <div class="caixa">
    <h1>Criar senha</h1>
    <p class="sub">Primeiro acesso ao painel. A senha fica só na hospedagem, nunca no GitHub.</p>
    <?php if ($aviso): ?><p class="msg msg-erro"><?= h($aviso) ?></p><?php endif; ?>
    <form method="post">
      <input type="hidden" name="acao" value="definir_senha">
      <div class="campo">
        <label for="s1">Senha (mínimo 10 caracteres)</label>
        <input id="s1" type="password" name="senha" autocomplete="new-password" required>
      </div>
      <div class="campo">
        <label for="s2">Repita a senha</label>
        <input id="s2" type="password" name="senha2" autocomplete="new-password" required>
      </div>
      <button class="btn btn-ouro" type="submit">Criar senha</button>
    </form>
  </div>

<?php elseif (!$logado): /* ---------- login ---------- */ ?>
  <div class="caixa">
    <h1>Painel da agenda</h1>
    <p class="sub">Programação da semana — Missão Ceará</p>
    <?php if ($aviso): ?><p class="msg msg-erro"><?= h($aviso) ?></p><?php endif; ?>
    <?php if ($sucesso): ?><p class="msg msg-ok"><?= h($sucesso) ?></p><?php endif; ?>
    <form method="post">
      <input type="hidden" name="acao" value="entrar">
      <div class="campo">
        <label for="senha">Senha</label>
        <input id="senha" type="password" name="senha" autocomplete="current-password" required autofocus>
      </div>
      <button class="btn btn-ouro" type="submit">Entrar</button>
    </form>
  </div>

<?php else: /* ---------- editor ---------- */ ?>
  <div class="capa">
    <div class="item-topo">
      <div>
        <h1>Programação da semana</h1>
        <p class="sub" style="margin:0">
          Edite, salve e a página <a href="/programacao" target="_blank" rel="noopener">/programacao</a> muda na hora.
        </p>
      </div>
      <form method="post"><input type="hidden" name="acao" value="sair">
        <button class="btn btn-mini" type="submit">Sair</button>
      </form>
    </div>

    <?php if ($aviso): ?><p class="msg msg-erro"><?= h($aviso) ?></p><?php endif; ?>
    <?php if ($sucesso): ?><p class="msg msg-ok"><?= h($sucesso) ?></p><?php endif; ?>

    <form method="post" id="form" enctype="multipart/form-data">
      <input type="hidden" name="acao" value="salvar">
      <input type="hidden" name="MAX_FILE_SIZE" value="<?= MAX_UPLOAD ?>">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">

      <fieldset>
        <legend>Cabeçalho</legend>
        <div class="linha g2">
          <div class="campo">
            <label for="t">Título</label>
            <input id="t" type="text" name="titulo" value="<?= h($agenda['titulo'] ?? '') ?>" maxlength="60">
            <p class="dica">A primeira palavra sai em ouro na página e na imagem.</p>
          </div>
          <div class="campo">
            <label for="p">Período</label>
            <input id="p" type="text" name="periodo" value="<?= h($agenda['periodo'] ?? '') ?>" maxlength="60" placeholder="29/07 a 01/08">
          </div>
        </div>
        <div class="campo">
          <label for="c">Chamada</label>
          <input id="c" type="text" name="chamada" value="<?= h($agenda['chamada'] ?? '') ?>" maxlength="200">
        </div>
        <div class="campo">
          <label>Disponível em</label>
          <div class="canais">
            <?php foreach (CANAIS_PADRAO as $canal): ?>
              <label class="check">
                <input type="checkbox" name="canal[]" value="<?= h($canal['icone']) ?>"
                  <?= in_array($canal['icone'], $canaisAtivos, true) ? 'checked' : '' ?>>
                <?= h($canal['nome']) ?>
              </label>
            <?php endforeach; ?>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Itens da semana</legend>
        <div id="itens">
          <?php
          $itens = $agenda['programacao'] ?? [];
          if (!$itens) {
              $itens = [[]];
          }
          foreach (array_values($itens) as $n => $it):
              $cor = $it['cor'] ?? 'ouro';
              $plat = $it['plataforma'] ?? '';
          ?>
          <div class="item">
            <div class="item-topo">
              <span class="item-num">Item <?= $n + 1 ?></span>
              <span class="acoes">
                <button class="btn btn-mini" type="button" data-mover="-1">↑</button>
                <button class="btn btn-mini" type="button" data-mover="1">↓</button>
                <button class="btn btn-mini" type="button" data-remover>Remover</button>
              </span>
            </div>
            <input type="hidden" name="item[<?= $n ?>][id]" value="<?= h($it['id'] ?? '') ?>">
            <div class="campo">
              <label>Título</label>
              <input type="text" name="item[<?= $n ?>][titulo]" value="<?= h($it['titulo'] ?? '') ?>" maxlength="120">
            </div>
            <div class="campo">
              <label>Subtítulo</label>
              <input type="text" name="item[<?= $n ?>][subtitulo]" value="<?= h($it['subtitulo'] ?? '') ?>" maxlength="160">
            </div>
            <div class="linha g4">
              <div class="campo">
                <label>Dia</label>
                <input type="text" name="item[<?= $n ?>][dia]" value="<?= h($it['dia'] ?? '') ?>" list="dias" maxlength="20">
              </div>
              <div class="campo">
                <label>Data</label>
                <input type="text" name="item[<?= $n ?>][data]" value="<?= h($it['data'] ?? '') ?>" maxlength="20" placeholder="29/07">
              </div>
              <div class="campo">
                <label>Hora</label>
                <input type="text" name="item[<?= $n ?>][hora]" value="<?= h($it['hora'] ?? '') ?>" maxlength="20" placeholder="19H">
              </div>
              <div class="campo">
                <label>Cor</label>
                <select name="item[<?= $n ?>][cor]">
                  <?php foreach (CORES as $v => $rotulo): ?>
                    <option value="<?= h($v) ?>" <?= $cor === $v ? 'selected' : '' ?>><?= h($rotulo) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>
            <div class="linha g2">
              <div class="campo">
                <label>Plataforma (selo)</label>
                <select name="item[<?= $n ?>][plataforma]">
                  <?php foreach (PLATAFORMAS as $v => $rotulo): ?>
                    <option value="<?= h($v) ?>" <?= $plat === $v ? 'selected' : '' ?>><?= h($rotulo) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="campo">
                <label>Link</label>
                <input type="text" name="item[<?= $n ?>][link]" value="<?= h($it['link'] ?? '') ?>" maxlength="300" placeholder="https://youtube.com/@moreiramissao">
              </div>
            </div>
            <div class="campo">
              <label class="check">
                <input type="checkbox" name="item[<?= $n ?>][aoVivo]" value="1" <?= !empty($it['aoVivo']) ? 'checked' : '' ?>>
                Ao vivo
              </label>
            </div>
            <div>
              <div class="campo">
                <label>Imagem (opcional)</label>
                <div class="imagem">
                  <?php $temImagem = !empty($it['imagem']); ?>
                  <div class="miniatura<?= $temImagem ? '' : ' vazia' ?>">
                    <?php if ($temImagem): ?>
                      <img src="<?= h($it['imagem']) ?>" alt="">
                    <?php else: ?>
                      <span>sem<br>imagem</span>
                    <?php endif; ?>
                  </div>
                  <div class="imagem-acoes">
                    <input type="file" name="imagem[<?= $n ?>]" accept="image/jpeg,image/png,image/webp,image/gif">
                    <input type="hidden" name="item[<?= $n ?>][imagem]" value="<?= h($it['imagem'] ?? '') ?>">
                    <?php if ($temImagem): ?>
                      <label class="check">
                        <input type="checkbox" name="item[<?= $n ?>][remover_imagem]" value="1">
                        Remover a imagem atual
                      </label>
                    <?php endif; ?>
                    <p class="dica">JPG, PNG ou WEBP até 8 MB. Ela é reduzida e cortada em 16:9 no cartão; sem imagem, entra o fundo hachurado com a sigla do dia.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <?php endforeach; ?>
        </div>
        <button class="btn" type="button" id="add">+ Adicionar item</button>
      </fieldset>

      <div class="barra acoes">
        <button class="btn btn-ouro" type="submit">Publicar agenda</button>
        <a class="btn" href="/programacao" target="_blank" rel="noopener">Ver a página</a>
      </div>
    </form>

    <datalist id="dias">
      <?php foreach (DIAS as $d): ?><option value="<?= h($d) ?>"></option><?php endforeach; ?>
    </datalist>
  </div>

  <script>
  (function () {
    const caixa = document.getElementById('itens');

    // Renumera item[N][campo] e imagem[N] — o índice precisa casar com o $_FILES lá no PHP
    function renumerar() {
      caixa.querySelectorAll('.item').forEach((item, i) => {
        item.querySelector('.item-num').textContent = 'Item ' + (i + 1);
        item.querySelectorAll('[name]').forEach((campo) => {
          campo.name = campo.name.replace(/^(item|imagem)\[\d+\]/, (_, base) => base + '[' + i + ']');
        });
      });
    }

    // Mostra na hora a foto escolhida, antes mesmo de publicar
    caixa.addEventListener('change', (e) => {
      const campo = e.target;
      if (campo.type !== 'file' || !campo.files || !campo.files[0]) return;
      const mini = campo.closest('.imagem').querySelector('.miniatura');
      const url = URL.createObjectURL(campo.files[0]);
      mini.classList.remove('vazia');
      mini.innerHTML = '';
      const img = document.createElement('img');
      img.alt = '';
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
      mini.appendChild(img);
    });

    caixa.addEventListener('click', (e) => {
      const alvo = e.target.closest('button');
      if (!alvo) return;
      const item = alvo.closest('.item');

      if (alvo.hasAttribute('data-remover')) {
        if (caixa.querySelectorAll('.item').length === 1) { item.querySelectorAll('input[type=text]').forEach(c => c.value = ''); return; }
        if (confirm('Remover este item?')) { item.remove(); renumerar(); }
        return;
      }
      const passo = alvo.getAttribute('data-mover');
      if (passo === '-1' && item.previousElementSibling) {
        item.parentNode.insertBefore(item, item.previousElementSibling);
        renumerar();
      } else if (passo === '1' && item.nextElementSibling) {
        item.parentNode.insertBefore(item.nextElementSibling, item);
        renumerar();
      }
    });

    document.getElementById('add').addEventListener('click', () => {
      const modelo = caixa.querySelector('.item');
      const novo = modelo.cloneNode(true);
      novo.querySelectorAll('input[type=text], input[type=hidden], input[type=file]').forEach((c) => (c.value = ''));
      novo.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = false));
      novo.querySelectorAll('select').forEach((s) => (s.selectedIndex = 0));
      // o item novo começa sem imagem, mesmo que o modelo tivesse uma
      const mini = novo.querySelector('.miniatura');
      if (mini) {
        mini.classList.add('vazia');
        mini.innerHTML = '<span>sem<br>imagem</span>';
      }
      novo.querySelectorAll('.check').forEach((rot) => {
        if (rot.querySelector('[name*="remover_imagem"]')) rot.remove();
      });
      caixa.appendChild(novo);
      renumerar();
      novo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      novo.querySelector('input[type=text]').focus();
    });
  })();
  </script>
<?php endif; ?>

</body>
</html>
