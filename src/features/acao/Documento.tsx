"use client";
import React, { useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocumentoAcao } from "@/lib/api/acao";
import { tarefaConcluida } from "./documentos";
import styles from "./acao.module.css";

interface No {
  type: string;
  tagName?: string;
  checked?: boolean | null;
  position?: { start: { line: number } };
  children?: No[];
  data?: { hProperties?: Record<string, unknown> };
  properties?: Record<string, unknown>;
}

function percorrer(no: No, fn: (no: No) => void) {
  fn(no);
  no.children?.forEach((filho) => percorrer(filho, fn));
}

export default function Documento({ documento, progresso, salvando, alternar, abrirDocumento, documentos }: {
  documento: DocumentoAcao;
  progresso: Record<string, boolean>;
  salvando: Set<string>;
  alternar: (documento: string, tarefa: string, concluida: boolean) => void;
  abrirDocumento: (id: string) => void;
  documentos: DocumentoAcao[];
}) {
  const tarefas = useMemo(() => new Map(documento.tarefas.map((t) => [t.id, t])), [documento]);
  const remarkIdentidades = useMemo(() => () => (arvore: unknown) => {
    const porLinha = new Map(documento.tarefas.map((t) => [t.linha, t.id]));
    percorrer(arvore as No, (no) => {
      const linha = no.position?.start.line;
      if (!linha) return;
      if (no.type === "heading" || (no.type === "listItem" && typeof no.checked === "boolean" && porLinha.has(linha))) {
        no.data ??= {};
        no.data.hProperties ??= {};
        if (no.type === "heading") no.data.hProperties.id = `secao-${documento.id}-${linha}`;
        else no.data.hProperties["data-task-id"] = porLinha.get(linha);
      }
    });
  }, [documento]);
  const rehypeTarefas = useMemo(() => () => (arvore: unknown) => {
    percorrer(arvore as No, (no) => {
      const id = no.properties?.["data-task-id"];
      if (no.tagName !== "li" || typeof id !== "string") return;
      const atribuir = (filho: No): boolean => {
        if (filho.tagName === "li") return false;
        if (filho.tagName === "input") {
          filho.properties ??= {};
          filho.properties["data-task-id"] = id;
          return true;
        }
        return filho.children?.some(atribuir) ?? false;
      };
      no.children?.some(atribuir);
    });
  }, []);

  return <div className={styles.markdown}>
    <Markdown remarkPlugins={[remarkGfm, remarkIdentidades]} rehypePlugins={[rehypeTarefas]} skipHtml components={{
      input({ node, checked }) {
        const id = String(node?.properties?.["data-task-id"] ?? "");
        const tarefa = tarefas.get(id);
        return tarefa
          ? <input type="checkbox" checked={tarefaConcluida(tarefa, progresso)} disabled={salvando.has(id)} aria-label={tarefa.texto.replace(/[*`]/g, "")} onChange={(e) => alternar(documento.id, id, e.target.checked)} />
          : <input type="checkbox" checked={checked ?? false} disabled aria-label="Item do documento" />;
      },
      table({ children }) { return <div className={styles.tabela}><table>{children}</table></div>; },
      img() { return null; },
      a({ href, children }) {
        const caminho = (href ?? "").split("#")[0].split("?")[0];
        let arquivo = caminho.split("/").pop() ?? "";
        try { arquivo = decodeURIComponent(arquivo).normalize("NFC"); } catch { /* mantém o texto do link */ }
        const destino = documentos.find((d) => d.arquivo.normalize("NFC") === arquivo);
        if (destino) return <button type="button" className={styles.linkDocumento} onClick={() => abrirDocumento(destino.id)}>{children}</button>;
        return <a href={href} target={href?.startsWith("https://") ? "_blank" : undefined} rel="noopener noreferrer">{children}</a>;
      },
    }}>{documento.conteudo}</Markdown>
  </div>;
}
