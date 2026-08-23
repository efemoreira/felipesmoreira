<?php
declare(strict_types=1);

/**
 * Agenda da Semana — felipesmoreira.com/painel/agenda.php
 *
 * Roda na hospedagem (PHP da Hostinger) e grava a agenda em
 * public_html/dados/agenda.json. Essa pasta NÃO está no repositório, então um
 * novo deploy pelo hPanel não apaga o que foi editado aqui.
 *
 * Quem entra e quem pode abrir esta página é assunto do sessao.php — daqui para
 * baixo só se cuida da agenda em si.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/agenda-comum.php';
require_once __DIR__ . '/eventos-comum.php';  // a lista da programação vem dos encontros
exigir_area('agenda');


/**
 * A capa da programação, a partir do formulário.
 *
 * Só a capa: título, período, chamada e os canais. A LISTA vem dos encontros
 * (`itens_publicos()`), e não daqui — antes cada item era digitado nesta tela,
 * com data própria, enquanto o mesmo encontro era cadastrado de novo em
 * Encontros. Duas fichas para a mesma coisa é duas datas que divergem.
 */
function montar_agenda_do_post(array $post, array &$recados): array
{
    $canais = [];
    $marcados = is_array($post['canal'] ?? null) ? $post['canal'] : [];
    foreach (CANAIS_PADRAO as $canal) {
        if (in_array($canal['icone'], $marcados, true)) {
            $canais[] = $canal;
        }
    }

    return [
        'titulo'       => limpar_texto($post['titulo'] ?? '', 80) ?: 'Agenda da Semana',
        'periodo'      => limpar_texto($post['periodo'] ?? '', 80),
        'chamada'      => limpar_texto($post['chamada'] ?? '', 200),
        'disponivelEm' => $canais,
        'programacao'  => [],  // preenchida por quem chama, com itens_publicos()
        'atualizadoEm' => date('c'),
        'atualizadoPor' => (usuario_atual()['nome'] ?? ''),
    ];
}


/* ===================== fluxo ===================== */

$aviso = null;
$sucesso = null;
$recadoSessao = $_SESSION['recado'] ?? null;
unset($_SESSION['recado']);
if (($recadoSessao['tipo'] ?? '') === 'erro') {
    $aviso = $recadoSessao['texto'];
} elseif (($recadoSessao['tipo'] ?? '') === 'ok') {
    $sucesso = $recadoSessao['texto'];
}
$acao = (string) ($_POST['acao'] ?? '');
/* o que foi digitado, para devolver ao formulário quando a gravação falha */
$rascunho = null;

