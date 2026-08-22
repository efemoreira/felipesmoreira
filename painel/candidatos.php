<?php
declare(strict_types=1);

/**
 * Candidatos — felipesmoreira.com/painel/candidatos
 *
 * DUAS COISAS SEPARADAS, e é a separação que faz a tela funcionar:
 *
 *   1. **Cadastrar** quem é candidato — nome, número, @, foto. Rápido, sem
 *      decisão nenhuma junto: registrar o número é urgente, classificar não.
 *   2. **Montar listas** — "Deputados federais", "As mulheres da chapa", "Os
 *      que eu apoio". É a lista que vira colinha no site.
 *
 * A primeira versão obrigava a marcar grupos fixos na hora do cadastro. Estava
 * errada nos dois lados: atrapalhava o cadastro (que só quer o número certo) e
 * engessava as listas em categorias decididas no código, quando lista é
 * conteúdo de campanha e muda toda semana.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/candidatos-comum.php';
require_once __DIR__ . '/pessoas-comum.php';
require_once __DIR__ . '/agenda-comum.php';  // o pipeline de imagem (upload, corte, apagar)
exigir_area('candidatos');

$eu = usuario_atual();

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

/**
 * Volta para a aba de onde a ação saiu.
 *
 * Era âncora (`#cadastro`), quando as duas listas viviam na mesma página. Com
 * abas, âncora não basta: `#listas` não existe na aba de candidatos, e quem
 * criasse uma lista voltaria para a tela de candidatos sem entender por quê.
 */
function voltar(string $aba = 'candidatos'): void
{
    header('Location: /painel/candidatos.php?aba=' . urlencode($aba), true, 302);
    exit;
}

