<?php
declare(strict_types=1);
require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/participacao-comum.php';

/** A ficha de interesses é privada mesmo se uma área for concedida por ajuste fino. */
function ficha_de_participacao(array $p, bool $editar = false): void
{
    if (!tem_capacidade('coordenacao')) {
        return;
    }
    $resumo = resumo_de_participacao($p['participacao']);
    echo '<details' . ($resumo !== [] ? ' open' : '') . '><summary>Interesses para construir o movimento</summary>';
    echo '<p class="dica">Interesse declarado não significa grupo funcionando, pertencimento a uma unidade, função assumida ou permissão de acesso.</p>';
    if ($resumo === []) {
        echo '<p class="dica">Ainda sem informações de trabalho, estudo, interesses ou disponibilidade.</p>';
    } else {
        echo '<dl class="ficha-dados">';
        foreach ($resumo as $nome => $valor) {
            echo '<div><dt>' . h($nome) . '</dt><dd>' . h($valor) . '</dd></div>';
        }
        echo '</dl>';
    }
    if ($editar && pode('pessoas')) {
        $catalogo = catalogo_de_participacao();
        $perfil = $p['participacao'];
        echo '<details><summary>Atualizar interesses após a conversa</summary><form method="post">';
        echo '<input type="hidden" name="csrf" value="' . h(token()) . '"><input type="hidden" name="acao" value="participacao-salvar"><input type="hidden" name="id" value="' . h($p['id']) . '">';
        foreach (['frentes' => 'Frentes', 'temas' => 'Temas', 'cultura' => 'Cultura', 'contribuicoes' => 'Contribuições', 'periodos' => 'Períodos'] as $campo => $titulo) {
            echo '<fieldset><legend>' . h($titulo) . '</legend><input type="hidden" name="participacao[' . h($campo) . '][]" value="">';
            foreach ($catalogo[$campo] as $chave => $nome) {
                echo '<label class="check"><input type="checkbox" name="participacao[' . h($campo) . '][]" value="' . h($chave) . '"'
                    . (in_array($chave, $perfil[$campo], true) ? ' checked' : '') . '> ' . h($nome) . '</label>';
            }
            echo '</fieldset>';
        }
        foreach (['situacao' => ['Trabalho e estudo', 'situacoes'], 'disponibilidade' => ['Disponibilidade', 'disponibilidades'], 'modalidade' => ['Modalidade', 'modalidades']] as $campo => [$nome, $lista]) {
            echo '<div class="campo"><label for="pp-' . h($campo) . '">' . h($nome) . '</label><select id="pp-' . h($campo) . '" name="participacao[' . h($campo) . ']"><option value="">Não informado</option>';
            foreach ($catalogo[$lista] as $chave => $rotulo) {
                echo '<option value="' . h($chave) . '"' . ($perfil[$campo] === $chave ? ' selected' : '') . '>' . h($rotulo) . '</option>';
            }
            echo '</select></div>';
        }
        foreach (['profissao' => 'Trabalho / área de atuação', 'instituicao' => 'Instituição', 'campus' => 'Campus / unidade', 'curso' => 'Curso / vínculo', 'habilidades' => 'Habilidades', 'ideia' => 'Ideia', 'perfilPublico' => 'Perfil ou canal'] as $campo => $nome) {
            echo '<div class="campo"><label for="pp-' . h($campo) . '">' . h($nome) . '</label><input id="pp-' . h($campo) . '" name="participacao[' . h($campo) . ']" value="' . h($perfil[$campo]) . '" maxlength="' . (in_array($campo, ['habilidades', 'ideia'], true) ? 400 : ($campo === 'perfilPublico' ? 200 : ($campo === 'campus' ? 100 : 120))) . '"></div>';
        }
        echo '<div class="campo"><label for="pp-cidade">Cidade da instituição</label>';
        campo_cidade('pp-cidade', 'participacao[cidadeInstituicao]', $perfil['cidadeInstituicao']);
        echo '</div><button class="btn btn-ouro" type="submit">Salvar interesses e disponibilidade</button></form></details>';
    }
    echo '</details>';
}
