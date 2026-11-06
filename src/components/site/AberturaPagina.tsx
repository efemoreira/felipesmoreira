import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { C, FOCO, FONT_ALFA, LARGURA, PONTOS, TITULO } from "@/lib/theme";
import { Sol } from "./Sol";

/**
 * A ABERTURA DAS PÁGINAS INTERNAS — um formato para todas.
 *
 * Antes cada página tinha a sua: um "Voltar", um selo, um título, cada um com
 * tamanho e espaço próprios. Agora toda página pública abre igual — trilha
 * (Início › Núcleos), título, uma frase e até duas ações — e o conteúdo vem
 * logo depois, sem precisar rolar uma tela de faixa. Quem chega por um link do
 * WhatsApp sabe onde está e como voltar sem procurar.
 *
 * `kicker` só aparece quando acrescenta algo: repetir o nome que já está na
 * trilha era ruído.
 */
export interface Acao {
  texto: string;
  href: string;
  icone?: IconName;
  externo?: boolean;
}

const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function AberturaPagina({
  trilha,
  kicker,
  titulo,
  intro,
  acoes = [],
  icone,
  retrato,
}: {
  /** o nome desta página na trilha ("Núcleos") */
  trilha: string;
  kicker?: string;
  titulo: string;
  intro?: React.ReactNode;
  /** a primeira é a principal (ouro); a segunda, contornada */
  acoes?: Acao[];
  /** o ícone da seção, no sol à direita no computador */
  icone?: IconName;
  /** uma foto no lugar do ícone; esta aparece também no celular */
  retrato?: React.ReactNode;
}) {
  return (
    <section className="ab" aria-labelledby="ab-titulo">
      <div className="ab-faixa">
        <div className="ab-texto">
          <nav aria-label="Você está em" className="ab-trilha">
            <Link href="/" prefetch={false}>Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{trilha}</span>
          </nav>
          {kicker && !igual(kicker, trilha) && <p className="s-rotulo">{kicker}</p>}
          <h1 id="ab-titulo" className="ab-titulo">{titulo}</h1>
          {intro && <div className="ab-intro">{intro}</div>}
          {acoes.length > 0 && (
            <div className="s-acoes ab-acoes">
              {acoes.slice(0, 2).map((a, i) => {
                const classe = `s-btn ${i === 0 ? "s-btn-ouro" : "s-btn-linha"}`;
                return a.externo ? (
                  <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer" className={classe}>{a.texto}</a>
                ) : (
                  <Link key={a.href} href={a.href} prefetch={false} className={classe}>{a.texto}</Link>
                );
              })}
            </div>
          )}
        </div>
        {retrato ? (
          <div className="ab-retrato">
            <Sol tamanho="100%" miolo={0.68}>{retrato}</Sol>
          </div>
        ) : (
          icone && (
            <div className="ab-sol" aria-hidden="true">
              <Sol tamanho={220} miolo={0.56}>
                <Icon name={icone} size={56} />
              </Sol>
            </div>
          )
        )}
      </div>

      <style>{`
        .ab { background: ${C.paper}; color: ${C.ink}; }
        .ab-faixa { max-width: ${LARGURA.conteudo + 40}px; margin: 0 auto; padding: 18px 20px 12px; display: grid; gap: 32px; align-items: center; }
        .ab-trilha { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 15px; color: ${C.suave}; }
        .ab-trilha a { color: ${C.suave}; display: inline-flex; align-items: center; min-height: 44px; text-decoration: underline; text-decoration-color: ${C.linhaForte}; text-underline-offset: 3px; }
        .ab-trilha a:hover { color: ${C.ink}; text-decoration-color: ${C.gold}; }
        .ab-titulo { margin: 0; max-width: 20ch; font-family: ${FONT_ALFA}; font-weight: 400; font-size: ${TITULO.pagina}; line-height: 1.06; text-wrap: balance; }
        .ab-intro { margin-top: 16px; max-width: ${LARGURA.texto}; font-size: 19px; line-height: 1.55; color: ${C.suave}; text-wrap: pretty; }
        .ab-intro p { margin: 0; }
        .ab-acoes { margin-top: 24px; }
        .ab-sol { display: none; }
        .ab-retrato { width: 168px; order: -1; }
        .ab a:focus-visible { outline: ${FOCO}; outline-offset: 3px; }
        @media (min-width: ${PONTOS.computador}px) {
          .ab-faixa { grid-template-columns: minmax(0, 1fr) auto; padding: 28px 20px 16px; }
          .ab-sol { display: block; }
          .ab-retrato { width: 280px; order: 0; }
        }
      `}</style>
    </section>
  );
}
