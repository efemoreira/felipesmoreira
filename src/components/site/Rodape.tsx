import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FOCO, FONT_ALFA, LARGURA, PONTOS, RAIO, borda } from "@/lib/theme";
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
            <img src="/image/icone-192.png" alt="" width={44} height={44} loading="lazy" />
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
                <Icon name={r.icone} size={20} />
              </a>
            ))}
          </nav>
          <p className="rd-assinatura">
            Site mantido por Felipe Moreira, coordenador de militância · © {new Date().getFullYear()}
          </p>
          <a href="/painel/" className="rd-militante">
            <Icon name="users" size={18} />
            Área do militante
          </a>
        </div>
      </div>

      <style>{`
        .rd { position: relative; background: ${C.fundo}; color: ${C.ink}; border-top: ${borda()}; }
        .rd-faixa { max-width: ${LARGURA.conteudo + 40}px; margin: 0 auto; padding: 40px 20px 28px; display: flex; flex-direction: column; gap: 32px; }
        .rd-marca { display: flex; align-items: center; gap: 12px; align-self: start; }
        .rd-marca img { width: 44px; height: 44px; border-radius: 50%; display: block; }
        .rd-nome { margin: 0; font-family: ${FONT_ALFA}; font-size: 20px; line-height: 1.2; }
        .rd-lema { margin: 2px 0 0; font-size: 15px; line-height: 1.35; color: ${C.suave}; }
        .rd-colunas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 16px; }
        .rd-titulo { margin: 0 0 6px; font-size: 15px; font-weight: 800; }
        .rd-colunas ul { list-style: none; margin: 0; padding: 0; }
        .rd-colunas a { display: inline-flex; align-items: center; min-height: 40px; color: ${C.suave}; text-decoration: none; font-size: 16px; }
        .rd-colunas a:hover { color: ${C.ink}; text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; text-underline-offset: 4px; }
        .rd-base { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; padding-top: 20px; border-top: ${borda()}; }
        .rd-redes { display: flex; flex-wrap: wrap; gap: 2px; margin-left: -12px; }
        .rd-redes a { width: 44px; height: 44px; display: grid; place-items: center; border-radius: ${RAIO.p + 2}px; color: ${C.ink}; }
        .rd-redes a:hover { background: ${C.gold}; }
        .rd-assinatura { margin: 0; font-size: 15px; line-height: 1.45; color: ${C.suave}; }
        .rd-militante { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; color: ${C.ink}; font-size: 15.5px; font-weight: 700; text-decoration: none; }
        .rd-militante:hover { text-decoration: underline; text-decoration-color: ${C.gold}; text-decoration-thickness: 2px; text-underline-offset: 4px; }
        .rd a:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
        @media (min-width: ${PONTOS.computador}px) {
          .rd-faixa { padding: 56px 20px 32px; display: grid; grid-template-columns: 1fr 2.6fr; column-gap: 48px; row-gap: 40px; }
          .rd-colunas { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .rd-base { grid-column: 1 / -1; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px; }
          .rd-assinatura { text-align: center; }
        }
        @media print { .rd { display: none !important; } }
      `}</style>
    </footer>
  );
}
