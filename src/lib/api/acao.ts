import { apiFetch } from "./client";

export interface TarefaAcao {
  id: string;
  linha: number;
  texto: string;
  concluida: boolean;
}

export interface DocumentoAcao {
  id: string;
  titulo: string;
  categoria: string;
  resumo: string;
  arquivo: string;
  conteudo: string;
  tarefas: TarefaAcao[];
}

export interface AcervoAcao {
  autenticado: true;
  pode: true;
  nome: string;
  csrf: string;
  documentos: DocumentoAcao[];
  diretorio: Record<string, string>[];
  progresso: Record<string, boolean>;
  atualizadoEm: string;
}

export type RespostaAcao = AcervoAcao | { autenticado: boolean; pode: false };

export const obterAcao = () => apiFetch<RespostaAcao>("/acao.php");
export const verificarAcessoAcao = () => apiFetch<{ autenticado: boolean; pode: boolean }>("/acao.php?acesso=1");

export async function marcarTarefaAcao(csrf: string, documento: string, tarefa: string, concluida: boolean): Promise<void> {
  await apiFetch("/acao.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao: "marcar", csrf, documento, tarefa, concluida }),
  });
}

export function importarAcao(csrf: string, pacote: Blob): Promise<AcervoAcao> {
  const dados = new FormData();
  dados.append("csrf", csrf);
  dados.append("pacote", pacote, "acao.json");
  return apiFetch<AcervoAcao>("/acao.php", { method: "POST", body: dados });
}
