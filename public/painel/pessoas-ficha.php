<?php
declare(strict_types=1);

/**
 * UMA PESSOA: o formulário de cadastro, a ficha aberta e as duplicatas.
 *
 * Os três respondem a mesma pergunta — "quem é esta pessoa?" —, e por isso
 * moram juntos, longe da lista, que responde "quem existe?". A duplicata está
 * aqui e não lá porque ela é sobre DUAS fichas da mesma pessoa: é problema de
 * identidade, não de listagem.
 */

require_once __DIR__ . '/eventos-comum.php';  // o modelo do encontro e da presença
require_once __DIR__ . '/icones.php';  // icone()
require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao()
require_once __DIR__ . '/layout.php';  // cabecalho_pagina(), barra_abas(), abrir_modal() — a moldura
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo
require_once __DIR__ . '/atividade-comum.php';  // a visão 360 da ficha

/**
 * A ficha de cadastro — uma só, desenhada em dois modais.
 *
 * Cadastrar e editar perguntam exatamente a mesma coisa. Duas cópias
 * divergiriam na primeira vez que um campo entrasse só numa delas — e o defeito
 * seria invisível até alguém reclamar que "some quando eu edito".
 *
 * O sufixo `-e` nos ids existe porque os dois formulários coexistem no mesmo
 * documento: id repetido faz o `<label for>` apontar para o campo errado, e no
 * celular o toque no rótulo passa a focar o outro modal.
 */
