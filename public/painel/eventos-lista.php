<?php
declare(strict_types=1);

/**
 * A LISTA de encontros — a tela que `/painel/eventos` mostra sem `?e=`.
 *
 * Duas listas, uma de cada vez: empilhadas, a de "já aconteceram" cresce para
 * sempre e empurra a dos próximos — a que interessa — para fora da tela em duas
 * semanas de campanha. A aba diz o número das duas sem desenhar nenhuma.
 *
 * Mora fora do `eventos.php` pelo mesmo motivo que o encontro aberto: são duas
 * telas diferentes que só dividem a rota, e lê-las juntas era rolar por uma
 * para achar a outra.
 */

/**
 * Desenha a lista inteira, do cabeçalho ao modal de novo encontro.
 *
 * `$erro` e `$ok` vêm do recado guardado na sessão pela ação anterior — é o
 * outro lado do POST-redirect-GET.
 */
function tela_lista_de_encontros(bool $coordena, ?string $erro, ?string $ok): void
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
      /* Duas listas, uma de cada vez. Empilhadas, a de "já aconteceram" cresce
         para sempre e empurra a que interessa — a dos próximos — para fora da
         tela em duas semanas de campanha. A aba diz o número das duas sem
         desenhar nenhuma das duas. */
      $proximos = eventos_proximos();
      $passados = eventos_passados();
      $quantosTem = count($proximos) + count($passados);

      /* A busca recorta as DUAS listas antes de a aba escolher uma. Sem isso o
         contador da aba fechada mentiria — diria quantos existem, e não quantos
         casam com o que foi digitado —, e quem procurasse "Juazeiro" na aba
         errada veria um zero sem entender que o encontro estava na outra. */
      $buscaEv = limpar_texto($_GET['q'] ?? '', 60);
      if ($buscaEv !== '') {
          $recorte = fn (array $e) => combina_com(
              [$e['titulo'], $e['local'], $e['subtitulo'], $e['data'], FAMILIAS[$e['familia']]['nome']],
              $buscaEv
          );
          $proximos = array_values(array_filter($proximos, $recorte));
          $passados = array_values(array_filter($passados, $recorte));
      }

      $abaEv = ($_GET['aba'] ?? '') === 'passados' ? 'passados' : 'proximos';
      barra_abas([
          'proximos' => ['nome' => 'Próximos',       'conta' => count($proximos)],
          'passados' => ['nome' => 'Já aconteceram', 'conta' => count($passados)],
      ], $abaEv, 'aba', 'Encontros');
      $titulo = $abaEv === 'passados' ? 'Já aconteceram' : 'Próximos';
      $lista  = $abaEv === 'passados' ? $passados : $proximos;
      ?>
        <fieldset>
          <legend>
            <?= h($titulo) ?> (<?= count($lista) ?><?= $buscaEv !== '' ? ' de ' . $quantosTem : '' ?>)
          </legend>

          <?php /* Só aparece quando há o que procurar: com três encontros a caixa
                   é um controle em cima de uma lista que já cabe na tela. */ ?>
          <?php if ($quantosTem > 6 || $buscaEv !== ''): ?>
            <?php barra_busca($buscaEv, 'nome, local, cidade ou data', ['aba' => $abaEv]); ?>
          <?php endif; ?>
          <?php if ($lista === [] && $buscaEv !== ''): ?>
            <?php nada_encontrado($buscaEv, '/painel/eventos.php?aba=' . urlencode($abaEv)); ?>
          <?php elseif ($lista === [] && $titulo === 'Próximos'): ?>
            <p class="dica" style="margin:0 0 8px">
              Nenhum encontro marcado. O primeiro passo é <strong>Local &amp; Hora</strong>: três
              opções avaliadas (capacidade, custo, acesso, energia, som) antes de fechar qualquer
              coisa — e a reserva confirmada por escrito. Toque em <strong>Novo encontro</strong>
              lá em cima e as cinco peças aparecem prontas para dividir.
            </p>
          <?php elseif ($lista === []): ?>
            <p class="dica" style="margin:0">Nada por aqui.</p>
          <?php endif; ?>
          <?php foreach ($lista as $e): ?>
            <?php $p = preparo_do_evento($e); $presentes = count(array_filter(presencas_do_evento($e['id']), fn ($l) => $l['compareceu'])); ?>
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
          <?php endforeach; ?>
        </fieldset>

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
