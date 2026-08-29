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
/**
 * O VÉU ENTRE A IMAGEM DO ENCONTRO E O TEXTO QUE VAI POR CIMA.
 *
 * A imagem do encontro é fundo na tela de confirmação e de check-in
 * (`/presenca`), com o nome, a data e o local escritos em cima. Foto clara,
 * cheia de detalhe ou com letra dentro faz o texto sumir dentro dela — e não há
 * escurecimento único que sirva para cartaz de fundo liso e para foto de rua ao
 * meio-dia. Então quem cadastra escolhe, olhando a prévia.
 *
 * `veu` é o degradê que entra ENTRE a imagem e o texto: mais fraco no topo, onde
 * fica só o selo, e mais forte embaixo, onde ficam o nome e o endereço.
 * `desfoque` é o borrão na imagem — tira o detalhe fino, que é o que mais
 * atrapalha a leitura, sem apagar a foto.
 *
 * Espelhado em `src/features/presenca/filtro.ts`; `testes/contrato/fontes-unicas.test.ts`
 * prende os dois lados. O padrão é `medio`, que é exatamente o que a tela já
 * fazia antes de a escolha existir — encontro antigo continua igual.
 */
const FILTROS = [
    'nenhum' => ['nome' => 'Nenhum — a imagem como ela é',
                 'veu' => '',
                 'desfoque' => 0],
    'leve'   => ['nome' => 'Leve — escurece só o pé',
                 'veu' => 'linear-gradient(180deg, rgba(14,12,8,.06), rgba(14,12,8,.55))',
                 'desfoque' => 0],
    'medio'  => ['nome' => 'Médio — o padrão',
                 'veu' => 'linear-gradient(180deg, rgba(14,12,8,.12), rgba(14,12,8,.78))',
                 'desfoque' => 0],
    'forte'  => ['nome' => 'Forte — imagem bem atrás do texto',
                 'veu' => 'linear-gradient(180deg, rgba(14,12,8,.45), rgba(14,12,8,.92))',
                 'desfoque' => 0],
    'desfoque' => ['nome' => 'Forte com desfoque — foto cheia de detalhe',
                 'veu' => 'linear-gradient(180deg, rgba(14,12,8,.45), rgba(14,12,8,.92))',
                 'desfoque' => 4],
];
const FILTRO_PADRAO = 'medio';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/* Os meses por extenso e em minúscula — é assim que eles entram no período
   ("29 de agosto a 4 de setembro"), e não como número. `strftime()` faria isso
   sozinho, mas depende do locale instalado no servidor: na Hostinger sai em
   inglês, e o site anunciaria "29 de August". */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
               'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

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

/* ===================== a semana corrente ===================== */

/**
 * A SEMANA VAI DE SEGUNDA A DOMINGO, no fuso do Ceará.
 *
 * Espelha `semanaDe()` em `src/features/programacao/tempo.ts`. As duas existem
 * pelo motivo de sempre: o site calcula no navegador de quem visita, e o painel
 * calcula no PHP — e se discordarem, o encontro de domingo aparece "nesta
 * semana" num lado e "na semana que vem" no outro.
 *
 * SEGUNDA, e não domingo: "a agenda desta semana" é lida por quem organiza
 * trabalho, e o domingo à noite pertence à semana que está acabando, não à que
 * vai começar. É também o que o ISO-8601 chama de semana.
 *
 * O fuso é o do Ceará, e não o do servidor, pelo mesmo motivo de
 * `partes_de_exibicao()`: a Hostinger roda em UTC, e às 22h de domingo o
 * servidor já está na segunda — a semana viraria seis horas cedo demais.
 *
 * Devolve os dois instantes em ISO: `inicio` é segunda 00:00 e `fim` é o
 * primeiro instante da segunda seguinte. O intervalo é fechado na frente e
 * aberto atrás (`inicio <= t < fim`), que é o que evita o domingo 23:59:59
 * ficar de fora por um segundo.
 */
function semana_de(?int $agora = null): array
{
    $fuso = new DateTimeZone('America/Fortaleza');
    $hoje = (new DateTimeImmutable('@' . ($agora ?? time())))->setTimezone($fuso);
    $segunda = $hoje->modify('monday this week')->setTime(0, 0);

    return [
        'inicio' => $segunda->format('c'),
        'fim'    => $segunda->modify('+7 days')->format('c'),
    ];
}

/** O dia de hoje, do primeiro instante ao primeiro instante de amanhã. */
function dia_de(?int $agora = null): array
{
    $fuso = new DateTimeZone('America/Fortaleza');
    $hoje = (new DateTimeImmutable('@' . ($agora ?? time())))->setTimezone($fuso)->setTime(0, 0);

    return [
        'inicio' => $hoje->format('c'),
        'fim'    => $hoje->modify('+1 day')->format('c'),
    ];
}

