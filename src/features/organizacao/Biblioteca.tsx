"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, TEXTO, bordaFina } from "@/lib/theme";
import { sinal } from "@/lib/api/sinal";
import type { Material } from "@/lib/api/organizacao";
import { temaPorChave } from "./catalogo";
import { Moldura, Secao, cartao, rotuloPequeno } from "./Moldura";
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
    <article style={cartao}>
      <p style={{ ...rotuloPequeno, margin: 0 }}>{m.tipoNome}{tema ? ` · ${tema.nome}` : ""}</p>
      <h3 style={{ fontFamily: FONT_ALFA, fontSize: 19, lineHeight: 1.2, margin: 0 }}>{m.titulo}</h3>
      {m.resumo && <p style={{ margin: 0, ...TEXTO.corpo }}>{m.resumo}</p>}
      <a
        href={m.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => sinal("abriu-material")}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontFamily: FONT_ALFA, fontSize: 15, color: C.ink }}
      >
        <Icon name={m.tipo === "gravacao" ? "play" : "book"} size={18} />
        {m.tipo === "gravacao" ? "Assistir" : "Abrir"}
      </a>
    </article>
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
      kicker="Biblioteca"
      titulo="Para estudar e levar ao núcleo"
      icone="book"
      intro={
        <p style={{ margin: 0 }}>
          O que a militância lê, estuda e produz: o Livro Amarelo do Missão, os cadernos e os
          diagnósticos dos grupos temáticos e as gravações das formações.
        </p>
      }
    >
      <Secao titulo="Arquivo Iceberg" sub="Uma linha do tempo dos Icebergs de Arthur do Val, dos documentários do MBL e da formação do Missão, com verbetes interligados e fontes para consultar.">
        <article style={cartao}>
          <p style={{ ...rotuloPequeno, margin: 0 }}>História · Pessoas · Documentos</p>
          <h3 style={{ fontFamily: FONT_ALFA, fontSize: 22, lineHeight: 1.3, margin: 0 }}>Quatro vídeos, uma história para explorar</h3>
          <p style={{ margin: 0, ...TEXTO.corpo }}>Consulte os acontecimentos, conheça os personagens e navegue por imagens com legendas, créditos e links para as fontes originais.</p>
          <Link href="/iceberg" prefetch={false} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontFamily: FONT_ALFA, fontSize: 16, color: C.ink }}><Icon name="book" size={18} />Explorar o Arquivo Iceberg</Link>
        </article>
      </Secao>
      {estado.fase === "carregando" && <p style={{ ...TEXTO.corpo }}>Carregando a Biblioteca…</p>}
      {estado.fase === "erro" && <p style={{ ...TEXTO.corpo }}>Não consegui carregar a Biblioteca agora. Tente de novo em instantes.</p>}
      {estado.fase === "pronto" && materiais.length === 0 && (
        <p style={{ ...TEXTO.corpo }}>Os primeiros materiais estão sendo organizados. Volte em breve.</p>
      )}

      {livro.length > 0 && (
        <Secao
          titulo="Círculo do Livro Amarelo"
          sub="Leitura guiada do programa nacional do Missão, um capítulo por encontro, ligando cada proposta à realidade do Ceará."
        >
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
            {livro.map((m) => <CartaoMaterial key={m.id} m={m} />)}
          </div>
        </Secao>
      )}

      {resto.length > 0 && (
        <Secao titulo="Cadernos, diagnósticos e gravações">
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
            {resto.map((m) => <CartaoMaterial key={m.id} m={m} />)}
          </div>
        </Secao>
      )}

      <p style={{ ...TEXTO.nota, borderTop: bordaFina(C.ink), paddingTop: 12 }}>
        Quer estudar junto? Os grupos temáticos têm a porta Estudo — é de lá que saem os diagnósticos.
      </p>
    </Moldura>
  );
}
