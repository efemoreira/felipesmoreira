<?php
declare(strict_types=1);

/**
 * O que a agenda e os encontros compartilham.
 *
 * Isto morava dentro do `agenda.php`, que faz `exigir_area('agenda')` na
 * primeira linha — então nada mais no painel conseguia usar. Quando o encontro
 * passou a ser a fonte da programação (um cadastro só, e não dois), o
 * `eventos-comum.php` precisou do mesmo relógio, das mesmas cores e do mesmo
 * caminho de imagem. Segue a convenção dos outros `*-comum.php`: só define, e
 * quem inclui é que decide se exige login.
 *
 * O que está aqui:
 *   - o fuso e a conversão de horário (a parte que mais dá errado em silêncio);
 *   - as cores e plataformas do cartão, espelhadas do TypeScript do site;
 *   - o caminho da imagem enviada pelo painel;
 *   - a gravação do `agenda.json`, que é o único arquivo de /dados aberto à web.
 */

require_once __DIR__ . '/sessao.php';

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

/* limpar_texto() agora mora no sessao.php: o formulário público de inscrição
   precisa dela e não pode incluir este arquivo (que exige área 'agenda'). */

/** Só http(s), caminho interno ou mailto/tel — nada de javascript: no href. */
/**
 * O fuso do Ceará. Fixo de propósito: o estado não tem horário de verão, e
 * gravar o deslocamento junto da data é o que faz o "está ao vivo agora?" dar
 * a mesma resposta no celular de Fortaleza e no de quem abriu de outro estado.
 */
const FUSO_CEARA = '-03:00';

/**
 * O <input type="datetime-local"> devolve "2026-10-04T19:00" (sem fuso).
 * Guardamos com o deslocamento para a data virar um instante sem ambiguidade.
 *
 * Devolve '' quando não reconhece — item sem horário continua válido, só não
 * entra na ordenação nem pode ser marcado como ao vivo.
 */
function inicio_iso($bruto): string
{
    $v = limpar_texto($bruto, 25);
    if ($v === '') {
        return '';
    }
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/', $v, $m) !== 1) {
        return '';
    }
    if (!checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
        return '';
    }
    if ((int) $m[4] > 23 || (int) $m[5] > 59) {
        return '';
    }
    return "{$m[1]}-{$m[2]}-{$m[3]}T{$m[4]}:{$m[5]}:00" . FUSO_CEARA;
}

/** ISO -> o que o <input type="datetime-local"> sabe reler. */
function inicio_para_campo(string $iso): string
{
    return $iso === '' ? '' : substr($iso, 0, 16);
}

/**
 * Dia, data e hora para mostrar — **derivados** do início, nunca digitados.
 *
 * Eram três campos de texto livre, e era por isso que a página não conseguia
 * ordenar nem saber o que já tinha passado: "29/07" não diz o ano e "19H" não
 * é hora. Continuam no arquivo porque o cartão e o pôster leem eles, mas agora
 * saem todos da mesma data — não há como divergirem.
 */
function partes_de_exibicao(string $iso): array
{
    if ($iso === '') {
        return ['dia' => '', 'data' => '', 'hora' => ''];
    }
    /* Formatar no fuso do Ceará, e não no do servidor. A Hostinger roda em UTC:
       com `date()` puro, um evento marcado para 19h aparecia como 22H no site.
       O erro é silencioso — a hora está lá, só está errada. */
    try {
        $d = (new DateTimeImmutable($iso))->setTimezone(new DateTimeZone('America/Fortaleza'));
    } catch (Exception $e) {
        return ['dia' => '', 'data' => '', 'hora' => ''];
    }

    // format('w') devolve 0 para domingo; DIAS começa na segunda
    $w = (int) $d->format('w');
    $minuto = (int) $d->format('i');

    return [
        'dia'  => DIAS[($w + 6) % 7],
        'data' => $d->format('d/m'),
        'hora' => $minuto === 0 ? $d->format('G') . 'H' : $d->format('G:i'),
    ];
}

/**
 * Quanto tempo um evento "acontece" depois de começar.
 *
 * A coordenação marca quando começa e ninguém volta ao painel para dizer que
 * acabou — então o fim é presumido. **Tem de bater com o DURACAO_PADRAO_MIN de
 * `src/features/programacao/tempo.ts`**: se divergirem, o painel diz que o
 * encontro acabou enquanto o site ainda mostra "AO VIVO", ou o contrário.
 */
const DURACAO_PADRAO_MIN = 120;

/**
 * Onde o evento está no tempo: 'passado' | 'agora' | 'futuro' | 'sem-horario'.
 *
 * Espelha o `estadoDe()` do TypeScript. As duas cópias existem porque uma roda
 * no navegador de quem visita e a outra no PHP que monta o painel — e o painel
 * não pode esperar o JavaScript para saber o que já passou.
 */
