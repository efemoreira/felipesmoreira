<?php
declare(strict_types=1);

/**
 * A TELA de `/painel/producao`: a moldura, o filtro e a ordem dos blocos.
 *
 * O quadro é a tela de uso diário da Comunicação, e é mobile-first por
 * necessidade: quatro colunas no computador viram uma pilha no celular, com a
 * faixa de atalhos por cima.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/producao-comum.php';
require_once __DIR__ . '/producao-modal.php';
require_once __DIR__ . '/producao-quadro.php';
require_once __DIR__ . '/sessao.php';

/**
 * Desenha a tela inteira.
 *
 * `$erro` e `$ok` vêm de fora: nascem do recado que a ação anterior guardou na
 * sessão, que é assunto da rota.
 */
function tela_de_producao(array $eu, ?string $erro, ?string $ok): void
{
    $hoje = date('Y-m-d');
    $r = recorte_do_quadro($eu, $hoje);
    /* Os nomes curtos existem porque o bloco do filtro abaixo veio inteiro da
       versão anterior da tela, e reescrevê-lo para usar `$r['busca']` seria
       mexer no que não precisa mudar. */
    $buscaPr = $r['busca'];
    $etapaF = $r['etapa'];
    $donoF = $r['dono'];
    $porEtapa = $r['porEtapa'];
    $achados = $r['achados'];
    $quantosCards = $r['quantos'];
    $recortado = $r['recortado'];

    abrir_pagina('Produção');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Produção',
      'Do fato checado ao post publicado. O card nasce quando a Checagem aprova — '
      . 'com a fonte e o responsável já colados nele.',
      null,
      '/painel/producao',
      [
          'Assumir um card é dizer que ele é seu — sem dono, ninguém sabe quem está devendo.',
          'Publicar pede o link do post: é ele que fecha o ciclo e alimenta o Acervo.',
          'O nome do arquivo é gerado, não digitado — o Estúdio gera o mesmo.',
          'Mesmo alvo duas vezes em 48h avisa e pede ciência. Avisa, não bloqueia.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php /* O filtro só aparece quando há o que filtrar: com quatro cards ele é
           três controles em cima de um quadro que cabe inteiro na tela. */ ?>
  <?php if ($quantosCards > 6 || $recortado): ?>
    <?php
      $opcoesEtapa = [];
      foreach (ETAPAS as $chave => $nome) {
          if (($porEtapa[$chave] ?? 0) === 0 && $etapaF !== $chave) {
              continue;
          }
          $opcoesEtapa[$chave] = $nome . ' (' . (int) ($porEtapa[$chave] ?? 0) . ')';
      }
      barra_filtros(
          [
              ['tipo' => 'busca', 'valor' => $buscaPr, 'dica' => 'título, dono, alvo, fonte ou nome do arquivo'],
              ['tipo' => 'escolha', 'nome' => 'etapa', 'rotulo' => 'Peça',
               'valor' => $etapaF, 'vazio' => 'todas', 'opcoes' => $opcoesEtapa],
              /* Este não tem opção vazia própria: "o quadro inteiro" É o vazio,
                 e escrito assim porque a pergunta aqui não é "qual recorte" e
                 sim "mostrar o quê". */
              ['tipo' => 'escolha', 'nome' => 'dono', 'rotulo' => 'Mostrar',
               'valor' => $donoF, 'vazio' => 'o quadro inteiro', 'opcoes' => [
                   'meus'      => 'os meus',
                   'sem-dono'  => 'sem dono',
                   'atrasados' => 'atrasados',
               ]],
          ],
          $recortado,
          '/painel/producao.php'
      );
      resumo_do_recorte($recortado, $achados, $quantosCards, 'no quadro');
    ?>
    <?php if ($recortado && $achados === 0): ?>
      <?php nada_encontrado($buscaPr, '/painel/producao.php', 'Nenhum card com esse recorte.'); ?>
    <?php endif; ?>
  <?php endif; ?>

  <?php bloco_quadro($r, $eu, $hoje); ?>

  <?php bloco_modal_do_card($r['corrigindo']); ?>
</div>
<?php
    fechar_pagina();
}
