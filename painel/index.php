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
const ARQ_SEMENTE   = __DIR__ . '/../dados-semente.json'; // cópia do build, só p/ preencher na 1ª vez

const MAX_TENTATIVAS = 5;
const BLOQUEIO_SEG   = 900;   // 15 min
const SESSAO_SEG     = 7200;  // 2 h
const MAX_BACKUPS    = 12;

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

function slug(string $s, int $i): string
{
    $t = iconv('UTF-8', 'ASCII//TRANSLIT', $s) ?: $s;
    $t = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $t) ?? '');
    $t = trim($t, '-');
    return $t !== '' ? $t : 'item-' . $i;
}

function montar_agenda_do_post(array $post): array
{
    $itens = [];
    $linhas = is_array($post['item'] ?? null) ? $post['item'] : [];

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
            'imagem'     => limpar_texto($linha['imagem'] ?? '', 300),
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
    return $json !== false && gravar_atomico(ARQ_AGENDA, $json);
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
        $nova = montar_agenda_do_post($_POST);
        if (publicar($nova)) {
            $sucesso = count($nova['programacao']) . ' item(ns) publicado(s). A página já está mostrando a nova agenda.';
        } else {
            $aviso = 'Não consegui gravar dados/agenda.json. Confira as permissões da pasta no hPanel.';
        }
    }
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

    <form method="post" id="form">
      <input type="hidden" name="acao" value="salvar">
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
            <div class="linha g2">
              <div class="campo">
                <label>Imagem (opcional)</label>
                <input type="text" name="item[<?= $n ?>][imagem]" value="<?= h($it['imagem'] ?? '') ?>" maxlength="300" placeholder="/image/agenda/foto.jpg">
                <p class="dica">Sem imagem, entra o fundo hachurado com a sigla do dia.</p>
              </div>
              <div class="campo" style="align-self:end">
                <label class="check">
                  <input type="checkbox" name="item[<?= $n ?>][aoVivo]" value="1" <?= !empty($it['aoVivo']) ? 'checked' : '' ?>>
                  Ao vivo
                </label>
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

    // Renumera name="item[N][campo]" e o rótulo depois de qualquer mexida
    function renumerar() {
      caixa.querySelectorAll('.item').forEach((item, i) => {
        item.querySelector('.item-num').textContent = 'Item ' + (i + 1);
        item.querySelectorAll('[name^="item["]').forEach((campo) => {
          campo.name = campo.name.replace(/^item\[\d+\]/, 'item[' + i + ']');
        });
      });
    }

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
      novo.querySelectorAll('input[type=text], input[type=hidden]').forEach((c) => (c.value = ''));
      novo.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = false));
      novo.querySelectorAll('select').forEach((s) => (s.selectedIndex = 0));
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