function formulario_pessoa(?array $aberta, array $catalogo): void
{
    $s = $aberta ? '-e' : '';
    ?>
    <form method="post" data-rascunho="pessoa-<?= $aberta ? h($aberta['id']) : 'nova' ?>">
      <input type="hidden" name="csrf" value="<?= h(token()) ?>">
      <input type="hidden" name="acao" value="salvar">
      <?php if ($aberta): ?>
        <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
      <?php endif; ?>

      <div class="linha g2">
        <div class="campo">
          <label for="f-nome<?= $s ?>">Nome completo</label>
          <input id="f-nome<?= $s ?>" name="nome" type="text" maxlength="80" required value="<?= h($aberta['nome'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="f-tipo<?= $s ?>">O que ela é para o movimento</label>
          <select id="f-tipo<?= $s ?>" name="tipo">
            <?php foreach (TIPOS_PESSOA as $chave => $rotulo): ?>
              <option value="<?= h($chave) ?>" <?= ($aberta['tipo'] ?? 'eleitor') === $chave ? 'selected' : '' ?>><?= h($rotulo) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <?php /* A REDE PROFISSIONAL — o quarto eixo. Não é o que a pessoa faz no
               movimento (isso é `funcoes`): é o que ela é fora dele, e é por
               onde se monta a lista curada de um encontro relacional. */ ?>
      <div class="campo">
        <label>De que rede ela faz parte</label>
        <?php foreach (REDES as $chave => $rede): ?>
          <label class="check">
            <input type="checkbox" name="redes[]" value="<?= h($chave) ?>"
              <?= in_array($chave, $aberta['redes'] ?? [], true) ? 'checked' : '' ?>>
            <strong><?= h($rede['nome']) ?></strong>
            <span class="dica"><?= h($rede['resumo']) ?></span>
          </label>
        <?php endforeach; ?>
        <p class="dica">
          Serve para montar convite pessoal, e nunca grupo: o encontro relacional
          pede lista curta e curada.
        </p>
      </div>

      <?php /* O SUB-GRUPO DE QUEM LIDERA. Um grupo só, com todo mundo dentro,
               é onde ninguém é chamado pelo nome — e é a razão mais direta de
               alguém entrar no movimento e não se sentir parte. Só aparece para
               quem acompanha gente: campo de grupo numa ficha que não lidera é
               campo que ninguém preenche e que confunde quem lê. */ ?>
      <?php if ($aberta !== null && pode_liderar($aberta)): ?>
        <div class="campo">
          <label for="f-grupo<?= $s ?>">O grupo de quem ela acompanha</label>
          <input id="f-grupo<?= $s ?>" name="grupo" type="url" maxlength="200"
                 placeholder="https://chat.whatsapp.com/…"
                 value="<?= h($aberta['grupo'] ?? '') ?>">
          <p class="dica">
            Quem tem esta pessoa como líder passa a receber este convite no lugar do
            grupo geral — no Início e na mensagem de acesso.
          </p>
        </div>
      <?php endif; ?>

      <?php /* QUEM ACOMPANHA — a camada que faltava entre a coordenação e
               oitenta e sete pessoas. Só quem tem a capacidade de liderar entra
               na lista: apontar para alguém que não pode ver a própria gente
               seria marcar um campo que não faz nada, e campo que não faz nada
               é a pior espécie de defeito, porque parece resolvido. */ ?>
      <?php $lideres = possiveis_lideres(); ?>
      <?php if ($lideres !== []): ?>
        <div class="campo">
          <label for="f-lider<?= $s ?>">Quem acompanha esta pessoa</label>
          <select id="f-lider<?= $s ?>" name="lider">
            <option value="">— ninguém ainda —</option>
            <?php foreach ($lideres as $l): ?>
              <?php if (($aberta['id'] ?? '') === $l['id']) { continue; } ?>
              <option value="<?= h($l['id']) ?>" <?= ($aberta['lider'] ?? '') === $l['id'] ? 'selected' : '' ?>>
                <?= h($l['nome']) ?>
              </option>
            <?php endforeach; ?>
          </select>
          <p class="dica">
            Ela passa a ver o nome desta pessoa no Início de quem acompanha — e esta
            pessoa passa a ver quem chamar primeiro.
          </p>
        </div>
      <?php endif; ?>

      <div class="linha g3">
        <div class="campo">
          <label for="f-tel<?= $s ?>">WhatsApp</label>
          <input id="f-tel<?= $s ?>" name="telefone" type="tel" inputmode="numeric" maxlength="20" value="<?= h($aberta['telefone'] ?? '') ?>">
        </div>
        <div class="campo">
          <label for="f-cidade<?= $s ?>">Cidade</label>
          <?php campo_cidade('f-cidade' . $s, 'cidade', $aberta['cidade'] ?? ''); ?>
        </div>
        <div class="campo">
          <label for="f-bairro<?= $s ?>">Bairro</label>
          <input id="f-bairro<?= $s ?>" name="bairro" type="text" maxlength="60" value="<?= h($aberta['bairro'] ?? '') ?>">
        </div>
      </div>

      <div class="campo">
        <label for="f-email<?= $s ?>">E-mail <span class="dica">— opcional</span></label>
        <input id="f-email<?= $s ?>" name="email" type="email" maxlength="120" value="<?= h($aberta['email'] ?? '') ?>">
      </div>

      <p class="dica" style="margin:16px 0 6px"><strong>O que ela faz</strong> — as funções na militância:</p>
      <div class="linha g2">
        <?php foreach ($catalogo as $f): ?>
          <label class="check">
            <input type="checkbox" name="funcoes[]" value="<?= h($f['id']) ?>"
                   <?= in_array($f['id'], $aberta['funcoes'] ?? [], true) ? 'checked' : '' ?>>
            <?= h($f['nome']) ?>
          </label>
        <?php endforeach; ?>
      </div>

      <p class="dica" style="margin:18px 0 6px">
        <strong>O que ela abre no painel</strong> — marque a capacidade; as áreas vêm junto:
      </p>
      <?php foreach (CAPACIDADES as $chave => $cap): ?>
        <label class="check">
          <input type="checkbox" name="capacidades[]" value="<?= h($chave) ?>"
                 <?= in_array($chave, $aberta['capacidades'] ?? [], true) ? 'checked' : '' ?>>
          <strong><?= h($cap['nome']) ?></strong>
          <span class="dica"><?= h($cap['resumo']) ?></span>
        </label>
      <?php endforeach; ?>

      <details class="decidir" style="margin-top:14px">
        <summary class="btn">Ajuste fino por ferramenta</summary>
        <div class="decidir-corpo">
          <p class="dica" style="margin:0 0 10px">
            Para a exceção: dar uma ferramenta solta a quem não tem a capacidade inteira.
            O que a capacidade já libera aparece marcado depois de salvar, e desmarcar
            aqui não tira o que ela concede.
          </p>
          <div class="linha g2">
            <?php foreach (AREAS as $chave => $rotulo): ?>
              <?php if (in_array($chave, areas_so_adm(), true)) continue; // só a capacidade dá ?>
              <label class="check">
                <input type="checkbox" name="areas[]" value="<?= h($chave) ?>"
                       <?= in_array($chave, $aberta['areas'] ?? [], true) ? 'checked' : '' ?>>
                <?= h($rotulo) ?>
              </label>
            <?php endforeach; ?>
          </div>
        </div>
      </details>

      <div class="campo" style="margin-top:14px">
        <label for="f-obs<?= $s ?>">Anotação <span class="dica">— opcional</span></label>
        <textarea id="f-obs<?= $s ?>" name="observacao" rows="2" maxlength="400"><?= h($aberta['observacao'] ?? '') ?></textarea>
      </div>

      <div class="acoes">
        <button class="btn btn-ouro" type="submit"><?= $aberta ? 'Salvar' : 'Cadastrar' ?></button>
        <?php if ($aberta): ?>
          <a class="btn" href="/painel/pessoas.php">Cancelar</a>
        <?php endif; ?>
      </div>
    </form>

    <?php if ($aberta): ?>
      <?php /* Apagar fica FORA do formulário de cima, num <form> próprio: botão
               de risco dentro do formulário que se usa todo dia é o botão que se
               aperta por engano. */ ?>
      <form method="post" class="decidir-recusa"
            onsubmit="return confirm(<?= texto_js('Apagar ' . $aberta['nome'] . ' e as presenças dela?') ?>)">
        <input type="hidden" name="csrf" value="<?= h(token()) ?>">
        <input type="hidden" name="acao" value="apagar">
        <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
        <div class="campo">
          <label for="apagar-motivo">Por quê <span class="dica">— fica na linha do tempo, junto com quem apagou</span></label>
          <input id="apagar-motivo" type="text" name="motivo" maxlength="120" placeholder="cadastro duplicado · pediu para sair · teste">
        </div>
        <div class="acoes">
          <button class="btn btn-risco" type="submit">Apagar esta pessoa</button>
        </div>
      </form>
    <?php endif; ?>
    <?php
}

