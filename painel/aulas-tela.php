<?php
declare(strict_types=1);

/**
 * A TELA de `/painel/aulas`: a moldura, as abas e o recorte.
 *
 * A FRENTE DE ESTUDO NÃO CABIA MAIS NUMA NOÇÃO SÓ DE "Aulas". A tela empilhava
 * trinta e duas fichas de vídeo — cada uma com formulário — e, no fim de tudo,
 * uma tabela de quem estudou. Quem vinha pendurar um vídeo atravessava a
 * formação inteira; quem vinha ver quem travou rolava até o fim para achar
 * quatro linhas.
 *
 * São três perguntas diferentes, e viraram três abas:
 *
 *   conteúdo   — o que está no ar: o vídeo de cada aula, publicado ou rascunho
 *   estudo     — quem começou, quem travou, quem já fechou as Pistas Rápidas
 *   prontidão  — o que cada função exige, e quem já cumpriu
 *
 * ABA, E NÃO ROLAGEM, pela régua do painel: o item de cada bloco aqui é
 * CONTEÚDO que se lê inteiro — uma ficha com formulário, uma tabela de gente —,
 * e não um link de uma linha. Empilhado, o primeiro esconde o segundo. (Em
 * `/painel/eventos` a decisão é a oposta, e pelo mesmo motivo: lá o item é
 * link.)
 *
 * A ABA ABRE EM CONTEÚDO porque é a rotina que traz alguém aqui com uma tarefa
 * na mão — "onde pendura o vídeo da Checagem?". As outras duas são leitura de
 * coordenação, e leitura procura; tarefa não.
 */

require_once __DIR__ . '/aulas-comum.php';
require_once __DIR__ . '/aulas-estudo.php';
require_once __DIR__ . '/aulas-prontidao.php';
require_once __DIR__ . '/aulas-videos.php';
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/sessao.php';

