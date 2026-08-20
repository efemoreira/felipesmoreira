"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { obterEncontro, enviarPresenca } from "@/lib/api/presenca";
import type { Encontro } from "./tipos";

/**
 * Cadastro na porta do encontro — o QR da mesa da Recepção abre esta página.
 *
 * Feita para ser preenchida em pé, com uma mão, em vinte segundos: quatro
 * campos, três deles curtos, e o quarto opcional. Fila na entrada é lead
 * perdido, e formulário longo é fila.
 *
 * O token do encontro vem na URL. Ele é conferido ANTES de o formulário
 * aparecer: link velho não pede dado de ninguém.
 */

type Fase = "carregando" | "sem-encontro" | "formulario" | "enviando" | "pronto";

export default function PresencaClient() {
  const [fase, setFase] = useState<Fase>("carregando");
  const [encontro, setEncontro] = useState<Encontro | null>(null);
  const [token, setToken] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [jaEstava, setJaEstava] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bairro, setBairro] = useState("");
  const [convidadoPor, setConvidadoPor] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("e") ?? "";
    setToken(t);

    if (t === "") {
      setFase("sem-encontro");
      return;
    }

    let ativo = true;
    obterEncontro(t)
      .then((e) => {
        if (!ativo) return;
        setEncontro(e);
        setFase(e.existe ? "formulario" : "sem-encontro");
      })
      .catch(() => {
        if (ativo) setFase("sem-encontro");
      });

    return () => {
      ativo = false;
    };
  }, []);

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErro(null);

    if (nome.trim().length < 3) {
      setErro("Escreva seu nome.");
      return;
    }
    if (telefone.replace(/\D/g, "").length < 10) {
      setErro("Confira o WhatsApp: use DDD + número.");
      return;
    }
    if (!consentimento) {
      setErro("Falta marcar a caixinha de concordar com o uso dos seus dados.");
      return;
    }

    setFase("enviando");
    try {
      const r = await enviarPresenca({
        evento: token,
        nome: nome.trim().replace(/\s+/g, " "),
        telefone: telefone.replace(/\D/g, ""),
        bairro: bairro.trim(),
        convidadoPor: convidadoPor.trim(),
        consentimento: true,
        site: honeypot.current?.value ?? "",
      });

      if (!r.ok) {
        setErro(r.erro);
        setFase("formulario");
        return;
      }
      setJaEstava(Boolean(r.jaEstava));
      setFase("pronto");
    } catch {
      setErro("Não deu para enviar agora. Chame alguém da recepção.");
      setFase("formulario");
    }
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
    return (
      <Casca titulo={jaEstava ? "Você já estava na lista" : "Pronto!"}>
        <p style={textoP}>
          {jaEstava
            ? "Seu nome já tinha entrado. Pode guardar o celular e aproveitar o encontro."
            : "Você está na lista. Obrigado por estar com a gente — a coordenação vai te chamar para os próximos passos."}
        </p>
        <Voltar />
      </Casca>
    );
  }

  const detalhes = encontro?.existe ? encontro : null;

  return (
    <Casca titulo={detalhes?.titulo ?? "Presença"}>
      {detalhes && (
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
      )}

      <form onSubmit={enviar} style={{ textAlign: "left" }}>
        <Campo id="p-nome" rotulo="Seu nome" valor={nome} aoMudar={setNome} autoFoco required />
        <Campo
          id="p-tel"
          rotulo="WhatsApp"
          valor={telefone}
          aoMudar={setTelefone}
          tipo="tel"
          modo="numeric"
          dica="Com DDD"
          required
        />
        <Campo id="p-bairro" rotulo="Seu bairro" valor={bairro} aoMudar={setBairro} />
        <Campo
          id="p-conv"
          rotulo="Quem te convidou"
          valor={convidadoPor}
          aoMudar={setConvidadoPor}
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
            Guardamos seu nome, WhatsApp e bairro só para falar com você sobre o
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

        {/* honeypot: invisível pra gente, irresistível pra robô */}
        <input
          ref={honeypot}
          type="text"
          name="site"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
        />

        {erro && (
          <p
            style={{
              border: `3px solid ${C.erroBorda}`,
              background: "rgba(194,84,63,.12)",
              color: C.erro,
              padding: "12px 14px",
              margin: "0 0 18px",
              lineHeight: 1.6,
            }}
          >
            {erro}
          </p>
        )}

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
          {fase === "enviando" ? "Enviando…" : "Estou aqui"}
        </button>
      </form>
    </Casca>
  );
}

/* ===================== peças ===================== */

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
  tipo?: string;
  modo?: "numeric" | "text";
  dica?: string;
  required?: boolean;
  autoFoco?: boolean;
}> = ({ id, rotulo, valor, aoMudar, tipo = "text", modo, dica, required, autoFoco }) => (
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
    </label>
    <input
      id={id}
      type={tipo}
      inputMode={modo}
      value={valor}
      required={required}
      autoFocus={autoFoco}
      onChange={(e) => aoMudar(e.target.value)}
      style={{
        width: "100%",
        /* 16px é o mínimo: abaixo disso o Safari do iPhone dá zoom ao focar */
        font: `16px/1.5 ${FONT_BITTER}`,
        minHeight: 50,
        padding: "12px 14px",
        color: C.cream,
        background: "rgba(0,0,0,.35)",
        border: "2px solid rgba(255,203,5,.3)",
        borderRadius: 0,
      }}
    />
    {dica && <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8e877a" }}>{dica}</p>}
  </div>
);