/* ===================== ações ===================== */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!token_valido()) {
        avisar('erro', 'Sessão expirada. Entre de novo.');
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }

    $acao = (string) ($_POST['acao'] ?? '');

    /* ---------- candidatos ---------- */
    if (str_starts_with($acao, 'cand-')) {
        $pessoas = ler_pessoas();

        if ($acao === 'cand-novo' || $acao === 'cand-salvar') {
            $id = $acao === 'cand-novo' ? novo_id_pessoa() : limpar_texto($_POST['id'] ?? '', 40);
            $atual = achar_pessoa($id);

            /* A foto é opcional e não pode derrubar o cadastro: número certo no
               ar vale mais que rosto. Falha de upload avisa e segue. */
            $imagem = (string) ($atual['imagem'] ?? '');
            if (($env = arquivo_simples('imagem')) !== null) {
                $r = guardar_upload($env);
                if ($r['ok']) {
                    apagar_imagem($imagem);
                    $imagem = $r['caminho'];
                } elseif ($r['erro'] !== '') {
                    avisar('erro', $r['erro'] . ' O resto foi salvo.');
                }
            } elseif (!empty($_POST['tirarImagem'])) {
                apagar_imagem($imagem);
                $imagem = '';
            }

            /* Parte da ficha que JÁ EXISTE: um candidato pode ser alguém que já
               estava na lista (apareceu num encontro, tem conta). Sobrescrever a
               ficha inteira apagaria o telefone e o histórico dela. */
            $ficha = $atual ?? ['id' => $id, 'criadoEm' => date('c')];
            $ficha['tipo']   = 'candidato';
            $ficha['nome']   = $_POST['nome'] ?? ($ficha['nome'] ?? '');
            $ficha['urna']   = $_POST['urna'] ?? '';
            $ficha['cargo']  = $_POST['cargo'] ?? '';
            $ficha['numero'] = $_POST['numero'] ?? '';
            $ficha['partido'] = $_POST['partido'] ?? '';
            $ficha['instagram'] = normalizar_arroba($_POST['instagram'] ?? '');
            $ficha['imagem'] = $imagem;
            $ficha['ordem']  = $_POST['ordem'] ?? 0;

            if (normalizar_pessoa($ficha) === null || trim((string) $ficha['numero']) === '') {
                avisar('erro', 'Precisa de nome e número — sem o número não dá para votar, e a colinha existe para isso.');
                voltar('candidatos');
            }

            /* O cargo sabe quantos dígitos o número tem, então dá para conferir
               antes de o erro virar colinha. Vereador com quatro dígitos não é
               um número quase certo: é um voto que não vai para ninguém.

               O `isset` não é zelo: aqui `$ficha['cargo']` ainda é o POST CRU —
               `normalizar_pessoa()` acima devolveu uma cópia limpa e não mexeu
               nesta. Cargo inventado no POST cairia direto em `CARGOS[...]`. */
            $cargoEscolhido = isset(CARGOS[(string) $ficha['cargo']]) ? (string) $ficha['cargo'] : '';
            $digitos = strlen(preg_replace('/\D/', '', (string) $ficha['numero']) ?? '');
            if ($cargoEscolhido !== '' && $digitos !== CARGOS[$cargoEscolhido]['digitos']) {
                avisar('erro', sprintf(
                    'Número de %s tem %d dígitos, e esse tem %d. Confira antes de publicar — colinha com número errado é pior que colinha nenhuma.',
                    rotulo_cargo($cargoEscolhido),
                    CARGOS[$cargoEscolhido]['digitos'],
                    $digitos
                ));
                voltar('candidatos');
            }

            $achou = false;
            foreach ($pessoas as $i => $c) {
                if ($c['id'] === $id) {
                    $pessoas[$i] = $ficha;
                    $achou = true;
                }
            }
            if (!$achou) {
                $pessoas[] = $ficha;
            }
            avisar('ok', $atual === null ? 'Cadastrado. Publique quando o número estiver conferido.' : 'Alterado.');
        } else {
            $id = limpar_texto($_POST['id'] ?? '', 40);
            $achou = false;
            foreach ($pessoas as $i => $c) {
                if ($c['id'] !== $id) {
                    continue;
                }
                $achou = true;
                if ($acao === 'cand-apagar') {
                    /* NÃO apaga a pessoa: ela pode ter presença em encontro e um
                       histórico inteiro. Deixa de ser candidata, e é só. Quem
                       quiser sumir com ela de vez faz isso em /painel/pessoas. */
                    apagar_imagem($c['imagem']);
                    $pessoas[$i]['tipo'] = 'apoiador';
                    $pessoas[$i]['publicado'] = false;
                    $pessoas[$i]['imagem'] = '';
                    $pessoas[$i]['numero'] = '';
                    avisar('ok', 'Deixou de ser candidato. A pessoa continua na lista, com o histórico dela.');
                } elseif ($acao === 'cand-publicar') {
                    /* Sem número não vai ao ar. `candidatos_publicados()` já o
                       filtra na saída, então o site nunca quebrou — mas o painel
                       dizia "no ar" para uma ficha que o site não mostrava, e
                       painel que mente é pior que painel que recusa. */
                    if (!$c['publicado'] && $c['numero'] === '') {
                        avisar('erro', 'Falta o número. É ele que o eleitor digita — sem número não há o que publicar.');
                        voltar('candidatos');
                    }
                    $pessoas[$i]['publicado'] = !$c['publicado'];
                    avisar('ok', $pessoas[$i]['publicado'] ? 'No ar em /candidatos.' : 'Recolhido do site.');
                }
                break;
            }
            if (!$achou) {
                avisar('erro', 'Candidato não encontrado.');
                voltar();
            }
        }

        if (!gravar_pessoas(array_values($pessoas))) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar('candidatos');
    }

    /* ---------- listas ---------- */
    if (str_starts_with($acao, 'lista-')) {
        $listas = ler_listas();

        if ($acao === 'lista-nova') {
            $nova = [
                'id'    => novo_id_lista(),
                'nome'  => $_POST['nome'] ?? '',
                'descricao' => $_POST['descricao'] ?? '',
                'candidatos' => [],
                'publicada' => false,
                'naHome' => false,
                'ordem' => $_POST['ordem'] ?? 0,
                'criadoEm' => date('c'),
            ];
            if (normalizar_lista($nova) === null) {
                avisar('erro', 'Dê um nome à lista — é ele que aparece como título da colinha.');
                voltar('listas');
            }
            $listas[] = $nova;
            avisar('ok', 'Lista criada. Agora escolha quem entra nela.');
        } else {
            $id = limpar_texto($_POST['id'] ?? '', 40);
            $achou = false;
            foreach ($listas as $i => $l) {
                if ($l['id'] !== $id) {
                    continue;
                }
                $achou = true;
                if ($acao === 'lista-salvar') {
                    /* Só o que a curadoria decide: nome, descrição e ordem. Quem
                       entra continua sendo `lista-quem`, que é a outra pergunta —
                       e misturar as duas num formulário faria renomear a lista
                       reenviar a marcação inteira dos candidatos. */
                    $editada = $l;
                    $editada['nome']      = $_POST['nome'] ?? '';
                    $editada['descricao'] = $_POST['descricao'] ?? '';
                    $editada['ordem']     = $_POST['ordem'] ?? 0;
                    if (normalizar_lista($editada) === null) {
                        avisar('erro', 'Dê um nome à lista — é ele que aparece como título da colinha.');
                        voltar('listas');
                    }
                    $listas[$i] = $editada;
                    /* O nome da lista É o título da colinha que circula no
                       WhatsApp: mudá-lo com a lista no ar muda o que a próxima
                       colinha gerada vai dizer. As já baixadas continuam como
                       estavam — imagem no celular de alguém não se atualiza. */
                    avisar('ok', $l['publicada']
                        ? 'Lista salva. Ela está no ar, então o novo nome já é o título da colinha.'
                        : 'Lista salva.');
                } elseif ($acao === 'lista-apagar') {
                    unset($listas[$i]);
                    avisar('ok', 'Lista apagada. Os candidatos continuam cadastrados.');
                } elseif ($acao === 'lista-publicar') {
                    $listas[$i]['publicada'] = !$l['publicada'];
                    avisar('ok', $listas[$i]['publicada'] ? 'Lista no ar.' : 'Lista recolhida.');
                } elseif ($acao === 'lista-home') {
                    /* Uma só na home. Marcar a segunda desmarca a primeira em
                       vez de recusar: quem clicou já decidiu qual quer. */
                    foreach ($listas as $j => $outra) {
                        $listas[$j]['naHome'] = false;
                    }
                    $listas[$i]['naHome'] = !$l['naHome'];
                    avisar('ok', $listas[$i]['naHome'] ? 'É esta que aparece na página inicial.' : 'A home volta a não mostrar lista nenhuma.');
                } elseif ($acao === 'lista-quem') {
                    $marcados = array_map('strval', (array) ($_POST['candidato'] ?? []));
                    /* Preserva a ORDEM que a coordenação arrastou, e não a ordem
                       dos checkboxes: numa colinha quem vem primeiro é decisão. */
                    $ordenados = [];
                    foreach (explode(',', (string) ($_POST['ordem_ids'] ?? '')) as $cid) {
                        $cid = trim($cid);
                        if ($cid !== '' && in_array($cid, $marcados, true) && !in_array($cid, $ordenados, true)) {
                            $ordenados[] = $cid;
                        }
                    }
                    foreach ($marcados as $cid) {
                        if (!in_array($cid, $ordenados, true)) {
                            $ordenados[] = $cid;
                        }
                    }
                    $listas[$i]['candidatos'] = $ordenados;
                    avisar('ok', count($ordenados) . ' na lista “' . $l['nome'] . '”.');
                }
                break;
            }
            if (!$achou) {
                avisar('erro', 'Lista não encontrada.');
                voltar('listas');
            }
        }

        if (!gravar_listas(array_values($listas))) {
            avisar('erro', 'Não consegui gravar em /dados.');
        }
        voltar('listas');
    }

    avisar('erro', 'Ação desconhecida.');
    voltar();
}

