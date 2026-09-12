<?php
declare(strict_types=1);

/**
 * O backup diário — para o cron da hospedagem, e só para ele.
 *
 *   0 3 * * *  php /home/<conta>/public_html/painel/backup.php
 *
 * NÃO TEM URL. Pela web este arquivo responde 404 antes de incluir qualquer
 * coisa: um endereço que grava um zip com o cadastro inteiro é um alvo, e o
 * token que o protegeria seria mais um segredo para vazar. Quem quer o backup
 * agora usa o botão da Manutenção, que já está atrás do login de `adm`.
 *
 * A saída é uma linha com o nome do zip, para o log do cron dizer o que fez —
 * e o código de saída 1 quando nada foi gravado, para o cron avisar.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/backup-comum.php';

$feito = fazer_backup();
if ($feito === null) {
    fwrite(STDERR, "backup: nada gravado — /dados vazio, sem ZipArchive ou sem permissão em /dados/backups\n");
    exit(1);
}
echo basename($feito), "\n";
