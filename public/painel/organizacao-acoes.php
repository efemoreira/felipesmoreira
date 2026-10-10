<?php
declare(strict_types=1);

/**
 * O lado POST da Organização: núcleos, grupos temáticos e a Liga. Nenhuma
 * linha de HTML aqui.
 *
 * Toda gravação volta para a aba de onde veio — quem registra a entrega de um
 * grupo não quer cair na lista de núcleos.
 */

require_once __DIR__ . '/organizacao-comum.php';
require_once __DIR__ . '/acoes-comum.php';  // avisar(), ir_para(), exigir_token_de_acao()

function voltar_organizacao(string $aba = ''): void
{
    ir_para('/painel/organizacao.php' . ($aba !== '' ? '?aba=' . rawurlencode($aba) : ''));
}

/** Um id de pessoa que existe, ou vazio. Ninguém vira responsável por engano. */
function pessoa_ou_vazio($id): string
{
    $id = limpar_texto($id ?? '', 40);
    return $id !== '' && achar_pessoa($id) !== null ? $id : '';
}

function tratar_acoes_de_organizacao(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    exigir_token_de_acao();

    $acao = (string) ($_POST['acao'] ?? '');

    match ($acao) {
        'nucleo-salvar'  => salvar_nucleo(),
        'grupo-salvar'   => salvar_grupo(),
        'entrega'        => registrar_entrega($eu),
        'encerrar'       => encerrar_unidade(true),
        'reabrir'        => encerrar_unidade(false),
        'pv-salvar'      => salvar_porta_voz(),
        'pv-mes'         => fechar_mes_porta_voz($eu),
        'pv-encerrar'    => encerrar_porta_voz(),
        default          => null,
    };

    avisar('erro', 'Ação desconhecida.');
    voltar_organizacao();
}

/* ---------------------------------------------------------------- núcleos */

