<?php
declare(strict_types=1);

/**
 * Núcleo do painel — felipesmoreira.com/painel
 *
 * Sessão, usuários e permissões. Todo arquivo do painel começa por aqui, então
 * é aqui que mora a única resposta para "quem é você" e "o que você pode abrir".
 *
 * Os usuários ficam em public_html/dados/usuarios.php, fora do repositório: um
 * deploy novo nunca apaga quem tem acesso e nenhuma senha entra no Git. Só o
 * hash é guardado — senha não se recupera, só se troca.
 *
 * Cada usuário tem um papel (admin ou editor) e as áreas que pode abrir.
 * Admin enxerga todas as áreas e é o único que mexe na lista de usuários.
 */

const SESSAO_SEG = 7200;  // 2 h de inatividade

const PASTA_DADOS    = __DIR__ . '/../dados';
const ARQ_PESSOAS    = PASTA_DADOS . '/pessoas.php';
// .php, e não .json: o arquivo tem os logins de quem errou senha, e em /dados
// só arquivo .php fica fora do alcance da web.
const ARQ_TENTATIVAS = PASTA_DADOS . '/tentativas.php';
const ARQ_SEGREDO    = PASTA_DADOS . '/segredo.php';
/** Versão antiga do arquivo acima, legível pela web — apagada ao passar por aqui. */
const ARQ_TENTATIVAS_ANTIGO = PASTA_DADOS . '/tentativas.json';
const PASTA_BACKUP   = PASTA_DADOS . '/backups';
const PASTA_IMAGENS  = PASTA_DADOS . '/imagens';
const URL_IMAGENS    = '/dados/imagens';  // como a página enxerga a pasta

/** Nome do cookie do tema. Não é segredo: só diz se a pessoa quer claro ou escuro. */
const COOKIE_TEMA    = 'painel_tema';

const MAX_TENTATIVAS = 5;
const BLOQUEIO_SEG   = 900;  // 15 min
const SENHA_MIN      = 8;   // com o bloqueio por login, 8 já segura tentativa às cegas

/** As ferramentas do painel. É a permissão fina — ver CAPACIDADES logo abaixo. */
const AREAS = [
    'agenda'     => 'Agenda e eventos',
    'estudio'    => 'Estúdio de artes',
    'aulas'      => 'Editar a formação',
    'fatos'      => 'Fatos do dia',
    'producao'   => 'Produção',
    'municao'    => 'Munição',
    'eventos'    => 'Encontros',
    'inscricoes' => 'Inscrições da militância',
    'candidatos' => 'Candidatos',
    'pessoas'    => 'Pessoas e dados pessoais',
];

/**
 * O que se dá para alguém — quatro caixas, e não dez.
 *
 * Marcar dez áreas uma a uma é decisão demais para uma pergunta simples ("essa
 * pessoa coordena o quê?"), e quem marca acaba dando tudo por preguiça. As
 * capacidades são o jeito normal de conceder; as áreas continuam por baixo para
 * a exceção — tirar o Estúdio de alguém de Comunicação sem inventar uma
 * capacidade nova.
 *
 * **`pessoas` só entra em `adm`, de propósito.** É a tela com telefone, e-mail e
 * endereço de todo mundo: acesso a dado pessoal não acompanha o trabalho do dia,
 * acompanha a responsabilidade sobre ele.
 *
 * **Ninguém precisa de área para ESTUDAR.** A formação é de todo mundo que tem
 * conta; a área `aulas` é para *editar* — pendurar o vídeo, ver quem estudou.
 */
const CAPACIDADES = [
    'comunicacao' => [
        'nome'   => 'Comunicação',
        'resumo' => 'O que o movimento publica: fato, roteiro, arte, peça do mutirão',
        'areas'  => ['fatos', 'producao', 'municao', 'estudio'],
    ],
    'eventos' => [
        'nome'   => 'Eventos',
        'resumo' => 'Os encontros e a programação que aparece no site',
        'areas'  => ['eventos', 'agenda'],
    ],
    'coordenacao' => [
        'nome'   => 'Coordenação',
        'resumo' => 'Quem entra no movimento, os candidatos e a formação do time',
        'areas'  => ['inscricoes', 'candidatos', 'aulas'],
    ],
    'adm' => [
        'nome'   => 'Administração',
        'resumo' => 'Tudo, inclusive a lista de pessoas com dado pessoal',
        'areas'  => [],  // vazio: adm enxerga tudo por definição — ver a função
    ],
];

/** As áreas que uma capacidade libera. `adm` libera todas. */
function areas_da_capacidade(string $chave): array
{
    if ($chave === 'adm') {
        return array_keys(AREAS);
    }
    return CAPACIDADES[$chave]['areas'] ?? [];
}

/**
 * As ferramentas do trabalho de todo dia, por oposição às de decisão.
 *
 * A diferença não é técnica — a permissão é a mesma caixa marcada. É só a
 * sugestão do que vem marcado ao cadastrar alguém: ferramenta não pertence a uma
 * função, e o Olheiro que quiser entender o quadro de Produção deve conseguir
 * abrir. Quem cadastra desmarca o que não quiser.
 */
