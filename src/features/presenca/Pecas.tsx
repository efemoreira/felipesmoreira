"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER, borda } from "@/lib/theme";

/**
 * AS PEÇAS de `/presenca` — a moldura, os avisos e os campos.
 *
 * Esta tela é lida EM PÉ, na fila da porta de um encontro, com o celular numa
 * mão só. Tudo aqui é desenho e nada é regra: quem decide o que acontece é o
 * `PresencaClient`, e é lá que se olha quando alguém não consegue dar presença.
 *
 * A peça mais importante é a `Modo`: os dois links (o QR da mesa e o "vou
 * nesse" que circula no grupo) levam à mesma rota e se parecem, e confundi-los
 * é o defeito que ela existe para evitar — quem abre o link do grupo em casa
 * acha que está "dando presença", e quem lê o QR na porta acha que só está
 * avisando que vem.
 */

/* ===================== peças ===================== */

export const botaoOuro: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  padding: "14px 20px",
  cursor: "pointer",
  fontFamily: FONT_ALFA,
  fontSize: 17,
  background: C.gold,
  color: C.ink,
  border: borda(),
  boxShadow: "5px 5px 0 rgba(24,18,3,.4)",
};

export const botaoEscolha: React.CSSProperties = {
  minHeight: 56,
  padding: "14px 18px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: FONT_BITTER,
  fontSize: 16.5,
  color: C.cream,
  background: "rgba(255,203,5,.08)",
  border: borda(C.gold),
};

export const botaoEscolhaFraco: React.CSSProperties = {
  ...botaoEscolha,
  color: "#b9b3a5",
  background: "transparent",
  border: borda("rgba(255,203,5,.25)"),
  fontSize: 15,
};

/**
 * A faixa que diz **o que esta tela faz** — a peça mais importante da página.
 *
 * Os dois links levam à mesma rota e se parecem, e a confusão entre eles não é
 * teórica: quem abre o link do grupo em casa acha que está "dando presença", e
 * quem lê o QR na porta acha que só está "avisando que vem". A diferença tem de
 * estar no topo, grande, antes de qualquer campo — e o verbo do botão no fim
 * repete a mesma coisa, para quem rolou direto.
 */
export const Modo: React.FC<{ confirmando: boolean }> = ({ confirmando }) => (
  <p
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      margin: "0 0 16px",
      padding: "9px 14px",
      background: confirmando ? "rgba(255,203,5,.12)" : C.gold,
      color: confirmando ? C.gold : C.ink,
      border: borda(confirmando ? C.gold : C.ink),
      fontFamily: FONT_ELITE,
      fontSize: 12,
      letterSpacing: 1.8,
      textTransform: "uppercase",
    }}
  >
    <Icon name={confirmando ? "calendar" : "flag"} size={16} />
    {confirmando ? "Confirmar que eu vou" : "Cheguei no encontro"}
  </p>
);

/**
 * Uma linha explicando o que a marca significa — e o que ela NÃO significa.
 *
 * UMA frase por modo, e não três. Esta tela é lida em pé, na fila da porta,
 * com o celular numa mão só: cada linha de texto antes do campo é uma linha que
 * a maioria pula. O que não pode sair é a distinção entre os dois links —
 * confundi-los é o defeito que a faixa de modo existe para evitar —, então o
 * que encurtou foi a explicação em volta dela, não ela.
 */
export const ModoExplica: React.FC<{ confirmando: boolean }> = ({ confirmando }) => (
  <p style={{ ...textoP, margin: "0 0 20px", fontSize: 14.5, opacity: 0.85 }}>
    {confirmando ? (
      <>
        Isto <strong>não</strong> é a lista de presença: é o aviso de que você
        pretende ir. No dia, quem estiver lá lê o QR na entrada.
      </>
    ) : (
      <>
        Esta é a <strong>lista de presença</strong>, e vale para quem está aqui
        agora. Só avisando que pretende vir? Use o link do grupo.
      </>
    )}
  </p>
);

