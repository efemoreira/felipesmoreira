"use client";
import React, { useEffect, useState } from "react";
import { C, FONT_ELITE, borda, TEXTO } from "@/lib/theme";
import { obterConvite, responderConvite, type Alvo, type Convite } from "@/lib/api/escala";
import { Casca, Painel, botaoOuro, botaoEscolha, Erro, textoP } from "@/features/presenca/Pecas";

/**
 * A resposta de quem foi escalado para uma peça de um encontro.
 *
 * Existe para tirar quem coordena do meio. Antes, o convite ia pelo WhatsApp, a
 * resposta voltava pelo WhatsApp e alguém ainda tinha de abrir o painel e
 * marcar — três passos por pessoa, vezes nove peças. Aqui a resposta chega
 * sozinha, e a coordenação só olha o que ficou sem.
 *
 * **Duas escolhas e nada mais.** Não há formulário: quem abre este link já foi
 * chamado pelo nome, numa conversa, com os itens da peça escritos na mensagem.
 * O que falta é um toque — e "não posso" tem o mesmo peso visual que "topo",
 * porque a recusa rápida é o que deixa a peça ser recolocada a tempo.
 *
 * As peças visuais vêm do `/presenca`: é a mesma situação — link que chega pelo
 * WhatsApp, aberto de pé, no celular — e duas cascas divergiriam na primeira
 * mudança de tema.
 */

type Fase = "carregando" | "convite" | "respondido" | "sem-convite";

export default function ConviteClient() {
  const [fase, setFase] = useState<Fase>("carregando");
  const [convite, setConvite] = useState<Convite | null>(null);
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const lido: Alvo = {
      p: q.get("p") ?? "",
      e: q.get("e") ?? "",
      f: q.get("f") ?? "",
      t: q.get("t") ?? "",
    };
    if (!lido.p || !lido.e || !lido.f || !lido.t) {
      setFase("sem-convite");
      return;
    }
    setAlvo(lido);
    obterConvite(lido)
      .then((c) => {
        if (!c.existe) {
          setFase("sem-convite");
          return;
        }
        setConvite(c);
        /* Já respondeu antes? Mostra o que ela disse e deixa trocar: quem topou
           na terça e ficou doente na sexta precisa poder avisar. */
        setResposta(c.resposta ?? "");
        setFase(c.resposta ? "respondido" : "convite");
      })
      .catch(() => setFase("sem-convite"));
  }, []);

  async function responder(escolha: "topou" | "nao-posso") {
    if (!alvo || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const r = await responderConvite(alvo, escolha);
      if (!r.ok) {
        setErro(r.erro ?? "Não consegui gravar. Tente de novo.");
        setEnviando(false);
        return;
      }
      setResposta(escolha);
      setFase("respondido");
    } catch {
      setErro("Não consegui falar com o servidor. Tente de novo.");
    }
    setEnviando(false);
  }

  if (fase === "carregando") {
    return (
      <Casca titulo="Seu convite">
        <Painel>
          <p style={textoP}>Abrindo o convite…</p>
        </Painel>
      </Casca>
    );
  }

  if (fase === "sem-convite") {
    return (
      <Casca titulo="Convite não encontrado">
        <Painel>
          <p style={textoP}>
            Este convite não vale mais. Ou o encontro mudou, ou outra pessoa já
            assumiu essa parte.
          </p>
          <p style={{ ...textoP, marginBottom: 0 }}>
            Se você acha que é engano, responde a mensagem de quem te chamou — é
            mais rápido que qualquer coisa por aqui.
          </p>
        </Painel>
      </Casca>
    );
  }

  const c = convite!;

  return (
    <Casca titulo={fase === "respondido" ? "Resposta enviada" : "Seu convite"}>
      <Painel>
        <p style={{ ...textoP, fontFamily: FONT_ELITE, fontSize: 20, color: C.ink }}>
          {c.nome}, você é a <strong>{c.peca}</strong>
        </p>
        <p style={{ ...textoP, marginBottom: 4 }}>
          <strong>{c.titulo}</strong>
        </p>
        <p style={{ ...textoP, color: C.ink }}>
          {c.quando}
          {c.local ? ` · ${c.local}` : ""}
        </p>

        {(c.itens ?? []).length > 0 && (
          <>
            <p style={{ ...textoP, marginBottom: 6 }}>
              São {c.itens!.length} coisas:
            </p>
            <ul style={{ ...TEXTO.corpo, margin: "0 0 18px", paddingLeft: 20, color: C.ink }}>
              {c.itens!.map((item) => (
                <li key={item} style={{ marginBottom: 6 }}>
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        {fase === "respondido" ? (
          <div style={{ border: borda(C.ink), padding: 14, background: C.paper }}>
            <p style={{ ...textoP, margin: 0 }}>
              {resposta === "topou"
                ? "Você topou. A coordenação já sabe — te vejo lá."
                : "Avisado. A coordenação vai chamar outra pessoa para essa parte."}
            </p>
            <button
              type="button"
              style={{ ...botaoEscolha, marginTop: 12 }}
              onClick={() => responder(resposta === "topou" ? "nao-posso" : "topou")}
              disabled={enviando}
            >
              {resposta === "topou" ? "Na verdade, não vou poder" : "Mudei de ideia, eu topo"}
            </button>
          </div>
        ) : (
          <>
            {erro && <Erro texto={erro} />}
            <button type="button" style={botaoOuro} onClick={() => responder("topou")} disabled={enviando}>
              Topo, pode contar comigo
            </button>
            {/* Mesmo peso visual que o "topo": a recusa rápida é o que deixa a
                peça ser recolocada a tempo. Botão escondido produz silêncio, e
                silêncio é o que a coordenação não consegue distinguir de "sim". */}
            <button
              type="button"
              style={{ ...botaoEscolha, marginTop: 10 }}
              onClick={() => responder("nao-posso")}
              disabled={enviando}
            >
              Dessa vez não vou poder
            </button>
          </>
        )}
      </Painel>
    </Casca>
  );
}
