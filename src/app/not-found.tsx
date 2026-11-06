import React from "react";
import Link from "next/link";
import { C, FONT_ALFA } from "@/lib/theme";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { Sertao } from "@/components/site/Sertao";

/* versos de cordel para a página perdida */
const versos = [
  "Andou pelo mundo afora,",
  "por vereda que não há;",
  "a página que procura",
  "se perdeu no meu Ceará.",
];

/**
 * A página perdida fica dentro da moldura do site: quem caiu aqui por um link
 * velho precisa do menu para seguir viagem, e não só de um "volte ao início".
 */
const NotFound: React.FC = () => {
  return (
    <PaginaDoSite fundo="livre">
      <div style={{ overflow: "hidden" }}>
        <div className="s-largura" style={{ paddingBlock: "clamp(40px, 8vw, 80px) 12px", textAlign: "center" }}>
          <p className="s-rotulo">Página não encontrada</p>
          <h1 style={{ margin: 0, fontFamily: FONT_ALFA, fontWeight: 400, fontSize: "clamp(84px, 20vw, 148px)", lineHeight: 1, color: C.ink }}>404</h1>
          <div style={{ margin: "18px 0 28px" }}>
            {versos.map((v) => (
              <p key={v} style={{ margin: 0, fontSize: "clamp(18px, 2.4vw, 21px)", lineHeight: 1.5, fontStyle: "italic", color: C.suave }}>
                {v}
              </p>
            ))}
          </div>
          <div className="s-acoes" style={{ justifyContent: "center" }}>
            <Link href="/" className="s-btn s-btn-ouro">
              Voltar pro começo
            </Link>
            <Link href="/programacao" prefetch={false} className="s-btn s-btn-linha">
              Ver a agenda
            </Link>
          </div>
        </div>
        <Sertao />
      </div>
    </PaginaDoSite>
  );
};

export default NotFound;
