/**
 * A colinha por cargo — lógica pura, sem rede: agrupa o que `obterChapa()`
 * trouxe e monta as linhas que a colinha imprime.
 *
 * Mora fora de `@/lib/api/candidatos` para o teste de contrato poder importá-la
 * sem arrastar o cliente HTTP.
 */
import type { Candidato } from "@/lib/api/candidatos";

/**
 * A ordem da colinha — e da página. Cargo que não está aqui (prefeito,
 * vereador, sem cargo) aparece no site, mas não entra na colinha.
 *
 * As chaves são as de `CARGOS` em `dominio.php`; `testes/contrato/candidatos.test.ts`
 * confere que continuam existindo lá.
 */
export const ORDEM_COLINHA = [
  "presidente",
  "governador",
  "senador",
  "deputado-federal",
  "deputado-estadual",
] as const;
export type CargoColinha = (typeof ORDEM_COLINHA)[number];

/** Quantos votos a urna pede para o cargo. Senado em 2026 são duas vagas. */
export const VAGAS: Record<CargoColinha, number> = {
  presidente: 1,
  governador: 1,
  senador: 2,
  "deputado-federal": 1,
  "deputado-estadual": 1,
};

/** Os que entram na colinha sem escolha — a cabeça da chapa. */
export const FIXOS: readonly CargoColinha[] = ["presidente", "governador"];

/** O título da seção. É apresentação, não a tabela de cargos — essa é do PHP. */
export const TITULO_SECAO: Record<CargoColinha, string> = {
  presidente: "Presidente",
  governador: "Governador",
  senador: "Senado",
  "deputado-federal": "Deputado federal",
  "deputado-estadual": "Deputado estadual",
};

export interface Entrada {
  /** quem encabeça; null quando só o vice está no ar */
  titular: Candidato | null;
  /** vices e suplentes que acompanham — clicáveis no site, fora da colinha */
  vices: Candidato[];
}

export interface Secao {
  chave: CargoColinha;
  entradas: Entrada[];
}

function eDaColinha(chave: string): chave is CargoColinha {
  return (ORDEM_COLINHA as readonly string[]).includes(chave);
}

/**
 * Agrupa por cargo, na ordem da colinha. Seção sem ninguém não existe.
 * O que não cabe em cargo nenhum da colinha volta em `outros`.
 */
export function porCargo(candidatos: Candidato[]): { secoes: Secao[]; outros: Candidato[] } {
  const secoes = new Map<CargoColinha, Entrada[]>();
  const outros: Candidato[] = [];
  const porTitular = new Map<string, Entrada>();

  for (const c of candidatos) {
    if (c.vice || !eDaColinha(c.secao)) continue;
    const entrada: Entrada = { titular: c, vices: [] };
    porTitular.set(c.id, entrada);
    secoes.set(c.secao, [...(secoes.get(c.secao) ?? []), entrada]);
  }

  for (const c of candidatos) {
    if (!c.vice) {
      if (!eDaColinha(c.secao)) outros.push(c);
      continue;
    }
    const dono = porTitular.get(c.titular);
    if (dono) {
      dono.vices.push(c);
    } else if (eDaColinha(c.secao)) {
      /* O titular ainda não está no ar: o vice aparece sozinho na seção dele,
         e a colinha continua sem ninguém ali. */
      secoes.set(c.secao, [...(secoes.get(c.secao) ?? []), { titular: null, vices: [c] }]);
    } else {
      outros.push(c);
    }
  }

  return {
    secoes: ORDEM_COLINHA.filter((k) => secoes.has(k)).map((chave) => ({ chave, entradas: secoes.get(chave)! })),
    outros,
  };
}

/** Os titulares de uma seção — é entre eles que o eleitor escolhe. */
export function titularesDe(s: Secao): Candidato[] {
  return s.entradas.map((e) => e.titular).filter((c): c is Candidato => c !== null);
}

/** Na colinha sem escolha: cargo fixo, ou tão poucos candidatos que todos cabem. */
export function entraDireto(s: Secao): boolean {
  return FIXOS.includes(s.chave) || titularesDe(s).length <= VAGAS[s.chave];
}

/** Uma linha da colinha: o cargo e quem vai nele (null = em branco, escreva à mão). */
export interface LinhaColinha {
  chave: CargoColinha;
  rotulo: string;
  candidato: Candidato | null;
}

/**
 * A colinha montada: na ordem fixa, só titulares, uma linha por vaga.
 * `escolhas` guarda, por cargo, os ids que o eleitor marcou.
 */
export function montarColinha(secoes: Secao[], escolhas: Partial<Record<CargoColinha, string[]>>): LinhaColinha[] {
  const linhas: LinhaColinha[] = [];
  for (const s of secoes) {
    const titulares = titularesDe(s);
    const vagas = VAGAS[s.chave];
    const escolhidos = entraDireto(s)
      ? titulares.slice(0, vagas)
      : (escolhas[s.chave] ?? [])
          .map((id) => titulares.find((c) => c.id === id))
          .filter((c): c is Candidato => c !== undefined)
          .slice(0, vagas);
    for (let i = 0; i < vagas; i++) {
      const c = escolhidos[i] ?? null;
      const base = titulares[0]?.cargo || TITULO_SECAO[s.chave];
      linhas.push({
        chave: s.chave,
        rotulo: vagas > 1 ? `${base} (${i + 1}º voto)` : base,
        candidato: c,
      });
    }
  }
  return linhas;
}
