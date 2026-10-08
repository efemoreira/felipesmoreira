"use client";
import React, { useMemo, useState } from "react";
import { FONT_DADOS, PAINEL_DADOS as P, RAIO_DADOS, fileteDados } from "@/lib/theme";
import { BlocoCadeiras, BlocoLegenda, BlocoPorDentro, BlocoRenan, BlocoVereadorLocal } from "../blocos";
import { n, t, type DadosBairros, type DadosUf, type Linha, type Resumo } from "../dados";
import { compacto, num, pct, titulo } from "../formato";
import { BarrasGrupos, BarrasQuociente } from "../graficos";
import { Chips, Kpis, Legenda, Secao, Tabela, cartao, linkBotao } from "../pecas";
import { GRUPOS, NOME_CARGO, ladoTexto, linhasGrupos, linhasTempo, linkMapa, pctDe, pontos } from "../apoio";
import { chapaVereador } from "../chapa";
import { Roteiro } from "../Roteiro";
import { COLUNAS_CANDIDATO } from "../abas/Candidatos";

/**
 * O que cada nível tinha na aba própria (Brasil, Região, Estado, Município,
 * Bairros), agora embaixo do mapa, em gavetas com título de pergunta. Nada
 * daqui foi cortado — o inventário está no plano e o `explorador.test.ts`
 * prende os "Sobre este dado" de cada bloco.
 */

/** Uma gaveta: a pergunta no título, o conteúdo fechado até alguém abrir. */
export function Gaveta({ titulo: tit, resumo, aberta = false, children }: { titulo: string; resumo?: string; aberta?: boolean; children: React.ReactNode }) {
  return (
    <details open={aberta} className="mx-gaveta" style={{ ...cartao, padding: "0 14px", margin: "10px 0 0" }}>
      <summary style={{ cursor: "pointer", minHeight: 52, display: "flex", alignItems: "center", gap: 10, fontFamily: FONT_DADOS, fontSize: 16, fontWeight: 700, color: P.tinta }}>
        <span className="mx-seta" aria-hidden="true" style={{ display: "inline-block", width: 14 }}>
          ›
        </span>
        <span style={{ flex: 1 }}>
          {tit}
          {resumo && <span style={{ display: "block", fontSize: 13, fontWeight: 400, color: P.tintaSuave }}>{resumo}</span>}
        </span>
      </summary>
      <div style={{ paddingBottom: 16 }}>{children}</div>
    </details>
  );
}

const cargoDeUf = (uf: string) => (c: string) => (uf === "df" && c === "Deputado Estadual" ? "Deputado Distrital" : c);

/* ===== Brasil e região ===== */

export function DetalheGeral({ linha, onde, exterior = false }: { linha: Linha; onde: string; exterior?: boolean }) {
  return (
    <>
      <Gaveta titulo="Quem votou?" resumo="Eleitorado, comparecimento, brancos e nulos" aberta>
        <Secao explica="participacao" titulo={`Participação — ${onde}`} sub="Brancos e nulos da eleição para Presidente.">
          <Kpis
            itens={[
              { rotulo: "Eleitorado", valor: compacto(n(linha, "eleitorado")) },
              { rotulo: "Compareceram", valor: compacto(n(linha, "comparecimento")), sub: pct(n(linha, "pct_comparecimento")) },
              { rotulo: "Não votaram", valor: compacto(n(linha, "abstencao")), sub: pct(n(linha, "pct_abstencao")) },
              { rotulo: "Brancos", valor: compacto(n(linha, "brancos_pres")), sub: `${pct(n(linha, "pct_brancos_pres"))} dos que votaram` },
              { rotulo: "Nulos", valor: compacto(n(linha, "nulos_pres")), sub: `${pct(n(linha, "pct_nulos_pres"))} dos que votaram` },
            ]}
          />
        </Secao>
      </Gaveta>

      <Gaveta titulo="Quanto o Missão teve?" resumo="Renan, deputados, legenda, eleitos e o que veio do Renan">
        <Secao explica="missao-total" titulo={`Missão — ${onde}`}>
          <Kpis
            itens={[
              { rotulo: "Renan Santos", valor: compacto(n(linha, "missao_pres")), sub: `${pct(n(linha, "pct_missao_pres"), 2)} dos válidos`, missao: true },
              { rotulo: "Deputado Federal", valor: compacto(n(linha, "missao_df")), sub: `${pct(n(linha, "pct_missao_df"), 2)} · legenda ${compacto(n(linha, "missao_leg_df"))}`, missao: true },
              { rotulo: "Deputado Estadual", valor: compacto(n(linha, "missao_de")), sub: `${pct(n(linha, "pct_missao_de"), 2)} · legenda ${compacto(n(linha, "missao_leg_de"))}`, missao: true },
              { rotulo: "Dep. federais eleitos", valor: num(n(linha, "eleitos_df") || 0), sub: "lista oficial do TSE", missao: true },
              { rotulo: "Do Renan para deputado federal", valor: pct(n(linha, "aproveitamento_df")), sub: "votos DF ÷ votos do Renan", missao: true },
            ]}
          />
        </Secao>
      </Gaveta>

      <Gaveta titulo="Quanto do Renan virou deputado?" resumo="Votos do Renan para Presidente × votos no 14 para deputado">
        <BlocoRenan linha={linha} onde={onde} />
      </Gaveta>

      {!exterior && (
        <>
          <Gaveta titulo="Quanto foi só no 14?" resumo="Voto de legenda × voto num nome">
            <BlocoLegenda linha={linha} onde={onde} />
          </Gaveta>
          <Gaveta titulo="Faria cadeira?" resumo="O que fez, o que o quociente daria, com o Renan e vereador 2028">
            <BlocoCadeiras linha={linha} onde={onde} nivel="brasil" />
          </Gaveta>
        </>
      )}
    </>
  );
}

