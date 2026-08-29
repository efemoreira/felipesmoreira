import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chamarPhp } from "./ponte.ts";

/**
 * A TRILHA MÍNIMA DE CADA FUNÇÃO — o par entre o catálogo e o que a formação
 * tem para oferecer a quem escolheu aquela função.
 *
 * `funcoes.json` é a lista que o site mostra em /queroajudar: é ali que alguém
 * escolhe ser Olheiro. `trilha_da_funcao()` responde o que essa pessoa precisa
 * para começar — a aula, o "Pronto quando" e a primeira ferramenta.
 *
 * **A divergência é silenciosa nos dois sentidos.** Função nova no catálogo sem
 * aula que a cite entra no formulário público, gente escolhe, é aprovada — e o
 * hub não tem o que dizer para ela. Aula renomeada do outro lado deixa a trilha
 * apontando para uma âncora que /aulas não tem mais, e o link simplesmente não
 * leva a lugar nenhum. Nenhum dos dois quebra nada visível: só param de formar.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalogo = JSON.parse(readFileSync(path.join(RAIZ, "src/data/funcoes.json"), "utf8"));

interface Trilha {
  funcao: string;
  aula: { id: string; titulo: string; pista: string; minutos: number; dia: number } | null;
  checklist: { id: string; titulo: string; itens: number } | null;
  ferramenta: { area: string; nome: string; acao: string; url: string } | null;
}

const funcoes: { id: string; nome: string; grupo: string }[] = catalogo.funcoes;

/* Uma chamada de processo para o catálogo inteiro — o custo aqui é subir o PHP. */
const trilhas = chamarPhp(funcoes.map((f) => ({ fn: "trilha_da_funcao", args: [f.id] }))) as Trilha[];
const porFuncao = new Map(funcoes.map((f, i) => [f.id, trilhas[i]]));

/* O grupo "outro" é o "Ainda não sei" do formulário: quem escolhe ali não tem
   mesa, e o próprio MESA_DA_FUNCAO diz que inventar uma seria mentir. */
const comMesa = funcoes.filter((f) => f.grupo !== "outro");

describe("trilha mínima: toda função com mesa tem aula, checklist e ferramenta", () => {
  test("cada função do catálogo tem uma aula que a cita", () => {
    for (const f of comMesa) {
      const t = porFuncao.get(f.id)!;
      assert.ok(
        t.aula !== null,
        `${f.nome} (${f.id}) está no formulário público e nenhuma aula do currículo cita essa função — ` +
          `quem escolher ${f.nome} é aprovado e o painel não tem o que mandar ela estudar`,
      );
      assert.ok(t.aula!.titulo !== "", `a aula de ${f.id} veio sem título`);
    }
  });

  test("a aula da função é a que leva o id dela, e não a primeira que a cita", () => {
    /* `fluxo-da-fonte`, no Dia 0, também cita o Olheiro e vem antes no
       currículo. Pegar a primeira que cita mandava quem quer começar a trazer
       fato estudar o caminho geral da informação em vez da Ficha de Fato —
       preparar não é a mesma coisa que habilitar. */
    const olheiro = porFuncao.get("olheiro")!;
    assert.equal(olheiro.aula!.id, "olheiro");
    assert.equal(olheiro.aula!.dia, 2, "a aula do Olheiro saiu de outro Dia do currículo");

    /* O Acervo é o outro caso: `ferramentas-do-time`, no Dia 1, cita a função
       e não ensina a operá-la. */
    assert.equal(porFuncao.get("acervo")!.aula!.id, "acervo");
  });

  test("cada função tem o próprio checklist, e o id é o id da função", () => {
    for (const f of comMesa) {
      const t = porFuncao.get(f.id)!;
      assert.ok(
        t.checklist !== null,
        `${f.nome} (${f.id}) não tem checklist em checklists.php — sem o "Pronto quando" ` +
          `a pessoa entrega e ninguém, nem ela, sabe dizer se está pronto`,
      );
      assert.equal(t.checklist!.id, f.id);
      assert.ok(t.checklist!.itens > 0, `o checklist de ${f.id} está vazio`);
    }
  });

  test("cada função aponta para uma ferramenta que existe no painel", () => {
    for (const f of comMesa) {
      const t = porFuncao.get(f.id)!;
      assert.ok(
        t.ferramenta !== null,
        `${f.nome} (${f.id}) não tem mesa: o hub não sabe que botão desenhar para ela`,
      );
      assert.match(
        t.ferramenta!.url,
        /^\/painel\/[a-z-]+\.php/,
        `a mesa de ${f.id} aponta para ${t.ferramenta!.url}, que não é uma tela do painel`,
      );
      assert.ok(t.ferramenta!.acao !== "", `a mesa de ${f.id} veio sem o verbo do botão`);
    }
  });

  test("o Olheiro é mandado para a ficha em branco, e a Checagem para a fila", () => {
    /* As duas dividem a MESMA tela e precisam de abas diferentes dela. É o caso
       que prova a regra: mesa não é só a área, é onde dentro da área. */
    const olheiro = porFuncao.get("olheiro")!;
    const checagem = porFuncao.get("checagem")!;

    assert.equal(olheiro.ferramenta!.url, "/painel/fatos.php?aba=trazer#trazer");
    assert.equal(checagem.ferramenta!.url, "/painel/fatos.php?aba=fila#fila");
  });

  test("“Ainda não sei” volta sem trilha, e isso é resposta", () => {
    /* Não é falha de cobertura: quem marca "onde precisar" ainda vai conversar
       com a coordenação. Inventar uma mesa para ela seria mentir. */
    const semMesa = funcoes.filter((f) => f.grupo === "outro");
    assert.ok(semMesa.length > 0, "o catálogo perdeu o grupo 'Ainda não sei'");

    for (const f of semMesa) {
      const t = porFuncao.get(f.id)!;
      assert.equal(t.ferramenta, null, `${f.id} ganhou uma mesa fixa que não existe`);
    }
  });
});
