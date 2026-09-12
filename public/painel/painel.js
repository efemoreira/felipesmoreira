/**
 * O JavaScript comum do painel — o que toda tela usa.
 *
 * Morava inline no `fechar_pagina()` de `layout.php`: 320 linhas retransmitidas
 * em toda página, sem cache, e o que impedia uma Content-Security-Policy
 * (script inline exige nonce em cada página). Agora é arquivo, servido com
 * `?v=VERSAO_ESTILO` como o `painel.css`: muda o arquivo, sobe a versão.
 *
 * Tudo aqui degrada sem JavaScript: modal via `?novo=1` + `<dialog open>`,
 * tema via POST em `tema.php`, gaveta via `<details>`. O que o JS faz é só
 * encurtar o caminho.
 */
/* COPIAR TEXTO — um ouvinte só, para o painel inteiro.
   `data-copiar` aparece na fila de inscrições e na escala do encontro, e
   vai aparecer em toda tela que passe a produzir mensagem pronta: o
   painel não é onde o trabalho acontece, é de onde sai o texto. Um
   bloco de script por tela seria a mesma função escrita cinco vezes.

   `navigator.clipboard` não existe fora de HTTPS nem em navegador
   antigo, e falhar em silêncio é o pior caso: a pessoa cola uma
   mensagem velha achando que copiou a nova. */
/* CONFIRMAR ANTES DE ENVIAR — `data-confirmar="pergunta"` no <form>.
   Era `onsubmit="return confirm(…)"` em doze formulários; saiu de lá porque
   handler inline é o que a Content-Security-Policy proíbe (e proíbe com razão:
   é o vetor clássico do XSS). O texto vem do atributo, já escapado pelo h(). */
document.addEventListener('submit', function (ev) {
  var form = ev.target;
  if (form instanceof HTMLFormElement && form.dataset.confirmar !== undefined) {
    if (!window.confirm(form.dataset.confirmar)) ev.preventDefault();
  }
});

/* ENVIAR AO MUDAR — `data-envia-ao-mudar` num <select>: o filtro sem botão. */
document.addEventListener('change', function (ev) {
  var el = ev.target;
  if (el instanceof HTMLSelectElement && el.dataset.enviaAoMudar !== undefined && el.form) {
    el.form.submit();
  }
});

