"use client";
import React from "react";
import { n, type Linha } from "./dados";
import { num, pct } from "./formato";
import { BarrasQuociente } from "./graficos";
import { Kpis, Secao, Tabela } from "./pecas";

/**
 * Os três blocos que se repetem em cada nível (Brasil, estado, município,
 * bairro), para o mesmo número estar no mesmo lugar em todo recorte:
 * votos do Renan para as chapas, voto de legenda e cadeiras.
 */

type Cargo = "df" | "de";
const NOME: Record<Cargo, string> = { df: "Dep. Federal", de: "Dep. Estadual" };

/** Votos do Renan para Presidente × votos do Missão para cada chapa. */
export function BlocoRenan({ linha, onde, distrital = false }: { linha: Linha; onde: string; distrital?: boolean }) {
  const renan = n(linha, "missao_pres");
  const nome = (c: Cargo) => (c === "de" && distrital ? "Dep. Distrital" : NOME[c]);
  return (
    <Secao titulo={`Votos do Renan para as chapas — ${onde}`} sub="Quanto do voto do Renan para Presidente virou voto no 14 para deputado (nominal + legenda)." explica="conversao">
      <Kpis
        itens={[
          { rotulo: "Renan Santos", valor: num(renan), sub: `${pct(renan / n(linha, "validos_pres"), 2)} dos válidos`, missao: true },
          ...(["df", "de"] as Cargo[]).map((c) => ({
            rotulo: `Chapa ${nome(c)}`,
            valor: num(n(linha, `missao_${c}`) || 0),
            sub: `${pct((n(linha, `missao_${c}`) || 0) / renan)} do Renan · ${num(Math.max(0, renan - (n(linha, `missao_${c}`) || 0)))} não vieram`,
            missao: true,
          })),
        ]}
      />
    </Secao>
  );
}

/** Nominal × legenda (só o 14) em cada chapa. */
export function BlocoLegenda({ linha, onde, distrital = false }: { linha: Linha; onde: string; distrital?: boolean }) {
  const nome = (c: Cargo) => (c === "de" && distrital ? "Dep. Distrital" : NOME[c]);
  return (
    <Secao titulo={`Voto de legenda — ${onde}`} sub="Legenda é quem digitou só o 14. Conta para o quociente, mas não escolhe quem assume." explica="legenda">
      <Kpis
        itens={(["df", "de"] as Cargo[]).flatMap((c) => {
          const tot = n(linha, `missao_${c}`) || 0;
          const leg = n(linha, `missao_leg_${c}`) || 0;
          if (!tot) return [{ rotulo: `${nome(c)}`, valor: "—", sub: "sem voto do Missão" }];
          return [
            { rotulo: `${nome(c)}: nominal`, valor: num(n(linha, `missao_nom_${c}`) || tot - leg), sub: "voto no número de um candidato" },
            { rotulo: `${nome(c)}: legenda`, valor: num(leg), sub: `${pct(leg / tot)} do voto do Missão`, missao: true },
          ];
        })}
      />
    </Secao>
  );
}

/**
 * Cadeiras em três tempos. Brasil e estado: o que fez, o que o quociente daria,
 * o que daria com os votos do Renan e, para 2028, quantos vereadores os votos
 * de 2026 já fariam. `nivel` muda só o texto e as colunas que existem.
 */
export function BlocoCadeiras({ linha, onde, nivel }: { linha: Linha; onde: string; nivel: "brasil" | "estado" }) {
  const cargos = (["df", "de"] as Cargo[]).filter((c) => nivel === "brasil" || n(linha, `qe_${c}`) > 0);
  return (
    <Secao
      titulo={`Cadeiras — ${onde}`}
      sub="Fez = eleitos (lista oficial do TSE). Pelo quociente = votos do Missão ÷ QE, sem as sobras. Com o Renan = se todo voto dele tivesse ido para o 14. Vereador 2028 = os votos de 2026 de cada cidade contra o QE de vereador estimado."
      explica="cadeiras-tres"
    >
      <Kpis
        itens={cargos.flatMap((c) => [
          { rotulo: `${NOME[c]}: fez`, valor: num(n(linha, `eleitos_${c}`) || 0), missao: true },
          {
            rotulo: `${NOME[c]}: pelo quociente`,
            valor: num(n(linha, `cadeiras_qe_${c}`) || 0),
            sub: nivel === "estado" ? `${num(n(linha, `qe_atingidos_${c}`), 2)} QE · faltaram ${num(n(linha, `faltam_proximo_qe_${c}`))} votos` : "soma dos estados",
          },
          { rotulo: `${NOME[c]}: com o Renan`, valor: num(n(linha, `cadeiras_renan_${c}`) || 0), sub: nivel === "estado" ? `Renan = ${num(n(linha, "renan_em_qe_" + c), 2)} QE` : "soma dos estados" },
        ])}
      />
      <Kpis
        itens={[
          { rotulo: "Vereador 2028: já faria", valor: num(n(linha, "ver28_missao") || 0), sub: `em ${num(n(linha, "cidades_ver28_missao") || 0)} cidades, com o voto do Missão p/ deputado`, missao: true },
          { rotulo: "Vereador 2028: perto", valor: num(n(linha, "cidades_ver28_perto") || 0), sub: "cidades entre 80% e 100% do QE" },
          { rotulo: "Vereador 2028: com o Renan", valor: num(n(linha, "ver28_renan") || 0), sub: `em ${num(n(linha, "cidades_ver28_renan") || 0)} cidades` },
          { rotulo: "Cadeiras de vereador", valor: num(n(linha, "vagas_ver_total") || 0), sub: "no total, pela eleição de 2024" },
        ]}
      />
      {nivel === "estado" && (
        <BarrasQuociente
          textoRenan="votos do Renan no estado"
          linhas={cargos.map((c) => ({ nome: NOME[c], qe: n(linha, `qe_${c}`), nominal: n(linha, `missao_nom_${c}`) || 0, legenda: n(linha, `missao_leg_${c}`) || 0, renan: n(linha, "missao_pres") }))}
        />
      )}
    </Secao>
  );
}

