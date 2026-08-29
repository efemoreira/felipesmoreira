<?php
declare(strict_types=1);

/**
 * Dados das aulas — compartilhado entre a tela de gestão (aulas.php) e o
 * endpoint que alimenta o site (api/aulas.php).
 *
 * O CURRÍCULO em si não mora aqui: ele é fixo, versionado, e vem do
 * aulas-conteudo.php. O que muda com o uso são duas coisas, e é só disso que
 * este arquivo cuida:
 *
 *   dados/aulas.php            → qual vídeo está pendurado em cada aula
 *   dados/aulas-progresso.php  → quem já concluiu o quê
 *
 * Os dois são .php retornando array porque o .htaccess de /dados só bloqueia
 * .php e .json — e o progresso diz quem estudou o quê, que não é assunto de
 * quem tiver o link.
 */

require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/aulas-conteudo.php';

const ARQ_AULAS     = PASTA_DADOS . '/aulas.php';
const ARQ_PROGRESSO = PASTA_DADOS . '/aulas-progresso.php';

/* ===================== convite do Dia 0 ===================== */

/**
 * O Dia 0 aberto para quem ainda não tem conta.
 *
 * O vão entre se inscrever e ser aprovado é onde mais se perde gente: a pessoa
 * está no pico de entusiasmo e não tem nada para fazer. O Dia 0 (as regras de
 * todos, as fases da campanha, o fluxo da fonte) é justamente o que faz ela se
 * sentir parte antes de a coordenação decidir.
 *
 * **Nada disso muda a regra de ouro:** o conteúdo continua saindo só por este
 * endpoint, e nenhuma linha do manual entra no bundle do Next. O convidado
 * recebe um recorte do currículo, não uma cópia local.
 *
 * O token é derivado do segredo do site, não guardado: não há arquivo novo, ele
 * não some num deploy e não dá para adivinhar. Trocar o segredo invalida todos
 * os convites de uma vez, que é o botão de pânico se um link vazar longe demais.
 */
const DIA_ABERTO = 'dia-0';

function token_convite(): string
{
    return substr(hash_hmac('sha256', 'convite-aulas:' . DIA_ABERTO, segredo()), 0, 24);
}

/** `hash_equals` porque comparar segredo com `===` vaza tempo. */
function convite_valido(string $recebido): bool
{
    $recebido = trim($recebido);
    return $recebido !== '' && hash_equals(token_convite(), $recebido);
}

/** O link que a coordenação manda para quem acabou de se inscrever. */
function link_convite(): string
{
    return 'https://felipesmoreira.com/aulas?convite=' . token_convite();
}

/* ===================== vídeo de cada aula ===================== */

/**
 * Extrai o id de um vídeo do YouTube. Aceita o que a pessoa tiver na mão:
 * a URL da barra de endereço, o link curto do botão compartilhar, o link do
 * embed — ou o id puro, colado de outro lugar.
 *
 * Devolve '' quando não reconhece, e quem chama decide o que dizer.
 */
function id_de_video(string $bruto): string
{
    $bruto = trim($bruto);
    if ($bruto === '') {
        return '';
    }

    // id puro: 11 caracteres do alfabeto do YouTube
    if (preg_match('#^[A-Za-z0-9_-]{11}$#', $bruto) === 1) {
        return $bruto;
    }

    // youtu.be/ID · /watch?v=ID · /embed/ID · /live/ID · /shorts/ID
    $padroes = [
        '#youtu\.be/([A-Za-z0-9_-]{11})#',
        '#[?&]v=([A-Za-z0-9_-]{11})#',
        '#/(?:embed|live|shorts|v)/([A-Za-z0-9_-]{11})#',
    ];
    foreach ($padroes as $padrao) {
        if (preg_match($padrao, $bruto, $achou) === 1) {
            return $achou[1];
        }
    }

    return '';
}

/** Só guarda vídeo de aula que existe no currículo — id inventado não entra. */
function normalizar_videos($bruto): array
{
    if (!is_array($bruto)) {
        return [];
    }
    $limpo = [];
    foreach ($bruto as $aulaId => $v) {
        $aulaId = (string) $aulaId;
        if (!is_array($v) || aula_por_id($aulaId) === null) {
            continue;
        }
        $id = id_de_video((string) ($v['id'] ?? ''));
        if ($id === '') {
            continue;
        }
        $limpo[$aulaId] = [
            'provedor'     => 'youtube',
            'id'           => $id,
            'publicada'    => !empty($v['publicada']),
            'atualizadoEm' => limpar_texto($v['atualizadoEm'] ?? '', 40),
        ];
    }
    return $limpo;
}

function ler_videos(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_AULAS)) {
        $bruto = @include ARQ_AULAS;
        $cache = normalizar_videos(is_array($bruto) ? ($bruto['videos'] ?? []) : []);
    }
    return $cache;
}

