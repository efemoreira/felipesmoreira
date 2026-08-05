"use client";

/** Palco → PNG. A largura de saída é sempre a do projeto, independente do zoom. */
import type Konva from "konva";
import { fontesProntas } from "@/lib/fontes";

/** Desenha o palco no tamanho real do projeto e devolve o PNG. */
async function gerarBlob(
  palco: Konva.Stage,
  largura: number,
  altura: number,
  escala: number,
): Promise<Blob> {
  await fontesProntas();

  // desenha no tamanho real do projeto em vez de multiplicar o zoom de tela:
  // derivar do zoom deixava o PNG um pixel curto por causa do arredondamento
  const zoom = palco.scaleX();
  const larguraTela = palco.width();
  const alturaTela = palco.height();

  palco.scale({ x: 1, y: 1 });
  palco.size({ width: largura, height: altura });
  palco.draw();

  const url = palco.toDataURL({ mimeType: "image/png", pixelRatio: escala });

  palco.scale({ x: zoom, y: zoom });
  palco.size({ width: larguraTela, height: alturaTela });
  palco.draw();

  return (await fetch(url)).blob();
}

export async function exportarPng(
  palco: Konva.Stage,
  largura: number,
  altura: number,
  escala: number,
  nome: string,
): Promise<void> {
  const blob = await gerarBlob(palco, largura, altura, escala);
  const objeto = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objeto;
  link.download = nomeArquivo(nome, escala);
  document.body.appendChild(link);
  link.click();
  link.remove();

  // o navegador ainda precisa do blob durante o download
  setTimeout(() => URL.revokeObjectURL(objeto), 10_000);
}

/**
 * Copia a arte para a área de transferência.
 *
 * É o caminho curto do dia a dia: colar direto na conversa do WhatsApp ou no
 * Instagram web, sem passar pela pasta de downloads.
 */
export async function copiarPng(
  palco: Konva.Stage,
  largura: number,
  altura: number,
  escala: number,
): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Este navegador não deixa copiar imagem — use o Baixar PNG.");
  }
  const blob = await gerarBlob(palco, largura, altura, escala);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export function nomeArquivo(nome: string, escala: number): string {
  const limpo =
    nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "arte";

  const hoje = new Date();
  const data = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("");

  return `${limpo}-${data}${escala > 1 ? `-${escala}x` : ""}.png`;
}
