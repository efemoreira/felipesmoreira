<?php
declare(strict_types=1);

/**
 * O que se pergunta sobre uma pessoa depois que ela existe.
 *
 * O registro em si mora no `sessao.php` (é ele que autentica, e pôr o modelo
 * fora dele criaria include circular). Aqui ficam as respostas que só fazem
 * sentido cruzando pessoa com o resto: em que encontros ela esteve, quem está
 * duplicado, quem está esperando aprovação.
 */

require_once __DIR__ . '/sessao.php';

/**
 * Duas fichas que parecem a mesma pessoa.
 *
 * Duas regras, e as duas erram para o lado de mostrar demais — é uma SUGESTÃO
 * que um humano confere, não uma fusão automática. Juntar sozinho o cadastro
 * errado é perder o histórico de alguém, e isso não tem desfazer:
 *
 *   1. **mesmo telefone** — quase sempre é a mesma pessoa, mas não sempre: casa
 *      que divide celular tem duas, e por isso não se funde no automático;
 *   2. **mesmo nome**, sem acento e sem caixa — "José da Silva" e "Jose Da
 *      Silva" digitados em momentos diferentes.
 *
 * Devolve pares [a, b] com o motivo, cada par uma vez só.
 */
function duplicatas_de_pessoas(): array
{
    $pessoas = ler_pessoas();
    $pares = [];
    $vistos = [];

    $anotar = function (array $a, array $b, string $motivo) use (&$pares, &$vistos) {
        $chave = $a['id'] < $b['id'] ? $a['id'] . '|' . $b['id'] : $b['id'] . '|' . $a['id'];
        if (isset($vistos[$chave])) {
            return;
        }
        $vistos[$chave] = true;
        $pares[] = ['a' => $a, 'b' => $b, 'motivo' => $motivo];
    };

    $porTelefone = [];
    $porNome = [];
    foreach ($pessoas as $p) {
        if ($p['telefone'] !== '') {
            $porTelefone[$p['telefone']][] = $p;
        }
        $porNome[mb_strtolower(sem_acento($p['nome']))][] = $p;
    }

    foreach ($porTelefone as $lista) {
        for ($i = 0; $i < count($lista); $i++) {
            for ($j = $i + 1; $j < count($lista); $j++) {
                $anotar($lista[$i], $lista[$j], 'mesmo telefone');
            }
        }
    }
    foreach ($porNome as $lista) {
        for ($i = 0; $i < count($lista); $i++) {
            for ($j = $i + 1; $j < count($lista); $j++) {
                $anotar($lista[$i], $lista[$j], 'mesmo nome');
            }
        }
    }
    return $pares;
}

/**
 * Junta duas fichas: `$manter` fica, `$sumir` é absorvida e apagada.
 *
 * Campo vazio de quem fica é preenchido por quem some — a ficha do encontro
 * costuma ter bairro e cidade que a inscrição não tinha, e o contrário também.
 * O que quem fica já tem preenchido **não é sobrescrito**: quem decidiu manter
 * aquela ficha decidiu que ela é a boa.
 *
 * As presenças em encontro passam para quem fica; se as duas estiveram no mesmo
 * encontro, sobra uma, com o "melhor" dos dois estados (compareceu ganha de
 * confirmou, que ganha de convidado) — perder uma presença de verdade seria
 * pior que manter uma a mais.
 */
function juntar_pessoas(string $idManter, string $idSumir): bool
{
    if ($idManter === $idSumir || $idManter === '' || $idSumir === '') {
        return false;
    }
    $manter = achar_pessoa($idManter);
    $sumir  = achar_pessoa($idSumir);
    if ($manter === null || $sumir === null) {
        return false;
    }
    /* Conta nunca se funde: senha e login são de uma pessoa só, e escolher qual
       das duas contas sobrevive é decisão que ninguém deveria tomar por
       inferência. Quem quiser juntar duas contas apaga uma na mão, antes. */
    if (tem_conta($manter) && tem_conta($sumir)) {
        return false;
    }

    foreach (['telefone', 'email', 'cidade', 'bairro', 'observacao',
              'urna', 'cargo', 'numero', 'partido', 'instagram', 'imagem',
              'origem', 'consentimentoEm', 'consentimentoVersao'] as $campo) {
        if ($manter[$campo] === '' && $sumir[$campo] !== '') {
            $manter[$campo] = $sumir[$campo];
        }
    }
    $manter['funcoes'] = array_values(array_unique(array_merge($manter['funcoes'], $sumir['funcoes'])));

    /* A conta e as capacidades vêm junto quando quem some é que as tinha. */
    if (!tem_conta($manter) && tem_conta($sumir)) {
        foreach (['usuario', 'hash', 'ultimoAcesso'] as $campo) {
            $manter[$campo] = $sumir[$campo];
        }
        $manter['ativo'] = $sumir['ativo'];
        $manter['trocarSenha'] = $sumir['trocarSenha'];
        $manter['capacidades'] = $sumir['capacidades'];
        $manter['areas'] = $sumir['areas'];
    }

    /* O tipo mais "forte" vence: quem é candidato numa ficha e eleitor na outra
       é candidato. A ordem da constante é do menos para o mais envolvido. */
    $ordem = array_flip(array_keys(TIPOS_PESSOA));
    if (($ordem[$sumir['tipo']] ?? 0) > ($ordem[$manter['tipo']] ?? 0)) {
        $manter['tipo'] = $sumir['tipo'];
    }

    $pessoas = [];
    foreach (ler_pessoas() as $p) {
        if ($p['id'] === $idSumir) {
            continue;
        }
        $pessoas[] = $p['id'] === $idManter ? $manter : $p;
    }
    if (!gravar_pessoas($pessoas)) {
        return false;
    }

    /* As presenças mudam de dono. Feito depois da gravação: se aqui falhar, o
       pior caso é presença órfã (que a tela ignora), e não pessoa perdida. */
    if (is_file(__DIR__ . '/eventos-comum.php')) {
        require_once __DIR__ . '/eventos-comum.php';
        $presencas = ler_presencas();
        $melhor = [];
        $saida = [];
        foreach ($presencas as $pr) {
            if ($pr['pessoaId'] === $idSumir) {
                $pr['pessoaId'] = $idManter;
            }
            $chave = $pr['pessoaId'] . '|' . $pr['eventoId'];
            if (isset($melhor[$chave])) {
                $i = $melhor[$chave];
                $saida[$i]['confirmou']  = $saida[$i]['confirmou'] || $pr['confirmou'];
                $saida[$i]['compareceu'] = $saida[$i]['compareceu'] || $pr['compareceu'];
                continue;
            }
            $melhor[$chave] = count($saida);
            $saida[] = $pr;
        }
        gravar_presencas($saida);
    }
    return true;
}

/** Quem está esperando a coordenação decidir — a fila de /queroajudar. */
function fila_de_entrada(): array
{
    $fila = array_values(array_filter(ler_pessoas(), fn ($p) => $p['status'] === 'pendente'));
    /* Mais antigo primeiro: é onde mais se perde gente, e quem esperou mais
       tempo é quem está mais perto de desistir. */
    usort($fila, fn ($a, $b) => strcmp($a['criadoEm'], $b['criadoEm']));
    return $fila;
}
