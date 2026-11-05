"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { C, FONT_ALFA, FONT_BITTER, FONT_ELITE, borda, bordaFina, sombra } from "@/lib/theme";
import { ApiError } from "@/lib/api/client";
import { importarAcao, marcarTarefaAcao, obterAcao, verificarAcessoAcao, type AcervoAcao, type DocumentoAcao } from "@/lib/api/acao";
import Documento from "./Documento";
import { normalizarBusca, pacoteDosArquivos, secoesDoDocumento, tarefaConcluida } from "./documentos";
import styles from "./acao.module.css";

const LOGIN = "/painel/?volta=%2Fpainel%2Facao.php";
const tema = {
  "--acao-ink": C.ink, "--acao-paper": C.paper, "--acao-cream": C.cream,
  "--acao-gold": C.gold, "--acao-gold-dim": C.goldDim,
  "--acao-error-bg": C.erroFundo, "--acao-error": C.erroTinta,
  "--acao-body": FONT_BITTER, "--acao-title": FONT_ALFA, "--acao-label": FONT_ELITE,
  "--acao-border": bordaFina(), "--acao-frame": borda(), "--acao-shadow": sombra(),
} as CSSProperties;

function mensagem(erro: unknown): string {
  if (erro instanceof ApiError && erro.corpo && typeof erro.corpo === "object" && "erro" in erro.corpo) return String(erro.corpo.erro);
  return erro instanceof Error ? erro.message : "Não consegui completar essa ação. Tente novamente.";
}

function tituloTipo(tipo: string) {
  return ({ tema: "Temas", municipio: "Municípios", instituicao: "Instituições", "articulacao-regional": "Regiões", liga: "Liga", interno: "Equipe", funcao: "Acolhimento", modelo: "Modelos" } as Record<string, string>)[tipo] ?? tipo;
}

