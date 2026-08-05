/**
 * Modelo de dados do Estúdio de Artes.
 *
 * Uma arte é uma pilha de camadas — índice 0 é a de trás. É o mesmo empilhamento
 * que aparece nas referências: fundo → fotos de contexto → sombreado → pessoas
 * recortadas → moldura → textos.
 */

export type Formato = "4:5" | "1:1" | "9:16" | "16:9" | "1.91:1" | "livre";

export type Orientacao = "vertical" | "quadrado" | "paisagem";

export const FORMATOS: Record<
  Formato,
  { largura: number; altura: number; rotulo: string; orientacao: Orientacao }
> = {
  "4:5": { largura: 1080, altura: 1350, rotulo: "Feed 4:5", orientacao: "vertical" },
  "9:16": { largura: 1080, altura: 1920, rotulo: "Stories 9:16", orientacao: "vertical" },
  "1:1": { largura: 1080, altura: 1080, rotulo: "Quadrado 1:1", orientacao: "quadrado" },
  "16:9": { largura: 1920, altura: 1080, rotulo: "Capa / vídeo 16:9", orientacao: "paisagem" },
  "1.91:1": { largura: 1200, altura: 628, rotulo: "Link 1.91:1", orientacao: "paisagem" },
  // as medidas do "livre" moram no projeto (`tamanho`); aqui fica só um ponto de partida
  livre: { largura: 1080, altura: 1080, rotulo: "Personalizado", orientacao: "quadrado" },
};

/** Ordem de exibição nos seletores, agrupada por orientação. */
export const GRUPOS_FORMATO: { rotulo: string; formatos: Formato[] }[] = [
  { rotulo: "Vertical", formatos: ["4:5", "9:16"] },
  { rotulo: "Quadrado", formatos: ["1:1"] },
  { rotulo: "Paisagem", formatos: ["16:9", "1.91:1"] },
];

export const LIVRE_MIN = 320;
export const LIVRE_MAX = 4096;

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

/**
 * Dissolve as bordas da imagem até a transparência.
 *
 * Cada lado tem o seu valor, e `cantos` apaga só as quinas — é o que faz uma
 * foto (ou um recorte) se compor com o fundo em vez de terminar num retângulo.
 */
export interface Esmaecimento {
  ativo: boolean;
  /** "lados" trata cada borda; "elipse" é uma máscara radial a partir do centro */
  modo: "lados" | "elipse";
  /** 0 a 1 — fração daquele lado que vira degradê */
  topo: number;
  direita: number;
  base: number;
  esquerda: number;
  /** 0 a 1 — apaga os cantos sem mexer no meio dos lados */
  cantos: number;
  /** 0 a 1 — 0 é bem suave, 1 é quase um corte seco */
  dureza: number;
}

export const SEM_ESMAECER: Esmaecimento = {
  ativo: false,
  modo: "lados",
  topo: 0,
  direita: 0,
  base: 0,
  esquerda: 0,
  cantos: 0,
  dureza: 0.5,
};

/** Esmaecimento igual nos quatro lados — o que o slider único fazia antes. */
export const esmaecerUniforme = (v: number, extra: Partial<Esmaecimento> = {}): Esmaecimento => ({
  ...SEM_ESMAECER,
  ativo: v > 0,
  topo: v,
  direita: v,
  base: v,
  esquerda: v,
  ...extra,
});

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
  esmaecer: Esmaecimento;
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
}

export interface CamadaPessoa extends Base, ComImagem {
  tipo: "pessoa";
  ajustes: Ajustes;
  tinta: Tinta;
  gradiente: GradientePessoa;
  sombra: Sombra;
  halo: Halo;
}

export type DirecaoSombreado = "base" | "topo" | "ambos" | "vinheta" | "esquerda" | "direita";

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

/** Que lugar o texto ocupa na arte — é por aqui que o assistente sabe onde
 *  encaixar o título que foi digitado, sem depender do nome da camada. */
export type PapelTexto = "titulo" | "subtitulo" | "chapeu";

/**
 * Caixa atrás do bloco de texto — o que garante leitura sobre foto.
 *
 * Diferente da tarja `==assim==`, que marca palavras soltas, este fundo pega o
 * texto inteiro: ou numa caixa só (`bloco`) ou numa faixa colada em cada linha.
 */
