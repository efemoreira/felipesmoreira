"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DADO } from "@/lib/theme";
import { carregarBairros, carregarMapa, carregarUf, n, t, temBairros, useRecurso, type Linha, type Resumo } from "../dados";
import { num, pct, titulo, UF_NOMES } from "../formato";
import { BarrasQuociente, MapaCoropletico, Ranking } from "../graficos";
import { Busca, Carregando, Chips, Escolha, Filtros, Kpis, Nota, Secao, Tabela, type Coluna } from "../pecas";

export const COLUNAS_CANDIDATO: Coluna[] = [
  { chave: "candidato_urna", rotulo: "Candidato", tipo: "txt" },
  { chave: "candidato_numero", rotulo: "Número", tipo: "txt" },
  { chave: "uf", rotulo: "UF", tipo: "txt", valor: (l) => t(l, "uf").toUpperCase() },
  { chave: "cargo_nome", rotulo: "Cargo", tipo: "txt" },
  { chave: "votos", rotulo: "Votos" },
  { chave: "pct_do_partido", rotulo: "% do partido", tipo: "pct" },
  { chave: "pct_do_qe", rotulo: "% do QE", tipo: "barra", max: 1, ajuda: "Votos nominais ÷ quociente. Mínimo para ser eleito: 10%" },
  { chave: "situacao", rotulo: "Situação", tipo: "txt" },
  { chave: "tipo_numero", rotulo: "Tipo de número", tipo: "txt" },
  { chave: "pct_voto_difuso", rotulo: "Voto difuso", tipo: "pct", ajuda: "Parte dos votos que acompanha o Renan no estado inteiro (voto pelo número ou fama estadual)" },
  { chave: "numero_parecido", rotulo: "Nº parecido", tipo: "txt" },
  { chave: "corr_numero_parecido", rotulo: "Correlação", tipo: "dec", ajuda: "1 = os dois votaram igual cidade a cidade (dobrada)" },
  { chave: "cidades_faz_vereador", rotulo: "Faria vereador em", ajuda: "Cidades onde os votos dele sozinho ≥ QE de vereador 2028" },
  { chave: "melhor_cidade_vereador", rotulo: "Melhor cidade p/ vereador", tipo: "txt" },
  { chave: "cidades_com_voto", rotulo: "Cidades com voto" },
  { chave: "melhor_cidade", rotulo: "Mais votos em", tipo: "txt" },
];

const CARGOS = ["Deputado Federal", "Deputado Estadual", "Deputado Distrital", "Senador", "Governador", "Presidente"];

export default function Candidatos({ resumo }: { resumo: Resumo }) {
  const [vista, setVista] = useState<"lista" | "numeros">("lista");
  const [cargo, setCargo] = useState("Deputado Federal");
  const [uf, setUf] = useState("todos");
  const [busca, setBusca] = useState("");
  const [chave, setChave] = useState("");

  const lista = useMemo(() => {
    const b = busca.trim().toUpperCase();
    return resumo.candidatos
      .filter((c) => c.cargo_nome === cargo && (uf === "todos" || c.uf === uf))
      .filter((c) => !b || t(c, "candidato_urna").toUpperCase().includes(b) || t(c, "candidato_numero").startsWith(b))
      .sort((a, b2) => n(b2, "votos") - n(a, "votos"));
  }, [resumo.candidatos, cargo, uf, busca]);

  const chaveDe = (c: Linha) => `${t(c, "candidato_sq")}|${t(c, "uf")}`;
  useEffect(() => {
    if (lista.length && !lista.some((c) => chaveDe(c) === chave)) setChave(chaveDe(lista[0]));
  }, [lista, chave]);
  const escolhido = lista.find((c) => chaveDe(c) === chave);
  const ufsDoCargo = ["todos", ...Array.from(new Set(resumo.candidatos.filter((c) => c.cargo_nome === cargo).map((c) => t(c, "uf")))).sort()];

  return (
    <>
      <Chips valor={vista} opcoes={["lista", "numeros"] as ("lista" | "numeros")[]} aoMudar={setVista} nome={(v) => (v === "lista" ? "Candidatos" : "O número faz diferença?")} />
      {vista === "numeros" ? (
        <Numeros resumo={resumo} />
      ) : (
        <>
          <Filtros>
            <Escolha rotulo="Cargo" valor={cargo} opcoes={CARGOS} aoMudar={setCargo} />
            <Escolha rotulo="Estado" valor={ufsDoCargo.includes(uf) ? uf : "todos"} opcoes={ufsDoCargo} aoMudar={setUf} nome={(u) => (u === "todos" ? "Todos os estados" : UF_NOMES[u])} />
            <Busca rotulo="Nome ou número" valor={busca} aoMudar={setBusca} dica="ex.: 1414 ou Kim" />
          </Filtros>
          <Tabela linhas={lista} colunas={COLUNAS_CANDIDATO} ordem="votos" />
          {escolhido && (
            <>
              <Filtros>
                <Escolha
                  rotulo="Detalhar candidato"
                  valor={chave}
                  opcoes={lista.map(chaveDe)}
                  aoMudar={setChave}
                  nome={(k) => {
                    const c = lista.find((x) => chaveDe(x) === k);
                    return `${t(c, "candidato_numero")} · ${t(c, "candidato_urna")} (${t(c, "uf").toUpperCase()}) — ${num(n(c, "votos"))} votos`;
                  }}
                />
              </Filtros>
              <Detalhe candidato={escolhido} resumo={resumo} />
            </>
          )}
        </>
      )}
    </>
  );
}

