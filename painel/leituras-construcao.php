<?php
declare(strict_types=1);
require_once __DIR__ . '/layout.php';
require_once __DIR__ . '/construcao-comum.php';
require_once __DIR__ . '/participacao-tela.php';

function filtro_de_construcao(string $campo, string $nome, array $opcoes): void
{
    $valor = is_string($_GET[$campo] ?? null) ? $_GET[$campo] : '';
    echo '<div class="campo"><label for="co-' . h($campo) . '">' . h($nome) . '</label><select id="co-' . h($campo) . '" name="' . h($campo) . '"><option value="">Todos</option>';
    foreach ($opcoes as $k => $rotulo) {
        echo '<option value="' . h((string) $k) . '"' . ($valor === (string) $k ? ' selected' : '') . '>' . h($rotulo) . '</option>';
    }
    echo '</select></div>';
}

function aba_de_construcao(): void
{
    if (!tem_capacidade('coordenacao')) {
        return;
    }
    $todas = pessoas_para_construcao(ler_pessoas());
    $pessoas = pessoas_para_construcao($todas, $_GET);
    $mapas = agrupamentos_de_construcao($pessoas);
    $c = catalogo_de_participacao();
    ?>
    <fieldset>
      <legend>Construção dos núcleos e frentes</legend>
      <p class="dica">Mapa de cadastros e interesses declarados, incluindo quem aguarda acolhimento. Não são núcleos criados, grupos funcionando, funções assumidas ou pessoas ativas. Uma pessoa pode aparecer em mais de um interesse. Recusados e registros apagados ficam de fora.</p>
      <dl class="resumo-numeros">
        <div><dt>Cadastros neste recorte</dt><dd><?= count($pessoas) ?></dd></div>
        <div><dt>Aguardam acolhimento</dt><dd><?= count(array_filter($pessoas, fn ($p) => $p['status'] === 'pendente')) ?></dd></div>
        <div><dt>Instituições / campi</dt><dd><?= count($mapas['instituicoes']) ?></dd></div>
      </dl>
      <form method="get">
        <input type="hidden" name="aba" value="construcao">
        <div class="linha g3">
          <?php
          $opcoesDe = function (string $campo) use ($todas): array {
              $valores = [];
              foreach ($todas as $p) {
                  $v = in_array($campo, ['cidade', 'bairro'], true) ? $p[$campo] : $p['participacao'][$campo];
                  if ($v !== '') { $valores[$v] = $v; }
              }
              asort($valores);
              return $valores;
          };
          filtro_de_construcao('cidade', 'Cidade onde mora', $opcoesDe('cidade'));
          filtro_de_construcao('frente', 'Frente de interesse', $c['frentes']);
          filtro_de_construcao('tema', 'Tema', $c['temas']);
          ?>
        </div>
        <details><summary>Refinar por bairro, instituição, trabalho e disponibilidade</summary>
          <div class="linha g3">
          <?php
          foreach (['bairro' => 'Bairro', 'instituicao' => 'Instituição', 'campus' => 'Campus', 'profissao' => 'Trabalho / área'] as $campo => $nome) {
              filtro_de_construcao($campo, $nome, $opcoesDe($campo));
          }
          foreach (['eixo' => ['Cultura', 'cultura'], 'contribuicao' => ['Contribuição', 'contribuicoes'], 'disponibilidade' => ['Disponibilidade', 'disponibilidades'], 'modalidade' => ['Modalidade', 'modalidades'], 'periodo' => ['Período', 'periodos']] as $campo => [$nome, $lista]) {
              filtro_de_construcao($campo, $nome, $c[$lista]);
          }
          ?>
          </div>
          <div class="campo"><label for="co-busca">Buscar nome, curso, habilidade ou ideia</label><input id="co-busca" name="q" value="<?= h(is_string($_GET['q'] ?? null) ? $_GET['q'] : '') ?>" maxlength="120"></div>
        </details>
        <div class="acoes"><button class="btn btn-ouro" type="submit">Aplicar filtros</button><a class="btn" href="?aba=construcao">Limpar filtros</a></div>
      </form>
      <?php $filtros = array_intersect_key($_GET, array_flip(['cidade', 'bairro', 'frente', 'tema', 'eixo', 'contribuicao', 'instituicao', 'campus', 'profissao', 'disponibilidade', 'modalidade', 'periodo', 'q'])); ?>
      <p><a href="/painel/exportar.php?<?= h(http_build_query(['o' => 'construcao'] + $filtros)) ?>">Baixar CSV deste recorte</a></p>
    </fieldset>
    <?php foreach (['territorios' => 'Cidade e bairro', 'instituicoes' => 'Instituições e campi', 'profissoes' => 'Trabalho e áreas de atuação', 'frentes' => 'Frentes de interesse', 'temas' => 'Grupos temáticos a construir', 'cultura' => 'Interesses culturais', 'contribuicoes' => 'Contribuições disponíveis', 'disponibilidades' => 'Disponibilidade'] as $tipo => $titulo): ?>
      <details><summary><?= h($titulo) ?> (<?= count($mapas[$tipo]) ?>)</summary>
        <?php if ($mapas[$tipo] === []): ?><p class="dica">Ainda sem informações neste recorte.</p><?php else: ?>
        <div class="rolagem cartoes"><table class="tabela"><thead><tr><th>Recorte</th><th>Cadastros</th><th>Pendentes</th><th>Aprovados</th></tr></thead><tbody>
          <?php foreach ($mapas[$tipo] as $l): ?><tr><td data-rotulo="Recorte"><?= h($l['nome']) ?></td><td class="terco" data-rotulo="Cadastros"><?= $l['total'] ?></td><td class="terco" data-rotulo="Pendentes"><?= $l['pendentes'] ?></td><td class="terco" data-rotulo="Aprovados"><?= $l['aprovados'] ?></td></tr><?php endforeach; ?>
        </tbody></table></div>
        <?php endif; ?>
      </details>
    <?php endforeach; ?>
    <fieldset><legend>Quem conversar neste recorte (<?= count($pessoas) ?>)</legend>
      <p class="dica">Mostrando até 100 cadastros. Refine os filtros ou exporte o recorte completo. Contato não é convite automático: combine primeiro o interesse e a disponibilidade.</p>
      <?php foreach (array_slice($pessoas, 0, 100) as $p): ?>
        <details><summary><?= h($p['nome'] . ' · ' . $p['cidade'] . ' · ' . $p['bairro']) ?></summary>
          <p><?= h($p['status'] === 'pendente' ? 'Aguarda acolhimento' : ($p['status'] === 'aprovada' ? 'Inscrição aprovada' : 'Contato cadastrado')) ?></p>
          <?php links_whatsapp($p['telefone'], telefone_bonito($p['telefone'])); ficha_de_participacao($p); ?>
          <?php if (pode('pessoas')): ?><p><a href="/painel/pessoas.php?p=<?= h(rawurlencode($p['id'])) ?>">Abrir ficha e atualizar informações</a></p><?php endif; ?>
        </details>
      <?php endforeach; ?>
      <?php if ($pessoas === []): ?><p class="dica">Nenhum cadastro neste recorte.</p><?php endif; ?>
    </fieldset>
    <?php
}
