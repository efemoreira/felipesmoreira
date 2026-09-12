<?php
declare(strict_types=1);

/**
 * A semana — a aba Semana de `/painel/leituras`.
 *
 * O retrato da operação do time inteiro: os medidores que moravam no Início
 * como "A operação hoje" (uma grade de seis cartões entre a fila e o próximo
 * encontro), o mutirão desta semana e — só para quem administra — o saldo dos
 * dois caixas, cada um por si, nunca somados.
 *
 * No Início ficou uma linha, só com o que venceu. Aqui fica o quadro inteiro,
 * inclusive o verde: a leitura da semana é também saber o que está bem.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/agora.php';      // panorama_de()
require_once __DIR__ . '/kit-comum.php';  // mutirao_da_semana()
require_once __DIR__ . '/sinais-comum.php'; // sinais_entre()
require_once __DIR__ . '/metas-comum.php';  // ler_metas(), leitura_da_meta()

function aba_da_semana(array $eu): void
{
    $panorama = panorama_de($eu);
    $mutirao  = mutirao_da_semana();
    $postaram = count(array_filter($mutirao['escalados'], fn ($e) => $e === 'postou'));
    ?>
    <?php /* AS METAS PRIMEIRO: é a única pergunta desta aba que tem alvo, e
             "estamos bem?" se responde antes de "o que venceu?". */ ?>
    <fieldset id="metas">
      <legend>As metas<?= ($metas = ler_metas()) !== [] ? ' (' . count($metas) . ')' : '' ?></legend>
      <?php if ($metas === []): ?>
        <p class="dica folga">
          Nenhuma meta combinada. Sem alvo, 120 militantes não é bom nem ruim — é 120.
        </p>
      <?php else: ?>
        <div class="metas">
          <?php foreach ($metas as $m): $l = leitura_da_meta($m); ?>
            <div class="meta meta-<?= h($l['ritmo']) ?>">
              <p class="meta-numero"><strong><?= $l['atual'] ?></strong> de <?= $m['alvo'] ?></p>
              <p class="meta-rotulo"><?= h(MEDIDAS_DE_META[$m['medida']]) ?> até <?= h(data_humana($m['ate'])) ?></p>
              <p class="meta-nota">
                <?php if ($l['ritmo'] === 'feito'): ?>Batida.
                <?php elseif ($l['ritmo'] === 'vencida'): ?>Venceu faltando <?= $l['faltam'] ?>.
                <?php else: ?>Faltam <?= $l['faltam'] ?> em <?= $l['dias'] ?> dia<?= $l['dias'] === 1 ? '' : 's' ?> — ritmo <?= $l['ritmo'] === 'bom' ? 'bom' : 'atrasado' ?>.
                <?php endif; ?>
              </p>
              <form method="post" class="meta-apagar" data-confirmar="Apagar esta meta?">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="acao" value="meta-apagar">
                <input type="hidden" name="id" value="<?= h($m['id']) ?>">
                <button class="btn btn-mini" type="submit">Apagar</button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
      <details class="decidir">
        <summary class="btn btn-mini">Combinar uma meta</summary>
        <div class="decidir-corpo">
          <form method="post" class="linha g3">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="meta-salvar">
            <div class="campo">
              <label for="meta-medida">O quê</label>
              <select id="meta-medida" name="medida">
                <?php foreach (MEDIDAS_DE_META as $chave => $nome): ?>
                  <option value="<?= h($chave) ?>"><?= h($nome) ?> (hoje <?= valor_da_medida($chave) ?>)</option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="campo">
              <label for="meta-alvo">Chegar a</label>
              <input id="meta-alvo" type="number" name="alvo" min="1" inputmode="numeric" required>
            </div>
            <div class="campo">
              <label for="meta-ate">Até</label>
              <input id="meta-ate" type="date" name="ate" required>
            </div>
            <div class="acoes"><button class="btn btn-ouro" type="submit">Combinar</button></div>
          </form>
        </div>
      </details>
    </fieldset>

    <fieldset>
      <legend>A operação hoje</legend>
      <?php if ($panorama === []): ?>
        <p class="dica colado">Nenhum medidor para as áreas que você abre.</p>
      <?php else: ?>
        <p class="dica folga">
          Do time inteiro, não seu. Verde é em dia, âmbar é perto do prazo, vermelho já
          venceu. Cada cartão leva à tela que responde por aquilo.
        </p>
        <div class="painel-op">
          <?php foreach ($panorama as $m): ?>
            <a class="medidor medidor-<?= h($m['estado']) ?>" href="<?= h($m['url']) ?>">
              <strong class="medidor-num"><?= h($m['num']) ?></strong>
              <span class="medidor-rotulo"><?= h($m['rotulo']) ?></span>
              <?php if ($m['nota'] !== ''): ?>
                <span class="medidor-nota"><?= h($m['nota']) ?></span>
              <?php endif; ?>
            </a>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </fieldset>

    <fieldset>
      <legend>O mutirão desta semana</legend>
      <?php if ($mutirao['peca'] === null): ?>
        <p class="dica colado">
          Semana sem peça escalada.
          <?php if (pode('municao')): ?>
            <a href="/painel/municao.php?aba=mutirao">Escalar na Munição</a>.
          <?php endif; ?>
        </p>
      <?php else: ?>
        <dl class="resumo-numeros">
          <div><dt>Escaladas</dt><dd><?= count($mutirao['escalados']) ?></dd></div>
          <div><dt>Postaram</dt><dd><?= $postaram ?></dd></div>
          <div><dt>Faltam</dt><dd><?= count($mutirao['escalados']) - $postaram ?></dd></div>
        </dl>
        <p class="dica colado">
          <strong><?= h($mutirao['peca']['numero']) ?></strong> — <?= h($mutirao['peca']['frase']) ?>
          <?php if (pode('municao')): ?>
            · <a href="/painel/municao.php?aba=mutirao">cobrar quem falta</a>
          <?php endif; ?>
        </p>
      <?php endif; ?>
    </fieldset>

    <?php /* O SITE: quantos abriram, quantos compartilharam, quantos se
             inscreveram — por rota, esta semana e a anterior. É a medição
             mínima (`sinais-comum.php`): contagem por dia, sem quem. Antes
             disto, toda decisão sobre o site era impressão. */ ?>
    <?php
    $semana = semana_de();
    $desta = sinais_entre(substr($semana['inicio'], 0, 10), dia_no_ceara());
    $anterior = sinais_entre(
        dia_no_ceara(strtotime($semana['inicio']) - 7 * 86400),
        dia_no_ceara(strtotime($semana['inicio']) - 86400),
    );
    $colunas = ['abriu', 'compartilhou', 'enviou-inscricao'];
    ?>
    <fieldset>
      <legend>O site</legend>
      <?php if ($desta === [] && $anterior === []): ?>
        <p class="dica colado">Ainda sem sinal do site. Ele conta a partir da próxima publicação.</p>
      <?php else: ?>
        <p class="dica folga">
          Por página: quem abriu, quem compartilhou, quem se inscreveu — esta semana,
          e entre parênteses a anterior. Só contagem; ninguém é identificado.
        </p>
        <div class="rolagem cartoes">
          <table>
            <thead>
              <tr>
                <th>Página</th>
                <?php foreach ($colunas as $c): ?><th><?= h(EVENTOS_SINAL[$c]) ?></th><?php endforeach; ?>
              </tr>
            </thead>
            <tbody>
              <?php foreach (ROTAS_SINAL as $rota => $nome): ?>
                <?php if (!isset($desta[$rota]) && !isset($anterior[$rota])) continue; ?>
                <tr>
                  <td data-rotulo="Página"><strong>/<?= h($rota) ?></strong> <span class="dica"><?= h($nome) ?></span></td>
                  <?php foreach ($colunas as $c): ?>
                    <td data-rotulo="<?= h(EVENTOS_SINAL[$c]) ?>">
                      <?= (int) ($desta[$rota][$c] ?? 0) ?>
                      <span class="dica">(<?= (int) ($anterior[$rota][$c] ?? 0) ?>)</span>
                    </td>
                  <?php endforeach; ?>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </fieldset>

    <?php /* O TAMANHO DO DADO, só para quem administra. A base é arquivo PHP
             relido inteiro a cada request; o dia em que isso pesar tem de
             aparecer aqui antes de aparecer na porta do encontro. É o número
             que decide quando um índice entra — não um reflexo. */ ?>
    <?php if (e_admin()): ?>
      <?php
        $t0 = hrtime(true);
        $quantas = count(ler_pessoas(true));
        $ms = (hrtime(true) - $t0) / 1e6;
        $bytes = is_file(ARQ_PESSOAS) ? (int) filesize(ARQ_PESSOAS) : 0;
        $lento = $ms > 50 || $bytes > 2_000_000;
      ?>
      <fieldset>
        <legend>O tamanho do dado</legend>
        <p class="<?= $lento ? 'msg msg-erro' : 'dica' ?>" style="margin:0">
          <strong>pessoas.php</strong>: <?= $quantas ?> fichas · <?= number_format($bytes / 1024, 0, ',', '.') ?> KB ·
          lido e normalizado em <?= number_format($ms, 1, ',', '.') ?> ms.
          <?php if ($lento): ?>
            Passou da régua (50 ms ou 2 MB): é hora do índice por telefone e por id.
          <?php else: ?>
            Cada request relê isto; a régua para pensar em índice é 50 ms ou 2 MB.
          <?php endif; ?>
        </p>
      </fieldset>
    <?php endif; ?>

    <?php /* O DINHEIRO SÓ PARA QUEM ADMINISTRA — a mesma régua de `caixa`: acesso
             a ele acompanha a responsabilidade, não o trabalho do dia. E os dois
             caixas lado a lado, cada um com o seu saldo, nunca uma soma. */ ?>
    <?php if (pode('caixa')): ?>
      <?php require_once __DIR__ . '/caixa-comum.php'; $lancamentos = ler_caixa(); ?>
      <fieldset>
        <legend>Os caixas</legend>
        <?php foreach (CONTAS_CAIXA as $conta => $nome): ?>
          <?php $soma = somar_caixa(array_values(array_filter($lancamentos, fn ($l) => $l['conta'] === $conta))); ?>
          <p style="margin:0 0 6px">
            <strong><?= h($nome) ?></strong>:
            entrou <?= h(reais($soma['entrou'])) ?> · saiu <?= h(reais($soma['saiu'])) ?> ·
            saldo <strong><?= h(reais($soma['saldo'])) ?></strong>
            <?php if ($soma['saldo'] < 0): ?><span class="selo selo-off">negativo</span><?php endif; ?>
          </p>
        <?php endforeach; ?>
        <p class="dica" style="margin:8px 0 0"><a href="/painel/caixa.php">Abrir o Caixa</a> — os lançamentos, um a um.</p>
      </fieldset>
    <?php endif; ?>
    <?php
}
