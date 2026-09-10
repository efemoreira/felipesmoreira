<?php
declare(strict_types=1);

/**
 * A regra de dado pessoal do movimento — quem vê nome e telefone de gente.
 *
 * **Só `adm` e `coordenacao` leem nome e telefone.** É regra do movimento, não
 * detalhe de tela, e vale para qualquer lugar que desenhe uma pessoa: lista de
 * presença, seletor, linha do tempo, resultado da busca, a gente de quem
 * lidera. Por isso mora num arquivo próprio, e não em `eventos-comum.php`,
 * onde nasceu: lá, quem precisava de `nome_encoberto()` na linha do tempo ou
 * na busca arrastava o modelo inteiro do encontro para conseguir esconder um
 * sobrenome — e a regra parecia ser "do encontro", quando é de todo mundo.
 *
 * Foi assim, aliás, que `pode_ver_telefone()` passou meses perguntando
 * `pode('agenda')` — uma área que a capacidade Eventos concede junto — e não
 * travava ninguém. Regra de segurança que mora no meio de 1500 linhas de
 * outro assunto é regra que ninguém relê.
 *
 * Não confira esta regra lendo as funções: `testes/fumaca/acessos.test.ts`
 * troca a capacidade da conta, abre a tela e procura o telefone no HTML.
 */

require_once __DIR__ . '/sessao.php';

/**
 * Quem enxerga o telefone: a coordenação, e quem cadastrou aquela pessoa.
 *
 * Esconder de quem digitou o número não protegeria ninguém — a pessoa acabou de
 * ver o telefone para escrevê-lo. O que a regra evita é a lista inteira de
 * contatos ficar aberta para todo mundo que tem conta, e crescer junto com o
 * time. A lista COMPLETA, de todo mundo, é outra coisa: mora em /painel/pessoas
 * e pede a capacidade de administração.
 *
 * **A trava era `pode('agenda')`, e não travava nada.** A capacidade Eventos
 * concede `eventos` E `agenda` juntas, então todo mundo que a recebia pelo
 * caminho normal caía do lado de dentro — o número saía em link de WhatsApp
 * para quem só organiza encontro. O único jeito de cair do lado protegido era
 * ter `eventos` sem `agenda`, uma combinação que só sai do ajuste fino à mão.
 * Uma trava que só pega quem foi montado a dedo não é trava.
 *
 * Agora ela pergunta a capacidade, que é onde a decisão de fato mora:
 * **organizar um encontro não dá a agenda de telefones do movimento.** Quem
 * coordena o encontro continua vendo a lista inteira, com nome, bairro e
 * presença — o número é que fica encoberto, e o follow-up por WhatsApp é da
 * coordenação. `tem_capacidade()` já responde sim para `adm`.
 */
function pode_ver_telefone(array $presenca, ?array $eu): bool
{
    if ($eu === null) {
        return false;
    }
    return tem_capacidade('coordenacao')
        || ($presenca['criadoPorId'] !== '' && $presenca['criadoPorId'] === $eu['id']);
}

/**
 * "Maria da Silva Sauro" -> "Maria S." — o nome quando ele não é o assunto.
 *
 * A linha do tempo do hub contava "Fulana entrou na lista de tal encontro", com
 * o nome inteiro, para qualquer conta que abrisse `eventos`. Uma linha por
 * presença, todos os encontros juntos: rolando a página até o fim saía o
 * cadastro de quem já apareceu em algum encontro, sem passar por /painel/pessoas.
 *
 * O recado é sobre a Recepção estar funcionando, e para isso o primeiro nome
 * basta — quem precisa saber exatamente quem é abre o encontro. As partículas
 * do meio saem pelo mesmo motivo que saem do `login_sugerido()`: "de" não é
 * sobrenome de ninguém.
 */
function nome_encoberto(string $nome): string
{
    $partes = array_values(array_filter(explode(' ', trim($nome))));
    if ($partes === []) {
        return 'Alguém';
    }
    $sobrenomes = array_values(array_filter(
        array_slice($partes, 1),
        fn ($p) => !in_array(mb_strtolower($p), ['de', 'da', 'do', 'das', 'dos', 'e'], true),
    ));
    $ultimo = end($sobrenomes);
    return $partes[0] . ($ultimo === false ? '' : ' ' . mb_strtoupper(mb_substr($ultimo, 0, 1)) . '.');
}

/** 85912345678 -> (85) 9••••-••78 */
function telefone_encoberto(string $telefone): string
{
    $d = so_digitos($telefone);
    if (strlen($d) < 4) {
        return '•••';
    }
    return '(' . substr($d, 0, 2) . ') ' . substr($d, 2, 1) . '••••-••' . substr($d, -2);
}
