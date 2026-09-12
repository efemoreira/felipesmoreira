import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";
import { CHAPA } from "@/features/missao/data";

export const alt = "Nossos candidatos — em que número votar";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

/* É a rota que mais circula na reta final, e a prévia genérica não dizia o
   número. O da chapa sai de `CHAPA.numero`, a fonte única. */
export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Em que número votar",
    titulo: `Vote ${CHAPA.numero}`,
    linha: `${CHAPA.governador} governador · ${CHAPA.vice} vice · os candidatos da Missão no Ceará`,
  });
}
