"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { obterEncontro, enviarPresenca, procurarPessoa, confirmarPessoa } from "@/lib/api/presenca";
import {
  mascararTelefone,
  soDigitos,
  validarBairro,
  validarCidade,
  validarNome,
  validarTelefone,
  CHAVE_RASCUNHO,
} from "@/features/inscricao/validacao";
import { slugDe } from "@/lib/atribuicao";
import type { Alvo, Encontro } from "./tipos";

/**
 * Cadastro na porta do encontro — o QR da mesa da Recepção abre esta página.
 *
 * Feita para ser preenchida em pé, com uma mão, em vinte segundos. São os
 * mesmos quatro campos obrigatórios do /queroajudar — WhatsApp, nome completo,
 * bairro e cidade — e é essa igualdade que deixa um lado preencher o outro sem
 * a pessoa digitar duas vezes. Fila na entrada é lead perdido, e formulário
 * longo é fila.
 *
 * A validação vem de `@/features/inscricao/validacao`: a régua boa já existia
 * de um lado só, com máscara, conferência de DDD de verdade e mensagem que diz
 * como corrigir. Duas réguas divergem na terceira alteração.
 *
 * O token do encontro vem na URL. Ele é conferido ANTES de o formulário
 * aparecer: link velho não pede dado de ninguém.
 */

/**
 * As telas, na ordem em que a pessoa passa por elas.
 *
 * `telefone` é a primeira e resolve a maioria dos casos sozinha: quem já veio
 * a um encontro, quem se inscreveu em /queroajudar e quem tem conta no painel
 * são todos achados pelo número, e não digitam mais nada. `escolher` só
 * aparece quando duas pessoas dividem o mesmo celular; `formulario` só para
 * quem o sistema não conhece.
 */
type Fase =
  | "carregando"
  | "sem-encontro"
  | "telefone"
  | "escolher"
  | "formulario"
  | "enviando"
  | "pronto";

