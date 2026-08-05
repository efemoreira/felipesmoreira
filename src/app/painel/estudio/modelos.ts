/**
 * Fábricas de camada e modelos prontos.
 *
 * Os modelos vêm das referências em src/referencias: já entregam a pilha certa
 * (fundo → contexto → sombreado → pessoa → texto) com espaços reservados para
 * trocar foto e texto. É o que faz uma arte sair em minutos.
 */
import { AJUSTES_NEUTROS, FORMATOS, novoId } from "./tipos";
import type {
  Camada,
  CamadaAvatar,
  CamadaFoto,
  CamadaFundo,
  CamadaMoldura,
  CamadaPessoa,
  CamadaSombreado,
  CamadaTexto,
  Formato,
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

/* ===== fábricas ===== */

export const criarFundo = (): CamadaFundo => ({
  ...(base("fundo", "Fundo") as CamadaFundo),
  modo: "gradiente",
  cor: "#241F16",
  cor2: CORES.noite,
  angulo: 0,
});

export const criarFoto = (f: Formato, nome = "Foto de contexto"): CamadaFoto => {
  const { largura, altura } = FORMATOS[f];
  return {
    ...(base("foto", nome) as CamadaFoto),
    x: largura / 2,
    y: altura / 2.6,
    largura: Math.round(largura * 0.6),
    altura: Math.round(largura * 0.6 * 1.2),
    ativoId: "",
    espelhado: false,
    ajustes: { ...AJUSTES_NEUTROS, cinza: true, brilho: -0.32, contraste: 12 },
    mistura: "normal",
    esmaecer: 0.45,
  };
};

export const criarPessoa = (f: Formato, nome = "Pessoa"): CamadaPessoa => {
  const { largura, altura } = FORMATOS[f];
  const l = Math.round(largura * 0.74);
  const a = Math.round(l * 1.3);
  return {
    ...(base("pessoa", nome) as CamadaPessoa),
    x: largura / 2,
    y: altura - a / 2,
    largura: l,
    altura: a,
    ativoId: "",
    espelhado: false,
    ajustes: { ...AJUSTES_NEUTROS },
    tinta: { ativa: false, cor: CORES.preto, forca: 1 },
    gradiente: {
      ativo: false,
      modo: "dissolver",
      cor: CORES.noite,
      extensao: 0.3,
      forca: 1,
    },
    sombra: { ativa: false, cor: "rgba(0,0,0,.6)", x: 0, y: 0, desfoque: 40 },
    halo: { ativo: false, cor: CORES.ouro, tamanho: 10, desfoque: 26 },
  };
};

export const criarSombreado = (nome = "Sombreado"): CamadaSombreado => ({
  ...(base("sombreado", nome) as CamadaSombreado),
  direcao: "ambos",
  cor: CORES.noite,
  forca: 0.94,
  extensao: 0.5,
});

export const criarTexto = (
  f: Formato,
  papel: "titulo" | "subtitulo" | "chapeu" = "titulo",
): CamadaTexto => {
  const { largura, altura } = FORMATOS[f];
  const util = Math.round(largura * 0.9);

  // a cor de destaque nasce diferente da base, senão a marcação *assim* não
  // aparece — nas referências o título alterna ouro e branco na mesma frase
  const receitas = {
    titulo: {
      nome: "Título",
      texto: "URGENTE!",
      fonte: "anton" as const,
      tamanho: Math.round(largura * 0.185),
      cor: CORES.ouro,
      destaque: CORES.branco,
      y: altura * 0.78,
      entrelinha: 0.92,
    },
    subtitulo: {
      nome: "Subtítulo",
      texto: "Explique o fato em *poucas palavras*\ne feche com ==a informação chave==",
      fonte: "oswald" as const,
      tamanho: Math.round(largura * 0.058),
      cor: CORES.branco,
      destaque: CORES.ouro,
      y: altura * 0.92,
      entrelinha: 1.14,
    },
    chapeu: {
      nome: "Chapéu",
      texto: "ERA TUDO UMA FARSA?",
      fonte: "oswald" as const,
      tamanho: Math.round(largura * 0.038),
      cor: "rgba(255,255,255,.72)",
      destaque: CORES.ouro,
      y: altura * 0.68,
      entrelinha: 1.2,
    },
  };
  const r = receitas[papel];

  return {
    ...(base("texto", r.nome) as CamadaTexto),
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
  };
};

export const criarMoldura = (): CamadaMoldura => ({
  ...(base("moldura", "Moldura") as CamadaMoldura),
  cor: CORES.ouro,
  espessura: 8,
  recuo: 22,
  dupla: true,
  raio: 0,
});

export const criarAvatar = (f: Formato): CamadaAvatar => {
  const { largura, altura } = FORMATOS[f];
  const d = Math.round(largura * 0.22);
  return {
    ...(base("avatar", "Avatar") as CamadaAvatar),
    x: largura / 2,
    y: Math.round(altura * 0.5),
    largura: d,
    altura: d,
    ativoId: "",
    espelhado: false,
    ajustes: { ...AJUSTES_NEUTROS },
    anel: { ativo: true, cor: CORES.branco, espessura: 6 },
    sombra: { ativa: true, cor: "rgba(0,0,0,.55)", x: 0, y: 8, desfoque: 24 },
  };
};

/** Cria uma camada avulsa pelo botão "+ Camada". */
export function novaCamada(tipo: TipoCamada, f: Formato): Camada {
  switch (tipo) {
    case "fundo":
      return criarFundo();
    case "foto":
      return criarFoto(f);
    case "pessoa":
      return criarPessoa(f);
    case "sombreado":
      return criarSombreado();
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
  montar: (f: Formato) => Camada[];
}

/** Duas fotos de contexto esmaecidas nas laterais, como no "URGENTE!". */
function contextoLateral(f: Formato): CamadaFoto[] {
  const { largura, altura } = FORMATOS[f];
  const l = Math.round(largura * 0.52);
  const a = Math.round(l * 1.15);
  const y = Math.round(altura * 0.22);

  return (["Contexto esquerda", "Contexto direita"] as const).map((nome, i) => ({
    ...criarFoto(f, nome),
    x: i === 0 ? Math.round(largura * 0.2) : Math.round(largura * 0.8),
    y,
    largura: l,
    altura: a,
  }));
}

export const MODELOS: Modelo[] = [
  {
    chave: "manchete",
    nome: "Manchete",
    resumo: "Fato do dia: título gigante em ouro e contexto atrás",
    montar: (f) => {
      const { largura, altura } = FORMATOS[f];
      return [
        criarFundo(),
        ...contextoLateral(f),
        criarSombreado(),
        { ...criarPessoa(f, "Pessoa em foco") },
        {
          ...criarTexto(f, "titulo"),
          texto: "URGENTE!",
          y: Math.round(altura * 0.75),
          tamanho: Math.round(largura * 0.21),
        },
        {
          ...criarTexto(f, "subtitulo"),
          texto: "Resuma o fato em duas linhas\ne destaque ==o ponto principal==",
          y: Math.round(altura * 0.9),
        },
      ];
    },
  },
  {
    chave: "vitoria",
    nome: "Vitória",
    resumo: "Conquista: título com palavras alternando ouro e branco",
    montar: (f) => {
      const { largura, altura } = FORMATOS[f];
      return [
        criarFundo(),
        { ...criarFoto(f, "Contexto"), x: largura / 2, y: Math.round(altura * 0.24), esmaecer: 0.55 },
        criarSombreado(),
        criarPessoa(f, "Pessoa em foco"),
        {
          ...criarTexto(f, "titulo"),
          texto: "VITÓRIA!",
          y: Math.round(altura * 0.73),
          tamanho: Math.round(largura * 0.23),
        },
        {
          ...criarTexto(f, "subtitulo"),
          texto: "Câmara *aprova projeto* que muda\na regra e ==beneficia o Ceará==",
          y: Math.round(altura * 0.9),
        },
      ];
    },
  },
  {
    chave: "oficial",
    nome: "É oficial",
    resumo: "Anúncio com moldura dourada e retrato central",
    montar: (f) => {
      const { largura, altura } = FORMATOS[f];
      return [
        criarFundo(),
        { ...criarFoto(f, "Bandeira / cenário"), x: largura / 2, y: Math.round(altura * 0.3), largura: Math.round(largura * 0.95), altura: Math.round(largura * 0.8), esmaecer: 0.35 },
        { ...criarSombreado(), forca: 0.9, extensao: 0.45 },
        { ...criarPessoa(f, "Pessoa em foco"), halo: { ativo: true, cor: CORES.ouro, tamanho: 8, desfoque: 30 } },
        criarMoldura(),
        {
          ...criarTexto(f, "titulo"),
          texto: "É OFICIAL!",
          y: Math.round(altura * 0.76),
          tamanho: Math.round(largura * 0.17),
        },
        {
          ...criarTexto(f, "subtitulo"),
          texto: "*Nome completo* foi escolhido como candidato a\nDEPUTADO FEDERAL",
          y: Math.round(altura * 0.91),
        },
      ];
    },
  },
  {
    chave: "dupla",
    nome: "Dupla",
    resumo: "Duas pessoas em foco com cópias fantasma atrás",
    montar: (f) => {
      const { largura, altura } = FORMATOS[f];
      const l = Math.round(largura * 0.62);
      const a = Math.round(l * 1.35);

      const fantasma = (nome: string, x: number): CamadaPessoa => ({
        ...criarPessoa(f, nome),
        x,
        y: Math.round(altura * 0.55),
        largura: Math.round(l * 0.8),
        altura: Math.round(a * 0.8),
        opacidade: 0.16,
        tinta: { ativa: true, cor: CORES.branco, forca: 1 },
        // a cópia nasce do fundo em vez de terminar num corte reto
        gradiente: { ativo: true, modo: "dissolver", cor: CORES.noite, extensao: 0.45, forca: 1 },
      });

      const foco = (nome: string, x: number): CamadaPessoa => ({
        ...criarPessoa(f, nome),
        x,
        y: altura - a / 2 + Math.round(a * 0.06),
        largura: l,
        altura: a,
      });

      return [
        criarFundo(),
        fantasma("Fantasma esquerda", Math.round(largura * 0.18)),
        fantasma("Fantasma direita", Math.round(largura * 0.82)),
        { ...criarSombreado(), direcao: "topo", extensao: 0.4, forca: 0.8 },
        foco("Pessoa 1", Math.round(largura * 0.36)),
        foco("Pessoa 2", Math.round(largura * 0.68)),
        {
          ...criarTexto(f, "chapeu"),
          texto: "NOME COMPLETO SERÁ",
          y: Math.round(altura * 0.07),
          alinhamento: "left",
          x: Math.round(largura * 0.5),
        },
        {
          ...criarTexto(f, "titulo"),
          texto: "MINISTRO *da reforma do estado*",
          y: Math.round(altura * 0.14),
          tamanho: Math.round(largura * 0.14),
          corDestaque: CORES.branco,
        },
      ];
    },
  },
  {
    chave: "convite",
    nome: "Convite",
    resumo: "Chamada para evento com data, hora e local em tarja",
    montar: (f) => {
      const { largura, altura } = FORMATOS[f];
      return [
        criarFundo(),
        { ...criarFoto(f, "Local / cenário"), x: largura / 2, y: Math.round(altura * 0.28), largura: Math.round(largura), altura: Math.round(largura * 0.9), esmaecer: 0.4 },
        { ...criarSombreado(), forca: 0.96, extensao: 0.58 },
        criarPessoa(f, "Pessoa em foco"),
        criarMoldura(),
        {
          ...criarTexto(f, "chapeu"),
          texto: "VOCÊ ESTÁ CONVIDADO",
          y: Math.round(altura * 0.66),
        },
        {
          ...criarTexto(f, "titulo"),
          texto: "ENCONTRO DA MISSÃO",
          y: Math.round(altura * 0.77),
          tamanho: Math.round(largura * 0.13),
        },
        {
          ...criarTexto(f, "subtitulo"),
          texto: "==SÁBADO, 12 DE ABRIL — 19H==\nRua Exemplo, 100 · Fortaleza",
          y: Math.round(altura * 0.91),
        },
      ];
    },
  },
  {
    chave: "reuniao",
    nome: "Reunião",
    resumo: "Aviso interno, sóbrio, com destaque para o horário",
    montar: (f) => {
      const { largura, altura } = FORMATOS[f];
      return [
        { ...criarFundo(), modo: "solida", cor: CORES.noite },
        { ...criarSombreado(), direcao: "vinheta", forca: 0.7, extensao: 0.5 },
        { ...criarPessoa(f, "Pessoa em foco"), opacidade: 0.9 },
        { ...criarMoldura(), dupla: false, espessura: 5 },
        {
          ...criarTexto(f, "chapeu"),
          texto: "REUNIÃO DE EQUIPE",
          y: Math.round(altura * 0.62),
        },
        {
          ...criarTexto(f, "titulo"),
          texto: "PAUTA DA SEMANA",
          y: Math.round(altura * 0.73),
          tamanho: Math.round(largura * 0.14),
        },
        {
          ...criarTexto(f, "subtitulo"),
          texto: "==QUARTA, 20H==\nLink no grupo do WhatsApp",
          y: Math.round(altura * 0.88),
        },
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
