<?php
declare(strict_types=1);

/**
 * O lado POST da Organização: núcleos, grupos temáticos e a Liga. Nenhuma
 * linha de HTML aqui.
 *
 * SALVAR MEXE SÓ NO QUE VEIO. A tela não tem um formulário gigante por
 * unidade — tem formulários curtos, um por decisão ("marcar a próxima",
 * "trocar o responsável", "a ficha"). Cada um manda só os seus campos, e o
 * resto da unidade fica como estava. É o que deixa a tela ser pequena sem a
 * gravação apagar o que o formulário não mostrou. Caixa de marcar manda um
 * `hidden` com 0 antes dela, para "desmarcado" chegar como resposta e não como
 * ausência.
 *
 * Toda gravação volta para a aba de onde veio — quem registra a entrega de um
 * grupo não quer cair na lista de núcleos.
 */

require_once __DIR__ . '/organizacao-comum.php';
require_once __DIR__ . '/acoes-comum.php';  // avisar(), ir_para(), exigir_token_de_acao()

function voltar_organizacao(string $aba = ''): never
{
    ir_para('/painel/organizacao.php' . ($aba !== '' ? '?aba=' . rawurlencode($aba) : ''));
}

/** Um id de pessoa que existe, ou vazio. Ninguém vira responsável por engano. */
function pessoa_ou_vazio($id): string
{
    $id = limpar_texto($id ?? '', 40);
    return $id !== '' && achar_pessoa($id) !== null ? $id : '';
}

/**
 * Aplica sobre `$base` só os campos que vieram no POST, cada um pela sua régua.
 * `$campos` é `nome => fn(bruto) => valor`.
 */
function mesclar_post(array $base, array $campos): array
{
    foreach ($campos as $nome => $limpar) {
        if (array_key_exists($nome, $_POST)) {
            $base[$nome] = $limpar($_POST[$nome]);
        }
    }
    return $base;
}

/** As réguas de campo que núcleo e grupo dividem. */
function campos_de_unidade(): array
{
    return [
        'responsavelId' => fn ($v) => pessoa_ou_vazio($v),
        'substitutoId'  => fn ($v) => pessoa_ou_vazio($v),
        'ritmo'         => fn ($v) => (string) $v,
        'proximaData'   => fn ($v) => data_iso_ou_vazio($v),
        'proximaTexto'  => fn ($v) => limpar_texto($v, 140),
        'contato'       => fn ($v) => contato_publico($v),
        'publicado'     => fn ($v) => !empty($v),
        'evidencia'     => fn ($v) => limpar_texto($v, 200),
    ];
}

function tratar_acoes_de_organizacao(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    exigir_token_de_acao();

    match ((string) ($_POST['acao'] ?? '')) {
        'nucleo-salvar'  => salvar_nucleo(),
        'grupo-salvar'   => salvar_grupo(),
        'entrega'        => registrar_entrega($eu),
        'encerrar'       => encerrar_unidade(true),
        'reabrir'        => encerrar_unidade(false),
        'pv-salvar'      => salvar_porta_voz(),
        'pv-comprovar'   => comprovar_porta_voz(),
        'pv-mes'         => fechar_mes_porta_voz($eu),
        'pv-encerrar'    => encerrar_porta_voz(),
        default          => null,
    };

    avisar('erro', 'Ação desconhecida.');
    voltar_organizacao();
}

/** Acha pelo id; `null` quando o id veio vazio (é criação). Id que não existe volta com erro. */
function achar_para_editar(array $lista, string $aba, string $oQue): ?array
{
    $id = limpar_texto($_POST['id'] ?? '', 40);
    if ($id === '') {
        return null;
    }
    foreach ($lista as $item) {
        if ($item['id'] === $id) {
            return $item;
        }
    }
    avisar('erro', $oQue . ' não encontrado.');
    voltar_organizacao($aba);
}

/** O substituto precisa ser outra pessoa. */
function conferir_substituto(array $u, string $aba): void
{
    if ($u['substitutoId'] !== '' && $u['substitutoId'] === $u['responsavelId']) {
        avisar('erro', 'O substituto precisa ser outra pessoa — substituto de si mesmo não substitui ninguém.');
        voltar_organizacao($aba);
    }
}

/* ---------------------------------------------------------------- núcleos */

