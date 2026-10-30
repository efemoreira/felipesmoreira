import { n, t, type Linha } from "@/features/resultados/dados";
import { num, pct } from "@/features/resultados/formato";

/**
 * A leitura de um lugar: o que passou, o que fazer e para onde vai.
 *
 * Junta o 1º turno (Renan, chapa do Missão, situação do 14), o 2º turno (quem
 * digitou 14 sabendo que anulava) e o QE estimado de vereador em 2028. Conta
 * pura, sem React, para o teste abrir no Node. Toda ação sai de uma regra com
 * número à vista — a frase do "porquê" diz qual — e a coordenação decide.
 */

export type NivelLeitura = "brasil" | "regiao" | "estado" | "cidade" | "bairro";

/** 80% do QE: o partido entra na disputa das vagas que sobram (Lei 14.211/2021). */
export const DISPUTA = 0.8;
/** Cidade com menos votos do Renan que isto não entra na régua de conversão do estado. */
export const PISO_CONVERSAO = 200;
/** Base fiel mínima para virar ação: pessoas que digitaram 14 no 2º turno. */
export const PISO_FIEIS = { cidade: 15, bairro: 10 } as const;

const razao = (a: number, b: number) => (b > 0 ? a / b : NaN);
const ok = Number.isFinite;

export function quantil(valores: number[], q: number): number {
  const v = valores.filter(ok).sort((a, b) => a - b);
  return v.length ? v[Math.floor((v.length - 1) * q)] : NaN;
}

/* ===== o 2º turno ===== */

/** Nulos com 14 no 2º turno a cada voto no 14 no 1º, no mesmo lugar, sem ajuste. */
export const fidelidadeBruta = (l: Linha | undefined) => razao(n(l, "t2_nulos14"), n(l, "t2_base14"));

/**
 * A mesma razão puxada para a do nível de cima na medida da incerteza
 * (`t2_fiel_aj`, calculada no export); estado, região e Brasil têm voto
 * bastante para a bruta.
 */
export const fidelidade = (l: Linha | undefined) => (ok(n(l, "t2_fiel_aj")) ? n(l, "t2_fiel_aj") : fidelidadeBruta(l));

/** Nulos com 14 a cada voto para Presidente no 2º turno: o tamanho da base fiel no eleitorado. */
export const baseFiel = (l: Linha | undefined) => razao(n(l, "t2_nulos14"), n(l, "t2_votos"));

/* ===== 2028 ===== */

/**
 * Régua de conversão do estado: a fração do voto do Renan que a melhor chapa
 * proporcional do Missão levou, no quartil de cima das cidades com voto
 * bastante. É o "dá para fazer": já aconteceu em 1 de cada 4 cidades.
 */
export function conversaoReferencia(cidades: Linha[]): number {
  return quantil(
    cidades.filter((c) => n(c, "missao_pres") >= PISO_CONVERSAO).map((c) => razao(n(c, "missao_melhor_prop"), n(c, "missao_pres"))),
    0.75,
  );
}

export type Cenarios = {
  /** a chapa de vereador repete a melhor chapa de deputado do Missão no lugar */
  repetir: number;
  /** converte o voto do Renan como o quartil de cima do estado */
  central: number;
  /** leva todo o voto do Renan */
  teto: number;
};

/** Em quocientes eleitorais de vereador de 2028 (estimado). Bairro: a parte dele no QE da cidade. */
export function cenarios2028(l: Linha | undefined, nivel: NivelLeitura, convRef: number): Cenarios | null {
  let repetir: number;
  let teto: number;
  if (nivel === "cidade") {
    const qe = n(l, "qe_ver_2028_est");
    if (!(qe > 0)) return null;
    repetir = razao(n(l, "missao_melhor_prop"), qe);
    teto = razao(n(l, "missao_pres"), qe);
  } else if (nivel === "bairro") {
    repetir = n(l, "missao_em_qe_ver");
    teto = n(l, "renan_em_qe_ver");
  } else return null;
  if (!ok(teto)) return null;
  if (!ok(repetir)) repetir = 0;
  const central = ok(convRef) ? Math.max(repetir, teto * convRef) : NaN;
  return { repetir, central, teto };
}

/* ===== o que fazer ===== */

export type Prioridade = 1 | 2 | 3;
export type Acao = { acao: string; prioridade: Prioridade; porque: string };
export type Contexto = {
  /** `conversaoReferencia` das cidades do estado */
  convRef: number;
  /** os lugares do mesmo nível (cidades do estado, bairros da cidade): a régua dos "maiores" */
  irmaos: Linha[];
  /** pessoas no painel neste lugar; `null`/ausente = sem acesso */
  gente?: number | null;
};

export const NOME_PRIORIDADE: Record<Prioridade, string> = { 1: "Alta", 2: "Média", 3: "Baixa" };
const qe = (x: number) => `${num(x, 2)} QE`;
const pessoas = (x: number) => `${num(x)} ${x === 1 ? "eleitor digitou" : "eleitores digitaram"} 14 no 2º turno`;

