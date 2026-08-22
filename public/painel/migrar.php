<?php
declare(strict_types=1);

/**
 * Converte os cadastros antigos para o registro único de pessoa.
 *
 * Havia quatro arquivos que não se conheciam — `usuarios.php`, `inscricoes.php`,
 * `leads.php` e `candidatos.php` — e a mesma pessoa aparecia em vários. Este
 * arquivo junta os quatro em `pessoas.php` + `presencas.php`, casando por
 * telefone e, na falta dele, por nome sem acento.
 *
 * RODA SOZINHO, uma vez, quando `pessoas.php` ainda não existe e algum dos
 * antigos existe — chamado de dentro do `sessao.php`, antes de qualquer leitura.
 * Não é uma tela nem um botão de propósito: uma migração que depende de alguém
 * lembrar de clicar é uma migração que roda no meio do expediente errado.
 *
 * Os arquivos antigos **não são apagados**. Ficam como estão, e a migração não
 * roda de novo porque `pessoas.php` passou a existir. Se algo saiu errado, o
 * conserto é apagar `pessoas.php` e ajustar aqui — o original continua lá.
 */

/** true se converteu alguma coisa agora. */
function migrar_para_pessoas(): bool
{
    $antigos = [
        'usuarios'   => PASTA_DADOS . '/usuarios.php',
        'inscricoes' => PASTA_DADOS . '/inscricoes.php',
        'leads'      => PASTA_DADOS . '/leads.php',
        'candidatos' => PASTA_DADOS . '/candidatos.php',
    ];

    // já migrado, ou nada a migrar
    if (is_file(ARQ_PESSOAS)) {
        return false;
    }
    $temAlgum = false;
    foreach ($antigos as $arq) {
        if (is_file($arq)) {
            $temAlgum = true;
        }
    }
    if (!$temAlgum) {
        return false;
    }

    $ler = function (string $arq): array {
        if (!is_file($arq)) {
            return [];
        }
        $v = @include $arq;
        return is_array($v) ? $v : [];
    };

    $pessoas = [];
    /** telefone|nome -> índice em $pessoas, para casar as quatro listas */
    $porTelefone = [];
    $porNome = [];

    /** Acha a pessoa já criada, ou cria. Devolve o índice. */
    $entrar = function (array $bruto) use (&$pessoas, &$porTelefone, &$porNome): int {
        $tel = so_digitos($bruto['telefone'] ?? '');
        $nome = trim((string) ($bruto['nome'] ?? ''));
        $chaveNome = mb_strtolower(sem_acento($nome));

        /* Telefone primeiro: é a chave forte. Nome só quando não há telefone —
           casar por nome com telefone diferente juntaria dois homônimos. */
        if ($tel !== '' && isset($porTelefone[$tel])) {
            return $porTelefone[$tel];
        }
        if ($tel === '' && $chaveNome !== '' && isset($porNome[$chaveNome])) {
            return $porNome[$chaveNome];
        }

        $pessoas[] = [
            'id'   => bin2hex(random_bytes(8)),
            'nome' => $nome,
            'tipo' => 'eleitor',
            'telefone' => $tel,
            'criadoEm' => (string) ($bruto['criadoEm'] ?? date('c')),
        ];
        $i = count($pessoas) - 1;
        if ($tel !== '') {
            $porTelefone[$tel] = $i;
        }
        if ($chaveNome !== '') {
            $porNome[$chaveNome] = $i;
        }
        return $i;
    };

    /** Só preenche o que está vazio: a primeira fonte que trouxe o dado ganha. */
    $completar = function (int $i, array $de, array $campos) use (&$pessoas): void {
        foreach ($campos as $campo) {
            $v = (string) ($de[$campo] ?? '');
            if ($v !== '' && ($pessoas[$i][$campo] ?? '') === '') {
                $pessoas[$i][$campo] = $v;
            }
        }
    };

    /* ---------- 1. contas do painel ----------
       Primeiro de propósito: é o cadastro com mais informação e o único que não
       pode se perder — perder uma conta é trancar alguém para fora. */
    foreach ($ler($antigos['usuarios']) as $u) {
        $i = $entrar($u);
        /* O id da conta é preservado: a sessão guarda o id, e trocá-lo
           derrubaria quem estiver logado no momento da migração. */
        $pessoas[$i]['id'] = (string) ($u['id'] ?? $pessoas[$i]['id']);
        $completar($i, $u, ['email', 'cidade', 'bairro', 'consentimentoEm', 'consentimentoVersao']);
        $pessoas[$i]['usuario'] = (string) ($u['usuario'] ?? '');
        $pessoas[$i]['hash']    = (string) ($u['hash'] ?? '');
        $pessoas[$i]['ativo']   = !empty($u['ativo']);
        $pessoas[$i]['trocarSenha']   = !empty($u['trocarSenha']);
        $pessoas[$i]['ultimoAcesso']  = (string) ($u['ultimoAcesso'] ?? '');
        $pessoas[$i]['entrouNoGrupo'] = !empty($u['entrouNoGrupo']);
        $pessoas[$i]['funcoes'] = (array) ($u['funcoes'] ?? []);
        $pessoas[$i]['tipo'] = 'militante';
        $pessoas[$i]['status'] = 'aprovada';

        /* As áreas viram capacidades: se a pessoa tinha TODAS as áreas de uma
           capacidade, ela ganha a capacidade; o resto fica como ajuste fino. */
        $areas = (array) ($u['areas'] ?? []);
        $caps = [];
        if (($u['papel'] ?? '') === 'admin') {
            $caps[] = 'adm';
            $pessoas[$i]['tipo'] = 'coordenador';
        } else {
            foreach (CAPACIDADES as $chave => $cap) {
                if ($cap['areas'] !== [] && array_diff($cap['areas'], $areas) === []) {
                    $caps[] = $chave;
                    if ($chave === 'coordenacao') {
                        $pessoas[$i]['tipo'] = 'coordenador';
                    }
                }
            }
        }
        $pessoas[$i]['capacidades'] = $caps;
        $pessoas[$i]['areas'] = $areas;
    }

    /* ---------- 2. a fila de inscrição ---------- */
    foreach ($ler($antigos['inscricoes']) as $ins) {
        $i = $entrar($ins);
        $completar($i, $ins, ['email', 'cidade', 'bairro', 'origem', 'consentimentoEm',
                              'consentimentoVersao', 'decididoEm', 'decididoPor']);
        if (($pessoas[$i]['funcoes'] ?? []) === []) {
            $pessoas[$i]['funcoes'] = (array) ($ins['funcoes'] ?? []);
        }
        $status = (string) ($ins['status'] ?? 'nova');
        /* "nova" virou "pendente": o nome antigo dizia quando ela chegou, e não
           o que está faltando acontecer com ela. */
        $novo = $status === 'nova' ? 'pendente' : $status;
        if (($pessoas[$i]['status'] ?? '') === '') {
            $pessoas[$i]['status'] = $novo;
        }
        if ($novo === 'aprovada' && ($pessoas[$i]['tipo'] ?? 'eleitor') === 'eleitor') {
            $pessoas[$i]['tipo'] = 'militante';
        }
    }

    /* ---------- 3. quem apareceu em encontro ---------- */
    $presencas = [];
    foreach ($ler($antigos['leads']) as $l) {
        $i = $entrar($l);
        $completar($i, $l, ['bairro', 'cidade', 'consentimentoEm', 'consentimentoVersao']);

        /* A `classe` do lead virou o `tipo` da pessoa. "curioso" e
           "simpatizante" não têm par entre os cinco tipos novos e caem em
           eleitor — que é o que eles queriam dizer. */
        $de = ['curioso' => 'eleitor', 'simpatizante' => 'eleitor',
               'militante' => 'militante', 'apoiador' => 'apoiador'];
        $tipoLead = $de[(string) ($l['classe'] ?? '')] ?? 'eleitor';
        $ordem = array_flip(array_keys(TIPOS_PESSOA));
        if (($ordem[$tipoLead] ?? 0) > ($ordem[$pessoas[$i]['tipo'] ?? 'eleitor'] ?? 0)) {
            $pessoas[$i]['tipo'] = $tipoLead;
        }

        $presencas[] = [
            'id'       => (string) ($l['id'] ?? bin2hex(random_bytes(8))),
            'eventoId' => (string) ($l['eventoId'] ?? ''),
            'pessoaId' => $pessoas[$i]['id'],
            'convidadoPor' => (string) ($l['convidadoPor'] ?? ''),
            'observacao' => (string) ($l['observacao'] ?? ''),
            'confirmou'  => !empty($l['confirmou']),
            'compareceu' => !empty($l['compareceu']),
            'origem'     => (string) ($l['origem'] ?? 'painel'),
            'criadoPorId' => (string) ($l['criadoPorId'] ?? ''),
            'criadoEm'    => (string) ($l['criadoEm'] ?? ''),
            'funil'    => (array) ($l['funil'] ?? []),
        ];
    }

    /* ---------- 4. candidatos ---------- */
    foreach ($ler($antigos['candidatos']) as $c) {
        $i = $entrar($c);
        $completar($i, $c, ['urna', 'cargo', 'numero', 'partido', 'instagram', 'imagem']);
        $pessoas[$i]['tipo'] = 'candidato';
        $pessoas[$i]['publicado'] = !empty($c['publicado']);
        /* O id do candidato é preservado: as LISTAS apontam para ele, e trocá-lo
           esvaziaria todas as listas montadas. */
        if (!empty($c['id']) && ($pessoas[$i]['usuario'] ?? '') === '') {
            $antigoId = $pessoas[$i]['id'];
            $pessoas[$i]['id'] = (string) $c['id'];
            foreach ($presencas as $k => $pr) {
                if ($pr['pessoaId'] === $antigoId) {
                    $presencas[$k]['pessoaId'] = (string) $c['id'];
                }
            }
        }
    }

    if (!gravar_pessoas($pessoas)) {
        return false;
    }
    if ($presencas !== []) {
        require_once __DIR__ . '/eventos-comum.php';
        gravar_presencas($presencas);
    }
    return true;
}