export default function PresencaClient() {
  const [fase, setFase] = useState<Fase>("carregando");
  const [encontro, setEncontro] = useState<Encontro | null>(null);
  const [alvo, setAlvo] = useState<Alvo>({});
  const [erro, setErro] = useState<string | null>(null);
  const [jaEstava, setJaEstava] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [opcoes, setOpcoes] = useState<{ ref: string; nome: string }[]>([]);
  /* O primeiro nome de quem foi reconhecido, para a tela de "pronto" dizer quem
     entrou. Se a pessoa errou um dígito e caiu no cadastro de outra, é aqui que
     ela descobre — devolver nada faria o sistema confirmar a pessoa errada em
     silêncio. */
  const [reconhecido, setReconhecido] = useState("");
  const [ofereceAjudar, setOfereceAjudar] = useState(false);
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [convidadoPor, setConvidadoPor] = useState("");
  /* O erro aparece no campo ao sair dele, não numa lista no topo depois do
     envio: quem preenche em pé precisa consertar onde está olhando. */
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [consentimento, setConsentimento] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const busca = new URLSearchParams(window.location.search);
    /* `?e=` é o QR da mesa (cheguei); `?c=` é o link do grupo (vou). São dois
       tokens diferentes de propósito — com um só, quem recebesse o link no
       grupo se marcaria como presente sem sair de casa. */
    const doQr = busca.get("e") ?? "";
    const doGrupo = busca.get("c") ?? "";
    const a: Alvo = doQr ? { evento: doQr } : doGrupo ? { confirmacao: doGrupo } : {};
    setAlvo(a);

    if (!a.evento && !a.confirmacao) {
      setFase("sem-encontro");
      return;
    }

    let ativo = true;
    obterEncontro(a)
      .then((e) => {
        if (!ativo) return;
        setEncontro(e);
        setFase(e.existe ? "telefone" : "sem-encontro");
      })
      .catch(() => {
        if (ativo) setFase("sem-encontro");
      });

    return () => {
      ativo = false;
    };
  }, []);

  const erros = {
    nome: validarNome(nome),
    telefone: validarTelefone(telefone),
    bairro: validarBairro(bairro),
    cidade: validarCidade(cidade),
  };
  const aoSair = (campo: string) => setTocado((t) => ({ ...t, [campo]: true }));
  const veio = honeypot.current?.value ?? "";

  /** Traduz a resposta de "achei você" nas duas telas que ela pode gerar. */
  const acolher = (r: { nome?: string; inscrito?: boolean }) => {
    setReconhecido(r.nome ?? "");
    /* Quem já é do movimento não precisa ser convidado de novo. Quem não é
       acabou de aparecer num encontro por vontade própria — é o melhor momento
       que vai existir para perguntar. */
    setOfereceAjudar(r.inscrito === false);
    setFase("pronto");
  };

  /* ---------- passo 1: só o WhatsApp ---------- */
  const procurar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErro(null);
    if (erros.telefone !== "") {
      setTocado((t) => ({ ...t, telefone: true }));
      setErro(erros.telefone);
      return;
    }

    setFase("enviando");
    try {
      const r = await procurarPessoa(alvo, soDigitos(telefone), veio);
      if (!r.ok) {
        setErro(r.erro);
        setFase("telefone");
        return;
      }
      if ("pessoas" in r) {
        setOpcoes(r.pessoas);
        setFase("escolher");
        return;
      }
      if ("nome" in r) {
        acolher(r);
        return;
      }
      /* achou 0: o sistema não conhece este número, então pede a ficha curta —
         com o telefone já preenchido, que é o que ela acabou de digitar. */
      setFase("formulario");
    } catch {
      setErro("Não deu para conferir agora. Chame alguém da recepção.");
      setFase("telefone");
    }
  };

  /* ---------- passo 2: "sou este aqui" (dois no mesmo número) ---------- */
  const escolher = async (ref: string) => {
    setErro(null);
    setFase("enviando");
    try {
      const r = await confirmarPessoa(alvo, soDigitos(telefone), ref, veio);
      if (!r.ok) {
        setErro(r.erro);
        setFase("formulario");
        return;
      }
      setJaEstava(Boolean(r.jaEstava));
      acolher(r);
    } catch {
      setErro("Não deu para enviar agora. Chame alguém da recepção.");
      setFase("escolher");
    }
  };

  /* ---------- passo 3: a ficha curta, para quem o sistema não conhece ---------- */
  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErro(null);

    const primeiro = (Object.keys(erros) as (keyof typeof erros)[]).find((k) => erros[k] !== "");
    if (primeiro) {
      /* Marca tudo como tocado para os erros aparecerem de uma vez nos campos —
         senão a pessoa conserta um, envia, e descobre o próximo. */
      setTocado({ nome: true, telefone: true, bairro: true, cidade: true });
      setErro(erros[primeiro]);
      return;
    }
    if (!consentimento) {
      setErro("Falta marcar a caixinha de concordar com o uso dos seus dados.");
      return;
    }

    setFase("enviando");
    try {
      const r = await enviarPresenca(alvo, {
        nome: nome.trim().replace(/\s+/g, " "),
        telefone: soDigitos(telefone),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        convidadoPor: convidadoPor.trim(),
        consentimento: true,
        site: veio,
      });

      if (!r.ok) {
        setErro(r.erro);
        setFase("formulario");
        return;
      }
      setJaEstava(Boolean(r.jaEstava));
      acolher(r);
    } catch {
      setErro("Não deu para enviar agora. Chame alguém da recepção.");
      setFase("formulario");
    }
  };

  /**
   * Leva para /queroajudar com o que a pessoa acabou de dizer.
   *
   * Por `sessionStorage`, e NUNCA por querystring: telefone em URL entra no
   * histórico do navegador, no cabeçalho de referrer e no log de acesso do
   * servidor. É a mesma chave que o formulário de inscrição lê no mount.
   *
   * O `?de=` fica na URL porque não é dado pessoal — é de onde a pessoa veio, e
   * é ele que responde "quantos militantes saíram do encontro X".
   */
  const levarParaAjudar = () => {
    const dados = {
      nome: nome.trim() || reconhecido,
      telefone: soDigitos(telefone),
      cidade: cidade.trim(),
      bairro: bairro.trim(),
    };
    try {
      sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(dados));
    } catch { /* aba anônima: a pessoa digita de novo, e tudo bem */ }

    const titulo = encontro?.existe ? encontro.titulo : "";
    const origem = titulo ? `encontro-${slugDe(titulo)}` : "encontro";
    window.location.href = `/queroajudar?de=${encodeURIComponent(origem)}`;
  };

  /* ---------- telas curtas ---------- */

  if (fase === "carregando") {
    return <Casca titulo="Um instante…" />;
  }

  if (fase === "sem-encontro") {
    return (
      <Casca titulo="Link sem encontro">
        <p style={textoP}>
          Esse link de presença não vale mais, ou está incompleto. Chame alguém da
          recepção — dá para cadastrar você na hora.
        </p>
        <Voltar />
      </Casca>
    );
  }

  if (fase === "pronto") {
    const confirmando = encontro?.existe && encontro.modo === "confirmacao";
    return (
      <Casca
        titulo={
          reconhecido
            ? `${confirmando ? "Combinado" : "Bem-vindo"}, ${reconhecido}!`
            : jaEstava
              ? "Você já estava na lista"
              : "Pronto!"
        }
      >
        <p style={textoP}>
          {confirmando
            ? "Sua presença está confirmada. A gente te espera — se não der para ir, tudo bem, é só não aparecer."
            : jaEstava
              ? "Seu nome já tinha entrado. Pode guardar o celular e aproveitar o encontro."
              : "Você está na lista. Obrigado por estar com a gente."}
        </p>

        {/* A pessoa apareceu num encontro por vontade própria e ainda não é do
            movimento: é o melhor momento que vai existir para perguntar. Os
            dados vão por sessionStorage e NUNCA pela URL — telefone em
            querystring entra no histórico, no referrer e no log do servidor. */}
        {ofereceAjudar && (
          <section
            style={{
              border: `3px solid ${C.gold}`,
              background: "rgba(255,203,5,.08)",
              padding: "18px 18px 20px",
              margin: "0 auto 22px",
              maxWidth: 420,
              textAlign: "left",
            }}
          >
            <p style={{ margin: "0 0 12px", fontSize: 15.5, lineHeight: 1.65 }}>
              <strong>Quer ajudar de verdade?</strong> Tem função para quem tem uma hora
              por semana e para quem tem o dia. Seus dados já vão preenchidos — é só
              escolher como quer ajudar.
            </p>
            <button type="button" onClick={levarParaAjudar} style={botaoOuro}>
              Quero ajudar
            </button>
          </section>
        )}

        <Voltar />
      </Casca>
    );
  }

  const detalhes = encontro?.existe ? encontro : null;
  const confirmando = detalhes?.modo === "confirmacao";

  /* ---------- passo 1: o WhatsApp, e mais nada ---------- */
  if (fase === "telefone") {
    return (
      <Casca titulo={detalhes?.titulo ?? "Presença"}>
        <Quando detalhes={detalhes} />
        <form onSubmit={procurar} style={{ textAlign: "left" }}>
          <p style={{ ...textoP, margin: "0 0 18px" }}>
            {confirmando
              ? "Diz seu WhatsApp para confirmar que você vem."
              : "Diz seu WhatsApp para entrar na lista."}{" "}
            Se você já veio a algum encontro ou já se inscreveu, é só isso — o resto a
            gente já tem.
          </p>
          <Campo
            id="p-tel"
            rotulo="WhatsApp"
            valor={telefone}
            aoMudar={(v) => setTelefone(mascararTelefone(v))}
            aoSair={() => aoSair("telefone")}
            erro={tocado.telefone ? erros.telefone : ""}
            tipo="tel"
            modo="numeric"
            dica="Com DDD. Exemplo: (85) 91234-5678"
            autoComplete="tel-national"
            autoFoco
            required
          />
          <Armadilha honeypot={honeypot} />
          {erro && <Erro texto={erro} />}
          <button type="submit" style={botaoOuro}>
            Continuar
          </button>
        </form>
      </Casca>
    );
  }

  /* ---------- passo 2: dois no mesmo número ---------- */
  if (fase === "escolher") {
    return (
      <Casca titulo="Qual é você?">
        <p style={textoP}>
          Esse número está no cadastro de mais de uma pessoa — em casa que divide
          celular isso é comum. Toque no seu nome.
        </p>
        <div style={{ display: "grid", gap: 10, maxWidth: 420, margin: "0 auto 20px" }}>
          {opcoes.map((o) => (
            <button key={o.ref} type="button" onClick={() => escolher(o.ref)} style={botaoEscolha}>
              {o.nome}
            </button>
          ))}
          <button type="button" onClick={() => setFase("formulario")} style={botaoEscolhaFraco}>
            Não sou nenhum desses
          </button>
        </div>
        {erro && <Erro texto={erro} />}
      </Casca>
    );
  }

  return (
    <Casca titulo={detalhes?.titulo ?? "Presença"}>
      <Quando detalhes={detalhes} />

      <form onSubmit={enviar} style={{ textAlign: "left" }}>
        <p style={{ ...textoP, margin: "0 0 18px" }}>
          A gente ainda não te conhece — são quatro campos e acabou.
        </p>
        <Campo
          id="p-nome"
          rotulo="Nome completo"
          valor={nome}
          aoMudar={setNome}
          aoSair={() => aoSair("nome")}
          erro={tocado.nome ? erros.nome : ""}
          autoComplete="name"
          autoFoco
          required
        />
        {/* O WhatsApp já foi digitado no passo anterior: repetir o campo é
            pedir para a pessoa digitar duas vezes o mesmo número, e é como um
            deles sai errado. Continua editável — quem errou um dígito conserta
            aqui em vez de recomeçar. */}
        <Campo
          id="p-tel"
          rotulo="WhatsApp"
          valor={telefone}
          aoMudar={(v) => setTelefone(mascararTelefone(v))}
          aoSair={() => aoSair("telefone")}
          erro={tocado.telefone ? erros.telefone : ""}
          tipo="tel"
          modo="numeric"
          dica="Confira: é por aqui que a coordenação fala com você."
          autoComplete="tel-national"
          required
        />
        <Campo
          id="p-cidade"
          rotulo="Cidade"
          valor={cidade}
          aoMudar={setCidade}
          aoSair={() => aoSair("cidade")}
          erro={tocado.cidade ? erros.cidade : ""}
          autoComplete="address-level2"
          required
        />
        <Campo
          id="p-bairro"
          rotulo="Bairro"
          valor={bairro}
          aoMudar={setBairro}
          aoSair={() => aoSair("bairro")}
          erro={tocado.bairro ? erros.bairro : ""}
          autoComplete="address-level3"
          required
        />
        <Campo
          id="p-conv"
          rotulo="Quem te convidou"
          valor={convidadoPor}
          aoMudar={setConvidadoPor}
          opcional
          dica="Se alguém te chamou, deixa o nome — ajuda a gente a agradecer"
        />

        <section
          style={{
            border: `3px solid ${C.gold}`,
            background: "rgba(255,203,5,.08)",
            padding: "14px 16px",
            margin: "6px 0 20px",
          }}
        >
          <p
            style={{
              fontFamily: FONT_ELITE,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: C.gold,
              margin: "0 0 10px",
            }}
          >
            Uso dos seus dados
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 14.5, lineHeight: 1.65 }}>
            Guardamos seu nome, WhatsApp, bairro e cidade só para falar com você sobre o
            movimento. <strong>Não vendemos nem repassamos</strong> para ninguém de
            fora, e você pode pedir para apagar quando quiser.
          </p>
          <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#b9b3a5" }}>
            Detalhes na{" "}
            <Link href="/privacy" target="_blank" style={{ color: C.gold }}>
              Política de Privacidade
            </Link>
            .
          </p>

          <label
            htmlFor="p-consentimento"
            style={{ display: "flex", gap: 10, alignItems: "flex-start", minHeight: 44, cursor: "pointer" }}
          >
            <input
              id="p-consentimento"
              type="checkbox"
              checked={consentimento}
              onChange={(e) => {
                setConsentimento(e.target.checked);
                if (e.target.checked) setErro(null);
              }}
              style={{ width: 22, height: 22, flex: "0 0 auto", marginTop: 2, accentColor: C.gold }}
            />
            <span style={{ fontSize: 14.5, lineHeight: 1.55 }}>
              Concordo que a Missão Ceará use meus dados para falar comigo.
            </span>
          </label>
        </section>

        <Armadilha honeypot={honeypot} />

        {erro && <Erro texto={erro} />}

        <button
          type="submit"
          disabled={fase === "enviando"}
          style={{
            width: "100%",
            minHeight: 52,
            padding: "14px 20px",
            cursor: fase === "enviando" ? "wait" : "pointer",
            fontFamily: FONT_ALFA,
            fontSize: 17,
            background: C.gold,
            color: C.ink,
            border: `3px solid ${C.ink}`,
            boxShadow: "5px 5px 0 rgba(24,18,3,.4)",
            opacity: fase === "enviando" ? 0.6 : 1,
          }}
        >
          {fase === "enviando" ? "Enviando…" : confirmando ? "Confirmar que vou" : "Estou aqui"}
        </button>
      </form>
    </Casca>
  );
}