function gravar_videos(array $videos): bool
{
    preparar_pastas();
    $limpos = normalizar_videos($videos);
    $php = "<?php\n// Gerado pelo painel. Vídeo de cada aula — o texto vive no repositório.\nreturn "
        . var_export(['videos' => $limpos], true) . ";\n";

    if (!gravar_atomico(ARQ_AULAS, $php)) {
        return false;
    }
    ler_videos(true);
    return true;
}

/**
 * As aulas que ensinam a usar esta ferramenta, na ordem do currículo.
 *
 * A ligação já existia num sentido só: a aula sabe apontar para a ferramenta
 * ("Fazer isto agora"). Esta é a volta — quem travou dentro da ferramenta acha
 * a aula sem precisar caçar na lista de 32.
 *
 * Compara pelo nome sem pasta nem extensão porque o currículo grava
 * "/painel/fatos" e a página é "fatos.php": quem casa os dois em produção é a
 * RewriteRule do publish.yml, que não existe aqui dentro.
 */
function aulas_da_ferramenta(string $caminho): array
{
    $alvo = pathinfo(trim($caminho, '/'), PATHINFO_FILENAME);
    if ($alvo === '') {
        return [];
    }

    $achadas = [];
    foreach (todas_as_aulas() as $aula) {
        $dela = (string) ($aula['ferramenta'] ?? '');
        if ($dela !== '' && pathinfo(trim($dela, '/'), PATHINFO_FILENAME) === $alvo) {
            $achadas[] = $aula;
        }
    }
    return $achadas;
}

/* ===================== progresso de cada pessoa ===================== */

/** Descarta usuário e aula que não existem mais — o arquivo se limpa sozinho. */
function normalizar_progresso($bruto): array
{
    if (!is_array($bruto)) {
        return [];
    }
    $limpo = [];
    foreach ($bruto as $usuarioId => $aulas) {
        $usuarioId = limpar_texto($usuarioId, 40);
        if ($usuarioId === '' || !is_array($aulas)) {
            continue;
        }
        $meu = [];
        foreach ($aulas as $aulaId => $quando) {
            $aulaId = (string) $aulaId;
            if (aula_por_id($aulaId) !== null) {
                $meu[$aulaId] = limpar_texto($quando, 40);
            }
        }
        if ($meu !== []) {
            $limpo[$usuarioId] = $meu;
        }
    }
    return $limpo;
}

function ler_progresso(bool $recarregar = false): array
{
    static $cache = null;
    if ($cache !== null && !$recarregar) {
        return $cache;
    }
    $cache = [];
    if (is_file(ARQ_PROGRESSO)) {
        $cache = normalizar_progresso(@include ARQ_PROGRESSO);
    }
    return $cache;
}

function gravar_progresso(array $tudo): bool
{
    preparar_pastas();
    $php = "<?php\n// Gerado pelo painel. Quem concluiu qual aula.\nreturn "
        . var_export(normalizar_progresso($tudo), true) . ";\n";

    if (!gravar_atomico(ARQ_PROGRESSO, $php)) {
        return false;
    }
    ler_progresso(true);
    return true;
}

/* ===================== o retrato de estudo de uma pessoa ===================== */

/**
 * Quantos dias sem concluir nada até a formação de alguém contar como travada.
 *
 * Sete, porque é o que o plano cobra: o vão entre "foi aprovado" e "já opera" é
 * onde mais se perde gente, e uma semana parada no meio da formação é o sinal
 * mais barato que existe de que alguém precisa de um empurrão — antes de a
 * pessoa sumir de vez.
 */
const DIAS_PARA_TRAVAR = 7;

/**
 * Onde esta pessoa está na formação: o que fez, quando parou e como está.
 *
 * `aulas_concluidas()` respondia "quais aulas", que é a pergunta de quem
 * desenha o /aulas. A coordenação faz outra: **quem precisa de empurrão hoje**.
 * Ela não se responde com percentual — 30% de currículo não diz se a pessoa
 * está andando devagar ou parou em maio.
 *
 * Os quatro estados saem só do que já está gravado, e nenhum deles inventa
 * carimbo novo:
 *
 *   sem-comecar → tem acesso e não concluiu nada
 *   travada     → começou, ainda não fechou as Pistas Rápidas, e a última
 *                 conclusão foi há mais de DIAS_PARA_TRAVAR dias
 *   andando     → concluiu algo dentro da janela
 *   rapidas-ok  → fechou o caminho principal; o resto é aprofundamento
 *
 * `dias` é `null` para quem não começou: dizer "0 dias parada" sobre quem nunca
 * abriu uma aula seria contar uma pausa que não existe.
 */
