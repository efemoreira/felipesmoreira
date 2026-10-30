import grupoA from "./grupo-a.json";
import grupoB from "./grupo-b.json";
import grupoC from "./grupo-c.json";
import type { Biografia } from "../tipos";

export const BIOGRAFIAS = [...grupoA, ...grupoB, ...grupoC] as Biografia[];
export function fontesBiografia(biografia: Biografia) {
  return [...biografia.introduction.sources, ...biografia.trajectory.flatMap(t => t.sources), ...biografia.facts.flatMap(f => f.sources)];
}
