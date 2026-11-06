"use client";
import React from "react";
import { Icon } from "@/components/icons";
import { C, FOCO, borda } from "@/lib/theme";
import type { Grupo } from "@/lib/api/organizacao";
import { TEMAS, type Tema } from "./catalogo";
import { BotaoCartao, LinhaProxima, Moldura, Secao, SeloIcone } from "./Moldura";
import { useOrganizacao } from "./useOrganizacao";

/**
 * /temas — sobre o quê a militância atua. Um tema, um grupo.
 *
 * Os nove temas do catálogo saem no HTML do build, cada um com as três portas
 * (estudo, profissionais, movimento): é a parte que explica e que o buscador
 * lê. O grupo de cada tema — se já existe, para que, quando é a próxima — vem
 * do painel por cima.
 */

const PORTAS = [
  { chave: "estudo", nome: "Estudo", texto: "Entende o problema e produz conteúdo: diagnóstico, dados, proposta, pauta para os porta-vozes." },
  { chave: "profissionais", nome: "Profissionais", texto: "Quem trabalha na área. Dá credibilidade técnica, faz encontros com pauta definida e traz colegas." },
  { chave: "movimento", nome: "Movimento", texto: "A ação pública do tema: campanhas, eventos abertos, mutirões, junto com os núcleos." },
] as const;

function CartaoTema({ t, g }: { t: Tema; g?: Grupo }) {
  const portas = g?.portas ?? { estudo: t.estudo, profissionais: t.profissionais, movimento: t.movimento };
  return (
    <article id={t.chave} className="s-cartao" style={{ scrollMarginTop: 88 }}>
      <header className="o-cabeca">
        <SeloIcone nome={t.icone} />
        <h3 style={{ flex: 1, minWidth: 0 }}>{t.nome}</h3>
      </header>
      <p>
        {g ? (
          <span className="s-etiqueta s-etiqueta-ok">Grupo aberto · {g.ritmo.toLowerCase()}</span>
        ) : (
          <span className="s-etiqueta">Mapeando interessados</span>
        )}
      </p>
      <p className="o-info">{g?.finalidade || portas.estudo}</p>
      <details className="t-mais">
        <summary>
          Por onde entrar
          <span aria-hidden="true"><Icon name="chevronRight" size={18} /></span>
        </summary>
        <dl>
          {PORTAS.map((p) => (
            <div key={p.chave}>
              <dt>{p.nome}</dt>
              <dd>{portas[p.chave]}</dd>
            </div>
          ))}
        </dl>
      </details>
      {g?.proxima && <LinhaProxima data={g.proxima.data} texto={g.proxima.texto} atividade={g.proxima.atividade} />}
      {g && (g.nucleos.length > 0 || g.portaVoz) && (
        <p className="o-info">
          <strong>Junto com: </strong>
          {[g.portaVoz && `${g.portaVoz} (porta-voz)`, ...g.nucleos.map((n) => `núcleo ${n}`)].filter(Boolean).join(" · ")}
        </p>
      )}
      <BotaoCartao href={g ? `/queroajudar?unidade=${g.id}` : `/queroajudar?tema=${t.chave}`}>Tenho interesse neste tema</BotaoCartao>
    </article>
  );
}

export default function Temas() {
  const estado = useOrganizacao();
  const grupos = estado.fase === "pronto" ? estado.dados.temas : [];
  const porTema = new Map(grupos.map((g) => [g.tema, g]));
  /* Os que têm grupo vêm primeiro: é onde já dá para entrar hoje. */
  const ordenados = [...TEMAS].sort((a, b) => Number(porTema.has(b.chave)) - Number(porTema.has(a.chave)));

  return (
    <Moldura
      trilha="Grupos temáticos"
      icone="book"
      titulo="Um tema, um grupo"
      acoes={[{ texto: "Registrar meus interesses", href: "/queroajudar?frente=temas" }, { texto: "Conhecer o plano", href: "/plano" }]}
      intro={
        <p>
          Estamos reunindo interessados para construir grupos de segurança, educação, saúde, economia e outros temas. O plano prevê um grupo por assunto, com três
          portas. Médico entra no de Saúde pela porta dos profissionais; quem quer organizar uma
          corrida no bairro entra pela do movimento. Ninguém precisa de um grupo à parte para a
          própria categoria.
        </p>
      }
    >
      <Secao titulo="As três portas">
        <div className="s-grade s-grade-3">
          {PORTAS.map((p) => (
            <div key={p.chave} className="o-coluna">
              <h3>{p.nome}</h3>
              <p>{p.texto}</p>
            </div>
          ))}
        </div>
        <p className="o-nota" style={{ maxWidth: "62ch" }}>
          Exemplo: o grupo de Saúde e esporte estuda o acesso às UPAs de um bairro, reúne médicos,
          enfermeiros e educadores físicos e organiza uma corrida comunitária com orientação de saúde.
          Um grupo só, com um responsável.
        </p>
      </Secao>

      <Secao
        titulo="Os temas"
        sub={
          estado.fase === "erro"
            ? "Não consegui ver agora quais grupos já estão abertos. Os temas e as portas estão aqui."
            : "Declare seus interesses mesmo que o grupo ainda não exista. A coordenação usará os cadastros para planejar por onde começar."
        }
      >
        <div className="s-grade s-grade-3">
          {ordenados.map((t) => (
            <CartaoTema key={t.chave} t={t} g={porTema.get(t.chave)} />
          ))}
        </div>
      </Secao>
      <style>{`
        .t-mais { border-top: ${borda()}; }
        .t-mais summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 46px; font-size: 16px; font-weight: 700; cursor: pointer; list-style: none; }
        .t-mais summary::-webkit-details-marker { display: none; }
        .t-mais summary:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
        .t-mais summary span { display: grid; transition: transform .15s ease; }
        .t-mais[open] summary span { transform: rotate(90deg); }
        .t-mais dl { margin: 2px 0 6px; display: grid; gap: 8px; font-size: 16px; line-height: 1.45; }
        .t-mais dt { font-weight: 700; }
        .t-mais dd { margin: 0; color: ${C.suave}; }
        @media (prefers-reduced-motion: reduce) { .t-mais summary span { transition: none; } }
      `}</style>
    </Moldura>
  );
}