const AREAS_FERRAMENTA = ['fatos', 'producao', 'municao', 'eventos'];

/**
 * O que a pessoa É para o movimento.
 *
 * Eixo diferente de `funcoes` (o que ela FAZ: Olheiro, Design…) e de
 * `capacidades` (o que ela ABRE no painel). Um coordenador tem função; um
 * militante também. Substituiu a antiga `classe` do lead — curioso,
 * simpatizante, militante, apoiador —, que dizia quase a mesma coisa com outras
 * palavras e vivia num arquivo à parte.
 */
const TIPOS_PESSOA = [
    'eleitor'     => 'Eleitor',
    'apoiador'    => 'Apoiador',
    'militante'   => 'Militante',
    'coordenador' => 'Coordenador',
    'candidato'   => 'Candidato',
];

/**
 * Os cargos que existem numa cédula. Escolha de lista, e não campo de texto.
 *
 * "Dep. Federal", "Deputado federal" e "DEPUTADO FEDERAL" digitados por três
 * pessoas viram três cargos diferentes no filtro e três grafias na colinha que
 * o eleitor recebe. São doze cargos no Brasil inteiro — cabe numa lista.
 *
 * `digitos` é quantos números se digitam na urna para aquele cargo, e é o que
 * a gravação confere: colinha com número errado é pior que colinha nenhuma.
 *
 * **Vice tem os dígitos do titular, e não zero.** O vice não tem número
 * próprio — o voto vai no número de quem encabeça a chapa —, e é justamente
 * por isso que o número dele na colinha é o do titular: é o que o eleitor
 * digita. É a mesma coisa que a `/amissao` explica com todas as letras.
 */
const CARGOS = [
    'presidente'        => ['nome' => 'Presidente',              'digitos' => 2],
    'vice-presidente'   => ['nome' => 'Vice-Presidente',         'digitos' => 2],
    'senador'           => ['nome' => 'Senador',                 'digitos' => 3],
    'suplente-1'        => ['nome' => '1º Suplente de Senador',  'digitos' => 3],
    'suplente-2'        => ['nome' => '2º Suplente de Senador',  'digitos' => 3],
    'deputado-federal'  => ['nome' => 'Deputado Federal',        'digitos' => 4],
    'governador'        => ['nome' => 'Governador',              'digitos' => 2],
    'vice-governador'   => ['nome' => 'Vice-Governador',         'digitos' => 2],
    'deputado-estadual' => ['nome' => 'Deputado Estadual',       'digitos' => 5],
    'prefeito'          => ['nome' => 'Prefeito',                'digitos' => 2],
    'vice-prefeito'     => ['nome' => 'Vice-Prefeito',           'digitos' => 2],
    'vereador'          => ['nome' => 'Vereador',                'digitos' => 5],
];

/** Cargo de vice: o número que ele leva na colinha é o do titular. */
function cargo_de_vice(string $chave): bool
{
    return str_starts_with($chave, 'vice-') || str_starts_with($chave, 'suplente-');
}

/** O nome do cargo como se escreve. Cargo em branco devolve string vazia. */
function rotulo_cargo(string $chave): string
{
    return (string) (CARGOS[$chave]['nome'] ?? '');
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

/** A fila de entrada. Vazio = cadastrada direto pela coordenação. */
const STATUS_PESSOA = [
    ''         => 'Cadastrada',
    'pendente' => 'Esperando aprovação',
    'aprovada' => 'Aprovada',
    'recusada' => 'Recusada',
];

/** Para onde cada área leva, e uma linha do que ela faz. */
const DESTINO_AREA = [
    'agenda'     => ['url' => '/painel/agenda.php', 'resumo' => 'Editar a programação que aparece em /programacao'],
    'estudio'    => ['url' => '/painel/estudio.php', 'resumo' => 'Montar as artes dos posts a partir de um modelo'],
    'aulas'      => ['url' => '/painel/aulas.php', 'resumo' => 'Pendurar o vídeo de cada aula e ver quem já estudou'],
    'fatos'      => ['url' => '/painel/fatos.php', 'resumo' => 'Trazer o fato do dia com fonte e conferir o que chegou'],
    'producao'   => ['url' => '/painel/producao.php', 'resumo' => 'O quadro do roteiro à publicação: quem faz o quê, e onde travou'],
    'municao'    => ['url' => '/painel/municao.php', 'resumo' => 'As peças do mutirão: o número do plano com a fonte, pronto pra mandar no grupo'],
    'eventos'    => ['url' => '/painel/eventos.php', 'resumo' => 'Preparar o encontro, confirmar presença e receber quem chega'],
    'inscricoes' => ['url' => '/painel/inscricoes.php', 'resumo' => 'Aprovar quem se inscreveu em /queroajudar e mandar o acesso'],
    'candidatos' => ['url' => '/painel/candidatos.php', 'resumo' => 'Nome de urna, número e @ de cada candidato — a colinha que o eleitor leva'],
    'pessoas'    => ['url' => '/painel/pessoas.php', 'resumo' => 'Todo mundo do movimento: quem é, o que faz, em que encontros esteve'],
];

/**
 * O grupo de trabalho — e **só aqui**, ao contrário do `GRUPO_GERAL`, que tem
 * par em `src/lib/contato.ts`.
 *
 * NÃO existe cópia em TypeScript, e não pode existir: num export estático tudo
 * que entra em `src/` vira bundle público, e o convite deste grupo é de quem já
 * tem conta. Se ele circulasse no site, encheria de gente que a coordenação
 * ainda não conferiu e viraria grupo de recados. Entrar nele é a primeira
 * obrigação de quem chega (ver index.php e agora.php).
 *
 * `testes/contrato/painel.test.ts` procura este convite em `src/` e falha se o
 * achar — o grep que o CLAUDE.md mandava fazer à mão.
 */
const GRUPO_TRABALHO = 'https://chat.whatsapp.com/C8rQeoCzJpz6vObwyRFAbt';

/** O contato oficial. Não existe e-mail: este é o único canal. */
const WHATSAPP_COORDENACAO = 'https://wa.me/5585981872972';

header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: same-origin');
header('X-Content-Type-Options: nosniff');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/painel',
    'httponly' => true,
    'secure'   => $https,
    'samesite' => 'Strict',
]);
session_name('painel_agenda');
session_start();

