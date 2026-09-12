<?php
declare(strict_types=1);

/**
 * Porta de entrada do painel — felipesmoreira.com/painel
 *
 * Três telas, na ordem em que a vida acontece:
 *   1. não existe nenhum usuário  → criar o primeiro administrador;
 *   2. existe usuário, ninguém logado → login;
 *   3. logado → o Início, com o trabalho desta pessoa.
 *
 *   index-acoes.php   entrar, sair, criar o administrador, as duas marcas
 *   index-login.php   a porta (1 e 2)
 *   index-hub.php     o Início (3)
 *
 * O Início NÃO lista as áreas: para onde ir é a lateral do layout.php, e
 * repetir a lista aqui era ler o mesmo menu duas vezes. Aqui só entra o que
 * é trabalho — a mesa da função, a fila, o próximo encontro e a formação.
 */

require_once __DIR__ . '/layout.php';  // puxa o sessao.php junto
require_once __DIR__ . '/index-acoes.php';
require_once __DIR__ . '/index-login.php';
require_once __DIR__ . '/index-hub.php';

/* Primeiro acesso é NINGUÉM TER CONTA, e não a lista de pessoas estar vazia:
   depois da unificação a lista tem quem confirmou presença num encontro, e
   essa gente não abre o painel.

   E É TAMBÉM O ARQUIVO NÃO EXISTIR, que é a metade que faltava. Esta tela não
   pergunta quem é ninguém: ela aceita que qualquer visitante crie um
   administrador, e por isso a condição para mostrá-la tem de ser "instalação
   nova", não "a leitura devolveu vazio". `ler_pessoas()` usa `@include` e
   devolve `[]` calado quando o arquivo está sem permissão, num disco cheio ou
   com o OPcache servindo uma versão velha — e em qualquer desses o painel
   abriria a porta da rua enquanto o cadastro continua inteiro no disco.

   Com o `is_file()`, falha de leitura vira tela de login (que não deixa
   ninguém entrar) em vez de convite para virar administrador. */
$primeiroAcesso = contas() === [] && !is_file(ARQ_PESSOAS);

['aviso' => $aviso, 'sucesso' => $sucesso] = tratar_acoes_do_inicio($primeiroAcesso);

$u = usuario_atual();

if ($u !== null && $u['trocarSenha']) {
    header('Location: /painel/conta.php', true, 302);
    exit;
}

if ($u === null) {
    tela_de_login($primeiroAcesso, $aviso, $sucesso);
    exit;
}

tela_do_inicio($u, $aviso, $sucesso);
