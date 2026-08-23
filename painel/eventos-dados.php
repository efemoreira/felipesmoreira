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
        <div class="campo">
          <label for="e-img">Imagem <span class="dica">— opcional</span></label>
          <?php if ($aberto['imagem'] !== ''): ?>
            <p><img src="<?= h($aberto['imagem']) ?>" alt="" style="max-width:240px;border:3px solid var(--linha-2)"></p>
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

        <p class="dica">Quem responde por cada peça:</p>
        <div class="linha g2">
          <?php foreach (PECAS as $chave => $peca): ?>
            <div class="campo">
              <label for="resp-<?= h($chave) ?>"><?= h($peca['nome']) ?></label>
              <select id="resp-<?= h($chave) ?>" name="resp[<?= h($chave) ?>]">
                <option value="">— ninguém ainda —</option>
                <?php foreach ($time as $p): ?>
                  <option value="<?= h($p['id']) ?>" <?= $aberto['responsaveis'][$chave] === $p['id'] ? 'selected' : '' ?>>
                    <?= h($p['nome']) ?>
                  </option>
                <?php endforeach; ?>
              </select>
            </div>
          <?php endforeach; ?>
        </div>

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
          <p class="dica" style="margin:0">
            Este encontro não pode ser apagado: <?= $naLista ?>
            <?= $naLista === 1 ? 'pessoa está' : 'pessoas estão' ?> na lista dele, e apagá-lo
            apagaria esse encontro do histórico de cada uma. Se ele não vai acontecer,
            marque <strong>Cancelado</strong> — sai da programação do site e a lista fica.
          </p>
        <?php else: ?>
          <p class="dica" style="margin:0 0 10px">
            Ninguém na lista ainda, então apagar não apaga o histórico de ninguém.
            Serve para o encontro cadastrado duas vezes, ou o rascunho que não virou nada.
          </p>
          <form method="post"
                onsubmit="return confirm(<?= texto_js('Apagar “' . $aberto['titulo'] . '”? Isto não tem desfazer.') ?>)">
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
