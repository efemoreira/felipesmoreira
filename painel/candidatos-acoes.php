<?php
declare(strict_types=1);

/**
 * O que o painel FAZ com um candidato e com uma lista — o lado POST de
 * `/painel/candidatos`.
 *
 * SÃO DUAS COISAS SEPARADAS, e é a separação que importa: o candidato é um
 * cadastro simples (quem é, que número tem, qual o @), e a lista é curadoria
 * (um nome e quem entra nela). Misturá-las num formulário faria renomear a
 * lista reenviar a marcação inteira.
 *
 * A TRAVA DO NÚMERO MORA AQUI. Cada cargo carrega quantos dígitos tem, e a
 * gravação recusa o que não bate: vereador com quatro dígitos não é um número
 * quase certo, é um voto que não vai para ninguém.
 *
 * Toda ação termina em redirecionamento (POST-redirect-GET).
 */

require_once __DIR__ . '/candidatos-comum.php';

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

/** Trata o POST desta tela, se houver um. Não volta quando de fato agiu. */
function tratar_acoes_de_candidato(): void
{
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
}
