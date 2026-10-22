"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { Icon } from "@/components/icons";
import catalogo from "@/data/funcoes.json";
import { enviarInscricao } from "@/lib/api/inscricao";
import { sinal } from "@/lib/api/sinal";
import { interesseDaUrl } from "./interesse";
import type { CampoTexto, CatalogoFuncoes, GrupoFuncao } from "./tipos";
import { mascararTelefone, soDigitos, validarBairro, validarCidade, validarEmail, validarNome, validarTelefone, CHAVE_RASCUNHO } from "./validacao";
import { PassoFuncoes, PassoDados, PassoConfirmar } from "./Passos";
import { Interesses, TrabalhoEstudo } from "./PerfilCampos";
import { PARTICIPACAO, perfilVazio, restaurarPerfil } from "./perfil";
import { Sucesso } from "./Sucesso";
import { css } from "./estilos";

const CATALOGO = catalogo as CatalogoFuncoes;
const ORDEM_GRUPOS = Object.keys(CATALOGO.grupos) as GrupoFuncao[];
const VALIDADORES = { nome: validarNome, telefone: validarTelefone, email: validarEmail, cidade: validarCidade, bairro: validarBairro };
const PASSOS = ["Você e seu lugar", "Seus interesses", "Confirmar"];
const CAMPOS_VAZIOS: Record<CampoTexto, string> = { nome: "", telefone: "", email: "", cidade: "", bairro: "" };

