/**
 * Os 184 municípios do Ceará — lista, não campo de texto.
 *
 * Cidade digitada à mão vira "Juazeiro do Norte", "juazeiro" e "Juazeiro do
 * norte" na mesma coluna do relatório, e o agrupamento por região passa a
 * contar a mesma cidade três vezes. São 184 nomes conhecidos e estáveis: cabe
 * numa lista, e a lista responde a pergunta antes de a pessoa errar.
 *
 * **Fonte única para os dois lados.** O JSON é importado aqui no build (site
 * público) e copiado pelo `publish.yml` para `out/municipios-ce.json`, que o
 * painel PHP lê em `municipios_ce()`. Mesma mecânica do `funcoes.json`, e pela
 * mesma razão: duas listas divergem na terceira alteração.
 *
 * Peso no bundle: ~2,5 KB de texto, que o gzip reduz a pouco mais de 1 KB.
 * Medido antes de entrar no `/presenca`, que é aberto em pé, na porta do
 * encontro, no 4G do local.
 */

import dados from "@/data/municipios-ce.json";

/**
 * A primeira opção de quem não é do Ceará.
 *
 * Não é um município e não pretende ser: quem veio de fora — visitando, ou de
 * passagem, ou morando em outro estado — precisa de UMA opção que responda
 * "não sou daqui", e não de uma lista de 5.570 cidades para achar a dele. O
 * bairro continua livre, e é lá que cabe a cidade de verdade se importar.
 */
export const FORA_DO_CEARA: string = dados.fora;

/** Em ordem alfabética, que é a ordem em que aparecem no formulário. */
export const MUNICIPIOS_CE: readonly string[] = dados.municipios;

/** Sem acento e sem caixa, para comparar o que a pessoa escolheu. */
const chave = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const CONHECIDAS = new Set([...MUNICIPIOS_CE, FORA_DO_CEARA].map(chave));

/**
 * A cidade é do catálogo (ou "Fora do Ceará")?
 *
 * O `<select>` já impede escolher o que não está na lista; isto existe para o
 * que chega por outro caminho — rascunho guardado no `sessionStorage` de uma
 * versão anterior da lista, ficha antiga preenchida à mão no painel.
 */
export const cidadeConhecida = (valor: string): boolean =>
  CONHECIDAS.has(chave(valor));