/** Cadeira de vereador num lugar menor que a cidade (bairro): em fração do QE da cidade. */
export function BlocoVereadorLocal({ linha, onde }: { linha: Linha; onde: string }) {
  return (
    <Secao titulo={`Vereador 2028 — ${onde}`} sub="Os votos daqui contra o QE de vereador estimado para a cidade. 1,00 QE = uma cadeira só com os votos deste lugar." explica="vereador-2028">
      <Kpis
        itens={[
          { rotulo: "Missão (melhor chapa)", valor: `${num(n(linha, "missao_em_qe_ver"), 2)} QE`, missao: true },
          { rotulo: "Renan", valor: `${num(n(linha, "renan_em_qe_ver"), 2)} QE`, sub: "se todo voto dele fosse para o 14" },
        ]}
      />
    </Secao>
  );
}

/** Um candidato do Missão num recorte, já com o lugar dele entre todos (do export). */
export type NomePorDentro = { nome: string; cargo_key: string; votos: number; posicao: number; total: number };

/**
 * Por dentro do voto do Missão no recorte: quanto cada nome pesa no voto do
 * partido ali, quanto dos válidos ele fez e em que lugar ficou entre TODOS os
 * candidatos do cargo. Para um partido novo, longe do quociente, é aqui que se
 * vê quem rendeu e quem ficou para trás.
 */
export function BlocoPorDentro({ linha, nomes, onde }: { linha: Linha; nomes: NomePorDentro[]; onde: string }) {
  const totalMissao = (c: string) => (n(linha, `missao_${c}`) || 0) || (n(linha, `missao_nom_${c}`) || 0) + (n(linha, `missao_leg_${c}`) || 0);
  const linhas: Linha[] = [
    ...nomes.map((x) => ({
      nome: x.nome,
      cargo: NOME[x.cargo_key as Cargo] ?? x.cargo_key,
      votos: x.votos,
      pct_missao: x.votos / totalMissao(x.cargo_key),
      pct_validos: x.votos / n(linha, `validos_${x.cargo_key}`),
      posicao: Number.isFinite(x.posicao) && x.posicao > 0 ? `${num(x.posicao)}º de ${num(x.total)}` : "—",
      ordem: x.posicao,
    })),
    ...(["df", "de"] as Cargo[])
      .filter((c) => (n(linha, `missao_leg_${c}`) || 0) > 0)
      .map((c) => ({
        nome: "Só legenda (14)",
        cargo: NOME[c],
        votos: n(linha, `missao_leg_${c}`),
        pct_missao: n(linha, `missao_leg_${c}`) / totalMissao(c),
        pct_validos: n(linha, `missao_leg_${c}`) / n(linha, `validos_${c}`),
        posicao: "—",
        ordem: Infinity,
      })),
  ];
  if (!linhas.length) return null;
  const melhor = [...nomes].filter((x) => x.posicao > 0).sort((a, b) => a.posicao / a.total - b.posicao / b.total)[0];
  return (
    <Secao titulo={`Por dentro do Missão — ${onde}`} sub="Quanto cada nome pesa no voto do partido aqui, quanto dos válidos fez e em que lugar ficou entre todos os candidatos do cargo." explica="por-dentro">
      {melhor && (
        <Kpis
          itens={[
            { rotulo: "Melhor colocado", valor: melhor.nome, sub: `${num(melhor.posicao)}º de ${num(melhor.total)} em ${NOME[melhor.cargo_key as Cargo] ?? melhor.cargo_key}`, missao: true },
            { rotulo: "Nomes com voto", valor: num(nomes.length) },
          ]}
        />
      )}
      <Tabela
        linhas={linhas}
        ordem="votos"
        colunas={[
          { chave: "nome", rotulo: "Candidato", tipo: "txt" },
          { chave: "cargo", rotulo: "Cargo", tipo: "txt" },
          { chave: "votos", rotulo: "Votos" },
          { chave: "pct_missao", rotulo: "% do Missão aqui", tipo: "barra", max: 1 },
          { chave: "pct_validos", rotulo: "% dos válidos", tipo: "pct" },
          { chave: "posicao", rotulo: "Lugar entre todos", tipo: "txt", valor: (l) => String(l.posicao) },
        ]}
      />
    </Secao>
  );
}
