/**
 * Modelo de dados do Estúdio de Artes.
 *
 * Uma arte é uma pilha de camadas — índice 0 é a de trás. É o mesmo empilhamento
 * que aparece nas referências: fundo → fotos de contexto → sombreado → pessoas
 * recortadas → moldura → textos.
 */

export type Formato = "4:5" | "1:1" | "9:16";

export const FORMATOS: Record<Formato, { largura: number; altura: number; rotulo: string }> = {
  "4:5": { largura: 1080, altura: 1350, rotulo: "Feed 4:5" },
  "1:1": { largura: 1080, altura: 1080, rotulo: "Quadrado 1:1" },
  "9:16": { largura: 1080, altura: 1920, rotulo: "Stories 9:16" },
};

export type TipoCamada = "fundo" | "foto" | "pessoa" | "sombreado" | "texto" | "moldura" | "avatar";

export const ROTULO_TIPO: Record<TipoCamada, string> = {
  fundo: "Fundo",
  foto: "Foto de contexto",
  pessoa: "Pessoa",
  sombreado: "Sombreado",
  texto: "Texto",
  moldura: "Moldura",
  avatar: "Avatar",
};

interface Base {
  id: string;
  tipo: TipoCamada;
  nome: string;
  x: number;
  y: number;
  rotacao: number;
  /** 0 a 1 */
  opacidade: number;
  visivel: boolean;
  travada: boolean;
}

/** Ajustes de imagem comuns a fotos, pessoas e avatares. */
export interface Ajustes {
  /** -1 a 1 */
  brilho: number;
  /** -100 a 100 */
  contraste: number;
  /** -2 a 6 (Konva HSL) */
  saturacao: number;
  /** px */
  desfoque: number;
  cinza: boolean;
}

export const AJUSTES_NEUTROS: Ajustes = {
  brilho: 0,
  contraste: 0,
  saturacao: 0,
  desfoque: 0,
  cinza: false,
};

/** Pinta o recorte de uma cor sólida preservando a transparência. */
export interface Tinta {
  ativa: boolean;
  cor: string;
  /** 0 a 1 — 1 é silhueta chapada, 0.4 é só um véu de cor */
  forca: number;
}

export interface Sombra {
  ativa: boolean;
  cor: string;
  x: number;
  y: number;
  desfoque: number;
}

/**
 * Gradiente na própria pessoa, subindo da base.
 *
 * É o que faz o corpo se dissolver no fundo em vez de terminar num corte reto
 * (modo "dissolver") ou ganhar cor só na parte de baixo (modo "pintar").
 * Diferente da camada `sombreado`, que cobre a arte inteira: este anda junto
 * com o recorte, então vale por pessoa quando são 2 ou 3 em foco.
 */
export interface GradientePessoa {
  ativo: boolean;
  modo: "dissolver" | "pintar";
  cor: string;
  /** 0 a 1 — fração da altura da pessoa que o gradiente cobre, de baixo p/ cima */
  extensao: number;
  /** 0 a 1 — intensidade na base */
  forca: number;
}

/** Halo atrás do recorte — a luz de contorno dourada das referências. */
export interface Halo {
  ativo: boolean;
  cor: string;
  /** px de "engorda" do contorno */
  tamanho: number;
  desfoque: number;
}

interface ComImagem {
  /** id do ativo na biblioteca (IndexedDB); vazio = espaço reservado do modelo */
  ativoId: string;
  largura: number;
  altura: number;
  espelhado: boolean;
}

export interface CamadaFundo extends Base {
  tipo: "fundo";
  modo: "solida" | "gradiente";
  cor: string;
  cor2: string;
  /** graus, 0 = de cima para baixo */
  angulo: number;
}

export type Mistura = "normal" | "multiply" | "screen" | "overlay" | "luminosity" | "soft-light";

export interface CamadaFoto extends Base, ComImagem {
  tipo: "foto";
  ajustes: Ajustes;
  mistura: Mistura;
  /** 0 a 1 — quanto da borda vira degradê até sumir */
  esmaecer: number;
}

export interface CamadaPessoa extends Base, ComImagem {
  tipo: "pessoa";
  ajustes: Ajustes;
  tinta: Tinta;
  gradiente: GradientePessoa;
  sombra: Sombra;
  halo: Halo;
}

export type DirecaoSombreado = "base" | "topo" | "ambos" | "vinheta";

export interface CamadaSombreado extends Base {
  tipo: "sombreado";
  direcao: DirecaoSombreado;
  cor: string;
  /** 0 a 1 — opacidade no ponto mais fechado */
  forca: number;
  /** 0 a 1 — fração da altura coberta pelo degradê */
  extensao: number;
}

export type ChaveFonte = "anton" | "oswald" | "alfa" | "bitter";
export type Alinhamento = "left" | "center" | "right";

export interface CamadaTexto extends Base {
  tipo: "texto";
  /** aceita *destaque* e ==tarja== */
  texto: string;
  fonte: ChaveFonte;
  tamanho: number;
  /** múltiplo do tamanho */
  entrelinha: number;
  espacamento: number;
  alinhamento: Alinhamento;
  caixaAlta: boolean;
  /** largura da caixa de quebra */
  largura: number;
  cor: string;
  corDestaque: string;
  corTarja: string;
  corTextoTarja: string;
  contorno: { ativo: boolean; cor: string; espessura: number };
  sombra: Sombra;
  /** encolhe o corpo até a maior linha caber na largura */
  autoAjuste: boolean;
}

export interface CamadaMoldura extends Base {
  tipo: "moldura";
  cor: string;
  espessura: number;
  recuo: number;
  dupla: boolean;
  raio: number;
}

export interface CamadaAvatar extends Base, ComImagem {
  tipo: "avatar";
  ajustes: Ajustes;
  anel: { ativo: boolean; cor: string; espessura: number };
  sombra: Sombra;
}

export type Camada =
  | CamadaFundo
  | CamadaFoto
  | CamadaPessoa
  | CamadaSombreado
  | CamadaTexto
  | CamadaMoldura
  | CamadaAvatar;

/** Camadas que aceitam arrastar, girar e redimensionar pelo palco. */
export type CamadaTransformavel = CamadaFoto | CamadaPessoa | CamadaTexto | CamadaAvatar;

export const transformavel = (c: Camada): c is CamadaTransformavel =>
  c.tipo === "foto" || c.tipo === "pessoa" || c.tipo === "texto" || c.tipo === "avatar";

export const temImagem = (c: Camada): c is CamadaFoto | CamadaPessoa | CamadaAvatar =>
  c.tipo === "foto" || c.tipo === "pessoa" || c.tipo === "avatar";

export interface Projeto {
  id: string;
  nome: string;
  formato: Formato;
  /** índice 0 = camada mais de trás */
  camadas: Camada[];
  atualizadoEm: number;
}

/** Imagem guardada na biblioteca local para reaproveitar entre artes. */
export interface Ativo {
  id: string;
  nome: string;
  familia: "pessoa" | "fundo";
  blob: Blob;
  largura: number;
  altura: number;
  criadoEm: number;
}

export const novoId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
