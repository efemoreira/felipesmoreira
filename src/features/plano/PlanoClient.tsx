"use client";
import React, { useEffect, useRef } from "react";
import { Icon, IconName } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { escada, times, semana, fases, regras } from "./data";

/* hachuras de xilogravura sobre o papel (mesma textura da página de heróis) */
const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

/* estrelas fixas das seções noturnas (posições determinísticas p/ SSG) */
const STARS: { l: number; t: number; s: number; d: number; g?: boolean }[] = [
  { l: 6, t: 12, s: 13, d: 0 }, { l: 16, t: 68, s: 9, d: 1.2 }, { l: 24, t: 28, s: 16, d: 2.1, g: true },
  { l: 36, t: 82, s: 10, d: 0.6 }, { l: 44, t: 16, s: 12, d: 1.8 }, { l: 57, t: 60, s: 9, d: 0.3 },
  { l: 66, t: 24, s: 15, d: 2.6, g: true }, { l: 74, t: 76, s: 11, d: 1.5 }, { l: 84, t: 40, s: 13, d: 0.9 },
  { l: 92, t: 14, s: 10, d: 2.2 }, { l: 12, t: 44, s: 8, d: 3 }, { l: 90, t: 84, s: 14, d: 1.1, g: true },
];

/* ===== Peças visuais ===== */