/* ===== Estado ===== */

export function DetalheEstado({ resumo, uf, linha, onde }: { resumo: Resumo; uf: string; linha: Linha; onde: string }) {
  const cargoDe = cargoDeUf(uf);
  return (
    <>
      <Gaveta titulo="Quem votou?" resumo="Eleitorado, comparecimento, brancos e nulos (Dep. Federal)" aberta>
        <Secao explica="participacao" titulo={`Participação — ${onde}`} sub="Brancos e nulos na eleição para Deputado Federal.">
          <Kpis
            itens={[
              { rotulo: "Eleitorado", valor: num(n(linha, "eleitorado")) },
              { rotulo: "Compareceram", valor: num(n(linha, "comparecimento")), sub: pct(n(linha, "pct_comparecimento")) },
              { rotulo: "Não votaram", valor: num(n(linha, "abstencao")), sub: pct(n(linha, "pct_abstencao")) },
              { rotulo: "Brancos", valor: num(n(linha, "brancos_df")), sub: pct(n(linha, "pct_brancos_df")) },
              { rotulo: "Nulos", valor: num(n(linha, "nulos_df")), sub: pct(n(linha, "pct_nulos_df")) },
            ]}
          />
        </Secao>
      </Gaveta>

      <Gaveta titulo="Faria cadeira?" resumo="Quociente eleitoral, cadeiras em três tempos e vereador 2028">
        <Secao explica="cadeiras-qe" titulo="Quociente eleitoral" sub="QE = votos válidos ÷ vagas. O partido precisa de 80% do QE para disputar as sobras; o candidato, de 10% do QE em votos nominais para ser eleito.">
          {(["df", "de"] as const).map((c) =>
            n(linha, `qe_${c}`) > 0 ? (
              <div key={c} style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 700, margin: "10px 0 0" }}>{c === "df" ? "Deputado Federal" : cargoDe("Deputado Estadual")}</p>
                <Kpis
                  itens={[
                    { rotulo: "Vagas", valor: num(n(linha, `vagas_${c}`)) },
                    { rotulo: "Votos por cadeira (QE)", valor: num(n(linha, `qe_${c}`)) },
                    { rotulo: "Eleitores por cadeira", valor: num(n(linha, `eleitores_por_cadeira_${c}`)) },
                    { rotulo: "Missão", valor: num(n(linha, `missao_${c}`)), sub: `legenda ${num(n(linha, `missao_leg_${c}`))} (${pct(n(linha, `pct_leg_missao_${c}`))})`, missao: true },
                    { rotulo: "Quocientes atingidos", valor: num(n(linha, `qe_atingidos_${c}`), 2), sub: `${num(n(linha, `eleitos_${c}`) || 0)} eleito(s)`, missao: true },
                    { rotulo: "Faltaram p/ próxima cadeira", valor: num(n(linha, `faltam_proximo_qe_${c}`)), sub: "aprox., sem cálculo de sobras", missao: true },
                    { rotulo: "Mínimo por candidato", valor: num(n(linha, `minimo_individual_${c}`)), sub: "10% do QE", missao: true },
                  ]}
                />
              </div>
            ) : null,
          )}
        </Secao>
        <BlocoCadeiras linha={linha} onde={onde} nivel="estado" />
      </Gaveta>

      <Gaveta titulo="Quanto do Renan virou deputado?" resumo="Votos do Renan para Presidente × votos no 14 para deputado">
        <BlocoRenan linha={linha} onde={onde} distrital={uf === "df"} />
      </Gaveta>

      <Gaveta titulo="Quanto foi só no 14?" resumo="Voto de legenda × voto num nome">
        <BlocoLegenda linha={linha} onde={onde} distrital={uf === "df"} />
      </Gaveta>

      <Gaveta titulo="Quem são os nomes do Missão aqui?" resumo="Peso de cada nome, lugar entre todos e a tabela dos candidatos">
        <BlocoPorDentro
          linha={linha}
          onde={onde}
          nomes={resumo.candidatos
            .filter((c) => c.uf === uf && ["df", "de"].includes(t(c, "cargo_key")))
            .map((c) => ({ nome: t(c, "candidato_urna"), cargo_key: t(c, "cargo_key"), votos: n(c, "votos"), posicao: n(c, "posicao_uf"), total: n(c, "total_uf") }))}
        />
        <Secao explica="candidatos-missao" titulo={`Candidatos do Missão — ${onde}`}>
          <Tabela linhas={resumo.candidatos.filter((c) => c.uf === uf)} colunas={COLUNAS_CANDIDATO} ordem="votos" />
        </Secao>
      </Gaveta>

      <Gaveta titulo="Como os votos se dividiram, cargo a cargo?" resumo="Missão, direita, centro e esquerda nos cinco cargos">
        <Secao explica="divisao-validos" titulo="Como os votos válidos se dividiram">
          <Legenda itens={GRUPOS.slice(0, 4).map(([, nome, cor]) => [cor, nome])} />
          <BarrasGrupos linhas={linhasGrupos(linha, cargoDe)} />
        </Secao>
      </Gaveta>
    </>
  );
}

