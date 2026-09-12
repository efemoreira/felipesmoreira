<?php
declare(strict_types=1);

/**
 * A aba Mutirão da Munição — a semana, e as semanas anteriores.
 *
 * É o trabalho da segunda-feira: escolher a peça, escalar todo mundo que tem
 * conta, cobrar quem não postou. A lista de peças é o acervo, e mora na outra
 * aba: quem abre a Munição na segunda vem escalar a semana, não revisar o que
 * já existe — e os dois ritmos disputavam a mesma rolagem.
 *
 * A corrente da comunicação (Olheiro → … → Acervo) só produz com os seis elos
 * vivos no mesmo dia, e só se monta se seis pessoas escolherem seis funções. O
 * mutirão é o contrário: cada um age sozinho, com a peça já pronta. É o que
 * gente nova consegue fazer na semana em que entra.
 *
 * O HISTÓRICO vem de graça: `mutirao.php` já guarda uma linha por semana. É a
 * primeira leitura de quem está ativo de verdade na comunicação — "quantos
 * postaram, semana a semana" — e por isso fica aqui, embaixo da semana atual,
 * e não numa tela à parte.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/kit-comum.php';
require_once __DIR__ . '/pessoas-comum.php';  // achar_pessoa() — o mutirão é gente

function aba_de_mutirao(): void
{
    $mutirao  = mutirao_da_semana();
    $noArKit  = array_values(array_filter(ler_pecas(), fn ($p) => $p['publicada']));
    $postaram = count(array_filter($mutirao['escalados'], fn ($e) => $e === 'postou'));

    /* As semanas anteriores, com a peça pelo id — a peça pode ter sido apagada
       depois, e aí sobra o id, que ainda diz alguma coisa. */
    $pecasPorId = [];
    foreach (ler_pecas() as $p) {
        $pecasPorId[$p['id']] = $p;
    }
    $anteriores = [];
    foreach (ler_mutirao() as $semana => $linha) {
        if ($semana === $mutirao['semana']) {
            continue;
        }
        $anteriores[] = [
            'semana'    => $semana,
            'peca'      => $pecasPorId[$linha['peca']]['numero'] ?? ($linha['peca'] !== '' ? $linha['peca'] : '—'),
            'postaram'  => count(array_filter($linha['escalados'], fn ($e) => $e === 'postou')),
            'escalados' => count($linha['escalados']),
        ];
    }
    ?>
  <fieldset id="mutirao">
    <legend>
      O mutirão desta semana
      <?php if ($mutirao['peca'] !== null): ?>
        — <?= $postaram ?> de <?= count($mutirao['escalados']) ?> postaram
      <?php endif; ?>
    </legend>

    <?php if ($noArKit === []): ?>
      <p class="dica" style="margin:0">
        Nenhuma peça no ar ainda. <strong>Crie e publique a peça da semana na aba Peças</strong> —
        é ela que o mutirão vai espalhar.
      </p>
    <?php else: ?>
      <form method="post" class="linha g2">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="acao" value="mutirao-peca">
        <div class="campo">
          <label for="m-peca">A peça desta semana</label>
          <select id="m-peca" name="peca">
            <option value="">— nenhuma —</option>
            <?php foreach ($noArKit as $pc): ?>
              <option value="<?= h($pc['id']) ?>" <?= $mutirao['peca'] !== null && $mutirao['peca']['id'] === $pc['id'] ? 'selected' : '' ?>>
                <?= h($pc['numero']) ?> — <?= h(mb_substr($pc['frase'], 0, 48)) ?>
              </option>
            <?php endforeach; ?>
          </select>
          <p class="dica">Escalar põe a peça no Início de todo mundo que tem conta.</p>
        </div>
        <div class="campo" style="justify-content:flex-end">
          <button class="btn btn-ouro" type="submit">Escalar a semana</button>
        </div>
      </form>

      <?php if ($mutirao['peca'] !== null): ?>
        <?php /* A MENSAGEM DO GRUPO, sem atribuição: é o aviso de que a semana
                 começou. A versão COM `?de=` é individual e sai no Início de
                 cada pessoa — atribuição de grupo não atribui nada. */ ?>
        <div class="acoes" style="margin:16px 0 0">
          <button class="btn" type="button" data-copiar="<?= h(mensagem_do_mutirao($mutirao['peca'])) ?>">
            Copiar o aviso para o grupo
          </button>
        </div>

        <?php $faltam = array_keys(array_filter($mutirao['escalados'], fn ($e) => $e !== 'postou')); ?>
        <?php if ($faltam !== []): ?>
          <details class="decidir" style="margin-top:16px">
            <summary class="btn">Quem ainda não postou (<?= count($faltam) ?>)</summary>
            <div class="decidir-corpo">
              <p class="dica" style="margin:0 0 12px">
                O link de cada uma leva o <code>?de=</code> dela — é o que diz qual militante
                traz gente. Sem isso, "compartilhe" não vira conta nenhuma.
              </p>
              <?php foreach ($faltam as $id): ?>
                <?php $pessoa = achar_pessoa($id); ?>
                <?php if ($pessoa === null) { continue; } ?>
                <div class="escalado">
                  <span class="escalado-quem"><strong><?= h($pessoa['nome']) ?></strong></span>
                  <div class="acoes-celula">
                    <?php if ($pessoa['telefone'] !== ''): ?>
                      <?php links_whatsapp($pessoa['telefone'], 'Mandar a peça', mensagem_do_mutirao($mutirao['peca'], $pessoa), 'btn btn-mini'); ?>
                    <?php endif; ?>
                    <form method="post">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="acao" value="mutirao-postou">
                      <input type="hidden" name="quem" value="<?= h($id) ?>">
                      <button class="btn btn-mini" type="submit">Postou</button>
                    </form>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          </details>
        <?php endif; ?>
      <?php endif; ?>
    <?php endif; ?>
  </fieldset>

  <?php if ($anteriores !== []): ?>
    <fieldset id="semanas">
      <legend>Semanas anteriores (<?= count($anteriores) ?>)</legend>
      <p class="dica" style="margin:0 0 12px">
        Quantos postaram, semana a semana. É a conta mais honesta de quem está ativo
        na comunicação — e de quando a peça não pegou.
      </p>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Semana</th><th>Peça</th><th>Postaram</th></tr></thead>
          <tbody>
            <?php foreach ($anteriores as $s): ?>
              <tr>
                <td data-rotulo="Semana"><strong><?= h(date('d/m', strtotime($s['semana']) ?: 0)) ?></strong></td>
                <td data-rotulo="Peça"><?= h($s['peca']) ?></td>
                <td class="meia" data-rotulo="Postaram">
                  <span class="selo <?= $s['escalados'] > 0 && $s['postaram'] * 2 >= $s['escalados'] ? 'selo-ok' : 'selo-cinza' ?>">
                    <?= $s['postaram'] ?> de <?= $s['escalados'] ?>
                  </span>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </fieldset>
  <?php endif; ?>
    <?php
}
