<?php
declare(strict_types=1);

/**
 * Relatos e ideias que chegam pelo Paulo, o assistente do WhatsApp.
 *
 * O Paulo conversa com quem chega e registra duas coisas que não são inscrição:
 * o RELATO (compra de voto, segurança, problema do bairro, reclamação sobre a
 * equipe) e a IDEIA (proposta para o bairro, a cidade ou a organização). Antes
 * elas moravam só no CRM do Paulo, e a coordenação trabalhava em dois lugares.
 * Agora o protocolo nasce lá e é decidido aqui — o Paulo relê o andamento por
 * `api/paulo.php` e responde à pessoa quando ela pergunta.
 *
 * O ARQUIVO É O SCHEMA, como em todo o painel: `normalizar_relato()` decide o
 * que é um registro válido, e campo que ela não conhece some.
 *
 * Fotos e arquivos NÃO vêm para cá. O Paulo não analisa imagem: guarda no CRM e
 * anexa ao protocolo. Aqui fica quantos são e o link do protocolo lá — imagem de
 * relato de compra de voto não é coisa para circular em mais um servidor.
 *
 * DADO PESSOAL: relato identificado traz nome e telefone de quem relatou. A área
 * é da Coordenação, que é quem já vê telefone no painel (`pode_ver_telefone()`).
 * Relato sem identificação chega sem nome, sem telefone e sem ficha — e continua
 * assim: não há campo para "descobrir" depois quem foi.
 */

require_once __DIR__ . '/sessao.php';

const ARQ_RELATOS = PASTA_DADOS . '/relatos.php';

/** Os tipos de relato — os mesmos do Paulo, para o protocolo não mudar de nome no caminho. */
const CATEGORIAS_RELATO = [
    'COMPRA_DE_VOTO' => 'Compra de voto',
    'SEGURANCA'      => 'Segurança',
    'BAIRRO'         => 'Problema do bairro',
    'EQUIPE'         => 'Reclamação sobre a equipe',
    'OUTRO'          => 'Outro',
];

/** O andamento de cada tipo. A primeira chave é onde tudo começa. */
const ANDAMENTO = [
    'relato' => ['recebida' => 'Recebido', 'em-analise' => 'Em análise', 'encaminhada' => 'Encaminhado', 'respondida' => 'Respondido'],
    'ideia'  => ['nova' => 'Nova', 'lida' => 'Lida', 'aproveitada' => 'Aproveitada'],
];

/** Relato parado na porta por mais que isto vira urgência no Início — o acolhimento em 72h do plano. */
const HORAS_LIMITE_RELATO = 72;

function normalizar_relato(array $r): ?array
{
    $tipo = ($r['tipo'] ?? '') === 'ideia' ? 'ideia' : 'relato';
    $protocolo = preg_match('/^[A-Z0-9-]{4,40}$/', (string) ($r['protocolo'] ?? '')) === 1 ? (string) $r['protocolo'] : '';
    $texto = limpar_texto($r['texto'] ?? '', 5000);
    if ($protocolo === '' || $texto === '') {
        return null;
    }
    $anonimo = !empty($r['anonimo']);
    $andamento = (string) ($r['andamento'] ?? '');
    $link = (string) ($r['link'] ?? '');
    return [
        'id'        => preg_match('/^[a-f0-9]{16}$/', (string) ($r['id'] ?? '')) === 1 ? (string) $r['id'] : bin2hex(random_bytes(8)),
        'protocolo' => $protocolo,
        'tipo'      => $tipo,
        'categoria' => $tipo === 'relato' && isset(CATEGORIAS_RELATO[(string) ($r['categoria'] ?? '')]) ? (string) $r['categoria'] : ($tipo === 'relato' ? 'OUTRO' : ''),
        'tema'      => $tipo === 'ideia' ? limpar_texto($r['tema'] ?? '', 120) : '',
        'texto'     => $texto,
        'local'     => limpar_texto($r['local'] ?? '', 200),
        /* Sem identificação é sem identificação: nome, telefone e ficha somem
           aqui mesmo que alguém os mande. */
        'anonimo'   => $anonimo,
        'nome'      => $anonimo ? '' : limpar_texto($r['nome'] ?? '', 80),
        'telefone'  => $anonimo ? '' : so_digitos($r['telefone'] ?? ''),
        'pessoaId'  => $anonimo ? '' : limpar_texto($r['pessoaId'] ?? '', 40),
        'anexos'    => max(0, min(20, (int) ($r['anexos'] ?? 0))),
        'link'      => str_starts_with($link, 'https://') ? limpar_texto($link, 300) : '',
        'andamento' => isset(ANDAMENTO[$tipo][$andamento]) ? $andamento : (string) array_key_first(ANDAMENTO[$tipo]),
        'resposta'  => limpar_texto($r['resposta'] ?? '', 2000),
        'nota'      => limpar_texto($r['nota'] ?? '', 1000),
        'criadoEm'  => limpar_texto($r['criadoEm'] ?? '', 40) ?: date('c'),
        'alteradoEm'  => limpar_texto($r['alteradoEm'] ?? '', 40),
        'alteradoPor' => limpar_texto($r['alteradoPor'] ?? '', 60),
    ];
}

