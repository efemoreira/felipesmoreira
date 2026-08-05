<?php
declare(strict_types=1);

/**
 * Agenda da Semana — felipesmoreira.com/painel/agenda.php
 *
 * Roda na hospedagem (PHP da Hostinger) e grava a agenda em
 * public_html/dados/agenda.json. Essa pasta NÃO está no repositório, então um
 * novo deploy pelo hPanel não apaga o que foi editado aqui.
 *
 * Quem entra e quem pode abrir esta página é assunto do sessao.php — daqui para
 * baixo só se cuida da agenda em si.
 */

require_once __DIR__ . '/layout.php';
exigir_area('agenda');

const ARQ_AGENDA  = PASTA_DADOS . '/agenda.json';
const ARQ_SEMENTE = __DIR__ . '/../dados-semente.json'; // cópia do build, só p/ preencher na 1ª vez

const MAX_BACKUPS = 12;
const MAX_UPLOAD  = 8388608; // 8 MB — foto de celular passa folgado
const LARGURA_MAX = 1000;    // a miniatura aparece com ~240px; 1000 cobre telas retina

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

/* As mesmas cores de src/app/programacao/tipos.ts — a prévia tem de mostrar o
   cartão como ele vai sair na página, não uma aproximação. */
const TEMAS = [
    'ouro'   => ['bg' => '#FFCB05', 'fg' => '#181203', 'sub' => 'rgba(24,18,3,.72)',   'claro' => false],
    'milho'  => ['bg' => '#F7E463', 'fg' => '#181203', 'sub' => 'rgba(24,18,3,.72)',   'claro' => false],
    'azul'   => ['bg' => 'linear-gradient(105deg,#1B4FD8 0%,#2E7BE8 100%)', 'fg' => '#F6F5EF', 'sub' => 'rgba(246,245,239,.82)', 'claro' => true],
    'escuro' => ['bg' => '#1C1710', 'fg' => '#F6F5EF', 'sub' => 'rgba(246,245,239,.72)', 'claro' => true],
    'papel'  => ['bg' => '#F3ECDA', 'fg' => '#181203', 'sub' => 'rgba(24,18,3,.7)',    'claro' => false],
];
const CANAIS_PADRAO = [
    ['nome' => 'YouTube',   'icone' => 'youtube',   'url' => 'https://youtube.com/@moreiramissao'],
    ['nome' => 'Instagram', 'icone' => 'instagram', 'url' => 'https://instagram.com/moreiramissao'],
    ['nome' => 'Twitch',    'icone' => 'twitch',    'url' => 'https://twitch.tv/moreiramissao'],
    ['nome' => 'Kick',      'icone' => 'kick',      'url' => 'https://kick.com/moreiramissao'],
    ['nome' => 'TikTok',    'icone' => 'tiktok',    'url' => 'https://tiktok.com/@moreiramissao'],
];

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
        'atualizadoPor' => (usuario_atual()['nome'] ?? ''),
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

$aviso = null;
$sucesso = null;
$acao = (string) ($_POST['acao'] ?? '');
/* o que foi digitado, para devolver ao formulário quando a gravação falha */
$rascunho = null;

if ($acao === 'salvar') {
    if (!token_valido()) {
        $aviso = 'Sessão expirada. Entre de novo — o que você digitou não foi salvo.';
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }
    $recados = [];
    $nova = montar_agenda_do_post($_POST, $recados);
    if (publicar($nova)) {
        $sucesso = count($nova['programacao']) . ' item(ns) publicado(s). A página já está mostrando a nova agenda.';
        if ($recados) {
            $aviso = implode(' ', $recados) . ' O resto foi salvo normalmente.';
        }
    } else {
        $aviso = 'Não consegui gravar dados/agenda.json. Confira as permissões da pasta no hPanel. '
               . 'O que você digitou continua aqui na tela — tente publicar de novo.';
        // sem isto a tela recarregava do disco e o trabalho todo sumia junto com o erro
        $rascunho = $nova;
    }
} elseif ($acao === '' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && !$_POST) {
    // POST vazio com corpo grande = passou do post_max_size do PHP (upload pesado demais)
    $aviso = 'O envio passou do limite do servidor. Reduza a imagem (ou envie uma de cada vez) e tente de novo.';
}

