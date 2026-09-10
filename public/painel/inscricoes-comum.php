<?php
declare(strict_types=1);

/**
 * Dados das inscrições da militância — compartilhado entre o formulário público
 * (api/inscricao.php) e a tela de aprovação (inscricoes.php).
 *
 * Só define funções, não faz nada sozinho: quem inclui é que decide se exige
 * login. O endpoint público inclui sem exigir; a tela de aprovação exige a área.
 *
 * As inscrições ficam em dados/inscricoes.php — arquivo PHP, e não JSON, porque
 * o .htaccess de /dados só bloqueia .php. Um .json ali é baixável pela web, e
 * aqui tem telefone e e-mail de gente de verdade.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/leituras-comum.php';  // o placar e o funil de origens, a militância por região — leitura, não inscrição

const ARQ_LIMITE     = PASTA_DADOS . '/inscricoes-limite.php';
const ARQ_FUNCOES    = __DIR__ . '/../funcoes.json';

/** Versão do texto de consentimento aceito no formulário. */
const VERSAO_CONSENTIMENTO = '1';

/** Teto por IP: segura enxurrada sem atrapalhar a família que se inscreve junta. */
/* A mesa da recepção: uma fila inteira sai do mesmo Wi‑Fi do local, em minutos.
   Alto o bastante para um encontro de verdade caber, baixo o bastante para
   quem quisesse varrer faixas de telefone não ter tentativa infinita. */
const LIMITE_PRESENCA_HORA = 60;
const LIMITE_PRESENCA_DIA  = 400;

const LIMITE_POR_HORA = 5;
const LIMITE_POR_DIA  = 20;

/* ===================== catálogo de funções ===================== */

/**
 * Lê o funcoes.json que o build copia para a raiz (ver publish.yml).
 * É a mesma fonte que o formulário usa — sem lista repetida em duas linguagens.
 */
/**
 * Login a partir do nome: "Maria de Sousa Lima" -> "maria.lima".
 * Acrescenta número se já existir, e completa se ficar curto demais para a
 * regra de validar_nome_usuario() (mínimo 3 caracteres).
 */
function login_sugerido(string $nome): string
{
    /* `sem_acento()` e não `iconv('ASCII//TRANSLIT')`: o TRANSLIT depende da
       libc, e "Antônio" vira "antonio" no Linux da Hostinger e "antnio" no
       macOS. Login é identificador permanente de uma pessoa — não pode depender
       da máquina em que a inscrição foi aprovada. */
    $ascii = strtolower(preg_replace('/[^a-zA-Z ]/', '', sem_acento($nome)) ?? '');

    $partes = array_values(array_filter(explode(' ', $ascii)));
    // ignora as partículas do meio (de, da, dos…) na hora de montar o login
    $uteis = array_values(array_filter($partes, fn ($p) => !in_array($p, ['de', 'da', 'do', 'das', 'dos', 'e'], true)));
    if ($uteis === []) {
        $uteis = $partes;
    }

    $base = $uteis[0] ?? 'militante';
    if (count($uteis) > 1) {
        $base .= '.' . end($uteis);
    }
    $base = substr($base, 0, 20);
    while (strlen($base) < 3) {
        $base .= 'x';
    }

    $tentativa = $base;
    $n = 2;
    while (pessoa_por_usuario($tentativa) !== null) {
        $tentativa = substr($base, 0, 20) . $n;
        $n++;
    }
    return $tentativa;
}

function catalogo_funcoes(): array
{
    static $memo = null;
    if ($memo !== null) {
        return $memo;
    }
    $memo = ['funcoes' => [], 'porId' => []];
    if (is_file(ARQ_FUNCOES)) {
        $bruto = json_decode((string) @file_get_contents(ARQ_FUNCOES), true);
        if (is_array($bruto) && is_array($bruto['funcoes'] ?? null)) {
            $memo['funcoes'] = $bruto['funcoes'];
            foreach ($bruto['funcoes'] as $f) {
                if (!empty($f['id'])) {
                    $memo['porId'][(string) $f['id']] = $f;
                }
            }
        }
    }
    return $memo;
}

