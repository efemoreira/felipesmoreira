<?php
declare(strict_types=1);

/**
 * A FILA DA CHECAGEM e a porta de entrada do Olheiro.
 *
 * As duas moram juntas porque são as duas pontas do mesmo movimento: alguém
 * traz, alguém confere. A fila vem primeiro na tela e neste arquivo — a meta do
 * manual é que **nada durma sem status**, e o que está esperando decisão pesa
 * mais que o próximo fato a entrar.
 *
 * A fila é ordenada do MAIS ANTIGO para o mais novo, ao contrário de todas as
 * outras listas do painel: aqui o topo é o que está estourando o prazo de 2h,
 * não a novidade.
 */

require_once __DIR__ . '/fatos-comum.php';
require_once __DIR__ . '/fatos-form.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/sessao.php';

/**
 * A fila de quem espera decisão.
 *
 * `$quando` vem de fora porque a mesma formatação aparece nos dois blocos da
 * tela — duas cópias dariam "20/08 às 14:03" num e "20/08 14:03" no outro.
 */
function bloco_fila(array $fila, array $eu, string $buscaFa, callable $quando): void
{
    ?>
  <!-- ============ a fila ============ -->
  <fieldset id="fila">
    <legend>Esperando checagem (<?= count($fila) ?>)</legend>

    <?php if ($fila === []): ?>
      <?php nada_encontrado($buscaFa, '/painel/fatos.php', 'Fila zerada. É esse o objetivo: nada dorme sem status.'); ?>
    <?php endif; ?>

    <?php foreach ($fila as $f): ?>
      <?php $horas = horas_esperando($f); ?>
      <article class="ficha" id="<?= h($f['id']) ?>">
        <header class="ficha-topo">
          <span class="ficha-quem">
            <strong><?= h($f['oQue']) ?></strong>
            <span>
              <?= h(CATEGORIAS[$f['categoria']]) ?> ·
              por <?= h($f['autorNome']) ?> ·
              chegou <?= h($quando($f['criadoEm'])) ?>
            </span>
          </span>
          <?php /* Três degraus, e não dois. O prazo da checagem é 2h; com só
                   "vermelho depois de 2h" o fato de 1h50 aparecia igualzinho ao
                   que acabou de chegar, e quem varre a fila não tinha como
                   saber qual pegar primeiro. */ ?>
          <?php if ($horas >= 2): ?>
            <span class="selo selo-off"><?= $horas ?>h esperando</span>
          <?php elseif ($horas >= 1): ?>
            <span class="selo selo-atencao"><?= $horas ?>h esperando</span>
          <?php endif; ?>
        </header>

        <dl class="ficha-dados">
          <div><dt>Quem</dt><dd><?= h($f['quem']) ?></dd></div>
          <?php if ($f['quando'] !== ''): ?>
            <div><dt>Quando</dt><dd><?= h($f['quando']) ?></dd></div>
          <?php endif; ?>
          <?php if ($f['quanto'] !== ''): ?>
            <div><dt>Quanto</dt><dd><?= h($f['quanto']) ?></dd></div>
          <?php endif; ?>
          <?php if ($f['afetados'] !== ''): ?>
            <div><dt>Afetados</dt><dd><?= h($f['afetados']) ?></dd></div>
          <?php endif; ?>
          <div class="ficha-funcoes">
            <dt>Fonte<?= $f['fonteData'] !== '' ? ' · ' . h($f['fonteData']) : '' ?></dt>
            <dd><a href="<?= h($f['fonteUrl']) ?>" target="_blank" rel="noopener noreferrer"><?= h($f['fonteUrl']) ?></a></dd>
          </div>
          <?php if ($f['segundaFonte'] !== ''): ?>
            <div class="ficha-funcoes">
              <dt>Segunda fonte</dt>
              <dd><a href="<?= h($f['segundaFonte']) ?>" target="_blank" rel="noopener noreferrer"><?= h($f['segundaFonte']) ?></a></dd>
            </div>
          <?php endif; ?>
        </dl>

        <?php if ($f['desdobramento']): ?>
          <p class="dica">Fora da janela de 48h, marcado como desdobramento novo de algo mais antigo.</p>
        <?php endif; ?>

        <?php
          /* Quem trouxe o fato não checa o fato. Para o autor comum a decisão
             nem aparece — mostrar um formulário que vai ser recusado no POST é
             pedir para a pessoa digitar à toa. Admin vê, com a justificativa
             obrigatória junto. */
          $meu = $f['autorId'] !== '' && $f['autorId'] === $eu['id'];
        ?>

        <?php /* Corrigir e apagar são de quem trouxe o fato, e só enquanto ele
                 espera decisão: quem escreveu é quem sabe o que quis dizer, e
                 depois da Checagem a ficha vira registro do que ela viu. Pelo
                 mesmo motivo do bloco acima, quem não pode nem vê os botões. */ ?>
        <?php if (posso_mexer($f, $eu)): ?>
          <div class="acoes" style="margin:0 0 12px">
            <?php botao_modal('corrigir-fato', 'Corrigir a ficha', 'editar=' . urlencode($f['id']) . '#fila', 'btn btn-mini'); ?>
            <form method="post" style="display:inline"
                  onsubmit="return confirm('Apagar esta ficha da fila? Ela não foi decidida, então nada aponta para ela — mas não tem desfazer.')">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">
              <button type="submit" class="btn btn-mini btn-risco" name="acao" value="apagar">Apagar</button>
            </form>
          </div>
        <?php endif; ?>
        <?php if ($meu && !e_admin()): ?>
          <p class="dica">
            <strong>Você trouxe este fato.</strong> Quem checa é outra pessoa — ele fica
            na fila até alguém do time abrir. Checagem que o autor faz é carimbo,
            não checagem.
          </p>
        <?php else: ?>
        <details class="decidir">
          <summary class="btn btn-ouro">Checar este fato</summary>
          <div class="decidir-corpo">
            <p class="dica">
              Abra o link acima. A página existe? A data confere? O número confere?
              Se a afirmação for forte, procure uma segunda fonte independente.
              <?php if (pode('aulas')): ?>
                <a href="/aulas#checagem" target="_blank">Rever a aula da Checagem</a>.
              <?php endif; ?>
            </p>

            <?php if ($meu): ?>
              <p class="msg msg-erro" style="margin:0 0 14px">
                Este fato é seu. Como administrador você consegue checar assim mesmo, mas
                escreva por que não deu para outra pessoa — fica anotado na ficha.
              </p>
            <?php endif; ?>

            <form method="post">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">

              <fieldset class="saidas">
                <legend>O que este fato vira?</legend>
                <p class="dica" style="margin:0 0 10px">
                  Marque o que faz sentido — pode ser mais de um, e pode ser nenhum.
                  Fato aprovado sem peça fica esperando decisão, e aparece no hub
                  depois de 48h.
                </p>
                <?php foreach (ETAPAS as $chave => $nome): ?>
                  <label class="check">
                    <input type="checkbox" name="saida[]" value="<?= h($chave) ?>"
                           <?= $chave === 'roteiro' ? 'checked' : '' ?>>
                    <?= h($nome) ?>
                  </label>
                <?php endforeach; ?>
              </fieldset>

              <?php if ($meu): ?>
                <div class="campo">
                  <label for="destrava-<?= h($f['id']) ?>">Por que você mesmo está checando?</label>
                  <input id="destrava-<?= h($f['id']) ?>" type="text" name="destrava" maxlength="300" required
                         placeholder="Ex: fato urgente, ninguém da Checagem disponível hoje">
                </div>
              <?php endif; ?>

              <div class="acoes">
                <button type="submit" class="btn btn-ouro" name="acao" value="aprovar">
                  Confere — aprovar
                </button>
              </div>
            </form>

            <form method="post" class="decidir-recusa">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="id" value="<?= h($f['id']) ?>">
              <?php if ($meu): ?>
                <input type="hidden" name="destrava" value="Arquivado/recusado pelo próprio autor.">
              <?php endif; ?>
              <div class="campo">
                <label for="motivo-<?= h($f['id']) ?>">Não deu para confirmar, ou não vira peça. Por quê?</label>
                <input id="motivo-<?= h($f['id']) ?>" type="text" name="motivo" maxlength="300"
                       placeholder="Ex: o link não abre / o número não bate com a fonte">
              </div>
              <div class="acoes">
                <button type="submit" class="btn btn-risco" name="acao" value="pendente">
                  Deixar pendente
                </button>
                <button type="submit" class="btn" name="acao" value="arquivar">
                  Arquivar sem virar peça
                </button>
              </div>
              <p class="dica">
                <strong>Pendente</strong> é o que falta prova: fica guardado com o motivo e
                pode voltar quando sair o documento.
                <strong>Arquivar</strong> é o fato que confere mas não rende peça — encerra
                o assunto e deixa o rastro de que foi decidido, não esquecido.
              </p>
            </form>
          </div>
        </details>
        <?php endif; ?>
      </article>
    <?php endforeach; ?>
  </fieldset>
  <?php
}

/**
 * "Trazer um fato" — o formulário do Olheiro, sempre visível.
 *
 * Não é modal: trazer fato é a ação mais frequente da tela, e ação frequente
 * não se esconde atrás de um clique.
 */
function bloco_trazer(array $rascunho): void
{
    ?>
  <fieldset id="trazer">
    <legend>Trazer um fato</legend>
    <p class="dica">
      Sem opinião — só o fato, com quem é o responsável e o link que prova.
      Duas varreduras por dia: de manhã e no fim da tarde.
    </p>

    <?php formulario_fato(null, $rascunho); ?>
  </fieldset>
  <?php
}
