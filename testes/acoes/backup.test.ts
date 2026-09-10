import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { montarSandbox, type Sandbox } from "../sandbox.ts";

/**
 * O BACKUP — e as três coisas que ele existe para garantir.
 *
 * 1. O zip tem o cadastro inteiro, inclusive o `segredo.php` (sem ele um
 *    restore invalida todos os convites que já circulam).
 * 2. Ele não sai pela web: `backup.php` responde 404 fora da linha de comando,
 *    e o download da Manutenção só aceita nome que é de backup.
 * 3. Zerar não apaga a cópia do que estava.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const pastaBackups = () => path.join(painel.dir, "dados", "backups");
const zips = () =>
  existsSync(pastaBackups())
    ? readdirSync(pastaBackups()).filter((f) => /^dados-.*\.zip$/.test(f)).sort()
    : [];

/** O que há dentro do zip — pelo PHP, que é quem o escreveu. */
function conteudoDe(nome: string): string[] {
  const saida = execFileSync(
    "php",
    ["-r", '$z = new ZipArchive(); $z->open($argv[1]); for ($i = 0; $i < $z->numFiles; $i++) echo $z->getNameIndex($i), "\\n";', path.join(pastaBackups(), nome)],
    { encoding: "utf8" },
  );
  return saida.trim().split("\n").sort();
}

describe("backup: o botão da Manutenção", () => {
  test("grava um zip com o cadastro e o segredo, e conta na tela", async () => {
    assert.deepEqual(zips(), [], "o sandbox nasceu com backup");
    /* O segredo nasce na primeira vez que alguém o pede — no sandbox limpo
       ainda não existe, e o zip não pode copiar o que não está lá. */
    execFileSync("php", ["-r", 'require $argv[1]; segredo();', path.join(painel.dir, "painel", "sessao.php")], { stdio: "pipe" });

    const r = await painel.postar("manutencao", { acao: "backup" });
    assert.equal(r.status, 302);
    assert.match(r.html, /Backup gravado: dados-\d{4}-\d{2}-\d{2}-\d{6}\.zip/);

    const [nome] = zips();
    assert.ok(nome, "nenhum zip em dados/backups");
    const dentro = conteudoDe(nome);
    assert.ok(dentro.includes("pessoas.php"), `o zip não tem o cadastro: ${dentro.join(", ")}`);
    assert.ok(dentro.includes("segredo.php"), "o zip não tem o segredo — um restore invalidaria os convites");
    assert.ok(!dentro.some((f) => f.endsWith(".htaccess")), "o .htaccess entrou no zip; é preparar_pastas() quem o recria");

    /* E a lista da tela mostra o que existe, com o link de baixar. */
    assert.match(r.html, new RegExp(`baixar=${nome}`), "o backup gravado não aparece para baixar");
  });

  test("não pede a palavra de zerar, e não apaga nada", async () => {
    const antes = painel.ler("pessoas").length;
    await painel.postar("manutencao", { acao: "backup" });
    assert.equal(painel.ler("pessoas").length, antes);
  });
});

describe("backup: pela linha de comando, e só por ela", () => {
  test("`php backup.php` grava e diz o nome", () => {
    const r = spawnSync("php", [path.join(painel.dir, "painel", "backup.php")], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout.trim(), /^dados-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/);
    assert.deepEqual(zips(), [r.stdout.trim()]);
  });

  test("pela web, backup.php é 404 e não grava", async () => {
    const r = await painel.buscar("backup");
    assert.equal(r.status, 404);
    assert.deepEqual(zips(), []);
  });

  test("guarda os catorze mais novos e apaga o resto", () => {
    mkdirSync(pastaBackups(), { recursive: true });
    for (let d = 1; d <= 16; d++) {
      writeFileSync(path.join(pastaBackups(), `dados-2026-08-${String(d).padStart(2, "0")}-030000.zip`), "PK");
    }
    execFileSync("php", [path.join(painel.dir, "painel", "backup.php")], { stdio: "pipe" });
    const sobraram = zips();
    assert.equal(sobraram.length, 14);
    assert.equal(sobraram[0], "dados-2026-08-04-030000.zip", "não foram os mais velhos que saíram");
  });
});

describe("backup: baixar", () => {
  test("entrega o zip pelo nome, e só pelo nome", async () => {
    await painel.postar("manutencao", { acao: "backup" });
    const [nome] = zips();

    const ok = await painel.buscar("manutencao", `baixar=${nome}`);
    assert.equal(ok.status, 200);
    assert.ok(ok.html.startsWith("PK"), "a resposta não é um zip");

    /* O nome vem da URL. Sem a regex, isto entregaria o segredo do site. */
    for (const errado of ["../segredo.php", "segredo.php", "dados-2026-08-01-030000.zip.tmp", ""]) {
      const r = await painel.buscar("manutencao", `baixar=${encodeURIComponent(errado)}`);
      assert.notEqual(r.html.slice(0, 2), "PK", `"${errado}" entregou um arquivo`);
      if (errado !== "") {
        assert.equal(r.status, 404, `"${errado}" não foi 404`);
      }
    }
  });
});

describe("backup: zerar não apaga a cópia", () => {
  test("os zips sobrevivem ao ZERAR TUDO", async () => {
    await painel.postar("manutencao", { acao: "backup" });
    const antes = zips();
    assert.equal(antes.length, 1);

    const grupos = ["pessoas", "encontros", "comunicacao", "formacao", "contadores", "caixa"];
    await painel.postar("manutencao", { confirmacao: "ZERAR TUDO", "grupos[]": grupos });
    assert.deepEqual(zips(), antes);
  });
});
