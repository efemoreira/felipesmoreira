"use client";
import React from "react";
import { Casca, Voltar, textoP, botaoOuro, HeroDoEncontro, Painel } from "./Pecas";

/**
 * AS TELAS CURTAS de `/presenca`: o link quebrado e o "pronto".
 *
 * Não são passos do formulário — são desfechos, e por isso não moram no fluxo.
 * "Pronto" é o momento mais valioso da tela inteira: a pessoa apareceu num
 * encontro por vontade própria, e é o melhor momento que vai existir para
 * convidá-la a fazer parte. Daí o cartão de "quero ajudar" só aparecer para
 * quem ainda não é do movimento.
 */

/** O link do QR não vale mais, ou veio incompleto. */
export const SemEncontro: React.FC = () => (
  <Casca titulo="Link sem encontro">
    <p style={textoP}>
      Esse link de presença não vale mais, ou está incompleto. Chame alguém da
      recepção — dá para cadastrar você na hora.
    </p>
    <Voltar />
  </Casca>
);

/**
 * O desfecho: o nome entrou na lista.
 *
 * O texto muda com o MODO, e não é detalhe: "presença confirmada" (você disse
 * que vem) e "check-in feito" (você chegou) são coisas diferentes, e é aqui que
 * a pessoa descobre qual das duas ela acabou de fazer. O desfecho repete a
 * palavra do botão de propósito — quem não tem certeza do que apertou volta e
 * aperta de novo.
 *
 * `aoQuererAjudar` leva para `/queroajudar` com os dados já preenchidos — por
 * `sessionStorage` e NUNCA pela URL: telefone em querystring entra no
 * histórico, no referrer e no log do servidor.
 */
export const Pronto: React.FC<{
  confirmando: boolean;
  reconhecido: string;
  jaEstava: boolean;
  ofereceAjudar: boolean;
  aoQuererAjudar: () => void;
  detalhes?: {
    titulo: string;
    subtitulo?: string;
    data: string;
    hora: string;
    local: string;
    imagem?: string;
    filtro?: string;
  } | null;
}> = ({ confirmando, reconhecido, jaEstava, ofereceAjudar, aoQuererAjudar, detalhes }) => (
  <Casca
    titulo={
      reconhecido
        ? `${confirmando ? "Presença confirmada" : "Check-in feito"}, ${reconhecido}!`
        : jaEstava
          ? "Você já estava na lista"
          : confirmando
            ? "Presença confirmada!"
            : "Check-in feito!"
    }
  >
    {detalhes ? (
      <HeroDoEncontro
        titulo={detalhes.titulo}
        subtitulo={detalhes.subtitulo}
        data={detalhes.data}
        hora={detalhes.hora}
        local={detalhes.local}
        imagem={detalhes.imagem}
        filtro={detalhes.filtro}
        confirmando={confirmando}
      />
    ) : null}

    <Painel>
      <p style={{ ...textoP, margin: 0, maxWidth: "none" }}>
        {confirmando ? (
          <>
            Anotamos que <strong>você pretende ir</strong>. Se mudar de ideia, tudo
            bem — é só não aparecer. <strong>No dia, faça o check-in no QR da
            entrada</strong>: é ele que registra que você esteve lá.
          </>
        ) : jaEstava ? (
          "Seu check-in já estava feito. Pode guardar o celular e aproveitar o encontro."
        ) : (
          "Check-in feito: você está na lista de presença. Obrigado por estar com a gente."
        )}
      </p>
    </Painel>

    {/* A pessoa apareceu num encontro por vontade própria e ainda não é do
        movimento: é o melhor momento que vai existir para perguntar. Os
        dados vão por sessionStorage e NUNCA pela URL — telefone em
        querystring entra no histórico, no referrer e no log do servidor. */}
    {ofereceAjudar && (
      <Painel>
        <p style={{ margin: "0 0 12px", fontSize: 15.5, lineHeight: 1.65 }}>
          <strong>Quer ajudar de verdade?</strong> Tem função para quem tem uma hora
          por semana e para quem tem o dia. Seus dados já vão preenchidos — é só
          escolher como quer ajudar.
        </p>
        <button type="button" onClick={aoQuererAjudar} style={botaoOuro}>
          Quero ajudar
        </button>
      </Painel>
    )}

    <Voltar />
  </Casca>
);
