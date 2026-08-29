<?php
declare(strict_types=1);

/**
 * A TELA de `/painel/fatos`: o recorte, a moldura e as abas.
 *
 * SÃO TRÊS RITMOS, E NÃO TRÊS BLOCOS. Zerar a fila, cadastrar uma ficha nova e
 * consultar o que já foi decidido acontecem em momentos diferentes do dia, e
 * empilhados viravam uma rolagem em que quem abriu para DECIDIR atravessava um
 * formulário longo, e quem abriu para TRAZER atravessava fila e histórico antes
 * de começar. Cada um virou aba.
 *
 * A ABA AQUI E A ROLAGEM EM `/painel/eventos` seguem a mesma régua, e não duas.
 * O que decide é o peso do item: lá cada linha é um LINK — nome e data — e
 * vinte deles continuam sendo uma lista que se varre com o olho; aqui cada item
 * é CONTEÚDO que se lê inteiro, e o que vem embaixo do primeiro deixa de existir
 * para quem chegou agora.
 *
 * A tela é, antes de tudo, mesa de decisão: a aba abre na FILA, sempre. Trazer
 * é o segundo motivo de alguém abrir isto, e consultar o registro é o terceiro
 * — é essa a ordem da barra.
 *
 * O RECORTE É CALCULADO AQUI, como nas outras telas grandes: a busca e o filtro
 * de categoria só existem para virar estas listas, e o contador de cada aba tem
 * de concordar com o que a aba lista.
 */

require_once __DIR__ . '/fatos-comum.php';
require_once __DIR__ . '/fatos-decididos.php';
require_once __DIR__ . '/fatos-fila.php';
require_once __DIR__ . '/fatos-form.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sessao.php';

/**
 * Desenha a tela inteira.
 *
 * `$erro`, `$ok` e `$rascunho` vêm de fora: nascem do que a ação anterior
 * guardou na sessão, que é assunto da rota.
 */
