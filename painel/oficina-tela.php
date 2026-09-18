<?php
declare(strict_types=1);

/**
 * A tela da Oficina: o formato da vez, o catálogo e os números.
 *
 * TRÊS ABAS, e a primeira tem UMA COISA SÓ. A aba Hoje mostra um formato, não
 * trinta e sete: escolher entre trinta e sete é a decisão que faz alguém fechar
 * a aba e não gravar nada. O catálogo inteiro continua a um toque, na aba do
 * lado, para quem quiser trocar — mas ele não é o que abre.
 */

require_once __DIR__ . '/oficina-comum.php';
require_once __DIR__ . '/oficina-capas.php';
require_once __DIR__ . '/layout.php';

/**
 * A capa de um formato: a imagem real do reel quando ela foi baixada, e o
 * desenho da estrutura do plano quando não. As duas na mesma caixa — trocar
 * uma pela outra não pode mexer na altura da linha.
 */
function capa_do_formato(string $chave, string $nome, bool $grande = false): void
{
    $classe = 'capa-formato' . ($grande ? ' capa-grande' : '');
    $real = capa_guardada($chave);
    if ($real !== null) {
        echo '<span class="' . $classe . '"><img src="' . h($real)
            . '" alt="' . h('Capa do reel de ' . $nome) . '" loading="lazy" decoding="async"></span>';
        return;
    }
    echo '<span class="' . $classe . '">' . capa_svg($chave, $grande ? 112 : 56, $nome) . '</span>';
}

/** O cartão de um formato: etiqueta, o que é, como gravar e os links. */
function cartao_de_formato(string $chave, array $formato): void
{
    ?>
    <p class="sub">
      <span class="selo"><?= h(FONTES_OFICINA[$formato['fonte']]) ?></span>
      <?= h($formato['resumo']) ?>
    </p>
    <p class="dica"><strong>Como gravar:</strong> <?= h($formato['dica']) ?></p>
    <?php if ($formato['links'] !== []): ?>
      <div class="acoes">
        <?php foreach ($formato['links'] as $link): ?>
          <a class="btn btn-mini" href="<?= h($link['url']) ?>" target="_blank" rel="noopener">
            <?= h($link['rotulo']) ?>
          </a>
        <?php endforeach; ?>
      </div>
      <?php /* O AVISO EXISTE PORQUE O DESTINO DEPENDE DE CONTA. A aula abre uma
               parede de login da Hotmart, e no celular, no minuto de gravar,
               descobrir isso no clique é o tipo de atrito que faz a pessoa
               desistir do dia. O reel da Hanah é aberto — e por isso o aviso
               diz qual é qual, em vez de só avisar. */ ?>
      <?php $pedeConta = false; ?>
      <?php foreach ($formato['links'] as $link): ?>
        <?php $pedeConta = $pedeConta || str_contains($link['url'], 'hotmart.com'); ?>
      <?php endforeach; ?>
      <?php if ($pedeConta): ?>
        <p class="dica">As aulas pedem o seu login da Hotmart; o reel da Hanah e os cards do Trello abrem direto.</p>
      <?php endif; ?>
    <?php endif; ?>

    <?php /* QUEM JÁ FEZ — o que tira a página em branco. Saber o formato não diz
             o que filmar; ver o mesmo formato aplicado em política, e depois em
             moda e em comida, diz. Os do nicho mais próximo vêm primeiro
             (`referencias_de()`), mas os outros ficam: a referência de
             enquadramento que serve costuma vir de um nicho que não é o seu. */ ?>
    <?php $refs = referencias_de($chave, 6); ?>
    <?php if ($refs !== []): ?>
      <?php $total = count(referencias_de($chave)); ?>
      <p class="dica"><strong>Quem já fez:</strong></p>
      <div class="acoes">
        <?php foreach ($refs as $ref): ?>
          <a class="btn btn-mini" href="<?= h($ref['url']) ?>" target="_blank" rel="noopener">
            <?= h($ref['nicho'] !== '' ? mb_strtolower($ref['nicho']) : 'exemplo') ?>
          </a>
        <?php endforeach; ?>
      </div>
      <?php if ($total > count($refs)): ?>
        <p class="dica">Mais <?= $total - count($refs) ?> exemplos na aplicação do formato, no Trello.</p>
      <?php endif; ?>
    <?php endif; ?>
    <?php
}

