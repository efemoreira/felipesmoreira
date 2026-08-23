<?php
declare(strict_types=1);

/**
 * A TELA de `/painel/candidatos`: duas abas, duas listas.
 *
 * CANDIDATOS é o cadastro — quem é, que número tem, qual o @. LISTAS é a
 * curadoria: um nome ("Deputados federais", "As mulheres da chapa") e quem
 * entra nela. É a lista que vira colinha no site, e por isso ela muda toda
 * semana enquanto o cadastro fica.
 *
 * A ORDEM DA LISTA É A ORDEM DA COLINHA, e não o alfabeto: quem vem primeiro é
 * quem se quer que seja lembrado primeiro.
 *
 * O RECORTE É CALCULADO AQUI, e não recebido pronto da rota. São dezessete
 * variáveis de estado — busca, cargo, ordem, as duas listas filtradas, os
 * contadores das abas, o que está aberto em modal —, e passá-las por parâmetro
 * seria uma assinatura de dezessete argumentos ou um `extract()` que esconde
 * de onde cada nome veio. Elas só existem para serem desenhadas, e o contador
 * da aba tem de concordar com as linhas da lista: quem separa os dois é quem
 * faz os dois discordarem.
 */

require_once __DIR__ . '/candidatos-comum.php';  // o modelo do candidato e das listas
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_abas(), abrir_modal() — a moldura
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo
require_once __DIR__ . '/candidatos-form.php';

/**
 * Desenha a tela inteira, das abas aos seis modais.
 *
 * `$erro` e `$ok` são o único estado que vem de fora: eles nascem do recado
 * guardado na sessão pela ação anterior, que é assunto da rota.
 */
