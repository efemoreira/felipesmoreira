<?php
declare(strict_types=1);

/**
 * UM ENCONTRO ABERTO — a moldura da tela `/painel/eventos?e=<id>` e a aba
 * Preparo.
 *
 * Este arquivo é o maestro: calcula o estado que a tela inteira usa, desenha o
 * cabeçalho, o resumo e as abas, e chama o bloco de cada aba. As outras abas
 * moram em arquivos próprios (`eventos-presenca.php`, `eventos-funil.php`,
 * `eventos-dados.php`) porque são longas e independentes; o Preparo fica aqui
 * porque é curto e é a aba padrão — quem abre o arquivo do encontro quer ver
 * primeiro o que a tela mostra por primeiro.
 *
 * A tela é longa por natureza — playbook, cinco peças, lista de gente,
 * follow-up, dados — e empilhada obrigava a rolar às cegas para chegar em
 * "Pessoas" no celular. Foi um índice de âncoras antes de virar abas.
 */

require_once __DIR__ . '/agenda-comum.php';  // o relógio e o pipeline de imagem
require_once __DIR__ . '/checklists.php';  // checklist()
require_once __DIR__ . '/eventos-comum.php';  // o modelo do encontro e da presença
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_abas(), abrir_modal() — a moldura
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo
require_once __DIR__ . '/eventos-presenca.php';
require_once __DIR__ . '/eventos-funil.php';
require_once __DIR__ . '/eventos-dados.php';

/**
 * Desenha a tela de um encontro, da moldura à aba escolhida.
 *
 * O ESTADO É CALCULADO UMA VEZ, AQUI. `$preparo`, `$naLista` e `$vencidos`
 * aparecem no resumo, na contagem das abas e dentro dos blocos — recalculá-los
 * em cada lugar é como duas telas passam a discordar sobre o mesmo encontro.
 */
