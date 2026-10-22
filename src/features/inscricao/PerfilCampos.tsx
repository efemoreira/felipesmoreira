"use client";
import React from "react";
import { MUNICIPIOS_CE, FORA_DO_CEARA } from "@/lib/municipios";
import { PARTICIPACAO, normalizarInstituicao, type PerfilParticipacao } from "./perfil";

type Props = { perfil: PerfilParticipacao; aoMudar: (p: PerfilParticipacao) => void };

export function Escolhas({ titulo, opcoes, valores, aoMudar }: { titulo: string; opcoes: Record<string, string>; valores: string[]; aoMudar: (v: string[]) => void }) {
  return <fieldset className="in-escolhas"><legend>{titulo}</legend><div className="in-opcoes">
    {Object.entries(opcoes).map(([id, nome]) => <label key={id} className={`in-opcao${valores.includes(id) ? " selecionada" : ""}`}>
      <input type="checkbox" checked={valores.includes(id)} onChange={() => aoMudar(valores.includes(id) ? valores.filter(v => v !== id) : [...valores, id])} />
      <span>{nome}</span>
    </label>)}
  </div></fieldset>;
}

export function Selecao({ id, titulo, valor, opcoes, aoMudar }: { id: string; titulo: string; valor: string; opcoes: Record<string, string>; aoMudar: (v: string) => void }) {
  return <div className="in-campo"><label htmlFor={id}>{titulo} <span className="in-opcional">opcional</span></label>
    <select id={id} value={valor} onChange={e => aoMudar(e.target.value)}><option value="">Prefiro conversar depois</option>
      {Object.entries(opcoes).map(([k, nome]) => <option key={k} value={k}>{nome}</option>)}
    </select></div>;
}

export function TextoPerfil({ campo, titulo, perfil, aoMudar, dica, longo = false }: Props & { campo: keyof Pick<PerfilParticipacao, "profissao" | "instituicao" | "campus" | "curso" | "habilidades" | "ideia" | "perfilPublico">; titulo: string; dica?: string; longo?: boolean }) {
  const max = longo ? 400 : campo === "perfilPublico" ? 200 : campo === "campus" ? 100 : 120;
  return <div className="in-campo"><label htmlFor={`perfil-${campo}`}>{titulo} <span className="in-opcional">opcional</span></label>
    {longo ? <textarea id={`perfil-${campo}`} value={perfil[campo]} maxLength={max} rows={3} onChange={e => aoMudar({ ...perfil, [campo]: e.target.value })} />
      : <input id={`perfil-${campo}`} value={perfil[campo]} maxLength={max} list={campo === "instituicao" ? "instituicoes-sugeridas" : undefined}
        onBlur={() => { if (campo === "instituicao") aoMudar({ ...perfil, instituicao: normalizarInstituicao(perfil.instituicao) }); }}
        onChange={e => aoMudar({ ...perfil, [campo]: e.target.value })} />}
    {campo === "instituicao" && <datalist id="instituicoes-sugeridas">{Object.keys(PARTICIPACAO.instituicoes).map(nome => <option key={nome} value={nome} />)}</datalist>}
    {dica && <p className="in-dica">{dica}</p>}
  </div>;
}

export function TrabalhoEstudo({ perfil, aoMudar }: Props) {
  return <details className="in-detalhes"><summary>Trabalho e estudo — ajude a mapear pessoas com interesses em comum</summary>
    <p className="in-dica">Tudo aqui é opcional. Essas informações ajudam a planejar grupos temáticos e articulações em instituições de ensino.</p>
    <Selecao id="perfil-situacao" titulo="Hoje, você…" valor={perfil.situacao} opcoes={PARTICIPACAO.situacoes} aoMudar={situacao => aoMudar({ ...perfil, situacao })} />
    <TextoPerfil campo="profissao" titulo="Trabalho ou área de atuação" perfil={perfil} aoMudar={aoMudar} dica="Por exemplo: professora, comércio, enfermagem, tecnologia. Não precisa informar o empregador." />
    <TextoPerfil campo="instituicao" titulo="Instituição onde estuda ou trabalha" perfil={perfil} aoMudar={aoMudar} dica="Por exemplo: UNIFOR, UFC ou IFCE. Use o nome conhecido da instituição." />
    <div className="in-linha-dupla"><TextoPerfil campo="campus" titulo="Campus ou unidade" perfil={perfil} aoMudar={aoMudar} />
      <Selecao id="perfil-cidade-instituicao" titulo="Cidade da instituição" valor={perfil.cidadeInstituicao}
        opcoes={Object.fromEntries([...MUNICIPIOS_CE, FORA_DO_CEARA].map(c => [c, c]))} aoMudar={cidadeInstituicao => aoMudar({ ...perfil, cidadeInstituicao })} /></div>
    <TextoPerfil campo="curso" titulo="Curso ou vínculo com a instituição" perfil={perfil} aoMudar={aoMudar} dica="Por exemplo: estudante de Direito, docente ou técnico administrativo." />
  </details>;
}

