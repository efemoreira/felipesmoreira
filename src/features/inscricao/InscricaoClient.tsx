"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import catalogo from "@/data/funcoes.json";
import type { CampoTexto, CatalogoFuncoes, Funcao, GrupoFuncao } from "./tipos";
import {
  mascararTelefone,
  soDigitos,
  validarBairro,
  validarCidade,
  validarEmail,
  validarNome,
  validarTelefone,
  CHAVE_RASCUNHO,
} from "./validacao";
import { PassoFuncoes, PassoDados, PassoConfirmar } from "./Passos";
import { Sucesso } from "./Sucesso";
import { css } from "./estilos";

/**
 * O FLUXO de `/queroajudar`: três passos, o estado deles e o envio.
 *
 * Só o fluxo. O que saiu daqui e por quê:
 *   Passos.tsx    um componente por passo, a mesma divisão da barra de progresso
 *   Campos.tsx    o cartão de função e os dois campos — desenho, sem regra
 *   Sucesso.tsx   a tela de confirmação, que é outra tela e não um quarto passo
 *   estilos.ts    as 330 linhas de CSS que ficavam depois do fim do arquivo
 *
 * O que fica é o que se lê quando alguma coisa está errada: a validação, o
 * rascunho que sobrevive ao F5, a origem de quem trouxe a pessoa e o POST.
 */

const CATALOGO = catalogo as CatalogoFuncoes;
const ORDEM_GRUPOS: GrupoFuncao[] = ["comunicacao", "eventos", "outro"];
const TOTAL_PASSOS = 3;

const ENDPOINT = "/painel/api/inscricao.php";

type Envio = "parado" | "enviando" | "erro" | "pronto";

const VALIDADORES: Record<CampoTexto, (v: string) => string> = {
  nome: validarNome,
  telefone: validarTelefone,
  email: validarEmail,
  cidade: validarCidade,
  bairro: validarBairro,
};

