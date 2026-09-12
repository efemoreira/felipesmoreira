<?php
declare(strict_types=1);

/**
 * A aba Peças da Munição — o acervo, e o formulário de criar e corrigir.
 *
 * As oito peças fixas vêm do plano e vivem no código do site (não envelhecem).
 * O que se cria aqui é a peça da semana, que precisaria de um build para
 * existir se dependesse do repositório — e por isso ela é gravada em
 * dados/kit.php e servida pelo api/kit.php.
 *
 * O nome dos arquivos continua "kit": `kit-comum.php`, `api/kit.php` e
 * `dados/kit.php` são contrato interno e arquivo em produção. Renomeá-los seria
 * risco sem ganho — o que muda é o nome que a pessoa lê.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/kit-comum.php';

/**
 * O formulário da peça — um só, desenhado em dois modais.
 *
 * Criar e corrigir perguntam exatamente a mesma coisa; duas cópias divergiriam
 * no dia em que um campo novo entrasse só numa delas, e o defeito apareceria
 * como "some quando eu edito".
 *
 * Os ids levam sufixo no modal de edição porque os dois formulários coexistem
 * no documento: id repetido faz o `<label for>` apontar para o campo errado, e
 * no celular o toque no rótulo foca o outro modal.
 */
function formulario_peca(?array $p): void
{
    $e = $p !== null ? '-e' : '';
    $v = fn (string $campo, string $padrao = '') => h($p[$campo] ?? $padrao);
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <?php if ($p !== null): ?>
        <input type="hidden" name="id" value="<?= h($p['id']) ?>">
      <?php endif; ?>

      <div class="campo">
        <label for="kit-numero<?= $e ?>">O número, curto (é o que fica grande no cartão)</label>
        <input id="kit-numero<?= $e ?>" name="numero" type="text" maxlength="20" required
               placeholder="64 mil" value="<?= $v('numero') ?>">
      </div>

      <div class="campo">
        <label for="kit-frase<?= $e ?>">A frase que explica o número</label>
        <input id="kit-frase<?= $e ?>" name="frase" type="text" maxlength="160" required
               placeholder="pessoas esperando na fila da regulação." value="<?= $v('frase') ?>">
      </div>

      <div class="campo">
        <label for="kit-fonte<?= $e ?>">A fonte, com página ou data</label>
        <input id="kit-fonte<?= $e ?>" name="fonte" type="text" maxlength="80" required
               placeholder="Plano de Governo, p. 31" value="<?= $v('fonte') ?>">
      </div>

      <div class="linha g2">
        <div class="campo">
          <label for="kit-tema<?= $e ?>">Tema</label>
          <select id="kit-tema<?= $e ?>" name="tema">
            <?php foreach (TEMAS_KIT as $t): ?>
              <option value="<?= h($t) ?>" <?= ($p['tema'] ?? '') === $t ? 'selected' : '' ?>><?= h($t) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="campo">
          <label for="kit-destino<?= $e ?>">Para onde o link leva</label>
          <input id="kit-destino<?= $e ?>" name="destino" type="text" maxlength="120"
                 value="<?= $v('destino', '/propostas') ?>" placeholder="/propostas#saude-que-chega">
        </div>
      </div>

      <div class="campo">
        <label for="kit-legenda<?= $e ?>">O texto pronto pra colar</label>
        <textarea id="kit-legenda<?= $e ?>" name="legenda" rows="5" maxlength="900"
                  placeholder="64 mil cearenses esperando na fila da regulação..."><?= $v('legenda') ?></textarea>
      </div>

      <?php if ($p !== null): ?>
        <p class="dica">
          O endereço da peça não muda quando o número muda: ele já é o nome do PNG que
          alguém baixou e o link que já circula no grupo.
          <?php if ($p['publicada']): ?>
            <strong>Esta peça está no ar</strong> — a correção vale na Munição assim que salvar.
          <?php endif; ?>
        </p>
      <?php endif; ?>

      <div class="acoes" style="margin-top:12px">
        <button class="btn btn-ouro" name="acao" value="<?= $p !== null ? 'kit-salvar' : 'kit-nova' ?>" type="submit">
          <?= $p !== null ? 'Salvar a peça' : 'Criar peça' ?>
        </button>
      </div>
    </form>
    <?php
}

