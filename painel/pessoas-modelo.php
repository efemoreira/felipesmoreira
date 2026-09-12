<?php
declare(strict_types=1);

/**
 * O modelo da pessoa — UMA pessoa, e não quatro.
 *
 * `normalizar_pessoa()` é a única resposta para "o que é um registro válido",
 * e `ler_pessoas()`/`gravar_pessoas()` são a única porta para
 * `dados/pessoas.php`. Saiu de `sessao.php` pelo mesmo motivo de
 * `dominio.php`: a sessão precisa do modelo, mas o modelo não é sessão.
 *
 * Os caminhos (`ARQ_PESSOAS`, `PASTA_DADOS`) e `gravar_atomico()` continuam em
 * `sessao.php`, que inclui este arquivo depois de defini-los.
 */

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
    /* O que nenhuma capacidade concede, o ajuste fino também não concede: sem
       `adm`, `pessoas` e `caixa` caem aqui, mesmo que estejam no arquivo — é o
       que corrige uma ficha gravada antes desta regra na próxima escrita. */
    $areas = in_array('adm', $capacidades, true)
        ? array_keys(AREAS)
        : array_values(array_diff(
            array_intersect(array_keys(AREAS), array_unique($pedidas)),
            areas_so_adm(),
        ));

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

        /* ---- de que rede profissional ela faz parte ----
           Mesmo padrão de `capacidades`: chave que não existe no catálogo some,
           porque o arquivo é gravado por mais de uma tela. */
        'redes' => array_values(array_filter(
            array_unique(array_map(
                fn ($r) => (string) $r,
                is_array($p['redes'] ?? null) ? $p['redes'] : []
            )),
            fn ($r) => isset(REDES[$r])
        )),

        /* ---- o grupo de quem lidera ----
           Só faz sentido para quem acompanha gente: é o link do sub-grupo dela.
           Fica na FICHA, e não numa constante, porque assim um líder novo entra
           sem deploy — e porque um mapa `chave => link` no código teria de ser
           mantido em sincronia com o campo `lider` das fichas, que é onde a
           divisão de fato mora. */
        /* `limpar_link()` mora em `agenda-comum.php`, que depende DESTE arquivo:
           chamá-la aqui inverteria a dependência. A régua é curta e basta —
           convite de grupo é sempre https, e o que não for vira vazio em vez de
           virar um `javascript:` colado numa tela do painel. */
        'grupo' => str_starts_with(mb_strtolower(trim((string) ($p['grupo'] ?? ''))), 'https://')
            ? limpar_texto($p['grupo'], 200) : '',

        /* ---- quem acompanha esta pessoa ----
           Um id de pessoa, e nada mais. É a camada que faltava entre o
           coordenador e oitenta e sete pessoas: sem ela tudo funila em quem tem
           `coordenacao`, que é uma pessoa só, e "não consigo acompanhar todos"
           deixa de ser falta de disciplina e passa a ser aritmética. */
        'lider' => limpar_texto($p['lider'] ?? '', 40),

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

function novo_id_pessoa(): string
{
    return bin2hex(random_bytes(8));
}
