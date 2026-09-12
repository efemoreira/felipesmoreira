/**
 * O conteúdo da home — perfil, os cartões e as redes.
 *
 * Saiu de `src/app/page.tsx` em 12/09: a home era a única rota gorda do site
 * (477 linhas de componente e dado no mesmo arquivo), a exceção não escrita
 * à regra "page.tsx fino". Agora a rota é metadata + <Home />, como as outras.
 */
import type { IconName } from "@/components/icons";
import catalogo from "@/data/funcoes.json";

export const profile = {
  name: "Felipe Moreira",
  kicker: "Candidato a Vice-Governador do Ceará",
  bio: "De militante de internet no MBL Ceará a militante de rua. Larguei o conforto de só reclamar pela tela pra abraçar a Missão Ceará de devolver aos nossos jovens a liberdade que o crime organizado roubou.",
  /* 320 px cobre a tela 2x do círculo de 152. Ver originais/LEIA-ME.md. */
  photo: "/image/me-320.webp",
  photoReserva: "/image/me-320.jpg",
};

export type LinkCard = {
  icon: IconName;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  internal?: boolean;
  accent?: boolean;
};

/**
 * Um cartão em destaque, não três.
 *
 * Antes, "Quero ajudar", "Programação" e "Heróis" eram todos `accent` e
 * disputavam o mesmo clique — o efeito de destacar tudo é não destacar nada.
 * O ouro continua sendo de um só: o degrau de entrada.
 *
 * ESSE DEGRAU AGORA É "QUERO AJUDAR". Antes era o link do grupo do WhatsApp,
 * que saía do site — a home entregava o visitante a um aplicativo antes de ele
 * saber quem é o candidato, e quem voltava não voltava para lugar nenhum. Como
 * primeiro degrau ele era barato demais para significar alguma coisa: entrar
 * num grupo custa dez segundos e não é compromisso nenhum.
 *
 * A escada continua descendo por compromisso, só que inteira dentro do site:
 * assumir função → saber quem sou → ler o plano → o resto. O convite do grupo
 * continua existindo onde ele faz sentido — no fim do /plano e depois da
 * inscrição, para quem já leu alguma coisa antes de entrar.
 */
export const links: LinkCard[] = [
  {
    icon: "flag",
    title: "Quero ajudar",
    subtitle: "Escolha sua função na militância",
    description:
      "Escolha como quer ajudar o movimento no Ceará — comunicação, eventos ou onde precisar — e a coordenação entra em contato",
    href: "/queroajudar",
    internal: true,
    accent: true,
  },
  {
    icon: "star",
    title: "A Missão",
    subtitle: "Quem eu sou e por que me candidatei",
    description:
      "De militante de internet no MBL a candidato a Vice-Governador do Ceará: a trajetória e o motivo",
    href: "/amissao",
    internal: true,
  },
  {
    icon: "book",
    title: "Propostas",
    subtitle: "O plano de governo, com meta e prazo",
    description:
      "Retomar para Reconstruir: sete compromissos com meta, prazo, de onde vem o recurso e como você cobra",
    href: "/propostas",
    internal: true,
  },
  {
    icon: "users",
    title: "O que dá pra fazer",
    subtitle: `As ${catalogo.funcoes.length} funções da militância`,
    description:
      "O que cada função entrega e quanto tempo pede — de Olheiro a Recepção — antes de você decidir",
    href: "/funcoes",
    internal: true,
  },
  {
    icon: "calendar",
    title: "Programação da Semana",
    subtitle: "Onde e quando me assistir",
    description:
      "Agenda da semana: lives, conversas e conteúdos com dia, horário e plataforma",
    href: "/programacao",
    internal: true,
  },
  {
    icon: "mountain",
    title: "Heróis do Ceará",
    subtitle: "Cordel dos que fizeram nossa história",
    description:
      "Conheça os heróis históricos do Ceará, suas histórias, legados e impactos na formação cultural do estado",
    href: "/heroisdoceara",
    internal: true,
  },
];

export const socialLinks: { platform: string; icon: IconName; url: string; handle: string }[] = [
  { platform: "Instagram", icon: "instagram", url: "https://instagram.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitter / X", icon: "x", url: "https://x.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "YouTube", icon: "youtube", url: "https://youtube.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "TikTok", icon: "tiktok", url: "https://tiktok.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitch", icon: "twitch", url: "https://twitch.tv/moreiramissao", handle: "moreiramissao" },
  { platform: "Kick", icon: "kick", url: "https://kick.com/moreiramissao", handle: "moreiramissao" },
  { platform: "Kwai", icon: "video", url: "https://www.kwai.com/@moreiramissao", handle: "@moreiramissao" },
];