/* ===== Cidade ===== */

export function DetalheCidade({
  resumo,
  uf,
  estado,
  cidade,
  dadosUf,
  bairros,
}: {
  resumo: Resumo;
  uf: string;
  estado: Linha;
  cidade: Linha;
  dadosUf: DadosUf;
  /** a cidade tem recorte por bairro */
  bairros: DadosBairros | null;
}) {
  const codigo = String(cidade.municipio_codigo);
  const nome = titulo(t(cidade, "municipio_nome"));
  const chapa = chapaVereador(n(cidade, "vagas_ver"));
  const cargoDe = cargoDeUf(uf);

  const candidatosNaCidade = useMemo(() => {
    const porSq = new Map(resumo.candidatos.filter((c) => c.uf === uf).map((c) => [String(c.candidato_sq), c]));
    return dadosUf.votos
      .filter((v) => v.municipio_codigo === codigo)
      .map((v) => {
        const c = porSq.get(v.candidato_sq);
        const cargo = t(c, "cargo_key");
        return {
          cargo_nome: t(c, "cargo_nome"),
          candidato_numero: t(c, "candidato_numero"),
          candidato_urna: t(c, "candidato_urna"),
          votos: v.votos,
          pct: v.votos / n(cidade, `validos_${cargo}`),
          por_mil: (v.votos * 1000) / n(cidade, "eleitorado"),
          renan: v.votos / n(cidade, "missao_pres"),
        } as Linha;
      });
  }, [dadosUf.votos, cidade, codigo, resumo.candidatos, uf]);

  const vs = (c: string) => (
    <>
      {pct(pctDe(cidade, `pct_missao_${c}`), 2)} na cidade
      {c !== "pres" && <> · legenda {num(n(cidade, `missao_leg_${c}`))}</>}
      <br />
      {uf.toUpperCase()}: {num(n(estado, `missao_${c}`))} ({pct(n(estado, `pct_missao_${c}`), 2)})
    </>
  );

  return (
    <>
      <Gaveta titulo="Quem votou?" resumo="Eleitorado, comparecimento, brancos e nulos, com o estado ao lado" aberta>
        <Secao explica="participacao" titulo={`${nome} — ${uf.toUpperCase()}`} sub={`Porte: ${t(cidade, "porte")} · ${pct(n(cidade, "eleitorado") / n(estado, "eleitorado"))} do eleitorado do estado`}>
          <Kpis
            itens={[
              { rotulo: "Eleitorado", valor: num(n(cidade, "eleitorado")) },
              { rotulo: "Compareceram", valor: num(n(cidade, "comparecimento")), sub: `${pct(n(cidade, "pct_comparecimento"))} (estado ${pct(n(estado, "pct_comparecimento"))})` },
              { rotulo: "Não votaram", valor: num(n(cidade, "abstencao")), sub: pct(n(cidade, "pct_abstencao")) },
              { rotulo: "Brancos (Presidente)", valor: num(n(cidade, "brancos_pres")), sub: pct(n(cidade, "pct_brancos_pres")) },
              { rotulo: "Nulos (Presidente)", valor: num(n(cidade, "nulos_pres")), sub: pct(n(cidade, "pct_nulos_pres")) },
            ]}
          />
        </Secao>
      </Gaveta>

      <Gaveta titulo="Quanto o Missão teve aqui?" resumo="Renan, deputados, conversão e força, com o total do estado">
        <Secao explica="missao-total" titulo={`Missão em ${nome}`} sub="Números da cidade; embaixo de cada um, o total do estado para comparar.">
          <Kpis
            itens={[
              { rotulo: "Renan na cidade", valor: num(n(cidade, "missao_pres")), sub: vs("pres"), missao: true },
              { rotulo: "Dep. Federal na cidade", valor: num(n(cidade, "missao_df")), sub: vs("df"), missao: true },
              { rotulo: "Dep. Estadual na cidade", valor: num(n(cidade, "missao_de")), sub: vs("de"), missao: true },
              { rotulo: "Do Renan para deputado federal", valor: pct(n(cidade, "aproveitamento_df")), sub: `${num(n(cidade, "renan_nao_convertido_df"))} não convertidos`, missao: true },
              { rotulo: "Índice de força (DF)", valor: num(n(cidade, "indice_forca_df"), 2), sub: "1,00 = média do estado", missao: true },
            ]}
          />
        </Secao>
        <BlocoRenan linha={cidade} onde={nome} distrital={uf === "df"} />
        <BlocoLegenda linha={cidade} onde={nome} distrital={uf === "df"} />
      </Gaveta>

      <Gaveta titulo="Quem são os nomes do Missão aqui?" resumo="Peso de cada nome, lugar entre todos e votos por candidato">
        <BlocoPorDentro
          linha={cidade}
          onde={nome}
          nomes={dadosUf.votos
            .filter((v) => v.municipio_codigo === codigo)
            .flatMap((v) => {
              const c = resumo.candidatos.find((x) => String(x.candidato_sq) === v.candidato_sq);
              const cargo = t(c, "cargo_key");
              return ["df", "de"].includes(cargo) ? [{ nome: t(c, "candidato_urna"), cargo_key: cargo, votos: v.votos, posicao: v.posicao ?? NaN, total: v.total_cand ?? NaN }] : [];
            })}
        />
        <Secao explica="candidatos-missao" titulo="Candidatos do Missão na cidade">
          <Tabela
            linhas={candidatosNaCidade}
            ordem="votos"
            colunas={[
              { chave: "candidato_urna", rotulo: "Candidato", tipo: "txt" },
              { chave: "candidato_numero", rotulo: "Número", tipo: "txt" },
              { chave: "cargo_nome", rotulo: "Cargo", tipo: "txt" },
              { chave: "votos", rotulo: "Votos" },
              { chave: "pct", rotulo: "% dos válidos", tipo: "pct" },
              { chave: "por_mil", rotulo: "Votos / mil eleitores", tipo: "dec" },
              { chave: "renan", rotulo: "Votos ÷ Renan", tipo: "barra", max: 1 },
            ]}
          />
        </Secao>
      </Gaveta>

      {(chapa.candidaturas > 0 || n(cidade, "qe_ver_2028_est") > 0) && (
        <Gaveta titulo="Vereador em 2028" resumo="Chapa que dá para registrar, quociente estimado e se os votos de 2026 já fariam cadeira">
          {chapa.candidaturas > 0 && (
            <Secao explica="chapa-vereador" titulo="Chapa de vereador em 2028" sub="O que cada partido pode registrar na cidade, pelas vagas de 2024.">
              <Kpis
                itens={[
                  { rotulo: "Vagas na Câmara", valor: num(n(cidade, "vagas_ver")) },
                  { rotulo: "Candidaturas por partido", valor: num(chapa.candidaturas), sub: "vagas + 1" },
                  { rotulo: "Mínimo de mulheres", valor: num(chapa.mulheres), sub: `30% de ${num(chapa.candidaturas)}, arredondado para cima`, missao: true },
                ]}
              />
            </Secao>
          )}
          {n(cidade, "qe_ver_2028_est") > 0 && (
            <Secao explica="vereador-2028" titulo="Vereador" sub="Vagas e quociente da eleição de 2024; o QE de 2028 é estimado pela variação do comparecimento até 2026.">
              <Kpis
                itens={[
                  { rotulo: "Cadeiras de vereador", valor: num(n(cidade, "vagas_ver")) },
                  { rotulo: "Votos por cadeira 2024", valor: num(n(cidade, "qe_ver_2024")) },
                  { rotulo: "QE estimado 2028", valor: num(n(cidade, "qe_ver_2028_est")) },
                  { rotulo: "Vereadores que já faria", valor: num(n(cidade, "ver28_missao") || 0), sub: `${num(n(cidade, "qe_atingidos_ver"), 2)} QE · faltam ${num(n(cidade, "faltam_proximo_qe_ver"))} p/ a próxima`, missao: true },
                  { rotulo: "Eleitores por vereador", valor: num(n(cidade, "eleitores_por_vereador")) },
                  {
                    rotulo: "Votos do Renan fariam vereador?",
                    valor: `${t(cidade, "renan_faz_vereador")}${n(cidade, "renan_vereadores") >= 1 ? ` · ${num(n(cidade, "renan_vereadores"))} cadeira(s)` : ""}`,
                    sub: `${num(n(cidade, "missao_pres"))} votos = ${num(n(cidade, "renan_em_qe_ver"), 2)} QE`,
                    missao: true,
                  },
                  { rotulo: "Situação do Missão", valor: t(cidade, "situacao_vereador"), sub: `melhor votação de deputado: ${num(n(cidade, "missao_melhor_prop"))}`, missao: true },
                ]}
              />
              <p style={{ fontSize: 14, margin: "12px 0 6px" }}>Se fosse eleição de vereador, com os votos de 2026 na cidade:</p>
              <BarrasQuociente
                textoRenan="votos do Renan como se fossem para vereador"
                linhas={[
                  { nome: "Votos p/ Dep. Federal", qe: n(cidade, "qe_ver_2028_est"), nominal: n(cidade, "missao_nom_df") || 0, legenda: n(cidade, "missao_leg_df") || 0, renan: n(cidade, "missao_pres") },
                  { nome: "Votos p/ Dep. Estadual", qe: n(cidade, "qe_ver_2028_est"), nominal: n(cidade, "missao_nom_de") || 0, legenda: n(cidade, "missao_leg_de") || 0 },
                ]}
              />
            </Secao>
          )}
        </Gaveta>
      )}

      <Gaveta titulo="Como os votos se dividiram, cargo a cargo?" resumo="Missão, direita, centro e esquerda nos cinco cargos">
        <Secao explica="divisao-validos" titulo="Como os votos válidos se dividiram">
          <Legenda itens={GRUPOS.slice(0, 4).map(([, nomeG, cor]) => [cor, nomeG])} />
          <BarrasGrupos linhas={linhasGrupos(cidade, cargoDe)} />
        </Secao>
      </Gaveta>

      {bairros && <PorBairro uf={uf} nomeCidade={nome} dados={bairros} />}
    </>
  );
}

