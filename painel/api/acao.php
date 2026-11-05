<?php
declare(strict_types=1);

require_once __DIR__ . '/../acao-comum.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');

function acao_responder(array $corpo, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$dono = usuario_atual();
$metodo = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($dono === null) {
    acao_responder(['autenticado' => false, 'pode' => false], $metodo === 'GET' ? 200 : 401);
}
if (!acao_pode_acessar($dono)) {
    acao_responder(['autenticado' => true, 'pode' => false], $metodo === 'GET' ? 200 : 403);
}

if ($metodo === 'GET') {
    if (isset($_GET['acesso'])) {
        acao_responder(['autenticado' => true, 'pode' => true]);
    }
    if (isset($_GET['backup'])) {
        if (!is_file(ARQ_ACAO) || !class_exists('ZipArchive')) {
            acao_responder(['ok' => false, 'erro' => 'A cópia privada ainda não está disponível.'], 404);
        }
        $temporario = tempnam(sys_get_temp_dir(), 'acao-privada-');
        if ($temporario === false) {
            acao_responder(['ok' => false, 'erro' => 'Não consegui preparar a cópia privada.'], 500);
        }
        try {
            $zip = new ZipArchive();
            if ($zip->open($temporario, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                @unlink($temporario);
                acao_responder(['ok' => false, 'erro' => 'Não consegui preparar a cópia privada.'], 500);
            }
            foreach ([ARQ_ACAO, ARQ_ACAO_PROGRESSO] as $arquivoPrivado) {
                if (is_file($arquivoPrivado)) {
                    $zip->addFile($arquivoPrivado, basename($arquivoPrivado));
                }
            }
            $zip->close();
            header('Content-Type: application/zip');
            header('Content-Disposition: attachment; filename="acao-privada-' . date('Y-m-d') . '.zip"');
            header('Content-Length: ' . (string) filesize($temporario));
            readfile($temporario);
        } finally {
            @unlink($temporario);
        }
        exit;
    }
    if (isset($_GET['baixar'])) {
        foreach (acao_ler_acervo()['documentos'] as $documento) {
            if ($documento['id'] === $_GET['baixar']) {
                header('Content-Type: text/markdown; charset=utf-8');
                header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($documento['arquivo']));
                echo $documento['conteudo'];
                exit;
            }
        }
        acao_responder(['ok' => false, 'erro' => 'Documento não encontrado.'], 404);
    }
    acao_responder(acao_resposta_acervo($dono));
}

if ($metodo !== 'POST') {
    acao_responder(['ok' => false, 'erro' => 'Método não aceito.'], 405);
}
if (!origem_confere()) {
    acao_responder(['ok' => false, 'erro' => 'Envio bloqueado.'], 403);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > ACAO_MAX_BYTES + 1024 * 1024) {
    acao_responder(['ok' => false, 'erro' => 'O envio ultrapassou o limite de tamanho.'], 413);
}

try {
    if (str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data')) {
        if (!token_valido()) {
            acao_responder(['ok' => false, 'erro' => 'Sua sessão mudou. Recarregue a página.'], 403);
        }
        $arquivo = $_FILES['pacote'] ?? null;
        if (!is_array($arquivo) || ($arquivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
            || !is_uploaded_file((string) ($arquivo['tmp_name'] ?? '')) || (int) $arquivo['size'] > ACAO_MAX_BYTES) {
            throw new InvalidArgumentException('Escolha o pacote de documentos de até 5 MB.');
        }
        $pacote = json_decode((string) file_get_contents($arquivo['tmp_name']), true);
        if (!is_array($pacote)) {
            throw new InvalidArgumentException('Não consegui ler esse pacote de documentos.');
        }
        if (!acao_importar($pacote, $dono)) {
            acao_responder(['ok' => false, 'erro' => 'Não consegui guardar os documentos.'], 500);
        }
        acao_responder(['ok' => true, ...acao_resposta_acervo($dono)]);
    }

    $bruto = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($bruto) || !is_string($bruto['csrf'] ?? null) || !hash_equals(token(), $bruto['csrf'])) {
        acao_responder(['ok' => false, 'erro' => 'Sua sessão mudou. Recarregue a página.'], 403);
    }
    if (($bruto['acao'] ?? '') !== 'marcar' || !is_bool($bruto['concluida'] ?? null)
        || !is_string($bruto['documento'] ?? null) || !is_string($bruto['tarefa'] ?? null)) {
        throw new InvalidArgumentException('A tarefa enviada não tem o formato esperado.');
    }
    if (!acao_marcar_tarefa($bruto['documento'], $bruto['tarefa'], $bruto['concluida'])) {
        acao_responder(['ok' => false, 'erro' => 'Não consegui guardar a tarefa.'], 500);
    }
    acao_responder(['ok' => true]);
} catch (InvalidArgumentException $erro) {
    acao_responder(['ok' => false, 'erro' => $erro->getMessage()], 400);
}
