<?php
declare(strict_types=1);

/**
 * O que a Ajuda diz de cada tela — e de onde ela tira.
 *
 * Três perguntas por área: PARA QUE SERVE, QUEM ABRE, O QUE SAI DAQUI.
 * Duas das três já existiam e são reaproveitadas: "para que serve" é o
 * `resumo` de DESTINO_AREA (o mesmo do menu), e "quem abre" é derivado de
 * CAPACIDADES — escrever de novo seria uma quarta lista dizendo quem abre o
 * quê, e a quarta lista é a que diverge. Só "o que sai daqui" é texto novo.
 *
 * O GLOSSÁRIO é a parte que só existia no CLAUDE.md, que a coordenação não
 * lê: tipo ≠ funções ≠ capacidades, mesa × leitura, o caminho de quem chega.
 */

require_once __DIR__ . '/sessao.php';

/** O que cada tela produz — o que sai dela para o resto do movimento. */
const SAI_DE_AREA = [
    'agenda'     => 'A programação pública em /programacao e o pôster de compartilhar.',
    'estudio'    => 'A arte pronta, baixada para o seu aparelho — nada fica no servidor.',
    'aulas'      => 'A aula com vídeo em /aulas, e a leitura de quem está pronto por função.',
    'fatos'      => 'O fato aprovado vira card em Produção; o reprovado fica com o motivo.',
    'producao'   => 'O post publicado, com quem fez cada etapa — é o rastro da comunicação.',
    'municao'    => 'A peça da semana no grupo, com o ?de= de quem postou.',
    'eventos'    => 'O encontro na programação, o QR da porta, a lista de presença e o follow-up.',
    'inscricoes' => 'Uma pessoa aprovada com conta e senha provisória — ou recusada, com o motivo.',
    'candidatos' => 'A lista pública em /candidatos e a colinha que o eleitor leva.',
    'pessoas'    => 'A ficha única de cada pessoa: contato, função, acesso, encontros.',
    'caixa'      => 'O extrato de cada conta, lançamento a lançamento, com origem.',
    'leituras'   => 'Nada — Leituras só lê. É o que se manda no grupo da coordenação.',
];

/** As telas pessoais, que não são área e não têm capacidade. */
const AJUDA_PESSOAL = [
    'gente' => [
        'nome'  => 'Sua gente',
        'serve' => 'Quem tem você como líder: quem esfriou, quem não começou a estudar, quem não confirmou o encontro.',
        'abre'  => 'Quem lidera alguém — a coordenação aponta a líder na ficha da pessoa.',
        'sai'   => 'O convite do seu sub-grupo e o WhatsApp de cada um, para chamar.',
    ],
    'conta' => [
        'nome'  => 'Minha senha',
        'serve' => 'Trocar a sua senha. Quem entrou com senha provisória para aqui até escolher uma.',
        'abre'  => 'Todo mundo que tem conta.',
        'sai'   => 'Nada — só a sua senha nova.',
    ],
];

/**
 * Quem abre a área, em uma frase, a partir de CAPACIDADES.
 * Só-adm sai como "só a administração"; o resto lista as capacidades.
 */
function quem_abre(string $area): string
{
    if (in_array($area, areas_so_adm(), true)) {
        return 'Só a administração — é dado pessoal ou dinheiro, e isso segue responsabilidade, não trabalho do dia.';
    }
    $nomes = [];
    foreach (CAPACIDADES as $chave => $c) {
        if ($chave !== 'adm' && in_array($area, $c['areas'], true)) {
            $nomes[] = $c['nome'];
        }
    }
    return $nomes === []
        ? 'Só a administração.'
        : 'Quem tem a capacidade ' . implode(' ou ', $nomes) . ' (e a administração).';
}

/** As três frases de uma área. Área sem frase em SAI_DE_AREA é erro de quem a criou. */
function ajuda_da_area(string $area): array
{
    return [
        'nome'  => AREAS[$area],
        'serve' => DESTINO_AREA[$area]['resumo'] ?? '',
        'abre'  => quem_abre($area),
        'sai'   => SAI_DE_AREA[$area] ?? '',
    ];
}

/** As distinções que sustentam o painel, para quem chegou hoje. */
const GLOSSARIO = [
    ['Pessoa', 'A ficha única de quem se relaciona com o movimento. Inscrito, presente, militante, candidato e conta são a mesma ficha em estados diferentes — o telefone é a chave. Não existe cadastro paralelo.'],
    ['Tipo', 'O que a pessoa é para o movimento: eleitor, apoiador, militante, coordenador, candidato. Não dá acesso a nada.'],
    ['Função', 'O que a pessoa faz: Olheiro, Checagem, Recepção… Vem do que ela escolheu no /queroajudar. Personaliza a mesa no Início; também não dá acesso.'],
    ['Capacidade', 'O que a pessoa abre no painel: Comunicação, Eventos, Coordenação, Liderança, Administração. É o único jeito normal de dar acesso; as áreas por baixo são o ajuste fino.'],
    ['Pendente → aprovada', 'Quem se inscreve entra pendente. Aprovar dá conta à ficha que já existe, com senha provisória. Recusar não apaga ninguém.'],
    ['Presença', 'Uma relação entre pessoa e encontro — nunca uma cópia da pessoa. Confirmou (pelo link do grupo) e compareceu (pelo QR da porta) são dois tokens diferentes.'],
    ['Mesa × leitura', 'Mesa é onde se faz: fila, quadro, ficha. Leitura é onde se olha: funil, mapa, contagem. Leitura não mora dentro de mesa — por isso Leituras é uma tela própria.'],
    ['Origem (?de=)', 'O que amarra quem trouxe quem: a peça compartilhada leva o slug de quem postou, e a inscrição que chega por ela guarda a origem.'],
    ['Funil', 'O que se faz depois do encontro com quem veio: D+0 agradecer, D+3 mandar conteúdo, D+7 convidar para o próximo. Vence no hub de quem tem a função Follow-up.'],
    ['Reativação', 'Quem esfriou — faltou, nunca entrou, parou de estudar, sumiu. É derivada dos carimbos: ninguém sai da lista por ser chamado, só por voltar.'],
    ['Trilha', 'O mínimo por função: a aula, o checklist e a primeira ferramenta. É o que o Início mostra como próximo passo.'],
];
