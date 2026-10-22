"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { linkOiCoordenacao } from "@/lib/contato";
import { PARTICIPACAO, nomesSelecionados, type PerfilParticipacao } from "./perfil";
import { css } from "./estilos";

export function Sucesso({ nome, cidade, perfil }: { nome: string; cidade: string; perfil: PerfilParticipacao }) {
  const interesses = nomesSelecionados(PARTICIPACAO.frentes, perfil.frentes);
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  return <div className="in-fundo"><div className="in-main in-sucesso">
    <span className="in-sucesso-selo" aria-hidden="true"><Icon name="check" size={40} /></span>
    <h1 className="in-titulo" ref={titulo} tabIndex={-1}>Cadastro recebido, {nome.trim().split(" ")[0]}!</h1>
    <p className="in-linha">Seu contato e suas informações estão com a coordenação. Estamos reunindo pessoas{cidade ? ` em ${cidade}` : ""} para planejar os primeiros núcleos, grupos e atividades.</p>
    {interesses && <p className="in-aviso"><strong>Você demonstrou interesse em:</strong> {interesses}.</p>}
    {perfil.instituicao && <p className="in-aviso">Seu vínculo com <strong>{perfil.instituicao}</strong>{perfil.campus ? `, ${perfil.campus}` : ""} também foi registrado para ajudar a mapear uma possível articulação.</p>}
    <div className="in-resumo in-proximo-passo">
      <h2 className="in-resumo-titulo">O próximo passo é uma conversa</h2>
      <p>A meta da coordenação é acolher quem chega em até <strong>72 horas</strong>. Vamos conversar sobre seus interesses e sua disponibilidade, e combinar uma primeira forma de participar. Seu cadastro não significa que um núcleo ou grupo já esteja funcionando.</p>
      <a className="in-btn in-btn-principal" href={linkOiCoordenacao(nome, cidade)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={18} />Abrir conversa com a coordenação</a>
      <p className="in-dica">Seu cadastro já foi enviado. A mensagem no WhatsApp é opcional e ajuda a iniciar a conversa; você não precisa preencher tudo de novo.</p>
    </div>
    <p className="in-agora-titulo">Enquanto isso, conheça o que estamos construindo</p>
    <div className="in-acoes"><Link className="in-btn in-btn-fantasma" href="/plano">Ler o plano de organização</Link><Link className="in-btn in-btn-fantasma" href="/programacao">Consultar a agenda</Link></div>
    <p className="in-aviso">A formação, as funções e o acesso à área interna serão combinados com a coordenação. Se passar de 72 horas sem retorno, pode chamar pelo mesmo WhatsApp.</p>
  </div><style>{css}</style></div>;
}
