/**
 * Guarda local do estúdio (IndexedDB) — nada sobe para o servidor.
 *
 * Dois depósitos: `projetos` (as artes em edição) e `ativos` (a biblioteca de
 * recortes e fundos já usados, guardados como Blob para reaproveitar sem subir
 * a mesma foto de novo).
 */
import type { Ativo, Projeto } from "./tipos";

const BANCO = "estudio-artes";
const VERSAO = 1;
const PROJETOS = "projetos";
const ATIVOS = "ativos";

let conexao: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  if (conexao) return conexao;

  conexao = new Promise((resolve, reject) => {
    const req = indexedDB.open(BANCO, VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJETOS)) db.createObjectStore(PROJETOS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(ATIVOS)) db.createObjectStore(ATIVOS, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return conexao;
}

function transacionar<T>(
  deposito: string,
  modo: IDBTransactionMode,
  acao: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(deposito, modo);
        const req = acao(tx.objectStore(deposito));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/* ===== projetos ===== */

export const salvarProjeto = (p: Projeto) =>
  transacionar(PROJETOS, "readwrite", (s) => s.put(p)).then(() => undefined);

export const lerProjeto = (id: string) =>
  transacionar<Projeto | undefined>(PROJETOS, "readonly", (s) => s.get(id));

export const apagarProjeto = (id: string) =>
  transacionar(PROJETOS, "readwrite", (s) => s.delete(id)).then(() => undefined);

export const listarProjetos = () =>
  transacionar<Projeto[]>(PROJETOS, "readonly", (s) => s.getAll()).then((lista) =>
    lista.sort((a, b) => b.atualizadoEm - a.atualizadoEm),
  );

/* ===== biblioteca ===== */

export const salvarAtivo = (a: Ativo) =>
  transacionar(ATIVOS, "readwrite", (s) => s.put(a)).then(() => undefined);

export const lerAtivo = (id: string) =>
  transacionar<Ativo | undefined>(ATIVOS, "readonly", (s) => s.get(id));

export const listarAtivos = () =>
  transacionar<Ativo[]>(ATIVOS, "readonly", (s) => s.getAll()).then((lista) =>
    lista.sort((a, b) => b.criadoEm - a.criadoEm),
  );

export const apagarAtivo = (id: string) =>
  transacionar(ATIVOS, "readwrite", (s) => s.delete(id)).then(() => undefined);

/* ===== URLs dos ativos =====
   Um object URL por ativo, reaproveitado por todas as camadas que o usam. */
const urls = new Map<string, string>();

export async function urlDoAtivo(id: string): Promise<string | null> {
  const guardada = urls.get(id);
  if (guardada) return guardada;

  const ativo = await lerAtivo(id);
  if (!ativo) return null;

  const url = URL.createObjectURL(ativo.blob);
  urls.set(id, url);
  return url;
}

export function esquecerAtivo(id: string) {
  const url = urls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(id);
  }
}

/** Lê o arquivo, confere que é imagem mesmo e devolve o ativo pronto. */
export function prepararAtivo(
  arquivo: File,
  familia: Ativo["familia"],
  id: string,
): Promise<Ativo> {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith("image/")) {
      reject(new Error("Só aceito imagem (PNG, JPG ou WEBP)."));
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        id,
        nome: arquivo.name.replace(/\.[^.]+$/, "").slice(0, 60) || "sem nome",
        familia,
        blob: arquivo,
        largura: img.naturalWidth,
        altura: img.naturalHeight,
        criadoEm: Date.now(),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui abrir essa imagem."));
    };
    img.src = url;
  });
}