function salvar_nucleo(): void
{
    $nucleos = ler_nucleos();
    $antigo = achar_para_editar($nucleos, '', 'Núcleo');

    $base = $antigo ?? [
        'id' => novo_id_organizacao('nuc'), 'nome' => '', 'tipo' => 'bairro', 'cidade' => '', 'bairro' => '',
        'onda' => 0, 'nivel' => 'T0', 'evidencia' => '', 'responsavelId' => '', 'substitutoId' => '',
        'ritmo' => 'mensal', 'proximaData' => '', 'proximaTexto' => '', 'contato' => '', 'publicado' => false,
        'entregas' => [], 'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'encerradoEm' => '',
    ];
    $novo = mesclar_post($base, campos_de_unidade() + [
        'nome'   => fn ($v) => limpar_texto($v, 80),
        'tipo'   => fn ($v) => (string) $v,
        'cidade' => fn ($v) => cidade_valida($v),
        'bairro' => fn ($v) => limpar_texto($v, 60),
        'onda'   => fn ($v) => (int) $v,
        'nivel'  => fn ($v) => (string) $v,
    ]);

    if ($novo['nome'] === '') {
        avisar('erro', 'Dê um nome ao núcleo — o bairro, a cidade ou a universidade.');
        voltar_organizacao();
    }
    if ($novo['cidade'] === '') {
        avisar('erro', 'Escolha a cidade do núcleo. É ela que liga o núcleo às ondas do território.');
        voltar_organizacao();
    }
    conferir_substituto($novo, '');
    $novo = carimbar_responsaveis($novo, $antigo);

    $lista = $antigo === null
        ? array_merge($nucleos, [$novo])
        : array_map(fn ($n) => $n['id'] === $novo['id'] ? $novo : $n, $nucleos);
    if (!gravar_nucleos($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao();
    }
    avisar('ok', ($antigo === null ? 'Núcleo criado: ' : 'Núcleo salvo: ') . $novo['nome'] . '.');
    voltar_organizacao();
}

/* ---------------------------------------------------------------- grupos */

function salvar_grupo(): void
{
    $grupos = ler_grupos();
    $antigo = achar_para_editar($grupos, 'temas', 'Grupo');

    if ($antigo === null) {
        $tema = (string) ($_POST['tema'] ?? '');
        if (!isset(TEMAS_GRUPO[$tema])) {
            avisar('erro', 'Escolha o tema no catálogo. Tema fora do catálogo é o primeiro passo para dois grupos sobre a mesma coisa.');
            voltar_organizacao('temas');
        }
        /* UM TEMA, UM GRUPO — a regra do plano, e a razão de o tema ser lista. */
        if (grupo_aberto_do_tema($tema, $grupos) !== null) {
            avisar('erro', 'Já existe um grupo aberto de ' . TEMAS_GRUPO[$tema]['nome'] . '. Um tema, um grupo: quem chega entra por uma das portas dele.');
            voltar_organizacao('temas');
        }
        $base = [
            'id' => novo_id_organizacao('grp'), 'tema' => $tema, 'finalidade' => '', 'primeiraEntrega' => '',
            'primeiraEntregaAte' => '', 'maturidade' => 1, 'evidencia' => '',
            /* As portas nascem do catálogo: quem abre o grupo responde só as
               perguntas de abrir, e ajusta as portas depois, se quiser. */
            'portaEstudo' => TEMAS_GRUPO[$tema]['estudo'],
            'portaProfissionais' => TEMAS_GRUPO[$tema]['profissionais'],
            'portaMovimento' => TEMAS_GRUPO[$tema]['movimento'],
            'nucleos' => [], 'portaVozId' => '', 'responsavelId' => '', 'substitutoId' => '', 'ritmo' => 'mensal',
            'proximaData' => '', 'proximaTexto' => '', 'contato' => '', 'publicado' => false,
            'entregas' => [], 'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'encerradoEm' => '',
        ];
    } else {
        $base = $antigo;
    }

    $idsNucleos = array_column(ler_nucleos(), 'id');
    $novo = mesclar_post($base, campos_de_unidade() + [
        'finalidade'         => fn ($v) => limpar_texto($v, 200),
        'primeiraEntrega'    => fn ($v) => limpar_texto($v, 140),
        'primeiraEntregaAte' => fn ($v) => data_iso_ou_vazio($v),
        'maturidade'         => fn ($v) => (int) $v,
        'portaEstudo'        => fn ($v) => limpar_texto($v, 200),
        'portaProfissionais' => fn ($v) => limpar_texto($v, 200),
        'portaMovimento'     => fn ($v) => limpar_texto($v, 200),
        'nucleos'            => fn ($v) => array_values(array_intersect((array) $v, $idsNucleos)),
        'portaVozId'         => fn ($v) => limpar_texto($v, 40),
    ]);

    /* As perguntas de antes de abrir. Sem elas, diz o plano, "o tema fica no
       catálogo como prioridade futura" — e é exatamente o que a recusa faz.
       Valem na edição também: grupo não perde a finalidade nem o dono. */
    $faltam = [];
    if ($novo['finalidade'] === '') {
        $faltam[] = 'a finalidade';
    }
    if ($novo['responsavelId'] === '') {
        $faltam[] = 'o responsável';
    }
    if ($novo['primeiraEntrega'] === '' || $novo['primeiraEntregaAte'] === '') {
        $faltam[] = 'a primeira entrega e o prazo dela';
    }
    if ($faltam !== []) {
        avisar('erro', 'Antes de abrir um grupo, responda: ' . implode(', ', $faltam) . '. Sem isso o tema fica no catálogo como prioridade futura.');
        voltar_organizacao('temas');
    }
    conferir_substituto($novo, 'temas');
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
    avisar('ok', ($antigo === null ? 'Grupo aberto: ' : 'Grupo salvo: ') . TEMAS_GRUPO[$novo['tema']]['nome'] . '.' . $aviso);
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
    [$lista, $gravar, $aba] = unidades_do_tipo((string) ($_POST['tipo'] ?? ''));
    $id = limpar_texto($_POST['id'] ?? '', 40);

    $texto = limpar_texto($_POST['texto'] ?? '', 200);
    $data = data_iso_ou_vazio($_POST['data'] ?? '');
    if ($texto === '' || $data === '') {
        avisar('erro', 'Diga o que foi feito e quando. Entrega sem data não conta no ciclo.');
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
    avisar('ok', 'Registrado.');
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
    $antigo = achar_para_editar($liga, 'liga', 'Porta-voz');

    $base = $antigo ?? [
        'id' => novo_id_organizacao('pv'), 'pessoaId' => '', 'nome' => '', 'tema' => '', 'cidade' => '',
        'bairro' => '', 'perfis' => [], 'redesEm' => '', 'formacaoEm' => '', 'acaoEm' => '', 'acaoTexto' => '',
        'publicado' => false, 'meses' => [], 'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'encerradoEm' => '',
    ];
    $novo = mesclar_post($base, [
        'pessoaId'  => fn ($v) => pessoa_ou_vazio($v),
        'nome'      => fn ($v) => limpar_texto($v, 80),
        'tema'      => fn ($v) => (string) $v,
        'cidade'    => fn ($v) => cidade_valida($v),
        'bairro'    => fn ($v) => limpar_texto($v, 60),
        'perfis'    => fn ($v) => array_intersect_key((array) $v, REDES_LIGA),
        'publicado' => fn ($v) => !empty($v),
    ]);
    if ($novo['nome'] === '' && $novo['pessoaId'] !== '') {
        $novo['nome'] = (string) (achar_pessoa($novo['pessoaId'])['nome'] ?? '');
    }
    if ($novo['nome'] === '') {
        avisar('erro', 'Escolha a pessoa ou diga o nome público do porta-voz — o que ele usa nas redes.');
        voltar_organizacao('liga');
    }
    /* A mesma pessoa duas vezes na Liga é placar contado duas vezes. */
    if ($novo['pessoaId'] !== '') {
        foreach ($liga as $pv) {
            if ($pv['pessoaId'] === $novo['pessoaId'] && $pv['id'] !== $novo['id'] && $pv['encerradoEm'] === '') {
                avisar('erro', 'Esta pessoa já está na Liga como ' . $pv['nome'] . '.');
                voltar_organizacao('liga');
            }
        }
    }

    $lista = $antigo === null
        ? array_merge($liga, [$novo])
        : array_map(fn ($pv) => $pv['id'] === $novo['id'] ? $novo : $pv, $liga);
    if (!gravar_liga($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('liga');
    }
    avisar('ok', ($antigo === null ? 'Na Liga: ' : 'Ficha salva: ') . $novo['nome'] . '.');
    voltar_organizacao('liga');
}

/**
 * AS COMPROVAÇÕES, uma de cada vez: redes estruturadas, formação concluída,
 * ação local liderada. Cada uma é um clique da coordenação (a ação local pede
 * também o registro escrito), e guarda a data em que foi validada — é a data
 * que diz há quanto tempo a pessoa está naquele degrau. `valor=0` desfaz.
 */
function comprovar_porta_voz(): void
{
    $campo = (string) ($_POST['campo'] ?? '');
    if (!in_array($campo, ['redesEm', 'formacaoEm', 'acaoEm'], true)) {
        avisar('erro', 'Comprovação desconhecida.');
        voltar_organizacao('liga');
    }
    $liga = ler_liga();
    $alvo = achar_para_editar($liga, 'liga', 'Porta-voz');
    if ($alvo === null) {
        avisar('erro', 'Porta-voz não encontrado.');
        voltar_organizacao('liga');
    }
    $vale = ($_POST['valor'] ?? '1') !== '0';

    if ($campo === 'acaoEm' && $vale) {
        $texto = limpar_texto($_POST['acaoTexto'] ?? '', 160);
        if ($texto === '') {
            avisar('erro', 'Ação local precisa de registro: o que foi, onde e quantas pessoas.');
            voltar_organizacao('liga');
        }
        $alvo['acaoTexto'] = $texto;
    }
    $alvo[$campo] = $vale ? ($alvo[$campo] !== '' ? $alvo[$campo] : hoje_ce()) : '';

    $lista = array_map(fn ($pv) => $pv['id'] === $alvo['id'] ? $alvo : $pv, $liga);
    if (!gravar_liga($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('liga');
    }
    $nomes = ['redesEm' => 'Redes estruturadas', 'formacaoEm' => 'Formação concluída', 'acaoEm' => 'Ação local registrada'];
    avisar('ok', ($vale ? $nomes[$campo] : 'Desfeito: ' . mb_strtolower($nomes[$campo])) . ' — ' . $alvo['nome'] . '.');
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