/** Nome de exibição da função; devolve o próprio id se o catálogo não tiver. */
/**
 * A régua de campo da inscrição — a mesma que `api/inscricao.php` aplica.
 *
 * Devolve `''` quando passa, ou a frase da recusa. Ela existe como FUNÇÃO, e
 * não como um bloco de `if` dentro do endpoint, por um motivo só: há uma
 * segunda cópia dela em `src/features/inscricao/validacao.ts`, e as duas têm
 * de concordar. Enquanto a régua estava solta no meio do endpoint não havia
 * como chamá-la de fora, e o par ficava sem quem conferisse.
 *
 * **A divergência que dói tem direção.** Se o servidor recusar algo que a tela
 * aceitou, a pessoa preenche tudo, passa por todas as marcas verdes e leva um
 * "não deu" genérico no fim — e vai embora. O contrário (o servidor aceitar
 * mais do que a tela pede) é de propósito: aqui é endpoint público, e a régua
 * de lá é mais dura para ajudar quem digita, não para barrar.
 *
 * @param array $campos nome, telefone, email, cidade e bairro, já limpos
 */
function recusa_de_inscricao(array $campos): string
{
    $nome = preg_replace('/\s+/u', ' ', (string) ($campos['nome'] ?? '')) ?? '';

    if (mb_strlen($nome) < 5 || mb_strpos($nome, ' ') === false) {
        return 'Escreva seu nome completo.';
    }
    $telefone = (string) ($campos['telefone'] ?? '');
    if (strlen($telefone) < 10 || strlen($telefone) > 11) {
        return 'Confira o WhatsApp: use DDD + número.';
    }
    $email = (string) ($campos['email'] ?? '');
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'Esse e-mail parece incompleto.';
    }
    if ((string) ($campos['cidade'] ?? '') === '' || (string) ($campos['bairro'] ?? '') === '') {
        return 'Escolha sua cidade na lista e diga seu bairro.';
    }
    /* Função é OPCIONAL. Quem chegou disposto e ainda não sabe onde encaixa é
       militante do mesmo jeito — recusar aqui trocaria um militante novo por
       uma linha de relatório, o mesmo erro que a `origem` evita. Sem escolha,
       a aprovação assume "onde-precisar" (ver inscricoes.php). */
    return '';
}

function nome_funcao(string $id): string
{
    return (string) (catalogo_funcoes()['porId'][$id]['nome'] ?? $id);
}

/** Descarta id que não existe no catálogo — nada de função inventada no POST. */
function funcoes_validas(array $pedidas): array
{
    $porId = catalogo_funcoes()['porId'];
    $limpo = [];
    foreach ($pedidas as $id) {
        $id = limpar_texto($id, 40);
        if ($id !== '' && isset($porId[$id]) && !in_array($id, $limpo, true)) {
            $limpo[] = $id;
        }
    }
    return $limpo;
}

/** Áreas do painel sugeridas para quem escolheu estas funções. */
function areas_sugeridas(array $funcoes): array
{
    $porId = catalogo_funcoes()['porId'];
    $areas = [];
    foreach ($funcoes as $id) {
        foreach ((array) ($porId[$id]['areas'] ?? []) as $a) {
            if (isset(AREAS[$a]) && !in_array($a, $areas, true)) {
                $areas[] = $a;
            }
        }
    }
    return array_values(array_intersect(array_keys(AREAS), $areas));
}

/* ===================== inscrições ===================== */

