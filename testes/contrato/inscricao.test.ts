import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chamarPhp } from "./ponte.ts";
import {
  CHAVE_RASCUNHO,
  soDigitos,
  mascararTelefone,
  validarNome,
  validarTelefone,
  validarEmail,
  validarBairro,
} from "@/features/inscricao/validacao.ts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Um arquivo do site, como texto — para conferir o que o TypeScript não liga. */
function lerFonte(relativo: string): string {
  return readFileSync(path.join(RAIZ, relativo), "utf8");
}

/**
 * A RÉGUA DA INSCRIÇÃO EXISTE DUAS VEZES: `validacao.ts` ajuda quem preenche,
 * `recusa_de_inscricao()` (PHP) é a que vale. Este teste é o que impede as duas
 * de divergirem em silêncio.
 *
 * **A divergência que dói tem direção.** Se o servidor recusar alguma coisa que
 * a tela deu como boa, a pessoa preenche os três passos, vê marca verde em todo
 * campo e leva um "não deu" genérico no fim — e vai embora, no momento de maior
 * entusiasmo que ela vai ter. É a mesma perda que o vão entre se inscrever e
 * ser aprovado causa, só que sem nem virar uma linha na fila.
 *
 * O contrário é de propósito e não é defeito: o servidor aceita MAIS do que a
 * tela pede. Função é opcional lá e obrigatória aqui; o nome com número passa
 * no PHP e a tela pede só letras. A tela é mais dura para ajudar quem digita,
 * não para barrar.
 */

/** Um envio completo, com só o campo em teste trocado. */
function envio(troca: Record<string, string>) {
  return {
    nome: "Maria da Silva",
    telefone: "85991234567",
    email: "",
    cidade: "Fortaleza",
    bairro: "Benfica",
    ...troca,
  };
}

/** O que o PHP responde para cada envio: '' quando aceita. */
function recusasDoPhp(envios: Record<string, string>[]): string[] {
  return chamarPhp(envios.map((e) => ({ fn: "recusa_de_inscricao", args: [e] }))) as string[];
}

/** O que a tela responde para o mesmo envio: '' quando aceita. */
function recusaDaTela(e: Record<string, string>): string {
  return (
    validarNome(e.nome) ||
    validarTelefone(e.telefone) ||
    validarEmail(e.email) ||
    validarBairro(e.bairro)
  );
}