function salvar_nucleo(): void
{
    $nucleos = ler_nucleos();
    $id = limpar_texto($_POST['id'] ?? '', 40);
    $antigo = null;
    foreach ($nucleos as $n) {
        if ($n['id'] === $id) {
            $antigo = $n;
        }
    }
    if ($id !== '' && $antigo === null) {
        avisar('erro', 'Núcleo não encontrado.');
        voltar_organizacao();
    }

    $nome = limpar_texto($_POST['nome'] ?? '', 80);
    if ($nome === '') {
        avisar('erro', 'Dê um nome ao núcleo — o bairro, a cidade ou a universidade.');
        voltar_organizacao();
    }
    $cidade = cidade_valida($_POST['cidade'] ?? '');
    if ($cidade === '') {
        avisar('erro', 'Escolha a cidade do núcleo. É ela que liga o núcleo às ondas do território.');
        voltar_organizacao();
    }
    $responsavel = pessoa_ou_vazio($_POST['responsavelId'] ?? '');
    $substituto = pessoa_ou_vazio($_POST['substitutoId'] ?? '');
    if ($substituto !== '' && $substituto === $responsavel) {
        avisar('erro', 'O substituto precisa ser outra pessoa — substituto de si mesmo não substitui ninguém.');
        voltar_organizacao();
    }

    $novo = [
        'id'      => $id !== '' ? $id : novo_id_organizacao('nuc'),
        'nome'    => $nome,
        'tipo'    => (string) ($_POST['tipo'] ?? 'bairro'),
        'cidade'  => $cidade,
        'bairro'  => limpar_texto($_POST['bairro'] ?? '', 60),
        'onda'    => (int) ($_POST['onda'] ?? 0),
        'nivel'   => (string) ($_POST['nivel'] ?? 'T0'),
        'evidencia' => limpar_texto($_POST['evidencia'] ?? '', 200),
        'responsavelId' => $responsavel,
        'substitutoId'  => $substituto,
        'ritmo'   => (string) ($_POST['ritmo'] ?? 'mensal'),
        'proximaData'  => data_iso_ou_vazio($_POST['proximaData'] ?? ''),
        'proximaTexto' => limpar_texto($_POST['proximaTexto'] ?? '', 140),
        'contato'   => contato_publico($_POST['contato'] ?? ''),
        'publicado' => !empty($_POST['publicado']),
    ] + ($antigo ?? ['entregas' => [], 'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'encerradoEm' => '']);
    $novo = carimbar_responsaveis($novo, $antigo);

    $lista = $antigo === null
        ? array_merge($nucleos, [$novo])
        : array_map(fn ($n) => $n['id'] === $novo['id'] ? $novo : $n, $nucleos);
    if (!gravar_nucleos($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao();
    }
    avisar('ok', ($antigo === null ? 'Núcleo criado: ' : 'Núcleo salvo: ') . $nome . '.');
    voltar_organizacao();
}

/* ---------------------------------------------------------------- grupos */

function salvar_grupo(): void
{
    $grupos = ler_grupos();
    $id = limpar_texto($_POST['id'] ?? '', 40);
    $antigo = null;
    foreach ($grupos as $g) {
        if ($g['id'] === $id) {
            $antigo = $g;
        }
    }
    if ($id !== '' && $antigo === null) {
        avisar('erro', 'Grupo não encontrado.');
        voltar_organizacao('temas');
    }

    $tema = (string) ($_POST['tema'] ?? '');
    if (!isset(TEMAS_GRUPO[$tema])) {
        avisar('erro', 'Escolha o tema no catálogo. Tema fora do catálogo é o primeiro passo para dois grupos sobre a mesma coisa.');
        voltar_organizacao('temas');
    }
    /* UM TEMA, UM GRUPO — a regra do plano, e a razão de o tema ser lista. */
    if (($outro = grupo_aberto_do_tema($tema, $grupos, $id)) !== null) {
        avisar('erro', 'Já existe um grupo aberto de ' . TEMAS_GRUPO[$tema]['nome'] . '. Um tema, um grupo: quem chega entra por uma das portas dele.');
        voltar_organizacao('temas');
    }

    /* As perguntas de antes de abrir. Sem elas, diz o plano, "o tema fica no
       catálogo como prioridade futura" — e é exatamente o que a recusa faz. */
    $finalidade = limpar_texto($_POST['finalidade'] ?? '', 200);
    $primeira = limpar_texto($_POST['primeiraEntrega'] ?? '', 140);
    $primeiraAte = data_iso_ou_vazio($_POST['primeiraEntregaAte'] ?? '');
    $responsavel = pessoa_ou_vazio($_POST['responsavelId'] ?? '');
    $faltam = [];
    if ($finalidade === '') {
        $faltam[] = 'a finalidade';
    }
    if ($responsavel === '') {
        $faltam[] = 'o responsável';
    }
    if ($primeira === '' || $primeiraAte === '') {
        $faltam[] = 'a primeira entrega e o prazo dela';
    }
    if ($faltam !== []) {
        avisar('erro', 'Antes de abrir um grupo, responda: ' . implode(', ', $faltam) . '. Sem isso o tema fica no catálogo como prioridade futura.');
        voltar_organizacao('temas');
    }
    $substituto = pessoa_ou_vazio($_POST['substitutoId'] ?? '');
    if ($substituto !== '' && $substituto === $responsavel) {
        avisar('erro', 'O substituto precisa ser outra pessoa — substituto de si mesmo não substitui ninguém.');
        voltar_organizacao('temas');
    }

    $idsNucleos = array_column(ler_nucleos(), 'id');
    $novo = [
        'id'    => $id !== '' ? $id : novo_id_organizacao('grp'),
        'tema'  => $tema,
        'finalidade' => $finalidade,
        'primeiraEntrega' => $primeira,
        'primeiraEntregaAte' => $primeiraAte,
        'maturidade' => (int) ($_POST['maturidade'] ?? 0),
        'evidencia'  => limpar_texto($_POST['evidencia'] ?? '', 200),
        'portaEstudo'        => limpar_texto($_POST['portaEstudo'] ?? '', 200),
        'portaProfissionais' => limpar_texto($_POST['portaProfissionais'] ?? '', 200),
        'portaMovimento'     => limpar_texto($_POST['portaMovimento'] ?? '', 200),
        'nucleos'    => array_values(array_intersect((array) ($_POST['nucleos'] ?? []), $idsNucleos)),
        'portaVozId' => limpar_texto($_POST['portaVozId'] ?? '', 40),
        'responsavelId' => $responsavel,
        'substitutoId'  => $substituto,
        'ritmo'   => (string) ($_POST['ritmo'] ?? 'mensal'),
        'proximaData'  => data_iso_ou_vazio($_POST['proximaData'] ?? ''),
        'proximaTexto' => limpar_texto($_POST['proximaTexto'] ?? '', 140),
        'contato'   => contato_publico($_POST['contato'] ?? ''),
        'publicado' => !empty($_POST['publicado']),
    ] + ($antigo ?? ['entregas' => [], 'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'encerradoEm' => '']);
    $novo = carimbar_responsaveis($novo, $antigo);

    $lista = $antigo === null
        ? array_merge($grupos, [$novo])
        : array_map(fn ($g) => $g['id'] === $novo['id'] ? $novo : $g, $grupos);
    if (!gravar_grupos($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('temas');
    }

    $abertos = count(so_abertas(ler_grupos()));
    $aviso = $antigo === null && $abertos > TETO_TEMAS_ABERTOS
        ? ' São ' . $abertos . ' grupos abertos — o plano pediu começar com no máximo ' . TETO_TEMAS_ABERTOS . '.'
        : '';
    avisar('ok', ($antigo === null ? 'Grupo aberto: ' : 'Grupo salvo: ') . TEMAS_GRUPO[$tema]['nome'] . '.' . $aviso);
    voltar_organizacao('temas');
}

/* ------------------------------------------------------ comum às unidades */

/** [lista, gravar, aba] do tipo pedido no POST. */
function unidades_do_tipo(string $tipo): array
{
    return $tipo === 'grupo'
        ? [ler_grupos(), 'gravar_grupos', 'temas']
        : [ler_nucleos(), 'gravar_nucleos', ''];
}

function registrar_entrega(array $eu): void
{
    $tipo = (string) ($_POST['tipo'] ?? '');
    [$lista, $gravar, $aba] = unidades_do_tipo($tipo);
    $id = limpar_texto($_POST['id'] ?? '', 40);

    $texto = limpar_texto($_POST['texto'] ?? '', 200);
    $data = data_iso_ou_vazio($_POST['data'] ?? '');
    if ($texto === '' || $data === '') {
        avisar('erro', 'Diga o que foi entregue e quando. Entrega sem data não conta no ciclo.');
        voltar_organizacao($aba);
    }
    if ($data > hoje_ce()) {
        avisar('erro', 'Entrega é o que já aconteceu. O que vem é a próxima atividade.');
        voltar_organizacao($aba);
    }

    $achou = false;
    foreach ($lista as &$u) {
        if ($u['id'] !== $id) {
            continue;
        }
        $achou = true;
        $u['entregas'][] = [
            'id'      => novo_id_organizacao('ent'),
            'data'    => $data,
            'texto'   => $texto,
            'pessoas' => (int) ($_POST['pessoas'] ?? 0),
            'porId'   => (string) ($eu['id'] ?? ''),
            'em'      => date('c'),
        ];
        /* A próxima vem no mesmo formulário: "registrou ao menos uma entrega e
           tem plano para o próximo" são as duas metades de ficar ativo. */
        $proxima = data_iso_ou_vazio($_POST['proximaData'] ?? '');
        if ($proxima !== '') {
            $u['proximaData'] = $proxima;
            $u['proximaTexto'] = limpar_texto($_POST['proximaTexto'] ?? '', 140);
        }
    }
    unset($u);
    if (!$achou) {
        avisar('erro', 'Não achei de quem é esta entrega.');
        voltar_organizacao($aba);
    }
    if (!$gravar($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao($aba);
    }
    avisar('ok', 'Entrega registrada.');
    voltar_organizacao($aba);
}

/**
 * Encerrar não é fracasso — "projetos podem acabar sem que isso seja
 * fracasso". É por isso que encerra e não apaga: a unidade sai das contas de
 * ativo e da página pública, e o que ela entregou continua contado na escada
 * de quem trabalhou nela.
 */
function encerrar_unidade(bool $encerrar): void
{
    $tipo = (string) ($_POST['tipo'] ?? '');
    [$lista, $gravar, $aba] = unidades_do_tipo($tipo);
    $id = limpar_texto($_POST['id'] ?? '', 40);

    $alvo = null;
    foreach ($lista as $u) {
        if ($u['id'] === $id) {
            $alvo = $u;
        }
    }
    if ($alvo === null) {
        avisar('erro', 'Não encontrado.');
        voltar_organizacao($aba);
    }
    /* Reabrir um grupo esbarra na mesma regra de abrir: um tema, um grupo. */
    if (!$encerrar && $tipo === 'grupo' && grupo_aberto_do_tema($alvo['tema'], $lista, $id) !== null) {
        avisar('erro', 'Já existe outro grupo aberto deste tema. Encerre um antes de reabrir o outro.');
        voltar_organizacao($aba);
    }

    $lista = array_map(function ($u) use ($id, $encerrar) {
        if ($u['id'] === $id) {
            $u['encerradoEm'] = $encerrar ? date('c') : '';
        }
        return $u;
    }, $lista);
    if (!$gravar($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao($aba);
    }
    avisar('ok', $encerrar ? 'Encerrado. Sai das contas e do site; o que entregou continua contado.' : 'Reaberto.');
    voltar_organizacao($aba);
}

/* ---------------------------------------------------------------- Liga */

function salvar_porta_voz(): void
{
    $liga = ler_liga();
    $id = limpar_texto($_POST['id'] ?? '', 40);
    $antigo = null;
    foreach ($liga as $pv) {
        if ($pv['id'] === $id) {
            $antigo = $pv;
        }
    }
    if ($id !== '' && $antigo === null) {
        avisar('erro', 'Porta-voz não encontrado.');
        voltar_organizacao('liga');
    }

    $pessoaId = pessoa_ou_vazio($_POST['pessoaId'] ?? '');
    $nome = limpar_texto($_POST['nome'] ?? '', 80);
    if ($nome === '' && $pessoaId !== '') {
        $nome = (string) (achar_pessoa($pessoaId)['nome'] ?? '');
    }
    if ($nome === '') {
        avisar('erro', 'Diga o nome público do porta-voz — o que ele usa nas redes.');
        voltar_organizacao('liga');
    }
    /* A mesma pessoa duas vezes na Liga é placar contado duas vezes. */
    if ($pessoaId !== '') {
        foreach ($liga as $pv) {
            if ($pv['pessoaId'] === $pessoaId && $pv['id'] !== $id && $pv['encerradoEm'] === '') {
                avisar('erro', 'Esta pessoa já está na Liga como ' . $pv['nome'] . '.');
                voltar_organizacao('liga');
            }
        }
    }

    $perfis = [];
    foreach (array_keys(REDES_LIGA) as $r) {
        $perfis[$r] = (string) ($_POST['perfis'][$r] ?? '');
    }

    /* AS COMPROVAÇÕES: cada caixa marcada guarda a data em que foi marcada
       pela primeira vez; desmarcar apaga. A data é o que diz há quanto tempo
       a pessoa está naquele degrau. */
    $comprova = function (string $campo) use ($antigo): string {
        if (empty($_POST[$campo])) {
            return '';
        }
        return ($antigo[$campo] ?? '') !== '' ? $antigo[$campo] : hoje_ce();
    };

    $acaoEm = $comprova('acaoEm');
    $acaoTexto = limpar_texto($_POST['acaoTexto'] ?? '', 160);
    if ($acaoEm !== '' && $acaoTexto === '') {
        avisar('erro', 'Ação local precisa de registro: o que foi, onde e quantas pessoas.');
        voltar_organizacao('liga');
    }

    $novo = [
        'id'       => $id !== '' ? $id : novo_id_organizacao('pv'),
        'pessoaId' => $pessoaId,
        'nome'     => $nome,
        'tema'     => (string) ($_POST['tema'] ?? ''),
        'cidade'   => cidade_valida($_POST['cidade'] ?? ''),
        'bairro'   => limpar_texto($_POST['bairro'] ?? '', 60),
        'perfis'   => $perfis,
        'redesEm'    => $comprova('redesEm'),
        'formacaoEm' => $comprova('formacaoEm'),
        'acaoEm'     => $acaoEm,
        'acaoTexto'  => $acaoTexto,
        'publicado'  => !empty($_POST['publicado']),
    ] + ($antigo ?? ['meses' => [], 'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'encerradoEm' => '']);

    $lista = $antigo === null
        ? array_merge($liga, [$novo])
        : array_map(fn ($pv) => $pv['id'] === $novo['id'] ? $novo : $pv, $liga);
    if (!gravar_liga($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('liga');
    }
    avisar('ok', ($antigo === null ? 'Na Liga: ' : 'Ficha salva: ') . $nome . '.');
    voltar_organizacao('liga');
}

function fechar_mes_porta_voz(array $eu): void
{
    $liga = ler_liga();
    $id = limpar_texto($_POST['id'] ?? '', 40);
    $mes = mes_valido($_POST['mes'] ?? '');
    if ($mes === '') {
        avisar('erro', 'Diga de que mês é o fechamento.');
        voltar_organizacao('liga');
    }
    if ($mes > substr(hoje_ce(), 0, 7)) {
        avisar('erro', 'Mês que ainda não chegou não fecha.');
        voltar_organizacao('liga');
    }

    $redes = [];
    foreach (array_keys(REDES_LIGA) as $r) {
        $redes[$r] = (int) preg_replace('/\D/', '', (string) ($_POST['redes'][$r] ?? '0'));
    }

    $achou = false;
    foreach ($liga as &$pv) {
        if ($pv['id'] !== $id) {
            continue;
        }
        $achou = true;
        /* Um por mês: fechar de novo o mesmo mês corrige, não duplica. */
        $pv['meses'] = array_values(array_filter($pv['meses'], fn ($m) => $m['mes'] !== $mes));
        $pv['meses'][] = [
            'mes'   => $mes,
            'redes' => $redes,
            'engajamento'     => (string) ($_POST['engajamento'] ?? '0'),
            'semanasSeguidas' => (int) ($_POST['semanasSeguidas'] ?? 0),
            'todasSemanas'    => !empty($_POST['todasSemanas']),
            'acoes'   => (int) ($_POST['acoes'] ?? 0),
            'modulos' => (int) ($_POST['modulos'] ?? 0),
            'lives'   => (int) ($_POST['lives'] ?? 0),
            'em'      => date('c'),
            'por'     => (string) ($eu['nome'] ?? ''),
        ];
    }
    unset($pv);
    if (!$achou) {
        avisar('erro', 'Porta-voz não encontrado.');
        voltar_organizacao('liga');
    }
    if (!gravar_liga($liga)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('liga');
    }
    avisar('ok', 'Mês fechado.');
    voltar_organizacao('liga');
}

/**
 * Sair da Liga encerra, e não apaga: o motivo fica. "Seguidor ou engajamento
 * comprado elimina da Liga" — e eliminado com motivo escrito é o que impede a
 * mesma pessoa de voltar no mês seguinte sem ninguém lembrar por quê.
 */
function encerrar_porta_voz(): void
{
    $liga = ler_liga();
    $id = limpar_texto($_POST['id'] ?? '', 40);
    $motivo = limpar_texto($_POST['motivo'] ?? '', 120);
    $achou = false;
    foreach ($liga as &$pv) {
        if ($pv['id'] === $id) {
            $achou = true;
            $pv['encerradoEm'] = date('c');
            $pv['encerradoMotivo'] = $motivo;
            $pv['publicado'] = false;
        }
    }
    unset($pv);
    if (!$achou) {
        avisar('erro', 'Porta-voz não encontrado.');
        voltar_organizacao('liga');
    }
    if (!gravar_liga($liga)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('liga');
    }
    avisar('ok', 'Saiu da Liga. Sai também do site.');
    voltar_organizacao('liga');
}