$agenda = $rascunho ?? agenda_atual();
$canaisAtivos = array_column($agenda['disponivelEm'] ?? CANAIS_PADRAO, 'icone');

abrir_pagina('Agenda da semana');
?>
<div class="capa">
  <h1>Programação da semana</h1>
  <p class="sub">
    Edite, salve e a página <a href="/programacao" target="_blank" rel="noopener">/programacao</a> muda na hora.
  </p>

  <?php recado($aviso, $sucesso); ?>

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
      <p class="dica" style="margin:0 0 12px">
        Arraste pelo ⠿ para reordenar, ou use ↑ ↓. Clique no cabeçalho para recolher um item.
      </p>
      <div id="itens">
        <?php
        $itens = $agenda['programacao'] ?? [];
        if (!$itens) {
            $itens = [[]];
        }
        /* itens já preenchidos nascem recolhidos: com 7 na semana, tudo aberto
           vira uma parede de campos em que ninguém acha o que veio editar */
        $recolher = count($itens) > 2;
        foreach (array_values($itens) as $n => $it):
            $cor = $it['cor'] ?? 'ouro';
            $plat = $it['plataforma'] ?? '';
            $temTitulo = !empty($it['titulo']);
        ?>
        <details class="item" <?= ($recolher && $temTitulo) ? '' : 'open' ?>>
          <summary class="item-topo">
            <span class="pega" title="Arraste para reordenar" aria-hidden="true">⠿</span>
            <span class="item-num">Item <?= $n + 1 ?></span>
            <span class="item-resumo"></span>
            <span class="acoes">
              <button class="btn btn-mini" type="button" data-mover="-1" title="Subir" aria-label="Subir item">↑</button>
              <button class="btn btn-mini" type="button" data-mover="1" title="Descer" aria-label="Descer item">↓</button>
              <button class="btn btn-mini" type="button" data-duplicar title="Duplicar">⧉</button>
              <button class="btn btn-mini btn-risco" type="button" data-remover>Remover</button>
            </span>
          </summary>

          <div class="item-corpo">
            <!-- desenhada pelo JS a cada tecla; some se o navegador não rodar script -->
            <div class="previa" hidden>
              <span class="previa-rotulo">Como vai aparecer na página</span>
              <div class="cartao">
                <div class="cartao-thumb"><span class="sigla"></span></div>
                <div class="cartao-texto">
                  <strong class="cartao-titulo"></strong>
                  <span class="cartao-sub"></span>
                </div>
                <div class="cartao-meta">
                  <span class="cartao-data"></span>
                  <span class="cartao-dia"></span>
                </div>
              </div>
            </div>

            <input type="hidden" name="item[<?= $n ?>][id]" value="<?= h($it['id'] ?? '') ?>">
            <div class="campo">
              <label for="it<?= $n ?>-titulo">Título</label>
              <input id="it<?= $n ?>-titulo" data-papel="titulo" type="text" name="item[<?= $n ?>][titulo]" value="<?= h($it['titulo'] ?? '') ?>" maxlength="120">
            </div>
            <div class="campo">
              <label for="it<?= $n ?>-subtitulo">Subtítulo</label>
              <input id="it<?= $n ?>-subtitulo" type="text" name="item[<?= $n ?>][subtitulo]" value="<?= h($it['subtitulo'] ?? '') ?>" maxlength="160">
            </div>
            <div class="linha g4">
              <div class="campo">
                <label for="it<?= $n ?>-dia">Dia</label>
                <input id="it<?= $n ?>-dia" data-papel="dia" type="text" name="item[<?= $n ?>][dia]" value="<?= h($it['dia'] ?? '') ?>" list="dias" maxlength="20">
              </div>
              <div class="campo">
                <label for="it<?= $n ?>-data">Data</label>
                <input id="it<?= $n ?>-data" type="text" name="item[<?= $n ?>][data]" value="<?= h($it['data'] ?? '') ?>" maxlength="20" placeholder="29/07">
              </div>
              <div class="campo">
                <label for="it<?= $n ?>-hora">Hora</label>
                <input id="it<?= $n ?>-hora" data-papel="hora" type="text" name="item[<?= $n ?>][hora]" value="<?= h($it['hora'] ?? '') ?>" maxlength="20" placeholder="19H">
              </div>
              <div class="campo">
                <label for="it<?= $n ?>-cor">Cor</label>
                <select id="it<?= $n ?>-cor" data-papel="cor" name="item[<?= $n ?>][cor]">
                  <?php foreach (CORES as $v => $rotulo): ?>
                    <option value="<?= h($v) ?>" <?= $cor === $v ? 'selected' : '' ?>><?= h($rotulo) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>
            <div class="linha g2">
              <div class="campo">
                <label for="it<?= $n ?>-plataforma">Plataforma (selo)</label>
                <select id="it<?= $n ?>-plataforma" data-papel="plataforma" name="item[<?= $n ?>][plataforma]">
                  <?php foreach (PLATAFORMAS as $v => $rotulo): ?>
                    <option value="<?= h($v) ?>" <?= $plat === $v ? 'selected' : '' ?>><?= h($rotulo) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="campo">
                <label for="it<?= $n ?>-link">Link</label>
                <input id="it<?= $n ?>-link" type="text" name="item[<?= $n ?>][link]" value="<?= h($it['link'] ?? '') ?>" maxlength="300" placeholder="https://youtube.com/@moreiramissao">
              </div>
            </div>
            <div class="campo">
              <label class="check">
                <input type="checkbox" data-papel="aoVivo" name="item[<?= $n ?>][aoVivo]" value="1" <?= !empty($it['aoVivo']) ? 'checked' : '' ?>>
                Ao vivo
              </label>
            </div>
            <div class="campo">
              <label for="it<?= $n ?>-arquivo">Imagem (opcional)</label>
              <div class="imagem">
                <?php $temImagem = !empty($it['imagem']); ?>
                <label for="it<?= $n ?>-arquivo" class="miniatura<?= $temImagem ? '' : ' vazia' ?>" title="Solte uma imagem aqui, cole com Ctrl+V ou clique para escolher">
                  <?php if ($temImagem): ?>
                    <img src="<?= h($it['imagem']) ?>" alt="">
                  <?php else: ?>
                    <span>solte<br>a imagem</span>
                  <?php endif; ?>
                </label>
                <div class="imagem-acoes">
                  <input id="it<?= $n ?>-arquivo" type="file" name="imagem[<?= $n ?>]" accept="image/jpeg,image/png,image/webp,image/gif">
                  <input type="hidden" name="item[<?= $n ?>][imagem]" value="<?= h($it['imagem'] ?? '') ?>">
                  <?php if ($temImagem): ?>
                    <label class="check">
                      <input type="checkbox" name="item[<?= $n ?>][remover_imagem]" value="1">
                      Remover a imagem atual
                    </label>
                  <?php endif; ?>
                  <p class="dica">JPG, PNG ou WEBP até 8 MB. Arraste para a miniatura, ou clique nela e escolha. Ela é reduzida e cortada em 16:9 no cartão; sem imagem, entra o fundo hachurado com a sigla do dia.</p>
                </div>
              </div>
            </div>
          </div>
        </details>
        <?php endforeach; ?>
      </div>
      <button class="btn" type="button" id="add">+ Adicionar item</button>
    </fieldset>

    <div class="barra acoes">
      <button class="btn btn-ouro" type="submit">Publicar agenda</button>
      <a class="btn" href="/programacao" target="_blank" rel="noopener">Ver a página</a>
      <?php if (pode('estudio')): ?>
        <a class="btn" href="/painel/estudio.php">Estúdio de artes</a>
      <?php endif; ?>
    </div>
  </form>

  <datalist id="dias">
    <?php foreach (DIAS as $d): ?><option value="<?= h($d) ?>"></option><?php endforeach; ?>
  </datalist>
