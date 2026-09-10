<?php
declare(strict_types=1);

/** A tela do caixa: os dois saldos, o formulário e o extrato. */

require_once __DIR__ . '/caixa-comum.php';
require_once __DIR__ . '/layout.php';

function tela_de_caixa(?string $erro, ?string $ok): void
{
    $tudo = ler_caixa();

    /* O FILTRO PADRÃO É O CAIXA DO MOVIMENTO, e não "todos". Uma tela que abre
       somando os dois convida exatamente o erro que este arquivo existe para
       impedir — e o número somado não significa nada, porque as duas contas
       respondem a réguas diferentes. */
    $contaF = (string) ($_GET['conta'] ?? 'movimento');
    if (!isset(CONTAS_CAIXA[$contaF])) {
        $contaF = 'movimento';
    }
    $lista = array_values(array_filter($tudo, fn ($l) => $l['conta'] === $contaF));
    $soma = somar_caixa($lista);

    $proximos = [];
    foreach (array_merge(eventos_a_vir(), eventos_passados()) as $e) {
        $proximos[$e['id']] = $e['titulo'] . ' · ' . data_cheia($e);
    }

    abrir_pagina('Caixa');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Caixa',
      'Todo real que entra e sai, com origem e data. <strong>Os dois caixas nunca somam juntos</strong>.',
      null,
      '/painel/caixa',
      [
          'Caixa do movimento e recurso de campanha são contas separadas — a tela nunca as mistura.',
          'Onde a linha entre as duas passa é decisão do advogado da campanha, e não desta tela.',
          'Lançamento amarrado a um encontro faz a conta daquele encontro fechar.',
          'Corrigir é apagar e lançar de novo: caixa que guarda o errado ao lado do certo soma duas vezes.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php /* A TRAVA ESCRITA NA TELA, e não só no comentário do código: quem lança
           é quem precisa ler, e ela decide o que marcar no campo `conta`. */ ?>
  <div class="msg msg-erro">
    <strong>Antes de lançar</strong>
    <ul class="lista-travas">
      <li>Com candidatura registrada, dinheiro que custeia atividade de campanha é <strong>recurso de campanha</strong> — conta própria, recibo eleitoral e prestação de contas.</li>
      <li>Venda de camiseta ou de comida cuja receita banca material, encontro ou deslocamento da campanha cai nessa régua, qualquer que seja o nome do caixa.</li>
      <li>Na dúvida, marque <strong>Recurso de campanha</strong> e pergunte. Sobra registrada se corrige; falta registrada, não.</li>
    </ul>
  </div>

  <?php barra_abas(
      array_map(
          fn ($nome) => ['nome' => $nome, 'conta' => 0],
          CONTAS_CAIXA
      ),
      $contaF,
      'conta',
      'Qual caixa'
  ); ?>

  <fieldset id="saldo">
    <legend><?= h(CONTAS_CAIXA[$contaF]) ?></legend>
    <dl class="resumo-numeros">
      <div><dt>Entrou</dt><dd><?= h(reais($soma['entrou'])) ?></dd></div>
      <div><dt>Saiu</dt><dd><?= h(reais($soma['saiu'])) ?></dd></div>
      <div<?= $soma['saldo'] < 0 ? ' class="resumo-alerta"' : '' ?>>
        <dt>Saldo</dt><dd><?= h(reais($soma['saldo'])) ?></dd>
      </div>
    </dl>
  </fieldset>

  <fieldset id="lancar">
    <legend>Lançar</legend>
    <form method="post" data-rascunho="caixa">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="lancar">
      <input type="hidden" name="conta" value="<?= h($contaF) ?>">

      <div class="linha g3">
        <div class="campo">
          <label for="c-valor">Valor</label>
          <?php /* `text`, e não `number`: o teclado do celular oferece vírgula
                   ou ponto conforme o aparelho, e `number` recusa metade dos
                   dois. `centavos_de()` lê as duas convenções. */ ?>
          <input id="c-valor" name="valor" type="text" inputmode="decimal"
                 placeholder="12,50" maxlength="20" required>
        </div>
        <div class="campo">
          <label for="c-data">Quando</label>
          <input id="c-data" name="data" type="date" value="<?= h(date('Y-m-d')) ?>">
          <p class="dica">A data do fato, não a de hoje.</p>
        </div>
        <div class="campo">
          <label for="c-origem">Origem</label>
          <select id="c-origem" name="origem">
            <?php foreach (ORIGENS_CAIXA as $chave => $rotulo): ?>
              <option value="<?= h($chave) ?>"><?= h($rotulo) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="campo">
        <label for="c-desc">Do que se trata</label>
        <input id="c-desc" name="descricao" type="text" maxlength="120" required
               placeholder="30 camisetas vendidas no bandeiraço">
      </div>

      <?php if ($proximos !== []): ?>
        <div class="campo">
          <label for="c-evento">De qual encontro (opcional)</label>
          <select id="c-evento" name="eventoId">
            <option value="">— nenhum —</option>
            <?php foreach ($proximos as $id => $rotulo): ?>
              <option value="<?= h($id) ?>"><?= h($rotulo) ?></option>
            <?php endforeach; ?>
          </select>
          <p class="dica">Amarrado ao encontro, ele soma no que aquele encontro custou e rendeu.</p>
        </div>
      <?php endif; ?>

      <?php /* DOIS BOTÕES, e o valor sempre positivo: pedir que alguém digite
               "-40" é pedir um erro que só aparece na soma do mês. */ ?>
      <div class="acoes">
        <button class="btn btn-ouro" type="submit" name="sentido" value="entrou">Entrou</button>
        <button class="btn" type="submit" name="sentido" value="saiu">Saiu</button>
      </div>
    </form>
  </fieldset>

  <fieldset id="extrato">
    <legend>Extrato (<?= count($lista) ?>)</legend>
    <?php if ($lista === []): ?>
      <p class="dica" style="margin:0">Nada lançado neste caixa ainda.</p>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Quando</th><th>O quê</th><th>Origem</th><th>Valor</th><th>Encontro</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($lista as $l): ?>
              <tr>
                <td class="terco" data-rotulo="Quando"><?= h($l['data']) ?></td>
                <td data-rotulo="O quê"><strong><?= h($l['descricao']) ?></strong></td>
                <td class="terco" data-rotulo="Origem"><?= h(ORIGENS_CAIXA[$l['origem']]) ?></td>
                <td class="terco" data-rotulo="Valor">
                  <span class="selo <?= $l['centavos'] < 0 ? 'selo-off' : 'selo-ok' ?>">
                    <?= h(reais($l['centavos'])) ?>
                  </span>
                </td>
                <td class="tarde" data-rotulo="Encontro">
                  <?= $l['eventoId'] !== '' ? h($proximos[$l['eventoId']] ?? '—') : '—' ?>
                </td>
                <td class="rodape" data-rotulo="">
                  <div class="acoes-celula">
                    <form method="post"
                          onsubmit="return confirm(<?= texto_js('Apagar “' . $l['descricao'] . '”? Corrigir é apagar e lançar de novo.') ?>)">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="acao" value="apagar">
                      <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                      <button class="btn btn-mini btn-risco" type="submit">Apagar</button>
                    </form>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <div class="acoes">
    <a class="btn btn-mini" href="/painel/">Voltar ao início</a>
  </div>
</div>
    <?php
    fechar_pagina();
}
