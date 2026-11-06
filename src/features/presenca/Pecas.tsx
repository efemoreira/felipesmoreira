"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_TEXTO, RAIO, borda, sombra } from "@/lib/theme";
import { filtroDaImagem } from "./filtro";

/**
 * AS PEÇAS de `/presenca` — a moldura, os avisos e os campos.
 *
 * Esta tela é lida EM PÉ, na fila da porta de um encontro, com o celular numa
 * mão só. Tudo aqui é desenho e nada é regra: quem decide o que acontece é o
 * `PresencaClient`, e é lá que se olha quando alguém não consegue dar presença.
 *
 * A peça mais importante é a `Modo`: os dois links (o QR da mesa e o de
 * confirmação, que circula no grupo) levam à mesma rota e se parecem, e
 * confundi-los é o defeito que ela existe para evitar — quem abre o link do
 * grupo em casa acha que já deu presença, e quem lê o QR na porta acha que só
 * está avisando que vem. São duas palavras diferentes por isso: "confirmar
 * presença" é antes, "check-in" é na porta.
 */

/* ===================== peças ===================== */

export const botaoOuro: React.CSSProperties = {
  width: "100%",
  minHeight: 56,
  padding: "14px 20px",
  cursor: "pointer",
  fontFamily: FONT_TEXTO,
  fontSize: 18,
  fontWeight: 700,
  background: C.gold,
  color: C.ink,
  border: 0,
  borderRadius: RAIO.m,
};

export const botaoEscolha: React.CSSProperties = {
  minHeight: 56,
  padding: "14px 18px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: FONT_TEXTO,
  fontSize: 17,
  fontWeight: 600,
  color: C.ink,
  background: C.paper,
  border: borda(C.linhaForte),
  borderRadius: RAIO.m,
};

export const botaoEscolhaFraco: React.CSSProperties = {
  ...botaoEscolha,
  color: C.suave,
  border: borda(),
  fontSize: 16,
  fontWeight: 500,
};

/**
 * A faixa que diz **o que esta tela faz** — a peça mais importante da página.
 *
 * Os dois links levam à mesma rota e se parecem, e a confusão entre eles não é
 * teórica: quem abre o link do grupo em casa acha que já deu presença, e quem
 * lê o QR na porta acha que só está avisando que vem. A diferença tem de estar
 * no topo, grande, antes de qualquer campo — e o verbo do botão no fim repete a
 * mesma palavra, para quem rolou direto.
 *
 * As palavras são as que a pessoa já conhece de fora daqui: "confirmação
 * prévia" é o RSVP do convite, "check-in" é o que ela faz na porta do show e no
 * balcão do aeroporto. Rótulo que nomeia o resultado no vocabulário de quem lê
 * é o que faz alguém tocar sem parar para pensar.
 *
 * NO PAINEL a mesma coisa se chama RSVP, e é de propósito: lá quem lê organiza
 * evento e RSVP é a palavra do ofício, curta o bastante para virar coluna de
 * tabela. Aqui não — sigla em francês não é palavra de quem chega na porta do
 * encontro. Muda o rótulo, não muda o par.
 */
export const Modo: React.FC<{ confirmando: boolean }> = ({ confirmando }) => (
  <p
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      margin: "0 0 16px",
      padding: "8px 14px",
      background: confirmando ? C.ouroClaro : C.gold,
      color: C.ink,
      borderRadius: RAIO.pilula,
      fontSize: 16,
      fontWeight: 700,
    }}
  >
    <Icon name={confirmando ? "calendar" : "flag"} size={16} />
    {confirmando ? "Confirmação prévia" : "Check-in na entrada"}
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
  <p style={{ ...textoP, margin: "0 0 20px", fontSize: 16, color: C.suave }}>
    {confirmando ? (
      <>
        Aqui você avisa que <strong>pretende ir</strong> — é o que a gente usa para
        preparar o espaço. No dia, o <strong>check-in</strong> é no QR da entrada.
      </>
    ) : (
      <>
        Este é o <strong>check-in da entrada</strong>: ele registra que você está
        aqui, agora.
      </>
    )}
  </p>
);

