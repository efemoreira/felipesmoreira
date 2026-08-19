import type { Metadata } from "next";
import PaginaLegal, { type Secao } from "@/features/legal/PaginaLegal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "As regras de uso do site felipesmoreira.com e da área da militância da Missão Ceará.",
  alternates: { canonical: "https://felipesmoreira.com/terms" },
};

const secoes: Secao[] = [
  {
    titulo: "O que é este site",
    blocos: [
      "felipesmoreira.com é o site de Felipe Moreira, militante do MBL Ceará e parte da Missão Ceará. Aqui ficam a apresentação do movimento, a programação da semana, conteúdo sobre o Ceará e o formulário para quem quer ajudar na militância.",
      "Usar o site significa concordar com o que está escrito nesta página. Se você não concordar, é só não usar.",
    ],
  },
  {
    titulo: "Quem pode se inscrever",
    blocos: [
      "Qualquer pessoa a partir de 16 anos que queira ajudar o movimento. Ao se inscrever, você se compromete a dar informações verdadeiras — nome e telefone precisam ser seus de verdade, porque é por eles que a coordenação vai falar com você.",
      "A inscrição não gera acesso automático. A coordenação analisa cada uma e decide, e não é obrigada a aceitar todas.",
    ],
  },
  {
    titulo: "Sua conta de acesso",
    blocos: [
      "Se a sua inscrição for aprovada, você recebe um usuário e uma senha provisória pelo WhatsApp. No primeiro acesso o site obriga você a criar sua própria senha.",
      "A senha é sua responsabilidade: não empreste, não compartilhe e não deixe anotada onde outra pessoa alcance. Se desconfiar que alguém descobriu, avise a coordenação para trocarmos na hora.",
      "A coordenação pode suspender ou encerrar um acesso a qualquer momento, principalmente em caso de uso indevido das ferramentas ou do conteúdo do movimento.",
    ],
  },
  {
    titulo: "Como usar as ferramentas e o conteúdo",
    blocos: [
      "A área da militância traz ferramentas, materiais de formação e artes do movimento. Eles existem para o trabalho da Missão Ceará. Ao usar, você concorda em:",
      [
        "Não repassar material interno para fora do movimento sem autorização.",
        "Não usar as artes ou a identidade visual para outra campanha, candidatura ou fim comercial.",
        "Não usar os contatos que você conhecer dentro do movimento para spam ou assunto fora da militância.",
        "Seguir as regras de conduta do movimento na produção de conteúdo.",
      ],
    ],
  },
  {
    titulo: "Conteúdo do site",
    blocos: [
      "Textos, imagens e materiais publicados aqui são do movimento ou usados com autorização. Compartilhar o conteúdo público nas redes é bem-vindo e incentivado — é justamente para isso que ele existe. O que não pode é alterar o conteúdo de modo a mudar o sentido, ou apresentá-lo como se fosse de outra pessoa.",
      "A página “Heróis do Ceará” reúne informação histórica de domínio público, organizada pelo movimento.",
    ],
  },
  {
    titulo: "Disponibilidade",
    blocos: [
      "O site é mantido por uma equipe pequena e pode ficar fora do ar para manutenção ou por problema no serviço de hospedagem. A gente faz o possível para manter tudo funcionando, mas não dá para garantir funcionamento ininterrupto.",
    ],
  },
  {
    titulo: "Seus dados",
    blocos: [
      "O tratamento dos seus dados pessoais está explicado na Política de Privacidade, que faz parte destes termos.",
    ],
  },
  {
    titulo: "Mudanças nestes termos",
    blocos: [
      "Estes termos podem mudar conforme o site cresce. Mudança relevante é avisada nesta página, com a data de atualização no topo.",
    ],
  },
];

export default function TermosDeUso() {
  return (
    <PaginaLegal
      titulo="Termos de Uso"
      resumo="As regras de convivência do site e da área da militância. Em resumo: informação verdadeira na inscrição, senha é pessoal, e material do movimento é para o movimento."
      atualizadoEm="19 de agosto de 2026"
      secoes={secoes}
    />
  );
}