/* ===================== infraestrutura ===================== */

/** Aceita qualquer coisa vinda do JSON (inclusive null/número) e devolve HTML seguro. */
function h($s): string
{
    return htmlspecialchars(is_scalar($s) ? (string) $s : '', ENT_QUOTES, 'UTF-8');
}

function gravar_atomico(string $destino, string $conteudo): bool
{
    $tmp = $destino . '.tmp';
    if (@file_put_contents($tmp, $conteudo, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0644);
    if (!@rename($tmp, $destino)) {
        return false;
    }

    /* Todo /dados é .php lido com include, e o OPcache guarda a versão
       compilada. Como ele só reconfere o disco de tempos em tempos
       (opcache.revalidate_freq, 2s por padrão), duas gravações dentro da mesma
       janela podem fazer a leitura seguinte devolver o conteúdo ANTIGO — e a
       alteração some sem erro nenhum.

       Isto é precaução, não conserto de bug observado: no servidor embutido do
       PHP (php -S) o OPcache nem executa, então o teste local não alcança o
       caso. Na Hostinger, que roda Apache com OPcache ligado, ele é real — e as
       aulas trouxeram o primeiro arquivo do painel que grava várias vezes por
       minuto (o progresso de cada pessoa), bem dentro dessa janela.

       Fica aqui, e não no aulas-comum.php, porque toda gravação do painel passa
       por esta função. */
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate($destino, true);
    }

    // o stat cache do PHP também precisa esquecer o inode que acabou de trocar
    clearstatcache(true, $destino);

    return true;
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
 * O envio veio mesmo do nosso site?
 *
 * `Origin` ausente não reprova: navegador antigo e algumas requisições de mesma
 * origem não mandam o cabeçalho, e recusar por ausência derrubaria gente de
 * verdade. Quando ele vem, tem que bater com o nosso host.
 *
 * **A porta sai dos dois lados antes de comparar.** `parse_url` devolve o host
 * sem porta, enquanto `HTTP_HOST` a traz quando não é a padrão — comparar os
 * dois crus reprova todo envio em qualquer porta que não seja 80/443. Em
 * produção isso nunca aparece (443 é implícita), e é justamente por isso que
 * seria descoberto tarde: o formulário público pararia em silêncio no dia em
 * que o site subisse atrás de outra porta.
 *
 * Mora aqui porque a inscrição, a presença e as aulas faziam a mesma
 * conferência, cada uma com a sua cópia.
 */
function origem_confere(): bool
{
    $origem = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origem === '') {
        return true;
    }
    $dele = parse_url($origem, PHP_URL_HOST);
    if (!is_string($dele) || $dele === '') {
        return false;
    }
    // tira a porta do nosso host; o IPv6 literal vem entre colchetes
    $meu = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $meu = preg_replace('/:\d+$/', '', $meu) ?? $meu;
    $meu = trim($meu, '[]');

    return strcasecmp($dele, trim($meu, '[]')) === 0;
}

/**
 * Segredo do site, criado sozinho na primeira vez.
 *
 * Serve para embaralhar o IP antes de guardar — dá para contar quantas vezes
 * alguém tentou sem manter endereço salvo, que é dado pessoal — e para derivar
 * o token de convite das aulas.
 *
 * Mora aqui, e não no inscricoes-comum.php onde nasceu, porque é segredo do
 * site inteiro: as aulas precisam dele e não têm por que arrastar junto a
 * maquinaria das inscrições.
 */
