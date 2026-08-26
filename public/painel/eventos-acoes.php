<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com um encontro — o lado POST de `/painel/eventos`.
 *
 * Saiu do `eventos.php` porque ali eram quatrocentas linhas de decisão coladas
 * em setecentas de desenho, e mexer numa arriscava a outra: a tela mais usada
 * do movimento era também a mais perigosa de tocar. Aqui não há uma linha de
 * HTML; lá não há uma linha de gravação.
 *
 * A permissão continua dividida por natureza da ação, não por cargo: quem tem
 * `eventos` executa (marca checklist, confirma presença, cadastra quem chegou),
 * quem tem `agenda` decide (cria, cancela, apaga).
 *
 * TODA AÇÃO TERMINA EM REDIRECIONAMENTO. `voltar()` manda o header e sai — por
 * isso `tratar_acoes_de_evento()` não devolve nada quando de fato agiu, e o
 * `eventos.php` pode chamá-la antes de calcular qualquer estado de tela.
 */

require_once __DIR__ . '/agenda-comum.php';  // o relógio e o pipeline de imagem
require_once __DIR__ . '/checklists.php';  // checklist()
require_once __DIR__ . '/sessao.php';  // h(), limpar_texto(), pode(), combina_com() — o núcleo
require_once __DIR__ . '/eventos-comum.php';

function avisar(string $tipo, string $texto): void
{
    $_SESSION['recado'] = ['tipo' => $tipo, 'texto' => $texto];
}

/**
 * Volta para o encontro, na aba em que a ação aconteceu.
 *
 * A âncora sozinha deixou de bastar quando a tela virou abas: `#funil` não
 * existe no HTML enquanto a aba dele não estiver aberta, e quem marcasse uma
 * presença cairia no Preparo sem entender o que tinha acontecido com a lista.
 * A âncora continua — ela é que rola até o ponto certo dentro da aba.
 *
 * `funil` é aba própria desde que o follow-up saiu do rodapé de Pessoas: quem
 * marca um degrau como feito volta para a fila de onde saiu, e não para a lista
 * de presença.
 */
function aba_da_ancora(string $ancora): string
{
    if ($ancora === 'pessoas' || $ancora === 'funil') {
        return $ancora;
    }
    return str_starts_with($ancora, 'peca-') ? 'preparo' : 'dados';
}

function voltar(string $eventoId = '', string $ancora = ''): void
{
    $url = '/painel/eventos.php' . ($eventoId !== '' ? '?e=' . urlencode($eventoId) : '');
    if ($eventoId !== '' && $ancora !== '') {
        $url .= '&aba=' . urlencode(aba_da_ancora($ancora));
    }
    header('Location: ' . $url . ($ancora !== '' ? '#' . $ancora : ''), true, 302);
    exit;
}

/** Barra quem não coordena antes de qualquer ação de decisão. */
function exigir_coordenacao(bool $coordena, string $eventoId = ''): void
{
    if (!$coordena) {
        avisar('erro', 'Só a coordenação decide sobre encontro. Você pode executar e cadastrar presença.');
        voltar($eventoId);
    }
}

/**
 * Trata o POST desta tela, se houver um.
 *
 * Volta em silêncio quando o método é GET — é o caso da imensa maioria das
 * visitas, e sair por cima evita o `if` gigante no arquivo de rota.
 */
