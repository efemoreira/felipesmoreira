/**
 * De onde a pessoa veio — o `?de=` que fecha o ciclo do mutirão.
 *
 * O militante digita o nome uma vez, e todo link que ele compartilha sai com o
 * slug dele. Sem isso o alcance existe e ninguém sabe de quem foi.
 *
 * Mora aqui, e não no `features/kit/data.ts` onde nasceu, porque três páginas
 * precisam disto — Munição, inscrição e presença — e importá-lo de lá arrastava
 * as oito peças fixas do plano para dentro do bundle do `/presenca`, que é
 * aberto em pé, na porta do encontro, no 4G de quem acabou de chegar. Medido:
 * o texto das peças estava mesmo no chunk da página.
 */

/** O domínio, para montar link absoluto que vai colado num WhatsApp. */
export const SITE = "https://felipesmoreira.com";

/**
 * Onde o nome do militante fica guardado no navegador dele.
 *
 * `localStorage` e não servidor de propósito: o nome serve só para montar o
 * `?de=` do link, e guardá-lo do nosso lado seria coletar dado que não
 * precisamos ter. A inscrição grava a mesma chave ao terminar, para quem for à
 * Munição depois já encontrar o campo preenchido.
 */
export const CHAVE_NOME = "kit-nome";

/**
 * "João da Silva" -> "joao-da-silva", **na mesma ordem** do
 * `normalizar_origem()` do PHP.
 *
 * `normalize("NFD")` é o equivalente correto do `sem_acento()` do painel: o
 * Unicode define o resultado, então dá o mesmo em qualquer máquina. Os dois
 * lados **precisam** concordar, senão o mesmo militante vira duas origens no
 * relatório — e ninguém descobre, porque as duas linhas existem e as duas
 * parecem certas.
 *
 * A ORDEM DOS PASSOS FAZ PARTE DO PACTO, e foi onde os dois discordavam:
 *
 * 1. `limpar_texto($bruto, 60)` do PHP apara as pontas, tira os caracteres de
 *    controle e **corta o texto CRU em 60** — só depois vem o slug. Cortar o
 *    slug pronto, como se fazia aqui, para num lugar diferente sempre que
 *    espaços em excesso colapsam num hífen só;
 * 2. o corte é por CARACTERE (`mb_substr`), e não por unidade de UTF-16 — daí
 *    o `[...texto]`, que separa por ponto de código como o PHP;
 * 3. tirar os hifens das pontas é o ÚLTIMO passo. Antes ele vinha antes do
 *    corte, e um slug cortado em 60 saía terminando em "-" — exatamente o que
 *    esta linha existe para impedir.
 *
 * O teste `testes/contrato/origem.test.ts` roda os dois lados sobre a mesma
 * lista de nomes. Foi ele que achou as duas divergências acima.
 */
export function slugDe(nome: string): string {
  const limpo = [
    ...nome.trim().replace(/[\u0000-\u001F\u007F]/g, ""),
  ]
    .slice(0, 60)
    .join("");

  return limpo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira as marcas que o NFD separou
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