/**
 * De onde veio a inscrição — o `?de=` da URL de /queroajudar.
 *
 * Carrega duas perguntas no mesmo campo, porque na prática são a mesma:
 * `?de=joao-silva` diz **quem trouxe**, `?de=live-domingo` diz **de onde veio**.
 * Sem isso não há como saber qual militante recruta e qual canal converte, que
 * são as duas contas que governam o crescimento.
 *
 * Vira slug na entrada de propósito: o valor chega de link colado por qualquer
 * pessoa, e um rótulo livre viraria "João Silva", "joao silva" e "JOÃO" como
 * três origens diferentes no relatório. Nunca use `iconv('ASCII//TRANSLIT')`
 * aqui — o resultado muda entre o Linux da Hostinger e o macOS.
 */
function normalizar_origem($bruto): string
{
    $texto = limpar_texto($bruto ?? '', 60);
    if ($texto === '') {
        return '';
    }
    $slug = strtolower(sem_acento($texto));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    return trim($slug, '-');
}

/**
 * Quanto tempo uma inscrição pode dormir antes de virar urgência no hub.
 *
 * O vão entre se inscrever e ser aprovado é onde mais se perde gente: ela está
 * no pico de entusiasmo que vai ter, e depende de um humano decidir.
 */
const HORAS_LIMITE_INSCRICAO = 48;

/**
 * A inscrição deixou de ser um cadastro à parte.
 *
 * Era `dados/inscricoes.php`, com nome, telefone, cidade e bairro repetidos — os
 * mesmos campos que a conta do painel e a ficha de presença guardavam, da mesma
 * pessoa. Quem se inscrevia e depois aparecia num encontro virava duas linhas
 * que ninguém cruzava.
 *
 * Agora a inscrição é um ESTADO da pessoa (`status = 'pendente'`) e as funções
 * que ela pediu ficam no `funcoes` dela. A fila é `fila_de_entrada()`, em
 * `pessoas-comum.php`.
 */

/** As iniciais do nome, para o cartão ter um rosto. */
function iniciais(string $nome): string
{
    $partes = array_values(array_filter(explode(' ', trim($nome))));
    if ($partes === []) {
        return '?';
    }
    $primeira = mb_strtoupper(mb_substr($partes[0], 0, 1));
    $ultima = count($partes) > 1 ? mb_strtoupper(mb_substr((string) end($partes), 0, 1)) : '';
    return $primeira . $ultima;
}

/** Há quanto tempo esta pessoa espera a coordenação decidir. */
function horas_na_fila(array $pessoa): int
{
    $t = strtotime($pessoa['criadoEm'] ?? '');
    return $t === false ? 0 : (int) floor((time() - $t) / 3600);
}

/**
 * Uma pessoa já cadastrada com este telefone, ou null.
 *
 * Continua existindo porque o endpoint público precisa saber se o número já é
 * conhecido antes de criar mais uma ficha. Devolve a primeira: aqui a pergunta
 * é "esse número já entrou?", e não "qual das duas pessoas do número é você" —
 * essa é da tela de presença, que usa `pessoas_por_telefone()`.
 */
function inscricao_por_telefone(string $telefone): ?array
{
    $achadas = pessoas_por_telefone($telefone);
    return $achadas[0] ?? null;
}

/* ===================== limite por IP ===================== */

/* segredo() mora no sessao.php: é segredo do site inteiro, não das
   inscrições — as aulas também derivam o token de convite dele. */

function chave_visitante(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    // A Hostinger fica atrás de proxy; o primeiro da lista é o cliente.
    $enc = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($enc !== '') {
        $partes = explode(',', $enc);
        $primeiro = trim($partes[0]);
        if (filter_var($primeiro, FILTER_VALIDATE_IP)) {
            $ip = $primeiro;
        }
    }
    return substr(hash_hmac('sha256', $ip, segredo()), 0, 24);
}

function estado_limite(): array
{
    if (!is_file(ARQ_LIMITE)) {
        return [];
    }
    $v = @include ARQ_LIMITE;
    return is_array($v) ? $v : [];
}

