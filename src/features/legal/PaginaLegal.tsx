import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_BITTER, FONT_ELITE, sombra } from "@/lib/theme";
import { WHATSAPP_COORDENACAO, TELEFONE_COORDENACAO } from "@/lib/contato";

export interface Secao {
  titulo: string;
  /** parágrafos e listas, na ordem em que aparecem */
  blocos: (string | string[])[];
}

const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

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
  <div className="lg-fundo">
    <main className="lg-main">
      <Link href="/" className="lg-voltar">
        <Icon name="arrowLeft" size={16} />
        <span>Voltar pro site</span>
      </Link>

      <header className="lg-cabecalho">
        <p className="lg-chip">Missão Ceará</p>
        <h1 className="lg-titulo">{titulo}</h1>
        <p className="lg-resumo">{resumo}</p>
        <p className="lg-data">Atualizada em {atualizadoEm}</p>
      </header>

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
    </main>

    <style>{css}</style>
  </div>
);

const css = `
  .lg-fundo {
    min-height: 100dvh;
    background: ${HATCH}, ${C.paper};
    color: ${C.ink};
    font-family: ${FONT_BITTER};
    color-scheme: light;
  }
  .lg-main { max-width: 720px; margin: 0 auto; padding: 22px 18px 64px; }

  .lg-voltar {
    display: inline-flex; align-items: center; gap: 8px; min-height: 44px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.cream}; text-decoration: none;
    padding: 10px 15px; border: ${BORDA}px solid ${C.ink};
    box-shadow: ${sombra("rente")}; margin-bottom: 22px;
  }

  .lg-cabecalho { margin-bottom: 30px; }
  .lg-chip {
    display: inline-block; font-family: ${FONT_ELITE};
    letter-spacing: 4px; font-size: 12px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold};
    padding: 4px 14px; box-shadow: ${sombra("rente")}; margin: 0 0 12px;
  }
  .lg-titulo {
    font-family: ${FONT_ALFA}; font-size: clamp(28px, 7vw, 42px);
    line-height: 1.08; margin: 0 0 12px; text-shadow: 3px 3px 0 ${C.gold};
  }
  .lg-resumo { font-size: 15.5px; line-height: 1.6; margin: 0 0 10px; }
  .lg-data {
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.5px;
    opacity: .75; margin: 0;
  }

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