document.addEventListener('click', function (ev) {
  var botao = ev.target.closest('[data-copiar]');
  if (!botao) { return; }
  var antes = botao.textContent;
  var avisar = function (recado) {
    botao.textContent = recado;
    setTimeout(function () { botao.textContent = antes; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(botao.dataset.copiar).then(
      function () { avisar('Copiado'); },
      function () { avisar('Não deu — copie à mão'); }
    );
  } else {
    avisar('Não deu — copie à mão');
  }
});

/* O tema já veio certo do servidor. Este script só existe para a troca
   ser instantânea em vez de recarregar a página — sem ele o formulário
   posta em tema.php e funciona igual, só que com um pisca de recarga. */
(function () {
  var seguro = location.protocol === 'https:' ? ';secure' : '';
  document.querySelectorAll('form.tema button').forEach(function (botao) {
    botao.addEventListener('click', function (e) {
      e.preventDefault();
      var escolhido = botao.value;
      document.cookie = 'painel_tema=' + escolhido +
        ';path=/painel;max-age=31536000;samesite=lax' + seguro;
      if (escolhido === 'sistema') {
        delete document.documentElement.dataset.tema;
      } else {
        document.documentElement.dataset.tema = escolhido;
      }
      // as duas cópias do seletor (lateral e gaveta) acompanham
      document.querySelectorAll('form.tema button').forEach(function (outro) {
        outro.setAttribute('aria-pressed', outro.value === escolhido ? 'true' : 'false');
      });
    });
  });

  /* Modal: um link com data-modal="id" vira caixa de diálogo.
     O link continua sendo um LINK de verdade — sem JavaScript, ou em
     navegador sem <dialog>, o href leva a `?novo=1` e a página volta com
     o <dialog open> no corpo, que é um bloco comum. Com JS ele nunca
     navega: abre por cima, com foco preso e Esc fechando. */
  document.querySelectorAll('a[data-modal]').forEach(function (elo) {
    var caixa = document.getElementById(elo.dataset.modal);
    if (!caixa || typeof caixa.showModal !== 'function') return;
    elo.addEventListener('click', function (e) {
      e.preventDefault();
      caixa.showModal();
    });
  });
  /* Aberto pelo servidor (a pessoa chegou por `?novo=1`, ou o formulário
     voltou com erro): vira camada de verdade, em vez de bloco no meio da
     página. Removido antes para o showModal() não recusar. */
  document.querySelectorAll('dialog.modal[open]').forEach(function (caixa) {
    if (typeof caixa.showModal !== 'function') return;
    caixa.removeAttribute('open');
    caixa.showModal();
  });

  /* O MENU DE TRÊS PONTINHOS.

     O <details> já abre e fecha sozinho; este trecho conserta as três
     coisas que ele não faz. A primeira é fechar o vizinho — dois menus
     abertos ao mesmo tempo é a lista com duas colunas de ações de
     novo. A segunda é Esc e clique fora, que todo menu do mundo tem.

     A terceira é o recorte: `.rolagem` é `overflow-x:auto`, e overflow
     num eixo recorta os dois — a caixa da última linha sairia cortada
     pela borda da tabela. `position:fixed`, medido na hora da abertura,
     tira a caixa do recorte sem tirá-la de dentro do <details>, que é
     quem guarda o estado e a semântica. */
  var menus = document.querySelectorAll('details.menu-acoes');
  function fecharMenus(exceto) {
    menus.forEach(function (m) { if (m !== exceto) m.open = false; });
  }
  menus.forEach(function (menu) {
    var botao = menu.querySelector('summary');
    var caixa = menu.querySelector('.menu-caixa');
    if (!botao || !caixa) return;

    menu.addEventListener('toggle', function () {
      if (!menu.open) {
        caixa.removeAttribute('style');
        return;
      }
      fecharMenus(menu);

      var r = botao.getBoundingClientRect();
      /* Zerado antes de medir: a caixa precisa estar em `fixed` para
         as medidas valerem, e sem left/top ela ficaria onde o
         `absolute` do CSS a tinha deixado. */
      caixa.style.position = 'fixed';
      caixa.style.right = 'auto';
      caixa.style.left = '0px';
      caixa.style.top = '0px';
      var largura = caixa.offsetWidth;
      var altura = caixa.offsetHeight;
      /* Alinhada pela direita do botão, e trazida para dentro da tela
         nas duas pontas: o menu da última coluna encosta na margem. */
      var x = Math.min(r.right - largura, window.innerWidth - largura - 8);
      var y = r.bottom + 6;
      /* Sem espaço embaixo (a última linha da lista), abre para cima. */
      if (y + altura > window.innerHeight - 8) y = Math.max(8, r.top - altura - 6);
      caixa.style.left = Math.max(8, x) + 'px';
      caixa.style.top = y + 'px';
    });
  });
  if (menus.length) {
    document.addEventListener('click', function (e) {
      menus.forEach(function (m) {
        if (m.open && !m.contains(e.target)) m.open = false;
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fecharMenus(null);
    });
    /* Rolar com o menu aberto arrastaria a caixa fixa para longe do
       botão que a abriu. Fechar é mais honesto do que persegui-lo. */
    window.addEventListener('scroll', function () { fecharMenus(null); }, true);
    window.addEventListener('resize', function () { fecharMenus(null); });
  }

  /* A peneira dos paredões de checkbox. Esconde o que não casa, sem
     tocar no que está marcado e sem recarregar — recarregar no meio da
     marcação jogaria fora tudo que ainda não foi salvo.

     Ignora acento e caixa dos dois lados, como o `combina_com()` do
     PHP. O jeito certo de fazer isso em JavaScript é `normalize("NFD")`
     mais o corte dos diacríticos: o Unicode define o resultado, então
     ele é o mesmo em qualquer navegador. */
  function semAcento(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  document.querySelectorAll('input[data-peneira]').forEach(function (caixa) {
    var alvo = document.getElementById(caixa.dataset.peneira);
    if (!alvo) return;
    var itens = alvo.querySelectorAll('label.check');
    if (itens.length === 0) return;
    var campo = caixa.closest('.campo-peneira');
    if (campo) campo.hidden = false;   // só existe onde de fato peneira
    caixa.addEventListener('input', function () {
      var procurado = semAcento(caixa.value.trim());
      itens.forEach(function (item) {
        item.hidden = procurado !== '' &&
          semAcento(item.textContent || '').indexOf(procurado) < 0;
      });
    });
  });

  /* ---------- rascunho de formulário longo ----------
     Formulário longo no celular perde para qualquer coisa: a sessão
     expira, o WhatsApp chama, o navegador descarta a aba. Quem entra
     aqui é `<form data-rascunho="<chave>">`, e só ele.

     NUNCA APLICA SOZINHO. Guarda a cada digitada e, na volta, OFERECE
     — num formulário de edição, aplicar por conta própria escreveria
     por cima do que o servidor diz, que é o defeito "ele desfez a minha
     correção" e não tem como ser investigado depois.

     O QUE NÃO É GUARDADO: campo escondido (o CSRF muda a cada sessão e
     restaurá-lo velho reprovaria o envio), senha e arquivo. Nem daria:
     `<input type=file>` não tem valor que se escreva de volta.

     Fica no aparelho de quem digitou, some ao enviar, e vence em 12h —
     ninguém volta a um rascunho de anteontem, e dado de gente não deve
     envelhecer no navegador de ninguém. Sair do painel apaga todos.

     Tudo dentro de try/catch: em aba anônima o localStorage existe e
     lança na hora de escrever, e um formulário que não abre por causa
     do rascunho é pior do que não ter rascunho. */
  var VALIDADE_RASCUNHO = 12 * 60 * 60 * 1000;

  function campoVale(c) {
    return c.name && !c.disabled &&
      ['hidden', 'password', 'file', 'submit', 'button', 'reset'].indexOf(c.type) < 0;
  }
  function lerFormulario(form) {
    var dados = {};
    form.querySelectorAll('input, textarea, select').forEach(function (c) {
      if (!campoVale(c)) return;
      if (c.type === 'checkbox' || c.type === 'radio') {
        if (c.checked) (dados[c.name] = dados[c.name] || []).push(c.value);
      } else if (c.value !== '') {
        dados[c.name] = c.value;
      }
    });
    return dados;
  }
  function aplicar(form, dados) {
    form.querySelectorAll('input, textarea, select').forEach(function (c) {
      if (!campoVale(c)) return;
      if (c.type === 'checkbox' || c.type === 'radio') {
        c.checked = (dados[c.name] || []).indexOf(c.value) >= 0;
      } else if (Object.prototype.hasOwnProperty.call(dados, c.name)) {
        c.value = dados[c.name];
      }
    });
  }

  document.querySelectorAll('form[data-rascunho]').forEach(function (form) {
    var chave = 'rascunho:' + form.dataset.rascunho;
    var apagar = function () { try { localStorage.removeItem(chave); } catch (e) {} };

    var guardado = null;
    try {
      var cru = localStorage.getItem(chave);
      if (cru) {
        var pacote = JSON.parse(cru);
        if (Date.now() - pacote.em < VALIDADE_RASCUNHO) {
          guardado = pacote.dados;
        } else {
          apagar();
        }
      }
    } catch (e) { guardado = null; }

    /* Só oferece o que de fato difere do que está na tela: um rascunho
       igual ao formulário é uma faixa que assusta sem ter novidade. E
       rascunho VAZIO não é rascunho — oferecer "recuperar" o que não
       tem conteúdo nenhum é oferecer apagar o formulário. */
    if (guardado && Object.keys(guardado).length > 0 &&
        JSON.stringify(guardado) !== JSON.stringify(lerFormulario(form))) {
      var faixa = document.createElement('div');
      faixa.className = 'rascunho-aviso';
      faixa.setAttribute('role', 'status');
      faixa.innerHTML =
        '<p>Você tinha coisa digitada aqui e não chegou a salvar.</p>' +
        '<div class="acoes">' +
        '<button type="button" class="btn btn-mini btn-ouro">Recuperar</button>' +
        '<button type="button" class="btn btn-mini">Descartar</button>' +
        '</div>';
      var botoes = faixa.querySelectorAll('button');
      botoes[0].addEventListener('click', function () {
        aplicar(form, guardado);
        /* Trocar valor por código não dispara evento nenhum, e quem
           desenha prévia a partir do formulário ficaria mostrando o
           estado anterior ao rascunho recuperado. */
        form.dispatchEvent(new Event('change', { bubbles: true }));
        faixa.remove();
      });
      botoes[1].addEventListener('click', function () {
        apagar();
        faixa.remove();
      });
      form.insertBefore(faixa, form.firstChild);
    }

    var pendente = null;
    form.addEventListener('input', function () {
      // uma gravação por pausa de digitação, e não uma por tecla
      clearTimeout(pendente);
      pendente = setTimeout(function () {
        try {
          localStorage.setItem(chave, JSON.stringify({
            em: Date.now(), dados: lerFormulario(form),
          }));
        } catch (e) {}
      }, 400);
    });
    form.addEventListener('change', function () {
      try {
        localStorage.setItem(chave, JSON.stringify({
          em: Date.now(), dados: lerFormulario(form),
        }));
      } catch (e) {}
    });
    /* Enviou, acabou. O servidor passa a ser a verdade, e um rascunho
       que sobrevive ao envio vira a faixa aparecendo na próxima visita
       oferecendo exatamente o que já está gravado. */
    form.addEventListener('submit', apagar);
  });

  /* Sair apaga todos os rascunhos: eles são dados de gente no aparelho
     de quem digitou, e sair é o gesto de quem está entregando o
     aparelho ou indo embora dele. */
  document.querySelectorAll('form .pe-sair').forEach(function (botao) {
    botao.addEventListener('click', function () {
      try {
        Object.keys(localStorage)
          .filter(function (k) { return k.indexOf('rascunho:') === 0; })
          .forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    });
  });

  /* "/" põe o cursor na busca — quem usa o painel todo dia procura mais
     do que clica, e a caixa nem sempre está na altura da tela.

     DUAS CAIXAS, UMA REGRA: a da TELA ganha quando existe. Quem está
     numa lista e tecla "/" quer filtrar aquela lista, não sair dela;
     onde a tela não tem busca própria, a barra cai na busca global, que
     é a única ali. Mandar sempre para a global tiraria a pessoa da tela
     em que ela está trabalhando.

     Só quando NÃO se está digitando em outro lugar: dentro de um campo a
     barra é uma barra, e roubá-la impediria de escrever "e/ou". */
  var busca = document.querySelector('.filtros input[type=search]')
    || document.querySelector('.procurar input[type=search]');
  if (busca) {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var alvo = e.target;
      if (alvo && (alvo.matches('input, textarea, select') || alvo.isContentEditable)) return;
      e.preventDefault();
      busca.focus();
      busca.select();
    });
  }
})();
