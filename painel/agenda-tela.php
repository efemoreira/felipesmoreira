<?php
declare(strict_types=1);

/**
 * A TELA de `/painel/agenda`: a capa da programação e a lista do que está no ar.
 *
 * A LISTA AQUI É SÓ LEITURA. O encontro se cadastra UMA vez, em
 * `/painel/eventos`, e o `agenda.json` é gerado dali a cada gravação — esta tela
 * ficou com a capa (título, período, chamada, canais) e com o botão de
 * importação única, que aparece só enquanto sobrar item antigo sem encontro.
 *
 * Metade do arquivo original era o `<script>` da prévia; ele virou
 * `agenda-previa.js`, servido do próprio domínio.
 */

require_once __DIR__ . '/agenda-comum.php';
require_once __DIR__ . '/eventos-comum.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sessao.php';

function tela_de_agenda(?string $aviso, ?string $sucesso, ?array $rascunho): void
{
    $agenda = $rascunho ?? agenda_atual();
    /* A lista vem dos ENCONTROS, e não do que estiver gravado no agenda.json: se
       alguém editou um encontro e a regravação falhou, a tela tem de mostrar a
       verdade (o que existe), não o retrato velho do arquivo. */
    $itens = itens_publicos();

    /* Sobrou item no agenda.json que nunca virou encontro? Só então o botão de
       importar aparece — o site rodou meses com a agenda digitada aqui, e esses
       itens precisam de um encontro para continuarem existindo. */
    $orfas = 0;
    /* Conhecido = o id É de um encontro (item que esta tela mesma gerou), ou já foi
       importado por um. Comparar só com `importadoDe` marcaria como órfão todo item
       regerado depois da importação: o id dele passa a ser o do encontro, e nenhum
       `importadoDe` aponta para ele. O botão então nunca sumia. */
    $conhecidos = [];
    foreach (ler_eventos() as $e) {
        $conhecidos[$e['id']] = true;
        if ($e['importadoDe'] !== '') {
            $conhecidos[$e['importadoDe']] = true;
        }
    }
    foreach (($agenda['programacao'] ?? []) as $it) {
        if (($it['id'] ?? '') !== '' && !isset($conhecidos[$it['id']])) {
            $orfas++;
        }
    }
    $canaisAtivos = array_column($agenda['disponivelEm'] ?? CANAIS_PADRAO, 'icone');

    abrir_pagina('Agenda da semana');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Programação da semana',
      'Edite, salve e a página <a href="/programacao" target="_blank" rel="noopener">/programacao</a> '
      . 'muda na hora — sem publicar o site de novo.',
      null,
      null,
      [
          'Cada item tem UM horário; o dia, a data e a hora que aparecem no site saem dele.',
          'A hora é sempre a do Ceará, não a do servidor — digite o horário local e pronto.',
          'Item sem horário continua valendo: cai no fim da lista, sem “ao vivo”.',
          'A imagem é opcional; sem ela o cartão desenha a hachura do cordel.',
      ]
  ); ?>

  <?php recado($aviso, $sucesso); ?>

  <?php /* Rascunho: é a capa da programação pública, texto corrido escrito à
           mão — o tipo de coisa que dói perder. */ ?>
  <form method="post" id="form" enctype="multipart/form-data" data-rascunho="agenda-capa">
    <input type="hidden" name="acao" value="salvar">
    <input type="hidden" name="MAX_FILE_SIZE" value="<?= MAX_UPLOAD ?>">
    <input type="hidden" name="csrf" value="<?= h(token()) ?>">

    <fieldset>
      <legend>Cabeçalho</legend>
      <div class="linha g2">
        <div class="campo">
          <label for="t">Título</label>
          <input id="t" type="text" name="titulo" value="<?= h($agenda['titulo'] ?? '') ?>" maxlength="60">
          <p class="dica">A primeira palavra sai em ouro na página e na imagem.</p>
        </div>
        <div class="campo">
          <label for="p">Período</label>
          <input id="p" type="text" name="periodo" value="<?= h($agenda['periodo'] ?? '') ?>" maxlength="60" placeholder="29/07 a 01/08">
        </div>
      </div>
      <div class="campo">
        <label for="c">Chamada</label>
        <input id="c" type="text" name="chamada" value="<?= h($agenda['chamada'] ?? '') ?>" maxlength="200">
      </div>
      <div class="campo">
        <label>Disponível em</label>
        <div class="canais">
          <?php foreach (CANAIS_PADRAO as $canal): ?>
            <label class="check">
              <input type="checkbox" name="canal[]" value="<?= h($canal['icone']) ?>"
                <?= in_array($canal['icone'], $canaisAtivos, true) ? 'checked' : '' ?>>
              <?= h($canal['nome']) ?>
            </label>
          <?php endforeach; ?>
        </div>
      </div>
    </fieldset>

    <fieldset>