function Detalhe({ candidato: c, resumo }: { candidato: Linha; resumo: Resumo }) {
  const uf = t(c, "uf");
  const dados = useRecurso(uf, carregarUf);
  const mapa = useRecurso(uf, carregarMapa);
  const cargo = t(c, "cargo_key");

  const porCidade = useMemo(() => {
    if (!dados.dado) return [];
    const cidades = new Map(dados.dado.cidades.map((x) => [String(x.municipio_codigo), x]));
    return dados.dado.votos
      .filter((v) => v.candidato_sq === t(c, "candidato_sq"))
      .map((v) => {
        const cid = cidades.get(v.municipio_codigo);
        return {
          municipio_nome: titulo(t(cid, "municipio_nome")),
          municipio_codigo: v.municipio_codigo,
          codigo_ibge: t(cid, "codigo_ibge"),
          porte: t(cid, "porte"),
          eleitorado: n(cid, "eleitorado"),
          votos: v.votos,
          pct: v.votos / n(cid, `validos_${cargo}`),
          por_mil: (v.votos * 1000) / n(cid, "eleitorado"),
          renan: n(cid, "missao_pres"),
          aproveitamento: v.votos / n(cid, "missao_pres"),
          vagas_ver: n(cid, "vagas_ver"),
          qe_ver: n(cid, "qe_ver_2028_est"),
          qe_vereador: v.votos / n(cid, "qe_ver_2028_est"),
        } as Linha;
      });
  }, [dados.dado, c, cargo]);

  const valores = Object.fromEntries(porCidade.map((x) => [t(x, "codigo_ibge"), n(x, "pct")]));
  const rotulos = Object.fromEntries(porCidade.map((x) => [t(x, "codigo_ibge"), `${t(x, "municipio_nome")}: ${num(n(x, "votos"))} votos (${pct(n(x, "pct"), 2)})`]));
  const prop = cargo === "df" || cargo === "de";

  return (
    <>
      <Secao titulo={`${t(c, "candidato_numero")} · ${t(c, "candidato_urna")} — ${t(c, "cargo_nome")} / ${uf.toUpperCase()}`} sub={t(c, "candidato_nome")}>
        <Kpis
          itens={[
            { rotulo: "Votos", valor: num(n(c, "votos")), sub: `${pct(n(c, "pct_do_partido"))} dos votos nominais do partido`, missao: true },
            { rotulo: "% do quociente", valor: pct(n(c, "pct_do_qe")), sub: "mínimo para ser eleito: 10%", missao: true },
            { rotulo: "Cidades com voto", valor: num(n(c, "cidades_com_voto")), sub: `${t(c, "melhor_cidade")} concentra ${pct(n(c, "concentracao_melhor_cidade"))}` },
            { rotulo: "Situação", valor: t(c, "situacao") || "—" },
          ]}
        />
      </Secao>

      {prop && (
        <Secao explica="numero-candidato" titulo="O número do candidato" sub="Voto difuso = votos que aparecem no estado inteiro na mesma proporção dos votos do Renan: sinal de voto pelo número (ou de candidato conhecido no estado todo). O resto é base local.">
          <Kpis
            itens={[
              { rotulo: "Número", valor: t(c, "candidato_numero"), sub: t(c, "tipo_numero"), missao: true },
              { rotulo: "Voto difuso", valor: pct(n(c, "pct_voto_difuso")), sub: `≈ ${num(n(c, "voto_difuso"))} votos · ${num(n(c, "votos_por_100_renan"), 1)} para cada 100 do Renan`, missao: true },
              { rotulo: "Base local", valor: pct(1 - n(c, "pct_voto_difuso")), sub: `≈ ${num(n(c, "votos") - n(c, "voto_difuso"))} votos`, missao: true },
              {
                rotulo: "Número parecido no outro cargo",
                valor: t(c, "numero_parecido") ? `${t(c, "numero_parecido")} · ${t(c, "candidato_numero_parecido")}` : "—",
                sub: t(c, "numero_parecido") ? `correlação ${num(n(c, "corr_numero_parecido"), 2)} entre as cidades` : "nenhum",
                missao: true,
              },
            ]}
          />
        </Secao>
      )}

      <Secao explica="vereador-2028" titulo="Vereador em 2028 com estes votos" sub="Votos do candidato em cada cidade ÷ QE de vereador estimado. Acima de 1,00, os votos dele sozinho já fariam uma cadeira.">
        <Kpis
          itens={[
            { rotulo: "Cidades onde faria vereador", valor: num(n(c, "cidades_faz_vereador") || 0), missao: true },
            { rotulo: "Cidades perto (80% a 99%)", valor: num(n(c, "cidades_80pct_vereador") || 0), missao: true },
            { rotulo: "Melhor cidade", valor: t(c, "melhor_cidade_vereador") ? titulo(t(c, "melhor_cidade_vereador")) : "—", sub: `${num(n(c, "melhor_qe_vereador"), 2)} quociente`, missao: true },
          ]}
        />
        {dados.dado && (
          <BarrasQuociente
            textoNominal="votos do candidato na cidade"
            textoRenan="votos do Renan na cidade, como se fossem para vereador"
            linhas={[...porCidade]
              .filter((x) => n(x, "qe_ver") > 0)
              .sort((a, b) => n(b, "qe_vereador") - n(a, "qe_vereador"))
              .slice(0, 12)
              .map((x) => ({ nome: t(x, "municipio_nome"), qe: n(x, "qe_ver"), nominal: n(x, "votos"), legenda: 0, renan: n(x, "renan") }))}
          />
        )}
      </Secao>

      <Secao explica="onde-melhor" titulo="Onde foi melhor">
        {!dados.dado ? (
          <Carregando erro={dados.erro} />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
              <div>
                <p style={{ fontWeight: 700, margin: "0 0 8px" }}>Mais votos (total · %)</p>
                <Ranking
                  itens={[...porCidade]
                    .sort((a, b) => n(b, "votos") - n(a, "votos"))
                    .slice(0, 15)
                    .map((x) => ({ nome: t(x, "municipio_nome"), valor: n(x, "votos"), texto: `${num(n(x, "votos"))} · ${pct(n(x, "pct"), 2)}` }))}
                />
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: "0 0 8px" }}>Maior % dos válidos (cidades com 5 mil+ eleitores)</p>
                <Ranking
                  itens={porCidade
                    .filter((x) => n(x, "eleitorado") >= 5000)
                    .sort((a, b) => n(b, "pct") - n(a, "pct"))
                    .slice(0, 15)
                    .map((x) => ({ nome: t(x, "municipio_nome"), valor: n(x, "pct"), texto: `${pct(n(x, "pct"), 2)} · ${num(n(x, "votos"))}` }))}
                />
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <MapaCoropletico mapa={mapa.dado} valores={valores} rotulos={rotulos} />
            </div>
            <Tabela
              linhas={porCidade}
              ordem="votos"
              colunas={[
                { chave: "municipio_nome", rotulo: "Município", tipo: "txt" },
                { chave: "porte", rotulo: "Porte", tipo: "txt" },
                { chave: "eleitorado", rotulo: "Eleitorado" },
                { chave: "votos", rotulo: "Votos" },
                { chave: "pct", rotulo: "% dos válidos", tipo: "pct" },
                { chave: "por_mil", rotulo: "Votos / mil eleitores", tipo: "dec" },
                { chave: "renan", rotulo: "Renan na cidade" },
                { chave: "aproveitamento", rotulo: "Votos ÷ Renan", tipo: "barra", max: 1 },
                { chave: "vagas_ver", rotulo: "Vagas vereador" },
                { chave: "qe_ver", rotulo: "QE vereador 2028" },
                { chave: "qe_vereador", rotulo: "QE de vereador", tipo: "barra", max: 2 },
              ]}
            />
          </>
        )}
      </Secao>

      {dados.dado && <PorBairro candidato={c} cidades={porCidade.filter((x) => temBairros(resumo, uf, x))} />}
    </>
  );
}

