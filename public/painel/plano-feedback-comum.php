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

/** Dados mostrados a quem recebeu o link do plano. Nunca expõe códigos antigos. */
function feedbacks_plano_publicos(): array
{
    return array_reverse(array_map(function (array $feedback): array {
        unset($feedback['tokenHash']);
        return $feedback;
    }, ler_feedbacks_plano()));
}

/** true: apagou; false: falhou ao gravar; null: avaliação desconhecida. */
function apagar_feedback_plano(string $id): ?bool
{
    return com_trava(ARQ_PLANO_FEEDBACK, function () use ($id): ?bool {
        $todos = ler_feedbacks_plano();
        foreach ($todos as $indice => $feedback) {
            if (($feedback['id'] ?? '') !== $id) {
                continue;
            }
            array_splice($todos, $indice, 1);
            return gravar_atomico(ARQ_PLANO_FEEDBACK, "<?php\nreturn " . var_export($todos, true) . ";\n");
        }
        return null;
    });
}