/* ===================== a tela ===================== */

$recado = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
$erro = ($recado['tipo'] ?? '') === 'erro' ? $recado['texto'] : null;
$ok   = ($recado['tipo'] ?? '') === 'ok'   ? $recado['texto'] : null;
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

/**
 * O formulário do candidato — um só, desenhado em dois modais.
 *
 * Cadastrar e editar perguntam exatamente a mesma coisa; duas cópias do
 * formulário divergiriam no dia em que um campo novo entrasse só numa delas.
 */
function formulario_candidato(?array $editando, string $rotulo = ''): void
{
    /* O rótulo do botão é o único parâmetro a mais porque é a única coisa que
       muda entre os três usos: cadastrar do zero, editar quem já é candidato e
       acrescentar a candidatura a quem já está na lista de pessoas. */
    if ($rotulo === '') {
        $rotulo = $editando ? 'Salvar' : 'Cadastrar';
    }
    ?>
    <form method="post" enctype="multipart/form-data">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <?php if ($editando): ?>
        <input type="hidden" name="id" value="<?= h($editando['id']) ?>">
      <?php endif; ?>
      <div class="linha g2">
        <div class="campo">
          <label for="c-nome<?= $editando ? '-e' : '' ?>">Nome</label>
          <input id="c-nome<?= $editando ? '-e' : '' ?>" name="nome" type="text" maxlength="80" required
                 value="<?= h($editando['nome'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="c-numero<?= $editando ? '-e' : '' ?>">Número</label>
          <input id="c-numero<?= $editando ? '-e' : '' ?>" name="numero" type="text" inputmode="numeric" maxlength="6" required
                 value="<?= h($editando['numero'] ?? '') ?>">
          <p class="dica">O que se digita na urna. É a única coisa, além do nome, que não pode faltar.</p>
        </div>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="c-urna<?= $editando ? '-e' : '' ?>">Nome de urna <span class="dica">— opcional</span></label>
          <input id="c-urna<?= $editando ? '-e' : '' ?>" name="urna" type="text" maxlength="60"
                 value="<?= h($editando['urna'] ?? '') ?>" placeholder="como aparece na urna">
        </div>
        <div class="campo">
          <label for="c-cargo<?= $editando ? '-e' : '' ?>">Cargo <span class="dica">— opcional</span></label>
          <select id="c-cargo<?= $editando ? '-e' : '' ?>" name="cargo">
            <option value="">Sem cargo definido</option>
            <?php foreach (CARGOS as $chave => $cargo): ?>
              <option value="<?= h($chave) ?>" <?= ($editando['cargo'] ?? '') === $chave ? 'selected' : '' ?>>
                <?= h($cargo['nome']) ?> — <?= (int) $cargo['digitos'] ?> dígitos
              </option>
            <?php endforeach; ?>
          </select>
          <p class="dica">
            Escolhido o cargo, o número é conferido pelo tamanho ao salvar.
            <strong>Vice e suplente levam o número do titular</strong> — é nele
            que se vota, e é ele que o eleitor digita.
          </p>
        </div>
      </div>
      <div class="linha g3">
        <div class="campo">
          <label for="c-partido<?= $editando ? '-e' : '' ?>">Partido <span class="dica">— opcional</span></label>
          <?php /* "Missão" é sugestão para ficha NOVA — inclusive a de quem foi
                   puxado da lista de pessoas. Numa candidatura que já existe o
                   campo mostra o que está gravado, mesmo vazio: quem apagou o
                   partido apagou de propósito. */ ?>
          <?php $partidoPadrao = ($editando['tipo'] ?? '') === 'candidato' ? '' : 'Missão'; ?>
          <input id="c-partido<?= $editando ? '-e' : '' ?>" name="partido" type="text" maxlength="40"
                 value="<?= h(($editando['partido'] ?? '') !== '' ? $editando['partido'] : $partidoPadrao) ?>">
        </div>
        <div class="campo">
          <label for="c-insta<?= $editando ? '-e' : '' ?>">Instagram <span class="dica">— opcional</span></label>
          <input id="c-insta<?= $editando ? '-e' : '' ?>" name="instagram" type="text" maxlength="60"
                 value="<?= $editando && $editando['instagram'] !== '' ? '@' . h($editando['instagram']) : '' ?>"
                 placeholder="@perfil">
          <p class="dica">Só o @, ou cole o link — dá na mesma.</p>
        </div>
        <div class="campo">
          <label for="c-ordem<?= $editando ? '-e' : '' ?>">Ordem na colinha</label>
          <input id="c-ordem<?= $editando ? '-e' : '' ?>" name="ordem" type="number" min="0" max="999"
                 value="<?= (int) ($editando['ordem'] ?? 0) ?>">
          <p class="dica">Menor primeiro. Empate desempata pelo nome.</p>
        </div>
      </div>
      <div class="campo">
        <label for="c-img<?= $editando ? '-e' : '' ?>">Foto <span class="dica">— opcional</span></label>
        <?php if ($editando && $editando['imagem'] !== ''): ?>
          <p><img src="<?= h($editando['imagem']) ?>" alt="" style="max-width:180px;border:3px solid var(--linha-2)"></p>
          <label class="check">
            <input type="checkbox" name="tirarImagem" value="1"> Remover esta foto
          </label>
        <?php endif; ?>
        <input id="c-img<?= $editando ? '-e' : '' ?>" name="imagem" type="file" accept="image/*">
        <p class="dica">
          JPG, PNG ou WEBP até 8 MB. Sem foto o cartão mostra o número grande, que é o
          que o eleitor precisa mesmo levar.
        </p>
      </div>

      <div class="acoes">
        <button class="btn btn-ouro" name="acao" value="<?= $editando ? 'cand-salvar' : 'cand-novo' ?>" type="submit">
          <?= h($rotulo) ?>
        </button>
        <?php if ($editando): ?>
          <a class="btn" href="/painel/candidatos.php">Cancelar</a>
        <?php endif; ?>
      </div>
    </form>
    <?php
}

