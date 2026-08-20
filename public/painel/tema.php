<?php
declare(strict_types=1);

/**
 * Trocar o tema do painel — claro, escuro ou o do sistema.
 *
 * Endpoint próprio, e não um `acao` dentro de cada tela, por dois motivos:
 * cada página trata o próprio $_POST['acao'] e responderia "Ação desconhecida"
 * a um que não conhece; e o tema é a única coisa do painel que se troca de
 * qualquer tela, então ter um lugar só evita repetir a mesma lógica em nove.
 *
 * Funciona SEM JavaScript: o formulário do rodapé da lateral posta aqui e volta
 * para a mesma página. Com JavaScript, o script do layout.php intercepta e
 * troca na hora, sem recarregar — o cookie que ele grava é este mesmo.
 */

require_once __DIR__ . '/sessao.php';
exigir_login();

$volta = caminho_interno_seguro($_POST['volta'] ?? '');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !token_valido()) {
    header('Location: ' . $volta, true, 303);
    exit;
}

gravar_tema((string) ($_POST['tema'] ?? ''));

// 303: a volta é um GET, não uma repetição deste POST
header('Location: ' . $volta, true, 303);
exit;
