/**
 * Cliente para a API JSON do painel (PHP, fora deste build — ver public/painel/api/).
 * Único ponto do site que fala com o backend: qualquer novo endpoint do painel
 * deve ser chamado a partir daqui, não com fetch solto espalhado pelas features.
 */

const BASE = "/painel/api";

export class ApiError extends Error {
  status: number;
  /**
   * O corpo já decodificado, quando veio JSON.
   *
   * O painel responde erro de validação com `{ok:false, erro:"…"}` e status 4xx
   * (ver api/inscricao.php e api/presenca.php). Sem guardar o corpo aqui, quem
   * chama teria de repetir o fetch cru só para ler a mensagem — e foi assim que
   * o formulário de inscrição acabou fora deste cliente.
   */
  corpo: unknown;

  constructor(status: number, message: string, corpo: unknown = null) {
    super(message);
    this.status = status;
    this.corpo = corpo;
  }
}

export async function apiFetch<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new ApiError(resposta.status, `Falha ao chamar ${caminho}: ${resposta.status}`, corpo);
  }

  return (await resposta.json()) as T;
}