/* ===================== peças ===================== */

const botaoOuro: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  padding: "14px 20px",
  cursor: "pointer",
  fontFamily: FONT_ALFA,
  fontSize: 17,
  background: C.gold,
  color: C.ink,
  border: `3px solid ${C.ink}`,
  boxShadow: "5px 5px 0 rgba(24,18,3,.4)",
};

const botaoEscolha: React.CSSProperties = {
  minHeight: 56,
  padding: "14px 18px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: FONT_BITTER,
  fontSize: 16.5,
  color: C.cream,
  background: "rgba(255,203,5,.08)",
  border: `3px solid ${C.gold}`,
};

const botaoEscolhaFraco: React.CSSProperties = {
  ...botaoEscolha,
  color: "#b9b3a5",
  background: "transparent",
  border: "3px solid rgba(255,203,5,.25)",
  fontSize: 15,
};

/** Quando e onde — a linha que confirma que a pessoa abriu o link certo. */
const Quando: React.FC<{ detalhes: { data: string; hora: string; local: string } | null }> = ({
  detalhes,
}) =>
  detalhes ? (
    <p
      style={{
        fontFamily: FONT_ELITE,
        fontSize: 12,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: "#8e877a",
        margin: "0 0 22px",
      }}
    >
      {[dataBonita(detalhes.data), detalhes.hora, detalhes.local].filter(Boolean).join(" · ")}
    </p>
  ) : null;

