import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { C, FOCO, borda } from "@/lib/theme";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { Convite } from "@/components/site/Convite";
import CATALOGO from "@/data/funcoes.json";
import type { CatalogoFuncoes, Funcao, GrupoFuncao } from "@/features/inscricao/tipos";

/**
 * As funções da militância (o catálogo em `data/funcoes.json`), em página pública.
 *
 * O texto é o mesmo `funcoes.json` que o formulário usa — **uma fonte só**. A
 * diferença é que aqui ele é indexável e dá pra mandar por link: "olha, tem uma
 * função que é a sua cara" com âncora direta.
 *
 * A pergunta de quem chega é "qual é a minha?". Por isso a ficha mostra o nome e
 * o que é, e guarda o tempo, a entrega, o passo a passo e o convite na gaveta; e
 * o índice leva direto ao grupo. Era uma página de 17 mil pixels no celular.
 *
 * Cada ficha leva para `/queroajudar?funcao=<id>`, que abre o formulário com
 * ela já marcada. Quem leu a descrição inteira e decidiu não deve ter que
 * procurar de novo numa lista de doze.
 */
const catalogo = CATALOGO as CatalogoFuncoes;

const ORDEM = Object.keys(catalogo.grupos) as GrupoFuncao[];
const GRUPOS = ORDEM.filter((g) => catalogo.funcoes.some((f) => f.grupo === g));

const Ficha: React.FC<{ f: Funcao }> = ({ f }) => (
  <article id={f.id} className="s-cartao fn-ficha">
    <header className="fn-cabeca">
      <span aria-hidden="true" className="s-selo">
        <Icon name={f.icone as IconName} size={22} />
      </span>
      <h3>{f.nome}</h3>
    </header>

    <p className="fn-resumo">{f.resumo}</p>

    <details className="fn-mais">
      <summary>
        Como é na prática
        <span className="fn-seta" aria-hidden="true"><Icon name="chevronRight" size={18} /></span>
      </summary>
      <h4>Quanto tempo pede</h4>
      <p>{f.ritmo}</p>
      <h4>O que você entrega</h4>
      <p>{f.entrega}</p>
      <h4>Passo a passo</h4>
      {/* O preflight do Tailwind (globals.css) zera o marcador de toda lista do
            site. Aqui o número é informação — é um passo a passo, e sem ele a
            ordem some. Onde o marcador não diz nada, deixe o padrão. */}
      <ol>
        {f.detalhe.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ol>
      <Link href={`/queroajudar?funcao=${f.id}`} prefetch={false} className="s-btn s-btn-ouro s-btn-peq s-btn-bloco">
        Conversar sobre esta função
      </Link>
    </details>
  </article>
);

export default function Funcoes() {
  return (
    <PaginaDoSite
      abertura={
        <AberturaPagina
          trilha="Funções"
          kicker={`${catalogo.funcoes.length} funções`}
          titulo="O que dá pra fazer na militância"
          icone="users"
          intro={
            <p>
              Estas são possibilidades de contribuição para construir o movimento. Você pode registrar
              seus interesses sem escolher uma função agora. As entregas e os ritmos são referências:
              a coordenação combina com você o que cabe na sua disponibilidade.
            </p>
          }
          acoes={[{ texto: "Quero participar", href: "/queroajudar" }]}
        />
      }
    >
      <nav aria-label="Grupos de funções" className="fn-indice">
        {GRUPOS.map((g) => (
          <a key={g} href={`#grupo-${g}`} className="s-etiqueta">
            {catalogo.grupos[g].nome}
          </a>
        ))}
      </nav>

      {GRUPOS.map((g) => {
        const info = catalogo.grupos[g];
        return (
          <section key={g} id={`grupo-${g}`} className="fn-grupo">
            <header className="s-cabeca">
              <h2 className="s-titulo">{info.nome}</h2>
              <p className="s-sub">{info.resumo}</p>
            </header>
            <div className="s-grade s-grade-3">
              {catalogo.funcoes.filter((f) => f.grupo === g).map((f) => (
                <Ficha key={f.id} f={f} />
              ))}
            </div>
          </section>
        );
      })}

      <Convite
        titulo="Ainda em dúvida?"
        texto="Escolha “Onde precisar”. A coordenação conversa com você e te encaixa: é conversa, não formulário."
        acao="Quero ajudar"
      />

      <style>{`
        .fn-indice { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: clamp(32px, 5vw, 48px); }
        .fn-indice a { min-height: 44px; padding: 8px 16px; font-size: 15.5px; text-decoration: none; transition: background-color .15s ease; }
        .fn-indice a:hover { background: ${C.gold}; }
        .fn-indice a:focus-visible, .fn-mais summary:focus-visible { outline: ${FOCO}; outline-offset: 2px; }
        .fn-grupo { margin-bottom: clamp(48px, 7vw, 72px); scroll-margin-top: 88px; }
        .fn-ficha { scroll-margin-top: 88px; }
        .fn-cabeca { display: flex; align-items: center; gap: 12px; }
        .fn-cabeca h3 { flex: 1; min-width: 0; }
        .fn-resumo { font-size: 16.5px; line-height: 1.5; color: ${C.ink}; }
        .fn-mais { margin-top: auto; border-top: ${borda()}; padding-top: 2px; }
        .fn-mais summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 46px; font-size: 16px; font-weight: 700; cursor: pointer; list-style: none; }
        .fn-mais summary::-webkit-details-marker { display: none; }
        .fn-seta { display: grid; transition: transform .15s ease; }
        .fn-mais[open] .fn-seta { transform: rotate(90deg); }
        .fn-mais h4 { margin: 10px 0 2px; font-size: 15.5px; font-weight: 800; }
        .fn-mais p, .fn-mais li { font-size: 16px; line-height: 1.5; color: ${C.suave}; }
        .fn-mais .s-btn { margin-bottom: 12px; }
        .fn-mais ol { margin: 0 0 14px; padding-left: 22px; list-style: decimal; display: flex; flex-direction: column; gap: 6px; }
        @media (prefers-reduced-motion: reduce) { .fn-seta, .fn-indice a { transition: none; } }
      `}</style>
    </PaginaDoSite>
  );
}
