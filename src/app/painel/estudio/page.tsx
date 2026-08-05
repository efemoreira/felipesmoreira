import type { Metadata } from "next";
import { Anton, Oswald } from "next/font/google";
import EstudioClient from "./EstudioClient";

/**
 * Estúdio de Artes do painel.
 *
 * Página estática servida pelo public/painel/estudio.php, que confere a sessão
 * antes de entregar o HTML. Não é alcançável sem senha e não entra no sitemap.
 */

/* Condensadas pesadas das referências — só carregam nesta página */
const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "block",
});

const oswald = Oswald({
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "block",
});

export const metadata: Metadata = {
  title: "Estúdio de Artes",
  robots: { index: false, follow: false, nocache: true },
};

export default function PaginaEstudio() {
  return (
    // o id é o que o texto.ts usa para sondar as famílias das CSS vars
    <div id="estudio-raiz" className={`${anton.variable} ${oswald.variable}`}>
      <EstudioClient />
    </div>
  );
}
