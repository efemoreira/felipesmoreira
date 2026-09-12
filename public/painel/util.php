<?php
declare(strict_types=1);

/**
 * Utilitários sem efeito colateral — escapar, limpar, normalizar, formatar.
 *
 * Saíram de `sessao.php` para poderem ser lidos (e, um dia, incluídos) sem
 * arrastar sessão e cabeçalhos HTTP junto. Nada aqui grava, nada aqui lê
 * `$_SESSION`; o único disco que toca é o catálogo de municípios, e só para
 * ler.
 */

/** Aceita qualquer coisa vinda do JSON (inclusive null/número) e devolve HTML seguro. */
function h($s): string
{
    return htmlspecialchars(is_scalar($s) ? (string) $s : '', ENT_QUOTES, 'UTF-8');
}

/**
 * Corta, apara e tira caracteres de controle. Vale para todo texto que chega
 * de fora — mora aqui, e não no agenda.php, porque o formulário público e a
 * tela de inscrições também precisam e não podem incluir aquele arquivo.
 */
function limpar_texto($v, int $max): string
{
    $s = is_scalar($v) ? trim((string) $v) : '';
    $s = preg_replace('/[\x00-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}

/** Só os dígitos — é assim que telefone entra no arquivo e no link do WhatsApp. */
function so_digitos($v): string
{
    return preg_replace('/\D/', '', is_scalar($v) ? (string) $v : '') ?? '';
}

/**
 * "Fila do Hospital Geral" -> "Fila do Hospital Geral" sem acento nenhum.
 *
 * Mapa escrito à mão em vez de iconv('ASCII//TRANSLIT'): o resultado do
 * TRANSLIT depende da libc, e o mesmo texto vira "ha" no Linux da Hostinger e
 * "h" no macOS de quem desenvolve. Nome de arquivo é contrato com o Acervo, e
 * slug de origem é contrato com o relatório — nenhum dos dois pode mudar
 * conforme a máquina que gerou.
 *
 * Mora aqui, e não no producao-comum.php onde nasceu, porque as inscrições
 * também precisam e não têm por que arrastar junto o quadro de produção
 * inteiro. O equivalente no JavaScript é `normalize("NFD")`, que o Unicode
 * define e que dá o mesmo resultado em qualquer máquina.
 */
/**
 * "20/08/2026" a partir de "2026-08-20" — e o que não for data ISO volta como
 * veio ("agosto de 2024", "semana passada"). O campo "Quando" do fato é texto
 * livre porque nem todo fato tem dia; quando tem, o Olheiro digitou no
 * `<input type="date">`, que grava ISO — e ISO não se lê em voz alta.
 */
function data_humana(string $texto): string
{
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $texto, $m) === 1) {
        return "{$m[3]}/{$m[2]}/{$m[1]}";
    }
    return $texto;
}

function sem_acento(string $texto): string
{
    return strtr($texto, [
        'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a', 'ä' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'õ' => 'o', 'ô' => 'o', 'ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'ç' => 'c', 'ñ' => 'n',
        'Á' => 'A', 'À' => 'A', 'Ã' => 'A', 'Â' => 'A', 'Ä' => 'A',
        'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E',
        'Í' => 'I', 'Ì' => 'I', 'Î' => 'I', 'Ï' => 'I',
        'Ó' => 'O', 'Ò' => 'O', 'Õ' => 'O', 'Ô' => 'O', 'Ö' => 'O',
        'Ú' => 'U', 'Ù' => 'U', 'Û' => 'U', 'Ü' => 'U',
        'Ç' => 'C', 'Ñ' => 'N',
    ]);
}

/**
 * 85912345678 -> (85) 91234-5678. Guardamos só dígitos; ler assim é humano.
 *
 * Mora aqui, e não no inscricoes-comum.php onde nasceu, porque a lista de
 * presença dos encontros também precisa e não tem por que arrastar junto toda
 * a maquinaria das inscrições.
 */
