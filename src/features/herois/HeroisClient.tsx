"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Icon, IconName } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_BITTER, FONT_ELITE, borda, sombra, sombraErguida, sombraAfundada, SOMBRA } from "@/lib/theme";
import { heroes, type Hero } from "./data";

/* textura de folheto: hachuras leves de xilogravura sobre o papel */
const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

/* Épocas em tons terrosos de xilogravura (combinam com tinta/papel/dourado) */
const PERIOD_META: Record<string, { accent: string }> = {
  "Colonial":        { accent: "#8C5A17" },
  "Imperial":        { accent: "#7A2E1D" },
  "República Velha": { accent: "#3E5F3A" },
  "Século XX":       { accent: "#22526B" },
};

const CAT_ICON: Record<string, IconName> = {
  "Militar":                "sword",
  "Literário":              "book",
  "Político/Revolucionário":"flag",
  "Religioso/Social":       "church",
  "Abolicionista":          "heartHandshake",
  "Musical":                "music",
  "Teatro/Cultural":        "ticket",
  "Científico/Histórico":   "microscope",
  "Indígena":               "tree",
};

const SECTIONS: { icon: IconName; label: string; key: keyof Hero & ("contemporaries" | "historicalContext" | "actions" | "helpers" | "consequences" | "legacy") }[] = [
  { icon: "users",          label: "Contemporâneos",                       key: "contemporaries" },
  { icon: "world",          label: "Contexto histórico — o que acontecia", key: "historicalContext" },
  { icon: "bolt",           label: "Ações e contribuições",                key: "actions" },
  { icon: "heartHandshake", label: "Pessoas que os ajudaram",              key: "helpers" },
  { icon: "leaf",           label: "Consequências e frutos",               key: "consequences" },
  { icon: "star",           label: "Por que ficou marcado",                key: "legacy" },
];

/* chip de época: carimbo com a cor do período */
const periodChip = (accent: string): React.CSSProperties => ({
  fontFamily: FONT_ELITE,
  fontSize: 10,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  background: accent,
  color: C.cream,
  border: `2px solid ${C.ink}`,
  padding: "2px 8px",
  whiteSpace: "nowrap",
});

const fieldStyle: React.CSSProperties = {
  background: C.cream,
  border: borda(),
  boxShadow: sombra("rente"),
  padding: "10px 12px",
  /* 16px é o mínimo que impede o iPhone de dar zoom ao focar o campo */
  fontSize: 16,
  minHeight: 44,
  fontFamily: FONT_BITTER,
  color: C.ink,
  borderRadius: 0,
};

