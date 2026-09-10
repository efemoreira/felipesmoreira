<?php
declare(strict_types=1);

/**
 * As leituras — o que a coordenação olha, por oposição ao que ela faz.
 *
 * Nasceram dentro de `inscricoes-comum.php`, porque a primeira pergunta ("de
 * onde vem quem se inscreve?") era sobre inscrição. Mas o funil vai até a
 * presença, o mapa é de quem já foi aprovado, e a aba que os desenhava vivia
 * numa tela cuja pergunta é "quem aprovo agora?". Leitura não mora dentro de
 * mesa: quem veio decidir não precisa do gráfico, e quem veio ler não precisa
 * da fila.
 *
 * TUDO AQUI É DERIVADO. Não há `dados/leituras.php` nem cache: cada função lê
 * o que já está gravado e conta. O dia em que isso ficar lento, o problema é
 * o tamanho da base — e aí o cache é decisão, não atalho.
 */

require_once __DIR__ . '/sessao.php';

/**
 * De onde veio cada pessoa — o `?de=` do link que ela abriu.
 *
 * Devolve da maior para a menor, e **não inclui quem chegou sem origem**: essa
 * conta vai separada, porque "veio sozinho" não é um recrutador.
 *
 * Conta o TOTAL e as APROVADAS lado a lado de propósito: origem que traz muita
 * gente e nenhuma aprovada não é origem que funciona, e o número cru esconderia
 * isso.
 *
 * @return array{placar: list<array{origem: string, total: int, aprovadas: int}>, semOrigem: int}
 */
function placar_de_origens(?array $pessoas = null): array
{
    $pessoas ??= ler_pessoas();

    $soma = [];
    $semOrigem = 0;
    foreach ($pessoas as $p) {
        /* Só quem passou pelo formulário conta: quem a coordenação cadastrou na
           mão, ou quem apareceu num encontro, não veio de link nenhum. */
        if ($p['status'] === '') {
            continue;
        }
        if ($p['origem'] === '') {
            $semOrigem++;
            continue;
        }
        if (!isset($soma[$p['origem']])) {
            $soma[$p['origem']] = ['origem' => $p['origem'], 'total' => 0, 'aprovadas' => 0];
        }
        $soma[$p['origem']]['total']++;
        if ($p['status'] === 'aprovada') {
            $soma[$p['origem']]['aprovadas']++;
        }
    }

    usort($soma, fn ($a, $b) => [$b['total'], $b['aprovadas']] <=> [$a['total'], $a['aprovadas']]);
    return ['placar' => array_values($soma), 'semOrigem' => $semOrigem];
}

/**
 * O FUNIL DE CADA ORIGEM — quem recruta, e o que converte.
 *
 * `placar_de_origens()` responde "quantas chegaram por aqui". Esta responde a
 * pergunta seguinte, que é a que decide onde a campanha põe esforço: **das que
 * chegaram, quantas viraram militante de verdade?**
 *
 * A diferença não é detalhe. Uma live que traz cinquenta inscrições e nenhuma
 * aprovada parece a melhor origem do movimento no número cru, e é a pior; um
 * militante que traz seis e vê as seis comparecendo é o que precisa ser copiado.
 * Contar só o topo do funil premia quem faz barulho, não quem traz gente.
 *
 * **Três degraus, e não dois:**
 *
 * 1. `chegaram` — preencheu o formulário. É o que o link fez.
 * 2. `aprovadas` — a coordenação conferiu e deu acesso.
 * 3. `militaram` — apareceu em pelo menos um encontro. Este é o único que não
 *    depende de a pessoa dizer que vai: é presença marcada na porta.
 *
 * **Quem recruta é separado de por onde veio, e a separação é lida do
 * cadastro**, não de uma segunda lista: se a origem é o slug do nome de alguém
 * que existe, a linha ganha o nome dessa pessoa. `?de=joao-silva` é gente,
 * `?de=live-domingo` é canal — o campo é um só porque na prática a pergunta é a
 * mesma, mas quem lê o relatório precisa distinguir os dois para saber se
 * agradece ou se repete.
 *
 * Não inclui quem chegou sem origem: essa conta vai separada, porque "veio
 * sozinho" não é um recrutador. E só conta quem passou pelo formulário — quem a
 * coordenação cadastrou na mão não veio de link nenhum.
 *
 * @return array{
 *   linhas: list<array{origem:string, quem:string, chegaram:int, aprovadas:int,
 *                      militaram:int, ultima:string}>,
 *   semOrigem: int, semOrigemMilitaram: int
 * }
 */