function estado_do_evento(string $inicio, ?int $agora = null): string
{
    if ($inicio === '') {
        return 'sem-horario';
    }
    $t = strtotime($inicio);
    if ($t === false) {
        return 'sem-horario';
    }
    $agora ??= time();
    if ($agora < $t) {
        return 'futuro';
    }
    return $agora < $t + DURACAO_PADRAO_MIN * 60 ? 'agora' : 'passado';
}

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
 * Um `<input type="file" name="X">` solto — sem o `[N]` do formulário da agenda.
 *
 * `arquivo_enviado()` existe para `name="imagem[N]"`, onde o PHP entrega
 * `$_FILES['imagem']['name'][N]` e é preciso remontar a ficha. Quando o campo é
 * um só, a ficha já vem pronta e remontar seria só chance de errar.
 */
function arquivo_simples(string $campo): ?array
{
    $f = $_FILES[$campo] ?? null;
    if (!is_array($f) || !isset($f['error']) || is_array($f['error'])) {
        return null;
    }
    return [
        'tmp_name' => (string) ($f['tmp_name'] ?? ''),
        'error'    => (int) $f['error'],
        'size'     => (int) ($f['size'] ?? 0),
    ];
}

/**
 * Dia e hora, dois campos, viram o instante único que fica gravado.
 *
 * A pessoa que marca o encontro pensa "sábado, 9 da manhã" — dois campos, e o
 * `<input type="date">` do celular abre um calendário de verdade, que o
 * `datetime-local` não abre em todo aparelho.
 *
 * O que NÃO muda é o que fica no arquivo: um `inicio` só, com o fuso do Ceará
 * junto. É dele que saem a ordenação, o "já passou" e o "ao vivo" — três coisas
 * que não existiam quando data e hora eram texto solto, e que voltariam a não
 * existir se os dois campos fossem gravados separados.
 */
function inicio_de_dia_e_hora($dia, $hora): string
{
    $d = limpar_texto($dia, 10);
    if ($d === '') {
        return '';
    }
    $h = limpar_texto($hora, 5);
    if ($h === '' || preg_match('/^\d{2}:\d{2}$/', $h) !== 1) {
        $h = '00:00';  // encontro sem hora marcada ainda ordena pelo dia
    }
    return inicio_iso($d . 'T' . $h);
}

/** O ISO de volta para os dois campos do formulário. */
function dia_do_inicio(string $iso): string
{
    return $iso === '' ? '' : substr($iso, 0, 10);
}

function hora_do_inicio(string $iso): string
{
    return $iso === '' ? '' : substr($iso, 11, 5);
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

/**
 * Título -> slug, para o id do item.
 *
 * `sem_acento()` e NÃO `iconv('ASCII//TRANSLIT')`: o TRANSLIT depende da libc,
 * e o mesmo texto vira "ha" no Linux da Hostinger e "h" no macOS — id que muda
 * conforme a máquina que gravou é âncora quebrada em link já compartilhado.
 */
function slug(string $s, int $i): string
{
    $t = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', sem_acento($s)) ?? '');
    $t = trim($t, '-');
    return $t !== '' ? $t : 'item-' . $i;
}

/* ===================== publicação ===================== */

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
    /* A varredura NÃO roda aqui.
       O agenda.json só tem o que é público — e o encontro fechado, que não
       aparece nele, também tem imagem. Varrer com base só no que foi publicado
       apagaria a imagem de todo encontro `naAgenda = false` sete dias depois de
       ele ser cadastrado. Quem varre é quem conhece TODAS as imagens; ver
       `varrer_imagens_orfas()` e a chamada em eventos-comum.php. */
    return true;
}

/**
 * Apaga imagens que ninguém usa mais — sobra de encontro removido, por exemplo.
 * Só mexe em arquivo com mais de 7 dias, para não atropelar um upload recente
 * nem uma imagem que ainda apareça em algum backup próximo.
 *
 * Recebe a lista de caminhos EM USO, e não a agenda: quem chama é que sabe onde
 * mora a imagem. Passar só o que foi publicado apagaria a imagem de todo
 * encontro fechado — eles não aparecem no agenda.json e existem do mesmo jeito.
 */
function varrer_imagens_orfas(array $caminhos): void
{
    if (!is_dir(PASTA_IMAGENS)) {
        return;
    }
    $usadas = [];
    foreach ($caminhos as $caminho) {
        if ((string) $caminho !== '') {
            $usadas[basename((string) $caminho)] = true;
        }
    }
    $limite = time() - 7 * 86400;
    foreach ((glob(PASTA_IMAGENS . '/*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: []) as $arquivo) {
        if (!isset($usadas[basename($arquivo)]) && @filemtime($arquivo) < $limite) {
            @unlink($arquivo);
        }
    }
}