/** Quando e onde — a linha que confirma que a pessoa abriu o link certo. */
export const Quando: React.FC<{ detalhes: { data: string; hora: string; local: string } | null }> = ({
  detalhes,
}) =>
  detalhes ? (
    <p style={{ fontSize: 16, fontWeight: 600, color: C.suave, margin: "0 0 22px" }}>
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

/**
 * A CAIXINHA DO "EU VOU" — só no link de confirmação, nunca no QR da porta.
 *
 * O botão já diz "Confirmar presença", mas botão é o que a pessoa aperta para
 * seguir: em pé, na pressa, apertar é reflexo. A caixinha é o ato de vontade, e
 * é dela que sai a lista que dimensiona a sala — uma lista inflada por quem só
 * queria ver a página é pior que uma lista curta. Na porta ela não existe: quem
 * leu o QR já está lá, e pedir para ele confirmar que vem é absurdo.
 */
export const CaixaEuVou: React.FC<{
  marcado: boolean;
  aoMudar: (v: boolean) => void;
  /** Um id por tela — duas caixinhas com o mesmo id quebrariam o `htmlFor`. */
  id?: string;
}> = ({ marcado, aoMudar, id = "p-euvou" }) => (
  <label
    htmlFor={id}
    style={{
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      minHeight: 44,
      cursor: "pointer",
      background: C.ouroClaro,
      borderRadius: RAIO.m,
      padding: "12px 14px",
      margin: "0 0 18px",
    }}
  >
    <input
      id={id}
      type="checkbox"
      checked={marcado}
      onChange={(e) => aoMudar(e.target.checked)}
      style={{ width: 24, height: 24, flex: "0 0 auto", marginTop: 1, accentColor: C.ink }}
    />
    <span style={{ fontSize: 16.5, lineHeight: 1.5 }}>
      <strong>Confirmo que vou a este encontro.</strong>
    </span>
  </label>
);

export const Erro: React.FC<{ texto: string }> = ({ texto }) => (
  <p
    role="alert"
    style={{
      background: C.erroFundo,
      color: C.erroTinta,
      fontSize: 16,
      fontWeight: 600,
      borderRadius: RAIO.m,
      padding: "12px 14px",
      margin: "0 0 18px",
      lineHeight: 1.5,
    }}
  >
    {texto}
  </p>
);

export const textoP: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto 22px",
  fontSize: 17,
  lineHeight: 1.55,
};