/**
 * O formulário da lista — um só, desenhado em dois modais.
 *
 * Criar e renomear perguntam exatamente a mesma coisa (nome, descrição e
 * ordem); QUEM entra continua sendo a outra pergunta, respondida no
 * `lista-quem` de dentro da ficha. Duas cópias deste formulário divergiriam no
 * dia em que um campo novo entrasse só numa delas.
 */
function formulario_lista(?array $l): void
{
    $e = $l !== null ? '-e' : '';
    ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <?php if ($l !== null): ?>
        <input type="hidden" name="id" value="<?= h($l['id']) ?>">
      <?php endif; ?>
      <div class="campo">
        <label for="l-nome<?= $e ?>">Nome da lista</label>
        <input id="l-nome<?= $e ?>" name="nome" type="text" maxlength="60" required
               placeholder="Deputados federais" value="<?= h($l['nome'] ?? '') ?>">
        <p class="dica">Vira o título da colinha. Escreva como você diria no grupo.</p>
      </div>
      <div class="linha g2">
        <div class="campo">
          <label for="l-desc<?= $e ?>">Descrição <span class="dica">— opcional</span></label>
          <input id="l-desc<?= $e ?>" name="descricao" type="text" maxlength="160"
                 value="<?= h($l['descricao'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="l-ordem<?= $e ?>">Ordem</label>
          <input id="l-ordem<?= $e ?>" name="ordem" type="number" min="0" max="999"
                 value="<?= (int) ($l['ordem'] ?? 0) ?>">
        </div>
      </div>
      <?php if ($l !== null && $l['publicada']): ?>
        <p class="dica">
          Esta lista está no ar: o novo nome já vira o título da próxima colinha gerada.
          As que já foram baixadas continuam com o nome antigo — imagem no celular de
          alguém não se atualiza sozinha.
        </p>
      <?php endif; ?>
      <div class="acoes">
        <button class="btn btn-ouro" name="acao" value="<?= $l !== null ? 'lista-salvar' : 'lista-nova' ?>" type="submit">
          <?= $l !== null ? 'Salvar a lista' : 'Criar lista' ?>
        </button>
      </div>
    </form>
    <?php
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
          <form method="get" class="filtros">
            <input type="hidden" name="aba" value="candidatos">
            <div class="campo">
              <label for="q">Procurar</label>
              <input id="q" name="q" type="search" maxlength="60" value="<?= h($busca) ?>"
                     placeholder="nome, número ou @">
            </div>
            <div class="campo">
              <label for="fc">Cargo</label>
              <select id="fc" name="cargo">
                <option value="">todos</option>
                <?php foreach (CARGOS as $chave => $cargo): ?>
                  <?php if (($porCargo[$chave] ?? 0) === 0 && $cargoF !== $chave) { continue; } ?>
                  <option value="<?= h($chave) ?>" <?= $cargoF === $chave ? 'selected' : '' ?>>
                    <?= h($cargo['nome']) ?> (<?= (int) ($porCargo[$chave] ?? 0) ?>)
                  </option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="campo">
              <label for="fo">Ordenar por</label>
              <select id="fo" name="ordem">
                <option value="colinha" <?= $ordem === 'colinha' ? 'selected' : '' ?>>ordem da colinha</option>
                <option value="nome"    <?= $ordem === 'nome'    ? 'selected' : '' ?>>nome (A–Z)</option>
                <option value="numero"  <?= $ordem === 'numero'  ? 'selected' : '' ?>>número</option>
                <option value="cargo"   <?= $ordem === 'cargo'   ? 'selected' : '' ?>>cargo</option>
              </select>
            </div>
            <div class="acoes">
              <button class="btn" type="submit">Filtrar</button>
              <?php if ($busca !== '' || $cargoF !== '' || $ordem !== 'colinha'): ?>
                <a class="btn" href="/painel/candidatos.php">Limpar</a>
              <?php endif; ?>
            </div>
          </form>
        <?php endif; ?>

        <?php if ($visiveis === []): ?>
          <?php nada_encontrado($busca, '/painel/candidatos.php?aba=candidatos', 'Nenhum candidato com esse recorte.'); ?>
        <?php else: ?>
          <div class="rolagem">
            <table class="tabela">
              <thead><tr><th></th><th>Quem</th><th>Número</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                <?php foreach ($visiveis as $c): ?>
                  <tr>
                    <td>
                      <?php if ($c['imagem'] !== ''): ?>
                        <img src="<?= h($c['imagem']) ?>" alt="" width="52" height="52"
                             style="width:52px;height:52px;object-fit:cover;border:2px solid var(--linha-2)">
                      <?php endif; ?>
                    </td>
                    <td>
                      <strong><?= h($c['urna'] !== '' ? $c['urna'] : $c['nome']) ?></strong><br>
                      <span class="dica">
                        <?= h(rotulo_cargo($c['cargo'])) ?><?= $c['partido'] !== '' ? ' · ' . h($c['partido']) : '' ?>
                        <?= $c['instagram'] !== '' ? ' · @' . h($c['instagram']) : '' ?>
                      </span>
                    </td>
                    <td><strong style="font-size:19px"><?= h($c['numero']) ?></strong></td>
                    <td>
                      <span class="selo <?= $c['publicado'] ? 'selo-ok' : 'selo-cinza' ?>">
                        <?= $c['publicado'] ? 'no ar' : 'rascunho' ?>
                      </span>
                    </td>
                    <td>
                      <a class="btn btn-mini" data-modal="editar-candidato"
                         href="?aba=candidatos&c=<?= h($c['id']) ?>">Editar</a>
                      <form method="post" style="display:inline">
                        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                        <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                        <button class="btn btn-mini" name="acao" value="cand-publicar" type="submit">
                          <?= $c['publicado'] ? 'Recolher' : 'Publicar' ?>
                        </button>
                      </form>
                      <form method="post" style="display:inline"
                            onsubmit="return confirm(<?= texto_js('Tirar ' . $c['nome'] . ' da chapa? A pessoa continua na lista, com o histórico dela.') ?>)">
                        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                        <input type="hidden" name="id" value="<?= h($c['id']) ?>">
                        <button class="btn btn-mini btn-risco" name="acao" value="cand-apagar" type="submit">Tirar da chapa</button>
                      </form>
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
