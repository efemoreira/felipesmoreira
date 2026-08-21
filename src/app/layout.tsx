import type { Metadata, Viewport } from "next";
import {
  Geist_Mono,
  Alfa_Slab_One,
  Special_Elite,
  Bitter,
} from "next/font/google";
import "./globals.css";

/* Só a mono: o `font-mono` do Estúdio depende dela. A Geist Sans estava
   declarada e nenhum componente a usava — não chegava a baixar, mas convidava
   a usar uma família que não é a do site. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Fontes do cordel — auto-hospedadas pelo Next (sem render-blocking externo) */
const alfaSlab = Alfa_Slab_One({
  weight: "400",
  variable: "--font-alfa",
  subsets: ["latin"],
  display: "swap",
});

const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-elite",
  subsets: ["latin"],
  display: "swap",
});

const bitter = Bitter({
  weight: ["400", "600", "700"],
  variable: "--font-bitter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://felipesmoreira.com"),
  title: {
    default: "Felipe Moreira — Candidato a Vice-Governador do Ceará | Missão Ceará",
    template: "%s | Felipe Moreira",
  },
  description:
    "Felipe Moreira, candidato a Vice-Governador do Ceará pela Missão Ceará. De militante de internet no MBL Ceará a militante de rua: a história, o projeto e como entrar na militância.",
  applicationName: "Felipe Moreira",
  keywords: [
    "Felipe Moreira",
    "Ceará",
    "Missão",
    "Missão CE",
    "Missão Ceará",
    "MBL",
    "MBL CE",
    "MBL Ceará",
    "candidato a vice-governador do Ceará",
    "vice-governador do Ceará",
    "eleições 2026 Ceará",
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
    siteName: "Felipe Moreira",
    title: "Felipe Moreira — Candidato a Vice-Governador do Ceará",
    description:
      "Missão Ceará: devolver aos nossos jovens a liberdade que o crime organizado roubou.",
    // imagem OG (1200×630) gerada automaticamente por app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    site: "@moreiramissao",
    creator: "@moreiramissao",
    title: "Felipe Moreira — Candidato a Vice-Governador do Ceará",
    description:
      "Missão Ceará: devolver aos nossos jovens a liberdade que o crime organizado roubou.",
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
  themeColor: "#181203",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Felipe Moreira",
    alternateName: ["Missão", "Missão Ceará", "Missão CE", "MBL Ceará", "MBL CE"],
    url: "https://felipesmoreira.com",
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
    jobTitle: "Candidato a Vice-Governador do Ceará",
    description:
      "De militante de internet no MBL Ceará a militante de rua. Ex-líder de jovens que abraçou a Missão Ceará para devolver aos jovens a liberdade tomada pelo crime organizado. Candidato a Vice-Governador do Ceará.",
    email: "contato@felipesmoreira.com",
    telephone: "+55 85 99722-3863",
    areaServed: "BR",
    homeLocation: {
      "@type": "AdministrativeArea",
      name: "Ceará",
    },
    affiliation: {
      "@type": "Organization",
      name: "Movimento Brasil Livre",
      alternateName: "MBL",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+55 85 99722-3863",
      contactType: "Customer Support",
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
        className={`${geistMono.variable} ${alfaSlab.variable} ${specialElite.variable} ${bitter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
