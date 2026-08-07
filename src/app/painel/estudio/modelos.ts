/**
 * Fábricas de camada e modelos prontos.
 *
 * Os modelos vêm das referências em src/referencias: já entregam a pilha certa
 * (fundo → contexto → sombreado → pessoa → texto) com espaços reservados para
 * trocar foto e texto. É o que faz uma arte sair em minutos.
 */
import {
  AJUSTES_NEUTROS,
  BRILHO_PADRAO,
  CONTATO_PADRAO,
  FORMATOS,
  FUNDO_TEXTO_PADRAO,
  HALO_PADRAO,
  LUZ_BORDA_PADRAO,
  MENOR_PADRAO,
  PREENCHIMENTO_PADRAO,
  SEM_ESMAECER,
  TARJA_PADRAO,
  TEXTURA_TEXTO_PADRAO,
  esmaecerUniforme,
  ladoBase,
  novoId,
} from "./tipos";
import type {
  Camada,
  CamadaAvatar,
  CamadaFoto,
  CamadaFundo,
  CamadaMoldura,
  CamadaPadrao,
  CamadaPessoa,
  CamadaSombreado,
  CamadaTextura,
  CamadaTexto,
  Formato,
  PapelTexto,
  Projeto,
  TipoCamada,
} from "./tipos";
import { CORES } from "./paleta";

const base = (tipo: TipoCamada, nome: string) => ({
  id: novoId(),
  tipo,
  nome,
  x: 0,
  y: 0,
  rotacao: 0,
  opacidade: 1,
  visivel: true,
  travada: false,
});

/**
 * O quadro em que a arte é montada: uma chave de formato ou medidas cruas.
 *
 * As medidas cruas existem por causa do formato "Personalizado", cujas dimensões
 * moram no projeto e não na tabela — sem isto, uma arte de 2560×1440 ganharia
 * camadas dimensionadas para o 1080×1080 da entrada de reserva.
 */
export type Quadro = Formato | { largura: number; altura: number };

/**
 * As medidas do quadro, com o menor lado à mão.
 *
 * Tudo que é tamanho (corpo de texto, altura de pessoa) nasce do menor lado, não
 * da largura: num 16:9 de 1920px de largura, medir pela largura dava um título de
 * 355px. Nos formatos verticais o menor lado continua sendo 1080, então nada muda.
 */
function medidas(f: Quadro) {
  const d = typeof f === "string" ? FORMATOS[f] ?? FORMATOS["4:5"] : f;
  return { largura: d.largura, altura: d.altura, base: ladoBase(d) };
}

/** Deitado é deitado, venha de um formato da tabela ou de um tamanho à mão. */
export function ehPaisagem(f: Quadro): boolean {
  const d = medidas(f);
  return d.largura > d.altura;
}

/* ===== fábricas ===== */

export const criarFundo = (): CamadaFundo => ({
  ...(base("fundo", "Fundo") as CamadaFundo),
  modo: "gradiente",
  cor: "#241F16",
  cor2: CORES.noite,
  angulo: 0,
});

export const criarPadrao = (f: Quadro, nome = "Padrão"): CamadaPadrao => {
  const { base: b } = medidas(f);
  return {
    ...(base("padrao", nome) as CamadaPadrao),
    forma: "chevron",
    cor: CORES.ouroEscuro,
    espessura: Math.max(2, Math.round(b * 0.012)),
    escala: Math.round(b * 0.22),
    angulo: 0,
    opacidade: 0.12,
    mistura: "normal",
  };
};

export const criarTextura = (nome = "Textura"): CamadaTextura => ({
  ...(base("textura", nome) as CamadaTextura),
  modo: "grao",
  ativoId: "",
  cor: CORES.branco,
  escala: 1,
  semente: 11,
  opacidade: 0.1,
  mistura: "overlay",
});

export const criarFoto = (f: Quadro, nome = "Foto de contexto"): CamadaFoto => {
  const { largura, altura, base: b } = medidas(f);
  return {
    ...(base("foto", nome) as CamadaFoto),
    x: largura / 2,
    y: altura / 2.6,
    largura: Math.round(b * 0.6),
    altura: Math.round(b * 0.6 * 1.2),
    ativoId: "",
    espelhado: false,
    ajustes: { ...AJUSTES_NEUTROS, cinza: true, brilho: -0.32, contraste: 12 },
    mistura: "normal",
    esmaecer: esmaecerUniforme(0.45),
  };
};

