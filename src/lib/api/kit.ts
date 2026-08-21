import { apiFetch } from "./client";
import type { Peca } from "@/features/kit/data";

/**
 * As peças que a coordenação criou pela tela de Produção.
 *
 * Endpoint público e sem sessão: a peça existe para circular no WhatsApp, e o
 * que ela contém já estará em print no grupo cinco minutos depois de publicada.
 *
 * O ícone não vem do painel — quem escolhe é o site, a partir do tema. Assim a
 * coordenação não precisa saber quais ícones existem em `icons.tsx`, e uma peça
 * nunca chega apontando para um ícone que não existe.
 */
export interface PecaDoPainel {
  id: string;
  tema: string;
  numero: string;
  frase: string;
  fonte: string;
  legenda: string;
  destino: string;
}

export async function obterPecasDoPainel(): Promise<PecaDoPainel[]> {
  const r = await apiFetch<{ pecas?: PecaDoPainel[] }>("/kit.php");
  return Array.isArray(r.pecas) ? r.pecas : [];
}

/** Um ícone por tema; `star` para tema que o site ainda não conhece. */
const ICONE_DO_TEMA: Record<string, Peca["icone"]> = {
  "Segurança": "sword",
  "Periferia": "home",
  "Saúde": "heartHandshake",
  "Interior": "tree",
  "Água": "world",
  "Educação": "book",
  "O método": "book",
};

export function comoPeca(p: PecaDoPainel): Peca {
  return {
    id: p.id,
    icone: ICONE_DO_TEMA[p.tema] ?? "star",
    tema: p.tema,
    numero: p.numero,
    frase: p.frase,
    fonte: p.fonte,
    destino: p.destino,
    legenda: p.legenda,
  };
}
