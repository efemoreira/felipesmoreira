/**
 * Modelo de dados do Estúdio de Artes.
 *
 * Uma arte é uma pilha de camadas — índice 0 é a de trás. É o mesmo empilhamento
 * que aparece nas referências: fundo → fotos de contexto → sombreado → pessoas
 * recortadas → moldura → textos.
 */
import type { ModoTextura } from "./textura";

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

export type TipoCamada =
  | "fundo"
  | "padrao"
  | "foto"
  | "pessoa"
  | "sombreado"
  | "textura"
  | "texto"
  | "moldura"
  | "avatar";

export const ROTULO_TIPO: Record<TipoCamada, string> = {
  fundo: "Fundo",
  padrao: "Padrão geométrico",
  foto: "Foto de contexto",
  pessoa: "Pessoa",
  sombreado: "Sombreado",
  textura: "Textura",
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
  /**
   * Onde a borda vai dar.
   *
   * "transparente" abre um buraco e deixa o fundo aparecer — é o comportamento
   * de sempre. "cor" leva a borda até um tom em vez de sumir: sobre um fundo
   * escuro, é o que faz a foto morrer no preto em vez de recortar um vazio de
   * formato estranho no meio da arte.
   */
  saida: "transparente" | "cor";
  cor: string;
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
  saida: "transparente",
  cor: "#14110C",
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
 * Gradiente na própria pessoa, entrando por uma das bordas do recorte.
 *
 * É o que faz o corpo se dissolver no fundo em vez de terminar num corte reto
 * (modo "dissolver"), ganhar cor de um lado ("pintar"), ou as duas coisas ao
 * mesmo tempo ("ambos" — some *na* cor, que é o efeito de fumaça das
 * referências). Diferente da camada `sombreado`, que cobre a arte inteira: este
 * anda junto com o recorte, então vale por pessoa quando são 2 ou 3 em foco.
 */
export interface GradientePessoa {
  ativo: boolean;
  modo: "dissolver" | "pintar" | "ambos";
  /** de que borda do recorte o gradiente entra */
  direcao: "base" | "topo" | "esquerda" | "direita";
  cor: string;
  /** 0 a 1 — fração do recorte que o gradiente cobre, a partir da borda */
  extensao: number;
  /** 0 a 1 — intensidade na borda */
  forca: number;
}

export const GRADIENTE_PESSOA_PADRAO: GradientePessoa = {
  ativo: false,
  modo: "dissolver",
  direcao: "base",
  cor: "#14110C",
  extensao: 0.3,
  forca: 1,
};

/**
 * Halo atrás do recorte — a luz de contorno dourada das referências.
 *
 * O `tamanho` é engorda do contorno em px, medida no alfa: a silhueta cresce o
 * mesmo tanto em volta do corpo inteiro. A primeira versão escalava a imagem, e
 * aí o topo da cabeça ganhava muito mais halo que os ombros — era a franja
 * amarela irregular que aparecia nas artes.
 */
export interface Halo {
  ativo: boolean;
  cor: string;
  /** px de "engorda" do contorno */
  tamanho: number;
  desfoque: number;
  /** 0 a 1 — sem isto o halo sai sempre chapado e vira uma aura */
  forca: number;
}

export const HALO_PADRAO: Halo = {
  ativo: false,
  cor: "#FFCB05",
  tamanho: 10,
  desfoque: 26,
  forca: 0.7,
};

/**
 * Luz de contorno na própria pessoa — o brilho quente que corre pela borda do
 * corpo, vindo de um lado só. É o que integra o recorte ao holofote do fundo em
 * vez de deixá-lo colado por cima.
 */
export interface LuzBorda {
  ativa: boolean;
  cor: string;
  /** graus, 0 = luz vindo da direita, cresce no sentido horário */
  angulo: number;
  /** px da faixa acesa */
  espessura: number;
  /** 0 a 1 */
  forca: number;
}

/**
 * Sombra elíptica no chão, sob a pessoa — sem ela o recorte flutua.
 * É um gradiente radial achatado, então já nasce macia: não tem desfoque à parte.
 */
export interface Contato {
  ativa: boolean;
  cor: string;
  /** fração da largura da pessoa */
  largura: number;
  /** achatamento: fração da largura da elipse */
  altura: number;
  /** 0 a 1 */
  forca: number;
}

export const LUZ_BORDA_PADRAO: LuzBorda = {
  ativa: false,
  cor: "#FFCB05",
  angulo: 315,
  espessura: 6,
  forca: 0.85,
};

export const CONTATO_PADRAO: Contato = {
  ativa: false,
  cor: "#000000",
  largura: 0.8,
  altura: 0.16,
  forca: 0.6,
};

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
  luzBorda: LuzBorda;
  contato: Contato;
}

