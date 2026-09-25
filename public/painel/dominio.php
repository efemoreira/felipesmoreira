<?php
declare(strict_types=1);

/**
 * O vocabulário do movimento — o que uma pessoa É, FAZ, ABRE e de que rede
 * faz parte; os cargos da cédula; para onde cada área leva.
 *
 * Saiu de `sessao.php` porque quem edita um cargo ou uma capacidade não
 * deveria abrir o arquivo da sessão — e porque os testes de contrato leem
 * estas constantes por texto, e um arquivo pequeno e estável é mais fácil de
 * ler do que 1400 linhas de login e token. Só constantes e funções puras
 * sobre elas: nada aqui lê disco nem sessão (`grupo_de()` lê o cadastro, mas
 * na hora em que é chamada, e é a exceção que fecha o assunto "grupo").
 *
 * Não inclua nada aqui: `sessao.php` inclui este, e todo arquivo do painel
 * começa por `sessao.php`.
 */

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
    'caixa'      => 'Caixa',
    'leituras'   => 'Leituras',
    'oficina'    => 'Oficina de formatos',
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
 * **`pessoas` e `caixa` só entram em `adm`, de propósito.** Uma é a tela com
 * telefone, e-mail e endereço de todo mundo; a outra é dinheiro. As duas seguem
 * a mesma régua: acesso a isso não acompanha o trabalho do dia, acompanha a
 * responsabilidade sobre ele. E não é só o menu que diz isso: a rota exige
 * `exigir_admin()`, e `normalizar_pessoa()` descarta essas áreas de quem não é
 * `adm` — o "ajuste fino" não alcança o que nenhuma capacidade concede. Ver
 * `areas_so_adm()`.
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
    /* Coordenação abre ENCONTROS também, e isso não é acréscimo de conveniência:
       é a metade que faltava para a regra de dado pessoal fechar. O telefone de
       quem esteve num encontro é da coordenação (ver `pode_ver_telefone()`), e o
       follow-up depois do encontro — agradecer, mandar conteúdo, convidar de
       novo — é trabalho dela. Sem `eventos` aqui, a única pessoa capaz de fazer
       esse trabalho seria a administração, e a regra viraria "só o adm", que não
       é o que ela diz. Quem tem só a capacidade Eventos continua organizando o
       encontro e recebendo gente na porta; o que ela não leva junto é a agenda
       de telefones do movimento. */
    'coordenacao' => [
        'nome'   => 'Coordenação',
        'resumo' => 'Quem entra no movimento, os encontros, os candidatos e a formação do time',
        /* Leituras é o relatório semanal — origem, território, a semana, o
           que andou acontecendo. Só lê; e lê o que a coordenação já abre. */
        'areas'  => ['inscricoes', 'candidatos', 'aulas', 'eventos', 'agenda', 'leituras'],
    ],
    /* NÃO ABRE TELA NENHUMA — `areas` vazio, e de propósito.
       Ela habilita um bloco no Início: a lista de quem esta pessoa acompanha.
       `pessoas` continua só em `adm`, e a diferença é o recorte: quem lidera vê
       NOME e WHATSAPP da própria gente, e não a agenda do movimento.

       Existe como capacidade, e não como efeito de alguém ter preenchido o
       campo `lider` numa ficha, porque dar acesso a dado pessoal precisa ser uma
       decisão registrada — e não uma consequência lateral de organizar times. */
    /* ABRE UMA TELA SÓ, e é a razão de existir como capacidade: a Oficina é
       pessoal — cada um que a recebe tem a sua, e ninguém vê a de ninguém —,
       mas quem a concede é a administração, pessoa a pessoa. Sem uma capacidade
       que a conceda, `normalizar_pessoa()` a apagaria de toda ficha que não é
       `adm` (ver `areas_so_adm()`), e o desafio de formatos seria do
       administrador em vez de ser de quem cria conteúdo. */
    'criacao' => [
        'nome'   => 'Criação',
        'resumo' => 'A oficina de formatos: testar, publicar e medir o próprio vídeo',
        'areas'  => ['oficina'],
    ],
    'lideranca' => [
        'nome'   => 'Liderança',
        'resumo' => 'Acompanha um punhado de gente: vê nome e WhatsApp de quem está sob ela',
        'areas'  => [],
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
 * As áreas que nenhuma capacidade concede — só `adm` abre.
 *
 * É derivado de CAPACIDADES, e não uma lista escrita à mão, para que a regra
 * tenha uma fonte só: área que entrar numa capacidade deixa de ser só-adm
 * sozinha. `testes/contrato/painel.test.ts` faz a mesma conta para cobrar que
 * essas áreas morem no grupo "Administração" do menu.
 */
function areas_so_adm(): array
{
    $concedidas = [];
    foreach (CAPACIDADES as $c) {
        $concedidas = array_merge($concedidas, $c['areas']);
    }
    return array_values(array_diff(array_keys(AREAS), $concedidas));
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
 * AS REDES PROFISSIONAIS — o quarto eixo da ficha.
 *
 * `tipo` diz o que a pessoa É, `funcoes` diz o que ela FAZ, `capacidades` diz o
 * que ela ABRE. Faltava de que rede ela FAZ PARTE — e é um eixo diferente dos
 * três: um médico pode ser eleitor, militante ou coordenador, e a rede não muda.
 *
 * A máquina do encontro já existe: `FAMILIAS['relacional']` traz o playbook, o
 * material e as seis travas jurídicas, e o §5.4 do manual descreve o formato.
 * O que faltava era saber quem chamar — e o Manual pede lista **curta e curada**
 * com convite pessoal, nunca grupo de WhatsApp. É exatamente o que um filtro por
 * rede produz.
 *
 * Lista fechada, pelo mesmo motivo que `CARGOS` é lista: "Médicos", "medicos" e
 * "Médicas e médicos" digitados por três pessoas viram três redes no filtro, e
 * a lista curada deixa de ser curada.
 *
 * NADA DISSO É PÚBLICO. Rede profissional não vira página no site.
 */
const REDES = [
    'medicos'     => ['nome' => 'Saúde',     'resumo' => 'Médicos, enfermagem e quem trabalha na ponta do SUS'],
    'advogados'   => ['nome' => 'Direito',   'resumo' => 'Advocacia, defensoria e quem entende de conformidade'],
    'empresarios' => ['nome' => 'Negócios',  'resumo' => 'Quem emprega, quem toca comércio e quem abre porta'],
    'educacao'    => ['nome' => 'Educação',  'resumo' => 'Professores, direção de escola e quem forma gente'],
    'seguranca'   => ['nome' => 'Segurança', 'resumo' => 'Polícia, bombeiros e quem conhece a violência por dentro'],
    'igrejas'     => ['nome' => 'Igrejas',   'resumo' => 'Liderança religiosa e quem tem comunidade própria'],
    'campo'       => ['nome' => 'Campo',     'resumo' => 'Produtores, cooperativas e o interior que trabalha a terra'],
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

/**
 * O cargo de quem encabeça: `vice-governador` → `governador`,
 * `suplente-1` → `senador`. Cargo que não é de vice devolve ele mesmo.
 *
 * É com isto, e com o número (que o vice divide com o titular), que o site põe
 * o vice embaixo de quem ele acompanha — sem um campo "titular" na ficha que
 * alguém teria de lembrar de preencher.
 */
function cargo_titular(string $chave): string
{
    if (str_starts_with($chave, 'suplente-')) {
        return 'senador';
    }
    return str_starts_with($chave, 'vice-') ? substr($chave, 5) : $chave;
}

/** O nome do cargo como se escreve. Cargo em branco devolve string vazia. */
function rotulo_cargo(string $chave): string
{
    return (string) (CARGOS[$chave]['nome'] ?? '');
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
    'caixa'      => ['url' => '/painel/caixa.php', 'resumo' => 'Todo real que entra e sai, com origem — e os dois caixas nunca somados juntos'],
    'leituras'   => ['url' => '/painel/leituras.php', 'resumo' => 'A leitura da semana: de onde vem a militância, onde ela mora, o que venceu e o que andou acontecendo'],
    'oficina'    => ['url' => '/painel/oficina.php', 'resumo' => 'Testar um formato de vídeo por vez e medir qual deles funciona no seu nicho'],
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

/**
 * O GRUPO DESTA PESSOA — o do líder dela, ou o geral.
 *
 * Um grupo só, com todo mundo dentro, é onde ninguém é chamado pelo nome — e é
 * a razão mais direta de alguém entrar no movimento e não se sentir parte. Com
 * a divisão por líder, cada pessoa cai num lugar onde há um punhado de gente e
 * alguém que responde por ela.
 *
 * O geral não deixa de existir: ele é o piso de quem ainda não tem líder, e o
 * canal do que é de todo mundo.
 */
function grupo_de(array $pessoa): string
{
    if (($pessoa['lider'] ?? '') === '') {
        return GRUPO_TRABALHO;
    }
    foreach (ler_pessoas() as $p) {
        if ($p['id'] === $pessoa['lider'] && $p['grupo'] !== '') {
            return $p['grupo'];
        }
    }
    return GRUPO_TRABALHO;
}

/** O contato oficial. Não existe e-mail: este é o único canal. */
const WHATSAPP_COORDENACAO = 'https://wa.me/5585981872972';
