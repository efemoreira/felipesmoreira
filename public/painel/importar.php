<?php
declare(strict_types=1);

/**
 * Importar — felipesmoreira.com/painel/importar
 *
 * Só administração: é dado pessoal entrando em lote. Dois passos — a prévia
 * (lê e mostra) e a confirmação (grava o marcado). Entre os dois, as linhas
 * ficam na sessão: reenviar o arquivo para confirmar seria pedir o mesmo
 * clique duas vezes.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/importar-comum.php';
require_once __DIR__ . '/acoes-comum.php';
exigir_admin('pessoas');

$eu = usuario_atual() ?? [];
$previa = [];
$erroCsv = '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    exigir_token_de_acao();
    $acao = (string) ($_POST['acao'] ?? '');

    if ($acao === 'previa') {
        $texto = '';
        if (($_FILES['arquivo']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK && is_uploaded_file($_FILES['arquivo']['tmp_name'])) {
            $texto = (string) file_get_contents($_FILES['arquivo']['tmp_name']);
        } else {
            $texto = (string) ($_POST['texto'] ?? '');
        }
        if (strlen($texto) > 2_000_000) {
            avisar('erro', 'Arquivo grande demais — divida em partes de até 2 MB.');
            ir_para('/painel/importar.php');
        }
        $lido = ler_csv_de_pessoas($texto);
        if ($lido['erro'] !== '') {
            avisar('erro', $lido['erro']);
            ir_para('/painel/importar.php');
        }
        $_SESSION['importacao'] = previa_de_importacao($lido['linhas']);
        ir_para('/painel/importar.php?previa=1');
    }

    if ($acao === 'confirmar') {
        $previa = $_SESSION['importacao'] ?? [];
        unset($_SESSION['importacao']);
        if ($previa === []) {
            avisar('erro', 'A prévia venceu. Envie o arquivo de novo.');
            ir_para('/painel/importar.php');
        }
        $marcadas = is_array($_POST['linhas'] ?? null) ? array_map('strval', $_POST['linhas']) : [];
        $quantas = gravar_importacao($previa, $marcadas, (string) ($_POST['status'] ?? ''), limpar_texto($_POST['origem'] ?? '', 60));
        avisar($quantas > 0 ? 'ok' : 'erro', $quantas > 0
            ? "{$quantas} pessoa(s) importada(s). Elas já aparecem em Pessoas."
            : 'Nada importado — nenhuma linha nova marcada.');
        ir_para('/painel/pessoas.php?ordem=recente');
    }

    avisar('erro', 'Ação desconhecida.');
    ir_para('/painel/importar.php');
}

if (!empty($_GET['previa'])) {
    $previa = $_SESSION['importacao'] ?? [];
}
['erro' => $erro, 'ok' => $ok] = recado_pendente();

abrir_pagina('Importar');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Importar uma planilha',
      'Uma lista que já existia fora do site entra aqui em lote. Primeiro a prévia, linha a linha; depois você marca o que entra.',
      ['url' => '/painel/pessoas.php', 'texto' => 'Todas as pessoas']
  ); ?>
  <?php recado($erro, $ok); ?>

  <?php if ($previa === []): ?>
    <fieldset>
      <legend>O arquivo</legend>
      <p class="dica folga">
        CSV do Excel ou do Google Planilhas, com cabeçalho. Colunas reconhecidas:
        <code>nome</code>, <code>telefone</code> (ou whatsapp/celular), <code>email</code>,
        <code>cidade</code>, <code>bairro</code>, <code>tipo</code>. Só nome e telefone são obrigatórios.
        Telefone é a chave: quem já está no cadastro não vira segunda ficha.
      </p>
      <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="acao" value="previa">
        <div class="campo">
          <label for="arquivo">Arquivo CSV</label>
          <input id="arquivo" type="file" name="arquivo" accept=".csv,text/csv,text/plain">
        </div>
        <div class="campo">
          <label for="texto">…ou cole as linhas aqui <span class="dica">— a primeira é o cabeçalho</span></label>
          <textarea id="texto" name="texto" rows="6" placeholder="nome;telefone;cidade;bairro&#10;Maria da Silva;85999990000;Fortaleza;Benfica"></textarea>
        </div>
        <div class="acoes"><button class="btn btn-ouro" type="submit">Ver a prévia</button></div>
      </form>
    </fieldset>
  <?php else: ?>
    <?php
      $novas = count(array_filter($previa, fn ($l) => $l['estado'] === 'nova'));
      $existem = count(array_filter($previa, fn ($l) => $l['estado'] === 'existe'));
      $invalidas = count($previa) - $novas - $existem;
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="confirmar">
      <fieldset>
        <legend>A prévia — <?= $novas ?> nova(s) · <?= $existem ?> já existe(m) · <?= $invalidas ?> inválida(s)</legend>
        <p class="dica folga">Nada foi gravado ainda. Desmarque o que não deve entrar.</p>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead><tr><th></th><th>Linha</th><th>Nome</th><th>WhatsApp</th><th>Cidade · bairro</th><th>Tipo</th><th>O que vai acontecer</th></tr></thead>
            <tbody>
              <?php foreach ($previa as $l): ?>
                <tr>
                  <td data-rotulo="Entra">
                    <?php if ($l['estado'] === 'nova'): ?>
                      <input type="checkbox" name="linhas[]" value="<?= (int) $l['n'] ?>" checked aria-label="importar a linha <?= (int) $l['n'] ?>">
                    <?php endif; ?>
                  </td>
                  <td data-rotulo="Linha"><?= (int) $l['n'] ?></td>
                  <td data-rotulo="Nome"><?= h($l['nome'] ?: '—') ?></td>
                  <td data-rotulo="WhatsApp"><?= h($l['telefone'] !== '' ? telefone_bonito($l['telefone']) : '—') ?></td>
                  <td data-rotulo="Cidade · bairro"><?= h(trim($l['cidade'] . ' · ' . $l['bairro'], ' ·')) ?></td>
                  <td data-rotulo="Tipo"><?= h(TIPOS_PESSOA[$l['tipo']]) ?></td>
                  <td data-rotulo="O que vai acontecer">
                    <?php if ($l['estado'] === 'nova'): ?><span class="selo selo-ok">nova</span>
                    <?php elseif ($l['estado'] === 'existe'): ?><span class="selo selo-cinza">pula</span> <span class="dica"><?= h($l['motivo']) ?></span>
                    <?php else: ?><span class="selo selo-off">inválida</span> <span class="dica"><?= h($l['motivo']) ?></span>
                    <?php endif; ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </fieldset>
      <fieldset>
        <legend>Como entram</legend>
        <div class="linha g2">
          <div class="campo">
            <label for="status">Situação</label>
            <select id="status" name="status">
              <option value="">Cadastradas — só para ter o contato</option>
              <option value="pendente">Pendentes — vão para a fila de Inscrições, para aprovar</option>
            </select>
          </div>
          <div class="campo">
            <label for="origem">Origem <span class="dica">— de onde veio a lista</span></label>
            <input id="origem" type="text" name="origem" maxlength="60" placeholder="planilha-igreja">
          </div>
        </div>
        <div class="acoes">
          <button class="btn btn-ouro" type="submit"<?= $novas === 0 ? ' disabled' : '' ?>>Importar <?= $novas ?> pessoa(s)</button>
          <a class="btn" href="/painel/importar.php">Outro arquivo</a>
        </div>
      </fieldset>
    </form>
  <?php endif; ?>
</div>
<?php
fechar_pagina();
