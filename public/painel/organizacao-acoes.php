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
require_once __DIR__ . '/liga-importacao.php';

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

    $acao = (string) ($_POST['acao'] ?? '');
    $arquivo = match ($acao) {
        'nucleo-salvar' => ARQ_NUCLEOS,
        'grupo-salvar' => ARQ_TEMAS,
        'pv-salvar', 'pv-comprovar', 'pv-mes', 'pv-encerrar' => ARQ_LIGA,
        'avaliar-ciclo', 'entrega', 'encerrar', 'reabrir' => match ((string) ($_POST['tipo'] ?? '')) {
            'nucleo' => ARQ_NUCLEOS, 'grupo' => ARQ_TEMAS, 'cultura' => ARQ_CULTURA, default => null,
        },
        default => null,
    };
    // Relê dentro da trava: uma avaliação ou planilha não pode apagar outra atualização.
    $executar = function () use ($acao, $eu): void {
        match ($acao) {
            'nucleo-salvar'  => salvar_nucleo(),
            'grupo-salvar'   => salvar_grupo(),
            'cultura-salvar' => salvar_cultural(),
            'entrega'        => registrar_entrega($eu),
            'encerrar'       => encerrar_unidade(true),
            'reabrir'        => encerrar_unidade(false),
            'proxima'        => marcar_proxima(),
            'pv-salvar'      => salvar_porta_voz(),
            'pv-comprovar'   => comprovar_porta_voz(),
            'pv-mes'         => fechar_mes_porta_voz($eu),
            'avaliar-ciclo'  => avaliar_ciclo_da_unidade(),
            'pv-importar-previa' => preparar_importacao_da_liga(),
            'pv-importar-gravar' => confirmar_importacao_da_liga($eu),
            'pv-encerrar'    => encerrar_porta_voz(),
            'material-salvar' => salvar_material(),
            'material-arquivar' => arquivar_material(),
            default          => null,
        };
    };
    if ($arquivo !== null) {
        com_trava($arquivo, $executar);
    } else {
        $executar();
    }

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
    $novo = conferir_mudanca_de_nivel($novo, $antigo, 'nucleo', '');
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
    $novo = conferir_mudanca_de_nivel($novo, $antigo, 'grupo', 'temas');
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

/* ---------------------------------------------------------------- cultura */

