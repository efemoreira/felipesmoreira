import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Alfa_Slab_One,
  Special_Elite,
  Bitter,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    default: "Felipe Moreira — Missão · O Futuro é Glorioso | Ceará",
    template: "%s | Felipe Moreira",
  },
  description:
    "Felipe Moreira: de militante de internet no MBL a militante de rua. Depois de ver jovens presos pelo medo do crime organizado, abracei a missão de mudar isso. Conheça a história.",
  applicationName: "Felipe Moreira",
  keywords: [
    "Felipe Moreira",
    "Ceará",
    "missão",
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
    title: "Felipe Moreira — Missão · O Futuro é Glorioso",
    description:
      "De militante de internet no MBL a militante de rua. A missão de devolver aos jovens a liberdade que o crime organizado roubou.",
    // imagem OG (1200×630) gerada automaticamente por app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    site: "@moreiramissao",
    creator: "@moreiramissao",
    title: "Felipe Moreira — Missão · O Futuro é Glorioso",
    description:
      "De militante de internet a militante de rua. A missão de devolver aos jovens a liberdade roubada pelo crime organizado.",
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
    url: "https://felipesmoreira.com",
    image: {
      "@type": "ImageObject",
      url: "https://felipesmoreira.com/image/me.png",
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
    jobTitle: "Ativista Político",
    description:
      "De militante de internet no MBL a militante de rua. Ex-líder de jovens que abraçou a missão de devolver aos jovens a liberdade tomada pelo crime organizado.",
    email: "contato@felipesmoreira.com",
    telephone: "+55 85 99722-3863",
    areaServed: "BR",
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
        className={`${geistSans.variable} ${geistMono.variable} ${alfaSlab.variable} ${specialElite.variable} ${bitter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
