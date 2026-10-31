import type { Linha } from "./dados";

export type ResumoVereadores = { cidades: number; faria: number; perto: number; cadeiras: number };

/** Cada cidade usa seu próprio QE; perto = de 80% até menos de 100%. */
export function resumirVereadores(cidades: Linha[]): ResumoVereadores {
  const resumo = { cidades: 0, faria: 0, perto: 0, cadeiras: 0 };
  for (const cidade of cidades) {
    const qe = cidade.qe_ver_2028_est;
    const votos = cidade.missao_pres;
    if (typeof qe !== "number" || !Number.isFinite(qe) || qe <= 0 || typeof votos !== "number" || !Number.isFinite(votos) || votos < 0) continue;
    const quocientes = votos / qe;
    resumo.cidades++;
    if (quocientes >= 1) resumo.faria++;
    else if (quocientes >= 0.8) resumo.perto++;
    resumo.cadeiras += Math.floor(quocientes);
  }
  return resumo;
}