function tela_do_encontro(array $aberto, array $eu, bool $coordena, ?string $erro, ?string $ok): void
{
    $familia = FAMILIAS[$aberto['familia']];
    $preparo = preparo_do_evento($aberto);
    $naLista = count(presencas_do_evento($aberto['id']));
    /* Sobre a lista INTEIRA, e nunca sobre o recorte da busca: o follow-up
       vencido é o que está devendo, e escondê-lo porque alguém digitou um nome
       na caixa seria esconder trabalho. */
    $vencidos = $coordena ? follow_ups_vencidos($aberto) : [];

    /* As abas, na ordem do encontro: PREPARO antes, PESSOAS durante, FOLLOW-UP
       nos dias seguintes, DADOS é o ajuste que se faz uma vez.

       O follow-up ganhou aba porque é outro momento do mesmo encontro, e não
       outro assunto: morando no fim da aba Pessoas, ele ficava atrás de cem
       linhas de presença — no celular, atrás de rolagem que ninguém faz depois
       que o encontro acabou.

       São links (`?aba=…`), como em toda aba do painel: cada uma tem URL
       própria, o Voltar do navegador funciona e dá para mandar no grupo o link
       já na aba certa. */
    $abasDoEncontro = [
        'preparo' => ['nome' => 'Preparo', 'conta' => $preparo['feito'] . '/' . $preparo['total']],
        /* O número da aba é o da lista inteira, e não o do recorte: a aba diz
           quantos estão no encontro, e não quantos casam com o que foi
           digitado. */
        'pessoas' => ['nome' => 'Pessoas', 'conta' => $naLista],
    ];
    /* Follow-up e Dados são da coordenação: quem executa marca checklist e
       recebe gente — não vê telefone, não responde por lead, não muda data,
       local nem o que vai para a programação pública. Forçar `?aba=funil` ou
       `?aba=dados` na URL cai no Preparo, porque a aba nem existe no array. */
    if ($coordena) {
        /* O contador só existe quando há o que fazer: nas outras abas ele diz o
           tamanho da coisa ("12 pessoas"), aqui diria o tamanho da dívida — e um
           "0" numa pilha ao lado do nome é um alarme aceso para dizer que não há
           alarme. Sem número, a aba continua lá para quem quiser conferir. */
        $abasDoEncontro['funil'] = ['nome' => 'Follow-up']
            + ($vencidos !== [] ? ['conta' => count($vencidos)] : []);
        $abasDoEncontro['dados'] = ['nome' => 'Dados'];
    }
    $aba = (string) ($_GET['aba'] ?? '');
    if (!isset($abasDoEncontro[$aba])) {
        $aba = 'preparo';
    }

    abrir_pagina($aberto['titulo']);
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      $aberto['titulo'],
      $familia['nome'] . ' · ' . data_cheia($aberto)
      . ($aberto['local'] !== '' ? ' · ' . $aberto['local'] : '')
      . ' · ' . STATUS_EVENTO[$aberto['status']],
      ['url' => '/painel/eventos.php', 'texto' => 'Todos os encontros'],
      '/painel/eventos'
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php desenhar_resumo_do_encontro($aberto, $vencidos, $coordena); ?>

  <?php barra_abas($abasDoEncontro, $aba, 'aba', 'Seções do encontro'); ?>

  <?php if ($aba === 'preparo') { desenhar_preparo($aberto, $familia, $preparo, $coordena); } ?>

  <?php if ($aba === 'pessoas') { desenhar_presenca($aberto, $eu); } ?>

  <?php if ($aba === 'funil' && $coordena) { desenhar_funil($aberto, $eu, $vencidos); } ?>

  <?php if ($aba === 'dados' && $coordena) { desenhar_dados($aberto, pessoas_ativas(), $naLista); } ?>
</div>

<?php /* O `.qr-arte` só existe na aba Pessoas: baixar o desenhador nas outras
         seria pagar um arquivo para não desenhar nada. */ ?>
<?php if ($aberto['token'] !== '' && $aba === 'pessoas'): ?>
  <script src="/painel/vendor/qrcode.js?v=<?= VERSAO_ESTILO ?>"></script>
  <script nonce="<?= h(nonce_csp()) ?>">
    /* Desenha o QR em SVG. Servido do próprio domínio (ver vendor/LEIA-ME.md):
       nada do visitante vai para CDN de terceiro.

       Correção de erro nível M: aguenta o papel sujo ou amassado da mesa de
       recepção sem parar de ler, e ainda cabe numa folha pequena. */
    document.querySelectorAll('.qr-arte').forEach(function (alvo) {
      var qr = qrcode(0, 'M');
      qr.addData(alvo.dataset.qr);
      qr.make();
      alvo.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    });
  </script>
<?php endif; ?>
<?php
    fechar_pagina();
}

/**
 * A faixa de números acima das abas.
 *
 * O número que importa mora sempre na aba em que a
 * pessoa NÃO está: quem marca checklist no Preparo quer saber quantos
 * confirmaram, quem recebe na porta quer saber quanto do preparo ficou de pé.
 * Antes era preciso trocar de aba para consultar e voltar perdendo o lugar.
 *
 * Ela fica ACIMA das abas de propósito: é o que vale para o encontro inteiro, e
 * não o conteúdo de uma seção. Os números saem da lista inteira, nunca do
 * recorte da busca.
 */
