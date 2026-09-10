<?php
declare(strict_types=1);

/**
 * O que toda ação do painel faz igual — o POST-redirect-GET num lugar só.
 *
 * Cada `-acoes.php` tinha a sua cópia de `avisar()`, a sua cópia da trava de
 * CSRF e o seu `header('Location…'); exit;`, e cada rota lia o recado da
 * sessão com as mesmas quatro linhas. Nove cópias da mesma dupla, dez da
 * mesma leitura — e a próxima tela grande copiaria a décima. Aqui fica uma.
 *
 * O que continua em cada módulo é o `voltar()`: para onde a ação volta é
 * decisão da tela (a aba certa, a âncora, o encontro aberto), e cada uma
 * calcula a sua. O que ela não precisa saber é como se manda um 302.
 *
 * `avisar()` guarda o recado na sessão e `recado()` (layout.php) o desenha na
 * tela seguinte — é o G do POST-redirect-GET, e é por isso que a mensagem não
 * vai na URL.
 */

require_once __DIR__ . '/sessao.php';

/** Guarda o recado para a tela seguinte desenhar. `$tipo` é 'ok' ou 'erro'. */
function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

/** O 302 e o fim. Toda ação termina aqui, direta ou pelo `voltar()` da tela. */
function ir_para(string $url): never
{
    header('Location: ' . $url, true, 302);
    exit;
}

/**
 * A trava de CSRF de toda ação. Sem token válido a sessão cai e a pessoa volta
 * ao login — não há "tente de novo": token errado é sessão expirada ou
 * formulário forjado, e os dois se resolvem entrando de novo.
 */
function exigir_token_de_acao(): void
{
    if (token_valido()) {
        return;
    }
    avisar('erro', 'Sessão expirada. Entre de novo.');
    derrubar_sessao();
    ir_para('/painel/');
}

/**
 * O recado deixado pela ação anterior, já separado em erro e ok — e apagado,
 * para não reaparecer no F5.
 *
 *   ['erro' => $erro, 'ok' => $ok] = recado_pendente();
 */
function recado_pendente(): array
{
    $recado = $_SESSION['recado'] ?? null;
    unset($_SESSION['recado']);
    return [
        'erro' => ($recado['tipo'] ?? '') === 'erro' ? (string) $recado['texto'] : null,
        'ok'   => ($recado['tipo'] ?? '') === 'ok'   ? (string) $recado['texto'] : null,
    ];
}
