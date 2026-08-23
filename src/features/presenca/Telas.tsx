"use client";
import React from "react";
import { C, borda } from "@/lib/theme";
import { Casca, Voltar, textoP, botaoOuro } from "./Pecas";

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
 * O texto muda com o MODO, e não é detalhe: "combinado" (você disse que vem) e
 * "bem-vindo" (você chegou) são coisas diferentes, e é aqui que a pessoa
 * descobre qual das duas ela acabou de fazer.
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
}> = ({ confirmando, reconhecido, jaEstava, ofereceAjudar, aoQuererAjudar }) => (
  <Casca
    titulo={
      reconhecido
        ? `${confirmando ? "Combinado" : "Bem-vindo"}, ${reconhecido}!`
        : jaEstava
          ? "Você já estava na lista"
          : "Pronto!"
    }
  >
    <p style={textoP}>
      {confirmando ? (
        <>
          Anotamos que <strong>você pretende ir</strong>. Se mudar de ideia, tudo
          bem — é só não aparecer. <strong>No dia, procure o QR na entrada</strong>:
          é ele que registra que você esteve lá.
        </>
      ) : jaEstava ? (
        "Seu nome já estava na lista de presença. Pode guardar o celular e aproveitar o encontro."
      ) : (
        "Você está na lista de presença. Obrigado por estar com a gente."
      )}
    </p>

    {/* A pessoa apareceu num encontro por vontade própria e ainda não é do
        movimento: é o melhor momento que vai existir para perguntar. Os
        dados vão por sessionStorage e NUNCA pela URL — telefone em
        querystring entra no histórico, no referrer e no log do servidor. */}
    {ofereceAjudar && (
      <section
        style={{
          border: borda(C.gold),
          background: "rgba(255,203,5,.08)",
          padding: "18px 18px 20px",
          margin: "0 auto 22px",
          maxWidth: 420,
          textAlign: "left",
        }}
      >
        <p style={{ margin: "0 0 12px", fontSize: 15.5, lineHeight: 1.65 }}>
          <strong>Quer ajudar de verdade?</strong> Tem função para quem tem uma hora
          por semana e para quem tem o dia. Seus dados já vão preenchidos — é só
          escolher como quer ajudar.
        </p>
        <button type="button" onClick={aoQuererAjudar} style={botaoOuro}>
          Quero ajudar
        </button>
      </section>
    )}

    <Voltar />
  </Casca>
);
