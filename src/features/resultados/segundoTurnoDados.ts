import type { Linha } from "./dados";

/** O ajuste da fidelidade (peso em votos, estimado no export) e a régua dos outros eliminados. */
export type Fidelidade = {
  k_cidade: number | null;
  k_bairro: number | null;
  referencia: { numero: string; nome: string; votos_1t: number; nulos_2t: number; por100: number }[];
};
export type ContagemResumo = {
  geradoEm: string;
  completo: boolean;
  brasil: Linha;
  ufs: Linha[];
  fontes: { nome: string; url: string }[];
  coberturaBairros: { municipiosComBairros: number; minEleitores: number; ufsCompletas: string[]; criterio: string };
  fidelidade?: Fidelidade;
};
export type ContagemCidade = { cidade: Linha; bairros: Linha[]; locais: Linha[] };
type Compacta = { colunas: string[]; linhas: (number | string | boolean | null)[][] };
const expandir = (t: Compacta): Linha[] => t.linhas.map((r) => Object.fromEntries(t.colunas.flatMap((c,i) => r[i] === null ? [] : [[c,r[i]]])));
const cache = new Map<string,Promise<unknown>>();
async function ler<T>(arquivo: string, transformar: (b: unknown) => T): Promise<T> {
  if (!cache.has(arquivo)) cache.set(arquivo, fetch(`/contagem-2026-2t/${arquivo}`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).then(transformar).catch((e) => { cache.delete(arquivo); throw e; }));
  return cache.get(arquivo) as Promise<T>;
}
export const carregarContagemResumo = () => ler<ContagemResumo>("resumo.json",(b) => b as ContagemResumo);
export const carregarContagemUf = (uf: string) => ler<Linha[]>(`uf/${uf}.json`,(b) => expandir(b as Compacta));
export const carregarContagemCidade = (chave: string) => ler<ContagemCidade>(`cidades/${chave}.json`,(bruto) => {
  const b = bruto as { cidade: Linha; bairros: Compacta; locais: Compacta };
  return { cidade: b.cidade, bairros: expandir(b.bairros), locais: expandir(b.locais) };
});
/** O 2º turno já nos bairros do 1º (`bairro_chave`). `chave` = `<uf>/<município>`. */
export const carregarContagemExplorar = (chave: string) => ler<{ bairros: Linha[]; t2_votos_fora?: number }>(`explorar/${chave}.json`,(bruto) => {
  const b = bruto as { bairros: Compacta; t2_votos_fora?: number };
  return { bairros: expandir(b.bairros), t2_votos_fora: b.t2_votos_fora };
});