export const criarPessoa = (f: Quadro, nome = "Pessoa"): CamadaPessoa => {
  const { largura, altura, base: b } = medidas(f);
  // em paisagem a pessoa é limitada pela altura, não pela largura
  const a = ehPaisagem(f) ? Math.round(altura * 0.92) : Math.round(b * 0.74 * 1.3);
  const l = Math.round(a / 1.3);
  return {
    ...(base("pessoa", nome) as CamadaPessoa),
    x: largura / 2,
    y: altura - a / 2,
    largura: l,
    altura: a,
    ativoId: "",
    espelhado: false,
    ajustes: { ...AJUSTES_NEUTROS },
    esmaecer: { ...SEM_ESMAECER },
    tinta: { ativa: false, cor: CORES.preto, forca: 1 },
    gradiente: {
      ativo: false,
      modo: "dissolver",
      cor: CORES.noite,
      extensao: 0.3,
      forca: 1,
    },
    sombra: { ativa: false, cor: "rgba(0,0,0,.6)", x: 0, y: 0, desfoque: 40 },
    halo: { ...HALO_PADRAO },
    luzBorda: { ...LUZ_BORDA_PADRAO },
    contato: { ...CONTATO_PADRAO },
  };
};

export const criarSombreado = (nome = "Sombreado"): CamadaSombreado => ({
  ...(base("sombreado", nome) as CamadaSombreado),
  direcao: "ambos",
  cor: CORES.noite,
  forca: 0.94,
  extensao: 0.5,
  centro: { x: 0.5, y: 0.5 },
});

/** O holofote quente atrás das pessoas — sombreado que soma luz em vez de tirar. */
export const criarFoco = (nome = "Holofote"): CamadaSombreado => ({
  ...criarSombreado(nome),
  direcao: "foco",
  cor: CORES.ouro,
  forca: 0.34,
  extensao: 0.55,
  centro: { x: 0.5, y: 0.55 },
});

export const criarTexto = (
  f: Quadro,
  papel: "titulo" | "subtitulo" | "chapeu" = "titulo",
): CamadaTexto => {
  const { largura, altura, base: b } = medidas(f);
  const util = Math.round(largura * 0.9);

  // a cor de destaque nasce diferente da base, senão a marcação *assim* não
  // aparece — nas referências o título alterna ouro e branco na mesma frase
  const receitas = {
    titulo: {
      nome: "Título",
      texto: "URGENTE!",
      fonte: "anton" as const,
      tamanho: Math.round(b * 0.185),
      cor: CORES.ouro,
      destaque: CORES.branco,
      y: altura * 0.78,
      // 1.0 e não 0.92: com caixa alta acentuada (MILITÂNCIA) o circunflexo da
      // segunda linha encostava na primeira
      entrelinha: 1,
    },
    subtitulo: {
      nome: "Subtítulo",
      texto: "Explique o fato em *poucas palavras*\ne feche com ==a informação chave==",
      fonte: "oswald" as const,
      tamanho: Math.round(b * 0.058),
      cor: CORES.branco,
      destaque: CORES.ouro,
      y: altura * 0.92,
      entrelinha: 1.14,
    },
    chapeu: {
      nome: "Chapéu",
      texto: "ERA TUDO UMA FARSA?",
      fonte: "oswald" as const,
      tamanho: Math.round(b * 0.038),
      cor: "rgba(255,255,255,.72)",
      destaque: CORES.ouro,
      y: altura * 0.68,
      entrelinha: 1.2,
    },
  };
  const r = receitas[papel];

  return {
    ...(base("texto", r.nome) as CamadaTexto),
    papel,
    x: largura / 2,
    y: Math.round(r.y),
    texto: r.texto,
    fonte: r.fonte,
    tamanho: r.tamanho,
    entrelinha: r.entrelinha,
    espacamento: papel === "chapeu" ? 4 : 0,
    alinhamento: "center",
    caixaAlta: true,
    largura: util,
    cor: r.cor,
    corDestaque: r.destaque,
    corTarja: CORES.ouro,
    corTextoTarja: CORES.noite,
    contorno: { ativo: false, cor: CORES.noite, espessura: 6 },
    sombra: { ativa: true, cor: "rgba(0,0,0,.85)", x: 6, y: 7, desfoque: 0 },
    autoAjuste: true,
    fundo: { ...FUNDO_TEXTO_PADRAO, padX: Math.round(b * 0.026), padY: Math.round(b * 0.017) },
    tarja: { ...TARJA_PADRAO },
    preenchimento: { ...PREENCHIMENTO_PADRAO },
    textura: { ...TEXTURA_TEXTO_PADRAO },
    brilho: { ...BRILHO_PADRAO },
    menor: { ...MENOR_PADRAO },
  };
};

export const criarMoldura = (): CamadaMoldura => ({
  ...(base("moldura", "Moldura") as CamadaMoldura),
  cor: CORES.ouro,
  espessura: 8,
  recuo: 22,
  dupla: true,
  raio: 0,
  chanfro: 0,
});

