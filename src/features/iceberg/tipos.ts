export type Serie = "pt" | "bolsonaro" | "mbl";
export type Natureza = "contexto" | "documentado" | "investigacao" | "alegacao" | "teoria";
export interface Fonte { title: string; url: string; publisher?: string; }
export interface Verbete {
  id: string; series: Serie; title: string; originalTitle?: string; summary: string;
  year: number | null; dateLabel: string; people: string[]; status: Natureza; outcome: string;
  layer?: number | null; documentPage?: number | null; videoSeconds?: number | null;
  videoId?: string; sources: Fonte[]; relatedIds?: string[];
}
export interface Video {
  id: string; title: string; author: string; url: string; date: string; dateLabel: string;
  duration: string; seconds?: number; pages?: number; document?: string; summary?: string;
  chapters: { seconds: number; time: string; title?: string }[];
}
export interface Complemento {
  id: string; person: string; date: string; title: string; text: string; classification: string;
  source: Fonte; additionalSources?: Fonte[];
}
export interface Perfil {
  name: string; role: string; summary: string;
  relationships: { target: string; relation: string; source: Fonte }[];
  sources: Fonte[];
}
export interface Imagem {
  id: string; src: string; alt: string; caption: string; credit: string; sourceUrl: string;
  license: string; licenseUrl: string; people: string[]; eventIds: string[];
  kind: "portrait" | "event"; date?: string; modifications?: string;
}
export interface Referencia extends Fonte { series: Serie[]; pages?: Partial<Record<Serie, number[]>>; }
export interface Pessoa { nome: string; verbetes: Verbete[]; perfil?: Perfil; complementos: Complemento[]; imagem?: Imagem; }
export interface Filtros { busca: string; serie: Serie | "todas"; natureza: Natureza | "todas"; periodo: string; camada: number | null; }
