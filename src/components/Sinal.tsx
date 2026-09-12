"use client";
import { useEffect } from "react";
import { sinal } from "@/lib/api/sinal";

/**
 * "Alguém abriu esta página" — um sinal por carga, montado no layout raiz.
 *
 * Não é analytics: é uma contagem por dia e por rota, sem quem. Existe para a
 * pergunta "quantos abriram /candidatos esta semana e quantos compartilharam?"
 * ter número em vez de impressão.
 */
export function Sinal() {
  useEffect(() => {
    sinal("abriu");
  }, []);
  return null;
}
