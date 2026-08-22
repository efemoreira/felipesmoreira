"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon, IconName } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import catalogo from "@/data/funcoes.json";
import type { CatalogoFuncoes, Funcao, GrupoFuncao } from "./tipos";
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
import { GRUPO_GERAL, WHATSAPP_COORDENACAO, TELEFONE_COORDENACAO, linkOiCoordenacao } from "@/lib/contato";
import { MUNICIPIOS_CE, FORA_DO_CEARA } from "@/lib/municipios";
import { compartilharTexto } from "@/lib/compartilhar";
import { slugDe, SITE, CHAVE_NOME } from "@/lib/atribuicao";

const CATALOGO = catalogo as CatalogoFuncoes;
const ORDEM_GRUPOS: GrupoFuncao[] = ["comunicacao", "eventos", "outro"];
const TOTAL_PASSOS = 3;

const ENDPOINT = "/painel/api/inscricao.php";

type CampoTexto = "nome" | "telefone" | "email" | "cidade" | "bairro";
type Envio = "parado" | "enviando" | "erro" | "pronto";

const VALIDADORES: Record<CampoTexto, (v: string) => string> = {
  nome: validarNome,
  telefone: validarTelefone,
  email: validarEmail,
  cidade: validarCidade,
  bairro: validarBairro,
};