function Numeros({ resumo }: { resumo: Resumo }) {
  const duplas = resumo.candidatos.filter((c) => c.cargo_key === "de" && t(c, "numero_parecido")).sort((a, b) => n(b, "votos") - n(a, "votos"));
  return (
    <>
      <Nota>
        Números fáceis de lembrar (que repetem o 14, redondos como 14000 ou com dígitos repetidos como 14444) recebem voto de quem quer votar no partido mas
        não conhece um candidato. A comparação usa a <b>mediana</b> de votos (o candidato do meio), para um puxador muito votado não distorcer a média.
      </Nota>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
        {Array.from(new Set(resumo.numeros.map((x) => t(x, "cargo"))))
          .sort()
          .reverse()
          .map((cargo) => (
            <Secao key={cargo} titulo={cargo} sub="Mediana de votos por tipo de número.">
              <Ranking
                cor={DADO.missao}
                itens={resumo.numeros
                  .filter((x) => x.cargo === cargo)
                  .sort((a, b) => n(b, "votos_mediana") - n(a, "votos_mediana"))
                  .map((x) => ({
                    nome: t(x, "tipo_numero"),
                    valor: n(x, "votos_mediana"),
                    texto: `${num(n(x, "votos_mediana"))} · ${num(n(x, "candidatos"))} candidatos · ${pct(n(x, "participacao_nos_votos"))} dos votos`,
                  }))}
              />
            </Secao>
          ))}
      </div>
      <Secao explica="duplas" titulo="Duplas de números parecidos" sub="Federal e estadual da mesma UF com números que conversam (1414 ↔ 14014, 1400 ↔ 14000). Correlação perto de 1 = votaram nas mesmas cidades, na mesma proporção.">
        <Tabela
          linhas={duplas}
          ordem="votos"
          colunas={[
            { chave: "uf", rotulo: "UF", tipo: "txt", valor: (l) => t(l, "uf").toUpperCase() },
            { chave: "candidato_numero", rotulo: "Nº estadual", tipo: "txt" },
            { chave: "candidato_urna", rotulo: "Candidato estadual", tipo: "txt" },
            { chave: "votos", rotulo: "Votos" },
            { chave: "numero_parecido", rotulo: "Nº federal", tipo: "txt" },
            { chave: "candidato_numero_parecido", rotulo: "Candidato federal", tipo: "txt" },
            { chave: "corr_numero_parecido", rotulo: "Correlação", tipo: "dec" },
            { chave: "pct_voto_difuso", rotulo: "Voto difuso (estadual)", tipo: "pct" },
          ]}
        />
      </Secao>
    </>
  );
}

