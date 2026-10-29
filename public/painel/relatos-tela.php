<?php
declare(strict_types=1);

/**
 * A TELA de /painel/relatos: duas abas, relatos e ideias.
 *
 * Duas listas, e não uma: relato é problema que espera resposta, ideia é
 * proposta que espera leitura — misturadas, a ideia nova ficaria embaixo do
 * relato de segurança, e o relato de segurança embaixo de dez ideias.
 *
 * Cada linha mostra o que a pessoa disse inteiro; decidir abre um modal
 * (`?decidir=<id>`), como a correção da ficha em Fatos — sem JavaScript a página
 * recarrega com o `<dialog open>` e o formulário está ali.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/relatos-comum.php';
require_once __DIR__ . '/organizacao-tela.php';  // form_abre(), form_fecha(), escolha()

function tela_de_relatos(array $eu, ?string $erro, ?string $ok): void
{
    $aba = ($_GET['aba'] ?? '') === 'ideias' ? 'ideias' : 'relatos';
    $tipo = $aba === 'ideias' ? 'ideia' : 'relato';
    $todos = array_reverse(ler_relatos());
    $relatos = array_values(array_filter($todos, fn ($r) => $r['tipo'] === 'relato'));
    $ideias = array_values(array_filter($todos, fn ($r) => $r['tipo'] === 'ideia'));
    $lista = $aba === 'ideias' ? $ideias : $relatos;
    /* Na porta primeiro: o que ninguém olhou sobe, e o resto segue do mais novo. */
    usort($lista, fn ($a, $b) => (int) relato_na_porta($b) <=> (int) relato_na_porta($a));
    $decidindo = achar_relato(limpar_texto($_GET['decidir'] ?? '', 40));
    $verTelefone = tem_capacidade('coordenacao') || pode('pessoas');
    $quando = fn (string $iso) => ($t = strtotime($iso)) ? date('d/m \à\s H:i', $t) : '';

    abrir_pagina('Relatos e ideias');
    ?>
<div class="capa">
  <?php cabecalho_pagina('Relatos e ideias', '', null, null, [
      'O que chega pelo Paulo, no WhatsApp, e não é inscrição: relatos com protocolo e ideias para o bairro, a cidade ou a organização.',
      'Decidir é mudar o andamento e, se for o caso, escrever a resposta para quem relatou — o Paulo a repassa quando a pessoa perguntar pelo protocolo.',
      'A nota é interna: não sai daqui.',
      'Fotos e arquivos ficam com o Paulo, anexados ao protocolo; o link leva até eles.',
  ]); ?>

  <?php recado($erro, $ok); ?>

  <?php barra_abas([
      'relatos' => ['nome' => 'Relatos', 'conta' => count($relatos)],
      'ideias'  => ['nome' => 'Ideias', 'conta' => count($ideias)],
  ], $aba, 'aba', 'Relatos e ideias'); ?>

  <?php if ($lista === []): ?>
    <?php vazio($tipo === 'ideia' ? 'Nenhuma ideia chegou pelo Paulo ainda.' : 'Nenhum relato chegou pelo Paulo ainda.'); ?>
  <?php else: ?>
    <div class="rolagem cartoes">
      <table class="tabela">
        <thead><tr><th>O quê</th><th>Quem</th><th>Andamento</th><th>Ações</th></tr></thead>
        <tbody>
          <?php foreach ($lista as $r): ?>
            <tr id="r-<?= h($r['id']) ?>">
              <td>
                <strong><?= h($tipo === 'ideia' ? ($r['tema'] !== '' ? $r['tema'] : 'Ideia') : CATEGORIAS_RELATO[$r['categoria']]) ?></strong>
                <span class="dica">· <?= h($r['protocolo']) ?> · <?= h($quando($r['criadoEm'])) ?></span><br>
                <?= nl2br(h($r['texto'])) ?>
                <?php if ($r['local'] !== ''): ?><br><span class="dica">Local: <?= h($r['local']) ?></span><?php endif; ?>
                <?php if ($r['anexos'] > 0): ?>
                  <br><span class="dica"><?= (int) $r['anexos'] ?> anexo(s)</span>
                  <?php if ($r['link'] !== ''): ?> · <a href="<?= h($r['link']) ?>" target="_blank" rel="noopener noreferrer">ver no Paulo</a><?php endif; ?>
                <?php endif; ?>
              </td>
              <td data-rotulo="Quem">
                <?php if ($r['anonimo']): ?>
                  <span class="selo selo-cinza">sem identificação</span>
                <?php else: ?>
                  <?= h($r['nome'] !== '' ? $r['nome'] : 'Sem nome') ?>
                  <?php if ($verTelefone && $r['telefone'] !== ''): ?><br><?php links_whatsapp($r['telefone'], $r['telefone']); ?><?php endif; ?>
                  <?php if ($r['pessoaId'] !== '' && pode('pessoas')): ?><br><a href="/painel/pessoas.php?p=<?= h($r['pessoaId']) ?>">ficha</a><?php endif; ?>
                <?php endif; ?>
              </td>
              <td data-rotulo="Andamento">
                <span class="selo <?= relato_na_porta($r) ? 'selo-atencao' : 'selo-ok' ?>"><?= h(ANDAMENTO[$r['tipo']][$r['andamento']]) ?></span>
                <?php if ($r['resposta'] !== ''): ?><br><span class="dica">Resposta: <?= h($r['resposta']) ?></span><?php endif; ?>
                <?php if ($r['nota'] !== ''): ?><br><span class="dica">Nota: <?= h($r['nota']) ?></span><?php endif; ?>
                <?php if ($r['alteradoPor'] !== ''): ?><br><span class="dica"><?= h($r['alteradoPor']) ?> · <?= h($quando($r['alteradoEm'])) ?></span><?php endif; ?>
              </td>
              <td data-rotulo="Ações">
                <div class="acoes-celula"><?php botao_modal('decidir', 'Decidir', ($aba === 'ideias' ? 'aba=ideias&' : '') . 'decidir=' . $r['id'], 'btn btn-mini'); ?></div>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>

  <?php if ($decidindo !== null): ?>
    <?php abrir_modal('decidir', $decidindo['protocolo'], true); ?>
      <p class="dica folga"><?= nl2br(h($decidindo['texto'])) ?></p>
      <?php form_abre('decidir', $decidindo['id']); ?>
      <?php escolha('rd-a', 'andamento', 'Andamento', ANDAMENTO[$decidindo['tipo']], $decidindo['andamento']); ?>
      <div class="campo">
        <label for="rd-r">Resposta para quem <?= $decidindo['tipo'] === 'ideia' ? 'propôs' : 'relatou' ?> <span class="dica">— o Paulo repassa quando perguntarem</span></label>
        <textarea id="rd-r" name="resposta" maxlength="2000" rows="3"><?= h($decidindo['resposta']) ?></textarea>
      </div>
      <div class="campo">
        <label for="rd-n">Nota interna <span class="dica">— não sai do painel</span></label>
        <textarea id="rd-n" name="nota" maxlength="1000" rows="2"><?= h($decidindo['nota']) ?></textarea>
      </div>
      <?php form_fecha('Guardar'); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
    fechar_pagina();
}
