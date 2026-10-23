<?php
declare(strict_types=1);

require_once __DIR__ . '/sessao.php';

const ARQ_PLANO_FEEDBACK = PASTA_DADOS . '/plano-feedback.php';

function ler_feedbacks_plano(): array
{
    $dados = is_file(ARQ_PLANO_FEEDBACK) ? @include ARQ_PLANO_FEEDBACK : [];
    return is_array($dados) ? $dados : [];
}

function guardar_feedback_plano(array $feedback): bool
{
    return com_trava(ARQ_PLANO_FEEDBACK, function () use ($feedback): bool {
        $todos = ler_feedbacks_plano();
        $todos[] = $feedback;
        return gravar_atomico(ARQ_PLANO_FEEDBACK, "<?php\nreturn " . var_export($todos, true) . ";\n");
    });
}