/**
 * As possíveis duplicatas, para um humano conferir.
 *
 * É SUGESTÃO, NUNCA FUSÃO AUTOMÁTICA. Casa que divide celular tem duas pessoas
 * de verdade no mesmo número, e juntar a ficha errada apaga o histórico de
 * alguém — isso não tem desfazer. Some da tela quando não há nenhuma.
 */
function bloco_duplicatas(array $duplicatas): void
{
    if ($duplicatas === []) {
        return;
    }
    ?>
    <fieldset id="duplicatas">
      <legend>Possíveis duplicatas (<?= count($duplicatas) ?>)</legend>
      <p class="dica" style="margin:0 0 14px">
        Mesmo telefone ou mesmo nome. <strong>É sugestão, não certeza</strong> — casa que
        divide celular tem duas pessoas de verdade no mesmo número. Confira antes: juntar
        a ficha errada apaga o histórico de alguém, e isso não tem desfazer.
      </p>
      <?php foreach ($duplicatas as $d): ?>
        <article class="ficha">
          <header class="ficha-topo">
            <span class="ficha-quem">
              <strong><?= h($d['a']['nome']) ?></strong>
              <span>e <strong><?= h($d['b']['nome']) ?></strong> — <?= h($d['motivo']) ?></span>
            </span>
            <span class="selo selo-off"><?= h($d['motivo']) ?></span>
          </header>
          <dl class="ficha-dados">
            <?php foreach (['a', 'b'] as $lado): ?>
              <?php $x = $d[$lado]; ?>
              <div>
                <dt><?= h($x['nome']) ?></dt>
                <dd>
                  <?= h(TIPOS_PESSOA[$x['tipo']]) ?>
                  <?= $x['telefone'] !== '' ? ' · ' . h(telefone_bonito($x['telefone'])) : '' ?>
                  <?= tem_conta($x) ? ' · <span class="selo">tem conta</span>' : '' ?>
                  <br><span class="dica"><?= count(encontros_da_pessoa($x['id'])) ?> encontro(s)</span>
                </dd>
              </div>
            <?php endforeach; ?>
          </dl>
          <div class="acoes">
            <?php foreach ([['a', 'b'], ['b', 'a']] as [$fica, $vai]): ?>
              <form method="post" style="display:inline"
                    onsubmit="return confirm(<?= texto_js('Juntar tudo em “' . $d[$fica]['nome'] . '” e apagar a outra ficha?') ?>)">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="acao" value="juntar">
                <input type="hidden" name="id" value="<?= h($d[$fica]['id']) ?>">
                <input type="hidden" name="sumir" value="<?= h($d[$vai]['id']) ?>">
                <button class="btn btn-mini" type="submit">Manter <?= h($d[$fica]['nome']) ?></button>
              </form>
            <?php endforeach; ?>
          </div>
        </article>
      <?php endforeach; ?>
    </fieldset>
  <?php
}