describe("inscrição: a régua da tela e a do servidor", () => {
  /* O telefone chega ao servidor já sem máscara — é `soDigitos()` que o
     formulário aplica antes de enviar. Testar com a máscara aqui mediria o
     transporte, e não a régua. */
  const CASOS = [
    envio({}),
    envio({ nome: "Ana Maria de Souza Ribeiro" }),
    envio({ nome: "José D'Ávila" }),
    envio({ nome: "Ana Lu" }), // 6 letras com espaço: o mínimo que os dois aceitam
    envio({ email: "maria@exemplo.com" }),
    envio({ email: "maria@exemplo.com.br" }),
    /* O contrário do bloco de recusas: apertar a régua do e-mail não pode ter
       levado junto o que gente de verdade usa. */
    envio({ email: "maria.silva+campanha@gmail.com" }),
    envio({ email: "maria_silva@uol.com.br" }),
    envio({ email: "maria-silva@bol.com.br" }),
    envio({ email: "MARIA@GMAIL.COM" }),
    envio({ email: "maria@sub.dominio.com.br" }),
    envio({ telefone: "8532221100" }), // fixo, 10 dígitos
    envio({ telefone: "85991234567" }),
    envio({ telefone: "11987654321" }),
    envio({ bairro: "Sé" }), // dois caracteres: o mínimo da tela
    envio({ cidade: "Juazeiro do Norte" }),
  ];

  test("tudo que a tela aceita, o servidor também aceita", () => {
    const doPhp = recusasDoPhp(CASOS);

    CASOS.forEach((caso, i) => {
      if (recusaDaTela(caso) !== "") {
        return; // a tela já barrou: o servidor nem chega a ver
      }
      assert.equal(
        doPhp[i],
        "",
        `a tela aceitou e o SERVIDOR RECUSOU ${JSON.stringify(caso)}: “${doPhp[i]}”.\n` +
          "Quem preencher isso passa pelos três passos e leva um não no fim.",
      );
    });
  });

  test("o que o servidor recusa por campo, a tela também recusa antes", () => {
    /* Estes são os casos em que o servidor diz não. A tela tem de dizer não
       primeiro — senão a pessoa só descobre depois de enviar. */
    const RUINS = [
      envio({ nome: "Ana" }), // curto demais
      envio({ nome: "Maria" }), // sem sobrenome
      envio({ nome: "   " }), // só espaço
      envio({ telefone: "8591234" }), // faltam números
      envio({ telefone: "5585991234567" }), // veio com o 55 do Brasil
      envio({ telefone: "" }),
      envio({ email: "maria@" }),
      envio({ email: "maria.exemplo.com" }),
      /* Os dez formatos que a tela dava como bons e o PHP recusava. O primeiro
         é o que mais aparece: nome de gente daqui tem acento, e quem escreve o
         e-mail com ele passava pelos três passos para levar um não no fim. */
      envio({ email: "joão@gmail.com" }),
      envio({ email: "maria@gmail.côm" }),
      envio({ email: "maria..silva@gmail.com" }),
      envio({ email: ".maria@gmail.com" }),
      envio({ email: "maria.@gmail.com" }),
      envio({ email: "maria@gmail.com." }),
      envio({ email: "maria@.gmail.com" }),
      envio({ email: "maria@gmail..com" }),
      envio({ email: "maria@-gmail.com" }),
      envio({ email: "maria@gm_ail.com" }),
      envio({ bairro: "" }),
    ];

    const doPhp = recusasDoPhp(RUINS);

    RUINS.forEach((caso, i) => {
      assert.notEqual(doPhp[i], "", `o servidor aceitou ${JSON.stringify(caso)} — caso mal escolhido`);
      assert.notEqual(
        recusaDaTela(caso),
        "",
        `o SERVIDOR RECUSA e a tela deixa passar ${JSON.stringify(caso)}.\n` +
          "A pessoa só vai descobrir depois de enviar, e o erro não diz qual campo é.",
      );
    });
  });

  test("a máscara do telefone não muda o que chega ao servidor", () => {
    /* A tela mostra `(85) 91234-5678` e envia só os dígitos. Se a máscara
       passasse a comer ou inventar um dígito, o número gravado seria outro — e
       é por esse número que a coordenação chama a pessoa. */
    const digitados = ["85991234567", "(85) 99123-4567", "85 9 9123 4567", "8532221100"];
    const mascarados = digitados.map((d) => soDigitos(mascararTelefone(d)));

    const doPhp = chamarPhp(
      digitados.map((d) => ({ fn: "so_digitos", args: [d] })),
    ) as string[];

    assert.deepEqual(mascarados, doPhp, "a máscara mudou os dígitos que o PHP vai guardar");
  });
});

describe("inscrição: o e-mail é opcional dos dois lados", () => {
  test("vazio passa nos dois", () => {
    const [doPhp] = recusasDoPhp([envio({ email: "" })]);
    assert.equal(doPhp, "");
    assert.equal(validarEmail(""), "");
  });
});

/**
 * A PASSAGEM DE BASTÃO ENTRE `/presenca` E `/queroajudar`.
 *
 * Quem confirma presença e não é do movimento recebe o convite de se inscrever
 * com os dados já preenchidos — por `sessionStorage`, e nunca por querystring:
 * telefone em URL entra no histórico, no referrer e no log do servidor.
 *
 * As duas pontas são arquivos diferentes, e nada no TypeScript liga uma à
 * outra: a presença grava um objeto solto e o formulário lê o que quiser dele.
 * Se a presença passar a gravar `whatsapp` em vez de `telefone`, ou se o
 * formulário renomear um campo, **o dado some sem erro nenhum** — a pessoa
 * chega no formulário achando que ia estar preenchido, e digita tudo de novo
 * em pé, na porta do encontro.
 */
