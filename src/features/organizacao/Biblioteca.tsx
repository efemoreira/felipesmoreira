"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, RAIO, TITULO, FONT_ALFA } from "@/lib/theme";
import { sinal } from "@/lib/api/sinal";
import type { Material } from "@/lib/api/organizacao";
import { temaPorChave } from "./catalogo";
import { Moldura, Secao } from "./Moldura";
import { useOrganizacao } from "./useOrganizacao";

/**
 * /biblioteca — "Livro Amarelo, cadernos, diagnósticos e gravações".
 *
 * A lista vem do painel (Organização › Biblioteca), só o publicado. O arquivo
 * mora onde já está; aqui é o link. Cada abertura conta no sinal
 * `abriu-material` — "materiais acessados na biblioteca" é um dos
 * indicadores do site no plano.
 */

function CartaoMaterial({ m }: { m: Material }) {
  const tema = temaPorChave(m.tema);
  return (
    <a href={m.link} target="_blank" rel="noopener noreferrer" onClick={() => sinal("abriu-material")} className="s-cartao">
      <span className="o-sub" style={{ margin: 0 }}>{m.tipoNome}{tema ? ` · ${tema.nome}` : ""}</span>
      <span className="s-cartao-titulo">{m.titulo}</span>
      {m.resumo && <span className="o-info">{m.resumo}</span>}
      <span className="o-rodape" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
        <Icon name={m.tipo === "gravacao" ? "play" : "book"} size={18} />
        {m.tipo === "gravacao" ? "Assistir" : "Abrir"}
      </span>
    </a>
  );
}

export default function Biblioteca() {
  const estado = useOrganizacao();
  const materiais = estado.fase === "pronto" ? estado.dados.biblioteca : [];
  const livro = materiais.filter((m) => m.tipo === "livro-amarelo");
  const resto = materiais.filter((m) => m.tipo !== "livro-amarelo");

  return (
    <Moldura
      trilha="Biblioteca"
      titulo="Para estudar e levar ao núcleo"
      icone="book"
      intro={
        <p>
          O que a militância lê, estuda e produz: o Livro Amarelo do Missão, os cadernos e os
          diagnósticos dos grupos temáticos e as gravações das formações.
        </p>
      }
    >
      <section aria-labelledby="b-iceberg" style={{ display: "grid", gap: 14, padding: "clamp(24px, 4vw, 36px)", marginBottom: "clamp(40px, 6vw, 64px)", background: C.ouroClaro, borderRadius: RAIO.xg }}>
        <p className="s-rotulo" style={{ margin: 0 }}>História, pessoas e documentos</p>
        <h2 id="b-iceberg" style={{ margin: 0, fontFamily: FONT_ALFA, fontWeight: 400, fontSize: TITULO.secao, lineHeight: 1.12 }}>Arquivo Iceberg</h2>
        <p style={{ margin: 0, maxWidth: "60ch", fontSize: 18, lineHeight: 1.55 }}>
          Uma linha do tempo dos Icebergs de Arthur do Val, dos documentários do MBL e da formação do Missão, com imagens, verbetes interligados e fontes para consultar.
        </p>
        <div className="s-acoes" style={{ marginTop: 6 }}>
          <Link href="/iceberg" prefetch={false} className="s-btn s-btn-tinta">
            Explorar o arquivo
            <Icon name="chevronRight" size={18} />
          </Link>
        </div>
      </section>

      {estado.fase === "carregando" && <p className="s-corpo">Carregando a Biblioteca…</p>}
      {estado.fase === "erro" && <p className="s-corpo">Não consegui carregar a Biblioteca agora. Tente de novo em instantes.</p>}
      {estado.fase === "pronto" && materiais.length === 0 && <p className="s-corpo">Os primeiros materiais estão sendo organizados. Volte em breve.</p>}

      {livro.length > 0 && (
        <Secao
          titulo="Círculo do Livro Amarelo"
          sub="Leitura guiada do programa nacional do Missão, um capítulo por encontro, ligando cada proposta à realidade do Ceará."
        >
          <div className="s-grade s-grade-3">{livro.map((m) => <CartaoMaterial key={m.id} m={m} />)}</div>
        </Secao>
      )}

      {resto.length > 0 && (
        <Secao titulo="Cadernos, diagnósticos e gravações">
          <div className="s-grade s-grade-3">{resto.map((m) => <CartaoMaterial key={m.id} m={m} />)}</div>
        </Secao>
      )}

      <p className="o-nota" style={{ marginBottom: 32 }}>
        Quer estudar junto? Os grupos temáticos têm a porta Estudo: é de lá que saem os diagnósticos.
      </p>
    </Moldura>
  );
}
