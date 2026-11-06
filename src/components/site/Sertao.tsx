import React from "react";
import { C } from "@/lib/theme";

/**
 * O SERTÃO DE DIA — a ilustração do site.
 *
 * Os mesmos desenhos da cena animada que ficava atrás da home (serras,
 * mandacaru, carnaúba, jangada, aves), agora com luz: traço de tinta sobre
 * branco, o ouro nos morros, e numa faixa no pé da abertura em vez de um iframe
 * em tela cheia atrás do texto. Não briga com a leitura, não pesa no pré-pago
 * e é uma imagem só.
 *
 * `slice` corta as pontas no celular; por isso o que importa fica no miolo.
 * O traço não escala: em qualquer largura ele tem a mesma espessura.
 */
const TRACO = { vectorEffect: "non-scaling-stroke" as const };

function Mandacaru({ x, y, e = 1 }: { x: number; y: number; e?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${e})`} fill="none" stroke={C.ink} strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 0V-96" strokeWidth={12} />
      <path d="M0 -44H-20V-76" strokeWidth={9.5} />
      <path d="M0 -56H20V-90" strokeWidth={9.5} />
      <circle cx={0} cy={-100} r={4.5} fill={C.gold} strokeWidth={2} {...TRACO} />
      <circle cx={-20} cy={-80} r={3.5} fill={C.gold} strokeWidth={2} {...TRACO} />
    </g>
  );
}

function Carnauba({ x, y, e = 1 }: { x: number; y: number; e?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${e})`} fill="none" stroke={C.ink} strokeLinecap="round">
      <path d="M0 0V-132" strokeWidth={6} />
      <g strokeWidth={4}>
        <path d="M0 -132C-24 -142 -40 -142 -56 -134" />
        <path d="M0 -132C-22 -152 -38 -162 -50 -176" />
        <path d="M0 -132C-10 -156 -16 -174 -17 -194" />
        <path d="M0 -132C10 -156 16 -174 17 -194" />
        <path d="M0 -132C22 -152 38 -162 50 -176" />
        <path d="M0 -132C24 -142 40 -142 56 -134" />
      </g>
      <circle cx={0} cy={-130} r={4} fill={C.gold} strokeWidth={2} {...TRACO} />
    </g>
  );
}

function Tufo({ x, y, e = 1 }: { x: number; y: number; e?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${e})`}
      d="M0 0L-4 -30L3 0ZM0 0L-15 -24L-6 0ZM0 0L15 -24L6 0ZM0 0L-26 -12L-12 0ZM0 0L26 -12L12 0Z"
      fill={C.ink}
    />
  );
}

function Ave({ x, y, e = 1 }: { x: number; y: number; e?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${e})`}
      d="M-16 -6C-10 -11 -4 -10 0 -2C4 -10 10 -11 16 -6"
      fill="none"
      stroke={C.ink}
      strokeWidth={2.4}
      strokeLinecap="round"
      {...TRACO}
    />
  );
}

export function Sertao({ altura = "clamp(120px, 21vw, 280px)" }: { altura?: string }) {
  return (
    <svg
      viewBox="0 0 1440 280"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", width: "100%", height: altura }}
    >
      {/* as serras do fundo, brancas */}
      <path
        d="M-10 236L120 128L238 212L352 84L500 214L610 150L742 226L860 176L960 236Z"
        fill={C.paper}
        stroke={C.ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
        {...TRACO}
      />
      <path d="M352 84L322 150M352 84L392 146M120 128L96 178M120 128L150 172" fill="none" stroke={C.ink} strokeWidth={2} {...TRACO} />
      {/* os morros da frente, de ouro */}
      <path
        d="M-10 240L160 182L330 240L480 190L640 240Z"
        fill={C.gold}
        stroke={C.ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
        {...TRACO}
      />
      <path d="M720 240L860 206L1010 240Z" fill={C.gold} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" {...TRACO} />

      {/* o mar e a jangada */}
      <path d="M1000 240Q1040 232 1080 240T1160 240T1240 240T1320 240T1400 240T1480 240" fill="none" stroke={C.ink} strokeWidth={2.5} {...TRACO} />
      <path d="M1100 262Q1130 256 1160 262T1220 262T1280 262T1340 262T1400 262T1460 262" fill="none" stroke={C.goldDim} strokeWidth={2} {...TRACO} />
      <g fill={C.paper} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" {...TRACO}>
        <path d="M1216 226V112L1298 226Z" fill={C.gold} {...TRACO} />
        <path d="M1180 228H1302L1288 244Q1244 252 1194 244Z" fill={C.ink} {...TRACO} />
      </g>

      {/* o chão */}
      <path d="M-10 240H1010" fill="none" stroke={C.ink} strokeWidth={2.5} {...TRACO} />

      <Carnauba x={596} y={240} e={0.92} />
      <Carnauba x={930} y={240} e={0.72} />
      <Mandacaru x={250} y={240} e={1.05} />
      <Mandacaru x={726} y={240} e={0.86} />
      <Mandacaru x={70} y={240} e={0.7} />
      <Tufo x={420} y={240} />
      <Tufo x={846} y={240} e={0.8} />
      <Tufo x={164} y={240} e={0.8} />
      <Tufo x={1012} y={240} e={0.7} />

      <Ave x={620} y={46} />
      <Ave x={672} y={72} e={0.76} />
      <Ave x={1050} y={120} e={0.84} />
    </svg>
  );
}
