import React from "react";
import Link from "next/link";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import type { Pessoa } from "./tipos";
import ArtigoPessoa from "./ArtigoPessoa";
import Estilos from "./Estilos";

export default function PaginaPessoa({ pessoa }: { pessoa: Pessoa }) {
  return <PaginaDoSite fundo="livre" abertura={<AberturaPagina trilha={`Arquivo Iceberg · ${pessoa.nome}`} kicker="Enciclopédia · Pessoas e história" titulo={pessoa.nome} intro={pessoa.biografia?.role ?? pessoa.perfil?.role} acoes={[{ texto: "Explorar a enciclopédia", href: "/iceberg#pessoas", icone: "book" }, { texto: "Linha do tempo", href: "/iceberg#cronologia", icone: "calendar" }]} />}>
    <Estilos />
    <div className="ig ig-pagina-pessoa"><div className="ig-pessoa-trilha"><Link href="/iceberg" prefetch={false}>Arquivo Iceberg</Link><span aria-hidden>›</span><Link href="/iceberg#pessoas" prefetch={false}>Enciclopédia</Link><span aria-hidden>›</span><span>{pessoa.nome}</span></div><ArtigoPessoa pessoa={pessoa} /></div>
  </PaginaDoSite>;
}