/** A aba inteira: recorte, lista e os modais de criar e corrigir. */
function aba_de_pecas(): void
{
    $pecasKit = ler_pecas();
    $noAr = count(array_filter($pecasKit, fn ($p) => $p['publicada']));

    /* Qual peça está aberta para edição. É um GET (`?editar=<id>`), e não estado de
       JavaScript, pelo mesmo motivo dos outros modais do painel: sem JS a página
       recarrega com o `<dialog open>` e o formulário continua ali. */
    $editando = null;
    if (isset($_GET['editar'])) {
        $alvo = normalizar_id_peca((string) $_GET['editar']);
        foreach ($pecasKit as $pc) {
            if ($pc['id'] === $alvo) {
                $editando = $pc;
                break;
            }
        }
    }

    /* ---------------- recorte ---------------- */

    $busca   = limpar_texto($_GET['q'] ?? '', 60);
    $temaF   = (string) ($_GET['tema'] ?? '');
    if (!in_array($temaF, TEMAS_KIT, true)) {
        $temaF = '';
    }
    $estadoF = in_array($_GET['estado'] ?? '', ['no-ar', 'rascunho'], true) ? (string) $_GET['estado'] : '';

    $visiveis = $pecasKit;
    if ($busca !== '') {
        /* Casa também pela legenda: quem procura uma peça quase sempre tem na mão o
           texto que colou no grupo, e não o número que ficou grande no cartão. */
        $visiveis = array_values(array_filter(
            $visiveis,
            fn ($p) => combina_com([$p['numero'], $p['frase'], $p['fonte'], $p['legenda'], $p['tema'], $p['criadaPor']], $busca)
        ));
    }
    if ($temaF !== '') {
        $visiveis = array_values(array_filter($visiveis, fn ($p) => $p['tema'] === $temaF));
    }
    if ($estadoF !== '') {
        $visiveis = array_values(array_filter($visiveis, fn ($p) => $p['publicada'] === ($estadoF === 'no-ar')));
    }

    /* As mais novas primeiro: a peça da semana é a que se procura, e a de três
       semanas atrás já circulou. */
    usort($visiveis, fn ($a, $b) => strcmp((string) $b['criadaEm'], (string) $a['criadaEm']));

    $porTema = [];
    foreach ($pecasKit as $p) {
        $porTema[$p['tema']] = ($porTema[$p['tema']] ?? 0) + 1;
    }
    ?>
  <fieldset id="pecas">
    <legend>As peças (<?= $noAr ?> no ar de <?= count($pecasKit) ?>)</legend>
      <p class="dica" style="margin:0 0 14px">
      A <a href="/municao" target="_blank">Munição</a> já vem com as peças fixas do plano de
      governo, que não envelhecem. Aqui entra o que é da semana — o fato que acabou de sair, o
      número novo. Só aparece no site depois de publicada, e <strong>peça sem fonte não é
      aceita</strong>: ela circula muito mais longe que um post.
      </p>

      <div class="acoes" style="margin:0 0 18px">
        <?php botao_modal('nova-peca', 'Nova peça', 'aba=pecas&novo=1'); ?>
      </div>

      <?php /* O filtro só aparece quando há o que filtrar: com quatro peças ele é
               três controles em cima de uma lista que já cabe na tela. */ ?>
      <?php if (count($pecasKit) > 6 || $busca !== '' || $temaF !== '' || $estadoF !== ''): ?>
        <?php
          $opcoesTema = [];
          foreach (TEMAS_KIT as $t) {
              if (($porTema[$t] ?? 0) === 0 && $temaF !== $t) {
                  continue;
              }
              $opcoesTema[$t] = $t . ' (' . (int) ($porTema[$t] ?? 0) . ')';
          }
          barra_filtros(
              [
                  ['tipo' => 'busca', 'valor' => $busca, 'dica' => 'número, frase, fonte ou legenda'],
                  ['tipo' => 'escolha', 'nome' => 'tema', 'rotulo' => 'Tema',
                   'valor' => $temaF, 'vazio' => 'todos', 'opcoes' => $opcoesTema],
                  ['tipo' => 'escolha', 'nome' => 'estado', 'rotulo' => 'Estado',
                   'valor' => $estadoF, 'vazio' => 'todos', 'opcoes' => [
                       'no-ar'    => 'no ar (' . $noAr . ')',
                       'rascunho' => 'rascunho (' . (count($pecasKit) - $noAr) . ')',
                   ]],
              ],
              $busca !== '' || $temaF !== '' || $estadoF !== '',
              '/painel/municao.php?aba=pecas'
          );
        ?>
      <?php endif; ?>

      <?php if ($pecasKit === []): ?>
        <p class="dica" style="margin:0">
          Nenhuma peça da semana ainda. As oito fixas do plano continuam na Munição —
          o que entra aqui é o número que saiu agora.
        </p>
      <?php elseif ($visiveis === []): ?>
        <?php nada_encontrado($busca, '/painel/municao.php?aba=pecas', 'Nenhuma peça com esse recorte.'); ?>
      <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Peça</th><th>Fonte</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($visiveis as $pc): ?>
              <tr>
                <td>
                  <strong><?= h($pc['numero']) ?></strong><br>
                  <span class="dica"><?= h($pc['frase']) ?></span>
                </td>
                <td class="meia" data-rotulo="Fonte"><span class="selo"><?= h($pc['fonte']) ?></span></td>
                <td class="meia" data-rotulo="Estado">
                  <span class="selo <?= $pc['publicada'] ? 'selo-ok' : 'selo-cinza' ?>">
                    <?= $pc['publicada'] ? 'no ar' : 'rascunho' ?>
                  </span>
                </td>
                <td class="rodape">
                  <div class="acoes-celula">
                    <?php /* Três botões viravam a coluna mais pesada da lista, e a peça
                             — que é o que se lê aqui — ficava em segundo plano. */ ?>
                    <?php menu_acoes([
                        ['texto' => 'Corrigir', 'url' => '?aba=pecas&editar=' . urlencode($pc['id']), 'modal' => 'editar-peca'],
                        [
                            'texto'  => $pc['publicada'] ? 'Recolher do site' : 'Publicar no site',
                            'acao'   => 'kit-publicar',
                            'campos' => ['id' => $pc['id']],
                        ],
                        [
                            'texto'     => 'Apagar',
                            'acao'      => 'kit-apagar',
                            'campos'    => ['id' => $pc['id']],
                            'confirmar' => 'Apagar esta peça?',
                            'risco'     => true,
                        ],
                    ]); ?>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php endif; ?>
  </fieldset>

  <?php /* Os modais ficam no fim do documento, e não dentro do <fieldset> nem da
           tabela: <dialog> aninhado ali é HTML inválido, o navegador reorganiza a
           árvore sozinho e o formulário some sem um erro sequer no console. */ ?>
  <?php abrir_modal('nova-peca', 'Nova peça', isset($_GET['novo'])); ?>
    <?php formulario_peca(null); ?>
  <?php fechar_modal(); ?>

  <?php if ($editando !== null): ?>
    <?php abrir_modal('editar-peca', 'Corrigir “' . $editando['numero'] . '”', true); ?>
      <?php formulario_peca($editando); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
    <?php
}