if ($acao === 'importar') {
    if (!token_valido()) {
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }
    /* Traz para Encontros o que já estava no agenda.json e nunca teve encontro.
       Roda uma vez: cada importado leva `importadoDe` com o id antigo, e o
       botão só aparece enquanto sobrar alguma linha sem par. Os backups
       rotativos do publicar() cobrem o desfazer. */
    $eventos = ler_eventos();
    /* Conhecido = o id É de um encontro (item que esta tela gerou a partir dele),
       ou já foi importado por um. Olhar só para `importadoDe` reimportaria tudo
       na segunda vez: depois da primeira importação o agenda.json é regerado com
       os ids dos ENCONTROS, e nenhum `importadoDe` aponta para eles. */
    $jaVeio = [];
    foreach ($eventos as $e) {
        $jaVeio[$e['id']] = true;
        if (($e['importadoDe'] ?? '') !== '') {
            $jaVeio[$e['importadoDe']] = true;
        }
    }

    $quantos = 0;
    foreach (agenda_atual()['programacao'] ?? [] as $it) {
        $id = (string) ($it['id'] ?? '');
        if ($id === '' || isset($jaVeio[$id])) {
            continue;
        }
        $inicio = inicio_iso(substr((string) ($it['inicio'] ?? ''), 0, 16));
        $eventos[] = [
            'id'      => novo_id_evento(),
            'titulo'  => (string) ($it['titulo'] ?? 'Sem nome'),
            /* Com plataforma é transmissão; sem, é ato de rua. É o palpite certo
               na maioria dos casos, e a coordenação corrige em dois cliques —
               melhor que deixar tudo em "militância" e esconder da agenda. */
            'familia' => ($it['plataforma'] ?? '') !== '' ? 'digital' : 'publico',
            'inicio'  => $inicio,
            'data'    => (string) ($it['data'] ?? ''),
            'hora'    => (string) ($it['hora'] ?? ''),
            'subtitulo'  => (string) ($it['subtitulo'] ?? ''),
            'cor'        => (string) ($it['cor'] ?? 'ouro'),
            'plataforma' => (string) ($it['plataforma'] ?? ''),
            'aoVivo'     => !empty($it['aoVivo']),
            'link'       => (string) ($it['link'] ?? ''),
            'imagem'     => (string) ($it['imagem'] ?? ''),
            'naAgenda'   => true,
            'status'  => estado_do_evento($inicio) === 'passado' ? 'realizado' : 'planejado',
            'token'   => bin2hex(random_bytes(10)),
            'tokenConfirmacao' => bin2hex(random_bytes(10)),
            'importadoDe' => $id,
            'criadoEm'  => date('c'),
            'criadoPor' => (usuario_atual()['nome'] ?? ''),
        ];
        $quantos++;
    }

    if ($quantos > 0 && gravar_eventos($eventos)) {
        republicar_agenda();
        $_SESSION['recado'] = ['tipo' => 'ok', 'texto' => $quantos . ' item(ns) viraram encontros. Confira a família de cada um.'];
    } elseif ($quantos === 0) {
        $_SESSION['recado'] = ['tipo' => 'ok', 'texto' => 'Nada a importar — tudo que estava na agenda já tem encontro.'];
    } else {
        $_SESSION['recado'] = ['tipo' => 'erro', 'texto' => 'Não consegui gravar em /dados.'];
    }
    header('Location: /painel/agenda.php', true, 302);
    exit;
}

if ($acao === 'salvar') {
    if (!token_valido()) {
        $aviso = 'Sessão expirada. Entre de novo — o que você digitou não foi salvo.';
        derrubar_sessao();
        header('Location: /painel/', true, 302);
        exit;
    }
    $recados = [];
    $nova = montar_agenda_do_post($_POST, $recados);
    /* A capa é o que se edita aqui; a lista sai sempre dos encontros. Deixar o
       formulário mandar a lista abriria caminho para uma tela desatualizada
       sobrescrever o que outra pessoa acabou de marcar em Encontros. */
    $nova['programacao'] = itens_publicos();
    if (publicar($nova)) {
        $sucesso = 'Capa publicada. A página já está mostrando o texto novo.';
        if ($recados) {
            $aviso = implode(' ', $recados) . ' O resto foi salvo normalmente.';
        }
    } else {
        $aviso = 'Não consegui gravar dados/agenda.json. Confira as permissões da pasta no hPanel. '
               . 'O que você digitou continua aqui na tela — tente publicar de novo.';
        // sem isto a tela recarregava do disco e o trabalho todo sumia junto com o erro
        $rascunho = $nova;
    }
} elseif ($acao === '' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && !$_POST) {
    // POST vazio com corpo grande = passou do post_max_size do PHP (upload pesado demais)
    $aviso = 'O envio passou do limite do servidor. Reduza a imagem (ou envie uma de cada vez) e tente de novo.';
}

$agenda = $rascunho ?? agenda_atual();
/* A lista vem dos ENCONTROS, e não do que estiver gravado no agenda.json: se
   alguém editou um encontro e a regravação falhou, a tela tem de mostrar a
   verdade (o que existe), não o retrato velho do arquivo. */
$itens = itens_publicos();

/* Sobrou item no agenda.json que nunca virou encontro? Só então o botão de
   importar aparece — o site rodou meses com a agenda digitada aqui, e esses
   itens precisam de um encontro para continuarem existindo. */
$orfas = 0;
/* Conhecido = o id É de um encontro (item que esta tela mesma gerou), ou já foi
   importado por um. Comparar só com `importadoDe` marcaria como órfão todo item
   regerado depois da importação: o id dele passa a ser o do encontro, e nenhum
   `importadoDe` aponta para ele. O botão então nunca sumia. */
