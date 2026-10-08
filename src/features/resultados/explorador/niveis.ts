import { regiaoDe, type Regiao } from "@/features/resultados/regioes";

/**
 * O Explorador desce Brasil → região → estado → cidade → bairro numa tela só.
 * Aqui fica o que é conta pura (sem React, sem fetch), para o teste abrir no
 * Node: o lugar no endereço, a caixa e o centro das áreas do mapa e as faixas
 * da legenda.
 */

/* ===== Caminho e nível ===== */

export type Caminho = { regiao?: Regiao; uf?: string; cidade?: string; bairro?: string };
export type Nivel = "brasil" | "regiao" | "estado" | "cidade" | "bairro";

export const nivelDe = (c: Caminho): Nivel => (c.bairro ? "bairro" : c.cidade ? "cidade" : c.uf ? "estado" : c.regiao ? "regiao" : "brasil");

/** A região sai da UF quando ela existe — nunca as duas discordam. O exterior não tem estado por dentro. */
export function normalizar(c: Caminho): Caminho {
  if (c.uf) {
    const uf = c.uf.toLowerCase();
    const regiao = regiaoDe(uf);
    if (uf === "zz") return { regiao };
    return { regiao, uf, ...(c.cidade ? { cidade: c.cidade, ...(c.bairro ? { bairro: c.bairro } : {}) } : {}) };
  }
  return c.regiao ? { regiao: c.regiao } : {};
}

/** Um nível acima. */
export function subir(c: Caminho): Caminho {
  const n = nivelDe(c);
  if (n === "bairro") return { regiao: c.regiao, uf: c.uf, cidade: c.cidade };
  if (n === "cidade") return { regiao: c.regiao, uf: c.uf };
  if (n === "estado") return { regiao: c.regiao };
  return {};
}

/** Brasil › Nordeste › Ceará › Fortaleza: um caminho por degrau, do topo até o lugar. */
export function trilha(c: Caminho): Caminho[] {
  const out: Caminho[] = [{}];
  if (c.regiao) out.push({ regiao: c.regiao });
  if (c.uf) out.push({ regiao: c.regiao, uf: c.uf });
  if (c.cidade) out.push({ regiao: c.regiao, uf: c.uf, cidade: c.cidade });
  if (c.bairro) out.push({ ...c });
  return out;
}

/* ===== Endereço (#explorar/nordeste/ce/13897/ALDEOTA?p=renan&v=votos) ===== */

export type Opcoes = { pintar?: string; como?: "pct" | "votos" };
export type Endereco = { aba: string; caminho: Caminho; opcoes: Opcoes; uf?: string; resto: string[] };

/** As abas que viraram o Explorador: o link antigo abre o mesmo lugar. */
const ANTIGAS = ["brasil", "regiao", "estado", "municipio", "bairros"];
const CODIGOS_REGIAO: string[] = ["nordeste", "norte", "centro-oeste", "sudeste", "sul", "exterior"];

export function lerEndereco(hash: string): Endereco {
  const [corpo, busca = ""] = hash.replace(/^#/, "").split("?");
  const partes = corpo.split("/").map((p) => decodeURIComponent(p)).filter(Boolean);
  const [aba = "explorar", ...resto] = partes;
  const q = new URLSearchParams(busca);
  const opcoes: Opcoes = {};
  if (q.get("p")) opcoes.pintar = q.get("p") as string;
  if (q.get("v") === "votos" || q.get("v") === "pct") opcoes.como = q.get("v") as "pct" | "votos";
  const ehUf = (s?: string) => !!s && /^[a-z]{2}$/.test(s);

  if (aba === "explorar") {
    const [r, u, cidade, bairro] = resto;
    if (r && CODIGOS_REGIAO.includes(r) && !u) return { aba, caminho: { regiao: r as Regiao }, opcoes, resto: [] };
    if (ehUf(u)) return { aba, caminho: normalizar({ uf: u, cidade, bairro }), opcoes, uf: u, resto: [] };
    /* aceita também sem a região: #explorar/ce/13897 */
    if (ehUf(r) || r === "zz") return { aba, caminho: normalizar({ uf: r, cidade: u, bairro: cidade }), opcoes, uf: r, resto: [] };
    return { aba, caminho: {}, opcoes, resto: [] };
  }

  if (ANTIGAS.includes(aba)) {
    const [u, cidade, bairro] = resto;
    const uf = u && /^[a-z]{2}$/.test(u) ? u : undefined;
    let caminho: Caminho = {};
    if (aba === "regiao") caminho = uf ? { regiao: regiaoDe(uf) } : {};
    else if (aba === "estado" || aba === "municipio") caminho = uf ? normalizar({ uf }) : {};
    else if (aba === "bairros") caminho = uf ? normalizar({ uf, cidade, bairro }) : {};
    return { aba: "explorar", caminho, opcoes, uf, resto: [] };
  }

  const [u, ...depois] = resto;
  return u && /^[a-z]{2}$/.test(u) ? { aba, caminho: {}, opcoes, uf: u, resto: depois } : { aba, caminho: {}, opcoes, resto };
}

export function escreverEndereco(c: Caminho, opcoes: Opcoes = {}): string {
  const partes = ["explorar"];
  if (c.regiao) partes.push(c.regiao);
  if (c.uf) partes.push(c.uf);
  if (c.cidade) partes.push(c.cidade);
  if (c.bairro) partes.push(c.bairro);
  const q = new URLSearchParams();
  if (opcoes.pintar) q.set("p", opcoes.pintar);
  if (opcoes.como === "votos") q.set("v", "votos");
  const s = q.toString();
  return `#${partes.map(encodeURIComponent).join("/")}${s ? `?${s}` : ""}`;
}

/* ===== Geometria dos paths (o export só usa M, L e Z, absolutos) ===== */

export type Caixa = { x: number; y: number; largura: number; altura: number };

function aneis(d: string): [number, number][][] {
  return d
    .split(/(?=M)/)
    .map((s) => {
      const nums = s.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      const pts: [number, number][] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
      return pts;
    })
    .filter((a) => a.length > 0);
}

/** A caixa que cobre todos os paths (o zoom da região). */
export function caixaDosPaths(ds: string[]): Caixa | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const d of ds)
    for (const anel of aneis(d))
      for (const [x, y] of anel) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
  return Number.isFinite(x0) ? { x: x0, y: y0, largura: x1 - x0, altura: y1 - y0 } : null;
}

