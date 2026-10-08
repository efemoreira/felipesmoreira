"use client";
import React, { useMemo, useRef, useState } from "react";
import { DADO, FONT_DADOS, PAINEL_DADOS as P, RAIO_DADOS, fileteDados } from "@/lib/theme";
import { num } from "../formato";
import { centroDoPath, faixaDe, faixasQuantil, tonsPara, type Caixa } from "./niveis";

/**
 * O mapa do Explorador — SVG puro, como o resto de /resultados.
 *
 * - "%": cada área pintada pela faixa (quantil) do indicador; a legenda diz o
 *   corte de cada faixa, e passar o dedo numa faixa acende só as áreas dela;
 * - "votos": áreas em cinza e um círculo proporcional (√votos) no centro, para
 *   área grande não parecer muito voto;
 * - mouse: passar mostra a caixinha, clicar entra; toque: o primeiro toque
 *   mostra a caixinha com o botão "Entrar", o segundo no mesmo lugar entra;
 * - teclado: Tab percorre as áreas, Enter entra.
 */

export type AreaMapa = {
  id: string;
  d: string;
  nome: string;
  /** fração do indicador (pinta a área) */
  valor: number;
  /** total do indicador (círculo, no modo votos) */
  votos?: number;
  /** linhas da caixinha, depois do nome */
  detalhe: string[];
  /** dá para entrar (tem nível abaixo) */
  entra: boolean;
  /** peso para escolher quem ganha rótulo escrito */
  peso?: number;
};

export type PontoMapa = { id: string; x: number; y: number; eleitores: number; texto: string; area: string };