function comGente(a: Acao, gente: number | null | undefined): Acao {
  if (gente === undefined || gente === null || a.prioridade === 3) return a;
  return { ...a, porque: `${a.porque} ${gente === 0 ? "Ninguém cadastrado aqui no painel ainda." : `${num(gente)} ${gente === 1 ? "pessoa cadastrada" : "pessoas cadastradas"} aqui no painel.`}` };
}

export function acaoDe(l: Linha | undefined, nivel: NivelLeitura, ctx: Contexto): Acao | null {
  if (!l || (nivel !== "cidade" && nivel !== "bairro")) return null;
  const fieis = n(l, "t2_nulos14");
  const piso = PISO_FIEIS[nivel];
  const fieisForte = ok(fieis) && fieis >= Math.max(piso, quantil(ctx.irmaos.map((x) => n(x, "t2_nulos14")), 0.75));

  if (nivel === "cidade") {
    const c = cenarios2028(l, "cidade", ctx.convRef);
    if (c && c.repetir >= DISPUTA)
      return comGente({ acao: "Montar a chapa de vereador", prioridade: 1, porque: `Repetindo o voto que o Missão teve aqui para deputado, a chapa chega a ${qe(c.repetir)} de 2028 — passa dos 80% que põem o partido na disputa.` }, ctx.gente);
    if (c && c.central >= DISPUTA)
      return comGente({ acao: "Converter o voto do Renan", prioridade: 1, porque: `O Renan teve ${num(n(l, "missao_pres"))} votos aqui (${qe(c.teto)}). Convertendo como as cidades que mais converteram no estado, a chapa chega a ${qe(c.central)}; hoje está em ${qe(c.repetir)}.` }, ctx.gente);
    if (c && c.teto >= DISPUTA)
      return comGente({ acao: "Trabalhar a conversão", prioridade: fieisForte ? 1 : 2, porque: `Só com quase todo o voto do Renan (${qe(c.teto)}) a chapa passa de 80% do QE; hoje está em ${qe(c.repetir)}.${fieisForte ? ` ${pessoas(fieis)}: a base para o trabalho existe.` : ""}` }, ctx.gente);
    if (fieisForte)
      return comGente({ acao: "Organizar a base fiel", prioridade: 2, porque: `${pessoas(fieis)}, mesmo anulando o voto — entre as cidades com mais base fiel no estado. Vereador em 2028 não está à vista${c ? ` (teto ${qe(c.teto)})` : ""}, núcleo está.` }, ctx.gente);
    return { acao: "Acompanhar", prioridade: 3, porque: `O voto do 14 aqui não alcança vereador em 2028${c ? ` (teto ${qe(c.teto)})` : ""} e a base fiel é pequena (${num(ok(fieis) ? fieis : 0)}).` };
  }

  /* bairro: vereador é da cidade inteira; o bairro decide onde trabalhar */
  const situacao = t(l, "situacao");
  const aConverter = n(l, "a_converter");
  const muitoAConverter = ok(aConverter) && aConverter >= quantil(ctx.irmaos.map((x) => n(x, "a_converter")), 0.75);
  if (situacao === "Potencial" && muitoAConverter)
    return comGente({ acao: "Converter aqui", prioridade: 1, porque: `${num(aConverter)} votos do Renan aqui não foram para deputado do Missão — entre os 25% maiores da cidade.` }, ctx.gente);
  if (fieisForte)
    return comGente({ acao: "Abrir ou fortalecer núcleo", prioridade: situacao === "Potencial" || situacao === "Convertido" ? 1 : 2, porque: `${pessoas(fieis)} — entre os 25% de bairros com mais base fiel na cidade.` }, ctx.gente);
  if (situacao === "Convertido")
    return comGente({ acao: "Manter e formar", prioridade: 2, porque: `De cada 100 votos do Renan aqui, ${num(Math.min(100, n(l, "conversao") * 100))} foram para deputado do Missão — acima da cidade.` }, ctx.gente);
  if (situacao === "Potencial")
    return comGente({ acao: "Converter", prioridade: 2, porque: `O 14 é mais forte aqui que na cidade, mas pouco virou voto de deputado do Missão (${num(ok(aConverter) ? aConverter : 0)} votos a converter).` }, ctx.gente);
  return { acao: "Acompanhar", prioridade: 3, porque: "Abaixo da cidade no voto do 14 e sem base fiel de destaque." };
}

/** Campos derivados para pintar o mapa e encher a tabela (`_` = não vem do JSON). */
export function derivar(l: Linha, nivel: NivelLeitura, ctx: Contexto): Linha {
  const c = cenarios2028(l, nivel, ctx.convRef);
  const a = acaoDe(l, nivel, ctx);
  return {
    ...l,
    _fiel: fidelidade(l) * 100,
    _cen_repetir: c?.repetir ?? NaN,
    _cen_central: c?.central ?? NaN,
    _cen_teto: c?.teto ?? NaN,
    ...(a ? { _acao: a.acao, _prioridade: a.prioridade, _prioridade_txt: NOME_PRIORIDADE[a.prioridade] } : {}),
  };
}

