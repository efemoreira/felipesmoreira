<?php
declare(strict_types=1);

/**
 * Cópia de segurança de /dados — o zip do dia.
 *
 * `public_html/dados/` fica fora do repositório, e é onde mora tudo o que o
 * painel gravou: pessoas, presenças, fatos, caixa. Um deploy não apaga nada
 * disso, mas um disco cheio, um `unlink` errado na Manutenção ou uma migração
 * de hospedagem apagam — e até aqui o único arquivo com cópia era o
 * `agenda.json`, justamente o menos sensível de todos.
 *
 * O zip cai em `PASTA_BACKUP`, que `preparar_pastas()` já fecha para a web com
 * `Require all denied`: o backup contém hash de senha e telefone de todo mundo,
 * e sair pela URL seria pior do que não existir. Quem o baixa é `adm`, pela
 * Manutenção, que lê o arquivo do disco e o entrega com a sessão aberta.
 *
 * DOIS CAMINHOS, UMA FUNÇÃO. O cron da hospedagem roda `backup.php` (que só
 * aceita a linha de comando) e a Manutenção tem o botão; os dois chamam
 * `fazer_backup()`. Não existe endpoint HTTP para disparar isto — um endpoint
 * público que grava um zip de tudo é um alvo, e o token que o protegeria seria
 * um segredo a mais para vazar.
 *
 * A LISTA É UM `glob`, AO CONTRÁRIO DA MANUTENÇÃO. Lá a lista é explícita
 * porque varrer a pasta apagaria o que não devia; aqui varrer a pasta copia o
 * que não devia — e copiar demais é o lado certo de errar num backup.
 */

require_once __DIR__ . '/sessao.php';

/** Quantos zips ficam. Catorze cobre duas semanas de cron diário e sobra para o botão. */
const MAX_BACKUPS_DADOS = 14;

/** O nome que `fazer_backup()` dá — e a única forma que a Manutenção aceita baixar. */
const FORMA_NOME_BACKUP = '/^dados-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/';

/**
 * Tudo o que entra no zip: os `.php` e `.json` de /dados e as imagens.
 *
 * Os backups anteriores não entram (zip dentro de zip, crescendo a cada dia),
 * nem os `.htaccess` (são de `preparar_pastas()`, que os recria). O
 * `segredo.php` ENTRA: é dele que saem os links de convite que já circulam, e
 * um restore sem ele invalidaria todos.
 */
function arquivos_para_backup(): array
{
    $lista = [];
    foreach (glob(PASTA_DADOS . '/*.{php,json}', GLOB_BRACE) ?: [] as $arquivo) {
        if (is_file($arquivo)) {
            $lista[] = $arquivo;
        }
    }
    foreach (glob(PASTA_IMAGENS . '/*') ?: [] as $arquivo) {
        if (is_file($arquivo) && basename($arquivo) !== '.htaccess') {
            $lista[] = $arquivo;
        }
    }
    sort($lista);
    return $lista;
}

/**
 * Grava o zip e devolve o caminho dele — ou null, se não havia o que copiar ou
 * o disco não deixou.
 *
 * Escreve em `.tmp` e renomeia no fim, como `gravar_atomico()`: um cron que
 * morre no meio não deixa um zip pela metade com nome de zip inteiro, que é o
 * tipo de arquivo em que se confia justamente no dia em que ele é preciso.
 */
function fazer_backup(?int $agora = null): ?string
{
    preparar_pastas();
    if (!class_exists('ZipArchive')) {
        return null;
    }
    $arquivos = arquivos_para_backup();
    if ($arquivos === []) {
        return null;
    }

    $destino = PASTA_BACKUP . '/dados-' . date('Y-m-d-His', $agora ?? time()) . '.zip';
    $tmp     = $destino . '.tmp';

    $zip = new ZipArchive();
    if ($zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        return null;
    }
    $quantos = 0;
    foreach ($arquivos as $arquivo) {
        /* O caminho dentro do zip é relativo a /dados: "pessoas.php",
           "imagens/foto.jpg". É o que faz o restore ser "descompacta em cima". */
        $dentro = substr($arquivo, strlen(PASTA_DADOS) + 1);
        if ($zip->addFile($arquivo, $dentro)) {
            $quantos++;
        }
    }
    $zip->close();

    if ($quantos === 0 || !@rename($tmp, $destino)) {
        @unlink($tmp);
        return null;
    }
    @chmod($destino, 0600);
    podar_backups();
    return $destino;
}

/** Os zips que existem, o mais novo primeiro. */
function backups_existentes(): array
{
    $lista = [];
    foreach (glob(PASTA_BACKUP . '/dados-*.zip') ?: [] as $arquivo) {
        $nome = basename($arquivo);
        if (!preg_match(FORMA_NOME_BACKUP, $nome)) {
            continue;
        }
        $lista[] = [
            'nome'    => $nome,
            'caminho' => $arquivo,
            'bytes'   => (int) filesize($arquivo),
            'quando'  => (int) filemtime($arquivo),
        ];
    }
    usort($lista, fn ($a, $b) => strcmp($b['nome'], $a['nome']));
    return $lista;
}

/** Apaga o que passa de MAX_BACKUPS_DADOS, do mais velho para o mais novo. */
function podar_backups(): void
{
    $todos = backups_existentes();
    foreach (array_slice($todos, MAX_BACKUPS_DADOS) as $velho) {
        @unlink($velho['caminho']);
    }
}

/**
 * O caminho de um backup pelo nome, ou null se o nome não é de backup.
 *
 * O nome vem da URL, e a regex é a única coisa entre ele e o disco: sem ela,
 * `?baixar=../segredo.php` entregaria o segredo do site a quem tem sessão de
 * administrador — que é exatamente a pessoa que não devia poder fazer isso sem
 * querer.
 */
function backup_por_nome(string $nome): ?string
{
    if (!preg_match(FORMA_NOME_BACKUP, $nome)) {
        return null;
    }
    $caminho = PASTA_BACKUP . '/' . $nome;
    return is_file($caminho) ? $caminho : null;
}

/** "1,2 MB", "340 KB" — para a lista da Manutenção. */
function tamanho_legivel(int $bytes): string
{
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 1, ',', '.') . ' MB';
    }
    return number_format(max(1, (int) ceil($bytes / 1024)), 0, ',', '.') . ' KB';
}