export function MapaExplorador({
  largura,
  altura,
  caixa,
  areas,
  contexto = [],
  pontos = [],
  modo,
  divergente = false,
  formato,
  ativo,
  aoEntrar,
  rotuloEntrar = "Entrar",
  vazio,
}: {
  largura: number;
  altura: number;
  /** zoom (região, cidade dentro do estado); sem ela, o desenho inteiro */
  caixa?: Caixa | null;
  areas: AreaMapa[];
  /** desenho de fundo sem dado (os outros estados, a sede da cidade) */
  contexto?: string[];
  pontos?: PontoMapa[];
  modo: "pct" | "votos";
  divergente?: boolean;
  formato: (x: number) => string;
  /** área marcada (o lugar aberto) */
  ativo?: string | null;
  aoEntrar: (id: string) => void;
  rotuloEntrar?: string;
  /** texto quando não há área com dado */
  vazio?: string;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const [sobre, setSobre] = useState<{ id: string; x: number; y: number; toque: boolean } | null>(null);
  const [faixaAcesa, setFaixaAcesa] = useState<number | null>(null);

  const vb = caixa ?? { x: 0, y: 0, largura, altura };
  const escala = vb.largura / 1000;

  const faixas = useMemo(() => faixasQuantil(areas.map((a) => a.valor), divergente ? 7 : 5, divergente), [areas, divergente]);
  const tons = useMemo(() => (divergente ? [...DADO.lado] : tonsPara(DADO.rampa, faixas.cortes.length + 1)), [divergente, faixas]);
  const centros = useMemo(() => new Map(areas.map((a) => [a.id, centroDoPath(a.d)])), [areas]);
  const maiorVoto = useMemo(() => Math.max(1, ...areas.map((a) => (Number.isFinite(a.votos) ? (a.votos as number) : 0))), [areas]);
  const rotulados = useMemo(
    () =>
      new Set(
        [...areas]
          .filter((a) => (a.peso ?? 0) > 0)
          .sort((a, b) => (b.peso ?? 0) - (a.peso ?? 0))
          .slice(0, areas.length > 40 ? 5 : areas.length > 12 ? 6 : 0)
          .map((a) => a.id),
      ),
    [areas],
  );
  const porId = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);
  const maiorLocal = useMemo(() => Math.max(1, ...pontos.map((q) => q.eleitores)), [pontos]);

  const corDe = (a: AreaMapa) => {
    if (modo === "votos") return P.fundo;
    const f = faixaDe(a.valor, faixas);
    return f < 0 ? P.superficie : tons[Math.min(tons.length - 1, f)];
  };
  const apagada = (a: AreaMapa) => faixaAcesa !== null && faixaDe(a.valor, faixas) !== faixaAcesa;

  const posicao = (e: React.PointerEvent | React.FocusEvent, id: string) => {
    const r = caixaRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    if ("clientX" in e) return { x: e.clientX - r.left, y: e.clientY - r.top };
    const c = centros.get(id);
    return c ? { x: ((c[0] - vb.x) / vb.largura) * r.width, y: ((c[1] - vb.y) / vb.altura) * r.width * (vb.altura / vb.largura) } : { x: r.width / 2, y: 40 };
  };

  const tocar = (e: React.PointerEvent, a: AreaMapa) => {
    if (e.pointerType === "mouse") {
      if (a.entra) aoEntrar(a.id);
      return;
    }
    if (sobre?.id === a.id && sobre.toque && a.entra) {
      setSobre(null);
      aoEntrar(a.id);
      return;
    }
    setSobre({ id: a.id, ...posicao(e, a.id), toque: true });
  };

  const mostrado = sobre ? porId.get(sobre.id) : undefined;
  const largCaixa = caixaRef.current?.clientWidth ?? 600;
  const semDado = areas.every((a) => !Number.isFinite(a.valor));

  return (
    <div className="mx-mapa">
      <div ref={caixaRef} style={{ position: "relative" }} onPointerLeave={(e) => e.pointerType === "mouse" && setSobre(null)}>
        <svg
          viewBox={`${vb.x} ${vb.y} ${vb.largura} ${vb.altura}`}
          style={{ width: "100%", height: "auto", maxHeight: "min(70vh, 640px)", display: "block", touchAction: "manipulation" }}
          role="group"
          aria-label="Mapa: Tab percorre as áreas, Enter entra"
        >
          {contexto.map((d, i) => (
            <path key={`c${i}`} d={d} fill={P.fundo} stroke={P.linha} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {areas.map((a) => (
            <path
              key={a.id}
              d={a.d}
              fill={corDe(a)}
              fillOpacity={apagada(a) ? 0.18 : 1}
              stroke={P.superficie}
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
              tabIndex={0}
              role="button"
              aria-label={`${a.nome}: ${a.detalhe[0] ?? ""}`}
              onPointerMove={(e) => e.pointerType === "mouse" && setSobre({ id: a.id, ...posicao(e, a.id), toque: false })}
              onPointerUp={(e) => tocar(e, a)}
              onFocus={(e) => setSobre({ id: a.id, ...posicao(e, a.id), toque: false })}
              onBlur={() => setSobre(null)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && a.entra) {
                  e.preventDefault();
                  aoEntrar(a.id);
                }
              }}
              style={{ cursor: a.entra ? "pointer" : "default", outline: "none" }}
            />
          ))}
          {/* contorno do lugar aberto e do que está sob o dedo, por cima de tudo */}
          {[ativo, sobre?.id].filter((id, i, l): id is string => !!id && l.indexOf(id) === i && porId.has(id)).map((id) => (
            <path key={`a-${id}`} d={porId.get(id)!.d} fill="none" stroke={P.tinta} strokeWidth={id === ativo ? 2.5 : 1.8} vectorEffect="non-scaling-stroke" pointerEvents="none" />
          ))}
          {modo === "votos" &&
            [...areas]
              .filter((a) => Number.isFinite(a.votos) && (a.votos as number) > 0)
              .sort((a, b) => (b.votos as number) - (a.votos as number))
              .map((a) => {
                const c = centros.get(a.id);
                if (!c) return null;
                return (
                  <circle
                    key={`v-${a.id}`}
                    cx={c[0]}
                    cy={c[1]}
                    r={Math.sqrt((a.votos as number) / maiorVoto) * 55 * escala}
                    fill={DADO.missao}
                    fillOpacity={0.55}
                    stroke={P.superficie}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                );
              })}
          {pontos.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={(1.5 + Math.sqrt(p.eleitores / maiorLocal) * 6) * escala}
              fill={P.tinta}
              fillOpacity={p.area === ativo ? 0.8 : 0.22}
              stroke={P.superficie}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          ))}
          {[...rotulados].map((id) => {
            const c = centros.get(id);
            const a = porId.get(id);
            if (!c || !a) return null;
            return (
              <text
                key={`r-${id}`}
                x={c[0]}
                y={c[1]}
                fontSize={15 * escala}
                fontFamily={FONT_DADOS}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={P.tinta}
                stroke={P.superficie}
                strokeWidth={3 * escala}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {a.nome}
              </text>
            );
          })}
        </svg>

        {mostrado && sobre && (
          <div
            role="status"
            style={{
              position: "absolute",
              left: Math.max(4, Math.min(sobre.x + 12, largCaixa - 244)),
              top: Math.max(4, sobre.y + 14),
              width: 236,
              background: P.superficie,
              border: fileteDados(P.linhaForte),
              borderRadius: RAIO_DADOS,
              padding: "8px 10px",
              fontSize: 13.5,
              lineHeight: 1.4,
              color: P.tinta,
              pointerEvents: sobre.toque ? "auto" : "none",
              zIndex: 5,
            }}
          >
            <b style={{ display: "block", fontSize: 14.5 }}>{mostrado.nome}</b>
            {mostrado.detalhe.map((l) => (
              <span key={l} style={{ display: "block", fontVariantNumeric: "tabular-nums" }}>
                {l}
              </span>
            ))}
            {sobre.toque && mostrado.entra && (
              <button
                type="button"
                onClick={() => {
                  setSobre(null);
                  aoEntrar(mostrado.id);
                }}
                style={{ marginTop: 6, minHeight: 44, width: "100%", fontFamily: FONT_DADOS, fontWeight: 700, fontSize: 14.5, color: P.superficie, background: P.tinta, border: 0, borderRadius: 999, cursor: "pointer" }}
              >
                {rotuloEntrar} em {mostrado.nome} ›
              </button>
            )}
          </div>
        )}
      </div>

      {semDado ? (
        vazio && <p style={{ fontSize: 14, color: P.tintaSuave, margin: "8px 0 0" }}>{vazio}</p>
      ) : modo === "pct" ? (
        <Faixas faixas={faixas.cortes} tons={tons} divergente={divergente} formato={formato} acesa={faixaAcesa} aoAcender={setFaixaAcesa} />
      ) : (
        <p style={{ fontSize: 13, color: P.tintaSuave, margin: "8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: "50%", background: DADO.missao, opacity: 0.6 }} />
          tamanho do círculo = votos
        </p>
      )}
      {pontos.length > 0 && <p style={{ fontSize: 13, color: P.tintaSuave, margin: "2px 0 0" }}>Pontos escuros: locais de votação (tamanho = eleitores).</p>}
    </div>
  );
}

/** A legenda em faixas, com o corte escrito. Tocar numa faixa acende só as áreas dela. */
function Faixas({
  faixas,
  tons,
  divergente,
  formato,
  acesa,
  aoAcender,
}: {
  faixas: number[];
  tons: string[];
  divergente: boolean;
  formato: (x: number) => string;
  acesa: number | null;
  aoAcender: (i: number | null) => void;
}) {
  /* cortes perto demais (1,52% e 1,58%) saem iguais com uma casa: aí a legenda ganha mais uma */
  const repete = faixas.some((c, i) => i > 0 && formato(c) === formato(faixas[i - 1]));
  const f = repete && !divergente ? (x: number) => `${num(x * 100, 2)}%` : formato;
  const rotulos = Array.from({ length: faixas.length + 1 }, (_, i) =>
    i === 0 ? `até ${f(faixas[0])}` : i === faixas.length ? `${f(faixas[i - 1])} ou mais` : `${f(faixas[i - 1])} a ${f(faixas[i])}`,
  );
  if (!faixas.length) return null;
  return (
    <div style={{ margin: "8px 0 0" }}>
      <div role="group" aria-label="Faixas da legenda" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {rotulos.map((r, i) => (
          <button
            key={r}
            type="button"
            aria-pressed={acesa === i}
            onClick={() => aoAcender(acesa === i ? null : i)}
            onPointerEnter={(e) => e.pointerType === "mouse" && aoAcender(i)}
            onPointerLeave={(e) => e.pointerType === "mouse" && aoAcender(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 32,
              padding: "4px 8px",
              fontFamily: FONT_DADOS,
              fontSize: 12.5,
              fontVariantNumeric: "tabular-nums",
              color: P.tinta,
              background: acesa === i ? P.fundo : "transparent",
              border: fileteDados(acesa === i ? P.linhaForte : "transparent"),
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 3, background: tons[Math.min(tons.length - 1, i)] }} />
            {r}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: P.tintaSuave, margin: "2px 0 0" }}>
        {divergente ? "Vermelho = pende à esquerda · azul = pende à direita." : "Cada faixa tem mais ou menos o mesmo número de áreas."} Toque numa faixa para ver só as áreas dela.
      </p>
    </div>
  );
}