function tela_de_aulas(?string $erro, ?string $ok): void
{
    $videos     = ler_videos();
    $total      = total_de_aulas();
    $comVideo   = count($videos);
    $publicadas = count(array_filter($videos, fn ($v) => $v['publicada']));

    /* ---------------- recorte ----------------
       São 32 aulas em seis Dias, e a pergunta que traz alguém aqui é sempre sobre
       UMA delas — "onde pendura o vídeo da Checagem?", "quais ainda estão sem
       vídeo?". Sem recorte, as duas se respondem abrindo seis blocos e lendo.

       Na aba de estudo a MESMA busca procura gente: é a única caixa da tela, e
       duas caixas de procurar em abas irmãs seriam duas coisas para aprender. */
    $buscaAu  = limpar_texto($_GET['q'] ?? '', 60);
    $estadoAu = in_array($_GET['estado'] ?? '', ['sem-video', 'rascunho', 'publicada'], true)
        ? (string) $_GET['estado'] : '';

    $recorteAu = function (array $aula) use ($videos, $buscaAu, $estadoAu): bool {
        if ($buscaAu !== '' && !combina_com([$aula['titulo'], $aula['resumo'], $aula['id']], $buscaAu)) {
            return false;
        }
        $v = $videos[$aula['id']] ?? null;
        return match ($estadoAu) {
            'sem-video'  => $v === null,
            'rascunho'   => $v !== null && !$v['publicada'],
            'publicada'  => $v !== null && $v['publicada'],
            default      => true,
        };
    };
    $recortadoAu = $buscaAu !== '' || $estadoAu !== '';
    $achadasAu = count(array_filter(todas_as_aulas(), $recorteAu));

    $pedida = (string) ($_GET['aba'] ?? '');
    $abaAu = in_array($pedida, ['estudo', 'prontidao'], true) ? $pedida : 'conteudo';

abrir_pagina('Aulas em vídeo');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Formação',
      'A formação que o time vê em <a href="/aulas" target="_blank">/aulas</a>. A divisão em '
      . '<strong>🚗 Pista Rápida</strong> e <strong>Pista Lenta</strong> é explicada na primeira aula, '
      . '<a href="/aulas#como-funciona-a-formacao" target="_blank">Como esta formação funciona</a> — '
      . 'aqui não se repete, para os dois textos não divergirem.',
      null,
      null,
      [
          'Pendurar o vídeo de uma aula: o texto dela já está escrito e vem do manual.',
          'Ver quem já estudou o quê, quem parou no meio e há quanto tempo.',
          'Conferir o que cada função exige para alguém começar a operar.',
          'Aula sem vídeo continua funcionando — o texto é o que ensina; o vídeo ajuda.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php
  barra_abas([
      'conteudo'  => ['nome' => 'Conteúdo',  'conta' => $comVideo . '/' . $total],
      'estudo'    => ['nome' => 'Quem estudou'],
      'prontidao' => ['nome' => 'Trilhas e prontidão'],
  ], $abaAu, 'aba', 'Formação');
  ?>

  <?php if ($abaAu === 'conteudo'): ?>
    <p class="dica">
      O texto de cada aula já está escrito e vem do manual da militância. Aqui você só pendura o vídeo:
      enquanto ele não existir, a aula funciona pelo texto. Aula nova de reforço entra como Pista
      Lenta no Dia certo, sem mexer no caminho de quem já está andando.
    </p>

    <details class="decidir" style="margin-bottom:20px">
      <summary class="btn">Link do Dia 0 para quem ainda não tem acesso</summary>
      <div class="decidir-corpo">
        <p class="dica" style="margin:0 0 10px">
          Mande para quem acabou de se inscrever. Abre <strong>só o Dia 0</strong> — as regras que
          valem para todo mundo — sem conta e sem gravar progresso. O resto da formação continua
          exigindo login, e o texto nunca sai do painel.
        </p>
        <p class="provisoria" style="word-break:break-all"><?= h(link_convite()) ?></p>
        <p class="dica" style="margin:10px 0 0">
          O link é o mesmo sempre e não vence. Se algum dia ele circular longe demais, apague
          <code>dados/segredo.php</code> no hPanel: o painel gera outro sozinho e todos os convites
          antigos param de valer de uma vez. Isso também zera a contagem do teto de envios do
          formulário público — não quebra nada, só recomeça do zero.
        </p>
      </div>
    </details>

    <p class="dica">
      <?= $total ?> aulas · <?= $comVideo ?> com vídeo · <?= $publicadas ?> publicadas.
    </p>

    <?php barra_filtros(
        [
            ['tipo' => 'busca', 'valor' => $buscaAu, 'dica' => 'título da aula ou assunto'],
            ['tipo' => 'escolha', 'nome' => 'estado', 'rotulo' => 'Estado',
             'valor' => $estadoAu, 'vazio' => 'todas', 'opcoes' => [
                 'sem-video' => 'sem vídeo (' . ($total - $comVideo) . ')',
                 'rascunho'  => 'vídeo em rascunho (' . ($comVideo - $publicadas) . ')',
                 'publicada' => 'publicadas (' . $publicadas . ')',
             ]],
        ],
        $recortadoAu,
        '/painel/aulas.php?aba=conteudo',
        ['aba' => 'conteudo']
    ); ?>

    <?php resumo_do_recorte($recortadoAu, $achadasAu, $total, 'aulas'); ?>
    <?php /* Fora de qualquer <p>: `nada_encontrado()` desenha parágrafo e `<div>`,
             e bloco dentro de parágrafo faz o navegador fechar o <p> sozinho,
             reorganizando a árvore. */ ?>
    <?php if ($recortadoAu && $achadasAu === 0): ?>
      <?php nada_encontrado($buscaAu, '/painel/aulas.php?aba=conteudo', 'Nenhuma aula nesse estado.'); ?>
    <?php endif; ?>

    <?php bloco_videos($videos, $recorteAu); ?>

  <?php elseif ($abaAu === 'estudo'): ?>
    <?php /* O filtro de estado da aula não vem para cá: ele recorta AULA, e esta
             aba lista GENTE. A busca vem, porque procurar alguém pelo nome é a
             mesma coisa em qualquer tela do painel. */ ?>
    <?php barra_busca($buscaAu, 'nome, login ou cidade', ['aba' => 'estudo']); ?>
    <?php bloco_acompanhamento($buscaAu); ?>

  <?php else: ?>
    <?php bloco_prontidao(); ?>
  <?php endif; ?>
</div>
<?php
    fechar_pagina();
}
