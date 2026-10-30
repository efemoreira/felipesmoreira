import React from "react";
import Link from "next/link";
import { PESSOAS, SERIES, VERBETES, inicioDoVerbete, videoDoVerbete } from "./data";
import { enderecoPessoa, nomeCanonico, ordenar, tempo } from "./dominio";
import { fontesBiografia } from "./biografias";
import { Fotografia, LinkFonte, Player } from "./Pecas";
import type { Fonte, Pessoa } from "./tipos";

/** Liga somente nomes identificados, preservando o papel descrito no texto. */
function TextoComLigacoes({ texto, propria }: { texto: string; propria: string }) {
  const variantes = new Map(PESSOAS.filter(p => p.nome !== propria).map(p => [p.nome, p.nome]));
  if (propria !== "Luiz Inácio Lula da Silva") variantes.set("Lula", "Luiz Inácio Lula da Silva");
  if (propria !== "Movimento Brasil Livre (MBL)") variantes.set("MBL", "Movimento Brasil Livre (MBL)");
  const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nomes = [...variantes.keys()].sort((a, b) => b.length - a.length);
  const expressao = new RegExp(`(?<![\\p{L}\\p{N}])(${nomes.map(escapar).join("|")})(?![\\p{L}\\p{N}])`, "gu");
  const partes: React.ReactNode[] = [];
  let ultimo = 0;
  for (const ocorrencia of texto.matchAll(expressao)) {
    const posicao = ocorrencia.index!;
    partes.push(texto.slice(ultimo, posicao));
    partes.push(<Link key={posicao} href={enderecoPessoa(variantes.get(ocorrencia[0])!)} prefetch={false}>{ocorrencia[0]}</Link>);
    ultimo = posicao + ocorrencia[0].length;
  }
  partes.push(texto.slice(ultimo));
  return <>{partes}</>;
}

