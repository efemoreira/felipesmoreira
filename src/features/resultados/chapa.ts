/**
 * A chapa de vereador que cada partido pode registrar na cidade (Lei 9.504/97,
 * art. 10, com a redação da Lei 14.211/2021): até o número de vagas + 1, e no
 * mínimo 30% de cada sexo — fração arredonda para cima. Conta em inteiros para
 * 30% de 10 dar 3, não 3,0000000001.
 */
export function chapaVereador(vagas: number): { candidaturas: number; mulheres: number } {
  if (!(vagas > 0)) return { candidaturas: NaN, mulheres: NaN };
  const candidaturas = vagas + 1;
  return { candidaturas, mulheres: Math.ceil((candidaturas * 3) / 10) };
}