function telefone_bonito(string $telefone): string
{
    $d = so_digitos($telefone);
    if (strlen($d) === 11) {
        return sprintf('(%s) %s-%s', substr($d, 0, 2), substr($d, 2, 5), substr($d, 7));
    }
    if (strlen($d) === 10) {
        return sprintf('(%s) %s-%s', substr($d, 0, 2), substr($d, 2, 4), substr($d, 6));
    }
    return $d;
}

/**
 * Número no formato que o wa.me espera: 55 + DDD + número.
 *
 * Nasceu no `inscricoes-comum.php` e mudou de casa pela mesma razão do
 * `telefone_bonito()` logo acima: a lista de pessoas e a de presença montavam o
 * link na mão, escrevendo `wa.me/55` dentro do href. Três cópias da mesma
 * conta, e nenhuma delas sabia do nono dígito.
 *
 * O `55` só é considerado prefixo de país quando sobra número para um telefone
 * inteiro embaixo dele: `5599999999` é o celular de um DDD 55, não um número
 * já internacionalizado.
 */
/**
 * "Maria da Silva Sauro" -> "Maria" — o nome quando só o primeiro cabe.
 *
 * Não confundir com `nome_encoberto()`, que existe para ESCONDER quem é numa
 * tela em que o nome inteiro seria vazamento. Aqui não há nada a esconder: é a
 * escala do encontro, lida por quem coordena, e o primeiro nome basta porque a
 * peça mostra quatro pessoas numa linha só.
 */
function primeiro_nome(string $nome): string
{
    $partes = array_values(array_filter(explode(' ', trim($nome))));
    return $partes === [] ? 'Alguém' : $partes[0];
}

function numero_whatsapp(string $telefone): string
{
    $d = so_digitos($telefone);
    return strlen($d) > 11 && str_starts_with($d, '55') ? $d : '55' . $d;
}

/**
 * O MESMO número com o nono dígito do outro jeito — ou `''` quando não há.
 *
 * O nono dígito é obrigatório para discar, mas **não** para a conta do
 * WhatsApp: quem registrou o aparelho antes da mudança e nunca reinstalou
 * continua com oito dígitos lá dentro. Para essa pessoa o link de 13 dígitos
 * abre "número inválido" e o de 12 abre a conversa — e existe o caso oposto,
 * de quem foi cadastrado aqui sem o 9 e tem conta com ele.
 *
 * **Não dá para saber de fora qual dos dois é.** O WhatsApp não responde essa
 * pergunta, e adivinhar erra metade das vezes com quem já está do outro lado.
 * Por isso a tela oferece os dois links e deixa a escolha para quem está
 * mandando a mensagem: um clique errado custa uma aba, um número que não
 * existe custa a conversa.
 *
 * Só celular entra: fixo (2 a 5 no começo) nunca ganhou o 9, e telefone com
 * tamanho estranho não vira palpite.
 */
function numero_whatsapp_outro(string $telefone): string
{
    $d = so_digitos($telefone);
    if (strlen($d) > 11 && str_starts_with($d, '55')) {
        $d = substr($d, 2);
    }
    $ddd = substr($d, 0, 2);
    $resto = substr($d, 2);

    if (strlen($d) === 11 && $resto[0] === '9') {
        return '55' . $ddd . substr($resto, 1);
    }
    if (strlen($d) === 10 && in_array($resto[0], ['6', '7', '8', '9'], true)) {
        return '55' . $ddd . '9' . $resto;
    }
    return '';
}

/**
 * Os 184 municípios do Ceará — a mesma mecânica do catálogo de funções.
 *
 * O arquivo é gerado do `src/data/municipios-ce.json` pelo `publish.yml`, e é
 * fonte única para os dois lados: o formulário público desenha a lista a partir
 * dele no build, e o servidor confere o que chega contra o mesmo arquivo. Duas
 * listas seriam "Juazeiro do Norte" e "juazeiro do norte" no mesmo relatório.
 *
 * Fica aqui, e não no `inscricoes-comum.php` junto das funções, porque quem
 * pergunta "essa cidade existe?" é a inscrição, a presença, o cadastro de
 * pessoa e o de encontro — e o único arquivo que todos os quatro incluem é este.
 */
