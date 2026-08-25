<?php
declare(strict_types=1);

/**
 * Manutenção — felipesmoreira.com/painel/manutencao
 *
 * Uma tela só, com uma ação só: **começar do zero**. Ela existe porque a fase
 * de testes deixou fichas de teste, encontros de teste e contas de teste
 * misturadas com as de verdade, e não há como olhar um relatório e saber qual
 * é qual. Apagar arquivo por arquivo no gerenciador da hospedagem funciona,
 * mas erra por omissão: esquece o `presencas.php` e as presenças passam a
 * apontar para pessoas que não existem mais.
 *
 * **Não tem área própria, e é de propósito.** Área nova aparece no menu de
 * quem a tem, e uma porta chamada "Manutenção" no menu de todo dia é uma porta
 * que alguém abre por curiosidade. Aqui a porta é `exigir_admin()` e o
 * endereço se digita; quem chega é quem foi procurar.
 *
 * A confirmação é DIGITADA, e não um `confirm()`: caixa de confirmação se
 * dispensa no reflexo, e esta ação não tem desfazer.
 */

require_once __DIR__ . '/layout.php';
exigir_admin();

/**
 * Tudo o que o painel grava em /dados, agrupado pela pergunta que responde.
 *
 * A lista é EXPLÍCITA, e não um `glob('*.php')`: varrer a pasta apagaria
 * também o arquivo que alguém pôs ali por outra razão, e um dia apagaria o
 * `.htaccess` que é justamente o que fecha a pasta para a web.
 */
function grupos_de_dados(): array
{
    return [
        'pessoas' => [
            'nome'   => 'Pessoas e contas',
            'resumo' => 'O cadastro de todo mundo — inclusive os logins do painel.',
            'arquivos' => [
                PASTA_DADOS . '/pessoas.php',
                PASTA_DADOS . '/presencas.php',
                PASTA_DADOS . '/listas.php',
                /* Os quatro cadastros de antes da unificação. Se ficarem, a
                   primeira leitura de `ler_pessoas()` recria tudo a partir
                   deles — zerar sem apagá-los não zera nada. */
                PASTA_DADOS . '/usuarios.php',
                PASTA_DADOS . '/inscricoes.php',
                PASTA_DADOS . '/leads.php',
                PASTA_DADOS . '/candidatos.php',
            ],
        ],
        'encontros' => [
            'nome'   => 'Encontros e agenda',
            'resumo' => 'Os encontros, o preparo de cada um e a programação pública.',
            'arquivos' => [
                PASTA_DADOS . '/eventos.php',
                PASTA_DADOS . '/agenda.json',
            ],
        ],
        'comunicacao' => [
            'nome'   => 'Fatos, produção e munição',
            'resumo' => 'A fila da Checagem, o quadro de produção e as peças do mutirão.',
            'arquivos' => [
                PASTA_DADOS . '/fatos.php',
                PASTA_DADOS . '/producao.php',
                PASTA_DADOS . '/kit.php',
            ],
        ],
        'formacao' => [
            'nome'   => 'Formação',
            'resumo' => 'Os vídeos pendurados nas aulas e quem já estudou o quê.',
            'arquivos' => [
                PASTA_DADOS . '/aulas.php',
                PASTA_DADOS . '/aulas-progresso.php',
            ],
        ],
        'contadores' => [
            'nome'   => 'Contadores e tentativas',
            'resumo' => 'Teto de envio por visitante e o registro de erro de senha. '
                . 'Some sozinho com o tempo; some junto por limpeza.',
            'arquivos' => [
                PASTA_DADOS . '/tentativas.php',
                PASTA_DADOS . '/tentativas.json',
                PASTA_DADOS . '/inscricoes-limite.php',
            ],
        ],
    ];
}

/** Quantos itens tem dentro de um arquivo de dados — para a tela dizer o tamanho do estrago. */
function quantos_em(string $arquivo): ?int
{
    if (!is_file($arquivo)) {
        return null;
    }
    if (str_ends_with($arquivo, '.json')) {
        $v = json_decode((string) @file_get_contents($arquivo), true);
        return is_array($v) ? count($v) : 0;
    }
    $v = @include $arquivo;
    return is_array($v) ? count($v) : 0;
}

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;

