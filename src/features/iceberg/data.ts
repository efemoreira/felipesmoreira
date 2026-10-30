import base from "./acervo.json";
import documentarios from "./documentarios.json";
import contexto from "./contexto.json";
import imagens from "./imagens.json";
import type { Complemento, Imagem, Perfil, Pessoa, Referencia, Verbete, Video } from "./tipos";
import { nomeCanonico, slugPessoa } from "./dominio";
import { BIOGRAFIAS, fontesBiografia } from "./biografias";

export const SERIES = { pt: "Lula & PT", bolsonaro: "Bolsonaros & PL", mbl: "MBL & Missão" };
export const NATUREZAS = { contexto: "Contexto", documentado: "Registro documentado", investigacao: "Investigação", alegacao: "Alegação", teoria: "Teoria / boato" };
export const CAMADAS = ["Superfície", "Logo abaixo", "Meio", "Fundo", "Abismo", "Fossa"];
export const VERBETES: Verbete[] = [...base.items, ...documentarios.items, ...contexto.events].map(v => ({ ...v, people: [...new Set(v.people.map(nomeCanonico))] })) as Verbete[];
export const VIDEOS: Video[] = [...Object.values(base.videos).map(v => ({ ...v, author: "Arthur do Val — MamãeFalei" })), ...documentarios.videos.map(v => ({ ...v, url: `https://www.youtube.com/watch?v=${v.id}` }))] as Video[];
export const COMPLEMENTOS = base.extras as Complemento[];
export const PERFIS = contexto.profiles as Perfil[];
export const IMAGENS = imagens as Imagem[];
export const REFERENCIAS: Referencia[] = (() => {
  const indice = new Map<string, Referencia>((base.sources as Referencia[]).map(f => [f.url, { ...f, series: [...f.series] }]));
  for (const v of VERBETES) for (const fonte of v.sources) {
    const f = indice.get(fonte.url);
    if (!f) indice.set(fonte.url, { ...fonte, series: [v.series] });
    else if (!f.series.includes(v.series)) f.series.push(v.series);
  }
  for (const fonte of [...PERFIS.flatMap(p => p.sources), ...BIOGRAFIAS.flatMap(fontesBiografia), ...COMPLEMENTOS.flatMap(c => [c.source, ...(c.additionalSources ?? [])])]) {
    if (!indice.has(fonte.url)) indice.set(fonte.url, { ...fonte, series: [] });
  }
  return [...indice.values()];
})();
export const PESSOAS: Pessoa[] = (() => {
  const nomes = new Set([...VERBETES.flatMap(v => v.people), ...PERFIS.map(p => p.name), ...COMPLEMENTOS.map(c => c.person)].map(nomeCanonico));
  return [...nomes].map(nome => ({ nome, slug: slugPessoa(nome), biografia: BIOGRAFIAS.find(b => nomeCanonico(b.name) === nome), verbetes: VERBETES.filter(v => v.people.includes(nome)), perfil: PERFIS.find(p => nomeCanonico(p.name) === nome), complementos: COMPLEMENTOS.filter(c => nomeCanonico(c.person) === nome), imagem: IMAGENS.find(i => i.kind === "portrait" && i.people.map(nomeCanonico).includes(nome)) })).sort((a, b) => b.verbetes.length - a.verbetes.length || a.nome.localeCompare(b.nome, "pt-BR"));
})();
export function videoDoVerbete(v: Verbete) { return VIDEOS.find(f => f.id === (v.videoId ?? (v.series === "pt" ? "ITTR_Z8flRE" : v.series === "bolsonaro" ? "y3Bx3WgxNX0" : ""))); }
export function inicioDoVerbete(v: Verbete) { return v.videoSeconds ?? videoDoVerbete(v)?.chapters[(v.layer ?? 1) - 1]?.seconds ?? 0; }
export function imagemDoVerbete(v: Verbete) { return IMAGENS.find(i => i.kind === "event" && i.eventIds.includes(v.id)); }