/** "Pende para" da cidade inteira, pela soma dos bairros (a mesma fórmula do export). */
function cidadeLado(bairros: Linha[], suf = ""): number {
  const s = (c: string) => bairros.reduce((a, b) => a + (n(b, c) || 0), 0);
  const v = s(`validos_pres${suf}`);
  return v ? (s(`missao_pres${suf}`) + s(`direita_pres${suf}`) - s(`esquerda_pres${suf}`)) / v : NaN;
}

function PorBairro({ uf, nomeCidade, dados }: { uf: string; nomeCidade: string; dados: DadosBairros }) {
  const { bairros, locais } = dados;
  const total = (c: string) => bairros.reduce((s, b) => s + (n(b, c) || 0), 0);
  const eleitores = total("eleitorado");
  const deIbge = bairros.filter((b) => ["ibge", "ibge-nome", "distrito"].includes(String(b.bairro_origem))).reduce((s, b) => s + (n(b, "eleitorado") || 0), 0);
  const maisDireita = [...bairros].filter((b) => n(b, "eleitorado") >= 1000).sort((a, b) => n(b, "lado_pres") - n(a, "lado_pres"))[0];
  const maiorOport = [...bairros].sort((a, b) => n(b, "oportunidade") - n(a, "oportunidade"))[0];
  const nomeBairro = (l: Linha) => t(bairros[n(l, "b")], "bairro") || "—";
  return (
    <>
      <Gaveta titulo="E por bairro?" resumo={`${num(bairros.length)} bairros e distritos · ${num(locais.length)} locais de votação`}>
        <Secao titulo={`${nomeCidade} por bairro`} sub="Toque num bairro no mapa (ou na tabela de baixo) para abrir a ficha dele." explica="bairro-origem">
          <Kpis
            itens={[
              { rotulo: "Eleitores", valor: num(eleitores), sub: `${pct(deIbge / eleitores)} em bairro ou distrito oficial do IBGE` },
              { rotulo: "Pende para (cidade)", valor: ladoTexto(cidadeLado(bairros)), sub: `${pontos(cidadeLado(bairros))} · 2022: ${pontos(cidadeLado(bairros, "_22"))}` },
              ...(maisDireita ? [{ rotulo: "Mais à direita", valor: t(maisDireita, "bairro"), sub: `${pontos(n(maisDireita, "lado_rel_pres"))} em relação ao estado` }] : []),
              ...(maiorOport ? [{ rotulo: "Maior oportunidade", valor: t(maiorOport, "bairro"), sub: `${num(n(maiorOport, "oportunidade"))} votos`, missao: true }] : []),
              { rotulo: "Renan na cidade", valor: num(total("missao_pres")), sub: pct(total("missao_pres") / total("validos_pres"), 2), missao: true },
            ]}
          />
        </Secao>
      </Gaveta>
      <Gaveta titulo="Roteiro de rua" resumo={`Os locais de ${nomeCidade} com mais oportunidade, para imprimir`}>
        <Secao titulo="Roteiro de rua" sub={`Os locais de ${nomeCidade} com mais oportunidade.`} explica="roteiro">
          <Roteiro locais={locais} nomeBairro={nomeBairro} titulo={`Roteiro de rua — ${nomeCidade}/${uf.toUpperCase()}`} />
        </Secao>
      </Gaveta>
    </>
  );
}

