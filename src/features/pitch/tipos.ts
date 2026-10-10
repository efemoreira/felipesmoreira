/**
 * O FORMATO DE UM PITCH.
 *
 * Cada projeto pessoal é uma lista de slides de tela cheia, no mesmo roteiro da
 * apresentação do Guardião Predial: capa, problema, solução, produto (painel e
 * app), diferenciais, modelo de negócio, mercado, onde estamos e o pedido. O
 * conteúdo mora em `projetos/<slug>.ts`; quem desenha é `Apresentacao.tsx`.
 *
 * A cor é a do PRODUTO, não a do site: a apresentação é do Guardião, do Fluux…
 * e cada um tem a sua marca. O resto da superfície (fundo, cartão, filete, tinta)
 * sai de `PAINEL_DADOS` em `@/lib/theme`.
 */

export type Marca = {
  /** cor da marca: botões, selo e números; vira texto sobre o fundo claro (≥ 4,5:1) */
  primaria: string;
  /** fundo da capa e do pedido, com texto branco */
  escuro: string;
  /** destaque sobre o escuro; sempre com `tintaAcento` por cima quando é preenchimento */
  acento: string;
  tintaAcento: string;
};

export type Item = { titulo: string; texto: string };
export type Tela = { src: string; legenda: string };

type Cabeca = { selo: string; titulo: string; subtitulo?: string };

export type Slide =
  | { tipo: "capa"; selo: string; titulo: string; subtitulo: string; logo?: string }
  /** `dor`: o título do cartão sai em vermelho (o slide do problema) */
  | (Cabeca & { tipo: "cartoes"; itens: Item[]; dor?: boolean })
  | (Cabeca & { tipo: "painel"; principal: Tela; lado: Tela[] })
  | (Cabeca & { tipo: "celulares"; telas: Tela[] })
  /** uma ilustração desenhada em HTML, para projeto que ainda não tem captura de tela */
  | (Cabeca & { tipo: "ilustracao"; desenho: "grade-do-dia" | "preco-explicado"; itens: Item[] })
  | (Cabeca & { tipo: "planos"; planos: Plano[]; nota?: string })
  | (Cabeca & { tipo: "comparacao"; colunas: [string, string]; linhas: [string, string][]; nota?: string; posicao?: string })
  | (Cabeca & { tipo: "numeros"; itens: { valor: string; rotulo: string }[] })
  | (Cabeca & { tipo: "etapas"; itens: { etapa: string; titulo: string; texto: string; pronto: boolean }[] })
  | (Cabeca & { tipo: "pedido"; itens: Item[] });

export type Plano = { nome: string; preco: string; unidade?: string; resumo: string; itens: string[]; recomendado?: boolean };

export type Pitch = {
  slug: string;
  nome: string;
  /** a frase do <meta description> e do cartão do link */
  descricao: string;
  marca: Marca;
  slides: Slide[];
};