function tela_de_candidatos(?string $erro, ?string $ok): void
{
    $todos  = ler_candidatos();
    $listas = ler_listas();
    $noAr   = count(array_filter($todos, fn ($c) => $c['publicado']));
    $porId  = [];
    foreach ($todos as $c) {
        $porId[$c['id']] = $c;
    }

    /* Chegar por `?c=<id>` é chegar com o formulário de edição já aberto: o link
       "Editar" da tabela vira modal com JavaScript e vira página com o <dialog
       open> sem ele. Mesma peça, dois estados. */
    $editando = achar_candidato(limpar_texto($_GET['c'] ?? '', 40));

    /* Chegar por `?pessoa=<id>` é chegar para transformar em candidato alguém que JÁ
       está na lista de pessoas — veio de um encontro, se inscreveu, tem conta. O
       formulário abre com a ficha dela, e é ao SALVAR que ela vira candidata: virar o
       tipo no clique criaria candidato sem número, que é ficha que não pode ir ao ar
       e que ninguém lembra de completar depois.

       Só quem enxerga a lista de pessoas puxa dela. A tela de candidatos é sobre
       número de urna, que é informação pública; a lista de pessoas tem telefone e
       endereço, e a regra do painel é que dado pessoal acompanha a responsabilidade
       sobre ele, não o trabalho do dia. */
    $podePuxar = pode('pessoas');
    $dePessoa = null;
    if ($podePuxar && ($idPessoa = limpar_texto($_GET['pessoa'] ?? '', 40)) !== '') {
        $dePessoa = achar_pessoa($idPessoa);
        if ($dePessoa !== null && $dePessoa['tipo'] === 'candidato') {
            /* Já é candidata: o formulário certo é o de edição, e não um segundo
               cadastro em cima do mesmo id. */
            $editando = $dePessoa;
            $dePessoa = null;
        }
    }

    $aba = ($_GET['aba'] ?? '') === 'listas' ? 'listas' : 'candidatos';
    if ($editando !== null || $dePessoa !== null) {
        $aba = 'candidatos';   // cadastrar ou editar candidato é assunto desta aba
    }

    /* Quem ainda não é candidato, para o seletor. A-Z, que é como se procura gente. */
    $fora = [];
    if ($podePuxar) {
        $fora = array_values(array_filter(ler_pessoas(), fn ($x) => $x['tipo'] !== 'candidato'));
        usort($fora, fn ($a, $b) => strcmp(sem_acento($a['nome']), sem_acento($b['nome'])));
    }

    /* ---------------- recorte e ordem da lista ---------------- */

    $busca  = limpar_texto($_GET['q'] ?? '', 60);
    $cargoF = (string) ($_GET['cargo'] ?? '');
    if (!isset(CARGOS[$cargoF])) {
        $cargoF = '';
    }
    /* A ordem PADRÃO é a da colinha, e não a alfabética: numa colinha quem vem
       primeiro é decisão de campanha. A-Z é para achar alguém numa lista grande,
       que é outra pergunta — e por isso é escolha, não padrão. */
    $ordem = in_array($_GET['ordem'] ?? '', ['nome', 'numero', 'cargo'], true) ? (string) $_GET['ordem'] : 'colinha';

    $visiveis = $todos;
    if ($busca !== '') {
        /* O número casa por dígito, e não como texto: é o que a pessoa tem na mão
           quando quer conferir se o 1412 já está cadastrado. */
        $digitos = preg_replace('/\D/', '', $busca) ?? '';
        $visiveis = array_values(array_filter($visiveis, function ($c) use ($busca, $digitos) {
            if (combina_com([$c['nome'], $c['urna'], $c['partido'], $c['instagram'], rotulo_cargo($c['cargo'])], $busca)) {
                return true;
            }
            return $digitos !== '' && str_contains($c['numero'], $digitos);
        }));
    }
    if ($cargoF !== '') {
        $visiveis = array_values(array_filter($visiveis, fn ($c) => $c['cargo'] === $cargoF));
    }
    usort($visiveis, function ($a, $b) use ($ordem) {
        return match ($ordem) {
            'nome'   => strcmp(sem_acento($a['urna'] !== '' ? $a['urna'] : $a['nome']),
                               sem_acento($b['urna'] !== '' ? $b['urna'] : $b['nome'])),
            'numero' => strcmp($a['numero'], $b['numero']),
            'cargo'  => [rotulo_cargo($a['cargo']), sem_acento($a['nome'])]
                        <=> [rotulo_cargo($b['cargo']), sem_acento($b['nome'])],
            default  => [$a['ordem'], sem_acento($a['nome'])] <=> [$b['ordem'], sem_acento($b['nome'])],
        };
    });

    $porCargo = [];
    foreach ($todos as $c) {
        if ($c['cargo'] !== '') {
            $porCargo[$c['cargo']] = ($porCargo[$c['cargo']] ?? 0) + 1;
        }
    }

    /* ---------------- recorte das listas ----------------
       A mesma caixa `q` das duas abas: elas nunca são desenhadas ao mesmo tempo, e
       dois nomes de parâmetro fariam a busca sumir ao trocar de aba — que é
       exatamente o que `barra_abas()` existe para não deixar acontecer.

       Casa também pelo NOME DE QUEM ESTÁ DENTRO: a pergunta que traz alguém aqui
       quase sempre é "em que listas o Fulano está?", e não o nome da lista. */
    $listasVisiveis = $listas;
    if ($busca !== '') {
        $listasVisiveis = array_values(array_filter($listas, function ($l) use ($busca, $porId) {
            if (combina_com([$l['nome'], $l['descricao']], $busca)) {
                return true;
            }
            foreach ($l['candidatos'] as $cid) {
                if (isset($porId[$cid]) && combina_com([$porId[$cid]['nome'], $porId[$cid]['urna']], $busca)) {
                    return true;
                }
            }
            return false;
        }));
    }

    /* Qual lista está aberta para edição. É um GET, e não estado de JavaScript:
       sem JS a página recarrega com o `<dialog open>` e o formulário continua ali. */
    $listaEditando = null;
    if (isset($_GET['lista'])) {
        $listaEditando = achar_lista(limpar_texto((string) $_GET['lista'], 40));
    }

abrir_pagina('Candidatos');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Candidatos',
      'Cadastre quem é candidato; depois monte as listas que viram colinha em '
      . '<a href="/candidatos" target="_blank">/candidatos</a>.',
      null,
      null,
      [
          'Cadastrar é rápido: nome e número bastam. Foto, cargo e @ são opcionais.',
          'O cargo vem de lista, e é ele que confere o tamanho do número na hora de salvar.',
          'Publicar põe o candidato no ar; recolher tira dele todas as listas de uma vez.',
          'Lista é curadoria — o nome dela vira o título da colinha que circula no grupo.',
      ]
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php barra_abas([
      'candidatos' => ['nome' => 'Candidatos', 'conta' => count($todos)],
      'listas'     => ['nome' => 'Listas',     'conta' => count($listas)],
  ], $aba, 'aba', 'Candidatos e listas'); ?>

  <?php if ($aba === 'candidatos'): ?>
    <!-- ============ o cadastro ============ -->
    <fieldset id="cadastro">
      <legend>Candidatos (<?= $noAr ?> no ar de <?= count($todos) ?>)</legend>

      <div class="acoes" style="margin:0 0 18px">
        <?php botao_modal('novo-candidato', 'Novo candidato', 'aba=candidatos&novo=1'); ?>
        <?php if ($fora !== []): ?>
          <?php botao_modal('puxar-pessoa', 'Puxar da lista de pessoas', 'aba=candidatos&puxar=1', 'btn'); ?>
        <?php endif; ?>
      </div>

      <?php if ($todos === []): ?>
        <p class="dica" style="margin:0">
          Ninguém cadastrado ainda. Enquanto não houver lista publicada, o bloco da
          página inicial não aparece — é melhor não dizer nada do que deixar um buraco
          onde o eleitor espera um número.
        </p>
      <?php else: ?>
        <?php /* O filtro só aparece quando há o que filtrar: com quatro candidatos
                 ele é três controles em cima de uma lista que cabe na tela. */ ?>
        <?php if (count($todos) > 6 || $busca !== '' || $cargoF !== ''): ?>
          <?php
            /* Cargo que não tem ninguém sai da lista — oferecer o recorte que
               devolve tela vazia é oferecer um beco. O que está escolhido fica,
               mesmo zerado: senão o filtro some com a própria escolha. */
            $opcoesCargo = [];
            foreach (CARGOS as $chave => $cargo) {
                if (($porCargo[$chave] ?? 0) === 0 && $cargoF !== $chave) {
                    continue;
                }
                $opcoesCargo[$chave] = $cargo['nome'] . ' (' . (int) ($porCargo[$chave] ?? 0) . ')';
            }
            /* A ordem padrão daqui é a da COLINHA, e não o alfabeto: quem vem
               primeiro é quem se quer que seja lembrado primeiro. */
            barra_filtros(
                [
                    ['tipo' => 'busca', 'valor' => $busca, 'dica' => 'nome, número ou @'],
                    ['tipo' => 'escolha', 'nome' => 'cargo', 'rotulo' => 'Cargo',
                     'valor' => $cargoF, 'vazio' => 'todos', 'opcoes' => $opcoesCargo],
                    ['tipo' => 'escolha', 'nome' => 'ordem', 'rotulo' => 'Ordenar por',
                     'valor' => $ordem, 'opcoes' => [
                         'colinha' => 'ordem da colinha',
                         'nome'    => 'nome (A–Z)',
                         'numero'  => 'número',
                         'cargo'   => 'cargo',
                     ]],
                ],
                $busca !== '' || $cargoF !== '' || $ordem !== 'colinha',
                '/painel/candidatos.php',
                ['aba' => 'candidatos']
            );
          ?>
        <?php endif; ?>

        <?php if ($visiveis === []): ?>
          <?php nada_encontrado($busca, '/painel/candidatos.php?aba=candidatos', 'Nenhum candidato com esse recorte.'); ?>
        <?php else: ?>
          <div class="rolagem cartoes">
            <table class="tabela">
              <thead><tr><th></th><th>Quem</th><th>Número</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                <?php foreach ($visiveis as $c): ?>
                  <tr>
                    <?php /* O <td> abre e fecha colado no `if`: sem candidato com foto
                             ele sai VAZIO de verdade, e é isso que deixa o
                             `.cartoes td:empty` escondê-lo no celular. Com uma
                             quebra de linha solta aqui, o cartão ganharia um
                             buraco de 12px onde não há foto nenhuma. */ ?>
                    <td><?php if ($c['imagem'] !== ''): ?>
                      <img src="<?= h($c['imagem']) ?>" alt="" width="52" height="52"
                           style="width:52px;height:52px;object-fit:cover;border:2px solid var(--linha-2)">
                    <?php endif; ?></td>
                    <td>
                      <strong><?= h($c['urna'] !== '' ? $c['urna'] : $c['nome']) ?></strong><br>
                      <span class="dica">
                        <?= h(rotulo_cargo($c['cargo'])) ?><?= $c['partido'] !== '' ? ' · ' . h($c['partido']) : '' ?>
                        <?= $c['instagram'] !== '' ? ' · @' . h($c['instagram']) : '' ?>
                      </span>
                    </td>
                    <td class="meia" data-rotulo="Número"><strong style="font-size:19px"><?= h($c['numero']) ?></strong></td>
                    <td class="meia" data-rotulo="Estado">
                      <span class="selo <?= $c['publicado'] ? 'selo-ok' : 'selo-cinza' ?>">
                        <?= $c['publicado'] ? 'no ar' : 'rascunho' ?>
                      </span>
                    </td>
                    <td class="rodape">
                      <div class="acoes-celula">
                        <?php menu_acoes([
                            ['texto' => 'Editar', 'url' => '?aba=candidatos&c=' . urlencode($c['id']), 'modal' => 'editar-candidato'],
                            [
                                'texto'  => $c['publicado'] ? 'Recolher do site' : 'Publicar no site',
                                'acao'   => 'cand-publicar',
                                'campos' => ['id' => $c['id']],
                            ],
                            [
                                'texto'     => 'Tirar da chapa',
                                'acao'      => 'cand-apagar',
                                'campos'    => ['id' => $c['id']],
                                'confirmar' => 'Tirar ' . $c['nome'] . ' da chapa? A pessoa continua na lista, com o histórico dela.',
                                'risco'     => true,
                            ],
                        ]); ?>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php endif; ?>
      <?php endif; ?>
    </fieldset>

  <?php else: ?>
    <!-- ============ as listas ============ -->
    <fieldset id="listas">
      <legend>Listas (<?= count($listas) ?>)</legend>
      <p class="dica" style="margin:0 0 14px">
        Cada lista vira uma colinha no site, com o nome dela por título. A ordem em
        que os candidatos aparecem é a ordem da colinha — quem vem primeiro é quem
        você quer que seja lembrado primeiro.
      </p>

      <?php if ($todos === []): ?>
        <p class="dica" style="margin:0">
          Cadastre alguém na aba <strong>Candidatos</strong> primeiro. Lista vazia não
          aparece no site.
        </p>
      <?php else: ?>
        <div class="acoes" style="margin:0 0 18px">
          <?php botao_modal('nova-lista', 'Nova lista', 'aba=listas&nova=1'); ?>
        </div>

        <?php /* Só aparece quando há o que procurar: com três listas a caixa é um
                 controle em cima de algo que cabe inteiro na tela. */ ?>
        <?php if (count($listas) > 4 || $busca !== ''): ?>
          <?php barra_busca($busca, 'nome da lista, ou quem está nela', ['aba' => 'listas']); ?>
        <?php endif; ?>

        <?php if ($listasVisiveis === [] && $listas !== []): ?>
          <?php nada_encontrado($busca, '/painel/candidatos.php?aba=listas', 'Nenhuma lista com esse recorte.'); ?>
        <?php endif; ?>

        <?php if ($listas === []): ?>
          <p class="dica" style="margin:0">
            Nenhuma lista ainda. Sem lista publicada o bloco da página inicial não
            aparece — melhor não dizer nada do que deixar um buraco onde o eleitor
            espera um número.
          </p>
        <?php endif; ?>

        <?php foreach ($listasVisiveis as $l): ?>
          <?php $dentro = array_values(array_filter($l['candidatos'], fn ($id) => isset($porId[$id]))); ?>
          <article class="ficha">
            <header class="ficha-topo">
              <span class="ficha-quem">
                <strong><?= h($l['nome']) ?></strong>
                <span>
                  <?= count($dentro) ?> <?= count($dentro) === 1 ? 'candidato' : 'candidatos' ?>
                  <?= $l['descricao'] !== '' ? ' · ' . h($l['descricao']) : '' ?>
                </span>
              </span>
              <span>
                <span class="selo <?= $l['publicada'] ? 'selo-ok' : 'selo-cinza' ?>">
                  <?= $l['publicada'] ? 'no ar' : 'rascunho' ?>
                </span>
                <?php if ($l['naHome']): ?>
                  <span class="selo">na home</span>
                <?php endif; ?>
              </span>
            </header>

            <?php if ($dentro !== []): ?>
              <p style="margin:0 0 10px">
                <?php foreach ($dentro as $cid): ?>
                  <span class="selo"><?= h($porId[$cid]['numero']) ?> <?= h($porId[$cid]['urna'] !== '' ? $porId[$cid]['urna'] : $porId[$cid]['nome']) ?></span>
                <?php endforeach; ?>
              </p>
            <?php endif; ?>

            <details class="decidir">
              <summary class="btn">Quem entra nesta lista</summary>
              <div class="decidir-corpo">
                <form method="post">
                  <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                  <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                  <input type="hidden" name="acao" value="lista-quem">
                  <input type="hidden" name="ordem_ids" value="<?= h(implode(',', $l['candidatos'])) ?>">
                  <?php /* Com meia dúzia de candidatos o paredão cabe na tela; com
                           quarenta, achar um é rolar lendo. A peneira é do
                           navegador, e não um `<form get>`: recarregar no meio da
                           marcação jogaria fora o que ainda não foi salvo. */ ?>
                  <?php if (count($todos) > 8): ?>
                    <?php filtro_de_marcacao('quem-' . $l['id'], 'nome, número ou cargo'); ?>
                  <?php endif; ?>
                  <div id="quem-<?= h($l['id']) ?>">
                  <?php foreach ($todos as $c): ?>
                    <label class="check">
                      <input type="checkbox" name="candidato[]" value="<?= h($c['id']) ?>"
                             <?= in_array($c['id'], $l['candidatos'], true) ? 'checked' : '' ?>>
                      <strong><?= h($c['numero']) ?></strong>
                      <?= h($c['urna'] !== '' ? $c['urna'] : $c['nome']) ?>
                      <?php if ($c['cargo'] !== ''): ?>
                        <span class="dica"><?= h(rotulo_cargo($c['cargo'])) ?></span>
                      <?php endif; ?>
                      <?php if (!$c['publicado']): ?>
                        <span class="selo selo-cinza">rascunho</span>
                      <?php endif; ?>
                    </label>
                  <?php endforeach; ?>
                  </div>
                  <p class="dica">
                    Quem está como rascunho pode entrar na lista, mas não aparece no site
                    enquanto não for publicado.
                  </p>
                  <div class="acoes" style="margin-top:12px">
                    <button type="submit" class="btn btn-ouro">Salvar quem está na lista</button>
                  </div>
                </form>

                <div class="decidir-recusa">
                  <div class="acoes">
                    <?php /* Renomear é a ação mais frequente das quatro: lista é
                             conteúdo de campanha e o nome dela é o título da
                             colinha. Vem primeiro por isso. */ ?>
                    <?php botao_modal('editar-lista', 'Renomear', 'aba=listas&lista=' . urlencode($l['id']), 'btn'); ?>
                    <form method="post" style="display:inline">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                      <button class="btn" name="acao" value="lista-publicar" type="submit">
                        <?= $l['publicada'] ? 'Recolher do site' : 'Publicar no site' ?>
                      </button>
                    </form>
                    <form method="post" style="display:inline">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                      <button class="btn" name="acao" value="lista-home" type="submit">
                        <?= $l['naHome'] ? 'Tirar da página inicial' : 'Mostrar na página inicial' ?>
                      </button>
                    </form>
                    <form method="post" style="display:inline"
                          onsubmit="return confirm(<?= texto_js('Apagar a lista “' . $l['nome'] . '”? Os candidatos continuam cadastrados.') ?>)">
                      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                      <input type="hidden" name="id" value="<?= h($l['id']) ?>">
                      <button class="btn btn-risco" name="acao" value="lista-apagar" type="submit">Apagar a lista</button>
                    </form>
                  </div>
                </div>
              </div>
            </details>
          </article>
        <?php endforeach; ?>
      <?php endif; ?>
    </fieldset>
  <?php endif; ?>

  <?php /* ============ os modais ============
           Ficam no fim do documento, e não dentro do fieldset: <dialog> aninhado
           num formulário ou numa tabela é HTML inválido, e o navegador reorganiza
           a árvore sozinho — o formulário some sem erro nenhum no console. */ ?>
  <?php abrir_modal('novo-candidato', 'Novo candidato', isset($_GET['novo'])); ?>
    <?php formulario_candidato(null); ?>
  <?php fechar_modal(); ?>

  <?php if ($editando !== null): ?>
    <?php abrir_modal('editar-candidato', 'Editar ' . $editando['nome'], true); ?>
      <?php formulario_candidato($editando); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>

  <?php /* Puxar alguém da lista é um GET, e não um POST que já viraria o tipo:
           escolher o nome e cadastrar a candidatura são dois passos, e só o
           segundo muda alguma coisa. Sem JavaScript, o <select> recarrega a
           página com o formulário aberto — o mesmo desenho dos outros modais. */ ?>
  <?php if ($fora !== []): ?>
    <?php abrir_modal('puxar-pessoa', 'Puxar da lista de pessoas', isset($_GET['puxar'])); ?>
      <p class="dica" style="margin:0 0 12px">
        Quem já está no movimento não precisa de uma segunda ficha: escolha o nome e
        preencha só o que a candidatura acrescenta — número, cargo, @ e foto. O
        histórico dela (encontros, telefone, conta) continua o mesmo.
      </p>
      <form method="get">
        <input type="hidden" name="aba" value="candidatos">
        <div class="campo">
          <label for="c-pessoa">Quem</label>
          <select id="c-pessoa" name="pessoa" required>
            <option value="">— escolha —</option>
            <?php foreach ($fora as $x): ?>
              <option value="<?= h($x['id']) ?>">
                <?= h($x['nome']) ?><?= $x['cidade'] !== '' ? ' — ' . h($x['cidade']) : '' ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="acoes">
          <button class="btn btn-ouro" type="submit">Continuar</button>
        </div>
      </form>
    <?php fechar_modal(); ?>
  <?php endif; ?>

  <?php if ($dePessoa !== null): ?>
    <?php abrir_modal('candidato-de-pessoa', $dePessoa['nome'] . ' como candidato', true); ?>
      <p class="dica" style="margin:0 0 14px">
        Esta ficha já existe em <a href="/painel/pessoas.php?p=<?= h($dePessoa['id']) ?>">/painel/pessoas</a>.
        Salvar acrescenta a candidatura a ela — não cria um segundo cadastro.
      </p>
      <?php formulario_candidato($dePessoa, 'Cadastrar a candidatura'); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>

  <?php abrir_modal('nova-lista', 'Nova lista', isset($_GET['nova'])); ?>
    <?php formulario_lista(null); ?>
  <?php fechar_modal(); ?>

  <?php if ($listaEditando !== null): ?>
    <?php abrir_modal('editar-lista', 'Editar “' . $listaEditando['nome'] . '”', true); ?>
      <?php formulario_lista($listaEditando); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
    fechar_pagina();
}