export default function ArtigoPessoa({ pessoa, resumido = false }: { pessoa: Pessoa; resumido?: boolean }) {
  const bio = pessoa.biografia;
  const perfil = pessoa.perfil;
  const fontes = new Map<string, Fonte>();
  for (const fonte of [...(bio ? fontesBiografia(bio) : []), ...(perfil?.sources ?? []), ...(perfil?.relationships.map(r => r.source) ?? []), ...pessoa.complementos.flatMap(c => [c.source, ...(c.additionalSources ?? [])]), ...pessoa.verbetes.flatMap(v => v.sources)]) {
    if (!fontes.has(fonte.url)) fontes.set(fonte.url, fonte);
  }
  const referencias = [...fontes.values()];
  function Citacoes({ lista }: { lista: Fonte[] }) {
    return <span className="ig-citacoes">{[...new Set(lista.map(f => f.url))].map(url => {
      const indice = referencias.findIndex(f => f.url === url) + 1;
      return <sup key={url}><a href={`#fonte-${pessoa.slug}-${indice}`} aria-label={`Referência ${indice}`}>[{indice}]</a></sup>;
    })}</span>;
  }
  const relatos = bio?.inArchive ?? [];
  const episodios = ordenar(pessoa.verbetes, "antigos");
  const primeiros = relatos.flatMap(r => r.verbeteIds).map(id => VERBETES.find(v => v.id === id)).filter(v => v !== undefined);
  const trecho = primeiros.find(v => videoDoVerbete(v));
  const video = trecho && videoDoVerbete(trecho);
  const id = (secao: string) => `artigo-${pessoa.slug}-${secao}`;

  return <article className={`ig-artigo ${resumido ? "ig-artigo-resumido" : ""}`}>
    {resumido && <p><Link className="ig-botao" href={enderecoPessoa(pessoa.nome)} prefetch={false}>Abrir o verbete completo ↗</Link></p>}
    <div className="ig-artigo-apresentacao"><span>VERBETE BIOGRÁFICO</span><span>Revisão: {(bio?.reviewedAt ?? "2026-10-27").split("-").reverse().join("/")}</span></div>
    <div className="ig-artigo-layout">
      <div className="ig-artigo-texto">
        <section id={id("quem-e")} className="ig-artigo-lead" aria-label="Quem é">
          <p><TextoComLigacoes texto={bio?.introduction.text ?? perfil?.summary ?? ""} propria={pessoa.nome} /><Citacoes lista={bio?.introduction.sources ?? perfil?.sources ?? []} /></p>
        </section>
        <nav className="ig-artigo-indice" aria-label="Neste verbete"><strong>Neste verbete</strong><ol><li><a href={`#${id("trajetoria")}`}>Trajetória e contexto público</a></li><li><a href={`#${id("narrativas")}`}>O que os vídeos contam e o que aconteceu</a></li>{pessoa.complementos.length > 0 && <li><a href={`#${id("desfechos")}`}>Registros e desfechos documentados</a></li>}{perfil && <li><a href={`#${id("relacoes")}`}>Relações nesta história</a></li>}<li><a href={`#${id("episodios")}`}>Episódios e documentos para aprofundar</a></li><li><a href={`#${id("fontes")}`}>Referências</a></li></ol></nav>
        <section className="ig-artigo-secao" id={id("trajetoria")}><h2>Trajetória e contexto público</h2>{bio?.trajectory.map((t, i) => <div key={i}><h3>{t.title}</h3><p><TextoComLigacoes texto={t.text} propria={pessoa.nome} /><Citacoes lista={t.sources} /></p></div>)}</section>
        <section className="ig-artigo-secao" id={id("narrativas")}><h2>O que os vídeos contam e o que aconteceu</h2>{relatos.map((r, i) => {
          const casos = r.verbeteIds.map(identificador => VERBETES.find(v => v.id === identificador)).filter(v => v !== undefined);
          return <section className="ig-artigo-relato" key={i}><h3>{r.title}</h3><p><TextoComLigacoes texto={r.text} propria={pessoa.nome} /><Citacoes lista={casos.flatMap(v => v.sources).slice(0, 4)} /></p><div className="ig-artigo-evidencias">{casos.map(v => {
            const filme = videoDoVerbete(v);
            return <div key={v.id}><a href={`/iceberg#verbete/${encodeURIComponent(v.id)}`}>{v.title} ↗</a>{filme && <a href={`${filme.url}&t=${Math.floor(inicioDoVerbete(v))}s`} target="_blank" rel="noopener noreferrer">Vídeo · {tempo(inicioDoVerbete(v))} ↗</a>}{filme?.document && v.documentPage && <a href={`${filme.document}#page=${v.documentPage}`} target="_blank" rel="noopener noreferrer">Documento · p. {v.documentPage} ↗</a>}</div>;
          })}</div></section>;
        })}<p className="ig-artigo-contexto">Os textos distinguem a narrativa dos autores dos acontecimentos e desfechos registrados. As referências de cada passagem permitem consultar o trecho e seus documentos.</p></section>
        {pessoa.complementos.length > 0 && <section className="ig-artigo-secao" id={id("desfechos")}><h2>Registros e desfechos documentados</h2>{pessoa.complementos.map(c => <section key={c.id} className="ig-artigo-registro"><p className="ig-kicker">{c.date.split("-").reverse().join("/")} · {c.classification}</p><h3>{c.title}</h3><p><TextoComLigacoes texto={c.text} propria={pessoa.nome} /><Citacoes lista={[c.source, ...(c.additionalSources ?? [])]} /></p></section>)}</section>}
        {perfil && <section className="ig-artigo-secao" id={id("relacoes")}><h2>Relações nesta história</h2><dl className="ig-artigo-relacoes">{perfil.relationships.map((r, i) => <div key={i}><dt>{PESSOAS.some(p => p.nome === nomeCanonico(r.target)) ? <Link href={enderecoPessoa(r.target)} prefetch={false}>{r.target}</Link> : r.target}</dt><dd>{r.relation}<Citacoes lista={[r.source]} /><a className="ig-artigo-origem" href={r.source.url} target="_blank" rel="noopener noreferrer">Fonte da relação ↗</a></dd></div>)}</dl></section>}
        <section className="ig-artigo-secao" id={id("episodios")}><h2>Episódios e documentos para aprofundar</h2>{trecho && video && <div className="ig-artigo-trecho"><p className="ig-kicker">UM TRECHO PARA ACOMPANHAR A LEITURA</p><Player video={video} inicio={inicioDoVerbete(trecho)} /></div>}<details className="ig-artigo-cronologia"><summary>Consultar os {episodios.length} episódios relacionados <span>+</span></summary><ol>{episodios.map(v => <li key={v.id}><p className="ig-kicker">{v.dateLabel} · {SERIES[v.series]}</p><h3>{v.title}</h3><p>{v.summary}</p><p><strong>Desfecho do episódio:</strong> {v.outcome}</p><a href={`/iceberg#verbete/${encodeURIComponent(v.id)}`}>Ler o episódio e suas referências ↗</a></li>)}</ol></details></section>
        <section className="ig-artigo-secao" id={id("fontes")}><h2>Referências</h2><ol className="ig-artigo-fontes">{referencias.map((f, i) => <li id={`fonte-${pessoa.slug}-${i + 1}`} key={f.url}><LinkFonte fonte={f} /></li>)}</ol></section>
      </div>
      <aside className="ig-artigo-ficha" aria-label={`Ficha de ${pessoa.nome}`}>
        <div className="ig-artigo-ficha-miolo"><h2>{pessoa.nome}</h2>{pessoa.imagem && <Fotografia imagem={pessoa.imagem} />}<dl><div><dt>Atuação</dt><dd>{bio?.role ?? perfil?.role}</dd></div>{bio?.facts.map((f, i) => <div key={i}><dt>{f.label}</dt><dd>{f.value}<Citacoes lista={f.sources} /></dd></div>)}<div><dt>Narrativas relacionadas</dt><dd>{[...new Set(pessoa.verbetes.map(v => SERIES[v.series]))].join(" · ")}</dd></div></dl><p className="ig-artigo-contexto">A ficha apresenta o papel público da pessoa. A presença em um episódio não implica responsabilidade pelos atos de outros participantes.</p></div>
      </aside>
    </div>
  </article>;
}
