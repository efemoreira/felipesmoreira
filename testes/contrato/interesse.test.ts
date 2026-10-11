import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FORMATO_INTERESSE, interesseDaUrl } from "@/features/inscricao/interesse";

/**
 * O INTERESSE DA INSCRIÇÃO NOS DOIS LADOS. O site lê `?unidade=`/`?tema=` e
 * manda no formato `nuc-…`/`grp-…`/`tema:<chave>`; o painel guarda só o que
 * casa com o regex de `normalizar_pessoa()`. Formatos diferentes fariam a
 * escolha sumir em silêncio entre o formulário e a fila.
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dominio = readFileSync(path.join(RAIZ, "public/painel/dominio.php"), "utf8");

describe("interesse: o mesmo formato", () => {
  test("o regex do TS é o do PHP", () => {
    const php = dominio.match(/const PADRAO_INTERESSE = '(\/[^']+\/)';/)?.[1];
    assert.ok(php, "não achei PADRAO_INTERESSE em dominio.php");
    assert.equal(String(FORMATO_INTERESSE), php);
  });

  test("lê unidade e tema da URL, e descarta o resto", () => {
    assert.equal(interesseDaUrl(new URLSearchParams("unidade=nuc-a1b2c3")), "nuc-a1b2c3");
    assert.equal(interesseDaUrl(new URLSearchParams("unidade=grp-a1b2c3d4")), "grp-a1b2c3d4");
    assert.equal(interesseDaUrl(new URLSearchParams("tema=saude")), "tema:saude");
    assert.equal(interesseDaUrl(new URLSearchParams("unidade=<script>")), "");
    assert.equal(interesseDaUrl(new URLSearchParams("unidade=tema:saude")), "");
    assert.equal(interesseDaUrl(new URLSearchParams("tema=Saúde")), "");
  });
});
