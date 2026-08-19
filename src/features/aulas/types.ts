/**
 * Scaffold da área de aulas — a listagem real de aulas entra na próxima
 * atualização. Isto só fixa o formato de "fonte de vídeo" para o embed do
 * YouTube não-listado, e o tipo de aula que vai usá-lo.
 */

export type FonteVideo = {
  provedor: "youtube";
  id: string;
};

export interface Aula {
  id: string;
  titulo: string;
  descricao?: string;
  video: FonteVideo;
}