$conhecidos = [];
foreach (ler_eventos() as $e) {
    $conhecidos[$e['id']] = true;
    if ($e['importadoDe'] !== '') {
        $conhecidos[$e['importadoDe']] = true;
    }
}
foreach (($agenda['programacao'] ?? []) as $it) {
    if (($it['id'] ?? '') !== '' && !isset($conhecidos[$it['id']])) {
        $orfas++;
    }
}
$canaisAtivos = array_column($agenda['disponivelEm'] ?? CANAIS_PADRAO, 'icone');

abrir_pagina('Agenda da semana');
?>
<div class="capa">
  <?php cabecalho_pagina(
      'Programação da semana',
      'Edite, salve e a página <a href="/programacao" target="_blank" rel="noopener">/programacao</a> '
      . 'muda na hora — sem publicar o site de novo.',
      null,
      null,
      [
          'Cada item tem UM horário; o dia, a data e a hora que aparecem no site saem dele.',
          'A hora é sempre a do Ceará, não a do servidor — digite o horário local e pronto.',
          'Item sem horário continua valendo: cai no fim da lista, sem “ao vivo”.',
          'A imagem é opcional; sem ela o cartão desenha a hachura do cordel.',
      ]
  ); ?>

  <?php recado($aviso, $sucesso); ?>

  <?php /* Rascunho: é a capa da programação pública, texto corrido escrito à
           mão — o tipo de coisa que dói perder. */ ?>
  <form method="post" id="form" enctype="multipart/form-data" data-rascunho="agenda-capa">
    <input type="hidden" name="acao" value="salvar">
    <input type="hidden" name="MAX_FILE_SIZE" value="<?= MAX_UPLOAD ?>">
    <input type="hidden" name="csrf" value="<?= h(token()) ?>">

    <fieldset>
      <legend>Cabeçalho</legend>
      <div class="linha g2">
        <div class="campo">
          <label for="t">Título</label>
          <input id="t" type="text" name="titulo" value="<?= h($agenda['titulo'] ?? '') ?>" maxlength="60">
          <p class="dica">A primeira palavra sai em ouro na página e na imagem.</p>
        </div>
        <div class="campo">
          <label for="p">Período</label>
          <input id="p" type="text" name="periodo" value="<?= h($agenda['periodo'] ?? '') ?>" maxlength="60" placeholder="29/07 a 01/08">
        </div>
      </div>
      <div class="campo">
        <label for="c">Chamada</label>
        <input id="c" type="text" name="chamada" value="<?= h($agenda['chamada'] ?? '') ?>" maxlength="200">
      </div>
      <div class="campo">
        <label>Disponível em</label>
        <div class="canais">
          <?php foreach (CANAIS_PADRAO as $canal): ?>
            <label class="check">
              <input type="checkbox" name="canal[]" value="<?= h($canal['icone']) ?>"
                <?= in_array($canal['icone'], $canaisAtivos, true) ? 'checked' : '' ?>>
              <?= h($canal['nome']) ?>
            </label>
          <?php endforeach; ?>
        </div>
      </div>
    </fieldset>

    <fieldset>