function segredo(): string
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    if (is_file(ARQ_SEGREDO)) {
        $v = @include ARQ_SEGREDO;
        if (is_string($v) && $v !== '') {
            return $memo = $v;
        }
    }
    preparar_pastas();
    $memo = bin2hex(random_bytes(16));
    gravar_atomico(ARQ_SEGREDO, "<?php\nreturn " . var_export($memo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_SEGREDO, true);
    }
    return $memo;
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

/** Escreve a regra só quando ela mudou — assim uma versão nova se conserta sozinha. */
function fixar_regra(string $arquivo, string $conteudo): void
{
    if (!is_file($arquivo) || @file_get_contents($arquivo) !== $conteudo) {
        @file_put_contents($arquivo, $conteudo);
    }
}

function preparar_pastas(): void
{
    foreach ([PASTA_DADOS, PASTA_BACKUP, PASTA_IMAGENS] as $pasta) {
        if (!is_dir($pasta)) {
            @mkdir($pasta, 0755, true);
        }
    }

    $negar = "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n"
           . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n";

    $permitir = "<IfModule mod_authz_core.c>\n  Require all granted\n</IfModule>\n"
              . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Allow from all\n</IfModule>\n";

    // Nada de PHP rodando dentro da pasta de imagens, mesmo se algo escapar da validação.
    fixar_regra(
        PASTA_IMAGENS . '/.htaccess',
        "Options -Indexes\nAddType text/plain .php .php5 .phtml .phar .cgi .pl\n<IfModule mod_php.c>\n  php_flag engine off\n</IfModule>\n"
    );

    // Backups não saem pela web.
    fixar_regra(PASTA_BACKUP . '/.htaccess', "Options -Indexes\n" . $negar);

    /* Em /dados nada sai pela web, com UMA exceção: o agenda.json, que a página
       /programacao busca no navegador.

       O .php já era bloqueado (é onde ficam os hashes de senha e os dados
       pessoais das inscrições). O .json passou a ser bloqueado também: o
       tentativas.json antigo entregava a lista de logins que erraram senha para
       qualquer um com o link. A liberação do agenda.json vem depois na ordem,
       porque a última regra que casa é a que vale.

       As imagens da agenda (/dados/imagens/*.jpg) não entram aqui: a regra é
       por extensão, e elas não são .php nem .json. */
    fixar_regra(
        PASTA_DADOS . '/.htaccess',
        "Options -Indexes\n"
        . "<FilesMatch \"\\.(php|php5|phtml|phar|inc)$\">\n" . $negar . "</FilesMatch>\n"
        . "<FilesMatch \"\\.json$\">\n" . $negar . "</FilesMatch>\n"
        . "<Files \"agenda.json\">\n" . $permitir . "</Files>\n"
    );

    // Versão antiga do contador de tentativas, que ficava legível pela web.
    if (is_file(ARQ_TENTATIVAS_ANTIGO)) {
        @unlink(ARQ_TENTATIVAS_ANTIGO);
    }
}

/* ===================== usuários ===================== */

/** Preenche os campos que faltam e descarta registro sem o mínimo. */
/**
 * UMA pessoa, e não quatro.
 *
 * Havia quatro cadastros que não se conheciam — contas do painel, inscrições da
 * fila, presenças de encontro e candidatos — e a mesma pessoa aparecia nos
 * quatro, com o nome escrito de três jeitos. Não dava para responder "em que
 * encontros o Fulano esteve", "esse número já é do time?" nem "quem está
 * duplicado".
 *
 * Agora é um registro só, com blocos opcionais:
 *
 *   identidade  nome, telefone, e-mail, onde mora        (sempre)
 *   movimento   tipo, funções                            (sempre)
 *   painel      usuário, senha, capacidades, áreas       (só quem tem conta)
 *   candidatura número de urna, cargo, @, foto           (só candidato)
 *   entrada     status da fila, origem, consentimento    (só quem se inscreveu)
 *
 * **O telefone é a chave natural.** É a única coisa que as quatro listas antigas
 * tinham em comum, é o que a pessoa digita na porta do encontro e é por ele que
 * a coordenação fala com ela. Não é chave primária (gente troca de número), mas
 * é por ele que se acha duplicata.
 *
 * O array é literal de propósito: campo que não estiver aqui some na próxima
 * gravação.
 */