const ARQ_MUNICIPIOS = __DIR__ . '/../municipios-ce.json';

function municipios_ce(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    $memo = ['fora' => 'Fora do Ceará', 'municipios' => []];
    if (is_file(ARQ_MUNICIPIOS)) {
        $bruto = json_decode((string) @file_get_contents(ARQ_MUNICIPIOS), true);
        if (is_array($bruto) && is_array($bruto['municipios'] ?? null)) {
            $memo['municipios'] = array_values(array_filter(array_map('strval', $bruto['municipios'])));
            $memo['fora'] = (string) ($bruto['fora'] ?? $memo['fora']);
        }
    }
    return $memo;
}

/** O rótulo de quem não é do Ceará. É opção da lista, não município. */
function cidade_de_fora(): string
{
    return municipios_ce()['fora'];
}

/**
 * A cidade é do catálogo, ou é "Fora do Ceará", ou não é nada.
 *
 * Devolve a grafia do catálogo, e não a que chegou: quem digitou "fortaleza"
 * numa importação antiga entra como "Fortaleza", e o agrupamento por cidade
 * para de ter a mesma cidade duas vezes.
 *
 * **Vazio é resposta válida** — o campo é obrigatório no formulário público,
 * e não no modelo: pessoa cadastrada pela coordenação às pressas, na porta do
 * encontro, entra sem cidade e ganha uma depois.
 */
function cidade_valida($bruta): string
{
    $v = trim((string) $bruta);
    if ($v === '') {
        return '';
    }
    $lista = municipios_ce();
    $alvo = mb_strtolower(sem_acento($v));
    if ($alvo === mb_strtolower(sem_acento($lista['fora']))) {
        return $lista['fora'];
    }
    foreach ($lista['municipios'] as $nome) {
        if (mb_strtolower(sem_acento($nome)) === $alvo) {
            return $nome;
        }
    }
    /* Catálogo ausente (deploy sem o arquivo copiado) não pode apagar a cidade
       de quem se inscreveu: sem lista para conferir, vale o que veio. */
    return $lista['municipios'] === [] ? mb_substr($v, 0, 60) : '';
}

/**
 * Um caminho de volta que o navegador mandou, se for mesmo de dentro do painel.
 *
 * Vale para o `volta` do login e para o do seletor de tema. Sem esta trava, um
 * link cuidadosamente montado leva a pessoa a um domínio de fora depois de uma
 * ação que ela confiou — que é exatamente o que redirecionamento aberto é.
 */
function caminho_interno_seguro($bruto, string $padrao = '/painel/'): string
{
    $c = is_string($bruto) ? $bruto : '';
    return preg_match('#^/painel/[a-z0-9._/?&=-]*$#i', $c) === 1 ? $c : $padrao;
}

/**
 * Como descrever o acesso de alguém em duas palavras — para a lateral e o topo
 * do Estúdio, onde não cabe a lista de capacidades.
 *
 * Substituiu o "papel" (Administrador/Editor), que era um segundo eixo de
 * permissão vivendo ao lado das áreas e dizendo quase a mesma coisa.
 */
/**
 * O texto digitado numa caixa de procurar casa com algum destes campos?
 *
 * Sem acento e sem caixa dos dois lados: quem procura "jose" tem de achar
 * "José", e quem procura "PRAÇA" tem de achar "Praça da Sé". Busca vazia casa
 * com tudo — assim a tela filtra sem precisar perguntar antes se há filtro.
 *
 * `sem_acento()` e não `iconv('ASCII//TRANSLIT')`: o TRANSLIT depende da libc e
 * o mesmo texto vira coisa diferente no Linux da Hostinger e no macOS.
 */
function combina_com(array $campos, string $busca): bool
{
    $alvo = mb_strtolower(sem_acento(trim($busca)));
    if ($alvo === '') {
        return true;
    }
    foreach ($campos as $campo) {
        $campo = (string) $campo;
        if ($campo !== '' && str_contains(mb_strtolower(sem_acento($campo)), $alvo)) {
            return true;
        }
    }
    return false;
}
