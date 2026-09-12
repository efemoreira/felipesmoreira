<?php
declare(strict_types=1);

/**
 * O Início — a tela de quem já entrou.
 *
 * Responde, de cima para baixo: onde eu trabalho (a mesa da função), o que
 * está esperando por mim (a fila), para onde eu vou (o próximo encontro),
 * quanto já aprendi (o próximo passo da formação) e o que o time andou
 * fazendo (três linhas; o resto é Leituras). Na lateral, o que pede ação:
 * sua gente, a peça da semana, o grupo.
 *
 * Nenhum número é calculado aqui: tudo vem do agora.php — `tarefas_de()`,
 * `panorama_de()`, `mesas_de()` — e cada área declara o seu lá.
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/atividade-comum.php';

function tela_do_inicio(array $u, ?string $aviso, ?string $sucesso): void
{
    /* ---------- hub ---------- */

    /**
     * O hub responde, de cima para baixo, as cinco perguntas de quem abre o painel:
     * onde eu trabalho, o que está esperando por mim, como está a operação inteira,
     * o que vem aí e quanto eu já aprendi.
     *
     * A OPERAÇÃO VEM DEPOIS DA FILA, e não antes. A pergunta pessoal ("o que é meu")
     * é a que faz alguém trabalhar hoje; a coletiva ("como estamos") é a que faz
     * decidir. Invertê-las poria a coordenação primeiro numa tela que todo militante
     * abre — e quem tem uma área só leria dois medidores antes de achar a própria
     * mesa.
     *
     * Nenhum número aqui é calculado neste arquivo: tudo vem do agora.php, que é a
     * fonte única — `tarefas_de()` para a fila, `panorama_de()` para os medidores.
     * Área nova declara as duas coisas lá, não aqui.
     */

    $areas = areas_do_usuario();

    /* OS PRIMEIROS PASSOS, e só eles, para quem acabou de chegar. Quem já
       trabalha aqui (coordenação, administração) ou já deu os três passos
       vê o hub inteiro; conta sem função também — a trilha é POR FUNÇÃO, e
       quem não tem uma é conta de operação, não militante chegando. `?tudo=1`
       abre o hub inteiro para quem quiser espiar — o modo não tranca nada,
       só tira o ruído da frente. */
    $passos = (tem_capacidade('coordenacao') || $u['funcoes'] === []) ? [] : primeiros_passos($u);
    $soPassos = $passos !== [] && !trilha_completa($u) && empty($_GET['tudo']);
    $dados = count(array_filter($passos, fn ($p) => $p['feito']));

    $mesas = mesas_de($u);
    $tarefas = tarefas_de($u);
    $panorama = panorama_de($u);
    /* TRÊS LINHAS, e "ver tudo" para Leituras › Atividade. Aqui é contexto de
       quem vai trabalhar, não leitura: doze linhas entre a formação e o rodapé
       eram uma rolagem que ninguém fazia. Quem não abre Leituras vê as três — a
       lista inteira é leitura de coordenação. */
    $atividade = linha_do_tempo(null, 3);
    $formacao = formacao_de($u);
    $trilhas  = trilhas_de($u);

    $negado = (string) ($_GET['negado'] ?? '');
    if ($negado !== '') {
        $aviso = match (true) {
            $negado === 'usuarios' => 'Só um administrador abre a lista de usuários.',
            $negado === 'gente'    => '“Sua gente” é de quem acompanha alguém. Peça à coordenação para ser apontada como líder.',
            $negado === 'exportar' => 'Exportar é da coordenação: é dado pessoal saindo do sistema.',
            default                => 'Você não tem acesso a “' . (AREAS[$negado] ?? $negado) . '”. Peça a um administrador.',
        };
    }

    /* Os encontros que vêm aí, e a peça das cinco que cabe a esta pessoa. */
    $proximos = [];
    $minhaPeca = null;
    if (in_array('eventos', $areas, true)) {
        require_once __DIR__ . '/eventos-comum.php';
        $todosProximos = eventos_proximos();
        /* UM encontro, e "ver todos". O hub responde "para onde eu vou", e a
           resposta é o próximo; a lista é de /painel/eventos. */
        $proximos = array_slice($todosProximos, 0, 1);
        $minhaPeca = peca_da_pessoa($u);
    }

    $naFila = count($tarefas);
    $mostradas = array_slice($tarefas, 0, TETO_FILA);
    $sobrando = $naFila - count($mostradas);

    abrir_pagina('Início');
    ?>
    <div class="capa">
      <?php
        if ($areas === []) {
            $resumo = 'Seu acesso está ativo, mas nenhuma área foi liberada ainda.';
        } elseif ($soPassos) {
            $resumo = 'Bem-vinda. Três passos para começar — o resto vem depois deles.';
        } elseif ($naFila === 0) {
            $resumo = 'Nada esperando por você agora.';
        } elseif ($naFila === 1) {
            $resumo = 'Uma coisa está esperando por você.';
        } else {
            $resumo = $naFila . ' coisas estão esperando por você.';
        }
        cabecalho_pagina(
            'Olá, ' . h(explode(' ', $u['nome'])[0]),
            $resumo,
            null,
            null,
            [
                'Esta tela é só o que está esperando por você hoje — para onde ir fica no menu, ao lado.',
                'A mesa do topo é a da sua função no movimento; “Ver tudo” abre a ferramenta inteira.',
                '“A operação hoje” é do time inteiro, não sua: só aparece o que está perto do prazo ou já venceu; em dia não faz barulho.',
                'Área é permissão de tela; função é o seu papel na militância. Uma não limita a outra.',
                'Fila vazia é o objetivo, não erro: a meta é que nada durma sem status.',
                '“O que andou acontecendo” é derivado do que já está gravado — não há registro de auditoria por trás.',
            ]
        );
      ?>

      <?php recado($aviso, $sucesso); ?>

      <?php
        require_once __DIR__ . '/pessoas-comum.php';  // minha_gente(), lider_de()
        require_once __DIR__ . '/reativacao.php';     // motivo_de_reativacao()
        $quemMeAcompanha = lider_de($u);
        $minhaGente = pode_liderar($u) ? minha_gente($u) : [];
        $minhaEsfriando = count(array_filter($minhaGente, fn ($g) => motivo_de_reativacao($g) !== null));
      ?>

      <?php /* QUEM TE ACOMPANHA — uma linha, no alto, antes de qualquer bloco. É a
               que responde ao "entrei num grupo de oitenta pessoas e não me senti
               parte": UM nome, com o WhatsApp ao lado, de alguém que responde por
               você. Era um cartão; virou linha porque o que ela diz cabe numa. */ ?>
      <?php if ($quemMeAcompanha !== null): ?>
        <p class="hub-linha">
          <?= icone('users', 18) ?>
          Quem te acompanha: <strong><?= h($quemMeAcompanha['nome']) ?></strong>
          <?php if ($quemMeAcompanha['telefone'] !== ''): ?>
            · <?php links_whatsapp($quemMeAcompanha['telefone'], 'WhatsApp'); ?>
          <?php endif; ?>
        </p>
      <?php endif; ?>

      <?php if ($soPassos): ?>
        <h2 class="secao">Seus primeiros passos · <?= $dados ?> de <?= count($passos) ?></h2>
        <ol class="passos">
          <?php foreach ($passos as $i => $p): ?>
            <li class="passo<?= $p['feito'] ? ' passo-feito' : '' ?>">
              <span class="passo-num" aria-hidden="true"><?= $p['feito'] ? '✓' : $i + 1 ?></span>
              <div class="passo-corpo">
                <a class="passo-titulo" href="<?= h($p['url']) ?>"><?= h($p['titulo']) ?></a>
                <p class="passo-porque"><?= h($p['porque']) ?></p>
              </div>
            </li>
          <?php endforeach; ?>
        </ol>
        <p class="dica" style="margin:0 0 26px">
          Feitos os três, esta tela vira a sua mesa de trabalho.
          <a href="/painel/?tudo=1">Ver o painel inteiro agora</a>.
        </p>
      <?php endif; ?>

      <div class="hub">
      <div class="hub-principal">

      <?php if (!$soPassos): ?>

      <?php if ($areas === []): ?>
        <p class="msg msg-erro">
          Nenhuma área foi liberada para a sua conta ainda. Fale com a coordenação no
          <a href="<?= h(WHATSAPP_COORDENACAO) ?>" target="_blank" rel="noopener">WhatsApp</a>
          para liberarem o seu acesso.
        </p>
      <?php else: ?>

        <?php /* ============ 1. a mesa de trabalho da função ============ */ ?>
        <?php if ($mesas !== []): ?>
          <?php require_once __DIR__ . '/inscricoes-comum.php';  // nome_funcao() ?>
          <div class="mesas">
            <?php foreach ($mesas as $mesa): ?>
              <section class="mesa">
                <span class="mesa-icone"><?= icone(ICONE_AREA[$mesa['area']] ?? 'star') ?></span>
                <p class="mesa-funcao"><?= h(nome_funcao($mesa['funcao'])) ?></p>
                <h2 class="mesa-area"><?= h(AREAS[$mesa['area']]) ?></h2>
                <?php if ($mesa['estado'] !== ''): ?>
                  <p class="mesa-estado"><?= h($mesa['estado']) ?></p>
                <?php endif; ?>
                <div class="acoes">
                  <a class="btn btn-ouro" href="<?= h($mesa['url']) ?>"><?= h($mesa['acao']) ?></a>
                  <?php if ($mesa['url'] !== DESTINO_AREA[$mesa['area']]['url']): ?>
                    <?php /* a ação primária cai numa âncora; este abre a tela inteira */ ?>
                    <a class="btn btn-mini" href="<?= h(DESTINO_AREA[$mesa['area']]['url']) ?>">Ver tudo</a>
                  <?php endif; ?>
                </div>
              </section>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <?php /* ============ 2. a fila do dia ============ */ ?>
        <h2 class="secao">Esperando você</h2>
        <?php if ($mostradas === []): ?>
          <p class="vazio-bom">
            Tudo em dia. É esse o objetivo: nada dorme sem status.
            <?php if ($formacao !== null && $formacao['proxima'] !== null): ?>
              Sobrou tempo? A próxima aula é
              <a href="/aulas#<?= h($formacao['proxima']['aula']['id']) ?>">🚗 <?= h($formacao['proxima']['aula']['titulo']) ?></a>.
            <?php endif; ?>
          </p>
        <?php else: ?>
          <ul class="fila">
            <?php foreach ($mostradas as $t): ?>
              <li>
                <a class="fila-item<?= $t['urgente'] ? ' fila-urgente' : '' ?>" href="<?= h($t['url']) ?>">
                  <span class="fila-icone"><?= icone($t['icone'], 20) ?></span>
                  <span class="fila-texto">
                    <strong><?= h($t['texto']) ?></strong>
                    <?php if ($t['porque'] !== ''): ?>
                      <span><?= h($t['porque']) ?></span>
                    <?php endif; ?>
                  </span>
                  <span class="fila-seta" aria-hidden="true"><?= icone('chevronRight', 20) ?></span>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
          <?php if ($sobrando > 0): ?>
            <p class="dica">E mais <?= $sobrando ?> <?= $sobrando === 1 ? 'coisa' : 'coisas' ?> nas áreas abaixo.</p>
          <?php endif; ?>
        <?php endif; ?>

        <?php /* ============ 3. a operação de hoje ============
                 Os mesmos helpers da fila, lidos por outro ângulo: a fila diz o que
                 é MEU, os medidores dizem como está o TODO. É a diferença entre
                 trabalhar hoje e decidir hoje, e a coordenação precisa das duas.

                 Cada cartão é um link: medidor que mostra o problema e não leva até
                 ele obriga a procurar no menu qual tela responde por aquilo. */ ?>
        <?php /* UMA LINHA, e só o que não está em dia. Os medidores inteiros eram
                 uma grade de seis cartões entre a fila e os encontros — no celular,
                 uma tela de rolagem antes de chegar ao próximo encontro. O que a
                 coordenação precisa ver aqui é o que venceu; o retrato completo é
                 leitura, e vai para Leituras › Semana. */ ?>
        <?php $fora = array_filter($panorama, fn ($m) => $m['estado'] !== 'ok'); ?>
        <?php if ($panorama !== []): ?>
          <p class="hub-linha">
            <?= icone('bolt', 18) ?>
            A operação hoje:
            <?php if ($fora === []): ?>
              <strong>em dia.</strong>
            <?php else: ?>
              <?php foreach ($fora as $m): ?>
                <a class="selo <?= $m['estado'] === 'urgente' ? 'selo-off' : 'selo-atencao' ?>" href="<?= h($m['url']) ?>"><?= h($m['num']) ?> <?= h($m['rotulo']) ?></a>
              <?php endforeach; ?>
            <?php endif; ?>
            <?php if (pode('leituras')): ?>
              <a href="/painel/leituras.php?aba=semana">ver a semana</a>
            <?php endif; ?>
          </p>
        <?php endif; ?>

        <?php /* ============ 4. os encontros marcados ============ */ ?>
        <?php if (in_array('eventos', $areas, true)): ?>
          <h2 class="secao">Próximos encontros</h2>
          <?php if ($proximos === []): ?>
            <p class="dica">
              Nenhum encontro marcado. O primeiro passo é Local &amp; Hora: três opções avaliadas
              antes de fechar qualquer coisa. <a href="/painel/eventos.php">Marcar um encontro</a>.
            </p>
          <?php else: ?>
            <div class="encontros">
              <?php foreach ($proximos as $e): ?>
                <?php
                  $preparo = preparo_do_evento($e);
                  $feitosMinha = $minhaPeca !== null ? count($e['feitos'][$minhaPeca] ?? []) : 0;
                  $totalMinha = 0;
                  if ($minhaPeca !== null) {
                      $c = checklist(PECAS[$minhaPeca]['checklist']);
                      $totalMinha = $c !== null ? count($c['itens']) : 0;
                  }
                ?>
                <a class="encontro" href="/painel/eventos.php?e=<?= h(rawurlencode($e['id'])) ?>">
                  <span class="encontro-data">
                    <?php /* `inicio` (o instante), e não `data` (o "24/08" de
                             exibição): `data_curta()` lê ISO, e com o texto de
                             exibição ela devolvia string vazia — o cartão do hub
                             saía sem data para todo encontro. */ ?>
                    <?php if ($e['inicio'] !== ''): ?>
                      <strong><?= h(data_curta($e['inicio'])) ?></strong>
                      <span><?= $e['hora'] !== '' ? h($e['hora']) : 'sem hora' ?></span>
                    <?php elseif ($e['data'] !== ''): ?>
                      <?php /* Encontro antigo, gravado antes de `inicio` existir:
                               mostra o texto legado como está. Ele não some nem
                               quebra — só não dá para dizer o dia da semana. */ ?>
                      <strong><?= h($e['data']) ?></strong>
                      <span><?= $e['hora'] !== '' ? h($e['hora']) : 'sem hora' ?></span>
                    <?php else: ?>
                      <strong>SEM DATA</strong>
                    <?php endif; ?>
                  </span>
                  <span class="encontro-texto">
                    <strong><?= h($e['titulo']) ?></strong>
                    <span>
                      <?= h(FAMILIAS[$e['familia']]['nome']) ?>
                      <?= $e['local'] !== '' ? ' · ' . h($e['local']) : '' ?>
                      · preparo <?= $preparo['feito'] ?>/<?= $preparo['total'] ?>
                    </span>
                    <?php if ($minhaPeca !== null && $totalMinha > 0): ?>
                      <span class="encontro-peca">
                        Sua peça: <?= h(PECAS[$minhaPeca]['nome']) ?> · <?= $feitosMinha ?> de <?= $totalMinha ?> conferidos
                      </span>
                    <?php endif; ?>
                  </span>
                </a>
              <?php endforeach; ?>
            </div>
            <?php if (count($todosProximos) > 1): ?>
              <p class="dica"><a href="/painel/eventos.php">Ver todos os <?= count($todosProximos) ?> encontros marcados</a></p>
            <?php endif; ?>
          <?php endif; ?>
        <?php endif; ?>

        <?php /* ============ 5. a formação ============ */ ?>
        <?php if ($formacao !== null): ?>
          <h2 class="secao">Sua formação</h2>
          <section class="formacao">
            <div class="barra-progresso"
                 role="progressbar"
                 aria-valuenow="<?= $formacao['feitas'] ?>"
                 aria-valuemin="0"
                 aria-valuemax="<?= $formacao['total'] ?>"
                 aria-label="Aulas concluídas">
              <span style="width:<?= $formacao['total'] > 0 ? (int) round($formacao['feitas'] / $formacao['total'] * 100) : 0 ?>%"></span>
            </div>
            <p class="formacao-conta">
              <?= $formacao['feitas'] ?> de <?= $formacao['total'] ?> aulas ·
              Pistas Rápidas <?= $formacao['rapidasFeitas'] ?> de <?= $formacao['rapidas'] ?>
            </p>

            <?php /* Só o próximo passo. "O que você já aprendeu" é retrospecto, e
                     mora em /aulas — o hub responde "o que eu faço agora". */ ?>
            <?php if ($formacao['proxima'] !== null): ?>
              <a class="btn btn-mini" href="/aulas#<?= h($formacao['proxima']['aula']['id']) ?>">
                Próxima 🚗 Dia <?= (int) $formacao['proxima']['dia']['numero'] ?> — <?= h($formacao['proxima']['aula']['titulo']) ?>
              </a>
            <?php else: ?>
              <p class="dica colado">
                Você fez todas as Pistas Rápidas. As Pistas Lentas continuam em
                <a href="/aulas">/aulas</a> para quando precisar de um ponto específico.
              </p>
            <?php endif; ?>

            <?php /* A TRILHA DA FUNÇÃO, e não mais só o percentual do currículo.
                     O que trava alguém entre "foi aprovado" e "já opera" quase
                     nunca é a formação inteira — é a aula da função dela, o
                     "Pronto quando" daquela entrega e saber em que tela se faz
                     aquilo. As três numa linha só, por função. */ ?>
            <?php foreach ($trilhas as $t): ?>
              <p class="formacao-feitas">
                <strong>Para operar como <?= h($t['nome']) ?>:</strong>
                <?php if ($t['aula'] !== null): ?>
                  <a href="/aulas#<?= h($t['aula']['id']) ?>"><?= h($t['aula']['titulo']) ?></a>
                  <span class="selo <?= $t['feita'] ? 'selo-publicado' : 'selo-atencao' ?>">
                    <?= $t['feita'] ? 'aula feita' : $t['aula']['minutos'] . ' min' ?>
                  </span>
                <?php endif; ?>
                <?php if ($t['checklist'] !== null): ?>
                  · <?= h($t['checklist']['titulo']) ?>, <?= (int) $t['checklist']['itens'] ?> itens
                <?php endif; ?>
                <?php if ($t['ferramenta'] !== null): ?>
                  · <a href="<?= h($t['ferramenta']['url']) ?>"><?= h($t['ferramenta']['acao']) ?></a>
                <?php endif; ?>
              </p>
            <?php endforeach; ?>
          </section>
        <?php endif; ?>

        <?php /* ============ 6. o que andou acontecendo ============
                 POR ÚLTIMO de propósito: é contexto, não tarefa. As cinco seções
                 acima respondem "o que eu faço agora"; esta responde "o que o time
                 andou fazendo", que é a pergunta de quem já fez a sua parte.

                 Nenhuma linha daqui sai de um arquivo de log — ela é derivada dos
                 carimbos que já existem. Ver atividade-comum.php. */ ?>
        <?php if ($atividade !== []): ?>
          <h2 class="secao">O que andou acontecendo</h2>
          <ul class="tempo">
            <?php foreach ($atividade as $l): ?>
              <li>
                <a href="<?= h($l['url']) ?>">
                  <span class="tempo-quando"><?= h(ha_quanto_tempo($l['quando'])) ?></span>
                  <span class="tempo-icone"><?= icone(ICONE_AREA[$l['area']] ?? 'star', 16) ?></span>
                  <span class="tempo-texto">
                    <?= h($l['texto']) ?><?php if ($l['quem'] !== ''): ?><span class="tempo-quem"> · <?= h($l['quem']) ?></span><?php endif; ?>
                  </span>
                </a>
              </li>
            <?php endforeach; ?>
          </ul>
          <?php if (pode('leituras')): ?>
            <p class="dica"><a href="/painel/leituras.php?aba=atividade">Ver tudo o que andou acontecendo</a></p>
          <?php endif; ?>
        <?php endif; ?>

      <?php endif; ?>

      <?php endif; /* !$soPassos */ ?>
      </div><?php /* fim de .hub-principal */ ?>

      <?php /* ============ a coluna da direita ============
               No computador ela fica ao lado; no celular a grade vira uma coluna só
               e ESTE bloco sobe para o topo (ver painel.css). "Com prioridade" que
               vira o último bloco de uma página rolada no celular não é prioridade
               nenhuma — e o celular é de onde vem a maioria. */ ?>
      <aside class="hub-lado">
        <?php /* SUA GENTE — o contador, e a porta. A lista com nome, selo e
                 WhatsApp de cada pessoa é a tela /painel/gente: aqui cabe o número
                 e o que ele pede. Quem lidera acompanha gente; não recebe a agenda
                 do movimento junto — e-mail, endereço e ficha continuam em
                 `pessoas`, que é `adm`. */ ?>
        <?php if ($minhaGente !== []): ?>
          <section class="cartao-grupo" id="minha-gente">
            <span class="cartao-grupo-icone"><?= icone('users', 28) ?></span>
            <h2>Sua gente (<?= count($minhaGente) ?>)</h2>
            <p>
              <?php if ($minhaEsfriando === 0): ?>
                <strong>Todas em dia.</strong> Ninguém faltou, travou ou sumiu.
              <?php else: ?>
                <strong><?= $minhaEsfriando ?> <?= $minhaEsfriando === 1 ? 'pessoa esfriou' : 'pessoas esfriaram' ?>.</strong>
                Uma mensagem sua custa menos que um encontro inteiro para trazer gente nova.
              <?php endif; ?>
            </p>
            <div class="acoes">
              <a class="btn btn-ouro" href="/painel/gente.php<?= $minhaEsfriando > 0 ? '?tipo=esfriando' : '' ?>">
                <?= $minhaEsfriando > 0 ? 'Ver quem esfriou' : 'Ver sua gente' ?>
              </a>
            </div>
          </section>
        <?php endif; ?>

        <?php /* A PEÇA DA SEMANA — o cartão que existe para quem não tem área
                 nenhuma. A corrente da comunicação exige seis pessoas em seis
                 funções no mesmo dia; isto exige uma pessoa e cinco minutos.

                 O link é individual, com o `?de=` dela: é o que transforma
                 "compartilhe" em trabalho que se mede — sem ele não há como saber
                 qual militante traz gente. */ ?>
        <?php
          require_once __DIR__ . '/kit-comum.php';
          $mutiraoHub = mutirao_da_semana();
          $meuEstado = $mutiraoHub['escalados'][$u['id']] ?? '';
        ?>
        <?php if ($mutiraoHub['peca'] !== null && $meuEstado !== ''): ?>
          <section class="cartao-grupo" id="mutirao">
            <span class="cartao-grupo-icone"><?= icone('broadcast', 28) ?></span>
            <h2>A peça desta semana</h2>
            <p>
              <strong><?= h($mutiraoHub['peca']['numero']) ?></strong> —
              <?= h($mutiraoHub['peca']['frase']) ?>
            </p>
            <p class="dica"><?= h($mutiraoHub['peca']['fonte']) ?></p>
            <div class="acoes">
              <button class="btn btn-ouro" type="button"
                      data-copiar="<?= h(mensagem_do_mutirao($mutiraoHub['peca'], $u)) ?>">
                Copiar o texto e o link
              </button>
            </div>
            <?php if ($meuEstado === 'postou'): ?>
              <p class="dica" style="margin-top:10px"><strong>Você já postou esta semana.</strong> Obrigado.</p>
            <?php else: ?>
              <form method="post" class="cartao-grupo-feito">
                <input type="hidden" name="csrf" value="<?= h(token()) ?>">
                <input type="hidden" name="acao" value="postei-a-peca">
                <button class="btn btn-mini" type="submit">Já postei</button>
              </form>
              <p class="dica">
                O link já vai com o seu nome: é assim que a coordenação sabe quem trouxe gente.
              </p>
            <?php endif; ?>
          </section>
        <?php endif; ?>

        <?php /* O GRUPO — cartão só até a pessoa marcar que entrou. Depois, o
                 convite vira uma linha: o link continua aqui para quem perdeu, mas
                 não ocupa mais o lugar de uma obrigação já cumprida. */ ?>
        <?php if (!empty($u['entrouNoGrupo'])): ?>
          <p class="hub-linha" id="grupo">
            <?= icone('whatsapp', 18) ?>
            <a href="<?= h(grupo_de($u)) ?>" target="_blank" rel="noopener"><?= $quemMeAcompanha !== null ? 'Seu grupo' : 'Grupo de trabalho' ?></a>
          </p>
        <?php else: ?>
        <section class="cartao-grupo" id="grupo">
          <span class="cartao-grupo-icone"><?= icone('whatsapp', 28) ?></span>
          <h2><?= $quemMeAcompanha !== null ? 'Seu grupo' : 'Grupo de trabalho' ?></h2>
          <p>
            <?php if ($quemMeAcompanha !== null): ?>
              O grupo de quem <?= h(primeiro_nome($quemMeAcompanha['nome'])) ?> acompanha.
              É um punhado de gente, e é onde você vai ser chamada pelo nome.
            <?php else: ?>
              Entre no grupo para acompanhar avisos e novidade dos trabalhos da
              militância da Missão no Ceará.
            <?php endif; ?>
          </p>
          <div class="acoes">
            <a class="btn btn-ouro" href="<?= h(grupo_de($u)) ?>" target="_blank" rel="noopener">
              Entrar no grupo
            </a>
          </div>
          <?php if (empty($u['entrouNoGrupo'])): ?>
            <form method="post" class="cartao-grupo-feito">
              <input type="hidden" name="csrf" value="<?= h(token()) ?>">
              <input type="hidden" name="acao" value="entrei-no-grupo">
              <button class="btn btn-mini" type="submit">Já entrei</button>
            </form>
            <p class="dica">
              É a primeira coisa que se faz aqui. Enquanto não marcar, ela continua
              no topo da sua fila.
            </p>
          <?php endif; ?>
        </section>
        <?php endif; ?>
      </aside>

      </div><?php /* fim de .hub */ ?>

    </div>
    <?php
    fechar_pagina();

}