const PALAVRA_ZERAR = 'ZERAR TUDO';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!token_valido()) {
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    if (trim((string) ($_POST['confirmacao'] ?? '')) !== PALAVRA_ZERAR) {
        $_SESSION['recado'] = [
            'tipo'  => 'erro',
            'texto' => 'Nada foi apagado: a confirmação tem que ser exatamente “' . PALAVRA_ZERAR . '”.',
        ];
        header('Location: /painel/manutencao.php', true, 302);
        exit;
    }

    $pedidos = is_array($_POST['grupos'] ?? null) ? $_POST['grupos'] : [];
    $grupos = grupos_de_dados();
    $apagados = 0;
    $zerouPessoas = false;

    /* Lida ANTES de apagar: depois do `unlink` não há mais de onde tirá-la, e é
       ela que volta para o arquivo logo abaixo. */
    $eu = usuario_atual();

    foreach ($grupos as $chave => $grupo) {
        if (!in_array($chave, $pedidos, true)) {
            continue;
        }
        if ($chave === 'pessoas') {
            $zerouPessoas = true;
        }
        foreach ($grupo['arquivos'] as $arquivo) {
            if (is_file($arquivo) && @unlink($arquivo)) {
                $apagados++;
                if (function_exists('opcache_invalidate')) {
                    @opcache_invalidate($arquivo, true);
                }
            }
        }
    }

    /* As imagens só vão embora junto com os encontros e os candidatos que as
       usavam: apagadas sozinhas, sobraria ficha apontando para arquivo que não
       existe — e um cartão com foto quebrada é pior que um cartão sem foto. */
    if (in_array('pessoas', $pedidos, true) && in_array('encontros', $pedidos, true)) {
        foreach (glob(PASTA_IMAGENS . '/*') ?: [] as $img) {
            if (is_file($img) && @unlink($img)) {
                $apagados++;
            }
        }
    }

    if ($zerouPessoas) {
        /* SUA CONTA FICA, e ela é o que tranca a porta.

           Antes daqui saía um `derrubar_sessao()` e a próxima tela era o "criar
           o primeiro administrador". Só que essa tela não pergunta quem é: ela
           aparece para QUALQUER visitante enquanto não houver nenhuma conta, e
           quem chegasse primeiro em /painel/ viraria administrador do movimento.
           Zerar a base abria a porta da rua e ia embora.

           Guardar a ficha de quem está zerando resolve as duas pontas: não há
           janela sem administrador, e quem apagou não se tranca do lado de fora
           do próprio painel. É a única ficha que sobrevive — o resto do cadastro
           foi apagado de verdade, como a tela promete. */
        if ($eu !== null) {
            gravar_pessoas([$eu]);
        }
        $_SESSION['recado'] = [
            'tipo'  => 'ok',
            'texto' => $apagados . ' arquivo(s) apagado(s). O cadastro recomeça vazio — '
                . 'só a sua conta ficou, para o painel não voltar a aceitar que '
                . 'qualquer visitante crie um administrador.',
        ];
        header('Location: /painel/manutencao.php', true, 302);
        exit;
    }

    $_SESSION['recado'] = [
        'tipo'  => 'ok',
        'texto' => $apagados === 0
            ? 'Não havia nada para apagar nos grupos marcados.'
            : $apagados . ' arquivo(s) apagado(s). O painel recomeça vazio nessas áreas.',
    ];
    header('Location: /painel/manutencao.php', true, 302);
    exit;
}

$grupos = grupos_de_dados();

abrir_pagina('Manutenção');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Manutenção',
      'Apagar o que o painel gravou e recomeçar limpo.',
      ['url' => '/painel/conta.php', 'texto' => 'Minha conta'],
      null,
      [
          'Serve para sair da fase de teste: apaga o que foi cadastrado para experimentar.',
          'Marque só os grupos que quer zerar — cada um é independente do outro.',
          'Zerar “Pessoas e contas” apaga TAMBÉM os logins, inclusive o seu: o painel volta à tela de criar o primeiro administrador.',
          'Não tem desfazer, e não há cópia de segurança automática. Baixe /dados antes se quiser guardar.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <fieldset>
    <legend>O que existe hoje</legend>
    <form method="post"
          onsubmit="return confirm('Última pergunta: apagar de verdade? Isto não tem desfazer.')">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">

      <?php foreach ($grupos as $chave => $grupo): ?>
        <?php
        $existentes = array_values(array_filter($grupo['arquivos'], 'is_file'));
        $total = 0;
        foreach ($existentes as $arq) {
            $total += quantos_em($arq) ?? 0;
        }
        ?>
        <label class="check">
          <input type="checkbox" name="grupos[]" value="<?= h($chave) ?>"
                 <?= $existentes === [] ? 'disabled' : '' ?>>
          <strong><?= h($grupo['nome']) ?></strong>
          <?php if ($existentes === []): ?>
            <span class="selo selo-cinza">vazio</span>
          <?php else: ?>
            <span class="selo"><?= (int) $total ?> registro(s) em <?= count($existentes) ?> arquivo(s)</span>
          <?php endif; ?>
          <span class="dica"><?= h($grupo['resumo']) ?></span>
        </label>
      <?php endforeach; ?>

      <div class="decidir-recusa" style="margin-top:22px">
        <p class="dica" style="margin:0 0 12px">
          <strong>Isto não tem desfazer.</strong> Não há cópia de segurança automática:
          se quiser guardar o que existe, baixe a pasta <code>/dados</code> pelo
          gerenciador de arquivos antes de apertar.
        </p>
        <div class="campo">
          <label for="conf">Para confirmar, digite <code><?= h(PALAVRA_ZERAR) ?></code></label>
          <input id="conf" name="confirmacao" type="text" maxlength="20" required
                 autocomplete="off" spellcheck="false" placeholder="<?= h(PALAVRA_ZERAR) ?>">
          <p class="dica">
            Digitado, e não só clicado: caixa de confirmação se dispensa no reflexo,
            e esta não dá para dispensar sem ler.
          </p>
        </div>
        <div class="acoes">
          <button class="btn btn-risco" type="submit">Apagar o que está marcado</button>
          <a class="btn" href="/painel/">Voltar sem apagar</a>
        </div>
      </div>
    </form>
  </fieldset>

  <fieldset>
    <legend>O que NÃO é apagado</legend>
    <p class="dica" style="margin:0">
      O <strong>segredo do site</strong> (<code>dados/segredo.php</code>) fica. É dele que
      saem os links de convite do Dia 0, as referências da página de presença e o
      embaralhamento do teto de envio — apagá-lo invalidaria todos os convites que já
      circulam, e isso não é limpeza, é quebra. O <code>.htaccess</code> que fecha a pasta
      para a internet também fica, pela razão óbvia.
    </p>
  </fieldset>
</div>
<?php
fechar_pagina();
