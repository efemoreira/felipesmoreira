import React from "react";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { C, LARGURA, borda } from "@/lib/theme";
import { WHATSAPP_COORDENACAO, TELEFONE_COORDENACAO } from "@/lib/contato";

export interface Secao {
  titulo: string;
  /** parágrafos e listas, na ordem em que aparecem */
  blocos: (string | string[])[];
}


/**
 * Moldura das páginas legais (privacidade e termos): uma coluna de leitura, sem
 * caixa em volta de cada seção. Texto longo se lê melhor sem moldura.
 */
const PaginaLegal: React.FC<{
  titulo: string;
  resumo: string;
  atualizadoEm: string;
  secoes: Secao[];
}> = ({ titulo, resumo, atualizadoEm, secoes }) => (
  <PaginaDoSite
    fundo="livre"
    abertura={
      <AberturaPagina
        trilha={titulo}
        kicker={`Atualizada em ${atualizadoEm}`}
        titulo={titulo}
        intro={<p>{resumo}</p>}
      />
    }
  >
  <div className="lg-fundo">
    <div className="lg-main">
      {secoes.map((s, i) => (
        <section key={s.titulo} className="lg-secao">
          <h2 className="lg-secao-titulo">
            <span aria-hidden="true">{i + 1}.</span> {s.titulo}
          </h2>
          {s.blocos.map((b, j) =>
            Array.isArray(b) ? (
              <ul key={j}>
                {b.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            ) : (
              <p key={j}>{b}</p>
            ),
          )}
        </section>
      ))}

      <footer className="lg-rodape">
        <p>
          Dúvida sobre este texto? Fale com a gente no{" "}
          <a href={WHATSAPP_COORDENACAO} target="_blank" rel="noopener noreferrer">
            WhatsApp {TELEFONE_COORDENACAO}
          </a>
          .
        </p>
      </footer>
    </div>

    <style>{css}</style>
  </div>
  </PaginaDoSite>
);

const css = `
  .lg-fundo { background: ${C.paper}; color: ${C.ink}; }
  .lg-main { max-width: ${LARGURA.conteudo + 40}px; margin: 0 auto; padding: 24px 20px clamp(48px, 7vw, 80px); }
  .lg-secao { max-width: ${LARGURA.texto}; margin-bottom: 32px; }
  .lg-secao-titulo { margin: 0 0 8px; font-size: 21px; line-height: 1.3; font-weight: 800; letter-spacing: -.01em; }
  .lg-secao-titulo span { color: ${C.goldDim}; }
  .lg-secao p { font-size: 17px; line-height: 1.65; margin: 0 0 10px; color: ${C.suave}; }
  .lg-secao p:last-child, .lg-secao ul:last-child { margin-bottom: 0; }
  .lg-secao ul { margin: 0 0 10px; padding-left: 22px; list-style: disc; display: flex; flex-direction: column; gap: 6px; font-size: 17px; line-height: 1.6; color: ${C.suave}; }
  .lg-secao a, .lg-rodape a { color: ${C.ink}; font-weight: 600; }
  .lg-rodape { max-width: ${LARGURA.texto}; margin-top: 32px; padding-top: 16px; border-top: ${borda()}; font-size: 16px; line-height: 1.6; color: ${C.suave}; }
  .lg-rodape p { margin: 0; }
`;

export default PaginaLegal;
