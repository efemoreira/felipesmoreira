import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Apresentacao } from "@/features/pitch/Apresentacao";
import { PITCHES, pitchDe } from "@/features/pitch/projetos";

/* Os pitches dos projetos pessoais do Felipe: apoio de fala, mandado por
   link. Não são da Missão — por isso o título não leva "| Missão Ceará", e
   nada de índice nem de sitemap. */

type Props = { params: Promise<{ projeto: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PITCHES.map((p) => ({ projeto: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pitch = pitchDe((await params).projeto);
  if (!pitch) return {};
  return {
    title: { absolute: `${pitch.nome} · Apresentação` },
    description: pitch.descricao,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: null },
    openGraph: { title: pitch.nome, description: pitch.descricao, siteName: "Felipe Moreira" },
  };
}

export default async function PitchPage({ params }: Props) {
  const pitch = pitchDe((await params).projeto);
  if (!pitch) notFound();
  return <Apresentacao pitch={pitch} />;
}