export interface FundoTexto {
  ativo: boolean;
  modo: "bloco" | "linha";
  cor: string;
  /** 0 a 1 */
  opacidade: number;
  /** respiro em px além da mancha de texto */
  padX: number;
  padY: number;
  raio: number;
  /** graus — a tarja levemente torta das referências */
  inclinacao: number;
  /** só no modo "linha": ocupa a largura da caixa em vez de seguir o texto */
  larguraTotal: boolean;
}

/** Acabamento das tarjas `==assim==` — antes eram constantes no código. */
export interface AcabamentoTarja {
  padX: number;
  padY: number;
  raio: number;
  inclinacao: number;
  /** altura pela métrica real da fonte (padrão) ou fixa em fração do corpo */
  ajuste: "metricas" | "fixo";
}

export const FUNDO_TEXTO_PADRAO: FundoTexto = {
  ativo: false,
  modo: "bloco",
  cor: "#14110C",
  opacidade: 0.72,
  padX: 28,
  padY: 18,
  raio: 0,
  inclinacao: 0,
  larguraTotal: false,
};

export const TARJA_PADRAO: AcabamentoTarja = {
  padX: 0.16,
  padY: 0.1,
  raio: 0,
  inclinacao: 0,
  ajuste: "metricas",
};

export interface CamadaTexto extends Base {
  tipo: "texto";
  /** ausente nos projetos criados antes do assistente */
  papel?: PapelTexto;
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
  fundo: FundoTexto;
  tarja: AcabamentoTarja;
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
  /** só no formato "livre": as medidas escolhidas à mão */
  tamanho?: { largura: number; altura: number };
  /** índice 0 = camada mais de trás */
  camadas: Camada[];
  atualizadoEm: number;
}

/** As medidas em px de um projeto — a única fonte para largura e altura. */
export const dimensoes = (p: Pick<Projeto, "formato" | "tamanho">) =>
  p.formato === "livre" && p.tamanho ? p.tamanho : FORMATOS[p.formato] ?? FORMATOS["4:5"];

/**
 * O menor lado da arte.
 *
 * Todo corpo de texto e todo tamanho de camada nascem daqui, não da largura:
 * medir pela largura fazia um título de 1920px de base virar 355px no paisagem.
 * Nos formatos verticais o menor lado continua sendo 1080, então nada muda neles.
 */
export const ladoBase = (d: { largura: number; altura: number }) =>
  Math.min(d.largura, d.altura);

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

/* ===== compatibilidade com artes já salvas ===== */

const num = (v: unknown, padrao: number) => (typeof v === "number" && isFinite(v) ? v : padrao);

/**
 * Completa uma arte gravada antes destes campos existirem.
 *
 * O IndexedDB guarda o objeto cru, então uma arte de ontem chega sem `esmaecer`,
 * `fundo` nem `tarja`. Sem isto o palco quebra na primeira leitura de campo.
 */
function normalizarCamada(bruta: Camada): Camada {
  const c = { ...bruta } as Camada & Record<string, unknown>;

  if (temImagem(c as Camada)) {
    const antigo = c.esmaecer;
    c.esmaecer =
      typeof antigo === "number"
        ? esmaecerUniforme(antigo)
        : { ...SEM_ESMAECER, ...(antigo as object | undefined) };
  }

  if (c.tipo === "texto") {
    c.fundo = { ...FUNDO_TEXTO_PADRAO, ...(c.fundo as object | undefined) };
    c.tarja = { ...TARJA_PADRAO, ...(c.tarja as object | undefined) };
  }

  return c as Camada;
}

export function normalizarProjeto(bruto: Projeto): Projeto {
  const formato = (bruto.formato in FORMATOS ? bruto.formato : "4:5") as Formato;
  const tamanho =
    formato === "livre"
      ? {
          largura: Math.round(num(bruto.tamanho?.largura, 1080)),
          altura: Math.round(num(bruto.tamanho?.altura, 1080)),
        }
      : undefined;

  return {
    ...bruto,
    formato,
    tamanho,
    camadas: (bruto.camadas ?? []).map(normalizarCamada),
  };
}