export const criarAvatar = (f: Quadro): CamadaAvatar => {
  const { largura, altura, base: b } = medidas(f);
  const d = Math.round(b * 0.22);
  return {
    ...(base("avatar", "Avatar") as CamadaAvatar),
    x: largura / 2,
    y: Math.round(altura * 0.5),
    largura: d,
    altura: d,
    ativoId: "",
    espelhado: false,
    ajustes: { ...AJUSTES_NEUTROS },
    esmaecer: { ...SEM_ESMAECER },
    anel: { ativo: true, cor: CORES.branco, espessura: 6 },
    sombra: { ativa: true, cor: "rgba(0,0,0,.55)", x: 0, y: 8, desfoque: 24 },
  };
};

/** Cria uma camada avulsa pelo botão "+ Camada". */
export function novaCamada(tipo: TipoCamada, f: Quadro): Camada {
  switch (tipo) {
    case "fundo":
      return criarFundo();
    case "padrao":
      return criarPadrao(f);
    case "foto":
      return criarFoto(f);
    case "pessoa":
      return criarPessoa(f);
    case "sombreado":
      return criarSombreado();
    case "textura":
      return criarTextura();
    case "texto":
      return criarTexto(f, "titulo");
    case "moldura":
      return criarMoldura();
    case "avatar":
      return criarAvatar(f);
  }
}

/* ===== modelos ===== */

export interface Modelo {
  chave: string;
  nome: string;
  resumo: string;
  montar: (f: Quadro) => Camada[];
}

/**
 * Onde cada peça cai, conforme a orientação.
 *
 * No vertical a leitura é de cima para baixo: pessoa ocupando a base, texto por
 * cima dela, sombreado pesando embaixo. No paisagem não há essa altura toda —
 * a composição vira lado a lado: pessoa ancorada num terço, coluna de texto
 * alinhada à esquerda no resto, e o sombreado entra pela lateral para abrir a
 * área de leitura. Os modelos falam nestes termos em vez de frações soltas.
 */
function arranjo(f: Quadro) {
  const { largura, altura, base: b } = medidas(f);

  if (ehPaisagem(f)) {
    return {
      paisagem: true,
      largura,
      altura,
      base: b,
      focoX: Math.round(largura * 0.76),
      focoY: altura,
      textoX: Math.round(largura * 0.35),
      textoLargura: Math.round(largura * 0.56),
      alinhamento: "left" as const,
      yChapeu: Math.round(altura * 0.26),
      yTitulo: Math.round(altura * 0.45),
      ySubtitulo: Math.round(altura * 0.74),
      // degradê vindo da esquerda: é ele que dá fundo para a coluna de texto
      sombreadoTexto: { direcao: "esquerda" as const, extensao: 0.78, forca: 0.92 },
      contextoY: Math.round(altura * 0.5),
    };
  }

  return {
    paisagem: false,
    largura,
    altura,
    base: b,
    focoX: Math.round(largura / 2),
    focoY: altura,
    textoX: Math.round(largura / 2),
    textoLargura: Math.round(largura * 0.9),
    alinhamento: "center" as const,
    yChapeu: Math.round(altura * 0.66),
    yTitulo: Math.round(altura * 0.77),
    ySubtitulo: Math.round(altura * 0.91),
    sombreadoTexto: { direcao: "ambos" as const, extensao: 0.5, forca: 0.94 },
    contextoY: Math.round(altura * 0.26),
  };
}

type Arranjo = ReturnType<typeof arranjo>;

/** Um texto do modelo já encaixado na coluna certa do arranjo. */
function texto(
  f: Quadro,
  a: Arranjo,
  papel: PapelTexto,
  conteudo: string,
  extra: Partial<CamadaTexto> = {},
): CamadaTexto {
  const y = papel === "chapeu" ? a.yChapeu : papel === "titulo" ? a.yTitulo : a.ySubtitulo;
  return {
    ...criarTexto(f, papel),
    texto: conteudo,
    x: a.textoX,
    y,
    largura: a.textoLargura,
    alinhamento: a.alinhamento,
    ...extra,
  };
}

/** A pessoa em foco, ancorada onde o arranjo manda. */
function foco(f: Quadro, a: Arranjo, nome = "Pessoa em foco", extra: Partial<CamadaPessoa> = {}) {
  const p = criarPessoa(f, nome);
  return { ...p, x: a.focoX, y: a.focoY - Math.round(p.altura / 2), ...extra };
}

/** Duas fotos de contexto esmaecidas nas laterais, como no "URGENTE!". */
function contextoLateral(f: Quadro): CamadaFoto[] {
  const a = arranjo(f);
  const l = Math.round(a.base * 0.52);
  const alt = Math.round(l * 1.15);

  return (["Contexto esquerda", "Contexto direita"] as const).map((nome, i) => ({
    ...criarFoto(f, nome),
    x: i === 0 ? Math.round(a.largura * 0.2) : Math.round(a.largura * 0.8),
    y: a.contextoY,
    largura: l,
    altura: alt,
  }));
}