export const Painel: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <section
    style={{
      maxWidth: 460,
      margin: "0 auto 22px",
      padding: "18px 18px 20px",
      textAlign: "left",
      background: C.paper,
      border: borda(),
      borderRadius: RAIO.g,
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
  /** A chave do véu escolhida no painel (ver `filtro.ts`). */
  filtro?: string;
  confirmando: boolean;
}> = ({ titulo, subtitulo, data, hora, local, imagem, filtro, confirmando }) => {
  /* TRÊS CAMADAS, e não um `background` só, porque o desfoque é da IMAGEM: um
     `filter` no bloco borraria junto o nome do encontro, que é o que se está
     tentando deixar legível. Então a foto vai numa camada própria, o véu em
     outra, e o texto por cima das duas. */
  const veu = filtroDaImagem(filtro);
  /* Sem foto o bloco é de ouro, com tinta; com foto, o texto claro sobre o véu. */
  const tintaTexto = imagem ? C.paper : C.ink;

  return (
    <section
      style={{
        maxWidth: 460,
        margin: "0 auto 20px",
        textAlign: "left",
        borderRadius: RAIO.g,
        boxShadow: sombra("cartao"),
        overflow: "hidden",
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
          backgroundColor: imagem ? C.ink : C.gold,
        }}
      >
        {imagem ? (
          <>
            <span
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${imagem})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: veu.desfoque ? `blur(${veu.desfoque}px)` : undefined,
                /* o borrão apaga a borda da imagem; a escala tira a moldura clara */
                transform: veu.desfoque ? "scale(1.08)" : undefined,
              }}
            />
            {veu.veu ? <span style={{ position: "absolute", inset: 0, background: veu.veu }} /> : null}
          </>
        ) : null}

        <div style={{ position: "relative" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 36,
              padding: "6px 14px",
              background: imagem ? C.gold : C.paper,
              color: C.ink,
              borderRadius: RAIO.pilula,
              fontSize: 15.5,
              fontWeight: 700,
            }}
          >
            <Icon name={confirmando ? "calendar" : "flag"} size={15} />
            {confirmando ? "Confirmação prévia" : "Check-in"}
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <h2
            style={{
              margin: "0 0 6px",
              fontFamily: FONT_ALFA,
              fontWeight: 400,
              fontSize: "clamp(28px, 6vw, 34px)",
              lineHeight: 1.12,
              color: tintaTexto,
            }}
          >
            {titulo}
          </h2>
          {subtitulo ? (
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 16.5,
                lineHeight: 1.45,
                color: tintaTexto,
                maxWidth: 380,
              }}
            >
              {subtitulo}
            </p>
          ) : null}
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: tintaTexto,
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
      background: C.paper,
      color: C.ink,
      fontFamily: FONT_TEXTO,
      padding: "24px 20px 64px",
    }}
  >
    <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <p style={{ display: "inline-flex", alignItems: "center", gap: 10, margin: "0 0 18px", fontFamily: FONT_ALFA, fontSize: 19 }}>
        <picture>
          <img src="/image/icone-192.png" alt="" width={36} height={36} style={{ display: "block", borderRadius: "50%" }} />
        </picture>
        Missão Ceará
      </p>
      <h1
        style={{
          fontFamily: FONT_ALFA,
          fontWeight: 400,
          fontSize: "clamp(30px, 7vw, 40px)",
          lineHeight: 1.12,
          margin: "0 0 16px",
          color: C.ink,
          textWrap: "balance",
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
      justifyContent: "center",
      gap: 8,
      minHeight: 50,
      textDecoration: "none",
      border: borda(C.linhaForte),
      borderRadius: RAIO.m,
      color: C.ink,
      padding: "12px 20px",
      fontSize: 16.5,
      fontWeight: 700,
    }}
  >
    Ir para o site
  </Link>
);

/** A moldura é a mesma do <input> e do <select>: uma cópia só. */
export const molduraDoCampo = (erro: string): React.CSSProperties => ({
  width: "100%",
  /* 16px é o mínimo: abaixo disso o Safari do iPhone dá zoom ao focar */
  font: `17px/1.5 ${FONT_TEXTO}`,
  minHeight: 52,
  padding: "12px 14px",
  color: C.ink,
  background: C.paper,
  border: borda(erro !== "" ? C.erroBorda : C.linhaForte),
  borderRadius: RAIO.p + 2,
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
        fontSize: 16,
        fontWeight: 700,
        color: C.ink,
        margin: "0 0 6px",
      }}
    >
      {rotulo}
      {/* Campo opcional tem que PARECER opcional: com quatro obrigatórios e
          dois opcionais na mesma tela, marcar só os de cima não basta. */}
      {opcional && (
        <span style={{ color: C.suave, fontWeight: 400 }}> (opcional)</span>
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
      <p id={`${id}-erro`} role="alert" style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 600, color: C.erroTinta }}>
        {erro}
      </p>
    ) : (
      dica && (
        <p id={`${id}-dica`} style={{ margin: "6px 0 0", fontSize: 15, color: C.suave }}>
          {dica}
        </p>
      )
    )}
  </div>
);
