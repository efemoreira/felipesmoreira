<?php
declare(strict_types=1);

/**
 * Gestão das aulas em vídeo — felipesmoreira.com/painel/aulas
 *
 * Placeholder da próxima atualização: por enquanto só confirma que a área
 * existe e está protegida. O CRUD de aulas (YouTube não-listado) entra aqui.
 */

require_once __DIR__ . '/layout.php';
exigir_area('aulas');

abrir_pagina('Aulas em vídeo');
?>
<div class="capa">
  <h1>Aulas em vídeo</h1>
  <p class="sub">Esta área ainda está em construção — a gestão das aulas entra na próxima atualização.</p>
</div>
<?php
fechar_pagina();