export const MODELOS: Modelo[] = [
  {
    chave: "manchete",
    nome: "Manchete",
    resumo: "Fato do dia: título gigante em ouro e contexto atrás",
    montar: (f) => {
      const a = arranjo(f);
      return [
        criarFundo(),
        ...contextoLateral(f),
        { ...criarSombreado(), ...a.sombreadoTexto },
        foco(f, a),
        texto(f, a, "titulo", "URGENTE!", { tamanho: Math.round(a.base * 0.21) }),
        texto(f, a, "subtitulo", "Resuma o fato em duas linhas\ne destaque ==o ponto principal=="),
      ];
    },
  },
  {
    chave: "vitoria",
    nome: "Vitória",
    resumo: "Conquista: título com palavras alternando ouro e branco",
    montar: (f) => {
      const a = arranjo(f);
      return [
        criarFundo(),
        {
          ...criarFoto(f, "Contexto"),
          x: a.paisagem ? Math.round(a.largura * 0.72) : Math.round(a.largura / 2),
          y: a.contextoY,
          esmaecer: esmaecerUniforme(0.55),
        },
        { ...criarSombreado(), ...a.sombreadoTexto },
        foco(f, a),
        texto(f, a, "titulo", "VITÓRIA!", { tamanho: Math.round(a.base * 0.23) }),
        texto(
          f,
          a,
          "subtitulo",
          "Câmara *aprova projeto* que muda\na regra e ==beneficia o Ceará==",
        ),
      ];
    },
  },
  {
    chave: "oficial",
    nome: "É oficial",
    resumo: "Anúncio com moldura dourada e retrato em destaque",
    montar: (f) => {
      const a = arranjo(f);
      return [
        criarFundo(),
        {
          ...criarFoto(f, "Bandeira / cenário"),
          x: Math.round(a.largura / 2),
          y: a.paisagem ? Math.round(a.altura / 2) : Math.round(a.altura * 0.3),
          largura: Math.round(a.largura * 0.95),
          altura: Math.round(a.paisagem ? a.altura * 0.95 : a.base * 0.8),
          esmaecer: esmaecerUniforme(0.35),
        },
        { ...criarSombreado(), ...a.sombreadoTexto, forca: 0.9 },
        foco(f, a, "Pessoa em foco", {
          halo: { ...HALO_PADRAO, ativo: true, tamanho: 8, desfoque: 30, forca: 0.55 },
        }),
        criarMoldura(),
        texto(f, a, "titulo", "É OFICIAL!", { tamanho: Math.round(a.base * 0.17) }),
        texto(
          f,
          a,
          "subtitulo",
          "*Nome completo* foi escolhido como candidato a\nDEPUTADO FEDERAL",
        ),
      ];
    },
  },
  {
    chave: "dupla",
    nome: "Dupla",
    resumo: "Duas pessoas em foco com cópias fantasma atrás",
    montar: (f) => {
      const a = arranjo(f);
      const molde = criarPessoa(f, "Pessoa");
      // lado a lado elas encolhem para as duas caberem sem se cobrirem
      const alt = Math.round(molde.altura * (a.paisagem ? 0.92 : 0.88));
      const larg = Math.round((molde.largura * alt) / molde.altura);

      const fantasma = (nome: string, x: number): CamadaPessoa => ({
        ...molde,
        id: novoId(),
        nome,
        x,
        y: Math.round(a.altura * 0.55),
        largura: Math.round(larg * 0.8),
        altura: Math.round(alt * 0.8),
        opacidade: 0.16,
        tinta: { ativa: true, cor: CORES.branco, forca: 1 },
        // a cópia nasce do fundo em vez de terminar num corte reto
        gradiente: { ativo: true, modo: "dissolver", cor: CORES.noite, extensao: 0.45, forca: 1 },
      });

      const emFoco = (nome: string, x: number): CamadaPessoa => ({
        ...molde,
        id: novoId(),
        nome,
        x,
        y: a.altura - Math.round(alt / 2) + Math.round(alt * 0.06),
        largura: larg,
        altura: alt,
      });

      /* o texto sobe para o topo: aqui quem ocupa a base são as duas pessoas */
      const yChapeu = a.paisagem ? Math.round(a.altura * 0.12) : Math.round(a.altura * 0.07);
      const yTitulo = a.paisagem ? Math.round(a.altura * 0.26) : Math.round(a.altura * 0.14);

      return [
        criarFundo(),
        fantasma("Fantasma esquerda", Math.round(a.largura * 0.18)),
        fantasma("Fantasma direita", Math.round(a.largura * 0.82)),
        { ...criarSombreado(), direcao: "topo", extensao: 0.4, forca: 0.8 },
        emFoco("Pessoa 1", Math.round(a.largura * (a.paisagem ? 0.3 : 0.36))),
        emFoco("Pessoa 2", Math.round(a.largura * (a.paisagem ? 0.7 : 0.68))),
        texto(f, a, "chapeu", "NOME COMPLETO SERÁ", { y: yChapeu, alinhamento: "left" }),
        texto(f, a, "titulo", "MINISTRO *da reforma do estado*", {
          y: yTitulo,
          tamanho: Math.round(a.base * 0.14),
          alinhamento: "left",
          corDestaque: CORES.branco,
        }),
      ];
    },
  },
  {
    chave: "convite",
    nome: "Convite",
    resumo: "Chamada para evento com data, hora e local em tarja",
    montar: (f) => {
      const a = arranjo(f);
      return [
        criarFundo(),
        {
          ...criarFoto(f, "Local / cenário"),
          x: Math.round(a.largura / 2),
          y: a.paisagem ? Math.round(a.altura / 2) : Math.round(a.altura * 0.28),
          largura: a.largura,
          altura: Math.round(a.paisagem ? a.altura : a.base * 0.9),
          esmaecer: esmaecerUniforme(0.4),
        },
        { ...criarSombreado(), ...a.sombreadoTexto, forca: 0.96 },
        foco(f, a),
        criarMoldura(),
        texto(f, a, "chapeu", "VOCÊ ESTÁ CONVIDADO"),
        texto(f, a, "titulo", "ENCONTRO DA MISSÃO", { tamanho: Math.round(a.base * 0.13) }),
        texto(f, a, "subtitulo", "==SÁBADO, 12 DE ABRIL — 19H==\nRua Exemplo, 100 · Fortaleza"),
      ];
    },
  },
  {
    chave: "capa",
    nome: "Capa / vídeo",
    resumo: "Retrato de um lado, título enorme do outro — pensado para 16:9",
    montar: (f) => {
      const a = arranjo(f);
      return [
        { ...criarFundo(), modo: "gradiente", cor: "#2A2208", cor2: CORES.noite, angulo: 25 },
        {
          ...criarFoto(f, "Cenário"),
          x: Math.round(a.largura * (a.paisagem ? 0.74 : 0.5)),
          y: a.paisagem ? Math.round(a.altura / 2) : a.contextoY,
          largura: Math.round(a.largura * (a.paisagem ? 0.55 : 1)),
          altura: Math.round(a.altura * (a.paisagem ? 1 : 0.55)),
          esmaecer: esmaecerUniforme(0.3, { cantos: 0.25 }),
        },
        { ...criarSombreado(), ...a.sombreadoTexto },
        foco(f, a, "Pessoa em foco", {
          halo: { ...HALO_PADRAO, ativo: true, tamanho: 10, desfoque: 34, forca: 0.55 },
        }),
        texto(f, a, "chapeu", "AO VIVO · MISSÃO CEARÁ"),
        texto(f, a, "titulo", "O QUE *ninguém* CONTOU", {
          tamanho: Math.round(a.base * 0.16),
          corDestaque: CORES.branco,
        }),
        texto(f, a, "subtitulo", "==HOJE, 20H==  ·  youtube.com/@moreiramissao"),
      ];
    },
  },
  {
    chave: "reuniao",
    nome: "Reunião",
    resumo: "Aviso interno, sóbrio, com destaque para o horário",
    montar: (f) => {
      const a = arranjo(f);
      return [
        { ...criarFundo(), modo: "solida", cor: CORES.noite },
        { ...criarSombreado(), direcao: "vinheta", forca: 0.7, extensao: 0.5 },
        foco(f, a, "Pessoa em foco", { opacidade: 0.9 }),
        { ...criarMoldura(), dupla: false, espessura: 5 },
        texto(f, a, "chapeu", "REUNIÃO DE EQUIPE"),
        texto(f, a, "titulo", "PAUTA DA SEMANA", { tamanho: Math.round(a.base * 0.14) }),
        texto(f, a, "subtitulo", "==QUARTA, 20H==\nLink no grupo do WhatsApp"),
      ];
    },
  },
  {
    chave: "evento",
    nome: "Evento",
    resumo: "Chamada de rua com acabamento: fundo texturizado, título gasto e placa de horário",
    montar: (f) => {
      const a = arranjo(f);
      const b = a.base;

      /* o título sobe para o topo e as pessoas ocupam a base inteira — é o
         arranjo do convite de rua, diferente do "texto por cima da pessoa" */
      const yTitulo = Math.round(a.altura * (a.paisagem ? 0.24 : 0.22));
      const yPlaca = Math.round(a.altura * (a.paisagem ? 0.72 : 0.79));
      const yEndereco = Math.round(a.altura * (a.paisagem ? 0.88 : 0.915));

      /*
       * O Evento é centrado em qualquer orientação — e é por isso que ele não
       * usa o `textoX` do arranjo. Em paisagem o arranjo joga a coluna de texto
       * para 35% da largura (pessoa de um lado, texto do outro); aqui o bloco é
       * desenhado a partir do próprio centro, então herdar aquele x fazia o
       * título nascer com a metade esquerda fora do quadro.
       */
      const cx = Math.round(a.largura / 2);
      /* dois cortes diferentes: o da moldura é um lasco na quina, o da placa
         precisa de mais para se ler como selo numa caixa bem mais baixa */
      const chanfroMoldura = Math.round(b * 0.028);
      const chanfroPlaca = Math.round(b * 0.022);

      const molde = criarPessoa(f, "Pessoa");
      const alt = Math.round(molde.altura * (a.paisagem ? 0.94 : 0.9));
      const larg = Math.round((molde.largura * alt) / molde.altura);

      /* as duas em foco recebem o mesmo acabamento: halo quente para descolar do
         fundo, luz de contorno vinda de cima e mancha de contato no chão */
      const emFoco = (nome: string, x: number): CamadaPessoa => ({
        ...molde,
        id: novoId(),
        nome,
        x,
        y: a.altura - Math.round(alt / 2),
        largura: larg,
        altura: alt,
        halo: {
          ...HALO_PADRAO,
          ativo: true,
          tamanho: Math.max(2, Math.round(b * 0.005)),
          desfoque: 16,
          forca: 0.45,
        },
        luzBorda: {
          ativa: true,
          cor: CORES.ouro,
          angulo: 300,
          espessura: Math.max(3, Math.round(b * 0.006)),
          forca: 0.7,
        },
        contato: { ativa: true, cor: CORES.preto, largura: 0.9, altura: 0.14, forca: 0.5 },
      });

      return [
        { ...criarFundo(), cor: "#2A2208", cor2: CORES.noite, angulo: 20 },
        {
          ...criarPadrao(f, "Chevron do fundo"),
          escala: Math.round(b * 0.26),
          espessura: Math.max(3, Math.round(b * 0.014)),
          opacidade: 0.1,
        },
        criarFoco(),
        emFoco("Pessoa 1", Math.round(a.largura * (a.paisagem ? 0.34 : 0.34))),
        emFoco("Pessoa 2", Math.round(a.largura * (a.paisagem ? 0.66 : 0.68))),
        { ...criarSombreado(), direcao: "ambos", extensao: 0.44, forca: 0.9 },
        { ...criarTextura("Grão"), opacidade: 0.1 },
        {
          ...criarMoldura(),
          espessura: 5,
          recuo: Math.round(b * 0.022),
          chanfro: chanfroMoldura,
        },

        texto(f, a, "titulo", "ESQUENTA ^com^ MILITÂNCIA", {
          x: cx,
          y: yTitulo,
          // em paisagem sobra largura e falta altura: o corpo cede para caber
          tamanho: Math.round(b * (a.paisagem ? 0.11 : 0.145)),
          entrelinha: 0.94,
          largura: Math.round(a.largura * 0.88),
          alinhamento: "center",
          // ouro claro no topo caindo para bronze na base, com desgaste por cima
          preenchimento: { modo: "gradiente", cor2: "#8A6A0B", angulo: 0 },
          textura: { ativa: true, forca: 0.3, escala: 0.6, semente: 19 },
          brilho: { ativo: true, cor: CORES.ouro, desfoque: Math.round(b * 0.03), forca: 0.35 },
          sombra: { ativa: true, cor: "rgba(0,0,0,.8)", x: 4, y: 8, desfoque: 6 },
        }),

        // o horário sai em ouro pelo *destaque*: é o dado que a rua precisa ler primeiro
        texto(f, a, "subtitulo", "SEXTA | *18:30*", {
          x: cx,
          y: yPlaca,
          fonte: "anton",
          tamanho: Math.round(b * (a.paisagem ? 0.07 : 0.085)),
          largura: Math.round(a.largura * 0.78),
          alinhamento: "center",
          cor: CORES.creme,
          corDestaque: CORES.ouro,
          sombra: { ativa: false, cor: "rgba(0,0,0,.8)", x: 0, y: 0, desfoque: 0 },
          fundo: {
            ...FUNDO_TEXTO_PADRAO,
            ativo: true,
            modo: "bloco",
            cor: "#0D0B07",
            opacidade: 0.82,
            padX: Math.round(b * 0.055),
            padY: Math.round(b * 0.03),
            chanfro: chanfroPlaca,
            borda: { ativa: true, cor: CORES.ouro, espessura: 3 },
          },
        }),

        {
          ...criarTexto(f, "subtitulo"),
          nome: "Endereço",
          // sem papel: o assistente não sobrescreve, fica para ajustar no inspetor
          papel: undefined,
          texto: ":pin: RUA ALCÂNTARAS, 126 - FÁTIMA\n:building: FORTALEZA - CE, 60055-350",
          x: cx,
          y: yEndereco,
          largura: Math.round(a.largura * 0.86),
          alinhamento: "center",
          tamanho: Math.round(b * (a.paisagem ? 0.034 : 0.04)),
          entrelinha: 1.7,
          cor: CORES.creme,
          sombra: { ativa: true, cor: "rgba(0,0,0,.7)", x: 0, y: 2, desfoque: 6 },
        } as CamadaTexto,
      ];
    },
  },
  {
    chave: "limpo",
    nome: "Do zero",
    resumo: "Só fundo e sombreado — para montar à mão",
    montar: () => [criarFundo(), criarSombreado()],
  },
];

