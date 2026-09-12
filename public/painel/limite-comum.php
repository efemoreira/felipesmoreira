<?php
declare(strict_types=1);

/**
 * O teto de envios de quem não tem conta — o guarda dos endpoints públicos.
 *
 * `/queroajudar` e `/presenca` aceitam gente sem login, e o que os protege de
 * um robô não é CSRF (visitante não tem sessão), é isto: um teto por visitante
 * por hora e por dia, com a chave do visitante embaralhada pelo segredo do
 * site. Saiu de `inscricoes-comum.php` porque `api/presenca.php` incluía o
 * arquivo inteiro da inscrição só para chamar `passou_do_limite()`.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_LIMITE     = PASTA_DADOS . '/inscricoes-limite.php';

const LIMITE_PRESENCA_HORA = 60;

const LIMITE_PRESENCA_DIA  = 400;

const LIMITE_POR_HORA = 5;

const LIMITE_POR_DIA  = 20;

function chave_visitante(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    // A Hostinger fica atrás de proxy; o primeiro da lista é o cliente.
    $enc = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($enc !== '') {
        $partes = explode(',', $enc);
        $primeiro = trim($partes[0]);
        if (filter_var($primeiro, FILTER_VALIDATE_IP)) {
            $ip = $primeiro;
        }
    }
    return substr(hash_hmac('sha256', $ip, segredo()), 0, 24);
}

function estado_limite(): array
{
    if (!is_file(ARQ_LIMITE)) {
        return [];
    }
    $v = @include ARQ_LIMITE;
    return is_array($v) ? $v : [];
}

/**
 * true quando o visitante já passou do teto e deve ser barrado.
 *
 * O ESCOPO existe porque os dois usos não se parecem em nada.
 *
 * A inscrição é uma vez na vida por pessoa: cinco por hora do mesmo endereço já
 * é comportamento estranho. A presença é uma fila numa porta — trinta pessoas
 * lendo o mesmo QR, quase todas no mesmo Wi‑Fi do local, no mesmo quarto de
 * hora. Com o teto da inscrição, a sexta pessoa da fila levaria "você já se
 * cadastrou há pouco" e iria embora sem entrar na lista.
 *
 * O teto da presença continua existindo (a busca por telefone devolve nome, e
 * sem teto isso seria um oráculo para varrer faixas de número), só é alto o
 * bastante para caber um evento de verdade.
 */
function passou_do_limite(string $escopo = 'inscricao', int $porHora = LIMITE_POR_HORA, int $porDia = LIMITE_POR_DIA): bool
{
    $agora = time();
    $reg = estado_limite()[chave_visitante() . ':' . $escopo] ?? null;
    if (!is_array($reg)) {
        return false;
    }
    $hora = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 3600);
    $dia  = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 86400);
    return count($hora) >= $porHora || count($dia) >= $porDia;
}

function registrar_envio(string $escopo = 'inscricao'): void
{
    com_trava(ARQ_LIMITE, fn () => registrar_envio_travado($escopo));
}

/** O leitura-altera-grava de `registrar_envio()`, já com a tranca na mão. */
function registrar_envio_travado(string $escopo): void
{
    preparar_pastas();
    $agora = time();
    $chave = chave_visitante() . ':' . $escopo;
    $tudo = estado_limite();

    $envios = (array) ($tudo[$chave]['envios'] ?? []);
    $envios[] = $agora;
    // guarda só a janela de 24h, senão o arquivo cresce sem fim
    $tudo[$chave] = ['envios' => array_values(array_filter($envios, fn ($t) => $t > $agora - 86400))];

    foreach ($tudo as $k => $v) {
        $restantes = array_filter((array) ($v['envios'] ?? []), fn ($t) => $t > $agora - 86400);
        if ($restantes === []) {
            unset($tudo[$k]);
        }
    }

    gravar_atomico(ARQ_LIMITE, "<?php\nreturn " . var_export($tudo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_LIMITE, true);
    }
}