/**
 * true quando o visitante já passou do teto e deve ser barrado.
 *
 * O ESCOPO existe porque os dois usos não se parecem em nada.
 *
 * A inscrição é uma vez na vida por pessoa: cinco por hora do mesmo endereço já
 * é comportamento estranho. A presença é uma fila numa porta — trinta pessoas
 * lendo o mesmo QR, quase todas no mesmo Wi‑Fi do local, no mesmo quarto de
 * hora. Com o teto da inscrição, a sexta pessoa da fila levaria "você já se
 * cadastrou há pouco" e iria embora sem entrar na lista.
 *
 * O teto da presença continua existindo (a busca por telefone devolve nome, e
 * sem teto isso seria um oráculo para varrer faixas de número), só é alto o
 * bastante para caber um evento de verdade.
 */
function passou_do_limite(string $escopo = 'inscricao', int $porHora = LIMITE_POR_HORA, int $porDia = LIMITE_POR_DIA): bool
{
    $agora = time();
    $reg = estado_limite()[chave_visitante() . ':' . $escopo] ?? null;
    if (!is_array($reg)) {
        return false;
    }
    $hora = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 3600);
    $dia  = array_filter((array) ($reg['envios'] ?? []), fn ($t) => $t > $agora - 86400);
    return count($hora) >= $porHora || count($dia) >= $porDia;
}

function registrar_envio(string $escopo = 'inscricao'): void
{
    preparar_pastas();
    $agora = time();
    $chave = chave_visitante() . ':' . $escopo;
    $tudo = estado_limite();

    $envios = (array) ($tudo[$chave]['envios'] ?? []);
    $envios[] = $agora;
    // guarda só a janela de 24h, senão o arquivo cresce sem fim
    $tudo[$chave] = ['envios' => array_values(array_filter($envios, fn ($t) => $t > $agora - 86400))];

    foreach ($tudo as $k => $v) {
        $restantes = array_filter((array) ($v['envios'] ?? []), fn ($t) => $t > $agora - 86400);
        if ($restantes === []) {
            unset($tudo[$k]);
        }
    }

    gravar_atomico(ARQ_LIMITE, "<?php\nreturn " . var_export($tudo, true) . ";\n");
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate(ARQ_LIMITE, true);
    }
}

/* ===================== convidar a fila para um encontro ===================== */

/**
 * A FUNÇÃO QUE ESTA PESSOA PEDIU, para dizer o nome dela na mensagem.
 *
 * Devolve '' quando não dá para dizer nada de específico. `onde-precisar` conta
 * como nada de propósito: ele aparece em quase metade das inscrições, quase
 * sempre JUNTO de outra escolha — é "e também onde precisar", não uma função.
 * Escrever "você pediu para ajudar em Onde precisar" seria devolver à pessoa a
 * própria indecisão como se fosse um convite.
 */
function funcao_pedida(array $pessoa): string
{
    foreach ($pessoa['funcoes'] as $id) {
        if ($id !== 'onde-precisar' && $id !== '') {
            return nome_funcao($id);
        }
    }
    return '';
}

/**
 * O CONVITE DE UMA PESSOA DA FILA PARA UM ENCONTRO, pronto para o WhatsApp.
 *
 * Existe porque a fila já tinha o telefone e já desenhava o botão do WhatsApp —
 * sem texto nenhum, abrindo conversa vazia. Com setenta e duas pessoas
 * esperando, "escrever a mensagem" era o trabalho que não acontecia, e a fila
 * envelhecia.
 *
 * **O LINK É O DO ENCONTRO, e não o do /queroajudar.** Quem abre `/presenca?c=…`
 * confirma presença NAQUELE encontro, e a própria tela oferece a inscrição
 * depois, já com a origem preenchida (`PresencaClient.tsx`, a ponte por
 * `sessionStorage`). Uma leitura, três resultados — presença, inscrição e
 * atribuição. Foi essa diferença que custou o vínculo de 59 pessoas que vieram
 * do evento de 05/09 por um QR que apontava para o formulário puro.
 *
 * A FUNÇÃO PEDIDA ENTRA NO TEXTO porque existe para 81% da fila, e é o que faz o
 * convite ser daquela pessoa e não de uma lista. Quem não pediu nada recebe a
 * versão curta, sem a frase — nunca um rótulo genérico no lugar dela.
 *
 * @param array $pessoa a ficha de quem está na fila
 * @param array $evento o encontro já normalizado
 */
