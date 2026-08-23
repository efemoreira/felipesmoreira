import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync, cpSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Um painel de mentira, montado do zero — para renderizar telas sem servidor
 * web e para chamar as funções do PHP num layout igual ao de produção.
 *
 * POR QUE UMA CÓPIA, E NÃO O `public/` do repositório: o painel grava em
 * `../dados` relativo a si mesmo. Rodar o teste sobre a árvore de trabalho o
 * faria criar pastas, `.htaccess` e sessões dentro do repositório — teste que
 * suja o diretório é teste que a pessoa aprende a não rodar.
 *
 * O QUE ESTE TESTE PEGA: erro de PHP que não aparece na tela. `exigir_area()`
 * redireciona, `h()` de um índice que não existe vira aviso no stderr, e a
 * página continua saindo com cara de página. Foi assim que a divisão de
 * `eventos.php` em cinco arquivos foi conferida — e é o que sobra de mais
 * barato para conferir a próxima.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..");

/** O id da conta de administrador semeada, fixo para o teste poder entrar. */
export const ADMIN = "adm00000000teste";

export interface Sandbox {
  dir: string;
  /** Renderiza uma tela. Devolve o HTML e o que o PHP escreveu no stderr. */
  abrir(tela: string, querystring?: string): { html: string; erros: string; status: number };
  /**
   * Troca a capacidade da conta de teste, para exercitar a permissão.
   *
   * Sem isto só dá para testar o que o administrador vê — e o que importa numa
   * tela de busca é justamente o que a pessoa SEM a área não vê. String vazia
   * deixa a conta sem nenhuma área.
   */
  trocarCapacidades(capacidade: string): void;
  fechar(): void;
}

