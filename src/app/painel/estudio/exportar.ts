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

/* As palavras que não ajudam a achar o arquivo depois. Mesma lista do
   apelido() em public/painel/producao-comum.php. */
const SEM_SERVENTIA = ["de", "da", "do", "das", "dos", "e", "a", "o", "em", "no", "na", "para"];

/**
 * O assunto, do jeito que o Acervo indexa: minúsculas, sem acento, no máximo
 * quatro palavras que digam alguma coisa.
 *
 * Porte fiel do apelido() do PHP — os dois lados precisam gerar o MESMO nome
 * para o mesmo título, senão o card da Produção e o PNG do Estúdio chegam ao
 * Acervo com nomes diferentes para a mesma peça.
 */
export function apelido(texto: string, palavras = 4): string {
  /* normalize("NFD") e não iconv/TRANSLIT: o CLAUDE.md registra que o TRANSLIT
     depende da libc e devolve "ha" no Linux da Hostinger e "h" no macOS. O NFD
     do JavaScript é definido pelo Unicode e dá o mesmo resultado em todo lugar. */
  const ascii = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase();

  const partes = ascii
    .split(" ")
    .filter((p) => p !== "" && !SEM_SERVENTIA.includes(p))
    .slice(0, palavras);

  return partes.join("-") || "sem-assunto";
}

/**
 * O nome padrão do manual: AAAA-MM-DD_tipo_assunto.
 *
 * O tipo é sempre `card` — o Estúdio faz arte. É o mesmo formato que a Produção
 * gera em nome_de_arquivo() (producao-comum.php), para o Acervo receber os dois
 * lados no mesmo padrão e ninguém renomear nada à mão.
 *
 * A escala 2× fica como sufixo do assunto: o manual não fala de escala, e assim
 * ela não atrapalha a ordenação por data.
 */
export function nomeArquivo(nome: string, escala: number): string {
  const hoje = new Date();
  const data = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");

  return `${data}_card_${apelido(nome)}${escala > 1 ? `-${escala}x` : ""}.png`;
}