function mensagem_de_convite(array $pessoa, array $evento): string
{
    require_once __DIR__ . '/eventos-comum.php';  // url_confirmacao(), data_cheia()

    $primeiro = primeiro_nome($pessoa['nome']);
    $quando   = data_cheia($evento);
    $onde     = $evento['local'] !== '' ? ' · ' . $evento['local'] : '';
    $funcao   = funcao_pedida($pessoa);

    $texto = "Oi, {$primeiro}! Aqui é da Missão Ceará.\n\n"
           . "Sua inscrição chegou — e o primeiro passo é a gente se conhecer pessoalmente.\n\n"
           . "*{$evento['titulo']}*\n"
           . "{$quando}{$onde}\n\n";

    if ($funcao !== '') {
        $texto .= "Você pediu para ajudar em {$funcao}; lá a gente combina como.\n\n";
    }

    $link = url_confirmacao($evento);
    $texto .= $link !== ''
        ? "Confirma aqui que você vem:\n" . $link
        : 'Me responde aqui se você vem?';

    return $texto;
}

/* ===================== aprovar ===================== */

/**
 * UM LOGIN QUE AINDA NÃO EXISTE — nem no arquivo, nem no lote em curso.
 *
 * `login_sugerido()` já resolve colisão, mas contra `pessoa_por_usuario()`, que
 * lê o arquivo **gravado**. Num lote com dois "João Silva" os dois recebem
 * `joao.silva`, e o segundo sobrescreve o login do primeiro — sem erro, sem
 * aviso, e só se descobre quando alguém não consegue entrar.
 *
 * @param array $jaUsados os logins entregues antes nesta mesma gravação
 */
function login_livre(string $nome, array $jaUsados): string
{
    $base = login_sugerido($nome);
    if (!in_array($base, $jaUsados, true)) {
        return $base;
    }
    /* O sufixo continua o do `login_sugerido()`, mas contando também o lote:
       `joao.silva`, `joao.silva2`, `joao.silva3`. */
    $n = 2;
    do {
        $tentativa = substr($base, 0, 20) . $n;
        $n++;
    } while (in_array($tentativa, $jaUsados, true) || pessoa_por_usuario($tentativa) !== null);
    return $tentativa;
}

/**
 * DÁ CONTA À FICHA QUE JÁ EXISTE — o corpo da aprovação, de uma ou de trinta.
 *
 * Aprovar NÃO cria uma segunda ficha. Antes a inscrição virava um usuário novo e
 * a inscrição ficava para trás, então a mesma pessoa passava a existir duas
 * vezes — e o histórico de encontros dela ficava preso na ficha antiga.
 *
 * Saiu da ação para cá quando o lote nasceu: aprovar uma e aprovar trinta
 * precisam ser o MESMO caminho de código, ou a regra acima passa a valer só
 * para quem for aprovado pelo botão de baixo.
 *
 * Mexe no array recebido por referência e **não grava**: quem chama decide
 * quando escrever, e o lote escreve uma vez só no fim.
 *
 * @return ?array o acesso criado (nome, usuario, senha, telefone), ou null
 */