function tratar_acoes_de_evento(array $eu, bool $coordena): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if (!token_valido()) {
            avisar('erro', 'Sessão expirada. Entre de novo.');
            derrubar_sessao();
            header('Location: /painel/', true, 302);
            exit;
        }

        $acao = (string) ($_POST['acao'] ?? '');

        /* ---------- criar o encontro (coordenação) ---------- */
        if ($acao === 'criar') {
            exigir_coordenacao($coordena);

            $titulo  = limpar_texto($_POST['titulo'] ?? '', 120);
            $familia = limpar_texto($_POST['familia'] ?? '', 20);
            $inicio  = inicio_de_dia_e_hora($_POST['dia'] ?? '', $_POST['hora'] ?? '');

            if ($titulo === '') {
                avisar('erro', 'Dê um nome ao encontro.');
                voltar();
            }
            if (!isset(FAMILIAS[$familia])) {
                avisar('erro', 'Escolha a família do evento — é ela que traz o playbook e as travas.');
                voltar();
            }
            /* Dois campos na tela, UM instante no arquivo. A pessoa pensa "sábado,
               9 da manhã"; o arquivo guarda o momento com o fuso do Ceará junto, que
               é o que faz ordenar, saber o que já passou e acender o "ao vivo" na
               hora certa. Antes eram dois textos livres — "29/07" sem ano e "19H" —
               e nada disso era possível. A hora pode ficar em branco: o dia já
               ordena, e o cartão simplesmente não mostra horário. */
            if ($inicio === '') {
                avisar('erro', 'Informe pelo menos o dia do encontro.');
                voltar();
            }

            /* A imagem é opcional. Falha de upload não derruba a criação do
               encontro: avisa e segue sem imagem — perder o encontro inteiro porque
               a foto era pesada demais seria trocar o essencial pelo enfeite. */
            $imagemNova = '';
            if (($env = arquivo_simples('imagem')) !== null) {
                $r = guardar_upload($env);
                if ($r['ok']) {
                    $imagemNova = $r['caminho'];
                } elseif ($r['erro'] !== '') {
                    avisar('erro', $r['erro'] . ' O encontro foi criado sem imagem.');
                }
            }

            $eventos = ler_eventos();
            $novo = [
                'id'      => novo_id_evento(),
                'titulo'  => $titulo,
                'familia' => $familia,
                'inicio'  => $inicio,
                'local'   => limpar_texto($_POST['local'] ?? '', 120),
                'endereco' => limpar_texto($_POST['endereco'] ?? '', 200),
                'publicoEsperado' => (int) ($_POST['publicoEsperado'] ?? 0),
                'naAgenda' => !empty($_POST['naAgenda']),
                'imagem'   => $imagemNova,
                'filtro'   => FILTRO_PADRAO,
                'token'   => bin2hex(random_bytes(10)),
                'tokenConfirmacao' => bin2hex(random_bytes(10)),
                'status'  => 'planejado',
                'criadoEm'  => date('c'),
                'criadoPor' => $eu['nome'],
            ];
            $eventos[] = $novo;

            if (!gravar_eventos($eventos)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar();
            }
            republicar_agenda();
            avisar('ok', 'Encontro criado. Agora escale as cinco peças.');
            voltar($novo['id']);
        }

        /* ---------- daqui para baixo tudo é sobre um encontro ---------- */
        $alvo = achar_evento(limpar_texto($_POST['id'] ?? '', 40));
        if ($alvo === null) {
            avisar('erro', 'Encontro não encontrado.');
            voltar();
        }

        /* ---------- editar e mudar status (coordenação) ---------- */
        if ($acao === 'salvar' || $acao === 'status') {
            exigir_coordenacao($coordena, $alvo['id']);

            $eventos = ler_eventos();
            foreach ($eventos as &$e) {
                if ($e['id'] !== $alvo['id']) {
                    continue;
                }
                if ($acao === 'status') {
                    $novoStatus = limpar_texto($_POST['status'] ?? '', 20);
                    if (isset(STATUS_EVENTO[$novoStatus])) {
                        $e['status'] = $novoStatus;
                    }
                } else {
                    $e['titulo']   = limpar_texto($_POST['titulo'] ?? $e['titulo'], 120);
                    $e['inicio']   = inicio_de_dia_e_hora($_POST['dia'] ?? '', $_POST['hora'] ?? '');
                    $e['local']    = limpar_texto($_POST['local'] ?? '', 120);
                    $e['endereco'] = limpar_texto($_POST['endereco'] ?? '', 200);
                    $e['publicoEsperado'] = (int) ($_POST['publicoEsperado'] ?? 0);
                    $e['orcamento']   = limpar_texto($_POST['orcamento'] ?? '', 60);
                    $e['observacoes'] = limpar_texto($_POST['observacoes'] ?? '', 600);
                    /* o que o site mostra */
                    $e['naAgenda']   = !empty($_POST['naAgenda']);
                    $e['subtitulo']  = limpar_texto($_POST['subtitulo'] ?? '', 120);
                    $e['cor']        = (string) ($_POST['cor'] ?? 'ouro');
                    $e['plataforma'] = (string) ($_POST['plataforma'] ?? '');
                    $e['aoVivo']     = !empty($_POST['aoVivo']);
                    $e['link']       = limpar_link($_POST['link'] ?? '');

                    /* imagem: upload novo > pedido de remoção > o que já estava lá.
                       `arquivo_simples()` só devolve ficha quando veio arquivo de
                       verdade — enquanto ela devolvia a ficha vazia do campo, este
                       `elseif` era inalcançável e "Remover esta imagem" não removia. */
                    if (($env = arquivo_simples('imagem')) !== null) {
                        $r = guardar_upload($env);
                        if ($r['ok']) {
                            apagar_imagem($e['imagem']);  // a que estava no lugar não serve mais
                            $e['imagem'] = $r['caminho'];
                        } elseif ($r['erro'] !== '') {
                            avisar('erro', $r['erro'] . ' O resto foi salvo.');
                        }
                    } elseif (!empty($_POST['tirarImagem'])) {
                        apagar_imagem($e['imagem']);
                        $e['imagem'] = '';
                    }
                    /* O filtro se guarda mesmo sem imagem: quem troca a foto depois
                       não precisa lembrar de reescolher o véu. */
                    $filtro = (string) ($_POST['filtro'] ?? '');
                    $e['filtro'] = isset(FILTROS[$filtro]) ? $filtro : FILTRO_PADRAO;
                    foreach (array_keys(PECAS) as $peca) {
                        $e['responsaveis'][$peca] = limpar_texto($_POST['resp'][$peca] ?? '', 40);
                    }
                }
            }
            unset($e);

            if (!gravar_eventos($eventos)) {
                avisar('erro', 'Não consegui gravar em /dados.');
            }
            /* Regrava o agenda.json na hora, e não por um botão "publicar": editar o
               encontro já exige coordenação, então não há revisão a mais para fazer
               — e "esqueci de publicar" deixa de ser um jeito de o site ficar
               desatualizado sem ninguém perceber. */
            republicar_agenda();
            voltar($alvo['id'], 'dados');
        }

        /* ---------- apagar o encontro (coordenação) ---------- */
        if ($acao === 'apagar') {
            exigir_coordenacao($coordena, $alvo['id']);

            /* ENCONTRO COM GENTE NA LISTA NÃO SE APAGA.
               A lista de presença é o registro de quem esteve lá: apagar o encontro
               apagaria, junto, a resposta de "em que encontros o Fulano esteve" —
               para todo mundo que apareceu, de uma vez, e sem desfazer.
               O que se apaga é o engano: o encontro digitado duas vezes, o rascunho
               que nunca virou nada. Para o que não vai acontecer existe CANCELADO,
               que já tira o encontro da programação pública sem apagar ninguém. */
            $naLista = count(presencas_do_evento($alvo['id']));
            if ($naLista > 0) {
                avisar('erro', 'Este encontro já tem ' . $naLista . ($naLista === 1 ? ' pessoa' : ' pessoas')
                    . ' na lista — apagá-lo apagaria o histórico de cada uma delas. Se ele não vai acontecer, mude a situação para “Cancelado”: sai da programação do site e a lista fica.');
                voltar($alvo['id'], 'dados');
            }

            $eventos = array_values(array_filter(ler_eventos(), fn ($e) => $e['id'] !== $alvo['id']));
            if (!gravar_eventos($eventos)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id'], 'dados');
            }
            apagar_imagem($alvo['imagem']);
            /* Regrava a agenda na hora: o encontro pode estar no ar em /programacao,
               e um cartão apontando para um encontro que não existe mais é pior do
               que um cartão a menos. */
            republicar_agenda();
            avisar('ok', 'Encontro apagado.');
            voltar();
        }

        /* ---------- tirar alguém da lista do encontro ---------- */
        if ($acao === 'tirar-pessoa') {
            $lead = limpar_texto($_POST['lead'] ?? '', 40);
            $linha = null;
            foreach (presencas_do_evento($alvo['id']) as $l) {
                if ($l['id'] === $lead) {
                    $linha = $l;
                    break;
                }
            }
            if ($linha === null) {
                avisar('erro', 'Essa pessoa não está na lista deste encontro.');
                voltar($alvo['id'], 'pessoas');
            }
            /* Some a LINHA, e não a pessoa: ela continua no cadastro, com telefone,
               funções e os outros encontros dela. O que se desfaz aqui é "esteve
               neste sábado" — quase sempre o dedo errado na lista, ou o mesmo
               número cadastrado duas vezes na porta. */
            $presencas = array_values(array_filter(
                ler_presencas(),
                fn ($l) => $l['id'] !== $linha['id']
            ));
            if (!gravar_presencas($presencas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id'], 'pessoas');
            }
            avisar('ok', explode(' ', $linha['pessoa']['nome'])[0]
                . ' saiu da lista deste encontro. O cadastro dela continua em /painel/pessoas.');
            voltar($alvo['id'], 'pessoas');
        }

        /* ---------- marcar item do checklist (qualquer um da área) ---------- */
        if ($acao === 'marcar') {
            $peca  = limpar_texto($_POST['peca'] ?? '', 20);
            $item  = (int) ($_POST['item'] ?? -1);
            $lista = checklist(PECAS[$peca]['checklist'] ?? '');

            if (!isset(PECAS[$peca]) || $lista === null || $item < 0 || $item >= count($lista['itens'])) {
                avisar('erro', 'Item de checklist desconhecido.');
                voltar($alvo['id']);
            }

            $eventos = ler_eventos();
            foreach ($eventos as &$e) {
                if ($e['id'] === $alvo['id']) {
                    $marcados = $e['feitos'][$peca] ?? [];
                    $e['feitos'][$peca] = in_array($item, $marcados, true)
                        ? array_values(array_diff($marcados, [$item]))
                        : array_merge($marcados, [$item]);
                }
            }
            unset($e);

            if (!gravar_eventos($eventos)) {
                avisar('erro', 'Não consegui gravar em /dados.');
            }
            voltar($alvo['id'], 'peca-' . $peca);
        }

        /* ---------- cadastrar quem vem ou quem chegou ---------- */
        /* ---------- escalar o time (quem já tem conta) ---------- */
        if ($acao === 'add-time') {
            $ids = array_map('strval', (array) ($_POST['usuario'] ?? []));
            if ($ids === []) {
                avisar('erro', 'Marque quem do time vai estar nesse encontro.');
                voltar($alvo['id'], 'pessoas');
            }

            $presencas = ler_presencas();
            $quantos = 0;
            foreach (pessoas_fora_do_evento($alvo['id']) as $u) {
                if (!in_array($u['id'], $ids, true)) {
                    continue;
                }
                $presencas[] = [
                    'id'       => novo_id_presenca(),
                    'eventoId' => $alvo['id'],
                    'pessoaId' => $u['id'],
                    'confirmou'  => true,
                    'compareceu' => false,   // marca-se quando o encontro acontece
                    'origem'     => 'painel',
                    'criadoPorId' => $eu['id'],
                    'criadoEm'    => date('c'),
                ];
                $quantos++;
            }

            if ($quantos === 0) {
                avisar('erro', 'Ninguém novo para escalar.');
                voltar($alvo['id'], 'pessoas');
            }
            if (!gravar_presencas($presencas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id'], 'pessoas');
            }
            avisar('ok', $quantos . ($quantos === 1 ? ' pessoa escalada.' : ' pessoas escaladas.')
                . ' Marque “compareceu” no dia — é isso que faz a conta do encontro fechar.');
            voltar($alvo['id'], 'pessoas');
        }

        if ($acao === 'add-pessoa') {
            $nome     = limpar_texto($_POST['nome'] ?? '', 80);
            $telefone = so_digitos($_POST['telefone'] ?? '');

            if ($nome === '') {
                avisar('erro', 'Diga o nome da pessoa.');
                voltar($alvo['id'], 'pessoas');
            }
            if ($telefone !== '' && (strlen($telefone) < 10 || strlen($telefone) > 11)) {
                avisar('erro', 'Confira o WhatsApp: use DDD + número.');
                voltar($alvo['id'], 'pessoas');
            }
            /* Já conhecemos este número? Então NÃO se cria outra pessoa — entra
               uma presença apontando para quem já existe. Antes cada encontro
               guardava uma cópia da pessoa, e quem veio a cinco tinha cinco fichas
               com o nome escrito de jeitos diferentes. */
            $jaExiste = $telefone !== '' ? (pessoas_por_telefone($telefone)[0] ?? null) : null;

            if ($jaExiste !== null && presenca_de($alvo['id'], $jaExiste['id']) !== null) {
                avisar('erro', 'Essa pessoa já está na lista deste encontro.');
                voltar($alvo['id'], 'pessoas');
            }

            $pessoaId = $jaExiste['id'] ?? '';
            if ($jaExiste === null) {
                $pessoas = ler_pessoas();
                $nova = [
                    'id'       => novo_id_pessoa(),
                    'nome'     => $nome,
                    'tipo'     => limpar_texto($_POST['tipo'] ?? 'eleitor', 20),
                    'telefone' => $telefone,
                    'bairro'   => limpar_texto($_POST['bairro'] ?? '', 60),
                    'cidade'   => limpar_texto($_POST['cidade'] ?? '', 60),
                    'criadoEm' => date('c'),
                    /* Quem digita aqui é da Recepção, com a pessoa na frente: o
                       consentimento é verbal, mas fica registrado com versão e data
                       como o do QR. Sem isto a lista mistura ficha com e sem base
                       legal anotada, e não há como saber qual é qual depois. */
                    'consentimentoEm'     => date('c'),
                    'consentimentoVersao' => VERSAO_CONSENTIMENTO_PRESENCA,
                ];
                $pessoas[] = $nova;
                if (!gravar_pessoas($pessoas)) {
                    avisar('erro', 'Não consegui gravar em /dados.');
                    voltar($alvo['id'], 'pessoas');
                }
                $pessoaId = $nova['id'];
            }

            $presencas = ler_presencas();
            $presencas[] = [
                'id'       => novo_id_presenca(),
                'eventoId' => $alvo['id'],
                'pessoaId' => $pessoaId,
                'convidadoPor' => limpar_texto($_POST['convidadoPor'] ?? '', 60),
                'confirmou'  => !empty($_POST['confirmou']),
                'compareceu' => !empty($_POST['compareceu']),
                'origem'     => 'painel',
                'criadoPorId' => $eu['id'],
                'criadoEm'    => date('c'),
            ];

            if (!gravar_presencas($presencas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
                voltar($alvo['id'], 'pessoas');
            }
            avisar('ok', $nome . ($jaExiste !== null ? ' (já cadastrada) entrou na lista.' : ' entrou na lista.'));
            voltar($alvo['id'], 'pessoas');
        }

        /* ---------- confirmar presença, classificar, andar no funil ---------- */
        if (in_array($acao, ['confirmou', 'compareceu', 'classificar', 'funil'], true)) {
            $presencaId = limpar_texto($_POST['lead'] ?? '', 40);
            $presencas  = ler_presencas();
            $achou  = false;
            /* O TIPO mudou de lugar: era `classe` na ficha do encontro, agora é da
               pessoa — ela é militante em todo lugar, não só naquele sábado. Por
               isso "classificar" grava em dois arquivos. */
            $tipoNovo = limpar_texto($_POST['tipo'] ?? '', 20);
            $pessoaDoTipo = '';

            foreach ($presencas as &$l) {
                if ($l['id'] !== $presencaId || $l['eventoId'] !== $alvo['id']) {
                    continue;
                }
                $achou = true;

                if ($acao === 'confirmou') {
                    $l['confirmou'] = !$l['confirmou'];
                } elseif ($acao === 'compareceu') {
                    $l['compareceu'] = !$l['compareceu'];
                } elseif ($acao === 'classificar') {
                    $pessoaDoTipo = $l['pessoaId'];
                    $l['observacao'] = limpar_texto($_POST['observacao'] ?? '', 300);
                } else {
                    // o funil é cobrança da coordenação
                    if (!$coordena) {
                        avisar('erro', 'O follow-up é da coordenação.');
                        voltar($alvo['id'], 'funil');
                    }
                    $etapa = limpar_texto($_POST['etapa'] ?? '', 5);
                    if (isset(ROTULO_FUNIL[$etapa])) {
                        $l['funil'][$etapa] = $l['funil'][$etapa] === '' ? date('c') : '';
                    }
                }
            }
            unset($l);

            if (!$achou) {
                avisar('erro', 'Pessoa não encontrada neste encontro.');
                voltar($alvo['id'], 'pessoas');
            }
            if ($pessoaDoTipo !== '' && isset(TIPOS_PESSOA[$tipoNovo])) {
                $pessoas = ler_pessoas();
                foreach ($pessoas as &$p) {
                    if ($p['id'] === $pessoaDoTipo) {
                        $p['tipo'] = $tipoNovo;
                    }
                }
                unset($p);
                gravar_pessoas($pessoas);
            }

            if (!gravar_presencas($presencas)) {
                avisar('erro', 'Não consegui gravar em /dados.');
            }
            voltar($alvo['id'], $acao === 'funil' ? 'funil' : 'pessoas');
        }

        avisar('erro', 'Ação desconhecida.');
        voltar();
    }
}