function retrato_de_estudo(string $usuarioId, ?int $agora = null): array
{
    $agora ??= time();
    $meu = ler_progresso()[$usuarioId] ?? [];

    $rapidasTodas = array_filter(todas_as_aulas(), fn ($a) => $a['pista'] === 'rapida');
    $rapidasFeitas = count(array_filter($rapidasTodas, fn ($a) => isset($meu[$a['id']])));

    /* O carimbo de cada conclusão já está no arquivo de progresso; o mais
       recente deles é a última vez que a pessoa andou. */
    $ultima = '';
    foreach ($meu as $quando) {
        if ((string) $quando > $ultima) {
            $ultima = (string) $quando;
        }
    }
    $t = $ultima !== '' ? strtotime($ultima) : false;
    $dias = $t === false ? null : (int) floor(($agora - $t) / 86400);

    if ($meu === []) {
        $estado = 'sem-comecar';
    } elseif ($rapidasFeitas >= count($rapidasTodas)) {
        $estado = 'rapidas-ok';
    } elseif ($dias !== null && $dias > DIAS_PARA_TRAVAR) {
        $estado = 'travada';
    } else {
        $estado = 'andando';
    }

    return [
        'feitas'        => count($meu),
        'rapidasFeitas' => $rapidasFeitas,
        'rapidas'       => count($rapidasTodas),
        'ultima'        => $ultima,
        'dias'          => $dias,
        'estado'        => $estado,
    ];
}

/** Como cada estado se chama na tela. Uma vez só: a tabela e o placar leem daqui. */
const ESTADOS_DE_ESTUDO = [
    'travada'    => 'Travou',
    'sem-comecar' => 'Não começou',
    'andando'    => 'Andando',
    'rapidas-ok' => 'Rápidas completas',
];

/**
 * Quem tem acesso à formação — a base de todas as contas desta tela.
 *
 * Área 'aulas' é o que dá acesso a EDITAR. Estudar não pede permissão: quem tem
 * conta abre a formação inteira, e é por isso que a lista aqui é de gente ativa
 * e aprovada, e não de quem tem a área. Contar só quem edita diria que o
 * movimento tem três pessoas estudando.
 */
function quem_estuda(): array
{
    $lista = array_values(array_filter(
        ler_pessoas(),
        fn ($u) => $u['ativo'] && $u['usuario'] !== '' && $u['status'] === 'aprovada'
    ));
    usort($lista, fn ($a, $b) => strcmp($a['nome'], $b['nome']));
    return $lista;
}

/** Os ids das aulas que esta pessoa já concluiu. */
function aulas_concluidas(string $usuarioId): array
{
    return array_keys(ler_progresso()[$usuarioId] ?? []);
}

/** Marca ou desmarca uma aula. Devolve false só quando a gravação falha. */
function marcar_aula(string $usuarioId, string $aulaId, bool $concluida): bool
{
    if ($usuarioId === '' || aula_por_id($aulaId) === null) {
        return false;
    }
    $tudo = ler_progresso();

    if ($concluida) {
        $tudo[$usuarioId][$aulaId] = date('c');
    } else {
        unset($tudo[$usuarioId][$aulaId]);
        // sem aula nenhuma, o usuário sai do arquivo em vez de virar array vazio
        if (($tudo[$usuarioId] ?? []) === []) {
            unset($tudo[$usuarioId]);
        }
    }

    return gravar_progresso($tudo);
}

/* ===================== o que o site recebe ===================== */

/**
 * O currículo como o site precisa: com o vídeo já resolvido e sem os campos
 * que só interessam ao painel.
 *
 * Vídeo não publicado não vai junto — a aula existe, o player é que não
 * aparece. Assim dá para pendurar o link antes de a aula estar pronta.
 */
function curriculo_publico(): array
{
    $videos = ler_videos();
    $dias   = [];

    foreach (CURRICULO as $dia) {
        $aulas = [];
        foreach ($dia['aulas'] as $aula) {
            $v = $videos[$aula['id']] ?? null;
            $aulas[] = [
                'id'         => $aula['id'],
                'pista'      => $aula['pista'],
                'titulo'     => $aula['titulo'],
                'resumo'     => $aula['resumo'],
                'minutos'    => $aula['minutos'],
                'funcoes'    => $aula['funcoes'],
                'ferramenta' => $aula['ferramenta'] ?? null,
                'blocos'     => blocos_resolvidos($aula['blocos']),
                'video'      => ($v !== null && $v['publicada'])
                    ? ['provedor' => $v['provedor'], 'id' => $v['id']]
                    : null,
            ];
        }
        $dias[] = [
            'id'     => $dia['id'],
            'numero' => $dia['numero'],
            'titulo' => $dia['titulo'],
            'resumo' => $dia['resumo'],
            'aulas'  => $aulas,
        ];
    }

    return $dias;
}

/**
 * Troca o bloco `checklist` pelo conteúdo do checklists.php, para o site não
 * precisar conhecer um segundo catálogo só para renderizar uma lista.
 */
function blocos_resolvidos(array $blocos): array
{
    $saida = [];
    foreach ($blocos as $bloco) {
        if (($bloco['tipo'] ?? '') === 'checklist') {
            $c = checklist((string) ($bloco['id'] ?? ''));
            if ($c === null) {
                continue;  // id errado some em vez de quebrar a aula
            }
            $bloco = ['tipo' => 'checklist', 'titulo' => $c['titulo'], 'itens' => $c['itens']];
        }
        $saida[] = $bloco;
    }
    return $saida;
}
