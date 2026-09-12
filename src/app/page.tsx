import Home from "@/features/home/Home";

/* A home: metadata vem do layout raiz (título, OG, JSON-LD). O conteúdo —
   perfil, cartões, redes — mora em features/home, como o das outras rotas. */
export default function Page() {
  return <Home />;
}
