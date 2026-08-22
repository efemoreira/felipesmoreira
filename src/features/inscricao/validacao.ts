/**
 * Validação do formulário de inscrição.
 *
 * As mesmas regras são repetidas no PHP (public/painel/api/inscricao.php) —
 * aqui é para ajudar quem preenche, lá é para valer. Nunca confie só nesta.
 */

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

export function validarEmail(valor: string): string {
  const limpo = valor.trim();
  if (limpo === "") return ""; // opcional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpo)) return "Esse e-mail parece incompleto. Confira o @ e o final.";
  return "";
}

export function validarCidade(valor: string): string {
  if (valor.trim() === "") return "Diga em que cidade você mora.";
  if (valor.trim().length < 2) return "Escreva o nome da cidade.";
  return "";
}

export function validarBairro(valor: string): string {
  if (valor.trim() === "") return "Diga seu bairro — é assim que a gente monta os times por região.";
  if (valor.trim().length < 2) return "Escreva o nome do bairro.";
  return "";
}
