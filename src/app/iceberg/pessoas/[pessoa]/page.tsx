import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PESSOAS } from "@/features/iceberg/data";
import PaginaPessoa from "@/features/iceberg/PaginaPessoa";

type Props = { params: Promise<{ pessoa: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return PESSOAS.map(p => ({ pessoa: p.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pessoa: slug } = await params;
  const pessoa = PESSOAS.find(p => p.slug === slug);
  if (!pessoa) return {};
  const title = `${pessoa.nome} — Arquivo Iceberg`;
  const description = pessoa.biografia?.introduction.text.slice(0, 190) ?? pessoa.perfil?.summary.slice(0, 190) ?? "Biografia, trajetória e contexto dos episódios no Arquivo Iceberg.";
  return { title, description, alternates: { canonical: `https://felipesmoreira.com/iceberg/pessoas/${pessoa.slug}` }, openGraph: { title, description, images: [{ url: "https://felipesmoreira.com/iceberg/opengraph-image" }] }, twitter: { title, description, images: ["https://felipesmoreira.com/iceberg/opengraph-image"] } };
}

export default async function Pagina({ params }: Props) {
  const { pessoa: slug } = await params;
  const pessoa = PESSOAS.find(p => p.slug === slug);
  if (!pessoa) notFound();
  return <PaginaPessoa pessoa={pessoa} />;
}