export function Interesses({ perfil, aoMudar }: Props) {
  return <div className="in-campos">
    <p className="in-ajuda">Estamos reunindo pessoas para construir os núcleos, grupos e demais frentes. Marque o que desperta seu interesse: isso não é entrada automática numa estrutura nem compromisso de assumir uma função. Pode escolher mais de uma ou decidir depois.</p>
    <Escolhas titulo="Por onde você gostaria de começar?" opcoes={PARTICIPACAO.frentes} valores={perfil.frentes} aoMudar={frentes => aoMudar({ ...perfil, frentes })} />
    <details className="in-detalhes" open={perfil.frentes.includes("temas") || undefined}><summary>Quais assuntos te interessam?</summary>
      <Escolhas titulo="Temas que gostaria de estudar ou trabalhar" opcoes={PARTICIPACAO.temas} valores={perfil.temas} aoMudar={temas => aoMudar({ ...perfil, temas })} />
      <p className="in-dica">Você pode colaborar por estudo, experiência profissional ou ações práticas. Não precisa ser especialista.</p>
    </details>
    <details className="in-detalhes" open={perfil.frentes.includes("cultura") || undefined}><summary>Quais atividades culturais te interessam?</summary>
      <Escolhas titulo="Cultura, convivência e criação" opcoes={PARTICIPACAO.cultura} valores={perfil.cultura} aoMudar={cultura => aoMudar({ ...perfil, cultura })} />
    </details>
    <details className="in-detalhes"><summary>Como você gostaria de contribuir?</summary>
      <Escolhas titulo="Possibilidades de contribuição" opcoes={PARTICIPACAO.contribuicoes} valores={perfil.contribuicoes} aoMudar={contribuicoes => aoMudar({ ...perfil, contribuicoes })} />
      <TextoPerfil campo="habilidades" titulo="Habilidades e experiências que quer compartilhar" perfil={perfil} aoMudar={aoMudar} longo dica="Também vale dizer o que você quer aprender." />
    </details>
    {perfil.frentes.includes("liga") && <TextoPerfil campo="perfilPublico" titulo="Seu perfil ou canal, se quiser compartilhar" perfil={perfil} aoMudar={aoMudar} dica="Pode começar do zero. O interesse na Liga será conversado com a coordenação; o perfil não será publicado por este cadastro." />}
    <details className="in-detalhes"><summary>Tempo e forma de participar</summary>
      <Selecao id="perfil-disponibilidade" titulo="Quanto tempo cabe na sua rotina?" valor={perfil.disponibilidade} opcoes={PARTICIPACAO.disponibilidades} aoMudar={disponibilidade => aoMudar({ ...perfil, disponibilidade })} />
      <Selecao id="perfil-modalidade" titulo="Como prefere participar?" valor={perfil.modalidade} opcoes={PARTICIPACAO.modalidades} aoMudar={modalidade => aoMudar({ ...perfil, modalidade })} />
      <Escolhas titulo="Quais períodos costumam funcionar?" opcoes={PARTICIPACAO.periodos} valores={perfil.periodos} aoMudar={periodos => aoMudar({ ...perfil, periodos })} />
    </details>
    <TextoPerfil campo="ideia" titulo="Tem alguma ideia ou algo que não apareceu nas opções?" perfil={perfil} aoMudar={aoMudar} longo />
  </div>;
}