function aprovar_pessoa(array &$pessoas, string $id, string $login, array $caps, array $areas, array $eu, string $lider = ''): ?array
{
    $provisoria = senha_provisoria();
    $achou = null;

    foreach ($pessoas as &$p) {
        if ($p['id'] !== $id) {
            continue;
        }
        $p['usuario'] = $login;
        $p['hash']    = password_hash($provisoria, PASSWORD_DEFAULT);
        $p['ativo']   = true;
        $p['trocarSenha'] = true;
        $p['capacidades'] = $caps;
        $p['areas']   = $areas;
        $p['status']  = 'aprovada';
        $p['tipo']    = (in_array('coordenacao', $caps, true)
            || in_array('adm', $caps, true)) ? 'coordenador' : 'militante';
        $p['decididoEm']  = date('c');
        $p['decididoPor'] = $eu['nome'];
        /* Só preenche quando ainda não há ninguém: um lote não desfaz o que
           alguém combinou na ficha antes. */
        if ($lider !== '' && $p['lider'] === '') {
            $p['lider'] = $lider;
        }
        /* Inscrição sem função é válida (o formulário deixou de exigir).
           "onde-precisar" existe no catálogo exatamente para isso — deixar o
           array vazio faria o hub não ter atalho nenhum para a pessoa. */
        if ($p['funcoes'] === []) {
            $p['funcoes'] = ['onde-precisar'];
        }
        $achou = [
            'nome'     => $p['nome'],
            'usuario'  => $login,
            'senha'    => $provisoria,
            'telefone' => $p['telefone'],
            'funcoes'  => $p['funcoes'],
            /* Resolvido AQUI, com a ficha já atualizada: o líder acabou de ser
               marcado nesta mesma função, e `grupo_de()` lida a partir do
               arquivo devolveria o grupo antigo — o arquivo só é gravado depois. */
            'grupo'    => $lider === '' ? grupo_de($p) : grupo_de(['lider' => $lider]),
        ];
    }
    unset($p);

    return $achou;
}

/**
 * A MENSAGEM QUE ENTREGA O ACESSO — e a primeira tarefa junto.
 *
 * Antes ela dizia usuário e senha, e parava aí. Conta sem tarefa é conta que
 * nunca é usada: é o motivo `nao-entrou` do `reativacao.php` nascendo pronto, e
 * com setenta e duas aprovações de uma vez seriam setenta e duas contas mortas.
 *
 * **A FUNÇÃO PEDIDA ENTRA NO TEXTO.** Ela existe para 81% de quem se inscreve, e
 * é o que faz a mensagem ser daquela pessoa: "você pediu para ajudar na
 * Recepção" é diferente de "bem-vindo ao movimento". Quem não pediu nada recebe
 * a versão curta, sem a frase — nunca um rótulo genérico no lugar dela.
 *
 * @param array  $acesso  o que `aprovar_pessoa()` devolveu
 * @param ?array $proximo o próximo encontro, ou null quando não há nenhum
 */
function mensagem_de_acesso(array $acesso, ?array $proximo = null): string
{
    $texto = 'Olá, ' . primeiro_nome($acesso['nome']) . "! Aqui é da Missão Ceará.\n\n"
        . "Sua inscrição foi aprovada! Seu acesso:\n\n"
        . "Site: https://felipesmoreira.com/painel/\n"
        . 'Usuário: ' . $acesso['usuario'] . "\n"
        . 'Senha provisória: ' . $acesso['senha'] . "\n\n"
        . "No primeiro acesso o site vai pedir para você criar sua própria senha.\n\n";

    /* O GRUPO DELA, e não o geral: com a divisão por líder, quem chega cai num
       lugar com um punhado de gente e alguém que responde por ela. Mandar o
       grupo de todo mundo na primeira mensagem é entregar a pessoa a uma sala
       onde ninguém a chama pelo nome — que é como se perde quem acabou de
       dizer sim. */
    if (($acesso['grupo'] ?? '') !== '') {
        $texto .= "O seu grupo é este:\n" . $acesso['grupo'] . "\n\n";
    }

    $funcao = funcao_pedida(['funcoes' => $acesso['funcoes'] ?? []]);
    if ($funcao !== '') {
        $texto .= 'Você pediu para ajudar em *' . $funcao . "* — é por aí que a gente começa.\n\n";
    }

    if ($proximo !== null) {
        require_once __DIR__ . '/eventos-comum.php';  // data_cheia()
        $texto .= "E o próximo encontro é este:\n"
            . '*' . $proximo['titulo'] . "*\n"
            . data_cheia($proximo)
            . ($proximo['local'] !== '' ? ' · ' . $proximo['local'] : '') . "\n\n";
    }

    return $texto . 'Qualquer dúvida, é só chamar aqui. Bem-vindo(a)!';
}