/** Honeypot: invisível pra gente, irresistível pra robô. */
const Armadilha: React.FC<{ honeypot: React.RefObject<HTMLInputElement | null> }> = ({ honeypot }) => (
  <input
    ref={honeypot}
    type="text"
    name="site"
    tabIndex={-1}
    autoComplete="off"
    aria-hidden="true"
    style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
  />
);

const Erro: React.FC<{ texto: string }> = ({ texto }) => (
  <p
    role="alert"
    style={{
      border: `3px solid ${C.erroBorda}`,
      background: "rgba(194,84,63,.12)",
      color: C.erro,
      padding: "12px 14px",
      margin: "0 0 18px",
      lineHeight: 1.6,
    }}
  >
    {texto}
  </p>
);

const textoP: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto 22px",
  fontSize: 15.5,
  lineHeight: 1.7,
};

function dataBonita(iso: string): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

const Casca: React.FC<{ titulo: string; children?: React.ReactNode }> = ({ titulo, children }) => (
  <div
    style={{
      minHeight: "100dvh",
      background: C.night,
      color: C.cream,
      fontFamily: FONT_BITTER,
      padding: "38px 20px 70px",
    }}
  >
    <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
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
          marginBottom: 18,
        }}
      >
        Missão Ceará
      </p>
      <h1
        style={{
          fontFamily: FONT_ALFA,
          fontSize: "clamp(26px, 6.5vw, 38px)",
          lineHeight: 1.2,
          margin: "0 0 16px",
          color: C.gold,
        }}
      >
        {titulo}
      </h1>
      {children}
    </div>
  </div>
);

