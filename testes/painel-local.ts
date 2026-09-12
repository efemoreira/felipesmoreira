import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `npm run painel:local` — o painel rodando na sua máquina, sobre `public/`.
 *
 * Serve o diretório de verdade, não uma cópia: editar um `.php` e recarregar
 * é o ciclo. Os dados ficam em `public/dados/` (fora do git). Sem conta ainda,
 * `/painel/` oferece criar o primeiro administrador — é o mesmo caminho da
 * produção.
 *
 * Antes de subir, refaz as três cópias que o `publish.yml` faz no deploy:
 * sem `funcoes.json` e `municipios-ce.json` ao lado do painel, a validação de
 * cidade e de função degrada em silêncio (e a cópia local costumava ficar
 * velha — estava com 12 funções quando o catálogo tinha 17).
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(RAIZ, "public");
const PORTA = process.env.PORTA ?? "8081";

for (const [de, para] of [
  ["src/data/funcoes.json", "public/funcoes.json"],
  ["src/data/municipios-ce.json", "public/municipios-ce.json"],
  ["src/data/programacao.json", "public/dados-semente.json"],
]) {
  copyFileSync(path.join(RAIZ, de), path.join(RAIZ, para));
}
mkdirSync(path.join(PUBLIC, "dados"), { recursive: true });

const temConta = existsSync(path.join(PUBLIC, "dados", "pessoas.php"));

console.log(`
  Painel local: http://127.0.0.1:${PORTA}/painel/
  Site (se rodar \`npm run dev\` ao lado): http://localhost:3000
  Dados: public/dados/  (fora do git; apague a pasta para recomeçar)
  ${temConta ? "Já existe conta — entre com a sua." : "Sem conta ainda: a primeira tela cria o administrador."}
  Ctrl-C para parar.
`);

const servidor = spawn(
  "php",
  ["-d", "display_errors=1", "-d", "error_reporting=E_ALL", "-S", `127.0.0.1:${PORTA}`, "-t", PUBLIC, path.join(RAIZ, "testes/roteador-local.php")],
  { stdio: "inherit" },
);
process.on("SIGINT", () => servidor.kill());
process.on("SIGTERM", () => servidor.kill());
servidor.on("exit", (codigo) => process.exit(codigo ?? 0));
