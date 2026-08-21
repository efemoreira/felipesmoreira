/**
 * Ponte entre o painel (PHP, na hospedagem) e a página.
 *
 * O arquivo abaixo NÃO faz parte do repositório: quem cria e atualiza é o painel
 * em /painel. Por isso ele fica fora da pasta do build — um novo deploy pelo
 * hPanel nunca sobrescreve o que foi editado pelo site.
 */
import type { Agenda, CorCartao, ItemAgenda } from "./tipos";

export const CAMINHO_AGENDA_AO_VIVO = "/dados/agenda.json";

const CORES: CorCartao[] = ["ouro", "milho", "azul", "escuro", "papel"];

const texto = (v: unknown, max = 300): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/**
 * Aceita só o que a página sabe desenhar. Conteúdo vindo do painel é confiável,
 * mas um arquivo truncado ou meio salvo não pode derrubar a página.
 */
export function normalizarAgenda(bruto: unknown): Agenda | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;

  const lista = Array.isArray(o.programacao) ? o.programacao : null;
  if (!lista) return null;

  const programacao: ItemAgenda[] = lista
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
    .map((i, indice) => {
      const cor = texto(i.cor) as CorCartao;
      return {
        id: texto(i.id) || `item-${indice}`,
        titulo: texto(i.titulo, 120),
        subtitulo: texto(i.subtitulo, 160) || undefined,
        // só entra se o navegador conseguir ler como instante
        inicio: (() => {
          const v = texto(i.inicio, 30);
          return v && !Number.isNaN(Date.parse(v)) ? v : undefined;
        })(),
        dia: texto(i.dia, 20),
        data: texto(i.data, 20),
        hora: texto(i.hora, 20),
        aoVivo: i.aoVivo === true,
        etiqueta: texto(i.etiqueta, 20) || undefined,
        cor: CORES.includes(cor) ? cor : "ouro",
        plataforma: texto(i.plataforma, 20) || undefined,
        imagem: caminhoSeguro(texto(i.imagem, 300)),
        link: caminhoSeguro(texto(i.link, 300)),
        interno: i.interno === true,
      };
    })
    .filter((i) => i.titulo && i.dia);

  const titulo = texto(o.titulo, 60) || "Agenda da Semana";

  return {
    titulo,
    periodo: texto(o.periodo, 60) || undefined,
    chamada: texto(o.chamada, 200) || undefined,
    disponivelEm: Array.isArray(o.disponivelEm)
      ? o.disponivelEm
          .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
          .map((c) => ({
            nome: texto(c.nome, 40),
            icone: texto(c.icone, 20),
            url: caminhoSeguro(texto(c.url, 300)) ?? "",
          }))
          .filter((c) => c.nome && c.url)
      : undefined,
    programacao,
  };
}

/** Barra javascript:, data: e afins — o link vai parar num href. */
function caminhoSeguro(valor: string): string | undefined {
  if (!valor) return undefined;
  if (/^(https?:)?\/\//i.test(valor) || valor.startsWith("/")) return valor;
  if (/^mailto:|^tel:/i.test(valor)) return valor;
  return undefined;
}
