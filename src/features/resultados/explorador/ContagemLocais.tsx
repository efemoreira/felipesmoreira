"use client";
import React, { useMemo, useState } from "react";
import { n, t, useRecurso, type Linha } from "../dados";
import { Busca, Carregando, Filtros, Tabela, type Coluna } from "../pecas";
import { carregarContagemCidade } from "../segundoTurnoDados";

/** Abaixo disso a razão com o 1º turno oscila demais para comparar locais. */
export const PISO_1T = 30;

const porMil = (l: Linha) => (n(l, "nulos14_1") / n(l, "votos_1")) * 1000;
const por100 = (l: Linha) => (n(l, "votos14_1t") >= PISO_1T ? (n(l, "nulos14_1") / n(l, "votos14_1t")) * 100 : NaN);

/**
 * O 2º turno local por local de votação, na gaveta da cidade e do bairro. O
 * bairro é o do 1º turno (`bairro_1t`), o mesmo do mapa; local sem par no 1º
 * turno aparece na cidade e fica fora dos bairros.
 */
export function ContagemLocais({ uf, cidade, bairro, nomes }: { uf: string; cidade: string; bairro?: string; nomes: Map<string, string> }) {
  const dados = useRecurso(`${uf}/${cidade}`, carregarContagemCidade);
  const [busca, setBusca] = useState("");
  const filtro = busca.toLocaleLowerCase("pt-BR");
  const linhas = useMemo(
    () =>
      (dados.dado?.locais ?? [])
        .filter((l) => !bairro || t(l, "bairro_1t") === bairro)
        .filter((l) => `${t(l, "nome")} ${t(l, "endereco")}`.toLocaleLowerCase("pt-BR").includes(filtro)),
    [dados.dado, bairro, filtro],
  );
  const colunas: Coluna[] = useMemo(
    () => [
      { chave: "nome", rotulo: "Local de votação", tipo: "txt" },
      { chave: "nulos14_1", rotulo: "Nulos 14 · Pres.", ajuda: "Votos nulos com digitação exatamente 14 para Presidente no RDV do 2º turno." },
      { chave: "pm1", rotulo: "Por mil votos", tipo: "dec", valor: porMil, ajuda: "Nulos com 14 a cada mil votos para Presidente no 2º turno." },
      { chave: "votos14_1t", rotulo: "14 no 1º turno" },
      { chave: "eco", rotulo: "Por 100 do 1º turno", tipo: "dec", valor: por100, ajuda: `Nulos com 14 no 2º turno a cada 100 votos no 14 no 1º, no mesmo local. Só com ${PISO_1T} votos ou mais no 1º turno.` },
      { chave: "nulos14_3", rotulo: "Nulos 14 · Gov." },
      { chave: "bairro", rotulo: "Bairro", tipo: "txt", fixavel: true, valor: (l) => nomes.get(t(l, "bairro_1t")) ?? "fora dos bairros" },
      { chave: "endereco", rotulo: "Endereço", tipo: "txt" },
      { chave: "zl", rotulo: "Zona · local", tipo: "txt", valor: (l) => `${t(l, "zona")} · ${t(l, "local")}` },
      { chave: "locais_rdv", rotulo: "Locais originais no RDV", tipo: "txt", ajuda: "Só aparece quando o RDV traz outro número de local, transferido no cadastro do 2º turno." },
      { chave: "coord", rotulo: "Coordenada", tipo: "txt", valor: (l) => (typeof l.lat === "number" ? `${t(l, "lat")}, ${t(l, "lon")}` : "") },
      { chave: "secoes_lidas", rotulo: "RDVs lidos" },
    ],
    [nomes],
  );
  if (!dados.dado) return <Carregando erro={dados.erro} />;
  return (
    <>
      <p style={{ fontSize: 14, margin: "0 0 6px" }}>
        Conferência do município: <b>{t(dados.dado.cidade, "situacao")}</b> ({t(dados.dado.cidade, "secoes_lidas")} RDVs lidos).
      </p>
      <Filtros>
        <Busca rotulo="Buscar local ou endereço" valor={busca} aoMudar={setBusca} />
      </Filtros>
      <Tabela enxugar linhas={linhas} colunas={colunas} ordem="nulos14_1" arquivo={`nulos-14-2t-${uf}-${cidade}${bairro ? `-${bairro.toLowerCase()}` : ""}-locais`} />
    </>
  );
}