function ler_relatos(): array
{
    $dados = is_file(ARQ_RELATOS) ? @include ARQ_RELATOS : [];
    return array_values(array_filter(array_map(
        fn ($r) => is_array($r) ? normalizar_relato($r) : null,
        is_array($dados) ? $dados : []
    )));
}

function gravar_relatos(array $relatos): bool
{
    $limpos = array_values(array_filter(array_map('normalizar_relato', $relatos)));
    return gravar_atomico(ARQ_RELATOS, "<?php\nreturn " . var_export($limpos, true) . ";\n");
}

function achar_relato(string $id): ?array
{
    foreach (ler_relatos() as $r) {
        if ($r['id'] === $id) {
            return $r;
        }
    }
    return null;
}

/**
 * Recebe um relato ou uma ideia do Paulo. O PROTOCOLO É A CHAVE: o Paulo
 * reenvia quando a rede falha, e o mesmo protocolo duas vezes é o mesmo
 * registro — devolve `true` sem duplicar nem sobrescrever o que a coordenação
 * já anotou.
 */
function receber_relato(array $novo): bool
{
    $limpo = normalizar_relato($novo + ['criadoEm' => date('c')]);
    if ($limpo === null) {
        return false;
    }
    return com_trava(ARQ_RELATOS, function () use ($limpo): bool {
        $todos = ler_relatos();
        foreach ($todos as $r) {
            if ($r['protocolo'] === $limpo['protocolo']) {
                return true;
            }
        }
        $todos[] = $limpo;
        return gravar_relatos($todos);
    });
}

/** O andamento, a resposta e a nota — o que a coordenação decide. */
function decidir_relato(string $id, string $andamento, string $resposta, string $nota, string $por): bool
{
    return com_trava(ARQ_RELATOS, function () use ($id, $andamento, $resposta, $nota, $por): bool {
        $todos = ler_relatos();
        $achou = false;
        foreach ($todos as &$r) {
            if ($r['id'] !== $id || !isset(ANDAMENTO[$r['tipo']][$andamento])) {
                continue;
            }
            $r['andamento'] = $andamento;
            $r['resposta'] = $resposta;
            $r['nota'] = $nota;
            $r['alteradoEm'] = date('c');
            $r['alteradoPor'] = $por;
            $achou = true;
        }
        unset($r);
        return $achou && gravar_relatos($todos);
    });
}

/** Está esperando alguém olhar? É o primeiro andamento do tipo. */
function relato_na_porta(array $r): bool
{
    return $r['andamento'] === array_key_first(ANDAMENTO[$r['tipo']]);
}

/** O Início: o que chegou pelo Paulo e ninguém olhou ainda. */
function pendencias_relatos(array $u): array
{
    $tarefas = [];
    $relatos = array_values(array_filter(ler_relatos(), fn ($r) => $r['tipo'] === 'relato' && relato_na_porta($r)));
    $ideias = array_values(array_filter(ler_relatos(), fn ($r) => $r['tipo'] === 'ideia' && relato_na_porta($r)));
    if ($relatos !== []) {
        $horas = max(array_map(fn ($r) => (int) floor((time() - (strtotime($r['criadoEm']) ?: time())) / 3600), $relatos));
        $tarefas[] = [
            'area'    => 'relatos',
            'icone'   => 'mail',
            'urgente' => $horas >= HORAS_LIMITE_RELATO,
            'quantos' => count($relatos),
            'texto'   => count($relatos) === 1 ? '1 relato esperando a coordenação' : count($relatos) . ' relatos esperando a coordenação',
            'porque'  => 'quem relatou pelo WhatsApp pergunta ao Paulo o andamento do protocolo',
            'url'     => '/painel/relatos.php',
        ];
    }
    if ($ideias !== []) {
        $tarefas[] = [
            'area'    => 'relatos',
            'icone'   => 'mail',
            'urgente' => false,
            'quantos' => count($ideias),
            'texto'   => count($ideias) === 1 ? '1 ideia nova pelo WhatsApp' : count($ideias) . ' ideias novas pelo WhatsApp',
            'porque'  => 'proposta que ninguém lê vira silêncio para quem propôs',
            'url'     => '/painel/relatos.php?aba=ideias',
        ];
    }
    return $tarefas;
}
