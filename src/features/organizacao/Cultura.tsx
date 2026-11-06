"use client";
import React from "react";
import type { GrupoCultural } from "@/lib/api/organizacao";
import { Escada } from "@/components/site/Escada";
import { EIXOS_CULTURAIS, NIVEIS_CULTURA } from "./catalogo";
import { BotaoCartao, LinhaProxima, Moldura, Secao, SeloIcone } from "./Moldura";
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
    <article className="s-cartao">
      <header className="o-cabeca">
        <SeloIcone nome="star" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{c.nome}</h3>
          <p className="o-sub">{[EIXOS_CULTURAIS[c.eixo], c.cidade].filter(Boolean).join(", ")}</p>
        </div>
      </header>
      <p className="o-info">{[NIVEIS_CULTURA[c.nivel], c.ritmo.toLowerCase()].filter(Boolean).join(" · ")}</p>
      {c.proxima && <LinhaProxima data={c.proxima.data} texto={c.proxima.texto} />}
      <BotaoCartao href={`/queroajudar?unidade=${c.id}`}>Tenho interesse</BotaoCartao>
    </article>
  );
}

export default function Cultura() {
  const estado = useOrganizacao();
  const grupos = estado.fase === "pronto" ? estado.dados.cultura : [];

  return (
    <Moldura
      trilha="Cultura"
      titulo="Cultura tem valor próprio"
      acoes={[{ texto: "Ajudar a construir a frente cultural", href: "/queroajudar?frente=cultura" }, { texto: "Conhecer o plano", href: "/plano" }]}
      icone="star"
      intro={
        <p>
          Cultura não é só livro, palestra e debate. É como as pessoas criam, se expressam, convivem e se
          divertem: música, cinema, cordel, jogos, dança, esporte. Nem toda atividade precisa virar aula ou
          ação partidária.
        </p>
      }
    >
      <Secao titulo="Iniciativas em construção" sub="Declare seus interesses no cadastro para ajudar a planejar as primeiras atividades.">
        {estado.fase === "carregando" && <p className="s-corpo">Carregando…</p>}
        {estado.fase === "erro" && <p className="s-corpo">Não consegui carregar agora. Tente de novo em instantes.</p>}
        {estado.fase === "pronto" && grupos.length === 0 && (
          <p className="s-corpo">
            Os primeiros grupos estão nascendo. Tem uma ideia, como uma noite de jogos, um sarau ou um cineclube? Deixe seu contato.
          </p>
        )}
        {grupos.length > 0 && <div className="s-grade s-grade-3">{grupos.map((c) => <CartaoCultural key={c.id} c={c} />)}</div>}
      </Secao>

      <Secao titulo="Da ideia ao grupo permanente">
        <Escada passos={Object.values(NIVEIS_CULTURA).map((nome) => ({ nome }))} />
      </Secao>

      <Secao titulo="Os eixos" sub="Os catorze não precisam virar catorze grupos: cada grupo escolhe o seu.">
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.values(EIXOS_CULTURAIS).map((e) => (
            <li key={e} className="s-etiqueta" style={{ fontSize: 15, minHeight: 34, padding: "4px 14px" }}>{e}</li>
          ))}
        </ul>
      </Secao>
    </Moldura>
  );
}
