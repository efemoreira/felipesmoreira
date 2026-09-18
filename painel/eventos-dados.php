<?php
declare(strict_types=1);

/**
 * A ABA DADOS de um encontro: o que ele é, quando, onde, e o botão de apagar.
 *
 * É DA COORDENAÇÃO, e quem confere isso é o chamador (`pode('agenda')`): quem
 * só executa marca checklist e recebe gente — não muda data, local, nem o que
 * vai para a programação pública. Forçar `?aba=dados` na URL cai no Preparo.
 *
 * É a aba que se abre uma vez e não se abre mais, e por isso vem por último na
 * ordem das três: prepara-se antes, recebe-se durante, e o ajuste é uma vez.
 */

require_once __DIR__ . '/agenda-comum.php';  // o relógio e o pipeline de imagem
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_abas(), abrir_modal() — a moldura
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo

/**
 * O formulário do encontro.
 *
 * `$naLista` decide se o botão de apagar existe: encontro com gente na lista
 * não se apaga — apagá-lo apagaria o encontro do histórico de cada uma dessas
 * pessoas, de uma vez e sem desfazer. Para o que não vai acontecer existe
 * **Cancelado**, que já tira o encontro da programação pública e deixa a lista.
 *
 * `$time` são as contas ativas, para os seletores de responsável das cinco
 * peças — vem pronto de fora porque a mesma leitura serve a tela inteira.
 */