export default function InscricaoClient() {
  const [passo, setPasso] = useState(1);
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [perfil, setPerfil] = useState(perfilVazio);
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [aberta, setAberta] = useState<string | null>(null);
  const [interesse, setInteresse] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [erros, setErros] = useState<Partial<Record<CampoTexto, string>>>({});
  const [tocado, setTocado] = useState<Partial<Record<CampoTexto, boolean>>>({});
  const [erroGeral, setErroGeral] = useState("");
  const [envio, setEnvio] = useState<"parado" | "enviando" | "pronto">("parado");
  const [rascunhoLido, setRascunhoLido] = useState(false);
  const origem = useRef("");
  const honeypot = useRef<HTMLInputElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const refs = useRef<Partial<Record<CampoTexto, HTMLElement | null>>>({});
  const listaFuncoesRef = useRef<HTMLDivElement>(null);
  const emEnvio = useRef(false);
  const primeiroRender = useRef(true);

  useEffect(() => {
    const busca = new URLSearchParams(window.location.search);
    const referencia = interesseDaUrl(busca);
    const frente = busca.get("frente") ?? "";
    try {
      const salvo = JSON.parse(sessionStorage.getItem(CHAVE_RASCUNHO) ?? "null");
      if (salvo && typeof salvo === "object") {
        const restaurados = { ...CAMPOS_VAZIOS };
        for (const k of Object.keys(restaurados) as CampoTexto[]) {
          if (typeof salvo[k] === "string") restaurados[k] = salvo[k];
        }
        setCampos(restaurados);
        setPerfil(restaurarPerfil(salvo.participacao));
        if (Array.isArray(salvo.funcoes)) setFuncoes(CATALOGO.funcoes.filter(f => salvo.funcoes.includes(f.id)).map(f => f.id));
        if (!referencia && typeof salvo.interesse === "string") setInteresse(interesseDaUrl(new URLSearchParams(salvo.interesse.startsWith("tema:") ? { tema: salvo.interesse.slice(5) } : { unidade: salvo.interesse })));
      }
      origem.current = busca.get("de") ?? sessionStorage.getItem("de") ?? "";
      if (origem.current) sessionStorage.setItem("de", origem.current);
    } catch { origem.current = busca.get("de") ?? ""; }
    if (referencia) {
      setInteresse(referencia);
      setPerfil(p => ({ ...p,
        frentes: [...new Set([...p.frentes, referencia.startsWith("nuc-") ? "territorio" : referencia.startsWith("cul-") ? "cultura" : "temas"])],
        temas: referencia.startsWith("tema:") ? [...new Set([...p.temas, referencia.slice(5)])] : p.temas,
      }));
    }
    if (Object.hasOwn(PARTICIPACAO.frentes, frente)) setPerfil(p => ({ ...p, frentes: [...new Set([...p.frentes, frente])] }));
    const funcao = busca.get("funcao");
    if (funcao && CATALOGO.funcoes.some(f => f.id === funcao)) setFuncoes([funcao]);
    setRascunhoLido(true);
  }, []);

  useEffect(() => {
    if (!rascunhoLido || envio === "pronto") return;
    try { sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({ ...campos, participacao: perfil, funcoes, interesse })); } catch { /* armazenamento indisponível */ }
  }, [campos, perfil, funcoes, interesse, rascunhoLido, envio]);

  useEffect(() => {
    if (primeiroRender.current) { primeiroRender.current = false; return; }
    tituloRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [passo]);

  const porGrupo = useMemo(() => new Map(ORDEM_GRUPOS.map(g => [g, CATALOGO.funcoes.filter(f => f.grupo === g)])), []);
  const escolhidas = CATALOGO.funcoes.filter(f => funcoes.includes(f.id));
  const mudar = (campo: CampoTexto, valor: string) => {
    const v = campo === "telefone" ? mascararTelefone(valor) : valor;
    setCampos(c => ({ ...c, [campo]: v }));
    if (erros[campo]) setErros(e => ({ ...e, [campo]: VALIDADORES[campo](v) }));
  };
  const aoSair = (campo: CampoTexto) => {
    setTocado(t => ({ ...t, [campo]: true }));
    setErros(e => ({ ...e, [campo]: VALIDADORES[campo](campos[campo]) }));
  };
  const validarContato = () => {
    const novos = Object.fromEntries((Object.keys(VALIDADORES) as CampoTexto[]).map(k => [k, VALIDADORES[k](campos[k])])) as Record<CampoTexto, string>;
    setErros(novos);
    setTocado({ nome: true, telefone: true, cidade: true, bairro: true, email: true });
    const primeiro = (Object.keys(novos) as CampoTexto[]).find(k => novos[k]);
    if (primeiro) { setPasso(1); window.setTimeout(() => refs.current[primeiro]?.focus(), 0); return false; }
    return true;
  };
  const avancar = () => {
    setErroGeral("");
    if (passo === 1 && !validarContato()) return;
    setPasso(p => Math.min(3, p + 1));
    sinal(passo === 1 ? "passo-2" : "passo-3");
  };
  const enviar = async () => {
    if (emEnvio.current || !validarContato()) return;
    if (!consentimento) { setErroGeral("Concorde com o uso dos seus dados para enviar o cadastro."); consentRef.current?.focus(); return; }
    emEnvio.current = true;
    setEnvio("enviando");
    setErroGeral("");
    const r = await enviarInscricao({ ...campos, nome: campos.nome.trim().replace(/\s+/g, " "), telefone: soDigitos(campos.telefone),
      funcoes, interesse, participacao: perfil, de: origem.current, consentimento: true, site: honeypot.current?.value ?? "" });
    emEnvio.current = false;
    if (!r.ok) { setEnvio("parado"); setErroGeral(r.erro || "Não foi possível enviar agora. Seus dados continuam nesta aba; confira a conexão e tente novamente."); return; }
    setEnvio("pronto");
    try { sessionStorage.removeItem(CHAVE_RASCUNHO); } catch { /* armazenamento indisponível */ }
    sinal("enviou-inscricao");
  };

  if (envio === "pronto") return <PaginaDoSite fundo="livre"><Sucesso nome={campos.nome} cidade={campos.cidade} perfil={perfil} /></PaginaDoSite>;
  return <PaginaDoSite fundo="livre"><div className="in-fundo"><div className="in-main">
    <header className="in-cabecalho"><p className="in-chip">Missão Ceará · em construção</p><h1 className="in-titulo">Vamos construir juntos</h1>
      <p className="in-linha">Estamos reunindo pessoas para formar núcleos, grupos e atividades no Ceará. Conte onde você está e o que te interessa. Não precisa ter experiência nem escolher uma função agora.</p></header>
    <div className="in-progresso" aria-hidden="true">{PASSOS.map((nome, i) => <span key={nome} className={`in-passo-marca${i < passo ? " ativo" : ""}`}><b>{i + 1}</b><i>{nome}</i></span>)}</div>
    <p className="in-sr" aria-live="polite">Passo {passo} de 3: {PASSOS[passo - 1]}</p>
    <h2 className="in-passo-titulo" ref={tituloRef} tabIndex={-1}>{PASSOS[passo - 1]}</h2>
    {erroGeral && <p className="in-erro-geral" role="alert">{erroGeral}</p>}
    <form onSubmit={e => { e.preventDefault(); if (passo < 3) avancar(); else void enviar(); }}>
      <fieldset className="in-sem-borda" disabled={envio === "enviando"}>
        {passo === 1 && <><PassoDados campos={campos} erros={erros} tocado={tocado} aoMudar={mudar} aoSair={aoSair} refs={refs} /><TrabalhoEstudo perfil={perfil} aoMudar={setPerfil} /></>}
        {passo === 2 && <><Interesses perfil={perfil} aoMudar={setPerfil} />
          {interesse && <p className="in-ajuda">Seu cadastro veio de uma página de núcleo ou grupo. Essa referência será levada à conversa com a coordenação; a participação será combinada conforme a estrutura for organizada. <button type="button" className="in-editar" onClick={() => setInteresse("")}>Retirar essa referência</button></p>}
          <details className="in-detalhes"><summary>Já sabe uma função em que gostaria de ajudar? {funcoes.length > 0 ? `(${funcoes.length} selecionadas)` : "Opcional"}</summary>
            <PassoFuncoes porGrupo={porGrupo} grupos={CATALOGO.grupos} ordem={ORDEM_GRUPOS} marcadas={funcoes} aberta={aberta}
              aoAlternar={id => setFuncoes(f => f.includes(id) ? f.filter(k => k !== id) : [...f, id])} aoAbrir={setAberta} foco={listaFuncoesRef} />
          </details></>}
        {passo === 3 && <PassoConfirmar campos={campos} perfil={perfil} escolhidas={escolhidas} consentimento={consentimento} aoConsentir={setConsentimento} aoVoltarPara={setPasso} refConsentimento={consentRef} />}
        <input ref={honeypot} type="text" name="site" className="in-armadilha" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <div className="in-acoes">{passo > 1 && <button type="button" className="in-btn in-btn-fantasma" onClick={() => { setErroGeral(""); setPasso(p => p - 1); }}>Voltar</button>}
          <button type="submit" className="in-btn in-btn-principal"><Icon name={passo === 3 ? "check" : "chevronRight"} size={18} />{envio === "enviando" ? "Enviando…" : passo === 3 ? "Enviar meu cadastro" : passo === 2 ? "Revisar meu cadastro" : "Continuar"}</button>
        </div>
      </fieldset>
    </form>
  </div><style>{css}</style></div></PaginaDoSite>;
}