export function projetoDoModelo(modelo: Modelo, formato: Formato): Projeto {
  return {
    id: novoId(),
    nome: modelo.nome,
    formato,
    camadas: modelo.montar(formato),
    atualizadoEm: Date.now(),
  };
}

/* ===== arte inicial a partir de um briefing ===== */

/** O necessário de um ativo da biblioteca para dimensionar a camada. */
export interface ImagemBriefing {
  ativoId: string;
  largura: number;
  altura: number;
}

/**
 * O que a pessoa entregou no assistente antes de a arte existir: as fotos, os
 * textos e se quer moldura. Tudo é opcional — o que faltar continua sendo o
 * espaço reservado do modelo, para preencher depois no editor.
 */
export interface Briefing {
  pessoas: ImagemBriefing[];
  fundos: ImagemBriefing[];
  chapeu: string;
  titulo: string;
  subtitulo: string;
  moldura: boolean;
}

export const BRIEFING_VAZIO: Briefing = {
  pessoas: [],
  fundos: [],
  chapeu: "",
  titulo: "",
  subtitulo: "",
  moldura: false,
};

/** Encaixa a imagem na caixa da camada sem distorcer: a maior dimensão manda. */
function encaixar(img: ImagemBriefing, caixaL: number, caixaA: number) {
  const escala = Math.min(caixaL / img.largura, caixaA / img.altura);
  return {
    largura: Math.max(1, Math.round(img.largura * escala)),
    altura: Math.max(1, Math.round(img.altura * escala)),
  };
}

