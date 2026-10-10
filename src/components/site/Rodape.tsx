import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, LARGURA, PONTOS, borda, bordaFina, sombra, sombraErguida } from "@/lib/theme";
import { RODAPE, REDES } from "./navegacao";

/**
 * O RODAPÉ — o mapa do site, o mesmo em toda página pública.
 *
 * É onde mora o que não cabe no menu do topo, em quatro colunas com nome
 * (Participe, Organização, Conteúdo, Sobre). No celular as colunas viram
 * duas, e continuam abertas: rodapé que precisa ser aberto para ser lido é
 * rodapé que ninguém lê.
 */
export function Rodape() {
  return (
    <footer className="rd">
      <div className="rd-faixa">
        <div className="rd-marca">
          <picture>
            <img src="/image/icone-192.png" alt="" width={48} height={48} loading="lazy" />
          </picture>
          <div>
            <p className="rd-nome">Missão Ceará</p>
            <p className="rd-lema">Militância organizada no Ceará</p>
          </div>
        </div>

        <nav aria-label="Mapa do site" className="rd-colunas">
          {RODAPE.map((col) => (
            <div key={col.titulo}>
              <p className="rd-titulo">{col.titulo}</p>
              <ul>
                {col.itens.map((i) => (
                  <li key={i.href + i.rotulo}>
                    <Link href={i.href} prefetch={false}>{i.rotulo}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="rd-base">
          <nav aria-label="Redes da coordenação" className="rd-redes">
            {REDES.map((r) => (
              <a key={r.rede} href={r.url} target="_blank" rel="noopener noreferrer me" aria-label={`${r.rede} — ${r.arroba}`} title={`${r.rede} (${r.arroba})`}>
                <Icon name={r.icone} size={18} />
              </a>
            ))}
          </nav>
          <p className="rd-assinatura">
            Site mantido por Felipe Moreira, coordenador de militância · © {new Date().getFullYear()}
          </p>
          <a href="/painel/" className="rd-militante">
            <Icon name="users" size={15} />
            Área do militante
          </a>
        </div>
      </div>

      <style>{`
        .rd { position: relative; z-index: 2; background: ${C.night}; color: ${C.cream}; border-top: ${borda(C.gold)}; }
        .rd-faixa { max-width: ${LARGURA.conteudo}px; margin: 0 auto; padding: 36px 16px 28px; display: flex; flex-direction: column; gap: 28px; }
        .rd-marca { display: flex; align-items: center; gap: 12px; }
        .rd-marca img { width: 48px; height: 48px; border-radius: 50%; box-shadow: 0 0 0 2px ${C.gold}; display: block; }
        .rd-nome { margin: 0; font-family: ${FONT_ALFA}; font-size: 20px; }
        .rd-lema { margin: 2px 0 0; font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 2px; text-transform: uppercase; color: ${C.gold}; }
        .rd-colunas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 16px; }
        .rd-titulo { margin: 0 0 8px; font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 2.2px; text-transform: uppercase; color: ${C.gold}; }
        .rd-colunas ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
        .rd-colunas a { display: inline-flex; align-items: center; min-height: 40px; color: ${C.cream}; text-decoration: none; font-size: 15px; }
        .rd-colunas a:hover { color: ${C.gold}; text-decoration: underline; }
        .rd-base { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding-top: 20px; border-top: ${bordaFina("rgba(255,203,5,.3)")}; }
        .rd-redes { display: flex; flex-wrap: wrap; gap: 10px; }
        .rd-redes a {
          width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%;
          background: ${C.gold}; color: ${C.ink}; border: ${borda()}; box-shadow: ${sombra("rente", C.sombraNoite)};
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .rd-redes a:hover { transform: translate(-1px,-1px); box-shadow: ${sombraErguida("rente", C.sombraNoite)}; }
        .rd-assinatura { margin: 0; font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.2px; opacity: .8; }
        .rd-militante {
          display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 12px;
          font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
          color: ${C.gold2}; text-decoration: none; border: ${bordaFina("rgba(255,203,5,.45)")};
        }
        .rd a:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 2px; }
        @media (min-width: ${PONTOS.computador}px) {
          .rd-faixa { padding: 48px 24px 32px; display: grid; grid-template-columns: 1fr 2.4fr; column-gap: 48px; }
          .rd-colunas { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .rd-base { grid-column: 1 / -1; flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        }
        @media (prefers-reduced-motion: reduce) { .rd-redes a { transition: none; } }
        @media print { .rd { display: none !important; } }
      `}</style>
    </footer>
  );
}
