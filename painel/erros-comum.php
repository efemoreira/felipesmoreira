<?php
declare(strict_types=1);

/**
 * O registro de erros — o que aconteceu de errado em produção, e onde ler.
 *
 * Em produção o `display_errors` está desligado (e tem de estar: aviso de PHP
 * na tela é caminho de arquivo e nome de função para quem olha). O outro lado
 * disso era que o erro SUMIA: nem quem administra sabia que a tela X quebrou
 * para a pessoa Y na terça. Isto grava uma linha por erro em
 * `dados/erros.log` — data, tipo, mensagem, arquivo:linha, rota, uid — e a
 * Manutenção mostra os últimos sete dias.
 *
 * NÃO É O LOG DE ATIVIDADE que o CLAUDE.md proíbe: aqui não há nada de quem
 * fez o quê no movimento, só o que o PHP não conseguiu fazer. Roda com
 * rotação por tamanho, fechado pela web como o resto de `/dados`.
 *
 * Nos testes não entra: o sandbox roda com `display_errors=stderr` e derruba
 * o teste no primeiro aviso — que é uma rede melhor do que um log.
 */

const ARQ_ERROS = PASTA_DADOS . '/erros.log';
const ERROS_MAX_BYTES = 512 * 1024;   // meio mega; passou, gira para erros.1.log

function registrar_erro(string $tipo, string $mensagem, string $arquivo = '', int $linha = 0): void
{
    preparar_pastas();
    $u = function_exists('usuario_atual') && session_status() === PHP_SESSION_ACTIVE ? usuario_atual() : null;
    $linhaLog = json_encode([
        'quando'  => date('c'),
        'tipo'    => $tipo,
        'msg'     => mb_substr($mensagem, 0, 500),
        'onde'    => $arquivo !== '' ? basename($arquivo) . ':' . $linha : '',
        'rota'    => mb_substr((string) ($_SERVER['REQUEST_URI'] ?? PHP_SAPI), 0, 200),
        'uid'     => $u['id'] ?? '',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if (is_file(ARQ_ERROS) && filesize(ARQ_ERROS) > ERROS_MAX_BYTES) {
        @rename(ARQ_ERROS, PASTA_DADOS . '/erros.1.log');
    }
    @file_put_contents(ARQ_ERROS, $linhaLog . "\n", FILE_APPEND | LOCK_EX);
}

/** Liga os dois ganchos. Chamado uma vez, no `sessao.php`, fora do CLI e dos testes. */
function ligar_registro_de_erros(): void
{
    set_error_handler(function (int $nivel, string $msg, string $arquivo, int $linha): bool {
        if (!(error_reporting() & $nivel)) {
            return false;   // silenciado com @: não é erro para ninguém
        }
        $tipo = match ($nivel) {
            E_WARNING, E_USER_WARNING => 'aviso',
            E_NOTICE, E_USER_NOTICE   => 'nota',
            E_DEPRECATED, E_USER_DEPRECATED => 'obsoleto',
            default => 'erro',
        };
        registrar_erro($tipo, $msg, $arquivo, $linha);
        return false;   // o PHP segue o caminho normal (log do servidor, etc.)
    });
    set_exception_handler(function (Throwable $e): void {
        registrar_erro('fatal', get_class($e) . ': ' . $e->getMessage(), $e->getFile(), $e->getLine());
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Deu errado do nosso lado. Já ficou registrado; tente de novo em um minuto.\n";
    });
    register_shutdown_function(function (): void {
        $e = error_get_last();
        if ($e !== null && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
            registrar_erro('fatal', $e['message'], $e['file'], (int) $e['line']);
        }
    });
}

/** Os erros dos últimos N dias, o mais recente primeiro. */
function erros_recentes(int $dias = 7, int $teto = 100): array
{
    $corte = date('c', time() - $dias * 86400);
    $linhas = [];
    foreach ([ARQ_ERROS, PASTA_DADOS . '/erros.1.log'] as $arq) {
        if (!is_file($arq)) {
            continue;
        }
        foreach (file($arq, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $l) {
            $r = json_decode($l, true);
            if (is_array($r) && ($r['quando'] ?? '') >= $corte) {
                $linhas[] = $r;
            }
        }
    }
    usort($linhas, fn ($a, $b) => strcmp($b['quando'], $a['quando']));
    return array_slice($linhas, 0, $teto);
}

/** Zera o registro — depois de lido e resolvido. */
function limpar_erros(): void
{
    foreach ([ARQ_ERROS, PASTA_DADOS . '/erros.1.log'] as $arq) {
        if (is_file($arq)) {
            @unlink($arq);
        }
    }
}
