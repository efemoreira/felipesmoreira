<?php
declare(strict_types=1);

/**
 * A LISTA de pessoas — quem existe no movimento, recortado e ordenado.
 *
 * A ordem padrão é A-Z: numa lista de gente a pergunta quase sempre é "cadê o
 * Fulano", e para isso o alfabeto é a única ordem que não obriga a ler tudo.
 * "Quem chegou por último" existe para a outra pergunta.
 *
 * O LOGIN APARECE NA COLUNA, monoespaçado. A busca já casava por login sem
 * nunca mostrá-lo: dava para achar, não dava para ditar — e a pergunta que traz
 * alguém a esta tela é "qual é o login do Fulano?", feita no grupo por quem
 * esqueceu o dele.
 */

require_once __DIR__ . '/eventos-comum.php';  // o modelo do encontro e da presença
require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao()
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_abas(), abrir_modal() — a moldura
require_once __DIR__ . '/pessoas-comum.php';  // duplicatas e a fila de entrada
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo
require_once __DIR__ . '/pessoas-ficha.php';

/**
 * Desenha a tela inteira: cabeçalho, abas por tipo, duplicatas, a ficha aberta,
 * a lista e os dois modais.
 *
 * O RECORTE É CALCULADO AQUI, e não recebido pronto da rota. A busca, o filtro
 * por tipo, o de cidade e a ordem existem só para virar estas linhas — e o
 * contador de cada aba tem de concordar com o que a lista lista. Quem separa os
 * dois é quem faz os dois discordarem, e a assinatura teria catorze argumentos.
 *
 * `$erro`, `$ok` e `$senhaNova` são o que vem de fora: nascem do recado que a
 * ação anterior guardou na sessão, que é assunto da rota.
 */