/** Quando e onde — a linha que confirma que a pessoa abriu o link certo. */
export const Quando: React.FC<{ detalhes: { data: string; hora: string; local: string } | null }> = ({
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
export const Armadilha: React.FC<{ honeypot: React.RefObject<HTMLInputElement | null> }> = ({ honeypot }) => (
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

export const Erro: React.FC<{ texto: string }> = ({ texto }) => (
  <p
    role="alert"
    style={{
      border: borda(C.erroBorda),
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

export const textoP: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto 22px",
  fontSize: 15.5,
  lineHeight: 1.7,
};

export const Painel: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <section
    style={{
      maxWidth: 460,
      margin: "0 auto 22px",
      padding: "18px 18px 20px",
      textAlign: "left",
      background: "rgba(7,7,8,.42)",
      border: borda("rgba(255,203,5,.35)"),
      boxShadow: "7px 7px 0 rgba(24,18,3,.42)",
      backdropFilter: "blur(2px)",
    }}
  >
    {children}
  </section>
);

export const HeroDoEncontro: React.FC<{
  titulo: string;
  subtitulo?: string;
  data?: string;
  hora?: string;
  local?: string;
  imagem?: string;
  confirmando: boolean;
}> = ({ titulo, subtitulo, data, hora, local, imagem, confirmando }) => {
  const textura =
    "radial-gradient(circle at 18% 20%, rgba(255,203,5,.22), transparent 0 22%), " +
    "radial-gradient(circle at 82% 28%, rgba(255,203,5,.14), transparent 0 18%), " +
    "repeating-linear-gradient(135deg, rgba(255,203,5,.12) 0 8px, transparent 8px 16px), " +
    "linear-gradient(180deg, rgba(14,12,8,.94), rgba(14,12,8,.72))";
  const fundo = imagem
    ? `linear-gradient(180deg, rgba(14,12,8,.12), rgba(14,12,8,.78)), url(${imagem})`
    : textura;

  return (
    <section
      style={{
        maxWidth: 460,
        margin: "0 auto 20px",
        textAlign: "left",
        border: borda(C.gold),
        boxShadow: "8px 8px 0 rgba(24,18,3,.45)",
        overflow: "hidden",
        background: "rgba(10,9,7,.6)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "relative",
          minHeight: 196,
          padding: "16px 16px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage: fundo,
          backgroundSize: imagem ? "cover" : "auto, auto, auto, cover",
          backgroundPosition: "center",
          backgroundColor: "#0e0c08",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 38,
              padding: "6px 12px",
              background: confirmando ? "rgba(255,203,5,.16)" : C.gold,
              color: confirmando ? C.gold : C.ink,
              border: borda(confirmando ? C.gold : C.ink),
              fontFamily: FONT_ELITE,
              fontSize: 11,
              letterSpacing: 1.7,
              textTransform: "uppercase",
            }}
          >
            <Icon name={confirmando ? "calendar" : "flag"} size={15} />
            {confirmando ? "Aviso de que vou" : "Lista de presença"}
          </span>
        </div>

        <div>
          <h2
            style={{
              margin: "0 0 6px",
              fontFamily: FONT_ALFA,
              fontSize: "clamp(24px, 5vw, 32px)",
              lineHeight: 1.15,
              color: C.cream,
              textShadow: "3px 3px 0 rgba(24,18,3,.55)",
            }}
          >
            {titulo}
          </h2>
          {subtitulo ? (
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 14.5,
                lineHeight: 1.55,
                color: "rgba(246,245,239,.88)",
                maxWidth: 380,
              }}
            >
              {subtitulo}
            </p>
          ) : null}
          <p
            style={{
              margin: 0,
              fontFamily: FONT_ELITE,
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "rgba(246,245,239,.78)",
            }}
          >
            {[data, hora, local].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
};

export function dataBonita(iso: string): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

export const Casca: React.FC<{ titulo: string; children?: React.ReactNode }> = ({ titulo, children }) => (
  <div
    style={{
      minHeight: "100dvh",
      background:
        "radial-gradient(circle at top, rgba(255,203,5,.08), transparent 0 26%), " +
        "repeating-linear-gradient(135deg, rgba(255,203,5,.028) 0 8px, transparent 8px 16px), " +
        C.night,
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

export const Voltar: React.FC = () => (
  <Link
    href="/"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      minHeight: 44,
      textDecoration: "none",
      border: borda("rgba(255,203,5,.4)"),
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

/** A moldura é a mesma do <input> e do <select>: uma cópia só. */
export const molduraDoCampo = (erro: string): React.CSSProperties => ({
  width: "100%",
  /* 16px é o mínimo: abaixo disso o Safari do iPhone dá zoom ao focar */
  font: `16px/1.5 ${FONT_BITTER}`,
  minHeight: 50,
  padding: "12px 14px",
  color: C.cream,
  background: "rgba(0,0,0,.35)",
  border: `2px solid ${erro !== "" ? "#E4572E" : "rgba(255,203,5,.3)"}`,
  borderRadius: 0,
});

export const Campo: React.FC<{
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
  /* Com `lista`, o campo vira <select> — mesmo rótulo, mesma moldura, mesma
     mensagem de erro. Um segundo componente só para isso duplicaria o desenho
     inteiro, e as duas cópias divergiriam na primeira mudança de borda. */
  lista?: readonly string[];
  listaVazia?: string;
  listaExtra?: string;
  listaGrupo?: string;
}> = ({
  id, rotulo, valor, aoMudar, aoSair, erro = "", tipo = "text", modo, dica,
  autoComplete, required, opcional, autoFoco,
  lista, listaVazia = "Escolha", listaExtra, listaGrupo,
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
    {lista ? (
      <select
        id={id}
        value={valor}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={erro !== ""}
        aria-describedby={erro !== "" ? `${id}-erro` : dica ? `${id}-dica` : undefined}
        onChange={(e) => aoMudar(e.target.value)}
        onBlur={aoSair}
        style={molduraDoCampo(erro)}
      >
        <option value="">{listaVazia}</option>
        {listaExtra && <option value={listaExtra}>{listaExtra} — sou de fora</option>}
        <optgroup label={listaGrupo}>
          {lista.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </optgroup>
      </select>
    ) : (
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
        style={molduraDoCampo(erro)}
      />
    )}
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