/**
 * Geometria repetida no fundo — o X gigante em ouro escuro das referências.
 *
 * É a camada que tira o fundo do "preto liso" sem competir com ninguém: fica
 * atrás de tudo, em opacidade baixa, e dá o que o olho lê como profundidade.
 */
export type FormaPadrao =
  | "chevron"
  | "raios"
  | "diagonais"
  | "grade"
  | "pontos"
  | "ondas"
  | "ziguezague"
  | "triangulos"
  | "hexagonos"
  | "xadrez"
  | "concentricos"
  | "cruzes";

export interface CamadaPadrao extends Base {
  tipo: "padrao";
  forma: FormaPadrao;
  cor: string;
  espessura: number;
  /** px entre repetições (ou tamanho do motivo, no chevron) */
  escala: number;
  /** graus */
  angulo: number;
  mistura: Mistura;
}

/**
 * Grão, riscos e desgaste por cima da arte inteira (ver textura.ts).
 * Com `ativoId` preenchido, usa um PNG da biblioteca no lugar do procedural.
 */
export interface CamadaTextura extends Base {
  tipo: "textura";
  modo: "grao" | "riscos" | "desgaste";
  /** vazio = textura procedural; preenchido = imagem da biblioteca, ladrilhada */
  ativoId: string;
  cor: string;
  /** 1 é o desenho no tamanho natural; acima disso ele engrossa */
  escala: number;
  semente: number;
  mistura: Mistura;
}

export type DirecaoSombreado =
  | "base"
  | "topo"
  | "ambos"
  | "vinheta"
  | "esquerda"
  | "direita"
  | "foco";

export interface CamadaSombreado extends Base {
  tipo: "sombreado";
  direcao: DirecaoSombreado;
  cor: string;
  /** 0 a 1 — opacidade no ponto mais fechado */
  forca: number;
  /** 0 a 1 — fração da altura coberta pelo degradê */
  extensao: number;
  /** só no "foco": onde o holofote bate, em fração da arte (0 a 1) */
  centro: { x: number; y: number };
}

export type ChaveFonte =
  | "anton"
  | "oswald"
  | "bebas"
  | "archivo"
  | "alfa"
  | "playfair"
  | "bitter"
  | "elite"
  | "gotica";
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
  /** px de canto cortado — a placa chanfrada, em vez do canto redondo do raio */
  chanfro: number;
  /** filete em volta da placa; é ele que dá o acabamento de "selo" */
  borda: { ativa: boolean; cor: string; espessura: number };
  /** graus — a tarja levemente torta das referências */
  inclinacao: number;
  /** só no modo "linha": ocupa a largura da caixa em vez de seguir o texto */
  larguraTotal: boolean;
}

/**
 * Como o glifo é pintado por dentro.
 *
 * Cor chapada é o que denuncia uma arte feita no automático: nas referências o
 * título vai de ouro claro no topo a bronze na base, e ainda leva desgaste por
 * cima. O gradiente atravessa o bloco de texto inteiro, não cada palavra.
 */
export interface PreenchimentoTexto {
  modo: "solido" | "gradiente";
  cor2: string;
  /** graus, 0 = de cima para baixo */
  angulo: number;
}

/**
 * Textura procedural presa às letras (ver textura.ts).
 *
 * Não confundir com a **camada** `textura`, que passa por cima da arte inteira:
 * esta vive dentro do bloco de texto e é recortada no glifo, então nada dela
 * encosta na foto ou na pessoa que estiver por baixo.
 *
 * `comer` tira pedaços da letra (o título gasto das referências); `cobrir` põe o
 * desenho por cima dela — grão, riscos ou manchas, na cor escolhida.
 */