function tela_de_oficina(?string $erro, ?string $ok, array $eu): void
{
    $aba = (string) ($_GET['aba'] ?? 'hoje');
    if (!in_array($aba, ['hoje', 'formatos', 'numeros'], true)) {
        $aba = 'hoje';
    }

    $fila = fila_de($eu);
    $feitos = formatos_feitos($eu);
    $faltaNumero = sem_numero($eu);

    abrir_pagina('Oficina');
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      'Oficina de formatos',
      'Um formato por vez, do catálogo ao número. <strong>O objetivo não é postar 37 vezes</strong> — é descobrir quais 2 ou 3 funcionam.',
      null,
      '/painel/oficina',
      [
          'A aba Hoje mostra um formato só: escolher entre 37 é o que faz o desafio parar no dia 4.',
          'Se o formato da vez não serve para hoje, "fica pra depois" manda ele para o fim da fila — você nunca trava.',
          'Publicar é metade. Volte em uns dias e anote os números: sem eles, não dá para saber o que funcionou.',
          'A sua oficina é só sua. Ninguém no painel vê o que está aqui, e você não vê a de ninguém.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php barra_abas([
      'hoje'     => ['nome' => 'Hoje',     'conta' => null],
      'formatos' => ['nome' => 'Formatos', 'conta' => count($feitos) . '/' . count(FORMATOS_OFICINA)],
      'numeros'  => ['nome' => 'Números',  'conta' => count($faltaNumero) > 0 ? count($faltaNumero) : null],
  ], $aba); ?>

  <?php /* ---------------------------------------------------------- */ ?>
  <?php /* ABA HOJE — o formato da vez, e nada mais                    */ ?>
  <?php /* ---------------------------------------------------------- */ ?>
  <?php if ($aba === 'hoje'): ?>

    <?php $vez = $fila[0] ?? null; ?>
    <?php if ($vez === null): ?>
      <?php vazio(
          'Os ' . count(FORMATOS_OFICINA) . ' formatos foram testados. Agora é repetir o que funcionou.',
          ['url' => '?aba=numeros', 'texto' => 'Ver o que funcionou']
      ); ?>
    <?php else: ?>
      <?php $t = $vez['tentativa']; $estado = $t['estado'] ?? 'aberto'; ?>

      <fieldset id="vez">
        <legend>O formato da vez</legend>

        <div class="com-capa">
          <?php capa_do_formato($vez['chave'], $vez['formato']['nome'], true); ?>
          <div>
            <h2><?= h($vez['formato']['nome']) ?></h2>
            <?php cartao_de_formato($vez['chave'], $vez['formato']); ?>
          </div>
        </div>

        <?php /* O FECHO TEM TELA PRÓPRIA, e é a única do catálogo que tem: o
                 Formato Combinado manda olhar a métrica e não o gosto, e mandar
                 isso sem mostrar a métrica ao lado é pedir que a pessoa abra
                 outra aba e confie na memória — que é exatamente como o gosto
                 volta a decidir. */ ?>
        <?php if ($vez['chave'] === 'combinado'): ?>
          <?php $melhores = array_slice(desempenho_de($eu), 0, 3); ?>
          <?php if ($melhores === []): ?>
            <p class="msg msg-erro">
              Você chegou no fecho sem número nenhum anotado. Sem isso não há o que combinar —
              <a href="?aba=numeros">anote os números dos vídeos publicados</a> antes.
            </p>
          <?php else: ?>
            <p class="sub">Os seus três de maior retenção — é deles que sai o formato combinado:</p>
            <dl class="resumo-numeros">
              <?php foreach ($melhores as $linha): ?>
                <div>
                  <dt><?= h($linha['formato']['nome']) ?></dt>
                  <dd><?= h((string) $linha['retencao']) ?>%</dd>
                </div>
              <?php endforeach; ?>
            </dl>
          <?php endif; ?>
        <?php endif; ?>

        <?php if ($estado !== 'aberto'): ?>
          <p class="sub">Já está <strong><?= h(mb_strtolower(ESTADOS_OFICINA[$estado])) ?></strong>.</p>
        <?php endif; ?>

        <?php /* DOIS BOTÕES NUMA FORMA SÓ, como o Entrou/Saiu do caixa: gravar
                 e editar não pedem nada além do clique, e um formulário por
                 botão seria três formulários para uma decisão só. */ ?>
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="passo">
          <input type="hidden" name="formato" value="<?= h($vez['chave']) ?>">
          <div class="acoes">
            <button class="btn" type="submit" name="para" value="gravado">Gravei</button>
            <button class="btn" type="submit" name="para" value="editado">Editei</button>
          </div>
        </form>

        <form method="post" data-rascunho="oficina-publicar">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="passo">
          <input type="hidden" name="formato" value="<?= h($vez['chave']) ?>">
          <input type="hidden" name="para" value="publicado">

          <div class="campo">
            <label for="o-tema">Do que era o vídeo</label>
            <input id="o-tema" name="tema" type="text" maxlength="140" required
                   placeholder="por que o transporte de Fortaleza não melhora"
                   value="<?= h($t['tema'] ?? '') ?>">
          </div>

          <div class="linha g2">
            <div class="campo">
              <label for="o-gancho">Gancho usado</label>
              <select id="o-gancho" name="gancho">
                <option value="">— não sei dizer —</option>
                <?php foreach (GANCHOS_OFICINA as $chave => $gancho): ?>
                  <option value="<?= h($chave) ?>"<?= ($t['gancho'] ?? '') === $chave ? ' selected' : '' ?>>
                    <?= h($gancho['nome']) ?> — <?= h($gancho['estrutura']) ?>
                  </option>
                <?php endforeach; ?>
              </select>
              <p class="dica">O mesmo formato com outro gancho é outro vídeo. Sem isso, a aba Números perde metade da resposta.</p>
            </div>
            <div class="campo">
              <label for="o-link">Link do post (opcional)</label>
              <input id="o-link" name="link" type="url" maxlength="300"
                     placeholder="https://instagram.com/reel/…"
                     value="<?= h($t['link'] ?? '') ?>">
            </div>
          </div>

          <div class="acoes">
            <button class="btn btn-ouro" type="submit">Publiquei</button>
          </div>
        </form>

        <?php /* "Fica pra depois" NÃO É PULAR: o formato volta atrás dos
                 outros, e entre os adiados volta primeiro quem está adiado há
                 mais tempo. Sem isso, o Diálogo (que precisa de outra pessoa)
                 trancaria a fila inteira num dia em que ninguém pode gravar. */ ?>
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="adiar">
          <input type="hidden" name="formato" value="<?= h($vez['chave']) ?>">
          <div class="acoes">
            <button class="btn btn-mini" type="submit">Hoje não dá — fica pra depois</button>
          </div>
        </form>
      </fieldset>

      <?php $proximos = array_slice($fila, 1, 3); ?>
      <?php if ($proximos !== []): ?>
        <p class="dica">
          Depois dele:
          <?= h(implode(' · ', array_map(fn ($f) => $f['formato']['nome'], $proximos))) ?>
        </p>
      <?php endif; ?>
    <?php endif; ?>

    <?php if ($faltaNumero !== []): ?>
      <p class="dica">
        <a class="btn btn-mini" href="?aba=numeros">Anotar números</a>
        <span><?= count($faltaNumero) ?> <?= count($faltaNumero) === 1 ? 'vídeo publicado espera' : 'vídeos publicados esperam' ?> medida</span>
      </p>
    <?php endif; ?>

  <?php endif; ?>

  <?php /* ---------------------------------------------------------- */ ?>
  <?php /* ABA FORMATOS — o catálogo inteiro                           */ ?>
  <?php /* ---------------------------------------------------------- */ ?>
  <?php if ($aba === 'formatos'): ?>

    <?php
    $busca = trim((string) ($_GET['q'] ?? ''));
    $naFila = [];
    foreach ($fila as $i => $item) {
        $naFila[$item['chave']] = $i;
    }
    $lista = [];
    foreach (FORMATOS_OFICINA as $chave => $formato) {
        if ($busca !== '' && mb_stripos($formato['nome'] . ' ' . $formato['resumo'], $busca) === false) {
            continue;
        }
        $lista[$chave] = $formato;
    }
    ?>

    <?php barra_busca($busca, 'nome do formato', ['aba']); ?>
    <?php resumo_do_recorte($busca !== '', count($lista), count(FORMATOS_OFICINA), 'formatos'); ?>

    <?php if ($lista === []): ?>
      <?php nada_encontrado($busca, '?aba=formatos', 'Nenhum formato no catálogo.'); ?>
    <?php else: ?>
      <div class="rolagem cartoes">
        <table class="tabela">
          <thead>
            <tr><th>Formato</th><th>O que é</th><th>Onde está</th><th></th></tr>
          </thead>
          <tbody>
            <?php foreach ($lista as $chave => $formato): ?>
              <?php
              $quantos = $feitos[$chave] ?? 0;
              $posicao = $naFila[$chave] ?? null;
              $adiado = $posicao !== null && ($fila[$posicao]['adiadoEm'] ?? '') !== '';
              if ($quantos > 0) {
                  $situacao = $quantos === 1 ? 'Publicado' : 'Publicado ' . $quantos . '×';
                  $selo = 'selo-ok';
              } elseif ($posicao === 0) {
                  $situacao = 'É o da vez';
                  $selo = 'selo-ok';
              } elseif ($adiado) {
                  $situacao = 'Adiado';
                  $selo = 'selo-off';
              } else {
                  $situacao = 'Na fila';
                  $selo = 'selo-off';
              }
              $itens = [];
              foreach ($formato['links'] as $link) {
                  $itens[] = ['texto' => $link['rotulo'], 'url' => $link['url'], 'novaAba' => true];
              }
              foreach (referencias_de($chave, 3) as $ref) {
                  $itens[] = [
                      'texto'   => 'quem já fez: ' . mb_strtolower($ref['nicho'] !== '' ? $ref['nicho'] : 'exemplo'),
                      'url'     => $ref['url'],
                      'novaAba' => true,
                  ];
              }
              if ($quantos === 0) {
                  $itens[] = $adiado
                      ? ['texto' => 'Voltar para a fila', 'acao' => 'retomar', 'campos' => ['formato' => $chave]]
                      : ['texto' => 'Fica pra depois',    'acao' => 'adiar',   'campos' => ['formato' => $chave]];
              }
              ?>
              <tr>
                <td data-rotulo="Formato">
                  <div class="com-capa">
                    <?php capa_do_formato($chave, $formato['nome']); ?>
                    <div>
                      <strong><?= h($formato['nome']) ?></strong>
                      <span class="selo"><?= h(FONTES_OFICINA[$formato['fonte']]) ?></span>
                    </div>
                  </div>
                </td>
                <td data-rotulo="O que é"><?= h($formato['resumo']) ?></td>
                <td class="terco" data-rotulo="Onde está">
                  <span class="selo <?= $selo ?>"><?= h($situacao) ?></span>
                </td>
                <td class="rodape" data-rotulo="">
                  <?php menu_acoes($itens, $formato['nome']); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>

    <?php $faltam = capas_faltando(); ?>
    <?php if ($faltam !== []): ?>
      <?php /* O DESENHO NUNCA FALTA; a foto é um extra, e por isso isto é um
               botão e não um efeito de abrir a tela. Buscar imagem na internet
               ao desenhar a página faria a Oficina depender do Instagram estar
               de pé para abrir — e ela precisa abrir no ônibus, offline, para
               você ver qual é o formato de hoje. */ ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="acao" value="capas">
        <p class="dica">
          <button class="btn btn-mini" type="submit">Baixar as capas dos reels</button>
          <span>
            <?= count($faltam) ?> de <?= capas_possiveis() ?> ainda sem a imagem do vídeo.
            Os outros <?= count(FORMATOS_OFICINA) - capas_possiveis() ?> não têm reel público — ficam com o desenho da estrutura.
          </span>
        </p>
      </form>
    <?php endif; ?>

    <?php if (APOIO_OFICINA !== []): ?>
      <fieldset id="apoio">
        <legend>Serve para qualquer formato</legend>
        <div class="acoes">
          <?php foreach (APOIO_OFICINA as $link): ?>
            <a class="btn btn-mini" href="<?= h($link['url']) ?>" target="_blank" rel="noopener">
              <?= h($link['rotulo']) ?>
            </a>
          <?php endforeach; ?>
        </div>
      </fieldset>
    <?php endif; ?>

  <?php endif; ?>

  <?php /* ---------------------------------------------------------- */ ?>
  <?php /* ABA NÚMEROS — o que funcionou, e o que ainda falta medir    */ ?>
  <?php /* ---------------------------------------------------------- */ ?>
  <?php if ($aba === 'numeros'): ?>

    <?php
    $desempenho = desempenho_de($eu);
    $publicados = array_values(array_filter(minha_oficina($eu), fn ($t) => $t['estado'] === 'publicado'));
    $editando = null;
    $alvo = limpar_texto($_GET['editar'] ?? '', 40);
    foreach ($publicados as $t) {
        if ($t['id'] === $alvo) {
            $editando = $t;
        }
    }
    ?>

    <?php if ($editando !== null): ?>
      <fieldset id="anotar">
        <legend>Números de "<?= h($editando['tema']) ?>"</legend>
        <p class="sub">
          <span class="selo"><?= h(FORMATOS_OFICINA[$editando['formato']]['nome']) ?></span>
          publicado em <?= h($editando['publicadoEm']) ?>
        </p>
        <form method="post" data-rascunho="oficina-numeros">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="numeros">
          <input type="hidden" name="id" value="<?= h($editando['id']) ?>">
          <div class="linha g3">
            <?php foreach (NUMEROS_OFICINA as $campo => $rotulo): ?>
              <div class="campo">
                <label for="n-<?= h($campo) ?>"><?= h($rotulo) ?></label>
                <?php /* Em branco é "ainda não sei", e por isso nenhum campo
                         tem valor 0 pré-preenchido: um zero digitado por
                         descuido vira média, e média errada manda o formato
                         errado para o topo desta aba. */ ?>
                <input id="n-<?= h($campo) ?>" name="<?= h($campo) ?>" type="text" inputmode="numeric"
                       maxlength="12" value="<?= $editando[$campo] > 0 ? h((string) $editando[$campo]) : '' ?>">
              </div>
            <?php endforeach; ?>
          </div>
          <div class="campo">
            <label for="n-nota">O que você aprendeu (opcional)</label>
            <input id="n-nota" name="nota" type="text" maxlength="500"
                   placeholder="o gancho demorou demais para chegar no ponto"
                   value="<?= h($editando['nota']) ?>">
          </div>
          <div class="acoes">
            <button class="btn btn-ouro" type="submit">Anotar</button>
            <a class="btn btn-mini" href="?aba=numeros">Cancelar</a>
          </div>
        </form>
      </fieldset>
    <?php endif; ?>

    <?php if ($desempenho !== []): ?>
      <?php /* OS TRÊS DO TOPO — é literalmente o que o Formato Combinado pede
               que você olhe: métrica, e não gosto. */ ?>
      <fieldset id="topo">
        <legend>Os que mais seguraram quem chegou</legend>
        <dl class="resumo-numeros">
          <?php foreach (array_slice($desempenho, 0, 3) as $linha): ?>
            <div>
              <dt><?= h($linha['formato']['nome']) ?></dt>
              <dd><?= h((string) $linha['retencao']) ?>%</dd>
            </div>
          <?php endforeach; ?>
        </dl>
        <p class="dica">
          Retenção, e não views: views premiam o vídeo que o algoritmo escolheu empurrar,
          retenção premia o vídeo que segurou quem chegou.
        </p>
      </fieldset>

      <fieldset id="desempenho">
        <legend>Média por formato (<?= count($desempenho) ?>)</legend>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead>
              <tr>
                <th>Formato</th><th>Vídeos</th>
                <?php foreach (NUMEROS_OFICINA as $rotulo): ?><th><?= h($rotulo) ?></th><?php endforeach; ?>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($desempenho as $linha): ?>
                <tr>
                  <td data-rotulo="Formato"><strong><?= h($linha['formato']['nome']) ?></strong></td>
                  <td class="terco" data-rotulo="Vídeos"><?= h((string) $linha['videos']) ?></td>
                  <?php foreach (NUMEROS_OFICINA as $campo => $rotulo): ?>
                    <td class="terco" data-rotulo="<?= h($rotulo) ?>"><?= h((string) $linha[$campo]) ?></td>
                  <?php endforeach; ?>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </fieldset>
    <?php endif; ?>

    <fieldset id="publicados">
      <legend>Vídeos publicados (<?= count($publicados) ?>)</legend>
      <?php if ($publicados === []): ?>
        <?php vazio('Nenhum vídeo publicado ainda — o primeiro número vem depois do primeiro post.', ['url' => '?aba=hoje', 'texto' => 'Ver o formato da vez']); ?>
      <?php else: ?>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead>
              <tr><th>Quando</th><th>Do que era</th><th>Formato</th><th>Gancho</th><th>Medido</th><th></th></tr>
            </thead>
            <tbody>
              <?php foreach ($publicados as $t): ?>
                <?php
                $itens = [['texto' => 'Anotar números', 'url' => '?aba=numeros&editar=' . urlencode($t['id'])]];
                if ($t['link'] !== '') {
                    $itens[] = ['texto' => 'Abrir o post', 'url' => $t['link'], 'novaAba' => true];
                }
                $itens[] = [
                    'texto' => 'Apagar', 'acao' => 'apagar', 'campos' => ['id' => $t['id']],
                    'confirmar' => 'Apagar o registro de "' . $t['tema'] . '"? Os números dele saem das médias.',
                    'risco' => true,
                ];
                ?>
                <tr>
                  <td class="terco" data-rotulo="Quando"><?= h($t['publicadoEm']) ?></td>
                  <td data-rotulo="Do que era"><strong><?= h($t['tema']) ?></strong></td>
                  <td class="terco" data-rotulo="Formato"><?= h(FORMATOS_OFICINA[$t['formato']]['nome']) ?></td>
                  <td class="tarde" data-rotulo="Gancho">
                    <?= $t['gancho'] !== '' ? h(GANCHOS_OFICINA[$t['gancho']]['nome']) : '—' ?>
                  </td>
                  <td class="terco" data-rotulo="Medido">
                    <span class="selo <?= tem_numero($t) ? 'selo-ok' : 'selo-off' ?>">
                      <?= tem_numero($t) ? h($t['retencao'] . '% · ' . $t['views'] . ' views') : 'falta medir' ?>
                    </span>
                  </td>
                  <td class="rodape" data-rotulo="">
                    <?php menu_acoes($itens, $t['tema']); ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </fieldset>

  <?php endif; ?>

  <div class="acoes">
    <a class="btn btn-mini" href="/painel/">Voltar ao início</a>
  </div>
</div>
    <?php
    fechar_pagina();
}