/** A votação do candidato bairro a bairro, numa cidade escolhida (as com mais voto dele primeiro). */
function PorBairro({ candidato: c, cidades }: { candidato: Linha; cidades: Linha[] }) {
  const uf = t(c, "uf");
  const cargo = t(c, "cargo_key");
  const opcoes = useMemo(() => [...cidades].sort((a, b) => n(b, "votos") - n(a, "votos")).slice(0, 80), [cidades]);
  const [codigo, setCodigo] = useState("");
  const cod = codigo || t(opcoes[0], "municipio_codigo");
  const dados = useRecurso(cod ? `${uf}/${cod}` : null, carregarBairros);

  const linhas = useMemo(() => {
    const d = dados.dado;
    if (!d) return [];
    const ip = d.pessoas.findIndex((p) => String(p.id) === t(c, "candidato_sq"));
    const pctUf = ip >= 0 ? n(d.pessoas[ip], "pct_uf") : NaN;
    const votos = new Map(d.candidatos.filter((x) => x.p === ip && x.cargo_key === cargo).map((x) => [x.b, x.votos]));
    return d.bairros.map((b, i) => {
      const v = votos.get(i) ?? 0;
      const p = v / n(b, `validos_${cargo}`);
      return {
        bairro: t(b, "bairro"),
        eleitorado: n(b, "eleitorado"),
        votos: v,
        pct: p,
        forca: p / pctUf,
        renan: n(b, "missao_pres"),
        do_renan: v / n(b, "missao_pres"),
      } as Linha;
    });
  }, [dados.dado, c, cargo]);

  if (!opcoes.length) return null;
  return (
    <Secao titulo="Por bairro" sub="Os votos do candidato em cada bairro da cidade escolhida. Força acima de 1 = mais forte ali do que no estado." explica="candidato-bairros">
      <Escolha rotulo="Cidade" valor={cod} opcoes={opcoes.map((x) => t(x, "municipio_codigo"))} aoMudar={setCodigo} nome={(k) => {
        const x = opcoes.find((o) => t(o, "municipio_codigo") === k);
        return `${t(x, "municipio_nome")} — ${num(n(x, "votos"))} votos`;
      }} />
      {!dados.dado ? (
        <Carregando erro={dados.erro} />
      ) : (
        <Tabela
          linhas={linhas}
          ordem="votos"
          arquivo={`${t(c, "candidato_numero")}-bairros-${cod}`}
          colunas={[
            { chave: "bairro", rotulo: "Bairro", tipo: "txt" },
            { chave: "eleitorado", rotulo: "Eleitores" },
            { chave: "votos", rotulo: "Votos" },
            { chave: "pct", rotulo: "% no bairro", tipo: "pct" },
            { chave: "forca", rotulo: "Força", tipo: "dec", ajuda: "% no bairro ÷ % no estado" },
            { chave: "renan", rotulo: "Renan" },
            { chave: "do_renan", rotulo: "Votos ÷ Renan", tipo: "barra", max: 1 },
          ]}
        />
      )}
    </Secao>
  );
}
