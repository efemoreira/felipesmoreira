/**
 * O VÉU ENTRE A IMAGEM DO ENCONTRO E O TEXTO QUE VAI POR CIMA.
 *
 * A imagem do encontro é fundo desta tela, com o nome, a data e o local
 * escritos em cima. Foto clara, cheia de detalhe ou com letra dentro faz o
 * texto sumir dentro dela — e não existe escurecimento único que sirva para
 * cartaz de fundo liso e para foto de rua ao meio-dia. Então quem cadastra o
 * encontro escolhe no painel, olhando a prévia, e o que chega aqui é a chave.
 *
 * **Espelho de `FILTROS`, em `public/painel/agenda-comum.php`.** O painel
 * precisa da mesma tabela para desenhar a prévia; `testes/contrato/fontes-unicas.test.ts`
 * prende os dois lados. Chave que só existe de um lado cai no padrão.
 *
 * `veu` é o degradê que entra ENTRE a imagem e o texto: mais fraco no topo, onde
 * fica só o selo, e mais forte embaixo, onde ficam o nome e o endereço.
 * `desfoque` é o borrão na imagem — tira o detalhe fino, que é o que mais
 * atrapalha a leitura, sem apagar a foto.
 */
export interface Filtro {
  /** O degradê por cima da imagem. Vazio é sem véu nenhum. */
  veu: string;
  /** O raio do borrão na imagem, em px. Zero é foto intacta. */
  desfoque: number;
}

export const FILTROS: Record<string, Filtro> = {
  nenhum: { veu: "", desfoque: 0 },
  leve: { veu: "linear-gradient(180deg, rgba(14,12,8,.06), rgba(14,12,8,.55))", desfoque: 0 },
  medio: { veu: "linear-gradient(180deg, rgba(14,12,8,.12), rgba(14,12,8,.78))", desfoque: 0 },
  forte: { veu: "linear-gradient(180deg, rgba(14,12,8,.45), rgba(14,12,8,.92))", desfoque: 0 },
  desfoque: { veu: "linear-gradient(180deg, rgba(14,12,8,.45), rgba(14,12,8,.92))", desfoque: 4 },
};

/**
 * O padrão é `medio` — exatamente o véu que esta tela já desenhava antes de a
 * escolha existir. Encontro cadastrado antes disso não muda de aparência.
 */
export const FILTRO_PADRAO = "medio";

export function filtroDaImagem(chave?: string): Filtro {
  return FILTROS[chave ?? ""] ?? FILTROS[FILTRO_PADRAO];
}
