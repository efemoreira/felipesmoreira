import type { Metadata } from "next";
import {
  Anton,
  Archivo_Black,
  Bebas_Neue,
  Oswald,
  Playfair_Display,
  UnifrakturMaguntia,
} from "next/font/google";
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

/*
 * O resto da estante do estúdio.
 *
 * Ficam aqui, e não no layout do site, de propósito: quem abre uma página
 * pública não deve baixar meia dúzia de fontes que só servem para montar arte.
 * `display: "block"` em todas — no canvas não existe troca de fonte depois do
 * desenho, então é melhor esperar do que medir o texto na fonte de reserva.
 */
const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "block",
});

const archivo = Archivo_Black({
  weight: "400",
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "block",
});

const playfair = Playfair_Display({
  weight: ["700", "900"],
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "block",
});

const gotica = UnifrakturMaguntia({
  weight: "400",
  variable: "--font-gotica",
  subsets: ["latin"],
  display: "block",
});

const FONTES_DA_PAGINA = [anton, oswald, bebas, archivo, playfair, gotica]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Estúdio de Artes",
  robots: { index: false, follow: false, nocache: true },
};

export default function PaginaEstudio() {
  return (
    // o id é o que o texto.ts usa para sondar as famílias das CSS vars
    <div id="estudio-raiz" className={FONTES_DA_PAGINA}>
      <EstudioClient />
    </div>
  );
}