<legend>O que está no ar (<?= count($itens) ?>)</legend>
      <p class="dica" style="margin:0 0 14px">
        Esta lista não se edita aqui. <strong>Cada linha é um encontro</strong> —
        marcado em <a href="/painel/eventos.php">Encontros</a>, com a chave “aparecer
        na programação” ligada. Era o contrário antes: a live se cadastrava aqui e o
        encontro lá, os dois com data própria, e a mesma coisa existia duas vezes com
        duas datas que divergiam.
      </p>

      <?php if ($orfas > 0): ?>
        <form method="post" class="msg msg-erro" style="margin:0 0 16px">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="importar">
          <p style="margin:0 0 10px">
            <strong><?= $orfas ?> item(ns) da agenda antiga</strong> ainda não têm encontro.
            Eles foram digitados nesta tela quando a programação vivia aqui. Importe-os
            para continuarem aparecendo no site — depois confira a família de cada um.
          </p>
          <button class="btn" type="submit">Importar a agenda antiga</button>
        </form>
      <?php endif; ?>

      <?php if ($itens === []): ?>
        <p class="dica" style="margin:0">
          Nada na programação ainda. <a href="/painel/eventos.php">Marque um encontro</a> —
          ele entra aqui sozinho, porque o padrão é aparecer.
        </p>
      <?php else: ?>
        <div class="rolagem">
          <table class="tabela">
            <thead><tr><th>Quando</th><th>O quê</th><th>Onde</th><th></th></tr></thead>
            <tbody>
              <?php foreach ($itens as $it): ?>
                <tr>
                  <td>
                    <?php if (($it['inicio'] ?? '') !== ''): ?>
                      <strong><?= h($it['dia']) ?></strong><br>
                      <span class="dica"><?= h($it['data']) ?> · <?= h($it['hora']) ?></span>
                    <?php else: ?>
                      <span class="selo selo-cinza">sem horário</span>
                    <?php endif; ?>
                  </td>
                  <td>
                    <strong><?= h($it['titulo']) ?></strong>
                    <?php if (($it['subtitulo'] ?? '') !== ''): ?>
                      <br><span class="dica"><?= h($it['subtitulo']) ?></span>
                    <?php endif; ?>
                    <?php if (!empty($it['aoVivo'])): ?>
                      <span class="selo">ao vivo</span>
                    <?php endif; ?>
                  </td>
                  <td>
                    <?php if (($it['plataforma'] ?? '') !== ''): ?>
                      <span class="selo"><?= h(PLATAFORMAS[$it['plataforma']] ?? $it['plataforma']) ?></span>
                    <?php endif; ?>
                    <?php if (!empty($it['confirmar'])): ?>
                      <span class="selo selo-ok">aceita “Vou”</span>
                    <?php endif; ?>
                  </td>
                  <td><a class="btn btn-mini" href="/painel/eventos.php?e=<?= h($it['id']) ?>">Abrir</a></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </fieldset>

    <div class="barra acoes">
      <button class="btn btn-ouro" type="submit">Publicar</button>
      <a class="btn" href="/programacao" target="_blank" rel="noopener">Ver a página</a>
      <?php if (pode('estudio')): ?>
        <a class="btn" href="/painel/estudio.php">Estúdio de artes</a>
      <?php endif; ?>
    </div>
  </form>

  <datalist id="dias">
    <?php foreach (DIAS as $d): ?><option value="<?= h($d) ?>"></option><?php endforeach; ?>
  </datalist>
</div>

