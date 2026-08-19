/**
 * Cliente para a API JSON do painel (PHP, fora deste build — ver public/painel/api/).
 * Único ponto do site que fala com o backend: qualquer novo endpoint do painel
 * deve ser chamado a partir daqui, não com fetch solto espalhado pelas features.
 */

const BASE = "/painel/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
    throw new ApiError(resposta.status, `Falha ao chamar ${caminho}: ${resposta.status}`);
  }

  return (await resposta.json()) as T;
}