function normalizar_pessoa($p): ?array
{
    /* Antes exigia usuário e hash — porque só existia quem tinha login. Agora a
       maioria das pessoas NÃO tem conta: quem confirmou presença num encontro é
       uma pessoa do mesmo jeito. Nome é o mínimo.

       NOME SÓ DE ESPAÇO NÃO É NOME, e é preciso limpar ANTES de conferir. Um
       `empty()` sobre o campo cru deixava passar `"   "` — que é string
       não-vazia —, e só depois o `limpar_texto()` lá embaixo a reduzia a `''`:
       a ficha nascia sem nome, sem nenhum erro aparecer. Quem abre a lista de
       pessoas vê uma linha em branco que não dá para procurar nem identificar,
       e no cadastro de candidato a mesma brecha punha um número de urna na
       colinha sem nome nenhum ao lado dele.

       A conferência mora AQUI porque aqui é o portão único: `pessoas.php`,
       `candidatos.php` e a presença gravam todos por esta função. Os endpoints
       públicos exigem nome completo por conta própria, com régua mais dura. */
    if (!is_array($p)) {
        return null;
    }
    $nome = limpar_texto($p['nome'] ?? '', 80);
    if ($nome === '') {
        return null;
    }

    $tipo = (string) ($p['tipo'] ?? 'eleitor');
    if (!isset(TIPOS_PESSOA[$tipo])) {
        $tipo = 'eleitor';
    }
    $status = (string) ($p['status'] ?? '');
    if (!isset(STATUS_PESSOA[$status])) {
        $status = '';
    }

    $capacidades = [];
    foreach ((array) ($p['capacidades'] ?? []) as $c) {
        if (isset(CAPACIDADES[$c]) && !in_array($c, $capacidades, true)) {
            $capacidades[] = (string) $c;
        }
    }

    /* As áreas são as das capacidades MAIS o ajuste fino gravado. Guardar o
       resultado, e não recalcular só na leitura, é o que permite tirar uma área
       de alguém sem ter que inventar uma capacidade nova para isso. */
    $pedidas = is_array($p['areas'] ?? null) ? $p['areas'] : [];
    foreach ($capacidades as $c) {
        $pedidas = array_merge($pedidas, areas_da_capacidade($c));
    }
    $areas = in_array('adm', $capacidades, true)
        ? array_keys(AREAS)
        : array_values(array_intersect(array_keys(AREAS), array_unique($pedidas)));

    $conta = limpar_texto($p['usuario'] ?? '', 40);

    return [
        'id'   => (string) ($p['id'] ?? ''),
        'nome' => $nome,
        'tipo' => $tipo,

        /* ---- como falar com ela ---- */
        'telefone' => so_digitos($p['telefone'] ?? ''),
        'email'    => limpar_texto($p['email'] ?? '', 120),
        'cidade'   => cidade_valida($p['cidade'] ?? ''),
        'bairro'   => limpar_texto($p['bairro'] ?? '', 60),

        /* ---- o que ela faz no movimento (Olheiro, Design…) ---- */
        'funcoes' => array_values(array_filter(array_map(
            fn ($f) => limpar_texto($f, 40),
            is_array($p['funcoes'] ?? null) ? $p['funcoes'] : []
        ))),

        /* ---- conta no painel: tudo vazio quando não tem ---- */
        'usuario'      => $conta,
        'hash'         => (string) ($p['hash'] ?? ''),
        'capacidades'  => $capacidades,
        'areas'        => $areas,
        'ativo'        => !empty($p['ativo']),
        'trocarSenha'  => !empty($p['trocarSenha']),
        'ultimoAcesso' => (string) ($p['ultimoAcesso'] ?? ''),
        /* Marcado quando a pessoa diz "já entrei" no grupo de trabalho. É a
           primeira obrigação de quem chega, e vira TAREFA no hub até estar
           marcada — banner some da vista em três dias. */
        'entrouNoGrupo' => !empty($p['entrouNoGrupo']),

        /* ---- candidatura: vazio para quem não é candidato ---- */
        'urna'      => limpar_texto($p['urna'] ?? '', 60),
        'cargo'     => isset(CARGOS[(string) ($p['cargo'] ?? '')]) ? (string) $p['cargo'] : '',
        'numero'    => preg_replace('/\D/', '', (string) ($p['numero'] ?? '')) ?: '',
        'partido'   => limpar_texto($p['partido'] ?? '', 40),
        'instagram' => limpar_texto($p['instagram'] ?? '', 40),
        'imagem'    => limpar_texto($p['imagem'] ?? '', 300),
        /* Só o que está publicado desce para o site. */
        'publicado' => !empty($p['publicado']),
        /* Onde ela aparece na lista de candidatos. Menor primeiro; empate
           desempata pelo nome. Zero para quem não é candidato. */
        'ordem'     => (int) ($p['ordem'] ?? 0),

        /* ---- como ela entrou ---- */
        'status'   => $status,
        'origem'   => limpar_texto($p['origem'] ?? '', 60),
        'observacao' => limpar_texto($p['observacao'] ?? '', 400),
        'criadoEm'   => (string) ($p['criadoEm'] ?? ''),
        'decididoEm' => limpar_texto($p['decididoEm'] ?? '', 40),
        'decididoPor' => limpar_texto($p['decididoPor'] ?? '', 60),
        'consentimentoEm'     => limpar_texto($p['consentimentoEm'] ?? '', 40),
        'consentimentoVersao' => limpar_texto($p['consentimentoVersao'] ?? '', 20),
    ];
}

