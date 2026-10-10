import type { Pitch } from "../tipos";
import { COOPCRM } from "./coopcrm";
import { FLUUX } from "./fluux";
import { GUARDIAO_PREDIAL } from "./guardiaopredial";
import { MEU_FRETE } from "./meufrete";

/** Os pitches publicados em /pitch/<slug>. Projeto novo entra aqui e ganha a rota no build. */
export const PITCHES: Pitch[] = [GUARDIAO_PREDIAL, FLUUX, COOPCRM, MEU_FRETE];

export const pitchDe = (slug: string) => PITCHES.find((p) => p.slug === slug);