/* ===== Bairro ===== */

export function DetalheBairro({ uf, nomeCidade, bairro, dados }: { uf: string; nomeCidade: string; bairro: Linha; dados: DadosBairros }) {
  const [cargo, setCargo] = useState("df");
  const idx = dados.bairros.indexOf(bairro);
  const nome = t(bairro, "bairro");
  const locaisDoBairro = dados.locais.filter((l) => n(l, "b") === idx);
  const nomeBairro = (l: Linha) => t(dados.bairros[n(l, "b")], "bairro") || "—";
  const cand = dados.candidatos
    .filter((c) => c.b === idx && c.cargo_key === cargo)
    .map((c) => {
      const p = dados.pessoas[c.p] ?? {};
      const pctB = c.votos / n(bairro, `validos_${cargo}`);
      return {
        nome: t(p, "nome"),
        numero: t(p, "numero"),
        partido: t(p, "partido_sigla"),
        grupo: t(p, "grupo_atual"),
        votos: c.votos,
        pct: pctB,
        forca: pctB / n(p, "pct_uf"),
        situacao: t(p, "situacao"),
        status: t(p, "status"),
      } as Linha;
    });
  const quedas = dados.quedas
    .filter((q) => q.b === idx)
    .map((q) => {
      const p = dados.pessoas[q.p] ?? {};
      return { nome: t(p, "nome"), partido: t(p, "partido_sigla"), grupo: t(p, "grupo_atual"), cargo: NOME_CARGO[t(p, "cargo_key")] ?? "", votos_22: q.votos_22, votos: q.votos, perda: q.perda } as Linha;
    });
  const cargos = ["df", "de", "gov", "sen", "pres"].filter((c) => dados.candidatos.some((x) => x.b === idx && x.cargo_key === c));

  return (
    <>
      <Gaveta titulo="Como é o bairro?" resumo="Eleitores, comparecimento, para que lado pende, Missão e oportunidade" aberta>
        <Kpis
          itens={[
            { rotulo: "Eleitores", valor: num(n(bairro, "eleitorado")), sub: `${num(n(bairro, "locais"))} locais · distrito ${t(bairro, "distrito") || "—"}` },
            { rotulo: "Compareceu", valor: pct(n(bairro, "comparecimento") / n(bairro, "eleitorado")), sub: `${num(n(bairro, "eleitorado") - n(bairro, "comparecimento"))} não votaram` },
            { rotulo: "Pende para", valor: ladoTexto(n(bairro, "lado_pres")), sub: `${pontos(n(bairro, "lado_pres"))} · 2022: ${pontos(n(bairro, "lado_pres_22"))} · ${ladoTexto(n(bairro, "lado_rel_pres"), true).toLowerCase()}` },
            { rotulo: "Renan", valor: num(n(bairro, "missao_pres")), sub: pct(n(bairro, "missao_pres") / n(bairro, "validos_pres"), 2), missao: true },
            { rotulo: "Missão Dep. Federal", valor: num(n(bairro, "missao_df")), sub: `do Renan ${pct(n(bairro, "aproveitamento_df"))} · força ${num(n(bairro, "indice_forca_df"), 2)}`, missao: true },
            { rotulo: "Oportunidade", valor: num(n(bairro, "oportunidade")), sub: `${pct(n(bairro, "oportunidade") / n(bairro, "eleitorado"), 0)} do eleitorado`, missao: true },
            { rotulo: "Vereador 2028", valor: `${num(n(bairro, "missao_em_qe_ver"), 2)} QE`, sub: `o Renan daqui = ${num(n(bairro, "renan_em_qe_ver"), 2)} QE de vereador`, missao: true },
          ]}
        />
      </Gaveta>

      <Gaveta titulo="Quanto do Renan virou deputado?" resumo="Renan × chapas, legenda e vereador 2028">
        <BlocoRenan linha={bairro} onde={nome} distrital={uf === "df"} />
        <BlocoLegenda linha={bairro} onde={nome} distrital={uf === "df"} />
        <BlocoVereadorLocal linha={bairro} onde={nome} />
      </Gaveta>

      <Gaveta titulo="Quem são os nomes do Missão aqui?" resumo="Peso de cada nome e lugar entre todos">
        <BlocoPorDentro
          linha={bairro}
          onde={nome}
          nomes={dados.candidatos
            .filter((c) => c.b === idx && ["df", "de"].includes(c.cargo_key) && t(dados.pessoas[c.p], "grupo_atual") === "Missão")
            .map((c) => ({ nome: t(dados.pessoas[c.p], "nome"), cargo_key: c.cargo_key, votos: c.votos, posicao: c.posicao ?? NaN, total: n(bairro, `total_cand_${c.cargo_key}`) }))}
        />
      </Gaveta>

      <Gaveta titulo="Como o bairro mudou desde 2022?" resumo="Os grupos em 2022, 2024 e 2026">
        <Secao titulo="Como o bairro votou: 2022, 2024 e 2026" explica="bairro-tempo">
          <Legenda itens={GRUPOS.slice(0, 4).map(([, nomeG, cor]) => [cor, nomeG])} />
          <BarrasGrupos linhas={linhasTempo(bairro)} />
        </Secao>
      </Gaveta>

      <Gaveta titulo="Quem tem voto aqui?" resumo="Os mais votados de cada cargo, com a força no bairro">
        <Secao titulo="Candidatos no bairro" sub="Os mais votados de cada cargo. Força acima de 1 = mais forte aqui do que no estado." explica="bairro-candidatos">
          <Chips valor={cargo} opcoes={cargos} aoMudar={setCargo} nome={(c) => NOME_CARGO[c] ?? c} />
          <Tabela
            linhas={cand}
            ordem="votos"
            colunas={[
              { chave: "nome", rotulo: "Candidato", tipo: "txt" },
              { chave: "numero", rotulo: "Nº", tipo: "txt" },
              { chave: "partido", rotulo: "Partido", tipo: "txt" },
              { chave: "grupo", rotulo: "Grupo", tipo: "txt" },
              { chave: "votos", rotulo: "Votos" },
              { chave: "pct", rotulo: "% no bairro", tipo: "pct" },
              { chave: "forca", rotulo: "Força", tipo: "dec", ajuda: "% no bairro ÷ % no estado" },
              { chave: "situacao", rotulo: "Situação", tipo: "txt" },
              { chave: "status", rotulo: "22 → 26", tipo: "txt" },
            ]}
          />
        </Secao>
      </Gaveta>

      {quedas.length > 0 && (
        <Gaveta titulo="Que voto está solto aqui?" resumo="Quem perdeu voto no bairro desde 2022">
          <Secao titulo="Quem perdeu voto aqui desde 2022" sub="Mesmo cargo em 2022 e 2026. O voto que eles perderam no bairro está solto." explica="em-queda">
            <Tabela
              linhas={quedas}
              ordem="perda"
              colunas={[
                { chave: "nome", rotulo: "Candidato", tipo: "txt" },
                { chave: "partido", rotulo: "Partido 2026", tipo: "txt" },
                { chave: "grupo", rotulo: "Grupo", tipo: "txt" },
                { chave: "cargo", rotulo: "Cargo", tipo: "txt" },
                { chave: "votos_22", rotulo: "Votos 2022" },
                { chave: "votos", rotulo: "Votos 2026" },
                { chave: "perda", rotulo: "Perdeu" },
              ]}
            />
          </Secao>
        </Gaveta>
      )}

      <Gaveta titulo="Onde se vota aqui?" resumo={`${num(locaisDoBairro.length)} locais de votação, com endereço e mapa`}>
        <Secao titulo="Locais de votação do bairro" explica="locais">
          <div style={{ display: "grid", gap: 10 }}>
            {locaisDoBairro.map((l) => (
              <div key={`${t(l, "zona")}-${t(l, "local")}`} style={{ background: P.fundo, border: fileteDados(), borderRadius: RAIO_DADOS, padding: "10px 12px", fontSize: 14, lineHeight: 1.45 }}>
                <b>{t(l, "nome")}</b> · zona {t(l, "zona")}
                <br />
                {t(l, "endereco")}
                {t(l, "bairro_tse") && <span style={{ color: P.tintaSuave }}> · o cartório chama o bairro de “{titulo(t(l, "bairro_tse"))}”</span>}
                <br />
                {num(n(l, "eleitorado"))} eleitores · {num(n(l, "secoes"))} seções · Renan {pct(n(l, "missao_pres") / n(l, "validos_pres"))} · Missão DF {num(n(l, "missao_df"))} ·{" "}
                {ladoTexto(n(l, "lado_pres")).toLowerCase()} · oportunidade {compacto(n(l, "oportunidade"))}
                {linkMapa(l) && (
                  <>
                    {" · "}
                    <a href={linkMapa(l)} target="_blank" rel="noopener noreferrer" style={{ ...linkBotao, display: "inline-block" }}>
                      abrir no mapa
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: P.tintaSuave, margin: "8px 0 0" }}>{uf.toUpperCase()} · endereço do cadastro do TSE de 2026.</p>
        </Secao>
      </Gaveta>

      <Gaveta titulo="Roteiro de rua" resumo={`Os locais de ${nome}, para imprimir`}>
        <Secao titulo="Roteiro de rua" sub={`Locais de ${nome}.`} explica="roteiro">
          <Roteiro locais={locaisDoBairro} nomeBairro={nomeBairro} titulo={`Roteiro de rua — ${nome}, ${nomeCidade}/${uf.toUpperCase()}`} />
        </Secao>
      </Gaveta>
    </>
  );
}