/**
 * O instante cai dentro do período? Vazio ou ilegível devolve false.
 *
 * `dentro_do_periodo`, e não `dentro_da_janela`: `fatos-comum.php` já tem uma
 * `dentro_da_janela()`, que responde outra pergunta (se o fato está dentro das
 * 48h do manual). Duas funções com o mesmo nome no mesmo processo é erro fatal
 * do PHP, e as duas telas se cruzam no hub.
 *
 * Encontro sem horário nunca "é desta semana": afirmar isso seria inventar uma
 * data que ninguém digitou. Ele continua existindo na lista sem recorte.
 */
function dentro_do_periodo(string $inicio, array $janela): bool
{
    if ($inicio === '') {
        return false;
    }
    $t = strtotime($inicio);
    $de = strtotime($janela['inicio']);
    $ate = strtotime($janela['fim']);
    if ($t === false || $de === false || $ate === false) {
        return false;
    }
    return $t >= $de && $t < $ate;
}

/**
 * "29 de agosto a 4 de setembro" — o período escrito por extenso.
 *
 * É o que substitui o campo digitado à mão na capa da programação, que
 * envelhecia sozinho: quem esquecia de trocar deixava o site anunciando a
 * semana passada. O mês só se repete quando a semana atravessa a virada.
 */
function periodo_da_semana(?int $agora = null): string
{
    $fuso = new DateTimeZone('America/Fortaleza');
    $semana = semana_de($agora);
    $de  = (new DateTimeImmutable($semana['inicio']))->setTimezone($fuso);
    /* O fim da janela é a segunda seguinte; o domingo é o dia anterior a ela. */
    $ate = (new DateTimeImmutable($semana['fim']))->setTimezone($fuso)->modify('-1 day');

    $mesDe  = MESES[(int) $de->format('n') - 1];
    $mesAte = MESES[(int) $ate->format('n') - 1];

    if ($mesDe === $mesAte) {
        return (int) $de->format('j') . ' a ' . (int) $ate->format('j') . ' de ' . $mesAte;
    }
    return (int) $de->format('j') . ' de ' . $mesDe
        . ' a ' . (int) $ate->format('j') . ' de ' . $mesAte;
}

/**
 * Quantos dias de calendário faltam para o instante — negativo depois, `null`
 * quando não há instante nenhum.
 *
 * ISTO EXISTE PORQUE `data` NÃO É UMA DATA. O campo `data` do encontro é texto
 * de EXIBIÇÃO ("24/08"), derivado do `inicio` por `partes_de_exibicao()` — sem
 * ano e sem fuso. `strtotime('24/08')` devolve `false`, o `(int)` transforma
 * isso em 0, e a conta passa a ser feita a partir de 1º de janeiro de 1970 sem
 * erro nenhum aparecer: a página continua desenhando. Era assim que TODO
 * encontro futuro com o checklist pela metade aparecia no hub como "é hoje" e
 * pintado de urgente, e que a mesa de Encontros dizia "01/01".
 *
 * A contagem é em DIAS DE CALENDÁRIO no fuso do Ceará, e não em blocos de 24h:
 * um encontro amanhã às 8h está a catorze horas de distância e mesmo assim é
 * amanhã — é isso que quem lê "faltam 2 dias" entende.
 *
 * Mesmo cuidado de `partes_de_exibicao()`: o PHP da Hostinger roda em UTC, e
 * comparar sem converter faz o encontro das 22h virar o dia seguinte.
 */
function dias_ate_o_dia(string $inicio): ?int
{
    if ($inicio === '') {
        return null;
    }
    try {
        $fuso  = new DateTimeZone('America/Fortaleza');
        $quando = (new DateTimeImmutable($inicio))->setTimezone($fuso)->setTime(0, 0);
        $hoje   = (new DateTimeImmutable('now', $fuso))->setTime(0, 0);
    } catch (Exception $e) {
        return null;
    }
    return (int) $hoje->diff($quando)->format('%r%a');
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
 *
 * NULO QUER DIZER "NÃO VEIO ARQUIVO", e não "não veio o campo". O formulário é
 * `multipart/form-data` e o `<input type=file>` está sempre lá: o PHP monta
 * `$_FILES['imagem']` mesmo quando ninguém escolheu nada, só que com
 * `UPLOAD_ERR_NO_FILE`. Devolver a ficha nesse caso fazia todo
 * `if (arquivo_simples(...) !== null) {...} elseif ($_POST['tirarImagem'])`
 * nunca chegar no `elseif` — era por isso que "Remover esta imagem" não
 * removia. Quem quiser o erro do upload chama `guardar_upload()`, que continua
 * tratando os outros códigos.
 */
function arquivo_simples(string $campo): ?array
{
    $f = $_FILES[$campo] ?? null;
    if (!is_array($f) || !isset($f['error']) || is_array($f['error'])) {
        return null;
    }
    if ((int) $f['error'] === UPLOAD_ERR_NO_FILE) {
        return null;  // o campo existe, o arquivo não
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
    /* Sem `imagedestroy()`: desde o PHP 8.0 a imagem é objeto e o coletor de
       lixo a solta sozinho; desde o 8.5 a chamada é depreciada e escreve aviso
       no log a cada foto enviada. */

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
        return $girada;  // a original sai de cena com o objeto; ver o comentário acima
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