/* selo da onça (anéis girando — mesmo desenho do cordel) */
const Selo: React.FC<{ size?: number }> = ({ size = 168 }) => (
  <div style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
    <svg className="p-gira" viewBox="-4 -4 198 198" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
      <circle cx="95" cy="95" r="92" fill="none" stroke={C.gold} strokeWidth="4" strokeDasharray="3 11" />
      <circle cx="95" cy="95" r="82" fill="none" stroke={C.cream} strokeWidth="2" />
    </svg>
    <svg viewBox="-4 -4 198 198" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
      <g stroke={C.gold} strokeWidth="3">
        <line x1="95" y1="2" x2="95" y2="16" />
        <line x1="95" y1="174" x2="95" y2="188" />
        <line x1="2" y1="95" x2="16" y2="95" />
        <line x1="174" y1="95" x2="188" y2="95" />
      </g>
    </svg>
    <div
      style={{
        width: "58%",
        height: "58%",
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: C.cream,
        color: C.ink,
        boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 7px ${C.gold}, 0 0 0 10px ${C.ink}`,
      }}
    >
      <Icon name="flag" size={size * 0.26} />
    </div>
  </div>
);

/* garra: três riscos de ouro que se desenham quando a seção entra (transição "Garra") */
const Garra: React.FC = () => (
  <svg
    className="p-garra"
    viewBox="-8 -8 316 86"
    preserveAspectRatio="none"
    aria-hidden="true"
    style={{ display: "block", width: "min(420px, 70%)", height: 46, margin: "0 auto" }}
  >
    <g fill="none" stroke={C.gold} strokeWidth="6" strokeLinecap="round">
      <path pathLength={1} d="M18,2 C86,24 168,50 286,72" />
      <path pathLength={1} d="M6,24 C78,44 156,66 276,82" />
      <path pathLength={1} d="M44,-6 C110,14 190,40 300,56" />
    </g>
  </svg>
);

/* título de seção com a varredura de tinta (transição "Tinta") por baixo */
const Titulo: React.FC<{ chip: string; children: React.ReactNode; dark?: boolean }> = ({ chip, children, dark }) => (
  <header style={{ textAlign: "center", marginBottom: 34 }}>
    <p
      className="p-stamp"
      style={{
        display: "inline-block",
        fontFamily: FONT_ELITE,
        letterSpacing: 3,
        fontSize: 12,
        textTransform: "uppercase",
        color: C.ink,
        background: C.gold,
        padding: "4px 14px",
        boxShadow: "3px 3px 0 rgba(24,18,3,.35)",
        margin: "0 0 14px",
      }}
    >
      {chip}
    </p>
    <h2
      style={{
        fontFamily: FONT_ALFA,
        fontSize: "clamp(26px, 6vw, 40px)",
        letterSpacing: 0.6,
        lineHeight: 1.12,
        color: dark ? C.cream : C.ink,
        textShadow: dark ? `3px 3px 0 rgba(0,0,0,.5)` : `3px 3px 0 ${C.gold}`,
        margin: 0,
      }}
    >
      {children}
    </h2>
    <span className="p-tinta" aria-hidden="true" />
  </header>
);

/* céu estrelado das seções noturnas */
const Estrelas: React.FC = () => (
  <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {STARS.map((st, i) => (
      <b
        key={i}
        className="p-star"
        style={{
          position: "absolute",
          left: `${st.l}%`,
          top: `${st.t}%`,
          fontSize: st.s,
          color: st.g ? C.gold2 : C.cream,
          animationDelay: `${st.d}s`,
          fontStyle: "normal",
        }}
      >
        ✦
      </b>
    ))}
  </div>
);

/* borda serrilhada de xilogravura entre papel e noite */
const Serra: React.FC<{ flip?: boolean; cor: string }> = ({ flip, cor }) => (
  <svg
    viewBox="0 0 1200 40"
    preserveAspectRatio="none"
    aria-hidden="true"
    style={{ display: "block", width: "100%", height: 26, transform: flip ? "scaleY(-1)" : undefined }}
  >
    <path d="M0,40 L0,12 L50,34 L100,10 L150,32 L200,8 L250,34 L300,12 L350,30 L400,8 L450,34 L500,10 L550,32 L600,8 L650,34 L700,12 L750,30 L800,8 L850,34 L900,10 L950,32 L1000,8 L1050,34 L1100,12 L1150,30 L1200,10 L1200,40 Z" fill={cor} />
  </svg>
);

/* ===== A página ===== */

const PlanoClient: React.FC = () => {
  const progRef = useRef<HTMLDivElement>(null);

  /* revelação por scroll: entra e sai (fade in / fade out) */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle("in", e.isIntersecting)),
      { threshold: 0.16 }
    );
    els.forEach(el => io.observe(el));

    /* fita de progresso no topo */
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
        if (progRef.current) progRef.current.style.transform = `scaleX(${p})`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const noite: React.CSSProperties = {
    position: "relative",
    background: `linear-gradient(180deg, ${C.night} 0%, #1B160E 60%, ${C.night} 100%)`,
    color: C.cream,
  };
  const papel: React.CSSProperties = {
    position: "relative",
    background: `${HATCH}, ${C.paper}`,
    color: C.ink,
  };
  const secPad: React.CSSProperties = { maxWidth: 780, margin: "0 auto", padding: "72px 22px 84px" };

  return (
    <div style={{ background: C.night, fontFamily: FONT_BITTER, overflowX: "clip" }}>
      {/* fita de progresso */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", top: 0, left: 0, right: 0, height: 8, zIndex: 50, background: "rgba(24,18,3,.85)", borderBottom: `2px solid ${C.ink}` }}
      >
        <div ref={progRef} style={{ height: "100%", background: C.gold, transform: "scaleX(0)", transformOrigin: "left" }} />
      </div>

      {/* ===================== CAPA ===================== */}
      <section style={{ ...noite, minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <Estrelas />
        <div data-reveal style={{ position: "relative", textAlign: "center", padding: "80px 22px 90px", maxWidth: 640 }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 26 }}>
            <Selo />
          </div>
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
              boxShadow: "3px 3px 0 rgba(24,18,3,.5)",
              marginBottom: 16,
            }}
          >
            Missão Ceará · apresentação à militância
          </p>
          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(52px, 14vw, 96px)",
              lineHeight: 0.98,
              letterSpacing: 2,
              color: C.gold,
              textShadow: `4px 4px 0 ${C.ink}, 8px 8px 0 rgba(0,0,0,.35)`,
              margin: "0 0 16px",
            }}
          >
            O PLANO
          </h1>
          <p style={{ fontSize: "clamp(16px, 4vw, 19px)", lineHeight: 1.55, margin: "0 auto", maxWidth: 480, textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>
            De grupo de WhatsApp à militância mais organizada do Ceará —
            daqui até outubro, com lugar pra quem tem dez horas por semana
            e pra quem tem trinta minutos.
          </p>
          <div className="p-hint" aria-hidden="true" style={{ marginTop: 44, display: "grid", placeItems: "center", color: C.gold }}>
            <span style={{ fontFamily: FONT_ELITE, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
              role pra descer o sertão
            </span>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ===================== O PONTO DE PARTIDA ===================== */}
      <Serra cor={C.paper} />
      <section style={papel}>
        <div data-reveal style={secPad}>
          <Titulo chip="Capítulo 1">O ponto de partida</Titulo>
          <div
            style={{
              background: C.cream,
              border: `3px solid ${C.ink}`,
              boxShadow: "6px 6px 0 rgba(24,18,3,.3)",
              padding: "26px 26px",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: FONT_ALFA, fontSize: "clamp(26px, 7vw, 44px)", lineHeight: 1.05, margin: "0 0 10px", color: C.ink }}>
              450 <span style={{ color: C.goldDim }}>pessoas</span>
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0 }}>
              É esse o tamanho do nosso grupo. E a verdade, dita com respeito:
              <strong> a gente nunca usou nem um décimo dessa força.</strong> Não é culpa
              de ninguém — é que ninguém nunca organizou isso direito.
            </p>
          </div>
          <p
            className="p-stamp"
            style={{
              textAlign: "center",
              fontFamily: FONT_ELITE,
              fontSize: "clamp(15px, 4vw, 18px)",
              letterSpacing: 2,
              textTransform: "uppercase",
              margin: "30px 0 0",
            }}
          >
            ✦ Isso muda agora ✦
          </p>
        </div>
      </section>
      <Serra flip cor={C.paper} />

      {/* ===================== A MISSÃO ===================== */}
      <section style={noite}>
        <Estrelas />
        <div data-reveal style={secPad}>
          <Titulo dark chip="Capítulo 2">Por que isso importa</Titulo>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "world" as IconName, t: "Uma missão concreta", d: "Não somos torcida. Temos candidaturas de verdade em jogo — da presidência ao governo do Ceará aos deputados — e cada uma depende de militância organizada, não de curtida." },
              { icon: "bolt" as IconName, t: "Uma missão mensurável", d: "Eleger deputados é o que garante a sobrevivência do projeto. Isso se conta em voto, e voto se constrói na rua e na conversa — exatamente o que este plano organiza." },
              { icon: "heartHandshake" as IconName, t: "Uma missão nossa", d: "Devolver aos do Cearenses a liberdade de sonhar que os políticos e o crime organizado roubaram. É por isso que a gente se organiza — o resto é ferramenta." },
            ].map((b, i) => (
              <div
                key={b.t}
                className="p-stagger"
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  background: "rgba(24,18,3,.55)",
                  border: `2px solid ${C.goldDim}`,
                  padding: "18px 20px",
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <span style={{ width: 42, height: 42, flex: "0 0 auto", display: "grid", placeItems: "center", background: C.gold, border: `2px solid ${C.ink}`, color: C.ink }}>
                  <Icon name={b.icon} size={22} />
                </span>
                <span>
                  <span style={{ display: "block", fontFamily: FONT_ALFA, fontSize: 17, letterSpacing: 0.4, marginBottom: 4, color: C.gold2 }}>{b.t}</span>
                  <span style={{ display: "block", fontSize: 14.5, lineHeight: 1.6, opacity: 0.95 }}>{b.d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== A ESCADA ===================== */}
      <Serra cor={C.paper} />
      <section style={papel}>
        <div data-reveal style={secPad}>
          <Titulo chip="Capítulo 3">Como se entra</Titulo>
          <p style={{ textAlign: "center", fontSize: 15.5, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 30px" }}>
            <strong>Ninguém preenche formulário.</strong> Aqui as pessoas conversam —
            com o Levi, nosso secretário. São cinco passos, um de cada vez: cada degrau
            é fácil, e o próximo só chega pra quem subiu o anterior.
          </p>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {escada.map((d, i) => (
              <li
                key={d.titulo}
                className="p-stagger"
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  background: C.cream,
                  border: `3px solid ${C.ink}`,
                  boxShadow: "4px 4px 0 rgba(24,18,3,.28)",
                  padding: "14px 16px",
                  marginLeft: `min(${i * 5}%, ${i * 26}px)`,
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <span style={{ width: 40, height: 40, flex: "0 0 auto", display: "grid", placeItems: "center", background: C.gold, border: `2px solid ${C.ink}`, color: C.ink }}>
                  <Icon name={d.icon} size={20} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: FONT_ELITE, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.65 }}>{d.passo}</span>
                  <span style={{ display: "block", fontFamily: FONT_ALFA, fontSize: 16, letterSpacing: 0.3, margin: "2px 0 3px" }}>{d.titulo}</span>
                  <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.55, opacity: 0.85 }}>{d.detalhe}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Serra flip cor={C.paper} />

      {/* ===================== OS TIMES ===================== */}
      <section style={noite}>
        <Estrelas />
        <div data-reveal style={secPad}>
          <Titulo dark chip="Capítulo 4">Ninguém milita sozinho</Titulo>
          <p style={{ textAlign: "center", fontSize: 15.5, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 30px", textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>
            Ninguém pertence &ldquo;ao movimento&rdquo; — todo mundo pertence a um
            <strong> time de 8 a 14 pessoas</strong>, com coordenador, grupo próprio
            e trabalho de verdade. Você escolhe a sua frente:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
            {times.map((t, i) => (
              <div
                key={t.nome}
                className="p-stagger"
                style={{
                  background: C.paper,
                  border: `3px solid ${C.ink}`,
                  boxShadow: `5px 5px 0 rgba(0,0,0,.45)`,
                  padding: "18px 18px 16px",
                  color: C.ink,
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", background: C.ink, color: C.gold, border: `2px solid ${C.ink}`, marginBottom: 10 }}>
                  <Icon name={t.icon} size={24} />
                </span>
                <p style={{ fontFamily: FONT_ALFA, fontSize: 18, letterSpacing: 0.4, margin: "0 0 6px" }}>{t.nome}</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0, opacity: 0.85 }}>{t.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontFamily: FONT_ELITE, fontSize: 12.5, letterSpacing: 1.5, margin: "26px 0 0", color: C.gold2 }}>
            E antes de toda reunião: 20 minutos de formação. Sempre. É assim que a gente aprende junto.
          </p>
        </div>
      </section>

      {/* ===================== A SEMANA ===================== */}
      <Serra cor={C.paper} />
      <section style={papel}>
        <div data-reveal style={secPad}>
          <Titulo chip="Capítulo 5">A semana que se repete</Titulo>
          <p style={{ textAlign: "center", fontSize: 15.5, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 30px" }}>
            A previsibilidade é o que cria hábito. Quando a campanha esquenta,
            toda semana tem a mesma espinha — e você sabe de véspera onde é o seu lugar nela.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {semana.map((s, i) => (
              <div
                key={s.dia}
                className="p-stagger"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: C.cream,
                  border: `2px solid ${C.ink}`,
                  boxShadow: "3px 3px 0 rgba(24,18,3,.22)",
                  padding: "10px 14px",
                  transitionDelay: `${i * 0.07}s`,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_ALFA,
                    fontSize: 13,
                    letterSpacing: 1,
                    background: i >= 5 ? C.gold : C.ink,
                    color: i >= 5 ? C.ink : C.gold,
                    border: `2px solid ${C.ink}`,
                    padding: "4px 10px",
                    flex: "0 0 auto",
                    minWidth: 58,
                    textAlign: "center",
                  }}
                >
                  {s.dia}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.45 }}>{s.oq}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Serra flip cor={C.paper} />

      {/* ===================== O CALENDÁRIO ===================== */}
      <section style={noite}>
        <Estrelas />
        <div data-reveal style={secPad}>
          <Titulo dark chip="Capítulo 6">O caminho até outubro — e depois</Titulo>
          <div style={{ position: "relative", paddingLeft: 26 }}>
            {/* linha do cordel */}
            <span aria-hidden="true" style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 4, background: C.goldDim, boxShadow: `0 0 0 2px ${C.ink}` }} />
            {fases.map((f, i) => (
              <div key={f.titulo} className="p-stagger" style={{ position: "relative", marginBottom: i === fases.length - 1 ? 0 : 26, transitionDelay: `${i * 0.1}s` }}>
                <span
                  aria-hidden="true"
                  style={{ position: "absolute", left: -26, top: 4, width: 18, height: 18, borderRadius: "50%", background: C.gold, border: `3px solid ${C.ink}`, boxShadow: `0 0 0 2px ${C.gold}` }}
                />
                <p style={{ fontFamily: FONT_ELITE, fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: C.gold2, margin: "0 0 4px" }}>{f.quando}</p>
                <p style={{ fontFamily: FONT_ALFA, fontSize: 19, letterSpacing: 0.4, margin: "0 0 8px" }}>{f.titulo}</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  {f.itens.map(item => (
                    <li key={item} style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.92 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== AS REGRAS ===================== */}
      <Serra cor={C.paper} />
      <section style={papel}>
        <div data-reveal style={secPad}>
          <Titulo chip="Capítulo 7">As regras do jogo</Titulo>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {regras.map((r, i) => (
              <span
                key={r}
                className="p-stamp"
                style={{
                  fontFamily: FONT_ELITE,
                  fontSize: 13,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  background: i % 2 === 0 ? C.ink : C.gold,
                  color: i % 2 === 0 ? C.gold : C.ink,
                  border: `3px solid ${C.ink}`,
                  boxShadow: "4px 4px 0 rgba(24,18,3,.3)",
                  padding: "10px 16px",
                  transform: `rotate(${i % 2 === 0 ? -1.2 : 1.4}deg)`,
                  animationDelay: `${i * 0.09}s`,
                }}
              >
                {r}
              </span>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 14.5, lineHeight: 1.6, maxWidth: 520, margin: "30px auto 0" }}>
            O número que manda não é tamanho de grupo, visualização nem curtida.
            É <strong>gente com nome, tarefa e prazo</strong>. Tudo neste plano
            existe pra fazer esse número crescer.
          </p>
        </div>
      </section>
      <Serra flip cor={C.paper} />

      {/* ===================== O CHAMADO ===================== */}
      <section
        style={{
          position: "relative",
          background: `radial-gradient(circle at 50% 130%, ${C.gold} 0%, ${C.goldDim} 46%, ${C.ink} 82%)`,
          color: C.cream,
          overflow: "hidden",
        }}
      >
        {/* sol de xilogravura girando no horizonte */}
        <svg
          className="p-gira"
          viewBox="-6 -6 160 160"
          aria-hidden="true"
          style={{ position: "absolute", left: "50%", bottom: -70, width: 220, height: 220, marginLeft: -110, opacity: 0.9 }}
        >
          <g fill={C.gold} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round">
            {Array.from({ length: 12 }).map((_, i) => (
              <polygon key={i} points={i % 2 === 0 ? "70,46 78,46 74,4" : "71,47 77,47 74,20"} transform={`rotate(${i * 30} 74 74)`} />
            ))}
          </g>
          <circle cx="74" cy="74" r="30" fill={C.gold} stroke={C.ink} strokeWidth="4" />
        </svg>

        <div data-reveal style={{ ...secPad, textAlign: "center", paddingBottom: 150 }}>
          <Garra />
          <h2
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(26px, 7vw, 42px)",
              lineHeight: 1.15,
              letterSpacing: 0.6,
              textShadow: `3px 3px 0 ${C.ink}`,
              margin: "20px 0 14px",
            }}
          >
            A escolha é simples
          </h2>
          <p style={{ fontSize: "clamp(15.5px, 4vw, 18px)", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 26px", textShadow: "0 1px 6px rgba(0,0,0,.5)" }}>
            Continuar sendo 450 pessoas num grupo — ou virar a militância mais
            organizada deste estado. Tem lugar pra você, do jeito que a sua vida permite.
          </p>

          {/* os dois caminhos — ninguém fica de fora (fecho da live, doc 1.3) */}
          <div style={{ display: "grid", gap: 12, maxWidth: 470, margin: "0 auto 30px", textAlign: "left" }}>
            <div style={caminho}>
              <span style={caminhoTag}>✦ quem vai construir</span>
              <span style={caminhoTxt}>
                Manda <strong>EQUIPE</strong> pro Levi e aparece na{" "}
                <strong>primeira reunião, quarta às 19h30</strong> — é ali que cada
                um sai com time e a primeira tarefa.
              </span>
            </div>
            <div style={caminho}>
              <span style={caminhoTag}>✦ quem não pode agora</span>
              <span style={caminhoTxt}>
                Fica tranquilo: <strong>ninguém sai, ninguém é removido</strong>. O
                grupo continua sendo de todos — e a porta fica aberta pra quando der.
              </span>
            </div>
          </div>

          <a
            href="https://wa.me/5585981872972?text=EQUIPE"
            target="_blank"
            rel="noopener noreferrer"
            className="p-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              background: C.gold,
              border: `3px solid ${C.ink}`,
              boxShadow: `6px 6px 0 ${C.ink}`,
              color: C.ink,
              padding: "16px 26px",
            }}
          >
            <Icon name="whatsapp" size={26} />
            <span style={{ fontFamily: FONT_ALFA, fontSize: "clamp(15px, 4vw, 18px)", letterSpacing: 0.5 }}>
              Manda a palavra EQUIPE
            </span>
          </a>
          <p style={{ fontFamily: FONT_ELITE, fontSize: 12, letterSpacing: 2, margin: "16px 0 0", opacity: 0.9, textShadow: "0 1px 5px rgba(0,0,0,.5)" }}>
            uma palavra · uma conversa de 3 minutos · um time esperando você
          </p>
        </div>

        {/* fita rolando no rodapé */}
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            borderTop: `3px solid ${C.ink}`,
            borderBottom: `3px solid ${C.ink}`,
            background: C.gold,
            overflow: "hidden",
            height: 42,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="p-roll" style={{ display: "flex", whiteSpace: "nowrap" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <React.Fragment key={i}>
                <span style={rollSpan}>MISSÃO CEARÁ</span>
                <span style={rollSpan}>O FUTURO É GLORIOSO</span>
                <span style={rollSpan}>DA CAATINGA AO MAR</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ===== animações de scroll + respeito a reduced-motion ===== */}
      <style>{`
        [data-reveal] { opacity: 0; transform: translateY(30px); transition: opacity .75s ease, transform .75s ease; }
        [data-reveal].in { opacity: 1; transform: none; }
        [data-reveal] .p-stagger { opacity: 0; transform: translateY(22px); transition: opacity .65s ease, transform .65s ease; }
        [data-reveal].in .p-stagger { opacity: 1; transform: none; }
        [data-reveal] .p-stamp { opacity: 0; }
        [data-reveal].in .p-stamp { animation: pStamp .6s cubic-bezier(.2,1.25,.3,1) both; }
        @keyframes pStamp {
          0% { opacity: 0; transform: scale(1.3) rotate(-4deg); }
          60% { opacity: 1; transform: scale(.96) rotate(1.6deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .p-tinta { display: block; width: 120px; height: 6px; margin: 14px auto 0; background: ${C.gold}; box-shadow: 2px 2px 0 rgba(24,18,3,.4); transform: scaleX(0); transform-origin: left; transition: transform .8s cubic-bezier(.7,0,.3,1) .15s; }
        [data-reveal].in .p-tinta { transform: scaleX(1); }
        .p-garra path { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; transition: stroke-dashoffset .9s ease, opacity .3s ease; }
        [data-reveal].in .p-garra path { stroke-dashoffset: 0; opacity: 1; }
        [data-reveal].in .p-garra path:nth-child(1) { transition-delay: .05s; }
        [data-reveal].in .p-garra path:nth-child(2) { transition-delay: .17s; }
        [data-reveal].in .p-garra path:nth-child(3) { transition-delay: .29s; }
        .p-garra g path { stroke-dasharray: 1; }
        .p-gira { animation: pGira 30s linear infinite; transform-origin: center; }
        @keyframes pGira { to { transform: rotate(360deg); } }
        .p-star { animation: pPisca 3.8s ease-in-out infinite; }
        @keyframes pPisca { 0%, 100% { opacity: .15; } 50% { opacity: .95; } }
        .p-hint { animation: pHint 1.8s ease-in-out infinite; }
        @keyframes pHint { 0%, 100% { transform: translateY(0); opacity: .85; } 50% { transform: translateY(9px); opacity: 1; } }
        .p-roll { animation: pRoll 24s linear infinite; }
        @keyframes pRoll { to { transform: translateX(-50%); } }
        .p-cta { transition: transform .12s ease, box-shadow .12s ease; }
        .p-cta:hover { transform: translate(-2px,-2px); box-shadow: 8px 8px 0 ${C.ink}; }
        .p-cta:active { transform: translate(2px,2px); box-shadow: 3px 3px 0 ${C.ink}; }
        .p-cta:focus-visible { outline: 3px solid ${C.cream}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          [data-reveal], [data-reveal] .p-stagger, [data-reveal] .p-stamp, .p-tinta, .p-garra path { opacity: 1 !important; transform: none !important; transition: none !important; animation: none !important; stroke-dashoffset: 0 !important; }
          .p-gira, .p-star, .p-hint, .p-roll, .p-cta { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

const rollSpan: React.CSSProperties = {
  fontFamily: FONT_ALFA,
  fontSize: 14,
  letterSpacing: 2,
  color: C.ink,
  padding: "0 26px",
};

/* os dois caminhos do fecho (quem constrói / quem não pode agora) */
const caminho: React.CSSProperties = {
  display: "block",
  background: "rgba(24,18,3,.72)",
  border: `2px solid ${C.ink}`,
  boxShadow: "4px 4px 0 rgba(24,18,3,.45)",
  padding: "13px 16px",
};
const caminhoTag: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_ELITE,
  fontSize: 10.5,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: C.gold2,
  marginBottom: 5,
};
const caminhoTxt: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  lineHeight: 1.55,
  color: C.cream,
};

export default PlanoClient;
