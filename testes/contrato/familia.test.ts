import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  FAMILIAS_DIRETO_AO_GRUPO,
  NOMES_FAMILIA,
  vouDoItem,
  type Familia,
  type ItemAgenda,
} from "../../src/features/programacao/tipos.ts";
import { chamarPhp } from "./ponte.ts";

/**
 * `NOMES_FAMILIA` (TS) ↔ `FAMILIAS` (PHP, `eventos-comum.php`)
 *
 * O `agenda.json` manda a CHAVE da família (`item_publico()`); quem traduz em
 * rótulo do filtro é o `NOMES_FAMILIA` da `/programacao`. Se as duas listas
 * divergirem — uma chave nova no painel sem par aqui, ou um nome que muda de
 * um lado e não do outro — o filtro da agenda mostra uma categoria com nome
 * errado, ou pior, silenciosamente não mostra a categoria nova nenhuma.
 */
describe("família do encontro: mesma chave, mesmo nome dos dois lados", () => {
  test("as chaves batem", async () => {
    const [nomesPhp] = chamarPhp([{ fn: "nomes_das_familias", args: [] }]) as [Record<string, string>];

    assert.deepEqual(
      Object.keys(nomesPhp).sort(),
      Object.keys(NOMES_FAMILIA).sort(),
      "FAMILIAS (PHP) e NOMES_FAMILIA (TS) têm de ter exatamente as mesmas chaves",
    );
  });

  test("os nomes batem", async () => {
    const [nomesPhp] = chamarPhp([{ fn: "nomes_das_familias", args: [] }]) as [Record<string, string>];

    for (const chave of Object.keys(NOMES_FAMILIA)) {
      assert.equal(
        NOMES_FAMILIA[chave as keyof typeof NOMES_FAMILIA],
        nomesPhp[chave],
        `o nome de "${chave}" diverge entre o painel e a /programacao`,
      );
    }
  });
});

/**
 * PARA ONDE VAI O BOTÃO ÚNICO do cartão e da ficha, por família.
 *
 * Ato de campanha entra direto no grupo: ali falta gente para montar, e três
 * telas de formulário antes de a pessoa falar com alguém é o que a faz desistir.
 * Militância — e as outras — passam pelo formulário de confirmação, porque é
 * dele que sai a lista que dimensiona a sala e alimenta o funil de depois; o
 * grupo aparece no fim, na tela de "presença confirmada".
 *
 * É uma regra só, em `vouDoItem()`, porque o cartão e o modal têm de levar ao
 * mesmo lugar — dois `if` iguais em dois arquivos divergem na terceira
 * alteração.
 */
describe("o botão de 'vou': o destino é decisão da família", () => {
  const GRUPO = "https://chat.whatsapp.com/abc";
  const TOKEN = "a1b2c3d4e5f6";

  const item = (familia: Familia, extra: Partial<ItemAgenda> = {}): ItemAgenda => ({
    id: "ev-1",
    titulo: "Encontro",
    dia: "sábado",
    data: "04/10",
    hora: "19:00",
    familia,
    ...extra,
  });

  test("ato de campanha com grupo vai direto para o grupo", () => {
    const vou = vouDoItem(item("campanha", { grupo: GRUPO, confirmar: TOKEN }));
    assert.deepEqual(vou, { href: GRUPO, grupo: true, rotulo: "Quero ajudar" });
  });

  test("militância com grupo E confirmação vai para o formulário", () => {
    const vou = vouDoItem(item("militancia", { grupo: GRUPO, confirmar: TOKEN }));
    assert.deepEqual(vou, { href: `/presenca?c=${TOKEN}`, grupo: false, rotulo: "Confirmar presença" });
  });

  test("sem confirmação, o grupo é o que sobra — em qualquer família", () => {
    for (const f of Object.keys(NOMES_FAMILIA) as Familia[]) {
      const vou = vouDoItem(item(f, { grupo: GRUPO }));
      assert.equal(vou?.href, GRUPO, `${f} sem token de confirmação tinha de cair no grupo`);
      assert.equal(vou?.grupo, true);
    }
  });

  test("sem grupo e sem confirmação não há botão", () => {
    assert.equal(vouDoItem(item("militancia")), null);
  });

  test("a lista do atalho só tem famílias que existem", () => {
    for (const f of FAMILIAS_DIRETO_AO_GRUPO) {
      assert.ok(NOMES_FAMILIA[f], `"${f}" não é uma família do painel`);
    }
  });
});
