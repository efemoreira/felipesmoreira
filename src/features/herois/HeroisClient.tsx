"use client";
import { useState, useEffect, useMemo } from "react";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { Icon, IconName } from "@/components/icons";
import { C, FOCO, PONTOS, RAIO, borda, sombra } from "@/lib/theme";
import { heroes, type Hero } from "./data";

/**
 * /heroisdoceara — o cordel dos que fizeram a história do Ceará.
 *
 * As fichas vêm agrupadas por época, em ordem: 31 cartões soltos numa grade só
 * não contam história nenhuma. A ficha completa abre numa gaveta à direita.
 */

const PERIODOS = ["Colonial", "Imperial", "República Velha", "Século XX"];

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

/** O vivo não tem data de morte: "1949 — —" parecia erro de digitação. */
const vida = (h: Hero) => (h.death && h.death.trim() !== "—" ? `${h.birth} — ${h.death}` : h.birth);

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

  return (
    <PaginaDoSite
      fundo="livre"
      abertura={
        <AberturaPagina
          trilha="Heróis do Ceará"
          kicker="Cordel da Missão Ceará"
          titulo="Heróis do Ceará"
          icone="mountain"
          intro={
            <p>
              {heroes.length} fichas de quem lutou, escreveu, cantou e abriu caminho, da fundação do
              Ceará à cultura que o mundo conhece.
            </p>
          }
        />
      }
    >
      <div className="s-largura hr-miolo">
        {/* ===== Filtros ===== */}
        <div className="hr-filtros">
          <label className="hr-busca">
            <span aria-hidden="true"><Icon name="search" size={20} /></span>
            <input
              type="search"
              className="s-campo"
              placeholder="Buscar herói ou apelido"
              aria-label="Buscar herói ou apelido"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>
          <select className="s-campo" aria-label="Filtrar por período" value={period} onChange={e => setPeriod(e.target.value)}>
            {periods.map(p => (
              <option key={p} value={p}>{p === "todos" ? "Todos os períodos" : p}</option>
            ))}
          </select>
          <select className="s-campo" aria-label="Filtrar por categoria" value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => (
              <option key={c} value={c}>{c === "todas" ? "Todas as categorias" : c}</option>
            ))}
          </select>
        </div>
        <p aria-live="polite" className="hr-conta">{filtered.length} de {heroes.length} fichas</p>

        {filtered.length === 0 && (
          <p className="hr-vazio">Nenhum herói encontrado com esses filtros. Afrouxe a busca, que o sertão é grande.</p>
        )}

        {/* ===== As fichas, por época ===== */}
        {PERIODOS.map(p => {
          const daEpoca = filtered.filter(h => h.period === p);
          if (daEpoca.length === 0) return null;
          return (
            <section key={p} className="hr-epoca" aria-labelledby={`hr-${p}`}>
              <h2 id={`hr-${p}`} className="hr-epoca-titulo">{p}</h2>
              <div className="s-grade s-grade-4">
                {daEpoca.map(h => (
                  <button key={h.id} type="button" className="hr-cartao" onClick={() => setSelected(h)} aria-label={`Abrir ficha de ${h.name}`}>
                    <span aria-hidden="true" className="hr-selo">
                      <Icon name={CAT_ICON[h.category] || "star"} size={20} />
                    </span>
                    <span className="hr-nome">{h.name}</span>
                    <span className="hr-meta">{h.category}</span>
                    <span className="hr-meta">{vida(h)}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ===== Ficha completa (gaveta lateral) ===== */}
      {selected && (
        <>
          <div className="hr-veu" onClick={() => setSelected(null)} aria-hidden="true" />
          <div className="hr-gaveta" role="dialog" aria-modal="true" aria-label={`Ficha de ${selected.name}`}>
            <div className="hr-gaveta-topo">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="s-rotulo">{selected.period} · {selected.category}</p>
                <h2 className="hr-gaveta-nome">{selected.name}</h2>
                {selected.nickname && <p className="hr-apelido">{selected.nickname}</p>}
              </div>
              <button type="button" className="hr-fechar" onClick={() => setSelected(null)} aria-label="Fechar ficha">
                <Icon name="close" size={20} />
              </button>
            </div>

            <dl className="hr-datas">
              <div>
                <dt>Nascimento</dt>
                <dd>{selected.birth} · {selected.birthPlace}</dd>
              </div>
              {selected.death.trim() !== "—" && (
                <div>
                  <dt>Falecimento</dt>
                  <dd>{selected.death} · {selected.deathPlace}</dd>
                </div>
              )}
              <div>
                <dt>Pais</dt>
                <dd>{selected.family.parents}</dd>
              </div>
              <div>
                <dt>Cônjuge</dt>
                <dd>{selected.family.spouse}</dd>
              </div>
              <div>
                <dt>Filhos</dt>
                <dd>{selected.family.children}</dd>
              </div>
            </dl>

            {SECTIONS.map(sec => (
              <section key={sec.key} className="hr-secao">
                <h3>
                  <span aria-hidden="true"><Icon name={sec.icon} size={18} /></span>
                  {sec.label}
                </h3>
                <p>{selected[sec.key]}</p>
              </section>
            ))}
          </div>
        </>
      )}

      <style>{`
        .hr-miolo { padding-block: 12px clamp(48px, 7vw, 80px); }

        .hr-filtros { display: grid; gap: 10px; margin-bottom: 10px; }
        .hr-busca { position: relative; display: block; }
        .hr-busca span { position: absolute; left: 14px; top: 15px; color: ${C.suave}; pointer-events: none; }
        .hr-busca input { padding-left: 44px; }
        .hr-conta { margin: 0 0 24px; font-size: 15.5px; color: ${C.suave}; }
        .hr-vazio { padding: 48px 0; margin: 0; font-size: 18px; text-align: center; color: ${C.suave}; }

        .hr-epoca { margin-bottom: clamp(32px, 5vw, 48px); }
        .hr-epoca-titulo { margin: 0 0 14px; font-size: 22px; line-height: 1.25; font-weight: 800; letter-spacing: -.01em; }
        .hr-cartao {
          display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0; padding: 16px; text-align: left; cursor: pointer; overflow-wrap: anywhere;
          background: ${C.paper}; color: ${C.ink}; border: ${borda()}; border-radius: ${RAIO.g}px; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }
        .hr-cartao:hover { transform: translateY(-2px); box-shadow: ${sombra("cartao")}; border-color: ${C.linhaForte}; }
        .hr-cartao:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
        .hr-selo { width: 38px; height: 38px; margin-bottom: 8px; display: grid; place-items: center; border-radius: ${RAIO.p + 2}px; background: ${C.ouroClaro}; color: ${C.ink}; }
        .hr-nome { font-size: 18px; line-height: 1.25; font-weight: 800; letter-spacing: -.01em; }
        .hr-meta { font-size: 15px; line-height: 1.35; color: ${C.suave}; }

        @keyframes hrVeu { from { opacity: 0 } to { opacity: 1 } }
        @keyframes hrGaveta { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .hr-veu { position: fixed; inset: 0; z-index: 60; background: rgba(24,18,3,.3); animation: hrVeu .22s ease-out; }
        .hr-gaveta {
          position: fixed; top: 0; right: 0; z-index: 61; height: 100dvh; width: min(100%, 560px); overflow-y: auto; overscroll-behavior: contain;
          padding: 0 24px 32px; background: ${C.paper}; color: ${C.ink}; box-shadow: ${sombra("alto")}; animation: hrGaveta .3s cubic-bezier(.22, 1, .36, 1);
        }
        .hr-gaveta-topo { position: sticky; top: 0; z-index: 1; display: flex; align-items: flex-start; gap: 12px; padding: 20px 0 14px; background: ${C.paper}; border-bottom: ${borda()}; }
        .hr-gaveta-topo .s-rotulo { margin: 0 0 2px; }
        .hr-gaveta-nome { margin: 0; font-size: 26px; line-height: 1.2; font-weight: 800; letter-spacing: -.015em; }
        .hr-apelido { margin: 4px 0 0; font-size: 16.5px; color: ${C.suave}; font-style: italic; }
        .hr-fechar { flex: 0 0 auto; width: 44px; height: 44px; margin-right: -8px; display: grid; place-items: center; cursor: pointer; background: transparent; color: ${C.ink}; border: 0; border-radius: ${RAIO.p + 2}px; }
        .hr-fechar:hover { background: ${C.fundo}; }
        .hr-fechar:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
        .hr-datas { margin: 0; }
        .hr-datas div { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 10px; padding-block: 10px; border-bottom: ${borda()}; }
        .hr-datas dt { font-size: 15px; font-weight: 600; color: ${C.suave}; }
        .hr-datas dd { margin: 0; font-size: 16px; line-height: 1.45; }
        .hr-secao { margin-top: 22px; }
        .hr-secao h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-size: 17px; line-height: 1.3; font-weight: 800; }
        .hr-secao h3 span { display: grid; color: ${C.goldDim}; }
        .hr-secao p { margin: 0; font-size: 16.5px; line-height: 1.6; color: ${C.suave}; }

        @media (min-width: ${PONTOS.tablet}px) {
          .hr-filtros { grid-template-columns: 2fr 1fr 1fr; }
        }
        @media (max-width: ${PONTOS.tablet - 1}px) {
          .hr-cartao { padding: 14px; }
          .s-grade.s-grade-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .hr-nome { font-size: 17px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hr-veu, .hr-gaveta { animation: none; }
          .hr-cartao { transition: none; }
          .hr-cartao:hover { transform: none; }
        }
      `}</style>
    </PaginaDoSite>
  );
}