export interface TexturaTexto {
  ativa: boolean;
  modo: ModoTextura;
  aplicacao: "comer" | "cobrir";
  /** vale no `cobrir`, e no `comer` é indiferente: ali só o alfa conta */
  cor: string;
  /** 0 a 1 — quanto do glifo a textura chega a apagar (ou a cobrir) */
  forca: number;
  escala: number;
  semente: number;
}

/** Brilho difuso em volta das letras — separado da sombra dura, que é de contato. */
export interface BrilhoTexto {
  ativo: boolean;
  cor: string;
  desfoque: number;
  /** 0 a 1 */
  forca: number;
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
  chanfro: 0,
  borda: { ativa: false, cor: "#FFCB05", espessura: 3 },
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

export const PREENCHIMENTO_PADRAO: PreenchimentoTexto = {
  modo: "solido",
  cor2: "#8A6A0B",
  angulo: 0,
};

export const TEXTURA_TEXTO_PADRAO: TexturaTexto = {
  ativa: false,
  modo: "desgaste",
  aplicacao: "comer",
  cor: "#14110C",
  forca: 0.35,
  escala: 1,
  semente: 7,
};

export const BRILHO_PADRAO: BrilhoTexto = {
  ativo: false,
  cor: "#FFCB05",
  desfoque: 34,
  forca: 0.5,
};

/** Acabamento do trecho `^assim^` — a palavra pequena dentro do título. */
export const MENOR_PADRAO = { cor: "#F6F5EF", escala: 0.42 };

export interface CamadaTexto extends Base {
  tipo: "texto";
  /** ausente nos projetos criados antes do assistente */
  papel?: PapelTexto;
  /** aceita *destaque*, ==tarja==, ^menor^, :icone: e o filete | */
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
  preenchimento: PreenchimentoTexto;
  textura: TexturaTexto;
  brilho: BrilhoTexto;
  /** o trecho `^assim^`: corpo reduzido e cor própria, dentro da mesma frase */
  menor: { cor: string; escala: number };
}

export interface CamadaMoldura extends Base {
  tipo: "moldura";
  cor: string;
  espessura: number;
  recuo: number;
  dupla: boolean;
  raio: number;
  /** px de canto cortado — a moldura de quinas chanfradas das referências */
  chanfro: number;
}

export interface CamadaAvatar extends Base, ComImagem {
  tipo: "avatar";
  ajustes: Ajustes;
  anel: { ativo: boolean; cor: string; espessura: number };
  sombra: Sombra;
}

export type Camada =
  | CamadaFundo
  | CamadaPadrao
  | CamadaFoto
  | CamadaPessoa
  | CamadaSombreado
  | CamadaTextura
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
    c.fundo = {
      ...FUNDO_TEXTO_PADRAO,
      ...(c.fundo as object | undefined),
      borda: {
        ...FUNDO_TEXTO_PADRAO.borda,
        ...((c.fundo as FundoTexto | undefined)?.borda as object | undefined),
      },
    };
    c.tarja = { ...TARJA_PADRAO, ...(c.tarja as object | undefined) };
    c.preenchimento = { ...PREENCHIMENTO_PADRAO, ...(c.preenchimento as object | undefined) };
    c.textura = { ...TEXTURA_TEXTO_PADRAO, ...(c.textura as object | undefined) };
    c.brilho = { ...BRILHO_PADRAO, ...(c.brilho as object | undefined) };
    c.menor = { ...MENOR_PADRAO, ...(c.menor as object | undefined) };
  }

  if (c.tipo === "pessoa") {
    c.gradiente = { ...GRADIENTE_PESSOA_PADRAO, ...(c.gradiente as object | undefined) };
    c.halo = { ...HALO_PADRAO, ...(c.halo as object | undefined) };
    c.luzBorda = { ...LUZ_BORDA_PADRAO, ...(c.luzBorda as object | undefined) };
    c.contato = { ...CONTATO_PADRAO, ...(c.contato as object | undefined) };
  }

  if (c.tipo === "sombreado") {
    c.centro = { x: 0.5, y: 0.5, ...(c.centro as object | undefined) };
  }

  if (c.tipo === "moldura") c.chanfro = num(c.chanfro, 0);

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
