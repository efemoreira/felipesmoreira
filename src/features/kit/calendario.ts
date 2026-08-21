import type { IconName } from "@/components/icons";
import { dataPorExtenso, FIM_DO_IMPULSIONAMENTO, type Fase } from "@/lib/eleicao";

/**
 * O que o kit diz em cada fase da eleição.
 *
 * A trava mora onde a ação acontece — é a mesma lógica da Parte 0 do manual.
 * Não adianta a regra estar num documento se a pessoa que vai publicar está
 * aqui, com o botão na mão. No dia da votação o kit **para de entregar peça**,
 * porque publicar conteúdo novo de propaganda na internet nesse dia é proibido.
 *
 * O que não muda em fase nenhuma: disparo em massa é proibido sempre, e nenhum
 * número sai daqui sem a página do plano.
 */

export interface Recado {
  icone: IconName;
  /** rótulo curto da fase */
  fase: string;
  titulo: string;
  texto: string;
  /** severidade visual: aviso comum ou trava */
  trava: boolean;
  /** true = o botão de pegar arte some */
  bloqueiaPecas: boolean;
}

export const RECADOS: Record<Fase, Recado | null> = {
  /* Campanha aberta: sem recado. Ferramenta que avisa o tempo todo vira aviso
     que ninguém lê — quando aparecer, é porque mudou mesmo alguma coisa. */
  campanha: null,

  "reta-final": {
    icone: "clock",
    fase: "Reta final",
    titulo: `Acabou o impulsionamento pago em ${dataPorExtenso(FIM_DO_IMPULSIONAMENTO)}`,
    texto:
      "Continue compartilhando normalmente no seu perfil e nos grupos — isso é manifestação " +
      "sua e segue valendo. O que não pode mais é pagar para a plataforma turbinar a " +
      "publicação. Se você costuma impulsionar, pare agora.",
    trava: false,
    bloqueiaPecas: false,
  },

  votacao: {
    icone: "close",
    fase: "Dia da votação",
    titulo: "Hoje não se publica conteúdo novo de propaganda",
    texto:
      "As peças estão fechadas de propósito. No dia da votação é proibido publicar conteúdo " +
      "novo de propaganda na internet e impulsionar publicação — e boca de urna é crime. " +
      "O que você pode: manifestar sua preferência de forma individual e silenciosa, com " +
      "camiseta, boné ou adesivo, sem aglomeração e sem abordar ninguém para pedir voto.",
    trava: true,
    bloqueiaPecas: true,
  },

  depois: {
    icone: "flag",
    fase: "Acabou a votação",
    titulo: "A campanha encerrou — obrigado por cada peça",
    texto:
      "O kit fica aqui como registro. A militância não acaba na urna: o grupo continua, e a " +
      "estrutura que a gente montou é o começo do próximo ciclo.",
    trava: false,
    bloqueiaPecas: true,
  },
};
