import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, LARGURA, RAIO, borda } from "@/lib/theme";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { Convite } from "@/components/site/Convite";
import { CHAMADA, CHAPA, capitulos, porQueSeguranca } from "./data";

export default function Missao() {
  return (
    <PaginaDoSite
      abertura={
        <AberturaPagina
          trilha="Quem coordena"
          kicker="Coordenador de militância"
          titulo="Felipe Moreira"
          intro={<p>{CHAMADA}</p>}
          acoes={[{ texto: "Quero participar", href: "/queroajudar" }, { texto: "O plano", href: "/plano", icone: "book" }]}
          retrato={
            <picture style={{ display: "block", width: "100%", height: "100%" }}>
              <source srcSet="/image/me-320.webp" type="image/webp" />
              <img src="/image/me-320.jpg" alt="Felipe Moreira" width={320} height={320} decoding="async" style={{ display: "block", objectFit: "cover", width: "100%", height: "100%" }} />
            </picture>
          }
        />
      }
    >
      <div className="ms-coluna">
        {/* ===== a trajetória ===== */}
        <section className="ms-secao" aria-labelledby="ms-trajetoria">
          <h2 id="ms-trajetoria" className="s-titulo">Como cheguei aqui</h2>
          <ol className="ms-linha">
            {capitulos.map((cap) => (
              <li key={cap.marco}>
                <span aria-hidden="true" className="ms-marca">
                  <Icon name={cap.icone} size={20} />
                </span>
                <div className="ms-capitulo">
                  <p className="s-rotulo">{cap.marco}</p>
                  <h3>{cap.titulo}</h3>
                  {cap.texto.map((p) => (
                    <p key={p.slice(0, 28)} className="ms-texto">{p}</p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== o que eu vi × o que o plano faz ===== */}
        <section className="ms-secao" aria-labelledby="ms-eixo">
          <h2 id="ms-eixo" className="s-titulo">Por que segurança é o meu eixo</h2>
          <p className="s-sub">
            Biografia sozinha não governa. Cada coisa que eu vi tem uma linha correspondente no
            plano de governo da chapa, com meta, prazo e de onde vem o dinheiro. É por elas que
            dá pra cobrar.
          </p>
          <ul className="s-linhas ms-eixo">
            {porQueSeguranca.map((item) => (
              <li key={item.oQueVi}>
                <h3>{item.oQueVi}</h3>
                <p className="s-corpo">{item.oQuePlanoFaz}</p>
                <Link href={`/propostas#${item.ancora}`} prefetch={false} className="s-link">
                  Ver no plano
                  <Icon name="chevronRight" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== a chapa ===== */}
        <section className="ms-chapa" aria-labelledby="ms-chapa">
          <h2 id="ms-chapa">A chapa</h2>
          <p>
            <strong>{CHAPA.governador}</strong> é o candidato a governador. Eu sou o vice. O plano
            de governo é o <strong>{CHAPA.plano}</strong>, e vale para os dois: não existe projeto
            do titular e projeto do vice.
          </p>
          <p>
            Uma coisa que confunde muita gente e é bom deixar clara:{" "}
            <strong>vice não tem número de urna próprio</strong>. Quem vota no candidato a
            governador está votando na chapa inteira: nele e em mim, juntos.
          </p>
          <Link href="/propostas" prefetch={false} className="s-btn s-btn-linha s-btn-peq">
            Ler o plano de governo
          </Link>
        </section>
      </div>

      <Convite
        titulo="Isso não se faz sozinho"
        texto="Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos. A coordenação conversa com você e te encaixa."
        acao="Quero ajudar"
        agenda={false}
      />

      <style>{`
        .ms-coluna { max-width: 760px; }
        .ms-secao { margin-bottom: clamp(48px, 7vw, 72px); }
        .ms-linha { list-style: none; margin: 28px 0 0; padding: 0; }
        .ms-linha li { position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 16px; padding-bottom: 32px; }
        .ms-linha li:last-child { padding-bottom: 0; }
        .ms-linha li:not(:last-child)::before { content: ""; position: absolute; left: 21px; top: 48px; bottom: 4px; width: 2px; background: ${C.linha}; }
        .ms-marca { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: ${C.gold}; color: ${C.ink}; }
        .ms-capitulo .s-rotulo { margin: 0 0 2px; }
        .ms-capitulo h3 { margin: 0 0 8px; font-size: 22px; line-height: 1.25; font-weight: 800; letter-spacing: -.01em; text-wrap: balance; }
        .ms-texto { margin: 0 0 10px; font-size: 17px; line-height: 1.65; color: ${C.suave}; max-width: ${LARGURA.texto}; }
        .ms-texto:last-child { margin-bottom: 0; }
        .ms-eixo { margin-top: 24px; }
        .ms-eixo h3 { margin: 0 0 4px; font-size: 19px; line-height: 1.3; font-weight: 800; }
        .ms-eixo .s-link { margin-top: 4px; font-size: 16px; }
        .ms-chapa { margin-bottom: clamp(32px, 5vw, 48px); padding: clamp(22px, 4vw, 32px); background: ${C.fundo}; border: ${borda()}; border-radius: ${RAIO.g}px; }
        .ms-chapa h2 { margin: 0 0 10px; font-size: 22px; line-height: 1.25; font-weight: 800; }
        .ms-chapa p { margin: 0 0 12px; font-size: 17px; line-height: 1.6; color: ${C.suave}; }
        .ms-chapa strong { color: ${C.ink}; }
        .ms-chapa .s-btn { margin-top: 4px; }
      `}</style>
    </PaginaDoSite>
  );
}
