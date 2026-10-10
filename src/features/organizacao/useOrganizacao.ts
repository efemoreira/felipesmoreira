"use client";
import { useEffect, useState } from "react";
import { obterOrganizacao, type Organizacao } from "@/lib/api/organizacao";

export type Estado =
  | { fase: "carregando" }
  | { fase: "pronto"; dados: Organizacao }
  /* Sem painel (next dev) ou fora do ar: a parte fixa da página continua
     servindo, e a lista diz o que aconteceu em vez de sumir. */
  | { fase: "erro" };

/** O que está publicado no painel — pedido uma vez por página. */
export function useOrganizacao(): Estado {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  useEffect(() => {
    let vivo = true;
    obterOrganizacao()
      .then((dados) => vivo && setEstado({ fase: "pronto", dados }))
      .catch(() => vivo && setEstado({ fase: "erro" }));
    return () => {
      vivo = false;
    };
  }, []);
  return estado;
}
