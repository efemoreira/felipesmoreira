"use client";
import React, { useMemo, useState } from "react";
import { C, DADO, FONT_ELITE, borda, bordaFina } from "@/lib/theme";
import { num, pct, qe as fmtQe } from "./formato";
import type { Mapa, MapaBairros as DadosMapaBairros } from "./dados";

/**
 * Gráficos de /resultados — HTML e SVG puros, sem biblioteca: o site é estático
 * e cada dependência é uma que alguém audita antes de um deploy de campanha.
 *
 * Regras que valem para todos (e que o projeto de análise já seguia):
 * - todo valor tem rótulo escrito; a cor nunca é a única forma de saber o que é;
 * - percentual vem com o total ao lado;
 * - toque/hover mostra o detalhe (title nativo + caixa de informação nos mapas).
 */

const rotulo: React.CSSProperties = { fontSize: 13, color: C.ink, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

/* ===== Barras 100% empilhadas: como os válidos se dividiram ===== */

export type Fatia = { nome: string; cor: string; valor: number };
export type LinhaGrupos = { rotulo: string; destaque?: string; fatias: Fatia[] };

export function BarrasGrupos({ linhas }: { linhas: LinhaGrupos[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {linhas.map((l) => {
        const total = l.fatias.reduce((s, f) => s + (f.valor || 0), 0);
        return (
          <div key={l.rotulo} style={{ display: "grid", gridTemplateColumns: "minmax(96px, 150px) 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.25, color: C.ink }}>
              {l.rotulo}
              {l.destaque && <div style={{ fontWeight: 700, color: DADO.missao }}>{l.destaque}</div>}
            </div>
            <div style={{ display: "flex", height: 30, border: borda(C.ink), background: C.cream }}>
              {l.fatias.map((f) => {
                const p = total ? (f.valor || 0) / total : 0;
                if (p <= 0) return null;
                return (
                  <div
                    key={f.nome}
                    title={`${f.nome} · ${l.rotulo}: ${num(f.valor)} votos (${pct(p, 2)})`}
                    style={{
                      width: `${p * 100}%`,
                      background: f.cor,
                      borderRight: `1px solid ${C.cream}`,
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                      fontSize: 12,
                      fontWeight: 600,
                      color: f.cor === DADO.missao || f.cor === DADO.renan ? C.cream : C.ink,
                    }}
                  >
                    {p >= 0.06 ? pct(p) : ""}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===== Ranking: barras horizontais com rótulo composto ===== */

export type ItemRanking = { nome: string; valor: number; texto: string; cor?: string; dica?: string };

export function Ranking({ itens, cor = DADO.missao, max }: { itens: ItemRanking[]; cor?: string; max?: number }) {
  const teto = max ?? Math.max(...itens.map((i) => (Number.isFinite(i.valor) ? i.valor : 0)), 0) ?? 1;
  return (
    <div style={{ display: "grid", gap: 5 }}>
      {itens.map((i, k) => (
        <div key={`${i.nome}-${k}`} title={i.dica ?? `${i.nome}: ${i.texto}`} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 34%) 1fr", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.ink }}>{i.nome}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ height: 16, width: `${teto ? Math.max(0, i.valor / teto) * 72 : 0}%`, minWidth: i.valor > 0 ? 2 : 0, background: i.cor ?? cor, flexShrink: 0 }} />
            <span style={rotulo}>{i.texto}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ===== Quocientes: nominal + legenda empilhados, Renan ao lado ===== */

export type LinhaQuociente = { nome: string; qe: number; nominal: number; legenda: number; renan?: number };

export function BarrasQuociente({
  linhas,
  textoRenan = "votos do Renan na mesma área",
  textoNominal = "Missão: voto nominal",
}: {
  linhas: LinhaQuociente[];
  textoRenan?: string;
  textoNominal?: string;
}) {
  const temLegenda = linhas.some((l) => l.legenda > 0);
  const temRenan = linhas.some((l) => l.renan !== undefined && Number.isFinite(l.renan));
  const maior = Math.max(
    1.05,
    ...linhas.map((l) => (l.qe > 0 ? Math.max((l.nominal + l.legenda) / l.qe, (l.renan ?? 0) / l.qe) : 0)),
  );
  const escala = (x: number) => `${Math.min(100, (x / maior) * 100)}%`;
  const marcas = [0.8, 1, 2, 3].filter((m) => m <= maior);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13.5, margin: "4px 0 10px" }}>
        {(
          [
            [DADO.nominal, textoNominal],
            ...(temLegenda ? [[DADO.legenda, "Missão: legenda (só o 14)"]] : []),
            ...(temRenan ? [[DADO.renan, textoRenan]] : []),
          ] as [string, string][]
        ).map(([cor, nome]) => (
          <span key={nome} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true" style={{ width: 13, height: 13, background: cor, border: bordaFina(C.ink) }} />
            {nome}
          </span>
        ))}
        <span style={{ opacity: 0.75 }}>· 1,00 = uma cadeira · ✓ = faria cadeira</span>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {linhas.map((l) => {
          const nom = l.qe > 0 ? l.nominal / l.qe : 0;
          const leg = l.qe > 0 ? l.legenda / l.qe : 0;
          const ren = l.renan !== undefined && l.qe > 0 ? l.renan / l.qe : undefined;
          const total = l.nominal + l.legenda;
          return (
            <div key={l.nome} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 26%) 1fr", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13.5, lineHeight: 1.2, color: C.ink }}>{l.nome}</span>
              <div style={{ position: "relative", padding: "2px 0" }}>
                {marcas.map((m) => (
                  <span
                    key={m}
                    aria-hidden="true"
                    style={{ position: "absolute", top: 0, bottom: 0, left: escala(m), borderLeft: `1px dashed ${C.ink}`, opacity: m === 1 ? 0.7 : 0.35 }}
                  />
                ))}
                <div
                  title={`Missão: ${num(l.nominal)} nominal + ${num(l.legenda)} legenda = ${num(total)} votos (${fmtQe(nom + leg)}) · QE ${num(l.qe)}`}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span style={{ display: "flex", height: 16, width: escala(nom + leg), minWidth: total > 0 ? 2 : 0 }}>
                    <span style={{ flex: nom || 0.0001, background: DADO.nominal }} />
                    <span style={{ flex: leg, background: DADO.legenda }} />
                  </span>
                  <span style={rotulo}>
                    {fmtQe(nom + leg)} · {num(total)} {nom + leg >= 1 ? "✓" : ""}
                  </span>
                </div>
                {ren !== undefined && Number.isFinite(ren) && (
                  <div title={`Renan: ${num(l.renan ?? 0)} votos (${fmtQe(ren)})`} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ height: 12, width: escala(ren), minWidth: 2, background: DADO.renan }} />
                    <span style={rotulo}>
                      {fmtQe(ren)} · {num(l.renan ?? 0)} {ren >= 1 ? "✓" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(90px, 26%) 1fr", gap: 10, marginTop: 6 }}>
        <span />
        <div style={{ position: "relative", height: 16, fontSize: 11.5, fontFamily: FONT_ELITE, opacity: 0.7 }}>
          {marcas.map((m) => (
            <span key={m} style={{ position: "absolute", left: escala(m), transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
              {m === 0.8 ? "80%" : `${m} QE`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== Mapa coroplético ===== */

export function MapaCoropletico({
  mapa,
  valores,
  rotulos,
  formato = pct,
}: {
  mapa: Mapa | null;
  /** valor por código IBGE */
  valores: Record<string, number>;
  /** texto do toque/hover por código IBGE */
  rotulos: Record<string, string>;
  formato?: (x: number) => string;
}) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const { min, max } = useMemo(() => {
    const v = Object.values(valores).filter(Number.isFinite).sort((a, b) => a - b);
    if (!v.length) return { min: 0, max: 1 };
    // o percentil 98 segura a escala: uma cidade fora da curva não apaga as outras
    return { min: v[0], max: v[Math.floor((v.length - 1) * 0.98)] || v[v.length - 1] };
  }, [valores]);

  if (!mapa) return <p style={{ opacity: 0.7 }}>Carregando mapa…</p>;
  const corDe = (x: number) => {
    if (!Number.isFinite(x)) return C.paper;
    const p = max > min ? Math.min(1, Math.max(0, (x - min) / (max - min))) : 0.5;
    return DADO.rampa[Math.min(DADO.rampa.length - 1, Math.floor(p * DADO.rampa.length))];
  };

  return (
    <div>
      <svg viewBox={`0 0 ${mapa.largura} ${mapa.altura}`} style={{ width: "100%", height: "auto", maxHeight: 520, display: "block" }} role="img" aria-label="Mapa">
        {Object.entries(mapa.paths).map(([cod, d]) => (
          <path
            key={cod}
            d={d}
            fill={corDe(valores[cod])}
            stroke={ativo === cod ? C.ink : C.cream}
            strokeWidth={ativo === cod ? 2.5 : 0.6}
            onMouseEnter={() => setAtivo(cod)}
            onClick={() => setAtivo(cod)}
            style={{ cursor: "pointer" }}
          >
            <title>{rotulos[cod] ?? ""}</title>
          </path>
        ))}
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, margin: "6px 0" }}>
        <span>{formato(min)}</span>
        <span style={{ display: "flex", flex: "0 1 220px", height: 10, border: bordaFina(C.ink) }}>
          {DADO.rampa.map((c) => (
            <span key={c} style={{ flex: 1, background: c }} />
          ))}
        </span>
        <span>{formato(max)}+</span>
      </div>
      <p style={{ fontSize: 14, minHeight: 22, margin: "4px 0 0", fontWeight: 600 }}>{ativo ? rotulos[ativo] : "Toque ou passe o mouse numa área para ver os números."}</p>
    </div>
  );
}

/* ===== Dispersão (cidades) ===== */

export type Ponto = { id: string; x: number; y: number; tamanho: number; texto: string };

export function Dispersao({ pontos, rotuloX, rotuloY }: { pontos: Ponto[]; rotuloX: string; rotuloY: string }) {
  const [ativo, setAtivo] = useState<Ponto | null>(null);
  const L = 600;
  const A = 420;
  const M = 44;
  const xs = pontos.map((p) => p.x).filter(Number.isFinite).sort((a, b) => a - b);
  const ys = pontos.map((p) => p.y).filter(Number.isFinite).sort((a, b) => a - b);
  const q = (v: number[]) => (v.length ? v[Math.floor((v.length - 1) * 0.995)] : 0.05);
  const teto = Math.max(q(xs), q(ys), 0.001) * 1.1;
  const maiorTam = Math.max(...pontos.map((p) => p.tamanho), 1);
  const px = (x: number) => M + (Math.min(x, teto) / teto) * (L - M - 10);
  const py = (y: number) => A - M + 10 - (Math.min(y, teto) / teto) * (A - M);
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * teto);

  return (
    <div>
      <svg viewBox={`0 0 ${L} ${A}`} style={{ width: "100%", height: "auto", display: "block", background: C.cream, border: borda(C.ink) }} role="img" aria-label={`${rotuloY} por ${rotuloX}`}>
        {marcas.map((m) => (
          <g key={m}>
            <line x1={px(m)} x2={px(m)} y1={py(0)} y2={py(teto)} stroke={C.ink} strokeOpacity={0.12} />
            <line x1={px(0)} x2={px(teto)} y1={py(m)} y2={py(m)} stroke={C.ink} strokeOpacity={0.12} />
            <text x={px(m)} y={py(0) + 16} fontSize={11} textAnchor="middle" fill={C.ink}>{pct(m, 1)}</text>
            <text x={px(0) - 6} y={py(m) + 4} fontSize={11} textAnchor="end" fill={C.ink}>{pct(m, 1)}</text>
          </g>
        ))}
        <line x1={px(0)} y1={py(0)} x2={px(teto)} y2={py(teto)} stroke={C.ink} strokeDasharray="5 5" strokeOpacity={0.6} />
        {pontos.map((p) => (
          <circle
            key={p.id}
            cx={px(p.x)}
            cy={py(p.y)}
            r={3 + Math.sqrt(p.tamanho / maiorTam) * 18}
            fill={DADO.missao}
            fillOpacity={0.45}
            stroke={ativo?.id === p.id ? C.ink : C.cream}
            strokeWidth={ativo?.id === p.id ? 2 : 0.8}
            onMouseEnter={() => setAtivo(p)}
            onClick={() => setAtivo(p)}
            style={{ cursor: "pointer" }}
          >
            <title>{p.texto}</title>
          </circle>
        ))}
        <text x={L / 2} y={A - 4} fontSize={12} textAnchor="middle" fill={C.ink}>{rotuloX}</text>
        <text x={12} y={A / 2} fontSize={12} textAnchor="middle" fill={C.ink} transform={`rotate(-90 12 ${A / 2})`}>{rotuloY}</text>
      </svg>
      <p style={{ fontSize: 14, minHeight: 22, margin: "6px 0 0", fontWeight: 600 }}>{ativo ? ativo.texto : "Toque ou passe o mouse num ponto para ver a cidade."}</p>
    </div>
  );
}

/* ===== Mapa da cidade: bairros (IBGE) e distritos, com os locais de votação ===== */

export type PontoLocal = { id: string; x: number; y: number; eleitores: number; texto: string; area: string };

/**
 * Pinta cada bairro pelo indicador e põe os locais de votação por cima, do
 * tamanho do eleitorado. `divergente` usa a escala esquerda ↔ direita com o
 * zero no meio (pende para); senão, a rampa de um tom só.
 */
export function MapaBairros({
  mapa,
  valores,
  rotulos,
  pontos,
  ativo,
  aoEscolher,
  divergente = false,
  formato = pct,
}: {
  mapa: DadosMapaBairros | null;
  /** valor por chave do bairro */
  valores: Record<string, number>;
  rotulos: Record<string, string>;
  pontos: PontoLocal[];
  ativo: string | null;
  aoEscolher: (chave: string) => void;
  divergente?: boolean;
  formato?: (x: number) => string;
}) {
  const [sobre, setSobre] = useState<string | null>(null);
  const escala = useMemo(() => {
    const v = Object.values(valores).filter(Number.isFinite).sort((a, b) => a - b);
    if (!v.length) return { min: 0, max: 1 };
    if (divergente) {
      const abs = v.map(Math.abs).sort((a, b) => a - b);
      const m = abs[Math.floor((abs.length - 1) * 0.95)] || abs[abs.length - 1] || 1;
      return { min: -m, max: m };
    }
    return { min: v[0], max: v[Math.floor((v.length - 1) * 0.98)] || v[v.length - 1] };
  }, [valores, divergente]);

  if (!mapa) return <p style={{ opacity: 0.7 }}>Esta cidade não tem mapa.</p>;
  const tons = divergente ? DADO.lado : DADO.rampa;
  const corDe = (x: number) => {
    if (!Number.isFinite(x)) return C.cream;
    const p = escala.max > escala.min ? Math.min(1, Math.max(0, (x - escala.min) / (escala.max - escala.min))) : 0.5;
    return tons[Math.min(tons.length - 1, Math.floor(p * tons.length))];
  };
  const maior = Math.max(...pontos.map((p) => p.eleitores), 1);
  const raio = (e: number) => (2.5 + Math.sqrt(e / maior) * 13) * (mapa.largura / 1000);
  const mostrado = sobre ?? ativo;

  return (
    <div>
      <svg
        viewBox={`0 0 ${mapa.largura} ${mapa.altura}`}
        style={{ width: "100%", height: "auto", maxHeight: 620, display: "block", background: C.paper, border: borda(C.ink) }}
        role="img"
        aria-label="Mapa dos bairros"
      >
        {Object.entries(mapa.fundo).map(([nome, d]) => (
          <path key={`f-${nome}`} d={d} fill={C.cream} stroke={C.ink} strokeOpacity={0.35} strokeWidth={1} />
        ))}
        {Object.entries(mapa.areas).map(([chave, d]) => {
          const tem = chave in valores;
          return (
            <path
              key={chave}
              d={d}
              fill={tem ? corDe(valores[chave]) : C.cream}
              stroke={ativo === chave ? C.ink : C.paper}
              strokeWidth={ativo === chave ? 3 : 0.8}
              onMouseEnter={() => tem && setSobre(chave)}
              onMouseLeave={() => setSobre(null)}
              onClick={() => tem && aoEscolher(chave)}
              style={{ cursor: tem ? "pointer" : "default" }}
            >
              <title>{rotulos[chave] ?? "Sem local de votação"}</title>
            </path>
          );
        })}
        {pontos.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={raio(p.eleitores)}
            fill={DADO.missao}
            fillOpacity={0.55}
            stroke={p.area === ativo ? C.ink : C.cream}
            strokeWidth={p.area === ativo ? 2 : 0.8}
            onClick={() => aoEscolher(p.area)}
            style={{ cursor: "pointer" }}
          >
            <title>{p.texto}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, margin: "6px 0", flexWrap: "wrap" }}>
        <span>{divergente ? `${formato(escala.min)} esquerda` : formato(escala.min)}</span>
        <span style={{ display: "flex", flex: "0 1 220px", minWidth: 120, height: 10, border: bordaFina(C.ink) }}>
          {tons.map((c) => (
            <span key={c} style={{ flex: 1, background: c }} />
          ))}
        </span>
        <span>{divergente ? `direita ${formato(escala.max)}` : `${formato(escala.max)}+`}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: 8 }}>
          <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: "50%", background: DADO.missao, opacity: 0.7 }} />
          local de votação (tamanho = eleitores)
        </span>
      </div>
      <p style={{ fontSize: 14, minHeight: 22, margin: "4px 0 0", fontWeight: 600 }}>
        {mostrado ? rotulos[mostrado] : "Toque num bairro ou num ponto para abrir o detalhe."}
      </p>
    </div>
  );
}

/* ===== Quadrantes: dois eixos com corte, um canto por situação ===== */

export type PontoQuadrante = { id: string; x: number; y: number; tamanho: number; texto: string; quadrante: string };

/** Cor e rótulo de cada situação do 14 — o nome também vai escrito no canto do gráfico e na tabela. */
export const QUADRANTES: Record<string, { cor: string; texto: string }> = {
  Convertido: { cor: DADO.missao, texto: "Convertido: vota 14 e já vota no deputado" },
  Potencial: { cor: DADO.direita, texto: "Potencial: vota 14, falta o deputado" },
  "Base de candidato": { cor: DADO.legenda, texto: "Base de candidato: o deputado rende além do 14" },
  "Fora da base": { cor: DADO.outros, texto: "Fora da base" },
};

export function Quadrantes({
  pontos,
  corteX,
  corteY,
  ativo,
  aoEscolher,
  rotuloX,
  rotuloY,
  cantos,
}: {
  pontos: PontoQuadrante[];
  corteX: number;
  corteY: number;
  ativo: string | null;
  aoEscolher: (id: string) => void;
  rotuloX: string;
  rotuloY: string;
  /** [alto-esquerda, alto-direita, baixo-esquerda, baixo-direita] */
  cantos: [string, string, string, string];
}) {
  const [sobre, setSobre] = useState<PontoQuadrante | null>(null);
  const L = 640;
  const A = 440;
  const M = 46;
  const q = (v: number[], p: number) => (v.length ? v[Math.floor((v.length - 1) * p)] : 1);
  const xs = pontos.map((p) => p.x).filter(Number.isFinite).sort((a, b) => a - b);
  const ys = pontos.map((p) => p.y).filter(Number.isFinite).sort((a, b) => a - b);
  const maxX = Math.max(q(xs, 0.97) * 1.08, corteX * 1.6, 0.5);
  const maxY = Math.max(q(ys, 0.97) * 1.08, corteY * 1.6, 0.5);
  const maior = Math.max(...pontos.map((p) => p.tamanho), 1);
  const px = (x: number) => M + (Math.min(x, maxX) / maxX) * (L - M - 12);
  const py = (y: number) => A - M - (Math.min(y, maxY) / maxY) * (A - M - 12);
  const mostrado = sobre ?? pontos.find((p) => p.id === ativo) ?? null;
  const canto = (texto: string, x: number, y: number, ancora: "start" | "end") => (
    <text x={x} y={y} fontSize={12} textAnchor={ancora} fill={C.ink} fontFamily={FONT_ELITE} opacity={0.75}>
      {texto.toUpperCase()}
    </text>
  );
  const marcas = (max: number) => [0, 0.5, 1, 1.5, 2, 2.5, 3, 4].filter((v) => v <= max);

  return (
    <div>
      <svg viewBox={`0 0 ${L} ${A}`} style={{ width: "100%", height: "auto", display: "block", background: C.cream, border: borda(C.ink) }} role="img" aria-label={`${rotuloY} por ${rotuloX}`}>
        <line x1={px(corteX)} x2={px(corteX)} y1={py(0)} y2={py(maxY)} stroke={C.ink} strokeDasharray="5 5" strokeOpacity={0.6} />
        <line x1={px(0)} x2={px(maxX)} y1={py(corteY)} y2={py(corteY)} stroke={C.ink} strokeDasharray="5 5" strokeOpacity={0.6} />
        {canto(cantos[0], px(0) + 6, py(maxY) + 14, "start")}
        {canto(cantos[1], px(maxX) - 4, py(maxY) + 14, "end")}
        {canto(cantos[2], px(0) + 6, py(0) - 6, "start")}
        {canto(cantos[3], px(maxX) - 4, py(0) - 6, "end")}
        {marcas(maxX).map((v) => (
          <text key={`x${v}`} x={px(v)} y={py(0) + 16} fontSize={11} textAnchor="middle" fill={C.ink}>
            {num(v, 1)}
          </text>
        ))}
        {marcas(maxY).map((v) => (
          <text key={`y${v}`} x={px(0) - 6} y={py(v) + 4} fontSize={11} textAnchor="end" fill={C.ink}>
            {num(v, 1)}
          </text>
        ))}
        {pontos
          .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
          .sort((a, b) => b.tamanho - a.tamanho)
          .map((p) => (
            <circle
              key={p.id}
              cx={px(p.x)}
              cy={py(p.y)}
              r={3 + Math.sqrt(p.tamanho / maior) * 16}
              fill={QUADRANTES[p.quadrante]?.cor ?? DADO.outros}
              fillOpacity={0.6}
              stroke={p.id === ativo ? C.ink : C.cream}
              strokeWidth={p.id === ativo ? 2.5 : 0.8}
              onMouseEnter={() => setSobre(p)}
              onMouseLeave={() => setSobre(null)}
              onClick={() => aoEscolher(p.id)}
              style={{ cursor: "pointer" }}
            >
              <title>{p.texto}</title>
            </circle>
          ))}
        <text x={L / 2} y={A - 6} fontSize={12} textAnchor="middle" fill={C.ink}>{rotuloX}</text>
        <text x={12} y={A / 2} fontSize={12} textAnchor="middle" fill={C.ink} transform={`rotate(-90 12 ${A / 2})`}>{rotuloY}</text>
      </svg>
      <p style={{ fontSize: 14, minHeight: 22, margin: "6px 0 0", fontWeight: 600 }}>{mostrado ? mostrado.texto : "Toque num ponto para abrir o lugar. O tamanho é o eleitorado."}</p>
    </div>
  );
}
