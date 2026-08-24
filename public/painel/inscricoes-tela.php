<?php
declare(strict_types=1);

/**
 * A tela de `/painel/inscricoes` — cabeçalho, panorama, abas e busca.
 *
 * Quem desenha a tela também calcula o recorte dela: a busca só existe para
 * virar aquelas linhas, e **o contador da aba tem de concordar com o que a
 * lista lista**. Separar os dois é como os dois passam a discordar.
 *
 * A busca recorta as DUAS abas antes de uma ser desenhada. A pergunta que traz
 * alguém aqui com um nome na mão é "essa pessoa já foi decidida?", e ela se
 * responde olhando o número das duas ao mesmo tempo — se só a aba aberta fosse
 * filtrada, o contador da outra diria quantas existem, e não quantas casam.
 *
 * O que atravessa a fronteira é só o que nasce fora: o recado e a senha
 * provisória, que vêm da sessão onde a ação anterior os deixou.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/inscricoes-comum.php';
require_once __DIR__ . '/pessoas-comum.php';       // fila_de_entrada()
require_once __DIR__ . '/inscricoes-fila.php';
require_once __DIR__ . '/inscricoes-decididas.php';
require_once __DIR__ . '/inscricoes-origens.php';

/**
 * Desenha a tela inteira.
 *
 * @param ?string $erro   o recado de erro guardado pela ação anterior
 * @param ?string $ok     o recado de sucesso
 * @param ?array  $acesso o acesso recém-criado — aparece UMA vez e some
 */