const Voltar: React.FC = () => (
  <Link
    href="/"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      minHeight: 44,
      textDecoration: "none",
      border: "3px solid rgba(255,203,5,.4)",
      color: C.gold,
      padding: "12px 20px",
      fontFamily: FONT_ALFA,
      fontSize: 15,
    }}
  >
    <Icon name="arrowLeft" size={18} />
    Ir para o site
  </Link>
);

const Campo: React.FC<{
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  aoSair?: () => void;
  erro?: string;
  tipo?: string;
  modo?: "numeric" | "text";
  dica?: string;
  autoComplete?: string;
  required?: boolean;
  opcional?: boolean;
  autoFoco?: boolean;
}> = ({
  id, rotulo, valor, aoMudar, aoSair, erro = "", tipo = "text", modo, dica,
  autoComplete, required, opcional, autoFoco,
}) => (
  <div style={{ margin: "0 0 16px" }}>
    <label
      htmlFor={id}
      style={{
        display: "block",
        fontFamily: FONT_ELITE,
        fontSize: 12,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: C.gold,
        margin: "0 0 6px",
      }}
    >
      {rotulo}
      {/* Campo opcional tem que PARECER opcional: com quatro obrigatórios e
          dois opcionais na mesma tela, marcar só os de cima não basta. */}
      {opcional && (
        <span style={{ color: "#8e877a", letterSpacing: 1 }}> (opcional)</span>
      )}
    </label>
    <input
      id={id}
      type={tipo}
      inputMode={modo}
      value={valor}
      required={required}
      autoFocus={autoFoco}
      autoComplete={autoComplete}
      aria-invalid={erro !== ""}
      aria-describedby={erro !== "" ? `${id}-erro` : dica ? `${id}-dica` : undefined}
      onChange={(e) => aoMudar(e.target.value)}
      onBlur={aoSair}
      style={{
        width: "100%",
        /* 16px é o mínimo: abaixo disso o Safari do iPhone dá zoom ao focar */
        font: `16px/1.5 ${FONT_BITTER}`,
        minHeight: 50,
        padding: "12px 14px",
        color: C.cream,
        background: "rgba(0,0,0,.35)",
        border: `2px solid ${erro !== "" ? "#E4572E" : "rgba(255,203,5,.3)"}`,
        borderRadius: 0,
      }}
    />
    {erro !== "" ? (
      <p id={`${id}-erro`} role="alert" style={{ margin: "6px 0 0", fontSize: 13.5, color: "#F09A7E" }}>
        {erro}
      </p>
    ) : (
      dica && (
        <p id={`${id}-dica`} style={{ margin: "6px 0 0", fontSize: 13, color: "#8e877a" }}>
          {dica}
        </p>
      )
    )}
  </div>
);
