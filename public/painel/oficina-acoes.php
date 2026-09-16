<?php
declare(strict_types=1);

/**
 * O lado POST da Oficina: andar com o formato da vez, adiar, anotar número.
 * Nenhuma linha de HTML aqui.
 *
 * TODA AÇÃO ESCREVE POR `gravar_minha_oficina()`, que carimba o dono e devolve
 * a linha dos outros intacta. É o que faz "cada um tem a sua oficina" ser uma
 * propriedade do código, e não uma promessa da tela.
 */

require_once __DIR__ . '/oficina-comum.php';
require_once __DIR__ . '/oficina-capas.php';
require_once __DIR__ . '/acoes-comum.php';  // avisar(), ir_para(), exigir_token_de_acao()

function voltar_oficina(string $aba = ''): void
{
    ir_para('/painel/oficina.php' . ($aba !== '' ? '?aba=' . urlencode($aba) : ''));
}

function tratar_acoes_de_oficina(array $eu): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    exigir_token_de_acao();

    $acao = (string) ($_POST['acao'] ?? '');
    $minhas = minha_oficina($eu);

    if ($acao === 'passo') {
        $formato = limpar_texto($_POST['formato'] ?? '', 60);
        if (!isset(FORMATOS_OFICINA[$formato])) {
            avisar('erro', 'Esse formato não está no catálogo.');
            voltar_oficina();
        }
        $para = (string) ($_POST['para'] ?? '');
        if (!isset(ESTADOS_OFICINA[$para]) || $para === 'aberto') {
            avisar('erro', 'Passo desconhecido.');
            voltar_oficina();
        }

        if ($para === 'publicado') {
            $tema = limpar_texto($_POST['tema'] ?? '', 140);
            if ($tema === '') {
                /* O único campo obrigatório do fluxo inteiro. Sem ele, a aba
                   Números vira uma lista de formatos sem saber de que vídeo
                   cada linha fala — e o registro perde a serventia. */
                avisar('erro', 'Diga do que era o vídeo. É o que vai identificar ele na aba Números.');
                voltar_oficina();
            }
        }

        $achou = false;
        foreach ($minhas as &$t) {
            if ($t['formato'] === $formato && $t['estado'] !== 'publicado') {
                $t['estado'] = $para;
                /* Andar com o formato desfaz o adiamento: quem gravou não está
                   mais deixando para depois. */
                $t['adiadoEm'] = '';
                if ($para === 'publicado') {
                    $t['tema']   = limpar_texto($_POST['tema'] ?? '', 140);
                    $t['link']   = limpar_texto($_POST['link'] ?? '', 300);
                    $t['gancho'] = limpar_texto($_POST['gancho'] ?? '', 40);
                    $t['publicadoEm'] = hoje_na_oficina();
                }
                $achou = true;
                break;
            }
        }
        unset($t);

        if (!$achou) {
            $minhas[] = [
                'id'      => bin2hex(random_bytes(8)),
                'pessoa'  => (string) ($eu['id'] ?? ''),
                'formato' => $formato,
                'estado'  => $para,
                'tema'    => limpar_texto($_POST['tema'] ?? '', 140),
                'link'    => limpar_texto($_POST['link'] ?? '', 300),
                'gancho'  => limpar_texto($_POST['gancho'] ?? '', 40),
                'publicadoEm' => $para === 'publicado' ? hoje_na_oficina() : '',
                'criadoEm'  => date('c'),
                'criadoPor' => (string) ($eu['nome'] ?? ''),
            ];
        }

        if (!gravar_minha_oficina($eu, $minhas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar_oficina();
        }

        if ($para === 'publicado') {
            avisar('ok', FORMATOS_OFICINA[$formato]['nome'] . ' publicado. Volte em uns dias para anotar os números.');
            voltar_oficina();
        }
        avisar('ok', FORMATOS_OFICINA[$formato]['nome'] . ': ' . mb_strtolower(ESTADOS_OFICINA[$para]) . '.');
        voltar_oficina();
    }

    if ($acao === 'adiar' || $acao === 'retomar') {
        $formato = limpar_texto($_POST['formato'] ?? '', 60);
        if (!isset(FORMATOS_OFICINA[$formato])) {
            avisar('erro', 'Esse formato não está no catálogo.');
            voltar_oficina();
        }
        $carimbo = $acao === 'adiar' ? date('c') : '';

        $achou = false;
        foreach ($minhas as &$t) {
            if ($t['formato'] === $formato && $t['estado'] !== 'publicado') {
                $t['adiadoEm'] = $carimbo;
                $achou = true;
                break;
            }
        }
        unset($t);

        if (!$achou) {
            if ($acao === 'retomar') {
                avisar('erro', 'Esse formato não está adiado.');
                voltar_oficina();
            }
            /* Adiar sem ter começado é o caso comum — o formato da vez não
               serve para hoje e você quer o próximo. A tentativa nasce só para
               carregar o carimbo. */
            $minhas[] = [
                'id'      => bin2hex(random_bytes(8)),
                'pessoa'  => (string) ($eu['id'] ?? ''),
                'formato' => $formato,
                'estado'  => 'aberto',
                'adiadoEm'  => $carimbo,
                'criadoEm'  => date('c'),
                'criadoPor' => (string) ($eu['nome'] ?? ''),
            ];
        }

        if (!gravar_minha_oficina($eu, $minhas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar_oficina();
        }
        avisar('ok', $acao === 'adiar'
            ? FORMATOS_OFICINA[$formato]['nome'] . ' foi para o fim da fila.'
            : FORMATOS_OFICINA[$formato]['nome'] . ' voltou para a fila.');
        voltar_oficina();
    }

    if ($acao === 'numeros') {
        $id = limpar_texto($_POST['id'] ?? '', 40);
        $achou = false;
        foreach ($minhas as &$t) {
            if ($t['id'] === $id) {
                foreach (array_keys(NUMEROS_OFICINA) as $campo) {
                    /* Campo em branco é "ainda não sei", e não zero: sobrescrever
                       com 0 apagaria a medida de quem voltou para corrigir só a
                       retenção. */
                    $bruto = trim((string) ($_POST[$campo] ?? ''));
                    if ($bruto !== '') {
                        $t[$campo] = max(0, (int) preg_replace('/\D/', '', $bruto));
                    }
                }
                $t['nota'] = limpar_texto($_POST['nota'] ?? '', 500);
                $achou = true;
                break;
            }
        }
        unset($t);

        if (!$achou) {
            avisar('erro', 'Vídeo não encontrado na sua oficina.');
            voltar_oficina('numeros');
        }
        if (!gravar_minha_oficina($eu, $minhas)) {
            avisar('erro', 'Não consegui gravar em /dados.');
            voltar_oficina('numeros');
        }
        avisar('ok', 'Números anotados.');
        voltar_oficina('numeros');
    }

    if ($acao === 'capas') {
        /* Em lote pequeno: cada capa são duas idas à rede, e trinta e duas
           numa requisição só estouram o tempo de hospedagem compartilhada
           antes de terminar — aí não se baixa nenhuma. */
        $r = baixar_capas();
        if ($r['baixadas'] === 0 && $r['falharam'] > 0) {
            avisar('erro', 'Não consegui buscar nenhuma capa agora. O desenho da estrutura continua no lugar — tente de novo mais tarde.');
            voltar_oficina('formatos');
        }
        $recado = $r['baixadas'] === 1 ? '1 capa baixada' : $r['baixadas'] . ' capas baixadas';
        if ($r['faltam'] > 0) {
            $recado .= '. Faltam ' . $r['faltam'] . ' — clique de novo para continuar';
        }
        avisar('ok', $recado . '.');
        voltar_oficina('formatos');
    }

    if ($acao === 'apagar') {
        $id = limpar_texto($_POST['id'] ?? '', 40);
        if (!apagar_tentativa($eu, $id, limpar_texto($_POST['motivo'] ?? '', 120))) {
            avisar('erro', 'Vídeo não encontrado na sua oficina.');
            voltar_oficina('numeros');
        }
        avisar('ok', 'Registro apagado.');
        voltar_oficina('numeros');
    }

    avisar('erro', 'Ação desconhecida.');
    voltar_oficina();
}