export default function Acao() {
  const [acervo, setAcervo] = useState<AcervoAcao | null>(null);
  const [estado, setEstado] = useState<"carregando" | "entrar" | "negado" | "erro" | "pronto">("carregando");
  const [aba, setAba] = useState<"inicio" | "documentos" | "estrutura">("inicio");
  const [selecionado, setSelecionado] = useState("");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("");
  const [limite, setLimite] = useState(24);
  const [limiteConcluidas, setLimiteConcluidas] = useState(12);
  const [salvando, setSalvando] = useState<Set<string>>(new Set());
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const rolagemInicial = useRef(false);

  const receber = useCallback((dados: AcervoAcao) => {
    setAcervo(dados);
    setEstado("pronto");
    setSelecionado((atual) => dados.documentos.some((d) => d.id === atual) ? atual : dados.documentos[0]?.id ?? "");
  }, []);

  useEffect(() => {
    let ativo = true;
    obterAcao().then((dados) => {
      if (!ativo) return;
      if (!dados.autenticado) {
        setEstado("entrar");
        window.location.replace(LOGIN);
      } else if (!dados.pode) setEstado("negado");
      else {
        receber(dados);
        const id = new URLSearchParams(window.location.hash.slice(1)).get("documento");
        if (id && dados.documentos.some((d) => d.id === id)) { setSelecionado(id); setAba("documentos"); }
      }
    }).catch(() => { if (ativo) setEstado("erro"); });
    return () => { ativo = false; };
  }, [receber]);

  useEffect(() => {
    if (estado !== "pronto") return;
    let ativo = true;
    const conferir = () => {
      if (document.visibilityState !== "visible") return;
      verificarAcessoAcao().then((r) => {
        if (!ativo || r.pode) return;
        setAcervo(null);
        setEstado(r.autenticado ? "negado" : "entrar");
        if (!r.autenticado) window.location.replace(LOGIN);
      }).catch(() => { /* falha de rede não equivale a sair da conta */ });
    };
    window.addEventListener("focus", conferir);
    window.addEventListener("pageshow", conferir);
    document.addEventListener("visibilitychange", conferir);
    const intervalo = window.setInterval(conferir, 60_000);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("focus", conferir);
      window.removeEventListener("pageshow", conferir);
      document.removeEventListener("visibilitychange", conferir);
    };
  }, [estado]);

  const abrirDocumento = (id: string) => {
    setSelecionado(id); setAba("documentos"); setBusca(""); setCategoria("");
    window.history.replaceState(null, "", `/acao#documento=${encodeURIComponent(id)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const alternar = async (documento: string, tarefa: string, concluida: boolean) => {
    if (!acervo || salvando.has(tarefa)) return;
    const anterior = acervo.progresso[tarefa];
    setErro("");
    setSalvando((s) => new Set(s).add(tarefa));
    setAcervo((a) => a && ({ ...a, progresso: { ...a.progresso, [tarefa]: concluida } }));
    try { await marcarTarefaAcao(acervo.csrf, documento, tarefa, concluida); }
    catch (falha) {
      setErro(mensagem(falha));
      if (falha instanceof ApiError && [401, 403].includes(falha.status)) {
        setAcervo(null); setEstado("entrar");
      } else setAcervo((a) => {
        if (!a) return a;
        const progresso = { ...a.progresso };
        if (anterior === undefined) delete progresso[tarefa]; else progresso[tarefa] = anterior;
        return { ...a, progresso };
      });
    } finally { setSalvando((s) => { const n = new Set(s); n.delete(tarefa); return n; }); }
  };
  const importar = async (arquivos: File[]) => {
    if (!acervo || !arquivos.length) return;
    setErro(""); setAviso(""); setImportando(true);
    try {
      const pacote = await pacoteDosArquivos(arquivos, acervo);
      receber(await importarAcao(acervo.csrf, pacote));
      setAviso("Documentos atualizados. As marcações das tarefas mantidas foram preservadas.");
    } catch (falha) { setErro(mensagem(falha)); }
    finally { setImportando(false); if (upload.current) upload.current.value = ""; }
  };

  const documentos = acervo?.documentos ?? [];
  const documento = documentos.find((d) => d.id === selecionado) ?? documentos[0];
  const progresso = acervo?.progresso ?? {};
  const pesquisa = normalizarBusca(busca.trim());
  const visiveis = documentos.filter((d) => (!categoria || d.categoria === categoria) && (!pesquisa || normalizarBusca(`${d.titulo} ${d.resumo} ${d.conteudo}`).includes(pesquisa)));
  const categorias = [...new Set(documentos.map((d) => d.categoria))];
  const todasTarefas = documentos.flatMap((d) => d.tarefas.map((t) => ({ ...t, documento: d })));
  const tarefasConcluidas = todasTarefas.filter((t) => tarefaConcluida(t, progresso));
  const concluidas = tarefasConcluidas.length;
  const concluidasVisiveis = tarefasConcluidas.filter((t) => !pesquisa || normalizarBusca(`${t.texto} ${t.documento.titulo}`).includes(pesquisa));
  const proximas = todasTarefas.filter((t) => !tarefaConcluida(t, progresso)).slice(0, 6);
  const secoes = useMemo(() => documento ? secoesDoDocumento(documento.conteudo) : [], [documento]);
  const destinos = acervo?.diretorio ?? [];
  const tipos = [...new Set(destinos.map((d) => d.tipo))];
  const destinosVisiveis = destinos.filter((d) => (!tipo || d.tipo === tipo) && (!pesquisa || normalizarBusca(Object.values(d).join(" ")).includes(pesquisa)));

  useEffect(() => {
    if (rolagemInicial.current || !documento || aba !== "documentos") return;
    const secao = new URLSearchParams(window.location.hash.slice(1)).get("secao");
    rolagemInicial.current = true;
    if (secao && /^\d+$/.test(secao)) requestAnimationFrame(() => document.getElementById(`secao-${documento.id}-${secao}`)?.scrollIntoView({ block: "start" }));
  }, [documento, aba]);

  return <main className={styles.pagina} style={tema}>
    <header className={styles.cabecalho}>
      <a className={styles.marca} href="/acao" aria-label="Central de ação">A<span>ÇÃO</span><span className={styles.privado}>PRIVADO</span></a>
      <nav aria-label="Páginas de trabalho" className={styles.nav}>
        <a href="/plano">Planos</a><a href="/resultados">Resultados</a><a href="/acao" aria-current="page">Ação</a>
      </nav>
      <a href="/painel/" className={styles.conta}>Minha conta ↗</a>
    </header>

    {estado !== "pronto" || !acervo ? <section className={styles.porta} aria-live="polite">
      <p className={styles.legenda}>CENTRAL DE TRABALHO</p>
      <h1>{estado === "negado" ? "Reservado ao dono." : estado === "erro" ? "Não consegui abrir a central." : estado === "entrar" ? "Entre para continuar." : "Abrindo sua central…"}</h1>
      <p>{estado === "negado" ? "A conta conectada não tem acesso a estes documentos." : estado === "erro" ? "Confira a conexão e tente novamente." : "Seus documentos ficam disponíveis depois da verificação da conta."}</p>
      <a className={styles.botaoPrincipal} href={LOGIN}>Entrar no painel</a>
      {estado === "erro" && <button className={styles.botao} type="button" onClick={() => window.location.reload()}>Tentar novamente</button>}
    </section> : <div className={styles.corpo}>
      <div className={styles.abertura}>
        <div><p className={styles.legenda}>SUA MESA DE TRABALHO</p><h1>Da decisão à ação.</h1><p>Planejamento, organização e materiais para colocar o trabalho em movimento.</p></div>
        <div className={styles.atualizacao}><span>Acervo privado</span><strong>{documentos.length} documentos</strong>{acervo.atualizadoEm && <small>Atualizado em {new Date(acervo.atualizadoEm).toLocaleDateString("pt-BR")}</small>}</div>
      </div>
      <div className={styles.ferramentas}>
        <div className={styles.abas} role="tablist" aria-label="Central de ação">
          {([['inicio', 'Visão geral'], ['documentos', 'Documentos'], ['estrutura', 'Estrutura']] as const).map(([id, nome]) => <button key={id} id={`aba-${id}`} role="tab" aria-selected={aba === id} aria-controls="conteudo-acao" onClick={() => { setAba(id); setBusca(""); setLimite(24); }}>{nome}</button>)}
        </div>
        <label className={styles.busca}><span>Buscar</span><input type="search" value={busca} onChange={(e) => { setBusca(e.target.value); setLimite(24); setLimiteConcluidas(12); }} placeholder={aba === "estrutura" ? "Cidade, instituição ou frente…" : "Nos seus documentos…"} /></label>
        <input ref={upload} className={styles.upload} type="file" accept=".md,.json" multiple onChange={(e) => void importar(Array.from(e.target.files ?? []))} />
        <button className={styles.botao} type="button" disabled={importando} onClick={() => upload.current?.click()}>{importando ? "Importando…" : "Adicionar / atualizar"}</button>
      </div>
      {erro && <p className={styles.erro} role="alert">{erro}</p>}
      {aviso && <p className={styles.aviso} role="status">{aviso}</p>}

      <section id="conteudo-acao" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {aba === "inicio" && <>
          <div className={styles.indicadores}>
            <div><span>Acervo</span><strong>{documentos.length}</strong><small>documentos reunidos</small></div>
            <div><span>Execução</span><strong>{concluidas}<em> / {todasTarefas.length}</em></strong><small><a href="#tarefas-concluidas">itens concluídos · ver lista ↓</a></small></div>
            <div><span>Estrutura</span><strong>{destinos.length}</strong><small>destinos e modelos de implantação</small></div>
          </div>
          {!documentos.length ? <div className={styles.vazio}><h2>Sua central está pronta para receber os planos.</h2><p>Use “Adicionar / atualizar” para escolher seus arquivos Markdown ou o pacote de Ação preparado para esta página.</p></div> : <>
            <div className={styles.fluxo} aria-label="Fluxo de trabalho">{["Preparar a estrutura", "Receber as pessoas", "Encaminhar aos destinos", "Combinar o próximo passo"].map((t, i) => <span key={t}><b>{String(i + 1).padStart(2, "0")}</b>{t}</span>)}</div>
            <div className={styles.tituloSecao}><div><p className={styles.legenda}>CONTINUAR O TRABALHO</p><h2>Próximas tarefas</h2></div><small>Na ordem dos documentos · marcações salvas na sua conta</small></div>
            <div className={styles.tarefas}>
              {proximas.length ? proximas.map((t) => <div key={t.id} className={styles.tarefa}>
                <label className={styles.controleCheck}><input type="checkbox" aria-label={`Concluir: ${t.texto.replace(/[*`]/g, "")}`} checked={false} disabled={salvando.has(t.id)} onChange={() => void alternar(t.documento.id, t.id, true)} /></label>
                <button type="button" onClick={() => abrirDocumento(t.documento.id)}><span>{t.texto.replace(/[*`]/g, "")}</span><small>{t.documento.titulo}</small></button>
              </div>) : <p>Os checklists atuais estão concluídos. Os documentos continuam disponíveis para consulta.</p>}
            </div>
            <section id="tarefas-concluidas" className={styles.secaoConcluidas} aria-labelledby="titulo-concluidas">
              <div className={styles.tituloSecao}>
                <div><p className={styles.legenda}>TRABALHO CONCLUÍDO</p><h2 id="titulo-concluidas"><span className={styles.checkConcluida} aria-hidden="true">✓</span> Concluídas <span className={styles.totalConcluidas}>({concluidas})</span></h2></div>
                <small>Os itens permanecem visíveis. Desmarque a caixa para voltar às pendentes.</small>
              </div>
              <div className={styles.tarefas}>
                {concluidasVisiveis.slice(0, limiteConcluidas).map((t) => <div key={t.id} className={`${styles.tarefa} ${styles.tarefaConcluida}`}>
                  <label className={styles.controleCheck}><input type="checkbox" aria-label={`Marcar como pendente: ${t.texto.replace(/[*`]/g, "")}`} checked disabled={salvando.has(t.id)} onChange={() => void alternar(t.documento.id, t.id, false)} /></label>
                  <button type="button" onClick={() => abrirDocumento(t.documento.id)}><span>{t.texto.replace(/[*`]/g, "")}</span><small><b className={styles.statusConcluida}>✓ Concluída</b> · {t.documento.titulo}</small></button>
                </div>)}
              </div>
              {!concluidasVisiveis.length && <p className={styles.nota}>{concluidas ? "Nenhum item concluído corresponde à busca." : "Os itens que você concluir aparecerão aqui com um ✓."}</p>}
              {concluidasVisiveis.length > limiteConcluidas && <button className={styles.botao} type="button" onClick={() => setLimiteConcluidas((l) => l + 12)}>Mostrar mais concluídas</button>}
            </section>
            <div className={styles.tituloSecao}><div><p className={styles.legenda}>CONSULTAR E EXECUTAR</p><h2>Seus documentos</h2></div></div>
            <div className={styles.cartoes}>{visiveis.map((d) => <CartaoDocumento key={d.id} documento={d} progresso={progresso} abrir={() => abrirDocumento(d.id)} />)}</div>
            {!visiveis.length && <p className={styles.vazio}>Nenhum documento corresponde à busca.</p>}
          </>}
        </>}

        {aba === "documentos" && <div className={styles.leitura}>
          <aside className={styles.listaDocumentos} aria-label="Escolher documento">
            <label className={styles.filtro}>Categoria<select value={categoria} onChange={(e) => setCategoria(e.target.value)}><option value="">Todas</option>{categorias.map((c) => <option key={c}>{c}</option>)}</select></label>
            {visiveis.map((d) => <button key={d.id} aria-current={documento?.id === d.id ? "true" : undefined} onClick={() => { setSelecionado(d.id); window.history.replaceState(null, "", `/acao#documento=${encodeURIComponent(d.id)}`); }}><small>{d.categoria}</small><strong>{d.titulo}</strong></button>)}
            {!visiveis.length && <p>Nenhum documento encontrado.</p>}
          </aside>
          {documento ? <article className={styles.folha} key={documento.id}>
            <div className={styles.topoDocumento}><span className={styles.etiqueta}>{documento.categoria}</span><a href={`/painel/api/acao.php?baixar=${encodeURIComponent(documento.id)}`}>Baixar original ↗</a></div>
            <h2 className={styles.tituloDocumento}>{documento.titulo}</h2>
            {documento.resumo && <p className={styles.resumo}>{documento.resumo}</p>}
            {!!documento.tarefas.length && <div className={styles.progressoDocumento}><span>{documento.tarefas.filter((t) => tarefaConcluida(t, progresso)).length} de {documento.tarefas.length} itens concluídos</span><small>{salvando.size ? "Salvando…" : "Marcações salvas"}</small></div>}
            {!!secoes.length && <details className={styles.sumario}><summary>Neste documento · {secoes.length} seções</summary><nav aria-label="Sumário">{secoes.map((s) => <a key={s.linha} href={`#documento=${encodeURIComponent(documento.id)}&secao=${s.linha}`} data-nivel={s.nivel} onClick={(e) => { e.preventDefault(); document.getElementById(`secao-${documento.id}-${s.linha}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); window.history.replaceState(null, "", `/acao#documento=${encodeURIComponent(documento.id)}&secao=${s.linha}`); }}>{s.titulo}</a>)}</nav></details>}
            <Documento documento={documento} progresso={progresso} salvando={salvando} alternar={(...args) => void alternar(...args)} abrirDocumento={abrirDocumento} documentos={documentos} />
          </article> : <p className={styles.vazio}>Adicione os documentos para começar.</p>}
        </div>}

        {aba === "estrutura" && <>
          <div className={styles.tituloSecao}><div><p className={styles.legenda}>DIRETÓRIO DE IMPLANTAÇÃO</p><h2>Uma rota para cada interessado.</h2></div><label className={styles.filtro}>Mostrar<select value={tipo} onChange={(e) => { setTipo(e.target.value); setLimite(24); }}><option value="">Todos os destinos</option>{tipos.map((t) => <option key={t} value={t}>{tituloTipo(t)}</option>)}</select></label></div>
          <p className={styles.nota}>Este diretório acompanha a preparação. Grupos, permissões e convites precisam ser conferidos para deixar a recepção pronta.</p>
          <p className={styles.contagem}>{destinosVisiveis.length} destinos encontrados</p>
          <div className={styles.destinos}>{destinosVisiveis.slice(0, limite).map((d) => <article key={d.codigo} className={styles.destino}>
            <div className={styles.topoDocumento}><span className={styles.etiqueta}>{tituloTipo(d.tipo)}</span><small>{d.situacao_implantacao}</small></div>
            <h3>{d.recorte || d.nome_referencia}</h3><p>{d.acao_preparacao}</p>
            <dl>{[["Canal de referência", d.grupo_existente || d.nome_referencia], ["Acolhimento", d.acolhedor || "A confirmar"], ["Administração", d.permissao_admin || "A confirmar"], ["Destino de reserva", d.destino_reserva]].map(([rotulo, valor]) => <div key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>)}</dl>
            {d.link_convite?.startsWith("https://") && <a className={styles.botao} href={d.link_convite} target="_blank" rel="noopener noreferrer">Abrir convite ↗</a>}
          </article>)}</div>
          {destinosVisiveis.length > limite && <button className={styles.botao} onClick={() => setLimite((l) => l + 24)}>Mostrar mais destinos</button>}
          {!destinosVisiveis.length && <p className={styles.vazio}>Nenhum destino corresponde aos filtros.</p>}
        </>}
      </section>
      <footer className={styles.rodape}>Central privada de {acervo.nome}. Documentos e marcações ficam no servidor, vinculados à sua conta. {!!documentos.length && <a href="/painel/api/acao.php?backup=1">Baixar cópia privada ↗</a>}</footer>
    </div>}
  </main>;
}

function CartaoDocumento({ documento, progresso, abrir }: { documento: DocumentoAcao; progresso: Record<string, boolean>; abrir: () => void }) {
  const feitas = documento.tarefas.filter((t) => tarefaConcluida(t, progresso)).length;
  return <button className={styles.cartaoDocumento} onClick={abrir}>
    <span className={styles.etiqueta}>{documento.categoria}</span><h3>{documento.titulo}</h3>
    <p>{documento.resumo || "Abrir o documento completo e suas seções."}</p>
    <span className={styles.fimCartao}>{documento.tarefas.length ? `${feitas} / ${documento.tarefas.length} itens` : "Documento de referência"}<b aria-hidden="true">↗</b></span>
  </button>;
}