function tela_de_fatos(array $eu, ?string $erro, ?string $ok, array $rascunho): void
{
    /* A busca recorta ANTES do corte de 15: filtrar depois procuraria só dentro do
       que coube na tela, e o fato que se está procurando é justamente o que ficou
       de fora. */
    $buscaFa = limpar_texto($_GET['q'] ?? '', 60);
    $catF = (string) ($_GET['cat'] ?? '');
    if (!isset(CATEGORIAS[$catF])) {
        $catF = '';
    }
    $recorteFa = fn (array $f) => combina_com(
        [$f['oQue'], $f['quem'], $f['quanto'], $f['afetados'], $f['fonteUrl'],
         $f['autorNome'], $f['checadoPor'], $f['motivo']],
        $buscaFa
    ) && ($catF === '' || $f['categoria'] === $catF);
    $peneirar = fn (array $lista) => array_values(array_filter($lista, $recorteFa));

    $porCategoria = [];
    foreach (ler_fatos() as $f) {
        $porCategoria[$f['categoria']] = ($porCategoria[$f['categoria']] ?? 0) + 1;
    }

    /* Qual ficha está aberta para correção. É um GET (`?editar=<id>`), e não estado
       de JavaScript: sem JS a página recarrega com o `<dialog open>` e o formulário
       continua ali — o mesmo desenho dos outros modais do painel. */
    $corrigindo = achar_fato(limpar_texto($_GET['editar'] ?? '', 40));
    if ($corrigindo !== null && ($corrigindo['status'] !== 'a-checar' || !posso_mexer($corrigindo, $eu))) {
        $corrigindo = null;   // a trava do POST desenhada na tela: formulário que vai ser recusado não se mostra
    }

    $fila = $peneirar(fatos_com_status('a-checar'));

    /* O contador da aba conta o RECORTE INTEIRO; a lista mostra os 15 mais
       recentes. São dois números diferentes de propósito — "Já decididos (48)"
       responde quanto o arquivo tem, e a lista responde o que aconteceu por
       último. Contar o que sobrou da fatia diria "15" para sempre. */
    $todosChecados   = $peneirar(array_reverse(fatos_com_status('ok-checado')));
    $todosPendentes  = $peneirar(array_reverse(fatos_com_status('pendente')));
    $todosArquivados = $peneirar(array_reverse(fatos_com_status('arquivado')));
    $quantosDecididos = count($todosChecados) + count($todosPendentes) + count($todosArquivados);

    $checados   = array_slice($todosChecados, 0, 15);
    $pendentes  = array_slice($todosPendentes, 0, 15);
    $arquivados = array_slice($todosArquivados, 0, 15);
    $quantosFatos = count(ler_fatos());

    /* A aba abre na fila. Corrigir uma ficha é ação da fila, e o `?editar=` que
       chega junto de outra aba abriria um modal por cima de uma tela que fala de
       outra coisa. */
    $pedida = (string) ($_GET['aba'] ?? '');
    $abaFa = in_array($pedida, ['trazer', 'decididos'], true) ? $pedida : 'fila';
    if ($abaFa !== 'fila') {
        $corrigindo = null;
    }

    $quando = function (string $iso): string {
        $t = strtotime($iso);
        return $t ? date('d/m \à\s H:i', $t) : '';
    };

abrir_pagina('Fatos do dia');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Fatos do dia',
      'O Olheiro traz o fato com a prova; a Checagem abre o link e decide. '
      . 'Nada segue para roteiro ou arte sem passar por aqui.',
      null,
      '/painel/fatos',
      [
          'Trazer um fato: só o que aconteceu, quem é o responsável e o link que prova.',
          'Checar o que chegou — mas nunca o seu próprio fato: isso é carimbo, não checagem.',
          'Ao aprovar, marque o que ele vira: roteiro, arte, vídeo, mais de um, ou nenhum.',
          'Fato que confere mas não rende peça se arquiva com o motivo, para não morrer em silêncio.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php
  barra_abas([
      'fila'      => ['nome' => 'Esperando checagem', 'conta' => count($fila)],
      /* Sem contador: a aba não é uma lista, é a ficha em branco. Um número ali
         seria o número de quê? */
      'trazer'    => ['nome' => 'Trazer um fato'],
      'decididos' => ['nome' => 'Já decididos', 'conta' => $quantosDecididos],
  ], $abaFa, 'aba', 'Fatos do dia');
  ?>

  <?php /* O filtro some no formulário: não há o que peneirar numa ficha em
           branco. Nas outras duas abas ele só aparece quando há o que filtrar —
           com quatro fatos são dois controles em cima de uma lista que já cabe
           na tela. */ ?>
  <?php if ($abaFa !== 'trazer' && ($quantosFatos > 6 || $buscaFa !== '' || $catF !== '')): ?>
    <?php
      $opcoesCat = [];
      foreach (CATEGORIAS as $chave => $nome) {
          if (($porCategoria[$chave] ?? 0) === 0 && $catF !== $chave) {
              continue;
          }
          $opcoesCat[$chave] = $nome . ' (' . (int) ($porCategoria[$chave] ?? 0) . ')';
      }
      barra_filtros(
          [
              ['tipo' => 'busca', 'valor' => $buscaFa, 'dica' => 'o que aconteceu, quem, fonte ou autor'],
              ['tipo' => 'escolha', 'nome' => 'cat', 'rotulo' => 'Categoria',
               'valor' => $catF, 'vazio' => 'todas', 'opcoes' => $opcoesCat],
          ],
          $buscaFa !== '' || $catF !== '',
          '/painel/fatos.php?aba=' . $abaFa,
          ['aba' => $abaFa]
      );
    ?>
  <?php endif; ?>

  <?php
  if ($abaFa === 'fila') {
      bloco_fila($fila, $eu, $buscaFa, $quando);
  } elseif ($abaFa === 'trazer') {
      bloco_trazer($rascunho);
  } else {
      bloco_decididos($checados, $pendentes, $arquivados, $buscaFa, $quando);
  }
  ?>

  <?php /* O modal fica no fim do documento, e não dentro do <fieldset> nem da
           tabela: <dialog> aninhado ali é HTML inválido, e o navegador
           reorganiza a árvore sozinho — o formulário some sem erro no console. */ ?>
  <?php if ($corrigindo !== null): ?>
    <?php abrir_modal('corrigir-fato', 'Corrigir a ficha', true); ?>
      <p class="dica" style="margin:0 0 14px">
        Ela continua na fila depois de salvar — corrigir não é decidir.
      </p>
      <?php formulario_fato($corrigindo); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
    fechar_pagina();
}