export function montarSandbox(opcoes: { semear?: boolean } = {}): Sandbox {
  const dir = mkdtempSync(path.join(os.tmpdir(), "painel-fumaca-"));

  cpSync(path.join(RAIZ, "public/painel"), path.join(dir, "painel"), { recursive: true });

  /* OS CATÁLOGOS ENTRAM AO LADO DO PAINEL, como em produção.
     `funcoes.json` e `municipios-ce.json` são fonte única para os dois lados, e
     quem os põe onde o PHP procura é o `publish.yml`, que copia `src/data/*`
     para `out/`. Eles NÃO estão versionados em `public/` — num checkout limpo
     não existem, e sem esta cópia `municipios_ce()` devolve lista vazia.

     Aí o painel não quebra: `cidade_valida()` cai no caminho de "catálogo
     ausente não apaga cidade" e passa a aceitar qualquer grafia. É justamente o
     tipo de defeito que só aparece no relatório, semanas depois — e foi rodando
     a suíte num checkout limpo que ele apareceu aqui. */
  for (const f of ["funcoes.json", "municipios-ce.json"]) {
    cpSync(path.join(RAIZ, "src/data", f), path.join(dir, f));
  }

  /* O renderizador. Fixa a sessão e o CSRF: sem isso cada execução sairia
     diferente da anterior, e o teste não conseguiria comparar nada com nada. */
  writeFileSync(
    path.join(dir, "abrir.php"),
    `<?php
ini_set('display_errors', 'stderr');
error_reporting(E_ALL);
$tela = $argv[1];
$qs   = $argv[2] ?? '';
$_SERVER['SCRIPT_NAME']    = "/painel/{$tela}.php";
$_SERVER['REQUEST_URI']    = "/painel/{$tela}.php" . ($qs !== '' ? "?{$qs}" : '');
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST']      = 'felipesmoreira.com';
$_SERVER['HTTPS']          = 'on';
parse_str($qs, $_GET);
require __DIR__ . '/painel/sessao.php';
$_SESSION['uid']   = ${JSON.stringify(ADMIN)};
$_SESSION['visto'] = time();
$_SESSION['csrf']  = str_repeat('ab', 16);
require __DIR__ . "/painel/{$tela}.php";
`,
  );

  /* A semente: um administrador, um encontro que ainda vem, uma pessoa na lista
     dele e um fato na fila. É o mínimo para nenhuma tela cair no caminho de
     "não há nada aqui" — que é justamente o caminho que não quebra. */
  writeFileSync(
    path.join(dir, "semear.php"),
    `<?php
require __DIR__ . '/painel/sessao.php';
require __DIR__ . '/painel/eventos-comum.php';
require __DIR__ . '/painel/fatos-comum.php';
require __DIR__ . '/painel/producao-comum.php';

gravar_pessoas([
  [
    'id' => ${JSON.stringify(ADMIN)}, 'usuario' => 'teste', 'nome' => 'Coordenação de Teste',
    'hash' => password_hash('nao-usada', PASSWORD_DEFAULT),
    'capacidades' => ['adm'], 'tipo' => 'coordenador', 'status' => 'aprovada',
    'ativo' => true, 'trocarSenha' => false, 'entrouNoGrupo' => true,
    'criadoEm' => '2026-01-01T10:00:00-03:00',
  ],
  [
    'id' => 'pes00000000teste', 'nome' => 'Maria da Silva Sauro',
    'telefone' => '85999990000', 'cidade' => 'Fortaleza', 'bairro' => 'Benfica',
    'tipo' => 'militante', 'status' => 'pendente', 'ativo' => true,
    'criadoEm' => '2026-02-01T10:00:00-03:00',
  ],
]);

$fuso = new DateTimeZone('America/Fortaleza');
$hoje = new DateTimeImmutable('now', $fuso);
gravar_eventos([[
  'id' => 'ev-teste', 'titulo' => 'Encontro de fumaça no Benfica',
  'familia' => array_key_first(FAMILIAS),
  'inicio' => $hoje->modify('+3 days')->setTime(19, 0)->format('c'),
  'local' => 'Praça do Benfica', 'endereco' => 'Rua Teste, 10',
  'status' => 'confirmado', 'publicoEsperado' => 40, 'naAgenda' => true,
  'token' => str_repeat('a', 16), 'tokenConfirmacao' => str_repeat('b', 16),
  'feitos' => ['local-hora' => [0]], 'responsaveis' => [],
  'criadoEm' => '2026-02-01T10:00:00-03:00',
]]);
gravar_presencas([[
  'id' => 'pr-teste', 'eventoId' => 'ev-teste', 'pessoaId' => 'pes00000000teste',
  'confirmou' => true, 'compareceu' => true,
  'funil' => ['d0' => '', 'd3' => '', 'd7' => ''],
  'origem' => 'qr', 'criadoEm' => '2026-02-01T10:00:00-03:00',
]]);
gravar_fatos([[
  'id' => 'ft-teste', 'oQue' => 'Obra parada há dois anos no Bom Jardim',
  'quem' => 'Secretaria de Infraestrutura', 'quando' => '2026-08-20',
  'fonteUrl' => 'https://diariooficial.ce.gov.br/x', 'fonteData' => date('Y-m-d'),
  'categoria' => array_key_first(CATEGORIAS), 'status' => 'a-checar',
  'autorId' => 'pes00000000teste', 'autorNome' => 'Maria da Silva Sauro',
  'criadoEm' => date('c', strtotime('-1 hour')),
]]);
gravar_cards([[
  'id' => 'cd-teste', 'fatoId' => 'ft-teste', 'titulo' => 'Roteiro sobre a obra parada',
  'etapa' => 'roteiro', 'coluna' => 'fazendo',
  'donoId' => ${JSON.stringify(ADMIN)}, 'donoNome' => 'Coordenação de Teste',
  'prazo' => date('Y-m-d', strtotime('+1 day')),
  'responsavel' => 'Secretaria de Infraestrutura',
  'fonteUrl' => 'https://diariooficial.ce.gov.br/x',
  'criadoEm' => '2026-02-01T10:00:00-03:00', 'historico' => [],
]]);
`,
  );

  if (opcoes.semear !== false) {
    execFileSync("php", [path.join(dir, "semear.php")], { stdio: "pipe" });
  }

  return {
    dir,
    abrir(tela, querystring = "") {
      const r = spawnSync("php", [path.join(dir, "abrir.php"), tela, querystring], {
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      });
      return { html: r.stdout ?? "", erros: r.stderr ?? "", status: r.status ?? -1 };
    },
    trocarCapacidades(capacidade) {
      const script = path.join(dir, "capacidades.php");
      writeFileSync(
        script,
        `<?php
require __DIR__ . '/painel/sessao.php';
$caps = ${JSON.stringify(capacidade)} === '' ? [] : [${JSON.stringify(capacidade)}];
$pessoas = ler_pessoas();
foreach ($pessoas as &$p) {
  if ($p['id'] === ${JSON.stringify(ADMIN)}) { $p['capacidades'] = $caps; $p['areas'] = []; }
}
unset($p);
gravar_pessoas($pessoas);
`,
      );
      execFileSync("php", [script], { stdio: "pipe" });
    },
    fechar() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