/** Tem login? É o que separa quem trabalha no painel de quem só está na lista. */
function tem_conta(array $p): bool
{
    return $p['usuario'] !== '' && $p['hash'] !== '';
}

function ler_pessoas(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }

    /* Aqui rodava a conversão dos quatro cadastros antigos — `usuarios.php`,
       `inscricoes.php`, `leads.php` e `candidatos.php` — para o registro único
       de pessoa. Ela cumpriu o papel e **saiu**: o que ficou foi um caminho de
       código que ninguém exercita mais e que só sabia fazer uma coisa —
       ressuscitar, na primeira leitura, exatamente os arquivos que a Manutenção
       acabou de apagar. Zerar e ver tudo voltar não é um risco teórico.

       Se um dia algum daqueles arquivos reaparecer numa hospedagem esquecida,
       ele fica onde está: sem ninguém para lê-lo, é só um arquivo velho. */

    $cache = [];
    if (is_file(ARQ_PESSOAS)) {
        $bruto = @include ARQ_PESSOAS;
        foreach (is_array($bruto) ? $bruto : [] as $p) {
            if ($limpo = normalizar_pessoa($p)) {
                $cache[] = $limpo;
            }
        }
    }
    return $cache;
}

function gravar_pessoas(array $pessoas): bool
{
    preparar_pastas();
    $limpos = [];
    foreach ($pessoas as $p) {
        if ($limpo = normalizar_pessoa($p)) {
            $limpos[] = $limpo;
        }
    }
    $conteudo = "<?php\n// Gerado pelo painel. Dado pessoal — não versionar, não editar à mão.\nreturn "
        . var_export($limpos, true) . ";\n";

    if (!gravar_atomico(ARQ_PESSOAS, $conteudo)) {
        return false;
    }
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_PESSOAS, true);
    }
    ler_pessoas(true);
    return true;
}

/** Quem tem login — é isto que a tela de contas e o "primeiro admin" olham. */
function contas(): array
{
    return array_values(array_filter(ler_pessoas(), 'tem_conta'));
}

function achar_pessoa(string $id): ?array
{
    foreach (ler_pessoas() as $p) {
        if ($p['id'] === $id && $id !== '') {
            return $p;
        }
    }
    return null;
}

/** Pelo login. Caso-insensível: ninguém lembra se cadastrou com maiúscula. */
function pessoa_por_usuario(string $usuario): ?array
{
    $usuario = mb_strtolower(trim($usuario));
    foreach (ler_pessoas() as $p) {
        if ($p['usuario'] !== '' && mb_strtolower($p['usuario']) === $usuario) {
            return $p;
        }
    }
    return null;
}

/**
 * Quem está tentando entrar — pelo LOGIN ou pelo E-MAIL.
 *
 * Ninguém decora o login que a coordenação escolheu por ele; todo mundo sabe o
 * próprio e-mail. Aceitar os dois na mesma caixa custa uma varredura e evita a
 * mensagem no WhatsApp perguntando "qual era mesmo o meu usuário?".
 *
 * Duas regras que não são zelo:
 *
 *   1. **o login ganha do e-mail.** Se as duas coisas casarem, quem manda é o
 *      login — ele é único por construção (`validar_nome_usuario()` recusa o
 *      `@`, então texto com arroba nunca é login e as buscas não se cruzam);
 *   2. **e-mail repetido não abre conta nenhuma.** O e-mail não é único: o da
 *      coordenação já está em ficha de mais de uma pessoa, e casal que divide
 *      caixa de entrada é comum. Com dois achados não há como saber qual conta
 *      abrir, e escolher por inferência é entregar a sessão de alguém.
 */
function pessoa_por_login(string $texto): ?array
{
    $alvo = mb_strtolower(trim($texto));
    if ($alvo === '') {
        return null;
    }
    if (($pelo_login = pessoa_por_usuario($alvo)) !== null) {
        return $pelo_login;
    }
    if (!str_contains($alvo, '@')) {
        return null;
    }

    $achados = [];
    foreach (ler_pessoas() as $p) {
        /* Só quem TEM conta: e-mail de quem só apareceu num encontro não é
           porta de entrada de coisa nenhuma. */
        if (tem_conta($p) && $p['email'] !== '' && mb_strtolower($p['email']) === $alvo) {
            $achados[] = $p;
        }
    }
    return count($achados) === 1 ? $achados[0] : null;
}

/**
 * Pelo telefone — a chave natural.
 *
 * Devolve TODAS, e não a primeira: casa que divide celular tem duas pessoas no
 * mesmo número, e escolher uma por conta própria foi exatamente o defeito que a
 * tela de presença teve que consertar.
 */
function pessoas_por_telefone(string $telefone): array
{
    $telefone = so_digitos($telefone);
    if ($telefone === '') {
        return [];
    }
    return array_values(array_filter(ler_pessoas(), fn ($p) => $p['telefone'] === $telefone));
}

