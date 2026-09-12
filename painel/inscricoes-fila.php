<?php
declare(strict_types=1);

/**
 * A fila de entrada — a aba "Esperando decisão" de `/painel/inscricoes`.
 *
 * É a única aba que é TRABALHO: a outra é arquivo. Por isso a tela abre nela
 * sempre, e por isso a ficha traz tudo que a decisão precisa sem obrigar a
 * abrir uma segunda tela — quem é, como falar com ela, de onde veio e em que
 * quer ajudar.
 *
 * **O formulário fica recolhido num `<details>`.** Com vinte pessoas na fila,
 * um formulário aberto para cada uma vira um paredão impossível de ler — e o
 * que se lê primeiro tem de ser a lista, não o campo de login.
 *
 * O vão entre se inscrever e ser aprovado é onde mais se perde gente: a pessoa
 * está no pico de entusiasmo que vai ter, e depende de um humano decidir.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/inscricoes-comum.php';

/**
 * Desenha a aba da fila.
 *
 * @param array  $novas   a fila já recortada pela busca
 * @param string $buscaIn o que foi procurado, para o vazio saber explicar
 * @param callable $formatar como esta tela escreve uma data
 * @param ?array $encontro o encontro escolhido no filtro, ou null
 */
function aba_da_fila(array $novas, string $buscaIn, callable $formatar, ?array $encontro = null): void
{
    $convidados = $encontro === null ? [] : $encontro['convidados'];
    ?>
  <fieldset>
    <legend>
      Esperando decisão (<?= count($novas) ?>)
      <?php if ($encontro !== null): ?>
        <?php /* O número que importa quando se está convidando não é o tamanho
                 da fila — é quanto dela já foi chamada. Sem ele, a segunda
                 sessão de convites recomeça do zero e repete gente. */ ?>
        · <?= count(array_filter($novas, fn ($i) => in_array($i['id'], $convidados, true))) ?>
        de <?= count($novas) ?> já convidadas
      <?php endif; ?>
    </legend>

    <?php if ($novas === []): ?>
      <?php nada_encontrado($buscaIn, '/painel/inscricoes.php?aba=fila', 'Nenhuma inscrição nova por enquanto.'); ?>
    <?php endif; ?>

    <?php /* O FORMULÁRIO DO LOTE MORA AQUI, FORA DOS CARTÕES, e as caixas se
             ligam a ele pelo atributo `form`. Cada ficha já tem os seus dois
             formulários (aprovar e recusar), e form dentro de form é inválido —
             o navegador descarta o de dentro sem avisar, e o botão simplesmente
             não faz nada.

             Sem capacidade nenhuma, que é o que a própria tela recomenda para o
             caso comum. Quem precisa de permissão continua sendo decidido um a
             um, no `<details>` de cada ficha. */ ?>
    <?php if (count($novas) > 1): ?>
      <form method="post" id="lote" class="lote">
        <input type="hidden" name="acao" value="aprovar-lote">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <?php /* QUEM VAI ACOMPANHAR O LOTE. Aprovar setenta e duas pessoas para
                 o mesmo lugar indiferenciado é fabricar o grupo gigante de novo,
                 maior — e com um coordenador só ninguém acompanha oitenta e sete
                 pessoas. Sai marcado no lote inteiro; a ficha ajusta caso a caso. */ ?>
        <?php $lideres = possiveis_lideres(); ?>
        <?php if ($lideres !== []): ?>
          <label class="campo campo-lote">
            <span>Quem acompanha</span>
            <select name="lider">
              <option value="">— decidir depois —</option>
              <?php foreach ($lideres as $l): ?>
                <option value="<?= h($l['id']) ?>"><?= h($l['nome']) ?></option>
              <?php endforeach; ?>
            </select>
          </label>
        <?php endif; ?>
        <button class="btn btn-ouro" type="submit">Aprovar as marcadas</button>
        <span class="dica">
          Cria a conta de cada uma, sem permissão de painel, e mostra as senhas
          <strong>uma vez</strong> para você mandar.
        </span>
      </form>
    <?php endif; ?>

    <?php foreach ($novas as $i): ?>
      <?php $sugeridas = areas_sugeridas($i['funcoes']); ?>
      <article class="ficha" id="p-<?= h($i['id']) ?>">
        <header class="ficha-topo">
          <?php if (count($novas) > 1): ?>
            <label class="check check-lote">
              <input type="checkbox" form="lote" name="ids[]" value="<?= h($i['id']) ?>">
              <span class="nav-sr">Aprovar <?= h($i['nome']) ?> no lote</span>
            </label>
          <?php endif; ?>
          <span class="ficha-inicial" aria-hidden="true"><?= h(iniciais($i['nome'])) ?></span>
          <span class="ficha-quem">
            <strong><?= h($i['nome']) ?></strong>
            <span><?= h($i['bairro']) ?>, <?= h($i['cidade']) ?> · chegou <?= h($formatar($i['criadoEm'])) ?></span>
          </span>
          <?php /* Corrigir o cadastro é na ficha da pessoa, e não aqui: a
                   inscrição não é um registro à parte — é a MESMA pessoa, com o
                   bloco de entrada preenchido. Um segundo formulário de edição
                   nesta tela seria uma segunda régua para o mesmo dado.

                   Só quem enxerga a lista de pessoas vê o elo: ela tem telefone
                   e endereço de todo mundo, e dado pessoal acompanha a
                   responsabilidade sobre ele. */ ?>
          <?php if (pode('pessoas')): ?>
            <a class="btn btn-mini" href="/painel/pessoas.php?p=<?= h($i['id']) ?>">Abrir a ficha</a>
          <?php endif; ?>
        </header>

        <dl class="ficha-dados">
          <div>
            <dt>WhatsApp</dt>
            <dd>
              <?php links_whatsapp($i['telefone'], telefone_bonito($i['telefone'])); ?>
            </dd>
          </div>
          <?php if ($i['email'] !== ''): ?>
            <div>
              <dt>E-mail</dt>
              <dd><?= h($i['email']) ?></dd>
            </div>
          <?php endif; ?>
          <?php if ($i['origem'] !== ''): ?>
            <?php /* Quem trouxe, ou por qual canal. Fica junto do contato, e não
                      no fim da ficha, porque muda a conversa: quem chega indicado
                      por alguém do time se recebe pelo nome de quem indicou. */ ?>
            <div>
              <dt>Veio por</dt>
              <dd><span class="selo"><?= h($i['origem']) ?></span></dd>
            </div>
          <?php endif; ?>
          <div class="ficha-funcoes">
            <dt>Quer ajudar em</dt>
            <dd>
              <?php if ($i['funcoes'] === []): ?>
                <span class="selo selo-cinza">não escolheu</span>
                <span class="dica" style="display:inline">
                  Entra como “Onde precisar” — combine na conversa.
                </span>
              <?php else: ?>
                <?php foreach ($i['funcoes'] as $f): ?>
                  <span class="selo"><?= h(nome_funcao($f)) ?></span>
                <?php endforeach; ?>
              <?php endif; ?>
            </dd>
          </div>
        </dl>

        <?php if ($encontro !== null && $i['telefone'] !== ''): ?>
          <?php
            $jaFoi = in_array($i['id'], $convidados, true);
            $texto = mensagem_de_convite($i, $encontro);
          ?>
          <div class="convite">
            <?php /* O par de links, e não um `wa.me` montado aqui: quem tem a
                     conta na outra grafia do nono dígito só abre pelo segundo.
                     Abre em aba nova, então o painel continua atrás — é o que
                     torna o "Já convidei" um clique barato, na página que a
                     pessoa não chegou a deixar. */ ?>
            <?php links_whatsapp($i['telefone'], 'Abrir o convite no WhatsApp', $texto, 'btn btn-ouro'); ?>

            <button class="btn btn-mini" type="button" data-copiar="<?= h($texto) ?>">
              Copiar o texto
            </button>

            <form method="post" class="convite-envio">
              <input type="hidden" name="acao" value="convidar">
              <input type="hidden" name="id" value="<?= h($i['id']) ?>">
              <input type="hidden" name="evento" value="<?= h($encontro['id']) ?>">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <button class="btn btn-mini" type="submit">
                <?= $jaFoi ? 'Desmarcar' : 'Já convidei' ?>
              </button>
            </form>

            <?php if ($jaFoi): ?>
              <span class="selo selo-ok">já convidada</span>
            <?php endif; ?>
          </div>
        <?php endif; ?>

        <!-- a decisão fica recolhida: com fila grande, a lista continua legível -->
        <details class="decidir">
          <summary class="btn btn-ouro">Decidir sobre esta inscrição</summary>
          <div class="decidir-corpo">
            <form method="post">
              <input type="hidden" name="acao" value="aprovar">
              <input type="hidden" name="id" value="<?= h($i['id']) ?>">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">

              <div class="linha g2">
                <div class="campo">
                  <label for="u-<?= h($i['id']) ?>">Login de acesso</label>
                  <input id="u-<?= h($i['id']) ?>" type="text" name="usuario"
                         value="<?= h(login_sugerido($i['nome'])) ?>" maxlength="24" required>
                  <p class="dica">Sugerido a partir do nome. Pode trocar.</p>
                </div>
              </div>

              <div class="campo">
                <label>O que ela vai abrir no painel</label>
                <?php foreach (CAPACIDADES as $chave => $cap): ?>
                  <label class="check">
                    <input type="checkbox" name="capacidades[]" value="<?= h($chave) ?>">
                    <strong><?= h($cap['nome']) ?></strong>
                    <span class="dica"><?= h($cap['resumo']) ?></span>
                  </label>
                <?php endforeach; ?>
                <p class="dica">
                  Na dúvida, não marque nenhuma: a pessoa entra, faz a formação e recebe
                  a ferramenta quando assumir a função. <strong>Estudar não pede
                  permissão</strong> — a formação já é de todo mundo que tem conta.
                </p>
              </div>

              <details class="decidir">
                <summary class="btn">Ajuste fino por ferramenta</summary>
                <div class="decidir-corpo">
                  <p class="dica" style="margin:0 0 10px">
                    Já vem marcado conforme as funções que a pessoa escolheu. É para a
                    exceção — dar uma ferramenta solta sem a capacidade inteira.
                  </p>
                  <?php foreach (AREAS as $chave => $rotulo): ?>
                    <?php if (in_array($chave, areas_so_adm(), true)) continue; // só a capacidade dá ?>
                    <label class="check">
                      <input type="checkbox" name="areas[]" value="<?= h($chave) ?>"
                        <?= in_array($chave, $sugeridas, true) ? ' checked' : '' ?>>
                      <?= h($rotulo) ?>
                    </label>
                  <?php endforeach; ?>
                </div>
              </details>

              <div class="acoes">
                <button class="btn btn-ouro" type="submit">Aprovar e criar acesso</button>
              </div>
            </form>

            <form method="post" class="decidir-recusa"
                  onsubmit="return confirm(<?= texto_js('Recusar a inscrição de ' . $i['nome'] . '? Ela fica registrada, mas não vira acesso.') ?>)">
              <input type="hidden" name="acao" value="recusar">
              <input type="hidden" name="id" value="<?= h($i['id']) ?>">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <button class="btn btn-mini btn-risco" type="submit">Recusar inscrição</button>
            </form>
          </div>
        </details>
      </article>
    <?php endforeach; ?>
  </fieldset>

<?php
}