function desenhar_resumo_do_encontro(array $aberto, array $vencidos, bool $coordena): void
{
    $preparo = preparo_do_evento($aberto);
    $confirmaram  = 0;
    $compareceram = 0;
    foreach (presencas_do_evento($aberto['id']) as $l) {
        $confirmaram  += $l['confirmou'] ? 1 : 0;
        $compareceram += $l['compareceu'] ? 1 : 0;
    }
    $naLista = count(presencas_do_evento($aberto['id']));
    /* Quantos dias faltam. null quando o encontro não tem instante — e aí não
       há contagem nenhuma a fazer, o que é diferente de faltarem zero dias.

       Sai de `inicio`, nunca de `data`: aquele é o instante, este é o "24/08"
       de exibição, que strtotime() não lê. Ver `dias_ate_o_dia()`. */
    $faltamDias = dias_ate_o_dia($aberto['inicio']);
    ?>
  <section class="resumo-encontro">
    <dl class="resumo-numeros">
      <div<?= $faltamDias !== null && $faltamDias >= 0 && $faltamDias <= 2 ? ' class="resumo-perto"' : '' ?>>
        <dt>Quando</dt>
        <dd>
          <?php if ($faltamDias === null): ?>
            <small>sem data</small>
          <?php elseif ($faltamDias < 0): ?>
            <small>já aconteceu</small>
          <?php elseif ($faltamDias === 0): ?>
            hoje
          <?php elseif ($faltamDias === 1): ?>
            amanhã
          <?php else: ?>
            <?= $faltamDias ?><small> dias</small>
          <?php endif; ?>
        </dd>
      </div>
      <div<?= $preparo['total'] > 0 && $preparo['feito'] < $preparo['total']
             && $faltamDias !== null && $faltamDias >= 0 && $faltamDias <= 2 ? ' class="resumo-alerta"' : '' ?>>
        <dt>Preparo</dt>
        <dd><?= $preparo['feito'] ?><small>/<?= $preparo['total'] ?></small></dd>
      </div>
      <div>
        <dt>RSVP</dt>
        <dd><?= $confirmaram ?><?php if ($aberto['publicoEsperado'] > 0): ?><small>/<?= (int) $aberto['publicoEsperado'] ?> esperados</small><?php endif; ?></dd>
      </div>
      <div>
        <dt>Check-in</dt>
        <dd><?= $compareceram ?></dd>
      </div>
      <?php /* O follow-up é da coordenação: quem só executa não vê telefone nem
               responde por lead, e um número que ele não pode zerar é cobrança
               sem porta. */ ?>
      <?php if ($coordena): ?>
        <div<?= $vencidos !== [] ? ' class="resumo-alerta"' : '' ?>>
          <dt>Follow-up vencido</dt>
          <dd><?= count($vencidos) ?></dd>
        </div>
      <?php endif; ?>
    </dl>

    <?php /* ---------- as próximas ações ----------
             O que fazer AGORA neste encontro, e não a lista do que existe: a
             ordem é a do relógio, e a barra some inteira quando não sobrou
             nada. Barra de ação vazia é ruído com moldura. */ ?>
    <?php
    $proximas = [];
    if ($coordena && $vencidos !== []) {
        $proximas[] = [
            'texto' => count($vencidos) === 1
                ? 'Fazer 1 follow-up vencido'
                : 'Fazer ' . count($vencidos) . ' follow-ups vencidos',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=funil#funil',
            'ouro'  => true,
        ];
    }
    /* A ESCALA FURADA VEM ANTES DO PREPARO, e não é ordem arbitrária: checklist
       sem dono não se resolve conferindo item, se resolve achando gente. Cobrar
       o preparo de uma peça que não tem ninguém é cobrar de ninguém. */
    $aResolver = $coordena ? pecas_a_resolver($aberto) : [];
    if ($aResolver !== [] && ($faltamDias === null || $faltamDias >= 0)) {
        $proximas[] = [
            'texto' => count($aResolver) === 1
                ? 'Achar quem faz ' . PECAS[$aResolver[0]]['nome']
                : 'Achar gente para ' . count($aResolver) . ' peças',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=dados#dados',
            'ouro'  => $faltamDias !== null && $faltamDias <= 3,
        ];
    }
    if ($preparo['total'] > 0 && $preparo['feito'] < $preparo['total']
        && ($faltamDias === null || $faltamDias >= 0)) {
        $proximas[] = [
            'texto' => 'Terminar o preparo (' . ($preparo['total'] - $preparo['feito']) . ' a conferir)',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=preparo#preparo',
            /* Ouro só quando o encontro está em cima: durante a semana o preparo
               incompleto é normal, e ouro é o botão de apertar agora. */
            'ouro'  => $faltamDias !== null && $faltamDias <= 2,
        ];
    }
    /* O CARTAZ DO QR, ANTES DO ENCONTRO.
       O bloco do QR mora na aba Pessoas, que é onde se trabalha DURANTE o
       evento — e quem prepara cartaz procura na véspera, não no dia. A folha de
       impressão já existe (`@media print` no painel.css); o que faltava era o
       caminho até ela aparecer na hora em que a pergunta é feita.

       Não é detalhe de conveniência: num ato de rua com centenas de pessoas, o
       QR impresso no banner e no colete é a diferença entre levar os contatos
       para casa e contar quantos apareceram. */
    if ($aberto['token'] !== '' && ($faltamDias === null || $faltamDias >= 0)) {
        $proximas[] = [
            'texto' => 'Imprimir o cartaz do QR',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=pessoas#qr',
            'ouro'  => $faltamDias !== null && $faltamDias <= 2,
        ];
    }
    if ($faltamDias !== null && $faltamDias <= 0 && $compareceram === 0 && $naLista > 0) {
        $proximas[] = [
            'texto' => 'Marcar quem chegou',
            'url'   => '?e=' . rawurlencode($aberto['id']) . '&aba=pessoas#pessoas',
            'ouro'  => true,
        ];
    }
    ?>
    <?php if ($proximas !== []): ?>
      <div class="resumo-acoes">
        <div class="acoes">
          <?php foreach (array_slice($proximas, 0, 3) as $acao): ?>
            <a class="btn btn-mini<?= $acao['ouro'] ? ' btn-ouro' : '' ?>" href="<?= h($acao['url']) ?>">
              <?= h($acao['texto']) ?>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    <?php endif; ?>
  </section>
  <?php
}

