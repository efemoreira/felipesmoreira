import React from "react";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { BORDA, C, FONT_ALFA, FONT_BITTER, sombra, HATCH } from "@/lib/theme";
import { WHATSAPP_COORDENACAO, TELEFONE_COORDENACAO } from "@/lib/contato";

export interface Secao {
  titulo: string;
  /** parágrafos e listas, na ordem em que aparecem */
  blocos: (string | string[])[];
}


/**
 * Moldura das páginas legais (privacidade e termos), no mesmo cordel do site.
 * Antes elas eram as duas únicas páginas em Tailwind branco — destoavam de tudo
 * e falavam de um aplicativo de WhatsApp que não existe.
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
  .lg-fundo {
    background: ${HATCH}, ${C.paper};
    color: ${C.ink};
    font-family: ${FONT_BITTER};
    color-scheme: light;
  }
  .lg-main { max-width: 720px; margin: 0 auto; padding: 32px 16px 64px; }

  .lg-secao {
    background: ${C.cream}; border: ${BORDA}px solid ${C.ink};
    box-shadow: ${sombra()};
    padding: 16px 17px; margin-bottom: 14px;
  }
  .lg-secao-titulo {
    font-family: ${FONT_ALFA}; font-size: 19px; line-height: 1.25; margin: 0 0 10px;
  }
  .lg-secao-titulo span { color: ${C.goldDim}; }
  .lg-secao p { font-size: 15px; line-height: 1.65; margin: 0 0 10px; }
  .lg-secao p:last-child, .lg-secao ul:last-child { margin-bottom: 0; }
  .lg-secao ul {
    margin: 0 0 10px; padding-left: 20px;
    display: flex; flex-direction: column; gap: 7px;
    font-size: 15px; line-height: 1.6;
  }
  .lg-secao a, .lg-rodape a { color: ${C.ink}; font-weight: 600; }

  .lg-rodape {
    margin-top: 26px; padding-top: 16px;
    border-top: ${BORDA}px solid ${C.ink};
    font-size: 14.5px; line-height: 1.6;
  }
  .lg-rodape p { margin: 0; }

  @media (max-width: 620px) {
    .lg-main { padding: 16px 14px 56px; }
  }
`;

export default PaginaLegal;
