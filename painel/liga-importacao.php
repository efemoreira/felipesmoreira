<?php
declare(strict_types=1);

require_once __DIR__ . '/organizacao-comum.php';

const COLUNAS_CSV_LIGA = ['id', 'mes', 'instagram', 'tiktok', 'youtube', 'x', 'engajamento', 'semanasSeguidas', 'todasSemanas', 'acoes', 'modulos', 'lives'];

/** O modelo usa ids da Liga existente; não cria uma segunda base de pessoas. */
function baixar_modelo_csv_da_liga(): never
{
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="fechamento-liga.csv"');
    header('Cache-Control: no-store, private');
    $f = fopen('php://output', 'w');
    fwrite($f, "\xEF\xBB\xBF");
    fputcsv($f, COLUNAS_CSV_LIGA, ';', '"', '');
    $mes = (new DateTimeImmutable(substr(hoje_ce(), 0, 7) . '-01'))->modify('-1 month')->format('Y-m');
    foreach (ler_liga() as $pv) {
        if ($pv['encerradoEm'] === '') {
            fputcsv($f, array_merge([$pv['id'], $mes], array_fill(0, 10, '')), ';', '"', '');
        }
    }
    fclose($f);
    exit;
}

/** CSV de fechamento, não de cadastro: id + mês identificam o registro a corrigir. */
function previa_csv_da_liga(string $texto, array $liga): array
{
    $erro = fn (string $msg) => ['erro' => $msg, 'linhas' => []];
    if (strlen($texto) > 1024 * 1024) {
        return $erro('O CSV deve ter até 1 MB.');
    }
    $texto = preg_replace('/^\xEF\xBB\xBF/', '', trim($texto)) ?? '';
    if ($texto === '') {
        return $erro('Escolha um CSV ou cole os dados.');
    }
    $primeira = strtok($texto, "\r\n");
    $sep = substr_count((string) $primeira, ';') >= substr_count((string) $primeira, ',') ? ';' : ',';
    $f = fopen('php://temp', 'r+');
    fwrite($f, $texto);
    rewind($f);
    $cabecalho = fgetcsv($f, 0, $sep, '"', '');
    $cabecalho = array_map(fn ($c) => mb_strtolower(trim((string) $c)), $cabecalho ?: []);
    $exigidas = array_map('strtolower', COLUNAS_CSV_LIGA);
    if (array_diff($exigidas, $cabecalho) !== [] || count(array_unique($cabecalho)) !== count($cabecalho)) {
        fclose($f);
        return $erro('Use todas as colunas do modelo, sem repetir cabeçalhos.');
    }
    $pessoas = array_column($liga, null, 'id');
    $linhas = $vistos = [];
    $n = 1;
    while (($dados = fgetcsv($f, 0, $sep, '"', '')) !== false) {
        $n++;
        if (count($dados) === 1 && trim((string) $dados[0]) === '') {
            continue;
        }
        if (count($linhas) >= 500) {
            fclose($f);
            return $erro('Importe até 500 fechamentos por vez.');
        }
        $campos = [];
        foreach ($cabecalho as $i => $c) {
            $campos[$c] = trim((string) ($dados[$i] ?? ''));
        }
        $id = $campos['id'];
        $mes = mes_valido($campos['mes']);
        $pv = $pessoas[$id] ?? null;
        $motivos = [];
        if (count($dados) !== count($cabecalho)) {
            $motivos[] = 'quantidade de colunas diferente do cabeçalho';
        }
        if ($pv === null || $pv['encerradoEm'] !== '') {
            $motivos[] = 'id não corresponde a um porta-voz ativo';
        }
        if ($mes === '' || $mes > substr(hoje_ce(), 0, 7)) {
            $motivos[] = 'mês inválido ou futuro';
        }
        $chave = $id . '/' . $mes;
        if (isset($vistos[$chave])) {
            $motivos[] = 'id e mês repetidos no arquivo';
        }
        $vistos[$chave] = true;
        $registro = ['mes' => $mes, 'redes' => [], 'origem' => 'planilha'];
        foreach (array_merge(array_keys(REDES_LIGA), ['semanasSeguidas', 'acoes', 'modulos', 'lives']) as $c) {
            $v = $campos[strtolower($c)];
            $max = isset(REDES_LIGA[$c]) ? 100000000 : ($c === 'semanasSeguidas' ? 520 : 50);
            if (!preg_match('/^\d+$/', $v) || (float) $v > $max) {
                $motivos[] = $c . ' deve ser um inteiro entre 0 e ' . $max;
            }
            if (isset(REDES_LIGA[$c])) {
                $registro['redes'][$c] = (int) $v;
            } else {
                $registro[$c] = (int) $v;
            }
        }
        $eng = str_replace(',', '.', $campos['engajamento']);
        if (!preg_match('/^\d+(\.\d+)?$/', $eng) || (float) $eng > 100) {
            $motivos[] = 'engajamento deve ser uma porcentagem de 0 a 100';
        }
        $registro['engajamento'] = (float) $eng;
        $todas = mb_strtolower($campos['todassemanas']);
        if (!in_array($todas, ['0', '1', 'sim', 'nao', 'não'], true)) {
            $motivos[] = 'todasSemanas deve ser 0 ou 1 (não ou sim)';
        }
        $registro['todasSemanas'] = in_array($todas, ['1', 'sim'], true);
        $anterior = $pv === null ? null : (array_column($pv['meses'], null, 'mes')[$mes] ?? null);
        $existe = $anterior !== null;
        $linhas[] = ['n' => $n, 'id' => $id, 'nome' => $pv['nome'] ?? $id,
            'registro' => normalizar_mes_liga($registro) ?? $registro, 'motivos' => $motivos, 'corrige' => $existe, 'anterior' => $anterior];
    }
    fclose($f);
    return ['erro' => $linhas === [] ? 'O CSV não tem fechamentos.' : '', 'linhas' => $linhas];
}

