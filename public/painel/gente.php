<?php
declare(strict_types=1);

/**
 * Sua gente — felipesmoreira.com/painel/gente
 *
 * A mesa de quem acompanha um punhado de pessoas. Nasceu como um cartão no
 * Início e virou tela quando a pergunta deixou de ser "quem é a minha gente?"
 * e passou a ser "quem da minha gente esfriou, quem não começou a estudar,
 * quem não confirmou o encontro?" — três recortes que não cabem num cartão de
 * três linhas.
 *
 * TELA PESSOAL, E NÃO ÁREA. A porta é `pode_liderar()` (`lideranca`,
 * `coordenacao` ou `adm`), como a Conta é `exigir_login()`: não há chave em
 * `AREAS`, não há grupo no menu, não há permissão a marcar. A capacidade
 * `lideranca` continua não abrindo tela de área nenhuma — o que ela abre é o
 * recorte da própria gente, e só ele.
 *
 * O RECORTE É SEMPRE DE QUEM ESTÁ LOGADO. `minha_gente()` não aceita parâmetro
 * que amplie a lista, e esta tela não inventa um: `pessoas` continua sendo a
 * única porta para a agenda inteira, e ela é `adm`. Aqui aparece nome,
 * WhatsApp e o estado de cada pessoa — e-mail, endereço e ficha ficam lá.
 *
 * O MOTIVO DE "ESFRIOU" SAI DA RÉGUA DA REATIVAÇÃO, e não de uma nova: duas
 * contas de quem esfriou divergiriam na primeira mudança de prazo, e quem
 * lidera veria um recado diferente do da coordenação sobre a mesma pessoa.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/pessoas-comum.php';   // pode_liderar(), minha_gente()
require_once __DIR__ . '/reativacao.php';      // motivo_de_reativacao(), MOTIVOS_REATIVACAO
require_once __DIR__ . '/eventos-comum.php';   // eventos_proximos(), presenca_de()
require_once __DIR__ . '/aulas-comum.php';     // retrato_de_estudo(), ESTADOS_DE_ESTUDO
require_once __DIR__ . '/atividade-comum.php'; // ha_quanto_tempo()

exigir_login();
$eu = usuario_atual();
if ($eu === null || !pode_liderar($eu)) {
    header('Location: /painel/?negado=gente', true, 302);
    exit;
}

/* O próximo encontro, para dizer quem já confirmou e quem ainda não. Um só:
   a pergunta da líder é "quem levo sábado?", e não a agenda do trimestre. */
$proximo = eventos_proximos()[0] ?? null;

/* Cada pessoa com o que a líder precisa saber para mandar UMA mensagem certa. */
$gente = [];
foreach (minha_gente($eu) as $p) {
    $motivo  = motivo_de_reativacao($p);
    $estudo  = tem_conta($p) ? retrato_de_estudo($p['id']) : null;
    $presenca = $proximo !== null ? presenca_de($proximo['id'], $p['id']) : null;

    $gente[] = [
        'pessoa'    => $p,
        'motivo'    => $motivo,
        'estudo'    => $estudo,
        /* null = não há próximo encontro; false = não confirmou; true = confirmou */
        'confirmou' => $proximo === null ? null : ($presenca !== null && $presenca['confirmou']),
    ];
}

$esfriando  = array_values(array_filter($gente, fn ($g) => $g['motivo'] !== null));
$semEstudar = array_values(array_filter($gente, fn ($g) => $g['estudo'] !== null && $g['estudo']['estado'] === 'sem-comecar'));

$abas = [
    ''           => ['nome' => 'Todas',       'conta' => count($gente)],
    'esfriando'  => ['nome' => 'Esfriando',   'conta' => count($esfriando)],
    'sem-estudar' => ['nome' => 'Sem estudar', 'conta' => count($semEstudar)],
];
$tipo = (string) ($_GET['tipo'] ?? '');
if (!isset($abas[$tipo])) {
    $tipo = '';
}
$lista = $tipo === 'esfriando' ? $esfriando : ($tipo === 'sem-estudar' ? $semEstudar : $gente);

/* O convite do sub-grupo: o link é o da ficha da líder, e o texto é o mesmo
   que a mensagem de acesso manda — para quem chega ler a mesma coisa nas duas
   pontas. Sem link gravado, a tela diz a quem pedir; não inventa o geral, que
   é justamente o grupo grande de onde se quer tirar a pessoa. */
$meuGrupo = (string) ($eu['grupo'] ?? '');
$textoConvite = $meuGrupo !== ''
    ? 'Oi! Sou ' . primeiro_nome($eu['nome']) . ', da Missão Ceará, e vou te acompanhar por aqui. '
      . 'Entra no nosso grupo, que é pequeno e é onde a gente se fala: ' . $meuGrupo
    : '';

