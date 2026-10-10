/**
 * O conteúdo da home — a marca, os cartões, quem coordena e as redes.
 *
 * DEPOIS DE 04/10/2026 A HOME É DA MILITÂNCIA, e não de um candidato. O plano
 * "Missão Ceará 2026–2027" (/planomissaoce) pede o site como porta de entrada
 * da organização: levar a pessoa do interesse à participação, da participação
 * à contribuição e da contribuição à continuidade. O Felipe continua aqui —
 * como quem mantém o site e coordena a militância, no bloco "Quem coordena",
 * e não como o rosto do topo.
 */
import type { IconName } from "@/components/icons";
import catalogo from "@/data/funcoes.json";

export const marca = {
  nome: "Missão Ceará",
  kicker: "Militância organizada no Ceará",
  bio: "Em 2026, mais de 107 mil cearenses votaram na Missão para presidente. Faltou quem levasse esse voto adiante. Agora é hora de casa: núcleos nos bairros, grupos por tema, porta-vozes nas redes e na rua — e lugar para você.",
  /* A marca das onças, a mesma do ícone do app. 192 px cobre o círculo de 132
     em tela 2x. */
  emblema: "/image/icone-192.png",
};

export const coordenacao = {
  nome: "Felipe Moreira",
  papel: "Coordenador de militância · mantém este site",
  /* 320 px cobre a tela 2x do círculo de 72. Ver originais/LEIA-ME.md. */
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
 * A escada do site, na ordem do funil do plano: entrar (Participe) → achar o
 * seu lugar (núcleo, tema, Liga) → aparecer (agenda) → escolher o que fazer
 * (funções) → o que a gente defende → a cultura.
 *
 * UM CARTÃO EM DESTAQUE, e não três: o ouro é do degrau de entrada. Destacar
 * tudo é não destacar nada.
 */
export const links: LinkCard[] = [
  {
    icon: "flag",
    title: "Quero participar",
    subtitle: "Conversa em até 3 dias e uma primeira tarefa",
    description:
      "Deixe seu contato: a coordenação conversa com você, te convida para uma atividade perto de você e combina uma tarefa pequena",
    href: "/queroajudar",
    internal: true,
    accent: true,
  },
  {
    icon: "pin",
    title: "Núcleos",
    subtitle: "A Missão no seu bairro",
    description: "Os núcleos territoriais da militância: onde funcionam, com que ritmo e como entrar",
    href: "/nucleos",
    internal: true,
  },
  {
    icon: "book",
    title: "Grupos temáticos",
    subtitle: "Um tema, um grupo, três portas",
    description: "Segurança, educação, saúde, economia e mais — entre pelo estudo, pela sua profissão ou pelo movimento",
    href: "/temas",
    internal: true,
  },
  {
    icon: "broadcast",
    title: "Liga dos Porta-vozes",
    subtitle: "Quem fala pela Missão nas redes e na rua",
    description: "Os cinco níveis da Liga, o método e quem já está nela",
    href: "/portavozes",
    internal: true,
  },
  {
    icon: "calendar",
    title: "Agenda",
    subtitle: "Encontros, lives e atividades abertas",
    description: "O que vem por aí: dia, horário, lugar ou plataforma",
    href: "/programacao",
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
    icon: "star",
    title: "O que defendemos",
    subtitle: "Propostas com meta e prazo",
    description: "Retomar para Reconstruir: sete compromissos com meta, prazo, de onde vem o recurso e como cobrar",
    href: "/propostas",
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

/** As redes de quem coordena — o perfil oficial do Missão Ceará entra aqui quando existir. */
export const socialLinks: { platform: string; icon: IconName; url: string; handle: string }[] = [
  { platform: "Instagram", icon: "instagram", url: "https://instagram.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitter / X", icon: "x", url: "https://x.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "YouTube", icon: "youtube", url: "https://youtube.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "TikTok", icon: "tiktok", url: "https://tiktok.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitch", icon: "twitch", url: "https://twitch.tv/moreiramissao", handle: "moreiramissao" },
  { platform: "Kick", icon: "kick", url: "https://kick.com/moreiramissao", handle: "moreiramissao" },
  { platform: "Kwai", icon: "video", url: "https://www.kwai.com/@moreiramissao", handle: "@moreiramissao" },
];