function tela_de_inscricoes(?string $erro, ?string $ok, ?array $acesso): void
{
    /* O RECADO E A SENHA CHEGAM PRONTOS, e não são relidos da sessão aqui: a
       rota já os tirou de lá. Reler seria pegá-los depois do `unset()` — os
       dois viriam nulos, o desenho seguiria em frente sem reclamar, e o que
       sumiria da tela é justamente a senha provisória que aparece uma vez só. */

    $todas = ler_pessoas();
    $novas = fila_de_entrada();
    $decididas = array_values(array_filter($todas, fn ($i) => in_array($i['status'], ['aprovada', 'recusada'], true)));
    $quantasTem = count($novas) + count($decididas);

    /* Recorta as DUAS abas antes de qualquer uma ser desenhada: a pergunta que
       traz alguém aqui com um nome na mão é "essa pessoa já foi decidida?", e ela
       se responde olhando o número das duas ao mesmo tempo. */
    $buscaIn = limpar_texto($_GET['q'] ?? '', 60);
    if ($buscaIn !== '') {
        $recorteIn = fn (array $i) => combina_com(
            [$i['nome'], $i['cidade'], $i['bairro'], $i['email'], $i['origem'], $i['telefone']],
            $buscaIn
        ) || ($i['telefone'] !== '' && str_contains($i['telefone'], so_digitos($buscaIn)) && so_digitos($buscaIn) !== '');
        $novas = array_values(array_filter($novas, $recorteIn));
        $decididas = array_values(array_filter($decididas, $recorteIn));
    }

    // mais recentes primeiro
    /* `fila_de_entrada()` já ordena do mais antigo para o mais novo, que é o
       certo: quem esperou mais é quem está mais perto de desistir. */
    usort($decididas, fn ($a, $b) => strcmp($b['decididoEm'], $a['decididoEm']));

    $formatar = function (string $iso): string {
        if ($iso === '') {
            return '';
        }
        $t = strtotime($iso);
        return $t ? date('d/m/Y \à\s H:i', $t) : '';
    };

    abrir_pagina('Inscrições');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Inscrições da militância',
      'Quem preencheu o formulário em <a href="/queroajudar" target="_blank">/queroajudar</a>. '
      . 'Aprovar cria o acesso e mostra a senha para você mandar no WhatsApp.',
      null,
      null,
      [
          'Aprovar: cria a conta, marca as áreas sugeridas e mostra a senha provisória UMA vez.',
          'O botão do WhatsApp já abre a conversa da pessoa com a mensagem pronta.',
          'Ela foi orientada a mandar um oi antes: procure a conversa que já existe e RESPONDA nela — iniciar dezenas de conversas novas é o que derruba o número da coordenação.',
          'Quem não escolheu função entra como “Onde precisar” — combine na conversa.',
          'Fila parada há mais de 48h aparece como urgente no Início: é onde mais se perde gente.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php if ($acesso !== null): ?>
    <?php
      $msg = "Olá, {$acesso['nome']}! Aqui é da Missão Ceará.\n\n"
           . "Sua inscrição foi aprovada! Seu acesso:\n\n"
           . "Site: https://felipesmoreira.com/painel/\n"
           . "Usuário: {$acesso['usuario']}\n"
           . "Senha provisória: {$acesso['senha']}\n\n"
           . "No primeiro acesso o site vai pedir para você criar sua própria senha.\n\n"
           . "Qualquer dúvida, é só chamar aqui. Bem-vindo(a)!";
    ?>
    <div class="msg msg-ok">
      <p style="margin:0 0 10px"><strong>Acesso criado.</strong> Mande agora — a senha não aparece de novo.</p>
      <p class="dica" style="margin:0 0 10px">
        Se ela já mandou o oi, o botão abre a conversa que existe e a mensagem entra como
        <strong>resposta</strong>. É essa diferença que mantém o número da coordenação de pé:
        o WhatsApp bloqueia quem inicia muitas conversas com quem nunca falou com ele.
      </p>
      <div class="provisoria">
        usuário: <?= h($acesso['usuario']) ?><br>
        senha: <?= h($acesso['senha']) ?>
      </div>
      <div class="acoes" style="margin-top:14px">
        <?php links_whatsapp($acesso['telefone'], 'Abrir WhatsApp com a mensagem pronta', $msg, 'btn btn-ouro'); ?>
      </div>
    </div>
  <?php endif; ?>

  <?php $regioes = militancia_por_regiao($todas); ?>
  <?php if ($regioes !== []): ?>
    <details class="decidir" style="margin-bottom:22px">
      <summary class="btn">Onde a militância mora (<?= count($regioes) ?>)</summary>
      <div class="decidir-corpo">
        <p class="dica" style="margin:0 0 12px">
          Só quem já foi aprovado. É por aqui que dá pra ver onde já tem gente para um time
          próprio — e quem está sozinho na cidade dele.
        </p>
        <?php /* Esta era a única tabela do painel sem `.rolagem`: numa tela
                 estreita ela não ganhava barra, ela EMPURRAVA a página para o
                 lado. */ ?>
        <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Cidade</th><th>Gente</th><th>Bairros</th></tr>
          </thead>
          <tbody>
            <?php foreach ($regioes as $r): ?>
              <tr>
                <td class="meia" data-rotulo="Cidade"><strong><?= h($r['cidade']) ?></strong></td>
                <td class="meia" data-rotulo="Gente"><?= (int) $r['total'] ?></td>
                <td data-rotulo="Bairros">
                  <?php if ($r['bairros'] === []): ?>
                    <span class="selo selo-cinza">sem bairro informado</span>
                  <?php else: ?>
                    <?php foreach ($r['bairros'] as $b): ?>
                      <span class="selo"><?= h($b['nome']) ?> · <?= (int) $b['total'] ?></span>
                    <?php endforeach; ?>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        </div>
      </div>
    </details>
  <?php endif; ?>

  <?php
  /* A fila é o trabalho; as decididas são o arquivo. Empilhadas, o arquivo
     cresce para sempre e a fila — que é o que alguém veio fazer aqui — some
     para baixo. A aba abre na fila, sempre. */
  $origens = funil_de_origens($todas);
  $pedida = (string) ($_GET['aba'] ?? '');
  $abaIn = 'fila';
  if ($pedida === 'decididas' && $decididas !== []) {
      $abaIn = 'decididas';
  } elseif ($pedida === 'origens') {
      $abaIn = 'origens';
  }
  barra_abas([
      'fila'      => ['nome' => 'Esperando decisão', 'conta' => count($novas)],
      'decididas' => ['nome' => 'Já decididas',      'conta' => count($decididas)],
      /* O contador desta é o número de ORIGENS, e não de pessoas: a pergunta da
         aba é "por quantos caminhos a militância está chegando". */
      'origens'   => ['nome' => 'De onde vêm',       'conta' => count($origens['linhas'])],
  ], $abaIn, 'aba', 'Inscrições');
  ?>

  <?php /* A busca some no relatório: ele é sobre a base inteira, e uma tabela de
           conversão que muda conforme o que alguém digitou não é um relatório. */ ?>
  <?php if ($abaIn !== 'origens' && ($quantasTem > 6 || $buscaIn !== '')): ?>
    <?php barra_busca($buscaIn, 'nome, telefone, cidade ou quem trouxe', ['aba' => $abaIn]); ?>
  <?php endif; ?>

  <?php
  /* O recuo de dois espaços antes do `<?php` NÃO é estilo: ele é TEXTO, sai no
     HTML, e é o que punha o `<fieldset>` na coluna certa quando as duas abas
     moravam neste arquivo. Mexer nele muda o markup sem mudar nada visível. */
  if ($abaIn === 'fila') {
      aba_da_fila($novas, $buscaIn, $formatar);
  } elseif ($abaIn === 'decididas') {
      aba_das_decididas($decididas, $buscaIn, $formatar);
  } else {
      aba_das_origens($origens, $formatar);
  }
  ?>

  <div class="acoes">
    <a class="btn btn-mini" href="/painel/">Voltar ao início</a>
  </div>
</div>
<?php
    fechar_pagina();
}