/* ===================== o que esta área diz ao Início ===================== */

/**
 * O que está esperando por esta pessoa em `inscricoes` — a fila do Início e o selo do menu.
 *
 * Chamada por `tarefas_de()` (agora.php) para quem abre a área; o formato de
 * cada item está documentado lá. Registrar aqui, e não numa cadeia de `if` no
 * agora.php, é o que faz uma área nova entrar na fila sem tocar o hub.
 */
function pendencias_inscricoes(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $tarefas = [];

        /* ---------- Inscrições: quem está na porta ---------- */
        require_once __DIR__ . '/inscricoes-comum.php';
        require_once __DIR__ . '/pessoas-comum.php';

        $fila = fila_de_entrada();
        $novas = count($fila);
        $horas = 0;
        foreach ($fila as $i) {
            // a mais antiga manda no recado: é ela que está perdendo a pessoa
            $horas = max($horas, horas_na_fila($i));
        }
        if ($novas > 0) {
            /* Passou de 48h, o recado sobe para urgente. Não é burocracia de
               prazo: quem se inscreveu está no pico de entusiasmo no dia em que
               se inscreveu, e uma fila parada três dias devolve gente fria. */
            $parada = $horas >= HORAS_LIMITE_INSCRICAO;
            $dias = (int) floor($horas / 24);

            $tarefas[] = [
                'area'    => 'inscricoes',
                'icone'   => 'flag',
                'urgente' => $parada,
                'quantos' => $novas,
                'texto'   => $novas === 1
                    ? '1 pessoa esperando decisão'
                    : "{$novas} pessoas esperando decisão",
                'porque'  => $parada
                    ? "a mais antiga está parada há {$dias} " . ($dias === 1 ? 'dia' : 'dias')
                        . ' — quem espera demais não volta'
                    : 'quem se inscreveu ainda não tem acesso nem resposta',
                'url'     => '/painel/inscricoes.php',
            ];
        }

    return $tarefas;
}

/**
 * Os medidores de `inscricoes` — o retrato do time inteiro, para Leituras › Semana
 * e para a linha "A operação hoje" do Início. Formato em `panorama_de()`.
 */
function medidores_inscricoes(array $u): array
{
    require_once __DIR__ . '/agora.php';  // HORAS_SEM_SAIDA, degrau_de_prazo(), data_curta(), apelido_curto()
    $medidores = [];

        /* ---------- Inscrições: o vão entre se inscrever e ser aprovado ---------- */
        require_once __DIR__ . '/inscricoes-comum.php';
        require_once __DIR__ . '/pessoas-comum.php';

        $fila = fila_de_entrada();
        $horas = 0;
        foreach ($fila as $i) {
            $horas = max($horas, horas_na_fila($i));
        }
        $dias = (int) floor($horas / 24);
        $medidores[] = [
            'num'    => (string) count($fila),
            'rotulo' => 'Esperando entrar',
            'nota'   => $fila === []
                ? 'Ninguém parado na porta.'
                : ($horas >= HORAS_LIMITE_INSCRICAO
                    ? 'A mais antiga está parada há ' . $dias . ' ' . ($dias === 1 ? 'dia' : 'dias')
                        . ' — quem espera demais não volta.'
                    : 'Quem se inscreveu ainda não tem acesso nem resposta.'),
            'estado' => $fila === [] ? 'ok' : degrau_de_prazo($horas, HORAS_LIMITE_INSCRICAO),
            'url'    => '/painel/inscricoes.php',
        ];

    return $medidores;
}