abrir_pagina('Sua gente');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Sua gente',
      $gente === []
          ? 'Ninguém está sob o seu acompanhamento ainda.'
          : count($gente) . ' ' . (count($gente) === 1 ? 'pessoa' : 'pessoas')
            . ($esfriando !== [] ? ' · ' . count($esfriando) . ' esfriando' : ' · todas em dia'),
      null,
      null,
      [
          'Quem aparece aqui tem você como líder na ficha. A coordenação é quem aponta.',
          'Esfriando é a mesma régua da reativação: confirmou e faltou, nunca entrou, parou de estudar ou sumiu. O selo diz o que dizer.',
          'Sem estudar é quem tem conta e não abriu nenhuma aula — a primeira mensagem é o link do Dia 0, não “estuda aí”.',
          'Nome e WhatsApp, e mais nada: e-mail, endereço e a ficha inteira continuam em Pessoas, que é da administração.',
      ]
  ); ?>

  <?php if ($gente === []): ?>
    <p class="vazio-bom">
      Quando a coordenação apontar alguém para você acompanhar, a pessoa aparece aqui —
      e você passa a ser o primeiro nome que ela vê no Início dela.
    </p>
  <?php else: ?>

    <?php barra_abas($abas, $tipo, 'tipo', 'Recorte da sua gente'); ?>

    <?php if ($lista === []): ?>
      <p class="vazio-bom">
        <?= $tipo === 'esfriando' ? 'Ninguém esfriando. É esse o objetivo.' : 'Todo mundo já começou a estudar.' ?>
      </p>
    <?php else: ?>
      <ul class="gente-cartoes">
        <?php foreach ($lista as $g): ?>
          <?php $p = $g['pessoa']; ?>
          <li class="gente-cartao">
            <div class="gente-cabeca">
              <strong><?= h($p['nome']) ?></strong>
              <?php if ($g['motivo'] !== null): ?>
                <span class="selo selo-atencao"><?= h(MOTIVOS_REATIVACAO[$g['motivo']['chave']]['nome']) ?></span>
              <?php elseif ($g['estudo'] !== null && $g['estudo']['estado'] === 'sem-comecar'): ?>
                <span class="selo selo-atencao">Sem estudar</span>
              <?php else: ?>
                <span class="selo selo-publicado">Em dia</span>
              <?php endif; ?>
            </div>

            <p class="gente-estado">
              <?php if (!tem_conta($p)): ?>
                Sem conta no painel
              <?php elseif (($p['ultimoAcesso'] ?? '') === ''): ?>
                Nunca entrou no painel
              <?php else: ?>
                Entrou <?= h(ha_quanto_tempo($p['ultimoAcesso'])) ?>
              <?php endif; ?>
              <?php if ($g['estudo'] !== null): ?>
                · Pistas Rápidas <?= (int) $g['estudo']['rapidasFeitas'] ?> de <?= (int) $g['estudo']['rapidas'] ?>
              <?php endif; ?>
              <?php if ($proximo !== null): ?>
                · <?= $g['confirmou'] ? 'confirmou' : 'não confirmou' ?> <?= h(apelido_curto($proximo['titulo'])) ?>
              <?php endif; ?>
            </p>

            <?php if ($g['motivo'] !== null): ?>
              <p class="dica gente-dizer"><?= h(MOTIVOS_REATIVACAO[$g['motivo']['chave']]['oQue']) ?></p>
            <?php endif; ?>

            <?php if ($p['telefone'] !== ''): ?>
              <div class="acoes">
                <?php links_whatsapp($p['telefone'], 'Chamar no WhatsApp', '', 'btn btn-mini'); ?>
              </div>
            <?php endif; ?>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>

  <?php endif; ?>

  <fieldset id="convite" style="margin-top:28px">
    <legend>O convite do seu grupo</legend>
    <?php if ($meuGrupo === ''): ?>
      <p class="dica" style="margin:0">
        A sua ficha ainda não tem o link do grupo. Peça à administração para gravar em
        Pessoas — enquanto não houver, quem você acompanha recebe o convite do grupo geral.
      </p>
    <?php else: ?>
      <p class="dica" style="margin:0 0 10px">
        É o que quem chega recebe no Início e na mensagem de acesso. Mande você mesma, pelo
        nome: é isso que faz alguém entrar num grupo e se sentir parte.
      </p>
      <p><a href="<?= h($meuGrupo) ?>" target="_blank" rel="noopener"><?= h($meuGrupo) ?></a></p>
      <div class="acoes">
        <button class="btn btn-ouro" type="button" data-copiar="<?= h($textoConvite) ?>">Copiar o convite</button>
      </div>
    <?php endif; ?>
  </fieldset>
</div>
<?php
fechar_pagina();
