<?php
declare(strict_types=1);

/**
 * O Paulo — o assistente do WhatsApp da militância, que mora em outro sistema
 * (o CRM) e fala com o painel por `api/paulo.php`.
 *
 * O PAINEL É A FONTE DA VERDADE. O Paulo conversa; quem guarda a pessoa, a
 * unidade, a escada e o relato é daqui. Por isso o Paulo não tem cadastro
 * próprio de militância: ele inscreve pela mesma `registrar_inscricao()` do
 * /queroajudar, lê o degrau de `degraus_de_hoje()` e as unidades de
 * `vinculos_da_pessoa()`.
 *
 * A AUTORIZAÇÃO É UMA ASSINATURA, e não uma conta. O Paulo não é pessoa, não
 * tem sessão nem CSRF: cada pedido leva `X-Paulo-Hora` (segundos Unix) e
 * `X-Paulo-Assinatura` = HMAC-SHA256 de "<hora>.<corpo>" com o segredo do
 * Paulo. A hora entra na conta para um pedido copiado não valer de novo depois
 * de cinco minutos.
 *
 * O segredo do Paulo NÃO é o `segredo()` do site: aquele embaralha IP e deriva
 * os convites das aulas, e entregá-lo a outro sistema daria a esse sistema o
 * poder de forjar convite. Este nasce sozinho na primeira vez e a Manutenção o
 * mostra para colar no CRM; trocar é apagar o arquivo.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_SEGREDO_PAULO = PASTA_DADOS . '/segredo-paulo.php';

/** Quanto tempo um pedido assinado vale. */
const SEGUNDOS_ASSINATURA_PAULO = 300;

function segredo_paulo(): string
{
    if (is_file(ARQ_SEGREDO_PAULO)) {
        $v = @include ARQ_SEGREDO_PAULO;
        if (is_string($v) && strlen($v) >= 32) {
            return $v;
        }
    }
    preparar_pastas();
    $novo = bin2hex(random_bytes(32));
    gravar_atomico(ARQ_SEGREDO_PAULO, "<?php\nreturn " . var_export($novo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_SEGREDO_PAULO, true);
    }
    return $novo;
}

function assinatura_paulo(string $hora, string $corpo): string
{
    return hash_hmac('sha256', $hora . '.' . $corpo, segredo_paulo());
}

/** O pedido veio do Paulo, agora? `$agora` existe para o teste. */
function pedido_do_paulo(string $hora, string $assinatura, string $corpo, ?int $agora = null): bool
{
    if (preg_match('/^\d{9,11}$/', $hora) !== 1 || preg_match('/^[a-f0-9]{64}$/', $assinatura) !== 1) {
        return false;
    }
    if (abs(($agora ?? time()) - (int) $hora) > SEGUNDOS_ASSINATURA_PAULO) {
        return false;
    }
    return hash_equals(assinatura_paulo($hora, $corpo), $assinatura);
}

/**
 * O telefone do WhatsApp na grafia da ficha: DDD + número, com o nono dígito.
 *
 * O WhatsApp entrega `55` + DDD + número, e às vezes sem o 9 — quem nunca
 * reinstalou o aplicativo desde a mudança continua com oito dígitos lá dentro
 * (ver `links_whatsapp()`). A ficha guarda o que a pessoa digitou no site, que
 * é DDD + número. Sem esta conversão o mesmo celular seria duas pessoas.
 *
 * Fixo (10 dígitos que não começam por 6–9 depois do DDD) fica como está.
 * Devolve '' para o que não é telefone do Brasil.
 */
function telefone_canonico(string $bruto): string
{
    $d = so_digitos($bruto);
    if ((strlen($d) === 12 || strlen($d) === 13) && str_starts_with($d, '55')) {
        $d = substr($d, 2);
    }
    if (strlen($d) === 10 && preg_match('/^\d{2}[6-9]/', $d) === 1) {
        $d = substr($d, 0, 2) . '9' . substr($d, 2);
    }
    return strlen($d) === 10 || strlen($d) === 11 ? $d : '';
}

/** A ficha deste WhatsApp, comparando as duas pontas na mesma grafia. */
function pessoa_do_whatsapp(string $telefone): ?array
{
    $alvo = telefone_canonico($telefone);
    if ($alvo === '') {
        return null;
    }
    foreach (ler_pessoas() as $p) {
        if ($p['telefone'] !== '' && telefone_canonico($p['telefone']) === $alvo) {
            return $p;
        }
    }
    return null;
}

/**
 * O que o Paulo pode saber de quem está conversando com ele — e só isso.
 *
 * Nenhum nome de terceiro, nenhum telefone, nada da ficha que a própria pessoa
 * não tenha dito: o status da inscrição, o degrau, onde ela atua e o interesse
 * que ainda espera virar unidade.
 */
function situacao_para_o_paulo(?array $p): array
{
    if ($p === null) {
        return ['conhecida' => false];
    }
    require_once __DIR__ . '/escada-comum.php';
    $degrau = degraus_de_hoje()[$p['id']] ?? 0;
    return [
        'conhecida' => true,
        'status'    => $p['status'],
        'temConta'  => tem_conta($p),
        'degrau'    => $degrau,
        'degrauNome' => $degrau > 0 ? DEGRAUS[$degrau]['nome'] : '',
        'unidades'  => array_map(fn ($v) => ['id' => $v['id'], 'tipo' => $v['tipo'], 'nome' => $v['rotulo'], 'papel' => $v['papel']], vinculos_da_pessoa($p['id'])),
        'interesse' => $p['interesse'],
    ];
}