<script>
(function () {
  const caixa = document.getElementById('itens');
  const form = document.getElementById('form');
  const MAX_UPLOAD = <?= MAX_UPLOAD ?>;
  const ROTULO_PLATAFORMA = <?= json_encode(PLATAFORMAS, JSON_UNESCAPED_UNICODE) ?>;
  const TEMAS = <?= json_encode(TEMAS, JSON_UNESCAPED_UNICODE) ?>;

  let sujo = false;
  const marcarSujo = () => { sujo = true; };

  /* ---------- prévia do cartão ---------- */

  const DIAS_JS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

  /* Espelha o partes_de_exibicao() do PHP. Os dois precisam concordar: este
     desenha a prévia enquanto se digita, aquele grava o que vai para o site. */
  const exibicaoDe = (valor) => {
    if (!valor) return { dia: '', data: '', hora: '' };
    const d = new Date(valor);
    if (isNaN(d)) return { dia: '', data: '', hora: '' };
    const dois = (n) => String(n).padStart(2, '0');
    return {
      dia: DIAS_JS[d.getDay()],
      data: dois(d.getDate()) + '/' + dois(d.getMonth() + 1),
      hora: d.getMinutes() === 0 ? d.getHours() + 'H' : d.getHours() + ':' + dois(d.getMinutes()),
    };
  };

  const valorDe = (item, papel) => {
    const campo = item.querySelector('[data-papel="' + papel + '"]');
    return campo ? campo.value.trim() : '';
  };

  /**
   * Desenha o cartão como ele vai sair em /programacao.
   *
   * Escolher "azul" ou "papel" num <select> não diz nada até se ver o resultado;
   * e é aqui que se percebe um título longo demais ou um dia sem sigla.
   */
  function prever(item) {
    const previa = item.querySelector('.previa');
    if (!previa) return;
    previa.hidden = false;

    const tema = TEMAS[valorDe(item, 'cor')] || TEMAS.ouro;
    const cartao = previa.querySelector('.cartao');
    cartao.style.background = tema.bg;
    cartao.style.color = tema.fg;
    cartao.classList.toggle('claro', !!tema.claro);

    // mesma derivação do partes_de_exibicao() do PHP: uma data, três textos
    const { dia, data, hora } = exibicaoDe(valorDe(item, 'inicio'));
    const subtitulo = item.querySelector('[name*="[subtitulo]"]')?.value.trim() || '';

    previa.querySelector('.cartao-titulo').textContent = valorDe(item, 'titulo') || 'Sem título';
    const sub = previa.querySelector('.cartao-sub');
    sub.textContent = subtitulo;
    sub.style.color = tema.sub;
    previa.querySelector('.cartao-data').textContent = [data, hora].filter(Boolean).join(' · ');
    previa.querySelector('.cartao-dia').textContent = dia;

    // a miniatura: a imagem escolhida, ou o fundo hachurado com a sigla do dia
    const thumb = previa.querySelector('.cartao-thumb');
    const escolhida = item.querySelector('.miniatura img');
    const atual = thumb.querySelector('img');
    if (escolhida && atual?.src !== escolhida.src) {
      thumb.querySelector('img')?.remove();
      const img = document.createElement('img');
      img.alt = '';
      img.src = escolhida.src;
      thumb.appendChild(img);
    } else if (!escolhida) {
      atual?.remove();
    }
    thumb.classList.toggle('vazia', !escolhida);
    thumb.querySelector('.sigla').textContent = escolhida ? '' : dia.slice(0, 3).toUpperCase();

    // a etiqueta "Ao vivo" só existe na página, não no PNG
    let etiqueta = thumb.querySelector('.cartao-etiqueta');
    if (item.querySelector('[data-papel="aoVivo"]')?.checked) {
      if (!etiqueta) {
        etiqueta = document.createElement('span');
        etiqueta.className = 'cartao-etiqueta';
        etiqueta.textContent = 'Ao vivo';
        thumb.appendChild(etiqueta);
      }
    } else {
      etiqueta?.remove();
    }
  }

  /* ---------- resumo do cabeçalho ---------- */

  // Com os itens recolhidos, é este resumo que diz o que tem dentro.
  function resumir(item) {
    prever(item);
    const val = (papel) => valorDe(item, papel);
    const titulo = val('titulo');
    const e = exibicaoDe(val('inicio'));
    const partes = [e.dia, e.hora].filter(Boolean);
    const plataforma = val('plataforma');
    if (plataforma && ROTULO_PLATAFORMA[plataforma]) partes.push(ROTULO_PLATAFORMA[plataforma]);
    if (item.querySelector('[data-papel="aoVivo"]')?.checked) partes.push('ao vivo');

    const alvo = item.querySelector('.item-resumo');
    if (!alvo) return;
    alvo.innerHTML = '';

    const bolinha = document.createElement('i');
    bolinha.className = 'ponto ponto-' + (val('cor') || 'ouro');
    alvo.appendChild(bolinha);

    const forte = document.createElement('strong');
    forte.textContent = titulo || 'sem título';
    if (!titulo) forte.classList.add('vazio');
    alvo.appendChild(forte);

    if (partes.length) {
      const resto = document.createElement('span');
      resto.textContent = partes.join(' · ');
      alvo.appendChild(resto);
    }
  }

  const resumirTodos = () => caixa.querySelectorAll('.item').forEach(resumir);

  /* ---------- índices ---------- */

  // Renumera item[N][campo] e imagem[N] — o índice precisa casar com o $_FILES lá no PHP.
  // Os id/for também: sem isso, clicar no rótulo de um item foca o campo de outro.
  function renumerar() {
    caixa.querySelectorAll('.item').forEach((item, i) => {
      item.querySelector('.item-num').textContent = 'Item ' + (i + 1);
      item.querySelectorAll('[name]').forEach((campo) => {
        campo.name = campo.name.replace(/^(item|imagem)\[\d+\]/, (_, base) => base + '[' + i + ']');
      });
      item.querySelectorAll('[id^="it"]').forEach((campo) => {
        campo.id = campo.id.replace(/^it\d+-/, 'it' + i + '-');
      });
      item.querySelectorAll('label[for^="it"]').forEach((rot) => {
        rot.htmlFor = rot.htmlFor.replace(/^it\d+-/, 'it' + i + '-');
      });
    });
    resumirTodos();
  }

  /* ---------- imagem: escolher, soltar, colar ---------- */

  function mostrar(mini, arquivo) {
    const url = URL.createObjectURL(arquivo);
    mini.classList.remove('vazia');
    mini.innerHTML = '';
    const img = document.createElement('img');
    img.alt = '';
    img.src = url;
    img.onload = () => URL.revokeObjectURL(url);
    mini.appendChild(img);
  }

  /** Põe o arquivo no input daquele item — é ele que o PHP vai receber. */
  function usarArquivo(item, arquivo) {
    if (!arquivo || !arquivo.type.startsWith('image/')) return;
    if (arquivo.size > MAX_UPLOAD) {
      alert('“' + arquivo.name + '” passa de 8 MB. Reduza a imagem antes de enviar.');
      return;
    }
    const entrada = item.querySelector('input[type=file]');
    const lista = new DataTransfer();
    lista.items.add(arquivo);
    entrada.files = lista.files;
    // se estava marcado para remover, escolher uma nova desfaz isso
    const remover = item.querySelector('[name*="remover_imagem"]');
    if (remover) remover.checked = false;
    mostrar(item.querySelector('.miniatura'), arquivo);
    marcarSujo();
  }

  caixa.addEventListener('change', (e) => {
    marcarSujo();
    const campo = e.target;
    if (campo.type === 'file' && campo.files && campo.files[0]) {
      usarArquivo(campo.closest('.item'), campo.files[0]);
    }
    resumir(campo.closest('.item'));
  });
  caixa.addEventListener('input', (e) => {
    marcarSujo();
    resumir(e.target.closest('.item'));
  });

  caixa.addEventListener('dragover', (e) => {
    const mini = e.target.closest('.miniatura');
    if (!mini || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    mini.classList.add('sobre');
  });
  caixa.addEventListener('dragleave', (e) => {
    e.target.closest('.miniatura')?.classList.remove('sobre');
  });
  caixa.addEventListener('drop', (e) => {
    const mini = e.target.closest('.miniatura');
    if (!mini || !e.dataTransfer.files.length) return;
    e.preventDefault();
    mini.classList.remove('sobre');
    usarArquivo(mini.closest('.item'), e.dataTransfer.files[0]);
  });

  // colar uma captura direto no item em que se está mexendo
  document.addEventListener('paste', (e) => {
    const item = document.activeElement?.closest?.('.item');
    if (!item) return;
    const arquivo = Array.from(e.clipboardData?.files || [])[0];
    if (!arquivo) return;
    e.preventDefault();
    usarArquivo(item, arquivo);
  });

  /* ---------- botões do cabeçalho ---------- */

  function limpar(item) {
    item.querySelectorAll('input[type=text], input[type=hidden], input[type=file]').forEach((c) => (c.value = ''));
    item.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = false));
    item.querySelectorAll('select').forEach((s) => (s.selectedIndex = 0));
    const mini = item.querySelector('.miniatura');
    if (mini) {
      mini.classList.add('vazia');
      mini.innerHTML = '<span>solte<br>a imagem</span>';
    }
    item.querySelectorAll('.check').forEach((rot) => {
      if (rot.querySelector('[name*="remover_imagem"]')) rot.remove();
    });
  }

  caixa.addEventListener('click', (e) => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    // o cabeçalho é um <summary>: sem isto, cada botão abriria e fecharia o item
    e.preventDefault();
    const item = alvo.closest('.item');
    marcarSujo();

    if (alvo.hasAttribute('data-remover')) {
      if (caixa.querySelectorAll('.item').length === 1) { limpar(item); resumir(item); return; }
      if (confirm('Remover este item?')) { item.remove(); renumerar(); }
      return;
    }
    if (alvo.hasAttribute('data-duplicar')) {
      const copia = item.cloneNode(true);
      copia.open = true;
      // o id sai junto na cópia e dois itens com o mesmo id viram um só no PHP
      copia.querySelectorAll('[name*="[id]"]').forEach((c) => (c.value = ''));
      item.after(copia);
      renumerar();
      return;
    }
    const passo = alvo.getAttribute('data-mover');
    if (passo === '-1' && item.previousElementSibling) {
      item.parentNode.insertBefore(item, item.previousElementSibling);
      renumerar();
    } else if (passo === '1' && item.nextElementSibling) {
      item.parentNode.insertBefore(item.nextElementSibling, item);
      renumerar();
    }
  });

  /* ---------- reordenar arrastando ---------- */

  let arrastado = null;

  caixa.addEventListener('mousedown', (e) => {
    // só a pega inicia o arrasto: o resto do cabeçalho continua abrindo o item
    const item = e.target.closest('.pega') ? e.target.closest('.item') : null;
    if (item) item.draggable = true;
  });
  caixa.addEventListener('mouseup', () => {
    caixa.querySelectorAll('.item').forEach((i) => (i.draggable = false));
  });

  caixa.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.item');
    if (!item || !item.draggable) return;
    arrastado = item;
    item.classList.add('arrastando');
    e.dataTransfer.effectAllowed = 'move';
    // o Firefox exige algum dado para o arrasto acontecer
    e.dataTransfer.setData('text/plain', '');
  });

  caixa.addEventListener('dragover', (e) => {
    if (!arrastado) return;
    const sobre = e.target.closest('.item');
    if (!sobre || sobre === arrastado) return;
    e.preventDefault();
    const caixaSobre = sobre.getBoundingClientRect();
    const acima = e.clientY < caixaSobre.top + caixaSobre.height / 2;
    sobre.parentNode.insertBefore(arrastado, acima ? sobre : sobre.nextSibling);
  });

  caixa.addEventListener('dragend', () => {
    if (!arrastado) return;
    arrastado.classList.remove('arrastando');
    arrastado.draggable = false;
    arrastado = null;
    renumerar();
    marcarSujo();
  });

  /* ---------- adicionar ---------- */

  document.getElementById('add').addEventListener('click', () => {
    const modelo = caixa.querySelector('.item');
    const novo = modelo.cloneNode(true);
    novo.open = true;
    limpar(novo);
    caixa.appendChild(novo);
    renumerar();
    novo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    novo.querySelector('input[type=text]').focus();
    marcarSujo();
  });

  /* ---------- não perder o trabalho ---------- */

  form.addEventListener('submit', (e) => {
    // o servidor recusa o POST inteiro se a soma passar do limite dele, e aí
    // some tudo de uma vez; melhor barrar aqui, com o formulário ainda na tela
    let total = 0;
    caixa.querySelectorAll('input[type=file]').forEach((c) => {
      if (c.files && c.files[0]) total += c.files[0].size;
    });
    if (total > MAX_UPLOAD) {
      e.preventDefault();
      alert(
        'As imagens somam ' + (total / 1048576).toFixed(1) + ' MB, acima do limite de 8 MB por envio.\n\n' +
        'Publique agora sem parte delas e envie as que faltam num segundo envio.'
      );
      return;
    }
    sujo = false; // saiu para publicar: o aviso de saída não vale mais
  });

  window.addEventListener('beforeunload', (e) => {
    if (!sujo) return;
    e.preventDefault();
    e.returnValue = '';
  });

  resumirTodos();
})();
</script>
<?php
fechar_pagina();