/** O peso do bairro na cidade: a fatia dele no voto do Renan e na base fiel. */
export function pesoNaCidade(bairro: Linha | undefined, cidade: Linha | undefined) {
  return { renan: razao(n(bairro, "missao_pres"), n(cidade, "missao_pres")), fieis: razao(n(bairro, "t2_nulos14"), n(cidade, "t2_nulos14")) };
}

/* ===== o que passou ===== */

export type Referencia = { numero: string; nome: string; votos_1t: number; nulos_2t: number; por100: number };

/** "ESCRITOR AUGUSTO CURY" → "Cury". */
const nomeCurto = (s: string) => {
  const w = (s.split(" ").pop() ?? s).toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
};

export function passou(l: Linha | undefined, nivel: NivelLeitura, pai?: { nome: string; linha: Linha }, referencia: Referencia[] = []): string[] {
  if (!l) return [];
  const out: string[] = [];
  const renan = n(l, "missao_pres");
  const fatia = razao(renan, n(l, "validos_pres"));
  const fatiaPai = pai ? razao(n(pai.linha, "missao_pres"), n(pai.linha, "validos_pres")) : NaN;
  if (ok(fatia))
    out.push(`1º turno: o Renan teve ${pct(fatia, 2)} dos válidos (${num(renan)} votos)${ok(fatiaPai) ? `, ${fatia >= fatiaPai ? "acima" : "abaixo"} de ${pai!.nome} (${pct(fatiaPai, 2)})` : ""}.`);
  const conv = razao(n(l, "missao_df"), renan);
  if (ok(conv) && renan > 0) out.push(`De cada 100 votos do Renan, ${num(Math.min(100, conv * 100))} foram para deputado federal do Missão.`);

  const fieis = n(l, "t2_nulos14");
  if (ok(fieis)) {
    const f = fidelidade(l);
    const fPai = pai ? fidelidade(pai.linha) : NaN;
    const ajustada = ok(n(l, "t2_fiel_aj")) && Math.abs(n(l, "t2_fiel_aj") - fidelidadeBruta(l)) >= 0.005;
    let frase = `${pessoas(fieis)}, sabendo que o voto seria anulado — ${num(f * 100, 1)} a cada 100 votos do 14 no 1º turno`;
    if (ajustada) frase += ` (${num(fidelidadeBruta(l) * 100, 1)} contados; ajustado pelo pouco voto)`;
    if (ok(fPai)) frase += `; ${pai!.nome}: ${num(fPai * 100, 1)}`;
    out.push(`${frase}.`);
    const outros = referencia.filter((r) => r.numero !== "14" && r.votos_1t >= 300000);
    if (nivel === "brasil" && outros.length)
      out.push(`É a maior volta entre os eliminados com voto de verdade: ${outros.map((r) => `${nomeCurto(r.nome)} ${num(r.por100, 2)}`).join(", ")}. O 14 não é erro de digitação: é voto de identidade.`);
  }
  const gov = n(l, "t2_nulos14_gov");
  if (ok(gov) && gov > 0) out.push(`Governador no 2º turno: ${num(gov)} nulos com 14.`);
  const andou = n(l, "var_lado_pres");
  if (ok(andou)) out.push(`Desde 2022 o lugar andou ${num(Math.abs(andou) * 100, 1)} pontos para a ${andou >= 0 ? "direita" : "esquerda"}.`);
  return out;
}

/* ===== estado: o que fazer, somado ===== */

export type Prioridades = {
  porAcao: [string, number][];
  primeiras: { id: string; nome: string; acao: Acao }[];
  alcance: { repetir: number; central: number; teto: number; total: number };
};

/** As cidades de um estado lidas uma a uma: quantas por ação, as primeiras da fila e quantas chegam a 80% do QE em cada cenário. */
export function prioridadesDoEstado(cidades: Linha[], convRef: number, limite = 6): Prioridades {
  const ctx: Contexto = { convRef, irmaos: cidades };
  const lidas = cidades
    .map((c) => ({ c, a: acaoDe(c, "cidade", ctx), cen: cenarios2028(c, "cidade", convRef) }))
    .filter((x): x is { c: Linha; a: Acao; cen: Cenarios | null } => x.a !== null);
  const conta = new Map<string, number>();
  for (const x of lidas) conta.set(x.a.acao, (conta.get(x.a.acao) ?? 0) + 1);
  const alcance = { repetir: 0, central: 0, teto: 0, total: 0 };
  for (const x of lidas)
    if (x.cen) {
      alcance.total++;
      if (x.cen.repetir >= DISPUTA) alcance.repetir++;
      if (x.cen.central >= DISPUTA) alcance.central++;
      if (x.cen.teto >= DISPUTA) alcance.teto++;
    }
  const primeiras = lidas
    .filter((x) => x.a.prioridade === 1)
    .sort((a, b) => n(b.c, "missao_pres") - n(a.c, "missao_pres"))
    .slice(0, limite)
    .map((x) => ({ id: String(x.c.municipio_codigo), nome: t(x.c, "municipio_nome"), acao: x.a }));
  return { porAcao: [...conta.entries()].sort((a, b) => b[1] - a[1]), primeiras, alcance };
}
