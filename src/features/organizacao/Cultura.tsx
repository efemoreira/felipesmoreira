"use client";
import React from "react";
import { C, FONT_ALFA, TEXTO, bordaFina } from "@/lib/theme";
import type { GrupoCultural } from "@/lib/api/organizacao";
import { EIXOS_CULTURAIS, NIVEIS_CULTURA } from "./catalogo";
import { BotaoEscuro, Moldura, Secao, SeloIcone, cartao, dataCurta, rotuloPequeno } from "./Moldura";
import { useOrganizacao } from "./useOrganizacao";

/**
 * /cultura — a frente de Cultura do plano 2026–2027.
 *
 * "Cultura não é só livro, palestra e debate. É como as pessoas criam, se
 * expressam, convivem e se divertem." Os grupos culturais vêm do painel
 * (Organização › Cultura), só os publicados, sem nome de quem responde. O
 * botão leva a `/queroajudar?unidade=<id>`: a escolha chega na fila e, na
 * aprovação, a pessoa já entra no grupo.
 */

function CartaoCultural({ c }: { c: GrupoCultural }) {
  return (
    <article style={cartao}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SeloIcone nome="star" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: FONT_ALFA, fontSize: 20, lineHeight: 1.15, margin: 0 }}>{c.nome}</h3>
          <p style={{ margin: "2px 0 0", ...TEXTO.nota, opacity: 0.8 }}>
            {[EIXOS_CULTURAIS[c.eixo], NIVEIS_CULTURA[c.nivel], c.cidade].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>
      <dl style={{ margin: 0, display: "grid", gap: 8 }}>
        <div>
          <dt style={rotuloPequeno}>Ritmo</dt>
          <dd style={{ margin: 0, ...TEXTO.corpo }}>{c.ritmo}</dd>
        </div>
        {c.proxima && (
          <div>
            <dt style={rotuloPequeno}>Próxima atividade</dt>
            <dd style={{ margin: 0, ...TEXTO.corpo }}>
              <strong>{dataCurta(c.proxima.data)}</strong>
              {c.proxima.texto ? ` — ${c.proxima.texto}` : ""}
            </dd>
          </div>
        )}
      </dl>
      <BotaoEscuro href={`/queroajudar?unidade=${c.id}`}>Registrar interesse nesta iniciativa</BotaoEscuro>
    </article>
  );
}

export default function Cultura() {
  const estado = useOrganizacao();
  const grupos = estado.fase === "pronto" ? estado.dados.cultura : [];

  return (
    <Moldura
      trilha="Cultura"
      kicker="Cultura"
      titulo="Cultura tem valor próprio"
      acoes={[{ texto: "Ajudar a construir a frente cultural", href: "/queroajudar?frente=cultura" }, { texto: "Conhecer o plano", href: "/plano" }]}
      icone="star"
      intro={
        <p style={{ margin: 0 }}>
          Cultura não é só livro, palestra e debate. É como as pessoas criam, se expressam, convivem e se
          divertem — música, cinema, cordel, jogos, dança, esporte. Nem toda atividade precisa virar aula ou
          ação partidária.
        </p>
      }
    >
      <Secao titulo="Iniciativas culturais em construção" sub="Declare seus interesses no cadastro para ajudar a planejar as primeiras atividades.">
        {estado.fase === "carregando" && <p style={{ ...TEXTO.corpo, margin: 0 }}>Carregando…</p>}
        {estado.fase === "erro" && <p style={{ ...TEXTO.corpo, margin: 0 }}>Não consegui carregar agora. Tente de novo em instantes.</p>}
        {estado.fase === "pronto" && grupos.length === 0 && (
          <p style={{ ...TEXTO.corpo, margin: 0 }}>
            Os primeiros grupos estão nascendo. Tem uma ideia — uma noite de jogos, um sarau, um cineclube? Deixe seu contato.
          </p>
        )}
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
          {grupos.map((c) => <CartaoCultural key={c.id} c={c} />)}
        </div>
      </Secao>

      <Secao titulo="Da ideia ao grupo permanente">
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {Object.entries(NIVEIS_CULTURA).map(([n, nome]) => (
            <li key={n} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", background: C.cream, border: bordaFina(C.ink) }}>
              <span aria-hidden="true" style={{ fontFamily: FONT_ALFA, fontSize: 26, minWidth: 26, color: C.goldDim }}>{n}</span>
              <span style={{ fontFamily: FONT_ALFA, fontSize: 17 }}>{nome}</span>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao titulo="Os eixos" sub="Os catorze não precisam virar catorze grupos — cada grupo escolhe o seu.">
        <p style={{ margin: 0, ...TEXTO.corpo }}>{Object.values(EIXOS_CULTURAIS).join(" · ")}</p>
      </Secao>
    </Moldura>
  );
}
