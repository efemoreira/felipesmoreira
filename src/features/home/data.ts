/**
 * O conteúdo da home — a marca, os números, as portas, a escada, quem coordena.
 *
 * DEPOIS DE 04/10/2026 A HOME É DA MILITÂNCIA, e não de um candidato. O plano
 * "Missão Ceará 2026–2027" (/plano) pede o site como porta de entrada da
 * organização: levar a pessoa do interesse à participação, da participação à
 * contribuição e da contribuição à continuidade. A ordem das seções é essa
 * escada: entrar → achar o seu lugar → entender como se sobe → o resto.
 *
 * O Felipe continua aqui — como quem mantém o site e coordena a militância, no
 * bloco "Quem coordena", e não como o rosto do topo.
 */
import type { IconName } from "@/components/icons";
import catalogo from "@/data/funcoes.json";

export const marca = {
  nome: "Missão Ceará",
  kicker: "Militância organizada no Ceará",
  chamada: "Da urna à organização permanente",
  bio: "Em 2026, mais de 107 mil cearenses votaram na Missão para presidente. Faltou quem levasse esse voto adiante. Agora é hora de casa: núcleos nos bairros, grupos por tema, porta-vozes nas redes e na rua — e lugar para você.",
  /* A marca das onças, a mesma do ícone do app (512 px em src/app/icon.png). */
  emblema: "/icon.png",
};

export const coordenacao = {
  nome: "Felipe Moreira",
  papel: "Coordenador de militância · mantém este site",
  /* 320 px cobre a tela 2x do círculo de 72. Ver originais/LEIA-ME.md. */
  photo: "/image/me-320.webp",
  photoReserva: "/image/me-320.jpg",
};

/** O diagnóstico do 1º turno, em três carimbos. Fonte: /resultados. */
export const numeros: { valor: string; rotulo: string }[] = [
  { valor: "107.587", rotulo: "cearenses votaram na Missão para presidente" },
  { valor: "18 em 100", rotulo: "deles votaram também no 14 para deputado" },
  { valor: "46 em 100", rotulo: "foi essa conta no Brasil — é a ponte que falta" },
];

export type Porta = {
  icon: IconName;
  title: string;
  subtitle: string;
  description: string;
  href: string;
};

/** As três portas de entrada da organização — onde, sobre o quê, quem fala. */
export const portas: Porta[] = [
  {
    icon: "pin",
    title: "Núcleos",
    subtitle: "Onde você mora",
    description: "O grupo do seu bairro, cidade ou universidade, com ritmo certo e alguém que responde por ele.",
    href: "/nucleos",
  },
  {
    icon: "book",
    title: "Grupos temáticos",
    subtitle: "Sobre o que você entende",
    description: "Um tema, um grupo. Entre pelo estudo, pela sua profissão ou pelo movimento.",
    href: "/temas",
  },
  {
    icon: "broadcast",
    title: "Liga dos Porta-vozes",
    subtitle: "Quem fala pela Missão",
    description: "Cinco níveis: cresce nas redes e faz ação real na rua. Sobe quem faz as duas coisas.",
    href: "/portavozes",
  },
];

/** O resto do site — blocos menores, depois das portas. */
export const mais: Porta[] = [
  {
    icon: "calendar",
    title: "Agenda",
    subtitle: "Encontros, lives e atividades abertas",
    description: "O que vem por aí: dia, horário, lugar ou plataforma.",
    href: "/programacao",
  },
  {
    icon: "users",
    title: "O que dá pra fazer",
    subtitle: `As ${catalogo.funcoes.length} funções da militância`,
    description: "O que cada função entrega e quanto tempo pede, antes de você decidir.",
    href: "/funcoes",
  },
  {
    icon: "star",
    title: "O que defendemos",
    subtitle: "Propostas com meta e prazo",
    description: "Sete compromissos com meta, prazo e de onde vem o recurso.",
    href: "/propostas",
  },
  {
    icon: "mountain",
    title: "Heróis do Ceará",
    subtitle: "Cordel de quem fez a nossa história",
    description: "Histórias, legados e o que eles deixaram para o estado.",
    href: "/heroisdoceara",
  },
];