/**
 * Sobrou alguém que administra?
 *
 * Chamada antes de tirar a capacidade `adm` de alguém ou desativá-lo: sem esta
 * checagem dá para o último administrador se rebaixar sozinho e ninguém mais
 * conseguir criar contas nem mexer em permissão.
 */
function tem_admin_ativo(?string $ignorarId = null): bool
{
    foreach (ler_pessoas() as $p) {
        if (in_array('adm', $p['capacidades'], true) && $p['ativo'] && tem_conta($p) && $p['id'] !== $ignorarId) {
            return true;
        }
    }
    return false;
}

/** '' quando serve; senão o motivo para mostrar na tela. */
function validar_senha(string $senha): string
{
    if (mb_strlen($senha) < SENHA_MIN) {
        return 'A senha precisa de pelo menos ' . SENHA_MIN . ' caracteres.';
    }
    if (preg_match('/^\s|\s$/u', $senha)) {
        return 'A senha não pode começar nem terminar com espaço.';
    }
    return '';
}

function validar_nome_usuario(string $usuario): string
{
    if (!preg_match('/^[a-z0-9][a-z0-9._-]{2,23}$/', $usuario)) {
        return 'O login usa de 3 a 24 caracteres: letras minúsculas, números, ponto, hífen ou _.';
    }
    return '';
}

/**
 * Senha provisória legível: o admin lê em voz alta sem errar e a pessoa digita
 * no celular sem trocar de teclado — só letra e número, sem hífen nem símbolo.
 * SENHA_MIN caracteres do alfabeto sem ambíguos já dão ~40 bits, e quem entra
 * com ela cai em conta.php obrigado a trocar.
 */
function senha_provisoria(): string
{
    $alfabeto = 'abcdefghijkmnpqrstuvwxyz23456789';  // sem l/o/0/1, que se confundem
    $senha = '';
    for ($i = 0; $i < SENHA_MIN; $i++) {
        $senha .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
    }
    return $senha;
}

function novo_id_pessoa(): string
{
    return bin2hex(random_bytes(8));
}

/* ===================== força bruta ===================== */

function estado_tentativas(): array
{
    $bruto = is_file(ARQ_TENTATIVAS) ? @include ARQ_TENTATIVAS : null;
    return is_array($bruto) ? $bruto : [];
}

function gravar_tentativas(array $tudo): void
{
    gravar_atomico(
        ARQ_TENTATIVAS,
        "<?php\n// Gerado pelo painel. Contagem de erro de senha.\nreturn " . var_export($tudo, true) . ";\n"
    );
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_TENTATIVAS, true);
    }
}

/** O bloqueio é por login: errar o meu não tranca o dos outros. */
function bloqueado_ate(string $usuario): int
{
    $chave = mb_strtolower($usuario);
    $ate = (int) (estado_tentativas()[$chave]['ate'] ?? 0);
    return $ate > time() ? $ate : 0;
}

function registrar_falha(string $usuario): void
{
    preparar_pastas();
    $chave = mb_strtolower($usuario);
    $tudo = estado_tentativas();
    $atual = is_array($tudo[$chave] ?? null) ? $tudo[$chave] : ['contagem' => 0, 'ate' => 0];

    $atual['contagem'] = ((int) ($atual['contagem'] ?? 0)) + 1;
    if ($atual['contagem'] >= MAX_TENTATIVAS) {
        $atual['ate'] = time() + BLOQUEIO_SEG;
        $atual['contagem'] = 0;
    }
    $tudo[$chave] = $atual;

    // some com o que já expirou, para o arquivo não crescer sem fim
    $agora = time();
    foreach ($tudo as $k => $v) {
        if ($k !== $chave && ((int) ($v['ate'] ?? 0)) < $agora && ((int) ($v['contagem'] ?? 0)) === 0) {
            unset($tudo[$k]);
        }
    }
    gravar_tentativas($tudo);
}

function limpar_falhas(string $usuario): void
{
    $chave = mb_strtolower($usuario);
    $tudo = estado_tentativas();
    if (isset($tudo[$chave])) {
        unset($tudo[$chave]);
        gravar_tentativas($tudo);
    }
}

/* ===================== sessão ===================== */

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

/* ===================== tema (claro / escuro / sistema) ===================== */

/** Os três estados. 'sistema' não estampa nada e deixa o CSS decidir.
    TEMAS_PAINEL, e não TEMAS: o agenda.php já usa TEMAS para as cores do cartão. */
const TEMAS_PAINEL = ['claro', 'escuro', 'sistema'];

/**
 * O tema escolhido, vindo do cookie.
 *
 * Lido antes de a página ser desenhada, para o <html> já sair com data-tema — é
 * isso que impede a piscada de tema errado no carregamento. Cookie, e não
 * sessão, porque a escolha é do aparelho: a mesma pessoa pode querer claro no
 * computador do trabalho e escuro no celular.
 */