const ROTULOS: Record<CampoTexto, string> = {
  nome: "Nome completo",
  telefone: "WhatsApp",
  email: "E-mail",
  cidade: "Cidade",
  bairro: "Bairro",
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
          <p className="in-linha">
            O movimento é feito de gente com nome e função. Escolha por onde
            você quer começar — dá pra marcar mais de uma, e dá pra mudar depois.
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

        {/* ============ PASSO 1 ============ */}
        {passo === 1 && (
          <div
            ref={listaFuncoesRef}
            tabIndex={-1}
            className="in-grupos"
          >
            <p className="in-ajuda">
              Não precisa ter experiência: o movimento ensina quem chega. Toque
              em <strong>ver detalhes</strong> pra entender o que cada função faz no dia a dia.
            </p>
            {ORDEM_GRUPOS.map((g) => {
              const lista = porGrupo.get(g) ?? [];
              if (lista.length === 0) return null;
              const info = CATALOGO.grupos[g];
              return (
                <fieldset key={g} className="in-grupo">
                  <legend className="in-grupo-nome">{info.nome}</legend>
                  <p className="in-grupo-resumo">{info.resumo}</p>
                  <div className="in-cartoes">
                    {lista.map((f) => (
                      <CartaoFuncao
                        key={f.id}
                        funcao={f}
                        marcada={funcoes.includes(f.id)}
                        aberta={aberta === f.id}
                        aoMarcar={() => alternar(f.id)}
                        aoAbrir={() => setAberta((a) => (a === f.id ? null : f.id))}
                      />
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}

        {/* ============ PASSO 2 ============ */}
        {passo === 2 && (
          <div className="in-campos">
            <p className="in-ajuda">
              O <strong>WhatsApp</strong> é o mais importante: é por ele que a
              coordenação vai te mandar seu acesso.
            </p>

            <Campo
              campo="nome" valor={campos.nome} erro={tocado.nome ? erros.nome : ""}
              dica="Como você é chamado no documento."
              autoComplete="name" inputMode="text"
              aoMudar={mudar} aoSair={aoSair} refs={refs}
            />
            <Campo
              campo="telefone" valor={campos.telefone} erro={tocado.telefone ? erros.telefone : ""}
              dica="Com DDD. Exemplo: (85) 91234-5678"
              tipo="tel" autoComplete="tel-national" inputMode="numeric"
              aoMudar={mudar} aoSair={aoSair} refs={refs}
            />
            <div className="in-linha-dupla">
              <CampoCidade
                valor={campos.cidade} erro={tocado.cidade ? erros.cidade : ""}
                aoMudar={mudar} aoSair={aoSair} refs={refs}
              />
              <Campo
                campo="bairro" valor={campos.bairro} erro={tocado.bairro ? erros.bairro : ""}
                autoComplete="address-level3" inputMode="text"
                aoMudar={mudar} aoSair={aoSair} refs={refs}
              />
            </div>
            <Campo
              campo="email" valor={campos.email} erro={tocado.email ? erros.email : ""}
              dica="Opcional — só como segunda forma de contato."
              opcional tipo="email" autoComplete="email" inputMode="email"
              aoMudar={mudar} aoSair={aoSair} refs={refs}
            />
          </div>
        )}

        {/* ============ PASSO 3 ============ */}
        {passo === 3 && (
          <div className="in-confirma">
            <div className="in-resumo">
              <h3 className="in-resumo-titulo">Você escolheu ajudar em</h3>
              <ul className="in-resumo-funcoes">
                {escolhidas.map((f) => (
                  <li key={f.id}>
                    <Icon name={f.icone as IconName} size={18} />
                    <span>{f.nome}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="in-editar" onClick={() => setPasso(1)}>
                Mudar as funções
              </button>
            </div>

            <div className="in-resumo">
              <h3 className="in-resumo-titulo">Seus dados</h3>
              <dl className="in-resumo-dados">
                {(["nome", "telefone", "cidade", "bairro", "email"] as CampoTexto[])
                  .filter((c) => campos[c].trim() !== "")
                  .map((c) => (
                    <div key={c}>
                      <dt>{ROTULOS[c]}</dt>
                      <dd>{campos[c]}</dd>
                    </div>
                  ))}
              </dl>
              <button type="button" className="in-editar" onClick={() => setPasso(2)}>
                Corrigir meus dados
              </button>
            </div>

            {/* ===== LGPD ===== */}
            <section className="in-lgpd" aria-labelledby="in-lgpd-titulo">
              <h3 id="in-lgpd-titulo" className="in-resumo-titulo">
                <Icon name="book" size={18} />
                Uso dos seus dados
              </h3>
              <ul className="in-lgpd-lista">
                <li>
                  <strong>O que a gente guarda:</strong> seu nome, WhatsApp, cidade,
                  bairro, e-mail (se você preencheu) e as funções que você escolheu.
                </li>
                <li>
                  <strong>Pra quê:</strong> falar com você sobre a militância, te
                  mandar seu acesso e organizar os times por região e função.
                </li>
                <li>
                  <strong>Quem vê:</strong> só a coordenação da Missão Ceará.
                  Seus dados <strong>não são vendidos nem compartilhados</strong> com
                  ninguém de fora.
                </li>
                <li>
                  <strong>Você manda neles:</strong> pode pedir pra ver, corrigir ou
                  apagar tudo, e pode desistir quando quiser — é só falar no{" "}
                  <a href={WHATSAPP_COORDENACAO} target="_blank" rel="noopener noreferrer">
                    WhatsApp {TELEFONE_COORDENACAO}
                  </a>
                  .
                </li>
              </ul>
              <p className="in-lgpd-link">
                Detalhes completos na{" "}
                <Link href="/privacy" target="_blank">Política de Privacidade</Link>.
              </p>

              <label className="in-consentimento" htmlFor="in-consentimento">
                <input
                  ref={consentRef}
                  id="in-consentimento"
                  type="checkbox"
                  checked={consentimento}
                  onChange={(e) => {
                    setConsentimento(e.target.checked);
                    if (e.target.checked) setErroGeral(null);
                  }}
                />
                <span>
                  Li e concordo que a Missão Ceará use meus dados para falar comigo
                  sobre a militância, como está explicado acima.
                </span>
              </label>
            </section>
          </div>
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

const CartaoFuncao: React.FC<{
  funcao: Funcao;
  marcada: boolean;
  aberta: boolean;
  aoMarcar: () => void;
  aoAbrir: () => void;
}> = ({ funcao, marcada, aberta, aoMarcar, aoAbrir }) => {
  const idDetalhe = `detalhe-${funcao.id}`;
  return (
    <div className={`in-cartao${marcada ? " marcado" : ""}`}>
      <label className="in-cartao-topo" htmlFor={`f-${funcao.id}`}>
        <input
          id={`f-${funcao.id}`}
          type="checkbox"
          checked={marcada}
          onChange={aoMarcar}
        />
        <span className="in-cartao-icone" aria-hidden="true">
          <Icon name={funcao.icone as IconName} size={22} />
        </span>
        <span className="in-cartao-texto">
          <span className="in-cartao-nome">{funcao.nome}</span>
          <span className="in-cartao-resumo">{funcao.resumo}</span>
        </span>
      </label>

      <p className="in-cartao-ritmo">
        <Icon name="clock" size={14} />
        <span>{funcao.ritmo}</span>
      </p>

      <button
        type="button"
        className="in-cartao-mais"
        onClick={aoAbrir}
        aria-expanded={aberta}
        aria-controls={idDetalhe}
      >
        {aberta ? "Esconder detalhes" : "Ver detalhes"}
      </button>

      {aberta && (
        <div className="in-cartao-detalhe" id={idDetalhe}>
          <p className="in-detalhe-entrega">
            <strong>O que você entrega:</strong> {funcao.entrega}
          </p>
          <p className="in-detalhe-rotulo">No dia a dia:</p>
          <ul>
            {funcao.detalhe.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Campo: React.FC<{
  campo: CampoTexto;
  valor: string;
  erro?: string;
  dica?: string;
  opcional?: boolean;
  tipo?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "email";
  aoMudar: (c: CampoTexto, v: string) => void;
  aoSair: (c: CampoTexto) => void;
  refs: React.MutableRefObject<Partial<Record<CampoTexto, HTMLElement | null>>>;
}> = ({ campo, valor, erro, dica, opcional, tipo = "text", autoComplete, inputMode, aoMudar, aoSair, refs }) => {
  const idErro = `erro-${campo}`;
  const idDica = `dica-${campo}`;
  const descrito = [erro ? idErro : null, dica ? idDica : null].filter(Boolean).join(" ");
  return (
    <div className="in-campo">
      <label htmlFor={campo}>
        {ROTULOS[campo]}
        {opcional && <span className="in-opcional">opcional</span>}
      </label>
      <input
        id={campo}
        ref={(el) => {
          refs.current[campo] = el;
        }}
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito || undefined}
        className={erro ? "com-erro" : undefined}
        onChange={(e) => aoMudar(campo, e.target.value)}
        onBlur={() => aoSair(campo)}
      />
      {dica && !erro && (
        <p className="in-dica" id={idDica}>{dica}</p>
      )}
      {erro && (
        <p className="in-erro" id={idErro}>{erro}</p>
      )}
    </div>
  );
};

/**
 * A cidade é escolha, não digitação.
 *
 * São 184 municípios no Ceará — uma lista fechada, que o `<select>` nativo
 * resolve sem uma linha de JavaScript e que no celular abre a roleta do próprio
 * aparelho, com busca por letra. Digitar produzia "Juazeiro do Norte",
 * "juazeiro" e "JUAZEIRO" na mesma coluna do relatório.
 *
 * **A primeira opção é para quem não é do Ceará.** Sem ela, quem está de
 * passagem — ou mora em outro estado e acompanha de longe — não teria o que
 * escolher e inventaria a cidade mais parecida, que é pior do que "de fora".
 *
 * Ele não usa o `Campo` acima porque `Campo` guarda um `ref` de `<input>` para
 * o foco do primeiro erro; o `<select>` registra o dele por conta própria, no
 * mesmo mapa, para o "leve-me ao erro" continuar funcionando.
 */
const CampoCidade: React.FC<{
  valor: string;
  erro?: string;
  aoMudar: (c: CampoTexto, v: string) => void;
  aoSair: (c: CampoTexto) => void;
  refs: React.MutableRefObject<Partial<Record<CampoTexto, HTMLElement | null>>>;
}> = ({ valor, erro, aoMudar, aoSair, refs }) => {
  const idErro = "erro-cidade";
  return (
    <div className="in-campo">
      <label htmlFor="cidade">{ROTULOS.cidade}</label>
      <select
        id="cidade"
        ref={(el) => {
          refs.current.cidade = el;
        }}
        value={valor}
        autoComplete="address-level2"
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={erro ? "com-erro" : undefined}
        onChange={(e) => aoMudar("cidade", e.target.value)}
        onBlur={() => aoSair("cidade")}
      >
        <option value="">Escolha sua cidade</option>
        <option value={FORA_DO_CEARA}>{FORA_DO_CEARA} — estou de fora</option>
        <optgroup label="Ceará">
          {MUNICIPIOS_CE.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </optgroup>
      </select>
      {erro && (
        <p className="in-erro" id={idErro}>{erro}</p>
      )}
    </div>
  );
};

/**
 * A tela depois do envio.
 *
 * Antes ela listava três passos que eram todos **ação de outra pessoa** ("a
 * coordenação vai olhar", "costuma levar alguns dias") e terminava em espera. É
 * o pior momento possível para não ter o que fazer: quem acabou de se inscrever
 * está no pico de entusiasmo que vai ter, e se a aprovação demora três dias,
 * esse pico passa sem virar nada.
 *
 * Agora o que vem primeiro é o que **não depende de aprovação nenhuma** — e o
 * que a coordenação faz do lado dela vem depois, como informação, não como
 * instrução de esperar.
 */
const Sucesso: React.FC<{ nome: string; cidade: string; escolhidas: Funcao[] }> = ({ nome, cidade, escolhidas }) => {
  const primeiro = nome.trim().split(" ")[0] || "companheiro";
  const [convite, setConvite] = useState("Mandar o convite");

  /* A pessoa acabou de digitar o nome dela no formulário: o crédito sai daqui
     sem pedir nada de novo. E fica guardado para o mutirão não perguntar de
     novo depois — era o mesmo nome, digitado duas vezes, em duas páginas. */
  const slug = slugDe(nome);
  useEffect(() => {
    if (slug === "") return;
    try { localStorage.setItem(CHAVE_NOME, nome.trim()); } catch { /* aba anônima */ }
  }, [nome, slug]);

  const convidar = async () => {
    const url = `${SITE}/queroajudar${slug === "" ? "" : `?de=${slug}`}`;
    const texto =
      "Entrei na militância da Missão no Ceará. É gente organizada de verdade, " +
      "com plano de governo escrito e função pra cada um. Dá uma olhada:";
    const r = await compartilharTexto(texto, url);
    if (r === "copiou") setConvite("Link copiado!");
    else if (r === "falhou") setConvite("Não deu — copie o link da barra");
    if (r === "copiou" || r === "falhou") {
      window.setTimeout(() => setConvite("Mandar o convite"), 4000);
    }
  };

  return (
    <div className="in-fundo">
      <main className="in-main in-sucesso">
        <span className="in-sucesso-selo" aria-hidden="true">
          <Icon name="flag" size={40} />
        </span>
        <h1 className="in-titulo">Chegou, {primeiro}!</h1>
        <p className="in-linha">
          {escolhidas.length > 0 ? (
            <>
              Sua inscrição para{" "}
              <strong>{escolhidas.map((f) => f.nome).join(" e ")}</strong> está com a
              coordenação. Enquanto ela confere, tem quatro coisas que você já pode fazer.
            </>
          ) : (
            <>
              Sua inscrição está com a coordenação. Enquanto ela confere, tem cinco coisas
              que você já pode fazer.
            </>
          )}
        </p>

        <p className="in-agora-titulo">Agora, sem esperar ninguém</p>
        <ol className="in-proximos">
          {/* O "oi" vem antes do grupo de propósito: é o único passo que acelera
              a APROVAÇÃO dela, e é o que impede o número da coordenação de cair.
              Quem manda a primeira mensagem abre a conversa; a coordenação
              responde dentro dela em vez de abordar dezenas de desconhecidos —
              que é o que o WhatsApp pune com bloqueio. */}
          <li>
            <b>1</b>
            <span>
              <strong>Manda um oi pra coordenação.</strong> É o que faz sua aprovação
              andar: com a conversa aberta, dá pra te responder na hora. A mensagem
              já vai escrita.
              <a
                className="in-passo-link"
                href={linkOiCoordenacao(nome, cidade)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={15} />
                Mandar o oi agora
              </a>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              <strong>Entre no grupo.</strong> É onde sai a convocação da semana e o aviso de
              cada encontro. Entrada direta, sem esperar ninguém aprovar nada.
              <a
                className="in-passo-link"
                href={GRUPO_GERAL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={15} />
                Entrar no grupo agora
              </a>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              <strong>Leia o plano.</strong> São sete compromissos com meta, prazo e de onde vem o
              dinheiro. Quem conhece o plano consegue defender o movimento em qualquer conversa.
              <Link className="in-passo-link" href="/propostas">
                <Icon name="book" size={15} />
                Ver as propostas
              </Link>
            </span>
          </li>
          <li>
            <b>4</b>
            <span>
              <strong>Comece a espalhar.</strong> Na Munição tem arte e texto prontos, cada um com a
              página do plano. Põe seu nome lá e a coordenação vê quem você trouxe.
              <Link className="in-passo-link" href="/municao">
                <Icon name="broadcast" size={15} />
                Abrir a Munição
              </Link>
            </span>
          </li>
          <li>
            <b>5</b>
            <span>
              <strong>Chame mais gente.</strong> Manda o link pra quem você sabe que ia
              querer estar junto. Ele já vai com o seu nome — a coordenação vê quem
              trouxe cada pessoa.
              <button type="button" className="in-passo-link" onClick={convidar}>
                <Icon name="whatsapp" size={15} />
                {convite}
              </button>
            </span>
          </li>
        </ol>

        <p className="in-agora-titulo">O que a coordenação faz do lado dela</p>
        <p className="in-aviso" style={{ margin: "10px 0 0" }}>
          Confere sua inscrição e te <strong>responde no WhatsApp</strong> com o usuário e uma
          senha provisória para entrar na área da militância, onde ficam a formação e as
          ferramentas. No primeiro acesso você troca a senha. É por isso que o passo 1 é
          você mandar o oi: a resposta chega na conversa que você abriu. Se passar de alguns
          dias, chama de novo sem cerimônia — não é incômodo.
        </p>

        <div className="in-acoes">
          <a
            className="in-btn in-btn-principal"
            href={GRUPO_GERAL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" size={18} />
            <span>Entrar no grupo</span>
          </a>
          <Link className="in-btn in-btn-fantasma" href="/">
            <Icon name="arrowLeft" size={18} />
            <span>Voltar pro site</span>
          </Link>
        </div>
      </main>
      <style>{css}</style>
    </div>
  );
};

/* ===================== estilos ===================== */

const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

const css = `
  .in-fundo {
    min-height: 100dvh;
    background: ${HATCH}, ${C.paper};
    color: ${C.ink};
    font-family: ${FONT_BITTER};
    /* o layout declara color-scheme: dark; aqui o fundo é papel claro, e sem
       isto o navegador desenha caixa e seta dos controles em tema escuro */
    color-scheme: light;
  }
  /* ...menos no bloco de LGPD, que é o único em fundo noite */
  .in-lgpd { color-scheme: dark; }
  .in-main { max-width: 760px; margin: 0 auto; padding: 22px 18px 64px; }

  .in-sr {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
  }
  .in-armadilha {
    position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;
  }

  .in-voltar-site {
    display: inline-flex; align-items: center; gap: 8px; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.cream}; text-decoration: none;
    padding: 10px 15px; border: 3px solid ${C.ink};
    box-shadow: 3px 3px 0 rgba(24,18,3,.28);
    margin-bottom: 22px;
  }

  .in-cabecalho { margin-bottom: 26px; }
  .in-chip {
    display: inline-block; font-family: ${FONT_ELITE};
    letter-spacing: 4px; font-size: 12px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold};
    padding: 4px 14px; box-shadow: 3px 3px 0 rgba(24,18,3,.3);
    margin: 0 0 12px;
  }
  .in-titulo {
    font-family: ${FONT_ALFA}; font-size: clamp(30px, 8vw, 46px);
    letter-spacing: 1; line-height: 1.06; margin: 0 0 10px;
    text-shadow: 3px 3px 0 ${C.gold};
  }
  .in-linha { font-size: 15.5px; line-height: 1.55; max-width: 560px; margin: 0; }

  /* ---- progresso ---- */
  .in-progresso { display: flex; gap: 8px; margin: 26px 0 6px; }
  .in-passo-marca {
    flex: 1 1 0; display: flex; align-items: center; gap: 8px;
    border-top: 5px solid rgba(24,18,3,.2); padding-top: 8px;
  }
  .in-passo-marca.ativo { border-top-color: ${C.ink}; }
  .in-passo-marca b {
    width: 26px; height: 26px; flex: 0 0 auto; display: grid; place-items: center;
    font-family: ${FONT_ALFA}; font-size: 13px;
    background: rgba(24,18,3,.14); color: rgba(24,18,3,.55); border: 2px solid transparent;
  }
  .in-passo-marca.ativo b { background: ${C.gold}; color: ${C.ink}; border-color: ${C.ink}; }
  .in-passo-marca i {
    font-family: ${FONT_ELITE}; font-style: normal; font-size: 11px;
    letter-spacing: 1.2px; text-transform: uppercase; opacity: .75;
  }

  .in-passo-titulo {
    font-family: ${FONT_ALFA}; font-size: clamp(21px, 5vw, 27px);
    margin: 22px 0 14px; outline: none;
  }
  .in-passo-titulo:focus-visible { outline: 3px solid ${C.goldDim}; outline-offset: 4px; }

  .in-ajuda {
    font-size: 14.5px; line-height: 1.6; margin: 0 0 18px;
    background: ${C.cream}; border-left: 5px solid ${C.gold};
    padding: 12px 14px;
  }

  .in-erro-geral {
    display: flex; align-items: flex-start; gap: 9px;
    font-size: 14.5px; line-height: 1.5; margin: 0 0 16px;
    background: #FBE3E0; border: 2px solid #8C2F22; color: #6B1F15;
    padding: 12px 14px;
  }
  .in-erro-geral svg { flex: 0 0 auto; margin-top: 2px; }

  /* ---- passo 1: funções ---- */
  .in-grupos { outline: none; }
  .in-grupo { border: 0; padding: 0; margin: 0 0 28px; }
  .in-grupo-nome {
    font-family: ${FONT_ALFA}; font-size: 19px; padding: 0;
    background: ${C.gold}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.3);
    padding: 5px 13px; margin-bottom: 10px;
  }
  .in-grupo-resumo { font-size: 14px; line-height: 1.55; opacity: .8; margin: 0 0 14px; }
  .in-cartoes { display: grid; gap: 12px; }

  .in-cartao {
    background: ${C.cream}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.24);
    padding: 12px 14px 10px;
    transition: box-shadow .12s ease, transform .12s ease;
  }
  .in-cartao.marcado {
    background: #FFF6D4;
    box-shadow: 5px 5px 0 ${C.goldDim};
  }
  .in-cartao-topo {
    display: flex; align-items: flex-start; gap: 11px; cursor: pointer;
    min-height: 44px;
  }
  .in-cartao-topo input {
    width: 24px; height: 24px; flex: 0 0 auto; margin: 2px 0 0;
    accent-color: ${C.goldDim}; cursor: pointer;
  }
  .in-cartao-icone {
    width: 40px; height: 40px; flex: 0 0 auto; display: grid; place-items: center;
    background: ${C.gold}; border: 2px solid ${C.ink}; color: ${C.ink};
  }
  .in-cartao-texto { flex: 1; min-width: 0; }
  .in-cartao-nome {
    display: block; font-family: ${FONT_ALFA}; font-size: 17px;
    letter-spacing: .3px; line-height: 1.2; margin-bottom: 3px;
  }
  .in-cartao-resumo { display: block; font-size: 14px; line-height: 1.5; opacity: .85; }

  .in-cartao-ritmo {
    display: flex; align-items: center; gap: 7px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: .6px;
    opacity: .75; margin: 10px 0 0; padding-left: 35px;
  }
  .in-cartao-ritmo svg { flex: 0 0 auto; }

  .in-cartao-mais {
    display: inline-flex; align-items: center; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.4px;
    text-transform: uppercase; text-decoration: underline;
    background: none; border: 0; color: ${C.ink}; cursor: pointer;
    padding: 6px 0 2px; margin-left: 35px;
  }
  .in-cartao-detalhe {
    border-top: 2px dashed rgba(24,18,3,.3); margin-top: 6px; padding-top: 11px;
    font-size: 14px; line-height: 1.6;
  }
  .in-detalhe-entrega { margin: 0 0 10px; }
  .in-detalhe-rotulo {
    font-family: ${FONT_ELITE}; font-size: 11px; letter-spacing: 1.5px;
    text-transform: uppercase; opacity: .7; margin: 0 0 5px;
  }
  .in-cartao-detalhe ul { margin: 0; padding-left: 19px; display: flex; flex-direction: column; gap: 5px; }

  .in-contagem {
    text-align: center; font-family: ${FONT_ELITE}; font-size: 12.5px;
    letter-spacing: 1.5px; margin: 14px 0 0; opacity: .8;
  }

  /* ---- passo 2: campos ---- */
  .in-campos { display: flex; flex-direction: column; gap: 4px; }
  .in-linha-dupla { display: grid; gap: 4px; grid-template-columns: 1fr 1fr; }
  .in-campo { margin-bottom: 16px; }
  .in-campo label {
    display: block; font-family: ${FONT_ELITE}; font-size: 12px;
    letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 5px;
  }
  .in-opcional {
    font-size: 10.5px; letter-spacing: 1px; opacity: .6;
    margin-left: 7px; text-transform: none;
  }
  .in-campo input, .in-campo select {
    width: 100%; font-family: ${FONT_BITTER}; font-size: 16px;
    min-height: 48px; padding: 11px 13px;
    background: ${C.cream}; color: ${C.ink};
    border: 3px solid ${C.ink}; border-radius: 0;
    box-shadow: 3px 3px 0 rgba(24,18,3,.24);
  }
  .in-campo input:focus-visible, .in-campo select:focus-visible { outline: 3px solid ${C.goldDim}; outline-offset: 2px; }
  .in-campo input.com-erro, .in-campo select.com-erro { border-color: #8C2F22; box-shadow: 3px 3px 0 rgba(140,47,34,.3); }
  .in-dica { font-size: 13px; line-height: 1.45; opacity: .7; margin: 6px 0 0; }
  .in-erro {
    font-size: 13.5px; line-height: 1.45; margin: 6px 0 0;
    color: #8C2F22; font-weight: 600;
  }

  /* ---- passo 3: confirmação ---- */
  .in-confirma { display: flex; flex-direction: column; gap: 16px; }
  .in-resumo {
    background: ${C.cream}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.24); padding: 15px 16px;
  }
  .in-resumo-titulo {
    display: flex; align-items: center; gap: 8px;
    font-family: ${FONT_ALFA}; font-size: 17px; margin: 0 0 11px;
  }
  .in-resumo-funcoes { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .in-resumo-funcoes li {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 14px; background: ${C.gold}; color: ${C.ink};
    border: 2px solid ${C.ink}; padding: 6px 11px;
  }
  .in-resumo-dados { margin: 0; display: flex; flex-direction: column; gap: 9px; }
  .in-resumo-dados div { display: flex; gap: 10px; flex-wrap: wrap; font-size: 14.5px; }
  .in-resumo-dados dt {
    font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 1.3px;
    text-transform: uppercase; opacity: .7; min-width: 108px;
  }
  .in-resumo-dados dd { margin: 0; font-weight: 600; }
  .in-editar {
    display: inline-flex; align-items: center; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.4px;
    text-transform: uppercase; text-decoration: underline;
    background: none; border: 0; color: ${C.ink}; cursor: pointer;
    padding: 8px 0 0;
  }

  .in-lgpd {
    background: ${C.night}; color: ${C.cream};
    border: 3px solid ${C.ink}; box-shadow: 4px 4px 0 rgba(24,18,3,.4);
    padding: 16px;
  }
  .in-lgpd .in-resumo-titulo { color: ${C.gold}; }
  .in-lgpd-lista {
    list-style: none; margin: 0 0 12px; padding: 0;
    display: flex; flex-direction: column; gap: 10px;
    font-size: 14px; line-height: 1.6;
  }
  .in-lgpd-lista strong { color: ${C.gold2}; }
  .in-lgpd a { color: ${C.gold}; }
  .in-lgpd-link { font-size: 13.5px; margin: 0 0 15px; opacity: .9; }

  .in-consentimento {
    display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
    background: rgba(255,203,5,.1); border: 2px solid ${C.gold};
    padding: 13px; font-size: 14.5px; line-height: 1.55;
  }
  .in-consentimento input {
    width: 26px; height: 26px; flex: 0 0 auto; margin: 0;
    accent-color: ${C.gold}; cursor: pointer;
  }

  /* ---- navegação ---- */
  .in-acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
  .in-btn {
    flex: 1 1 190px; min-height: 52px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    font-family: ${FONT_ALFA}; font-size: 16px; letter-spacing: .4px;
    text-decoration: none; text-align: center;
    border: 3px solid ${C.ink}; padding: 13px 20px;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .in-btn svg { flex: 0 0 auto; }
  .in-btn-principal { background: ${C.gold}; color: ${C.ink}; box-shadow: 5px 5px 0 rgba(24,18,3,.35); }
  .in-btn-fantasma { background: ${C.cream}; color: ${C.ink}; box-shadow: 5px 5px 0 rgba(24,18,3,.2); flex: 0 1 150px; }
  .in-btn:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 rgba(24,18,3,.38); }
  .in-btn:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 rgba(24,18,3,.3); }
  .in-btn:disabled { opacity: .6; cursor: progress; transform: none; }
  .in-btn:focus-visible { outline: 3px solid ${C.goldDim}; outline-offset: 4px; }

  /* ---- sucesso ---- */
  .in-sucesso { text-align: center; padding-top: 48px; }
  .in-sucesso-selo {
    width: 84px; height: 84px; margin: 0 auto 20px;
    display: grid; place-items: center;
    background: ${C.gold}; color: ${C.ink};
    border: 4px solid ${C.ink}; border-radius: 50%;
    box-shadow: 6px 6px 0 rgba(24,18,3,.3);
  }
  .in-sucesso .in-linha { margin: 0 auto; }
  .in-proximos {
    list-style: none; margin: 28px 0 0; padding: 0;
    display: flex; flex-direction: column; gap: 11px; text-align: left;
  }
  .in-proximos li {
    display: flex; align-items: flex-start; gap: 13px;
    background: ${C.cream}; border: 3px solid ${C.ink};
    box-shadow: 4px 4px 0 rgba(24,18,3,.22);
    padding: 13px 15px; font-size: 14.5px; line-height: 1.55;
  }
  .in-proximos b {
    width: 32px; height: 32px; flex: 0 0 auto; display: grid; place-items: center;
    font-family: ${FONT_ALFA}; font-size: 15px;
    background: ${C.gold}; color: ${C.ink}; border: 2px solid ${C.ink};
  }
  .in-agora-titulo {
    font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 2.2px;
    text-transform: uppercase; opacity: .7; text-align: left;
    margin: 30px 0 0;
  }
  /* display:flex, e não inline-flex: o link tem que cair na própria linha,
     depois do texto. Com inline-flex ele emendaria no fim do parágrafo — e
     transformar o span em coluna de flex, que foi a primeira tentativa, jogava
     cada palavra em negrito para uma linha só dela.
     (Nada de crase neste bloco: ele mora dentro de um template literal.) */
  .in-passo-link {
    display: flex; width: fit-content; align-items: center; gap: 7px;
    min-height: 44px; margin-top: 6px; font-family: ${FONT_ELITE}; font-size: 12px;
    letter-spacing: 1.2px; text-transform: uppercase;
    color: ${C.ink}; text-decoration: underline; text-underline-offset: 3px;
  }
  /* O passo 4 é <button> (chama a Web Share API), os outros são <a>. Sem este
     reset o navegador desenha caixa cinza de botão no meio de três links. */
  button.in-passo-link {
    background: none; border: 0; padding: 0; cursor: pointer; text-align: left;
  }
  .in-aviso { font-size: 14px; line-height: 1.6; opacity: .8; margin: 20px 0 0; }
  .in-sucesso .in-acoes { justify-content: center; }

  /* ---- telas pequenas ---- */
  @media (max-width: 620px) {
    .in-main { padding: 16px 14px 56px; }
    .in-linha-dupla { grid-template-columns: 1fr; }
    .in-passo-marca i { display: none; }
    .in-passo-marca { gap: 0; justify-content: center; }
    .in-resumo-dados div { flex-direction: column; gap: 2px; }
    .in-btn { flex: 1 1 100%; }
    .in-btn-fantasma { flex: 1 1 100%; order: 2; }
  }

  @media (hover: none) {
    .in-btn:hover { transform: none; box-shadow: 5px 5px 0 rgba(24,18,3,.35); }
  }
  @media (prefers-reduced-motion: reduce) {
    .in-btn, .in-cartao { transition: none !important; }
  }
`;
