/**
 * Validação do formulário de inscrição.
 *
 * As mesmas regras são repetidas no PHP (public/painel/api/inscricao.php) —
 * aqui é para ajudar quem preenche, lá é para valer. Nunca confie só nesta.
 */

import { cidadeConhecida } from "@/lib/municipios";

/**
 * O rascunho dos campos, na sessão da aba.
 *
 * Mora aqui, e não no InscricaoClient, porque a página de presença grava nesta
 * MESMA chave para mandar quem confirmou presença ao formulário sem redigitar
 * nada. Importá-la do componente arrastaria o formulário de inscrição inteiro
 * (~16 kB) para dentro do bundle do /presenca — que é aberto em pé, na porta do
 * encontro, no 4G de quem chegou.
 *
 * Duas cópias da string divergiriam na primeira vez que alguém a renomeasse, e
 * o defeito seria silencioso: o formulário simplesmente abriria vazio.
 */
export const CHAVE_RASCUNHO = "inscricao-campos";

/** Só os dígitos, do jeito que a gente guarda e manda pro WhatsApp. */
export const soDigitos = (v: string) => v.replace(/\D/g, "");

/**
 * Máscara brasileira conforme a pessoa digita: (85) 91234-5678.
 * Aceita 10 dígitos (fixo) e 11 (celular).
 */
export function mascararTelefone(bruto: string): string {
  const d = soDigitos(bruto).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** DDDs que existem no Brasil — pega o erro de digitação mais comum. */
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** '' quando está tudo certo; senão a mensagem que diz como corrigir. */
export function validarTelefone(valor: string): string {
  const d = soDigitos(valor);
  if (d === "") return "Coloque seu WhatsApp — é por ele que a gente vai te mandar o acesso.";
  if (d.length < 10) return "Faltam números. Use DDD + número, como (85) 91234-5678.";
  if (d.length > 11) return "Número comprido demais. Use DDD + número, sem o 55 do Brasil.";
  if (!DDDS_VALIDOS.has(Number(d.slice(0, 2)))) return `${d.slice(0, 2)} não é um DDD do Brasil. Confira os dois primeiros números.`;
  if (d.length === 11 && d[2] !== "9") return "Celular com 11 números começa com 9 depois do DDD.";
  return "";
}

export function validarNome(valor: string): string {
  const limpo = valor.trim().replace(/\s+/g, " ");
  if (limpo === "") return "Escreva seu nome.";
  if (limpo.length < 5) return "Escreva seu nome completo.";
  if (!limpo.includes(" ")) return "Falta o sobrenome.";
  if (!/^[\p{L}\s'.-]+$/u.test(limpo)) return "Use só letras no nome.";
  return "";
}

/**
 * O e-mail é opcional, mas quando vem tem de passar aqui E no servidor.
 *
 * A régua de lá é `FILTER_VALIDATE_EMAIL`, e a daqui precisa ser pelo menos
 * tão dura — senão a pessoa vê marca verde nos três passos e leva um "Esse
 * e-mail parece incompleto" genérico depois de enviar, sem saber qual campo é.
 * O `[^\s@]+@[^\s@]+\.[^\s@]{2,}` de antes deixava passar dez formatos que o
 * PHP recusa; o mais comum deles é o acento, que em nome de gente daqui é
 * regra e não exceção: `joão@gmail.com` passava na tela e morria no envio.
 *
 * O que a expressão prende, na ordem em que erra na vida real:
 *   - acento e qualquer letra fora do ASCII, dos dois lados do @;
 *   - ponto encostado no @ ou no começo, e ponto dobrado (`maria..silva`);
 *   - ponto sobrando no fim, que vem de e-mail colado do fim de uma frase;
 *   - hífen ou `_` na borda do domínio (`@-gmail.com`, `@gm_ail.com`).
 *
 * Ela recusa um punhado de coisas que o RFC permite e o PHP aceita — `!` e `#`
 * no nome, domínio de uma letra só. É a direção segura: a tela ser mais dura
 * ajuda quem digita, e não barra ninguém que já ia passar. Ver
 * `testes/contrato/inscricao.test.ts`.
 */
const EMAIL =
  /^[A-Za-z0-9_%+'-]+(\.[A-Za-z0-9_%+'-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function validarEmail(valor: string): string {
  const limpo = valor.trim();
  if (limpo === "") return ""; // opcional
  if (!EMAIL.test(limpo)) return "Esse e-mail não passa. Confira o @ e o final — e e-mail não leva acento.";
  return "";
}

/**
 * A cidade vem de lista, então validar é conferir que uma foi escolhida.
 *
 * O "escreva o nome da cidade" de antes não existe mais: não há como escrever
 * errado o que se escolhe. O que sobrou é o caso de o rascunho guardado no
 * `sessionStorage` trazer um nome de uma versão anterior da lista — aí a
 * escolha caducou e a pessoa escolhe de novo, em vez de enviar um valor que o
 * servidor vai descartar em silêncio.
 */
export function validarCidade(valor: string): string {
  if (valor.trim() === "") return "Escolha sua cidade na lista.";
  if (!cidadeConhecida(valor)) return "Essa cidade não está na lista. Escolha de novo.";
  return "";
}

export function validarBairro(valor: string): string {
  if (valor.trim() === "") return "Diga seu bairro — é assim que a gente monta os times por região.";
  if (valor.trim().length < 2) return "Escreva o nome do bairro.";
  return "";
}
