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
require_once __DIR__ . '/pessoas-reativar.php';  // bloco_reativacao() — o recorte por estado
require_once __DIR__ . '/reativacao.php';  // a régua de quem esfriou
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
    $catalogo = catalogo_funcoes()['funcoes'];   // 'lista' não existe: a chave é 'funcoes'

    /* A FICHA É OUTRA TELA. `?p=` desenha a pessoa sozinha, com abas; a lista
       não vem junto. Ver `tela_da_ficha()` em pessoas-ficha.php. */
    if ($aberta !== null) {
        tela_da_ficha($aberta, $editando, $erro, $ok, $senhaNova, $catalogo);
        return;
    }
    /* O recorte — busca, tipo, cidade, rede, líder, ordem — é UMA função,
       `recorte_de_pessoas()`, e o CSV de Exportar usa a mesma: o que a
       coordenação vê filtrado é o que ela leva na planilha. */
    ['pessoas' => $todas, 'busca' => $busca, 'filtro' => $filtro, 'cidade' => $cidadeF,
     'rede' => $redeF, 'lider' => $liderF, 'ordem' => $ordem] = recorte_de_pessoas($_GET);

    /* Só líderes que de fato têm gente, mais o recorte de quem não tem ninguém.
       Oferecer todos os possíveis encheria o filtro de becos com zero linhas. */
    /* Só redes que têm gente: oferecer as sete sempre encheria o filtro de
       becos com zero linhas. */
    $opcoesRede = [];
    foreach (ler_pessoas() as $p) {
        foreach ($p['redes'] as $r) {
            $opcoesRede[$r] = REDES[$r]['nome'] ?? $r;
        }
    }
    asort($opcoesRede);

    $opcoesLider = [];
    $semLider = 0;
    foreach (ler_pessoas() as $p) {
        if ($p['lider'] === '') {
            $semLider++;
            continue;
        }
        if (!isset($opcoesLider[$p['lider']]) && ($l = achar_pessoa($p['lider'])) !== null) {
            $opcoesLider[$p['lider']] = $l['nome'];
        }
    }
    asort($opcoesLider);
    if ($semLider > 0) {
        $opcoesLider = ['sem-lider' => 'ninguém ainda (' . $semLider . ')'] + $opcoesLider;
    }

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
      <p class="dica colado">
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
  /* Por último, e separada das outras pelo sentido: as de cima são "o que a
     pessoa é", esta é "o que aconteceu com ela". */
  $abasTipo['reativar'] = ['nome' => 'A reativar', 'conta' => quantas_para_reativar()];
  if ($duplicatas !== []) {
      $abasTipo['duplicatas'] = ['nome' => 'Duplicatas', 'conta' => count($duplicatas)];
  } elseif ($filtro === 'duplicatas') {
      $filtro = '';
  }
  barra_abas($abasTipo, $filtro, 'tipo', 'Recorte da base');
  ?>

  <?php /* A reativação é outra lista, e não esta com um filtro: agrupa por
           motivo, ordena por quem esfriou faz menos tempo e diz o que falar.
           Ver `pessoas-reativar.php`. As duplicatas idem: pares, não gente. */ ?>
  <?php if ($filtro === 'reativar'): ?>
    <?php bloco_reativacao(pessoas_para_reativar(), $busca); ?>
  <?php elseif ($filtro === 'duplicatas'): ?>
    <?php bloco_duplicatas($duplicatas); ?>
  <?php else: ?>
  <?php /* ============ a lista ============ */ ?>
  <fieldset id="lista">
    <legend>
      <?= $filtro === '' ? 'Todas' : h(TIPOS_PESSOA[$filtro] ?? $filtro) ?>
      (<?= count($todas) ?><?= $busca !== '' || $filtro !== '' || $cidadeF !== '' ? ' de ' . count(ler_pessoas()) : '' ?>)
    </legend>

    <div class="acoes" style="margin:0 0 18px">
      <?php /* `reativar` fica de fora: ele não é tipo, e prefixá-lo no
               cadastro criaria pessoa com um tipo que não existe. */ ?>
      <?php botao_modal('nova-pessoa', 'Cadastrar pessoa', 'novo=1' . (isset(TIPOS_PESSOA[$filtro]) ? '&tipo=' . urlencode($filtro) : '')); ?>
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
                ['tipo' => 'escolha', 'nome' => 'rede', 'rotulo' => 'Rede',
                 'valor' => $redeF, 'vazio' => 'qualquer', 'opcoes' => $opcoesRede],
                ['tipo' => 'escolha', 'nome' => 'lider', 'rotulo' => 'Acompanhada por',
                 'valor' => $liderF, 'vazio' => 'qualquer', 'opcoes' => $opcoesLider],
                ['tipo' => 'escolha', 'nome' => 'ordem', 'rotulo' => 'Ordenar por',
                 'valor' => $ordem, 'opcoes' => [
                     'nome'    => 'nome (A–Z)',
                     'recente' => 'quem chegou por último',
                     'cidade'  => 'cidade e bairro',
                 ]],
            ],
            $busca !== '' || $cidadeF !== '' || $liderF !== '' || $redeF !== '' || $ordem !== 'nome',
            '/painel/pessoas.php' . ($filtro !== '' ? '?tipo=' . urlencode($filtro) : ''),
            $filtro !== '' ? ['tipo' => $filtro] : []
        );
      ?>
      <?php /* O CSV leva EXATAMENTE este recorte — a mesma querystring, a
               mesma `recorte_de_pessoas()`. É dado pessoal saindo: só
               coordenação e administração. */ ?>
      <?php if (tem_capacidade('coordenacao')): ?>
        <p class="dica exportar">
          <a class="btn btn-mini" href="/painel/exportar.php?<?= h(http_build_query(['o' => 'pessoas'] + $_GET)) ?>">
            Baixar CSV (<?= count($todas) ?>)
          </a>
          <span>o recorte de cima, em planilha — abre no Excel e no Google Planilhas</span>
          <?php if (e_admin()): ?>
            <a class="btn btn-mini" href="/painel/importar.php">Importar uma planilha</a>
          <?php endif; ?>
        </p>
      <?php endif; ?>
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
                      <?php links_whatsapp($p['telefone'], telefone_bonito($p['telefone'])); ?>
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
                    <?php menu_acoes([
                        ['texto' => 'Abrir a ficha', 'url' => '?p=' . urlencode($p['id']) . '#ficha'],
                        ['texto' => 'Editar', 'url' => '?editar=' . urlencode($p['id']), 'modal' => 'editar-pessoa'],
                    ]); ?>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </fieldset>
  <?php endif; ?>

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
