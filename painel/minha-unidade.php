<?php
declare(strict_types=1);

/**
 * A unidade de quem responde por ela — felipesmoreira.com/painel/minha-unidade.php?u=<id>
 *
 * Não é área do menu: entra pelo "Meu lugar" do Início. Abre para quem é
 * responsável ou substituto da unidade, e para quem abre a Organização. O
 * resto volta para o Início — `pode_cuidar()` é a régua, e ela vale também
 * para o POST (`minha-unidade-acoes.php`).
 */

require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/minha-unidade-comum.php';
require_once __DIR__ . '/minha-unidade-acoes.php';
require_once __DIR__ . '/minha-unidade-tela.php';

exigir_login();
$eu = usuario_atual() ?? [];

$cuidadas = pode('organizacao') ? unidades_abertas() : unidades_de_que_cuida($eu);
$pedida = (string) ($_GET['u'] ?? $_POST['unidade'] ?? '');
$unidade = null;
foreach ($cuidadas as $x) {
    if ($x['id'] === $pedida || ($pedida === '' && $unidade === null)) {
        $unidade = $x;
    }
}
if ($unidade === null || !pode_cuidar($eu, $unidade)) {
    header('Location: /painel/', true, 302);
    exit;
}

tratar_acoes_da_unidade($eu, $unidade);

['erro' => $erro, 'ok' => $ok] = recado_pendente();

tela_da_unidade($eu, $unidade, $cuidadas, $erro, $ok);