/**
 * Espalha N pessoas na base da arte.
 *
 * Uma pessoa fica no centro e grande; a partir de duas, elas encolhem e se
 * distribuem em intervalos iguais — é o arranjo das referências com dupla e
 * trio, sem ninguém sobrando fora do quadro.
 *
 * Em paisagem a conta é outra: sobra largura e falta altura, então elas podem
 * ser altas sem se cobrirem. Com uma pessoa só, ela vai para o terço lateral em
 * vez do centro, liberando a coluna de texto do arranjo.
 */
function distribuirPessoas(
  f: Quadro,
  imagens: ImagemBriefing[],
  molde: CamadaPessoa,
): CamadaPessoa[] {
  const a = arranjo(f);
  const n = imagens.length;
  const uma = n === 1;

  const fracaoAltura = a.paisagem
    ? uma
      ? 0.94
      : n === 2
        ? 0.88
        : 0.8
    : uma
      ? 0.72
      : n === 2
        ? 0.64
        : 0.54;
  const caixaA = Math.round(a.altura * fracaoAltura);
  // em paisagem, uma pessoa sozinha ocupa o terço da direita, não a largura toda
  const fatia = a.paisagem && uma ? a.largura * 0.42 : a.largura / Math.max(n, 1);
  const caixaL = Math.round(fatia * (uma ? 0.86 : 1.05));

  return imagens.map((img, i) => {
    const { largura: l, altura: alt } = encaixar(img, caixaL, caixaA);
    return {
      ...molde,
      id: novoId(),
      nome: uma ? "Pessoa em foco" : `Pessoa ${i + 1}`,
      ativoId: img.ativoId,
      largura: l,
      altura: alt,
      // encostadas na base, com uma folga para o texto não nascer colado
      x: a.paisagem && uma ? a.focoX : Math.round((a.largura * (i + 1)) / (n + 1)),
      y: a.altura - Math.round(alt / 2),
      visivel: true,
    };
  });
}

