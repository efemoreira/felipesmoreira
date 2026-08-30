<?php
declare(strict_types=1);

/**
 * A LISTA de encontros — a tela que `/painel/eventos` mostra sem `?e=`.
 *
 * DUAS LISTAS, UMA EM CIMA DA OUTRA. Os próximos primeiro, o que já aconteceu
 * embaixo — a mesma pergunta ("quais encontros existem?") lida de cima para
 * baixo, sem trocar de aba para saber de que lado está o encontro procurado.
 *
 * ISTO SÓ VALE PORQUE O ITEM É UM LINK. Cada linha aqui é nome, família, data,
 * local e preparo — uma linha que leva para outro lugar, e não um bloco que se
 * lê inteiro. Vinte links continuam sendo uma lista que se varre com o olho, e
 * a rolagem vira índice em vez de obstáculo. A mesma decisão em `/painel/fatos`
 * seria errada, e lá foi tomada ao contrário: ficha, formulário e arquivo são
 * conteúdo, e empilhados um esconde o outro.
 *
 * O que empilhar cobra é o crescimento, e é isso que o TETO paga: o que já
 * aconteceu não encolhe nunca, e sem limite a lista de baixo empurraria a de
 * cima para fora da tela em duas semanas de campanha. Embaixo só entram os
 * quinze mais recentes; o resto se alcança pela busca, que recorta as duas de
 * uma vez.
 *
 * Mora fora do `eventos.php` pelo mesmo motivo que o encontro aberto: são duas
 * telas diferentes que só dividem a rota, e lê-las juntas era rolar por uma
 * para achar a outra.
 */

require_once __DIR__ . '/agenda-comum.php';  // semana_de(), dia_de() — o recorte de período
require_once __DIR__ . '/eventos-comum.php';  // o modelo do encontro e da presença
require_once __DIR__ . '/eventos-followup.php';  // bloco_follow_up() — a fila transversal
require_once __DIR__ . '/icones.php';  // icone()
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_filtros(), abrir_modal() — a moldura
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo

/**
 * Quantos encontros já acontecidos a lista de baixo desenha.
 *
 * O contador da legenda continua contando TODOS — "Já aconteceram (63)" com
 * quinze na tela é a verdade dita inteira, e é ela que faz alguém procurar em
 * vez de rolar atrás de um encontro de abril.
 */
const TETO_PASSADOS = 15;

/**
 * Desenha a lista inteira, do cabeçalho ao modal de novo encontro.
 *
 * `$erro` e `$ok` vêm do recado guardado na sessão pela ação anterior — é o
 * outro lado do POST-redirect-GET.
 */
