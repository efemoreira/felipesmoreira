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
 */
function distribuirPessoas(
  f: Formato,
  imagens: ImagemBriefing[],
  molde: CamadaPessoa,
): CamadaPessoa[] {
  const { largura, altura } = FORMATOS[f];
  const n = imagens.length;
  // com mais gente, cada uma ocupa menos altura para as três caberem lado a lado
  const fracaoAltura = n === 1 ? 0.72 : n === 2 ? 0.64 : 0.54;
  const caixaA = Math.round(altura * fracaoAltura);
  const caixaL = Math.round((largura / Math.max(n, 1)) * (n === 1 ? 0.86 : 1.05));

  return imagens.map((img, i) => {
    const { largura: l, altura: a } = encaixar(img, caixaL, caixaA);
    return {
      ...molde,
      id: novoId(),
      nome: n === 1 ? "Pessoa em foco" : `Pessoa ${i + 1}`,
      ativoId: img.ativoId,
      largura: l,
      altura: a,
      // encostadas na base, com uma folga para o texto não nascer colado
      x: Math.round((largura * (i + 1)) / (n + 1)),
      y: altura - Math.round(a / 2),
      visivel: true,
    };
  });
}

/**
 * Monta a arte inicial: pega a pilha do modelo e vai trocando o que o briefing
 * preencheu. O que não veio no briefing continua como o modelo deixou.
 */
export function montarComBriefing(modelo: Modelo, f: Formato, b: Briefing): Camada[] {
  const { largura, altura } = FORMATOS[f];
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
          esmaecer: 0.25,
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