/**
 * A ABA PREPARO: o playbook da família e as cinco peças com seus checklists.
 *
 * As peças não conferidas nascem abertas e as prontas nascem fechadas — quem
 * abre esta aba vem terminar o que falta, não revisar o que já está feito.
 */
function desenhar_preparo(array $aberto, array $familia, array $preparo, bool $coordena): void
{
    /* Mesma lista da barra de ações lá em cima, e da tarefa do Início: uma
       régua só para "esta peça está furada". */
    $aResolver = $coordena ? pecas_a_resolver($aberto) : [];
    ?>
  <?php /* FECHADO POR PADRÃO. O Playbook é leitura — serve, métrica, as travas,
           o material — e vinha antes das peças: no celular, quem abriu para
           preparar rolava uma tela de texto até chegar ao que faz. Leitura não
           mora na frente da mesa; fica a um toque, como "O que dá para fazer
           aqui". A frase resumo continua visível para quem nunca abriu. */ ?>
  <details class="explicacao playbook">
    <summary>Playbook — <?= h($familia['nome']) ?> <span class="dica">· serve para <?= h(mb_strtolower($familia['serve'])) ?></span></summary>
    <p class="dica" style="margin:12px 0"><strong>Serve para:</strong> <?= h($familia['serve']) ?></p>
    <p class="dica folga"><strong>Métrica de sucesso:</strong> <?= h($familia['metrica']) ?></p>

    <div class="msg msg-erro">
      <strong>Travas desta família</strong>
      <ul class="lista-travas">
        <?php foreach ($familia['travas'] as $t): ?>
          <li><?= h($t) ?></li>
        <?php endforeach; ?>
      </ul>
    </div>

    <p class="dica"><strong>Material específico:</strong> <?= h(implode(' · ', $familia['material'])) ?></p>
  </details>

  <?php /* AS TAREFAS DESTE ENCONTRO — só as combinadas com nome e prazo; o
           checklist das peças continua sendo o preparo. Lista curta, com o
           caminho para a aba onde se combina. */ ?>
  <?php require_once __DIR__ . '/tarefas-comum.php'; $tarefasDoEncontro = array_filter(tarefas_do_evento($aberto['id']), fn ($t) => $t['feitaEm'] === ''); ?>
  <?php if ($tarefasDoEncontro !== [] || $coordena): ?>
    <fieldset id="tarefas-do-encontro">
      <legend>Combinado para este encontro (<?= count($tarefasDoEncontro) ?>)</legend>
      <?php if ($tarefasDoEncontro === []): ?>
        <?php vazio('Nada combinado com nome e prazo ainda.', ['url' => '/painel/eventos.php?aba=tarefas&nova=1&evento=' . rawurlencode($aberto['id']), 'texto' => 'Combinar uma tarefa']); ?>
      <?php else: ?>
        <ul class="dica folga-curta">
          <?php foreach ($tarefasDoEncontro as $t): ?>
            <li<?= tarefa_vencida($t) ? ' style="color:var(--erro)"' : '' ?>>
              <a href="/painel/eventos.php?aba=tarefas#t-<?= h($t['id']) ?>"><?= h($t['titulo']) ?></a>
              — <?= h(achar_pessoa($t['donoId'])['nome'] ?? 'sem dono') ?><?= $t['ate'] !== '' ? ' · até ' . h(data_humana($t['ate'])) : '' ?>
            </li>
          <?php endforeach; ?>
        </ul>
        <?php if ($coordena): ?><p class="dica colado"><a href="/painel/eventos.php?aba=tarefas&nova=1&evento=<?= h(rawurlencode($aberto['id'])) ?>">Combinar outra</a></p><?php endif; ?>
      <?php endif; ?>
    </fieldset>
  <?php endif; ?>

  <fieldset id="preparo">
    <?php /* "As peças", e não "as cinco": elas passaram a depender da família, e
             um número escrito na legenda vira mentira na primeira live. */ ?>
    <legend>As peças — preparo <?= $preparo['feito'] ?>/<?= $preparo['total'] ?></legend>

    <?php /* A SAÍDA QUE MAIS IMPORTA. A organização acontece no WhatsApp e vai
             continuar acontecendo: uma tela que exige entrar nela para saber
             quem faz o quê no sábado perde para uma mensagem no grupo, sempre.
             Peça vazia sai como "falta alguém" — o pedido de voluntário se
             escrevendo sozinho, no lugar em que as pessoas já estão. */ ?>
    <div class="acoes" style="margin:0 0 20px">
      <button class="btn" type="button" data-copiar="<?= h(escala_em_texto($aberto)) ?>">
        Copiar a escala para o grupo
      </button>
    </div>

    <?php foreach (pecas_do_evento($aberto) as $chave): ?>
      <?php $peca = PECAS[$chave]; ?>
      <?php
        $lista = checklist($peca['checklist']);
        $marcados = $aberto['feitos'][$chave] ?? [];
        /* TODOS OS NOMES, e o estado de cada um. Com quatro pessoas na Captação,
           mostrar só a primeira faria as outras três desaparecerem da tela em
           que o trabalho é conferido — e quem sumiu da tela some do encontro. */
        $donos = [];
        foreach ($aberto['responsaveis'][$chave] as $id) {
            $p = achar_pessoa($id);
            if ($p === null) {
                continue;
            }
            $estado = $aberto['aceites'][$chave][$id] ?? '';
            $donos[] = primeiro_nome($p['nome'])
                . ($estado === 'topou' ? ' ✓' : ($estado === 'nao-posso' ? ' ✕' : ''));
        }
      ?>
      <details class="item" id="peca-<?= h($chave) ?>" <?= count($marcados) < count($lista['itens']) ? 'open' : '' ?>>
        <summary class="item-topo">
          <span class="item-num" aria-hidden="true"><?= count($marcados) === count($lista['itens']) ? '✓' : '·' ?></span>
          <span class="item-resumo">
            <strong><?= h($peca['nome']) ?></strong>
            <span>
              <?= count($marcados) ?>/<?= count($lista['itens']) ?> ·
              <?php if ($donos === []): ?>
                <?php /* "sem dono" era texto cinza que não cobrava nada de
                         ninguém — dava para chegar no sábado com cinco peças
                         vazias sem uma só tela reclamar. Agora ele é selo, e
                         some da lista de pendências quando alguém assume. */ ?>
                <span class="selo <?= in_array($chave, $aResolver, true) ? 'selo-off' : 'selo-cinza' ?>">sem dono</span>
              <?php else: ?>
                <?= h(implode(', ', $donos)) ?>
                <?php if (in_array($chave, $aResolver, true)): ?>
                  <span class="selo selo-off">sem resposta</span>
                <?php endif; ?>
              <?php endif; ?>
            </span>
          </span>
        </summary>
        <div class="item-corpo">
          <?php /* O CONVITE MORA AQUI, e não na aba Dados, por duas razões. A
                   primeira é de trabalho: Dados é onde se DECIDE quem faz, uma
                   vez; Preparo é onde se COBRA, várias. A segunda é de HTML: a
                   escala em Dados vive dentro do formulário de salvar, e form
                   dentro de form é inválido — aqui cada item já é um form solto.

                   Só quem coordena: o telefone do time é dado pessoal, e cobrar
                   resposta é trabalho de quem chamou. */ ?>
          <?php if ($coordena && $aberto['responsaveis'][$chave] !== []): ?>
            <div class="escalados">
              <?php foreach ($aberto['responsaveis'][$chave] as $id): ?>
                <?php
                  $p = achar_pessoa($id);
                  if ($p === null) { continue; }
                  $estado = $aberto['aceites'][$chave][$id] ?? '';
                ?>
                <div class="escalado">
                  <span class="escalado-quem">
                    <strong><?= h($p['nome']) ?></strong>
                    <span class="selo <?= $estado === 'topou' ? 'selo-ok' : ($estado === 'nao-posso' ? 'selo-off' : 'selo-cinza') ?>">
                      <?= h(ROTULO_ESCALA[$estado] ?? '') ?>
                    </span>
                  </span>
                  <div class="acoes-celula">
                    <?php if ($p['telefone'] !== ''): ?>
                      <?php links_whatsapp($p['telefone'], 'Convidar', mensagem_de_escala($p, $aberto, $chave), 'btn btn-mini'); ?>
                    <?php endif; ?>
                    <?php
                      /* Os três estados como botões, e não como `<select>`: são
                         três toques diferentes no celular, feitos em momentos
                         diferentes, e um seletor obrigaria a abrir, escolher e
                         confirmar para dizer "topou". */
                      $botoes = [
                          'convidado' => 'Convidei',
                          'topou'     => 'Topou',
                          'nao-posso' => 'Não pode',
                      ];
                    ?>
                    <?php foreach ($botoes as $valor => $rotulo): ?>
                      <?php if ($estado === $valor) { continue; } ?>
                      <form method="post">
                        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                        <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                        <input type="hidden" name="acao" value="aceite">
                        <input type="hidden" name="peca" value="<?= h($chave) ?>">
                        <input type="hidden" name="quem" value="<?= h($id) ?>">
                        <input type="hidden" name="estado" value="<?= h($valor) ?>">
                        <button class="btn btn-mini" type="submit"><?= h($rotulo) ?></button>
                      </form>
                    <?php endforeach; ?>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>

          <?php foreach ($lista['itens'] as $i => $texto): ?>
            <form method="post" class="risco-linha">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
              <input type="hidden" name="acao" value="marcar">
              <input type="hidden" name="peca" value="<?= h($chave) ?>">
              <input type="hidden" name="item" value="<?= $i ?>">
              <button type="submit" class="risco<?= in_array($i, $marcados, true) ? ' risco-feito' : '' ?>">
                <span class="risco-caixa" aria-hidden="true"><?= in_array($i, $marcados, true) ? '✓' : '' ?></span>
                <span><?= h($texto) ?></span>
              </button>
            </form>
          <?php endforeach; ?>
        </div>
      </details>
    <?php endforeach; ?>
  </fieldset>
  <?php
}
