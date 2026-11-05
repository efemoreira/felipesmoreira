<?php
declare(strict_types=1);

/** Acervo privado do dono. Conteúdo e progresso ficam em /dados, fora do Git. */
require_once __DIR__ . '/sessao.php';

const ARQ_ACAO = PASTA_DADOS . '/acao.php';
const ARQ_ACAO_PROGRESSO = PASTA_DADOS . '/acao-progresso.php';
const ACAO_MAX_BYTES = 5 * 1024 * 1024;

/** A identidade inicial é explícita; a primeira importação fixa o id da conta. */
function acao_pode_acessar(?array $pessoa): bool
{
    if ($pessoa === null || empty($pessoa['ativo']) || !empty($pessoa['trocarSenha'])
        || !in_array('adm', $pessoa['capacidades'] ?? [], true)) {
        return false;
    }
    if (is_file(ARQ_ACAO)) {
        $acervo = @include ARQ_ACAO;
        return is_array($acervo) && is_string($acervo['donoId'] ?? null)
            && hash_equals($acervo['donoId'], (string) $pessoa['id']);
    }
    return hash_equals(hash('sha256', 'efemoreira'), hash('sha256', (string) ($pessoa['usuario'] ?? '')));
}

function acao_ler_acervo(): array
{
    $valor = is_file(ARQ_ACAO) ? @include ARQ_ACAO : null;
    return is_array($valor) ? $valor : ['documentos' => [], 'diretorio' => [], 'atualizadoEm' => ''];
}

function acao_ler_progresso(): array
{
    $valor = is_file(ARQ_ACAO_PROGRESSO) ? @include ARQ_ACAO_PROGRESSO : null;
    return is_array($valor) ? array_filter($valor, fn ($v, $k) => is_string($k) && is_bool($v), ARRAY_FILTER_USE_BOTH) : [];
}

/** Identificadores de tarefas persistem quando o texto é movido de seção. */
function acao_tarefas(array $documento): array
{
    $tarefas = [];
    $ocorrencias = [];
    $cerca = '';
    $tamanhoCerca = 0;
    foreach (explode("\n", $documento['conteudo']) as $indice => $linha) {
        if (preg_match('/^\s{0,3}(`{3,}|~{3,})(.*)$/u', $linha, $m)) {
            $caractere = $m[1][0];
            if ($cerca === '') {
                $cerca = $caractere;
                $tamanhoCerca = strlen($m[1]);
            } elseif ($cerca === $caractere && strlen($m[1]) >= $tamanhoCerca && trim($m[2]) === '') {
                $cerca = '';
            }
            continue;
        }
        if ($cerca !== '' || !preg_match('/^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+(.+)$/u', $linha, $m)) {
            continue;
        }
        $texto = trim($m[2]);
        $vez = $ocorrencias[$texto] ?? 0;
        $ocorrencias[$texto] = $vez + 1;
        $tarefas[] = [
            'id' => substr(hash('sha256', $documento['id'] . "\0" . $texto . "\0" . $vez), 0, 24),
            'linha' => $indice + 1,
            'texto' => $texto,
            'concluida' => strtolower($m[1]) === 'x',
        ];
    }
    return $tarefas;
}