export default function HeroisClient() {
  const [selected, setSelected] = useState<Hero | null>(null);
  const [search,   setSearch]   = useState("");
  const [period,   setPeriod]   = useState("todos");
  const [category, setCategory] = useState("todas");

  const periods    = ["todos","Colonial","Imperial","República Velha","Século XX"];
  const categories = ["todas","Militar","Literário","Político/Revolucionário","Religioso/Social","Abolicionista","Musical","Teatro/Cultural","Científico/Histórico","Indígena"];

  /* ficha aberta: Esc fecha e o fundo não rola */
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return heroes.filter(h => {
      const ms = q === "" || h.name.toLowerCase().includes(q) || h.nickname.toLowerCase().includes(q);
      const mp = period === "todos" || h.period === period;
      const mc = category === "todas" || h.category === category;
      return ms && mp && mc;
    });
  }, [search, period, category]);

  const pm = (h: Hero) => PERIOD_META[h.period] || PERIOD_META["Colonial"];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: `${HATCH}, ${C.paper}`,
        color: C.ink,
        fontFamily: FONT_BITTER,
        /* o layout declara dark; esta página é papel claro, e sem isto os
           <select> saem com fundo escuro do navegador */
        colorScheme: "light",
      }}
    >
      <style>{`
        @keyframes hFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes hSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .h-overlay { animation: hFadeIn .25s ease-out }
        .h-drawer { animation: hSlideIn .35s cubic-bezier(.22, 1.1, .35, 1) }
        .h-card { transition: transform .12s ease, box-shadow .12s ease; cursor: pointer }
        .h-card:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("cartao")} !important }
        .h-card:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("cartao")} !important }
        .h-btn { transition: transform .12s ease, box-shadow .12s ease }
        .h-btn:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("rente")} !important }
        .h-card:focus-visible, .h-btn:focus-visible { outline: ${BORDA}px solid ${C.goldDim}; outline-offset: 3px }
        .h-field:focus { outline: ${BORDA}px solid ${C.gold}; outline-offset: 0 }
        @media (prefers-reduced-motion: reduce) {
          .h-overlay, .h-drawer { animation: none }
          .h-card, .h-btn { transition: none }
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px 56px" }}>

        {/* ===== Cabeçalho do folheto ===== */}
        <header style={{ marginBottom: 26 }}>
          <Link
            href="/"
            className="h-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: FONT_ELITE,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              textDecoration: "none",
              color: C.ink,
              background: C.cream,
              border: borda(),
              boxShadow: sombra("rente"),
              padding: "11px 16px",
              minHeight: 44,
              marginBottom: 22,
            }}
          >
            <Icon name="arrowLeft" size={15} />
            Voltar
          </Link>

          <p
            style={{
              display: "inline-block",
              fontFamily: FONT_ELITE,
              letterSpacing: 4,
              fontSize: 12,
              textTransform: "uppercase",
              color: C.ink,
              background: C.gold,
              padding: "4px 14px",
              boxShadow: sombra("rente"),
              margin: "0 0 12px",
            }}
          >
            Cordel · Missão Ceará
          </p>

          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(30px, 6vw, 44px)",
              letterSpacing: 1,
              lineHeight: 1.08,
              color: C.ink,
              textShadow: `3px 3px 0 ${C.gold}`,
              margin: "0 0 10px",
            }}
          >
            Heróis do Ceará
          </h1>

          <p style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 620, margin: "0 0 14px" }}>
            Cordel dos que fizeram nossa história: {heroes.length} fichas de quem lutou,
            escreveu, cantou e abriu caminho — da fundação do Ceará à cultura que o mundo conhece.
          </p>

          <p
            aria-live="polite"
            style={{
              fontFamily: FONT_ELITE,
              fontSize: 12,
              letterSpacing: 1.5,
              opacity: 0.8,
              margin: 0,
            }}
          >
            ✦ {filtered.length} de {heroes.length} fichas · toque num card pra abrir a ficha completa ✦
          </p>
        </header>

        {/* ===== Filtros ===== */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            className="h-field"
            placeholder="Buscar herói ou apelido…"
            aria-label="Buscar herói ou apelido"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...fieldStyle, flex: "2 1 220px", minWidth: 180 }}
          />
          <select
            className="h-field"
            aria-label="Filtrar por período"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ ...fieldStyle, flex: "1 1 170px", cursor: "pointer" }}
          >
            {periods.map(p => (
              <option key={p} value={p}>{p === "todos" ? "Todos os períodos" : p}</option>
            ))}
          </select>
          <select
            className="h-field"
            aria-label="Filtrar por categoria"
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ ...fieldStyle, flex: "1 1 210px", cursor: "pointer" }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === "todas" ? "Todas as categorias" : c}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 && (
          <p
            style={{
              fontFamily: FONT_ELITE,
              fontSize: 14,
              letterSpacing: 1,
              textAlign: "center",
              padding: "3rem 0",
              margin: 0,
            }}
          >
            Nenhum herói encontrado com esses filtros — afrouxe a busca, que o sertão é grande.
          </p>
        )}

        {/* ===== Grade de fichas ===== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map(h => {
            const m = pm(h);
            const active = selected?.id === h.id;
            return (
              <button
                key={h.id}
                type="button"
                className="h-card"
                onClick={() => setSelected(active ? null : h)}
                aria-label={`Abrir ficha de ${h.name}`}
                style={{
                  textAlign: "left",
                  fontFamily: "inherit",
                  background: C.cream,
                  border: borda(),
                  /* o aceso muda de COR, não de altura: 1px de diferença
                     ninguém vê, a cor do herói se vê de longe */
                  boxShadow: active ? sombra("cartao", m.accent) : sombra("cartao"),
                  padding: "12px 14px",
                  color: C.ink,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 30,
                      height: 30,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      background: C.gold,
                      border: `2px solid ${C.ink}`,
                      color: C.ink,
                    }}
                  >
                    <Icon name={CAT_ICON[h.category] || "star"} size={17} />
                  </span>
                  <span style={periodChip(m.accent)}>{h.period}</span>
                </div>
                <p
                  style={{
                    fontFamily: FONT_ALFA,
                    fontSize: 15,
                    letterSpacing: 0.3,
                    lineHeight: 1.3,
                    margin: "0 0 4px",
                  }}
                >
                  {h.name}
                </p>
                <p
                  style={{
                    fontFamily: FONT_ELITE,
                    fontSize: 11,
                    letterSpacing: 0.5,
                    opacity: 0.75,
                    margin: "0 0 3px",
                  }}
                >
                  {h.birth} — {h.death}
                </p>
                <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{h.category}</p>
              </button>
            );
          })}
        </div>

        {/* ===== Ficha completa (gaveta lateral) ===== */}
        {selected && (
          <>
            <div
              className="h-overlay"
              onClick={() => setSelected(null)}
              aria-hidden="true"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(12,10,4,.55)",
                backdropFilter: "blur(2px)",
                zIndex: 998,
              }}
            />

            <div
              className="h-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={`Ficha de ${selected.name}`}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                height: "100dvh",
                width: "min(100%, 520px)",
                background: `${HATCH}, ${C.paper}`,
                borderLeft: `4px solid ${C.ink}`,
                /* a gaveta entra pela direita: a sombra dela cai para o lado, não na diagonal */
                boxShadow: `-${SOMBRA.alto}px 0 0 ${C.sombra}`,
                overflowY: "auto",
                /* impede o scroll de "vazar" para a página atrás no iOS */
                overscrollBehavior: "contain",
                zIndex: 999,
                padding: "0 22px 26px",
              }}
            >
              {/* Cabeçalho da ficha */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  position: "sticky",
                  top: 0,
                  background: C.paper,
                  padding: "20px 0 14px",
                  borderBottom: borda(),
                  marginBottom: 18,
                  zIndex: 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={periodChip(pm(selected).accent)}>{selected.period}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        opacity: 0.75,
                      }}
                    >
                      <Icon name={CAT_ICON[selected.category] || "star"} size={14} />
                      {selected.category}
                    </span>
                  </div>
                  <h2
                    style={{
                      fontFamily: FONT_ALFA,
                      fontSize: 22,
                      letterSpacing: 0.4,
                      lineHeight: 1.15,
                      textShadow: `2px 2px 0 ${C.gold}`,
                      margin: "0 0 6px",
                    }}
                  >
                    {selected.name}
                  </h2>
                  <p
                    style={{
                      fontFamily: FONT_ELITE,
                      fontSize: 12,
                      letterSpacing: 0.5,
                      opacity: 0.85,
                      margin: 0,
                    }}
                  >
                    &ldquo;{selected.nickname}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  className="h-btn"
                  onClick={() => setSelected(null)}
                  aria-label="Fechar ficha"
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    background: C.gold,
                    border: borda(),
                    boxShadow: sombra("rente"),
                    color: C.ink,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              {/* Nascimento / Falecimento */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 18 }}>
                {[
                  { label: "Nascimento",  value: `${selected.birth} · ${selected.birthPlace}` },
                  { label: "Falecimento", value: `${selected.death} · ${selected.deathPlace}` },
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      background: C.cream,
                      border: `2px solid ${C.ink}`,
                      borderLeft: `6px solid ${pm(selected).accent}`,
                      padding: "10px 14px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: FONT_ELITE,
                        fontSize: 10,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        opacity: 0.7,
                        margin: "0 0 4px",
                      }}
                    >
                      {item.label}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Família */}
              <div style={{ borderTop: "2px dashed rgba(24,18,3,.35)", paddingTop: 16, marginBottom: 16 }}>
                <p
                  style={{
                    fontFamily: FONT_ELITE,
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}
                >
                  ✦ Família
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { k: "Pais",    v: selected.family.parents },
                    { k: "Cônjuge", v: selected.family.spouse },
                    { k: "Filhos",  v: selected.family.children },
                  ].map(row => (
                    <div key={row.k} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                      <span style={{ minWidth: 70, flexShrink: 0, fontWeight: 700 }}>{row.k}:</span>
                      <span style={{ lineHeight: 1.55 }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seções da ficha */}
              {SECTIONS.map((sec, idx) => (
                <div
                  key={sec.key}
                  style={{
                    borderTop: "2px dashed rgba(24,18,3,.35)",
                    paddingTop: 16,
                    marginBottom: idx === SECTIONS.length - 1 ? 0 : 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 30,
                        height: 30,
                        flex: "0 0 auto",
                        display: "grid",
                        placeItems: "center",
                        background: C.gold,
                        border: `2px solid ${C.ink}`,
                        color: C.ink,
                      }}
                    >
                      <Icon name={sec.icon} size={16} />
                    </span>
                    <p
                      style={{
                        fontFamily: FONT_ELITE,
                        fontSize: 11,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        margin: 0,
                      }}
                    >
                      {sec.label}
                    </p>
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "0 0 0 40px" }}>
                    {selected[sec.key]}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