function preparar_importacao_da_liga(): void
{
    unset($_SESSION['previaLiga']);
    $texto = (string) ($_POST['csvLiga'] ?? '');
    $arquivo = $_FILES['csvLigaArquivo'] ?? null;
    if ($arquivo !== null && ($arquivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        if ($arquivo['error'] !== UPLOAD_ERR_OK || $arquivo['size'] > 1024 * 1024 || !is_uploaded_file($arquivo['tmp_name'])) {
            avisar('erro', 'Não consegui ler o CSV. Envie um arquivo de até 1 MB.');
            voltar_organizacao('liga');
        }
        $texto = (string) file_get_contents($arquivo['tmp_name']);
    }
    $previa = previa_csv_da_liga($texto, ler_liga());
    if ($previa['erro'] !== '') {
        avisar('erro', $previa['erro']);
    } else {
        $_SESSION['previaLiga'] = $previa + ['token' => bin2hex(random_bytes(16)), 'em' => time()];
        avisar('ok', 'Confira a prévia. Nada foi gravado ainda.');
    }
    voltar_organizacao('liga');
}

function confirmar_importacao_da_liga(array $eu): void
{
    $previa = $_SESSION['previaLiga'] ?? null;
    if (!is_array($previa) || time() - $previa['em'] > 1800
        || !hash_equals($previa['token'], (string) ($_POST['previaToken'] ?? ''))
        || array_filter($previa['linhas'], fn ($l) => $l['motivos'] !== []) !== []) {
        avisar('erro', 'A prévia expirou, mudou ou contém erros. Gere uma nova prévia válida.');
        voltar_organizacao('liga');
    }
    $ok = com_trava(ARQ_LIGA, function () use ($previa, $eu): bool {
        $liga = ler_liga();
        $indices = array_flip(array_column($liga, 'id'));
        foreach ($previa['linhas'] as $linha) {
            $i = $indices[$linha['id']] ?? null;
            if ($i === null || $liga[$i]['encerradoEm'] !== '') {
                return false;
            }
            $anterior = array_column($liga[$i]['meses'], null, 'mes')[$linha['registro']['mes']] ?? null;
            if ($anterior !== $linha['anterior']) {
                return false;
            }
            $m = array_merge($linha['registro'], ['em' => date('c'), 'por' => (string) ($eu['nome'] ?? '')]);
            $liga[$i]['meses'] = array_values(array_filter($liga[$i]['meses'], fn ($a) => $a['mes'] !== $m['mes']));
            $liga[$i]['meses'][] = $m;
        }
        return gravar_liga($liga);
    });
    unset($_SESSION['previaLiga']);
    avisar($ok ? 'ok' : 'erro', $ok ? 'Planilha importada. Níveis, placares e revisões foram recalculados.'
        : 'Não consegui importar: a Liga mudou ou houve falha ao gravar. Gere uma nova prévia.');
    voltar_organizacao('liga');
}