/** Validação integral antes de gravar: um arquivo ruim não altera o acervo. */
function acao_validar_pacote(array $pacote): array
{
    if (($pacote['versao'] ?? null) !== 1 || !is_array($pacote['documentos'] ?? null)
        || count($pacote['documentos']) < 1 || count($pacote['documentos']) > 40) {
        throw new InvalidArgumentException('Escolha um pacote de Ação válido, com até 40 documentos.');
    }
    $documentos = [];
    $ids = [];
    $total = 0;
    foreach ($pacote['documentos'] as $documento) {
        if (!is_array($documento)) {
            throw new InvalidArgumentException('Um dos documentos não tem o formato esperado.');
        }
        $id = $documento['id'] ?? '';
        $conteudo = $documento['conteudo'] ?? null;
        if (!is_string($id) || !preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D', $id) || isset($ids[$id])) {
            throw new InvalidArgumentException('Há um identificador de documento inválido ou repetido.');
        }
        if (!is_string($conteudo) || trim($conteudo) === '' || strlen($conteudo) > 1024 * 1024
            || !mb_check_encoding($conteudo, 'UTF-8') || str_contains($conteudo, "\0")) {
            throw new InvalidArgumentException('Os documentos devem conter texto UTF-8 de até 1 MB cada.');
        }
        $total += strlen($conteudo);
        $ids[$id] = true;
        $titulo = limpar_texto($documento['titulo'] ?? '', 180);
        if ($titulo === '') {
            throw new InvalidArgumentException('Cada documento precisa de um título.');
        }
        $arquivo = basename(str_replace('\\', '/', (string) ($documento['arquivo'] ?? $id . '.md')));
        $documentos[] = [
            'id' => $id,
            'titulo' => $titulo,
            'categoria' => limpar_texto($documento['categoria'] ?? 'Planejamento', 60) ?: 'Planejamento',
            'resumo' => limpar_texto($documento['resumo'] ?? '', 300),
            'arquivo' => limpar_texto($arquivo, 180),
            'conteudo' => str_replace(["\r\n", "\r"], "\n", $conteudo),
        ];
    }
    if ($total > ACAO_MAX_BYTES) {
        throw new InvalidArgumentException('O acervo ultrapassou o limite de 5 MB.');
    }
    $diretorio = [];
    $codigos = [];
    if (isset($pacote['diretorio']) && !is_array($pacote['diretorio'])) {
        throw new InvalidArgumentException('O diretório precisa ser uma lista.');
    }
    if (count($pacote['diretorio'] ?? []) > 1000) {
        throw new InvalidArgumentException('O diretório pode conter até mil destinos.');
    }
    foreach ($pacote['diretorio'] ?? [] as $linha) {
        if (!is_array($linha) || !is_string($linha['codigo'] ?? null) || $linha['codigo'] === '' || isset($codigos[$linha['codigo']])) {
            throw new InvalidArgumentException('O diretório tem um código ausente ou repetido.');
        }
        $limpa = [];
        foreach ($linha as $chave => $valor) {
            if (!is_string($chave) || !preg_match('/^[a-z_]{1,50}$/D', $chave) || !is_string($valor) || count($limpa) >= 30) {
                throw new InvalidArgumentException('Um campo do diretório não tem o formato esperado.');
            }
            $limpa[$chave] = limpar_texto($valor, 2000);
        }
        $codigos[$linha['codigo']] = true;
        $diretorio[] = $limpa;
    }
    return ['documentos' => $documentos, 'diretorio' => $diretorio];
}

function acao_importar(array $pacote, array $dono): bool
{
    $validado = acao_validar_pacote($pacote);
    return com_trava(ARQ_ACAO, function () use ($validado, $dono): bool {
        if (!acao_pode_acessar($dono)) {
            return false;
        }
        $acervo = [
            'donoId' => $dono['id'],
            'documentos' => $validado['documentos'],
            'diretorio' => $validado['diretorio'],
            'atualizadoEm' => date('c'),
        ];
        return gravar_atomico(ARQ_ACAO, "<?php\nreturn " . var_export($acervo, true) . ";\n");
    });
}

function acao_marcar_tarefa(string $documentoId, string $tarefaId, bool $concluida): bool
{
    $acervo = acao_ler_acervo();
    $documento = null;
    foreach ($acervo['documentos'] as $item) {
        if ($item['id'] === $documentoId) {
            $documento = $item;
            break;
        }
    }
    if ($documento === null || !in_array($tarefaId, array_column(acao_tarefas($documento), 'id'), true)) {
        throw new InvalidArgumentException('Essa tarefa não está no documento atual.');
    }
    return com_trava(ARQ_ACAO_PROGRESSO, function () use ($tarefaId, $concluida): bool {
        $progresso = acao_ler_progresso();
        $progresso[$tarefaId] = $concluida;
        return gravar_atomico(ARQ_ACAO_PROGRESSO, "<?php\nreturn " . var_export($progresso, true) . ";\n");
    });
}

function acao_resposta_acervo(array $dono): array
{
    $acervo = acao_ler_acervo();
    $documentos = [];
    $ids = [];
    foreach ($acervo['documentos'] as $documento) {
        $documento['tarefas'] = acao_tarefas($documento);
        foreach ($documento['tarefas'] as $tarefa) {
            $ids[$tarefa['id']] = true;
        }
        $documentos[] = $documento;
    }
    return [
        'autenticado' => true,
        'pode' => true,
        'nome' => $dono['nome'],
        'csrf' => token(),
        'documentos' => $documentos,
        'diretorio' => $acervo['diretorio'],
        'progresso' => (object) array_intersect_key(acao_ler_progresso(), $ids),
        'atualizadoEm' => $acervo['atualizadoEm'],
    ];
}
