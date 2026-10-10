/**
 * Para onde o site leva — o menu do topo e o mapa do rodapé, numa fonte só.
 *
 * O menu tem poucos itens, de propósito: as portas da organização, a agenda e
 * o que defendemos. Ação tem botão próprio ("Participar"), e o resto mora no
 * rodapé. Formação e Biblioteca entram aqui quando tiverem página pública —
 * `/aulas` pede login e mandaria o visitante para uma porta fechada.
 *
 * `testes/contrato/navegacao.test.ts` confere que todo destino existe.
 */

export interface ItemNav {
  rotulo: string;
  href: string;
}

export const MENU: ItemNav[] = [
  { rotulo: "Agenda", href: "/programacao" },
  { rotulo: "Núcleos", href: "/nucleos" },
  { rotulo: "Grupos", href: "/temas" },
  { rotulo: "Liga", href: "/portavozes" },
  { rotulo: "Propostas", href: "/propostas" },
];

export const PARTICIPAR: ItemNav = { rotulo: "Participar", href: "/queroajudar" };

export const RODAPE: { titulo: string; itens: ItemNav[] }[] = [
  {
    titulo: "Participe",
    itens: [
      { rotulo: "Quero participar", href: "/queroajudar" },
      { rotulo: "O que dá pra fazer", href: "/funcoes" },
      { rotulo: "Agenda", href: "/programacao" },
    ],
  },
  {
    titulo: "Organização",
    itens: [
      { rotulo: "Núcleos", href: "/nucleos" },
      { rotulo: "Grupos temáticos", href: "/temas" },
      { rotulo: "Liga dos Porta-vozes", href: "/portavozes" },
    ],
  },
  {
    titulo: "Conteúdo",
    itens: [
      { rotulo: "O que defendemos", href: "/propostas" },
      { rotulo: "Heróis do Ceará", href: "/heroisdoceara" },
      { rotulo: "Candidatos de 2026", href: "/candidatos" },
    ],
  },
  {
    titulo: "Sobre",
    itens: [
      { rotulo: "Quem coordena", href: "/amissao" },
      { rotulo: "Privacidade", href: "/privacy" },
      { rotulo: "Termos", href: "/terms" },
    ],
  },
];

/** As redes da coordenação — o perfil oficial do Missão Ceará entra aqui quando existir. */
export const REDES: { rede: string; icone: "instagram" | "x" | "youtube" | "tiktok" | "twitch" | "kick" | "video"; url: string; arroba: string }[] = [
  { rede: "Instagram", icone: "instagram", url: "https://instagram.com/moreiramissao", arroba: "@moreiramissao" },
  { rede: "X", icone: "x", url: "https://x.com/moreiramissao", arroba: "@moreiramissao" },
  { rede: "YouTube", icone: "youtube", url: "https://youtube.com/@moreiramissao", arroba: "@moreiramissao" },
  { rede: "TikTok", icone: "tiktok", url: "https://tiktok.com/@moreiramissao", arroba: "@moreiramissao" },
  { rede: "Twitch", icone: "twitch", url: "https://twitch.tv/moreiramissao", arroba: "moreiramissao" },
  { rede: "Kick", icone: "kick", url: "https://kick.com/moreiramissao", arroba: "moreiramissao" },
  { rede: "Kwai", icone: "video", url: "https://www.kwai.com/@moreiramissao", arroba: "@moreiramissao" },
];

/** "Esta página é deste item?" — /temas acende em "Grupos", e a raiz só na raiz. */
export function estaEm(pathname: string, href: string): boolean {
  const limpo = pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/";
  return href === "/" ? limpo === "/" : limpo === href || limpo.startsWith(href + "/");
}
