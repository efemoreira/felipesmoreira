import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, FONT_BITTER, HATCH, LARGURA, PONTOS, borda, sombra, sombraErguida, sombraAfundada } from "@/lib/theme";

/**
 * A ABERTURA DAS PÁGINAS INTERNAS — um formato para todas.
 *
 * Antes cada página tinha o seu: um "Voltar", um selo, um título, cada um com
 * tamanho e espaço próprios. Agora toda página pública abre igual — trilha
 * (Início › Núcleos), selo, título, uma frase e até duas ações — numa faixa de
 * tinta com a hachura do cordel, e o conteúdo vem depois em papel. Quem chega
 * por um link do WhatsApp sabe onde está e como voltar sem procurar.
 */
export interface Acao {
  texto: string;
  href: string;
  icone?: IconName;
  externo?: boolean;
}

export function AberturaPagina({
  trilha,
  kicker,
  titulo,
  intro,
  acoes = [],
  icone,
}: {
  /** o nome desta página na trilha ("Núcleos") */
  trilha: string;
  kicker: string;
  titulo: string;
  intro?: React.ReactNode;
  /** a primeira é a principal (ouro); a segunda, papel */
  acoes?: Acao[];
  /** um ícone grande à direita no computador */
  icone?: IconName;
}) {
  return (
    <section className="ab" aria-labelledby="ab-titulo">
      <div className="ab-faixa">
        <div className="ab-texto">
          <nav aria-label="Você está em" className="ab-trilha">
            <Link href="/" prefetch={false}>Início</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{trilha}</span>
          </nav>
          <p className="ab-selo">{kicker}</p>
          <h1 id="ab-titulo" className="ab-titulo">{titulo}</h1>
          {intro && <div className="ab-intro">{intro}</div>}
          {acoes.length > 0 && (
            <div className="ab-acoes">
              {acoes.slice(0, 2).map((a, i) => {
                const classe = `ab-botao ${i === 0 ? "ab-botao-ouro" : "ab-botao-papel"}`;
                const miolo = (
                  <>
                    <Icon name={a.icone ?? (i === 0 ? "flag" : "chevronRight")} size={18} />
                    {a.texto}
                  </>
                );
                return a.externo ? (
                  <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer" className={classe}>{miolo}</a>
                ) : (
                  <Link key={a.href} href={a.href} prefetch={false} className={classe}>{miolo}</Link>
                );
              })}
            </div>
          )}
        </div>
        {icone && (
          <div className="ab-emblema" aria-hidden="true">
            <Icon name={icone} size={96} />
          </div>
        )}
      </div>

      <style>{`
        .ab { background: ${HATCH.replace(/rgba\(24,18,3,/g, "rgba(255,203,5,")}, ${C.night}; color: ${C.cream}; border-bottom: ${borda(C.ink)}; font-family: ${FONT_BITTER}; }
        .ab-faixa { max-width: ${LARGURA.conteudo}px; margin: 0 auto; padding: 28px 16px 36px; display: grid; gap: 24px; align-items: center; }
        .ab-trilha { display: flex; align-items: center; gap: 8px; margin: 0 0 18px; font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.4px; text-transform: uppercase; }
        .ab-trilha a { color: ${C.gold}; text-decoration: none; display: inline-flex; align-items: center; min-height: 44px; }
        .ab-trilha a:hover { text-decoration: underline; }
        .ab-trilha [aria-current] { opacity: .8; }
        .ab-selo {
          display: inline-block; margin: 0 0 14px; padding: 4px 12px;
          font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 3px; text-transform: uppercase;
          color: ${C.ink}; background: ${C.gold}; box-shadow: ${sombra("rente", C.sombraNoite)};
        }
        .ab-titulo { font-family: ${FONT_ALFA}; font-size: clamp(32px, 8vw, 54px); line-height: 1.02; margin: 0 0 14px; text-wrap: balance; text-shadow: 3px 3px 0 ${C.ink}, 5px 5px 0 rgba(255,203,5,.35); }
        .ab-intro { max-width: ${LARGURA.texto}; font-size: 17px; line-height: 1.6; opacity: .95; }
        .ab-intro p { margin: 0; }
        .ab-acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
        .ab-botao {
          display: inline-flex; align-items: center; gap: 8px; min-height: 50px; padding: 0 18px; text-decoration: none;
          font-family: ${FONT_ALFA}; font-size: 16px; color: ${C.ink}; border: ${borda()};
          box-shadow: ${sombra("cartao", C.sombraNoite)}; transition: transform .12s ease, box-shadow .12s ease;
        }
        .ab-botao-ouro { background: ${C.gold}; }
        .ab-botao-papel { background: ${C.cream}; }
        .ab-botao:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("cartao", C.sombraNoite)}; }
        .ab-botao:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("cartao", C.sombraNoite)}; }
        .ab-emblema { display: none; }
        .ab a:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 3px; }
        @media (min-width: ${PONTOS.computador}px) {
          .ab-faixa { grid-template-columns: 1fr auto; padding: 36px 24px 48px; }
          .ab-emblema {
            display: grid; place-items: center; width: 200px; height: 200px; border-radius: 50%;
            background: ${C.gold}; color: ${C.ink};
            box-shadow: 0 0 0 5px ${C.ink}, 0 0 0 10px ${C.gold}, 0 0 0 14px ${C.ink}, ${sombra("alto", C.sombraNoite)};
          }
        }
        @media (prefers-reduced-motion: reduce) { .ab-botao { transition: none; } }
      `}</style>
    </section>
  );
}
