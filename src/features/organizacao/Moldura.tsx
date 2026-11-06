import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { C, PONTOS, RAIO, TEXTO } from "@/lib/theme";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina, type Acao } from "@/components/site/AberturaPagina";
import { Convite } from "@/components/site/Convite";

/**
 * A moldura das páginas da organização — /nucleos, /temas, /portavozes,
 * /cultura e /biblioteca.
 *
 * São a mesma conversa ("onde eu entro?") vista de lados diferentes: a moldura
 * do site (`PaginaDoSite`), a abertura padrão (`AberturaPagina`) e o mesmo
 * convite no fim.
 */

export function Moldura({
  trilha,
  kicker,
  titulo,
  children,
  intro,
  icone,
  acoes,
}: {
  trilha: string;
  kicker?: string;
  titulo: string;
  intro: React.ReactNode;
  icone?: IconName;
  acoes?: Acao[];
  children: React.ReactNode;
}) {
  return (
    <PaginaDoSite
      abertura={
        <AberturaPagina
          trilha={trilha}
          kicker={kicker}
          titulo={titulo}
          intro={intro}
          icone={icone}
          acoes={acoes ?? [{ texto: "Quero participar", href: "/queroajudar" }, { texto: "Ver a agenda", href: "/programacao", icone: "calendar" }]}
        />
      }
    >
      {children}
      <Convite />
      <style>{`
        .o-secao { margin-bottom: clamp(48px, 7vw, 72px); scroll-margin-top: 88px; }
        .o-lado { display: grid; gap: 20px; }
        .o-lado .s-cabeca { margin-bottom: 0; }
        .o-coluna { padding-top: 12px; border-top: 3px solid ${C.gold}; }
        .o-coluna h3 { margin: 0 0 6px; font-size: 19px; line-height: 1.3; font-weight: 800; }
        .o-coluna p { margin: 0; font-size: 16.5px; line-height: 1.55; color: ${C.suave}; }
        .o-sub { margin: 2px 0 0; font-size: 15.5px; line-height: 1.4; color: ${C.suave}; }
        .o-cabeca { display: flex; align-items: center; gap: 12px; }
        .o-info { margin: 0; font-size: 16px; line-height: 1.5; color: ${C.suave}; }
        .o-info strong { color: ${C.ink}; font-weight: 700; }
        .o-info a { color: ${C.ink}; font-weight: 700; }
        .o-rodape { margin-top: auto; padding-top: 4px; }
        .o-nota { margin: 14px 0 0; font-size: 15.5px; line-height: 1.5; color: ${C.suave}; }
        .o-cidade { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 16px; font-weight: 800; }
        .o-bloco-cidade { margin-bottom: 24px; }
        .o-bloco-cidade:last-child { margin-bottom: 0; }
        @media (min-width: ${PONTOS.computador}px) {
          .o-lado { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 48px; align-items: start; }
        }
      `}</style>
    </PaginaDoSite>
  );
}

/**
 * Uma seção da página. Com `lado`, o título fica numa coluna à esquerda e o
 * conteúdo à direita no computador: é o que encurta página de texto e dá a ela
 * um eixo só.
 */
export function Secao({ titulo, sub, children, id, lado }: { titulo: string; sub?: React.ReactNode; children: React.ReactNode; id?: string; lado?: boolean }) {
  return (
    <section id={id} className={`o-secao${lado ? " o-lado" : ""}`}>
      <header className="s-cabeca">
        <h2 className="s-titulo">{titulo}</h2>
        {sub && <p className="s-sub">{sub}</p>}
      </header>
      <div style={{ minWidth: 0 }}>{children}</div>
    </section>
  );
}

/** O selo de ícone, o mesmo das fichas de /funcoes. */
export function SeloIcone({ nome }: { nome: IconName }) {
  return (
    <span aria-hidden="true" className="s-selo">
      <Icon name={nome} size={22} />
    </span>
  );
}

/** A ação de um cartão: contornada, para o ouro continuar sendo só do que é principal. */
export function BotaoCartao({ href, children, externo }: { href: string; children: React.ReactNode; externo?: boolean }) {
  return externo ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-linha s-btn-peq o-rodape">
      {children}
    </a>
  ) : (
    <Link href={href} prefetch={false} className="s-btn s-btn-linha s-btn-peq o-rodape">
      {children}
    </Link>
  );
}

/** "setembro de 2026" a partir de "2026-09". */
export function mesPorExtenso(mes: string): string {
  const nomes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const [a, m] = mes.split("-").map(Number);
  return a && m ? `${nomes[m - 1]} de ${a}` : "";
}

/** A faixa de reconhecimento do mês: um título e nomes, sem número nenhum. */
export function Reconhecimento({ titulo, nomes }: { titulo: string; nomes: string[] }) {
  if (nomes.length === 0) return null;
  return (
    <section
      aria-label={titulo}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", marginBottom: 32, background: C.ouroClaro, borderRadius: RAIO.g }}
    >
      <span aria-hidden="true" style={{ flex: "0 0 auto", color: C.goldDim }}>
        <Icon name="star" size={24} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, ...TEXTO.nota, color: C.suave }}>{titulo}</p>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 800 }}>{nomes.join(" · ")}</p>
      </div>
    </section>
  );
}

/** "17/10" — a data curta da próxima atividade. */
export function dataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** A próxima atividade de uma unidade, numa linha só. */
export function LinhaProxima({ data, texto, atividade }: { data: string; texto?: string; atividade?: string }) {
  return (
    <p className="o-info">
      <strong>Próxima: {dataCurta(data)}</strong>
      {texto ? `, ${texto}` : ""}
      {atividade && (
        <>
          {" · "}
          <a href={`/programacao#a-${atividade}`}>ver na agenda</a>
        </>
      )}
    </p>
  );
}
