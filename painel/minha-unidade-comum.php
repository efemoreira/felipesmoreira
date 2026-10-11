<?php
declare(strict_types=1);

/**
 * MEU LUGAR — o núcleo e o grupo de cada um, e o que cabe a quem responde por
 * eles.
 *
 * O plano de 2026–2027 pede "acesso interno por função: cada pessoa vê seus
 * grupos, documentos e tarefas; coordenadores com ferramentas extras para suas
 * unidades". A área Organização é da coordenação e enxerga tudo; isto aqui é o
 * recorte de UMA pessoa:
 *
 *   - quem FAZ PARTE de uma unidade (`unidades` na ficha) a vê no Início, com a
 *     próxima atividade e quem responde;
 *   - quem RESPONDE por ela (responsável ou substituto) cuida dela em
 *     `/painel/minha-unidade.php` — registrar, marcar a próxima, chamar gente,
 *     combinar tarefa — sem precisar da capacidade Coordenação.
 *
 * Dado pessoal segue a régua da casa: quem responde vê o NOME de quem quer
 * entrar, encoberto ("Ana S."), e o telefone continua sendo da coordenação
 * (`pode_ver_telefone()`).
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/organizacao-comum.php';
require_once __DIR__ . '/escada-comum.php';
require_once __DIR__ . '/privacidade.php';  // nome_encoberto()

/** Todas as unidades abertas, núcleos e grupos juntos. */
function unidades_abertas(): array
{
    return so_abertas(todas_as_unidades());
}

/** Esta pessoa responde por esta unidade? (responsável ou substituto) */
function responde_por(array $u, array $unidade): bool
{
    return $u['id'] !== '' && in_array($u['id'], [$unidade['responsavelId'], $unidade['substitutoId']], true);
}

/** Pode cuidar da unidade: quem responde por ela, ou quem abre a Organização. */
function pode_cuidar(array $u, array $unidade): bool
{
    return responde_por($u, $unidade) || pode('organizacao');
}

/** As unidades abertas por que esta pessoa responde. */
function unidades_de_que_cuida(array $u): array
{
    return array_values(array_filter(unidades_abertas(), fn ($x) => responde_por($u, $x)));
}

/**
 * O Meu lugar desta pessoa: o degrau na escada e as unidades dela (as de que
 * faz parte e as por que responde), sem repetir.
 */
function meu_lugar_de(array $u): array
{
    $pessoa = achar_pessoa($u['id']) ?? $u;
    $minhas = [];
    foreach (unidades_abertas() as $x) {
        if (in_array($x['id'], $pessoa['unidades'] ?? [], true) || responde_por($u, $x)) {
            $minhas[] = $x;
        }
    }
    $degrau = degraus_de_hoje()[$u['id']] ?? 1;
    return ['degrau' => max(1, $degrau), 'unidades' => $minhas];
}


/**
 * Quem quer entrar nesta unidade e ainda não está nela: inscrição com o
 * interesse apontando para ela (direto, ou pelo tema do grupo).
 */
function interessados_em(array $unidade): array
{
    return array_values(array_filter(ler_pessoas(), function ($p) use ($unidade) {
        if ($p['interesse'] === '' || $p['status'] === 'recusada' || in_array($unidade['id'], $p['unidades'], true)) {
            return false;
        }
        $alvo = unidade_do_interesse($p['interesse']);
        return $alvo !== null && $alvo['id'] === $unidade['id'];
    }));
}

/**
 * O que espera por quem responde por uma unidade. Item solto do Início (como
 * `gente` e `tarefas`): qualquer conta pode responder por um núcleo.
 *
 * Quem abre a Organização já recebe tudo isso de todas as unidades
 * (`pendencias_organizacao()`); para ela, aqui não repete.
 */
function pendencias_minhaunidade(array $u): array
{
    if (pode('organizacao')) {
        return [];
    }
    $cuidadas = unidades_de_que_cuida($u);
    if ($cuidadas === []) {
        return [];
    }
    $url = fn ($x) => '/painel/minha-unidade.php?u=' . rawurlencode($x['id']);
    $itens = pendencias_de_ritmo($cuidadas, 'minhaunidade', $url);

    foreach ($cuidadas as $x) {
        $nome = nome_da_unidade($x);
        if (proxima_efetiva($x) === null) {
            $itens[] = [
                'area' => 'minhaunidade', 'icone' => 'calendar', 'urgente' => false,
                'texto' => 'Marcar a próxima atividade d' . mb_strtolower(mb_substr($nome, 0, 2)) . mb_substr($nome, 2),
                'porque' => 'sem próxima marcada, a unidade conta como parada',
                'url' => $url($x),
            ];
        }
        /* O ACOLHIMENTO EM 72 HORAS, do lado de quem vai receber a pessoa. */
        require_once __DIR__ . '/inscricoes-comum.php';
        foreach (interessados_em($x) as $p) {
            if ($p['status'] !== 'pendente') {
                continue;
            }
            $horas = horas_na_fila($p);
            $itens[] = [
                'area' => 'minhaunidade', 'icone' => 'users', 'urgente' => $horas >= HORAS_LIMITE_INSCRICAO,
                'texto' => nome_encoberto($p['nome']) . ' quer entrar ' . match (tipo_da_unidade($x)) { 'grupo' => 'no grupo', 'cultura' => 'no grupo cultural', default => 'no núcleo' },
                'porque' => 'acolher em até 72h — o contato vem pela coordenação',
                'url' => $url($x),
            ];
        }
    }
    return $itens;
}
