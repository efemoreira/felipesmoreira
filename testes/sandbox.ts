import { execFileSync, spawnSync, spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import net from "node:net";
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

/** O CSRF da sessão de teste. Fixo, como a sessão: o POST tem de mandá-lo. */
export const CSRF = "ab".repeat(16);

/** O id da sessão de teste — 32 caracteres, que é o que o PHP aceita. */
const SESSAO = "teste0000000000000000000000000000";

/** O que uma ação do painel devolveu. */
export interface Resposta {
  /** O status do POST em si, antes de seguir o redirecionamento. */
  status: number;
  /** Para onde `voltar()` mandou. String vazia quando não houve redirecionamento. */
  location: string;
  /**
   * O HTML da tela para onde a ação levou — o **G** do POST-redirect-GET.
   *
   * É aqui que o recado aparece: `avisar()` guarda o texto na sessão e quem o
   * desenha é a tela seguinte. Testar só o POST veria a gravação e não veria o
   * que a pessoa lê depois dela.
   */
  html: string;
  /** O que o PHP escreveu no stderr durante esta requisição (e o GET seguinte). */
  erros: string;
}

export interface Sandbox {
  dir: string;
  /** Renderiza uma tela. Devolve o HTML e o que o PHP escreveu no stderr. */
  abrir(tela: string, querystring?: string): { html: string; erros: string; status: number };
  /**
   * Faz uma AÇÃO: manda o POST e segue o redirecionamento que ela devolve.
   *
   * O `csrf` entra sozinho — é o mesmo em toda a sessão de teste, e escrevê-lo
   * em cada chamada só encheria os testes de ruído. Passe `csrf: ''` de
   * propósito para exercitar a sessão expirada.
   */
  postar(tela: string, campos: Campos, querystring?: string): Promise<Resposta>;
  /**
   * A mesma ação, em `multipart/form-data` — o formulário que tem `<input type="file">`.
   *
   * `null` no lugar do arquivo é o campo que a pessoa NÃO preencheu, e é ele
   * que interessa: o navegador manda a parte assim mesmo, vazia, e o PHP monta
   * `$_FILES['imagem']` com `UPLOAD_ERR_NO_FILE`. Um teste feito com o POST
   * urlencoded normal não passa nem perto disso — sem a parte vazia o `$_FILES`
   * simplesmente não existe, e o caminho que o navegador percorre fica sem
   * teste nenhum. Foi assim que "Remover esta imagem" ficou sem remover.
   */
  postarComArquivo(
    tela: string,
    campos: Campos,
    arquivos: Record<string, Arquivo | null>,
    querystring?: string,
  ): Promise<Resposta>;
  /** Uma tela pelo HTTP, com a mesma sessão do `postar()` — para ler o depois. */
  buscar(tela: string, querystring?: string): Promise<Resposta>;
  /** O conteúdo de `dados/<nome>.php`, já em objeto. */
  ler(nome: string): Registro[];
  /**
   * Escreve `dados/<nome>.php` — para semear um cenário que a ação não cria.
   *
   * Grava pelo `gravar_*()` do painel, e não escrevendo o arquivo à mão: é o
   * `normalizar_*()` de lá que decide o que é um registro válido, e um teste
   * que escreve direto no disco semeia fichas que o painel nunca produziria.
   */
  gravar(nome: string, linhas: Registro[]): void;

  /** Apaga tudo que o painel gravou e semeia de novo — o estado limpo do teste. */
  ressemear(): void;
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

/**
 * Uma linha de `/dados`, do jeito que o PHP a gravou.
 *
 * É `any` de propósito, e não um tipo escrito à mão: o modelo da pessoa, do
 * encontro e do card mora no PHP, e uma segunda cópia dele em TypeScript seria
 * mais um par que "tem de concordar" — justamente o que este projeto passa o
 * tempo todo tentando não criar. O teste que erra o nome de um campo falha na
 * hora, lendo `undefined`, que é o suficiente aqui.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Registro = any;

/** Os campos de um formulário. O array é a caixa marcada várias vezes. */
export type Campos = Record<string, string | string[] | undefined>;

/** Um arquivo escolhido no `<input type="file">`. */
export interface Arquivo {
  nome: string;
  conteudo: Uint8Array;
  tipo?: string;
}

/**
 * Os arquivos que o painel grava em `/dados`, para o `ler()` recusar um nome
 * que não existe em vez de devolver lista vazia.
 *
 * Repare que os cards do quadro estão em `producao`, e não em `cards`: é
 * exatamente o tipo de nome que se erra de memória.
 */
const DADOS = new Set([
  "pessoas",
  "eventos",
  "presencas",
  "fatos",
  "producao",
  "listas",
  "aulas",
  "aulas-progresso",
  "kit",
  "inscricoes-limite",
  "tentativas",
  "segredo",
]);

/** Uma porta livre, perguntada ao sistema em vez de chutada. */
function portaLivre(): Promise<number> {
  return new Promise((ok, falhou) => {
    const s = net.createServer();
    s.once("error", falhou);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address() as net.AddressInfo;
      s.close(() => ok(port));
    });
  });
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

  /* ===================== o painel servido de verdade =====================

     AÇÃO NÃO SE TESTA PELO CLI. Toda ação do painel termina em `voltar()`, que
     é `header('Location: …')` + `exit` — e no SAPI de linha de comando o
     `header()` é um NADA: `headers_list()` volta vazio e o teste não teria como
     ver para onde a gravação mandou. É por isso que a ação sobe num `php -S`, e
     o desenho continua no CLI, que é dez vezes mais barato.

     O servidor sobe na primeira ação e não antes: quem só desenha tela não
     paga por ele. */
  const sessoes = path.join(dir, "sessoes");
  mkdirSync(sessoes, { recursive: true });

  let servidor: ChildProcess | null = null;
  let base = "";
  let stderr = "";

  /* A SESSÃO É ESCRITA À MÃO, e não obtida pelo formulário de login. Entrar de
     verdade a cada teste exigiria uma senha conhecida no cadastro semeado e
     mais uma ida ao servidor por arquivo de teste — e o que se quer testar aqui
     é a AÇÃO, não a porta. Id e CSRF fixos pelo mesmo motivo do `abrir.php`. */
  writeFileSync(
    path.join(dir, "sessao-fixa.php"),
    `<?php
ini_set('session.save_path', __DIR__ . '/sessoes');
session_name('painel_agenda');
session_id(${JSON.stringify(SESSAO)});
session_start();
$_SESSION['uid']   = ${JSON.stringify(ADMIN)};
$_SESSION['visto'] = time();
$_SESSION['csrf']  = ${JSON.stringify(CSRF)};
session_write_close();
`,
  );

  async function subir(): Promise<string> {
    if (servidor !== null) {
      return base;
    }
    execFileSync("php", [path.join(dir, "sessao-fixa.php")], { stdio: "pipe" });

    const porta = await portaLivre();
    servidor = spawn(
      "php",
      [
        "-d", "display_errors=stderr",
        "-d", "error_reporting=E_ALL",
        "-d", `session.save_path=${sessoes}`,
        "-S", `127.0.0.1:${porta}`,
        "-t", dir,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    servidor.stderr?.setEncoding("utf8");
    servidor.stderr?.on("data", (d: string) => {
      stderr += d;
    });

    base = `http://127.0.0.1:${porta}`;

    /* Esperar o servidor de pé pedindo uma página, e não dormindo um tanto
       arbitrário: máquina de CI é lenta e sono fixo é teste que falha às vezes. */
    for (let i = 0; i < 100; i++) {
      try {
        await fetch(`${base}/painel/icones.php`, { redirect: "manual" });
        return base;
      } catch {
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    throw new Error("o painel de teste não subiu");
  }

  const COOKIE = `painel_agenda=${SESSAO}`;

  /** O stderr do servidor desde a marca — o que ESTA requisição reclamou. */
  function desde(marca: number): string {
    return stderr
      .slice(marca)
      .split("\n")
      /* O `php -S` escreve o log de acesso no stderr junto com os avisos. */
      .filter((l) => !/Development Server|Accepted$|Closing$|\[\d{3}\]:/.test(l))
      .join("\n");
  }

  /**
   * Aviso do PHP durante uma AÇÃO derruba o teste na hora, sem ninguém precisar
   * pedir.
   *
   * É a mesma regra da fumaça, e pelo mesmo motivo: o aviso não aparece na tela,
   * em produção o `display_errors` está desligado, e a gravação segue adiante
   * como se nada tivesse acontecido. Numa ação isso é pior do que numa tela —
   * o que sobra no arquivo é um dado meio escrito, e o teste que só olha o
   * redirecionamento diz que deu certo.
   */
  function exigirSilencio(alvo: string, erros: string): void {
    const ruido = erros
      .split("\n")
      .filter((l) => /Warning|Notice|Deprecated|Fatal|Uncaught|Undefined/i.test(l))
      .filter((l) => !/session_|headers already sent|Cannot modify header/i.test(l));
    if (ruido.length > 0) {
      throw new Error(`o PHP reclamou em ${alvo}:\n${ruido.join("\n")}`);
    }
  }

  async function seguir(
    alvo: string,
    location: string,
    marca: number,
    status: number,
  ): Promise<Resposta> {
    const html =
      location === ""
        ? ""
        : await (
            await fetch(base + location, { headers: { cookie: COOKIE }, redirect: "manual" })
          ).text();
    const erros = desde(marca);
    exigirSilencio(alvo, erros);
    return { status, location, html, erros };
  }

  return {
    dir,
    async postar(tela, campos, querystring = "") {
      await subir();
      const marca = stderr.length;

      const corpo = new URLSearchParams();
      if (!("csrf" in campos)) {
        corpo.append("csrf", CSRF);
      }
      for (const [nome, valor] of Object.entries(campos)) {
        if (valor === undefined) continue;
        if (!Array.isArray(valor)) {
          corpo.append(nome, valor);
          continue;
        }
        /* CAIXA MARCADA VÁRIAS VEZES VAI COM `[]` NO NOME, como no formulário.
           Sem o sufixo o PHP guarda só o último valor e `is_array($_POST[…])`
           dá false — a ação lê lista vazia, não reclama de nada e grava. Um
           teste escrito sem isto passa dizendo que a permissão foi concedida
           quando nenhuma foi: foi exatamente o que aconteceu aqui. */
        const chave = nome.endsWith("[]") ? nome : `${nome}[]`;
        for (const v of valor) {
          corpo.append(chave, v);
        }
      }

      const alvo = `/painel/${tela}.php` + (querystring !== "" ? `?${querystring}` : "");
      const r = await fetch(base + alvo, {
        method: "POST",
        redirect: "manual",
        headers: { cookie: COOKIE, "content-type": "application/x-www-form-urlencoded" },
        body: corpo,
      });
      /* O corpo do POST é lido e jogado fora de propósito: sem isso o socket
         fica pendurado e o servidor de uma linha só não atende o GET seguinte. */
      await r.text();
      return seguir(alvo, r.headers.get("location") ?? "", marca, r.status);
    },
    async postarComArquivo(tela, campos, arquivos, querystring = "") {
      await subir();
      const marca = stderr.length;

      /* O CORPO É ESCRITO À MÃO, e não com `FormData`.
         O caso que interessa é o campo de arquivo em branco, e o `FormData` do
         Node manda esse campo SEM o `filename=""` — vira um campo de texto
         comum, o `$_FILES` nem se forma, e o teste passa a exercitar um pedido
         que navegador nenhum faz. O navegador manda a parte com o nome de
         arquivo vazio, e é ela que o PHP lê como UPLOAD_ERR_NO_FILE. */
      const LIMITE = "----painel" + Math.random().toString(16).slice(2);
      const pedacos: Buffer[] = [];
      const parte = (cabecalho: string, corpo: Buffer) => {
        pedacos.push(Buffer.from(`--${LIMITE}\r\n${cabecalho}\r\n\r\n`), corpo, Buffer.from("\r\n"));
      };
      const campo = (nome: string, valor: string) =>
        parte(`Content-Disposition: form-data; name="${nome}"`, Buffer.from(valor, "utf8"));

      if (!("csrf" in campos)) {
        campo("csrf", CSRF);
      }
      for (const [nome, valor] of Object.entries(campos)) {
        if (valor === undefined) continue;
        if (!Array.isArray(valor)) {
          campo(nome, valor);
          continue;
        }
        const chave = nome.endsWith("[]") ? nome : `${nome}[]`;
        for (const v of valor) {
          campo(chave, v);
        }
      }
      for (const [nome, arquivo] of Object.entries(arquivos)) {
        parte(
          `Content-Disposition: form-data; name="${nome}"; filename="${arquivo?.nome ?? ""}"\r\n` +
            `Content-Type: ${arquivo?.tipo ?? "application/octet-stream"}`,
          Buffer.from(arquivo?.conteudo ?? new Uint8Array()),
        );
      }
      pedacos.push(Buffer.from(`--${LIMITE}--\r\n`));

      const alvo = `/painel/${tela}.php` + (querystring !== "" ? `?${querystring}` : "");
      const r = await fetch(base + alvo, {
        method: "POST",
        redirect: "manual",
        headers: { cookie: COOKIE, "content-type": `multipart/form-data; boundary=${LIMITE}` },
        body: Buffer.concat(pedacos),
      });
      await r.text();
      return seguir(alvo, r.headers.get("location") ?? "", marca, r.status);
    },
    async buscar(tela, querystring = "") {
      await subir();
      const marca = stderr.length;
      const alvo = `/painel/${tela}.php` + (querystring !== "" ? `?${querystring}` : "");
      const r = await fetch(base + alvo, { headers: { cookie: COOKIE }, redirect: "manual" });
      const html = await r.text();
      const erros = desde(marca);
      exigirSilencio(alvo, erros);
      return { status: r.status, location: r.headers.get("location") ?? "", html, erros };
    },
    ler(nome) {
      /* O NOME É CONFERIDO CONTRA A LISTA, e não aceito como veio.
         `dados/cards.php` não existe — os cards do quadro moram em
         `producao.php` —, e um arquivo que não existe devolvia lista vazia sem
         reclamar: o teste que contava cards passava a comparar 0 com 0 e
         confirmava, sorridente, que nenhum card tinha sido aberto. Nome errado
         aqui tem de doer na hora. */
      if (!DADOS.has(nome)) {
        throw new Error(
          `não existe dados/${nome}.php no painel. Os arquivos são: ${[...DADOS].sort().join(", ")}`,
        );
      }
      const script = path.join(dir, "ler.php");
      writeFileSync(
        script,
        `<?php
$arq = __DIR__ . '/dados/' . $argv[1] . '.php';
echo json_encode(is_file($arq) ? (require $arq) : [], JSON_UNESCAPED_UNICODE);
`,
      );
      const r = execFileSync("php", [script, nome], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
      const lido = JSON.parse(r || "[]");
      /* `var_export` de array com buracos vira objeto no JSON; a lista importa. */
      return Array.isArray(lido) ? lido : Object.values(lido);
    },
    gravar(nome, linhas) {
      if (!DADOS.has(nome)) {
        throw new Error(`não existe dados/${nome}.php no painel`);
      }
      const script = path.join(dir, "gravar.php");
      writeFileSync(
        script,
        `<?php
require __DIR__ . '/painel/sessao.php';
require __DIR__ . '/painel/eventos-comum.php';
require __DIR__ . '/painel/fatos-comum.php';
require __DIR__ . '/painel/producao-comum.php';
require __DIR__ . '/painel/candidatos-comum.php';
/* O nome do arquivo nem sempre é o nome da função: os cards do quadro moram
   em \`producao.php\` e quem os grava é \`gravar_cards()\`. */
$comoGrava = ['producao' => 'gravar_cards'];
$fn = $comoGrava[$argv[1]] ?? ('gravar_' . str_replace('-', '_', $argv[1]));
if (!function_exists($fn)) {
  fwrite(STDERR, "não sei gravar {$argv[1]} (procurei {$fn})\\n");
  exit(1);
}
$fn(json_decode(file_get_contents($argv[2]), true));
`,
      );
      const dados = path.join(dir, "gravar.json");
      writeFileSync(dados, JSON.stringify(linhas));
      execFileSync("php", [script, nome, dados], { stdio: "pipe" });
    },
    ressemear() {
      /* Apaga o que o painel gravou, e não a pasta inteira: `preparar_pastas()`
         refaz o `.htaccess` e o `segredo.php` sozinho na leitura seguinte. */
      rmSync(path.join(dir, "dados"), { recursive: true, force: true });
      execFileSync("php", [path.join(dir, "semear.php")], { stdio: "pipe" });
      /* A SESSÃO VOLTA JUNTO. Um CSRF errado leva a `derrubar_sessao()`, que
         apaga o arquivo da sessão: sem refazê-la aqui, o teste seguinte ao de
         sessão expirada cairia na tela de login e falharia por outro motivo. */
      execFileSync("php", [path.join(dir, "sessao-fixa.php")], { stdio: "pipe" });
    },
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
      servidor?.kill();
      servidor = null;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
