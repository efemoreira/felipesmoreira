import { num } from "./formato";
import { Kpis, Secao } from "./pecas";
import type { ResumoVereadores as Resumo } from "./vereadores";

export default function ResumoVereadores({ resumo }: { resumo: Resumo }) {
  return (
    <Secao titulo="Votos do Renan fariam vereador — Brasil" explica="vereador-2028" sub={`Comparação em ${num(resumo.cidades)} cidades, usando os votos do Renan em cada uma e o QE estimado para 2028. Perto = de 80% até menos de 100% do quociente. É uma estimativa, não previsão de eleitos.`}>
      <Kpis itens={[
        { rotulo: "Votos do Renan fariam vereador", valor: `${num(resumo.faria)} cidades`, sub: "alcançam pelo menos 100% do QE", missao: true },
        { rotulo: "Faltaria pouco", valor: `${num(resumo.perto)} cidades`, sub: "faltam até 20% do QE para a primeira cadeira", missao: true },
        { rotulo: "Cadeiras com os votos do Renan", valor: num(resumo.cadeiras), sub: "soma das partes inteiras do QE de cada cidade" },
      ]} />
    </Secao>
  );
}