function funil_de_origens(?array $pessoas = null): array
{
    require_once __DIR__ . '/eventos-comum.php';   // as presenças, para o 3º degrau
    require_once __DIR__ . '/inscricoes-comum.php';  // normalizar_origem() — o slug é contrato com o site

    $pessoas ??= ler_pessoas();

    /* Quem compareceu a pelo menos um encontro. Um `array` de ids em vez de uma
       consulta por pessoa: são duas listas inteiras, e cruzá-las uma vez custa
       menos que uma varredura por linha do relatório. */
    $compareceu = [];
    foreach (ler_presencas() as $l) {
        if (!empty($l['compareceu'])) {
            $compareceu[$l['pessoaId']] = true;
        }
    }

    /* O slug do nome de cada pessoa → o nome dela. É assim que a origem
       `joao-silva` vira "João Silva" na tela: o mesmo `normalizar_origem()` que
       grava a origem, aplicado ao nome de quem já está no cadastro. Sem isso o
       relatório mostra slug, e slug ninguém reconhece no grupo. */
    $porSlug = [];
    foreach ($pessoas as $p) {
        $slug = normalizar_origem($p['nome']);
        if ($slug !== '' && !isset($porSlug[$slug])) {
            $porSlug[$slug] = $p['nome'];
        }
    }

    $soma = [];
    $semOrigem = 0;
    $semOrigemMilitaram = 0;

    foreach ($pessoas as $p) {
        if ($p['status'] === '') {
            continue;
        }
        $militou = isset($compareceu[$p['id']]);

        if ($p['origem'] === '') {
            $semOrigem++;
            $semOrigemMilitaram += $militou ? 1 : 0;
            continue;
        }
        $o = $p['origem'];
        $soma[$o] ??= [
            'origem'    => $o,
            'quem'      => $porSlug[$o] ?? '',
            'chegaram'  => 0,
            'aprovadas' => 0,
            'militaram' => 0,
            'ultima'    => '',
        ];
        $soma[$o]['chegaram']++;
        $soma[$o]['aprovadas'] += $p['status'] === 'aprovada' ? 1 : 0;
        $soma[$o]['militaram'] += $militou ? 1 : 0;
        if (($p['criadoEm'] ?? '') > $soma[$o]['ultima']) {
            $soma[$o]['ultima'] = (string) $p['criadoEm'];
        }
    }

    /* A ordem é por QUEM MILITOU, e o total só desempata. Ordenar pelo total
       poria no topo justamente a origem que enche a fila e não entrega — que é
       o erro de leitura que este relatório existe para desfazer. */
    usort($soma, fn ($a, $b) => [$b['militaram'], $b['aprovadas'], $b['chegaram']]
                           <=> [$a['militaram'], $a['aprovadas'], $a['chegaram']]);

    return [
        'linhas' => array_values($soma),
        'semOrigem' => $semOrigem,
        'semOrigemMilitaram' => $semOrigemMilitaram,
    ];
}

/**
 * Quantos militantes por cidade/bairro — só aprovados, pelo mesmo motivo.
 *
 * Devolve LINHAS DE TABELA, e não o mapa cru `cidade => bairro => n`: a tela
 * desenha `cidade`, `total` e a lista de `bairros`, e era o mapa cru que ela
 * recebia — três chaves indefinidas por linha e a tabela saindo vazia.
 *
 * Cidade com mais gente primeiro, porque a pergunta é "onde já dá para montar
 * um time"; empate desempata pelo nome, sem acento.
 */
function militancia_por_regiao(?array $pessoas = null): array
{
    $pessoas ??= ler_pessoas();
    $mapa = [];
    foreach ($pessoas as $p) {
        if ($p['status'] !== 'aprovada' || $p['cidade'] === '') {
            continue;
        }
        $bairro = $p['bairro'] !== '' ? $p['bairro'] : '';
        $mapa[$p['cidade']][$bairro] = ($mapa[$p['cidade']][$bairro] ?? 0) + 1;
    }

    $linhas = [];
    foreach ($mapa as $cidade => $bairros) {
        $total = array_sum($bairros);
        /* Bairro em branco não vira "—" numa etiqueta: a tela já diz "sem
           bairro informado" quando não sobra nenhum, e uma etiqueta com travessão
           no meio dos bairros de verdade só ocupa espaço. */
        unset($bairros['']);
        arsort($bairros);
        $linhas[] = [
            'cidade'  => (string) $cidade,
            'total'   => $total,
            'bairros' => array_map(
                fn ($nome, $n) => ['nome' => (string) $nome, 'total' => $n],
                array_keys($bairros),
                array_values($bairros)
            ),
        ];
    }

    usort($linhas, fn ($a, $b) => [$b['total'], sem_acento($a['cidade'])]
        <=> [$a['total'], sem_acento($b['cidade'])]);
    return $linhas;
}
