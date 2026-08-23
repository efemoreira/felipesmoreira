<?php
declare(strict_types=1);

/**
 * A ABA PESSOAS de um encontro: quem vem, quem veio, e o follow-up de quem foi.
 *
 * As duas coisas moram no mesmo arquivo porque moram na mesma aba, e é de
 * propósito que o funil não seja uma quarta aba: ele é sobre quem veio, não é
 * um assunto novo. Quem separa os dois na tela separa a pergunta ("quem
 * apareceu?") da consequência dela ("e o que a gente fez depois?").
 *
 * É o bloco mais longo do encontro porque é o que mais faz: o QR da mesa, o
 * link de "vou" que circula no grupo, a escala do time, a tabela de presença e
 * o cadastro de quem chegou sem celular.
 */

require_once __DIR__ . '/eventos-comum.php';  // o modelo do encontro e da presença
require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao()
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_abas(), abrir_modal() — a moldura
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo

/**
 * A lista de presença do encontro.
 *
 * A busca é recalculada AQUI, e não recebida pronta: `$naLista` (o total) e
 * `$pessoas` (o recorte) são duas coisas diferentes que a mesma tela usa, e
 * passá-las por parâmetro era pedir para o chamador não trocar uma pela outra.
 */
function desenhar_presenca(array $aberto, array $eu): void
{
    $pessoas = presencas_do_evento($aberto['id']);
    $naLista = count($pessoas);

    /* A busca dentro do encontro. Numa noite de encontro grande a lista passa
       de cem linhas, e a pergunta na mesa é sempre a mesma — "o Fulano já deu
       presença?". Rolar cem nomes com o celular na mão, em pé, não é resposta.

       O parâmetro é o mesmo `q` da lista de encontros porque as duas telas
       nunca estão abertas ao mesmo tempo: com `?e=` aberto, `q` é desta lista. */
    $buscaP = limpar_texto($_GET['q'] ?? '', 60);
    if ($buscaP !== '') {
        $digitosP = so_digitos($buscaP);
        $pessoas = array_values(array_filter($pessoas, function ($l) use ($buscaP, $digitosP) {
            $q = $l['pessoa'];
            if (combina_com([$q['nome'], $q['bairro'], $q['cidade']], $buscaP)) {
                return true;
            }
            /* Dígito casa com dígito: quem procura na porta tem o número na
               tela do próprio WhatsApp, e "(85) 9" não acharia "85 9" como
               texto. */
            return $digitosP !== '' && $q['telefone'] !== '' && str_contains($q['telefone'], $digitosP);
        }));
    }
    ?>
  <fieldset id="pessoas">
    <legend>
      Quem vem e quem veio (<?= count($pessoas) ?><?= $buscaP !== '' ? ' de ' . $naLista : '' ?>)
    </legend>

    <?php /* Só aparece quando há o que procurar: com oito nomes a caixa é um
             controle em cima de uma lista que cabe inteira na tela. */ ?>
    <?php if ($naLista > 8 || $buscaP !== ''): ?>
      <?php barra_busca($buscaP, 'nome, WhatsApp, bairro ou cidade', ['e' => $aberto['id'], 'aba' => 'pessoas']); ?>
    <?php endif; ?>

    <?php if ($aberto['token'] !== ''): ?>
      <?php $urlPresenca = url_presenca($aberto); ?>
      <div class="qr-bloco">
        <div class="qr-papel">
          <!-- o desenho entra aqui pelo /painel/vendor/qrcode.js -->
          <div class="qr-arte" data-qr="<?= h($urlPresenca) ?>"></div>
          <p class="qr-chamada">Aponte a câmera</p>
        </div>
        <div class="qr-texto">
          <p class="dica" style="margin:0 0 10px">
            <strong>QR da mesa da Recepção.</strong> Imprima e cole na entrada: quem
            chega se cadastra no próprio celular, e a lista já sai organizada — sem
            fila para alguém digitar depois.
          </p>
          <p class="provisoria card-arquivo"><?= h($urlPresenca) ?></p>
          <p class="dica">
            Quem não tiver celular à mão, a Recepção cadastra aqui embaixo. Ninguém
            entra sem passar pelo cadastro — quem entra sem se cadastrar é contato
            perdido.
          </p>
        </div>
      </div>
    <?php endif; ?>

    <?php /* ===== o link de confirmação, que circula ANTES do encontro ===== */ ?>
    <?php if ($aberto['tokenConfirmacao'] !== ''): ?>
      <?php $urlConfirma = url_confirmacao($aberto); ?>
      <details class="decidir" style="margin:0 0 22px">
        <summary class="btn">Link de confirmação, para mandar no grupo</summary>
        <div class="decidir-corpo">
          <p class="dica" style="margin:0 0 12px">
            <strong>É um link diferente do QR da mesa</strong>, de propósito. Este
            confirma presença ANTES; o do QR faz o <strong>check-in</strong> na porta.
            Com um link só, quem recebesse a mensagem no grupo se marcaria como
            presente sem sair de casa — e é a lista de presença que alimenta o
            follow-up.
          </p>
          <p class="dica" style="margin:0 0 12px">
            Quem já veio a algum encontro, já se inscreveu ou já tem conta digita
            <strong>só o WhatsApp</strong> e pronto — nome, bairro e cidade a gente já tem.
            Quem é novo preenche quatro campos.
          </p>
          <p class="provisoria card-arquivo"><?= h($urlConfirma) ?></p>

          <p class="dica" style="margin:14px 0 6px"><strong>Mensagem pronta para colar:</strong></p>
          <p class="provisoria" style="white-space:pre-wrap"><?php
            $quando = trim($aberto['data'] . ($aberto['hora'] !== '' ? ' às ' . $aberto['hora'] : ''));
            echo h(
                $aberto['titulo']
                . ($quando !== '' ? "\n" . $quando : '')
                . ($aberto['local'] !== '' ? "\n" . $aberto['local'] : '')
                . "\n\nConfirma sua presença aqui: " . $urlConfirma
            );
          ?></p>

          <?php if (!$aberto['naAgenda']): ?>
            <p class="dica">
              Este encontro <strong>não está na programação pública</strong>, então o link
              só chega a quem você mandar.
            </p>
          <?php else: ?>
            <p class="dica">
              O botão “Confirmar presença” também aparece sozinho no cartão deste encontro em
              <a href="/programacao" target="_blank">/programacao</a>.
            </p>
          <?php endif; ?>
        </div>
      </details>
    <?php endif; ?>

    <?php /* ===== escalar o time ===== */ ?>
    <?php $doTime = pessoas_fora_do_evento($aberto['id']); ?>
    <?php if ($doTime !== []): ?>
      <details class="decidir" style="margin:0 0 22px">
        <summary class="btn">Escalar o time (<?= count($doTime) ?> ainda fora da lista)</summary>
        <div class="decidir-corpo">
          <p class="dica" style="margin:0 0 12px">
            Quem tem conta no painel <strong>não lê o QR da mesa</strong> — está atrás
            dela, recebendo os outros. Sem escalar, a lista do encontro conta só quem
            entrou pela porta, e o relatório esquece justamente quem fez o encontro
            acontecer.
          </p>
          <form method="post">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
            <input type="hidden" name="acao" value="add-time">
            <?php if (count($doTime) > 8): ?>
              <?php filtro_de_marcacao('time-fora', 'nome ou função'); ?>
            <?php endif; ?>
            <div id="time-fora">
            <?php foreach ($doTime as $u): ?>
              <label class="check">
                <input type="checkbox" name="usuario[]" value="<?= h($u['id']) ?>">
                <?= h($u['nome']) ?>
                <?php if (!empty($u['funcoes'])): ?>
                  <span class="dica"><?= h(nome_funcao($u['funcoes'][0])) ?></span>
                <?php endif; ?>
              </label>
            <?php endforeach; ?>
            </div>
            <div class="acoes" style="margin-top:12px">
              <button type="submit" class="btn btn-ouro">Escalar quem marquei</button>
            </div>
          </form>
        </div>
      </details>
    <?php endif; ?>

    <?php /* Lista vazia por causa do recorte não é lista vazia: sem esta saída
             quem errou a grafia acha que a pessoa não deu presença. */ ?>
    <?php if ($pessoas === [] && $buscaP !== ''): ?>
      <?php nada_encontrado($buscaP, '/painel/eventos.php?e=' . urlencode($aberto['id']) . '&aba=pessoas'); ?>
    <?php endif; ?>

    <?php if ($pessoas !== []): ?>
      <?php
        /* Os quatro estados saem de `confirmou` × `compareceu`, sem campo novo.
           O que mais interessa é o terceiro: confirmou e faltou é a diferença
           entre o que a Divulgação prometeu e o que apareceu na porta, e é o
           número que diz se o convite está funcionando. */
        $contas = ['convidado' => 0, 'confirmou' => 0, 'veio' => 0, 'faltou' => 0];
        foreach ($pessoas as $l) {
            if ($l['compareceu']) {
                $contas['veio']++;
            } elseif ($l['confirmou']) {
                $contas['faltou']++;
            } else {
                $contas['convidado']++;
            }
            if ($l['confirmou']) {
                $contas['confirmou']++;
            }
        }
      ?>
      <p style="margin:0 0 14px">
        <span class="selo selo-ok"><?= $contas['veio'] ?> vieram</span>
        <span class="selo"><?= $contas['confirmou'] ?> confirmaram</span>
        <?php if ($contas['faltou'] > 0): ?>
          <span class="selo selo-off"><?= $contas['faltou'] ?> confirmaram e faltaram</span>
        <?php endif; ?>
        <?php if ($contas['convidado'] > 0): ?>
          <span class="selo selo-cinza"><?= $contas['convidado'] ?> só convidados</span>
        <?php endif; ?>
      </p>

      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Quem</th><th>Confirmou</th><th>Compareceu</th><th>O que é</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($pessoas as $l): ?>
              <?php $q = $l['pessoa']; ?>
              <tr>
                <td>
                  <?php if (pode('pessoas')): ?>
                    <a href="/painel/pessoas.php?p=<?= h($q['id']) ?>"><strong><?= h($q['nome']) ?></strong></a>
                  <?php else: ?>
                    <strong><?= h($q['nome']) ?></strong>
                  <?php endif; ?>
                  <br>
                  <span class="dica">
                    <?php $onde = trim($q['bairro'] . ($q['cidade'] !== '' ? ', ' . $q['cidade'] : ''), ', '); ?>
                    <?= $onde !== '' ? h($onde) . ' · ' : '' ?>
                    <?php if ($q['telefone'] === ''): ?>
                      sem telefone
                    <?php elseif (pode_ver_telefone($l, $eu)): ?>
                      <a href="https://wa.me/55<?= h($q['telefone']) ?>" target="_blank" rel="noopener">
                        <?= h(telefone_bonito($q['telefone'])) ?>
                      </a>
                    <?php else: ?>
                      <?= h(telefone_encoberto($q['telefone'])) ?>
                    <?php endif; ?>
                    <?= $l['origem'] === 'qr' ? ' · cadastro no celular' : '' ?>
                    <?= tem_conta($q) ? ' · <span class="selo selo-cinza">do time</span>' : '' ?>
                  </span>
                </td>
                <?php /* No celular os dois viram meio cartão cada um, lado a lado:
                         eles só se leem em par — "confirmou e não veio" é a
                         pergunta, e não "confirmou". */ ?>
                <?php foreach (['confirmou', 'compareceu'] as $campo): ?>
                  <td class="meia" data-rotulo="<?= h(ucfirst($campo)) ?>">
                    <form method="post">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                      <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
                      <button type="submit" class="btn btn-mini" name="acao" value="<?= h($campo) ?>">
                        <?= $l[$campo] ? 'sim' : '—' ?>
                      </button>
                    </form>
                  </td>
                <?php endforeach; ?>
                <td data-rotulo="O que é">
                  <form method="post">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                    <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
                    <input type="hidden" name="acao" value="classificar">
                    <?php /* Grava no cadastro DA PESSOA, e não nesta linha: ela é
                             militante em todo lugar, não só neste sábado. */ ?>
                    <select name="tipo" onchange="this.form.submit()">
                      <?php foreach (TIPOS_PESSOA as $chave => $nome): ?>
                        <option value="<?= h($chave) ?>" <?= $q['tipo'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
                      <?php endforeach; ?>
                    </select>
                    <noscript><button type="submit" class="btn btn-mini">ok</button></noscript>
                  </form>
                </td>
                <td class="rodape">
                  <?php /* Tira a LINHA, não a pessoa: o cadastro dela continua em
                           /painel/pessoas, com telefone e os outros encontros. O
                           que se desfaz é "esteve neste sábado" — o dedo errado
                           na lista, ou o mesmo número cadastrado duas vezes na
                           porta. */ ?>
                  <?php /* Atrás dos três pontinhos, e não solto na linha: na porta do
                           encontro o polegar está marcando presença a cada dez
                           segundos, e o botão que desfaz é vizinho dos que fazem. */ ?>
                  <div class="acoes-celula">
                    <?php menu_acoes([
                        [
                            'texto'     => 'Tirar deste encontro',
                            'acao'      => 'tirar-pessoa',
                            'campos'    => ['id' => $aberto['id'], 'lead' => $l['id']],
                            'confirmar' => 'Tirar ' . $q['nome'] . ' da lista deste encontro? O cadastro dela continua em Pessoas.',
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

    <details class="decidir">
      <summary class="btn btn-ouro">Cadastrar alguém</summary>
      <div class="decidir-corpo">
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
          <input type="hidden" name="acao" value="add-pessoa">
          <div class="campo">
            <label for="p-nome">Nome</label>
            <input id="p-nome" type="text" name="nome" maxlength="80" required>
          </div>
          <div class="linha g2">
            <div class="campo">
              <label for="p-tel">WhatsApp</label>
              <input id="p-tel" type="tel" name="telefone" maxlength="20" inputmode="numeric" placeholder="85 99999-9999">
            </div>
            <div class="campo">
              <label for="p-cidade">Cidade</label>
              <?php campo_cidade('p-cidade', 'cidade', ''); ?>
            </div>
          </div>
          <div class="campo">
            <label for="p-bairro">Bairro</label>
            <input id="p-bairro" type="text" name="bairro" maxlength="60">
          </div>
          <div class="campo">
            <label for="p-conv">Convidado por</label>
            <input id="p-conv" type="text" name="convidadoPor" maxlength="60">
          </div>
          <label class="check"><input type="checkbox" name="confirmou" value="1"> Já confirmou presença</label>
          <label class="check"><input type="checkbox" name="compareceu" value="1"> Já está aqui</label>
          <div class="acoes">
            <button type="submit" class="btn btn-ouro">Cadastrar</button>
          </div>
        </form>
      </div>
    </details>
  </fieldset>
    <?php
}

/**
 * O follow-up vencido — D+0 agradecer · D+3 conteúdo · D+7 convidar.
 *
 * Quem chama é que confere `pode('agenda')`: o funil é da coordenação, e quem
 * só executa não vê telefone nem responde por lead. A trava mora no chamador
 * porque é ele que já decidiu quais abas desenhar.
 */
function desenhar_funil(array $aberto, array $eu, array $vencidos): void
{
    ?>
    <fieldset id="funil">
      <legend>Follow-up vencido (<?= count($vencidos) ?>)</legend>
      <p class="dica">
        Lead sem segunda mensagem é lead perdido. D+0 agradecer · D+3 conteúdo · D+7 convite.
      </p>
      <?php if ($vencidos === []): ?>
        <p class="dica" style="margin:0">Nada vencido. Ou ninguém compareceu ainda.</p>
      <?php else: ?>
        <?php foreach ($vencidos as [$l, $etapa]): ?>
          <article class="ficha">
            <header class="ficha-topo">
              <span class="ficha-quem">
                <strong><?= h($l['pessoa']['nome']) ?></strong>
                <span><?= h(TIPOS_PESSOA[$l['pessoa']['tipo']]) ?> · <?= h(ROTULO_FUNIL[$etapa]) ?></span>
              </span>
              <span class="selo selo-off"><?= h(strtoupper($etapa)) ?></span>
            </header>
            <div class="acoes">
              <?php if ($l['pessoa']['telefone'] !== '' && pode_ver_telefone($l, $eu)): ?>
                <a class="btn btn-mini" target="_blank" rel="noopener"
                   href="https://wa.me/55<?= h($l['pessoa']['telefone']) ?>">Abrir WhatsApp</a>
              <?php endif; ?>
              <form method="post" style="display:inline">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
                <input type="hidden" name="lead" value="<?= h($l['id']) ?>">
                <input type="hidden" name="acao" value="funil">
                <input type="hidden" name="etapa" value="<?= h($etapa) ?>">
                <button type="submit" class="btn btn-ouro">Marcar como feito</button>
              </form>
            </div>
          </article>
        <?php endforeach; ?>
      <?php endif; ?>
    </fieldset>
    <?php
}