export default function InscricaoClient() {
  const [passo, setPasso] = useState(1);
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [aberta, setAberta] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<CampoTexto, string>>({
    nome: "", telefone: "", email: "", cidade: "", bairro: "",
  });
  const [erros, setErros] = useState<Partial<Record<CampoTexto, string>>>({});
  const [tocado, setTocado] = useState<Partial<Record<CampoTexto, boolean>>>({});
  const [consentimento, setConsentimento] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [envio, setEnvio] = useState<Envio>("parado");
  const honeypot = useRef<HTMLInputElement>(null);

  /**
   * De onde a pessoa veio — o `?de=` do link que ela abriu.
   *
   * Fica num ref, e não no estado, porque nada na tela depende dele: é carga
   * que viaja junto com o envio. Só é lido no navegador porque a página é
   * pré-renderizada no build, quando não existe URL de visitante.
   *
   * O `sessionStorage` guarda para o caso de recarregar no meio dos três
   * passos: sem isso, um F5 no passo 2 apagaria o crédito de quem trouxe a
   * pessoa. Fica na sessão da aba, não no domínio inteiro — some ao fechar.
   */
  const origem = useRef("");
  useEffect(() => {
    const busca = new URLSearchParams(window.location.search);

    /* `?funcao=olheiro` vem de /funcoes: quem leu a ficha inteira e decidiu não
       deve ter que procurar a mesma função de novo numa lista de doze. Só entra
       id que existe no catálogo — parâmetro é texto de fora. */
    const pedida = busca.get("funcao");
    if (pedida && CATALOGO.funcoes.some((f) => f.id === pedida)) {
      setFuncoes([pedida]);
    }

    const daUrl = busca.get("de") ?? "";
    if (daUrl) {
      origem.current = daUrl;
      try { sessionStorage.setItem("de", daUrl); } catch { /* aba anônima */ }
    } else {
      try { origem.current = sessionStorage.getItem("de") ?? ""; } catch { /* idem */ }
    }

    /* O que a pessoa já digitou também sobrevive ao F5, pela mesma razão que o
       `de` sobrevive: recarregar no passo 2 apagava tudo e ela recomeçava do
       zero — em pé, no celular, isso é a inscrição que não acontece.
       `sessionStorage` e não `localStorage`: some ao fechar a aba, que é o
       certo para dado de gente num celular que pode ser emprestado.

       Vem também da ponte da presença (`/presenca` → "quer ajudar?"), que
       grava a mesma chave para a pessoa não redigitar o que acabou de dizer
       na porta do encontro. */
    try {
      const guardado = sessionStorage.getItem(CHAVE_RASCUNHO);
      if (guardado) {
        const d = JSON.parse(guardado) as Partial<Record<CampoTexto, string>>;
        setCampos((c) => {
          const novo = { ...c };
          for (const k of Object.keys(c) as CampoTexto[]) {
            if (typeof d[k] === "string") novo[k] = d[k] as string;
          }
          return novo;
        });
      }
    } catch { /* json torto ou aba anônima: começa em branco, sem quebrar */ }
  }, []);

  /* Grava a cada tecla. É barato (um JSON de cinco campos curtos) e é o único
     jeito de não perder o que foi digitado desde o último passo. */
  useEffect(() => {
    try { sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(campos)); } catch { /* idem */ }
  }, [campos]);

  const tituloRef = useRef<HTMLHeadingElement>(null);
  /* HTMLElement, e não HTMLInputElement: a cidade é um <select>, e o "leve-me
     ao primeiro erro" lá embaixo precisa alcançá-la pelo mesmo mapa. */
  const refs = useRef<Partial<Record<CampoTexto, HTMLElement | null>>>({});
  const consentRef = useRef<HTMLInputElement>(null);
  const listaFuncoesRef = useRef<HTMLDivElement>(null);

  /* Ao trocar de passo o foco vai para o título — sem isso o leitor de tela
     continua lendo o passo anterior e quem usa teclado se perde. */
  const primeiroRender = useRef(true);
  useEffect(() => {
    if (primeiroRender.current) {
      primeiroRender.current = false;
      return;
    }
    tituloRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [passo]);

  const porGrupo = useMemo(() => {
    const mapa = new Map<GrupoFuncao, Funcao[]>();
    for (const g of ORDEM_GRUPOS) mapa.set(g, []);
    for (const f of CATALOGO.funcoes) mapa.get(f.grupo)?.push(f);
    return mapa;
  }, []);

  const escolhidas = useMemo(
    () => CATALOGO.funcoes.filter((f) => funcoes.includes(f.id)),
    [funcoes],
  );

  const alternar = (id: string) => {
    setErroGeral(null);
    setFuncoes((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  };

  const mudar = (campo: CampoTexto, valor: string) => {
    const v = campo === "telefone" ? mascararTelefone(valor) : valor;
    setCampos((a) => ({ ...a, [campo]: v }));
    // já mostrou erro neste campo? então revalida enquanto digita, pra
    // mensagem sumir assim que a pessoa conserta
    if (erros[campo]) {
      setErros((a) => ({ ...a, [campo]: VALIDADORES[campo](v) }));
    }
  };

  const aoSair = (campo: CampoTexto) => {
    setTocado((a) => ({ ...a, [campo]: true }));
    setErros((a) => ({ ...a, [campo]: VALIDADORES[campo](campos[campo]) }));
  };

  const validarPasso2 = useCallback(() => {
    const novos: Partial<Record<CampoTexto, string>> = {};
    (Object.keys(VALIDADORES) as CampoTexto[]).forEach((c) => {
      const e = VALIDADORES[c](campos[c]);
      if (e) novos[c] = e;
    });
    setErros(novos);
    setTocado({ nome: true, telefone: true, email: true, cidade: true, bairro: true });
    const primeiro = (Object.keys(VALIDADORES) as CampoTexto[]).find((c) => novos[c]);
    if (primeiro) {
      refs.current[primeiro]?.focus();
      return false;
    }
    return true;
  }, [campos]);

  const avancar = () => {
    setErroGeral(null);
    if (passo === 1) {
      /* Escolher é obrigatório, e "Onde precisar" (grupo "Ainda não sei") é a
         escolha de quem ainda não sabe — por isso o recado do erro aponta pra
         ela. Seguir em branco e seguir por "Ainda não sei" dão no mesmo pro
         cadastro; a diferença é que a segunda é uma resposta, e resposta é o
         que a coordenação usa pra puxar a conversa depois. */
      if (funcoes.length === 0) {
        setErroGeral(
          'Escolha ao menos uma função. Se ainda não sabe, marque "Onde precisar", em "Ainda não sei" — a coordenação conversa com você depois.',
        );
        listaFuncoesRef.current?.focus();
        return;
      }
      setPasso(2);
      return;
    }
    if (passo === 2) {
      if (!validarPasso2()) return;
      setPasso(3);
    }
  };

  const voltar = () => {
    setErroGeral(null);
    setPasso((p) => Math.max(1, p - 1));
  };

  const enviar = async () => {
    if (!consentimento) {
      setErroGeral("Para continuar, você precisa concordar com o uso dos seus dados.");
      consentRef.current?.focus();
      return;
    }
    setEnvio("enviando");
    setErroGeral(null);
    try {
      const resposta = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: campos.nome.trim().replace(/\s+/g, " "),
          telefone: soDigitos(campos.telefone),
          email: campos.email.trim(),
          cidade: campos.cidade.trim(),
          bairro: campos.bairro.trim(),
          funcoes,
          de: origem.current,
          consentimento: true,
          site: honeypot.current?.value ?? "",
        }),
      });
      const json = await resposta.json().catch(() => null);
      if (!resposta.ok || !json?.ok) {
        setEnvio("erro");
        setErroGeral(json?.erro ?? "Não deu para enviar agora. Confira sua internet e tente de novo.");
        return;
      }
      /* Inscrição feita: o rascunho não tem mais razão de existir, e deixá-lo
         faria a próxima pessoa a usar o mesmo celular abrir o formulário com os
         dados de quem veio antes. */
      try { sessionStorage.removeItem(CHAVE_RASCUNHO); } catch { /* aba anônima */ }
      setEnvio("pronto");
    } catch {
      setEnvio("erro");
      setErroGeral("Não deu para enviar agora. Confira sua internet e tente de novo — o que você preencheu está guardado.");
    }
  };

  if (envio === "pronto") return <Sucesso nome={campos.nome} cidade={campos.cidade} escolhidas={escolhidas} />;

  return (
    <div className="in-fundo">
      <main className="in-main">
        <Link href="/" className="in-voltar-site">
          <Icon name="arrowLeft" size={16} />
          <span>Voltar pro site</span>
        </Link>

        <header className="in-cabecalho">
          <p className="in-chip">Missão Ceará</p>
          <h1 className="in-titulo">Quero ajudar</h1>
          {/* Uma frase, e não duas: quem chega por link de WhatsApp decide em
              segundos se rola ou fecha, e a instrução ("marque uma") vale mais
              aqui do que a tese ("o movimento é feito de gente com função") —
              essa está inteira em /funcoes, que é a página escrita para ela. */}
          <p className="in-linha">
            Escolha por onde você quer começar. Dá pra marcar mais de uma, e dá
            pra mudar depois.
          </p>
        </header>

        {/* progresso */}
        <div className="in-progresso" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`in-passo-marca${n <= passo ? " ativo" : ""}`}>
              <b>{n}</b>
              <i>{n === 1 ? "Como ajudar" : n === 2 ? "Seus dados" : "Confirmar"}</i>
            </span>
          ))}
        </div>
        <p className="in-sr" aria-live="polite">
          Passo {passo} de {TOTAL_PASSOS}
        </p>

        <h2 className="in-passo-titulo" ref={tituloRef} tabIndex={-1}>
          {passo === 1 && "Como você quer ajudar?"}
          {passo === 2 && "Seus dados"}
          {passo === 3 && "Confira e confirme"}
        </h2>

        {erroGeral && (
          <p className="in-erro-geral" role="alert">
            <Icon name="close" size={16} />
            <span>{erroGeral}</span>
          </p>
        )}

        {passo === 1 && (
          <PassoFuncoes
            porGrupo={porGrupo}
            grupos={CATALOGO.grupos}
            ordem={ORDEM_GRUPOS}
            marcadas={funcoes}
            aberta={aberta}
            aoAlternar={alternar}
            aoAbrir={setAberta}
            foco={listaFuncoesRef}
          />
        )}

        {passo === 2 && (
          <PassoDados
            campos={campos}
            erros={erros}
            tocado={tocado}
            aoMudar={mudar}
            aoSair={aoSair}
            refs={refs}
          />
        )}

        {passo === 3 && (
          <PassoConfirmar
            campos={campos}
            escolhidas={escolhidas}
            consentimento={consentimento}
            aoConsentir={(v) => {
              setConsentimento(v);
              if (v) setErroGeral(null);
            }}
            aoVoltarPara={setPasso}
            refConsentimento={consentRef}
          />
        )}

        {/* honeypot: invisível pra gente, irresistível pra robô */}
        <input
          ref={honeypot}
          type="text"
          name="site"
          className="in-armadilha"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* ============ NAVEGAÇÃO ============ */}
        <div className="in-acoes">
          {passo > 1 && (
            <button type="button" className="in-btn in-btn-fantasma" onClick={voltar} disabled={envio === "enviando"}>
              <Icon name="arrowLeft" size={18} />
              <span>Voltar</span>
            </button>
          )}
          {passo < TOTAL_PASSOS ? (
            <button type="button" className="in-btn in-btn-principal" onClick={avancar}>
              <span>Continuar</span>
              <Icon name="chevronRight" size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="in-btn in-btn-principal"
              onClick={enviar}
              disabled={envio === "enviando"}
            >
              <Icon name="whatsapp" size={18} />
              <span>{envio === "enviando" ? "Enviando…" : "Enviar inscrição"}</span>
            </button>
          )}
        </div>

        {passo === 1 && funcoes.length > 0 && (
          <p className="in-contagem" aria-live="polite">
            {funcoes.length === 1 ? "1 função escolhida" : `${funcoes.length} funções escolhidas`}
          </p>
        )}
      </main>

      <style>{css}</style>
    </div>
  );
}

/* ===================== peças ===================== */
