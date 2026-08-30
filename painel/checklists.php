<?php
declare(strict_types=1);

/**
 * Os checklists do movimento — "Pronto quando" e as listas de conferência.
 *
 * Escritos UMA vez aqui porque têm dois consumidores: a aula que ensina a
 * função (aulas-conteudo.php referencia pelo id) e a ferramenta que a pessoa
 * usa no dia (Eventos, Produção). Texto repetido em dois lugares é texto que
 * diverge na terceira alteração.
 *
 * Só define constante — incluir este arquivo não exige login nem imprime nada.
 */

const CHECKLISTS = [

    /* ---------- Comunicação: pronto quando ---------- */

    'olheiro' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Tem link de fonte primária e a data.',
            'A data está dentro das últimas 48h.',
            'Tem responsável nomeável e quem é o afetado.',
            'Está sem opinião — só o fato.',
        ],
    ],

    'checagem' => [
        'titulo' => 'Checklist de checagem',
        'itens'  => [
            'Abri o link e a página existe.',
            'A data confere e está na janela de 48h.',
            'O número ou a afirmação confere com a fonte.',
            'A fonte é confiável; se a afirmação for forte, tenho 2ª fonte independente.',
        ],
    ],

    'roteirista' => [
        'titulo' => 'Checklist de conformidade',
        'itens'  => [
            'Abre com gancho e fecha nos três movimentos.',
            'Traz uma alternativa possível (como poderia ser).',
            'Não cita facção pelo nome e não ofende pessoa.',
            'Passa no teste do espelho.',
            'A última linha é a identificação padrão.',
            'Vivência marcada [VIVÊNCIA] onde precisa de caso real.',
        ],
    ],

    'design' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Legível no celular: título grande, corpo confortável, bom contraste.',
            'A fonte do dado aparece na arte (rodapé).',
            'Logo e cores da campanha aplicados.',
            'Exportado em feed 1080×1350 e stories 1080×1920.',
            'Nome padrão, salvo em /Artes.',
        ],
    ],

    'editor' => [
        'titulo' => 'Checklist de edição',
        'itens'  => [
            'Gancho nos primeiros 3 segundos.',
            'Legenda em tudo, com nomes e números conferidos.',
            'Áudio nivelado, sem estouro.',
            'Dado com a fonte na tela.',
            'Fechamento nos três movimentos, como o roteiro pede.',
            '1080×1920, nome padrão, projeto guardado.',
        ],
    ],

    'acervo' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Todo arquivo com nome padrão, na pasta certa.',
            'Brutos e finais guardados.',
            'Índice com data e link do post publicado.',
        ],
    ],

    /* ---------- Eventos: pronto quando ---------- */

    'local-hora' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Reserva confirmada por escrito (data, hora, valor).',
            'Capacidade, acesso, energia, som e banheiro conferidos.',
            'Contato do responsável do local salvo.',
            'Plano B de chuva definido (se for ao ar livre).',
        ],
    ],

    'logistica' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Checklist de material completo, com um dono para cada item.',
            'Transporte de ida e volta definido.',
            'Som e microfone testados.',
            'Plano B de energia e de chuva.',
        ],
    ],

    'divulgacao' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Lista de convidados montada.',
            'Convites enviados e registrados.',
            'Confirmações (RSVP) anotadas.',
            'Lembretes de véspera e de dia enviados.',
        ],
    ],

    'gravacao' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Testou câmera, bateria, memória e áudio.',
            'Cobriu abertura, falas, público e detalhes (shot list).',
            'Gravou em horizontal e vertical.',
            'Autorização de imagem coletada onde necessário.',
            'Backup feito.',
        ],
    ],

    'follow-up' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Cada pessoa que compareceu recebeu a mensagem do dia seguinte, pelo nome.',
            'A mensagem de D+3 leva um conteúdo, e não só um "e aí?".',
            'O convite de D+7 diz QUAL encontro e QUANDO — convite sem data não é convite.',
            'Quem respondeu e voltou virou Militante na ficha, e saiu do funil.',
            'Quem não respondeu em três tentativas ficou na lista de reativação, não no esquecimento.',
        ],
    ],

    'recepcao' => [
        'titulo' => 'Pronto quando',
        'itens'  => [
            'Mesa com lista + QR na entrada.',
            'Todos cadastrados (nome, WhatsApp, bairro).',
            'Leads classificados (Curioso / Simpatizante / Militante / Apoiador).',
            'Lista entregue à coordenação.',
        ],
    ],

    /* ---------- Listas de conferência usadas no dia ---------- */

    'material-evento' => [
        'titulo' => 'Checklist de material (ajuste por evento)',
        'itens'  => [
            'Som: caixa/PA, microfone, cabos, extensão, filtro de linha.',
            'Estrutura: cadeiras, mesa(s), banner/backdrop, toalha de mesa.',
            'Recepção: lista de presença impressa + QR de cadastro, canetas, crachás, fita.',
            'Registro: câmera/celular, tripé, carregador/power bank, luz se for à noite.',
            'Conforto: água, copos, lixo, kit primeiros socorros.',
            'Reserva: pilhas, cabo extra, cópia da chave/contato do local.',
        ],
    ],

    'shot-list' => [
        'titulo' => 'Shot list (o que não pode faltar)',
        'itens'  => [
            'Abertura: local, gente chegando, ambiente.',
            'Falas principais (microfone/celular perto de quem fala).',
            'Reação do público / plateia.',
            'Detalhes: banner, cartazes, mãos, símbolos.',
            '1 ou 2 depoimentos curtos (com autorização).',
        ],
    ],

    'fontes-fixas' => [
        'titulo' => 'Fontes fixas (favorite no navegador)',
        'itens'  => [
            'Portais locais: O Povo, Diário do Nordeste, G1 Ceará.',
            'Oficiais: governo do estado, Prefeitura de Fortaleza, Assembleia (ALECE).',
            'Diário Oficial (estado e município) e portais de transparência.',
            'Redes oficiais dos gestores e secretarias.',
            'Rádios e portais do interior (para pauta fora da capital).',
        ],
    ],
];

/** Devolve um checklist pelo id, ou null se não existir. */
function checklist(string $id): ?array
{
    return CHECKLISTS[$id] ?? null;
}