<legend>O que está no ar (<?= count($itens) ?>)</legend>
      <p class="dica" style="margin:0 0 14px">
        Esta lista não se edita aqui. <strong>Cada linha é um encontro</strong> —
        marcado em <a href="/painel/eventos.php">Encontros</a>, com a chave “aparecer
        na programação” ligada. Era o contrário antes: a live se cadastrava aqui e o
        encontro lá, os dois com data própria, e a mesma coisa existia duas vezes com
        duas datas que divergiam.
      </p>

      <?php if ($orfas > 0): ?>
        <form method="post" class="msg msg-erro" style="margin:0 0 16px">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="importar">
          <p style="margin:0 0 10px">
            <strong><?= $orfas ?> item(ns) da agenda antiga</strong> ainda não têm encontro.
            Eles foram digitados nesta tela quando a programação vivia aqui. Importe-os
            para continuarem aparecendo no site — depois confira a família de cada um.
          </p>
          <button class="btn" type="submit">Importar a agenda antiga</button>
        </form>
      <?php endif; ?>

      <?php if ($itens === []): ?>
        <p class="dica" style="margin:0">
          Nada na programação ainda. <a href="/painel/eventos.php">Marque um encontro</a> —
          ele entra aqui sozinho, porque o padrão é aparecer.
        </p>
      <?php else: ?>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead><tr><th>Quando</th><th>O quê</th><th>Onde</th><th></th></tr></thead>
            <tbody>
              <?php foreach ($itens as $it): ?>
                <tr>
                  <td data-rotulo="Quando">
                    <?php if (($it['inicio'] ?? '') !== ''): ?>
                      <strong><?= h($it['dia']) ?></strong><br>
                      <span class="dica"><?= h($it['data']) ?> · <?= h($it['hora']) ?></span>
                    <?php else: ?>
                      <span class="selo selo-cinza">sem horário</span>
                    <?php endif; ?>
                  </td>
                  <td>
                    <strong><?= h($it['titulo']) ?></strong>
                    <?php if (($it['subtitulo'] ?? '') !== ''): ?>
                      <br><span class="dica"><?= h($it['subtitulo']) ?></span>
                    <?php endif; ?>
                    <?php if (!empty($it['aoVivo'])): ?>
                      <span class="selo">ao vivo</span>
                    <?php endif; ?>
                  </td>
                  <?php /* Os dois `if` colados nas bordas do <td>: encontro presencial
                           sem confirmação não tem nada a dizer nesta coluna, e é um
                           <td> vazio de verdade que o `.cartoes td:empty` some
                           no celular em vez de virar um buraco no cartão. */ ?>
                  <td><?php if (($it['plataforma'] ?? '') !== ''): ?>
                    <span class="selo"><?= h(PLATAFORMAS[$it['plataforma']] ?? $it['plataforma']) ?></span>
                  <?php endif; ?><?php if (!empty($it['confirmar'])): ?>
                    <span class="selo selo-ok">aceita confirmação</span>
                  <?php endif; ?></td>
                  <td class="rodape">
                    <div class="acoes-celula">
                      <a class="btn btn-mini" href="/painel/eventos.php?e=<?= h($it['id']) ?>">Abrir</a>
                    </div>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </fieldset>

    <div class="barra acoes">
      <button class="btn btn-ouro" type="submit">Publicar</button>
      <a class="btn" href="/programacao" target="_blank" rel="noopener">Ver a página</a>
      <?php if (pode('estudio')): ?>
        <a class="btn" href="/painel/estudio.php">Estúdio de artes</a>
      <?php endif; ?>
    </div>
  </form>

  <datalist id="dias">
    <?php foreach (DIAS as $d): ?><option value="<?= h($d) ?>"></option><?php endforeach; ?>
  </datalist>
</div>

<?php /* As três constantes que só o servidor conhece, carimbadas antes do
         script — o mesmo truque do `window.__PAINEL__` do Estúdio. As flags
         `JSON_HEX_*` não são decoração: um `</script>` dentro de um rótulo
         escaparia do bloco. */ ?>
<script>
  window.__AGENDA__ = <?= json_encode(
      ['maxUpload' => MAX_UPLOAD, 'plataformas' => PLATAFORMAS, 'temas' => TEMAS],
      JSON_UNESCAPED_UNICODE | JSON_HEX_QUOT | JSON_HEX_APOS | JSON_HEX_TAG | JSON_HEX_AMP
  ) ?>;
</script>
<script src="/painel/agenda-previa.js?v=<?= VERSAO_ESTILO ?>"></script>
<?php
    fechar_pagina();
}