/**
 * Monta a arte inicial: pega a pilha do modelo e vai trocando o que o briefing
 * preencheu. O que não veio no briefing continua como o modelo deixou.
 */
export function montarComBriefing(modelo: Modelo, f: Quadro, b: Briefing): Camada[] {
  const { largura, altura } = medidas(f);
  let camadas = modelo.montar(f);

  /* ---- pessoas ---- */
  if (b.pessoas.length > 0) {
    const doModelo = camadas.filter((c): c is CamadaPessoa => c.tipo === "pessoa");
    // o molde é a última pessoa do modelo: nos modelos com fantasma atrás, é ela
    // que carrega o acabamento de quem fica em foco
    const molde = doModelo[doModelo.length - 1] ?? criarPessoa(f);
    const novas = distribuirPessoas(f, b.pessoas, molde);
    const semPessoas = camadas.filter((c) => c.tipo !== "pessoa");

    /*
     * Elas entram logo depois do sombreado — é o empilhamento das referências
     * (fundo → contexto → sombreado → pessoas → moldura → textos). Colocar
     * antes do sombreado escureceria justamente quem está em foco, que é o erro
     * em que os modelos com cópia fantasma atrás fazem cair.
     */
    const ultimoSombreado = semPessoas.map((c) => c.tipo).lastIndexOf("sombreado");
    const antesDoTexto = semPessoas.findIndex((c) => c.tipo === "texto" || c.tipo === "moldura");
    const posicao =
      ultimoSombreado !== -1
        ? ultimoSombreado + 1
        : antesDoTexto === -1
          ? semPessoas.length
          : antesDoTexto;

    camadas = [...semPessoas.slice(0, posicao), ...novas, ...semPessoas.slice(posicao)];
  }

  /* ---- fundos e fotos de contexto ---- */
  if (b.fundos.length > 0) {
    const slots = camadas.filter((c): c is CamadaFoto => c.tipo === "foto");
    const sobrando = b.fundos.slice(slots.length);

    let usados = 0;
    camadas = camadas.flatMap((c): Camada[] => {
      if (c.tipo !== "foto") return [c];
      const img = b.fundos[usados++];
      if (!img) return []; // slot que ninguém preencheu: some, para não ficar buraco
      const { largura: l, altura: a } = encaixar(img, c.largura, c.altura);
      return [{ ...c, ativoId: img.ativoId, largura: l, altura: a }];
    });

    // fundo extra (ou modelo sem nenhum slot) entra cobrindo a arte, atrás de tudo
    if (sobrando.length > 0 || slots.length === 0) {
      const extras = slots.length === 0 ? b.fundos : sobrando;
      const cobrindo = extras.map((img, i) => {
        const caixa = encaixar(img, largura, altura);
        const escala = Math.max(largura / caixa.largura, altura / caixa.altura);
        return {
          ...criarFoto(f, extras.length === 1 ? "Fundo" : `Fundo ${i + 1}`),
          ativoId: img.ativoId,
          x: largura / 2,
          y: altura / 2,
          largura: Math.round(caixa.largura * escala),
          altura: Math.round(caixa.altura * escala),
          esmaecer: esmaecerUniforme(0.25),
        } as CamadaFoto;
      });
      const depoisDoFundo = camadas.findIndex((c) => c.tipo !== "fundo");
      const onde = depoisDoFundo === -1 ? camadas.length : depoisDoFundo;
      camadas = [...camadas.slice(0, onde), ...cobrindo, ...camadas.slice(onde)];
    }
  }

  /* ---- textos ---- */
  const escritos: PapelTexto[] = ["chapeu", "titulo", "subtitulo"];

  for (const papel of escritos) {
    const texto = b[papel].trim();
    const onde = camadas.findIndex((c) => c.tipo === "texto" && c.papel === papel);

    if (texto === "") {
      // não escreveu nada: tira o texto de exemplo em vez de publicar "URGENTE!"
      if (onde !== -1) camadas = camadas.filter((_, i) => i !== onde);
      continue;
    }
    if (onde !== -1) {
      camadas = camadas.map((c, i) => (i === onde ? { ...(c as CamadaTexto), texto } : c));
    } else {
      // o modelo não tinha esse texto, mas foi digitado: entra no lugar de sempre
      camadas = [...camadas, { ...criarTexto(f, papel), texto }];
    }
  }

  /* ---- moldura ---- */
  const temMoldura = camadas.some((c) => c.tipo === "moldura");
  if (b.moldura && !temMoldura) {
    // a moldura fica atrás dos textos e à frente do resto
    const primeiroTexto = camadas.findIndex((c) => c.tipo === "texto");
    const onde = primeiroTexto === -1 ? camadas.length : primeiroTexto;
    camadas = [...camadas.slice(0, onde), criarMoldura(), ...camadas.slice(onde)];
  } else if (!b.moldura && temMoldura) {
    camadas = camadas.filter((c) => c.tipo !== "moldura");
  }

  return camadas;
}

export function projetoDoBriefing(modelo: Modelo, formato: Formato, b: Briefing): Projeto {
  return {
    id: novoId(),
    nome: b.titulo.trim() ? b.titulo.trim().slice(0, 40) : modelo.nome,
    formato,
    camadas: montarComBriefing(modelo, formato, b),
    atualizadoEm: Date.now(),
  };
}
