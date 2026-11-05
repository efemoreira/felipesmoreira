import type { AcervoAcao, DocumentoAcao, TarefaAcao } from "@/lib/api/acao";

export const normalizarBusca = (texto: string): string => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export interface SecaoDocumento { titulo: string; linha: number; nivel: number }

export function secoesDoDocumento(conteudo: string): SecaoDocumento[] {
  const secoes: SecaoDocumento[] = [];
  let cerca = "";
  let tamanho = 0;
  for (const [indice, linha] of conteudo.split("\n").entries()) {
    const marco = linha.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (marco) {
      if (!cerca) { cerca = marco[1][0]; tamanho = marco[1].length; }
      else if (marco[1][0] === cerca && marco[1].length >= tamanho && !marco[2].trim()) cerca = "";
      continue;
    }
    const titulo = !cerca && linha.match(/^(#{1,3})\s+(.+?)\s*#*$/);
    if (titulo) secoes.push({ titulo: titulo[2].replace(/[*`]/g, ""), linha: indice + 1, nivel: titulo[1].length });
  }
  return secoes;
}

export function tarefaConcluida(tarefa: TarefaAcao, progresso: Record<string, boolean>): boolean {
  return progresso[tarefa.id] ?? tarefa.concluida;
}

/** Upload de Markdown preserva os demais documentos e as identidades existentes. */
export async function pacoteDosArquivos(arquivos: File[], acervo: AcervoAcao): Promise<Blob> {
  const json = arquivos.filter((arquivo) => arquivo.name.toLowerCase().endsWith(".json"));
  if (json.length) {
    if (arquivos.length !== 1) throw new Error("Escolha um pacote sozinho ou selecione seus arquivos Markdown.");
    return json[0];
  }
  const documentos = [...acervo.documentos];
  for (const arquivo of arquivos) {
    if (!arquivo.name.toLowerCase().endsWith(".md")) throw new Error("Escolha arquivos Markdown (.md) ou um pacote de Ação (.json).");
    const conteudo = (await arquivo.text()).replace(/\r\n?/g, "\n");
    const existente = documentos.find((doc) => doc.arquivo.normalize("NFC") === arquivo.name.normalize("NFC"));
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(arquivo.name.normalize("NFC")));
    const id = existente?.id ?? "doc-" + Array.from(new Uint8Array(hash)).map((n) => n.toString(16).padStart(2, "0")).join("").slice(0, 16);
    const documento = {
      id, arquivo: arquivo.name, conteudo,
      titulo: conteudo.match(/^#\s+(.+)$/m)?.[1] ?? arquivo.name.replace(/\.md$/i, ""),
      categoria: existente?.categoria ?? "Planejamento", resumo: existente?.resumo ?? "",
    };
    const indice = documentos.findIndex((doc) => doc.id === id);
    const completo: DocumentoAcao = { ...documento, tarefas: [] };
    if (indice >= 0) documentos[indice] = completo;
    else documentos.push(completo);
  }
  return new Blob([JSON.stringify({ versao: 1, documentos, diretorio: acervo.diretorio })], { type: "application/json" });
}
