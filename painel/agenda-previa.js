/**
 * A prévia da capa da programação — /painel/agenda.
 *
 * Metade do `agenda.php` era este script. Ele desenha o cartão de cada item do
 * jeito que o site vai desenhar, cuida da imagem, do reordenar e do aviso de
 * trabalho não salvo — nada disso é regra de negócio, e nada disso precisava
 * estar dentro do PHP.
 *
 * SERVIDO DO PRÓPRIO DOMÍNIO, como as fontes e o desenhador de QR: a Política
 * de Privacidade promete que nada do visitante vai para fora, e o painel segue
 * a mesma regra.
 *
 * O QUE VEM DO PHP vem por `window.__AGENDA__`, carimbado antes desta tag —
 * o mesmo truque do `window.__PAINEL__` do Estúdio, e pelo mesmo motivo: são
 * três constantes que só o servidor conhece (o teto de upload, os rótulos de
 * plataforma e as cores dos temas), e um arquivo estático não as interpola.
 */
(function () {
  const caixa = document.getElementById('itens');
  const form = document.getElementById('form');
  const CONFIG = window.__AGENDA__ || {};
  const MAX_UPLOAD = CONFIG.maxUpload || 0;
  const ROTULO_PLATAFORMA = CONFIG.plataformas || {};
  const TEMAS = CONFIG.temas || {};


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