function tela_de_pessoas(?string $erro, ?string $ok, ?array $senhaNova): void
{
    /* A ficha aberta (`?p=`) e o formulário aberto (`?editar=`) são coisas
       diferentes: dá para ler a ficha de alguém sem estar editando, e é o normal.
       Um parâmetro só faria toda visita à ficha abrir o modal por cima dela. */
    $aberta  = achar_pessoa(limpar_texto($_GET['p'] ?? '', 40));
    $editando = achar_pessoa(limpar_texto($_GET['editar'] ?? '', 40));
    $busca   = limpar_texto($_GET['q'] ?? '', 60);
    $filtro  = limpar_texto($_GET['tipo'] ?? '', 20);
    if (!isset(TIPOS_PESSOA[$filtro])) {
        $filtro = '';
    }
    $cidadeF = cidade_valida($_GET['cidade'] ?? '');
    /* A-Z é o padrão: numa lista de gente a pergunta quase sempre é "cadê o
       Fulano", e para isso a ordem alfabética é a única que não obriga a ler tudo.
       "Mais recentes" existe para a outra pergunta — quem chegou esta semana. */
    $ordem = in_array($_GET['ordem'] ?? '', ['recente', 'cidade'], true) ? (string) $_GET['ordem'] : 'nome';

    $todas = ler_pessoas();
    if ($busca !== '') {
        /* Casa por nome, login, e-mail, cidade e bairro — e por telefone, que é o
           único que não é texto: dígito casa com dígito, senão "(85) 9" não acharia
           "85 9". Quem procura tem na mão um desses e nunca sabe qual foi gravado.

           O e-mail entrou junto com o login por e-mail: se é por ele que a pessoa
           entra, é por ele que a coordenação vai procurá-la quando ela disser "não
           consigo entrar com o meu e-mail". */
        $digitos = so_digitos($busca);
        $todas = array_values(array_filter($todas, function ($p) use ($busca, $digitos) {
            if (combina_com([$p['nome'], $p['usuario'], $p['email'], $p['cidade'], $p['bairro']], $busca)) {
                return true;
            }
            return $digitos !== '' && $p['telefone'] !== '' && str_contains($p['telefone'], $digitos);
        }));
    }
    if ($filtro !== '') {
        $todas = array_values(array_filter($todas, fn ($p) => $p['tipo'] === $filtro));
    }
    if ($cidadeF !== '') {
        $todas = array_values(array_filter($todas, fn ($p) => $p['cidade'] === $cidadeF));
    }
    usort($todas, fn ($a, $b) => match ($ordem) {
        /* `criadoEm` é ISO, então comparar como texto já ordena por tempo — e quem
           não tem data (ficha vinda de importação) cai para o fim, que é onde ela
           de fato pertence numa lista de "quem chegou agora". */
        'recente' => strcmp((string) $b['criadoEm'], (string) $a['criadoEm']),
        'cidade'  => [sem_acento($a['cidade']), sem_acento($a['bairro']), sem_acento($a['nome'])]
                     <=> [sem_acento($b['cidade']), sem_acento($b['bairro']), sem_acento($b['nome'])],
        default   => strcmp(sem_acento($a['nome']), sem_acento($b['nome'])),
    });

    $duplicatas = duplicatas_de_pessoas();
    $porTipo = [];
    $cidadesUsadas = [];
    foreach (ler_pessoas() as $p) {
        $porTipo[$p['tipo']] = ($porTipo[$p['tipo']] ?? 0) + 1;
        if ($p['cidade'] !== '') {
            $cidadesUsadas[$p['cidade']] = ($cidadesUsadas[$p['cidade']] ?? 0) + 1;
        }
    }
    /* O filtro de cidade lista só as cidades que TÊM gente. Oferecer os 184
       municípios num filtro é oferecer 180 recortes que devolvem lista vazia. */
    uksort($cidadesUsadas, fn ($a, $b) => strcmp(sem_acento($a), sem_acento($b)));

    $catalogo = catalogo_funcoes()['funcoes'];   // 'lista' não existe: a chave é 'funcoes'

abrir_pagina('Pessoas');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Pessoas',
      'Todo mundo do movimento numa lista só — quem tem conta, quem se inscreveu, '
      . 'quem apareceu num encontro e quem é candidato.',
      null,
      null,
      [
          'A ficha mostra o que a pessoa é, o que faz, o que abre no painel e em que encontros esteve.',
          'Capacidade é o jeito normal de dar acesso; as áreas embaixo são para a exceção.',
          'Dar conta cria o login e mostra a senha provisória uma vez.',
          'Duplicatas são sugestão, nunca fusão automática — juntar a ficha errada não tem desfazer.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php if ($senhaNova !== null): ?>
    <div class="msg msg-ok">
      <p style="margin:0 0 8px">
        <strong>Login:</strong> <span class="provisoria"><?= h($senhaNova['usuario']) ?></span>
        &nbsp; <strong>Senha provisória:</strong> <span class="provisoria"><?= h($senhaNova['senha']) ?></span>
      </p>
      <p class="dica" style="margin:0">
        Aparece <strong>uma vez só</strong> — só o hash fica guardado, e hash não volta
        a ser senha. Mande agora; no primeiro acesso a pessoa é obrigada a trocar.
      </p>
    </div>
  <?php endif; ?>

  <?php /* O recorte por tipo é ABA, e não um <select> no meio do filtro: é a
           pergunta que se faz toda vez ("cadê os militantes?"), e pergunta que se
           faz toda vez merece estar sempre visível, com o número do lado. */ ?>
  <?php
  $abasTipo = ['' => ['nome' => 'Todas', 'conta' => count(ler_pessoas())]];
  foreach (TIPOS_PESSOA as $chave => $rotulo) {
      $abasTipo[$chave] = ['nome' => $rotulo, 'conta' => $porTipo[$chave] ?? 0];
  }
  barra_abas($abasTipo, $filtro, 'tipo', 'Tipo de pessoa');
  ?>

  <?php bloco_duplicatas($duplicatas); ?>

  <?php if ($aberta !== null) { bloco_ficha($aberta); } ?>
  <?php /* ============ a lista ============ */ ?>
  <fieldset id="lista">
    <legend>
      <?= $filtro === '' ? 'Todas' : h(TIPOS_PESSOA[$filtro]) ?>
      (<?= count($todas) ?><?= $busca !== '' || $filtro !== '' || $cidadeF !== '' ? ' de ' . count(ler_pessoas()) : '' ?>)
    </legend>

    <div class="acoes" style="margin:0 0 18px">
      <?php botao_modal('nova-pessoa', 'Cadastrar pessoa', 'novo=1' . ($filtro !== '' ? '&tipo=' . urlencode($filtro) : '')); ?>
    </div>

    <?php /* O recorte por TIPO é aba, lá em cima — é a pergunta que se faz toda
             vez. Aqui ficam as três que se fazem de vez em quando; e elas só
             aparecem quando a lista é grande o bastante para não caber na tela. */ ?>
    <?php if (count(ler_pessoas()) > 8 || $busca !== '' || $cidadeF !== ''): ?>
      <?php
        /* Só as cidades que TÊM gente: oferecer os 184 municípios num filtro é
           oferecer 180 recortes que devolvem lista vazia. */
        $opcoesCidade = [];
        foreach ($cidadesUsadas as $nome => $quantos) {
            $opcoesCidade[$nome] = $nome . ' (' . (int) $quantos . ')';
        }
        /* A ordem padrão de gente é A-Z: a pergunta quase sempre é "cadê o
           Fulano", e não "quem chegou por último". */
        barra_filtros(
            [
                ['tipo' => 'busca', 'valor' => $busca, 'dica' => 'nome, telefone, login ou e-mail'],
                ['tipo' => 'escolha', 'nome' => 'cidade', 'rotulo' => 'Cidade',
                 'valor' => $cidadeF, 'vazio' => 'todas', 'opcoes' => $opcoesCidade],
                ['tipo' => 'escolha', 'nome' => 'ordem', 'rotulo' => 'Ordenar por',
                 'valor' => $ordem, 'opcoes' => [
                     'nome'    => 'nome (A–Z)',
                     'recente' => 'quem chegou por último',
                     'cidade'  => 'cidade e bairro',
                 ]],
            ],
            $busca !== '' || $cidadeF !== '' || $ordem !== 'nome',
            '/painel/pessoas.php' . ($filtro !== '' ? '?tipo=' . urlencode($filtro) : ''),
            $filtro !== '' ? ['tipo' => $filtro] : []
        );
      ?>
    <?php endif; ?>

    <?php if ($todas === []): ?>
      <?php nada_encontrado(
          $busca,
          '/painel/pessoas.php' . ($filtro !== '' ? '?tipo=' . urlencode($filtro) : ''),
          'Ninguém com esse recorte.'
      ); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead><tr><th>Quem</th><th>Tipo</th><th>Faz</th><th>Painel</th><th>Encontros</th><th></th></tr></thead>
          <tbody>
            <?php foreach ($todas as $p): ?>
              <tr>
                <td>
                  <strong><?= h($p['nome']) ?></strong><br>
                  <span class="dica">
                    <?php if ($p['telefone'] !== ''): ?>
                      <a href="https://wa.me/55<?= h($p['telefone']) ?>" target="_blank" rel="noopener"><?= h(telefone_bonito($p['telefone'])) ?></a>
                    <?php endif; ?>
                    <?php $onde = trim($p['bairro'] . ($p['cidade'] !== '' ? ', ' . $p['cidade'] : ''), ', '); ?>
                    <?= $onde !== '' ? ' · ' . h($onde) : '' ?>
                  </span>
                </td>
                <?php /* No cartão o tipo e o número de encontros sobem lado a lado, e
                         o resto desce: quem procura alguém na lista procura por
                         "é apoiador?" e "já apareceu?" — o login e as funções são
                         a segunda pergunta. */ ?>
                <td class="meia" data-rotulo="Tipo"><span class="selo"><?= h(TIPOS_PESSOA[$p['tipo']]) ?></span></td>
                <td class="tarde" data-rotulo="Faz">
                  <?php foreach ($p['funcoes'] as $f): ?>
                    <span class="selo selo-cinza"><?= h(nome_funcao($f)) ?></span>
                  <?php endforeach; ?>
                </td>
                <td class="tarde" data-rotulo="Painel">
                  <?php if (tem_conta($p)): ?>
                    <?php /* O LOGIN vem primeiro, e o que a pessoa abre vem embaixo.
                             A pergunta que traz alguém a esta coluna é "qual é o login
                             do Fulano?" — quem esqueceu o dele pergunta no grupo, e
                             quem responde não deveria ter que abrir a ficha para ler
                             uma palavra. A busca já casava por login sem nunca
                             mostrá-lo: dava para achar, não dava para ditar. */ ?>
                    <strong class="login"><?= h($p['usuario']) ?></strong><br>
                    <span class="selo <?= $p['ativo'] ? 'selo-ok' : 'selo-off' ?>"><?= h(rotulo_do_acesso($p)) ?></span>
                  <?php else: ?>
                    <span class="dica">—</span>
                  <?php endif; ?>
                </td>
                <td class="meia" data-rotulo="Encontros"><?= count(encontros_da_pessoa($p['id'])) ?: '—' ?></td>
                <td class="tarde">
                  <div class="acoes-celula">
                    <a class="btn btn-mini" href="?p=<?= h($p['id']) ?>#ficha">Abrir</a>
                    <a class="btn btn-mini" data-modal="editar-pessoa" href="?editar=<?= h($p['id']) ?>">Editar</a>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>

  <?php /* ============ os modais ============
           No fim do documento, e não dentro do <fieldset>: <dialog> aninhado em
           formulário ou tabela é HTML inválido, e o navegador reorganiza a árvore
           sozinho — o formulário some sem um erro sequer no console. */ ?>
  <?php abrir_modal('nova-pessoa', 'Cadastrar pessoa', isset($_GET['novo'])); ?>
    <?php formulario_pessoa(null, $catalogo); ?>
  <?php fechar_modal(); ?>

  <?php if ($editando !== null): ?>
    <?php abrir_modal('editar-pessoa', 'Editar ' . $editando['nome'], true); ?>
      <?php formulario_pessoa($editando, $catalogo); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
    fechar_pagina();
}