/** A caixa com folga e proporção mínima, para o zoom não colar na borda. */
export function comFolga(c: Caixa, folga = 0.06): Caixa {
  const lado = Math.max(c.largura, c.altura * 0.6);
  const alt = Math.max(c.altura, c.largura * 0.6);
  const fx = lado * folga;
  const fy = alt * folga;
  return { x: c.x - (lado - c.largura) / 2 - fx, y: c.y - (alt - c.altura) / 2 - fy, largura: lado + 2 * fx, altura: alt + 2 * fy };
}

/** Centro da área (centroide do maior anel): onde vai o círculo e o rótulo. */
export function centroDoPath(d: string): [number, number] | null {
  let melhor: { area: number; cx: number; cy: number } | null = null;
  for (const a of aneis(d)) {
    let area = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < a.length; i++) {
      const [x0, y0] = a[i];
      const [x1, y1] = a[(i + 1) % a.length];
      const f = x0 * y1 - x1 * y0;
      area += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }
    area /= 2;
    if (Math.abs(area) < 1e-9) continue;
    if (!melhor || Math.abs(area) > Math.abs(melhor.area)) melhor = { area, cx: cx / (6 * area), cy: cy / (6 * area) };
  }
  return melhor ? [melhor.cx, melhor.cy] : null;
}

/* ===== Faixas da legenda ===== */

export type Faixas = { cortes: number[]; divergente: boolean };

/**
 * Cortes por quantil: cada faixa tem mais ou menos o mesmo número de áreas, e
 * um lugar fora da curva não apaga o resto do mapa. Cortes repetidos (muito
 * zero, por exemplo) viram um só. Divergente: simétrico em volta do zero, até
 * o percentil 95 do valor absoluto.
 */
export function faixasQuantil(valores: number[], k = 5, divergente = false): Faixas {
  const v = valores.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return { cortes: [], divergente };
  if (divergente) {
    const abs = v.map(Math.abs).sort((a, b) => a - b);
    const m = abs[Math.floor((abs.length - 1) * 0.95)] || abs[abs.length - 1] || 1;
    const passo = (2 * m) / k;
    return { cortes: Array.from({ length: k - 1 }, (_, i) => -m + passo * (i + 1)), divergente };
  }
  const cortes: number[] = [];
  for (let i = 1; i < k; i++) {
    const c = v[Math.min(v.length - 1, Math.floor((v.length * i) / k))];
    if (c > v[0] && !cortes.includes(c)) cortes.push(c);
  }
  return { cortes, divergente };
}

/** Em que faixa o valor cai: 0 … cortes.length. */
export function faixaDe(x: number, f: Faixas): number {
  if (!Number.isFinite(x)) return -1;
  let i = 0;
  while (i < f.cortes.length && x >= f.cortes[i]) i++;
  return i;
}

/** Escolhe `n` tons espalhados de uma rampa (para 3 faixas não usar só os claros). */
export function tonsPara<T>(rampa: readonly T[], n: number): T[] {
  if (n <= 1) return [rampa[Math.floor(rampa.length / 2)]];
  return Array.from({ length: n }, (_, i) => rampa[Math.round((i * (rampa.length - 1)) / (n - 1))]);
}
