<?php
declare(strict_types=1);

/**
 * Manutenção — felipesmoreira.com/painel/manutencao
 *
 * Duas ações, e as duas sobre o disco: **guardar** (o backup de /dados) e
 * **começar do zero**. A segunda existe porque a fase
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
require_once __DIR__ . '/backup-comum.php';
require_once __DIR__ . '/acoes-comum.php';
exigir_admin();

/* BAIXAR UM BACKUP. Vem antes de qualquer HTML: a resposta é o zip, e não uma
   página. `backup_por_nome()` é quem decide se o nome é de backup — o que vem
   na URL nunca vira caminho sem passar por ele. */
$baixar = (string) ($_GET['baixar'] ?? '');
if ($baixar !== '') {
    $caminho = backup_por_nome($baixar);
    if ($caminho === null) {
        http_response_code(404);
        exit;
    }
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $baixar . '"');
    header('Content-Length: ' . (string) filesize($caminho));
    header('Cache-Control: no-store, private');
    readfile($caminho);
    exit;
}

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
            'resumo' => 'A fila da Checagem, o quadro de produção, as peças e o mutirão de cada semana.',
            'arquivos' => [
                PASTA_DADOS . '/fatos.php',
                PASTA_DADOS . '/producao.php',
                PASTA_DADOS . '/kit.php',
                PASTA_DADOS . '/mutirao.php',
            ],
        ],
        'caixa' => [
            'nome'   => 'Caixa',
            'resumo' => 'Todo lançamento de dinheiro, dos dois caixas. Grupo próprio: dinheiro não se apaga por tabela.',
            'arquivos' => [
                PASTA_DADOS . '/caixa.php',
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
            'nome'   => 'Contadores, tentativas e sinais do site',
            'resumo' => 'Teto de envio por visitante, o registro de erro de senha e a contagem '
                . 'de aberturas do site. Some sozinho com o tempo; some junto por limpeza.',
            'arquivos' => [
                PASTA_DADOS . '/tentativas.php',
                PASTA_DADOS . '/tentativas.json',
                PASTA_DADOS . '/inscricoes-limite.php',
                PASTA_DADOS . '/sinais.php',
                PASTA_DADOS . '/erros.log',
                PASTA_DADOS . '/erros.1.log',
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

['erro' => $erro, 'ok' => $ok] = recado_pendente();

const PALAVRA_ZERAR = 'ZERAR TUDO';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!token_valido()) {
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    /* O BACKUP NÃO PEDE A PALAVRA: não apaga nada, e pedir "ZERAR TUDO" para
       guardar seria ensinar a digitá-la no reflexo. */
    if (($_POST['acao'] ?? '') === 'limpar-erros') {
        limpar_erros();
        avisar('ok', 'Registro de erros zerado.');
        ir_para('/painel/manutencao.php');
    }

    if (($_POST['acao'] ?? '') === 'backup') {
        $feito = fazer_backup();
        if ($feito === null) {
            avisar('erro', 'O backup não foi gravado. Confira se /dados tem alguma coisa e se /dados/backups aceita escrita.');
        } else {
            avisar('ok', 'Backup gravado: ' . basename($feito) . '. Baixe e guarde fora da hospedagem.');
        }
        ir_para('/painel/manutencao.php');
    }

    if (trim((string) ($_POST['confirmacao'] ?? '')) !== PALAVRA_ZERAR) {
        avisar('erro', 'Nada foi apagado: a confirmação tem que ser exatamente “' . PALAVRA_ZERAR . '”.');
        ir_para('/painel/manutencao.php');
    }

    $pedidos = is_array($_POST['grupos'] ?? null) ? $_POST['grupos'] : [];
    $grupos = grupos_de_dados();
    $apagados = 0;
    $zerouPessoas = false;

    /* O ZIP VEM ANTES DO UNLINK. Zerar existe para sair da fase de teste — e
       a palavra certa digitada na base errada, uma vez, é o cadastro inteiro
       indo embora sem cópia. Se o backup não gravar, nada é apagado: melhor
       uma base de teste que sobra do que uma base de verdade que some. Só há
       o que guardar se há arquivo; base vazia zera sem zip. */
    if ($pedidos !== [] && arquivos_para_backup() !== [] && fazer_backup() === null) {
        avisar('erro', 'Nada foi apagado: o backup de antes de zerar não foi gravado. Confira se /dados/backups aceita escrita.');
        ir_para('/painel/manutencao.php');
    }

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
        avisar('ok', $apagados . ' arquivo(s) apagado(s). O cadastro recomeça vazio — '
                . 'só a sua conta ficou, para o painel não voltar a aceitar que '
                . 'qualquer visitante crie um administrador.');
        ir_para('/painel/manutencao.php');
    }

    avisar('ok', $apagados === 0
            ? 'Não havia nada para apagar nos grupos marcados.'
            : $apagados . ' arquivo(s) apagado(s). O painel recomeça vazio nessas áreas.');
    ir_para('/painel/manutencao.php');
}

$grupos  = grupos_de_dados();
$backups = backups_existentes();

abrir_pagina('Manutenção');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Manutenção',
      'Guardar o que o painel gravou — ou apagar e recomeçar limpo.',
      ['url' => '/painel/conta.php', 'texto' => 'Minha conta'],
      null,
      [
          'O backup é um zip de /dados inteiro: cadastro, presenças, fatos, caixa, imagens. Fica na hospedagem, fechado para a web; baixe e guarde fora dela.',
          'Um cron pode gravar o backup todo dia chamando backup.php pela linha de comando. O botão aqui faz o mesmo na hora.',
          'Zerar serve para sair da fase de teste: apaga o que foi cadastrado para experimentar. Marque só os grupos que quer — cada um é independente.',
          'Zerar “Pessoas e contas” apaga os outros logins; só a sua conta fica, para o painel não voltar a aceitar que qualquer visitante crie um administrador.',
          'Zerar não tem desfazer. Faça o backup antes.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php $errosRecentes = erros_recentes(); ?>
  <fieldset id="erros">
    <legend>Erros dos últimos 7 dias<?= $errosRecentes !== [] ? ' (' . count($errosRecentes) . ')' : '' ?></legend>
    <?php if ($errosRecentes === []): ?>
      <p class="dica" style="margin:0">
        Nenhum. O que o PHP não conseguir fazer em produção fica registrado aqui —
        tipo, mensagem, arquivo e rota — em vez de sumir com o <code>display_errors</code> desligado.
      </p>
    <?php else: ?>
      <p class="dica" style="margin:0 0 10px">
        O que quebrou, para quem, onde. Resolvido, zere — o registro é para ler, não para guardar.
      </p>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Quando</th><th>Tipo</th><th>Mensagem</th><th>Onde</th><th>Rota</th></tr></thead>
          <tbody>
            <?php foreach ($errosRecentes as $r): ?>
              <tr>
                <td data-rotulo="Quando"><?= h(date('d/m H:i', (int) strtotime($r['quando']))) ?></td>
                <td data-rotulo="Tipo"><span class="selo <?= $r['tipo'] === 'fatal' ? 'selo-off' : 'selo-cinza' ?>"><?= h($r['tipo']) ?></span></td>
                <td data-rotulo="Mensagem"><?= h($r['msg']) ?></td>
                <td data-rotulo="Onde"><code><?= h($r['onde']) ?></code></td>
                <td data-rotulo="Rota" class="tarde"><?= h($r['rota']) ?><?= $r['uid'] !== '' ? ' · ' . h($r['uid']) : '' ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <form method="post" class="acoes" style="margin-top:12px">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="acao" value="limpar-erros">
        <button class="btn btn-mini" type="submit">Zerar o registro</button>
      </form>
    <?php endif; ?>
  </fieldset>

  <fieldset id="backup">
    <legend>Backup<?= $backups !== [] ? ' (' . count($backups) . ')' : '' ?></legend>
    <form method="post" class="acoes" style="margin:0 0 14px">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="backup">
      <button class="btn btn-ouro" type="submit">Fazer backup agora</button>
    </form>
    <?php if ($backups === []): ?>
      <p class="dica" style="margin:0">
        Nenhum backup ainda. Para o cron da hospedagem, todo dia às 3h:
        <code>0 3 * * * php <?= h(realpath(__DIR__) ?: __DIR__) ?>/backup.php</code>
      </p>
    <?php else: ?>
      <?php
        /* A IDADE DO ÚLTIMO, em destaque. O cron pode parar em silêncio — a
           hospedagem muda de plano, o PHP muda de caminho — e o dia em que
           alguém descobre é o dia em que precisa do zip. Mais de 36 h é
           vermelho: o cron é diário, então 36 h é uma noite perdida. */
        $ultimo = $backups[0];
        $horas = (int) floor((time() - $ultimo['quando']) / 3600);
        $atrasado = $horas > HORAS_SEM_BACKUP;
      ?>
      <p class="<?= $atrasado ? 'msg msg-erro' : 'dica' ?>" style="margin:0 0 10px">
        <strong>Último backup:</strong> <?= h(date('d/m/Y H:i', $ultimo['quando'])) ?>
        (<?= $horas < 1 ? 'agora há pouco' : 'há ' . $horas . ' h' ?>).
        <?php if ($atrasado): ?>
          O cron não rodou esta noite — confira a tarefa no hPanel, ou faça o backup agora.
        <?php endif; ?>
      </p>
      <p class="dica" style="margin:0 0 10px">
        Os <?= MAX_BACKUPS_DADOS ?> mais recentes ficam; o resto vai embora sozinho.
        Cron: <code>0 3 * * * php <?= h(realpath(__DIR__) ?: __DIR__) ?>/backup.php</code>
      </p>
      <ul class="lista-backups">
        <?php foreach ($backups as $b): ?>
          <li>
            <a href="/painel/manutencao.php?baixar=<?= h($b['nome']) ?>"><?= h($b['nome']) ?></a>
            <span class="dica"><?= h(date('d/m/Y H:i', $b['quando'])) ?> · <?= h(tamanho_legivel($b['bytes'])) ?></span>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </fieldset>

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
          <strong>Isto não tem desfazer.</strong> Se quiser guardar o que existe,
          faça o backup acima e baixe o zip antes de apertar.
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
      para a internet também fica, pela razão óbvia. E os <strong>backups</strong> ficam:
      zerar apaga o que está em uso, não a cópia do que estava.
    </p>
  </fieldset>
</div>
<?php
fechar_pagina();