describe("inscrição: o que a presença entrega ao formulário", () => {
  /* AS DUAS LISTAS SÃO LIDAS DO CÓDIGO, e não escritas aqui à mão. Uma cópia
     escrita no teste documentaria o combinado e não o prenderia: renomear o
     campo nos dois arquivos de verdade deixaria o teste passando feliz. */

  /** Os campos que `levarParaAjudar()` põe no sessionStorage. */
  function entreguesPelaPresenca(): string[] {
    const fonte = lerFonte("src/features/presenca/PresencaClient.tsx");
    const bloco = /const levarParaAjudar = \(\) => \{\s*const dados = \{([\s\S]*?)\};/.exec(fonte);
    assert.ok(bloco, "não achei o objeto de `levarParaAjudar` — o teste precisa ser reapontado");
    return [...bloco[1].matchAll(/^\s*(\w+)\s*:/gm)].map((m) => m[1]);
  }

  /** Os campos de texto que o formulário conhece — o tipo `CampoTexto`. */
  function conhecidosPeloFormulario(): string[] {
    const fonte = lerFonte("src/features/inscricao/tipos.ts");
    const bloco = /export type CampoTexto =([^;]+);/.exec(fonte);
    assert.ok(bloco, "não achei o tipo CampoTexto — o teste precisa ser reapontado");
    return [...bloco[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  }

  test("todo campo entregue é um campo que o formulário conhece", () => {
    const conhecidos = conhecidosPeloFormulario();
    assert.ok(conhecidos.length >= 4, "o tipo CampoTexto veio vazio — a leitura falhou");

    for (const campo of entreguesPelaPresenca()) {
      assert.ok(
        conhecidos.includes(campo),
        `a presença entrega "${campo}" e o formulário não lê esse campo — o dado some calado, ` +
          "e a pessoa redigita tudo em pé, na porta do encontro",
      );
    }
  });

  test("os quatro obrigatórios chegam todos, e não três deles", () => {
    /* São os mesmos quatro dos dois lados: WhatsApp, nome, bairro e cidade.
       Campo que existe de um lado só é campo que a pessoa digita duas vezes. */
    const entregues = entreguesPelaPresenca();
    for (const campo of ["nome", "telefone", "cidade", "bairro"]) {
      assert.ok(
        entregues.includes(campo),
        `a presença não entrega "${campo}", que é obrigatório nos dois fluxos`,
      );
    }
  });

  test("o telefone entregue passa na régua do formulário, sem máscara", () => {
    /* A presença grava `soDigitos(telefone)`; o formulário valida o que leu.
       Se a régua passasse a exigir a máscara, o rascunho restaurado abriria já
       com o campo em vermelho — e o convite viraria um formulário com erro. */
    for (const digitado of ["85991234567", "8532221100"]) {
      assert.equal(
        validarTelefone(soDigitos(digitado)),
        "",
        "o telefone que a presença entrega chega inválido no formulário",
      );
    }
  });

  test("a chave do rascunho é uma só, e as duas pontas usam a mesma", () => {
    /* Duas cópias da string divergiriam na primeira vez que alguém a
       renomeasse, e o defeito seria silencioso: o formulário abriria vazio. */
    for (const arq of [
      "src/features/presenca/PresencaClient.tsx",
      "src/features/inscricao/InscricaoClient.tsx",
    ]) {
      const fonte = lerFonte(arq);
      assert.match(fonte, /CHAVE_RASCUNHO/, `${arq} deixou de usar a chave compartilhada`);
      assert.doesNotMatch(
        fonte,
        /sessionStorage\.(get|set|remove)Item\("inscricao-campos"/,
        `${arq} escreveu a chave à mão em vez de importar CHAVE_RASCUNHO`,
      );
    }
    assert.equal(CHAVE_RASCUNHO, "inscricao-campos");
  });
});