/**
 * A FICHA — tela própria, com abas.
 *
 * Abria dentro da lista: `?p=` desenhava a ficha inteira (encontros, acesso,
 * candidatura, histórico) EM CIMA de oitenta linhas de gente, e a lista, que
 * é o que alguém veio fazer aqui, sumia para baixo. Bloco de conteúdo não
 * fica embaixo de outro: vira aba. A URL é a mesma de sempre — `pessoas?p=` é
 * o que a busca, a linha do tempo e os links do painel já usam.
 *
 *   ficha       o que ela é, faz, abre; onde mora; quem a acompanha; candidatura
 *   encontros   em que encontros esteve, e o que aconteceu em cada um
 *   acesso      login, senha provisória, ativar e desativar
 *   historico   a visão 360, derivada do que já está gravado
 */
function tela_da_ficha(array $aberta, ?array $editando, ?string $erro, ?string $ok, ?array $senhaNova, array $catalogo): void
{
    $encontros = encontros_da_pessoa($aberta['id']);
    $historico = linha_do_tempo($aberta['id'], 50);
    $abas = [
        'ficha'     => ['nome' => 'Ficha'],
        'encontros' => ['nome' => 'Encontros', 'conta' => count($encontros)],
        'acesso'    => ['nome' => 'Acesso'],
        'historico' => ['nome' => 'Histórico', 'conta' => count($historico)],
    ];
    $aba = (string) ($_GET['aba'] ?? '');
    if (!isset($abas[$aba])) {
        $aba = 'ficha';
    }
    $qsFicha = 'p=' . rawurlencode($aberta['id']);

    abrir_pagina($aberta['nome']);
    ?>
<div class="capa">
  <?php cabecalho_pagina(
      $aberta['nome'],
      TIPOS_PESSOA[$aberta['tipo']]
      . ($aberta['status'] !== '' ? ' · ' . STATUS_PESSOA[$aberta['status']] : '')
      . (tem_conta($aberta) ? ' · ' . rotulo_do_acesso($aberta) : ' · sem conta no painel'),
      ['url' => '/painel/pessoas.php', 'texto' => 'Todas as pessoas']
  ); ?>

  <?php recado($erro, $ok); ?>

  <?php if ($senhaNova !== null && $senhaNova['id'] === $aberta['id']): ?>
    <div class="msg msg-ok">
      <p style="margin:0 0 8px">
        <strong>Login:</strong> <span class="provisoria"><?= h($senhaNova['usuario']) ?></span>
        &nbsp; <strong>Senha provisória:</strong> <span class="provisoria"><?= h($senhaNova['senha']) ?></span>
      </p>
      <p class="dica" style="margin:0">
        Aparece <strong>uma vez só</strong> — só o hash fica guardado, e hash não volta
        a ser senha. Mande agora; no primeiro acesso a pessoa é obrigada a trocar.
      </p>
    </div>
  <?php endif; ?>

  <?php barra_abas($abas, $aba, 'aba', 'Seções da ficha', ['p']); ?>

  <?php if ($aba === 'ficha'): ?>
    <fieldset id="ficha">
      <legend>Quem é</legend>
      <p style="margin:0 0 14px">
        <span class="selo"><?= h(TIPOS_PESSOA[$aberta['tipo']]) ?></span>
        <?php if (tem_conta($aberta)): ?>
          <span class="selo <?= $aberta['ativo'] ? 'selo-ok' : 'selo-off' ?>">
            <?= $aberta['ativo'] ? 'conta ativa' : 'conta desativada' ?> · <?= h($aberta['usuario']) ?>
          </span>
        <?php endif; ?>
        <?php if ($aberta['status'] !== ''): ?>
          <span class="selo selo-cinza"><?= h(STATUS_PESSOA[$aberta['status']]) ?></span>
        <?php endif; ?>
        <?php /* A rede fica na mesma linha do que a pessoa é, e não junto das
                 funções: função é o que ela faz no movimento, rede é o que ela
                 é fora dele. Misturadas, a lista curada de um encontro
                 relacional sairia com militante no meio de médico. */ ?>
        <?php foreach ($aberta['redes'] as $r): ?>
          <span class="selo"><?= h(REDES[$r]['nome'] ?? $r) ?></span>
        <?php endforeach; ?>
        <?php $quemAcompanha = lider_de($aberta); ?>
        <?php if ($quemAcompanha !== null): ?>
          <span class="selo selo-cinza">acompanhada por <?= h($quemAcompanha['nome']) ?></span>
        <?php endif; ?>
      </p>


      <dl class="resumo-numeros">
        <div><dt>WhatsApp</dt><dd>
          <?php if ($aberta['telefone'] !== ''): ?>
            <?php links_whatsapp($aberta['telefone'], telefone_bonito($aberta['telefone'])); ?>
          <?php else: ?>—<?php endif; ?>
        </dd></div>
        <div><dt>Onde mora</dt><dd><?= h(trim($aberta['bairro'] . ($aberta['cidade'] !== '' ? ', ' . $aberta['cidade'] : ''), ', ')) ?: '—' ?></dd></div>
        <div><dt>E-mail</dt><dd><?= $aberta['email'] !== '' ? h($aberta['email']) : '—' ?></dd></div>
      </dl>

      <p style="margin:0 0 6px"><strong>Faz:</strong>
        <?php if ($aberta['funcoes'] === []): ?><span class="dica">nenhuma função ainda</span><?php endif; ?>
        <?php foreach ($aberta['funcoes'] as $f): ?>
          <span class="selo selo-cinza"><?= h(nome_funcao($f)) ?></span>
        <?php endforeach; ?>
      </p>
      <?php if (tem_conta($aberta)): ?>
        <p style="margin:0 0 14px"><strong>Abre:</strong>
          <?php foreach ($aberta['areas'] as $a): ?>
            <span class="selo selo-cinza"><?= h(AREAS[$a] ?? $a) ?></span>
          <?php endforeach; ?>
        </p>
      <?php endif; ?>

      <div class="acoes">
        <?php botao_modal('editar-pessoa', 'Editar a ficha', $qsFicha . '&editar=' . rawurlencode($aberta['id']), 'btn btn-ouro'); ?>
      </div>
    </fieldset>

    <?php /* ---- candidatura ----
             Candidato é uma PESSOA com `tipo = candidato`, e não um cadastro à
             parte — por isso a ponte é daqui. O número (com o cargo que confere
             os dígitos) só é perguntado em um lugar, que é o formulário de
             /painel/candidatos. */ ?>
    <?php if ($aberta['tipo'] === 'candidato' || pode('candidatos')): ?>
    <fieldset id="candidatura">
      <legend>Candidatura</legend>
        <?php if ($aberta['tipo'] === 'candidato'): ?>
          <p style="margin:0 0 10px">
            <?php if ($aberta['numero'] !== ''): ?>
              <span class="selo"><?= h($aberta['numero']) ?></span>
            <?php else: ?>
              <span class="selo selo-off">sem número</span>
            <?php endif; ?>
            <span class="selo selo-cinza"><?= h(rotulo_cargo($aberta['cargo'])) ?></span>
            <span class="selo <?= $aberta['publicado'] ? 'selo-ok' : 'selo-cinza' ?>">
              <?= $aberta['publicado'] ? 'no ar' : 'rascunho' ?>
            </span>
          </p>
          <?php if (pode('candidatos')): ?>
            <div class="acoes">
              <a class="btn" href="/painel/candidatos.php?aba=candidatos&amp;c=<?= h($aberta['id']) ?>">Editar a candidatura</a>
            </div>
          <?php endif; ?>
        <?php else: ?>
          <p class="dica">
            Não é candidata. Tornar candidato é preencher o número de urna — sem ele a
            colinha não existe, e colinha com número errado é pior que colinha nenhuma.
          </p>
          <div class="acoes">
            <a class="btn" href="/painel/candidatos.php?aba=candidatos&amp;pessoa=<?= h($aberta['id']) ?>">
              Tornar candidato
            </a>
          </div>
        <?php endif; ?>
    </fieldset>
    <?php endif; ?>

  <?php elseif ($aba === 'encontros'): ?>
    <fieldset id="encontros">
      <legend>Encontros (<?= count($encontros) ?>)</legend>
      <?php if ($encontros === []): ?>
        <p class="dica" style="margin:0">Nunca apareceu em encontro nenhum.</p>
      <?php else: ?>
        <div class="rolagem cartoes">
          <table class="tabela">
            <thead><tr><th>Encontro</th><th>Quando</th><th>O que aconteceu</th></tr></thead>
            <tbody>
              <?php foreach ($encontros as $en): ?>
                <tr>
                  <td>
                    <a href="/painel/eventos.php?e=<?= h($en['evento']['id']) ?>">
                      <?= h($en['evento']['titulo']) ?>
                    </a>
                  </td>
                  <td class="meia" data-rotulo="Quando"><?= h(trim($en['evento']['data'] . ' ' . $en['evento']['hora'])) ?: '—' ?></td>
                  <td class="meia" data-rotulo="O que aconteceu">
                    <?php if ($en['compareceu']): ?>
                      <span class="selo selo-ok">veio</span>
                    <?php elseif ($en['confirmou']): ?>
                      <span class="selo selo-off">confirmou e faltou</span>
                    <?php else: ?>
                      <span class="selo selo-cinza">convidada</span>
                    <?php endif; ?>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

    </fieldset>

  <?php elseif ($aba === 'acesso'): ?>
    <fieldset id="acesso">
      <legend>Acesso ao painel</legend>
      <?php if (!tem_conta($aberta)): ?>
        <p class="dica">
          Sem conta. A maioria das pessoas não precisa de uma — quem confirmou presença
          num encontro está na lista do mesmo jeito.
        </p>
        <form method="post">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="dar-conta">
          <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
          <div class="campo">
            <label for="novo-login">Login</label>
            <input id="novo-login" name="usuario" type="text" maxlength="24" required
                   value="<?= h(login_sugerido($aberta['nome'])) ?>">
          </div>
          <div class="acoes">
            <button class="btn btn-ouro" type="submit">Criar a conta e gerar senha</button>
          </div>
        </form>
      <?php else: ?>
        <?php /* O login escrito por extenso, e não só dentro do selo lá em cima:
                 é ele que a pessoa digita para entrar, e é ele que a coordenação
                 dita no WhatsApp quando alguém diz "não consigo entrar". Monoespaçado
                 porque num tipo proporcional o l e o 1 têm o mesmo desenho. */ ?>
        <p style="margin:0 0 12px">
          <strong>Login:</strong> <span class="login"><?= h($aberta['usuario']) ?></span>
        </p>
        <div class="acoes">
          <form method="post" style="display:inline">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="resetar">
            <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
            <button class="btn" type="submit">Resetar senha</button>
          </form>
          <form method="post" style="display:inline">
            <input type="hidden" name="csrf" value="<?= h(token()) ?>">
            <input type="hidden" name="acao" value="ativar">
            <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
            <button class="btn" type="submit"><?= $aberta['ativo'] ? 'Desativar a conta' : 'Reativar' ?></button>
          </form>
        </div>
        <p class="dica">
          Último acesso: <?= $aberta['ultimoAcesso'] !== '' ? h(date('d/m/Y H:i', (int) strtotime($aberta['ultimoAcesso']))) : 'nunca entrou' ?>.
          Senha não se recupera — só o hash fica guardado.
        </p>
      <?php endif; ?>

    </fieldset>

    <?php /* OS DIREITOS DA PESSOA (LGPD): ver o que o sistema tem sobre ela, e
             pedir para sair. Moram na aba Acesso porque é a aba de "conta e
             dado", e só a administração vê — é a mesma régua da tela inteira. */ ?>
    <fieldset id="dados-dela">
      <legend>Os dados dela</legend>
      <p class="dica" style="margin:0 0 12px">
        Se ela pedir para ver o que temos, ou para sair: é direito dela, e a
        resposta é imediata. Apagar a pedido deixa só a lápide — nome, quando,
        quem atendeu — e leva embora telefone, e-mail, endereço e conta.
      </p>
      <div class="acoes">
        <a class="btn" href="/painel/exportar.php?o=pessoa&id=<?= h(rawurlencode($aberta['id'])) ?>">Baixar tudo sobre ela (JSON)</a>
        <form method="post" class="decidir-recusa" style="margin:0"
              onsubmit="return confirm(<?= texto_js('Apagar a pedido de ' . $aberta['nome'] . '? Telefone, e-mail, endereço e conta vão embora; fica só a lápide.') ?>)">
          <input type="hidden" name="csrf" value="<?= h(token()) ?>">
          <input type="hidden" name="acao" value="apagar">
          <input type="hidden" name="id" value="<?= h($aberta['id']) ?>">
          <input type="hidden" name="motivo" value="pediu para sair (LGPD)">
          <button class="btn btn-risco" type="submit">Apagar a pedido dela</button>
        </form>
      </div>
    </fieldset>

  <?php else: ?>
    <?php if ($historico === []): ?>
      <p class="dica">Nada gravado sobre ela ainda.</p>
    <?php else: ?>
      <fieldset id="historico">
        <legend>Histórico de <?= h(explode(' ', $aberta['nome'])[0]) ?></legend>
        <p class="dica" style="margin:0 0 12px">
          Sai do que já está gravado. Correção de ficha aparece como “Ficha
          alterada”, com quem mexeu e quando.
        </p>
        <ul class="tempo">
          <?php foreach ($historico as $l): ?>
            <li>
              <a href="<?= h($l['url']) ?>">
                <span class="tempo-quando"><?= h(ha_quanto_tempo($l['quando'])) ?></span>
                <span class="tempo-icone"><?= icone(ICONE_AREA[$l['area']] ?? 'star', 16) ?></span>
                <span class="tempo-texto"><?= h($l['texto']) ?></span>
              </a>
            </li>
          <?php endforeach; ?>
        </ul>
      </fieldset>
    <?php endif; ?>
  <?php endif; ?>

  <?php /* O modal de edição, no fim do documento: `?p=X&editar=X` abre a ficha
           com o formulário por cima. */ ?>
  <?php if ($editando !== null): ?>
    <?php abrir_modal('editar-pessoa', 'Editar ' . $editando['nome'], true); ?>
      <?php formulario_pessoa($editando, $catalogo); ?>
    <?php fechar_modal(); ?>
  <?php endif; ?>
</div>
<?php
    fechar_pagina();
}
