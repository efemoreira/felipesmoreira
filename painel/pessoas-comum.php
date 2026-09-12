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
              'origem', 'consentimentoEm', 'consentimentoVersao', 'lider'] as $campo) {
        if ($manter[$campo] === '' && $sumir[$campo] !== '') {
            $manter[$campo] = $sumir[$campo];
        }
    }
    $manter['funcoes'] = array_values(array_unique(array_merge($manter['funcoes'], $sumir['funcoes'])));
    /* As redes SOMAM, como as funções: um advogado que também é professor não
       deixa de ser nenhum dos dois porque a ficha duplicada foi juntada. */
    $manter['redes'] = array_values(array_unique(array_merge($manter['redes'], $sumir['redes'])));

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

/* ===================== quem acompanha quem ===================== */

/**
 * Esta pessoa pode ver a lista de quem acompanha?
 *
 * DUAS CHAVES, DE PROPÓSITO. Uma é o campo `lider` nas fichas — quem organiza
 * os times; a outra é esta capacidade — quem decide que aquela pessoa pode ver
 * dado pessoal. Enquanto `pessoas` estiver só em `adm` porque "acesso a dado
 * pessoal acompanha a responsabilidade", abrir uma segunda porta como efeito
 * lateral de preencher um campo numa ficha seria furar a mesma regra por baixo.
 */
function pode_liderar(array $p): bool
{
    return array_intersect(['lideranca', 'coordenacao', 'adm'], $p['capacidades']) !== [];
}

/**
 * A GENTE DESTA PESSOA — e a única porta para ela.
 *
 * `pessoas` está só em `adm` **de propósito** (ver `sessao.php`): acesso a dado
 * pessoal não acompanha o trabalho do dia, acompanha a responsabilidade sobre
 * ele. Um líder que enxergasse a lista inteira para acompanhar oito pessoas
 * furaria essa regra sem ninguém decidir isso.
 *
 * Por isso a função **não aceita parâmetro que amplie o recorte**. Quem chama
 * não escolhe de quem é a lista: ela é sempre de quem está chamando. Uma
 * assinatura com `$de` acabaria, na terceira tela, recebendo `$_GET['de']`.
 *
 * Ordena por quem está mais parada primeiro — a lista é de trabalho, e o
 * trabalho é justamente quem não deu sinal.
 */
function minha_gente(array $eu): array
{
    if ($eu['id'] === '') {
        return [];
    }
    $gente = array_values(array_filter(
        ler_pessoas(),
        fn ($p) => $p['lider'] === $eu['id'] && $p['id'] !== $eu['id']
    ));
    usort($gente, fn ($a, $b) => [$a['ultimoAcesso'], $a['nome']] <=> [$b['ultimoAcesso'], $b['nome']]);
    return $gente;
}

/**
 * Quem acompanha esta pessoa, ou `null`.
 *
 * Devolve a ficha inteira porque quem chama precisa do telefone para abrir o
 * WhatsApp — é essa linha, no Início de quem chegou, que responde ao "entrei
 * num grupo gigante e não me senti parte" melhor do que qualquer tela nova.
 */
function lider_de(array $pessoa): ?array
{
    return $pessoa['lider'] === '' ? null : achar_pessoa($pessoa['lider']);
}

/** Quem pode ser líder: só quem tem conta ativa e a capacidade de liderar. */
function possiveis_lideres(): array
{
    /* O filtro é escrito aqui, e não com `pessoas_ativas()`: aquela mora em
       `eventos-comum.php`, que INCLUI este arquivo. Chamá-la daqui amarraria a
       ficha de pessoa à máquina de encontros e quebraria em qualquer tela que
       carregue só uma das duas. */
    $lista = array_values(array_filter(
        ler_pessoas(),
        fn ($p) => $p['ativo'] && tem_conta($p) && (
            in_array('lideranca', $p['capacidades'], true)
            || in_array('coordenacao', $p['capacidades'], true)
            || in_array('adm', $p['capacidades'], true)
        )
    ));
    usort($lista, fn ($a, $b) => strcmp($a['nome'], $b['nome']));
    return $lista;
}

/* ===================== o que esta área diz ao Início ===================== */

/**
 * O que está esperando por esta pessoa em `pessoas` — a fila do Início e o selo do menu.
 *
 * Chamada por `tarefas_de()` (agora.php) para quem abre a área; o formato de
 * cada item está documentado lá. Registrar aqui, e não numa cadeia de `if` no
 * agora.php, é o que faz uma área nova entrar na fila sem tocar o hub.
 */
function pendencias_pessoas(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $tarefas = [];

        /* ---------- Pessoas: quem esfriou e ainda dá para chamar ----------
           Vem depois das filas de decisão de propósito: não é urgente, e não tem
           prazo do manual vencendo. É a tarefa que some da semana sem ninguém
           notar — e é justamente por isso que ela precisa estar na lista, e não
           na memória de quem coordena. */
        require_once __DIR__ . '/reativacao.php';
        $esfriaram = quantas_para_reativar();
        if ($esfriaram > 0) {
            $tarefas[] = [
                'area'    => 'pessoas',
                'icone'   => 'users',
                'urgente' => false,
                'quantos' => $esfriaram,
                'texto'   => $esfriaram === 1
                    ? 'Chamar de volta 1 pessoa que esfriou'
                    : "Chamar de volta {$esfriaram} pessoas que esfriaram",
                'porque'  => 'já disseram sim uma vez — quem já veio custa uma mensagem, e um inscrito novo custa um encontro inteiro',
                'url'     => '/painel/pessoas.php?tipo=reativar#reativar',
            ];
        }

    return $tarefas;
}

/**
 * O que está esperando por esta pessoa em `gente` — a fila do Início e o selo do menu.
 *
 * Chamada por `tarefas_de()` (agora.php) para quem abre a área; o formato de
 * cada item está documentado lá. Registrar aqui, e não numa cadeia de `if` no
 * agora.php, é o que faz uma área nova entrar na fila sem tocar o hub.
 */
function pendencias_gente(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $tarefas = [];

        /* ---------- Sua gente: quem está sob esta pessoa e esfriou ----------
           A mesma régua da reativação, no recorte de quem lidera. É a tarefa que
           faz "acompanhar alguém" ser trabalho com número, e não intenção: sem
           ela, a líder só descobre que alguém sumiu quando a coordenação
           pergunta. `area` é 'gente' — não é área de AREAS, é o nome do item
           solto do menu, e é o que dá o selo a ele. */
        require_once __DIR__ . '/pessoas-comum.php';
        require_once __DIR__ . '/reativacao.php';
        $minhaEsfriando = count(array_filter(minha_gente($u), fn ($p) => motivo_de_reativacao($p) !== null));
        if ($minhaEsfriando > 0) {
            $tarefas[] = [
                'area'    => 'gente',
                'icone'   => 'users',
                'urgente' => false,
                'quantos' => $minhaEsfriando,
                'texto'   => $minhaEsfriando === 1
                    ? '1 pessoa da sua gente esfriou'
                    : "{$minhaEsfriando} pessoas da sua gente esfriaram",
                'porque'  => 'você é o primeiro nome que elas veem — uma mensagem sua vale mais que um aviso no grupo',
                'url'     => '/painel/gente.php?tipo=esfriando',
            ];
        }

    return $tarefas;
}
