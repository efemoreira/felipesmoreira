"use client";
import React from "react";
import { Icon, type IconName } from "@/components/icons";
import { C, FONT_ALFA, TEXTO, borda, bordaFina } from "@/lib/theme";
import { linkDoPerfil, type PortaVoz } from "@/lib/api/organizacao";
import { NIVEIS_LIGA, temaPorChave } from "./catalogo";
import { Moldura, Secao, cartao, rotuloPequeno } from "./Moldura";
import { useOrganizacao } from "./useOrganizacao";

/**
 * /portavozes — a Liga dos Porta-vozes.
 *
 * Duas metades: como a Liga funciona (os cinco níveis, o que se exige, o
 * método) — fixa, do catálogo, indexável —, e quem está nela, do painel. Só
 * aparece quem autorizou (`publicado` na ficha), com nome público, tema,
 * lugar, nível e perfis. Seguidor e placar ficam no painel: a página
 * apresenta a pessoa, não a mede em público.
 */

const ICONE_REDE: Record<string, IconName> = { instagram: "instagram", tiktok: "tiktok", youtube: "youtube", x: "x" };
const NOME_REDE: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X" };

const METODO = [
  ["Um tema e um lugar", "Cada porta-voz é “a voz de” algo: segurança em Caucaia, educação no Cariri. Posicionamento claro cresce mais rápido."],
  ["Mesmo vídeo, três redes", "Três vídeos curtos por semana em Reels, TikTok e Shorts, com corte para o X. Uma ideia por vídeo."],
  ["Toda ação real vira conteúdo", "O que se aprende na formação vira explicação; a ação no bairro vira cobertura. Rua e rede se alimentam."],
  ["Comunidade, não só audiência", "Responder na primeira hora, levar quem segue para o canal e convidar para atividade presencial."],
  ["Proibido comprar", "Seguidor ou engajamento comprado elimina da Liga. O crescimento consistente é a auditoria."],
] as const;

function CartaoPortaVoz({ p }: { p: PortaVoz }) {
  const tema = temaPorChave(p.tema);
  const perfis = Object.entries(p.perfis).filter(([, a]) => a);
  return (
    <article style={cartao}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          aria-label={`Nível ${p.nivel}`}
          style={{
            flex: "0 0 auto",
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            background: p.nivel === "A" ? C.gold : C.cream,
            border: borda(),
            fontFamily: FONT_ALFA,
            fontSize: 22,
          }}
        >
          {p.nivel}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: FONT_ALFA, fontSize: 20, lineHeight: 1.15, margin: 0 }}>{p.nome}</h3>
          <p style={{ margin: "2px 0 0", ...TEXTO.nota, opacity: 0.85 }}>
            {[tema ? `A voz de ${tema.nome.toLowerCase()}` : "", [p.bairro, p.cidade].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>
      {perfis.length > 0 && (
        <nav aria-label={`Perfis de ${p.nome}`} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {perfis.map(([rede, arroba]) => (
            <a
              key={rede}
              href={linkDoPerfil(rede, arroba!)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${p.nome} no ${NOME_REDE[rede]}`}
              style={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                background: C.gold,
                border: borda(),
                color: C.ink,
              }}
            >
              <Icon name={ICONE_REDE[rede] ?? "world"} size={20} />
            </a>
          ))}
        </nav>
      )}
    </article>
  );
}

export default function PortaVozes() {
  const estado = useOrganizacao();
  const lista = estado.fase === "pronto" ? estado.dados.portavozes : [];
  const deCima = [...NIVEIS_LIGA].reverse();

  return (
    <Moldura
      trilha="Liga dos Porta-vozes"
      icone="broadcast"
      kicker="Liga dos Porta-vozes"
      titulo="Quem fala pela Missão no Ceará"
      intro={
        <p style={{ margin: 0 }}>
          Porta-voz da Missão atua nas redes e na rua ao mesmo tempo. Começa crescendo nas redes, que é o
          caminho mais rápido, mas só chega ao topo quem também estuda, conclui a formação de militância
          e lidera ações reais no seu bairro, cidade ou tema.
        </p>
      }
    >
      <Secao titulo="Na Liga" sub="Quem autorizou aparecer aqui, do nível mais alto para o mais novo.">
        {estado.fase === "carregando" && <p style={{ ...TEXTO.corpo, margin: 0 }}>Carregando a Liga…</p>}
        {estado.fase === "erro" && <p style={{ ...TEXTO.corpo, margin: 0 }}>Não consegui carregar a Liga agora. Tente de novo em instantes.</p>}
        {estado.fase === "pronto" && lista.length === 0 && (
          <p style={{ ...TEXTO.corpo, margin: 0 }}>
            A primeira turma da Liga está sendo formada agora. Se você quer ser a voz do seu tema na sua
            cidade, deixe seu contato.
          </p>
        )}
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))" }}>
          {deCima.flatMap((n) => lista.filter((p) => p.nivel === n.nivel)).map((p) => (
            <CartaoPortaVoz key={p.id} p={p} />
          ))}
        </div>
      </Secao>

      <Secao titulo="Os cinco níveis" sub="Sobe-se em ordem. Seguidor sem ação real não basta — e ação sem alcance também não.">
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {deCima.map((n) => (
            <li
              key={n.nivel}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                padding: "14px 16px",
                background: n.nivel === "A" ? C.gold : C.cream,
                border: bordaFina(C.ink),
              }}
            >
              <span aria-hidden="true" style={{ fontFamily: FONT_ALFA, fontSize: 30, lineHeight: 1, minWidth: 30 }}>
                {n.nivel}
              </span>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontFamily: FONT_ALFA, fontSize: 18, margin: "0 0 4px" }}>{n.nome}</h3>
                <p style={{ margin: 0, ...TEXTO.corpo }}>{n.exige}</p>
                {n.seguidores > 0 && (
                  <p style={{ ...rotuloPequeno, margin: "6px 0 0", opacity: 0.85 }}>
                    {n.seguidores.toLocaleString("pt-BR")}+ seguidores somados · engajamento {String(n.engajamento).replace(".", ",")}%+
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p style={{ ...TEXTO.nota, margin: "12px 0 0" }}>
          Seguidores somados de Instagram, TikTok, YouTube e X. Engajamento é interações ÷ seguidores,
          na média dos últimos 30 dias. Revisão a cada trimestre.
        </p>
      </Secao>

      <Secao titulo="O método">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))" }}>
          {METODO.map(([titulo, texto]) => (
            <div key={titulo} style={{ ...cartao, boxShadow: "none", border: bordaFina(C.ink) }}>
              <h3 style={{ fontFamily: FONT_ALFA, fontSize: 17, margin: 0 }}>{titulo}</h3>
              <p style={{ margin: 0, ...TEXTO.corpo }}>{texto}</p>
            </div>
          ))}
        </div>
        <p style={{ ...TEXTO.nota, margin: "12px 0 0" }}>
          Pedido explícito de voto fora da campanha é proibido, e impulsionamento pago só passa com a
          coordenação e o jurídico.
        </p>
      </Secao>
    </Moldura>
  );
}
