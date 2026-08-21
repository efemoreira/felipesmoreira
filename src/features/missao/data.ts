import type { IconName } from "@/components/icons";

/**
 * A história do Felipe e o que a candidatura significa.
 *
 * **Nada aqui é inventado.** Nome de facção, cidade específica, data de
 * episódio e número de urna ficam de fora até que ele confirme — a trajetória
 * real (MBL → líder de jovens → rua → candidatura) é forte o suficiente sem
 * enfeite, e um detalhe inventado derruba a credibilidade do resto.
 */

export const CARGO = "Vice-Governador do Ceará";

/** O número da chapa: o mesmo 14 para presidente e para governador. */
export const CHAPA = {
  governador: "Delegado Huggo Leonardo",
  vice: "Felipe Moreira",
  partido: "Missão",
  plano: "Retomar para Reconstruir",

  /**
   * O número que se digita na urna — **o mesmo para presidente e para
   * governador**. O vice não tem número próprio, e por isso não há um segundo
   * campo aqui: quem escreve `14` escreve o voto inteiro da chapa.
   *
   * ⚠️ **Preencha aqui e só aqui.** Enquanto estiver vazio, a faixa de votação
   * não aparece em lugar nenhum do site: é melhor não dizer nada do que exibir
   * um número errado ou um espaço em branco onde o eleitor espera o número.
   * Confira contra o registro no TSE antes de escrever — número trocado é o
   * erro mais caro que este site pode cometer.
   */
  numero: "14",
};

export const CHAMADA =
  "De militante de internet a candidato a Vice-Governador. O caminho passou por uma sala de " +
  "jovens na igreja — e por uma pergunta que nenhum post respondia.";

/** A trajetória, em capítulos. É a espinha da página. */
export const capitulos: { icone: IconName; marco: string; titulo: string; texto: string[] }[] = [
  {
    icone: "dispositivo",
    marco: "Antes",
    titulo: "A militância que cabia na tela",
    texto: [
      "Durante muito tempo fui militante de internet pelo MBL no Ceará. Fazia o que acreditava " +
        "que podia fazer: discutir, esclarecer, brigar por ideia em rede social. Não era pouco, e " +
        "não me arrependo de nenhum dia.",
      "Mas era tudo o que eu fazia. E tem um limite no que se resolve escrevendo.",
    ],
  },
  {
    icone: "church",
    marco: "O ponto de virada",
    titulo: "A pergunta que nenhum post responde",
    texto: [
      "Foi servindo como líder de jovens na igreja que eu vi de perto um problema que nenhuma " +
        "publicação resolve: jovens que não conseguem ir de um lugar a outro. Não por falta de " +
        "dinheiro de passagem. Por medo.",
      "Medo do crime organizado e da disputa entre facções decidindo por onde eles podem e não " +
        "podem andar. Um bairro que é atravessar a rua e não dá pra atravessar. Uma vida inteira " +
        "encolhida ao tamanho de um quarteirão seguro.",
      "Eu não tinha resposta pra isso. E percebi que reclamar pela tela não ia ter.",
    ],
  },
  {
    icone: "flag",
    marco: "A decisão",
    titulo: "Militante de rua",
    texto: [
      "Larguei o conforto de só reclamar pela tela. Passei a estar onde a coisa acontece: " +
        "encontro, conversa, porta, rua. É mais lento, é mais difícil, e é a única coisa que muda " +
        "o que eu vi naquela sala.",
      "Missão é o que se aceita quando o trabalho é maior que o cargo.",
    ],
  },
  {
    icone: "star",
    marco: "Agora",
    titulo: `Candidato a ${CARGO}`,
    texto: [
      `Sou candidato a ${CARGO} na chapa do ${CHAPA.governador}, pelo Partido ${CHAPA.partido}.`,
      "Não é troca de assunto: é a mesma pergunta, num lugar onde ela pode virar política " +
        "pública. Devolver a esses jovens a liberdade de ir e vir — e um futuro que valha a pena.",
    ],
  },
];

/**
 * Por que segurança é o eixo dele. Cada item aponta para o compromisso do plano
 * que responde — a biografia não fica solta, ela cobra uma entrega.
 */
export const porQueSeguranca: { oQueVi: string; oQuePlanoFaz: string; ancora: string }[] = [
  {
    oQueVi: "O medo decidindo por onde o jovem pode andar.",
    oQuePlanoFaz:
      "Retomada territorial permanente, com mandado judicial e garantias preservadas — e o " +
      "Estado ficando depois que o crime sai.",
    ancora: "periferia-com-estado",
  },
  {
    oQueVi: "A ordem que continua saindo de dentro do presídio.",
    oQuePlanoFaz:
      "Inteligência policial e prisional sob um comando só, e presídio de segurança máxima " +
      "para separar as lideranças.",
    ancora: "ceara-seguro",
  },
  {
    oQueVi: "Família expulsa de casa e ninguém pra chamar.",
    oQuePlanoFaz:
      "Resposta em 48 horas com assistência jurídica, social e investigação — e a casa " +
      "reformada de volta.",
    ancora: "periferia-com-estado",
  },
  {
    oQueVi: "Onde falta esgoto e serviço público, a facção ocupa o vazio.",
    oQuePlanoFaz:
      "Ligação de esgoto financiada para as famílias do CadÚnico, tratada como política de " +
      "saúde preventiva.",
    ancora: "periferia-com-estado",
  },
];