function tema_atual(): string
{
    $t = (string) ($_COOKIE[COOKIE_TEMA] ?? 'sistema');
    return in_array($t, TEMAS_PAINEL, true) ? $t : 'sistema';
}

function gravar_tema(string $tema): void
{
    if (!in_array($tema, TEMAS_PAINEL, true)) {
        return;
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    setcookie(COOKIE_TEMA, $tema, [
        'expires'  => time() + 31536000,   // um ano
        'path'     => '/painel',
        'httponly' => false,               // o botão troca na hora pelo JS também
        'secure'   => $https,
        'samesite' => 'Lax',
    ]);
    $_COOKIE[COOKIE_TEMA] = $tema;
}

function token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function token_valido(): bool
{
    return !empty($_SESSION['csrf'])
        && is_string($_POST['csrf'] ?? null)
        && hash_equals($_SESSION['csrf'], $_POST['csrf']);
}

function derrubar_sessao(): void
{
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function entrar_como(array $u): void
{
    session_regenerate_id(true);
    $_SESSION['uid'] = $u['id'];
    $_SESSION['visto'] = time();
    marcar_acesso($u['id']);
}

/**
 * Quem está logado agora — relido do disco a cada requisição, de propósito:
 * tirar a permissão de alguém tem efeito na hora, sem esperar a sessão vencer.
 */
/**
 * A CONTA de um telefone, ou null.
 *
 * Diferente de `pessoas_por_telefone()`, que devolve qualquer pessoa: esta só
 * olha quem tem login. Existe para a página pública de presença reconhecer quem
 * já é do time sem perguntar de novo nome, bairro e cidade.
 */
function usuario_por_telefone(string $telefone): ?array
{
    foreach (pessoas_por_telefone($telefone) as $p) {
        if (tem_conta($p)) {
            return $p;
        }
    }
    return null;
}

function usuario_atual(): ?array
{
    static $memo = false;
    if ($memo !== false) {
        return $memo;
    }
    $memo = null;

    $id = (string) ($_SESSION['uid'] ?? '');
    if ($id === '') {
        return null;
    }
    if ((time() - (int) ($_SESSION['visto'] ?? 0)) > SESSAO_SEG) {
        derrubar_sessao();
        return null;
    }
    $u = achar_pessoa($id);
    if ($u === null || !$u['ativo']) {
        derrubar_sessao();
        return null;
    }
    $_SESSION['visto'] = time();
    $memo = $u;
    return $memo;
}

function autenticado(): bool
{
    return usuario_atual() !== null;
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

function rotulo_do_acesso(array $p): string
{
    if (in_array('adm', $p['capacidades'], true)) {
        return 'Administração';
    }
    $nomes = [];
    foreach ($p['capacidades'] as $c) {
        $nomes[] = CAPACIDADES[$c]['nome'] ?? $c;
    }
    if ($nomes !== []) {
        return implode(' · ', $nomes);
    }
    return TIPOS_PESSOA[$p['tipo']] ?? 'Militante';
}

/** Administra? É uma capacidade, e não mais um "papel" à parte. */
function e_admin(): bool
{
    $u = usuario_atual();
    return $u !== null && in_array('adm', $u['capacidades'], true);
}

/** Tem a capacidade? `adm` responde sim para todas. */
function tem_capacidade(string $chave): bool
{
    $u = usuario_atual();
    if ($u === null) {
        return false;
    }
    return in_array('adm', $u['capacidades'], true) || in_array($chave, $u['capacidades'], true);
}

function pode(string $area): bool
{
    $u = usuario_atual();
    return $u !== null && in_array($area, $u['areas'], true);
}

/** As áreas que a pessoa logada realmente abre, na ordem da constante. */
function areas_do_usuario(): array
{
    return array_values(array_filter(array_keys(AREAS), 'pode'));
}

function marcar_acesso(string $id): void
{
    $pessoas = ler_pessoas();
    foreach ($pessoas as &$p) {
        if ($p['id'] === $id) {
            $p['ultimoAcesso'] = date('c');
            gravar_pessoas($pessoas);
            return;
        }
    }
}

/** Porteiro das páginas que não têm tela de login própria. */
function exigir_login(): void
{
    $u = usuario_atual();
    if ($u === null) {
        header('Location: /painel/?volta=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/painel/'), true, 302);
        exit;
    }
    // senha provisória: não passa daqui sem trocar
    if ($u['trocarSenha'] && basename((string) ($_SERVER['SCRIPT_NAME'] ?? '')) !== 'conta.php') {
        header('Location: /painel/conta.php', true, 302);
        exit;
    }
}

function exigir_area(string $area): void
{
    exigir_login();
    if (!pode($area)) {
        header('Location: /painel/?negado=' . rawurlencode($area), true, 302);
        exit;
    }
}

function exigir_admin(): void
{
    exigir_login();
    if (!e_admin()) {
        header('Location: /painel/?negado=usuarios', true, 302);
        exit;
    }
}
