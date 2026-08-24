import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chamarPhp } from "./ponte.ts";

/**
 * OS DOIS LINKS DO WHATSAPP.
 *
 * O nono dígito é obrigatório para discar e não é para a conta do WhatsApp:
 * quem registrou o aparelho antes da mudança e nunca reinstalou continua com
 * oito dígitos lá dentro. Para essa pessoa o `wa.me` de 13 dígitos abre "número
 * inválido", e o de 12 abre a conversa — e há o caso inverso, de quem foi
 * cadastrado aqui sem o 9. Não dá para saber de fora qual é qual, então o
 * painel oferece as duas grafias.
 *
 * **O que se perde sem este teste** é o segundo link virando palpite: um 9
 * enfiado num telefone fixo, um `55` de DDD confundido com o do país, ou a
 * próxima tela escrevendo `wa.me/55<telefone>` na mão de novo — que é como as
 * três cópias antigas nasceram, e nenhuma delas sabia do nono dígito.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PAINEL = path.join(RAIZ, "public/painel");

describe("whatsapp: o número que o wa.me recebe", () => {
  test("o link principal é 55 + o que está guardado", () => {
    const casos: [string, string][] = [
      ["85981872972", "5585981872972"],
      ["8532224444", "558532224444"],
      ["(85) 98187-2972", "5585981872972"],
      /* Já internacionalizado não ganha outro 55 na frente. */
      ["5585981872972", "5585981872972"],
      /* DDD 55 é Santa Maria: aqui o 55 é da cidade, e o número precisa do país. */
      ["5599999888", "555599999888"],
    ];
    const saida = chamarPhp(casos.map(([t]) => ({ fn: "numero_whatsapp", args: [t] })));
    casos.forEach(([entrada, esperado], i) => {
      assert.equal(saida[i], esperado, `numero_whatsapp("${entrada}")`);
    });
  });

  test("a segunda grafia tira ou põe o nono dígito, e só em celular", () => {
    const casos: [string, string][] = [
      /* 11 dígitos guardados → a tentativa é sem o 9 (12 no link). */
      ["85981872972", "558581872972"],
      /* 10 dígitos de celular → a tentativa é com o 9 (13 no link). */
      ["8581872972", "5585981872972"],
      /* Fixo nunca ganhou o nono dígito: não há segunda grafia. */
      ["8532224444", ""],
      /* Número pela metade não vira palpite. */
      ["85981", ""],
      ["", ""],
    ];
    const saida = chamarPhp(casos.map(([t]) => ({ fn: "numero_whatsapp_outro", args: [t] })));
    casos.forEach(([entrada, esperado], i) => {
      assert.equal(saida[i], esperado, `numero_whatsapp_outro("${entrada}")`);
    });
  });

  test("as duas grafias têm 13 e 12 dígitos, e diferem só pelo 9", () => {
    const [principal, outro] = chamarPhp([
      { fn: "numero_whatsapp", args: ["85981872972"] },
      { fn: "numero_whatsapp_outro", args: ["85981872972"] },
    ]) as string[];

    assert.equal(principal.length, 13);
    assert.equal(outro.length, 12);
    assert.equal(principal.replace(/^(\d{4})9/, "$1"), outro, "o que muda entre os dois não é só o 9");
  });
});

describe("whatsapp: nenhuma tela monta o link na mão", () => {
  test("só o helper e a constante da coordenação escrevem wa.me", () => {
    /* `links_whatsapp()` (layout.php) desenha o par; `numero_whatsapp()`
       (sessao.php) faz a conta. Tela que escreve o href sozinha volta a ter um
       link só — e o link só é justamente o que não abre para metade das
       pessoas. */
    const permitidos = new Set(["layout.php", "sessao.php"]);
    const naMao = readdirSync(PAINEL)
      .filter((f) => f.endsWith(".php") && !permitidos.has(f))
      .filter((f) => /wa\.me\//.test(readFileSync(path.join(PAINEL, f), "utf8")));

    assert.deepEqual(
      naMao,
      [],
      "estas telas montam o link do WhatsApp na mão em vez de chamar `links_whatsapp()`:\n  " +
        naMao.join("\n  "),
    );
  });
});
