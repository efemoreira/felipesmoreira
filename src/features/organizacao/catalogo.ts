/**
 * Os catálogos da organização, para o site desenhar sem esperar a API.
 *
 * SÃO PAR de `public/painel/organizacao-comum.php` — `TEMAS_GRUPO`,
 * `NIVEIS_LIGA`, `NIVEIS_TERRITORIO` e `ONDAS`. O painel decide e grava; o site
 * explica. Se os dois discordarem, a página diria que o nível C pede 1.000
 * seguidores enquanto o painel cobra outra coisa, e `testes/contrato/
 * organizacao.test.ts` falha antes de isso ir ao ar.
 *
 * Vêm do "Plano Missão Ceará 2026–2027" (/plano).
 */
import type { IconName } from "@/components/icons";

export interface Tema {
  chave: string;
  nome: string;
  icone: IconName;
  estudo: string;
  profissionais: string;
  movimento: string;
}

/** Um tema, um grupo — na ordem do catálogo do painel. */
export const TEMAS: Tema[] = [
  { chave: "seguranca", nome: "Segurança pública", icone: "flag", estudo: "Violência, crime organizado, juventude e território", profissionais: "Policiais, guardas municipais, advogados, agentes comunitários", movimento: "Escutas \"bairro seguro\", audiências públicas" },
  { chave: "educacao", nome: "Educação e juventude", icone: "book", estudo: "Escola, universidade, primeiro emprego, formação profissional", profissionais: "Professores, estudantes, gestores escolares", movimento: "Debates em universidades, reforço comunitário" },
  { chave: "saude", nome: "Saúde e esporte", icone: "heartHandshake", estudo: "Acesso a serviços, prevenção, esporte e lazer", profissionais: "Médicos, enfermeiros, educadores físicos, atletas", movimento: "Corridas comunitárias, ações de orientação" },
  { chave: "economia", nome: "Economia e empreendedorismo", icone: "bolt", estudo: "Emprego, pequenos negócios, comércio, agro", profissionais: "Empresários, comerciantes, autônomos, produtores", movimento: "Feiras, encontros com empreendedores" },
  { chave: "cidades", nome: "Cidades e infraestrutura", icone: "building", estudo: "Mobilidade, habitação, saneamento, espaços públicos", profissionais: "Arquitetos, engenheiros, urbanistas", movimento: "Caminhadas urbanas, mapa de problemas" },
  { chave: "instituicoes", nome: "Instituições e direito", icone: "search", estudo: "Transparência, orçamento público, serviços, leis", profissionais: "Advogados, servidores, contadores", movimento: "Fiscalização cidadã, guia de direitos" },
  { chave: "mulheres", nome: "Mulheres e família", icone: "users", estudo: "Participação, segurança, autonomia, conciliação de rotinas", profissionais: "Profissionais de todas as áreas", movimento: "Rodas de conversa, redes de apoio" },
  { chave: "tecnologia", nome: "Tecnologia e inovação", icone: "dispositivo", estudo: "Governo digital, dados, IA, startups", profissionais: "Desenvolvedores, pesquisadores, empreendedores de tecnologia", movimento: "Oficinas, protótipos, hackathons" },
  { chave: "sertao", nome: "Água, sertão e meio ambiente", icone: "leaf", estudo: "Convivência com o semiárido, recursos hídricos, clima", profissionais: "Agrônomos, produtores rurais, técnicos ambientais", movimento: "Diagnósticos no interior, campanhas educativas" },
];

export const temaPorChave = (chave: string): Tema | undefined => TEMAS.find((t) => t.chave === chave);

export interface NivelLiga {
  nivel: "E" | "D" | "C" | "B" | "A";
  nome: string;
  /** o piso de seguidores somados para ESTAR no nível */
  seguidores: number;
  /** o piso de engajamento, em % */
  engajamento: number;
  /** a ação que leva a este nível */
  exige: string;
}

/** De baixo para cima, como no painel. */
export const NIVEIS_LIGA: NivelLiga[] = [
  { nivel: "E", nome: "Base", seguidores: 0, engajamento: 0, exige: "Estar na Liga" },
  { nivel: "D", nome: "Constância", seguidores: 0, engajamento: 0, exige: "Estruturar Instagram, TikTok, YouTube e X" },
  { nivel: "C", nome: "Formação", seguidores: 1000, engajamento: 3, exige: "8 semanas seguidas com 3 vídeos e 2 meses seguidos crescendo" },
  { nivel: "B", nome: "Território", seguidores: 3000, engajamento: 2.5, exige: "Concluir a formação de militância" },
  { nivel: "A", nome: "Porta-voz de peso", seguidores: 10000, engajamento: 2, exige: "Liderar uma ação local (20+ pessoas, registrada)" },
];

export const NIVEIS_TERRITORIO: Record<string, string> = {
  T0: "Localidade mapeada",
  T1: "Articulação em formação",
  T2: "Núcleo ativo",
  T3: "Organização consolidada",
  T4: "Polo multiplicador",
};

export const ONDAS: Record<number, string> = {
  1: "Onda 1 · âncoras convertidas",
  2: "Onda 2 · cidades potencial",
  3: "Onda 3 · bases de candidato",
  0: "Mapear (T0)",
};

/** A escada de engajamento — par de `DEGRAUS` em escada-comum.php. */
export const DEGRAUS = [
  { nome: "Interessado", resumo: "Deixou contato ou entrou num grupo." },
  { nome: "Participante", resumo: "Foi a uma atividade." },
  { nome: "Colaborador", resumo: "Concluiu uma tarefa." },
  { nome: "Responsável", resumo: "Cuida de algo recorrente, com substituto e registro." },
  { nome: "Multiplicador", resumo: "Formou outra pessoa ou ajudou a abrir um núcleo." },
] as const;