function salvar_cultural(): void
{
    $lista = ler_culturais();
    $antigo = achar_para_editar($lista, 'cultura', 'Grupo cultural');
    $base = $antigo ?? [
        'id' => novo_id_organizacao('cul'), 'nome' => '', 'eixo' => 'popular', 'nivel' => 1, 'cidade' => '', 'bairro' => '',
        'evidencia' => '', 'responsavelId' => '', 'substitutoId' => '', 'ritmo' => 'mensal', 'proximaData' => '',
        'proximaTexto' => '', 'contato' => '', 'publicado' => false, 'entregas' => [],
        'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'encerradoEm' => '',
    ];
    $novo = mesclar_post($base, campos_de_unidade() + [
        'nome'   => fn ($v) => limpar_texto($v, 80),
        'eixo'   => fn ($v) => (string) $v,
        'nivel'  => fn ($v) => (int) $v,
        'cidade' => fn ($v) => cidade_valida($v),
        'bairro' => fn ($v) => limpar_texto($v, 60),
    ]);
    if ($novo['nome'] === '') {
        avisar('erro', 'Dê um nome ao grupo cultural — "Cineclube do Benfica", "Sarau do Cariri".');
        voltar_organizacao('cultura');
    }
    if (!isset(EIXOS_CULTURAIS[$novo['eixo']])) {
        avisar('erro', 'Escolha o eixo cultural.');
        voltar_organizacao('cultura');
    }
    conferir_substituto($novo, 'cultura');
    $novo = carimbar_responsaveis($novo, $antigo);
    $lista = $antigo === null ? [...$lista, $novo] : array_map(fn ($c) => $c['id'] === $novo['id'] ? $novo : $c, $lista);
    if (!gravar_culturais($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('cultura');
    }
    avisar('ok', ($antigo === null ? 'Grupo cultural criado: ' : 'Salvo: ') . $novo['nome'] . '.');
    voltar_organizacao('cultura');
}

/* ------------------------------------------------------ comum às unidades */

/** Acha a unidade do POST (`tipo` + `id`) e devolve [unidade, aba]. */
function unidade_do_post(): array
{
    [$lista, , $aba] = unidades_do_tipo((string) ($_POST['tipo'] ?? ''));
    $id = limpar_texto($_POST['id'] ?? '', 40);
    foreach ($lista as $u) {
        if ($u['id'] === $id) {
            return [$u, $aba];
        }
    }
    avisar('erro', 'Não encontrado.');
    voltar_organizacao($aba);
}

/**
 * "Marcar a próxima atividade" — cria o encontro. Dia, hora opcional, o quê e
 * onde. Data no passado não é próxima.
 */
function marcar_proxima(): void
{
    [$u, $aba] = unidade_do_post();
    $dia = data_iso_ou_vazio($_POST['dia'] ?? '');
    if ($dia === '' || $dia < hoje_ce()) {
        avisar('erro', 'Diga o dia da próxima atividade — de hoje em diante.');
        voltar_organizacao($aba);
    }
    $id = criar_encontro_da_unidade(
        $u, $dia, (string) ($_POST['hora'] ?? ''),
        limpar_texto($_POST['titulo'] ?? '', 120), limpar_texto($_POST['local'] ?? '', 120)
    );
    if ($id === '') {
        avisar('erro', 'Não consegui gravar o encontro.');
        voltar_organizacao($aba);
    }
    require_once __DIR__ . '/feriados-comum.php';
    $criado = null;
    foreach (ler_eventos(true) as $e) {
        if ($e['id'] === $id) {
            $criado = $e;
        }
    }
    avisar('ok', 'Marcado. A atividade já é um encontro' . ($u['publicado'] ? ' e aparece na agenda do site.' : '.')
        . ($criado ? frase_de_avisos(avisos_de_agenda($criado, ler_eventos())) : ''));
    voltar_organizacao($aba);
}

/** [lista, gravar, aba] do tipo pedido no POST: 'nucleo', 'grupo' ou 'cultura'. */
function unidades_do_tipo(string $tipo): array
{
    $l = leitor_de_unidade($tipo);
    return [$l['ler'](), $l['gravar'], $l['aba']];
}

function registrar_entrega(array $eu): void
{
    [, , $aba] = unidades_do_tipo((string) ($_POST['tipo'] ?? ''));
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

    $alvo = adicionar_entrega((string) ($_POST['tipo'] ?? ''), $id, $data, $texto, (int) ($_POST['pessoas'] ?? 0), (string) ($eu['id'] ?? ''));
    if ($alvo === null) {
        avisar('erro', 'Não achei de quem é esta entrega, ou não consegui gravar.');
        voltar_organizacao($aba);
    }
    /* A próxima vem no mesmo formulário: "registrou ao menos uma entrega e
       tem plano para o próximo" são as duas metades de ficar ativo. E a
       próxima é um encontro, como a de "Marcar a próxima". */
    $proxima = data_iso_ou_vazio($_POST['proximaData'] ?? '');
    $marcou = false;
    if ($proxima !== '' && $proxima >= hoje_ce() && !isset(proximos_encontros_das_unidades()[$id])) {
        $marcou = criar_encontro_da_unidade($alvo, $proxima, (string) ($_POST['proximaHora'] ?? ''),
            limpar_texto($_POST['proximaTexto'] ?? '', 120), '') !== '';
    }
    avisar('ok', $marcou ? 'Registrado, e a próxima já está na agenda.' : 'Registrado.');
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
        'destaque'  => fn ($v) => link_de_destaque($v),
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

    foreach (['engajamento' => 100, 'semanasSeguidas' => 520, 'acoes' => 50, 'modulos' => 50, 'lives' => 50] as $campo => $max) {
        $valor = str_replace(',', '.', trim((string) ($_POST[$campo] ?? '0')));
        $forma = $campo === 'engajamento' ? '/^\d+(\.\d+)?$/' : '/^\d+$/';
        if (!preg_match($forma, $valor) || (float) $valor > $max) {
            avisar('erro', 'Confira ' . $campo . ': informe um número entre 0 e ' . $max . '.');
            voltar_organizacao('liga');
        }
    }

    $redes = [];
    foreach (array_keys(REDES_LIGA) as $r) {
        $valor = trim((string) ($_POST['redes'][$r] ?? '0'));
        if (!preg_match('/^\d+$/', $valor) || (float) $valor > 100000000) {
            avisar('erro', 'Confira os seguidores de ' . REDES_LIGA[$r] . ': use um inteiro de 0 a 100000000.');
            voltar_organizacao('liga');
        }
        $redes[$r] = (int) $valor;
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

/* ---------------------------------------------------------------- Biblioteca */

function salvar_material(): void
{
    $lista = ler_biblioteca();
    $antigo = achar_para_editar($lista, 'biblioteca', 'Material');
    $base = $antigo ?? [
        'id' => novo_id_organizacao('mat'), 'titulo' => '', 'tipo' => 'caderno', 'tema' => '', 'resumo' => '',
        'link' => '', 'publicado' => false, 'criadoEm' => date('c'), 'criadoPor' => quem_grava(), 'arquivadoEm' => '',
    ];
    $novo = mesclar_post($base, [
        'titulo'    => fn ($v) => limpar_texto($v, 120),
        'tipo'      => fn ($v) => (string) $v,
        'tema'      => fn ($v) => (string) $v,
        'resumo'    => fn ($v) => limpar_texto($v, 240),
        'link'      => fn ($v) => trim((string) $v),
        'publicado' => fn ($v) => !empty($v),
    ]);
    if ($novo['titulo'] === '' || !str_starts_with(mb_strtolower($novo['link']), 'https://')) {
        avisar('erro', 'Material precisa de título e de um link https — o Drive, o YouTube, o PDF onde ele já está.');
        voltar_organizacao('biblioteca');
    }
    $lista = $antigo === null ? [...$lista, $novo] : array_map(fn ($m) => $m['id'] === $novo['id'] ? $novo : $m, $lista);
    if (!gravar_biblioteca($lista)) {
        avisar('erro', 'Não consegui gravar em /dados.');
        voltar_organizacao('biblioteca');
    }
    avisar('ok', ($antigo === null ? 'Na Biblioteca: ' : 'Salvo: ') . $novo['titulo'] . '.');
    voltar_organizacao('biblioteca');
}

/** Arquivar tira do site sem apagar: o material velho continua achável no painel. */
function arquivar_material(): void
{
    $lista = ler_biblioteca();
    $alvo = achar_para_editar($lista, 'biblioteca', 'Material');
    if ($alvo === null) {
        avisar('erro', 'Material não encontrado.');
        voltar_organizacao('biblioteca');
    }
    $alvo['arquivadoEm'] = $alvo['arquivadoEm'] === '' ? date('c') : '';
    gravar_biblioteca(array_map(fn ($m) => $m['id'] === $alvo['id'] ? $alvo : $m, $lista));
    avisar('ok', $alvo['arquivadoEm'] !== '' ? 'Arquivado. Saiu do site.' : 'Desarquivado.');
    voltar_organizacao('biblioteca');
}