function tela_lista_de_encontros(bool $coordena, array $eu, ?string $erro, ?string $ok): void
{
    abrir_pagina('Encontros');
    ?>
    <div class="capa">
      <?php cabecalho_pagina(
          'Encontros',
          'As cinco peças de cada encontro, a lista de presença e o follow-up de quem veio.',
          null,
          '/painel/eventos',
          [
              'Cada encontro tem cinco peças com checklist — Local & Hora, Logística, Divulgação, Gravação, Recepção.',
              'O QR da mesa deixa quem chega se cadastrar sozinho, em vez de fazer fila.',
              'Quem compareceu entra no funil D+0 · D+3 · D+7: agradecer, mandar conteúdo, chamar para o próximo.',
              'Criar, cancelar e ver telefone é da coordenação; executar e receber é de quem está escalado.',
          ]
      ); ?>

      <?php recado($erro, $ok); ?>

      <?php if ($coordena): ?>
        <div class="acoes" style="margin:0 0 22px">
          <?php botao_modal('novo-encontro', 'Novo encontro', 'novo=1'); ?>
        </div>
      <?php endif; ?>
      <?php /* A lista de todo mundo do movimento mudou de casa: mora em
               /painel/pessoas, que é a tela com a ficha completa — em que
               encontros cada um esteve, o que faz, o que abre no painel. Aqui
               ficaria uma segunda lista de pessoas, sempre um passo atrás da
               verdadeira. */ ?>
      <?php if (pode('pessoas')): ?>
        <p class="dica" style="margin:0 0 22px">
          Procurando alguém específico, ou querendo saber quem nunca falta?
          <a href="/painel/pessoas.php">Abra a lista de pessoas</a> — ela mostra a
          ficha completa e todos os encontros de cada um.
        </p>
      <?php endif; ?>

      <?php
      /* Duas listas, uma de cada vez. A aba escolhe qual desenhar e mostra o
         número da outra — quem procura um encontro vê pelo contador de que lado
         ele está, sem ter de rolar até lá. */
      /* `eventos_a_vir()`, e não `eventos_proximos()`: a lista da tela mostra o
         encontro cancelado que ainda não aconteceu, marcado como CANCELADO no
         cartão. O hub continua com `eventos_proximos()`, que exclui os
         cancelados — lá a pergunta é "para onde eu vou", e não "o que existe". */
      $proximos = eventos_a_vir();
      $passados = eventos_passados();
      $quantosTem = count($proximos) + count($passados);

      /* A busca e o período recortam as DUAS listas, e por isso moram acima das
         duas. A busca é o caminho para o encontro antigo que não coube no teto
         da lista de baixo: sem ela, "achar o encontro de abril" viraria rolagem. */
      $buscaEv = limpar_texto($_GET['q'] ?? '', 60);
      if ($buscaEv !== '') {
          $recorte = fn (array $e) => combina_com(
              [$e['titulo'], $e['local'], $e['subtitulo'], $e['data'], FAMILIAS[$e['familia']]['nome']],
              $buscaEv
          );
          $proximos = array_values(array_filter($proximos, $recorte));
          $passados = array_values(array_filter($passados, $recorte));
      }

      /* O PERÍODO SEGUE O RELÓGIO, e não uma data digitada. "Esta semana" é a
         semana corrente de segunda a domingo, no fuso do Ceará — a mesma que o
         site usa em /programacao, e por isso vem de `semana_de()`, que tem par
         em TypeScript.

         O padrão é TUDO, de propósito: esta é a tela de trabalho da
         coordenação, e abrir escondendo os encontros do mês que vem seria
         esconder trabalho de quem veio justamente preparar. Quem quer o recorte
         pede por ele.

         Encontro sem horário fica de fora dos dois recortes: dizer que ele é
         "de hoje" seria inventar uma data que ninguém digitou. Ele continua em
         "todos". */
      $quandoEv = (string) ($_GET['quando'] ?? '');
      if (!in_array($quandoEv, ['hoje', 'semana'], true)) {
          $quandoEv = '';
      }
      if ($quandoEv !== '') {
          $janela = $quandoEv === 'hoje' ? dia_de() : semana_de();
          $noPeriodo = fn (array $e) => dentro_do_periodo($e['inicio'], $janela);
          $proximos = array_values(array_filter($proximos, $noPeriodo));
          $passados = array_values(array_filter($passados, $noPeriodo));
      }
      $recortado = $buscaEv !== '' || $quandoEv !== '';

      /* Um HTML só para as duas listas. Duas cópias do cartão divergiriam na
         primeira vez que alguém acrescentasse um dado a uma delas. */
      $cartao = function (array $e): void {
          $p = preparo_do_evento($e);
          $presentes = count(array_filter(presencas_do_evento($e['id']), fn ($l) => $l['compareceu']));
          ?>
          <a class="area-cartao" href="?e=<?= h($e['id']) ?>">
            <span class="area-icone"><?= icone('ticket') ?></span>
            <span class="area-texto">
              <strong><?= h($e['titulo']) ?></strong>
              <span>
                <?= h(FAMILIAS[$e['familia']]['nome']) ?> ·
                <?= h(data_cheia($e)) ?>
                <?= $e['local'] !== '' ? ' · ' . h($e['local']) : '' ?><br>
                Preparo <?= $p['feito'] ?>/<?= $p['total'] ?>
                <?= $presentes > 0 ? ' · ' . $presentes . ' presentes' : '' ?>
                <?= $e['status'] === 'cancelado' ? ' · CANCELADO' : '' ?>
              </span>
            </span>
          </a>
          <?php
      };
      ?>

      <?php
      /* A ABA ABRE NOS PRÓXIMOS, sempre: é o trabalho. O contador da outra
         continua visível, e é ele que responde "existe histórico?" sem custar
         uma rolagem.

         Os contadores contam o RECORTE, e não a base: procurar "Juazeiro" com a
         aba dizendo o total faria o zero da lista parecer defeito. */
      $pedidaEv = (string) ($_GET['aba'] ?? '');
      $abaEv = in_array($pedidaEv, ['passados', 'follow-up'], true) ? $pedidaEv : 'proximos';

      /* O FOLLOW-UP É DA COORDENAÇÃO — quem só executa não vê telefone nem
         responde por lead, e a aba nem existe para ele. A mesma trava da aba
         de follow-up dentro do encontro. */
      $vencidos = $coordena ? follow_ups_vencidos() : [];
      if (!$coordena && $abaEv === 'follow-up') {
          $abaEv = 'proximos';
      }

      $abasEv = [
          'proximos' => ['nome' => 'Próximos',       'conta' => count($proximos)],
          'passados' => ['nome' => 'Já aconteceram', 'conta' => count($passados)],
      ];
      if ($coordena) {
          /* A terceira aba não lista encontros, e sim GENTE — é a fila da
             função Follow-up, que atravessa todos os encontros. Ela mora aqui
             porque é da área de Encontros e usa a mesma busca; o que ela não
             pode é continuar só dentro de um encontro, onde a pergunta "quem
             hoje?" obrigava a abrir dez telas para ser respondida. */
          $abasEv['follow-up'] = ['nome' => 'Follow-up', 'conta' => count($vencidos)];
      }
      barra_abas($abasEv, $abaEv, 'aba', 'Encontros');
      ?>

      <?php /* Só aparece quando há o que procurar: com três encontros os
               controles ficam em cima de uma lista que já cabe na tela. */ ?>
      <?php if ($abaEv !== 'follow-up' && ($quantosTem > 6 || $recortado)): ?>
        <?php barra_filtros(
            [
                ['tipo' => 'busca', 'valor' => $buscaEv, 'dica' => 'nome, local, cidade ou data'],
                ['tipo' => 'escolha', 'nome' => 'quando', 'rotulo' => 'Quando',
                 'valor' => $quandoEv, 'vazio' => 'todos',
                 'opcoes' => ['hoje' => 'Hoje', 'semana' => 'Esta semana']],
            ],
            $recortado,
            '/painel/eventos.php?aba=' . $abaEv,
            ['aba' => $abaEv]
        ); ?>
      <?php endif; ?>

      <?php if ($abaEv === 'follow-up'): ?>
        <?php barra_busca($buscaEv, 'nome, cidade ou encontro', ['aba' => 'follow-up']); ?>
      <?php endif; ?>

      <?php if ($abaEv === 'follow-up'): ?>
        <?php /* nada a dizer sobre listas de encontro nesta aba */ ?>
      <?php elseif ($quandoEv !== '' && $proximos === [] && $passados === []): ?>
        <p class="dica" style="margin:0 0 18px">
          Nenhum encontro <?= $quandoEv === 'hoje' ? 'hoje' : 'nesta semana' ?>
          (<?= h($quandoEv === 'hoje' ? 'hoje' : periodo_da_semana()) ?>).
          <a href="/painel/eventos.php?aba=<?= h($abaEv) ?>">Ver todos</a>.
        </p>
      <?php elseif ($buscaEv !== '' && $proximos === [] && $passados === []): ?>
        <?php /* Uma vez só, e não uma por lista: quem procurou "Juazeiro" e não
                 achou nada não precisa ler o mesmo aviso duas vezes. */ ?>
        <?php nada_encontrado($buscaEv, '/painel/eventos.php?aba=' . $abaEv); ?>
      <?php endif; ?>

      <?php if ($abaEv === 'follow-up'): ?>
        <?php bloco_follow_up($eu, $vencidos, $buscaEv); ?>
      <?php elseif ($abaEv === 'proximos'): ?>
        <fieldset id="proximos">
          <legend>
            Próximos (<?= count($proximos) ?><?= $recortado ? ' de ' . $quantosTem : '' ?>)
          </legend>

          <?php if ($proximos === [] && !$recortado): ?>
            <p class="dica" style="margin:0 0 8px">
              Nenhum encontro marcado. O primeiro passo é <strong>Local &amp; Hora</strong>: três
              opções avaliadas (capacidade, custo, acesso, energia, som) antes de fechar qualquer
              coisa — e a reserva confirmada por escrito. Toque em <strong>Novo encontro</strong>
              lá em cima e as cinco peças aparecem prontas para dividir.
            </p>
          <?php elseif ($proximos === []): ?>
            <p class="dica" style="margin:0">Nenhum dos próximos casa com o recorte.</p>
          <?php endif; ?>

          <?php foreach ($proximos as $e): ?>
            <?php $cartao($e); ?>
          <?php endforeach; ?>
        </fieldset>
      <?php else: ?>
        <?php /* O TETO vale mesmo em aba própria: "já aconteceram" não encolhe
                 nunca, e rolar cento e vinte encontros para achar o de abril é
                 pior que procurar por ele. Quinze é o mesmo corte que as outras
                 telas do painel usam para arquivo. */ ?>
        <?php $mostrados = array_slice($passados, 0, TETO_PASSADOS); ?>
        <fieldset id="passados">
          <legend>
            Já aconteceram (<?= count($passados) ?><?= $recortado ? ' de ' . $quantosTem : '' ?>)
          </legend>

          <?php if ($passados === [] && !$recortado): ?>
            <p class="dica" style="margin:0">Nenhum encontro aconteceu ainda.</p>
          <?php elseif ($passados === []): ?>
            <p class="dica" style="margin:0">Nenhum dos já realizados casa com o recorte.</p>
          <?php endif; ?>

          <?php foreach ($mostrados as $e): ?>
            <?php $cartao($e); ?>
          <?php endforeach; ?>

          <?php if (count($passados) > count($mostrados)): ?>
            <p class="dica" style="margin:12px 0 0">
              Mostrando os <?= count($mostrados) ?> mais recentes de <?= count($passados) ?>.
              Procure pelo nome, local ou data para achar um encontro mais antigo.
            </p>
          <?php endif; ?>
        </fieldset>
      <?php endif; ?>

      <?php if ($coordena): ?>
        <?php /* O formulário vivia solto no fim da página, embaixo de duas listas
                 que podem ter dezenas de encontros — criar um exigia rolar até o
                 fim, toda vez. Agora é um <dialog>.

                 O botão é um LINK de verdade para `?novo=1`, e não um botão que
                 só existe com JavaScript: sem JS a página recarrega com o modal
                 já aberto (atributo `open`) e o formulário continua ali. */ ?>
        <dialog id="novo-encontro" class="modal"<?= isset($_GET['novo']) ? ' open' : '' ?>>
          <form method="dialog" class="modal-fechar">
            <button type="submit" aria-label="Fechar">&times;</button>
          </form>
          <h2>Novo encontro</h2>
          <?php /* Rascunho: são onze campos, e quem marca um encontro faz isso
                   no celular, entre uma conversa e outra. */ ?>
          <form method="post" enctype="multipart/form-data" data-rascunho="encontro-novo">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="criar">
            <div class="campo">
              <label for="titulo">Nome do encontro</label>
              <input id="titulo" type="text" name="titulo" maxlength="120" required>
            </div>
            <div class="campo">
              <label for="familia">Família</label>
              <select id="familia" name="familia" required>
                <?php foreach (FAMILIAS as $chave => $f): ?>
                  <option value="<?= h($chave) ?>"><?= h($f['nome']) ?> — <?= h($f['serve']) ?></option>
                <?php endforeach; ?>
              </select>
              <p class="dica">A família traz o playbook, as travas e o material específico.</p>
            </div>
            <div class="linha g2">
              <div class="campo">
                <label for="dia">Dia</label>
                <input id="dia" type="date" name="dia" required>
              </div>
              <div class="campo">
                <label for="hora">Hora <span class="dica">— dá para deixar em branco</span></label>
                <input id="hora" type="time" name="hora">
              </div>
            </div>
            <p class="dica">
              Horário do Ceará. É daqui que saem o dia da semana, a data e a hora que o
              site mostra — nenhum dos três se digita à parte. Sem hora, o encontro
              continua na lista pelo dia, só sem horário no cartão.
            </p>
            <div class="campo">
              <label for="img-novo">Imagem <span class="dica">— opcional</span></label>
              <input id="img-novo" type="file" name="imagem" accept="image/*">
              <p class="dica">
                JPG, PNG ou WEBP até 8 MB. Ela é reduzida e cortada no cartão; sem
                imagem, entra o fundo hachurado com a sigla do dia.
              </p>
            </div>
            <label class="check">
              <input type="checkbox" name="naAgenda" value="1" checked>
              Aparecer na programação pública
            </label>
            <p class="dica">
              Marcado, o encontro entra em <a href="/programacao" target="_blank">/programacao</a>
              assim que você salvar. Desmarque para reunião fechada, jantar com liderança
              e o que mais não deva ser divulgado.
            </p>
            <div class="acoes">
              <button type="submit" class="btn btn-ouro">Criar encontro</button>
            </div>
          </form>
        </dialog>
      <?php else: ?>
        <p class="dica">Só a coordenação cria encontro. Você executa e cadastra presença.</p>
      <?php endif; ?>
    </div>
    <?php
    fechar_pagina();
}