function desenhar_dados(array $aberto, array $time, int $naLista): void
{
    ?>
    <fieldset id="dados">
      <legend>Dados do encontro</legend>

      <?php /* MONTAR A ESCALA — form próprio, e fora do de salvar: form dentro
               de form é inválido, e o botão precisa gravar sozinho para a
               sugestão aparecer já marcada nas listas abaixo.

               Só aparece quando há peça vazia. Botão que não faz nada é pior
               que botão nenhum: quem clica e não vê mudança conclui que a tela
               está quebrada. */ ?>
      <?php if (pecas_sem_dono($aberto) !== []): ?>
        <form method="post" class="montar-escala">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
          <input type="hidden" name="acao" value="montar-escala">
          <button class="btn btn-ouro" type="submit">Montar a escala</button>
          <p class="dica" style="margin:8px 0 0">
            Preenche as peças vazias com quem <strong>pediu aquela função</strong> ao se
            inscrever, começando por quem foi escalado menos vezes. Não mexe no que
            você já escalou à mão.
          </p>
        </form>
      <?php endif; ?>

      <?php /* Rascunho por encontro, e não um só para a tela: dois encontros
               abertos em duas abas não podem dividir o mesmo guardado. */ ?>
      <form method="post" enctype="multipart/form-data"
            data-rascunho="encontro-<?= h($aberto['id']) ?>">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
        <input type="hidden" name="acao" value="salvar">

        <div class="campo">
          <label for="e-titulo">Nome</label>
          <input id="e-titulo" type="text" name="titulo" maxlength="120" value="<?= h($aberto['titulo']) ?>">
        </div>
        <div class="campo">
          <label for="e-familia">Família</label>
          <select id="e-familia" name="familia">
            <?php foreach (FAMILIAS as $chave => $fam): ?>
              <option value="<?= h($chave) ?>" <?= $aberto['familia'] === $chave ? 'selected' : '' ?>><?= h($fam['nome']) ?> — <?= h($fam['serve']) ?></option>
            <?php endforeach; ?>
          </select>
          <p class="dica">
            Trocar a família muda o playbook, as travas e as peças oferecidas — mas não apaga o
            que já foi marcado nas peças da família anterior. Se este encontro já tem checklist
            ou escala preenchidos, confira-os depois de trocar: eles podem não bater com o
            playbook novo.
          </p>
        </div>
        <div class="linha g2">
          <div class="campo">
            <label for="e-dia">Dia</label>
            <input id="e-dia" type="date" name="dia" value="<?= h(dia_do_inicio($aberto['inicio'])) ?>">
          </div>
          <div class="campo">
            <label for="e-hora">Hora <span class="dica">— dá para deixar em branco</span></label>
            <input id="e-hora" type="time" name="hora" value="<?= h(hora_do_inicio($aberto['inicio'])) ?>">
          </div>
        </div>
        <?php if ($aberto['inicio'] === '' && $aberto['data'] !== ''): ?>
          <p class="dica">
            Este encontro é anterior ao campo de horário e guardava
            “<?= h(trim($aberto['data'] . ' ' . $aberto['hora'])) ?>” como texto.
            Preencha acima para ele voltar a ordenar e a saber quando acabou.
          </p>
        <?php else: ?>
          <p class="dica">Horário do Ceará. Sem hora, o cartão mostra só o dia.</p>
        <?php endif; ?>
        <?php $ehDigital = $aberto['familia'] === 'digital'; ?>
        <?php if (!$ehDigital): ?>
          <div class="campo">
            <label for="e-local">Local</label>
            <input id="e-local" type="text" name="local" maxlength="120" value="<?= h($aberto['local']) ?>">
            <p class="dica">O nome público do lugar. É o que vai para o site.</p>
          </div>
          <div class="campo">
            <label for="e-end">Endereço</label>
            <input id="e-end" type="text" name="endereco" maxlength="200" value="<?= h($aberto['endereco']) ?>">
            <p class="dica">
              Este <strong>não</strong> vai para o site — pode ser a casa de alguém.
              Serve para quem está escalado achar o lugar.
            </p>
          </div>
        <?php else: ?>
          <input type="hidden" name="local" value="<?= h($aberto['local']) ?>">
          <input type="hidden" name="endereco" value="<?= h($aberto['endereco']) ?>">
        <?php endif; ?>

        <div class="campo">
          <label for="e-grupo">Grupo de WhatsApp deste encontro <span class="dica">— opcional</span></label>
          <input id="e-grupo" type="url" name="grupo" maxlength="300" value="<?= h($aberto['grupo']) ?>"
                 placeholder="https://chat.whatsapp.com/…" inputmode="url"
                 autocapitalize="none" spellcheck="false">
          <p class="dica">
            Cole o link de convite. Com ele preenchido, o cartão deste encontro em
            <a href="/programacao" target="_blank">/programacao</a> ganha um botão “Quero ajudar” que leva
            direto para o grupo — diferente do grupo geral da capa da agenda, este é só de quem topa
            ajudar a montar <strong>este</strong> encontro. Apague para tirar o botão.
          </p>
        </div>

        <?php /* ===== o que o site mostra ===== */ ?>
        <label class="check">
          <input type="checkbox" name="naAgenda" value="1" <?= $aberto['naAgenda'] ? 'checked' : '' ?>>
          Aparecer na programação pública
        </label>
        <p class="dica">
          Marcado, ele está em <a href="/programacao" target="_blank">/programacao</a>.
          O que sai daqui é o nome, o subtítulo, o horário, o local e a imagem — nunca o
          endereço, o orçamento nem as observações.
        </p>

        <div class="campo">
          <label for="e-sub">Subtítulo no cartão</label>
          <input id="e-sub" type="text" name="subtitulo" maxlength="120" value="<?= h($aberto['subtitulo']) ?>">
          <p class="dica">Vazio, o cartão usa o local.</p>
        </div>
        <div class="linha g2">
          <div class="campo">
            <label for="e-cor">Cor do cartão</label>
            <select id="e-cor" name="cor">
              <?php foreach (CORES as $chave => $nome): ?>
                <option value="<?= h($chave) ?>" <?= $aberto['cor'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="campo">
            <label for="e-plat">Plataforma</label>
            <select id="e-plat" name="plataforma">
              <?php foreach (PLATAFORMAS as $chave => $nome): ?>
                <option value="<?= h($chave) ?>" <?= $aberto['plataforma'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
              <?php endforeach; ?>
            </select>
            <p class="dica"><?= $ehDigital ? 'Onde a transmissão acontece.' : 'Só para encontro digital.' ?></p>
          </div>
        </div>
        <?php /* A prévia é do TEXTO EM CIMA DA IMAGEM, e não da imagem: é assim que
                 a foto aparece na /presenca, e é lá que ela briga com o nome do
                 encontro. Mostrar a foto limpa esconde justamente o que se está
                 escolhendo. */ ?>
        <?php $filtroAtual = FILTROS[$aberto['filtro']]; ?>
        <div class="campo">
          <label for="e-img">Imagem <span class="dica">— opcional</span></label>
          <?php if ($aberto['imagem'] !== ''): ?>
            <div class="previa-filtro">
              <img src="<?= h($aberto['imagem']) ?>" alt="" data-foto
                   style="filter:blur(<?= (int) $filtroAtual['desfoque'] ?>px)">
              <span aria-hidden="true" data-veu style="background:<?= h($filtroAtual['veu']) ?>"></span>
              <span class="previa-filtro-texto" aria-hidden="true">
                <?php /* O selo é o do check-in porque é o caso apertado: quem está
                         na porta lê isto em pé, com a fila andando. O link de
                         confirmação usa a mesma imagem e o mesmo véu. */ ?>
                <em>Check-in</em>
                <strong><?= h($aberto['titulo']) ?></strong>
                <span><?= h(trim(($aberto['local'] !== '' ? $aberto['local'] : 'Local a definir'))) ?></span>
              </span>
            </div>
            <label class="check">
              <input type="checkbox" name="tirarImagem" value="1"> Remover esta imagem
            </label>
          <?php endif; ?>
          <input id="e-img" type="file" name="imagem" accept="image/*">
          <p class="dica">
            JPG, PNG ou WEBP até 8 MB. Enviar uma nova substitui a atual.
            Sem imagem, o cartão desenha a hachura do cordel com a sigla do dia.
          </p>
        </div>
        <div class="campo">
          <label for="e-filtro">Filtro sobre a imagem</label>
          <select id="e-filtro" name="filtro" data-filtro>
            <?php foreach (FILTROS as $chave => $f): ?>
              <option value="<?= h($chave) ?>" <?= $aberto['filtro'] === $chave ? 'selected' : '' ?>><?= h($f['nome']) ?></option>
            <?php endforeach; ?>
          </select>
          <p class="dica">
            Na <a href="/presenca" target="_blank">tela de confirmação e de check-in</a> a imagem
            fica atrás do nome, da data e do local. Foto clara ou cheia de detalhe engole esse
            texto — o filtro empurra a imagem para trás. A prévia acima mostra o resultado.
          </p>
        </div>
        <script nonce="<?= h(nonce_csp()) ?>">
          /* Prévia ao vivo: trocar o filtro tem de mostrar o efeito ANTES de salvar,
             senão a escolha vira tentativa e erro com um Salvar entre cada tentativa.
             Os valores vêm do PHP para não haver uma segunda tabela aqui. */
          (function () {
            var form = document.currentScript.closest('form');
            var seletor = form.querySelector('[data-filtro]');
            var previa = form.querySelector('.previa-filtro');
            if (!seletor || !previa) return;
            var tabela = <?= json_encode(FILTROS, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
            /* No formulário, e não no seletor: assim recuperar um rascunho — que
               troca o valor por código e avisa o formulário — também repinta. */
            form.addEventListener('change', function () {
              var f = tabela[seletor.value];
              if (!f) return;
              previa.querySelector('[data-veu]').style.background = f.veu;
              previa.querySelector('[data-foto]').style.filter = 'blur(' + f.desfoque + 'px)';
            });
          })();
        </script>
        <div class="campo">
          <label for="e-link">Link</label>
          <input id="e-link" type="text" name="link" maxlength="300" value="<?= h($aberto['link']) ?>"
                 placeholder="<?= $ehDigital ? 'https://youtube.com/...' : '/propostas' ?>">
        </div>
        <label class="check">
          <input type="checkbox" name="aoVivo" value="1" <?= $aberto['aoVivo'] ? 'checked' : '' ?>>
          É transmissão ao vivo
        </label>
        <p class="dica">
          O selo “AO VIVO” só acende com esta marca <strong>e</strong> dentro da janela de
          <?= DURACAO_PADRAO_MIN ?> minutos do início. Só a marca é o que fazia o selo ficar
          aceso por treze dias.
        </p>
        <div class="linha g2">
          <div class="campo">
            <label for="e-pub">Público esperado</label>
            <input id="e-pub" type="number" name="publicoEsperado" min="0" max="100000" value="<?= (int) $aberto['publicoEsperado'] ?>">
            <p class="dica">A Divulgação convida cerca de 3x isso e confirma um terço.</p>
          </div>
          <div class="campo">
            <label for="e-orc">Orçamento aprovado</label>
            <input id="e-orc" type="text" name="orcamento" maxlength="60" value="<?= h($aberto['orcamento']) ?>">
          </div>
        </div>

        <?php /* UMA LISTA POR PEÇA, e não um `<select>`: numa peça de rua não
                 trabalha uma pessoa, trabalham três ou quatro nas pontas do
                 movimento de gente. Enquanto cabia um nome só, a escala de um
                 ato grande era impossível de escrever — e o que não cabe na
                 ferramenta acontece fora dela, no grito.

                 Cada peça vem recolhida: nove peças abertas com a lista inteira
                 do movimento em cada uma é um paredão que ninguém lê. O resumo
                 no `<summary>` diz quem já está lá, que é a pergunta de quem
                 abre esta aba. */ ?>
        <p class="dica" style="margin:0 0 4px">Quem responde por cada peça — pode ser mais de uma pessoa:</p>
        <p class="dica folga">
          Quem <strong>pediu a função</strong> aparece primeiro, marcado. É de lá que sai a sugestão do botão acima.
        </p>

        <?php foreach (pecas_do_evento($aberto) as $chave): ?>
          <?php
            $peca = PECAS[$chave];
            $escalados = $aberto['responsaveis'][$chave];
            $candidatos = quem_pediu_a_peca($chave);
            $pediram = array_column($candidatos, 'id');

            /* A LISTA É A UNIÃO: quem tem conta, quem pediu esta função e quem
               já está escalado.

               Quem pediu entra MESMO SEM CONTA, e é o ponto: das setenta e duas
               pessoas na fila, cinquenta e oito escolheram função ao se
               inscrever — e o convite vai por WhatsApp, que não pede login. A
               regra antiga, de listar só quem tem conta, existia para o seletor
               não virar despejo de quem foi cadastrado na porta de um encontro;
               essa gente tem `funcoes` vazio, então o filtro por função já a
               deixa de fora sem precisar da conta como peneira.

               Quem já está escalado entra sempre: se a caixa dela não for
               desenhada, o POST não a manda de volta e salvar a apagaria. */
            $ordenado = $time;
            foreach (array_merge($candidatos, array_map('achar_pessoa', $escalados)) as $extra) {
                if ($extra !== null && !in_array($extra['id'], array_column($ordenado, 'id'), true)) {
                    $ordenado[] = $extra;
                }
            }
            usort($ordenado, fn ($a, $b) => [!in_array($a['id'], $pediram, true), $a['nome']]
                                        <=> [!in_array($b['id'], $pediram, true), $b['nome']]);
            $nomes = [];
            foreach ($escalados as $id) {
                $p = achar_pessoa($id);
                $nomes[] = $p === null ? '—' : $p['nome'];
            }
          ?>
          <details class="decidir peca-escala">
            <summary class="btn">
              <?= h($peca['nome']) ?>
              — <?= $nomes === [] ? 'ninguém ainda' : h(implode(', ', $nomes)) ?>
            </summary>
            <div class="decidir-corpo">
              <?php if (count($ordenado) > 8): ?>
                <?php filtro_de_marcacao('escala-' . $chave, 'nome'); ?>
              <?php endif; ?>
              <div id="escala-<?= h($chave) ?>">
                <?php foreach ($ordenado as $p): ?>
                  <label class="check">
                    <input type="checkbox" name="resp[<?= h($chave) ?>][]" value="<?= h($p['id']) ?>"
                      <?= in_array($p['id'], $escalados, true) ? 'checked' : '' ?>>
                    <?= h($p['nome']) ?>
                    <?php if (in_array($p['id'], $pediram, true)): ?>
                      <span class="selo selo-ok">pediu esta função</span>
                    <?php endif; ?>
                  </label>
                <?php endforeach; ?>
              </div>
            </div>
          </details>
        <?php endforeach; ?>

        <div class="campo">
          <label for="e-obs">Observações</label>
          <textarea id="e-obs" name="observacoes" rows="3" maxlength="600"><?= h($aberto['observacoes']) ?></textarea>
        </div>

        <div class="acoes">
          <button type="submit" class="btn btn-ouro">Salvar</button>
        </div>
      </form>

      <form method="post" class="decidir-recusa">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
        <input type="hidden" name="acao" value="status">
        <div class="campo">
          <label for="e-status">Situação</label>
          <select id="e-status" name="status">
            <?php foreach (STATUS_EVENTO as $chave => $nome): ?>
              <option value="<?= h($chave) ?>" <?= $aberto['status'] === $chave ? 'selected' : '' ?>><?= h($nome) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="acoes">
          <button type="submit" class="btn btn-mini">Mudar situação</button>
        </div>
      </form>

      <?php /* Apagar fica por último, depois de tudo que se faz todo dia, e só
               aparece quando é de fato possível: encontro com gente na lista não
               se apaga — apagá-lo apagaria o histórico de cada uma dessas
               pessoas, de uma vez e sem desfazer. Para o que não vai acontecer
               existe CANCELADO, ali em cima, que já tira o encontro da
               programação do site sem apagar ninguém.

               Mostrar um botão que o POST vai recusar é pedir para a pessoa
               clicar à toa — o mesmo desenho da decisão do próprio fato. */ ?>
      <div class="decidir-recusa">
        <?php if ($naLista > 0): ?>
          <p class="dica colado">
            Este encontro não pode ser apagado: <?= $naLista ?>
            <?= $naLista === 1 ? 'pessoa está' : 'pessoas estão' ?> na lista dele, e apagá-lo
            apagaria esse encontro do histórico de cada uma. Se ele não vai acontecer,
            marque <strong>Cancelado</strong> — sai da programação do site e a lista fica.
          </p>
        <?php else: ?>
          <p class="dica folga">
            Ninguém na lista ainda, então apagar não apaga o histórico de ninguém.
            Serve para o encontro cadastrado duas vezes, ou o rascunho que não virou nada.
          </p>
          <form method="post"
                data-confirmar="<?= h('Apagar “' . $aberto['titulo'] . '”? Isto não tem desfazer.') ?>">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="id" value="<?= h($aberto['id']) ?>">
            <div class="acoes">
              <button type="submit" class="btn btn-risco" name="acao" value="apagar">Apagar o encontro</button>
            </div>
          </form>
        <?php endif; ?>
      </div>
    </fieldset>
    <?php
}
