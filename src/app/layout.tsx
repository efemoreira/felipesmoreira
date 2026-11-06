import type { Metadata, Viewport } from "next";
import { Sinal } from "@/components/Sinal";
import {
  Geist_Mono,
  Alfa_Slab_One,
  Figtree,
  Special_Elite,
  Bitter,
} from "next/font/google";
import "./globals.css";
import { TELEFONE_E164 } from "@/lib/contato";

/* Só a mono: o `font-mono` do Estúdio depende dela. A Geist Sans estava
   declarada e nenhum componente a usava — não chegava a baixar, mas convidava
   a usar uma família que não é a do site. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* As duas vozes do site — auto-hospedadas pelo Next (sem render-blocking externo) */
const alfaSlab = Alfa_Slab_One({
  weight: "400",
  variable: "--font-alfa",
  subsets: ["latin"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-texto",
  subsets: ["latin"],
  display: "swap",
});

/* Só para o Estúdio, que as oferece como opção de texto: nenhuma página as
   escreve, então não vale pré-carregar. `fontesProntas()` baixa as duas na hora
   de desenhar. */
const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-elite",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const bitter = Bitter({
  weight: ["400", "600", "700"],
  variable: "--font-bitter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://felipesmoreira.com"),
  title: {
    default: "Missão Ceará — Militância organizada no Ceará",
    template: "%s | Missão Ceará",
  },
  description:
    "A militância da Missão no Ceará: núcleos nos bairros, grupos temáticos, a Liga dos Porta-vozes, agenda e formação. Coordenada por Felipe Moreira.",
  applicationName: "Missão Ceará",
  keywords: [
    "Felipe Moreira",
    "Ceará",
    "Missão",
    "Missão CE",
    "Missão Ceará",
    "MBL",
    "MBL CE",
    "MBL Ceará",
    "militância Ceará",
    "núcleos Missão Ceará",
    "porta-vozes",
    "Partido Missão Ceará",
    "segurança pública Ceará",
    "sertão",
    "heróis do Ceará",
    "cordel",
    "política",
    "ativista",
  ],
  authors: [{ name: "Felipe Moreira" }],
  creator: "Felipe Moreira",
  publisher: "Felipe Moreira",
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://felipesmoreira.com",
    siteName: "Missão Ceará",
    title: "Missão Ceará — Militância organizada no Ceará",
    description:
      "Núcleos nos bairros, grupos por tema, porta-vozes nas redes e na rua — e lugar para você.",
    // imagem OG (1200×630) gerada automaticamente por app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    site: "@moreiramissao",
    creator: "@moreiramissao",
    title: "Missão Ceará — Militância organizada no Ceará",
    description:
      "Núcleos nos bairros, grupos por tema, porta-vozes nas redes e na rua — e lugar para você.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://felipesmoreira.com",
    languages: {
      "pt-BR": "https://felipesmoreira.com",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* A ORGANIZAÇÃO, e quem a coordena. Até 04/10/2026 era uma Person (o
     candidato); depois da eleição o site é da militância, e o Felipe aparece
     como quem coordena — o mesmo que a home diz. */
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Missão Ceará",
    alternateName: ["Missão CE", "Militância Missão Ceará"],
    url: "https://felipesmoreira.com",
    logo: "https://felipesmoreira.com/icon.png",
    description:
      "A militância do Partido Missão no Ceará: núcleos territoriais, grupos temáticos, a Liga dos Porta-vozes, agenda e formação.",
    areaServed: { "@type": "AdministrativeArea", name: "Ceará" },
    member: {
      "@type": "Person",
      name: "Felipe Moreira",
      jobTitle: "Coordenador de militância",
      /* A dimensão declarada tem que bater com o arquivo — ver originais/LEIA-ME.md. */
      image: {
        "@type": "ImageObject",
        url: "https://felipesmoreira.com/image/me-512.jpg",
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://instagram.com/moreiramissao",
        "https://x.com/moreiramissao",
        "https://youtube.com/@moreiramissao",
        "https://tiktok.com/@moreiramissao",
        "https://twitch.tv/moreiramissao",
        "https://kick.com/moreiramissao",
      ],
    },
    /* Sem e-mail de propósito: o único canal é o WhatsApp. Deixar o endereço
       aqui, em dado estruturado, seria tirá-lo da tela e mantê-lo justamente
       onde raspador lê. */
    contactPoint: {
      "@type": "ContactPoint",
      telephone: TELEFONE_E164,
      contactType: "Militância",
      areaServed: "BR",
      availableLanguage: ["pt-BR"],
    },
  };

  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body
        className={`${geistMono.variable} ${alfaSlab.variable} ${figtree.variable} ${specialElite.variable} ${bitter.variable} antialiased`}
      >
        {children}
        <Sinal />
      </body>
    </html>
  );
}
