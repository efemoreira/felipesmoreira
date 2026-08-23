import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { montarSandbox } from "../sandbox.ts";

/**
 * Chama funções do painel PHP a partir do teste em Node.
 *
 * Um processo por LOTE, e não por caso: subir o PHP custa mais que tudo que
 * estes testes fazem juntos, e teste lento é teste que ninguém roda. Os casos
 * de um `it()` viram uma chamada só.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/**
 * O painel de mentira, montado UMA VEZ por processo de teste.
 *
 * Não é firula de isolamento: o painel grava em `../dados` relativo a si mesmo,
 * e os catálogos que ele lê (`funcoes.json`, `municipios-ce.json`) não estão
 * versionados em `public/` — quem os põe lá é o `publish.yml`, copiando de
 * `src/data`. Chamar o PHP na árvore de trabalho leria um catálogo que num
 * checkout limpo não existe, e o teste passaria em máquina de quem já rodou o
 * painel local e falharia no CI. Sem semente: o contrato só chama função pura.
 */
let painel: string | null = null;
function raizDoPainel(): string {
  if (painel === null) {
    painel = path.join(montarSandbox({ semear: false }).dir, "painel");
  }
  return painel;
}

export interface Chamada {
  fn: string;
  args: unknown[];
}

export function chamarPhp(chamadas: Chamada[]): unknown[] {
  const r = spawnSync("php", [path.join(AQUI, "ponte.php"), raizDoPainel()], {
    input: JSON.stringify(chamadas),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });

  if (r.error) {
    throw new Error(`não consegui rodar o php: ${r.error.message}`);
  }
  if (r.status !== 0) {
    throw new Error(`ponte.php saiu com ${r.status}: ${r.stderr.trim()}`);
  }

  const saida = JSON.parse(r.stdout) as ({ ok: true; valor: unknown } | { ok: false; erro: string })[];
  return saida.map((s, i) => {
    if (!s.ok) {
      throw new Error(`${chamadas[i].fn}(${JSON.stringify(chamadas[i].args)}) explodiu no PHP: ${s.erro}`);
    }
    return s.valor;
  });
}

/** Uma função PHP de um argumento, aplicada a uma lista de entradas. */
export function mapearPhp(fn: string, entradas: unknown[]): unknown[] {
  return chamarPhp(entradas.map((e) => ({ fn, args: [e] })));
}
