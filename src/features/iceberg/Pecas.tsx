"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CAMADAS, IMAGENS, NATUREZAS, SERIES } from "./data";
import { dominio, tempo } from "./dominio";
import type { Fonte, Imagem, Pessoa, Verbete, Video } from "./tipos";

export function LinkFonte({ fonte }: { fonte: Fonte }) {
  return <a className="ig-fonte" href={fonte.url} target="_blank" rel="noopener noreferrer"><strong>{fonte.title || dominio(fonte.url)} <span aria-hidden>↗</span></strong><small>{fonte.publisher ?? dominio(fonte.url)}</small></a>;
}

export function Fotografia({ imagem, pequena = false }: { imagem: Imagem; pequena?: boolean }) {
  const data = imagem.date && /^\d{4}-\d{2}-\d{2}$/.test(imagem.date) && !imagem.caption.includes(imagem.date.slice(0, 4)) ? imagem.date.split("-").reverse().join("/") : "";
  return <figure className={`ig-foto ${pequena ? "ig-foto-pequena" : ""} ${imagem.kind === "portrait" ? "ig-retrato" : ""}`}>
    <a href={imagem.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver origem da fotografia: ${imagem.alt}`}><Image src={imagem.src} alt={imagem.alt} width={960} height={640} loading="lazy" /></a>
    <figcaption><p>{imagem.caption}{data ? ` · ${data}` : ""}</p><span>Foto: {imagem.credit}. <a href={imagem.sourceUrl} target="_blank" rel="noopener noreferrer">Origem ↗</a> · <a href={imagem.licenseUrl || imagem.sourceUrl} target="_blank" rel="noopener noreferrer">{imagem.license}</a>{imagem.modifications ? ` · ${imagem.modifications}` : " · Redimensionada; recorte de exibição."}</span></figcaption>
  </figure>;
}

export function Player({ video, inicio = 0 }: { video: Video; inicio?: number }) {
  const [tocando, tocar] = useState(false);
  const [segundos, mudarSegundos] = useState(inicio);
  useEffect(() => { mudarSegundos(inicio); tocar(false); }, [video.id, inicio]);
  return <div className="ig-player-bloco">
    <div className="ig-player">{tocando ? <iframe key={`${video.id}-${segundos}`} src={`https://www.youtube-nocookie.com/embed/${video.id}?start=${Math.floor(segundos)}&autoplay=1`} title={`${video.title} — a partir de ${tempo(segundos)}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button className="ig-play" onClick={() => tocar(true)} aria-label={`Assistir ${video.title} a partir de ${tempo(segundos)}`}><Image src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={`Capa original do vídeo ${video.title}`} width={480} height={360} unoptimized /><span className="ig-play-simbolo" aria-hidden>▶</span><span className="ig-play-rotulo">ASSISTIR · {segundos > 0 ? tempo(segundos) : video.duration}</span></button>}</div>
    <p className="ig-player-credito">Vídeo e capa: {video.author}. <a href={`${video.url}&t=${Math.floor(segundos)}s`} target="_blank" rel="noopener noreferrer">Abrir no YouTube ↗</a></p>
    {video.chapters.length > 0 && <details className="ig-capitulos"><summary>Navegar por {video.id === "ITTR_Z8flRE" || video.id === "y3Bx3WgxNX0" ? "camadas do vídeo" : "capítulos editoriais"} <span>+</span></summary><div>{video.chapters.map((c, i) => <button key={c.seconds} onClick={() => { mudarSegundos(c.seconds); tocar(true); }}><span>{tempo(c.seconds)}</span> {c.title ?? `Camada ${i + 1} — ${CAMADAS[i]}`}</button>)}</div></details>}
    {video.id === "vlejVaeZYUQ" && <button className="ig-link" onClick={() => { mudarSegundos(2010); tocar(true); }}>Ir ao trecho do link enviado · 33:30 ↗</button>}
  </div>;
}

export function CartaoVerbete({ verbete, abrir }: { verbete: Verbete; abrir: (id: string) => void }) {
  const imagem = IMAGENS.find(i => i.kind === "event" && i.eventIds.includes(verbete.id));
  return <article className={`ig-verbete ig-serie-${verbete.series}`}>
    <div className="ig-linha-topo"><span className="ig-serie">{SERIES[verbete.series]}</span><span className={`ig-selo ig-${verbete.status}`}>{NATUREZAS[verbete.status]}</span></div>
    <button className="ig-abrir-verbete" onClick={() => abrir(verbete.id)}><h3>{verbete.title}</h3><span aria-hidden>↗</span></button>
    <p>{verbete.summary}</p>
    {imagem && <Fotografia imagem={imagem} pequena />}
    <div className="ig-verbete-rodape"><span>{verbete.dateLabel}</span><span>{verbete.sources.length} referências{verbete.documentPage ? ` · PDF p. ${verbete.documentPage}` : ""}</span>{verbete.layer && <span>Camada {verbete.layer}</span>}</div>
  </article>;
}

export function CartaoPessoa({ pessoa, abrir }: { pessoa: Pessoa; abrir: (nome: string) => void }) {
  return <article className="ig-pessoa">
    <button className="ig-pessoa-abrir" onClick={() => abrir(pessoa.nome)}>
      {pessoa.imagem ? <Image src={pessoa.imagem.src} alt={pessoa.imagem.alt} width={400} height={400} loading="lazy" /> : <span className="ig-iniciais" aria-hidden>{pessoa.nome.split(" ").filter(n => n.length > 2).slice(0, 2).map(n => n[0]).join("")}</span>}
      <span className="ig-pessoa-texto"><strong>{pessoa.nome}</strong><small>{pessoa.biografia?.role ?? pessoa.perfil?.role ?? `${pessoa.verbetes.length} menções no acervo`}</small>{pessoa.biografia && <span className="ig-pessoa-extrato">{pessoa.biografia.introduction.text.length > 170 ? pessoa.biografia.introduction.text.slice(0, 170).replace(/\s+\S*$/, "") + "…" : pessoa.biografia.introduction.text}</span>}<span className="ig-pessoa-series">{[...new Set(pessoa.verbetes.map(v => v.series))].map(s => <span key={s}>{SERIES[s]}</span>)}</span></span>
    </button>
    {pessoa.imagem && <p className="ig-mini-credito">Foto: {pessoa.imagem.credit}. <a href={pessoa.imagem.sourceUrl} target="_blank" rel="noopener noreferrer">Origem e licença ↗</a></p>}
  </article>;
}

export function Janela({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const overflow = document.body.style.overflow;
    el?.showModal(); document.body.style.overflow = "hidden";
    return () => { el?.close(); document.body.style.overflow = overflow; anterior?.focus(); };
  }, []);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [titulo]);
  return <dialog className="ig-janela" ref={ref} aria-labelledby="ig-janela-titulo" onCancel={e => { e.preventDefault(); fechar(); }} onClick={e => { if (e.target === ref.current) { const r = ref.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) fechar(); } }}>
    <div className="ig-janela-barra"><span>ARQUIVO ICEBERG / LEITURA</span><button onClick={fechar} aria-label="Fechar detalhes">✕</button></div>
    <div className="ig-janela-miolo"><h2 id="ig-janela-titulo">{titulo}</h2>{children}</div>
  </dialog>;
}

export function ListaRelacionados({ verbetes, abrir }: { verbetes: Verbete[]; abrir: (id: string) => void }) {
  return <div className="ig-relacionados">{verbetes.map(v => <button key={v.id} onClick={() => abrir(v.id)}><span><small>{v.dateLabel} · {SERIES[v.series]}</small><strong>{v.title}</strong></span><span aria-hidden>↗</span></button>)}</div>;
}