</div>

<script>
(function () {
  const caixa = document.getElementById('itens');
  const form = document.getElementById('form');
  const MAX_UPLOAD = <?= MAX_UPLOAD ?>;
  const ROTULO_PLATAFORMA = <?= json_encode(PLATAFORMAS, JSON_UNESCAPED_UNICODE) ?>;
  const TEMAS = <?= json_encode(TEMAS, JSON_UNESCAPED_UNICODE) ?>;

  let sujo = false;
  const marcarSujo = () => { sujo = true; };

  /* ---------- prévia do cartão ---------- */

  const valorDe = (item, papel) => {
    const campo = item.querySelector('[data-papel="' + papel + '"]');
    return campo ? campo.value.trim() : '';
  };

  /**
   * Desenha o cartão como ele vai sair em /programacao.
   *
   * Escolher "azul" ou "papel" num <select> não diz nada até se ver o resultado;
   * e é aqui que se percebe um título longo demais ou um dia sem sigla.
   */
  function prever(item) {
    const previa = item.querySelector('.previa');
    if (!previa) return;
    previa.hidden = false;

    const tema = TEMAS[valorDe(item, 'cor')] || TEMAS.ouro;
    const cartao = previa.querySelector('.cartao');
    cartao.style.background = tema.bg;
    cartao.style.color = tema.fg;
    cartao.classList.toggle('claro', !!tema.claro);

    const dia = valorDe(item, 'dia');
    const hora = valorDe(item, 'hora');
    const data = item.querySelector('[name*="[data]"]')?.value.trim() || '';
    const subtitulo = item.querySelector('[name*="[subtitulo]"]')?.value.trim() || '';

    previa.querySelector('.cartao-titulo').textContent = valorDe(item, 'titulo') || 'Sem título';
    const sub = previa.querySelector('.cartao-sub');
    sub.textContent = subtitulo;
    sub.style.color = tema.sub;
    previa.querySelector('.cartao-data').textContent = [data, hora].filter(Boolean).join(' · ');
    previa.querySelector('.cartao-dia').textContent = dia;

    // a miniatura: a imagem escolhida, ou o fundo hachurado com a sigla do dia
    const thumb = previa.querySelector('.cartao-thumb');
    const escolhida = item.querySelector('.miniatura img');
    const atual = thumb.querySelector('img');
    if (escolhida && atual?.src !== escolhida.src) {
      thumb.querySelector('img')?.remove();
      const img = document.createElement('img');
      img.alt = '';
      img.src = escolhida.src;
      thumb.appendChild(img);
    } else if (!escolhida) {
      atual?.remove();
    }
    thumb.classList.toggle('vazia', !escolhida);
    thumb.querySelector('.sigla').textContent = escolhida ? '' : dia.slice(0, 3).toUpperCase();

    // a etiqueta "Ao vivo" só existe na página, não no PNG
    let etiqueta = thumb.querySelector('.cartao-etiqueta');
    if (item.querySelector('[data-papel="aoVivo"]')?.checked) {
      if (!etiqueta) {
        etiqueta = document.createElement('span');
        etiqueta.className = 'cartao-etiqueta';
        etiqueta.textContent = 'Ao vivo';
        thumb.appendChild(etiqueta);
      }
    } else {
      etiqueta?.remove();
    }
  }

  /* ---------- resumo do cabeçalho ---------- */

  // Com os itens recolhidos, é este resumo que diz o que tem dentro.
  function resumir(item) {
    prever(item);
    const val = (papel) => valorDe(item, papel);
    const titulo = val('titulo');
    const partes = [val('dia'), val('hora')].filter(Boolean);
    const plataforma = val('plataforma');
    if (plataforma && ROTULO_PLATAFORMA[plataforma]) partes.push(ROTULO_PLATAFORMA[plataforma]);
    if (item.querySelector('[data-papel="aoVivo"]')?.checked) partes.push('ao vivo');

    const alvo = item.querySelector('.item-resumo');
    if (!alvo) return;
    alvo.innerHTML = '';

    const bolinha = document.createElement('i');
    bolinha.className = 'ponto ponto-' + (val('cor') || 'ouro');
    alvo.appendChild(bolinha);

    const forte = document.createElement('strong');
    forte.textContent = titulo || 'sem título';
    if (!titulo) forte.classList.add('vazio');
    alvo.appendChild(forte);

    if (partes.length) {
      const resto = document.createElement('span');
      resto.textContent = partes.join(' · ');
      alvo.appendChild(resto);
    }
  }

  const resumirTodos = () => caixa.querySelectorAll('.item').forEach(resumir);

  /* ---------- índices ---------- */

  // Renumera item[N][campo] e imagem[N] — o índice precisa casar com o $_FILES lá no PHP.
  // Os id/for também: sem isso, clicar no rótulo de um item foca o campo de outro.
  function renumerar() {
    caixa.querySelectorAll('.item').forEach((item, i) => {
      item.querySelector('.item-num').textContent = 'Item ' + (i + 1);
      item.querySelectorAll('[name]').forEach((campo) => {
        campo.name = campo.name.replace(/^(item|imagem)\[\d+\]/, (_, base) => base + '[' + i + ']');
      });
      item.querySelectorAll('[id^="it"]').forEach((campo) => {
        campo.id = campo.id.replace(/^it\d+-/, 'it' + i + '-');
      });
      item.querySelectorAll('label[for^="it"]').forEach((rot) => {
        rot.htmlFor = rot.htmlFor.replace(/^it\d+-/, 'it' + i + '-');
      });
    });
    resumirTodos();
  }

  /* ---------- imagem: escolher, soltar, colar ---------- */

  function mostrar(mini, arquivo) {
    const url = URL.createObjectURL(arquivo);
    mini.classList.remove('vazia');
    mini.innerHTML = '';
    const img = document.createElement('img');
    img.alt = '';
    img.src = url;
    img.onload = () => URL.revokeObjectURL(url);
    mini.appendChild(img);
  }

  /** Põe o arquivo no input daquele item — é ele que o PHP vai receber. */
  function usarArquivo(item, arquivo) {
    if (!arquivo || !arquivo.type.startsWith('image/')) return;
    if (arquivo.size > MAX_UPLOAD) {
      alert('“' + arquivo.name + '” passa de 8 MB. Reduza a imagem antes de enviar.');
      return;
    }
    const entrada = item.querySelector('input[type=file]');
    const lista = new DataTransfer();
    lista.items.add(arquivo);
    entrada.files = lista.files;
    // se estava marcado para remover, escolher uma nova desfaz isso
    const remover = item.querySelector('[name*="remover_imagem"]');
    if (remover) remover.checked = false;
    mostrar(item.querySelector('.miniatura'), arquivo);
    marcarSujo();
  }

  caixa.addEventListener('change', (e) => {
    marcarSujo();
    const campo = e.target;
    if (campo.type === 'file' && campo.files && campo.files[0]) {
      usarArquivo(campo.closest('.item'), campo.files[0]);
    }
    resumir(campo.closest('.item'));
  });
  caixa.addEventListener('input', (e) => {
    marcarSujo();
    resumir(e.target.closest('.item'));
  });

  caixa.addEventListener('dragover', (e) => {
    const mini = e.target.closest('.miniatura');
    if (!mini || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    mini.classList.add('sobre');
  });
  caixa.addEventListener('dragleave', (e) => {
    e.target.closest('.miniatura')?.classList.remove('sobre');
  });
  caixa.addEventListener('drop', (e) => {
    const mini = e.target.closest('.miniatura');
    if (!mini || !e.dataTransfer.files.length) return;
    e.preventDefault();
    mini.classList.remove('sobre');
    usarArquivo(mini.closest('.item'), e.dataTransfer.files[0]);
  });

  // colar uma captura direto no item em que se está mexendo
  document.addEventListener('paste', (e) => {
    const item = document.activeElement?.closest?.('.item');
    if (!item) return;
    const arquivo = Array.from(e.clipboardData?.files || [])[0];
    if (!arquivo) return;
    e.preventDefault();
    usarArquivo(item, arquivo);
  });

  /* ---------- botões do cabeçalho ---------- */

  function limpar(item) {
    item.querySelectorAll('input[type=text], input[type=hidden], input[type=file]').forEach((c) => (c.value = ''));
    item.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = false));
    item.querySelectorAll('select').forEach((s) => (s.selectedIndex = 0));
    const mini = item.querySelector('.miniatura');
    if (mini) {
      mini.classList.add('vazia');
      mini.innerHTML = '<span>solte<br>a imagem</span>';
    }
    item.querySelectorAll('.check').forEach((rot) => {
      if (rot.querySelector('[name*="remover_imagem"]')) rot.remove();
    });
  }

  caixa.addEventListener('click', (e) => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    // o cabeçalho é um <summary>: sem isto, cada botão abriria e fecharia o item
    e.preventDefault();
    const item = alvo.closest('.item');
    marcarSujo();

    if (alvo.hasAttribute('data-remover')) {
      if (caixa.querySelectorAll('.item').length === 1) { limpar(item); resumir(item); return; }
      if (confirm('Remover este item?')) { item.remove(); renumerar(); }
      return;
    }
    if (alvo.hasAttribute('data-duplicar')) {
      const copia = item.cloneNode(true);
      copia.open = true;
      // o id sai junto na cópia e dois itens com o mesmo id viram um só no PHP
      copia.querySelectorAll('[name*="[id]"]').forEach((c) => (c.value = ''));
      item.after(copia);
      renumerar();
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

  /* ---------- reordenar arrastando ---------- */

  let arrastado = null;

  caixa.addEventListener('mousedown', (e) => {
    // só a pega inicia o arrasto: o resto do cabeçalho continua abrindo o item
    const item = e.target.closest('.pega') ? e.target.closest('.item') : null;
    if (item) item.draggable = true;
  });
  caixa.addEventListener('mouseup', () => {
    caixa.querySelectorAll('.item').forEach((i) => (i.draggable = false));
  });

  caixa.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.item');
    if (!item || !item.draggable) return;
    arrastado = item;
    item.classList.add('arrastando');
    e.dataTransfer.effectAllowed = 'move';
    // o Firefox exige algum dado para o arrasto acontecer
    e.dataTransfer.setData('text/plain', '');
  });

  caixa.addEventListener('dragover', (e) => {
    if (!arrastado) return;
    const sobre = e.target.closest('.item');
    if (!sobre || sobre === arrastado) return;
    e.preventDefault();
    const caixaSobre = sobre.getBoundingClientRect();
    const acima = e.clientY < caixaSobre.top + caixaSobre.height / 2;
    sobre.parentNode.insertBefore(arrastado, acima ? sobre : sobre.nextSibling);
  });

  caixa.addEventListener('dragend', () => {
    if (!arrastado) return;
    arrastado.classList.remove('arrastando');
    arrastado.draggable = false;
    arrastado = null;
    renumerar();
    marcarSujo();
  });

  /* ---------- adicionar ---------- */

  document.getElementById('add').addEventListener('click', () => {
    const modelo = caixa.querySelector('.item');
    const novo = modelo.cloneNode(true);
    novo.open = true;
    limpar(novo);
    caixa.appendChild(novo);
    renumerar();
    novo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    novo.querySelector('input[type=text]').focus();
    marcarSujo();
  });

  /* ---------- não perder o trabalho ---------- */

  form.addEventListener('submit', (e) => {
    // o servidor recusa o POST inteiro se a soma passar do limite dele, e aí
    // some tudo de uma vez; melhor barrar aqui, com o formulário ainda na tela
    let total = 0;
    caixa.querySelectorAll('input[type=file]').forEach((c) => {
      if (c.files && c.files[0]) total += c.files[0].size;
    });
    if (total > MAX_UPLOAD) {
      e.preventDefault();
      alert(
        'As imagens somam ' + (total / 1048576).toFixed(1) + ' MB, acima do limite de 8 MB por envio.\n\n' +
        'Publique agora sem parte delas e envie as que faltam num segundo envio.'
      );
      return;
    }
    sujo = false; // saiu para publicar: o aviso de saída não vale mais
  });

  window.addEventListener('beforeunload', (e) => {
    if (!sujo) return;
    e.preventDefault();
    e.returnValue = '';
  });

  resumirTodos();
})();
</script>
<?php
fechar_pagina();
