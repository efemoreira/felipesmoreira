"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Funcao } from "./tipos";
import { GRUPO_GERAL, linkOiCoordenacao } from "@/lib/contato";
import { compartilharTexto } from "@/lib/compartilhar";
import { slugDe, SITE, CHAVE_NOME } from "@/lib/atribuicao";
import { css } from "./estilos";

/**
 * A tela depois do envio.
 *
 * Antes ela listava três passos que eram todos **ação de outra pessoa** ("a
 * coordenação vai olhar", "costuma levar alguns dias") e terminava em espera. É
 * o pior momento possível para não ter o que fazer: quem acabou de se inscrever
 * está no pico de entusiasmo que vai ter, e se a aprovação demora três dias,
 * esse pico passa sem virar nada.
 *
 * Agora o que vem primeiro é o que **não depende de aprovação nenhuma** — e o
 * que a coordenação faz do lado dela vem depois, como informação, não como
 * instrução de esperar.
 */
export const Sucesso: React.FC<{ nome: string; cidade: string; escolhidas: Funcao[] }> = ({ nome, cidade, escolhidas }) => {
  const primeiro = nome.trim().split(" ")[0] || "companheiro";
  const [convite, setConvite] = useState("Mandar o convite");

  /* A pessoa acabou de digitar o nome dela no formulário: o crédito sai daqui
     sem pedir nada de novo. E fica guardado para o mutirão não perguntar de
     novo depois — era o mesmo nome, digitado duas vezes, em duas páginas. */
  const slug = slugDe(nome);
  useEffect(() => {
    if (slug === "") return;
    try { localStorage.setItem(CHAVE_NOME, nome.trim()); } catch { /* aba anônima */ }
  }, [nome, slug]);

  const convidar = async () => {
    const url = `${SITE}/queroajudar${slug === "" ? "" : `?de=${slug}`}`;
    const texto =
      "Entrei na militância da Missão no Ceará. É gente organizada de verdade, " +
      "com plano de governo escrito e função pra cada um. Dá uma olhada:";
    const r = await compartilharTexto(texto, url);
    if (r === "copiou") setConvite("Link copiado!");
    else if (r === "falhou") setConvite("Não deu — copie o link da barra");
    if (r === "copiou" || r === "falhou") {
      window.setTimeout(() => setConvite("Mandar o convite"), 4000);
    }
  };

  return (
    <div className="in-fundo">
      <main className="in-main in-sucesso">
        <span className="in-sucesso-selo" aria-hidden="true">
          <Icon name="flag" size={40} />
        </span>
        <h1 className="in-titulo">Chegou, {primeiro}!</h1>
        <p className="in-linha">
          {escolhidas.length > 0 ? (
            <>
              Sua inscrição para{" "}
              <strong>{escolhidas.map((f) => f.nome).join(" e ")}</strong> está com a
              coordenação. Enquanto ela confere, tem quatro coisas que você já pode fazer.
            </>
          ) : (
            <>
              Sua inscrição está com a coordenação. Enquanto ela confere, tem cinco coisas
              que você já pode fazer.
            </>
          )}
        </p>

        <p className="in-agora-titulo">Agora, sem esperar ninguém</p>
        <ol className="in-proximos">
          {/* O "oi" vem antes do grupo de propósito: é o único passo que acelera
              a APROVAÇÃO dela, e é o que impede o número da coordenação de cair.
              Quem manda a primeira mensagem abre a conversa; a coordenação
              responde dentro dela em vez de abordar dezenas de desconhecidos —
              que é o que o WhatsApp pune com bloqueio. */}
          <li>
            <b>1</b>
            <span>
              <strong>Manda um oi pra coordenação.</strong> É o que faz sua aprovação
              andar: com a conversa aberta, dá pra te responder na hora. A mensagem
              já vai escrita.
              <a
                className="in-passo-link"
                href={linkOiCoordenacao(nome, cidade)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={15} />
                Mandar o oi agora
              </a>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              <strong>Entre no grupo.</strong> É onde sai a convocação da semana e o aviso de
              cada encontro. Entrada direta, sem esperar ninguém aprovar nada.
              <a
                className="in-passo-link"
                href={GRUPO_GERAL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" size={15} />
                Entrar no grupo agora
              </a>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              <strong>Leia o plano.</strong> São sete compromissos com meta, prazo e de onde vem o
              dinheiro. Quem conhece o plano consegue defender o movimento em qualquer conversa.
              <Link className="in-passo-link" href="/propostas">
                <Icon name="book" size={15} />
                Ver as propostas
              </Link>
            </span>
          </li>
          <li>
            <b>4</b>
            <span>
              <strong>Comece a espalhar.</strong> Na Munição tem arte e texto prontos, cada um com a
              página do plano. Põe seu nome lá e a coordenação vê quem você trouxe.
              <Link className="in-passo-link" href="/municao">
                <Icon name="broadcast" size={15} />
                Abrir a Munição
              </Link>
            </span>
          </li>
          <li>
            <b>5</b>
            <span>
              <strong>Chame mais gente.</strong> Manda o link pra quem você sabe que ia
              querer estar junto. Ele já vai com o seu nome — a coordenação vê quem
              trouxe cada pessoa.
              <button type="button" className="in-passo-link" onClick={convidar}>
                <Icon name="whatsapp" size={15} />
                {convite}
              </button>
            </span>
          </li>
        </ol>

        <p className="in-agora-titulo">O que a coordenação faz do lado dela</p>
        <p className="in-aviso" style={{ margin: "10px 0 0" }}>
          Confere sua inscrição e te <strong>responde no WhatsApp</strong> com o usuário e uma
          senha provisória para entrar na área da militância, onde ficam a formação e as
          ferramentas. No primeiro acesso você troca a senha. É por isso que o passo 1 é
          você mandar o oi: a resposta chega na conversa que você abriu. Se passar de alguns
          dias, chama de novo sem cerimônia — não é incômodo.
        </p>

        <div className="in-acoes">
          <a
            className="in-btn in-btn-principal"
            href={GRUPO_GERAL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="whatsapp" size={18} />
            <span>Entrar no grupo</span>
          </a>
          <Link className="in-btn in-btn-fantasma" href="/">
            <Icon name="arrowLeft" size={18} />
            <span>Voltar pro site</span>
          </Link>
        </div>
      </main>
      <style>{css}</style>
    </div>
  );
};
