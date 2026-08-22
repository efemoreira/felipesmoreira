<?php
declare(strict_types=1);

/**
 * Munição — felipesmoreira.com/painel/municao
 *
 * As peças que o militante compartilha: um número do plano com a página, o
 * texto pronto pra colar e a arte gerada no canvas do site.
 *
 * Isto morava dentro do quadro de Produção, num <details> no meio das quatro
 * colunas — a ferramenta mais usada do movimento escondida atrás de um
 * triângulo, numa tela que fala de outra coisa. Virou área própria, com nome
 * próprio, no menu.
 *
 * As oito peças fixas vêm do plano e vivem no código do site (não envelhecem).
 * O que se cria aqui é a peça da semana, que precisaria de um build para
 * existir se dependesse do repositório — e por isso ela é gravada em
 * dados/kit.php e servida pelo api/kit.php.
 *
 * REGRA QUE NÃO SE NEGOCIA: peça sem fonte não é aceita. É a Parte 0 do manual
 * aplicada à ferramenta — a peça circula muito mais longe que um post, e sem a
 * página do plano ninguém consegue conferir o número que está espalhando.
 *
 * O nome dos arquivos continua "kit": `kit-comum.php`, `api/kit.php` e
 * `dados/kit.php` são contrato interno e arquivo em produção. Renomeá-los seria
 * risco sem ganho — o que muda é o nome que a pessoa lê.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/kit-comum.php';
exigir_area('municao');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

function voltar(string $ancora = ''): void
{
    header('Location: /painel/municao.php' . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
}

/* ===================== ações ===================== */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!token_valido()) {
        avisar('erro', 'Sessão expirada. Entre de novo.');
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    $acao = (string) ($_POST['acao'] ?? '');

    /* ---- as peças ---- */
    if ($acao === 'kit-nova' || $acao === 'kit-publicar' || $acao === 'kit-apagar') {
        $pecas = ler_pecas();

        if ($acao === 'kit-nova') {
            $u = usuario_atual();
            $nova = [
                'id'        => normalizar_id_peca($_POST['numero'] ?? '') . '-' . substr(bin2hex(random_bytes(2)), 0, 4),
                'tema'      => $_POST['tema'] ?? '',
                'numero'    => $_POST['numero'] ?? '',
                'frase'     => $_POST['frase'] ?? '',
                'fonte'     => $_POST['fonte'] ?? '',
                'legenda'   => $_POST['legenda'] ?? '',
                'destino'   => $_POST['destino'] ?? '',
                'publicada' => false,
                'criadaEm'  => date('c'),
                'criadaPor' => (string) ($u['nome'] ?? ''),
            ];
            if (normalizar_peca($nova) === null) {
                avisar('erro', 'A peça precisa de número, frase e fonte — sem fonte ela não entra.');
                voltar();
            }
            $pecas[] = $nova;
            avisar('ok', 'Peça criada. Publique quando quiser que ela apareça na Munição.');
        } else {
            $id = normalizar_id_peca($_POST['id'] ?? '');
            $achou = false;
            foreach ($pecas as $i => $pc) {
                if ($pc['id'] !== $id) {
                    continue;
                }
                $achou = true;
                if ($acao === 'kit-apagar') {
                    unset($pecas[$i]);
                    avisar('ok', 'Peça apagada.');
                } else {
                    $pecas[$i]['publicada'] = !$pc['publicada'];
                    avisar('ok', $pecas[$i]['publicada'] ? 'Peça no ar.' : 'Peça recolhida.');
                }
                break;
            }
            if (!$achou) {
                avisar('erro', 'Peça não encontrada.');
                voltar();
            }
        }

        if (!gravar_pecas(array_values($pecas))) {
            avisar('erro', 'Não consegui gravar as peças.');
        }
        voltar();
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

$pecasKit = ler_pecas();
$noAr = count(array_filter($pecasKit, fn ($p) => $p['publicada']));

abrir_pagina('Munição');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Munição',
      'As peças que o militante manda no grupo: um número do plano, com a página, '
      . 'mais o texto pronto e a arte. Peça sem fonte não entra.',
      null,
      '/painel/municao',
      [
          'Criar a peça da semana — o número que saiu agora, sem esperar deploy.',
          'Publicar e recolher: só o que está no ar aparece no site.',
          'Ver a Munição como o militante vê, em /municao.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <fieldset id="pecas">
    <legend>As peças (<?= $noAr ?> no ar de <?= count($pecasKit) ?>)</legend>
      <p class="dica" style="margin:0 0 14px">
      A <a href="/municao" target="_blank">Munição</a> já vem com as peças fixas do plano de
      governo, que não envelhecem. Aqui entra o que é da semana — o fato que acabou de sair, o
      número novo. Só aparece no site depois de publicada, e <strong>peça sem fonte não é
      aceita</strong>: ela circula muito mais longe que um post.
      </p>

      <?php if ($pecasKit !== []): ?>
      <div class="rolagem">
        <table class="tabela">
          <thead><tr><th>Peça</th><th>Fonte</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($pecasKit as $pc): ?>
              <tr>
                <td>
                  <strong><?= h($pc['numero']) ?></strong><br>
                  <span class="dica"><?= h($pc['frase']) ?></span>
                </td>
                <td><span class="selo"><?= h($pc['fonte']) ?></span></td>
                <td>
                  <span class="selo <?= $pc['publicada'] ? 'selo-ok' : 'selo-cinza' ?>">
                    <?= $pc['publicada'] ? 'no ar' : 'rascunho' ?>
                  </span>
                </td>
                <td>
                  <form method="post" style="display:inline">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($pc['id']) ?>">
                    <button class="btn" name="acao" value="kit-publicar" type="submit">
                      <?= $pc['publicada'] ? 'Recolher' : 'Publicar' ?>
                    </button>
                  </form>
                  <form method="post" style="display:inline"
                        onsubmit="return confirm('Apagar esta peça?')">
                    <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                    <input type="hidden" name="id" value="<?= h($pc['id']) ?>">
                    <button class="btn" name="acao" value="kit-apagar" type="submit">Apagar</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php endif; ?>

      <form method="post" style="margin-top:18px">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <label for="kit-numero">O número, curto (é o que fica grande no cartão)</label>
      <input id="kit-numero" name="numero" type="text" maxlength="20" required placeholder="64 mil">

      <label for="kit-frase">A frase que explica o número</label>
      <input id="kit-frase" name="frase" type="text" maxlength="160" required
             placeholder="pessoas esperando na fila da regulação.">

      <label for="kit-fonte">A fonte, com página ou data</label>
      <input id="kit-fonte" name="fonte" type="text" maxlength="80" required
             placeholder="Plano de Governo, p. 31">

      <label for="kit-tema">Tema</label>
      <select id="kit-tema" name="tema">
        <?php foreach (TEMAS_KIT as $t): ?>
          <option value="<?= h($t) ?>"><?= h($t) ?></option>
        <?php endforeach; ?>
      </select>

      <label for="kit-destino">Para onde o link leva</label>
      <input id="kit-destino" name="destino" type="text" maxlength="120" value="/propostas"
             placeholder="/propostas#saude-que-chega">

      <label for="kit-legenda">O texto pronto pra colar</label>
      <textarea id="kit-legenda" name="legenda" rows="5" maxlength="900"
                placeholder="64 mil cearenses esperando na fila da regulação..."></textarea>

      <div class="acoes" style="margin-top:12px">
        <button class="btn btn-ouro" name="acao" value="kit-nova" type="submit">Criar peça</button>
      </div>
      </form>
  </fieldset>
</div>
<?php
fechar_pagina();
